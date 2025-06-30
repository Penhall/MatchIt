// server/services/recommendation/enhanced-match-score-calculator.js - Algoritmo híbrido com compatibilidade emocional
import { logger } from '../../middleware/logger.js';
import { emotionalProfileService } from './emotional-profile-service.js';

// ==============================================
// CALCULADORA DE SCORE HÍBRIDA MELHORADA (FASE 1)
// ==============================================

/**
 * Calculadora de compatibilidade híbrida integrada com sistema emocional
 * Combina: Estilo + Emocional + Hobbies + Localização + Personalidade
 */
export class EnhancedMatchScoreCalculator {
  
  constructor() {
    this.algorithmVersion = '1.1.0'; // Atualizado para incluir sistema emocional
    this.logger = logger;
  }

  // ==============================================
  // PESOS DO ALGORITMO HÍBRIDO (FASE 1)
  // ==============================================

  static DEFAULT_WEIGHTS = { // Removido 'readonly'
    // Pesos atualizados com dimensão emocional
    styleCompatibility: 0.20,      // 20% - Compatibilidade de estilo (reduzido)
    emotionalCompatibility: 0.25,  // 25% - Compatibilidade emocional (NOVO)
    hobbyAlignment: 0.20,          // 20% - Compatibilidade de hobbies
    locationScore: 0.15,           // 15% - Proximidade geográfica
    personalityMatch: 0.15,        // 15% - Compatibilidade de personalidade
    moodSync: 0.05,               // 5% - Sincronização de humor atual
    
    lastUpdated: new Date(),
    version: '1.1.0'
  };

  // ==============================================
  // MÉTODO PRINCIPAL DE CÁLCULO (FASE 1)
  // ==============================================

  /**
   * Calcula score de compatibilidade híbrido incluindo dimensão emocional
   */
  async calculateEnhancedMatchScore(userProfile, targetProfile, context = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`[EnhancedMatchScore] Calculando compatibilidade híbrida entre usuários`);
      
      // Usar pesos customizados ou padrão
      const weights = { ...EnhancedMatchScoreCalculator.DEFAULT_WEIGHTS, ...context.customWeights };
      
      // ==============================================
      // CALCULAR SCORES POR DIMENSÃO
      // ==============================================
      
      // 1. Compatibilidade de Estilo (existente, mantido)
      const styleScore = this.calculateStyleCompatibility(
        userProfile.stylePreferences,
        targetProfile.stylePreferences
      );
      
      // 2. Compatibilidade Emocional (NOVA - FASE 1)
      const emotionalResult = await this.calculateEmotionalCompatibility(
        userProfile.emotionalProfile,
        targetProfile.emotionalProfile,
        context
      );
      
      // 3. Compatibilidade de Hobbies (melhorado)
      const hobbyScore = this.calculateHobbyAlignment(
        userProfile.stylePreferences?.hobbies || [],
        targetProfile.stylePreferences?.hobbies || [],
        userProfile.activityLevel || 50,
        targetProfile.activityLevel || 50
      );
      
      // 4. Score de Localização (existente, mantido)
      const locationScore = this.calculateLocationScore(
        userProfile.location,
        targetProfile.location,
        userProfile.preferences?.maxDistance || 50
      );
      
      // 5. Match de Personalidade (existente, mantido)
      const personalityScore = this.calculatePersonalityMatch(
        userProfile.personalityVector || [],
        targetProfile.personalityVector || []
      );
      
      // 6. Sincronização de Humor (NOVA - FASE 1)
      const moodScore = this.calculateMoodSync(
        userProfile.emotionalProfile?.currentMoodProfile,
        targetProfile.emotionalProfile?.currentMoodProfile
      );
      
      // ==============================================
      // SCORE FINAL PONDERADO
      // ==============================================
      
      const dimensionScores = {
        styleCompatibility: styleScore,
        emotionalCompatibility: emotionalResult.score,
        hobbyAlignment: hobbyScore,
        locationScore: locationScore,
        personalityMatch: personalityScore,
        moodSync: moodScore
      };
      
      // Calcular score geral
      const overallScore = Math.round(
        Object.entries(dimensionScores).reduce((sum, [dimension, score]) => {
          return sum + (score * weights[dimension]);
        }, 0)
      );
      
      // ==============================================
      // GERAR EXPLICAÇÕES E INSIGHTS
      // ==============================================
      
