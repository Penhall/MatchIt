-- scripts/fix/006_test_profile_service.sql - Testa a query do ProfileService
-- Arquivo: scripts/fix/006_test_profile_service.sql

-- =====================================================
-- TESTE ESPECÍFICO DO PROFILESERVICE
-- =====================================================

-- Testar a query exata que o ProfileService usa
DO $$
DECLARE
    test_user_id UUID := '1820114c-348a-455d-8fa6-decaf1ef61fb';
    profile_count INTEGER;
    style_count INTEGER;
    error_message TEXT;
BEGIN
    RAISE NOTICE '🧪 INICIANDO TESTES DO PROFILESERVICE';
    RAISE NOTICE '=====================================';
    
    -- Teste 1: Verificar se o usuário existe
    SELECT COUNT(*) INTO profile_count 
    FROM users 
    WHERE id = test_user_id;
    
    IF profile_count > 0 THEN
        RAISE NOTICE '✅ Teste 1: Usuário existe (%))', profile_count;
    ELSE
        RAISE NOTICE '❌ Teste 1: Usuário NÃO existe';
        RETURN;
    END IF;
    
    -- Teste 2: Query básica do perfil (sem campos problemáticos)
    BEGIN
        PERFORM 
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
            up.created_at AS profile_created_at,
            up.updated_at AS profile_updated_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = test_user_id;
        
        RAISE NOTICE '✅ Teste 2: Query básica de perfil executada com sucesso';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        RAISE NOTICE '❌ Teste 2: Erro na query básica - %', error_message;
    END;
    
    -- Teste 3: Query de style choices
    BEGIN
        SELECT COUNT(*) INTO style_count
        FROM style_choices
        WHERE user_id = test_user_id;
        
        RAISE NOTICE '✅ Teste 3: Query de style_choices executada (% registros)', style_count;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        RAISE NOTICE '❌ Teste 3: Erro na query de style_choices - %', error_message;
    END;
    
    -- Teste 4: Query com campos opcionais
    BEGIN
        PERFORM 
            interests,
            location_latitude,
            location_longitude,
            style_game_level,
            style_game_xp,
            last_style_game_played_at
        FROM user_profiles 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE '✅ Teste 4: Campos opcionais estão disponíveis';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        RAISE NOTICE '⚠️  Teste 4: Campos opcionais não disponíveis - %', error_message;
    END;
    
    -- Teste 5: Simular a query completa do ProfileService original
    BEGIN
        PERFORM
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
        WHERE u.id = test_user_id;
        
        RAISE NOTICE '✅ Teste 5: Query completa do ProfileService original executada';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        RAISE NOTICE '❌ Teste 5: Erro na query completa original - %', error_message;
        RAISE NOTICE '💡 SOLUÇÃO: Use a versão corrigida do ProfileService';
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 RESUMO DOS TESTES:';
    RAISE NOTICE '====================';
    RAISE NOTICE '• Se Teste 1 e 2 passaram: dados básicos estão OK';
    RAISE NOTICE '• Se Teste 3 passou: style_choices está funcional';
    RAISE NOTICE '• Se Teste 4 falhou: execute a correção da estrutura';
    RAISE NOTICE '• Se Teste 5 falhou: use a versão corrigida do ProfileService';
    
END $$;

-- Mostrar dados reais do usuário de teste
SELECT 
    '📊 DADOS REAIS DO USUÁRIO TESTE:' AS info,
    u.id,
    u.email,
    u.name,
    up.display_name,
    up.city,
    up.age
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = '1820114c-348a-455d-8fa6-decaf1ef61fb';

-- Mostrar style choices do usuário
SELECT 
    '🎨 STYLE CHOICES DO USUÁRIO:' AS info,
    category,
    question_id,
    selected_option
FROM style_choices 
WHERE user_id = '1820114c-348a-455d-8fa6-decaf1ef61fb'
ORDER BY category;