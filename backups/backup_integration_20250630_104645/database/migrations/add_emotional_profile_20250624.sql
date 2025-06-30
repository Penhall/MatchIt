-- server/migrations/add_emotional_profile_20250624.sql - Migração para adicionar suporte ao perfil emocional

-- ==============================================
-- MIGRAÇÃO: PERFIL EMOCIONAL (FASE 1)
-- ==============================================

-- Adicionar colunas para perfil emocional na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS emotional_profile JSONB,
ADD COLUMN IF NOT EXISTS emotional_responses JSONB,
ADD COLUMN IF NOT EXISTS emotional_updated_at TIMESTAMP;

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índice para buscar usuários com perfil emocional completo
CREATE INDEX IF NOT EXISTS idx_user_profiles_emotional_completed 
ON user_profiles ((emotional_profile->'metadata'->'completionStatus'->>'completed'));

-- Índice para filtrar por confiabilidade do perfil emocional
CREATE INDEX IF NOT EXISTS idx_user_profiles_emotional_reliability 
ON user_profiles ((emotional_profile->'metadata'->>'reliabilityScore'));

-- Índice para buscar por estilo de comunicação
CREATE INDEX IF NOT EXISTS idx_user_profiles_communication_style 
ON user_profiles ((emotional_profile->>'communicationStyle'));

-- Índice para buscar por humor atual (para matching em tempo real)
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_mood 
ON user_profiles ((emotional_profile->'currentMoodProfile'->>'currentMood'));

-- Índice para buscar perfis com humor válido (não expirado)
CREATE INDEX IF NOT EXISTS idx_user_profiles_mood_valid 
ON user_profiles ((emotional_profile->'currentMoodProfile'->>'validUntil')) 
WHERE (emotional_profile->'currentMoodProfile'->>'validUntil')::timestamp > NOW();

-- ==============================================
-- FUNÇÕES UTILITÁRIAS
-- ==============================================

