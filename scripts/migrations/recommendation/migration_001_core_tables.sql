-- =====================================================
-- MIGRATION 001: TABELAS CORE DO SISTEMA DE RECOMENDAÇÃO
-- =====================================================
-- Versão: 1.2.001
-- Autor: Sistema MatchIt
-- Data: 2025-06-06
-- Descrição: Criação das tabelas principais para o sistema de recomendação

-- Extensão para UUID (caso não exista)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: user_extended_profiles
-- Perfis estendidos dos usuários para recomendações
-- =====================================================
CREATE TABLE IF NOT EXISTS user_extended_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Dados psicológicos
    personality_vector DECIMAL(3,2)[] DEFAULT ARRAY[0.5,0.5,0.5,0.5,0.5], -- Big Five
    emotional_profile DECIMAL(3,2)[] DEFAULT ARRAY[0.5,0.5,0.5,0.5], -- Emotional dimensions
    lifestyle_profile JSONB DEFAULT '{}',
    
    -- Métricas de atividade
    activity_level INTEGER DEFAULT 5 CHECK (activity_level >= 0 AND activity_level <= 10),
    engagement_score DECIMAL(3,2) DEFAULT 0.5 CHECK (engagement_score >= 0 AND engagement_score <= 1),
    
    -- Confiança e qualidade dos dados
    style_confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (style_confidence >= 0 AND style_confidence <= 1),
    data_quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    profile_completeness DECIMAL(3,2) DEFAULT 0.0 CHECK (profile_completeness >= 0 AND profile_completeness <= 1),
    
    -- Preferências de matching
    matching_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    
    -- Metadados temporais
    last_style_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_algorithm_training TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: user_algorithm_weights
-- Pesos personalizados do algoritmo por usuário
-- =====================================================
CREATE TABLE IF NOT EXISTS user_algorithm_weights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Pesos para cada dimensão (devem somar 1.0)
    style_weight DECIMAL(3,2) DEFAULT 0.25 CHECK (style_weight >= 0 AND style_weight <= 1),
    emotional_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (emotional_weight >= 0 AND emotional_weight <= 1),
    hobby_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (hobby_weight >= 0 AND hobby_weight <= 1),
    location_weight DECIMAL(3,2) DEFAULT 0.15 CHECK (location_weight >= 0 AND location_weight <= 1),
    personality_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (personality_weight >= 0 AND personality_weight <= 1),
    lifestyle_weight DECIMAL(3,2) DEFAULT 0.00 CHECK (lifestyle_weight >= 0 AND lifestyle_weight <= 1),
    values_weight DECIMAL(3,2) DEFAULT 0.00 CHECK (values_weight >= 0 AND values_weight <= 1),
    communication_weight DECIMAL(3,2) DEFAULT 0.00 CHECK (communication_weight >= 0 AND communication_weight <= 1),
    
    -- Metadados do aprendizado
    learned_from_interactions INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    last_training_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que os pesos somem 1.0 (com tolerância de 0.01)
    CONSTRAINT weights_sum_check CHECK (
        ABS((style_weight + emotional_weight + hobby_weight + location_weight + 
             personality_weight + lifestyle_weight + values_weight + communication_weight) - 1.00) <= 0.01
    )
);

-- =====================================================
-- TABELA: user_interactions
-- Interações entre usuários (likes, dislikes, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo de interação
    action VARCHAR(20) NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'skip', 'report', 'block')),
    
    -- Contexto da interação
    context JSONB DEFAULT '{}',
    view_time_ms INTEGER DEFAULT 0,
    scroll_depth DECIMAL(3,2) DEFAULT 0.0,
    photos_viewed INTEGER DEFAULT 0,
    
    -- Dados da recomendação que gerou esta interação
    match_score DECIMAL(3,2),
    algorithm_used VARCHAR(20),
    recommendation_position INTEGER,
    
    -- Dados técnicos
    session_id VARCHAR(100),
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    
    -- Flags de qualidade
    is_valid BOOLEAN DEFAULT true,
    is_spam BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar auto-interação
    CHECK (user_id != target_user_id),
    
    -- Constraint única para evitar múltiplas interações
    UNIQUE(user_id, target_user_id)
);

