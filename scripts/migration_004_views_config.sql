-- =====================================================
-- MIGRATION 004: VIEWS, CONFIGURAÇÕES E DADOS INICIAIS
-- =====================================================
-- Versão: 1.2.004
-- Autor: Sistema MatchIt
-- Data: 2025-06-06
-- Descrição: Views de consulta, configurações do sistema e dados iniciais

-- =====================================================
-- VIEW: v_user_recommendation_stats
-- Estatísticas consolidadas por usuário para dashboards
-- =====================================================
CREATE OR REPLACE VIEW v_user_recommendation_stats AS
SELECT 
    u.id as user_id,
    u.name,
    up.display_name,
    up.city,
    up.is_vip,
    
    -- Estatísticas de interação
    COALESCE(ui_stats.total_interactions, 0) as total_interactions,
    COALESCE(ui_stats.likes_given, 0) as likes_given,
    COALESCE(ui_stats.dislikes_given, 0) as dislikes_given,
    COALESCE(ui_stats.super_likes_given, 0) as super_likes_given,
    COALESCE(ui_stats.likes_received, 0) as likes_received,
    
    -- Taxas calculadas
    CASE 
        WHEN ui_stats.total_interactions > 0 
        THEN (ui_stats.likes_given::DECIMAL / ui_stats.total_interactions) 
        ELSE 0 
    END as like_ratio,
    
    -- Matches e conversas
    COALESCE(match_stats.total_matches, 0) as total_matches,
    COALESCE(match_stats.avg_match_score, 0) as avg_match_score,
    
    -- Qualidade do perfil
    COALESCE(uep.profile_completeness, 0) as profile_completeness,
    COALESCE(uep.engagement_score, 0) as engagement_score,
    COALESCE(uep.data_quality_score, 0) as data_quality_score,
    
    -- Aprendizado
    COALESCE(ulp.learning_confidence, 0) as learning_confidence,
    COALESCE(ulp.total_learning_events, 0) as total_learning_events,
    
    -- Timestamps
    u.created_at as user_created_at,
    COALESCE(uep.last_style_update, u.created_at) as last_activity

FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_extended_profiles uep ON u.id = uep.user_id
LEFT JOIN user_learning_profile ulp ON u.id = ulp.user_id

-- Estatísticas de interação
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_interactions,
        COUNT(*) FILTER (WHERE action = 'like') as likes_given,
        COUNT(*) FILTER (WHERE action = 'dislike') as dislikes_given,
        COUNT(*) FILTER (WHERE action = 'super_like') as super_likes_given
    FROM user_interactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
) ui_stats ON u.id = ui_stats.user_id

-- Likes recebidos
LEFT JOIN (
    SELECT 
        target_user_id as user_id,
        COUNT(*) FILTER (WHERE action IN ('like', 'super_like')) as likes_received
    FROM user_interactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY target_user_id
) received_stats ON u.id = received_stats.user_id

-- Estatísticas de matches
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_matches,
        AVG(overall_score) as avg_match_score
    FROM (
        SELECT user_id, overall_score FROM match_scores
        UNION ALL
        SELECT target_user_id as user_id, overall_score FROM match_scores
    ) all_scores
    GROUP BY user_id
) match_stats ON u.id = match_stats.user_id

WHERE u.is_active = true;

-- =====================================================
-- VIEW: v_algorithm_performance_summary
-- Resumo de performance dos algoritmos
-- =====================================================
CREATE OR REPLACE VIEW v_algorithm_performance_summary AS
SELECT 
    algorithm_name,
    version,
    
    -- Métricas de últimos 7 dias
    AVG(success_rate) as avg_success_rate,
    AVG(user_satisfaction) as avg_user_satisfaction,
    AVG(average_match_score) as avg_match_score,
    AVG(diversity_score) as avg_diversity_score,
    
    -- Performance técnica
    AVG(average_response_time_ms) as avg_response_time_ms,
    AVG(cache_hit_rate) as avg_cache_hit_rate,
    AVG(error_rate) as avg_error_rate,
    
    -- Custos
    AVG(estimated_cost_per_recommendation) as avg_cost_per_recommendation,
    SUM(total_recommendations) as total_recommendations_7d,
    
    -- Status
    MAX(is_recommended) as is_currently_recommended,
    COUNT(*) as measurement_points,
    MAX(calculated_at) as last_measurement

FROM algorithm_performance
WHERE period_start >= NOW() - INTERVAL '7 days'
GROUP BY algorithm_name, version
ORDER BY avg_success_rate DESC, avg_user_satisfaction DESC;

