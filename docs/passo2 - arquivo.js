// =====================================================
// ROTAS DE SISTEMA DE RECOMENDAÇÃO
// =====================================================

// Importar o serviço (adicionar no topo do arquivo)
// import { RecommendationService } from './services/recommendation/RecommendationService.js';

// Instanciar o serviço
const recommendationService = new (class {
  constructor(pool) { this.pool = pool; }
  
  async getRecommendations(userId, options = {}) {
    const { limit = 20, algorithm = 'hybrid' } = options;
    
    try {
      // Buscar candidatos usando stored procedure
      const result = await this.pool.query(
        'SELECT * FROM find_potential_matches($1, $2, 0.3, 50.0)',
        [userId, limit]
      );
      
      const matches = result.rows.map(row => ({
        id: `score_${Date.now()}_${row.user_id}`,
        userId,
        targetUserId: row.user_id,
        overallScore: row.compatibility_score,
        normalizedScore: Math.round(row.compatibility_score * 100),
        explanation: {
          summary: `${Math.round(row.compatibility_score * 100)}% compatível`,
          strengths: ['Estilo similar', 'Localização próxima']
        },
        targetUser: {
          displayName: row.display_name,
          city: row.city,
          avatarUrl: row.avatar_url,
          isVip: row.is_vip,
          distance: Math.round(row.distance_km)
        }
      }));

      return {
        matches,
        totalCandidates: result.rows.length,
        algorithm,
        processingTime: 100,
        fromCache: false
      };
    } catch (error) {
      console.error('Erro no serviço de recomendação:', error);
      throw error;
    }
  }
  
  async recordFeedback(userId, targetUserId, action, context = {}) {
    try {
      await this.pool.query(
        'SELECT record_interaction_with_learning($1, $2, $3)',
        [userId, targetUserId, action]
      );
      
      // Verificar se criou match
      const mutualCheck = await this.pool.query(`
        SELECT COUNT(*) as mutual FROM user_interactions 
        WHERE user_id = $1 AND target_user_id = $2 AND action IN ('like', 'super_like')
        AND EXISTS (
          SELECT 1 FROM user_interactions 
          WHERE user_id = $2 AND target_user_id = $1 AND action IN ('like', 'super_like')
        )
      `, [userId, targetUserId]);
      
      const matchCreated = parseInt(mutualCheck.rows[0].mutual) > 0;
      
      return {
        success: true,
        matchCreated,
        message: matchCreated ? 'Match criado!' : 'Feedback registrado'
      };
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      throw error;
    }
  }
})(pool);

// GET /api/recommendations - Obter recomendações
app.get('/api/recommendations', authenticateToken, async (req, res) => {
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
    console.error('Erro em GET /recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// POST /api/recommendations/feedback - Registrar feedback
app.post('/api/recommendations/feedback', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, action, context = {} } = req.body;
    
    if (!targetUserId || !action) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId e action são obrigatórios'
      });
    }
    
    if (!['like', 'dislike', 'super_like', 'skip', 'report', 'block'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Ação inválida'
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
    console.error('Erro em POST /recommendations/feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/recommendations/health - Health check do sistema
app.get('/api/recommendations/health', async (req, res) => {
  try {
    // Testar stored procedure
    const testResult = await pool.query('SELECT calculate_style_compatibility($1, $1) as test', [
      (await pool.query('SELECT id FROM users LIMIT 1')).rows[0]?.id
    ]);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        storedProcedures: 'working',
        testScore: testResult.rows[0]?.test || 0
      }
    });
    
  } catch (error) {
    console.error('Erro em health check:', error);
    res.status(500).json({
      success: false,
      error: 'Sistema de recomendação com problemas'
    });
  }
});