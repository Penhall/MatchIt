// types/recommendation/extended-user.ts
// Extensão do perfil do usuário para sistema de recomendação

import { User, StyleCategory } from '@/types.ts'; // Usando alias @/ para a raiz do projeto
import { 
  GeographicLocation, 
  UserActivity, 
  ProfileQuality,
  CompatibilityDimensions,
  UserAlgorithmWeights 
} from './base';

/**
 * Perfil estendido do usuário para recomendações
 * Estende o User básico com dados específicos para o algoritmo
 */
export interface ExtendedUserProfile extends User {
  // Informações demográficas adicionais
  interests: ('dating' | 'friendship' | 'casual' | 'other' | 'coaching')[]; // Novo campo para interesses
  
  // Localização e geografia
  location: GeographicLocation;
  locationHistory?: LocationHistory[];
  
  // Preferências de estilo expandidas
  stylePreferences: ExtendedStylePreferences;
  styleConfidence: number;           // Confiança nas escolhas de estilo (0-1)
  styleEvolution: StyleEvolution[];  // Como o estilo mudou ao longo do tempo
  
  // Dados psicológicos e comportamentais
  personalityProfile: PersonalityProfile;
  emotionalProfile: EmotionalProfile;
  lifestyleProfile: LifestyleProfile;
  
  // Atividade e engajamento
  activityProfile: UserActivity;
  engagementMetrics: EngagementMetrics;
  
  // Qualidade e autenticidade
  profileQuality: ProfileQuality;
  verificationStatus: VerificationStatus;
  
  // Preferências de matching
  matchingPreferences: MatchingPreferences;
  algorithmWeights?: UserAlgorithmWeights;
  
  // Histórico e aprendizado
  interactionHistory: InteractionHistorySummary;
  learningProfile: LearningProfile;
  
  // Dados temporais
  temporalPreferences: TemporalPreferences;
  
  // Privacidade e controle
  privacySettings: PrivacySettings;
  
  // Metadados do sistema
  systemMetadata: UserSystemMetadata;
}

/**
 * Histórico de localização do usuário
 */
export interface LocationHistory {
  location: GeographicLocation;
  timestamp: Date;
  duration: number;              // Tempo gasto nesta localização (ms)
  accuracy: number;              // Precisão da localização (0-1)
  source: 'manual' | 'gps' | 'check_in';
}

/**
 * Preferências de estilo expandidas
 */
export interface ExtendedStylePreferences {
  // Categorias básicas (do sistema existente)
  sneakers: StyleChoice[];
  clothing: StyleChoice[];
  colors: StyleChoice[];
  hobbies: StyleChoice[];
  feelings: StyleChoice[];
  
  // Categorias expandidas para melhor matching
  music: StyleChoice[];
  art: StyleChoice[];
  travel: StyleChoice[];
  food: StyleChoice[];
  lifestyle: StyleChoice[];
  
  // Análise derivada
  dominantCategories: StyleCategory[];    // Categorias onde tem mais preferências
  stylePersonality: StylePersonalityType;
  trendinessScore: number;                // Quão alinhado com tendências (0-1)
  uniquenessScore: number;                // Quão único é o estilo (0-1)
}

/**
 * Escolha de estilo individual
 */
export interface StyleChoice {
  id: string;
  category: StyleCategory;
  value: any;                    // Valor específico da escolha
  confidence: number;            // Confiança nesta escolha (0-1)
  timestamp: Date;               // Quando foi feita a escolha
  source: 'quiz' | 'inferred' | 'explicit' | 'social';
  weight: number;                // Peso/importância desta escolha (0-1)
}

/**
 * Tipos de personalidade de estilo
 */
export type StylePersonalityType = 
  | 'minimalist'      // Minimalista - prefere simplicidade
  | 'maximalist'      // Maximalist - gosta de elementos chamatativos
  | 'classic'         // Clássico - prefere estilos atemporais
  | 'trendy'          // Trendy - segue tendências atuais
  | 'eclectic'        // Eclético - mistura vários estilos
  | 'artistic'        // Artístico - gosta de expressão criativa
  | 'sporty'          // Esportivo - foca em funcionalidade
  | 'elegant'         // Elegante - prefere sofisticação
  | 'edgy'            // Arrojado - gosta de looks ousados
  | 'bohemian';       // Boêmio - estilo livre e relaxado

/**
 * Evolução do estilo ao longo do tempo
 */
export interface StyleEvolution {
  period: Date;
  styleSnapshot: Partial<ExtendedStylePreferences>;
  majorChanges: StyleChange[];
  stability: number;             // Estabilidade do estilo (0-1)
}

/**
 * Mudança específica no estilo
 */
export interface StyleChange {
  category: StyleCategory;
  from: any;
  to: any;
  reason?: string;               // Motivo da mudança se conhecido
  confidence: number;
}

