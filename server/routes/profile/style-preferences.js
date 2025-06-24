// server/routes/profile/style-preferences.js - Endpoints para preferências de estilo
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { authenticateToken } = require('../../middleware/auth');
const { logger } = require('../../middleware/logger');

// ==============================================
// VALIDADORES E UTILITÁRIOS
// ==============================================

/**
 * Valida estrutura de preferências de estilo
 */
const validateStylePreferences = (preferences) => {
  const validCategories = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'];
  
  if (!preferences || typeof preferences !== 'object') {
    return { isValid: false, error: 'Preferências devem ser um objeto' };
  }
  
  for (const category of validCategories) {
    if (preferences[category]) {
      if (!Array.isArray(preferences[category])) {
        return { isValid: false, error: `${category} deve ser um array` };
      }
      
      // Validar que todos os valores são números
      if (!preferences[category].every(item => typeof item === 'number')) {
        return { isValid: false, error: `${category} deve conter apenas números` };
      }
    }
  }
  
  return { isValid: true };
};

/**
 * Sanitiza preferências removendo categorias inválidas
 */
const sanitizePreferences = (preferences) => {
  const validCategories = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'];
  const sanitized = {};
  
  validCategories.forEach(category => {
    if (preferences[category] && Array.isArray(preferences[category])) {
      // Filtrar apenas números válidos e remover duplicatas
      sanitized[category] = [...new Set(
        preferences[category].filter(item => 
          typeof item === 'number' && 
          item > 0 && 
          item <= 100 // Assumindo máximo de 100 opções por categoria
        )
      )];
    }
  });
  
  return sanitized;
};

// ==============================================
// ROTAS
// ==============================================

/**
 * GET /api/profile/style-preferences
 * Busca preferências de estilo do usuário
 */
