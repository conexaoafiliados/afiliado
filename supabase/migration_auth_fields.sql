-- Execute no Supabase SQL Editor (após schema.sql)
-- Campos para cadastro completo + login por usuário/senha

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS number VARCHAR(20);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(120);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(120);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS "platformObjective" TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
