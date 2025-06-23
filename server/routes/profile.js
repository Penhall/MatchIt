// server/routes/profile.js - Rotas de perfil com endpoints de estilo corrigidos
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ProfileService } from '../services/profileService.js';
import { logger } from '../utils/helpers.js';

const router = express.Router();
const profileService = new ProfileService();

// =====================================================
// ENDPOINTS DE PREFERÊNCIAS DE ESTILO (FASE 0)
// =====================================================

/**
 * GET /api/profile/style-preferences
 * Busca as preferências de estilo do usuário autenticado
 */
router.get('/style-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`[StylePreferences] Usuário não autenticado - req.user:`, req.user);
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    logger.info(`[StylePreferences] Buscando preferências de estilo para userId: ${userId}`);
    
    // Buscar preferências de estilo do usuário
    const stylePreferences = await profileService.getStyleChoicesByUserId(userId);
    
    // Estruturar resposta no formato esperado pelo frontend
    const formattedPreferences = {
      userId: userId,
      preferences: stylePreferences || [],
      completionStatus: {
        completed: (stylePreferences && stylePreferences.length > 0),
        totalQuestions: 25, // Valor padrão ou calculado
        answeredQuestions: stylePreferences ? stylePreferences.length : 0
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.status(200).json(formattedPreferences);
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao buscar preferências: ${error.message}`);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar preferências de estilo',
      code: 'STYLE_PREFERENCES_FETCH_ERROR',
      details: error.message
    });
  }
});

/**
 * PUT /api/profile/style-preferences
 * Atualiza uma única preferência de estilo do usuário
 */
router.put('/style-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`[StylePreferences] Usuário não autenticado em updateStylePreference`);
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    const { category, questionId, selectedOption } = req.body;
    
    // Validação dos dados obrigatórios
    if (!category || !questionId || selectedOption === undefined) {
      return res.status(400).json({ 
        error: 'Dados incompletos: category, questionId e selectedOption são obrigatórios',
        code: 'VALIDATION_ERROR',
        required: ['category', 'questionId', 'selectedOption'],
        received: { category, questionId, selectedOption }
      });
    }

    logger.info(`[StylePreferences] Atualizando preferência - userId: ${userId}`, { 
      category, 
      questionId, 
      selectedOption 
    });
    
    // Atualizar preferência via serviço
    const updatedPreference = await profileService.updateStyleChoice(userId, { 
      category, 
      questionId, 
      selectedOption 
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Preferência de estilo atualizada com sucesso',
      data: updatedPreference,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao atualizar preferência: ${error.message}`);
    
    // Tratamento específico de erros
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (error.message.includes('invalid')) {
      return res.status(400).json({ 
        error: 'Dados inválidos fornecidos',
        code: 'INVALID_DATA',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor ao atualizar preferência',
      code: 'STYLE_PREFERENCE_UPDATE_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/profile/style-preferences/batch
 * Atualiza múltiplas preferências de estilo de uma vez
 */
router.post('/style-preferences/batch', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    const { preferences } = req.body;
    
    if (!Array.isArray(preferences)) {
      return res.status(400).json({ 
        error: 'Preferences deve ser um array',
        code: 'VALIDATION_ERROR'
      });
    }

    logger.info(`[StylePreferences] Atualizando ${preferences.length} preferências em lote - userId: ${userId}`);
    
    const results = [];
    const errors = [];
    
    // Processar cada preferência
    for (const pref of preferences) {
      try {
        const { category, questionId, selectedOption } = pref;
        
        if (!category || !questionId || selectedOption === undefined) {
          errors.push({
            preference: pref,
            error: 'Dados incompletos'
          });
          continue;
        }
        
        const updated = await profileService.updateStyleChoice(userId, {
          category,
          questionId,
          selectedOption
        });
        
        results.push(updated);
        
      } catch (error) {
        errors.push({
          preference: pref,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `${results.length} preferências atualizadas com sucesso`,
      updated: results.length,
      errors: errors.length,
      data: {
        successful: results,
        failed: errors
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro no update em lote: ${error.message}`);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'BATCH_UPDATE_ERROR',
      details: error.message
    });
  }
});

/**
 * DELETE /api/profile/style-preferences
 * Remove todas as preferências de estilo do usuário
 */
router.delete('/style-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    logger.info(`[StylePreferences] Removendo todas as preferências - userId: ${userId}`);
    
    await profileService.clearStyleChoices(userId);
    
    res.status(200).json({
      success: true,
      message: 'Todas as preferências de estilo foram removidas',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao remover preferências: ${error.message}`);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'STYLE_PREFERENCES_DELETE_ERROR',
      details: error.message
    });
  }
});

// =====================================================
// ENDPOINTS DE PERFIL EXISTENTES (mantidos)
// =====================================================

const profileController = {
  getProfile: async (req, res) => {
    try {
      const userIdToFetch = req.params.userId || req.user?.id;
      if (!userIdToFetch) {
        return res.status(401).json({ message: 'Usuário não autenticado ou ID do perfil não especificado.' });
      }
      
      logger.info(`[ProfileRoutes] Buscando perfil para userId: ${userIdToFetch}`);
      const profile = await profileService.getProfileByUserId(userIdToFetch);

      if (!profile) {
        return res.status(404).json({ message: 'Perfil não encontrado.' });
      }
      
      res.json(profile);
    } catch (error) {
      logger.error(`[ProfileRoutes] Erro na rota getProfile: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar perfil.', error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        logger.error(`[ProfileRoutes] Usuário não autenticado - req.user:`, req.user);
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      logger.info(`[ProfileRoutes] Atualizando perfil para userId: ${userId}`, req.body);
      const updatedProfile = await profileService.updateUserProfile(userId, req.body);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Perfil não encontrado após tentativa de atualização.' });
      }
      res.json({ message: 'Perfil atualizado com sucesso.', data: updatedProfile });
    } catch (error) {
      logger.error(`[ProfileRoutes] Erro na rota updateProfile: ${error.message}`);
      res.status(500).json({ message: 'Erro ao atualizar perfil.', error: error.message });
    }
  }
};

// =====================================================
// DEFINIÇÃO DAS ROTAS
// =====================================================

// ORDEM CRÍTICA: Rotas específicas ANTES das rotas com parâmetros
router.put('/', authenticateToken, profileController.updateProfile);
router.get('/:userId?', authenticateToken, profileController.getProfile);

export default router;