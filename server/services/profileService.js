// server/services/profileService.js - Serviço de perfil completo e corrigido
// Arquivo: server/services/profileService.js

import { pool } from '../config/database.js';
import { logger } from '../utils/helpers.js';

class ProfileService {
  /**
   * Valida se uma string é um UUID válido.
   * @param {string} uuid - String para validar.
   * @returns {boolean} True se é um UUID válido.
   */
  validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Busca as escolhas de estilo de um usuário.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<Array>} Lista de escolhas de estilo.
   */
  async getStyleChoicesByUserId(userId) {
    if (!userId) {
      throw new Error('UserId é obrigatório');
    }

    if (!this.validateUUID(userId)) {
      logger.warn(`[ProfileService] UUID inválido para getStyleChoicesByUserId: ${userId}`);
      return [];
    }

    const query = `
      SELECT 
        category, 
        question_id AS "questionId", 
        selected_option AS "selectedOption",
        created_at,
        updated_at
      FROM style_choices
      WHERE user_id = $1
      ORDER BY created_at;
    `;
    
    try {
      logger.info(`[ProfileService] Buscando escolhas de estilo para userId: ${userId}`);
      const { rows } = await pool.query(query, [userId]);
      logger.info(`[ProfileService] Encontradas ${rows.length} escolhas de estilo para userId: ${userId}`);
      return rows;
    } catch (error) {
      logger.error(`[ProfileService] Erro ao buscar escolhas de estilo para userId ${userId}:`, {
        error: error.message,
        stack: error.stack,
        query: query
      });
      
      // Verificar se a tabela existe
      if (error.message.includes('relation "style_choices" does not exist')) {
        throw new Error('Tabela style_choices não existe. Execute as migrations primeiro.');
      }
      
      // Retornar array vazio em vez de quebrar
      logger.warn(`[ProfileService] Retornando array vazio devido ao erro`);
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
    
    // Validação de entrada robusta
    if (!userId) {
      logger.error(`[ProfileService] updateStyleChoice: UserId não fornecido`);
      throw new Error('UserId é obrigatório');
    }
    
    if (!this.validateUUID(userId)) {
      logger.error(`[ProfileService] updateStyleChoice: UUID inválido: ${userId}`);
      throw new Error('UserId deve ser um UUID válido');
    }
    
    if (!category) {
      logger.error(`[ProfileService] updateStyleChoice: Category não fornecida`);
      throw new Error('Category é obrigatória');
    }
    
    if (!questionId) {
      logger.error(`[ProfileService] updateStyleChoice: QuestionId não fornecido`);
      throw new Error('QuestionId é obrigatório');
    }
    
    if (selectedOption === undefined || selectedOption === null || selectedOption === '') {
      logger.error(`[ProfileService] updateStyleChoice: SelectedOption inválido`, { selectedOption });
      throw new Error('SelectedOption é obrigatório');
    }
    
    if (!validCategories.includes(category)) {
      logger.error(`[ProfileService] updateStyleChoice: Categoria inválida`, { category, validCategories });
      throw new Error(`Categoria inválida: ${category}. Categorias válidas: ${validCategories.join(', ')}`);
    }

    // Query usando ON CONFLICT (funciona com a constraint UNIQUE que criamos)
    const query = `
      INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, category, question_id) DO UPDATE
      SET selected_option = EXCLUDED.selected_option,
          updated_at = NOW()
      RETURNING *;
    `;
    
    try {
      logger.info(`[ProfileService] updateStyleChoice: Iniciando atualização`, { 
        userId, 
        category, 
        questionId, 
        selectedOption 
      });
      
      // Verificar se o usuário existe primeiro
      const userCheckQuery = 'SELECT id FROM users WHERE id = $1';
      const userCheckResult = await pool.query(userCheckQuery, [userId]);
      
      if (userCheckResult.rows.length === 0) {
        logger.error(`[ProfileService] updateStyleChoice: Usuário não encontrado`, { userId });
        throw new Error('Usuário não encontrado');
      }
      
      logger.info(`[ProfileService] updateStyleChoice: Usuário verificado, executando query`);
      
      const { rows } = await pool.query(query, [userId, category, questionId, selectedOption]);
      
      if (rows.length === 0) {
        logger.error(`[ProfileService] updateStyleChoice: Nenhuma linha retornada da query`);
        throw new Error('Falha ao atualizar escolha de estilo - nenhuma linha afetada');
      }
      
      logger.info(`[ProfileService] updateStyleChoice: ✅ Sucesso`, { 
        returnedData: rows[0] 
      });
      
      return rows[0];
      
    } catch (error) {
      logger.error(`[ProfileService] updateStyleChoice: ❌ Erro detalhado`, { 
        userId,
        category, 
        questionId, 
        selectedOption, 
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetail: error.detail,
        errorConstraint: error.constraint
      });
      
      // Tratar erros específicos do PostgreSQL
      if (error.code === '23505') { // unique_violation
        logger.error(`[ProfileService] updateStyleChoice: Violação de constraint unique`);
        throw new Error(`Conflito: escolha de estilo já existe para esta categoria e questão`);
      }
      
      if (error.code === '23503') { // foreign_key_violation
        logger.error(`[ProfileService] updateStyleChoice: Violação de foreign key`);
        throw new Error(`Usuário não encontrado ou inválido`);
      }
      
      if (error.code === '23514') { // check_violation
        logger.error(`[ProfileService] updateStyleChoice: Violação de constraint check`);
        throw new Error(`Dados inválidos: verifique se a categoria está correta`);
      }
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        logger.error(`[ProfileService] updateStyleChoice: Tabela não existe`);
        throw new Error('Tabela style_choices não existe. Execute as migrations.');
      }
      
      if (error.message.includes('ON CONFLICT')) {
        logger.error(`[ProfileService] updateStyleChoice: Problema com ON CONFLICT`);
        throw new Error('Erro de constraint UNIQUE. Verifique se a tabela tem a constraint necessária.');
      }
      
      // Erro genérico
      throw new Error(`Erro ao atualizar escolha de estilo: ${error.message}`);
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

    // Validação de UUID para retornar 404 corretamente
    if (!this.validateUUID(userId)) {
      logger.warn(`[ProfileService] UUID inválido fornecido: ${userId}`);
      return null; // Isso fará com que a rota retorne 404
    }

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
      
      // Verificar erros específicos de tabelas inexistentes
      if (error.message.includes('relation "users" does not exist')) {
        throw new Error('Tabela users não existe. Execute as migrations primeiro.');
      }
      
      if (error.message.includes('relation "user_profiles" does not exist')) {
        throw new Error('Tabela user_profiles não existe. Execute as migrations primeiro.');
      }
      
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

    if (!this.validateUUID(userId)) {
      throw new Error('UserId deve ser um UUID válido');
    }

    const {
      displayName,
      city,
      gender,
      bio,
      age,
      avatarUrl,
      interests,
      locationLatitude,
      locationLongitude
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
      
      if (error.code === '23503') { // foreign_key_violation
        throw new Error('Usuário não encontrado');
      }
      
      throw new Error('Erro ao atualizar perfil do usuário.');
    }
  }

  /**
   * Cria um perfil inicial para um usuário.
   * @param {string} userId - O UUID do usuário.
   * @param {object} profileData - Dados iniciais do perfil.
   * @returns {Promise<object>} O perfil criado.
   */
  async createUserProfile(userId, profileData = {}) {
    if (!userId) {
      throw new Error('UserId é obrigatório');
    }

    if (!this.validateUUID(userId)) {
      throw new Error('UserId deve ser um UUID válido');
    }

    const {
      displayName = 'Usuário',
      city = null,
      gender = 'other',
      bio = '',
      age = null,
      avatarUrl = null
    } = profileData;

    const insertQuery = `
      INSERT INTO user_profiles (
        user_id, display_name, city, gender, bio, age, avatar_url, 
        style_completion_percentage, style_game_level, style_game_xp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 1, 0)
      RETURNING *;
    `;

    try {
      logger.info(`[ProfileService] Criando perfil para userId: ${userId}`, profileData);
      
      const result = await pool.query(insertQuery, [
        userId,
        displayName,
        city,
        gender,
        bio,
        age,
        avatarUrl
      ]);

      logger.info(`[ProfileService] ✅ Perfil criado com sucesso para userId: ${userId}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error(`[ProfileService] ❌ Erro ao criar perfil para userId ${userId}:`, {
        error: error.message,
        stack: error.stack,
        profileData: profileData
      });
      
      if (error.code === '23505') { // unique_violation
        throw new Error('Perfil já existe para este usuário');
      }
      
      if (error.code === '23503') { // foreign_key_violation
        throw new Error('Usuário não encontrado');
      }
      
      throw new Error('Erro ao criar perfil do usuário.');
    }
  }

  /**
   * Deleta todas as escolhas de estilo de um usuário.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<boolean>} True se deletou com sucesso.
   */
  async deleteUserStyleChoices(userId) {
    if (!userId) {
      throw new Error('UserId é obrigatório');
    }

    if (!this.validateUUID(userId)) {
      throw new Error('UserId deve ser um UUID válido');
    }

    const deleteQuery = 'DELETE FROM style_choices WHERE user_id = $1';

    try {
      logger.info(`[ProfileService] Deletando escolhas de estilo para userId: ${userId}`);
      
      const result = await pool.query(deleteQuery, [userId]);
      
      logger.info(`[ProfileService] ✅ ${result.rowCount} escolhas de estilo deletadas para userId: ${userId}`);
      return true;
      
    } catch (error) {
      logger.error(`[ProfileService] ❌ Erro ao deletar escolhas de estilo para userId ${userId}:`, {
        error: error.message,
        stack: error.stack
      });
      
      throw new Error('Erro ao deletar escolhas de estilo do usuário.');
    }
  }

  /**
   * Calcula o percentual de completude do perfil de estilo.
   * @param {string} userId - O UUID do usuário.
   * @returns {Promise<number>} Percentual de 0 a 100.
   */
  async calculateStyleCompletionPercentage(userId) {
    if (!userId) {
      throw new Error('UserId é obrigatório');
    }

    if (!this.validateUUID(userId)) {
      throw new Error('UserId deve ser um UUID válido');
    }

    try {
      const styleChoices = await this.getStyleChoicesByUserId(userId);
      const totalCategories = 6; // Sneakers, Clothing, Colors, Hobbies, Feelings, Interests
      const completedCategories = new Set(styleChoices.map(choice => choice.category)).size;
      
      const percentage = Math.round((completedCategories / totalCategories) * 100);
      
      logger.info(`[ProfileService] Percentual de completude calculado para userId ${userId}: ${percentage}%`, {
        completedCategories,
        totalCategories,
        uniqueCategories: Array.from(new Set(styleChoices.map(choice => choice.category)))
      });
      
      return percentage;
      
    } catch (error) {
      logger.error(`[ProfileService] Erro ao calcular percentual de completude para userId ${userId}:`, error.message);
      return 0;
    }
  }
}

export { ProfileService };