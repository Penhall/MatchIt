// recommendation/emotional-match-calculator.ts - Integração do Cálculo Emocional no Sistema de Scoring

import { 
  EmotionalProfile, 
  EmotionalCompatibility 
} from '../types/recommendation-emotional';
import { EmotionalProfileService } from '../services/recommendation/emotional-profile-service';
import { MatchScore, ScoreFactor } from '../types/recommendation/match-score';

/**
 * Calculadora de compatibilidade emocional para integração com o sistema de scoring existente
 * Extende o sistema atual de match-score.ts com capacidades emocionais
 */
export class EmotionalMatchCalculator {
  
  /**
   * Calcula o score emocional entre dois usuários
   * Retorna um valor de 0-100 para integrar com o sistema híbrido existente
   */
  static calculateEmotionalScore(
    userProfile: EmotionalProfile,
    targetProfile: EmotionalProfile,
    context?: EmotionalScoringContext
  ): EmotionalScoringResult {
    
    // Validar perfis
    const userValidation = EmotionalProfileService.validateEmotionalProfile(userProfile);
    const targetValidation = EmotionalProfileService.validateEmotionalProfile(targetProfile);
    
    if (!userValidation.isValid || !targetValidation.isValid) {
      return {
        score: 50, // Score neutro para perfis inválidos
        compatibility: null,
        factors: [],
        confidence: 0,
        warnings: [...userValidation.errors, ...targetValidation.errors]
      };
    }
    
    // Calcular compatibilidade completa
    const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
      userProfile,
      targetProfile
    );
    
    // Gerar fatores detalhados para explicação
    const factors = this.generateEmotionalFactors(compatibility, userProfile, targetProfile);
    
    // Aplicar contexto se fornecido
    let adjustedScore = compatibility.overallScore;
    if (context) {
      adjustedScore = this.applyContextualAdjustments(adjustedScore, compatibility, context);
    }
    
    // Aplicar filtros de qualidade
    const qualityScore = this.calculateQualityScore(userProfile, targetProfile);
    const finalScore = Math.round(adjustedScore * (qualityScore / 100));
    
