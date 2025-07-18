// types/feedback-tracking.ts

export interface FeedbackEvent {
  id: string;
  userId: string;
  eventType: FeedbackEventType;
  targetUserId: string;
  timestamp: Date;
  context: FeedbackContext;
  metadata: FeedbackMetadata;
}

export enum FeedbackEventType {
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_LEFT = 'swipe_left',
  SUPER_LIKE = 'super_like',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  MATCH_CREATED = 'match_created',
  MATCH_DISSOLVED = 'match_dissolved',
  PROFILE_VIEW = 'profile_view',
  PROFILE_VIEW_EXTENDED = 'profile_view_extended',
  CONVERSATION_STARTED = 'conversation_started',
  CONVERSATION_ENDED = 'conversation_ended',
  DATE_PLANNED = 'date_planned',
  DATE_COMPLETED = 'date_completed'
}

export interface FeedbackContext {
  screenType: string;
  sessionId: string;
  timeSpentViewing: number; // em segundos
  profilePosition: number; // posição na lista de recomendações
  totalProfilesShown: number;
  userMood?: EmotionalState;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
}

export interface FeedbackMetadata {
  matchScore: number;
  styleCompatibility: number;
  emotionalCompatibility: number;
  attributeWeights: AttributeWeights;
  targetUserAttributes: UserAttributes;
  reasonsForRecommendation: string[];
}

export interface AttributeWeights {
  age: number;
  location: number;
  interests: number;
  lifestyle: number;
  values: number;
  appearance: number;
  personality: number;
  communication: number;
  goals: number;
  emotionalIntelligence: number;
  humor: number;
  creativity: number;
}

export interface UserAttributes {
  age: number;
  locationDistance: number;
  sharedInterests: string[];
  lifestyleCompatibility: number;
  valuesAlignment: number;
  appearanceRating: number;
  personalityMatch: number;
  communicationStyle: string;
  relationshipGoals: string;
  emotionalProfile: EmotionalProfile;
}

export interface WeightAdjustment {
  id: string;
  userId: string;
  attribute: keyof AttributeWeights;
  oldWeight: number;
  newWeight: number;
  adjustmentReason: AdjustmentReason;
  confidenceScore: number;
  timestamp: Date;
  dataPoints: number; // quantidade de feedback considerado
}

export enum AdjustmentReason {
  POSITIVE_FEEDBACK = 'positive_feedback',
  NEGATIVE_FEEDBACK = 'negative_feedback',
  PATTERN_DETECTION = 'pattern_detection',
  TEMPORAL_PREFERENCE = 'temporal_preference',
  MOOD_INFLUENCE = 'mood_influence',
  LEARNING_IMPROVEMENT = 'learning_improvement'
}

export interface UserLearningProfile {
  userId: string;
  totalFeedbackEvents: number;
  adjustmentHistory: WeightAdjustment[];
  learningVelocity: number; // quão rápido o usuário muda preferências
  consistencyScore: number; // quão consistente são as preferências
  moodInfluenceLevel: number; // quanto o humor afeta as escolhas
  temporalPatterns: TemporalPattern[];
  lastUpdated: Date;
}

export interface TemporalPattern {
  timeContext: string; // 'morning', 'weekend', 'evening', etc.
  preferenceShifts: Partial<AttributeWeights>;
  confidence: number;
  occurrences: number;
}

export interface FeedbackAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  neutralEvents: number;
  avgMatchScore: number;
  improvementTrend: number; // -1 a 1, negativo = piorando, positivo = melhorando
  topPerformingAttributes: (keyof AttributeWeights)[];
  underperformingAttributes: (keyof AttributeWeights)[];
  recommendationAccuracy: number;
  userSatisfactionScore: number;
}

export interface AdaptiveRecommendationConfig {
  userId: string;
  currentWeights: AttributeWeights;
  baseWeights: AttributeWeights; // pesos originais do perfil
  adaptationRate: number; // 0.1 = lento, 0.5 = médio, 0.9 = rápido
  minConfidenceThreshold: number;
  maxWeightChange: number; // máxima mudança por ajuste
  temporalAdaptation: boolean;
  moodAdaptation: boolean;
  learningEnabled: boolean;
}

export interface RecommendationFeedback {
  targetUserId: string;
  feedback: FeedbackEventType;
  context: FeedbackContext;
  userState: {
    mood: EmotionalState;
    energy: number;
    social: number;
    timeAvailable: number;
  };
  prediction: {
    expectedOutcome: FeedbackEventType;
    confidence: number;
    reasoningFactors: string[];
  };
}

export interface WeightOptimizationResult {
  userId: string;
  optimizationType: 'gradient_descent' | 'genetic_algorithm' | 'bayesian';
  oldWeights: AttributeWeights;
  newWeights: AttributeWeights;
  expectedImprovement: number;
  confidence: number;
  dataPointsUsed: number;
  validationScore: number;
  timestamp: Date;
}

// Tipos auxiliares das fases anteriores (referência)
export interface EmotionalState {
  happiness: number;
  stress: number;
  energy: number;
  social: number;
  romantic: number;
}

export interface EmotionalProfile {
  currentState: EmotionalState;
  averageState: EmotionalState;
  preferences: {
    communicationStyle: string;
    activityLevel: string;
    socialPreference: string;
    conflictStyle: string;
    expressionStyle: string;
  };
  lastUpdated: Date;
}