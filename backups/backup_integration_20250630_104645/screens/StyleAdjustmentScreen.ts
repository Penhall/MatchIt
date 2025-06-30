// screens/StyleAdjustmentScreen.tsx - Tela de ajuste de estilo conectada ao backend real
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [isAuthenticated, navigation]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Carregar categorias e preferências
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar em paralelo para melhor performance
      const [categoriesResponse, preferencesResponse, statsResponse] = await Promise.all([
        api.get('/profile/style-preferences/categories'),
        api.get('/profile/style-preferences'),
        api.get('/profile/style-preferences/stats')
      ]);

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }

      if (preferencesResponse.success) {
        setPreferences(preferencesResponse.data);
      }

      if (statsResponse.success) {
        setCompletionStats(statsResponse.data);
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Falha ao carregar preferências. Tente novamente.');
      
      // Mostrar alerta apenas se não for erro de rede comum
      if (!err.message?.includes('Network')) {
        Alert.alert(
          'Erro',
          'Não foi possível carregar suas preferências. Verifique sua conexão e tente novamente.',
          [
            { text: 'Tentar Novamente', onPress: loadInitialData },
            { text: 'Voltar', onPress: () => navigation.goBack() }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  // Selecionar uma opção
  const selectOption = async (categoryKey: string, questionId: string, option: StyleOption) => {
    try {
      // Atualizar estado local imediatamente para UX responsiva
      setPreferences(prev => ({
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          [questionId]: {
            ...prev[categoryKey]?.[questionId],
            selectedOption: option.value
          }
        }
      }));

      // Adicionar à fila de mudanças pendentes
      const change = {
        category: categoryKey,
        questionId,
        selectedOption: option.value
      };

      setPendingChanges(prev => {
        // Remover mudança anterior para a mesma pergunta
        const filtered = prev.filter(
          p => !(p.category === categoryKey && p.questionId === questionId)
        );
        return [...filtered, change];
      });

      // Configurar auto-save com debounce
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        saveChanges();
      }, 1000); // 1 segundo de debounce

      setAutoSaveTimer(timer);

    } catch (err) {
      console.error('Erro ao selecionar opção:', err);
      Alert.alert('Erro', 'Falha ao salvar seleção. Tente novamente.');
    }
  };

  // Salvar mudanças pendentes
  const saveChanges = async () => {
    if (pendingChanges.length === 0) return;

    try {
      setSaving(true);
      
      const response = await api.post('/profile/style-preferences/batch', {
        preferences: pendingChanges
      });

      if (response.success) {
        setPendingChanges([]);
        
        // Recarregar estatísticas
        const statsResponse = await api.get('/profile/style-preferences/stats');
        if (statsResponse.success) {
          setCompletionStats(statsResponse.data);
        }
      } else {
        throw new Error(response.message || 'Falha ao salvar');
      }

    } catch (err: any) {
      console.error('Erro ao salvar mudanças:', err);
      Alert.alert(
        'Erro ao Salvar',
        'Suas mudanças não foram salvas. Verifique sua conexão e tente novamente.',
        [
          { text: 'Tentar Novamente', onPress: saveChanges },
          { text: 'Cancelar' }
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  // Limpar preferências de uma categoria
  const clearCategory = async (categoryKey: string) => {
    Alert.alert(
      'Confirmar',
      `Deseja remover todas as preferências da categoria "${categories[categoryKey]?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              
              const response = await api.delete(`/profile/style-preferences?category=${categoryKey}`);
              
              if (response.success) {
                // Atualizar estado local
                setPreferences(prev => ({
                  ...prev,
                  [categoryKey]: {}
                }));
                
                // Recarregar estatísticas
                const statsResponse = await api.get('/profile/style-preferences/stats');
                if (statsResponse.success) {
                  setCompletionStats(statsResponse.data);
                }
                
                Alert.alert('Sucesso', 'Preferências removidas com sucesso.');
              }
            } catch (err) {
              console.error('Erro ao limpar categoria:', err);
              Alert.alert('Erro', 'Falha ao remover preferências. Tente novamente.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  // Renderizar opção de pergunta
  const renderOption = (categoryKey: string, questionId: string, option: StyleOption) => {
    const isSelected = preferences[categoryKey]?.[questionId]?.selectedOption === option.value;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.optionCard, isSelected && styles.selectedOption]}
        onPress={() => selectOption(categoryKey, questionId, option)}
        activeOpacity={0.7}
      >
        {option.imageUrl && (
          <Image
            source={{ uri: option.imageUrl }}
            style={styles.optionImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.optionContent}>
          <Text style={[styles.optionLabel, isSelected && styles.selectedOptionText]}>
            {option.label}
          </Text>
          {option.description && (
            <Text style={[styles.optionDescription, isSelected && styles.selectedOptionDescription]}>
              {option.description}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Renderizar pergunta
  const renderQuestion = (categoryKey: string, question: StyleQuestion) => {
    return (
      <View key={question.id} style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.text}</Text>
        <View style={styles.optionsContainer}>
          {question.options.map(option => 
            renderOption(categoryKey, question.id, option)
          )}
        </View>
      </View>
    );
  };

  // Renderizar indicador de progresso
  const renderProgressIndicator = () => {
    if (!completionStats) return null;

    const categoryStats = completionStats.byCategory[selectedCategory];
    if (!categoryStats) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            Progresso: {categoryStats.completed}/{categoryStats.expected}
          </Text>
          <Text style={styles.progressPercentage}>
            {categoryStats.percentage}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${categoryStats.percentage}%` }
            ]} 
          />
        </View>
      </View>
    );
  };

  // Renderizar tabs de categoria
  const renderCategoryTabs = () => {
    const categoryKeys = Object.keys(categories);
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {categoryKeys.map(key => {
          const isSelected = selectedCategory === key;
          const categoryStats = completionStats?.byCategory[key];
          
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, isSelected && styles.selectedTab]}
              onPress={() => setSelectedCategory(key)}
            >
              <Text style={[styles.tabText, isSelected && styles.selectedTabText]}>
                {categories[key].name}
              </Text>
              {categoryStats && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {categoryStats.percentage}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Loading inicial
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Carregando suas preferências...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Estado de erro
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

  const currentCategory = categories[selectedCategory];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferências de Estilo</Text>
        {(saving || pendingChanges.length > 0) && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.savingText}>
              {saving ? 'Salvando...' : 'Mudanças pendentes'}
            </Text>
          </View>
        )}
      </View>

      {/* Tabs de categoria */}
      {renderCategoryTabs()}

      {/* Indicador de progresso */}
      {renderProgressIndicator()}

      {/* Conteúdo principal */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {currentCategory ? (
          <View>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{currentCategory.name}</Text>
              <Text style={styles.categoryDescription}>
                {currentCategory.description}
              </Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => clearCategory(selectedCategory)}
              >
                <Text style={styles.clearButtonText}>Limpar Categoria</Text>
              </TouchableOpacity>
            </View>

            {currentCategory.questions.map(question =>
              renderQuestion(selectedCategory, question)
            )}
          </View>
        ) : (
          <View style={styles.noCategoryContainer}>
            <Text style={styles.noCategoryText}>
              Categoria não encontrada
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer com estatísticas gerais */}
      {completionStats && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Progresso Geral: {completionStats.completionPercentage}%
          </Text>
          <Text style={styles.footerSubtext}>
            {completionStats.totalCompleted} de {completionStats.totalExpected} respondidas
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
    position: 'relative',
  },
  selectedTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedTabText: {
    color: 'white',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#34C759',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E1E5E9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  categoryHeader: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  questionContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E1E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  optionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#FF6B6B',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  selectedOptionDescription: {
    color: '#D63384',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  noCategoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noCategoryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default StyleAdjustmentScreen;