// server/app.js - Servidor principal MatchIt (ES Modules) - CORRIGIDO
import express from 'express';
import cors from 'cors';

// Importar rotas diretamente (não dinamicamente)
import profileRoutes from './routes/profile.js';
import tournamentRoutes from './routes/tournament.js';

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
            'GET /api/info',
            'GET /api/profile',
            'GET /api/profile/style-preferences',
            'GET /api/tournament/categories',
            'POST /api/tournament/start',
            'POST /api/tournament/choice'
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
        routes: {
            health: '/api/health',
            info: '/api/info',
            profile: '/api/profile',
            stylePreferences: '/api/profile/style-preferences',
            tournamentCategories: '/api/tournament/categories',
            tournamentStart: '/api/tournament/start',
            tournamentChoice: '/api/tournament/choice'
        },
        timestamp: new Date().toISOString()
    });
});

// REGISTRAR ROTAS DIRETAMENTE (sem imports dinâmicos)
console.log('📋 Registrando rotas...');

// Rotas de perfil
app.use('/api/profile', profileRoutes);
console.log('✅ Rotas de perfil registradas em /api/profile');

// Rotas de torneio  
app.use('/api/tournament', tournamentRoutes);
console.log('✅ Rotas de torneio registradas em /api/tournament');

// Rota de teste para verificar se as rotas funcionam
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Rota de teste funcionando!',
        registeredRoutes: [
            '/api/health',
            '/api/info', 
            '/api/test',
            '/api/profile',
            '/api/profile/style-preferences',
            '/api/tournament/categories',
            '/api/tournament/start',
            '/api/tournament/choice'
        ],
        timestamp: new Date().toISOString()
    });
});

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
    console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /api/health',
            'GET /api/info',
            'GET /api/test',
            'GET /api/profile',
            'GET /api/profile/style-preferences',
            'GET /api/tournament/categories',
            'POST /api/tournament/start',
            'POST /api/tournament/choice'
        ],
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API Info: http://localhost:${PORT}/api/info`);
    console.log(`🧪 Teste: http://localhost:${PORT}/api/test`);
    console.log(`📋 Endpoints ativos:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/info`);
    console.log(`   GET  /api/test`);
    console.log(`   GET  /api/profile`);
    console.log(`   GET  /api/profile/style-preferences`);
    console.log(`   GET  /api/tournament/categories`);
    console.log(`   POST /api/tournament/start`);
    console.log(`   POST /api/tournament/choice`);
    console.log(`\n💡 Rotas registradas diretamente - sem imports dinâmicos!`);
});

export default app;
