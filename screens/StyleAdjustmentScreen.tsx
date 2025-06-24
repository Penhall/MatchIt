// screens/StyleAdjustmentScreen.tsx - Tela de ajuste de estilo com integração real ao backend
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Button from '../components/common/Button';
import { logger } from '../middleware/logger';
// ==============================================
// TIPOS E INTERFACES
// ==============================================

interface StylePreferences {
  tenis: number[];
  roupas: number[];
  cores: number[];
  hobbies: number[];
  sentimentos: number[];
}

interface StylePreferencesResponse {
  success: boolean;
  data: {
    userId: string;
    preferences: StylePreferences;
    completionStatus: {
      completed: boolean;
      totalCategories: number;
      completedCategories: number;
      completionPercentage: number;
    };
    metadata: {
      profileId: number;
      createdAt: string;
      updatedAt: string;
      isNew: boolean;
    };
  };
  processingTime: number;
}

interface StyleQuestion {
  id: string;
  category: keyof StylePreferences;
  question: string;
  options: StyleOption[];
}

interface StyleOption {
  id: string;
  value: number;
  label: string;
  imageUrl?: string;
}

interface LoadingState {
  fetching: boolean;
  saving: boolean;
  updating: boolean;
}

interface ErrorState {
  fetch: string | null;
  save: string | null;
  update: string | null;
}

// ==============================================
// DADOS DE QUESTÕES
// ==============================================

const STYLE_QUESTIONS: StyleQuestion[] = [
  {
    id: 'tenis_1',
    category: 'tenis',
    question: 'Qual estilo de tênis você prefere?',
    options: [
      { id: 'casual', value: 1, label: 'Casual/Esportivo' },
      { id: 'formal', value: 2, label: 'Formal/Social' },
      { id: 'streetwear', value: 3, label: 'Streetwear' },
      { id: 'vintage', value: 4, label: 'Vintage/Clássico' }
    ]
  },
  {
    id: 'roupas_1',
    category: 'roupas',
    question: 'Que estilo de roupa você prefere?',
    options: [
      { id: 'casual', value: 1, label: 'Casual/Relaxado' },
      { id: 'elegante', value: 2, label: 'Elegante/Formal' },
      { id: 'alternativo', value: 3, label: 'Alternativo/Único' },
      { id: 'minimalista', value: 4, label: 'Minimalista' }
    ]
  },
  {
    id: 'cores_1',
    category: 'cores',
    question: 'Que tipo de cores você prefere?',
    options: [
      { id: 'warm', value: 1, label: 'Cores Quentes' },
      { id: 'cool', value: 2, label: 'Cores Frias' },
      { id: 'neutral', value: 3, label: 'Cores Neutras' },
      { id: 'vibrant', value: 4, label: 'Cores Vibrantes' }
    ]
  },
  {
    id: 'hobbies_1',
    category: 'hobbies',
    question: 'Que tipo de atividade você mais gosta?',
    options: [
      { id: 'esportes', value: 1, label: 'Esportes/Fitness' },
      { id: 'cultura', value: 2, label: 'Arte/Cultura' },
      { id: 'tecnologia', value: 3, label: 'Tecnologia/Games' },
      { id: 'natureza', value: 4, label: 'Natureza/Aventura' }
    ]
  },
  {
    id: 'sentimentos_1',
    category: 'sentimentos',
    question: 'Como você se sente na maior parte do tempo?',
    options: [
      { id: 'energetico', value: 1, label: 'Energético/Motivado' },
      { id: 'calmo', value: 2, label: 'Calmo/Tranquilo' },
      { id: 'criativo', value: 3, label: 'Criativo/Inspirado' },
      { id: 'confiante', value: 4, label: 'Confiante/Determinado' }
    ]
  }
];

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

interface StyleAdjustmentScreenProps {
  navigation?: any;
}

