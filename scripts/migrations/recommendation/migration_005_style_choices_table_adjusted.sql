-- Versão ajustada para compatibilidade com a tabela users existente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS style_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_style_choice UNIQUE(user_id, category, question_id)
);

CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_question ON style_choices(question_id);

CREATE OR REPLACE FUNCTION update_updated_at_column_style_choices()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_style_choices_updated_at
    BEFORE UPDATE ON style_choices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_style_choices();
