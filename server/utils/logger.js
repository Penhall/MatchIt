// server/utils/logger.js - Sistema avançado de logging
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar formatos de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

// Configurar transports
const transports = [
  // Console (desenvolvimento)
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat,
    silent: process.env.NODE_ENV === 'test'
  }),

  // Arquivo geral com rotação diária
  new DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat
  }),

  // Arquivo de erros
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  }),

  // Arquivo de segurança
  new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '30d',
    level: 'warn',
    format: logFormat
  }),

  // Arquivo de analytics
  new DailyRotateFile({
    filename: path.join(logsDir, 'analytics-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '50m',
    maxFiles: '7d',
    level: 'info',
    format: logFormat
  })
];

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Logger específico para segurança
const securityLogger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'warn',
      format: consoleFormat
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
      format: logFormat
    })
  ]
});

// Logger específico para analytics
const analyticsLogger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'analytics-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '7d',
      format: logFormat
    })
  ]
});

// Funções de logging estruturado
const logRequest = (req, res, responseTime) => {
  const logData = {
    type: 'request',
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  if (res.statusCode >= 400) {
    logger.error('HTTP Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

const logError = (error, context = {}) => {
  const logData = {
    type: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };

  logger.error('Application Error', logData);
};

const logSecurity = (event, details = {}) => {
  const logData = {
    type: 'security',
    event,
    details,
    timestamp: new Date().toISOString()
  };

  securityLogger.warn('Security Event', logData);
};

const logTournament = (event, data = {}) => {
  const logData = {
    type: 'tournament',
    event,
    data,
    timestamp: new Date().toISOString()
  };

  analyticsLogger.info('Tournament Event', logData);
};

const logUserAction = (action, userId, data = {}) => {
  const logData = {
    type: 'user_action',
    action,
    userId,
    data,
    timestamp: new Date().toISOString()
  };

  analyticsLogger.info('User Action', logData);
};

const logPerformance = (operation, duration, metadata = {}) => {
  const logData = {
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    metadata,
    timestamp: new Date().toISOString()
  };

  if (duration > 1000) {
    logger.warn('Slow Operation', logData);
  } else {
    logger.debug('Performance', logData);
  }
};

const logDatabase = (query, duration, result = {}) => {
  const logData = {
    type: 'database',
    query: query.replace(/\s+/g, ' ').trim(),
    duration: `${duration}ms`,
    rowCount: result.rowCount || 0,
    timestamp: new Date().toISOString()
  };

  if (duration > 500) {
    logger.warn('Slow Query', logData);
  } else {
    logger.debug('Database Query', logData);
  }
};

// Middleware de logging de requisições
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capturar dados originais
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    const endTime = Date.now();
    logRequest(req, res, endTime - startTime);
    originalSend.call(this, data);
  };

  res.json = function(data) {
    const endTime = Date.now();
    logRequest(req, res, endTime - startTime);
    originalJson.call(this, data);
  };

  next();
};

// Middleware de captura de erros não tratados
const errorLogger = (err, req, res, next) => {
  logError(err, {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Log de segurança para erros 4xx
  if (err.status >= 400 && err.status < 500) {
    logSecurity('client_error', {
      status: err.status,
      message: err.message,
      path: req.path,
      ip: req.ip
    });
  }

  next(err);
};

// Sistema de métricas em tempo real
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        average_response_time: 0
      },
      tournaments: {
        started: 0,
        completed: 0,
        abandoned: 0,
        average_duration: 0
      },
      users: {
        registrations: 0,
        logins: 0,
        active_sessions: 0
      },
      errors: {
        total: 0,
        database: 0,
        auth: 0,
        validation: 0
      }
    };

    this.responseTimes = [];
    this.startTime = Date.now();
  }

  recordRequest(responseTime, success = true) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    this.responseTimes.push(responseTime);
    
    // Manter apenas os últimos 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Calcular média
    this.metrics.requests.average_response_time = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  recordTournament(event) {
    if (this.metrics.tournaments[event]) {
      this.metrics.tournaments[event]++;
    }
  }

  recordUser(event) {
    if (this.metrics.users[event]) {
      this.metrics.users[event]++;
    }
  }

  recordError(type = 'total') {
    this.metrics.errors.total++;
    if (this.metrics.errors[type]) {
      this.metrics.errors[type]++;
    }
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      uptime: `${Math.floor(uptime / 1000)}s`,
      timestamp: new Date().toISOString()
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const errorRate = metrics.requests.total > 0 
      ? (metrics.requests.errors / metrics.requests.total) * 100 
      : 0;

    return {
      status: errorRate > 10 ? 'unhealthy' : 'healthy',
      error_rate: `${errorRate.toFixed(2)}%`,
      average_response_time: `${metrics.requests.average_response_time.toFixed(0)}ms`,
      uptime: metrics.uptime,
      total_requests: metrics.requests.total
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0, average_response_time: 0 },
      tournaments: { started: 0, completed: 0, abandoned: 0, average_duration: 0 },
      users: { registrations: 0, logins: 0, active_sessions: 0 },
      errors: { total: 0, database: 0, auth: 0, validation: 0 }
    };
    this.responseTimes = [];
    this.startTime = Date.now();
  }
}

// Instância global do coletor de métricas
const metricsCollector = new MetricsCollector();

// Agendar log de métricas periódico
setInterval(() => {
  const metrics = metricsCollector.getMetrics();
  logger.info('System Metrics', metrics);
}, 5 * 60 * 1000); // A cada 5 minutos

// Sistema de alertas
class AlertSystem {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      error_rate: 5, // 5%
      response_time: 2000, // 2 segundos
      memory_usage: 80 // 80%
    };
  }

  checkAlerts() {
    const metrics = metricsCollector.getMetrics();
    const health = metricsCollector.getHealthStatus();

    // Verificar taxa de erro
    const errorRate = parseFloat(health.error_rate);
    if (errorRate > this.thresholds.error_rate) {
      this.triggerAlert('high_error_rate', {
        current: `${errorRate}%`,
        threshold: `${this.thresholds.error_rate}%`
      });
    }

    // Verificar tempo de resposta
    const avgResponseTime = metrics.requests.average_response_time;
    if (avgResponseTime > this.thresholds.response_time) {
      this.triggerAlert('slow_response_time', {
        current: `${avgResponseTime.toFixed(0)}ms`,
        threshold: `${this.thresholds.response_time}ms`
      });
    }

    // Verificar uso de memória
    const memoryUsage = process.memoryUsage();
    const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryPercentage > this.thresholds.memory_usage) {
      this.triggerAlert('high_memory_usage', {
        current: `${memoryPercentage.toFixed(1)}%`,
        threshold: `${this.thresholds.memory_usage}%`
      });
    }
  }

  triggerAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };

    this.alerts.push(alert);
    
    // Manter apenas os últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    logger.warn('System Alert', alert);
    
    // Em produção, enviar notificação (email, Slack, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendNotification(alert);
    }
  }

  sendNotification(alert) {
    // Implementar notificações por email, Slack, etc.
    console.warn(`🚨 ALERT: ${alert.type} - ${JSON.stringify(alert.data)}`);
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(-limit).reverse();
  }
}

const alertSystem = new AlertSystem();

// Verificar alertas a cada minuto
setInterval(() => {
  alertSystem.checkAlerts();
}, 60 * 1000);

module.exports = {
  logger,
  securityLogger,
  analyticsLogger,
  logRequest,
  logError,
  logSecurity,
  logTournament,
  logUserAction,
  logPerformance,
  logDatabase,
  requestLogger,
  errorLogger,
  metricsCollector,
  alertSystem
};