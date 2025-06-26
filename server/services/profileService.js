// server/services/profileService.js - Serviço completo de perfil com integração ao banco
const { pool } = require('../config/database');

class ProfileService {
    
    // Buscar todas as escolhas de estilo de um usuário
    async getStyleChoicesByUserId(userId) {
        try {
            const result = await pool.query(
                `SELECT id, category, question_id, selected_option, created_at, updated_at 
                 FROM style_choices 
                 WHERE user_id = $1 
                 ORDER BY category, question_id`,
                [userId]
            );

            // Organizar por categoria para facilitar o uso no frontend
            const choicesByCategory = {};
            result.rows.forEach(choice => {
                if (!choicesByCategory[choice.category]) {
                    choicesByCategory[choice.category] = {};
                }
                choicesByCategory[choice.category][choice.question_id] = {
                    id: choice.id,
                    selectedOption: choice.selected_option,
                    createdAt: choice.created_at,
                    updatedAt: choice.updated_at
                };
            });

            return choicesByCategory;
        } catch (error) {
            console.error('Erro ao buscar escolhas de estilo:', error);
            throw new Error('Falha ao buscar preferências de estilo');
        }
    }

    // Atualizar ou criar uma escolha de estilo específica
    async updateStyleChoice(userId, { category, questionId, selectedOption }) {
        try {
            const result = await pool.query(
                `INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 ON CONFLICT (user_id, category, question_id)
                 DO UPDATE SET 
                    selected_option = EXCLUDED.selected_option,
                    updated_at = NOW()
                 RETURNING id, category, question_id, selected_option, created_at, updated_at`,
                [userId, category, questionId, selectedOption]
            );

            if (result.rows.length === 0) {
                throw new Error('Falha ao salvar preferência de estilo');
            }

            const choice = result.rows[0];
            return {
                id: choice.id,
                category: choice.category,
                questionId: choice.question_id,
                selectedOption: choice.selected_option,
                createdAt: choice.created_at,
                updatedAt: choice.updated_at
            };
        } catch (error) {
            console.error('Erro ao atualizar escolha de estilo:', error);
            throw new Error('Falha ao salvar preferência de estilo');
        }
    }

    // Atualizar múltiplas escolhas de estilo em lote
    async updateStyleChoicesBatch(userId, preferences) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const results = [];
            
