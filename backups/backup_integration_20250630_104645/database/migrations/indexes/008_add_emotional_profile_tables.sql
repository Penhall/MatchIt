-- Migration para adicionar tabelas do módulo emocional (modelo VAD)
BEGIN;

-- Tabela principal de estados emocionais
CREATE TABLE emotional_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valence NUMERIC(3,2) NOT NULL CHECK (valence BETWEEN -1 AND 1),
    arousal NUMERIC(3,2) NOT NULL CHECK (arousal BETWEEN 0 AND 1),
    dominance NUMERIC(3,2) CHECK (dominance BETWEEN 0 AND 1),
    description TEXT,
    source VARCHAR(20) NOT NULL CHECK (source IN ('self_report', 'biometric', 'inferred')),
    metadata JSONB
);

-- Tabela de relacionamento com sessões de aprendizado
CREATE TABLE learning_session_emotions (
    session_id UUID NOT NULL REFERENCES learning_sessions(id),
    emotional_state_id UUID NOT NULL REFERENCES emotional_states(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, emotional_state_id)
);

-- Índices para consultas frequentes
CREATE INDEX idx_emotional_states_user ON emotional_states(user_id);
CREATE INDEX idx_emotional_states_timestamp ON emotional_states(timestamp);
CREATE INDEX idx_emotional_states_valence ON emotional_states(valence);
CREATE INDEX idx_session_emotions ON learning_session_emotions(session_id);

COMMIT;