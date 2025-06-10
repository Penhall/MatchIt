// server/middleware/auth.js - Middleware de autenticação
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      const errorCode = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      return res.status(403).json({ 
        error: 'Token inválido',
        code: errorCode,
        message: err.message
      });
    }
    req.user = user;
    next();
  });
};

// Middleware opcional de autenticação (não bloqueia se não houver token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

export { authenticateToken, optionalAuth };

// =====================================================

// server/middleware/validation.js - Middleware de validação
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], req.body);
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios não preenchidos',
        missing: missing,
        code: 'VALIDATION_ERROR'
      });
    }

    next();
  };
};

const validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email) errors.push('Email é obrigatório');
  else if (!validateEmail(email)) errors.push('Email inválido');

  if (!password) errors.push('Senha é obrigatória');
  else if (!validatePassword(password)) errors.push('Senha deve ter pelo menos 6 caracteres');

  if (!name) errors.push('Nome é obrigatório');
  else if (name.trim().length < 2) errors.push('Nome deve ter pelo menos 2 caracteres');

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados de registro inválidos',
      details: errors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push('Email é obrigatório');
  if (!password) errors.push('Senha é obrigatória');

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados de login inválidos',
      details: errors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

export { 
  validateRequired, 
  validateRegistration, 
  validateLogin,
  validateEmail,
  validatePassword
};

// =====================================================

// server/middleware/errorHandler.js - Tratamento de erros
import { isDevelopment } from '../config/environment.js';

const errorHandler = (err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Log detalhado para desenvolvimento
  if (isDevelopment()) {
    console.error('Stack trace:', err.stack);
    console.error('Request:', {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }
  
  // Erro de validação do JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
  
  // Erro de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Erro de validação de dados
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Erro de database
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint errors
    return res.status(400).json({
      error: 'Erro de dados',
      message: 'Dados duplicados ou inválidos',
      code: 'DATABASE_CONSTRAINT_ERROR'
    });
  }
  
  // Erro genérico
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: isDevelopment() ? err.message : 'Algo deu errado',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};

export { errorHandler, notFoundHandler };

// =====================================================

// server/middleware/logger.js - Middleware de logging
import { isDevelopment } from '../config/environment.js';

const requestLogger = (req, res, next) => {
  if (isDevelopment()) {
    const start = Date.now();
    
    // Log da requisição
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    // Log adicional para dados importantes
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
      console.log('Body:', sanitizedBody);
    }
    
    // Log da resposta
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
  }
  
  next();
};

const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ 
          error: 'Request timeout',
          code: 'TIMEOUT'
        });
      }
    });
    next();
  };
};

export { requestLogger, timeoutMiddleware };

// =====================================================

// server/middleware/index.js - Configurador principal de middleware
import express from 'express';
import { configureCors } from '../config/cors.js';
import { requestLogger, timeoutMiddleware } from './logger.js';
import { isDevelopment } from '../config/environment.js';

const configureMiddleware = (app) => {
  // Middleware básico
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS
  app.use(configureCors());
  
  // Timeout
  app.use(timeoutMiddleware(30000));
  
  // Logging (apenas em desenvolvimento)
  if (isDevelopment()) {
    app.use(requestLogger);
  }
  
  console.log('✅ Middleware configurado');
};

export { configureMiddleware };
