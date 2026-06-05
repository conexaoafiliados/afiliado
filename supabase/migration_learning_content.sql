-- Trilhas de aprendizado (Se aprofunde, etc.)
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS learning_tracks (
  slug VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  emoji VARCHAR(16),
  "welcomeEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS learning_sections (
  id SERIAL PRIMARY KEY,
  "trackSlug" VARCHAR(64) NOT NULL REFERENCES learning_tracks(slug) ON DELETE CASCADE,
  slug VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  "sectionNumber" INTEGER,
  "sortOrder" INTEGER NOT NULL,
  UNIQUE ("trackSlug", slug)
);

CREATE TABLE IF NOT EXISTS learning_lessons (
  id SERIAL PRIMARY KEY,
  "sectionId" INTEGER NOT NULL REFERENCES learning_sections(id) ON DELETE CASCADE,
  slug VARCHAR(128) NOT NULL UNIQUE,
  "lessonLabel" VARCHAR(32),
  title VARCHAR(255) NOT NULL,
  "durationSeconds" INTEGER,
  "youtubeVideoId" VARCHAR(128),
  "sortOrder" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_sections_track ON learning_sections ("trackSlug");
CREATE INDEX IF NOT EXISTS idx_learning_lessons_section ON learning_lessons ("sectionId");

-- Trilha: Se aprofunde
INSERT INTO learning_tracks (slug, title, emoji, "welcomeEnabled", "sortOrder")
VALUES ('aprofunde', 'Se aprofunde', '📚', TRUE, 2)
ON CONFLICT (slug) DO NOTHING;

-- Seção 1
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'boas-vindas', '1) Boas Vindas (Comece aqui)', 1, 1)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('primeiros-passos', '1.1', 'Primeiros Passos', 109, 1),
  ('mentalidade-lucrativa', '1.2', 'Mentalidade lucrativa', 207, 2),
  ('historias-de-sucesso', '1.3', 'Histórias de sucesso', 159, 3)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'boas-vindas'
ON CONFLICT (slug) DO NOTHING;

-- Seção 2
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'sobre-tiktok-shop', '2) Sobre o TikTok Shop', 2, 2)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('o-que-e-tiktok-shop', '2.1', 'O que é TikTok Shop', 64, 1),
  ('oportunidade-unica', '2.2', 'Oportunidade única', 48, 2)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'sobre-tiktok-shop'
ON CONFLICT (slug) DO NOTHING;

-- Seção 3
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'como-comecar', '3) Como começar', 3, 3)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('ative-sua-conta-tiktok-shop', '3.1', 'Ative sua conta no TikTok Shop (requisitos)', 67, 1),
  ('como-alcancar-5000-seguidores', '3.2', 'Como alcançar 5.000 seguidores', 130, 2),
  ('tiktok-shop-studio', '3.3', 'TikTok Shop Studio', 88, 3),
  ('explicando-termos-comuns', '3.4', 'Explicando termos comuns', 102, 4)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'como-comecar'
ON CONFLICT (slug) DO NOTHING;

-- Seção 4
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'comece-a-vender', '4) Comece a vender hoje mesmo', 4, 4)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('como-funciona', '4.1', 'Como funciona', 52, 1),
  ('como-encontrar-bons-produtos', '4.2', 'Como encontrar bons produtos', 189, 2),
  ('tudo-sobre-sua-vitrine', '4.3', 'Tudo sobre sua Vitrine', 94, 3),
  ('como-ganhar-produtos-de-graca', '4.4', 'Como ganhar produtos DE GRAÇA', 207, 4),
  ('venda-mesmo-sem-amostras', '4.5', 'Venda mesmo sem ter amostras', 89, 5),
  ('como-linkar-produto-no-video', '4.6', 'Como "Linkar" o produto no seu vídeo', 52, 6),
  ('estrutura-produto-viral-lucrativo', '4.7', 'A estrutura de um produto viral e lucrativo', 107, 7)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'comece-a-vender'
ON CONFLICT (slug) DO NOTHING;

-- Seção 5
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'violacoes', '5) Violações', 5, 5)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('aprenda-normas-tiktok-shop', '5.1', 'Aprenda as normas do TikTok Shop', 249, 1)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'violacoes'
ON CONFLICT (slug) DO NOTHING;

-- Seção 6
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'criacao-de-conteudo', '6) Criação de conteúdo', 6, 6)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('jeito-certo-de-gravar', '6.1', 'O jeito certo de gravar', 128, 1),
  ('jeito-certo-de-editar', '6.2', 'O jeito certo de editar', 91, 2),
  ('nao-cometa-estes-erros', '6.3', 'Não cometa estes erros', 119, 3)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'criacao-de-conteudo'
ON CONFLICT (slug) DO NOTHING;

-- Seção 7
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'trabalhar-com-marcas', '7) Como trabalhar com marcas', 7, 7)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('convites-de-colaboracao', '7.1', 'Convites de colaboração', 86, 1),
  ('como-impulsionar-seus-videos', '7.2', 'Como impulsionar seus vídeos', 148, 2)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'trabalhar-com-marcas'
ON CONFLICT (slug) DO NOTHING;

-- Seção 8
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'lives', '8) Lives', 8, 8)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('live-shop-de-sucesso', '8.1', 'Como fazer uma Live Shop de Sucesso', 158, 1)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'lives'
ON CONFLICT (slug) DO NOTHING;

-- Seção 9
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'agencias-parceiras', '9) Agências parceiras', 9, 9)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('o-que-sao-agencias-parceiras', '9.1', 'O que são as agências parceiras', 91, 1),
  ('beneficios-agencia-parceira', '9.2', 'Benefícios de estar em uma Agência parceira', 137, 2),
  ('como-fazer-parte-time-amplify', '9.3', 'Como fazer parte do time Amplify', 84, 3)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'agencias-parceiras'
ON CONFLICT (slug) DO NOTHING;

-- Seção 10
INSERT INTO learning_sections ("trackSlug", slug, title, "sectionNumber", "sortOrder")
VALUES ('aprofunde', 'fechamento', '10) Fechamento', 10, 10)
ON CONFLICT ("trackSlug", slug) DO NOTHING;

INSERT INTO learning_lessons ("sectionId", slug, "lessonLabel", title, "durationSeconds", "youtubeVideoId", "sortOrder")
SELECT s.id, v.slug, v.label, v.title, v.duration, NULL, v.ord
FROM learning_sections s
CROSS JOIN (VALUES
  ('so-mais-um-video', '10.1', '"Só mais um vídeo"', 103, 1)
) AS v(slug, label, title, duration, ord)
WHERE s."trackSlug" = 'aprofunde' AND s.slug = 'fechamento'
ON CONFLICT (slug) DO NOTHING;
