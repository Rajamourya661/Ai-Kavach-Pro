"""
KAVACH AI Pro - Enterprise Configuration
Free & Open Source Stack
"""

import os
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App Info
    APP_NAME: str = "KAVACH AI Pro"
    VERSION: str = "3.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Security
    SECRET_KEY: str = Field(default="change-this-in-production-min-32-chars-long")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database — PostgreSQL or SQLite fallback
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./kavach.db")

    # Redis (Free - for caching, rate limiting, queues)
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # File Storage (Local - Free, or MinIO for S3-compatible)
    STORAGE_TYPE: str = "local"  # local, minio, s3
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB

    # AI Model Paths (Download free pretrained models)
    MODEL_CACHE_DIR: str = "models/pretrained"
    DEEPFAKE_MODEL: str = "deepfake_efficientnet.pth"
    VOICE_MODEL: str = "voice_antispoofing.pkl"
    PHISHING_MODEL: str = "phishing_xgb.pkl"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    # Email (Free: Mailgun sandbox, SendGrid free tier, or SMTP)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Monitoring (Free: Prometheus + Grafana)
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json, text

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
