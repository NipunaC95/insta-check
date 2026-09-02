-- ==========================================================
-- Instagram Follower Insights - Database Schema
-- ==========================================================

-- 1. Table uploads: stores upload timestamp, optional label, and summary metrics
CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  label VARCHAR(255),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0
);

-- 2. Table followers: stores username, profile_url, linked to upload_id
CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  profile_url TEXT NOT NULL,
  profile_pic_url TEXT
);

-- 3. Table following: stores username, profile_url, linked to upload_id
CREATE TABLE IF NOT EXISTS following (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  profile_url TEXT NOT NULL,
  profile_pic_url TEXT
);

-- 4. Indexes for fast lookups & comparisons
CREATE INDEX IF NOT EXISTS idx_followers_upload_id ON followers(upload_id);
CREATE INDEX IF NOT EXISTS idx_followers_username ON followers(username);
CREATE INDEX IF NOT EXISTS idx_following_upload_id ON following(upload_id);
CREATE INDEX IF NOT EXISTS idx_following_username ON following(username);
