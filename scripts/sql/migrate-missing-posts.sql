-- =============================================================================
-- Migrate missing articles: novoajuda (legacy WP) → Supabase posts
-- =============================================================================
-- Gap analysis (2026-07-07):
--   novoajuda WordPress published posts: 326
--   + 5 hub pages (vista-crm, vista-sites, etc.) = 331 total no legado
--   ajuda (novo app /busca): ~304 artigos publicados
--   Artigos faltantes identificados: 24
--
-- Fonte do conteúdo: https://novoajuda.vistasoft.com.br/{slug}/
--
-- IMPORTANTE:
--   1. Rode scripts/apply-import-prerequisites.sql antes, se ainda não rodou.
--   2. Este arquivo faz UPSERT por slug (idempotente).
--   3. Imagens permanecem nas URLs do WordPress legado até reimport com script TS.
--   4. Alternativa recomendada com migração de imagens:
--      npm run import:wordpress:missing
-- =============================================================================

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS migration_missing_slugs (
  slug text PRIMARY KEY,
  title text NOT NULL,
  source_url text NOT NULL
);

TRUNCATE migration_missing_slugs;

INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('ativacao-do-desconto-pontualidade', 'Ativação do desconto pontualidade', 'https://novoajuda.vistasoft.com.br/ativacao-do-desconto-pontualidade/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('08-menu-avancado', '08- Menu Avançado', 'https://novoajuda.vistasoft.com.br/08-menu-avancado/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('09-menu-sistema', '09- Menu Sistema', 'https://novoajuda.vistasoft.com.br/09-menu-sistema/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('11-integracao-com-portais', '11- Integração com Portais', 'https://novoajuda.vistasoft.com.br/11-integracao-com-portais/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('enviar-imoveis-aos-portais', 'PORTAIS – Enviar imóveis aos portais', 'https://novoajuda.vistasoft.com.br/enviar-imoveis-aos-portais/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('como-pegar-o-link-xml-do-portal', 'Portais – Como pegar o link XML do portal?', 'https://novoajuda.vistasoft.com.br/como-pegar-o-link-xml-do-portal/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('fechamento-e-vencimento-de-aluguel-postecipado', 'Fechamento e vencimento de aluguel postecipado', 'https://novoajuda.vistasoft.com.br/fechamento-e-vencimento-de-aluguel-postecipado/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('baixa-manual-de-boletos', 'Baixa manual de boletos', 'https://novoajuda.vistasoft.com.br/baixa-manual-de-boletos/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('previsao-de-multas-e-juros', 'Previsão de Multas e Juros', 'https://novoajuda.vistasoft.com.br/previsao-de-multas-e-juros/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('impressao-de-repasse-para-o-proprietario', 'Impressão de repasse para o proprietário', 'https://novoajuda.vistasoft.com.br/impressao-de-repasse-para-o-proprietario/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('impressao-de-boletos-e-envio-por-e-mail', 'Impressão de boletos e envio por e-mail', 'https://novoajuda.vistasoft.com.br/impressao-de-boletos-e-envio-por-e-mail/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('estorno-de-boletos', 'Estorno de Boletos/Mensalidades de Aluguel', 'https://novoajuda.vistasoft.com.br/estorno-de-boletos/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('convite-proativo', 'CHAT – Convite proativo', 'https://novoajuda.vistasoft.com.br/convite-proativo/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('lembrete-clientes-desatualizados', 'MENUS LEMBRETES – Clientes Desatualizados', 'https://novoajuda.vistasoft.com.br/lembrete-clientes-desatualizados/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('alterar-logo-marca-da-imobiliaria', 'Alterar Logotipo da Imobiliária', 'https://novoajuda.vistasoft.com.br/alterar-logo-marca-da-imobiliaria/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('lembrete-imoveis-esperados-pelos-seus-clientes', 'MENU LEMBRETES – Imóveis esperados pelos seus clientes', 'https://novoajuda.vistasoft.com.br/lembrete-imoveis-esperados-pelos-seus-clientes/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('acessar-boleto-detalhes-plano', 'Como acessar os boletos e ver detalhes do plano contratado', 'https://novoajuda.vistasoft.com.br/acessar-boleto-detalhes-plano/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('como-posso-atualizar-os-clientes', 'Como posso Atualizar os Clientes?', 'https://novoajuda.vistasoft.com.br/como-posso-atualizar-os-clientes/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario', 'Como faço para cadastrar um cliente que já esta cadastrado no CRM como proprietário?', 'https://novoajuda.vistasoft.com.br/como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro', 'Imóvel está exibindo fotos que não foram inseridas em seu cadastro', 'https://novoajuda.vistasoft.com.br/imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa', 'Por que o nome do usuário continua desatualizado na lista de pesquisa?', 'https://novoajuda.vistasoft.com.br/lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('alterar-e-mail-de-contato-nas-cargas-de-portais', 'PORTAIS – Alterar e-mail de contato nas cargas de portais', 'https://novoajuda.vistasoft.com.br/alterar-e-mail-de-contato-nas-cargas-de-portais/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('alterar-foto-do-perfil-do-usuario', 'Usuário – alterar foto do perfil', 'https://novoajuda.vistasoft.com.br/alterar-foto-do-perfil-do-usuario/');
INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES ('google-chrome-paginas', 'Google Chrome –  Páginas', 'https://novoajuda.vistasoft.com.br/google-chrome-paginas/');

-- Artigos ainda ausentes antes da migração
SELECT m.slug, m.title
FROM migration_missing_slugs m
LEFT JOIN posts p ON p.slug = m.slug
WHERE p.id IS NULL
ORDER BY m.slug;

-- ativacao-do-desconto-pontualidade
INSERT INTO categories (name, slug, sort_order)
VALUES ('Office', 'office', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Parâmetros de locação', 'parametros-de-locacao') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Ativação do desconto pontualidade',
  'ativacao-do-desconto-pontualidade',
  'Para utilizar o  Desconto por Pontualidade , é necessário realizar duas configurações:         Como funciona?   Importante:  Atualmente, o desconto por pontualidade não funciona quando a opção de  Repasse Automático  está habilitada.',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para utilizar o "},{"type":"text","marks":[{"type":"bold"}],"text":"Desconto por Pontualidade"},{"type":"text","text":", é necessário realizar duas configurações:"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse Menu Ferramentas -> Parâmetros."},{"type":"hardBreak"},{"type":"hardBreak"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2026/06/48.png","alt":"","title":null,"width":214,"height":357}}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Localize a opção "},{"type":"text","marks":[{"type":"bold"}],"text":"Desconto por Pontualidade"},{"type":"text","text":"."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Habilite a funcionalidade marcando a opção "},{"type":"text","marks":[{"type":"bold"}],"text":"SIM"},{"type":"text","text":" e clique em "},{"type":"text","marks":[{"type":"bold"}],"text":"Salvar"},{"type":"text","text":"."}]}]}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2026/06/44.png","alt":"","title":null,"width":572,"height":114}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o menu "},{"type":"text","marks":[{"type":"bold"}],"text":"Contrato de Aluguel-> Pesquisar contratos"},{"type":"text","text":"."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Pesquise o contrato desejado e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Alterar"},{"type":"text","text":"."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"No campo "},{"type":"text","marks":[{"type":"bold"}],"text":"Desconto por Pontualidade"},{"type":"text","text":", altere de "},{"type":"text","marks":[{"type":"bold"}],"text":"Não"},{"type":"text","text":" para "},{"type":"text","marks":[{"type":"bold"}],"text":"Sim"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2026/06/45.png","alt":"","title":null,"width":339,"height":127}}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o valor do desconto."},{"type":"hardBreak"},{"type":"hardBreak"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2026/06/46.png","alt":"","title":null,"width":309,"height":76}}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Clique em "},{"type":"text","marks":[{"type":"bold"}],"text":"Salvar"},{"type":"text","text":"."}]}]}]},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Como funciona?"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Quando o pagamento é realizado até a data de vencimento, o sistema aplica o desconto configurado."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Após o vencimento, o desconto deixa de ser válido e o aluguel será cobrado pelo valor integral."}]}]}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Importante:"},{"type":"text","text":" Atualmente, o desconto por pontualidade não funciona quando a opção de "},{"type":"text","marks":[{"type":"bold"}],"text":"Repasse Automático"},{"type":"text","text":" está habilitada."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'office' LIMIT 1),
  NULL,
  NULL,
  'Ativação do desconto pontualidade',
  'Para utilizar o  Desconto por Pontualidade , é necessário realizar duas configurações:         Como funciona?   Importante:  Atualmente, o desconto por pontualidade não funciona quando a opção de  Repasse Automático  está habilitada.',
  '2026-06-23T19:37:27Z',
  '2026-06-23T19:37:27Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'ativacao-do-desconto-pontualidade');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'parametros-de-locacao'
WHERE p.slug = 'ativacao-do-desconto-pontualidade'
ON CONFLICT DO NOTHING;

