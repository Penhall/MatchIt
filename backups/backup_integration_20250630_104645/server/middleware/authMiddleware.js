// server/middleware/authMiddleware.js - Middleware de autenticação melhorado (ES Modules)
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'matchit-secret-key-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Middleware de autenticação obrigatória
 */
export const authMiddleware = async (req, res, next) => {
    try {
        // Extrair token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token de acesso obrigatório',
                code: 'MISSING_TOKEN'
            });
        }
        
        // Verificar formato do token (Bearer <token>)
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Formato de token inválido. Use: Bearer <token>',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        const token = authHeader.substring(7); // Remove "Bearer "
        
        // Para desenvolvimento, aceitar token "test-token"
        if (process.env.NODE_ENV === 'development' && token === 'test-token') {
            req.user = {
                id: 1,
                userId: 1,
                name: 'Usuário Teste',
                email: 'teste@matchit.com',
                isTestUser: true
            };
            return next();
        }
        
        // Verificar e decodificar JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            } else {
                throw jwtError;
            }
        }
        
        // Buscar usuário no banco de dados
        const userResult = await query(
            'SELECT id, name, email, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = userResult.rows[0];
        
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: 'Conta desativada',
                code: 'ACCOUNT_DISABLED'
            });
        }
        
        // Adicionar informações do usuário à requisição
        req.user = {
            id: user.id,
            userId: user.id, // Para compatibilidade
            name: user.name,
            email: user.email,
            isActive: user.is_active,
            tokenData: decoded
        };
        
        next();
        
    } catch (error) {
        console.error('❌ Erro no middleware de autenticação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno de autenticação',
            code: 'AUTH_INTERNAL_ERROR'
        });
    }
};

/**
 * Middleware de autenticação opcional (não bloqueia se não houver token)
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // Se não há token, continuar sem autenticação
        if (!authHeader) {
            req.user = null;
            return next();
        }
        
        // Se há token, tentar autenticar
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            // Para desenvolvimento, aceitar token "test-token"
            if (process.env.NODE_ENV === 'development' && token === 'test-token') {
                req.user = {
                    id: 1,
                    userId: 1,
                    name: 'Usuário Teste',
                    email: 'teste@matchit.com',
                    isTestUser: true
                };
                return next();
            }
            
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                
                // Buscar usuário no banco
                const userResult = await query(
                    'SELECT id, name, email, is_active FROM users WHERE id = $1',
                    [decoded.userId]
                );
                
                if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
                    const user = userResult.rows[0];
                    req.user = {
                        id: user.id,
                        userId: user.id,
                        name: user.name,
                        email: user.email,
                        isActive: user.is_active,
                        tokenData: decoded
                    };
                } else {
                    req.user = null;
                }
                
            } catch (jwtError) {
                // Token inválido ou expirado, mas não bloquear a requisição
                req.user = null;
            }
        } else {
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        console.error('❌ Erro no middleware de autenticação opcional:', error);
        req.user = null;
        next();
    }
};

/**
 * Middleware para verificar se usuário é admin
 */
export const adminOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticação obrigatória',
                code: 'AUTHENTICATION_REQUIRED'
            });
        }
        
        // Verificar se usuário é admin no banco
        const adminResult = await query(
            'SELECT is_admin FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
            return res.status(403).json({
                success: false,
                error: 'Acesso restrito a administradores',
                code: 'ADMIN_REQUIRED'
            });
        }
        
        req.user.isAdmin = true;
        next();
        
    } catch (error) {
        console.error('❌ Erro no middleware de admin:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno de autorização',
            code: 'AUTHORIZATION_ERROR'
        });
    }
};

/**
 * Gerar token JWT para usuário
 */
export const generateToken = (userId, additionalData = {}) => {
    const payload = {
        userId,
        ...additionalData,
        iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verificar token sem fazer query no banco (para verificações rápidas)
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Middleware para rate limiting básico por usuário
 */
const userRequests = new Map();

export const rateLimitByUser = (maxRequests = 100, windowMinutes = 15) => {
    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        const windowMs = windowMinutes * 60 * 1000;
        
        if (!userRequests.has(userId)) {
            userRequests.set(userId, []);
        }
        
        const requests = userRequests.get(userId);
        
        // Limpar requests antigos
        const validRequests = requests.filter(time => now - time < windowMs);
        
        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Muitas requisições. Tente novamente em alguns minutos.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
            });
        }
        
        validRequests.push(now);
        userRequests.set(userId, validRequests);
        
        next();
    };
};

/**
 * Middleware para log de requisições autenticadas
 */
export const logAuthenticatedRequests = (req, res, next) => {
    if (req.user && process.env.NODE_ENV === 'development') {
        console.log('🔐 Authenticated request:', {
            userId: req.user.id,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent')?.substring(0, 50),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// Limpeza periódica do rate limiting
setInterval(() => {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 horas
    
    for (const [userId, requests] of userRequests.entries()) {
        const validRequests = requests.filter(time => now - time < cleanupThreshold);
        if (validRequests.length === 0) {
            userRequests.delete(userId);
        } else {
            userRequests.set(userId, validRequests);
        }
    }
}, 60 * 60 * 1000); // Limpar a cada hora

export default {
    authMiddleware,
    optionalAuth,
    adminOnly,
    generateToken,
    verifyToken,
    rateLimitByUser,
    logAuthenticatedRequests
};