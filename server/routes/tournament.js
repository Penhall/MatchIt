// server/routes/tournament.js - Rotas de Torneio (ES Modules)
import express from 'express';
import tournamentEngine from '../services/TournamentEngine.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('🏆 Carregando rotas de torneio (ES Modules)...');

/**
 * GET /api/tournament/categories
 * Listar categorias disponíveis
 */
router.get('/categories', (req, res) => {
    try {
        const categories = tournamentEngine.getCategories();
        
        res.json({
            success: true,
            data: categories,
            count: categories.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar categorias'
        });
    }
});

/**
 * POST /api/tournament/start
 * Iniciar novo torneio
 */
router.post('/start', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category } = req.body;
        
        console.log(`🎮 Iniciando torneio - userId: ${userId}, categoria: ${category}`);
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Categoria é obrigatória',
                code: 'MISSING_CATEGORY'
            });
        }
        
        const tournament = await tournamentEngine.startTournament(userId, category);
        
        res.json({
            success: true,
            message: 'Torneio iniciado com sucesso',
            data: tournament,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar torneio:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao iniciar torneio',
            code: 'START_TOURNAMENT_ERROR'
        });
    }
});

/**
 * POST /api/tournament/choice
 * Processar escolha do usuário
 */
router.post('/choice', optionalAuth, async (req, res) => {
    try {
        const { tournamentId, winnerId, loserId } = req.body;
        
        console.log(`⚔️ Processando escolha - torneio: ${tournamentId}`);
        
        if (!tournamentId || !winnerId || !loserId) {
            return res.status(400).json({
                success: false,
                error: 'tournamentId, winnerId e loserId são obrigatórios',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        const result = await tournamentEngine.processChoice(tournamentId, winnerId, loserId);
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar escolha:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao processar escolha',
            code: 'PROCESS_CHOICE_ERROR'
        });
    }
});

/**
 * GET /api/tournament/:tournamentId
 * Buscar dados do torneio
 */
router.get('/:tournamentId', optionalAuth, (req, res) => {
    try {
        const { tournamentId } = req.params;
        const tournament = tournamentEngine.getTournament(tournamentId);
        
        if (!tournament) {
            return res.status(404).json({
                success: false,
                error: 'Torneio não encontrado',
                code: 'TOURNAMENT_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: tournament.id,
                category: tournament.category,
                status: tournament.status,
                round: tournament.currentRound,
                currentMatch: tournament.matches[0] || null,
                remainingMatches: tournament.matches.length,
                results: tournament.results,
                progress: {
                    totalRounds: tournament.maxRounds,
                    currentRound: tournament.currentRound,
                    completedMatches: tournament.results.length
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar torneio:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar torneio',
            code: 'GET_TOURNAMENT_ERROR'
        });
    }
});

/**
 * GET /api/tournament/:tournamentId/status
 * Status simplificado do torneio
 */
router.get('/:tournamentId/status', (req, res) => {
    try {
        const { tournamentId } = req.params;
        const tournament = tournamentEngine.getTournament(tournamentId);
        
        if (!tournament) {
            return res.status(404).json({
                success: false,
                error: 'Torneio não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: tournament.id,
                status: tournament.status,
                category: tournament.category,
                round: tournament.currentRound,
                hasCurrentMatch: !!tournament.matches[0],
                isCompleted: tournament.status === 'completed',
                winner: tournament.winner || null
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar status do torneio:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar status do torneio'
        });
    }
});

console.log('✅ Rotas de torneio carregadas (ES Modules)');

export default router;
