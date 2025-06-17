-- =====================================================
-- MIGRATION 000: SCHEMA INICIAL DO SISTEMA
-- =====================================================
-- Versão: 1.0.0
-- Autor: Sistema MatchIt
-- Data: 2025-06-16
-- Descrição: Criação das tabelas base do sistema

-- Extensão para UUID (caso não exista)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: users
-- Usuários do sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender VARCHAR(20),
    profile_picture_url VARCHAR(255),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABELA: matches
-- Matches entre usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    unmatch_reason VARCHAR(100),
    unmatch_initiator UUID REFERENCES users(id),
    unmatch_at TIMESTAMP WITH TIME ZONE,
    
    CHECK (user1_id != user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at);

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema MatchIt';
COMMENT ON TABLE matches IS 'Tabela de matches entre usuários';