-- Conexões Creators — Etapa 3: missões/trilhas gerais ou por marca + validação de entrega
-- Execute DEPOIS das etapas 1 e 2. ADITIVA e idempotente.
-- Preserva cursos/matrículas legados (tabelas courses / user_courses intactas).

-- ---------------------------------------------------------------------------
-- Missões: vínculo opcional a marca (NULL = missão geral do clube)
-- ---------------------------------------------------------------------------
ALTER TABLE missions ADD COLUMN IF NOT EXISTS "brandId" INTEGER REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS "requiresProof" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_missions_brand ON missions ("brandId", "isActive");

-- ---------------------------------------------------------------------------
-- Participação: envio ≠ validação; pontos só uma vez
-- ---------------------------------------------------------------------------
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "submissionUrl" VARCHAR(1024);
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "submissionNote" TEXT;
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMPTZ;
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "validationStatus" VARCHAR(24) NOT NULL DEFAULT 'none';
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "validatedAt" TIMESTAMPTZ;
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "validatedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS "rewardGranted" BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_missions_validation_check'
  ) THEN
    ALTER TABLE user_missions
      ADD CONSTRAINT user_missions_validation_check
      CHECK ("validationStatus" IN ('none', 'pending_review', 'approved', 'rejected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_missions_user_mission_unique
  ON user_missions ("userId", "missionId");

-- ---------------------------------------------------------------------------
-- Trilhas: vínculo opcional a marca (NULL = trilha geral)
-- ---------------------------------------------------------------------------
ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS "brandId" INTEGER REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_learning_tracks_brand ON learning_tracks ("brandId");
