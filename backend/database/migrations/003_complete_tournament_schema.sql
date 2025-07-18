-- database/migrations/003_complete_tournament_schema.sql - Schema completo Fase 1
-- Sistema de Torneios 2x2 - Tabelas principais

-- Enum para status de torneios
DO $$ BEGIN
    CREATE TYPE tournament_status_enum AS ENUM (
        'active', 'paused', 'completed', 'cancelled', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para categorias de torneios
DO $$ BEGIN
    CREATE TYPE tournament_category_enum AS ENUM (
        'colors', 'styles', 'accessories', 'shoes', 'patterns',
        'casual_wear', 'formal_wear', 'party_wear', 'jewelry', 'bags'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
    
    -- Metadados
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    mime_type VARCHAR(50),
    
    -- Estatísticas
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
    
    -- Progresso
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER NOT NULL,
    remaining_images INTEGER[] NOT NULL,
    eliminated_images INTEGER[] DEFAULT '{}',
    current_matchup INTEGER[],
    
    -- Metadados
    tournament_size INTEGER DEFAULT 16,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW(),
    
    -- Configurações
    time_limit INTEGER DEFAULT 30, -- segundos por escolha
    allow_skip BOOLEAN DEFAULT false
);

-- Tabela de escolhas individuais
CREATE TABLE IF NOT EXISTS tournament_choices (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES tournament_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    image_a_id INTEGER REFERENCES tournament_images(id),
    image_b_id INTEGER REFERENCES tournament_images(id),
    winner_id INTEGER REFERENCES tournament_images(id),
    choice_time TIMESTAMP DEFAULT NOW(),
    response_time_ms INTEGER, -- tempo de resposta em ms
    user_confidence INTEGER CHECK (user_confidence >= 1 AND user_confidence <= 5)
);

-- Tabela de resultados finais
CREATE TABLE IF NOT EXISTS tournament_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(100) REFERENCES tournament_sessions(id),
    category tournament_category_enum,
    
    -- Resultados
    champion_id INTEGER REFERENCES tournament_images(id),
    finalist_id INTEGER REFERENCES tournament_images(id),
    top_4 INTEGER[],
    top_8 INTEGER[],
    
    -- Analytics
    total_choices INTEGER,
    avg_response_time_ms INTEGER,
    preference_strength DECIMAL(3,2), -- 0.00 a 1.00
    dominant_tags TEXT[],
    
    -- Timestamps
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_active ON tournament_images(category, active, approved);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_status ON tournament_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_session ON tournament_choices(session_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_category ON tournament_results(user_id, category);

-- Triggers para estatísticas
CREATE OR REPLACE FUNCTION update_image_stats() RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas da imagem vencedora
    UPDATE tournament_images 
    SET total_selections = total_selections + 1,
        win_rate = (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE winner_id = NEW.winner_id) * 100.0) / 
                NULLIF(COUNT(*), 0), 2
            )
            FROM tournament_choices 
            WHERE winner_id = NEW.winner_id OR image_a_id = NEW.winner_id OR image_b_id = NEW.winner_id
        )
    WHERE id = NEW.winner_id;
    
    -- Atualizar views para ambas as imagens
    UPDATE tournament_images 
    SET total_views = total_views + 1
    WHERE id IN (NEW.image_a_id, NEW.image_b_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_stats
    AFTER INSERT ON tournament_choices
    FOR EACH ROW EXECUTE FUNCTION update_image_stats();

