// server/app.js - Servidor simplificado e robusto para debug (ES Modules)
import express from 'express';
import cors from 'cors';

// ==============================================
// CONFIGURAÇÃO INICIAL E DEBUG
// ==============================================

console.log('🔄 Iniciando servidor MatchIt...');
console.log('📁 Arquivo:', import.meta.url);
console.log('🌍 Node version:', process.version);
console.log('📦 Processo:', process.argv[1]);

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// LOGGER SIMPLES (FALLBACK)
// ==============================================

const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }
};

logger.info('✅ Logger inicializado');

// ==============================================
// MIDDLEWARE BÁSICO
// ==============================================

// CORS simples
app.use(cors({
  origin: '*', // Permitir todas as origens para teste
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const startTime = Date.now();
  logger.info(`→ ${req.method} ${req.originalUrl}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`← ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

logger.info('✅ Middleware básico configurado');

// ==============================================
// ROTAS BÁSICAS (SEM DEPENDÊNCIAS)
// ==============================================

// Health check
app.get('/api/health', (req, res) => {
  logger.info('Health check solicitado');
  
  res.json({
    success: true,
    message: 'MatchIt API está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0-fase0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    status: {
      server: '✅ Funcionando',
      cors: '✅ Configurado',
      bodyParser: '✅ Configurado',
      logger: '✅ Funcionando'
    }
  });
});

// Informações do servidor
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    server: {
      node: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    },
    routes: {
      available: [
        'GET /api/health',
        'GET /api/info',
        'GET /api/test',
        'POST /api/test'
      ]
    }
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  logger.info('Rota de teste GET acessada');
  res.json({
    success: true,
    message: 'Rota de teste funcionando',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/test', (req, res) => {
  logger.info('Rota de teste POST acessada', req.body);
  res.json({
    success: true,
    message: 'Rota de teste POST funcionando',
    method: 'POST',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

logger.info('✅ Rotas básicas configuradas');

// ==============================================
// CARREGAR ROTAS AVANÇADAS (CONDICIONALMENTE)
// ==============================================

const loadAdvancedRoutes = async () => {
  try {
    logger.info('🔄 Tentando carregar rotas avançadas...');
    
    // Tentar carregar middleware de autenticação
    let authenticateToken = null;
    try {
      const authModule = await import('./middleware/auth.js');
      authenticateToken = authModule.authenticateToken;
      logger.info('✅ Middleware de autenticação carregado');
    } catch (error) {
      logger.warn('⚠️ Middleware de autenticação não encontrado:', error.message);
      // Criar mock de autenticação para desenvolvimento
      authenticateToken = (req, res, next) => {
        req.user = { id: 'dev-user-123' };
        next();
      };
      logger.info('✅ Mock de autenticação criado');
    }

    // Tentar carregar pool de banco
    let pool = null;
    try {
      const dbModule = await import('./config/database.js');
      pool = dbModule.default;
      await pool.query('SELECT NOW()');
      logger.info('✅ Conexão com banco estabelecida');
    } catch (error) {
      logger.warn('⚠️ Banco de dados não disponível:', error.message);
      // Criar mock de pool para desenvolvimento
      pool = {
        query: async (sql, params) => {
          logger.info(`Mock DB Query: ${sql}`, params);
          
          // Mock responses básicos
          if (sql.includes('user_profiles')) {
            return {
              rows: [{
                id: 1,
                user_id: 'dev-user-123',
                style_preferences: {
                  tenis: [],
                  roupas: [],
                  cores: [],
                  hobbies: [],
                  sentimentos: []
                },
                created_at: new Date(),
                updated_at: new Date()
              }]
            };
          }
          
          return { rows: [] };
        }
      };
      logger.info('✅ Mock de banco criado');
    }

    // Criar rotas de preferências de estilo inline
    const styleRouter = express.Router();

    // GET /api/profile/style-preferences
    styleRouter.get('/', authenticateToken, async (req, res) => {
      const startTime = Date.now();
      
      try {
        const userId = req.user.id;
        logger.info(`[StylePreferences] Buscando preferências para usuário ${userId}`);
        
        const preferences = {
          tenis: [],
          roupas: [],
          cores: [],
          hobbies: [],
          sentimentos: []
        };
        
        const completionStatus = {
          completed: false,
          totalCategories: 5,
          completedCategories: 0,
          completionPercentage: 0
        };
        
        res.json({
          success: true,
          data: {
            userId,
            preferences,
            completionStatus,
            metadata: {
              profileId: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isNew: true
            }
          },
          processingTime: Date.now() - startTime
        });
        
      } catch (error) {
        logger.error(`[StylePreferences] Erro: ${error.message}`);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          code: 'FETCH_PREFERENCES_ERROR',
          processingTime: Date.now() - startTime
        });
      }
    });

    // PUT /api/profile/style-preferences
    styleRouter.put('/', authenticateToken, async (req, res) => {
      const startTime = Date.now();
      
      try {
        const userId = req.user.id;
        const { preferences } = req.body;
        
        logger.info(`[StylePreferences] Atualizando preferências para usuário ${userId}`, preferences);
        
        // Simular salvamento
        const completionStatus = {
          completed: true,
          totalCategories: 5,
          completedCategories: 5,
          completionPercentage: 100
        };
        
        res.json({
          success: true,
          data: {
            userId,
            preferences: preferences || {},
            completionStatus,
            metadata: {
              profileId: 1,
              updatedAt: new Date().toISOString(),
              totalUpdates: 1
            }
          },
          message: 'Preferências atualizadas com sucesso',
          processingTime: Date.now() - startTime
        });
        
      } catch (error) {
        logger.error(`[StylePreferences] Erro: ${error.message}`);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          code: 'UPDATE_PREFERENCES_ERROR',
          processingTime: Date.now() - startTime
        });
      }
    });

    // PATCH /api/profile/style-preferences/:category
    styleRouter.patch('/:category', authenticateToken, async (req, res) => {
      const startTime = Date.now();
      
      try {
        const userId = req.user.id;
        const { category } = req.params;
        const { choices } = req.body;
        
        logger.info(`[StylePreferences] Atualizando categoria ${category} para usuário ${userId}`, choices);
        
        const validCategories = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            error: `Categoria inválida. Válidas: ${validCategories.join(', ')}`,
            code: 'INVALID_CATEGORY'
          });
        }
        
        res.json({
          success: true,
          data: {
            userId,
            category,
            choices: choices || [],
            allPreferences: { [category]: choices || [] },
            metadata: {
              profileId: 1,
              updatedAt: new Date().toISOString(),
              isNewProfile: false
            }
          },
          message: `Categoria ${category} atualizada`,
          processingTime: Date.now() - startTime
        });
        
      } catch (error) {
        logger.error(`[StylePreferences] Erro: ${error.message}`);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          code: 'UPDATE_CATEGORY_ERROR',
          processingTime: Date.now() - startTime
        });
      }
    });

    // DELETE /api/profile/style-preferences
    styleRouter.delete('/', authenticateToken, async (req, res) => {
      const startTime = Date.now();
      
      try {
        const userId = req.user.id;
        logger.info(`[StylePreferences] Removendo preferências para usuário ${userId}`);
        
        const emptyPreferences = {
          tenis: [],
          roupas: [],
          cores: [],
          hobbies: [],
          sentimentos: []
        };
        
        res.json({
          success: true,
          data: {
            userId,
            preferences: emptyPreferences,
            metadata: {
              profileId: 1,
              updatedAt: new Date().toISOString(),
              cleared: true
            }
          },
          message: 'Todas as preferências foram removidas',
          processingTime: Date.now() - startTime
        });
        
      } catch (error) {
        logger.error(`[StylePreferences] Erro: ${error.message}`);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          code: 'DELETE_PREFERENCES_ERROR',
          processingTime: Date.now() - startTime
        });
      }
    });

    // Registrar rotas
    app.use('/api/profile/style-preferences', styleRouter);
    
    // Rota de perfil simples
    app.get('/api/profile', authenticateToken, async (req, res) => {
      try {
        res.json({
          success: true,
          data: {
            userId: req.user.id,
            email: 'dev@example.com',
            stylePreferences: {
              tenis: [],
              roupas: [],
              cores: [],
              hobbies: [],
              sentimentos: []
            },
            metadata: {
              hasProfile: true,
              isComplete: { percentage: 0 }
            }
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    logger.info('✅ Rotas avançadas carregadas com sucesso');
    
  } catch (error) {
    logger.error('❌ Erro ao carregar rotas avançadas:', error.message);
  }
};

// ==============================================
// MIDDLEWARE DE ERRO
// ==============================================

// 404 handler
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
      'GET /api/info', 
      'GET /api/test',
      'POST /api/test',
      'GET /api/profile',
      'GET /api/profile/style-preferences',
      'PUT /api/profile/style-preferences',
      'PATCH /api/profile/style-preferences/:category',
      'DELETE /api/profile/style-preferences'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error(`Erro não tratado: ${error.message}`, error.stack);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor',
    code: error.code || 'INTERNAL_SERVER_ERROR'
  });
});

