// types/recommendation-emotional.ts - Perfil Emocional para Sistema de Recomendação MatchIt

/**
 * Perfil emocional completo do usuário
 * Usado para calcular compatibilidade emocional e melhorar precisão das recomendações
 */
export interface EmotionalProfile {
  // Identificação
  id: string;
  userId: string;
  version: string;                    // Versão do questionário usado
  
  // =====================================================
  // DIMENSÕES EMOCIONAIS PRINCIPAIS
  // =====================================================
  
  // 1. Energia e Vitalidade (0-100)
  energyLevel: number;                // Nível geral de energia
  socialEnergy: number;               // Energia em situações sociais
  physicalEnergy: number;             // Energia para atividades físicas
  mentalEnergy: number;               // Energia para atividades mentais
  
  // 2. Abertura Emocional (0-100)
  openness: number;                   // Abertura para novas experiências
  vulnerability: number;              // Conforto em ser vulnerável
  emotionalExpression: number;        // Facilidade para expressar emoções
  empathyLevel: number;               // Capacidade de empatia
  
  // 3. Estabilidade e Controle (0-100)
  emotionalStability: number;         // Estabilidade emocional geral
  stressResilience: number;           // Resistência ao estresse
  selfControl: number;                // Autocontrole emocional
  adaptability: number;               // Capacidade de adaptação
  
  // 4. Orientação Social (0-100)
  extroversion: number;               // Extroversão vs Introversão
  socialConfidence: number;           // Confiança em situações sociais
  groupOrientation: number;           // Preferência por atividades em grupo
  intimacyComfort: number;            // Conforto com intimidade emocional
  
  // 5. Motivação e Ambição (0-100)
  achievementDrive: number;           // Impulso para conquistas
  competitiveness: number;            // Nível de competitividade
  goalOrientation: number;            // Orientação para objetivos
  riskTolerance: number;              // Tolerância a riscos
  
  // =====================================================
  // PADRÕES EMOCIONAIS
  // =====================================================
  
  // Estados emocionais predominantes
  dominantEmotions: EmotionalState[];
  emotionalPatterns: EmotionalPattern[];
  
  // Triggers e necessidades
  emotionalTriggers: EmotionalTrigger[];
  emotionalNeeds: EmotionalNeed[];
  
  // Histórico de humor
  moodHistory: MoodEntry[];
  averageMood: number;                // Humor médio (0-100)
  moodStability: number;              // Estabilidade do humor (0-100)
  
  // =====================================================
  // COMPATIBILIDADE E RELACIONAMENTOS
  // =====================================================
  
  // Estilo de relacionamento
  attachmentStyle: AttachmentStyle;
  communicationStyle: CommunicationStyle;
  conflictStyle: ConflictResolutionStyle;
  loveLanguage: LoveLanguage[];
  
  // Preferências emocionais
  emotionalPreferences: EmotionalPreferences;
  dealBreakers: EmotionalDealBreaker[];
  
  // =====================================================
  // METADADOS E QUALIDADE
  // =====================================================
  
  // Qualidade dos dados
  completeness: number;               // Completude do perfil (0-100)
  confidence: number;                 // Confiança nos dados (0-100)
  dataQuality: ProfileDataQuality;
  
  // Temporal
  createdAt: Date;
  updatedAt: Date;
  lastQuestionnaire: Date;
  nextUpdateDue: Date;
  
  // Configuração
  isActive: boolean;
  isPublic: boolean;                  // Se pode ser usado para matching
  privacyLevel: PrivacyLevel;
}

/**
 * Estado emocional específico
 */
export interface EmotionalState {
  emotion: EmotionType;
  intensity: number;                  // Intensidade (0-100)
  frequency: number;                  // Frequência (0-100)
  duration: number;                   // Duração típica (minutos)
  context: string[];                  // Contextos onde aparece
  triggers: string[];                 // O que causa este estado
}

/**
 * Padrão emocional identificado
 */
