// hooks/analytics/useAnalytics.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { 
  AnalyticsEvent, 
  BusinessKPIs, 
  RecommendationMetrics,
  AnalyticsEventType 
} from '../../types/analytics';

interface AnalyticsConfig {
  baseUrl?: string;
  batchSize?: number;
  flushInterval?: number;
  enableOfflineQueue?: boolean;
  enableAutoFlush?: boolean;
}

interface AnalyticsState {
  isLoading: boolean;
  error: string | null;
  executiveDashboard: any;
  realtimeDashboard: any;
  businessMetrics: BusinessKPIs | null;
  technicalMetrics: any;
  productMetrics: any;
  isConnected: boolean;
  lastSync: Date | null;
}

interface UseAnalyticsReturn {
  // Estado
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastSync: Date | null;
  
  // Dados
  executiveDashboard: any;
  realtimeDashboard: any;
  businessMetrics: BusinessKPIs | null;
  technicalMetrics: any;
  productMetrics: any;
  
  // Ações
  trackEvent: (event: Partial<AnalyticsEvent>) => Promise<void>;
  trackBatch: (events: Partial<AnalyticsEvent>[]) => Promise<void>;
  refreshDashboard: (timeRange?: string) => Promise<void>;
  getKPIs: (options?: any) => Promise<any>;
  clearError: () => void;
  
  // Utilitários
  getOfflineQueue: () => Partial<AnalyticsEvent>[];
  clearOfflineQueue: () => void;
  flushOfflineQueue: () => Promise<void>;
}

/**
 * Hook principal para analytics
 * Gerencia todo o estado e interações com o sistema de analytics
 */
