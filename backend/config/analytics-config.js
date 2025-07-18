// config/analytics-config.js

/**
 * Configuração Central do Sistema de Analytics
 * Define todas as configurações, métricas, alertas e parâmetros do sistema
 */

const analyticsConfig = {
  // =====================================================
  // CONFIGURAÇÕES GERAIS
  // =====================================================
  
  general: {
    // Identificação do sistema
    systemName: 'MatchIt Analytics',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'production',
    
    // Configurações de timezone
    defaultTimezone: 'America/Sao_Paulo',
    
    // Configurações de idioma
    defaultLanguage: 'pt-BR',
    supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
    
    // Configurações de data
    dateFormats: {
      display: 'DD/MM/YYYY',
      api: 'YYYY-MM-DD',
      timestamp: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    }
  },

  // =====================================================
  // CONFIGURAÇÕES DO ENGINE
  // =====================================================
  
  engine: {
    // Processamento de eventos
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE) || 100,
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL) || 30000, // 30 segundos
    maxRetries: parseInt(process.env.ANALYTICS_MAX_RETRIES) || 3,
    retryDelay: 5000, // 5 segundos
    
    // Queue e cache
    maxQueueSize: 10000,
    maxCacheSize: 50000,
    cacheExpiry: 5 * 60 * 1000, // 5 minutos
    
    // Configurações de performance
    enableRealtimeProcessing: process.env.ANALYTICS_REALTIME !== 'false',
    enableBatchProcessing: process.env.ANALYTICS_BATCH !== 'false',
    enableCompression: process.env.ANALYTICS_COMPRESSION !== 'false',
    
    // Configurações de qualidade
    enableValidation: process.env.ANALYTICS_VALIDATION !== 'false',
    enableDeduplication: process.env.ANALYTICS_DEDUPLICATION !== 'false',
    enableSchemaValidation: process.env.ANALYTICS_SCHEMA_VALIDATION !== 'false',
    
    // Configurações de sampling
    samplingRate: parseFloat(process.env.ANALYTICS_SAMPLING_RATE) || 1.0, // 100%
    highValueUsersSamplingRate: 1.0, // 100% para usuários importantes
    
    // Configurações de privacidade
    respectDoNotTrack: process.env.ANALYTICS_RESPECT_DNT !== 'false',
    anonymizeIpAddresses: process.env.ANALYTICS_ANONYMIZE_IP !== 'false',
    enableGdprMode: process.env.ANALYTICS_GDPR_MODE === 'true'
  },

  // =====================================================
  // CONFIGURAÇÕES DE BANCO DE DADOS
  // =====================================================
  
  database: {
    // Configurações de conexão
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'matchit_analytics',
    username: process.env.DB_USER || 'matchit_user',
    password: process.env.DB_PASS || 'password',
    
    // Pool de conexões
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 20,
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50,
    connectionTimeout: parseInt(process.env.DB_TIMEOUT) || 10000,
    
    // Configurações de performance
    enableQueryOptimization: true,
    enableIndexOptimization: true,
    enableQueryLogging: process.env.NODE_ENV === 'development',
    
    // Retenção de dados
    retentionPeriods: {
      events: 90, // dias
      aggregations: 365, // dias
      kpis: 730, // dias (2 anos)
      alerts: 30, // dias para alertas resolvidos
      reports: 1095 // dias (3 anos)
    },
    
    // Backup e manutenção
    enableAutoCleanup: process.env.ANALYTICS_AUTO_CLEANUP !== 'false',
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 horas
    enableAutoBackup: process.env.ANALYTICS_AUTO_BACKUP === 'true',
    backupInterval: 7 * 24 * 60 * 60 * 1000 // 7 dias
  },

  // =====================================================
  // MÉTRICAS E KPIs
  // =====================================================
  
  metrics: {
    // Categorias de métricas
    categories: {
      business: {
        enabled: true,
        refreshInterval: 60 * 60 * 1000, // 1 hora
        priority: 'high'
      },
      technical: {
        enabled: true,
        refreshInterval: 15 * 60 * 1000, // 15 minutos
        priority: 'high'
      },
      product: {
        enabled: true,
        refreshInterval: 60 * 60 * 1000, // 1 hora
        priority: 'medium'
      },
      user: {
        enabled: true,
        refreshInterval: 30 * 60 * 1000, // 30 minutos
        priority: 'medium'
      }
    },
    
    // KPIs principais do negócio
    businessKPIs: {
      // Crescimento
      daily_active_users: {
        displayName: 'Daily Active Users',
        category: 'business',
        subcategory: 'growth',
        unit: 'users',
        target: 1000,
        criticalThreshold: 500,
        warningThreshold: 750,
        format: 'number',
        refreshInterval: 60 * 60 * 1000, // 1 hora
        enabled: true
      },
      
      monthly_active_users: {
        displayName: 'Monthly Active Users',
        category: 'business',
        subcategory: 'growth',
        unit: 'users',
        target: 5000,
        criticalThreshold: 2500,
        warningThreshold: 3750,
        format: 'number',
        refreshInterval: 4 * 60 * 60 * 1000, // 4 horas
        enabled: true
      },
      
      user_retention_7d: {
        displayName: 'User Retention (7 days)',
        category: 'business',
        subcategory: 'retention',
        unit: '%',
        target: 40,
        criticalThreshold: 20,
        warningThreshold: 30,
        format: 'percentage',
        refreshInterval: 24 * 60 * 60 * 1000, // 24 horas
        enabled: true
      },
      
      // Engajamento
      session_duration_avg: {
        displayName: 'Average Session Duration',
        category: 'business',
        subcategory: 'engagement',
        unit: 'minutes',
        target: 15,
        criticalThreshold: 5,
        warningThreshold: 10,
        format: 'duration',
        refreshInterval: 60 * 60 * 1000,
        enabled: true
      },
      
      // Matching
      match_success_rate: {
        displayName: 'Match Success Rate',
        category: 'business',
        subcategory: 'matching',
        unit: '%',
        target: 25,
        criticalThreshold: 10,
        warningThreshold: 18,
        format: 'percentage',
        refreshInterval: 60 * 60 * 1000,
        enabled: true
      },
      
      conversation_start_rate: {
        displayName: 'Conversation Start Rate',
        category: 'business',
        subcategory: 'matching',
        unit: '%',
        target: 60,
        criticalThreshold: 30,
        warningThreshold: 45,
        format: 'percentage',
        refreshInterval: 60 * 60 * 1000,
        enabled: true
      }
    },
    
    // KPIs técnicos
    technicalKPIs: {
      api_response_time: {
        displayName: 'API Response Time',
        category: 'technical',
        subcategory: 'performance',
        unit: 'ms',
        target: 500,
        criticalThreshold: 2000,
        warningThreshold: 1000,
        format: 'number',
        refreshInterval: 5 * 60 * 1000, // 5 minutos
        enabled: true
      },
      
      error_rate: {
        displayName: 'Error Rate',
        category: 'technical',
        subcategory: 'quality',
        unit: '%',
        target: 1,
        criticalThreshold: 5,
        warningThreshold: 3,
        format: 'percentage',
        refreshInterval: 5 * 60 * 1000,
        enabled: true
      },
      
      uptime_percentage: {
        displayName: 'System Uptime',
        category: 'technical',
        subcategory: 'reliability',
        unit: '%',
        target: 99.9,
        criticalThreshold: 98,
        warningThreshold: 99,
        format: 'percentage',
        refreshInterval: 5 * 60 * 1000,
        enabled: true
      },
      
      database_query_time: {
        displayName: 'Database Query Time',
        category: 'technical',
        subcategory: 'performance',
        unit: 'ms',
        target: 100,
        criticalThreshold: 1000,
        warningThreshold: 500,
        format: 'number',
        refreshInterval: 5 * 60 * 1000,
        enabled: true
      }
    },
    
    // KPIs de produto
    productKPIs: {
      feature_adoption_style: {
        displayName: 'Style Preferences Adoption',
        category: 'product',
        subcategory: 'features',
        unit: '%',
        target: 80,
        criticalThreshold: 40,
        warningThreshold: 60,
        format: 'percentage',
        refreshInterval: 4 * 60 * 60 * 1000,
        enabled: true
      },
      
      feature_adoption_emotional: {
        displayName: 'Emotional Profile Adoption',
        category: 'product',
        subcategory: 'features',
        unit: '%',
        target: 70,
        criticalThreshold: 35,
        warningThreshold: 50,
        format: 'percentage',
        refreshInterval: 4 * 60 * 60 * 1000,
        enabled: true
      },
      
      profile_completion_rate: {
        displayName: 'Profile Completion Rate',
        category: 'product',
        subcategory: 'onboarding',
        unit: '%',
        target: 85,
        criticalThreshold: 50,
        warningThreshold: 70,
        format: 'percentage',
        refreshInterval: 4 * 60 * 60 * 1000,
        enabled: true
      }
    }
  },

  // =====================================================
  // SISTEMA DE ALERTAS
  // =====================================================
  
  alerts: {
    // Configurações gerais
    enabled: process.env.ANALYTICS_ALERTS !== 'false',
    checkInterval: 5 * 60 * 1000, // 5 minutos
    maxActiveAlerts: 100,
    
    // Canais de notificação
    channels: {
      email: {
        enabled: process.env.ALERT_EMAIL !== 'false',
        recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
        throttleMinutes: 60 // Não enviar mais de um email por hora por alerta
      },
      
      slack: {
        enabled: process.env.ALERT_SLACK === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#analytics-alerts',
        throttleMinutes: 30
      },
      
      sms: {
        enabled: process.env.ALERT_SMS === 'true',
        numbers: (process.env.ALERT_SMS_NUMBERS || '').split(',').filter(Boolean),
        onlyCritical: true,
        throttleMinutes: 120 // 2 horas
      }
    },
    
    // Regras de alertas por categoria
    rules: {
      critical: {
        severities: ['critical'],
        channels: ['email', 'slack', 'sms'],
        escalationMinutes: 15,
        maxEscalations: 3
      },
      
      warning: {
        severities: ['high', 'medium'],
        channels: ['email', 'slack'],
        escalationMinutes: 60,
        maxEscalations: 2
      },
      
      info: {
        severities: ['low'],
        channels: ['slack'],
        escalationMinutes: 240,
        maxEscalations: 1
      }
    },
    
    // Configurações de throttling
    throttling: {
      enabled: true,
      globalLimitPerHour: 50,
      perMetricLimitPerHour: 5,
      cooldownMinutes: 30
    }
  },

  // =====================================================
  // RELATÓRIOS
  // =====================================================
  
  reports: {
    // Configurações gerais
    enabled: process.env.ANALYTICS_REPORTS !== 'false',
    outputDirectory: process.env.REPORTS_DIR || './reports',
    templateDirectory: process.env.REPORTS_TEMPLATES_DIR || './templates/reports',
    
    // Formatos suportados
    formats: ['json', 'html', 'pdf', 'csv', 'xlsx'],
    defaultFormat: 'json',
    
    // Configurações de email
    email: {
      enabled: process.env.REPORTS_EMAIL !== 'false',
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM || 'analytics@matchit.com'
    },
    
    // Cronogramas automáticos
    schedules: {
      daily_executive: {
        enabled: true,
        cron: '0 8 * * *', // 8:00 AM todos os dias
        timezone: 'America/Sao_Paulo',
        recipients: (process.env.DAILY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
        format: 'html'
      },
      
      weekly_business: {
        enabled: true,
        cron: '0 9 * * 1', // 9:00 AM segundas-feiras
        timezone: 'America/Sao_Paulo',
        recipients: (process.env.WEEKLY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
        format: 'html'
      },
      
      monthly_executive: {
        enabled: true,
        cron: '0 10 1 * *', // 10:00 AM primeiro dia do mês
        timezone: 'America/Sao_Paulo',
        recipients: (process.env.MONTHLY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
        format: 'pdf'
      }
    },
    
    // Configurações de conteúdo
    content: {
      includeCharts: true,
      includeMetadata: true,
      includeRawData: false,
      includePredictions: true,
      includeRecommendations: true,
      
      chartOptions: {
        width: 800,
        height: 400,
        theme: 'light',
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444']
      }
    }
  },

  // =====================================================
  // DASHBOARD
  // =====================================================
  
  dashboard: {
    // Configurações de refresh
    defaultRefreshInterval: 30000, // 30 segundos
    fastRefreshInterval: 10000, // 10 segundos (tempo real)
    slowRefreshInterval: 300000, // 5 minutos
    
    // Configurações de cache
    cacheEnabled: true,
    cacheTTL: 60000, // 1 minuto
    
    // Configurações de widgets
    widgets: {
      kpiCards: {
        enabled: true,
        maxItems: 8,
        showTrends: true,
        showSparklines: true
      },
      
      charts: {
        enabled: true,
        defaultType: 'line',
        enableInteraction: true,
        showDataPoints: true
      },
      
      tables: {
        enabled: true,
        pageSize: 20,
        enableSorting: true,
        enableFiltering: true
      },
      
      alerts: {
        enabled: true,
        maxVisible: 5,
        autoRefresh: true
      }
    },
    
    // Temas e personalização
    themes: {
      default: 'light',
      available: ['light', 'dark', 'auto'],
      colors: {
        primary: '#6366f1',
        secondary: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6'
      }
    },
    
    // Configurações de acesso
    access: {
      requireAuth: true,
      roles: {
        admin: ['view', 'edit', 'delete', 'export'],
        manager: ['view', 'export'],
        analyst: ['view'],
        developer: ['view', 'technical']
      }
    }
  },

  // =====================================================
  // INTEGRAÇÕES
  // =====================================================
  
  integrations: {
    // Google Analytics
    googleAnalytics: {
      enabled: process.env.GA_ENABLED === 'true',
      trackingId: process.env.GA_TRACKING_ID,
      enableEnhancedEcommerce: false
    },
    
    // Mixpanel
    mixpanel: {
      enabled: process.env.MIXPANEL_ENABLED === 'true',
      token: process.env.MIXPANEL_TOKEN,
      enablePeople: true
    },
    
    // Amplitude
    amplitude: {
      enabled: process.env.AMPLITUDE_ENABLED === 'true',
      apiKey: process.env.AMPLITUDE_API_KEY,
      enableRevenue: true
    },
    
    // Webhook personalizado
    webhook: {
      enabled: process.env.WEBHOOK_ENABLED === 'true',
      url: process.env.WEBHOOK_URL,
      secret: process.env.WEBHOOK_SECRET,
      events: ['alert_triggered', 'report_generated', 'anomaly_detected']
    }
  },

  // =====================================================
  // CONFIGURAÇÕES DE DESENVOLVIMENTO
  // =====================================================
  
  development: {
    // Debugging
    enableDebugLogs: process.env.NODE_ENV === 'development',
    enableVerboseLogs: process.env.ANALYTICS_VERBOSE === 'true',
    enableQueryLogging: process.env.ANALYTICS_QUERY_LOG === 'true',
    
    // Mock data
    enableMockData: process.env.ANALYTICS_MOCK_DATA === 'true',
    mockDataSize: parseInt(process.env.ANALYTICS_MOCK_SIZE) || 1000,
    
    // Performance testing
    enablePerformanceTracking: process.env.ANALYTICS_PERF_TRACKING === 'true',
    performanceLogInterval: 60000, // 1 minuto
    
    // API testing
    enableApiTesting: process.env.ANALYTICS_API_TESTING === 'true',
    testEndpoints: [
      '/api/analytics/events',
      '/api/analytics/kpis',
      '/api/analytics/dashboard/executive'
    ]
  }
};

// =====================================================
// VALIDAÇÃO DA CONFIGURAÇÃO
// =====================================================

/**
 * Valida a configuração ao carregar
 */
function validateConfig() {
  const errors = [];
  
  // Validar configurações obrigatórias
  if (!analyticsConfig.database.host) {
    errors.push('Database host is required');
  }
  
  if (!analyticsConfig.database.database) {
    errors.push('Database name is required');
  }
  
  // Validar configurações de email se alertas estão habilitados
  if (analyticsConfig.alerts.enabled && analyticsConfig.alerts.channels.email.enabled) {
    if (!analyticsConfig.reports.email.host || !analyticsConfig.reports.email.user) {
      errors.push('Email configuration is required when email alerts are enabled');
    }
  }
  
  // Validar intervalos
  if (analyticsConfig.engine.flushInterval < 1000) {
    errors.push('Flush interval must be at least 1000ms');
  }
  
  if (analyticsConfig.engine.batchSize < 1 || analyticsConfig.engine.batchSize > 1000) {
    errors.push('Batch size must be between 1 and 1000');
  }
  
  if (errors.length > 0) {
    console.error('[Analytics Config] Validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Analytics configuration validation failed');
  }
  
  console.log('[Analytics Config] Configuration validated successfully');
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Obtém configuração específica com fallback
 */
function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let current = analyticsConfig;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
}

/**
 * Obtém todas as métricas habilitadas
 */
function getEnabledMetrics() {
  const enabled = {};
  
  Object.entries(analyticsConfig.metrics.businessKPIs).forEach(([key, config]) => {
    if (config.enabled) enabled[key] = config;
  });
  
  Object.entries(analyticsConfig.metrics.technicalKPIs).forEach(([key, config]) => {
    if (config.enabled) enabled[key] = config;
  });
  
  Object.entries(analyticsConfig.metrics.productKPIs).forEach(([key, config]) => {
    if (config.enabled) enabled[key] = config;
  });
  
  return enabled;
}

/**
 * Obtém configuração de alerta para uma métrica
 */
function getAlertConfig(metricName) {
  const allMetrics = {
    ...analyticsConfig.metrics.businessKPIs,
    ...analyticsConfig.metrics.technicalKPIs,
    ...analyticsConfig.metrics.productKPIs
  };
  
  return allMetrics[metricName] || null;
}

// Validar configuração na inicialização
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = {
  analyticsConfig,
  getConfig,
  getEnabledMetrics,
  getAlertConfig,
  validateConfig
};