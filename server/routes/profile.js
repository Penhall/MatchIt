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
        const userId = req.user?.userId || req.user?.id;
        console.log('📥 GET /api/profile - userId:', userId);
        
        // Buscar estatísticas de completude
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
            code: 'INTERNAL_ERROR'
        });
    }
});

/**
 * GET /api/profile/style-preferences
 * Buscar preferências de estilo do usuário
 */
router.get('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category } = req.query;
        
        console.log('📥 GET /api/profile/style-preferences - userId:', userId, 'category:', category);
        
        let preferences;
        if (category) {
            preferences = { [category]: await stylePreferencesService.getPreferencesByCategory(userId, category) };
        } else {
            preferences = await stylePreferencesService.getUserPreferences(userId);
        }
        
        res.json({
            success: true,
            data: preferences,
            count: Object.keys(preferences).length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar preferências de estilo',
            code: 'FETCH_PREFERENCES_ERROR'
        });
    }
});

/**
 * PUT /api/profile/style-preferences
 * Atualizar preferência específica
 */
router.put('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category, questionId, selectedOption, preferenceStrength } = req.body;
        
        console.log('📥 PUT /api/profile/style-preferences:', { userId, category, questionId, selectedOption });
        
        if (!category || !questionId || !selectedOption) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: category, questionId, selectedOption',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        const updatedPreference = await stylePreferencesService.updatePreference(
            userId, category, questionId, selectedOption, preferenceStrength || 1.0
        );
        
        res.json({
            success: true,
            message: 'Preferência atualizada com sucesso',
            data: {
                id: updatedPreference.id,
                category: updatedPreference.category,
                questionId: updatedPreference.question_id,
                selectedOption: updatedPreference.selected_option,
                preferenceStrength: parseFloat(updatedPreference.preference_strength),
                updatedAt: updatedPreference.updated_at
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em PUT /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar preferência',
            code: 'UPDATE_PREFERENCE_ERROR'
        });
    }
});

/**
 * POST /api/profile/style-preferences/batch
 * Atualizar múltiplas preferências de uma vez
 */
router.post('/style-preferences/batch', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { preferences } = req.body;
        
        console.log('📥 POST /api/profile/style-preferences/batch:', { userId, categories: Object.keys(preferences || {}) });
        
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Campo "preferences" é obrigatório e deve ser um objeto',
                code: 'INVALID_PREFERENCES_FORMAT'
            });
        }
        
        const updatedPreferences = await stylePreferencesService.updateMultiplePreferences(userId, preferences);
        
        res.json({
            success: true,
            message: `${updatedPreferences.length} preferências atualizadas com sucesso`,
            data: updatedPreferences.map(pref => ({
                id: pref.id,
                category: pref.category,
                questionId: pref.question_id,
                selectedOption: pref.selected_option,
                preferenceStrength: parseFloat(pref.preference_strength),
                updatedAt: pref.updated_at
            })),
            totalUpdated: updatedPreferences.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em POST /api/profile/style-preferences/batch:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar preferências em lote',
            code: 'BATCH_UPDATE_ERROR'
        });
    }
});

/**
 * GET /api/profile/style-preferences/stats
 * Estatísticas de completude do perfil
 */
router.get('/style-preferences/stats', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        
        const stats = await stylePreferencesService.getCompletionStats(userId);
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences/stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            code: 'STATS_ERROR'
        });
    }
});

/**
 * DELETE /api/profile/style-preferences
 * Remover todas as preferências do usuário
 */
router.delete('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        
        const result = await stylePreferencesService.clearUserPreferences(userId);
        
        res.json({
            success: true,
            message: 'Todas as preferências foram removidas',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em DELETE /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao remover preferências',
            code: 'DELETE_PREFERENCES_ERROR'
        });
    }
});

console.log('✅ Rotas de perfil carregadas com PostgreSQL');

export default router;
