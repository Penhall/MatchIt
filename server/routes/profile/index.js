// server/routes/profile/index.js - Rotas de perfil com integração de preferências de estilo (ES Modules)
import express from 'express';
import pool from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { logger } from '../../middleware/logger.js';
import stylePreferencesRoutes from './style-preferences.js';

const router = express.Router();

// ==============================================
// MIDDLEWARE
// ==============================================

// Middleware para validar existência de usuário
const validateUserExists = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userQuery = 'SELECT id, email, created_at FROM users WHERE id = $1';
    const result = await pool.query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    req.userData = result.rows[0];
    next();
  } catch (error) {
    logger.error(`[Profile] Erro ao validar usuário: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'USER_VALIDATION_ERROR'
    });
  }
};

// ==============================================
// SUB-ROTAS
// ==============================================

// Rotas de preferências de estilo
router.use('/style-preferences', validateUserExists, stylePreferencesRoutes);

// ==============================================
// ROTAS PRINCIPAIS DE PERFIL
// ==============================================

/**
 * GET /api/profile
 * Busca perfil completo do usuário
 */
router.get('/', authenticateToken, validateUserExists, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[Profile] Buscando perfil completo para usuário ${userId}`);
    
    // Buscar dados do perfil
    const profileQuery = `
      SELECT 
        up.id as profile_id,
        up.user_id,
        up.bio,
        up.age,
        up.gender,
        up.location,
        up.style_preferences,
        up.preferences,
        up.personality_vector,
        up.activity_level,
        up.created_at as profile_created_at,
        up.updated_at as profile_updated_at,
        u.email,
        u.phone,
        u.created_at as user_created_at
      FROM user_profiles up
      RIGHT JOIN users u ON up.user_id = u.id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(profileQuery, [userId]);
    const profileData = result.rows[0];
    
    // Estruturar resposta
    const profile = {
      userId: profileData.user_id || userId,
      email: profileData.email,
      phone: profileData.phone,
      
      // Dados do perfil
      bio: profileData.bio || '',
      age: profileData.age || null,
      gender: profileData.gender || null,
      location: profileData.location || null,
      
      // Preferências
      stylePreferences: profileData.style_preferences || {
        tenis: [],
        roupas: [],
        cores: [],
        hobbies: [],
        sentimentos: []
      },
      preferences: profileData.preferences || {
        ageRange: [18, 35],
        maxDistance: 50,
        genderPreference: []
      },
      
      // Vetores (para sistema de recomendação)
      personalityVector: profileData.personality_vector || [],
      activityLevel: profileData.activity_level || 5,
      
      // Metadados
      metadata: {
        profileId: profileData.profile_id,
        hasProfile: !!profileData.profile_id,
        userCreatedAt: profileData.user_created_at,
        profileCreatedAt: profileData.profile_created_at,
        profileUpdatedAt: profileData.profile_updated_at,
        isComplete: calculateProfileCompleteness(profileData)
      }
    };
    
    logger.info(`[Profile] Perfil encontrado para usuário ${userId}, completude: ${profile.metadata.isComplete.percentage}%`);
    
    res.json({
      success: true,
      data: profile,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[Profile] Erro ao buscar perfil: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar perfil',
      code: 'FETCH_PROFILE_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * PUT /api/profile
 * Atualiza dados básicos do perfil
 */
router.put('/', authenticateToken, validateUserExists, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { bio, age, gender, location, preferences } = req.body;
    
    logger.info(`[Profile] Atualizando perfil básico para usuário ${userId}`);
    
    // Validações
    if (age && (typeof age !== 'number' || age < 18 || age > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Idade deve ser um número entre 18 e 100',
        code: 'INVALID_AGE'
      });
    }
    
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Gênero deve ser: male, female ou other',
        code: 'INVALID_GENDER'
      });
    }
    
    // Verificar se perfil existe
    const checkQuery = 'SELECT id FROM user_profiles WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    const updateData = {
      bio: bio || null,
      age: age || null,
      gender: gender || null,
      location: location || null,
      preferences: preferences || null
    };
    
    // Remover campos null/undefined para não sobrescrever dados existentes
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    let query, values, result;
    
    if (checkResult.rows.length === 0) {
      // Criar perfil
      const fields = Object.keys(updateData);
      const placeholders = fields.map((_, i) => `$${i + 2}`);
      
      query = `
        INSERT INTO user_profiles (user_id, ${fields.join(', ')}, created_at, updated_at)
        VALUES ($1, ${placeholders.join(', ')}, NOW(), NOW())
        RETURNING *
      `;
      values = [userId, ...Object.values(updateData)];
      
      logger.info(`[Profile] Criando novo perfil para usuário ${userId}`);
    } else {
      // Atualizar perfil
      const fields = Object.keys(updateData);
      const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
      
      query = `
        UPDATE user_profiles 
        SET ${setClause}, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;
      values = [userId, ...Object.values(updateData)];
      
      logger.info(`[Profile] Atualizando perfil existente para usuário ${userId}`);
    }
    
    result = await pool.query(query, values);
    const updatedProfile = result.rows[0];
    
    logger.info(`[Profile] Perfil atualizado com sucesso para usuário ${userId}`);
    
    res.json({
      success: true,
      data: {
        profileId: updatedProfile.id,
        userId: updatedProfile.user_id,
        updatedFields: Object.keys(updateData),
        updatedAt: updatedProfile.updated_at
      },
      message: 'Perfil atualizado com sucesso',
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[Profile] Erro ao atualizar perfil: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar perfil',
      code: 'UPDATE_PROFILE_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * GET /api/profile/completeness
 * Verifica completude do perfil
 */
router.get('/completeness', authenticateToken, validateUserExists, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    const query = 'SELECT * FROM user_profiles WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          percentage: 0,
          completed: false,
          missing: ['bio', 'age', 'gender', 'location', 'stylePreferences'],
          requiredFields: 5,
          completedFields: 0
        },
        processingTime: Date.now() - startTime
      });
    }
    
    const profile = result.rows[0];
    const completeness = calculateProfileCompleteness(profile);
    
    res.json({
      success: true,
      data: completeness,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    logger.error(`[Profile] Erro ao verificar completude: ${error.message}`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'COMPLETENESS_ERROR',
      processingTime: Date.now() - startTime
    });
  }
});