-- 08-menu-avancado
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Menu Avançado', 'menu-avancado') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Trilha de Aprendizado', 'trilha-de-aprendizado') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  '08- Menu Avançado',
  '08-menu-avancado',
  'Olá pessoal! Tudo bem? Agora o meu papo é para você que chegou até aqui, mas já está exausto e com vontade de jogar tudo para o alto… Calma!! Estamos quase terminando, levanta, toma um café ou uma água, estica as costas e vamos em frente...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Olá pessoal! Tudo bem?"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Agora o meu papo é para você que chegou até aqui, mas já está exausto e com vontade de jogar tudo para o alto… Calma!! Estamos quase terminando, levanta, toma um café ou uma água, estica as costas e vamos em frente!"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Nessa etapa da sua trilha iremos falar um pouco do Menu Avançado do CRM, é uma parte essencial e com informações muito ricas do sistema e das possibilidades que ele te traz."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acredito que você esteja devidamente hidratado e descansado, então vamos em frente."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://youtu.be/krCEt2y4-sE?list=PL_XhUpB_mHXE1u6RVJhzoi4r21bQJHfG-","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"AQUI"},{"type":"text","text":" para aprender mais!"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"#BebaÁgua"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Abraços!!"}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  '08- Menu Avançado',
  'Olá pessoal! Tudo bem? Agora o meu papo é para você que chegou até aqui, mas já está exausto e com vontade de jogar tudo para o alto… Calma!! Estamos quase terminando, levanta, toma um café ou uma água, estica as costas e vamos em frente...',
  '2021-06-16T03:00:00Z',
  '2021-06-16T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = '08-menu-avancado');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'menu-avancado'
WHERE p.slug = '08-menu-avancado'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'trilha-de-aprendizado'
WHERE p.slug = '08-menu-avancado'
ON CONFLICT DO NOTHING;

-- 09-menu-sistema
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Menu Sistema', 'menu-sistema') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Trilha de Aprendizado', 'trilha-de-aprendizado') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  '09- Menu Sistema',
  '09-menu-sistema',
  'Olá pessoal! Tudo bem? Após toda essa informação que foi passada para você no último vídeo, temos mais um vídeo incrível para você assistir e que te trará muitas informações e possibilidades do sistema. Estamos falando do Menu Sistema do...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Olá pessoal! Tudo bem?"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Após toda essa informação que foi passada para você no último vídeo, temos mais um vídeo incrível para você assistir e que te trará muitas informações e possibilidades do sistema."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Estamos falando do Menu Sistema do VistaCRM. O Thiago nos trará mais informações a respeito desse local em particular no próximo vídeo da nossa trilha, então vamos lá!"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://youtu.be/U_xhH7vQqhQ?list=PL_XhUpB_mHXE1u6RVJhzoi4r21bQJHfG-","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"AQUI"},{"type":"text","text":" para assistir o vídeo."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"“Continue a nadar, continue a nadar…” – Dory (Procurando o Nemo)"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Abraços!"}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  '09- Menu Sistema',
  'Olá pessoal! Tudo bem? Após toda essa informação que foi passada para você no último vídeo, temos mais um vídeo incrível para você assistir e que te trará muitas informações e possibilidades do sistema. Estamos falando do Menu Sistema do...',
  '2021-06-16T03:00:00Z',
  '2021-06-16T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = '09-menu-sistema');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'menu-sistema'
WHERE p.slug = '09-menu-sistema'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'trilha-de-aprendizado'
WHERE p.slug = '09-menu-sistema'
ON CONFLICT DO NOTHING;

-- 11-integracao-com-portais
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Publicação em Portais', 'publicacao-em-portais') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Trilha de Aprendizado', 'trilha-de-aprendizado') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  '11- Integração com Portais',
  '11-integracao-com-portais',
  'Olá pessoal! Tudo bem? Agora abordaremos um outro ponto de grande interesse da maioria de vocês, a publicação de imóveis em portais. O CRM da Vista é um dos que mais possui integrações no mercado imobiliário, isso tudo graças ao empenho ...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Olá pessoal! Tudo bem?"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Agora abordaremos um outro ponto de grande interesse da maioria de vocês, a publicação de imóveis em portais."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O CRM da Vista é um dos que mais possui integrações no mercado imobiliário, isso tudo graças ao empenho da nossa equipe de portais (Valeu, Alex!). Então agora iremos te ensinar a como publicar seus imóveis nos portais através do VistaCRM."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://youtu.be/-GDAWYI2O84?list=PL_XhUpB_mHXE1u6RVJhzoi4r21bQJHfG-","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"AQUI"},{"type":"text","text":" para darmos mais um passo dentro dessa jornada."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Abraços!!"}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  '11- Integração com Portais',
  'Olá pessoal! Tudo bem? Agora abordaremos um outro ponto de grande interesse da maioria de vocês, a publicação de imóveis em portais. O CRM da Vista é um dos que mais possui integrações no mercado imobiliário, isso tudo graças ao empenho ...',
  '2021-06-16T03:00:00Z',
  '2021-06-16T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = '11-integracao-com-portais');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'publicacao-em-portais'
WHERE p.slug = '11-integracao-com-portais'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'trilha-de-aprendizado'
WHERE p.slug = '11-integracao-com-portais'
ON CONFLICT DO NOTHING;

-- enviar-imoveis-aos-portais
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Portais', 'portais') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'PORTAIS – Enviar imóveis aos portais',
  'enviar-imoveis-aos-portais',
  'Para saber como ativar Portais  clique aqui Pra publicar imóveis em massa  clique aqui MODO PUBLICAÇÃO DE PORTAIS DE FORMA INDIVIDUAL  *Lembrando que EMPREENDIMENTO não é enviado na maioria dos portais. 1 – Abra o imóvel desejado e desce...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para saber como ativar Portais "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/artigos/como-ativar-a-integracao-com-os-portais","target":"_blank","rel":"noopener","class":null,"title":null}}],"text":"clique aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Pra publicar imóveis em massa "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/artigos/gerenciar-publicacao-dos-imoveis-em-portais-e-no-site","target":"_blank","rel":"noopener","class":null,"title":null}}],"text":"clique aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"MODO PUBLICAÇÃO DE PORTAIS DE FORMA INDIVIDUAL"},{"type":"hardBreak","marks":[{"type":"bold"}]},{"type":"text","text":"*Lembrando que EMPREENDIMENTO não é enviado na maioria dos portais."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"1 – Abra o imóvel desejado e desce até a aba Publicação de Portais e clique no local indicado pra expandir a tela."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/portais4.png","alt":"","title":null,"width":719,"height":324}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"2 – Aqui temos os portais ativos na base, basta selecionar o portal que deseja publicar marcando o check-box."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/portais5.png","alt":"","title":null,"width":648,"height":241}}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'PORTAIS – Enviar imóveis aos portais',
  'Para saber como ativar Portais  clique aqui Pra publicar imóveis em massa  clique aqui MODO PUBLICAÇÃO DE PORTAIS DE FORMA INDIVIDUAL  *Lembrando que EMPREENDIMENTO não é enviado na maioria dos portais. 1 – Abra o imóvel desejado e desce...',
  '2021-05-13T03:00:00Z',
  '2021-05-13T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'enviar-imoveis-aos-portais');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'portais'
WHERE p.slug = 'enviar-imoveis-aos-portais'
ON CONFLICT DO NOTHING;

