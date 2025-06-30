// src/screens/StyleAdjustmentScreen.tsx - Tela de ajuste de estilo para React Web
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Alert
} from '../lib/react-native-web';
import { SafeAreaView } from '../lib/react-native-web';
import { useNavigation } from '../lib/react-native-web';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

interface StyleQuestion {
  id: string;
  text: string;
  options: StyleOption[];
}

interface StyleOption {
  id: string;
  label: string;
  value: string;
  imageUrl?: string;
  description?: string;
}

interface StyleCategory {
  name: string;
  description: string;
  questions: StyleQuestion[];
}

interface StylePreferences {
  [category: string]: {
    [questionId: string]: {
      id?: number;
      selectedOption: string;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

interface CompletionStats {
  totalExpected: number;
  totalCompleted: number;
  completionPercentage: number;
  byCategory: {
    [category: string]: {
      expected: number;
      completed: number;
      percentage: number;
      missingQuestions: string[];
    };
  };
}

const { width } = Dimensions.get('window');

export const StyleAdjustmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const api = useApi();

  // Estados principais
  const [categories, setCategories] = useState<{ [key: string]: StyleCategory }>({});
  const [preferences, setPreferences] = useState<StylePreferences>({});
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('cores');
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para auto-save
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Acesso Negado',
        'Você precisa estar logado para acessar suas preferências de estilo.',
        [{ text: 'OK', onPress: () => navigation.navigate('/login') }]
      );
      return;
    }
    
