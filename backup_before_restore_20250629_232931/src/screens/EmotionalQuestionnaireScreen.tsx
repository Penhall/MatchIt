// screens/EmotionalQuestionnaireScreen.tsx - Interface para questionário emocional
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

// ==============================================
// TIPOS E INTERFACES
// ==============================================

interface EmotionalQuestion {
  id: string;
  type: 'scale' | 'single_choice' | 'multiple_choice';
  question: string;
  description?: string;
  options?: EmotionalOption[];
  scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  required: boolean;
  weight: number;
}

interface EmotionalOption {
  id: string;
  label: string;
  value: string | number;
}

interface EmotionalSection {
  id: string;
  title: string;
  description: string;
  questions: EmotionalQuestion[];
}

interface EmotionalResponse {
  questionId: string;
  answer: string | number | string[] | number[];
  confidence: number;
  timeSpent: number;
  questionType: string;
}

interface EmotionalQuestionnaire {
  id: string;
  version: string;
  estimatedTime: number;
  sections: EmotionalSection[];
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

interface EmotionalQuestionnaireScreenProps {
  navigation?: any;
  onComplete?: (profile: any) => void;
}

const EmotionalQuestionnaireScreen: React.FC<EmotionalQuestionnaireScreenProps> = ({ 
  navigation, 
  onComplete 
}) => {
  // ==============================================
  // ESTADO
  // ==============================================
  
  const [questionnaire, setQuestionnaire] = useState<EmotionalQuestionnaire | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, EmotionalResponse>>({});
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState({
    fetching: false,
    saving: false,
    processing: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    percentage: 0
  });

  // ==============================================
  // FUNÇÕES DE API
  // ==============================================

  const fetchQuestionnaire = async () => {
    setLoading(prev => ({ ...prev, fetching: true }));
    setError(null);

    try {
      console.log('[EmotionalQuestionnaire] Buscando questionário...');
      
      const response = await apiRequest('/profile/emotional/questionnaire', {
        method: 'GET'
      });
      
      if (response.success) {
        const { questionnaire: quest, existingResponses, progress: prog, resumeFromSection } = response.data;
        
        setQuestionnaire(quest);
        setProgress(prog);
        
        // Converter respostas existentes para formato do estado
        const existingResponsesMap: Record<string, EmotionalResponse> = {};
        if (existingResponses && existingResponses.length > 0) {
          existingResponses.forEach((response: EmotionalResponse) => {
            existingResponsesMap[response.questionId] = response;
          });
        }
        setResponses(existingResponsesMap);
        
        // Encontrar seção para continuar
        if (resumeFromSection) {
          const sectionIndex = quest.sections.findIndex((s: EmotionalSection) => s.id === resumeFromSection);
          if (sectionIndex >= 0) {
            setCurrentSectionIndex(sectionIndex);
          }
        }
        
        console.log(`[EmotionalQuestionnaire] Questionário carregado: ${prog.percentage}% completo`);
      } else {
        throw new Error(response.error || 'Erro ao carregar questionário');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao carregar questionário';
      console.error('[EmotionalQuestionnaire] Erro ao buscar questionário:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  const savePartialResponses = async () => {
    if (Object.keys(responses).length === 0) return;

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      console.log('[EmotionalQuestionnaire] Salvando respostas parciais...');
      
      const responsesArray = Object.values(responses);
      
      const response = await apiRequest('/profile/emotional/responses', {
        method: 'POST',
        body: JSON.stringify({
          responses: responsesArray,
          partial: true
        })
      });
      
      if (response.success) {
        setProgress(response.data.progress);
        console.log('[EmotionalQuestionnaire] Respostas parciais salvas');
      }

    } catch (error: any) {
      console.error('[EmotionalQuestionnaire] Erro ao salvar parciais:', error.message);
      // Não mostrar erro para salvamento automático
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const submitCompleteResponses = async () => {
    setLoading(prev => ({ ...prev, processing: true }));

    try {
      console.log('[EmotionalQuestionnaire] Processando questionário completo...');
      
      const responsesArray = Object.values(responses);
      
      const response = await apiRequest('/profile/emotional/responses', {
        method: 'POST',
        body: JSON.stringify({
          responses: responsesArray,
          partial: false
        })
      });
      
      if (response.success) {
        const { emotionalProfile, insights, recommendations } = response.data;
        
        Alert.alert(
          'Perfil Emocional Criado! 🎉',
          'Seu perfil emocional foi gerado com sucesso! Agora você terá matches ainda mais compatíveis.',
          [
            {
              text: 'Ver Meu Perfil',
              onPress: () => {
                if (onComplete) {
                  onComplete(emotionalProfile);
                } else if (navigation) {
                  navigation.navigate('EmotionalProfile', { 
                    profile: emotionalProfile,
                    insights,
                    recommendations
                  });
                }
              }
            }
          ]
        );
        
        console.log('[EmotionalQuestionnaire] Perfil emocional gerado com sucesso');
      } else {
        throw new Error(response.error || 'Erro ao processar questionário');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao processar questionário';
      console.error('[EmotionalQuestionnaire] Erro ao processar:', errorMessage);
      
      Alert.alert('Erro', `Não foi possível gerar seu perfil: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, processing: false }));
    }
  };

  // ==============================================
  // HANDLERS DE EVENTOS
  // ==============================================

  const handleQuestionResponse = (questionId: string, answer: string | number, questionType: string) => {
    const startTime = questionStartTimes[questionId] || Date.now();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    const response: EmotionalResponse = {
      questionId,
      answer,
      confidence: 85, // Pode ser ajustado baseado na velocidade de resposta
      timeSpent,
      questionType
    };
    
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
    
    // Salvar automaticamente após algumas respostas
    const totalResponses = Object.keys(responses).length + 1;
    if (totalResponses % 5 === 0) {
      setTimeout(savePartialResponses, 1000);
    }
  };

  const handleScaleResponse = (questionId: string, value: number) => {
    handleQuestionResponse(questionId, value, 'scale');
  };

  const handleChoiceResponse = (questionId: string, value: string) => {
    handleQuestionResponse(questionId, value, 'single_choice');
  };

  const goToNextSection = () => {
    if (!questionnaire) return;
    
    if (currentSectionIndex < questionnaire.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      // Salvar progresso ao mudar de seção
      setTimeout(savePartialResponses, 500);
    } else {
      // Último seção - processar questionário completo
      submitCompleteResponses();
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  // ==============================================
  // EFFECTS
  // ==============================================

  useEffect(() => {
    fetchQuestionnaire();
  }, []);

  // Track tempo de início para cada pergunta visível
  useEffect(() => {
    if (questionnaire && currentSectionIndex < questionnaire.sections.length) {
      const currentSection = questionnaire.sections[currentSectionIndex];
      const now = Date.now();
      
      const newStartTimes: Record<string, number> = {};
      currentSection.questions.forEach(question => {
        if (!questionStartTimes[question.id]) {
          newStartTimes[question.id] = now;
        }
      });
      
      if (Object.keys(newStartTimes).length > 0) {
        setQuestionStartTimes(prev => ({ ...prev, ...newStartTimes }));
      }
    }
  }, [currentSectionIndex, questionnaire]);

  // ==============================================
  // RENDER HELPERS
  // ==============================================

  const renderProgress = () => {
    if (!questionnaire) return null;
    
    const sectionProgress = ((currentSectionIndex + 1) / questionnaire.sections.length) * 100;
    const overallProgress = progress.percentage;
    
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Seção {currentSectionIndex + 1} de {questionnaire.sections.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${sectionProgress}%` }]} 
          />
        </View>
        <Text style={styles.progressSubtext}>
          {overallProgress}% do questionário completo
        </Text>
      </View>
    );
  };

  const renderScaleQuestion = (question: EmotionalQuestion) => {
    const currentValue = responses[question.id]?.answer as number || 5;
    const scale = question.scale!;
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>{question.question}</Text>
        {question.description && (
          <Text style={styles.questionDescription}>{question.description}</Text>
        )}
        
        <View style={styles.scaleContainer}>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>{scale.labels[0]}</Text>
            <Text style={styles.scaleLabel}>{scale.labels[1]}</Text>
          </View>
          
          <View style={styles.scaleButtons}>
            {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
              const value = scale.min + i;
              const isSelected = currentValue === value;
              
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.scaleButton,
                    isSelected && styles.scaleButtonSelected
                  ]}
                  onPress={() => handleScaleResponse(question.id, value)}
                >
                  <Text style={[
                    styles.scaleButtonText,
                    isSelected && styles.scaleButtonTextSelected
                  ]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={styles.scaleValue}>
            Resposta: {currentValue}
          </Text>
        </View>
      </View>
    );
  };

  const renderChoiceQuestion = (question: EmotionalQuestion) => {
    const currentValue = responses[question.id]?.answer as string;
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>{question.question}</Text>
        {question.description && (
          <Text style={styles.questionDescription}>{question.description}</Text>
        )}
        
        <View style={styles.choicesContainer}>
          {question.options!.map(option => {
            const isSelected = currentValue === option.value;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.choiceButton,
                  isSelected && styles.choiceButtonSelected
                ]}
                onPress={() => handleChoiceResponse(question.id, option.value as string)}
              >
                <Text style={[
                  styles.choiceButtonText,
                  isSelected && styles.choiceButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderQuestion = (question: EmotionalQuestion) => {
    switch (question.type) {
      case 'scale':
        return renderScaleQuestion(question);
      case 'single_choice':
        return renderChoiceQuestion(question);
      default:
        return (
          <View style={styles.questionContainer}>
            <Text>Tipo de pergunta não suportado: {question.type}</Text>
          </View>
        );
    }
  };

  const renderCurrentSection = () => {
    if (!questionnaire) return null;
    
    const currentSection = questionnaire.sections[currentSectionIndex];
    if (!currentSection) return null;
    
    // Verificar se todas as perguntas da seção foram respondidas
    const sectionQuestions = currentSection.questions.filter(q => q.required);
    const answeredQuestions = sectionQuestions.filter(q => responses[q.id]);
    const sectionComplete = answeredQuestions.length === sectionQuestions.length;
    
    const isLastSection = currentSectionIndex === questionnaire.sections.length - 1;
    
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{currentSection.title}</Text>
          <Text style={styles.sectionDescription}>{currentSection.description}</Text>
        </View>
        
        <ScrollView style={styles.questionsScroll}>
          {currentSection.questions.map(renderQuestion)}
        </ScrollView>
        
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentSectionIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPreviousSection}
            disabled={currentSectionIndex === 0}
          >
            <Text style={styles.navButtonText}>← Anterior</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionProgress}>
            {answeredQuestions.length}/{sectionQuestions.length} respondidas
          </Text>
          
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              !sectionComplete && styles.navButtonDisabled
            ]}
            onPress={goToNextSection}
            disabled={!sectionComplete || loading.processing}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              {loading.processing 
                ? 'Processando...' 
                : isLastSection 
                  ? 'Finalizar 🎉' 
                  : 'Próxima →'
              }
            </Text>
          </TouchableOpacity>
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
        <Text style={styles.loadingText}>Carregando questionário emocional...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Erro</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuestionnaire}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questionnaire) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Questionário não disponível</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil Emocional</Text>
        <Text style={styles.subtitle}>
          Descubra suas emoções e encontre conexões mais profundas
        </Text>
        {renderProgress()}
      </View>
      
      {renderCurrentSection()}
      
      {loading.saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.savingText}>Salvando...</Text>
        </View>
      )}
    </View>
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
    color: '#FF3B30',
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
  
  progressContainer: {
    marginTop: 16,
  },
  
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  
  progressSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  
  sectionContainer: {
    flex: 1,
  },
  
  sectionHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  sectionDescription: {
    fontSize: 16,
    color: '#666',
  },
  
  questionsScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  questionContainer: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  questionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  
  scaleContainer: {
    alignItems: 'center',
  },
  
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  
  scaleLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  
  scaleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  
  scaleButtonSelected: {
    backgroundColor: '#007AFF',
  },
  
  scaleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  
  scaleButtonTextSelected: {
    color: 'white',
  },
  
  scaleValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  choicesContainer: {
    gap: 12,
  },
  
  choiceButton: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  
  choiceButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  
  choiceButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  
  choiceButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  
  navButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  
  navButtonDisabled: {
    opacity: 0.5,
  },
  
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  navButtonTextPrimary: {
    color: 'white',
  },
  
  sectionProgress: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  savingIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 24,
    borderRadius: 20,
  },
  
  savingText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default EmotionalQuestionnaireScreen;