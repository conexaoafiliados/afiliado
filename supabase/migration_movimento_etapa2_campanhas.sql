-- Conexões Creators — Etapa 2: campanhas, candidaturas e entregas
-- Execute no SQL Editor do Supabase DEPOIS de migration_movimento_etapa1.sql.
-- ADITIVA e idempotente. Não altera tabelas de marcas/produtos/loja legada.

-- ---------------------------------------------------------------------------
-- Campanhas (vinculadas a UMA marca; produtos via campaign_products)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  "brandId" INTEGER NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  slug VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  "coverUrl" VARCHAR(512),
  briefing TEXT,
  "participationCriteria" TEXT,
  "expectedDeliverables" TEXT,
  "contentFormats" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "applicationOpensAt" TIMESTAMPTZ,
  "applicationClosesAt" TIMESTAMPTZ,
  "deliveryDeadline" TIMESTAMPTZ,
  "sampleConditions" TEXT,
  "commissionConditions" TEXT,
  "compensationConditions" TEXT,
  "requiresSampleAddress" BOOLEAN NOT NULL DEFAULT FALSE,
  "requiresRepostAuth" BOOLEAN NOT NULL DEFAULT FALSE,
  "requiresAdUsageAuth" BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMPTZ,
  "closedAt" TIMESTAMPTZ,
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaigns_status_check CHECK (status IN ('draft', 'published', 'closed')),
  CONSTRAINT campaigns_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT campaigns_formats_array CHECK (jsonb_typeof("contentFormats") = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_slug_key ON campaigns (slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_status ON campaigns ("brandId", status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_dates ON campaigns (status, "applicationOpensAt", "applicationClosesAt");

-- ---------------------------------------------------------------------------
-- Produtos da campanha (devem pertencer à mesma marca — validado no servidor)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_products (
  "campaignId" INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  "brandProductId" INTEGER NOT NULL REFERENCES brand_products(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("campaignId", "brandProductId")
);

CREATE INDEX IF NOT EXISTS idx_campaign_products_product ON campaign_products ("brandProductId");

-- ---------------------------------------------------------------------------
-- Candidaturas (uma por usuário por campanha)
-- sampleAddress só quando a campanha exige amostra; não vai para perfil público.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_applications (
  id SERIAL PRIMARY KEY,
  "campaignId" INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  message TEXT,
  "sampleAddress" JSONB,
  "allowRepost" BOOLEAN NOT NULL DEFAULT FALSE,
  "allowAdUsage" BOOLEAN NOT NULL DEFAULT FALSE,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "reviewedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_applications_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT campaign_applications_unique UNIQUE ("campaignId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_user ON campaign_applications ("userId", status);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign ON campaign_applications ("campaignId", status);

-- ---------------------------------------------------------------------------
-- Entregas (somente após aprovação da candidatura)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
  "contentUrl" VARCHAR(1024) NOT NULL,
  note TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'submitted',
  "revisionNote" TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reviewedAt" TIMESTAMPTZ,
  "reviewedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_deliveries_status_check CHECK (status IN ('submitted', 'changes_requested', 'approved')),
  CONSTRAINT campaign_deliveries_url_scheme CHECK ("contentUrl" ~* '^https?://'),
  CONSTRAINT campaign_deliveries_attempt_pos CHECK (attempt >= 1)
);

CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_application ON campaign_deliveries ("applicationId", "submittedAt" DESC);

-- ---------------------------------------------------------------------------
-- RLS: leitura pública só de campanhas PUBLICADAS (e produtos vinculados);
-- candidaturas/entregas/endereços: sem política = negado para anon/authenticated
-- via PostgREST. O servidor tRPC usa DATABASE_URL e aplica autorização.
-- ---------------------------------------------------------------------------
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campaigns_public_read ON campaigns;
CREATE POLICY campaigns_public_read ON campaigns
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR status = 'closed');

DROP POLICY IF EXISTS campaign_products_public_read ON campaign_products;
CREATE POLICY campaign_products_public_read ON campaign_products
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_products."campaignId"
        AND c.status IN ('published', 'closed')
    )
  );
