// server/services/recommendation/weight-adjustment-service.js

const { Pool } = require('pg');
const db = new Pool();

class WeightAdjustmentService {
  constructor() {
    this.DEFAULT_WEIGHTS = {
      age: 0.15,
      location: 0.20,
      interests: 0.25,
      lifestyle: 0.10,
      values: 0.15,
      appearance: 0.05,
      personality: 0.05,
      communication: 0.03,
      goals: 0.02,
      emotionalIntelligence: 0.00,
      humor: 0.00,
      creativity: 0.00
    };
    
    this.ADJUSTMENT_RATES = {
      slow: 0.1,
      medium: 0.3,
      fast: 0.5
    };
    
    this.MIN_FEEDBACK_EVENTS = 10; // Mínimo de eventos para ajustar
    this.MAX_WEIGHT_CHANGE = 0.2; // Máxima mudança por ajuste
    this.MIN_CONFIDENCE = 0.6; // Confiança mínima para aplicar ajuste
  }

  /**
   * Analisa feedback recente e sugere ajustes de pesos
   */
  async analyzeAndSuggestAdjustments(userId, timeWindow = '7 days') {
    try {
      const config = await this.getUserConfig(userId);
      const feedbackData = await this.getFeedbackData(userId, timeWindow);
      
      if (feedbackData.length < this.MIN_FEEDBACK_EVENTS) {
        return {
          adjustments: [],
          reason: 'Insufficient feedback data',
          dataPoints: feedbackData.length
        };
      }

      const patterns = await this.identifyPatterns(feedbackData);
      const suggestions = await this.generateAdjustments(patterns, config);
      
      return {
        adjustments: suggestions,
        patterns: patterns,
        dataPoints: feedbackData.length,
        confidence: this.calculateOverallConfidence(suggestions)
      };

    } catch (error) {
      console.error('Error analyzing feedback for adjustments:', error);
      throw error;
    }
  }

  /**
   * Aplica ajustes de pesos automaticamente
   */
  async applyAutomaticAdjustments(userId) {
    try {
      const suggestions = await this.analyzeAndSuggestAdjustments(userId);
      
      if (suggestions.adjustments.length === 0) {
        return { applied: 0, reason: suggestions.reason };
      }

      const appliedAdjustments = [];
      
      for (const adjustment of suggestions.adjustments) {
        if (adjustment.confidence >= this.MIN_CONFIDENCE) {
          await this.applyWeightAdjustment(userId, adjustment);
          appliedAdjustments.push(adjustment);
        }
      }

      // Atualizar configuração do usuário
      if (appliedAdjustments.length > 0) {
        await this.updateUserWeights(userId, appliedAdjustments);
        await this.updateLearningProfile(userId, appliedAdjustments);
      }

      return {
        applied: appliedAdjustments.length,
        total: suggestions.adjustments.length,
        adjustments: appliedAdjustments
      };

    } catch (error) {
      console.error('Error applying automatic adjustments:', error);
      throw error;
    }
  }

