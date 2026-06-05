-- Grupo Aberto: canal de mensagens na comunidade
-- Execute no SQL Editor do Supabase

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS channel VARCHAR(32) NOT NULL DEFAULT 'feed';

UPDATE community_posts SET channel = 'feed' WHERE channel IS NULL OR channel = '';

CREATE INDEX IF NOT EXISTS idx_community_posts_channel ON community_posts (channel, "createdAt");

INSERT INTO community_posts ("userId", channel, content, likes, "createdAt", "updatedAt")
SELECT
  author.id,
  'grupo-aberto',
  v.content,
  v.likes,
  NOW() - (v.hours_ago || ' hours')::INTERVAL,
  NOW()
FROM (
  SELECT COALESCE(
    (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1),
    (SELECT id FROM users ORDER BY id LIMIT 1)
  ) AS id
) author
CROSS JOIN (VALUES
  (
    E'Bom dia! Alguém já testou a nova campanha de amostras? Estou com dúvida no link do produto.',
    1,
    6
  ),
  (
    E'Consegui minha primeira venda ontem 🎉 Obrigada a todos que ajudaram no grupo!',
    3,
    4
  ),
  (
    E'Preciso de orientação: recebi punição por conteúdo não original, mas gravei tudo do zero. O que fazer?',
    2,
    2
  ),
  (
    E'Alguém vai no treinamento de Lives na segunda? Podemos trocar ideia antes.',
    0,
    1
  )
) AS v(content, likes, hours_ago)
WHERE author.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM community_posts WHERE channel = 'grupo-aberto' LIMIT 1);
