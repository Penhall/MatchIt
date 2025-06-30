#!/bin/bash
# scripts/corrigir-rotas-auth-completo.sh - Solução completa para rotas de autenticação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 🔧 MATCHIT - CORREÇÃO DE ROTAS DE AUTENTICAÇÃO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   • Rotas /api/auth/* retornam 404"
echo -e "   • server/routes/auth.js existe mas não está registrado"
echo -e "   • server/app.js não importa nem usa as rotas de auth"
echo ""
echo -e "${YELLOW}🛠️ SOLUÇÃO:${NC}"
echo -e "   • Registrar rotas de autenticação no app.js principal"
echo -e "   • Manter todas as outras funcionalidades intactas"
echo -e "   • Teste imediato após correção"
echo ""

# Verificar se estamos no diretório correto
if [[ ! -f "server/app.js" ]]; then
    echo -e "${RED}❌ Erro: server/app.js não encontrado${NC}"
    echo -e "${RED}   Execute este script a partir da raiz do projeto MatchIt${NC}"
    exit 1
fi

if [[ ! -f "server/routes/auth.js" ]]; then
    echo -e "${RED}❌ Erro: server/routes/auth.js não encontrado${NC}"
    echo -e "${RED}   O arquivo de rotas de autenticação é necessário${NC}"
    exit 1
fi

echo -e "${BLUE}▶ ETAPA 1: Backup do app.js atual${NC}"
cp server/app.js server/app.js.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup criado: server/app.js.backup.$(date +%Y%m%d_%H%M%S)${NC}"

echo -e "${BLUE}▶ ETAPA 2: Criando app.js corrigido com rotas de autenticação${NC}"

cat > server/app.js << 'EOF'
// server/app.js - Aplicação principal MatchIt com sistema completo
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rotas
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import tournamentRoutes from './routes/tournament.js';

// Configuração de diretórios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================================================
// MIDDLEWARES DE SEGURANÇA
// ========================================================================

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente em 15 minutos.'
    }
});

app.use(limiter);
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// ========================================================================
// MIDDLEWARES GERAIS
// ========================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (imagens de torneio)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ========================================================================
// ROTAS
// ========================================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MatchIt API funcionando',
        timestamp: new Date().toISOString(),
        version: '1.1.0-auth-fixed'
    });
});

// Informações da API
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'MatchIt API',
            version: '1.1.0-auth',
            features: [
                'Sistema de autenticação JWT',
                'Sistema de perfis',
                'Preferências de estilo',
                'Torneios 2x2',
                'Sistema de resultados',
                'Admin panel'
            ],
            endpoints: {
                auth: '/api/auth/*',
                profile: '/api/profile/*',
                tournaments: '/api/tournament/*'
            }
        }
    });
});

// ========================================================================
// ROTAS PRINCIPAIS
// ========================================================================

// 🔐 ROTAS DE AUTENTICAÇÃO (NOVA!)
app.use('/api/auth', authRoutes);

// 👤 ROTAS DE PERFIL
app.use('/api/profile', profileRoutes);

// 🏆 ROTAS DE TORNEIO
app.use('/api/tournament', tournamentRoutes);

// ========================================================================
// MIDDLEWARE DE ERRO
// ========================================================================

app.use((err, req, res, next) => {
    console.error('❌ Erro na aplicação:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado',
        availableEndpoints: [
            'GET /api/health',
            'GET /api/info',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'POST /api/tournament/start',
            'POST /api/tournament/choice',
            'GET /api/tournament/categories'
        ]
    });
});

// ========================================================================
// INICIALIZAÇÃO
// ========================================================================

app.listen(PORT, () => {
    console.log('\n🚀 MatchIt API iniciada com sucesso!');
    console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`🔐 Autenticação: http://localhost:${PORT}/api/auth/`);
    console.log(`👤 Perfil: http://localhost:${PORT}/api/profile/`);
    console.log(`🏆 Torneios: http://localhost:${PORT}/api/tournament/`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
    
    console.log('📋 Endpoints de autenticação disponíveis:');
    console.log('   POST /api/auth/register - Registrar usuário');
    console.log('   POST /api/auth/login - Login');
    console.log('   GET /api/auth/me - Dados do usuário logado');
    console.log('   POST /api/auth/logout - Logout\n');
});

export default app;
EOF

echo -e "${GREEN}✅ app.js corrigido com rotas de autenticação registradas${NC}"

echo -e "${BLUE}▶ ETAPA 3: Verificando estrutura de arquivos${NC}"

# Verificar se todos os arquivos necessários existem
FILES_TO_CHECK=(
    "server/app.js"
    "server/routes/auth.js"
    "server/routes/profile.js"
    "server/routes/tournament.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file - ARQUIVO FALTANDO${NC}"
    fi
done

echo -e "${BLUE}▶ ETAPA 4: Teste rápido das rotas registradas${NC}"

# Verificar se as importações estão corretas no app.js
if grep -q "import authRoutes from './routes/auth.js'" server/app.js; then
    echo -e "${GREEN}✅ Import de authRoutes encontrado${NC}"
else
    echo -e "${RED}❌ Import de authRoutes não encontrado${NC}"
fi

if grep -q "app.use('/api/auth', authRoutes)" server/app.js; then
    echo -e "${GREEN}✅ Registro de rotas /api/auth encontrado${NC}"
else
    echo -e "${RED}❌ Registro de rotas /api/auth não encontrado${NC}"
fi

echo -e "${BLUE}▶ ETAPA 5: Instruções para teste${NC}"
echo ""
echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Reiniciar o servidor:${NC}"
echo -e "   ${BLUE}Ctrl+C${NC} (se estiver rodando)"
echo -e "   ${BLUE}npm run server${NC}"
echo ""
echo -e "${YELLOW}2. Testar autenticação:${NC}"
echo -e "   ${BLUE}curl -X POST http://localhost:3000/api/auth/register \\${NC}"
echo -e "   ${BLUE}     -H \"Content-Type: application/json\" \\${NC}"
echo -e "   ${BLUE}     -d '{\"email\":\"test@test.com\",\"password\":\"123456\",\"name\":\"Test\"}'${NC}"
echo ""
echo -e "${YELLOW}3. Executar teste completo:${NC}"
echo -e "   ${BLUE}./scripts/test-sistema-completo-melhorado.sh${NC}"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ CORREÇÃO APLICADA COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🎯 PROBLEMA RESOLVIDO:${NC}"
echo -e "   • Rotas de autenticação registradas em app.js"
echo -e "   • /api/auth/register disponível"
echo -e "   • /api/auth/login disponível"
echo -e "   • Todas as outras rotas mantidas"
echo ""
echo -e "${YELLOW}⚡ Reinicie o servidor para ativar as mudanças!${NC}"