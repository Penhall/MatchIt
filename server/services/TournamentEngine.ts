// server/services/TournamentEngine.ts - Motor principal do sistema de torneios
import { pool } from '../config/database';

export interface TournamentImage {
  id: number;
  category: StyleCategory;
  imageUrl: string;
  thumbnailUrl: string;
  tags: string[];
  active: boolean;
}

export interface TournamentSession {
  id: string;
  userId: string;
  category: StyleCategory;
  status: 'active' | 'completed' | 'abandoned';
  currentRound: number;
  totalRounds: number;
  remainingImages: number[];
  eliminatedImages: number[];
  currentMatchup: [number, number] | null;
  startedAt: Date;
  completedAt?: Date;
}

export interface TournamentResult {
  userId: string;
  category: StyleCategory;
  champion: number;
  finalist: number;
  topChoices: number[];
  eliminationOrder: number[];
  preferenceStrength: number;
  completedAt: Date;
  roundsPlayed: number;
}

export type StyleCategory = 'roupas' | 'calcados' | 'cores' | 'estilos' | 'acessorios';

export class TournamentEngine {
  
  /**
   * Iniciar novo torneio para uma categoria
   */
  async startTournament(userId: string, category: StyleCategory): Promise<TournamentSession> {
    try {
      // 1. Buscar imagens ativas da categoria
      const imagesResult = await pool.query(
        `SELECT id, image_url, thumbnail_url, tags 
         FROM tournament_images 
         WHERE category = $1 AND active = true 
         ORDER BY RANDOM() 
         LIMIT 100`,
        [category]
      );

      if (imagesResult.rows.length < 16) {
        throw new Error(`Categoria ${category} não possui imagens suficientes para torneio`);
      }

      const imageIds = imagesResult.rows.map(row => row.id);
      const totalRounds = Math.ceil(Math.log2(imageIds.length));

      // 2. Criar sessão de torneio
      const sessionId = `tournament_${userId}_${category}_${Date.now()}`;
      
      const sessionResult = await pool.query(
        `INSERT INTO tournament_sessions 
         (id, user_id, category, status, current_round, total_rounds, remaining_images, started_at)
         VALUES ($1, $2, $3, 'active', 1, $4, $5, NOW())
         RETURNING *`,
        [sessionId, userId, category, totalRounds, JSON.stringify(imageIds)]
      );

      // 3. Gerar primeiro matchup
      const firstMatchup = this.generateNextMatchup(imageIds);
      
      await pool.query(
        `UPDATE tournament_sessions 
         SET current_matchup = $1 
         WHERE id = $2`,
        [JSON.stringify(firstMatchup), sessionId]
      );

      return {
        id: sessionId,
        userId,
        category,
        status: 'active',
        currentRound: 1,
        totalRounds,
        remainingImages: imageIds,
        eliminatedImages: [],
        currentMatchup: firstMatchup,
        startedAt: new Date()
      };

    } catch (error) {
      console.error('Erro ao iniciar torneio:', error);
      throw error;
    }
  }

