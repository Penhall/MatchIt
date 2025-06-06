// types/recommendation/base.ts
// Tipos fundamentais para o Sistema de Recomendação MatchIt

/**
 * Algoritmos de recomendação disponíveis
 */
export type RecommendationAlgorithm = 
  | 'hybrid'           // Híbrido (recomendado)
  | 'collaborative'    // Filtragem colaborativa
  | 'content'          // Baseado em conteúdo
  | 'social'           // Baseado em rede social
  | 'temporal';        // Baseado em padrões temporais

/**
 * Tipos de feedback que um usuário pode dar
 */
export type FeedbackAction = 
  | 'like'             // Curtir perfil
  | 'dislike'          // Não curtir perfil
  | 'super_like'       // Super curtir (premium)
  | 'skip'             // Pular sem decisão
  | 'report'           // Reportar perfil
  | 'block';           // Bloquear usuário

/**
 * Status de um match entre usuários
 */
export type MatchStatus = 
  | 'pending'          // Aguardando resposta
  | 'accepted'         // Match confirmado
  | 'rejected'         // Match rejeitado
  | 'expired'          // Match expirado
  | 'blocked';         // Um usuário bloqueou o outro

/**
 * Dimensões de compatibilidade analisadas
 */
export interface CompatibilityDimensions {
  style: number;              // Compatibilidade de estilo (0-1)
  emotional: number;          // Compatibilidade emocional (0-1)
  hobby: number;              // Compatibilidade de hobbies (0-1)
  location: number;           // Score de proximidade (0-1)
  personality: number;        // Match de personalidade (0-1)
  lifestyle: number;          // Compatibilidade de lifestyle (0-1)
  values: number;             // Alinhamento de valores (0-1)
  communication: number;      // Estilo de comunicação (0-1)
}

/**
 * Pesos personalizados para cada dimensão por usuário
 */
export interface UserAlgorithmWeights {
  userId: string;
  weights: CompatibilityDimensions;
  lastUpdated: Date;
  learnedFromInteractions: number;  // Quantas interações geraram estes pesos
  confidence: number;               // Confiança nos pesos (0-1)
}

/**
 * Configuração global do algoritmo
 */
export interface AlgorithmConfig {
  name: RecommendationAlgorithm;
  version: string;
  
  // Pesos padrão se usuário não tem personalização
  defaultWeights: CompatibilityDimensions;
  
  // Parâmetros do algoritmo
  parameters: {
    minCompatibilityThreshold: number;  // Score mínimo para recomendação
    maxCandidates: number;              // Máximo de candidatos a analisar
    diversityFactor: number;            // Fator de diversidade (0-1)
    recencyBoost: number;               // Boost para perfis recentes
    popularityPenalty: number;          // Penalidade para perfis muito populares
    
    // Filtros de qualidade
    minProfileCompleteness: number;     // % mínimo de perfil completo
    maxDistanceKm: number;              // Distância máxima padrão
    requireActiveUsers: boolean;        // Apenas usuários ativos
    
    // Cache e performance
    cacheTimeoutMinutes: number;
    enableParallelProcessing: boolean;
    maxProcessingTimeMs: number;
  };
  
  // Features habilitadas
  features: {
    enableMachineLearning: boolean;
    enableLocationBias: boolean;
    enableTemporalPatterns: boolean;
    enableSocialSignals: boolean;
    enablePersonalityAnalysis: boolean;
  };
}

/**
 * Contexto da recomendação
 */
export interface RecommendationContext {
  sessionId: string;
  requestId: string;
  
  // Contexto do usuário
  userId: string;
  userLocation?: GeographicLocation;
  userActivity: UserActivity;
  
  // Contexto temporal
  timestamp: Date;
  timeOfDay: number;           // 0-23
  dayOfWeek: number;           // 0-6 (Dom-Sab)
  isWeekend: boolean;
  userTimezone: string;
  
  // Contexto da sessão
  deviceType: 'mobile' | 'tablet' | 'desktop';
  appVersion: string;
  isVipUser: boolean;
  
  // Parâmetros da requisição
  requestedCount: number;
  algorithm?: RecommendationAlgorithm;
  filters?: RecommendationFilters;
  
  // Contexto histórico
  recentInteractions: UserInteractionSummary[];
  lastRecommendationTime?: Date;
  sessionStartTime: Date;
}

/**
 * Localização geográfica
 */