-- Função para calcular completude do perfil emocional
CREATE OR REPLACE FUNCTION calculate_emotional_completeness(profile_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    completeness INTEGER := 0;
    required_fields TEXT[] := ARRAY[
        'dominantEmotions',
        'emotionalIntensity', 
        'emotionalStability',
        'socialEnergy',
        'empathyLevel',
        'communicationStyle',
        'currentMoodProfile'
    ];
    field TEXT;
BEGIN
    -- Verificar se o perfil existe
    IF profile_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Verificar cada campo obrigatório
    FOREACH field IN ARRAY required_fields
    LOOP
        IF profile_data ? field THEN
            CASE field
                WHEN 'dominantEmotions' THEN
                    IF jsonb_array_length(profile_data->'dominantEmotions') > 0 THEN
                        completeness := completeness + 1;
                    END IF;
                ELSE
                    IF profile_data->>field IS NOT NULL AND profile_data->>field != '' THEN
                        completeness := completeness + 1;
                    END IF;
            END CASE;
        END IF;
    END LOOP;
    
    -- Retornar porcentagem
    RETURN (completeness * 100) / array_length(required_fields, 1);
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se o humor está válido
CREATE OR REPLACE FUNCTION is_mood_valid(profile_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF profile_data IS NULL OR 
       NOT (profile_data ? 'currentMoodProfile') OR
       NOT (profile_data->'currentMoodProfile' ? 'validUntil') THEN
        RETURN FALSE;
    END IF;
    
    RETURN (profile_data->'currentMoodProfile'->>'validUntil')::timestamp > NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para extrair emoções dominantes como array
CREATE OR REPLACE FUNCTION get_dominant_emotions(profile_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
    emotions TEXT[] := '{}';
    emotion JSONB;
BEGIN
    IF profile_data IS NULL OR NOT (profile_data ? 'dominantEmotions') THEN
        RETURN emotions;
    END IF;
    
    FOR emotion IN SELECT * FROM jsonb_array_elements(profile_data->'dominantEmotions')
    LOOP
        emotions := array_append(emotions, emotion->>'type');
    END LOOP;
    
    RETURN emotions;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- VIEWS PARA CONSULTAS OTIMIZADAS
-- ==============================================

-- View para usuários com perfil emocional completo
CREATE OR REPLACE VIEW users_with_emotional_profile AS
SELECT 
    up.user_id,
    up.id as profile_id,
    up.emotional_profile,
    calculate_emotional_completeness(up.emotional_profile) as completeness_percentage,
    is_mood_valid(up.emotional_profile) as mood_is_valid,
    get_dominant_emotions(up.emotional_profile) as dominant_emotions,
    up.emotional_profile->>'communicationStyle' as communication_style,
    up.emotional_profile->'currentMoodProfile'->>'currentMood' as current_mood,
    (up.emotional_profile->'metadata'->>'reliabilityScore')::INTEGER as reliability_score,
    up.emotional_updated_at,
    up.updated_at
FROM user_profiles up
WHERE up.emotional_profile IS NOT NULL
  AND (up.emotional_profile->'metadata'->'completionStatus'->>'completed')::boolean = true;

-- View para compatibilidade emocional rápida
CREATE OR REPLACE VIEW emotional_compatibility_data AS
SELECT 
    up.user_id,
    up.emotional_profile->>'communicationStyle' as communication_style,
    (up.emotional_profile->>'emotionalIntensity')::INTEGER as emotional_intensity,
    (up.emotional_profile->>'emotionalStability')::INTEGER as emotional_stability,
    (up.emotional_profile->>'socialEnergy')::INTEGER as social_energy,
    (up.emotional_profile->>'empathyLevel')::INTEGER as empathy_level,
    up.emotional_profile->'currentMoodProfile'->>'currentMood' as current_mood,
    (up.emotional_profile->'currentMoodProfile'->>'energyLevel')::INTEGER as energy_level,
    (up.emotional_profile->'currentMoodProfile'->>'socialDesire')::INTEGER as social_desire,
    (up.emotional_profile->'currentMoodProfile'->>'romanticMood')::INTEGER as romantic_mood,
    is_mood_valid(up.emotional_profile) as mood_valid,
    get_dominant_emotions(up.emotional_profile) as dominant_emotions
FROM user_profiles up
WHERE up.emotional_profile IS NOT NULL;

-- ==============================================
-- TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- ==============================================

-- Função trigger para atualizar timestamp quando perfil emocional muda
CREATE OR REPLACE FUNCTION update_emotional_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.emotional_profile IS DISTINCT FROM NEW.emotional_profile THEN
        NEW.emotional_updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS trigger_update_emotional_timestamp ON user_profiles;
CREATE TRIGGER trigger_update_emotional_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_emotional_timestamp();

-- ==============================================
-- DADOS DE EXEMPLO (PARA DESENVOLVIMENTO)
-- ==============================================

-- Inserir alguns perfis emocionais de exemplo para teste
-- (apenas se não existirem usuários com perfil emocional)

DO $$
DECLARE
    user_count INTEGER;
    sample_emotional_profile JSONB;
BEGIN
    -- Verificar se já existem perfis emocionais
    SELECT COUNT(*) INTO user_count 
    FROM user_profiles 
    WHERE emotional_profile IS NOT NULL;
    
    -- Se não existir nenhum, criar alguns exemplos
    IF user_count = 0 THEN
        -- Perfil emocional de exemplo 1 (Expressivo e Empático)
        sample_emotional_profile := '{
            "dominantEmotions": [
                {"type": "joy", "intensity": 85, "frequency": 80, "preference": 90},
                {"type": "empathy", "intensity": 75, "frequency": 85, "preference": 85},
                {"type": "excitement", "intensity": 70, "frequency": 60, "preference": 80}
            ],
            "emotionalIntensity": 75,
            "emotionalStability": 70,
            "socialEnergy": 80,
            "empathyLevel": 85,
            "communicationStyle": "expressive",
            "activityPreferences": {
                "whenHappy": ["social_gathering", "music", "dancing"],
                "whenCalm": ["reading", "meditation", "art"],
                "whenStressed": ["exercise", "music", "social_gathering"],
                "whenRomantic": ["dinner_date", "intimate_conversation", "art"],
                "moodBoosters": ["music", "social_gathering", "exercise"]
            },
            "currentMoodProfile": {
                "currentMood": "contentment",
                "moodIntensity": 70,
                "moodStability": 75,
                "energyLevel": 65,
                "socialDesire": 80,
                "romanticMood": 60,
                "lastUpdated": "' || NOW()::text || '",
                "validUntil": "' || (NOW() + INTERVAL '24 hours')::text || '"
            },
            "metadata": {
                "profileId": "emotional_sample_1",
                "userId": "sample_user_1",
                "version": 1,
                "completedAt": "' || NOW()::text || '",
                "lastUpdatedAt": "' || NOW()::text || '",
                "completionStatus": {
                    "completed": true,
                    "sectionsCompleted": 5,
                    "totalSections": 5,
                    "completionPercentage": 100
                },
                "dataSource": "questionnaire",
                "reliabilityScore": 85,
                "qualityFlags": {
                    "hasInconsistencies": false,
                    "needsReview": false,
                    "isHighConfidence": true
                }
            }
        }';
        
        -- Atualizar um usuário existente com perfil emocional de exemplo
        UPDATE user_profiles 
        SET emotional_profile = sample_emotional_profile,
            emotional_updated_at = NOW()
        WHERE user_id = (
            SELECT id FROM users LIMIT 1
        );
        
        RAISE NOTICE 'Perfil emocional de exemplo adicionado para desenvolvimento';
    END IF;
END $$;

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON COLUMN user_profiles.emotional_profile IS 'Perfil emocional completo do usuário (JSONB)';
COMMENT ON COLUMN user_profiles.emotional_responses IS 'Respostas do questionário emocional (JSONB)';
COMMENT ON COLUMN user_profiles.emotional_updated_at IS 'Timestamp da última atualização do perfil emocional';

COMMENT ON FUNCTION calculate_emotional_completeness(JSONB) IS 'Calcula porcentagem de completude do perfil emocional';
COMMENT ON FUNCTION is_mood_valid(JSONB) IS 'Verifica se o humor atual ainda é válido (não expirou)';
COMMENT ON FUNCTION get_dominant_emotions(JSONB) IS 'Extrai array de emoções dominantes do perfil';

COMMENT ON VIEW users_with_emotional_profile IS 'Usuários com perfil emocional completo e válido';
COMMENT ON VIEW emotional_compatibility_data IS 'Dados otimizados para cálculo de compatibilidade emocional';

-- ==============================================
-- VERIFICAÇÕES FINAIS
-- ==============================================

-- Verificar se as colunas foram criadas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'emotional_profile'
    ) THEN
        RAISE EXCEPTION 'Falha na migração: coluna emotional_profile não foi criada';
    END IF;
    
    RAISE NOTICE 'Migração de perfil emocional concluída com sucesso!';
    RAISE NOTICE 'Novas colunas: emotional_profile, emotional_responses, emotional_updated_at';
    RAISE NOTICE 'Funções criadas: calculate_emotional_completeness, is_mood_valid, get_dominant_emotions';
    RAISE NOTICE 'Views criadas: users_with_emotional_profile, emotional_compatibility_data';
    RAISE NOTICE 'Triggers criados: trigger_update_emotional_timestamp';
END $$;