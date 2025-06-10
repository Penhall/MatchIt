// server/utils/constants.js - Constantes globais da aplicação
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_CODES = {
  // Auth errors
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  REGISTRATION_ERROR: 'REGISTRATION_ERROR',
  LOGIN_ERROR: 'LOGIN_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  
  // Profile errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_UPDATE_ERROR: 'PROFILE_UPDATE_ERROR',
  STYLE_CHOICES_ERROR: 'STYLE_CHOICES_ERROR',
  
  // Match errors
  MATCH_NOT_FOUND: 'MATCH_NOT_FOUND',
  MATCH_ALREADY_EXISTS: 'MATCH_ALREADY_EXISTS',
  MATCH_CREATION_ERROR: 'MATCH_CREATION_ERROR',
  INVALID_MATCH_STATUS: 'INVALID_MATCH_STATUS',
  
  // Recommendation errors
  RECOMMENDATIONS_ERROR: 'RECOMMENDATIONS_ERROR',
  FEEDBACK_ERROR: 'FEEDBACK_ERROR',
  INVALID_ACTION: 'INVALID_ACTION',
  
  // Chat errors
  MESSAGE_SEND_ERROR: 'MESSAGE_SEND_ERROR',
  EMPTY_MESSAGE: 'EMPTY_MESSAGE',
  UNAUTHORIZED_MATCH: 'UNAUTHORIZED_MATCH',
  
  // Product errors
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCTS_FETCH_ERROR: 'PRODUCTS_FETCH_ERROR',
  
  // Subscription errors
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  INVALID_PLAN_TYPE: 'INVALID_PLAN_TYPE',
  SUBSCRIPTION_ERROR: 'SUBSCRIPTION_ERROR',
  
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT'
};

export const USER_ACTIONS = {
  LIKE: 'like',
  DISLIKE: 'dislike',
  SUPER_LIKE: 'super_like',
  SKIP: 'skip',
  REPORT: 'report',
  BLOCK: 'block'
};

export const MATCH_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  EMOJI: 'emoji',
  SYSTEM: 'system'
};

export const SUBSCRIPTION_PLANS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending'
};

export const PRODUCT_CATEGORIES = {
  SNEAKERS: 'sneakers',
  CLOTHING: 'clothing',
  ACCESSORIES: 'accessories',
  BAGS: 'bags',
  ELECTRONICS: 'electronics'
};

export const STYLE_CATEGORIES = {
  TENIS: 'tenis',
  ROUPAS: 'roupas',
  CORES: 'cores',
  HOBBIES: 'hobbies',
  SENTIMENTOS: 'sentimentos'
};

export const RECOMMENDATION_ALGORITHMS = {
  HYBRID: 'hybrid',
  COLLABORATIVE: 'collaborative',
  CONTENT: 'content',
  BASIC_FALLBACK: 'basic_fallback'
};

export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5 // máximo 5 tentativas de login por IP
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por IP
  },
  RECOMMENDATIONS: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10 // máximo 10 requests de recomendação por minuto
  }
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
};

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// =====================================================

// server/utils/helpers.js - Funções auxiliares e utilitários
import { pool } from '../config/database.js';
import { config } from '../config/environment.js';

// Função de graceful shutdown
export const gracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    console.log(`🛑 Recebido ${signal}, iniciando shutdown graceful...`);
    
    try {
      // Parar de aceitar novas conexões
      server.close(() => {
        console.log('✅ Servidor HTTP fechado');
      });
      
      // Fechar pool de conexões do banco
      await pool.end();
      console.log('✅ Pool de conexões PostgreSQL fechado');
      
      setTimeout(() => {
        console.log('👋 Servidor encerrado com sucesso');
        process.exit(0);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro durante shutdown:', error);
      process.exit(1);
    }
  };

  // Registrar handlers de shutdown
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handler para errors não capturados
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });
};

// Função para gerar ID único
export const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
};

// Função para validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para sanitizar string
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

// Função para formatar preço
export const formatPrice = (price, currency = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(price);
};

// Função para calcular distância entre coordenadas
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Função para calcular idade
export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Função para padronizar resposta de API
export const createApiResponse = (success = true, data = null, error = null, meta = {}) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...meta
  };
  
  if (success) {
    response.data = data;
  } else {
    response.error = error;
  }
  
  return response;
};

// Função para log estruturado
export const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  
  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  
  debug: (message, data = {}) => {
    if (config.nodeEnv === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};

// Função para retry de operações
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      logger.warn(`Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms`, { error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Função para paginar resultados
export const paginate = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

// Função para validar parâmetros de paginação
export const validatePagination = (page, limit, maxLimit = 100) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  return { page: validPage, limit: validLimit };
};

// Função para escapar SQL (básica)
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Função para verificar se valor está vazio
export const isEmpty = (value) => {
  return value === null || value === undefined || value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value).length === 0);
};

// Função para delay
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para transformar objeto em query string
export const objectToQueryString = (obj) => {
  return Object.keys(obj)
    .filter(key => !isEmpty(obj[key]))
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};

// Função para mask de dados sensíveis
export const maskSensitiveData = (data) => {
  const masked = { ...data };
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];
  
  sensitiveFields.forEach(field => {
    if (masked[field]) {
      masked[field] = '[MASKED]';
    }
  });
  
  return masked;
};

// Função para gerar hash simples
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Função para randomizar array
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default {
  gracefulShutdown,
  generateId,
  isValidEmail,
  sanitizeString,
  formatPrice,
  calculateDistance,
  calculateAge,
  createApiResponse,
  logger,
  retryOperation,
  paginate,
  validatePagination,
  escapeHtml,
  isEmpty,
  delay,
  objectToQueryString,
  maskSensitiveData,
  simpleHash,
  shuffleArray
};
