-- Seed data for development
-- Run after migration and after creating your first admin user

INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Primeiros passos', 'primeiros-passos', 'Guias introdutórios para novos usuários', 1),
  ('Produtos', 'produtos', 'Documentação sobre produtos e funcionalidades', 2),
  ('Suporte', 'suporte', 'Artigos de suporte e solução de problemas', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tags (name, slug) VALUES
  ('Tutorial', 'tutorial'),
  ('FAQ', 'faq'),
  ('Novidade', 'novidade')
ON CONFLICT (slug) DO NOTHING;

-- To promote first user to super_admin, run after signup:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'seu-email@loft.com.br';
