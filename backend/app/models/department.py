from datetime import datetime
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    head_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id"), nullable=True)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=True)
    auto_assign_categories: Mapped[dict] = mapped_column(JSON, default=list)  # e.g. ["pothole", "road"]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    head_user = relationship("User", foreign_keys=[head_user_id])
    reports = relationship("Report", back_populates="department")
