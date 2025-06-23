// screens/StyleAdjustmentScreen.tsx - Tela de ajuste de estilo com integração real ao backend
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Button from '../components/common/Button';
import { logger } from '../utils/logger';

// =====================================================
// TIPOS E INTERFACES (FASE 0)
// =====================================================

interface StylePreference {
  category: string;
  questionId: string;
  selectedOption: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StylePreferencesResponse {
  userId: string;
  preferences: StylePreference[];
  completionStatus: {
    completed: boolean;
    totalQuestions: number;
    answeredQuestions: number;
  };
  lastUpdated: string;
}

interface StyleQuestion {
  id: string;
  category: string;
  question: string;
  options: StyleOption[];
}

interface StyleOption {
  id: string;
  label: string;
  value: string;
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

// =====================================================
// DADOS DE QUESTÕES (substituirá dados mockados)
// =====================================================

const STYLE_QUESTIONS: StyleQuestion[] = [
  {
    id: 'color_1',
    category: 'cores',
    question: 'Que tipo de cores você prefere?',
    options: [
      { id: 'warm', label: 'Cores Quentes', value: 'warm' },
      { id: 'cool', label: 'Cores Frias', value: 'cool' },
      { id: 'neutral', label: 'Cores Neutras', value: 'neutral' }
    ]
  },
  {
    id: 'tenis_1',
    category: 'tenis',
    question: 'Qual estilo de tênis você prefere?',
    options: [
      { id: 'casual', label: 'Casual/Esportivo', value: 'casual' },
      { id: 'formal', label: 'Formal/Social', value: 'formal' },
      { id: 'streetwear', label: 'Streetwear', value: 'streetwear' }
    ]
  },
  {
    id: 'roupas_1',
    category: 'roupas',
    question: 'Que estilo de roupa você prefere?',
    options: [
      { id: 'casual', label: 'Casual/Relaxado', value: 'casual' },
      { id: 'elegante', label: 'Elegante/Formal', value: 'elegante' },
      { id: 'alternativo', label: 'Alternativo/Único', value: 'alternativo' }
    ]
  },
  {
    id: 'hobbies_1',
    category: 'hobbies',
    question: 'Que tipo de atividade você mais gosta?',
    options: [
      { id: 'esportes', label: 'Esportes/Fitness', value: 'esportes' },
      { id: 'cultura', label: 'Arte/Cultura', value: 'cultura' },
      { id: 'tecnologia', label: 'Tecnologia/Games', value: 'tecnologia' }
    ]
  },
  {
    id: 'sentimentos_1',
    category: 'sentimentos',
    question: 'Como você se sente na maior parte do tempo?',
    options: [
      { id: 'energetico', label: 'Energético/Motivado', value: 'energetico' },
      { id: 'calmo', label: 'Calmo/Tranquilo', value: 'calmo' },
      { id: 'criativo', label: 'Criativo/Inspirado', value: 'criativo' }
    ]
  }
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

interface StyleAdjustmentScreenProps {
  navigation?: any; // Navegação do React Navigation
}

const StyleAdjustmentScreen: React.FC<StyleAdjustmentScreenProps> = ({ navigation }) => {
  // =====================================================
  // HOOKS E ESTADO
  // =====================================================
  
  const { user } = useAuth();
  const { api } = useApi();

  const [preferences, setPreferences] = useState<StylePreference[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
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
    totalQuestions: STYLE_QUESTIONS.length,
    answeredQuestions: 0
  });

  // =====================================================
  // FUNÇÕES DE API
  // =====================================================

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
      logger.info('[StyleAdjustment] Buscando preferências do usuário');
      
      const response = await api.get('/profile/style-preferences');
      const data: StylePreferencesResponse = response.data;

      // Atualizar estado com dados do backend
      setPreferences(data.preferences);
      setCompletionStats(data.completionStatus);

      // Converter preferências para formato do selectedOptions
      const optionsMap: Record<string, string> = {};
      data.preferences.forEach(pref => {
        const key = `${pref.category}_${pref.questionId}`;
        optionsMap[key] = pref.selectedOption;
      });
      setSelectedOptions(optionsMap);

      logger.info(`[StyleAdjustment] Carregadas ${data.preferences.length} preferências`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao carregar preferências';
      logger.error('[StyleAdjustment] Erro ao buscar preferências:', errorMessage);
      
      setErrors(prev => ({ ...prev, fetch: errorMessage }));
      
      // Se for erro 404, significa que o usuário não tem preferências ainda
      if (error.response?.status === 404) {
        logger.info('[StyleAdjustment] Usuário sem preferências - iniciando do zero');
        setErrors(prev => ({ ...prev, fetch: null }));
      }
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  }, [user?.id, api]);

