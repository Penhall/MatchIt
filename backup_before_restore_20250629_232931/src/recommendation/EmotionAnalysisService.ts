import { pool } from '../../server/config/database.js';
import { logger } from '../../server/utils/helpers.js';
import { AdaptiveLearningSystem } from './adaptiveLearning.js';
import { WeightAdjustmentParams, EmotionalStateSource } from './index.js';

export interface EmotionalState {
  id: number;
  userId: number;
  valence: number;
  arousal: number;
  dominance: number;
  timestamp: Date;
  description?: string;
  source: EmotionalStateSource;
}

export interface EmotionalProfile {
  currentState: EmotionalState;
  recentStates: EmotionalState[];
  averageValence: number;
  averageArousal: number;
  averageDominance: number;
}

export class EmotionAnalysisService {
  private adaptiveLearningSystem: AdaptiveLearningSystem;

  constructor(adaptiveLearningSystem: AdaptiveLearningSystem) {
    this.adaptiveLearningSystem = adaptiveLearningSystem;
  }

  /**
   * Registra um novo estado emocional para o usuário
   */
  async recordEmotionalState(userId: number, state: Omit<EmotionalState, 'id'>): Promise<boolean> {
    try {
      await pool.query(
        'SELECT register_emotional_state($1, $2, $3, $4, $5, $6)',
        [
          userId,
          state.valence,
          state.arousal,
          state.dominance,
          state.description,
          state.source || 'self_report'
        ]
      );
      return true;
    } catch (error) {
      logger.error(`Erro ao registrar estado emocional para usuário ${userId}:`, error as Record<string, unknown>);
      return false;
    }
  }

  /**
   * Calcula o perfil emocional do usuário com base no histórico
   */
  async calculateEmotionalProfile(userId: number): Promise<EmotionalProfile> {
    const [currentState, recentStates] = await Promise.all([
      this.getCurrentState(userId),
      this.getRecentStates(userId)
    ]);

    const averageValence = recentStates.reduce((sum, state) => sum + state.valence, 0) / recentStates.length;
    const averageArousal = recentStates.reduce((sum, state) => sum + state.arousal, 0) / recentStates.length;
    const averageDominance = recentStates.reduce((sum, state) => sum + state.dominance, 0) / recentStates.length;

    return {
      currentState,
      recentStates,
      averageValence,
      averageArousal,
      averageDominance
    };
  }

  /**
   * Calcula a linha de base emocional (média dos últimos 30 dias)
   */
  /**
   * Obtém o estado emocional mais recente
   */
  private async getCurrentState(userId: number): Promise<EmotionalState> {
    const result = await pool.query(
      `SELECT
        id, user_id, valence, arousal, dominance, timestamp, description, source
       FROM emotional_states
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return this.getDefaultState(userId);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      timestamp: new Date(row.timestamp),
      valence: parseFloat(row.valence),
      arousal: parseFloat(row.arousal),
      dominance: parseFloat(row.dominance),
      description: row.description,
      source: row.source as EmotionalStateSource
    };
  }

  /**
   * Obtém os estados recentes (últimos 7 dias)
   */
  private async getRecentStates(userId: number): Promise<EmotionalState[]> {
    const result = await pool.query(
      `SELECT
        id, user_id, valence, arousal, dominance, timestamp, description, source
       FROM emotional_states
       WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '7 days'
       ORDER BY timestamp DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      timestamp: new Date(row.timestamp),
      valence: parseFloat(row.valence),
      arousal: parseFloat(row.arousal),
      dominance: parseFloat(row.dominance),
      description: row.description,
      source: row.source as EmotionalStateSource
    }));
  }

  /**
   * Sugere ajustes de pesos baseados no estado emocional
   */
  async suggestWeightAdjustments(userId: number, emotionalState: EmotionalState): Promise<WeightAdjustmentParams> {
    const adjustments: WeightAdjustmentParams = {
      userId,
      hybridDelta: 0,
      contentDelta: 0,
      collaborativeDelta: 0,
      emotionalState
    };

    // Modelo de influência emocional (PLANO_MODULO_EMOCIONAL.md seção 5)
    if (emotionalState.valence > 0) {
      adjustments.contentDelta += 0.1;
      adjustments.collaborativeDelta -= 0.05;
    } else {
      adjustments.collaborativeDelta += 0.1;
      adjustments.contentDelta -= 0.05;
    }

    if (emotionalState.arousal > 0.7) {
      adjustments.hybridDelta -= 0.05; // Reduz complexidade
    } else if (emotionalState.arousal < 0.3) {
      adjustments.hybridDelta += 0.05; // Aumenta diversidade
    }

    return adjustments;
  }

  /**
   * Estado padrão quando não há dados
   */
  private getDefaultState(userId: number): EmotionalState {
    return {
      id: -1,
      userId,
      timestamp: new Date(),
      valence: 0,
      arousal: 0.5,
      dominance: 0.5,
      description: 'Estado padrão',
      source: 'inferred'
    };
  }
}