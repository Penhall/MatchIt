// server/middleware/securityMiddleware.js - Middleware avançado de segurança (ESM)
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'; // Importar jwt no topo

// Rate limiting configurável por endpoint
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Pular rate limiting para admins em desenvolvimento
      return process.env.NODE_ENV === 'development' && req.user?.isAdmin;
    }
  });
};

// Rate limits específicos
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  5, // 5 tentativas
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
);

export const tournamentLimiter = createRateLimit(
  60 * 1000, // 1 minuto
  10, // 10 torneios por minuto
  'Limite de torneios por minuto excedido.'
);

export const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hora
  20, // 20 uploads por hora
  'Limite de uploads por hora excedido.'
);

export const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  1000, // 1000 requests por IP
  'Limite de API excedido.'
);

// Validação de entrada sanitizada
export const sanitizeInput = (field, options = {}) => {
  const {
    minLength = 1,
    maxLength = 255,
    allowEmpty = false,
    customValidator
  } = options;

  const validators = [
    body(field)
      .trim()
      .escape() // Escapar caracteres HTML
  ];

  if (!allowEmpty) {
    validators.push(body(field).notEmpty().withMessage(`${field} é obrigatório`));
  }

  if (minLength > 0) {
    validators.push(
      body(field)
        .isLength({ min: minLength })
        .withMessage(`${field} deve ter pelo menos ${minLength} caracteres`)
    );
  }

  if (maxLength > 0) {
    validators.push(
      body(field)
        .isLength({ max: maxLength })
        .withMessage(`${field} deve ter no máximo ${maxLength} caracteres`)
    );
  }

  if (customValidator) {
    validators.push(body(field).custom(customValidator));
  }

  return validators;
};

// Validadores comuns
export const emailValidator = () => [
  ...sanitizeInput('email', { maxLength: 100 }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('email')
    .custom(async (email) => {
      // Verificar domínios suspeitos
      const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      
      if (suspiciousDomains.includes(domain)) {
        throw new Error('Domínio de email temporário não permitido');
      }
      
      return true;
    })
];

export const passwordValidator = () => [
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres'),
  body('password')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número')
];

export const nameValidator = () => sanitizeInput('name', {
  minLength: 2,
  maxLength: 50,
  customValidator: (name) => {
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
      throw new Error('Nome deve conter apenas letras e espaços');
    }
    return true;
  }
});

// Middleware de validação de resultado
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errorMessages
    });
  }
  
  next();
};

// Middleware de detecção de IP suspeito
export const suspiciousIPDetection = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  
  // Lista de IPs bloqueados (em produção, usar Redis ou banco)
  const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];
  
  if (blockedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado'
    });
  }
  
  // Detectar bots suspeitos
  const suspiciousAgents = ['curl', 'wget', 'python', 'bot', 'spider', 'crawler'];
  const isSuspicious = suspiciousAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  );
  
  if (isSuspicious && process.env.NODE_ENV === 'production') {
    console.log(`Acesso suspeito detectado: IP=${clientIP}, UserAgent=${userAgent}`);
    
    // Em produção, pode bloquear ou aplicar rate limiting mais restritivo
    return res.status(429).json({
      success: false,
      message: 'Acesso automatizado detectado'
    });
  }
  
  // Adicionar informações de segurança ao request
  req.security = {
    clientIP,
    userAgent,
    isSuspicious,
    timestamp: new Date().toISOString()
  };
  
  next();
};

// Middleware de Content Security Policy
export const cspMiddleware = (req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'"
  ].join('; '));
  
  next();
};

// Middleware de headers de segurança adicionais
export const securityHeaders = (req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Força HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Remover header que revela tecnologia
  res.removeHeader('X-Powered-By');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// Middleware de logging de segurança
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log original do Express
  const originalSend = res.send;
  
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log de eventos de segurança importantes
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.log(`[SECURITY] ${new Date().toISOString()} - ${req.method} ${req.path} - Status: ${res.statusCode} - IP: ${req.security?.clientIP} - Duration: ${duration}ms`);
    }
    
    // Log de endpoints sensíveis
    const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/tournament/admin/'];
    const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    if (isSensitive) {
      console.log(`[SENSITIVE] ${new Date().toISOString()} - ${req.method} ${req.path} - Status: ${res.statusCode} - User: ${req.user?.id || 'anonymous'} - IP: ${req.security?.clientIP}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware de verificação de token JWT avançado
export const advancedAuthMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se token não foi emitido no futuro
    if (decoded.iat > Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    // Verificar blacklist de tokens (implementar cache Redis em produção)
    const tokenBlacklist = new Set(); // Em produção, usar Redis
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token revogado'
      });
    }
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Middleware de verificação de admin
export const adminMiddleware = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso administrativo requerido'
    });
  }
  next();
};

// Middleware de CORS avançado
export const advancedCorsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://matchit.app',
    'https://admin.matchit.app'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

// Middleware de prevenção de ataques de timing
export const timingAttackPrevention = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Para endpoints de autenticação, adicionar delay mínimo para prevenir timing attacks
    if (req.path.includes('/auth/') && duration < 100) {
      setTimeout(() => {}, 100 - duration);
    }
  });
  
  next();
};
