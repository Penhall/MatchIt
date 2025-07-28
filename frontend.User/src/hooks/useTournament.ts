import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

export interface TournamentCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageCount: number;
  available: boolean;
  color: string;
  icon: string;
}

export interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentRound: number;
  totalRounds: number;
  progressPercentage: number;
  startedAt: string;
}

export interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
}

export const useTournament = () => {
  const api = useApi();
  const { user } = useAuth();

  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [currentSession, setCurrentSession] = useState<TournamentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/tournament/categories');
      
      if (response?.data?.success && response.data.categories) {
        setCategories(response.data.categories);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setError('Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Iniciar torneio
  const startTournament = useCallback(async (categoryId: string): Promise<TournamentSession | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/tournament/start', {
        category: categoryId,
        tournamentSize: 16
      });

      if (response?.data?.session) {
        setCurrentSession(response.data.session);
        return response.data.session;
      }

      return null;
    } catch (err: any) {
      setError('Falha ao iniciar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Carregar categorias na inicialização
  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user, loadCategories]);

  return {
    // Estados
    categories,
    currentSession,
    loading,
    error,
    
    // Ações
    loadCategories,
    startTournament,
    setCurrentSession,
    
    // Utilitários
    clearError: () => setError(null)
  };
};
