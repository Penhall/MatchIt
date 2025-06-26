// server/routes/profile.js - Endpoints completos para preferências de estilo
const express = require('express');
const router = express.Router();
const profileService = require('../services/profileService');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// GET /api/profile/style-preferences - Buscar todas as preferências de estilo do usuário
router.get('/style-preferences', async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await profileService.getStyleChoicesByUserId(userId);
        
        res.json({
            success: true,
            data: preferences,
            count: preferences.length
        });
    } catch (error) {
        console.error('Erro ao buscar preferências de estilo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/profile/style-preferences - Atualizar uma preferência específica
router.put('/style-preferences', async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, questionId, selectedOption } = req.body;

        // Validação de entrada
        if (!category || !questionId || !selectedOption) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: category, questionId, selectedOption'
            });
        }

        // Validar categoria
        const validCategories = ['cores', 'estilos', 'calcados', 'acessorios', 'texturas'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Categoria inválida',
                validCategories
            });
        }

        const preference = await profileService.updateStyleChoice(userId, {
            category,
            questionId,
            selectedOption
        });

        res.json({
            success: true,
            message: 'Preferência atualizada com sucesso',
            data: preference
        });
    } catch (error) {
        console.error('Erro ao atualizar preferência de estilo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/profile/style-preferences/batch - Salvar múltiplas preferências de uma vez
router.post('/style-preferences/batch', async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;

        // Validação de entrada
        if (!Array.isArray(preferences) || preferences.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Campo "preferences" deve ser um array não vazio'
            });
        }

        // Validar cada preferência
        const validCategories = ['cores', 'estilos', 'calcados', 'acessorios', 'texturas'];
        for (const pref of preferences) {
            if (!pref.category || !pref.questionId || !pref.selectedOption) {
                return res.status(400).json({
                    success: false,
                    message: 'Cada preferência deve ter: category, questionId, selectedOption'
                });
            }
            if (!validCategories.includes(pref.category)) {
                return res.status(400).json({
                    success: false,
                    message: `Categoria inválida: ${pref.category}`,
                    validCategories
                });
            }
        }

        const results = await profileService.updateStyleChoicesBatch(userId, preferences);

        res.json({
            success: true,
            message: `${results.length} preferências salvas com sucesso`,
            data: results
        });
    } catch (error) {
        console.error('Erro ao salvar preferências em lote:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /api/profile/style-preferences - Limpar todas as preferências de estilo
router.delete('/style-preferences', async (req, res) => {
    try {
        const userId = req.user.id;
        const { category } = req.query;

        if (category) {
            // Deletar apenas uma categoria específica
            await profileService.clearStyleChoicesByCategory(userId, category);
            res.json({
                success: true,
                message: `Preferências da categoria "${category}" removidas com sucesso`
            });
        } else {
            // Deletar todas as preferências
            await profileService.clearStyleChoices(userId);
            res.json({
                success: true,
                message: 'Todas as preferências de estilo removidas com sucesso'
            });
        }
    } catch (error) {
        console.error('Erro ao limpar preferências de estilo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/profile/style-preferences/stats - Estatísticas de completude do perfil
router.get('/style-preferences/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await profileService.getStyleCompletionStats(userId);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas de estilo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/profile/style-preferences/categories - Listar categorias disponíveis
router.get('/style-preferences/categories', async (req, res) => {
    try {
        const categories = await profileService.getAvailableStyleCategories();
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Erro ao buscar categorias de estilo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/profile/full - Buscar perfil completo do usuário
router.get('/full', async (req, res) => {
    try {
        const userId = req.user.id;
        const fullProfile = await profileService.getFullProfile(userId);
        
        res.json({
            success: true,
            data: fullProfile
        });
    } catch (error) {
        console.error('Erro ao buscar perfil completo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/profile - Atualizar dados básicos do perfil
router.put('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        // Remover campos sensíveis que não devem ser atualizados via este endpoint
        delete updateData.id;
        delete updateData.email;
        delete updateData.password;

        const updatedProfile = await profileService.updateProfile(userId, updateData);
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: updatedProfile
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;