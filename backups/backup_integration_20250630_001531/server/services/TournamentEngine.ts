// server/services/TournamentEngine.ts - Motor principal do sistema de torneios
import { pool } from '../config/database';

export interface TournamentImage {
  id: number;
  category: StyleCategory;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  active: boolean;
  winRate: number;
  totalViews: number;
  totalSelections: number;
}

export interface TournamentSession {
  id: string;
  userId: number;
  category: StyleCategory;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  currentRound: number;
  totalRounds: number;
  remainingImages: number[];
  eliminatedImages: number[];
  currentMatchup: [number, number] | null;
  tournamentSize: number;
  startedAt: Date;
  lastActivity: Date;
  completedAt?: Date;
  progressPercentage: number;
}

export interface TournamentMatchup {
  sessionId: string;
  roundNumber: number;
  imageA: TournamentImage;
  imageB: TournamentImage;
  startTime: Date;
}

export interface TournamentChoice {
  sessionId: string;
  roundNumber: number;
  matchupSequence: number;
  optionAId: number;
  optionBId: number;
  winnerId: number;
  loserId: number;
  responseTimeMs: number;
  confidenceLevel?: number;
  isSpeedBonus: boolean;
}

export interface TournamentResult {
  sessionId: string;
  userId: number;
  category: StyleCategory;
  championId: number;
  finalistId?: number;
  semifinalists: number[];
  topChoices: number[];
  preferenceStrength: number;
  consistencyScore: number;
  decisionSpeedAvg: number;
  totalChoicesMade: number;
  roundsCompleted: number;
  sessionDurationMinutes: number;
  completionRate: number;
  styleProfile: any;
  dominantPreferences: any;
  completedAt: Date;
}

export type StyleCategory = 'cores' | 'estilos' | 'calcados' | 'acessorios' | 'texturas' | 
                           'roupas_casuais' | 'roupas_formais' | 'roupas_festa' | 'joias' | 'bolsas';

export class TournamentEngine {
  
  /**
   * Iniciar novo torneio para uma categoria específica
   */
  async startTournament(userId: number, category: StyleCategory, tournamentSize: number = 32): Promise<TournamentSession> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Verificar se já existe sessão ativa para esta categoria
      const existingSession = await this.getActiveSession(userId, category);
      if (existingSession) {
        throw new Error(`Já existe um torneio ativo para a categoria ${category}`);
      }
      
      // 2. Buscar imagens ativas da categoria
      const imagesResult = await client.query(
        `SELECT id, category, image_url, thumbnail_url, title, description, tags, 
                win_rate, total_views, total_selections
         FROM tournament_images 
         WHERE category = $1 AND active = true AND approved = true
         ORDER BY RANDOM() 
         LIMIT $2`,
        [category, tournamentSize]
      );

      if (imagesResult.rows.length < 4) {
        throw new Error(`Categoria ${category} não possui imagens suficientes para torneio (mínimo: 4, encontrado: ${imagesResult.rows.length})`);
      }

      // 3. Ajustar tamanho do torneio para próxima potência de 2
      const actualSize = this.getNextPowerOfTwo(imagesResult.rows.length);
      const selectedImages = imagesResult.rows.slice(0, actualSize);
      const imageIds = selectedImages.map(row => row.id);
      const totalRounds = Math.ceil(Math.log2(actualSize));

      // 4. Gerar ID único da sessão
      const sessionId = `tournament_${userId}_${category}_${Date.now()}`;
      
