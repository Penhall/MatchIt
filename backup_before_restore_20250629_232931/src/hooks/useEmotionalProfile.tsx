// hooks/useEmotionalProfile.ts - Hook React para Gerenciar Perfil Emocional

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  EmotionalProfile, 
  MoodEntry, 
  EmotionalCompatibility,
  EmotionalScoringContext 
} from '../types/recommendation-emotional';
import { useApi } from './useApi';

// =====================================================
// INTERFACES DO HOOK
// =====================================================

interface EmotionalProfileState {
  profile: EmotionalProfile | null;
  isLoading: boolean;
  error: string | null;
  needsUpdate: boolean;
  completeness: number;
  lastUpdated: Date | null;
}

interface MoodHistoryState {
  entries: MoodEntry[];
  trends: MoodTrends;
  isLoading: boolean;
  error: string | null;
}

interface MoodTrends {
  averageMood: number;
  stability: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  totalEntries: number;
}

interface CompatibilityState {
  [targetUserId: string]: {
    compatibility: EmotionalCompatibility;
    isLoading: boolean;
    error: string | null;
    lastCalculated: Date;
  };
}

interface UseEmotionalProfileOptions {
  autoLoad?: boolean;
  cacheTime?: number; // em millisegundos
  enableMoodTracking?: boolean;
  enableCompatibilityCache?: boolean;
}

interface UseEmotionalProfileReturn {
  // Estado do perfil
  profile: EmotionalProfile | null;
  isLoading: boolean;
  error: string | null;
  needsUpdate: boolean;
  completeness: number;
  
  // Operações do perfil
  createProfile: (responses: Record<string, any>) => Promise<EmotionalProfile>;
  updateProfile: (responses: Record<string, any>) => Promise<EmotionalProfile>;
  refreshProfile: () => Promise<void>;
  deleteProfile: () => Promise<void>;
  
  // Humor e tracking
  moodHistory: MoodHistoryState;
  addMoodEntry: (moodData: Omit<MoodEntry, 'id' | 'timestamp'>) => Promise<MoodEntry>;
  getMoodHistory: (days?: number) => Promise<void>;
  
  // Compatibilidade
  compatibilities: CompatibilityState;
  calculateCompatibility: (targetUserId: string) => Promise<EmotionalCompatibility>;
  getCompatibility: (targetUserId: string) => EmotionalCompatibility | null;
  clearCompatibilityCache: () => void;
  
  // Utilidades
  isProfileComplete: boolean;
  canCalculateCompatibility: boolean;
  getProfileSummary: () => any;
  validateProfile: () => { isValid: boolean; errors: string[]; warnings: string[] };
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const useEmotionalProfile = (
  userId: string,
  options: UseEmotionalProfileOptions = {}
): UseEmotionalProfileReturn => {
  
  const {
    autoLoad = true,
    cacheTime = 5 * 60 * 1000, // 5 minutos
    enableMoodTracking = true,
    enableCompatibilityCache = true
  } = options;
  
  const { apiCall } = useApi();
  
  // =====================================================
  // ESTADOS
  // =====================================================
  
  const [profileState, setProfileState] = useState<EmotionalProfileState>({
    profile: null,
    isLoading: false,
    error: null,
    needsUpdate: false,
    completeness: 0,
    lastUpdated: null
  });
  
  const [moodHistory, setMoodHistory] = useState<MoodHistoryState>({
    entries: [],
    trends: {
      averageMood: 50,
      stability: 50,
      recentTrend: 'stable',
      totalEntries: 0
    },
    isLoading: false,
    error: null
  });
  
  const [compatibilities, setCompatibilities] = useState<CompatibilityState>({});
  
  // Cache refs
  const profileCacheRef = useRef<{
    data: EmotionalProfile | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });
  
  const moodCacheRef = useRef<{
    data: MoodEntry[];
    timestamp: number;
  }>({ data: [], timestamp: 0 });
  
  // =====================================================
  // OPERAÇÕES DO PERFIL
  // =====================================================
  
