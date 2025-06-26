// hooks/useTournament.ts - Hook personalizado para gerenciar torneios
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export interface TournamentCategory {
  name: string;
  description: string;
  icon: string;
  imageCount: number;
  available: boolean;
}

export interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  currentRound: number;
  totalRounds: number;
  remainingImages: number[];
  eliminatedImages: number[];
  currentMatchup: [number, number] | null;
  tournamentSize: number;
  startedAt: string;
  lastActivity: string;
  completedAt?: string;
  progressPercentage: number;
}

export interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  active: boolean;
  winRate: number;
  totalViews: number;
  totalSelections: number;
}

export interface TournamentMatchup {
  sessionId: string;
  roundNumber: number;
  imageA: TournamentImage;
  imageB: TournamentImage;
  startTime: string;
}

export interface TournamentResult {
  sessionId: string;
  userId: number;
  category: string;
  championId: number;
  finalistId?: number;
  semifinalists: number[];
  topChoices: number[];
  preferenceStrength: number;
  consistencyScore: number;
  decisionSpeedAvg: number;
  totalChoicesMade: number;
  roundsCompleted: number;
  sessionDurationMinutes: number;
  completionRate: number;
  styleProfile: any;
  dominantPreferences: any;
  completedAt: string;
}

export interface TournamentHistory {
  tournaments: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const useTournament = () => {
  const api = useApi();

  // Estados
  const [categories, setCategories] = useState<{ [key: string]: TournamentCategory }>({});
  const [currentSession, setCurrentSession] = useState<TournamentSession | null>(null);
  const [currentMatchup, setCurrentMatchup] = useState<TournamentMatchup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias disponíveis
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/tournament/categories');
      
      if (response.success) {
        setCategories(response.data);
      } else {
        throw new Error(response.message || 'Falha ao carregar categorias');
      }
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setError(err.message || 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Verificar sessão ativa
  const checkActiveSession = useCallback(async (category: string): Promise<TournamentSession | null> => {
    try {
      const response = await api.get(`/tournament/active/${category}`);
      
      if (response.success) {
        const session = response.data;
        setCurrentSession(session);
        return session;
      }
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('Erro ao verificar sessão ativa:', err);
      }
    }
    
    setCurrentSession(null);
    return null;
  }, [api]);

  // Iniciar novo torneio
  const startTournament = useCallback(async (
    category: string, 
    tournamentSize: number = 32
  ): Promise<TournamentSession> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/tournament/start', {
        category,
        tournamentSize
      });

      if (response.success) {
        const session = response.data;
        setCurrentSession(session);
        return session;
      } else {
        throw new Error(response.message || 'Falha ao iniciar torneio');
      }
    } catch (err: any) {
      console.error('Erro ao iniciar torneio:', err);
      setError(err.message || 'Erro ao iniciar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Carregar próximo confronto
  const loadNextMatchup = useCallback(async (sessionId: string): Promise<TournamentMatchup | null> => {
    try {
      setError(null);

      const response = await api.get(`/tournament/matchup/${sessionId}`);
      
      if (response.success) {
        const matchup = response.data;
        setCurrentMatchup(matchup);
        return matchup;
      } else {
        // Torneio finalizado
        setCurrentMatchup(null);
        return null;
      }
    } catch (err: any) {
      console.error('Erro ao carregar confronto:', err);
      
      if (err.status === 404) {
        // Torneio finalizado
        setCurrentMatchup(null);
        return null;
      }
      
      setError(err.message || 'Erro ao carregar confronto');
      throw err;
    }
  }, [api]);

  // Processar escolha do usuário
  const makeChoice = useCallback(async (
    sessionId: string,
    winnerId: number,
    responseTimeMs: number,
    confidenceLevel?: number
  ): Promise<TournamentSession> => {
    try {
      setError(null);

      const response = await api.post('/tournament/choice', {
        sessionId,
        winnerId,
        responseTimeMs,
        confidenceLevel
      });

      if (response.success) {
        const updatedSession = response.data;
        setCurrentSession(updatedSession);
        return updatedSession;
      } else {
        throw new Error(response.message || 'Falha ao processar escolha');
      }
    } catch (err: any) {
      console.error('Erro ao processar escolha:', err);
      setError(err.message || 'Erro ao processar escolha');
      throw err;
    }
  }, [api]);

  // Obter resultado do torneio
  const getTournamentResult = useCallback(async (sessionId: string): Promise<TournamentResult> => {
    try {
      setError(null);

      const response = await api.get(`/tournament/result/${sessionId}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Falha ao carregar resultado');
      }
    } catch (err: any) {
      console.error('Erro ao carregar resultado:', err);
      setError(err.message || 'Erro ao carregar resultado');
      throw err;
    }
  }, [api]);

  // Carregar histórico de torneios
  const loadTournamentHistory = useCallback(async (
    category?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<TournamentHistory> => {
    try {
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (category) {
        params.append('category', category);
      }

      const response = await api.get(`/tournament/history?${params.toString()}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Falha ao carregar histórico');
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.message || 'Erro ao carregar histórico');
      throw err;
    }
  }, [api]);

  // Carregar imagens de uma categoria
  const loadCategoryImages = useCallback(async (
    category: string,
    limit: number = 50
  ): Promise<TournamentImage[]> => {
    try {
      setError(null);

      const response = await api.get(`/tournament/images/${category}?limit=${limit}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Falha ao carregar imagens');
      }
    } catch (err: any) {
      console.error('Erro ao carregar imagens:', err);
      setError(err.message || 'Erro ao carregar imagens');
      throw err;
    }
  }, [api]);

  // Limpar estados
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setCurrentMatchup(null);
    setError(null);
  }, []);

  // Pausar torneio (para implementação futura)
  const pauseTournament = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setError(null);
      
      // Implementar endpoint de pause quando necessário
      console.log('Pausando torneio:', sessionId);
      
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          status: 'paused' as any
        });
      }
    } catch (err: any) {
      console.error('Erro ao pausar torneio:', err);
      setError(err.message || 'Erro ao pausar torneio');
    }
  }, [currentSession]);

  // Retomar torneio pausado
  const resumeTournament = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setError(null);
      
      // Implementar endpoint de resume quando necessário
      console.log('Retomando torneio:', sessionId);
      
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          status: 'active'
        });
      }
    } catch (err: any) {
      console.error('Erro ao retomar torneio:', err);
      setError(err.message || 'Erro ao retomar torneio');
    }
  }, [currentSession]);

  return {
    // Estados
    categories,
    currentSession,
    currentMatchup,
    loading,
    error,

    // Ações
    loadCategories,
    checkActiveSession,
    startTournament,
    loadNextMatchup,
    makeChoice,
    getTournamentResult,
    loadTournamentHistory,
    loadCategoryImages,
    clearSession,
    pauseTournament,
    resumeTournament,

    // Utilitários
    isSessionActive: currentSession?.status === 'active',
    isSessionCompleted: currentSession?.status === 'completed',
    hasActiveMatchup: !!currentMatchup,
    tournamentProgress: currentSession?.progressPercentage || 0
  };
};

export default useTournament;