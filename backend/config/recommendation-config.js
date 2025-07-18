// config/recommendation-config.js
// Configurações centralizadas do Sistema de Recomendação MatchIt

/**
 * Configurações dos algoritmos de recomendação
 */
const algorithmConfig = {
  // Algoritmo Híbrido (padrão)
  hybrid: {
    name: 'Algoritmo Híbrido',
    description: 'Combina múltiplas dimensões de compatibilidade',
    weights: {
      style_compatibility: 0.30,
      location: 0.25,
      personality: 0.20,
      lifestyle: 0.15,
      activity: 0.10
    },
    features: {
      enableMachineLearning: true,
      enableLocationBias: true,
      enableTemporalPatterns: true,
      enableSocialSignals: false,
      enablePersonalityAnalysis: true
    },
    parameters: {
      compatibilityThreshold: 0.3,
      maxCandidates: 100,
      diversityFactor: 0.2,
      recencyBoost: 0.1,
      popularityPenalty: 0.05
    }
  },

  // Algoritmo Colaborativo
  collaborative: {
    name: 'Filtro Colaborativo',
    description: 'Baseado em comportamento de usuários similares',
    weights: {
      style_compatibility: 0.25,
      location: 0.15,
      personality: 0.25,
      lifestyle: 0.20,
      activity: 0.15
    },
    features: {
      enableMachineLearning: true,
      enableLocationBias: false,
      enableTemporalPatterns: true,
      enableSocialSignals: true,
      enablePersonalityAnalysis: true
    },
    parameters: {
      compatibilityThreshold: 0.25,
      maxCandidates: 150,
      diversityFactor: 0.3,
      recencyBoost: 0.05,
      popularityPenalty: 0.1
    }
  },

  // Algoritmo Baseado em Conteúdo
  content: {
    name: 'Baseado em Conteúdo',
    description: 'Focado nas características do perfil do usuário',
    weights: {
      style_compatibility: 0.40,
      location: 0.20,
      personality: 0.25,
      lifestyle: 0.10,
      activity: 0.05
    },
    features: {
      enableMachineLearning: false,
      enableLocationBias: true,
      enableTemporalPatterns: false,
      enableSocialSignals: false,
      enablePersonalityAnalysis: true
    },
    parameters: {
      compatibilityThreshold: 0.4,
      maxCandidates: 80,
      diversityFactor: 0.1,
      recencyBoost: 0.15,
      popularityPenalty: 0.0
    }
  },

  // Algoritmo Baseado em Estilo
  style_based: {
    name: 'Compatibilidade de Estilo',
    description: 'Prioriza afinidades estéticas e visuais',
    weights: {
      style_compatibility: 0.60,
      location: 0.15,
      personality: 0.10,
      lifestyle: 0.10,
      activity: 0.05
    },
    features: {
      enableMachineLearning: true,
      enableLocationBias: false,
      enableTemporalPatterns: false,
      enableSocialSignals: false,
      enablePersonalityAnalysis: false
    },
    parameters: {
      compatibilityThreshold: 0.5,
      maxCandidates: 60,
      diversityFactor: 0.05,
      recencyBoost: 0.2,
      popularityPenalty: 0.0
    }
  },

  // Algoritmo Baseado em Localização
  location_based: {
    name: 'Proximidade Geográfica',
    description: 'Prioriza usuários próximos geograficamente',
    weights: {
      style_compatibility: 0.20,
      location: 0.50,
      personality: 0.15,
      lifestyle: 0.10,
      activity: 0.05
    },
    features: {
      enableMachineLearning: false,
      enableLocationBias: true,
      enableTemporalPatterns: true,
      enableSocialSignals: false,
      enablePersonalityAnalysis: false
    },
    parameters: {
      compatibilityThreshold: 0.2,
      maxCandidates: 200,
      diversityFactor: 0.4,
      recencyBoost: 0.1,
      popularityPenalty: 0.0
    }
  }
};

/**
 * Configurações de qualidade e filtros
 */
const qualityConfig = {
  // Filtros de qualidade mínima
  minProfileCompleteness: 0.6,          // 60% do perfil completo
  requireActiveUsers: true,             // Apenas usuários ativos
  maxInactivityDays: 30,               // Máximo 30 dias sem atividade
  
  // Filtros de distância
  defaultMaxDistance: 50,              // 50km padrão
  maxDistanceLimit: 500,               // Limite máximo de 500km
  
  // Filtros demográficos
  defaultAgeRange: [18, 65],           // Faixa etária padrão
  minAge: 18,                          // Idade mínima
  maxAge: 99,                          // Idade máxima
  
  // Filtros de compatibilidade
  minCompatibilityScore: 0.3,          // Score mínimo para recomendação
  maxRecommendationsPerRequest: 50,    // Máximo por requisição
  
  // Filtros de conteúdo
  blockReportedUsers: true,            // Bloquear usuários reportados
  requireVerifiedProfiles: false,       // Exigir perfis verificados
  enableContentFiltering: true         // Filtrar conteúdo inadequado
};

/**
 * Configurações de performance e cache
 */
const performanceConfig = {
  // Cache
  cacheTimeoutMinutes: 30,             // Cache de 30 minutos
  enableCache: true,                   // Habilitar cache
  maxCacheSize: 1000,                  // Máximo de entradas no cache
  
  // Processamento
  maxProcessingTimeMs: 5000,           // Máximo 5 segundos
  enableParallelProcessing: true,      // Processamento paralelo
  maxConcurrentRequests: 10,           // Máximo de requisições simultâneas
  
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000,              // Janela de 1 minuto
    maxRequests: 30,                  // 30 requisições por minuto
    skipSuccessfulRequests: false,     // Contar todas as requisições
    skipFailedRequests: true          // Não contar requisições com erro
  },
  
  // Batch processing
  batchSize: 20,                       // Processar em lotes de 20
  enableBatchProcessing: true          // Habilitar processamento em lote
};

