from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    report_id: str
    user_id: str
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    user_role: Optional[str] = None
    content: str
    is_official: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
