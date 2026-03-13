import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated

from schemas import ReportResponse, ReportStatus
from ai_service import ai_service

app = FastAPI(title="CivicFlow API", description="AI-Driven Civic Issue Reporting System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated

from schemas import ReportResponse, ReportStatus
from ai_service import ai_service
import database

# Initialize DB on startup
database.init_db()

app = FastAPI(title="CivicFlow API", description="AI-Driven Civic Issue Reporting System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CivicFlow API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/reports", response_model=ReportResponse)
async def submit_report(
    description: Annotated[str, Form()],
    latitude: Annotated[float, Form()],
    longitude: Annotated[float, Form()],
    category: Annotated[str, Form()],
    image: Annotated[UploadFile, File()]
):
    # 1. AI Image Verification
    image_bytes = await image.read()
    is_valid, confidence, detected_objects = await ai_service.verify_image(image_bytes, category)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Image does not match the claimed category.")

    # 2. NLP Routing
    routed_category, urgency = await ai_service.route_report(description)
    
    # 3. Duplicate Detection
    is_duplicate = await ai_service.detect_duplicates(latitude, longitude, category)
    if is_duplicate:
         raise HTTPException(status_code=409, detail="Duplicate report detected nearby.")

    # 4. Save to DB
    report_id = str(uuid.uuid4())
    new_report = {
        "id": report_id,
        "description": description,
        "location": {"lat": latitude, "lon": longitude},
        "category": category,
        "routed_category": routed_category,
        "urgency": urgency,
        "status": ReportStatus.PENDING,
        "ai_metadata": {
            "confidence": confidence,
            "objects": detected_objects
        }
    }
    database.save_report(new_report)
    
    return ReportResponse(
        id=report_id,
        status=ReportStatus.PENDING,
        ai_confidence=confidence,
        detected_objects=detected_objects,
        assigned_department=routed_category,
        urgency=urgency,
        message="Report submitted successfully and verified by AI."
    )

@app.get("/reports")
def get_reports():
    return database.get_all_reports()

class StatusUpdate(BaseModel):
    status: str
    comment: str | None = None

@app.patch("/reports/{report_id}/status")
def update_status(report_id: str, update: StatusUpdate):
    status = update.status
    comment = update.comment
    
    # Validate stats against enum
    valid_statuses = [s.value for s in ReportStatus]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    database.update_report_status(report_id, status, comment)
    return {"message": "Status updated successfully"}

@app.get("/leaderboard")
def get_leaderboard_endpoint():
    return database.get_leaderboard()
