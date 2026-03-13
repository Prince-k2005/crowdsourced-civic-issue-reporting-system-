# CivicFlow

AI-driven civic issue reporting platform with:
- FastAPI backend
- Next.js frontend
- Supabase Auth + Postgres

## Features

- User signup/login with Supabase
- Submit civic issues with location and image
- Vote and comment on reports
- Admin dashboard for status updates and department assignment
- Notifications and leaderboard

## Tech Stack

- Backend: FastAPI, SQLAlchemy (async), asyncpg, Uvicorn
- Frontend: Next.js 14, React, Tailwind CSS, Zustand
- Database/Auth: Supabase Postgres + Supabase Auth

## Prerequisites

Install these first:
- Python 3.10+
- Node.js 18+
- npm
- Git

Optional:
- Docker + Docker Compose

## 1) Clone and open

```bash
git clone <your-repo-url>
cd crowdsource
```

## 2) Environment setup

Create env file from template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then update `.env` with your real Supabase values:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`

Also ensure these are set:
- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_SUPABASE_URL=<same as SUPABASE_URL>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as SUPABASE_ANON_KEY>`

## 3) Backend run (local)

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run at:
- http://localhost:8000
- http://localhost:8000/docs

## 4) Frontend run (local)

Open another terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Frontend will run at:
- http://localhost:3000

## 5) Quick health check

From project root:

```powershell
python verify_project.py
```

Expected:
- `/health` returns OK
- `/api/leaderboard/stats` returns data

## 6) Run with Docker (optional)

From project root:

```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Demo/Admin Accounts

If your `.env` includes these values, use:

- Admin:
  - Email: `admin@civicflow.local`
  - Password: `admin123456`
- Demo user:
  - Email: `demo@civicflow.local`
  - Password: `demo123456`

## Project Structure

```text
backend/     FastAPI API
frontend/    Next.js app
uploads/     Uploaded report images (runtime)
```

## Common Issues

- 401 Unauthorized:
  - Check Supabase keys and JWT secret in `.env`
- Database connection errors:
  - Verify `DATABASE_URL` and SSL requirements for Supabase
- Frontend cannot reach backend:
  - Ensure `NEXT_PUBLIC_API_URL=http://localhost:8000`

## Security Notes

- Never commit `.env` to git.
- Rotate keys immediately if exposed publicly.
