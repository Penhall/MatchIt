// types/recommendation/user-interaction-analytics.ts
// Analytics e métricas para interações de usuários

import { FeedbackAction, RecommendationAlgorithm } from './base';
import { 
  DeviceType, 
  RecommendationIssueType, 
  BehaviorPatternType, 
  UserInteractionHistory,
  TimeSlot 
} from './user-interaction-core';

/**
 * Métricas de engajamento
 */
export interface EngagementMetrics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  
  // Métricas básicas
  totalSessions: number;
  totalInteractions: number;
  totalViewTime: number;             // Em milissegundos
  averageSessionDuration: number;
  
  // Métricas de qualidade
  engagementRate: number;            // Interações/visualizações
  retentionRate: number;             // Taxa de retorno
  satisfactionScore: number;         // Score de satisfação (estimado)
  
  // Métricas de efetividade
  matchRate: number;                 // Taxa de matches
  conversationStartRate: number;     // Taxa de conversas iniciadas
  responseRate: number;              // Taxa de resposta a mensagens
  
  // Comparações
  percentileRank: number;            // Percentil em relação a outros usuários
  improvement: number;               // Melhoria em relação ao período anterior
  
  // Detalhamento por tipo
  interactionBreakdown: Record<FeedbackAction, number>;
  sourceBreakdown: Record<string, number>;
  deviceBreakdown: Record<DeviceType, number>;
}

/**
 * Análise de sentiment do feedback
 */
export interface FeedbackSentiment {
  userId: string;
  period: Date;
  
  // Análise geral
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;            // -1 a 1
  confidence: number;                // Confiança na análise (0-1)
  
  // Categorias específicas
  algorithmSentiment: number;
  interfaceSentiment: number;
  matchQualitySentiment: number;
  
  // Tendências
  sentimentTrend: 'improving' | 'stable' | 'declining';
  trendConfidence: number;
  
  // Dados de base
  feedbackCount: number;
  avgRating: number;
  
  // Palavras-chave do feedback
  positiveKeywords: string[];
  negativeKeywords: string[];
  
  // Para melhoria do sistema
  actionableInsights: string[];
  priorityIssues: RecommendationIssueType[];
}

/**
 * Análise de comportamento do usuário
 */
export interface UserBehaviorAnalysis {
  userId: string;
  analysisDate: Date;
  period: {
    start: Date;
    end: Date;
  };
  
  // Perfil comportamental
  primaryBehaviorType: BehaviorPatternType;
  behaviorConfidence: number;        // Confiança na classificação (0-1)
  behaviorStability: number;         // Estabilidade do comportamento (0-1)
  
  // Padrões identificados
  identifiedPatterns: BehaviorPatternType[]; // CORREÇÃO: Alterado para BehaviorPatternType
  behaviorEvolution: BehaviorEvolution[];
  
  // Características principais
  decisionSpeed: 'very_fast' | 'fast' | 'moderate' | 'slow' | 'very_slow';
  selectivity: 'very_picky' | 'picky' | 'moderate' | 'open' | 'very_open';
  explorationType: 'focused' | 'balanced' | 'exploratory';
  
  // Preferências reveladas
  revealedPreferences: RevealedPreference[];
  preferenceConsistency: number;     // Consistência nas preferências (0-1)
  
  // Predições comportamentais
  behaviorPredictions: BehaviorPrediction[];
  
  // Recomendações de otimização
  optimizationRecommendations: OptimizationRecommendation[];
}

/**
 * Evolução do comportamento
 */
export interface BehaviorEvolution {
  period: Date;
  behaviorType: BehaviorPatternType;
  confidence: number;
  changeReasons: string[];
  stability: number;
}

/**
 * Preferência revelada através do comportamento
 */
export interface RevealedPreference {
  category: string;               // ex: 'age', 'style', 'location'
  preference: any;                // Valor da preferência
  confidence: number;             // Confiança (0-1)
  strength: number;               // Força da preferência (0-1)
  stability: number;              // Estabilidade (0-1)
  
  // Evidências
  basedOnInteractions: number;    // Número de interações que evidenciam
  consistency: number;            // Consistência das evidências (0-1)
  
  // Temporal
  firstObserved: Date;
  lastConfirmed: Date;
  trendDirection: 'strengthening' | 'stable' | 'weakening';
}

