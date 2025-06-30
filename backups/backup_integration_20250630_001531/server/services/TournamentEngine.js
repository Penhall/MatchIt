// server/services/TournamentEngine.js - Motor completo do sistema de torneios 2x2
import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// CONSTANTS AND CONFIGURATIONS
// =====================================================

const TOURNAMENT_SIZES = [8, 16, 32, 64];
const MIN_IMAGES_PER_CATEGORY = 8;
const SESSION_EXPIRY_HOURS = 24;
const MAX_ACTIVE_SESSIONS_PER_USER = 3;

const TOURNAMENT_CATEGORIES = {
  'cores': { name: 'cores', displayName: 'Cores', color: '#FF6B6B', icon: 'color-palette' },
  'estilos': { name: 'estilos', displayName: 'Estilos', color: '#4ECDC4', icon: 'shirt' },
  'calcados': { name: 'calcados', displayName: 'Calçados', color: '#45B7D1', icon: 'footsteps' },
  'acessorios': { name: 'acessorios', displayName: 'Acessórios', color: '#96CEB4', icon: 'diamond' },
  'texturas': { name: 'texturas', displayName: 'Texturas', color: '#FECA57', icon: 'layers' },
  'roupas_casuais': { name: 'roupas_casuais', displayName: 'Roupas Casuais', color: '#FF9FF3', icon: 'cafe' },
  'roupas_formais': { name: 'roupas_formais', displayName: 'Roupas Formais', color: '#54A0FF', icon: 'business' },
  'roupas_festa': { name: 'roupas_festa', displayName: 'Roupas de Festa', color: '#5F27CD', icon: 'sparkles' },
  'joias': { name: 'joias', displayName: 'Joias', color: '#FFD700', icon: 'diamond-outline' },
  'bolsas': { name: 'bolsas', displayName: 'Bolsas', color: '#FF6348', icon: 'bag' }
};

// =====================================================
// TOURNAMENT ENGINE CLASS
// =====================================================

