// types/recommendation/match-score.ts
// Sistema de scoring para matches e recomendações

import { 
  RecommendationAlgorithm, 
  CompatibilityDimensions, 
  CompatibilityAnalysis,
  RecommendationContext 
} from './base';

/**
 * Score de compatibilidade entre dois usuários
 */
export interface MatchScore {
  // Identificação
  id: string;
  userId: string;               // Usuário que está recebendo a recomendação
  targetUserId: string;         // Usuário sendo recomendado
  
  // Score principal
  overallScore: number;         // Score final combinado (0-1)
  normalizedScore: number;      // Score normalizado para exibição (0-100)
  percentile: number;           // Percentil em relação a outros matches (0-100)
  
  // Breakdown detalhado
  dimensionScores: CompatibilityDimensions;
  weightedScores: CompatibilityDimensions;  // Scores após aplicação dos pesos
  
  // Fatores contribuintes
  positiveFactors: ScoreFactor[];
  negativeFactors: ScoreFactor[];
  neutralFactors: ScoreFactor[];
  
  // Explicação humana
  explanation: MatchExplanation;
  
  // Confiança e qualidade
  confidence: number;           // Confiança no score (0-1)
  dataQuality: number;          // Qualidade dos dados usados (0-1)
  algorithmCertainty: number;   // Certeza do algoritmo (0-1)
  
  // Contexto da recomendação
  context: RecommendationContext;
  algorithm: RecommendationAlgorithm;
  
  // Metadados temporais
  calculatedAt: Date;
  expiresAt: Date;
  processingTime: number;       // Tempo de cálculo em ms
  
  // Dados para melhoria contínua
  feedback?: MatchFeedback;
  actualOutcome?: MatchOutcome;
  
  // Flags especiais
  isHighConfidence: boolean;    // Score de alta confiança
  isExperimental: boolean;      // Score usando algoritmo experimental
  requiresReview: boolean;      // Requer revisão manual
}

/**
 * Fator que contribui para o score
 */
export interface ScoreFactor {
  dimension: keyof CompatibilityDimensions;
  factor: string;               // Nome/tipo do fator
  description: string;          // Descrição em linguagem natural
  
  // Impacto numérico
  impact: number;               // Impacto no score (-1 a 1)
  weight: number;               // Peso deste fator (0-1)
  contribution: number;         // Contribuição final para o score
  
  // Confiança e evidência
  confidence: number;           // Confiança neste fator (0-1)
  evidence: FactorEvidence[];   // Evidências que suportam este fator
  
  // Dados específicos
  userValue?: any;              // Valor para o usuário principal
  targetValue?: any;            // Valor para o usuário alvo
  similarity?: number;          // Similaridade calculada (0-1)
  
  // Metadados
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: FactorCategory;
  isPersonalized: boolean;      // Se foi personalizado para este usuário
}

/**
 * Evidência que suporta um fator
 */
export interface FactorEvidence {
  type: EvidenceType;
  source: string;               // Origem da evidência
  data: any;                    // Dados da evidência
  reliability: number;          // Confiabilidade da evidência (0-1)
  timestamp?: Date;             // Quando a evidência foi coletada
}

/**
 * Tipos de evidência
 */
export type EvidenceType = 
  | 'direct_preference'         // Preferência direta do usuário
  | 'behavioral_pattern'        // Padrão comportamental observado
  | 'social_signal'             // Sinal social (amigos, likes, etc.)
  | 'historical_data'           // Dados históricos de interações
  | 'demographic_data'          // Dados demográficos
  | 'psychometric_data'         // Dados psicométricos
  | 'location_data'             // Dados de localização
  | 'temporal_pattern'          // Padrão temporal
  | 'third_party_data'          // Dados de terceiros
  | 'inferred_preference';      // Preferência inferida pelo ML

/**
 * Categorias de fatores
 */
