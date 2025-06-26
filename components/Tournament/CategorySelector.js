// components/Tournament/CategorySelector.js - Seletor de categorias
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';

const CategorySelector = ({ categories, onSelectCategory, loading }) => {
  
  const handleCategorySelect = (category) => {
    if (!category.available) {
      Alert.alert(
        'Categoria Indisponível',
        `A categoria ${category.category} não tem imagens suficientes para um torneio.`
      );
      return;
    }
    
    Alert.alert(
      'Iniciar Torneio',
      `Deseja iniciar um torneio na categoria "${category.category}"?\n\nVocê irá escolher entre ${category.imageCount} imagens em rodadas eliminatórias.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar', onPress: () => onSelectCategory(category.category) }
      ]
    );
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        !item.available && styles.categoryCardDisabled
      ]}
      onPress={() => handleCategorySelect(item)}
      disabled={loading || !item.available}
    >
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>
          {getCategoryDisplayName(item.category)}
        </Text>
        <Text style={styles.categoryCount}>
          {item.imageCount} imagens
        </Text>
      </View>
      
      <Text style={styles.categoryDescription}>
        {getCategoryDescription(item.category)}
      </Text>
      
      <View style={styles.categoryFooter}>
        <Text style={[
          styles.categoryStatus,
          item.available ? styles.statusAvailable : styles.statusUnavailable
        ]}>
          {item.available ? '✅ Disponível' : '❌ Indisponível'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha uma Categoria</Text>
      <Text style={styles.subtitle}>
        Selecione o tipo de preferência que deseja definir através do torneio
      </Text>
      
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Funções auxiliares para exibição
const getCategoryDisplayName = (category) => {
  const names = {
    'roupas': '👔 Roupas',
    'tenis': '👟 Tênis',
    'acessorios': '👑 Acessórios',
    'cores': '🎨 Cores',
    'ambientes': '🏛️ Ambientes'
  };
  return names[category] || category;
};

const getCategoryDescription = (category) => {
  const descriptions = {
    'roupas': 'Defina seu estilo de vestimenta preferido',
    'tenis': 'Escolha o tipo de calçado que mais combina com você',
    'acessorios': 'Selecione acessórios que representam sua personalidade',
    'cores': 'Descubra sua paleta de cores favorita',
    'ambientes': 'Identifique os ambientes onde você se sente melhor'
  };
  return descriptions[category] || 'Categoria de preferências visuais';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22
  },
  listContainer: {
    paddingBottom: 20
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  categoryCardDisabled: {
    backgroundColor: '#f1f2f6',
    opacity: 0.6
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  categoryCount: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600'
  },
  categoryDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 15
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  categoryStatus: {
    fontSize: 14,
    fontWeight: '600'
  },
  statusAvailable: {
    color: '#27ae60'
  },
  statusUnavailable: {
    color: '#e74c3c'
  }
});

export default CategorySelector;
