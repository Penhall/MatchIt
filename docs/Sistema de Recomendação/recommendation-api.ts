// routes/recommendations.ts
import express from 'express';
import RecommendationService from '../services/RecommendationService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = express.Router();
const recommendationService = new RecommendationService();

// GET /api/recommendations - Obter recomendações para o usuário
router.get('/recommendations',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite deve ser entre 1 e 50'),
    query('algorithm').optional().isIn(['hybrid', 'collaborative', 'content']).withMessage('Algoritmo inválido'),
    query('refresh').optional().isBoolean().withMessage('Refresh deve ser boolean')
  ],
  validateRequest,
  async (req: any, res: express.Response) => {
    try {
      const userId = req.user.id;
      const options = {
        limit: parseInt(req.query.limit) || 20,
        algorithm: req.query.algorithm || 'hybrid',
        forceRefresh: req.query.refresh === 'true'
      };

      const recommendations = await recommendationService.getRecommendationsForUser(userId, options);
      
      res.json({
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível gerar recomendações no momento'
      });
    }
  }
);

// POST /api/recommendations/feedback - Registrar feedback do usuário
router.post('/recommendations/feedback',
  authenticateToken,
  [
    body('targetUserId').notEmpty().withMessage('ID do usuário alvo é obrigatório'),
    body('action').isIn(['like', 'dislike', 'super_like', 'skip']).withMessage('Ação inválida'),
    body('context').optional().isObject().withMessage('Contexto deve ser um objeto')
  ],
  validateRequest,
  async (req: any, res: express.Response) => {
    try {
      const userId = req.user.id;
      const { targetUserId, action, context } = req.body;

      await recommendationService.recordUserFeedback(userId, targetUserId, action, context);
      
      res.json({
        success: true,
        message: 'Feedback registrado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// GET /api/recommendations/stats - Estatísticas do usuário
router.get('/recommendations/stats',
  authenticateToken,
  async (req: any, res: express.Response) => {
    try {
      const userId = req.user.id;
      const stats = await recommendationService.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

export default router;

// middleware/validation.ts
import { validationResult } from 'express-validator';
import express from 'express';

export const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};

// hooks/useRecommendations.ts (React Hook)
import { useState, useEffect, useCallback } from 'react';
import { RecommendationResult, MatchScore } from '../types/recommendation';

interface UseRecommendationsReturn {
  recommendations: MatchScore[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  recordFeedback: (targetUserId: string, action: string, context?: any) => Promise<void>;
}

export const useRecommendations = (
  options: {
    limit?: number;
    algorithm?: 'hybrid' | 'collaborative' | 'content';
    autoRefresh?: boolean;
  } = {}
): UseRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { limit = 20, algorithm = 'hybrid', autoRefresh = true } = options;

  const fetchRecommendations = useCallback(async (refresh: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        algorithm,
        refresh: refresh.toString()
      });

      const response = await fetch(`/api/recommendations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar recomendações');
      }

      const result = await response.json();
      
      if (refresh) {
        setRecommendations(result.data.matches);
        setCurrentIndex(0);
      } else {
        setRecommendations(prev => [...prev, ...result.data.matches]);
      }
      
      setHasMore(result.data.matches.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [limit, algorithm, loading]);

  const refresh = useCallback(async () => {
    await fetchRecommendations(true);
  }, [fetchRecommendations]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchRecommendations(false);
    }
  }, [hasMore, loading, fetchRecommendations]);

  const recordFeedback = useCallback(async (
    targetUserId: string, 
    action: string, 
    context?: any
  ) => {
    try {
      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId,
          action,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar feedback');
      }

      // Remover o usuário das recomendações atuais
      setRecommendations(prev => prev.filter(rec => rec.userId !== targetUserId));
      
      // Se ficaram poucas recomendações, carregar mais
      if (recommendations.length <= 5 && hasMore) {
        await loadMore();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar feedback');
    }
  }, [recommendations.length, hasMore, loadMore]);

  useEffect(() => {
    if (autoRefresh) {
      fetchRecommendations(true);
    }
  }, [autoRefresh, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    recordFeedback
  };
};

// components/RecommendationCard.tsx
import React from 'react';
import { MatchScore } from '../types/recommendation';

interface RecommendationCardProps {
  match: MatchScore;
  onLike: () => void;
  onDislike: () => void;
  onSuperLike: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  match,
  onLike,
  onDislike,
  onSuperLike
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Muito Alta';
    if (score >= 0.6) return 'Alta';
    if (score >= 0.4) return 'Média';
    return 'Baixa';
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-cyan-500 transition-all duration-300">
      {/* Header com Score */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-gray-300 text-sm">Compatibilidade</span>
        </div>
        <div className={`text-lg font-bold ${getScoreColor(match.totalScore)}`}>
          {Math.round(match.totalScore * 100)}%
        </div>
      </div>

      {/* Breakdown de Scores */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Estilo:</span>
          <span className={getScoreColor(match.breakdown.styleCompatibility)}>
            {Math.round(match.breakdown.styleCompatibility * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Emocional:</span>
          <span className={getScoreColor(match.breakdown.emotionalCompatibility)}>
            {Math.round(match.breakdown.emotionalCompatibility * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Hobbies:</span>
          <span className={getScoreColor(match.breakdown.hobbyCompatibility)}>
            {Math.round(match.breakdown.hobbyCompatibility * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Localização:</span>
          <span className={getScoreColor(match.breakdown.locationScore)}>
            {Math.round(match.breakdown.locationScore * 100)}%
          </span>
        </div>
      </div>

      {/* Explicações */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Por que vocês combinam:</h4>
        <div className="space-y-1">
          {match.explanation.map((explanation, index) => (
            <div key={index} className="text-xs text-gray-400 flex items-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
              {explanation}
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onDislike}
          className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center hover:bg-red-500/30 transition-colors"
        >
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <button
          onClick={onSuperLike}
          className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center hover:bg-purple-500/30 transition-colors"
        >
          <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
        
        <button
          onClick={onLike}
          className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center hover:bg-green-500/30 transition-colors"
        >
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};