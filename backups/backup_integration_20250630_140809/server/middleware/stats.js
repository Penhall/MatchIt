// server/middleware/stats.js - Stats routes
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Stats endpoint',
    timestamp: new Date().toISOString()
  });
});

router.get('/analytics/styles', (req, res) => {
  res.status(200).json({ 
    message: 'Style analytics endpoint',
    timestamp: new Date().toISOString()
  });
});

export default router;
