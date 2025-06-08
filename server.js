import dotenv from 'dotenv';
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { setupRecommendationRoutes } from './server-recommendation-integration.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

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

const recommendationService = setupRecommendationRoutes(app, pool, authenticateToken);


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
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    
    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Inserir usuário
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at',
      [email, hashedPassword, name, true]
    );
    
    const userId = userResult.rows[0].id;
    
    // Criar perfil do usuário
    const profileResult = await client.query(
      `INSERT INTO user_profiles 
       (user_id, display_name, city, gender, age, style_completion_percentage) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, displayName || name, city || 'Unknown', gender || 'other', age || 25, 0]
    );
    
    await client.query('COMMIT');
    
    // Gerar JWT
    const token = jwt.sign(
      { userId: userId, email: email }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: userId,
        email: userResult.rows[0].email,
        name: userResult.rows[0].name,
        profile: profileResult.rows[0]
      }
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
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.password_hash, up.display_name, up.city, up.is_vip 
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id 
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = userResult.rows[0];
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.display_name,
        city: user.city,
        isVip: user.is_vip
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DO PERFIL DO USUÁRIO
// =====================================================

// Obter perfil completo
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, up.display_name, up.city, up.gender, 
              up.avatar_url, up.bio, up.is_vip, up.age, up.style_completion_percentage,
              us.plan_type, us.status as subscription_status, us.end_date
       FROM users u
       INNER JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
       WHERE u.id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, city, bio, avatarUrl, age } = req.body;
    
    const result = await pool.query(
      `UPDATE user_profiles 
       SET display_name = COALESCE($1, display_name),
           city = COALESCE($2, city),
           bio = COALESCE($3, bio),
           avatar_url = COALESCE($4, avatar_url),
           age = COALESCE($5, age),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6 
       RETURNING *`,
      [displayName, city, bio, avatarUrl, age, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE STYLE ADJUSTMENT
// =====================================================

// Salvar escolhas de estilo
app.post('/api/style-choices', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { choices } = req.body; // Array de { category, questionId, selectedOption }
    
    if (!choices || !Array.isArray(choices)) {
      return res.status(400).json({ error: 'Choices deve ser um array' });
    }
    
    await client.query('BEGIN');
    
    // Deletar escolhas anteriores
    await client.query(
      'DELETE FROM style_choices WHERE user_id = $1',
      [req.user.userId]
    );
    
    // Inserir novas escolhas
    for (const choice of choices) {
      await client.query(
        'INSERT INTO style_choices (user_id, category, question_id, selected_option) VALUES ($1, $2, $3, $4)',
        [req.user.userId, choice.category, choice.questionId, choice.selectedOption]
      );
    }
    
    // Atualizar percentual de completude
    const completionPercentage = Math.min(100, (choices.length / 5) * 100);
    await client.query(
      'UPDATE user_profiles SET style_completion_percentage = $1 WHERE user_id = $2',
      [completionPercentage, req.user.userId]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Escolhas salvas com sucesso', completionPercentage });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar escolhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Obter escolhas de estilo do usuário
app.get('/api/style-choices', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT category, question_id, selected_option FROM style_choices WHERE user_id = $1',
      [req.user.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar escolhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE MATCHING
// =====================================================

// Buscar matches potenciais
app.get('/api/matches/potential', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM find_potential_matches($1)',
      [req.user.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter matches existentes
app.get('/api/matches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.compatibility_score, m.status, m.created_at,
              CASE 
                WHEN m.user1_id = $1 THEN up2.display_name 
                ELSE up1.display_name 
              END as match_name,
              CASE 
                WHEN m.user1_id = $1 THEN up2.avatar_url 
                ELSE up1.avatar_url 
              END as match_avatar,
              CASE 
                WHEN m.user1_id = $1 THEN up2.city 
                ELSE up1.city 
              END as match_city,
              CASE 
                WHEN m.user1_id = $1 THEN up2.is_vip 
                ELSE up1.is_vip 
              END as match_is_vip
       FROM matches m
       INNER JOIN user_profiles up1 ON m.user1_id = up1.user_id
       INNER JOIN user_profiles up2 ON m.user2_id = up2.user_id
       WHERE m.user1_id = $1 OR m.user2_id = $1
       ORDER BY m.compatibility_score DESC`,
      [req.user.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar um novo match
app.post('/api/matches', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId é obrigatório' });
    }
    
    const result = await pool.query(
      'SELECT create_match($1, $2) as match_id',
      [req.user.userId, targetUserId]
    );
    
    res.status(201).json({ 
      matchId: result.rows[0].match_id,
      message: 'Match criado com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro ao criar match:', error);
    if (error.message.includes('Match já existe')) {
      return res.status(400).json({ error: 'Match já existe entre estes usuários' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Aceitar/rejeitar match
app.put('/api/matches/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body; // 'accepted' ou 'rejected'
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser accepted ou rejected' });
    }
    
    // Verificar se o usuário é parte do match
    const matchCheck = await pool.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [matchId, req.user.userId]
    );
    
    if (matchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Match não encontrado' });
    }
    
    const result = await pool.query(
      'UPDATE matches SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, matchId]
    );
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao atualizar match:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE CHAT
// =====================================================

// Obter mensagens de um match
app.get('/api/matches/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // Verificar se o usuário é parte do match
    const matchCheck = await pool.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [matchId, req.user.userId]
    );
    
    if (matchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Match não encontrado' });
    }
    
    const result = await pool.query(
      `SELECT cm.id, cm.message_text, cm.message_type, cm.created_at,
              cm.sender_id, up.display_name as sender_name,
              CASE WHEN cm.sender_id = $2 THEN true ELSE false END as is_current_user
       FROM chat_messages cm
       INNER JOIN user_profiles up ON cm.sender_id = up.user_id
       WHERE cm.match_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [matchId, req.user.userId, limit, offset]
    );
    
    res.json(result.rows.reverse()); // Retornar em ordem cronológica
    
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem
app.post('/api/matches/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { message, messageType = 'text' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
    }
    
    const result = await pool.query(
      'SELECT send_message($1, $2, $3) as message_id',
      [req.user.userId, matchId, message.trim()]
    );
    
    // Buscar a mensagem criada
    const messageResult = await pool.query(
      `SELECT cm.id, cm.message_text, cm.message_type, cm.created_at,
              cm.sender_id, up.display_name as sender_name, true as is_current_user
       FROM chat_messages cm
       INNER JOIN user_profiles up ON cm.sender_id = up.user_id
       WHERE cm.id = $1`,
      [result.rows[0].message_id]
    );
    
    res.status(201).json(messageResult.rows[0]);
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    if (error.message.includes('não autorizado')) {
      return res.status(403).json({ error: 'Não autorizado para este match' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE PRODUTOS (MARKETPLACE)
// =====================================================

// Listar produtos
app.get('/api/products', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, brand_name, brand_logo_url, image_url, 
             price_display, category, description
      FROM products 
      WHERE is_active = true
    `;
    const params = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
      query += ' ORDER BY price_numeric ASC LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    } else {
      query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter produto específico
app.get('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [productId]
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

// Análise de estilos populares
app.get('/api/analytics/styles', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM v_style_analytics ORDER BY category, user_count DESC'
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erro ao buscar análise de estilos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================================
// ROTAS DE ASSINATURA VIP
// =====================================================

// Criar assinatura VIP
app.post('/api/subscription', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { planType, paymentMethod, stripeSubscriptionId } = req.body;
    
    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ error: 'Tipo de plano inválido' });
    }
    
    await client.query('BEGIN');
    
    // Cancelar assinatura ativa se existir
    await client.query(
      'UPDATE user_subscriptions SET status = $1 WHERE user_id = $2 AND status = $3',
      ['cancelled', req.user.userId, 'active']
    );
    
    // Calcular datas e preço
    const startDate = new Date();
    const endDate = new Date();
    let price = 0;
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
      price = 9.99;
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
      price = 99.99;
    }
    
    // Criar nova assinatura
    const subscriptionResult = await client.query(
      `INSERT INTO user_subscriptions 
       (user_id, plan_type, status, start_date, end_date, price_paid, payment_method, stripe_subscription_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.userId, planType, 'active', startDate, endDate, price, paymentMethod, stripeSubscriptionId]
    );
    
    // Atualizar status VIP do usuário
    await client.query(
      'UPDATE user_profiles SET is_vip = true WHERE user_id = $1',
      [req.user.userId]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      subscription: subscriptionResult.rows[0],
      message: 'Assinatura VIP ativada com sucesso'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Obter status da assinatura
app.get('/api/subscription', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT us.*, up.is_vip
       FROM user_subscriptions us
       INNER JOIN user_profiles up ON us.user_id = up.user_id
       WHERE us.user_id = $1 AND us.status = 'active'
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ hasActiveSubscription: false });
    }
    
    res.json({ 
      hasActiveSubscription: true,
      subscription: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
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
      subscription: ['/api/subscription'],
      stats: ['/api/user/stats', '/api/analytics/styles']
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
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, fechando servidor...');
  await pool.end();
  process.exit(0);
});

export { pool, authenticateToken };
export default app;
