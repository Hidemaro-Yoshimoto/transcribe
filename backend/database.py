"""
Database configuration and management
"""
from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager
from typing import Generator

from config import settings
from utils.logger import db_logger


class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.engine = create_engine(
            settings.database_url,
            echo=settings.database_echo,
            # PostgreSQL specific settings
            pool_pre_ping=True,
            pool_recycle=300,
        )
        db_logger.info(f"Database initialized: {settings.database_url}")
    
    def init_db(self) -> None:
        """Initialize database tables"""
        try:
            SQLModel.metadata.create_all(self.engine)
            db_logger.info("Database tables created successfully")
        except Exception as e:
            db_logger.error(f"Failed to create database tables: {e}")
            raise
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """Get database session with automatic cleanup"""
        session = Session(self.engine)
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            db_logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    def get_session_sync(self) -> Session:
        """Get database session (non-context manager)"""
        return Session(self.engine)


# Global database manager
db_manager = DatabaseManager()

# Convenience functions
def init_db() -> None:
    """Initialize database"""
    db_manager.init_db()

def get_session() -> Session:
    """Get database session"""
    return db_manager.get_session_sync()

@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Get database session with context manager"""
    with db_manager.get_session() as session:
        yield session