"""
KAVACH AI Pro - Database Models
PostgreSQL with SQLAlchemy 2.0 (Free & Open Source)
"""

from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Enum as SQLEnum, JSON, Index
from sqlalchemy.orm import DeclarativeBase, relationship
import uuid


class Base(DeclarativeBase):
    pass


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    PREMIUM = "premium"


class DetectionType(str, Enum):
    DEEPFAKE = "deepfake"
    VOICE = "voice"
    PHISHING = "phishing"


class DetectionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime)

    # Relationships
    detections = relationship("Detection", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    detection_type = Column(SQLEnum(DetectionType), nullable=False)
    status = Column(SQLEnum(DetectionStatus), default=DetectionStatus.PENDING)

    # Input
    original_filename = Column(String(500))
    file_path = Column(String(1000))
    file_size = Column(Integer)
    mime_type = Column(String(100))

    # Results
    is_fake = Column(Boolean)
    confidence = Column(Float)
    spoof_type = Column(String(100))
    explanation = Column(Text)
    recommended_action = Column(Text)
    processing_time = Column(Float)

    # Metadata
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="detections")

    # Indexes for performance
    __table_args__ = (
        Index('idx_detection_user_created', 'user_id', 'created_at'),
        Index('idx_detection_status', 'status'),
        Index('idx_detection_type', 'detection_type'),
    )


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="api_keys")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100))
    resource_id = Column(String(36))
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    details = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_audit_user', 'user_id', 'created_at'),
        Index('idx_audit_action', 'action', 'created_at'),
    )
