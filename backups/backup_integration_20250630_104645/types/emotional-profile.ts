// types/emotional-profile.ts - Tipagens completas para sistema de perfil emocional

// ==============================================
// INTERFACES PRINCIPAIS DO PERFIL EMOCIONAL
// ==============================================

/**
 * Perfil emocional completo do usuário
 * Baseado em pesquisa de psicologia e teoria das emoções
 */
export interface EmotionalProfile {
  // Emoções dominantes (Big 5 Emotions adaptado)
  dominantEmotions: EmotionalDimension[];
  
  // Intensidade emocional geral (0-100)
  emotionalIntensity: number;
  
  // Estabilidade emocional (0-100)
  emotionalStability: number;
  
  // Energia social (0-100) 
  socialEnergy: number;
  
  // Nível de empatia (0-100)
  empathyLevel: number;
  
  // Estilo de comunicação emocional
  communicationStyle: CommunicationStyle;
  
  // Preferências de atividades emocionais
  activityPreferences: ActivityEmotionalPreferences;
  
  // Estado emocional atual
  currentMoodProfile: MoodProfile;
  
  // Metadados
  metadata: EmotionalProfileMetadata;
}

/**
 * Dimensões emocionais principais
 */
export interface EmotionalDimension {
  type: EmotionType;
  intensity: number; // 0-100
  frequency: number; // 0-100 (quão frequentemente sente)
  preference: number; // 0-100 (o quanto gosta de sentir)
}

/**
 * Tipos de emoções baseados em research psicológico
 */
export type EmotionType = 
  // Emoções Positivas
  | 'joy'          // Alegria/Felicidade
  | 'excitement'   // Empolgação/Entusiasmo  
  | 'contentment'  // Contentamento/Satisfação
  | 'serenity'     // Serenidade/Paz
  | 'confidence'   // Confiança/Segurança
  | 'love'         // Amor/Carinho
  | 'gratitude'    // Gratidão/Apreciação
  | 'curiosity'    // Curiosidade/Interesse
  
  // Emoções Neutras/Complexas
  | 'calmness'     // Calma/Tranquilidade
  | 'focus'        // Foco/Concentração
  | 'determination'// Determinação/Motivação
  | 'nostalgia'    // Nostalgia/Saudade
  
  // Emoções Desafiadoras (também importantes para matching)
  | 'melancholy'   // Melancolia/Reflexão
  | 'anxiety'      // Ansiedade (controlada)
  | 'passion'      // Paixão/Intensidade
  | 'sensitivity'; // Sensibilidade/Emotividade

/**
 * Estilos de comunicação emocional
 */
export type CommunicationStyle = 
  | 'expressive'    // Expressivo - compartilha emoções abertamente
  | 'reserved'      // Reservado - mais privado com emoções
  | 'balanced'      // Balanceado - contextual
  | 'empathetic'    // Empático - foca nas emoções dos outros
  | 'logical'       // Lógico - prefere razão sobre emoção
  | 'intuitive';    // Intuitivo - segue sentimentos e energia

/**
 * Preferências de atividades baseadas em estado emocional
 */
export interface ActivityEmotionalPreferences {
  // Quando se sente feliz/energético
  whenHappy: ActivityType[];
  
  // Quando se sente calmo/relaxado
  whenCalm: ActivityType[];
  
  // Quando se sente estressado/ansioso
  whenStressed: ActivityType[];
  
  // Quando se sente romântico/apaixonado
  whenRomantic: ActivityType[];
  
  // Atividades que mais melhoram o humor
  moodBoosters: ActivityType[];
}

export type ActivityType = 
  // Atividades Sociais
  | 'social_gathering' | 'intimate_conversation' | 'party' | 'dinner_date'
  
  // Atividades Criativas  
  | 'art' | 'music' | 'writing' | 'photography' | 'dancing'
  
  // Atividades Físicas
  | 'exercise' | 'sports' | 'hiking' | 'yoga' | 'swimming'
  
  // Atividades Relaxantes
  | 'meditation' | 'reading' | 'movies' | 'spa' | 'massage'
  
  // Atividades Aventureiras
  | 'travel' | 'exploration' | 'extreme_sports' | 'concerts'
  
  // Atividades Intelectuais
  | 'learning' | 'puzzles' | 'games' | 'discussion' | 'research';

/**
 * Perfil de humor atual (muda com frequência)
 */
export interface MoodProfile {
  currentMood: EmotionType;
  moodIntensity: number; // 0-100
  moodStability: number; // 0-100 (quão estável está hoje)
  energyLevel: number;   // 0-100
  socialDesire: number;  // 0-100 (vontade de socializar hoje)
  romanticMood: number;  // 0-100 (abertura romântica hoje)
  lastUpdated: Date;
  validUntil: Date; // Humor expira para forçar atualização
}

/**
 * Metadados do perfil emocional
 */
export interface EmotionalProfileMetadata {
  profileId: string;
  userId: string;
  version: number;
  completedAt: Date;
  lastUpdatedAt: Date;
  
