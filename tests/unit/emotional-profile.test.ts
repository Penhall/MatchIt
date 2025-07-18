// tests/emotional-profile.test.ts - Testes Unitários para Sistema de Perfil Emocional

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EmotionalProfileService } from '../services/recommendation/emotional-profile-service';
import { EmotionalMatchCalculator } from '../recommendation/emotional-match-calculator';
import { MatchScoreCalculator } from '../recommendation/match-score';
import { 
  EmotionalProfile, 
  EmotionalCompatibility,
  ExtendedUserProfile 
} from '../types/recommendation';

describe('Sistema de Perfil Emocional', () => {
  
  // =====================================================
  // SETUP E DADOS DE TESTE
  // =====================================================
  
  let mockUserProfile: ExtendedUserProfile;
  let mockTargetProfile: ExtendedUserProfile;
  let mockEmotionalProfile1: EmotionalProfile;
  let mockEmotionalProfile2: EmotionalProfile;
  
  beforeEach(() => {
    // Profile de usuário 1 - Extrovertido, estável
    mockEmotionalProfile1 = {
      id: 'emotional_user1_123',
      userId: 'user1',
      version: '1.0',
      
      // Energia alta
      energyLevel: 85,
      socialEnergy: 90,
      physicalEnergy: 80,
      mentalEnergy: 75,
      
      // Abertura moderada-alta
      openness: 75,
      vulnerability: 60,
      emotionalExpression: 80,
      empathyLevel: 85,
      
      // Estabilidade alta
      emotionalStability: 85,
      stressResilience: 80,
      selfControl: 75,
      adaptability: 90,
      
      // Social alto
      extroversion: 90,
      socialConfidence: 85,
      groupOrientation: 80,
      intimacyComfort: 70,
      
      // Motivação alta
      achievementDrive: 85,
      competitiveness: 70,
      goalOrientation: 90,
      riskTolerance: 75,
      
      // Padrões emocionais
      dominantEmotions: [
        { emotion: 'joy', intensity: 80, frequency: 85, duration: 120, contexts: ['social', 'work'], triggers: ['success', 'social_interaction'] },
        { emotion: 'confidence', intensity: 75, frequency: 80, duration: 180, contexts: ['work', 'personal'], triggers: ['achievement', 'recognition'] }
      ],
      emotionalPatterns: [],
      emotionalTriggers: [],
      emotionalNeeds: [],
      
      // Histórico
      moodHistory: [],
      averageMood: 78,
      moodStability: 82,
      
      // Estilos de relacionamento
      attachmentStyle: 'secure',
      communicationStyle: 'assertive',
      conflictStyle: 'collaborative',
      loveLanguage: ['words_of_affirmation', 'quality_time'],
      
      // Preferências
      emotionalPreferences: {
        preferredCommunicationFrequency: 'frequent',
        communicationChannels: ['face_to_face', 'voice_call'],
        emotionalSharingLevel: 'open',
        supportStyle: ['listening', 'problem_solving'],
        comfortMethods: ['words', 'physical_presence'],
        intimacyPace: 'moderate',
        physicalAffection: 'high',
        emotionalIntimacy: 'deep',
        conflictApproach: 'immediate_discussion',
        resolutionPreference: 'win_win',
        togetherTimePreference: 'balanced',
        spaceNeeds: 'some',
        personalGrowthImportance: 85,
        sharedGoalsImportance: 90
      },
      dealBreakers: [],
      
      // Qualidade
      completeness: 95,
      confidence: 90,
      dataQuality: {
        questionnairesCompleted: 1,
        totalQuestions: 50,
        consistencyScore: 88,
        responseTime: 35,
        hasInconsistencies: false,
        suspiciousPatterns: [],
        validationFlags: [],
        staleness: 0,
        needsUpdate: false
      },
      
      // Metadados
      createdAt: new Date('2025-06-20'),
      updatedAt: new Date('2025-06-20'),
      lastQuestionnaire: new Date('2025-06-20'),
      nextUpdateDue: new Date('2025-09-20'),
      
      isActive: true,
      isPublic: true,
      privacyLevel: 'matches_only'
    };
    
    // Profile de usuário 2 - Introvertido, criativo
    mockEmotionalProfile2 = {
      ...mockEmotionalProfile1,
      id: 'emotional_user2_456',
      userId: 'user2',
      
      // Energia moderada-baixa
      energyLevel: 45,
      socialEnergy: 35,
      physicalEnergy: 50,
      mentalEnergy: 85,
      
      // Abertura alta (artístico)
      openness: 95,
      vulnerability: 80,
      emotionalExpression: 90,
      empathyLevel: 95,
      
      // Estabilidade moderada
      emotionalStability: 60,
      stressResilience: 55,
      selfControl: 70,
      adaptability: 75,
      
      // Social baixo (introvertido)
      extroversion: 25,
      socialConfidence: 40,
      groupOrientation: 30,
      intimacyComfort: 85,
      
      // Motivação criativa
      achievementDrive: 70,
      competitiveness: 30,
      goalOrientation: 60,
      riskTolerance: 80,
      
      // Diferentes emoções dominantes
      dominantEmotions: [
        { emotion: 'contentment', intensity: 70, frequency: 75, duration: 240, contexts: ['personal', 'creative'], triggers: ['solitude', 'creative_work'] },
        { emotion: 'anxiety', intensity: 60, frequency: 50, duration: 90, contexts: ['social', 'work'], triggers: ['crowds', 'pressure'] }
      ],
      
      averageMood: 65,
      moodStability: 55,
      
      // Estilos diferentes
      attachmentStyle: 'anxious',
      communicationStyle: 'indirect',
      conflictStyle: 'avoiding',
      loveLanguage: ['quality_time', 'acts_of_service'],
      
      // Preferências diferentes
      emotionalPreferences: {
        preferredCommunicationFrequency: 'regular',
        communicationChannels: ['text', 'email'],
        emotionalSharingLevel: 'moderate',
        supportStyle: ['listening', 'emotional_validation'],
        comfortMethods: ['space', 'words'],
        intimacyPace: 'slow',
        physicalAffection: 'moderate',
        emotionalIntimacy: 'very_deep',
        conflictApproach: 'cooling_off_period',
        resolutionPreference: 'compromise',
        togetherTimePreference: 'some_time',
        spaceNeeds: 'significant',
        personalGrowthImportance: 95,
        sharedGoalsImportance: 70
      },
      
      completeness: 88,
      confidence: 85,
      dataQuality: {
        ...mockEmotionalProfile1.dataQuality,
        consistencyScore: 82,
        responseTime: 45
      }
    };
    
    // Perfis de usuário completos
    mockUserProfile = {
      id: 'profile1',
      userId: 'user1',
      age: 28,
      gender: 'female',
      location: {
        latitude: -15.7942,
        longitude: -47.8822,
        city: 'Brasília',
        state: 'DF',
        country: 'Brazil',
        timezone: 'America/Sao_Paulo'
      },
      stylePreferences: {
        tenis: [1, 3, 5],
        roupas: [2, 4, 6],
        cores: [1, 2, 8],
        hobbies: [1, 5, 9],
        sentimentos: [2, 6, 7],
        confidence: 85,
        lastUpdated: new Date(),
        completeness: 90
      },
      preferences: {
        ageRange: [25, 35],
        maxDistance: 50,
        genders: ['male']
      },
      personalityVector: [75, 80, 90, 85, 25], // Big Five scores
      emotionalProfile: mockEmotionalProfile1,
      createdAt: new Date('2025-06-15'),
      updatedAt: new Date('2025-06-20'),
      lastActive: new Date('2025-06-23'),
      privacySettings: {
        showEmotionalProfile: true,
        showDetailedPersonality: true,
        showActivityLevel: true,
        allowEmotionalMatching: true,
        shareInsightsWithMatches: true
      },
      isVerified: true,
      verificationLevel: 'photo'
    };
    
    mockTargetProfile = {
      ...mockUserProfile,
      id: 'profile2',
      userId: 'user2',
      age: 30,
      gender: 'male',
      emotionalProfile: mockEmotionalProfile2,
      personalityVector: [95, 60, 25, 95, 40] // Mais criativo, menos extrovertido
    };
  });
  
  // =====================================================
  // TESTES DO SERVIÇO DE PERFIL EMOCIONAL
  // =====================================================
  
  describe('EmotionalProfileService', () => {
    
    it('deve criar um perfil emocional válido a partir de respostas', () => {
      const mockResponses = {
        'energy_energy_general': 85,
        'energy_energy_social': 90,
        'openness_openness_general': 75,
        'stability_emotional_stability': 85,
        'social_extroversion': 90,
        'relationship_style_attachment_style': 'secure'
      };
      
      const profile = EmotionalProfileService.createEmotionalProfile('test_user', mockResponses);
      
      expect(profile).toBeDefined();
      expect(profile.userId).toBe('test_user');
      expect(profile.energyLevel).toBeGreaterThan(0);
      expect(profile.completeness).toBeGreaterThan(0);
      expect(profile.isActive).toBe(true);
    });
    
    it('deve validar perfil emocional corretamente', () => {
      const validation = EmotionalProfileService.validateEmotionalProfile(mockEmotionalProfile1);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.score).toBeGreaterThan(80);
    });
    
    it('deve identificar perfil emocional inválido', () => {
      const invalidProfile = {
        ...mockEmotionalProfile1,
        energyLevel: 150, // Valor inválido
        openness: -10     // Valor inválido
      };
      
      const validation = EmotionalProfileService.validateEmotionalProfile(invalidProfile);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('energyLevel deve estar entre 0 e 100');
      expect(validation.errors).toContain('openness deve estar entre 0 e 100');
    });
    
    it('deve calcular compatibilidade emocional entre dois perfis', () => {
      const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
        mockEmotionalProfile1,
        mockEmotionalProfile2
      );
      
      expect(compatibility).toBeDefined();
      expect(compatibility.overallScore).toBeGreaterThanOrEqual(0);
      expect(compatibility.overallScore).toBeLessThanOrEqual(100);
      expect(compatibility.energyCompatibility).toBeDefined();
      expect(compatibility.opennessCompatibility).toBeDefined();
      expect(compatibility.attachmentCompatibility).toBeDefined();
      expect(compatibility.strengths).toBeInstanceOf(Array);
      expect(compatibility.challenges).toBeInstanceOf(Array);
      expect(compatibility.confidence).toBeGreaterThan(0);
    });
  });
  
  // =====================================================
  // TESTES DO CALCULADOR DE MATCH EMOCIONAL
  // =====================================================
  
  describe('EmotionalMatchCalculator', () => {
    
    it('deve calcular score emocional entre dois usuários', () => {
      const result = EmotionalMatchCalculator.calculateEmotionalScore(
        mockEmotionalProfile1,
        mockEmotionalProfile2
      );
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
    });
    
    it('deve lidar com perfis incompletos graciosamente', () => {
      const incompleteProfile = {
        ...mockEmotionalProfile1,
        completeness: 30,
        confidence: 40
      };
      
      const result = EmotionalMatchCalculator.calculateEmotionalScore(
        incompleteProfile,
        mockEmotionalProfile2
      );
      
      expect(result.score).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(70);
    });
    
    it('deve aplicar contexto emocional ao score', () => {
      const context = {
        relationshipPhase: 'getting_to_know' as const,
        timeContext: 'evening' as const,
        currentMood: 80
      };
      
      const resultWithContext = EmotionalMatchCalculator.calculateEmotionalScore(
        mockEmotionalProfile1,
        mockEmotionalProfile2,
        context
      );
      
      const resultWithoutContext = EmotionalMatchCalculator.calculateEmotionalScore(
        mockEmotionalProfile1,
        mockEmotionalProfile2
      );
      
      expect(resultWithContext.metadata?.contextApplied).toBe(true);
      expect(resultWithoutContext.metadata?.contextApplied).toBe(false);
      
      // Scores podem ser diferentes devido ao contexto
      expect(Math.abs(resultWithContext.score - resultWithoutContext.score)).toBeLessThanOrEqual(20);
    });
  });
  
  // =====================================================
  // TESTES DO SISTEMA HÍBRIDO INTEGRADO
  // =====================================================
  
  describe('MatchScoreCalculator (Sistema Híbrido)', () => {
    
    it('deve calcular score híbrido incluindo dimensão emocional', () => {
      const matchScore = MatchScoreCalculator.calculateMatchScore(
        mockUserProfile,
        mockTargetProfile
      );
      
      expect(matchScore).toBeDefined();
      expect(matchScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(matchScore.overallScore).toBeLessThanOrEqual(100);
      
      // Verificar se todas as dimensões estão presentes
      expect(matchScore.dimensionScores.style).toBeDefined();
      expect(matchScore.dimensionScores.emotional).toBeDefined();
      expect(matchScore.dimensionScores.hobby).toBeDefined();
      expect(matchScore.dimensionScores.location).toBeDefined();
      expect(matchScore.dimensionScores.personality).toBeDefined();
      
      // Verificar flags emocionais
      expect(typeof matchScore.isEmotionallyCompatible).toBe('boolean');
      expect(typeof matchScore.requiresEmotionalWork).toBe('boolean');
      
      // Verificar explicação emocional
      expect(matchScore.emotionalExplanation).toBeDefined();
      expect(matchScore.emotionalExplanation.summary).toBeDefined();
    });
    
    it('deve ajustar pesos personalizados corretamente', () => {
      const customWeights = {
        emotional: 0.4, // Dar mais peso à compatibilidade emocional
        style: 0.2,
        hobby: 0.15,
        location: 0.15,
        personality: 0.1
      };
      
      const matchScore = MatchScoreCalculator.calculateMatchScore(
        mockUserProfile,
        mockTargetProfile,
        undefined,
        customWeights
      );
      
      expect(matchScore.weightedScores.emotional).toBeGreaterThan(
        matchScore.weightedScores.style
      );
    });
    
    it('deve identificar incompatibilidades emocionais significativas', () => {
      // Criar perfil com incompatibilidades severas
      const incompatibleEmotionalProfile = {
        ...mockEmotionalProfile2,
        attachmentStyle: 'avoidant' as const,
        communicationStyle: 'aggressive' as const,
        emotionalStability: 20,
        empathyLevel: 15,
        conflictStyle: 'competitive' as const
      };
      
      const incompatibleProfile = {
        ...mockTargetProfile,
        emotionalProfile: incompatibleEmotionalProfile
      };
      
      const matchScore = MatchScoreCalculator.calculateMatchScore(
        mockUserProfile,
        incompatibleProfile
      );
      
      expect(matchScore.dimensionScores.emotional).toBeLessThan(50);
      expect(matchScore.requiresEmotionalWork).toBe(true);
      expect(matchScore.riskFactors.length).toBeGreaterThan(0);
    });
    
    it('deve calcular confiança baseada na qualidade dos dados', () => {
      // Perfil com baixa qualidade de dados
      const lowQualityProfile = {
        ...mockTargetProfile,
        emotionalProfile: {
          ...mockEmotionalProfile2,
          completeness: 40,
          confidence: 30,
          dataQuality: {
            ...mockEmotionalProfile2.dataQuality,
            consistencyScore: 45,
            hasInconsistencies: true
          }
        }
      };
      
      const matchScore = MatchScoreCalculator.calculateMatchScore(
        mockUserProfile,
        lowQualityProfile
      );
      
      expect(matchScore.confidence).toBeLessThan(60);
      expect(matchScore.requiresReview).toBe(true);
    });
  });
  
  // =====================================================
  // TESTES DE CENÁRIOS ESPECÍFICOS
  // =====================================================
  
  describe('Cenários de Compatibilidade Específicos', () => {
    
    it('deve identificar alta compatibilidade emocional', () => {
      // Criar perfis muito similares
      const similarProfile = {
        ...mockEmotionalProfile1,
        id: 'similar_profile',
        userId: 'similar_user',
        // Valores muito próximos
        energyLevel: 82,
        openness: 78,
        emotionalStability: 87,
        extroversion: 88,
        attachmentStyle: 'secure' as const,
        communicationStyle: 'assertive' as const
      };
      
      const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
        mockEmotionalProfile1,
        similarProfile
      );
      
      expect(compatibility.overallScore).toBeGreaterThan(80);
      expect(compatibility.strengths.length).toBeGreaterThan(2);
    });
    
    it('deve identificar complementaridade benéfica', () => {
      // Perfis diferentes mas complementares
      const complementaryProfile = {
        ...mockEmotionalProfile1,
        id: 'complementary_profile',
        userId: 'complementary_user',
        // Características complementares
        energyLevel: 60,  // Moderado vs Alto
        openness: 85,     // Mais aberto
        extroversion: 70, // Menos extrovertido
        empathyLevel: 95, // Muito empático
        communicationStyle: 'direct' as const, // Direto vs Assertivo
        loveLanguage: ['acts_of_service', 'physical_touch'] // Complementares
      };
      
      const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
        mockEmotionalProfile1,
        complementaryProfile
      );
      
      expect(compatibility.overallScore).toBeGreaterThan(65);
      expect(compatibility.recommendations.length).toBeGreaterThan(0);
    });
    
    it('deve identificar red flags emocionais', () => {
      // Perfil com características problemáticas
      const problematicProfile = {
        ...mockEmotionalProfile1,
        id: 'problematic_profile',
        userId: 'problematic_user',
        // Red flags
        emotionalStability: 15,
        empathyLevel: 10,
        communicationStyle: 'aggressive' as const,
        conflictStyle: 'competitive' as const,
        attachmentStyle: 'disorganized' as const,
        selfControl: 20,
        dealBreakers: [
          {
            id: '1',
            type: 'emotional_manipulation' as const,
            description: 'Uses guilt and manipulation',
            severity: 'critical' as const,
            isAbsolute: true
          }
        ]
      };
      
      const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
        mockEmotionalProfile1,
        problematicProfile
      );
      
      expect(compatibility.overallScore).toBeLessThan(40);
      expect(compatibility.challenges.length).toBeGreaterThan(2);
    });
  });
  
  // =====================================================
  // TESTES DE PERFORMANCE
  // =====================================================
  
  describe('Performance', () => {
    
    it('deve calcular compatibilidade em tempo razoável', async () => {
      const startTime = performance.now();
      
      const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
        mockEmotionalProfile1,
        mockEmotionalProfile2
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Menos de 100ms
      expect(compatibility).toBeDefined();
    });
    
    it('deve calcular score híbrido em tempo razoável', async () => {
      const startTime = performance.now();
      
      const matchScore = MatchScoreCalculator.calculateMatchScore(
        mockUserProfile,
        mockTargetProfile
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200); // Menos de 200ms
      expect(matchScore.processingTime).toBeLessThan(200);
    });
  });
  
  // =====================================================
  // TESTES DE EDGE CASES
  // =====================================================
  
  describe('Edge Cases', () => {
    
    it('deve lidar com perfis nulos ou indefinidos', () => {
      const result = EmotionalMatchCalculator.calculateEmotionalScore(
        undefined as any,
        mockEmotionalProfile2
      );
      
      expect(result.score).toBe(60); // Score neutro
      expect(result.warnings.length).toBeGreaterThan(0);
    });
    
    it('deve lidar com dados malformados', () => {
      const malformedProfile = {
        ...mockEmotionalProfile1,
        energyLevel: NaN,
        openness: undefined,
        attachmentStyle: 'invalid_style' as any
      };
      
      const validation = EmotionalProfileService.validateEmotionalProfile(malformedProfile);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
    
    it('deve lidar com perfis extremamente diferentes', () => {
      const extremeProfile = {
        ...mockEmotionalProfile1,
        energyLevel: 5,
        socialEnergy: 10,
        extroversion: 15,
        emotionalStability: 20,
        openness: 25
      };
      
      const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
        mockEmotionalProfile1, // Alta energia, extrovertido
        extremeProfile         // Baixa energia, introvertido
      );
      
      expect(compatibility.overallScore).toBeLessThan(50);
      expect(compatibility.challenges.length).toBeGreaterThan(0);
    });
  });
});

