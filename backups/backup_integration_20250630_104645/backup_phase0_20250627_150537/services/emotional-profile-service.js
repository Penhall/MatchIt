// server/services/recommendation/emotional-profile-service.js - Serviço de processamento emocional
import { logger } from '../../middleware/logger.js';

// ==============================================
// CLASSE PRINCIPAL DO SERVIÇO EMOCIONAL
// ==============================================

/**
 * Serviço completo para processamento de perfis emocionais
 * Responsável por análise, geração de insights e cálculo de compatibilidade
 */
export class EmotionalProfileService {
  
  constructor() {
    this.algorithmVersion = '1.0.0';
    this.logger = logger;
  }

  // ==============================================
  // ANÁLISE DE QUESTIONÁRIO
  // ==============================================

  /**
   * Processa respostas do questionário emocional e gera perfil
   */
  async generateEmotionalProfile(userId, questionnaireResponses) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`[EmotionalService] Gerando perfil emocional para usuário ${userId}`);
      
      // Validar respostas
      const validation = this.validateQuestionnaireResponses(questionnaireResponses);
      if (!validation.isValid) {
        throw new Error(`Respostas inválidas: ${validation.errors.join(', ')}`);
      }

      // Analisar respostas por categoria
      const analysis = {
        dominantEmotions: this.analyzeDominantEmotions(questionnaireResponses),
        emotionalIntensity: this.calculateEmotionalIntensity(questionnaireResponses),
        emotionalStability: this.calculateEmotionalStability(questionnaireResponses),
        socialEnergy: this.calculateSocialEnergy(questionnaireResponses),
        empathyLevel: this.calculateEmpathyLevel(questionnaireResponses),
        communicationStyle: this.determineCommunicationStyle(questionnaireResponses),
        activityPreferences: this.analyzeActivityPreferences(questionnaireResponses),
        currentMoodProfile: this.generateCurrentMoodProfile(questionnaireResponses)
      };

      // Gerar insights
      const insights = this.generateEmotionalInsights(analysis);
      
      // Calcular scores de qualidade
      const qualityMetrics = this.calculateQualityMetrics(questionnaireResponses, analysis);
      
      // Construir perfil final
      const emotionalProfile = {
        ...analysis,
        metadata: {
          profileId: `emotional_${userId}_${Date.now()}`,
          userId,
          version: 1,
          completedAt: new Date(),
          lastUpdatedAt: new Date(),
          completionStatus: {
            completed: true,
            sectionsCompleted: 5,
            totalSections: 5,
            completionPercentage: 100
          },
          dataSource: 'questionnaire',
          reliabilityScore: qualityMetrics.reliabilityScore,
          qualityFlags: qualityMetrics.qualityFlags
        }
      };

      this.logger.info(`[EmotionalService] Perfil gerado com sucesso para usuário ${userId}, confiabilidade: ${qualityMetrics.reliabilityScore}%`);

      return {
        emotionalProfile,
        insights,
        recommendations: this.generateRecommendations(emotionalProfile),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error(`[EmotionalService] Erro ao gerar perfil: ${error.message}`);
      throw error;
    }
  }

  // ==============================================
  // ANÁLISES ESPECÍFICAS POR DIMENSÃO
  // ==============================================

  /**
   * Analisa emoções dominantes baseado nas respostas
   */
  analyzeDominantEmotions(responses) {
    const emotionScores = {};
    
    // Definir mapeamento de perguntas para emoções
    const emotionMapping = {
      'joy': ['q_happiness', 'q_celebration', 'q_optimism'],
      'excitement': ['q_enthusiasm', 'q_adventure', 'q_energy'],
      'contentment': ['q_satisfaction', 'q_peace', 'q_fulfillment'],
      'serenity': ['q_calmness', 'q_meditation', 'q_tranquility'],
      'confidence': ['q_self_assurance', 'q_leadership', 'q_certainty'],
      'love': ['q_affection', 'q_caring', 'q_intimacy'],
      'empathy': ['q_understanding', 'q_compassion', 'q_sensitivity'],
      'curiosity': ['q_learning', 'q_exploration', 'q_questioning']
    };

    // Calcular score para cada emoção
    Object.entries(emotionMapping).forEach(([emotion, questionIds]) => {
      let totalScore = 0;
      let questionCount = 0;

      questionIds.forEach(qId => {
        const response = responses.find(r => r.questionId === qId);
        if (response) {
          // Normalizar resposta para 0-100
          const normalizedScore = this.normalizeResponseValue(response.answer, response.questionType);
          totalScore += normalizedScore;
          questionCount++;
        }
      });

      if (questionCount > 0) {
        emotionScores[emotion] = Math.round(totalScore / questionCount);
      }
    });

    // Converter para formato EmotionalDimension
    const dominantEmotions = Object.entries(emotionScores)
      .map(([type, score]) => ({
        type,
        intensity: score,
        frequency: this.calculateEmotionFrequency(type, responses),
        preference: this.calculateEmotionPreference(type, responses)
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 5); // Top 5 emoções

    return dominantEmotions;
  }

  /**
   * Calcula intensidade emocional geral
   */
  calculateEmotionalIntensity(responses) {
    const intensityQuestions = ['q_emotion_strength', 'q_reaction_intensity', 'q_feeling_depth'];
    
    let totalIntensity = 0;
    let questionCount = 0;

    intensityQuestions.forEach(qId => {
      const response = responses.find(r => r.questionId === qId);
      if (response) {
        totalIntensity += this.normalizeResponseValue(response.answer, response.questionType);
        questionCount++;
      }
    });

    return questionCount > 0 ? Math.round(totalIntensity / questionCount) : 50;
  }

  /**
   * Calcula estabilidade emocional
   */
  calculateEmotionalStability(responses) {
    const stabilityQuestions = ['q_mood_swings', 'q_emotional_control', 'q_stress_management'];
    
    let stabilitySum = 0;
    let questionCount = 0;

    stabilityQuestions.forEach(qId => {
      const response = responses.find(r => r.questionId === qId);
      if (response) {
        let score = this.normalizeResponseValue(response.answer, response.questionType);
        
        // Para perguntas negativas (mood swings), inverter score
        if (qId === 'q_mood_swings') {
          score = 100 - score;
        }
        
        stabilitySum += score;
        questionCount++;
      }
    });

    return questionCount > 0 ? Math.round(stabilitySum / questionCount) : 50;
  }

  /**
   * Calcula energia social
   */
  calculateSocialEnergy(responses) {
    const socialQuestions = ['q_social_preference', 'q_group_vs_alone', 'q_party_energy', 'q_conversation_style'];
    
    let socialSum = 0;
    let questionCount = 0;

    socialQuestions.forEach(qId => {
      const response = responses.find(r => r.questionId === qId);
      if (response) {
        socialSum += this.normalizeResponseValue(response.answer, response.questionType);
        questionCount++;
      }
    });

    return questionCount > 0 ? Math.round(socialSum / questionCount) : 50;
  }

  /**
   * Calcula nível de empatia
   */
  calculateEmpathyLevel(responses) {
    const empathyQuestions = ['q_others_feelings', 'q_emotional_support', 'q_reading_emotions', 'q_helping_others'];
    
    let empathySum = 0;
    let questionCount = 0;

    empathyQuestions.forEach(qId => {
      const response = responses.find(r => r.questionId === qId);
      if (response) {
        empathySum += this.normalizeResponseValue(response.answer, response.questionType);
        questionCount++;
      }
    });

    return questionCount > 0 ? Math.round(empathySum / questionCount) : 50;
  }

  /**
   * Determina estilo de comunicação
   */
  determineCommunicationStyle(responses) {
    const styleScores = {
      expressive: 0,
      reserved: 0,
      balanced: 0,
      empathetic: 0,
      logical: 0,
      intuitive: 0
    };

    // Analisar perguntas relacionadas a comunicação
    const communicationQuestions = [
      { id: 'q_sharing_feelings', styles: { expressive: 2, reserved: -1, empathetic: 1 } },
      { id: 'q_decision_making', styles: { logical: 2, intuitive: 2, balanced: 1 } },
      { id: 'q_conflict_resolution', styles: { empathetic: 2, logical: 1, balanced: 2 } },
      { id: 'q_emotional_expression', styles: { expressive: 2, reserved: -1, intuitive: 1 } }
    ];

    communicationQuestions.forEach(({ id, styles }) => {
      const response = responses.find(r => r.questionId === id);
      if (response) {
        const intensity = this.normalizeResponseValue(response.answer, response.questionType) / 100;
        
        Object.entries(styles).forEach(([style, weight]) => {
          styleScores[style] += weight * intensity;
        });
      }
    });

    // Encontrar estilo dominante
    const dominantStyle = Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)[0][0];

    return dominantStyle;
  }

  /**
   * Analisa preferências de atividades por estado emocional
   */
  analyzeActivityPreferences(responses) {
    const activityMapping = {
      whenHappy: this.extractActivitiesForMood(responses, 'happy'),
      whenCalm: this.extractActivitiesForMood(responses, 'calm'),
      whenStressed: this.extractActivitiesForMood(responses, 'stressed'),
      whenRomantic: this.extractActivitiesForMood(responses, 'romantic'),
      moodBoosters: this.extractMoodBoostingActivities(responses)
    };

    return activityMapping;
  }

  /**
   * Gera perfil de humor atual
   */
  generateCurrentMoodProfile(responses) {
    const currentMoodResponse = responses.find(r => r.questionId === 'q_current_mood');
    const energyResponse = responses.find(r => r.questionId === 'q_current_energy');
    const socialResponse = responses.find(r => r.questionId === 'q_social_desire');
    
    return {
      currentMood: currentMoodResponse ? currentMoodResponse.answer : 'contentment',
      moodIntensity: this.normalizeResponseValue(
        responses.find(r => r.questionId === 'q_mood_intensity')?.answer || 50, 
        'scale'
      ),
      moodStability: this.calculateEmotionalStability(responses),
      energyLevel: energyResponse ? this.normalizeResponseValue(energyResponse.answer, 'scale') : 50,
      socialDesire: socialResponse ? this.normalizeResponseValue(socialResponse.answer, 'scale') : 50,
      romanticMood: this.normalizeResponseValue(
        responses.find(r => r.questionId === 'q_romantic_openness')?.answer || 50,
        'scale'
      ),
      lastUpdated: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    };
  }

  // ==============================================
  // CÁLCULO DE COMPATIBILIDADE
  // ==============================================

  /**
   * Calcula compatibilidade emocional entre dois usuários
   */
  async calculateEmotionalCompatibility(userProfile1, userProfile2, context = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`[EmotionalService] Calculando compatibilidade emocional entre usuários`);

      // Calcular scores por dimensão
      const breakdown = {
        emotionalHarmony: this.calculateEmotionalHarmony(userProfile1, userProfile2),
        communicationSync: this.calculateCommunicationSync(userProfile1, userProfile2),
        activityAlignment: this.calculateActivityAlignment(userProfile1, userProfile2),
        moodCompatibility: this.calculateMoodCompatibility(userProfile1, userProfile2),
        empathyMatch: this.calculateEmpathyMatch(userProfile1, userProfile2)
      };

      // Calcular score geral (média ponderada)
      const weights = {
        emotionalHarmony: 0.30,
        communicationSync: 0.25,
        activityAlignment: 0.20,
        moodCompatibility: 0.15,
        empathyMatch: 0.10
      };

      const overallScore = Math.round(
        Object.entries(breakdown).reduce((sum, [dimension, score]) => {
          return sum + (score * weights[dimension]);
        }, 0)
      );

      // Gerar explicações
      const explanation = this.generateCompatibilityExplanation(breakdown, overallScore);
      const strengths = this.identifyCompatibilityStrengths(breakdown);
      const challenges = this.identifyCompatibilityChallenges(breakdown);
      const recommendations = this.generateCompatibilityRecommendations(breakdown, userProfile1, userProfile2);

      const result = {
        user1Id: userProfile1.metadata.userId,
        user2Id: userProfile2.metadata.userId,
        overallScore,
        breakdown,
        explanation,
        strengths,
        challenges,
        recommendations,
        calculatedAt: new Date(),
        algorithm: `emotional_compatibility_${this.algorithmVersion}`,
        confidence: this.calculateCompatibilityConfidence(breakdown)
      };

      this.logger.info(`[EmotionalService] Compatibilidade calculada: ${overallScore}% (${Date.now() - startTime}ms)`);

      return result;

    } catch (error) {
      this.logger.error(`[EmotionalService] Erro ao calcular compatibilidade: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula harmonia emocional (emoções complementares)
   */
  calculateEmotionalHarmony(profile1, profile2) {
    const emotions1 = profile1.dominantEmotions || [];
    const emotions2 = profile2.dominantEmotions || [];

    if (emotions1.length === 0 || emotions2.length === 0) {
      return 50; // Score neutro se faltam dados
    }

    // Calcular sobreposição de emoções
    const commonEmotions = emotions1.filter(e1 => 
      emotions2.some(e2 => e2.type === e1.type)
    );

    // Calcular complementaridade (emoções que se complementam bem)
    const complementaryPairs = this.getComplementaryEmotions();
    let complementarityScore = 0;

    emotions1.forEach(e1 => {
      emotions2.forEach(e2 => {
        if (complementaryPairs[e1.type]?.includes(e2.type)) {
          complementarityScore += (e1.intensity + e2.intensity) / 200; // Normalizar para 0-1
        }
      });
    });

    // Score final: 40% sobreposição + 60% complementaridade
    const overlapScore = (commonEmotions.length / Math.max(emotions1.length, emotions2.length)) * 100;
    const complementScore = (complementarityScore / Math.max(emotions1.length, emotions2.length)) * 100;

    return Math.round((overlapScore * 0.4) + (complementScore * 0.6));
  }

  /**
   * Calcula sincronização de comunicação
   */
  calculateCommunicationSync(profile1, profile2) {
    const style1 = profile1.communicationStyle;
    const style2 = profile2.communicationStyle;

    // Matriz de compatibilidade de estilos
    const compatibilityMatrix = {
      expressive: { expressive: 85, empathetic: 90, intuitive: 80, balanced: 75, logical: 40, reserved: 30 },
      reserved: { reserved: 80, balanced: 70, logical: 85, empathetic: 60, expressive: 30, intuitive: 45 },
      balanced: { balanced: 95, expressive: 75, reserved: 70, empathetic: 80, logical: 75, intuitive: 70 },
      empathetic: { empathetic: 90, expressive: 90, intuitive: 85, balanced: 80, reserved: 60, logical: 50 },
      logical: { logical: 85, reserved: 85, balanced: 75, empathetic: 50, expressive: 40, intuitive: 35 },
      intuitive: { intuitive: 85, expressive: 80, empathetic: 85, balanced: 70, reserved: 45, logical: 35 }
    };

    return compatibilityMatrix[style1]?.[style2] || 50;
  }

  /**
   * Calcula alinhamento de atividades
   */
  calculateActivityAlignment(profile1, profile2) {
    const activities1 = profile1.activityPreferences;
    const activities2 = profile2.activityPreferences;

    if (!activities1 || !activities2) return 50;

    let totalAlignment = 0;
    let categoryCount = 0;

    // Comparar cada categoria de atividade
    const categories = ['whenHappy', 'whenCalm', 'whenStressed', 'whenRomantic', 'moodBoosters'];
    
    categories.forEach(category => {
      if (activities1[category] && activities2[category]) {
        const common = activities1[category].filter(a => activities2[category].includes(a));
        const total = [...new Set([...activities1[category], ...activities2[category]])];
        
        if (total.length > 0) {
          totalAlignment += (common.length / total.length) * 100;
          categoryCount++;
        }
      }
    });

    return categoryCount > 0 ? Math.round(totalAlignment / categoryCount) : 50;
  }

  /**
   * Calcula compatibilidade de humor
   */
  calculateMoodCompatibility(profile1, profile2) {
    const mood1 = profile1.currentMoodProfile;
    const mood2 = profile2.currentMoodProfile;

    if (!mood1 || !mood2) return 50;

    // Comparar níveis de energia
    const energyDiff = Math.abs(mood1.energyLevel - mood2.energyLevel);
    const energyScore = Math.max(0, 100 - (energyDiff * 1.5));

    // Comparar desejo social
    const socialDiff = Math.abs(mood1.socialDesire - mood2.socialDesire);
    const socialScore = Math.max(0, 100 - (socialDiff * 1.2));

    // Comparar humor romântico
    const romanticDiff = Math.abs(mood1.romanticMood - mood2.romanticMood);
    const romanticScore = Math.max(0, 100 - (romanticDiff * 1.0));

    // Score final ponderado
    return Math.round((energyScore * 0.4) + (socialScore * 0.3) + (romanticScore * 0.3));
  }

  /**
   * Calcula match de empatia
   */
  calculateEmpathyMatch(profile1, profile2) {
    const empathy1 = profile1.empathyLevel || 50;
    const empathy2 = profile2.empathyLevel || 50;

    // Calcular diferença de níveis de empatia
    const empathyDiff = Math.abs(empathy1 - empathy2);
    
    // Pontuação baseada na proximidade + bônus para altos níveis
    const proximityScore = Math.max(0, 100 - (empathyDiff * 1.5));
    const highEmpathyBonus = Math.min(empathy1, empathy2) > 70 ? 15 : 0;

    return Math.min(100, Math.round(proximityScore + highEmpathyBonus));
  }

  // ==============================================
  // FUNÇÕES AUXILIARES
  // ==============================================

  /**
   * Valida respostas do questionário
   */
  validateQuestionnaireResponses(responses) {
    const errors = [];

    if (!Array.isArray(responses) || responses.length === 0) {
      errors.push('Nenhuma resposta fornecida');
    }

    responses.forEach((response, index) => {
      if (!response.questionId) {
        errors.push(`Resposta ${index}: questionId obrigatório`);
      }
      if (response.answer === undefined || response.answer === null) {
        errors.push(`Resposta ${index}: answer obrigatório`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normaliza valores de resposta para escala 0-100
   */
  normalizeResponseValue(value, questionType) {
    if (typeof value === 'number') {
      // Para escalas, assumir que já está normalizada ou converter
      if (questionType === 'scale') {
        return Math.max(0, Math.min(100, value * 10)); // Se escala 1-10
      }
      return Math.max(0, Math.min(100, value));
    }

    if (typeof value === 'string') {
      // Mapear respostas textuais para valores numéricos
      const textMapping = {
        'never': 0, 'rarely': 20, 'sometimes': 40, 'often': 60, 'frequently': 80, 'always': 100,
        'strongly_disagree': 0, 'disagree': 25, 'neutral': 50, 'agree': 75, 'strongly_agree': 100,
        'very_low': 10, 'low': 30, 'medium': 50, 'high': 70, 'very_high': 90
      };
      
      return textMapping[value.toLowerCase()] || 50;
    }

    return 50; // Valor padrão
  }

  /**
   * Define emoções complementares
   */
  getComplementaryEmotions() {
    return {
      joy: ['excitement', 'contentment', 'love'],
      excitement: ['joy', 'curiosity', 'confidence'],
      contentment: ['serenity', 'joy', 'gratitude'],
      serenity: ['contentment', 'calmness', 'melancholy'],
      confidence: ['excitement', 'determination', 'love'],
      love: ['joy', 'confidence', 'empathy'],
      empathy: ['love', 'sensitivity', 'calmness'],
      curiosity: ['excitement', 'focus', 'determination'],
      calmness: ['serenity', 'focus', 'empathy'],
      focus: ['determination', 'calmness', 'curiosity'],
      determination: ['confidence', 'focus', 'passion'],
      melancholy: ['serenity', 'sensitivity', 'nostalgia'],
      sensitivity: ['empathy', 'melancholy', 'love'],
      passion: ['determination', 'excitement', 'love']
    };
  }

  /**
   * Extrai atividades para mood específico
   */
  extractActivitiesForMood(responses, mood) {
    const moodQuestionId = `q_activities_when_${mood}`;
    const response = responses.find(r => r.questionId === moodQuestionId);
    
    if (response && Array.isArray(response.answer)) {
      return response.answer;
    }
    
    return [];
  }

  /**
   * Extrai atividades que melhoram humor
   */
  extractMoodBoostingActivities(responses) {
    const boosterQuestionId = 'q_mood_boosting_activities';
    const response = responses.find(r => r.questionId === boosterQuestionId);
    
    if (response && Array.isArray(response.answer)) {
      return response.answer;
    }
    
    return [];
  }

  /**
   * Calcula métricas de qualidade
   */
  calculateQualityMetrics(responses, analysis) {
    const responseTime = responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const averageResponseTime = responseTime / responses.length;
    
    // Calcular score de confiabilidade baseado em vários fatores
    let reliabilityScore = 100;
    
    // Penalizar respostas muito rápidas (< 2s por pergunta)
    if (averageResponseTime < 2) {
      reliabilityScore -= 30;
    }
    
    // Penalizar inconsistências (será implementado em versão futura)
    const hasInconsistencies = false; // Placeholder
    
    // Penalizar perfis extremos demais
    const hasExtremeValues = Object.values(analysis).some(value => {
      if (typeof value === 'number') {
        return value < 5 || value > 95;
      }
      return false;
    });
    
    if (hasExtremeValues) {
      reliabilityScore -= 15;
    }

    return {
      reliabilityScore: Math.max(0, reliabilityScore),
      qualityFlags: {
        hasInconsistencies,
        needsReview: reliabilityScore < 70,
        isHighConfidence: reliabilityScore > 85
      }
    };
  }

  /**
   * Gera insights emocionais
   */
  generateEmotionalInsights(analysis) {
    const insights = [];

    // Insight sobre emoções dominantes
    if (analysis.dominantEmotions.length > 0) {
      const topEmotion = analysis.dominantEmotions[0];
      insights.push({
        type: 'strength',
        title: `Sua emoção dominante: ${topEmotion.type}`,
        description: `Você demonstra forte tendência para ${topEmotion.type} com intensidade de ${topEmotion.intensity}%.`,
        confidence: 85,
        evidence: ['Baseado nas respostas do questionário emocional']
      });
    }

    // Insight sobre estilo de comunicação
    insights.push({
      type: 'pattern',
      title: `Estilo de comunicação: ${analysis.communicationStyle}`,
      description: this.getCommunicationStyleDescription(analysis.communicationStyle),
      confidence: 80,
      evidence: ['Análise de preferências de comunicação']
    });

    return insights;
  }

  /**
   * Gera recomendações
   */
  generateRecommendations(profile) {
    const recommendations = [];

    // Recomendação baseada no perfil emocional
    if (profile.emotionalIntensity > 80) {
      recommendations.push({
        type: 'dating_strategy',
        title: 'Encontre alguém que aprecie sua intensidade',
        description: 'Você tem alta intensidade emocional. Procure parceiros que valorizem profundidade emocional.',
        priority: 'high',
        actionItems: [
          'Seja autêntico sobre seus sentimentos',
          'Procure atividades que permitam expressão emocional',
          'Comunique suas necessidades emocionais claramente'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Descriptions dos estilos de comunicação
   */
  getCommunicationStyleDescription(style) {
    const descriptions = {
      expressive: 'Você compartilha emoções abertamente e valoriza comunicação emocional.',
      reserved: 'Você prefere momentos íntimos para compartilhar sentimentos profundos.',
      balanced: 'Você adapta seu estilo de comunicação ao contexto e à pessoa.',
      empathetic: 'Você foca nas emoções dos outros e oferece suporte emocional.',
      logical: 'Você prefere abordagens racionais mesmo em situações emocionais.',
      intuitive: 'Você segue sua intuição e a energia do momento nas interações.'
    };
    
    return descriptions[style] || 'Estilo de comunicação único.';
  }

  // Outras funções auxiliares para compatibilidade...
  generateCompatibilityExplanation(breakdown, overallScore) {
    const explanations = [];
    
    if (overallScore >= 80) {
      explanations.push('Excelente compatibilidade emocional com potencial para conexão profunda.');
    } else if (overallScore >= 60) {
      explanations.push('Boa compatibilidade emocional com algumas áreas de crescimento.');
    } else {
      explanations.push('Compatibilidade moderada que pode se desenvolver com comunicação.');
    }

    return explanations;
  }

  identifyCompatibilityStrengths(breakdown) {
    return Object.entries(breakdown)
      .filter(([, score]) => score >= 70)
      .map(([dimension]) => `Forte ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  }

  identifyCompatibilityChallenges(breakdown) {
    return Object.entries(breakdown)
      .filter(([, score]) => score < 50)
      .map(([dimension]) => `Trabalhar na ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  }

  generateCompatibilityRecommendations(breakdown, profile1, profile2) {
    const recommendations = [];
    
    if (breakdown.communicationSync < 60) {
      recommendations.push('Pratiquem estilos de comunicação diferentes para se adaptarem um ao outro.');
    }
    
    if (breakdown.activityAlignment < 50) {
      recommendations.push('Explorem novas atividades juntos para encontrar interesses em comum.');
    }

    return recommendations;
  }

  calculateCompatibilityConfidence(breakdown) {
    const scores = Object.values(breakdown);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    
    // Confiança alta quando scores são consistentes (baixa variância)
    return Math.max(60, Math.min(95, 100 - variance));
  }

  calculateEmotionFrequency(emotionType, responses) {
    const frequencyResponse = responses.find(r => r.questionId === `q_${emotionType}_frequency`);
    return frequencyResponse ? this.normalizeResponseValue(frequencyResponse.answer, 'scale') : 50;
  }

  calculateEmotionPreference(emotionType, responses) {
    const preferenceResponse = responses.find(r => r.questionId === `q_${emotionType}_preference`);
    return preferenceResponse ? this.normalizeResponseValue(preferenceResponse.answer, 'scale') : 50;
  }
}

// ==============================================
// INSTÂNCIA SINGLETON
// ==============================================

export const emotionalProfileService = new EmotionalProfileService();
export default emotionalProfileService;