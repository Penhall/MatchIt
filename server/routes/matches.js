// server/routes/matches.js - Rotas de matching
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validation.js';
import { MatchService } from '../services/matchService.js';

const router = express.Router();
const matchService = new MatchService();

// GET /api/matches/potential - Buscar matches potenciais
router.get('/matches/potential', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const matches = await matchService.getPotentialMatches(req.user.userId, {
      limit: Math.min(parseInt(limit), 50)
    });
    
    res.json(matches);
  } catch (error) {
    console.error('Erro ao buscar matches potenciais:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'POTENTIAL_MATCHES_ERROR'
    });
  }
});

// GET /api/matches - Obter matches existentes
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const matches = await matchService.getUserMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MATCHES_FETCH_ERROR'
    });
  }
});

// POST /api/matches - Criar um novo match
router.post('/matches', authenticateToken, validateRequired(['targetUserId']), async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    const result = await matchService.createMatch(req.user.userId, targetUserId);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar match:', error);
    
    if (error.message.includes('já existe')) {
      return res.status(400).json({ 
        error: 'Match já existe entre estes usuários',
        code: 'MATCH_ALREADY_EXISTS'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MATCH_CREATION_ERROR'
    });
  }
});

// PUT /api/matches/:matchId - Aceitar/rejeitar match
router.put('/matches/:matchId', authenticateToken, validateRequired(['status']), async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status deve ser accepted ou rejected',
        code: 'INVALID_MATCH_STATUS'
      });
    }
    
    const result = await matchService.updateMatchStatus(matchId, req.user.userId, status);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar match:', error);
    
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ 
        error: 'Match não encontrado',
        code: 'MATCH_NOT_FOUND'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MATCH_UPDATE_ERROR'
    });
  }
});

export default router;

// =====================================================

// server/routes/recommendations.js - Rotas de recomendação
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validation.js';
import { RecommendationService } from '../services/recommendationService.js';

const router = express.Router();
const recommendationService = new RecommendationService();

// GET /api/recommendations - Obter recomendações
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, algorithm = 'hybrid', refresh = false } = req.query;
    
    const result = await recommendationService.getRecommendations(req.user.userId, {
      limit: Math.min(parseInt(limit), 50),
      algorithm,
      forceRefresh: refresh === 'true'
    });
    
    res.json({
      success: true,
      data: {
        recommendations: result.matches,
        totalCandidates: result.totalCandidates,
        algorithm: result.algorithm,
        processingTime: result.processingTime
      },
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromCache: result.fromCache
      }
    });
    
  } catch (error) {
    console.error('Erro em GET /api/recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      code: 'RECOMMENDATIONS_ERROR'
    });
  }
});

// POST /api/recommendations/feedback - Registrar feedback
router.post('/recommendations/feedback', authenticateToken, validateRequired(['targetUserId', 'action']), async (req, res) => {
  try {
    const { targetUserId, action, context = {} } = req.body;
    
    const validActions = ['like', 'dislike', 'super_like', 'skip', 'report', 'block'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Ação inválida',
        validActions,
        code: 'INVALID_ACTION'
      });
    }
    
    const result = await recommendationService.recordFeedback(
      req.user.userId, 
      targetUserId, 
      action, 
      context
    );
    
    res.json({
      success: true,
      data: result,
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro em POST /api/recommendations/feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'FEEDBACK_ERROR'
    });
  }
});

// GET /api/recommendations/health - Health check do sistema de recomendação
router.get('/recommendations/health', async (req, res) => {
  try {
    const healthStatus = await recommendationService.getHealthStatus();
    
    res.json({
      success: true,
      data: healthStatus
    });
    
  } catch (error) {
    console.error('Erro em health check do sistema de recomendação:', error);
    res.status(500).json({
      success: false,
      error: 'Sistema de recomendação com problemas',
      details: error.message,
      code: 'RECOMMENDATIONS_HEALTH_ERROR'
    });
  }
});

// GET /api/recommendations/stats - Estatísticas de recomendação do usuário
router.get('/recommendations/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await recommendationService.getUserRecommendationStats(req.user.userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de recomendação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'RECOMMENDATION_STATS_ERROR'
    });
  }
});

export default router;

// =====================================================

// server/routes/chat.js - Rotas de chat
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validation.js';
import { ChatService } from '../services/chatService.js';

const router = express.Router();
const chatService = new ChatService();

// GET /api/matches/:matchId/messages - Obter mensagens de um match
router.get('/matches/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verificar se o usuário pertence ao match
    const hasAccess = await chatService.userHasAccessToMatch(matchId, req.user.userId);
    
    if (!hasAccess) {
      return res.status(404).json({ 
        error: 'Match não encontrado',
        code: 'MATCH_NOT_FOUND'
      });
    }
    
    const messages = await chatService.getMatchMessages(matchId, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      userId: req.user.userId
    });
    
    res.json(messages);
    
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MESSAGES_FETCH_ERROR'
    });
  }
});

// POST /api/matches/:matchId/messages - Enviar mensagem
router.post('/matches/:matchId/messages', authenticateToken, validateRequired(['message']), async (req, res) => {
  try {
    const { matchId } = req.params;
    const { message, messageType = 'text' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Mensagem não pode estar vazia',
        code: 'EMPTY_MESSAGE'
      });
    }
    
    const result = await chatService.sendMessage({
      matchId,
      senderId: req.user.userId,
      message: message.trim(),
      messageType
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    if (error.message.includes('não autorizado')) {
      return res.status(403).json({ 
        error: 'Não autorizado para este match',
        code: 'UNAUTHORIZED_MATCH'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MESSAGE_SEND_ERROR'
    });
  }
});

// PUT /api/matches/:matchId/messages/:messageId - Marcar mensagem como lida
router.put('/matches/:matchId/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { matchId, messageId } = req.params;
    
    await chatService.markMessageAsRead(messageId, req.user.userId);
    
    res.json({ 
      message: 'Mensagem marcada como lida',
      success: true
    });
    
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MARK_READ_ERROR'
    });
  }
});

export default router;
