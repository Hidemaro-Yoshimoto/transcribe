"""
Google Cloud Functions for background processing
"""
import functions_framework
from google.cloud import tasks_v2
from google.cloud import secretmanager
import json
import os
from typing import Dict, Any

from openai import OpenAI
from services.audio import AudioProcessor
from database import get_db_session
from models import TranscriptionRecord, TaskStatus
from utils.logger import celery_logger


def get_secret(secret_name: str) -> str:
    """Get secret from Secret Manager"""
    client = secretmanager.SecretManagerServiceClient()
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")


@functions_framework.http
def transcribe_audio_function(request):
    """
    Cloud Function for audio transcription
    """
    try:
        # Parse request data
        request_json = request.get_json()
        file_path = request_json.get('file_path')
        task_id = request_json.get('task_id')
        original_filename = request_json.get('original_filename')
        file_size = request_json.get('file_size')
        
        # Initialize OpenAI client
        openai_api_key = get_secret('openai-api-key')
        openai_client = OpenAI(api_key=openai_api_key)
        
        # Process audio
        audio_processor = AudioProcessor()
        
        with get_db_session() as session:
            # Update record status
            record = session.query(TranscriptionRecord).filter(
                TranscriptionRecord.task_id == task_id
            ).first()
            
            if not record:
                return {'error': 'Task not found'}, 404
            
            record.status = TaskStatus.PROCESSING
            session.commit()
            
            # Process audio file
            segments, total_duration = audio_processor.process_audio_file(file_path)
            
            if not segments:
                record.status = TaskStatus.FAILED
                record.error_message = "Audio processing failed"
                session.commit()
                return {'error': 'Audio processing failed'}, 500
            
            # Transcribe segments
            transcriptions = []
            for segment_path in segments:
                with open(segment_path, 'rb') as audio_file:
                    transcript = openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                    transcriptions.append(transcript)
            
            # Update record with results
            full_transcription = "\n".join(transcriptions)
            record.transcription_text = full_transcription
            record.status = TaskStatus.COMPLETED
            record.duration = total_duration
            session.commit()
            
            # Cleanup
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
        celery_logger.error(f"Transcription function error: {e}")
        return {'error': str(e)}, 500


def create_transcription_task(file_path: str, task_id: str, original_filename: str, file_size: int):
    """
    Create a Cloud Task for transcription
    """
    client = tasks_v2.CloudTasksClient()
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    location = os.environ.get('GOOGLE_CLOUD_REGION', 'us-central1')
    queue = 'transcription-queue'
    
    parent = client.queue_path(project_id, location, queue)
    
    # Create task
    task = {
        'http_request': {
            'http_method': tasks_v2.HttpMethod.POST,
            'url': f'https://{location}-{project_id}.cloudfunctions.net/transcribe_audio_function',
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'file_path': file_path,
                'task_id': task_id,
                'original_filename': original_filename,
                'file_size': file_size
            }).encode()
        }
    }
    
    response = client.create_task(request={'parent': parent, 'task': task})
    return response.name