from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[str] = mapped_column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    vote_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'up' or 'down'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("report_id", "user_id", name="uq_vote_report_user"),
    )

    # Relationships
    report = relationship("Report", back_populates="votes")
    user = relationship("User", back_populates="votes")