-- =====================================================
-- VIEW: v_user_engagement_trends
-- Tendências de engajamento por usuário
-- =====================================================
CREATE OR REPLACE VIEW v_user_engagement_trends AS
SELECT 
    em.user_id,
    up.display_name,
    
    -- Métricas atuais (último período)
    em_current.engagement_rate as current_engagement_rate,
    em_current.match_rate as current_match_rate,
    em_current.satisfaction_score as current_satisfaction,
    
    -- Métricas anteriores para comparação
    em_previous.engagement_rate as previous_engagement_rate,
    em_previous.match_rate as previous_match_rate,
    
    -- Tendências calculadas
    CASE 
        WHEN em_previous.engagement_rate > 0 THEN
            ((em_current.engagement_rate - em_previous.engagement_rate) / em_previous.engagement_rate) * 100
        ELSE 0
    END as engagement_trend_percentage,
    
    CASE 
        WHEN em_current.engagement_rate > COALESCE(em_previous.engagement_rate, 0) THEN 'improving'
        WHEN em_current.engagement_rate < COALESCE(em_previous.engagement_rate, 0) THEN 'declining'
        ELSE 'stable'
    END as engagement_trend,
    
    -- Flags de alerta
    em_current.engagement_rate < 0.1 as low_engagement_alert,
    em_current.match_rate < 0.05 as low_match_alert,
    
    -- Timestamps
    em_current.period_start as current_period,
    em_previous.period_start as previous_period

FROM engagement_metrics em_current
LEFT JOIN user_profiles up ON em_current.user_id = up.user_id
LEFT JOIN engagement_metrics em_previous ON em_current.user_id = em_previous.user_id
    AND em_previous.period_start = em_current.period_start - INTERVAL '1 week'
WHERE em_current.period_type = 'weekly'
  AND em_current.period_start >= NOW() - INTERVAL '2 weeks';

-- =====================================================
-- TABELA: system_config
-- Configurações do sistema de recomendação
-- =====================================================
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERIR CONFIGURAÇÕES PADRÃO
-- =====================================================

-- Configurações dos algoritmos
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('default_algorithm_weights', '{
    "style": 0.25,
    "emotional": 0.20,
    "hobby": 0.20,
    "location": 0.15,
    "personality": 0.20,
    "lifestyle": 0.00,
    "values": 0.00,
    "communication": 0.00
}', 'algorithm', 'Pesos padrão para o algoritmo híbrido'),

('recommendation_limits', '{
    "max_recommendations_per_request": 50,
    "max_candidates_to_analyze": 500,
    "min_compatibility_score": 0.3,
    "max_processing_time_ms": 5000
}', 'performance', 'Limites de performance para recomendações'),

('quality_thresholds', '{
    "min_profile_completeness": 0.5,
    "min_photo_count": 2,
    "min_bio_length": 50,
    "max_inactive_days": 30
}', 'quality', 'Thresholds de qualidade para filtros'),

('cache_settings', '{
    "default_timeout_minutes": 30,
    "high_value_users_timeout_minutes": 15,
    "enable_aggressive_caching": true,
    "cache_hit_rate_target": 0.8
}', 'cache', 'Configurações de cache'),

('learning_parameters', '{
    "weight_adjustment_rate": 0.02,
    "min_interactions_for_learning": 10,
    "learning_velocity_boost": 0.01,
    "confidence_threshold": 0.7
}', 'learning', 'Parâmetros do sistema de aprendizado'),

('experimental_features', '{
    "enable_ab_testing": true,
    "test_group_percentage": 0.1,
    "enable_advanced_ml": false,
    "enable_social_signals": false
}', 'experimental', 'Features experimentais e A/B testing');

-- =====================================================
-- INSERIR DADOS PADRÃO PARA USUÁRIOS EXISTENTES
-- =====================================================

-- Criar perfis estendidos para usuários existentes
INSERT INTO user_extended_profiles (user_id, profile_completeness, data_quality_score)
SELECT 
    u.id,
    0.6, -- Completeness padrão
    0.7  -- Qualidade padrão
FROM users u 
WHERE NOT EXISTS (
    SELECT 1 FROM user_extended_profiles uep 
    WHERE uep.user_id = u.id
);

-- Criar pesos de algoritmo padrão para usuários existentes
INSERT INTO user_algorithm_weights (user_id)
SELECT u.id
FROM users u 
WHERE NOT EXISTS (
    SELECT 1 FROM user_algorithm_weights uaw 
    WHERE uaw.user_id = u.id
);

-- Criar perfis de aprendizado para usuários existentes
INSERT INTO user_learning_profile (user_id)
SELECT u.id
FROM users u 
WHERE NOT EXISTS (
    SELECT 1 FROM user_learning_profile ulp 
    WHERE ulp.user_id = u.id
);