export interface GeographicLocation {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  accuracy?: number;           // Precisão em metros
  source: 'gps' | 'ip' | 'manual';
}

/**
 * Atividade atual do usuário
 */
export interface UserActivity {
  isOnline: boolean;
  lastSeenAt: Date;
  currentStatus: 'active' | 'away' | 'busy' | 'offline';
  sessionDuration: number;     // Duração da sessão atual em ms
  
  // Padrões de atividade
  averageSessionDuration: number;
  peakActivityHours: number[]; // Horários de maior atividade
  weeklyActivity: number[];    // Atividade por dia da semana
  
  // Comportamento na sessão atual
  profilesViewedInSession: number;
  interactionsInSession: number;
  averageViewTimeToday: number;
}

/**
 * Resumo de interações recentes
 */
export interface UserInteractionSummary {
  targetUserId: string;
  action: FeedbackAction;
  timestamp: Date;
  matchScore?: number;
  wasSuccessful?: boolean;     // Se gerou match/conversa
}

/**
 * Filtros para recomendações
 */
export interface RecommendationFilters {
  // Filtros demográficos
  ageRange?: [number, number];
  genders?: string[];
  locations?: string[];       // Cidades/regiões específicas
  maxDistance?: number;       // Em quilômetros
  
  // Filtros de perfil
  minProfileCompleteness?: number;
  hasPhotos?: boolean;
  hasBio?: boolean;
  verifiedOnly?: boolean;
  vipOnly?: boolean;
  
  // Filtros de atividade
  activeWithinDays?: number;
  minResponseRate?: number;   // Taxa mínima de resposta
  
  // Filtros de compatibilidade
  minCompatibilityScore?: number;
  preferredStyles?: string[];
  preferredHobbies?: string[];
  
  // Filtros de exclusão
  excludeUserIds?: string[];
  excludePreviouslyInteracted?: boolean;
  excludeBlockedUsers?: boolean;
}

/**
 * Qualidade de um perfil para recomendações
 */
export interface ProfileQuality {
  userId: string;
  overallScore: number;        // Score geral (0-1)
  
  // Componentes da qualidade
  completeness: number;        // Completude do perfil (0-1)
  photoQuality: number;        // Qualidade das fotos (0-1)
  bioQuality: number;          // Qualidade da bio (0-1)
  authenticity: number;        // Autenticidade (0-1)
  activity: number;            // Nível de atividade (0-1)
  
  // Flags de qualidade
  hasVerifiedPhotos: boolean;
  hasCompleteBio: boolean;
  hasRecentActivity: boolean;
  hasGoodResponseRate: boolean;
  
  // Problemas identificados
  qualityIssues: ProfileQualityIssue[];
  
  // Metadados
  lastAnalyzed: Date;
  analysisVersion: string;
}

/**
 * Problemas de qualidade do perfil
 */
export interface ProfileQualityIssue {
  type: ProfileQualityIssueType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

/**
 * Tipos de problema de qualidade
 */
export type ProfileQualityIssueType = 
  | 'incomplete_profile'       // Perfil incompleto
  | 'low_photo_quality'        // Fotos de baixa qualidade
  | 'missing_bio'              // Bio ausente
  | 'suspicious_activity'      // Atividade suspeita
  | 'low_response_rate'        // Baixa taxa de resposta
  | 'inactive_user'            // Usuário inativo
  | 'fake_suspicion'           // Suspeita de perfil falso
  | 'inappropriate_content';   // Conteúdo inapropriado

/**
 * Métricas de performance do algoritmo
 */
export interface AlgorithmPerformance {
  algorithm: RecommendationAlgorithm;
  period: {
    start: Date;
    end: Date;
  };
  
  // Métricas principais
  totalRecommendations: number;
  averageResponseTime: number;   // Em milissegundos
  successRate: number;           // Taxa de matches (0-1)
  userSatisfaction: number;      // Score de satisfação (0-1)
  
  // Métricas de qualidade
  averageMatchScore: number;
  diversityScore: number;        // Diversidade das recomendações
  noveltyScore: number;          // Novidade das recomendações
  
  // Métricas de engajamento
  clickThroughRate: number;      // Taxa de clique em perfis
  likeRate: number;              // Taxa de likes
  conversationRate: number;      // Taxa de conversas iniciadas
  
  // Métricas técnicas
  cacheHitRate: number;          // Taxa de acerto do cache
  errorRate: number;             // Taxa de erro
  resourceUsage: ResourceUsage;
  
