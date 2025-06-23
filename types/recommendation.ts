// types/recommendation.ts - Tipos do Sistema de Recomendação MatchIt (Atualizado com Perfil Emocional)

// Importar tipos emocionais
export * from './recommendation-emotional';

// =====================================================
// TIPOS BÁSICOS EXISTENTES (MANTIDOS)
// =====================================================

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
  // Novos filtros emocionais
  emotionalCompatibilityMin?: number;
  attachmentStyles?: string[];
  energyLevelRange?: [number, number];
  communicationStyles?: string[];
}

// =====================================================
// PERFIL DE USUÁRIO EXPANDIDO (INTEGRAÇÃO EMOCIONAL)
// =====================================================

/**
 * Perfil de usuário expandido com dados emocionais
 * Estende o perfil existente para incluir dimensão emocional
 */
export interface ExtendedUserProfile {
  // Dados básicos (existentes)
  id: string;
  userId: string;
  age: number;
  gender: string;
  location: GeographicLocation;
  
  // Preferências de estilo (existentes)
  stylePreferences: StylePreferences;
  
  // Preferências de busca (existentes)
  preferences: {
    ageRange: [number, number];
    maxDistance: number;
    genders?: string[];
  };
  
  // Personalidade (existente, expandido)
  personalityVector: number[];
  personalityProfile?: PersonalityProfile;
  
  // NOVO: Perfil emocional completo
  emotionalProfile?: EmotionalProfile;
  
  // NOVO: Nível de atividade
  activityLevel?: ActivityLevel;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  
  // Configurações de privacidade
  privacySettings: PrivacySettings;
  
  // Status de verificação
  isVerified: boolean;
  verificationLevel: VerificationLevel;
}

/**
 * Preferências de estilo existentes (mantidas)
 */
export interface StylePreferences {
  tenis: number[];
  roupas: number[];
  cores: number[];
  hobbies: number[];
  sentimentos: number[];
  
  // NOVO: Metadados sobre as preferências
  confidence?: number;        // Confiança nas preferências (0-100)
  lastUpdated?: Date;
  completeness?: number;      // Completude das preferências (0-100)
}

/**
 * Nível de atividade do usuário
 */
export interface ActivityLevel {
  overall: number;            // Nível geral de atividade (0-100)
  physical: number;           // Atividade física (0-100)
  social: number;             // Atividade social (0-100)
  intellectual: number;       // Atividade intelectual (0-100)
  creative: number;           // Atividade criativa (0-100)
  
  // Padrões temporais
  weekdayActivity: number;    // Atividade em dias úteis
  weekendActivity: number;    // Atividade em fins de semana
  morningActivity: number;    // Atividade matinal
  eveningActivity: number;    // Atividade noturna
  
  // Preferências
  preferredActivities: string[];
  avoidedActivities: string[];
  
  // Metadados
  lastUpdated: Date;
  dataSource: 'manual' | 'inferred' | 'mixed';
}

/**
 * Perfil de personalidade expandido
 */
export interface PersonalityProfile {
  // Big Five (expandido)
  openness: number;           // Abertura à experiência (0-100)
  conscientiousness: number;  // Conscienciosidade (0-100)
  extraversion: number;       // Extroversão (0-100)
  agreeableness: number;      // Amabilidade (0-100)
  neuroticism: number;        // Neuroticismo (0-100)
  
  // Tipos de personalidade
  mbtiType?: MBTIType;
  enneagramType?: EnneagramType;
  
  // Traços específicos
  traits: PersonalityTrait[];
  
  // Confiança nos dados
  confidence: number;
  dataSource: 'test' | 'inferred' | 'self_reported';
  lastAssessed: Date;
}

/**
 * Traço de personalidade específico
 */
export interface PersonalityTrait {
  name: string;
  value: number;              // Intensidade do traço (0-100)
  confidence: number;         // Confiança na medição (0-100)
  category: TraitCategory;
}

// =====================================================
// MATCH SCORE EXPANDIDO (INTEGRAÇÃO EMOCIONAL)
// =====================================================

/**
 * Score de compatibilidade expandido com dimensão emocional
 */
export interface EnhancedMatchScore {
  // Identificação
  id: string;
  userId: string;
  targetUserId: string;
  
  // Score principal
  overallScore: number;         // Score final combinado (0-100)
  normalizedScore: number;      // Score normalizado para exibição (0-100)
  percentile: number;           // Percentil em relação a outros matches (0-100)
  
  // Breakdown detalhado por dimensão
  dimensionScores: EnhancedDimensionScores;
  weightedScores: EnhancedDimensionScores;
  
  // Fatores contribuintes (expandido)
  positiveFactors: EnhancedScoreFactor[];
  negativeFactors: EnhancedScoreFactor[];
  neutralFactors: EnhancedScoreFactor[];
  
  // NOVO: Explicação emocional
  emotionalExplanation: EmotionalMatchExplanation;
  
  // Confiança e qualidade (expandido)
  confidence: number;
  dataQuality: number;
  algorithmCertainty: number;
  
