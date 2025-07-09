"""
Google Cloud Platform specific configuration
"""
import os
from config import Settings


class GCPSettings(Settings):
    """Google Cloud Platform specific settings"""
    
    # Cloud SQL settings
    database_url: str = "postgresql://username:password@/transcribe_db?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_ID"
    
    # Cloud Storage settings
    storage_bucket: str = "transcribe-app-uploads"
    
    # Cloud Tasks settings
    task_queue_name: str = "transcription-queue"
    task_location: str = "us-central1"
    
    # Cloud Functions settings
    function_url: str = "https://us-central1-PROJECT_ID.cloudfunctions.net/transcribe_audio_function"
    
    # Memorystore Redis settings  
    redis_url: str = "redis://REDIS_IP:6379/0"
    
    # Secret Manager settings
    use_secret_manager: bool = True
    
    class Config:
        env_file = ".env.gcp"


def get_gcp_settings() -> GCPSettings:
    """Get GCP-specific settings"""
    return GCPSettings()