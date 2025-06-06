-- =====================================================
-- MIGRATION 003: STORED PROCEDURES E FUNÇÕES
-- =====================================================
-- Versão: 1.2.003
-- Autor: Sistema MatchIt
-- Data: 2025-06-06
-- Descrição: Funções e procedures para algoritmos de recomendação

-- =====================================================
-- FUNÇÃO: calculate_style_compatibility
-- Calcula compatibilidade de estilo entre dois usuários
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_style_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    common_choices INTEGER := 0;
    total_categories INTEGER := 5; -- Sneakers, Clothing, Colors, Hobbies, Feelings
    compatibility_score DECIMAL(3,2);
BEGIN
    -- Contar escolhas em comum nas categorias de estilo
    SELECT COUNT(DISTINCT sc1.category)
    INTO common_choices
    FROM style_choices sc1
    INNER JOIN style_choices sc2 ON sc1.category = sc2.category 
                                 AND sc1.selected_option = sc2.selected_option
    WHERE sc1.user_id = user1_uuid 
      AND sc2.user_id = user2_uuid;
    
    -- Calcular score de compatibilidade
    compatibility_score := (common_choices::DECIMAL / total_categories::DECIMAL);
    
    -- Garantir que está entre 0 e 1
    RETURN GREATEST(0.0, LEAST(1.0, compatibility_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_location_score
-- Calcula score baseado na proximidade geográfica
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_location_score(
    user1_uuid UUID,
    user2_uuid UUID,
    max_distance_km DECIMAL DEFAULT 50.0
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    user1_lat DECIMAL;
    user1_lng DECIMAL;
    user2_lat DECIMAL;
    user2_lng DECIMAL;
    distance_km DECIMAL;
    location_score DECIMAL(3,2);
BEGIN
    -- Buscar coordenadas dos usuários (assumindo que estão em user_profiles)
    SELECT latitude, longitude INTO user1_lat, user1_lng
    FROM user_profiles up1
    WHERE up1.user_id = user1_uuid;
    
    SELECT latitude, longitude INTO user2_lat, user2_lng
    FROM user_profiles up2
    WHERE up2.user_id = user2_uuid;
    
    -- Se não tiver dados de localização, retornar score neutro
    IF user1_lat IS NULL OR user2_lat IS NULL THEN
        RETURN 0.5;
    END IF;
    
    -- Calcular distância usando fórmula de Haversine (simplificada)
    distance_km := 6371 * acos(
        cos(radians(user1_lat)) * cos(radians(user2_lat)) * 
        cos(radians(user2_lng) - radians(user1_lng)) + 
        sin(radians(user1_lat)) * sin(radians(user2_lat))
    );
    
    -- Score decresce exponencialmente com a distância
    location_score := exp(-distance_km / (max_distance_km * 0.5));
    
    RETURN GREATEST(0.0, LEAST(1.0, location_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_overall_compatibility
-- Calcula score geral de compatibilidade usando pesos personalizados
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_overall_compatibility(
    user1_uuid UUID,
    user2_uuid UUID,
    algorithm_name VARCHAR DEFAULT 'hybrid'
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    style_score DECIMAL(3,2);
    location_score DECIMAL(3,2);
    emotional_score DECIMAL(3,2) := 0.5; -- Placeholder
    hobby_score DECIMAL(3,2) := 0.5; -- Placeholder
    personality_score DECIMAL(3,2) := 0.5; -- Placeholder
    
    -- Pesos do algoritmo (buscar pesos personalizados do usuário ou usar padrão)
    weights user_algorithm_weights%ROWTYPE;
    overall_score DECIMAL(3,2);
BEGIN
    -- Buscar pesos personalizados do usuário
    SELECT * INTO weights
    FROM user_algorithm_weights
    WHERE user_id = user1_uuid;
    
    -- Se não existir, usar pesos padrão
    IF NOT FOUND THEN
        weights.style_weight := 0.25;
        weights.emotional_weight := 0.20;
        weights.hobby_weight := 0.20;
        weights.location_weight := 0.15;
        weights.personality_weight := 0.20;
        weights.lifestyle_weight := 0.00;
        weights.values_weight := 0.00;
        weights.communication_weight := 0.00;
    END IF;
    
    -- Calcular scores individuais
    style_score := calculate_style_compatibility(user1_uuid, user2_uuid);
    location_score := calculate_location_score(user1_uuid, user2_uuid);
    
    -- TODO: Implementar cálculos para outras dimensões
    -- emotional_score := calculate_emotional_compatibility(user1_uuid, user2_uuid);
    -- hobby_score := calculate_hobby_compatibility(user1_uuid, user2_uuid);
    -- personality_score := calculate_personality_compatibility(user1_uuid, user2_uuid);
    
    -- Calcular score final ponderado
    overall_score := (
        style_score * weights.style_weight +
        emotional_score * weights.emotional_weight +
        hobby_score * weights.hobby_weight +
        location_score * weights.location_weight +
        personality_score * weights.personality_weight +
        0.5 * weights.lifestyle_weight + -- Placeholder
        0.5 * weights.values_weight + -- Placeholder
        0.5 * weights.communication_weight -- Placeholder
    );
    
    RETURN GREATEST(0.0, LEAST(1.0, overall_score));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: find_potential_matches
-- Encontra matches potenciais para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION find_potential_matches(
    target_user_uuid UUID,
    limit_count INTEGER DEFAULT 20,
    min_score DECIMAL DEFAULT 0.3,
    max_distance_km DECIMAL DEFAULT 50.0
) RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR,
    city VARCHAR,
    avatar_url TEXT,
    compatibility_score DECIMAL(3,2),
    is_vip BOOLEAN,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.display_name,
        up.city,
        up.avatar_url,
        calculate_overall_compatibility(target_user_uuid, up.user_id) as compatibility_score,
        up.is_vip,
        6371 * acos(
            cos(radians(target_location.latitude)) * cos(radians(up.latitude)) * 
            cos(radians(up.longitude) - radians(target_location.longitude)) + 
            sin(radians(target_location.latitude)) * sin(radians(up.latitude))
        ) as distance_km
    FROM user_profiles up
    CROSS JOIN (
        SELECT latitude, longitude 
        FROM user_profiles 
        WHERE user_id = target_user_uuid
    ) as target_location
    WHERE up.user_id != target_user_uuid
      AND up.is_active = true
      -- Filtro de distância
      AND 6371 * acos(
          cos(radians(target_location.latitude)) * cos(radians(up.latitude)) * 
          cos(radians(up.longitude) - radians(target_location.longitude)) + 
          sin(radians(target_location.latitude)) * sin(radians(up.latitude))
      ) <= max_distance_km
      -- Excluir usuários já interagidos
      AND up.user_id NOT IN (
          SELECT target_user_id 
          FROM user_interactions 
          WHERE user_id = target_user_uuid
            AND created_at > NOW() - INTERVAL '7 days'
      )
      -- Filtro de qualidade mínima do perfil
      AND EXISTS (
          SELECT 1 FROM user_extended_profiles uep
          WHERE uep.user_id = up.user_id
            AND uep.profile_completeness >= 0.5
      )
    ORDER BY calculate_overall_compatibility(target_user_uuid, up.user_id) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: record_interaction_with_learning
-- Registra interação e atualiza aprendizado do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION record_interaction_with_learning(
    p_user_id UUID,
    p_target_user_id UUID,
    p_action VARCHAR,
    p_context JSONB DEFAULT '{}',
    p_match_score DECIMAL DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
    learning_adjustment DECIMAL := 0.02; -- Ajuste pequeno nos pesos
BEGIN
    -- Inserir a interação
    INSERT INTO user_interactions (
        user_id, target_user_id, action, context, match_score, session_id
    ) VALUES (
        p_user_id, p_target_user_id, p_action, p_context, p_match_score, p_session_id
    ) 
    ON CONFLICT (user_id, target_user_id) 
    DO UPDATE SET 
        action = EXCLUDED.action,
        context = EXCLUDED.context,
        match_score = EXCLUDED.match_score,
        updated_at = NOW()
    RETURNING id INTO interaction_id;
    
    -- Atualizar aprendizado baseado no feedback
    IF p_action IN ('like', 'super_like') THEN
        -- Feedback positivo: aumentar peso das dimensões que contribuíram
        UPDATE user_algorithm_weights
        SET 
            style_weight = LEAST(0.5, style_weight + learning_adjustment),
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Se não existir registro de pesos, criar um
        INSERT INTO user_algorithm_weights (user_id)
        VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
    ELSIF p_action = 'dislike' THEN
        -- Feedback negativo: diminuir levemente os pesos
        UPDATE user_algorithm_weights
        SET 
            style_weight = GREATEST(0.1, style_weight - (learning_adjustment * 0.5)),
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Atualizar perfil de aprendizado
    INSERT INTO user_learning_profile (user_id, total_learning_events, last_learning_update)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_learning_events = user_learning_profile.total_learning_events + 1,
        last_learning_update = NOW(),
        learning_velocity = LEAST(1.0, user_learning_profile.learning_velocity + 0.01);
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: get_user_engagement_metrics
-- Calcula métricas de engajamento para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
    p_user_id UUID,
    p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_sessions INTEGER,
    total_interactions INTEGER,
    average_session_duration INTEGER,
    engagement_rate DECIMAL(5,4),
    match_rate DECIMAL(5,4),
    response_rate DECIMAL(5,4)
) AS $$
DECLARE
    period_start TIMESTAMP := NOW() - (p_period_days || ' days')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT 
            COUNT(DISTINCT session_id) as sessions,
            COUNT(*) as interactions,
            AVG(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) * 1000)::INTEGER as avg_duration
        FROM user_interactions
        WHERE user_id = p_user_id
          AND created_at >= period_start
    ),
    match_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE action IN ('like', 'super_like')) as likes_given,
            COUNT(*) as total_actions
        FROM user_interactions
        WHERE user_id = p_user_id
          AND created_at >= period_start
    )
    SELECT 
        COALESCE(ss.sessions, 0)::INTEGER,
        COALESCE(ss.interactions, 0)::INTEGER,
        COALESCE(ss.avg_duration, 0)::INTEGER,
        CASE 
            WHEN ss.interactions > 0 THEN (ss.interactions::DECIMAL / GREATEST(ss.sessions, 1))
            ELSE 0.0
        END::DECIMAL(5,4),
        CASE 
            WHEN ms.total_actions > 0 THEN (ms.likes_given::DECIMAL / ms.total_actions)
            ELSE 0.0
        END::DECIMAL(5,4),
        0.5::DECIMAL(5,4) -- Placeholder para response_rate
    FROM session_stats ss
    CROSS JOIN match_stats ms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: cleanup_expired_scores
-- Remove scores expirados para liberar espaço
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_scores()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM match_scores 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO analytics_events (
        event_type, event_name, properties, source
    ) VALUES (
        'system_event', 
        'cleanup_expired_scores',
        jsonb_build_object('deleted_count', deleted_count),
        'background_job'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUTO-UPDATE
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_user_extended_profiles_updated_at 
    BEFORE UPDATE ON user_extended_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_algorithm_weights_updated_at 
    BEFORE UPDATE ON user_algorithm_weights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_interactions_updated_at 
    BEFORE UPDATE ON user_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_profile_updated_at 
    BEFORE UPDATE ON user_learning_profile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION calculate_style_compatibility IS 'Calcula compatibilidade de estilo entre dois usuários baseado em escolhas comuns';
COMMENT ON FUNCTION calculate_location_score IS 'Calcula score de proximidade geográfica com decaimento exponencial';
COMMENT ON FUNCTION calculate_overall_compatibility IS 'Score principal de compatibilidade usando pesos personalizados';
COMMENT ON FUNCTION find_potential_matches IS 'Encontra candidatos potenciais para recomendação com filtros de qualidade';
COMMENT ON FUNCTION record_interaction_with_learning IS 'Registra interação e atualiza aprendizado automático dos pesos';
COMMENT ON FUNCTION get_user_engagement_metrics IS 'Calcula métricas de engajamento para analytics';
COMMENT ON FUNCTION cleanup_expired_scores IS 'Remove scores expirados para otimização de armazenamento';