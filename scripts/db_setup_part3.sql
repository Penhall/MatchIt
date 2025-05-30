-- =====================================================
-- MATCHIT DATABASE SETUP - PARTE 3: PRODUTOS E FUNÇÕES (CORRIGIDO)
-- =====================================================

-- =====================================================
-- INSERIR PRODUTOS PARA O MARKETPLACE
-- =====================================================

INSERT INTO products (name, brand_name, brand_logo_url, image_url, price_display, price_numeric, currency, category, description, affiliate_url, is_active) VALUES
('Cyber-Visor X1', 'TechNova', 'https://picsum.photos/seed/brandA/50/50', 'https://picsum.photos/seed/visor/200/200', 'Ξ0.25 ETH', 850.00, 'USD', 'Accessories', 'Advanced AR glasses with neural interface compatibility', 'https://example.com/cyber-visor', true),

('Zero-G Sneakers', 'AeroFlex', 'https://picsum.photos/seed/brandB/50/50', 'https://picsum.photos/seed/sneakerX/200/200', '$199.99', 199.99, 'USD', 'Sneakers', 'Lightweight sneakers with anti-gravity design elements', 'https://example.com/zero-g-sneakers', true),

('Holo-Jacket', 'NeonWear', 'https://picsum.photos/seed/brandC/50/50', 'https://picsum.photos/seed/jacketH/200/200', '¥25,000', 185.50, 'USD', 'Clothing', 'Smart jacket with customizable holographic patterns', 'https://example.com/holo-jacket', true),

('Neuralink Band', 'MindTech', 'https://picsum.photos/seed/brandD/50/50', 'https://picsum.photos/seed/bandN/200/200', 'VIP Exclusive', 999.99, 'USD', 'Accessories', 'Premium neural interface wristband for VIP members only', 'https://example.com/neuralink-band', true),

('Quantum Headphones', 'SoundWave', 'https://picsum.photos/seed/brandE/50/50', 'https://picsum.photos/seed/headphones/200/200', '$149.99', 149.99, 'USD', 'Electronics', 'Immersive audio experience with quantum resonance technology', 'https://example.com/quantum-headphones', true),

('Neon Backpack', 'UrbanFuture', 'https://picsum.photos/seed/brandF/50/50', 'https://picsum.photos/seed/backpack/200/200', '$89.99', 89.99, 'USD', 'Accessories', 'LED-integrated backpack perfect for night adventures', 'https://example.com/neon-backpack', true),

('Digital Watch Pro', 'ChronoTech', 'https://picsum.photos/seed/brandG/50/50', 'https://picsum.photos/seed/watch/200/200', '$299.99', 299.99, 'USD', 'Electronics', 'Smartwatch with holographic display and biometric sensors', 'https://example.com/digital-watch-pro', true),

('Style Scanner Glasses', 'VisionCorp', 'https://picsum.photos/seed/brandH/50/50', 'https://picsum.photos/seed/glasses/200/200', '$399.99', 399.99, 'USD', 'Accessories', 'AI-powered glasses that analyze and recommend styles in real-time', 'https://example.com/style-scanner', true);

-- =====================================================
-- INSERIR ASSINATURAS VIP
-- =====================================================

-- Assinatura VIP para Alex (yearly)
INSERT INTO user_subscriptions (user_id, plan_type, status, start_date, end_date, price_paid, payment_method)
SELECT 
    u.id, 
    'yearly', 
    'active', 
    CURRENT_DATE - INTERVAL '2 months',
    CURRENT_DATE + INTERVAL '10 months',
    99.99,
    'stripe'
FROM users u WHERE u.email = 'alex.ryder@email.com';

-- Assinatura VIP para Jax (monthly)
INSERT INTO user_subscriptions (user_id, plan_type, status, start_date, end_date, price_paid, payment_method)
SELECT 
    u.id, 
    'monthly', 
    'active', 
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '15 days',
    9.99,
    'stripe'
FROM users u WHERE u.email = 'jax.tech@email.com';

-- =====================================================
-- FUNÇÕES ÚTEIS PARA O ALGORITMO DE MATCHING
-- =====================================================

-- Função para calcular compatibilidade entre dois usuários
CREATE OR REPLACE FUNCTION calculate_compatibility(user1_uuid UUID, user2_uuid UUID)
RETURNS FLOAT AS $$
DECLARE
    common_choices INTEGER := 0;
    total_categories INTEGER := 5; -- Sneakers, Clothing, Colors, Hobbies, Feelings
    compatibility_score FLOAT;
BEGIN
    -- Contar escolhas em comum
    SELECT COUNT(*)
    INTO common_choices
    FROM style_choices sc1
    INNER JOIN style_choices sc2 ON sc1.category = sc2.category 
                                 AND sc1.selected_option = sc2.selected_option
    WHERE sc1.user_id = user1_uuid 
      AND sc2.user_id = user2_uuid;
    
    -- Calcular percentual (com bonus por city match)
    compatibility_score := (common_choices * 100.0 / total_categories);
    
    -- Bonus por cidade igual
    IF EXISTS (
        SELECT 1 FROM user_profiles up1, user_profiles up2 
        WHERE up1.user_id = user1_uuid 
          AND up2.user_id = user2_uuid 
          AND up1.city = up2.city
    ) THEN
        compatibility_score := compatibility_score + 5;
    END IF;
    
    -- Garantir que não passe de 100
    IF compatibility_score > 100 THEN
        compatibility_score := 100;
    END IF;
    
    RETURN compatibility_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA BUSCAR MATCHES POTENCIAIS
