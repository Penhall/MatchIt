// server/routes/profile/weight-adjustment.js

const express = require('express');
const router = express.Router();
const WeightAdjustmentService = require('../../services/recommendation/weight-adjustment-service');
const FeedbackProcessor = require('../../services/recommendation/feedback-processor');
const { authenticateToken } = require('../../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

const weightAdjustmentService = new WeightAdjustmentService();
const feedbackProcessor = new FeedbackProcessor();

// Middleware para validação de entrada
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * POST /api/profile/weight-adjustment/feedback
 * Registra evento de feedback
 */
router.post('/feedback', 
  authenticateToken,
  [
    body('eventType').isIn([
      'swipe_right', 'swipe_left', 'super_like', 'message_sent', 
      'message_received', 'match_created', 'match_dissolved',
      'profile_view', 'profile_view_extended', 'conversation_started',
      'conversation_ended', 'date_planned', 'date_completed'
    ]).withMessage('Invalid event type'),
    body('targetUserId').isUUID().withMessage('Invalid target user ID'),
    body('screenType').optional().isString(),
    body('timeSpentViewing').optional().isInt({ min: 0 }),
    body('profilePosition').optional().isInt({ min: 0 }),
    body('totalProfilesShown').optional().isInt({ min: 1 }),
    body('userMood').optional().isObject(),
    body('styleCompatibility').optional().isFloat({ min: 0, max: 1 }),
    body('emotionalCompatibility').optional().isFloat({ min: 0, max: 1 }),
    body('reasonsForRecommendation').optional().isArray()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const eventData = {
        userId: req.user.id,
        ...req.body
      };

      const result = await feedbackProcessor.recordFeedbackEvent(eventData);
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error recording feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record feedback event'
      });
    }
  }
);

/**
 * GET /api/profile/weight-adjustment/analysis
 * Obtém análise de ajustes sugeridos
 */
router.get('/analysis',
  authenticateToken,
  [
    query('timeWindow').optional().isString().matches(/^\d+\s+(days?|hours?|weeks?)$/),
    query('includePatterns').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const timeWindow = req.query.timeWindow || '7 days';
      const analysis = await weightAdjustmentService.analyzeAndSuggestAdjustments(
        req.user.id,
        timeWindow
      );

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error analyzing adjustments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze weight adjustments'
      });
    }
  }
);

/**
 * POST /api/profile/weight-adjustment/apply
 * Aplica ajustes automáticos
 */
router.post('/apply',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await weightAdjustmentService.applyAutomaticAdjustments(req.user.id);
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error applying adjustments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply weight adjustments'
      });
    }
  }
);

/**
 * GET /api/profile/weight-adjustment/config
 * Obtém configuração atual de pesos
 */
router.get('/config',
  authenticateToken,
  async (req, res) => {
    try {
      const config = await weightAdjustmentService.getUserConfig(req.user.id);
      
      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('Error getting user config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user configuration'
      });
    }
  }
);

/**
 * PUT /api/profile/weight-adjustment/config
 * Atualiza configuração de ajuste automático
 */
