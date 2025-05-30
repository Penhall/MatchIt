-- =====================================================
-- QUERIES DE TESTE E VALIDAÇÃO DO BANCO MATCHIT
-- =====================================================

-- =====================================================
-- 1. VERIFICAÇÕES BÁSICAS
-- =====================================================

-- Contar registros em todas as tabelas
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'style_choices', COUNT(*) FROM style_choices
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions;

-- =====================================================
-- 2. TESTAR FUNÇÕES DE MATCHING
-- =====================================================

-- Buscar matches potenciais para Alex
SELECT 
    display_name,
    city,
    compatibility_score,
    is_vip
FROM find_potential_matches(
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
)
ORDER BY compatibility_score DESC;

-- Testar cálculo de compatibilidade entre todos os usuários
SELECT 
    u1.name as user1,
    u2.name as user2,
    calculate_compatibility(u1.id, u2.id) as compatibility
FROM users u1
CROSS JOIN users u2
WHERE u1.id != u2.id
ORDER BY calculate_compatibility(u1.id, u2.id) DESC;

-- =====================================================
-- 3. VERIFICAR ESTATÍSTICAS DOS USUÁRIOS
-- =====================================================

-- Estatísticas detalhadas de Alex
SELECT * FROM get_user_stats(
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
);

-- Estatísticas de todos os usuários
SELECT 
    up.display_name,
    stats.*
FROM user_profiles up
CROSS JOIN LATERAL get_user_stats(up.user_id) as stats
ORDER BY stats.total_matches DESC;

-- =====================================================
-- 4. ANÁLISE DE ESTILOS
-- =====================================================

-- Popularidade das escolhas de estilo
SELECT * FROM v_style_analytics
ORDER BY category, user_count DESC;

-- Usuários por categoria de estilo
SELECT 
    category,
    selected_option,
    STRING_AGG(up.display_name, ', ') as users
FROM style_choices sc
INNER JOIN user_profiles up ON sc.user_id = up.user_id
GROUP BY category, selected_option
ORDER BY category, COUNT(*) DESC;

-- =====================================================
-- 5. ANÁLISE DE MATCHES E CONVERSAS
-- =====================================================

-- Todos os matches com detalhes
SELECT 
    user1_name || ' ↔ ' || user2_name as match_pair,
    compatibility_score || '%' as compatibility,
    status,
    match_created_at
FROM v_matches_detailed
ORDER BY compatibility_score DESC;

-- Conversas por match
SELECT 
    vmd.user1_name || ' ↔ ' || vmd.user2_name as match_pair,
    COUNT(cm.id) as message_count,
    MAX(cm.created_at) as last_message
FROM v_matches_detailed vmd
LEFT JOIN chat_messages cm ON vmd.match_id = cm.match_id
GROUP BY vmd.match_id, vmd.user1_name, vmd.user2_name
ORDER BY message_count DESC;

-- Histórico de mensagens do match Alex & Nova
SELECT 
    up.display_name as sender,
    cm.message_text,
    cm.created_at
FROM chat_messages cm
INNER JOIN matches m ON cm.match_id = m.id
INNER JOIN user_profiles up ON cm.sender_id = up.user_id
WHERE (m.user1_id = (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
   AND m.user2_id = (SELECT id FROM users WHERE email = 'nova.cyber@email.com'))
   OR (m.user1_id = (SELECT id FROM users WHERE email = 'nova.cyber@email.com')
   AND m.user2_id = (SELECT id FROM users WHERE email = 'alex.ryder@email.com'))
ORDER BY cm.created_at;

-- =====================================================
-- 6. ANÁLISE DO MARKETPLACE
-- =====================================================

-- Produtos por categoria e faixa de preço
SELECT 
    category,
    COUNT(*) as product_count,
    MIN(price_numeric) as min_price,
    MAX(price_numeric) as max_price,
    AVG(price_numeric) as avg_price
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY avg_price DESC;

-- Produtos mais caros
SELECT 
    name,
    brand_name,
    price_display,
    category
FROM products
WHERE is_active = true
ORDER BY price_numeric DESC
LIMIT 5;

-- =====================================================
-- 7. ANÁLISE DE ASSINATURAS VIP
-- =====================================================

-- Status das assinaturas VIP
SELECT 
    up.display_name,
    us.plan_type,
    us.status,
    us.start_date,
    us.end_date,
    CASE 
        WHEN us.end_date > CURRENT_DATE THEN 'Ativa'
        ELSE 'Expirada'
    END as subscription_status
FROM user_subscriptions us
INNER JOIN user_profiles up ON us.user_id = up.user_id
ORDER BY us.end_date DESC;

-- Receita por tipo de plano
SELECT 
    plan_type,
    COUNT(*) as subscription_count,
    SUM(price_paid) as total_revenue,
    AVG(price_paid) as avg_price
FROM user_subscriptions
GROUP BY plan_type;

-- =====================================================
-- 8. TESTES DE INTEGRIDADE
-- =====================================================

-- Verificar se todos os usuários têm perfil
SELECT 
    u.email,
    CASE 
        WHEN up.user_id IS NULL THEN 'SEM PERFIL'
        ELSE 'OK'
    END as profile_status
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY profile_status, u.email;

-- Verificar se todos os matches têm usuários válidos
SELECT 
    m.id as match_id,
    CASE 
        WHEN u1.id IS NULL THEN 'USER1 INVÁLIDO'
        WHEN u2.id IS NULL THEN 'USER2 INVÁLIDO'
        ELSE 'OK'
    END as users_status
FROM matches m
LEFT JOIN users u1 ON m.user1_id = u1.id
LEFT JOIN users u2 ON m.user2_id = u2.id
WHERE u1.id IS NULL OR u2.id IS NULL;

-- Verificar mensagens órfãs (sem match válido)
SELECT 
    cm.id as message_id,
    cm.message_text,
    CASE 
        WHEN m.id IS NULL THEN 'MATCH INVÁLIDO'
        ELSE 'OK'
    END as match_status
FROM chat_messages cm
LEFT JOIN matches m ON cm.match_id = m.id
WHERE m.id IS NULL;

-- =====================================================
-- 9. PERFORMANCE E ÍNDICES
-- =====================================================

-- Verificar se os índices estão sendo usados
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM find_potential_matches(
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
);

-- Tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_profiles', 'matches', 'chat_messages', 'products')
ORDER BY tablename, attname;

-- =====================================================
-- 10. LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Comando para limpar dados de teste (NÃO EXECUTAR EM PRODUÇÃO)
/*
-- Descomente apenas se quiser limpar os dados de teste:

DELETE FROM chat_messages;
DELETE FROM matches;
DELETE FROM user_subscriptions;
DELETE FROM style_choices;
DELETE FROM user_profiles;
DELETE FROM users;
DELETE FROM products;

-- Reset sequences se necessário
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
*/