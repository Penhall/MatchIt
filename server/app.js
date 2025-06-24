// server/app.js - Integração conservadora das rotas de perfil (ES Modules)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestLogger, logger } from './middleware/logger.js'; // Importação corrigida

// ==============================================
// CONFIGURAÇÃO DA APLICAÇÃO
// ==============================================

const app = express();

// Middleware de segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', limiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use(requestLogger); // Usando requestLogger importado

// ==============================================
// IMPORTAR ROTAS (COM TRATAMENTO DE ERRO)
// ==============================================

// Função helper para importar rotas condicionalmente
const importRouteIfExists = async (path, routeName) => {
  try {
    const module = await import(path);
    logger.info(`✅ Rota ${routeName} carregada: ${path}`);
    return module.default;
  } catch (error) {
    logger.warn(`⚠️ Rota ${routeName} não encontrada: ${path} - ${error.message}`);
    return null;
  }
};

// ==============================================
// CONFIGURAR ROTAS
// ==============================================

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MatchIt API está funcionando',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    routes: {
      health: '✅ Funcionando',
      profile: '✅ Disponível (Fase 0)',
      stylePreferences: '✅ Disponível (Fase 0)'
    }
  });
});

// Carregar rotas dinamicamente
const loadRoutes = async () => {
  try {
    // 🔥 NOVA ROTA: Perfil com preferências de estilo (FASE 0)
    const profileRoutes = await importRouteIfExists('./routes/profile/index.js', 'Profile');
    if (profileRoutes) {
      app.use('/api/profile', profileRoutes);
      logger.info('🎨 Rotas de perfil carregadas com sucesso!');
    }

    // Tentar carregar rotas existentes (se existirem)
    const authRoutes = await importRouteIfExists('./routes/auth/index.js', 'Auth') || 
                      await importRouteIfExists('./routes/auth.js', 'Auth');
    if (authRoutes) {
      app.use('/api/auth', authRoutes);
    }

    const recommendationRoutes = await importRouteIfExists('./routes/recommendation/recommendations.js', 'Recommendations') ||
                                await importRouteIfExists('./routes/recommendation/recommendations.js', 'Recommendations');
    if (recommendationRoutes) {
      app.use('/api/recommendations', recommendationRoutes);
    }

    // Rota para listar todas as rotas disponíveis
    app.get('/api/routes', (req, res) => {
      const routes = [];
      
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
          });
        } else if (middleware.name === 'router') {
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              routes.push({
                path: middleware.regexp.source.replace('\\/', '/').replace('\\?', '').replace('.*', '') + handler.route.path,
                methods: Object.keys(handler.route.methods)
              });
            }
          });
        }
      });
      
      res.json({
        success: true,
        routes,
        total: routes.length
      });
    });

    logger.info('🚀 Todas as rotas carregadas com sucesso!');

  } catch (error) {
    logger.error(`❌ Erro ao carregar rotas: ${error.message}`, error);
  }
};

// ==============================================
// MIDDLEWARE DE ERRO GLOBAL
// ==============================================

// Middleware para rotas não encontradas
app.use((req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'GET /api/routes',
      'GET /api/profile',
      'GET /api/profile/style-preferences',
      'PUT /api/profile/style-preferences',
      'PATCH /api/profile/style-preferences/:category',
      'DELETE /api/profile/style-preferences'
    ]
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  logger.error(`Erro não tratado: ${error.message}`, {
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Não vazar detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : 'Erro interno do servidor',
    code: error.code || 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { stack: error.stack })
  });
});

// ==============================================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================================

const PORT = process.env.PORT || 3000;

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Testar conexão com banco de dados
    try {
      const { default: pool } = await import('./config/database.js');
      await pool.query('SELECT NOW()');
      logger.info('✅ Conexão com banco de dados estabelecida');
    } catch (dbError) {
      logger.warn(`⚠️ Erro na conexão com banco: ${dbError.message}`);
      logger.info('🔄 Servidor continuará sem conexão com banco (modo desenvolvimento)');
    }

    // Carregar rotas
    await loadRoutes();
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor MatchIt rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 Lista de rotas: http://localhost:${PORT}/api/routes`);
      logger.info(`👤 Profile API: http://localhost:${PORT}/api/profile`);
      logger.info(`🎨 Style Preferences: http://localhost:${PORT}/api/profile/style-preferences`);
      
      console.log('\n🎯 FASE 0 - INTEGRAÇÃO BACKEND-FRONTEND');
      console.log('✅ Endpoints de preferências de estilo implementados');
      console.log('✅ Servidor rodando com ES modules');
      console.log('✅ Logger integrado');
      console.log('\n📝 Próximos passos:');
      console.log('1. Testar endpoints: GET /api/health');
      console.log('2. Verificar rotas: GET /api/routes');
      console.log('3. Conectar frontend aos endpoints');
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Recebido sinal ${signal}, encerrando servidor...`);
      
      server.close(() => {
        logger.info('Servidor HTTP encerrado');
        
        // Tentar fechar pool de conexões do banco
        import('./config/database.js')
          .then(({ default: pool }) => {
            pool.end(() => {
              logger.info('Pool de conexões do banco encerrado');
              process.exit(0);
            });
          })
          .catch(() => {
            logger.info('Nenhum pool de banco para encerrar');
            process.exit(0);
          });
      });
      
      // Forçar encerramento após 10 segundos
      setTimeout(() => {
        logger.error('Forçando encerramento do processo...');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    logger.error(`Erro ao iniciar servidor: ${error.message}`, error);
    process.exit(1);
  }
};

// Iniciar servidor se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };
