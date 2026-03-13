import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Location
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    ward: Mapped[str] = mapped_column(String(100), nullable=True)

    # AI Processing (placeholder for later)
    ai_category: Mapped[str] = mapped_column(String(50), nullable=True)
    ai_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    ai_urgency: Mapped[str] = mapped_column(String(20), nullable=True)
    ai_detected_objects: Mapped[dict] = mapped_column(JSON, nullable=True, default=list)
    ai_description_summary: Mapped[str] = mapped_column(Text, nullable=True)

    # Status & Assignment
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    assigned_department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_to_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id"), nullable=True)
    urgency: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    # Media
    image_urls: Mapped[dict] = mapped_column(JSON, nullable=True, default=list)
    resolution_image_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Engagement
    upvote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    downvote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Resolution
    resolution_comment: Mapped[str] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id"), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    department = relationship("Department", back_populates="reports")
    comments = relationship("Comment", back_populates="report", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="report", cascade="all, delete-orphan")
