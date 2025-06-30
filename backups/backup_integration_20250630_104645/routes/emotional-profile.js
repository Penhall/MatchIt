// routes/emotional-profile.js - Endpoints para Perfil Emocional

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { EmotionalProfileService } = require('../services/recommendation/emotional-profile-service');

// =====================================================
// VALIDAÇÕES DE SCHEMA
// =====================================================

const emotionalProfileSchema = {
  type: 'object',
  properties: {
    responses: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9_]+$': {
          oneOf: [
            { type: 'number', minimum: 0, maximum: 100 },
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ]
        }
      }
    },
    version: {
      type: 'string',
      default: '1.0'
    }
  },
  required: ['responses'],
  additionalProperties: false
};

const moodEntrySchema = {
  type: 'object',
  properties: {
    mood: { type: 'number', minimum: 0, maximum: 100 },
    energy: { type: 'number', minimum: 0, maximum: 100 },
    stress: { type: 'number', minimum: 0, maximum: 100 },
    context: { type: 'string', maxLength: 200 },
    activities: { 
      type: 'array', 
      items: { type: 'string' },
      maxItems: 10 
    },
    social: { type: 'boolean' },
    weather: { type: 'string', maxLength: 50 },
    sleep: { type: 'number', minimum: 0, maximum: 24 },
    exercise: { type: 'boolean' }
  },
  required: ['mood', 'energy', 'stress'],
  additionalProperties: false
};

// =====================================================
// ENDPOINTS PRINCIPAIS
// =====================================================

/**
 * POST /api/emotional-profile
 * Criar ou atualizar perfil emocional completo
 */
