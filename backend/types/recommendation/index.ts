// types/recommendation/index.ts

// Importações adicionais para resolver erros de tipos
import type { MatchScore } from './match-score';
import type {
  RecommendationAlgorithm, 
  FeedbackAction, 
  CompatibilityDimensions, 
  AlgorithmConfig, 
  AlgorithmPerformance, 
  RecommendationContext, 
  RecommendationFilters
} from './base';
import type { 
  UserInteraction,
  InteractionContext,
  DeviceInfo 
} from './user-interaction-core';

// Exportações centralizadas para o Sistema de Recomendação MatchIt

// =====================================================
// TIPOS BASE E FUNDAMENTAIS
// =====================================================

export type {
  // Algoritmos e configurações
  RecommendationAlgorithm,
  FeedbackAction,
  MatchStatus,
  
  // Dimensões de compatibilidade
  CompatibilityDimensions,
  CompatibilityAnalysis,
  CompatibilityFactor,
  
  // Configuração de algoritmos
  UserAlgorithmWeights,
  AlgorithmConfig,
  AlgorithmPerformance,
  ResourceUsage,
  
  // Contexto e localização
  RecommendationContext,
  RecommendationFilters,
  GeographicLocation,
  UserActivity,
  UserInteractionSummary,
  
  // Qualidade de perfil
  ProfileQuality,
  ProfileQualityIssue,
  ProfileQualityIssueType
} from './base';

// =====================================================
// PERFIL ESTENDIDO DO USUÁRIO
// =====================================================

export type {
  // Perfil principal
  ExtendedUserProfile,
  LocationHistory,
  
  // Preferências de estilo
  ExtendedStylePreferences,
  StyleChoice,
  StylePersonalityType,
  StyleEvolution,
  StyleChange,
  
  // Perfis psicológicos
  PersonalityProfile,
  EmotionalProfile,
  EmotionalState,
  EmotionalPattern,
  EmotionalTrigger,
  EmotionalNeed,
  MoodEntry,
  EmotionalTrend,
  
  // Lifestyle e valores
  LifestyleProfile,
  TimePattern,
  WeekendPreference,
  LifeGoal,
  PersonalValue,
  
  // Engajamento e verificação
  EngagementMetrics,
  VerificationStatus,
  
  // Preferências de matching
  MatchingPreferences,
  LocationPreference,
  
  // Histórico e aprendizado
  InteractionHistorySummary,
  LearningProfile,
  LearnedPattern,
  UserPrediction,
  
  // Preferências temporais
  TemporalPreferences,
  SeasonalPreference,
  HolidayBehavior,
  
  // Privacidade e sistema
  PrivacySettings,
  BlockSettings,
  UserSystemMetadata,
  DataIntegrityCheck,
  AlgorithmPerformanceEntry,
  SystemUsageStats
} from './extended-user';

// =====================================================
// SISTEMA DE SCORING
// =====================================================

export type {
  // Score principal
  MatchScore,
  MatchExplanation,
  ExplanationTone,
  
  // Fatores e evidências
  ScoreFactor,
  FactorEvidence,
  EvidenceType,
  FactorCategory,
  
  // Feedback e resultados
  MatchFeedback,
  MatchAction,
  MatchOutcome,
  RelationshipType,
  
  // Análise em lote
  MatchScoreBatch,
  ScoreDistribution,
  MatchScoreComparison,
  ComparisonRecommendation,
  
  // Análise de tendências
  ScoreTrendAnalysis,
  TrendInfo,
  ScorePattern,
  ScoreAnomaly,
  AnomalyType,
  
  // Configuração
  ScoringConfig
} from './match-score';

// =====================================================
// INTERAÇÕES E FEEDBACK
// =====================================================

export type {
  // Interação principal
  UserInteraction,
  InteractionContext,
  InteractionSource,
  ClickPattern,
  
  // Dispositivo e localização
  DeviceInfo,
  DeviceType,
  NetworkType,
  InteractionLocation,
  
  // Histórico e padrões
  UserInteractionHistory,
  TimeSlot,
  BehaviorPattern,
  BehaviorPatternType,
  
  // Feedback sobre recomendações
  RecommendationFeedback,
  RecommendationIssue,
  RecommendationIssueType
} from './user-interaction-core';

export type {
  // Métricas de engajamento
  EngagementMetrics as DetailedEngagementMetrics,
  
  // Análise de sentiment
  FeedbackSentiment,
  
  // Análise comportamental
  UserBehaviorAnalysis,
  BehaviorEvolution,
  RevealedPreference,
  BehaviorPrediction,
  BehaviorPredictionType,
  OptimizationRecommendation,
  OptimizationArea,
  
  // Análise de sessão
  DetailedSessionAnalysis,
  SessionStep,
  ConversionEvent,
  SessionQuality,
  SessionOutcome,
  SessionOutcomeType
} from './user-interaction-analytics';

// =====================================================
// CONSTANTES E UTILITÁRIOS
// =====================================================

export { RECOMMENDATION_CONSTANTS } from './base';
export { MatchScoreUtils } from './match-score';
export { InteractionAnalyzer } from './user-interaction-analytics';
export { RecommendationTypes } from './base';

// =====================================================
// TIPOS COMPOSTOS E AUXILIARES
// =====================================================

/**
 * Resultado completo de uma recomendação
 */
export interface RecommendationResult {
  // Dados principais
  matches: MatchScore[];
  totalCandidates: number;
  processingTime: number;
  algorithm: RecommendationAlgorithm;
  
  // Contexto da requisição
  context: RecommendationContext;
  requestId: string;
  timestamp: Date;
  