const StyleAdjustmentScreen: React.FC<StyleAdjustmentScreenProps> = ({ navigation }) => {
  // ==============================================
  // HOOKS E ESTADO
  // ==============================================
  
  const { user } = useAuth();
  const { api } = useApi();

  const [preferences, setPreferences] = useState<StylePreferences>({
    tenis: [],
    roupas: [],
    cores: [],
    hobbies: [],
    sentimentos: []
  });
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState<LoadingState>({
    fetching: false,
    saving: false,
    updating: false
  });
  
  const [errors, setErrors] = useState<ErrorState>({
    fetch: null,
    save: null,
    update: null
  });
  
  const [completionStats, setCompletionStats] = useState({
    completed: false,
    totalCategories: 5,
    completedCategories: 0,
    completionPercentage: 0
  });

  // ==============================================
  // FUNÇÕES DE API
  // ==============================================

  /**
   * Busca preferências existentes do usuário
   */
  const fetchStylePreferences = useCallback(async () => {
    if (!user?.id) {
      logger.warn('[StyleAdjustment] Usuário não autenticado');
      return;
    }

    setLoading(prev => ({ ...prev, fetching: true }));
    setErrors(prev => ({ ...prev, fetch: null }));

    try {
      logger.info(`[StyleAdjustment] Buscando preferências para usuário ${user.id}`);
      
      const response = await api.get('/api/profile/style-preferences');
      
      if (response.data.success) {
        const { preferences: userPrefs, completionStatus } = response.data.data;
        
        setPreferences(userPrefs);
        setCompletionStats(completionStatus);
        
        // Converter preferências para selectedOptions para exibição
        const selected: Record<string, number> = {};
        STYLE_QUESTIONS.forEach(question => {
          const categoryPrefs = userPrefs[question.category];
          if (categoryPrefs && categoryPrefs.length > 0) {
            // Pegar a primeira opção como selecionada para cada questão
            const firstChoice = categoryPrefs[0];
            selected[`${question.category}_${question.id}`] = firstChoice;
          }
        });
        
        setSelectedOptions(selected);
        
        logger.info(`[StyleAdjustment] Preferências carregadas: ${completionStatus.completionPercentage}% completo`);
      } else {
        throw new Error(response.data.error || 'Erro ao carregar preferências');
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao carregar preferências';
      logger.error('[StyleAdjustment] Erro ao buscar preferências:', errorMessage);
      
      setErrors(prev => ({ ...prev, fetch: errorMessage }));
      
      Alert.alert(
        'Erro',
        `Não foi possível carregar suas preferências: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  }, [user?.id, api]);

  /**
   * Atualiza uma categoria específica
   */
  const updateCategoryPreference = async (category: keyof StylePreferences, choices: number[]) => {
    if (!user?.id) return;

    setLoading(prev => ({ ...prev, updating: true }));
    setErrors(prev => ({ ...prev, update: null }));

    try {
      logger.info(`[StyleAdjustment] Atualizando categoria ${category} para usuário ${user.id}`);
      
      const response = await api.patch(`/api/profile/style-preferences/${category}`, {
        choices
      });
      
      if (response.data.success) {
        // Atualizar estado local
        setPreferences(prev => ({
          ...prev,
          [category]: choices
        }));
        
        logger.info(`[StyleAdjustment] Categoria ${category} atualizada com sucesso`);
      } else {
        throw new Error(response.data.error || 'Erro ao atualizar categoria');
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao atualizar preferência';
      logger.error('[StyleAdjustment] Erro ao atualizar categoria:', errorMessage);
      
      setErrors(prev => ({ ...prev, update: errorMessage }));
      
      // Reverter mudança local
      await fetchStylePreferences();
      
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  /**
   * Salva todas as preferências de uma vez
   */
  const saveAllPreferences = async () => {
    if (!user?.id) return;

    setLoading(prev => ({ ...prev, saving: true }));
    setErrors(prev => ({ ...prev, save: null }));

    try {
      logger.info(`[StyleAdjustment] Salvando todas as preferências para usuário ${user.id}`);
      
      const response = await api.put('/api/profile/style-preferences', {
        preferences
      });
      
      if (response.data.success) {
        const { completionStatus } = response.data.data;
        setCompletionStats(completionStatus);
        
        Alert.alert(
          'Sucesso!',
          `Preferências salvas com sucesso!\nPerfil ${completionStatus.completionPercentage}% completo.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation && completionStatus.completed) {
                  navigation.navigate('MatchArea'); // ou próxima tela
                }
              }
            }
          ]
        );
        
        logger.info(`[StyleAdjustment] Todas as preferências salvas com sucesso`);
      } else {
        throw new Error(response.data.error || 'Erro ao salvar preferências');
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar preferências';
      logger.error('[StyleAdjustment] Erro ao salvar:', errorMessage);
      
      setErrors(prev => ({ ...prev, save: errorMessage }));
      
      Alert.alert(
        'Erro',
        `Não foi possível salvar suas preferências: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  /**
   * Limpa todas as preferências
   */
  const clearAllPreferences = async () => {
    if (!user?.id) return;

    try {
      logger.info(`[StyleAdjustment] Limpando preferências para usuário ${user.id}`);
      
      const response = await api.delete('/api/profile/style-preferences');
      
      if (response.data.success) {
        setPreferences({
          tenis: [],
          roupas: [],
          cores: [],
          hobbies: [],
          sentimentos: []
        });
        setSelectedOptions({});
        setCompletionStats({
          completed: false,
          totalCategories: 5,
          completedCategories: 0,
          completionPercentage: 0
        });
        
        Alert.alert('Sucesso', 'Todas as preferências foram removidas');
        logger.info(`[StyleAdjustment] Preferências limpas com sucesso`);
      } else {
        throw new Error(response.data.error || 'Erro ao limpar preferências');
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao limpar preferências';
      logger.error('[StyleAdjustment] Erro ao limpar:', errorMessage);
      
      Alert.alert('Erro', `Não foi possível limpar as preferências: ${errorMessage}`);
    }
  };

  // ==============================================
  // HANDLERS DE EVENTOS
  // ==============================================

  /**
   * Handler para seleção de uma opção
   */
  const handleOptionSelect = async (question: StyleQuestion, option: StyleOption) => {
    const key = `${question.category}_${question.id}`;
    
    // Atualizar estado local imediatamente para feedback visual
    setSelectedOptions(prev => ({
      ...prev,
      [key]: option.value
    }));

    // Atualizar preferências locais
    const currentCategoryPrefs = preferences[question.category];
    const newChoices = currentCategoryPrefs.includes(option.value) 
      ? currentCategoryPrefs.filter(v => v !== option.value)
      : [...currentCategoryPrefs, option.value];

    setPreferences(prev => ({
      ...prev,
      [question.category]: newChoices
    }));

    // Atualizar no backend
    await updateCategoryPreference(question.category, newChoices);
  };

  /**
   * Handler para limpar preferências com confirmação
   */
  const handleClearPreferences = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja limpar todas as suas preferências de estilo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clearAllPreferences }
      ]
    );
  };

  // ==============================================
  // EFFECTS
  // ==============================================

  useEffect(() => {
    fetchStylePreferences();
  }, [fetchStylePreferences]);

  // ==============================================
  // RENDER HELPERS
  // ==============================================

  const renderProgress = () => {
    const { completionPercentage, completedCategories, totalCategories } = completionStats;
    
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Progresso do Perfil: {completionPercentage}%
        </Text>
        <View style={{ 
          height: 8, 
          backgroundColor: '#E5E5EA', 
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <View 
            style={{ 
              height: '100%', 
              backgroundColor: '#007AFF', 
              width: `${completionPercentage}%`,
              borderRadius: 4
            }} 
          />
        </View>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          {completedCategories}/{totalCategories} categorias completas
        </Text>
      </View>
    );
  };

  const renderQuestion = (question: StyleQuestion) => {
    const selectedValue = selectedOptions[`${question.category}_${question.id}`];
    const hasSelections = preferences[question.category].length > 0;
    
    return (
      <View key={question.id} style={{ marginBottom: 32 }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          marginBottom: 16,
          color: hasSelections ? '#007AFF' : '#333'
        }}>
          {question.question}
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {question.options.map(option => {
            const isSelected = preferences[question.category].includes(option.value);
            
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleOptionSelect(question, option)}
                disabled={loading.updating}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? '#007AFF' : '#E5E5EA',
                  backgroundColor: isSelected ? '#F0F8FF' : '#FFFFFF',
                  opacity: loading.updating ? 0.6 : 1
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected ? '#007AFF' : '#333',
                  textAlign: 'center'
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {hasSelections && (
          <Text style={{ 
            fontSize: 12, 
            color: '#007AFF', 
            marginTop: 8,
            textAlign: 'center'
          }}>
            ✓ {preferences[question.category].length} seleção(ões)
          </Text>
        )}
      </View>
    );
  };

  // ==============================================
  // RENDER PRINCIPAL
  // ==============================================

  if (loading.fetching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Carregando suas preferências...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
          Ajuste seu Estilo
        </Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
          Selecione suas preferências para personalizar suas recomendações
        </Text>

        {renderProgress()}

        {errors.fetch && (
          <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#c62828' }}>Erro: {errors.fetch}</Text>
            <TouchableOpacity onPress={fetchStylePreferences} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: '600' }}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {errors.update && (
          <View style={{ backgroundColor: '#fff3e0', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#ef6c00' }}>Erro ao atualizar: {errors.update}</Text>
          </View>
        )}

        {STYLE_QUESTIONS.map(renderQuestion)}

        <View style={{ marginTop: 32, gap: 16 }}>
          <Button
            title={loading.saving ? "Salvando..." : "Salvar Todas as Preferências"}
            onPress={saveAllPreferences}
            disabled={loading.saving || Object.keys(selectedOptions).length === 0}
            style={{ 
              backgroundColor: '#007AFF', 
              paddingVertical: 16,
              opacity: loading.saving || Object.keys(selectedOptions).length === 0 ? 0.6 : 1
            }}
            textStyle={{ fontSize: 18, fontWeight: 'bold' }}
          />

          <Button
            title="Limpar Preferências"
            onPress={handleClearPreferences}
            disabled={loading.saving || completionStats.completedCategories === 0}
            style={{ 
              backgroundColor: '#FF3B30', 
              paddingVertical: 12,
              opacity: completionStats.completedCategories === 0 ? 0.6 : 1
            }}
            textStyle={{ fontSize: 16 }}
          />
        </View>

        {loading.updating && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={{ marginTop: 8, color: '#666' }}>Salvando...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default StyleAdjustmentScreen;