// utils/recommendationUtils.ts
// Utilitários para Sistema de Recomendação MatchIt

import { Pool, PoolClient } from 'pg';
import { 
  CompatibilityDimensions, 
  RecommendationAlgorithm,
  FeedbackAction,
  RecommendationFilters,
  MatchScore
} from '../types/recommendation';

/**
 * Utilitários para queries PostgreSQL
 */
export class PostgreSQLUtils {
  /**
   * Executa query com tratamento de erro padronizado
   */
  static async executeQuery<T = any>(
    pool: Pool, 
    query: string, 
    params: any[] = []
  ): Promise<{ rows: T[]; rowCount: number }> {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0
      };
    } catch (error) {
      console.error('PostgreSQL Error:', error);
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Executa transação com rollback automático em caso de erro
   */
  static async executeTransaction<T>(
    pool: Pool,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction Error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Constrói WHERE clause dinamicamente baseado em filtros
   */
  static buildFilterWhereClause(
    filters: RecommendationFilters,
    startParamIndex: number = 1
  ): { whereClause: string; params: any[]; paramIndex: number } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = startParamIndex;

    if (filters.ageRange) {
      conditions.push(`age BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(filters.ageRange[0], filters.ageRange[1]);
      paramIndex += 2;
    }

    if (filters.genders && filters.genders.length > 0) {
      conditions.push(`gender = ANY($${paramIndex})`);
      params.push(filters.genders);
      paramIndex++;
    }

    if (filters.maxDistance) {
      conditions.push(`
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(latitude)) * 
         cos(radians(longitude) - radians($${paramIndex + 1})) + 
         sin(radians($${paramIndex})) * sin(radians(latitude)))) <= $${paramIndex + 2}
      `);
      // Note: precisará das coordenadas do usuário atual
      paramIndex += 3;
    }

    if (filters.minProfileCompleteness) {
      conditions.push(`profile_completeness >= $${paramIndex}`);
      params.push(filters.minProfileCompleteness);
      paramIndex++;
    }

    if (filters.hasPhotos) {
      conditions.push(`photo_count > 0`);
    }

    if (filters.verifiedOnly) {
      conditions.push(`is_verified = true`);
    }

    if (filters.vipOnly) {
      conditions.push(`is_vip = true`);
    }

    if (filters.activeWithinDays) {
      conditions.push(`last_active >= NOW() - INTERVAL '${filters.activeWithinDays} days'`);
    }

    if (filters.excludeUserIds && filters.excludeUserIds.length > 0) {
      conditions.push(`id != ALL($${paramIndex})`);
      params.push(filters.excludeUserIds);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { whereClause, params, paramIndex };
  }
}

/**
 * Validadores para dados de recomendação
 */
export class RecommendationValidators {
  /**
   * Valida algoritmo de recomendação
   */
  static isValidAlgorithm(algorithm: string): algorithm is RecommendationAlgorithm {
    return ['hybrid', 'collaborative', 'content', 'social', 'temporal'].includes(algorithm);
  }

  /**
   * Valida ação de feedback
   */
  static isValidFeedbackAction(action: string): action is FeedbackAction {
    return ['like', 'dislike', 'super_like', 'skip', 'report', 'block'].includes(action);
  }

  /**
   * Valida dimensões de compatibilidade
   */
  static validateCompatibilityDimensions(dimensions: any): dimensions is CompatibilityDimensions {
    const requiredKeys = ['style', 'emotional', 'hobby', 'location', 'personality', 'lifestyle', 'values', 'communication'];
    
    if (!dimensions || typeof dimensions !== 'object') return false;
    
    return requiredKeys.every(key => {
      const value = dimensions[key];
      return typeof value === 'number' && value >= 0 && value <= 1;
    });
  }

  /**
   * Valida UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valida score (0-1)
   */
  static isValidScore(score: number): boolean {
    return typeof score === 'number' && score >= 0 && score <= 1 && !isNaN(score);
  }

  /**
   * Valida filtros de recomendação
   */
  static validateRecommendationFilters(filters: any): string[] {
    const errors: string[] = [];

    if (filters.ageRange) {
      if (!Array.isArray(filters.ageRange) || filters.ageRange.length !== 2) {
        errors.push('ageRange must be an array with exactly 2 elements');
      } else if (filters.ageRange[0] >= filters.ageRange[1]) {
        errors.push('ageRange[0] must be less than ageRange[1]');
      } else if (filters.ageRange[0] < 18 || filters.ageRange[1] > 100) {
        errors.push('ageRange must be between 18 and 100');
      }
    }

    if (filters.maxDistance && (typeof filters.maxDistance !== 'number' || filters.maxDistance <= 0)) {
      errors.push('maxDistance must be a positive number');
    }

    if (filters.minProfileCompleteness && !this.isValidScore(filters.minProfileCompleteness)) {
      errors.push('minProfileCompleteness must be between 0 and 1');
    }

    if (filters.excludeUserIds && !Array.isArray(filters.excludeUserIds)) {
      errors.push('excludeUserIds must be an array');
    }

    return errors;
  }
}

/**
 * Formatadores para respostas da API
 */
export class RecommendationFormatters {
  /**
   * Formata score para exibição (0-100%)
   */
  static formatScoreAsPercentage(score: number): number {
    return Math.round(score * 100);
  }

  /**
   * Formata tempo de processamento
   */
  static formatProcessingTime(timeMs: number): string {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(2)}s`;
  }

  /**
   * Formata match score para resposta da API
   */
  static formatMatchScoreForAPI(score: MatchScore): any {
    return {
      userId: score.targetUserId,
      compatibilityScore: this.formatScoreAsPercentage(score.overallScore),
      breakdown: {
        style: this.formatScoreAsPercentage(score.dimensionScores.style),
        emotional: this.formatScoreAsPercentage(score.dimensionScores.emotional),
        hobby: this.formatScoreAsPercentage(score.dimensionScores.hobby),
        location: this.formatScoreAsPercentage(score.dimensionScores.location),
        personality: this.formatScoreAsPercentage(score.dimensionScores.personality)
      },
      confidence: this.formatScoreAsPercentage(score.confidence),
      explanation: score.explanation.summary,
      calculatedAt: score.calculatedAt.toISOString()
    };
  }

  /**
   * Formata erro para resposta da API
   */
  static formatErrorResponse(error: Error, requestId?: string): any {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        requestId: requestId || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Formata resposta de sucesso
   */
  static formatSuccessResponse(data: any, meta: any = {}): any {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }
}

/**
 * Cache simples em memória para desenvolvimento
 */
export class SimpleMemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutos

  /**
   * Armazena item no cache
   */
  set(key: string, data: any, ttlMs?: number): void {
    const expires = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  /**
   * Recupera item do cache
   */
  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Remove item do cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa cache expirado
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expires) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired
    };
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Rate limiter simples
 */
export class SimpleRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Verifica se requisição é permitida
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Limpar requisições antigas
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Verificar limite
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Adicionar nova requisição
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  /**
   * Retorna informações sobre limite
   */
  getRateLimitInfo(identifier: string): { remaining: number; resetTime: Date } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    return {
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
      resetTime: new Date(now + this.windowMs)
    };
  }
}

/**
 * Instância global do cache para uso em desenvolvimento
 */
export const recommendationCache = new SimpleMemoryCache();

/**
 * Instância global do rate limiter
 */
export const recommendationRateLimiter = new SimpleRateLimiter();