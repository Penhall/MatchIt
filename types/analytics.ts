// types/analytics.ts
// Tipos para Analytics e Métricas do Sistema MatchIt

import { RecommendationAlgorithm, FeedbackAction, MatchStatus } from './recommendation/base';

// =====================================================
// EVENTOS DE ANALYTICS
// =====================================================

/**
 * Evento base de analytics
 */
export interface AnalyticsEvent {
  // Identificação
  id: string;
  userId?: string;
  sessionId: string;
  
  // Dados do evento
  eventType: AnalyticsEventType;
  eventName: string;
  properties: Record<string, any>;
  
  // Contexto temporal
  timestamp: Date;
  serverTimestamp: Date;
  clientTimezone: string;
  
  // Contexto técnico
  deviceInfo: DeviceAnalyticsInfo;
  appVersion: string;
  platformVersion: string;
  
  // Localização e rede
  location?: AnalyticsLocation;
  networkInfo?: NetworkAnalyticsInfo;
  
  // Metadados
  source: EventSource;
  environment: 'development' | 'staging' | 'production';
  experimentGroups?: string[];
}

/**
 * Tipos de evento de analytics
 */
export type AnalyticsEventType = 
  | 'user_action'           // Ação do usuário
  | 'system_event'          // Evento do sistema
  | 'performance_metric'    // Métrica de performance
  | 'business_metric'       // Métrica de negócio
  | 'error_event'           // Evento de erro
  | 'recommendation_event'  // Evento de recomendação
  | 'conversion_event'      // Evento de conversão
  | 'engagement_event'      // Evento de engajamento
  | 'retention_event'       // Evento de retenção
  | 'monetization_event';   // Evento de monetização

/**
 * Origem do evento
 */
export type EventSource = 
  | 'mobile_app'
  | 'web_app'
  | 'desktop_app'
  | 'api'
  | 'background_job'
  | 'admin_panel'
  | 'external_service';

/**
 * Informações do dispositivo para analytics
 */
export interface DeviceAnalyticsInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'smart_tv' | 'watch' | 'unknown';
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  language: string;
  languages: string[];
  userAgent: string;
}

/**
 * Localização para analytics
 */
export interface AnalyticsLocation {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  ipAddress?: string; // Hash ou IP mascarado
  timezone: string;
}

/**
 * Informações de rede
 */
export interface NetworkAnalyticsInfo {
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveConnectionType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  downlink?: number; // Mbps
  rtt?: number; // Round trip time em ms
}

// =====================================================
// MÉTRICAS DE RECOMENDAÇÃO
// =====================================================

/**
 * Métricas específicas do sistema de recomendação
 */
export interface RecommendationMetrics {
  // Identificação
  userId: string;
  algorithm: RecommendationAlgorithm;
  period: DateRange;
  
  // Métricas de efetividade
  totalRecommendations: number;
  totalViews: number;
  totalInteractions: number;
  
  // Taxas de conversão
  viewRate: number;              // Visualizações/Recomendações
  interactionRate: number;       // Interações/Visualizações
  likeRate: number;              // Likes/Interações
  matchRate: number;             // Matches/Likes
  conversationRate: number;      // Conversas/Matches
  
  // Qualidade das recomendações
  averageMatchScore: number;
  scoreDistribution: number[];   // Histograma de scores
  diversityIndex: number;        // Índice de diversidade
  noveltyIndex: number;          // Índice de novidade
  
  // Tempo e engajamento
  averageViewTime: number;       // Tempo médio visualizando perfil
  averageResponseTime: number;   // Tempo médio para responder
  sessionEngagement: number;     // Engajamento na sessão
  
  // Feedback qualitativo
  userSatisfactionScore: number; // 1-5
  algorithmRating: number;       // 1-5
  recommendationQualityScore: number; // 1-5
  
  // Métricas de retenção
  returnRate: number;            // Taxa de retorno
  retentionDays: number[];       // Retenção por dia
  
  // Performance técnica
  averageLatency: number;        // Latência média da API
  errorRate: number;             // Taxa de erro
  cacheHitRate: number;          // Taxa de acerto do cache
}