    return {
      score: Math.max(0, Math.min(100, finalScore)),
      compatibility,
      factors,
      confidence: compatibility.confidence,
      warnings: [...userValidation.warnings, ...targetValidation.warnings],
      metadata: {
        userDataQuality: userProfile.dataQuality.consistencyScore,
        targetDataQuality: targetProfile.dataQuality.consistencyScore,
        calculationMethod: 'emotional_hybrid_v1',
        contextApplied: !!context,
        qualityAdjustment: qualityScore
      }
    };
  }
  
  /**
   * Gera fatores detalhados para explicar o score emocional
   */
  private static generateEmotionalFactors(
    compatibility: EmotionalCompatibility,
    userProfile: EmotionalProfile,
    targetProfile: EmotionalProfile
  ): EmotionalScoreFactor[] {
    
    const factors: EmotionalScoreFactor[] = [];
    
    // Analisar energia
    if (compatibility.energyCompatibility > 80) {
      factors.push({
        dimension: 'emotional',
        factor: 'high_energy_compatibility',
        description: 'Níveis de energia muito compatíveis',
        impact: this.scoreToImpact(compatibility.energyCompatibility),
        weight: 0.15,
        contribution: compatibility.energyCompatibility * 0.15 / 100,
        confidence: 0.9,
        evidence: [{
          type: 'energy_analysis',
          description: `Energia geral: ${userProfile.energyLevel} vs ${targetProfile.energyLevel}`,
          strength: 0.8
        }],
        userValue: {
          energyLevel: userProfile.energyLevel,
          socialEnergy: userProfile.socialEnergy
        },
        targetValue: {
          energyLevel: targetProfile.energyLevel,
          socialEnergy: targetProfile.socialEnergy
        },
        similarity: compatibility.energyCompatibility
      });
    } else if (compatibility.energyCompatibility < 50) {
      factors.push({
        dimension: 'emotional',
        factor: 'energy_mismatch',
        description: 'Diferenças significativas nos níveis de energia',
        impact: this.scoreToImpact(compatibility.energyCompatibility) - 0.5,
        weight: 0.15,
        contribution: (compatibility.energyCompatibility - 50) * 0.15 / 100,
        confidence: 0.8,
        evidence: [{
          type: 'energy_analysis',
          description: `Diferença de energia pode causar conflitos`,
          strength: 0.7
        }],
        userValue: userProfile.energyLevel,
        targetValue: targetProfile.energyLevel,
        similarity: compatibility.energyCompatibility
      });
    }
    
    // Analisar abertura emocional
    if (compatibility.opennessCompatibility > 85) {
      factors.push({
        dimension: 'emotional',
        factor: 'high_emotional_openness',
        description: 'Excelente compatibilidade na abertura emocional',
        impact: this.scoreToImpact(compatibility.opennessCompatibility),
        weight: 0.20,
        contribution: compatibility.opennessCompatibility * 0.20 / 100,
        confidence: 0.95,
        evidence: [{
          type: 'openness_analysis',
          description: 'Ambos demonstram boa capacidade de abertura e vulnerabilidade',
          strength: 0.9
        }],
        userValue: {
          openness: userProfile.openness,
          vulnerability: userProfile.vulnerability,
          empathy: userProfile.empathyLevel
        },
        targetValue: {
          openness: targetProfile.openness,
          vulnerability: targetProfile.vulnerability,
          empathy: targetProfile.empathyLevel
        },
        similarity: compatibility.opennessCompatibility
      });
    }
    
    // Analisar estabilidade emocional
    if (compatibility.stabilityCompatibility < 55) {
      factors.push({
        dimension: 'emotional',
        factor: 'stability_concerns',
        description: 'Diferenças na estabilidade emocional podem gerar desafios',
        impact: this.scoreToImpact(compatibility.stabilityCompatibility) - 0.3,
        weight: 0.20,
        contribution: (compatibility.stabilityCompatibility - 50) * 0.20 / 100,
        confidence: 0.75,
        evidence: [{
          type: 'stability_analysis',
          description: 'Níveis diferentes de estabilidade e controle emocional',
          strength: 0.8
        }],
        userValue: userProfile.emotionalStability,
        targetValue: targetProfile.emotionalStability,
        similarity: compatibility.stabilityCompatibility
      });
    }
    
    // Analisar compatibilidade social
    if (compatibility.socialCompatibility > 80) {
      factors.push({
        dimension: 'emotional',
        factor: 'social_alignment',
        description: 'Boa compatibilidade social e de intimidade',
        impact: this.scoreToImpact(compatibility.socialCompatibility),
        weight: 0.15,
        contribution: compatibility.socialCompatibility * 0.15 / 100,
        confidence: 0.85,
        evidence: [{
          type: 'social_analysis',
          description: 'Preferências sociais e níveis de extroversão alinhados',
          strength: 0.8
        }],
        userValue: {
          extroversion: userProfile.extroversion,
          socialConfidence: userProfile.socialConfidence
        },
        targetValue: {
          extroversion: targetProfile.extroversion,
          socialConfidence: targetProfile.socialConfidence
        },
        similarity: compatibility.socialCompatibility
      });
    }
    
    // Analisar estilo de apego
    if (compatibility.attachmentCompatibility > 85) {
      factors.push({
        dimension: 'emotional',
        factor: 'attachment_compatibility',
        description: 'Estilos de apego muito compatíveis',
        impact: 0.8,
        weight: 0.10,
        contribution: 0.08,
        confidence: 0.9,
        evidence: [{
          type: 'attachment_analysis',
          description: `${userProfile.attachmentStyle} + ${targetProfile.attachmentStyle} = excelente combinação`,
          strength: 0.9
        }],
        userValue: userProfile.attachmentStyle,
        targetValue: targetProfile.attachmentStyle,
        similarity: compatibility.attachmentCompatibility
      });
    } else if (compatibility.attachmentCompatibility < 60) {
      factors.push({
        dimension: 'emotional',
        factor: 'attachment_challenges',
        description: 'Estilos de apego podem criar desafios no relacionamento',
        impact: -0.4,
        weight: 0.10,
        contribution: -0.04,
        confidence: 0.8,
        evidence: [{
          type: 'attachment_analysis',
          description: `${userProfile.attachmentStyle} + ${targetProfile.attachmentStyle} pode gerar conflitos`,
          strength: 0.7
        }],
        userValue: userProfile.attachmentStyle,
        targetValue: targetProfile.attachmentStyle,
        similarity: compatibility.attachmentCompatibility
      });
    }
    
    // Analisar linguagens do amor
    if (compatibility.loveLanguageAlignment > 70) {
      factors.push({
        dimension: 'emotional',
        factor: 'love_language_alignment',
        description: 'Boa compatibilidade nas linguagens do amor',
        impact: 0.6,
        weight: 0.05,
        contribution: 0.03,
        confidence: 0.85,
        evidence: [{
          type: 'love_language_analysis',
          description: 'Linguagens do amor complementares ou similares',
          strength: 0.8
        }],
        userValue: userProfile.loveLanguage,
        targetValue: targetProfile.loveLanguage,
        similarity: compatibility.loveLanguageAlignment
      });
    }
    
    return factors;
  }
  
  /**
   * Aplica ajustes contextuais ao score
   */
  private static applyContextualAdjustments(
    baseScore: number,
    compatibility: EmotionalCompatibility,
    context: EmotionalScoringContext
  ): number {
    
    let adjustedScore = baseScore;
    
    // Ajustar baseado na fase do relacionamento
    switch (context.relationshipPhase) {
      case 'initial_attraction':
        // Na atração inicial, dar mais peso à energia e abertura
        adjustedScore = baseScore * 0.7 + 
                      (compatibility.energyCompatibility + compatibility.opennessCompatibility) / 2 * 0.3;
        break;
        
      case 'getting_to_know':
        // Ao se conhecer, priorizar comunicação e estabilidade
        adjustedScore = baseScore * 0.8 + 
                      (compatibility.communicationCompatibility + compatibility.stabilityCompatibility) / 2 * 0.2;
        break;
        
      case 'serious_relationship':
        // Para relacionamento sério, apego e conflitos são cruciais
        adjustedScore = baseScore * 0.6 + 
                      (compatibility.attachmentCompatibility + compatibility.conflictCompatibility) / 2 * 0.4;
        break;
    }
    
    // Ajustar baseado no contexto temporal
    if (context.timeContext === 'late_night') {
      // À noite, energia pode ser menos relevante
      adjustedScore = adjustedScore * 1.05; // Pequeno boost
    } else if (context.timeContext === 'weekend') {
      // Fim de semana, priorizar compatibilidade social
      adjustedScore = adjustedScore * 0.9 + compatibility.socialCompatibility * 0.1;
    }
    
    // Ajustar baseado no humor atual
    if (context.currentMood) {
      if (context.currentMood < 40) {
        // Se usuário está com humor baixo, priorizar estabilidade emocional
        adjustedScore = adjustedScore * 0.8 + compatibility.stabilityCompatibility * 0.2;
      } else if (context.currentMood > 80) {
        // Se usuário está com humor alto, energia é mais importante
        adjustedScore = adjustedScore * 0.9 + compatibility.energyCompatibility * 0.1;
      }
    }
    
    return Math.max(0, Math.min(100, adjustedScore));
  }
  
  /**
   * Calcula score de qualidade dos dados
   */
  private static calculateQualityScore(
    userProfile: EmotionalProfile,
    targetProfile: EmotionalProfile
  ): number {
    
    const userQuality = (
      userProfile.completeness * 0.4 +
      userProfile.confidence * 0.3 +
      userProfile.dataQuality.consistencyScore * 0.3
    );
    
    const targetQuality = (
      targetProfile.completeness * 0.4 +
      targetProfile.confidence * 0.3 +
      targetProfile.dataQuality.consistencyScore * 0.3
    );
    
    // Usar a média, mas penalizar se um dos perfis for muito pior
    const averageQuality = (userQuality + targetQuality) / 2;
    const qualityDifference = Math.abs(userQuality - targetQuality);
    
    // Penalizar diferenças grandes de qualidade
    const penalty = qualityDifference > 30 ? qualityDifference * 0.5 : 0;
    
    return Math.max(50, averageQuality - penalty); // Mínimo de 50%
  }
  
  /**
   * Converte score (0-100) para impacto (-1 a 1)
   */
  private static scoreToImpact(score: number): number {
    return (score - 50) / 50; // Converte 0-100 para -1 a 1
  }
  
  /**
   * Função pública para integração com o sistema de match-score existente
   * Deve ser chamada do arquivo principal match-score.ts
   */
  static integrateWithMatchScore(
    userEmotionalProfile: EmotionalProfile,
    targetEmotionalProfile: EmotionalProfile,
    context?: EmotionalScoringContext
  ): {
    emotionalScore: number;
    emotionalFactors: EmotionalScoreFactor[];
    confidence: number;
  } {
    
    const result = this.calculateEmotionalScore(
      userEmotionalProfile,
      targetEmotionalProfile,
      context
    );
    
    return {
      emotionalScore: result.score,
      emotionalFactors: result.factors,
      confidence: result.confidence
    };
  }
}

