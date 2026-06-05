-- Respostas a comentários no feed
-- Execute no SQL Editor do Supabase

ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS "parentCommentId" INTEGER REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments ("parentCommentId");
