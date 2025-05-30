import dotenv from 'dotenv';
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

dotenv.config();
const app = express();

// =====================================================
// MIDDLEWARE BÁSICO OTIMIZADO (DO SERVER2)
// =====================================================

app.use(express.json({ limit: '10mb' }));

// CORS otimizado para Docker
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost', 'http://localhost:80', 'http://frontend'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware de timeout
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Log de requisições em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// CONFIGURAÇÃO POSTGRESQL OTIMIZADA (DO SERVER2)
// =====================================================

const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,
});

// Eventos do pool melhorados
pool.on('connect', () => {
  console.log('✅ Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na conexão PostgreSQL:', err);
});

// Teste inicial de conexão com retry
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Conectado ao PostgreSQL com sucesso');
      console.log(`📊 Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`🔌 Port: ${process.env.DB_PORT || 5432}`);
      client.release();
      return;
    } catch (err) {
      console.error(`❌ Tentativa ${i + 1} de conexão falhou:`, err.message);
      if (i === retries - 1) {
        console.error('💀 Não foi possível conectar ao banco após várias tentativas');
        process.exit(1);
      }
      console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

connectWithRetry();

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
// ROTAS DE SAÚDE E MONITORAMENTO (MELHORADAS DO SERVER2)
// =====================================================

// Health check robusto para Docker
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as timestamp, version() as db_version');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        host: process.env.DB_HOST || 'localhost',
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
// ROTAS DE AUTENTICAÇÃO (COMPLETAS DO SERVER1)
// =====================================================

app.post('/api/auth/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password, name, displayName, city, gender, age } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    await client.query('BEGIN');
    
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at',
      [email, hashedPassword, name, true]
    );
    
    const userId = userResult.rows[0].id;
    
    const profileResult = await client.query(
      `INSERT INTO user_profiles 
       (user_id, display_name, city, gender, age, style_completion_percentage) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, displayName || name, city || 'Unknown', gender || 'other', age || 25, 0]
    );
    
    await client.query('COMMIT');
    
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
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
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
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
// ROTAS DO PERFIL (COMPLETAS DO SERVER1)
// =====================================================

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

export { app, pool, authenticateToken };

// =====================================================
// ROTAS DE STYLE ADJUSTMENT (DO SERVER1)
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
// ROTAS DE MATCHING (COMPLETAS DO SERVER1)
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
// ROTAS DE CHAT (COMPLETAS DO SERVER1)
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
// ROTAS DE PRODUTOS/MARKETPLACE (DO SERVER1)
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

// Produtos recomendados (básico por enquanto)
app.get('/api/products/recommended', authenticateToken, async (req, res) => {
  try {
    // Por enquanto, produtos mockados baseados no perfil do usuário
    const mockProducts = [
      {
        id: 'prod1',
        name: 'Tênis Cyber Glow',
        brandLogoUrl: 'https://picsum.photos/seed/brandA/50/50',
        imageUrl: 'https://picsum.photos/seed/sneaker1/200/200',
        price: 'R$ 299,99',
        category: 'sneakers'
      },
      {
        id: 'prod2',
        name: 'Jaqueta Neon Style',
        brandLogoUrl: 'https://picsum.photos/seed/brandB/50/50',
        imageUrl: 'https://picsum.photos/seed/jacket1/200/200',
        price: 'R$ 199,99',
        category: 'clothing'
      },
      {
        id: 'prod3',
        name: 'Óculos Holográfico',
        brandLogoUrl: 'https://picsum.photos/seed/brandC/50/50',
        imageUrl: 'https://picsum.photos/seed/glasses1/200/200',
        price: 'R$ 149,99',
        category: 'accessories'
      }
    ];

    res.json(mockProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// =====================================================
// ROTAS DE ESTATÍSTICAS (DO SERVER1)
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
// ROTAS DE ASSINATURA VIP (COMPLETAS DO SERVER1)
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

// Cancelar assinatura
app.delete('/api/subscription', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Cancelar assinatura ativa
    const result = await client.query(
      'UPDATE user_subscriptions SET status = $1 WHERE user_id = $2 AND status = $3 RETURNING *',
      ['cancelled', req.user.userId, 'active']
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nenhuma assinatura ativa encontrada' });
    }
    
    // Atualizar status VIP do usuário
    await client.query(
      'UPDATE user_profiles SET is_vip = false WHERE user_id = $1',
      [req.user.userId]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Assinatura cancelada com sucesso' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// =====================================================
// ROTAS EXTRAS/COMPATIBILIDADE (DO SERVER2 ORIGINAL)
// =====================================================

// Rotas para perfis de usuário (compatibilidade)
app.get('/api/users/:userId/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário pode acessar este perfil
    if (req.user.userId != userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.created_at,
             up.avatar_url, up.bio, up.city, up.gender, up.is_vip, up.style_data
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const profile = result.rows[0];
    res.json({
      id: profile.id,
      email: profile.email,
      displayName: profile.name,
      city: profile.city || 'Não informado',
      gender: profile.gender || 'other',
      avatarUrl: profile.avatar_url || 'https://picsum.photos/200/200',
      bio: profile.bio || '',
      isVip: profile.is_vip || false,
      styleData: profile.style_data || {},
      createdAt: profile.created_at
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil do usuário (compatibilidade)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, city, gender, bio, avatarUrl, styleData } = req.body;
    const userId = req.user.userId;

    // Primeiro, atualizar a tabela users
    await pool.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [displayName, userId]
    );

    // Depois, inserir ou atualizar o perfil
    const profileResult = await pool.query(`
      INSERT INTO user_profiles (user_id, avatar_url, bio, city, gender, style_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        city = EXCLUDED.city,
        gender = EXCLUDED.gender,
        style_data = EXCLUDED.style_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, avatarUrl, bio, city, gender, JSON.stringify(styleData)]);

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      profile: profileResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS (MELHORADO)
// =====================================================

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Log detalhado para desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack trace:', err.stack);
  }
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR (ROBUSTA)
// =====================================================

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Aguardar conexão com o banco estar pronta
    await new Promise((resolve) => {
      const checkConnection = async () => {
        try {
          await pool.query('SELECT NOW()');
          console.log('✅ Conexão com PostgreSQL confirmada');
          resolve();
        } catch (error) {
          console.log('⏳ Aguardando conexão com PostgreSQL...');
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    });
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor MatchIt rodando na porta ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📖 API info: http://localhost:${PORT}/api/info`);
    });

    // Configurar timeout do servidor
    server.timeout = 60000; // 60 segundos
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown melhorado
const gracefulShutdown = async (signal) => {
  console.log(`🛑 Recebido ${signal}, iniciando shutdown graceful...`);
  
  try {
    // Fechar pool de conexões
    await pool.end();
    console.log('✅ Pool de conexões PostgreSQL fechado');
    
    // Aguardar um pouco para finalizar requests pendentes
    setTimeout(() => {
      console.log('👋 Servidor encerrado com sucesso');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro durante shutdown:', error);
    process.exit(1);
  }
};

// Registrar handlers de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handler para errors não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar o servidor
startServer();

export default app;