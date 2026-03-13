from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ReportStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    DUPLICATE = "duplicate"


class ReportCategory(str, Enum):
    POTHOLE = "pothole"
    SANITATION = "sanitation"
    LIGHTING = "lighting"
    PUBLIC_WORKS = "public_works"
    WATER = "water"
    DRAINAGE = "drainage"
    NOISE = "noise"
    OTHER = "other"


class UrgencyLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ReportCreate(BaseModel):
    title: Optional[str] = None
    description: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    urgency: str = "medium"


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reporter_name: Optional[str] = None
    title: Optional[str] = None
    description: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    ward: Optional[str] = None
    status: str
    urgency: str
    assigned_department_id: Optional[int] = None
    department_name: Optional[str] = None
    image_urls: Optional[List[str]] = []
    resolution_image_url: Optional[str] = None
    resolution_comment: Optional[str] = None
    upvote_count: int = 0
    downvote_count: int = 0
    comment_count: int = 0
    ai_confidence: Optional[float] = None
    ai_category: Optional[str] = None
    ai_urgency: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    user_vote: Optional[str] = None  # 'up', 'down', or None

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
    page: int
    per_page: int


class ReportStatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None
    assigned_department_id: Optional[int] = None


class VoteRequest(BaseModel):
    vote_type: str  # 'up' or 'down'