export const useAnalytics = (config: AnalyticsConfig = {}): UseAnalyticsReturn => {
  const {
    baseUrl = '/api/analytics',
    batchSize = 50,
    flushInterval = 30000, // 30 segundos
    enableOfflineQueue = true,
    enableAutoFlush = true
  } = config;

  // Estado principal
  const [state, setState] = useState<AnalyticsState>({
    isLoading: false,
    error: null,
    executiveDashboard: null,
    realtimeDashboard: null,
    businessMetrics: null,
    technicalMetrics: null,
    productMetrics: null,
    isConnected: true,
    lastSync: null
  });

  // Queue offline para eventos
  const offlineQueue = useRef<Partial<AnalyticsEvent>[]>([]);
  const flushTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingBatch = useRef<Partial<AnalyticsEvent>[]>([]);

  // Headers padrão para requisições
  const getHeaders = useCallback(() => {
    // TODO: Integrar com sistema de autenticação existente
    const token = ''; // Obter token do context de autenticação
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      'X-App-Version': '1.0.0', // TODO: Obter da config do app
      'X-Platform': 'mobile'
    };
  }, []);

  // Fazer requisição HTTP com tratamento de erros
  const makeRequest = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Request failed');
      }

      return data.data;
    } catch (error) {
      console.error('[useAnalytics] Request failed:', error);
      
      // Atualizar estado de conexão
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Network error'
      }));
      
      throw error;
    }
  }, [baseUrl, getHeaders]);

  // =====================================================
  // TRACKING DE EVENTOS
  // =====================================================

  /**
   * Registra um evento individual
   */
  const trackEvent = useCallback(async (event: Partial<AnalyticsEvent>): Promise<void> => {
    try {
      // Enriquecer evento com dados do dispositivo
      const enrichedEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        eventId: event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: event.sessionId || getSessionId(),
        deviceInfo: {
          ...getDeviceInfo(),
          ...event.deviceInfo
        },
        source: 'mobile_app'
      };

      // Se estiver offline ou batching habilitado, adicionar à queue
      if (!state.isConnected || enableOfflineQueue) {
        addToOfflineQueue(enrichedEvent);
        return;
      }

      // Enviar imediatamente
      await makeRequest('/events', {
        method: 'POST',
        body: JSON.stringify(enrichedEvent)
      });

      // Atualizar estado de sucesso
      setState(prev => ({
        ...prev,
        error: null,
        isConnected: true,
        lastSync: new Date()
      }));

    } catch (error) {
      // Se falhar, adicionar à queue offline
      if (enableOfflineQueue) {
        addToOfflineQueue(event);
      }
      
      console.error('[useAnalytics] Failed to track event:', error);
    }
  }, [state.isConnected, enableOfflineQueue, makeRequest]);

  /**
   * Registra múltiplos eventos em lote
   */
  const trackBatch = useCallback(async (events: Partial<AnalyticsEvent>[]): Promise<void> => {
    try {
      if (events.length === 0) return;

      // Enriquecer todos os eventos
      const enrichedEvents = events.map(event => ({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        eventId: event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: event.sessionId || getSessionId(),
        deviceInfo: {
          ...getDeviceInfo(),
          ...event.deviceInfo
        },
        source: 'mobile_app'
      }));

      await makeRequest('/events/batch', {
        method: 'POST',
        body: JSON.stringify({ events: enrichedEvents })
      });

      setState(prev => ({
        ...prev,
        error: null,
        isConnected: true,
        lastSync: new Date()
      }));

    } catch (error) {
      // Adicionar todos à queue offline se falhar
      if (enableOfflineQueue) {
        events.forEach(event => addToOfflineQueue(event));
      }
      
      console.error('[useAnalytics] Failed to track batch:', error);
    }
  }, [makeRequest, enableOfflineQueue]);

  // =====================================================
  // DASHBOARD E MÉTRICAS
  // =====================================================

  /**
   * Carrega dashboard executivo
   */
  const refreshDashboard = useCallback(async (timeRange: string = '30d'): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [executive, realtime] = await Promise.all([
        makeRequest(`/dashboard/executive?timeRange=${timeRange}`),
        makeRequest('/dashboard/realtime')
      ]);

      setState(prev => ({
        ...prev,
        executiveDashboard: executive,
        realtimeDashboard: realtime,
        isLoading: false,
        isConnected: true,
        lastSync: new Date()
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard'
      }));
    }
  }, [makeRequest]);

  /**
   * Obtém KPIs específicos
   */
  const getKPIs = useCallback(async (options: {
    date?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    categories?: string[];
    forceRecalculation?: boolean;
  } = {}): Promise<any> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.date) queryParams.append('date', options.date);
      if (options.period) queryParams.append('period', options.period);
      if (options.categories) queryParams.append('categories', options.categories.join(','));
      if (options.forceRecalculation) queryParams.append('forceRecalculation', 'true');

      const result = await makeRequest(`/kpis?${queryParams.toString()}`);
      
      setState(prev => ({
        ...prev,
        lastSync: new Date(),
        isConnected: true
      }));

      return result;

    } catch (error) {
      console.error('[useAnalytics] Failed to get KPIs:', error);
      throw error;
    }
  }, [makeRequest]);

  /**
   * Carrega métricas de negócio
   */
  const loadBusinessMetrics = useCallback(async (date?: string, period: string = 'daily'): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', date);
      queryParams.append('period', period);

      const metrics = await makeRequest(`/metrics/business?${queryParams.toString()}`);
      
      setState(prev => ({
        ...prev,
        businessMetrics: metrics.metrics,
        lastSync: new Date()
      }));

    } catch (error) {
      console.error('[useAnalytics] Failed to load business metrics:', error);
    }
  }, [makeRequest]);

  /**
   * Carrega métricas técnicas
   */
  const loadTechnicalMetrics = useCallback(async (date?: string, period: string = 'daily'): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', date);
      queryParams.append('period', period);

      const metrics = await makeRequest(`/metrics/technical?${queryParams.toString()}`);
      
      setState(prev => ({
        ...prev,
        technicalMetrics: metrics.metrics,
        lastSync: new Date()
      }));

    } catch (error) {
      console.error('[useAnalytics] Failed to load technical metrics:', error);
    }
  }, [makeRequest]);

  // =====================================================
  // GERENCIAMENTO OFFLINE
  // =====================================================

  /**
   * Adiciona evento à queue offline
   */
  const addToOfflineQueue = useCallback((event: Partial<AnalyticsEvent>): void => {
    offlineQueue.current.push(event);
    
    // Limitar tamanho da queue
    if (offlineQueue.current.length > 1000) {
      offlineQueue.current = offlineQueue.current.slice(-500);
    }

    // Adicionar ao batch pending se batching habilitado
    if (enableAutoFlush) {
      pendingBatch.current.push(event);
      
      // Flush automático quando atingir batch size
      if (pendingBatch.current.length >= batchSize) {
        flushPendingBatch();
      }
    }
  }, [batchSize, enableAutoFlush]);

  /**
   * Flush do batch pendente
   */
  const flushPendingBatch = useCallback(async (): Promise<void> => {
    if (pendingBatch.current.length === 0) return;

    const batch = [...pendingBatch.current];
    pendingBatch.current = [];

    try {
      await trackBatch(batch);
      
      // Remover eventos processados da queue offline
      offlineQueue.current = offlineQueue.current.filter(
        queueEvent => !batch.some(batchEvent => batchEvent.eventId === queueEvent.eventId)
      );

    } catch (error) {
      // Se falhar, manter na queue
      pendingBatch.current = [...batch, ...pendingBatch.current];
      console.error('[useAnalytics] Failed to flush pending batch:', error);
    }
  }, [trackBatch]);

  /**
   * Flush completo da queue offline
   */
  const flushOfflineQueue = useCallback(async (): Promise<void> => {
    if (offlineQueue.current.length === 0) return;

    const queue = [...offlineQueue.current];
    
    try {
      // Processar em lotes
      const batches = [];
      for (let i = 0; i < queue.length; i += batchSize) {
        batches.push(queue.slice(i, i + batchSize));
      }

      // Enviar todos os lotes
      await Promise.all(batches.map(batch => trackBatch(batch)));
      
      // Limpar queue apenas se tudo der certo
      offlineQueue.current = [];
      pendingBatch.current = [];

    } catch (error) {
      console.error('[useAnalytics] Failed to flush offline queue:', error);
      throw error;
    }
  }, [batchSize, trackBatch]);

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  /**
   * Limpa erro atual
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Obtém queue offline atual
   */
  const getOfflineQueue = useCallback((): Partial<AnalyticsEvent>[] => {
    return [...offlineQueue.current];
  }, []);

  /**
   * Limpa queue offline
   */
  const clearOfflineQueue = useCallback((): void => {
    offlineQueue.current = [];
    pendingBatch.current = [];
  }, []);

  // =====================================================
  // EFEITOS E INICIALIZAÇÃO
  // =====================================================

  // Timer automático de flush
  useEffect(() => {
    if (!enableAutoFlush) return;

    flushTimer.current = setInterval(() => {
      if (pendingBatch.current.length > 0) {
        flushPendingBatch();
      }
    }, flushInterval);

    return () => {
      if (flushTimer.current) {
        clearInterval(flushTimer.current);
      }
    };
  }, [enableAutoFlush, flushInterval, flushPendingBatch]);

  // Carregar dados iniciais
  useEffect(() => {
    refreshDashboard();
    loadBusinessMetrics();
    loadTechnicalMetrics();
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Tentar flush final da queue
      if (offlineQueue.current.length > 0) {
        flushOfflineQueue().catch(console.error);
      }
    };
  }, []);

  return {
    // Estado
    isLoading: state.isLoading,
    error: state.error,
    isConnected: state.isConnected,
    lastSync: state.lastSync,
    
    // Dados
    executiveDashboard: state.executiveDashboard,
    realtimeDashboard: state.realtimeDashboard,
    businessMetrics: state.businessMetrics,
    technicalMetrics: state.technicalMetrics,
    productMetrics: state.productMetrics,
    
    // Ações
    trackEvent,
    trackBatch,
    refreshDashboard,
    getKPIs,
    clearError,
    
    // Utilitários
    getOfflineQueue,
    clearOfflineQueue,
    flushOfflineQueue
  };
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Obtém informações do dispositivo
 */
