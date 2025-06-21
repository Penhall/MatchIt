-- scripts/fix/003_insert_test_user.sql - Inserção de usuário de teste
-- Arquivo: scripts/fix/003_insert_test_user.sql

-- =====================================================
-- INSERÇÃO DE USUÁRIO DE TESTE
-- =====================================================

-- Inserir usuário de teste se não existir
INSERT INTO users (id, email, name, password_hash, email_verified, is_active)
VALUES (
    '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid,
    'finaltest@test.com',
    'Test User',
    '$2b$10$rQJ8zY9pL5fN1XcVeF2dG.K4HHsGJ1mS4tL9wN3eR8cT6vP2hQ7aK', -- senha: 123456
    true,
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    email_verified = EXCLUDED.email_verified,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Inserir perfil do usuário de teste se não existir
INSERT INTO user_profiles (
    user_id,
    display_name,
    city,
    gender,
    bio,
    is_vip,
    age,
    style_completion_percentage,
    interests,
    style_game_level,
    style_game_xp
)
VALUES (
    '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid,
    'Test User',
    'São Paulo',
    'other',
    'Usuário de teste para desenvolvimento',
    false,
    25,
    50,
    ARRAY['tecnologia', 'música', 'esportes'],
    1,
    100
) ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    city = EXCLUDED.city,
    gender = EXCLUDED.gender,
    bio = EXCLUDED.bio,
    age = EXCLUDED.age,
    style_completion_percentage = EXCLUDED.style_completion_percentage,
    interests = EXCLUDED.interests,
    style_game_level = EXCLUDED.style_game_level,
    style_game_xp = EXCLUDED.style_game_xp,
    updated_at = NOW();

-- Inserir algumas escolhas de estilo de exemplo
INSERT INTO style_choices (user_id, category, question_id, selected_option) 
VALUES 
    ('1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid, 'Sneakers', 'style_sneaker_1', 'casual'),
    ('1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid, 'Clothing', 'style_clothing_1', 'streetwear'),
    ('1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid, 'Colors', 'style_color_1', 'dark'),
    ('1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid, 'Hobbies', 'style_hobby_1', 'music'),
    ('1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid, 'Feelings', 'style_feeling_1', 'confident')
ON CONFLICT (user_id, category, question_id) DO UPDATE SET
    selected_option = EXCLUDED.selected_option,
    updated_at = NOW();

-- Inserir configurações do usuário
INSERT INTO user_settings (user_id, notification_enabled, privacy_level, language, theme)
VALUES (
    '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid,
    true,
    'public',
    'pt-BR',
    'light'
) ON CONFLICT (user_id) DO UPDATE SET
    notification_enabled = EXCLUDED.notification_enabled,
    privacy_level = EXCLUDED.privacy_level,
    language = EXCLUDED.language,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- Verificar se o usuário foi inserido corretamente
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    style_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid;
    SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE user_id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid;
    SELECT COUNT(*) INTO style_count FROM style_choices WHERE user_id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid;
    
    RAISE NOTICE 'Usuário inserido: % registro(s)', user_count;
    RAISE NOTICE 'Perfil inserido: % registro(s)', profile_count;
    RAISE NOTICE 'Escolhas de estilo inseridas: % registro(s)', style_count;
    
    IF user_count > 0 AND profile_count > 0 THEN
        RAISE NOTICE 'Usuário de teste criado com sucesso!';
    ELSE
        RAISE WARNING 'Problema na criação do usuário de teste';
    END IF;
END $$;