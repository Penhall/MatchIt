import dotenv from 'dotenv';
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

dotenv.config();
const app = express();

// =====================================================
// MIDDLEWARE BÁSICO
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
// CONFIGURAÇÃO DO POSTGRESQL OTIMIZADA PARA DOCKER
// =====================================================

const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'postgres', // 'postgres' é o nome do serviço no Docker
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Configurações otimizadas para Docker
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,
});

// Eventos do pool melhorados
pool.on('connect', (client) => {
  console.log('✅ Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err, client) => {
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

// Conectar com retry ao iniciar
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
// ROTAS DE SAÚDE E MONITORAMENTO (DOCKER ESSENCIAL)
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
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
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

export { app, pool, authenticateToken };

// Continuação do server.js - Parte 2

// Rotas para perfis de usuário
app.get('/api/users/:userId/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário pode acessar este perfil
    if (req.user.userId !== userId && !req.user.isAdmin) {
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

// Atualizar perfil do usuário
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

// Rotas para sistema de matching
app.get('/api/matches', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Buscar matches do usuário (simulado por enquanto)
    const matches = await pool.query(`
      SELECT u.id, u.name as display_name, up.city, up.gender, up.avatar_url, up.is_vip,
             m.compatibility_score, m.created_at as match_date
      FROM matches m
      JOIN users u ON (u.id = m.user1_id OR u.id = m.user2_id) AND u.id != $1
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
      ORDER BY m.compatibility_score DESC, m.created_at DESC
      LIMIT 20
    `, [userId]);

    const formattedMatches = matches.rows.map(match => ({
      id: `match_${match.id}_${userId}`,
      user: {
        id: match.id,
        displayName: match.display_name,
        city: match.city || 'Não informado',
        gender: match.gender || 'other',
        avatarUrl: match.avatar_url || 'https://picsum.photos/100/100',
        isVip: match.is_vip || false
      },
      compatibilityScore: Math.round(match.compatibility_score || Math.random() * 30 + 70),
      matchDate: match.match_date
    }));

    res.json(formattedMatches);
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro ao buscar matches' });
  }
});

// Criar novo match (simulado)
app.post('/api/matches', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'ID do usuário alvo é obrigatório' });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await pool.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já existe um match
    const existingMatch = await pool.query(`
      SELECT id FROM matches 
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
    `, [userId, targetUserId]);

    if (existingMatch.rows.length > 0) {
      return res.status(409).json({ error: 'Match já existe' });
    }

    // Calcular compatibilidade (algoritmo simples por enquanto)
    const compatibilityScore = Math.random() * 30 + 70; // 70-100%

    // Criar o match
    const newMatch = await pool.query(`
      INSERT INTO matches (user1_id, user2_id, compatibility_score)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, targetUserId, compatibilityScore]);

    res.status(201).json({
      message: 'Match criado com sucesso',
      match: newMatch.rows[0],
      compatibilityScore: Math.round(compatibilityScore)
    });
  } catch (error) {
    console.error('Erro ao criar match:', error);
    res.status(500).json({ error: 'Erro ao criar match' });
  }
});

// Rotas para sistema de chat (básico)
app.get('/api/chats/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId;

    // Por enquanto, retornar mensagens mockadas
    // Em uma implementação real, verificaríamos se o usuário tem acesso ao chat
    const mockMessages = [
      {
        id: 'msg1',
        senderId: 'user1',
        text: 'Oi! Vi que temos bastante compatibilidade! 😊',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        isCurrentUser: false
      },
      {
        id: 'msg2',
        senderId: userId,
        text: 'Oi! Verdade, 92% é incrível! O que mais te chamou atenção?',
        timestamp: new Date(Date.now() - 1000 * 60 * 4),
        isCurrentUser: true
      }
    ];

    res.json(mockMessages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem (básico)
app.post('/api/chats/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
    }

    // Por enquanto, apenas simular o envio
    const newMessage = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      text: text.trim(),
      timestamp: new Date(),
      isCurrentUser: true
    };

    res.status(201).json({
      message: 'Mensagem enviada com sucesso',
      data: newMessage
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Rota para produtos recomendados (vendor area)
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

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'MatchIt API',
    version: '1.0.0'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Testar conexão com o banco
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 API disponível em http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;