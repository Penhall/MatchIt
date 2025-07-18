// server/routes/index.js - Agregador central de todas as rotas
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { config } from '../config/environment.js';

// Importar todas as rotas modulares
import authRoutes from './auth.js';
import healthRoutes from './health.js';
import profileRoutes from './profile.js';
import matchRoutes from './matches.js';
import productRoutes from './products.js';
import subscriptionRoutes from './subscription.js';
import statsRoutes from './stats.js';
import chatRoutes from './chat.js';

// Importar nova rota de style preferences
import stylePreferencesRoutes from './stylePreferences.js';
import styleAdjustmentRoutes from './styleAdjustment.js'; // MODIFICADO: Importar novas rotas

// Importar rota de recomendação se disponível
let recommendationRoutes = null;
if (config.features.enableRecommendations) {
  try {
    const { default: recRoutes } = await import('./recommendations.js');
    recommendationRoutes = recRoutes;
  } catch (error) {
    console.log('⚠️ Rotas de recomendação não disponíveis:', error.message);
  }
}

// Importar rotas de admin dinamicamente
let adminRoutes = null;
try {
  const adminModule = await import('./admin.js');
  adminRoutes = adminModule.default;
} catch (error) {
  console.error('⚠️ Falha ao carregar rotas administrativas:', error.message);
}

const router = Router();

// =====================================================
// ROTAS PÚBLICAS (sem autenticação)
// =====================================================

// Rotas de saúde e informações
router.use('/', healthRoutes);

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de produtos (públicas)
router.use('/products', productRoutes);

// =====================================================
// ROTAS PRIVADAS (com autenticação obrigatória)
// =====================================================

// Middleware de autenticação para todas as rotas abaixo
router.use(authenticateToken);

// Rotas administrativas
if (adminRoutes) {
  router.use('/admin', adminRoutes);
}

// MODIFICADO: Usar as novas rotas de ajuste de estilo
router.use('/style', styleAdjustmentRoutes);

// Rota de Style Preferences (pode ser mantida ou removida se redundante)
router.use('/style-preferences', stylePreferencesRoutes);

// Rotas de perfil
router.use('/profile', profileRoutes);

// Rotas de matches
router.use('/matches', matchRoutes);

// Rotas de chat
router.use('/matches', chatRoutes); // Para /api/matches/:matchId/messages

// Rotas de estatísticas
router.use('/user', statsRoutes);
router.use('/analytics', statsRoutes);

// Rotas de assinatura VIP
router.use('/subscription', subscriptionRoutes);

// =====================================================
// ROTAS OPCIONAIS (dependem de features habilitadas)
// =====================================================

// Sistema de recomendação (se habilitado)
if (config.features.enableRecommendations && recommendationRoutes) {
  router.use('/recommendations', recommendationRoutes);
  console.log('✅ Rotas de recomendação carregadas');
}

// =====================================================
// ROTAS DE TESTE E DEBUG (apenas em desenvolvimento)
// =====================================================

if (config.nodeEnv === 'development') {
  // Rota de teste para verificar autenticação
  router.get('/test/auth', authenticateToken, (req, res) => {
    res.json({
      message: 'Autenticação funcionando!',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  });
  
  // Rota de teste para verificar banco de dados
  router.get('/test/database', async (req, res) => {
    try {
      const { pool } = await import('../config/database.js');
      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      
      res.json({
        message: 'Banco de dados funcionando!',
        current_time: result.rows[0].current_time,
        db_version: result.rows[0].db_version,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        message: 'Erro no banco de dados',
        error: error.message
      });
    }
  });
  
  console.log('🔧 Rotas de desenvolvimento carregadas');
}

// =====================================================
// ROTA DE FALLBACK PARA FUNCIONALIDADES NÃO IMPLEMENTADAS
// =====================================================

router.use('/not-implemented', (req, res) => {
  res.status(501).json({
    error: 'Funcionalidade não implementada',
    message: 'Esta funcionalidade está em desenvolvimento',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// MIDDLEWARE DE LOG DE ROTAS CARREGADAS
// =====================================================

if (config.nodeEnv === 'development') {
  console.log('📋 Rotas carregadas:');
  console.log('  ✅ /api/health, /api/info, /api/ping');
  console.log('  ✅ /api/auth/register, /api/auth/login');
  console.log('  ✅ /api/profile, /api/profile/style-choices');
  console.log('  ✅ /api/style (NEW!)');
  console.log('  ✅ /api/style-preferences');
  console.log('  ✅ /api/matches, /api/matches/potential');
  console.log('  ✅ /api/matches/:matchId/messages');
  console.log('  ✅ /api/products, /api/products/recommended');
  console.log('  ✅ /api/subscription');
  console.log('  ✅ /api/user/stats, /api/analytics/styles');
  
  if (config.features.enableRecommendations && recommendationRoutes) {
    console.log('  ✅ /api/recommendations, /api/recommendations/feedback');
  }
  
  console.log('  🔧 /api/test/auth, /api/test/database (dev only)');
}

export default router;
