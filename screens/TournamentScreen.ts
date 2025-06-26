// screens/TournamentScreen.tsx - Interface gamificada para torneios 2x2
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Vibration,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  winRate: number;
}

interface TournamentMatchup {
  sessionId: string;
  roundNumber: number;
  imageA: TournamentImage;
  imageB: TournamentImage;
  startTime: string;
}

interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  remainingImages: number[];
  tournamentSize: number;
  progressPercentage: number;
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export const TournamentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const api = useApi();

  // Parâmetros da rota
  const { category } = route.params as { category: string };

  // Estados principais
  const [session, setSession] = useState<TournamentSession | null>(null);
  const [currentMatchup, setCurrentMatchup] = useState<TournamentMatchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Estados de animação
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnimA] = useState(new Animated.Value(1));
  const [scaleAnimB] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));
  const [choiceStartTime, setChoiceStartTime] = useState<number>(0);

  // Estados de feedback visual
  const [lastChoice, setLastChoice] = useState<{ winner: 'A' | 'B', responseTime: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalChoices, setTotalChoices] = useState(0);

  // Interceptar botão de voltar
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (gameStarted && session?.status === 'active') {
          Alert.alert(
            'Sair do Torneio',
            'Tem certeza que deseja sair? Seu progresso será perdido.',
            [
              { text: 'Continuar Jogando', style: 'cancel' },
              { 
                text: 'Sair', 
                style: 'destructive',
                onPress: () => navigation.goBack()
              }
            ]
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [gameStarted, session, navigation])
  );

  // Carregar ou iniciar torneio
  useEffect(() => {
    initializeTournament();
  }, [category]);

  // Animar progresso quando sessão muda
  useEffect(() => {
    if (session) {
      Animated.timing(progressAnim, {
        toValue: session.progressPercentage / 100,
        duration: 500,
        useNativeDriver: false
      }).start();
    }
  }, [session]);

  // Animar entrada das cartas
  useEffect(() => {
    if (currentMatchup) {
      setChoiceStartTime(Date.now());
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [currentMatchup]);

  const initializeTournament = async () => {
    try {
      setLoading(true);

      // Verificar se já existe sessão ativa
      let activeSession: TournamentSession | null = null;
      
      try {
        const activeResponse = await api.get(`/tournament/active/${category}`);
        if (activeResponse.success) {
          activeSession = activeResponse.data;
        }
      } catch (error) {
        // Sessão ativa não encontrada, criar nova
      }

      if (activeSession) {
        // Retomar sessão existente
        setSession(activeSession);
        setGameStarted(true);
        await loadNextMatchup(activeSession.id);
      } else {
        // Criar nova sessão
        await startNewTournament();
      }

    } catch (error: any) {
      console.error('Erro ao inicializar torneio:', error);
      Alert.alert(
        'Erro',
        error.message || 'Falha ao inicializar torneio. Tente novamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const startNewTournament = async () => {
    try {
      const response = await api.post('/tournament/start', {
        category,
        tournamentSize: 32
      });

      if (response.success) {
        const newSession = response.data;
        setSession(newSession);
        setGameStarted(true);
        await loadNextMatchup(newSession.id);
        
        // Vibração de início
        Vibration.vibrate(100);
      } else {
        throw new Error(response.message || 'Falha ao iniciar torneio');
      }
    } catch (error: any) {
      if (error.message.includes('já existe')) {
        // Recarregar página para pegar sessão ativa
        await initializeTournament();
      } else {
        throw error;
      }
    }
  };

  const loadNextMatchup = async (sessionId: string) => {
    try {
      const response = await api.get(`/tournament/matchup/${sessionId}`);
      
      if (response.success) {
        setCurrentMatchup(response.data);
      } else {
        // Torneio finalizado
        await handleTournamentComplete(sessionId);
      }
    } catch (error: any) {
      console.error('Erro ao carregar confronto:', error);
      
      if (error.status === 404) {
        // Torneio finalizado
        await handleTournamentComplete(sessionId);
      } else {
        Alert.alert('Erro', 'Falha ao carregar próximo confronto');
      }
    }
  };

  const makeChoice = async (choice: 'A' | 'B') => {
    if (!currentMatchup || !session || choosing) return;

    try {
      setChoosing(true);
      
      const responseTime = Date.now() - choiceStartTime;
      const winnerId = choice === 'A' ? currentMatchup.imageA.id : currentMatchup.imageB.id;
      
      // Animação de escolha
      const chosenScale = choice === 'A' ? scaleAnimA : scaleAnimB;
      const otherScale = choice === 'A' ? scaleAnimB : scaleAnimA;
      
      Animated.parallel([
        Animated.spring(chosenScale, {
          toValue: 1.1,
          useNativeDriver: true
        }),
        Animated.spring(otherScale, {
          toValue: 0.8,
          useNativeDriver: true
        })
      ]).start();

      // Vibração de feedback
      Vibration.vibrate(50);

      // Determinar nível de confiança baseado no tempo de resposta
      let confidenceLevel = 3; // Padrão
      if (responseTime < 1000) confidenceLevel = 5; // Muito rápido = muito confiante
      else if (responseTime < 3000) confidenceLevel = 4; // Rápido = confiante
      else if (responseTime > 10000) confidenceLevel = 2; // Muito lento = inseguro
      
      // Enviar escolha para o backend
      const response = await api.post('/tournament/choice', {
        sessionId: session.id,
        winnerId,
        responseTimeMs: responseTime,
        confidenceLevel
      });

      if (response.success) {
        const updatedSession = response.data;
        setSession(updatedSession);
        
        // Atualizar estatísticas locais
        setLastChoice({ winner: choice, responseTime });
        setTotalChoices(prev => prev + 1);
        
        if (responseTime < 3000) {
          setStreak(prev => prev + 1);
        } else {
          setStreak(0);
        }

        // Aguardar animação e carregar próximo confronto
        setTimeout(async () => {
          // Resetar animações
          scaleAnimA.setValue(1);
          scaleAnimB.setValue(1);
          
          await loadNextMatchup(updatedSession.id);
          setChoosing(false);
        }, 1000);
        
      } else {
        throw new Error(response.message || 'Falha ao processar escolha');
      }

    } catch (error: any) {
      console.error('Erro ao processar escolha:', error);
      setChoosing(false);
      
      // Resetar animações
      scaleAnimA.setValue(1);
      scaleAnimB.setValue(1);
      
      Alert.alert('Erro', 'Falha ao processar sua escolha. Tente novamente.');
    }
  };

  const handleTournamentComplete = async (sessionId: string) => {
    try {
      const resultResponse = await api.get(`/tournament/result/${sessionId}`);
      
      if (resultResponse.success) {
        // Navegar para tela de resultado
        navigation.navigate('TournamentResult', {
          result: resultResponse.data,
          category
        });
      } else {
        throw new Error('Falha ao carregar resultado');
      }
    } catch (error) {
      console.error('Erro ao finalizar torneio:', error);
      Alert.alert(
        'Torneio Finalizado',
        'Seu torneio foi concluído! Parabéns!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const renderChoiceCard = (image: TournamentImage, side: 'A' | 'B') => {
    const scaleAnim = side === 'A' ? scaleAnimA : scaleAnimB;
    
    return (
      <Animated.View style={[
        styles.cardContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity
          style={styles.choiceCard}
          onPress={() => makeChoice(side)}
          disabled={choosing}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: image.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {image.title}
              </Text>
              {image.description && (
                <Text style={styles.cardDescription} numberOfLines={1}>
                  {image.description}
                </Text>
              )}
              <View style={styles.cardStats}>
                <View style={styles.statItem}>
                  <Ionicons name="trophy-outline" size={12} color="#FFD700" />
                  <Text style={styles.statText}>{image.winRate.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          
          <View style={[styles.choiceLabel, side === 'A' ? styles.choiceLabelA : styles.choiceLabelB]}>
            <Text style={styles.choiceLabelText}>{side}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderProgressBar = () => {
    if (!session) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            Rodada {session.currentRound} de {session.totalRounds}
          </Text>
          <Text style={styles.progressPercentage}>
            {session.progressPercentage}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        
        <View style={styles.remainingInfo}>
          <Text style={styles.remainingText}>
            {session.remainingImages.length} opções restantes
          </Text>
        </View>
      </View>
    );
  };

  const renderGameStats = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalChoices}</Text>
          <Text style={styles.statLabel}>Escolhas</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>Sequência</Text>
        </View>
        
        {lastChoice && (
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{(lastChoice.responseTime / 1000).toFixed(1)}s</Text>
            <Text style={styles.statLabel}>Última</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Preparando seu torneio...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!gameStarted || !currentMatchup) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Carregando próximo confronto...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (session?.status === 'active') {
                Alert.alert(
                  'Sair do Torneio',
                  'Tem certeza que deseja sair? Seu progresso será perdido.',
                  [
                    { text: 'Continuar', style: 'cancel' },
                    { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() }
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            Torneio de {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </View>

        {/* Barra de progresso */}
        {renderProgressBar()}

        {/* Estatísticas do jogo */}
        {renderGameStats()}

        {/* Área principal de confronto */}
        <View style={styles.battleArea}>
          <Text style={styles.battleInstruction}>
            Escolha sua preferência
          </Text>
          
          <Animated.View style={[styles.cardsContainer, { opacity: fadeAnim }]}>
            {renderChoiceCard(currentMatchup.imageA, 'A')}
            
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            
            {renderChoiceCard(currentMatchup.imageB, 'B')}
          </Animated.View>

          {choosing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.processingText}>Processando escolha...</Text>
            </View>
          )}
        </View>

        {/* Dica de velocidade */}
        <View style={styles.speedTip}>
          <Ionicons name="flash" size={16} color="#FFD700" />
          <Text style={styles.speedTipText}>
            Escolhas rápidas ganham bônus de velocidade!
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 40, // Compensar botão de voltar
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  remainingInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  remainingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  statNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  battleArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  battleInstruction: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  choiceCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  choiceLabel: {
    position: 'absolute',
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceLabelA: {
    left: 12,
    backgroundColor: '#FF6B6B',
  },
  choiceLabelB: {
    right: 12,
    backgroundColor: '#4ECDC4',
  },
  choiceLabelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  vsText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  speedTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  speedTipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});

export default TournamentScreen;