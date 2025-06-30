// routes/recommendation/feedback.ts - Sistema de Processamento de Feedback Expandido

import { Router, Request, Response } from 'express';
import { UserInteractionAnalytics, InteractionType } from '../../recommendation/user-interaction-analytics';
import { WeightAdjustmentAlgorithm } from '../../recommendation/weight-adjustment-algorithm';
import { EmotionalProfile } from '../../types/EmotionalProfile';

// ==================== TIPOS E INTERFACES ====================

export interface FeedbackRequest {
  userId: string;
  feedbackType: FeedbackType;
  targetUserId?: string;
  matchId?: string;
  dateId?: string;
  rating: number;
  categories: FeedbackCategory[];
  openFeedback?: string;
  contextData?: Record<string, any>;
}

export enum FeedbackType {
  MATCH_RATING = 'match_rating',
  DATE_RATING = 'date_rating',
  CONVERSATION_RATING = 'conversation_rating',
  ALGORITHM_RATING = 'algorithm_rating',
  DIMENSION_FEEDBACK = 'dimension_feedback',
  GENERAL_SATISFACTION = 'general_satisfaction'
}

export interface FeedbackCategory {
  dimension: string;
  satisfaction: number; // 1-5
  importance: number; // 1-5
  comments?: string;
}

export interface ProcessedFeedback {
  id: string;
  userId: string;
  feedbackType: FeedbackType;
  overallRating: number;
  processedAt: Date;
  insights: FeedbackInsight[];
  adjustmentSuggestions: AdjustmentSuggestion[];
  actionsTaken: FeedbackAction[];
}

export interface FeedbackInsight {
  type: 'positive' | 'negative' | 'neutral' | 'critical';
  dimension?: string;
  message: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface AdjustmentSuggestion {
  dimension: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
  confidence: number;
  urgency: 'immediate' | 'next_cycle' | 'long_term';
}

export interface FeedbackAction {
  type: 'weight_adjustment' | 'algorithm_parameter' | 'user_notification' | 'escalation';
  description: string;
  executed: boolean;
  result?: any;
}

export interface FeedbackPattern {
  userId: string;
  pattern: string;
  frequency: number;
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

// ==================== CLASSE PRINCIPAL ====================

export class FeedbackProcessor {
  private static instance: FeedbackProcessor;
  private analytics: UserInteractionAnalytics;
  private weightAlgorithm: WeightAdjustmentAlgorithm;
  private feedbackHistory: Map<string, ProcessedFeedback[]> = new Map();
  
  private constructor() {
    this.analytics = UserInteractionAnalytics.getInstance();
    this.weightAlgorithm = WeightAdjustmentAlgorithm.getInstance();
  }

  public static getInstance(): FeedbackProcessor {
    if (!FeedbackProcessor.instance) {
      FeedbackProcessor.instance = new FeedbackProcessor();
    }
    return FeedbackProcessor.instance;
  }

  // ==================== PROCESSAMENTO PRINCIPAL ====================

  public async processFeedback(feedback: FeedbackRequest): Promise<ProcessedFeedback> {
    console.log(`📝 Processando feedback do usuário ${feedback.userId}`);
    
    // 1. Registrar feedback no analytics
    await this.trackFeedbackInteraction(feedback);
    
    // 2. Analisar sentimento e extrair insights
    const insights = await this.extractInsights(feedback);
    
    // 3. Gerar sugestões de ajuste
    const adjustmentSuggestions = await this.generateAdjustmentSuggestions(feedback, insights);
    
    // 4. Executar ações automáticas
    const actionsTaken = await this.executeAutomaticActions(feedback, adjustmentSuggestions);
    
    // 5. Detectar padrões problemáticos
    await this.detectFeedbackPatterns(feedback);
    
    // 6. Criar resultado processado
    const processedFeedback: ProcessedFeedback = {
      id: this.generateFeedbackId(),
      userId: feedback.userId,
      feedbackType: feedback.feedbackType,
      overallRating: feedback.rating,
      processedAt: new Date(),
      insights,
      adjustmentSuggestions,
      actionsTaken
    };
    
    // 7. Armazenar histórico
    await this.storeFeedbackHistory(processedFeedback);
    
    console.log(`✅ Feedback processado: ${insights.length} insights, ${actionsTaken.length} ações`);
    return processedFeedback;
  }

