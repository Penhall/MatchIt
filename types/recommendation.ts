// types/recommendation.ts - Tipos atualizados para sistema de recomendação e preferências de estilo
export interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// TIPOS DE PREFERÊNCIAS DE ESTILO (FASE 0)
// =====================================================

export interface StylePreference {
  category: string;
  questionId: string;
  selectedOption: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StylePreferencesResponse {
  userId: string;
  preferences: StylePreference[];
  completionStatus: {
    completed: boolean;
    totalQuestions: number;
    answeredQuestions: number;
  };
  lastUpdated: string;
}

export interface StyleQuestion {
  id: string;
  category: StyleCategory;
  question: string;
  options: StyleOption[];
  required?: boolean;
}

export interface StyleOption {
  id: string;
  label: string;
  value: string;
  imageUrl?: string;
  description?: string;
}

export type StyleCategory = 'cores' | 'tenis' | 'roupas' | 'hobbies' | 'sentimentos';

export interface StyleCompletionStats {
  totalAnswered: number;
  byCategory: Record<StyleCategory, number>;
  completionPercentage: number;
}

// =====================================================
// PERFIL DO USUÁRIO
// =====================================================

export interface UserProfile {
  id: number;
  userId: number;
  displayName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  city?: string;
  bio?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
  personalityVector?: number[];
  stylePreferences?: StylePreference[];
  styleCompletionStats?: StyleCompletionStats;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileWithStyle extends UserProfile {
  stylePreferences: StylePreference[];
  styleCompletionStats: StyleCompletionStats;
}

export interface UserPreferences {
  ageRange?: {
    min: number;
    max: number;
  };
  maxDistance?: number; // em km
  genderPreferences?: ('male' | 'female' | 'other')[];
  lookingFor?: 'casual' | 'serious' | 'friendship' | 'all';
}

// =====================================================
// SISTEMA DE RECOMENDAÇÃO
// =====================================================

export interface RecommendationRequest {
  userId: number;
  limit?: number;
  offset?: number;
  filters?: RecommendationFilters;
}

export interface RecommendationFilters {
  ageRange?: { min: number; max: number };
  maxDistance?: number;
  genderPreferences?: string[];
  excludeUserIds?: number[];
}

export interface RecommendationResponse {
  userId: number;
  recommendations: UserRecommendation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  };
  metadata: {
    algorithmVersion: string;
    processingTime: number;
    confidence: number;
  };
}

export interface UserRecommendation {
  user: UserProfile;
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
  confidence: number;
}

export interface ScoreBreakdown {
  style: number;
  location: number;
  personality: number;
  emotional?: number;
  hobbies?: number;
  overall: number;
}

// =====================================================
// FEEDBACK E ANALYTICS
// =====================================================

export interface FeedbackData {
  userId: number;
  targetUserId: number;
  action: FeedbackAction;
  context?: FeedbackContext;
  timestamp: string;
}

export type FeedbackAction = 'like' | 'dislike' | 'super_like' | 'pass' | 'report';

export interface FeedbackContext {
  source: 'recommendations' | 'search' | 'matches';
  algorithmVersion: string;
  userScore: number;
  sessionId?: string;
}

export interface UserInteractionAnalytics {
  userId: number;
  totalInteractions: number;
  likesGiven: number;
  likesReceived: number;
  matches: number;
  conversionRate: number;
  averageSessionTime: number;
  lastActive: string;
}

// =====================================================
// PERFIL EMOCIONAL (FUTURO - FASE 1)
// =====================================================

export interface EmotionalProfile {
  dominantEmotion: 'alegria' | 'calma' | 'aventura' | 'romântico' | 'confiante';
  emotionalIntensity: number; // 1-10
  emotionalStability: number; // 1-10
  socialEnergy: number; // 1-10
  empathy: number; // 1-10
  moodVariability: number; // 1-10
  stressResponse: 'calm' | 'active' | 'social' | 'solitary';
}

// =====================================================
// CONFIGURAÇÕES DE PESO DO ALGORITMO (FUTURO - FASE 2)
// =====================================================

export interface AlgorithmWeights {
  userId: number;
  styleWeight: number; // 0-1
  locationWeight: number; // 0-1
  personalityWeight: number; // 0-1
  emotionalWeight: number; // 0-1
  hobbiesWeight: number; // 0-1
  lastAdjusted: string;
  adjustmentReason: string;
}

export interface WeightAdjustmentHistory {
  userId: number;
  timestamp: string;
  oldWeights: Omit<AlgorithmWeights, 'userId' | 'lastAdjusted' | 'adjustmentReason'>;
  newWeights: Omit<AlgorithmWeights, 'userId' | 'lastAdjusted' | 'adjustmentReason'>;
  reason: string;
  performance: {
    beforeAdjustment: number;
    afterAdjustment: number;
  };
}

// =====================================================
// TIPOS DE API E ERRO
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================================
// HOOKS E COMPONENTES
// =====================================================

export interface UseApiResult {
  api: {
    get: <T>(url: string, config?: any) => Promise<{ data: T }>;
    post: <T>(url: string, data?: any, config?: any) => Promise<{ data: T }>;
    put: <T>(url: string, data?: any, config?: any) => Promise<{ data: T }>;
    delete: <T>(url: string, config?: any) => Promise<{ data: T }>;
  };
  loading: boolean;
  error: string | null;
}

export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// =====================================================
// COMPONENTES REACT NATIVE
// =====================================================

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any; // StyleProp<ViewStyle> do React Native
  textStyle?: any; // StyleProp<TextStyle> do React Native
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  visible: boolean;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: any) => void;
}

// =====================================================
// NAVEGAÇÃO
// =====================================================

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Profile: { userId?: number };
  StyleAdjustment: undefined;
  Recommendations: undefined;
  Matches: undefined;
  Chat: { matchId: number };
  Settings: undefined;
};

export interface NavigationProps {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
  push: (screen: keyof RootStackParamList, params?: any) => void;
  replace: (screen: keyof RootStackParamList, params?: any) => void;
}

// =====================================================
// CONSTANTES DE VALIDAÇÃO
// =====================================================

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 6,
    maxLength: 128,
    requireNumber: true,
    requireLetter: true
  },
  age: {
    min: 18,
    max: 100
  },
  bio: {
    maxLength: 500
  },
  displayName: {
    minLength: 2,
    maxLength: 50
  }
} as const;

// =====================================================
// CONFIGURAÇÕES DO SISTEMA
// =====================================================

export interface SystemConfig {
  recommendation: {
    defaultLimit: number;
    maxLimit: number;
    cacheTimeout: number; // em segundos
    algorithmVersion: string;
  };
  style: {
    totalQuestions: number;
    requiredCompletion: number; // percentual
    categories: StyleCategory[];
  };
  api: {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
  };
}

// =====================================================
// UTILITÁRIOS DE TIPO
// =====================================================

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Tipos utilitários para IDs
export type UserId = number;
export type ProfileId = number;
export type QuestionId = string;
export type OptionId = string;