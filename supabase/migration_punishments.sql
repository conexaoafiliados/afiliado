-- Canal de punições nos avisos + post principal
-- Execute no SQL Editor do Supabase (após migration_announcements.sql)

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS channel VARCHAR(32) NOT NULL DEFAULT 'avisos';

UPDATE announcements SET channel = 'avisos' WHERE channel IS NULL OR channel = '';

CREATE INDEX IF NOT EXISTS idx_announcements_channel ON announcements (channel, "createdAt" DESC);

INSERT INTO announcements ("userId", channel, title, content, likes, "createdAt", "updatedAt")
SELECT
  author.id,
  'punicoes',
  'AVISO IMPORTANTE – PUNIÇÕES DA PLATAFORMA',
  E'O TikTok Shop está aplicando uma onda de punições automáticas devido ao reforço na moderação de conteúdos e respeito às Diretrizes da plataforma.\n\nDiversos creators estão sendo penalizados mesmo quando o produto e o conteúdo estão corretos.\n\nSegue as punições mais comuns e como fazer a defesa para recorrer.',
  54,
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
FROM (
  SELECT COALESCE(
    (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1),
    (SELECT id FROM users ORDER BY id LIMIT 1)
  ) AS id
) author
WHERE author.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM announcements WHERE channel = 'punicoes' LIMIT 1);
