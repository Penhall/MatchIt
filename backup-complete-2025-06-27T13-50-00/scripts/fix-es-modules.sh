#!/bin/bash
# fix-es-modules.sh - Correção para ES Modules puros - MatchIt

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "================================================================"
echo " CORREÇÃO ES MODULES - SISTEMA MATCHIT"
echo "================================================================"
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto MatchIt${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Diretório correto identificado${NC}"

# 1. CORRIGIR PACKAGE.JSON MANTENDO ES MODULES
echo -e "${BLUE}📦 Corrigindo package.json (mantendo ES Modules)...${NC}"

# Backup do package.json
cp package.json "package.json.backup.$(date +%Y%m%d_%H%M%S)"

# Criar script temporário para correção
cat > fix-package.mjs << 'EOF'
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Manter "type": "module" mas corrigir scripts
packageJson.type = "module";

// Scripts corrigidos para ES Modules
packageJson.scripts = {
  "server": "node server/app.js",
  "dev": "nodemon server/app.js",
  "start": "node server/app.js",
  "test": "NODE_OPTIONS='--experimental-vm-modules' jest",
  "health": "node -e \"import('http').then(http => http.default.get('http://localhost:3000/api/health', r => r.on('data', d => console.log(d.toString()))))\""
};

// Remover scripts problemáticos do TypeScript
delete packageJson.scripts['build:ts'];
delete packageJson.scripts['build'];

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ package.json corrigido para ES Modules');
EOF

node fix-package.mjs
rm fix-package.mjs

echo -e "${GREEN}✅ package.json corrigido - mantendo ES Modules${NC}"

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
mkdir -p server/config
echo -e "${GREEN}✅ Diretórios criados${NC}"

# 4. CRIAR TOURNAMENTENGINE COM ES MODULES
echo -e "${BLUE}🏆 Criando TournamentEngine (ES Modules)...${NC}"

cat > server/services/TournamentEngine.js << 'EOF'
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
EOF

echo -e "${GREEN}✅ TournamentEngine criado (ES Modules)${NC}"

# 5. CRIAR MIDDLEWARE DE AUTH COM ES MODULES
echo -e "${BLUE}🔐 Criando middleware de autenticação (ES Modules)...${NC}"

cat > server/middleware/authMiddleware.js << 'EOF'
// server/middleware/authMiddleware.js - Middleware de autenticação (ES Modules)
import jwt from 'jsonwebtoken';

/**
 * Middleware para autenticação via JWT Token
 */
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Token de acesso requerido',
                code: 'NO_TOKEN' 
            });
        }

        // Verificar e decodificar o JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit_secret_key');
        
        // Adicionar dados do usuário à requisição
        req.user = {
            userId: decoded.userId || decoded.id || decoded.sub,
            id: decoded.userId || decoded.id || decoded.sub,
            email: decoded.email,
            name: decoded.name
        };
        
        console.log('✅ Usuário autenticado:', req.user.email);
        next();
        
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        
        // Diferentes tipos de erro JWT
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                error: 'Token inválido',
                code: 'INVALID_TOKEN' 
            });
        }
        
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR' 
        });
    }
};

/**
 * Middleware de autenticação opcional (fallback para desenvolvimento)
 */
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // Fallback para desenvolvimento
            req.user = {
                userId: 'dev-user-123',
                id: 'dev-user-123',
                email: 'dev@matchit.com',
                name: 'Usuário de Desenvolvimento'
            };
            console.log('🔒 Usando autenticação de desenvolvimento');
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit_secret_key');
        req.user = decoded;
        next();
        
    } catch (error) {
        // Se falhar, usar fallback
        req.user = {
            userId: 'dev-user-123',
            id: 'dev-user-123',
            email: 'dev@matchit.com',
            name: 'Usuário de Desenvolvimento'
        };
        console.log('🔒 Fallback: usando autenticação de desenvolvimento');
        next();
    }
};

