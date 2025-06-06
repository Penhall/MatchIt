-- =====================================================
-- MIGRATION 002: TABELAS DE ANALYTICS E MÉTRICAS
-- =====================================================
-- Versão: 1.2.002
-- Autor: Sistema MatchIt
-- Data: 2025-06-06
-- Descrição: Tabelas para analytics, métricas e sistema de aprendizado

-- =====================================================
-- TABELA: analytics_events
-- Eventos de analytics para tracking detalhado
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Dados do evento
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    
    -- Contexto temporal
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_timezone VARCHAR(50),
    
    -- Contexto técnico
    device_info JSONB DEFAULT '{}',
    app_version VARCHAR(20),
    platform_version VARCHAR(50),
    
    -- Localização e rede
    location_info JSONB DEFAULT '{}',
    network_info JSONB DEFAULT '{}',
    
    -- Metadados
    source VARCHAR(20) DEFAULT 'mobile_app',
    environment VARCHAR(20) DEFAULT 'production',
    experiment_groups TEXT[],
    
    -- Índices para consultas frequentes
    INDEX idx_analytics_events_user_id (user_id),
    INDEX idx_analytics_events_session_id (session_id),
    INDEX idx_analytics_events_event_type (event_type),
    INDEX idx_analytics_events_timestamp (timestamp),
    INDEX idx_analytics_events_event_name (event_name)
);

-- =====================================================
-- TABELA: user_behavior_patterns
-- Padrões comportamentais identificados
-- =====================================================
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Padrão identificado
    pattern_type VARCHAR(50) NOT NULL,
    pattern_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Confiança e estabilidade
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    stability DECIMAL(3,2) DEFAULT 0.5 CHECK (stability >= 0 AND stability <= 1),
    
    -- Características do padrão
    characteristics JSONB DEFAULT '{}',
    evidence JSONB DEFAULT '{}',
    
    -- Métricas do padrão
    average_view_time INTEGER DEFAULT 0,
    average_scroll_depth DECIMAL(3,2) DEFAULT 0.0,
    preferred_actions TEXT[],
    
    -- Temporal
    identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id, pattern_type)
);

-- =====================================================
-- TABELA: engagement_metrics
-- Métricas de engajamento por usuário e período
-- =====================================================
CREATE TABLE IF NOT EXISTS engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Período da métrica
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Métricas básicas
    total_sessions INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    total_view_time_ms BIGINT DEFAULT 0,
    average_session_duration_ms INTEGER DEFAULT 0,
    
    -- Métricas de qualidade
    engagement_rate DECIMAL(5,4) DEFAULT 0.0000,
    retention_rate DECIMAL(5,4) DEFAULT 0.0000,
    satisfaction_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Métricas de efetividade
    match_rate DECIMAL(5,4) DEFAULT 0.0000,
    conversation_start_rate DECIMAL(5,4) DEFAULT 0.0000,
    response_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Detalhamento por tipo
    interaction_breakdown JSONB DEFAULT '{}',
    source_breakdown JSONB DEFAULT '{}',
    device_breakdown JSONB DEFAULT '{}',
    
    -- Comparações
    percentile_rank INTEGER DEFAULT 50,
    improvement_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, period_type, period_start)
);

-- =====================================================
-- TABELA: recommendation_feedback
-- Feedback dos usuários sobre recomendações
-- =====================================================
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    
    -- Avaliações
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 5),
    diversity_score INTEGER CHECK (diversity_score >= 1 AND diversity_score <= 5),
    
    -- Problemas identificados
    issues JSONB DEFAULT '[]',
    suggestions TEXT[],
    
    -- Contexto
    algorithms_used TEXT[],
    recommendation_count INTEGER DEFAULT 0,
    time_spent_ms INTEGER DEFAULT 0,
    
    -- Metadados
    device_type VARCHAR(20),
    is_anonymous BOOLEAN DEFAULT false,
    include_in_training BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: algorithm_performance