export interface EmotionalPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;                  // Quão frequente é este padrão
  strength: number;                   // Força do padrão (0-100)
  contexts: string[];                 // Onde acontece
  emotions: EmotionType[];           // Emoções envolvidas
  
  // Timing
  timeOfDay?: string[];              // Horários mais comuns
  daysOfWeek?: string[];             // Dias da semana mais comuns
  seasonality?: string[];            // Sazonalidade
  
  // Impacto
  positiveImpact: number;            // Impacto positivo (0-100)
  negativeImpact: number;            // Impacto negativo (0-100)
}

/**
 * Trigger emocional
 */
export interface EmotionalTrigger {
  id: string;
  trigger: string;                   // Descrição do trigger
  category: TriggerCategory;
  intensity: number;                 // Intensidade da resposta (0-100)
  frequency: number;                 // Frequência de ocorrência (0-100)
  
  // Resposta emocional
  emotionalResponse: EmotionType[];
  responseIntensity: number;         // Intensidade da resposta (0-100)
  recoveryTime: number;              // Tempo para se recuperar (minutos)
  
  // Contexto
  contexts: string[];
  copingStrategies: string[];        // Estratégias de enfrentamento
}

/**
 * Necessidade emocional
 */
export interface EmotionalNeed {
  id: string;
  need: string;                      // Descrição da necessidade
  category: NeedCategory;
  importance: number;                // Importância (0-100)
  satisfaction: number;              // Nível atual de satisfação (0-100)
  
  // Impacto no relacionamento
  relationshipImpact: number;        // Impacto em relacionamentos (0-100)
  fulfillmentMethods: string[];      // Como pode ser atendida
  signs: string[];                   // Sinais quando não está sendo atendida
}

/**
 * Entrada de humor
 */
export interface MoodEntry {
  id: string;
  mood: number;                      // Humor (0-100)
  energy: number;                    // Energia (0-100)
  stress: number;                    // Estresse (0-100)
  
  // Contexto
  timestamp: Date;
  context?: string;                  // Contexto opcional
  activities?: string[];             // Atividades do dia
  social?: boolean;                  // Se houve interação social
  
  // Fatores externos
  weather?: string;
  sleep?: number;                    // Horas de sono
  exercise?: boolean;                // Se fez exercício
  
  // Metadados
  source: 'manual' | 'inferred' | 'passive';
  confidence: number;                // Confiança no dado (0-100)
}

/**
 * Preferências emocionais para relacionamentos
 */
export interface EmotionalPreferences {
  // Comunicação
  preferredCommunicationFrequency: CommunicationFrequency;
  communicationChannels: CommunicationChannel[];
  emotionalSharingLevel: SharingLevel;
  
  // Apoio emocional
  supportStyle: SupportStyle[];
  comfortMethods: ComfortMethod[];
  
  // Intimidade
  intimacyPace: IntimacyPace;
  physicalAffection: AffectionLevel;
  emotionalIntimacy: IntimacyLevel;
  
  // Conflitos
  conflictApproach: ConflictApproach;
  resolutionPreference: ResolutionPreference;
  
  // Tempo juntos
  togetherTimePreference: TogetherTimePreference;
  spaceNeeds: SpaceNeeds;
  
  // Crescimento
  personalGrowthImportance: number;  // Importância (0-100)
  sharedGoalsImportance: number;     // Importância (0-100)
}

/**
 * Deal breaker emocional
 */
export interface EmotionalDealBreaker {
  id: string;
  type: DealBreakerType;
  description: string;
  severity: DealBreakerSeverity;
  isAbsolute: boolean;               // Se é absoluto ou negociável
  context?: string[];                // Contextos onde se aplica
}

/**
 * Qualidade dos dados do perfil
 */
export interface ProfileDataQuality {
  questionnairesCompleted: number;
  totalQuestions: number;
  consistencyScore: number;          // Consistência das respostas (0-100)
  responseTime: number;              // Tempo médio de resposta (segundos)
  
  // Validação
  hasInconsistencies: boolean;
  suspiciousPatterns: string[];
  validationFlags: string[];
  
  // Atualização
  staleness: number;                 // Quão desatualizado está (dias)
  needsUpdate: boolean;
}

