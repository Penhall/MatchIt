// server/routes/profile/emotional-profile.js - Rotas para perfil emocional (ES Modules)
import express from 'express';
import pool from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { logger } from '../../middleware/logger.js';
import { emotionalProfileService } from '../../services/recommendation/emotional-profile-service.js';

const router = express.Router();

// ==============================================
// CONSTANTES E CONFIGURAÇÕES
// ==============================================

const EMOTIONAL_QUESTIONNAIRE = {
  id: 'emotional_profile_v1',
  version: '1.0.0',
  estimatedTime: 15,
  sections: [
    {
      id: 'dominant_emotions',
      title: 'Suas Emoções Dominantes',
      description: 'Como você normalmente se sente?',
      questions: [
        {
          id: 'q_happiness',
          type: 'scale',
          question: 'Com que frequência você se sente genuinamente feliz?',
          description: 'Pense em momentos de alegria real, não apenas contentamento.',
          scale: { min: 1, max: 10, labels: ['Raramente', 'Frequentemente'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_enthusiasm',
          type: 'scale', 
          question: 'Quão empolgado você fica com novas experiências?',
          scale: { min: 1, max: 10, labels: ['Pouco empolgado', 'Muito empolgado'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_satisfaction',
          type: 'scale',
          question: 'Quão satisfeito você se sente com sua vida?',
          scale: { min: 1, max: 10, labels: ['Insatisfeito', 'Muito satisfeito'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_calmness',
          type: 'scale',
          question: 'Com que frequência você se sente em paz consigo mesmo?',
          scale: { min: 1, max: 10, labels: ['Raramente', 'Frequentemente'] },
          required: true,
          weight: 1.0
        }
      ]
    },
    {
      id: 'emotional_intensity',
      title: 'Intensidade Emocional',
      description: 'Quão intensamente você sente as coisas?',
      questions: [
        {
          id: 'q_emotion_strength',
          type: 'scale',
          question: 'Quando você sente algo, a intensidade costuma ser:',
          scale: { min: 1, max: 10, labels: ['Sutil', 'Muito intensa'] },
          required: true,
          weight: 1.5
        },
        {
          id: 'q_reaction_intensity',
          type: 'scale',
          question: 'Suas reações emocionais costumam ser:',
          scale: { min: 1, max: 10, labels: ['Controladas', 'Expressivas'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_feeling_depth',
          type: 'scale',
          question: 'Você sente as coisas de forma:',
          scale: { min: 1, max: 10, labels: ['Superficial', 'Profunda'] },
          required: true,
          weight: 1.2
        }
      ]
    },
    {
      id: 'emotional_stability',
      title: 'Estabilidade Emocional',
      description: 'Como você lida com suas emoções?',
      questions: [
        {
          id: 'q_mood_swings',
          type: 'scale',
          question: 'Com que frequência seu humor muda rapidamente?',
          description: 'Respostas altas indicam mudanças frequentes.',
          scale: { min: 1, max: 10, labels: ['Nunca', 'Constantemente'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_emotional_control',
          type: 'scale',
          question: 'Quão bem você consegue controlar suas emoções quando necessário?',
          scale: { min: 1, max: 10, labels: ['Pouco controle', 'Muito controle'] },
          required: true,
          weight: 1.3
        },
        {
          id: 'q_stress_management',
          type: 'scale',
          question: 'Como você lida com situações estressantes?',
          scale: { min: 1, max: 10, labels: ['Com dificuldade', 'Muito bem'] },
          required: true,
          weight: 1.2
        }
      ]
    },
    {
      id: 'social_energy',
      title: 'Energia Social',
      description: 'Como você se relaciona com outras pessoas?',
      questions: [
        {
          id: 'q_social_preference',
          type: 'scale',
          question: 'Você prefere estar com pessoas ou sozinho?',
          scale: { min: 1, max: 10, labels: ['Sempre sozinho', 'Sempre com pessoas'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_group_vs_alone',
          type: 'scale',
          question: 'Em grupos grandes, você se sente:',
          scale: { min: 1, max: 10, labels: ['Desconfortável', 'Energizado'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_conversation_style',
          type: 'single_choice',
          question: 'Em conversas, você prefere:',
          options: [
            { id: 'deep', label: 'Conversas profundas e íntimas', value: 'deep' },
            { id: 'light', label: 'Conversas leves e divertidas', value: 'light' },
            { id: 'balanced', label: 'Depende do momento e pessoa', value: 'balanced' }
          ],
          required: true,
          weight: 1.0
        }
      ]
    },
    {
      id: 'communication_empathy',
      title: 'Comunicação e Empatia',
      description: 'Como você se comunica e se conecta emocionalmente?',
      questions: [
        {
          id: 'q_sharing_feelings',
          type: 'scale',
          question: 'Com que facilidade você compartilha seus sentimentos?',
          scale: { min: 1, max: 10, labels: ['Muito reservado', 'Muito aberto'] },
          required: true,
          weight: 1.2
        },
        {
          id: 'q_others_feelings',
          type: 'scale',
          question: 'Quão facilmente você percebe os sentimentos dos outros?',
          scale: { min: 1, max: 10, labels: ['Dificilmente', 'Muito facilmente'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_emotional_support',
          type: 'scale',
          question: 'Quando alguém está mal, você:',
          scale: { min: 1, max: 10, labels: ['Oferece soluções', 'Oferece suporte emocional'] },
          required: true,
          weight: 1.0
        },
        {
          id: 'q_decision_making',
          type: 'single_choice',
          question: 'Ao tomar decisões importantes, você:',
          options: [
            { id: 'logical', label: 'Analisa logicamente os fatos', value: 'logical' },
            { id: 'intuitive', label: 'Segue sua intuição', value: 'intuitive' },
            { id: 'balanced', label: 'Combina lógica e intuição', value: 'balanced' }
          ],
          required: true,
          weight: 1.1
        }
      ]
    },
    {
      id: 'current_mood',
      title: 'Estado Atual',
      description: 'Como você está se sentindo hoje?',
      questions: [
        {
          id: 'q_current_mood',
          type: 'single_choice',
          question: 'Qual palavra melhor descreve seu humor hoje?',
          options: [
            { id: 'joy', label: 'Alegre e otimista', value: 'joy' },
            { id: 'contentment', label: 'Satisfeito e em paz', value: 'contentment' },
            { id: 'excitement', label: 'Empolgado e energético', value: 'excitement' },
            { id: 'calmness', label: 'Calmo e tranquilo', value: 'calmness' },
            { id: 'confidence', label: 'Confiante e determinado', value: 'confidence' },
            { id: 'melancholy', label: 'Reflexivo e nostálgico', value: 'melancholy' }
          ],
          required: true,
          weight: 0.8
        },
        {
          id: 'q_current_energy',
          type: 'scale',
          question: 'Qual seu nível de energia hoje?',
          scale: { min: 1, max: 10, labels: ['Muito baixo', 'Muito alto'] },
          required: true,
          weight: 0.6
        },
        {
          id: 'q_social_desire',
          type: 'scale',
          question: 'Quanta vontade você tem de socializar hoje?',
          scale: { min: 1, max: 10, labels: ['Nenhuma', 'Muita'] },
          required: true,
          weight: 0.6
        },
        {
          id: 'q_romantic_openness',
          type: 'scale',
          question: 'Quão aberto você está para conexões românticas hoje?',
          scale: { min: 1, max: 10, labels: ['Não muito', 'Muito aberto'] },
          required: true,
          weight: 0.8
        }
      ]
    }
  ]
};

// ==============================================
// ROTAS
// ==============================================

/**
 * GET /api/profile/emotional
 * Busca perfil emocional do usuário
 */
router.get('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[EmotionalProfile] Buscando perfil emocional para usuário ${userId}`);
    
    // Buscar perfil emocional do banco
    const profileQuery = `
      SELECT 
        id,
        emotional_profile,
        emotional_responses,
        created_at,
        updated_at
      FROM user_profiles 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(profileQuery, [userId]);
    
    if (result.rows.length === 0 || !result.rows[0].emotional_profile) {
      logger.info(`[EmotionalProfile] Perfil emocional não encontrado para usuário ${userId}`);
      
      // Retornar perfil vazio
      const emptyProfile = {
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
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        metadata: {
          profileId: `emotional_${userId}_empty`,
          userId,
          version: 0,
          completedAt: null,
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
      
      return res.json({
        success: true,
        data: {
          userId,
          emotionalProfile: emptyProfile,
          hasProfile: false,
          needsQuestionnaire: true
        },
        processingTime: Date.now() - startTime
      });
    }
    
    const profile = result.rows[0];
    const emotionalProfile = profile.emotional_profile;
    
    // Verificar se o mood profile está expirado
    const moodProfile = emotionalProfile.currentMoodProfile;
    const moodExpired = moodProfile && new Date(moodProfile.validUntil) < new Date();
    
    logger.info(`[EmotionalProfile] Perfil encontrado para usuário ${userId}, completude: ${emotionalProfile.metadata?.completionStatus?.completionPercentage || 0}%`);
    
    res.json({
      success: true,
      data: {
        userId,
        emotionalProfile,
        hasProfile: true,
        needsQuestionnaire: false,
        moodExpired,
        metadata: {
          profileId: profile.id,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        }
      },
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[EmotionalProfile] Erro ao buscar perfil: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar perfil emocional',
      code: 'FETCH_EMOTIONAL_PROFILE_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * GET /api/profile/emotional/questionnaire
 * Retorna questionário emocional
 */
router.get('/questionnaire', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[EmotionalProfile] Fornecendo questionário para usuário ${userId}`);
    
    // Buscar respostas existentes (se houver)
    const responsesQuery = `
      SELECT emotional_responses 
      FROM user_profiles 
      WHERE user_id = $1 AND emotional_responses IS NOT NULL
    `;
    
    const responsesResult = await pool.query(responsesQuery, [userId]);
    const existingResponses = responsesResult.rows.length > 0 ? responsesResult.rows[0].emotional_responses : [];
    
    // Calcular progresso
    const totalQuestions = EMOTIONAL_QUESTIONNAIRE.sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = existingResponses.length;
    const progress = {
      completed: answeredQuestions,
      total: totalQuestions,
      percentage: Math.round((answeredQuestions / totalQuestions) * 100)
    };
    
    res.json({
      success: true,
      data: {
        questionnaire: EMOTIONAL_QUESTIONNAIRE,
        existingResponses,
        progress,
        resumeFromSection: this.findResumeSection(existingResponses, EMOTIONAL_QUESTIONNAIRE)
      },
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[EmotionalProfile] Erro ao fornecer questionário: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao fornecer questionário',
      code: 'FETCH_QUESTIONNAIRE_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * POST /api/profile/emotional/responses
 * Processa respostas do questionário e gera perfil emocional
 */
router.post('/responses', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { responses, partial = false } = req.body;
    
    logger.info(`[EmotionalProfile] Processando ${responses.length} respostas para usuário ${userId} (partial: ${partial})`);
    
    // Validar respostas
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Respostas devem ser um array não vazio',
        code: 'INVALID_RESPONSES',
        processingTime: Date.now() - startTime
      });
    }

    // Salvar respostas no banco (mesmo se parciais)
    const saveResponsesQuery = `
      UPDATE user_profiles 
      SET emotional_responses = $2, updated_at = NOW()
      WHERE user_id = $1
    `;
    
    // Se não existe perfil, criar um
    const checkQuery = 'SELECT id FROM user_profiles WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      const createQuery = `
        INSERT INTO user_profiles (user_id, emotional_responses, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id
      `;
      await pool.query(createQuery, [userId, JSON.stringify(responses)]);
      logger.info(`[EmotionalProfile] Perfil criado para usuário ${userId}`);
    } else {
      await pool.query(saveResponsesQuery, [userId, JSON.stringify(responses)]);
      logger.info(`[EmotionalProfile] Respostas salvas para usuário ${userId}`);
    }

    // Se são respostas parciais, apenas salvar e retornar progresso
    if (partial) {
      const totalQuestions = EMOTIONAL_QUESTIONNAIRE.sections.reduce((sum, section) => sum + section.questions.length, 0);
      const progress = {
        completed: responses.length,
        total: totalQuestions,
        percentage: Math.round((responses.length / totalQuestions) * 100)
      };
      
      return res.json({
        success: true,
        data: {
          saved: true,
          progress,
          message: 'Respostas parciais salvas com sucesso'
        },
        processingTime: Date.now() - startTime
      });
    }

    // Processar respostas completas e gerar perfil
    const analysisResult = await emotionalProfileService.generateEmotionalProfile(userId, responses);
    
    // Salvar perfil emocional no banco
    const updateProfileQuery = `
      UPDATE user_profiles 
      SET 
        emotional_profile = $2,
        emotional_responses = $3,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, updated_at
    `;
    
    const updateResult = await pool.query(updateProfileQuery, [
      userId, 
      JSON.stringify(analysisResult.emotionalProfile),
      JSON.stringify(responses)
    ]);
    
    logger.info(`[EmotionalProfile] Perfil emocional gerado e salvo para usuário ${userId} (${analysisResult.processingTime}ms)`);
    
    res.json({
      success: true,
      data: {
        emotionalProfile: analysisResult.emotionalProfile,
        insights: analysisResult.insights,
        recommendations: analysisResult.recommendations,
        metadata: {
          profileId: updateResult.rows[0].id,
          updatedAt: updateResult.rows[0].updated_at,
          analysisTime: analysisResult.processingTime
        }
      },
      message: 'Perfil emocional gerado com sucesso!',
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[EmotionalProfile] Erro ao processar respostas: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao processar respostas',
      code: 'PROCESS_RESPONSES_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * PUT /api/profile/emotional
 * Atualiza perfil emocional manualmente
 */
router.put('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { emotionalProfile } = req.body;
    
    logger.info(`[EmotionalProfile] Atualizando perfil emocional para usuário ${userId}`);
    
    // Validar perfil emocional
    if (!emotionalProfile || typeof emotionalProfile !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Perfil emocional deve ser um objeto válido',
        code: 'INVALID_EMOTIONAL_PROFILE',
        processingTime: Date.now() - startTime
      });
    }

    // Atualizar timestamp
    emotionalProfile.metadata = {
      ...emotionalProfile.metadata,
      lastUpdatedAt: new Date(),
      version: (emotionalProfile.metadata?.version || 0) + 1
    };

    // Salvar no banco
    const updateQuery = `
      UPDATE user_profiles 
      SET emotional_profile = $2, updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, updated_at
    `;
    
    const result = await pool.query(updateQuery, [userId, JSON.stringify(emotionalProfile)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado',
        code: 'PROFILE_NOT_FOUND',
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info(`[EmotionalProfile] Perfil atualizado para usuário ${userId}`);
    
    res.json({
      success: true,
      data: {
        emotionalProfile,
        metadata: {
          profileId: result.rows[0].id,
          updatedAt: result.rows[0].updated_at
        }
      },
      message: 'Perfil emocional atualizado com sucesso',
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[EmotionalProfile] Erro ao atualizar perfil: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar perfil',
      code: 'UPDATE_EMOTIONAL_PROFILE_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * GET /api/profile/emotional/compatibility/:targetUserId
 * Calcula compatibilidade emocional com outro usuário
 */
router.get('/compatibility/:targetUserId', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    
    logger.info(`[EmotionalProfile] Calculando compatibilidade entre ${userId} e ${targetUserId}`);
    
    // Buscar perfis de ambos os usuários
    const profilesQuery = `
      SELECT user_id, emotional_profile
      FROM user_profiles 
      WHERE user_id = ANY($1) AND emotional_profile IS NOT NULL
    `;
    
    const profilesResult = await pool.query(profilesQuery, [[userId, targetUserId]]);
    
    if (profilesResult.rows.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Um ou ambos os usuários não possuem perfil emocional completo',
        code: 'MISSING_EMOTIONAL_PROFILES',
        processingTime: Date.now() - startTime
      });
    }
    
    const userProfile = profilesResult.rows.find(p => p.user_id === userId)?.emotional_profile;
    const targetProfile = profilesResult.rows.find(p => p.user_id === targetUserId)?.emotional_profile;
    
    // Calcular compatibilidade
    const compatibilityResult = await emotionalProfileService.calculateEmotionalCompatibility(
      userProfile, 
      targetProfile
    );
    
    logger.info(`[EmotionalProfile] Compatibilidade calculada: ${compatibilityResult.overallScore}% (${Date.now() - startTime}ms)`);
    
    res.json({
      success: true,
      data: compatibilityResult,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[EmotionalProfile] Erro ao calcular compatibilidade: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao calcular compatibilidade',
      code: 'CALCULATE_COMPATIBILITY_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * DELETE /api/profile/emotional
 * Remove perfil emocional
 */
router.delete('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[EmotionalProfile] Removendo perfil emocional para usuário ${userId}`);
    
    const query = `
      UPDATE user_profiles 
      SET 
        emotional_profile = NULL,
        emotional_responses = NULL,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, updated_at
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado',
        code: 'PROFILE_NOT_FOUND',
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info(`[EmotionalProfile] Perfil emocional removido para usuário ${userId}`);
    
    res.json({
      success: true,
      data: {
        userId,
        removed: true,
        metadata: {
          profileId: result.rows[0].id,
          updatedAt: result.rows[0].updated_at
        }
      },
      message: 'Perfil emocional removido com sucesso',
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[EmotionalProfile] Erro ao remover perfil: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao remover perfil',
      code: 'DELETE_EMOTIONAL_PROFILE_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

/**
 * Encontra a seção para continuar o questionário
 */
function findResumeSection(existingResponses, questionnaire) {
  if (!existingResponses || existingResponses.length === 0) {
    return questionnaire.sections[0].id;
  }
  
  const answeredQuestionIds = existingResponses.map(r => r.questionId);
  
  for (const section of questionnaire.sections) {
    const sectionQuestions = section.questions.map(q => q.id);
    const answeredInSection = sectionQuestions.filter(id => answeredQuestionIds.includes(id));
    
    // Se seção não está completamente respondida, retornar esta seção
    if (answeredInSection.length < sectionQuestions.length) {
      return section.id;
    }
  }
  
  // Todas as seções estão completas
  return null;
}

export default router;