  // NOVO: Fatores de risco e oportunidades
  riskFactors: RiskFactor[];
  opportunities: OpportunityFactor[];
  
  // Contexto da recomendação
  context: RecommendationContext;
  algorithm: RecommendationAlgorithm;
  
  // Metadados temporais
  calculatedAt: Date;
  expiresAt: Date;
  processingTime: number;
  
  // Dados para melhoria contínua
  feedback?: MatchFeedback;
  actualOutcome?: MatchOutcome;
  
  // Flags especiais
  isHighConfidence: boolean;
  isEmotionallyCompatible: boolean;    // NOVO
  requiresEmotionalWork: boolean;      // NOVO
  isExperimental: boolean;
  requiresReview: boolean;
}

/**
 * Scores por dimensão expandidos com dimensão emocional
 */
export interface EnhancedDimensionScores {
  // Dimensões existentes
  style: number;
  hobby: number;
  location: number;
  personality: number;
  
  // NOVA: Dimensão emocional
  emotional: number;
  
  // Dimensões opcionais expandidas
  lifestyle?: number;
  values?: number;
  communication?: number;
  intimacy?: number;           // NOVO
  attachment?: number;         // NOVO
  energy?: number;             // NOVO
  stability?: number;          // NOVO
}

/**
 * Fator de score expandido com informações emocionais
 */
export interface EnhancedScoreFactor {
  dimension: keyof EnhancedDimensionScores;
  factor: string;
  description: string;
  
  // Impacto numérico
  impact: number;
  weight: number;
  contribution: number;
  
  // Confiança e evidência
  confidence: number;
  evidence: FactorEvidence[];
  
  // NOVO: Dados emocionais específicos
  emotionalContext?: EmotionalFactorContext;
  
  // Dados específicos
  userValue?: any;
  targetValue?: any;
  similarity?: number;
  
  // NOVO: Recomendações específicas
  recommendations?: string[];
  
  // NOVO: Timeframe esperado para mudança
  changeTimeframe?: 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'unlikely';
}

/**
 * Contexto emocional de um fator
 */
export interface EmotionalFactorContext {
  emotionalDimension: 'energy' | 'openness' | 'stability' | 'social' | 'attachment';
  relevantEmotions: string[];
  potentialTriggers: string[];
  copingStrategies: string[];
  relationshipImpact: 'positive' | 'neutral' | 'challenging' | 'concerning';
}

/**
 * Explicação da compatibilidade emocional
 */
export interface EmotionalMatchExplanation {
  summary: string;              // Resumo da compatibilidade emocional
  keyStrengths: string[];       // Principais pontos fortes
  keyAreas: string[];           // Áreas que precisam atenção
  
  // Análise por dimensão
  energyAnalysis: string;
  opennessAnalysis: string;
  stabilityAnalysis: string;
  socialAnalysis: string;
  attachmentAnalysis: string;
  
  // Previsões
  shortTermOutlook: string;     // Perspectiva de curto prazo
  longTermOutlook: string;      // Perspectiva de longo prazo
  
  // Sugestões práticas
  communicationTips: string[];
  relationshipAdvice: string[];
  warningSignsToWatch: string[];
}

/**
 * Fator de risco no relacionamento
 */
export interface RiskFactor {
  id: string;
  type: RiskType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  likelihood: number;           // Probabilidade (0-100)
  
  // Mitigação
  mitigationStrategies: string[];
  earlyWarningSignals: string[];
  
  // Metadados
  confidence: number;
  dataSource: string[];
}

/**
 * Fator de oportunidade no relacionamento
 */
export interface OpportunityFactor {
  id: string;
  type: OpportunityType;
  potential: 'low' | 'medium' | 'high' | 'exceptional';
  description: string;
  likelihood: number;           // Probabilidade (0-100)
  
  // Otimização
  optimizationStrategies: string[];
  successIndicators: string[];
  
  // Metadados
  confidence: number;
  dataSource: string[];
}

// =====================================================
// CONTEXTO DE RECOMENDAÇÃO EXPANDIDO
// =====================================================

/**
 * Contexto expandido para recomendações
 */
export interface RecommendationContext {
  // Contexto temporal
  timestamp: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  // Contexto do usuário
  userMood?: number;            // Humor atual (0-100)
  userActivity?: string;        // Atividade atual
  userLocation?: GeographicLocation;
  
  // NOVO: Contexto emocional
  emotionalContext?: {
    recentMoodTrend: 'improving' | 'stable' | 'declining';
    stressLevel: number;        // Nível de stress (0-100)
    socialDesire: number;       // Desejo de socializar (0-100)
    energyLevel: number;        // Nível de energia atual (0-100)
  };
  
  // Contexto da sessão
  sessionType: 'casual_browsing' | 'active_search' | 'focused_dating';
  sessionDuration: number;      // Duração da sessão (minutos)
  interactionHistory: InteractionSummary;
  