// =====================================================
// TIPOS E ENUMS
// =====================================================

export type EmotionType = 
  | 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust'
  | 'love' | 'gratitude' | 'hope' | 'pride' | 'shame' | 'guilt'
  | 'anxiety' | 'excitement' | 'calm' | 'frustration' | 'contentment'
  | 'loneliness' | 'confidence' | 'insecurity' | 'enthusiasm' | 'boredom';

export type AttachmentStyle = 
  | 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export type CommunicationStyle = 
  | 'direct' | 'indirect' | 'passive' | 'assertive' | 'aggressive';

export type ConflictResolutionStyle = 
  | 'collaborative' | 'competitive' | 'accommodating' | 'avoiding' | 'compromising';

export type LoveLanguage = 
  | 'words_of_affirmation' | 'quality_time' | 'physical_touch' 
  | 'acts_of_service' | 'receiving_gifts';

export type TriggerCategory = 
  | 'social' | 'work' | 'family' | 'financial' | 'health' | 'relationship' | 'personal';

export type NeedCategory = 
  | 'security' | 'connection' | 'autonomy' | 'recognition' | 'growth' | 'meaning';

export type CommunicationFrequency = 
  | 'constant' | 'frequent' | 'regular' | 'occasional' | 'minimal';

export type CommunicationChannel = 
  | 'face_to_face' | 'voice_call' | 'video_call' | 'text' | 'email' | 'social_media';

export type SharingLevel = 
  | 'very_open' | 'open' | 'moderate' | 'private' | 'very_private';

export type SupportStyle = 
  | 'listening' | 'advice_giving' | 'problem_solving' | 'emotional_validation' | 'distraction';

export type ComfortMethod = 
  | 'physical_presence' | 'words' | 'actions' | 'space' | 'activity';

export type IntimacyPace = 
  | 'very_slow' | 'slow' | 'moderate' | 'fast' | 'very_fast';

export type AffectionLevel = 
  | 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';

export type IntimacyLevel = 
  | 'very_deep' | 'deep' | 'moderate' | 'surface' | 'minimal';

export type ConflictApproach = 
  | 'immediate_discussion' | 'cooling_off_period' | 'mediated' | 'avoidance';

export type ResolutionPreference = 
  | 'compromise' | 'win_win' | 'one_wins' | 'agree_to_disagree';

export type TogetherTimePreference = 
  | 'constant' | 'most_time' | 'balanced' | 'some_time' | 'independent';

export type SpaceNeeds = 
  | 'minimal' | 'some' | 'balanced' | 'significant' | 'maximum';

export type DealBreakerType = 
  | 'emotional_unavailability' | 'anger_issues' | 'dishonesty' | 'lack_of_empathy'
  | 'emotional_manipulation' | 'commitment_issues' | 'communication_problems';

export type DealBreakerSeverity = 
  | 'mild' | 'moderate' | 'serious' | 'critical';

export type PrivacyLevel = 
  | 'public' | 'friends' | 'matches_only' | 'private';

/**
 * Cálculo de similaridade emocional entre dois usuários
 */
export interface EmotionalCompatibility {
  overallScore: number;              // Score geral (0-100)
  
  // Scores por dimensão
  energyCompatibility: number;
  opennessCompatibility: number;
  stabilityCompatibility: number;
  socialCompatibility: number;
  motivationCompatibility: number;
  
  // Compatibilidade de padrões
  patternSimilarity: number;
  triggerCompatibility: number;
  needsAlignment: number;
  
  // Compatibilidade de relacionamento
  attachmentCompatibility: number;
  communicationCompatibility: number;
  conflictCompatibility: number;
  loveLanguageAlignment: number;
  
  // Análise detalhada
  strengths: string[];               // Pontos fortes da compatibilidade
  challenges: string[];              // Possíveis desafios
  recommendations: string[];         // Recomendações para o relacionamento
  
  // Metadados
  confidence: number;                // Confiança no cálculo (0-100)
  dataQuality: number;               // Qualidade dos dados usados (0-100)
  calculatedAt: Date;
}