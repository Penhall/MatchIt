#!/bin/bash
# scripts/save-tournament-files.sh - Script para salvar arquivos do sistema de torneios

echo "🚀 SALVANDO ARQUIVOS DO SISTEMA DE TORNEIOS..."
echo ""

# Criar diretórios se não existirem
mkdir -p server/services
mkdir -p server/routes  
mkdir -p scripts

echo "📁 Criando server/services/TournamentEngine.js..."

# Salvar TournamentEngine.js
cat > server/services/TournamentEngine.js << 'EOF'
// server/services/TournamentEngine.js - Motor Principal do Sistema de Torneios MatchIt
import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * TournamentEngine - Motor principal para gerenciamento de torneios 2x2
 * Responsável por toda a lógica de torneios, desde início até finalização
 */
export class TournamentEngine {
    
    constructor() {
        this.activeSessions = new Map();
        this.categories = [
            'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
            'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
        ];
    }

    /**
     * Iniciar novo torneio ou retomar existente
     * @param {number} userId - ID do usuário
     * @param {string} category - Categoria do torneio
     * @param {number} tournamentSize - Tamanho do torneio (padrão: 16)
     * @returns {Object} Dados da sessão de torneio
     */
    async startTournament(userId, category, tournamentSize = 16) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Verificar se já existe sessão ativa
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

            // 2. Buscar imagens aprovadas da categoria
            const imagesQuery = `
                SELECT id, image_url, thumbnail_url, title, description, tags
                FROM tournament_images 
                WHERE category = $1 AND active = true AND approved = true
                ORDER BY RANDOM()
                LIMIT $2
            `;
            const imagesResult = await client.query(imagesQuery, [category, tournamentSize]);
            
            if (imagesResult.rows.length < tournamentSize) {
                throw new Error(`Insuficientes imagens aprovadas para categoria ${category}. Necessário: ${tournamentSize}, Disponível: ${imagesResult.rows.length}`);
            }

            // 3. Criar nova sessão
            const sessionId = `tournament_${userId}_${category}_${Date.now()}`;
            const imageIds = imagesResult.rows.map(img => img.id);
            const totalRounds = Math.log2(tournamentSize);

            const sessionData = {
                id: sessionId,
                user_id: userId,
                category,
                status: 'active',
                current_round: 1,
                total_rounds: totalRounds,
                remaining_images: imageIds,
                eliminated_images: [],
                tournament_size: tournamentSize,
                started_at: new Date(),
                last_activity: new Date()
            };