/**
 * Perfil de personalidade (Big Five + outros)
 */
export interface PersonalityProfile {
  // Big Five
  openness: number;              // Abertura a experiências (0-1)
  conscientiousness: number;     // Conscienciosidade (0-1)
  extraversion: number;          // Extroversão (0-1)
  agreeableness: number;         // Amabilidade (0-1)
  neuroticism: number;           // Neuroticismo (0-1)
  
  // Dimensões adicionais relevantes para dating
  adventurousness: number;       // Gosto por aventura (0-1)
  romanticism: number;           // Romantismo (0-1)
  intellectuality: number;       // Interesse intelectual (0-1)
  socialness: number;           // Sociabilidade (0-1)
  
  // Confiança e origem dos dados
  confidence: number;            // Confiança no perfil (0-1)
  source: 'inferred' | 'quiz' | 'social' | 'behavioral';
  lastUpdated: Date;
}

/**
 * Perfil emocional
 */
export interface EmotionalProfile {
  // Estados emocionais principais
  primaryEmotions: EmotionalState[];
  emotionalStability: number;     // Estabilidade emocional (0-1)
  emotionalIntelligence: number;  // Inteligência emocional estimada (0-1)
  
  // Padrões emocionais
  emotionalPatterns: EmotionalPattern[];
  triggers: EmotionalTrigger[];   // O que desperta emoções
  
  // Compatibilidade emocional
  preferredEmotionalTypes: string[];
  emotionalNeeds: EmotionalNeed[];
  
  // Dados temporais
  moodHistory: MoodEntry[];
  emotionalTrends: EmotionalTrend[];
}

/**
 * Estado emocional
 */
export interface EmotionalState {
  emotion: string;               // Nome da emoção
  intensity: number;             // Intensidade (0-1)
  frequency: number;             // Frequência (0-1)
  duration: number;              // Duração típica (0-1)
  triggers?: string[];           // O que causa esta emoção
}

/**
 * Padrão emocional identificado
 */
export interface EmotionalPattern {
  name: string;
  description: string;
  frequency: number;             // Frequência de ocorrência
  predictability: number;        // Previsibilidade (0-1)
  impact: 'positive' | 'neutral' | 'negative';
}

/**
 * Gatilho emocional
 */
export interface EmotionalTrigger {
  trigger: string;
  emotions: string[];            // Emoções que desencadeia
  intensity: number;             // Intensidade média (0-1)
  frequency: number;             // Frequência de ocorrência
}

/**
 * Necessidade emocional
 */
export interface EmotionalNeed {
  need: string;                  // Tipo de necessidade
  importance: number;            // Importância (0-1)
  fulfillment: number;           // Quão satisfeita está (0-1)
  source: 'inferred' | 'explicit';
}

/**
 * Entrada de humor/mood
 */
export interface MoodEntry {
  mood: string;
  intensity: number;
  timestamp: Date;
  context?: string;              // Contexto opcional
  source: 'self_reported' | 'inferred';
}

/**
 * Tendência emocional
 */
export interface EmotionalTrend {
  emotion: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  period: { start: Date; end: Date };
}

/**
 * Perfil de lifestyle
 */
export interface LifestyleProfile {
  // Nível de atividade física
  activityLevel: number;         // 0-10
  fitnessInterests: string[];
  sportsPreferences: string[];
  
  // Hábitos sociais
  socialLevel: number;           // Quão social é (0-1)
  partyFrequency: number;        // Frequência de festas/eventos (0-1)
  preferredGroupSize: 'small' | 'medium' | 'large' | 'varies';
  
  // Estilo de vida
  workLifeBalance: number;       // Equilíbrio trabalho-vida (0-1)
  careerAmbition: number;        // Ambição profissional (0-1)
  familyOrientation: number;     // Orientação familiar (0-1)
  
  // Hábitos e rotinas
  sleepSchedule: TimePattern;
  workSchedule: TimePattern;
  weekendPreferences: WeekendPreference[];
  
  // Interesses de longo prazo
  lifeGoals: LifeGoal[];
  values: PersonalValue[];
  dealBreakers: string[];        // Deal breakers em relacionamentos
}

/**
 * Padrão temporal
 */
export interface TimePattern {
  typical: { start: number; end: number }; // Horários típicos (0-23)
  flexibility: number;           // Flexibilidade do horário (0-1)
  consistency: number;           // Consistência (0-1)
}

/**
 * Preferência de final de semana
 */
export interface WeekendPreference {
  activity: string;
  frequency: number;             // Frequência (0-1)
  importance: number;            // Importância (0-1)
  socialLevel: 'alone' | 'couple' | 'small_group' | 'large_group';
}

/**
 * Objetivo de vida
 */