logger.info('✅ Middleware de erro configurado');

// ==============================================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================================

const startServer = async () => {
  try {
    logger.info('🚀 Iniciando processo de startup...');
    
    // Carregar rotas avançadas
    await loadAdvancedRoutes();
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(60));
      logger.info('🎉 SERVIDOR MATCHIT INICIADO COM SUCESSO!');
      logger.info('='.repeat(60));
      logger.info(`🌐 URL: http://localhost:${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🕐 Iniciado em: ${new Date().toISOString()}`);
      logger.info('');
      logger.info('🔗 Endpoints disponíveis:');
      logger.info(`   Health Check: http://localhost:${PORT}/api/health`);
      logger.info(`   Server Info:  http://localhost:${PORT}/api/info`);
      logger.info(`   Teste GET:    http://localhost:${PORT}/api/test`);
      logger.info(`   Profile:      http://localhost:${PORT}/api/profile`);
      logger.info(`   Preferências: http://localhost:${PORT}/api/profile/style-preferences`);
      logger.info('');
      logger.info('🎯 FASE 0 - INTEGRAÇÃO BACKEND-FRONTEND');
      logger.info('✅ Endpoints de preferências implementados');
      logger.info('✅ Mock de autenticação ativo');
      logger.info('✅ Mock de banco de dados ativo');
      logger.info('✅ CORS configurado para desenvolvimento');
      logger.info('');
      logger.info('📝 Para testar:');
      logger.info('   curl http://localhost:3000/api/health');
      logger.info('   curl http://localhost:3000/api/info');
      logger.info('='.repeat(60));
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Recebido sinal ${signal}, encerrando servidor...`);
      
      server.close(() => {
        logger.info('✅ Servidor HTTP encerrado');
        process.exit(0);
      });
      
      // Forçar encerramento após 10 segundos
      setTimeout(() => {
        logger.error('❌ Forçando encerramento...');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    logger.error(`❌ ERRO CRÍTICO ao iniciar servidor: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// ==============================================
// EXECUÇÃO
// ==============================================

logger.info('🔄 Chamando startServer()...');

// Chamar startServer imediatamente
startServer()
  .then(() => {
    logger.info('✅ startServer() executado com sucesso');
  })
  .catch((error) => {
    logger.error('❌ Erro em startServer():', error);
    process.exit(1);
  });

// Log final para debug
logger.info('📝 Final do arquivo app.js alcançado');

export { app, startServer };