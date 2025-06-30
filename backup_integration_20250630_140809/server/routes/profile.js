// server/routes/profile.js - Rotas de Perfil com PostgreSQL (ES Modules)
import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import stylePreferencesService from '../services/StylePreferencesService.js';

const router = express.Router();

console.log('👤 Carregando rotas de perfil com PostgreSQL...');

/**
 * GET /api/profile
 * Buscar dados básicos do perfil do usuário
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1; // Fallback para desenvolvimento
        console.log('📥 GET /api/profile - userId:', userId);
        
        // Buscar estatísticas de completude reais do banco
        const completionStats = await stylePreferencesService.getCompletionStats(userId);
        
        const userData = {
            id: userId,
            name: req.user?.name || 'Usuário MatchIt',
            email: req.user?.email || 'user@matchit.com',
            createdAt: new Date('2024-01-01'),
            profileCompletion: completionStats.completionPercentage,
            hasStylePreferences: completionStats.totalAnsweredQuestions > 0,
            preferences: {
                ageRange: [22, 35],
                maxDistance: 50,
                interests: ['música', 'viagem', 'tecnologia']
            },
            styleStats: completionStats
        };
        
        res.json({
            success: true,
            data: userData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR',
            message: error.message
        });
    }
});

/**
 * GET /api/profile/style-preferences
 * Buscar preferências de estilo do usuário
 */
router.get('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;
        const { category } = req.query;
        
        console.log('📥 GET /api/profile/style-preferences - userId:', userId, 'category:', category);
        
        // Buscar preferências reais do banco
        const preferences = await stylePreferencesService.getStylePreferences(userId, category);
        
        // Buscar estatísticas de completude
        const stats = await stylePreferencesService.getCompletionStats(userId);
        
        res.json({
            success: true,
            data: {
                preferences,
                stats,
                categories: ['colors', 'styles', 'accessories', 'shoes', 'patterns']
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar preferências',
            code: 'FETCH_PREFERENCES_ERROR',
            message: error.message
        });
    }
});

/**
 * PUT /api/profile/style-preferences
 * Atualizar preferências de estilo
 */
router.put('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;
        const { category, preferences, confidence } = req.body;
        
        console.log('📥 PUT /api/profile/style-preferences - userId:', userId, 'category:', category);
        
        if (!category || !preferences) {
            return res.status(400).json({
                success: false,
                error: 'Categoria e preferências são obrigatórias',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        // Salvar no banco
        const result = await stylePreferencesService.saveStylePreferences(
            userId, 
            category, 
            preferences, 
            confidence || 0.8
        );
        
        // Buscar estatísticas atualizadas
        const updatedStats = await stylePreferencesService.getCompletionStats(userId);
        
        res.json({
            success: true,
            data: {
                preference: result,
                stats: updatedStats
            },
            message: 'Preferências salvas com sucesso',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em PUT /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao salvar preferências',
            code: 'SAVE_PREFERENCES_ERROR',
            message: error.message
        });
    }
});

/**
 * POST /api/profile/style-preferences/choice
 * Salvar escolha individual de estilo
 */
router.post('/style-preferences/choice', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;
        const { category, questionId, selectedOption, responseTime, confidence } = req.body;
        
        console.log('📥 POST /api/profile/style-preferences/choice - userId:', userId);
        
        if (!category || !questionId || !selectedOption) {
            return res.status(400).json({
                success: false,
                error: 'Categoria, questionId e selectedOption são obrigatórios',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        // Salvar escolha no banco
        const choice = await stylePreferencesService.saveStyleChoice(
            userId, category, questionId, selectedOption, responseTime, confidence
        );
        
        res.json({
            success: true,
            data: choice,
            message: 'Escolha salva com sucesso',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em POST /api/profile/style-preferences/choice:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao salvar escolha',
            code: 'SAVE_CHOICE_ERROR',
            message: error.message
        });
    }
});

/**
 * DELETE /api/profile/style-preferences
 * Limpar todas as preferências do usuário
 */
router.delete('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;
        
        console.log('📥 DELETE /api/profile/style-preferences - userId:', userId);
        
        const result = await stylePreferencesService.clearAllPreferences(userId);
        
        res.json({
            success: true,
            data: result,
            message: 'Todas as preferências foram removidas',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em DELETE /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao limpar preferências',
            code: 'CLEAR_PREFERENCES_ERROR',
            message: error.message
        });
    }
});

/**
 * GET /api/profile/style-preferences/choices/:category
 * Buscar escolhas de uma categoria específica
 */
router.get('/style-preferences/choices/:category', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;
        const { category } = req.params;
        
        console.log('📥 GET /api/profile/style-preferences/choices/:category - userId:', userId, 'category:', category);
        
        const choices = await stylePreferencesService.getStyleChoices(userId, category);
        
        res.json({
            success: true,
            data: choices,
            category,
            count: choices.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences/choices/:category:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar escolhas',
            code: 'FETCH_CHOICES_ERROR',
            message: error.message
        });
    }
});

export default router;