// =====================================================
// INTERFACES E TIPOS AUXILIARES
// =====================================================

/**
 * Contexto para scoring emocional
 */
export interface EmotionalScoringContext {
  relationshipPhase: 'initial_attraction' | 'getting_to_know' | 'serious_relationship';
  timeContext: 'morning' | 'afternoon' | 'evening' | 'late_night' | 'weekend';
  currentMood?: number; // 0-100
  userActivity?: string; // O que o usuário está fazendo
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  specialEvents?: string[]; // Eventos especiais acontecendo
}

/**
 * Resultado do scoring emocional
 */
export interface EmotionalScoringResult {
  score: number; // Score final (0-100)
  compatibility: EmotionalCompatibility | null;
  factors: EmotionalScoreFactor[];
  confidence: number; // Confiança no resultado (0-100)
  warnings: string[]; // Avisos sobre qualidade dos dados
  metadata?: {
    userDataQuality: number;
    targetDataQuality: number;
    calculationMethod: string;
    contextApplied: boolean;
    qualityAdjustment: number;
  };
}

/**
 * Fator emocional que contribui para o score
 * Estende ScoreFactor para incluir dados emocionais específicos
 */
export interface EmotionalScoreFactor extends Omit<ScoreFactor, 'dimension'> {
  dimension: 'emotional';
  factor: EmotionalFactorType;
  evidence: EmotionalEvidence[];
  userValue?: any;
  targetValue?: any;
  similarity?: number;
}

