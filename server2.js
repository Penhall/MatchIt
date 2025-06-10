// server.js - Servidor MatchIt com Sistema de Recomendação Integrado
import dotenv from 'dotenv';
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// =====================================================
// CONFIGURAÇÃO DO POSTGRESQL
// =====================================================

const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: process.env.DB_PORT || 5432,
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão PostgreSQL:', err);
});

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// =====================================================
// SERVIÇO DE RECOMENDAÇÃO
// =====================================================

const recommendationService = new (class {
  constructor(pool) { 
    this.pool = pool; 
  }
  
  async getRecommendations(userId, options = {}) {
    const { limit = 20, algorithm = 'hybrid' } = options;
    
    try {
      // Buscar candidatos usando stored procedure
      const result = await this.pool.query(
        'SELECT * FROM find_potential_matches($1, $2, 0.3, 50.0)',
        [userId, limit]
      );
      
      const matches = result.rows.map(row => ({
        id: `score_${Date.now()}_${row.user_id}`,
        userId,
        targetUserId: row.user_id,
        overallScore: row.compatibility_score,
        normalizedScore: Math.round(row.compatibility_score * 100),
        explanation: {
          summary: `${Math.round(row.compatibility_score * 100)}% compatível`,
          strengths: ['Estilo similar', 'Localização próxima']
        },
        targetUser: {
          displayName: row.display_name,
          city: row.city,
          avatarUrl: row.avatar_url,
          isVip: row.is_vip,
          distance: Math.round(row.distance_km)
        }
      }));

      return {
        matches,
        totalCandidates: result.rows.length,
        algorithm,
        processingTime: 100,
        fromCache: false
      };
    } catch (error) {
      console.error('Erro no serviço de recomendação:', error);
      throw error;
    }
  }
  
  async recordFeedback(userId, targetUserId, action, context = {}) {
    try {
      await this.pool.query(
        'SELECT record_interaction_with_learning($1, $2, $3)',
        [userId, targetUserId, action]
      );
      
      // Verificar se criou match
      const mutualCheck = await this.pool.query(`
        SELECT COUNT(*) as mutual FROM user_interactions 
        WHERE user_id = $1 AND target_user_id = $2 AND action IN ('like', 'super_like')
        AND EXISTS (
          SELECT 1 FROM user_interactions 
          WHERE user_id = $2 AND target_user_id = $1 AND action IN ('like', 'super_like')
        )
      `, [userId, targetUserId]);
      
      const matchCreated = parseInt(mutualCheck.rows[0].mutual) > 0;
      
      return {
        success: true,
        matchCreated,
        message: matchCreated ? 'Match criado!' : 'Feedback registrado'
      };
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      throw error;
    }
  }
})(pool);

// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password, name, displayName, city, gender, age } = req.body;
    
    // Validações básicas
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }
    
    await client.query('BEGIN');
    
    // Verificar se email já existe
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Inserir usuário
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, display_name, city, gender, age, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, email, name, display_name, city, gender, age`,
      [email, hashedPassword, name, displayName, city, gender, age]
    );
    
    await client.query('COMMIT');
    
    const user = userResult.rows[0];
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.display_name,
        city: user.city,
        gender: user.gender,
        age: user.age
      },
      token
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const result = await pool.query(
      'SELECT id, email, password_hash, name, display_name FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.display_name
      },
      token
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE RECOMENDAÇÃO
// =====================================================

// GET /api/recommendations - Obter recomendações
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, algorithm = 'hybrid', refresh = false } = req.query;
    
    const result = await recommendationService.getRecommendations(req.user.userId, {
      limit: Math.min(parseInt(limit), 50),
      algorithm,
      forceRefresh: refresh === 'true'
    });
    
    res.json({
      success: true,
      data: {
        recommendations: result.matches,
        totalCandidates: result.totalCandidates,
        algorithm: result.algorithm,
        processingTime: result.processingTime
      },
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromCache: result.fromCache
      }
    });
    
  } catch (error) {
    console.error('Erro em GET /recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// POST /api/recommendations/feedback - Registrar feedback
app.post('/api/recommendations/feedback', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, action, context = {} } = req.body;
    
    if (!targetUserId || !action) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId e action são obrigatórios'
      });
    }
    
    if (!['like', 'dislike', 'super_like', 'skip', 'report', 'block'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Ação inválida'
      });
    }
    
    const result = await recommendationService.recordFeedback(
      req.user.userId, 
      targetUserId, 
      action, 
      context
    );
    
    res.json({
      success: true,
      data: result,
      meta: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro em POST /recommendations/feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/recommendations/health - Health check do sistema
app.get('/api/recommendations/health', async (req, res) => {
  try {
    // Testar stored procedure
    const testResult = await pool.query('SELECT calculate_style_compatibility($1, $1) as test', [
      (await pool.query('SELECT id FROM users LIMIT 1')).rows[0]?.id
    ]);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        storedProcedures: 'working',
        testScore: testResult.rows[0]?.test || 0
      }
    });
    
  } catch (error) {
    console.error('Erro em health check:', error);
    res.status(500).json({
      success: false,
      error: 'Sistema de recomendação com problemas'
    });
  }
});

// server.js (PARTE 2) - Rotas de Profile, Matches, Chat, Produtos e Finalização

// =====================================================
// ROTAS DE PERFIL
// =====================================================

// Buscar perfil do usuário
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.display_name, u.city, u.gender, u.age, u.latitude, u.longitude,
              up.bio, up.is_vip, up.avatar_url, up.created_at
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil do usuário
app.put('/api/profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { displayName, bio, city, avatarUrl } = req.body;
    
    await client.query('BEGIN');
    
    // Atualizar dados básicos
    await client.query(
      'UPDATE users SET display_name = $1, city = $2 WHERE id = $3',
      [displayName, city, req.user.userId]
    );
    
    // Atualizar ou inserir perfil estendido
    await client.query(
      `INSERT INTO user_profiles (user_id, bio, avatar_url, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       bio = EXCLUDED.bio,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()`,
      [req.user.userId, bio, avatarUrl]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Perfil atualizado com sucesso' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// =====================================================
// ROTAS DE STYLE CHOICES
// =====================================================

// Buscar style choices do usuário
app.get('/api/style-choices', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM style_adjustments WHERE user_id = $1',
      [req.user.userId]
    );
    
    res.json(result.rows[0] || {});
    
  } catch (error) {
    console.error('Erro ao buscar style choices:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Salvar style choices do usuário
app.post('/api/style-choices', authenticateToken, async (req, res) => {
  try {
    const { tenisChoices, roupasChoices, coresChoices, hobbiesChoices, sentimentosChoices } = req.body;
    
    await pool.query(
      `INSERT INTO style_adjustments (user_id, tenis_choices, roupas_choices, cores_choices, hobbies_choices, sentimentos_choices, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       tenis_choices = EXCLUDED.tenis_choices,
       roupas_choices = EXCLUDED.roupas_choices,
       cores_choices = EXCLUDED.cores_choices,
       hobbies_choices = EXCLUDED.hobbies_choices,
       sentimentos_choices = EXCLUDED.sentimentos_choices,
       updated_at = NOW()`,
      [req.user.userId, tenisChoices, roupasChoices, coresChoices, hobbiesChoices, sentimentosChoices]
    );
    
    res.json({ message: 'Escolhas de estilo salvas com sucesso' });
    
  } catch (error) {
    console.error('Erro ao salvar style choices:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE MATCHES
// =====================================================

// Buscar matches do usuário
app.get('/api/matches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.user1_id, m.user2_id, m.created_at,
              CASE 
                WHEN m.user1_id = $1 THEN u2.display_name
                ELSE u1.display_name
              END as match_name,
              CASE 
                WHEN m.user1_id = $1 THEN up2.avatar_url
                ELSE up1.avatar_url
              END as match_avatar
       FROM matches m
       LEFT JOIN users u1 ON m.user1_id = u1.id
       LEFT JOIN users u2 ON m.user2_id = u2.id
       LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
       LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
       WHERE m.user1_id = $1 OR m.user2_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.userId]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar matches potenciais
app.get('/api/matches/potential', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.display_name, u.age, u.city,
              up.bio, up.avatar_url, up.is_vip
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id != $1
       AND u.id NOT IN (
         SELECT CASE 
           WHEN user1_id = $1 THEN user2_id
           ELSE user1_id
         END
         FROM matches
         WHERE user1_id = $1 OR user2_id = $1
       )
       LIMIT 20`,
      [req.user.userId]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erro ao buscar matches potenciais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE CHAT
// =====================================================

// Buscar mensagens de um match
app.get('/api/matches/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Verificar se o usuário pertence ao match
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [matchId, req.user.userId]
    );
    
    if (matchResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado ao match' });
    }
    
    const messages = await pool.query(
      `SELECT cm.id, cm.sender_id, cm.content, cm.sent_at,
              u.display_name as sender_name,
              up.avatar_url as sender_avatar
       FROM chat_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE cm.match_id = $1
       ORDER BY cm.sent_at ASC`,
      [matchId]
    );
    
    res.json(messages.rows);
    
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem
app.post('/api/matches/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    }
    
    // Verificar se o usuário pertence ao match
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [matchId, req.user.userId]
    );
    
    if (matchResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado ao match' });
    }
    
    const result = await pool.query(
      `INSERT INTO chat_messages (match_id, sender_id, content, sent_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, content, sent_at`,
      [matchId, req.user.userId, content.trim()]
    );
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE PRODUTOS
// =====================================================

// Listar produtos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE active = true ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produto específico
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE ESTATÍSTICAS
// =====================================================

// Estatísticas do usuário
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM get_user_stats($1)',
      [req.user.userId]
    );
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE SAÚDE E MONITORAMENTO
// =====================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as timestamp');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTimestamp: dbResult.rows[0].timestamp
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

// Informações da API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'MatchIt API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login'],
      profile: ['/api/profile'],
      styles: ['/api/style-choices'],
      matches: ['/api/matches', '/api/matches/potential'],
      chat: ['/api/matches/:matchId/messages'],
      products: ['/api/products'],
      recommendations: ['/api/recommendations', '/api/recommendations/feedback', '/api/recommendations/health'],
      stats: ['/api/user/stats']
    }
  });
});

// =====================================================
// MIDDLEWARE DE ERRO GLOBAL
// =====================================================

app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor MatchIt rodando na porta ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  console.log(`🎯 Rotas de recomendação: /api/recommendations/*`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, fechando servidor...');
  await pool.end();
  process.exit(0);
});

export default app;