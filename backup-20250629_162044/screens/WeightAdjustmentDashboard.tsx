// screens/WeightAdjustmentDashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Settings, 
  BarChart3,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface WeightAdjustmentData {
  config: {
    userId: string;
    currentWeights: Record<string, number>;
    baseWeights: Record<string, number>;
    adaptationRate: number;
    minConfidenceThreshold: number;
    maxWeightChange: number;
    temporalAdaptation: boolean;
    moodAdaptation: boolean;
    learningEnabled: boolean;
  };
  analytics: {
    historical: Array<{
      period: string;
      totalEvents: number;
      positiveEvents: number;
      negativeEvents: number;
      avgMatchScore: number;
      improvementTrend: number;
    }>;
    realTime: {
      eventsToday: number;
      positiveToday: number;
      negativeToday: number;
      avgMatchScore: number;
      uniqueInteractions: number;
    };
  };
  adjustmentHistory: Array<{
    id: string;
    attribute: string;
    oldWeight: number;
    newWeight: number;
    adjustmentReason: string;
    confidenceScore: number;
    timestamp: string;
    dataPoints: number;
  }>;
  effectiveness: {
    totalRecommendations: number;
    positiveResponses: number;
    negativeResponses: number;
    positiveRate: number;
    engagementRate: number;
    recommendationQuality: number;
  };
}

const WeightAdjustmentDashboard: React.FC = () => {
  const [data, setData] = useState<WeightAdjustmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'weights' | 'history' | 'settings'>('overview');
  const [autoAdjustLoading, setAutoAdjustLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados em paralelo
      const [configRes, analyticsRes, historyRes, effectivenessRes] = await Promise.all([
        fetch('/api/profile/weight-adjustment/config'),
        fetch('/api/profile/weight-adjustment/analytics'),
        fetch('/api/profile/weight-adjustment/history?limit=20'),
        fetch('/api/profile/weight-adjustment/recommendations-effectiveness')
      ]);

      const [config, analytics, history, effectiveness] = await Promise.all([
        configRes.json(),
        analyticsRes.json(),
        historyRes.json(),
        effectivenessRes.json()
      ]);

      setData({
        config: config.data,
        analytics: analytics.data,
        adjustmentHistory: history.data,
        effectiveness: effectiveness.data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyAutoAdjustments = async () => {
    try {
      setAutoAdjustLoading(true);
      const response = await fetch('/api/profile/weight-adjustment/apply', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadDashboardData(); // Recarregar dados
        alert(`${result.data.applied} ajustes aplicados com sucesso!`);
      }
    } catch (error) {
      console.error('Error applying auto adjustments:', error);
      alert('Erro ao aplicar ajustes automáticos');
    } finally {
      setAutoAdjustLoading(false);
    }
  };

  const resetWeights = async () => {
    if (!confirm('Tem certeza que deseja resetar todos os pesos para os valores padrão?')) {
      return;
    }

    try {
      const response = await fetch('/api/profile/weight-adjustment/reset', {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadDashboardData();
        alert('Pesos resetados com sucesso!');
      }
    } catch (error) {
      console.error('Error resetting weights:', error);
      alert('Erro ao resetar pesos');
    }
  };

  const formatAttributeName = (attr: string) => {
    const names: Record<string, string> = {
      age: 'Idade',
      location: 'Localização',
      interests: 'Interesses',
      lifestyle: 'Estilo de Vida',
      values: 'Valores',
      appearance: 'Aparência',
      personality: 'Personalidade',
      communication: 'Comunicação',
      goals: 'Objetivos',
      emotionalIntelligence: 'Inteligência Emocional',
      humor: 'Humor',
      creativity: 'Criatividade'
    };
    return names[attr] || attr;
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'positive_feedback': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative_feedback': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'pattern_detection': return <Brain className="w-4 h-4 text-blue-500" />;
      case 'temporal_preference': return <Clock className="w-4 h-4 text-purple-500" />;
      case 'mood_influence': return <Zap className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de aprendizado...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Aprendizado Inteligente
              </h1>
              <p className="text-gray-600">
                Acompanhe como suas preferências são ajustadas automaticamente
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={applyAutoAdjustments}
                disabled={autoAdjustLoading}
                className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>
                  {autoAdjustLoading ? 'Ajustando...' : 'Aplicar Ajustes'}
                </span>
              </button>
              <button
                onClick={resetWeights}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Resetar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'weights', label: 'Pesos Atuais', icon: Target },
              { id: 'history', label: 'Histórico', icon: Clock },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(data.effectiveness.positiveRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Qualidade Média</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(data.effectiveness.recommendationQuality * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Eventos Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.analytics.realTime.eventsToday}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Brain className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Ajustes Recentes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.adjustmentHistory.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Tendência */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tendência de Performance
              </h3>
              <div className="h-64 flex items-end space-x-2">
                {data.analytics.historical.slice(-7).map((day, index) => {
                  const height = (day.positiveEvents / Math.max(...data.analytics.historical.map(d => d.totalEvents), 1)) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-pink-500 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(day.period).getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weights' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pesos Atuais vs. Originais
              </h3>
              <div className="space-y-4">
                {Object.entries(data.config.currentWeights).map(([attr, current]) => {
                  const base = data.config.baseWeights[attr] || 0;
                  const change = current - base;
                  const changePercent = base > 0 ? (change / base) * 100 : 0;
                  
                  return (
                    <div key={attr} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {formatAttributeName(attr)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {(current * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{ width: `${current * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center">
                        {change > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : change < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className={`text-sm ml-1 ${
                          change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Histórico de Ajustes
              </h3>
              <div className="space-y-4">
                {data.adjustmentHistory.map((adjustment) => (
                  <div key={adjustment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getReasonIcon(adjustment.adjustmentReason)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatAttributeName(adjustment.attribute)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {adjustment.oldWeight.toFixed(3)} → {adjustment.newWeight.toFixed(3)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getConfidenceColor(adjustment.confidenceScore)
                      }`}>
                        {(adjustment.confidenceScore * 100).toFixed(0)}% confiança
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(adjustment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Configurações de Aprendizado
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velocidade de Adaptação
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    value={data.config.adaptationRate}
                    className="flex-1"
                    readOnly
                  />
                  <span className="text-sm text-gray-500">
                    {(data.config.adaptationRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">Adaptação Temporal</p>
                    <p className="text-sm text-gray-500">
                      Ajustar baseado no horário do dia
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full ${
                    data.config.temporalAdaptation ? 'bg-pink-500' : 'bg-gray-300'
                  } relative`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      data.config.temporalAdaptation ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">Adaptação por Humor</p>
                    <p className="text-sm text-gray-500">
                      Considerar estado emocional
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full ${
                    data.config.moodAdaptation ? 'bg-pink-500' : 'bg-gray-300'
                  } relative`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      data.config.moodAdaptation ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightAdjustmentDashboard;