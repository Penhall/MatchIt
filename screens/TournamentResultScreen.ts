// screens/TournamentResultScreen.tsx - Tela completa de resultados do torneio com insights
import React, { useState, useEffect, useCallback } from 'react';
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
  Animated,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTournament } from '../hooks/useTournament';
import { useApi } from '../hooks/useApi';
import * as Haptics from 'expo-haptics';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

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
  styleProfile: StyleProfile;
  dominantPreferences: DominantPreferences;
  completedAt: string;
  insights: string[];
  recommendations: string[];
}

interface StyleProfile {
  dominant_colors?: string[];
  style_consistency?: number;
  speed_preference?: 'fast' | 'moderate' | 'thoughtful';
  confidence_level?: number;
  preference_clarity?: number;
  style_evolution?: any;
}

interface DominantPreferences {
  primary_preference?: string;
  secondary_preferences?: string[];
  preference_strength?: number;
  consistency_score?: number;
  unique_traits?: string[];
}

interface ResultImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  winRate: number;
  tags: string[];
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
const PODIUM_HEIGHT = 200;
const CHAMPION_SIZE = 120;
const FINALIST_SIZE = 90;

const CATEGORY_TRANSLATIONS = {
  cores: 'Cores',
  estilos: 'Estilos',
  calcados: 'Calçados',
  acessorios: 'Acessórios',
  texturas: 'Texturas',
  roupas_casuais: 'Roupas Casuais',
  roupas_formais: 'Roupas Formais',
  roupas_festa: 'Roupas de Festa',
  joias: 'Joias',
  bolsas: 'Bolsas'
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const TournamentResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const api = useApi();
  const { startTournament, loadCategories } = useTournament();

  // Route parameters
  const { result, category, stats } = route.params as { 
    result: TournamentResult; 
    category: string;
    stats?: TournamentStats;
  };

  // States
  const [championImage, setChampionImage] = useState<ResultImage | null>(null);
  const [finalistImage, setFinalistImage] = useState<ResultImage | null>(null);
  const [topImages, setTopImages] = useState<ResultImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [podiumAnim] = useState(new Animated.Value(0));
  const [insightsAnim] = useState(new Animated.Value(0));

  // =====================================================
  // LIFECYCLE
  // =====================================================

  useEffect(() => {
    loadResultImages();
    startEntranceAnimation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadResultImages = async () => {
    try {
      setLoading(true);

      // Load champion image
      if (result.championId) {
        const championResponse = await api.get(`/tournament/image/${result.championId}`);
        if (championResponse?.data) {
          setChampionImage(championResponse.data);
        }
      }

      // Load finalist image
      if (result.finalistId) {
        const finalistResponse = await api.get(`/tournament/image/${result.finalistId}`);
        if (finalistResponse?.data) {
          setFinalistImage(finalistResponse.data);
        }
      }

      // Load top 4 images
      if (result.topChoices && result.topChoices.length > 0) {
        const topPromises = result.topChoices.slice(0, 4).map(id => 
          api.get(`/tournament/image/${id}`)
        );
        const topResponses = await Promise.all(topPromises);
        const topImagesData = topResponses
          .filter(response => response?.data)
          .map(response => response.data);
        setTopImages(topImagesData);
      }
    } catch (error) {
      console.error('Failed to load result images:', error);
      Alert.alert('Erro', 'Falha ao carregar imagens dos resultados');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ANIMATIONS
  // =====================================================

  const startEntranceAnimation = () => {
    Animated.sequence([
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Slide and scale
      Animated.parallel([
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
        })
      ]),
      // Podium animation
      Animated.timing(podiumAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Insights animation
      Animated.timing(insightsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  // =====================================================
  // SHARING AND ACTIONS
  // =====================================================

  const shareResult = async () => {
    try {
      setShareLoading(true);
      
      const categoryName = CATEGORY_TRANSLATIONS[category as keyof typeof CATEGORY_TRANSLATIONS] || category;
      const championTitle = championImage?.title || 'Campeão';
      
      const shareContent = {
        message: `🏆 Acabei de descobrir meu estilo em ${categoryName}!\n\n🥇 Minha escolha campeã: ${championTitle}\n\n💫 Força da preferência: ${result.preferenceStrength.toFixed(1)}%\n⚡ Consistência: ${result.consistencyScore.toFixed(1)}%\n\n#MatchIt #EstiloPersonal #DescubraSeuEstilo`,
        title: 'Meu Resultado no MatchIt'
      };

      await Share.share(shareContent);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to share result:', error);
    } finally {
      setShareLoading(false);
    }
  };

  const startNewTournament = async () => {
    try {
      Alert.alert(
        'Novo Torneio',
        'Que categoria você gostaria de explorar agora?',
        [
          { text: 'Mesma Categoria', onPress: () => restartSameCategory() },
          { text: 'Categoria Diferente', onPress: () => chooseDifferentCategory() },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error starting new tournament:', error);
    }
  };

  const restartSameCategory = async () => {
    try {
      await startTournament(category, 16);
      navigation.navigate('Tournament', { category });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar novo torneio');
    }
  };

  const chooseDifferentCategory = () => {
    navigation.navigate('TournamentMenu');
  };

  const viewDetailedInsights = () => {
    // Navigate to detailed insights screen (future implementation)
    Alert.alert(
      'Insights Detalhados',
      'Esta funcionalidade estará disponível em breve! Por enquanto, você pode ver seus insights principais na tela atual.',
      [{ text: 'OK' }]
    );
  };

  const saveToProfile = async () => {
    try {
      await api.post('/profile/save-tournament-result', {
        sessionId: result.sessionId,
        category,
        championId: result.championId
      });
      
      Alert.alert(
        'Salvo!',
        'Resultado salvo no seu perfil de estilo.',
        [{ text: 'OK' }]
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save to profile:', error);
      Alert.alert('Erro', 'Não foi possível salvar no perfil');
    }
  };

  // =====================================================
  // RENDER METHODS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('TournamentMenu')}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Resultado do Torneio</Text>
      
      <TouchableOpacity
        style={styles.shareButton}
        onPress={shareResult}
        disabled={shareLoading}
      >
        {shareLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="share" size={24} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPodium = () => {
    if (!championImage) return null;

    return (
      <Animated.View
        style={[
          styles.podiumContainer,
          {
            opacity: podiumAnim,
            transform: [
              {
                translateY: podiumAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
          style={styles.podiumGradient}
        >
          {/* Champion */}
          <View style={styles.championContainer}>
            <View style={styles.crownContainer}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
            </View>
            
            <View style={styles.championImageContainer}>
              <Image
                source={{ uri: championImage.thumbnailUrl || championImage.imageUrl }}
                style={styles.championImage}
                resizeMode="cover"
              />
              <View style={styles.championBadge}>
                <Text style={styles.championBadgeText}>1º</Text>
              </View>
            </View>
            
            <Text style={styles.championTitle} numberOfLines={2}>
              {championImage.title}
            </Text>
            
            <View style={styles.championStats}>
              <View style={styles.statBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.statText}>
                  {championImage.winRate.toFixed(0)}% vitórias
                </Text>
              </View>
            </View>
          </View>

          {/* Finalist */}
          {finalistImage && (
            <View style={styles.finalistContainer}>
              <View style={styles.finalistImageContainer}>
                <Image
                  source={{ uri: finalistImage.thumbnailUrl || finalistImage.imageUrl }}
                  style={styles.finalistImage}
                  resizeMode="cover"
                />
                <View style={styles.finalistBadge}>
                  <Text style={styles.finalistBadgeText}>2º</Text>
                </View>
              </View>
              
              <Text style={styles.finalistTitle} numberOfLines={2}>
                {finalistImage.title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderStats = () => (
    <Animated.View
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.sectionTitle}>Sua Performance</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
          </View>
          <Text style={styles.statNumber}>{result.totalChoicesMade}</Text>
          <Text style={styles.statLabel}>Escolhas</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="time" size={24} color="white" />
          </View>
          <Text style={styles.statNumber}>
            {result.decisionSpeedAvg.toFixed(1)}s
          </Text>
          <Text style={styles.statLabel}>Tempo Médio</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="trending-up" size={24} color="white" />
          </View>
          <Text style={styles.statNumber}>
            {result.consistencyScore.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Consistência</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E91E63' }]}>
            <Ionicons name="heart" size={24} color="white" />
          </View>
          <Text style={styles.statNumber}>
            {result.preferenceStrength.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Força Pref.</Text>
        </View>
      </View>

      {stats && (
        <View style={styles.sessionStats}>
          <Text style={styles.sessionStatsTitle}>Estatísticas da Sessão</Text>
          
          <View style={styles.sessionStatsRow}>
            <View style={styles.sessionStatItem}>
              <Ionicons name="flash" size={16} color="#FFD700" />
              <Text style={styles.sessionStatText}>
                Streak: {stats.streak}
              </Text>
            </View>
            
            <View style={styles.sessionStatItem}>
              <Ionicons name="rocket" size={16} color="#4CAF50" />
              <Text style={styles.sessionStatText}>
                Escolhas rápidas: {stats.fastChoices}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const renderInsights = () => (
    <Animated.View
      style={[
        styles.insightsContainer,
        {
          opacity: insightsAnim,
          transform: [
            {
              translateY: insightsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }
          ]
        }
      ]}
    >
      <Text style={styles.sectionTitle}>Seus Insights de Estilo</Text>
      
      {result.styleProfile && (
        <View style={styles.styleProfileCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.profileGradient}
          >
            <View style={styles.profileHeader}>
              <Ionicons name="person-circle" size={32} color="white" />
              <Text style={styles.profileTitle}>Perfil de Estilo</Text>
            </View>
            
            <View style={styles.profileContent}>
              {result.styleProfile.speed_preference && (
                <View style={styles.profileItem}>
                  <Ionicons name="timer" size={16} color="white" />
                  <Text style={styles.profileText}>
                    Estilo de decisão: {
                      result.styleProfile.speed_preference === 'fast' ? 'Rápido e intuitivo' :
                      result.styleProfile.speed_preference === 'moderate' ? 'Equilibrado' :
                      'Thoughtful e cuidadoso'
                    }
                  </Text>
                </View>
              )}
              
              {result.styleProfile.preference_clarity && (
                <View style={styles.profileItem}>
                  <Ionicons name="eye" size={16} color="white" />
                  <Text style={styles.profileText}>
                    Clareza de preferência: {(result.styleProfile.preference_clarity * 100).toFixed(0)}%
                  </Text>
                </View>
              )}
              
              {result.styleProfile.dominant_colors && result.styleProfile.dominant_colors.length > 0 && (
                <View style={styles.profileItem}>
                  <Ionicons name="color-palette" size={16} color="white" />
                  <Text style={styles.profileText}>
                    Cores dominantes: {result.styleProfile.dominant_colors.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      {result.insights && result.insights.length > 0 && (
        <View style={styles.insightsList}>
          {result.insights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recomendações Personalizadas</Text>
          
          {result.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="star" size={18} color="#FFD700" />
              </View>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );

  const renderTopChoices = () => {
    if (topImages.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.topChoicesContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.sectionTitle}>Suas Top Escolhas</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topChoicesList}
        >
          {topImages.map((image, index) => (
            <View key={image.id} style={styles.topChoiceCard}>
              <View style={styles.topChoiceRank}>
                <Text style={styles.topChoiceRankText}>{index + 3}</Text>
              </View>
              
              <Image
                source={{ uri: image.thumbnailUrl || image.imageUrl }}
                style={styles.topChoiceImage}
                resizeMode="cover"
              />
              
              <Text style={styles.topChoiceTitle} numberOfLines={2}>
                {image.title}
              </Text>
              
              <View style={styles.topChoiceWinRate}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.topChoiceWinRateText}>
                  {image.winRate.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton]}
        onPress={startNewTournament}
      >
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.actionButtonText}>Novo Torneio</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={saveToProfile}
      >
        <Ionicons name="bookmark" size={20} color="#667eea" />
        <Text style={[styles.actionButtonText, { color: '#667eea' }]}>
          Salvar no Perfil
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.tertiaryButton]}
        onPress={viewDetailedInsights}
      >
        <Ionicons name="analytics" size={20} color="#FF6B6B" />
        <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
          Ver Detalhes
        </Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Carregando resultados...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Category and completion message */}
            <View style={styles.completionMessage}>
              <Text style={styles.completionTitle}>🎉 Torneio Concluído!</Text>
              <Text style={styles.completionSubtitle}>
                {CATEGORY_TRANSLATIONS[category as keyof typeof CATEGORY_TRANSLATIONS] || category}
              </Text>
              <Text style={styles.completionDescription}>
                Você descobriu suas preferências em {result.totalChoicesMade} escolhas
              </Text>
            </View>

            {/* Podium with champion and finalist */}
            {renderPodium()}

            {/* Performance stats */}
            {renderStats()}

            {/* Top choices gallery */}
            {renderTopChoices()}

            {/* Insights and recommendations */}
            {renderInsights()}

            {/* Action buttons */}
            {renderActionButtons()}
          </Animated.View>
        </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  completionMessage: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  podiumContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  podiumGradient: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 20,
  },
  championContainer: {
    alignItems: 'center',
    flex: 1,
  },
  crownContainer: {
    marginBottom: 10,
  },
  championImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  championImage: {
    width: CHAMPION_SIZE,
    height: CHAMPION_SIZE,
    borderRadius: CHAMPION_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  championBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  championBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  championTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  championStats: {
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  finalistContainer: {
    alignItems: 'center',
    flex: 0.8,
    marginBottom: 20,
  },
  finalistImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  finalistImage: {
    width: FINALIST_SIZE,
    height: FINALIST_SIZE,
    borderRadius: FINALIST_SIZE / 2,
    borderWidth: 3,
    borderColor: '#C0C0C0',
  },
  finalistBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#C0C0C0',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  finalistBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
  },
  finalistTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    fontWeight: '500',
    textAlign: 'center',
  },
  sessionStats: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  sessionStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  sessionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionStatText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  topChoicesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  topChoicesList: {
    paddingVertical: 8,
  },
  topChoiceCard: {
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  topChoiceRank: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  topChoiceRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  topChoiceImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  topChoiceTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  topChoiceWinRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  topChoiceWinRateText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  styleProfileCard: {
    marginBottom: 20,
  },
  profileGradient: {
    borderRadius: 16,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  profileContent: {
    gap: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  insightsList: {
    gap: 12,
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIcon: {
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    fontWeight: '500',
  },
  recommendationsContainer: {
    marginTop: 20,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  recommendationIcon: {
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  secondaryButton: {
    backgroundColor: 'white',
  },
  tertiaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
});

export default TournamentResultScreen;