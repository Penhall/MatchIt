// screens/EmotionalProfileScreen.tsx - Visualização do perfil emocional gerado
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

// ==============================================
// TIPOS E INTERFACES
// ==============================================

interface EmotionalDimension {
  type: string;
  intensity: number;
  frequency: number;
  preference: number;
}

interface MoodProfile {
  currentMood: string;
  moodIntensity: number;
  moodStability: number;
  energyLevel: number;
  socialDesire: number;
  romanticMood: number;
  lastUpdated: string;
  validUntil: string;
}

interface EmotionalProfile {
  dominantEmotions: EmotionalDimension[];
  emotionalIntensity: number;
  emotionalStability: number;
  socialEnergy: number;
  empathyLevel: number;
  communicationStyle: string;
  activityPreferences: {
    whenHappy: string[];
    whenCalm: string[];
    whenStressed: string[];
    whenRomantic: string[];
    moodBoosters: string[];
  };
  currentMoodProfile: MoodProfile;
  metadata: {
    profileId: string;
    userId: string;
    completionStatus: {
      completed: boolean;
      completionPercentage: number;
    };
    reliabilityScore: number;
  };
}

interface EmotionalInsight {
  type: 'strength' | 'pattern' | 'compatibility' | 'growth';
  title: string;
  description: string;
  confidence: number;
}

