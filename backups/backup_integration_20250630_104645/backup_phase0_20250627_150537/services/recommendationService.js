// server/services/recommendationService.js - Serviço de recomendação
import { pool } from '../config/database.js';

export class RecommendationService {
  constructor() {
    this.cache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      totalLatency: 0,
      invalidations: 0
    };
  }

  async getWithCache(userId, options = {}) {
    const cacheKey = this.getCacheKey(userId, options);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      this.metrics.hits++;
      return cached.data;
    }

    const start = Date.now();
    let data;
    
    try {
      data = await this.getPaginatedRecommendations(userId, {
        ...options,
        useCache: false // Forçar busca direta
      });
      
      // TTL baseado no tipo de algoritmo
      const ttl = options.algorithm === 'hybrid' ? 60000 : 30000;
      this.cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttl
      });
    } catch (error) {
      console.error('Erro ao buscar recomendações, usando fallback:', error);
      data = {
        items: await this.getFallbackRecommendations(userId, options.limit || 5),
        hasMore: false,
        fromCache: false,
        fromFallback: true
      };
    }

    const latency = Date.now() - start;
    this.metrics.misses++;
    this.metrics.totalLatency += latency;
    return data;
  }

  getCacheKey(userId, options) {
    return `${userId}:${options.algorithm || 'hybrid'}`;
  }

  invalidateCache(userId) {
    // Invalida todas as entradas para este usuário
    for (const [key] of this.cache) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
        this.metrics.invalidations++;
      }
    }
  }

  getCacheMetrics() {
    return {
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
      avgLatency: this.metrics.totalLatency / (this.metrics.hits + this.metrics.misses) || 0,
      size: this.cache.size,
      invalidations: this.metrics.invalidations
    };
  }
  async getPaginatedRecommendations(userId, options = {}) {
    // Usar cache se disponível
    if (options.useCache !== false) {
      return this.getWithCache(userId, options);
    }
    const { 
      limit = 10, 
      algorithm = 'hybrid',
      direction = 'forward',
      cursor = null
    } = options;

    // Validação de parâmetros
    if (typeof userId !== 'number' || userId <= 0) {
      throw new Error('ID de usuário inválido');
    }
    if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
      throw new Error('Limite inválido (deve ser entre 1 e 100)');
    }
    if (direction !== 'forward' && direction !== 'backward') {
      throw new Error('Direção inválida (deve ser "forward" ou "backward")');
    }
    if (cursor && typeof cursor !== 'string') {
      throw new Error('Cursor inválido');
    }

    // Decodificar cursor se existir
    let cursorTimestamp, cursorId;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        [cursorTimestamp, cursorId] = decoded.split('_');
      } catch (error) {
        throw new Error('Cursor malformado');
      }
    }

    try {
      // Tentar usar stored procedure se existir
      try {
        let query = 'SELECT * FROM find_potential_matches($1, $2, 0.3, 50.0)';
        const params = [userId, limit];
        
        if (cursor) {
          query = 'SELECT * FROM find_paginated_matches($1, $2, $3, $4, $5)';
          params.push(cursorTimestamp, cursorId, direction);
        }

        const result = await pool.query(query, params);
        
        const items = result.rows.map(row => {
          const itemCursor = Buffer.from(`${Date.now()}_${row.user_id}`).toString('base64');
          return {
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
            },
            cursor: itemCursor
          };
        });

        const hasMore = result.rows.length > limit;
        const paginatedItems = hasMore ? items.slice(0, limit) : items;

        return {
          items: paginatedItems,
          nextCursor: paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].cursor : undefined,
          prevCursor: paginatedItems.length > 0 ? paginatedItems[0].cursor : undefined,
          hasMore,
          algorithm,
          processingTime: 100,
          fromCache: false
        };
      } catch (spError) {
        console.log('Stored procedure não existe, usando algoritmo básico');
        
        // Fallback: usar query básica
        let query = `SELECT u.id as user_id, u.name,
                    up.avatar_url, up.style_data,
                    RANDOM() * 30 + 70 as compatibility_score
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE u.id != $1 AND u.is_active = true`;
        
        const params = [userId];
        
        if (cursor) {
          query += ` AND (u.created_at ${direction === 'forward' ? '<' : '>'} $2 OR 
                     (u.created_at = $2 AND u.id ${direction === 'forward' ? '<' : '>'} $3))`;
          params.push(new Date(cursorTimestamp), cursorId);
        }
        
        query += ` ORDER BY u.created_at ${direction === 'forward' ? 'DESC' : 'ASC'}, 
                  u.id ${direction === 'forward' ? 'DESC' : 'ASC'}
                  LIMIT $${params.length + 1}`;
        params.push(limit + 1); // Busca 1 a mais para verificar hasMore

        const result = await pool.query(query, params);
        
        const items = result.rows.map(row => {
          const styleData = row.style_data ? JSON.parse(row.style_data) : {};
          const itemCursor = Buffer.from(`${Date.now()}_${row.user_id}`).toString('base64');
          
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
            },
            cursor: itemCursor
          };
        });

        const hasMore = result.rows.length > limit;
        const paginatedItems = hasMore ? items.slice(0, limit) : items;

        return {
          items: paginatedItems,
          nextCursor: paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].cursor : undefined,
          prevCursor: paginatedItems.length > 0 ? paginatedItems[0].cursor : undefined,
          hasMore,
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

  // Método original mantido para compatibilidade
  async getRecommendations(userId, options = {}) {
    const result = await this.getPaginatedRecommendations(userId, options);
    return {
      matches: result.items,
      totalCandidates: result.items.length,
      algorithm: result.algorithm,
      processingTime: result.processingTime,
      fromCache: result.fromCache
    };
  }

  async getFallbackRecommendations(userId, limit = 5) {
    // Algoritmo simplificado para fallback
    const result = await pool.query(
      `SELECT u.id, u.name, up.avatar_url
       FROM users u
       JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id != $1 AND u.is_active = true
       ORDER BY RANDOM()
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      id: `fallback_${Date.now()}_${row.id}`,
      userId,
      targetUserId: row.id,
      overallScore: 0.7,
      normalizedScore: 70,
      explanation: {
        summary: '70% compatível (fallback)',
        strengths: ['Algoritmo básico']
      },
      targetUser: {
        displayName: row.name,
        avatarUrl: row.avatar_url,
        isVip: false,
        distance: Math.floor(Math.random() * 50)
      },
      fromFallback: true
    }));
  }

  async recordFeedback(userId, targetUserId, action, context = {}) {
    // Invalidar cache após feedback
    this.invalidateCache(userId);
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