/**
 * Configurações de aprendizado de máquina
 */
const machineLearningConfig = {
  // Parâmetros de aprendizado
  learningRate: 0.01,                  // Taxa de aprendizado
  enableAdaptiveWeights: true,         // Pesos adaptativos
  minInteractionsForLearning: 10,      // Mínimo de interações para aprender
  
  // Modelos de aprendizado
  models: {
    weightAdjustment: {
      enabled: true,
      updateFrequency: 'daily',        // Atualizar diariamente
      decayFactor: 0.95               // Fator de decay para dados antigos
    },
    preferenceDetection: {
      enabled: true,
      analysisWindow: 30,             // Analisar últimos 30 dias
      confidenceThreshold: 0.7        // Confiança mínima de 70%
    },
    anomalyDetection: {
      enabled: false,                 // Desabilitado por padrão
      threshold: 0.1,                 // Threshold para anomalias
      alertEnabled: true              // Alertas de anomalias
    }
  },
  
  // A/B Testing
  abTesting: {
    enabled: false,                   // Desabilitado por padrão
    testGroupPercentage: 0.1,         // 10% dos usuários em teste
    testDuration: 7,                  // 7 dias de teste
    minSampleSize: 100               // Mínimo de 100 usuários por grupo
  }
};

/**
 * Configurações de analytics e monitoramento
 */
const analyticsConfig = {
  // Métricas básicas
  enableMetrics: true,                 // Habilitar métricas
  enableLogging: true,                 // Habilitar logging
  logLevel: 'info',                    // Nível de log
  
  // Métricas específicas
  trackingEvents: [
    'recommendation_generated',
    'recommendation_viewed',
    'recommendation_feedback',
    'algorithm_weight_updated',
    'cache_hit',
    'cache_miss',
    'processing_time_exceeded',
    'error_occurred'
  ],
  
  // Retenção de dados
  dataRetention: {
    rawEvents: 90,                    // 90 dias para eventos brutos
    aggregatedMetrics: 365,           // 1 ano para métricas agregadas
    userInteractions: 180,            // 6 meses para interações
    errorLogs: 30                     // 30 dias para logs de erro
  },
  
  // Alertas
  alerts: {
    enabled: true,
    errorThreshold: 0.05,             // 5% de erro
    responseTimeThreshold: 3000,      // 3 segundos
    notificationEmail: process.env.ALERT_EMAIL || 'admin@matchit.com'
  }
};

/**
 * Configurações de desenvolvimento e debugging
 */
const developmentConfig = {
  // Debug
  enableDebugMode: process.env.NODE_ENV === 'development',
  verboseLogging: process.env.NODE_ENV === 'development',
  enableSQLLogging: false,
  
  // Mock data
  enableMockData: false,
  mockUserCount: 100,
  
  // Testing
  enableTestEndpoints: process.env.NODE_ENV === 'development',
  allowTestUsers: process.env.NODE_ENV !== 'production',
  
  // Performance profiling
  enableProfiling: false,
  profilingSampleRate: 0.01           // 1% de amostragem
};

/**
 * Configuração principal - combina todas as configurações
 */
export const recommendationConfig = {
  // Versão da configuração
  version: '1.3.0',
  lastUpdated: '2025-06-07',
  
  // Configurações por categoria
  algorithms: algorithmConfig,
  quality: qualityConfig,
  performance: performanceConfig,
  machineLearning: machineLearningConfig,
  analytics: analyticsConfig,
  development: developmentConfig,
  
  // Configuração ativa (pode ser alterada via environment)
  activeAlgorithm: process.env.DEFAULT_ALGORITHM || 'hybrid',
  
  // Features globais
  globalFeatures: {
    enableRecommendations: true,
    enableFeedback: true,
    enableAnalytics: true,
    enableMachineLearning: process.env.NODE_ENV === 'production',
    enableCache: true,
    enableRateLimit: true
  },
  
  // Configurações específicas por ambiente
  environment: {
    development: {
      enableDebugMode: true,
      cacheTimeoutMinutes: 5,
      maxProcessingTimeMs: 10000,
      rateLimit: { maxRequests: 100 }
    },
    production: {
      enableDebugMode: false,
      cacheTimeoutMinutes: 30,
      maxProcessingTimeMs: 5000,
      rateLimit: { maxRequests: 30 }
    },
    test: {
      enableDebugMode: true,
      enableCache: false,
      enableRateLimit: false,
      enableMockData: true
    }
  },
  
  // Métodos utilitários
  getAlgorithmConfig: (algorithmName) => {
    return algorithmConfig[algorithmName] || algorithmConfig.hybrid;
  },
  
  getEnvironmentConfig: () => {
    const env = process.env.NODE_ENV || 'development';
    return recommendationConfig.environment[env] || recommendationConfig.environment.development;
  },
  
  mergeWithEnvironment: () => {
    const envConfig = recommendationConfig.getEnvironmentConfig();
    return {
      ...recommendationConfig,
      ...envConfig
    };
  }
};

// Aplicar configurações específicas do ambiente
const finalConfig = recommendationConfig.mergeWithEnvironment();

export default finalConfig;