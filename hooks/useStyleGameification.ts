// =====================================================
// TIPOS E INTERFACES PARA SISTEMA DE GAMIFICAÇÃO
// =====================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Estatísticas principais do jogo/gamificação
 */
export interface GameStats {
  streak: number;                    // Sequência atual de respostas consecutivas
  points: number;                    // Pontos totais acumulados
  level: number;                     // Nível atual do usuário
  achievements: Achievement[];        // Lista de conquistas desbloqueadas
  totalTimeSpent: number;            // Tempo total gasto (em ms)
  fastAnswers: number;               // Quantidade de respostas rápidas
  categoryExpertise: Record<string, number>; // Experiência por categoria
}

/**
 * Conquistas/Achievements do sistema
 */
export interface Achievement {
  id: string;                        // ID único da conquista
  title: string;                     // Título da conquista
  description: string;               // Descrição detalhada
  icon: string;                      // Emoji ou ícone da conquista
  unlockedAt: Date;                  // Data/hora do desbloqueio
  type: AchievementType;             // Tipo/categoria da conquista
}

/**
 * Tipos de conquistas disponíveis
 */
export type AchievementType = 
  | 'speed'        // Conquistas relacionadas à velocidade
  | 'streak'       // Conquistas de sequência/streak
  | 'completion'   // Conquistas de conclusão
  | 'expertise'    // Conquistas de expertise/conhecimento
  | 'social';      // Conquistas sociais/compartilhamento

/**
 * Métricas de estilo e comportamento do usuário
 */
export interface StyleMetrics {
  averageResponseTime: number;           // Tempo médio de resposta (ms)
  categoryPreferences: Record<string, number>; // Preferências por categoria
  consistencyScore: number;              // Score de consistência (0-100)
  explorationScore: number;              // Score de exploração/diversidade (0-100)
}

/**
 * Configuração de uma conquista
 */
export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: AchievementType;
}

/**
 * Resultado do processamento de uma resposta
 */
export interface AnswerResult {
  pointsEarned: number;                  // Pontos ganhos nesta resposta
  bonusPoints: number;                   // Pontos de bônus (velocidade, streak, etc.)
  isFastAnswer: boolean;                 // Se foi uma resposta rápida
  streakMultiplier: number;              // Multiplicador do streak atual
  categoryBonus?: number;                // Bônus específico da categoria
  achievementsUnlocked?: Achievement[];  // Conquistas desbloqueadas
}

/**
 * Progresso do nível atual
 */
export interface LevelProgress {
  progress: number;                      // Progresso atual (0-100%)
  pointsToNext: number;                  // Pontos necessários para próximo nível
  isMaxLevel: boolean;                   // Se já atingiu o nível máximo
  currentLevelThreshold: number;         // Pontos mínimos do nível atual
  nextLevelThreshold: number;            // Pontos mínimos do próximo nível
}

/**
 * Configuração dos hooks de gamificação
 */
export interface GameificationHookConfig {
  onAchievementUnlocked?: (achievement: Achievement) => void;
  onLevelUp?: (newLevel: number, oldLevel: number) => void;
  onStreakBonus?: (bonusPoints: number, streakCount: number) => void;
  onPointsEarned?: (points: number, source: string) => void;
  enableHapticFeedback?: boolean;
  enableSoundEffects?: boolean;
}

/**
 * Estado do feedback visual/auditivo
 */
export interface FeedbackState {
  show: boolean;
  type: FeedbackType;
  value: number;
  message?: string;
  duration?: number;
}

/**
 * Tipos de feedback visual
 */
export type FeedbackType = 
  | 'points'
  | 'speed'
  | 'streak'
  | 'achievement'
  | 'levelup'
  | 'bonus';

/**
 * Configuração de notificação de conquista
 */
export interface NotificationConfig {
  achievement: Achievement | null;
  duration?: number;
  position?: NotificationPosition;
  showParticles?: boolean;
  autoClose?: boolean;
}

/**
 * Posições possíveis para notificações
 */
export type NotificationPosition = 'top' | 'center' | 'bottom';

/**
 * Dados de performance do usuário
 */
export interface PerformanceData {
  questionsAnswered: number;
  averageTime: number;
  fastestTime: number;
  slowestTime: number;
  accuracyScore: number;
  improvementRate: number;
}

/**
 * Configuração de níveis e thresholds
 */
export interface LevelConfig {
  level: number;
  pointsRequired: number;
  title: string;
  description: string;
  rewards?: string[];
  unlocks?: string[];
}

/**
 * Recomendações personalizadas baseadas no desempenho
 */
export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Tipos de recomendações
 */
export type RecommendationType = 
  | 'speed'
  | 'consistency'
  | 'exploration'
  | 'completion'
  | 'social';

/**
 * Analytics de estilo do usuário
 */