  // Estatísticas de completude
  completionStatus: {
    completed: boolean;
    sectionsCompleted: number;
    totalSections: number;
    completionPercentage: number;
  };
  
  // Fonte dos dados
  dataSource: 'questionnaire' | 'behavioral_analysis' | 'mixed';
  
  // Confiabilidade dos dados (0-100)
  reliabilityScore: number;
  
  // Indicadores de qualidade
  qualityFlags: {
    hasInconsistencies: boolean;
    needsReview: boolean;
    isHighConfidence: boolean;
  };
}

// ==============================================
// QUESTIONÁRIO EMOCIONAL
// ==============================================

/**
 * Estrutura do questionário emocional
 */
export interface EmotionalQuestionnaire {
  sections: EmotionalQuestionSection[];
  estimatedTime: number; // minutos
  version: string;
}

export interface EmotionalQuestionSection {
  id: string;
  title: string;
  description: string;
  questions: EmotionalQuestion[];
  estimatedTime: number;
}

export interface EmotionalQuestion {
  id: string;
  type: EmotionalQuestionType;
  question: string;
  description?: string;
  options?: EmotionalQuestionOption[];
  
  // Para diferentes tipos de pergunta
  scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  
  multipleChoice?: {
    maxSelections?: number;
    minSelections?: number;
  };
  
  required: boolean;
  weight: number; // Peso na análise final
}

export type EmotionalQuestionType = 
  | 'single_choice'    // Uma opção
  | 'multiple_choice'  // Múltiplas opções
  | 'scale'           // Escala 1-10
  | 'emotion_intensity' // Escala específica para intensidade emocional
  | 'scenario_response' // Como reagiria em cenário
  | 'activity_preference' // Preferência de atividade
  | 'mood_frequency';   // Frequência de humor

export interface EmotionalQuestionOption {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  emotionType?: EmotionType;
  
  // Para análise
  weight?: number;
  category?: string;
}

// ==============================================
// RESPOSTAS E ANÁLISE
// ==============================================

/**
 * Resposta do usuário ao questionário
 */
export interface EmotionalQuestionnaireResponse {
  userId: string;
  questionnaireVersion: string;
  responses: EmotionalQuestionResponse[];
  startedAt: Date;
  completedAt: Date;
  timeSpent: number; // segundos
}

export interface EmotionalQuestionResponse {
  questionId: string;
  answer: string | number | string[] | number[];
  confidence: number; // 0-100 - quão confiante o usuário está
  timeSpent: number; // segundos na pergunta
  responseMetadata?: {
    changed: boolean; // Se mudou a resposta
    hesitationTime: number; // Tempo antes de responder
  };
}

/**
 * Resultado da análise emocional
 */
export interface EmotionalAnalysisResult {
  userId: string;
  emotionalProfile: EmotionalProfile;
  analysisDetails: {
    processingTime: number;
    algorithmsUsed: string[];
    confidenceScore: number;
    qualityScore: number;
  };
  
  // Insights gerados
  insights: EmotionalInsight[];
  
  // Recomendações
  recommendations: EmotionalRecommendation[];
}

export interface EmotionalInsight {
  type: 'strength' | 'pattern' | 'compatibility' | 'growth';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
}

export interface EmotionalRecommendation {
  type: 'profile_improvement' | 'dating_strategy' | 'activity_suggestion';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

// ==============================================
// COMPATIBILIDADE EMOCIONAL
// ==============================================

/**
 * Resultado de compatibilidade emocional entre dois usuários
 */
export interface EmotionalCompatibilityResult {
  user1Id: string;
  user2Id: string;
  overallScore: number; // 0-100
  
  breakdown: {
    emotionalHarmony: number;      // Emoções complementares
    communicationSync: number;     // Estilos de comunicação
    activityAlignment: number;     // Atividades em comum
    moodCompatibility: number;     // Compatibilidade de humor
    empathyMatch: number;         // Níveis de empatia
  };
  
  explanation: string[];
  strengths: string[];
  challenges: string[];
  
  recommendations: string[];
  
