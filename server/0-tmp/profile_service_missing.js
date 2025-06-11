// server/services/profileService.js - Serviço de perfil do usuário
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
      
      // Get current data
      const currentResult = await pool.query(
        'SELECT style_data FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      
      let currentStyleData = {};
      if (currentResult.rows.length > 0 && currentResult.rows[0].style_data) {
        currentStyleData = JSON.parse(currentResult.rows[0].style_data);
      }
      
      // Update data
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
        throw new Error('Profile not found');
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
      
      // Try to save to style_choices table
      try {
        await client.query(
          'DELETE FROM style_choices WHERE user_id = $1',
          [userId]
        );
        
        for (const choice of choices) {
          await client.query(
            'INSERT INTO style_choices (user_id, category, question_id, selected_option) VALUES ($1, $2, $3, $4)',
            [userId, choice.category, choice.questionId, choice.selectedOption]
          );
        }
      } catch (error) {
        // Fallback to saving in style_data
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
      
      // Update completion percentage
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
        message: 'Style choices saved successfully', 
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
      // Try style_choices table first
      try {
        const result = await pool.query(
          'SELECT category, question_id, selected_option FROM style_choices WHERE user_id = $1',
          [userId]
        );
        
        if (result.rows.length > 0) {
          return result.rows;
        }
      } catch (error) {
        console.log('style_choices table not found, checking profile');
      }
      
      // Fallback to style_data
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