/**
 * Período de data
 */
export interface DateRange {
  start: Date;
  end: Date;
  timezone: string;
}

// =====================================================
// FUNIL DE CONVERSÃO
// =====================================================

/**
 * Análise de funil de conversão
 */
export interface ConversionFunnel {
  // Identificação
  funnelName: string;
  period: DateRange;
  segmentation?: FunnelSegmentation;
  
  // Etapas do funil
  steps: ConversionStep[];
  
  // Métricas globais
  totalUsers: number;
  overallConversionRate: number;
  averageTimeToConvert: number;
  
  // Análise de abandono
  dropoffAnalysis: DropoffAnalysis[];
  
  // Comparações
  previousPeriodComparison?: ConversionComparison;
  cohortAnalysis?: CohortAnalysis;
}

/**
 * Etapa do funil de conversão
 */
export interface ConversionStep {
  stepNumber: number;
  stepName: string;
  description: string;
  
  // Métricas da etapa
  usersEntered: number;
  usersCompleted: number;
  completionRate: number;
  
  // Tempo nesta etapa
  averageTimeSpent: number;
  medianTimeSpent: number;
  
  // Abandono
  usersDropped: number;
  dropoffRate: number;
  dropoffReasons?: string[];
  
  // Próxima etapa
  conversionToNext: number;
  conversionRate: number;
}

/**
 * Segmentação do funil
 */
export interface FunnelSegmentation {
  dimension: string; // ex: 'user_type', 'device_type', 'traffic_source'
  segments: FunnelSegment[];
}

/**
 * Segmento do funil
 */
export interface FunnelSegment {
  segmentName: string;
  segmentValue: string;
  userCount: number;
  conversionRate: number;
  performance: 'above_average' | 'average' | 'below_average';
}

/**
 * Análise de abandono
 */
export interface DropoffAnalysis {
  stepName: string;
  dropoffRate: number;
  commonDropoffPoints: string[];
  suggestedImprovements: string[];
  impactPotential: 'high' | 'medium' | 'low';
}

/**
 * Comparação de conversão
 */
export interface ConversionComparison {
  previousPeriod: DateRange;
  conversionRateChange: number;
  statisticalSignificance: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

/**
 * Análise de coorte
 */
export interface CohortAnalysis {
  cohortType: 'daily' | 'weekly' | 'monthly';
  cohorts: Cohort[];
  retentionMatrix: number[][];
  averageRetention: number[];
}

/**
 * Coorte de usuários
 */
export interface Cohort {
  cohortPeriod: string;
  cohortSize: number;
  retentionRates: number[]; // Retenção por período
}

// =====================================================
// MÉTRICAS DE ENGAJAMENTO
// =====================================================

/**
 * Análise detalhada de engajamento
 */
export interface EngagementAnalysis {
  userId: string;
  period: DateRange;
  
  // Métricas básicas
  totalSessions: number;
  totalTimeSpent: number; // Em minutos
  averageSessionDuration: number;
  sessionsPerDay: number;
  
  // Padrões de uso
  usagePatterns: UsagePattern[];
  peakUsageHours: number[];
  preferredDays: number[];
  
  // Profundidade de engajamento
  engagementDepth: EngagementDepth;
  featureUsage: FeatureUsage[];
  
  // Qualidade do engajamento
  engagementQuality: EngagementQuality;
  
  // Tendências
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  riskOfChurn: number; // 0-1
  
  // Comparações
  percentileRank: number; // Percentil em relação a outros usuários
  cohortComparison: CohortComparison;
}

/**
 * Padrão de uso identificado
 */
export interface UsagePattern {
  patternName: string;
  frequency: number;
  description: string;
  confidence: number; // 0-1
  examples: string[];
}

/**
 * Profundidade de engajamento
 */
export interface EngagementDepth {
  shallowActions: number; // Ações superficiais (scrolls, views)
  mediumActions: number;  // Ações médias (likes, clicks)
  deepActions: number;    // Ações profundas (messages, meets)
  
