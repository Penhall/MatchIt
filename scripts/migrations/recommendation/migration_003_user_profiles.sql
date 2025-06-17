-- =====================================================
-- MIGRATION 003: TABELA USER_PROFILES
-- =====================================================
-- Versão: 1.0.0
-- Autor: Sistema MatchIt
-- Data: 2025-06-16
-- Descrição: Cria tabela de perfis de usuário com dados de estilo

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(255),
    style_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Tabela de perfis estendidos dos usuários';
COMMENT ON COLUMN user_profiles.style_data IS 'Dados de estilo e preferências do usuário em formato JSON';