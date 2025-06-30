// screens/StyleAdjustmentScreen.tsx - Tela de ajuste de estilo com integração real simplificada
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';

// ==============================================
// TIPOS E INTERFACES SIMPLIFICADAS
// ==============================================

interface StylePreferences {
  tenis: number[];
  roupas: number[];
  cores: number[];
  hobbies: number[];
  sentimentos: number[];
}

interface StyleOption {
  id: string;
  value: number;
  label: string;
}

interface StyleQuestion {
  id: string;
  category: keyof StylePreferences;
  question: string;
  options: StyleOption[];
}

// ==============================================
// CONFIGURAÇÃO DA API
// ==============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Função helper para fazer requisições
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Simular token de autenticação (substituir por implementação real)
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
  // ESTADO
  // ==============================================
  
  const [preferences, setPreferences] = useState<StylePreferences>({
    tenis: [],
    roupas: [],
    cores: [],
    hobbies: [],
    sentimentos: []
  });
  
  const [loading, setLoading] = useState({
    fetching: false,
    saving: false,
    updating: false
  });
  
  const [error, setError] = useState<string | null>(null);
  
  const [completionStats, setCompletionStats] = useState({
    completed: false,
    totalCategories: 5,
    completedCategories: 0,
    completionPercentage: 0
  });

  // ==============================================
  // FUNÇÕES DE API
  // ==============================================

  const fetchStylePreferences = async () => {
    setLoading(prev => ({ ...prev, fetching: true }));
    setError(null);

    try {
      console.log('[StyleAdjustment] Buscando preferências...');
      
      const response = await apiRequest('/profile/style-preferences', {
        method: 'GET'
      });
      
      if (response.success) {
        const { preferences: userPrefs, completionStatus } = response.data;
        
        setPreferences(userPrefs);
        setCompletionStats(completionStatus);
        
        console.log(`[StyleAdjustment] Preferências carregadas: ${completionStatus.completionPercentage}% completo`);
      } else {
        throw new Error(response.error || 'Erro ao carregar preferências');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao carregar preferências';
      console.error('[StyleAdjustment] Erro ao buscar preferências:', errorMessage);
      
      setError(errorMessage);
      
      // Se for erro de conexão, mostrar dados vazios para permitir configuração inicial
      if (errorMessage.includes('fetch')) {
        console.log('[StyleAdjustment] Modo offline - usando dados vazios');
        setPreferences({
          tenis: [],
          roupas: [],
          cores: [],
          hobbies: [],
          sentimentos: []
        });
      }
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  const updateCategoryPreference = async (category: keyof StylePreferences, choices: number[]) => {
    setLoading(prev => ({ ...prev, updating: true }));

    try {
      console.log(`[StyleAdjustment] Atualizando categoria ${category}:`, choices);
      
      const response = await apiRequest(`/profile/style-preferences/${category}`, {
        method: 'PATCH',
        body: JSON.stringify({ choices })
      });
      
      if (response.success) {
        // Atualizar estado local
        setPreferences(prev => ({
          ...prev,
          [category]: choices
        }));
        
        // Recalcular estatísticas
        const newPrefs = { ...preferences, [category]: choices };
        const completedCategories = Object.keys(newPrefs).filter(cat => 
          newPrefs[cat as keyof StylePreferences].length > 0
        ).length;
        
        setCompletionStats({
          completed: completedCategories === 5,
          totalCategories: 5,
          completedCategories,
          completionPercentage: Math.round((completedCategories / 5) * 100)
        });
        
        console.log(`[StyleAdjustment] Categoria ${category} atualizada com sucesso`);
      } else {
        throw new Error(response.error || 'Erro ao atualizar categoria');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao atualizar preferência';
      console.error('[StyleAdjustment] Erro ao atualizar categoria:', errorMessage);
      
      Alert.alert('Erro', `Não foi possível salvar: ${errorMessage}`);
      
      // Reverter mudança local
      await fetchStylePreferences();
      
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const saveAllPreferences = async () => {
    setLoading(prev => ({ ...prev, saving: true }));

    try {
      console.log('[StyleAdjustment] Salvando todas as preferências...');
      
      const response = await apiRequest('/profile/style-preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences })
      });
      
      if (response.success) {
        const { completionStatus } = response.data;
        setCompletionStats(completionStatus);
        
        Alert.alert(
          'Sucesso!',
          `Preferências salvas com sucesso!\nPerfil ${completionStatus.completionPercentage}% completo.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation && completionStatus.completed) {
                  navigation.navigate('MatchArea');
                }
              }
            }
          ]
        );
        
        console.log('[StyleAdjustment] Todas as preferências salvas com sucesso');
      } else {
        throw new Error(response.error || 'Erro ao salvar preferências');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar preferências';
      console.error('[StyleAdjustment] Erro ao salvar:', errorMessage);
      
      Alert.alert('Erro', `Não foi possível salvar: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const clearAllPreferences = async () => {
    try {
      console.log('[StyleAdjustment] Limpando preferências...');
      
      const response = await apiRequest('/profile/style-preferences', {
        method: 'DELETE'
      });
      
      if (response.success) {
        setPreferences({
          tenis: [],
          roupas: [],
          cores: [],
          hobbies: [],
          sentimentos: []
        });
        setCompletionStats({
          completed: false,
          totalCategories: 5,
          completedCategories: 0,
          completionPercentage: 0
        });
        
        Alert.alert('Sucesso', 'Todas as preferências foram removidas');
        console.log('[StyleAdjustment] Preferências limpas com sucesso');
      } else {
        throw new Error(response.error || 'Erro ao limpar preferências');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao limpar preferências';
      console.error('[StyleAdjustment] Erro ao limpar:', errorMessage);
      
      Alert.alert('Erro', `Não foi possível limpar: ${errorMessage}`);
    }
  };

  // ==============================================
  // HANDLERS DE EVENTOS
  // ==============================================

  const handleOptionSelect = async (question: StyleQuestion, option: StyleOption) => {
    const currentCategoryPrefs = preferences[question.category];
    const isSelected = currentCategoryPrefs.includes(option.value);
    
    let newChoices: number[];
    if (isSelected) {
      // Remover se já selecionado
      newChoices = currentCategoryPrefs.filter(v => v !== option.value);
    } else {
      // Adicionar se não selecionado
      newChoices = [...currentCategoryPrefs, option.value];
    }

    // Atualizar no backend
    await updateCategoryPreference(question.category, newChoices);
  };

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
  }, []);

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

        {error && (
          <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#c62828' }}>⚠️ {error}</Text>
            <TouchableOpacity onPress={fetchStylePreferences} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: '600' }}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {STYLE_QUESTIONS.map(renderQuestion)}

        <View style={{ marginTop: 32, gap: 16 }}>
          <TouchableOpacity
            onPress={saveAllPreferences}
            disabled={loading.saving || completionStats.completedCategories === 0}
            style={{ 
              backgroundColor: '#007AFF', 
              paddingVertical: 16,
              borderRadius: 8,
              opacity: loading.saving || completionStats.completedCategories === 0 ? 0.6 : 1
            }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              {loading.saving ? "Salvando..." : "Salvar Todas as Preferências"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearPreferences}
            disabled={loading.saving || completionStats.completedCategories === 0}
            style={{ 
              backgroundColor: '#FF3B30', 
              paddingVertical: 12,
              borderRadius: 8,
              opacity: completionStats.completedCategories === 0 ? 0.6 : 1
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
              Limpar Preferências
            </Text>
          </TouchableOpacity>
        </View>

        {loading.updating && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={{ marginTop: 8, color: '#666' }}>Salvando...</Text>
          </View>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <View style={{ marginTop: 32, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Debug Info:</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>
              API: {API_BASE_URL}{'\n'}
              Preferências: {JSON.stringify(preferences, null, 2)}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default StyleAdjustmentScreen;