  /**
   * Obtém dados de feedback para análise
   */
  async getFeedbackData(userId, timeWindow) {
    const query = `
      SELECT 
        fe.*,
        CASE 
          WHEN fe.event_type IN ('swipe_right', 'super_like', 'message_sent', 'match_created') 
          THEN 'positive'
          WHEN fe.event_type = 'swipe_left' 
          THEN 'negative'
          ELSE 'neutral'
        END as feedback_category
      FROM feedback_events fe
      WHERE fe.user_id = $1 
        AND fe.timestamp > NOW() - INTERVAL '${timeWindow}'
      ORDER BY fe.timestamp DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Identifica padrões no feedback
   */
  async identifyPatterns(feedbackData) {
    const patterns = {
      attributePerformance: {},
      temporalPatterns: {},
      moodInfluence: {},
      viewingBehavior: {}
    };

    // Análise de performance por atributo
    const positiveEvents = feedbackData.filter(f => f.feedback_category === 'positive');
    const negativeEvents = feedbackData.filter(f => f.feedback_category === 'negative');

    for (const attribute of Object.keys(this.DEFAULT_WEIGHTS)) {
      patterns.attributePerformance[attribute] = this.analyzeAttributePerformance(
        attribute, positiveEvents, negativeEvents
      );
    }

    // Análise temporal
    patterns.temporalPatterns = this.analyzeTemporalPatterns(feedbackData);
    
    // Análise de influência do humor
    patterns.moodInfluence = this.analyzeMoodInfluence(feedbackData);
    
    // Análise de comportamento de visualização
    patterns.viewingBehavior = this.analyzeViewingBehavior(feedbackData);

    return patterns;
  }

  /**
   * Analisa performance de um atributo específico
   */
  analyzeAttributePerformance(attribute, positiveEvents, negativeEvents) {
    const positiveValues = positiveEvents
      .map(e => e.target_user_attributes[attribute])
      .filter(v => v !== undefined);
    
    const negativeValues = negativeEvents
      .map(e => e.target_user_attributes[attribute])
      .filter(v => v !== undefined);

    if (positiveValues.length === 0 && negativeValues.length === 0) {
      return { trend: 'insufficient_data', confidence: 0 };
    }

    const positiveAvg = positiveValues.length > 0 ? 
      positiveValues.reduce((a, b) => a + b, 0) / positiveValues.length : 0;
    
    const negativeAvg = negativeValues.length > 0 ? 
      negativeValues.reduce((a, b) => a + b, 0) / negativeValues.length : 0;

    const difference = positiveAvg - negativeAvg;
    const significance = Math.abs(difference);
    
    let trend = 'stable';
    if (significance > 0.2) {
      trend = difference > 0 ? 'increase_weight' : 'decrease_weight';
    }

    return {
      trend,
      difference,
      significance,
      confidence: Math.min(0.9, significance * 2),
      positiveAvg,
      negativeAvg,
      dataPoints: positiveValues.length + negativeValues.length
    };
  }

  /**
   * Analisa padrões temporais
   */
  analyzeTemporalPatterns(feedbackData) {
    const timeGroups = {
      morning: feedbackData.filter(f => f.time_of_day === 'morning'),
      afternoon: feedbackData.filter(f => f.time_of_day === 'afternoon'),
      evening: feedbackData.filter(f => f.time_of_day === 'evening'),
      night: feedbackData.filter(f => f.time_of_day === 'night')
    };

    const patterns = {};
    
    for (const [timeGroup, events] of Object.entries(timeGroups)) {
      if (events.length >= 5) {
        const positiveRate = events.filter(e => e.feedback_category === 'positive').length / events.length;
        const avgMatchScore = events.reduce((sum, e) => sum + (e.match_score || 0), 0) / events.length;
        
        patterns[timeGroup] = {
          positiveRate,
          avgMatchScore,
          eventCount: events.length,
          significance: events.length / feedbackData.length
        };
      }
    }

    return patterns;
  }

  /**
   * Analisa influência do humor
   */
  analyzeMoodInfluence(feedbackData) {
    const moodEvents = feedbackData.filter(f => f.user_mood);
    
    if (moodEvents.length < 5) {
      return { hasInfluence: false, confidence: 0 };
    }

    const moodCorrelations = {};
    const moodDimensions = ['happiness', 'stress', 'energy', 'social', 'romantic'];

    for (const dimension of moodDimensions) {
      const correlation = this.calculateMoodCorrelation(moodEvents, dimension);
      moodCorrelations[dimension] = correlation;
    }

    const significantCorrelations = Object.entries(moodCorrelations)
      .filter(([, corr]) => Math.abs(corr.value) > 0.3)
      .map(([dimension, corr]) => ({ dimension, ...corr }));

    return {
      hasInfluence: significantCorrelations.length > 0,
      correlations: moodCorrelations,
      significantFactors: significantCorrelations,
      confidence: significantCorrelations.length / moodDimensions.length
    };
  }

  /**
   * Calcula correlação entre humor e feedback
   */
  calculateMoodCorrelation(events, moodDimension) {
    const pairs = events
      .filter(e => e.user_mood && e.user_mood[moodDimension] !== undefined)
      .map(e => ({
        mood: e.user_mood[moodDimension],
        feedback: e.feedback_category === 'positive' ? 1 : 
                 e.feedback_category === 'negative' ? -1 : 0
      }));

    if (pairs.length < 3) {
      return { value: 0, confidence: 0, dataPoints: pairs.length };
    }

    // Correlação de Pearson simplificada
    const n = pairs.length;
    const sumX = pairs.reduce((sum, p) => sum + p.mood, 0);
    const sumY = pairs.reduce((sum, p) => sum + p.feedback, 0);
    const sumXY = pairs.reduce((sum, p) => sum + (p.mood * p.feedback), 0);
    const sumX2 = pairs.reduce((sum, p) => sum + (p.mood * p.mood), 0);
    const sumY2 = pairs.reduce((sum, p) => sum + (p.feedback * p.feedback), 0);

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return {
      value: isNaN(correlation) ? 0 : correlation,
      confidence: Math.min(0.9, n / 10),
      dataPoints: n
    };
  }

  /**
   * Analisa comportamento de visualização
   */
  analyzeViewingBehavior(feedbackData) {
    const eventsWithViewing = feedbackData.filter(f => f.time_spent_viewing > 0);
    
    if (eventsWithViewing.length < 5) {
      return { hasPattern: false, confidence: 0 };
    }

    const positiveEvents = eventsWithViewing.filter(f => f.feedback_category === 'positive');
    const negativeEvents = eventsWithViewing.filter(f => f.feedback_category === 'negative');

    const avgPositiveViewing = positiveEvents.length > 0 ?
      positiveEvents.reduce((sum, e) => sum + e.time_spent_viewing, 0) / positiveEvents.length : 0;
    
    const avgNegativeViewing = negativeEvents.length > 0 ?
      negativeEvents.reduce((sum, e) => sum + e.time_spent_viewing, 0) / negativeEvents.length : 0;

    const difference = avgPositiveViewing - avgNegativeViewing;
    const significance = Math.abs(difference) / Math.max(avgPositiveViewing, avgNegativeViewing, 1);

    return {
      hasPattern: significance > 0.3,
      difference,
      significance,
      avgPositiveViewing,
      avgNegativeViewing,
      confidence: Math.min(0.9, significance),
      dataPoints: eventsWithViewing.length
    };
  }

  /**
   * Gera sugestões de ajuste baseadas nos padrões
   */
  async generateAdjustments(patterns, config) {
    const adjustments = [];
    
    // Ajustes baseados em performance de atributos
    for (const [attribute, performance] of Object.entries(patterns.attributePerformance)) {
      if (performance.confidence >= 0.4 && performance.trend !== 'stable') {
        const currentWeight = config.current_weights[attribute] || this.DEFAULT_WEIGHTS[attribute];
        const adjustmentDirection = performance.trend === 'increase_weight' ? 1 : -1;
        const adjustmentMagnitude = Math.min(
          this.MAX_WEIGHT_CHANGE,
          performance.significance * config.adaptation_rate * adjustmentDirection
        );
        
        const newWeight = Math.max(0, Math.min(1, currentWeight + adjustmentMagnitude));
        
        if (Math.abs(newWeight - currentWeight) > 0.01) {
          adjustments.push({
            attribute,
            oldWeight: currentWeight,
            newWeight,
            reason: performance.trend === 'increase_weight' ? 'positive_feedback' : 'negative_feedback',
            confidence: performance.confidence,
            dataPoints: performance.dataPoints,
            explanation: `Attribute ${attribute} shows ${performance.trend} based on ${performance.dataPoints} data points`
          });
        }
      }
    }

    // Ajustes baseados em padrões temporais
    if (config.temporal_adaptation && Object.keys(patterns.temporalPatterns).length > 0) {
      const temporalAdjustments = this.generateTemporalAdjustments(patterns.temporalPatterns, config);
      adjustments.push(...temporalAdjustments);
    }

    // Ajustes baseados em influência do humor
    if (config.mood_adaptation && patterns.moodInfluence.hasInfluence) {
      const moodAdjustments = this.generateMoodAdjustments(patterns.moodInfluence, config);
      adjustments.push(...moodAdjustments);
    }

    return adjustments;
  }

  /**
   * Aplica um ajuste de peso específico
   */
  async applyWeightAdjustment(userId, adjustment) {
    const query = `
      INSERT INTO weight_adjustments (
        user_id, attribute, old_weight, new_weight, 
        adjustment_reason, confidence_score, data_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      userId,
      adjustment.attribute,
      adjustment.oldWeight,
      adjustment.newWeight,
      adjustment.reason,
      adjustment.confidence,
      adjustment.dataPoints
    ];
    
    const result = await db.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Atualiza os pesos do usuário
   */
  async updateUserWeights(userId, adjustments) {
    const config = await this.getUserConfig(userId);
    const newWeights = { ...config.current_weights };
    
    for (const adjustment of adjustments) {
      newWeights[adjustment.attribute] = adjustment.newWeight;
    }
    
    // Normalizar pesos para somar 1.0
    const totalWeight = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (const attribute of Object.keys(newWeights)) {
        newWeights[attribute] = newWeights[attribute] / totalWeight;
      }
    }
    
    const query = `
      UPDATE adaptive_recommendation_configs 
      SET current_weights = $2, updated_at = NOW()
      WHERE user_id = $1
    `;
    
    await db.query(query, [userId, JSON.stringify(newWeights)]);
    return newWeights;
  }

