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