  // ==================== TRACKING DE INTERAÇÃO ====================

  private async trackFeedbackInteraction(feedback: FeedbackRequest): Promise<void> {
    let interactionType: InteractionType;
    
    switch (feedback.feedbackType) {
      case FeedbackType.MATCH_RATING:
        interactionType = InteractionType.MATCH_RATED;
        break;
      case FeedbackType.DATE_RATING:
        interactionType = InteractionType.DATE_RATED;
        break;
      case FeedbackType.ALGORITHM_RATING:
        interactionType = InteractionType.ALGORITHM_RATED;
        break;
      default:
        interactionType = InteractionType.FEEDBACK_PROVIDED;
    }
    
    await this.analytics.trackInteraction(
      interactionType,
      {
        targetUserId: feedback.targetUserId,
        matchId: feedback.matchId,
        rating: feedback.rating,
        feedbackScore: feedback.rating
      },
      {
        feedbackType: feedback.feedbackType,
        categoriesCount: feedback.categories.length,
        hasOpenFeedback: !!feedback.openFeedback,
        ...feedback.contextData
      }
    );
  }

  // ==================== EXTRAÇÃO DE INSIGHTS ====================

  private async extractInsights(feedback: FeedbackRequest): Promise<FeedbackInsight[]> {
    const insights: FeedbackInsight[] = [];
    
    // 1. Análise do rating geral
    insights.push(...this.analyzeOverallRating(feedback));
    
    // 2. Análise por categoria/dimensão
    insights.push(...this.analyzeCategoryFeedback(feedback));
    
    // 3. Análise de texto livre (sentiment analysis)
    if (feedback.openFeedback) {
      insights.push(...await this.analyzeOpenFeedback(feedback.openFeedback, feedback.userId));
    }
    
    // 4. Análise contextual
    insights.push(...await this.analyzeContextualData(feedback));
    
    return insights;
  }

  private analyzeOverallRating(feedback: FeedbackRequest): FeedbackInsight[] {
    const insights: FeedbackInsight[] = [];
    const rating = feedback.rating;
    
    if (rating <= 2) {
      insights.push({
        type: 'critical',
        message: `Rating muito baixo (${rating}/5) indica problemas sérios na experiência`,
        confidence: 0.9,
        impact: 'high'
      });
    } else if (rating >= 4) {
      insights.push({
        type: 'positive',
        message: `Rating alto (${rating}/5) indica experiência positiva`,
        confidence: 0.8,
        impact: 'medium'
      });
    } else {
      insights.push({
        type: 'neutral',
        message: `Rating médio (${rating}/5) sugere experiência satisfatória com potencial de melhoria`,
        confidence: 0.7,
        impact: 'medium'
      });
    }
    
    return insights;
  }

  private analyzeCategoryFeedback(feedback: FeedbackRequest): FeedbackInsight[] {
    const insights: FeedbackInsight[] = [];
    
    feedback.categories.forEach(category => {
      const satisfaction = category.satisfaction;
      const importance = category.importance;
      const impactWeight = importance / 5; // Normalizar importância
      
      if (satisfaction <= 2 && importance >= 4) {
        insights.push({
          type: 'critical',
          dimension: category.dimension,
          message: `Dimensão "${category.dimension}" tem baixa satisfação (${satisfaction}) mas alta importância (${importance})`,
          confidence: 0.85,
          impact: 'high'
        });
      } else if (satisfaction >= 4 && importance >= 3) {
        insights.push({
          type: 'positive',
          dimension: category.dimension,
          message: `Dimensão "${category.dimension}" performando bem (satisfação: ${satisfaction}, importância: ${importance})`,
          confidence: 0.7,
          impact: 'medium'
        });
      } else if (satisfaction <= 3 && importance <= 2) {
        insights.push({
          type: 'neutral',
          dimension: category.dimension,
          message: `Dimensão "${category.dimension}" com satisfação baixa mas pouco importante para o usuário`,
          confidence: 0.6,
          impact: 'low'
        });
      }
    });
    
    return insights;
  }

