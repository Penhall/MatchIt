// services/RecommendationService.ts
import RecommendationEngine from './RecommendationEngine';
import { UserProfile, MatchScore, RecommendationResult } from '../types/recommendation';

export class RecommendationService {
  private engine: RecommendationEngine;
  private cache: Map<string, { data: RecommendationResult; timestamp: number }>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutos

  constructor() {
    this.engine = new RecommendationEngine();
    this.cache = new Map();
  }

  // Método principal para obter recomendações
  async getRecommendationsForUser(
    userId: string,
    options: {
      limit?: number;
      algorithm?: 'hybrid' | 'collaborative' | 'content';
      forceRefresh?: boolean;
    } = {}
  ): Promise<RecommendationResult> {
    const cacheKey = `${userId}_${JSON.stringify(options)}`;
    
    // Verificar cache
    if (!options.forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      // Buscar perfil do usuário
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Buscar candidatos potenciais
      const candidates = await this.getPotentialCandidates(userProfile);
      
      // Gerar recomendações
      const recommendations = await this.engine.generateRecommendations(
        userProfile,
        candidates,
        options
      );

      // Salvar no cache
      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now()
      });

      // Registrar analytics
      await this.logRecommendationEvent(userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      throw error;
    }
  }

  // Método para feedback de usuário (like/dislike)
  async recordUserFeedback(
    userId: string,
    targetUserId: string,
    action: 'like' | 'dislike' | 'super_like' | 'skip',
    context?: any
  ): Promise<void> {
    try {
      // Salvar feedback no banco
      await this.saveFeedback({
        user_id: userId,
        target_user_id: targetUserId,
        action,
        context,
        timestamp: new Date()
      });

      // Invalidar cache para melhorar futuras recomendações
      this.invalidateUserCache(userId);

      // Atualizar modelo de ML (se implementado)
      await this.updateUserPreferences(userId, targetUserId, action);

    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      throw error;
    }
  }

  // Método para atualizar preferências baseado no comportamento
  private async updateUserPreferences(
    userId: string,
    targetUserId: string,
    action: string
  ): Promise<void> {
    if (action === 'like' || action === 'super_like') {
      // Analisar características do usuário "curtido"
      const targetProfile = await this.getUserProfile(targetUserId);
      const userProfile = await this.getUserProfile(userId);
      
      if (targetProfile && userProfile) {
        // Ajustar pesos do algoritmo baseado no feedback positivo
        await this.adjustUserWeights(userId, userProfile, targetProfile, 'positive');
      }
    } else if (action === 'dislike') {
      const targetProfile = await this.getUserProfile(targetUserId);
      const userProfile = await this.getUserProfile(userId);
      
      if (targetProfile && userProfile) {
        // Ajustar pesos baseado no feedback negativo
        await this.adjustUserWeights(userId, userProfile, targetProfile, 'negative');
      }
    }
  }

  // Buscar perfil completo do usuário
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Query para buscar dados completos do usuário
      const query = `
        SELECT 
          u.id,
          u.age,
          u.gender,
          u.latitude,
          u.longitude,
          u.city,
          u.vip_status,
          u.age_min,
          u.age_max,
          u.max_distance,
          u.gender_preferences,
          sa.tenis_choices,
          sa.roupas_choices,
          sa.cores_choices,
          sa.hobbies_choices,
          sa.sentimentos_choices,
          up.personality_vector,
          up.activity_level,
          up.emotional_profile
        FROM users u
        LEFT JOIN style_adjustments sa ON u.id = sa.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1 AND u.active = true
      `;
      
      // Simular resultado do banco (em produção, usar client PostgreSQL)
      const result = await this.executeQuery(query, [userId]);
      
      if (!result.rows.length) return null;
      
      const row = result.rows[0];
      
      return {
        id: row.id,
        age: row.age,
        gender: row.gender,
        location: {
          lat: row.latitude,
          lng: row.longitude,
          city: row.city
        },
        stylePreferences: {
          tenis: row.tenis_choices || [],
          roupas: row.roupas_choices || [],
          cores: row.cores_choices || [],
          hobbies: row.hobbies_choices || [],
          sentimentos: row.sentimentos_choices || []
        },
        personalityVector: row.personality_vector || [],
        activityLevel: row.activity_level || 5,
        emotionalProfile: row.emotional_profile || [],
        vipStatus: row.vip_status || false,
        preferences: {
          ageRange: [row.age_min || 18, row.age_max || 65],
          maxDistance: row.max_distance || 50,
          genderPreference: row.gender_preferences || []
        }
      };
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  }

  // Buscar candidatos potenciais (com filtros de performance)
  private async getPotentialCandidates(userProfile: UserProfile): Promise<UserProfile[]> {
    try {
      const query = `
        SELECT 
          u.id,
          u.age,
          u.gender,
          u.latitude,
          u.longitude,
          u.city,
          u.vip_status,
          u.age_min,
          u.age_max,
          u.max_distance,
          u.gender_preferences,
          sa.tenis_choices,
          sa.roupas_choices,
          sa.cores_choices,
          sa.hobbies_choices,
          sa.sentimentos_choices,
          up.personality_vector,
          up.activity_level,
          up.emotional_profile,
          -- Calcular distância aproximada para filtrar
          (6371 * acos(cos(radians($2)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians($3)) + sin(radians($2)) * 
           sin(radians(latitude)))) as distance
        FROM users u
        LEFT JOIN style_adjustments sa ON u.id = sa.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id != $1 
          AND u.active = true
          AND u.age BETWEEN $4 AND $5
          AND (
            ARRAY_LENGTH($6::text[], 1) IS NULL OR 
            u.gender = ANY($6::text[])
          )
          -- Filtro de distância aproximado para performance
          AND (6371 * acos(cos(radians($2)) * cos(radians(latitude)) * 
               cos(radians(longitude) - radians($3)) + sin(radians($2)) * 
               sin(radians(latitude)))) <= $7
          -- Evitar usuários já interagidos recentemente
          AND NOT EXISTS (
            SELECT 1 FROM user_interactions ui 
            WHERE ui.user_id = $1 AND ui.target_user_id = u.id 
            AND ui.created_at > NOW() - INTERVAL '24 hours'
          )
        ORDER BY distance
        LIMIT 200  -- Limitar para performance
      `;

      const result = await this.executeQuery(query, [
        userProfile.id,
        userProfile.location.lat,
        userProfile.location.lng,
        userProfile.preferences.ageRange[0],
        userProfile.preferences.ageRange[1],
        userProfile.preferences.genderPreference,
        userProfile.preferences.maxDistance
      ]);

      return result.rows.map(row => ({
        id: row.id,
        age: row.age,
        gender: row.gender,
        location: {
          lat: row.latitude,
          lng: row.longitude,
          city: row.city
        },
        stylePreferences: {
          tenis: row.tenis_choices || [],
          roupas: row.roupas_choices || [],
          cores: row.cores_choices || [],
          hobbies: row.hobbies_choices || [],
          sentimentos: row.sentimentos_choices || []
        },
        personalityVector: row.personality_vector || [],
        activityLevel: row.activity_level || 5,
        emotionalProfile: row.emotional_profile || [],
        vipStatus: row.vip_status || false,
        preferences: {
          ageRange: [row.age_min || 18, row.age_max || 65],
          maxDistance: row.max_distance || 50,
          genderPreference: row.gender_preferences || []
        }
      }));
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      return [];
    }
  }

  // Método para salvar feedback do usuário
  private async saveFeedback(feedback: {
    user_id: string;
    target_user_id: string;
    action: string;
    context?: any;
    timestamp: Date;
  }): Promise<void> {
    const query = `
      INSERT INTO user_interactions (
        user_id, target_user_id, action, context, created_at
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, target_user_id) 
      DO UPDATE SET 
        action = $3,
        context = $4,
        created_at = $5
    `;

    await this.executeQuery(query, [
      feedback.user_id,
      feedback.target_user_id,
      feedback.action,
      JSON.stringify(feedback.context),
      feedback.timestamp
    ]);
  }

  // Ajustar pesos do algoritmo baseado no feedback
  private async adjustUserWeights(
    userId: string,
    userProfile: UserProfile,
    targetProfile: UserProfile,
    feedbackType: 'positive' | 'negative'
  ): Promise<void> {
    // Calcular quais características foram mais importantes no match
    const styleMatch = this.calculateStyleSimilarity(userProfile, targetProfile);
    const hobbyMatch = this.calculateHobbySimilarity(userProfile, targetProfile);
    const emotionalMatch = this.calculateEmotionalSimilarity(userProfile, targetProfile);

    // Ajustar pesos pessoais do usuário
    const adjustment = feedbackType === 'positive' ? 0.05 : -0.02;
    
    const newWeights = {
      style_weight: Math.max(0.1, Math.min(0.5, styleMatch + adjustment)),
      hobby_weight: Math.max(0.1, Math.min(0.5, hobbyMatch + adjustment)),
      emotional_weight: Math.max(0.1, Math.min(0.5, emotionalMatch + adjustment))
    };

    const query = `
      INSERT INTO user_algorithm_weights (user_id, style_weight, hobby_weight, emotional_weight)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        style_weight = $2,
        hobby_weight = $3,
        emotional_weight = $4,
        updated_at = NOW()
    `;

    await this.executeQuery(query, [
      userId,
      newWeights.style_weight,
      newWeights.hobby_weight,
      newWeights.emotional_weight
    ]);
  }

  // Utilitários de cache
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < this.CACHE_TTL;
  }

  private invalidateUserCache(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(userId)) {
        this.cache.delete(key);
      }
    }
  }

  // Logging para analytics
  private async logRecommendationEvent(
    userId: string,
    recommendations: RecommendationResult
  ): Promise<void> {
    const event = {
      user_id: userId,
      event_type: 'recommendations_generated',
      algorithm: recommendations.algorithm,
      candidates_count: recommendations.totalCandidates,
      matches_count: recommendations.matches.length,
      execution_time: recommendations.executionTime,
      timestamp: new Date()
    };

    const query = `
      INSERT INTO analytics_events (
        user_id, event_type, data, created_at
      ) VALUES ($1, $2, $3, $4)
    `;

    await this.executeQuery(query, [
      event.user_id,
      event.event_type,
      JSON.stringify(event),
      event.timestamp
    ]);
  }

  // Métodos utilitários para cálculos
  private calculateStyleSimilarity(user: UserProfile, target: UserProfile): number {
    // Implementação simplificada
    const categories = ['tenis', 'roupas', 'cores'] as const;
    let totalScore = 0;

    for (const category of categories) {
      const userChoices = user.stylePreferences[category];
      const targetChoices = target.stylePreferences[category];
      
      const intersection = userChoices.filter(choice => targetChoices.includes(choice));
      const union = [...new Set([...userChoices, ...targetChoices])];
      
      if (union.length > 0) {
        totalScore += intersection.length / union.length;
      }
    }

    return totalScore / categories.length;
  }

  private calculateHobbySimilarity(user: UserProfile, target: UserProfile): number {
    const userHobbies = user.stylePreferences.hobbies;
    const targetHobbies = target.stylePreferences.hobbies;
    
    const intersection = userHobbies.filter(hobby => targetHobbies.includes(hobby));
    const union = [...new Set([...userHobbies, ...targetHobbies])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private calculateEmotionalSimilarity(user: UserProfile, target: UserProfile): number {
    // Calcular similaridade cosseno dos vetores emocionais
    const a = user.emotionalProfile;
    const b = target.emotionalProfile;
    
    if (a.length !== b.length || a.length === 0) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Mock para execução de query (substituir por client real do PostgreSQL)
  private async executeQuery(query: string, params: any[]): Promise<any> {
    // Em produção, usar pg client
    console.log('Executing query:', query, 'with params:', params);
    
    // Retorno mock para desenvolvimento
    return {
      rows: [],
      rowCount: 0
    };
  }
}

export default RecommendationService;