-- =====================================================

CREATE OR REPLACE FUNCTION find_potential_matches(target_user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR,
    city VARCHAR,
    avatar_url TEXT,
    compatibility_score FLOAT,
    is_vip BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.display_name,
        up.city,
        up.avatar_url,
        calculate_compatibility(target_user_uuid, up.user_id) as compatibility_score,
        up.is_vip
    FROM user_profiles up
    WHERE up.user_id != target_user_uuid  -- Não incluir o próprio usuário
      AND up.user_id NOT IN (  -- Não incluir usuários já matchados
          SELECT CASE 
              WHEN user1_id = target_user_uuid THEN user2_id 
              ELSE user1_id 
          END
          FROM matches 
          WHERE (user1_id = target_user_uuid OR user2_id = target_user_uuid)
      )
      AND calculate_compatibility(target_user_uuid, up.user_id) >= 50  -- Mínimo 50% compatibilidade
    ORDER BY calculate_compatibility(target_user_uuid, up.user_id) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA OBTER ESTATÍSTICAS DO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_stats(target_user_uuid UUID)
RETURNS TABLE (
    total_matches INTEGER,
    accepted_matches INTEGER,
    messages_sent INTEGER,
    messages_received INTEGER,
    style_completion_percentage INTEGER,
    is_vip BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM matches 
         WHERE user1_id = target_user_uuid OR user2_id = target_user_uuid)::INTEGER as total_matches,
        
        (SELECT COUNT(*) FROM matches 
         WHERE (user1_id = target_user_uuid OR user2_id = target_user_uuid) 
         AND status = 'accepted')::INTEGER as accepted_matches,
        
        (SELECT COUNT(*) FROM chat_messages 
         WHERE sender_id = target_user_uuid)::INTEGER as messages_sent,
        
        (SELECT COUNT(*) FROM chat_messages cm
         INNER JOIN matches m ON cm.match_id = m.id
         WHERE cm.sender_id != target_user_uuid 
         AND (m.user1_id = target_user_uuid OR m.user2_id = target_user_uuid))::INTEGER as messages_received,
        
        (SELECT up.style_completion_percentage FROM user_profiles up 
         WHERE up.user_id = target_user_uuid)::INTEGER as style_completion_percentage,
        
        (SELECT up.is_vip FROM user_profiles up 
         WHERE up.user_id = target_user_uuid)::BOOLEAN as is_vip;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS ÚTEIS PARA CONSULTAS FREQUENTES
-- =====================================================

-- View para listar usuários com perfis completos
CREATE OR REPLACE VIEW v_users_complete AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.created_at as user_created_at,
    up.display_name,
    up.city,
    up.gender,
    up.avatar_url,
    up.bio,
    up.is_vip,
    up.age,
    up.style_completion_percentage
FROM users u
INNER JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_active = true;

-- View para matches com informações dos usuários
CREATE OR REPLACE VIEW v_matches_detailed AS
SELECT 
    m.id as match_id,
    m.compatibility_score,
    m.status,
    m.created_at as match_created_at,
    u1.display_name as user1_name,
    u1.avatar_url as user1_avatar,
    u1.city as user1_city,
    u2.display_name as user2_name,
    u2.avatar_url as user2_avatar,
    u2.city as user2_city
FROM matches m
INNER JOIN user_profiles u1 ON m.user1_id = u1.user_id
INNER JOIN user_profiles u2 ON m.user2_id = u2.user_id;

-- =====================================================
-- CONSULTAS DE TESTE E VERIFICAÇÃO
-- =====================================================

-- Verificar se os dados foram inseridos corretamente
SELECT 'Total de usuários: ' || COUNT(*) as info FROM users
UNION ALL
SELECT 'Total de perfis: ' || COUNT(*) FROM user_profiles
UNION ALL
SELECT 'Total de matches: ' || COUNT(*) FROM matches
UNION ALL
SELECT 'Total de mensagens: ' || COUNT(*) FROM chat_messages
UNION ALL
SELECT 'Total de produtos: ' || COUNT(*) FROM products;

-- Testar função de compatibilidade
SELECT 
    'Teste de compatibilidade Alex & Nova: ' || 
    calculate_compatibility(
        (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
        (SELECT id FROM users WHERE email = 'nova.cyber@email.com')
    ) || '%' as compatibility_test;

-- =====================================================
-- STORED PROCEDURES PARA OPERAÇÕES COMUNS (CORRIGIDO)
-- =====================================================

-- Procedure para criar um novo match
CREATE OR REPLACE FUNCTION create_match(user1_uuid UUID, user2_uuid UUID)
RETURNS UUID AS $$
DECLARE
    new_match_id UUID;
    compatibility_val FLOAT;
BEGIN
    -- Verificar se match já existe
    IF EXISTS (
        SELECT 1 FROM matches 
        WHERE (user1_id = user1_uuid AND user2_id = user2_uuid)
           OR (user1_id = user2_uuid AND user2_id = user1_uuid)
    ) THEN
        RAISE EXCEPTION 'Match já existe entre estes usuários';
    END IF;
    
    -- Calcular compatibilidade
    compatibility_val := calculate_compatibility(user1_uuid, user2_uuid);
    
    -- Criar match
    INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
    VALUES (user1_uuid, user2_uuid, compatibility_val, 'pending')
    RETURNING id INTO new_match_id;
    
    RETURN new_match_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure para enviar mensagem
CREATE OR REPLACE FUNCTION send_message(
    sender_uuid UUID, 
    match_uuid UUID, 
    message_text TEXT
)
RETURNS UUID AS $$
DECLARE
    new_message_id UUID;
BEGIN
    -- Verificar se o usuário é parte do match
    IF NOT EXISTS (
        SELECT 1 FROM matches 
        WHERE id = match_uuid 
        AND (user1_id = sender_uuid OR user2_id = sender_uuid)
        AND status = 'accepted'
    ) THEN
        RAISE EXCEPTION 'Usuário não autorizado para este match ou match não aceito';
    END IF;
    
    -- Inserir mensagem
    INSERT INTO chat_messages (match_id, sender_id, message_text)
    VALUES (match_uuid, sender_uuid, message_text)
    RETURNING id INTO new_message_id;
    
    RETURN new_message_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS ADICIONAIS DE TESTE
-- =====================================================

-- Mais alguns produtos para variedade
INSERT INTO products (name, brand_name, brand_logo_url, image_url, price_display, price_numeric, currency, category, description, is_active) VALUES
('Plasma Jeans', 'FutureFashion', 'https://picsum.photos/seed/brandI/50/50', 'https://picsum.photos/seed/jeans/200/200', '$129.99', 129.99, 'USD', 'Clothing', 'Self-cleaning jeans with integrated climate control', true),
('Mood Ring 2.0', 'EmotionTech', 'https://picsum.photos/seed/brandJ/50/50', 'https://picsum.photos/seed/ring/200/200', '$79.99', 79.99, 'USD', 'Accessories', 'Advanced mood detection ring with social sharing features', true),
('Gravity Boots', 'AeroWalk', 'https://picsum.photos/seed/brandK/50/50', 'https://picsum.photos/seed/boots/200/200', '$249.99', 249.99, 'USD', 'Footwear', 'Magnetic boots for urban wall-walking adventures', true),
('Hologram Shirt', 'DigitalWear', 'https://picsum.photos/seed/brandL/50/50', 'https://picsum.photos/seed/shirt/200/200', '$89.99', 89.99, 'USD', 'Clothing', 'T-shirt with programmable holographic display', true);

-- =====================================================
-- RELATÓRIOS E ANÁLISES
-- =====================================================

-- View para análise de popularidade de estilos
CREATE OR REPLACE VIEW v_style_analytics AS
SELECT 
    category,
    selected_option,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM style_choices), 2) as percentage
