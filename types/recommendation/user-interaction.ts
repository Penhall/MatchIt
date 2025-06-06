// types/recommendation/user-interaction.ts
// Tipos para interações e feedback de usuários

import { FeedbackAction, RecommendationAlgorithm } from './base';

/**
 * Interação entre usuários (like, dislike, etc.)
 */
export interface UserInteraction {
  id: string;
  userId: string;                    // Usuário que fez a ação
  targetUserId: string;              // Usuário que recebeu a ação
  action: FeedbackAction;
  context: InteractionContext;
  createdAt: Date;
  updatedAt: Date;
  
  // Dados adicionais
  matchScore?: number;               // Score no momento da interação
  algorithm?: RecommendationAlgorithm; // Algoritmo que gerou a recomendação
  isValid: boolean;                  // Se a interação é válida (anti-spam)
  
  // Para analytics
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  referrer?: string;
}

/**
 * Contexto da interação
 */
export interface InteractionContext {
  viewTime: number;                  // Tempo que visualizou o perfil (ms)
  scrollDepth: number;               // % do perfil que foi visualizado
  photoViews: number;                // Quantas fotos foram visualizadas
  profileSection: string;            // Seção onde estava ao interagir
  source: InteractionSource;
  position: number;                  // Posição na lista de recomendações
  
  // Dados comportamentais
  hoverTime?: number;                // Tempo de hover no botão (ms)
  clickPattern?: ClickPattern;       // Padrão de clique
  previousActions?: string[];        // Ações anteriores na sessão
  
  // Contexto temporal
  timeOfDay: number;                 // Hora do dia (0-23)
  dayOfWeek: number;                 // Dia da semana (0-6)
  isWeekend: boolean;
  
  // Localização e dispositivo
  location?: InteractionLocation;
  deviceType: DeviceType;
  networkType?: NetworkType;
}

/**
 * Origem da interação
 */
export type InteractionSource = 
  | 'recommendation_feed'      // Feed principal de recomendações
  | 'discovery'                // Área de descoberta
  | 'search'                   // Resultado de busca
  | 'mutual_matches'           // Matches mútuos
  | 'nearby'                   // Usuários próximos
  | 'recently_active'          // Usuários ativos recentemente
  | 'second_chance'            // Segunda chance (usuários rejeitados)
  | 'boost'                    // Perfil impulsionado
  | 'notification';            // Através de notificação

/**
 * Padrão de clique/toque
 */
export interface ClickPattern {
  type: 'single' | 'double' | 'long_press';
  pressure?: number;                 // Pressão do toque (0-1)
  velocity?: number;                 // Velocidade do gesto
  coordinates?: [number, number];    // Coordenadas do clique
}

/**
 * Informações do dispositivo
 */
export interface DeviceInfo {
  type: DeviceType;
  os: string;
  browser?: string;
  version?: string;
  screenSize: [number, number];
  userAgent: string;
  language: string;
  timezone: string;
}

/**
 * Tipo de dispositivo
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/**
 * Tipo de rede
 */
export type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'unknown';

/**
 * Localização da interação (para analytics, privacidade protegida)
 */
export interface InteractionLocation {
  country: string;
  region: string;
  city: string;
  // Coordenadas aproximadas (não precisas por privacidade)
  approximateLat?: number;
  approximateLng?: number;
}

/**
 * Histórico de interações de um usuário
 */
export interface UserInteractionHistory {
  userId: string;
  totalInteractions: number;
  interactionsByAction: Record<FeedbackAction, number>;
  averageViewTime: number;
  preferredTimeSlots: TimeSlot[];
  behaviorPatterns: BehaviorPattern[];
  
  // Estatísticas
  likeRate: number;                  // % de likes vs total
  superLikeRate: number;            // % de super likes vs total
  skipRate: number;                 // % de skips vs total
  matchConversionRate: number;      // % de likes que viraram match
  
