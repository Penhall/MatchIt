-- database/migrations/003_tournament_schema_fix.sql - Migração corrigida apenas para sistema de torneios

BEGIN;

-- =====================================================
-- CRIAÇÃO DE ENUMS PARA TORNEIOS
-- =====================================================

-- Enum para categorias de torneio
DO $$ 
BEGIN
    CREATE TYPE tournament_category_enum AS ENUM (
        'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
        'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de torneio
DO $$ 
BEGIN
    CREATE TYPE tournament_status_enum AS ENUM (
        'active', 'completed', 'abandoned', 'paused'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA DE IMAGENS PARA TORNEIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS tournament_images (
    id SERIAL PRIMARY KEY,
    category tournament_category_enum NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(100),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_by INTEGER,
    upload_date TIMESTAMP DEFAULT NOW(),
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
    
    -- Controle de qualidade
    approved BOOLEAN DEFAULT false,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- =====================================================
-- TABELA DE SESSÕES DE TORNEIO
-- =====================================================

CREATE TABLE IF NOT EXISTS tournament_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category tournament_category_enum NOT NULL,
    status tournament_status_enum DEFAULT 'active',
    
    -- Progresso do torneio
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER NOT NULL,
    remaining_images INTEGER[] NOT NULL,
    eliminated_images INTEGER[] DEFAULT '{}',
    
    -- Confronto atual
    current_matchup INTEGER[],
    matchup_start_time TIMESTAMP,
    
    -- Configurações do torneio
    tournament_size INTEGER NOT NULL,
    allow_skip BOOLEAN DEFAULT false,
    time_limit_per_choice INTEGER,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    
    -- Metadados
    device_info JSONB,
    session_data JSONB DEFAULT '{}',
    
    CONSTRAINT valid_current_round CHECK (current_round > 0),
    CONSTRAINT valid_tournament_size CHECK (tournament_size >= 4 AND tournament_size <= 128),
    CONSTRAINT valid_matchup_size CHECK (array_length(current_matchup, 1) IS NULL OR array_length(current_matchup, 1) = 2)
);

-- =====================================================
-- TABELA DE ESCOLHAS INDIVIDUAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS tournament_choices (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    round_number INTEGER NOT NULL,
    matchup_sequence INTEGER NOT NULL,
    
    -- Confronto
    option_a_id INTEGER NOT NULL,
    option_b_id INTEGER NOT NULL,
    winner_id INTEGER NOT NULL,
    loser_id INTEGER NOT NULL,
    
    -- Timing da escolha
    choice_made_at TIMESTAMP DEFAULT NOW(),
    response_time_ms INTEGER,
    is_speed_bonus BOOLEAN DEFAULT false,
    
    -- Confiança na escolha (1-5, sendo 5 muito confiante)
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    
    -- Metadados da escolha
    choice_context JSONB DEFAULT '{}',
    
    CONSTRAINT valid_round_number CHECK (round_number > 0),
    CONSTRAINT valid_matchup_sequence CHECK (matchup_sequence > 0),
    CONSTRAINT valid_response_time CHECK (response_time_ms IS NULL OR response_time_ms > 0)
);

-- =====================================================
-- TABELA DE RESULTADOS FINAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS tournament_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    category tournament_category_enum NOT NULL,
    
    -- Resultados principais
    champion_id INTEGER,
    finalist_id INTEGER,
    semifinalists INTEGER[],
    top_choices INTEGER[],
    elimination_order INTEGER[],
    
    -- Métricas de performance
    preference_strength DECIMAL(3,2),
    consistency_score DECIMAL(3,2),
    decision_speed_avg DECIMAL(8,2),
    total_choices_made INTEGER,
    rounds_completed INTEGER,
    session_duration_minutes DECIMAL(8,2),
    completion_rate DECIMAL(5,2),
    
    -- Análise de estilo
    style_profile JSONB,
    dominant_preferences JSONB,
    
    completed_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_preference_strength CHECK (preference_strength >= 0 AND preference_strength <= 1),
    CONSTRAINT valid_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 1),
    CONSTRAINT valid_completion_rate CHECK (completion_rate >= 0 AND completion_rate <= 100)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tournament_images_category ON tournament_images(category);
CREATE INDEX IF NOT EXISTS idx_tournament_images_active ON tournament_images(active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_active ON tournament_images(category, active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_id ON tournament_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_category ON tournament_sessions(category);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_status ON tournament_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_session_id ON tournament_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);

-- =====================================================
-- INSERIR DADOS DE TESTE
-- =====================================================

INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, active, approved) 
VALUES 
    ('cores', 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Vermelho', 'https://via.placeholder.com/150x150/FF6B6B', 'Vermelho Vibrante', 'Tom vermelho quente e energético', true, true),
    ('cores', 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Verde', 'https://via.placeholder.com/150x150/4ECDC4', 'Verde Menta', 'Tom verde refrescante e natural', true, true),
    ('cores', 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Azul', 'https://via.placeholder.com/150x150/45B7D1', 'Azul Oceano', 'Tom azul profundo e calmo', true, true),
    ('cores', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Amarelo', 'https://via.placeholder.com/150x150/F39C12', 'Amarelo Solar', 'Tom amarelo brilhante e alegre', true, true),
    ('cores', 'https://via.placeholder.com/400x400/9B59B6/FFFFFF?text=Roxo', 'https://via.placeholder.com/150x150/9B59B6', 'Roxo Real', 'Tom roxo elegante e místico', true, true),
    ('cores', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Laranja', 'https://via.placeholder.com/150x150/E67E22', 'Laranja Sunset', 'Tom laranja caloroso', true, true),
    ('cores', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Azul+Dark', 'https://via.placeholder.com/150x150/2C3E50', 'Azul Escuro', 'Tom azul profissional', true, true),
    ('cores', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Verde+Dark', 'https://via.placeholder.com/150x150/27AE60', 'Verde Floresta', 'Tom verde natural e terroso', true, true),
    ('cores', 'https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=Vermelho+Dark', 'https://via.placeholder.com/150x150/E74C3C', 'Vermelho Intenso', 'Tom vermelho forte e decidido', true, true),
    ('cores', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Violeta', 'https://via.placeholder.com/150x150/8E44AD', 'Violeta Místico', 'Tom violeta profundo e criativo', true, true),
    ('cores', 'https://via.placeholder.com/400x400/F1C40F/FFFFFF?text=Dourado', 'https://via.placeholder.com/150x150/F1C40F', 'Dourado Luxo', 'Tom dourado brilhante e luxuoso', true, true),
    ('cores', 'https://via.placeholder.com/400x400/95A5A6/FFFFFF?text=Cinza', 'https://via.placeholder.com/150x150/95A5A6', 'Cinza Moderno', 'Tom cinza neutro e versátil', true, true),
    ('cores', 'https://via.placeholder.com/400x400/34495E/FFFFFF?text=Chumbo', 'https://via.placeholder.com/150x150/34495E', 'Chumbo Elegante', 'Tom cinza escuro sofisticado', true, true),
    ('cores', 'https://via.placeholder.com/400x400/16A085/FFFFFF?text=Turquesa', 'https://via.placeholder.com/150x150/16A085', 'Turquesa Tropical', 'Tom turquesa vibrante e fresco', true, true),
    ('cores', 'https://via.placeholder.com/400x400/D35400/FFFFFF?text=Terracota', 'https://via.placeholder.com/150x150/D35400', 'Terracota Natural', 'Tom terracota terroso e acolhedor', true, true),
    ('cores', 'https://via.placeholder.com/400x400/C0392B/FFFFFF?text=Borgonha', 'https://via.placeholder.com/150x150/C0392B', 'Borgonha Sofisticado', 'Tom borgonha elegante e refinado', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Casual', 'https://via.placeholder.com/150x150/2C3E50', 'Casual Moderno', 'Estilo casual contemporâneo e confortável', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Formal', 'https://via.placeholder.com/150x150/8E44AD', 'Formal Elegante', 'Estilo formal sofisticado e clássico', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Boho', 'https://via.placeholder.com/150x150/E67E22', 'Boho Chic', 'Estilo bohemio livre e criativo', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Minimal', 'https://via.placeholder.com/150x150/27AE60', 'Minimalista', 'Estilo limpo, simples e funcional', true, true)
ON CONFLICT DO NOTHING;

COMMIT;
