// recommendation/match-score.ts - Sistema de Scoring Híbrido com Integração Emocional

import { 
  EnhancedMatchScore, 
  ExtendedUserProfile, 
  RecommendationWeights, 
  RecommendationContext,
  EnhancedDimensionScores,
  EnhancedScoreFactor,
  EmotionalProfile
} from '../../types/recommendation';
import { EmotionalMatchCalculator } from './emotional-match-calculator';
import { EmotionalProfileService } from '../../services/recommendation/emotional-profile-service';

/**
 * Calculadora principal de compatibilidade híbrida
 * Integra todas as dimensões: estilo, emocional, hobbies, localização, personalidade
 * Versão expandida que integra o novo sistema emocional
 */
export class MatchScoreCalculator {
  
  // Pesos padrão do algoritmo híbrido (atualizados com dimensão emocional)
  private static readonly DEFAULT_WEIGHTS: RecommendationWeights = {
    style: 0.25,          // 25% - Compatibilidade de estilo
    emotional: 0.25,      // 25% - Compatibilidade emocional (NOVO)
    hobby: 0.20,          // 20% - Compatibilidade de hobbies
    location: 0.15,       // 15% - Proximidade geográfica
    personality: 0.15,    // 15% - Compatibilidade de personalidade
    
    lastUpdated: new Date(),
    adaptationCount: 0,
    userSpecific: false
  };
  
  // =====================================================
  // MÉTODO PRINCIPAL DE CÁLCULO
  // =====================================================
  
  /**
   * Calcula score de compatibilidade híbrido entre dois usuários
   * Integra todas as dimensões incluindo a nova dimensão emocional
   */
  static calculateMatchScore(
    user: ExtendedUserProfile,
    target: ExtendedUserProfile,
    context?: RecommendationContext,
    customWeights?: Partial<RecommendationWeights>
  ): EnhancedMatchScore {
    
    const startTime = performance.now();
    const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };
    
    // =====================================================
    // CALCULAR SCORES POR DIMENSÃO
    // =====================================================
    
    // 1. Compatibilidade de Estilo (existente, mantido)
    const styleScore = this.calculateStyleCompatibility(
      user.stylePreferences,
      target.stylePreferences
    );
    
    // 2. Compatibilidade Emocional (NOVO)
    const emotionalResult = this.calculateEmotionalCompatibility(
      user.emotionalProfile,
      target.emotionalProfile,
      context
    );
    
    // 3. Compatibilidade de Hobbies (existente, melhorado)
    const hobbyScore = this.calculateHobbyCompatibility(
      user.stylePreferences.hobbies,
      target.stylePreferences.hobbies,
      user.activityLevel,
      target.activityLevel
    );
    
    // 4. Score de Localização (existente, mantido)
    const locationScore = this.calculateLocationScore(
      user.location,
      target.location,
      user.preferences.maxDistance
    );
    
    // 5. Compatibilidade de Personalidade (existente, expandido)
    const personalityScore = this.calculatePersonalityCompatibility(
      user.personalityProfile || this.vectorToPersonality(user.personalityVector),
      target.personalityProfile || this.vectorToPersonality(target.personalityVector),
      user.emotionalProfile,
      target.emotionalProfile
    );
    
    // =====================================================
    // COMBINAR SCORES COM PESOS
    // =====================================================
    
    const dimensionScores: EnhancedDimensionScores = {
      style: styleScore,
      emotional: emotionalResult.score,
      hobby: hobbyScore,
      location: locationScore,
      personality: personalityScore
    };
    
    const weightedScores: EnhancedDimensionScores = {
      style: styleScore * weights.style,
      emotional: emotionalResult.score * weights.emotional,
      hobby: hobbyScore * weights.hobby,
      location: locationScore * weights.location,
      personality: personalityScore * weights.personality
    };
    
    // Score geral
    const overallScore = Math.round(
      weightedScores.style +
      weightedScores.emotional +
      weightedScores.hobby +
      weightedScores.location +
      weightedScores.personality
    );
    
    // =====================================================
    // GERAR FATORES E EXPLICAÇÕES
    // =====================================================
    
    const allFactors = [
      ...this.generateStyleFactors(styleScore, user.stylePreferences, target.stylePreferences),
      ...emotionalResult.factors,
      ...this.generateHobbyFactors(hobbyScore, user.stylePreferences.hobbies, target.stylePreferences.hobbies),
      ...this.generateLocationFactors(locationScore, user.location, target.location),
      ...this.generatePersonalityFactors(personalityScore, user.personalityProfile, target.personalityProfile)
    ];
    
