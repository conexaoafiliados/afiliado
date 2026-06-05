-- Dados de demonstração (opcional) — execute após schema.sql

INSERT INTO missions (title, description, category, difficulty, reward, "isActive") VALUES
  ('Primeiro post na comunidade', 'Publique no feed da comunidade', 'engagement', 'easy', 50, true),
  ('Atualize seu progresso', 'Registre seus seguidores em Progresso 2K', 'growth', 'easy', 75, true),
  ('Matricule-se em um curso', 'Comece um curso em Educação', 'learning', 'medium', 100, true),
  ('Alcance 500 seguidores', 'Marco intermediário da jornada', 'growth', 'medium', 250, true),
  ('Primeira venda na loja', 'Venda um produto digital ou físico', 'growth', 'hard', 500, true)
ON CONFLICT DO NOTHING;

INSERT INTO achievements (title, description) VALUES
  ('Primeiro Passo', 'Complete sua primeira missão'),
  ('500 Seguidores', 'Alcance 500 seguidores no TikTok'),
  ('1K Club', 'Chegue a 1.000 seguidores'),
  ('Creator 2K', 'Meta: 2.000 seguidores'),
  ('Creator 5K', 'Meta: 5.000 seguidores'),
  ('Creator 10K', 'Meta: 10.000 seguidores'),
  ('Creator 15K', 'Meta: 15.000 seguidores'),
  ('Creator 20K', 'Meta: 20.000 seguidores'),
  ('Creator 30K', 'Meta: 30.000 seguidores'),
  ('Creator 40K', 'Meta: 40.000 seguidores'),
  ('Creator 50K', 'Meta: 50.000 seguidores'),
  ('Vendedor', 'Primeira venda na loja'),
  ('Estudioso', 'Conclua um curso')
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, category, level) VALUES
  ('Conteúdo que Engaja', 'Técnicas para creators iniciantes', 'content', 'beginner'),
  ('Monetização', 'Ganhe com seu conteúdo', 'monetization', 'intermediate'),
  ('Crescimento no TikTok', 'Estratégias para 2k seguidores', 'growth', 'beginner')
ON CONFLICT DO NOTHING;
