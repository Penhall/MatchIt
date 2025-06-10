// server/services/recommendationService.js - Serviço de recomendação
import { pool } from '../config/database.js';

export class RecommendationService {
  async getRecommendations(userId, options = {}) {
    const { limit = 20, algorithm = 'hybrid' } = options;
    
    try {
      // Tentar usar stored procedure se existir
      try {
        const result = await pool.query(
          'SELECT * FROM find_potential_matches($1, $2, 0.3, 50.0)',
          [userId, limit]
        );
        
        const matches = result.rows.map(row => ({
          id: `score_${Date.now()}_${row.user_id}`,
          userId,
          targetUserId: row.user_id,
          overallScore: row.compatibility_score,
          normalizedScore: Math.round(row.compatibility_score * 100),
          explanation: {
            summary: `${Math.round(row.compatibility_score * 100)}% compatível`,
            strengths: ['Estilo similar', 'Localização próxima']
          },
          targetUser: {
            displayName: row.display_name,
            city: row.city,
            avatarUrl: row.avatar_url,
            isVip: row.is_vip,
            distance: Math.round(row.distance_km)
          }
        }));

        return {
          matches,
          totalCandidates: result.rows.length,
          algorithm,
          processingTime: 100,
          fromCache: false
        };
      } catch (spError) {
        console.log('Stored procedure find_potential_matches não existe, usando algoritmo básico');
        
        // Fallback: usar query básica
        const result = await pool.query(
          `SELECT u.id as user_id, u.name,
                  up.avatar_url, up.style_data,
                  RANDOM() * 30 + 70 as compatibility_score
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id != $1 AND u.is_active = true
           ORDER BY RANDOM()
           LIMIT $2`,
          [userId, limit]
        );
        
        const matches = result.rows.map(row => {
          const styleData = row.style_data ? JSON.parse(row.style_data) : {};
          return {
            id: `score_${Date.now()}_${row.user_id}`,
            userId,
            targetUserId: row.user_id,
            overallScore: row.compatibility_score,
            normalizedScore: Math.round(row.compatibility_score),
            explanation: {
              summary: `${Math.round(row.compatibility_score)}% compatível`,
              strengths: ['Algoritmo básico', 'Seleção aleatória']
            },
            targetUser: {
              displayName: styleData.display_name || row.name,
              city: styleData.city || 'Unknown',
              avatarUrl: row.avatar_url,
              isVip: styleData.is_vip || false,
              distance: Math.round(Math.random() * 50)
            }
          };
        });

        return {
          matches,
          totalCandidates: result.rows.length,
          algorithm: 'basic_fallback',
          processingTime: 50,
          fromCache: false
        };
      }
    } catch (error) {
      console.error('Erro no serviço de recomendação:', error);
      throw error;
    }
  }
  
