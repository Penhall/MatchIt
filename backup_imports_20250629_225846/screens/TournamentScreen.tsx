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
  StatusBar,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
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

const CATEGORY_COLORS = {
  'cores': '#FF6B6B',
  'estilos': '#4ECDC4',
  'calcados': '#45B7D1',
  'acessorios': '#96CEB4',
  'texturas': '#FECA57',
  'roupas_casuais': '#FF9FF3',
  'roupas_formais': '#54A0FF',
  'roupas_festa': '#5F27CD',
  'joias': '#FFD700',
  'bolsas': '#FF6348'
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const TournamentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { processChoice, getCurrentMatchup, cancelSession } = useTournament();

  // Route params
  const { category } = route.params as { category: string };

  // Core states
  const [session, setSession] = useState<TournamentSession | null>(null);
  const [currentMatchup, setCurrentMatchup] = useState<TournamentMatchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingChoice, setProcessingChoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [showVS, setShowVS] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [stats, setStats] = useState<TournamentStats>({
    totalChoices: 0,
    averageResponseTime: 0,
    streak: 0,
    fastChoices: 0,
    confidenceAverage: 0
  });

  // Animation states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnimA = useRef(new Animated.Value(1)).current;
  const scaleAnimB = useRef(new Animated.Value(1)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Timers
  const startTime = useRef<number>(0);
  const choiceTimer = useRef<NodeJS.Timeout | null>(null);

  // =====================================================
  // LIFECYCLE EFFECTS
  // =====================================================

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (session && session.status === 'active') {
          Alert.alert(
            'Sair do Torneio',
            'Tem certeza que deseja sair? Seu progresso será perdido.',
            [
              { text: 'Continuar', style: 'cancel' },
              { 
                text: 'Sair', 
                style: 'destructive',
                onPress: handleExitTournament
              }
            ]
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [session])
  );

  // Initialize tournament
  useEffect(() => {
    initializeTournament();
  }, [category]);

  // Show VS animation when matchup changes
  useEffect(() => {
    if (currentMatchup && !loading) {
      showVSAnimation();
    }
  }, [currentMatchup, loading]);

  // Update progress animation
  useEffect(() => {
    if (session) {
      const progress = (session.choicesMade / session.totalChoices) * 100;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [session]);

  // =====================================================
  // INITIALIZATION
  // =====================================================

  const initializeTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start or resume tournament
      const result = await startTournament(category);
      
      if (result.session) {
        setSession(result.session);
        setCurrentMatchup(result.matchup);
        
        if (result.matchup) {
          startTime.current = Date.now();
        }

        // Show entrance animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        if (result.resumed) {
          showResumedMessage();
        }
      }

    } catch (err: any) {
      console.error('❌ Erro ao inicializar torneio:', err);
      setError(err.message || 'Erro ao carregar torneio');
      
      Alert.alert(
        'Erro',
        err.message || 'Não foi possível carregar o torneio. Tente novamente.',
        [
          { text: 'Voltar', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const startTournament = async (category: string) => {
    // Mock implementation - replace with actual API call
    const mockResult = {
      session: {
        id: `tournament_${user?.id}_${category}_${Date.now()}`,
        userId: user?.id || 1,
        category,
        status: 'active' as const,
        currentRound: 1,
        totalRounds: 4,
        remainingImages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        tournamentSize: 16,
        progressPercentage: 0,
        choicesMade: 0,
        totalChoices: 15
      },
      matchup: {
        sessionId: `tournament_${user?.id}_${category}_${Date.now()}`,
        roundNumber: 1,
        matchupSequence: 1,
        imageA: {
          id: 1,
          category,
          imageUrl: 'https://picsum.photos/300/400?random=1',
          title: 'Estilo A',
          description: 'Descrição do estilo A',
          tags: ['casual', 'moderno']
        },
        imageB: {
          id: 2,
          category,
          imageUrl: 'https://picsum.photos/300/400?random=2',
          title: 'Estilo B',
          description: 'Descrição do estilo B',
          tags: ['formal', 'elegante']
        },
        startTime: new Date().toISOString()
      },
      resumed: false
    };

    return mockResult;
  };

  // =====================================================
  // CHOICE PROCESSING
  // =====================================================

  const handleImageChoice = async (winnerId: number, loserId: number) => {
    if (processingChoice || !currentMatchup || !session) return;

    try {
      setProcessingChoice(true);
      setSelectedImage(winnerId);

      // Calculate response time
      const responseTime = Date.now() - startTime.current;
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Visual feedback
      playChoiceAnimation(winnerId);

      // Process choice
      const result = await processChoice(
        session.id,
        winnerId,
        loserId,
        responseTime
      );

      // Update stats
      updateStats(responseTime);

      // Handle result
      if (result.finished) {
        // Tournament finished
        setTimeout(() => {
          navigation.replace('TournamentResult', {
            result: result.result,
            category,
            stats
          });
        }, 1500);
      } else {
        // Continue to next matchup
        setTimeout(() => {
          setCurrentMatchup(result.nextMatchup);
          setSelectedImage(null);
          startTime.current = Date.now();
          
          // Update session state
          if (session) {
            setSession({
              ...session,
              choicesMade: session.choicesMade + 1,
              progressPercentage: ((session.choicesMade + 1) / session.totalChoices) * 100
            });
          }
        }, 1000);
      }

    } catch (err: any) {
      console.error('❌ Erro ao processar escolha:', err);
      setError(err.message);
      
      // Shake animation for error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();

      Alert.alert('Erro', err.message || 'Erro ao processar escolha');
    } finally {
      setProcessingChoice(false);
    }
  };

  const updateStats = (responseTime: number) => {
    setStats(prev => {
      const newTotal = prev.totalChoices + 1;
      const newAverage = ((prev.averageResponseTime * prev.totalChoices) + responseTime) / newTotal;
      const isFast = responseTime < 3000;
      
      return {
        totalChoices: newTotal,
        averageResponseTime: newAverage,
        streak: isFast ? prev.streak + 1 : 0,
        fastChoices: isFast ? prev.fastChoices + 1 : prev.fastChoices,
        confidenceAverage: (prev.confidenceAverage + (isFast ? 100 : 60)) / 2
      };
    });
  };

  // =====================================================
  // ANIMATIONS
  // =====================================================

  const showVSAnimation = () => {
    setShowVS(true);
    
    Animated.sequence([
      Animated.timing(vsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(vsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowVS(false);
    });
  };

  const playChoiceAnimation = (winnerId: number) => {
    const winnerAnim = winnerId === currentMatchup?.imageA.id ? scaleAnimA : scaleAnimB;
    const loserAnim = winnerId === currentMatchup?.imageA.id ? scaleAnimB : scaleAnimA;

    // Winner grows, loser shrinks
    Animated.parallel([
      Animated.sequence([
        Animated.timing(winnerAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(winnerAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]),
      Animated.timing(loserAnim, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  };

  const showResumedMessage = () => {
    Alert.alert(
      'Torneio Retomado',
      'Continuando de onde você parou!',
      [{ text: 'OK' }]
    );
  };

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleExitTournament = async () => {
    try {
      if (session) {
        await cancelSession(session.id);
      }
      navigation.goBack();
    } catch (err) {
      console.error('❌ Erro ao cancelar sessão:', err);
      navigation.goBack();
    }
  };

  const handlePause = () => {
    Alert.alert(
      'Pausar Torneio',
      'Você pode retomar este torneio mais tarde.',
      [
        { text: 'Continuar', style: 'cancel' },
        { 
          text: 'Pausar', 
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Progresso: {session?.choicesMade || 0} / {session?.totalChoices || 0}
        </Text>
        <Text style={styles.roundText}>
          Rodada {session?.currentRound || 1} de {session?.totalRounds || 4}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp'
              }),
              backgroundColor: CATEGORY_COLORS[category] || '#667eea'
            }
          ]}
        />
      </View>
    </View>
  );

  const renderImageCard = (image: TournamentImage, position: 'left' | 'right') => {
    const isSelected = selectedImage === image.id;
    const isDisabled = processingChoice && !isSelected;
    const scaleAnim = position === 'left' ? scaleAnimA : scaleAnimB;

    return (
      <Animated.View 
        style={[
          styles.imageCard,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.imageButton,
            isSelected && styles.selectedImageButton,
            isDisabled && styles.disabledImageButton
          ]}
          onPress={() => {
            if (!processingChoice) {
              const winnerId = image.id;
              const loserId = position === 'left' 
                ? currentMatchup?.imageB.id 
                : currentMatchup?.imageA.id;
              
              if (loserId) {
                handleImageChoice(winnerId, loserId);
              }
            }
          }}
          disabled={processingChoice}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: image.thumbnailUrl || image.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          
          {/* Overlay gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardOverlay}
          />
          
          {/* Image info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {image.title}
            </Text>
            {image.tags && image.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {image.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Ionicons name="checkmark-circle" size={40} color="#00FF88" />
            </View>
          )}

          {/* Loading overlay */}
          {processingChoice && isSelected && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderVSIndicator = () => (
    <Animated.View 
      style={[
        styles.vsContainer,
        {
          opacity: vsOpacity,
          transform: [{
            scale: vsOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
              extrapolate: 'clamp'
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={styles.vsGradient}
      >
        <Text style={styles.vsText}>VS</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={handleExitTournament}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>
          {CATEGORY_COLORS[category] && (
            <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
          )}
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Text>
        <Text style={styles.headerSubtitle}>Torneio de Estilo</Text>
      </View>

      <TouchableOpacity 
        style={styles.headerButton}
        onPress={handlePause}
      >
        <Ionicons name="pause" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{Math.round(stats.averageResponseTime / 1000)}s</Text>
        <Text style={styles.statLabel}>Tempo Médio</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.streak}</Text>
        <Text style={styles.statLabel}>Sequência</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{Math.round(stats.confidenceAverage)}%</Text>
        <Text style={styles.statLabel}>Confiança</Text>
      </View>
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Preparando torneio...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error && !currentMatchup) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={initializeTournament}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderHeader()}
          {renderProgressBar()}
          {renderStats()}

          {/* Main battle area */}
          <View style={styles.battleArea}>
            {currentMatchup && (
              <>
                {renderImageCard(currentMatchup.imageA, 'left')}
                
                {showVS && renderVSIndicator()}
                
                {renderImageCard(currentMatchup.imageB, 'right')}
              </>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Toque na imagem que mais combina com seu estilo
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  // Progress styles
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  roundText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Battle area styles
  battleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'relative',
  },
  
  // Image card styles
  imageCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  imageButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedImageButton: {
    borderWidth: 3,
    borderColor: '#00FF88',
  },
  disabledImageButton: {
    opacity: 0.6,
  },
  cardImage: {
    width: '100%',
    height: '70%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // VS indicator styles
  vsContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -VS_SIZE / 2,
    marginTop: -VS_SIZE / 2,
    width: VS_SIZE,
    height: VS_SIZE,
    zIndex: 10,
  },
  vsGradient: {
    flex: 1,
    borderRadius: VS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },

  // Instructions styles
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    fontWeight: '500',
  },

  // Error styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
});

export default TournamentScreen;