export interface LifeGoal {
  goal: string;
  importance: number;            // Importância (0-1)
  timeframe: 'short' | 'medium' | 'long';
  progress: number;              // Progresso atual (0-1)
  category: 'career' | 'family' | 'personal' | 'financial' | 'health' | 'travel';
}

/**
 * Valor pessoal
 */
export interface PersonalValue {
  value: string;
  importance: number;            // Importância (0-1)
  category: 'moral' | 'social' | 'personal' | 'professional';
  flexibility: number;           // Flexibilidade sobre este valor (0-1)
}

/**
 * Métricas de engajamento
 */
export interface EngagementMetrics {
  // Métricas básicas
  totalSessions: number;
  averageSessionDuration: number;
  totalTimeSpent: number;        // Tempo total no app (ms)
  
  // Padrões de uso
  peakUsageHours: number[];      // Horários de maior uso
  usageFrequency: number;        // Frequência de uso (0-1)
  lastActiveDate: Date;
  
  // Interações sociais
  profilesViewed: number;
  profilesLiked: number;
  conversationsStarted: number;
  messagesExchanged: number;
  
  // Qualidade do engajamento
  averageViewTime: number;       // Tempo médio visualizando perfis
  likeToViewRatio: number;       // Razão likes/visualizações
  responseRate: number;          // Taxa de resposta a mensagens
  
  // Tendências
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  retentionProbability: number;  // Probabilidade de continuar usando (0-1)
}

/**
 * Status de verificação
 */
export interface VerificationStatus {
  isVerified: boolean;
  verifiedPhotos: boolean;
  verifiedPhone: boolean;
  verifiedEmail: boolean;
  verifiedSocial: boolean;
  
  // Scores de autenticidade
  authenticityScore: number;     // Score geral de autenticidade (0-1)
  photoAuthenticityScore: number;
  profileAuthenticityScore: number;
  
  // Dados da verificação
  verificationDate?: Date;
  verificationMethod?: string;
  manualReviewPassed?: boolean;
}

/**
 * Preferências de matching
 */
export interface MatchingPreferences {
  // Filtros demográficos
  ageRange: [number, number];
  genderPreferences: string[];
  locationPreferences: LocationPreference;
  
  // Filtros de estilo
  styleCompatibilityImportance: number;    // Importância da compatibilidade de estilo (0-1)
  acceptableStyleDifference: number;       // Diferença aceitável no estilo (0-1)
  
  // Filtros de personalidade
  personalityCompatibilityImportance: number;
  preferredPersonalityTraits: string[];
  
  // Filtros de lifestyle
  lifestyleCompatibilityImportance: number;
  activityLevelTolerance: number;          // Tolerância para diferenças de atividade
  
  // Qualidade e autenticidade
  requireVerifiedProfiles: boolean;
  minProfileQuality: number;               // Qualidade mínima do perfil (0-1)
  
  // Algoritmo
  preferredAlgorithm?: 'hybrid' | 'style_focused' | 'personality_focused';
  diversityPreference: number;             // Preferência por diversidade (0-1)
  
  // Configurações avançadas
  allowSecondChances: boolean;             // Permitir re-matches
  showOnlineStatusImportance: number;      // Importância de ver status online
}

/**
 * Preferência de localização
 */
export interface LocationPreference {
  maxDistance: number;           // Distância máxima em km
  preferLocalMatches: boolean;   // Preferir matches locais
  allowTravelMatches: boolean;   // Permitir matches de viagem
  preferredCities?: string[];    // Cidades preferenciais
  
  // Flexibilidade de localização
  locationImportance: number;    // Importância da localização (0-1)
  willingToRelocate: boolean;    // Disposto a se mudar
  travelFrequency: number;       // Frequência de viagem (0-1)
}

/**
 * Resumo do histórico de interações
 */
export interface InteractionHistorySummary {
  totalInteractions: number;
  likeRate: number;              // Taxa de likes
  matchRate: number;             // Taxa de matches
  conversationRate: number;      // Taxa de conversas iniciadas
  
  // Padrões temporais
  mostActiveHours: number[];
  mostActiveDays: number[];
  averageResponseTime: number;   // Tempo médio de resposta
  
  // Preferências reveladas
  preferredAgeRange: [number, number];
  preferredDistance: number;
  mostLikedCategories: StyleCategory[];
  
  // Qualidade das interações
  averageInteractionQuality: number;
  ghostingRate: number;          // Taxa de abandono de conversas
  reportRate: number;            // Taxa de reports recebidos
}

/**
 * Perfil de aprendizado do algoritmo
 */
export interface LearningProfile {
  // Dados de aprendizado
  totalLearningEvents: number;
  lastLearningUpdate: Date;
  learningVelocity: number;      // Velocidade de aprendizado (0-1)
  