    const positiveFactors = allFactors.filter(f => f.impact > 0.1);
    const negativeFactors = allFactors.filter(f => f.impact < -0.1);
    const neutralFactors = allFactors.filter(f => Math.abs(f.impact) <= 0.1);
    
    // =====================================================
    // ANÁLISE DE QUALIDADE E CONFIANÇA
    // =====================================================
    
    const confidence = this.calculateConfidence(user, target, emotionalResult.confidence);
    const dataQuality = this.calculateDataQuality(user, target);
    
    // =====================================================
    // ANÁLISE DE RISCOS E OPORTUNIDADES
    // =====================================================
    
    const riskFactors = this.identifyRiskFactors(user, target, dimensionScores);
    const opportunities = this.identifyOpportunities(user, target, dimensionScores);
    
    // =====================================================
    // CONSTRUIR RESULTADO FINAL
    // =====================================================
    
    const processingTime = performance.now() - startTime;
    
    const matchScore: EnhancedMatchScore = {
      id: `match_${user.userId}_${target.userId}_${Date.now()}`,
      userId: user.userId,
      targetUserId: target.userId,
      
      overallScore: Math.max(0, Math.min(100, overallScore)),
      normalizedScore: this.normalizeScore(overallScore),
      percentile: 0, // Será calculado posteriormente com dados de outros matches
      
      dimensionScores,
      weightedScores,
      
      positiveFactors,
      negativeFactors,
      neutralFactors,
      
      emotionalExplanation: this.generateEmotionalExplanation(
        emotionalResult.compatibility,
        user.emotionalProfile,
        target.emotionalProfile
      ),
      
      confidence,
      dataQuality,
      algorithmCertainty: this.calculateAlgorithmCertainty(dimensionScores),
      
      riskFactors,
      opportunities,
      
      context: context || this.createDefaultContext(),
      algorithm: 'hybrid',
      
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      processingTime,
      
      isHighConfidence: confidence > 80,
      isEmotionallyCompatible: emotionalResult.score > 70,
      requiresEmotionalWork: this.requiresEmotionalWork(emotionalResult.compatibility),
      isExperimental: false,
      requiresReview: overallScore < 30 || confidence < 50
    };
    
