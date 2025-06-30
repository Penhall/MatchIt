-- database/migrations/002_tournament_schema.sql - Schema avançado para sistema de torneios

-- =====================================================
-- EXTENSÕES ADICIONAIS
-- =====================================================

-- Verificar se todas as dependências estão disponíveis
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION "pgcrypto";
    END IF;
END $$;

-- =====================================================
-- TABELA DE FASES DE TORNEIO
-- =====================================================

CREATE TABLE tournament_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Identificação da fase
    name VARCHAR(100) NOT NULL,
    description TEXT,
    phase_order INTEGER NOT NULL, -- ordem das fases (1, 2, 3...)
    phase_type VARCHAR(50) NOT NULL, -- group, elimination, final
    
    -- Configurações da fase
    format VARCHAR(50) NOT NULL, -- single-elimination, double-elimination, round-robin, swiss
    max_participants INTEGER,
    min_participants INTEGER,
    advancement_count INTEGER, -- quantos avançam para próxima fase
    
    -- Status da fase
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Configurações específicas
    config JSONB, -- configurações específicas da fase
    seeding_rules JSONB, -- regras de seed específicas
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_phases_tournament ON tournament_phases(tournament_id);
CREATE INDEX idx_tournament_phases_order ON tournament_phases(tournament_id, phase_order);
CREATE INDEX idx_tournament_phases_status ON tournament_phases(status);

-- =====================================================
-- TABELA DE GRUPOS (PARA FASES DE GRUPO)
-- =====================================================

CREATE TABLE tournament_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Identificação do grupo
    name VARCHAR(50) NOT NULL, -- Grupo A, Grupo B, etc.
    display_order INTEGER NOT NULL,
    
    -- Configurações do grupo
    max_participants INTEGER DEFAULT 4,
    rounds_completed INTEGER DEFAULT 0,
    total_rounds INTEGER,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, completed
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_groups_phase ON tournament_groups(phase_id);
CREATE INDEX idx_tournament_groups_tournament ON tournament_groups(tournament_id);
CREATE INDEX idx_tournament_groups_order ON tournament_groups(phase_id, display_order);

-- =====================================================
-- TABELA DE PARTICIPANTES POR FASE
-- =====================================================

CREATE TABLE phase_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
    group_id UUID REFERENCES tournament_groups(id) ON DELETE SET NULL,
    
    -- Posicionamento na fase
    seed INTEGER,
    bracket_position INTEGER,
    
    -- Status na fase
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, eliminated, advanced, withdrawn
    elimination_round INTEGER, -- rodada em que foi eliminado
    final_position INTEGER, -- posição final na fase
    
    -- Estatísticas da fase
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    matches_drawn INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0, -- pontos acumulados na fase
    goals_for INTEGER DEFAULT 0, -- ou pontos marcados
    goals_against INTEGER DEFAULT 0, -- ou pontos sofridos
    goal_difference INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar duplicação
    UNIQUE(phase_id, participant_id)
);

-- Índices
CREATE INDEX idx_phase_participants_phase ON phase_participants(phase_id);
CREATE INDEX idx_phase_participants_participant ON phase_participants(participant_id);
CREATE INDEX idx_phase_participants_group ON phase_participants(group_id);
CREATE INDEX idx_phase_participants_seed ON phase_participants(phase_id, seed);
CREATE INDEX idx_phase_participants_status ON phase_participants(status);

-- =====================================================
-- MELHORIAS NA TABELA DE PARTIDAS
-- =====================================================

