// server/services/statsService.js - Stats service
import { pool } from '../config/database.js';

class StatsService {
  async getUserStats(userId) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM matches WHERE user1_id = $1 OR user2_id = $1) AS total_matches,
        (SELECT COUNT(*) FROM messages WHERE sender_id = $1) AS messages_sent,
        (SELECT COUNT(*) FROM likes WHERE liker_id = $1) AS likes_given,
        (SELECT COUNT(*) FROM likes WHERE liked_id = $1) AS likes_received
    `;
    return (await pool.query(query, [userId])).rows[0];
  }

  async getStyleAnalytics() {
    const query = `
      SELECT 
        style_preference,
        COUNT(*) AS user_count,
        ROUND(AVG(match_score), 2) AS avg_match_score
      FROM user_profiles
      GROUP BY style_preference
      ORDER BY user_count DESC
      LIMIT 10
    `;
    return (await pool.query(query)).rows;
  }

  async getMatchAnalytics(userId) {
    const query = `
      SELECT 
        DATE_TRUNC('week', created_at) AS week,
        COUNT(*) AS matches
      FROM matches
      WHERE user1_id = $1 OR user2_id = $1
      GROUP BY week
      ORDER BY week DESC
      LIMIT 12
    `;
    return (await pool.query(query, [userId])).rows;
  }

  async getGeneralAnalytics() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM matches) AS total_matches,
        (SELECT COUNT(*) FROM messages) AS total_messages,
        (SELECT COUNT(*) FROM likes) AS total_likes,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_7d
    `;
    return (await pool.query(query)).rows[0];
  }
}

export { StatsService };
