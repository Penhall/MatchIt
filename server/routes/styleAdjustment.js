// server/routes/styleAdjustment.js
const express = require('express');
const router = express.Router();
const StyleAdjustmentService = require('../services/styleAdjustmentService');
const authMiddleware = require('../middleware/auth'); // Proteger a rota, pois é para usuários logados

// Rota para buscar perguntas de ajuste de estilo
// GET /api/style-adjustment/questions?category=Clothing&limit=10
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const { category, limit } = req.query;
    
    if (!category) {
      return res.status(400).json({ error: 'O parâmetro "category" é obrigatório.' });
    }

    const questions = await StyleAdjustmentService.getStyleAdjustmentQuestions({ 
      category, 
      limit: limit ? parseInt(limit, 10) : undefined 
    });
    
    res.json(questions);
  } catch (error) {
    console.error(`Erro na rota GET /style-adjustment/questions: ${error.message}`);
    // Verificar se o erro é por categoria inválida para retornar um status específico
    if (error.message.includes('Categoria inválida')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao processar sua solicitação de perguntas de ajuste de estilo.' });
  }
});

// Rota para buscar preferências de estilo do usuário
// GET /api/style-adjustment/style-preferences
router.get('/style-preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Obtido do middleware de autenticação
    const preferences = await StyleAdjustmentService.getUserStylePreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error(`Erro na rota GET /style-adjustment/style-preferences: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar preferências de estilo.' });
  }
});

// Rota para atualizar preferência de estilo
// PUT /api/style-adjustment/style-preferences
router.put('/style-preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const preference = req.body;
    
    if (!preference.category || !preference.questionId || !preference.selectedOption) {
      return res.status(400).json({ error: 'Dados incompletos para atualização.' });
    }

    const updatedPreference = await StyleAdjustmentService.updateUserStylePreference(
      userId,
      preference
    );
    res.json(updatedPreference);
  } catch (error) {
    console.error(`Erro na rota PUT /style-adjustment/style-preferences: ${error.message}`);
    res.status(500).json({ error: 'Erro ao atualizar preferência de estilo.' });
  }
});

module.exports = router;
