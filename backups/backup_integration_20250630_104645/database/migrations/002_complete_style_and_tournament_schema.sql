-- database/migrations/002_complete_style_and_tournament_schema.sql
-- Migração completa para Fases 0 e 1: Sistema de preferências e torneios

BEGIN;

-- =====================================================
-- FASE 0: SISTEMA DE PREFERÊNCIAS DE ESTILO
-- =====================================================

-- Criar tabela de escolhas de estilo (se não existir)
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

-- Criar índices para performance das consultas de estilo
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_category ON style_choices(user_id, category);
CREATE INDEX IF NOT EXISTS idx_style_choices_updated_at ON style_choices(updated_at);

-- =====================================================
-- FASE 1: SISTEMA DE TORNEIOS POR IMAGENS
-- =====================================================

-- Enum para categorias de torneio
DO $$ BEGIN
    CREATE TYPE tournament_category_enum AS ENUM (
        'cores', 
        'estilos', 
        'calcados', 
        'acessorios', 
        'texturas',
        'roupas_casuais',
        'roupas_formais',
        'roupas_festa',
        'joias',
        'bolsas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de sessão de torneio
DO $$ BEGIN
    CREATE TYPE tournament_status_enum AS ENUM (
        'active', 
        'completed', 
        'abandoned',
        'paused'
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
    created_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadados da imagem
    file_size INTEGER, -- em bytes
    image_width INTEGER,
    image_height INTEGER,
    mime_type VARCHAR(50),
    
    -- Estatísticas de uso
    total_views INTEGER DEFAULT 0,
    total_selections INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00, -- porcentagem de vitórias
    
    -- Controle de qualidade
    approved BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- Tabela de sessões de torneio
CREATE TABLE IF NOT EXISTS tournament_sessions (
    id VARCHAR(100) PRIMARY KEY, -- formato: tournament_userId_category_timestamp
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category tournament_category_enum NOT NULL,
    status tournament_status_enum DEFAULT 'active',
    
    -- Progresso do torneio
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER NOT NULL,
    remaining_images INTEGER[] NOT NULL, -- IDs das imagens restantes
    eliminated_images INTEGER[] DEFAULT '{}', -- IDs das imagens eliminadas (ordem de eliminação)
    
    -- Confronto atual
    current_matchup INTEGER[], -- [image_id_1, image_id_2] ou NULL se finalizado
    matchup_start_time TIMESTAMP,
    
    -- Configurações do torneio
    tournament_size INTEGER NOT NULL, -- número inicial de imagens
    allow_skip BOOLEAN DEFAULT false,
    time_limit_per_choice INTEGER, -- em segundos, NULL = sem limite
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    
    -- Metadados
    device_info JSONB, -- informações do dispositivo
    session_data JSONB DEFAULT '{}', -- dados adicionais da sessão
    
    CONSTRAINT valid_current_round CHECK (current_round > 0),
    CONSTRAINT valid_tournament_size CHECK (tournament_size >= 4 AND tournament_size <= 128),
    CONSTRAINT valid_matchup_size CHECK (array_length(current_matchup, 1) IS NULL OR array_length(current_matchup, 1) = 2)
);

-- Tabela de escolhas individuais dentro de torneios
CREATE TABLE IF NOT EXISTS tournament_choices (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL REFERENCES tournament_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    matchup_sequence INTEGER NOT NULL, -- sequência do confronto na rodada
    
    -- Confronto
    option_a_id INTEGER NOT NULL REFERENCES tournament_images(id),
    option_b_id INTEGER NOT NULL REFERENCES tournament_images(id),
    winner_id INTEGER NOT NULL REFERENCES tournament_images(id),
    loser_id INTEGER NOT NULL REFERENCES tournament_images(id),
    
    -- Timing da escolha
    choice_made_at TIMESTAMP DEFAULT NOW(),
    response_time_ms INTEGER, -- tempo para tomar a decisão em milissegundos
    is_speed_bonus BOOLEAN DEFAULT false, -- true se escolha foi rápida (< 3s)
    
    -- Confiança na escolha (1-5, sendo 5 muito confiante)
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    
    -- Metadados da escolha
    choice_context JSONB DEFAULT '{}', -- contexto adicional (localização, horário, etc.)
    
    CONSTRAINT valid_winner CHECK (winner_id = option_a_id OR winner_id = option_b_id),
    CONSTRAINT valid_loser CHECK (loser_id = option_a_id OR loser_id = option_b_id),
    CONSTRAINT different_options CHECK (option_a_id != option_b_id),
    CONSTRAINT winner_loser_different CHECK (winner_id != loser_id)
);

-- Tabela de resultados finais de torneios
CREATE TABLE IF NOT EXISTS tournament_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL REFERENCES tournament_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category tournament_category_enum NOT NULL,
    
    -- Resultado do torneio
    champion_id INTEGER NOT NULL REFERENCES tournament_images(id), -- vencedor absoluto
    finalist_id INTEGER REFERENCES tournament_images(id), -- segundo lugar
    semifinalists INTEGER[] DEFAULT '{}', -- terceiro e quarto lugares
    top_choices INTEGER[] NOT NULL, -- top 8 ou top 16, ordem de preferência
    
    -- Análise de preferências
    preference_strength DECIMAL(3,2) NOT NULL, -- 0.00 a 1.00, força das preferências
    consistency_score DECIMAL(3,2), -- consistência das escolhas
    decision_speed_avg INTEGER, -- tempo médio de decisão em ms
    
    -- Estatísticas da sessão
    total_choices_made INTEGER NOT NULL,
    rounds_completed INTEGER NOT NULL,
    session_duration_minutes INTEGER,
    completion_rate DECIMAL(5,2) DEFAULT 100.00, -- % do torneio completado
    
    -- Insights gerados
    dominant_preferences JSONB, -- preferências identificadas
    style_profile JSONB, -- perfil de estilo gerado
    
    -- Timestamps
    completed_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_preference_strength CHECK (preference_strength >= 0 AND preference_strength <= 1),
    CONSTRAINT valid_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 1),
    CONSTRAINT valid_completion_rate CHECK (completion_rate >= 0 AND completion_rate <= 100)
);

