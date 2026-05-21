import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gemini Memory OS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # LLM Settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    USE_MOCK_LLM: bool = True  # Fallback to local high-fidelity cognitive simulator if no keys

    # Relational Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gemini_memory_os.db")
    
    # Vector Database Settings (Qdrant)
    QDRANT_URL: Optional[str] = os.getenv("QDRANT_URL", None)
    QDRANT_API_KEY: Optional[str] = os.getenv("QDRANT_API_KEY", None)
    USE_LOCAL_VECTOR_STORE: bool = True  # SQLite + NumPy fallback

    # Graph Database Settings (Neo4j)
    NEO4J_URI: Optional[str] = os.getenv("NEO4J_URI", None)
    NEO4J_USER: Optional[str] = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: Optional[str] = os.getenv("NEO4J_PASSWORD", None)
    USE_LOCAL_GRAPH_STORE: bool = True  # NetworkX-based local memory graph fallback

    # Redis Settings (Celery + Caching)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_LOCAL_QUEUE: bool = True  # In-memory queue fallback

    class Config:
        case_sensitive = True

settings = Settings()
