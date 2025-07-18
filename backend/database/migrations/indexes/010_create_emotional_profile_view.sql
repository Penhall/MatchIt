-- Migration para criar view de perfil emocional dos usuários
-- Compatível com PostgreSQL 14+
BEGIN;

-- View principal com agregações por período
CREATE OR REPLACE VIEW user_emotional_profile AS
WITH hourly_stats AS (
    SELECT
        user_id,
        date_trunc('hour', timestamp) AS period,
        'hour' AS period_type,
        COUNT(*) AS data_points,
        AVG(valence) AS avg_valence,
        STDDEV(valence) AS std_valence,
        AVG(arousal) AS avg_arousal,
        STDDEV(arousal) AS std_arousal,
        AVG(dominance) AS avg_dominance,
        STDDEV(dominance) AS std_dominance
    FROM emotional_states
    GROUP BY user_id, date_trunc('hour', timestamp)
),
daily_stats AS (
    SELECT
        user_id,
        date_trunc('day', timestamp) AS period,
        'day' AS period_type,
        COUNT(*) AS data_points,
        AVG(valence) AS avg_valence,
        STDDEV(valence) AS std_valence,
        AVG(arousal) AS avg_arousal,
        STDDEV(arousal) AS std_arousal,
        AVG(dominance) AS avg_dominance,
        STDDEV(dominance) AS std_dominance
    FROM emotional_states
    GROUP BY user_id, date_trunc('day', timestamp)
),
weekly_stats AS (
    SELECT
        user_id,
        date_trunc('week', timestamp) AS period,
        'week' AS period_type,
        COUNT(*) AS data_points,
        AVG(valence) AS avg_valence,
        STDDEV(valence) AS std_valence,
        AVG(arousal) AS avg_arousal,
        STDDEV(arousal) AS std_arousal,
        AVG(dominance) AS avg_dominance,
        STDDEV(dominance) AS std_dominance
    FROM emotional_states
    GROUP BY user_id, date_trunc('week', timestamp)
)
SELECT * FROM hourly_stats
UNION ALL
SELECT * FROM daily_stats
UNION ALL
SELECT * FROM weekly_stats;

-- Índices materializados para otimização
CREATE INDEX idx_user_emotional_profile_user_period ON emotional_states(user_id, timestamp);
CREATE INDEX idx_user_emotional_profile_aggregates ON emotional_states((date_trunc('hour', timestamp)), (date_trunc('day', timestamp)), (date_trunc('week', timestamp)));

-- Função para rollback
CREATE OR REPLACE FUNCTION drop_emotional_profile_view()
RETURNS VOID AS $$
BEGIN
    DROP VIEW IF EXISTS user_emotional_profile;
    DROP INDEX IF EXISTS idx_user_emotional_profile_user_period;
    DROP INDEX IF EXISTS idx_user_emotional_profile_aggregates;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Documentação da view
COMMENT ON VIEW user_emotional_profile IS 'View agregada de perfis emocionais com estatísticas por período (hora/dia/semana)';
COMMENT ON COLUMN user_emotional_profile.user_id IS 'ID do usuário associado';
COMMENT ON COLUMN user_emotional_profile.period IS 'Período de agregação';
COMMENT ON COLUMN user_emotional_profile.period_type IS 'Tipo de período (hour/day/week)';
COMMENT ON COLUMN user_emotional_profile.data_points IS 'Número de pontos de dados no período';
COMMENT ON COLUMN user_emotional_profile.avg_valence IS 'Média de valência (-1 a 1)';
COMMENT ON COLUMN user_emotional_profile.std_valence IS 'Desvio padrão de valência';
COMMENT ON COLUMN user_emotional_profile.avg_arousal IS 'Média de excitação (0 a 1)';
COMMENT ON COLUMN user_emotional_profile.std_arousal IS 'Desvio padrão de excitação';
COMMENT ON COLUMN user_emotional_profile.avg_dominance IS 'Média de dominância (0 a 1)';
COMMENT ON COLUMN user_emotional_profile.std_dominance IS 'Desvio padrão de dominância';