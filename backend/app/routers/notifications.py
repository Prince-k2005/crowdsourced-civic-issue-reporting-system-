from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's notifications."""
    query = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(limit)

    result = await db.execute(query)
    notifications = result.scalars().all()

    # Count unread
    unread_result = await db.execute(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.is_read == False
        )
    )
    unread_count = len(unread_result.scalars().all())

    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id, "type": n.type, "title": n.title,
                "body": n.body, "report_id": n.report_id,
                "is_read": n.is_read, "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ]
    }


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    return {"message": "All marked as read"}
