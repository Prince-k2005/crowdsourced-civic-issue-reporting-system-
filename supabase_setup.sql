-- ========================================
-- CivicFlow — Supabase Database Setup
-- ========================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates all tables needed for the CivicFlow app.
-- Only run ONCE when setting up the project.

-- ── Profiles (extends Supabase auth.users) ──
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,  -- matches auth.users.id
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'citizen',
    phone TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    reports_count INTEGER NOT NULL DEFAULT 0,
    badge_level TEXT NOT NULL DEFAULT 'newcomer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Departments ──
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    head_user_id TEXT REFERENCES profiles(id),
    contact_email TEXT,
    auto_assign_categories JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reports ──
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES profiles(id),
    title TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    ward TEXT,
    ai_category TEXT,
    ai_confidence DOUBLE PRECISION,
    ai_urgency TEXT,
    ai_detected_objects JSONB DEFAULT '[]',
    ai_description_summary TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_department_id INTEGER REFERENCES departments(id),
    assigned_to_id TEXT REFERENCES profiles(id),
    urgency TEXT NOT NULL DEFAULT 'medium',
    image_urls JSONB DEFAULT '[]',
    resolution_image_url TEXT,
    upvote_count INTEGER NOT NULL DEFAULT 0,
    downvote_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    resolution_comment TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by_id TEXT REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Votes ──
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- ── Comments ──
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Status History ──
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by_id TEXT REFERENCES profiles(id),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    report_id TEXT REFERENCES reports(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Badges ──
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    points_required INTEGER DEFAULT 0,
    reports_required INTEGER DEFAULT 0
);

-- ── User Badges ──
CREATE TABLE IF NOT EXISTS user_badges (
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- ── Indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ── Seed initial badges ──
INSERT INTO badges (name, description, icon, points_required, reports_required) VALUES
    ('Newcomer', 'Welcome to CivicFlow!', '🌱', 0, 0),
    ('Active Citizen', 'Reached 50 points', '🏃', 50, 3),
    ('Community Hero', 'Reached 200 points', '🦸', 200, 10),
    ('City Champion', 'Reached 500 points', '🏆', 500, 25),
    ('Legend', 'Reached 1000 points', '⭐', 1000, 50)
ON CONFLICT (name) DO NOTHING;

-- ── Seed departments ──
INSERT INTO departments (name, slug, auto_assign_categories) VALUES
    ('Infrastructure & Roads', 'infrastructure', '["pothole", "public_works"]'),
    ('Sanitation & Waste', 'sanitation', '["sanitation"]'),
    ('Street Lighting', 'lighting', '["lighting"]'),
    ('Water & Drainage', 'water', '["water", "drainage"]')
ON CONFLICT (name) DO NOTHING;

-- ── Enable RLS (Row Level Security) ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Allow full access (our backend connects with the DB password, bypassing RLS,
-- but these policies ensure the Supabase dashboard and client also work)
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_reports" ON reports;
DROP POLICY IF EXISTS "allow_all_comments" ON comments;
DROP POLICY IF EXISTS "allow_all_votes" ON votes;
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;

CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_votes" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

SELECT 'CivicFlow database setup complete! ✅' AS result;
