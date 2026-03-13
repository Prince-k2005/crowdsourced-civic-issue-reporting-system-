# CivicFlow — Local-First Implementation Plan

> **Project:** AI-Driven Civic Issue Reporting & Crowdsourcing Platform  
> **Stack:** Self-hosted Supabase (Docker) · FastAPI · Next.js + React  
> **Runs:** 100% locally via `docker-compose up`  
> **Date:** 2026-02-12  

---

## 📊 Current State → Target State

| Area | Now | Target |
|------|-----|--------|
| **DB** | SQLite file | PostgreSQL + PostGIS (local Supabase Docker) |
| **Auth** | None | Supabase GoTrue (local, email/password) |
| **Storage** | Images discarded | Local S3-compatible storage (Supabase Storage) |
| **Backend** | Single-file FastAPI, mock AI | Modular FastAPI, real AI pipeline |
| **Frontend** | Vite + React (basic) | Next.js 14 App Router, premium UI |
| **Infra** | Basic docker-compose | Full local stack via `docker-compose up` |

---

## 🏗️ Architecture (All Local)

```
 localhost:3000          localhost:8000         localhost:54321
┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  Next.js 14  │───▶│   FastAPI API    │───▶│  Supabase (Docker) │
│  (Frontend)  │    │   (Backend)      │    │  ┌──────────────┐  │
│              │    │  ┌────────────┐  │    │  │ PostgreSQL   │  │
│  • React     │    │  │ Reports    │  │    │  │ + PostGIS    │  │
│  • TailwindCSS│   │  │ Auth MW    │  │    │  ├──────────────┤  │
│  • Leaflet   │    │  │ AI Service │  │    │  │ GoTrue Auth  │  │
│  • Zustand   │    │  │ SQLAlchemy │  │    │  ├──────────────┤  │
│              │    │  └────────────┘  │    │  │ Storage (S3) │  │
└──────────────┘    └──────────────────┘    │  ├──────────────┤  │
                                            │  │ Realtime WS  │  │
                                            │  └──────────────┘  │
                                            └────────────────────┘
```

**Everything runs with a single command:** `docker-compose up --build`

---

## 📋 Phase 0 — Scaffolding & Local Supabase (Day 1)

### 0.1 Local Supabase via Docker
Add to `docker-compose.yml` — a self-hosted Supabase stack:

```yaml
version: '3.8'
services:
  # ── Supabase PostgreSQL + PostGIS ──
  db:
    image: supabase/postgres:15.1.1.41
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: civicflow
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql

  # ── Supabase Auth (GoTrue) ──
  auth:
    image: supabase/gotrue:v2.132.3
    ports:
      - "9999:9999"
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres@db:5432/civicflow?sslmode=disable
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_JWT_SECRET: super-secret-jwt-token-for-local-dev-only
      GOTRUE_JWT_EXP: 3600
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "true"
      API_EXTERNAL_URL: http://localhost:9999
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
    depends_on:
      - db

  # ── Supabase Storage (local S3) ──
  storage:
    image: supabase/storage-api:v0.43.11
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/civicflow
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.local-anon-key
      SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.local-service-key
      PGRST_JWT_SECRET: super-secret-jwt-token-for-local-dev-only
    volumes:
      - storage_data:/var/lib/storage
    depends_on:
      - db

  # ── FastAPI Backend ──
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app
      - upload_data:/app/uploads
    depends_on:
      - db
      - auth
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # ── Next.js Frontend ──
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    command: npm run dev

volumes:
  pgdata:
  storage_data:
  upload_data:
```

### 0.2 Local `.env` File
```env
# Database (local Docker)
DATABASE_URL=postgresql://postgres:postgres@db:5432/civicflow

# Auth (local GoTrue)
SUPABASE_URL=http://localhost:9999
SUPABASE_JWT_SECRET=super-secret-jwt-token-for-local-dev-only
SUPABASE_ANON_KEY=local-anon-key

# FastAPI
SECRET_KEY=local-dev-secret-key-change-in-prod
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=/app/uploads

# AI (optional — works without, falls back to mock)
GOOGLE_AI_API_KEY=

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_URL=http://localhost:9999
NEXT_PUBLIC_STORAGE_URL=http://localhost:5000
```

