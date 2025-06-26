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
