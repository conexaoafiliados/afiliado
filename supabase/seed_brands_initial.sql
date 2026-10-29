-- Conexões Creators — registros iniciais editáveis de marcas (Lizin e Xiclé)
-- Execute DEPOIS de supabase/migration_movimento_etapa1.sql. Idempotente.
--
-- Somente informações confirmadas nos documentos de referência:
--   * Lizin: nome, conceito de comunicação "Liso no seu tempo" e o fato de ser uma marca
--     de produtos capilares. Os documentos NÃO trazem nome/formato de produto, composição,
--     logo, capa, cor nem condições comerciais — por isso não há produto cadastrado e
--     alegações de benefício ("sem formol", "reduz volume" etc.) ficaram de fora.
--   * Xiclé: nome, conceito "A vida passa. O cheiro fica." e o produto atual
--     (Body Splash 150 ml). Fragrâncias futuras, benefícios sugeridos, pontuações e
--     campanhas ilustrativas dos documentos NÃO foram cadastrados.
-- Tudo entra como RASCUNHO: nada aparece publicamente até a equipe completar e publicar.

INSERT INTO brands (slug, name, "communicationConcept", description, status, "sortOrder")
VALUES
  ('lizin', 'Lizin', 'Liso no seu tempo', 'Marca de produtos capilares.', 'draft', 1),
  ('xicle', 'Xiclé', 'A vida passa. O cheiro fica.', 'Marca de body splash.', 'draft', 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brand_products ("brandId", slug, name, category, description, status, "sortOrder")
SELECT b.id, 'body-splash-150ml', 'Xiclé Body Splash 150 ml', 'Body splash', 'Body splash de 150 ml.', 'draft', 1
FROM brands b
WHERE b.slug = 'xicle'
ON CONFLICT ("brandId", slug) DO NOTHING;