/**
 * Predição comportamental
 */
export interface BehaviorPrediction {
  type: BehaviorPredictionType;
  prediction: string;
  probability: number;            // Probabilidade (0-1)
  confidence: number;             // Confiança na predição (0-1)
  timeframe: string;              // Prazo da predição
  
  // Base da predição
  basedOnPatterns: string[];
  historicalAccuracy: number;     // Precisão histórica deste tipo de predição
  
  // Ações sugeridas
  suggestedActions: string[];
  potentialValue: number;         // Valor potencial se ação for tomada
}

/**
 * Tipos de predição comportamental
 */
export type BehaviorPredictionType = 
  | 'churn_risk'              // Risco de abandono
  | 'conversion_likelihood'   // Probabilidade de conversão
  | 'engagement_change'       // Mudança no engajamento
  | 'preference_shift'        // Mudança nas preferências
  | 'upgrade_propensity'      // Propensão a upgrade
  | 'recommendation_response' // Resposta a recomendações
  | 'seasonal_behavior'       // Comportamento sazonal
  | 'feature_adoption';       // Adoção de features

/**
 * Recomendação de otimização
 */
export interface OptimizationRecommendation {
  area: OptimizationArea;
  recommendation: string;
  expectedImpact: number;         // Impacto esperado (0-1)
  implementationDifficulty: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Detalhes
  description: string;
  reasoning: string[];
  successMetrics: string[];
  
  // Experimental
  isExperimental: boolean;
  testingRequired: boolean;
  estimatedTestDuration: number;  // Em dias
}

/**
 * Áreas de otimização
 */
export type OptimizationArea = 
  | 'algorithm_weights'       // Pesos do algoritmo
  | 'recommendation_timing'   // Timing das recomendações
  | 'ui_ux_improvements'      // Melhorias de interface
  | 'content_strategy'        // Estratégia de conteúdo
  | 'engagement_tactics'      // Táticas de engajamento
  | 'personalization'         // Personalização
  | 'notification_strategy'   // Estratégia de notificações
  | 'onboarding_flow';        // Fluxo de onboarding

/**
 * Análise de sessão detalhada
 */
export interface DetailedSessionAnalysis {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number;               // Duração em ms
  
  // Contexto da sessão
  deviceInfo: DeviceInfo;
  entryPoint: string;             // Como entrou na sessão
  exitPoint: string;              // Como saiu da sessão
  
  // Atividades na sessão
  totalActions: number;
  actionBreakdown: Record<string, number>;
  profilesViewed: number;
  averageViewTime: number;
  
  // Jornada na sessão
  userJourney: SessionStep[];
  conversionEvents: ConversionEvent[];
  
  // Qualidade da sessão
  sessionQuality: SessionQuality;
  engagementScore: number;        // Score de engajamento (0-1)
  
  // Resultados
  sessionOutcome: SessionOutcome;
  valueGenerated: number;         // Valor gerado na sessão
  
  // Comparações
  isAboveAverage: boolean;
  percentileRank: number;
}

/**
 * Informações do dispositivo detalhadas
 */
export interface DeviceInfo {
  type: DeviceType;
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  screenSize: [number, number];
  userAgent: string;
  language: string;
  timezone: string;
  internetSpeed?: string;
  batteryLevel?: number;
}

/**
 * Passo na jornada da sessão
 */
export interface SessionStep {
  stepNumber: number;
  action: string;
  timestamp: Date;
  duration: number;               // Tempo gasto neste passo
  context: Record<string, any>;   // Contexto específico
  
  // Métricas do passo
  engagement: number;             // Engajamento neste passo (0-1)
  difficulty: number;             // Dificuldade percebida (0-1)
  satisfaction: number;           // Satisfação neste passo (0-1)
}

/**
 * Evento de conversão na sessão
 */
export interface ConversionEvent {
  eventType: string;
  timestamp: Date;
  value: number;                  // Valor da conversão
  context: Record<string, any>;
  
  // Attribution
  touchpoints: string[];          // Pontos de contato que levaram a conversão
  primaryTouchpoint: string;
  conversionPath: string[];
}

/**
 * Qualidade da sessão
 */
export interface SessionQuality {
  overallScore: number;           // Score geral (0-1)
  