  private async analyzeOpenFeedback(text: string, userId: string): Promise<FeedbackInsight[]> {
    const insights: FeedbackInsight[] = [];
    
    // Análise de sentimento básica (em produção, usaria NLP mais sofisticado)
    const sentiment = this.calculateSentiment(text);
    const keyWords = this.extractKeyWords(text);
    
    // Detectar palavras-chave problemáticas
    const negativeKeywords = ['ruim', 'péssimo', 'horrível', 'não funciona', 'bug', 'erro'];
    const positiveKeywords = ['ótimo', 'excelente', 'perfeito', 'adorei', 'funciona bem'];
    
    const hasNegativeWords = negativeKeywords.some(word => 
      text.toLowerCase().includes(word)
    );
    
    const hasPositiveWords = positiveKeywords.some(word => 
      text.toLowerCase().includes(word)
    );
    
    if (hasNegativeWords) {
      insights.push({
        type: 'negative',
        message: `Feedback textual contém indicadores negativos: "${keyWords.slice(0, 3).join(', ')}"`,
        confidence: 0.75,
        impact: 'high'
      });
    }
    
    if (hasPositiveWords) {
      insights.push({
        type: 'positive',
        message: `Feedback textual contém indicadores positivos: "${keyWords.slice(0, 3).join(', ')}"`,
        confidence: 0.75,
        impact: 'medium'
      });
    }
    
    // Detectar menções a dimensões específicas
    const dimensionMentions = this.detectDimensionMentions(text);
    dimensionMentions.forEach(mention => {
      insights.push({
        type: sentiment > 0 ? 'positive' : 'negative',
        dimension: mention.dimension,
        message: `Usuário mencionou "${mention.dimension}" no feedback: "${mention.context}"`,
        confidence: 0.6,
        impact: 'medium'
      });
    });
    
    return insights;
  }

  private async analyzeContextualData(feedback: FeedbackRequest): Promise<FeedbackInsight[]> {
    const insights: FeedbackInsight[] = [];
    
    // Analisar contexto temporal
    const timeOfDay = new Date().getHours();
    if (timeOfDay < 6 || timeOfDay > 22) {
      insights.push({
        type: 'neutral',
        message: `Feedback fornecido fora do horário padrão (${timeOfDay}h) - pode indicar frustração`,
        confidence: 0.4,
        impact: 'low'
      });
    }
    
    // Analisar histórico recente do usuário
    const recentAnalytics = await this.analytics.generateAnalytics(feedback.userId, 7);
    if (recentAnalytics.averageRating < 3 && feedback.rating >= 4) {
      insights.push({
        type: 'positive',
        message: 'Melhoria significativa na satisfação comparado aos últimos 7 dias',
        confidence: 0.8,
        impact: 'high'
      });
    } else if (recentAnalytics.averageRating >= 4 && feedback.rating <= 2) {
      insights.push({
        type: 'critical',
        message: 'Queda drástica na satisfação - possível problema técnico ou mudança no algoritmo',
        confidence: 0.9,
        impact: 'high'
      });
    }
    
    return insights;
  }

  // ==================== GERAÇÃO DE SUGESTÕES ====================