interface EmotionalRecommendation {
  type: 'profile_improvement' | 'dating_strategy' | 'activity_suggestion';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

// ==============================================
// CONFIGURAÇÃO DA API
// ==============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken') || 'dev-token-12345';
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

interface EmotionalProfileScreenProps {
  navigation?: any;
  route?: {
    params?: {
      profile?: EmotionalProfile;
      insights?: EmotionalInsight[];
      recommendations?: EmotionalRecommendation[];
    };
  };
}

const EmotionalProfileScreen: React.FC<EmotionalProfileScreenProps> = ({ 
  navigation, 
  route 
}) => {
  // ==============================================
  // ESTADO
  // ==============================================
  
  const [emotionalProfile, setEmotionalProfile] = useState<EmotionalProfile | null>(
    route?.params?.profile || null
  );
  const [insights, setInsights] = useState<EmotionalInsight[]>(
    route?.params?.insights || []
  );
  const [recommendations, setRecommendations] = useState<EmotionalRecommendation[]>(
    route?.params?.recommendations || []
  );
  
  const [loading, setLoading] = useState({
    fetching: false,
    updating: false
  });
  
  const [error, setError] = useState<string | null>(null);

  // ==============================================
  // FUNÇÕES DE API
  // ==============================================

  const fetchEmotionalProfile = async () => {
    setLoading(prev => ({ ...prev, fetching: true }));
    setError(null);

    try {
      console.log('[EmotionalProfile] Buscando perfil emocional...');
      
      const response = await apiRequest('/profile/emotional', {
        method: 'GET'
      });
      
      if (response.success) {
        const { emotionalProfile: profile, hasProfile, needsQuestionnaire } = response.data;
        
        if (!hasProfile || needsQuestionnaire) {
          // Redirecionar para questionário se não tem perfil
          Alert.alert(
            'Perfil Incompleto',
            'Você ainda não completou seu perfil emocional. Gostaria de fazê-lo agora?',
            [
              { text: 'Mais tarde', style: 'cancel' },
              { 
                text: 'Completar', 
                onPress: () => {
                  if (navigation) {
                    navigation.navigate('EmotionalQuestionnaire');
                  }
                }
              }
            ]
          );
          return;
        }
        
        setEmotionalProfile(profile);
        console.log('[EmotionalProfile] Perfil carregado com sucesso');
      } else {
        throw new Error(response.error || 'Erro ao carregar perfil');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao carregar perfil emocional';
      console.error('[EmotionalProfile] Erro ao buscar perfil:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  const retakeQuestionnaire = () => {
    Alert.alert(
      'Refazer Questionário',
      'Tem certeza que deseja refazer seu questionário emocional? Isso irá substituir seu perfil atual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Refazer', 
          style: 'destructive',
          onPress: () => {
            if (navigation) {
              navigation.navigate('EmotionalQuestionnaire');
            }
          }
        }
      ]
    );
  };

  // ==============================================
  // EFFECTS
  // ==============================================

  useEffect(() => {
    if (!emotionalProfile) {
      fetchEmotionalProfile();
    }
  }, []);

  // ==============================================
  // RENDER HELPERS
  // ==============================================

  const getEmotionLabel = (emotionType: string): string => {
    const labels: Record<string, string> = {
      joy: 'Alegria',
      excitement: 'Empolgação',
      contentment: 'Contentamento',
      serenity: 'Serenidade',
      confidence: 'Confiança',
      love: 'Amor',
      gratitude: 'Gratidão',
      curiosity: 'Curiosidade',
      calmness: 'Calma',
      focus: 'Foco',
      determination: 'Determinação',
      nostalgia: 'Nostalgia',
      melancholy: 'Melancolia',
      anxiety: 'Ansiedade',
      passion: 'Paixão',
      sensitivity: 'Sensibilidade'
    };
    
    return labels[emotionType] || emotionType;
  };

  const getCommunicationStyleLabel = (style: string): string => {
    const labels: Record<string, string> = {
      expressive: 'Expressivo',
      reserved: 'Reservado',
      balanced: 'Balanceado',
      empathetic: 'Empático',
      logical: 'Lógico',
      intuitive: 'Intuitivo'
    };
    
    return labels[style] || style;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Verde
    if (score >= 60) return '#FF9800'; // Laranja
    if (score >= 40) return '#FFC107'; // Amarelo
    return '#F44336'; // Vermelho
  };

  const renderEmotionalDimensions = () => {
    if (!emotionalProfile?.dominantEmotions?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Suas Emoções Dominantes</Text>
        <Text style={styles.sectionDescription}>
          As emoções que mais definem sua personalidade
        </Text>
        
        {emotionalProfile.dominantEmotions.slice(0, 5).map((emotion, index) => (
          <View key={emotion.type} style={styles.emotionItem}>
            <View style={styles.emotionHeader}>
              <Text style={styles.emotionLabel}>
                {index + 1}. {getEmotionLabel(emotion.type)}
              </Text>
              <Text style={styles.emotionIntensity}>{emotion.intensity}%</Text>
            </View>
            
            <View style={styles.emotionBar}>
              <View 
                style={[
                  styles.emotionBarFill, 
                  { 
                    width: `${emotion.intensity}%`,
                    backgroundColor: getScoreColor(emotion.intensity)
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.emotionDetails}>
              Frequência: {emotion.frequency}% • Preferência: {emotion.preference}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEmotionalMetrics = () => {
    if (!emotionalProfile) return null;

    const metrics = [
      { 
        label: 'Intensidade Emocional', 
        value: emotionalProfile.emotionalIntensity,
        description: 'Quão intensamente você sente as emoções'
      },
      { 
        label: 'Estabilidade Emocional', 
        value: emotionalProfile.emotionalStability,
        description: 'Sua capacidade de manter equilíbrio emocional'
      },
      { 
        label: 'Energia Social', 
        value: emotionalProfile.socialEnergy,
        description: 'Seu nível de energia em interações sociais'
      },
      { 
        label: 'Nível de Empatia', 
        value: emotionalProfile.empathyLevel,
        description: 'Sua capacidade de sentir e compreender outros'
      }
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Suas Métricas Emocionais</Text>
        
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={[styles.metricValue, { color: getScoreColor(metric.value) }]}>
                {metric.value}%
              </Text>
            </View>
            
            <View style={styles.metricBar}>
              <View 
                style={[
                  styles.metricBarFill, 
                  { 
                    width: `${metric.value}%`,
                    backgroundColor: getScoreColor(metric.value)
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.metricDescription}>{metric.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCommunicationStyle = () => {
    if (!emotionalProfile?.communicationStyle) return null;

    const styleDescriptions: Record<string, string> = {
      expressive: 'Você compartilha suas emoções abertamente e valoriza comunicação emocional.',
      reserved: 'Você prefere momentos íntimos para compartilhar sentimentos profundos.',
      balanced: 'Você adapta seu estilo de comunicação ao contexto e à pessoa.',
      empathetic: 'Você foca nas emoções dos outros e oferece suporte emocional.',
      logical: 'Você prefere abordagens racionais mesmo em situações emocionais.',
      intuitive: 'Você segue sua intuição e a energia do momento nas interações.'
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Seu Estilo de Comunicação</Text>
        
        <View style={styles.communicationCard}>
          <Text style={styles.communicationStyle}>
            {getCommunicationStyleLabel(emotionalProfile.communicationStyle)}
          </Text>
          <Text style={styles.communicationDescription}>
            {styleDescriptions[emotionalProfile.communicationStyle] || 'Estilo único de comunicação.'}
          </Text>
        </View>
      </View>
    );
  };

  const renderCurrentMood = () => {
    if (!emotionalProfile?.currentMoodProfile) return null;

    const mood = emotionalProfile.currentMoodProfile;
    const moodExpired = new Date(mood.validUntil) < new Date();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌟 Seu Estado Atual</Text>
        {moodExpired && (
          <Text style={styles.expiredWarning}>
            ⚠️ Estado emocional desatualizado. Considere atualizar.
          </Text>
        )}
        
        <View style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <Text style={styles.moodCurrent}>
              Humor: {getEmotionLabel(mood.currentMood)}
            </Text>
            <Text style={styles.moodIntensity}>
              Intensidade: {mood.moodIntensity}%
            </Text>
          </View>
          
          <View style={styles.moodMetrics}>
            <View style={styles.moodMetric}>
              <Text style={styles.moodMetricLabel}>Energia</Text>
              <Text style={styles.moodMetricValue}>{mood.energyLevel}%</Text>
            </View>
            <View style={styles.moodMetric}>
              <Text style={styles.moodMetricLabel}>Social</Text>
              <Text style={styles.moodMetricValue}>{mood.socialDesire}%</Text>
            </View>
            <View style={styles.moodMetric}>
              <Text style={styles.moodMetricLabel}>Romântico</Text>
              <Text style={styles.moodMetricValue}>{mood.romanticMood}%</Text>
            </View>
          </View>
          
          <Text style={styles.moodUpdated}>
            Atualizado em: {new Date(mood.lastUpdated).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    if (!insights.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Insights Sobre Você</Text>
        
        {insights.map((insight, index) => {
          const typeEmojis = {
            strength: '💪',
            pattern: '🔍',
            compatibility: '💕',
            growth: '🌱'
          };
          
          return (
            <View key={index} style={styles.insightCard}>
              <Text style={styles.insightTitle}>
                {typeEmojis[insight.type]} {insight.title}
              </Text>
              <Text style={styles.insightDescription}>
                {insight.description}
              </Text>
              <Text style={styles.insightConfidence}>
                Confiança: {insight.confidence}%
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!recommendations.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Recomendações Para Você</Text>
        
        {recommendations.map((recommendation, index) => {
          const priorityColors = {
            high: '#F44336',
            medium: '#FF9800',
            low: '#4CAF50'
          };
          
          return (
            <View key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>
                  {recommendation.title}
                </Text>
                <View style={[
                  styles.priorityBadge, 
                  { backgroundColor: priorityColors[recommendation.priority] }
                ]}>
                  <Text style={styles.priorityText}>
                    {recommendation.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.recommendationDescription}>
                {recommendation.description}
              </Text>
              
              {recommendation.actionItems.length > 0 && (
                <View style={styles.actionItems}>
                  <Text style={styles.actionItemsTitle}>Ações sugeridas:</Text>
                  {recommendation.actionItems.map((item, itemIndex) => (
                    <Text key={itemIndex} style={styles.actionItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderProfileStats = () => {
    if (!emotionalProfile?.metadata) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {emotionalProfile.metadata.completionStatus.completionPercentage}%
          </Text>
          <Text style={styles.statLabel}>Completo</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {emotionalProfile.metadata.reliabilityScore}%
          </Text>
          <Text style={styles.statLabel}>Confiabilidade</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {emotionalProfile.dominantEmotions.length}
          </Text>
          <Text style={styles.statLabel}>Emoções</Text>
        </View>
      </View>
    );
  };

  // ==============================================
  // RENDER PRINCIPAL
  // ==============================================

  if (loading.fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando seu perfil emocional...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Erro</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEmotionalProfile}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!emotionalProfile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>🎭 Perfil Emocional</Text>
        <Text style={styles.emptyText}>
          Você ainda não possui um perfil emocional. Complete o questionário para descobrir mais sobre suas emoções e melhorar seus matches!
        </Text>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation?.navigate('EmotionalQuestionnaire')}
        >
          <Text style={styles.startButtonText}>Começar Questionário</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seu Perfil Emocional</Text>
        <Text style={styles.subtitle}>
          Descubra mais sobre suas emoções e padrões de comportamento
        </Text>
        {renderProfileStats()}
      </View>

      {renderEmotionalDimensions()}
      {renderEmotionalMetrics()}
      {renderCommunicationStyle()}
      {renderCurrentMood()}
      {renderInsights()}
      {renderRecommendations()}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={retakeQuestionnaire}>
          <Text style={styles.actionButtonText}>🔄 Refazer Questionário</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]} 
          onPress={() => navigation?.navigate('MatchArea')}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            💕 Ver Matches
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Seu perfil emocional ajuda a encontrar pessoas mais compatíveis com você. 
          Atualize regularmente para melhores resultados.
        </Text>
      </View>
    </ScrollView>
  );
};

// ==============================================
// ESTILOS
// ==============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 32,
  },
  
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 16,
  },
  
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 32,
  },
  
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  header: {
    padding: 24,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  
  emotionItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  emotionIntensity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  
  emotionBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginBottom: 8,
  },
  
  emotionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  emotionDetails: {
    fontSize: 12,
    color: '#666',
  },
  
  metricItem: {
    marginBottom: 20,
  },
  
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  metricBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 8,
  },
  
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  metricDescription: {
    fontSize: 14,
    color: '#666',
  },
  
  communicationCard: {
    padding: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  
  communicationStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  
  communicationDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  
  moodCard: {
    padding: 20,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  
  expiredWarning: {
    fontSize: 14,
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  moodCurrent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  moodIntensity: {
    fontSize: 14,
    color: '#666',
  },
  
  moodMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  
  moodMetric: {
    alignItems: 'center',
  },
  
  moodMetricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  
  moodMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  
  moodUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  insightCard: {
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  
  insightConfidence: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  recommendationCard: {
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  priorityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  actionItems: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  
  actionItemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  actionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  
  actionButtons: {
    padding: 24,
    gap: 12,
  },
  
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  actionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  
  actionButtonTextSecondary: {
    color: '#007AFF',
  },
  
  footer: {
    padding: 24,
    backgroundColor: '#F8F9FA',
    marginTop: 24,
  },
  
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmotionalProfileScreen;