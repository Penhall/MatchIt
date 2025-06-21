-- scripts/fix/004_diagnostic_check.sql - Script de diagnóstico do banco
-- Arquivo: scripts/fix/004_diagnostic_check.sql

-- =====================================================
-- SCRIPT DE DIAGNÓSTICO DO BANCO DE DADOS
-- =====================================================

-- Verificar extensões instaladas
SELECT 
    'Extensões instaladas:' AS categoria,
    extname AS nome
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Verificar se as tabelas existem
SELECT 
    'Tabelas existentes:' AS categoria,
    table_name AS nome
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'style_choices', 'user_sessions', 'user_settings');

-- Verificar estrutura da tabela users
SELECT 
    'Colunas da tabela users:' AS categoria,
    column_name AS nome,
    data_type AS tipo,
    is_nullable AS permite_null
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela user_profiles
SELECT 
    'Colunas da tabela user_profiles:' AS categoria,
    column_name AS nome,
    data_type AS tipo,
    is_nullable AS permite_null
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela style_choices
SELECT 
    'Colunas da tabela style_choices:' AS categoria,
    column_name AS nome,
    data_type AS tipo,
    is_nullable AS permite_null
FROM information_schema.columns 
WHERE table_name = 'style_choices' 
ORDER BY ordinal_position;

-- Contar registros em cada tabela
SELECT 
    'Contagem de registros:' AS categoria,
    'users' AS tabela,
    COUNT(*) AS total
FROM users
UNION ALL
SELECT 
    'Contagem de registros:' AS categoria,
    'user_profiles' AS tabela,
    COUNT(*) AS total
FROM user_profiles
UNION ALL
SELECT 
    'Contagem de registros:' AS categoria,
    'style_choices' AS tabela,
    COUNT(*) AS total
FROM style_choices;

-- Verificar se o usuário específico existe
SELECT 
    'Status do usuário teste:' AS categoria,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid)
        THEN 'Usuário existe'
        ELSE 'Usuário NÃO existe'
    END AS status;

-- Verificar se o perfil do usuário existe
SELECT 
    'Status do perfil teste:' AS categoria,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid)
        THEN 'Perfil existe'
        ELSE 'Perfil NÃO existe'
    END AS status;

-- Testar a query do ProfileService
SELECT 
    'Teste da query ProfileService:' AS categoria,
    'Query executada com sucesso' AS resultado
FROM (
    SELECT
        u.id AS user_id,
        u.email,
        u.name,
        u.email_verified,
        u.is_active,
        up.id AS profile_id,
        up.display_name,
        up.city,
        up.gender,
        up.avatar_url,
        up.bio,
        up.is_vip,
        up.age,
        up.style_completion_percentage,
        up.interests,
        up.location_latitude,
        up.location_longitude,
        up.style_game_level,
        up.style_game_xp,
        up.last_style_game_played_at,
        up.created_at AS profile_created_at,
        up.updated_at AS profile_updated_at
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid
) AS test_query
LIMIT 1;

-- Verificar índices existentes
SELECT 
    'Índices da tabela users:' AS categoria,
    indexname AS nome
FROM pg_indexes 
WHERE tablename = 'users'
UNION ALL
SELECT 
    'Índices da tabela user_profiles:' AS categoria,
    indexname AS nome
FROM pg_indexes 
WHERE tablename = 'user_profiles'
UNION ALL
SELECT 
    'Índices da tabela style_choices:' AS categoria,
    indexname AS nome
FROM pg_indexes 
WHERE tablename = 'style_choices';

-- Verificar triggers existentes
SELECT 
    'Triggers existentes:' AS categoria,
    trigger_name AS nome,
    event_object_table AS tabela
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Mostrar dados do usuário de teste se existir
SELECT 
    'Dados do usuário teste:' AS info,
    u.id,
    u.email,
    u.name,
    u.email_verified,
    u.is_active,
    up.display_name,
    up.city,
    up.age,
    up.style_completion_percentage
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid;

-- Mostrar escolhas de estilo do usuário de teste
SELECT 
    'Escolhas de estilo do usuário teste:' AS info,
    category,
    question_id,
    selected_option,
    created_at
FROM style_choices 
WHERE user_id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid
ORDER BY category, created_at;