  /**
   * Atualiza uma preferência específica
   */
  const updateStylePreference = async (category: string, questionId: string, selectedOption: string) => {
    if (!user?.id) return;

    setLoading(prev => ({ ...prev, updating: true }));
    setErrors(prev => ({ ...prev, update: null }));

    try {
      logger.info(`[StyleAdjustment] Atualizando preferência: ${category}_${questionId} = ${selectedOption}`);

      const response = await api.put('/profile/style-preferences', {
        category,
        questionId,
        selectedOption
      });

      if (response.data.success) {
        // Atualizar estado local
        const key = `${category}_${questionId}`;
        setSelectedOptions(prev => ({
          ...prev,
          [key]: selectedOption
        }));

        // Atualizar lista de preferências
        setPreferences(prev => {
          const existing = prev.find(p => p.category === category && p.questionId === questionId);
          if (existing) {
            return prev.map(p => 
              p.category === category && p.questionId === questionId 
                ? { ...p, selectedOption, updatedAt: new Date().toISOString() }
                : p
            );
          } else {
            return [...prev, { category, questionId, selectedOption }];
          }
        });

        // Atualizar estatísticas
        setCompletionStats(prev => ({
          ...prev,
          answeredQuestions: Object.keys(selectedOptions).length + 1,
          completed: Object.keys(selectedOptions).length + 1 >= STYLE_QUESTIONS.length
        }));

        logger.info(`[StyleAdjustment] Preferência atualizada com sucesso`);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar preferência';
      logger.error('[StyleAdjustment] Erro ao atualizar preferência:', errorMessage);
      
      setErrors(prev => ({ ...prev, update: errorMessage }));
      
      Alert.alert(
        'Erro',
        `Não foi possível salvar sua preferência: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  /**
   * Salva todas as preferências de uma vez (batch)
   */
  const saveAllPreferences = async () => {
    if (!user?.id) return;

    setLoading(prev => ({ ...prev, saving: true }));
    setErrors(prev => ({ ...prev, save: null }));

    try {
      logger.info('[StyleAdjustment] Salvando todas as preferências em lote');

      const preferencesToSave = Object.entries(selectedOptions).map(([key, value]) => {
        const [category, questionId] = key.split('_');
        return {
          category,
          questionId,
          selectedOption: value
        };
      });

      const response = await api.post('/profile/style-preferences/batch', {
        preferences: preferencesToSave
      });

      if (response.data.success) {
        logger.info(`[StyleAdjustment] Salvas ${response.data.updated} preferências com sucesso`);
        
        Alert.alert(
          'Sucesso!',
          `${response.data.updated} preferências foram salvas com sucesso.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navegar para próxima tela ou fechar
                if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );

        // Recarregar dados para sincronizar
        await fetchStylePreferences();
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar preferências';
      logger.error('[StyleAdjustment] Erro ao salvar em lote:', errorMessage);
      
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

  // =====================================================
  // HANDLERS DE EVENTOS
  // =====================================================

  /**
   * Handler para seleção de uma opção
   */
  const handleOptionSelect = async (category: string, questionId: string, option: string) => {
    const key = `${category}_${questionId}`;
    
    // Atualizar estado local imediatamente para feedback visual
    setSelectedOptions(prev => ({
      ...prev,
      [key]: option
    }));

    // Atualizar no backend (auto-save)
    await updateStylePreference(category, questionId, option);
  };

  /**
   * Handler para limpar todas as preferências
   */
  const handleClearPreferences = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja limpar todas as suas preferências de estilo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/profile/style-preferences');
              setSelectedOptions({});
              setPreferences([]);
              setCompletionStats({
                completed: false,
                totalQuestions: STYLE_QUESTIONS.length,
                answeredQuestions: 0
              });
              Alert.alert('Sucesso', 'Preferências removidas com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar as preferências');
            }
          }
        }
      ]
    );
  };

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    if (user?.id) {
      fetchStylePreferences();
    }
  }, [user?.id, fetchStylePreferences]);

  // =====================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =====================================================

  /**
   * Renderiza uma questão de estilo
   */
  const renderQuestion = (question: StyleQuestion) => {
    const key = `${question.category}_${question.id}`;
    const selectedValue = selectedOptions[key];

    return (
      <View key={question.id} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          {question.question}
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {question.options.map(option => (
            <Button
              key={option.id}
              title={option.label}
              onPress={() => handleOptionSelect(question.category, question.id, option.value)}
              style={{
                backgroundColor: selectedValue === option.value ? '#007AFF' : '#E5E5E7',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                minWidth: 100
              }}
              textStyle={{
                color: selectedValue === option.value ? 'white' : '#333',
                fontSize: 14
              }}
              disabled={loading.updating}
            />
          ))}
        </View>
      </View>
    );
  };

  /**
   * Renderiza indicador de progresso
   */
  const renderProgress = () => {
    const percentage = Math.round((completionStats.answeredQuestions / completionStats.totalQuestions) * 100);
    
    return (
      <View style={{ padding: 16, backgroundColor: '#f0f0f0', marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Progresso: {completionStats.answeredQuestions}/{completionStats.totalQuestions} questões
        </Text>
        <View style={{ height: 8, backgroundColor: '#ddd', borderRadius: 4 }}>
          <View 
            style={{ 
              height: '100%', 
              backgroundColor: '#007AFF', 
              borderRadius: 4,
              width: `${percentage}%`
            }} 
          />
        </View>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          {percentage}% completo
        </Text>
      </View>
    );
  };

  /**
   * Renderiza estado de loading
   */
  if (loading.fetching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Carregando suas preferências...</Text>
      </View>
    );
  }

  /**
   * Renderiza erro de carregamento
   */
  if (errors.fetch) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center', marginBottom: 16 }}>
          Erro ao carregar preferências
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>
          {errors.fetch}
        </Text>
        <Button
          title="Tentar Novamente"
          onPress={fetchStylePreferences}
          style={{ backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12 }}
        />
      </View>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Ajuste seu Estilo
        </Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
          Responda as perguntas abaixo para personalizar suas recomendações
        </Text>

        {renderProgress()}

        {errors.update && (
          <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#c62828' }}>Erro: {errors.update}</Text>
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
            disabled={loading.saving || preferences.length === 0}
            style={{ 
              backgroundColor: '#FF3B30', 
              paddingVertical: 12,
              opacity: preferences.length === 0 ? 0.6 : 1
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