#!/bin/bash
# scripts/fix-style-preferences.sh - Correção completa das rotas style-preferences

echo "🔧 Aplicando correção completa para style-preferences..."

# 1. Criar arquivo de rotas stylePreferences.js
cat > server/routes/stylePreferences.js << 'EOF'
// server/routes/stylePreferences.js - Rotas para gerenciamento de preferências de estilo
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/helpers.js';

const router = Router();

// Mock service - substitua por um service real
const stylePreferencesService = {
  async getByUserId(userId) {
    // Retorna preferências vazias por enquanto
    return {
      userId,
      preferences: [],
      lastUpdated: new Date().toISOString()
    };
  },

  async createOrUpdate(userId, data) {
    // Simula criação/atualização
    return {
      userId,
      preferences: data,
      lastUpdated: new Date().toISOString(),
      success: true
    };
  },

  async batchUpdate(userId, preferences) {
    // Simula atualização em lote
    return {
      userId,
      preferences,
      lastUpdated: new Date().toISOString(),
      success: true
    };
  }
};

// Controller para as operações
const stylePreferencesController = {
  // GET /api/style-preferences - Buscar preferências do usuário
  async getStylePreferences(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        logger.error('[StylePreferences] Usuário não autenticado - req.user:', req.user);
        return res.status(401).json({ 
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info(`[StylePreferences] Buscando preferências para userId: ${userId}`);
      
      const preferences = await stylePreferencesService.getByUserId(userId);
      
      res.json(preferences);
    } catch (error) {
      logger.error(`[StylePreferences] Erro ao buscar preferências: ${error.message}`);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // PUT /api/style-preferences - Criar ou atualizar preferências
  async updateStylePreferences(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        logger.error('[StylePreferences] Usuário não autenticado em updateStylePreference');
        return res.status(401).json({ 
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      const data = req.body;
      
      // Validação básica
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          code: 'INVALID_DATA'
        });
      }

      logger.info(`[StylePreferences] Atualizando preferências para userId: ${userId}`, data);
      
      const result = await stylePreferencesService.createOrUpdate(userId, data);
      
      res.json(result);
    } catch (error) {
      logger.error(`[StylePreferences] Erro ao atualizar preferências: ${error.message}`);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // POST /api/style-preferences/batch - Atualização em lote
  async batchUpdatePreferences(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        logger.error('[StylePreferences] Usuário não autenticado em batchUpdate');
        return res.status(401).json({ 
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      const { preferences } = req.body;
      
      if (!preferences || !Array.isArray(preferences)) {
        return res.status(400).json({ 
          error: 'Campo "preferences" deve ser um array',
          code: 'INVALID_DATA'
        });
      }

      logger.info(`[StylePreferences] Atualização em lote para userId: ${userId}`, preferences);
      
      const result = await stylePreferencesService.batchUpdate(userId, preferences);
      
      res.json(result);
    } catch (error) {
      logger.error(`[StylePreferences] Erro na atualização em lote: ${error.message}`);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

// =====================================================
// DEFINIÇÃO DAS ROTAS
// =====================================================

// Aplicar middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Rotas principais
router.get('/', stylePreferencesController.getStylePreferences);
router.put('/', stylePreferencesController.updateStylePreferences);

// Rota para atualização em lote
router.post('/batch', stylePreferencesController.batchUpdatePreferences);

export default router;
EOF

# 2. Atualizar routes/index.js para incluir as novas rotas
cp server/routes/index.js server/routes/index.js.backup

cat > server/routes/index.js << 'EOF'
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

// Importar rotas de admin e styleAdjustment dinamicamente
let adminRoutes = null;
let styleAdjustmentRoutes = null;
try {
  const adminModule = await import('./admin.js');
  adminRoutes = adminModule.default;
  
  const styleModule = await import('./styleAdjustment.js');
  styleAdjustmentRoutes = styleModule.default;
} catch (error) {
  console.error('⚠️ Falha ao carregar rotas administrativas ou de ajuste de estilo:', error.message);
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

// Rotas de Ajuste de Estilo
if (styleAdjustmentRoutes) {
  router.use('/style-adjustment', styleAdjustmentRoutes);
}

// ⭐ NOVA ROTA: Style Preferences direto em /api/style-preferences
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
  console.log('  ✅ /api/style-preferences (NEW!)');
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
EOF

echo "✅ Arquivos criados e atualizados:"
echo "   - server/routes/stylePreferences.js (NOVO)"
echo "   - server/routes/index.js (ATUALIZADO)"
echo "   - server/routes/index.js.backup (BACKUP)"
echo ""
echo "🔄 Reinicie o servidor para aplicar as mudanças:"
echo "   npm run server"
echo ""
echo "🧪 Teste novamente os endpoints:"
echo "   ./scripts/test-phase0.sh"