// =====================================================
// TESTES DE INTEGRAÇÃO SIMULADOS
// =====================================================

describe('Integração com Sistema Existente', () => {
  
  it('deve integrar com sistema de estilo existente', () => {
    const hybridScore = MatchScoreCalculator.calculateMatchScore(
      mockUserProfile,
      mockTargetProfile
    );
    
    // Verificar se scores de estilo ainda funcionam
    expect(hybridScore.dimensionScores.style).toBeGreaterThanOrEqual(0);
    expect(hybridScore.dimensionScores.style).toBeLessThanOrEqual(100);
    
    // Verificar se score emocional foi integrado
    expect(hybridScore.dimensionScores.emotional).toBeGreaterThanOrEqual(0);
    expect(hybridScore.dimensionScores.emotional).toBeLessThanOrEqual(100);
    
    // Score geral deve refletir ambas as dimensões
    expect(hybridScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(hybridScore.overallScore).toBeLessThanOrEqual(100);
  });
  
  it('deve manter compatibilidade com interface existente', () => {
    // Verificar se MatchScore ainda tem campos esperados
    const matchScore = MatchScoreCalculator.calculateMatchScore(
      mockUserProfile,
      mockTargetProfile
    );
    
    expect(matchScore.userId).toBeDefined();
    expect(matchScore.targetUserId).toBeDefined();
    expect(matchScore.overallScore).toBeDefined();
    expect(matchScore.calculatedAt).toBeDefined();
    expect(matchScore.algorithm).toBe('hybrid');
  });
});

// =====================================================
// HELPER FUNCTIONS PARA TESTES
// =====================================================

function createMockQuestionnaire(type: 'complete' | 'partial' | 'inconsistent' = 'complete') {
  const base = {
    'energy_energy_general': 75,
    'energy_energy_social': 80,
    'openness_openness_general': 70,
    'stability_emotional_stability': 75,
    'social_extroversion': 60
  };
  
  switch (type) {
    case 'partial':
      return {
        'energy_energy_general': 75,
        'openness_openness_general': 70
      };
    
    case 'inconsistent':
      return {
        ...base,
        'energy_energy_general': 90,
        'energy_energy_social': 20, // Inconsistente
        'stability_emotional_stability': 95,
        'social_extroversion': 10   // Muito inconsistente
      };
    
    default:
      return base;
  }
}