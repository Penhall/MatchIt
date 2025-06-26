// server/routes/index.js - Sistema de rotas principal do MatchIt
const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');

// =====================================================
// ROTAS PÚBLICAS (sem autenticação)
// =====================================================

// Health check
router.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco
    const { query } = require('../config/database');
    await query('SELECT 1');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Info do sistema
router.get('/info', (req, res) => {
  res.json({
    name: 'MatchIt API',
    version: '1.0.0',
    description: 'Sistema de recomendação inteligente',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/verify'
      ],
      profile: [
        'GET /api/profile',
        'PUT /api/profile',
        'GET /api/profile/style-preferences',
        'PUT /api/profile/style-preferences'
      ],
      emotional: [
        'GET /api/profile/emotional',
        'POST /api/profile/emotional/responses'
      ]
    }
  });
});

// Rota de teste público
router.get('/test', (req, res) => {
  res.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================
router.use('/auth', authRoutes);

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO PARA ROTAS PROTEGIDAS
// =====================================================
router.use('/profile', authMiddleware);
router.use('/recommendations', authMiddleware);
router.use('/matches', authMiddleware);

// =====================================================
// ROTAS PROTEGIDAS (requerem autenticação)
// =====================================================

// Perfil básico
router.get('/profile', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado'
      });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil
router.put('/profile', async (req, res) => {
  try {
    const { name, bio, age } = req.body;
    const { query } = require('../config/database');
    
    const result = await query(
      'UPDATE users SET name = COALESCE($1, name), updated_at = NOW() WHERE id = $2 RETURNING id, email, name',
      [name, req.userId]
    );
    
    res.json({
      success: true,
      message: 'Perfil atualizado',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// PREFERÊNCIAS DE ESTILO (FASE 0)
// =====================================================

// GET preferências de estilo
router.get('/profile/style-preferences', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Verificar se tabela existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'style_choices'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Criar tabela se não existir
      await query(`
        CREATE TABLE style_choices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          question_id VARCHAR(100) NOT NULL,
          selected_option VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, category, question_id)
        );
        CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
      `);
    }
    
    const result = await query(
      'SELECT category, question_id as "questionId", selected_option as "selectedOption", created_at, updated_at FROM style_choices WHERE user_id = $1 ORDER BY created_at',
      [req.userId]
    );
    
    res.json({
      success: true,
      preferences: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT preferência individual
router.put('/profile/style-preferences', async (req, res) => {
  try {
    const { category, questionId, selectedOption } = req.body;
    
    if (!category || !questionId || !selectedOption) {
      return res.status(400).json({
        success: false,
        error: 'category, questionId e selectedOption são obrigatórios'
      });
    }
    
    const { query } = require('../config/database');
    
    await query(`
      INSERT INTO style_choices (user_id, category, question_id, selected_option)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, category, question_id) 
      DO UPDATE SET 
        selected_option = EXCLUDED.selected_option,
        updated_at = NOW()
    `, [req.userId, category, questionId, selectedOption]);
    
    res.json({
      success: true,
      message: 'Preferência salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar preferência:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST preferências em lote
router.post('/profile/style-preferences/batch', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array de preferências é obrigatório'
      });
    }
    
    const { query } = require('../config/database');
    
    for (const pref of preferences) {
      if (!pref.category || !pref.questionId || !pref.selectedOption) {
        return res.status(400).json({
          success: false,
          error: 'Cada preferência deve ter category, questionId e selectedOption'
        });
      }
      
      await query(`
        INSERT INTO style_choices (user_id, category, question_id, selected_option)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, category, question_id) 
        DO UPDATE SET 
          selected_option = EXCLUDED.selected_option,
          updated_at = NOW()
      `, [req.userId, pref.category, pref.questionId, pref.selectedOption]);
    }
    
    res.json({
      success: true,
      message: `${preferences.length} preferências salvas com sucesso`
    });
  } catch (error) {
    console.error('Erro ao salvar preferências em lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE todas as preferências
router.delete('/profile/style-preferences', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    await query('DELETE FROM style_choices WHERE user_id = $1', [req.userId]);
    
    res.json({
      success: true,
      message: 'Preferências removidas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover preferências:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// SISTEMA EMOCIONAL (já implementado)
// =====================================================

// Manter rotas emocionais existentes se houver arquivos separados
try {
  const emotionalRoutes = require('./emotional-profile');
  router.use('/profile/emotional', emotionalRoutes);
} catch (error) {
  console.log('Rotas emocionais não encontradas, usando implementação básica');
  
  // Implementação básica do sistema emocional
  router.get('/profile/emotional', (req, res) => {
    res.json({
      success: true,
      message: 'Sistema emocional em desenvolvimento',
      emotional_profile: null
    });
  });
}

// =====================================================
// ROTA PARA ROTAS NÃO ENCONTRADAS
// =====================================================
router.use('*', (req, res) => {
  // Listar rotas disponíveis
  const availableRoutes = [
    'GET /api/health',
    'GET /api/info',
    'GET /api/test',
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET /api/auth/verify',
    'GET /api/profile',
    'PUT /api/profile',
    'GET /api/profile/style-preferences',
    'PUT /api/profile/style-preferences',
    'POST /api/profile/style-preferences/batch',
    'DELETE /api/profile/style-preferences',
    'GET /api/profile/emotional'
  ];
  
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableRoutes
  });
});

module.exports = router;
