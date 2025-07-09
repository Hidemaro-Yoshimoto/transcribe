"""
SQLModel モデル定義
"""
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, create_engine, Session
from enum import Enum


class TaskStatus(str, Enum):
    """タスクステータス"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TranscriptionRecord(SQLModel, table=True):
    """文字起こし履歴テーブル"""
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str = Field(index=True)
    original_filename: str
    transcription_text: str
    task_id: str = Field(index=True)
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    file_size: int  # bytes
    duration: Optional[float] = None  # seconds


# データベース設定
DATABASE_URL = "sqlite:///./transcriptions.db"
engine = create_engine(DATABASE_URL)


def init_db() -> None:
    """データベース初期化"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """データベースセッション取得"""
    return Session(engine)