  // Confiança no aprendizado
  learningConfidence: number;    // Confiança no que foi aprendido (0-1)
  dataQuality: number;           // Qualidade dos dados para aprendizado (0-1)
  sampleSize: number;            // Quantidade de dados usados
  
  // Padrões identificados
  identifiedPatterns: LearnedPattern[];
  predictions: UserPrediction[];
  
  // Adaptação do algoritmo
  personalizedWeights: CompatibilityDimensions;
  algorithmPerformance: number;  // Performance do algoritmo para este usuário (0-1)
  
  // Experimentos e A/B tests
  participatingExperiments: string[];
  testGroupAssignments: Record<string, string>;
}

/**
 * Padrão aprendido sobre o usuário
 */
export interface LearnedPattern {
  pattern: string;
  confidence: number;
  evidence: string[];
  impact: number;                // Impacto nas recomendações (0-1)
  lastConfirmed: Date;
}

/**
 * Predição sobre comportamento do usuário
 */
export interface UserPrediction {
  prediction: string;
  probability: number;           // Probabilidade (0-1)
  confidence: number;            // Confiança na predição (0-1)
  timeframe: string;             // Prazo da predição
  basedOn: string[];             // Em que se baseia a predição
}

/**
 * Preferências temporais do usuário
 */
export interface TemporalPreferences {
  // Horários preferenciais
  preferredMatchingTimes: TimePattern[];
  preferredChatTimes: TimePattern[];
  
  // Padrões de atividade
  weekdayActivity: number[];     // Atividade por dia da semana
  hourlyActivity: number[];      // Atividade por hora do dia
  
  // Sazonalidade
  seasonalPreferences: SeasonalPreference[];
  holidayBehavior: HolidayBehavior;
  
  // Tempo de resposta
  typicalResponseTime: number;   // Tempo típico de resposta (ms)
  responseTimeVariability: number; // Variabilidade no tempo de resposta
}

/**
 * Preferência sazonal
 */
export interface SeasonalPreference {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  activityChange: number;        // Mudança na atividade (-1 a 1)
  preferenceChange: Partial<ExtendedStylePreferences>;
  moodChange: number;            // Mudança no humor (-1 a 1)
}

/**
 * Comportamento em feriados
 */
export interface HolidayBehavior {
  holidayActivityLevel: number;  // Nível de atividade em feriados (0-1)
  holidayMoodChange: number;     // Mudança no humor (-1 a 1)
  socialPreferencesChange: number; // Mudança nas preferências sociais (-1 a 1)
}

/**
 * Configurações de privacidade
 */
export interface PrivacySettings {
  // Visibilidade do perfil
  profileVisibility: 'public' | 'limited' | 'private';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showDistance: boolean;
  
  // Dados compartilhados
  shareLocationData: boolean;
  shareActivityData: boolean;
  shareStylePreferences: boolean;
  allowDataAnalysis: boolean;
  
  // Controle de algoritmo
  allowPersonalization: boolean;
  allowMachineLearning: boolean;
  allowExperiments: boolean;
  
  // Configurações de contato
  allowMessagesFromNonMatches: boolean;
  requireMutualLikeForContact: boolean;
  blockSettings: BlockSettings;
}

/**
 * Configurações de bloqueio
 */
export interface BlockSettings {
  blockedUsers: string[];
  autoBlockReported: boolean;
  autoBlockInactive: boolean;
  temporaryBlockDuration: number; // Em dias
}

/**
 * Metadados do sistema
 */
export interface UserSystemMetadata {
  // Dados técnicos
  profileVersion: string;
  lastProfileUpdate: Date;
  dataSourceVersions: Record<string, string>;
  
  // Qualidade e integridade
  dataIntegrityChecks: DataIntegrityCheck[];
  lastIntegrityCheck: Date;
  
  // Performance e uso
  algorithmPerformanceHistory: AlgorithmPerformanceEntry[];
  systemUsageStats: SystemUsageStats;
  
  // Debugging e suporte
  debugFlags: Record<string, boolean>;
  supportTickets: string[];       // IDs de tickets de suporte
  specialFlags: string[];         // Flags especiais (VIP, beta, etc.)
}

/**
 * Verificação de integridade de dados
 */
export interface DataIntegrityCheck {
  checkType: string;
  status: 'passed' | 'failed' | 'warning';
  details?: string;
  timestamp: Date;
}

/**
 * Entrada de performance do algoritmo
 */
export interface AlgorithmPerformanceEntry {
  date: Date;
  algorithm: string;
  performance: number;           // Score de performance (0-1)
  recommendations: number;       // Número de recomendações
  successRate: number;           // Taxa de sucesso
}

/**
 * Estatísticas de uso do sistema
 */
export interface SystemUsageStats {
  totalApiCalls: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastApiCall: Date;
}