// ==============================================
// FUNÇÕES UTILITÁRIAS
// ==============================================

/**
 * Calcula completude do perfil
 */
function calculateProfileCompleteness(profileData) {
  const requiredFields = ['bio', 'age', 'gender', 'location', 'style_preferences'];
  const completed = [];
  const missing = [];
  
  requiredFields.forEach(field => {
    if (field === 'style_preferences') {
      // Verificar se tem pelo menos uma preferência em cada categoria
      const stylePrefs = profileData.style_preferences;
      if (stylePrefs) {
        const categories = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'];
        const completedCategories = categories.filter(cat => 
          stylePrefs[cat] && Array.isArray(stylePrefs[cat]) && stylePrefs[cat].length > 0
        ).length;
        
        if (completedCategories >= 3) { // Pelo menos 3 de 5 categorias
          completed.push('stylePreferences');
        } else {
          missing.push('stylePreferences');
        }
      } else {
        missing.push('stylePreferences');
      }
    } else {
      if (profileData[field] && profileData[field] !== '') {
        completed.push(field);
      } else {
        missing.push(field);
      }
    }
  });
  
  const percentage = Math.round((completed.length / requiredFields.length) * 100);
  
  return {
    percentage,
    completed: percentage === 100,
    missing,
    requiredFields: requiredFields.length,
    completedFields: completed.length,
    breakdown: {
      basicInfo: completed.filter(f => ['bio', 'age', 'gender', 'location'].includes(f)).length,
      stylePreferences: completed.includes('stylePreferences') ? 1 : 0
    }
  };
}

export default router;