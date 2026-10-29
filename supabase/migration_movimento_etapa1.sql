-- Conexões Creators — Etapa 1: identidade do movimento, marcas e produtos
-- Execute no SQL Editor do Supabase. Totalmente ADITIVA e idempotente:
--   * não altera nem remove tabelas/colunas existentes (users, creator_profiles, products, product_orders…);
--   * pode ser reexecutada sem efeitos colaterais.
-- Ordem: este arquivo -> supabase/seed_brands_initial.sql (opcional).
-- Pré-requisito: tabela users (supabase/schema.sql + migration_auth_fields.sql).

-- ---------------------------------------------------------------------------
-- Marcas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  "logoUrl" VARCHAR(512),
  "coverUrl" VARCHAR(512),
  description TEXT,
  "communicationConcept" VARCHAR(255),
  "accentColor" VARCHAR(7),
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT brands_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT brands_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT brands_accent_check CHECK ("accentColor" IS NULL OR "accentColor" ~ '^#[0-9a-fA-F]{6}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS brands_slug_key ON brands (slug);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands (status, "sortOrder");

-- ---------------------------------------------------------------------------
-- Produtos de marca (apresentados em campanhas). NÃO substitui a tabela legada
-- "products" (marketplace de creators ligado a product_orders/Stripe).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_products (
  id SERIAL PRIMARY KEY,
  "brandId" INTEGER NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  category VARCHAR(80),
  "imageUrls" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "usageGuidelines" TEXT,
  "approvedInfo" TEXT,
  "referenceMaterials" JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT brand_products_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT brand_products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT brand_products_images_array CHECK (jsonb_typeof("imageUrls") = 'array'),
  CONSTRAINT brand_products_materials_array CHECK (jsonb_typeof("referenceMaterials") = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS brand_products_brand_slug_key ON brand_products ("brandId", slug);
CREATE INDEX IF NOT EXISTS idx_brand_products_brand ON brand_products ("brandId", status, "sortOrder");

-- ---------------------------------------------------------------------------
-- Ofertas de compra por canal (links oficiais). Não implica estoque, pagamento
-- ou entrega gerenciados pelo app.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_product_offers (
  id SERIAL PRIMARY KEY,
  "brandProductId" INTEGER NOT NULL REFERENCES brand_products(id) ON DELETE CASCADE,
  channel VARCHAR(32) NOT NULL DEFAULT 'outro',
  label VARCHAR(120),
  url VARCHAR(1024) NOT NULL,
  notes TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT brand_product_offers_url_scheme CHECK (url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_brand_product_offers_product ON brand_product_offers ("brandProductId", "isActive");

-- ---------------------------------------------------------------------------
-- Interesses do creator (podem ser alterados depois; não concedem permissões)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_interests (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", interest)
);

CREATE TABLE IF NOT EXISTS user_brand_interests (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "brandId" INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "brandId")
);

-- Marca quando o creator salvou preferências ao menos uma vez (inclusive "nenhuma").
CREATE TABLE IF NOT EXISTS creator_preferences (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "interestsSavedAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests ("userId");
CREATE INDEX IF NOT EXISTS idx_user_brand_interests_user ON user_brand_interests ("userId");
CREATE INDEX IF NOT EXISTS idx_user_brand_interests_brand ON user_brand_interests ("brandId");

-- ---------------------------------------------------------------------------
-- RLS (defesa em profundidade)
-- O servidor (tRPC + DATABASE_URL, papel postgres) ignora RLS e aplica as regras de
-- autorização nos procedimentos. Estas políticas protegem o acesso direto via
-- PostgREST/anon key: só conteúdo PUBLICADO é legível; escrita só pelo servidor.
-- Tabelas de preferências ficam sem política = negadas para anon/authenticated.
-- ---------------------------------------------------------------------------
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brands_public_read ON brands;
CREATE POLICY brands_public_read ON brands
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS brand_products_public_read ON brand_products;
CREATE POLICY brand_products_public_read ON brand_products
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM brands b WHERE b.id = brand_products."brandId" AND b.status = 'published')
  );

DROP POLICY IF EXISTS brand_product_offers_public_read ON brand_product_offers;
CREATE POLICY brand_product_offers_public_read ON brand_product_offers
  FOR SELECT TO anon, authenticated
  USING (
    "isActive" = TRUE
    AND EXISTS (
      SELECT 1
      FROM brand_products p
      JOIN brands b ON b.id = p."brandId"
      WHERE p.id = brand_product_offers."brandProductId"
        AND p.status = 'published'
        AND b.status = 'published'
    )
  );
