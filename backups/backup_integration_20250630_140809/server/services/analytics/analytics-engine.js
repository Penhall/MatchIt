// server/services/analytics/analytics-engine.js (ESM)
import pg from 'pg';
const { Pool } = pg;
import EventEmitter from 'events';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analytics Engine - Processamento central de eventos e métricas
 * Responsável por coletar, processar e agregar dados de analytics
 */
class AnalyticsEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Configurações do banco
      database: config.database || new Pool(),
      
      // Configurações de processamento
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 30000, // 30 segundos
      maxRetries: config.maxRetries || 3,
      
      // Configurações de qualidade
      enableValidation: config.enableValidation !== false,
      enableDeduplication: config.enableDeduplication !== false,
      
      // Configurações de performance
      enableRealtimeProcessing: config.enableRealtimeProcessing !== false,
      enableBatchProcessing: config.enableBatchProcessing !== false,
      
      // Configurações de privacidade
      respectDoNotTrack: config.respectDoNotTrack !== false,
      anonymizeIpAddresses: config.anonymizeIpAddresses !== false
    };
    
    // Estado interno
    this.eventQueue = [];
    this.isProcessing = false;
    this.metrics = {
      eventsProcessed: 0,
      eventsDropped: 0,
      processingErrors: 0,
      lastProcessedAt: null,
      averageProcessingTime: 0
    };
    
    // Cache de eventos processados (para deduplicação)
    this.processedEvents = new Set();
    this.maxCacheSize = 10000;
    
    // Inicializar processamento automático
    this.initializeAutoProcessing();
    
    console.log('[AnalyticsEngine] Initialized with config:', {
      batchSize: this.config.batchSize,
      flushInterval: this.config.flushInterval,
      realtimeEnabled: this.config.enableRealtimeProcessing
    });
  }

  /**
   * Registra um evento de analytics
   * @param {Object} eventData - Dados do evento
   * @returns {Promise<Object>} Resultado do processamento
   */
  async trackEvent(eventData) {
    const startTime = Date.now();
    
    try {
      // Validar dados do evento
      if (this.config.enableValidation) {
        const validation = this.validateEvent(eventData);
        if (!validation.isValid) {
          throw new Error(`Event validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Criar evento estruturado
      const event = this.createStructuredEvent(eventData);
      
      // Verificar deduplicação
      if (this.config.enableDeduplication) {
        if (this.processedEvents.has(event.event_id)) {
          console.warn('[AnalyticsEngine] Duplicate event detected:', event.event_id);
          this.metrics.eventsDropped++;
          return { success: false, reason: 'duplicate' };
        }
      }
      
      // Processamento em tempo real ou batch
      if (this.config.enableRealtimeProcessing) {
        await this.processEventRealtime(event);
      } else {
        this.addToQueue(event);
      }
      
      // Marcar como processado
      this.markEventAsProcessed(event.event_id);
      
      // Atualizar métricas
      this.updateProcessingMetrics(startTime);
      
      // Emitir eventos para listeners
      this.emit('eventTracked', event);
      
      return { 
        success: true, 
        eventId: event.event_id,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[AnalyticsEngine] Error tracking event:', error);
      this.metrics.processingErrors++;
      this.emit('error', error);
      
      return { 
        success: false, 
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Processa múltiplos eventos em lote
   * @param {Array} events - Array de eventos
   * @returns {Promise<Object>} Resultado do processamento
   */
  async trackBatch(events) {
    const startTime = Date.now();
    const results = {
      processed: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };
    
    try {
      console.log(`[AnalyticsEngine] Processing batch of ${events.length} events`);
      
      const structuredEvents = [];
      
      for (const eventData of events) {
        try {
          // Validar evento
          if (this.config.enableValidation) {
            const validation = this.validateEvent(eventData);
            if (!validation.isValid) {
              results.failed++;
              results.errors.push(`Validation failed: ${validation.errors.join(', ')}`);
              continue;
            }
          }
          
          // Criar evento estruturado
          const event = this.createStructuredEvent(eventData);
          
          // Verificar duplicação
          if (this.config.enableDeduplication && this.processedEvents.has(event.event_id)) {
            results.duplicates++;
            continue;
          }
          
          structuredEvents.push(event);
          
        } catch (error) {
          results.failed++;
          results.errors.push(error.message);
        }
      }
      
      // Processar eventos válidos
      if (structuredEvents.length > 0) {
        await this.processBatchEvents(structuredEvents);
        
        // Marcar como processados
        structuredEvents.forEach(event => {
          this.markEventAsProcessed(event.event_id);
        });
        
        results.processed = structuredEvents.length;
      }
      
      // Atualizar métricas
      this.metrics.eventsProcessed += results.processed;
      this.metrics.eventsDropped += results.duplicates;
      this.metrics.processingErrors += results.failed;
      
      console.log(`[AnalyticsEngine] Batch processed in ${Date.now() - startTime}ms:`, results);
      
      return {
        success: true,
        ...results,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[AnalyticsEngine] Error processing batch:', error);
      this.emit('error', error);
      
      return {
        success: false,
        error: error.message,
        ...results,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Calcula KPIs e métricas agregadas
   * @param {Object} options - Opções de cálculo
   * @returns {Promise<Object>} KPIs calculados
   */
  async calculateKPIs(options = {}) {
    const {
      period = 'daily',
      date = new Date(),
      categories = ['business', 'technical', 'product'],
      forceRecalculation = false
    } = options;
    
    try {
      console.log(`[AnalyticsEngine] Calculating KPIs for ${period} on ${date.toISOString().split('T')[0]}`);
      
      const startTime = Date.now();
      const kpis = {};
      
      // Verificar se já existem KPIs calculados
      if (!forceRecalculation) {
        const existing = await this.getExistingKPIs(date, period, categories);
        if (existing && Object.keys(existing).length > 0) {
          console.log('[AnalyticsEngine] Using existing KPIs');
          return existing;
        }
      }
      
      // Calcular KPIs por categoria
      for (const category of categories) {
        kpis[category] = await this.calculateCategoryKPIs(category, date, period);
      }
      
      // Salvar KPIs calculados
      await this.saveCalculatedKPIs(kpis, date, period);
      
      // Verificar alertas
      await this.checkAlerts(kpis);
      
      console.log(`[AnalyticsEngine] KPIs calculated in ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        kpis,
        calculatedAt: new Date(),
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[AnalyticsEngine] Error calculating KPIs:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas do sistema em tempo real
   * @returns {Object} Métricas do sistema
   */
  getSystemMetrics() {
    return {
      engine: {
        status: this.isProcessing ? 'processing' : 'idle',
        queueSize: this.eventQueue.length,
        cacheSize: this.processedEvents.size,
        ...this.metrics
      },
      database: {
        connected: true, // TODO: implementar verificação real
        poolSize: this.config.database.totalCount || 0
      },
      performance: {
        averageProcessingTime: this.metrics.averageProcessingTime,
        successRate: this.calculateSuccessRate(),
        throughput: this.calculateThroughput()
      }
    };
  }

  /**
   * Limpa dados antigos e otimiza performance
   * @returns {Promise<Object>} Resultado da limpeza
   */
  async cleanup() {
    try {
      console.log('[AnalyticsEngine] Starting cleanup process');
      
      const results = {
        eventsDeleted: 0,
        aggregationsDeleted: 0,
        alertsDeleted: 0
      };
      
      // Limpar cache de eventos processados
      if (this.processedEvents.size > this.maxCacheSize) {
        this.processedEvents.clear();
        console.log('[AnalyticsEngine] Event cache cleared');
      }
      
      // Executar limpeza no banco de dados
      const dbResult = await this.config.database.query('SELECT cleanup_old_analytics_data()');
      results.eventsDeleted = dbResult.rows[0].cleanup_old_analytics_data;
      
      console.log('[AnalyticsEngine] Cleanup completed:', results);
      
      return results;
      
    } catch (error) {
      console.error('[AnalyticsEngine] Error during cleanup:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  /**
   * Valida estrutura do evento
   * @private
   */
  validateEvent(eventData) {
    const errors = [];
    
    if (!eventData.eventType) {
      errors.push('eventType is required');
    }
    
    if (!eventData.eventName) {
      errors.push('eventName is required');
    }
    
    if (!eventData.userId && !eventData.sessionId) {
      errors.push('userId or sessionId is required');
    }
    
    // Validar tipos específicos
    const validEventTypes = [
      'user_action', 'system_event', 'performance_metric', 'business_metric',
      'error_event', 'recommendation_event', 'conversion_event', 
      'engagement_event', 'retention_event', 'monetization_event'
    ];
    
    if (eventData.eventType && !validEventTypes.includes(eventData.eventType)) {
      errors.push(`Invalid eventType: ${eventData.eventType}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Cria evento estruturado
   * @private
   */
  createStructuredEvent(eventData) {
    const now = new Date();
    
    return {
      event_id: eventData.eventId || this.generateEventId(),
      user_id: eventData.userId || null,
      session_id: eventData.sessionId || this.generateSessionId(),
      
      event_type: eventData.eventType,
      event_name: eventData.eventName,
      event_properties: eventData.properties || {},
      
      timestamp: eventData.timestamp ? new Date(eventData.timestamp) : now,
      server_timestamp: now,
      client_timezone: eventData.timezone || 'UTC',
      
      device_info: this.sanitizeDeviceInfo(eventData.deviceInfo),
      app_version: eventData.appVersion || 'unknown',
      platform_version: eventData.platformVersion || 'unknown',
      
      location_info: this.sanitizeLocationInfo(eventData.locationInfo),
      network_info: eventData.networkInfo || {},
      
      source: eventData.source || 'mobile_app',
      environment: process.env.NODE_ENV || 'production',
      experiment_groups: eventData.experimentGroups || []
    };
  }

  /**
   * Processa evento em tempo real
   * @private
   */
  async processEventRealtime(event) {
    const query = `
      INSERT INTO analytics_events (
        event_id, user_id, session_id, event_type, event_name, event_properties,
        timestamp, server_timestamp, client_timezone, device_info, app_version,
        platform_version, location_info, network_info, source, environment, experiment_groups
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;
    
    const values = [
      event.event_id, event.user_id, event.session_id, event.event_type, 
      event.event_name, JSON.stringify(event.event_properties),
      event.timestamp, event.server_timestamp, event.client_timezone,
      JSON.stringify(event.device_info), event.app_version, event.platform_version,
      JSON.stringify(event.location_info), JSON.stringify(event.network_info),
      event.source, event.environment, event.experiment_groups
    ];
    
    await this.config.database.query(query, values);
    
    // Atualizar agregações em tempo real se necessário
    await this.updateRealtimeAggregations(event);
  }

  /**
   * Processa eventos em lote
   * @private
   */
  async processBatchEvents(events) {
    if (events.length === 0) return;
    
    const client = await this.config.database.connect();
    
    try {
      await client.query('BEGIN');
      
      // Preparar query de inserção em lote
      const baseQuery = `
        INSERT INTO analytics_events (
          event_id, user_id, session_id, event_type, event_name, event_properties,
          timestamp, server_timestamp, client_timezone, device_info, app_version,
          platform_version, location_info, network_info, source, environment, experiment_groups
        ) VALUES 
      `;
      
      const valueStrings = [];
      const allValues = [];
      
      events.forEach((event, index) => {
        const offset = index * 17;
        valueStrings.push(`(
          $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6},
          $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12},
          $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}
        )`);
        
        allValues.push(
          event.event_id, event.user_id, event.session_id, event.event_type,
          event.event_name, JSON.stringify(event.event_properties),
          event.timestamp, event.server_timestamp, event.client_timezone,
          JSON.stringify(event.device_info), event.app_version, event.platform_version,
          JSON.stringify(event.location_info), JSON.stringify(event.network_info),
          event.source, event.environment, event.experiment_groups
        );
      });
      
      const fullQuery = baseQuery + valueStrings.join(', ');
      await client.query(fullQuery, allValues);
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calcula KPIs por categoria
   * @private
   */
  async calculateCategoryKPIs(category, date, period) {
    const kpis = {};
    
    switch (category) {
      case 'business':
        kpis.daily_active_users = await this.calculateDAU(date);
        kpis.session_duration_avg = await this.calculateAvgSessionDuration(date);
        kpis.match_success_rate = await this.calculateMatchSuccessRate(date);
        kpis.user_retention_7d = await this.calculateRetention(date, 7);
        break;
        
      case 'technical':
        kpis.api_response_time = await this.calculateApiResponseTime(date);
        kpis.error_rate = await this.calculateErrorRate(date);
        kpis.uptime_percentage = await this.calculateUptime(date);
        break;
        
      case 'product':
        kpis.feature_adoption_rate = await this.calculateFeatureAdoption(date);
        kpis.profile_completion_rate = await this.calculateProfileCompletion(date);
        break;
    }
    
    return kpis;
  }

  /**
   * Calcula DAU (Daily Active Users)
   * @private
   */
  async calculateDAU(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    const query = `
      SELECT COUNT(DISTINCT user_id) as dau
      FROM analytics_events 
      WHERE DATE(timestamp) = $1 
        AND user_id IS NOT NULL
    `;
    
    const result = await this.config.database.query(query, [dateStr]);
    return parseInt(result.rows[0].dau) || 0;
  }

  /**
   * Outros métodos de cálculo de KPIs...
   * @private
   */
  async calculateAvgSessionDuration(date) {
    // Implementação do cálculo de duração média de sessão
    return 0; // Placeholder
  }

  async calculateMatchSuccessRate(date) {
    // Implementação do cálculo de taxa de sucesso de matches
    return 0; // Placeholder
  }

  /**
   * Utilitários
   * @private
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId() {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeDeviceInfo(deviceInfo) {
    if (!deviceInfo) return {};
    
    // Remover informações sensíveis
    const { userAgent, ...sanitized } = deviceInfo;
    return sanitized;
  }

  sanitizeLocationInfo(locationInfo) {
    if (!locationInfo) return {};
    
    // Anonimizar IPs se configurado
    if (this.config.anonymizeIpAddresses && locationInfo.ipAddress) {
      locationInfo.ipAddress = this.hashIP(locationInfo.ipAddress);
    }
    
    return locationInfo;
  }

  hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex').substr(0, 8);
  }

  markEventAsProcessed(eventId) {
    this.processedEvents.add(eventId);
    
    // Limitar tamanho do cache
    if (this.processedEvents.size > this.maxCacheSize) {
      const toDelete = Array.from(this.processedEvents).slice(0, 1000);
      toDelete.forEach(id => this.processedEvents.delete(id));
    }
  }

  updateProcessingMetrics(startTime) {
    const processingTime = Date.now() - startTime;
    
    this.metrics.eventsProcessed++;
    this.metrics.lastProcessedAt = new Date();
    
    // Calcular média móvel do tempo de processamento
    if (this.metrics.averageProcessingTime === 0) {
      this.metrics.averageProcessingTime = processingTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * 0.9) + (processingTime * 0.1);
    }
  }

  calculateSuccessRate() {
    const total = this.metrics.eventsProcessed + this.metrics.processingErrors;
    return total > 0 ? (this.metrics.eventsProcessed / total) * 100 : 100;
  }

  calculateThroughput() {
    // Eventos por segundo (simplificado)
    return this.metrics.eventsProcessed / Math.max(1, (Date.now() - this.startTime) / 1000);
  }

  /**
   * Inicializa processamento automático
   * @private
   */
  initializeAutoProcessing() {
    this.startTime = Date.now();
    
    if (this.config.enableBatchProcessing) {
      setInterval(async () => {
        if (this.eventQueue.length > 0 && !this.isProcessing) {
          await this.flushQueue();
        }
      }, this.config.flushInterval);
    }
    
    // Limpeza automática a cada hora
    setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('[AnalyticsEngine] Auto cleanup failed:', error);
      }
    }, 60 * 60 * 1000);
  }

  addToQueue(event) {
    this.eventQueue.push(event);
    
    // Flush automático quando atingir o batch size
    if (this.eventQueue.length >= this.config.batchSize) {
      setImmediate(() => this.flushQueue());
    }
  }

  async flushQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const events = this.eventQueue.splice(0, this.config.batchSize);
      await this.processBatchEvents(events);
      
      // Marcar como processados
      events.forEach(event => {
        this.markEventAsProcessed(event.event_id);
      });
      
      this.metrics.eventsProcessed += events.length;
      
    } catch (error) {
      console.error('[AnalyticsEngine] Error flushing queue:', error);
      this.metrics.processingErrors++;
    } finally {
      this.isProcessing = false;
    }
  }
}