  // Tendências temporais
  activityByDayOfWeek: number[];    // Atividade por dia da semana
  activityByHour: number[];         // Atividade por hora do dia
  
  // Qualidade do feedback
  feedbackConsistency: number;      // Consistência nas escolhas (0-1)
  averageDecisionTime: number;      // Tempo médio para decidir
  
  // Dados de aprendizado
  lastUpdated: Date;
  dataQuality: number;              // Qualidade dos dados (0-1)
  sampleSize: number;               // Quantidade de interações analisadas
}

/**
 * Slot de tempo preferido
 */
export interface TimeSlot {
  startHour: number;                // 0-23
  endHour: number;                  // 0-23
  dayOfWeek?: number[];             // Dias da semana (opcional)
  activityLevel: number;            // Nível de atividade neste slot (0-1)
}

/**
 * Padrão comportamental identificado
 */
export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  confidence: number;               // Confiança na identificação (0-1)
  characteristics: string[];
  
  // Exemplos: 'quick_decider', 'photo_focused', 'bio_reader', 'picky', 'explorer'
  type: BehaviorPatternType;
  
  // Dados do padrão
  averageViewTime: number;
  averageScrollDepth: number;
  preferredInteractionTypes: FeedbackAction[];
  
  // Metadados
  identifiedAt: Date;
  lastConfirmedAt: Date;
  occurrenceCount: number;
}

/**
 * Tipos de padrão comportamental
 */
export type BehaviorPatternType = 
  | 'quick_decider'        // Decide rapidamente
  | 'thorough_reviewer'    // Analisa tudo antes de decidir
  | 'photo_focused'        // Foca principalmente nas fotos
  | 'bio_reader'           // Lê biografias cuidadosamente
  | 'picky'                // Muito seletivo
  | 'explorer'             // Gosta de descobrir perfis diversos
  | 'local_focused'        // Prefere pessoas próximas
  | 'age_specific'         // Tem preferência específica de idade
  | 'activity_matcher'     // Busca mesmo nível de atividade
  | 'style_conscious';     // Muito atento ao estilo

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
  sourceBreakdown: Record<InteractionSource, number>;
  deviceBreakdown: Record<DeviceType, number>;
}

/**
 * Feedback sobre a qualidade das recomendações
 */
export interface RecommendationFeedback {
  id: string;
  userId: string;
  sessionId: string;
  
  // Avaliação geral
  overallSatisfaction: number;       // 1-5
  relevanceScore: number;            // 1-5
  diversityScore: number;            // 1-5
  
  // Problemas identificados
  issues: RecommendationIssue[];
  
  // Sugestões
  suggestions: string[];
  
  // Contexto
  algorithmsUsed: RecommendationAlgorithm[];
  recommendationCount: number;
  timeSpent: number;
  
  // Dados da sessão
  createdAt: Date;
  deviceType: DeviceType;
  
  // Para analytics
  isAnonymous: boolean;
  includeInTraining: boolean;
}

/**
 * Problemas com recomendações
 */
export interface RecommendationIssue {
  type: RecommendationIssueType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedRecommendations: number; // Quantas recomendações foram afetadas
  suggestedFix?: string;
}

/**
 * Tipos de problema com recomendações
 */
export type RecommendationIssueType = 
  | 'too_repetitive'           // Muito repetitivo
  | 'low_quality_profiles'     // Perfis de baixa qualidade
  | 'irrelevant_matches'       // Matches irrelevantes
  | 'wrong_location'           // Localização incorreta
  | 'age_mismatch'             // Idade inadequada
  | 'style_mismatch'           // Estilo incompatível
  | 'incomplete_profiles'      // Perfis incompletos
  | 'fake_profiles'            // Suspeita de perfis falsos
  | 'already_interacted'       // Já interagiu anteriormente
  | 'poor_photo_quality'       // Qualidade ruim das fotos
  | 'language_barrier'         // Barreira de idioma
  | 'lifestyle_incompatible';  // Lifestyle incompatível

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