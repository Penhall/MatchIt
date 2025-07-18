-- Migration para criar a view de perfil emocional do usuário
BEGIN;

CREATE OR REPLACE VIEW user_emotional_profile AS
WITH recent_states AS (
    SELECT 
        user_id,
        AVG(valence) AS avg_valence,
        AVG(arousal) AS avg_arousal,
        AVG(dominance) AS avg_dominance,
        COUNT(*) AS sample_count
    FROM emotional_states
    WHERE timestamp > NOW() - INTERVAL '7 days'
    GROUP BY user_id
),
baseline_states AS (
    SELECT 
        user_id,
        AVG(valence) AS baseline_valence,
        AVG(arousal) AS baseline_arousal,
        AVG(dominance) AS baseline_dominance
    FROM emotional_states
    GROUP BY user_id
)

SELECT 
    u.id AS user_id,
    u.username,
    r.avg_valence,
    r.avg_arousal,
    r.avg_dominance,
    r.sample_count,
    b.baseline_valence,
    b.baseline_arousal,
    b.baseline_dominance,
    CASE
        WHEN r.avg_valence > b.baseline_valence + 0.2 THEN 'more_positive'
        WHEN r.avg_valence < b.baseline_valence - 0.2 THEN 'more_negative'
        ELSE 'neutral'
    END AS valence_trend,
    CASE
        WHEN r.avg_arousal > b.baseline_arousal + 0.2 THEN 'more_aroused'
        WHEN r.avg_arousal < b.baseline_arousal - 0.2 THEN 'less_aroused'
        ELSE 'neutral'
    END AS arousal_trend
FROM users u
LEFT JOIN recent_states r ON u.id = r.user_id
LEFT JOIN baseline_states b ON u.id = b.user_id;

COMMENT ON VIEW user_emotional_profile IS 'Agregação do perfil emocional dos usuários para uso no sistema de recomendações';

COMMIT;