// server/routes/tournament.js - Rotas da API para torneios
import express from 'express';
import tournamentService from '../services/tournamentService.js';

const router = express.Router();

// GET /api/tournament/categories - Listar categorias disponíveis
router.get('/categories', async (req, res) => {
  try {
    const categories = ['roupas', 'tenis', 'acessorios', 'cores', 'ambientes'];
    
    // Contar imagens por categoria
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const images = await tournamentService.getImagesByCategory(category);
        return {
          category,
          imageCount: images.length,
          available: images.length >= 2
        };
      })
    );
    
    res.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/tournament/images/:category - Buscar imagens de uma categoria
router.get('/images/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const images = await tournamentService.getImagesByCategory(category);
    
    res.json({
      success: true,
      category,
      images
    });
  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/tournament/start - Iniciar novo torneio
router.post('/start', async (req, res) => {
  try {
    const { category } = req.body;
    const userId = req.userId; // Do middleware de auth
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória'
      });
    }
    
    console.log(`🎮 Iniciando torneio: usuário ${userId}, categoria ${category}`);
    
    const tournament = await tournamentService.startTournament(userId, category);
    
    res.json({
      success: true,
      message: 'Torneio iniciado com sucesso',
      tournament
    });
  } catch (error) {
    console.error('Erro ao iniciar torneio:', error);
    
    if (error.message.includes('já completou')) {
      return res.status(400).json({
        success: false,
        error: 'Você já completou o torneio nesta categoria',
        code: 'ALREADY_COMPLETED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/tournament/choice - Processar escolha no torneio
router.post('/choice', async (req, res) => {
  try {
    const { sessionId, winnerImageId, loserImageId, choiceTimeMs } = req.body;
    
    if (!sessionId || !winnerImageId || !loserImageId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, winnerImageId e loserImageId são obrigatórios'
      });
    }
    
    console.log(`⚖️ Processando escolha: sessão ${sessionId}, vencedor ${winnerImageId}`);
    
    const result = await tournamentService.processChoice(
      sessionId, 
      winnerImageId, 
      loserImageId, 
      choiceTimeMs || 1000
    );
    
    res.json({
      success: true,
      message: 'Escolha processada com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao processar escolha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/tournament/results - Buscar resultados do usuário
router.get('/results', async (req, res) => {
  try {
    const userId = req.userId;
    const results = await tournamentService.getUserResults(userId);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/tournament/stats - Estatísticas gerais
router.get('/stats', async (req, res) => {
  try {
    // Implementação básica para MVP
    res.json({
      success: true,
      stats: {
        totalTournaments: 0,
        averageTime: 0,
        mostPopularCategory: 'roupas'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
