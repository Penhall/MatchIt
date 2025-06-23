// server/services/profileService.js - Serviço de perfil com suporte a preferências de estilo
import { pool } from '../config/database.js';
import { logger } from '../utils/helpers.js';

export class ProfileService {
  constructor() {
    this.tableName = 'user_profiles';
    this.styleChoicesTable = 'style_choices';
  }

  // =====================================================
  // MÉTODOS DE PREFERÊNCIAS DE ESTILO (FASE 0)
  // =====================================================

  /**
   * Busca todas as escolhas de estilo de um usuário
   * @param {number|string} userId - ID do usuário (pode ser integer ou UUID)
   * @returns {Promise<Array>} Lista de escolhas de estilo
   */
  async getStyleChoicesByUserId(userId) {
    const client = await pool.connect();
    try {
      // Não converter para int se for UUID
      let userIdParam = userId;
      
      logger.info(`[ProfileService] Buscando style choices para userId: ${userIdParam}`);

      const query = `
        SELECT 
          category,
          question_id as "questionId",
          selected_option as "selectedOption",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM style_choices
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await client.query(query, [userIdParam]);
      
      logger.info(`[ProfileService] Encontradas ${result.rows.length} escolhas de estilo para userId: ${userIdParam}`);
      return result.rows;

    } catch (error) {
      logger.error(`[ProfileService] Erro ao buscar style choices: ${error.message}`);
      throw new Error(`Erro ao buscar preferências de estilo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza ou insere uma escolha de estilo do usuário
   * @param {number|string} userId - ID do usuário (pode ser integer ou UUID)
   * @param {Object} styleChoice - Objeto com category, questionId, selectedOption
   * @returns {Promise<Object>} Escolha de estilo atualizada
   */
  async updateStyleChoice(userId, styleChoice) {
    const client = await pool.connect();
    try {
      // Não converter para int se for UUID
      let userIdParam = userId;

      const { category, questionId, selectedOption } = styleChoice;

      // Validação dos dados
      if (!category || !questionId || selectedOption === undefined) {
        throw new Error('Dados incompletos: category, questionId e selectedOption são obrigatórios');
      }

      logger.info(`[ProfileService] Atualizando style choice - userId: ${userIdParam}, category: ${category}, questionId: ${questionId}`);

      // Verificar se o usuário existe
      const userCheck = await client.query(
        `SELECT id FROM users WHERE id = $1`,
        [userIdParam]
      );

      if (userCheck.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Primeiro tenta atualizar (usando UPSERT com ON CONFLICT)
      const upsertQuery = `
        INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (user_id, category, question_id)
        DO UPDATE SET 
          selected_option = EXCLUDED.selected_option,
          updated_at = NOW()
        RETURNING 
          category,
          question_id as "questionId",
          selected_option as "selectedOption",
          updated_at as "updatedAt"
      `;

      const result = await client.query(upsertQuery, [
        userIdParam, 
        category, 
        questionId, 
        selectedOption
      ]);

      return result.rows[0];

    } catch (error) {
      logger.error(`[ProfileService] Erro ao atualizar style choice: ${error.message}`);
      throw new Error(`Erro ao atualizar preferência de estilo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Remove todas as escolhas de estilo de um usuário
   * @param {number|string} userId - ID do usuário
   * @returns {Promise<void>}
   */
  async clearStyleChoices(userId) {
    const client = await pool.connect();
    try {
      // Não converter para int se for UUID
      let userIdParam = userId;

      logger.info(`[ProfileService] Removendo todas as style choices para userId: ${userIdParam}`);

      const query = `DELETE FROM style_choices WHERE user_id = $1`;
      const result = await client.query(query, [userIdParam]);

      logger.info(`[ProfileService] Removidas ${result.rowCount} escolhas de estilo para userId: ${userIdParam}`);
      return result.rowCount || 0;

    } catch (error) {
      logger.error(`[ProfileService] Erro ao remover style choices: ${error.message}`);
      throw new Error(`Erro ao remover preferências de estilo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Busca estatísticas de completude do perfil de estilo
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Estatísticas do perfil
   */
  async getStyleCompletionStats(userId) {
    const client = await pool.connect();
    try {
      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        throw new Error('ID de usuário inválido');
      }

      const query = `
        SELECT 
          category,
          COUNT(*) as answered_questions
        FROM ${this.styleChoicesTable}
        WHERE user_id = $1
        GROUP BY category
      `;

      const result = await client.query(query, [userIdInt]);
      
      const stats = {
        totalAnswered: result.rows.reduce((sum, row) => sum + parseInt(row.answered_questions), 0),
        byCategory: result.rows.reduce((acc, row) => {
          acc[row.category] = parseInt(row.answered_questions);
          return acc;
        }, {}),
        completionPercentage: 0
      };

      // Assumindo 5 categorias com 5 perguntas cada = 25 total
      const totalPossibleQuestions = 25;
      stats.completionPercentage = Math.round((stats.totalAnswered / totalPossibleQuestions) * 100);

      return stats;

    } catch (error) {
      logger.error(`[ProfileService] Erro ao buscar estatísticas de estilo: ${error.message}`);
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // =====================================================
  // MÉTODOS DE PERFIL EXISTENTES (mantidos)
  // =====================================================

  /**
   * Busca perfil completo do usuário incluindo preferências de estilo
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Perfil completo do usuário
   */
  async getProfileByUserId(userId) {
    const client = await pool.connect();
    try {
      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        throw new Error('ID de usuário inválido');
      }

      logger.info(`[ProfileService] Buscando perfil completo para userId: ${userIdInt}`);

      // Buscar dados básicos do perfil
      const profileQuery = `
        SELECT 
          up.*,
          u.email,
          u.created_at as user_created_at
        FROM ${this.tableName} up
        JOIN users u ON up.user_id = u.id
        WHERE up.user_id = $1
      `;

      const profileResult = await client.query(profileQuery, [userIdInt]);
      
      if (profileResult.rows.length === 0) {
        return null;
      }

      const profile = profileResult.rows[0];

      // Buscar preferências de estilo
      const styleChoices = await this.getStyleChoicesByUserId(userIdInt);
      
      // Buscar estatísticas de completude
      const styleStats = await this.getStyleCompletionStats(userIdInt);

      // Montar objeto completo
      const completeProfile = {
        ...profile,
        stylePreferences: styleChoices,
        styleCompletionStats: styleStats
      };

      logger.info(`[ProfileService] Perfil completo encontrado para userId: ${userIdInt}`);
      return completeProfile;

    } catch (error) {
      logger.error(`[ProfileService] Erro ao buscar perfil completo: ${error.message}`);
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza dados básicos do perfil do usuário
   * @param {number} userId - ID do usuário
   * @param {Object} updateData - Dados para atualizar
   * @returns {Promise<Object>} Perfil atualizado
   */
  async updateUserProfile(userId, updateData) {
    const client = await pool.connect();
    try {
      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        throw new Error('ID de usuário inválido');
      }

      logger.info(`[ProfileService] Atualizando perfil para userId: ${userIdInt}`);

      const allowedFields = [
        'display_name', 'age', 'gender', 'city', 'bio', 
        'avatar_url', 'preferences', 'personality_vector'
      ];

      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Construir query dinâmica baseada nos campos fornecidos
      Object.keys(updateData).forEach(key => {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbField)) {
          updates.push(`${dbField} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        throw new Error('Nenhum campo válido fornecido para atualização');
      }

      // Adicionar timestamp de atualização
      updates.push(`updated_at = NOW()`);
      values.push(userIdInt);

      const query = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Perfil não encontrado ou não foi possível atualizar');
      }

      logger.info(`[ProfileService] Perfil atualizado com sucesso para userId: ${userIdInt}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`[ProfileService] Erro ao atualizar perfil: ${error.message}`);
      throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Cria um novo perfil para o usuário
   * @param {number} userId - ID do usuário
   * @param {Object} profileData - Dados do perfil
   * @returns {Promise<Object>} Perfil criado
   */
  async createUserProfile(userId, profileData = {}) {
    const client = await pool.connect();
    try {
      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        throw new Error('ID de usuário inválido');
      }

      logger.info(`[ProfileService] Criando perfil para userId: ${userIdInt}`);

      const {
        displayName = null,
        age = null,
        gender = null,
        city = null,
        bio = null,
        avatarUrl = null
      } = profileData;

      const query = `
        INSERT INTO ${this.tableName} (
          user_id, display_name, age, gender, city, bio, avatar_url, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        ) RETURNING *
      `;

      const result = await client.query(query, [
        userIdInt, displayName, age, gender, city, bio, avatarUrl
      ]);

      logger.info(`[ProfileService] Perfil criado com sucesso para userId: ${userIdInt}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`[ProfileService] Erro ao criar perfil: ${error.message}`);
      throw new Error(`Erro ao criar perfil: ${error.message}`);
    } finally {
      client.release();
    }
  }
}