from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.database import engine
from app.routers import auth, reports, admin, leaderboard, notifications
from dotenv import load_dotenv

load_dotenv()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="CivicFlow API",
    description="AI-Driven Civic Issue Reporting System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(leaderboard.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"message": "CivicFlow API v1.0", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}