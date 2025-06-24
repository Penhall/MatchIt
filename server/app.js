// server/app.js - Integração das rotas de perfil no servidor principal
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/helpers.js'; // CORRIGIDO: Importar logger de helpers.js
import pool from './config/database.js'; // Importar pool de conexão do banco de dados

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
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// ==============================================
// IMPORTAR ROTAS
// ==============================================

// Rotas existentes (manter compatibilidade)
import authRoutes from './routes/auth.js';
import recommendationRoutes from '../routes/recommendation/recommendations.js'; // CORRIGIDO: Caminho para o arquivo de rotas de recomendação

// Novas rotas de perfil (INTEGRAÇÃO FASE 0)
import profileRoutes from './routes/profile.js';

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
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas existentes
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);

// NOVA INTEGRAÇÃO: Rotas de perfil com preferências de estilo
app.use('/api/profile', profileRoutes);

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
    method: req.method
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
    await pool.query('SELECT NOW()');
    logger.info('Conexão com banco de dados estabelecida');
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor MatchIt rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`👤 Profile API: http://localhost:${PORT}/api/profile`);
      logger.info(`🎨 Style Preferences: http://localhost:${PORT}/api/profile/style-preferences`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Recebido sinal ${signal}, encerrando servidor...`);
      
      server.close(() => {
        logger.info('Servidor HTTP encerrado');
        
        // Fechar pool de conexões do banco
        pool.end(() => {
          logger.info('Pool de conexões do banco encerrado');
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
startServer();

export { app, startServer };