export type FactorCategory = 
  | 'appearance'                // Aparência e atratividade física
  | 'personality'               // Personalidade e temperamento
  | 'lifestyle'                 // Estilo de vida e hábitos
  | 'interests'                 // Interesses e hobbies
  | 'values'                    // Valores e crenças
  | 'communication'             // Estilo de comunicação
  | 'goals'                     // Objetivos de vida
  | 'geographic'                // Fatores geográficos
  | 'demographic'               // Fatores demográficos
  | 'social'                    // Fatores sociais
  | 'temporal'                  // Fatores temporais
  | 'technical';                // Fatores técnicos/sistêmicos

/**
 * Explicação detalhada do match
 */
export interface MatchExplanation {
  // Resumo executivo
  summary: string;              // Resumo em uma frase
  headline: string;             // Manchete atrativa
  
  // Explicações estruturadas
  strengths: string[];          // Pontos fortes da compatibilidade
  challenges: string[];         // Possíveis desafios
  opportunities: string[];      // Oportunidades de conexão
  
  // Insights específicos
  styleInsight: string;         // Insight sobre compatibilidade de estilo
  personalityInsight: string;   // Insight sobre personalidade
  lifestyleInsight: string;     // Insight sobre lifestyle
  
  // Recomendações
  conversationStarters: string[]; // Sugestões para iniciar conversa
  sharedInterests: string[];    // Interesses em comum identificados
  potentialActivities: string[]; // Atividades que poderiam fazer juntos
  
  // Níveis de explicação
  brief: string;                // Explicação breve (tweet-sized)
  detailed: string;             // Explicação detalhada (parágrafo)
  technical: string;            // Explicação técnica (para debugging)
  
  // Personalização
  tone: ExplanationTone;        // Tom da explicação
  confidence: number;           // Confiança na explicação (0-1)
  isPersonalized: boolean;      // Se foi personalizada para o usuário
}

/**
 * Tom da explicação
 */
export type ExplanationTone = 
  | 'casual'                    // Tom casual e amigável
  | 'romantic'                  // Tom romântico
  | 'professional'              // Tom profissional
  | 'playful'                   // Tom brincalhão
  | 'deep'                      // Tom profundo e filosófico
  | 'practical';                // Tom prático e direto

/**
 * Feedback sobre o match score
 */
export interface MatchFeedback {
  userId: string;
  matchScoreId: string;
  
  // Feedback do usuário
  userRating?: number;          // Avaliação do usuário (1-5)
  userFeedback?: string;        // Feedback textual
  action?: MatchAction;         // Ação tomada pelo usuário
  
  // Feedback implícito
  viewTime: number;             // Tempo visualizando o perfil (ms)
  interactionDepth: number;     // Profundidade da interação (0-1)
  repeatViews: number;          // Quantas vezes voltou a ver o perfil
  
  // Resultado final
  wasAccurate: boolean;         // Se o score foi preciso
  scorePerception: 'too_high' | 'accurate' | 'too_low';
  
  // Metadados
  timestamp: Date;
  deviceType: string;
  sessionId: string;
}

/**
 * Ação tomada pelo usuário em relação ao match
 */
export type MatchAction = 
  | 'like'
  | 'dislike' 
  | 'super_like'
  | 'skip'
  | 'report'
  | 'block'
  | 'message'
  | 'call'
  | 'video_call'
  | 'meet_request'
  | 'unmatch';

/**
 * Resultado real do match
 */
export interface MatchOutcome {
  matchScoreId: string;
  
  // Resultado imediato
  mutualMatch: boolean;         // Se houve match mútuo
  conversationStarted: boolean; // Se iniciaram conversa
  
  // Resultado de médio prazo
  conversationDuration: number; // Duração da conversa (ms)
  messageCount: number;         // Número de mensagens trocadas
  meetingArranged: boolean;     // Se marcaram encontro
  
  // Resultado de longo prazo
  relationshipFormed: boolean;  // Se formaram relacionamento
  relationshipDuration?: number; // Duração do relacionamento (ms)
  relationshipType?: RelationshipType;
  
  // Análise de qualidade
  userSatisfaction?: number;    // Satisfação reportada (0-1)
  wouldRecommendAgain?: boolean; // Se recomendaria algoritmo novamente
  
