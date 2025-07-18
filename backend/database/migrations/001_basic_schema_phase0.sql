-- database/migrations/001_basic_schema_phase0.sql - Schema básico para Fase 0

BEGIN;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20),
    location POINT,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de preferências de estilo (agregadas por categoria)
CREATE TABLE IF NOT EXISTS user_style_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    preference_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Tabela de escolhas individuais de estilo (para analytics)
CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    option_a VARCHAR(200),
    option_b VARCHAR(200), 
    selected_option VARCHAR(200) NOT NULL,
    response_time_ms INTEGER,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    auto_save_enabled BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'normal',
    settings_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_user_id ON user_style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_category ON user_style_preferences(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_session_id ON style_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Registrar migração
INSERT INTO schema_migrations (version, filename, description, category, priority)
VALUES ('001', '001_basic_schema_phase0.sql', 'Schema básico para Fase 0', 'core', 'critical')
ON CONFLICT (version) DO NOTHING;

COMMIT;
