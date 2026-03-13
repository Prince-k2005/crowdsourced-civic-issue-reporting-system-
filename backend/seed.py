"""Seed script to populate the database with demo data."""
import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from app.database import engine, async_session, Base
from app.models import User, Report, Department, Badge, StatusHistory
from app.dependencies import hash_password


CATEGORIES = ["pothole", "sanitation", "lighting", "water", "drainage", "public_works", "noise", "other"]
URGENCY_LEVELS = ["critical", "high", "medium", "low"]
STATUSES = ["pending", "verified", "in_progress", "resolved", "rejected"]

DEMO_USERS = [
    {"email": "admin@civicflow.local", "full_name": "Admin User", "role": "admin", "password": "admin123"},
    {"email": "aniket@civicflow.local", "full_name": "Aniket Sharma", "role": "citizen", "password": "user123"},
    {"email": "sarah@civicflow.local", "full_name": "Sarah Patel", "role": "citizen", "password": "user123"},
    {"email": "john@civicflow.local", "full_name": "John Doe", "role": "citizen", "password": "user123"},
    {"email": "priya@civicflow.local", "full_name": "Priya Verma", "role": "citizen", "password": "user123"},
    {"email": "moderator@civicflow.local", "full_name": "Mod User", "role": "moderator", "password": "mod123"},
]

DEPARTMENTS = [
    {"name": "Infrastructure & Roads", "slug": "infrastructure", "auto_assign_categories": ["pothole", "public_works"]},
    {"name": "Sanitation & Waste", "slug": "sanitation", "auto_assign_categories": ["sanitation"]},
    {"name": "Street Lighting", "slug": "lighting", "auto_assign_categories": ["lighting"]},
    {"name": "Water & Drainage", "slug": "water", "auto_assign_categories": ["water", "drainage"]},
]

BADGES = [
    {"name": "Newcomer", "icon": "🌱", "description": "Welcome to CivicFlow!", "points_required": 0},
    {"name": "Active Citizen", "icon": "🏃", "description": "Reached 50 points", "points_required": 50},
    {"name": "Community Hero", "icon": "🦸", "description": "Reached 200 points", "points_required": 200},
    {"name": "City Champion", "icon": "🏆", "description": "Reached 500 points", "points_required": 500},
    {"name": "Legend", "icon": "⭐", "description": "Reached 1000 points", "points_required": 1000},
]

SAMPLE_REPORTS = [
    {"title": "Large pothole on MG Road", "description": "There is a dangerous pothole near the MG Road junction causing traffic issues. Multiple vehicles have been damaged.", "category": "pothole", "urgency": "high"},
    {"title": "Garbage overflow near park", "description": "The garbage bin near Central Park has been overflowing for 3 days. Causing bad smell and unhygienic conditions.", "category": "sanitation", "urgency": "medium"},
    {"title": "Street light not working", "description": "The street light at Sector 15 crossing has been off for a week. Very dangerous at night for pedestrians.", "category": "lighting", "urgency": "high"},
    {"title": "Water pipeline leak", "description": "Water is leaking from the main pipeline on Brigade Road. Wasting a lot of water and making the road slippery.", "category": "water", "urgency": "critical"},
    {"title": "Blocked drainage", "description": "Storm drain is completely blocked near the school area. Water accumulates during rain causing flooding.", "category": "drainage", "urgency": "high"},
    {"title": "Broken sidewalk tiles", "description": "Several sidewalk tiles are broken and raised near the bus stop on Station Road. Tripping hazard for seniors.", "category": "public_works", "urgency": "medium"},
    {"title": "Construction noise at night", "description": "Illegal construction happening after 10 PM. Very loud noise disturbing the entire neighborhood.", "category": "noise", "urgency": "medium"},
    {"title": "Road cracks after rain", "description": "Multiple cracks appeared on the main highway after heavy rain. Getting worse every day.", "category": "pothole", "urgency": "high"},
    {"title": "Missing manhole cover", "description": "A manhole cover is missing on the footpath near the market. Extremely dangerous especially at night.", "category": "public_works", "urgency": "critical"},
    {"title": "Overflowing sewer", "description": "Sewage water is flowing onto the main road near residential area. Health hazard for residents.", "category": "drainage", "urgency": "critical"},
]

# Base coordinates (simulating a city area)
BASE_LAT = 12.9716
BASE_LON = 77.5946


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count = (await db.execute(select(func.count(User.id)))).scalar()
        if count > 0:
            print("Database already has data. Skipping seed.")
            return

        # Create departments
        dept_objects = []
        for d in DEPARTMENTS:
            dept = Department(**d)
            db.add(dept)
            dept_objects.append(dept)
        await db.flush()

        # Create badges
        for b in BADGES:
            db.add(Badge(**b))
        await db.flush()

        # Create users
        user_objects = []
        for u in DEMO_USERS:
            user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                points=random.randint(0, 200) if u["role"] == "citizen" else 0,
                reports_count=0,
            )
            db.add(user)
            user_objects.append(user)
        await db.flush()

        citizens = [u for u in user_objects if u.role == "citizen"]

        # Create reports
        for i, sr in enumerate(SAMPLE_REPORTS):
            reporter = random.choice(citizens)
            status = random.choice(STATUSES)
            lat = BASE_LAT + random.uniform(-0.05, 0.05)
            lon = BASE_LON + random.uniform(-0.05, 0.05)
            created = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))

            # Auto-assign department
            dept = None
            for d in dept_objects:
                if sr["category"] in (d.auto_assign_categories or []):
                    dept = d
                    break

            report = Report(
                reporter_id=reporter.id,
                title=sr["title"],
                description=sr["description"],
                category=sr["category"],
                latitude=lat,
                longitude=lon,
                urgency=sr["urgency"],
                status=status,
                assigned_department_id=dept.id if dept else None,
                upvote_count=random.randint(0, 25),
                comment_count=random.randint(0, 5),
                created_at=created,
            )

            if status == "resolved":
                report.resolved_at = created + timedelta(days=random.randint(1, 7))
                report.resolution_comment = "Issue has been fixed by the department."

            db.add(report)
            reporter.reports_count += 1

            # Add status history
            db.add(StatusHistory(
                report_id=report.id,
                old_status=None,
                new_status="pending",
                changed_by_id=reporter.id,
                comment="Report submitted",
                created_at=created,
            ))
            if status != "pending":
                admin_user = user_objects[0]  # admin
                db.add(StatusHistory(
                    report_id=report.id,
                    old_status="pending",
                    new_status=status,
                    changed_by_id=admin_user.id,
                    comment=f"Status changed to {status}",
                    created_at=created + timedelta(hours=random.randint(1, 48)),
                ))

        await db.commit()
        print("✅ Database seeded successfully!")
        print(f"   • {len(DEMO_USERS)} users (admin: admin@civicflow.local / admin123)")
        print(f"   • {len(DEPARTMENTS)} departments")
        print(f"   • {len(BADGES)} badges")
        print(f"   • {len(SAMPLE_REPORTS)} sample reports")


if __name__ == "__main__":
    asyncio.run(seed())
