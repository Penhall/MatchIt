// server/services/TournamentEngine.js - Motor Principal do Sistema de Torneios MatchIt
import { pool } from '../config/database.js';

/**
 * TournamentEngine - Motor principal para gerenciamento de torneios 2x2
 */
export class TournamentEngine {
    
    constructor() {
        this.activeSessions = new Map();
        this.categories = [
            'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
            'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
        ];
    }

    async startTournament(userId, category, tournamentSize = 16) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Verificar sessão ativa existente
            const existingSession = await this.getActiveSession(userId, category);
            if (existingSession) {
                await client.query('ROLLBACK');
                return {
                    sessionId: existingSession.id,
                    resumed: true,
                    currentMatchup: existingSession.current_matchup ? {
                        imageA: await this.getImageById(existingSession.current_matchup[0]),
                        imageB: await this.getImageById(existingSession.current_matchup[1])
                    } : null,
                    progress: this.calculateProgress(existingSession),
                    round: existingSession.current_round,
                    status: existingSession.status
                };
            }

            // Buscar imagens aprovadas
            const imagesQuery = `
                SELECT id, image_url, thumbnail_url, title, description, tags
                FROM tournament_images 
                WHERE category = $1 AND active = true AND approved = true
                ORDER BY RANDOM()
                LIMIT $2
            `;
            const imagesResult = await client.query(imagesQuery, [category, tournamentSize]);
            
            if (imagesResult.rows.length < tournamentSize) {
                throw new Error(`Insuficientes imagens para categoria ${category}. Necessário: ${tournamentSize}, Disponível: ${imagesResult.rows.length}`);
            }

            // Criar sessão
            const sessionId = `tournament_${userId}_${category}_${Date.now()}`;
            const imageIds = imagesResult.rows.map(img => img.id);
            const totalRounds = Math.log2(tournamentSize);