-- Performance dos algoritmos por período
-- =====================================================
CREATE TABLE IF NOT EXISTS algorithm_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação do algoritmo
    algorithm_name VARCHAR(20) NOT NULL,
    version VARCHAR(10) DEFAULT '1.0',
    
    -- Período de análise
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Métricas principais
    total_recommendations INTEGER DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0.0000,
    user_satisfaction DECIMAL(3,2) DEFAULT 0.0,
    
    -- Métricas de qualidade
    average_match_score DECIMAL(3,2) DEFAULT 0.0,
    diversity_score DECIMAL(3,2) DEFAULT 0.0,
    novelty_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Métricas de engajamento
    click_through_rate DECIMAL(5,4) DEFAULT 0.0000,
    like_rate DECIMAL(5,4) DEFAULT 0.0000,
    conversation_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Métricas técnicas
    cache_hit_rate DECIMAL(5,4) DEFAULT 0.0000,
    error_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Uso de recursos
    average_cpu_time_ms INTEGER DEFAULT 0,
    average_memory_usage_mb INTEGER DEFAULT 0,
    database_queries_per_request DECIMAL(5,2) DEFAULT 0.00,
    
    -- Custos estimados
    estimated_cost_per_recommendation DECIMAL(8,6) DEFAULT 0.000000,
    estimated_monthly_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Comparação
    relative_performance DECIMAL(3,2) DEFAULT 0.0, -- -1 a 1
    is_recommended BOOLEAN DEFAULT false,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(algorithm_name, version, period_start)
);

-- =====================================================
-- TABELA: user_learning_profile
-- Perfil de aprendizado do usuário
-- =====================================================
CREATE TABLE IF NOT EXISTS user_learning_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Dados de aprendizado
    total_learning_events INTEGER DEFAULT 0,
    last_learning_update TIMESTAMP WITH TIME ZONE,
    learning_velocity DECIMAL(3,2) DEFAULT 0.5 CHECK (learning_velocity >= 0 AND learning_velocity <= 1),
    
    -- Confiança no aprendizado
    learning_confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (learning_confidence >= 0 AND learning_confidence <= 1),
    data_quality DECIMAL(3,2) DEFAULT 0.5 CHECK (data_quality >= 0 AND data_quality <= 1),
    sample_size INTEGER DEFAULT 0,
    
    -- Padrões identificados
    identified_patterns JSONB DEFAULT '[]',
    predictions JSONB DEFAULT '[]',
    
    -- Performance do algoritmo para este usuário
    algorithm_performance DECIMAL(3,2) DEFAULT 0.5 CHECK (algorithm_performance >= 0 AND algorithm_performance <= 1),
    
    -- Experimentos
    participating_experiments TEXT[],
    test_group_assignments JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: system_statistics
-- Estatísticas agregadas do sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Período da estatística
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    statistic_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Métricas gerais
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_recommendations INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    
    -- Taxas de sucesso
    overall_match_rate DECIMAL(5,4) DEFAULT 0.0000,
    overall_conversation_rate DECIMAL(5,4) DEFAULT 0.0000,
    user_satisfaction_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Qualidade dos dados
    average_profile_quality DECIMAL(3,2) DEFAULT 0.0,
    data_completeness_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Performance dos algoritmos
    algorithm_performance JSONB DEFAULT '{}',
    best_performing_algorithm VARCHAR(20),
    
    -- Tendências
    user_growth_rate DECIMAL(5,2) DEFAULT 0.00,
    engagement_trend VARCHAR(20) DEFAULT 'stable',
    quality_trend VARCHAR(20) DEFAULT 'stable',
    
    -- Metadados
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version VARCHAR(10) DEFAULT '1.0',
    
    UNIQUE(statistic_type, period_start)
);

-- Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_type ON user_behavior_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_active ON user_behavior_patterns(is_active);

CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_period ON engagement_metrics(user_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_period_start ON engagement_metrics(period_start);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_session_id ON recommendation_feedback(session_id);

CREATE INDEX IF NOT EXISTS idx_algorithm_performance_name_period ON algorithm_performance(algorithm_name, period_start);
CREATE INDEX IF NOT EXISTS idx_algorithm_performance_recommended ON algorithm_performance(is_recommended);

CREATE INDEX IF NOT EXISTS idx_system_statistics_type_period ON system_statistics(statistic_type, period_start);

-- Comentários para documentação
COMMENT ON TABLE analytics_events IS 'Eventos de analytics para tracking detalhado de comportamento';
COMMENT ON TABLE user_behavior_patterns IS 'Padrões comportamentais identificados por machine learning';
COMMENT ON TABLE engagement_metrics IS 'Métricas de engajamento calculadas por usuário e período';
COMMENT ON TABLE recommendation_feedback IS 'Feedback dos usuários sobre qualidade das recomendações';
COMMENT ON TABLE algorithm_performance IS 'Métricas de performance dos algoritmos de recomendação';
COMMENT ON TABLE user_learning_profile IS 'Perfil de aprendizado e personalização por usuário';
COMMENT ON TABLE system_statistics IS 'Estatísticas agregadas do sistema para dashboards';