// server/app.js - Aplicação principal com todas as rotas das Fases 0 e 1
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Importar rotas
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const tournamentRoutes = require('./routes/tournament');
const recommendationRoutes = require('./routes/recommendations');

// Importar middlewares
const authMiddleware = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARES GLOBAIS
// =====================================================

// Segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rate limiting específico para upload de imagens
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 uploads por hora
  message: {
    success: false,
    message: 'Limite de uploads excedido. Tente novamente em uma hora.'
  }
});

// Compressão
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, '..', 'logs', 'access.log'), { flags: 'a' })
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexão com banco de dados
    const dbResult = await pool.query('SELECT NOW() as timestamp');
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: 'connected',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// =====================================================
// ROTAS DA API
// =====================================================

// Rotas de autenticação (públicas)
app.use('/api/auth', authRoutes);

// Aplicar rate limiting específico para uploads
app.use('/api/tournament/admin/images', uploadLimiter);

// Rotas protegidas
app.use('/api/profile', profileRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/recommendations', recommendationRoutes);

// =====================================================
// ROTAS ADMINISTRATIVAS
// =====================================================

// Endpoint para verificar status do sistema (apenas admins)
app.get('/api/admin/status', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Estatísticas do sistema
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM tournament_sessions WHERE status = 'active') as active_tournaments,
        (SELECT COUNT(*) FROM tournament_images WHERE approved = true) as approved_images,
        (SELECT COUNT(*) FROM tournament_results WHERE completed_at > NOW() - INTERVAL '24 hours') as tournaments_last_24h,
        (SELECT AVG(session_duration_minutes) FROM tournament_results WHERE completed_at > NOW() - INTERVAL '7 days') as avg_duration_week
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar status do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para logs do sistema (apenas admins)
app.get('/api/admin/logs', authMiddleware, (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const { lines = 100 } = req.query;
    const logPath = path.join(__dirname, '..', 'logs', 'access.log');

    if (!fs.existsSync(logPath)) {
      return res.json({
        success: true,
        data: { logs: 'Arquivo de log não encontrado' }
      });
    }

    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .slice(-parseInt(lines))
      .join('\n');

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTA PADRÃO PARA SPA
// =====================================================

app.get('*', (req, res) => {
  res.json({
    success: false,
    message: 'Endpoint não encontrado',
    available_endpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/profile/style-preferences',
      'POST /api/tournament/start',
      'GET /api/tournament/categories'
    ]
  });
});

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =====================================================

app.use(errorHandler);

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

// Criar diretórios necessários
const createDirectories = () => {
  const dirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'tournament-images'),
    path.join(__dirname, '..', 'logs')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório criado: ${dir}`);
    }
  });
};

// Testar conexão com banco de dados
const testDatabaseConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp');
    console.log('✅ Conexão com banco de dados estabelecida:', result.rows[0].timestamp);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error.message);
    return false;
  }
};

// Verificar migração do banco
const checkMigrations = async () => {
  try {
    // Verificar se tabelas principais existem
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'style_choices', 'tournament_images', 'tournament_sessions')
    `);

    const tableNames = tables.rows.map(row => row.table_name);
    const requiredTables = ['users', 'style_choices', 'tournament_images', 'tournament_sessions'];
    
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Tabelas não encontradas:', missingTables.join(', '));
      console.log('Execute a migração: psql -d seu_banco -f database/migrations/002_complete_style_and_tournament_schema.sql');
      return false;
    }

    console.log('✅ Todas as tabelas necessárias estão presentes');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar migração:', error.message);
    return false;
  }
};

// Função principal de inicialização
const startServer = async () => {
  console.log('🚀 Iniciando servidor MatchIt...');
  
  // Criar diretórios
  createDirectories();
  
  // Testar banco de dados
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Falha na conexão com banco de dados. Verifique as configurações.');
    process.exit(1);
  }
  
  // Verificar migração
  const migrationsOk = await checkMigrations();
  if (!migrationsOk) {
    console.error('❌ Migração do banco de dados não foi executada.');
    console.log('Execute: npm run migrate ou execute manualmente o arquivo de migração');
    process.exit(1);
  }
  
  // Iniciar servidor
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('🎉 Servidor MatchIt iniciado com sucesso!');
    console.log('');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API Base: http://localhost:${PORT}/api`);
    console.log('');
    console.log('📋 Endpoints principais:');
    console.log('  • Autenticação: POST /api/auth/register, /api/auth/login');
    console.log('  • Perfil: GET/PUT /api/profile/style-preferences');
    console.log('  • Torneios: POST /api/tournament/start');
    console.log('  • Categorias: GET /api/tournament/categories');
    console.log('  • Admin: GET /api/admin/status (apenas admins)');
    console.log('');
    console.log('🎮 Sistema pronto para as Fases 0 e 1!');
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      pool.end();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      pool.end();
      process.exit(0);
    });
  });
};

// Inicializar se executado diretamente
if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  });
}

module.exports = app;