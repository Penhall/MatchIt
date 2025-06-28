-- database/migrations/004_definitive_phase2_schema.sql
-- Schema definitivo e consolidado para Fase 2 - Sistema de Torneios MatchIt

BEGIN;

-- =====================================================
-- TABELA USERS (Base)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    date_of_birth DATE,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FASE 0: SISTEMA DE PREFERÊNCIAS DE ESTILO
-- =====================================================

CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- =====================================================
-- FASE 2: SISTEMA DE TORNEIOS - ENUMS
-- =====================================================

-- Enum para categorias de torneio (nomes em português para compatibilidade)
DO $$ BEGIN
    CREATE TYPE tournament_category_enum AS ENUM (
        'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
        'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de torneio
DO $$ BEGIN
    CREATE TYPE tournament_status_enum AS ENUM (
        'active', 'paused', 'completed', 'cancelled', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- FASE 2: TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de imagens para torneios
CREATE TABLE IF NOT EXISTS tournament_images (
    id SERIAL PRIMARY KEY,
    category tournament_category_enum NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(100),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    approved BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadados da imagem
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    mime_type VARCHAR(50),
    
    -- Estatísticas de uso
    total_views INTEGER DEFAULT 0,
    total_selections INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- Tabela de sessões de torneio
CREATE TABLE IF NOT EXISTS tournament_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category tournament_category_enum NOT NULL,
    status tournament_status_enum DEFAULT 'active',
    
    -- Progresso do torneio
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER NOT NULL,
    remaining_images INTEGER[] NOT NULL,
    eliminated_images INTEGER[] DEFAULT '{}',
    current_matchup INTEGER[],
    
    -- Configurações e timing
    tournament_size INTEGER DEFAULT 16,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW(),
    
    -- Metadados
    time_limit INTEGER DEFAULT 30,
    allow_skip BOOLEAN DEFAULT false
);

-- Tabela de escolhas individuais
CREATE TABLE IF NOT EXISTS tournament_choices (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL REFERENCES tournament_sessions(id) ON DELETE CASCADE,
    winner_id INTEGER NOT NULL REFERENCES tournament_images(id),
    loser_id INTEGER REFERENCES tournament_images(id),
    response_time_ms INTEGER NOT NULL,
    round_number INTEGER,
    matchup_sequence INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_response_time CHECK (response_time_ms > 0)
);

-- Tabela de resultados finais
CREATE TABLE IF NOT EXISTS tournament_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE REFERENCES tournament_sessions(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    category tournament_category_enum NOT NULL,
    
    -- Resultados principais
    champion_id INTEGER REFERENCES tournament_images(id),
    finalist_id INTEGER REFERENCES tournament_images(id),
    semifinalists INTEGER[],
    top_choices INTEGER[],
    
    -- Métricas de performance
    preference_strength INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    decision_speed_avg INTEGER DEFAULT 0,
    total_choices_made INTEGER DEFAULT 0,
    rounds_completed INTEGER DEFAULT 0,
    session_duration_minutes DECIMAL(8,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Análise de estilo (JSON)
    style_profile JSONB,
    dominant_preferences JSONB,
    insights TEXT[],
    recommendations TEXT[],
    
    completed_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints de validação
    CONSTRAINT valid_preference_strength CHECK (preference_strength >= 0 AND preference_strength <= 100),
    CONSTRAINT valid_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 100),
    CONSTRAINT valid_completion_rate CHECK (completion_rate >= 0 AND completion_rate <= 100)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para style_choices
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_updated_at ON style_choices(updated_at);

-- Índices para tournament_images
CREATE INDEX IF NOT EXISTS idx_tournament_images_category ON tournament_images(category);
CREATE INDEX IF NOT EXISTS idx_tournament_images_active ON tournament_images(active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_active_approved ON tournament_images(category, active, approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_win_rate ON tournament_images(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_images_upload_date ON tournament_images(upload_date DESC);

-- Índices para tournament_sessions
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_id ON tournament_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_category ON tournament_sessions(category);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_status ON tournament_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_status ON tournament_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_last_activity ON tournament_sessions(last_activity);

-- Índices para tournament_choices
CREATE INDEX IF NOT EXISTS idx_tournament_choices_session_id ON tournament_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_winner_id ON tournament_choices(winner_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_created_at ON tournament_choices(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_round ON tournament_choices(session_id, round_number);

-- Índices para tournament_results
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_category ON tournament_results(category);
CREATE INDEX IF NOT EXISTS idx_tournament_results_champion ON tournament_results(champion_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_completed_at ON tournament_results(completed_at);

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_choices_updated_at BEFORE UPDATE ON style_choices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_images_updated_at BEFORE UPDATE ON tournament_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar atividade da sessão
CREATE OR REPLACE FUNCTION update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tournament_sessions 
    SET last_activity = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar atividade quando nova escolha é feita
CREATE TRIGGER update_session_activity
    AFTER INSERT ON tournament_choices
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_activity();

COMMIT;
