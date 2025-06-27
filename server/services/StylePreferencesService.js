// server/services/StylePreferencesService.js - Serviço de preferências de estilo (Fase 0)
import { query } from '../config/database.js';

class StylePreferencesService {
    
    /**
     * Buscar todas as preferências de um usuário
     */
    async getUserPreferences(userId) {
        try {
            console.log(`📋 Buscando preferências para usuário: ${userId}`);
            
            const result = await query(
                'SELECT * FROM style_preferences WHERE user_id = $1 ORDER BY category, question_id',
                [userId]
            );
            
            // Organizar por categoria
            const preferences = {};
            result.rows.forEach(row => {
                if (!preferences[row.category]) {
                    preferences[row.category] = {};
                }
                preferences[row.category][row.question_id] = {
                    selectedOption: row.selected_option,
                    preferenceStrength: parseFloat(row.preference_strength),
                    updatedAt: row.updated_at
                };
            });
            
            console.log(`✅ Encontradas ${result.rows.length} preferências em ${Object.keys(preferences).length} categorias`);
            return preferences;
            
        } catch (error) {
            console.error('❌ Erro ao buscar preferências:', error);
            throw error;
        }
    }
    
    /**
     * Atualizar preferência específica
     */
    async updatePreference(userId, category, questionId, selectedOption, preferenceStrength = 1.0) {
        try {
            console.log(`💾 Atualizando preferência: ${userId} -> ${category}/${questionId} = ${selectedOption}`);
            
            const result = await query(`
                INSERT INTO style_preferences (user_id, category, question_id, selected_option, preference_strength, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (user_id, category, question_id)
                DO UPDATE SET 
                    selected_option = EXCLUDED.selected_option,
                    preference_strength = EXCLUDED.preference_strength,
                    updated_at = NOW()
                RETURNING *
            `, [userId, category, questionId, selectedOption, preferenceStrength]);
            
            console.log(`✅ Preferência atualizada: ID ${result.rows[0].id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erro ao atualizar preferência:', error);
            throw error;
        }
    }
    
    /**
     * Atualizar múltiplas preferências de uma vez
     */
    async updateMultiplePreferences(userId, preferences) {
        try {
            console.log(`💾 Atualizando ${Object.keys(preferences).length} categorias para usuário: ${userId}`);
            
            const updatedPreferences = [];
            
            for (const [category, categoryPrefs] of Object.entries(preferences)) {
                for (const [questionId, data] of Object.entries(categoryPrefs)) {
                    const selectedOption = typeof data === 'string' ? data : data.selectedOption;
                    const preferenceStrength = typeof data === 'object' ? data.preferenceStrength || 1.0 : 1.0;
                    
                    const result = await this.updatePreference(userId, category, questionId, selectedOption, preferenceStrength);
                    updatedPreferences.push(result);
                }
            }
            
            console.log(`✅ ${updatedPreferences.length} preferências atualizadas com sucesso`);
            return updatedPreferences;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar múltiplas preferências:', error);
            throw error;
        }
    }
    
    /**
     * Obter estatísticas de completude do perfil
     */
    async getCompletionStats(userId) {
        try {
            console.log(`📊 Calculando estatísticas para usuário: ${userId}`);
            
            // Buscar todas as preferências do usuário
            const result = await query(
                'SELECT category, COUNT(*) as count FROM style_preferences WHERE user_id = $1 GROUP BY category',
                [userId]
            );
            
            // Categorias esperadas (pode ser configurável)
            const expectedCategories = ['colors', 'styles', 'accessories', 'shoes', 'patterns'];
            const expectedQuestionsPerCategory = 5; // média
            
            const completedCategories = result.rows.length;
            const totalExpectedQuestions = expectedCategories.length * expectedQuestionsPerCategory;
            const totalAnsweredQuestions = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            
            const completionPercentage = Math.round((totalAnsweredQuestions / totalExpectedQuestions) * 100);
            
            const stats = {
                totalCategories: expectedCategories.length,
                completedCategories,
                totalExpectedQuestions,
                totalAnsweredQuestions,
                completionPercentage: Math.min(completionPercentage, 100),
                categoriesDetail: result.rows.reduce((acc, row) => {
                    acc[row.category] = parseInt(row.count);
                    return acc;
                }, {})
            };
            
            console.log(`📊 Estatísticas calculadas: ${completionPercentage}% completo`);
            return stats;
            
        } catch (error) {
            console.error('❌ Erro ao calcular estatísticas:', error);
            throw error;
        }
    }
    
    /**
     * Remover todas as preferências de um usuário
     */
    async clearUserPreferences(userId) {
        try {
            console.log(`🗑️  Removendo todas as preferências do usuário: ${userId}`);
            
            const result = await query(
                'DELETE FROM style_preferences WHERE user_id = $1',
                [userId]
            );
            
            console.log(`✅ ${result.rowCount} preferências removidas`);
            return { deletedCount: result.rowCount };
            
        } catch (error) {
            console.error('❌ Erro ao remover preferências:', error);
            throw error;
        }
    }
    
    /**
     * Buscar preferências por categoria
     */
    async getPreferencesByCategory(userId, category) {
        try {
            console.log(`📋 Buscando preferências da categoria '${category}' para usuário: ${userId}`);
            
            const result = await query(
                'SELECT * FROM style_preferences WHERE user_id = $1 AND category = $2 ORDER BY question_id',
                [userId, category]
            );
            
            const preferences = {};
            result.rows.forEach(row => {
                preferences[row.question_id] = {
                    selectedOption: row.selected_option,
                    preferenceStrength: parseFloat(row.preference_strength),
                    updatedAt: row.updated_at
                };
            });
            
            console.log(`✅ Encontradas ${result.rows.length} preferências na categoria '${category}'`);
            return preferences;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar preferências da categoria '${category}':`, error);
            throw error;
        }
    }
}

// Exportar instância singleton
const stylePreferencesService = new StylePreferencesService();
export default stylePreferencesService;