  /**
   * Processar escolha do usuário no matchup atual
   */
  async processChoice(sessionId: string, winnerId: number): Promise<TournamentSession> {
    try {
      // 1. Buscar sessão atual
      const sessionResult = await pool.query(
        'SELECT * FROM tournament_sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão de torneio não encontrada');
      }

      const session = sessionResult.rows[0];
      let remainingImages = JSON.parse(session.remaining_images);
      let eliminatedImages = JSON.parse(session.eliminated_images || '[]');
      const currentMatchup = JSON.parse(session.current_matchup);

      // 2. Validar escolha
      if (!currentMatchup.includes(winnerId)) {
        throw new Error('Escolha inválida para o matchup atual');
      }

      // 3. Registrar escolha no histórico
      const loserId = currentMatchup.find(id => id !== winnerId);
      await pool.query(
        `INSERT INTO tournament_matchups 
         (tournament_session_id, round_number, option_a_id, option_b_id, winner_id, chosen_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [sessionId, session.current_round, currentMatchup[0], currentMatchup[1], winnerId]
      );

      // 4. Atualizar listas
      remainingImages = remainingImages.filter(id => id !== loserId);
      eliminatedImages.unshift(loserId); // Adicionar ao início (ordem de eliminação)

      // 5. Verificar se torneio terminou
      if (remainingImages.length === 1) {
        return await this.completeTournament(sessionId, remainingImages[0], eliminatedImages);
      }

      // 6. Gerar próximo matchup
      const nextMatchup = this.generateNextMatchup(remainingImages);
      const newRound = remainingImages.length <= Math.pow(2, session.current_round - 1) 
        ? session.current_round + 1 
        : session.current_round;

      // 7. Atualizar sessão
      await pool.query(
        `UPDATE tournament_sessions 
         SET remaining_images = $1, 
             eliminated_images = $2, 
             current_matchup = $3,
             current_round = $4
         WHERE id = $5`,
        [
          JSON.stringify(remainingImages),
          JSON.stringify(eliminatedImages),
          JSON.stringify(nextMatchup),
          newRound,
          sessionId
        ]
      );

      return {
        id: sessionId,
        userId: session.user_id,
        category: session.category,
        status: 'active',
        currentRound: newRound,
        totalRounds: session.total_rounds,
        remainingImages,
        eliminatedImages,
        currentMatchup: nextMatchup,
        startedAt: session.started_at
      };

    } catch (error) {
      console.error('Erro ao processar escolha:', error);
      throw error;
    }
  }

  /**
   * Completar torneio e gerar resultado
   */
  private async completeTournament(
    sessionId: string, 
    championId: number, 
    eliminationOrder: number[]
  ): Promise<TournamentSession> {
    try {
      const sessionResult = await pool.query(
        'SELECT * FROM tournament_sessions WHERE id = $1',
        [sessionId]
      );
      
      const session = sessionResult.rows[0];
      const finalistId = eliminationOrder[0]; // Último eliminado = finalista
      const topChoices = [championId, finalistId, ...eliminationOrder.slice(1, 5)];
      
      // Calcular força da preferência baseada na consistência das escolhas
      const preferenceStrength = await this.calculatePreferenceStrength(sessionId);

      // Salvar resultado
      await pool.query(
        `INSERT INTO tournament_results 
         (user_id, category, champion, finalist, top_choices, elimination_order, 
          preference_strength, completed_at, rounds_played)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
        [
          session.user_id,
          session.category,
          championId,
          finalistId,
          JSON.stringify(topChoices),
          JSON.stringify(eliminationOrder.reverse()), // Ordem crescente de eliminação
          preferenceStrength,
          session.current_round
        ]
      );

      // Marcar sessão como completa
      await pool.query(
        `UPDATE tournament_sessions 
         SET status = 'completed', completed_at = NOW() 
         WHERE id = $1`,
        [sessionId]
      );

      // Atualizar perfil de estilo do usuário
      await this.updateUserStyleProfile(session.user_id);

      return {
        id: sessionId,
        userId: session.user_id,
        category: session.category,
        status: 'completed',
        currentRound: session.current_round,
        totalRounds: session.total_rounds,
        remainingImages: [championId],
        eliminatedImages: eliminationOrder,
        currentMatchup: null,
        startedAt: session.started_at,
        completedAt: new Date()
      };

    } catch (error) {
      console.error('Erro ao completar torneio:', error);
      throw error;
    }
  }

  /**
   * Gerar próximo matchup de forma inteligente
   */
  private generateNextMatchup(remainingImages: number[]): [number, number] {
    if (remainingImages.length < 2) {
      throw new Error('Não há imagens suficientes para matchup');
    }

    // Por enquanto, seleção aleatória. Pode ser melhorada com algoritmo mais inteligente
    const shuffled = [...remainingImages].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  /**
   * Calcular força da preferência baseada na consistência
   */
  private async calculatePreferenceStrength(sessionId: string): Promise<number> {
    try {
      const matchupsResult = await pool.query(
        `SELECT response_time, round_number 
         FROM tournament_matchups 
         WHERE tournament_session_id = $1 
         ORDER BY chosen_at`,
        [sessionId]
      );

      if (matchupsResult.rows.length === 0) {
        return 0.5; // Neutro se não houver dados
      }

      // Análise simples: preferências mais rápidas = mais fortes
      const avgResponseTime = matchupsResult.rows.reduce(
        (sum, row) => sum + (row.response_time || 3000), 0
      ) / matchupsResult.rows.length;

      // Normalizar: resposta rápida (< 2s) = forte, lenta (> 10s) = fraca
      const strength = Math.max(0.1, Math.min(1.0, 1 - (avgResponseTime - 2000) / 8000));
      
      return Math.round(strength * 100) / 100;

    } catch (error) {
      console.error('Erro ao calcular força de preferência:', error);
      return 0.5;
    }
  }

  /**
   * Atualizar perfil de estilo do usuário
   */
  private async updateUserStyleProfile(userId: string): Promise<void> {
    try {
      // Buscar todos os resultados de torneio do usuário
      const resultsResult = await pool.query(
        `SELECT category, champion, finalist, top_choices, preference_strength
         FROM tournament_results 
         WHERE user_id = $1`,
        [userId]
      );

      const styleProfile = {};
      
      resultsResult.rows.forEach(result => {
        styleProfile[result.category] = {
          champion: result.champion,
          finalist: result.finalist,
          topChoices: JSON.parse(result.top_choices),
          preferenceStrength: result.preference_strength,
          lastUpdated: new Date().toISOString()
        };
      });

      // Atualizar no perfil do usuário
      await pool.query(
        `UPDATE user_profiles 
         SET style_preferences = $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [JSON.stringify(styleProfile), userId]
      );

    } catch (error) {
      console.error('Erro ao atualizar perfil de estilo:', error);
      throw error;
    }
  }

  /**
   * Buscar sessão ativa do usuário
   */
  async getActiveSession(userId: string, category?: StyleCategory): Promise<TournamentSession | null> {
    try {
      let query = 'SELECT * FROM tournament_sessions WHERE user_id = $1 AND status = $2';
      const params = [userId, 'active'];

      if (category) {
        query += ' AND category = $3';
        params.push(category);
      }

      query += ' ORDER BY started_at DESC LIMIT 1';

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      const session = result.rows[0];
      return {
        id: session.id,
        userId: session.user_id,
        category: session.category,
        status: session.status,
        currentRound: session.current_round,
        totalRounds: session.total_rounds,
        remainingImages: JSON.parse(session.remaining_images),
        eliminatedImages: JSON.parse(session.eliminated_images || '[]'),
        currentMatchup: JSON.parse(session.current_matchup),
        startedAt: session.started_at,
        completedAt: session.completed_at
      };

    } catch (error) {
      console.error('Erro ao buscar sessão ativa:', error);
      throw error;
    }
  }

  /**
   * Buscar imagens para o matchup atual
   */
  async getMatchupImages(imageIds: [number, number]): Promise<TournamentImage[]> {
    try {
      const result = await pool.query(
        `SELECT id, category, image_url, thumbnail_url, tags
         FROM tournament_images 
         WHERE id = ANY($1) AND active = true`,
        [imageIds]
      );

      return result.rows.map(row => ({
        id: row.id,
        category: row.category,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        tags: row.tags || [],
        active: true
      }));

    } catch (error) {
      console.error('Erro ao buscar imagens do matchup:', error);
      throw error;
    }
  }
}