from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.badge import Badge, UserBadge
from app.dependencies import get_current_user_optional

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])


@router.get("")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top users by points."""
    result = await db.execute(
        select(User)
        .where(User.role == "citizen")
        .order_by(desc(User.points))
        .limit(limit)
    )
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": u.id,
                "name": u.full_name or u.email.split("@")[0],
                "avatar_url": u.avatar_url,
                "points": u.points,
                "reports_count": u.reports_count,
                "badge_level": u.badge_level,
                "rank": i + 1,
            }
            for i, u in enumerate(users)
        ]
    }


@router.get("/stats")
async def community_stats(db: AsyncSession = Depends(get_db)):
    """Get community-wide statistics."""
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar() or 0
    total_resolved = (await db.execute(
        select(func.count(Report.id)).where(Report.status == "resolved")
    )).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_upvotes = (await db.execute(select(func.sum(Report.upvote_count)))).scalar() or 0

    # Category breakdown for resolved
    cat_result = await db.execute(
        select(Report.category, func.count(Report.id))
        .where(Report.status == "resolved")
        .group_by(Report.category)
    )
    resolved_by_category = {row[0]: row[1] for row in cat_result.all()}

    return {
        "total_reports": total_reports,
        "total_resolved": total_resolved,
        "total_users": total_users,
        "total_upvotes": total_upvotes,
        "resolution_rate": round((total_resolved / total_reports * 100), 1) if total_reports > 0 else 0,
        "resolved_by_category": resolved_by_category,
    }


@router.get("/badges")
async def get_badges(db: AsyncSession = Depends(get_db)):
    """Get all available badges."""
    result = await db.execute(select(Badge).order_by(Badge.points_required))
    badges = result.scalars().all()
    return [
        {
            "id": b.id, "name": b.name, "description": b.description,
            "icon": b.icon, "points_required": b.points_required,
            "reports_required": b.reports_required,
        }
        for b in badges
    ]