  // Contexto externo
  weatherCondition?: string;
  localEvents?: string[];
  socialCalendar?: CalendarEvent[];
}

/**
 * Localização geográfica
 */
export interface GeographicLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  timezone: string;
  accuracy?: number;            // Precisão em metros
}

/**
 * Resumo de interações
 */
export interface InteractionSummary {
  totalRecommendationsViewed: number;
  totalLikes: number;
  totalDislikes: number;
  totalMatches: number;
  averageTimePerProfile: number;    // Segundos
  recentPatterns: string[];
}

/**
 * Evento do calendário
 */
export interface CalendarEvent {
  title: string;
  date: Date;
  type: 'work' | 'social' | 'personal' | 'travel';
  impact: 'positive' | 'neutral' | 'negative';
}

// =====================================================
// TIPOS AUXILIARES E ENUMS
// =====================================================

export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export type EnneagramType = 
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type TraitCategory = 
  | 'social' | 'emotional' | 'cognitive' | 'behavioral' | 'motivational';

export type RiskType = 
  | 'communication_breakdown' | 'emotional_mismatch' | 'lifestyle_conflict'
  | 'attachment_incompatibility' | 'energy_mismatch' | 'value_conflict'
  | 'intimacy_mismatch' | 'conflict_style_clash' | 'expectation_mismatch';

export type OpportunityType = 
  | 'deep_emotional_connection' | 'complementary_strengths' | 'shared_growth'
  | 'balanced_energy' | 'communication_synergy' | 'lifestyle_enhancement'
  | 'mutual_healing' | 'creative_collaboration' | 'spiritual_connection';

export type VerificationLevel = 
  | 'none' | 'email' | 'phone' | 'photo' | 'government_id' | 'full';

export interface PrivacySettings {
  showEmotionalProfile: boolean;
  showDetailedPersonality: boolean;
  showActivityLevel: boolean;
  allowEmotionalMatching: boolean;
  shareInsightsWithMatches: boolean;
}

// =====================================================
// EVIDÊNCIAS E METADADOS
// =====================================================

export interface FactorEvidence {
  type: string;
  description: string;
  strength: number;             // Força da evidência (0-1)
  source: 'questionnaire' | 'behavior' | 'feedback' | 'inferred';
  timestamp: Date;
  confidence: number;           // Confiança na evidência (0-1)
}

export interface MatchFeedback {
  action: FeedbackAction;
  timestamp: Date;
  context: string;
  explicitReason?: string;
  implicitSignals?: Record<string, any>;
}

export interface MatchOutcome {
  result: 'matched' | 'unmatched' | 'blocked' | 'reported' | 'conversation_started' | 'met_in_person';
  timestamp: Date;
  duration?: number;            // Duração do relacionamento (ms)
  satisfaction?: number;        // Satisfação reportada (0-100)
  details?: Record<string, any>;
}

// =====================================================
// CONFIGURAÇÕES DO SISTEMA
// =====================================================

/**
 * Configuração dos pesos do algoritmo híbrido
 */
export interface RecommendationWeights {
  // Pesos das dimensões principais
  style: number;                // Peso da compatibilidade de estilo
  emotional: number;            // Peso da compatibilidade emocional (NOVO)
  hobby: number;                // Peso da compatibilidade de hobbies
  location: number;             // Peso da proximidade geográfica
  personality: number;          // Peso da compatibilidade de personalidade
  
  // Pesos das dimensões secundárias
  lifestyle?: number;           // Peso da compatibilidade de estilo de vida
  values?: number;              // Peso da compatibilidade de valores
  communication?: number;       // Peso da compatibilidade de comunicação
  
  // Metadados
  lastUpdated: Date;
  adaptationCount: number;      // Quantas vezes foi adaptado
  userSpecific: boolean;        // Se é específico para o usuário
}

// =====================================================
// EXPORTAÇÕES LEGADAS (MANTIDAS PARA COMPATIBILIDADE)
// =====================================================

// Manter exports existentes para não quebrar código existente
export interface MatchScore extends Omit<EnhancedMatchScore, 'dimensionScores' | 'weightedScores'> {
  dimensionScores: {
    style: number;
    emotional: number;
    hobby: number;
    location: number;
    personality: number;
    lifestyle?: number;
    values?: number;
    communication?: number;
  };
  weightedScores: {
    style: number;
    emotional: number;
    hobby: number;
    location: number;
    personality: number;
    lifestyle?: number;
    values?: number;
    communication?: number;
  };
}

export interface UserProfile extends Omit<ExtendedUserProfile, 'emotionalProfile' | 'activityLevel'> {
  // Manter compatibilidade com interface existente
  emotionalProfile?: EmotionalProfile;
  activityLevel?: ActivityLevel;
}

// Re-export dos tipos emocionais para conveniência
export type { 
  EmotionalProfile,
  EmotionalCompatibility,
  EmotionalState,
  EmotionalPattern,
  EmotionalTrigger,
  EmotionalNeed,
  MoodEntry
} from './recommendation-emotional';