  calculatedAt: Date;
  algorithm: string;
  confidence: number;
}

// ==============================================
// API RESPONSES
// ==============================================

export interface EmotionalProfileApiResponse {
  success: boolean;
  data?: {
    emotionalProfile: EmotionalProfile;
    compatibilityPreviews?: EmotionalCompatibilityResult[];
    insights?: EmotionalInsight[];
  };
  error?: string;
  processingTime: number;
}

export interface EmotionalQuestionnaireApiResponse {
  success: boolean;
  data?: {
    questionnaire: EmotionalQuestionnaire;
    existingResponses?: EmotionalQuestionResponse[];
    progress?: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
  error?: string;
}

// ==============================================
// CONFIGURAÇÕES E CONSTANTES
// ==============================================

export const EMOTIONAL_PROFILE_CONFIG = {
  questionnaire: {
    minTimePerQuestion: 3, // segundos
    maxTimePerQuestion: 60, // segundos
    totalEstimatedTime: 15, // minutos
    sectionsCount: 5,
    questionsPerSection: 8
  },
  
  analysis: {
    minReliabilityScore: 70,
    highConfidenceThreshold: 85,
    inconsistencyThreshold: 30
  },
  
  compatibility: {
    excellentMatch: 85,
    goodMatch: 70,
    averageMatch: 50,
    poorMatch: 30
  },
  
  moodProfile: {
    validityHours: 24, // Humor válido por 24h
    updateReminderHours: 12
  }
} as const;

export const EMOTION_CATEGORIES = {
  positive: ['joy', 'excitement', 'contentment', 'serenity', 'confidence', 'love', 'gratitude', 'curiosity'],
  neutral: ['calmness', 'focus', 'determination', 'nostalgia'],
  complex: ['melancholy', 'anxiety', 'passion', 'sensitivity']
} as const;

export const COMMUNICATION_STYLES_INFO = {
  expressive: {
    label: 'Expressivo',
    description: 'Compartilha emoções e sentimentos abertamente',
    compatibility: ['empathetic', 'intuitive', 'expressive']
  },
  reserved: {
    label: 'Reservado', 
    description: 'Mais privado com emoções, prefere momentos íntimos',
    compatibility: ['balanced', 'logical', 'reserved']
  },
  balanced: {
    label: 'Balanceado',
    description: 'Adapta comunicação ao contexto e pessoa',
    compatibility: ['balanced', 'empathetic', 'expressive', 'reserved']
  },
  empathetic: {
    label: 'Empático',
    description: 'Foca nas emoções e necessidades dos outros',
    compatibility: ['expressive', 'intuitive', 'empathetic']
  },
  logical: {
    label: 'Lógico',
    description: 'Prefere razão e análise sobre emoção',
    compatibility: ['logical', 'reserved', 'balanced']
  },
  intuitive: {
    label: 'Intuitivo',
    description: 'Segue sentimentos e energia do momento',
    compatibility: ['intuitive', 'expressive', 'empathetic']
  }
} as const;

// ==============================================
// TYPE GUARDS E VALIDADORES
// ==============================================

export function isValidEmotionType(emotion: string): emotion is EmotionType {
  const allEmotions = [...EMOTION_CATEGORIES.positive, ...EMOTION_CATEGORIES.neutral, ...EMOTION_CATEGORIES.complex];
  return allEmotions.includes(emotion as EmotionType);
}

export function isValidCommunicationStyle(style: string): style is CommunicationStyle {
  return Object.keys(COMMUNICATION_STYLES_INFO).includes(style);
}

export function isValidEmotionalProfile(profile: any): profile is EmotionalProfile {
  return (
    profile &&
    typeof profile === 'object' &&
    Array.isArray(profile.dominantEmotions) &&
    typeof profile.emotionalIntensity === 'number' &&
    typeof profile.emotionalStability === 'number' &&
    typeof profile.socialEnergy === 'number' &&
    typeof profile.empathyLevel === 'number' &&
    isValidCommunicationStyle(profile.communicationStyle)
  );
}

// ==============================================
// UTILITÁRIOS
// ==============================================

/**
 * Calcula score de completude do perfil emocional
 */
export function calculateEmotionalProfileCompleteness(profile: Partial<EmotionalProfile>): number {
  const requiredFields = [
    'dominantEmotions',
    'emotionalIntensity', 
    'emotionalStability',
    'socialEnergy',
    'empathyLevel',
    'communicationStyle',
    'activityPreferences',
    'currentMoodProfile'
  ];
  
  const completedFields = requiredFields.filter(field => {
    const value = profile[field as keyof EmotionalProfile];
    
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length > 0;
    }
    
    return value !== undefined && value !== null;
  });
  
  return Math.round((completedFields.length / requiredFields.length) * 100);
}

/**
 * Gera perfil emocional vazio para inicialização
 */
export function createEmptyEmotionalProfile(userId: string): EmotionalProfile {
  return {
    dominantEmotions: [],
    emotionalIntensity: 50,
    emotionalStability: 50,
    socialEnergy: 50,
    empathyLevel: 50,
    communicationStyle: 'balanced',
    activityPreferences: {
      whenHappy: [],
      whenCalm: [],
      whenStressed: [],
      whenRomantic: [],
      moodBoosters: []
    },
    currentMoodProfile: {
      currentMood: 'contentment',
      moodIntensity: 50,
      moodStability: 50,
      energyLevel: 50,
      socialDesire: 50,
      romanticMood: 50,
      lastUpdated: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    },
    metadata: {
      profileId: `emotional_${userId}_${Date.now()}`,
      userId,
      version: 1,
      completedAt: new Date(),
      lastUpdatedAt: new Date(),
      completionStatus: {
        completed: false,
        sectionsCompleted: 0,
        totalSections: 5,
        completionPercentage: 0
      },
      dataSource: 'questionnaire',
      reliabilityScore: 0,
      qualityFlags: {
        hasInconsistencies: false,
        needsReview: true,
        isHighConfidence: false
      }
    }
  };
}