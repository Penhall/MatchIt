-- database/migrations/001_initial_schema.sql - Schema inicial do banco de dados MatchIt

-- =====================================================
-- CONFIGURAÇÕES INICIAIS
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA DE USUÁRIOS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Configurações do usuário
    language VARCHAR(10) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Status e verificação
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    
    -- Estatísticas do usuário
    tournaments_created INTEGER DEFAULT 0,
    tournaments_joined INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    
    -- Reset de senha
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =====================================================
-- TABELA DE CATEGORIAS DE TORNEIO
-- =====================================================

CREATE TABLE tournament_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji ou nome do ícone
    color VARCHAR(7), -- hex color code
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categorias padrão
INSERT INTO tournament_categories (name, description, icon, color) VALUES
('Esports', 'Torneios de jogos eletrônicos', '🎮', '#FF6B6B'),
('Esportes', 'Competições esportivas tradicionais', '⚽', '#4ECDC4'),
('Jogos de Mesa', 'Xadrez, poker, board games', '♟️', '#45B7D1'),
('Quiz', 'Competições de conhecimento', '🧠', '#96CEB4'),
('Criativo', 'Arte, música, escrita', '🎨', '#FECA57'),
('Outros', 'Outras modalidades', '🏆', '#A0A0A0');

-- =====================================================
-- TABELA DE TORNEIOS
-- =====================================================

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES tournament_categories(id),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Configurações do torneio
    format VARCHAR(50) NOT NULL DEFAULT 'single-elimination', -- single-elimination, double-elimination, round-robin, swiss
    max_participants INTEGER NOT NULL DEFAULT 16,
    min_participants INTEGER NOT NULL DEFAULT 2,
    entry_fee DECIMAL(10,2) DEFAULT 0.00,
    prize_pool DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status e datas
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, registration, ongoing, completed, cancelled
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    tournament_start TIMESTAMP,
    tournament_end TIMESTAMP,
    
    -- Configurações avançadas
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    allow_late_registration BOOLEAN DEFAULT false,
    auto_advance BOOLEAN DEFAULT false,
    seeding_method VARCHAR(50) DEFAULT 'random', -- random, manual, ranking
    
    -- Regras específicas
    match_format TEXT, -- JSON com regras específicas do formato
    scoring_system VARCHAR(50) DEFAULT 'win-loss', -- win-loss, points, custom
    tie_breaker_rules TEXT, -- JSON com regras de desempate
    
    -- Configurações de privacidade
    visibility VARCHAR(50) DEFAULT 'public', -- public, private, unlisted
    join_password VARCHAR(255),
    
    -- Metadados
    banner_url TEXT,
    rules TEXT,
    location VARCHAR(255),
    tags TEXT[], -- array de tags para busca
    
    -- Estatísticas
    current_participants INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    completed_matches INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_tournaments_category ON tournaments(category_id);
CREATE INDEX idx_tournaments_public ON tournaments(is_public);
CREATE INDEX idx_tournaments_start_date ON tournaments(tournament_start);
CREATE INDEX idx_tournaments_tags ON tournaments USING GIN(tags);

-- =====================================================
-- TABELA DE PARTICIPANTES
-- =====================================================

CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status da participação
    status VARCHAR(50) NOT NULL DEFAULT 'registered', -- registered, confirmed, eliminated, withdrawn, disqualified
    seed INTEGER, -- posição no chaveamento
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Dados específicos do participante
    display_name VARCHAR(100), -- nome para exibir no torneio (pode ser diferente do username)
    team_name VARCHAR(100), -- para torneios em equipe
    notes TEXT, -- notas do organizador sobre o participante
    
    -- Estatísticas no torneio
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    points_scored INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    final_position INTEGER, -- posição final no torneio
    
    -- Aprovação (se necessária)
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar participação duplicada
    UNIQUE(tournament_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_participants_user ON tournament_participants(user_id);
CREATE INDEX idx_participants_status ON tournament_participants(status);
CREATE INDEX idx_participants_seed ON tournament_participants(seed);

-- =====================================================
-- TABELA DE PARTIDAS
-- =====================================================

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Identificação da partida
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL, -- número da partida dentro da rodada
    bracket_position INTEGER, -- posição no bracket (para eliminatórias)
    
    -- Participantes
    participant1_id UUID REFERENCES tournament_participants(id),
    participant2_id UUID REFERENCES tournament_participants(id),
    winner_id UUID REFERENCES tournament_participants(id),
    
    -- Status e resultado
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in-progress, completed, cancelled, no-show
    result_type VARCHAR(50), -- normal, walkover, forfeit, disqualification
    
    -- Placar
    score1 INTEGER DEFAULT 0,
    score2 INTEGER DEFAULT 0,
    detailed_score JSONB, -- para esportes com sets, games, etc.
    
    -- Datas e horários
    scheduled_start TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Informações adicionais
    location VARCHAR(255),
    referee_id UUID REFERENCES users(id),
    notes TEXT,
    video_url TEXT,
    livestream_url TEXT,
    
    -- Dados específicos do jogo
    game_data JSONB, -- dados específicos do tipo de jogo/esporte
    statistics JSONB, -- estatísticas detalhadas da partida
    
    -- Metadados
    created_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_round ON matches(round_number);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_participants ON matches(participant1_id, participant2_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_start);

-- =====================================================
-- TABELA DE SESSÕES DE USUÁRIO
-- =====================================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- Informações da sessão
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(100),
    
    -- Validade
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_sessions_active ON user_sessions(is_active);

-- =====================================================
-- TABELA DE CONVITES
-- =====================================================

CREATE TABLE tournament_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id),
    invited_user_id UUID REFERENCES users(id), -- NULL se convite por email
    invited_email VARCHAR(255),
    
    -- Status do convite
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
    invite_token VARCHAR(255) UNIQUE,
    message TEXT,
    
    -- Validade
    expires_at TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: deve ter user_id OU email
    CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

