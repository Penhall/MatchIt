// server/services/chatService.js - Chat service
import { pool } from '../config/database.js';

class ChatService {
  async userHasAccessToMatch(matchId, userId) {
    const query = `
      SELECT 1 FROM matches 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `;
    const result = await pool.query(query, [matchId, userId]);
    return result.rowCount > 0;
  }

  async getMatchMessages(matchId, { page, limit, userId }) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM messages
      WHERE match_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    return (await pool.query(query, [matchId, limit, offset])).rows;
  }

  async sendMessage({ matchId, senderId, message, messageType }) {
    const query = `
      INSERT INTO messages (match_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    return (await pool.query(query, [matchId, senderId, message, messageType])).rows[0];
  }
}

export { ChatService };