  private async generateAdjustmentSuggestions(
    feedback: FeedbackRequest,
    insights: FeedbackInsight[]
  ): Promise<AdjustmentSuggestion[]> {
    const suggestions: AdjustmentSuggestion[] = [];
    
    // Obter pesos atuais
    const currentWeights = await this.weightAlgorithm.getDimensionWeights(feedback.userId);
    
    // 1. Sugestões baseadas em insights críticos
    const criticalInsights = insights.filter(i => i.type === 'critical' && i.dimension);
    for (const insight of criticalInsights) {
      if (insight.dimension) {
        const currentWeight = currentWeights[insight.dimension] || 0;
        const suggestedWeight = Math.max(0.01, currentWeight * 0.8); // Reduzir 20%
        
        suggestions.push({
          dimension: insight.dimension,
          currentWeight,
          suggestedWeight,
          reason: `Reduzir peso devido a feedback crítico: ${insight.message}`,
          confidence: insight.confidence,
          urgency: 'immediate'
        });
      }
    }
    
    // 2. Sugestões baseadas em feedback positivo
    const positiveInsights = insights.filter(i => i.type === 'positive' && i.dimension);
    for (const insight of positiveInsights) {
      if (insight.dimension) {
        const currentWeight = currentWeights[insight.dimension] || 0;
        const suggestedWeight = Math.min(0.20, currentWeight * 1.1); // Aumentar 10%
        
        suggestions.push({
          dimension: insight.dimension,
          currentWeight,
          suggestedWeight,
          reason: `Aumentar peso devido a feedback positivo: ${insight.message}`,
          confidence: insight.confidence,
          urgency: 'next_cycle'
        });
      }
    }
    
    // 3. Sugestões baseadas em categorias específicas
    for (const category of feedback.categories) {
      const currentWeight = currentWeights[category.dimension] || 0;
      const satisfactionNormalized = category.satisfaction / 5;
      const importanceNormalized = category.importance / 5;
      
      // Calcular peso ideal baseado na importância declarada pelo usuário
      const idealWeight = importanceNormalized * 0.15; // Máximo 15% para uma dimensão
      
      if (Math.abs(currentWeight - idealWeight) > 0.02) { // Diferença significativa
        suggestions.push({
          dimension: category.dimension,
          currentWeight,
          suggestedWeight: idealWeight,
          reason: `Ajustar peso para alinhar com importância declarada (${category.importance}/5)`,
          confidence: 0.7,
          urgency: 'long_term'
        });
      }
    }
    
    return this.prioritizeSuggestions(suggestions);
  }