router.put('/config',
  authenticateToken,
  [
    body('adaptationRate').optional().isFloat({ min: 0.1, max: 0.9 }),
    body('minConfidenceThreshold').optional().isFloat({ min: 0.1, max: 0.95 }),
    body('maxWeightChange').optional().isFloat({ min: 0.05, max: 0.5 }),
    body('temporalAdaptation').optional().isBoolean(),
    body('moodAdaptation').optional().isBoolean(),
    body('learningEnabled').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { Pool } = require('pg');
      const db = new Pool();
      
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      // Construir query dinâmica baseada nos campos fornecidos
      const allowedFields = [
        'adaptation_rate', 'min_confidence_threshold', 'max_weight_change',
        'temporal_adaptation', 'mood_adaptation', 'learning_enabled'
      ];

      const fieldMap = {
        adaptationRate: 'adaptation_rate',
        minConfidenceThreshold: 'min_confidence_threshold',
        maxWeightChange: 'max_weight_change',
        temporalAdaptation: 'temporal_adaptation',
        moodAdaptation: 'mood_adaptation',
        learningEnabled: 'learning_enabled'
      };

      for (const [clientField, dbField] of Object.entries(fieldMap)) {
        if (req.body[clientField] !== undefined) {
          updateFields.push(`${dbField} = $${paramCount + 1}`);
          updateValues.push(req.body[clientField]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const query = `
        UPDATE adaptive_recommendation_configs 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await db.query(query, [req.user.id, ...updateValues]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User configuration not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating user config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user configuration'
      });
    }
  }
);

/**
 * GET /api/profile/weight-adjustment/history
 * Obtém histórico de ajustes
 */
router.get('/history',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('attribute').optional().isString(),
    query('reason').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      let history = await weightAdjustmentService.getAdjustmentHistory(req.user.id, limit);
      
      // Filtrar por atributo se especificado
      if (req.query.attribute) {
        history = history.filter(adj => adj.attribute === req.query.attribute);
      }
      
      // Filtrar por razão se especificado
      if (req.query.reason) {
        history = history.filter(adj => adj.adjustment_reason === req.query.reason);
      }

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Error getting adjustment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get adjustment history'
      });
    }
  }
);

/**
 * GET /api/profile/weight-adjustment/analytics
 * Obtém analytics de feedback
 */
router.get('/analytics',
  authenticateToken,
  [
    query('period').optional().isIn(['daily', 'weekly', 'monthly']),
    query('days').optional().isInt({ min: 1, max: 90 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const period = req.query.period || 'daily';
      const days = parseInt(req.query.days) || 30;
      
      const { Pool } = require('pg');
      const db = new Pool();
      
      const query = `
        SELECT * FROM feedback_analytics 
        WHERE user_id = $1 
          AND period = $2 
          AND period_start >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY period_start DESC
      `;
      
      const result = await db.query(query, [req.user.id, period]);
      
      // Obter analytics em tempo real também
      const realTimeAnalytics = await feedbackProcessor.getRealTimeAnalytics(req.user.id);
      
      res.json({
        success: true,
        data: {
          historical: result.rows,
          realTime: realTimeAnalytics
        }
      });

    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback analytics'
      });
    }
  }
);

/**
 * POST /api/profile/weight-adjustment/manual
 * Aplica ajuste manual de pesos
 */
router.post('/manual',
  authenticateToken,
  [
    body('attribute').isIn([
      'age', 'location', 'interests', 'lifestyle', 'values',
      'appearance', 'personality', 'communication', 'goals',
      'emotionalIntelligence', 'humor', 'creativity'
    ]).withMessage('Invalid attribute'),
    body('newWeight').isFloat({ min: 0, max: 1 }).withMessage('Weight must be between 0 and 1'),
    body('reason').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { attribute, newWeight, reason = 'manual_adjustment' } = req.body;
      
      // Obter peso atual
      const config = await weightAdjustmentService.getUserConfig(req.user.id);
      const oldWeight = config.current_weights[attribute];
      
      // Registrar ajuste
      const adjustmentData = {
        attribute,
        oldWeight,
        newWeight,
        reason,
        confidence: 1.0, // Manual = 100% confiança
        dataPoints: 1
      };
      
      await weightAdjustmentService.applyWeightAdjustment(req.user.id, adjustmentData);
      
      // Atualizar configuração
      await weightAdjustmentService.updateUserWeights(req.user.id, [adjustmentData]);
      
      res.json({
        success: true,
        data: adjustmentData
      });

    } catch (error) {
      console.error('Error applying manual adjustment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply manual adjustment'
      });
    }
  }
);

/**
 * GET /api/profile/weight-adjustment/performance
 * Obtém estatísticas de performance do sistema
 */
router.get('/performance',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await weightAdjustmentService.getSystemPerformanceStats();
      
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get performance statistics'
      });
    }
  }
);

/**
 * POST /api/profile/weight-adjustment/reset
 * Reseta pesos para valores padrão
 */
router.post('/reset',
  authenticateToken,
  async (req, res) => {
    try {
      const { Pool } = require('pg');
      const db = new Pool();
      
      // Obter configuração atual
      const config = await weightAdjustmentService.getUserConfig(req.user.id);
      
      // Resetar para pesos base
      const query = `
        UPDATE adaptive_recommendation_configs 
        SET current_weights = base_weights, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [req.user.id]);
      
      // Registrar o reset como um ajuste
      const resetAdjustment = {
        attribute: 'all',
        oldWeight: 0,
        newWeight: 0,
        reason: 'manual_reset',
        confidence: 1.0,
        dataPoints: 1
      };
      
      await weightAdjustmentService.applyWeightAdjustment(req.user.id, resetAdjustment);
      
      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error resetting weights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset weights'
      });
    }
  }
);

/**
 * GET /api/profile/weight-adjustment/recommendations-effectiveness
 * Obtém efetividade das recomendações atuais
 */
router.get('/recommendations-effectiveness',
  authenticateToken,
  [
    query('days').optional().isInt({ min: 1, max: 30 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      
      const { Pool } = require('pg');
      const db = new Pool();
      
      const query = `
        SELECT 
          COUNT(*) as total_recommendations,
          COUNT(CASE WHEN event_type IN ('swipe_right', 'super_like') THEN 1 END) as positive_responses,
          COUNT(CASE WHEN event_type = 'swipe_left' THEN 1 END) as negative_responses,
          AVG(match_score) as avg_match_score,
          AVG(time_spent_viewing) as avg_viewing_time,
          COUNT(CASE WHEN time_spent_viewing > 10 THEN 1 END) as extended_views
        FROM feedback_events 
        WHERE user_id = $1 
          AND timestamp > NOW() - INTERVAL '${days} days'
      `;
      
      const result = await db.query(query, [req.user.id]);
      const stats = result.rows[0];
      
      // Calcular métricas de efetividade
      const effectiveness = {
        ...stats,
        positive_rate: stats.total_recommendations > 0 ? 
          stats.positive_responses / stats.total_recommendations : 0,
        engagement_rate: stats.total_recommendations > 0 ?
          stats.extended_views / stats.total_recommendations : 0,
        recommendation_quality: parseFloat(stats.avg_match_score) || 0
      };
      
      res.json({
        success: true,
        data: effectiveness
      });

    } catch (error) {
      console.error('Error getting recommendations effectiveness:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations effectiveness'
      });
    }
  }
);

module.exports = router;