      const explanation = this.generateEnhancedExplanation(dimensionScores, overallScore, emotionalResult);
      const strengths = this.identifyRelationshipStrengths(dimensionScores, emotionalResult);
      const challenges = this.identifyPotentialChallenges(dimensionScores, emotionalResult);
      const recommendations = this.generateRelationshipRecommendations(dimensionScores, userProfile, targetProfile);
      
      // Calcular confiança e qualidade
      const confidence = this.calculateMatchConfidence(dimensionScores, userProfile, targetProfile);
      const dataQuality = this.assessDataQuality(userProfile, targetProfile);
      
      // ==============================================
      // RESULTADO FINAL
      // ==============================================
      
      const enhancedMatchScore = {
        userId: userProfile.userId || userProfile.id,
        targetUserId: targetProfile.userId || targetProfile.id,
        overallScore,
        
        // Breakdown detalhado
        breakdown: dimensionScores,
        
        // Detalhes emocionais (NOVO)
        emotionalDetails: {
          compatibility: emotionalResult,
          moodAlignment: moodScore,
          communicationSync: emotionalResult.breakdown?.communicationSync || 50,
          empathyMatch: emotionalResult.breakdown?.empathyMatch || 50
        },
        
        // Explicações e recomendações
        explanation,
        strengths,
        challenges,
        recommendations,
        
        // Metadados
        confidence,
        dataQuality,
        algorithm: `enhanced_hybrid_${this.algorithmVersion}`,
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        processingTime: Date.now() - startTime,
        
        // Flags especiais (FASE 1)
        isEmotionallyCompatible: emotionalResult.score > 70,
        hasHighEmotionalPotential: emotionalResult.score > 85,
        requiresEmotionalWork: emotionalResult.score < 50,
        isHighConfidence: confidence > 80,
        isExperimental: false
      };
      
      this.logger.info(`[EnhancedMatchScore] Score calculado: ${overallScore}% (emocional: ${emotionalResult.score}%) - ${Date.now() - startTime}ms`);
      