export class TournamentEngine {
  constructor() {
    this.sessions = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  // =====================================================
  // CATEGORY MANAGEMENT
  // =====================================================

  /**
   * Obter categorias disponíveis com estatísticas
   */
  async getCategories() {
    try {
      const categoriesQuery = `
        SELECT 
          category,
          COUNT(*) as total_images,
          COUNT(CASE WHEN approved = true AND active = true THEN 1 END) as approved_images,
          AVG(CASE WHEN approved = true THEN win_rate ELSE NULL END) as avg_win_rate,
          COUNT(CASE WHEN upload_date > NOW() - INTERVAL '7 days' THEN 1 END) as recent_uploads
        FROM tournament_images 
        GROUP BY category
        ORDER BY category
      `;
      
      const result = await pool.query(categoriesQuery);
      
      return result.rows.map(row => ({
        ...TOURNAMENT_CATEGORIES[row.category],
        imageCount: parseInt(row.total_images),
        approvedCount: parseInt(row.approved_images),
        avgWinRate: parseFloat(row.avg_win_rate) || 0,
        recentUploads: parseInt(row.recent_uploads),
        available: parseInt(row.approved_images) >= MIN_IMAGES_PER_CATEGORY
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      throw new Error('Erro ao buscar categorias de torneio');
    }
  }

  /**
   * Verificar se categoria tem imagens suficientes
   */
  async validateCategory(category) {
    const query = `
      SELECT COUNT(*) as count 
      FROM tournament_images 
      WHERE category = $1 AND approved = true AND active = true
    `;
    
    const result = await pool.query(query, [category]);
    const count = parseInt(result.rows[0].count);
    
    if (count < MIN_IMAGES_PER_CATEGORY) {
      throw new Error(`Categoria ${category} não tem imagens suficientes. Mínimo: ${MIN_IMAGES_PER_CATEGORY}, atual: ${count}`);
    }
    
    return count;
  }

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  /**
   * Iniciar novo torneio ou retomar existente
   */
  async startTournament(userId, category, tournamentSize = 16) {
    try {
      // Validar categoria
      await this.validateCategory(category);
      
      // Verificar se há sessão ativa
      const existingSession = await this.getActiveSession(userId, category);
      if (existingSession) {
        return {
          session: existingSession,
          matchup: await this.getCurrentMatchup(existingSession.id),
          resumed: true
        };
      }

      // Verificar limite de sessões ativas
      const activeSessions = await this.getUserActiveSessions(userId);
      if (activeSessions.length >= MAX_ACTIVE_SESSIONS_PER_USER) {
        throw new Error(`Máximo de ${MAX_ACTIVE_SESSIONS_PER_USER} torneios ativos por usuário`);
      }

      // Validar tamanho do torneio
      if (!TOURNAMENT_SIZES.includes(tournamentSize)) {
        tournamentSize = 16; // Default fallback
      }

      // Buscar imagens aleatórias para o torneio
      const images = await this.getRandomImages(category, tournamentSize);
      if (images.length < tournamentSize) {
        throw new Error(`Não há imagens suficientes na categoria ${category}`);
      }

      // Criar nova sessão
      const sessionId = `tournament_${userId}_${category}_${Date.now()}`;
      const session = await this.createSession(sessionId, userId, category, images, tournamentSize);
      
      // Gerar primeiro confronto
      const matchup = await this.generateNextMatchup(sessionId);
      
      return {
        session,
        matchup,
        resumed: false
      };

    } catch (error) {
      console.error('❌ Erro ao iniciar torneio:', error);
      throw error;
    }
  }

  /**
   * Criar nova sessão de torneio
   */
  async createSession(sessionId, userId, category, images, tournamentSize) {
    const totalRounds = Math.log2(tournamentSize);
    const imageIds = images.map(img => img.id);
    
    const insertQuery = `
      INSERT INTO tournament_sessions (
        id, user_id, category, status, current_round, total_rounds,
        remaining_images, tournament_size, started_at, last_activity
      ) VALUES ($1, $2, $3, 'active', 1, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      sessionId, userId, category, totalRounds, imageIds, tournamentSize
    ]);
    
    const session = result.rows[0];
    
    // Calcular estatísticas iniciais
    const totalChoices = tournamentSize - 1; // Eliminações necessárias
    
    return {
      ...session,
      progressPercentage: 0,
      choicesMade: 0,
      totalChoices,
      images // Incluir imagens para referência
    };
  }

  /**
   * Buscar sessão ativa do usuário
   */
  async getActiveSession(userId, category = null) {
    const query = category 
      ? `SELECT * FROM tournament_sessions WHERE user_id = $1 AND category = $2 AND status = 'active' ORDER BY last_activity DESC LIMIT 1`
      : `SELECT * FROM tournament_sessions WHERE user_id = $1 AND status = 'active' ORDER BY last_activity DESC`;
    
    const params = category ? [userId, category] : [userId];
    const result = await pool.query(query, params);
    
    return result.rows[0] || null;
  }

  /**
   * Buscar sessões ativas do usuário
   */
  async getUserActiveSessions(userId) {
    const query = `
      SELECT * FROM tournament_sessions 
      WHERE user_id = $1 AND status = 'active' 
      ORDER BY last_activity DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // =====================================================
  // IMAGE MANAGEMENT
  // =====================================================

  /**
   * Buscar imagens aleatórias para o torneio
   */
  async getRandomImages(category, count) {
    const query = `
      SELECT id, category, image_url, thumbnail_url, title, description, tags, win_rate
      FROM tournament_images 
      WHERE category = $1 AND approved = true AND active = true
      ORDER BY RANDOM()
      LIMIT $2
    `;
    
    const result = await pool.query(query, [category, count]);
    return result.rows;
  }

  /**
   * Atualizar estatísticas da imagem
   */
  async updateImageStats(imageId, isWinner = false, viewCount = 1) {
    const updateQuery = `
      UPDATE tournament_images 
      SET 
        total_views = total_views + $2,
        total_selections = total_selections + $3,
        win_rate = CASE 
          WHEN total_selections + $3 > 0 
          THEN ((total_selections * win_rate / 100) + $3) / (total_selections + $3) * 100
          ELSE win_rate 
        END
      WHERE id = $1
      RETURNING *
    `;
    
    const selectionCount = isWinner ? 1 : 0;
    const result = await pool.query(updateQuery, [imageId, viewCount, selectionCount]);
    
    return result.rows[0];
  }

  // =====================================================
  // MATCHUP GENERATION
  // =====================================================

  /**
   * Gerar próximo confronto
   */
  async generateNextMatchup(sessionId) {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      if (session.remaining_images.length < 2) {
        // Torneio finalizado
        await this.finalizeTournament(sessionId);
        return null;
      }

      // Pegar duas primeiras imagens restantes
      const [imageAId, imageBId] = session.remaining_images.slice(0, 2);
      
      // Buscar dados das imagens
      const imageA = await this.getImageById(imageAId);
      const imageB = await this.getImageById(imageBId);
      
      if (!imageA || !imageB) {
        throw new Error('Imagens do confronto não encontradas');
      }

      // Calcular sequência do confronto
      const roundSize = session.remaining_images.length;
      const matchupSequence = Math.floor((session.tournament_size - roundSize) / 2) + 1;

      const matchup = {
        sessionId,
        roundNumber: session.current_round,
        matchupSequence,
        imageA,
        imageB,
        startTime: new Date().toISOString()
      };

      // Atualizar última atividade
      await this.updateSessionActivity(sessionId);
      
      // Atualizar views das imagens
      await this.updateImageStats(imageAId, false, 1);
      await this.updateImageStats(imageBId, false, 1);

      return matchup;

    } catch (error) {
      console.error('❌ Erro ao gerar confronto:', error);
      throw error;
    }
  }

  /**
   * Buscar confronto atual da sessão
   */
  async getCurrentMatchup(sessionId) {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session || session.status !== 'active') {
        return null;
      }

      if (session.remaining_images.length < 2) {
        return null; // Torneio finalizado
      }

      return await this.generateNextMatchup(sessionId);
    } catch (error) {
      console.error('❌ Erro ao buscar confronto atual:', error);
      return null;
    }
  }

  // =====================================================
  // CHOICE PROCESSING
  // =====================================================

  /**
   * Processar escolha do usuário
   */
  async processChoice(sessionId, winnerId, loserId, responseTimeMs) {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      if (session.status !== 'active') {
        throw new Error('Sessão não está ativa');
      }

      // Validar se as imagens estão no confronto atual
      const currentImages = session.remaining_images.slice(0, 2);
      if (!currentImages.includes(winnerId) || !currentImages.includes(loserId)) {
        throw new Error('Imagens inválidas para o confronto atual');
      }

      // Registrar escolha
      await this.recordChoice(sessionId, winnerId, loserId, responseTimeMs, session.current_round);

      // Atualizar estatísticas das imagens
      await this.updateImageStats(winnerId, true);
      await this.updateImageStats(loserId, false);

      // Remover imagem perdedora e reorganizar
      const newRemainingImages = session.remaining_images.filter(id => id !== loserId);
      
      // Verificar se round terminou
      let newRound = session.current_round;
      if (newRemainingImages.length <= session.remaining_images.length / 2) {
        newRound += 1;
      }

      // Atualizar sessão
      await this.updateSession(sessionId, newRemainingImages, newRound);

      // Verificar se torneio terminou
      if (newRemainingImages.length === 1) {
        const result = await this.finalizeTournament(sessionId);
        return {
          finished: true,
          result,
          nextMatchup: null
        };
      }

      // Gerar próximo confronto
      const nextMatchup = await this.generateNextMatchup(sessionId);
      
      return {
        finished: false,
        result: null,
        nextMatchup
      };

    } catch (error) {
      console.error('❌ Erro ao processar escolha:', error);
      throw error;
    }
  }

  /**
   * Registrar escolha no banco
   */
  async recordChoice(sessionId, winnerId, loserId, responseTimeMs, roundNumber) {
    const insertQuery = `
      INSERT INTO tournament_choices (
        session_id, winner_id, loser_id, response_time_ms, 
        round_number, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await pool.query(insertQuery, [sessionId, winnerId, loserId, responseTimeMs, roundNumber]);
  }

  // =====================================================
  // SESSION FINALIZATION
  // =====================================================

  /**
   * Finalizar torneio e gerar resultado
   */
  async finalizeTournament(sessionId) {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const championId = session.remaining_images[0];
      
      // Buscar todas as escolhas da sessão
      const choicesQuery = `
        SELECT * FROM tournament_choices 
        WHERE session_id = $1 
        ORDER BY created_at ASC
      `;
      const choicesResult = await pool.query(choicesQuery, [sessionId]);
      const choices = choicesResult.rows;

      // Calcular estatísticas
      const stats = this.calculateTournamentStats(choices, session);
      
      // Gerar insights e recomendações
      const insights = await this.generateInsights(session, choices, championId);
      
      // Criar resultado
      const result = {
        sessionId,
        userId: session.user_id,
        category: session.category,
        championId,
        finalistId: this.getFinalist(choices),
        semifinalists: this.getSemifinalists(choices),
        topChoices: this.getTopChoices(choices, 4),
        preferenceStrength: stats.preferenceStrength,
        consistencyScore: stats.consistencyScore,
        decisionSpeedAvg: stats.avgResponseTime,
        totalChoicesMade: choices.length,
        roundsCompleted: session.total_rounds,
        sessionDurationMinutes: stats.sessionDuration,
        completionRate: 100,
        styleProfile: await this.generateStyleProfile(session.category, choices),
        dominantPreferences: await this.analyzeDominantPreferences(choices),
        completedAt: new Date().toISOString(),
        insights: insights.insights,
        recommendations: insights.recommendations
      };

      // Salvar resultado no banco
      await this.saveResult(result);
      
      // Marcar sessão como completa
      await this.markSessionComplete(sessionId);

      return result;

    } catch (error) {
      console.error('❌ Erro ao finalizar torneio:', error);
      throw error;
    }
  }

  /**
   * Calcular estatísticas do torneio
   */
  calculateTournamentStats(choices, session) {
    if (choices.length === 0) {
      return {
        preferenceStrength: 0,
        consistencyScore: 0,
        avgResponseTime: 0,
        sessionDuration: 0
      };
    }

    const responseTimes = choices.map(c => c.response_time_ms);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // Calcular força de preferência (baseado na velocidade de decisão)
    const fastChoices = responseTimes.filter(t => t < 3000).length;
    const preferenceStrength = (fastChoices / choices.length) * 100;
    
    // Calcular consistência (variação nos tempos de resposta)
    const variance = responseTimes.reduce((acc, time) => {
      return acc + Math.pow(time - avgResponseTime, 2);
    }, 0) / responseTimes.length;
    const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) / 100));
    
    // Duração da sessão
    const startTime = new Date(session.started_at);
    const endTime = new Date();
    const sessionDuration = (endTime - startTime) / (1000 * 60); // minutos

    return {
      preferenceStrength: Math.round(preferenceStrength),
      consistencyScore: Math.round(consistencyScore),
      avgResponseTime: Math.round(avgResponseTime),
      sessionDuration: Math.round(sessionDuration * 10) / 10
    };
  }

  /**
   * Gerar insights personalizados
   */
  async generateInsights(session, choices, championId) {
    const insights = [];
    const recommendations = [];

    // Analisar velocidade de decisão
    const avgTime = choices.reduce((acc, c) => acc + c.response_time_ms, 0) / choices.length;
    if (avgTime < 2000) {
      insights.push('Você tem preferências muito definidas e decide rapidamente!');
      recommendations.push('Confie nos seus instintos - suas escolhas rápidas são consistentes.');
    } else if (avgTime > 5000) {
      insights.push('Você analisa cuidadosamente cada opção antes de decidir.');
      recommendations.push('Considere explorar estilos similares ao campeão para ampliar suas opções.');
    }

    // Analisar padrões de escolha
    const champion = await this.getImageById(championId);
    if (champion) {
      insights.push(`Seu estilo vencedor tem características: ${champion.tags.join(', ')}`);
      recommendations.push(`Procure peças com elementos similares: ${champion.tags.slice(0, 3).join(', ')}`);
    }

    // Analisar consistência
    const responseTimes = choices.map(c => c.response_time_ms);
    const variance = this.calculateVariance(responseTimes);
    if (variance < 1000000) { // Baixa variância
      insights.push('Suas escolhas são muito consistentes ao longo do torneio.');
    } else {
      insights.push('Suas preferências variaram durante o torneio - você está explorando!');
    }

    return { insights, recommendations };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Buscar sessão por ID
   */
  async getSessionById(sessionId) {
    const query = `SELECT * FROM tournament_sessions WHERE id = $1`;
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  /**
   * Buscar imagem por ID
   */
  async getImageById(imageId) {
    const query = `SELECT * FROM tournament_images WHERE id = $1`;
    const result = await pool.query(query, [imageId]);
    return result.rows[0] || null;
  }

  /**
   * Atualizar sessão
   */
  async updateSession(sessionId, remainingImages, currentRound) {
    const query = `
      UPDATE tournament_sessions 
      SET remaining_images = $2, current_round = $3, last_activity = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [sessionId, remainingImages, currentRound]);
  }

