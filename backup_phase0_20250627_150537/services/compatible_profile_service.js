// server/services/profileService.js - Versão compatível com a estrutura atual
// Arquivo: server/services/profileService.js

import { pool } from '../config/database.js';
import { logger } from '../utils/helpers.js';

class ProfileService {
  /**
   * Busca as escolhas de estilo de um usuário.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<Array>} Lista de escolhas de estilo.
   */
  async getStyleChoicesByUserId(userId) {
    // Query mais simples e compatível
    const query = `
      SELECT 
        category, 
        question_id AS "questionId", 
        selected_option AS "selectedOption",
        created_at
      FROM style_choices
      WHERE user_id = $1
      ORDER BY created_at;
    `;
    
    try {
      logger.info(`[ProfileService] Buscando escolhas de estilo para userId: ${userId}`);
      const { rows } = await pool.query(query, [userId]);
      logger.info(`[ProfileService] Encontradas ${rows.length} escolhas de estilo`);
      return rows;
    } catch (error) {
      logger.error(`[ProfileService] Erro ao buscar escolhas de estilo:`, {
        error: error.message,
        userId: userId
      });
      
      // Retornar array vazio em vez de quebrar
      return [];
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
    
    // Validação de entrada
    if (!userId || !category || !questionId || !selectedOption) {
      throw new Error('Parâmetros obrigatórios faltando: userId, category, questionId, selectedOption');
    }
    
    if (!validCategories.includes(category)) {
      throw new Error(`Categoria inválida: ${category}. Categorias válidas: ${validCategories.join(', ')}`);
    }

    const query = `
      INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, category, question_id) DO UPDATE
      SET selected_option = EXCLUDED.selected_option,
          updated_at = NOW()
      RETURNING *;
    `;
    
    try {
      logger.info(`[ProfileService] Atualizando escolha de estilo`, { category, questionId, selectedOption });
      const { rows } = await pool.query(query, [userId, category, questionId, selectedOption]);
      return rows[0];
    } catch (error) {
      logger.error(`[ProfileService] Erro ao atualizar escolha de estilo:`, { 
        category, 
        questionId, 
        selectedOption, 
        error: error.message
      });
      throw new Error('Erro ao atualizar escolha de estilo do usuário.');
    }
  }

  /**
   * Busca o perfil de um usuário incluindo suas escolhas de estilo.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<object|null>} O perfil do usuário com stylePreferences.
   */
  async getProfileByUserId(userId) {
    if (!userId) {
      throw new Error('UserId é obrigatório');
    }

    // Query mais robusta que funciona com qualquer estrutura
    const profileQuery = `
      SELECT
        u.id AS user_id,
        u.email,
        u.name,
        u.email_verified,
        u.is_active,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        up.id AS profile_id,
        up.display_name,
        up.city,
        up.gender,
        up.avatar_url,
        up.bio,
        up.is_vip,
        up.age,
        up.style_completion_percentage,
        up.created_at AS profile_created_at,
        up.updated_at AS profile_updated_at
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1;
    `;
    
    try {
      logger.info(`[ProfileService] Iniciando busca de perfil para userId: ${userId}`);
      
      // Executar query principal
      const profileResult = await pool.query(profileQuery, [userId]);
      
      if (profileResult.rows.length === 0) {
        logger.warn(`[ProfileService] Usuário não encontrado: ${userId}`);
        return null;
      }
      
      const profile = profileResult.rows[0];
      logger.info(`[ProfileService] Perfil base carregado`, {
        hasProfile: !!profile.profile_id,
        displayName: profile.display_name,
        email: profile.email
      });

      // Tentar buscar campos adicionais se existirem
      try {
        const additionalFieldsQuery = `
          SELECT 
            interests,
            location_latitude,
            location_longitude,
            style_game_level,
            style_game_xp,
            last_style_game_played_at
          FROM user_profiles 
          WHERE user_id = $1;
        `;
        
        const additionalResult = await pool.query(additionalFieldsQuery, [userId]);
        if (additionalResult.rows.length > 0) {
          const additional = additionalResult.rows[0];
          profile.interests = additional.interests;
          profile.location_latitude = additional.location_latitude;
          profile.location_longitude = additional.location_longitude;
          profile.style_game_level = additional.style_game_level;
          profile.style_game_xp = additional.style_game_xp;
          profile.last_style_game_played_at = additional.last_style_game_played_at;
          logger.info(`[ProfileService] Campos adicionais carregados`);
        }
      } catch (additionalError) {
        logger.warn(`[ProfileService] Campos adicionais não disponíveis:`, additionalError.message);
        // Continuar sem os campos adicionais
      }
      
      // Buscar escolhas de estilo (com proteção contra falha)
      try {
        const styleChoices = await this.getStyleChoicesByUserId(userId);
        profile.stylePreferences = styleChoices;
        logger.info(`[ProfileService] StylePreferences carregadas: ${styleChoices.length} itens`);
      } catch (styleError) {
        logger.warn(`[ProfileService] Erro ao carregar stylePreferences:`, styleError.message);
        profile.stylePreferences = [];
      }
      
      logger.info(`[ProfileService] ✅ Perfil completo carregado com sucesso para userId: ${userId}`);
      return profile;
      
    } catch (error) {
      logger.error(`[ProfileService] ❌ Erro ao buscar perfil completo para userId ${userId}:`, {
        error: error.message,
        stack: error.stack,
        userId: userId
      });
      
      throw new Error('Erro ao buscar perfil completo do usuário.');
    }
  }

  /**
   * Atualiza o perfil de um usuário.
   * @param {string} userId - O UUID do usuário.
   * @param {object} updateData - Dados para atualizar.
   * @returns {Promise<object>} O perfil atualizado.
   */
  async updateUserProfile(userId, updateData) {
    if (!userId) {
      throw new Error('UserId é obrigatório');
    }

    const {
      displayName,
      city,
      gender,
      bio,
      age,
      avatarUrl
    } = updateData;

    // Query básica que funciona com qualquer estrutura
    const updateQuery = `
      UPDATE user_profiles 
      SET 
        display_name = COALESCE($2, display_name),
        city = COALESCE($3, city),
        gender = COALESCE($4, gender),
        bio = COALESCE($5, bio),
        age = COALESCE($6, age),
        avatar_url = COALESCE($7, avatar_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *;
    `;

    try {
      logger.info(`[ProfileService] Atualizando perfil para userId: ${userId}`, updateData);
      
      const result = await pool.query(updateQuery, [
        userId,
        displayName,
        city,
        gender,
        bio,
        age,
        avatarUrl
      ]);

      if (result.rows.length === 0) {
        // Tentar criar o perfil se não existir
        const insertQuery = `
          INSERT INTO user_profiles (
            user_id, display_name, city, gender, bio, age, avatar_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        
        const insertResult = await pool.query(insertQuery, [
          userId,
          displayName,
          city,
          gender,
          bio,
          age,
          avatarUrl
        ]);
        
        logger.info(`[ProfileService] Perfil criado para userId: ${userId}`);
        return insertResult.rows[0];
      }

      logger.info(`[ProfileService] ✅ Perfil atualizado com sucesso para userId: ${userId}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error(`[ProfileService] ❌ Erro ao atualizar perfil para userId ${userId}:`, {
        error: error.message,
        stack: error.stack,
        updateData: updateData
      });
      
      throw new Error('Erro ao atualizar perfil do usuário.');
    }
  }
}

export { ProfileService };