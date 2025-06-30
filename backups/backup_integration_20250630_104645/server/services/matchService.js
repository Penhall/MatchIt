// server/services/matchService.js - Serviço de matches
import { pool } from '../config/database.js';

export class MatchService {
  async getPotentialMatches(userId, options = {}) {
    const { limit = 20 } = options;
    
    try {
      // Tentar usar stored procedure se existir
      try {
        const result = await pool.query(
          'SELECT * FROM find_potential_matches($1)',
          [userId]
        );
        return result.rows;
      } catch (error) {
        console.log('Stored procedure find_potential_matches não existe, usando query básica');
        
        const result = await pool.query(
          `SELECT u.id, u.name, up.avatar_url, up.style_data,
                  RANDOM() * 30 + 70 as compatibility_score
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id != $1 AND u.is_active = true
           ORDER BY RANDOM()
           LIMIT $2`,
          [userId, limit]
        );
        
        return result.rows.map(row => {
          const styleData = row.style_data ? JSON.parse(row.style_data) : {};
          return {
            id: row.id,
            name: styleData.display_name || row.name,
            avatar_url: row.avatar_url,
            city: styleData.city || 'Unknown',
            age: styleData.age || 25,
            compatibility_score: Math.round(row.compatibility_score)
          };
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async getUserMatches(userId) {
    try {
      const result = await pool.query(
        `SELECT m.id, m.compatibility_score, m.status, m.created_at,
                u1.name as user1_name, up1.style_data as user1_style,
                u2.name as user2_name, up2.style_data as user2_style,
                CASE 
                  WHEN m.user1_id = $1 THEN u2.id
                  ELSE u1.id 
                END as match_user_id,
                CASE 
                  WHEN m.user1_id = $1 THEN up2.avatar_url 
                  ELSE up1.avatar_url 
                END as match_avatar,
                CASE 
                  WHEN m.user1_id = $1 THEN up2.style_data 
                  ELSE up1.style_data 
                END as match_style_data
         FROM matches m
         INNER JOIN users u1 ON m.user1_id = u1.id
         INNER JOIN users u2 ON m.user2_id = u2.id
         LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
         LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
         WHERE m.user1_id = $1 OR m.user2_id = $1
         ORDER BY m.compatibility_score DESC`,
        [userId]
      );
      
      return result.rows.map(row => {
        const matchStyleData = row.match_style_data ? JSON.parse(row.match_style_data) : {};
        return {
          id: row.id,
          compatibility_score: row.compatibility_score,
          status: row.status,
          created_at: row.created_at,
          match_user_id: row.match_user_id,
          match_name: matchStyleData.display_name || (row.user1_id === userId ? row.user2_name : row.user1_name),
          match_avatar: row.match_avatar,
          match_city: matchStyleData.city || 'Unknown',
          match_is_vip: matchStyleData.is_vip || false
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async createMatch(userId, targetUserId) {
    try {
      // Tentar usar stored procedure se existir
      try {
        const result = await pool.query(
          'SELECT create_match($1, $2) as match_id',
          [userId, targetUserId]
        );
        
        return { 
          matchId: result.rows[0].match_id,
          message: 'Match criado com sucesso' 
        };
      } catch (error) {
        console.log('Stored procedure create_match não existe, criando match diretamente');
        
        // Verificar se match já existe
        const existingMatch = await pool.query(
          `SELECT id FROM matches 
           WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
          [userId, targetUserId]
        );
        
        if (existingMatch.rows.length > 0) {
          throw new Error('Match já existe entre estes usuários');
        }
        
        // Criar novo match
        const matchResult = await pool.query(
          `INSERT INTO matches (user1_id, user2_id, compatibility_score, status, created_at)
           VALUES ($1, $2, $3, 'pending', NOW())
           RETURNING id`,
          [Math.min(userId, targetUserId), Math.max(userId, targetUserId), Math.random() * 30 + 70]
        );
        
        return { 
          matchId: matchResult.rows[0].id,
          message: 'Match criado com sucesso' 
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async updateMatchStatus(matchId, userId, status) {
    try {
      // Verificar se o usuário é parte do match
      const matchCheck = await pool.query(
        'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
        [matchId, userId]
      );
      
      if (matchCheck.rows.length === 0) {
        throw new Error('Match não encontrado');
      }
      
      const result = await pool.query(
        'UPDATE matches SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, matchId]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}
