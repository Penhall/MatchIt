// server/services/StylePreferencesService.js - Serviço de preferências de estilo (ES Modules)
import { query } from '../config/database.js';

class StylePreferencesService {
    
    /**
     * Buscar preferências de estilo do usuário por categoria
     */
    async getStylePreferences(userId, category = null) {
        try {
            let queryText;
            let params;
            
            if (category) {
                queryText = `
                    SELECT * FROM user_style_preferences 
                    WHERE user_id = $1 AND category = $2
                    ORDER BY last_updated DESC
                `;
                params = [userId, category];
            } else {
                queryText = `
                    SELECT * FROM user_style_preferences 
                    WHERE user_id = $1
                    ORDER BY category, last_updated DESC
                `;
                params = [userId];
            }
            
            const result = await query(queryText, params);
            
            // Transformar resultado em formato amigável
            const preferences = {};
            result.rows.forEach(row => {
                preferences[row.category] = {
                    data: row.preference_data,
                    confidence: row.confidence_score,
                    lastUpdated: row.last_updated
                };
            });
            
            return preferences;
            
        } catch (error) {
            console.error('Erro ao buscar preferências:', error);
            throw new Error('Falha ao buscar preferências de estilo');
        }
    }
    
    /**
     * Salvar/atualizar preferências de estilo
     */
    async saveStylePreferences(userId, category, preferenceData, confidenceScore = 0.8) {
        try {
            const queryText = `
                INSERT INTO user_style_preferences (user_id, category, preference_data, confidence_score, last_updated)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (user_id, category) 
                DO UPDATE SET 
                    preference_data = $3,
                    confidence_score = $4,
                    last_updated = NOW()
                RETURNING *
            `;
            
            const params = [userId, category, JSON.stringify(preferenceData), confidenceScore];
            const result = await query(queryText, params);
            
            return result.rows[0];
            
        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            throw new Error('Falha ao salvar preferências de estilo');
        }
    }
    
    /**
     * Salvar escolha individual de estilo
     */
    async saveStyleChoice(userId, category, questionId, selectedOption, responseTime = null, confidence = 3) {
        try {
            const queryText = `
                INSERT INTO style_choices (
                    user_id, category, question_id, selected_option, 
                    response_time_ms, confidence_level, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (user_id, category, question_id)
                DO UPDATE SET 
                    selected_option = $4,
                    response_time_ms = $5,
                    confidence_level = $6,
                    created_at = NOW()
                RETURNING *
            `;
            
            const params = [userId, category, questionId, selectedOption, responseTime, confidence];
            const result = await query(queryText, params);
            
            return result.rows[0];
            
        } catch (error) {
            console.error('Erro ao salvar escolha:', error);
            throw new Error('Falha ao salvar escolha de estilo');
        }
    }
    
    /**
     * Buscar estatísticas de completude do perfil
     */
    async getCompletionStats(userId) {
        try {
            // Buscar contadores por categoria
            const choicesQuery = `
                SELECT 
                    category,
                    COUNT(*) as answered_questions,
                    AVG(confidence_level) as avg_confidence
                FROM style_choices 
                WHERE user_id = $1 
                GROUP BY category
            `;
            
            const preferencesQuery = `
                SELECT 
                    category,
                    confidence_score,
                    last_updated
                FROM user_style_preferences 
                WHERE user_id = $1
            `;
            
            const [choicesResult, preferencesResult] = await Promise.all([
                query(choicesQuery, [userId]),
                query(preferencesQuery, [userId])
            ]);
            
            const stats = {
                totalCategories: 5, // cores, estilos, acessórios, calçados, padrões
                completedCategories: preferencesResult.rows.length,
                totalAnsweredQuestions: choicesResult.rows.reduce((sum, row) => sum + row.answered_questions, 0),
                categoriesProgress: {},
                overallConfidence: 0,
                lastActivity: null
            };
            
            // Processar progresso por categoria
            const categories = ['colors', 'styles', 'accessories', 'shoes', 'patterns'];
            categories.forEach(category => {
                const choiceData = choicesResult.rows.find(row => row.category === category);
                const prefData = preferencesResult.rows.find(row => row.category === category);
                
                stats.categoriesProgress[category] = {
                    answeredQuestions: choiceData?.answered_questions || 0,
                    confidence: prefData?.confidence_score || 0,
                    lastUpdated: prefData?.last_updated || null,
                    isCompleted: !!prefData
                };
            });
            
            // Calcular porcentagem de completude
            stats.completionPercentage = Math.round((stats.completedCategories / stats.totalCategories) * 100);
            
            // Calcular confiança geral
            if (preferencesResult.rows.length > 0) {
                stats.overallConfidence = preferencesResult.rows.reduce(
                    (sum, row) => sum + row.confidence_score, 0
                ) / preferencesResult.rows.length;
            }
            
            // Última atividade
            const lastActivityQuery = `
                SELECT MAX(created_at) as last_activity 
                FROM style_choices 
                WHERE user_id = $1
            `;
            const lastActivityResult = await query(lastActivityQuery, [userId]);
            stats.lastActivity = lastActivityResult.rows[0]?.last_activity;
            
            return stats;
            
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw new Error('Falha ao calcular estatísticas de completude');
        }
    }
    
    /**
     * Limpar todas as preferências do usuário
     */
    async clearAllPreferences(userId) {
        try {
            await query('BEGIN');
            
            // Deletar preferências
            await query('DELETE FROM user_style_preferences WHERE user_id = $1', [userId]);
            
            // Deletar escolhas
            await query('DELETE FROM style_choices WHERE user_id = $1', [userId]);
            
            await query('COMMIT');
            
            return { success: true, message: 'Preferências removidas com sucesso' };
            
        } catch (error) {
            await query('ROLLBACK');
            console.error('Erro ao limpar preferências:', error);
            throw new Error('Falha ao limpar preferências');
        }
    }
    
    /**
     * Buscar escolhas de uma categoria específica
     */
    async getStyleChoices(userId, category) {
        try {
            const queryText = `
                SELECT * FROM style_choices 
                WHERE user_id = $1 AND category = $2
                ORDER BY created_at DESC
            `;
            
            const result = await query(queryText, [userId, category]);
            return result.rows;
            
        } catch (error) {
            console.error('Erro ao buscar escolhas:', error);
            throw new Error('Falha ao buscar escolhas de estilo');
        }
    }
}

export default new StylePreferencesService();
