// screens/EmotionalStyleAdjustmentScreen.tsx - Expansão da Tela de Ajuste com Perfil Emocional

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '../components/common/Button';
import { 
  EmotionalProfile,
  EmotionType,
  AttachmentStyle,
  CommunicationStyle,
  ConflictResolutionStyle,
  LoveLanguage 
} from '../types/recommendation-emotional';
import { EmotionalProfileService } from '../services/recommendation/emotional-profile-service';

interface EmotionalStyleAdjustmentScreenProps {
  userId: string;
  onComplete?: (profile: EmotionalProfile) => void;
  existingStylePreferences?: any; // Preferências de estilo já existentes
}

/**
 * Tela expandida que inclui tanto ajuste de estilo quanto perfil emocional
 * Integra com a funcionalidade existente de StyleAdjustmentScreen
 */
const EmotionalStyleAdjustmentScreen: React.FC<EmotionalStyleAdjustmentScreenProps> = ({ 
  userId, 
  onComplete,
  existingStylePreferences 
}) => {
  
  // =====================================================
  // ESTADOS PARA PERFIL EMOCIONAL
  // =====================================================
  
  const [currentSection, setCurrentSection] = useState<'style' | 'emotional'>('style');
  const [emotionalResponses, setEmotionalResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Estados existentes do sistema de estilo (mantidos)
  const [selectedStyleOptions, setSelectedStyleOptions] = useState<Record<string, string>>({});
  
  // =====================================================
  // QUESTIONÁRIOS EMOCIONAIS
  // =====================================================
  
  const emotionalSections = [
    {
      id: 'energy',
      title: 'Energia e Vitalidade',
      icon: 'bolt',
      color: ['#FF6B6B', '#FF8E53'],
      questions: [
        {
          id: 'energy_general',
          question: 'Como você descreveria seu nível geral de energia?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Muito baixa', 'Moderada', 'Muito alta']
        },
        {
          id: 'energy_social',
          question: 'Quanta energia você tem para atividades sociais?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Prefiro sozinho(a)', 'Equilibrado', 'Amo socializar']
        },
        {
          id: 'energy_physical',
          question: 'Qual seu nível de energia para atividades físicas?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Sedentário(a)', 'Moderado', 'Muito ativo(a)']
        },
        {
          id: 'energy_mental',
          question: 'Como está sua energia mental para desafios?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Prefiro relaxar', 'Equilibrado', 'Amo desafios']
        }
      ]
    },
    {
      id: 'openness',
      title: 'Abertura Emocional',
      icon: 'favorite',
      color: ['#4ECDC4', '#44A08D'],
      questions: [
        {
          id: 'openness_general',
          question: 'Quão aberto(a) você é para novas experiências?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Prefiro rotina', 'Equilibrado', 'Adoro novidades']
        },
        {
          id: 'vulnerability',
          question: 'Quão confortável você se sente sendo vulnerável?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Muito difícil', 'Depende', 'Bem confortável']
        },
        {
          id: 'emotional_expression',
          question: 'Com que facilidade você expressa suas emoções?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Muito reservado(a)', 'Equilibrado', 'Muito expressivo(a)']
        },
        {
          id: 'empathy',
          question: 'Como você se vê em termos de empatia?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Analítico(a)', 'Equilibrado', 'Muito empático(a)']
        }
      ]
    },
    {
      id: 'stability',
      title: 'Estabilidade Emocional',
      icon: 'balance',
      color: ['#667eea', '#764ba2'],
      questions: [
        {
          id: 'emotional_stability',
          question: 'Como você avalia sua estabilidade emocional?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Muito variável', 'Às vezes', 'Muito estável']
        },
        {
          id: 'stress_resilience',
          question: 'Como você lida com situações estressantes?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Me afeta muito', 'Depende', 'Lido bem']
        },
        {
          id: 'self_control',
          question: 'Qual seu nível de autocontrole emocional?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Impulsivo(a)', 'Equilibrado', 'Muito controlado(a)']
        },
        {
          id: 'adaptability',
          question: 'Quão bem você se adapta a mudanças?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Difícil', 'Gradualmente', 'Facilmente']
        }
      ]
    },
    {
      id: 'social',
      title: 'Orientação Social',
      icon: 'people',
      color: ['#ffecd2', '#fcb69f'],
      questions: [
        {
          id: 'extroversion',
          question: 'Você se considera mais introvertido(a) ou extrovertido(a)?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Muito introvertido(a)', 'Ambivertido(a)', 'Muito extrovertido(a)']
        },
        {
          id: 'social_confidence',
          question: 'Qual sua confiança em situações sociais?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Ansioso(a)', 'Depende', 'Muito confiante']
        },
        {
          id: 'group_orientation',
          question: 'Você prefere atividades individuais ou em grupo?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Individual', 'Ambos', 'Em grupo']
        },
        {
          id: 'intimacy_comfort',
          question: 'Quão confortável você se sente com intimidade emocional?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Desconfortável', 'Gradual', 'Muito confortável']
        }
      ]
    },
    {
      id: 'relationship_style',
      title: 'Estilo de Relacionamento',
      icon: 'favorite_border',
      color: ['#a8edea', '#fed6e3'],
      questions: [
        {
          id: 'attachment_style',
          question: 'Como você se comporta em relacionamentos?',
          type: 'multiple_choice',
          options: [
            { value: 'secure', label: 'Seguro - confiante e estável' },
            { value: 'anxious', label: 'Ansioso - preciso de reasseguramento' },
            { value: 'avoidant', label: 'Evitativo - valorizo independência' },
            { value: 'disorganized', label: 'Misto - varia conforme situação' }
          ]
        },
        {
          id: 'communication_style',
          question: 'Como você prefere se comunicar?',
          type: 'multiple_choice',
          options: [
            { value: 'direct', label: 'Direto - falo claramente' },
            { value: 'indirect', label: 'Indireto - uso sinais sutis' },
            { value: 'assertive', label: 'Assertivo - firme mas respeitoso' },
            { value: 'passive', label: 'Passivo - evito conflitos' },
            { value: 'aggressive', label: 'Intenso - sou muito expressivo' }
          ]
        },
        {
          id: 'conflict_style',
          question: 'Como você lida com conflitos?',
          type: 'multiple_choice',
          options: [
            { value: 'collaborative', label: 'Colaborativo - busco soluções juntos' },
            { value: 'competitive', label: 'Competitivo - quero estar certo' },
            { value: 'accommodating', label: 'Acomodativo - cedo para manter paz' },
            { value: 'avoiding', label: 'Evitativo - prefiro não discutir' },
            { value: 'compromising', label: 'Negociador - busco meio termo' }
          ]
        },
        {
          id: 'love_languages',
          question: 'Como você prefere dar e receber amor? (múltipla escolha)',
          type: 'checkbox',
          options: [
            { value: 'words_of_affirmation', label: 'Palavras de afirmação' },
            { value: 'quality_time', label: 'Tempo de qualidade' },
            { value: 'physical_touch', label: 'Toque físico' },
            { value: 'acts_of_service', label: 'Atos de serviço' },
            { value: 'receiving_gifts', label: 'Presentes' }
          ]
        }
      ]
    },
    {
      id: 'emotions',
      title: 'Emoções e Humor',
      icon: 'mood',
      color: ['#ff9a9e', '#fecfef'],
      questions: [
        {
          id: 'dominant_emotions',
          question: 'Que emoções você sente com mais frequência? (múltipla escolha)',
          type: 'checkbox',
          options: [
            { value: 'joy', label: 'Alegria' },
            { value: 'contentment', label: 'Contentamento' },
            { value: 'excitement', label: 'Empolgação' },
            { value: 'calm', label: 'Calma' },
            { value: 'anxiety', label: 'Ansiedade' },
            { value: 'sadness', label: 'Tristeza' },
            { value: 'frustration', label: 'Frustração' },
            { value: 'confidence', label: 'Confiança' },
            { value: 'love', label: 'Amor' },
            { value: 'gratitude', label: 'Gratidão' }
          ]
        },
        {
          id: 'mood_stability',
          question: 'Como você descreveria a estabilidade do seu humor?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Muito variável', 'Moderado', 'Muito estável']
        },
        {
          id: 'average_mood',
          question: 'Qual seu humor geral no dia a dia?',
          type: 'slider',
          min: 0,
          max: 100,
          labels: ['Frequentemente baixo', 'Neutro', 'Frequentemente alto']
        }
      ]
    }
  ];
  
  // =====================================================
  // FUNÇÕES DE MANIPULAÇÃO
  // =====================================================
  
  const handleEmotionalResponse = (sectionId: string, questionId: string, value: any) => {
    setEmotionalResponses(prev => ({
      ...prev,
      [`${sectionId}_${questionId}`]: value
    }));
    
    // Atualizar progresso
    const totalQuestions = emotionalSections.reduce((acc, section) => acc + section.questions.length, 0);
    const answeredQuestions = Object.keys(emotionalResponses).length + 1;
    setProgress(Math.round((answeredQuestions / totalQuestions) * 100));
  };
  
  const handleStyleResponse = (category: string, questionId: string, option: string) => {
    setSelectedStyleOptions(prev => ({
      ...prev,
      [`${category}_${questionId}`]: option
    }));
  };
  
  const validateEmotionalSection = (sectionId: string): boolean => {
    const section = emotionalSections.find(s => s.id === sectionId);
    if (!section) return false;
    
    return section.questions.every(question => {
      const responseKey = `${sectionId}_${question.id}`;
      return emotionalResponses[responseKey] !== undefined;
    });
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Verificar se todas as seções estão completas
      const incompleteEmotionalSections = emotionalSections.filter(section => 
        !validateEmotionalSection(section.id)
      );
      
      if (incompleteEmotionalSections.length > 0) {
        Alert.alert(
          'Perfil Incompleto',
          `Por favor, complete as seções: ${incompleteEmotionalSections.map(s => s.title).join(', ')}`
        );
        setIsLoading(false);
        return;
      }
      
      // Criar perfil emocional
      const emotionalProfile = EmotionalProfileService.createEmotionalProfile(
        userId,
        emotionalResponses
      );
      
      // Salvar preferências de estilo (mantendo funcionalidade existente)
      if (Object.keys(selectedStyleOptions).length > 0) {
        await saveStylePreferences();
      }
      
      // Salvar perfil emocional
      await saveEmotionalProfile(emotionalProfile);
      
      Alert.alert(
        'Sucesso!',
        'Seu perfil emocional foi criado com sucesso. Isso nos ajudará a encontrar matches mais compatíveis!',
        [
          {
            text: 'OK',
            onPress: () => onComplete?.(emotionalProfile)
          }
        ]
      );
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar seu perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveStylePreferences = async () => {
    // Implementar salvamento das preferências de estilo (existente)
    const preferences = Object.entries(selectedStyleOptions).map(([key, value]) => {
      const [category, questionId] = key.split('_');
      return {
        category,
        questionId,
        selectedOption: value
      };
    });
    
    for (const pref of preferences) {
      await fetch('/api/style-adjustment/style-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pref)
      });
    }
  };
  
  const saveEmotionalProfile = async (profile: EmotionalProfile) => {
    // Implementar salvamento do perfil emocional
    await fetch('/api/emotional-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile)
    });
  };
  
  // =====================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // =====================================================
  
  const renderSlider = (question: any, sectionId: string) => {
    const value = emotionalResponses[`${sectionId}_${question.id}`] || 50;
    
    return (
      <View style={styles.questionContainer} key={question.id}>
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>{question.labels[0]}</Text>
          <View style={styles.sliderWrapper}>
            <View style={styles.sliderTrack}>
              <View 
                style={[
                  styles.sliderFill, 
                  { width: `${value}%` }
                ]} 
              />
              <TouchableOpacity
                style={[
                  styles.sliderThumb,
                  { left: `${Math.max(0, Math.min(90, value - 5))}%` }
                ]}
                onPanResponderMove={(evt, gestureState) => {
                  // Implementar arrastar do slider
                  const newValue = Math.round(gestureState.moveX / 3); // Ajustar baseado na largura
                  handleEmotionalResponse(sectionId, question.id, Math.max(0, Math.min(100, newValue)));
                }}
              />
            </View>
            <Text style={styles.sliderValue}>{value}</Text>
          </View>
          <Text style={styles.sliderLabel}>{question.labels[2]}</Text>
        </View>
      </View>
    );
  };
  
  const renderMultipleChoice = (question: any, sectionId: string) => {
    const selectedValue = emotionalResponses[`${sectionId}_${question.id}`];
    
    return (
      <View style={styles.questionContainer} key={question.id}>
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.optionsContainer}>
          {question.options.map((option: any) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selectedValue === option.value && styles.selectedOption
              ]}
              onPress={() => handleEmotionalResponse(sectionId, question.id, option.value)}
            >
              <Text style={[
                styles.optionText,
                selectedValue === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  const renderCheckbox = (question: any, sectionId: string) => {
    const selectedValues = emotionalResponses[`${sectionId}_${question.id}`] || [];
    
    return (
      <View style={styles.questionContainer} key={question.id}>
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.checkboxContainer}>
          {question.options.map((option: any) => {
            const isSelected = selectedValues.includes(option.value);
            
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.checkboxOption}
                onPress={() => {
                  const newValues = isSelected
                    ? selectedValues.filter((v: string) => v !== option.value)
                    : [...selectedValues, option.value];
                  
                  handleEmotionalResponse(sectionId, question.id, newValues);
                }}
              >
                <MaterialIcons
                  name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={isSelected ? '#6200ee' : '#999'}
                />
                <Text style={styles.checkboxText}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };
  
  const renderEmotionalSection = (section: any) => {
    return (
      <View key={section.id} style={styles.sectionContainer}>
        <LinearGradient
          colors={section.color}
          style={styles.sectionHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name={section.icon} size={32} color="white" />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </LinearGradient>
        
        <View style={styles.sectionContent}>
          {section.questions.map((question: any) => {
            switch (question.type) {
              case 'slider':
                return renderSlider(question, section.id);
              case 'multiple_choice':
                return renderMultipleChoice(question, section.id);
              case 'checkbox':
                return renderCheckbox(question, section.id);
              default:
                return null;
            }
          })}
        </View>
      </View>
    );
  };
  
  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header com Progresso */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentSection === 'style' ? 'Preferências de Estilo' : 'Perfil Emocional'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Nos ajude a encontrar matches mais compatíveis com você
        </Text>
        
        {/* Barra de Progresso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% completo</Text>
        </View>
      </View>
      
      {/* Navegação entre seções */}
      <View style={styles.sectionNav}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentSection === 'style' && styles.activeNavButton
          ]}
          onPress={() => setCurrentSection('style')}
        >
          <MaterialIcons name="style" size={20} color={currentSection === 'style' ? 'white' : '#666'} />
          <Text style={[
            styles.navButtonText,
            currentSection === 'style' && styles.activeNavButtonText
          ]}>
            Estilo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentSection === 'emotional' && styles.activeNavButton
          ]}
          onPress={() => setCurrentSection('emotional')}
        >
          <MaterialIcons name="psychology" size={20} color={currentSection === 'emotional' ? 'white' : '#666'} />
          <Text style={[
            styles.navButtonText,
            currentSection === 'emotional' && styles.activeNavButtonText
          ]}>
            Emocional
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Conteúdo das seções */}
      {currentSection === 'style' && (
        <View style={styles.styleSection}>
          <Text style={styles.sectionDescription}>
            Suas preferências de estilo nos ajudam a entender sua personalidade
          </Text>
          
          {/* Implementar seção de estilo existente aqui */}
          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderText}>
              Seção de preferências de estilo (a ser integrada com código existente)
            </Text>
          </View>
        </View>
      )}
      
      {currentSection === 'emotional' && (
        <View style={styles.emotionalSection}>
          <Text style={styles.sectionDescription}>
            Seu perfil emocional nos ajuda a encontrar pessoas com quem você terá maior afinidade
          </Text>
          
          {emotionalSections.map(renderEmotionalSection)}
        </View>
      )}
      
      {/* Botão de Finalizar */}
      <View style={styles.footer}>
        <Button
          title={isLoading ? 'Salvando...' : 'Finalizar Perfil'}
          onPress={handleSubmit}
          disabled={isLoading || progress < 80}
          style={[
            styles.submitButton,
            (isLoading || progress < 80) && styles.disabledButton
          ]}
        />
        
        {progress < 80 && (
          <Text style={styles.warningText}>
            Complete pelo menos 80% do questionário para finalizar
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
    marginTop: 4,
  },
  sectionNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#6200ee',
  },
  navButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeNavButtonText: {
    color: 'white',
  },
  styleSection: {
    padding: 20,
  },
  emotionalSection: {
    padding: 20,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 24,
    lineHeight: 24,
  },
  sectionContainer: {
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  sectionContent: {
    padding: 20,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
    lineHeight: 22,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#6200ee',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    flex: 1,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6200ee',
    marginLeft: 12,
    minWidth: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#edf2f7',
    borderColor: '#6200ee',
  },
  optionText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4a5568',
    flex: 1,
  },
  placeholderSection: {
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#a0aec0',
  },
  warningText: {
    fontSize: 12,
    color: '#e53e3e',
    textAlign: 'center',
  },
});

export default EmotionalStyleAdjustmentScreen;