FROM style_choices
GROUP BY category, selected_option
ORDER BY category, user_count DESC;

-- View para análise de matches por cidade
CREATE OR REPLACE VIEW v_city_match_analytics AS
SELECT 
    COALESCE(up1.city, 'Unknown') as city,
    COUNT(*) as total_matches,
    AVG(m.compatibility_score) as avg_compatibility,
    COUNT(CASE WHEN m.status = 'accepted' THEN 1 END) as accepted_matches
FROM matches m
INNER JOIN user_profiles up1 ON m.user1_id = up1.user_id
INNER JOIN user_profiles up2 ON m.user2_id = up2.user_id
GROUP BY up1.city
ORDER BY total_matches DESC;

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON matches(user1_id, user2_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_created ON chat_messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_category ON style_choices(user_id, category);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city_vip ON user_profiles(city, is_vip);

-- =====================================================
-- DADOS PARA FINALIZAR A CONFIGURAÇÃO
-- =====================================================

-- Atualizar estatísticas das tabelas
ANALYZE users;
ANALYZE user_profiles;
ANALYZE style_choices;
ANALYZE matches;
ANALYZE chat_messages;
ANALYZE products;
ANALYZE user_subscriptions;

-- =====================================================
-- TESTES FINAIS
-- =====================================================

-- Teste das funções criadas
SELECT 'Testando funções...' as status;

-- Testar busca de matches potenciais
SELECT 'Matches potenciais para Alex:' as test_name;
SELECT display_name, compatibility_score 
FROM find_potential_matches(
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
) 
LIMIT 3;

-- Testar estatísticas
SELECT 'Estatísticas de Alex:' as test_name;
SELECT * FROM get_user_stats(
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
);

-- Verificar views
SELECT 'Análise de estilos:' as test_name;
SELECT category, selected_option, user_count 
FROM v_style_analytics 
LIMIT 5;

SELECT 'Configuração do banco concluída com sucesso!' as final_status;