      return enhancedMatchScore;
      
    } catch (error) {
      this.logger.error(`[EnhancedMatchScore] Erro ao calcular: ${error.message}`, error);
      
      // Fallback para algoritmo básico em caso de erro
      return this.calculateBasicFallbackScore(userProfile, targetProfile);
    }
  }

  // ==============================================
  // CÁLCULOS DE COMPATIBILIDADE POR DIMENSÃO
  // ==============================================

  /**
   * Calcula compatibilidade de estilo (método existente mantido)
   */
  calculateStyleCompatibility(userStyle, targetStyle) {
    if (!userStyle || !targetStyle) return 50;
    
    const categories = ['tenis', 'roupas', 'cores', 'sentimentos'];
    let totalSimilarity = 0;
    let validCategories = 0;
    
    categories.forEach(category => {
      if (userStyle[category] && targetStyle[category]) {
        const intersection = userStyle[category].filter(item => 
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
   * Calcula compatibilidade emocional (NOVO - FASE 1)
   * Integra com o EmotionalProfileService
   */
  async calculateEmotionalCompatibility(userEmotional, targetEmotional, context = {}) {
    try {
      // Se algum dos perfis emocionais não existe, retornar score neutro
      if (!userEmotional || !targetEmotional) {
        return {
          score: 50,
          breakdown: {
            emotionalHarmony: 50,
            communicationSync: 50,
            activityAlignment: 50,
            moodCompatibility: 50,
            empathyMatch: 50
          },
          explanation: ['Compatibilidade emocional não disponível - perfis incompletos'],
          confidence: 30
        };
      }
      
      // Usar o serviço especializado para cálculo detalhado
      const compatibilityResult = await emotionalProfileService.calculateEmotionalCompatibility(
        { emotionalProfile: userEmotional },
        { emotionalProfile: targetEmotional },
        context
      );
      
      return {
        score: compatibilityResult.overallScore,
        breakdown: compatibilityResult.breakdown,
        explanation: compatibilityResult.explanation,
        strengths: compatibilityResult.strengths,
        challenges: compatibilityResult.challenges,
        recommendations: compatibilityResult.recommendations,
        confidence: compatibilityResult.confidence
      };
      
    } catch (error) {
      this.logger.warn(`[EnhancedMatchScore] Erro no cálculo emocional: ${error.message}`);
      
      // Fallback para cálculo básico se serviço falhar
      return this.calculateBasicEmotionalCompatibility(userEmotional, targetEmotional);
    }
  }

  /**
   * Calcula alinhamento de hobbies (melhorado)
   */
  calculateHobbyAlignment(userHobbies, targetHobbies, userActivity, targetActivity) {
    if (!Array.isArray(userHobbies) || !Array.isArray(targetHobbies)) {
      return 50;
    }
    
    // Compatibilidade de hobbies (60%)
    const commonHobbies = userHobbies.filter(hobby => targetHobbies.includes(hobby));
    const totalHobbies = [...new Set([...userHobbies, ...targetHobbies])];
    const hobbyScore = totalHobbies.length > 0 ? (commonHobbies.length / totalHobbies.length) * 100 : 0;
    
    // Compatibilidade de nível de atividade (40%)
    const activityDiff = Math.abs(userActivity - targetActivity);
    const activityScore = Math.max(0, 100 - (activityDiff * 2));
    
    return Math.round((hobbyScore * 0.6) + (activityScore * 0.4));
  }

  /**
   * Calcula score de localização (método existente mantido)
   */
  calculateLocationScore(userLocation, targetLocation, maxDistance) {
    if (!userLocation || !targetLocation) return 50;
    
    const distance = this.calculateDistance(
      userLocation.lat, userLocation.lng,
      targetLocation.lat, targetLocation.lng
    );
    
    if (distance > maxDistance) return 0;
    
    // Score exponencial decrescente
    return Math.round(Math.exp(-distance / (maxDistance * 0.5)) * 100);
  }

  /**
   * Calcula match de personalidade (método existente mantido)
   */
  calculatePersonalityMatch(userVector, targetVector) {
    if (!Array.isArray(userVector) || !Array.isArray(targetVector) || 
        userVector.length === 0 || targetVector.length === 0) {
      return 50;
    }
    
    // Similaridade de cosseno
    const dotProduct = userVector.reduce((sum, val, i) => sum + (val * (targetVector[i] || 0)), 0);
    const magnitudeUser = Math.sqrt(userVector.reduce((sum, val) => sum + (val * val), 0));
    const magnitudeTarget = Math.sqrt(targetVector.reduce((sum, val) => sum + (val * val), 0));
    
    if (magnitudeUser === 0 || magnitudeTarget === 0) return 50;
    
    const similarity = dotProduct / (magnitudeUser * magnitudeTarget);
    return Math.round(((similarity + 1) / 2) * 100); // Normalizar para 0-100
  }

  /**
   * Calcula sincronização de humor (NOVA - FASE 1)
   */
  calculateMoodSync(userMood, targetMood) {
    if (!userMood || !targetMood) return 50;
    
    // Verificar se os humores estão válidos
    const now = new Date();
    const userMoodValid = new Date(userMood.validUntil) > now;
    const targetMoodValid = new Date(targetMood.validUntil) > now;
    
    if (!userMoodValid || !targetMoodValid) {
      return 40; // Penalizar humores expirados
    }
    
    // Compatibilidade de energia (40%)
    const energyDiff = Math.abs(userMood.energyLevel - targetMood.energyLevel);
    const energyScore = Math.max(0, 100 - (energyDiff * 1.5));
    
    // Compatibilidade social (30%)
    const socialDiff = Math.abs(userMood.socialDesire - targetMood.socialDesire);
    const socialScore = Math.max(0, 100 - (socialDiff * 1.2));
    
    // Compatibilidade romântica (30%)
    const romanticDiff = Math.abs(userMood.romanticMood - targetMood.romanticMood);
    const romanticScore = Math.max(0, 100 - (romanticDiff * 1.0));
    
    return Math.round((energyScore * 0.4) + (socialScore * 0.3) + (romanticScore * 0.3));
  }

  // ==============================================
  // FUNÇÕES DE ANÁLISE E INSIGHTS
  // ==============================================

  /**
   * Gera explicações melhoradas incluindo aspectos emocionais
   */
  generateEnhancedExplanation(dimensionScores, overallScore, emotionalResult) {
    const explanations = [];
    
    // Explicação geral
    if (overallScore >= 85) {
      explanations.push('🌟 Excelente compatibilidade geral com forte potencial para conexão profunda');
    } else if (overallScore >= 70) {
      explanations.push('💕 Boa compatibilidade com várias áreas de afinidade');
    } else if (overallScore >= 50) {
      explanations.push('🤝 Compatibilidade moderada com potencial de crescimento');
    } else {
      explanations.push('🌱 Compatibilidade desafiadora que requer comunicação e compreensão');
    }
    
    // Explicações específicas por dimensão
    if (dimensionScores.emotionalCompatibility >= 80) {
      explanations.push('🎭 Forte harmonia emocional - vocês se entendem profundamente');
    } else if (dimensionScores.emotionalCompatibility < 40) {
      explanations.push('💭 Estilos emocionais diferentes - comunicação será fundamental');
    }
    
    if (dimensionScores.styleCompatibility >= 75) {
      explanations.push('👗 Estilos de vida muito compatíveis');
    }
    
    if (dimensionScores.moodSync >= 70) {
      explanations.push('⚡ Energia e humor atuais bem alinhados');
    }
    
    return explanations;
  }

  /**
   * Identifica pontos fortes do relacionamento
   */
  identifyRelationshipStrengths(dimensionScores, emotionalResult) {
    const strengths = [];
    
    Object.entries(dimensionScores).forEach(([dimension, score]) => {
      if (score >= 75) {
        const labels = {
          styleCompatibility: 'Estilos de vida compatíveis',
          emotionalCompatibility: 'Conexão emocional forte',
          hobbyAlignment: 'Interesses em comum',
          locationScore: 'Proximidade geográfica',
          personalityMatch: 'Personalidades complementares',
          moodSync: 'Humor e energia alinhados'
        };
        
        strengths.push(labels[dimension] || dimension);
      }
    });
    
    // Adicionar forças específicas do perfil emocional
    if (emotionalResult.strengths) {
      strengths.push(...emotionalResult.strengths);
    }
    
    return strengths;
  }

  /**
   * Identifica desafios potenciais
   */
  identifyPotentialChallenges(dimensionScores, emotionalResult) {
    const challenges = [];
    
    Object.entries(dimensionScores).forEach(([dimension, score]) => {
      if (score < 40) {
        const labels = {
          styleCompatibility: 'Estilos de vida diferentes',
          emotionalCompatibility: 'Necessita trabalho emocional',
          hobbyAlignment: 'Poucos interesses em comum',
          locationScore: 'Distância geográfica',
          personalityMatch: 'Personalidades contrastantes',
          moodSync: 'Energia e humor desalinhados'
        };
        
        challenges.push(labels[dimension] || dimension);
      }
    });
    
    // Adicionar desafios específicos do perfil emocional
    if (emotionalResult.challenges) {
      challenges.push(...emotionalResult.challenges);
    }
    
    return challenges;
  }

  /**
   * Gera recomendações para o relacionamento
   */
  generateRelationshipRecommendations(dimensionScores, userProfile, targetProfile) {
    const recommendations = [];
    
    // Recomendações baseadas em pontos fracos
    if (dimensionScores.emotionalCompatibility < 60) {
      recommendations.push('Dediquem tempo para conversas profundas sobre sentimentos e valores');
      recommendations.push('Pratiquem empatia e escuta ativa nas interações');
    }
    
    if (dimensionScores.hobbyAlignment < 50) {
      recommendations.push('Explorem novos hobbies juntos para descobrir interesses em comum');
    }
    
    if (dimensionScores.moodSync < 60) {
      recommendations.push('Comuniquem abertamente sobre seus estados emocionais');
      recommendations.push('Respeitem os momentos em que estão em energias diferentes');
    }
    
    // Recomendações baseadas em pontos fortes
    if (dimensionScores.emotionalCompatibility > 80) {
      recommendations.push('Aproveitem a conexão emocional forte para construir intimidade');
    }
    
    if (dimensionScores.styleCompatibility > 75) {
      recommendations.push('Planejem atividades que combinem com seus estilos similares');
    }
    
    return recommendations;
  }

  // ==============================================
  // FUNÇÕES DE QUALIDADE E CONFIANÇA
  // ==============================================

  /**
   * Calcula confiança do match baseado na qualidade dos dados
   */
  calculateMatchConfidence(dimensionScores, userProfile, targetProfile) {
    let confidenceScore = 100;
    
    // Penalizar se perfis incompletos
    if (!userProfile.emotionalProfile) confidenceScore -= 20;
    if (!targetProfile.emotionalProfile) confidenceScore -= 20;
    
    if (!userProfile.stylePreferences) confidenceScore -= 15;
    if (!targetProfile.stylePreferences) confidenceScore -= 15;
    
    // Bonificar consistência nos scores
    const scores = Object.values(dimensionScores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    // Baixa variância = maior confiança
    const consistencyBonus = Math.max(0, 20 - (variance / 5));
    confidenceScore += consistencyBonus;
    
    return Math.min(95, Math.max(30, Math.round(confidenceScore)));
  }

  /**
   * Avalia qualidade dos dados dos perfis
   */
  assessDataQuality(userProfile, targetProfile) {
    const assessProfile = (profile) => {
      let quality = 0;
      
      // Dados básicos (20%)
      if (profile.age && profile.gender && profile.location) quality += 20;
      
      // Preferências de estilo (30%)
      if (profile.stylePreferences) {
        const categories = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'];
        const filledCategories = categories.filter(cat => 
          profile.stylePreferences[cat] && profile.stylePreferences[cat].length > 0
        ).length;
        quality += (filledCategories / categories.length) * 30;
      }
      
      // Perfil emocional (40%)
      if (profile.emotionalProfile && profile.emotionalProfile.metadata?.completionStatus?.completed) {
        quality += 40;
      }
      
      // Dados de personalidade (10%)
      if (profile.personalityVector && profile.personalityVector.length > 0) quality += 10;
      
      return Math.round(quality);
    };
    
    const userQuality = assessProfile(userProfile);
    const targetQuality = assessProfile(targetProfile);
    
    return {
      userProfile: userQuality,
      targetProfile: targetQuality,
      average: Math.round((userQuality + targetQuality) / 2),
      isHighQuality: (userQuality + targetQuality) / 2 > 75
    };
  }

  // ==============================================
  // FUNÇÕES AUXILIARES
  // ==============================================

  /**
   * Calcula distância entre coordenadas (Haversine)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Cálculo emocional básico (fallback)
   */
  calculateBasicEmotionalCompatibility(userEmotional, targetEmotional) {
    if (!userEmotional || !targetEmotional) {
      return { score: 50, breakdown: {}, explanation: ['Dados emocionais insuficientes'], confidence: 20 };
    }
    
    // Comparação básica de intensidade emocional
    const intensityDiff = Math.abs((userEmotional.emotionalIntensity || 50) - (targetEmotional.emotionalIntensity || 50));
    const intensityScore = Math.max(0, 100 - (intensityDiff * 1.5));
    
    // Comparação de estabilidade
    const stabilityDiff = Math.abs((userEmotional.emotionalStability || 50) - (targetEmotional.emotionalStability || 50));
    const stabilityScore = Math.max(0, 100 - (stabilityDiff * 1.2));
    
    const basicScore = Math.round((intensityScore + stabilityScore) / 2);
    
    return {
      score: basicScore,
      breakdown: { intensityMatch: intensityScore, stabilityMatch: stabilityScore },
      explanation: ['Compatibilidade emocional básica calculada'],
      confidence: 40
    };
  }

  /**
   * Score de fallback em caso de erro
   */
  calculateBasicFallbackScore(userProfile, targetProfile) {
    this.logger.warn('[EnhancedMatchScore] Usando score de fallback devido a erro');
    
    // Cálculo muito básico apenas com estilo
    const styleScore = this.calculateStyleCompatibility(
      userProfile.stylePreferences, 
      targetProfile.stylePreferences
    );
    
    return {
      userId: userProfile.userId || userProfile.id,
      targetUserId: targetProfile.userId || targetProfile.id,
      overallScore: styleScore,
      breakdown: { styleCompatibility: styleScore },
      explanation: ['Score básico - dados limitados'],
      strengths: [],
      challenges: ['Dados insuficientes para análise completa'],
      recommendations: ['Complete seu perfil para melhores recomendações'],
      confidence: 30,
      dataQuality: { average: 30 },
      algorithm: 'basic_fallback',
      calculatedAt: new Date(),
      isEmotionallyCompatible: false,
      hasHighEmotionalPotential: false,
      isHighConfidence: false,
      isExperimental: true
    };
  }
}

// ==============================================
// INSTÂNCIA SINGLETON
// ==============================================

export const enhancedMatchScoreCalculator = new EnhancedMatchScoreCalculator();
export default enhancedMatchScoreCalculator;
