// screens/TournamentScreen.tsx - Interface principal do torneio
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TournamentScreenProps {
  route: {
    params: {
      category: StyleCategory;
    };
  };
  navigation: any;
}

interface TournamentImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
}

interface TournamentSession {
  id: string;
  category: StyleCategory;
  currentRound: number;
  totalRounds: number;
  remainingImages: number;
  currentMatchup: [number, number] | null;
  status: 'active' | 'completed';
}

type StyleCategory = 'roupas' | 'calcados' | 'cores' | 'estilos' | 'acessorios';

const CATEGORY_LABELS = {
  roupas: 'Roupas',
  calcados: 'Calçados', 
  cores: 'Cores',
  estilos: 'Estilos',
  acessorios: 'Acessórios'
};

const CATEGORY_EMOJIS = {
  roupas: '👕',
  calcados: '👟',
  cores: '🎨',
  estilos: '✨',
  acessorios: '💍'
};

export const TournamentScreen: React.FC<TournamentScreenProps> = ({ route, navigation }) => {
  const { category } = route.params;
  const { request } = useApi();

  // Estados
  const [session, setSession] = useState<TournamentSession | null>(null);
  const [matchupImages, setMatchupImages] = useState<TournamentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Animações
  const [leftImageScale] = useState(new Animated.Value(1));
  const [rightImageScale] = useState(new Animated.Value(1));
  const [progressAnimation] = useState(new Animated.Value(0));
  const [celebrationAnimation] = useState(new Animated.Value(0));

  // Carregar ou retomar torneio
  useEffect(() => {
    initializeTournament();
  }, []);

  const initializeTournament = async () => {
    try {
      setLoading(true);

      // Verificar se existe sessão ativa
      const activeSession = await request(`/api/tournament/active/${category}`, 'GET');
      
      if (activeSession) {
        setSession(activeSession);
        await loadMatchupImages(activeSession.currentMatchup);
      } else {
        // Iniciar novo torneio
        const newSession = await request('/api/tournament/start', 'POST', { category });
        setSession(newSession);
        await loadMatchupImages(newSession.currentMatchup);
      }

    } catch (error) {
      console.error('Erro ao inicializar torneio:', error);
      Alert.alert(
        'Erro',
        'Não foi possível inicializar o torneio. Tente novamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMatchupImages = async (imageIds: [number, number]) => {
    try {
      const images = await request('/api/tournament/matchup-images', 'POST', { imageIds });
      setMatchupImages(images);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      throw error;
    }
  };

  const handleImageChoice = async (winnerId: number) => {
    if (choosing || !session) return;

    setChoosing(true);
    setSelectedImage(winnerId);

    try {
      // Animação de seleção
      const selectedScale = winnerId === matchupImages[0]?.id ? leftImageScale : rightImageScale;
      const rejectedScale = winnerId === matchupImages[0]?.id ? rightImageScale : leftImageScale;

      Animated.parallel([
        Animated.spring(selectedScale, {
          toValue: 1.1,
          useNativeDriver: true,
        }),
        Animated.spring(rejectedScale, {
          toValue: 0.8,
          useNativeDriver: true,
        }),
      ]).start();

      // Aguardar animação
      await new Promise(resolve => setTimeout(resolve, 800));

      // Enviar escolha para backend
      const updatedSession = await request('/api/tournament/choice', 'POST', {
        sessionId: session.id,
        winnerId
      });

      // Verificar se torneio terminou
      if (updatedSession.status === 'completed') {
        await showCelebration();
        navigation.replace('TournamentResult', { 
          category, 
          sessionId: session.id 
        });
        return;
      }

      // Continuar para próximo matchup
      setSession(updatedSession);
      await loadMatchupImages(updatedSession.currentMatchup);

      // Reset animações
      Animated.parallel([
        Animated.spring(leftImageScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(rightImageScale, { toValue: 1, useNativeDriver: true })
      ]).start();

      // Atualizar progresso
      updateProgress(updatedSession);

    } catch (error) {
      console.error('Erro ao processar escolha:', error);
      Alert.alert('Erro', 'Não foi possível registrar sua escolha. Tente novamente.');
      
      // Reset animações em caso de erro
      Animated.parallel([
        Animated.spring(leftImageScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(rightImageScale, { toValue: 1, useNativeDriver: true })
      ]).start();
    } finally {
      setChoosing(false);
      setSelectedImage(null);
    }
  };

  const updateProgress = (updatedSession: TournamentSession) => {
    const totalImages = Math.pow(2, Math.ceil(Math.log2(updatedSession.remainingImages)));
    const progress = 1 - (updatedSession.remainingImages / totalImages);
    
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const showCelebration = async () => {
    return new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(celebrationAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => resolve());
    });
  };

  const calculateProgress = () => {
    if (!session) return 0;
    const totalMatches = Math.pow(2, session.totalRounds) - 1;
    const remainingMatches = session.remainingImages - 1;
    return ((totalMatches - remainingMatches) / totalMatches) * 100;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            Preparando torneio de {CATEGORY_LABELS[category]}...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!session || !matchupImages.length) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar torneio</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeTournament}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.categoryTitle}>
            {CATEGORY_EMOJIS[category]} {CATEGORY_LABELS[category]}
          </Text>
          <Text style={styles.roundText}>
            Rodada {session.currentRound} de {session.totalRounds}
          </Text>
        </View>

        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barra de Progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(calculateProgress())}% concluído
        </Text>
      </View>

      {/* Instrução */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Qual você prefere?
        </Text>
        <Text style={styles.instructionSubtext}>
          Toque na imagem de sua preferência
        </Text>
      </View>

      {/* Matchup de Imagens */}
      <View style={styles.matchupContainer}>
        {matchupImages.map((image, index) => (
          <Animated.View
            key={image.id}
            style={[
              styles.imageContainer,
              {
                transform: [
                  { 
                    scale: index === 0 ? leftImageScale : rightImageScale 
                  }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.imageButton,
                choosing && selectedImage === image.id && styles.selectedImageButton
              ]}
              onPress={() => handleImageChoice(image.id)}
              disabled={choosing}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: image.thumbnailUrl || image.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              
              {choosing && selectedImage === image.id && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={40} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* VS Indicator */}
      <View style={styles.vsContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)']}
          style={styles.vsCircle}
        >
          <Text style={styles.vsText}>VS</Text>
        </LinearGradient>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{session.remainingImages}</Text>
          <Text style={styles.statLabel}>Restantes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.pow(2, session.totalRounds) - session.remainingImages}
          </Text>
          <Text style={styles.statLabel}>Eliminadas</Text>
        </View>
      </View>

      {/* Animação de Celebração */}
      <Animated.View
        style={[
          styles.celebrationContainer,
          {
            opacity: celebrationAnimation,
            transform: [
              {
                scale: celebrationAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                })
              }
            ]
          }
        ]}
        pointerEvents="none"
      >
        <Text style={styles.celebrationText}>🎉</Text>
        <Text style={styles.celebrationTitle}>Parabéns!</Text>
        <Text style={styles.celebrationSubtitle}>Torneio concluído</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  
  categoryTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  roundText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  instructionContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  
  instructionText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  instructionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    flex: 1,
  },
  
  imageContainer: {
    width: screenWidth * 0.4,
    height: screenWidth * 0.5,
  },
  
  imageButton: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  selectedImageButton: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  vsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 1,
  },
  
  vsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  vsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },

  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  
  celebrationText: {
    fontSize: 60,
    marginBottom: 20,
  },
  
  celebrationTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  celebrationSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
  },
});

export default TournamentScreen;