  private prioritizeSuggestions(suggestions: AdjustmentSuggestion[]): AdjustmentSuggestion[] {
    return suggestions.sort((a, b) => {
      // Priorizar por urgência
      const urgencyPriority = { immediate: 3, next_cycle: 2, long_term: 1 };
      const urgencyDiff = urgencyPriority[b.urgency] - urgencyPriority[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Depois por confiança
      return b.confidence - a.confidence;
    });
  }

  // ==================== EXECUÇÃO DE AÇÕES ====================

  private async executeAutomaticActions(
    feedback: FeedbackRequest,
    suggestions: AdjustmentSuggestion[]
  ): Promise<FeedbackAction[]> {
    const actions: FeedbackAction[] = [];
    
    // 1. Aplicar ajustes automáticos críticos
    const criticalSuggestions = suggestions.filter(s => s.urgency === 'immediate' && s.confidence > 0.8);
    
    for (const suggestion of criticalSuggestions) {
      try {
        const success = await this.weightAlgorithm.forceAdjustment(
          feedback.userId,
          suggestion.dimension,
          suggestion.suggestedWeight
        );
        
        actions.push({
          type: 'weight_adjustment',
          description: `Peso de "${suggestion.dimension}" ajustado de ${suggestion.currentWeight.toFixed(3)} para ${suggestion.suggestedWeight.toFixed(3)}`,
          executed: success,
          result: { success, dimension: suggestion.dimension, newWeight: suggestion.suggestedWeight }
        });
      } catch (error) {
        actions.push({
          type: 'weight_adjustment',
          description: `Falha ao ajustar peso de "${suggestion.dimension}": ${error}`,
          executed: false,
          result: { error: error.toString() }
        });
      }
    }
    
    // 2. Notificar usuário sobre mudanças importantes
    if (feedback.rating <= 2) {
      actions.push({
        type: 'user_notification',
        description: 'Enviar notificação de acompanhamento devido a rating baixo',
        executed: true,
        result: await this.sendLowRatingNotification(feedback.userId)
      });
    }
    
    // 3. Escalar problemas críticos
    const criticalInsights = suggestions.filter(s => s.confidence > 0.9 && s.urgency === 'immediate');
    if (criticalInsights.length > 0) {
      actions.push({
        type: 'escalation',
        description: `Escalar ${criticalInsights.length} problemas críticos para equipe de produto`,
        executed: true,
        result: await this.escalateCriticalIssues(feedback, criticalInsights)
      });
    }
    
    // 4. Ajustar parâmetros do algoritmo se necessário
    if (await this.shouldAdjustAlgorithmParameters(feedback)) {
      actions.push({
        type: 'algorithm_parameter',
        description: 'Ajustar parâmetros de aprendizado baseado no padrão de feedback',
        executed: true,
        result: await this.adjustAlgorithmParameters(feedback.userId)
      });
    }
    
    return actions;
  }

  // ==================== DETECÇÃO DE PADRÕES ====================

  private async detectFeedbackPatterns(feedback: FeedbackRequest): Promise<void> {
    const userHistory = this.feedbackHistory.get(feedback.userId) || [];
    
    // Detectar padrão de ratings baixos consecutivos
    const recentRatings = userHistory
      .filter(f => f.processedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(f => f.overallRating);
    
    recentRatings.push(feedback.rating);
    
    if (recentRatings.length >= 3 && recentRatings.every(r => r <= 2)) {
      await this.reportPattern({
        userId: feedback.userId,
        pattern: 'consecutive_low_ratings',
        frequency: recentRatings.length,
        lastOccurrence: new Date(),
        severity: 'critical',
        recommendations: [
          'Revisar algoritmo de compatibilidade para este usuário',
          'Verificar se há problemas técnicos',
          'Considerar intervenção manual no perfil'
        ]
      });
    }
    
    // Detectar inconsistência entre rating e categorias
    const avgCategoryRating = feedback.categories.reduce((sum, cat) => sum + cat.satisfaction, 0) / feedback.categories.length;
    if (Math.abs(feedback.rating - avgCategoryRating) > 1.5) {
      await this.reportPattern({
        userId: feedback.userId,
        pattern: 'rating_category_inconsistency',
        frequency: 1,
        lastOccurrence: new Date(),
        severity: 'medium',
        recommendations: [
          'Revisar interface de feedback para maior clareza',
          'Verificar se usuário entende as escalas de rating'
        ]
      });
    }
  }

  // ==================== UTILITÁRIOS DE ANÁLISE ====================

  private calculateSentiment(text: string): number {
    // Análise de sentimento simples (em produção, usar biblioteca NLP)
    const positiveWords = ['bom', 'ótimo', 'excelente', 'adorei', 'perfeito', 'maravilhoso'];
    const negativeWords = ['ruim', 'péssimo', 'horrível', 'odeio', 'terrível', 'nojento'];
    
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return score;
  }

  private extractKeyWords(text: string): string[] {
    // Extração simples de palavras-chave (em produção, usar NLP)
    const stopWords = ['o', 'a', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'por'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    return [...new Set(words)].slice(0, 10);
  }

  private detectDimensionMentions(text: string): Array<{ dimension: string, context: string }> {
    const dimensionKeywords = {
      'emotional_stability': ['emocional', 'estabilidade', 'humor', 'temperamento'],
      'communication_style': ['comunicação', 'conversa', 'diálogo', 'falar'],
      'social_energy': ['social', 'energia', 'extrovertido', 'introvertido'],
      'humor_style': ['humor', 'piada', 'engraçado', 'comédia']
    };
    
    const mentions: Array<{ dimension: string, context: string }> = [];
    const textLower = text.toLowerCase();
    
    Object.entries(dimensionKeywords).forEach(([dimension, keywords]) => {
      keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          const contextStart = Math.max(0, textLower.indexOf(keyword) - 20);
          const contextEnd = Math.min(text.length, textLower.indexOf(keyword) + keyword.length + 20);
          const context = text.substring(contextStart, contextEnd);
          
          mentions.push({ dimension, context });
        }
      });
    });
    
    return mentions;
  }

