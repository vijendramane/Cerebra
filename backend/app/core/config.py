from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Keys (Free Tier)
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    
    # Database
    DATABASE_URL: str = "postgresql://mlresearch:mlresearch123@localhost/mlresearch"
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Application
    APP_NAME: str = "ML Research Agent Platform"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()