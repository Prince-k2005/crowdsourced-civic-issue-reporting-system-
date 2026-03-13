from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.department import Department
from app.models.status_history import StatusHistory
from app.models.notification import Notification
from app.schemas.report import ReportResponse, ReportListResponse, ReportStatusUpdate
from app.dependencies import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/reports", response_model=ReportListResponse)
async def admin_list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: List all reports with filters."""
    query = select(Report).options(selectinload(Report.reporter), selectinload(Report.department))
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

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Report.created_at)).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    reports = result.scalars().all()

    from app.routers.reports import _build_report_response
    return ReportListResponse(
        reports=[_build_report_response(r) for r in reports],
        total=total, page=page, per_page=per_page,
    )


@router.patch("/reports/{report_id}/status")
async def admin_update_status(
    report_id: str,
    data: ReportStatusUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Update report status."""
    valid_statuses = ["pending", "verified", "in_progress", "resolved", "rejected", "duplicate"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = report.status
    report.status = data.status

    if data.assigned_department_id:
        report.assigned_department_id = data.assigned_department_id

    if data.status == "resolved":
        report.resolved_at = datetime.now(timezone.utc)
        report.resolved_by_id = admin.id
        report.resolution_comment = data.comment

        # Award points to reporter
        reporter_result = await db.execute(select(User).where(User.id == report.reporter_id))
        reporter = reporter_result.scalar_one_or_none()
        if reporter:
            reporter.points += 20

    # Status history
    history = StatusHistory(
        report_id=report_id,
        old_status=old_status,
        new_status=data.status,
        changed_by_id=admin.id,
        comment=data.comment,
    )
    db.add(history)

    # Notify reporter
    notification = Notification(
        user_id=report.reporter_id,
        type="status_change",
        title=f"Report status updated to {data.status}",
        body=data.comment,
        report_id=report_id,
    )
    db.add(notification)

    return {"message": "Status updated", "old_status": old_status, "new_status": data.status}


@router.get("/analytics")
async def admin_analytics(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Get dashboard analytics."""
    # Total reports
    total_result = await db.execute(select(func.count(Report.id)))
    total = total_result.scalar() or 0

    # By status
    status_result = await db.execute(
        select(Report.status, func.count(Report.id)).group_by(Report.status)
    )
    by_status = {row[0]: row[1] for row in status_result.all()}

    # By category
    category_result = await db.execute(
        select(Report.category, func.count(Report.id)).group_by(Report.category)
    )
    by_category = {row[0]: row[1] for row in category_result.all()}

    # By urgency
    urgency_result = await db.execute(
        select(Report.urgency, func.count(Report.id)).group_by(Report.urgency)
    )
    by_urgency = {row[0]: row[1] for row in urgency_result.all()}

    # Total users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0

    # Resolution rate
    resolved = by_status.get("resolved", 0)
    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0

    return {
        "total_reports": total,
        "total_users": total_users,
        "resolution_rate": resolution_rate,
        "by_status": by_status,
        "by_category": by_category,
        "by_urgency": by_urgency,
    }


# ── Departments ──

@router.get("/departments")
async def list_departments(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).order_by(Department.name))
    departments = result.scalars().all()
    return [
        {
            "id": d.id, "name": d.name, "slug": d.slug,
            "description": d.description, "contact_email": d.contact_email,
            "auto_assign_categories": d.auto_assign_categories,
        }
        for d in departments
    ]


@router.post("/departments")
async def create_department(
    name: str,
    slug: str,
    description: Optional[str] = None,
    contact_email: Optional[str] = None,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    dept = Department(name=name, slug=slug, description=description, contact_email=contact_email)
    db.add(dept)
    await db.flush()
    await db.refresh(dept)
    return {"id": dept.id, "name": dept.name, "slug": dept.slug}
