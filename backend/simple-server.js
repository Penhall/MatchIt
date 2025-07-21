// simple-server.js - Servidor simplificado para teste sem banco
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// CORS configurado para desenvolvimento
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MatchIt API funcionando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        cors: 'enabled'
    });
});

// Endpoint de teste
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de teste funcionando!',
        origin: req.headers.origin
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor simples rodando em http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
});