  // Metadados
  lastUpdate: Date;
  isComplete: boolean;          // Se o outcome está completo
  confidenceLevel: number;      // Confiança no outcome (0-1)
}

/**
 * Tipo de relacionamento formado
 */
export type RelationshipType = 
  | 'friendship'
  | 'casual_dating'
  | 'serious_relationship'
  | 'long_term_partnership'
  | 'marriage'
  | 'business'
  | 'none';

/**
 * Batch de scores para múltiplos usuários
 */
export interface MatchScoreBatch {
  batchId: string;
  userId: string;               // Usuário recebendo as recomendações
  
  // Scores individuais
  scores: MatchScore[];
  
  // Estatísticas do batch
  totalCandidates: number;      // Total de candidatos analisados
  averageScore: number;         // Score médio
  scoreDistribution: ScoreDistribution;
  
  // Diversidade e qualidade
  diversityScore: number;       // Diversidade das recomendações (0-1)
  noveltyScore: number;         // Novidade das recomendações (0-1)
  qualityScore: number;         // Qualidade geral (0-1)
  
  // Performance
  processingTime: number;       // Tempo total de processamento (ms)
  algorithm: RecommendationAlgorithm;
  cacheHitRate: number;         // Taxa de acerto do cache
  
  // Contexto
  context: RecommendationContext;
  
  // Metadados
  createdAt: Date;
  expiresAt: Date;
  version: string;              // Versão do algoritmo usado
}

/**
 * Distribuição de scores
 */
export interface ScoreDistribution {
  histogram: number[];          // Histograma de scores
  percentiles: Record<string, number>; // Percentis (p50, p75, p90, p95, p99)
  mean: number;
  median: number;
  standardDeviation: number;
  skewness: number;             // Assimetria da distribuição
  kurtosis: number;             // Curtose da distribuição
}

/**
 * Comparação entre scores
 */
export interface MatchScoreComparison {
  scoreA: MatchScore;
  scoreB: MatchScore;
  
  // Diferenças
  overallDifference: number;    // Diferença no score geral
  dimensionDifferences: CompatibilityDimensions; // Diferenças por dimensão
  
  // Análise
  betterChoice: 'a' | 'b' | 'tie' | 'depends';
  reasoning: string[];          // Razões para a escolha
  
  // Recomendação
  recommendation: ComparisonRecommendation;
  confidence: number;           // Confiança na recomendação (0-1)
}

/**
 * Recomendação da comparação
 */
export interface ComparisonRecommendation {
  choice: 'a' | 'b' | 'both' | 'neither';
  reasoning: string;
  factors: string[];            // Fatores que influenciaram a decisão
  alternatives?: string[];      // Alternativas sugeridas
}

/**
 * Análise de tendências de scores
 */
export interface ScoreTrendAnalysis {
  userId: string;
  period: { start: Date; end: Date };
  
  // Tendências gerais
  averageScoreTrend: 'increasing' | 'decreasing' | 'stable';
  scoreMeanChange: number;      // Mudança na média dos scores
  scoreVarianceChange: number;  // Mudança na variância
  
  // Tendências por dimensão
  dimensionTrends: Record<keyof CompatibilityDimensions, TrendInfo>;
  
  // Padrões identificados
  patterns: ScorePattern[];
  anomalies: ScoreAnomaly[];
  
  // Insights
  insights: string[];
  recommendations: string[];    // Recomendações para melhoria
  
  // Metadados
  sampleSize: number;
  confidence: number;
  lastAnalyzed: Date;
}

/**
 * Informação de tendência
 */
export interface TrendInfo {
  direction: 'increasing' | 'decreasing' | 'stable';
  magnitude: number;            // Magnitude da mudança (-1 a 1)
  confidence: number;           // Confiança na tendência (0-1)
  significance: 'low' | 'medium' | 'high';
}

/**
 * Padrão nos scores
 */
export interface ScorePattern {
  name: string;
  description: string;
  frequency: number;            // Frequência de ocorrência
  significance: number;         // Significância estatística (0-1)
  impact: number;               // Impacto nos resultados (0-1)
}

/**
 * Anomalia nos scores
 */
