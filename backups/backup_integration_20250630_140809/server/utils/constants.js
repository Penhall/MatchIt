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