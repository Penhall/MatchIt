// server/middleware/auth.js - Middleware de autenticação corrigido
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso obrigatório',
        code: 'MISSING_TOKEN'
      });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        console.error('❌ Token inválido:', err.message);
        return res.status(403).json({ 
          error: 'Token inválido ou expirado',
          code: 'INVALID_TOKEN'
        });
      }
      
      req.user = user;
      console.log('✅ Usuário autenticado:', user.id || user.email);
      next();
    });
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      code: 'AUTH_ERROR'
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, config.jwt.secret, (err, user) => {
        if (!err) {
          req.user = user;
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    next();
  }
};

// EXPORTS COMPATÍVEIS
export { authenticateToken, optionalAuth };
export default authenticateToken;
export { authenticateToken as authMiddleware };