export default {
    authenticateToken,
    optionalAuth
};
EOF

echo -e "${GREEN}✅ Middleware de autenticação criado (ES Modules)${NC}"

# 6. CRIAR ROTAS DE TORNEIO COM ES MODULES
echo -e "${BLUE}🛣️  Criando rotas de torneio (ES Modules)...${NC}"

cat > server/routes/tournament.js << 'EOF'
// server/routes/tournament.js - Rotas de Torneio (ES Modules)
import express from 'express';
import tournamentEngine from '../services/TournamentEngine.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('🏆 Carregando rotas de torneio (ES Modules)...');

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
            count: categories.length,
            timestamp: new Date().toISOString()
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
router.post('/start', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category } = req.body;
        
        console.log(`🎮 Iniciando torneio - userId: ${userId}, categoria: ${category}`);
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Categoria é obrigatória',
                code: 'MISSING_CATEGORY'
            });
        }
        
        const tournament = await tournamentEngine.startTournament(userId, category);
        
        res.json({
            success: true,
            message: 'Torneio iniciado com sucesso',
            data: tournament,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar torneio:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao iniciar torneio',
            code: 'START_TOURNAMENT_ERROR'
        });
    }
});

/**
 * POST /api/tournament/choice
 * Processar escolha do usuário
 */
router.post('/choice', optionalAuth, async (req, res) => {
    try {
        const { tournamentId, winnerId, loserId } = req.body;
        
        console.log(`⚔️ Processando escolha - torneio: ${tournamentId}`);
        
        if (!tournamentId || !winnerId || !loserId) {
            return res.status(400).json({
                success: false,
                error: 'tournamentId, winnerId e loserId são obrigatórios',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        const result = await tournamentEngine.processChoice(tournamentId, winnerId, loserId);
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar escolha:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao processar escolha',
            code: 'PROCESS_CHOICE_ERROR'
        });
    }
});

/**
 * GET /api/tournament/:tournamentId
 * Buscar dados do torneio
 */
router.get('/:tournamentId', optionalAuth, (req, res) => {
    try {
        const { tournamentId } = req.params;
        const tournament = tournamentEngine.getTournament(tournamentId);
        
        if (!tournament) {
            return res.status(404).json({
                success: false,
                error: 'Torneio não encontrado',
                code: 'TOURNAMENT_NOT_FOUND'
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
                results: tournament.results,
                progress: {
                    totalRounds: tournament.maxRounds,
                    currentRound: tournament.currentRound,
                    completedMatches: tournament.results.length
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar torneio:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar torneio',
            code: 'GET_TOURNAMENT_ERROR'
        });
    }
});

/**
 * GET /api/tournament/:tournamentId/status
 * Status simplificado do torneio
 */
router.get('/:tournamentId/status', (req, res) => {
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
                status: tournament.status,
                category: tournament.category,
                round: tournament.currentRound,
                hasCurrentMatch: !!tournament.matches[0],
                isCompleted: tournament.status === 'completed',
                winner: tournament.winner || null
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar status do torneio:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar status do torneio'
        });
    }
});

console.log('✅ Rotas de torneio carregadas (ES Modules)');

export default router;
EOF

echo -e "${GREEN}✅ Rotas de torneio criadas (ES Modules)${NC}"

# 7. CRIAR ROTAS DE PERFIL COM ES MODULES
echo -e "${BLUE}👤 Criando rotas de perfil (ES Modules)...${NC}"

cat > server/routes/profile.js << 'EOF'
// server/routes/profile.js - Rotas de Perfil (ES Modules)
import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('👤 Carregando rotas de perfil (ES Modules)...');