router.post('/', 
  authMiddleware,
  validateRequest(emotionalProfileSchema),
  async (req, res) => {
    try {
      const { responses, version } = req.body;
      const userId = req.user.id;

      // Verificar se usuário já tem perfil emocional
      const existingProfile = await getExistingEmotionalProfile(userId);
      
      if (existingProfile) {
        // Atualizar perfil existente
        const updatedProfile = await updateEmotionalProfile(userId, responses, version);
        return res.json({
          success: true,
          data: updatedProfile,
          message: 'Perfil emocional atualizado com sucesso'
        });
      } else {
        // Criar novo perfil
        const newProfile = await createEmotionalProfile(userId, responses, version);
        return res.status(201).json({
          success: true,
          data: newProfile,
          message: 'Perfil emocional criado com sucesso'
        });
      }

    } catch (error) {
      console.error('Erro ao processar perfil emocional:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/emotional-profile
 * Obter perfil emocional do usuário
 */
router.get('/', 
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const profile = await getEmotionalProfile(userId);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Perfil emocional não encontrado'
        });
      }

      // Verificar se precisa de atualização
      const needsUpdate = checkIfNeedsUpdate(profile);
      
      res.json({
        success: true,
        data: profile,
        metadata: {
          needsUpdate,
          completeness: profile.completeness,
          lastUpdated: profile.updatedAt
        }
      });

    } catch (error) {
      console.error('Erro ao buscar perfil emocional:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/emotional-profile/summary
 * Obter resumo do perfil emocional (para exibição pública)
 */
router.get('/summary', 
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const profile = await getEmotionalProfile(userId);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Perfil emocional não encontrado'
        });
      }

      // Retornar apenas dados não sensíveis
      const summary = {
        energyLevel: profile.energyLevel,
        openness: profile.openness,
        emotionalStability: profile.emotionalStability,
        extroversion: profile.extroversion,
        attachmentStyle: profile.attachmentStyle,
        communicationStyle: profile.communicationStyle,
        dominantEmotions: profile.dominantEmotions.slice(0, 3), // Apenas top 3
        completeness: profile.completeness,
        lastUpdated: profile.updatedAt
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Erro ao buscar resumo emocional:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * POST /api/emotional-profile/mood
 * Adicionar entrada de humor
 */
router.post('/mood',
  authMiddleware,
  validateRequest(moodEntrySchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const moodData = req.body;

      const moodEntry = await addMoodEntry(userId, moodData);
      
      // Atualizar médias no perfil emocional
      await updateMoodAverages(userId);

      res.status(201).json({
        success: true,
        data: moodEntry,
        message: 'Entrada de humor registrada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao registrar humor:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/emotional-profile/mood/history
 * Obter histórico de humor
 */
router.get('/mood/history',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { days = 30, limit = 100 } = req.query;

      const history = await getMoodHistory(userId, parseInt(days), parseInt(limit));
      const trends = await analyzeMoodTrends(history);

      res.json({
        success: true,
        data: {
          entries: history,
          trends,
          summary: {
            totalEntries: history.length,
            averageMood: trends.averageMood,
            moodStability: trends.stability,
            recentTrend: trends.recentTrend
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar histórico de humor:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/emotional-profile/compatibility/:targetUserId
 * Calcular compatibilidade emocional com outro usuário
 */
router.get('/compatibility/:targetUserId',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.params;

      // Verificar se target user existe e tem perfil emocional público
      const targetProfile = await getPublicEmotionalProfile(targetUserId);
      if (!targetProfile) {
        return res.status(404).json({
          success: false,
          error: 'Perfil emocional do usuário alvo não encontrado ou privado'
        });
      }

      const userProfile = await getEmotionalProfile(userId);
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'Você precisa completar seu perfil emocional primeiro'
        });
      }

      // Calcular compatibilidade
      const compatibility = await calculateEmotionalCompatibility(userProfile, targetProfile);

      res.json({
        success: true,
        data: compatibility,
        metadata: {
          userProfileCompleteness: userProfile.completeness,
          targetProfileCompleteness: targetProfile.completeness,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Erro ao calcular compatibilidade emocional:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * DELETE /api/emotional-profile
 * Deletar perfil emocional (GDPR compliance)
 */
router.delete('/',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      await deleteEmotionalProfile(userId);
      
      res.json({
        success: true,
        message: 'Perfil emocional deletado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar perfil emocional:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/emotional-profile/questionnaire
 * Obter perguntas do questionário emocional
 */
router.get('/questionnaire',
  authMiddleware,
  async (req, res) => {
    try {
      const { version = '1.0', section } = req.query;
      
      const questionnaire = await getEmotionalQuestionnaire(version, section);
      
      res.json({
        success: true,
        data: questionnaire
      });

    } catch (error) {
      console.error('Erro ao buscar questionário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// =====================================================
// FUNÇÕES AUXILIARES (IMPLEMENTAR LÓGICA DE BANCO)
// =====================================================

async function createEmotionalProfile(userId, responses, version) {
  try {
    // Criar perfil usando o serviço
    const profile = EmotionalProfileService.createEmotionalProfile(userId, responses);
    
    // Salvar no banco de dados
    const savedProfile = await saveEmotionalProfileToDatabase(profile);
    
    // Log para analytics
    await logEmotionalProfileEvent('profile_created', userId, {
      version,
      completeness: profile.completeness
    });
    
    return savedProfile;
    
  } catch (error) {
    throw new Error(`Erro ao criar perfil emocional: ${error.message}`);
  }
}

async function updateEmotionalProfile(userId, responses, version) {
  try {
    // Buscar perfil existente
    const existingProfile = await getEmotionalProfile(userId);
    
    // Atualizar com novas respostas
    const updatedProfile = EmotionalProfileService.createEmotionalProfile(userId, {
      ...existingProfile.responses || {},
      ...responses
    });
    
    // Manter histórico de versões
    await saveProfileVersion(userId, existingProfile);
    
    // Salvar nova versão
    const savedProfile = await saveEmotionalProfileToDatabase(updatedProfile);
    
    // Log para analytics
    await logEmotionalProfileEvent('profile_updated', userId, {
      version,
      previousCompleteness: existingProfile.completeness,
      newCompleteness: updatedProfile.completeness
    });
    
    return savedProfile;
    
  } catch (error) {
    throw new Error(`Erro ao atualizar perfil emocional: ${error.message}`);
  }
}

async function getEmotionalProfile(userId) {
  // Implementar busca no banco de dados
  const query = `
    SELECT * FROM emotional_profiles 
    WHERE user_id = $1 AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  
  const result = await database.query(query, [userId]);
  return result.rows[0] || null;
}

async function getPublicEmotionalProfile(userId) {
  // Buscar apenas perfis que permitem compatibilidade pública
  const query = `
    SELECT * FROM emotional_profiles 
    WHERE user_id = $1 AND is_active = true AND is_public = true
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  
  const result = await database.query(query, [userId]);
  return result.rows[0] || null;
}

async function getExistingEmotionalProfile(userId) {
  return await getEmotionalProfile(userId);
}

async function saveEmotionalProfileToDatabase(profile) {
  const query = `
    INSERT INTO emotional_profiles (
      id, user_id, version, energy_level, social_energy, physical_energy, mental_energy,
      openness, vulnerability, emotional_expression, empathy_level,
      emotional_stability, stress_resilience, self_control, adaptability,
      extroversion, social_confidence, group_orientation, intimacy_comfort,
      achievement_drive, competitiveness, goal_orientation, risk_tolerance,
      dominant_emotions, emotional_patterns, emotional_triggers, emotional_needs,
      mood_history, average_mood, mood_stability,
      attachment_style, communication_style, conflict_style, love_language,
      emotional_preferences, deal_breakers,
      completeness, confidence, data_quality,
      created_at, updated_at, last_questionnaire, next_update_due,
      is_active, is_public, privacy_level
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      version = EXCLUDED.version,
      energy_level = EXCLUDED.energy_level,
      -- ... todos os outros campos
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;
  
  const values = [
    profile.id, profile.userId, profile.version,
    profile.energyLevel, profile.socialEnergy, profile.physicalEnergy, profile.mentalEnergy,
    profile.openness, profile.vulnerability, profile.emotionalExpression, profile.empathyLevel,
    profile.emotionalStability, profile.stressResilience, profile.selfControl, profile.adaptability,
    profile.extroversion, profile.socialConfidence, profile.groupOrientation, profile.intimacyComfort,
    profile.achievementDrive, profile.competitiveness, profile.goalOrientation, profile.riskTolerance,
    JSON.stringify(profile.dominantEmotions), JSON.stringify(profile.emotionalPatterns),
    JSON.stringify(profile.emotionalTriggers), JSON.stringify(profile.emotionalNeeds),
    JSON.stringify(profile.moodHistory), profile.averageMood, profile.moodStability,
    profile.attachmentStyle, profile.communicationStyle, profile.conflictStyle,
    JSON.stringify(profile.loveLanguage), JSON.stringify(profile.emotionalPreferences),
    JSON.stringify(profile.dealBreakers), profile.completeness, profile.confidence,
    JSON.stringify(profile.dataQuality), profile.createdAt, profile.updatedAt,
    profile.lastQuestionnaire, profile.nextUpdateDue, profile.isActive, profile.isPublic, profile.privacyLevel
  ];
  
  const result = await database.query(query, values);
  return result.rows[0];
}

async function addMoodEntry(userId, moodData) {
  const query = `
    INSERT INTO mood_entries (
      id, user_id, mood, energy, stress, context, activities, social, weather, sleep, exercise,
      timestamp, source, confidence
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `;
  
  const values = [
    `mood_${userId}_${Date.now()}`, userId, moodData.mood, moodData.energy, moodData.stress,
    moodData.context, JSON.stringify(moodData.activities || []), moodData.social || false,
    moodData.weather, moodData.sleep, moodData.exercise || false,
    new Date(), 'manual', 100
  ];
  
  const result = await database.query(query, values);
  return result.rows[0];
}

async function getMoodHistory(userId, days, limit) {
  const query = `
    SELECT * FROM mood_entries 
    WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
    ORDER BY timestamp DESC
    LIMIT $2
  `;
  
  const result = await database.query(query, [userId, limit]);
  return result.rows;
}

async function analyzeMoodTrends(history) {
  if (history.length === 0) {
    return {
      averageMood: 50,
      stability: 50,
      recentTrend: 'stable'
    };
  }
  
  const moods = history.map(entry => entry.mood);
  const averageMood = moods.reduce((a, b) => a + b, 0) / moods.length;
  
  // Calcular estabilidade (menor variância = maior estabilidade)
  const variance = moods.reduce((acc, mood) => acc + Math.pow(mood - averageMood, 2), 0) / moods.length;
  const stability = Math.max(0, 100 - Math.sqrt(variance) * 2);
  
  // Calcular tendência recente (últimos 7 dias vs 7 dias anteriores)
  const recent = moods.slice(0, 7);
  const previous = moods.slice(7, 14);
  
  let recentTrend = 'stable';
  if (recent.length > 0 && previous.length > 0) {
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    if (recentAvg > previousAvg + 5) recentTrend = 'improving';
    else if (recentAvg < previousAvg - 5) recentTrend = 'declining';
  }
  
  return {
    averageMood: Math.round(averageMood),
    stability: Math.round(stability),
    recentTrend
  };
}

async function updateMoodAverages(userId) {
  // Atualizar médias de humor no perfil emocional
  const recentMoods = await getMoodHistory(userId, 30, 100);
  const trends = await analyzeMoodTrends(recentMoods);
  
  const query = `
    UPDATE emotional_profiles 
    SET average_mood = $1, mood_stability = $2, updated_at = NOW()
    WHERE user_id = $3
  `;
  
  await database.query(query, [trends.averageMood, trends.stability, userId]);
}

async function calculateEmotionalCompatibility(userProfile, targetProfile) {
  return EmotionalProfileService.calculateEmotionalCompatibility(userProfile, targetProfile);
}

async function deleteEmotionalProfile(userId) {
  const query = `
    UPDATE emotional_profiles 
    SET is_active = false, deleted_at = NOW()
    WHERE user_id = $1
  `;
  
  await database.query(query, [userId]);
  
  // Também deletar entradas de humor
  const moodQuery = `
    DELETE FROM mood_entries WHERE user_id = $1
  `;
  
  await database.query(moodQuery, [userId]);
}

async function getEmotionalQuestionnaire(version, section) {
  // Retornar estrutura do questionário
  // (implementar baseado na estrutura definida na tela)
  return {
    version,
    sections: [
      // Estrutura do questionário definida na tela
    ]
  };
}

async function saveProfileVersion(userId, profile) {
  // Salvar versão anterior para histórico
  const query = `
    INSERT INTO emotional_profile_history (user_id, profile_data, created_at)
    VALUES ($1, $2, NOW())
  `;
  
  await database.query(query, [userId, JSON.stringify(profile)]);
}

async function logEmotionalProfileEvent(event, userId, data) {
  // Log para analytics
  console.log(`Emotional Profile Event: ${event}`, { userId, data });
}

function checkIfNeedsUpdate(profile) {
  if (!profile.nextUpdateDue) return false;
  return new Date() > new Date(profile.nextUpdateDue);
}

module.exports = router;