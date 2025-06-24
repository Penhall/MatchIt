// server/services/recommendation/adaptive-recommendation-engine.js

const { Pool } = require('pg');
const WeightAdjustmentService = require('./weight-adjustment-service');
const FeedbackProcessor = require('./feedback-processor');
const EnhancedMatchScoreCalculator = require('./enhanced-match-score-calculator');

const db = new Pool();

class AdaptiveRecommendationEngine {
  constructor() {
    this.weightAdjustmentService = new WeightAdjustmentService();
    this.feedbackProcessor = new FeedbackProcessor();
    this.matchScoreCalculator = new EnhancedMatchScoreCalculator();
    
    // Cache para otimização
    this.userConfigCache = new Map();
    this.userProfileCache = new Map();
    this.cacheExpiration = 5 * 60 * 1000; // 5 minutos
    
    // Configurações do algoritmo
    this.DIVERSITY_FACTOR = 0.15; // Fator de diversidade nas recomendações
    this.EXPLORATION_RATE = 0.1; // Taxa de exploração vs exploração
    this.TEMPORAL_WEIGHT_FACTOR = 0.05; // Influência do tempo nas recomendações
    this.MOOD_INFLUENCE_FACTOR = 0.1; // Influência do humor
    
    // Iniciar processamento em background
    this.startBackgroundProcessing();
  }

