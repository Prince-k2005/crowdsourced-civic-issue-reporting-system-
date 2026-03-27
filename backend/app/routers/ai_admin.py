from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.report import Report
from app.models.department import Department
from app.models.status_history import StatusHistory
from app.models.notification import Notification
from app.models.user import User
from app.dependencies import require_admin
from app.services.ai_service import prioritize_reports, assign_department_for_report

router = APIRouter(prefix="/api/admin/ai", tags=["Admin AI"])


@router.post("/prioritize")
async def ai_prioritize_reports(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin-only: Analyze pending/verified reports with Grok AI:
    1. Rank by priority
    2. Assign each report to appropriate department
    3. Auto-update status from pending/verified to in_progress
    4. Create status history entries
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

    # Fetch all available departments for assignment
    dept_result = await db.execute(select(Department))
    departments = dept_result.scalars().all()
    available_depts = [
        {
            "id": dept.id,
            "name": dept.name,
            "auto_assign_categories": dept.auto_assign_categories or [],
        }
        for dept in departments
    ]

    # Process each ranked report: assign department and change status
    updated_reports = []
    for item in ai_result["ranked"]:
        report_id = item["id"]
        
        # Find the original report object
        report_obj = next((r for r in reports if r.id == report_id), None)
        if not report_obj:
            continue

        # Call AI agent to assign department
        dept_assignment = await assign_department_for_report(
            title=report_obj.title or report_obj.description[:100],
            description=report_obj.description,
            category=report_obj.category,
            urgency=report_obj.urgency,
            available_departments=available_depts,
        )

        # Update report with department assignment and status
        old_status = report_obj.status
        report_obj.status = "in_progress"
        
        if dept_assignment.get("department_id") and not dept_assignment.get("error"):
            report_obj.assigned_department_id = dept_assignment["department_id"]

        # Create status history entry
        history = StatusHistory(
            report_id=report_id,
            old_status=old_status,
            new_status="in_progress",
            changed_by_id=admin.id,
            comment=f"AI Priority Triage: Priority Score {item.get('priority_score', 0)}/10. "
                   f"Department: {dept_assignment.get('department_name', 'Unassigned')} "
                   f"(confidence: {dept_assignment.get('confidence', 0):.1%})",
        )
        db.add(history)

        # Notify reporter
        notification = Notification(
            user_id=report_obj.reporter_id,
            type="status_change",
            title="Your report is now in progress!",
            body=f"AI assigned your report to {dept_assignment.get('department_name', 'a department')} "
                 f"with priority score {item.get('priority_score', 0)}/10",
            report_id=report_id,
        )
        db.add(notification)

        # Add to response
        updated_reports.append({
            **item,
            "assigned_department": dept_assignment.get("department_name"),
            "department_confidence": dept_assignment.get("confidence", 0),
            "new_status": "in_progress",
        })

    await db.commit()

    return {
        "ranked": updated_reports,
        "total_analyzed": len(report_dicts),
        "total_updated": len(updated_reports),
        "message": f"Analyzed {len(report_dicts)} reports, assigned departments, and updated {len(updated_reports)} to in_progress",
    }
