// server/app.js - Aplicação principal MatchIt com TODAS as rotas registradas corretamente
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// =====================================================
// IMPORTAÇÕES DE ROTAS
// =====================================================

// Importar rotas básicas
import authRoutes from './routes/auth.js';

// Importar arquivo de rotas de profile que criei
import profileRoutes from './routes/profile.js';

// Configuração de diretórios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARES DE SEGURANÇA
// =====================================================

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Aumentado para desenvolvimento
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configurado para desenvolvimento
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Aplicar middlewares
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// =====================================================
// LOGGING DE REQUESTS PARA DEBUG
// =====================================================

app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// =====================================================
// ROTAS PRINCIPAIS - AQUI ESTAVA O PROBLEMA!
// =====================================================

// Health check primeiro
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MatchIt API funcionando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ⚠️ PROBLEMA IDENTIFICADO: As rotas não estavam sendo registradas corretamente
// 🔧 SOLUÇÃO: Registrar todas as rotas com prefixos corretos

// Rotas de autenticação (sem autenticação obrigatória)
app.use('/api/auth', authRoutes);

// ✅ CORREÇÃO PRINCIPAL: Registrar rotas de profile que contêm os endpoints que faltam
app.use('/api', profileRoutes);

// =====================================================
// MIDDLEWARE DE ERRO GLOBAL
// =====================================================

// Handler para rotas não encontradas
app.use('*', (req, res) => {
    console.log(`❌ 404 - Rota não encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        code: 'ROUTE_NOT_FOUND',
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Handler de erro global
app.use((error, req, res, next) => {
    console.error(`💥 Erro interno:`, error);
    
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

const server = app.listen(PORT, () => {
    console.log('\n🚀 MatchIt API Server Iniciado!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📡 Servidor: http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('───────────────────────────────────────────────────────────');
    console.log('📋 Endpoints Registrados:');
    console.log('   🔐 POST /api/auth/register - Registrar usuário');
    console.log('   🔐 POST /api/auth/login - Login');
    console.log('   🔐 GET  /api/auth/me - Dados do usuário');
    console.log('   ──────────────────────────────────────────────────────');
    console.log('   🎨 GET  /api/style/categories - Categorias de estilo');
    console.log('   🎨 GET  /api/style-preferences - Preferências usuário');
    console.log('   🎨 PUT  /api/style-preferences - Salvar preferência');
    console.log('   🎨 GET  /api/style/completion-stats/:userId - Estatísticas');
    console.log('   🎨 POST /api/style-preferences/batch - Salvamento em lote');
    console.log('   🎨 DELETE /api/style-preferences - Limpar preferências');
    console.log('═══════════════════════════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recebido. Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado graciosamente.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT recebido. Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado graciosamente.');
        process.exit(0);
    });
});

export default app;