      // 5. Criar sessão de torneio
      const sessionResult = await client.query(
        `INSERT INTO tournament_sessions 
         (id, user_id, category, status, current_round, total_rounds, remaining_images, 
          tournament_size, started_at, last_activity)
         VALUES ($1, $2, $3, 'active', 1, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [sessionId, userId, category, totalRounds, JSON.stringify(imageIds), actualSize]
      );

      // 6. Gerar primeiro confronto
      await this.generateNextMatchup(sessionId);

      await client.query('COMMIT');

      // 7. Retornar sessão formatada
      const session = sessionResult.rows[0];
      return this.formatTournamentSession(session);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao iniciar torneio:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obter sessão ativa de torneio para um usuário e categoria
   */
  async getActiveSession(userId: number, category: StyleCategory): Promise<TournamentSession | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM tournament_sessions 
         WHERE user_id = $1 AND category = $2 AND status = 'active'
         ORDER BY last_activity DESC
         LIMIT 1`,
        [userId, category]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatTournamentSession(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar sessão ativa:', error);
      throw new Error('Falha ao buscar sessão ativa');
    }
  }

  /**
   * Gerar próximo confronto do torneio
   */
  async generateNextMatchup(sessionId: string): Promise<TournamentMatchup | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Buscar dados da sessão
      const sessionResult = await client.query(
        `SELECT * FROM tournament_sessions WHERE id = $1 AND status = 'active'`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão de torneio não encontrada ou não está ativa');
      }

      const session = sessionResult.rows[0];
      const remainingImages = session.remaining_images;

      // 2. Verificar se há imagens suficientes para confronto
      if (remainingImages.length < 2) {
        // Torneio finalizado
        await this.finalizeTournament(sessionId);
        await client.query('COMMIT');
        return null;
      }

      if (remainingImages.length === 2) {
        // Final do torneio
        const imageAId = remainingImages[0];
        const imageBId = remainingImages[1];

        // Buscar dados das imagens
        const imagesResult = await client.query(
          `SELECT id, category, image_url, thumbnail_url, title, description, tags,
                  win_rate, total_views, total_selections
           FROM tournament_images 
           WHERE id IN ($1, $2)`,
          [imageAId, imageBId]
        );

        // Atualizar sessão com confronto final
        await client.query(
          `UPDATE tournament_sessions
           SET current_matchup = $2, matchup_start_time = NOW(), last_activity = NOW()
           WHERE id = $1`,
          [sessionId, JSON.stringify([imageAId, imageBId])]
        );

        await client.query('COMMIT');

        // Retornar confronto da final
        const imageA = this.formatTournamentImage(imagesResult.rows.find(img => img.id === imageAId));
        const imageB = this.formatTournamentImage(imagesResult.rows.find(img => img.id === imageBId));

        return {
          sessionId,
          roundNumber: session.current_round,
          imageA,
          imageB,
          startTime: new Date()
        };
      }

      // 3. Gerar confronto normal
      const imageAId = remainingImages[0];
      const imageBId = remainingImages[1];

      // Buscar dados das imagens
      const imagesResult = await client.query(
        `SELECT id, category, image_url, thumbnail_url, title, description, tags,
                win_rate, total_views, total_selections
         FROM tournament_images 
         WHERE id IN ($1, $2)`,
        [imageAId, imageBId]
      );

      // Atualizar sessão com novo confronto
      await client.query(
        `UPDATE tournament_sessions
         SET current_matchup = $2, matchup_start_time = NOW(), last_activity = NOW()
         WHERE id = $1`,
        [sessionId, JSON.stringify([imageAId, imageBId])]
      );

      await client.query('COMMIT');

      // Retornar confronto
      const imageA = this.formatTournamentImage(imagesResult.rows.find(img => img.id === imageAId));
      const imageB = this.formatTournamentImage(imagesResult.rows.find(img => img.id === imageBId));

