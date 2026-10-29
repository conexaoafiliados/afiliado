-- Conexões Creators — Instagram OAuth + métricas sociais (TikTok/Instagram)
-- Execute no SQL Editor do Supabase. ADITIVA e idempotente.
-- Não altera pedidos/Stripe. complementary a migration_tiktok_integration.sql.

-- ---------------------------------------------------------------------------
-- Campos OAuth Instagram no perfil (espelha TikTok)
-- ---------------------------------------------------------------------------
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "instagramUserId" VARCHAR(64);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "instagramPageId" VARCHAR(64);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "instagramAccessToken" TEXT;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "instagramTokenExpiresAt" TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "instagramLinkedAt" TIMESTAMPTZ;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "instagramDisplayName" VARCHAR(120);

-- ---------------------------------------------------------------------------
-- Métricas por rede (API). Separadas da jornada de seguidores e da comunidade.
-- views/comments podem ficar 0 até a permissão de listagem de mídia ser concedida.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_social_stats (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(16) NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  "mediaCount" INTEGER NOT NULL DEFAULT 0,
  "lastSyncAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_social_stats_platform_check CHECK (platform IN ('tiktok', 'instagram')),
  CONSTRAINT creator_social_stats_unique UNIQUE ("userId", platform)
);

CREATE INDEX IF NOT EXISTS idx_creator_social_stats_user ON creator_social_stats ("userId");
