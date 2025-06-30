import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/common/Button';
import { ProfileService } from '../services/profileService';

const StyleAdjustmentScreen = ({ userId }) => {
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleOptionSelect = async (category, questionId, option) => {
    try {
      // Atualizar preferência no backend
      await ProfileService.updateStylePreference(userId, {
        category,
        questionId,
        selectedOption: option
      });
      
      // Atualizar estado local
      setSelectedOptions(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [questionId]: option
        }
      }));
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
    }
  };

  // Dados de exemplo (serão substituídos por dados reais do backend)
  const styleQuestions = {
    Sneakers: [
      { id: '1', question: 'Qual seu estilo de tênis favorito?', options: ['Esportivo', 'Casual', 'Retro'] },
      { id: '2', question: 'Que marcas você prefere?', options: ['Nike', 'Adidas', 'Puma'] }
    ],
    Clothing: [
      { id: '1', question: 'Estilo de roupa preferido?', options: ['Streetwear', 'Esportivo', 'Clássico'] }
    ]
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajuste seu Estilo</Text>
      
      {Object.entries(styleQuestions).map(([category, questions]) => (
        <View key={category} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          
          {questions.map(question => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionText}>{question.question}</Text>
              
              <View style={styles.optionsContainer}>
                {question.options.map(option => (
                  <Button 
                    key={option}
                    title={option}
                    onPress={() => handleOptionSelect(category, question.id, option)}
                    style={selectedOptions[category]?.[question.id] === option ? styles.selectedOption : styles.option}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionContainer: {
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
  selectedOption: {
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#6200ee',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
  },
});

export default StyleAdjustmentScreen;