  // ==================== AÇÕES AUXILIARES ====================

  private async sendLowRatingNotification(userId: string): Promise<any> {
    // Implementar envio de notificação
    console.log(`📧 Enviando notificação de acompanhamento para usuário ${userId}`);
    return { sent: true, timestamp: new Date() };
  }

  private async escalateCriticalIssues(feedback: FeedbackRequest, issues: AdjustmentSuggestion[]): Promise<any> {
    // Implementar escalação para equipe
    console.log(`🚨 Escalando ${issues.length} problemas críticos do usuário ${feedback.userId}`);
    return { escalated: true, issueCount: issues.length, timestamp: new Date() };
  }

  private async shouldAdjustAlgorithmParameters(feedback: FeedbackRequest): Promise<boolean> {
    // Lógica para determinar se parâmetros do algoritmo devem ser ajustados
    return feedback.rating <= 2 && feedback.feedbackType === FeedbackType.ALGORITHM_RATING;
  }

  private async adjustAlgorithmParameters(userId: string): Promise<any> {
    // Implementar ajuste de parâmetros
    console.log(`⚙️ Ajustando parâmetros do algoritmo para usuário ${userId}`);
    return { adjusted: true, timestamp: new Date() };
  }

  private async reportPattern(pattern: FeedbackPattern): Promise<void> {
    // Implementar reporte de padrões
    console.log(`📊 Padrão detectado: ${pattern.pattern} para usuário ${pattern.userId}`);
  }

  private async storeFeedbackHistory(feedback: ProcessedFeedback): Promise<void> {
    const userHistory = this.feedbackHistory.get(feedback.userId) || [];
    userHistory.push(feedback);
    
    // Manter apenas últimos 100 feedbacks
    if (userHistory.length > 100) {
      userHistory.splice(0, userHistory.length - 100);
    }
    
    this.feedbackHistory.set(feedback.userId, userHistory);
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== API ENDPOINTS ====================

  public async getFeedbackSummary(userId: string, days: number = 30): Promise<any> {
    const userHistory = this.feedbackHistory.get(userId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentFeedback = userHistory.filter(f => f.processedAt >= cutoffDate);
    
    return {
      totalFeedbacks: recentFeedback.length,
      averageRating: recentFeedback.reduce((sum, f) => sum + f.overallRating, 0) / recentFeedback.length || 0,
      criticalInsights: recentFeedback.flatMap(f => f.insights.filter(i => i.type === 'critical')).length,
      adjustmentsMade: recentFeedback.flatMap(f => f.actionsTaken.filter(a => a.type === 'weight_adjustment' && a.executed)).length,
      lastFeedback: recentFeedback[recentFeedback.length - 1]?.processedAt
    };
  }
}

// ==================== ROUTER DE ENDPOINTS ====================

const router = Router();
const feedbackProcessor = FeedbackProcessor.getInstance();

// Processar novo feedback
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const feedback: FeedbackRequest = req.body;
    const result = await feedbackProcessor.processFeedback(feedback);
    
    res.json({
      success: true,
      feedbackId: result.id,
      insights: result.insights.length,
      adjustments: result.adjustmentSuggestions.length,
      actions: result.actionsTaken.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter resumo de feedback do usuário
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const summary = await feedbackProcessor.getFeedbackSummary(userId, days);
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter insights ativos para um usuário
router.get('/insights/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Implementar busca de insights ativos
    res.json({
      success: true,
      insights: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;