export interface StyleAnalytics {
  dominantCategories: string[];          // Categorias mais escolhidas
  preferenceStrength: Record<string, number>; // Força da preferência por categoria
  stylePersonality: StylePersonalityType;     // Tipo de personalidade de estilo
  trendsAlignment: number;               // Alinhamento com tendências (0-100)
  uniquenessScore: number;               // Score de singularidade (0-100)
}

/**
 * Tipos de personalidade de estilo
 */
export type StylePersonalityType = 
  | 'minimalist'    // Minimalista
  | 'bold'          // Ousado
  | 'classic'       // Clássico
  | 'eclectic'      // Eclético
  | 'trendy'        // Moderno/Tendência
  | 'unique';       // Único/Original

/**
 * Configuração completa do sistema de gamificação
 */
export interface GameificationConfig {
  levelThresholds: number[];
  achievementConfigs: Record<string, AchievementConfig>;
  pointSystem: {
    basePoints: number;
    speedBonusThreshold: number;    // ms
    speedBonusPoints: number;
    maxStreakMultiplier: number;
    categoryBonusPoints: number;
  };
  timings: {
    feedbackDuration: number;
    notificationDuration: number;
    animationDelay: number;
  };
  features: {
    enableAchievements: boolean;
    enableStreaks: boolean;
    enableLevels: boolean;
    enableRecommendations: boolean;
    enableAnalytics: boolean;
  };
}

/**
 * Estado completo da sessão de gamificação
 */
export interface GameificationSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  gameStats: GameStats;
  metrics: StyleMetrics;
  performanceData: PerformanceData;
  achievements: Achievement[];
  feedbackHistory: FeedbackState[];
  isActive: boolean;
}

/**
 * Eventos de gamificação para analytics
 */
export interface GameificationEvent {
  type: GameificationEventType;
  timestamp: Date;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

/**
 * Tipos de eventos de gamificação
 */
export type GameificationEventType = 
  | 'answer_submitted'
  | 'achievement_unlocked'
  | 'level_up'
  | 'streak_achieved'
  | 'session_started'
  | 'session_completed'
  | 'feedback_shown'
  | 'recommendation_generated';

// =====================================================
// CONSTANTES ÚTEIS
// =====================================================

/**
 * Thresholds padrão para níveis
 */
export const DEFAULT_LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000
] as const;

/**
 * Configurações padrão de achievements
 */
export const DEFAULT_ACHIEVEMENTS: Record<string, AchievementConfig> = {
  FIRST_CHOICE: {
    id: 'first_choice',
    title: 'Getting Started',
    description: 'Made your first style choice',
    icon: '🎯',
    type: 'completion'
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Answered 5 questions in under 3 seconds each',
    icon: '⚡',
    type: 'speed'
  },
  STREAK_MASTER: {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Achieved a 10x answer streak',
    icon: '🔥',
    type: 'streak'
  },
  STYLE_EXPERT: {
    id: 'style_expert',
    title: 'Style Expert',
    description: 'Completed all style categories',
    icon: '👔',
    type: 'expertise'
  },
  QUICK_SILVER: {
    id: 'quick_silver',
    title: 'Quicksilver',
    description: 'Average response time under 3 seconds',
    icon: '💨',
    type: 'speed'
  },
  CONSISTENCY_KING: {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'High consistency score across categories',
    icon: '👑',
    type: 'expertise'
  }
} as const;

/**
 * Configuração padrão do sistema de pontos
 */
export const DEFAULT_POINT_SYSTEM = {
  basePoints: 10,
  speedBonusThreshold: 3000,  // 3 segundos
  speedBonusPoints: 5,
  maxStreakMultiplier: 10,
  categoryBonusPoints: 3
} as const;

/**
 * Configuração padrão de tempos
 */
export const DEFAULT_TIMINGS = {
  feedbackDuration: 2000, // 2 segundos
  notificationDuration: 4000, // 4 segundos
  animationDelay: 300,
} as const;

// Funções auxiliares para cálculo de gamificação
const calculateLevel = (points: number, thresholds: readonly number[]) => {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
};

const calculateLevelProgress = (points: number, level: number, thresholds: readonly number[]): LevelProgress => {
  const currentLevelThreshold = thresholds[level - 1] || 0;
  const nextLevelThreshold = thresholds[level] || Infinity;

  if (nextLevelThreshold === Infinity) {
    return {
      progress: 100,
      pointsToNext: 0,
      isMaxLevel: true,
      currentLevelThreshold,
      nextLevelThreshold: currentLevelThreshold
    };
  }

  const pointsInCurrentLevel = points - currentLevelThreshold;
  const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return {
    progress: Math.min(100, progress),
    pointsToNext: nextLevelThreshold - points,
    isMaxLevel: false,
    currentLevelThreshold,
    nextLevelThreshold
  };
};

