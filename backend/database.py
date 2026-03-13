import sqlite3
import json
from schemas import ReportStatus

DB_NAME = "civicflow.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            description TEXT,
            latitude REAL,
            longitude REAL,
            category TEXT,
            routed_category TEXT,
            urgency TEXT,
            status TEXT,
            ai_confidence REAL,
            detected_objects TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolution_comment TEXT,
            resolution_image_url TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_report(report_data):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO reports (id, description, latitude, longitude, category, routed_category, urgency, status, ai_confidence, detected_objects)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        report_data['id'],
        report_data['description'],
        report_data['location']['lat'],
        report_data['location']['lon'],
        report_data['category'],
        report_data['routed_category'],
        report_data['urgency'],
        report_data['status'],
        report_data['ai_metadata']['confidence'],
        json.dumps(report_data['ai_metadata']['objects'])
    ))
    conn.commit()
    conn.close()

def get_all_reports():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM reports ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()
    
    reports = []
    for row in rows:
        reports.append({
            "id": row['id'],
            "description": row['description'],
            "location": {"lat": row['latitude'], "lon": row['longitude']},
            "category": row['category'],
            "assigned_department": row['routed_category'],
            "urgency": row['urgency'],
            "status": row['status'],
            "ai_confidence": row['ai_confidence'],
            "resolution_comment": row['resolution_comment']
        })
    return reports

def get_leaderboard():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Simple logic: 10 points per Resolved report. 
    # In a real app we would join with a Users table, but for now we group by 'reporter_id' (or just count total for demo if no auth).
    # Since we didn't implement fully authenticated users in Phase 1 (just simplified), 
    # we will mock the return data or if we had a user_id we would use it.
    # For the Hackathon demo, let's return some hardcoded "Top Citizens" + calculate stats from DB if possible.
    
    # Let's count resolved reports per category as a "City Health Score" for now, 
    # OR mock a user list since we don't have login yet.
    
    # improved: Return top categories resolved
    c.execute('''
        SELECT category, COUNT(*) as count 
        FROM reports 
        WHERE status = 'Resolved' 
        GROUP BY category
    ''')
    rows = c.fetchall()
    conn.close()
    
    stats = {row[0]: row[1] for row in rows}
    
    # Mock Users for the Visual Appeal (Hackathon requirement)
    mock_users = [
        {"name": "Aniket", "points": 150, "rank": 1},
        {"name": "Sarah", "points": 120, "rank": 2},
        {"name": "John", "points": 90, "rank": 3},
    ]
    
    return {"stats": stats, "users": mock_users}

def update_report_status(report_id, new_status, comment=None):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        UPDATE reports 
        SET status = ?, resolution_comment = ?
        WHERE id = ?
    ''', (new_status, comment, report_id))
    conn.commit()
    conn.close()