-- Tabela de analytics e métricas de torneios
CREATE TABLE IF NOT EXISTS tournament_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category tournament_category_enum,
    
    -- Métricas de uso
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    abandoned_sessions INTEGER DEFAULT 0,
    average_completion_rate DECIMAL(5,2),
    
    -- Métricas de tempo
    average_session_duration_minutes DECIMAL(8,2),
    average_choice_time_ms INTEGER,
    fastest_completion_minutes DECIMAL(8,2),
    
    -- Métricas de engajamento
    total_choices_made INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    
    -- Métricas de qualidade
    average_confidence_level DECIMAL(3,2),
    high_confidence_choices_percentage DECIMAL(5,2),
    
    -- Dados agregados
    popular_images INTEGER[], -- IDs das imagens mais escolhidas
    unpopular_images INTEGER[], -- IDs das imagens menos escolhidas
    
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(date, category)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para tournament_images
CREATE INDEX IF NOT EXISTS idx_tournament_images_category ON tournament_images(category);
CREATE INDEX IF NOT EXISTS idx_tournament_images_active ON tournament_images(active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_active ON tournament_images(category, active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_win_rate ON tournament_images(win_rate DESC);

-- Índices para tournament_sessions
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_id ON tournament_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_category ON tournament_sessions(category);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_status ON tournament_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_category ON tournament_sessions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_active ON tournament_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_last_activity ON tournament_sessions(last_activity);

-- Índices para tournament_choices
CREATE INDEX IF NOT EXISTS idx_tournament_choices_session_id ON tournament_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_winner_id ON tournament_choices(winner_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_round ON tournament_choices(session_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_timing ON tournament_choices(choice_made_at);

-- Índices para tournament_results
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_category ON tournament_results(category);
CREATE INDEX IF NOT EXISTS idx_tournament_results_champion ON tournament_results(champion_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_completion ON tournament_results(completed_at);

-- Índices para tournament_analytics
CREATE INDEX IF NOT EXISTS idx_tournament_analytics_date ON tournament_analytics(date);
CREATE INDEX IF NOT EXISTS idx_tournament_analytics_category ON tournament_analytics(category);

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

-- Trigger para style_choices
DROP TRIGGER IF EXISTS update_style_choices_updated_at ON style_choices;
CREATE TRIGGER update_style_choices_updated_at
    BEFORE UPDATE ON style_choices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tournament_images
DROP TRIGGER IF EXISTS update_tournament_images_updated_at ON tournament_images;
CREATE TRIGGER update_tournament_images_updated_at
    BEFORE UPDATE ON tournament_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar última atividade da sessão
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
DROP TRIGGER IF EXISTS update_session_activity ON tournament_choices;
CREATE TRIGGER update_session_activity
    AFTER INSERT ON tournament_choices
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_activity();

-- Função para atualizar estatísticas de imagens
CREATE OR REPLACE FUNCTION update_image_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementar total de seleções para a imagem vencedora
    UPDATE tournament_images 
    SET total_selections = total_selections + 1
    WHERE id = NEW.winner_id;
    
    -- Incrementar visualizações para ambas as imagens
    UPDATE tournament_images 
    SET total_views = total_views + 1
    WHERE id IN (NEW.option_a_id, NEW.option_b_id);
    
    -- Recalcular win rate das imagens envolvidas
    WITH image_stats AS (
        SELECT 
            winner_id as image_id,
            COUNT(*) as wins,
            (SELECT COUNT(*) FROM tournament_choices 
             WHERE option_a_id = NEW.winner_id OR option_b_id = NEW.winner_id) as total_appearances
        FROM tournament_choices 
        WHERE winner_id = NEW.winner_id
        GROUP BY winner_id
    )
    UPDATE tournament_images 
    SET win_rate = CASE 
        WHEN image_stats.total_appearances > 0 
        THEN (image_stats.wins::DECIMAL / image_stats.total_appearances) * 100 
        ELSE 0 
    END
    FROM image_stats 
    WHERE tournament_images.id = image_stats.image_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar estatísticas das imagens
DROP TRIGGER IF EXISTS update_image_stats ON tournament_choices;
CREATE TRIGGER update_image_stats
    AFTER INSERT ON tournament_choices
    FOR EACH ROW
    EXECUTE FUNCTION update_image_statistics();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular qualidade do perfil de estilo
CREATE OR REPLACE FUNCTION calculate_style_profile_quality(user_id_param INTEGER)
RETURNS TABLE(
    completion_percentage DECIMAL(5,2),
    category_completeness JSONB,
    overall_quality_score DECIMAL(3,2)
) AS $$
DECLARE
    total_expected INTEGER := 23; -- Total de perguntas esperadas
    total_completed INTEGER;
    category_stats JSONB;
BEGIN
    -- Contar respostas completadas
    SELECT COUNT(*) INTO total_completed
    FROM style_choices
    WHERE user_id = user_id_param;
    
    -- Calcular estatísticas por categoria
    SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
            'completed', count,
            'percentage', ROUND((count::DECIMAL / CASE category 
                WHEN 'cores' THEN 5
                WHEN 'estilos' THEN 5  
                WHEN 'calcados' THEN 3
                WHEN 'acessorios' THEN 3
                WHEN 'texturas' THEN 2
                ELSE 1 END) * 100, 2)
        )
    ) INTO category_stats
    FROM (
        SELECT category, COUNT(*) as count
        FROM style_choices
        WHERE user_id = user_id_param
        GROUP BY category
    ) cat_counts;
    
    RETURN QUERY SELECT
        ROUND((total_completed::DECIMAL / total_expected) * 100, 2) as completion_percentage,
        COALESCE(category_stats, '{}'::jsonb) as category_completeness,
        LEAST(1.0, total_completed::DECIMAL / total_expected) as overall_quality_score;
END;
$$ LANGUAGE plpgsql;

-- Função para obter sessão ativa de torneio
CREATE OR REPLACE FUNCTION get_active_tournament_session(user_id_param INTEGER, category_param tournament_category_enum)
RETURNS TABLE(
    session_id VARCHAR(100),
    current_round INTEGER,
    total_rounds INTEGER,
    remaining_images INTEGER[],
    current_matchup INTEGER[],
    progress_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        ts.id,
        ts.current_round,
        ts.total_rounds,
        ts.remaining_images,
        ts.current_matchup,
        ROUND(((ts.current_round - 1)::DECIMAL / ts.total_rounds) * 100, 2) as progress_percentage
    FROM tournament_sessions ts
    WHERE ts.user_id = user_id_param 
      AND ts.category = category_param 
      AND ts.status = 'active'
    ORDER BY ts.last_activity DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar próximo confronto do torneio
CREATE OR REPLACE FUNCTION generate_next_matchup(session_id_param VARCHAR(100))
RETURNS TABLE(
    image_a_id INTEGER,
    image_b_id INTEGER,
    image_a_url TEXT,
    image_b_url TEXT,
    round_number INTEGER
) AS $$
DECLARE
    session_record RECORD;
    remaining_count INTEGER;
BEGIN
    -- Buscar dados da sessão
    SELECT * INTO session_record
    FROM tournament_sessions
    WHERE id = session_id_param AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Verificar se há imagens suficientes para confronto
    remaining_count := array_length(session_record.remaining_images, 1);
    
    IF remaining_count < 2 THEN
        -- Torneio finalizado
        UPDATE tournament_sessions 
        SET status = 'completed', completed_at = NOW()
        WHERE id = session_id_param;
        RETURN;
    END IF;
    
    -- Gerar confronto com as duas primeiras imagens restantes
    RETURN QUERY
    SELECT 
        session_record.remaining_images[1] as image_a_id,
        session_record.remaining_images[2] as image_b_id,
        ti1.image_url as image_a_url,
        ti2.image_url as image_b_url,
        session_record.current_round as round_number
    FROM tournament_images ti1, tournament_images ti2
    WHERE ti1.id = session_record.remaining_images[1]
      AND ti2.id = session_record.remaining_images[2];
    
    -- Atualizar sessão com novo confronto
    UPDATE tournament_sessions
    SET 
        current_matchup = ARRAY[session_record.remaining_images[1], session_record.remaining_images[2]],
        matchup_start_time = NOW(),
        last_activity = NOW()
    WHERE id = session_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS INICIAIS (SEEDS)
-- =====================================================

-- Inserir categorias de imagens básicas (apenas se não existirem)
INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, active, approved) 
VALUES 
    -- Cores
    ('cores', 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Vermelho+Quente', 'https://via.placeholder.com/150x150/FF6B6B', 'Tons Quentes', 'Paleta de cores quentes e vibrantes', true, true),
    ('cores', 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Azul+Frio', 'https://via.placeholder.com/150x150/4ECDC4', 'Tons Frios', 'Paleta de cores frias e calmantes', true, true),
    ('cores', 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Azul+Oceano', 'https://via.placeholder.com/150x150/45B7D1', 'Azul Oceano', 'Tons de azul profundo', true, true),
    ('cores', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Amarelo+Solar', 'https://via.placeholder.com/150x150/F39C12', 'Amarelo Solar', 'Tons dourados e ensolarados', true, true),
    
    -- Estilos
    ('estilos', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Casual+Moderno', 'https://via.placeholder.com/150x150/2C3E50', 'Casual Moderno', 'Estilo casual contemporâneo', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Elegante+Formal', 'https://via.placeholder.com/150x150/8E44AD', 'Elegante Formal', 'Estilo formal e sofisticado', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Boho+Chic', 'https://via.placeholder.com/150x150/E67E22', 'Boho Chic', 'Estilo bohemio e descontraído', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Minimalista', 'https://via.placeholder.com/150x150/27AE60', 'Minimalista', 'Estilo limpo e minimalista', true, true)
ON CONFLICT DO NOTHING;

COMMIT;