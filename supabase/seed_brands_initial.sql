-- Conexões Creators — registros iniciais de marcas e produtos (Lizin e Xiclé)
-- Execute DEPOIS de supabase/migration_movimento_etapa1.sql.
--
-- Fontes confirmadas (sites oficiais):
--   * https://lizintotal.com/  — máscara redutora 300ml e 500ml, sem formol, pH 2.5
--   * https://xicleevc.com/    — Body Splash Tutti-Fruti 150ml
-- Logos locais (fundo removido): /brands/lizin-logo.png e /brands/xicle-logo.png
--
-- Idempotente: atualiza registros existentes pelo slug (não duplica).
-- Status: published para você visualizar em /marcas. Pode voltar a rascunho no painel.

-- ---------------------------------------------------------------------------
-- Marcas
-- ---------------------------------------------------------------------------
INSERT INTO brands (
  slug, name, "communicationConcept", description, "logoUrl", "accentColor", status, "sortOrder", "publishedAt"
) VALUES
  (
    'lizin',
    'Lizin',
    'Liso no seu tempo',
    'Máscara redutora de volume para alisar em casa. Sem formol, pH 2.5. Disponível em 300ml e 500ml.',
    '/brands/lizin-logo.png',
    '#00BFFF',
    'published',
    1,
    NOW()
  ),
  (
    'xicle',
    'Xiclé',
    'A vida passa. O cheiro fica.',
    'Marca de body splash. Cheiro que vira memória.',
    '/brands/xicle-logo.png',
    '#FF2D8A',
    'published',
    2,
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "communicationConcept" = EXCLUDED."communicationConcept",
  description = EXCLUDED.description,
  "logoUrl" = EXCLUDED."logoUrl",
  "accentColor" = EXCLUDED."accentColor",
  status = EXCLUDED.status,
  "sortOrder" = EXCLUDED."sortOrder",
  "publishedAt" = COALESCE(brands."publishedAt", EXCLUDED."publishedAt"),
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Produtos Lizin
-- ---------------------------------------------------------------------------
INSERT INTO brand_products (
  "brandId", slug, name, category, description, "usageGuidelines", "approvedInfo", status, "sortOrder", "publishedAt"
)
SELECT b.id, v.slug, v.name, v.category, v.description, v.usage, v.approved, 'published', v.sort_order, NOW()
FROM brands b
CROSS JOIN (VALUES
  (
    'mascara-redutora-300ml',
    'Lizin Máscara Redutora 300ml',
    'Máscara redutora',
    'Máscara redutora de volume em frasco de 300ml. Indicada para testar no seu cabelo. Sem formol. pH 2.5.',
    '1) Lave o cabelo e retire o excesso de água com a toalha.
2) Aplique mecha por mecha, da raiz às pontas. Deixe agir o tempo indicado no rótulo.
3) Seque com escova e passe a prancha para selar. Faça o teste de mecha antes da aplicação completa.',
    'Máscara redutora de volume. Sem formol. pH 2.5. Reduz volume e frizz e alinha os fios. Resultados podem variar conforme o tipo de cabelo.',
    1
  ),
  (
    'mascara-redutora-500ml',
    'Lizin Máscara Redutora 500ml',
    'Máscara redutora',
    'Máscara redutora de volume em frasco de 500ml, tamanho que rende mais. Sem formol. pH 2.5.',
    '1) Lave o cabelo e retire o excesso de água com a toalha.
2) Aplique mecha por mecha, da raiz às pontas. Deixe agir o tempo indicado no rótulo.
3) Seque com escova e passe a prancha para selar. Faça o teste de mecha antes da aplicação completa.',
    'Máscara redutora de volume. Sem formol. pH 2.5. Reduz volume e frizz e alinha os fios. Resultados podem variar conforme o tipo de cabelo.',
    2
  )
) AS v(slug, name, category, description, usage, approved, sort_order)
WHERE b.slug = 'lizin'
ON CONFLICT ("brandId", slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  "usageGuidelines" = EXCLUDED."usageGuidelines",
  "approvedInfo" = EXCLUDED."approvedInfo",
  status = EXCLUDED.status,
  "sortOrder" = EXCLUDED."sortOrder",
  "publishedAt" = COALESCE(brand_products."publishedAt", EXCLUDED."publishedAt"),
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Produto Xiclé
-- ---------------------------------------------------------------------------
INSERT INTO brand_products (
  "brandId", slug, name, category, description, "usageGuidelines", "approvedInfo", status, "sortOrder", "publishedAt"
)
SELECT b.id,
  'body-splash-tutti-fruti-150ml',
  'Xiclé Body Splash Tutti-Fruti 150ml',
  'Body splash',
  'Body splash tutti-fruti de 150ml. Notas de banana, laranja, maçã verde e uva. Cheiro que vira memória.',
  '1) Prefira pele hidratada (hidratante sem perfume após o banho).
2) Borrife a um palmo de distância nos pontos de calor: pescoço, colo, pulsos e atrás dos joelhos.
3) Pode aplicar também no cabelo e na roupa.
4) Reaplique ao longo do dia, se desejar. Produto de uso externo. A fixação varia conforme o tipo de pele.',
  'Body splash tutti-fruti 150ml. Notas: banana, laranja, maçã verde e uva. Mais leve que um perfume, feito para borrifar e retocar. Fixação prolongada conforme o tipo de pele.',
  'published',
  1,
  NOW()
FROM brands b
WHERE b.slug = 'xicle'
ON CONFLICT ("brandId", slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  "usageGuidelines" = EXCLUDED."usageGuidelines",
  "approvedInfo" = EXCLUDED."approvedInfo",
  status = EXCLUDED.status,
  "sortOrder" = EXCLUDED."sortOrder",
  "publishedAt" = COALESCE(brand_products."publishedAt", EXCLUDED."publishedAt"),
  "updatedAt" = NOW();

-- Remove o slug antigo genérico da Xiclé, se existir de um seed anterior
DELETE FROM brand_products p
USING brands b
WHERE p."brandId" = b.id
  AND b.slug = 'xicle'
  AND p.slug = 'body-splash-150ml';

-- ---------------------------------------------------------------------------
-- Ofertas / links oficiais de compra (o app NÃO processa pagamento dessas ofertas)
-- ---------------------------------------------------------------------------
INSERT INTO brand_product_offers ("brandProductId", channel, label, url, notes, "isActive", "sortOrder")
SELECT p.id, 'site_oficial', 'Comprar no site oficial', v.url, v.notes, TRUE, 1
FROM brand_products p
JOIN brands b ON b.id = p."brandId"
JOIN (VALUES
  ('lizin', 'mascara-redutora-300ml', 'https://lizintotal.com/', 'Link da loja oficial Lizin'),
  ('lizin', 'mascara-redutora-500ml', 'https://lizintotal.com/', 'Link da loja oficial Lizin'),
  ('xicle', 'body-splash-tutti-fruti-150ml', 'https://xicleevc.com/', 'Link da loja oficial Xiclé')
) AS v(brand_slug, product_slug, url, notes)
  ON b.slug = v.brand_slug AND p.slug = v.product_slug
WHERE NOT EXISTS (
  SELECT 1 FROM brand_product_offers o
  WHERE o."brandProductId" = p.id AND o.url = v.url
);
