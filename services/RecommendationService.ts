// services/RecommendationService.ts
// Serviço principal do Sistema de Recomendação MatchIt

import { Pool } from 'pg';
import { 
  RecommendationAlgorithm,
  FeedbackAction,
  RecommendationFilters,
  MatchScore,
  CompatibilityDimensions,
  RecommendationResult,
  UserAlgorithmWeights
} from '../types/recommendation';
import { 
  PostgreSQLUtils,
  RecommendationValidators,
  RecommendationFormatters,
  recommendationCache
} from '../utils/recommendationUtils';

/**
 * Configuração do serviço de recomendação
 */
interface RecommendationServiceConfig {
  defaultAlgorithm: RecommendationAlgorithm;
  maxRecommendations: number;
  minCompatibilityScore: number;
  cacheEnabled: boolean;
  cacheTTLMinutes: number;
}

/**
 * Resultado de feedback processado
 */
interface FeedbackResult {
  success: boolean;
  matchCreated?: boolean;
  weightsUpdated?: boolean;
  message: string;
}

/**
 * Serviço principal de recomendações
 */
export class RecommendationService {
  private pool: Pool;
  private config: RecommendationServiceConfig;

  constructor(
    pool: Pool,
    config: Partial<RecommendationServiceConfig> = {}
  ) {
    this.pool = pool;
    this.config = {
      defaultAlgorithm: 'hybrid',
      maxRecommendations: 20,
      minCompatibilityScore: 0.3,
      cacheEnabled: true,
      cacheTTLMinutes: 30,
      ...config
    };
  }

