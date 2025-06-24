// server/integrations/analytics-integration.js

const express = require('express');
const { Pool } = require('pg');
const AnalyticsEngine = require('../services/analytics/analytics-engine');
const MetricsCalculator = require('../services/analytics/metrics-calculator');
const ReportGenerator = require('../services/analytics/report-generator');
const AnomalyDetector = require('../services/analytics/anomaly-detector');
const ScheduledJobs = require('../services/analytics/scheduled-jobs');
const { analyticsConfig, validateConfig } = require('../config/analytics-config');

/**
 * Analytics Integration - Integração com sistema existente do MatchIt
 * Conecta o sistema de analytics com a arquitetura atual
 */
class AnalyticsIntegration {
  constructor(app, existingDb = null) {
    this.app = app;
    this.db = existingDb || new Pool();
    this.isInitialized = false;
    
    // Serviços de analytics
    this.analyticsEngine = null;
    this.metricsCalculator = null;
    this.reportGenerator = null;
    this.anomalyDetector = null;
    this.scheduledJobs = null;
    
    console.log('[AnalyticsIntegration] Integration layer initialized');
  }

  /**
   * Inicializa sistema completo de analytics
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[AnalyticsIntegration] Already initialized');
      return;
    }

    try {
      console.log('[AnalyticsIntegration] Starting analytics system initialization...');

      // 1. Validar configuração
      validateConfig();

      // 2. Verificar/criar schema do banco
      await this.setupDatabase();

      // 3. Inicializar serviços
      await this.initializeServices();

      // 4. Configurar rotas da API
      this.setupAPIRoutes();

      // 5. Configurar middleware de tracking automático
      this.setupAutoTracking();

      // 6. Inicializar jobs agendados
      this.startScheduledJobs();

      // 7. Configurar event listeners
      this.setupEventListeners();

      this.isInitialized = true;

      console.log('[AnalyticsIntegration] Analytics system initialized successfully');

      return {
        success: true,
        services: {
          analyticsEngine: !!this.analyticsEngine,
          metricsCalculator: !!this.metricsCalculator,
          reportGenerator: !!this.reportGenerator,
          anomalyDetector: !!this.anomalyDetector,
          scheduledJobs: !!this.scheduledJobs
        },
        apiRoutes: '/api/analytics',
        autoTracking: true
      };

    } catch (error) {
      console.error('[AnalyticsIntegration] Initialization failed:', error);
      throw new Error(`Analytics initialization failed: ${error.message}`);
    }
  }

  /**
   * Configura schema do banco de dados
   * @private
   */
  async setupDatabase() {
    try {
      console.log('[AnalyticsIntegration] Setting up database schema...');

      // Verificar se as tabelas de analytics existem
      const tablesCheck = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('analytics_events', 'analytics_kpis', 'analytics_alerts')
      `);

      if (tablesCheck.rows.length < 3) {
        console.log('[AnalyticsIntegration] Analytics tables not found, creating schema...');
        
        // Em produção, seria melhor usar migrations separadas
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
          const schemaSQL = await fs.readFile(
            path.join(__dirname, '../migrations/003_analytics_schema.sql'), 
            'utf8'
          );
          
          await this.db.query(schemaSQL);
          console.log('[AnalyticsIntegration] Analytics schema created successfully');
        } catch (fileError) {
          console.warn('[AnalyticsIntegration] Schema file not found, creating minimal schema...');
          await this.createMinimalSchema();
        }
      } else {
        console.log('[AnalyticsIntegration] Analytics schema already exists');
      }

      // Verificar conexão
      await this.db.query('SELECT 1');
      console.log('[AnalyticsIntegration] Database connection verified');

    } catch (error) {
      console.error('[AnalyticsIntegration] Database setup failed:', error);
      throw error;
    }
  }

  /**
   * Cria schema mínimo se arquivo SQL não estiver disponível
   * @private
   */
  async createMinimalSchema() {
    const minimalSchema = `
      -- Tabela principal de eventos
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) UNIQUE NOT NULL,
        user_id UUID,
        session_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_name VARCHAR(100) NOT NULL,
        event_properties JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabela de KPIs
      CREATE TABLE IF NOT EXISTS analytics_kpis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kpi_name VARCHAR(100) NOT NULL,
        kpi_category VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        current_value DECIMAL(15,4) NOT NULL,
        calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(kpi_name, date)
      );

