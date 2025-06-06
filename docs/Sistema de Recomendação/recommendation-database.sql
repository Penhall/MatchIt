-- scripts/recommendation_schema.sql
-- Schema para Sistema de Recomendações do MatchIt

-- Tabela para armazenar interações entre usuários
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'skip', 'match', 'unmatch')),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar múltiplas interações do mesmo tipo
    UNIQUE(user_id, target_user_id)
);

-- Tabela para pesos personalizados do algoritmo por usuário
CREATE TABLE IF NOT EXISTS user_algorithm_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    style_weight DECIMAL(3,2) DEFAULT 0.25 CHECK (style_weight >= 0 AND style_weight <= 1),
    emotional_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (emotional_weight >= 0 AND emotional_weight <= 1),
    hobby_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (hobby_weight >= 0 AND hobby_weight <= 1),
    location_weight DECIMAL(3,2) DEFAULT 0.15 CHECK (location_weight >= 0 AND location_weight <= 1),
    personality_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (personality_weight >= 0 AND personality_weight <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que os pesos somem 1.0
    CONSTRAINT weights_sum_check CHECK (
        style_weight + emotional_weight + hobby_weight + location_weight + personality_weight = 1.00
    )
);

-- Tabela para perfis estendidos dos usuários (dados do algoritmo)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    personality_vector DECIMAL(3,2)[] DEFAULT ARRAY[0.5,0.5,0.5,0.5,0.5], -- Big Five personality traits
    emotional_profile DECIMAL(3,2)[] DEFAULT ARRAY[0.5,0.5,0.5,0.5], -- Emotional dimensions
    activity_level INTEGER DEFAULT 5 CHECK (activity_level >= 0 AND activity_level <= 10),
    style_confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (style_confidence >= 0 AND style_confidence <= 1),
    openness_score DECIMAL(3,2) DEFAULT 0.5 CHECK (openness_score >= 0 AND openness_score <= 1),
    last_style_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para estatísticas de recomendações
CREATE TABLE IF NOT EXISTS recommendation_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recommendations_shown INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,
    dislikes_given INTEGER DEFAULT 0,
    super_likes_given INTEGER DEFAULT 0,
    matches_created INTEGER DEFAULT 0,
    algorithm_used VARCHAR(20) DEFAULT 'hybrid',
    avg_match_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Uma linha por usuário por dia
    UNIQUE(user_id, date)
);

-- Tabela para eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para cache de recomendações (otimização)
CREATE TABLE IF NOT EXISTS recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    algorithm VARCHAR(20) NOT NULL,
    recommendations JSONB NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, cache_key)
);

-- Tabela para matches confirmados
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_score DECIMAL(3,2) NOT NULL,
    algorithm_used VARCHAR(20) DEFAULT 'hybrid',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'ended')),
    conversation_started BOOLEAN DEFAULT FALSE,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não há matches duplicados
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id != user2_id)
);

-- Índices para otimização de performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions(action);

