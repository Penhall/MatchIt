// screens/SettingsScreen.tsx - Dashboard de Pesos (Expandido)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';
import { useWeightAdjustment } from '../recommendation/weight-adjustment-algorithm';
import { UserInteractionAnalytics } from '../recommendation/user-interaction-analytics';

// Hook auxiliar para analytics
const useUserAnalytics = () => {
    return UserInteractionAnalytics.getInstance();
}

// ==================== TIPOS ====================

interface DimensionWeight {
  key: string;
  name: string;
  category: string;
  currentWeight: number;
  defaultWeight: number;
  explanation: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastAdjusted: Date;
  confidence: number;
}

interface WeightHistory {
  date: string;
  weights: Record<string, number>;
}

// ==================== COMPONENTE PRINCIPAL ====================

const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dimensions' | 'history' | 'advanced'>('overview');
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(true);
  const [dimensions, setDimensions] = useState<DimensionWeight[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  
  const { adjustWeights, getWeights, getExplanation, forceAdjustment } = useWeightAdjustment();
  const { generateAnalytics } = useUserAnalytics();

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadWeightData();
  }, []);

  const loadWeightData = async () => {
    setIsLoading(true);
    try {
      const userId = 'current_user'; // Pegar do contexto
      
      // Carregar pesos atuais
      const weights = await getWeights(userId);
      
      // Carregar explicações e criar objetos de dimensão
      const dimensionData = await Promise.all(
        Object.entries(weights).map(async ([key, weight]) => {
          const explanation = await getExplanation(userId, key);
          return {
            key,
            name: getDimensionDisplayName(key),
            category: getDimensionCategory(key),
            currentWeight: weight as number, // Correção de tipo aqui
            defaultWeight: getDefaultWeight(key),
            explanation,
            trend: calculateTrend(key),
            lastAdjusted: new Date(),
            confidence: 0.85
          };
        })
      );
      
      setDimensions(dimensionData);
      
      // Carregar histórico
      loadWeightHistory(userId);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeightHistory = async (userId: string) => {
    // Simular dados históricos - em produção viria do banco
    const mockHistory: WeightHistory[] = [
      { date: '2024-01-01', weights: { emotional_stability: 0.12, communication_style: 0.11 } },
      { date: '2024-01-15', weights: { emotional_stability: 0.13, communication_style: 0.105 } },
      { date: '2024-02-01', weights: { emotional_stability: 0.135, communication_style: 0.10 } },
    ];
    setWeightHistory(mockHistory);
  };

  // ==================== HANDLERS ====================

  const handleDimensionAdjustment = async (dimension: string, newWeight: number) => {
    try {
      const success = await forceAdjustment('current_user', dimension, newWeight);
      if (success) {
        // Atualizar estado local
        setDimensions(prev => prev.map(d => 
          d.key === dimension ? { ...d, currentWeight: newWeight } : d
        ));
        
        Alert.alert(
          'Peso Atualizado',
          `O peso da dimensão "${getDimensionDisplayName(dimension)}" foi ajustado para ${(newWeight * 100).toFixed(1)}%`
        );
      } else {
        Alert.alert('Erro', 'Não foi possível ajustar o peso. Verifique os limites.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao ajustar o peso.');
    }
  };

  const handleAutoAdjust = async () => {
    setIsLoading(true);
    try {
      const adjustments = await adjustWeights('current_user');
      
      if (adjustments.length > 0) {
        // Atualizar dimensões com novos pesos
        setDimensions(prev => prev.map(d => {
          const adjustment = adjustments.find(adj => adj.dimension === d.key);
          return adjustment ? { ...d, currentWeight: adjustment.newWeight } : d;
        }));
        
        Alert.alert(
          'Ajuste Automático Concluído',
          `${adjustments.length} dimensões foram ajustadas baseado no seu comportamento.`,
          [
            { text: 'Ver Detalhes', onPress: () => setActiveTab('history') },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert(
          'Nenhum Ajuste Necessário',
          'Seus pesos já estão otimizados com base nos dados disponíveis.'
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro durante o ajuste automático.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Restaurar Padrões',
      'Isso irá restaurar todos os pesos para os valores padrão. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            setDimensions(prev => prev.map(d => ({
              ...d,
              currentWeight: d.defaultWeight
            })));
          }
        }
      ]
    );
  };

  // ==================== RENDERIZAÇÃO DOS TABS ====================

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {['overview', 'dimensions', 'history', 'advanced'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab as any)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {getTabTitle(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Header de Status */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Status do Sistema</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Ajuste Automático:</Text>
          <Switch
            value={autoAdjustEnabled}
            onValueChange={setAutoAdjustEnabled}
            trackColor={{ false: '#E0E0E0', true: '#FF4B6E' }}
          />
        </View>
        <Text style={styles.statusDescription}>
          {autoAdjustEnabled 
            ? 'O sistema ajusta automaticamente os pesos baseado no seu comportamento'
            : 'Apenas ajustes manuais serão aplicados'
          }
        </Text>
      </View>

      {/* Métricas Principais */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Métricas de Performance</Text>
        <View style={styles.metricsGrid}>
          <MetricItem title="Taxa de Match" value="73%" trend="up" />
          <MetricItem title="Conversas Iniciadas" value="45%" trend="up" />
          <MetricItem title="Encontros Agendados" value="28%" trend="stable" />
          <MetricItem title="Avaliação Média" value="4.2" trend="up" />
        </View>
      </View>

      {/* Dimensões Principais */}
      <View style={styles.topDimensionsCard}>
        <Text style={styles.cardTitle}>Dimensões Mais Importantes</Text>
        {dimensions
          .sort((a, b) => b.currentWeight - a.currentWeight)
          .slice(0, 5)
          .map((dim) => (
            <DimensionPreview key={dim.key} dimension={dim} />
          ))}
      </View>

      {/* Ações Rápidas */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Ações Rápidas</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleAutoAdjust}>
          <Text style={styles.actionButtonText}>🧠 Executar Ajuste Automático</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={resetToDefaults}>
          <Text style={styles.actionButtonText}>↺ Restaurar Padrões</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDimensions = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.dimensionsHeader}>
        <Text style={styles.sectionTitle}>Configuração de Dimensões</Text>
        <Text style={styles.sectionDescription}>
          Ajuste manualmente a importância de cada dimensão na compatibilidade
        </Text>
      </View>

      {getDimensionCategories().map((category) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {dimensions
            .filter(d => d.category === category)
            .map((dimension) => (
              <DimensionControl
                key={dimension.key}
                dimension={dimension}
                onAdjust={handleDimensionAdjustment}
                onSelect={() => setSelectedDimension(dimension.key)}
                isSelected={selectedDimension === dimension.key}
              />
            ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Histórico de Ajustes</Text>
      
      {/* Gráfico de Evolução */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Evolução dos Pesos</Text>
        {weightHistory.length > 0 && (
          <LineChart
            data={{
              labels: weightHistory.map(h => h.date.slice(5)),
              datasets: [
                {
                  data: weightHistory.map(h => h.weights.emotional_stability * 100),
                  color: (opacity = 1) => `rgba(255, 75, 110, ${opacity})`,
                  strokeWidth: 2
                },
                {
                  data: weightHistory.map(h => h.weights.communication_style * 100),
                  color: (opacity = 1) => `rgba(75, 110, 255, ${opacity})`,
                  strokeWidth: 2
                }
              ]
            }}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        )}
      </View>

      {/* Lista de Ajustes Recentes */}
      <View style={styles.adjustmentsList}>
        <Text style={styles.cardTitle}>Ajustes Recentes</Text>
        {/* Render adjustment history items */}
      </View>
    </ScrollView>
  );

  const renderAdvanced = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Configurações Avançadas</Text>
      
      {/* Parâmetros de Aprendizado */}
      <View style={styles.parameterCard}>
        <Text style={styles.cardTitle}>Parâmetros de Aprendizado</Text>
        <ParameterSlider
          label="Taxa de Aprendizado"
          value={0.1}
          min={0.01}
          max={0.5}
          step={0.01}
          description="Quão rapidamente o sistema se adapta"
        />
        <ParameterSlider
          label="Limiar de Confiança"
          value={0.7}
          min={0.1}
          max={1.0}
          step={0.05}
          description="Confiança mínima para aplicar ajustes"
        />
      </View>

      {/* Exportar/Importar */}
      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Gerenciamento de Dados</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 Exportar Dados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📁 Importar Configuração</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ==================== COMPONENTES AUXILIARES ====================

  const MetricItem: React.FC<{
    title: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }> = ({ title, value, trend }) => (
    <View style={styles.metricItem}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricTrend}>
        {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}
      </Text>
    </View>
  );

  const DimensionPreview: React.FC<{ dimension: DimensionWeight }> = ({ dimension }) => (
    <View style={styles.dimensionPreview}>
      <View style={styles.dimensionInfo}>
        <Text style={styles.dimensionName}>{dimension.name}</Text>
        <Text style={styles.dimensionWeight}>{(dimension.currentWeight * 100).toFixed(1)}%</Text>
      </View>
      <View style={styles.weightBar}>
        <View
          style={[
            styles.weightBarFill,
            { width: `${dimension.currentWeight * 500}%` } // Scale for visibility
          ]}
        />
      </View>
    </View>
  );

  const DimensionControl: React.FC<{
    dimension: DimensionWeight;
    onAdjust: (dimension: string, weight: number) => void;
    onSelect: () => void;
    isSelected: boolean;
  }> = ({ dimension, onAdjust, onSelect, isSelected }) => (
    <TouchableOpacity
      style={[styles.dimensionControl, isSelected && styles.selectedDimension]}
      onPress={onSelect}
    >
      <View style={styles.dimensionHeader}>
        <Text style={styles.dimensionControlName}>{dimension.name}</Text>
        <Text style={styles.dimensionControlWeight}>
          {(dimension.currentWeight * 100).toFixed(1)}%
        </Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={0.01}
        maximumValue={0.20}
        value={dimension.currentWeight}
        onSlidingComplete={(value) => onAdjust(dimension.key, value)}
        minimumTrackTintColor="#FF4B6E"
        maximumTrackTintColor="#E0E0E0"
        thumbStyle={styles.sliderThumb}
      />
      
      {isSelected && (
        <View style={styles.dimensionDetails}>
          <Text style={styles.dimensionExplanation}>{dimension.explanation}</Text>
          <View style={styles.dimensionStats}>
            <Text style={styles.statItem}>
              Padrão: {(dimension.defaultWeight * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statItem}>
              Confiança: {(dimension.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const ParameterSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    description: string;
  }> = ({ label, value, min, max, step, description }) => (
    <View style={styles.parameterSlider}>
      <View style={styles.parameterHeader}>
        <Text style={styles.parameterLabel}>{label}</Text>
        <Text style={styles.parameterValue}>{value.toFixed(2)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={value}
        step={step}
        minimumTrackTintColor="#FF4B6E"
        maximumTrackTintColor="#E0E0E0"
      />
      <Text style={styles.parameterDescription}>{description}</Text>
    </View>
  );

  // ==================== FUNÇÕES AUXILIARES ====================

  const getTabTitle = (tab: string): string => {
    const titles = {
      overview: 'Visão Geral',
      dimensions: 'Dimensões',
      history: 'Histórico',
      advanced: 'Avançado'
    };
    return titles[tab as keyof typeof titles] || tab;
  };

  const getDimensionDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      emotional_stability: 'Estabilidade Emocional',
      communication_style: 'Estilo de Comunicação',
      life_goals: 'Objetivos de Vida',
      conflict_resolution: 'Resolução de Conflitos',
      intimacy_preferences: 'Preferências de Intimidade',
      social_energy: 'Energia Social',
      adventure_seeking: 'Busca por Aventura',
      independence_level: 'Nível de Independência',
      humor_style: 'Estilo de Humor',
      values_alignment: 'Alinhamento de Valores'
    };
    return names[key] || key;
  };

  const getDimensionCategory = (key: string): string => {
    const categories: Record<string, string> = {
      emotional_stability: 'Fundamentais',
      communication_style: 'Fundamentais',
      life_goals: 'Fundamentais',
      conflict_resolution: 'Fundamentais',
      intimacy_preferences: 'Fundamentais',
      social_energy: 'Sociais',
      adventure_seeking: 'Sociais',
      independence_level: 'Sociais',
      humor_style: 'Personalidade',
      values_alignment: 'Personalidade'
    };
    return categories[key] || 'Outras';
  };

  const getDimensionCategories = (): string[] => {
    return ['Fundamentais', 'Sociais', 'Personalidade', 'Outras'];
  };

  const getDefaultWeight = (key: string): number => {
    const defaults: Record<string, number> = {
      emotional_stability: 0.12,
      communication_style: 0.11,
      life_goals: 0.10,
      conflict_resolution: 0.09,
      intimacy_preferences: 0.08,
      social_energy: 0.07,
      adventure_seeking: 0.06,
      independence_level: 0.06,
      humor_style: 0.05,
      values_alignment: 0.05
    };
    return defaults[key] || 0.03;
  };

  const calculateTrend = (key: string): 'increasing' | 'decreasing' | 'stable' => {
    // Simular cálculo de tendência
    return Math.random() > 0.5 ? 'increasing' : 'stable';
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  // ==================== RENDER PRINCIPAL ====================

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'dimensions' && renderDimensions()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'advanced' && renderAdvanced()}
    </View>
  );
};

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 10
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF4B6E'
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#FF4B6E',
    fontWeight: '600'
  },
  tabContent: {
    flex: 1,
    padding: 15
  },
  
  // Cards
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  topDimensionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  parameterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  // Títulos
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 22
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10
  },
  
  // Status
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333'
  },
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20
  },
  
  // Métricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF4B6E',
    marginBottom: 5
  },
  metricTitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 5
  },
  metricTrend: {
    fontSize: 16
  },
  
  // Dimensões
  dimensionPreview: {
    marginBottom: 15
  },
  dimensionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333'
  },
  dimensionWeight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4B6E'
  },
  weightBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  weightBarFill: {
    height: '100%',
    backgroundColor: '#FF4B6E'
  },
  
  // Controles de Dimensão
  dimensionsHeader: {
    marginBottom: 20
  },
  categorySection: {
    marginBottom: 20
  },
  dimensionControl: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  selectedDimension: {
    borderColor: '#FF4B6E',
    backgroundColor: '#FFF8F9'
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  dimensionControlName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333'
  },
  dimensionControlWeight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B6E'
  },
  slider: {
    width: '100%',
    height: 40
  },
  sliderThumb: {
    backgroundColor: '#FF4B6E',
    width: 20,
    height: 20
  },
  dimensionDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  dimensionExplanation: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10
  },
  dimensionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    fontSize: 12,
    color: '#999999'
  },
  
  // Ações
  actionButton: {
    backgroundColor: '#FF4B6E',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  
  // Gráficos
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  adjustmentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  // Parâmetros
  parameterSlider: {
    marginBottom: 20
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  parameterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333'
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B6E'
  },
  parameterDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5
  }
});

export default SettingsScreen;
