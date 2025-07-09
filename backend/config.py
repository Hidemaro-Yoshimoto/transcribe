"""
Application configuration management
"""
import os
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # App settings
    app_name: str = "Transcribe App API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    
    # Database settings
    database_url: str = "sqlite:///./transcriptions.db"
    database_echo: bool = False
    
    # Redis settings
    redis_url: str = "redis://redis:6379/0"
    
    # OpenAI settings
    openai_api_key: str
    openai_model: str = "whisper-1"
    
    # File upload settings
    max_file_size: int = 400 * 1024 * 1024  # 400MB
    allowed_extensions: set = {".mp3", ".wav", ".m4a", ".mp4", ".avi", ".mov", ".mkv"}
    upload_dir: str = "/tmp"
    
    # Audio processing settings
    max_audio_duration: int = 30 * 60  # 30 minutes
    
    # Security settings
    allowed_origins: list = ["http://localhost:3000", "http://frontend:3000"]
    
    # Logging settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Celery settings
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


class ProductionSettings(Settings):
    """Production-specific settings"""
    debug: bool = False
    database_echo: bool = False
    log_level: str = "WARNING"
    
    # Production database (PostgreSQL)
    database_url: str = "postgresql://user:password@localhost/transcribe_db"
    
    # Production Redis
    redis_url: str = "redis://redis-prod:6379/0"
    celery_broker_url: str = "redis://redis-prod:6379/0"
    celery_result_backend: str = "redis://redis-prod:6379/0"


class DevelopmentSettings(Settings):
    """Development-specific settings"""
    debug: bool = True
    database_echo: bool = True
    log_level: str = "DEBUG"


class TestingSettings(Settings):
    """Testing-specific settings"""
    debug: bool = True
    database_url: str = "sqlite:///./test_transcriptions.db"
    redis_url: str = "redis://localhost:6379/1"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/1"


@lru_cache()
def get_settings() -> Settings:
    """Get application settings based on environment"""
    environment = os.getenv("ENVIRONMENT", "development").lower()
    
    if environment == "production":
        return ProductionSettings()
    elif environment == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()


# Global settings instance
settings = get_settings()