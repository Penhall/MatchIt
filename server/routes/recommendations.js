// server/routes/recommendations.js - Rotas do sistema de recomendação
import express from 'express';
import { Pool } from 'pg';

// Configuração do banco (temporária, idealmente viria de config)
const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const router = express.Router();

// Health check específico do sistema de recomendação
router.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco
    await pool.query('SELECT NOW()');
    
    // Testar se stored procedures existem (opcional)
    let storedProceduresStatus = 'not_implemented';
    try {
      const testResult = await pool.query('SELECT calculate_style_compatibility($1, $1) as test', [
        (await pool.query('SELECT id FROM users LIMIT 1')).rows[0]?.id
      ]);
      storedProceduresStatus = 'working';
    } catch (error) {
      console.log('Stored procedures de recomendação não implementadas:', error.message);
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      storedProcedures: storedProceduresStatus,
      message: 'Sistema de recomendação modular funcionando!',
      version: '1.0.0'
    });
    
  } catch (error) {
    console.error('Erro em health check do sistema de recomendação:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /recommendations - Buscar recomendações (básico por enquanto)
router.get('/', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Por enquanto, retornar usuários aleatórios como recomendação
    const result = await pool.query(
      `SELECT u.id, u.name, up.avatar_url, up.style_data,
              RANDOM() * 30 + 70 as compatibility_score
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.is_active = true
       ORDER BY RANDOM()
       LIMIT $1`,
      [Math.min(parseInt(limit), 50)]
    );
    
    const recommendations = result.rows.map(row => {
      const styleData = row.style_data ? JSON.parse(row.style_data) : {};
      return {
        id: `rec_${Date.now()}_${row.id}`,
        targetUserId: row.id,
        displayName: styleData.display_name || row.name,
        avatarUrl: row.avatar_url,
        city: styleData.city || 'Unknown',
        age: styleData.age || 25,
        compatibilityScore: Math.round(row.compatibility_score),
        explanation: {
          summary: `${Math.round(row.compatibility_score)}% compatível`,
          strengths: ['Algoritmo básico', 'Seleção aleatória']
        }
      };
    });
    
    res.json({
      success: true,
      data: {
        recommendations,
        totalCandidates: result.rows.length,
        algorithm: 'basic_modular',
        processingTime: 50
      },
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromCache: false
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /feedback - Registrar feedback
router.post('/feedback', async (req, res) => {
  try {
    const { targetUserId, action, context = {} } = req.body;
    
    if (!targetUserId || !action) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId e action são obrigatórios'
      });
    }
    
    const validActions = ['like', 'dislike', 'super_like', 'skip', 'report', 'block'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Ação inválida',
        validActions
      });
    }
    
    // Registrar feedback (implementação básica)
    console.log(`Feedback registrado: ${action} para usuário ${targetUserId}`);
    
    res.json({
      success: true,
      data: {
        message: 'Feedback registrado com sucesso',
        action,
        targetUserId
      },
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;