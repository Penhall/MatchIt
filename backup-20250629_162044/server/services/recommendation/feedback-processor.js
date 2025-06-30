// server/services/recommendation/feedback-processor.js (ESM)
import pg from 'pg';
const { Pool } = pg;
import { v4 as uuidv4 } from 'uuid';
import WeightAdjustmentService from './weight-adjustment-service.js';
import { pool } from '../../config/database.js'; // Importar pool diretamente

const db = pool; // Usar o pool importado diretamente

class FeedbackProcessor {
  constructor() {
    this.weightAdjustmentService = new WeightAdjustmentService();
    this.processingQueue = [];
    this.isProcessing = false;
    this.batchSize = 10;
    this.processInterval = 5000; // 5 segundos
    
    // Iniciar processamento em lote
    this.startBatchProcessing();
  }

  /**
   * Registra um evento de feedback
   */
  async recordFeedbackEvent(eventData) {
    try {
      const sessionId = eventData.sessionId || uuidv4();
      const timestamp = new Date();
      
      // Enriquecer dados do evento
      const enrichedEvent = await this.enrichEventData(eventData, sessionId, timestamp);
      
      // Salvar no banco de dados
      const eventId = await this.saveFeedbackEvent(enrichedEvent);
      
      // Adicionar à fila de processamento para análise em tempo real
      this.addToProcessingQueue(eventId, enrichedEvent);
      
      // Trigger automático para ajustes se aplicável
      await this.triggerAutomaticAdjustmentIfNeeded(eventData.userId);
      
      return {
        eventId,
        sessionId,
        timestamp,
        processed: true
      };
      
    } catch (error) {
      console.error('Error recording feedback event:', error);
      throw error;
    }
  }

  /**
   * Enriquece dados do evento com contexto adicional
   */
  async enrichEventData(eventData, sessionId, timestamp) {
    // Obter atributos do usuário alvo
    const targetUserAttributes = await this.getTargetUserAttributes(eventData.targetUserId);
    
    // Obter configuração atual de pesos
    const userConfig = await this.weightAdjustmentService.getUserConfig(eventData.userId);
    
    // Calcular score de compatibilidade
    const matchScore = await this.calculateMatchScore(eventData.userId, eventData.targetUserId);
    
    // Determinar período do dia
    const timeOfDay = this.getTimeOfDay(timestamp);
    
    return {
      id: uuidv4(),
      userId: eventData.userId,
      eventType: eventData.eventType,
      targetUserId: eventData.targetUserId,
      timestamp,
      
      // Context data
      context: {
        screenType: eventData.screenType || 'discovery',
        sessionId,
        timeSpentViewing: eventData.timeSpentViewing || 0,
        profilePosition: eventData.profilePosition || 0,
        totalProfilesShown: eventData.totalProfilesShown || 1,
        userMood: eventData.userMood || null,
        timeOfDay,
        dayOfWeek: timestamp.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      },
      
      // Metadata
      metadata: {
        matchScore,
        styleCompatibility: eventData.styleCompatibility || 0,
        emotionalCompatibility: eventData.emotionalCompatibility || 0,
        attributeWeights: userConfig.current_weights,
        targetUserAttributes,
        reasonsForRecommendation: eventData.reasonsForRecommendation || []
      }
    };
  }