-- =====================================================
-- FUNÇÃO: get_system_config
-- Função helper para buscar configurações
-- =====================================================
CREATE OR REPLACE FUNCTION get_system_config(
    p_config_key VARCHAR,
    p_default_value JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    config_value JSONB;
BEGIN
    SELECT sc.config_value INTO config_value
    FROM system_config sc
    WHERE sc.config_key = p_config_key
      AND sc.is_active = true;
    
    RETURN COALESCE(config_value, p_default_value);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: update_system_stats
-- Atualiza estatísticas agregadas do sistema
-- =====================================================
CREATE OR REPLACE FUNCTION update_system_stats(
    p_statistic_type VARCHAR DEFAULT 'daily'
) RETURNS VOID AS $$
DECLARE
    period_start TIMESTAMP WITH TIME ZONE;
    period_end TIMESTAMP WITH TIME ZONE;
    stats_data RECORD;
BEGIN
    -- Definir período baseado no tipo
    IF p_statistic_type = 'daily' THEN
        period_start := DATE_TRUNC('day', NOW());
        period_end := period_start + INTERVAL '1 day';
    ELSIF p_statistic_type = 'weekly' THEN
        period_start := DATE_TRUNC('week', NOW());
        period_end := period_start + INTERVAL '1 week';
    ELSIF p_statistic_type = 'monthly' THEN
        period_start := DATE_TRUNC('month', NOW());
        period_end := period_start + INTERVAL '1 month';
    ELSE
        RAISE EXCEPTION 'Tipo de estatística inválido: %', p_statistic_type;
    END IF;
    
    -- Calcular estatísticas
    SELECT INTO stats_data
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN ui.created_at >= period_start THEN u.id END) as active_users,
        COUNT(DISTINCT CASE WHEN u.created_at >= period_start THEN u.id END) as new_users,
        COUNT(ms.id) as total_recommendations,
        COUNT(ui.id) as total_interactions,
        AVG(CASE WHEN ui.action IN ('like', 'super_like') THEN 1.0 ELSE 0.0 END) as overall_match_rate,
        AVG(uep.engagement_score) as avg_engagement,
        AVG(uep.profile_completeness) as avg_profile_quality
    FROM users u
    LEFT JOIN user_interactions ui ON u.id = ui.user_id 
        AND ui.created_at >= period_start AND ui.created_at < period_end
    LEFT JOIN match_scores ms ON u.id = ms.user_id 
        AND ms.calculated_at >= period_start AND ms.calculated_at < period_end
    LEFT JOIN user_extended_profiles uep ON u.id = uep.user_id
    WHERE u.is_active = true;
    
    -- Inserir ou atualizar estatísticas
    INSERT INTO system_statistics (
        period_start, period_end, statistic_type,
        total_users, active_users, new_users,
        total_recommendations, total_interactions,
        overall_match_rate, average_profile_quality
    ) VALUES (
        period_start, period_end, p_statistic_type,
        stats_data.total_users, stats_data.active_users, stats_data.new_users,
        stats_data.total_recommendations, stats_data.total_interactions,
        stats_data.overall_match_rate, stats_data.avg_profile_quality
    )
    ON CONFLICT (statistic_type, period_start)
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        new_users = EXCLUDED.new_users,
        total_recommendations = EXCLUDED.total_recommendations,
        total_interactions = EXCLUDED.total_interactions,
        overall_match_rate = EXCLUDED.overall_match_rate,
        average_profile_quality = EXCLUDED.average_profile_quality,
        generated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- JOBS AUTOMATIZADOS (usando pg_cron se disponível)
-- =====================================================

-- Limpeza de scores expirados (executar a cada hora)
-- SELECT cron.schedule('cleanup-expired-scores', '0 * * * *', 'SELECT cleanup_expired_scores();');

-- Atualização de estatísticas diárias (executar todo dia às 2h)
-- SELECT cron.schedule('daily-stats-update', '0 2 * * *', 'SELECT update_system_stats(''daily'');');

-- Atualização de estatísticas semanais (executar toda segunda às 3h)
-- SELECT cron.schedule('weekly-stats-update', '0 3 * * 1', 'SELECT update_system_stats(''weekly'');');

-- =====================================================
-- GRANTS DE PERMISSÃO (ajustar conforme necessário)
-- =====================================================

-- Garantir que o usuário da aplicação tenha permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO matchit;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO matchit;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO matchit;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON VIEW v_user_recommendation_stats IS 'Estatísticas consolidadas por usuário para dashboards e analytics';
COMMENT ON VIEW v_algorithm_performance_summary IS 'Resumo de performance dos algoritmos nos últimos 7 dias';
COMMENT ON VIEW v_user_engagement_trends IS 'Tendências de engajamento com comparação entre períodos';
COMMENT ON TABLE system_config IS 'Configurações do sistema de recomendação';
COMMENT ON FUNCTION get_system_config IS 'Helper para buscar configurações do sistema com fallback';
COMMENT ON FUNCTION update_system_stats IS 'Atualiza estatísticas agregadas do sistema por período';

-- Finalização da migration
SELECT 'Migration 004 executada com sucesso! Sistema de recomendação está pronto.' as status;