  // Qualidade e diversidade
  averageScore: number;
  diversityScore: number;
  noveltyScore: number;
  
  // Cache e performance
  fromCache: boolean;
  cacheHitRate: number;
  
  // Metadados
  version: string;
  experimentalFeatures?: string[];
}

/**
 * Configuração completa do sistema de recomendação
 */
export interface RecommendationSystemConfig {
  // Algoritmos disponíveis
  availableAlgorithms: AlgorithmConfig[];
  defaultAlgorithm: RecommendationAlgorithm;
  
  // Configurações globais
  globalFilters: RecommendationFilters;
  qualityThresholds: Record<string, number>;
  
  // Performance e cache
  performanceConfig: {
    maxProcessingTimeMs: number;
    cacheTimeoutMinutes: number;
    maxConcurrentRequests: number;
    enableParallelProcessing: boolean;
  };
  
  // Features experimentais
  experimentalFeatures: {
    enableABTesting: boolean;
    enableMachineLearning: boolean;
    enableAdvancedAnalytics: boolean;
    testGroupPercentage: number;
  };
  
  // Monitoramento
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableAnomalyDetection: boolean;
  };
}

/**
 * Estado completo de uma sessão de usuário
 */
export interface UserRecommendationSession {
  // Identificação
  sessionId: string;
  userId: string;
  
  // Dados da sessão
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  
  // Recomendações desta sessão
  recommendations: MatchScore[];
  interactions: UserInteraction[];
  
  // Métricas da sessão
  totalRecommendationsViewed: number;
  averageViewTime: number;
  interactionRate: number;
  
  // Estado do algoritmo
  personalizedWeights?: CompatibilityDimensions;
  learnedPreferences: Record<string, any>;
  
  // Contexto atualizado
  currentContext: RecommendationContext;
  deviceInfo: DeviceInfo;
}

/**
 * Resposta da API de recomendações
 */
export interface RecommendationApiResponse {
  success: boolean;
  data?: RecommendationResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    rateLimit?: {
      remaining: number;
      resetTime: string;
    };
  };
}

/**
 * Requisição para API de feedback
 */
export interface FeedbackRequest {
  userId: string;
  targetUserId: string;
  action: FeedbackAction;
  context: Partial<InteractionContext>;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Estatísticas agregadas do sistema
 */
export interface SystemStatistics {
  // Métricas gerais
  totalUsers: number;
  activeUsers: number;
  totalRecommendations: number;
  totalInteractions: number;
  
  // Taxas de sucesso
  overallMatchRate: number;
  overallConversationRate: number;
  userSatisfactionScore: number;
  
  // Performance dos algoritmos
  algorithmPerformance: Record<RecommendationAlgorithm, AlgorithmPerformance>;
  bestPerformingAlgorithm: RecommendationAlgorithm;
  
  // Qualidade dos dados
  averageProfileQuality: number;
  dataCompletenessRate: number;
  
  // Tendências
  growthMetrics: {
    userGrowthRate: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    qualityTrend: 'improving' | 'stable' | 'declining';
  };
  
  // Período da análise
  period: {
    start: Date;
    end: Date;
  };
  
  // Metadados
  generatedAt: Date;
  version: string;
}

// =====================================================
// GUARDS E VALIDADORES
// =====================================================

/**
 * Type guards para validação em runtime
 */
export namespace RecommendationGuards {
  export function isValidRecommendationAlgorithm(value: any): value is RecommendationAlgorithm {
    return typeof value === 'string' && 
           ['hybrid', 'collaborative', 'content', 'social', 'temporal'].includes(value);
  }
  
  export function isValidFeedbackAction(value: any): value is FeedbackAction {
    return typeof value === 'string' && 
           ['like', 'dislike', 'super_like', 'skip', 'report', 'block'].includes(value);
  }
  
  export function isValidMatchScore(value: any): value is MatchScore {
    return typeof value === 'object' && 
           value !== null &&
           typeof value.overallScore === 'number' &&
           value.overallScore >= 0 && 
           value.overallScore <= 1 &&
           typeof value.userId === 'string' &&
           typeof value.targetUserId === 'string';
  }
  
  export function isValidCompatibilityDimensions(value: any): value is CompatibilityDimensions {
    if (typeof value !== 'object' || value === null) return false;
    
    const requiredKeys: (keyof CompatibilityDimensions)[] = [
      'style', 'emotional', 'hobby', 'location', 'personality', 
      'lifestyle', 'values', 'communication'
    ];
    
    return requiredKeys.every(key => {
      const val = value[key];
      return typeof val === 'number' && val >= 0 && val <= 1;
    });
  }
}

// =====================================================
// BUILDERS E HELPERS
// =====================================================

/**
 * Builders para criar objetos complexos
 */
export namespace RecommendationBuilders {
  /**
   * Cria contexto padrão para recomendações
   */
  export function createDefaultContext(userId: string): RecommendationContext {
    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date(),
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: [0, 6].includes(new Date().getDay()),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceType: 'mobile', // Default
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
    };
  }
  
  /**
   * Cria pesos padrão para algoritmo
   */
  export function createDefaultWeights(): CompatibilityDimensions {
    return {
      style: 0.25,
      emotional: 0.20,
      hobby: 0.20,
      location: 0.15,
      personality: 0.20,
      lifestyle: 0.0,
      values: 0.0,
      communication: 0.0
    };
  }
  
  /**
   * Cria filtros básicos para recomendações
   */
  export function createBasicFilters(): RecommendationFilters {
    return {
      minProfileCompleteness: 0.5,
      hasPhotos: true,
      activeWithinDays: 30,
      excludeBlockedUsers: true,
      excludePreviouslyInteracted: false
    };
  }
}