    loadInitialData();
  }, [isAuthenticated]);

  // Auto-save com debounce
  useEffect(() => {
    if (pendingChanges.length > 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        savePendingChanges();
      }, 2000); // 2 segundos de debounce
      
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [pendingChanges]);

  // Carregar dados iniciais
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadCategories(),
        loadUserPreferences(),
        loadCompletionStats()
      ]);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      console.error('Erro ao carregar dados iniciais:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias e perguntas
  const loadCategories = async () => {
    try {
      const response = await api.get('/style/categories');
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        throw new Error('Falha ao carregar categorias');
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      
      // Fallback com dados mock
      const mockCategories = {
        cores: {
          name: 'cores',
          description: 'Preferências de cores e paletas',
          questions: [
            {
              id: 'cores_primarias',
              text: 'Qual paleta de cores mais combina com você?',
              options: [
                { id: 'warm', label: 'Cores Quentes', value: 'warm', description: 'Vermelho, laranja, amarelo' },
                { id: 'cool', label: 'Cores Frias', value: 'cool', description: 'Azul, verde, roxo' },
                { id: 'neutral', label: 'Cores Neutras', value: 'neutral', description: 'Preto, branco, cinza, bege' },
                { id: 'vibrant', label: 'Cores Vibrantes', value: 'vibrant', description: 'Tons saturados e chamtivos' }
              ]
            }
          ]
        },
        estilos: {
          name: 'estilos',
          description: 'Estilos e estéticas visuais',
          questions: [
            {
              id: 'estetica_geral',
              text: 'Que estética mais representa você?',
              options: [
                { id: 'minimalist', label: 'Minimalista', value: 'minimalist', description: 'Simples, limpo, funcional' },
                { id: 'vintage', label: 'Vintage', value: 'vintage', description: 'Retrô, nostálgico, clássico' },
                { id: 'modern', label: 'Moderno', value: 'modern', description: 'Contemporâneo, atual, tecnológico' },
                { id: 'artistic', label: 'Artístico', value: 'artistic', description: 'Criativo, expressivo, único' }
              ]
            }
          ]
        }
      };
      
      setCategories(mockCategories);
    }
  };

  // Carregar preferências do usuário
  const loadUserPreferences = async () => {
    try {
      const response = await api.get(`/style/preferences/${user?.id}`);
      
      if (response.success && response.data) {
        setPreferences(response.data);
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar preferências:', err);
      // Não é crítico, user pode não ter preferências ainda
    }
  };

  // Carregar estatísticas de completude
  const loadCompletionStats = async () => {
    try {
      const response = await api.get(`/style/completion-stats/${user?.id}`);
      
      if (response.success && response.data) {
        setCompletionStats(response.data);
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Salvar mudanças pendentes
  const savePendingChanges = async () => {
    if (pendingChanges.length === 0) return;
    
    try {
      setSaving(true);
      
      for (const change of pendingChanges) {
        await api.post('/style/preferences', {
          userId: user?.id,
          category: change.category,
          questionId: change.questionId,
          selectedOption: change.selectedOption
        });
      }
      
      setPendingChanges([]);
      await loadCompletionStats(); // Atualizar stats
      
    } catch (err: any) {
      console.error('Erro ao salvar preferências:', err);
      setError('Erro ao salvar preferências. Tentando novamente...');
    } finally {
      setSaving(false);
    }
  };

  // Manipular seleção de opção
  const handleOptionSelect = (category: string, questionId: string, optionValue: string) => {
    // Atualizar estado local imediatamente
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [questionId]: {
          ...prev[category]?.[questionId],
          selectedOption: optionValue
        }
      }
    }));
    
    // Adicionar à lista de mudanças pendentes
    setPendingChanges(prev => {
      const filtered = prev.filter(change => 
        !(change.category === category && change.questionId === questionId)
      );
      
      return [...filtered, {
        category,
        questionId,
        selectedOption: optionValue,
        timestamp: Date.now()
      }];
    });
  };

  // Refresh manual
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  // Renderizar opção de pergunta
  const renderOption = (category: string, question: StyleQuestion, option: StyleOption) => {
    const isSelected = preferences[category]?.[question.id]?.selectedOption === option.value;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionContainer,
          isSelected && styles.optionSelected
        ]}
        onPress={() => handleOptionSelect(category, question.id, option.value)}
      >
        {option.imageUrl && (
          <Image
            source={{ uri: option.imageUrl }}
            style={styles.optionImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.optionContent}>
          <Text style={[
            styles.optionLabel,
            isSelected && styles.optionLabelSelected
          ]}>
            {option.label}
          </Text>
          
          {option.description && (
            <Text style={[
              styles.optionDescription,
              isSelected && styles.optionDescriptionSelected
            ]}>
              {option.description}
            </Text>
          )}
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Renderizar pergunta
  const renderQuestion = (category: string, question: StyleQuestion) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.text}</Text>
      
      <View style={styles.optionsContainer}>
        {question.options.map(option => renderOption(category, question, option))}
      </View>
    </View>
  );

  // Renderizar categoria
  const renderCategory = (categoryKey: string, category: StyleCategory) => (
    <View key={categoryKey} style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{category.name.toUpperCase()}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
        
        {completionStats?.byCategory[categoryKey] && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${completionStats.byCategory[categoryKey].percentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completionStats.byCategory[categoryKey].completed}/{completionStats.byCategory[categoryKey].expected} completas
            </Text>
          </View>
        )}
      </View>
      
      {category.questions.map(question => renderQuestion(categoryKey, question))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={50} color="#00ff88" />
          <Text style={styles.loadingText}>Carregando preferências...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && Object.keys(categories).length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Ajustar Preferências</Text>
        
        <View style={styles.saveIndicator}>
          {saving && <ActivityIndicator size={20} color="#00ff88" />}
          {pendingChanges.length > 0 && !saving && (
            <Text style={styles.pendingText}>{pendingChanges.length} pendentes</Text>
          )}
        </View>
      </View>

      {/* Progress geral */}
      {completionStats && (
        <View style={styles.overallProgress}>
          <Text style={styles.overallProgressText}>
            Progresso Geral: {completionStats.completionPercentage.toFixed(0)}%
          </Text>
          <View style={styles.overallProgressBar}>
            <View 
              style={[
                styles.overallProgressFill,
                { width: `${completionStats.completionPercentage}%` }
              ]}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00ff88"
          />
        }
      >
        {Object.entries(categories).map(([key, category]) => 
          renderCategory(key, category)
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Error message */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  
  retryButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    color: '#00ff88',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  
  saveIndicator: {
    width: 80,
    alignItems: 'flex-end',
  },
  
  pendingText: {
    color: '#ffaa00',
    fontSize: 12,
  },
  
  overallProgress: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  
  overallProgressText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
  },
  
  overallProgressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  
  content: {
    flex: 1,
  },
  
  categoryContainer: {
    margin: 20,
    marginBottom: 40,
  },
  
  categoryHeader: {
    marginBottom: 20,
  },
  
  categoryTitle: {
    color: '#00ff88',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  
  categoryDescription: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 12,
  },
  
  progressContainer: {
    marginTop: 8,
  },
  
  progressBar: {
    height: 3,
    backgroundColor: '#333333',
    borderRadius: 1.5,
    marginBottom: 4,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 1.5,
  },
  
  progressText: {
    color: '#999999',
    fontSize: 12,
  },
  
  questionContainer: {
    marginBottom: 30,
  },
  
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
  },
  
  optionsContainer: {
    gap: 12,
  },
  
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    minHeight: 70,
  },
  
  optionSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#0d2818',
  },
  
  optionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  
  optionContent: {
    flex: 1,
  },
  
  optionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  
  optionLabelSelected: {
    color: '#00ff88',
  },
  
  optionDescription: {
    color: '#999999',
    fontSize: 14,
  },
  
  optionDescriptionSelected: {
    color: '#cccccc',
  },
  
  selectedIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  selectedIcon: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  bottomSpacing: {
    height: 50,
  },
  
  errorBanner: {
    backgroundColor: '#442222',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ff4444',
  },
  
  errorBannerText: {
    color: '#ff8888',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StyleAdjustmentScreen;