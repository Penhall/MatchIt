// server/middleware/auth.js - Middleware de autenticação corrigido com debug
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'matchit-secret-development-2025';

/**
 * Middleware de autenticação robusto com debug
 */
export const authenticateToken = async (req, res, next) => {
    try {
        console.log('🔍 [AUTH] Iniciando validação de token...');
        console.log('🔍 [AUTH] URL:', req.method, req.path);
        console.log('🔍 [AUTH] Headers Authorization:', req.headers.authorization ? 'presente' : 'ausente');
        
        // Extrair token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('❌ [AUTH] Header Authorization não encontrado');
            return res.status(401).json({
                success: false,
                error: 'Token de acesso obrigatório',
                code: 'MISSING_TOKEN'
            });
        }
        
        // Verificar formato do token (Bearer <token>)
        if (!authHeader.startsWith('Bearer ')) {
            console.log('❌ [AUTH] Formato inválido, header completo:', authHeader);
            return res.status(401).json({
                success: false,
                error: 'Formato de token inválido. Use: Bearer <token>',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        // 🔧 CORREÇÃO: Extração mais robusta do token
        const token = authHeader.substring(7).trim(); // Remove "Bearer " e espaços
        console.log('🔍 [AUTH] Token extraído:', token.substring(0, 20) + '...');
        
        // Para desenvolvimento, aceitar token "test-token"
        if (process.env.NODE_ENV === 'development' && token === 'test-token') {
            console.log('✅ [AUTH] Usando token de teste para desenvolvimento');
            req.user = {
                id: 1,
                userId: 1,
                name: 'Usuário Teste',
                email: 'teste@matchit.com',
                isTestUser: true
            };
            return next();
        }
        
        // Verificar se token não está vazio
        if (!token || token.length < 10) {
            console.log('❌ [AUTH] Token vazio ou muito curto:', token);
            return res.status(401).json({
                success: false,
                error: 'Token inválido',
                code: 'EMPTY_TOKEN'
            });
        }
        
        // 🔧 CORREÇÃO: Verificar e decodificar JWT com melhor error handling
        let decoded;
        try {
            console.log('🔍 [AUTH] Verificando JWT com secret:', JWT_SECRET.substring(0, 10) + '...');
            decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ [AUTH] JWT válido, payload:', JSON.stringify(decoded, null, 2));
        } catch (jwtError) {
            console.error('❌ [AUTH] Erro JWT:', jwtError.name, ':', jwtError.message);
            
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
            } else if (jwtError.name === 'NotBeforeError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token ainda não é válido',
                    code: 'TOKEN_NOT_ACTIVE'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Falha na validação do token',
                    code: 'TOKEN_VALIDATION_FAILED'
                });
            }
        }
        
        // 🔧 CORREÇÃO: Aceitar tanto userId quanto id no payload
        const userId = decoded.userId || decoded.id;
        
        if (!userId) {
            console.log('❌ [AUTH] Nenhum userId ou id encontrado no token payload:', decoded);
            return res.status(401).json({
                success: false,
                error: 'Token inválido: userId não encontrado',
                code: 'MISSING_USER_ID'
            });
        }
        
        console.log('🔍 [AUTH] UserId extraído do token:', userId);
        
        // Buscar usuário no banco de dados
        try {
            console.log('🔍 [AUTH] Buscando usuário no banco:', userId);
            
            const userResult = await pool.query(
                'SELECT id, name, email, is_active FROM users WHERE id = $1',
                [userId]
            );
            
            console.log('🔍 [AUTH] Resultado da consulta:', userResult.rows.length, 'usuários encontrados');
            
            if (userResult.rows.length === 0) {
                console.log('❌ [AUTH] Usuário não encontrado no banco:', userId);
                return res.status(401).json({
                    success: false,
                    error: 'Usuário não encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }
            
            const user = userResult.rows[0];
            console.log('✅ [AUTH] Usuário encontrado:', user.email);
            
            if (!user.is_active) {
                console.log('❌ [AUTH] Usuário inativo:', user.email);
                return res.status(401).json({
                    success: false,
                    error: 'Usuário inativo',
                    code: 'USER_INACTIVE'
                });
            }
            
            // 🔧 CORREÇÃO: Incluir todas as informações necessárias
            req.user = {
                id: user.id,
                userId: user.id, // Para compatibilidade
                name: user.name,
                email: user.email,
                isActive: user.is_active
            };
            
            console.log('✅ [AUTH] Autenticação bem-sucedida para:', user.email);
            next();
            
        } catch (dbError) {
            console.error('💥 [AUTH] Erro de banco de dados:', dbError);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                code: 'DATABASE_ERROR'
            });
        }
        
    } catch (error) {
        console.error('💥 [AUTH] Erro interno no middleware:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

/**
 * Middleware de autenticação opcional (não falha se não autenticado)
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }
        
        // Usar o middleware obrigatório, mas capturar erros
        await authenticateToken(req, res, (err) => {
            if (err) {
                // Se houve erro na autenticação, continuar sem usuário
                req.user = null;
            }
            next();
        });
        
    } catch (error) {
        // Em caso de erro, continuar sem autenticação
        req.user = null;
        next();
    }
};

export default authenticateToken;