      return {
        sessionId,
        roundNumber: session.current_round,
        imageA,
        imageB,
        startTime: new Date()
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao gerar confronto:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Processar escolha do usuário no torneio
   */
  async processChoice(sessionId: string, winnerId: number, responseTimeMs: number, confidenceLevel?: number): Promise<TournamentSession> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Buscar sessão atual
      const sessionResult = await client.query(
        `SELECT * FROM tournament_sessions WHERE id = $1 AND status = 'active'`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão de torneio não encontrada ou não está ativa');
      }

      const session = sessionResult.rows[0];
      const currentMatchup = session.current_matchup;

      if (!currentMatchup || currentMatchup.length !== 2) {
        throw new Error('Confronto atual não está configurado corretamente');
      }

      const [imageAId, imageBId] = currentMatchup;
      const loserId = winnerId === imageAId ? imageBId : imageAId;

      // Validar se winnerId é válido
      if (winnerId !== imageAId && winnerId !== imageBId) {
        throw new Error('ID do vencedor não corresponde às opções do confronto atual');
      }

      // 2. Registrar escolha
      const isSpeedBonus = responseTimeMs < 3000; // Menos de 3 segundos
      
      await client.query(
        `INSERT INTO tournament_choices 
         (session_id, round_number, matchup_sequence, option_a_id, option_b_id, 
          winner_id, loser_id, response_time_ms, confidence_level, is_speed_bonus, choice_made_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [sessionId, session.current_round, 1, imageAId, imageBId, winnerId, loserId, 
         responseTimeMs, confidenceLevel, isSpeedBonus]
      );

      // 3. Atualizar arrays de imagens na sessão
      const remainingImages = session.remaining_images.filter((id: number) => id !== loserId);
      const eliminatedImages = [...session.eliminated_images, loserId];

      // 4. Determinar se precisa avançar para próxima rodada
      let nextRound = session.current_round;
      let shouldAdvanceRound = false;

      // Se restam apenas metade das imagens da rodada atual, avança para próxima rodada
      const imagesInCurrentRound = Math.pow(2, session.total_rounds - session.current_round + 1);
      if (remainingImages.length <= imagesInCurrentRound / 2) {
        shouldAdvanceRound = true;
        nextRound = session.current_round + 1;
      }

      // 5. Atualizar sessão
      await client.query(
        `UPDATE tournament_sessions
         SET remaining_images = $2, eliminated_images = $3, current_round = $4,
             current_matchup = NULL, last_activity = NOW()
         WHERE id = $1`,
        [sessionId, JSON.stringify(remainingImages), JSON.stringify(eliminatedImages), nextRound]
      );

      // 6. Verificar se torneio terminou
      if (remainingImages.length === 1) {
        await this.finalizeTournament(sessionId);
      }

      await client.query('COMMIT');

      // 7. Retornar sessão atualizada
      const updatedSessionResult = await pool.query(
        `SELECT * FROM tournament_sessions WHERE id = $1`,
        [sessionId]
      );

      return this.formatTournamentSession(updatedSessionResult.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao processar escolha:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Finalizar torneio e gerar resultado
   */
  async finalizeTournament(sessionId: string): Promise<TournamentResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Buscar dados da sessão
      const sessionResult = await client.query(
        `SELECT * FROM tournament_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão de torneio não encontrada');
      }

      const session = sessionResult.rows[0];

      // 2. Buscar todas as escolhas do torneio
      const choicesResult = await client.query(
        `SELECT * FROM tournament_choices 
         WHERE session_id = $1 
         ORDER BY choice_made_at`,
        [sessionId]
      );

      const choices = choicesResult.rows;

      // 3. Calcular estatísticas
      const stats = this.calculateTournamentStats(session, choices);

      // 4. Gerar perfil de estilo
      const styleProfile = await this.generateStyleProfile(session.user_id, session.category, choices);

      // 5. Determinar rankings
      const championId = session.remaining_images[0]; // O único vencedor
      const finalistId = session.eliminated_images[session.eliminated_images.length - 1]; // Último eliminado
      const semifinalists = session.eliminated_images.slice(-4, -1); // Penúltimos eliminados
      const topChoices = [...session.remaining_images, ...session.eliminated_images.slice().reverse()].slice(0, 8);

      // 6. Criar resultado
      const resultData = {
        sessionId,
        userId: session.user_id,
        category: session.category,
        championId,
        finalistId,
        semifinalists,
        topChoices,
        preferenceStrength: stats.preferenceStrength,
        consistencyScore: stats.consistencyScore,
        decisionSpeedAvg: stats.avgResponseTime,
        totalChoicesMade: choices.length,
        roundsCompleted: session.current_round,
        sessionDurationMinutes: stats.durationMinutes,
        completionRate: 100.0,
        styleProfile,
        dominantPreferences: stats.dominantPreferences
      };

      // 7. Inserir resultado no banco
      await client.query(
        `INSERT INTO tournament_results 
         (session_id, user_id, category, champion_id, finalist_id, semifinalists,
          top_choices, preference_strength, consistency_score, decision_speed_avg,
          total_choices_made, rounds_completed, session_duration_minutes,
          completion_rate, style_profile, dominant_preferences, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
        [sessionId, resultData.userId, resultData.category, resultData.championId,
         resultData.finalistId, JSON.stringify(resultData.semifinalists),
         JSON.stringify(resultData.topChoices), resultData.preferenceStrength,
         resultData.consistencyScore, resultData.decisionSpeedAvg,
         resultData.totalChoicesMade, resultData.roundsCompleted,
         resultData.sessionDurationMinutes, resultData.completionRate,
         JSON.stringify(resultData.styleProfile), JSON.stringify(resultData.dominantPreferences)]
      );

      // 8. Atualizar status da sessão
      await client.query(
        `UPDATE tournament_sessions 
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [sessionId]
      );

      // 9. Atualizar analytics
      await this.updateTournamentAnalytics(session.category, resultData);

      await client.query('COMMIT');

      return {
        ...resultData,
        completedAt: new Date()
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao finalizar torneio:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Buscar resultado de torneio
   */
  async getTournamentResult(sessionId: string): Promise<TournamentResult | null> {
    try {
      const result = await pool.query(
        `SELECT tr.*, ti.title as champion_title, ti.image_url as champion_image_url
         FROM tournament_results tr
         LEFT JOIN tournament_images ti ON tr.champion_id = ti.id
         WHERE tr.session_id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        sessionId: row.session_id,
        userId: row.user_id,
        category: row.category,
        championId: row.champion_id,
        finalistId: row.finalist_id,
        semifinalists: row.semifinalists || [],
        topChoices: row.top_choices || [],
        preferenceStrength: parseFloat(row.preference_strength),
        consistencyScore: parseFloat(row.consistency_score),
        decisionSpeedAvg: row.decision_speed_avg,
        totalChoicesMade: row.total_choices_made,
        roundsCompleted: row.rounds_completed,
        sessionDurationMinutes: row.session_duration_minutes,
        completionRate: parseFloat(row.completion_rate),
        styleProfile: row.style_profile,
        dominantPreferences: row.dominant_preferences,
        completedAt: row.completed_at
      };
    } catch (error) {
      console.error('Erro ao buscar resultado do torneio:', error);
      throw new Error('Falha ao buscar resultado do torneio');
    }
  }

  /**
   * Listar imagens disponíveis para uma categoria
   */
  async getImagesForCategory(category: StyleCategory, limit: number = 50): Promise<TournamentImage[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM tournament_images 
         WHERE category = $1 AND active = true AND approved = true
         ORDER BY win_rate DESC, total_selections DESC
         LIMIT $2`,
        [category, limit]
      );

      return result.rows.map(row => this.formatTournamentImage(row));
    } catch (error) {
      console.error('Erro ao buscar imagens da categoria:', error);
      throw new Error('Falha ao buscar imagens da categoria');
    }
  }

  // Métodos auxiliares privados

  private getNextPowerOfTwo(n: number): number {
    if (n <= 4) return 4;
    if (n <= 8) return 8;
    if (n <= 16) return 16;
    if (n <= 32) return 32;
    if (n <= 64) return 64;
    return 128;
  }

  private formatTournamentSession(sessionRow: any): TournamentSession {
    const progressPercentage = sessionRow.total_rounds > 0 
      ? Math.round(((sessionRow.current_round - 1) / sessionRow.total_rounds) * 100)
      : 0;

    return {
      id: sessionRow.id,
      userId: sessionRow.user_id,
      category: sessionRow.category,
      status: sessionRow.status,
      currentRound: sessionRow.current_round,
      totalRounds: sessionRow.total_rounds,
      remainingImages: sessionRow.remaining_images || [],
      eliminatedImages: sessionRow.eliminated_images || [],
      currentMatchup: sessionRow.current_matchup,
      tournamentSize: sessionRow.tournament_size,
      startedAt: sessionRow.started_at,
      lastActivity: sessionRow.last_activity,
      completedAt: sessionRow.completed_at,
      progressPercentage
    };
  }

  private formatTournamentImage(imageRow: any): TournamentImage {
    return {
      id: imageRow.id,
      category: imageRow.category,
      imageUrl: imageRow.image_url,
      thumbnailUrl: imageRow.thumbnail_url || imageRow.image_url,
      title: imageRow.title || '',
      description: imageRow.description || '',
      tags: imageRow.tags || [],
      active: imageRow.active,
      winRate: parseFloat(imageRow.win_rate) || 0,
      totalViews: imageRow.total_views || 0,
      totalSelections: imageRow.total_selections || 0
    };
  }

  private calculateTournamentStats(session: any, choices: any[]) {
    const totalChoices = choices.length;
    const avgResponseTime = totalChoices > 0 
      ? choices.reduce((sum, choice) => sum + choice.response_time_ms, 0) / totalChoices
      : 0;

    const startTime = new Date(session.started_at);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Calcular força da preferência baseada na velocidade das decisões
    const quickChoices = choices.filter(choice => choice.response_time_ms < 3000).length;
    const preferenceStrength = totalChoices > 0 ? quickChoices / totalChoices : 0;

    // Calcular consistência (simplificado)
    const consistencyScore = 0.8; // Placeholder - implementar lógica real

    // Identificar preferências dominantes
    const winnerFrequency: { [key: number]: number } = {};
    choices.forEach(choice => {
      winnerFrequency[choice.winner_id] = (winnerFrequency[choice.winner_id] || 0) + 1;
    });

    const dominantPreferences = {
      fastDecisions: quickChoices,
      averageConfidence: choices.reduce((sum, c) => sum + (c.confidence_level || 3), 0) / totalChoices,
      mostChosenImages: Object.entries(winnerFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ imageId: parseInt(id), selections: count }))
    };

    return {
      avgResponseTime,
      durationMinutes,
      preferenceStrength,
      consistencyScore,
      dominantPreferences
    };
  }

