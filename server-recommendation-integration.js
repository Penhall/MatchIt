// server-recommendation-integration.js
// Integração completa do Sistema de Recomendação com o server.js principal do MatchIt

import {
  validationRules,
  middlewares,
  handleValidationErrors
} from './middleware/recommendation-validation.js';
import { recommendationConfig } from './config/recommendation-config.js';

/**
 * Classe principal do serviço de recomendação integrado
 */
class IntegratedRecommendationService {
  constructor(databasePool) {
    this.pool = databasePool;
    this.config = recommendationConfig;
  }

  /**
   * Buscar recomendações para um usuário
   */
  async getRecommendationsForUser(userId, options = {}) {
    const client = await this.pool.connect();
    
    try {
      const {
        limit = 20,
        algorithm = 'hybrid',
        forceRefresh = false,
        minScore = 0.3,
        maxDistance = 50,
        ageRange = null
      } = options;

      // Verificar se há cache válido (se não for refresh forçado)
      if (!forceRefresh) {
        const cacheResult = await client.query(`
          SELECT cached_recommendations 
          FROM recommendation_cache 
          WHERE user_id = $1 
            AND cache_key = $2 
            AND expires_at > NOW()
          ORDER BY created_at DESC 
          LIMIT 1
        `, [userId, `${algorithm}_${limit}_${minScore}`]);

        if (cacheResult.rows.length > 0) {
          return JSON.parse(cacheResult.rows[0].cached_recommendations);
        }
      }

      // Buscar matches potenciais usando stored procedure
      const matchesResult = await client.query(`
        SELECT * FROM find_potential_matches($1, $2, $3, $4)
      `, [userId, limit * 2, minScore, maxDistance]); // Buscar mais para filtrar

      let recommendations = matchesResult.rows;

      // Aplicar filtros adicionais
      if (ageRange) {
        const [minAge, maxAge] = ageRange.split('-').map(Number);
        recommendations = recommendations.filter(rec => 
          rec.age >= minAge && rec.age <= maxAge
        );
      }

      // Limitar resultados finais
      recommendations = recommendations.slice(0, limit);

      // Enriquecer com dados do perfil
      const enrichedResults = await this.enrichRecommendations(client, recommendations);

      // Armazenar no cache
      await this.cacheRecommendations(client, userId, algorithm, enrichedResults, limit, minScore);

      // Registrar métricas
      await this.recordRecommendationMetrics(client, userId, {
        algorithm,
        totalCandidates: matchesResult.rows.length,
        finalResults: enrichedResults.length,
        processingTime: Date.now()
      });

      return {
        success: true,
        data: {
          recommendations: enrichedResults,
          metadata: {
            algorithm,
            totalCandidates: matchesResult.rows.length,
            returnedCount: enrichedResults.length,
            filters: { minScore, maxDistance, ageRange },
            cached: false,
            timestamp: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Registrar feedback do usuário
   */
  async recordUserFeedback(userId, targetUserId, action, context = {}) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Registrar interação básica
      const interactionResult = await client.query(`
        INSERT INTO user_interactions 
        (user_id, target_user_id, action, interaction_context, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [userId, targetUserId, action, JSON.stringify(context)]);

      // Usar stored procedure para aprendizado automático
      await client.query(`
        SELECT record_interaction_with_learning($1, $2, $3, $4)
      `, [userId, targetUserId, action, JSON.stringify(context)]);

      // Verificar se é um match mútuo
      if (action === 'like' || action === 'super_like') {
        const mutualLikeResult = await client.query(`
          SELECT 1 FROM user_interactions 
          WHERE user_id = $1 AND target_user_id = $2 
            AND action IN ('like', 'super_like')
        `, [targetUserId, userId]);

        // Se há like mútuo, criar match
        if (mutualLikeResult.rows.length > 0) {
          await client.query(`
            INSERT INTO matches (user1_id, user2_id, matched_at, match_score)
            VALUES ($1, $2, NOW(), 
              (SELECT calculate_overall_compatibility($1, $2))
            ) ON CONFLICT (user1_id, user2_id) DO NOTHING
          `, [Math.min(userId, targetUserId), Math.max(userId, targetUserId)]);
        }
      }

      // Registrar evento analítico
      await client.query(`
        INSERT INTO analytics_events 
        (user_id, event_type, event_data, session_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [
        userId, 
        'recommendation_feedback', 
        JSON.stringify({ action, targetUserId, ...context }),
        context.sessionId || null
      ]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Feedback registrado com sucesso',
        data: {
          interactionId: interactionResult.rows[0].id,
          isMatch: action === 'like' && mutualLikeResult?.rows.length > 0
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao registrar feedback:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(userId, period = 'week') {
    const client = await this.pool.connect();
    
    try {
      // Buscar estatísticas básicas
      const statsResult = await client.query(`
        SELECT * FROM v_user_recommendation_stats WHERE user_id = $1
      `, [userId]);

      // Buscar métricas de engajamento
      const engagementResult = await client.query(`
        SELECT * FROM get_user_engagement_metrics($1, $2)
      `, [userId, period]);

      // Buscar pesos atuais do algoritmo
      const weightsResult = await client.query(`
        SELECT style_compatibility_weight, location_weight, 
               personality_weight, lifestyle_weight, activity_weight,
               learning_rate
        FROM user_algorithm_weights 
        WHERE user_id = $1
      `, [userId]);

      return {
        success: true,
        data: {
          basic: statsResult.rows[0] || {},
          engagement: engagementResult.rows[0] || {},
          algorithmWeights: weightsResult.rows[0] || {},
          period,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Atualizar pesos do algoritmo
   */
  async updateAlgorithmWeights(userId, weights) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE user_algorithm_weights 
        SET style_compatibility_weight = COALESCE($2, style_compatibility_weight),
            location_weight = COALESCE($3, location_weight),
            personality_weight = COALESCE($4, personality_weight),
            lifestyle_weight = COALESCE($5, lifestyle_weight),
            activity_weight = COALESCE($6, activity_weight),
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `, [
        userId,
        weights.style_compatibility || null,
        weights.location || null,
        weights.personality || null,
        weights.lifestyle || null,
        weights.activity || null
      ]);

      if (result.rows.length === 0) {
        // Criar registro se não existir
        await client.query(`
          INSERT INTO user_algorithm_weights 
          (user_id, style_compatibility_weight, location_weight, 
           personality_weight, lifestyle_weight, activity_weight)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          userId,
          weights.style_compatibility || 0.30,
          weights.location || 0.25,
          weights.personality || 0.20,
          weights.lifestyle || 0.15,
          weights.activity || 0.10
        ]);
      }

      return {
        success: true,
        message: 'Pesos atualizados com sucesso',
        data: result.rows[0] || weights
      };

    } catch (error) {
      console.error('Erro ao atualizar pesos:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Métodos auxiliares privados
  async enrichRecommendations(client, recommendations) {
    if (recommendations.length === 0) return [];

    const userIds = recommendations.map(r => r.user_id).join("','");
    
    const profilesResult = await client.query(`
      SELECT u.id, u.name, up.display_name, up.age, up.city, 
             up.avatar_url, up.bio, up.is_vip,
             COALESCE(up.last_active, u.created_at) as last_active
      FROM users u
      INNER JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id IN ('${userIds}')
    `);

    const profilesMap = new Map(profilesResult.rows.map(p => [p.id, p]));

    return recommendations.map(rec => ({
      ...rec,
      profile: profilesMap.get(rec.user_id) || {},
      score: parseFloat(rec.compatibility_score || rec.total_score || 0),
      explanation: rec.score_explanation ? JSON.parse(rec.score_explanation) : []
    }));
  }

  async cacheRecommendations(client, userId, algorithm, results, limit, minScore) {
    try {
      await client.query(`
        INSERT INTO recommendation_cache 
        (user_id, cache_key, cached_recommendations, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')
        ON CONFLICT (user_id, cache_key) DO UPDATE SET
          cached_recommendations = EXCLUDED.cached_recommendations,
          expires_at = EXCLUDED.expires_at,
          created_at = NOW()
      `, [
        userId,
        `${algorithm}_${limit}_${minScore}`,
        JSON.stringify(results)
      ]);
    } catch (error) {
      console.warn('Erro ao cachear recomendações:', error);
    }
  }

  async recordRecommendationMetrics(client, userId, metrics) {
    try {
      await client.query(`
        INSERT INTO analytics_events 
        (user_id, event_type, event_data, created_at)
        VALUES ($1, 'recommendation_generated', $2, NOW())
      `, [userId, JSON.stringify(metrics)]);
    } catch (error) {
      console.warn('Erro ao registrar métricas:', error);
    }
  }
}

/**
 * Função para configurar e integrar as rotas de recomendação ao Express app
 */
export function setupRecommendationRoutes(app, databasePool, authenticateToken) {
  const recommendationService = new IntegratedRecommendationService(databasePool);

  // Aplicar middlewares gerais às rotas de recomendação
  app.use('/api/recommendations', middlewares.logRecommendationRequest);
  app.use('/api/recommendations', middlewares.recommendationRateLimit);

  // GET /api/recommendations - Buscar recomendações
  app.get('/api/recommendations',
    authenticateToken,
    middlewares.requireCompleteProfile,
    validationRules.getRecommendations,
    async (req, res) => {
      try {
        const options = {
          limit: req.query.limit || 20,
          algorithm: req.query.algorithm || 'hybrid',
          forceRefresh: req.query.refresh || false,
          minScore: req.query.minScore || 0.3,
          maxDistance: req.query.maxDistance || 50,
          ageRange: req.query.ageRange || null
        };

        const result = await recommendationService.getRecommendationsForUser(
          req.user.userId, 
          options
        );

        res.json(result);
      } catch (error) {
        console.error('Erro no endpoint de recomendações:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          message: 'Não foi possível gerar recomendações no momento'
        });
      }
    }
  );

  // POST /api/recommendations/feedback - Registrar feedback
  app.post('/api/recommendations/feedback',
    authenticateToken,
    validationRules.postFeedback,
    async (req, res) => {
      try {
        const { targetUserId, action, context } = req.body;

        const result = await recommendationService.recordUserFeedback(
          req.user.userId,
          targetUserId,
          action,
          context
        );

        res.json(result);
      } catch (error) {
        console.error('Erro ao registrar feedback:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }
  );

  // GET /api/recommendations/stats - Estatísticas do usuário
  app.get('/api/recommendations/stats',
    authenticateToken,
    validationRules.getStats,
    async (req, res) => {
      try {
        const period = req.query.period || 'week';
        const result = await recommendationService.getUserStats(req.user.userId, period);
        res.json(result);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }
  );

  // PUT /api/recommendations/weights - Atualizar pesos do algoritmo
  app.put('/api/recommendations/weights',
    authenticateToken,
    validationRules.updateWeights,
    async (req, res) => {
      try {
        const { weights } = req.body;
        const result = await recommendationService.updateAlgorithmWeights(
          req.user.userId, 
          weights
        );
        res.json(result);
      } catch (error) {
        console.error('Erro ao atualizar pesos:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }
  );

  // GET /api/recommendations/health - Health check específico
  app.get('/api/recommendations/health', async (req, res) => {
    try {
      const client = await databasePool.connect();
      
      // Testar stored procedures principais
      await client.query('SELECT 1 FROM system_config LIMIT 1');
      const testResult = await client.query(`
        SELECT calculate_style_compatibility(
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002'
        ) as test_score
      `);
      
      client.release();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          storedProcedures: 'functional',
          cache: 'enabled'
        },
        version: '1.3.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  console.log('✅ Rotas de recomendação integradas ao servidor principal');
  return recommendationService;
}

export { IntegratedRecommendationService };
