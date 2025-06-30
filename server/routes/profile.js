// server/routes/profile.js - Rotas básicas de perfil para MatchIt
import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas de perfil
router.use(authenticateToken);

/**
 * GET /api/profile
 * Buscar perfil do usuário logado
 */
router.get('/', async (req, res) => {
  try {
    console.log('👤 Buscando perfil do usuário:', req.user.email);
    
    const result = await pool.query(
      'SELECT id, name, email, created_at, is_active FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        is_active: user.is_active
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/profile/style-preferences
 * Buscar preferências de estilo do usuário
 */
router.get('/style-preferences', async (req, res) => {
  try {
    console.log('🎨 Buscando preferências de estilo:', req.user.email);
    
    const result = await pool.query(
      'SELECT * FROM style_choices WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({
      success: true,
      preferences: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar preferências:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar preferências'
    });
  }
});

/**
 * PUT /api/profile/style-preferences
 * Atualizar preferências de estilo
 */
router.put('/style-preferences', async (req, res) => {
  try {
    const { category, preferences } = req.body;

    if (!category || !preferences) {
      return res.status(400).json({
        success: false,
        error: 'Categoria e preferências são obrigatórias'
      });
    }

    console.log('🎨 Atualizando preferências:', req.user.email, category);

    // Inserir ou atualizar preferência
    const result = await pool.query(
      `INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, category, question_id) 
       DO UPDATE SET selected_option = $4, created_at = NOW()
       RETURNING *`,
      [req.user.userId, 'general_preference', category, JSON.stringify(preferences)]
    );

    res.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      preference: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar preferências:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar preferências'
    });
  }
});

export default router;
