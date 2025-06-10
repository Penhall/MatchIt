// server/routes/stats.js - Stats and analytics routes
import express from 'express';
import { StatsService } from '../services/statsService.js';

const router = express.Router();
const statsService = new StatsService();

// GET /stats - User stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await statsService.getUserStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'STATS_FETCH_ERROR'
    });
  }
});

// GET /styles - Style analytics
router.get('/styles', async (req, res) => {
  try {
    const analytics = await statsService.getStyleAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching style analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'STYLE_ANALYTICS_ERROR'
    });
  }
});

// GET /matches - Match analytics
router.get('/matches', async (req, res) => {
  try {
    const analytics = await statsService.getMatchAnalytics(req.user.userId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching match analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'MATCH_ANALYTICS_ERROR'
    });
  }
});

// GET /general - Platform stats (admin)
router.get('/general', async (req, res) => {
  try {
    const analytics = await statsService.getGeneralAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching general analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'GENERAL_ANALYTICS_ERROR'
    });
  }
});

export default router;