  // Comparação com outros algoritmos
  relativePerformance: number;   // Performance relativa (-1 a 1)
  isRecommendedAlgorithm: boolean;
}

/**
 * Uso de recursos computacionais
 */
export interface ResourceUsage {
  averageCpuTime: number;        // Tempo de CPU em ms
  averageMemoryUsage: number;    // Uso de memória em MB
  databaseQueries: number;       // Número de queries por recomendação
  externalApiCalls: number;      // Chamadas para APIs externas
  
  // Custos estimados
  estimatedCostPerRecommendation: number; // Em centavos
  estimatedMonthlyCost: number;           // Custo mensal estimado
}

/**
 * Resultado de uma análise de compatibilidade
 */
export interface CompatibilityAnalysis {
  userA: string;
  userB: string;
  overallScore: number;          // Score final (0-1)
  
  // Breakdown por dimensão
  dimensions: CompatibilityDimensions;
  
  // Fatores que contribuíram positivamente
  strengths: CompatibilityFactor[];
  
  // Fatores que reduziram a compatibilidade
  weaknesses: CompatibilityFactor[];
  
  // Explicação humana
  summary: string;
  detailedExplanation: string[];
  
  // Confiança na análise
  confidence: number;            // Confiança no resultado (0-1)
  dataQuality: number;           // Qualidade dos dados usados (0-1)
  
  // Metadados
  algorithm: RecommendationAlgorithm;
  analyzedAt: Date;
  processingTime: number;        // Tempo de processamento em ms
}

/**
 * Fator de compatibilidade
 */
export interface CompatibilityFactor {
  dimension: keyof CompatibilityDimensions;
  factor: string;                // Nome do fator
  description: string;           // Descrição detalhada
  impact: number;                // Impacto no score (-1 a 1)
  confidence: number;            // Confiança neste fator (0-1)
  
  // Dados específicos
  userAValue?: any;
  userBValue?: any;
  similarity?: number;           // Similaridade específica (0-1)
}

/**
 * Constantes úteis
 */
export const RECOMMENDATION_CONSTANTS = {
  // Scores mínimos
  MIN_COMPATIBILITY_SCORE: 0.3,
  MIN_PROFILE_QUALITY_SCORE: 0.4,
  
  // Limites de sistema
  MAX_RECOMMENDATIONS_PER_REQUEST: 50,
  MAX_CANDIDATES_TO_ANALYZE: 500,
  DEFAULT_CACHE_TIMEOUT_MINUTES: 30,
  
  // Timeouts
  MAX_ALGORITHM_PROCESSING_TIME_MS: 5000,
  MAX_DATABASE_QUERY_TIME_MS: 2000,
  
  // Pesos padrão
  DEFAULT_ALGORITHM_WEIGHTS: {
    style: 0.25,
    emotional: 0.20,
    hobby: 0.20,
    location: 0.15,
    personality: 0.20,
    lifestyle: 0.0,
    values: 0.0,
    communication: 0.0
  } as CompatibilityDimensions,
  
  // Configurações de qualidade
  QUALITY_THRESHOLDS: {
    MIN_PHOTO_COUNT: 2,
    MIN_BIO_LENGTH: 50,
    MIN_PROFILE_COMPLETENESS: 0.7,
    MAX_INACTIVE_DAYS: 30
  }
} as const;

/**
 * Utilitários para tipos
 */
export namespace RecommendationTypes {
  /**
   * Verifica se um score está dentro da faixa válida
   */
  export function isValidScore(score: number): boolean {
    return score >= 0 && score <= 1 && !isNaN(score);
  }
  
  /**
   * Normaliza um score para a faixa 0-1
   */
  export function normalizeScore(score: number, min: number = 0, max: number = 1): number {
    return Math.max(0, Math.min(1, (score - min) / (max - min)));
  }
  
  /**
   * Converte score numérico para label textual
   */
  export function scoreToLabel(score: number): string {
    if (score >= 0.9) return 'Excelente';
    if (score >= 0.8) return 'Muito Boa';
    if (score >= 0.7) return 'Boa';
    if (score >= 0.6) return 'Razoável';
    if (score >= 0.4) return 'Baixa';
    return 'Muito Baixa';
  }
  
  /**
   * Verifica se duas dimensões de compatibilidade são válidas
   */
  export function validateCompatibilityDimensions(dims: CompatibilityDimensions): boolean {
    return Object.values(dims).every(isValidScore);
  }
}