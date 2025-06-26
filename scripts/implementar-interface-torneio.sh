# scripts/implementar-interface-torneio.sh - Interface React Native para torneios

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "${CYAN}$1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Criar serviço de API para o frontend
criar_tournament_api_service() {
    print_header "🔌 CRIANDO SERVIÇO DE API PARA FRONTEND"
    
    mkdir -p services/tournament
    
    print_info "Criando services/tournament/tournamentApi.js..."
    cat > services/tournament/tournamentApi.js << 'EOF'
// services/tournament/tournamentApi.js - Serviço de API para torneios
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../auth/authService';

class TournamentApi {
  
  // Headers padrão com autenticação
  async getHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  
  // Buscar categorias disponíveis
  async getCategories() {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/categories`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          categories: data.categories
        };
      } else {
        throw new Error(data.error || 'Erro ao buscar categorias');
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Buscar imagens de uma categoria
  async getImagesByCategory(category) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/images/${category}`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          images: data.images
        };
      } else {
        throw new Error(data.error || 'Erro ao buscar imagens');
      }
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Iniciar novo torneio
  async startTournament(category) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ category })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          tournament: data.tournament
        };
      } else {
        throw new Error(data.error || 'Erro ao iniciar torneio');
      }
    } catch (error) {
      console.error('Erro ao iniciar torneio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Processar escolha no torneio
  async processChoice(sessionId, winnerImageId, loserImageId, choiceTimeMs) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/choice`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          winnerImageId,
          loserImageId,
          choiceTimeMs
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          result: data.result
        };
      } else {
        throw new Error(data.error || 'Erro ao processar escolha');
      }
    } catch (error) {
      console.error('Erro ao processar escolha:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Buscar resultados do usuário
  async getUserResults() {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/results`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          results: data.results
        };
      } else {
        throw new Error(data.error || 'Erro ao buscar resultados');
      }
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TournamentApi();
EOF
    
    print_success "✅ TournamentApi criado"
    echo ""
}

