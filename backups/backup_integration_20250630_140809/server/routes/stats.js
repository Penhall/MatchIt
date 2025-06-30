// server/routes/stats.js - Rotas de estatísticas e analytics
import express from 'express';
import { StatsService } from '../services/statsService.js';

const router = express.Router();
const statsService = new StatsService();

// GET /api/user/stats - Estatísticas do usuário
router.get('/stats', async (req, res) => {
  try {
    const stats = await statsService.getUserStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'STATS_FETCH_ERROR'
    });
  }
});

// GET /api/analytics/styles - Análise de estilos populares
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

// GET /api/analytics/matches - Análise de matches
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

// GET /api/analytics/general - Estatísticas gerais da plataforma
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

// GET /api/user/profile-completion - Percentual de completude do perfil
router.get('/profile-completion', async (req, res) => {
  try {
    const profileInfo = await statsService.getProfileInfo(req.user.userId);
    res.json({
      completion_percentage: profileInfo.completion_percentage,
      missing_fields: profileInfo.missing_fields || [],
      suggestions: [
        'Adicione uma foto de perfil',
        'Complete suas preferências de estilo',
        'Escreva uma bio interessante',
        'Defina sua localização'
      ]
    });
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'PROFILE_COMPLETION_ERROR'
    });
  }
});

// GET /api/user/activity - Atividade recente do usuário
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Mock activity data por enquanto
    const activities = [
      {
        id: 'activity_1',
        type: 'match',
        description: 'Novo match com Ana Silva',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        data: { match_id: 'match_123', user_name: 'Ana Silva' }
      },
      {
        id: 'activity_2',
        type: 'message',
        description: 'Nova mensagem recebida',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
        data: { message_preview: 'Oi! Como você está?' }
      },
      {
        id: 'activity_3',
        type: 'profile_update',
        description: 'Perfil atualizado',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        data: { field_updated: 'bio' }
      }
    ];
    
    res.json({
      activities: activities.slice(0, parseInt(limit)),
      total: activities.length,
      page: parseInt(page),
      hasMore: activities.length > parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'ACTIVITY_FETCH_ERROR'
    });
  }
});

// GET /api/analytics/trends - Tendências da plataforma
router.get('/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Mock trends data
    const trends = {
      period,
      popular_styles: [
        { style: 'cyber', growth: '+15%', users: 1250 },
        { style: 'neon', growth: '+12%', users: 980 },
        { style: 'dark', growth: '+8%', users: 750 }
      ],
      peak_hours: [
        { hour: '19:00', activity_score: 95 },
        { hour: '20:00', activity_score: 100 },
        { hour: '21:00', activity_score: 87 }
      ],
      demographics: {
        age_groups: {
          '18-24': 35,
          '25-30': 28,
          '31-35': 22,
          '36+': 15
        },
        gender_distribution: {
          'male': 52,
          'female': 45,
          'other': 3
        }
      }
    };
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'TRENDS_FETCH_ERROR'
    });
  }
});

export default router;