// server/services/tournamentService.js - Service para sistema de torneios
import { query } from '../config/database.js';

class TournamentService {
  
  // Buscar imagens de uma categoria
  async getImagesByCategory(category) {
    try {
      const result = await query(
        'SELECT * FROM tournament_images WHERE category = $1 AND active = true ORDER BY display_order',
        [category]
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      throw error;
    }
  }
  
  // Iniciar novo torneio
  async startTournament(userId, category) {
    try {
      // Verificar se já existe resultado para esta categoria
      const existingResult = await query(
        'SELECT id FROM tournament_results WHERE user_id = $1 AND category = $2',
        [userId, category]
      );
      
      if (existingResult.rows.length > 0) {
        throw new Error('Usuário já completou torneio nesta categoria');
      }
      
      // Buscar imagens da categoria
      const images = await this.getImagesByCategory(category);
      if (images.length < 2) {
        throw new Error('Categoria não tem imagens suficientes para torneio');
      }
      
      // Gerar bracket inicial
      const bracket = this.generateBracket(images);
      const totalRounds = Math.ceil(Math.log2(images.length));
      
      // Criar sessão
      const sessionResult = await query(
        `INSERT INTO tournament_sessions 
         (user_id, category, total_rounds, bracket_data) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userId, category, totalRounds, JSON.stringify(bracket)]
      );
      
      const session = sessionResult.rows[0];
      
      return {
        sessionId: session.id,
        category: session.category,
        currentRound: 1,
        totalRounds: session.total_rounds,
        currentMatches: bracket[0].matches
      };
      
    } catch (error) {
      console.error('Erro ao iniciar torneio:', error);
      throw error;
    }
  }
  
  // Processar escolha no torneio
  async processChoice(sessionId, winnerImageId, loserImageId, choiceTimeMs) {
    try {
      // Buscar sessão
      const sessionResult = await query(
        'SELECT * FROM tournament_sessions WHERE id = $1 AND status = $2',
        [sessionId, 'active']
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão não encontrada ou não está ativa');
      }
      
      const session = sessionResult.rows[0];
      const bracket = JSON.parse(session.bracket_data);
      
      // Registrar escolha
      await query(
        `INSERT INTO tournament_choices 
         (session_id, round_number, winner_image_id, loser_image_id, choice_time_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, session.current_round, winnerImageId, loserImageId, choiceTimeMs]
      );
      
      // Atualizar bracket
      const updatedBracket = this.updateBracket(bracket, session.current_round, winnerImageId);
      
      // Verificar se torneio terminou
      if (this.isTournamentComplete(updatedBracket)) {
        return await this.completeTournament(sessionId, updatedBracket);
      }
      
      // Verificar se precisa avançar para próxima rodada
      let nextRound = session.current_round;
      if (this.isRoundComplete(updatedBracket, session.current_round)) {
        nextRound++;
      }
      
      // Atualizar sessão
      await query(
        `UPDATE tournament_sessions 
         SET bracket_data = $1, current_round = $2, last_activity = NOW()
         WHERE id = $3`,
        [JSON.stringify(updatedBracket), nextRound, sessionId]
      );
      
      return {
        sessionId,
        currentRound: nextRound,
        currentMatches: this.getCurrentMatches(updatedBracket, nextRound),
        isComplete: false
      };
      
    } catch (error) {
      console.error('Erro ao processar escolha:', error);
      throw error;
    }
  }
  
  // Finalizar torneio
  async completeTournament(sessionId, bracket) {
    try {
      // Buscar sessão
      const sessionResult = await query(
        'SELECT * FROM tournament_sessions WHERE id = $1',
        [sessionId]
      );
      
      const session = sessionResult.rows[0];
      
      // Calcular resultado
      const result = this.calculateTournamentResult(bracket);
      
      // Buscar choices para calcular tempo total
      const choicesResult = await query(
        'SELECT SUM(choice_time_ms) as total_time FROM tournament_choices WHERE session_id = $1',
        [sessionId]
      );
      
      const totalTimeMs = choicesResult.rows[0].total_time || 0;
      
      // Salvar resultado
      await query(
        `INSERT INTO tournament_results 
         (user_id, session_id, category, champion_image_id, finalist_image_id, 
          top_choices, elimination_order, preference_strength, rounds_played, total_time_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          session.user_id,
          sessionId,
          session.category,
          result.champion,
          result.finalist,
          result.topChoices,
          result.eliminationOrder,
          result.preferenceStrength,
          session.current_round,
          Math.round(totalTimeMs / 1000)
        ]
      );
      
      // Marcar sessão como completa
      await query(
        'UPDATE tournament_sessions SET status = $1, completed_at = NOW() WHERE id = $2',
        ['completed', sessionId]
      );
      
      return {
        sessionId,
        isComplete: true,
        result: {
          champion: result.champion,
          finalist: result.finalist,
          topChoices: result.topChoices,
          preferenceStrength: result.preferenceStrength
        }
      };
      
    } catch (error) {
      console.error('Erro ao completar torneio:', error);
      throw error;
    }
  }
  
  // Buscar resultados do usuário
  async getUserResults(userId) {
    try {
      const result = await query(
        `SELECT tr.*, ti.image_url as champion_image_url, ti.image_name as champion_image_name
         FROM tournament_results tr
         LEFT JOIN tournament_images ti ON tr.champion_image_id = ti.id
         WHERE tr.user_id = $1
         ORDER BY tr.completed_at DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      throw error;
    }
  }
  
  // Métodos auxiliares
  generateBracket(images) {
    // Implementação simplificada para MVP
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const matches = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        matches.push({
          id: `match_${i/2}`,
          image1: shuffled[i],
          image2: shuffled[i + 1]
        });
      }
    }
    
    return [{
      round: 1,
      matches,
      winners: []
    }];
  }
  
  updateBracket(bracket, currentRound, winnerId) {
    // Implementação simplificada
    const currentBracket = bracket[currentRound - 1];
    if (!currentBracket.winners.includes(winnerId)) {
      currentBracket.winners.push(winnerId);
    }
    return bracket;
  }
  
  isRoundComplete(bracket, round) {
    const currentBracket = bracket[round - 1];
    return currentBracket.winners.length === currentBracket.matches.length;
  }
  
  isTournamentComplete(bracket) {
    const lastRound = bracket[bracket.length - 1];
    return lastRound.winners.length === 1;
  }
  
  getCurrentMatches(bracket, round) {
    return bracket[round - 1]?.matches || [];
  }
  
  calculateTournamentResult(bracket) {
    // Implementação simplificada para MVP
    const allWinners = bracket.flatMap(b => b.winners);
    const champion = allWinners[allWinners.length - 1];
    const finalist = allWinners[allWinners.length - 2] || null;
    
    return {
      champion,
      finalist,
      topChoices: allWinners.slice(-5),
      eliminationOrder: allWinners.reverse(),
      preferenceStrength: 0.8 // Valor fixo para MVP
    };
  }
}

export default new TournamentService();
