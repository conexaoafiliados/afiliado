-- Programa de afiliados: desafios, regras de pontos, pontos por produto e materiais.
-- Execute no SQL Editor do Supabase. Aditivo e idempotente.
-- Não mexe nas missões de crescimento já existentes.

CREATE TABLE IF NOT EXISTS affiliate_challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  "brandId" INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  "instagramHandle" VARCHAR(100) NOT NULL,
  "startsAt" TIMESTAMPTZ,
  "endsAt" TIMESTAMPTZ,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_challenges_status_check CHECK (status IN ('active', 'ended'))
);

CREATE INDEX IF NOT EXISTS idx_affiliate_challenges_status ON affiliate_challenges (status, "endsAt");

CREATE TABLE IF NOT EXISTS affiliate_point_rules (
  id INTEGER PRIMARY KEY DEFAULT 1,
  "storyPoints" INTEGER NOT NULL DEFAULT 10,
  "feedPoints" INTEGER NOT NULL DEFAULT 5,
  "reelPoints" INTEGER NOT NULL DEFAULT 10,
  "salePoints" INTEGER NOT NULL DEFAULT 15,
  "redeemMinPoints" INTEGER NOT NULL DEFAULT 100,
  "redeemMinSales" INTEGER NOT NULL DEFAULT 5,
  "redeemItemLimit" INTEGER NOT NULL DEFAULT 1,
  "redeemDays" INTEGER NOT NULL DEFAULT 15,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_point_rules_singleton CHECK (id = 1)
);

INSERT INTO affiliate_point_rules (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS affiliate_product_points (
  "brandProductId" INTEGER PRIMARY KEY REFERENCES brand_products(id) ON DELETE CASCADE,
  "pointsCost" INTEGER NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_product_points_nonnegative CHECK ("pointsCost" >= 0)
);

CREATE TABLE IF NOT EXISTS affiliate_materials (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  "fileUrl" VARCHAR(1024) NOT NULL,
  "mimeType" VARCHAR(80),
  "sizeBytes" INTEGER,
  kind VARCHAR(24) NOT NULL DEFAULT 'imagem',
  "brandId" INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_materials_created ON affiliate_materials ("createdAt" DESC);
