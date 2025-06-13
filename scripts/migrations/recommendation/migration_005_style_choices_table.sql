-- =====================================================
-- MIGRATION 005: TABELA style_choices (ATUALIZADA)
-- =====================================================
-- Versão: 2.0.0
-- Autor: Cline
-- Data: 2025-06-13
-- Descrição: Atualização da tabela para armazenar as escolhas de estilo dos usuários

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: style_choices (nova versão)
-- Armazena as escolhas de estilo feitas pelo usuário.
-- Cada linha representa uma escolha em uma categoria específica.
-- =====================================================
CREATE TABLE IF NOT EXISTS style_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Categoria da escolha (ex: 'Sneakers', 'Clothing', 'Colors')
    category VARCHAR(50) NOT NULL,
    
    -- ID da pergunta/questionário
    question_id VARCHAR(100) NOT NULL,
    
    -- Opção selecionada (pode ser um ID ou valor direto)
    selected_option VARCHAR(255) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    CONSTRAINT unique_style_choice UNIQUE(user_id, category, question_id)
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_question ON style_choices(question_id);

-- Trigger para atualizar updated_at
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

-- Comentários para documentação
COMMENT ON TABLE style_choices IS 'Armazena as escolhas de estilo feitas pelo usuário na tela de preferências.';
COMMENT ON COLUMN style_choices.user_id IS 'ID do usuário que fez a escolha.';
COMMENT ON COLUMN style_choices.category IS 'Categoria de estilo da escolha.';
COMMENT ON COLUMN style_choices.question_id IS 'ID da pergunta/questionário.';
COMMENT ON COLUMN style_choices.selected_option IS 'Opção selecionada pelo usuário.';