// Hook principal de gamificação
export const useStyleGameification = (config?: Partial<GameificationHookConfig>) => {
  const [gameStats, setGameStats] = useState<GameStats>({
    streak: 0,
    points: 0,
    level: 1,
    achievements: [],
    totalTimeSpent: 0,
    fastAnswers: 0,
    categoryExpertise: {},
  });

  const [styleMetrics, setStyleMetrics] = useState<StyleMetrics>({
    averageResponseTime: 0,
    categoryPreferences: {},
    consistencyScore: 0,
    explorationScore: 0,
  });

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const unlockAchievement = useCallback((achievementConfig: AchievementConfig) => {
    setGameStats(prevStats => {
      const newAchievement: Achievement = {
        ...achievementConfig,
        unlockedAt: new Date(),
      };
      if (!prevStats.achievements.some(a => a.id === newAchievement.id)) {
        config?.onAchievementUnlocked?.(newAchievement);
        return {
          ...prevStats,
          achievements: [...prevStats.achievements, newAchievement],
        };
      }
      return prevStats;
    });
  }, [config]);

  const addPoints = useCallback((newPoints: number, source: string) => {
    setGameStats(prevStats => {
      const updatedPoints = prevStats.points + newPoints;
      const newLevel = calculateLevel(updatedPoints, DEFAULT_LEVEL_THRESHOLDS);

      if (newLevel > prevStats.level) {
        config?.onLevelUp?.(newLevel, prevStats.level);
      }

      return {
        ...prevStats,
        points: updatedPoints,
        level: newLevel,
      };
    }
    );
    config?.onPointsEarned?.(newPoints, source);
  }, [config]);

  const processAnswer = useCallback((answerTime: number, category: string, isCorrect: boolean) => {
    setGameStats(prevStats => {
      let currentStreak = prevStats.streak;
      let bonusPoints = 0;
      let pointsEarned = DEFAULT_POINT_SYSTEM.basePoints;

      if (isCorrect) {
        currentStreak++;
        if (answerTime <= DEFAULT_POINT_SYSTEM.speedBonusThreshold) {
          bonusPoints += DEFAULT_POINT_SYSTEM.speedBonusPoints;
          // unlock speed achievement
          if (prevStats.fastAnswers + 1 >= 5) { // Example: 5 fast answers
            unlockAchievement(DEFAULT_ACHIEVEMENTS.SPEED_DEMON);
          }
          setGameStats(s => ({ ...s, fastAnswers: s.fastAnswers + 1 }));
        }
        
        // Apply streak bonus
        const streakMultiplier = Math.min(currentStreak, DEFAULT_POINT_SYSTEM.maxStreakMultiplier);
        bonusPoints += (currentStreak > 1 ? streakMultiplier : 0);
        config?.onStreakBonus?.(bonusPoints, currentStreak);

        // Category expertise
        const updatedCategoryExpertise = {
          ...prevStats.categoryExpertise,
          [category]: (prevStats.categoryExpertise[category] || 0) + 1,
        };
        // Example: unlock expertise achievement
        if (Object.values(updatedCategoryExpertise).every(count => count >= 10)) { // 10 answers in all categories
          unlockAchievement(DEFAULT_ACHIEVEMENTS.STYLE_EXPERT);
        }

        // Check for overall completion achievement
        if (prevStats.achievements.length + 1 >= Object.keys(DEFAULT_ACHIEVEMENTS).length) {
            unlockAchievement(DEFAULT_ACHIEVEMENTS.CONSISTENCY_KING); // Example: all achievements unlocked
        }

        return {
          ...prevStats,
          streak: currentStreak,
          points: prevStats.points + pointsEarned + bonusPoints,
          categoryExpertise: updatedCategoryExpertise,
          totalTimeSpent: prevStats.totalTimeSpent + answerTime,
        };
      } else {
        currentStreak = 0; // Reset streak on incorrect answer
        return {
          ...prevStats,
          streak: currentStreak,
        };
      }
    });

    // Update style metrics (simplified)
    setStyleMetrics(prevMetrics => ({
      ...prevMetrics,
      averageResponseTime: (prevMetrics.averageResponseTime * gameStats.points + answerTime) / (gameStats.points + DEFAULT_POINT_SYSTEM.basePoints),
      categoryPreferences: {
        ...prevMetrics.categoryPreferences,
        [category]: (prevMetrics.categoryPreferences[category] || 0) + 1,
      },
    }));
  }, [config, unlockAchievement, gameStats.points]);

  const showFeedback = useCallback((type: FeedbackType, value: number, message?: string, duration?: number) => {
    setFeedback({ show: true, type, value, message, duration });
    const timer = setTimeout(() => setFeedback(null), duration || DEFAULT_TIMINGS.feedbackDuration);
    return () => clearTimeout(timer);
  }, []);

  const levelProgress = calculateLevelProgress(gameStats.points, gameStats.level, DEFAULT_LEVEL_THRESHOLDS);

  return {
    gameStats,
    styleMetrics,
    levelProgress,
    feedback,
    addPoints,
    processAnswer,
    unlockAchievement,
    showFeedback,
    setGameStats, // Expose for external state manipulation if needed
    setStyleMetrics, // Expose for external state manipulation if needed
  };
};
