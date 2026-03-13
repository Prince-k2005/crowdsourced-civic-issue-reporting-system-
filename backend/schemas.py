from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class ReportStatus(str, Enum):
    PENDING = "Pending"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"

class ReportCategory(str, Enum):
    POTHOLE = "pothole"
    SANITATION = "sanitation"
    LIGHTING = "lighting"
    PUBLIC_WORKS = "public_works"
    OTHER = "other"

class ReportRequest(BaseModel):
    description: str
    latitude: float
    longitude: float
    claimed_category: str
    
class ReportResponse(BaseModel):
    id: str
    status: ReportStatus
    ai_confidence: float
    detected_objects: List[str]
    assigned_department: str
    urgency: str
    message: str
