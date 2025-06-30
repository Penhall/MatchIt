// recommendation/user-interaction-analytics.ts - Sistema de Analytics de Interação do Usuário

import { AsyncStorage } from '@react-native-async-storage/async-storage';

// ==================== TIPOS E INTERFACES ====================

export interface UserInteraction {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  interactionType: InteractionType;
  context: InteractionContext;
  metadata: Record<string, any>;
}

export enum InteractionType {
  // Ações de Match
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_LEFT = 'swipe_left',
  SUPER_LIKE = 'super_like',
  MATCH_OCCURRED = 'match_occurred',
  
  // Ações de Chat
  MESSAGE_SENT = 'message_sent',
  MESSAGE_READ = 'message_read',
  CONVERSATION_STARTED = 'conversation_started',
  CONVERSATION_ENDED = 'conversation_ended',
  
  // Ações de Encontro
  DATE_SUGGESTED = 'date_suggested',
  DATE_ACCEPTED = 'date_accepted',
  DATE_DECLINED = 'date_declined',
  DATE_COMPLETED = 'date_completed',
  DATE_RATED = 'date_rated',
  
  // Ações de Perfil
  PROFILE_VIEWED = 'profile_viewed',
  PROFILE_SHARED = 'profile_shared',
  PHOTOS_VIEWED = 'photos_viewed',
  INTERESTS_VIEWED = 'interests_viewed',
  
  // Feedback e Avaliações
  FEEDBACK_PROVIDED = 'feedback_provided',
  MATCH_RATED = 'match_rated',
  ALGORITHM_RATED = 'algorithm_rated',
  
  // Configurações
  PREFERENCES_UPDATED = 'preferences_updated',
  WEIGHTS_MANUALLY_ADJUSTED = 'weights_manually_adjusted'
}

export interface InteractionContext {
  targetUserId?: string;
  matchId?: string;
  conversationId?: string;
  dateId?: string;
  profileSection?: string;
  feedbackScore?: number;
  rating?: number;
  preferences?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
}

export interface AnalyticsMetrics {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  totalInteractions: number;
  interactionsByType: Record<InteractionType, number>;
  averageSessionDuration: number;
  matchSuccessRate: number;
  conversationSuccessRate: number;
  dateSuccessRate: number;
  averageRating: number;
  preferencePatterns: PreferencePattern[];
  behaviorTrends: BehaviorTrend[];
}

export interface PreferencePattern {
  dimension: string;
  preferredRange: [number, number];
  confidence: number;
  sampleSize: number;
}

export interface BehaviorTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  magnitude: number;
  timeframe: string;
}

// ==================== CLASSE PRINCIPAL ====================

export class UserInteractionAnalytics {
  private static instance: UserInteractionAnalytics;
  private currentSessionId: string = '';
  private sessionStartTime: Date = new Date();
  private interactions: UserInteraction[] = [];

  private constructor() {
    this.initializeSession();
  }

  public static getInstance(): UserInteractionAnalytics {
    if (!UserInteractionAnalytics.instance) {
      UserInteractionAnalytics.instance = new UserInteractionAnalytics();
    }
    return UserInteractionAnalytics.instance;
  }

  // ==================== GERENCIAMENTO DE SESSÃO ====================