  depthScore: number;     // Score de profundidade (0-1)
  engagementLevel: 'casual' | 'moderate' | 'engaged' | 'power_user';
}

/**
 * Uso de features
 */
export interface FeatureUsage {
  featureName: string;
  usageCount: number;
  lastUsed: Date;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  satisfaction: number; // 1-5 se disponível
}

/**
 * Qualidade do engajamento
 */
export interface EngagementQuality {
  intentionalityScore: number; // Quão intencional é o uso (0-1)
  satisfactionScore: number;   // Score de satisfação (0-1)
  valueRealizationScore: number; // Quão bem realiza valor (0-1)
  
  qualityIndicators: QualityIndicator[];
  improvementAreas: string[];
}

/**
 * Indicador de qualidade
 */
export interface QualityIndicator {
  indicator: string;
  value: number;
  benchmark: number;
  performance: 'above' | 'at' | 'below';
}

/**
 * Comparação com coorte
 */
export interface CohortComparison {
  cohortId: string;
  cohortAverage: number;
  userPerformance: number;
  percentileRank: number;
  comparisonInsights: string[];
}

// =====================================================
// MÉTRICAS DE NEGÓCIO
// =====================================================

/**
 * KPIs principais do negócio
 */
export interface BusinessKPIs {
  period: DateRange;
  
  // Crescimento de usuários
  userGrowth: {
    newUsers: number;
    activeUsers: number;
    retainedUsers: number;
    churnedUsers: number;
    
    growthRate: number;
    churnRate: number;
    retentionRate: number;
  };
  
  // Engajamento
  engagement: {
    averageSessionsPerUser: number;
    averageTimePerUser: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    
    dau_wau_ratio: number; // Stickiness
    dau_mau_ratio: number;
  };
  
  // Matching e conversões
  matching: {
    totalMatches: number;
    averageMatchesPerUser: number;
    matchSuccessRate: number;
    conversationStartRate: number;
    
    timeToFirstMatch: number;
    timeToFirstConversation: number;
  };
  
  // Monetização
  monetization: {
    totalRevenue: number;
    revenuePerUser: number;
    subscriptionRate: number;
    premiumConversionRate: number;
    
    averageRevenuePerPayingUser: number;
    lifetimeValue: number;
  };
  
  // Qualidade do produto
  quality: {
    userSatisfactionScore: number;
    netPromoterScore: number;
    appRating: number;
    supportTicketRate: number;
    
    bugReportRate: number;
    crashRate: number;
  };
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Configuração de tracking
 */
export interface TrackingConfig {
  // Eventos habilitados
  enabledEvents: AnalyticsEventType[];
  
  // Sampling
  samplingRate: number; // 0-1
  highValueUsersSamplingRate: number;
  
  // Privacidade
  respectDoNotTrack: boolean;
  anonymizeIpAddresses: boolean;
  enableGdprMode: boolean;
  
  // Performance
  batchSize: number;
  flushInterval: number; // em segundos
  maxRetries: number;
  
  // Qualidade dos dados
  enableValidation: boolean;
  enableDeduplication: boolean;
  enableSchemaValidation: boolean;
}

/**
 * Utilitários para analytics
 */
export namespace AnalyticsUtils {
  export function createEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  export function calculateConversionRate(numerator: number, denominator: number): number {
    return denominator > 0 ? (numerator / denominator) * 100 : 0;
  }
  
  export function calculateGrowthRate(current: number, previous: number): number {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }
  
  export function calculateRetentionRate(retained: number, cohortSize: number): number {
    return cohortSize > 0 ? (retained / cohortSize) * 100 : 0;
  }
  
  export function calculateChurnRate(churned: number, totalUsers: number): number {
    return totalUsers > 0 ? (churned / totalUsers) * 100 : 0;
  }
  
  export function formatMetric(value: number, type: 'percentage' | 'currency' | 'time' | 'count'): string {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'time':
        return `${Math.floor(value / 60)}m ${Math.floor(value % 60)}s`;
      case 'count':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }
}