import os
from pydantic_settings import BaseSettings
from typing import Dict, Any


class Settings(BaseSettings):
    PROJECT_NAME: str = "Explainable Real-Time Fraud Shield Engine"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fraud_shield_super_secure_jwt_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./fraud_shield.db")

    # Risk Weights (Default configurable weights)
    WEIGHT_RULE: float = 0.25
    WEIGHT_ML: float = 0.30
    WEIGHT_ENTITY: float = 0.20
    WEIGHT_VOICE: float = 0.15
    WEIGHT_NETWORK: float = 0.10

    # Risk Thresholds
    THRESHOLD_LOW: float = 30.0
    THRESHOLD_MEDIUM: float = 60.0
    THRESHOLD_HIGH: float = 80.0

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