  private initializeSession(): void {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public startNewSession(): void {
    this.endCurrentSession();
    this.initializeSession();
  }

  private endCurrentSession(): void {
    this.trackInteraction('session_ended', {
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      interactionsInSession: this.interactions.filter(
        i => i.sessionId === this.currentSessionId
      ).length
    });
  }

  // ==================== TRACKING DE INTERAÇÕES ====================

  public async trackInteraction(
    type: InteractionType,
    context: Partial<InteractionContext> = {},
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const userId = await this.getCurrentUserId();
    
    const interaction: UserInteraction = {
      id: this.generateInteractionId(),
      userId,
      sessionId: this.currentSessionId,
      timestamp: new Date(),
      interactionType: type,
      context: {
        ...context,
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
      },
      metadata
    };

    this.interactions.push(interaction);
    await this.persistInteraction(interaction);
    
    // Processar em tempo real para insights imediatos
    this.processRealTimeInsights(interaction);
  }

  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // ==================== PERSISTÊNCIA ====================

  private async persistInteraction(interaction: UserInteraction): Promise<void> {
    try {
      const key = `interaction_${interaction.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(interaction));
      
      // Manter índice de interações
      await this.updateInteractionIndex(interaction);
    } catch (error) {
      console.error('Erro ao persistir interação:', error);
    }
  }

  private async updateInteractionIndex(interaction: UserInteraction): Promise<void> {
    try {
      const indexKey = `interactions_index_${interaction.userId}`;
      const existingIndex = await AsyncStorage.getItem(indexKey);
      const index = existingIndex ? JSON.parse(existingIndex) : [];
      
      index.push({
        id: interaction.id,
        timestamp: interaction.timestamp,
        type: interaction.interactionType
      });
      
      // Manter apenas os últimos 1000 registros
      const trimmedIndex = index.slice(-1000);
      
      await AsyncStorage.setItem(indexKey, JSON.stringify(trimmedIndex));
    } catch (error) {
      console.error('Erro ao atualizar índice:', error);
    }
  }

  // ==================== ANÁLISE DE DADOS ====================

  public async generateAnalytics(
    userId: string,
    daysBack: number = 30
  ): Promise<AnalyticsMetrics> {
    const interactions = await this.getInteractions(userId, daysBack);
    
    return {
      userId,
      periodStart: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      totalInteractions: interactions.length,
      interactionsByType: this.countInteractionsByType(interactions),
      averageSessionDuration: this.calculateAverageSessionDuration(interactions),
      matchSuccessRate: this.calculateMatchSuccessRate(interactions),
      conversationSuccessRate: this.calculateConversationSuccessRate(interactions),
      dateSuccessRate: this.calculateDateSuccessRate(interactions),
      averageRating: this.calculateAverageRating(interactions),
      preferencePatterns: this.analyzePreferencePatterns(interactions),
      behaviorTrends: this.analyzeBehaviorTrends(interactions)
    };
  }

  private async getInteractions(userId: string, daysBack: number): Promise<UserInteraction[]> {
    try {
      const indexKey = `interactions_index_${userId}`;
      const index = await AsyncStorage.getItem(indexKey);
      
      if (!index) return [];
      
      const interactionIds = JSON.parse(index);
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      
      const interactions: UserInteraction[] = [];
      
      for (const item of interactionIds) {
        if (new Date(item.timestamp) >= cutoffDate) {
          const interaction = await AsyncStorage.getItem(`interaction_${item.id}`);
          if (interaction) {
            interactions.push(JSON.parse(interaction));
          }
        }
      }
      
      return interactions;
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
      return [];
    }
  }

  // ==================== CÁLCULOS DE MÉTRICAS ====================

  private countInteractionsByType(interactions: UserInteraction[]): Record<InteractionType, number> {
    const counts = {} as Record<InteractionType, number>;
    
    Object.values(InteractionType).forEach(type => {
      counts[type] = interactions.filter(i => i.interactionType === type).length;
    });
    
    return counts;
  }

  private calculateMatchSuccessRate(interactions: UserInteraction[]): number {
    const swipeRights = interactions.filter(i => i.interactionType === InteractionType.SWIPE_RIGHT).length;
    const matches = interactions.filter(i => i.interactionType === InteractionType.MATCH_OCCURRED).length;
    
    return swipeRights > 0 ? (matches / swipeRights) * 100 : 0;
  }

  private calculateConversationSuccessRate(interactions: UserInteraction[]): number {
    const matches = interactions.filter(i => i.interactionType === InteractionType.MATCH_OCCURRED).length;
    const conversations = interactions.filter(i => i.interactionType === InteractionType.CONVERSATION_STARTED).length;
    
    return matches > 0 ? (conversations / matches) * 100 : 0;
  }

  private calculateDateSuccessRate(interactions: UserInteraction[]): number {
    const dateSuggestions = interactions.filter(i => i.interactionType === InteractionType.DATE_SUGGESTED).length;
    const dateAccepted = interactions.filter(i => i.interactionType === InteractionType.DATE_ACCEPTED).length;
    
    return dateSuggestions > 0 ? (dateAccepted / dateSuggestions) * 100 : 0;
  }

  private calculateAverageRating(interactions: UserInteraction[]): number {
    const ratedInteractions = interactions.filter(i => 
      i.context.rating !== undefined && i.context.rating > 0
    );
    
    if (ratedInteractions.length === 0) return 0;
    
    const totalRating = ratedInteractions.reduce((sum, i) => sum + (i.context.rating || 0), 0);
    return totalRating / ratedInteractions.length;
  }

  private calculateAverageSessionDuration(interactions: UserInteraction[]): number {
    const sessionDurations = interactions
      .filter(i => i.metadata.sessionDuration)
      .map(i => i.metadata.sessionDuration);
    
    if (sessionDurations.length === 0) return 0;
    
    const totalDuration = sessionDurations.reduce((sum, duration) => sum + duration, 0);
    return totalDuration / sessionDurations.length;
  }

  // ==================== ANÁLISE DE PADRÕES ====================

  private analyzePreferencePatterns(interactions: UserInteraction[]): PreferencePattern[] {
    const patterns: PreferencePattern[] = [];
    
    // Analisar padrões de swipe baseados em perfis visualizados
    const swipeRights = interactions.filter(i => i.interactionType === InteractionType.SWIPE_RIGHT);
    const swipeLefts = interactions.filter(i => i.interactionType === InteractionType.SWIPE_LEFT);
    
    // Aqui você integraria com dados de perfil para identificar padrões
    // Por exemplo: idade preferida, interesses comuns, etc.
    
    return patterns;
  }

  private analyzeBehaviorTrends(interactions: UserInteraction[]): BehaviorTrend[] {
    const trends: BehaviorTrend[] = [];
    
    // Analisar tendências ao longo do tempo
    const weeklyData = this.groupInteractionsByWeek(interactions);
    
    // Calcular tendências para diferentes métricas
    const activityTrend = this.calculateTrend(weeklyData.map(w => w.totalInteractions));
    trends.push({
      metric: 'activity',
      trend: activityTrend.direction,
      magnitude: activityTrend.magnitude,
      timeframe: 'weekly'
    });
    
    return trends;
  }

  private groupInteractionsByWeek(interactions: UserInteraction[]): any[] {
    const weeks = new Map();
    
    interactions.forEach(interaction => {
      const weekStart = this.getWeekStart(new Date(interaction.timestamp));
      const key = weekStart.toISOString();
      
      if (!weeks.has(key)) {
        weeks.set(key, {
          weekStart,
          totalInteractions: 0,
          interactionsByType: {}
        });
      }
      
      const week = weeks.get(key);
      week.totalInteractions++;
      
      if (!week.interactionsByType[interaction.interactionType]) {
        week.interactionsByType[interaction.interactionType] = 0;
      }
      week.interactionsByType[interaction.interactionType]++;
    });
    
    return Array.from(weeks.values()).sort((a, b) => 
      a.weekStart.getTime() - b.weekStart.getTime()
    );
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private calculateTrend(values: number[]): { direction: 'increasing' | 'decreasing' | 'stable', magnitude: number } {
    if (values.length < 2) return { direction: 'stable', magnitude: 0 };
    
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    const magnitude = Math.abs((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (magnitude < 5) return { direction: 'stable', magnitude };
    return {
      direction: secondAvg > firstAvg ? 'increasing' : 'decreasing',
      magnitude
    };
  }

  // ==================== INSIGHTS EM TEMPO REAL ====================

  private processRealTimeInsights(interaction: UserInteraction): void {
    // Detectar padrões imediatos para ajuste de pesos
    this.detectImmediatePatterns(interaction);
    
    // Atualizar cache de insights
    this.updateInsightsCache(interaction);
  }

  private detectImmediatePatterns(interaction: UserInteraction): void {
    switch (interaction.interactionType) {
      case InteractionType.SWIPE_RIGHT:
        this.onPositiveInteraction(interaction);
        break;
      case InteractionType.SWIPE_LEFT:
        this.onNegativeInteraction(interaction);
        break;
      case InteractionType.MATCH_OCCURRED:
        this.onMatchOccurred(interaction);
        break;
      case InteractionType.DATE_RATED:
        this.onDateRated(interaction);
        break;
    }
  }

  private onPositiveInteraction(interaction: UserInteraction): void {
    // Sinalizar para o algoritmo de ajuste que este perfil foi aprovado
    console.log('Padrão positivo detectado:', interaction.context.targetUserId);
  }

  private onNegativeInteraction(interaction: UserInteraction): void {
    // Sinalizar para o algoritmo de ajuste que este perfil foi rejeitado
    console.log('Padrão negativo detectado:', interaction.context.targetUserId);
  }

  private onMatchOccurred(interaction: UserInteraction): void {
    // Match é um sinal muito forte de compatibilidade
    console.log('Match confirmado:', interaction.context.matchId);
  }

  private onDateRated(interaction: UserInteraction): void {
    // Rating de encontro é feedback direto sobre a qualidade do match
    console.log('Encontro avaliado:', interaction.context.rating);
  }

  private updateInsightsCache(interaction: UserInteraction): void {
    // Atualizar cache local para consultas rápidas
    // Implementação específica dependeria da arquitetura de cache
  }

  // ==================== UTILITÁRIOS ====================

  private async getCurrentUserId(): Promise<string> {
    // Implementar lógica para obter ID do usuário atual
    const userId = await AsyncStorage.getItem('currentUserId');
    return userId || 'anonymous';
  }

  public async exportAnalyticsData(userId: string): Promise<string> {
    const analytics = await this.generateAnalytics(userId);
    return JSON.stringify(analytics, null, 2);
  }

  public async clearAnalyticsData(userId: string): Promise<void> {
    try {
      const indexKey = `interactions_index_${userId}`;
      const index = await AsyncStorage.getItem(indexKey);
      
      if (index) {
        const interactionIds = JSON.parse(index);
        
        // Remover todas as interações
        for (const item of interactionIds) {
          await AsyncStorage.removeItem(`interaction_${item.id}`);
        }
        
        // Remover índice
        await AsyncStorage.removeItem(indexKey);
      }
    } catch (error) {
      console.error('Erro ao limpar dados de analytics:', error);
    }
  }
}

// ==================== HOOKS E HELPERS ====================

export const useUserAnalytics = () => {
  const analytics = UserInteractionAnalytics.getInstance();
  
  return {
    trackInteraction: analytics.trackInteraction.bind(analytics),
    generateAnalytics: analytics.generateAnalytics.bind(analytics),
    startNewSession: analytics.startNewSession.bind(analytics),
    exportData: analytics.exportAnalyticsData.bind(analytics),
    clearData: analytics.clearAnalyticsData.bind(analytics)
  };
};

// Função helper para tracking simplificado
export const trackUserAction = async (
  action: InteractionType,
  context?: Partial<InteractionContext>,
  metadata?: Record<string, any>
) => {
  const analytics = UserInteractionAnalytics.getInstance();
  await analytics.trackInteraction(action, context, metadata);
};