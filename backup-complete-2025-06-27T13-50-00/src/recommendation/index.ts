export type EmotionalStateSource = 'self_report' | 'biometric' | 'inferred';

export interface PaginationParams {
  limit: number;
  cursor?: string | number | Date;
  direction: 'forward' | 'backward';
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string | number | Date;
  prevCursor?: string | number | Date;
  hasMore: boolean;
}

export interface EmotionalState {
  id: number;
  userId: number;
  timestamp: Date;
  valence: number; // -1 (negativo) a 1 (positivo)
  arousal: number; // 0 (calmo) a 1 (excitado)
  dominance: number; // 0 (sem controle) a 1 (no controle)
  description?: string;
  source: EmotionalStateSource;
}

export type EmotionalStateInput = Omit<EmotionalState, 'id'> & {
  timestamp?: Date;
};

export interface EmotionalProfile {
  currentState: EmotionalState;
  recentStates: EmotionalState[];
  averageValence: number;
  averageArousal: number;
  averageDominance: number;
}

export interface WeightAdjustmentParams {
  userId: number;
  hybridDelta: number;
  contentDelta: number;
  collaborativeDelta: number;
  emotionalState?: EmotionalState; // Estado emocional opcional para ajustes baseados em emoção
}

export interface LearningHistoryEntry {
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
  emotionalState?: EmotionalState; // Estado emocional durante a sessão (opcional)
}

export interface AdaptiveLearningConfig {
  minWeight: number;
  maxWeight: number;
  maxHistoryEntries: number;
}

export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export type FeedbackType = 'like' | 'super_like' | 'dislike' | 'skip';

export interface FeedbackEvent {
  userId: number;
  targetUserId: number;
  type: FeedbackType;
  timestamp: Date;
  emotionalState?: EmotionalState;
}

export interface CacheInvalidationParams {
  userId: number;
  targetUserId?: number;
  strategy: 'immediate' | 'delayed' | 'batch';
  priority: 'high' | 'medium' | 'low';
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  avgLatency: number;
  size: number;
}

export { AdaptiveLearningSystem } from './adaptiveLearning';