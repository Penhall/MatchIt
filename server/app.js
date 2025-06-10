// server/app.js - Aplicação principal modularizada
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();

// Configuração do banco
const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTimestamp: result.rows[0].timestamp,
      message: 'Servidor modularizado funcionando!'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Rota de informações
app.get('/api/info', (req, res) => {
  res.json({
    name: 'MatchIt API',
    version: '1.0.0',
    architecture: 'modular',
    environment: process.env.NODE_ENV || 'development',
    message: 'Estrutura modular implementada com sucesso!'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'MatchIt API - Estrutura Modular',
    version: '1.0.0',
    health: '/api/health',
    info: '/api/info',
    documentation: 'README-MODULAR.md'
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Testar conexão com banco
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco estabelecida');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor MatchIt (Modular) rodando na porta ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📖 Info: http://localhost:${PORT}/api/info`);
      console.log('✅ Modularização implementada com sucesso!');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 Encerrando servidor...');
      server.close();
      await pool.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
