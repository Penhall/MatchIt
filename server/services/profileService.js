import { pool } from '../config/database.js';
import { logger } from '../utils/helpers.js';

class ProfileService {
  // ... (código existente)

  /**
   * Busca as escolhas de estilo de um usuário.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<Array>} Lista de escolhas de estilo.
   */
  async getStyleChoicesByUserId(userId) {
    const query = `
      SELECT category, question_id AS "questionId", selected_option AS "selectedOption"
      FROM style_choices
      WHERE user_id = $1
      ORDER BY created_at;
    `;
    try {
      const { rows } = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      logger.error(`Erro ao buscar escolhas de estilo para userId ${userId}:`, error);
      throw new Error('Erro ao buscar escolhas de estilo do usuário.');
    }
  }

  /**
   * Atualiza ou cria uma escolha de estilo para o usuário.
   * @param {string} userId - O UUID do usuário.
   * @param {object} choice - Objeto com category, questionId e selectedOption.
   * @returns {Promise<object>} A escolha atualizada/criada.
   */
  async updateStyleChoice(userId, choice) {
    const { category, questionId, selectedOption } = choice;
    const validCategories = ['Sneakers', 'Clothing', 'Colors', 'Hobbies', 'Feelings', 'Interests'];
    
    if (!validCategories.includes(category)) {
      throw new Error(`Categoria inválida: ${category}. Categorias válidas: ${validCategories.join(', ')}`);
    }

    const query = `
      INSERT INTO style_choices (user_id, category, question_id, selected_option)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, category, question_id) DO UPDATE
      SET selected_option = EXCLUDED.selected_option,
          created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    try {
      const { rows } = await pool.query(query, [userId, category, questionId, selectedOption]);
      return rows[0];
    } catch (error) {
      logger.error(`Erro ao atualizar escolha de estilo para userId ${userId}:`, { category, questionId, selectedOption, error });
      throw new Error('Erro ao atualizar escolha de estilo do usuário.');
    }
  }

  /**
   * Busca o perfil de um usuário incluindo suas escolhas de estilo.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<object|null>} O perfil do usuário com stylePreferences.
   */
  async getProfileByUserId(userId) {
    const profileQuery = `
      SELECT
        u.id AS user_id,
        u.email,
        u.name,
        u.email_verified,
        u.is_active,
        up.id AS profile_id,
        up.display_name,
        up.city,
        up.gender,
        up.avatar_url,
        up.bio,
        up.is_vip,
        up.age,
        up.style_completion_percentage,
        up.interests,
        up.location_latitude,
        up.location_longitude,
        up.style_game_level,
        up.style_game_xp,
        up.last_style_game_played_at,
        up.created_at AS profile_created_at,
        up.updated_at AS profile_updated_at
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1;
    `;
    
    try {
      const profileResult = await pool.query(profileQuery, [userId]);
      if (profileResult.rows.length === 0) {
        return null;
      }
      
      const profile = profileResult.rows[0];
      
      // Buscar escolhas de estilo e adicionar ao perfil
      const styleChoices = await this.getStyleChoicesByUserId(userId);
      profile.stylePreferences = styleChoices;
      
      return profile;
    } catch (error) {
      logger.error(`Erro ao buscar perfil completo para userId ${userId}:`, error);
      throw new Error('Erro ao buscar perfil completo do usuário.');
    }
  }

  // ... (restante do código existente)
}

export { ProfileService };
