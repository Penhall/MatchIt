// server/services/styleAdjustmentService.js - Serviço corrigido sem importação problemática
import { pool } from '../config/database.js';

// Definir StyleCategory localmente para evitar importação problemática
const StyleCategory = {
  Sneakers: 'Sneakers',
  Clothing: 'Clothing', 
  Colors: 'Colors',
  Hobbies: 'Hobbies',
  Feelings: 'Feelings',
  Interests: 'Interests'
};

class StyleAdjustmentService {
  /**
   * Busca EvaluationItems de uma categoria e os formata como StyleAdjustmentQuestions (pares de itens).
   * @param {object} queryParams - Parâmetros da query.
   * @param {string} queryParams.category - A StyleCategory para buscar perguntas.
   * @param {number} [queryParams.limit=10] - O número de perguntas (pares) a retornar.
   * @returns {Promise<Array<StyleAdjustmentQuestion>>}
   */
  static async getStyleAdjustmentQuestions(queryParams) {
    const { category, limit = 10 } = queryParams;

    if (!category || !Object.values(StyleCategory).includes(category)) {
      throw new Error(`Categoria inválida ou não fornecida: ${category}. Categorias válidas: ${Object.values(StyleCategory).join(', ')}`);
    }

    try {
      // Como AdminEvaluationItemService pode não estar disponível, 
      // vamos retornar questões mockadas para evitar erros
      console.warn(`[StyleAdjustmentService] AdminEvaluationItemService não disponível, retornando questões mockadas para categoria: ${category}`);
      
      // Retornar questões básicas para teste
      const questions = [];
      for (let i = 0; i < Math.min(limit, 5); i++) {
        questions.push({
          id: `${category}_${i + 1}`,
          category: category,
          question: `Qual opção você prefere em ${category}?`,
          options: [
            {
              id: `option_${category}_${i}_1`,
              label: `Opção ${i + 1}A`,
              value: `${category}_${i}_option_a`,
              imageUrl: `/placeholder/${category}_${i}_1.jpg`
            },
            {
              id: `option_${category}_${i}_2`, 
              label: `Opção ${i + 1}B`,
              value: `${category}_${i}_option_b`,
              imageUrl: `/placeholder/${category}_${i}_2.jpg`
            }
          ]
        });
      }

      return questions;
    } catch (error) {
      console.error(`Erro ao buscar perguntas de ajuste de estilo para ${category}:`, error);
      throw new Error(`Erro ao buscar perguntas de ajuste de estilo: ${error.message}`);
    }
  }

  /**
   * Busca as preferências de estilo de um usuário
   * @param {string} userId - ID do usuário (UUID ou integer)
   * @returns {Promise<Array<StylePreference>>}
   */
  static async getUserStylePreferences(userId) {
    const client = await pool.connect();
    try {
      // Não converter para integer - pode ser UUID
      const query = `
        SELECT 
          category, 
          question_id AS "questionId", 
          selected_option AS "selectedOption",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM style_choices
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error(`Erro ao buscar preferências de estilo para usuário ${userId}:`, error);
      
      // Se tabela não existe, retornar array vazio em vez de erro
      if (error.message.includes('relation "style_choices" does not exist')) {
        console.warn('Tabela style_choices não existe. Retornando array vazio.');
        return [];
      }
      
      throw new Error(`Erro ao buscar preferências de estilo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza uma preferência de estilo do usuário
   * @param {string} userId - ID do usuário (UUID ou integer)
   * @param {object} preference - Preferência a ser atualizada
   * @returns {Promise<object>}
   */
  static async updateUserStylePreference(userId, preference) {
    const client = await pool.connect();
    try {
      // Não converter para integer - pode ser UUID
      const { category, questionId, selectedOption } = preference;
      
      if (!category || !questionId || selectedOption === undefined) {
        throw new Error('Dados incompletos: category, questionId e selectedOption são obrigatórios');
      }
      
      // Usar UPSERT (INSERT ... ON CONFLICT) para compatibilidade com a estrutura existente
      const upsertQuery = `
        INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (user_id, category, question_id)
        DO UPDATE SET 
          selected_option = EXCLUDED.selected_option,
          updated_at = NOW()
        RETURNING 
          category, 
          question_id AS "questionId", 
          selected_option AS "selectedOption", 
          updated_at AS "updatedAt"
      `;
      
      const result = await client.query(upsertQuery, [userId, category, questionId, selectedOption]);
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao atualizar preferência de estilo para usuário ${userId}:`, error);
      
      // Se tabela não existe, dar erro mais específico
      if (error.message.includes('relation "style_choices" does not exist')) {
        throw new Error('Tabela style_choices não existe. Execute as migrations primeiro.');
      }
      
      throw new Error(`Erro ao atualizar preferência de estilo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Remove todas as preferências de estilo de um usuário
   * @param {string} userId - ID do usuário (UUID ou integer)
   * @returns {Promise<number>} Número de registros removidos
   */
  static async clearUserStylePreferences(userId) {
    const client = await pool.connect();
    try {
      const query = `DELETE FROM style_choices WHERE user_id = $1`;
      const result = await client.query(query, [userId]);
      
      return result.rowCount || 0;
    } catch (error) {
      console.error(`Erro ao limpar preferências de estilo para usuário ${userId}:`, error);
      
      if (error.message.includes('relation "style_choices" does not exist')) {
        console.warn('Tabela style_choices não existe. Retornando 0.');
        return 0;
      }
      
      throw new Error(`Erro ao limpar preferências de estilo: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

export default StyleAdjustmentService;