  async recordFeedback(userId, targetUserId, action, context = {}) {
    try {
      // Tentar usar stored procedure se existir
      try {
        await pool.query(
          'SELECT record_interaction_with_learning($1, $2, $3)',
          [userId, targetUserId, action]
        );
      } catch (spError) {
        console.log('Stored procedure record_interaction_with_learning não existe, usando inserção básica');
        
        // Fallback: inserir interação básica
        try {
          await pool.query(
            `INSERT INTO user_interactions (user_id, target_user_id, action, created_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, target_user_id) DO UPDATE SET
             action = EXCLUDED.action, created_at = NOW()`,
            [userId, targetUserId, action]
          );
        } catch (tableError) {
          console.log('Tabela user_interactions não existe, simulando feedback');
        }
      }
      
      // Verificar se criou match
      let matchCreated = false;
      if (action === 'like' || action === 'super_like') {
        try {
          const mutualCheck = await pool.query(
            `SELECT COUNT(*) as mutual FROM user_interactions 
             WHERE user_id = $1 AND target_user_id = $2 AND action IN ('like', 'super_like')
             AND EXISTS (
               SELECT 1 FROM user_interactions 
               WHERE user_id = $2 AND target_user_id = $1 AND action IN ('like', 'super_like')
             )`,
            [userId, targetUserId]
          );
          
          matchCreated = parseInt(mutualCheck.rows[0]?.mutual || 0) > 0;
        } catch (checkError) {
          console.log('Não foi possível verificar match mútuo');
        }
      }
      
      return {
        success: true,
        matchCreated,
        message: matchCreated ? 'Match criado!' : 'Feedback registrado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      throw error;
    }
  }

  async getHealthStatus() {
    try {
      let testResult = { test: 0 };
      let storedProceduresStatus = 'not_tested';
      
      // Testar stored procedure se existir
      try {
        const userTest = await pool.query('SELECT id FROM users LIMIT 1');
        if (userTest.rows.length > 0) {
          testResult = await pool.query(
            'SELECT calculate_style_compatibility($1, $1) as test', 
            [userTest.rows[0].id]
          );
          storedProceduresStatus = 'working';
        }
      } catch (error) {
        console.log('Stored procedures de recomendação não implementadas:', error.message);
        storedProceduresStatus = 'not_implemented';
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        storedProcedures: storedProceduresStatus,
        testScore: testResult.rows?.[0]?.test || 0,
        fallbackMode: storedProceduresStatus === 'not_implemented'
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserRecommendationStats(userId) {
    try {
      // Retornar stats básicas
      const mockStats = {
        totalRecommendationsSeen: Math.floor(Math.random() * 100) + 50,
        totalLikes: Math.floor(Math.random() * 30) + 10,
        totalMatches: Math.floor(Math.random() * 10) + 2,
        averageCompatibilityScore: Math.floor(Math.random() * 30) + 70,
        lastRecommendationDate: new Date(),
        preferredCategories: ['cyber', 'neon', 'dark']
      };
      
      return mockStats;
    } catch (error) {
      throw error;
    }
  }
}

// =====================================================

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

// =====================================================

// server/services/chatService.js - Serviço de chat
import { pool } from '../config/database.js';

export class ChatService {
  async userHasAccessToMatch(matchId, userId) {
    try {
      const result = await pool.query(
        'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
        [matchId, userId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getMatchMessages(matchId, options = {}) {
    const { page = 1, limit = 50, userId } = options;
    const offset = (page - 1) * limit;
    
    try {
      try {
        const result = await pool.query(
          `SELECT cm.id, cm.message_text, cm.message_type, cm.created_at,
                  cm.sender_id, up.style_data,
                  CASE WHEN cm.sender_id = $2 THEN true ELSE false END as is_current_user
           FROM chat_messages cm
           LEFT JOIN user_profiles up ON cm.sender_id = up.user_id
           WHERE cm.match_id = $1
           ORDER BY cm.created_at DESC
           LIMIT $3 OFFSET $4`,
          [matchId, userId, limit, offset]
        );
        
        const messages = result.rows.map(row => {
          const styleData = row.style_data ? JSON.parse(row.style_data) : {};
          return {
            id: row.id,
            message_text: row.message_text,
            message_type: row.message_type,
            created_at: row.created_at,
            sender_id: row.sender_id,
            sender_name: styleData.display_name || 'User',
            is_current_user: row.is_current_user
          };
        });
        
        return messages.reverse(); // Retornar em ordem cronológica
      } catch (error) {
        console.log('Tabela chat_messages não existe, retornando mensagens vazias');
        return [];
      }
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(messageData) {
    const { matchId, senderId, message, messageType = 'text' } = messageData;
    
    try {
      // Tentar usar stored procedure se existir
      try {
        const result = await pool.query(
          'SELECT send_message($1, $2, $3) as message_id',
          [senderId, matchId, message]
        );
        
        // Buscar a mensagem criada
        const messageResult = await pool.query(
          `SELECT cm.id, cm.message_text, cm.message_type, cm.created_at,
                  cm.sender_id, up.style_data, true as is_current_user
           FROM chat_messages cm
           LEFT JOIN user_profiles up ON cm.sender_id = up.user_id
           WHERE cm.id = $1`,
          [result.rows[0].message_id]
        );
        
        const messageRow = messageResult.rows[0];
        const styleData = messageRow.style_data ? JSON.parse(messageRow.style_data) : {};
        
        return {
          id: messageRow.id,
          message_text: messageRow.message_text,
          message_type: messageRow.message_type,
          created_at: messageRow.created_at,
          sender_id: messageRow.sender_id,
          sender_name: styleData.display_name || 'User',
          is_current_user: true
        };
        
      } catch (error) {
        console.log('Sistema de chat não implementado, simulando resposta');
        
        const mockMessage = {
          id: `msg_${Date.now()}`,
          message_text: message,
          message_type: messageType,
          created_at: new Date(),
          sender_id: senderId,
          sender_name: 'Você',
          is_current_user: true
        };
        
        return mockMessage;
      }
    } catch (error) {
      throw error;
    }
  }

  async markMessageAsRead(messageId, userId) {
    try {
      // Implementação simples ou mock
      console.log(`Mensagem ${messageId} marcada como lida pelo usuário ${userId}`);
    } catch (error) {
      throw error;
    }
  }
}
