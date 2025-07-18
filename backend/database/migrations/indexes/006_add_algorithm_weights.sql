-- Migration para adicionar tabela de pesos de algoritmos
BEGIN;

CREATE TABLE user_algorithm_weights (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    hybrid_weight NUMERIC(3,2) NOT NULL DEFAULT 0.4,
    content_weight NUMERIC(3,2) NOT NULL DEFAULT 0.3,
    collaborative_weight NUMERIC(3,2) NOT NULL DEFAULT 0.3,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_weights CHECK (
        hybrid_weight BETWEEN 0 AND 1 AND
        content_weight BETWEEN 0 AND 1 AND
        collaborative_weight BETWEEN 0 AND 1 AND
        (hybrid_weight + content_weight + collaborative_weight) BETWEEN 0.99 AND 1.01
    )
);

-- Índice para consultas frequentes
CREATE INDEX idx_user_weights ON user_algorithm_weights(user_id);

-- Função para ajuste seguro de pesos
CREATE OR REPLACE FUNCTION safe_adjust_weights(
    p_user_id INTEGER,
    p_hybrid_delta NUMERIC(3,2),
    p_content_delta NUMERIC(3,2),
    p_collab_delta NUMERIC(3,2)
RETURNS VOID AS $$
BEGIN
    UPDATE user_algorithm_weights
    SET 
        hybrid_weight = GREATEST(0, LEAST(1, hybrid_weight + p_hybrid_delta)),
        content_weight = GREATEST(0, LEAST(1, content_weight + p_content_delta)),
        collaborative_weight = GREATEST(0, LEAST(1, collaborative_weight + p_collab_delta)),
        last_updated = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;