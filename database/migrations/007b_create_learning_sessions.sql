-- Migration para criar tabela de sessões de aprendizado
BEGIN;

CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    learning_objective VARCHAR(255),
    session_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50),
    device_info JSONB,
    CONSTRAINT valid_duration CHECK (
        ended_at IS NULL OR 
        (ended_at > started_at AND duration_seconds = EXTRACT(EPOCH FROM (ended_at - started_at)))
    )
);

-- Índices para consultas frequentes
CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_time ON learning_sessions(started_at);

COMMIT;