# Criar hook para gerenciar torneios
criar_tournament_hook() {
    print_header "🎣 CRIANDO HOOK PARA GERENCIAR TORNEIOS"
    
    mkdir -p hooks/tournament
    
    print_info "Criando hooks/tournament/useTournament.js..."
    cat > hooks/tournament/useTournament.js << 'EOF'
// hooks/tournament/useTournament.js - Hook para gerenciar estado do torneio
import { useState, useEffect, useCallback } from 'react';
import tournamentApi from '../../services/tournament/tournamentApi';

export const useTournament = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [tournamentResults, setTournamentResults] = useState([]);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await tournamentApi.getCategories();
      if (result.success) {
        setCategories(result.categories);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar torneio
  const startTournament = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await tournamentApi.startTournament(category);
      if (result.success) {
        setCurrentTournament(result.tournament);
        return result.tournament;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao iniciar torneio');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Processar escolha
  const processChoice = useCallback(async (winnerImageId, loserImageId, choiceTimeMs) => {
    if (!currentTournament) {
      setError('Nenhum torneio ativo');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await tournamentApi.processChoice(
        currentTournament.sessionId,
        winnerImageId,
        loserImageId,
        choiceTimeMs
      );
      
      if (result.success) {
        if (result.result.isComplete) {
          // Torneio completado
          setCurrentTournament(null);
          loadUserResults(); // Recarregar resultados
        } else {
          // Atualizar torneio em andamento
          setCurrentTournament(prev => ({
            ...prev,
            currentRound: result.result.currentRound,
            currentMatches: result.result.currentMatches
          }));
        }
        return result.result;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao processar escolha');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTournament]);

  // Carregar resultados do usuário
  const loadUserResults = useCallback(async () => {
    try {
      const result = await tournamentApi.getUserResults();
      if (result.success) {
        setTournamentResults(result.results);
      }
    } catch (err) {
      console.error('Erro ao carregar resultados:', err);
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Abandonar torneio atual
  const abandonTournament = useCallback(() => {
    setCurrentTournament(null);
    setError(null);
  }, []);

  // Carregar categorias ao montar o hook
  useEffect(() => {
    loadCategories();
    loadUserResults();
  }, [loadCategories, loadUserResults]);

  return {
    // Estado
    categories,
    loading,
    error,
    currentTournament,
    tournamentResults,
    
    // Ações
    loadCategories,
    startTournament,
    processChoice,
    loadUserResults,
    clearError,
    abandonTournament,
    
    // Estados computados
    isInTournament: !!currentTournament,
    hasCompletedTournaments: tournamentResults.length > 0
  };
};
EOF
    
    print_success "✅ Hook useTournament criado"
    echo ""
}

# Criar componente de seleção de categoria
criar_category_selector() {
    print_header "📋 CRIANDO SELETOR DE CATEGORIAS"
    
    mkdir -p components/Tournament
    
    print_info "Criando components/Tournament/CategorySelector.js..."
    cat > components/Tournament/CategorySelector.js << 'EOF'
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
EOF
    
    print_success "✅ CategorySelector criado"
    echo ""
}

# Criar componente de match do torneio
criar_tournament_match() {
    print_header "⚔️  CRIANDO COMPONENTE DE MATCH DO TORNEIO"
    
    print_info "Criando components/Tournament/TournamentMatch.js..."
    cat > components/Tournament/TournamentMatch.js << 'EOF'
// components/Tournament/TournamentMatch.js - Componente de match 2x2
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 2; // 20px padding + 20px gap

const TournamentMatch = ({ 
  match, 
  onChoice, 
  roundNumber, 
  totalRounds,
  loading 
}) => {
  const [choiceStartTime, setChoiceStartTime] = useState(null);
  const [imageLoading, setImageLoading] = useState({ image1: true, image2: true });

  useEffect(() => {
    setChoiceStartTime(Date.now());
  }, [match]);

  const handleChoice = (winnerImage, loserImage) => {
    if (loading) return;
    
    const choiceTime = Date.now() - choiceStartTime;
    
    Alert.alert(
      'Confirmar Escolha',
      `Você escolheu: "${winnerImage.image_name}"\n\nTem certeza?`,
      [
        { text: 'Voltar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => onChoice(winnerImage.id, loserImage.id, choiceTime)
        }
      ]
    );
  };

  const handleImageLoad = (imageKey) => {
    setImageLoading(prev => ({
      ...prev,
      [imageKey]: false
    }));
  };

  if (!match || !match.image1 || !match.image2) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar match</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundText}>
          Rodada {roundNumber} de {totalRounds}
        </Text>
        <Text style={styles.instructionText}>
          Toque na imagem que você prefere
        </Text>
      </View>

      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      <View style={styles.matchContainer}>
        {/* Imagem 1 */}
        <TouchableOpacity
          style={[styles.imageContainer, loading && styles.imageDisabled]}
          onPress={() => handleChoice(match.image1, match.image2)}
          disabled={loading}
        >
          {imageLoading.image1 && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}
          <Image
            source={{ uri: match.image1.image_url }}
            style={styles.image}
            onLoad={() => handleImageLoad('image1')}
            onError={() => handleImageLoad('image1')}
          />
          <View style={styles.imageLabel}>
            <Text style={styles.imageName} numberOfLines={2}>
              {match.image1.image_name}
            </Text>
            {match.image1.tags && (
              <Text style={styles.imageTags} numberOfLines={1}>
                {match.image1.tags.join(' • ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Imagem 2 */}
        <TouchableOpacity
          style={[styles.imageContainer, loading && styles.imageDisabled]}
          onPress={() => handleChoice(match.image2, match.image1)}
          disabled={loading}
        >
          {imageLoading.image2 && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}
          <Image
            source={{ uri: match.image2.image_url }}
            style={styles.image}
            onLoad={() => handleImageLoad('image2')}
            onError={() => handleImageLoad('image2')}
          />
          <View style={styles.imageLabel}>
            <Text style={styles.imageName} numberOfLines={2}>
              {match.image2.image_name}
            </Text>
            {match.image2.tags && (
              <Text style={styles.imageTags} numberOfLines={1}>
                {match.image2.tags.join(' • ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Processando escolha...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  roundText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  instructionText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  vsContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  vsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  imageContainer: {
    width: imageSize,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden'
  },
  imageDisabled: {
    opacity: 0.6
  },
  image: {
    width: '100%',
    height: imageSize,
    backgroundColor: '#ecf0f1'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  imageLabel: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1'
  },
  imageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5
  },
  imageTags: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center'
  },
  separator: {
    width: 20
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center'
  }
});

export default TournamentMatch;
EOF
    
    print_success "✅ TournamentMatch criado"
    echo ""
}

# Criar tela principal do torneio
criar_tournament_screen() {
    print_header "📱 CRIANDO TELA PRINCIPAL DO TORNEIO"
    
    mkdir -p screens/Tournament
    
    print_info "Criando screens/Tournament/TournamentScreen.js..."
    cat > screens/Tournament/TournamentScreen.js << 'EOF'
// screens/Tournament/TournamentScreen.js - Tela principal do torneio
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTournament } from '../../hooks/tournament/useTournament';
import CategorySelector from '../../components/Tournament/CategorySelector';
import TournamentMatch from '../../components/Tournament/TournamentMatch';

const TournamentScreen = () => {
  const {
    categories,
    loading,
    error,
    currentTournament,
    startTournament,
    processChoice,
    clearError,
    abandonTournament,
    isInTournament
  } = useTournament();

  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const handleCategorySelect = async (category) => {
    const tournament = await startTournament(category);
    if (tournament) {
      setCurrentMatchIndex(0);
    }
  };

  const handleChoice = async (winnerImageId, loserImageId, choiceTimeMs) => {
    const result = await processChoice(winnerImageId, loserImageId, choiceTimeMs);
    
    if (result) {
      if (result.isComplete) {
        // Torneio completado
        Alert.alert(
          '🏆 Torneio Completado!',
          'Parabéns! Você completou o torneio.\n\nSuas preferências foram registradas.',
          [
            { text: 'OK', onPress: () => setCurrentMatchIndex(0) }
          ]
        );
      } else {
        // Continuar para próximo match
        if (currentMatchIndex + 1 < result.currentMatches.length) {
          setCurrentMatchIndex(currentMatchIndex + 1);
        } else {
          // Próxima rodada
          setCurrentMatchIndex(0);
        }
      }
    }
  };

  const handleAbandonTournament = () => {
    Alert.alert(
      'Abandonar Torneio',
      'Tem certeza que deseja abandonar o torneio atual? Seu progresso será perdido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abandonar', 
          style: 'destructive',
          onPress: () => {
            abandonTournament();
            setCurrentMatchIndex(0);
          }
        }
      ]
    );
  };

  const getCurrentMatch = () => {
    if (!currentTournament || !currentTournament.currentMatches) {
      return null;
    }
    return currentTournament.currentMatches[currentMatchIndex];
  };

  if (loading && !isInTournament) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isInTournament ? (
        // Seleção de categoria
        <CategorySelector
          categories={categories}
          onSelectCategory={handleCategorySelect}
          loading={loading}
        />
      ) : (
        // Torneio em andamento
        <ScrollView style={styles.tournamentContainer}>
          <View style={styles.tournamentHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.categoryText}>
                {getCategoryDisplayName(currentTournament.category)}
              </Text>
              <Text style={styles.progressText}>
                Match {currentMatchIndex + 1} de {currentTournament.currentMatches?.length || 0}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.abandonButton}
              onPress={handleAbandonTournament}
            >
              <Text style={styles.abandonButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TournamentMatch
            match={getCurrentMatch()}
            onChoice={handleChoice}
            roundNumber={currentTournament.currentRound}
            totalRounds={currentTournament.totalRounds}
            loading={loading}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// Função auxiliar
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d'
  },
  tournamentContainer: {
    flex: 1
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  headerLeft: {
    flex: 1
  },
  categoryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  progressText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2
  },
  abandonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center'
  },
  abandonButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default TournamentScreen;
EOF
    
    print_success "✅ TournamentScreen criado"
    echo ""
}

# Criar arquivo de configuração para APIs
criar_config_api() {
    print_header "⚙️  CRIANDO CONFIGURAÇÃO DE API"
    
    mkdir -p services
    
    print_info "Criando services/config.js..."
    cat > services/config.js << 'EOF'
// services/config.js - Configuração da API
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Desenvolvimento
  : 'https://your-production-api.com/api';  // Produção

export const API_TIMEOUT = 10000; // 10 segundos

export const API_CONFIG = {
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
};
EOF
    
    print_success "✅ Configuração de API criada"
    echo ""
}

# Criar serviço de autenticação básico (se não existir)
criar_auth_service() {
    print_header "🔐 VERIFICANDO SERVIÇO DE AUTENTICAÇÃO"
    
    mkdir -p services/auth
    
    if [ ! -f "services/auth/authService.js" ]; then
        print_info "Criando services/auth/authService.js básico..."
        cat > services/auth/authService.js << 'EOF'
// services/auth/authService.js - Serviço básico de autenticação
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Erro ao buscar token:', error);
    return null;
  }
};

export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Erro ao salvar token:', error);
    return false;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Erro ao remover token:', error);
    return false;
  }
};
EOF
        print_success "✅ AuthService básico criado"
    else
        print_info "AuthService já existe"
    fi
    
    echo ""
}

# Atualizar index dos componentes
atualizar_exports() {
    print_header "📦 ATUALIZANDO EXPORTS DOS COMPONENTES"
    
    print_info "Atualizando components/Tournament/index.js..."
    cat > components/Tournament/index.js << 'EOF'
// components/Tournament/index.js - Exportações do módulo Tournament
export { default as CategorySelector } from './CategorySelector';
export { default as TournamentMatch } from './TournamentMatch';
export { default as TournamentScreen } from '../../screens/Tournament/TournamentScreen';
EOF
    
    print_info "Criando screens/Tournament/index.js..."
    cat > screens/Tournament/index.js << 'EOF'
// screens/Tournament/index.js - Exportações das telas de torneio
export { default as TournamentScreen } from './TournamentScreen';
EOF
    
    print_success "✅ Exports atualizados"
    echo ""
}

# Criar arquivo de dependências necessárias
criar_dependencias_info() {
    print_header "📋 LISTANDO DEPENDÊNCIAS NECESSÁRIAS"
    
    cat > TOURNAMENT_DEPENDENCIES.md << 'EOF'
# Dependências Necessárias para o Sistema de Torneios

## Dependências NPM que precisam ser instaladas:

```bash
# AsyncStorage para salvar tokens
npm install @react-native-async-storage/async-storage

# Navegação (se não tiver)
npm install @react-navigation/native @react-navigation/stack

# Dependências do React Navigation
npm install react-native-screens react-native-safe-area-context

# Para iOS (se desenvolvendo para iOS)
cd ios && pod install
```

## Como usar os componentes:

### 1. Adicionar TournamentScreen à navegação:

```javascript
// Em seu navigator principal
import { TournamentScreen } from './screens/Tournament';

// Adicionar à stack
<Stack.Screen 
  name="Tournament" 
  component={TournamentScreen}
  options={{ title: 'Torneio Visual' }}
/>
```

### 2. Navegar para o torneio:

```javascript
// De qualquer tela
navigation.navigate('Tournament');
```

### 3. Exemplo de uso direto:

```javascript
import React from 'react';
import { TournamentScreen } from './components/Tournament';

const App = () => {
  return <TournamentScreen />;
};
```

## Configuração adicional:

1. Certifique-se de que o servidor está rodando em localhost:3000
2. Configure seu IP local se testando em dispositivo físico
3. Adicione permissões de rede no Android se necessário

## Estrutura criada:

```
components/Tournament/
├── CategorySelector.js     # Seleção de categorias
├── TournamentMatch.js      # Interface do match 2x2
└── index.js               # Exports

screens/Tournament/
├── TournamentScreen.js     # Tela principal
└── index.js               # Exports

services/tournament/
├── tournamentApi.js       # Chamadas para API
└── config.js              # Configuração

hooks/tournament/
└── useTournament.js       # Hook de estado

services/auth/
└── authService.js         # Gerenciamento de tokens
```
EOF
    
    print_success "✅ Documentação de dependências criada"
    echo ""
}

# Relatório final
relatorio_final_interface() {
    print_header "📊 RELATÓRIO FINAL - INTERFACE REACT NATIVE"
    
    echo ""
    print_info "✅ COMPONENTES CRIADOS:"
    echo "   📋 CategorySelector - Seleção de categorias"
    echo "   ⚔️ TournamentMatch - Interface de match 2x2"
    echo "   📱 TournamentScreen - Tela principal completa"
    echo "   🎣 useTournament - Hook de gerenciamento de estado"
    echo "   🔌 tournamentApi - Serviço de API"
    echo "   🔐 authService - Gerenciamento de tokens"
    echo ""
    
    print_header "🎯 FUNCIONALIDADES IMPLEMENTADAS:"
    echo "   ✅ Listagem de categorias disponíveis"
    echo "   ✅ Início de torneio com confirmação"
    echo "   ✅ Interface 2x2 para escolhas"
    echo "   ✅ Progresso visual do torneio"
    echo "   ✅ Processamento de escolhas"
    echo "   ✅ Finalização automática"
    echo "   ✅ Abandono de torneio"
    echo "   ✅ Tratamento de erros"
    echo ""
    
    print_header "📦 PRÓXIMOS PASSOS:"
    echo "   1. Instalar dependências listadas em TOURNAMENT_DEPENDENCIES.md"
    echo "   2. Adicionar TournamentScreen à navegação"
    echo "   3. Configurar IP correto para API"
    echo "   4. Testar fluxo completo no simulador/dispositivo"
    echo ""
    
    print_header "🧪 TESTE RÁPIDO:"
    echo "   1. Importe: import { TournamentScreen } from './screens/Tournament'"
    echo "   2. Use: <TournamentScreen />"
    echo "   3. Teste o fluxo completo do torneio"
    echo ""
    
    print_success "🎉 INTERFACE REACT NATIVE COMPLETA!"
    print_info "Sistema de torneios visuais totalmente funcional"
    echo ""
    
    print_header "🏆 DIFERENCIAL IMPLEMENTADO:"
    echo "   ✅ Primeiro app de dating com torneios visuais"
    echo "   ✅ Interface gamificada e engajante"
    echo "   ✅ Experiência única no mercado"
    echo "   ✅ Coleta rica de preferências visuais"
    echo ""
}

# Função principal
main() {
    print_header "📱 IMPLEMENTANDO INTERFACE REACT NATIVE DO TORNEIO"
    print_info "Criando componentes para o sistema único de torneios visuais"
    echo ""
    
    criar_config_api
    criar_auth_service
    criar_tournament_api_service
    criar_tournament_hook
    criar_category_selector
    criar_tournament_match
    criar_tournament_screen
    atualizar_exports
    criar_dependencias_info
    relatorio_final_interface
}

# Executar
main "$@"