### 0.3 Project Structure
```
crowdsource/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── config.py            # Pydantic Settings
│   │   ├── dependencies.py      # DB session, auth deps
│   │   ├── models/              # SQLAlchemy ORM
│   │   │   ├── user.py, report.py, vote.py, comment.py
│   │   │   └── department.py, notification.py
│   │   ├── schemas/             # Pydantic V2
│   │   │   ├── user.py, report.py, comment.py
│   │   ├── routers/             # API routes
│   │   │   ├── auth.py, reports.py, admin.py
│   │   │   └── leaderboard.py, analytics.py
│   │   ├── services/            # Business logic
│   │   │   ├── ai_service.py, report_service.py
│   │   │   └── gamification_service.py, notification_service.py
│   │   └── utils/
│   │       ├── storage.py       # Local file storage helper
│   │       └── geo.py           # PostGIS helpers
│   ├── alembic/                 # DB migrations
│   ├── init.sql                 # PostGIS + uuid-ossp extensions
│   ├── requirements.txt
│   ├── Dockerfile
│   └── uploads/                 # Local image storage (gitignored)
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                 # Pages (App Router)
│   │   ├── components/          # UI components
│   │   ├── lib/                 # API client, utils
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Zustand state
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml           # Single command to run everything
├── .env                         # Local env vars
└── README.md
```

---

## Phase 1 — Database & Backend Foundation (Days 2-4)

### 1.1 Database Schema (PostgreSQL + PostGIS)

**10 tables** — `profiles`, `departments`, `reports`, `votes`, `comments`, `status_history`, `notifications`, `badges`, `user_badges`, `wards`

Key design decisions:
- `reports.location` uses PostGIS `GEOMETRY(POINT, 4326)` for spatial queries
- `profiles` table syncs with GoTrue auth via `id UUID`
- `status_history` provides full audit trail
- `votes` has `UNIQUE(report_id, user_id)` — one vote per user per report
- Images stored as file paths in `reports.image_urls TEXT[]`

### 1.2 Backend Restructure
- Modular routers: `auth`, `reports`, `admin`, `leaderboard`, `analytics`
- SQLAlchemy async ORM + Alembic migrations
- JWT auth middleware (verifies GoTrue tokens)
- Role-based access: `citizen`, `admin`, `moderator`, `department_head`
- Local file upload handler (saves to `./uploads/`, serves via static mount)

### 1.3 API Endpoints (20+ endpoints)

**Auth:** signup, login, me, update profile  
**Reports:** CRUD, vote, comment, nearby (PostGIS), heatmap data  
**Admin:** manage reports, update status, assign departments, analytics  
**Leaderboard:** top users, badges, community stats  
**Notifications:** list, mark read

---

## Phase 2 — AI/ML Pipeline (Days 5-6)

### Smart fallback approach:
```python
class AIService:
    """Falls back to rule-based if no API key configured"""
    
    def __init__(self):
        self.has_ai = bool(settings.GOOGLE_AI_API_KEY)
    
    async def verify_image(self, image_bytes, category):
        if self.has_ai:
            # Use Gemini Vision API
            return await self._gemini_verify(image_bytes, category)
        else:
            # Rule-based: check file size, type, basic validation
            return await self._rule_based_verify(image_bytes, category)
    
    async def route_report(self, description):
        if self.has_ai:
            return await self._llm_route(description)
        else:
            return self._keyword_route(description)  # Enhanced keyword matching
    
    async def detect_duplicates(self, lat, lon, category, db):
        # Always uses PostGIS — no AI needed
        return await self._postgis_nearby(lat, lon, category, db)
```

**Works fully offline** — AI API key is optional, rule-based fallback always available.

---

## Phase 3 — Next.js Frontend (Days 4-10, parallel with Phase 2)

### 3.1 Pages

| Page | Route | Key Features |
|------|-------|-------------|
| **Landing** | `/` | Hero, live stats, feature showcase, CTA |
| **Login/Signup** | `/login`, `/signup` | Email/password via local GoTrue |
| **Submit Report** | `/submit` | Multi-step: Category → Photo → GPS → Description → AI Preview |
| **Live Map** | `/map` | Leaflet + heatmap toggle + category filters + clusters |
| **My Reports** | `/reports` | User's reports with status timeline + filters |
| **Report Detail** | `/reports/[id]` | Map + comments + status history + voting |
| **Leaderboard** | `/leaderboard` | Animated rankings, badges, personal stats |
| **Profile** | `/profile` | User info, badges, contribution stats |
| **Admin Dashboard** | `/admin` | KPI cards, trend charts, category breakdown |
| **Admin Reports** | `/admin/reports` | Data table with bulk actions, assign dept |
| **Analytics** | `/admin/analytics` | Heatmap, time series, dept performance |

