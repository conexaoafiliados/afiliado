-- Sistema de seguir creators (estilo Instagram)
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  "followerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "followingId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("followerId", "followingId"),
  CHECK ("followerId" <> "followingId")
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows ("followerId");
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows ("followingId");

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE 'user_follow';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
