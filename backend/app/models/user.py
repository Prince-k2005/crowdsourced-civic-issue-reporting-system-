import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    """User profile table — synced with Supabase Auth.
    The `id` column matches the Supabase auth.users.id (UUID).
    Profile rows are auto-created on first API call via dependencies.py.
    """
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # Matches Supabase auth user id
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="citizen")
    phone: Mapped[str] = mapped_column(String(20), nullable=True)

    # Gamification
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reports_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    badge_level: Mapped[str] = mapped_column(String(50), nullable=False, default="newcomer")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    comments = relationship("Comment", back_populates="user")
    votes = relationship("Vote", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
