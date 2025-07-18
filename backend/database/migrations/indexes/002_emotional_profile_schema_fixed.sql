-- database/migrations/002_emotional_profile_schema_fixed.sql - Schema Corrigido para Perfil Emocional

-- =====================================================
-- TABELA DE CONFIGURACOES DO SISTEMA (se nao existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABELA PRINCIPAL DE PERFIS EMOCIONAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS emotional_profiles (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    version VARCHAR(10) NOT NULL DEFAULT '1.0',
    
    -- =====================================================
    -- DIMENSOES EMOCIONAIS PRINCIPAIS
    -- =====================================================
    
    -- Energia e Vitalidade
    energy_level INTEGER NOT NULL CHECK (energy_level >= 0 AND energy_level <= 100),
    social_energy INTEGER NOT NULL CHECK (social_energy >= 0 AND social_energy <= 100),
    physical_energy INTEGER NOT NULL CHECK (physical_energy >= 0 AND physical_energy <= 100),
    mental_energy INTEGER NOT NULL CHECK (mental_energy >= 0 AND mental_energy <= 100),
    
    -- Abertura Emocional
    openness INTEGER NOT NULL CHECK (openness >= 0 AND openness <= 100),
    vulnerability INTEGER NOT NULL CHECK (vulnerability >= 0 AND vulnerability <= 100),
    emotional_expression INTEGER NOT NULL CHECK (emotional_expression >= 0 AND emotional_expression <= 100),
    empathy_level INTEGER NOT NULL CHECK (empathy_level >= 0 AND empathy_level <= 100),
    
    -- Estabilidade e Controle
    emotional_stability INTEGER NOT NULL CHECK (emotional_stability >= 0 AND emotional_stability <= 100),
    stress_resilience INTEGER NOT NULL CHECK (stress_resilience >= 0 AND stress_resilience <= 100),
    self_control INTEGER NOT NULL CHECK (self_control >= 0 AND self_control <= 100),
    adaptability INTEGER NOT NULL CHECK (adaptability >= 0 AND adaptability <= 100),
    
    -- Orientacao Social
    extroversion INTEGER NOT NULL CHECK (extroversion >= 0 AND extroversion <= 100),
    social_confidence INTEGER NOT NULL CHECK (social_confidence >= 0 AND social_confidence <= 100),
    group_orientation INTEGER NOT NULL CHECK (group_orientation >= 0 AND group_orientation <= 100),
    intimacy_comfort INTEGER NOT NULL CHECK (intimacy_comfort >= 0 AND intimacy_comfort <= 100),
    
    -- Motivacao e Ambicao
    achievement_drive INTEGER NOT NULL CHECK (achievement_drive >= 0 AND achievement_drive <= 100),
    competitiveness INTEGER NOT NULL CHECK (competitiveness >= 0 AND competitiveness <= 100),
    goal_orientation INTEGER NOT NULL CHECK (goal_orientation >= 0 AND goal_orientation <= 100),
    risk_tolerance INTEGER NOT NULL CHECK (risk_tolerance >= 0 AND risk_tolerance <= 100),
    
    -- =====================================================
    -- PADROES EMOCIONAIS (JSONB para flexibilidade)
    -- =====================================================
    
    dominant_emotions JSONB NOT NULL DEFAULT '[]',
    emotional_patterns JSONB NOT NULL DEFAULT '[]',
    emotional_triggers JSONB NOT NULL DEFAULT '[]',
    emotional_needs JSONB NOT NULL DEFAULT '[]',
    
    -- =====================================================
    -- HISTORICO E HUMOR
    -- =====================================================
    
    mood_history JSONB NOT NULL DEFAULT '[]',
    average_mood INTEGER NOT NULL DEFAULT 50 CHECK (average_mood >= 0 AND average_mood <= 100),
    mood_stability INTEGER NOT NULL DEFAULT 50 CHECK (mood_stability >= 0 AND mood_stability <= 100),
    
    -- =====================================================
    -- ESTILOS DE RELACIONAMENTO
    -- =====================================================
    
    attachment_style VARCHAR(20) NOT NULL CHECK (attachment_style IN ('secure', 'anxious', 'avoidant', 'disorganized')),
    communication_style VARCHAR(20) NOT NULL CHECK (communication_style IN ('direct', 'indirect', 'passive', 'assertive', 'aggressive')),
    conflict_style VARCHAR(20) NOT NULL CHECK (conflict_style IN ('collaborative', 'competitive', 'accommodating', 'avoiding', 'compromising')),
    love_language JSONB NOT NULL DEFAULT '[]',
    
    -- =====================================================
    -- PREFERENCIAS E CONFIGURACOES
    -- =====================================================
    
    emotional_preferences JSONB NOT NULL DEFAULT '{}',
    deal_breakers JSONB NOT NULL DEFAULT '[]',
    
    -- =====================================================
    -- QUALIDADE DOS DADOS
    -- =====================================================
    
    completeness INTEGER NOT NULL DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),
    confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
    data_quality JSONB NOT NULL DEFAULT '{}',
    
    -- =====================================================
    -- METADADOS TEMPORAIS
    -- =====================================================
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_questionnaire TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    next_update_due TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    
    -- =====================================================
    -- CONFIGURACOES DE PRIVACIDADE E STATUS
    -- =====================================================
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true,
    privacy_level VARCHAR(20) NOT NULL DEFAULT 'matches_only' CHECK (privacy_level IN ('public', 'friends', 'matches_only', 'private')),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- =====================================================
-- CONSTRAINT UNICA
-- =====================================================

-- Remover constraint existente se houver
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_active_profile_per_user') THEN
        ALTER TABLE emotional_profiles DROP CONSTRAINT unique_active_profile_per_user;
    END IF;
END $$;

-- Adicionar constraint unica
ALTER TABLE emotional_profiles 
ADD CONSTRAINT unique_active_profile_per_user 
UNIQUE (user_id) 
DEFERRABLE INITIALLY DEFERRED;

-- =====================================================
-- INDICES PARA PERFORMANCE (CORRIGIDOS)
-- =====================================================

-- Limpar indices problemáticos se existirem
DROP INDEX IF EXISTS idx_emotional_profiles_user_id;
DROP INDEX IF EXISTS idx_emotional_profiles_active;
DROP INDEX IF EXISTS idx_emotional_profiles_public;
DROP INDEX IF EXISTS idx_emotional_profiles_update_due;

-- Criar indices corrigidos
CREATE INDEX IF NOT EXISTS idx_emotional_profiles_user_id ON emotional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_profiles_active ON emotional_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_emotional_profiles_public ON emotional_profiles(is_public, is_active) WHERE is_public = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_emotional_profiles_update_due ON emotional_profiles(next_update_due) WHERE is_active = true;

-- Indices para busca e matching
CREATE INDEX IF NOT EXISTS idx_emotional_energy_levels ON emotional_profiles(energy_level, social_energy) WHERE is_active = true AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_emotional_openness ON emotional_profiles(openness, emotional_expression) WHERE is_active = true AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_emotional_stability ON emotional_profiles(emotional_stability, stress_resilience) WHERE is_active = true AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_emotional_social ON emotional_profiles(extroversion, social_confidence) WHERE is_active = true AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_emotional_relationship_styles ON emotional_profiles(attachment_style, communication_style) WHERE is_active = true AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_emotional_completeness ON emotional_profiles(completeness) WHERE is_active = true AND is_public = true AND completeness >= 70;

-- =====================================================
-- TRIGGERS PARA MANUTENCAO AUTOMATICA
-- =====================================================

-- Funcao para atualizar updated_at
CREATE OR REPLACE FUNCTION update_emotional_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_emotional_profiles_updated_at ON emotional_profiles;
CREATE TRIGGER trigger_emotional_profiles_updated_at
    BEFORE UPDATE ON emotional_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_emotional_profile_updated_at();

-- =====================================================
-- VIEWS PARA CONSULTAS COMUNS
-- =====================================================

-- View para perfis ativos e publicos (criar apenas se emotional_profiles existir)
DROP VIEW IF EXISTS active_emotional_profiles;
CREATE VIEW active_emotional_profiles AS
SELECT 
    ep.*
FROM emotional_profiles ep
WHERE ep.is_active = true 
  AND ep.is_public = true 
  AND ep.deleted_at IS NULL
  AND ep.completeness >= 50;

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para calcular score de qualidade do perfil
CREATE OR REPLACE FUNCTION calculate_profile_quality_score(profile_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    quality_score INTEGER := 0;
    profile_record emotional_profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_record FROM emotional_profiles WHERE id = profile_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Base score pela completeness
    quality_score := profile_record.completeness;
    
    -- Bonus por ter dados recentes
    IF profile_record.last_questionnaire > NOW() - INTERVAL '30 days' THEN
        quality_score := quality_score + 10;
    END IF;
    
    -- Bonus por ter entradas de humor recentes
    IF EXISTS (
        SELECT 1 FROM mood_entries 
        WHERE user_id = profile_record.user_id 
        AND timestamp > NOW() - INTERVAL '7 days'
    ) THEN
        quality_score := quality_score + 5;
    END IF;
    
    -- Penalty por inconsistencias
    IF (profile_record.data_quality->>'hasInconsistencies')::boolean = true THEN
        quality_score := quality_score - 15;
    END IF;
    
    -- Garantir range valido
    quality_score := GREATEST(0, LEAST(100, quality_score));
    
    RETURN quality_score;
END;
$$ LANGUAGE plpgsql;

-- Funcao para buscar usuarios compativeis emocionalmente
CREATE OR REPLACE FUNCTION find_emotionally_compatible_users(
    target_user_id UUID,
    min_compatibility INTEGER DEFAULT 60,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    compatibility_score INTEGER,
    energy_diff INTEGER,
    openness_diff INTEGER,
    stability_diff INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.user_id,
        -- Calculo simplificado de compatibilidade
        (100 - (
            ABS(ep.energy_level - target_ep.energy_level) +
            ABS(ep.openness - target_ep.openness) +
            ABS(ep.emotional_stability - target_ep.emotional_stability)
        ) / 3)::INTEGER as compatibility_score,
        ABS(ep.energy_level - target_ep.energy_level) as energy_diff,
        ABS(ep.openness - target_ep.openness) as openness_diff,
        ABS(ep.emotional_stability - target_ep.emotional_stability) as stability_diff
    FROM active_emotional_profiles ep
    CROSS JOIN (
        SELECT * FROM emotional_profiles 
        WHERE user_id = target_user_id AND is_active = true
    ) target_ep
    WHERE ep.user_id != target_user_id
      AND (100 - (
          ABS(ep.energy_level - target_ep.energy_level) +
          ABS(ep.openness - target_ep.openness) +
          ABS(ep.emotional_stability - target_ep.emotional_stability)
      ) / 3) >= min_compatibility
    ORDER BY compatibility_score DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS E DOCUMENTACAO
-- =====================================================

COMMENT ON TABLE emotional_profiles IS 'Armazena perfis emocionais completos dos usuarios para sistema de matching';
COMMENT ON COLUMN emotional_profiles.completeness IS 'Percentual de completude do perfil (0-100)';
COMMENT ON COLUMN emotional_profiles.confidence IS 'Confianca na qualidade dos dados (0-100)';
COMMENT ON COLUMN emotional_profiles.next_update_due IS 'Data recomendada para proxima atualizacao do perfil';

-- =====================================================
-- DADOS INICIAIS E CONFIGURACOES
-- =====================================================

-- Inserir configuracoes padrao se nao existirem
INSERT INTO system_config (key, value, description) VALUES 
('emotional_profile_update_interval_days', '90', 'Intervalo recomendado para atualizacao do perfil emocional')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES 
('emotional_compatibility_cache_days', '7', 'Dias para manter compatibilidades em cache')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES 
('min_emotional_profile_completeness', '50', 'Completude minima para usar perfil em matching')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES 
('emotional_matching_weight', '0.25', 'Peso da dimensao emocional no algoritmo hibrido')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES 
('emotional_profile_min_questions', '20', 'Minimo de perguntas para perfil valido')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES 
('emotional_compatibility_threshold', '60', 'Score minimo para considerar compativel')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VERIFICACAO FINAL
-- =====================================================

-- Verificar se tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_profiles') THEN
        RAISE NOTICE 'SUCCESS: Tabela emotional_profiles criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'ERRO: Tabela emotional_profiles nao foi criada!';
    END IF;
END $$;