### 3.2 Component Library
- **UI primitives:** Button, Card, Input, Select, Badge, Modal, Skeleton, Toast, Avatar
- **Layout:** Navbar, BottomNav (mobile), Sidebar (admin), Footer
- **Reports:** ReportCard, ReportForm, StatusBadge, StatusTimeline, VoteButton
- **Map:** MapView, MapMarker, HeatmapLayer, LocationPicker
- **Dashboard:** StatCard, TrendChart, CategoryPie, DepartmentTable

### 3.3 Design System
- Custom color palette (civic blue, emerald success, rose danger, amber warning)
- `Inter` + `Outfit` fonts via Google Fonts
- Glassmorphism cards, smooth gradients, micro-animations
- Framer Motion for page transitions
- Dark mode support
- Mobile-first responsive design

---

## Phase 4 — Enhanced Features (Days 8-13)

| Feature | What It Adds |
|---------|-------------|
| 🗳️ **Community Voting** | Upvote/downvote reports, priority bubbling |
| 💬 **Comments** | Citizen + official discussion threads |
| 🏆 **Gamification** | Points (10 per report, 20 per resolution), badges (Newcomer → Legend), streaks |
| 📊 **Analytics** | Recharts: trend lines, pie charts, resolution rates, response times |
| 🔔 **Notifications** | In-app bell icon, status change alerts |
| 📸 **Before/After** | Resolution photos with side-by-side comparison |
| 📍 **Reverse Geocoding** | Auto-fill address from GPS (Nominatim — free, local-friendly) |
| 🗺️ **Heatmap** | Leaflet.heat overlay showing issue density |
| 🏷️ **Departments** | Auto-assign reports by category, department performance tracking |
| 🔍 **Search & Filter** | Full-text search, status/category/date/location filters |

---

## Phase 5 — Local DevOps & Polish (Days 12-14)

### 5.1 One-Command Setup
```bash
# Clone → Run. That's it.
git clone <repo>
cp .env.example .env
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000/docs
# DB:       localhost:54322
```

### 5.2 Dev Tooling
- Hot reload on both frontend (Next.js) and backend (uvicorn --reload)
- Alembic migrations: `docker-compose exec backend alembic upgrade head`
- DB admin via any PostgreSQL client on `localhost:54322`
- API docs auto-generated at `localhost:8000/docs` (Swagger UI)

### 5.3 Seed Data Script
```python
# backend/seed.py — Populate with demo data
# Creates: 3 departments, 5 users, 20 sample reports, badges
```

### 5.4 Security (Local-appropriate)
- CORS restricted to `localhost:3000`
- Rate limiting (slowapi)
- Input validation (Pydantic V2)
- File upload limits (10MB, images only)
- JWT verification
- Role-based route guards

---

## 📅 Timeline

| Phase | Duration | What |
|-------|----------|------|
| **0** | Day 1 | Docker compose + local Supabase + project structure |
| **1** | Days 2-4 | DB schema + ORM + migrations + backend restructure |
| **2** | Days 5-6 | AI service (with offline fallback) |
| **3** | Days 4-10 | Next.js frontend (all pages + components) |
| **4** | Days 8-13 | Voting, comments, gamification, analytics |
| **5** | Days 12-14 | Polish, seed data, docs |
| **Total** | **~14 days** | |

---

## 🎯 Priority Order

### 🔴 P0 — Core (Must have)
1. Local Docker stack (Postgres + GoTrue + FastAPI + Next.js)
2. DB schema + Alembic migrations
3. Auth (signup/login/JWT middleware)
4. Report CRUD + local image upload
5. PostGIS location queries
6. All frontend pages (landing through admin)

### 🟡 P1 — Differentiators
7. Voting + comments
8. Gamification (points, badges, leaderboard)
9. Analytics charts (recharts)
10. Heatmap overlay
11. Notifications

### 🟢 P2 — Nice to have
12. Before/After resolution photos
13. AI image verification (Gemini)
14. Dark mode
15. PWA / offline support
16. Multi-language (i18n)

---

## 🐛 Bugs to Fix During Migration

1. `main.py` — duplicate imports & double `app = FastAPI()` (lines 1-17 repeat 19-40)
2. `SubmitReport.tsx` — duplicate `type="button"` attribute (lines 136 & 139)
3. `civicflow.db` — SQLite file should be gitignored
4. Leaderboard — 100% hardcoded mock data
5. Images — read but never saved
6. No pagination on `GET /reports`
7. `allow_origins=["*"]` — open CORS
8. `/admin` — no auth guard

---

*Ready to start building? Say "go" and I'll begin with Phase 0!*
