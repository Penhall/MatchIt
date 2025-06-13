// Tipos básicos para o sistema de recomendação
export type RecommendationAlgorithm = 
  | 'hybrid'
  | 'collaborative'
  | 'content'
  | 'social'
  | 'temporal';

export type FeedbackAction = 
  | 'like'
  | 'dislike'
  | 'super_like'
  | 'skip'
  | 'report'
  | 'block';

export interface RecommendationFilters {
  ageRange?: [number, number];
  maxDistance?: number;
  genders?: string[];
  verifiedOnly?: boolean;
  vipOnly?: boolean;
  interests?: string[];
}

export interface MatchScore {
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

export interface ScoreDistribution {
  style: number;
  emotional: number;
  hobby: number;
  location: number;
  personality: number;
  lifestyle?: number;
  values?: number;
  communication?: number;
}

export interface UserInteractionAnalytics {
  userId: string;
  sessionId: string;
  interactions: InteractionEvent[];
  identifiedPatterns: BehaviorPatternType[];
  sessionStart: Date;
  sessionEnd: Date;
}

export type BehaviorPatternType = 
  | 'exploratory'
  | 'selective'
  | 'consistent'
  | 'varied'
  | 'focused';

export interface InteractionEvent {
  targetUserId: string;
  action: FeedbackAction;
  timestamp: Date;
  context: any;
  algorithm: RecommendationAlgorithm;
}
