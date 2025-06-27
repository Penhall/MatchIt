// hooks/useTournament.ts - Hook personalizado para gerenciamento de torneios
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[];
  active: boolean;
  approved: boolean;
  winRate: number;
  totalViews: number;
  totalSelections: number;
}

export interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentRound: number;
  totalRounds: number;
  remainingImages: number[];
  tournamentSize: number;
  progressPercentage: number;
  choicesMade: number;
  totalChoices: number;
  startedAt: string;
  lastActivity: string;
  completedAt?: string;
}

export interface TournamentMatchup {
  sessionId: string;
  roundNumber: number;
  matchupSequence: number;
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
  insights: string[];
  recommendations: string[];
}

export interface TournamentCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageCount: number;
  approvedCount: number;
  pendingCount: number;
  color: string;
  icon: string;
  available: boolean;
  lastPlayed?: string;
  averageCompletionTime?: number;
  popularityScore?: number;
}

export interface TournamentChoice {
  sessionId: string;
  winnerId: number;
  loserId?: number;
  responseTimeMs: number;
  confidence: number;
  roundNumber?: number;
  matchupSequence?: number;
}

export interface TournamentStats {
  totalTournaments: number;
  completedTournaments: number;
  averageCompletionTime: number;
  averageChoiceTime: number;
  fastChoicesCount: number;
  preferredCategories: string[];
  consistencyScore: number;
  lastPlayedCategory: string;
  totalChoicesMade: number;
  winRateByCategory: Record<string, number>;
}

// =====================================================
// CUSTOM HOOK
// =====================================================

