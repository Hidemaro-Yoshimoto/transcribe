"""
Celery タスク定義
"""
import os
from celery import Celery
from openai import OpenAI
from typing import List
from models import get_session, TranscriptionRecord, TaskStatus
from services.audio import AudioProcessor
from datetime import datetime

# Celery設定
celery_app = Celery(
    'transcribe_tasks',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/0'
)

# OpenAI クライアント初期化は関数内で行う
def get_openai_client():
    """OpenAI クライアントを取得"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)


@celery_app.task(bind=True)
def transcribe_audio_task(self, file_path: str, task_id: str, original_filename: str, file_size: int) -> dict:
    """
    音声文字起こしタスク
    
    Args:
        file_path: 音声ファイルパス
        task_id: タスクID
        original_filename: 元のファイル名
        file_size: ファイルサイズ
        
    Returns:
        dict: タスク結果
    """
    session = get_session()
    audio_processor = AudioProcessor()
    
    try:
        # データベースレコード作成
        record = TranscriptionRecord(
            filename=os.path.basename(file_path),
            original_filename=original_filename,
            transcription_text="",
            task_id=task_id,
            status=TaskStatus.PROCESSING,
            file_size=file_size
        )
        session.add(record)
        session.commit()
        
        # 音声ファイル処理
        self.update_state(state='PROCESSING', meta={'status': 'Processing audio file'})
        segments, total_duration = audio_processor.process_audio_file(file_path)
        
        if not segments:
            raise Exception("Audio processing failed")
        
        record.duration = total_duration
        session.commit()
        
        # 各セグメントを文字起こし
        transcriptions = []
        total_segments = len(segments)
        
        for i, segment_path in enumerate(segments):
            self.update_state(
                state='PROCESSING', 
                meta={
                    'status': f'Transcribing segment {i+1}/{total_segments}',
                    'progress': int((i / total_segments) * 100)
                }
            )
            
            try:
                openai_client = get_openai_client()
                with open(segment_path, 'rb') as audio_file:
                    transcript = openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                    transcriptions.append(transcript)
            except Exception as e:
                if "insufficient_quota" in str(e):
                    raise Exception("OpenAI API quota exceeded")
                elif "rate_limit_exceeded" in str(e):
                    raise Exception("OpenAI API rate limit exceeded")
                else:
                    raise Exception(f"OpenAI API error: {str(e)}")
        
        # 結果を結合
        full_transcription = "\n".join(transcriptions)
        
        # データベース更新
        record.transcription_text = full_transcription
        record.status = TaskStatus.COMPLETED
        record.completed_at = datetime.now()
        session.commit()
        
        # クリーンアップ
        audio_processor.cleanup()
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {
            'status': 'completed',
            'transcription': full_transcription,
            'duration': total_duration,
            'record_id': record.id
        }
        
    except Exception as e:
        # エラー時の処理
        error_msg = str(e)
        if record:
            record.status = TaskStatus.FAILED
            record.error_message = error_msg
            session.commit()
        
        audio_processor.cleanup()
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {
            'status': 'failed',
            'error': error_msg
        }
    
    finally:
        session.close()


@celery_app.task
def cleanup_old_files() -> None:
    """古いファイルのクリーンアップタスク"""
    import glob
    import time
    
    temp_files = glob.glob('/tmp/upload_*')
    current_time = time.time()
    
    for file_path in temp_files:
        if current_time - os.path.getmtime(file_path) > 3600:  # 1時間
            try:
                os.remove(file_path)
            except OSError:
                pass