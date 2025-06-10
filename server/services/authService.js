// server/services/authService.js - Serviço de autenticação
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { config } from '../config/environment.js';

export class AuthService {
  async registerUser(userData) {
    const { email, password, name, displayName, city, gender, age } = userData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar se email já existe
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('Email já está em uso');
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Inserir usuário
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, name, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at',
        [email, hashedPassword, name, true]
      );
      
      const userId = userResult.rows[0].id;
      
      // Criar perfil do usuário
      const styleData = {
        display_name: displayName || name,
        city: city || 'Unknown',
        gender: gender || 'other',
        age: age || 25,
        style_completion_percentage: 0,
        bio: '',
        is_vip: false
      };
      
      const profileResult = await client.query(
        `INSERT INTO user_profiles (user_id, avatar_url, style_data) 
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, null, JSON.stringify(styleData)]
      );
      
      await client.query('COMMIT');
      
      // Gerar token
      const token = this.generateToken({ userId, email });
      
      return {
        token,
        user: {
          id: userId,
          email: userResult.rows[0].email,
          name: userResult.rows[0].name,
          profile: { ...profileResult.rows[0], styleData }
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async loginUser(email, password) {
    try {
      // Buscar usuário
      const userResult = await pool.query(
        `SELECT u.id, u.email, u.name, u.password_hash, up.style_data 
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id 
         WHERE u.email = $1 AND u.is_active = true`,
        [email]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Credenciais inválidas');
      }
      
      const user = userResult.rows[0];
      
      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        throw new Error('Credenciais inválidas');
      }
      
      // Gerar token
      const token = this.generateToken({ userId: user.id, email: user.email });
      
      // Extrair dados do style_data JSON
      const styleData = user.style_data ? JSON.parse(user.style_data) : {};
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: styleData.display_name || user.name,
          city: styleData.city || 'Unknown',
          isVip: styleData.is_vip || false
        }
      };
      
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      
      // Verificar se usuário ainda existe e está ativo
      const userResult = await pool.query(
        'SELECT id, email FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = userResult.rows[0];
      const newToken = this.generateToken({ userId: user.id, email: user.email });
      
      return { token: newToken };
      
    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  generateToken(payload) {
    return jwt.sign(
      payload, 
      config.jwt.secret, 
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

// =====================================================

// server/services/profileService.js - Serviço de perfil
import { pool } from '../config/database.js';

export class ProfileService {
  async getUserProfile(userId) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.name, up.avatar_url, up.style_data
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      const styleData = user.style_data ? JSON.parse(user.style_data) : {};
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: styleData.display_name || user.name,
        city: styleData.city || 'Unknown',
        gender: styleData.gender || 'other',
        avatarUrl: user.avatar_url,
        bio: styleData.bio || '',
        isVip: styleData.is_vip || false,
        age: styleData.age || 25,
        styleCompletionPercentage: styleData.style_completion_percentage || 0
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const { displayName, city, bio, avatarUrl, age, gender } = updateData;
      
      // Buscar dados atuais
      const currentResult = await pool.query(
        'SELECT style_data FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      
      let currentStyleData = {};
      if (currentResult.rows.length > 0 && currentResult.rows[0].style_data) {
        currentStyleData = JSON.parse(currentResult.rows[0].style_data);
      }
      
      // Atualizar dados
      const updatedStyleData = {
        ...currentStyleData,
        display_name: displayName || currentStyleData.display_name,
        city: city || currentStyleData.city,
        bio: bio || currentStyleData.bio,
        age: age || currentStyleData.age,
        gender: gender || currentStyleData.gender
      };
      
      const result = await pool.query(
        `UPDATE user_profiles 
         SET avatar_url = COALESCE($1, avatar_url),
             style_data = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 
         RETURNING *`,
        [avatarUrl, JSON.stringify(updatedStyleData), userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Perfil não encontrado');
      }
      
      return { 
        ...result.rows[0],
        styleData: updatedStyleData
      };
    } catch (error) {
      throw error;
    }
  }

  async saveStyleChoices(userId, choices) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Deletar escolhas anteriores se a tabela existir
      try {
        await client.query(
          'DELETE FROM style_choices WHERE user_id = $1',
          [userId]
        );
        
        // Inserir novas escolhas
        for (const choice of choices) {
          await client.query(
            'INSERT INTO style_choices (user_id, category, question_id, selected_option) VALUES ($1, $2, $3, $4)',
            [userId, choice.category, choice.questionId, choice.selectedOption]
          );
        }
      } catch (error) {
        // Se a tabela não existir, salvar no style_data do perfil
        const currentProfile = await client.query(
          'SELECT style_data FROM user_profiles WHERE user_id = $1',
          [userId]
        );
        
        let currentStyleData = {};
        if (currentProfile.rows.length > 0 && currentProfile.rows[0].style_data) {
          currentStyleData = JSON.parse(currentProfile.rows[0].style_data);
        }
        
        currentStyleData.style_choices = choices;
        
        await client.query(
          'UPDATE user_profiles SET style_data = $1 WHERE user_id = $2',
          [JSON.stringify(currentStyleData), userId]
        );
      }
      
      // Atualizar percentual de completude
      const completionPercentage = Math.min(100, (choices.length / 5) * 100);
      
      const currentProfile = await client.query(
        'SELECT style_data FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      
      let styleData = {};
      if (currentProfile.rows.length > 0 && currentProfile.rows[0].style_data) {
        styleData = JSON.parse(currentProfile.rows[0].style_data);
      }
      
      styleData.style_completion_percentage = completionPercentage;
      
      await client.query(
        'UPDATE user_profiles SET style_data = $1 WHERE user_id = $2',
        [JSON.stringify(styleData), userId]
      );
      
      await client.query('COMMIT');
      
      return { 
        message: 'Escolhas salvas com sucesso', 
        completionPercentage 
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserStyleChoices(userId) {
    try {
      // Tentar buscar da tabela style_choices primeiro
      try {
        const result = await pool.query(
          'SELECT category, question_id, selected_option FROM style_choices WHERE user_id = $1',
          [userId]
        );
        
        if (result.rows.length > 0) {
          return result.rows;
        }
      } catch (error) {
        console.log('Tabela style_choices não existe, buscando do perfil');
      }
      
      // Se não encontrar, buscar do style_data
      const profileResult = await pool.query(
        'SELECT style_data FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (profileResult.rows.length > 0 && profileResult.rows[0].style_data) {
        const styleData = JSON.parse(profileResult.rows[0].style_data);
        return styleData.style_choices || [];
      }
      
      return [];
      
    } catch (error) {
      throw error;
    }
  }
}
