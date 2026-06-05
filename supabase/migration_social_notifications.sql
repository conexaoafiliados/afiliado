-- Comunidade: curtidas reais + notificações
-- Execute no SQL Editor do Supabase

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('post_like', 'post_comment', 'mention', 'goal_unlock');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("postId", "userId")
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "actorUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(512),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications ("userId", read, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes ("postId");
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments ("postId");
