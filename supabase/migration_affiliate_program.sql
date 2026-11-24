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

-- Preço e comissão de venda (checkout InfinitePay). Não altera o produto da marca.
CREATE TABLE IF NOT EXISTS affiliate_sale_products (
  "brandProductId" INTEGER PRIMARY KEY REFERENCES brand_products(id) ON DELETE CASCADE,
  "priceCents" INTEGER NOT NULL,
  "compareAtCents" INTEGER,
  "commissionCents" INTEGER NOT NULL DEFAULT 0,
  promo BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_sale_products_price_check CHECK ("priceCents" > 0),
  CONSTRAINT affiliate_sale_products_commission_check CHECK ("commissionCents" >= 0)
);

CREATE TABLE IF NOT EXISTS affiliate_orders (
  id SERIAL PRIMARY KEY,
  "orderNsu" VARCHAR(64) NOT NULL,
  "brandProductId" INTEGER NOT NULL REFERENCES brand_products(id) ON DELETE RESTRICT,
  "affiliateUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "amountCents" INTEGER NOT NULL,
  "commissionCents" INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  "checkoutUrl" VARCHAR(1024),
  "transactionNsu" VARCHAR(80),
  "invoiceSlug" VARCHAR(80),
  "captureMethod" VARCHAR(32),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "paidAt" TIMESTAMPTZ,
  CONSTRAINT affiliate_orders_nsu_key UNIQUE ("orderNsu"),
  CONSTRAINT affiliate_orders_status_check CHECK (status IN ('pending', 'paid', 'canceled', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_affiliate_orders_affiliate ON affiliate_orders ("affiliateUserId", status);

ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS "couponCode" VARCHAR(32);

-- Co-produção: quem recebe derramamento em cada venda do produto.
CREATE TABLE IF NOT EXISTS affiliate_coproducers (
  id SERIAL PRIMARY KEY,
  "brandProductId" INTEGER NOT NULL REFERENCES brand_products(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "amountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_coproducers_amount_check CHECK ("amountCents" > 0),
  CONSTRAINT affiliate_coproducers_unique UNIQUE ("brandProductId", "userId")
);

CREATE TABLE IF NOT EXISTS affiliate_coupons (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_coupons_user_key UNIQUE ("userId"),
  CONSTRAINT affiliate_coupons_code_key UNIQUE (code),
  CONSTRAINT affiliate_coupons_discount_check CHECK ("discountPercent" >= 0 AND "discountPercent" < 100)
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(120) NOT NULL,
  destination VARCHAR(16) NOT NULL,
  "brandProductId" INTEGER REFERENCES brand_products(id) ON DELETE CASCADE,
  note VARCHAR(40),
  custom BOOLEAN NOT NULL DEFAULT FALSE,
  clicks INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_links_destination_check CHECK (destination IN ('loja', 'produto'))
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON affiliate_links ("userId", "createdAt");

CREATE TABLE IF NOT EXISTS affiliate_order_shares (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES affiliate_orders(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,
  "amountCents" INTEGER NOT NULL,
  CONSTRAINT affiliate_order_shares_role_check CHECK (role IN ('affiliate', 'coproducer')),
  CONSTRAINT affiliate_order_shares_unique UNIQUE ("orderId", "userId", role)
);
