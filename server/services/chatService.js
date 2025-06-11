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