-- =====================================================
-- TABELA: match_scores
-- Scores de compatibilidade calculados
-- =====================================================
CREATE TABLE IF NOT EXISTS match_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Scores principais
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    normalized_score INTEGER GENERATED ALWAYS AS (ROUND(overall_score * 100)) STORED,
    
    -- Breakdown por dimensão
    style_score DECIMAL(3,2) DEFAULT 0,
    emotional_score DECIMAL(3,2) DEFAULT 0,
    hobby_score DECIMAL(3,2) DEFAULT 0,
    location_score DECIMAL(3,2) DEFAULT 0,
    personality_score DECIMAL(3,2) DEFAULT 0,
    lifestyle_score DECIMAL(3,2) DEFAULT 0,
    values_score DECIMAL(3,2) DEFAULT 0,
    communication_score DECIMAL(3,2) DEFAULT 0,
    
    -- Fatores e explicação
    positive_factors JSONB DEFAULT '[]',
    negative_factors JSONB DEFAULT '[]',
    explanation JSONB DEFAULT '{}',
    
    -- Confiança e qualidade
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    data_quality DECIMAL(3,2) DEFAULT 0.5,
    algorithm_certainty DECIMAL(3,2) DEFAULT 0.5,
    
    -- Contexto da recomendação
    algorithm_used VARCHAR(20) NOT NULL,
    context JSONB DEFAULT '{}',
    processing_time_ms INTEGER DEFAULT 0,
    
    -- Timestamps e expiração
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Feedback e resultado
    user_feedback JSONB,
    actual_outcome VARCHAR(20), -- 'like', 'dislike', 'match', 'conversation', etc.
    
    -- Constraint para evitar auto-match
    CHECK (user_id != target_user_id),
    
    -- Índice único para evitar duplicatas
    UNIQUE(user_id, target_user_id, algorithm_used)
);

-- =====================================================
-- TABELA: recommendation_sessions
-- Sessões de recomendação para tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS recommendation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados da sessão
    algorithm_used VARCHAR(20) NOT NULL,
    total_recommendations INTEGER DEFAULT 0,
    total_candidates_analyzed INTEGER DEFAULT 0,
    
    -- Performance
    processing_time_ms INTEGER DEFAULT 0,
    cache_hit_rate DECIMAL(3,2) DEFAULT 0.0,
    
    -- Qualidade das recomendações
    average_score DECIMAL(3,2) DEFAULT 0.0,
    diversity_score DECIMAL(3,2) DEFAULT 0.0,
    novelty_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Contexto da requisição
    context JSONB DEFAULT '{}',
    filters_applied JSONB DEFAULT '{}',
    
    -- Resultados
    recommendations_shown INTEGER DEFAULT 0,
    user_interactions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(3,2) DEFAULT 0.0,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Índice para otimizar consultas por sessão
    INDEX idx_recommendation_sessions_session_id (session_id),
    INDEX idx_recommendation_sessions_user_id (user_id),
    INDEX idx_recommendation_sessions_started_at (started_at)
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_user_extended_profiles_user_id ON user_extended_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_extended_profiles_activity_level ON user_extended_profiles(activity_level);
CREATE INDEX IF NOT EXISTS idx_user_extended_profiles_engagement_score ON user_extended_profiles(engagement_score);

CREATE INDEX IF NOT EXISTS idx_user_algorithm_weights_user_id ON user_algorithm_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_algorithm_weights_confidence ON user_algorithm_weights(confidence_score);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions(action);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);

CREATE INDEX IF NOT EXISTS idx_match_scores_user_id ON match_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_target_user_id ON match_scores(target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_overall_score ON match_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_algorithm ON match_scores(algorithm_used);
CREATE INDEX IF NOT EXISTS idx_match_scores_expires_at ON match_scores(expires_at);

-- Comentários para documentação
COMMENT ON TABLE user_extended_profiles IS 'Perfis estendidos com dados psicológicos e comportamentais para recomendações';
COMMENT ON TABLE user_algorithm_weights IS 'Pesos personalizados do algoritmo de recomendação por usuário';
COMMENT ON TABLE user_interactions IS 'Registro de todas as interações entre usuários (likes, dislikes, etc.)';
COMMENT ON TABLE match_scores IS 'Scores de compatibilidade calculados entre pares de usuários';
COMMENT ON TABLE recommendation_sessions IS 'Sessões de recomendação para análise de performance e qualidade';