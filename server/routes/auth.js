// server/routes/auth.js - Rotas de autenticação
import express from 'express';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import { AuthService } from '../services/authService.js';

const router = express.Router();
const authService = new AuthService();

// POST /api/auth/register - Registro de usuário
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, name, displayName, city, gender, age } = req.body;
    
    const result = await authService.registerUser({
      email,
      password,
      name,
      displayName,
      city,
      gender,
      age
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Erro no registro:', error);
    
    if (error.message.includes('já está em uso')) {
      return res.status(400).json({ 
        error: 'Email já está em uso',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password);
    
    res.json(result);
    
  } catch (error) {
    console.error('Erro no login:', error);
    
    if (error.message.includes('Credenciais inválidas')) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'LOGIN_ERROR'
    });
  }
});

// POST /api/auth/refresh - Renovar token (opcional)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token obrigatório',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    res.json(result);
    
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(401).json({ 
      error: 'Refresh token inválido',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

export default router;

// =====================================================

// server/routes/health.js - Rotas de saúde e monitoramento
import express from 'express';
import { pool } from '../config/database.js';
import { config } from '../config/environment.js';

const router = express.Router();

// GET /api/health - Health check principal
router.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as timestamp, version() as db_version');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: {
        status: 'connected',
        host: config.database.host,
        timestamp: dbResult.rows[0].timestamp,
        version: dbResult.rows[0].db_version.split(' ')[0]
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()) + 's'
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: { status: 'disconnected' },
      error: error.message
    });
  }
});

// GET /api/health/database - Health check específico do banco
router.get('/health/database', async (req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    const duration = Date.now() - start;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        response_time: duration + 'ms',
        user_count: result.rows[0].user_count,
        pool_status: {
          total_connections: pool.totalCount,
          idle_connections: pool.idleCount,
          waiting_requests: pool.waitingCount
        }
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: { status: 'disconnected' },
      error: error.message
    });
  }
});

// GET /api/info - Informações da API
router.get('/info', (req, res) => {
  res.json({
    name: 'MatchIt API',
    version: '1.0.0',
    environment: config.nodeEnv,
    features: {
      ...config.features,
      modular_architecture: true
    },
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/refresh'],
      profile: ['/api/profile'],
      styles: ['/api/style-choices'],
      matches: ['/api/matches', '/api/matches/potential'],
      chat: ['/api/matches/:matchId/messages'],
      products: ['/api/products', '/api/products/recommended'],
      recommendations: ['/api/recommendations', '/api/recommendations/feedback', '/api/recommendations/health'],
      subscription: ['/api/subscription'],
      stats: ['/api/user/stats', '/api/analytics/styles'],
      health: ['/api/health', '/api/health/database', '/api/info']
    },
    documentation: {
      readme: '/README-MODULAR.md',
      environment_example: '/.env.example'
    }
  });
});

// GET /api/ping - Ping simples
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

export default router;

// =====================================================

// server/routes/profile.js - Rotas de perfil do usuário
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validation.js';
import { ProfileService } from '../services/profileService.js';

const router = express.Router();
const profileService = new ProfileService();

// GET /api/profile - Obter perfil completo
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await profileService.getUserProfile(req.user.userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Perfil não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// PUT /api/profile - Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, city, bio, avatarUrl, age, gender } = req.body;
    
    const updatedProfile = await profileService.updateUserProfile(req.user.userId, {
      displayName,
      city,
      bio,
      avatarUrl,
      age,
      gender
    });
    
    res.json({ 
      message: 'Perfil atualizado com sucesso',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ 
        error: 'Perfil não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// POST /api/style-choices - Salvar escolhas de estilo
router.post('/style-choices', authenticateToken, validateRequired(['choices']), async (req, res) => {
  try {
    const { choices } = req.body;
    
    if (!Array.isArray(choices)) {
      return res.status(400).json({ 
        error: 'Choices deve ser um array',
        code: 'INVALID_CHOICES_FORMAT'
      });
    }
    
    const result = await profileService.saveStyleChoices(req.user.userId, choices);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao salvar escolhas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'STYLE_CHOICES_SAVE_ERROR'
    });
  }
});

// GET /api/style-choices - Obter escolhas de estilo do usuário
router.get('/style-choices', authenticateToken, async (req, res) => {
  try {
    const choices = await profileService.getUserStyleChoices(req.user.userId);
    res.json(choices);
  } catch (error) {
    console.error('Erro ao buscar escolhas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'STYLE_CHOICES_FETCH_ERROR'
    });
  }
});

export default router;
