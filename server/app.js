// server/app.js - Entry point principal do MatchIt Backend (Estrutura Modular)
import express from 'express';
import { initializeDatabase } from './config/database.js';
import { config, validateConfig, isDevelopment } from './config/environment.js';
import configureMiddleware from './middleware/configure.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './middleware/index.js';
import { gracefulShutdown, logger } from './utils/helpers.js';

// Validar configurações antes de iniciar
try {
  validateConfig();
  // Inicializar logger com configurações
  const { initLogger } = await import('./utils/helpers.js');
  initLogger(config);
} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
  process.exit(1);
}

const app = express();

// =====================================================
// CONFIGURAÇÃO DE MIDDLEWARE
// =====================================================

configureMiddleware(app);

// =====================================================
// CONFIGURAÇÃO DE ROTAS
// =====================================================

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'MatchIt API - Estrutura Modular',
    version: '1.0.0',
    environment: config.nodeEnv,
    documentation: '/api/info',
    health: '/api/health'
  });
});

// Rotas da API
app.use('/api', routes);

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =====================================================

// Handler para rotas não encontradas
app.use('*', notFoundHandler);

// Handler global de erros
app.use(errorHandler);

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

const startServer = async () => {
  try {
    logger.info('🚀 Iniciando MatchIt Backend - Estrutura Modular');
    
    // Inicializar banco de dados
    await initializeDatabase();
    logger.info('✅ Database inicializado');
    
    // Iniciar servidor HTTP
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Servidor rodando na porta ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`💾 Database: ${config.database.host}:${config.database.port}`);
      logger.info(`🌐 Health check: http://localhost:${config.port}/api/health`);
      logger.info(`📖 API info: http://localhost:${config.port}/api/info`);
      
      if (isDevelopment()) {
        logger.info('🔧 Modo desenvolvimento ativo');
      }
    });

    // Configurar timeout do servidor
    server.timeout = 60000; // 60 segundos
    
    // Configurar graceful shutdown
    gracefulShutdown(server);
    
    logger.info('✅ Servidor iniciado com sucesso');
    
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar o servidor
startServer();

export default app;
