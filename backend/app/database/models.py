from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    preferences = Column(JSON, default=dict)
    cognitive_decay_rate = Column(Float, default=0.05)  # Lambda parameter for memory decay

    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, default="episodic")  # episodic, semantic, procedural, working
    emotional_weight = Column(Float, default=1.0)  # scale from -5.0 to +5.0 (negative or positive emotion)
    importance_score = Column(Float, default=1.0)  # scale from 0.0 to 10.0
    reinforcement_count = Column(Integer, default=0)  # increments on recurrent hits
    decay_rate = Column(Float, default=0.05)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    user = relationship("User", back_populates="memories")
    modalities = relationship("ModalityMetadata", back_populates="memory", cascade="all, delete-orphan")
    temporal_intervals = relationship("TemporalInterval", back_populates="memory", cascade="all, delete-orphan")

class ModalityMetadata(Base):
    __tablename__ = "modality_metadata"

    id = Column(Integer, primary_key=True, index=True)
    memory_id = Column(Integer, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=True)  # local storage or cloud URL
    file_type = Column(String, nullable=False)  # screenshot, voice, pdf, browser_history, code_snippet, task
    metadata_json = Column(JSON, default=dict)  # stores OCR, transcription, browser URLs, code syntax, tasks etc.

    memory = relationship("Memory", back_populates="modalities")

class TemporalInterval(Base):
    __tablename__ = "temporal_intervals"

    id = Column(Integer, primary_key=True, index=True)
    memory_id = Column(Integer, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, index=True, nullable=False)  # e.g., "last week", "exam prep", "family trip"
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    memory = relationship("Memory", back_populates="temporal_intervals")
