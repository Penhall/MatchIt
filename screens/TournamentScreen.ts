// screens/TournamentScreen.tsx - Interface gamificada completa para torneios 2x2
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  BackHandler,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import * as Haptics from 'expo-haptics';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[];
  winRate?: number;
}

interface TournamentMatchup {
  sessionId: string;
  roundNumber: number;
  matchupSequence: number;
  imageA: TournamentImage;
  imageB: TournamentImage;
  startTime: string;
}

interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentRound: number;
  totalRounds: number;
  remainingImages: number[];
  tournamentSize: number;
  progressPercentage: number;
  choicesMade: number;
  totalChoices: number;
}

interface TournamentStats {
  totalChoices: number;
  averageResponseTime: number;
  streak: number;
  fastChoices: number;
  confidenceAverage: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
const VS_SIZE = 80;

// =====================================================
// MAIN COMPONENT
// =====================================================

export const TournamentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const api = useApi();

  // Route parameters
  const { category } = route.params as { category: string };

  // Core states
  const [session, setSession] = useState<TournamentSession | null>(null);
  const [currentMatchup, setCurrentMatchup] = useState<TournamentMatchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnimA] = useState(new Animated.Value(1));
  const [scaleAnimB] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));
  const [vsAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  // Game states
  const [choiceStartTime, setChoiceStartTime] = useState<number>(0);
  const [stats, setStats] = useState<TournamentStats>({
    totalChoices: 0,
    averageResponseTime: 0,
    streak: 0,
    fastChoices: 0,
    confidenceAverage: 0
  });

  // Visual feedback states
  const [lastChoice, setLastChoice] = useState<{ 
    winner: 'A' | 'B'; 
    responseTime: number; 
    isFast: boolean;
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [choiceAnimation, setChoiceAnimation] = useState<'A' | 'B' | null>(null);

  // Refs
  const choiceTimerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  // =====================================================
  // LIFECYCLE AND NAVIGATION
  // =====================================================

  useEffect(() => {
    initializeTournament();
    return () => {
      if (choiceTimerRef.current) clearTimeout(choiceTimerRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentMatchup && !choiceStartTime) {
      setChoiceStartTime(Date.now());
      startMatchupAnimation();
    }
  }, [currentMatchup]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (gameStarted && session?.status === 'active') {
          Alert.alert(
            'Sair do Torneio',
            'Tem certeza que deseja sair? Seu progresso será perdido.',
            [
              { text: 'Continuar', style: 'cancel' },
              { 
                text: 'Sair', 
                style: 'destructive',
                onPress: () => {
                  pauseTournament();
                  navigation.goBack();
                }
              }
            ]
          );
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [gameStarted, session])
  );

  // =====================================================
  // TOURNAMENT LOGIC
  // =====================================================

  const initializeTournament = async () => {
    try {
      setLoading(true);
      
      // Check for existing session
      const existingSession = await api.get(`/tournament/active/${category}`);
      
      if (existingSession?.data) {
        // Resume existing tournament
        setSession(existingSession.data);
        setGameStarted(true);
        await loadCurrentMatchup(existingSession.data.id);
        setStats(prev => ({
          ...prev,
          totalChoices: existingSession.data.choicesMade || 0
        }));
      } else {
        // Start new tournament
        await startNewTournament();
      }
    } catch (error) {
      console.error('Failed to initialize tournament:', error);
      Alert.alert(
        'Erro',
        'Não foi possível inicializar o torneio. Tente novamente.',
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
        tournamentSize: 16
      });

      if (response?.data) {
        setSession(response.data.session);
        setCurrentMatchup(response.data.firstMatchup);
        setGameStarted(true);
        
        // Start enter animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      throw new Error('Failed to start tournament');
    }
  };

  const loadCurrentMatchup = async (sessionId: string) => {
    try {
      const response = await api.get(`/tournament/matchup/${sessionId}`);
      if (response?.data) {
        setCurrentMatchup(response.data);
      }
    } catch (error) {
      console.error('Failed to load matchup:', error);
    }
  };

  const pauseTournament = async () => {
    if (!session) return;

    try {
      await api.put(`/tournament/pause/${session.id}`);
    } catch (error) {
      console.error('Failed to pause tournament:', error);
    }
  };

  // =====================================================
  // CHOICE HANDLING
  // =====================================================

  const makeChoice = async (winnerId: number, winnerSide: 'A' | 'B') => {
    if (!currentMatchup || !session || choosing) return;

    try {
      setChoosing(true);
      setChoiceAnimation(winnerSide);

      const responseTime = Date.now() - choiceStartTime;
      const isFast = responseTime < 3000;
      const confidence = isFast ? 5 : responseTime < 5000 ? 4 : 3;

      // Visual feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Scale animation for chosen card
      const scaleAnim = winnerSide === 'A' ? scaleAnimA : scaleAnimB;
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();

      // API call
      const response = await api.post('/tournament/choice', {
        sessionId: session.id,
        winnerId,
        responseTimeMs: responseTime,
        confidence
      });

      if (response?.data) {
        const { nextMatchup, tournamentComplete, result } = response.data;

        // Update stats
        const newStats = {
          ...stats,
          totalChoices: stats.totalChoices + 1,
          averageResponseTime: ((stats.averageResponseTime * stats.totalChoices) + responseTime) / (stats.totalChoices + 1),
          streak: isFast ? stats.streak + 1 : 0,
          fastChoices: isFast ? stats.fastChoices + 1 : stats.fastChoices,
          confidenceAverage: ((stats.confidenceAverage * stats.totalChoices) + confidence) / (stats.totalChoices + 1)
        };
        setStats(newStats);

        // Update progress
        const newProgress = response.data.progressPercentage || 0;
        Animated.timing(progressAnim, {
          toValue: newProgress / 100,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Show feedback
        setLastChoice({ winner: winnerSide, responseTime, isFast });
        setShowFeedback(true);

        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => {
          setShowFeedback(false);
          setChoiceAnimation(null);
        }, 1500);

        if (tournamentComplete) {
          // Tournament finished
          setTimeout(() => {
            navigation.navigate('TournamentResult', {
              result,
              category,
              stats: newStats
            });
          }, 2000);
        } else if (nextMatchup) {
          // Next matchup
          setTimeout(() => {
            setCurrentMatchup(nextMatchup);
            setChoiceStartTime(0);
            setSession(prev => prev ? {
              ...prev,
              progressPercentage: newProgress,
              choicesMade: stats.totalChoices + 1
            } : null);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Failed to process choice:', error);
      Alert.alert('Erro', 'Não foi possível processar sua escolha. Tente novamente.');
    } finally {
      setChoosing(false);
    }
  };

  // =====================================================
  // ANIMATIONS
  // =====================================================

  const startMatchupAnimation = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    vsAnim.setValue(0.5);

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(vsAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    // VS pulse animation
    const pulseVS = () => {
      Animated.sequence([
        Animated.timing(vsAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(vsAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (currentMatchup && !choosing) {
          pulseVS();
        }
      });
    };

    setTimeout(pulseVS, 1000);
  };

  // =====================================================
  // RENDER METHODS
  // =====================================================

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Rodada {session?.currentRound} de {session?.totalRounds}
        </Text>
        <Text style={styles.progressSubtext}>
          {stats.totalChoices} de {session?.totalChoices} escolhas
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      </View>
      <Text style={styles.progressPercentage}>
        {Math.round((session?.progressPercentage || 0))}%
      </Text>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Ionicons name="flash" size={16} color="#FFD700" />
        <Text style={styles.statText}>Streak: {stats.streak}</Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="time" size={16} color="#4A90E2" />
        <Text style={styles.statText}>
          {(stats.averageResponseTime / 1000).toFixed(1)}s
        </Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="star" size={16} color="#FF6B6B" />
        <Text style={styles.statText}>
          {stats.confidenceAverage.toFixed(1)}
        </Text>
      </View>
    </View>
  );

  const renderImageCard = (image: TournamentImage, side: 'A' | 'B') => {
    const scaleAnim = side === 'A' ? scaleAnimA : scaleAnimB;
    const isChoiceAnimation = choiceAnimation === side;

    return (
      <Animated.View
        style={[
          styles.imageCardContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ],
            opacity: fadeAnim
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.imageCard,
            isChoiceAnimation && styles.chosenCard
          ]}
          onPress={() => makeChoice(image.id, side)}
          disabled={choosing}
          activeOpacity={0.95}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: image.thumbnailUrl || image.imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            {isChoiceAnimation && (
              <View style={styles.choiceOverlay}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
            )}
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {image.title}
            </Text>
            {image.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {image.description}
              </Text>
            )}
            {image.winRate && (
              <View style={styles.winRateContainer}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.winRateText}>
                  {image.winRate.toFixed(0)}% vitórias
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderVersusElement = () => (
    <Animated.View
      style={[
        styles.vsContainer,
        {
          transform: [{ scale: vsAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.vsCircle}
      >
        <Text style={styles.vsText}>VS</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderFeedback = () => {
    if (!showFeedback || !lastChoice) return null;

    return (
      <Animated.View
        style={[
          styles.feedbackContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: vsAnim }]
          }
        ]}
      >
        <View style={[
          styles.feedbackCard,
          lastChoice.isFast && styles.fastChoiceFeedback
        ]}>
          <Ionicons 
            name={lastChoice.isFast ? "flash" : "checkmark"} 
            size={24} 
            color={lastChoice.isFast ? "#FFD700" : "#4CAF50"} 
          />
          <Text style={styles.feedbackText}>
            {lastChoice.isFast ? "Escolha Rápida!" : "Boa Escolha!"}
          </Text>
          <Text style={styles.feedbackTime}>
            {(lastChoice.responseTime / 1000).toFixed(1)}s
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={styles.loadingText}>Preparando torneio...</Text>
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (!currentMatchup || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>
            Erro ao carregar o torneio
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeTournament}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <SafeAreaView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (gameStarted) {
                Alert.alert(
                  'Sair do Torneio',
                  'Tem certeza que deseja sair? Seu progresso será perdido.',
                  [
                    { text: 'Continuar', style: 'cancel' },
                    { 
                      text: 'Sair', 
                      style: 'destructive',
                      onPress: () => {
                        pauseTournament();
                        navigation.goBack();
                      }
                    }
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Torneio: {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.pauseButton} onPress={pauseTournament}>
            <Ionicons name="pause" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Stats */}
        {renderStats()}

        {/* Main Battle Area */}
        <View style={styles.battleArea}>
          <View style={styles.cardsContainer}>
            {/* Image A */}
            {renderImageCard(currentMatchup.imageA, 'A')}

            {/* VS Element */}
            {renderVersusElement()}

            {/* Image B */}
            {renderImageCard(currentMatchup.imageB, 'B')}
          </View>
        </View>

        {/* Feedback */}
        {renderFeedback()}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Toque na imagem que mais combina com seu estilo
          </Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  pauseButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  battleArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageCardContainer: {
    width: CARD_WIDTH,
  },
  imageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chosenCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT,
  },
  choiceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
  },
  winRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winRateText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  vsCircle: {
    width: VS_SIZE,
    height: VS_SIZE,
    borderRadius: VS_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  feedbackContainer: {
    position: 'absolute',
    top: height / 2 - 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fastChoiceFeedback: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
  },
  feedbackText: {
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedbackTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TournamentScreen;