  /**
   * Salva evento no banco de dados
   */
  async saveFeedbackEvent(eventData) {
    const query = `
      INSERT INTO feedback_events (
        id, user_id, event_type, target_user_id, timestamp,
        screen_type, session_id, time_spent_viewing, profile_position, 
        total_profiles_shown, user_mood, time_of_day, day_of_week,
        match_score, style_compatibility, emotional_compatibility,
        attribute_weights, target_user_attributes, reasons_for_recommendation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `;
    
    const values = [
      eventData.id,
      eventData.userId,
      eventData.eventType,
      eventData.targetUserId,
      eventData.timestamp,
      eventData.context.screenType,
      eventData.context.sessionId,
      eventData.context.timeSpentViewing,
      eventData.context.profilePosition,
      eventData.context.totalProfilesShown,
      JSON.stringify(eventData.context.userMood),
      eventData.context.timeOfDay,
      eventData.context.dayOfWeek,
      eventData.metadata.matchScore,
      eventData.metadata.styleCompatibility,
      eventData.metadata.emotionalCompatibility,
      JSON.stringify(eventData.metadata.attributeWeights),
      JSON.stringify(eventData.metadata.targetUserAttributes),
      eventData.metadata.reasonsForRecommendation
    ];
    
    const result = await db.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Obtém atributos do usuário alvo
   */
  async getTargetUserAttributes(targetUserId) {
    const query = `
      SELECT 
        u.age,
        u.location,
        u.interests,
        up.lifestyle_preferences,
        up.values,
        sp.appearance_preferences,
        ep.personality_traits,
        up.communication_style,
        up.relationship_goals,
        ep.current_state as emotional_state
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN style_preferences sp ON u.id = sp.user_id
      LEFT JOIN emotional_profiles ep ON u.id = ep.user_id
      WHERE u.id = $1
    `;
    
    const result = await db.query(query, [targetUserId]);
    
    if (result.rows.length === 0) {
      return this.getDefaultAttributes();
    }
    
    const row = result.rows[0];
    
    return {
      age: row.age || 25,
      locationDistance: 0, // Calcular baseado em localização
      sharedInterests: row.interests || [],
      lifestyleCompatibility: this.calculateLifestyleScore(row.lifestyle_preferences),
      valuesAlignment: this.calculateValuesScore(row.values),
      appearanceRating: this.calculateAppearanceScore(row.appearance_preferences),
      personalityMatch: this.calculatePersonalityScore(row.personality_traits),
      communicationStyle: row.communication_style || 'balanced',
      relationshipGoals: row.relationship_goals || 'long_term',
      emotionalProfile: row.emotional_state || null
    };
  }

  /**
   * Calcula score de compatibilidade entre usuários
   */
  async calculateMatchScore(userId, targetUserId) {
    // Implementar cálculo de score baseado nos algoritmos existentes
    // Por enquanto, retornar um score simulado
    return Math.random() * 0.4 + 0.3; // Entre 0.3 e 0.7
  }

  /**
   * Determina período do dia
   */
  getTimeOfDay(timestamp) {
    const hour = timestamp.getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Adiciona evento à fila de processamento
   */
  addToProcessingQueue(eventId, eventData) {
    this.processingQueue.push({ eventId, eventData, addedAt: Date.now() });
    
    // Processar imediatamente se for um evento crítico
    if (this.isCriticalEvent(eventData.eventType)) {
      this.processEventImmediate(eventData);
    }
  }

  /**
   * Verifica se é um evento crítico que requer processamento imediato
   */
  isCriticalEvent(eventType) {
    const criticalEvents = [
      'super_like',
      'match_created',
      'conversation_started',
      'date_planned'
    ];
    
    return criticalEvents.includes(eventType);
  }

  /**
   * Processa evento crítico imediatamente
   */
  async processEventImmediate(eventData) {
    try {
      // Analisar padrão imediato
      const recentPattern = await this.analyzeImmediatePattern(eventData);
      
      // Trigger ajuste rápido se necessário
      if (recentPattern.triggerAdjustment) {
        await this.weightAdjustmentService.applyAutomaticAdjustments(eventData.userId);
      }
      
      // Atualizar analytics em tempo real
      await this.updateRealTimeAnalytics(eventData);
      
    } catch (error) {
      console.error('Error processing critical event:', error);
    }
  }

  /**
   * Analisa padrão imediato para eventos críticos
   */
  async analyzeImmediatePattern(eventData) {
    const recentEvents = await this.getRecentEvents(eventData.userId, '1 hour');
    
    // Detectar padrões de comportamento súbito
    const sameTypeEvents = recentEvents.filter(e => e.event_type === eventData.eventType);
    
    return {
      triggerAdjustment: sameTypeEvents.length >= 3, // 3 eventos do mesmo tipo em 1 hora
      pattern: this.detectBehaviorPattern(recentEvents),
      confidence: sameTypeEvents.length / 10 // Máximo 10 eventos para confiança máxima
    };
  }

  /**
   * Obtém eventos recentes do usuário
   */
  async getRecentEvents(userId, timeWindow) {
    const query = `
      SELECT * FROM feedback_events 
      WHERE user_id = $1 
        AND timestamp > NOW() - INTERVAL '${timeWindow}'
      ORDER BY timestamp DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Detecta padrões de comportamento
   */
  detectBehaviorPattern(events) {
    if (events.length < 3) return 'insufficient_data';
    
    const positiveEvents = events.filter(e => 
      ['swipe_right', 'super_like', 'message_sent'].includes(e.event_type)
    ).length;
    
    const negativeEvents = events.filter(e => e.event_type === 'swipe_left').length;
    
    const ratio = positiveEvents / (positiveEvents + negativeEvents);
    
    if (ratio > 0.7) return 'highly_active';
    if (ratio < 0.3) return 'highly_selective';
    return 'balanced';
  }

  /**
   * Trigger para ajuste automático se necessário
   */
  async triggerAutomaticAdjustmentIfNeeded(userId) {
    try {
      // Verificar se deve fazer ajuste baseado em critérios
      const shouldAdjust = await this.shouldTriggerAdjustment(userId);
      
      if (shouldAdjust.trigger) {
        const adjustmentResult = await this.weightAdjustmentService.applyAutomaticAdjustments(userId);
        
        if (adjustmentResult.applied > 0) {
          console.log(`Auto-adjustment applied for user ${userId}: ${adjustmentResult.applied} weights adjusted`);
        }
      }
      
    } catch (error) {
      console.error('Error in automatic adjustment trigger:', error);
    }
  }

  /**
   * Determina se deve fazer ajuste automático
   */
  async shouldTriggerAdjustment(userId) {
    const query = `
      SELECT 
        COUNT(*) as recent_events,
        COUNT(CASE WHEN event_type IN ('swipe_right', 'super_like') THEN 1 END) as positive_events,
        COUNT(CASE WHEN event_type = 'swipe_left' THEN 1 END) as negative_events,
        MAX(timestamp) as last_event
      FROM feedback_events 
      WHERE user_id = $1 
        AND timestamp > NOW() - INTERVAL '24 hours'
    `;
    
    const result = await db.query(query, [userId]);
    const stats = result.rows[0];
    
    // Verificar última vez que foi feito ajuste
    const lastAdjustment = await this.getLastAdjustmentTime(userId);
    const hoursSinceLastAdjustment = lastAdjustment ? 
      (Date.now() - lastAdjustment.getTime()) / (1000 * 60 * 60) : Infinity;
    
    return {
      trigger: stats.recent_events >= 20 && hoursSinceLastAdjustment >= 6,
      reason: `${stats.recent_events} events in 24h, ${hoursSinceLastAdjustment.toFixed(1)}h since last adjustment`,
      stats
    };
  }

  /**
   * Obtém timestamp do último ajuste
   */
  async getLastAdjustmentTime(userId) {
    const query = `
      SELECT MAX(timestamp) as last_adjustment 
      FROM weight_adjustments 
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0].last_adjustment;
  }

  /**
   * Inicia processamento em lote
   */
  startBatchProcessing() {
    setInterval(() => {
      this.processBatch();
    }, this.processInterval);
  }

  /**
   * Processa lote de eventos
   */
  async processBatch() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const batch = this.processingQueue.splice(0, this.batchSize);
      
      await Promise.all(batch.map(async (item) => {
        try {
          await this.processEventForAnalytics(item.eventData);
        } catch (error) {
          console.error(`Error processing event ${item.eventId}:`, error);
        }
      }));
      
    } catch (error) {
      console.error('Error in batch processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa evento para analytics
   */
  async processEventForAnalytics(eventData) {
    // Atualizar estatísticas diárias
    await this.updateDailyAnalytics(eventData);
    
    // Identificar tendências
    await this.identifyTrends(eventData);
    
    // Atualizar perfil de aprendizado
    await this.updateLearningMetrics(eventData);
  }

  /**
   * Atualiza analytics diários
   */
  async updateDailyAnalytics(eventData) {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      INSERT INTO feedback_analytics (
        user_id, period, period_start, period_end, total_events,
        positive_events, negative_events, neutral_events
      ) VALUES ($1, 'daily', $2, $2, 1, $3, $4, $5)
      ON CONFLICT (user_id, period, period_start)
      DO UPDATE SET
        total_events = feedback_analytics.total_events + 1,
        positive_events = feedback_analytics.positive_events + $3,
        negative_events = feedback_analytics.negative_events + $4,
        neutral_events = feedback_analytics.neutral_events + $5,
        updated_at = NOW()
    `;
    
    const isPositive = ['swipe_right', 'super_like', 'message_sent', 'match_created'].includes(eventData.eventType) ? 1 : 0;
    const isNegative = eventData.eventType === 'swipe_left' ? 1 : 0;
    const isNeutral = !isPositive && !isNegative ? 1 : 0;
    
    await db.query(query, [eventData.userId, today, isPositive, isNegative, isNeutral]);
  }

  /**
   * Atualiza analytics em tempo real
   */
  async updateRealTimeAnalytics(eventData) {
    // Implementar cache em memória para analytics em tempo real
    // Por enquanto, apenas log
    console.log(`Real-time analytics update for user ${eventData.userId}: ${eventData.eventType}`);
  }

  /**
   * Obtém analytics em tempo real para um usuário
   */
  async getRealTimeAnalytics(userId) {
    const query = `
      SELECT 
        COUNT(*) as events_today,
        COUNT(CASE WHEN event_type IN ('swipe_right', 'super_like') THEN 1 END) as positive_today,
        COUNT(CASE WHEN event_type = 'swipe_left' THEN 1 END) as negative_today,
        AVG(match_score) as avg_match_score,
        COUNT(DISTINCT target_user_id) as unique_interactions
      FROM feedback_events 
      WHERE user_id = $1 
        AND timestamp > CURRENT_DATE
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  // Métodos auxiliares para cálculos de score
  calculateLifestyleScore(preferences) {
    return Math.random() * 0.3 + 0.4; // Simulado
  }

  calculateValuesScore(values) {
    return Math.random() * 0.3 + 0.4; // Simulado
  }

  calculateAppearanceScore(preferences) {
    return Math.random() * 0.3 + 0.4; // Simulado
  }

  calculatePersonalityScore(traits) {
    return Math.random() * 0.3 + 0.4; // Simulado
  }

  getDefaultAttributes() {
    return {
      age: 25,
      locationDistance: 10,
      sharedInterests: [],
      lifestyleCompatibility: 0.5,
      valuesAlignment: 0.5,
      appearanceRating: 0.5,
      personalityMatch: 0.5,
      communicationStyle: 'balanced',
      relationshipGoals: 'long_term',
      emotionalProfile: null
    };
  }

  identifyTrends() {
    // Implementar análise de tendências
  }

  updateLearningMetrics() {
    // Implementar atualização de métricas de aprendizado
  }
}