-- como-pegar-o-link-xml-do-portal
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Portais', 'portais') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Portais – Como pegar o link XML do portal?',
  'como-pegar-o-link-xml-do-portal',
  '1  – Primeiramente, somente  administradores do sistema  conseguem pegar essa informação, se você for, vamos continuar. 2  – Vá em  Menu > Portais . 3  – Depois clique em  Ativo , pra filtrar todos os portais ativos em sua base. 4  – Esc...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"1"},{"type":"text","text":" – Primeiramente, somente "},{"type":"text","marks":[{"type":"bold"}],"text":"administradores do sistema"},{"type":"text","text":" conseguem pegar essa informação, se você for, vamos continuar."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"2"},{"type":"text","text":" – Vá em "},{"type":"text","marks":[{"type":"bold"}],"text":"Menu > Portais"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/2024-03-21_10-58.png","alt":"","title":null,"width":426,"height":886}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"3"},{"type":"text","text":" – Depois clique em "},{"type":"text","marks":[{"type":"bold"}],"text":"Ativo"},{"type":"text","text":", pra filtrar todos os portais ativos em sua base."}]},{"type":"image","attrs":{"src":"https://s3.amazonaws.com/movidesk-files/70C523C77808A4AE2894098D8285C853","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"4"},{"type":"text","text":" – Escolha o portal no qual você deseja pegar o link XML. Aqui como exemplo, usaremos o Grupo Zap."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/2024-03-21_10-59_1.png","alt":"","title":null,"width":238,"height":291}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"5"},{"type":"text","text":" – Desça até o "},{"type":"text","marks":[{"type":"bold"}],"text":"item 3 – Dados e XM"},{"type":"text","text":"L, lá você encontrará o link da sua carga, basta copiar ele e configurar no portal desejado e pronto."},{"type":"hardBreak"},{"type":"text","text":"– "},{"type":"text","marks":[{"type":"bold"}],"text":"Lembrando que o Vista envia a carga somente uma vez por dia."}]},{"type":"image","attrs":{"src":"https://s3.amazonaws.com/movidesk-files/9C1E004C8A9F09B447332C5D4582CA99","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"6 – "},{"type":"text","text":"Caso você faça a carga separada por agência, basta copiar o link de cada agência e configurar no portal."}]},{"type":"image","attrs":{"src":"https://s3.amazonaws.com/movidesk-files/6CC4CAE6AD1E34F4556E4DBE79E51C92","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Extra:"},{"type":"text","text":" Temos integração de leads com a maioria dos nossos portais parceiros, para realizar a integração desse serviço segue alguns pontos."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para o "},{"type":"text","marks":[{"type":"bold"}],"text":"Grupo Zap "},{"type":"text","text":"é necessário solicitar a ativação desse serviço ao nosso time de Suporte."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Quanto ao ImovelWeb, basta ativar, no Marketplace, o integrador Leads ImovelWeb."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/2024-03-21_11-06.png","alt":"","title":null,"width":1497,"height":299}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Também é necessário, no caso do Imóvelweb,  inserir o Código da Central da Vendas (Configurações > Sucursais > Copiar o código no link)."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/imovelweb_passo_a_passo2-700x348.png","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"E inserir em MENU – PORTAIS – IMOVELWEB – Código da Central de Vendas"},{"type":"hardBreak"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/05/2024-03-21_11-09.png","alt":"","title":null,"width":1035,"height":495}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Integração de Leads"},{"type":"hardBreak"},{"type":"text","text":"Para pegar o link de integração de leads, o passo a passo é o mesmo do referido acima."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Menu > Portais > Abrir o portal desejado"},{"type":"text","text":" "},{"type":"text","marks":[{"type":"bold"}],"text":">"},{"type":"text","text":" Porém agora você vai acessar o item "},{"type":"text","marks":[{"type":"bold"}],"text":"4 – Integração de Leads,"},{"type":"text","text":" logo abaixo do XML de integração de anúncios"}]},{"type":"image","attrs":{"src":"https://s3.amazonaws.com/movidesk-files/5E124A6307A59C8838CA482C758AD06B","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Basta copiar essa URL de Integração de leads e enviar ao portal parceiro."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'Portais – Como pegar o link XML do portal?',
  '1  – Primeiramente, somente  administradores do sistema  conseguem pegar essa informação, se você for, vamos continuar. 2  – Vá em  Menu > Portais . 3  – Depois clique em  Ativo , pra filtrar todos os portais ativos em sua base. 4  – Esc...',
  '2021-05-13T03:00:00Z',
  '2021-05-13T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'como-pegar-o-link-xml-do-portal');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'portais'
WHERE p.slug = 'como-pegar-o-link-xml-do-portal'
ON CONFLICT DO NOTHING;

