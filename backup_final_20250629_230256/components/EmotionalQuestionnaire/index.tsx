// components/EmotionalQuestionnaire/index.tsx - Componentes de UI para Questionário Emocional

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

// =====================================================
// SLIDER EMOCIONAL CUSTOMIZADO
// =====================================================

interface EmotionalSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labels: [string, string, string]; // [início, meio, fim]
  color?: string;
  disabled?: boolean;
  showValue?: boolean;
  hapticFeedback?: boolean;
}

export const EmotionalSlider: React.FC<EmotionalSliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  labels,
  color = '#6200ee',
  disabled = false,
  showValue = true,
  hapticFeedback = true
}) => {
  
  const [sliderWidth, setSliderWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(value)).current;
  const panResponder = useRef<any>();
  
  useEffect(() => {
    // Criar PanResponder para arrastar
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidth === 0) return;
        
        const percentage = Math.max(0, Math.min(1, gestureState.moveX / sliderWidth));
        const newValue = Math.round(min + percentage * (max - min));
        const steppedValue = Math.round(newValue / step) * step;
        
        animatedValue.setValue(steppedValue);
        onValueChange(steppedValue);
        
        // Haptic feedback nos marcos (0, 25, 50, 75, 100)
        if (hapticFeedback && [0, 25, 50, 75, 100].includes(steppedValue)) {
          // Implementar haptic feedback aqui
        }
      },
      
      onPanResponderRelease: () => {
        // Feedback final
        if (hapticFeedback) {
          // Implementar haptic feedback de release
        }
      }
    });
  }, [sliderWidth, min, max, step, disabled, onValueChange, hapticFeedback, animatedValue]);
  
  const getThumbPosition = () => {
    const percentage = (value - min) / (max - min);
    return percentage * sliderWidth;
  };
  
  return (
    <View style={styles.sliderContainer}>
      {/* Labels */}
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelStart}>{labels[0]}</Text>
        <Text style={styles.sliderLabelMiddle}>{labels[1]}</Text>
        <Text style={styles.sliderLabelEnd}>{labels[2]}</Text>
      </View>
      
      {/* Track */}
      <View
        style={styles.sliderTrackContainer}
        onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        {...(panResponder.current?.panHandlers || {})}
      >
        <View style={styles.sliderTrack}>
          {/* Fill */}
          <View 
            style={[
              styles.sliderFill, 
              { 
                width: `${((value - min) / (max - min)) * 100}%`,
                backgroundColor: color
              }
            ]} 
          />
          
          {/* Thumb */}
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                left: getThumbPosition() - 12, // Metade da largura do thumb
                backgroundColor: color,
                opacity: disabled ? 0.5 : 1
              }
            ]}
          >
            {showValue && (
              <View style={styles.sliderValueBubble}>
                <Text style={styles.sliderValueText}>{value}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
      
      {/* Markers */}
      <View style={styles.sliderMarkers}>
        {[0, 25, 50, 75, 100].map(marker => (
          <View 
            key={marker} 
            style={[
              styles.sliderMarker,
              { left: `${marker}%` }
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

// =====================================================
// CARTÃO DE OPÇÃO MÚLTIPLA
// =====================================================

interface EmotionalOptionCardProps {
  option: {
    value: string;
    label: string;
    description?: string;
    icon?: string;
  };
  isSelected: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export const EmotionalOptionCard: React.FC<EmotionalOptionCardProps> = ({
  option,
  isSelected,
  onSelect,
  disabled = false,
  variant = 'default'
}) => {
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    if (disabled) return;
    
    // Animação de pressão
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    onSelect(option.value);
  };
  
  const getCardStyle = () => {
    const baseStyle = [styles.optionCard];
    
    if (isSelected) {
      baseStyle.push(styles.optionCardSelected);
    }
    
    if (disabled) {
      baseStyle.push(styles.optionCardDisabled);
    }
    
    if (variant === 'compact') {
      baseStyle.push(styles.optionCardCompact);
    } else if (variant === 'detailed') {
      baseStyle.push(styles.optionCardDetailed);
    }
    
    return baseStyle;
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={getCardStyle()}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {option.icon && (
          <MaterialIcons 
            name={option.icon as any} 
            size={variant === 'compact' ? 20 : 24} 
            color={isSelected ? '#fff' : '#666'} 
            style={styles.optionIcon}
          />
        )}
        
        <View style={styles.optionContent}>
          <Text style={[
            styles.optionLabel,
            isSelected && styles.optionLabelSelected,
            variant === 'compact' && styles.optionLabelCompact
          ]}>
            {option.label}
          </Text>
          
          {option.description && variant !== 'compact' && (
            <Text style={[
              styles.optionDescription,
              isSelected && styles.optionDescriptionSelected
            ]}>
              {option.description}
            </Text>
          )}
        </View>
        
        {isSelected && (
          <MaterialIcons 
            name="check-circle" 
            size={20} 
            color="#fff" 
            style={styles.optionCheckIcon}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// =====================================================
// GRUPO DE CHECKBOXES
// =====================================================

interface EmotionalCheckboxGroupProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    color?: string;
  }>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
  disabled?: boolean;
  layout?: 'grid' | 'list';
}

export const EmotionalCheckboxGroup: React.FC<EmotionalCheckboxGroupProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  maxSelections,
  minSelections = 0,
  disabled = false,
  layout = 'list'
}) => {
  
  const handleToggle = (value: string) => {
    if (disabled) return;
    
    const isSelected = selectedValues.includes(value);
    
    if (isSelected) {
      // Remover seleção (se não viola mínimo)
      if (selectedValues.length > minSelections) {
        onSelectionChange(selectedValues.filter(v => v !== value));
      }
    } else {
      // Adicionar seleção (se não excede máximo)
      if (!maxSelections || selectedValues.length < maxSelections) {
        onSelectionChange([...selectedValues, value]);
      }
    }
  };
  
  const isAtMaxSelections = maxSelections ? selectedValues.length >= maxSelections : false;
  
  return (
    <View style={[
      styles.checkboxGroup,
      layout === 'grid' && styles.checkboxGroupGrid
    ]}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const isDisabled = disabled || (!isSelected && isAtMaxSelections);
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.checkboxItem,
              layout === 'grid' && styles.checkboxItemGrid,
              isSelected && styles.checkboxItemSelected,
              isDisabled && styles.checkboxItemDisabled
            ]}
            onPress={() => handleToggle(option.value)}
            disabled={isDisabled}
          >
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              { borderColor: option.color || '#6200ee' }
            ]}>
              {isSelected && (
                <MaterialIcons 
                  name="check" 
                  size={16} 
                  color={option.color || '#6200ee'} 
                />
              )}
            </View>
            
            <View style={styles.checkboxContent}>
              <Text style={[
                styles.checkboxLabel,
                isSelected && styles.checkboxLabelSelected,
                isDisabled && styles.checkboxLabelDisabled
              ]}>
                {option.label}
              </Text>
              
              {option.description && (
                <Text style={[
                  styles.checkboxDescription,
                  isSelected && styles.checkboxDescriptionSelected,
                  isDisabled && styles.checkboxDescriptionDisabled
                ]}>
                  {option.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
      
      {/* Helper text */}
      {(maxSelections || minSelections > 0) && (
        <Text style={styles.checkboxHelperText}>
          {maxSelections && minSelections > 0 
            ? `Selecione entre ${minSelections} e ${maxSelections} opções`
            : maxSelections 
              ? `Selecione até ${maxSelections} opções`
              : `Selecione pelo menos ${minSelections} opções`
          }
          {selectedValues.length > 0 && ` (${selectedValues.length} selecionadas)`}
        </Text>
      )}
    </View>
  );
};

// =====================================================
// INDICADOR DE PROGRESSO EMOCIONAL
// =====================================================

interface EmotionalProgressProps {
  current: number;
  total: number;
  sections?: Array<{
    name: string;
    color: string;
    completed: boolean;
  }>;
  showPercentage?: boolean;
  animated?: boolean;
}

export const EmotionalProgress: React.FC<EmotionalProgressProps> = ({
  current,
  total,
  sections,
  showPercentage = true,
  animated = true
}) => {
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percentage = Math.round((current / total) * 100);
  
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 500,
        useNativeDriver: false
      }).start();
    } else {
      progressAnim.setValue(percentage);
    }
  }, [percentage, animated, progressAnim]);
  
  return (
    <View style={styles.progressContainer}>
      {/* Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Progresso do Questionário</Text>
        {showPercentage && (
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        )}
      </View>
      
      {/* Barra de progresso principal */}
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp'
              })
            }
          ]}
        />
      </View>
      
      {/* Seções detalhadas (se fornecidas) */}
      {sections && (
        <View style={styles.progressSections}>
          {sections.map((section, index) => (
            <View key={index} style={styles.progressSection}>
              <View style={[
                styles.progressSectionIndicator,
                { backgroundColor: section.color },
                section.completed && styles.progressSectionCompleted
              ]}>
                {section.completed && (
                  <MaterialIcons name="check" size={12} color="#fff" />
                )}
              </View>
              <Text style={[
                styles.progressSectionText,
                section.completed && styles.progressSectionTextCompleted
              ]}>
                {section.name}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Informação adicional */}
      <Text style={styles.progressInfo}>
        {current} de {total} perguntas respondidas
      </Text>
    </View>
  );
};

// =====================================================
// CARTÃO DE RESUMO EMOCIONAL
// =====================================================

interface EmotionalSummaryCardProps {
  profile: {
    energyLevel: number;
    openness: number;
    emotionalStability: number;
    extroversion: number;
    attachmentStyle: string;
    communicationStyle: string;
    completeness: number;
  };
  onEdit?: () => void;
  compact?: boolean;
}

export const EmotionalSummaryCard: React.FC<EmotionalSummaryCardProps> = ({
  profile,
  onEdit,
  compact = false
}) => {
  
  const dimensions = [
    { key: 'energyLevel', label: 'Energia', color: '#FF6B6B', icon: 'bolt' },
    { key: 'openness', label: 'Abertura', color: '#4ECDC4', icon: 'favorite' },
    { key: 'emotionalStability', label: 'Estabilidade', color: '#667eea', icon: 'balance' },
    { key: 'extroversion', label: 'Extroversão', color: '#ffecd2', icon: 'people' }
  ];
  
  return (
    <View style={[styles.summaryCard, compact && styles.summaryCardCompact]}>
      {/* Header */}
      <View style={styles.summaryHeader}>
        <View>
          <Text style={styles.summaryTitle}>Perfil Emocional</Text>
          <Text style={styles.summarySubtitle}>
            {profile.completeness}% completo
          </Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.summaryEditButton}>
            <MaterialIcons name="edit" size={20} color="#6200ee" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Dimensões principais */}
      <View style={styles.summaryDimensions}>
        {dimensions.map((dimension) => (
          <View key={dimension.key} style={styles.summaryDimension}>
            <View style={[styles.summaryDimensionIcon, { backgroundColor: dimension.color }]}>
              <MaterialIcons name={dimension.icon as any} size={16} color="#fff" />
            </View>
            <Text style={styles.summaryDimensionLabel}>{dimension.label}</Text>
            <Text style={styles.summaryDimensionValue}>
              {(profile as any)[dimension.key] || 0}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Estilos de relacionamento */}
      {!compact && (
        <View style={styles.summaryStyles}>
          <View style={styles.summaryStyleItem}>
            <Text style={styles.summaryStyleLabel}>Apego:</Text>
            <Text style={styles.summaryStyleValue}>{profile.attachmentStyle}</Text>
          </View>
          <View style={styles.summaryStyleItem}>
            <Text style={styles.summaryStyleLabel}>Comunicação:</Text>
            <Text style={styles.summaryStyleValue}>{profile.communicationStyle}</Text>
          </View>
        </View>
      )}
      
      {/* Barra de completeness */}
      <View style={styles.summaryProgress}>
        <View style={styles.summaryProgressBar}>
          <View 
            style={[
              styles.summaryProgressFill, 
              { width: `${profile.completeness}%` }
            ]} 
          />
        </View>
        <Text style={styles.summaryProgressText}>
          Complete para melhores matches
        </Text>
      </View>
    </View>
  );
};

// =====================================================
// ESTILOS
// =====================================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Slider styles
  sliderContainer: {
    marginVertical: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabelStart: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'left',
    flex: 1,
  },
  sliderLabelMiddle: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    flex: 1,
  },
  sliderLabelEnd: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
    flex: 1,
  },
  sliderTrackContainer: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderValueBubble: {
    position: 'absolute',
    top: -32,
    left: -8,
    backgroundColor: '#2d3748',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  sliderValueText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 12,
    position: 'relative',
  },
  sliderMarker: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#cbd5e0',
    borderRadius: 1,
  },
  
  // Option card styles
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  optionCardSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  optionCardCompact: {
    padding: 12,
    marginBottom: 8,
  },
  optionCardDetailed: {
    padding: 20,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: 'white',
  },
  optionLabelCompact: {
    fontSize: 14,
    marginBottom: 0,
  },
  optionDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: '#e2e8f0',
  },
  optionCheckIcon: {
    marginLeft: 12,
  },
  
  // Checkbox group styles
  checkboxGroup: {
    marginVertical: 8,
  },
  checkboxGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  checkboxItemGrid: {
    width: '48%',
    marginBottom: 12,
  },
  checkboxItemSelected: {
    // Styles for selected state
  },
  checkboxItemDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#f7fafc',
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 2,
  },
  checkboxLabelSelected: {
    color: '#6200ee',
  },
  checkboxLabelDisabled: {
    color: '#a0aec0',
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 18,
  },
  checkboxDescriptionSelected: {
    color: '#553c9a',
  },
  checkboxDescriptionDisabled: {
    color: '#a0aec0',
  },
  checkboxHelperText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Progress styles
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 4,
  },
  progressSections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  progressSectionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSectionCompleted: {
    // Additional styles for completed sections
  },
  progressSectionText: {
    fontSize: 12,
    color: '#718096',
  },
  progressSectionTextCompleted: {
    color: '#2d3748',
    fontWeight: '500',
  },
  progressInfo: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  
  // Summary card styles
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCardCompact: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  summaryEditButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  summaryDimensions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryDimension: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryDimensionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryDimensionLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 2,
  },
  summaryDimensionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  summaryStyles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  summaryStyleItem: {
    alignItems: 'center',
  },
  summaryStyleLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  summaryStyleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    textTransform: 'capitalize',
  },
  summaryProgress: {
    marginTop: 8,
  },
  summaryProgressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 2,
  },
  summaryProgressText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
});

export default {
  EmotionalSlider,
  EmotionalOptionCard,
  EmotionalCheckboxGroup,
  EmotionalProgress,
  EmotionalSummaryCard
};