            for (const pref of preferences) {
                const result = await client.query(
                    `INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     ON CONFLICT (user_id, category, question_id)
                     DO UPDATE SET 
                        selected_option = EXCLUDED.selected_option,
                        updated_at = NOW()
                     RETURNING id, category, question_id, selected_option, created_at, updated_at`,
                    [userId, pref.category, pref.questionId, pref.selectedOption]
                );
                
                if (result.rows.length > 0) {
                    const choice = result.rows[0];
                    results.push({
                        id: choice.id,
                        category: choice.category,
                        questionId: choice.question_id,
                        selectedOption: choice.selected_option,
                        createdAt: choice.created_at,
                        updatedAt: choice.updated_at
                    });
                }
            }
            
            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar escolhas em lote:', error);
            throw new Error('Falha ao salvar preferências de estilo em lote');
        } finally {
            client.release();
        }
    }

    // Limpar todas as escolhas de estilo de um usuário
    async clearStyleChoices(userId) {
        try {
            const result = await pool.query(
                'DELETE FROM style_choices WHERE user_id = $1',
                [userId]
            );
            
            return result.rowCount;
        } catch (error) {
            console.error('Erro ao limpar escolhas de estilo:', error);
            throw new Error('Falha ao limpar preferências de estilo');
        }
    }

    // Limpar escolhas de uma categoria específica
    async clearStyleChoicesByCategory(userId, category) {
        try {
            const result = await pool.query(
                'DELETE FROM style_choices WHERE user_id = $1 AND category = $2',
                [userId, category]
            );
            
            return result.rowCount;
        } catch (error) {
            console.error('Erro ao limpar escolhas por categoria:', error);
            throw new Error('Falha ao limpar preferências da categoria');
        }
    }

    // Obter estatísticas de completude do perfil de estilo
    async getStyleCompletionStats(userId) {
        try {
            // Definir questões esperadas por categoria
            const expectedQuestions = {
                cores: ['color_1', 'color_2', 'color_3', 'color_4', 'color_5'],
                estilos: ['style_1', 'style_2', 'style_3', 'style_4', 'style_5'],
                calcados: ['shoes_1', 'shoes_2', 'shoes_3'],
                acessorios: ['accessories_1', 'accessories_2', 'accessories_3'],
                texturas: ['texture_1', 'texture_2']
            };

            const result = await pool.query(
                `SELECT category, question_id, COUNT(*) as count
                 FROM style_choices 
                 WHERE user_id = $1 
                 GROUP BY category, question_id`,
                [userId]
            );

            const completedByCategory = {};
            result.rows.forEach(row => {
                if (!completedByCategory[row.category]) {
                    completedByCategory[row.category] = [];
                }
                completedByCategory[row.category].push(row.question_id);
            });

            const stats = {
                totalExpected: 0,
                totalCompleted: 0,
                completionPercentage: 0,
                byCategory: {}
            };

            // Calcular estatísticas por categoria
            for (const [category, questions] of Object.entries(expectedQuestions)) {
                const expected = questions.length;
                const completed = completedByCategory[category] ? completedByCategory[category].length : 0;
                
                stats.totalExpected += expected;
                stats.totalCompleted += completed;
                
                stats.byCategory[category] = {
                    expected,
                    completed,
                    percentage: expected > 0 ? Math.round((completed / expected) * 100) : 0,
                    missingQuestions: questions.filter(q => 
                        !completedByCategory[category] || !completedByCategory[category].includes(q)
                    )
                };
            }

            stats.completionPercentage = stats.totalExpected > 0 
                ? Math.round((stats.totalCompleted / stats.totalExpected) * 100) 
                : 0;

            return stats;
        } catch (error) {
            console.error('Erro ao calcular estatísticas de completude:', error);
            throw new Error('Falha ao calcular estatísticas do perfil');
        }
    }

    // Obter categorias de estilo disponíveis
    async getAvailableStyleCategories() {
        try {
            const categories = {
                cores: {
                    name: 'Cores',
                    description: 'Preferências de paleta de cores',
                    questions: [
                        { id: 'color_1', text: 'Cores preferidas para o dia a dia' },
                        { id: 'color_2', text: 'Cores para ocasiões especiais' },
                        { id: 'color_3', text: 'Cores que evita usar' },
                        { id: 'color_4', text: 'Tons favoritos' },
                        { id: 'color_5', text: 'Combinações de cores preferidas' }
                    ]
                },
                estilos: {
                    name: 'Estilos',
                    description: 'Preferências de estilo de vestimenta',
                    questions: [
                        { id: 'style_1', text: 'Estilo casual preferido' },
                        { id: 'style_2', text: 'Estilo formal preferido' },
                        { id: 'style_3', text: 'Estilo para finais de semana' },
                        { id: 'style_4', text: 'Estilo para trabalho' },
                        { id: 'style_5', text: 'Estilo para festas' }
                    ]
                },
                calcados: {
                    name: 'Calçados',
                    description: 'Preferências de tipos de calçados',
                    questions: [
                        { id: 'shoes_1', text: 'Calçados casuais preferidos' },
                        { id: 'shoes_2', text: 'Calçados formais preferidos' },
                        { id: 'shoes_3', text: 'Calçados para exercícios' }
                    ]
                },
                acessorios: {
                    name: 'Acessórios',
                    description: 'Preferências de acessórios e complementos',
                    questions: [
                        { id: 'accessories_1', text: 'Acessórios do dia a dia' },
                        { id: 'accessories_2', text: 'Acessórios para ocasiões especiais' },
                        { id: 'accessories_3', text: 'Estilo de joias/relógios' }
                    ]
                },
                texturas: {
                    name: 'Texturas',
                    description: 'Preferências de texturas e materiais',
                    questions: [
                        { id: 'texture_1', text: 'Texturas favoritas' },
                        { id: 'texture_2', text: 'Materiais preferidos' }
                    ]
                }
            };

            return categories;
        } catch (error) {
            console.error('Erro ao buscar categorias de estilo:', error);
            throw new Error('Falha ao buscar categorias disponíveis');
        }
    }

    // Buscar perfil completo do usuário
    async getFullProfile(userId) {
        try {
            // Buscar dados básicos do usuário
            const userResult = await pool.query(
                `SELECT u.id, u.name, u.email, u.age, u.gender, u.bio, u.location,
                        u.profile_picture, u.created_at, u.updated_at,
                        p.preferences, p.personality_vector, p.activity_level
                 FROM users u
                 LEFT JOIN profiles p ON u.id = p.user_id
                 WHERE u.id = $1`,
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const user = userResult.rows[0];

            // Buscar preferências de estilo
            const stylePreferences = await this.getStyleChoicesByUserId(userId);

            // Buscar estatísticas de completude
            const completionStats = await this.getStyleCompletionStats(userId);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                gender: user.gender,
                bio: user.bio,
                location: user.location,
                profilePicture: user.profile_picture,
                preferences: user.preferences,
                personalityVector: user.personality_vector,
                activityLevel: user.activity_level,
                stylePreferences,
                completionStats,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            };
        } catch (error) {
            console.error('Erro ao buscar perfil completo:', error);
            throw new Error('Falha ao buscar perfil completo');
        }
    }

    // Atualizar dados básicos do perfil
    async updateProfile(userId, updateData) {
        try {
            const allowedFields = ['name', 'age', 'gender', 'bio', 'location', 'profile_picture'];
            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;

            // Construir query dinâmica baseada nos campos fornecidos
            for (const [field, value] of Object.entries(updateData)) {
                if (allowedFields.includes(field) && value !== undefined) {
                    updateFields.push(`${field} = $${paramCount}`);
                    updateValues.push(value);
                    paramCount++;
                }
            }

            if (updateFields.length === 0) {
                throw new Error('Nenhum campo válido para atualizar');
            }

            updateFields.push(`updated_at = NOW()`);
            updateValues.push(userId);

            const query = `
                UPDATE users 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING id, name, email, age, gender, bio, location, profile_picture, updated_at
            `;

            const result = await pool.query(query, updateValues);

            if (result.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw new Error('Falha ao atualizar perfil');
        }
    }

    // Atualizar preferências no perfil (JSON)
    async updateProfilePreferences(userId, preferences) {
        try {
            const result = await pool.query(
                `INSERT INTO profiles (user_id, preferences, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id)
                 DO UPDATE SET 
                    preferences = EXCLUDED.preferences,
                    updated_at = NOW()
                 RETURNING preferences`,
                [userId, JSON.stringify(preferences)]
            );

            return result.rows[0].preferences;
        } catch (error) {
            console.error('Erro ao atualizar preferências do perfil:', error);
            throw new Error('Falha ao atualizar preferências');
        }
    }
}

module.exports = new ProfileService();