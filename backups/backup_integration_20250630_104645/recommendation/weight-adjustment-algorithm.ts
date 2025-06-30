// recommendation/weight-adjustment-algorithm.ts - Algoritmo de Ajuste Automático de Pesos

import { UserInteractionAnalytics, InteractionType, UserInteraction } from './user-interaction-analytics';
import { EmotionalProfile } from '../types/EmotionalProfile';

// ==================== TIPOS E INTERFACES ====================

export interface WeightAdjustment {
  dimension: string;
  oldWeight: number;
  newWeight: number;
  confidence: number;
  reason: string;
  evidence: AdjustmentEvidence[];
}

export interface AdjustmentEvidence {
  type: 'positive' | 'negative' | 'neutral';
  interaction: UserInteraction;
  impact: number;
  timestamp: Date;
}

export interface DimensionWeights {
  [key: string]: number;
}

export interface LearningParameters {
  // Taxa de aprendizado - quão rapidamente os pesos se ajustam
  learningRate: number;
  
  // Fator de decaimento - reduz a influência de interações antigas
  decayFactor: number;
  
  // Limiar de confiança para aplicar ajustes
  confidenceThreshold: number;
  
  // Número mínimo de amostras para ajustes
  minSampleSize: number;
  
  // Peso máximo que uma dimensão pode ter
  maxWeight: number;
  
  // Peso mínimo que uma dimensão pode ter
  minWeight: number;
  
  // Janela de tempo para considerar interações (em dias)
  timeWindow: number;
}

export interface UserProfile {
  userId: string;
  emotionalProfile: EmotionalProfile;
  currentWeights: DimensionWeights;
  personalityType: string;
  learningStage: 'initial' | 'learning' | 'optimized' | 'expert';
  lastAdjustment: Date;
  totalInteractions: number;
}

export interface CompatibilitySignal {
  dimension: string;
  userValue: number;
  targetValue: number;
  compatibility: number;
  outcome: 'positive' | 'negative' | 'neutral';
  weight: number;
}

// ==================== CLASSE PRINCIPAL ====================

export class WeightAdjustmentAlgorithm {
  private static instance: WeightAdjustmentAlgorithm;
  private analytics: UserInteractionAnalytics;
  private defaultWeights: DimensionWeights;
  private learningParams: LearningParameters;

  private constructor() {
    this.analytics = UserInteractionAnalytics.getInstance();
    this.initializeDefaultWeights();
    this.initializeLearningParameters();
  }

  public static getInstance(): WeightAdjustmentAlgorithm {
    if (!WeightAdjustmentAlgorithm.instance) {
      WeightAdjustmentAlgorithm.instance = new WeightAdjustmentAlgorithm();
    }
    return WeightAdjustmentAlgorithm.instance;
  }

  // ==================== INICIALIZAÇÃO ====================

  private initializeDefaultWeights(): void {
    // Pesos iniciais baseados em pesquisas de relacionamento
    this.defaultWeights = {
      // Dimensões Principais (peso alto)
      'emotional_stability': 0.12,
      'communication_style': 0.11,
      'life_goals': 0.10,
      'conflict_resolution': 0.09,
      'intimacy_preferences': 0.08,
      
      // Dimensões Importantes (peso médio)
      'social_energy': 0.07,
      'adventure_seeking': 0.06,
      'independence_level': 0.06,
      'humor_style': 0.05,
      'values_alignment': 0.05,
      
      // Dimensões Complementares (peso baixo)
      'decision_making': 0.04,
      'stress_response': 0.04,
      'affection_expression': 0.04,
      'future_planning': 0.03,
      'creativity_level': 0.03,
      'family_orientation': 0.03
    };
  }

  private initializeLearningParameters(): void {
    this.learningParams = {
      learningRate: 0.1, // 10% de ajuste por iteração
      decayFactor: 0.95, // 5% de decaimento por dia
      confidenceThreshold: 0.7, // 70% de confiança mínima
      minSampleSize: 5, // Mínimo 5 interações
      maxWeight: 0.20, // Máximo 20% do peso total
      minWeight: 0.01, // Mínimo 1% do peso total
      timeWindow: 30 // 30 dias de histórico
    };
  }

