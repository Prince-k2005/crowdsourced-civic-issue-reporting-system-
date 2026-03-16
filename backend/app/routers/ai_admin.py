from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.report import Report
from app.models.user import User
from app.dependencies import require_admin
from app.services.ai_service import prioritize_reports

router = APIRouter(prefix="/api/admin/ai", tags=["Admin AI"])


@router.post("/prioritize")
async def ai_prioritize_reports(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin-only: Analyze pending/verified reports with Grok AI and return
    a priority-ranked list with reasoning and suggested department.
    """
    # Fetch up to 50 actionable (pending or verified) reports, newest first
    result = await db.execute(
        select(Report)
        .where(Report.status.in_(["pending", "verified"]))
        .order_by(desc(Report.created_at))
        .limit(50)
    )
    reports = result.scalars().all()

    if not reports:
        return {"ranked": [], "message": "No pending or verified reports to analyze"}

    # Build serializable dicts for the AI service
    now = datetime.now(timezone.utc)

    def age_hours(r: Report) -> float:
        created = r.created_at
        if created and created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return (now - created).total_seconds() / 3600 if created else 0

    report_dicts = [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "urgency": r.urgency,
            "status": r.status,
            "upvote_count": r.upvote_count,
            "downvote_count": r.downvote_count,
            "age_hours": age_hours(r),
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "reporter_name": None,  # not needed for AI analysis
        }
        for r in reports
    ]

    try:
        ai_result = await prioritize_reports(report_dicts)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {e}")

    if ai_result.get("error"):
        raise HTTPException(status_code=500, detail=ai_result["error"])

    return {
        "ranked": ai_result["ranked"],
        "total_analyzed": len(report_dicts),
        "message": f"Analyzed {len(report_dicts)} reports using Grok AI",
    }