  const loadProfile = useCallback(async (forceRefresh = false) => {
    // Verificar cache primeiro
    if (!forceRefresh && profileCacheRef.current.data && 
        (Date.now() - profileCacheRef.current.timestamp) < cacheTime) {
      setProfileState(prev => ({
        ...prev,
        profile: profileCacheRef.current.data,
        isLoading: false
      }));
      return;
    }
    
    setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiCall('/api/emotional-profile', 'GET');
      
      if (response.success) {
        const profile = response.data;
        
        // Atualizar cache
        profileCacheRef.current = {
          data: profile,
          timestamp: Date.now()
        };
        
        setProfileState({
          profile,
          isLoading: false,
          error: null,
          needsUpdate: response.metadata?.needsUpdate || false,
          completeness: profile.completeness || 0,
          lastUpdated: profile.updatedAt ? new Date(profile.updatedAt) : null
        });
      } else {
        throw new Error(response.error || 'Erro ao carregar perfil');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProfileState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [apiCall, cacheTime]);
  
  const createProfile = useCallback(async (responses: Record<string, any>): Promise<EmotionalProfile> => {
    setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiCall('/api/emotional-profile', 'POST', {
        responses,
        version: '1.0'
      });
      
      if (response.success) {
        const profile = response.data;
        
        // Atualizar cache
        profileCacheRef.current = {
          data: profile,
          timestamp: Date.now()
        };
        
        setProfileState({
          profile,
          isLoading: false,
          error: null,
          needsUpdate: false,
          completeness: profile.completeness || 0,
          lastUpdated: new Date(profile.updatedAt)
        });
        
        return profile;
      } else {
        throw new Error(response.error || 'Erro ao criar perfil');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProfileState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [apiCall]);
  
  const updateProfile = useCallback(async (responses: Record<string, any>): Promise<EmotionalProfile> => {
    setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiCall('/api/emotional-profile', 'POST', {
        responses,
        version: '1.0'
      });
      
      if (response.success) {
        const profile = response.data;
        
        // Atualizar cache
        profileCacheRef.current = {
          data: profile,
          timestamp: Date.now()
        };
        
        setProfileState({
          profile,
          isLoading: false,
          error: null,
          needsUpdate: false,
          completeness: profile.completeness || 0,
          lastUpdated: new Date(profile.updatedAt)
        });
        
        // Limpar cache de compatibilidade (perfil mudou)
        if (enableCompatibilityCache) {
          clearCompatibilityCache();
        }
        
        return profile;
      } else {
        throw new Error(response.error || 'Erro ao atualizar perfil');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProfileState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [apiCall, enableCompatibilityCache]);
  
  const refreshProfile = useCallback(async () => {
    await loadProfile(true);
  }, [loadProfile]);
  
  const deleteProfile = useCallback(async () => {
    setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiCall('/api/emotional-profile', 'DELETE');
      
      if (response.success) {
        // Limpar todos os dados
        profileCacheRef.current = { data: null, timestamp: 0 };
        moodCacheRef.current = { data: [], timestamp: 0 };
        
        setProfileState({
          profile: null,
          isLoading: false,
          error: null,
          needsUpdate: false,
          completeness: 0,
          lastUpdated: null
        });
        
        setMoodHistory({
          entries: [],
          trends: {
            averageMood: 50,
            stability: 50,
            recentTrend: 'stable',
            totalEntries: 0
          },
          isLoading: false,
          error: null
        });
        
        clearCompatibilityCache();
      } else {
        throw new Error(response.error || 'Erro ao deletar perfil');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProfileState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [apiCall]);
  
  // =====================================================
  // OPERAÇÕES DE HUMOR
  // =====================================================
  
  const addMoodEntry = useCallback(async (moodData: Omit<MoodEntry, 'id' | 'timestamp'>): Promise<MoodEntry> => {
    if (!enableMoodTracking) {
      throw new Error('Mood tracking is disabled');
    }
    
    try {
      const response = await apiCall('/api/emotional-profile/mood', 'POST', moodData);
      
      if (response.success) {
        const moodEntry = response.data;
        
        // Atualizar histórico local
        setMoodHistory(prev => ({
          ...prev,
          entries: [moodEntry, ...prev.entries.slice(0, 99)] // Manter últimas 100
        }));
        
        // Invalidar cache
        moodCacheRef.current = { data: [], timestamp: 0 };
        
        return moodEntry;
      } else {
        throw new Error(response.error || 'Erro ao adicionar entrada de humor');
      }
      
    } catch (error) {
      setMoodHistory(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [apiCall, enableMoodTracking]);
  
  const getMoodHistory = useCallback(async (days = 30) => {
    if (!enableMoodTracking) return;
    
    // Verificar cache
    if (moodCacheRef.current.data.length > 0 && 
        (Date.now() - moodCacheRef.current.timestamp) < cacheTime) {
      setMoodHistory(prev => ({
        ...prev,
        entries: moodCacheRef.current.data,
        isLoading: false
      }));
      return;
    }
    
    setMoodHistory(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiCall(`/api/emotional-profile/mood/history?days=${days}&limit=100`, 'GET');
      
      if (response.success) {
        const { entries, trends, summary } = response.data;
        
        // Atualizar cache
        moodCacheRef.current = {
          data: entries,
          timestamp: Date.now()
        };
        
        setMoodHistory({
          entries,
          trends: {
            averageMood: trends.averageMood,
            stability: trends.stability,
            recentTrend: trends.recentTrend,
            totalEntries: summary.totalEntries
          },
          isLoading: false,
          error: null
        });
      } else {
        throw new Error(response.error || 'Erro ao carregar histórico de humor');
      }
      
    } catch (error) {
      setMoodHistory(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [apiCall, enableMoodTracking, cacheTime]);
  
  // =====================================================
  // OPERAÇÕES DE COMPATIBILIDADE
  // =====================================================
  
  const calculateCompatibility = useCallback(async (targetUserId: string): Promise<EmotionalCompatibility> => {
    // Verificar cache primeiro
    if (enableCompatibilityCache && compatibilities[targetUserId] && 
        !compatibilities[targetUserId].isLoading &&
        (Date.now() - compatibilities[targetUserId].lastCalculated.getTime()) < cacheTime) {
      return compatibilities[targetUserId].compatibility;
    }
    
    // Atualizar estado de loading
    setCompatibilities(prev => ({
      ...prev,
      [targetUserId]: {
        ...prev[targetUserId],
        isLoading: true,
        error: null
      }
    }));
    
    try {
      const response = await apiCall(`/api/emotional-profile/compatibility/${targetUserId}`, 'GET');
      
      if (response.success) {
        const compatibility = response.data;
        
        setCompatibilities(prev => ({
          ...prev,
          [targetUserId]: {
            compatibility,
            isLoading: false,
            error: null,
            lastCalculated: new Date()
          }
        }));
        
        return compatibility;
      } else {
        throw new Error(response.error || 'Erro ao calcular compatibilidade');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setCompatibilities(prev => ({
        ...prev,
        [targetUserId]: {
          ...prev[targetUserId],
          isLoading: false,
          error: errorMessage
        }
      }));
      
      throw error;
    }
  }, [apiCall, compatibilities, enableCompatibilityCache, cacheTime]);
  
  const getCompatibility = useCallback((targetUserId: string): EmotionalCompatibility | null => {
    return compatibilities[targetUserId]?.compatibility || null;
  }, [compatibilities]);
  
  const clearCompatibilityCache = useCallback(() => {
    setCompatibilities({});
  }, []);
  
  // =====================================================
  // UTILIDADES E COMPUTADAS
  // =====================================================
  
  const isProfileComplete = profileState.profile ? profileState.completeness >= 80 : false;
  const canCalculateCompatibility = profileState.profile && profileState.completeness >= 50;
  
  const getProfileSummary = useCallback(() => {
    if (!profileState.profile) return null;
    
    const profile = profileState.profile;
    
    return {
      energyLevel: profile.energyLevel,
      openness: profile.openness,
      emotionalStability: profile.emotionalStability,
      extroversion: profile.extroversion,
      attachmentStyle: profile.attachmentStyle,
      communicationStyle: profile.communicationStyle,
      dominantEmotions: profile.dominantEmotions.slice(0, 3),
      completeness: profile.completeness,
      lastUpdated: profile.updatedAt,
      needsUpdate: profileState.needsUpdate
    };
  }, [profileState.profile, profileState.needsUpdate]);
  
  const validateProfile = useCallback(() => {
    if (!profileState.profile) {
      return {
        isValid: false,
        errors: ['Perfil emocional não encontrado'],
        warnings: []
      };
    }
    
    const profile = profileState.profile;
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validações de completude
    if (profile.completeness < 50) {
      errors.push('Perfil muito incompleto (menos de 50%)');
    } else if (profile.completeness < 80) {
      warnings.push('Perfil incompleto (menos de 80%)');
    }
    
    // Validações de consistência
    if (profile.dataQuality.hasInconsistencies) {
      warnings.push('Detectadas inconsistências nas respostas');
    }
    
    // Validações temporais
    const daysSinceUpdate = (Date.now() - new Date(profile.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 180) {
      warnings.push('Perfil desatualizado (mais de 6 meses)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [profileState.profile]);
  
  // =====================================================
  // EFEITOS
  // =====================================================
  
  // Auto-load do perfil
  useEffect(() => {
    if (autoLoad && userId) {
      loadProfile();
    }
  }, [autoLoad, userId, loadProfile]);
  
  // Auto-load do histórico de humor
  useEffect(() => {
    if (enableMoodTracking && profileState.profile && !moodHistory.entries.length) {
      getMoodHistory();
    }
  }, [enableMoodTracking, profileState.profile, moodHistory.entries.length, getMoodHistory]);
  
  // Cleanup de cache expirado
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Limpar cache de compatibilidade expirado
      setCompatibilities(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(targetUserId => {
          if (now - updated[targetUserId].lastCalculated.getTime() > cacheTime * 2) {
            delete updated[targetUserId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, cacheTime);
    
    return () => clearInterval(interval);
  }, [cacheTime]);
  
  // =====================================================
  // RETORNO DO HOOK
  // =====================================================
  
  return {
    // Estado do perfil
    profile: profileState.profile,
    isLoading: profileState.isLoading,
    error: profileState.error,
    needsUpdate: profileState.needsUpdate,
    completeness: profileState.completeness,
    
    // Operações do perfil
    createProfile,
    updateProfile,
    refreshProfile,
    deleteProfile,
    
    // Humor e tracking
    moodHistory,
    addMoodEntry,
    getMoodHistory,
    
    // Compatibilidade
    compatibilities,
    calculateCompatibility,
    getCompatibility,
    clearCompatibilityCache,
    
    // Utilidades
    isProfileComplete,
    canCalculateCompatibility,
    getProfileSummary,
    validateProfile
  };
};

export default useEmotionalProfile;