/**
 * GET /api/profile
 * Buscar dados básicos do perfil do usuário
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        console.log('📥 GET /api/profile - userId:', userId);
        
        // Mock de dados do usuário para desenvolvimento
        const userData = {
            id: userId,
            name: req.user?.name || 'Usuário MatchIt',
            email: req.user?.email || 'user@matchit.com',
            createdAt: new Date('2024-01-01'),
            profileCompletion: 75,
            hasStylePreferences: true,
            preferences: {
                ageRange: [22, 35],
                maxDistance: 50,
                interests: ['música', 'viagem', 'tecnologia']
            }
        };
        
        res.json({
            success: true,
            data: userData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

/**
 * GET /api/profile/style-preferences
 * Buscar preferências de estilo do usuário
 */
router.get('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        console.log('📥 GET /api/profile/style-preferences - userId:', userId);
        
        // Mock de preferências de estilo
        const stylePreferences = {
            colors: {
                preferences: { 
                    favorites: ['azul', 'verde'], 
                    dislikes: ['amarelo'],
                    style: 'moderno'
                },
                updatedAt: new Date()
            },
            styles: {
                preferences: { 
                    casual: 8, 
                    formal: 6, 
                    esportivo: 7 
                },
                updatedAt: new Date()
            },
            accessories: {
                preferences: { 
                    minimalist: true, 
                    vintage: false 
                },
                updatedAt: new Date()
            }
        };
        
        res.json({
            success: true,
            data: stylePreferences,
            count: Object.keys(stylePreferences).length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar preferências de estilo',
            code: 'FETCH_PREFERENCES_ERROR'
        });
    }
});

/**
 * PUT /api/profile/style-preferences
 * Atualizar preferências de estilo
 */
router.put('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category, preferences } = req.body;
        
        console.log('📥 PUT /api/profile/style-preferences:', { userId, category, preferences });
        
        if (!category || !preferences) {
            return res.status(400).json({
                success: false,
                error: 'Categoria e preferências são obrigatórias',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        // Mock de atualização - em produção salvaria no banco
        const updatedPreference = {
            id: `pref_${Date.now()}`,
            category,
            preferences,
            updatedAt: new Date()
        };
        
        res.json({
            success: true,
            message: 'Preferências atualizadas com sucesso',
            data: updatedPreference,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em PUT /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar preferências',
            code: 'UPDATE_PREFERENCES_ERROR'
        });
    }
});

/**
 * GET /api/profile/style-preferences/stats
 * Estatísticas de completude do perfil
 */
router.get('/style-preferences/stats', optionalAuth, async (req, res) => {
    try {
        const totalCategories = 5; // colors, styles, accessories, shoes, patterns
        const completedCategories = 3; // Mock
        const completionPercentage = Math.round((completedCategories / totalCategories) * 100);
        
        res.json({
            success: true,
            data: {
                totalCategories,
                completedCategories,
                completionPercentage,
                missingCategories: totalCategories - completedCategories,
                lastUpdated: new Date()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences/stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            code: 'STATS_ERROR'
        });
    }
});

console.log('✅ Rotas de perfil carregadas (ES Modules)');

export default router;
EOF

echo -e "${GREEN}✅ Rotas de perfil criadas (ES Modules)${NC}"

# 8. CRIAR SERVER/APP.JS COM ES MODULES
echo -e "${BLUE}🚀 Criando server/app.js (ES Modules)...${NC}"

cat > server/app.js << 'EOF'
// server/app.js - Servidor principal MatchIt (ES Modules)
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor MatchIt (ES Modules)...');

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log de requests em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    });
}

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'MatchIt API funcionando (ES Modules)',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        moduleType: 'ES Modules',
        endpoints: [
            'GET /api/health',
            'GET /api/profile',
            'GET /api/profile/style-preferences',
            'GET /api/tournament/categories',
            'POST /api/tournament/start'
        ]
    });
});

// Rota de informações da API
app.get('/api/info', (req, res) => {
    res.json({
        name: 'MatchIt API',
        version: '1.0.0',
        description: 'Sistema de compatibilidade com torneios por imagens',
        moduleType: 'ES Modules',
        features: [
            'Sistema de preferências de estilo (Fase 0)',
            'Torneios de imagens 2x2 (Fase 1)',
            'Autenticação JWT',
            'API RESTful'
        ],
        timestamp: new Date().toISOString()
    });
});