export interface ScoreAnomaly {
  type: AnomalyType;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  affectedScores: string[];     // IDs dos scores afetados
  possibleCauses: string[];
}

/**
 * Tipos de anomalia
 */
export type AnomalyType = 
  | 'score_spike'               // Pico súbito nos scores
  | 'score_drop'                // Queda súbita nos scores
  | 'distribution_shift'        // Mudança na distribuição
  | 'dimension_imbalance'       // Desequilíbrio entre dimensões
  | 'confidence_drop'           // Queda na confiança
  | 'processing_delay'          // Demora no processamento
  | 'algorithm_drift'           // Deriva do algoritmo
  | 'data_quality_issue';       // Problema na qualidade dos dados

/**
 * Configuração de scoring
 */
export interface ScoringConfig {
  // Pesos globais padrão
  defaultWeights: CompatibilityDimensions;
  
  // Thresholds
  minRecommendationScore: number;    // Score mínimo para recomendação
  highConfidenceThreshold: number;   // Threshold para alta confiança
  lowDataQualityThreshold: number;   // Threshold para baixa qualidade
  
  // Normalização
  normalizationMethod: 'linear' | 'sigmoid' | 'percentile';
  percentileCalculationWindow: number; // Janela para cálculo de percentis (dias)
  
  // Explicações
  enableDetailedExplanations: boolean;
  maxExplanationFactors: number;     // Máximo de fatores na explicação
  explanationConfidenceThreshold: number;
  
  // Performance
  maxProcessingTime: number;         // Tempo máximo de processamento (ms)
  enableCaching: boolean;
  cacheTimeoutMinutes: number;
  
  // Experimentação
  enableABTesting: boolean;
  experimentalAlgorithmRate: number; // % de scores usando algoritmo experimental
  
  // Qualidade
  enableQualityChecks: boolean;
  enableAnomalyDetection: boolean;
  anomalyDetectionSensitivity: number;
}

/**
 * Utilitários para manipulação de scores
 */
export namespace MatchScoreUtils {
  /**
   * Converte score numérico para classificação textual
   */
  export function scoreToLabel(score: number): string {
    if (score >= 0.9) return 'Excelente';
    if (score >= 0.8) return 'Muito Boa';
    if (score >= 0.7) return 'Boa';
    if (score >= 0.6) return 'Razoável';
    if (score >= 0.4) return 'Baixa';
    return 'Muito Baixa';
  }
  
  /**
   * Converte score para cor (para UI)
   */
  export function scoreToColor(score: number): string {
    if (score >= 0.8) return '#10B981'; // green-500
    if (score >= 0.6) return '#F59E0B'; // amber-500
    if (score >= 0.4) return '#EF4444'; // red-500
    return '#6B7280'; // gray-500
  }
  
  /**
   * Calcula score combinado de múltiplas dimensões
   */
  export function calculateCombinedScore(
    dimensions: CompatibilityDimensions,
    weights: CompatibilityDimensions
  ): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [key, value] of Object.entries(dimensions)) {
      const weight = weights[key as keyof CompatibilityDimensions];
      totalScore += value * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
  
  /**
   * Normaliza score para percentil
   */
  export function normalizeToPercentile(
    score: number,
    distribution: ScoreDistribution
  ): number {
    // Implementação simplificada - em produção usar distribuição real
    return Math.round(score * 100);
  }
  
  /**
   * Verifica se score é de alta confiança
   */
  export function isHighConfidence(matchScore: MatchScore): boolean {
    return matchScore.confidence >= 0.8 && 
           matchScore.dataQuality >= 0.7 && 
           matchScore.algorithmCertainty >= 0.8;
  }
  
  /**
   * Extrai insights principais de um score
   */
  export function extractKeyInsights(matchScore: MatchScore): string[] {
    const insights: string[] = [];
    
    // Adicionar insights baseados nos fatores positivos principais
    matchScore.positiveFactors
      .filter(f => f.importance === 'critical' || f.importance === 'high')
      .slice(0, 3)
      .forEach(f => insights.push(f.description));
    
    return insights;
  }
}