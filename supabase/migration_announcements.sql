-- Avisos oficiais (posts apenas de administradores)
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  "imageUrl" VARCHAR(512),
  "attachmentUrl" VARCHAR(512),
  "attachmentName" VARCHAR(255),
  likes INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_likes (
  id SERIAL PRIMARY KEY,
  "announcementId" INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("announcementId", "userId")
);

CREATE TABLE IF NOT EXISTS announcement_comments (
  id SERIAL PRIMARY KEY,
  "announcementId" INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "parentCommentId" INTEGER REFERENCES announcement_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_post ON announcement_comments ("announcementId");
CREATE INDEX IF NOT EXISTS idx_announcement_comments_parent ON announcement_comments ("parentCommentId");

-- Posts fictícios de demonstração (usa admin ou primeiro usuário cadastrado)
WITH author AS (
  SELECT COALESCE(
    (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1),
    (SELECT id FROM users ORDER BY id LIMIT 1)
  ) AS id
)
INSERT INTO announcements ("userId", title, content, "attachmentName", likes, "createdAt", "updatedAt")
SELECT
  author.id,
  v.title,
  v.content,
  v.attachment,
  v.likes,
  NOW() - (v.days_ago || ' days')::INTERVAL,
  NOW() - (v.days_ago || ' days')::INTERVAL
FROM author
CROSS JOIN (VALUES
  (
    '🏆 RESULTADO DO DIA 1.6 | Gamificação | Mega Promo',
    E'Parabéns a todos que participaram do primeiro dia da gamificação!\n\n@maria_creator e @joao_shop lideraram o ranking com vendas incríveis. Confira a tabela completa no grupo aberto e prepare-se: amanhã começam os bônus dobrados.\n\nContinue postando e marcando a equipe quando tiver dúvidas.',
    NULL::VARCHAR,
    7,
    1
  ),
  (
    '🔥 GAMIFICAÇÃO MEGA PROMO | Mentoria com o Top #1',
    E'⚠️ Atenção: alguns pontos da regulamentação foram atualizados.\n\nA competição de vendas vai de 1 a 13 de junho. Os 10 primeiros colocados ganham mentoria exclusiva com o creator #1 do TikTok Shop.\n\nLeia o regulamento completo no anexo e boa sorte a todos!',
    'Regulamento_Gamificacao_Mega_Promo.pdf',
    24,
    4
  ),
  (
    '📅 Novos treinamentos ao vivo na agenda',
    E'Adicionamos três encontros ao calendário:\n\n• Terça 19h — Como escolher produtos campeões\n• Quinta 20h — Edição rápida para TikTok Shop\n• Sábado 10h — Tira-dúvidas ao vivo\n\nAcesse Treinamentos e Reuniões no menu e confirme presença.',
    NULL::VARCHAR,
    12,
    6
  ),
  (
    '⭐ Campanhas Conexões Creators — inscrições abertas',
    E'A nova rodada de campanhas já está no ar!\n\nCreators ativos na plataforma podem se candidatar a amostras gratuitas e comissões especiais. Prazo: até sexta-feira.\n\nVeja os detalhes em Categoria Start → Campanhas Conexões Creators.',
    NULL::VARCHAR,
    18,
    9
  )
) AS v(title, content, attachment, likes, days_ago)
WHERE author.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM announcements LIMIT 1);