// Carregar rotas dinamicamente
async function loadRoutes() {
    try {
        // Carregar rotas de perfil
        const { default: profileRoutes } = await import('./routes/profile.js');
        app.use('/api/profile', profileRoutes);
        console.log('✅ Rotas de perfil carregadas');
    } catch (error) {
        console.warn('⚠️  Rotas de perfil não carregadas:', error.message);
    }

    try {
        // Carregar rotas de torneio
        const { default: tournamentRoutes } = await import('./routes/tournament.js');
        app.use('/api/tournament', tournamentRoutes);
        console.log('✅ Rotas de torneio carregadas');
    } catch (error) {
        console.warn('⚠️  Rotas de torneio não carregadas:', error.message);
    }
}

// Middleware de erro global
app.use((error, req, res, next) => {
    console.error('❌ Erro global:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
    });
});

// Rota 404 para endpoints não encontrados
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /api/health',
            'GET /api/info',
            'GET /api/profile',
            'GET /api/profile/style-preferences',
            'GET /api/tournament/categories',
            'POST /api/tournament/start'
        ],
        timestamp: new Date().toISOString()
    });
});

// Inicializar servidor
async function startServer() {
    try {
        // Carregar todas as rotas
        await loadRoutes();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📋 API Info: http://localhost:${PORT}/api/info`);
            console.log(`📋 Endpoints disponíveis:`);
            console.log(`   GET  /api/health`);
            console.log(`   GET  /api/info`);
            console.log(`   GET  /api/profile`);
            console.log(`   GET  /api/profile/style-preferences`);
            console.log(`   GET  /api/tournament/categories`);
            console.log(`   POST /api/tournament/start`);
            console.log(`   POST /api/tournament/choice`);
            console.log(`\n💡 Sistema usando ES Modules puro!`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Iniciar aplicação
startServer();

export default app;
EOF

echo -e "${GREEN}✅ server/app.js criado (ES Modules)${NC}"

# 9. FINALIZAÇÃO
echo -e "${GREEN}"
echo "================================================================"
echo " CORREÇÃO ES MODULES CONCLUÍDA!"
echo "================================================================"
echo -e "${NC}"

echo -e "${GREEN}✅ Sistema configurado para ES Modules puros:${NC}"
echo "   • package.json mantém \"type\": \"module\""
echo "   • Todos os arquivos usam import/export"
echo "   • TournamentEngine funcional com ES Modules"
echo "   • Rotas de perfil e torneio implementadas"
echo "   • Middleware de autenticação com fallback"
echo "   • Scripts corrigidos para ES Modules"

echo ""
echo -e "${BLUE}🚀 Para iniciar o servidor:${NC}"
echo "   npm run server"

echo ""
echo -e "${BLUE}🧪 Para testar:${NC}"
echo "   curl http://localhost:3000/api/health"
echo "   curl http://localhost:3000/api/info"
echo "   curl http://localhost:3000/api/tournament/categories"

echo ""
echo -e "${BLUE}📋 Endpoints implementados:${NC}"
echo "   GET  /api/health                      - Status do sistema"
echo "   GET  /api/info                        - Informações da API"
echo "   GET  /api/profile                     - Dados do usuário"
echo "   GET  /api/profile/style-preferences   - Preferências de estilo"
echo "   PUT  /api/profile/style-preferences   - Atualizar preferências"
echo "   GET  /api/tournament/categories       - Categorias de torneio"
echo "   POST /api/tournament/start            - Iniciar torneio"
echo "   POST /api/tournament/choice           - Processar escolha"

echo ""
echo -e "${YELLOW}💡 Agora o sistema usa ES Modules puros - sintaxe moderna e consistente!${NC}"
echo ""
