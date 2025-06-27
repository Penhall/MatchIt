#!/bin/bash
# scripts/install-tournament-system.sh - Instalação completa do sistema de torneios

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 INSTALAÇÃO COMPLETA DO SISTEMA DE TORNEIOS - FASE 1"
echo "================================================================"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto MatchIt${NC}"
    exit 1
fi

# Criar diretórios necessários
echo -e "${BLUE}📁 Criando estrutura de diretórios...${NC}"
mkdir -p server/services
mkdir -p server/routes
mkdir -p database/migrations
mkdir -p scripts

# 1. INSTALAR DEPENDÊNCIAS
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install uuid

# 2. CRIAR MIGRAÇÃO CORRIGIDA
echo -e "${BLUE}🗄️ Criando migração corrigida...${NC}"

cat > database/migrations/003_tournament_schema_fix.sql << 'EOF'
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
EOF

echo -e "${GREEN}✅ Migração criada: database/migrations/003_tournament_schema_fix.sql${NC}"

# 3. EXECUTAR MIGRAÇÃO
echo -e "${BLUE}🗄️ Executando migração no banco de dados...${NC}"
echo "   Usuário: matchit"
echo "   Banco: matchit_db"
echo "   Senha: matchit123"
echo ""

if psql -h localhost -U matchit -d matchit_db -f database/migrations/003_tournament_schema_fix.sql; then
    echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao executar migração${NC}"
    exit 1
fi

# 4. CRIAR TOURNAMENTENGINE
echo -e "${BLUE}⚙️ Criando TournamentEngine...${NC}"

cat > server/services/TournamentEngine.js << 'EOF'
// server/services/TournamentEngine.js - Motor Principal do Sistema de Torneios MatchIt
import { pool } from '../config/database.js';

/**
 * TournamentEngine - Motor principal para gerenciamento de torneios 2x2
 */
export class TournamentEngine {
    
    constructor() {
        this.activeSessions = new Map();
        this.categories = [
            'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
            'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
        ];
    }

    async startTournament(userId, category, tournamentSize = 16) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Verificar sessão ativa existente
            const existingSession = await this.getActiveSession(userId, category);
            if (existingSession) {
                await client.query('ROLLBACK');
                return {
                    sessionId: existingSession.id,
                    resumed: true,
                    currentMatchup: existingSession.current_matchup ? {
                        imageA: await this.getImageById(existingSession.current_matchup[0]),
                        imageB: await this.getImageById(existingSession.current_matchup[1])
                    } : null,
                    progress: this.calculateProgress(existingSession),
                    round: existingSession.current_round,
                    status: existingSession.status
                };
            }

            // Buscar imagens aprovadas
            const imagesQuery = `
                SELECT id, image_url, thumbnail_url, title, description, tags
                FROM tournament_images 
                WHERE category = $1 AND active = true AND approved = true
                ORDER BY RANDOM()
                LIMIT $2
            `;
            const imagesResult = await client.query(imagesQuery, [category, tournamentSize]);
            
            if (imagesResult.rows.length < tournamentSize) {
                throw new Error(`Insuficientes imagens para categoria ${category}. Necessário: ${tournamentSize}, Disponível: ${imagesResult.rows.length}`);
            }

            // Criar sessão
            const sessionId = `tournament_${userId}_${category}_${Date.now()}`;
            const imageIds = imagesResult.rows.map(img => img.id);
            const totalRounds = Math.log2(tournamentSize);

