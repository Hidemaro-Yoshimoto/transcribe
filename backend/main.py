"""
FastAPI メインアプリケーション
"""
import os
import uuid
import tempfile
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from models import init_db, get_session, TranscriptionRecord, TaskStatus
from tasks import transcribe_audio_task, celery_app

# FastAPIアプリケーション初期化
app = FastAPI(title="Transcribe App API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース初期化
@app.on_event("startup")
async def startup_event():
    init_db()

# レスポンスモデル
class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: Optional[int] = None
    message: Optional[str] = None
    transcription: Optional[str] = None
    duration: Optional[float] = None
    record_id: Optional[int] = None
    error: Optional[str] = None

class HistoryResponse(BaseModel):
    id: int
    original_filename: str
    transcription_text: str
    created_at: datetime
    completed_at: Optional[datetime]
    status: str
    duration: Optional[float]
    file_size: int

class UploadResponse(BaseModel):
    task_id: str
    message: str


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {"message": "Transcribe App API"}


@app.post("/upload", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """
    音声ファイルアップロード
    
    Args:
        file: アップロードファイル
        
    Returns:
        UploadResponse: タスクID
    """
    # ファイル形式チェック
    allowed_extensions = {'.mp3', '.wav', '.m4a', '.mp4', '.avi', '.mov', '.mkv'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Supported formats: mp3, wav, m4a, mp4, avi, mov, mkv"
        )
    
    # ファイルサイズチェック (400MB制限)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > 400 * 1024 * 1024:  # 400MB
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 400MB"
        )
    
    # 一時ファイルに保存
    task_id = str(uuid.uuid4())
    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=file_extension,
        prefix=f"upload_{task_id}_"
    )
    
    try:
        temp_file.write(content)
        temp_file.flush()
        
        # Celeryタスクを開始
        transcribe_audio_task.delay(
            temp_file.name,
            task_id,
            file.filename,
            file_size
        )
        
        return UploadResponse(
            task_id=task_id,
            message="File uploaded successfully. Processing started."
        )
        
    except Exception as e:
        # エラー時は一時ファイルを削除
        try:
            os.unlink(temp_file.name)
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        temp_file.close()


@app.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    タスクステータス取得
    
    Args:
        task_id: タスクID
        
    Returns:
        TaskStatusResponse: タスクステータス
    """
    # データベースからレコード取得
    session = get_session()
    try:
        record = session.query(TranscriptionRecord)\
            .filter(TranscriptionRecord.task_id == task_id)\
            .first()
        
        if not record:
            # Celeryタスクステータス取得
            task = celery_app.AsyncResult(task_id)
            
            if task.state == 'PENDING':
                return TaskStatusResponse(
                    task_id=task_id,
                    status='pending',
                    message='Task is waiting to be processed'
                )
            else:
                return TaskStatusResponse(
                    task_id=task_id,
                    status='failed',
                    error='Task not found',
                    message='Task not found'
                )
        
        # データベースレコードのステータスを確認
        if record.status == TaskStatus.COMPLETED:
            return TaskStatusResponse(
                task_id=task_id,
                status='completed',
                transcription=record.transcription_text,
                duration=record.duration,
                record_id=record.id,
                message='Transcription completed successfully'
            )
        elif record.status == TaskStatus.FAILED:
            return TaskStatusResponse(
                task_id=task_id,
                status='failed',
                error=record.error_message,
                message='Transcription failed'
            )
        else:
            # 進行中の場合、Celeryタスクの進捗を取得
            task = celery_app.AsyncResult(task_id)
            progress = 0
            message = 'Processing'
            
            if task.state == 'PROCESSING' and task.info:
                progress = task.info.get('progress', 0)
                message = task.info.get('status', 'Processing')
            
            return TaskStatusResponse(
                task_id=task_id,
                status='processing',
                progress=progress,
                message=message
            )
    
    finally:
        session.close()


@app.get("/history", response_model=List[HistoryResponse])
async def get_history(limit: int = 100):
    """
    文字起こし履歴取得
    
    Args:
        limit: 取得件数制限
        
    Returns:
        List[HistoryResponse]: 履歴リスト
    """
    session = get_session()
    try:
        records = session.query(TranscriptionRecord)\
            .order_by(TranscriptionRecord.created_at.desc())\
            .limit(limit)\
            .all()
        
        return [
            HistoryResponse(
                id=record.id,
                original_filename=record.original_filename,
                transcription_text=record.transcription_text,
                created_at=record.created_at,
                completed_at=record.completed_at,
                status=record.status.value,
                duration=record.duration,
                file_size=record.file_size
            )
            for record in records
        ]
    finally:
        session.close()


@app.get("/download/{record_id}")
async def download_transcription(record_id: int):
    """
    文字起こし結果のテキストファイルダウンロード
    
    Args:
        record_id: レコードID
        
    Returns:
        FileResponse: テキストファイル
    """
    session = get_session()
    try:
        record = session.query(TranscriptionRecord)\
            .filter(TranscriptionRecord.id == record_id)\
            .first()
        
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        if record.status != TaskStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Transcription not completed")
        
        # 一時ファイルに書き込み
        temp_file = tempfile.NamedTemporaryFile(
            mode='w',
            delete=False,
            suffix='.txt',
            encoding='utf-8'
        )
        
        try:
            temp_file.write(record.transcription_text)
            temp_file.flush()
            
            filename = f"{os.path.splitext(record.original_filename)[0]}_transcription.txt"
            
            return FileResponse(
                temp_file.name,
                media_type='text/plain',
                filename=filename,
                background=BackgroundTasks()
            )
        finally:
            temp_file.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)