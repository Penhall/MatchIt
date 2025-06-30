// server/app.js - Aplicação principal MatchIt com sistema de torneios
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rotas
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
        version: '1.1.0-tournaments'
    });
});

// Informações da API
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'MatchIt API',
            version: '1.1.0',
            features: [
                'Sistema de perfis',
                'Preferências de estilo',
                'Torneios 2x2',
                'Sistema de resultados',
                'Admin panel'
            ],
            endpoints: {
                profile: '/api/profile/*',
                tournaments: '/api/tournament/*'
            }
        }
    });
});

// Rotas principais
app.use('/api/profile', profileRoutes);
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
            'POST /api/tournament/start',
            'POST /api/tournament/choice',
            'GET /api/tournament/categories'
        ]
    });
});

// ========================================================================
// INICIALIZAÇÃO
//# ========================================================================

app.listen(PORT, () => {
    console.log('\n🚀 MatchIt API iniciada com sucesso!');
    console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`🏆 Sistema de torneios: ATIVO`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/api/tournament/admin/images`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
