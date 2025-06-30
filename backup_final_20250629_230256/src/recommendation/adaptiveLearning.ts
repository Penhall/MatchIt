import { pool } from '../../server/config/database.js';
import { logger } from '../../server/utils/helpers.js';
import type { EmotionalState, EmotionalProfile } from './EmotionAnalysisService';

interface WeightAdjustmentParams {
  userId: number;
  hybridDelta: number;
  contentDelta: number;
  collaborativeDelta: number;
}

interface LearningHistoryEntry {
  timestamp: Date;
  weights: {
    hybrid: number;
    content: number;
    collaborative: number;
  };
  adjustment: {
    hybrid: number;
    content: number;
    collaborative: number;
  };
  feedbackType: string;
}

interface AdaptiveLearningConfig {
  minWeight: number;
  maxWeight: number;
  maxHistoryEntries: number;
}

export class AdaptiveLearningSystem {
  private cache = new Map<number, {
    recommendations: any[];
    timestamp: number;
    ttl: number;
  }>();

  invalidateCache(params: {
    userId: number;
    targetUserId?: number;
    strategy: 'immediate' | 'delayed' | 'batch';
    priority: 'high' | 'medium' | 'low';
  }): void {
    const { userId, targetUserId, strategy, priority } = params;
    
    // Invalidação imediata para usuário específico
    if (strategy === 'immediate') {
      this.cache.delete(userId);
      return;
    }

    // Invalidação com atraso baseado na prioridade
    const delay = priority === 'high' ? 5000 : priority === 'medium' ? 15000 : 30000;
    setTimeout(() => {
      this.cache.delete(userId);
    }, delay);
  }
  private learningHistory: LearningHistoryEntry[] = [];
  private config: AdaptiveLearningConfig = {
    minWeight: 0.1,
    maxWeight: 0.8,
    maxHistoryEntries: 100
  };

  async getWeights(userId: number): Promise<{hybrid: number, content: number, collaborative: number}> {
    try {
      const result = await pool.query(
        'SELECT hybrid_weight, content_weight, collaborative_weight FROM user_algorithm_weights WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Retornar pesos padrão se usuário não tiver registro
        return {
          hybrid: 0.4,
          content: 0.3,
          collaborative: 0.3
        };
      }

      const weights = result.rows[0];
      return {
        hybrid: parseFloat(weights.hybrid_weight),
        content: parseFloat(weights.content_weight),
        collaborative: parseFloat(weights.collaborative_weight)
      };
    } catch (error) {
      logger.error(`Erro ao recuperar pesos para usuário ${userId}:`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async applyAdjustment(params: WeightAdjustmentParams): Promise<boolean> {
    const { userId, hybridDelta, contentDelta, collaborativeDelta } = params;

    // Validar limites seguros
    const currentWeights = await this.getWeights(userId);
    const newHybrid = currentWeights.hybrid + hybridDelta;
    const newContent = currentWeights.content + contentDelta;
    const newCollaborative = currentWeights.collaborative + collaborativeDelta;

    if (
      newHybrid < this.config.minWeight || newHybrid > this.config.maxWeight ||
      newContent < this.config.minWeight || newContent > this.config.maxWeight ||
      newCollaborative < this.config.minWeight || newCollaborative > this.config.maxWeight
    ) {
      logger.warn(`Ajuste de pesos fora dos limites seguros para usuário ${userId}`);
      return false;
    }

    try {
      // Usar função de banco de dados para ajuste seguro
      await pool.query(
        'SELECT safe_adjust_weights($1, $2, $3, $4)',
        [userId, hybridDelta, contentDelta, collaborativeDelta]
      );

      // Registrar no histórico
      this.addToHistory({
        timestamp: new Date(),
        weights: {
          hybrid: newHybrid,
          content: newContent,
          collaborative: newCollaborative
        },
        adjustment: {
          hybrid: hybridDelta,
          content: contentDelta,
          collaborative: collaborativeDelta
        },
        feedbackType: 'auto_adjustment'
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao ajustar pesos para usuário ${userId}:`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private addToHistory(entry: LearningHistoryEntry): void {
    this.learningHistory.unshift(entry);
    
    // Manter histórico dentro do limite
    if (this.learningHistory.length > this.config.maxHistoryEntries) {
      this.learningHistory.pop();
    }
  }

  getHistory(userId: number, limit = 10): LearningHistoryEntry[] {
    return this.learningHistory.slice(0, limit);
  }

  async applyEmotionalAdjustments(userId: number, emotionalState: EmotionalState): Promise<boolean> {
    try {
      const adjustments = await this.suggestEmotionalAdjustments(userId, emotionalState);
      return this.applyAdjustment(adjustments);
    } catch (error) {
      logger.error(`Erro ao aplicar ajustes emocionais para usuário ${userId}:`, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  private async suggestEmotionalAdjustments(userId: number, emotionalState: EmotionalState): Promise<WeightAdjustmentParams> {
    // Implementação baseada no EmotionAnalysisService
    const adjustments: WeightAdjustmentParams = {
      userId,
      hybridDelta: 0,
      contentDelta: 0,
      collaborativeDelta: 0
    };

    if (emotionalState.valence > 0) {
      adjustments.contentDelta += 0.1;
      adjustments.collaborativeDelta -= 0.05;
    } else {
      adjustments.collaborativeDelta += 0.1;
      adjustments.contentDelta -= 0.05;
    }

    if (emotionalState.arousal > 0.7) {
      adjustments.hybridDelta -= 0.05;
    } else if (emotionalState.arousal < 0.3) {
      adjustments.hybridDelta += 0.05;
    }

    return adjustments;
  }

  async getEmotionalContext(userId: number): Promise<EmotionalProfile> {
    try {
      const result = await pool.query(
        'SELECT * FROM user_emotional_profile WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Perfil emocional não encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Erro ao recuperar contexto emocional para usuário ${userId}:`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  invalidateEmotionalCache(userId: number): void {
    this.cache.forEach((value, key) => {
      if (key === userId) {
        this.cache.delete(key);
      }
    });
  }
}