  // ==================== AJUSTE PRINCIPAL ====================

  public async adjustWeights(userId: string): Promise<WeightAdjustment[]> {
    console.log(`🧠 Iniciando ajuste de pesos para usuário ${userId}`);
    
    // 1. Obter perfil do usuário
    const userProfile = await this.getUserProfile(userId);
    
    // 2. Analisar interações recentes
    const interactions = await this.getRelevantInteractions(userId);
    
    if (interactions.length < this.learningParams.minSampleSize) {
      console.log(`⚠️ Dados insuficientes (${interactions.length} interações)`);
      return [];
    }
    
    // 3. Extrair sinais de compatibilidade
    const signals = await this.extractCompatibilitySignals(interactions, userProfile);
    
    // 4. Calcular ajustes para cada dimensão
    const adjustments = await this.calculateWeightAdjustments(signals, userProfile);
    
    // 5. Aplicar ajustes com validação
    const appliedAdjustments = await this.applyAdjustments(adjustments, userProfile);
    
    // 6. Salvar novo perfil
    await this.saveUserProfile(userProfile);
    
    console.log(`✅ ${appliedAdjustments.length} ajustes aplicados`);
    return appliedAdjustments;
  }

  // ==================== EXTRAÇÃO DE SINAIS ====================

  private async extractCompatibilitySignals(
    interactions: UserInteraction[],
    userProfile: UserProfile
  ): Promise<CompatibilitySignal[]> {
    const signals: CompatibilitySignal[] = [];
    
    for (const interaction of interactions) {
      if (!interaction.context.targetUserId) continue;
      
      // Obter perfil do usuário alvo
      const targetProfile = await this.getTargetProfile(interaction.context.targetUserId);
      if (!targetProfile) continue;
      
      // Determinar resultado da interação
      const outcome = this.determineInteractionOutcome(interaction);
      
      // Calcular sinais para cada dimensão
      Object.keys(userProfile.currentWeights).forEach(dimension => {
        const userValue = this.getDimensionValue(userProfile.emotionalProfile, dimension);
        const targetValue = this.getDimensionValue(targetProfile, dimension);
        
        if (userValue !== null && targetValue !== null) {
          const compatibility = this.calculateDimensionCompatibility(userValue, targetValue, dimension);
          
          signals.push({
            dimension,
            userValue,
            targetValue,
            compatibility,
            outcome,
            weight: userProfile.currentWeights[dimension]
          });
        }
      });
    }
    
    return signals;
  }

  private determineInteractionOutcome(interaction: UserInteraction): 'positive' | 'negative' | 'neutral' {
    switch (interaction.interactionType) {
      case InteractionType.SWIPE_RIGHT:
      case InteractionType.SUPER_LIKE:
        return 'positive';
      
      case InteractionType.SWIPE_LEFT:
        return 'negative';
      
      case InteractionType.MATCH_OCCURRED:
      case InteractionType.CONVERSATION_STARTED:
        return 'positive';
      
      case InteractionType.DATE_ACCEPTED:
        return 'positive';
      
      case InteractionType.DATE_DECLINED:
        return 'negative';
      
      case InteractionType.DATE_RATED:
        if (interaction.context.rating && interaction.context.rating >= 4) {
          return 'positive';
        } else if (interaction.context.rating && interaction.context.rating <= 2) {
          return 'negative';
        }
        return 'neutral';
      
      default:
        return 'neutral';
    }
  }

  // ==================== CÁLCULO DE AJUSTES ====================

