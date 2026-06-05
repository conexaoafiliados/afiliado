-- Bucket público para imagens de posts (Grupo Aberto / Comunidade)
-- Execute no SQL Editor do Supabase

INSERT INTO storage.buckets (id, name, public)
VALUES ('community-posts', 'community-posts', true)
ON CONFLICT (id) DO NOTHING;
