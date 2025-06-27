-- Criar tabela style_preferences se não existir
CREATE TABLE IF NOT EXISTS style_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_style_preferences_user_id ON style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_style_preferences_category ON style_preferences(category);

-- Verificar se tabela foi criada
\dt style_preferences
