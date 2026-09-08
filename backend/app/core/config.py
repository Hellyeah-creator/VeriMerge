import os
from typing import Dict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VeriMerge"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./verimerge.db")
    
    # AI configuration (OpenAI-compatible)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Zero-Trust Reconciliation Thresholds
    AUTO_RESOLVE_THRESHOLD: float = 90.0
    HUMAN_REVIEW_THRESHOLD: float = 70.0  # [70.0, 90.0) -> Human Review, < 70.0 -> Blocked
    
    # Entity Resolution Threshold
    ENTITY_MATCH_THRESHOLD: float = 78.0
    
    # Source Authority Default Weights (configurable via API)
    DEFAULT_SOURCE_AUTHORITIES: Dict[str, float] = {
        "Government Registry": 0.95,
        "Authorized Registry API": 0.95,
        "Company Website": 0.85,
        "WEB": 0.80,
        "ERP": 0.75,
        "CRM": 0.70,
        "Manual Excel": 0.50,
        "EXCEL": 0.55,
        "Web Search": 0.60,
    }

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