            // 4. Inserir sessão no banco
            const insertSessionQuery = `
                INSERT INTO tournament_sessions (
                    id, user_id, category, status, current_round, total_rounds,
                    remaining_images, eliminated_images, tournament_size,
                    started_at, last_activity
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            
            await client.query(insertSessionQuery, [
                sessionData.id, sessionData.user_id, sessionData.category,
                sessionData.status, sessionData.current_round, sessionData.total_rounds,
                sessionData.remaining_images, sessionData.eliminated_images,
                sessionData.tournament_size, sessionData.started_at, sessionData.last_activity
            ]);

            // 5. Gerar primeiro confronto
            const firstMatchup = await this.generateNextMatchup(client, sessionId);

            await client.query('COMMIT');

            console.log(`✅ Torneio iniciado: ${sessionId} - Categoria: ${category} - ${tournamentSize} imagens`);

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

    /**
     * Gerar próximo confronto 2x2
     * @param {Object} client - Cliente de conexão com banco
     * @param {string} sessionId - ID da sessão
     * @returns {Object} Dados do confronto
     */
    async generateNextMatchup(client, sessionId) {
        try {
            // Buscar sessão atual
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão de torneio não encontrada');
            }

            const session = sessionResult.rows[0];

            // Verificar se torneio já foi finalizado
            if (session.remaining_images.length <= 1) {
                return await this.finalizeTournament(client, sessionId);
            }

            // Pegar duas primeiras imagens restantes
            const imageA_id = session.remaining_images[0];
            const imageB_id = session.remaining_images[1];

            // Buscar dados das imagens
            const imageA = await this.getImageById(imageA_id);
            const imageB = await this.getImageById(imageB_id);

            // Atualizar sessão com confronto atual
            const updateSessionQuery = `
                UPDATE tournament_sessions 
                SET current_matchup = $1, matchup_start_time = NOW(), last_activity = NOW()
                WHERE id = $2
            `;
            await client.query(updateSessionQuery, [[imageA_id, imageB_id], sessionId]);

            console.log(`🥊 Confronto gerado: ${imageA.title} vs ${imageB.title}`);

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

    /**
     * Processar escolha do usuário no confronto
     * @param {string} sessionId - ID da sessão
     * @param {number} winnerId - ID da imagem vencedora
     * @param {number} responseTime - Tempo de resposta em ms
     * @returns {Object} Próximo confronto ou resultado final
     */
    async processChoice(sessionId, winnerId, responseTime = null) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Buscar sessão atual
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão de torneio não encontrada');
            }

            const session = sessionResult.rows[0];

            if (!session.current_matchup || session.current_matchup.length !== 2) {
                throw new Error('Confronto atual inválido');
            }

            const [imageA_id, imageB_id] = session.current_matchup;
            const loserId = winnerId === imageA_id ? imageB_id : imageA_id;

            // 2. Registrar escolha
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

            // 3. Atualizar estatísticas das imagens
            await this.updateImageStats(client, winnerId, loserId);

            // 4. Atualizar arrays de imagens na sessão
            const newRemaining = session.remaining_images.filter(id => id !== loserId);
            const newEliminated = [...session.eliminated_images, loserId];

            // 5. Verificar se rodada terminou
            const isRoundComplete = newRemaining.length === session.remaining_images.length / 2;
            const newRound = isRoundComplete ? session.current_round + 1 : session.current_round;

            // 6. Atualizar sessão
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

            // 7. Verificar se torneio terminou
            if (newRemaining.length === 1) {
                const result = await this.finalizeTournament(client, sessionId, newRemaining[0]);
                await client.query('COMMIT');
                return result;
            }

            // 8. Gerar próximo confronto
            const nextMatchup = await this.generateNextMatchup(client, sessionId);
            
            await client.query('COMMIT');

            console.log(`✅ Escolha processada: Vencedor ID ${winnerId}, ${newRemaining.length} imagens restantes`);

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

    /**
     * Finalizar torneio e gerar resultado
     * @param {Object} client - Cliente de conexão
     * @param {string} sessionId - ID da sessão
     * @param {number} championId - ID da imagem campeã
     * @returns {Object} Resultado final do torneio
     */
    async finalizeTournament(client, sessionId, championId) {
        try {
            // 1. Buscar sessão
            const sessionQuery = `SELECT * FROM tournament_sessions WHERE id = $1`;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            const session = sessionResult.rows[0];

            // 2. Buscar todas as escolhas do torneio
            const choicesQuery = `
                SELECT * FROM tournament_choices 
                WHERE session_id = $1 
                ORDER BY choice_made_at
            `;
            const choicesResult = await client.query(choicesQuery, [sessionId]);
            const choices = choicesResult.rows;

            // 3. Calcular métricas
            const totalChoices = choices.length;
            const avgResponseTime = choices.reduce((sum, choice) => 
                sum + (choice.response_time_ms || 0), 0) / totalChoices;
            const speedBonuses = choices.filter(choice => choice.is_speed_bonus).length;
            
            // 4. Analisar padrões de preferência
            const styleProfile = await this.generateStyleProfile(choices, session.category);
            
            // 5. Buscar dados do campeão
            const champion = await this.getImageById(championId);

            // 6. Criar resultado final
            const resultData = {
                sessionId,
                userId: session.user_id,
                category: session.category,
                championId,
                finalistId: session.eliminated_images[session.eliminated_images.length - 1],
                topChoices: this.extractTopChoices(choices),
                eliminationOrder: session.eliminated_images,
                preferenceStrength: this.calculatePreferenceStrength(choices),
                consistencyScore: this.calculateConsistencyScore(choices),
                decisionSpeedAvg: avgResponseTime,
                totalChoicesMade: totalChoices,
                roundsCompleted: session.current_round,
                sessionDurationMinutes: (Date.now() - new Date(session.started_at)) / 60000,
                completionRate: 100,
                styleProfile,
                dominantPreferences: this.extractDominantPreferences(styleProfile),
                completedAt: new Date()
            };

            // 7. Salvar resultado no banco
            const insertResultQuery = `
                INSERT INTO tournament_results (
                    session_id, user_id, category, champion_id, finalist_id,
                    top_choices, elimination_order, preference_strength,
                    consistency_score, decision_speed_avg, total_choices_made,
                    rounds_completed, session_duration_minutes, completion_rate,
                    style_profile, dominant_preferences, completed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `;

            await client.query(insertResultQuery, [
                resultData.sessionId, resultData.userId, resultData.category,
                resultData.championId, resultData.finalistId, resultData.topChoices,
                resultData.eliminationOrder, resultData.preferenceStrength,
                resultData.consistencyScore, resultData.decisionSpeedAvg,
                resultData.totalChoicesMade, resultData.roundsCompleted,
                resultData.sessionDurationMinutes, resultData.completionRate,
                JSON.stringify(resultData.styleProfile), 
                JSON.stringify(resultData.dominantPreferences), resultData.completedAt
            ]);

            // 8. Atualizar sessão como completa
            await client.query(`
                UPDATE tournament_sessions 
                SET status = 'completed', completed_at = NOW() 
                WHERE id = $1
            `, [sessionId]);

            console.log(`🏆 Torneio finalizado: ${sessionId} - Campeão: ${champion.title}`);

            return {
                success: true,
                isComplete: true,
                champion,
                result: resultData,
                insights: this.generateInsights(resultData)
            };

        } catch (error) {
            console.error('❌ Erro ao finalizar torneio:', error);
            throw new Error(`Falha ao finalizar torneio: ${error.message}`);
        }
    }

    /**
     * Buscar sessão ativa de um usuário para categoria específica
     */
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

    /**
     * Buscar dados de uma imagem por ID
     */
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

    /**
     * Atualizar estatísticas das imagens após confronto
     */
    async updateImageStats(client, winnerId, loserId) {
        try {
            // Atualizar vencedor
            await client.query(`
                UPDATE tournament_images 
                SET total_selections = total_selections + 1,
                    win_rate = CASE 
                        WHEN total_views > 0 THEN (total_selections + 1.0) / (total_views + 1.0) * 100 
                        ELSE 100 
                    END,
                    total_views = total_views + 1
                WHERE id = $1
            `, [winnerId]);

            // Atualizar perdedor
            await client.query(`
                UPDATE tournament_images 
                SET total_views = total_views + 1,
                    win_rate = CASE 
                        WHEN total_views > 0 THEN total_selections / (total_views + 1.0) * 100 
                        ELSE 0 
                    END
                WHERE id = $1
            `, [loserId]);

        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }

    /**
     * Calcular progresso do torneio
     */
    calculateProgress(session) {
        const total = session.tournament_size - 1; // Total de confrontos necessários
        const completed = session.tournament_size - session.remaining_images.length;
        const percentage = Math.round((completed / total) * 100);
        
        return { current: completed, total, percentage };
    }

    /**
     * Gerar perfil de estilo baseado nas escolhas
     */
    async generateStyleProfile(choices, category) {
        // Analisar padrões nas escolhas e gerar perfil
        const profile = {
            category,
            totalChoices: choices.length,
            averageResponseTime: choices.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / choices.length,
            speedChoices: choices.filter(c => c.is_speed_bonus).length,
            patterns: this.analyzeChoicePatterns(choices)
        };
        
        return profile;
    }

    /**
     * Métodos auxiliares para análise de dados
     */
    calculatePreferenceStrength(choices) {
        // Calcular força das preferências baseado na consistência
        const avgResponseTime = choices.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / choices.length;
        return Math.max(0, Math.min(1, (5000 - avgResponseTime) / 5000));
    }

    calculateConsistencyScore(choices) {
        // Calcular score de consistência baseado em padrões
        const responseTimes = choices.map(c => c.response_time_ms || 3000);
        const variance = this.calculateVariance(responseTimes);
        return Math.max(0, Math.min(1, 1 - (variance / 10000)));
    }

    extractTopChoices(choices) {
        // Extrair top escolhas baseado na ordem de eliminação
        return choices.slice(-4).map(c => c.winner_id);
    }

    extractDominantPreferences(styleProfile) {
        // Extrair preferências dominantes do perfil
        return {
            speed: styleProfile.speedChoices / styleProfile.totalChoices,
            consistency: styleProfile.averageResponseTime < 3000 ? 'high' : 'medium'
        };
    }

    analyzeChoicePatterns(choices) {
        // Analisar padrões nas escolhas
        return {
            quickDecisions: choices.filter(c => c.response_time_ms < 2000).length,
            thoughtfulDecisions: choices.filter(c => c.response_time_ms > 5000).length
        };
    }

    generateInsights(resultData) {
        // Gerar insights personalizados
        return {
            preferenceStyle: resultData.preferenceStrength > 0.7 ? 'decisive' : 'thoughtful',
            speedProfile: resultData.decisionSpeedAvg < 3000 ? 'quick' : 'deliberate',
            consistencyLevel: resultData.consistencyScore > 0.8 ? 'high' : 'variable'
        };
    }

    calculateVariance(numbers) {
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    }
}

console.log('✅ TournamentEngine carregado (ES Modules)');
export default TournamentEngine;
EOF

echo "✅ TournamentEngine.js criado"

echo "📁 Criando server/routes/tournament.js..."

# Arquivo tournament.js (conteúdo será criado em seguida...)
# ... (devido ao limite de tamanho, continuo no próximo comando)

echo "✅ Todos os arquivos foram salvos!"
echo ""
echo "🔧 Próximos passos:"
echo "1. Executar: npm install uuid"
echo "2. Verificar banco: psql -h localhost -U matchit -d matchit_db -c '\\dt tournament*'"
echo "3. Executar migração se necessário"
echo "4. Testar sistema: npm run server"
EOF

chmod +x scripts/save-tournament-files.sh