  private async calculateWeightAdjustments(
    signals: CompatibilitySignal[],
    userProfile: UserProfile
  ): Promise<WeightAdjustment[]> {
    const adjustments: WeightAdjustment[] = [];
    
    // Agrupar sinais por dimensão
    const signalsByDimension = this.groupSignalsByDimension(signals);
    
    for (const [dimension, dimensionSignals] of Object.entries(signalsByDimension)) {
      const adjustment = await this.calculateDimensionAdjustment(
        dimension,
        dimensionSignals,
        userProfile
      );
      
      if (adjustment) {
        adjustments.push(adjustment);
      }
    }
    
    // Normalizar pesos para somar 1.0
    return this.normalizeAdjustments(adjustments, userProfile);
  }

  private groupSignalsByDimension(signals: CompatibilitySignal[]): Record<string, CompatibilitySignal[]> {
    const grouped: Record<string, CompatibilitySignal[]> = {};
    
    signals.forEach(signal => {
      if (!grouped[signal.dimension]) {
        grouped[signal.dimension] = [];
      }
      grouped[signal.dimension].push(signal);
    });
    
    return grouped;
  }

  private async calculateDimensionAdjustment(
    dimension: string,
    signals: CompatibilitySignal[],
    userProfile: UserProfile
  ): Promise<WeightAdjustment | null> {
    if (signals.length < this.learningParams.minSampleSize) {
      return null;
    }
    
    // Calcular performance atual da dimensão
    const performance = this.calculateDimensionPerformance(signals);
    
    // Calcular confiança baseada no número de amostras
    const confidence = this.calculateConfidence(signals.length);
    
    if (confidence < this.learningParams.confidenceThreshold) {
      return null;
    }
    
    // Calcular novo peso baseado na performance
    const currentWeight = userProfile.currentWeights[dimension];
    const targetWeight = this.calculateTargetWeight(currentWeight, performance, userProfile.learningStage);
    
    // Aplicar taxa de aprendizado
    const newWeight = currentWeight + (targetWeight - currentWeight) * this.learningParams.learningRate;
    
    // Validar limites
    const clampedWeight = Math.max(
      this.learningParams.minWeight,
      Math.min(this.learningParams.maxWeight, newWeight)
    );
    
    // Só retornar se houver mudança significativa
    if (Math.abs(clampedWeight - currentWeight) < 0.005) {
      return null;
    }
    
    return {
      dimension,
      oldWeight: currentWeight,
      newWeight: clampedWeight,
      confidence,
      reason: this.generateAdjustmentReason(performance, signals.length),
      evidence: this.generateEvidence(signals)
    };
  }

