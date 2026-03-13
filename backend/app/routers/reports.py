import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.report import Report
from app.models.vote import Vote
from app.models.comment import Comment
from app.models.status_history import StatusHistory
from app.schemas.report import (
    ReportResponse, ReportListResponse, ReportCreate, VoteRequest
)
from app.schemas.comment import CommentCreate, CommentResponse
from app.dependencies import get_current_user, get_current_user_optional

settings = get_settings()
router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _build_report_response(report: Report, user_vote: Optional[str] = None) -> ReportResponse:
    return ReportResponse(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=report.reporter.full_name if report.reporter else None,
        title=report.title,
        description=report.description,
        category=report.category,
        latitude=report.latitude,
        longitude=report.longitude,
        address=report.address,
        ward=report.ward,
        status=report.status,
        urgency=report.urgency,
        assigned_department_id=report.assigned_department_id,
        department_name=report.department.name if report.department else None,
        image_urls=report.image_urls or [],
        resolution_image_url=report.resolution_image_url,
        resolution_comment=report.resolution_comment,
        upvote_count=report.upvote_count,
        downvote_count=report.downvote_count,
        comment_count=report.comment_count,
        ai_confidence=report.ai_confidence,
        ai_category=report.ai_category,
        ai_urgency=report.ai_urgency,
        created_at=report.created_at,
        updated_at=report.updated_at,
        resolved_at=report.resolved_at,
        user_vote=user_vote,
    )


async def _save_upload(file: UploadFile) -> str:
    """Save uploaded file locally and return the relative URL path."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "img.jpg")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"/uploads/{filename}"


@router.post("", response_model=ReportResponse)
async def create_report(
    description: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    title: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    urgency: str = Form("medium"),
    image: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a new civic issue report with optional image."""
    image_urls = []
    if image:
        url = await _save_upload(image)
        image_urls.append(url)

    report = Report(
        reporter_id=user.id,
        title=title,
        description=description,
        category=category,
        latitude=latitude,
        longitude=longitude,
        address=address,
        urgency=urgency,
        image_urls=image_urls,
    )
    db.add(report)

    # Ensure report.id is generated before creating dependent history rows.
    await db.flush()

    # Update user stats
    user.reports_count += 1
    user.points += 10  # points for submitting

    # Status history
    history = StatusHistory(
        report_id=report.id,
        old_status=None,
        new_status="pending",
        changed_by_id=user.id,
        comment="Report submitted",
    )
    db.add(history)

    await db.refresh(report)
    return _build_report_response(report)


@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List reports with pagination and filters."""
    query = select(Report).options()
    count_query = select(func.count(Report.id))

    if status:
        query = query.where(Report.status == status)
        count_query = count_query.where(Report.status == status)
    if category:
        query = query.where(Report.category == category)
        count_query = count_query.where(Report.category == category)
    if urgency:
        query = query.where(Report.urgency == urgency)
        count_query = count_query.where(Report.urgency == urgency)
    if search:
        query = query.where(Report.description.ilike(f"%{search}%"))
        count_query = count_query.where(Report.description.ilike(f"%{search}%"))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Report.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    reports = result.scalars().all()

    # Get user votes if logged in
    user_votes = {}
    if user and reports:
        report_ids = [r.id for r in reports]
        vote_result = await db.execute(
            select(Vote).where(Vote.user_id == user.id, Vote.report_id.in_(report_ids))
        )
        for v in vote_result.scalars().all():
            user_votes[v.report_id] = v.vote_type

    return ReportListResponse(
        reports=[_build_report_response(r, user_votes.get(r.id)) for r in reports],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/my", response_model=ReportListResponse)
async def my_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's reports."""
    query = select(Report).where(Report.reporter_id == user.id)
    count_query = select(func.count(Report.id)).where(Report.reporter_id == user.id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Report.created_at)).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    reports = result.scalars().all()

    return ReportListResponse(
        reports=[_build_report_response(r) for r in reports],
        total=total, page=page, per_page=per_page,
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get a single report by ID."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    user_vote = None
    if user:
        vote_result = await db.execute(
            select(Vote).where(Vote.report_id == report_id, Vote.user_id == user.id)
        )
        vote = vote_result.scalar_one_or_none()
        if vote:
            user_vote = vote.vote_type

    return _build_report_response(report, user_vote)


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a report (owner or admin only)."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.reporter_id != user.id and user.role not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(report)
    return {"message": "Report deleted"}


# ── Voting ──

@router.post("/{report_id}/vote")
async def vote_on_report(
    report_id: str,
    data: VoteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upvote or downvote a report."""
    if data.vote_type not in ("up", "down"):
        raise HTTPException(status_code=400, detail="vote_type must be 'up' or 'down'")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check existing vote
    vote_result = await db.execute(
        select(Vote).where(Vote.report_id == report_id, Vote.user_id == user.id)
    )
    existing_vote = vote_result.scalar_one_or_none()

    if existing_vote:
        if existing_vote.vote_type == data.vote_type:
            # Remove vote (toggle off)
            if data.vote_type == "up":
                report.upvote_count = max(0, report.upvote_count - 1)
            else:
                report.downvote_count = max(0, report.downvote_count - 1)
            await db.delete(existing_vote)
            return {"message": "Vote removed", "action": "removed"}
        else:
            # Change vote direction
            if data.vote_type == "up":
                report.upvote_count += 1
                report.downvote_count = max(0, report.downvote_count - 1)
            else:
                report.downvote_count += 1
                report.upvote_count = max(0, report.upvote_count - 1)
            existing_vote.vote_type = data.vote_type
            return {"message": "Vote changed", "action": "changed"}
    else:
        # New vote
        vote = Vote(report_id=report_id, user_id=user.id, vote_type=data.vote_type)
        db.add(vote)
        if data.vote_type == "up":
            report.upvote_count += 1
        else:
            report.downvote_count += 1
        return {"message": "Vote recorded", "action": "created"}


# ── Comments ──

@router.get("/{report_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all comments on a report."""
    result = await db.execute(
        select(Comment)
        .where(Comment.report_id == report_id)
        .order_by(Comment.created_at)
    )
    comments = result.scalars().all()
    return [
        CommentResponse(
            id=c.id, report_id=c.report_id, user_id=c.user_id,
            user_name=c.user.full_name if c.user else None,
            user_avatar=c.user.avatar_url if c.user else None,
            user_role=c.user.role if c.user else None,
            content=c.content, is_official=c.is_official, created_at=c.created_at,
        )
        for c in comments
    ]


@router.post("/{report_id}/comments", response_model=CommentResponse)
async def create_comment(
    report_id: str,
    data: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a comment to a report."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    is_official = user.role in ("admin", "moderator", "department_head")
    comment = Comment(
        report_id=report_id,
        user_id=user.id,
        content=data.content,
        is_official=is_official,
    )
    db.add(comment)
    report.comment_count += 1

    # Award points
    user.points += 2

    await db.flush()
    await db.refresh(comment)
    return CommentResponse(
        id=comment.id, report_id=comment.report_id, user_id=comment.user_id,
        user_name=user.full_name, user_avatar=user.avatar_url, user_role=user.role,
        content=comment.content, is_official=comment.is_official, created_at=comment.created_at,
    )