  private async generateStyleProfile(userId: number, category: StyleCategory, choices: any[]) {
    // Implementar lógica de geração de perfil de estilo
    // baseada nas escolhas do usuário
    return {
      category,
      preferences: {
        speed: choices.filter(c => c.is_speed_bonus).length / choices.length,
        confidence: choices.reduce((sum, c) => sum + (c.confidence_level || 3), 0) / choices.length
      },
      traits: [],
      recommendations: []
    };
  }

  private async updateTournamentAnalytics(category: StyleCategory, result: any) {
    try {
      await pool.query(
        `INSERT INTO tournament_analytics (date, category, total_sessions, completed_sessions, 
                                          average_session_duration_minutes, average_choice_time_ms)
         VALUES (CURRENT_DATE, $1, 1, 1, $2, $3)
         ON CONFLICT (date, category)
         DO UPDATE SET 
           total_sessions = tournament_analytics.total_sessions + 1,
           completed_sessions = tournament_analytics.completed_sessions + 1,
           average_session_duration_minutes = (tournament_analytics.average_session_duration_minutes + $2) / 2,
           average_choice_time_ms = (tournament_analytics.average_choice_time_ms + $3) / 2,
           updated_at = NOW()`,
        [category, result.sessionDurationMinutes, result.decisionSpeedAvg]
      );
    } catch (error) {
      console.error('Erro ao atualizar analytics:', error);
      // Não falhar o torneio por erro de analytics
    }
  }
}

export default new TournamentEngine();