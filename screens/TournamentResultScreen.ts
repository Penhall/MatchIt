// screens/TournamentResultScreen.tsx - Tela de resultado do torneio com insights
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';

interface TournamentResult {
  sessionId: string;
  userId: number;
  category: string;
  championId: number;
  finalistId?: number;
  semifinalists: number[];
  topChoices: number[];
  preferenceStrength: number;
  consistencyScore: number;
  decisionSpeedAvg: number;
  totalChoicesMade: number;
  roundsCompleted: number;
  sessionDurationMinutes: number;
  completionRate: number;
  styleProfile: any;
  dominantPreferences: any;
  completedAt: string;
}

interface ResultImage {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  winRate: number;
}

const { width } = Dimensions.get('window');
const PODIUM_WIDTH = (width - 80) / 3;

export const TournamentResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const api = useApi();

  const { result, category } = route.params as { 
    result: TournamentResult; 
    category: string; 
  };

  // Estados
  const [championImage, setChampionImage] = useState<ResultImage | null>(null);
  const [finalistImage, setFinalistImage] = useState<ResultImage | null>(null);
  const [topImages, setTopImages] = useState<ResultImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Animações
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    loadResultImages();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadResultImages = async () => {
    try {
      // Buscar imagens do resultado
      const imageIds = [
        result.championId,
        result.finalistId,
        ...result.topChoices.slice(0, 6)
      ].filter(Boolean);

      const imagePromises = imageIds.map(async (id) => {
        try {
          const response = await api.get(`/tournament/images/${category}`);
          if (response.success) {
            return response.data.find((img: any) => img.id === id);
          }
        } catch (error) {
          console.error('Erro ao buscar imagem:', id, error);
        }
        return null;
      });

      const images = await Promise.all(imagePromises);
      const validImages = images.filter(Boolean);

      // Organizar imagens
      setChampionImage(validImages.find(img => img.id === result.championId) || null);
      setFinalistImage(validImages.find(img => img.id === result.finalistId) || null);
      setTopImages(validImages.slice(0, 6));

    } catch (error) {
      console.error('Erro ao carregar imagens do resultado:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareResult = async () => {
    try {
      const message = `🏆 Acabei de completar um torneio de ${category}!\n\n` +
        `🥇 Campeão: ${championImage?.title || 'Minha escolha favorita'}\n` +
        `⚡ ${result.totalChoicesMade} escolhas em ${result.sessionDurationMinutes} minutos\n` +
        `🎯 Força de preferência: ${(result.preferenceStrength * 100).toFixed(0)}%\n\n` +
        `Descubra seu estilo no MatchIt!`;

      await Share.share({
        message,
        title: 'Meu Resultado no Torneio MatchIt'
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const startNewTournament = () => {
    Alert.alert(
      'Novo Torneio',
      'Deseja iniciar um novo torneio na mesma categoria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim',
          onPress: () => {
            navigation.replace('Tournament', { category });
          }
        }
      ]
    );
  };

  const renderPodium = () => {
    return (
      <Animated.View style={[
        styles.podiumContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        {/* Segundo lugar */}
        {finalistImage && (
          <View style={[styles.podiumPlace, styles.secondPlace]}>
            <Image
              source={{ uri: finalistImage.imageUrl }}
              style={styles.podiumImage}
              resizeMode="cover"
            />
            <View style={styles.podiumRank}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
            <Text style={styles.podiumTitle} numberOfLines={2}>
              {finalistImage.title}
            </Text>
          </View>
        )}

        {/* Primeiro lugar */}
        {championImage && (
          <Animated.View style={[
            styles.podiumPlace, 
            styles.firstPlace,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.championGlow}
            >
              <Image
                source={{ uri: championImage.imageUrl }}
                style={styles.podiumImage}
                resizeMode="cover"
              />
            </LinearGradient>
            <View style={[styles.podiumRank, styles.championRank]}>
              <Ionicons name="trophy" size={20} color="white" />
            </View>
            <Text style={[styles.podiumTitle, styles.championTitle]} numberOfLines={2}>
              {championImage.title}
            </Text>
            <Text style={styles.championSubtitle}>
              SEU FAVORITO
            </Text>
          </Animated.View>
        )}

        {/* Terceiro lugar */}
        {result.semifinalists.length > 0 && topImages.length > 2 && (
          <View style={[styles.podiumPlace, styles.thirdPlace]}>
            <Image
              source={{ uri: topImages[2]?.imageUrl }}
              style={styles.podiumImage}
              resizeMode="cover"
            />
            <View style={styles.podiumRank}>
              <Text style={styles.podiumRankText}>3</Text>
            </View>
            <Text style={styles.podiumTitle} numberOfLines={2}>
              {topImages[2]?.title}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderStats = () => {
    return (
      <Animated.View style={[
        styles.statsContainer,
        { opacity: fadeAnim }
      ]}>
        <Text style={styles.sectionTitle}>📊 Suas Estatísticas</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{result.totalChoicesMade}</Text>
            <Text style={styles.statLabel}>Escolhas Feitas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{result.sessionDurationMinutes}min</Text>
            <Text style={styles.statLabel}>Tempo Total</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {(result.decisionSpeedAvg / 1000).toFixed(1)}s
            </Text>
            <Text style={styles.statLabel}>Tempo Médio</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {(result.preferenceStrength * 100).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Força de Preferência</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderInsights = () => {
    const speedCategory = result.decisionSpeedAvg < 3000 ? 'Rápido' : 
                        result.decisionSpeedAvg < 6000 ? 'Moderado' : 'Reflexivo';
    
    const preferenceStrength = result.preferenceStrength > 0.7 ? 'Muito Definidas' :
                              result.preferenceStrength > 0.4 ? 'Moderadas' : 'Flexíveis';

    return (
      <Animated.View style={[
        styles.insightsContainer,
        { opacity: fadeAnim }
      ]}>
        <Text style={styles.sectionTitle}>🧠 Insights do Seu Estilo</Text>
        
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="flash" size={24} color="#FF6B6B" />
            <Text style={styles.insightTitle}>Velocidade de Decisão</Text>
          </View>
          <Text style={styles.insightDescription}>
            Você é um decisor <Text style={styles.insightHighlight}>{speedCategory}</Text>.
            {speedCategory === 'Rápido' && ' Suas preferências são claras e você confia nas suas escolhas!'}
            {speedCategory === 'Moderado' && ' Você equilibra intuição com reflexão.'}
            {speedCategory === 'Reflexivo' && ' Você considera cuidadosamente antes de escolher.'}
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="heart" size={24} color="#4ECDC4" />
            <Text style={styles.insightTitle}>Força das Preferências</Text>
          </View>
          <Text style={styles.insightDescription}>
            Suas preferências são <Text style={styles.insightHighlight}>{preferenceStrength}</Text>.
            {preferenceStrength === 'Muito Definidas' && ' Você tem um gosto bem específico!'}
            {preferenceStrength === 'Moderadas' && ' Você aprecia variedade com algumas preferências claras.'}
            {preferenceStrength === 'Flexíveis' && ' Você está aberto a diferentes estilos e opções.'}
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.insightTitle}>Perfil de Compatibilidade</Text>
          </View>
          <Text style={styles.insightDescription}>
            Com base nas suas escolhas, você tem {(result.consistencyScore * 100).toFixed(0)}% de 
            consistência nas preferências. Isso nos ajuda a encontrar pessoas com gostos similares!
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderTopChoices = () => {
    if (topImages.length < 4) return null;

    return (
      <Animated.View style={[
        styles.topChoicesContainer,
        { opacity: fadeAnim }
      ]}>
        <Text style={styles.sectionTitle}>🏅 Seus Top 6</Text>
        
        <View style={styles.topChoicesGrid}>
          {topImages.slice(0, 6).map((image, index) => (
            <View key={image.id} style={styles.topChoiceCard}>
              <Image
                source={{ uri: image.imageUrl }}
                style={styles.topChoiceImage}
                resizeMode="cover"
              />
              <View style={styles.topChoiceRank}>
                <Text style={styles.topChoiceRankText}>{index + 1}</Text>
              </View>
              <Text style={styles.topChoiceTitle} numberOfLines={1}>
                {image.title}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderActions = () => {
    return (
      <Animated.View style={[
        styles.actionsContainer,
        { opacity: fadeAnim }
      ]}>
        <TouchableOpacity style={styles.primaryButton} onPress={startNewTournament}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Novo Torneio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={shareResult}>
          <Ionicons name="share-social" size={20} color="#667eea" />
          <Text style={styles.secondaryButtonText}>Compartilhar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Preparando seus resultados...</Text>
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Resultado do Torneio</Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Celebração */}
          <Animated.View style={[
            styles.celebrationContainer,
            { opacity: fadeAnim }
          ]}>
            <Text style={styles.celebrationTitle}>🎉 Parabéns!</Text>
            <Text style={styles.celebrationSubtitle}>
              Você completou o torneio de {category}!
            </Text>
          </Animated.View>

          {/* Pódio */}
          {renderPodium()}

          {/* Estatísticas */}
          {renderStats()}

          {/* Insights */}
          {renderInsights()}

          {/* Top Choices */}
          {renderTopChoices()}

          {/* Ações */}
          {renderActions()}
        </ScrollView>
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
    marginRight: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  celebrationTitle: {
    fontSize: 32,
    color: 'white',
    fontWeight: '700',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  podiumPlace: {
    alignItems: 'center',
    width: PODIUM_WIDTH,
  },
  firstPlace: {
    marginBottom: 20,
  },
  secondPlace: {
    marginBottom: 10,
  },
  thirdPlace: {
    marginBottom: 0,
  },
  podiumImage: {
    width: PODIUM_WIDTH,
    height: PODIUM_WIDTH,
    borderRadius: PODIUM_WIDTH / 2,
  },
  championGlow: {
    padding: 4,
    borderRadius: (PODIUM_WIDTH + 8) / 2,
  },
  podiumRank: {
    position: 'absolute',
    bottom: PODIUM_WIDTH - 16,
    backgroundColor: '#666',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  championRank: {
    backgroundColor: '#FFD700',
  },
  podiumRankText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  podiumTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  championTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  championSubtitle: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 56) / 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '700',
    color: '#FFD700',
  },
  topChoicesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topChoicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  topChoiceCard: {
    width: (width - 56) / 3,
    alignItems: 'center',
    marginBottom: 12,
  },
  topChoiceImage: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 8,
  },
  topChoiceRank: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  topChoiceRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  topChoiceTitle: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TournamentResultScreen;