  /**
   * Atualizar atividade da sessão
   */
  async updateSessionActivity(sessionId) {
    const query = `UPDATE tournament_sessions SET last_activity = NOW() WHERE id = $1`;
    await pool.query(query, [sessionId]);
  }

  /**
   * Marcar sessão como completa
   */
  async markSessionComplete(sessionId) {
    const query = `
      UPDATE tournament_sessions 
      SET status = 'completed', completed_at = NOW() 
      WHERE id = $1
    `;
    await pool.query(query, [sessionId]);
  }

  /**
   * Salvar resultado do torneio
   */
  async saveResult(result) {
    const insertQuery = `
      INSERT INTO tournament_results (
        session_id, user_id, category, champion_id, finalist_id,
        semifinalists, top_choices, preference_strength, consistency_score,
        decision_speed_avg, total_choices_made, rounds_completed,
        session_duration_minutes, completion_rate, style_profile,
        dominant_preferences, completed_at, insights, recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `;

    await pool.query(insertQuery, [
      result.sessionId, result.userId, result.category, result.championId,
      result.finalistId, result.semifinalists, result.topChoices,
      result.preferenceStrength, result.consistencyScore, result.decisionSpeedAvg,
      result.totalChoicesMade, result.roundsCompleted, result.sessionDurationMinutes,
      result.completionRate, JSON.stringify(result.styleProfile),
      JSON.stringify(result.dominantPreferences), result.completedAt,
      result.insights, result.recommendations
    ]);
  }