  /**
   * Obtém recomendações para um usuário
   */
  async getRecommendations(
    userId: string,
    options: {
      algorithm?: RecommendationAlgorithm;
      limit?: number;
      filters?: RecommendationFilters;
      forceRefresh?: boolean;
    } = {}
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    const algorithm = options.algorithm || this.config.defaultAlgorithm;
    const limit = Math.min(options.limit || 20, this.config.maxRecommendations);

    // Validar entrada
    if (!RecommendationValidators.isValidUUID(userId)) {
      throw new Error('Invalid userId format');
    }

    if (!RecommendationValidators.isValidAlgorithm(algorithm)) {
      throw new Error('Invalid algorithm specified');
    }

    // Verificar cache
    const cacheKey = `recommendations:${userId}:${algorithm}:${JSON.stringify(options.filters)}`;
    if (this.config.cacheEnabled && !options.forceRefresh) {
      const cached = recommendationCache.get<RecommendationResult>(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    try {
      // Buscar perfil do usuário atual
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Buscar candidatos potenciais
      const candidates = await this.findPotentialCandidates(userId, options.filters);

      // Calcular scores de compatibilidade
      const matchScores = await this.calculateCompatibilityScores(
        userId, 
        candidates, 
        algorithm
      );

      // Filtrar por score mínimo e limitar
      const filteredScores = matchScores
        .filter(score => score.overallScore >= this.config.minCompatibilityScore)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit);

      const processingTime = Date.now() - startTime;

      const result: RecommendationResult = {
        matches: filteredScores,
        totalCandidates: candidates.length,
        processingTime,
        algorithm,
        context: {
          sessionId: `session_${Date.now()}`,
          requestId: `req_${Date.now()}`,
          userId,
          timestamp: new Date(),
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
          isWeekend: [0, 6].includes(new Date().getDay()),
          userTimezone: 'UTC',
          deviceType: 'mobile',
          appVersion: '1.0.0',
          isVipUser: userProfile.isVip || false,
          requestedCount: limit,
          recentInteractions: [],
          sessionStartTime: new Date(),
          userActivity: {
            isOnline: true,
            lastSeenAt: new Date(),
            currentStatus: 'active',
            sessionDuration: 0,
            averageSessionDuration: 0,
            peakActivityHours: [],
            weeklyActivity: [],
            profilesViewedInSession: 0,
            interactionsInSession: 0,
            averageViewTimeToday: 0
          }
        },
        requestId: `req_${Date.now()}`,
        timestamp: new Date(),
        averageScore: filteredScores.length > 0 
          ? filteredScores.reduce((sum, score) => sum + score.overallScore, 0) / filteredScores.length 
          : 0,
        diversityScore: this.calculateDiversityScore(filteredScores),
        noveltyScore: 0.8, // Implementar cálculo real posteriormente
        fromCache: false,
        cacheHitRate: 0,
        version: '1.0.0'
      };

      // Salvar no cache
      if (this.config.cacheEnabled) {
        recommendationCache.set(
          cacheKey, 
          result, 
          this.config.cacheTTLMinutes * 60 * 1000
        );
      }

      // Registrar analytics
      await this.logRecommendationEvent(userId, result);

      return result;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Registra feedback do usuário
   */
  async recordFeedback(
    userId: string,
    targetUserId: string,
    action: FeedbackAction,
    context: any = {}
  ): Promise<FeedbackResult> {
    // Validações
    if (!RecommendationValidators.isValidUUID(userId) || !RecommendationValidators.isValidUUID(targetUserId)) {
      throw new Error('Invalid user ID format');
    }

    if (!RecommendationValidators.isValidFeedbackAction(action)) {
      throw new Error('Invalid feedback action');
    }

    if (userId === targetUserId) {
      throw new Error('Cannot provide feedback on own profile');
    }

    try {
      return await PostgreSQLUtils.executeTransaction(this.pool, async (client) => {
        // Registrar interação
        await client.query(`
          INSERT INTO user_interactions (
            user_id, target_user_id, action, context, created_at
          ) VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id, target_user_id) 
          DO UPDATE SET 
            action = EXCLUDED.action,
            context = EXCLUDED.context,
            created_at = NOW()
        `, [userId, targetUserId, action, JSON.stringify(context)]);

        let matchCreated = false;
        let weightsUpdated = false;

        // Verificar se cria match (se for like ou super_like)
        if (action === 'like' || action === 'super_like') {
          const mutualLikeResult = await client.query(`
            SELECT COUNT(*) FROM user_interactions 
            WHERE user_id = $1 AND target_user_id = $2 
            AND action IN ('like', 'super_like')
          `, [targetUserId, userId]);

          if (parseInt(mutualLikeResult.rows[0].count) > 0) {
            // Criar match se não existir
            await client.query(`
              INSERT INTO matches (
                user1_id, user2_id, compatibility_score, 
                algorithm_used, status, created_at
              ) VALUES (
                LEAST($1::uuid, $2::uuid), 
                GREATEST($1::uuid, $2::uuid), 
                0.75, 'mutual_like', 'active', NOW()
              ) ON CONFLICT (user1_id, user2_id) DO NOTHING
            `, [userId, targetUserId]);

            matchCreated = true;
          }

          // Atualizar pesos do algoritmo (aprendizado)
          await this.updateUserWeights(userId, targetUserId, action, client);
          weightsUpdated = true;
        }

        // Invalidar cache
        if (this.config.cacheEnabled) {
          // Invalidar cache do usuário que deu feedback
          recommendationCache.delete(`recommendations:${userId}:hybrid:`);
          recommendationCache.delete(`recommendations:${userId}:collaborative:`);
          recommendationCache.delete(`recommendations:${userId}:content:`);
        }

        return {
          success: true,
          matchCreated,
          weightsUpdated,
          message: matchCreated ? 'Match created!' : 'Feedback recorded successfully'
        };
      });

    } catch (error) {
      console.error('Error recording feedback:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<any> {
    if (!RecommendationValidators.isValidUUID(userId)) {
      throw new Error('Invalid userId format');
    }

    try {
      const result = await PostgreSQLUtils.executeQuery(this.pool, `
        SELECT * FROM get_user_engagement_metrics($1)
      `, [userId]);

      return result.rows[0] || {
        totalInteractions: 0,
        likeRate: 0,
        matchRate: 0,
        averageCompatibilityScore: 0,
        totalMatches: 0
      };

    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Busca perfil do usuário com dados necessários
   */
  private async getUserProfile(userId: string): Promise<any> {
    const result = await PostgreSQLUtils.executeQuery(this.pool, `
      SELECT 
        u.id, u.name, u.age, u.gender,
        up.display_name, up.city, up.is_vip,
        up.latitude, up.longitude,
        up.bio, up.avatar_url,
        sc.sneakers_choices, sc.clothing_choices, sc.colors_choices,
        sc.hobbies_choices, sc.feelings_choices,
        uaw.style_weight, uaw.emotional_weight, uaw.hobby_weight,
        uaw.location_weight, uaw.personality_weight
      FROM users u
      INNER JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN style_choices sc ON u.id = sc.user_id
      LEFT JOIN user_algorithm_weights uaw ON u.id = uaw.user_id
      WHERE u.id = $1 AND u.is_active = true
    `, [userId]);

    return result.rows[0] || null;
  }

  /**
   * Encontra candidatos potenciais
   */
  private async findPotentialCandidates(
    userId: string, 
    filters?: RecommendationFilters
  ): Promise<string[]> {
    const filterQuery = PostgreSQLUtils.buildFilterWhereClause(filters || {}, 2);
    
    const query = `
      SELECT u.id
      FROM users u
      INNER JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id != $1 
        AND u.is_active = true
        AND up.style_completion_percentage >= 50
        ${filterQuery.whereClause}
        AND NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = $1 AND ui.target_user_id = u.id 
          AND ui.created_at > NOW() - INTERVAL '24 hours'
        )
      ORDER BY up.last_active DESC
      LIMIT 100
    `;

    const result = await PostgreSQLUtils.executeQuery(
      this.pool, 
      query, 
      [userId, ...filterQuery.params]
    );

    return result.rows.map(row => row.id);
  }

  /**
   * Calcula scores de compatibilidade
   */
  private async calculateCompatibilityScores(
    userId: string,
    candidateIds: string[],
    algorithm: RecommendationAlgorithm
  ): Promise<MatchScore[]> {
    if (candidateIds.length === 0) return [];

    const scores: MatchScore[] = [];

    for (const candidateId of candidateIds) {
      try {
        // Usar stored procedure para calcular compatibilidade
        const result = await PostgreSQLUtils.executeQuery(this.pool, `
          SELECT * FROM calculate_overall_compatibility($1, $2, $3)
        `, [userId, candidateId, algorithm]);

        if (result.rows.length > 0) {
          const scoreData = result.rows[0];
          
          const matchScore: MatchScore = {
            id: `score_${Date.now()}_${candidateId}`,
            userId,
            targetUserId: candidateId,
            overallScore: scoreData.overall_score || 0,
            normalizedScore: Math.round((scoreData.overall_score || 0) * 100),
            percentile: 50, // Implementar cálculo real posteriormente
            dimensionScores: {
              style: scoreData.style_score || 0,
              emotional: scoreData.emotional_score || 0,
              hobby: scoreData.hobby_score || 0,
              location: scoreData.location_score || 0,
              personality: scoreData.personality_score || 0,
              lifestyle: 0,
              values: 0,
              communication: 0
            },
            weightedScores: {
              style: scoreData.weighted_style || 0,
              emotional: scoreData.weighted_emotional || 0,
              hobby: scoreData.weighted_hobby || 0,
              location: scoreData.weighted_location || 0,
              personality: scoreData.weighted_personality || 0,
              lifestyle: 0,
              values: 0,
              communication: 0
            },
            positiveFactors: [],
            negativeFactors: [],
            neutralFactors: [],
            explanation: {
              summary: `${Math.round((scoreData.overall_score || 0) * 100)}% compatibility based on your preferences`,
              headline: 'Good Match!',
              strengths: ['Compatible style preferences'],
              challenges: [],
              opportunities: ['Start a conversation'],
              styleInsight: 'Similar fashion tastes',
              personalityInsight: 'Complementary personalities',
              lifestyleInsight: 'Compatible lifestyle',
              conversationStarters: ['Ask about their interests'],
              sharedInterests: [],
              potentialActivities: [],
              brief: `${Math.round((scoreData.overall_score || 0) * 100)}% match`,
              detailed: 'You have compatible preferences in multiple areas',
              technical: `Algorithm: ${algorithm}, Score: ${scoreData.overall_score}`,
              tone: 'casual',
              confidence: scoreData.confidence || 0.7,
              isPersonalized: true
            },
            confidence: scoreData.confidence || 0.7,
            dataQuality: 0.8,
            algorithmCertainty: 0.8,
            context: {
              sessionId: `session_${Date.now()}`,
              requestId: `req_${Date.now()}`,
              userId,
              timestamp: new Date(),
              timeOfDay: new Date().getHours(),
              dayOfWeek: new Date().getDay(),
              isWeekend: [0, 6].includes(new Date().getDay()),
              userTimezone: 'UTC',
              deviceType: 'mobile',
              appVersion: '1.0.0',
              isVipUser: false,
              requestedCount: 20,
              recentInteractions: [],
              sessionStartTime: new Date(),
              userActivity: {
                isOnline: true,
                lastSeenAt: new Date(),
                currentStatus: 'active',
                sessionDuration: 0,
                averageSessionDuration: 0,
                peakActivityHours: [],
                weeklyActivity: [],
                profilesViewedInSession: 0,
                interactionsInSession: 0,
                averageViewTimeToday: 0
              }
            },
            algorithm,
            calculatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
            processingTime: 0,
            isHighConfidence: (scoreData.confidence || 0) > 0.8,
            isExperimental: algorithm !== 'hybrid',
            requiresReview: false
          };

          scores.push(matchScore);
        }
      } catch (error) {
        console.error(`Error calculating compatibility for ${candidateId}:`, error);
        // Continuar com outros candidatos
      }
    }

    return scores;
  }

  /**
   * Atualiza pesos do algoritmo baseado no feedback
   */
  private async updateUserWeights(
    userId: string,
    targetUserId: string,
    action: FeedbackAction,
    client: any
  ): Promise<void> {
    try {
      await client.query(`
        SELECT record_interaction_with_learning($1, $2, $3)
      `, [userId, targetUserId, action]);
    } catch (error) {
      console.error('Error updating user weights:', error);
      // Não interromper o fluxo principal
    }
  }

  /**
   * Calcula score de diversidade das recomendações
   */
  private calculateDiversityScore(scores: MatchScore[]): number {
    if (scores.length < 2) return 1.0;

    // Calcular variação nos scores de compatibilidade
    const scoreValues = scores.map(s => s.overallScore);
    const mean = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length;
    const variance = scoreValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scoreValues.length;
    
    // Normalizar para 0-1
    return Math.min(1.0, variance * 4); // Ajustar multiplicador conforme necessário
  }

  /**
   * Registra evento de analytics
   */
  private async logRecommendationEvent(
    userId: string,
    result: RecommendationResult
  ): Promise<void> {
    try {
      await PostgreSQLUtils.executeQuery(this.pool, `
        INSERT INTO analytics_events (
          user_id, event_type, event_name, properties, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [
        userId,
        'recommendation_event',
        'recommendations_generated',
        JSON.stringify({
          algorithm: result.algorithm,
          totalCandidates: result.totalCandidates,
          matchesReturned: result.matches.length,
          processingTime: result.processingTime,
          averageScore: result.averageScore
        })
      ]);
    } catch (error) {
      console.error('Error logging recommendation event:', error);
      // Não interromper o fluxo principal
    }
  }
}