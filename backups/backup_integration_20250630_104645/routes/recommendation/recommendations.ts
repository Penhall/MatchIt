// routes/recommendations.ts
// Rotas da API do Sistema de Recomendação MatchIt

import express, { Request, Response, NextFunction, Router } from 'express';
import { Pool } from 'pg';
import { RecommendationService } from '../../services/recommendation/RecommendationService';
import { 
  RecommendationValidators,
  RecommendationFormatters,
  recommendationRateLimiter
} from '../../utils/recommendation/recommendationUtils';
import { 
  RecommendationAlgorithm,
  FeedbackAction,
  RecommendationFilters
} from '../../types/recommendation';

/**
 * Cria router com todas as rotas de recomendação
 */
export function createRecommendationRoutes(pool: Pool): Router {
  const router = express.Router();
  const recommendationService = new RecommendationService(pool);

  // =====================================================
  // MIDDLEWARE ESPECÍFICO
  // =====================================================

  /**
   * Middleware de rate limiting para recomendações
   */
  const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId || req.ip;
    const identifier = `recommendations:${userId}`;

    if (!recommendationRateLimiter.isAllowed(identifier)) {
      res.status(429).json(
        RecommendationFormatters.formatErrorResponse(
          new Error('Rate limit exceeded. Too many recommendation requests.'),
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    next();
  };

  /**
   * Middleware de validação de autenticação
   */
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user?.userId) {
      res.status(401).json(
        RecommendationFormatters.formatErrorResponse(
          new Error('Authentication required'),
          req.headers['x-request-id'] as string
        )
      );
      return;
    }
    next();
  };

  // =====================================================
  // GET /api/recommendations
  // Obter recomendações para o usuário
  // =====================================================
  router.get('/', requireAuth, rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
      
      // Parse de parâmetros
      const algorithm = req.query.algorithm as RecommendationAlgorithm || 'hybrid';
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const forceRefresh = req.query.refresh === 'true';

      // Validar algoritmo
      if (!RecommendationValidators.isValidAlgorithm(algorithm)) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('Invalid algorithm. Must be one of: hybrid, collaborative, content, social, temporal'),
            requestId
          )
        );
        return;
      }

      // Parse de filtros
      const filters: RecommendationFilters = {};
      
      if (req.query.ageMin && req.query.ageMax) {
        filters.ageRange = [
          parseInt(req.query.ageMin as string),
          parseInt(req.query.ageMax as string)
        ];
      }

      if (req.query.maxDistance) {
        filters.maxDistance = parseInt(req.query.maxDistance as string);
      }

      if (req.query.genders) {
        filters.genders = (req.query.genders as string).split(',');
      }

      if (req.query.verifiedOnly === 'true') {
        filters.verifiedOnly = true;
      }

      if (req.query.vipOnly === 'true') {
        filters.vipOnly = true;
      }

      // Validar filtros
      const filterErrors = RecommendationValidators.validateRecommendationFilters(filters);
      if (filterErrors.length > 0) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error(`Invalid filters: ${filterErrors.join(', ')}`),
            requestId
          )
        );
        return;
      }

      // Obter recomendações
      const startTime = Date.now();
      const result = await recommendationService.getRecommendations(userId, {
        algorithm,
        limit,
        filters,
        forceRefresh
      });

      // Formatar resposta
      const formattedMatches = result.matches.map((match: any) => 
        RecommendationFormatters.formatMatchScoreForAPI(match)
      );

      const response = RecommendationFormatters.formatSuccessResponse(
        {
          recommendations: formattedMatches,
          totalCandidates: result.totalCandidates,
          algorithm: result.algorithm,
          diversityScore: Math.round(result.diversityScore * 100),
          noveltyScore: Math.round(result.noveltyScore * 100)
        },
        {
          requestId,
          processingTime: Date.now() - startTime,
          fromCache: result.fromCache,
          rateLimit: recommendationRateLimiter.getRateLimitInfo(`recommendations:${userId}`)
        }
      );

      res.json(response);

    } catch (error) {
      console.error('Error in GET /recommendations:', error);
      res.status(500).json(
        RecommendationFormatters.formatErrorResponse(
          error instanceof Error ? error : new Error('Unknown error'),
          req.headers['x-request-id'] as string
        )
      );
    }
  });

  // =====================================================
  // POST /api/recommendations/feedback
  // Registrar feedback do usuário
  // =====================================================
  router.post('/feedback', requireAuth, rateLimitMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
      const { targetUserId, action, context } = req.body;

      // Validações
      if (!targetUserId) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('targetUserId is required'),
            requestId
          )
        );
        return;
      }

      if (!action) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('action is required'),
            requestId
          )
        );
        return;
      }

      if (!RecommendationValidators.isValidUUID(targetUserId)) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('Invalid targetUserId format'),
            requestId
          )
        );
        return;
      }

      if (!RecommendationValidators.isValidFeedbackAction(action)) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('Invalid action. Must be one of: like, dislike, super_like, skip, report, block'),
            requestId
          )
        );
        return;
      }

      // Registrar feedback
      const result = await recommendationService.recordFeedback(
        userId,
        targetUserId,
        action as FeedbackAction,
        context || {}
      );

      const response = RecommendationFormatters.formatSuccessResponse(
        {
          success: result.success,
          matchCreated: result.matchCreated,
          weightsUpdated: result.weightsUpdated,
          message: result.message
        },
        {
          requestId,
          action,
          targetUserId
        }
      );

      res.json(response);

    } catch (error) {
      console.error('Error in POST /recommendations/feedback:', error);
      res.status(500).json(
        RecommendationFormatters.formatErrorResponse(
          error instanceof Error ? error : new Error('Unknown error'),
          req.headers['x-request-id'] as string
        )
      );
    }
  });

  // =====================================================
  // GET /api/recommendations/stats
  // Obter estatísticas do usuário
  // =====================================================
  router.get('/stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

      const stats = await recommendationService.getUserStats(userId);

      const response = RecommendationFormatters.formatSuccessResponse(
        stats,
        {
          requestId,
          userId
        }
      );

      res.json(response);

    } catch (error) {
      console.error('Error in GET /recommendations/stats:', error);
      res.status(500).json(
        RecommendationFormatters.formatErrorResponse(
          error instanceof Error ? error : new Error('Unknown error'),
          req.headers['x-request-id'] as string
        )
      );
    }
  });

  // =====================================================
  // GET /api/recommendations/health
  // Health check para o sistema de recomendação
  // =====================================================
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
      
      // Testar conexão com banco
      const result = await pool.query('SELECT NOW() as timestamp');
      
      const response = RecommendationFormatters.formatSuccessResponse(
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          dbTimestamp: result.rows[0].timestamp,
          cache: {
            enabled: true,
            stats: recommendationRateLimiter.getRateLimitInfo('health')
          }
        },
        {
          requestId,
          component: 'recommendation-system'
        }
      );

      res.json(response);

    } catch (error) {
      console.error('Error in GET /recommendations/health:', error);
      res.status(500).json(
        RecommendationFormatters.formatErrorResponse(
          error instanceof Error ? error : new Error('Unknown error'),
          req.headers['x-request-id'] as string
        )
      );
    }
  });

  // =====================================================
  // PUT /api/recommendations/preferences
  // Atualizar preferências de algoritmo do usuário
  // =====================================================
  router.put('/preferences', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
      const { weights, algorithm } = req.body;

      // Validar pesos se fornecidos
      if (weights && !RecommendationValidators.validateCompatibilityDimensions(weights)) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('Invalid weights format. All dimensions must be numbers between 0 and 1.'),
            requestId
          )
        );
        return;
      }

      // Validar algoritmo se fornecido
      if (algorithm && !RecommendationValidators.isValidAlgorithm(algorithm)) {
        res.status(400).json(
          RecommendationFormatters.formatErrorResponse(
            new Error('Invalid algorithm specified'),
            requestId
          )
        );
        return;
      }

      // Atualizar preferências no banco
      if (weights) {
        await pool.query(`
          INSERT INTO user_algorithm_weights (
            user_id, style_weight, emotional_weight, hobby_weight,
            location_weight, personality_weight, lifestyle_weight,
            values_weight, communication_weight, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            style_weight = EXCLUDED.style_weight,
            emotional_weight = EXCLUDED.emotional_weight,
            hobby_weight = EXCLUDED.hobby_weight,
            location_weight = EXCLUDED.location_weight,
            personality_weight = EXCLUDED.personality_weight,
            lifestyle_weight = EXCLUDED.lifestyle_weight,
            values_weight = EXCLUDED.values_weight,
            communication_weight = EXCLUDED.communication_weight,
            updated_at = NOW()
        `, [
          userId,
          weights.style,
          weights.emotional,
          weights.hobby,
          weights.location,
          weights.personality,
          weights.lifestyle || 0,
          weights.values || 0,
          weights.communication || 0
        ]);
      }

      const response = RecommendationFormatters.formatSuccessResponse(
        {
          message: 'Preferences updated successfully',
          weightsUpdated: !!weights,
          algorithmUpdated: !!algorithm
        },
        {
          requestId,
          userId
        }
      );

      res.json(response);

    } catch (error) {
      console.error('Error in PUT /recommendations/preferences:', error);
      res.status(500).json(
        RecommendationFormatters.formatErrorResponse(
          error instanceof Error ? error : new Error('Unknown error'),
          req.headers['x-request-id'] as string
        )
      );
    }
  });

  return router;
}
