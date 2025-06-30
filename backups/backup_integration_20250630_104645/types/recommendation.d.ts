// Tipos básicos para o sistema de recomendação
type RecommendationAlgorithm = 
  | 'hybrid'
  | 'collaborative'
  | 'content'
  | 'social'
  | 'temporal';

type FeedbackAction = 
  | 'like'
  | 'dislike'
  | 'super_like'
  | 'skip'
  | 'report'
  | 'block';

interface RecommendationFilters {
  ageRange?: [number, number];
  maxDistance?: number;
  genders?: string[];
  verifiedOnly?: boolean;
  vipOnly?: boolean;
  interests?: string[];
}

interface MatchScore {
  userId: string;
  targetUserId: string;
  overallScore: number;
  styleScore: number;
  emotionalScore: number;
  hobbyScore: number;
  locationScore: number;
  personalityScore: number;
  lifestyleScore?: number;
  valuesScore?: number;
  communicationScore?: number;
  algorithm: RecommendationAlgorithm;
  timestamp: Date;
  distribution: ScoreDistribution;
}

interface ScoreDistribution {
  style: number;
  emotional: number;
  hobby: number;
  location: number;
  personality: number;
  lifestyle?: number;
  values?: number;
  communication?: number;
}

interface UserInteractionAnalytics {
  userId: string;
  sessionId: string;
  interactions: InteractionEvent[];
  identifiedPatterns: BehaviorPatternType[];
  sessionStart: Date;
  sessionEnd: Date;
}

type BehaviorPatternType = 
  | 'exploratory'
  | 'selective'
  | 'consistent'
  | 'varied'
  | 'focused';

interface InteractionEvent {
  targetUserId: string;
  action: FeedbackAction;
  timestamp: Date;
  context: any;
  algorithm: RecommendationAlgorithm;
}

export {
  RecommendationAlgorithm,
  FeedbackAction,
  RecommendationFilters,
  MatchScore,
  ScoreDistribution,
  UserInteractionAnalytics,
  BehaviorPatternType,
  InteractionEvent
};