-- fechamento-e-vencimento-de-aluguel-postecipado
INSERT INTO categories (name, slug, sort_order)
VALUES ('Contrato', 'contrato', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Office', 'office') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Fechamento e vencimento de aluguel postecipado',
  'fechamento-e-vencimento-de-aluguel-postecipado',
  'Como preencher o fechamento e vencimento de aluguel postecipado? Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office . Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um l...',
  '{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":1},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Como preencher o fechamento e vencimento de aluguel postecipado?"}]},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vídeo clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://youtu.be/SRUF3VebO9E","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"bold"}],"text":"aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o Office através do site "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.vistasoft.com.br/","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"underline"}],"text":"www.vistasoft.com.br"},{"type":"text","text":" > botão"},{"type":"text","marks":[{"type":"bold"}],"text":" Office"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/botao-office-2.png","alt":"","title":null,"width":482,"height":130}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o código, login e senha, e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Entrar"},{"type":"text","text":". Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem autorização para criar novos usuários."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Login-Office-1.jpg","alt":"","title":null,"width":382,"height":464}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o "},{"type":"text","marks":[{"type":"bold"}],"text":"Módulo de Aluguel"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/caminho-alternando-do-modulo-comercial-para-o-modulo-de-aluguel.png","alt":"","title":null,"width":931,"height":244}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"No momento em que o usuário está cadastrando o contrato de locação, sempre surge a dúvida “"},{"type":"text","marks":[{"type":"bold"}],"text":"Como preencher corretamente os campos fechamento e vencimento do primeiro aluguel?"},{"type":"text","text":"” Abaixo detalharemos a função desses dois campos."}]},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vencimento do 1º aluguel"},{"type":"text","text":": "}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/1-4.png","alt":"","title":null,"width":518,"height":159}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para preenchimento deste campo, temos que pensar em qual situação estamos:"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"1º"},{"type":"text","text":" "},{"type":"text","marks":[{"type":"bold"}],"text":"Estou cadastrando um contrato novo no Office"},{"type":"text","text":": Esse campo define qual será o primeiro boleto desse cliente. "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Exemplo:"},{"type":"text","text":" O contrato iniciou em 15/01/2021 e o vencimento desse cliente será todo dia 10 de cada mês. Então eu irei preencher o campo "},{"type":"text","marks":[{"type":"bold"}],"text":"Vencimento do 1º aluguel"},{"type":"text","text":" com a data 10/02/2021, em 10/02/2021 vencerá o primeiro boleto desse cliente."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"2º"},{"type":"text","text":" "},{"type":"text","marks":[{"type":"bold"}],"text":"Estou cadastrando um contrato antigo"},{"type":"text","text":": Ou seja, esse contrato já está vigente há mais de um mês e o usuário irá cadastrá-lo para iniciar a utilização do sistema."},{"type":"hardBreak"},{"type":"text","text":"Neste caso, o campo define qual será o primeiro boleto desse cliente no sistema"},{"type":"text","marks":[{"type":"bold"}],"text":" Office"},{"type":"text","text":"."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Exemplo:"},{"type":"text","text":" O contrato iniciou em 15/05/2019 e o vencimento desse cliente será todo dia 10 de cada mês. Então eu irei preencher o campo "},{"type":"text","marks":[{"type":"bold"}],"text":"Vencimento do 1º aluguel"},{"type":"text","text":" com a data que eu quero iniciar os boletos pelo sistema"},{"type":"text","marks":[{"type":"bold"}],"text":" Office"},{"type":"text","text":", ou seja, posso preencher com a data 10/02/2021, pois eu irei gerar boletos pelo sistema a partir do vencimento de fevereiro/2021."}]},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Fechamento do 1º aluguel"},{"type":"text","text":": "}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/2-4.png","alt":"","title":null,"width":518,"height":162}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Esse campo vai definir o proporcional do primeiro mês de aluguel."}]},{"type":"orderedList","attrs":{"start":1,"type":null},"content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Exemplo 1 (mês fechado):"},{"type":"text","text":" O contrato iniciou em 15/01/2021 e o primeiro vencimento será em 10/02/2021. Neste formato, o campo "},{"type":"text","marks":[{"type":"bold"}],"text":"Fechamento do 1º aluguel "},{"type":"text","text":"deve ser preenchido com o último dia do mês anterior ao primeiro vencimento, no nosso exemplo, a data 31/01/2021, o proporcional do aluguel será dos dias 15/01/2021 até 31/01/2021, ou seja, proporcional de 16 dias. Com vencimento em 10/02/2021."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Exemplo 2 (dias corridos):"},{"type":"text","text":" O contrato iniciou em 15/01/2021 e o primeiro vencimento será em 10/02/2021. Neste formato, o campo "},{"type":"text","marks":[{"type":"bold"}],"text":"Fechamento do 1º aluguel "},{"type":"text","text":"deve ser preenchido com a data de 1 dia antes do vencimento, no nosso exemplo 09/02/2021 o proporcional do aluguel será dos dias 15/01/2021 até 09/02/2021, ou seja, proporcional de 25 dias. Com vencimento em 10/02/2021."}]}]}]},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Atenção:"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O sistema contabiliza 30 dias para cada mês, para que não haja diferenças em meses de 28, 29 e 31 dias."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'contrato' LIMIT 1),
  NULL,
  NULL,
  'Fechamento e vencimento de aluguel postecipado',
  'Como preencher o fechamento e vencimento de aluguel postecipado? Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office . Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um l...',
  '2021-03-30T03:00:00Z',
  '2021-03-30T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'fechamento-e-vencimento-de-aluguel-postecipado');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'office'
WHERE p.slug = 'fechamento-e-vencimento-de-aluguel-postecipado'
ON CONFLICT DO NOTHING;

-- baixa-manual-de-boletos
INSERT INTO categories (name, slug, sort_order)
VALUES ('Boleto', 'boleto', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Contrato', 'contrato') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Office', 'office') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Baixa manual de boletos',
  'baixa-manual-de-boletos',
  'Vídeo de treinamento clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office .   Informe o código, login e senha, e clique no botão  Entrar . *  Caso não tenha um login,  é necessário solicitar ao usuário admi...',
  '{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":1},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vídeo de treinamento clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.youtube.com/watch?v=Fbesy3q7ass","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"bold"}],"text":"aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o Office através do site "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.vistasoft.com.br/","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"underline"}],"text":"www.vistasoft.com.br"},{"type":"text","text":" > botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Office"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2022/09/Acesso-sistema.jpg","alt":"","title":null,"width":518,"height":102}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o código, login e senha, e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Entrar"},{"type":"text","text":"."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"* "},{"type":"text","marks":[{"type":"italic"}],"text":"Caso não tenha um login, "},{"type":"text","marks":[{"type":"bold"},{"type":"italic"}],"text":"é necessário solicitar ao usuário administrador."},{"type":"text","marks":[{"type":"italic"}],"text":" "},{"type":"text","marks":[{"type":"bold"},{"type":"italic"}],"text":"O suporte não tem autorização para criar novos usuários."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2022/09/Login-Office.jpg","alt":"","title":null,"width":313,"height":380}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para baixar manualmente um boleto, primeiramente precisamos nos direcionar até o módulo de aluguel, clicando no ícone indicado logo abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/caminho-alternando-do-modulo-comercial-para-o-modulo-de-aluguel.png","alt":"","title":null,"width":935,"height":245}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Com módulo de aluguel aberto, vamos no título "},{"type":"text","marks":[{"type":"bold"}],"text":"Contrato de Aluguel"},{"type":"text","text":" e selecionamos "},{"type":"text","marks":[{"type":"bold"}],"text":"Pesquisar Contratos:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/pesquisar-contratos.png","alt":"","title":null,"width":880,"height":282}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Nessa próxima tela, inserimos "},{"type":"text","marks":[{"type":"bold"}],"text":"os dados para pesquisar o contrato (número do contrato, data, nome do locador, nome do locatário, endereço e outros). "},{"type":"text","text":"O objetivo é conseguir localizar o contrato com as informações que você possui."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Localizar-Contrato.jpg","alt":"","title":null,"width":1003,"height":482}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao localizar irá aparecer como a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Contrato-Alugueis.jpg","alt":"","title":null,"width":887,"height":268}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao clicar em "},{"type":"text","marks":[{"type":"bold"}],"text":"Alugueis"},{"type":"text","text":" será exibido a seguinte tela, onde clicaremos no ícone de lupa, indicado pela seta, na imagem abaixo."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/ALugueis-Lupa-1.jpg","alt":"","title":null,"width":672,"height":310}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Após clicar no ícone indicado acima, serão exibidas algumas opções. Dessas opções iremos clicar em "},{"type":"text","marks":[{"type":"bold"}],"text":"Baixar"},{"type":"text","text":", para que possamos dar sequência no processo de baixa manual da mensalidade."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/ALugueis-Baixar.jpg","alt":"","title":null,"width":805,"height":398}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Algumas informações serão solicitadas para que a baixa seja efetuada, sendo elas:"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"A data de pagamento, diz respeito a quando o pagamento foi de fato realizado pelo locatário."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O valor da multa e valor do juros, que serão calculados automaticamente, baseado no que foi configurado no contrato em questão."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"A conta corrente (só irá ser exibido caso você tenha o módulo financeiro contratado)."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"As observações, caso seja necessário pontuar alguma situação nessa baixa. A informação preenchida no campo Observações irá constar nos recebidos emitidos para locatários e locadores."}]}]}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Tela-Baixa-aluguel.jpg","alt":"","title":null,"width":698,"height":479}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao preencher essas informações, basta clicar em "},{"type":"text","marks":[{"type":"bold"}],"text":"Salvar"},{"type":"text","text":". Após isso, será exibido a tela abaixo, onde o usuário tem a opção de imprimir o recibo ou então, finalizar a demanda."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/4.png","alt":"","title":null,"width":502,"height":225}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Com esse passo a passo, você terá efetuado com sucesso uma baixa manual da mensalidade de um contrato."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'boleto' LIMIT 1),
  NULL,
  NULL,
  'Baixa manual de boletos',
  'Vídeo de treinamento clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office .   Informe o código, login e senha, e clique no botão  Entrar . *  Caso não tenha um login,  é necessário solicitar ao usuário admi...',
  '2021-03-29T03:00:00Z',
  '2021-03-29T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'baixa-manual-de-boletos');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'contrato'
WHERE p.slug = 'baixa-manual-de-boletos'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'office'
WHERE p.slug = 'baixa-manual-de-boletos'
ON CONFLICT DO NOTHING;

-- previsao-de-multas-e-juros
INSERT INTO categories (name, slug, sort_order)
VALUES ('Boleto', 'boleto', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Contrato', 'contrato') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Office', 'office') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Previsão de Multas e Juros',
  'previsao-de-multas-e-juros',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office . Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem ...',
  '{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":1},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vídeo clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.youtube.com/watch?v=lmiEGiQrhqE","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"bold"}],"text":"aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o Office através do site "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.vistasoft.com.br/","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"underline"}],"text":"www.vistasoft.com.br"},{"type":"text","text":" > botão"},{"type":"text","marks":[{"type":"bold"}],"text":" Office"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/botao-office-2.png","alt":"","title":null,"width":482,"height":130}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o código, login e senha, e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Entrar"},{"type":"text","text":". Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem autorização para criar novos usuários."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Login-Office-1.jpg","alt":"","title":null,"width":382,"height":464}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para verificar a previsão de multas e juros no sistema Office, ao se logar no sistema vamos para o módulo de aluguel conforme a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/caminho-alternando-do-modulo-comercial-para-o-modulo-de-aluguel.png","alt":"","title":null,"width":927,"height":243}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"No Módulo de Aluguel selecionamos a opção Financeiro e depois ‘Alugueis e Repasses’ conforme a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/financeiro-alugueis-e-repasses.png","alt":"","title":null,"width":823,"height":255}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao selecionar essas opções nos deparamos com uma tela de pesquisa onde podemos pesquisar o contrato desejado pelos filtros disponíveis, no exemplo abaixo utilizaremos o código do contrato:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/pesquisando-pelo-codigo-do-contrato-em-alugueis-e-repasses.png","alt":"","title":null,"width":923,"height":444}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao realizar a pesquisa, encontraremos todas as mensalidades relacionada ao mesmo, podemos perceber que uma mensalidade está grifada de vermelho, ou seja, é um boleto que está em atraso:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/boleto-em-atraso-em-alugueis-e-repasses.png","alt":"","title":null,"width":922,"height":224}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para verificar a previsão de multa e juros dessa mensalidade basta clicar na lupa e na opção ‘Previsão’"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/botao-previsao-em-alugueis-e-repasses.png","alt":"","title":null,"width":932,"height":275}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Clicando em previsão uma nova tela será exibida onde podemos ter uma ideia dos valores que serão recebidos numa data de pagamento determinada pelo usuário, ou seja, uma previsão:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/previsao-de-multa-e-juros-janela.png","alt":"","title":null,"width":758,"height":469}}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'boleto' LIMIT 1),
  NULL,
  NULL,
  'Previsão de Multas e Juros',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office . Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem ...',
  '2021-03-29T03:00:00Z',
  '2021-03-29T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'previsao-de-multas-e-juros');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'contrato'
WHERE p.slug = 'previsao-de-multas-e-juros'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'office'
WHERE p.slug = 'previsao-de-multas-e-juros'
ON CONFLICT DO NOTHING;

-- impressao-de-repasse-para-o-proprietario
INSERT INTO categories (name, slug, sort_order)
VALUES ('Boleto', 'boleto', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Office', 'office') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Proprietário', 'proprietario') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Repasse', 'repasse') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Impressão de repasse para o proprietário',
  'impressao-de-repasse-para-o-proprietario',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office . Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem ...',
  '{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":1},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vídeo clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.youtube.com/watch?v=-FvhfbjVRyI","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"bold"}],"text":"aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o Office através do site "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.vistasoft.com.br/","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"underline"}],"text":"www.vistasoft.com.br"},{"type":"text","text":" > botão"},{"type":"text","marks":[{"type":"bold"}],"text":" Office"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/botao-office-2.png","alt":"","title":null,"width":482,"height":130}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o código, login e senha, e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Entrar"},{"type":"text","text":". Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem autorização para criar novos usuários."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Login-Office-1.jpg","alt":"","title":null,"width":382,"height":464}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para realizar a impressão ou envio de repasse por e-mail, primeiro precisamos acessar o Módulo de Aluguel e depois pesquisar o contrato conforme a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/caminho-alternando-do-modulo-comercial-para-o-modulo-de-aluguel.png","alt":"","title":null,"width":943,"height":247}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Com Módulo de Aluguel aberto, vamos no título "},{"type":"text","marks":[{"type":"bold"}],"text":"Contrato de Aluguel"},{"type":"text","text":" e selecionamos "},{"type":"text","marks":[{"type":"bold"}],"text":"Pesquisar Contrato:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/pesquisar-contratos.png","alt":"","title":null,"width":943,"height":302}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Nessa próxima tela, inserimos "},{"type":"text","marks":[{"type":"bold"}],"text":"os dados para pesquisar o contrato (número do contrato, data, nome do locador, nome do locatário, endereço e outros)."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao localizar deve aparecer uma tela como a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/resultado-do-contrato-na-pesquisa-de-contratos.png","alt":"","title":null,"width":949,"height":480}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao clicar veremos duas colunas a primeira onde se encontra os alugueis e a segunda o repasse, basta clicar na lupa na coluna repasse e depois em recibos:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/e-700x630.png","alt":"","title":null,"width":700,"height":630}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/ee-700x647.png","alt":"","title":null,"width":700,"height":647}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O sistema exibirá um alerta questionando se queremos adicionar no recibo a forma atual de pagamento do proprietário."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Caso queira adicionar essa informação, basta clicar na opção "},{"type":"text","marks":[{"type":"bold"}],"text":"sim"},{"type":"text","text":", senão, pode você irá selecionar a opção "},{"type":"text","marks":[{"type":"bold"}],"text":"não"},{"type":"text","text":", pois o sistema irá exibir a tela do recibo independente da escolha. A única diferença que será gerada dependendo da escolha, é se a informação irá constar ou não no recibo do proprietário."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/eee-700x632.png","alt":"","title":null,"width":700,"height":632}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Quando clicamos em sim, o sistema vai mostrar uma pré-visualização do recibo, basta salvar o arquivo com a extensão PDF e enviar manualmente pelo seu e-mail ou imprimir o arquivo e entregar pessoalmente ao Locador:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/imagem-do-boleto.png","alt":"","title":null,"width":792,"height":720}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Pronto conseguimos imprimir o recibo com sucesso pelo sistema."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'boleto' LIMIT 1),
  NULL,
  NULL,
  'Impressão de repasse para o proprietário',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office . Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem ...',
  '2021-03-29T03:00:00Z',
  '2021-03-29T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'impressao-de-repasse-para-o-proprietario');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'office'
WHERE p.slug = 'impressao-de-repasse-para-o-proprietario'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'proprietario'
WHERE p.slug = 'impressao-de-repasse-para-o-proprietario'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'repasse'
WHERE p.slug = 'impressao-de-repasse-para-o-proprietario'
ON CONFLICT DO NOTHING;

-- impressao-de-boletos-e-envio-por-e-mail
INSERT INTO categories (name, slug, sort_order)
VALUES ('Boleto', 'boleto', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Office', 'office') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Impressão de boletos e envio por e-mail',
  'impressao-de-boletos-e-envio-por-e-mail',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office .   Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não te...',
  '{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":1},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vídeo clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.youtube.com/watch?v=7Gj2IQu9Ndk","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"bold"}],"text":"aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o Office através do site "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.vistasoft.com.br/","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"underline"}],"text":"www.vistasoft.com.br"},{"type":"text","text":" > botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Office"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Site-acesso-office-4.jpg","alt":"","title":null,"width":641,"height":160}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o código, login e senha, e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Entrar"},{"type":"text","text":". Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem autorização para criar novos usuários."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Login-Office-1.jpg","alt":"","title":null,"width":382,"height":464}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para realizar a impressão ou envio de boleto por e-mail, primeiro precisamos acessar o módulo de aluguel e depois pesquisar o contrato conforme a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Menu-Aluguel.jpg","alt":"","title":null,"width":276,"height":241}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Com módulo de aluguel aberto, vamos no título "},{"type":"text","marks":[{"type":"bold"}],"text":"Contrato de Aluguel"},{"type":"text","text":" e selecionamos "},{"type":"text","marks":[{"type":"bold"}],"text":"Pesquisar Contrato:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Contrato-Pesquisar-Contratos.jpg","alt":"","title":null,"width":807,"height":230}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Nessa próxima tela, inserimos "},{"type":"text","marks":[{"type":"bold"}],"text":"os dados para pesquisar o contrato (número do contrato, data, nome do locador, nome do locatário, endereço e outros)."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao localizar deve aparecer uma tela como a imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/pesquise-de-contratos-pelo-codigo.png","alt":"","title":null,"width":896,"height":394}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/resultado-do-contrato-na-pesquisa-de-contratos.png","alt":"","title":null,"width":891,"height":451}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao clicar veremos duas colunas a primeira onde se encontra os alugueis e a segunda o repasse, basta clicar na lupa na coluna aluguel e depois em boleto:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/contrato-com-o-botao-lupa-aluguel-realcado.png","alt":"","title":null,"width":824,"height":413}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/botao-boleto-na-mensalidade-de-aluguel.png","alt":"","title":null,"width":823,"height":414}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O sistema exibirá uma nova tela onde podemos configurar uma mensagem que será impressa no boleto por exemplo: "},{"type":"text","marks":[{"type":"bold"}],"text":"Pagável em qualquer correspondente bancário até o vencimento"},{"type":"text","text":", se desejamos encaminhar por e-mail ou imprimir onde será gerado um PDF, basta selecionar uma das duas opções:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/ddd-700x459.png","alt":"","title":null,"width":700,"height":459}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Caso selecione imprimir o boleto, uma tela de visualização do boleto será exibida conforme imagem abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/boleto-sem-logo.png","alt":"","title":null,"width":693,"height":498}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Feito os passos acima conseguimos encaminhar ou imprimir o boleto para o locatário."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'boleto' LIMIT 1),
  NULL,
  NULL,
  'Impressão de boletos e envio por e-mail',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão  Office .   Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não te...',
  '2021-03-29T03:00:00Z',
  '2021-03-29T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'impressao-de-boletos-e-envio-por-e-mail');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'office'
WHERE p.slug = 'impressao-de-boletos-e-envio-por-e-mail'
ON CONFLICT DO NOTHING;

-- estorno-de-boletos
INSERT INTO categories (name, slug, sort_order)
VALUES ('Boleto', 'boleto', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Contrato', 'contrato') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Office', 'office') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Estorno de Boletos/Mensalidades de Aluguel',
  'estorno-de-boletos',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão   Office .   Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não t...',
  '{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":1},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Vídeo clique "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.loom.com/share/793245940fb8446ebd92217d13744a0b","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"bold"}],"text":"aqui"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acesse o Office através do site "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.vistasoft.com.br/","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}},{"type":"underline"}],"text":"www.vistasoft.com.br"},{"type":"text","text":" > botão "},{"type":"text","marks":[{"type":"bold"}],"text":" Office"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Site-acesso-office-3.jpg","alt":"","title":null,"width":641,"height":160}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Informe o código, login e senha, e clique no botão "},{"type":"text","marks":[{"type":"bold"}],"text":"Entrar"},{"type":"text","text":". Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não tem autorização para criar novos usuários."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Login-Office-1.jpg","alt":"","title":null,"width":382,"height":464}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para estornar um boleto/mensalidade, primeiramente precisamos nos direcionar até o módulo de aluguel, clicando no ícone indicado logo abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Menu-Aluguel-1.jpg","alt":"","title":null,"width":276,"height":241}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Com módulo de aluguel aberto, vamos no título "},{"type":"text","marks":[{"type":"bold"}],"text":"Contrato de Aluguel"},{"type":"text","text":" e selecionamos "},{"type":"text","marks":[{"type":"bold"}],"text":"Pesquisar Contrato:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Contrato-aluguel-pesquisar-contratos.jpg","alt":"","title":null,"width":841,"height":255}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Nessa próxima tela, use os filtros de pesquisa disponíveis"},{"type":"text","marks":[{"type":"bold"}],"text":" para pesquisar o contrato (número do contrato, data, nome do locador, nome do locatário, endereço e outros)."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Filtro-pesquisa-contratos-1024x418.jpg","alt":"","title":null,"width":1024,"height":418}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao localizar deve aparecer uma tela como a imagem abaixo, clique em "},{"type":"text","marks":[{"type":"bold"}],"text":"Alugueis:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/Contrato-Alugueis-1-1024x321.jpg","alt":"","title":null,"width":1024,"height":321}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Na próxima tela encontraremos as mensalidades duas colunas, a primeira "},{"type":"text","marks":[{"type":"bold"}],"text":"“Aluguel”"},{"type":"text","text":" onde podemos visualizar os alugueis e a segunda "},{"type":"text","marks":[{"type":"bold"}],"text":"“Repasse”"},{"type":"text","text":" onde localizamos os repasses. Para estornar um boleto/mensalidade basta clicar na lupa e depois na opção indicada logo abaixo:"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"IMPORTANTE: Caso você esteja estornando um boleto que está em remessa e registrado certifique-se de que já efetuou a ação de cancelamento no seu banco, pois o estorno no sistema, não cancela o boleto já registrado no banco."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Depois clicamos em "},{"type":"text","marks":[{"type":"bold"}],"text":"Estornar"},{"type":"text","text":":"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/estornar-aluguel.jpg","alt":"","title":null,"width":924,"height":414}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Quando clicar o sistema dará uma mensagem se você deseja estornar a mensalidade:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/estornar-aluguel-sim.jpg","alt":"","title":null,"width":934,"height":440}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Após realizar esses passos o sistema dará uma mensagem confirmando a alteração e como podemos perceber na coluna de aluguel  nos campos data de pagamento e valor pago, estão em branco, confirmando que o aluguel foi estornado e aguardando nova baixa."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2021/03/mensalidade-estornada-1024x356.jpg","alt":"","title":null,"width":1024,"height":356}}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'boleto' LIMIT 1),
  NULL,
  NULL,
  'Estorno de Boletos/Mensalidades de Aluguel',
  'Vídeo clique  aqui Acesse o Office através do site  www.vistasoft.com.br  > botão   Office .   Informe o código, login e senha, e clique no botão  Entrar . Caso não tenha um login, é necessário solicitar ao usuário admin. O suporte não t...',
  '2021-03-29T03:00:00Z',
  '2021-03-29T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'estorno-de-boletos');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'contrato'
WHERE p.slug = 'estorno-de-boletos'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'office'
WHERE p.slug = 'estorno-de-boletos'
ON CONFLICT DO NOTHING;

-- convite-proativo
INSERT INTO categories (name, slug, sort_order)
VALUES ('Chat', 'chat', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('CRM', 'crm') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'CHAT – Convite proativo',
  'convite-proativo',
  'O chat proativo é utilizado para incentivar o visitante à realizar contato com a imobiliária. Com essa configuração habilitada, após permanecer no site por um período ou visitar determinado número de páginas, o visitante é convidado a en...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O chat proativo é utilizado para incentivar o visitante à realizar contato com a imobiliária. Com essa configuração habilitada, após permanecer no site por um período ou visitar determinado número de páginas, o visitante é convidado a entrar em contato pelo chat."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para configurar os convites acesse o "},{"type":"text","marks":[{"type":"bold"}],"text":"Menu > Sistema"},{"type":"text","text":", o item "},{"type":"text","marks":[{"type":"bold"}],"text":"Chat"},{"type":"text","text":" e a aba "},{"type":"text","marks":[{"type":"bold"}],"text":"Chat Proativo"},{"type":"text","text":"."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Na configuração é definido um título, apenas para identificação, o departamento que executará o convite e a mensagem que será exibida ao visitante para convidá-lo a entrar em contato. Caso queira que o convite seja executado independente do departamento, escolha a opção "},{"type":"text","marks":[{"type":"italic"}],"text":"Todos"},{"type":"text","text":". Para cada convite é necessário escolher apenas um tipo de disparo: tempo de permanência ou número de páginas acessadas. Porém, se desejar que o convite seja exibido em qualquer uma das condições basta criar mais de um convite."}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2017/07/conviteChatProativo.png","alt":"","title":null,"width":496,"height":404}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"No site da imobiliária, quando a condição do tipo de disparo é atendida o chat abrirá automaticamente. Será exibida a mensagem inicial configurada e os campos do formulário inicial, para que ele entre em contato. O visitante poderá fazer o preenchimento e entrar em contato ou recusar."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Após realizar a configuração dos convites é necessário acessar a aba "},{"type":"text","marks":[{"type":"italic"}],"text":"Código de integração "},{"type":"text","text":"e marcar a opção "},{"type":"text","marks":[{"type":"italic"}],"text":"Verificar automaticamente o uso de chat proativo"},{"type":"text","text":". Com essa opção marcada você deverá copiar o código de integração e atualizá-lo no site da imobiliária. Somente após a substituição desse código no site é que o convite proativo funcionará."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2017/07/chat.png","alt":"","title":null,"width":1592,"height":886}}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'chat' LIMIT 1),
  NULL,
  NULL,
  'CHAT – Convite proativo',
  'O chat proativo é utilizado para incentivar o visitante à realizar contato com a imobiliária. Com essa configuração habilitada, após permanecer no site por um período ou visitar determinado número de páginas, o visitante é convidado a en...',
  '2017-07-13T03:00:00Z',
  '2017-07-13T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'convite-proativo');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'crm'
WHERE p.slug = 'convite-proativo'
ON CONFLICT DO NOTHING;

-- lembrete-clientes-desatualizados
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Lembretes', 'lembretes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'MENUS LEMBRETES – Clientes Desatualizados',
  'lembrete-clientes-desatualizados',
  'O lembrete “Clientes Desatualizados” apresenta a listagem dos clientes que não tiveram históricos lançados por um determinado período de dias em seu cadastro.  Este período deve ser configurado no menu -> sistema, determinando em quantos...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O lembrete “Clientes Desatualizados” apresenta a listagem dos clientes que não tiveram históricos lançados por um determinado período de dias em seu cadastro."},{"type":"hardBreak"},{"type":"text","text":"Este período deve ser configurado no menu -> sistema, determinando em quantos dias o cliente é considerado desatualizado."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para visualizar o lembrete, acesse “Menu > Lembretes > Clientes desatualizados”"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/lembretes.png","alt":"","title":null,"width":881,"height":383}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Clicando sobre estes resultados você acessa o cadastro do cliente e atualiza o atendimento, lançando um novo "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/artigos/historico-de-atendimento-ao-cliente","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"histórico de atendimento ao cliente"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/lembretes3.png","alt":"","title":null,"width":876,"height":422}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"codeBlock","attrs":{"language":null}}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'MENUS LEMBRETES – Clientes Desatualizados',
  'O lembrete “Clientes Desatualizados” apresenta a listagem dos clientes que não tiveram históricos lançados por um determinado período de dias em seu cadastro.  Este período deve ser configurado no menu -> sistema, determinando em quantos...',
  '2016-07-21T03:00:00Z',
  '2016-07-21T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'lembrete-clientes-desatualizados');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'lembretes'
WHERE p.slug = 'lembrete-clientes-desatualizados'
ON CONFLICT DO NOTHING;

-- alterar-logo-marca-da-imobiliaria
INSERT INTO categories (name, slug, sort_order)
VALUES ('Configurações', 'configuracoes', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('CRM', 'crm') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Alterar Logotipo da Imobiliária',
  'alterar-logo-marca-da-imobiliaria',
  'Para alterar o logotipo da imobiliária , dentro do seu CRM acesse  “Menu > Sistema > Identidade Visual > Logotipo”  . Ilustrados nas imagens abaixo:   IDENTIDADE VISUAL – LOGOTIPO Dentro da aba  “logotipo”  clique em para localizar em se...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para alterar o logotipo da imobiliária , dentro do seu CRM acesse "},{"type":"text","marks":[{"type":"bold"}],"text":"“Menu > Sistema > Identidade Visual > Logotipo”"},{"type":"text","text":" . Ilustrados nas imagens abaixo:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/menu.png","alt":"","title":null,"width":339,"height":866}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"IDENTIDADE VISUAL – LOGOTIPO"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/logo-1.png","alt":"","title":null,"width":1296,"height":652}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Dentro da aba "},{"type":"text","marks":[{"type":"bold"}],"text":"“logotipo”"},{"type":"text","text":" clique em para localizar em seu computador a imagem desejada. E em finalize clicando em ."}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/salvar.png","alt":"salvar","title":null,"width":93,"height":34}},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/selecionar.png","alt":"selecionar","title":null,"width":125,"height":33}},{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"IMPORTANTE:"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Orientamos enviar o arquivo em formato PNG OU JPG."}]}]}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'configuracoes' LIMIT 1),
  NULL,
  NULL,
  'Alterar Logotipo da Imobiliária',
  'Para alterar o logotipo da imobiliária , dentro do seu CRM acesse  “Menu > Sistema > Identidade Visual > Logotipo”  . Ilustrados nas imagens abaixo:   IDENTIDADE VISUAL – LOGOTIPO Dentro da aba  “logotipo”  clique em para localizar em se...',
  '2016-07-21T03:00:00Z',
  '2016-07-21T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'alterar-logo-marca-da-imobiliaria');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'crm'
WHERE p.slug = 'alterar-logo-marca-da-imobiliaria'
ON CONFLICT DO NOTHING;

-- lembrete-imoveis-esperados-pelos-seus-clientes
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Lembretes', 'lembretes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'MENU LEMBRETES – Imóveis esperados pelos seus clientes',
  'lembrete-imoveis-esperados-pelos-seus-clientes',
  'O lembrete de imóveis esperados pelos seus clientes, serve para listar os novos cadastros de imóveis que se enquadram no perfil dos clientes que estão na  espera de imóveis  , mantendo o usuário sempre atualizado sobre as novas opções de...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O lembrete de imóveis esperados pelos seus clientes, serve para listar os novos cadastros de imóveis que se enquadram no perfil dos clientes que estão na "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/artigos/perfil-de-imoveis-espera-de-imoveis","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"espera de imóveis"},{"type":"text","text":" , mantendo o usuário sempre atualizado sobre as novas opções de ofertas disponíveis."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para visualizar o lembrete, acesse "},{"type":"text","marks":[{"type":"bold"}],"text":"“Menu > Lembretes > Imóveis esperados pelos seus Clientes”"},{"type":"text","text":"."},{"type":"hardBreak"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/06/imoveis-esperados.jpg","alt":"imoveis esperados","title":null,"width":500,"height":59}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Na tela de pesquisa, serão listados os clientes e as informações do(s) imóvel(is) disponibilizados (O cliente será listado uma vez para cada um dos imóveis disponibilizados na espera)."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Acessando o perfil do cliente, você visualiza os imóveis do perfil do cliente e os imóveis da espera, salvos como favoritos logo abaixo da aba ."}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/02/perfil1.jpg","alt":"perfil","title":null,"width":159,"height":35}},{"type":"codeBlock","attrs":{"language":null},"content":[{"type":"text","text":"Clique aqui para acessar outros artigos relacionados à lembretes!"}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'MENU LEMBRETES – Imóveis esperados pelos seus clientes',
  'O lembrete de imóveis esperados pelos seus clientes, serve para listar os novos cadastros de imóveis que se enquadram no perfil dos clientes que estão na  espera de imóveis  , mantendo o usuário sempre atualizado sobre as novas opções de...',
  '2016-07-21T03:00:00Z',
  '2016-07-21T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'lembrete-imoveis-esperados-pelos-seus-clientes');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'lembretes'
WHERE p.slug = 'lembrete-imoveis-esperados-pelos-seus-clientes'
ON CONFLICT DO NOTHING;

-- acessar-boleto-detalhes-plano
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Dúvidas frequentes', 'duvidas-frequentes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Minha conta', 'minha-conta') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Como acessar os boletos e ver detalhes do plano contratado',
  'acessar-boleto-detalhes-plano',
  'Através da página  “Minha conta”  localizado no canto superior direito, é possível visualizar os detalhes do plano, consultar as licenças em uso e acessar os boletos em aberto. Ilustrando na imagem abaixo: Nesta primeira sessão estão dis...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Através da página "},{"type":"text","marks":[{"type":"bold"}],"text":"“Minha conta”"},{"type":"text","text":" localizado no canto superior direito, é possível visualizar os detalhes do plano, consultar as licenças em uso e acessar os boletos em aberto. Ilustrando na imagem abaixo:"}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/screenshot_1.png","alt":"","title":null,"width":561,"height":385}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Nesta primeira sessão estão disponíveis os dados básicos, o plano contrato e a utilização atual dos recursos disponíveis de licenças (usuários), Imóveis e Clientes:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/planos.png","alt":"","title":null,"width":1190,"height":715}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao lado direito constam as faturas em aberto e a situação financeira da sua conta. Caso tenha algum boleto disponível, será possível acessá-lo por aqui:"}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/screenshot_3-700x162.png","alt":"","title":null,"width":700,"height":162}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Abaixo é possível realizar a alteração de plano simulando os valores e as funções disponíveis:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/planos-disponiveis.png","alt":"","title":null,"width":643,"height":757}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para saber mais informações detalhadas dos planos, é só selecionar "},{"type":"text","marks":[{"type":"bold"}],"text":"“saiba mais”"},{"type":"text","text":" ao lado."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"E nesta última parte estão disponíveis as extensões ativas no seu CRM:"}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/screenshot_5-700x375.png","alt":"","title":null,"width":700,"height":375}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Precisa gerar uma 2ª via? "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/artigos/como-gerar-a-2a-via-do-boleto-vista","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"Clique aqui"},{"type":"text","text":" e veja como fazer!"},{"type":"hardBreak"},{"type":"text","text":"Ficou com alguma dúvida sobre a cobrança? Te explicamos os detalhes "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/artigos/como-entender-o-que-esta-sendo-cobrado-pela-vista","target":"_blank","rel":"noopener noreferrer","class":null,"title":null}}],"text":"nesse outro link"},{"type":"text","text":"."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'Como acessar os boletos e ver detalhes do plano contratado',
  'Através da página  “Minha conta”  localizado no canto superior direito, é possível visualizar os detalhes do plano, consultar as licenças em uso e acessar os boletos em aberto. Ilustrando na imagem abaixo: Nesta primeira sessão estão dis...',
  '2016-07-01T03:00:00Z',
  '2016-07-01T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'acessar-boleto-detalhes-plano');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'duvidas-frequentes'
WHERE p.slug = 'acessar-boleto-detalhes-plano'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'minha-conta'
WHERE p.slug = 'acessar-boleto-detalhes-plano'
ON CONFLICT DO NOTHING;

-- como-posso-atualizar-os-clientes
INSERT INTO categories (name, slug, sort_order)
VALUES ('Atendimento de clientes', 'atendimento-de-clientes', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('CRM', 'crm') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Como posso Atualizar os Clientes?',
  'como-posso-atualizar-os-clientes',
  'Para atualizar um cliente é necessário buscar o cadastro do mesmo no link  “Menu > Clientes” . Na página de detalhe do cliente, busque pela aba  “Histórico”  clique no ícone com um símbolo de mais “+”, lance um novo histórico e por fim s...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para atualizar um cliente é necessário buscar o cadastro do mesmo no link "},{"type":"text","marks":[{"type":"bold"}],"text":"“Menu > Clientes”"},{"type":"text","text":"."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2020/01/PORTAIS.png","alt":"","title":null,"width":549,"height":839}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Na página de detalhe do cliente, busque pela aba "},{"type":"text","marks":[{"type":"bold"}],"text":"“Histórico”"},{"type":"text","text":" clique no ícone com um símbolo de mais “+”, lance um novo histórico e por fim salve as alterações."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Lembrando que qualquer histórico lançado atualizará o cliente "},{"type":"text","marks":[{"type":"bold"},{"type":"italic"}],"text":"desde que quem esteja fazendo a inserção/Alteração do Histórico seja o corretor vinculado ao Cliente."}]},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/historico1.jpg","alt":"","title":null,"width":439,"height":145}},{"type":"image","attrs":{"src":"http://ajuda.vistasoft.com.br/wp-content/uploads/2016/03/Incluir-Histórico_1.jpg","alt":"Incluir Histórico_1","title":null,"width":300,"height":260}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Com essa ação a atualização da cliente é realizada, podendo então ser visualizado sua última atualização da aba de Pesquisa de Clientes:"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2016/07/Ultima-atualizacao-Cliente.png","alt":"","title":null,"width":1026,"height":571}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'atendimento-de-clientes' LIMIT 1),
  NULL,
  NULL,
  'Como posso Atualizar os Clientes?',
  'Para atualizar um cliente é necessário buscar o cadastro do mesmo no link  “Menu > Clientes” . Na página de detalhe do cliente, busque pela aba  “Histórico”  clique no ícone com um símbolo de mais “+”, lance um novo histórico e por fim s...',
  '2016-07-01T03:00:00Z',
  '2016-07-01T03:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'como-posso-atualizar-os-clientes');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'crm'
WHERE p.slug = 'como-posso-atualizar-os-clientes'
ON CONFLICT DO NOTHING;

-- como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Dúvidas frequentes', 'duvidas-frequentes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Como faço para cadastrar um cliente que já esta cadastrado no CRM como proprietário?',
  'como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario',
  'O CRM não permitirá um segundo cadastro seja de cliente ou proprietário, pois o mesmo possui um sistema de restrição de duplicidade, baseado nos telefones de contato. Quando realizar o cadastro de um cliente já existente na base, aparece...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O CRM não permitirá um segundo cadastro seja de cliente ou proprietário, pois o mesmo possui um sistema de restrição de duplicidade, baseado nos telefones de contato."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Quando realizar o cadastro de um cliente já existente na base, aparecerá um aviso de duplicidade. Basta você clicar em "},{"type":"text","marks":[{"type":"bold"}],"text":"Selecionar cliente"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/2-4.png","alt":"","title":null,"width":568,"height":283}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Feito isso, um cadastro que constava ser apenas de proprietário será automaticamente marcado no check-box de cliente"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_3.png","alt":"","title":null,"width":220,"height":44}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_2.png","alt":"","title":null,"width":225,"height":44}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Caso já tenha o conhecimento de que o proprietário está já cadastrado na base, basta ir em "},{"type":"text","marks":[{"type":"bold"}],"text":"Menu > Proprietários"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_5.png","alt":"","title":null,"width":322,"height":333}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Faça a pesquisa pelo proprietário utilizando o filtro como achar mais fácil de identificar."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_6.png","alt":"","title":null,"width":952,"height":434}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao encontrar o cadastro do proprietário, clique em para editar o cadastro do proprietário e marque o check-box e por fim, clique em  para salvar a alteração."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_10.png","alt":"","title":null,"width":30,"height":30}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_9.png","alt":"","title":null,"width":74,"height":25}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_7.png","alt":"","title":null,"width":56,"height":53}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Screenshot_8.png","alt":"","title":null,"width":985,"height":430}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Neste momento a pessoa em questão estará cadastrada no sistema como Cliente e Proprietário."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'Como faço para cadastrar um cliente que já esta cadastrado no CRM como proprietário?',
  'O CRM não permitirá um segundo cadastro seja de cliente ou proprietário, pois o mesmo possui um sistema de restrição de duplicidade, baseado nos telefones de contato. Quando realizar o cadastro de um cliente já existente na base, aparece...',
  '2015-12-28T02:00:00Z',
  '2015-12-28T02:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'duvidas-frequentes'
WHERE p.slug = 'como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario'
ON CONFLICT DO NOTHING;

-- imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Dúvidas frequentes', 'duvidas-frequentes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Imóvel está exibindo fotos que não foram inseridas em seu cadastro',
  'imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro',
  'O CRM possui um sistema de vínculo entre Empreendimentos e Unidades. Neste caso, quando é feito este vínculo as unidades herdam algumas informações do empreendimento. Dentre estas informações estão as fotos. Sendo assim, caso você esteja...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"O CRM possui um sistema de vínculo entre Empreendimentos e Unidades."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Neste caso, quando é feito este vínculo as unidades herdam algumas informações do empreendimento. Dentre estas informações estão as fotos."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Sendo assim, caso você esteja visualizando imagens em um imóvel que você não cadastrou nenhuma foto, verifique se este imóvel não está vinculado à um empreendimento."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"No layout de cadastro de imóveis, o vínculo com o empreendimento é feito através do campo"},{"type":"text","marks":[{"type":"bold"}],"text":" ‘Pertence ao Empreendimento’."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Caso deseje retirar o vinculo do Empreendimento na Unidade, basta clicar no X do mesmo campo."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Vinculo.png","alt":"","title":null,"width":1912,"height":548}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'Imóvel está exibindo fotos que não foram inseridas em seu cadastro',
  'O CRM possui um sistema de vínculo entre Empreendimentos e Unidades. Neste caso, quando é feito este vínculo as unidades herdam algumas informações do empreendimento. Dentre estas informações estão as fotos. Sendo assim, caso você esteja...',
  '2015-12-28T02:00:00Z',
  '2015-12-28T02:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'duvidas-frequentes'
WHERE p.slug = 'imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro'
ON CONFLICT DO NOTHING;

-- lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Dúvidas frequentes', 'duvidas-frequentes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Por que o nome do usuário continua desatualizado na lista de pesquisa?',
  'lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa',
  'Se algum usuário do sistema tenha sido renomeado e nos layouts de pesquisa o seu nome continua desatualizado, basta fechar a tela de pesquisa, clicar no botão LOGIN, localizado no canto superior direito da tela e, em seguida, clicar na o...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Se algum usuário do sistema tenha sido renomeado e nos layouts de pesquisa o seu nome continua desatualizado, basta fechar a tela de pesquisa, clicar no botão LOGIN, localizado no canto superior direito da tela e, em seguida, clicar na opção LIMPAR CACHE LAYOUT, conforme print."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/Login.png","alt":"","title":null,"width":669,"height":777}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Feito este procedimento, saia e entre novamente no sistema. A partir disso a pesquisa estará atualizada."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Este procedimento é válido para qualquer layout de pesquisa dentro do sistema."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'Por que o nome do usuário continua desatualizado na lista de pesquisa?',
  'Se algum usuário do sistema tenha sido renomeado e nos layouts de pesquisa o seu nome continua desatualizado, basta fechar a tela de pesquisa, clicar no botão LOGIN, localizado no canto superior direito da tela e, em seguida, clicar na o...',
  '2015-12-28T02:00:00Z',
  '2015-12-28T02:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'duvidas-frequentes'
WHERE p.slug = 'lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa'
ON CONFLICT DO NOTHING;

-- alterar-e-mail-de-contato-nas-cargas-de-portais
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Integrações', 'integracoes') ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Portais', 'portais') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'PORTAIS – Alterar e-mail de contato nas cargas de portais',
  'alterar-e-mail-de-contato-nas-cargas-de-portais',
  'Os e-mails de contato enviados nas cargas para portais são capturados diretamente dos dados das agências cadastradas no CRM. Sendo assim, para alterar o e-mail de contato é necessário alterar o e-mail de contato da agência. Para realizar...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Os e-mails de contato enviados nas cargas para portais são capturados diretamente dos dados das agências cadastradas no CRM. Sendo assim, para alterar o e-mail de contato é necessário alterar o e-mail de contato da agência."}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para realizar esta alteração clique no menu principal do sistema e em seguida clique na opção ."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/2-1.png","alt":"","title":null,"width":205,"height":39}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/1-1.png","alt":"","title":null,"width":80,"height":38}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Abrirá a relação de agências, e, para alterar, basta clicar no ícone lápis ou então em cima do texto (nome da agência)."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/AGENCIA.png","alt":"","title":null,"width":1679,"height":414}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Ao clicar, abrirá o layout de cadastro de informação da agência. Lembrando que os campos em amarelo são campos obrigatórios."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/AGENCIA01.png","alt":"","title":null,"width":876,"height":755}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":" "}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Assim, para alterar e-mail de contato nas cargas de portais, basta escolher a agência que deseja alterar o e-mail  e clicar no ícone que fica ao lado do nome de cada agência. Neste momento o usuário terá acesso à todos os dados cadastrais da agência escolhida. Basta alterar o e-mail no campo correspondente   e, em seguida clicar em ."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/6.png","alt":"","title":null,"width":89,"height":40}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/5-1.png","alt":"","title":null,"width":301,"height":60}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/4-1.png","alt":"","title":null,"width":27,"height":29}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Após as alterações, o e-mail será atualizada na próxima carga gerada pelo sistema. Vale lembrar que a atualização também depende do processamento da carga pelo portal."}]}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'PORTAIS – Alterar e-mail de contato nas cargas de portais',
  'Os e-mails de contato enviados nas cargas para portais são capturados diretamente dos dados das agências cadastradas no CRM. Sendo assim, para alterar o e-mail de contato é necessário alterar o e-mail de contato da agência. Para realizar...',
  '2015-12-28T02:00:00Z',
  '2015-12-28T02:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'alterar-e-mail-de-contato-nas-cargas-de-portais');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'integracoes'
WHERE p.slug = 'alterar-e-mail-de-contato-nas-cargas-de-portais'
ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'portais'
WHERE p.slug = 'alterar-e-mail-de-contato-nas-cargas-de-portais'
ON CONFLICT DO NOTHING;

-- alterar-foto-do-perfil-do-usuario
INSERT INTO categories (name, slug, sort_order)
VALUES ('CRM', 'crm', 0)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tags (name, slug) VALUES ('Usuários', 'usuarios') ON CONFLICT (slug) DO NOTHING;
INSERT INTO posts (
  title, slug, excerpt, content, status, category_id, author_id,
  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at
) VALUES (
  'Usuário – alterar foto do perfil',
  'alterar-foto-do-perfil-do-usuario',
  'Para alterar a foto do seu perfil de usuário, clique no botão  que fica localizado no canto superior direito do sistema. Em seguida clique na opção Dentro do seu perfil haverá no canto direito um local para alterar sua foto, onde você po...',
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Para alterar a foto do seu perfil de usuário, clique no botão  que fica localizado no canto superior direito do sistema."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/1-2.png","alt":"","title":null,"width":63,"height":50}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Em seguida clique na opção"}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/1-3.png","alt":"","title":null,"width":181,"height":35}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/usuarios-6.png","alt":"","title":null,"width":543,"height":380}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Dentro do seu perfil haverá no canto direito um local para alterar sua foto, onde você pode clicar no ícone de   e selecionar uma nova imagem que esteja armazenada no seu computador."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/1-5.png","alt":"","title":null,"width":44,"height":28}},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/usuarios7.png","alt":"","title":null,"width":444,"height":248}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"É importante ressaltar que as imagens devem estar nos formatos PNG ou JPGE."}]},{"type":"image","attrs":{"src":"https://ajuda.vistasoft.com.br/wp-content/uploads/2015/12/foto-usuario.png","alt":"","title":null,"width":418,"height":229}}]}'::jsonb,
  'published',
  (SELECT id FROM categories WHERE slug = 'crm' LIMIT 1),
  NULL,
  NULL,
  'Usuário – alterar foto do perfil',
  'Para alterar a foto do seu perfil de usuário, clique no botão  que fica localizado no canto superior direito do sistema. Em seguida clique na opção Dentro do seu perfil haverá no canto direito um local para alterar sua foto, onde você po...',
  '2015-12-28T02:00:00Z',
  '2015-12-28T02:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  status = 'published',
  category_id = EXCLUDED.category_id,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
  updated_at = NOW();

DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = 'alterar-foto-do-perfil-do-usuario');
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.slug = 'usuarios'
WHERE p.slug = 'alterar-foto-do-perfil-do-usuario'
ON CONFLICT DO NOTHING;

-- Posts that could not be fetched automatically:
--   google-chrome-paginas: empty content from WordPress REST API

-- Verificação pós-migração
SELECT COUNT(*) AS total_posts FROM posts WHERE status = 'published';

SELECT m.slug, m.title, CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'OK' END AS status
FROM migration_missing_slugs m
LEFT JOIN posts p ON p.slug = m.slug
ORDER BY m.slug;

COMMIT;