  /**
   * Atualiza perfil de aprendizado do usuário
   */
  async updateLearningProfile(userId, adjustments) {
    const query = `
      UPDATE user_learning_profiles 
      SET 
        total_feedback_events = total_feedback_events + $2,
        learning_velocity = (learning_velocity + $3) / 2,
        last_updated = NOW()
      WHERE user_id = $1
    `;
    
    const adjustmentMagnitude = adjustments.reduce((sum, adj) => 
      sum + Math.abs(adj.newWeight - adj.oldWeight), 0
    ) / adjustments.length;
    
    await db.query(query, [userId, adjustments.length, adjustmentMagnitude]);
  }

  /**
   * Obtém configuração do usuário
   */
  async getUserConfig(userId) {
    const query = `
      SELECT * FROM adaptive_recommendation_configs 
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Criar configuração padrão se não existir
      return await this.createDefaultConfig(userId);
    }
    
    return result.rows[0];
  }

  /**
   * Cria configuração padrão para o usuário
   */
  async createDefaultConfig(userId) {
    const query = `
      INSERT INTO adaptive_recommendation_configs (
        user_id, current_weights, base_weights
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const weights = JSON.stringify(this.DEFAULT_WEIGHTS);
    const result = await db.query(query, [userId, weights, weights]);
    return result.rows[0];
  }

  /**
   * Calcula confiança geral das sugestões
   */
  calculateOverallConfidence(adjustments) {
    if (adjustments.length === 0) return 0;
    
    const avgConfidence = adjustments.reduce((sum, adj) => sum + adj.confidence, 0) / adjustments.length;
    const dataPointsBonus = Math.min(0.2, adjustments.reduce((sum, adj) => sum + adj.dataPoints, 0) / 100);
    
    return Math.min(0.95, avgConfidence + dataPointsBonus);
  }

  /**
   * Obtém histórico de ajustes do usuário
   */
  async getAdjustmentHistory(userId, limit = 50) {
    const query = `
      SELECT * FROM weight_adjustments 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `;
    
    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Obtém estatísticas de performance do sistema de ajuste
   */
  async getSystemPerformanceStats() {
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_adjustments,
        AVG(confidence_score) as avg_confidence,
        COUNT(CASE WHEN confidence_score >= 0.7 THEN 1 END) as high_confidence_adjustments,
        COUNT(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_adjustments
      FROM weight_adjustments 
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = WeightAdjustmentService;