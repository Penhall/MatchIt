// server/routes/styleAdjustment.js - Rotas para ajuste de estilo
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/helpers.js';

const router = Router();

// Mock service - substitua por um service real
const styleAdjustmentService = {
  async getCategories() {
    return {
      cores: {
        name: 'cores',
        description: 'Preferências de cores e paletas',
        questions: [
          {
            id: 'cores_primarias',
            text: 'Qual paleta de cores mais combina com você?',
            options: [
              { id: 'warm', label: 'Cores Quentes', value: 'warm', description: 'Vermelho, laranja, amarelo' },
              { id: 'cool', label: 'Cores Frias', value: 'cool', description: 'Azul, verde, roxo' },
              { id: 'neutral', label: 'Cores Neutras', value: 'neutral', description: 'Preto, branco, cinza, bege' },
              { id: 'vibrant', label: 'Cores Vibrantes', value: 'vibrant', description: 'Tons saturados e chamtivos' }
            ]
          }
        ]
      },
      estilos: {
        name: 'estilos',
        description: 'Estilos e estéticas visuais',
        questions: [
          {
            id: 'estetica_geral',
            text: 'Que estética mais representa você?',
            options: [
              { id: 'minimalist', label: 'Minimalista', value: 'minimalist', description: 'Simples, limpo, funcional' },
              { id: 'vintage', label: 'Vintage', value: 'vintage', description: 'Retrô, nostálgico, clássico' },
              { id: 'modern', label: 'Moderno', value: 'modern', description: 'Contemporâneo, atual, tecnológico' },
              { id: 'artistic', label: 'Artístico', value: 'artistic', description: 'Criativo, expressivo, único' }
            ]
          }
        ]
      }
    };
  },

  async getCompletionStats(userId) {
    return {
      totalExpected: 2,
      totalCompleted: 0,
      completionPercentage: 0,
      byCategory: {
        cores: {
          expected: 1,
          completed: 0,
          percentage: 0,
          missingQuestions: ['cores_primarias']
        },
        estilos: {
          expected: 1,
          completed: 0,
          percentage: 0,
          missingQuestions: ['estetica_geral']
        }
      }
    };
  }
};

// Controller para as operações
const styleAdjustmentController = {
  // GET /api/style/categories - Buscar categorias e perguntas
  async getCategories(req, res) {
    try {
      const categories = await styleAdjustmentService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error(`[StyleAdjustment] Erro ao buscar categorias: ${error.message}`);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  },

  // GET /api/style/completion-stats/:userId - Buscar estatísticas de completude
  async getCompletionStats(req, res) {
    try {
      const userId = req.params.userId;
      const stats = await styleAdjustmentService.getCompletionStats(userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error(`[StyleAdjustment] Erro ao buscar estatísticas: ${error.message}`);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
};

// =====================================================
// DEFINIÇÃO DAS ROTAS
// =====================================================

router.use(authenticateToken);

router.get('/categories', styleAdjustmentController.getCategories);
router.get('/completion-stats/:userId', styleAdjustmentController.getCompletionStats);

export default router;
