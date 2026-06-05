-- Conquistas por marcos de seguidores (5K, 10K, 15K…)
-- Execute no SQL Editor do Supabase

INSERT INTO achievements (title, description) VALUES
  ('Creator 5K', 'Meta: 5.000 seguidores'),
  ('Creator 10K', 'Meta: 10.000 seguidores'),
  ('Creator 15K', 'Meta: 15.000 seguidores'),
  ('Creator 20K', 'Meta: 20.000 seguidores'),
  ('Creator 30K', 'Meta: 30.000 seguidores'),
  ('Creator 40K', 'Meta: 40.000 seguidores'),
  ('Creator 50K', 'Meta: 50.000 seguidores')
ON CONFLICT DO NOTHING;

-- Garante títulos das conquistas antigas (caso seed não tenha rodado)
INSERT INTO achievements (title, description) VALUES
  ('500 Seguidores', 'Alcance 500 seguidores no TikTok'),
  ('1K Club', 'Chegue a 1.000 seguidores'),
  ('Creator 2K', 'Meta: 2.000 seguidores')
ON CONFLICT DO NOTHING;
