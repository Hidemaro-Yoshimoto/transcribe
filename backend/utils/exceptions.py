"""
Custom exceptions for the application
"""


class TranscribeAppException(Exception):
    """Base exception for the application"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class FileProcessingError(TranscribeAppException):
    """Exception raised when file processing fails"""
    def __init__(self, message: str = "File processing failed"):
        super().__init__(message, status_code=422)


class FileSizeError(TranscribeAppException):
    """Exception raised when file size exceeds limit"""
    def __init__(self, message: str = "File size exceeds maximum allowed"):
        super().__init__(message, status_code=413)


class UnsupportedFileTypeError(TranscribeAppException):
    """Exception raised when file type is not supported"""
    def __init__(self, message: str = "Unsupported file type"):
        super().__init__(message, status_code=415)


class OpenAIAPIError(TranscribeAppException):
    """Exception raised when OpenAI API fails"""
    def __init__(self, message: str = "OpenAI API error", status_code: int = 502):
        super().__init__(message, status_code)


class QuotaExceededError(OpenAIAPIError):
    """Exception raised when OpenAI API quota is exceeded"""
    def __init__(self, message: str = "OpenAI API quota exceeded"):
        super().__init__(message, status_code=402)


class RateLimitError(OpenAIAPIError):
    """Exception raised when OpenAI API rate limit is hit"""
    def __init__(self, message: str = "OpenAI API rate limit exceeded"):
        super().__init__(message, status_code=429)


class TaskNotFoundError(TranscribeAppException):
    """Exception raised when task is not found"""
    def __init__(self, message: str = "Task not found"):
        super().__init__(message, status_code=404)


class DatabaseError(TranscribeAppException):
    """Exception raised for database operations"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status_code=500)