function getDeviceInfo() {
  // TODO: Implementar com biblioteca específica do React Native
  return {
    deviceType: 'mobile',
    os: 'iOS', // ou 'Android'
    osVersion: 'unknown',
    appVersion: '1.0.0',
    screenResolution: '375x667', // placeholder
    language: 'pt-BR'
  };
}

/**
 * Obtém ou gera session ID
 */
function getSessionId(): string {
  // TODO: Implementar gerenciamento de sessão
  return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =====================================================
// HOOKS AUXILIARES
// =====================================================

/**
 * Hook simplificado para tracking de eventos comuns
 */
export const useEventTracker = () => {
  const { trackEvent } = useAnalytics();

  return {
    trackUserAction: (action: string, properties?: any) => 
      trackEvent({
        eventType: 'user_action',
        eventName: action,
        properties
      }),
    
    trackEngagement: (action: string, duration?: number, properties?: any) =>
      trackEvent({
        eventType: 'engagement_event',
        eventName: action,
        properties: { duration, ...properties }
      }),
    
    trackConversion: (type: string, value?: number, properties?: any) =>
      trackEvent({
        eventType: 'conversion_event',
        eventName: type,
        properties: { value, ...properties }
      }),
    
    trackError: (error: string, context?: any) =>
      trackEvent({
        eventType: 'error_event',
        eventName: 'app_error',
        properties: { error, context }
      })
  };
};

/**
 * Hook para métricas em tempo real
 */
export const useRealtimeMetrics = (refreshInterval: number = 10000) => {
  const { realtimeDashboard, refreshDashboard } = useAnalytics();
  
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboard();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refreshDashboard]);

  return realtimeDashboard;
};

export default useAnalytics;