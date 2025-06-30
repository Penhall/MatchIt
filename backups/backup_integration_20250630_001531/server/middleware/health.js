// server/middleware/health.js - Health check and basic info endpoints
import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Basic health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'MatchIt API'
  });
});

// System information endpoint
router.get('/info', async (req, res) => {
  try {
    const packageJson = JSON.parse(
      await readFile(join(__dirname, '../../../package.json'), 'utf-8')
    );
    
    res.status(200).json({
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      node: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(200).json({
      error: 'Could not load package info',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

export default router;
