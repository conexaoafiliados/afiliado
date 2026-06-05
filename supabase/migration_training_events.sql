-- Treinamentos e Reuniões (eventos ao vivo)
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS training_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "imageUrl" VARCHAR(512),
  category VARCHAR(64) NOT NULL DEFAULT 'geral',
  "eventType" VARCHAR(32) NOT NULL DEFAULT 'live',
  "hostName" VARCHAR(120),
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ,
  "liveStreamUrl" VARCHAR(512),
  "seedParticipants" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_event_registrations (
  id SERIAL PRIMARY KEY,
  "eventId" INTEGER NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("eventId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_training_events_start ON training_events ("startDate");
CREATE INDEX IF NOT EXISTS idx_training_registrations_event ON training_event_registrations ("eventId");

INSERT INTO training_events (title, description, category, "eventType", "hostName", "startDate", "endDate", "seedParticipants")
SELECT v.title, v.description, v.category, v.event_type, v.host_name, v.start_at, v.end_at, v.participants
FROM (VALUES
  (
    'Blue Carpet 💙',
    'Encontro especial com os top creators da comunidade. Networking, premiações e estratégias exclusivas para o TikTok Shop.',
    'estrategia',
    'live',
    'Gabriel Tolentino Corrêa',
    '2026-06-08 22:00:00+00'::TIMESTAMPTZ,
    '2026-06-08 23:00:00+00'::TIMESTAMPTZ,
    9
  ),
  (
    'Consistência vence: como manter frequência de Lives',
    'Aprenda a criar uma rotina sustentável de lives no TikTok Shop sem esgotar sua energia criativa.',
    'estrategia',
    'live',
    'Equipe Conexões Creators',
    '2026-06-15 18:00:00+00'::TIMESTAMPTZ,
    '2026-06-15 19:00:00+00'::TIMESTAMPTZ,
    14
  ),
  (
    'ESPECIAL COPA: como aproveitar uma tendência antes que ela passe',
    'Treinamento ao vivo sobre como surfar tendências sazonais e converter visualizações em vendas.',
    'estrategia',
    'live',
    'Marina Silva',
    '2026-06-17 22:00:00+00'::TIMESTAMPTZ,
    '2026-06-17 23:00:00+00'::TIMESTAMPTZ,
    21
  ),
  (
    'Programa de Indicação — como funciona na prática',
    'Passo a passo para indicar creators, acompanhar bonificações e maximizar seus ganhos extras.',
    'indicacao',
    'live',
    'Equipe Conexões Creators',
    '2026-06-22 22:00:00+00'::TIMESTAMPTZ,
    '2026-06-22 23:00:00+00'::TIMESTAMPTZ,
    6
  ),
  (
    'Tira-dúvidas semanal ao vivo',
    'Sessão aberta para perguntas sobre vendas, conteúdo, campanhas e crescimento na plataforma.',
    'geral',
    'live',
    'Suporte Creators',
    '2026-06-26 19:00:00+00'::TIMESTAMPTZ,
    '2026-06-26 20:00:00+00'::TIMESTAMPTZ,
    11
  )
) AS v(title, description, category, event_type, host_name, start_at, end_at, participants)
WHERE NOT EXISTS (SELECT 1 FROM training_events LIMIT 1);