  /**
   * Limpar sessões expiradas
   */
  async cleanupExpiredSessions() {
    const query = `
      UPDATE tournament_sessions 
      SET status = 'expired' 
      WHERE status = 'active' 
      AND last_activity < NOW() - INTERVAL '${SESSION_EXPIRY_HOURS} hours'
    `;
    
    const result = await pool.query(query);
    if (result.rowCount > 0) {
      console.log(`🧹 ${result.rowCount} sessões expiradas limpas`);
    }
  }

  /**
   * Métodos auxiliares para análise de resultados
   */
  getFinalist(choices) {
    if (choices.length < 2) return null;
    const lastChoice = choices[choices.length - 1];
    return lastChoice.loser_id;
  }

  getSemifinalists(choices) {
    // Buscar perdedores das semifinais (penúltima rodada)
    const semifinalChoices = choices.slice(-3, -1);
    return semifinalChoices.map(c => c.loser_id);
  }

  getTopChoices(choices, count) {
    // Analisar imagens que chegaram mais longe
    const imageProgress = {};
    choices.forEach(choice => {
      if (!imageProgress[choice.winner_id]) {
        imageProgress[choice.winner_id] = 0;
      }
      imageProgress[choice.winner_id]++;
    });

    return Object.entries(imageProgress)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([id]) => parseInt(id));
  }

  async generateStyleProfile(category, choices) {
    // Analisar tags das imagens escolhidas
    const winnerIds = choices.map(c => c.winner_id);
    const winnersQuery = `
      SELECT tags FROM tournament_images 
      WHERE id = ANY($1)
    `;
    const result = await pool.query(winnersQuery, [winnerIds]);
    
    const allTags = result.rows.flatMap(row => row.tags || []);
    const tagFrequency = {};
    
    allTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    return {
      category,
      preferredTags: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, frequency: count }))
    };
  }

  async analyzeDominantPreferences(choices) {
    // Análise mais profunda das preferências
    const patterns = {
      decisionSpeed: this.analyzeDecisionSpeed(choices),
      consistency: this.analyzeConsistency(choices),
      exploration: this.analyzeExploration(choices)
    };

    return patterns;
  }

  analyzeDecisionSpeed(choices) {
    const times = choices.map(c => c.response_time_ms);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    
    if (avg < 2000) return 'decisive';
    if (avg < 4000) return 'moderate';
    return 'deliberate';
  }

  analyzeConsistency(choices) {
    const times = choices.map(c => c.response_time_ms);
    const variance = this.calculateVariance(times);
    
    if (variance < 500000) return 'very_consistent';
    if (variance < 2000000) return 'consistent';
    return 'variable';
  }

  analyzeExploration(choices) {
    // Analisar se usuário mudou de padrão durante o torneio
    const earlyChoices = choices.slice(0, Math.floor(choices.length / 2));
    const lateChoices = choices.slice(Math.floor(choices.length / 2));
    
    const earlyAvg = earlyChoices.reduce((acc, c) => acc + c.response_time_ms, 0) / earlyChoices.length;
    const lateAvg = lateChoices.reduce((acc, c) => acc + c.response_time_ms, 0) / lateChoices.length;
    
    const difference = Math.abs(earlyAvg - lateAvg);
    
    if (difference > 1000) return 'exploratory';
    return 'focused';
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  // =====================================================
  // ADMIN METHODS
  // =====================================================

  /**
   * Obter estatísticas gerais para admin
   */
  async getAdminStats() {
    try {
      const queries = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM tournament_images'),
        pool.query('SELECT COUNT(*) as pending FROM tournament_images WHERE approved = false'),
        pool.query('SELECT COUNT(*) as active FROM tournament_images WHERE active = true AND approved = true'),
        pool.query('SELECT COUNT(*) as sessions FROM tournament_sessions WHERE status = "completed"'),
        pool.query('SELECT AVG(win_rate) as avg_win_rate FROM tournament_images WHERE approved = true'),
        pool.query('SELECT COUNT(DISTINCT user_id) as users FROM tournament_sessions'),
      ]);

      return {
        totalImages: parseInt(queries[0].rows[0].total),
        pendingApproval: parseInt(queries[1].rows[0].pending),
        activeImages: parseInt(queries[2].rows[0].active),
        completedTournaments: parseInt(queries[3].rows[0].sessions),
        averageWinRate: parseFloat(queries[4].rows[0].avg_win_rate) || 0,
        totalUsers: parseInt(queries[5].rows[0].users)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas admin:', error);
      throw error;
    }
  }

  // Destructor
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export default new TournamentEngine();