/**
 * Tipos de fatores emocionais
 */
export type EmotionalFactorType = 
  | 'high_energy_compatibility'
  | 'energy_mismatch'
  | 'high_emotional_openness'
  | 'openness_concerns'
  | 'stability_compatibility'
  | 'stability_concerns'
  | 'social_alignment'
  | 'social_mismatch'
  | 'attachment_compatibility'
  | 'attachment_challenges'
  | 'communication_alignment'
  | 'communication_barriers'
  | 'love_language_alignment'
  | 'love_language_mismatch'
  | 'emotional_maturity'
  | 'emotional_intelligence_match'
  | 'trigger_compatibility'
  | 'needs_alignment'
  | 'pattern_similarity'
  | 'mood_stability_match';

/**
 * Evidência emocional específica
 */
export interface EmotionalEvidence {
  type: 'energy_analysis' | 'openness_analysis' | 'stability_analysis' | 
        'social_analysis' | 'attachment_analysis' | 'communication_analysis' |
        'love_language_analysis' | 'pattern_analysis' | 'trigger_analysis';
  description: string;
  strength: number; // Força da evidência (0-1)
  dataPoints?: string[]; // Pontos de dados específicos
  confidence?: number; // Confiança na evidência (0-1)
}

/**
 * Configuração para o calculador emocional
 */
export interface EmotionalCalculatorConfig {
  weights: {
    energy: number;
    openness: number;
    stability: number;
    social: number;
    motivation: number;
    attachment: number;
    communication: number;
    loveLanguage: number;
  };
  qualityThresholds: {
    minimum: number;
    warning: number;
    good: number;
  };
  contextualAdjustments: {
    enabled: boolean;
    maxAdjustment: number; // Máximo de ajuste percentual
  };
}

export default EmotionalMatchCalculator;