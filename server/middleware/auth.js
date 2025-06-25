// server/middleware/auth.js - Middleware de Autenticação JWT
const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = (req, res, next) => {
  // Obter token do header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  // Verificar token
  const secret = process.env.JWT_SECRET || 'default-secret-change-this';
  
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(403).json({
        success: false,
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }

    // Adicionar dados do usuário ao request
    req.user = user;
    next();
  });
};

/**
 * Middleware para autenticação opcional
 * (não falha se não houver token, mas adiciona user se houver)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  const secret = process.env.JWT_SECRET || 'default-secret-change-this';
  
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * Middleware para verificar se usuário é admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação requerida'
      });
    }

    // Verificar se usuário é admin no banco de dados
    // Por simplicidade, vamos usar email específico por enquanto
    const adminEmails = ['admin@matchit.com', 'admin@test.com'];
    
    // Em produção, isso deveria vir do banco de dados
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({
        success: false,
        error: 'Permissões de administrador requeridas'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erro na verificação de admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para rate limiting por usuário
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const now = Date.now();
    const userRequests = requests.get(userId) || [];

    // Remover requests antigas
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Muitas requisições. Tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Adicionar nova requisição
    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
};

/**
 * Middleware para log de ações do usuário
 */
const logUserAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(`👤 User ${req.user.userId} - ${action} - ${req.method} ${req.path}`);
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  userRateLimit,
  logUserAction
};