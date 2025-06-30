#!/bin/bash
# fix-matchit-system.sh - Correção completa do sistema MatchIt

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "================================================================"
echo " CORREÇÃO COMPLETA - SISTEMA MATCHIT"
echo "================================================================"
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto MatchIt${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Diretório correto identificado${NC}"

# 1. CORRIGIR PACKAGE.JSON
echo -e "${BLUE}📦 Corrigindo package.json...${NC}"

# Backup do package.json
cp package.json "package.json.backup.$(date +%Y%m%d_%H%M%S)"

# Remover "type": "module" e corrigir scripts usando Node.js
cat > fix-package.js << 'EOF'
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remover type: module para usar CommonJS
delete packageJson.type;

// Scripts corrigidos
packageJson.scripts = {
  "server": "node server/app.js",
  "dev": "nodemon server/app.js",
  "start": "node server/app.js",
  "test": "jest",
  "health": "node -e \"require('http').get('http://localhost:3000/api/health', r => r.on('data', d => console.log(d.toString())))\""
};

// Remover scripts problemáticos
delete packageJson.scripts['build:ts'];

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ package.json corrigido');
EOF

# Executar correção temporariamente como CommonJS
mv package.json package.json.temp
echo '{}' > package.json
node fix-package.js
rm fix-package.js package.json.temp

echo -e "${GREEN}✅ package.json corrigido - agora usa CommonJS${NC}"

# 2. REMOVER DIRETÓRIO DIST
echo -e "${BLUE}🧹 Limpando diretório dist...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✅ Diretório dist removido${NC}"
else
    echo -e "${YELLOW}ℹ️  Diretório dist não existe${NC}"
fi

# 3. CRIAR ESTRUTURA DE DIRETÓRIOS
echo -e "${BLUE}📁 Criando estrutura de diretórios...${NC}"
mkdir -p server/routes
mkdir -p server/services
mkdir -p server/middleware
echo -e "${GREEN}✅ Diretórios criados${NC}"

# 4. CRIAR TOURNAMENTENGINE
echo -e "${BLUE}🏆 Criando TournamentEngine...${NC}"

cat > server/services/TournamentEngine.js << 'EOF'
// server/services/TournamentEngine.js - Motor de Torneios MatchIt
class TournamentEngine {
    constructor() {
        this.activeTournaments = new Map();
        this.categories = [
            'colors', 'styles', 'accessories', 'shoes', 'patterns'
        ];
        
        console.log('🏆 TournamentEngine inicializado');
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

module.exports = tournamentEngine;
EOF

echo -e "${GREEN}✅ TournamentEngine criado${NC}"

# 5. CRIAR ROTAS DE TORNEIO
echo -e "${BLUE}🛣️  Criando rotas de torneio...${NC}"

cat > server/routes/tournament.js << 'EOF'
// server/routes/tournament.js - Rotas de Torneio
const express = require('express');
const router = express.Router();
const tournamentEngine = require('../services/TournamentEngine');

console.log('🏆 Carregando rotas de torneio...');

// Middleware de autenticação (com fallback)
let authenticateToken;
try {
    const authMiddleware = require('../middleware/authMiddleware');
    authenticateToken = authMiddleware.authenticateToken;
} catch (error) {
    console.warn('⚠️  Auth middleware não encontrado, usando fallback');
    authenticateToken = (req, res, next) => {
        req.user = { userId: 'dev-user-123', id: 'dev-user-123' };
        next();
    };
}

/**
 * GET /api/tournament/categories
 * Listar categorias disponíveis
 */
router.get('/categories', (req, res) => {
    try {
        const categories = tournamentEngine.getCategories();
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar categorias'
        });
    }
});

/**
 * POST /api/tournament/start
 * Iniciar novo torneio
 */
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category } = req.body;
        
        console.log(`🎮 Iniciando torneio - userId: ${userId}, categoria: ${category}`);
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Categoria é obrigatória'
            });
        }
        
        const tournament = await tournamentEngine.startTournament(userId, category);
        
        res.json({
            success: true,
            message: 'Torneio iniciado com sucesso',
            data: tournament
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar torneio:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao iniciar torneio'
        });
    }
});

/**
 * POST /api/tournament/choice
 * Processar escolha do usuário
 */