            const insertSessionQuery = `
                INSERT INTO tournament_sessions (
                    id, user_id, category, status, current_round, total_rounds,
                    remaining_images, eliminated_images, tournament_size,
                    started_at, last_activity
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            
            await client.query(insertSessionQuery, [
                sessionId, userId, category, 'active', 1, totalRounds,
                imageIds, [], tournamentSize, new Date(), new Date()
            ]);

            // Gerar primeiro confronto
            const firstMatchup = await this.generateNextMatchup(client, sessionId);
            await client.query('COMMIT');

            console.log(`✅ Torneio iniciado: ${sessionId}`);

            return {
                sessionId: sessionId,
                resumed: false,
                currentMatchup: firstMatchup,
                progress: { current: 0, total: tournamentSize - 1, percentage: 0 },
                round: 1,
                status: 'active'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Erro ao iniciar torneio:', error);
            throw new Error(`Falha ao iniciar torneio: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async generateNextMatchup(client, sessionId) {
        try {
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão não encontrada');
            }

            const session = sessionResult.rows[0];

            if (session.remaining_images.length <= 1) {
                return await this.finalizeTournament(client, sessionId);
            }

            const imageA_id = session.remaining_images[0];
            const imageB_id = session.remaining_images[1];

            const imageA = await this.getImageById(imageA_id);
            const imageB = await this.getImageById(imageB_id);

            const updateSessionQuery = `
                UPDATE tournament_sessions 
                SET current_matchup = $1, matchup_start_time = NOW(), last_activity = NOW()
                WHERE id = $2
            `;
            await client.query(updateSessionQuery, [[imageA_id, imageB_id], sessionId]);

            return {
                sessionId,
                roundNumber: session.current_round,
                imageA,
                imageB,
                startTime: new Date()
            };

        } catch (error) {
            console.error('❌ Erro ao gerar confronto:', error);
            throw new Error(`Falha ao gerar confronto: ${error.message}`);
        }
    }

    async processChoice(sessionId, winnerId, responseTime = null) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão não encontrada');
            }

            const session = sessionResult.rows[0];
            const [imageA_id, imageB_id] = session.current_matchup;
            const loserId = winnerId === imageA_id ? imageB_id : imageA_id;

            // Registrar escolha
            const choiceQuery = `
                INSERT INTO tournament_choices (
                    session_id, round_number, matchup_sequence, option_a_id, 
                    option_b_id, winner_id, loser_id, response_time_ms,
                    is_speed_bonus, choice_made_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `;
            
            const isSpeedBonus = responseTime && responseTime < 3000;
            const matchupSequence = Math.floor((session.tournament_size - session.remaining_images.length) / 2) + 1;

            await client.query(choiceQuery, [
                sessionId, session.current_round, matchupSequence,
                imageA_id, imageB_id, winnerId, loserId,
                responseTime, isSpeedBonus
            ]);

            // Atualizar arrays
            const newRemaining = session.remaining_images.filter(id => id !== loserId);
            const newEliminated = [...session.eliminated_images, loserId];
            const newRound = newRemaining.length === session.remaining_images.length / 2 ? 
                session.current_round + 1 : session.current_round;

            const updateSessionQuery = `
                UPDATE tournament_sessions 
                SET remaining_images = $1, eliminated_images = $2, 
                    current_round = $3, current_matchup = NULL, 
                    last_activity = NOW()
                WHERE id = $4
            `;
            
            await client.query(updateSessionQuery, [
                newRemaining, newEliminated, newRound, sessionId
            ]);

            // Verificar se terminou
            if (newRemaining.length === 1) {
                const result = await this.finalizeTournament(client, sessionId, newRemaining[0]);
                await client.query('COMMIT');
                return result;
            }

            // Próximo confronto
            const nextMatchup = await this.generateNextMatchup(client, sessionId);
            await client.query('COMMIT');

            return {
                success: true,
                nextMatchup,
                progress: this.calculateProgress({
                    tournament_size: session.tournament_size,
                    remaining_images: newRemaining
                }),
                round: newRound,
                isComplete: false
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Erro ao processar escolha:', error);
            throw new Error(`Falha ao processar escolha: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async finalizeTournament(client, sessionId, championId) {
        try {
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            const session = sessionResult.rows[0];

            const champion = await this.getImageById(championId);

            // Salvar resultado
            const insertResultQuery = `
                INSERT INTO tournament_results (
                    session_id, user_id, category, champion_id,
                    total_choices_made, rounds_completed, completion_rate,
                    completed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `;

            await client.query(insertResultQuery, [
                sessionId, session.user_id, session.category, championId,
                15, session.current_round, 100
            ]);

            // Atualizar sessão
            await client.query(`
                UPDATE tournament_sessions 
                SET status = 'completed', completed_at = NOW() 
                WHERE id = $1
            `, [sessionId]);

            console.log(`🏆 Torneio finalizado: ${champion.title}`);

            return {
                success: true,
                isComplete: true,
                champion
            };

        } catch (error) {
            console.error('❌ Erro ao finalizar torneio:', error);
            throw new Error(`Falha ao finalizar torneio: ${error.message}`);
        }
    }

    async getActiveSession(userId, category) {
        try {
            const query = `
                SELECT * FROM tournament_sessions 
                WHERE user_id = $1 AND category = $2 AND status = 'active'
                ORDER BY started_at DESC
                LIMIT 1
            `;
            const result = await pool.query(query, [userId, category]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Erro ao buscar sessão ativa:', error);
            return null;
        }
    }

    async getImageById(imageId) {
        try {
            const query = `SELECT * FROM tournament_images WHERE id = $1`;
            const result = await pool.query(query, [imageId]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erro ao buscar imagem:', error);
            return null;
        }
    }

    calculateProgress(session) {
        const total = session.tournament_size - 1;
        const completed = session.tournament_size - session.remaining_images.length;
        const percentage = Math.round((completed / total) * 100);
        
        return { current: completed, total, percentage };
    }
}

console.log('✅ TournamentEngine carregado');
export default TournamentEngine;