  /**
   * Gera recomendações personalizadas e adaptativas
   */
  async generateAdaptiveRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        excludeIds = [],
        includeExploration = true,
        contextualHints = {}
      } = options;

      // Obter configuração adaptativa do usuário
      const userConfig = await this.getUserConfigCached(userId);
      
      // Obter perfil do usuário
      const userProfile = await this.getUserProfileCached(userId);
      
      // Ajustar pesos baseado no contexto atual
      const contextualWeights = await this.calculateContextualWeights(
        userId, 
        userConfig, 
        contextualHints
      );

      // Obter candidatos potenciais
      const candidates = await this.getCandidateUsers(userId, excludeIds, limit * 3);
      
      // Calcular scores com pesos adaptativos
      const scoredCandidates = await this.calculateAdaptiveScores(
        userId,
        candidates,
        contextualWeights,
        userProfile
      );

      // Aplicar diversidade e exploração
      const diversifiedCandidates = this.applyDiversificationStrategy(
        scoredCandidates,
        userConfig,
        includeExploration
      );

      // Selecionar top recomendações
      const recommendations = diversifiedCandidates.slice(0, limit);

      // Registrar contexto da recomendação para feedback futuro
      await this.logRecommendationContext(userId, recommendations, contextualWeights);

      return {
        recommendations: recommendations.map(rec => ({
          userId: rec.userId,
          matchScore: rec.adaptiveScore,
          baseScore: rec.baseScore,
          adaptiveFactors: rec.adaptiveFactors,
          confidenceScore: rec.confidenceScore,
          reasonsForRecommendation: rec.reasons,
          diversityScore: rec.diversityScore,
          explorationFlag: rec.isExploration || false
        })),
        metadata: {
          totalCandidates: candidates.length,
          diversityApplied: true,
          explorationIncluded: includeExploration,
          contextualFactors: contextualWeights.factors,
          algorithmVersion: '2.0.0'
        }
      };

    } catch (error) {
      console.error('Error generating adaptive recommendations:', error);
      throw error;
    }
  }

  /**
   * Calcula pesos contextuais baseados na situação atual
   */
  async calculateContextualWeights(userId, userConfig, contextualHints) {
    const baseWeights = { ...userConfig.current_weights };
    const factors = {};

    // Ajuste temporal
    if (userConfig.temporal_adaptation) {
      const temporalAdjustment = await this.calculateTemporalAdjustment(userId);
      factors.temporal = temporalAdjustment;
      this.applyWeightAdjustment(baseWeights, temporalAdjustment.weights, this.TEMPORAL_WEIGHT_FACTOR);
    }

    // Ajuste por humor
    if (userConfig.mood_adaptation) {
      const moodAdjustment = await this.calculateMoodAdjustment(userId);
      if (moodAdjustment.hasData) {
        factors.mood = moodAdjustment;
        this.applyWeightAdjustment(baseWeights, moodAdjustment.weights, this.MOOD_INFLUENCE_FACTOR);
      }
    }

    // Ajuste por contexto da sessão
    if (contextualHints.timeOfDay) {
      const sessionAdjustment = this.calculateSessionAdjustment(contextualHints);
      factors.session = sessionAdjustment;
      this.applyWeightAdjustment(baseWeights, sessionAdjustment.weights, 0.05);
    }

    // Ajuste por padrões de uso recente
    const recentPatterns = await this.analyzeRecentPatterns(userId);
    if (recentPatterns.hasPatterns) {
      factors.recentPatterns = recentPatterns;
      this.applyWeightAdjustment(baseWeights, recentPatterns.suggestedWeights, 0.1);
    }

    // Normalizar pesos
    this.normalizeWeights(baseWeights);

    return {
      weights: baseWeights,
      factors,
      confidence: this.calculateContextualConfidence(factors)
    };
  }

  /**
   * Calcula ajuste temporal baseado no horário e padrões do usuário
   */
  async calculateTemporalAdjustment(userId) {
    const currentHour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Buscar padrões temporais do usuário
    const query = `
      SELECT 
        time_of_day,
        day_of_week,
        AVG(match_score) as avg_score,
        COUNT(*) as event_count,
        COUNT(CASE WHEN event_type IN ('swipe_right', 'super_like') THEN 1 END) as positive_count
      FROM feedback_events 
      WHERE user_id = $1 
        AND timestamp > NOW() - INTERVAL '30 days'
      GROUP BY time_of_day, day_of_week
      HAVING COUNT(*) >= 3
    `;
    
    const result = await db.query(query, [userId]);
    const patterns = result.rows;

    if (patterns.length === 0) {
      return { hasData: false, weights: {} };
    }

    // Determinar período atual
    const currentTimeOfDay = this.getTimeOfDay(currentHour);
    const currentPattern = patterns.find(p => 
      p.time_of_day === currentTimeOfDay && 
      p.day_of_week == dayOfWeek
    );

    if (!currentPattern) {
      return { hasData: false, weights: {} };
    }

    // Calcular ajustes baseados no padrão
    const positiveRate = currentPattern.positive_count / currentPattern.event_count;
    const adjustment = {};

    // Ajustar pesos baseado na taxa de sucesso neste período
    if (positiveRate > 0.6) {
      // Período de alta atividade - aumentar pesos de atração
      adjustment.appearance = 0.1;
      adjustment.personality = 0.1;
      adjustment.interests = -0.05;
    } else if (positiveRate < 0.3) {
      // Período mais seletivo - focar em compatibilidade
      adjustment.values = 0.1;
      adjustment.lifestyle = 0.1;
      adjustment.appearance = -0.1;
    }

    return {
      hasData: true,
      weights: adjustment,
      pattern: currentPattern,
      confidence: Math.min(0.8, currentPattern.event_count / 20)
    };
  }

  /**
   * Calcula ajuste baseado no humor atual
   */
  async calculateMoodAdjustment(userId) {
    try {
      const query = `
        SELECT current_state 
        FROM emotional_profiles 
        WHERE user_id = $1 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return { hasData: false, weights: {} };
      }

      const mood = result.rows[0].current_state;
      const adjustment = {};

      // Ajustar pesos baseado no estado emocional
      if (mood.happiness > 0.7) {
        // Humor positivo - mais aberto a variedade
        adjustment.humor = 0.15;
        adjustment.creativity = 0.1;
        adjustment.values = -0.05;
      } else if (mood.happiness < 0.3) {
        // Humor baixo - focar em compatibilidade emocional
        adjustment.emotionalIntelligence = 0.2;
        adjustment.values = 0.1;
        adjustment.appearance = -0.1;
      }

      if (mood.energy > 0.7) {
        // Alta energia - mais interesse em atividades
        adjustment.lifestyle = 0.1;
        adjustment.interests = 0.1;
      } else if (mood.energy < 0.3) {
        // Baixa energia - preferir compatibilidade tranquila
        adjustment.communication = 0.1;
        adjustment.personality = 0.1;
      }

      if (mood.social > 0.7) {
        // Sociável - focar em comunicação
        adjustment.communication = 0.15;
        adjustment.personality = 0.1;
      } else if (mood.social < 0.3) {
        // Menos sociável - focar em compatibilidade básica
        adjustment.values = 0.1;
        adjustment.goals = 0.1;
      }

      return {
        hasData: true,
        weights: adjustment,
        mood,
        confidence: 0.6
      };

    } catch (error) {
      console.error('Error calculating mood adjustment:', error);
      return { hasData: false, weights: {} };
    }
  }

  /**
   * Calcula scores adaptativos para os candidatos
   */
  async calculateAdaptiveScores(userId, candidates, contextualWeights, userProfile) {
    const scoredCandidates = [];

    for (const candidate of candidates) {
      try {
        // Score base usando algoritmo existente
        const baseScore = await this.matchScoreCalculator.calculateEnhancedMatchScore(
          userProfile,
          candidate,
          contextualWeights.weights
        );

        // Fatores adaptativos
        const adaptiveFactors = await this.calculateAdaptiveFactors(
          userId,
          candidate,
          contextualWeights
        );

        // Score adaptativo final
        const adaptiveScore = this.combineScores(baseScore, adaptiveFactors);

        // Confiança da recomendação
        const confidenceScore = this.calculateRecommendationConfidence(
          baseScore,
          adaptiveFactors,
          contextualWeights.confidence
        );

        // Razões da recomendação
        const reasons = this.generateRecommendationReasons(
          baseScore,
          adaptiveFactors,
          contextualWeights
        );

        scoredCandidates.push({
          userId: candidate.id,
          userData: candidate,
          baseScore: baseScore.totalScore,
          adaptiveScore,
          adaptiveFactors,
          confidenceScore,
          reasons,
          contextualWeights: contextualWeights.weights
        });

      } catch (error) {
        console.error(`Error scoring candidate ${candidate.id}:`, error);
        continue;
      }
    }

    return scoredCandidates.sort((a, b) => b.adaptiveScore - a.adaptiveScore);
  }

  /**
   * Calcula fatores adaptativos específicos
   */
  async calculateAdaptiveFactors(userId, candidate, contextualWeights) {
    const factors = {};

    // Fator de novidade
    factors.novelty = await this.calculateNoveltyFactor(userId, candidate);

    // Fator de diversidade
    factors.diversity = await this.calculateDiversityFactor(userId, candidate);

    // Fator de popularidade
    factors.popularity = await this.calculatePopularityFactor(candidate);

    // Fator de atividade recente
    factors.recency = await this.calculateRecencyFactor(candidate);

    // Fator de compatibilidade temporal
    factors.temporalCompatibility = this.calculateTemporalCompatibility(
      contextualWeights.factors?.temporal,
      candidate
    );

    return factors;
  }

  /**
   * Aplica estratégia de diversificação
   */
  applyDiversificationStrategy(candidates, userConfig, includeExploration) {
    const diversified = [...candidates];

    // Calcular scores de diversidade
    for (let i = 0; i < diversified.length; i++) {
      diversified[i].diversityScore = this.calculateDiversityScore(
        diversified[i],
        diversified.slice(0, i)
      );
    }

    // Aplicar exploração vs exploração
    if (includeExploration) {
      const explorationCount = Math.ceil(diversified.length * this.EXPLORATION_RATE);
      
      // Marcar alguns candidatos como exploração
      for (let i = 0; i < explorationCount; i++) {
        const randomIndex = Math.floor(Math.random() * diversified.length);
        diversified[randomIndex].isExploration = true;
        diversified[randomIndex].adaptiveScore *= 0.9; // Pequena penalidade para exploração
      }
    }

    // Re-ordenar considerando diversidade
    return diversified.sort((a, b) => {
      const scoreA = a.adaptiveScore + (a.diversityScore * this.DIVERSITY_FACTOR);
      const scoreB = b.adaptiveScore + (b.diversityScore * this.DIVERSITY_FACTOR);
      return scoreB - scoreA;
    });
  }

  /**
   * Inicia processamento em background
   */
  startBackgroundProcessing() {
    // Processar ajustes automáticos a cada 5 minutos
    setInterval(() => {
      this.processAutomaticAdjustments();
    }, 5 * 60 * 1000);

    // Limpar cache a cada 10 minutos
    setInterval(() => {
      this.clearExpiredCache();
    }, 10 * 60 * 1000);

    // Análise de tendências a cada hora
    setInterval(() => {
      this.analyzeTrends();
    }, 60 * 60 * 1000);
  }

  /**
   * Processa ajustes automáticos para usuários ativos
   */
  async processAutomaticAdjustments() {
    try {
      // Buscar usuários com atividade recente
      const query = `
        SELECT DISTINCT user_id 
        FROM feedback_events 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `;
      
      const result = await db.query(query);
      const activeUsers = result.rows;

      for (const user of activeUsers) {
        try {
          await this.weightAdjustmentService.applyAutomaticAdjustments(user.user_id);
        } catch (error) {
          console.error(`Error processing adjustments for user ${user.user_id}:`, error);
        }
      }

      console.log(`Processed automatic adjustments for ${activeUsers.length} users`);
    } catch (error) {
      console.error('Error in background adjustment processing:', error);
    }
  }

  /**
   * Analisa tendências globais
   */
  async analyzeTrends() {
    try {
      // Implementar análise de tendências
      console.log('Analyzing global trends...');
      
      // Exemplo: detectar padrões sazonais, mudanças de comportamento, etc.
      const trends = await this.detectGlobalTrends();
      
      // Salvar tendências para uso futuro
      await this.saveTrends(trends);
      
    } catch (error) {
      console.error('Error analyzing trends:', error);
    }
  }

  // Métodos auxiliares...
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  applyWeightAdjustment(weights, adjustment, factor) {
    for (const [attr, value] of Object.entries(adjustment)) {
      if (weights[attr] !== undefined) {
        weights[attr] += value * factor;
      }
    }
  }

  normalizeWeights(weights) {
    const total = Object.values(weights).reduce((sum, w) => sum + Math.max(0, w), 0);
    if (total > 0) {
      for (const attr of Object.keys(weights)) {
        weights[attr] = Math.max(0, weights[attr]) / total;
      }
    }
  }

  calculateContextualConfidence(factors) {
    const factorCount = Object.keys(factors).length;
    const avgConfidence = Object.values(factors)
      .filter(f => f.confidence !== undefined)
      .reduce((sum, f) => sum + f.confidence, 0) / factorCount;
      
    return Math.min(0.9, avgConfidence || 0.5);
  }

  combineScores(baseScore, adaptiveFactors) {
    let score = baseScore.totalScore;
    
    // Aplicar fatores adaptativos
    if (adaptiveFactors.novelty) score += adaptiveFactors.novelty * 0.1;
    if (adaptiveFactors.diversity) score += adaptiveFactors.diversity * 0.05;
    if (adaptiveFactors.recency) score += adaptiveFactors.recency * 0.05;
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  calculateRecommendationConfidence(baseScore, adaptiveFactors, contextualConfidence) {
    return Math.min(0.95, (baseScore.confidence + contextualConfidence) / 2);
  }

  generateRecommendationReasons(baseScore, adaptiveFactors, contextualWeights) {
    const reasons = [...(baseScore.reasons || [])];
    
    if (adaptiveFactors.novelty > 0.5) {
      reasons.push('Perfil único que pode interessar');
    }
    
    if (contextualWeights.factors?.mood?.hasData) {
      reasons.push('Compatível com seu humor atual');
    }
    
    if (contextualWeights.factors?.temporal?.hasData) {
      reasons.push('Popular neste horário');
    }
    
    return reasons;
  }

  // Cache methods
  async getUserConfigCached(userId) {
    const cacheKey = `config_${userId}`;
    const cached = this.userConfigCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
      return cached.data;
    }
    
    const config = await this.weightAdjustmentService.getUserConfig(userId);
    this.userConfigCache.set(cacheKey, {
      data: config,
      timestamp: Date.now()
    });
    
    return config;
  }

  async getUserProfileCached(userId) {
    const cacheKey = `profile_${userId}`;
    const cached = this.userProfileCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
      return cached.data;
    }
    
    const profile = await this.loadUserProfile(userId);
    this.userProfileCache.set(cacheKey, {
      data: profile,
      timestamp: Date.now()
    });
    
    return profile;
  }

  clearExpiredCache() {
    const now = Date.now();
    
    for (const [key, value] of this.userConfigCache.entries()) {
      if (now - value.timestamp > this.cacheExpiration) {
        this.userConfigCache.delete(key);
      }
    }
    
    for (const [key, value] of this.userProfileCache.entries()) {
      if (now - value.timestamp > this.cacheExpiration) {
        this.userProfileCache.delete(key);
      }
    }
  }

  // Placeholder methods para implementação futura
  async getCandidateUsers(userId, excludeIds, limit) {
    // Implementar busca de candidatos
    return [];
  }

  async loadUserProfile(userId) {
    // Implementar carregamento de perfil
    return {};
  }

  async calculateNoveltyFactor(userId, candidate) {
    return 0.5; // Placeholder
  }

  async calculateDiversityFactor(userId, candidate) {
    return 0.5; // Placeholder
  }

  async calculatePopularityFactor(candidate) {
    return 0.5; // Placeholder
  }

  async calculateRecencyFactor(candidate) {
    return 0.5; // Placeholder
  }

  calculateTemporalCompatibility(temporalFactor, candidate) {
    return 0.5; // Placeholder
  }

  calculateDiversityScore(candidate, previousCandidates) {
    return 0.5; // Placeholder
  }

  calculateSessionAdjustment(hints) {
    return { weights: {} }; // Placeholder
  }

  async analyzeRecentPatterns(userId) {
    return { hasPatterns: false }; // Placeholder
  }

  async logRecommendationContext(userId, recommendations, weights) {
    // Implementar log de contexto
  }

  async detectGlobalTrends() {
    return {}; // Placeholder
  }

  async saveTrends(trends) {
    // Implementar salvamento de tendências
  }
}

module.exports = AdaptiveRecommendationEngine;