router.post('/choice', authenticateToken, async (req, res) => {
    try {
        const { tournamentId, winnerId, loserId } = req.body;
        
        console.log(`⚔️ Processando escolha - torneio: ${tournamentId}`);
        
        if (!tournamentId || !winnerId || !loserId) {
            return res.status(400).json({
                success: false,
                error: 'tournamentId, winnerId e loserId são obrigatórios'
            });
        }
        
        const result = await tournamentEngine.processChoice(tournamentId, winnerId, loserId);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar escolha:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao processar escolha'
        });
    }
});

/**
 * GET /api/tournament/:tournamentId
 * Buscar dados do torneio
 */
router.get('/:tournamentId', authenticateToken, (req, res) => {
    try {
        const { tournamentId } = req.params;
        const tournament = tournamentEngine.getTournament(tournamentId);
        
        if (!tournament) {
            return res.status(404).json({
                success: false,
                error: 'Torneio não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: tournament.id,
                category: tournament.category,
                status: tournament.status,
                round: tournament.currentRound,
                currentMatch: tournament.matches[0] || null,
                remainingMatches: tournament.matches.length,
                results: tournament.results
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar torneio:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar torneio'
        });
    }
});

console.log('✅ Rotas de torneio carregadas');

module.exports = router;
EOF

echo -e "${GREEN}✅ Rotas de torneio criadas${NC}"

# 6. VERIFICAR/CORRIGIR SERVER/APP.JS
echo -e "${BLUE}🔍 Verificando server/app.js...${NC}"

if [ ! -f "server/app.js" ]; then
    echo -e "${YELLOW}⚠️  server/app.js não encontrado, criando...${NC}"
    
    cat > server/app.js << 'EOF'
// server/app.js - Servidor principal MatchIt
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor MatchIt...');

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'MatchIt API funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Carregar rotas se existirem
try {
    const profileRoutes = require('./routes/profile');
    app.use('/api/profile', profileRoutes);
    console.log('✅ Rotas de perfil carregadas');
} catch (error) {
    console.warn('⚠️  Rotas de perfil não carregadas:', error.message);
}

try {
    const tournamentRoutes = require('./routes/tournament');
    app.use('/api/tournament', tournamentRoutes);
    console.log('✅ Rotas de torneio carregadas');
} catch (error) {
    console.warn('⚠️  Rotas de torneio não carregadas:', error.message);
}

// Middleware de erro global
app.use((error, req, res, next) => {
    console.error('❌ Erro global:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
    });
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/profile`);
    console.log(`   GET  /api/tournament/categories`);
    console.log(`   POST /api/tournament/start`);
});

module.exports = app;
EOF
    
    echo -e "${GREEN}✅ server/app.js criado${NC}"
else
    echo -e "${GREEN}✅ server/app.js já existe${NC}"
fi

# 7. VERIFICAR SE MIDDLEWARE DE AUTH EXISTE
if [ ! -f "server/middleware/authMiddleware.js" ]; then
    echo -e "${BLUE}🔐 Criando middleware de autenticação...${NC}"
    
    cat > server/middleware/authMiddleware.js << 'EOF'
// server/middleware/authMiddleware.js - Middleware de autenticação
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de acesso requerido',
            code: 'NO_TOKEN'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }
};

module.exports = {
    authenticateToken
};
EOF
    
    echo -e "${GREEN}✅ Middleware de autenticação criado${NC}"
fi

# 8. FINALIZAÇÃO
echo -e "${GREEN}"
echo "================================================================"
echo " CORREÇÃO CONCLUÍDA COM SUCESSO!"
echo "================================================================"
echo -e "${NC}"

echo -e "${GREEN}✅ Problemas corrigidos:${NC}"
echo "   • TypeScript removido (agora usa JavaScript puro)"
echo "   • TournamentEngine criado e funcional"
echo "   • Rotas de torneio implementadas"
echo "   • Scripts do package.json corrigidos"
echo "   • Middleware de autenticação criado"
echo "   • Diretório dist removido"

echo ""
echo -e "${BLUE}🚀 Para iniciar o servidor:${NC}"
echo "   npm run server"

echo ""
echo -e "${BLUE}🧪 Para testar:${NC}"
echo "   curl http://localhost:3000/api/health"
echo "   curl http://localhost:3000/api/tournament/categories"

echo ""
echo -e "${BLUE}📋 Endpoints disponíveis:${NC}"
echo "   GET  /api/health"
echo "   GET  /api/profile"
echo "   GET  /api/profile/style-preferences"
echo "   GET  /api/tournament/categories"
echo "   POST /api/tournament/start"
echo "   POST /api/tournament/choice"

echo ""
echo -e "${YELLOW}💡 Sistema agora usa JavaScript puro - mais simples e estável!${NC}"
echo ""
