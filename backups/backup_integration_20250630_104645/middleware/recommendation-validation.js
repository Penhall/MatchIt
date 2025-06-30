// middleware/recommendation-validation.js
// Middleware especializado para validação das APIs de recomendação do MatchIt

import { body, query, param, validationResult } from 'express-validator';

/**
 * Middleware para processar e retornar erros de validação
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados de entrada inválidos',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Validações para GET /api/recommendations
 */
export const validateGetRecommendations = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite deve ser entre 1 e 50')
    .toInt(),
    
  query('algorithm')
    .optional()
    .isIn(['hybrid', 'collaborative', 'content', 'style_based', 'location_based'])
    .withMessage('Algoritmo deve ser: hybrid, collaborative, content, style_based ou location_based'),
    
  query('refresh')
    .optional()
    .isBoolean()
    .withMessage('Refresh deve ser true ou false')
    .toBoolean(),
    
  query('minScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Score mínimo deve ser entre 0 e 1')
    .toFloat(),
    
  query('maxDistance')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Distância máxima deve ser entre 1 e 500 km')
    .toInt(),
    
  query('ageRange')
    .optional()
    .matches(/^\d{2}-\d{2}$/)
    .withMessage('Faixa etária deve estar no formato: 18-30'),
    
  handleValidationErrors
];

/**
 * Validações para POST /api/recommendations/feedback
 */
export const validateRecommendationFeedback = [
  body('targetUserId')
    .notEmpty()
    .withMessage('ID do usuário alvo é obrigatório')
    .isUUID()
    .withMessage('ID do usuário alvo deve ser um UUID válido'),
    
  body('action')
    .isIn(['like', 'dislike', 'super_like', 'skip', 'view', 'report'])
    .withMessage('Ação deve ser: like, dislike, super_like, skip, view ou report'),
    
  body('context')
    .optional()
    .isObject()
    .withMessage('Contexto deve ser um objeto'),
    
  body('context.viewTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tempo de visualização deve ser um número positivo'),
    
  body('context.sessionId')
    .optional()
    .isUUID()
    .withMessage('Session ID deve ser um UUID válido'),
    
  body('context.deviceType')
    .optional()
    .isIn(['mobile', 'tablet', 'desktop'])
    .withMessage('Tipo de dispositivo deve ser: mobile, tablet ou desktop'),
    
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata deve ser um objeto'),
    
  handleValidationErrors
];

/**
 * Validações para PUT /api/recommendations/weights
 */
export const validateUpdateWeights = [
  body('weights')
    .isObject()
    .withMessage('Pesos devem ser um objeto'),
    
  body('weights.style_compatibility')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Peso de compatibilidade de estilo deve ser entre 0 e 1'),
    
  body('weights.location')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Peso de localização deve ser entre 0 e 1'),
    
  body('weights.personality')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Peso de personalidade deve ser entre 0 e 1'),
    
  body('weights.lifestyle')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Peso de lifestyle deve ser entre 0 e 1'),
    
  body('weights.activity')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Peso de atividade deve ser entre 0 e 1'),
    
  // Validação customizada para verificar se a soma dos pesos não excede 1.2
  body('weights').custom((weights) => {
    const total = Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0);
    if (total > 1.2) {
      throw new Error('Soma dos pesos não pode exceder 1.2');
    }
    return true;
  }),
    
  handleValidationErrors
];

/**
 * Validações para GET /api/recommendations/stats
 */
export const validateGetStats = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year', 'all'])
    .withMessage('Período deve ser: day, week, month, year ou all'),
    
  query('metrics')
    .optional()
    .isArray()
    .withMessage('Métricas deve ser um array'),
    
  query('includeBreakdown')
    .optional()
    .isBoolean()
    .withMessage('Include breakdown deve ser true ou false')
    .toBoolean(),
    
  handleValidationErrors
];

/**
 * Validações para POST /api/recommendations/session
 */
export const validateStartSession = [
  body('context')
    .optional()
    .isObject()
    .withMessage('Contexto deve ser um objeto'),
    
  body('context.deviceType')
    .optional()
    .isIn(['mobile', 'tablet', 'desktop'])
    .withMessage('Tipo de dispositivo deve ser: mobile, tablet ou desktop'),
    
  body('context.location')
    .optional()
    .isObject()
    .withMessage('Localização deve ser um objeto'),
    
  body('context.location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude deve ser entre -90 e 90'),
    
  body('context.location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude deve ser entre -180 e 180'),
    
  handleValidationErrors
];

/**
 * Middleware para verificar se o usuário tem perfil completo
 */
export const requireCompleteProfile = async (req, res, next) => {
  try {
    // Verificar se o usuário existe no middleware de autenticação
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }
    
    // Verificar completude do perfil
    // (Esta verificação seria feita no banco de dados)
    const minCompletionRequired = 0.7; // 70% mínimo
    
    // Por enquanto, apenas log - implementação completa seria feita com query ao banco
    console.log(`Verificando perfil para usuário ${req.user.userId}`);
    
    next();
  } catch (error) {
    console.error('Erro ao verificar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para rate limiting específico de recomendações
 */
export const recommendationRateLimit = (req, res, next) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado'
    });
  }
  
  // Implementação básica de rate limiting
  // Em produção, usar Redis ou similar
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 30; // 30 requests por minuto
  
  if (!global.recommendationRateLimit) {
    global.recommendationRateLimit = new Map();
  }
  
  const userRequests = global.recommendationRateLimit.get(userId) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Muitas requisições',
      message: 'Aguarde um momento antes de fazer nova requisição',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
  
  recentRequests.push(now);
  global.recommendationRateLimit.set(userId, recentRequests);
  
  next();
};

/**
 * Middleware para logging de requisições de recomendação
 */
export const logRecommendationRequest = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[RECOMMENDATION] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${req.user?.userId || 'anonymous'}`);
  });
  
  next();
};

/**
 * Validações agregadas por endpoint
 */
export const validationRules = {
  getRecommendations: validateGetRecommendations,
  postFeedback: validateRecommendationFeedback,
  updateWeights: validateUpdateWeights,
  getStats: validateGetStats,
  startSession: validateStartSession
};

/**
 * Middlewares agregados por funcionalidade
 */
export const middlewares = {
  requireCompleteProfile,
  recommendationRateLimit,
  logRecommendationRequest,
  handleValidationErrors
};