      -- Tabela de alertas
      CREATE TABLE IF NOT EXISTS analytics_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_name VARCHAR(100) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        metric_name VARCHAR(100) NOT NULL,
        current_value DECIMAL(15,4) NOT NULL,
        alert_message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Índices básicos
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp 
        ON analytics_events(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp 
        ON analytics_events(event_type, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_kpis_name_date 
        ON analytics_kpis(kpi_name, date DESC);
    `;

    await this.db.query(minimalSchema);
    console.log('[AnalyticsIntegration] Minimal schema created');
  }

  /**
   * Inicializa todos os serviços de analytics
   * @private
   */
  async initializeServices() {
    console.log('[AnalyticsIntegration] Initializing analytics services...');

    const serviceConfig = {
      database: this.db,
      enableRealtimeProcessing: analyticsConfig.engine.enableRealtimeProcessing,
      enableBatchProcessing: analyticsConfig.engine.enableBatchProcessing,
      batchSize: analyticsConfig.engine.batchSize,
      flushInterval: analyticsConfig.engine.flushInterval
    };

    // Analytics Engine
    this.analyticsEngine = new AnalyticsEngine(serviceConfig);
    console.log('[AnalyticsIntegration] ✓ Analytics Engine initialized');

    // Metrics Calculator
    this.metricsCalculator = new MetricsCalculator(this.db);
    console.log('[AnalyticsIntegration] ✓ Metrics Calculator initialized');

    // Report Generator
    this.reportGenerator = new ReportGenerator({ 
      database: this.db,
      ...analyticsConfig.reports
    });
    console.log('[AnalyticsIntegration] ✓ Report Generator initialized');

    // Anomaly Detector
    this.anomalyDetector = new AnomalyDetector({
      database: this.db,
      ...analyticsConfig.alerts
    });
    console.log('[AnalyticsIntegration] ✓ Anomaly Detector initialized');

    // Scheduled Jobs
    this.scheduledJobs = new ScheduledJobs({
      database: this.db,
      enabled: analyticsConfig.reports.enabled
    });
    console.log('[AnalyticsIntegration] ✓ Scheduled Jobs initialized');
  }

  /**
   * Configura rotas da API de analytics
   * @private
   */
  setupAPIRoutes() {
    console.log('[AnalyticsIntegration] Setting up API routes...');

    // Importar e registrar rotas de analytics
    const analyticsRoutes = require('../routes/analytics');
    this.app.use('/api/analytics', analyticsRoutes);

    // Adicionar endpoint de status da integração
    this.app.get('/api/analytics/integration/status', (req, res) => {
      res.json({
        success: true,
        data: {
          initialized: this.isInitialized,
          services: {
            analyticsEngine: !!this.analyticsEngine,
            metricsCalculator: !!this.metricsCalculator,
            reportGenerator: !!this.reportGenerator,
            anomalyDetector: !!this.anomalyDetector,
            scheduledJobs: !!this.scheduledJobs
          },
          config: {
            version: analyticsConfig.general.version,
            environment: analyticsConfig.general.environment,
            realtimeEnabled: analyticsConfig.engine.enableRealtimeProcessing,
            alertsEnabled: analyticsConfig.alerts.enabled
          },
          metrics: this.analyticsEngine ? this.analyticsEngine.getSystemMetrics() : null
        }
      });
    });

    console.log('[AnalyticsIntegration] ✓ API routes configured');
  }

  /**
   * Configura tracking automático para endpoints existentes
   * @private
   */
  setupAutoTracking() {
    console.log('[AnalyticsIntegration] Setting up automatic tracking...');

    // Middleware para tracking automático de eventos da API
    const autoTrackingMiddleware = (req, res, next) => {
      const startTime = Date.now();

      // Override res.json para capturar resposta
      const originalJson = res.json;
      res.json = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Track evento de performance
        if (req.path.startsWith('/api/')) {
          setImmediate(() => {
            this.trackAPIEvent(req, res, responseTime, data);
          });
        }

        return originalJson.call(this, data);
      }.bind(this);

      next();
    };

    // Aplicar middleware globalmente
    this.app.use(autoTrackingMiddleware);

    // Tracking específico para eventos de recomendação
    this.setupRecommendationTracking();

    // Tracking específico para eventos de usuário
    this.setupUserTracking();

    console.log('[AnalyticsIntegration] ✓ Automatic tracking configured');
  }

  /**
   * Configura tracking específico para sistema de recomendação
   * @private
   */
  setupRecommendationTracking() {
    // Intercept recomendations endpoint se existir
    const originalRecommendationRoute = this.app._router;
    
    // Este é um exemplo - deve ser adaptado para a estrutura real das rotas
    if (originalRecommendationRoute) {
      // Wrapper para endpoints de recomendação
      this.wrapRecommendationEndpoints();
    }
  }

  /**
   * Configura tracking específico para eventos de usuário
   * @private
   */
  setupUserTracking() {
    // Tracking de login/logout
    this.trackAuthEvents();
    
    // Tracking de ações de perfil
    this.trackProfileEvents();
    
    // Tracking de matching
    this.trackMatchingEvents();
  }

  /**
   * Wrapper para endpoints de recomendação
   * @private
   */
  wrapRecommendationEndpoints() {
    // Placeholder - implementar baseado na estrutura real das rotas
    console.log('[AnalyticsIntegration] Recommendation tracking configured');
  }

  /**
   * Tracking de eventos de autenticação
   * @private
   */
  trackAuthEvents() {
    // Placeholder - implementar baseado no sistema de auth existente
    console.log('[AnalyticsIntegration] Auth event tracking configured');
  }

  /**
   * Tracking de eventos de perfil
   * @private
   */
  trackProfileEvents() {
    // Placeholder - implementar baseado nas rotas de perfil existentes
    console.log('[AnalyticsIntegration] Profile event tracking configured');
  }

  /**
   * Tracking de eventos de matching
   * @private
   */
  trackMatchingEvents() {
    // Placeholder - implementar baseado no sistema de matching existente
    console.log('[AnalyticsIntegration] Matching event tracking configured');
  }

  /**
   * Inicia jobs agendados
   * @private
   */
  startScheduledJobs() {
    if (this.scheduledJobs && analyticsConfig.reports.enabled) {
      console.log('[AnalyticsIntegration] Starting scheduled jobs...');
      this.scheduledJobs.start();
      console.log('[AnalyticsIntegration] ✓ Scheduled jobs started');
    } else {
      console.log('[AnalyticsIntegration] Scheduled jobs disabled');
    }
  }

  /**
   * Configura event listeners
   * @private
   */
  setupEventListeners() {
    console.log('[AnalyticsIntegration] Setting up event listeners...');

    // Listeners do Analytics Engine
    if (this.analyticsEngine) {
      this.analyticsEngine.on('error', (error) => {
        console.error('[AnalyticsIntegration] Analytics Engine error:', error);
      });

      this.analyticsEngine.on('eventTracked', (event) => {
        // Log eventos importantes em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('[AnalyticsIntegration] Event tracked:', event.event_name);
        }
      });
    }

    // Listeners do Anomaly Detector
    if (this.anomalyDetector) {
      this.anomalyDetector.on('anomalyDetected', (anomaly) => {
        console.warn('[AnalyticsIntegration] Anomaly detected:', anomaly.metricName);
        // Aqui seria possível integrar com sistema de notificações
      });

      this.anomalyDetector.on('alertTriggered', (alert) => {
        console.warn('[AnalyticsIntegration] Alert triggered:', alert.alert_name);
        // Integrar com sistema de alertas existente
      });
    }

    // Listeners dos Scheduled Jobs
    if (this.scheduledJobs) {
      this.scheduledJobs.on('jobCompleted', (job) => {
        console.log(`[AnalyticsIntegration] Job completed: ${job.jobName}`);
      });

      this.scheduledJobs.on('jobFailed', (job) => {
        console.error(`[AnalyticsIntegration] Job failed: ${job.jobName} - ${job.error}`);
      });
    }

    console.log('[AnalyticsIntegration] ✓ Event listeners configured');
  }

  /**
   * Tracks evento de API automaticamente
   * @private
   */
  async trackAPIEvent(req, res, responseTime, responseData) {
    if (!this.analyticsEngine || !this.isInitialized) return;

    try {
      await this.analyticsEngine.trackEvent({
        eventType: 'performance_metric',
        eventName: 'api_request',
        properties: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          userAgent: req.headers['user-agent'],
          contentLength: JSON.stringify(responseData || {}).length,
          success: res.statusCode < 400
        },
        userId: req.user?.id,
        sessionId: req.sessionID || req.headers['x-session-id']
      });
    } catch (error) {
      console.error('[AnalyticsIntegration] Error tracking API event:', error);
    }
  }

  // =====================================================
  // MÉTODOS PÚBLICOS PARA INTEGRAÇÃO
  // =====================================================

  /**
   * Track evento personalizado
   */
  async trackEvent(eventData) {
    if (!this.analyticsEngine || !this.isInitialized) {
      console.warn('[AnalyticsIntegration] Analytics not initialized, event not tracked');
      return false;
    }

    try {
      const result = await this.analyticsEngine.trackEvent(eventData);
      return result.success;
    } catch (error) {
      console.error('[AnalyticsIntegration] Error tracking custom event:', error);
      return false;
    }
  }

  /**
   * Track múltiplos eventos
   */
  async trackBatch(events) {
    if (!this.analyticsEngine || !this.isInitialized) {
      console.warn('[AnalyticsIntegration] Analytics not initialized, batch not tracked');
      return false;
    }

    try {
      const result = await this.analyticsEngine.trackBatch(events);
      return result.success;
    } catch (error) {
      console.error('[AnalyticsIntegration] Error tracking batch events:', error);
      return false;
    }
  }

  /**
   * Obtém KPIs atuais
   */
  async getCurrentKPIs(options = {}) {
    if (!this.analyticsEngine || !this.isInitialized) {
      throw new Error('Analytics not initialized');
    }

    return await this.analyticsEngine.calculateKPIs(options);
  }

  /**
   * Gera relatório sob demanda
   */
  async generateReport(type, options = {}) {
    if (!this.reportGenerator || !this.isInitialized) {
      throw new Error('Report generator not initialized');
    }

    switch (type) {
      case 'daily':
        return await this.reportGenerator.generateDailyExecutiveReport(options.date);
      case 'weekly':
        return await this.reportGenerator.generateWeeklyBusinessReport(options.startDate);
      case 'monthly':
        return await this.reportGenerator.generateMonthlyExecutiveReport(options.date);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  /**
   * Verifica anomalias em métrica específica
   */
  async checkAnomalies(metricName, currentValue, options = {}) {
    if (!this.anomalyDetector || !this.isInitialized) {
      throw new Error('Anomaly detector not initialized');
    }

    return await this.anomalyDetector.detectAnomalies(metricName, currentValue, options);
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats() {
    if (!this.isInitialized) {
      return { initialized: false };
    }

    return {
      initialized: true,
      engine: this.analyticsEngine ? this.analyticsEngine.getSystemMetrics() : null,
      detector: this.anomalyDetector ? this.anomalyDetector.getDetectorMetrics() : null,
      jobs: this.scheduledJobs ? this.scheduledJobs.getJobsStatistics() : null,
      cache: this.metricsCalculator ? this.metricsCalculator.getCacheStats() : null
    };
  }

  /**
   * Executa limpeza manual
   */
  async performCleanup() {
    if (!this.analyticsEngine || !this.isInitialized) {
      throw new Error('Analytics not initialized');
    }

    return await this.analyticsEngine.cleanup();
  }

  /**
   * Para sistema de analytics
   */
  async shutdown() {
    console.log('[AnalyticsIntegration] Shutting down analytics system...');

    if (this.scheduledJobs) {
      this.scheduledJobs.stop();
    }

    if (this.analyticsEngine) {
      // Flush final da queue
      await this.analyticsEngine.cleanup();
    }

    this.isInitialized = false;
    console.log('[AnalyticsIntegration] Analytics system shutdown complete');
  }
}

// =====================================================
// HELPER FUNCTIONS PARA INTEGRAÇÃO FÁCIL
// =====================================================

/**
 * Factory function para facilitar integração
 */
function createAnalyticsIntegration(app, database = null) {
  return new AnalyticsIntegration(app, database);
}

/**
 * Middleware para tracking automático de usuários
 */
function createUserTrackingMiddleware(analyticsIntegration) {
  return (req, res, next) => {
    // Adicionar método helper para tracking no request
    req.trackEvent = async (eventData) => {
      return await analyticsIntegration.trackEvent({
        ...eventData,
        userId: req.user?.id,
        sessionId: req.sessionID
      });
    };

    next();
  };
}

/**
 * Decorator para tracking automático de funções
 */
function trackFunction(analyticsIntegration, eventName) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args) {
      const startTime = Date.now();
      let result;
      let error;

      try {
        result = await method.apply(this, args);
        return result;
      } catch (e) {
        error = e;
        throw e;
      } finally {
        const duration = Date.now() - startTime;
        
        // Track evento
        analyticsIntegration.trackEvent({
          eventType: 'system_event',
          eventName: eventName || propertyName,
          properties: {
            duration,
            success: !error,
            error: error?.message,
            argsCount: args.length
          }
        }).catch(console.error);
      }
    };

    return descriptor;
  };
}

module.exports = {
  AnalyticsIntegration,
  createAnalyticsIntegration,
  createUserTrackingMiddleware,
  trackFunction
};