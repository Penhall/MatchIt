// server/routes/products.js - Rotas de produtos/marketplace
import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { ProductService } from '../services/productService.js';

const router = express.Router();
const productService = new ProductService();

// GET /api/products - Listar produtos
router.get('/products', optionalAuth, async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    const products = await productService.getProducts({
      category,
      limit: Math.min(parseInt(limit), 50),
      page: parseInt(page),
      userId: req.user?.userId
    });
    
    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'PRODUCTS_FETCH_ERROR'
    });
  }
});

// GET /api/products/recommended - Produtos recomendados
router.get('/products/recommended', optionalAuth, async (req, res) => {
  try {
    const products = await productService.getRecommendedProducts(req.user?.userId);
    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos recomendados:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produtos',
      code: 'RECOMMENDED_PRODUCTS_ERROR'
    });
  }
});

// GET /api/products/:productId - Obter produto específico
router.get('/products/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await productService.getProductById(productId, req.user?.userId);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'PRODUCT_FETCH_ERROR'
    });
  }
});

// GET /api/products/categories - Listar categorias disponíveis
router.get('/products/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'CATEGORIES_FETCH_ERROR'
    });
  }
});

export default router;

// =====================================================

// server/routes/subscription.js - Rotas de assinatura VIP
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validation.js';
import { SubscriptionService } from '../services/subscriptionService.js';

const router = express.Router();
const subscriptionService = new SubscriptionService();

// POST /api/subscription - Criar assinatura VIP
router.post('/subscription', authenticateToken, validateRequired(['planType']), async (req, res) => {
  try {
    const { planType, paymentMethod, stripeSubscriptionId } = req.body;
    
    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ 
        error: 'Tipo de plano inválido',
        validPlans: ['monthly', 'yearly'],
        code: 'INVALID_PLAN_TYPE'
      });
    }
    
    const result = await subscriptionService.createSubscription({
      userId: req.user.userId,
      planType,
      paymentMethod,
      stripeSubscriptionId
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'SUBSCRIPTION_CREATION_ERROR'
    });
  }
});

// GET /api/subscription - Obter status da assinatura
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.userId);
    
    res.json({ 
      hasActiveSubscription: !!subscription,
      subscription: subscription
    });
    
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'SUBSCRIPTION_FETCH_ERROR'
    });
  }
});

// PUT /api/subscription/cancel - Cancelar assinatura
router.put('/subscription/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await subscriptionService.cancelSubscription(req.user.userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ 
        error: 'Assinatura não encontrada',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'SUBSCRIPTION_CANCEL_ERROR'
    });
  }
});

// GET /api/subscription/plans - Listar planos disponíveis
router.get('/subscription/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getAvailablePlans();
    res.json(plans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'PLANS_FETCH_ERROR'
    });
  }
});

export default router;

// =====================================================

// server/routes/stats.js - Rotas de estatísticas
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { StatsService } from '../services/statsService.js';

const router = express.Router();
const statsService = new StatsService();

// GET /api/user/stats - Estatísticas do usuário
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await statsService.getUserStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do usuário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'USER_STATS_ERROR'
    });
  }
});

// GET /api/analytics/styles - Análise de estilos populares
router.get('/analytics/styles', async (req, res) => {
  try {
    const analytics = await statsService.getStyleAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Erro ao buscar análise de estilos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'STYLE_ANALYTICS_ERROR'
    });
  }
});

// GET /api/analytics/matches - Estatísticas de matches
router.get('/analytics/matches', authenticateToken, async (req, res) => {
  try {
    const analytics = await statsService.getMatchAnalytics(req.user.userId);
    res.json(analytics);
  } catch (error) {
    console.error('Erro ao buscar análise de matches:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'MATCH_ANALYTICS_ERROR'
    });
  }
});

export default router;

// =====================================================

// server/routes/index.js - Router principal que organiza todas as rotas
import express from 'express';
import authRoutes from './auth.js';
import healthRoutes from './health.js';
import profileRoutes from './profile.js';
import matchesRoutes from './matches.js';
import recommendationsRoutes from './recommendations.js';
import chatRoutes from './chat.js';
import productsRoutes from './products.js';
import subscriptionRoutes from './subscription.js';
import statsRoutes from './stats.js';

const configureRoutes = (app) => {
  // Middleware para todas as rotas da API
  app.use('/api', (req, res, next) => {
    // Headers de segurança
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Request ID para tracking
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    next();
  });

  // Rotas de saúde e informações (sem prefixo /api para algumas)
  app.use('/api', healthRoutes);

  // Rotas de autenticação
  app.use('/api/auth', authRoutes);

  // Rotas de perfil
  app.use('/api', profileRoutes);

  // Rotas de matching
  app.use('/api', matchesRoutes);

  // Rotas de recomendação
  app.use('/api', recommendationsRoutes);

  // Rotas de chat
  app.use('/api', chatRoutes);

  // Rotas de produtos
  app.use('/api', productsRoutes);

  // Rotas de assinatura
  app.use('/api', subscriptionRoutes);

  // Rotas de estatísticas
  app.use('/api', statsRoutes);

  // Rota raiz
  app.get('/', (req, res) => {
    res.json({
      message: 'MatchIt API - Estrutura Modular',
      version: '1.0.0',
      documentation: '/api/info',
      health: '/api/health'
    });
  });

  console.log('✅ Rotas configuradas');
};

export { configureRoutes };
