-- scripts/fix/001_create_users_tables.sql - Criação das tabelas de usuários e perfis
-- Arquivo: scripts/fix/001_create_users_tables.sql

-- =====================================================
-- CRIAÇÃO DAS TABELAS PRINCIPAIS - PARTE 1
-- =====================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    city VARCHAR(255),
    gender VARCHAR(20) DEFAULT 'other',
    avatar_url VARCHAR(500),
    bio TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    age INTEGER,
    style_completion_percentage INTEGER DEFAULT 0,
    interests TEXT[],
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    style_game_level INTEGER DEFAULT 1,
    style_game_xp INTEGER DEFAULT 0,
    last_style_game_played_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_age ON user_profiles(age);

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE user_profiles IS 'Tabela de perfis estendidos dos usuários';
COMMENT ON COLUMN user_profiles.interests IS 'Array de interesses do usuário';
COMMENT ON COLUMN user_profiles.style_completion_percentage IS 'Percentual de completude do perfil de estilo (0-100)';
COMMENT ON COLUMN user_profiles.style_game_level IS 'Nível do usuário no jogo de estilo';
COMMENT ON COLUMN user_profiles.style_game_xp IS 'Pontos de experiência no jogo de estilo';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificação se as tabelas foram criadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Tabela users criada com sucesso';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'Tabela user_profiles criada com sucesso';
    END IF;
END $$;