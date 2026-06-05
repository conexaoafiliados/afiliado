-- Execute no Supabase SQL Editor (após migration_auth_fields.sql)

ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "tiktokOpenId" VARCHAR(64);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "tiktokAccessToken" TEXT;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "tiktokRefreshToken" TEXT;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "tiktokTokenExpiresAt" TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "tiktokLinkedAt" TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "tiktokDisplayName" VARCHAR(120);

ALTER TABLE follower_progress ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';
ALTER TABLE follower_progress ADD COLUMN IF NOT EXISTS "tiktokLastSyncAt" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS follower_history (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followers INTEGER NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follower_history_user_recorded
  ON follower_history ("userId", "recordedAt" DESC);
