-- Painel admin e permissões delegáveis
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(64) NOT NULL,
  "grantedBy" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions ("userId");