-- Índices para performance
CREATE INDEX idx_invites_tournament ON tournament_invites(tournament_id);
CREATE INDEX idx_invites_user ON tournament_invites(invited_user_id);
CREATE INDEX idx_invites_email ON tournament_invites(invited_email);
CREATE INDEX idx_invites_token ON tournament_invites(invite_token);
CREATE INDEX idx_invites_status ON tournament_invites(status);

-- =====================================================
-- TABELA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conteúdo da notificação
    type VARCHAR(50) NOT NULL, -- tournament_invite, match_scheduled, tournament_started, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Dados relacionados
    related_tournament_id UUID REFERENCES tournaments(id),
    related_match_id UUID REFERENCES matches(id),
    related_user_id UUID REFERENCES users(id),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false, -- para notificações push/email
    
    -- Metadados
    action_url TEXT, -- URL para ação relacionada
    data JSONB, -- dados adicionais em JSON
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas que têm updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_categories_updated_at BEFORE UPDATE ON tournament_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_participants_updated_at BEFORE UPDATE ON tournament_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_invites_updated_at BEFORE UPDATE ON tournament_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGERS PARA ESTATÍSTICAS AUTOMÁTICAS
-- =====================================================

-- Função para atualizar contadores de participantes
CREATE OR REPLACE FUNCTION update_tournament_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tournaments 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM tournament_participants 
            WHERE tournament_id = NEW.tournament_id 
            AND status IN ('registered', 'confirmed')
        )
        WHERE id = NEW.tournament_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE tournaments 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM tournament_participants 
            WHERE tournament_id = NEW.tournament_id 
            AND status IN ('registered', 'confirmed')
        )
        WHERE id = NEW.tournament_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tournaments 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM tournament_participants 
            WHERE tournament_id = OLD.tournament_id 
            AND status IN ('registered', 'confirmed')
        )
        WHERE id = OLD.tournament_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Aplicar trigger
CREATE TRIGGER update_tournament_participants_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tournament_participants
    FOR EACH ROW EXECUTE FUNCTION update_tournament_participants_count();

-- Função para atualizar estatísticas de usuários
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Atualizar estatísticas para ambos os participantes se a partida foi completada
        IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
            -- Atualizar vencedor
            UPDATE users SET 
                total_matches = total_matches + 1,
                total_wins = total_wins + 1
            WHERE id = (SELECT user_id FROM tournament_participants WHERE id = NEW.winner_id);
            
            -- Atualizar perdedor
            UPDATE users SET 
                total_matches = total_matches + 1,
                total_losses = total_losses + 1
            WHERE id = (
                SELECT user_id FROM tournament_participants 
                WHERE id = CASE 
                    WHEN NEW.participant1_id = NEW.winner_id THEN NEW.participant2_id 
                    ELSE NEW.participant1_id 
                END
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Aplicar trigger
CREATE TRIGGER update_user_statistics_trigger
    AFTER INSERT OR UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_user_statistics();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para ranking de usuários
CREATE VIEW user_rankings AS
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.avatar_url,
    u.tournaments_created,
    u.tournaments_joined,
    u.total_matches,
    u.total_wins,
    u.total_losses,
    CASE 
        WHEN u.total_matches > 0 THEN 
            ROUND((u.total_wins::FLOAT / u.total_matches::FLOAT) * 100, 2)
        ELSE 0 
    END as win_percentage,
    DENSE_RANK() OVER (ORDER BY u.total_wins DESC, u.total_matches DESC) as rank
FROM users u
WHERE u.is_active = true
ORDER BY rank;

-- View para torneios ativos
CREATE VIEW active_tournaments AS
SELECT 
    t.*,
    tc.name as category_name,
    tc.icon as category_icon,
    tc.color as category_color,
    u.username as creator_username,
    u.first_name as creator_first_name,
    u.last_name as creator_last_name
FROM tournaments t
JOIN tournament_categories tc ON t.category_id = tc.id
JOIN users u ON t.created_by = u.id
WHERE t.status IN ('registration', 'ongoing')
ORDER BY t.tournament_start;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE tournaments IS 'Tabela de torneios criados pelos usuários';
COMMENT ON TABLE tournament_participants IS 'Participantes de cada torneio';
COMMENT ON TABLE matches IS 'Partidas individuais dentro dos torneios';
COMMENT ON TABLE tournament_categories IS 'Categorias de torneios (Esports, Esportes, etc.)';
COMMENT ON TABLE user_sessions IS 'Sessões ativas de usuários para autenticação';
COMMENT ON TABLE tournament_invites IS 'Convites para participar de torneios';
COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Schema inicial criado com sucesso! % tabelas criadas.', table_count;
END $$;