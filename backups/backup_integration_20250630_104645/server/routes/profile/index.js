// server/routes/profile/index.js (ESM)
import express from 'express';
const router = express.Router();
import pg from 'pg';
const { Pool } = pg;

// Importar rotas específicas
import stylePreferencesRoutes from './style-preferences.js';
import emotionalProfileRoutes from './emotional-profile.js';
import weightAdjustmentRoutes from './weight-adjustment.js';
import { authenticateToken } from '../../middleware/auth.js';
import { pool } from '../../config/database.js'; // Importar pool diretamente

// Registrar rotas com seus respectivos caminhos
router.use('/style-preferences', stylePreferencesRoutes);
router.use('/emotional-profile', emotionalProfileRoutes);
router.use('/weight-adjustment', weightAdjustmentRoutes);

// Middleware para log de requisições (opcional, para debug)
router.use((req, res, next) => {
  console.log(`Profile API: ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Rota de status geral do sistema de perfil
router.get('/status', async (req, res) => {
  try {
    const db = pool; // Usar o pool importado diretamente
    
    // Verificar status de todas as tabelas relacionadas ao perfil
    const statusChecks = await Promise.allSettled([
      // Verificar style_preferences
      db.query('SELECT COUNT(*) FROM style_preferences LIMIT 1'),
      // Verificar emotional_profiles
      db.query('SELECT COUNT(*) FROM emotional_profiles LIMIT 1'),
      // Verificar feedback_events
      db.query('SELECT COUNT(*) FROM feedback_events LIMIT 1'),
      // Verificar weight_adjustments
      db.query('SELECT COUNT(*) FROM weight_adjustments LIMIT 1'),
      // Verificar adaptive_recommendation_configs
      db.query('SELECT COUNT(*) FROM adaptive_recommendation_configs LIMIT 1')
    ]);

    const systemStatus = {
      timestamp: new Date().toISOString(),
      database: 'connected',
      modules: {
        stylePreferences: statusChecks[0].status === 'fulfilled' ? 'active' : 'error',
        emotionalProfile: statusChecks[1].status === 'fulfilled' ? 'active' : 'error',
        feedbackTracking: statusChecks[2].status === 'fulfilled' ? 'active' : 'error',
        weightAdjustment: statusChecks[3].status === 'fulfilled' ? 'active' : 'error',
        adaptiveRecommendation: statusChecks[4].status === 'fulfilled' ? 'active' : 'error'
      },
      version: '2.0.0',
      features: [
        'Style Preferences',
        'Emotional Profiling',
        'Feedback Tracking',
        'Weight Adjustment',
        'Adaptive Recommendations'
      ]
    };

    res.json({
      success: true,
      data: systemStatus
    });

  } catch (error) {
    console.error('Error checking profile system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check system status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota para obter resumo completo do perfil do usuário
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const db = pool; // Usar o pool importado diretamente
    const userId = req.user.id;

    // Buscar dados de todos os módulos do perfil
    const [
      stylePrefs,
      emotionalProfile,
      adaptiveConfig,
      recentFeedback,
      adjustmentStats
    ] = await Promise.allSettled([
      // Style Preferences
      db.query('SELECT * FROM style_preferences WHERE user_id = $1', [userId]),
      
      // Emotional Profile
      db.query('SELECT * FROM emotional_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [userId]),
      
      // Adaptive Configuration
      db.query('SELECT * FROM adaptive_recommendation_configs WHERE user_id = $1', [userId]),
      
      // Recent Feedback (last 7 days)
      db.query(`
        SELECT 
          event_type,
          COUNT(*) as count,
          AVG(match_score) as avg_score
        FROM feedback_events 
        WHERE user_id = $1 
          AND timestamp > NOW() - INTERVAL '7 days'
        GROUP BY event_type
      `, [userId]),
      
      // Adjustment Statistics
      db.query(`
        SELECT 
          COUNT(*) as total_adjustments,
          AVG(confidence_score) as avg_confidence,
          MAX(timestamp) as last_adjustment
        FROM weight_adjustments 
        WHERE user_id = $1
      `, [userId])
    ]);

    const profileSummary = {
      userId,
      timestamp: new Date().toISOString(),
      
      stylePreferences: {
        configured: stylePrefs.status === 'fulfilled' && stylePrefs.value.rows.length > 0,
        data: stylePrefs.status === 'fulfilled' ? stylePrefs.value.rows[0] : null
      },
      
      emotionalProfile: {
        configured: emotionalProfile.status === 'fulfilled' && emotionalProfile.value.rows.length > 0,
        data: emotionalProfile.status === 'fulfilled' ? emotionalProfile.value.rows[0] : null
      },
      
      adaptiveSettings: {
        configured: adaptiveConfig.status === 'fulfilled' && adaptiveConfig.value.rows.length > 0,
        data: adaptiveConfig.status === 'fulfilled' ? adaptiveConfig.value.rows[0] : null
      },
      
      recentActivity: {
        available: recentFeedback.status === 'fulfilled',
        events: recentFeedback.status === 'fulfilled' ? recentFeedback.value.rows : []
      },
      
      learningStats: {
        available: adjustmentStats.status === 'fulfilled',
        data: adjustmentStats.status === 'fulfilled' ? adjustmentStats.value.rows[0] : null
      },
      
      completionScore: calculateProfileCompletion({
        stylePreferences: stylePrefs.status === 'fulfilled' && stylePrefs.value.rows.length > 0,
        emotionalProfile: emotionalProfile.status === 'fulfilled' && emotionalProfile.value.rows.length > 0,
        adaptiveSettings: adaptiveConfig.status === 'fulfilled' && adaptiveConfig.value.rows.length > 0
      })
    };

    res.json({
      success: true,
      data: profileSummary
    });

  } catch (error) {
    console.error('Error getting profile summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile summary'
    });
  }
});

// Função auxiliar para calcular completude do perfil
function calculateProfileCompletion(modules) {
  const totalModules = Object.keys(modules).length;
  const completedModules = Object.values(modules).filter(Boolean).length;
  return Math.round((completedModules / totalModules) * 100);
}

// Rota para reset completo do perfil (cuidado!)
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const db = pool; // Usar o pool importado diretamente
    const userId = req.user.id;
    const { confirmReset } = req.body;

    if (confirmReset !== 'YES_RESET_EVERYTHING') {
      return res.status(400).json({
        success: false,
        message: 'Reset confirmation required'
      });
    }

    // Executar reset em transação
    await db.query('BEGIN');

    try {
      // Deletar dados de todos os módulos
      await Promise.all([
        db.query('DELETE FROM feedback_events WHERE user_id = $1', [userId]),
        db.query('DELETE FROM weight_adjustments WHERE user_id = $1', [userId]),
        db.query('DELETE FROM feedback_analytics WHERE user_id = $1', [userId]),
        db.query('DELETE FROM adaptive_recommendation_configs WHERE user_id = $1', [userId]),
        db.query('DELETE FROM user_learning_profiles WHERE user_id = $1', [userId]),
        db.query('DELETE FROM emotional_profiles WHERE user_id = $1', [userId]),
        db.query('DELETE FROM style_preferences WHERE user_id = $1', [userId])
      ]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Profile completely reset',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error resetting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset profile'
    });
  }
});

// Middleware de tratamento de erros específico para rotas de perfil
router.use((error, req, res, next) => {
  console.error('Profile routes error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details
    });
  }
  
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }
  
  if (error.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;
