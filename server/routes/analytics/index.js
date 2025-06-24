// server/routes/analytics/index.js

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const AnalyticsEngine = require('../../services/analytics/analytics-engine');
const MetricsCalculator = require('../../services/analytics/metrics-calculator');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Inicializar serviços
const analyticsEngine = new AnalyticsEngine();
const metricsCalculator = new MetricsCalculator();

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

// Middleware para logs de auditoria
const auditLog = (req, res, next) => {
  console.log(`[Analytics API] ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'} - ${new Date().toISOString()}`);
  next();
};

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);
router.use(auditLog);

// =====================================================
// ROTAS DE EVENTOS
// =====================================================

/**
 * POST /api/analytics/events
 * Registra um evento de analytics
 */
router.post('/events',
  [
    body('eventType').isIn([
      'user_action', 'system_event', 'performance_metric', 'business_metric',
      'error_event', 'recommendation_event', 'conversion_event', 
      'engagement_event', 'retention_event', 'monetization_event'
    ]).withMessage('Invalid event type'),
    body('eventName').isString().isLength({ min: 1, max: 100 }).withMessage('Event name required'),
    body('properties').optional().isObject().withMessage('Properties must be an object'),
    body('timestamp').optional().isISO8601().withMessage('Invalid timestamp format'),
    body('deviceInfo').optional().isObject(),
    body('locationInfo').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        userId: req.user.id,
        sessionId: req.sessionId || `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'mobile_app',
        appVersion: req.headers['x-app-version'] || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const result = await analyticsEngine.trackEvent(eventData);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Analytics API] Error tracking event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track event',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/analytics/events/batch
 * Registra múltiplos eventos em lote
 */
router.post('/events/batch',
  [
    body('events').isArray({ min: 1, max: 100 }).withMessage('Events array required (max 100)'),
    body('events.*.eventType').isIn([
      'user_action', 'system_event', 'performance_metric', 'business_metric',
      'error_event', 'recommendation_event', 'conversion_event', 
      'engagement_event', 'retention_event', 'monetization_event'
    ]).withMessage('Invalid event type'),
    body('events.*.eventName').isString().isLength({ min: 1, max: 100 }).withMessage('Event name required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const events = req.body.events.map(event => ({
        ...event,
        userId: req.user.id,
        sessionId: req.sessionId || `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'mobile_app',
        appVersion: req.headers['x-app-version'] || 'unknown'
      }));

      const result = await analyticsEngine.trackBatch(events);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Analytics API] Error tracking batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track batch events',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =====================================================
// ROTAS DE MÉTRICAS E KPIs
// =====================================================

/**
 * GET /api/analytics/kpis
 * Obtém KPIs principais
 */
