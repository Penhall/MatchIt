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