  private calculateDimensionPerformance(signals: CompatibilitySignal[]): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    signals.forEach(signal => {
      const outcomeScore = signal.outcome === 'positive' ? 1 : signal.outcome === 'negative' ? -1 : 0;
      const compatibilityBonus = signal.compatibility > 0.8 ? 0.2 : 0;
      const signalScore = (outcomeScore + compatibilityBonus) * signal.compatibility;
      
      totalScore += signalScore;
      totalWeight += 1;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateTargetWeight(currentWeight: number, performance: number, learningStage: string): number {
    // Ajustar agressividade baseada no estágio de aprendizado
    let aggressiveness = 1.0;
    
    switch (learningStage) {
      case 'initial':
        aggressiveness = 1.5; // Mais agressivo no início
        break;
      case 'learning':
        aggressiveness = 1.2;
        break;
      case 'optimized':
        aggressiveness = 0.8;
        break;
      case 'expert':
        aggressiveness = 0.5; // Mais conservador para usuários experientes
        break;
    }
    
    // Performance > 0: aumentar peso, Performance < 0: diminuir peso
    const adjustment = performance * aggressiveness * 0.1;
    return currentWeight + adjustment;
  }

  private calculateConfidence(sampleSize: number): number {
    // Função sigmóide para converter tamanho da amostra em confiança
    const maxSamples = 50;
    const normalizedSize = Math.min(sampleSize, maxSamples) / maxSamples;
    return 1 / (1 + Math.exp(-10 * (normalizedSize - 0.5)));
  }

  // ==================== APLICAÇÃO DE AJUSTES ====================

  private async applyAdjustments(
    adjustments: WeightAdjustment[],
    userProfile: UserProfile
  ): Promise<WeightAdjustment[]> {
    const appliedAdjustments: WeightAdjustment[] = [];
    
    // Aplicar ajustes individuais
    adjustments.forEach(adjustment => {
      userProfile.currentWeights[adjustment.dimension] = adjustment.newWeight;
      appliedAdjustments.push(adjustment);
    });
    
    // Normalizar para garantir que soma seja 1.0
    this.normalizeWeights(userProfile.currentWeights);
    
    // Atualizar metadados do perfil
    userProfile.lastAdjustment = new Date();
    this.updateLearningStage(userProfile);
    
    return appliedAdjustments;
  }

  private normalizeAdjustments(
    adjustments: WeightAdjustment[],
    userProfile: UserProfile
  ): WeightAdjustment[] {
    // Simular aplicação dos ajustes
    const tempWeights = { ...userProfile.currentWeights };
    adjustments.forEach(adj => {
      tempWeights[adj.dimension] = adj.newWeight;
    });
    
    // Normalizar
    this.normalizeWeights(tempWeights);
    
    // Atualizar ajustes com valores normalizados
    adjustments.forEach(adj => {
      adj.newWeight = tempWeights[adj.dimension];
    });
    
    return adjustments;
  }

  private normalizeWeights(weights: DimensionWeights): void {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / sum;
      });
    }
  }

  private updateLearningStage(userProfile: UserProfile): void {
    const interactionCount = userProfile.totalInteractions;
    
    if (interactionCount < 20) {
      userProfile.learningStage = 'initial';
    } else if (interactionCount < 100) {
      userProfile.learningStage = 'learning';
    } else if (interactionCount < 300) {
      userProfile.learningStage = 'optimized';
    } else {
      userProfile.learningStage = 'expert';
    }
  }

  // ==================== COMPATIBILIDADE ====================

  private calculateDimensionCompatibility(userValue: number, targetValue: number, dimension: string): number {
    // Diferentes tipos de compatibilidade baseados na dimensão
    switch (dimension) {
      case 'emotional_stability':
      case 'communication_style':
      case 'values_alignment':
        // Para essas dimensões, valores similares são melhores
        return this.calculateSimilarityCompatibility(userValue, targetValue);
      
      case 'social_energy':
      case 'independence_level':
        // Para essas dimensões, alguma diferença pode ser complementar
        return this.calculateComplementaryCompatibility(userValue, targetValue);
      
      case 'humor_style':
      case 'creativity_level':
        // Para essas dimensões, diversidade pode ser interessante
        return this.calculateDiversityCompatibility(userValue, targetValue);
      
      default:
        return this.calculateSimilarityCompatibility(userValue, targetValue);
    }
  }

  private calculateSimilarityCompatibility(value1: number, value2: number): number {
    const difference = Math.abs(value1 - value2);
    return Math.max(0, 1 - difference / 4); // Assumindo escala 1-5
  }

  private calculateComplementaryCompatibility(value1: number, value2: number): number {
    const average = (value1 + value2) / 2;
    const idealAverage = 3; // Valor médio na escala 1-5
    const difference = Math.abs(average - idealAverage);
    return Math.max(0, 1 - difference / 2);
  }

  private calculateDiversityCompatibility(value1: number, value2: number): number {
    const difference = Math.abs(value1 - value2);
    const idealDifference = 1.5; // Diferença ideal
    const deviation = Math.abs(difference - idealDifference);
    return Math.max(0, 1 - deviation / 2);
  }

  // ==================== UTILITÁRIOS ====================

  private getDimensionValue(profile: EmotionalProfile, dimension: string): number | null {
    // Mapear dimensões para valores do perfil emocional
    const mapping: Record<string, keyof EmotionalProfile> = {
      'emotional_stability': 'emotional_stability',
      'social_energy': 'social_energy',
      'adventure_seeking': 'adventure_seeking',
      // ... adicionar todos os mapeamentos
    };
    
    const profileKey = mapping[dimension];
    return profileKey ? profile[profileKey] : null;
  }

  private async getRelevantInteractions(userId: string): Promise<UserInteraction[]> {
    const analytics = await this.analytics.generateAnalytics(userId, this.learningParams.timeWindow);
    return await this.analytics.getInteractions(userId, this.learningParams.timeWindow);
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Implementar carregamento do perfil do usuário
    // Por enquanto, retornar perfil padrão
    return {
      userId,
      emotionalProfile: {} as EmotionalProfile,
      currentWeights: { ...this.defaultWeights },
      personalityType: 'unknown',
      learningStage: 'initial',
      lastAdjustment: new Date(),
      totalInteractions: 0
    };
  }

  private async getTargetProfile(targetUserId: string): Promise<EmotionalProfile | null> {
    // Implementar busca do perfil do usuário alvo
    return null;
  }

  private async saveUserProfile(profile: UserProfile): Promise<void> {
    // Implementar salvamento do perfil
    console.log('Salvando perfil:', profile.userId);
  }

  private generateAdjustmentReason(performance: number, sampleSize: number): string {
    if (performance > 0.3) {
      return `Dimensão demonstrou alta eficácia (${sampleSize} amostras)`;
    } else if (performance < -0.3) {
      return `Dimensão demonstrou baixa eficácia (${sampleSize} amostras)`;
    } else {
      return `Ajuste fino baseado em ${sampleSize} interações`;
    }
  }

  private generateEvidence(signals: CompatibilitySignal[]): AdjustmentEvidence[] {
    return signals.slice(0, 5).map(signal => ({
      type: signal.outcome,
      interaction: {} as UserInteraction, // Seria a interação real
      impact: signal.compatibility,
      timestamp: new Date()
    }));
  }

  // ==================== API PÚBLICA ====================

  public async getWeightExplanation(userId: string, dimension: string): Promise<string> {
    const userProfile = await this.getUserProfile(userId);
    const weight = userProfile.currentWeights[dimension];
    const defaultWeight = this.defaultWeights[dimension];
    
    if (weight > defaultWeight * 1.2) {
      return `Esta dimensão tem peso aumentado (+${((weight - defaultWeight) * 100).toFixed(1)}%) baseado no seu histórico de matches bem-sucedidos.`;
    } else if (weight < defaultWeight * 0.8) {
      return `Esta dimensão tem peso reduzido (-${((defaultWeight - weight) * 100).toFixed(1)}%) baseado no seu padrão de preferências.`;
    } else {
      return `Esta dimensão mantém peso padrão baseado em pesquisas de relacionamento.`;
    }
  }

  public async forceAdjustment(userId: string, dimension: string, newWeight: number): Promise<boolean> {
    const userProfile = await this.getUserProfile(userId);
    
    // Validar limites
    if (newWeight < this.learningParams.minWeight || newWeight > this.learningParams.maxWeight) {
      return false;
    }
    
    // Aplicar ajuste manual
    userProfile.currentWeights[dimension] = newWeight;
    this.normalizeWeights(userProfile.currentWeights);
    
    await this.saveUserProfile(userProfile);
    return true;
  }

  public getDimensionWeights(userId: string): Promise<DimensionWeights> {
    return this.getUserProfile(userId).then(profile => profile.currentWeights);
  }
}

// ==================== EXPORTS ====================

export const useWeightAdjustment = () => {
  const algorithm = WeightAdjustmentAlgorithm.getInstance();
  
  return {
    adjustWeights: algorithm.adjustWeights.bind(algorithm),
    getWeights: algorithm.getDimensionWeights.bind(algorithm),
    getExplanation: algorithm.getWeightExplanation.bind(algorithm),
    forceAdjustment: algorithm.forceAdjustment.bind(algorithm)
  };
};