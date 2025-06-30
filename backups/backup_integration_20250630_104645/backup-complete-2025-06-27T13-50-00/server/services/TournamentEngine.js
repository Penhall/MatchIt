// server/services/TournamentEngine.js - Motor de Torneios MatchIt (ES Modules)

class TournamentEngine {
    constructor() {
        this.activeTournaments = new Map();
        this.categories = [
            'colors', 'styles', 'accessories', 'shoes', 'patterns'
        ];
        
        console.log('🏆 TournamentEngine inicializado (ES Modules)');
    }
    
    /**
     * Iniciar novo torneio para usuário
     */
    async startTournament(userId, category) {
        try {
            console.log(`🎮 Iniciando torneio para usuário ${userId}, categoria: ${category}`);
            
            const tournamentId = `tournament_${userId}_${category}_${Date.now()}`;
            
            // Buscar imagens da categoria (mock por enquanto)
            const images = await this.getImagesForCategory(category);
            
            if (images.length < 4) {
                throw new Error(`Insuficientes imagens para categoria ${category}`);
            }
            
            const tournament = {
                id: tournamentId,
                userId,
                category,
                images: images.slice(0, 16), // 16 imagens para torneio
                currentRound: 1,
                maxRounds: 4, // 16 -> 8 -> 4 -> 2 -> 1
                matches: this.generateFirstRoundMatches(images.slice(0, 16)),
                results: [],
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            this.activeTournaments.set(tournamentId, tournament);
            
            return {
                tournamentId,
                category,
                currentMatch: tournament.matches[0],
                totalMatches: tournament.matches.length,
                round: tournament.currentRound
            };
            
        } catch (error) {
            console.error('❌ Erro ao iniciar torneio:', error);
            throw error;
        }
    }
    
    /**
     * Processar escolha do usuário
     */
    async processChoice(tournamentId, winnerId, loserId) {
        try {
            const tournament = this.activeTournaments.get(tournamentId);
            
            if (!tournament) {
                throw new Error('Torneio não encontrado');
            }
            
            console.log(`🔄 Processando escolha: vencedor ${winnerId}, perdedor ${loserId}`);
            
            // Registrar resultado
            tournament.results.push({
                winnerId,
                loserId,
                round: tournament.currentRound,
                timestamp: new Date()
            });
            
            // Remover match atual
            tournament.matches.shift();
            
            // Verificar se round terminou
            if (tournament.matches.length === 0) {
                return await this.advanceToNextRound(tournament);
            }
            
            // Retornar próximo match
            return {
                tournamentId,
                currentMatch: tournament.matches[0],
                remainingMatches: tournament.matches.length,
                round: tournament.currentRound
            };
            
        } catch (error) {
            console.error('❌ Erro ao processar escolha:', error);
            throw error;
        }
    }
    
    /**
     * Avançar para próximo round
     */
    async advanceToNextRound(tournament) {
        console.log(`⬆️ Avançando para round ${tournament.currentRound + 1}`);
        
        // Buscar vencedores do round atual
        const currentRoundWinners = tournament.results
            .filter(r => r.round === tournament.currentRound)
            .map(r => r.winnerId);
        
        if (currentRoundWinners.length === 1) {
            // Torneio finalizado!
            tournament.status = 'completed';
            tournament.winner = currentRoundWinners[0];
            tournament.completedAt = new Date();
            
            console.log(`🏆 Torneio concluído! Vencedor: ${tournament.winner}`);
            
            return {
                tournamentId: tournament.id,
                status: 'completed',
                winner: tournament.winner,
                category: tournament.category,
                totalRounds: tournament.currentRound,
                results: tournament.results
            };
        }
        
        // Gerar matches para próximo round
        tournament.currentRound++;
        tournament.matches = this.generateRoundMatches(currentRoundWinners);
        tournament.updatedAt = new Date();
        
        return {
            tournamentId: tournament.id,
            currentMatch: tournament.matches[0],
            totalMatches: tournament.matches.length,
            round: tournament.currentRound
        };
    }
    
    /**
     * Gerar matches do primeiro round
     */
    generateFirstRoundMatches(images) {
        const matches = [];
        
        for (let i = 0; i < images.length; i += 2) {
            if (i + 1 < images.length) {
                matches.push({
                    id: `match_${i / 2 + 1}`,
                    image1: images[i],
                    image2: images[i + 1]
                });
            }
        }
        
        return matches;
    }
    
    /**
     * Gerar matches de rounds subsequentes
     */
    generateRoundMatches(winners) {
        const matches = [];
        
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                matches.push({
                    id: `match_${i / 2 + 1}`,
                    image1: this.getImageById(winners[i]),
                    image2: this.getImageById(winners[i + 1])
                });
            }
        }
        
        return matches;
    }
    
    /**
     * Buscar imagens para categoria (mock)
     */
    async getImagesForCategory(category) {
        // Mock de imagens - em produção viria do banco de dados
        const mockImages = [];
        
        for (let i = 1; i <= 20; i++) {
            mockImages.push({
                id: `${category}_img_${i}`,
                url: `/api/images/${category}/image_${i}.jpg`,
                category,
                alt: `${category} image ${i}`,
                approved: true
            });
        }
        
        return mockImages;
    }
    
    /**
     * Buscar imagem por ID
     */
    getImageById(imageId) {
        // Em produção, buscar no banco de dados
        const [category, , number] = imageId.split('_');
        
        return {
            id: imageId,
            url: `/api/images/${category}/image_${number}.jpg`,
            category,
            alt: `${category} image ${number}`,
            approved: true
        };
    }
    
    /**
     * Buscar torneio ativo
     */
    getTournament(tournamentId) {
        return this.activeTournaments.get(tournamentId);
    }
    
    /**
     * Listar categorias disponíveis
     */
    getCategories() {
        return this.categories.map(category => ({
            id: category,
            name: this.getCategoryDisplayName(category),
            description: this.getCategoryDescription(category),
            imageCount: 20 // Mock
        }));
    }
    
    /**
     * Nome de exibição da categoria
     */
    getCategoryDisplayName(category) {
        const names = {
            colors: 'Cores',
            styles: 'Estilos',
            accessories: 'Acessórios',
            shoes: 'Calçados',
            patterns: 'Padrões'
        };
        
        return names[category] || category;
    }
    
    /**
     * Descrição da categoria
     */
    getCategoryDescription(category) {
        const descriptions = {
            colors: 'Escolha suas cores favoritas',
            styles: 'Defina seu estilo pessoal',
            accessories: 'Acessórios que combinam com você',
            shoes: 'Encontre o calçado ideal',
            patterns: 'Padrões que refletem sua personalidade'
        };
        
        return descriptions[category] || 'Categoria de preferências';
    }
    
    /**
     * Limpar torneios antigos
     */
    cleanOldTournaments() {
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        for (const [tournamentId, tournament] of this.activeTournaments) {
            if (now - tournament.updatedAt > maxAge) {
                this.activeTournaments.delete(tournamentId);
                console.log(`🧹 Torneio antigo removido: ${tournamentId}`);
            }
        }
    }
}

// Instância singleton
const tournamentEngine = new TournamentEngine();

// Limpeza periódica (a cada hora)
setInterval(() => {
    tournamentEngine.cleanOldTournaments();
}, 60 * 60 * 1000);

export default tournamentEngine;
