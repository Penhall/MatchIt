// server/routes/health.js - Health monitoring routes
import express from 'express';
import { pool } from '../config/database.js';
import { config } from '../config/environment.js';

const router = express.Router();

// GET /api/health - Main health check
router.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as timestamp, version() as db_version');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: {
        status: 'connected',
        host: config.database.host,
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

// GET /api/health/database - Database health check
router.get('/health/database', async (req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    const duration = Date.now() - start;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        response_time: duration + 'ms',
        user_count: result.rows[0].user_count,
        pool_status: {
          total_connections: pool.totalCount,
          idle_connections: pool.idleCount,
          waiting_requests: pool.waitingCount
        }
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: { status: 'disconnected' },
      error: error.message
    });
  }
});

// GET /api/info - API information
router.get('/info', (req, res) => {
  res.json({
    name: 'MatchIt API',
    version: '1.0.0',
    environment: config.nodeEnv,
    features: config.features,
    documentation: {
      readme: '/README-MODULAR.md',
      environment_example: '/.env.example'
    }
  });
});

// GET /api/ping - Simple ping
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

export default router;
