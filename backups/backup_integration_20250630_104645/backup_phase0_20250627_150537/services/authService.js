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
      
      // Check if email exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('Email already in use');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Insert user
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, name, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at',
        [email, hashedPassword, name, true]
      );
      
      const userId = userResult.rows[0].id;
      
      // Create user profile
      const styleData = {
        city: city || 'Unknown',
        gender: gender || 'other',
        age: age || 25,
        style_completion_percentage: 0,
        bio: '',
        is_vip: false
      };
      
      await client.query(
        `INSERT INTO user_profiles
         (user_id, display_name, avatar_url, style_data)
         VALUES ($1, $2, $3, $4)`,
        [userId, displayName || name, null, JSON.stringify(styleData)]
      );
      
      await client.query('COMMIT');
      
      // Generate token
      const token = this.generateToken({ userId, email });
      
      return {
        token, // Mantido para compatibilidade
        auth_token: token,
        user: {
          id: userId,
          email: userResult.rows[0].email,
          name: userResult.rows[0].name,
          displayName: styleData.display_name,
          city: styleData.city,
          isVip: styleData.is_vip
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
      console.log(`[AuthService] Tentativa de login para: ${email}`);
      // Find user
      const userResult = await pool.query(
        `SELECT u.id, u.email, u.name, u.password_hash, up.style_data
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.email = $1 AND u.is_active = true`,
        [email]
      );
      if (userResult.rows.length === 0) {
        console.error(`[AuthService] Usuário não encontrado: ${email}`);
        throw new Error('Invalid credentials');
      }
      console.log(`[AuthService] Usuário encontrado: ${userResult.rows[0].email}`);
      
      
      const user = userResult.rows[0];
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        console.error('[AuthService] Senha inválida para usuário:', email);
        throw new Error('Invalid credentials');
      }
      console.log('[AuthService] Credenciais válidas');
      
      // Extract style data
      const styleData = typeof user.style_data === 'string'
        ? JSON.parse(user.style_data)
        : user.style_data || {};
      
      // Generate token
      const token = this.generateToken({ userId: user.id, email: user.email });
      
      return {
        token, // Mantido para compatibilidade
        auth_token: token,
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
      console.error('[AuthService] Erro no login:', error.message, '\nStack:', error.stack);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      
      // Generate new access token
      const newToken = this.generateToken({ 
        userId: decoded.userId, 
        email: decoded.email 
      });
      
      return {
        token: newToken, // Mantido para compatibilidade
        auth_token: newToken,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
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
      throw new Error('Invalid token');
    }
  }

  async resetPassword(email, newPassword) {
    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password
      const result = await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 AND is_active = true RETURNING id',
        [hashedPassword, email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return {
        message: 'Password reset successfully',
        success: true
      };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current password hash
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!validPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );
      
      return {
        message: 'Password changed successfully',
        success: true
      };
    } catch (error) {
      throw error;
    }
  }
}