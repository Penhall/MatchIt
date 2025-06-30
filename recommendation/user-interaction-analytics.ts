// User Interaction Analytics - Sistema de análise de interações
export enum InteractionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  PROFILE_VIEW = 'profile_view',
  MESSAGE_SENT = 'message_sent',
  MATCH = 'match',
  STYLE_PREFERENCE = 'style_preference',
  SWIPE_RIGHT = 'swipe_right',
  SUPER_LIKE = 'super_like',
  SWIPE_LEFT = 'swipe_left',
  MATCH_OCCURRED = 'match_occurred',
  CONVERSATION_STARTED = 'conversation_started',
  DATE_ACCEPTED = 'date_accepted',
  DATE_DECLINED = 'date_declined',
  DATE_RATED = 'date_rated',
}

export interface UserInteraction {
  id: string;
  userId: string;
  targetUserId?: string;
  type: InteractionType;
  data: any;
  timestamp: Date;
  responseTime?: number;
  context?: any; // Adicionado para compatibilidade com weight-adjustment-algorithm
}

export class UserInteractionAnalytics {
  private static instance: UserInteractionAnalytics;
  private interactions: UserInteraction[] = [];

  static getInstance(): UserInteractionAnalytics {
    if (!UserInteractionAnalytics.instance) {
      UserInteractionAnalytics.instance = new UserInteractionAnalytics();
    }
    return UserInteractionAnalytics.instance;
  }

  trackInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): void {
    const fullInteraction: UserInteraction = {
      ...interaction,
      id: this.generateId(),
      timestamp: new Date(),
    };
    
    this.interactions.push(fullInteraction);
    
    // Opcional: Enviar para servidor
    this.sendToServer(fullInteraction);
  }

  getInteractionsByType(type: InteractionType): UserInteraction[] {
    return this.interactions.filter(interaction => interaction.type === type);
  }

  getInteractionsByUser(userId: string): UserInteraction[] {
    return this.interactions.filter(interaction => interaction.userId === userId);
  }

  getRecentInteractions(hours: number = 24): UserInteraction[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.interactions.filter(interaction => interaction.timestamp > cutoff);
  }

  // Adicionado para compatibilidade com weight-adjustment-algorithm
  async getInteractions(userId: string, timeWindow: number): Promise<UserInteraction[]> {
    return this.getRecentInteractions(timeWindow * 24);
  }

  // Adicionado para compatibilidade com weight-adjustment-algorithm
  async generateAnalytics(userId: string, timeWindow: number): Promise<any> {
    // Lógica de geração de análise simulada
    return {
      userId,
      timeWindow,
      summary: `Analytics for ${userId} over ${timeWindow} days.`
    };
  }

  private generateId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToServer(interaction: UserInteraction): Promise<void> {
    try {
      // Implementar envio para API quando necessário
      console.log('Analytics interaction tracked:', interaction.type);
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}

export default UserInteractionAnalytics.getInstance();
