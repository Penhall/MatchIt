// server/app.js - Servidor Principal MatchIt com Debug de Imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Iniciando servidor MatchIt...');

// =====================================================
// CONFIGURAÇÕES DE SEGURANÇA E MIDDLEWARE
// =====================================================

// Helmet para segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compressão
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: {
    success: false,
    error: 'Muitas requisições deste IP, tente novamente mais tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log de requests em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// FUNÇÃO PARA IMPORTAR ROTAS COM SEGURANÇA
// =====================================================

const safeRequire = (modulePath, fallbackName) => {
  try {
    const module = require(modulePath);
    
    // Verificar se é um router válido
    if (typeof module === 'function') {
      console.log(`✅ ${fallbackName} carregado com sucesso`);
      return module;
    } else if (module && typeof module === 'object' && typeof module.router === 'function') {
      console.log(`✅ ${fallbackName} carregado (usando module.router)`);
      return module.router;
    } else {
      console.error(`❌ ${fallbackName} não é um router válido:`, typeof module);
      console.error('Módulo exportado:', module);
      throw new Error(`${fallbackName} não exporta um router do Express`);
    }
  } catch (error) {
    console.warn(`⚠️ ${fallbackName} não encontrado ou inválido:`, error.message);
    
    // Criar router de fallback
    const fallbackRouter = express.Router();
    fallbackRouter.all('*', (req, res) => {
      res.status(501).json({
        success: false,
        error: `${fallbackName} em desenvolvimento`,
        message: `Por favor, verifique o arquivo ${modulePath}`,
        details: error.message
      });
    });
    return fallbackRouter;
  }
};

// =====================================================
// ROTAS BÁSICAS (HEALTH CHECK)
// =====================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Info da aplicação
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    app: 'MatchIt Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: true,
      profile: true,
      stylePreferences: true,
      emotionalProfile: true
    },
    endpoints: {
      health: 'GET /api/health',
      info: 'GET /api/info',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      profile: {
        get: 'GET /api/profile',
        stylePreferences: 'GET /api/profile/style-preferences',
        updateStylePreferences: 'PUT /api/profile/style-preferences'
      }
    }
  });
});

// =====================================================
// IMPORTAR E CONFIGURAR ROTAS
// =====================================================

console.log('📋 Carregando rotas...');

// Carregar rotas de autenticação
const authRoutes = safeRequire('./routes/auth', 'Rotas de autenticação');
app.use('/api/auth', authRoutes);

// Carregar rotas de perfil
const profileRoutes = safeRequire('./routes/profile', 'Rotas de perfil');
app.use('/api/profile', profileRoutes);

// =====================================================
// ROTAS DE DESENVOLVIMENTO E TESTE
// =====================================================

if (process.env.NODE_ENV === 'development') {
  // Rota de teste simples
  app.get('/api/test', (req, res) => {
    res.json({
      success: true,
      message: 'Servidor funcionando!',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      platform: process.platform
    });
  });

  // Rota de teste de banco de dados
  app.get('/api/test/database', async (req, res) => {
    try {
      const { pool } = require('./config/database');
      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      
      res.json({
        success: true,
        message: 'Banco de dados conectado!',
        current_time: result.rows[0].current_time,
        db_version: result.rows[0].db_version
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro na conexão com banco de dados',
        details: error.message
      });
    }
  });

  // Rota de debug para verificar rotas carregadas
  app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach(function(middleware) {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods);
        routes.push({
          path: middleware.route.path,
          methods: methods
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(function(handler) {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods);
            routes.push({
              path: handler.route.path,
              methods: methods
            });
          }
        });
      }
    });
    
    res.json({
      success: true,
      routes: routes,
      total: routes.length
    });
  });
}

// =====================================================
// MIDDLEWARE DE ERRO E FALLBACK
// =====================================================

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  const availableRoutes = [
    'GET /api/health',
    'GET /api/info',
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET /api/auth/me',
    'POST /api/auth/logout',
    'GET /api/profile',
    'GET /api/profile/style-preferences',
    'PUT /api/profile/style-preferences',
    'PATCH /api/profile/style-preferences/:category',
    'DELETE /api/profile/style-preferences',
    'GET /api/test (dev only)',
    'GET /api/test/database (dev only)',
    'GET /api/debug/routes (dev only)'
  ];

  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method,
    availableRoutes: availableRoutes
  });
});

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);

  // Não enviar stack trace em produção
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
    code: error.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { 
      stack: error.stack,
      details: error 
    })
  });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Servidor MatchIt iniciado com sucesso!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕐 Hora: ${new Date().toLocaleString()}`);
  console.log('');
  console.log('📋 Endpoints principais:');
  console.log('  ✅ GET  /api/health           - Health check');
  console.log('  ✅ GET  /api/info             - Informações da API');
  console.log('  ✅ POST /api/auth/register    - Registrar usuário');
  console.log('  ✅ POST /api/auth/login       - Login');
  console.log('  ✅ GET  /api/profile          - Perfil do usuário');
  console.log('  ✅ GET  /api/profile/style-preferences - Preferências');
  console.log('');
  console.log('🔧 Para testar:');
  console.log(`   curl http://localhost:${PORT}/api/health`);
  console.log(`   curl http://localhost:${PORT}/api/info`);
  console.log('');
});

// Tratamento de sinais de encerramento
const gracefulShutdown = (signal) => {
  console.log(`📴 Recebido ${signal}, encerrando servidor graciosamente...`);
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
  
  // Forçar encerramento após 10 segundos
  setTimeout(() => {
    console.log('⚠️ Forçando encerramento...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;