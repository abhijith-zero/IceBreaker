from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    
    google_cloud_project: str
    google_cloud_region: str = "us-central1"
    vertex_ai_location: str = "us-central1"

    gemini_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"

    firestore_collection_sessions: str = "sessions"
    firestore_collection_users: str = "users"

    backend_port: int = 8080
    allowed_origins: str = "http://localhost:3000"
    environment: str = "development"
    gemini_api_key: str = ""

    # LM Studio (local OpenAI-compatible server)
    lm_studio_url: str = "http://host.docker.internal:1234/v1"
    lm_studio_model: str = "google/gemma-3-4b"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
