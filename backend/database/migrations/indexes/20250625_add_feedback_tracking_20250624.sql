-- server/migrations/add_feedback_tracking_20250624.sql

-- Tabela principal de eventos de feedback
CREATE TABLE feedback_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context data
    screen_type VARCHAR(50),
    session_id UUID,
    time_spent_viewing INTEGER DEFAULT 0, -- em segundos
    profile_position INTEGER,
    total_profiles_shown INTEGER,
    user_mood JSONB,
    time_of_day VARCHAR(20),
    day_of_week VARCHAR(20),
    
    -- Metadata
    match_score DECIMAL(3,2),
    style_compatibility DECIMAL(3,2),
    emotional_compatibility DECIMAL(3,2),
    attribute_weights JSONB NOT NULL,
    target_user_attributes JSONB NOT NULL,
    reasons_for_recommendation TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ajustes de pesos
CREATE TABLE weight_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attribute VARCHAR(50) NOT NULL,
    old_weight DECIMAL(4,3) NOT NULL,
    new_weight DECIMAL(4,3) NOT NULL,
    adjustment_reason VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    data_points INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de aprendizado dos usuários
CREATE TABLE user_learning_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_feedback_events INTEGER DEFAULT 0,
    learning_velocity DECIMAL(3,2) DEFAULT 0.5,
    consistency_score DECIMAL(3,2) DEFAULT 0.5,
    mood_influence_level DECIMAL(3,2) DEFAULT 0.3,
    temporal_patterns JSONB DEFAULT '[]'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de recomendação adaptativa
CREATE TABLE adaptive_recommendation_configs (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_weights JSONB NOT NULL,
    base_weights JSONB NOT NULL,
    adaptation_rate DECIMAL(3,2) DEFAULT 0.3,
    min_confidence_threshold DECIMAL(3,2) DEFAULT 0.6,
    max_weight_change DECIMAL(3,2) DEFAULT 0.2,
    temporal_adaptation BOOLEAN DEFAULT true,
    mood_adaptation BOOLEAN DEFAULT true,
    learning_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de analytics de feedback (cache para consultas rápidas)
CREATE TABLE feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    total_events INTEGER DEFAULT 0,
    positive_events INTEGER DEFAULT 0,
    negative_events INTEGER DEFAULT 0,
    neutral_events INTEGER DEFAULT 0,
    avg_match_score DECIMAL(3,2),
    improvement_trend DECIMAL(3,2),
    top_performing_attributes TEXT[],
    underperforming_attributes TEXT[],
    recommendation_accuracy DECIMAL(3,2),
    user_satisfaction_score DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, period, period_start)
);

-- Tabela de resultados de otimização de pesos
CREATE TABLE weight_optimization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL,
    old_weights JSONB NOT NULL,
    new_weights JSONB NOT NULL,
    expected_improvement DECIMAL(3,2),
    confidence DECIMAL(3,2),
    data_points_used INTEGER,
    validation_score DECIMAL(3,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_feedback_events_user_id ON feedback_events(user_id);
CREATE INDEX idx_feedback_events_timestamp ON feedback_events(timestamp);
CREATE INDEX idx_feedback_events_event_type ON feedback_events(event_type);
CREATE INDEX idx_feedback_events_target_user ON feedback_events(target_user_id);
CREATE INDEX idx_feedback_events_session ON feedback_events(session_id);

CREATE INDEX idx_weight_adjustments_user_id ON weight_adjustments(user_id);
CREATE INDEX idx_weight_adjustments_timestamp ON weight_adjustments(timestamp);
CREATE INDEX idx_weight_adjustments_attribute ON weight_adjustments(attribute);

CREATE INDEX idx_feedback_analytics_user_period ON feedback_analytics(user_id, period, period_start);

CREATE INDEX idx_weight_optimization_user_id ON weight_optimization_results(user_id);
CREATE INDEX idx_weight_optimization_timestamp ON weight_optimization_results(timestamp);

-- Triggers para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_events_updated_at 
    BEFORE UPDATE ON feedback_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_profiles_updated_at 
    BEFORE UPDATE ON user_learning_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adaptive_configs_updated_at 
    BEFORE UPDATE ON adaptive_recommendation_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_analytics_updated_at 
    BEFORE UPDATE ON feedback_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar dados antigos (manter apenas últimos 6 meses)
CREATE OR REPLACE FUNCTION cleanup_old_feedback_data()
RETURNS void AS $$
BEGIN
    -- Remove eventos de feedback com mais de 6 meses
    DELETE FROM feedback_events 
    WHERE timestamp < NOW() - INTERVAL '6 months';
    
    -- Remove ajustes de peso com mais de 1 ano
    DELETE FROM weight_adjustments 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- Remove analytics diários com mais de 3 meses
    DELETE FROM feedback_analytics 
    WHERE period = 'daily' AND period_start < NOW() - INTERVAL '3 months';
    
    -- Remove analytics semanais com mais de 1 ano
    DELETE FROM feedback_analytics 
    WHERE period = 'weekly' AND period_start < NOW() - INTERVAL '1 year';
    
    -- Remove resultados de otimização com mais de 1 ano
    DELETE FROM weight_optimization_results 
    WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar mensalmente)
-- Nota: Requer extensão pg_cron para funcionar automaticamente
-- SELECT cron.schedule('cleanup_feedback_data', '0 3 1 * *', 'SELECT cleanup_old_feedback_data();');

-- Views úteis para análise
CREATE VIEW user_feedback_summary AS
SELECT 
    fe.user_id,
    COUNT(*) as total_events,
    COUNT(CASE WHEN fe.event_type IN ('swipe_right', 'super_like', 'message_sent') THEN 1 END) as positive_events,
    COUNT(CASE WHEN fe.event_type = 'swipe_left' THEN 1 END) as negative_events,
    AVG(fe.match_score) as avg_match_score,
    AVG(fe.time_spent_viewing) as avg_viewing_time,
    MAX(fe.timestamp) as last_activity
FROM feedback_events fe
WHERE fe.timestamp > NOW() - INTERVAL '30 days'
GROUP BY fe.user_id;

CREATE VIEW weight_adjustment_trends AS
SELECT 
    wa.user_id,
    wa.attribute,
    COUNT(*) as adjustment_count,
    AVG(wa.new_weight - wa.old_weight) as avg_change,
    MAX(wa.timestamp) as last_adjustment,
    AVG(wa.confidence_score) as avg_confidence
FROM weight_adjustments wa
WHERE wa.timestamp > NOW() - INTERVAL '90 days'
GROUP BY wa.user_id, wa.attribute
ORDER BY wa.user_id, adjustment_count DESC;

-- Inserir configurações padrão para usuários existentes
INSERT INTO adaptive_recommendation_configs (user_id, current_weights, base_weights)
SELECT 
    u.id as user_id,
    sp.preference_weights as current_weights,
    sp.preference_weights as base_weights
FROM users u
LEFT JOIN style_preferences sp ON u.id = sp.user_id
WHERE sp.preference_weights IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Inserir perfis de aprendizado padrão para usuários existentes  
INSERT INTO user_learning_profiles (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;