export const useTournament = () => {
  const api = useApi();
  const { user } = useAuth();

  // Core states
  const [categories, setCategories] = useState<Record<string, TournamentCategory>>({});
  const [currentSession, setCurrentSession] = useState<TournamentSession | null>(null);
  const [currentMatchup, setCurrentMatchup] = useState<TournamentMatchup | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentResult[]>([]);
  const [userStats, setUserStats] = useState<TournamentStats | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [choiceLoading, setChoiceLoading] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // =====================================================
  // CATEGORIES MANAGEMENT
  // =====================================================

  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);
      setError(null);

      const response = await api.get('/tournament/categories');
      
      if (response?.data) {
        const categoriesMap: Record<string, TournamentCategory> = {};
        response.data.forEach((cat: TournamentCategory) => {
          categoriesMap[cat.id] = cat;
        });
        setCategories(categoriesMap);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError('Falha ao carregar categorias de torneio');
    } finally {
      setCategoryLoading(false);
    }
  }, [api]);

  const getCategoryById = useCallback((categoryId: string): TournamentCategory | null => {
    return categories[categoryId] || null;
  }, [categories]);

  const getAvailableCategories = useCallback((): TournamentCategory[] => {
    return Object.values(categories).filter(cat => cat.available && cat.approvedCount >= 4);
  }, [categories]);

  const getPopularCategories = useCallback((): TournamentCategory[] => {
    return Object.values(categories)
      .filter(cat => cat.available && cat.approvedCount >= 4)
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 5);
  }, [categories]);

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  const startTournament = useCallback(async (categoryId: string, tournamentSize: number = 16): Promise<{
    session: TournamentSession;
    firstMatchup: TournamentMatchup;
  } | null> => {
    try {
      setSessionLoading(true);
      setSessionError(null);

      const response = await api.post('/tournament/start', {
        category: categoryId,
        tournamentSize
      });

      if (response?.data) {
        const { session, firstMatchup } = response.data;
        setCurrentSession(session);
        setCurrentMatchup(firstMatchup);
        return response.data;
      }

      return null;
    } catch (err: any) {
      console.error('Failed to start tournament:', err);
      const errorMessage = err.response?.data?.message || 'Falha ao iniciar torneio';
      setSessionError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSessionLoading(false);
    }
  }, [api]);

  const checkActiveSession = useCallback(async (categoryId: string): Promise<TournamentSession | null> => {
    try {
      const response = await api.get(`/tournament/active/${categoryId}`);
      return response?.data || null;
    } catch (err: any) {
      console.error('Failed to check active session:', err);
      return null;
    }
  }, [api]);

  const resumeSession = useCallback(async (sessionId: string): Promise<{
    session: TournamentSession;
    currentMatchup: TournamentMatchup;
  } | null> => {
    try {
      setSessionLoading(true);
      setSessionError(null);

      const [sessionResponse, matchupResponse] = await Promise.all([
        api.get(`/tournament/session/${sessionId}`),
        api.get(`/tournament/matchup/${sessionId}`)
      ]);

      if (sessionResponse?.data && matchupResponse?.data) {
        setCurrentSession(sessionResponse.data);
        setCurrentMatchup(matchupResponse.data);
        return {
          session: sessionResponse.data,
          currentMatchup: matchupResponse.data
        };
      }

      return null;
    } catch (err: any) {
      console.error('Failed to resume session:', err);
      setSessionError('Falha ao retomar torneio');
      return null;
    } finally {
      setSessionLoading(false);
    }
  }, [api]);

  const pauseSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await api.put(`/tournament/pause/${sessionId}`);
      
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null);
      }
      
      return true;
    } catch (err: any) {
      console.error('Failed to pause session:', err);
      return false;
    }
  }, [api, currentSession]);

  const cancelSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await api.delete(`/tournament/session/${sessionId}`);
      
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(null);
        setCurrentMatchup(null);
      }
      
      return true;
    } catch (err: any) {
      console.error('Failed to cancel session:', err);
      return false;
    }
  }, [api, currentSession]);

  // =====================================================
  // CHOICE PROCESSING
  // =====================================================

  const makeChoice = useCallback(async (choice: TournamentChoice): Promise<{
    nextMatchup?: TournamentMatchup;
    tournamentComplete: boolean;
    result?: TournamentResult;
    updatedSession?: TournamentSession;
    progressPercentage: number;
  } | null> => {
    try {
      setChoiceLoading(true);
      setError(null);

      const response = await api.post('/tournament/choice', choice);

      if (response?.data) {
        const { nextMatchup, tournamentComplete, result, updatedSession, progressPercentage } = response.data;

        // Update current session
        if (updatedSession) {
          setCurrentSession(updatedSession);
        }

        // Update current matchup
        if (nextMatchup) {
          setCurrentMatchup(nextMatchup);
        } else if (tournamentComplete) {
          setCurrentMatchup(null);
          setCurrentSession(null);
        }

        return response.data;
      }

      return null;
    } catch (err: any) {
      console.error('Failed to process choice:', err);
      const errorMessage = err.response?.data?.message || 'Falha ao processar escolha';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setChoiceLoading(false);
    }
  }, [api]);

  const skipChoice = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await api.post(`/tournament/skip/${sessionId}`);
      return true;
    } catch (err: any) {
      console.error('Failed to skip choice:', err);
      return false;
    }
  }, [api]);

  // =====================================================
  // RESULTS AND HISTORY
  // =====================================================

  const getTournamentResult = useCallback(async (sessionId: string): Promise<TournamentResult | null> => {
    try {
      const response = await api.get(`/tournament/result/${sessionId}`);
      return response?.data || null;
    } catch (err: any) {
      console.error('Failed to get tournament result:', err);
      return null;
    }
  }, [api]);

  const loadTournamentHistory = useCallback(async (limit: number = 20): Promise<TournamentResult[]> => {
    try {
      const response = await api.get(`/tournament/history?limit=${limit}`);
      const history = response?.data || [];
      setTournamentHistory(history);
      return history;
    } catch (err: any) {
      console.error('Failed to load tournament history:', err);
      return [];
    }
  }, [api]);

  const getHistoryByCategory = useCallback((categoryId: string): TournamentResult[] => {
    return tournamentHistory.filter(result => result.category === categoryId);
  }, [tournamentHistory]);

  const getLastCompletedTournament = useCallback((categoryId?: string): TournamentResult | null => {
    const filtered = categoryId 
      ? tournamentHistory.filter(result => result.category === categoryId)
      : tournamentHistory;
    
    return filtered.length > 0 ? filtered[0] : null;
  }, [tournamentHistory]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const loadUserStats = useCallback(async (): Promise<TournamentStats | null> => {
    try {
      const response = await api.get('/tournament/stats');
      const stats = response?.data || null;
      setUserStats(stats);
      return stats;
    } catch (err: any) {
      console.error('Failed to load user stats:', err);
      return null;
    }
  }, [api]);

  const getCategoryStats = useCallback((categoryId: string) => {
    if (!userStats) return null;

    return {
      winRate: userStats.winRateByCategory[categoryId] || 0,
      lastPlayed: getLastCompletedTournament(categoryId)?.completedAt,
      completedCount: getHistoryByCategory(categoryId).length,
      averageTime: getHistoryByCategory(categoryId).reduce((acc, result) => 
        acc + result.sessionDurationMinutes, 0) / getHistoryByCategory(categoryId).length || 0
    };
  }, [userStats, getLastCompletedTournament, getHistoryByCategory]);

  const getOverallProgress = useCallback(() => {
    if (!userStats || !categories) return null;

    const totalCategories = Object.keys(categories).length;
    const playedCategories = Object.keys(userStats.winRateByCategory).length;
    
    return {
      totalCategories,
      playedCategories,
      completionPercentage: (playedCategories / totalCategories) * 100,
      totalTournaments: userStats.totalTournaments,
      totalChoices: userStats.totalChoicesMade,
      averageConsistency: userStats.consistencyScore
    };
  }, [userStats, categories]);

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const isSessionActive = useCallback((): boolean => {
    return currentSession?.status === 'active' && currentMatchup !== null;
  }, [currentSession, currentMatchup]);

  const getSessionProgress = useCallback((): number => {
    return currentSession?.progressPercentage || 0;
  }, [currentSession]);

  const getEstimatedTimeRemaining = useCallback((): number => {
    if (!currentSession || !userStats) return 0;

    const remainingChoices = currentSession.totalChoices - currentSession.choicesMade;
    const averageChoiceTime = userStats.averageChoiceTime || 5; // 5 seconds default
    
    return remainingChoices * averageChoiceTime;
  }, [currentSession, userStats]);

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
    setCurrentMatchup(null);
    setSessionError(null);
  }, []);

  const clearErrors = useCallback(() => {
    setError(null);
    setSessionError(null);
  }, []);

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    if (user) {
      loadCategories();
      loadUserStats();
      loadTournamentHistory();
    }
  }, [user, loadCategories, loadUserStats, loadTournamentHistory]);

  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================

  return {
    // Data
    categories,
    currentSession,
    currentMatchup,
    tournamentHistory,
    userStats,

    // Loading states
    loading: loading || categoryLoading || sessionLoading,
    categoryLoading,
    sessionLoading,
    choiceLoading,

    // Error states
    error,
    sessionError,

    // Category functions
    loadCategories,
    getCategoryById,
    getAvailableCategories,
    getPopularCategories,

    // Session functions
    startTournament,
    checkActiveSession,
    resumeSession,
    pauseSession,
    cancelSession,
    clearCurrentSession,

    // Choice functions
    makeChoice,
    skipChoice,

    // Results functions
    getTournamentResult,
    loadTournamentHistory,
    getHistoryByCategory,
    getLastCompletedTournament,

    // Stats functions
    loadUserStats,
    getCategoryStats,
    getOverallProgress,

    // Utility functions
    isSessionActive,
    getSessionProgress,
    getEstimatedTimeRemaining,
    clearErrors,

    // State checkers
    hasActiveSession: isSessionActive(),
    currentCategory: currentSession?.category,
    sessionProgress: getSessionProgress(),
    estimatedTimeRemaining: getEstimatedTimeRemaining(),
  };
};

export default useTournament;