CREATE INDEX IF NOT EXISTS idx_recommendation_stats_user_date ON recommendation_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recommendation_stats_date ON recommendation_stats(date);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user_key ON recommendation_cache(user_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires ON recommendation_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Índices geoespaciais para localização (se usando PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(ST_Point(longitude, latitude));

-- Funções para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-update de timestamps
CREATE TRIGGER update_user_interactions_updated_at 
    BEFORE UPDATE ON user_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_algorithm_weights_updated_at 
    BEFORE UPDATE ON user_algorithm_weights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM recommendation_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para criar match quando há like mútuo
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a ação é um like, verificar se existe like reverso
    IF NEW.action = 'like' OR NEW.action = 'super_like' THEN
        -- Verificar se o usuário alvo já deu like no usuário atual
        IF EXISTS (
            SELECT 1 FROM user_interactions 
            WHERE user_id = NEW.target_user_id 
            AND target_user_id = NEW.user_id 
            AND action IN ('like', 'super_like')
        ) THEN
            -- Criar match se não existir
            INSERT INTO matches (user1_id, user2_id, match_score, algorithm_used)
            VALUES (
                LEAST(NEW.user_id, NEW.target_user_id),
                GREATEST(NEW.user_id, NEW.target_user_id),
                0.75, -- Score padrão para matches por curtida mútua
                'mutual_like'
            )
            ON CONFLICT (user1_id, user2_id) DO NOTHING;
            
            -- Registrar evento de analytics
            INSERT INTO analytics_events (user_id, event_type, data)
            VALUES (
                NEW.user_id,
                'match_created',
                json_build_object(
                    'match_with', NEW.target_user_id,
                    'trigger_action', NEW.action
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criação automática de matches
CREATE TRIGGER trigger_check_mutual_like
    AFTER INSERT ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION check_mutual_like();

-- View para estatísticas gerais do sistema
CREATE OR REPLACE VIEW recommendation_system_stats AS
SELECT 
    COUNT(DISTINCT user_id) as total_active_users,
    COUNT(*) as total_interactions,
    COUNT(*) FILTER (WHERE action = 'like') as total_likes,
    COUNT(*) FILTER (WHERE action = 'super_like') as total_super_likes,
    COUNT(*) FILTER (WHERE action = 'dislike') as total_dislikes,
    COUNT(DISTINCT CASE WHEN action IN ('like', 'super_like') THEN user_id END) as users_with_likes,
    AVG(CASE WHEN action IN ('like', 'super_like') THEN 1 ELSE 0 END) as like_rate,
    COUNT(DISTINCT m.id) as total_matches
FROM user_interactions ui
LEFT JOIN matches m ON (
    (m.user1_id = ui.user_id AND m.user2_id = ui.target_user_id) OR
    (m.user2_id = ui.user_id AND m.user1_id = ui.target_user_id)
)
WHERE ui.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- View para performance do usuário
CREATE OR REPLACE VIEW user_recommendation_performance AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(ui.id) as total_interactions,
    COUNT(ui.id) FILTER (WHERE ui.action = 'like') as likes_given,
    COUNT(ui.id) FILTER (WHERE ui.action = 'dislike') as dislikes_given,
    COUNT(received.id) FILTER (WHERE received.action = 'like') as likes_received,
    COUNT(m.id) as total_matches,
    COALESCE(AVG(m.match_score), 0) as avg_match_score,
    (COUNT(ui.id) FILTER (WHERE ui.action = 'like')::FLOAT / 
     NULLIF(COUNT(ui.id), 0)) as like_ratio
FROM users u
LEFT JOIN user_interactions ui ON u.id = ui.user_id
LEFT JOIN user_interactions received ON u.id = received.target_user_id
LEFT JOIN matches m ON (u.id = m.user1_id OR u.id = m.user2_id)
WHERE u.active = true
GROUP BY u.id, u.name;

-- Inserir dados padrão para pesos do algoritmo
INSERT INTO user_algorithm_weights (user_id, style_weight, emotional_weight, hobby_weight, location_weight, personality_weight)
SELECT 
    id,
    0.25, -- style_weight
    0.20, -- emotional_weight  
    0.20, -- hobby_weight
    0.15, -- location_weight
    0.20  -- personality_weight
FROM users 
WHERE NOT EXISTS (
    SELECT 1 FROM user_algorithm_weights 
    WHERE user_algorithm_weights.user_id = users.id
);

-- Inserir perfis padrão para usuários existentes
INSERT INTO user_profiles (user_id)
SELECT id FROM users 
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = users.id
);

COMMENT ON TABLE user_interactions IS 'Armazena todas as interações entre usuários (like, dislike, etc.)';
COMMENT ON TABLE user_algorithm_weights IS 'Pesos personalizados do algoritmo de recomendação por usuário';
COMMENT ON TABLE user_profiles IS 'Perfis estendidos com dados para o algoritmo de matching';
COMMENT ON TABLE recommendation_stats IS 'Estatísticas diárias de uso do sistema de recomendações';
COMMENT ON TABLE analytics_events IS 'Eventos para análise de comportamento e performance';
COMMENT ON TABLE recommendation_cache IS 'Cache de recomendações para otimização de performance';
COMMENT ON TABLE matches IS 'Matches confirmados entre usuários';