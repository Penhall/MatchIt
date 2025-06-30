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