-- Adicionar colunas para fases e grupos
ALTER TABLE matches ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES tournament_phases(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES tournament_groups(id);

-- Adicionar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(group_id);

-- =====================================================
-- TABELA DE CHAVEAMENTO
-- =====================================================

CREATE TABLE tournament_brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
    
    -- Estrutura do chaveamento
    bracket_type VARCHAR(50) NOT NULL, -- single, double, round-robin
    bracket_data JSONB NOT NULL, -- estrutura completa do chaveamento
    
    -- Metadados
    total_rounds INTEGER NOT NULL,
    current_round INTEGER DEFAULT 1,
    is_generated BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_brackets_tournament ON tournament_brackets(tournament_id);
CREATE INDEX idx_tournament_brackets_phase ON tournament_brackets(phase_id);

-- =====================================================
-- TABELA DE RANKINGS
-- =====================================================

CREATE TABLE tournament_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES tournament_phases(id) ON DELETE CASCADE,
    group_id UUID REFERENCES tournament_groups(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
    
    -- Posicionamento
    position INTEGER NOT NULL,
    previous_position INTEGER,
    
    -- Estatísticas para ranking
    points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    matches_drawn INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    
    -- Dados de desempate
    head_to_head_points INTEGER DEFAULT 0,
    disciplinary_points INTEGER DEFAULT 0, -- pontos disciplinares (cartões, etc.)
    
    -- Metadados
    ranking_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, group, phase
    is_final BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_rankings_tournament ON tournament_rankings(tournament_id);
CREATE INDEX idx_tournament_rankings_phase ON tournament_rankings(phase_id);
CREATE INDEX idx_tournament_rankings_group ON tournament_rankings(group_id);
CREATE INDEX idx_tournament_rankings_participant ON tournament_rankings(participant_id);
CREATE INDEX idx_tournament_rankings_position ON tournament_rankings(tournament_id, position);

-- =====================================================
-- TABELA DE REGRAS DE TORNEIO
-- =====================================================

CREATE TABLE tournament_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Tipo de regra
    rule_type VARCHAR(50) NOT NULL, -- scoring, advancement, tiebreaker, disciplinary
    rule_name VARCHAR(100) NOT NULL,
    rule_description TEXT,
    
    -- Configuração da regra
    rule_config JSONB NOT NULL, -- configuração específica da regra
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- prioridade para aplicação
    
    -- Aplicação
    applies_to VARCHAR(50) DEFAULT 'all', -- all, phase, group
    phase_id UUID REFERENCES tournament_phases(id),
    group_id UUID REFERENCES tournament_groups(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_rules_tournament ON tournament_rules(tournament_id);
CREATE INDEX idx_tournament_rules_type ON tournament_rules(rule_type);
CREATE INDEX idx_tournament_rules_active ON tournament_rules(is_active);

-- =====================================================
-- TABELA DE HISTÓRICO DE MUDANÇAS
-- =====================================================

CREATE TABLE tournament_changes_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Tipo de mudança
    change_type VARCHAR(50) NOT NULL, -- participant_added, match_result, status_change, etc.
    entity_type VARCHAR(50) NOT NULL, -- tournament, match, participant, phase
    entity_id UUID,
    
    -- Dados da mudança
    old_data JSONB,
    new_data JSONB,
    change_description TEXT,
    
    -- Metadados
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_changes_tournament ON tournament_changes_log(tournament_id);
CREATE INDEX idx_tournament_changes_user ON tournament_changes_log(user_id);
CREATE INDEX idx_tournament_changes_type ON tournament_changes_log(change_type);
CREATE INDEX idx_tournament_changes_created ON tournament_changes_log(created_at);

-- =====================================================
-- TABELA DE PREMIAÇÕES
-- =====================================================

CREATE TABLE tournament_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Definição do prêmio
    position INTEGER NOT NULL, -- 1º, 2º, 3º lugar, etc.
    prize_type VARCHAR(50) NOT NULL, -- money, trophy, medal, certificate, custom
    prize_value DECIMAL(10,2), -- valor monetário
    prize_description TEXT,
    
    -- Distribuição
    awarded_to UUID REFERENCES tournament_participants(id),
    awarded_at TIMESTAMP,
    awarded_by UUID REFERENCES users(id),
    
    -- Status
    is_awarded BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_prizes_tournament ON tournament_prizes(tournament_id);
CREATE INDEX idx_tournament_prizes_position ON tournament_prizes(tournament_id, position);
CREATE INDEX idx_tournament_prizes_awarded ON tournament_prizes(awarded_to);

-- =====================================================
-- TABELA DE MEDIA (FOTOS, VÍDEOS)
-- =====================================================

CREATE TABLE tournament_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    -- Tipo de mídia
    media_type VARCHAR(50) NOT NULL, -- image, video, document
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Metadados
    title VARCHAR(255),
    description TEXT,
    tags TEXT[],
    
    -- Configurações
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Processamento (para vídeos)
    processing_status VARCHAR(50) DEFAULT 'completed', -- processing, completed, failed
    thumbnail_path TEXT,
    duration_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tournament_media_tournament ON tournament_media(tournament_id);
CREATE INDEX idx_tournament_media_match ON tournament_media(match_id);
CREATE INDEX idx_tournament_media_type ON tournament_media(media_type);
CREATE INDEX idx_tournament_media_public ON tournament_media(is_public);
CREATE INDEX idx_tournament_media_tags ON tournament_media USING GIN(tags);

-- =====================================================
-- TABELA DE COMENTÁRIOS E REVIEWS
-- =====================================================

CREATE TABLE tournament_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Review
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Categorias de avaliação
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    fairness_rating INTEGER CHECK (fairness_rating >= 1 AND fairness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    
    -- Status
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    
    -- Moderação
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP,
    moderation_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: um review por usuário por torneio
    UNIQUE(tournament_id, reviewer_id)
);

-- Índices
CREATE INDEX idx_tournament_reviews_tournament ON tournament_reviews(tournament_id);
CREATE INDEX idx_tournament_reviews_reviewer ON tournament_reviews(reviewer_id);
CREATE INDEX idx_tournament_reviews_rating ON tournament_reviews(rating);
CREATE INDEX idx_tournament_reviews_approved ON tournament_reviews(is_approved);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Aplicar triggers de updated_at nas novas tabelas
CREATE TRIGGER update_tournament_phases_updated_at BEFORE UPDATE ON tournament_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_groups_updated_at BEFORE UPDATE ON tournament_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phase_participants_updated_at BEFORE UPDATE ON phase_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_brackets_updated_at BEFORE UPDATE ON tournament_brackets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_rankings_updated_at BEFORE UPDATE ON tournament_rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_rules_updated_at BEFORE UPDATE ON tournament_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_prizes_updated_at BEFORE UPDATE ON tournament_prizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_media_updated_at BEFORE UPDATE ON tournament_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_reviews_updated_at BEFORE UPDATE ON tournament_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGERS PARA ESTATÍSTICAS AUTOMÁTICAS
-- =====================================================

-- Função para atualizar rankings automaticamente
CREATE OR REPLACE FUNCTION update_tournament_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar rankings quando uma partida é completada
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Atualizar estatísticas dos participantes da fase
        UPDATE phase_participants 
        SET 
            matches_played = matches_played + 1,
            matches_won = CASE 
                WHEN participant_id = (SELECT participant_id FROM tournament_participants WHERE id = NEW.winner_id) 
                THEN matches_won + 1 
                ELSE matches_won 
            END,
            matches_lost = CASE 
                WHEN participant_id != (SELECT participant_id FROM tournament_participants WHERE id = NEW.winner_id)
                THEN matches_lost + 1 
                ELSE matches_lost 
            END,
            points = CASE 
                WHEN participant_id = (SELECT participant_id FROM tournament_participants WHERE id = NEW.winner_id)
                THEN points + 3  -- vitória = 3 pontos
                ELSE points 
            END,
            goals_for = goals_for + CASE 
                WHEN participant_id = (SELECT participant_id FROM tournament_participants WHERE id = NEW.participant1_id)
                THEN COALESCE(NEW.score1, 0)
                ELSE COALESCE(NEW.score2, 0)
            END,
            goals_against = goals_against + CASE 
                WHEN participant_id = (SELECT participant_id FROM tournament_participants WHERE id = NEW.participant1_id)
                THEN COALESCE(NEW.score2, 0)
                ELSE COALESCE(NEW.score1, 0)
            END
        WHERE phase_id = NEW.phase_id 
        AND participant_id IN (
            SELECT participant_id FROM tournament_participants 
            WHERE id IN (NEW.participant1_id, NEW.participant2_id)
        );
        
        -- Recalcular rankings da fase
        INSERT INTO tournament_rankings (
            tournament_id, phase_id, group_id, participant_id, 
            position, points, matches_played, matches_won, matches_lost, 
            goals_for, goals_against
        )
        SELECT 
            NEW.tournament_id,
            pp.phase_id,
            pp.group_id,
            pp.participant_id,
            ROW_NUMBER() OVER (
                PARTITION BY pp.phase_id, pp.group_id 
                ORDER BY pp.points DESC, pp.goal_difference DESC, pp.goals_for DESC
            ),
            pp.points,
            pp.matches_played,
            pp.matches_won,
            pp.matches_lost,
            pp.goals_for,
            pp.goals_against
        FROM phase_participants pp
        WHERE pp.phase_id = NEW.phase_id
        ON CONFLICT (tournament_id, phase_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid), participant_id)
        DO UPDATE SET
            position = EXCLUDED.position,
            points = EXCLUDED.points,
            matches_played = EXCLUDED.matches_played,
            matches_won = EXCLUDED.matches_won,
            matches_lost = EXCLUDED.matches_lost,
            goals_for = EXCLUDED.goals_for,
            goals_against = EXCLUDED.goals_against,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger
CREATE TRIGGER update_tournament_rankings_trigger
    AFTER INSERT OR UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_tournament_rankings();

-- Função para log de mudanças
CREATE OR REPLACE FUNCTION log_tournament_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_type_val VARCHAR(50);
    entity_type_val VARCHAR(50);
    entity_id_val UUID;
BEGIN
    -- Determinar tipo de mudança baseado na tabela
    entity_type_val := TG_TABLE_NAME;
    
    IF TG_OP = 'INSERT' THEN
        change_type_val := entity_type_val || '_created';
        entity_id_val := NEW.id;
        
        INSERT INTO tournament_changes_log (
            tournament_id, user_id, change_type, entity_type, entity_id, 
            new_data, change_description
        ) VALUES (
            COALESCE(NEW.tournament_id, (SELECT tournament_id FROM tournaments WHERE id = NEW.tournament_id LIMIT 1)),
            COALESCE(NEW.created_by, NEW.user_id, (SELECT created_by FROM tournaments WHERE id = NEW.tournament_id LIMIT 1)),
            change_type_val,
            entity_type_val,
            entity_id_val,
            to_jsonb(NEW),
            'Novo ' || entity_type_val || ' criado'
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        change_type_val := entity_type_val || '_updated';
        entity_id_val := NEW.id;
        
        INSERT INTO tournament_changes_log (
            tournament_id, user_id, change_type, entity_type, entity_id,
            old_data, new_data, change_description
        ) VALUES (
            COALESCE(NEW.tournament_id, OLD.tournament_id),
            COALESCE(NEW.updated_by, NEW.user_id, OLD.created_by, (SELECT created_by FROM tournaments WHERE id = COALESCE(NEW.tournament_id, OLD.tournament_id) LIMIT 1)),
            change_type_val,
            entity_type_val,
            entity_id_val,
            to_jsonb(OLD),
            to_jsonb(NEW),
            entity_type_val || ' atualizado'
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        change_type_val := entity_type_val || '_deleted';
        entity_id_val := OLD.id;
        
        INSERT INTO tournament_changes_log (
            tournament_id, user_id, change_type, entity_type, entity_id,
            old_data, change_description
        ) VALUES (
            OLD.tournament_id,
            COALESCE(OLD.created_by, (SELECT created_by FROM tournaments WHERE id = OLD.tournament_id LIMIT 1)),
            change_type_val,
            entity_type_val,
            entity_id_val,
            to_jsonb(OLD),
            entity_type_val || ' removido'
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers de log nas tabelas principais
CREATE TRIGGER log_tournament_changes_trigger AFTER INSERT OR UPDATE OR DELETE ON tournaments FOR EACH ROW EXECUTE FUNCTION log_tournament_changes();
CREATE TRIGGER log_matches_changes_trigger AFTER INSERT OR UPDATE OR DELETE ON matches FOR EACH ROW EXECUTE FUNCTION log_tournament_changes();
CREATE TRIGGER log_participants_changes_trigger AFTER INSERT OR UPDATE OR DELETE ON tournament_participants FOR EACH ROW EXECUTE FUNCTION log_tournament_changes();

-- =====================================================
-- VIEWS AVANÇADAS
-- =====================================================

-- View para estatísticas detalhadas de torneios
CREATE VIEW tournament_detailed_stats AS
SELECT 
    t.id,
    t.name,
    t.status,
    t.format,
    t.current_participants,
    t.max_participants,
    
    -- Estatísticas de partidas
    COUNT(m.id) as total_matches,
    COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_matches,
    COUNT(CASE WHEN m.status = 'pending' THEN 1 END) as pending_matches,
    
    -- Estatísticas de fases
    COUNT(DISTINCT tp.id) as total_phases,
    COUNT(CASE WHEN tp.status = 'completed' THEN 1 END) as completed_phases,
    
    -- Duração
    t.tournament_start,
    t.tournament_end,
    CASE 
        WHEN t.tournament_end IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (t.tournament_end - t.tournament_start))/3600 
        ELSE NULL 
    END as duration_hours,
    
    -- Rating médio
    AVG(tr.rating) as average_rating,
    COUNT(tr.id) as total_reviews
    
FROM tournaments t
LEFT JOIN matches m ON t.id = m.tournament_id
LEFT JOIN tournament_phases tp ON t.id = tp.tournament_id
LEFT JOIN tournament_reviews tr ON t.id = tr.tournament_id AND tr.is_approved = true
GROUP BY t.id, t.name, t.status, t.format, t.current_participants, t.max_participants, 
         t.tournament_start, t.tournament_end;

-- View para rankings consolidados
CREATE VIEW consolidated_rankings AS
SELECT 
    tr.tournament_id,
    tr.participant_id,
    tp.user_id,
    u.username,
    u.first_name,
    u.last_name,
    tr.position,
    tr.points,
    tr.matches_played,
    tr.matches_won,
    tr.matches_lost,
    tr.goal_difference,
    t.name as tournament_name,
    tc.name as category_name
FROM tournament_rankings tr
JOIN tournament_participants tp ON tr.participant_id = tp.id
JOIN users u ON tp.user_id = u.id
JOIN tournaments t ON tr.tournament_id = t.id
JOIN tournament_categories tc ON t.category_id = tc.id
WHERE tr.is_final = true
ORDER BY tr.tournament_id, tr.position;

-- View para próximas partidas
CREATE VIEW upcoming_matches AS
SELECT 
    m.id,
    m.tournament_id,
    t.name as tournament_name,
    tc.name as category_name,
    tc.icon as category_icon,
    m.round_number,
    m.scheduled_start,
    
    -- Participante 1
    u1.username as participant1_username,
    u1.first_name as participant1_first_name,
    u1.avatar_url as participant1_avatar,
    
    -- Participante 2
    u2.username as participant2_username,
    u2.first_name as participant2_first_name,
    u2.avatar_url as participant2_avatar,
    
    -- Fase e grupo
    tp.name as phase_name,
    tg.name as group_name
    
FROM matches m
JOIN tournaments t ON m.tournament_id = t.id
JOIN tournament_categories tc ON t.category_id = tc.id
LEFT JOIN tournament_phases tp ON m.phase_id = tp.id
LEFT JOIN tournament_groups tg ON m.group_id = tg.id
JOIN tournament_participants tp1 ON m.participant1_id = tp1.id
JOIN users u1 ON tp1.user_id = u1.id
JOIN tournament_participants tp2 ON m.participant2_id = tp2.id
JOIN users u2 ON tp2.user_id = u2.id
WHERE m.status IN ('pending', 'scheduled')
AND m.scheduled_start > CURRENT_TIMESTAMP
ORDER BY m.scheduled_start;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar chaveamento automático
CREATE OR REPLACE FUNCTION generate_tournament_bracket(
    tournament_id_param UUID,
    phase_id_param UUID
) RETURNS JSONB AS $$
DECLARE
    participant_count INTEGER;
    bracket_data JSONB;
    participants_array JSONB;
BEGIN
    -- Contar participantes da fase
    SELECT COUNT(*) INTO participant_count
    FROM phase_participants pp
    WHERE pp.phase_id = phase_id_param
    AND pp.status = 'active';
    
    -- Buscar participantes ordenados por seed
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', pp.participant_id,
            'seed', pp.seed,
            'name', u.username
        ) ORDER BY pp.seed
    ) INTO participants_array
    FROM phase_participants pp
    JOIN tournament_participants tp ON pp.participant_id = tp.id
    JOIN users u ON tp.user_id = u.id
    WHERE pp.phase_id = phase_id_param
    AND pp.status = 'active';
    
    -- Gerar estrutura do bracket
    bracket_data := jsonb_build_object(
        'participants', participants_array,
        'total_participants', participant_count,
        'total_rounds', CEILING(LOG(2, participant_count)),
        'generated_at', CURRENT_TIMESTAMP
    );
    
    -- Salvar bracket
    INSERT INTO tournament_brackets (tournament_id, phase_id, bracket_type, bracket_data, total_rounds)
    VALUES (tournament_id_param, phase_id_param, 'single', bracket_data, CEILING(LOG(2, participant_count)))
    ON CONFLICT (tournament_id, phase_id) 
    DO UPDATE SET 
        bracket_data = EXCLUDED.bracket_data,
        total_rounds = EXCLUDED.total_rounds,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN bracket_data;
END;
$$ language 'plpgsql';

-- Função para avançar fase automaticamente
CREATE OR REPLACE FUNCTION advance_tournament_phase(
    tournament_id_param UUID,
    current_phase_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    next_phase_id UUID;
    advancement_count INTEGER;
    phase_record RECORD;
BEGIN
    -- Buscar dados da fase atual
    SELECT * INTO phase_record
    FROM tournament_phases
    WHERE id = current_phase_id;
    
    -- Buscar próxima fase
    SELECT id INTO next_phase_id
    FROM tournament_phases
    WHERE tournament_id = tournament_id_param
    AND phase_order = phase_record.phase_order + 1;
    
    IF next_phase_id IS NULL THEN
        -- Não há próxima fase, torneio finalizado
        UPDATE tournaments 
        SET status = 'completed', tournament_end = CURRENT_TIMESTAMP
        WHERE id = tournament_id_param;
        RETURN true;
    END IF;
    
    -- Obter número de participantes que devem avançar
    advancement_count := phase_record.advancement_count;
    
    -- Mover participantes qualificados para próxima fase
    INSERT INTO phase_participants (phase_id, participant_id, status)
    SELECT 
        next_phase_id,
        participant_id,
        'active'
    FROM tournament_rankings
    WHERE tournament_id = tournament_id_param
    AND phase_id = current_phase_id
    AND position <= advancement_count
    ORDER BY position;
    
    -- Marcar fase atual como completada
    UPDATE tournament_phases
    SET status = 'completed', end_date = CURRENT_TIMESTAMP
    WHERE id = current_phase_id;
    
    -- Ativar próxima fase
    UPDATE tournament_phases
    SET status = 'active', start_date = CURRENT_TIMESTAMP
    WHERE id = next_phase_id;
    
    RETURN true;
END;
$$ language 'plpgsql';

-- =====================================================
-- DADOS INICIAIS PARA TESTING
-- =====================================================

-- Inserir regras padrão para diferentes tipos de torneio
INSERT INTO tournament_rules (tournament_id, rule_type, rule_name, rule_description, rule_config) 
SELECT 
    t.id,
    'scoring',
    'Pontuação Padrão',
    'Vitória = 3 pontos, Empate = 1 ponto, Derrota = 0 pontos',
    '{"win": 3, "draw": 1, "loss": 0}'::jsonb
FROM tournaments t
WHERE NOT EXISTS (
    SELECT 1 FROM tournament_rules tr 
    WHERE tr.tournament_id = t.id AND tr.rule_type = 'scoring'
);

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE tournament_phases IS 'Fases de torneios (grupos, eliminatórias, final)';
COMMENT ON TABLE tournament_groups IS 'Grupos dentro das fases de torneio';
COMMENT ON TABLE phase_participants IS 'Participantes em cada fase do torneio';
COMMENT ON TABLE tournament_brackets IS 'Estrutura de chaveamento dos torneios';
COMMENT ON TABLE tournament_rankings IS 'Rankings e classificações por fase/grupo';
COMMENT ON TABLE tournament_rules IS 'Regras customizáveis para cada torneio';
COMMENT ON TABLE tournament_changes_log IS 'Log de todas as mudanças no torneio';
COMMENT ON TABLE tournament_prizes IS 'Premiações e reconhecimentos';
COMMENT ON TABLE tournament_media IS 'Mídia associada aos torneios (fotos, vídeos)';
COMMENT ON TABLE tournament_reviews IS 'Avaliações e comentários dos participantes';

-- Finalização
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name LIKE 'tournament_%';
    
    RAISE NOTICE 'Schema avançado de torneios criado com sucesso! % tabelas relacionadas a torneios.', table_count;
END $$;