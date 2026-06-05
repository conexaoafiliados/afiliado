-- Curtidas e comentários em aulas de aprendizado (ex.: Seu primeiro passo)
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS lesson_likes (
  id SERIAL PRIMARY KEY,
  "lessonSlug" VARCHAR(128) NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("lessonSlug", "userId")
);

CREATE TABLE IF NOT EXISTS lesson_comments (
  id SERIAL PRIMARY KEY,
  "lessonSlug" VARCHAR(128) NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "parentCommentId" INTEGER REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_likes_slug ON lesson_likes ("lessonSlug");
CREATE INDEX IF NOT EXISTS idx_lesson_comments_slug ON lesson_comments ("lessonSlug");
CREATE INDEX IF NOT EXISTS idx_lesson_comments_parent ON lesson_comments ("parentCommentId");
