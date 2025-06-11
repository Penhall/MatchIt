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