            const insertSessionQuery = `
                INSERT INTO tournament_sessions (
                    id, user_id, category, status, current_round, total_rounds,
                    remaining_images, eliminated_images, tournament_size,
                    started_at, last_activity
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            
            await client.query(insertSessionQuery, [
                sessionId, userId, category, 'active', 1, totalRounds,
                imageIds, [], tournamentSize, new Date(), new Date()
            ]);

            // Gerar primeiro confronto
            const firstMatchup = await this.generateNextMatchup(client, sessionId);
            await client.query('COMMIT');

            console.log(`✅ Torneio iniciado: ${sessionId}`);

            return {
                sessionId: sessionId,
                resumed: false,
                currentMatchup: firstMatchup,
                progress: { current: 0, total: tournamentSize - 1, percentage: 0 },
                round: 1,
                status: 'active'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Erro ao iniciar torneio:', error);
            throw new Error(`Falha ao iniciar torneio: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async generateNextMatchup(client, sessionId) {
        try {
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão não encontrada');
            }

            const session = sessionResult.rows[0];

            if (session.remaining_images.length <= 1) {
                return await this.finalizeTournament(client, sessionId);
            }

            const imageA_id = session.remaining_images[0];
            const imageB_id = session.remaining_images[1];

            const imageA = await this.getImageById(imageA_id);
            const imageB = await this.getImageById(imageB_id);

            const updateSessionQuery = `
                UPDATE tournament_sessions 
                SET current_matchup = $1, matchup_start_time = NOW(), last_activity = NOW()
                WHERE id = $2
            `;
            await client.query(updateSessionQuery, [[imageA_id, imageB_id], sessionId]);

            return {
                sessionId,
                roundNumber: session.current_round,
                imageA,
                imageB,
                startTime: new Date()
            };

        } catch (error) {
            console.error('❌ Erro ao gerar confronto:', error);
            throw new Error(`Falha ao gerar confronto: ${error.message}`);
        }
    }

    async processChoice(sessionId, winnerId, responseTime = null) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão não encontrada');
            }

            const session = sessionResult.rows[0];
            const [imageA_id, imageB_id] = session.current_matchup;
            const loserId = winnerId === imageA_id ? imageB_id : imageA_id;

            // Registrar escolha
            const choiceQuery = `
                INSERT INTO tournament_choices (
                    session_id, round_number, matchup_sequence, option_a_id, 
                    option_b_id, winner_id, loser_id, response_time_ms,
                    is_speed_bonus, choice_made_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `;
            
            const isSpeedBonus = responseTime && responseTime < 3000;
            const matchupSequence = Math.floor((session.tournament_size - session.remaining_images.length) / 2) + 1;

            await client.query(choiceQuery, [
                sessionId, session.current_round, matchupSequence,
                imageA_id, imageB_id, winnerId, loserId,
                responseTime, isSpeedBonus
            ]);

            // Atualizar arrays
            const newRemaining = session.remaining_images.filter(id => id !== loserId);
            const newEliminated = [...session.eliminated_images, loserId];
            const newRound = newRemaining.length === session.remaining_images.length / 2 ? 
                session.current_round + 1 : session.current_round;

            const updateSessionQuery = `
                UPDATE tournament_sessions 
                SET remaining_images = $1, eliminated_images = $2, 
                    current_round = $3, current_matchup = NULL, 
                    last_activity = NOW()
                WHERE id = $4
            `;
            
            await client.query(updateSessionQuery, [
                newRemaining, newEliminated, newRound, sessionId
            ]);

            // Verificar se terminou
            if (newRemaining.length === 1) {
                const result = await this.finalizeTournament(client, sessionId, newRemaining[0]);
                await client.query('COMMIT');
                return result;
            }

            // Próximo confronto
            const nextMatchup = await this.generateNextMatchup(client, sessionId);
            await client.query('COMMIT');

            return {
                success: true,
                nextMatchup,
                progress: this.calculateProgress({
                    tournament_size: session.tournament_size,
                    remaining_images: newRemaining
                }),
                round: newRound,
                isComplete: false
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Erro ao processar escolha:', error);
            throw new Error(`Falha ao processar escolha: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async finalizeTournament(client, sessionId, championId) {
        try {
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            const session = sessionResult.rows[0];

            const champion = await this.getImageById(championId);

            // Salvar resultado
            const insertResultQuery = `
                INSERT INTO tournament_results (
                    session_id, user_id, category, champion_id,
                    total_choices_made, rounds_completed, completion_rate,
                    completed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `;

            await client.query(insertResultQuery, [
                sessionId, session.user_id, session.category, championId,
                15, session.current_round, 100
            ]);

            // Atualizar sessão
            await client.query(`
                UPDATE tournament_sessions 
                SET status = 'completed', completed_at = NOW() 
                WHERE id = $1
            `, [sessionId]);

            console.log(`🏆 Torneio finalizado: ${champion.title}`);

            return {
                success: true,
                isComplete: true,
                champion
            };

        } catch (error) {
            console.error('❌ Erro ao finalizar torneio:', error);
            throw new Error(`Falha ao finalizar torneio: ${error.message}`);
        }
    }

    async getActiveSession(userId, category) {
        try {
            const query = `
                SELECT * FROM tournament_sessions 
                WHERE user_id = $1 AND category = $2 AND status = 'active'
                ORDER BY started_at DESC
                LIMIT 1
            `;
            const result = await pool.query(query, [userId, category]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Erro ao buscar sessão ativa:', error);
            return null;
        }
    }

    async getImageById(imageId) {
        try {
            const query = `SELECT * FROM tournament_images WHERE id = $1`;
            const result = await pool.query(query, [imageId]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erro ao buscar imagem:', error);
            return null;
        }
    }

    calculateProgress(session) {
        const total = session.tournament_size - 1;
        const completed = session.tournament_size - session.remaining_images.length;
        const percentage = Math.round((completed / total) * 100);
        
        return { current: completed, total, percentage };
    }
}

console.log('✅ TournamentEngine carregado');
export default TournamentEngine;
EOF

echo -e "${GREEN}✅ TournamentEngine criado${NC}"

# 5. CRIAR ROTAS
echo -e "${BLUE}🛣️ Criando rotas de torneio...${NC}"

cat > server/routes/tournament.js << 'EOF'
// server/routes/tournament.js - Rotas do sistema de torneios
import express from 'express';
import { TournamentEngine } from '../services/TournamentEngine.js';
import { pool } from '../config/database.js';

const router = express.Router();
const tournamentEngine = new TournamentEngine();

// Middleware de auth simplificado
const authMiddleware = (req, res, next) => {
    req.user = { 
        id: parseInt(req.headers['user-id']) || 1
    };
    next();
};

// GET /api/tournament/categories
router.get('/categories', async (req, res) => {
    try {
        const categoriesQuery = `
            SELECT 
                category,
                COUNT(*) as total_images,
                COUNT(CASE WHEN approved = true THEN 1 END) as approved_images
            FROM tournament_images 
            WHERE active = true
            GROUP BY category
            HAVING COUNT(CASE WHEN approved = true THEN 1 END) >= 8
            ORDER BY category
        `;
        
        const result = await pool.query(categoriesQuery);
        
        res.json({
            success: true,
            categories: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar categorias'
        });
    }
});

// POST /api/tournament/start
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const { category, tournamentSize = 16 } = req.body;
        const userId = req.user.id;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Categoria é obrigatória'
            });
        }

        const tournamentData = await tournamentEngine.startTournament(userId, category, tournamentSize);
        
        res.json({
            success: true,
            data: tournamentData
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar torneio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/tournament/active/:category
router.get('/active/:category', authMiddleware, async (req, res) => {
    try {
        const { category } = req.params;
        const userId = req.user.id;

        const activeSession = await tournamentEngine.getActiveSession(userId, category);
        
        if (!activeSession) {
            return res.json({
                success: true,
                data: null,
                message: 'Nenhuma sessão ativa'
            });
        }

        // Buscar confronto atual
        let currentMatchup = null;
        if (activeSession.current_matchup && activeSession.current_matchup.length === 2) {
            const imageA = await tournamentEngine.getImageById(activeSession.current_matchup[0]);
            const imageB = await tournamentEngine.getImageById(activeSession.current_matchup[1]);
            
            currentMatchup = {
                sessionId: activeSession.id,
                roundNumber: activeSession.current_round,
                imageA,
                imageB
            };
        }

        res.json({
            success: true,
            data: {
                sessionId: activeSession.id,
                category: activeSession.category,
                currentMatchup,
                progress: tournamentEngine.calculateProgress(activeSession)
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar sessão ativa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar sessão ativa'
        });
    }
});

// POST /api/tournament/choice
router.post('/choice', authMiddleware, async (req, res) => {
    try {
        const { sessionId, winnerId, responseTime } = req.body;

        if (!sessionId || !winnerId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId e winnerId são obrigatórios'
            });
        }

        const result = await tournamentEngine.processChoice(sessionId, winnerId, responseTime);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar escolha:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
EOF

echo -e "${GREEN}✅ Rotas de torneio criadas${NC}"

# 6. VERIFICAR SE APP.JS TEM AS ROTAS REGISTRADAS
echo -e "${BLUE}🔍 Verificando registro de rotas no app.js...${NC}"

if grep -q "tournament" server/app.js; then
    echo -e "${GREEN}✅ Rotas de torneio já registradas no app.js${NC}"
else
    echo -e "${YELLOW}⚠️ Adicionando registro de rotas no app.js...${NC}"
    
    # Backup do app.js
    cp server/app.js server/app.js.backup.$(date +%Y%m%d_%H%M%S)
    
    # Adicionar import e registro das rotas
    sed -i '/import profileRoutes/a import tournamentRoutes from '\''./routes/tournament.js'\'';' server/app.js
    sed -i '/app.use.*profile/a app.use('\''/api/tournament'\'', tournamentRoutes);' server/app.js
    
    echo -e "${GREEN}✅ Rotas adicionadas ao app.js${NC}"
fi

# 7. VERIFICAR ESTRUTURA FINAL
echo -e "${BLUE}🔍 Verificando estrutura criada...${NC}"

# Verificar tabelas
echo "📊 Tabelas criadas:"
psql -h localhost -U matchit -d matchit_db -c "SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE tablename LIKE 'tournament%' 
ORDER BY tablename;" 2>/dev/null || echo "   ❌ Erro ao verificar tabelas"

# Verificar dados
echo ""
echo "📸 Imagens de teste:"
psql -h localhost -U matchit -d matchit_db -c "SELECT 
    category, 
    COUNT(*) as total,
    COUNT(CASE WHEN approved = true THEN 1 END) as approved
FROM tournament_images 
GROUP BY category;" 2>/dev/null || echo "   ❌ Erro ao verificar imagens"

# 8. CRIAR SCRIPT DE TESTE SIMPLIFICADO
echo -e "${BLUE}🧪 Criando script de teste...${NC}"

cat > scripts/test-tournament-basic.sh << 'EOF'
#!/bin/bash
# Teste básico do sistema de torneios

echo "🧪 TESTE BÁSICO DO SISTEMA DE TORNEIOS"
echo "======================================"

API_BASE="http://localhost:3000/api"

echo "1. Testando categorias..."
curl -H "user-id: 1" "$API_BASE/tournament/categories" | jq '.'

echo -e "\n2. Iniciando torneio..."
curl -H "user-id: 1" -H "Content-Type: application/json" \
     -d '{"category":"cores"}' "$API_BASE/tournament/start" | jq '.'

echo -e "\n3. Verificando sessão ativa..."
curl -H "user-id: 1" "$API_BASE/tournament/active/cores" | jq '.'

echo -e "\n✅ Teste básico concluído!"
EOF

chmod +x scripts/test-tournament-basic.sh

echo -e "${GREEN}✅ Script de teste criado: scripts/test-tournament-basic.sh${NC}"

# 9. FINALIZAÇÃO
echo ""
echo "================================================================"
echo -e "${GREEN}🎉 INSTALAÇÃO COMPLETA DO SISTEMA DE TORNEIOS FINALIZADA!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}📋 O que foi instalado:${NC}"
echo "   ✅ Dependência 'uuid' instalada"
echo "   ✅ Migração corrigida executada no banco"
echo "   ✅ TournamentEngine.js criado"
echo "   ✅ Rotas de torneio criadas"
echo "   ✅ App.js atualizado (se necessário)"
echo "   ✅ Script de teste criado"
echo ""
echo -e "${BLUE}🚀 Para testar:${NC}"
echo "   1. Iniciar servidor: npm run server"
echo "   2. Executar teste: ./scripts/test-tournament-basic.sh"
echo ""
echo -e "${BLUE}📡 Endpoints disponíveis:${NC}"
echo "   GET    /api/tournament/categories"
echo "   POST   /api/tournament/start"
echo "   GET    /api/tournament/active/:category"  
echo "   POST   /api/tournament/choice"
echo ""
echo -e "${GREEN}🎯 Sistema de torneios pronto para uso!${NC}"