router.get('/kpis',
  [
    query('date').optional().isISO8601().withMessage('Invalid date format'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period'),
    query('categories').optional().isString().withMessage('Categories must be comma-separated string'),
    query('forceRecalculation').optional().isBoolean().withMessage('Force recalculation must be boolean')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        date = new Date().toISOString().split('T')[0],
        period = 'daily',
        categories = 'business,technical,product',
        forceRecalculation = false
      } = req.query;

      const categoriesArray = categories.split(',').map(c => c.trim());
      const targetDate = new Date(date);

      const result = await analyticsEngine.calculateKPIs({
        period,
        date: targetDate,
        categories: categoriesArray,
        forceRecalculation: forceRecalculation === 'true'
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Analytics API] Error calculating KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate KPIs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics/metrics/business
 * Obtém métricas de negócio detalhadas
 */
router.get('/metrics/business',
  requireRole(['admin', 'manager']),
  [
    query('date').optional().isISO8601().withMessage('Invalid date format'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        date = new Date().toISOString().split('T')[0],
        period = 'daily'
      } = req.query;

      const targetDate = new Date(date);
      const metrics = await metricsCalculator.calculateBusinessMetrics(targetDate, period);

      res.json({
        success: true,
        data: {
          date: targetDate,
          period,
          metrics,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('[Analytics API] Error calculating business metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate business metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics/metrics/technical
 * Obtém métricas técnicas
 */
router.get('/metrics/technical',
  requireRole(['admin', 'developer']),
  [
    query('date').optional().isISO8601().withMessage('Invalid date format'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        date = new Date().toISOString().split('T')[0],
        period = 'daily'
      } = req.query;

      const targetDate = new Date(date);
      const metrics = await metricsCalculator.calculateTechnicalMetrics(targetDate, period);

      res.json({
        success: true,
        data: {
          date: targetDate,
          period,
          metrics,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('[Analytics API] Error calculating technical metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate technical metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics/metrics/product
 * Obtém métricas de produto
 */
router.get('/metrics/product',
  requireRole(['admin', 'manager', 'product']),
  [
    query('date').optional().isISO8601().withMessage('Invalid date format'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        date = new Date().toISOString().split('T')[0],
        period = 'daily'
      } = req.query;

      const targetDate = new Date(date);
      const metrics = await metricsCalculator.calculateProductMetrics(targetDate, period);

      res.json({
        success: true,
        data: {
          date: targetDate,
          period,
          metrics,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('[Analytics API] Error calculating product metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate product metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =====================================================
// ROTAS DE DASHBOARD
// =====================================================

/**
 * GET /api/analytics/dashboard/executive
 * Dashboard executivo com KPIs principais
 */
router.get('/dashboard/executive',
  requireRole(['admin', 'manager', 'executive']),
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      
      // Calcular data de início baseada no timeRange
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Calcular métricas principais
      const [businessMetrics, technicalMetrics, productMetrics] = await Promise.all([
        metricsCalculator.calculateBusinessMetrics(endDate, 'daily'),
        metricsCalculator.calculateTechnicalMetrics(endDate, 'daily'),
        metricsCalculator.calculateProductMetrics(endDate, 'daily')
      ]);

      // Construir dashboard
      const dashboard = {
        summary: {
          timeRange,
          period: { startDate, endDate },
          totalUsers: businessMetrics.userGrowth.activeUsers,
          totalMatches: businessMetrics.matching.totalMatches,
          averageResponseTime: technicalMetrics.averageResponseTime,
          systemUptime: technicalMetrics.uptime
        },
        kpis: {
          business: {
            dau: businessMetrics.engagement.dailyActiveUsers,
            retentionRate: businessMetrics.retention.overallRetentionRate || 0,
            matchSuccessRate: businessMetrics.matching.matchSuccessRate,
            growthRate: businessMetrics.userGrowth.growthRate
          },
          technical: {
            responseTime: technicalMetrics.averageResponseTime,
            errorRate: technicalMetrics.errorRate,
            uptime: technicalMetrics.uptime
          },
          product: {
            featureAdoption: productMetrics.stylePreferencesAdoption,
            profileCompletion: productMetrics.profileCompletionRate
          }
        },
        trends: {
          // TODO: Implementar dados históricos para gráficos
          userGrowth: [],
          engagement: [],
          performance: []
        }
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('[Analytics API] Error generating executive dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate executive dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/analytics/dashboard/realtime
 * Dashboard em tempo real
 */
router.get('/dashboard/realtime',
  async (req, res) => {
    try {
      // Obter métricas do sistema
      const systemMetrics = analyticsEngine.getSystemMetrics();
      
      // Obter eventos recentes (últimas 24h)
      const recentEventsQuery = `
        SELECT 
          event_type,
          event_name,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          MAX(timestamp) as last_occurrence
        FROM analytics_events 
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY event_type, event_name
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const recentEvents = await analyticsEngine.config.database.query(recentEventsQuery);
      
      // Alertas ativos
      const activeAlertsQuery = `
        SELECT 
          alert_name,
          severity,
          current_value,
          threshold_value,
          detected_at
        FROM analytics_alerts 
        WHERE status = 'active'
        ORDER BY severity DESC, detected_at DESC
        LIMIT 5
      `;
      
      const activeAlerts = await analyticsEngine.config.database.query(activeAlertsQuery);

      const dashboard = {
        timestamp: new Date(),
        systemStatus: {
          ...systemMetrics,
          healthy: systemMetrics.engine.status === 'idle' && systemMetrics.performance.successRate > 95
        },
        recentActivity: recentEvents.rows,
        activeAlerts: activeAlerts.rows,
        liveMetrics: {
          eventsPerMinute: Math.round(systemMetrics.performance.throughput * 60),
          activeUsers: systemMetrics.engine.queueSize, // Simplificado
          systemLoad: systemMetrics.engine.queueSize / 100 // Simplificado
        }
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('[Analytics API] Error generating realtime dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate realtime dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =====================================================
// ROTAS DE RELATÓRIOS
// =====================================================

/**
 * GET /api/analytics/reports/summary
 * Relatório resumido
 */
router.get('/reports/summary',
  requireRole(['admin', 'manager']),
  [
    query('startDate').isISO8601().withMessage('Start date required'),
    query('endDate').isISO8601().withMessage('End date required'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { startDate, endDate, format = 'json' } = req.query;
      
      // TODO: Implementar geração de relatórios
      const report = {
        period: { startDate, endDate },
        summary: {
          totalUsers: 0,
          totalSessions: 0,
          totalMatches: 0
        },
        details: {
          // Dados detalhados do relatório
        }
      };

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-summary.csv"');
        // TODO: Converter para CSV
        res.send('CSV data here');
      } else {
        res.json({
          success: true,
          data: report
        });
      }

    } catch (error) {
      console.error('[Analytics API] Error generating summary report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate summary report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =====================================================
// ROTAS DE ADMINISTRAÇÃO
// =====================================================

/**
 * GET /api/analytics/system/status
 * Status do sistema de analytics
 */
router.get('/system/status',
  requireRole(['admin', 'developer']),
  async (req, res) => {
    try {
      const systemMetrics = analyticsEngine.getSystemMetrics();
      const cacheStats = metricsCalculator.getCacheStats();
      
      res.json({
        success: true,
        data: {
          ...systemMetrics,
          cache: cacheStats,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[Analytics API] Error getting system status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/analytics/system/cleanup
 * Limpa dados antigos
 */
router.post('/system/cleanup',
  requireRole(['admin']),
  async (req, res) => {
    try {
      const result = await analyticsEngine.cleanup();
      metricsCalculator.clearCache();
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Analytics API] Error during cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup system',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/analytics/system/recalculate
 * Força recálculo de métricas
 */
router.post('/system/recalculate',
  requireRole(['admin']),
  [
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('categories').optional().isArray().withMessage('Categories must be array')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        date = new Date().toISOString().split('T')[0],
        categories = ['business', 'technical', 'product']
      } = req.body;

      const result = await analyticsEngine.calculateKPIs({
        date: new Date(date),
        categories,
        forceRecalculation: true
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Analytics API] Error recalculating metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recalculate metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =====================================================

router.use((error, req, res, next) => {
  console.error('[Analytics API] Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date()
  });
});

module.exports = router;