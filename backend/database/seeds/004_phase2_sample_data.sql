-- database/seeds/004_phase2_sample_data.sql
-- Dados de exemplo definitivos para Fase 2

BEGIN;

-- =====================================================
-- USUÁRIOS DE EXEMPLO
-- =====================================================

-- Inserir usuário admin
INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
VALUES (
    'admin', 
    'admin@matchit.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Administrador MatchIt', 
    true, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste
INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
VALUES (
    'testuser', 
    'test@matchit.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Usuário de Teste', 
    false, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- IMAGENS DE EXEMPLO PARA TORNEIOS
-- =====================================================

-- Get user IDs
WITH admin_user AS (SELECT id FROM users WHERE email = 'admin@matchit.com' LIMIT 1)

-- Cores category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags, 
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
) 
SELECT 
    'cores', 
    'https://picsum.photos/400/500?random=' || generate_series,
    'https://picsum.photos/200/250?random=' || generate_series,
    'Paleta de Cores ' || generate_series,
    'Combinação harmoniosa de cores para inspiração',
    ARRAY['moderno', 'vibrante', 'harmônico'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    245760 + (generate_series * 1000), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 500 + 50)::INTEGER,
    FLOOR(RANDOM() * 100 + 10)::INTEGER,
    (RANDOM() * 80 + 20)::DECIMAL(5,2)
FROM generate_series(1, 16), admin_user
ON CONFLICT DO NOTHING;

-- Estilos category  
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'estilos',
    'https://picsum.photos/400/500?random=' || (generate_series + 100),
    'https://picsum.photos/200/250?random=' || (generate_series + 100),
    'Estilo Fashion ' || generate_series,
    'Tendência de moda contemporânea',
    ARRAY['fashion', 'contemporâneo', 'elegante'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    267890 + (generate_series * 1200), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 600 + 100)::INTEGER,
    FLOOR(RANDOM() * 80 + 15)::INTEGER,
    (RANDOM() * 75 + 25)::DECIMAL(5,2)
FROM generate_series(1, 16), admin_user
ON CONFLICT DO NOTHING;

-- Calçados category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'calcados',
    'https://picsum.photos/400/500?random=' || (generate_series + 200),
    'https://picsum.photos/200/250?random=' || (generate_series + 200),
    'Calçado Style ' || generate_series,
    'Sapatos que definem personalidade',
    ARRAY['conforto', 'estilo', 'qualidade'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    234567 + (generate_series * 800), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 400 + 80)::INTEGER,
    FLOOR(RANDOM() * 60 + 20)::INTEGER,
    (RANDOM() * 70 + 30)::DECIMAL(5,2)
FROM generate_series(1, 16), admin_user
ON CONFLICT DO NOTHING;

-- Acessórios category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'acessorios',
    'https://picsum.photos/400/500?random=' || (generate_series + 300),
    'https://picsum.photos/200/250?random=' || (generate_series + 300),
    'Acessório Premium ' || generate_series,
    'Acessórios que complementam seu look',
    ARRAY['premium', 'sofisticado', 'versátil'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    189456 + (generate_series * 600), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 300 + 50)::INTEGER,
    FLOOR(RANDOM() * 50 + 10)::INTEGER,
    (RANDOM() * 85 + 15)::DECIMAL(5,2)
FROM generate_series(1, 12), admin_user
ON CONFLICT DO NOTHING;

-- Texturas category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'texturas',
    'https://picsum.photos/400/500?random=' || (generate_series + 400),
    'https://picsum.photos/200/250?random=' || (generate_series + 400),
    'Textura Natural ' || generate_series,
    'Texturas que despertam sensações',
    ARRAY['natural', 'tátil', 'orgânico'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    298765 + (generate_series * 1100), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 250 + 30)::INTEGER,
    FLOOR(RANDOM() * 40 + 8)::INTEGER,
    (RANDOM() * 60 + 40)::DECIMAL(5,2)
FROM generate_series(1, 10), admin_user
ON CONFLICT DO NOTHING;

-- =====================================================
-- PREFERÊNCIAS DE EXEMPLO (FASE 0)
-- =====================================================

WITH test_user AS (SELECT id FROM users WHERE email = 'test@matchit.com' LIMIT 1)
INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
SELECT 
    test_user.id,
    unnest(ARRAY['cores', 'estilos', 'acessorios']),
    unnest(ARRAY['preferencia_1', 'preferencia_2', 'preferencia_3']),
    unnest(ARRAY['opcao_moderna', 'opcao_casual', 'opcao_minimalista']),
    NOW()
FROM test_user
ON CONFLICT (user_id, category, question_id) DO NOTHING;

COMMIT;