router.get('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[StylePreferences] Buscando preferências para usuário ${userId}`);
    
    // Buscar perfil do usuário
    const userQuery = `
      SELECT 
        id,
        style_preferences,
        created_at,
        updated_at
      FROM user_profiles 
      WHERE user_id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      logger.info(`[StylePreferences] Perfil não encontrado para usuário ${userId}, criando vazio`);
      
      // Criar perfil vazio se não existir
      const createQuery = `
        INSERT INTO user_profiles (user_id, style_preferences, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, style_preferences, created_at, updated_at
      `;
      
      const emptyPreferences = {
        tenis: [],
        roupas: [],
        cores: [],
        hobbies: [],
        sentimentos: []
      };
      
      const createResult = await pool.query(createQuery, [userId, JSON.stringify(emptyPreferences)]);
      const profile = createResult.rows[0];
      
      return res.json({
        success: true,
        data: {
          userId,
          preferences: profile.style_preferences || emptyPreferences,
          completionStatus: {
            completed: false,
            totalCategories: 5,
            completedCategories: 0,
            completionPercentage: 0
          },
          metadata: {
            profileId: profile.id,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            isNew: true
          }
        },
        processingTime: Date.now() - startTime
      });
    }
    
    const profile = userResult.rows[0];
    const preferences = profile.style_preferences || {
      tenis: [],
      roupas: [],
      cores: [],
      hobbies: [],
      sentimentos: []
    };
    
    // Calcular status de completude
    const categories = Object.keys(preferences);
    const completedCategories = categories.filter(cat => 
      Array.isArray(preferences[cat]) && preferences[cat].length > 0
    ).length;
    
    const completionStatus = {
      completed: completedCategories === 5,
      totalCategories: 5,
      completedCategories,
      completionPercentage: Math.round((completedCategories / 5) * 100)
    };
    
    logger.info(`[StylePreferences] Preferências encontradas para usuário ${userId}, completude: ${completionStatus.completionPercentage}%`);
    
    res.json({
      success: true,
      data: {
        userId,
        preferences,
        completionStatus,
        metadata: {
          profileId: profile.id,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          isNew: false
        }
      },
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao buscar preferências: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar preferências',
      code: 'FETCH_PREFERENCES_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * PUT /api/profile/style-preferences
 * Atualiza preferências de estilo do usuário (completas)
 */
router.put('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { preferences } = req.body;
    
    logger.info(`[StylePreferences] Atualizando preferências para usuário ${userId}`);
    
    // Validar preferências
    const validation = validateStylePreferences(preferences);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        code: 'INVALID_PREFERENCES',
        processingTime: Date.now() - startTime
      });
    }
    
    // Sanitizar preferências
    const sanitizedPreferences = sanitizePreferences(preferences);
    
    // Verificar se perfil existe
    const checkQuery = 'SELECT id FROM user_profiles WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    let query, values, result;
    
    if (checkResult.rows.length === 0) {
      // Criar novo perfil
      query = `
        INSERT INTO user_profiles (user_id, style_preferences, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, style_preferences, updated_at
      `;
      values = [userId, JSON.stringify(sanitizedPreferences)];
      
      logger.info(`[StylePreferences] Criando novo perfil para usuário ${userId}`);
    } else {
      // Atualizar perfil existente
      query = `
        UPDATE user_profiles 
        SET style_preferences = $2, updated_at = NOW()
        WHERE user_id = $1
        RETURNING id, style_preferences, updated_at
      `;
      values = [userId, JSON.stringify(sanitizedPreferences)];
      
      logger.info(`[StylePreferences] Atualizando perfil existente para usuário ${userId}`);
    }
    
    result = await pool.query(query, values);
    const updatedProfile = result.rows[0];
    
    // Calcular estatísticas de completude
    const categories = Object.keys(sanitizedPreferences);
    const completedCategories = categories.filter(cat => 
      Array.isArray(sanitizedPreferences[cat]) && sanitizedPreferences[cat].length > 0
    ).length;
    
    const totalChoices = categories.reduce((sum, cat) => 
      sum + (sanitizedPreferences[cat]?.length || 0), 0
    );
    
    const completionStatus = {
      completed: completedCategories === 5,
      totalCategories: 5,
      completedCategories,
      completionPercentage: Math.round((completedCategories / 5) * 100),
      totalChoices,
      averageChoicesPerCategory: Math.round(totalChoices / 5)
    };
    
    logger.info(`[StylePreferences] Preferências atualizadas com sucesso para usuário ${userId}, completude: ${completionStatus.completionPercentage}%`);
    
    res.json({
      success: true,
      data: {
        userId,
        preferences: sanitizedPreferences,
        completionStatus,
        metadata: {
          profileId: updatedProfile.id,
          updatedAt: updatedProfile.updated_at,
          totalUpdates: 1
        }
      },
      message: `Preferências atualizadas com sucesso (${completedCategories}/5 categorias completas)`,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao atualizar preferências: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar preferências',
      code: 'UPDATE_PREFERENCES_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * PATCH /api/profile/style-preferences/:category
 * Atualiza preferência de uma categoria específica
 */
router.patch('/:category', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const { choices } = req.body;
    
    // Validar categoria
    const validCategories = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Categoria inválida. Categorias válidas: ${validCategories.join(', ')}`,
        code: 'INVALID_CATEGORY',
        processingTime: Date.now() - startTime
      });
    }
    
    // Validar choices
    if (!Array.isArray(choices)) {
      return res.status(400).json({
        success: false,
        error: 'Choices deve ser um array',
        code: 'INVALID_CHOICES',
        processingTime: Date.now() - startTime
      });
    }
    
    // Sanitizar choices
    const sanitizedChoices = [...new Set(
      choices.filter(choice => 
        typeof choice === 'number' && 
        choice > 0 && 
        choice <= 100
      )
    )];
    
    logger.info(`[StylePreferences] Atualizando categoria ${category} para usuário ${userId} com ${sanitizedChoices.length} escolhas`);
    
    // Buscar preferências atuais
    const getQuery = 'SELECT style_preferences FROM user_profiles WHERE user_id = $1';
    const getResult = await pool.query(getQuery, [userId]);
    
    let currentPreferences = {
      tenis: [],
      roupas: [],
      cores: [],
      hobbies: [],
      sentimentos: []
    };
    
    if (getResult.rows.length > 0 && getResult.rows[0].style_preferences) {
      currentPreferences = { ...currentPreferences, ...getResult.rows[0].style_preferences };
    }
    
    // Atualizar categoria específica
    currentPreferences[category] = sanitizedChoices;
    
    // Salvar no banco
    const updateQuery = `
      UPDATE user_profiles 
      SET style_preferences = $2, updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, style_preferences, updated_at
    `;
    
    // Se não existe perfil, criar um
    if (getResult.rows.length === 0) {
      const createQuery = `
        INSERT INTO user_profiles (user_id, style_preferences, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, style_preferences, updated_at
      `;
      
      const createResult = await pool.query(createQuery, [userId, JSON.stringify(currentPreferences)]);
      const profile = createResult.rows[0];
      
      logger.info(`[StylePreferences] Perfil criado e categoria ${category} atualizada para usuário ${userId}`);
      
      return res.json({
        success: true,
        data: {
          userId,
          category,
          choices: sanitizedChoices,
          allPreferences: currentPreferences,
          metadata: {
            profileId: profile.id,
            updatedAt: profile.updated_at,
            isNewProfile: true
          }
        },
        message: `Categoria ${category} atualizada com ${sanitizedChoices.length} escolhas`,
        processingTime: Date.now() - startTime
      });
    }
    
    const updateResult = await pool.query(updateQuery, [userId, JSON.stringify(currentPreferences)]);
    const profile = updateResult.rows[0];
    
    logger.info(`[StylePreferences] Categoria ${category} atualizada com sucesso para usuário ${userId}`);
    
    res.json({
      success: true,
      data: {
        userId,
        category,
        choices: sanitizedChoices,
        allPreferences: currentPreferences,
        metadata: {
          profileId: profile.id,
          updatedAt: profile.updated_at,
          isNewProfile: false
        }
      },
      message: `Categoria ${category} atualizada com ${sanitizedChoices.length} escolhas`,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao atualizar categoria: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar categoria',
      code: 'UPDATE_CATEGORY_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * DELETE /api/profile/style-preferences
 * Remove todas as preferências de estilo
 */
router.delete('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[StylePreferences] Removendo preferências para usuário ${userId}`);
    
    const emptyPreferences = {
      tenis: [],
      roupas: [],
      cores: [],
      hobbies: [],
      sentimentos: []
    };
    
    const query = `
      UPDATE user_profiles 
      SET style_preferences = $2, updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, updated_at
    `;
    
    const result = await pool.query(query, [userId, JSON.stringify(emptyPreferences)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado',
        code: 'PROFILE_NOT_FOUND',
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info(`[StylePreferences] Preferências removidas com sucesso para usuário ${userId}`);
    
    res.json({
      success: true,
      data: {
        userId,
        preferences: emptyPreferences,
        metadata: {
          profileId: result.rows[0].id,
          updatedAt: result.rows[0].updated_at,
          cleared: true
        }
      },
      message: 'Todas as preferências foram removidas',
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[StylePreferences] Erro ao remover preferências: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao remover preferências',
      code: 'DELETE_PREFERENCES_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

module.exports = router;