    return matchScore;
  }
  
  // =====================================================
  // CÁLCULOS DE COMPATIBILIDADE POR DIMENSÃO
  // =====================================================
  
  /**
   * Calcula compatibilidade de estilo (método existente mantido)
   */
  private static calculateStyleCompatibility(
    userStyle: any,
    targetStyle: any
  ): number {
    if (!userStyle || !targetStyle) return 50;
    
    // Implementação existente da similaridade de Jaccard
    const categories = ['tenis', 'roupas', 'cores', 'sentimentos'];
    let totalSimilarity = 0;
    let validCategories = 0;
    
    categories.forEach(category => {
      if (userStyle[category] && targetStyle[category]) {
        const intersection = userStyle[category].filter((item: any) => 
          targetStyle[category].includes(item)
        );
        const union = [...new Set([...userStyle[category], ...targetStyle[category]])];
        const similarity = union.length > 0 ? (intersection.length / union.length) * 100 : 0;
        
        totalSimilarity += similarity;
        validCategories++;
      }
    });
    
    return validCategories > 0 ? Math.round(totalSimilarity / validCategories) : 50;
  }
  
  /**
   * Calcula compatibilidade emocional (NOVO)
   */
  private static calculateEmotionalCompatibility(
    userEmotional?: EmotionalProfile,
    targetEmotional?: EmotionalProfile,
    context?: RecommendationContext
  ): { score: number; factors: EnhancedScoreFactor[]; confidence: number; compatibility: any } {
    
    if (!userEmotional || !targetEmotional) {
      return {
        score: 60, // Score neutro para perfis incompletos
        factors: [{
          dimension: 'emotional',
          factor: 'incomplete_emotional_profiles',
          description: 'Perfis emocionais incompletos - recomenda-se completar questionário',
          impact: 0,
          weight: 0,
          contribution: 0,
          confidence: 30,
          evidence: [],
          recommendations: ['Complete o questionário emocional para melhor compatibilidade']
        }],
        confidence: 30,
        compatibility: null
      };
    }
    
    // Usar o calculador emocional especializado
    const emotionalContext = context?.emotionalContext ? {
      relationshipPhase: 'initial_attraction' as const,
      timeContext: this.mapTimeToContext(context.timeOfDay),
      currentMood: context.emotionalContext.energyLevel
    } : undefined;
    
    return EmotionalMatchCalculator.integrateWithMatchScore(
      userEmotional,
      targetEmotional,
      emotionalContext
    );
  }
  
  /**
   * Calcula compatibilidade de hobbies (melhorado com nível de atividade)
   */
  private static calculateHobbyCompatibility(
    userHobbies: number[],
    targetHobbies: number[],
    userActivity?: any,
    targetActivity?: any
  ): number {
    if (!userHobbies || !targetHobbies) return 50;
    
    // Cálculo base usando interseção
    const intersection = userHobbies.filter(hobby => targetHobbies.includes(hobby));
    const union = [...new Set([...userHobbies, ...targetHobbies])];
    let baseScore = union.length > 0 ? (intersection.length / union.length) * 100 : 0;
    
    // Ajustar baseado no nível de atividade se disponível
    if (userActivity && targetActivity) {
      const activityAlignment = this.calculateActivityAlignment(userActivity, targetActivity);
      baseScore = baseScore * 0.7 + activityAlignment * 0.3;
    }
    
    return Math.round(Math.max(0, Math.min(100, baseScore)));
  }
  
  /**
   * Calcula score de localização (método existente mantido)
   */
  private static calculateLocationScore(
    userLocation: any,
    targetLocation: any,
    maxDistance: number
  ): number {
    if (!userLocation || !targetLocation) return 0;
    
    // Calcular distância haversine
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    
    if (distance > maxDistance) return 0;
    
    // Decaimento exponencial
    const normalizedDistance = distance / maxDistance;
    return Math.round(Math.exp(-normalizedDistance * 3) * 100);
  }
  
  /**
   * Calcula compatibilidade de personalidade (expandido com contexto emocional)
   */
  private static calculatePersonalityCompatibility(
    userPersonality: any,
    targetPersonality: any,
    userEmotional?: EmotionalProfile,
    targetEmotional?: EmotionalProfile
  ): number {
    if (!userPersonality || !targetPersonality) return 50;
    
    // Cálculo base Big Five
    let baseScore = 0;
    let factors = 0;
    
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    
    traits.forEach(trait => {
      if (userPersonality[trait] !== undefined && targetPersonality[trait] !== undefined) {
        let similarity;
        
        // Para alguns traços, similaridade é melhor; para outros, complementaridade
        if (trait === 'neuroticism') {
          // Para neuroticismo, níveis baixos em ambos é melhor
          const avg = (userPersonality[trait] + targetPersonality[trait]) / 2;
          similarity = 100 - avg; // Quanto menor, melhor
        } else if (trait === 'conscientiousness') {
          // Para conscienciosidade, níveis altos em ambos é melhor
          const avg = (userPersonality[trait] + targetPersonality[trait]) / 2;
          similarity = avg;
        } else {
          // Para outros, similaridade moderada é ideal
          const diff = Math.abs(userPersonality[trait] - targetPersonality[trait]);
          similarity = 100 - diff;
        }
        
        baseScore += similarity;
        factors++;
      }
    });
    
    const personalityScore = factors > 0 ? baseScore / factors : 50;
    
    // Ajustar com contexto emocional se disponível
    if (userEmotional && targetEmotional) {
      const emotionalAlignment = this.calculateEmotionalPersonalityAlignment(
        userPersonality, targetPersonality, userEmotional, targetEmotional
      );
      return Math.round(personalityScore * 0.7 + emotionalAlignment * 0.3);
    }
    
    return Math.round(personalityScore);
  }
  
  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================
  
  private static calculateActivityAlignment(userActivity: any, targetActivity: any): number {
    if (!userActivity || !targetActivity) return 50;
    
    const dimensions = ['physical', 'social', 'intellectual', 'creative'];
    let totalAlignment = 0;
    let validDimensions = 0;
    
    dimensions.forEach(dim => {
      if (userActivity[dim] !== undefined && targetActivity[dim] !== undefined) {
        const diff = Math.abs(userActivity[dim] - targetActivity[dim]);
        const alignment = 100 - diff;
        totalAlignment += alignment;
        validDimensions++;
      }
    });
    
    return validDimensions > 0 ? totalAlignment / validDimensions : 50;
  }
  
  private static calculateEmotionalPersonalityAlignment(
    userPersonality: any,
    targetPersonality: any,
    userEmotional: EmotionalProfile,
    targetEmotional: EmotionalProfile
  ): number {
    // Verificar consistência entre personalidade e perfil emocional
    let alignmentScore = 50;
    
    // Extroversão vs energia social
    if (userPersonality.extraversion && userEmotional.socialEnergy) {
      const userConsistency = Math.abs(userPersonality.extraversion - userEmotional.socialEnergy);
      const targetConsistency = Math.abs(targetPersonality.extraversion - targetEmotional.socialEnergy);
      const avgConsistency = (userConsistency + targetConsistency) / 2;
      alignmentScore += (100 - avgConsistency) * 0.3;
    }
    
    // Neuroticismo vs estabilidade emocional
    if (userPersonality.neuroticism && userEmotional.emotionalStability) {
      const userStability = 100 - userPersonality.neuroticism;
      const targetStability = 100 - targetPersonality.neuroticism;
      const stabilityAlignment = 100 - Math.abs(userStability - targetStability);
      alignmentScore += stabilityAlignment * 0.4;
    }
    
    return Math.max(0, Math.min(100, alignmentScore));
  }
  
  private static mapTimeToContext(timeOfDay: string): 'morning' | 'afternoon' | 'evening' | 'late_night' | 'weekend' {
    switch (timeOfDay) {
      case 'morning': return 'morning';
      case 'afternoon': return 'afternoon';
      case 'evening': return 'evening';
      case 'night': return 'late_night';
      default: return 'afternoon';
    }
  }
  
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private static toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  private static vectorToPersonality(vector: number[]): any {
    if (!vector || vector.length < 5) {
      return {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50
      };
    }
    
    return {
      openness: vector[0] || 50,
      conscientiousness: vector[1] || 50,
      extraversion: vector[2] || 50,
      agreeableness: vector[3] || 50,
      neuroticism: vector[4] || 50
    };
  }
  
  private static normalizeScore(score: number): number {
    // Normalizar para escala mais amigável (evitar scores muito baixos)
    return Math.round(30 + (score * 0.7));
  }
  
  private static calculateConfidence(user: any, target: any, emotionalConfidence: number): number {
    let totalConfidence = 0;
    let factors = 0;
    
    // Confiança baseada na completude dos perfis
    if (user.stylePreferences) {
      totalConfidence += user.stylePreferences.confidence || 70;
      factors++;
    }
    
    if (user.emotionalProfile) {
      totalConfidence += emotionalConfidence;
      factors++;
    }
    
    if (target.stylePreferences) {
      totalConfidence += target.stylePreferences.confidence || 70;
      factors++;
    }
    
    if (target.emotionalProfile) {
      totalConfidence += emotionalConfidence;
      factors++;
    }
    
    return factors > 0 ? Math.round(totalConfidence / factors) : 50;
  }
  
  private static calculateDataQuality(user: any, target: any): number {
    let qualityScore = 0;
    let factors = 0;
    
    // Qualidade dos dados do usuário
    if (user.emotionalProfile?.dataQuality) {
      qualityScore += user.emotionalProfile.dataQuality.consistencyScore;
      factors++;
    }
    
    // Qualidade dos dados do alvo
    if (target.emotionalProfile?.dataQuality) {
      qualityScore += target.emotionalProfile.dataQuality.consistencyScore;
      factors++;
    }
    
    // Qualidade baseada na completude
    const userCompleteness = this.calculateProfileCompleteness(user);
    const targetCompleteness = this.calculateProfileCompleteness(target);
    
    qualityScore += (userCompleteness + targetCompleteness) / 2;
    factors++;
    
    return factors > 0 ? Math.round(qualityScore / factors) : 60;
  }
  
  private static calculateProfileCompleteness(profile: any): number {
    let completeness = 0;
    let totalFields = 0;
    
    // Campos básicos
    if (profile.age) completeness += 20;
    if (profile.location) completeness += 20;
    if (profile.stylePreferences) completeness += 30;
    if (profile.emotionalProfile) completeness += 30;
    
    return completeness;
  }
  
  private static calculateAlgorithmCertainty(scores: EnhancedDimensionScores): number {
    const scoresArray = Object.values(scores).filter(s => s !== undefined);
    
    if (scoresArray.length === 0) return 50;
    
    // Maior certeza quando os scores são consistentes
    const mean = scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length;
    const variance = scoresArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scoresArray.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Menor desvio padrão = maior certeza
    const certainty = Math.max(50, 100 - standardDeviation * 2);
    
    return Math.round(certainty);
  }
  
  private static requiresEmotionalWork(compatibility: any): boolean {
    if (!compatibility) return false;
    
    return (
      compatibility.attachmentCompatibility < 60 ||
      compatibility.communicationCompatibility < 50 ||
      compatibility.stabilityCompatibility < 55
    );
  }
  
  private static createDefaultContext(): RecommendationContext {
    const now = new Date();
    return {
      timestamp: now,
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: this.getDayOfWeek(now),
      season: this.getSeason(now),
      sessionType: 'casual_browsing',
      sessionDuration: 0,
      interactionHistory: {
        totalRecommendationsViewed: 0,
        totalLikes: 0,
        totalDislikes: 0,
        totalMatches: 0,
        averageTimePerProfile: 30,
        recentPatterns: []
      }
    };
  }
  
  private static getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }
  
  private static getDayOfWeek(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()] as any;
  }
  
  private static getSeason(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }
  
  // =====================================================
  // GERAÇÃO DE FATORES (PLACEHOLDERS - IMPLEMENTAR DETALHADAMENTE)
  // =====================================================
  
  private static generateStyleFactors(score: number, userStyle: any, targetStyle: any): EnhancedScoreFactor[] {
    return []; // Implementar baseado na análise de estilo
  }
  
  private static generateHobbyFactors(score: number, userHobbies: number[], targetHobbies: number[]): EnhancedScoreFactor[] {
    return []; // Implementar baseado na análise de hobbies
  }
  
  private static generateLocationFactors(score: number, userLocation: any, targetLocation: any): EnhancedScoreFactor[] {
    return []; // Implementar baseado na análise de localização
  }
  
  private static generatePersonalityFactors(score: number, userPersonality: any, targetPersonality: any): EnhancedScoreFactor[] {
    return []; // Implementar baseado na análise de personalidade
  }
  
  private static generateEmotionalExplanation(compatibility: any, userEmotional?: EmotionalProfile, targetEmotional?: EmotionalProfile): any {
    if (!compatibility || !userEmotional || !targetEmotional) {
      return {
        summary: 'Análise emocional limitada devido à falta de dados completos',
        keyStrengths: [],
        keyAreas: ['Complete o perfil emocional para análise detalhada'],
        energyAnalysis: 'Dados insuficientes',
        opennessAnalysis: 'Dados insuficientes',
        stabilityAnalysis: 'Dados insuficientes',
        socialAnalysis: 'Dados insuficientes',
        attachmentAnalysis: 'Dados insuficientes',
        shortTermOutlook: 'Análise limitada',
        longTermOutlook: 'Análise limitada',
        communicationTips: ['Complete o questionário emocional'],
        relationshipAdvice: ['Conheçam-se melhor primeiro'],
        warningSignsToWatch: []
      };
    }
    
    return {
      summary: compatibility.strengths.join(', ') || 'Compatibilidade moderada',
      keyStrengths: compatibility.strengths,
      keyAreas: compatibility.challenges,
      energyAnalysis: `Compatibilidade de energia: ${compatibility.energyCompatibility}%`,
      opennessAnalysis: `Compatibilidade de abertura: ${compatibility.opennessCompatibility}%`,
      stabilityAnalysis: `Compatibilidade de estabilidade: ${compatibility.stabilityCompatibility}%`,
      socialAnalysis: `Compatibilidade social: ${compatibility.socialCompatibility}%`,
      attachmentAnalysis: `Compatibilidade de apego: ${compatibility.attachmentCompatibility}%`,
      shortTermOutlook: 'Potencial para boa conexão inicial',
      longTermOutlook: 'Compatibilidade favorável para relacionamento duradouro',
      communicationTips: compatibility.recommendations,
      relationshipAdvice: [
        'Sejam pacientes no processo de conhecer um ao outro',
        'Comuniquem abertamente sobre expectativas'
      ],
      warningSignsToWatch: []
    };
  }
  
  private static identifyRiskFactors(user: any, target: any, scores: any): any[] {
    return []; // Implementar análise de riscos
  }
  
  private static identifyOpportunities(user: any, target: any, scores: any): any[] {
    return []; // Implementar análise de oportunidades
  }
}

export default MatchScoreCalculator;