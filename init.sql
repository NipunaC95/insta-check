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

-- 4. Table unfollowed_users: tracks accounts marked as unfollowed
CREATE TABLE IF NOT EXISTS unfollowed_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  unfollowed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table not_found_users: tracks accounts marked as account not found
CREATE TABLE IF NOT EXISTS not_found_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table false_positive_users: tracks accounts marked as false positive
CREATE TABLE IF NOT EXISTS false_positive_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Indexes for fast lookups & comparisons
CREATE INDEX IF NOT EXISTS idx_followers_upload_id ON followers(upload_id);
CREATE INDEX IF NOT EXISTS idx_followers_username ON followers(username);
CREATE INDEX IF NOT EXISTS idx_following_upload_id ON following(upload_id);
CREATE INDEX IF NOT EXISTS idx_following_username ON following(username);
CREATE INDEX IF NOT EXISTS idx_unfollowed_username ON unfollowed_users(username);
CREATE INDEX IF NOT EXISTS idx_not_found_username ON not_found_users(username);
CREATE INDEX IF NOT EXISTS idx_false_positive_username ON false_positive_users(username);