  // Componentes da qualidade
  intentionality: number;         // Quão intencional foi a sessão (0-1)
  focus: number;                  // Foco durante a sessão (0-1)
  efficiency: number;             // Eficiência da sessão (0-1)
  satisfaction: number;           // Satisfação na sessão (0-1)
  
  // Indicadores de problemas
  frustractionIndicators: string[];
  abandonnmentRisk: number;       // Risco de abandono (0-1)
  
  // Oportunidades
  improvementOpportunities: string[];
  nextBestActions: string[];
}

/**
 * Resultado da sessão
 */
export interface SessionOutcome {
  type: SessionOutcomeType;
  success: boolean;
  value: number;                  // Valor gerado
  
  // Detalhes específicos
  matchesGenerated: number;
  conversationsStarted: number;
  profilesLiked: number;
  
  // Progressão do usuário
  progressionMetrics: Record<string, number>;
  milestonesReached: string[];
  
  // Próximos passos
  recommendedNextActions: string[];
  estimatedNextSessionProbability: number;
}

/**
 * Tipos de resultado de sessão
 */
export type SessionOutcomeType = 
  | 'successful_matching'     // Conseguiu matches
  | 'exploration'             // Explorou opções
  | 'profile_optimization'    // Otimizou perfil
  | 'conversation_focus'      // Focou em conversas
  | 'discovery'               // Descobriu features
  | 'abandoned'               // Abandonou sem completar
  | 'frustrated'              // Saiu frustrado
  | 'satisfied';              // Saiu satisfeito

/**
 * Utilitários para análise de interações
 */
export class InteractionAnalyzer {
  /**
   * Classifica um usuário com base no seu padrão de interação
   */
  static classifyUserBehavior(history: UserInteractionHistory): BehaviorPatternType[] {
    const patterns: BehaviorPatternType[] = [];
    
    // Quick decider
    if (history.averageDecisionTime < 3000) { // Menos de 3 segundos
      patterns.push('quick_decider');
    }
    
    // Thorough reviewer
    if (history.averageViewTime > 30000) { // Mais de 30 segundos
      patterns.push('thorough_reviewer');
    }
    
    // Picky
    if (history.likeRate < 0.1) { // Menos de 10% de likes
      patterns.push('picky');
    }
    
    // Explorer
    if (history.skipRate > 0.3) { // Mais de 30% de skips
      patterns.push('explorer');
    }
    
    return patterns;
  }
  
  /**
   * Calcula score de engajamento
   */
  static calculateEngagementScore(metrics: EngagementMetrics): number {
    const weights = {
      engagementRate: 0.3,
      retentionRate: 0.2,
      matchRate: 0.2,
      conversationStartRate: 0.15,
      satisfactionScore: 0.15
    };
    
    return (
      metrics.engagementRate * weights.engagementRate +
      metrics.retentionRate * weights.retentionRate +
      metrics.matchRate * weights.matchRate +
      metrics.conversationStartRate * weights.conversationStartRate +
      (metrics.satisfactionScore / 5) * weights.satisfactionScore
    );
  }
  
  /**
   * Identifica horários de pico de atividade
   */
  static findPeakActivityTimes(history: UserInteractionHistory): TimeSlot[] {
    const threshold = Math.max(...history.activityByHour) * 0.7; // 70% do pico
    const peakSlots: TimeSlot[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      if (history.activityByHour[hour] >= threshold) {
        peakSlots.push({
          startHour: hour,
          endHour: hour,
          activityLevel: history.activityByHour[hour] / Math.max(...history.activityByHour)
        });
      }
    }
    
    return this.consolidateTimeSlots(peakSlots);
  }
  
  private static consolidateTimeSlots(slots: TimeSlot[]): TimeSlot[] {
    // Consolida slots consecutivos
    if (slots.length === 0) return slots;
    
    const consolidated: TimeSlot[] = [];
    let current = slots[0];
    
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].startHour === current.endHour + 1) {
        // Consolida com o slot atual
        current.endHour = slots[i].endHour;
        current.activityLevel = Math.max(current.activityLevel, slots[i].activityLevel);
      } else {
        // Inicia novo slot
        consolidated.push(current);
        current = slots[i];
      }
    }
    
    consolidated.push(current);
    return consolidated;
  }
}
