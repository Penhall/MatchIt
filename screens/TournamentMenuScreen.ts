// screens/TournamentMenuScreen.tsx - Menu completo de seleção de categorias de torneio
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface TournamentCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageCount: number;
  approvedCount: number;
  pendingCount: number;
  color: string;
  icon: string;
  available: boolean;
  lastPlayed?: string;
  averageCompletionTime?: number;
  popularityScore?: number;
  userStats?: {
    completedTournaments: number;
    lastResult?: string;
    winRate?: number;
    personalBest?: number;
  };
}

interface TournamentSession {
  id: string;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  progressPercentage: number;
  choicesMade: number;
  totalChoices: number;
  lastActivity: string;
}

interface UserTournamentStats {
  totalTournaments: number;
  completedTournaments: number;
  averageCompletionTime: number;
  favoriteCategory: string;
  totalChoicesMade: number;
  currentStreak: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const TOURNAMENT_CATEGORIES: TournamentCategory[] = [
  { 
    id: 'cores', 
    name: 'cores', 
    displayName: 'Cores', 
    description: 'Descubra suas paletas e combinações de cores favoritas',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#FF6B6B', 
    icon: 'color-palette',
    available: true
  },
  { 
    id: 'estilos', 
    name: 'estilos', 
    displayName: 'Estilos', 
    description: 'Explore diferentes estilos de moda e encontre o seu',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#4ECDC4', 
    icon: 'shirt',
    available: true
  },
  { 
    id: 'calcados', 
    name: 'calcados', 
    displayName: 'Calçados', 
    description: 'Sapatos, tênis, sandálias - qual combina com você?',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#45B7D1', 
    icon: 'footsteps',
    available: true
  },
  { 
    id: 'acessorios', 
    name: 'acessorios', 
    displayName: 'Acessórios', 
    description: 'Bolsas, joias e acessórios que definem seu estilo',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#96CEB4', 
    icon: 'diamond',
    available: true
  },
  { 
    id: 'texturas', 
    name: 'texturas', 
    displayName: 'Texturas', 
    description: 'Tecidos e texturas que atraem seu olhar',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#FECA57', 
    icon: 'layers',
    available: true
  },
  { 
    id: 'roupas_casuais', 
    name: 'roupas_casuais', 
    displayName: 'Roupas Casuais', 
    description: 'Looks confortáveis para o dia a dia',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#FF9FF3', 
    icon: 'cafe',
    available: true
  },
  { 
    id: 'roupas_formais', 
    name: 'roupas_formais', 
    displayName: 'Roupas Formais', 
    description: 'Elegância e sofisticação para ocasiões especiais',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#54A0FF', 
    icon: 'business',
    available: true
  },
  { 
    id: 'roupas_festa', 
    name: 'roupas_festa', 
    displayName: 'Roupas de Festa', 
    description: 'Looks deslumbrantes para festas e eventos',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#5F27CD', 
    icon: 'sparkles',
    available: true
  },
  { 
    id: 'joias', 
    name: 'joias', 
    displayName: 'Joias', 
    description: 'Anéis, colares e brincos que completam o visual',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#FFD700', 
    icon: 'diamond-outline',
    available: true
  },
  { 
    id: 'bolsas', 
    name: 'bolsas', 
    displayName: 'Bolsas', 
    description: 'Bolsas e carteiras para cada ocasião',
    imageCount: 0, 
    approvedCount: 0, 
    pendingCount: 0, 
    color: '#FF6348', 
    icon: 'bag',
    available: true
  }
];

const TOURNAMENT_SIZES = [
  { value: 8, label: 'Rápido (8)', duration: '3-5 min', description: 'Decisão rápida' },
  { value: 16, label: 'Padrão (16)', duration: '5-8 min', description: 'Recomendado' },
  { value: 32, label: 'Longo (32)', duration: '10-15 min', description: 'Análise profunda' },
  { value: 64, label: 'Épico (64)', duration: '20-30 min', description: 'Exploração máxima' }
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export const TournamentMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getCategories, getActiveSessions, getUserStats } = useTournament();

  // Core states
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [activeSessions, setActiveSessions] = useState<TournamentSession[]>([]);
  const [userStats, setUserStats] = useState<UserTournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [selectedSize, setSelectedSize] = useState(16);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Animation states
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // =====================================================
  // LIFECYCLE EFFECTS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadCategories(),
        loadActiveSessions(),
        loadUserStats()
      ]);

    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar torneios');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Mock implementation - replace with actual API call
      const mockCategories = TOURNAMENT_CATEGORIES.map((cat, index) => ({
        ...cat,
        imageCount: Math.floor(Math.random() * 200) + 50,
        approvedCount: Math.floor(Math.random() * 150) + 40,
        pendingCount: Math.floor(Math.random() * 10) + 1,
        available: Math.random() > 0.1, // 90% chance to be available
        popularityScore: Math.random() * 100,
        averageCompletionTime: Math.floor(Math.random() * 10) + 5,
        lastPlayed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        userStats: {
          completedTournaments: Math.floor(Math.random() * 20),
          lastResult: Math.random() > 0.5 ? 'winner' : 'finalist',
          winRate: Math.random() * 100,
          personalBest: Math.floor(Math.random() * 300) + 180 // seconds
        }
      }));

      setCategories(mockCategories);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      throw error;
    }
  };

  const loadActiveSessions = async () => {
    try {
      // Mock implementation - replace with actual API call
      const mockSessions: TournamentSession[] = Math.random() > 0.7 ? [
        {
          id: 'session_1',
          category: 'estilos',
          status: 'active',
          progressPercentage: 65,
          choicesMade: 10,
          totalChoices: 15,
          lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ] : [];

      setActiveSessions(mockSessions);
    } catch (error) {
      console.error('❌ Erro ao carregar sessões ativas:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Mock implementation - replace with actual API call
      const mockStats: UserTournamentStats = {
        totalTournaments: 47,
        completedTournaments: 42,
        averageCompletionTime: 7.5,
        favoriteCategory: 'estilos',
        totalChoicesMade: 635,
        currentStreak: 5,
        level: 12,
        experience: 2840,
        nextLevelExp: 3000
      };

      setUserStats(mockStats);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // =====================================================
  // TOURNAMENT ACTIONS
  // =====================================================

  const handleStartTournament = async (category: string, tournamentSize: number = selectedSize) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      navigation.navigate('Tournament', { 
        category,
        tournamentSize 
      });

    } catch (error: any) {
      console.error('❌ Erro ao iniciar torneio:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível iniciar o torneio. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResumeTournament = (session: TournamentSession) => {
    Alert.alert(
      'Retomar Torneio',
      `Você tem um torneio de ${session.category} em andamento (${session.progressPercentage.toFixed(0)}% concluído). Deseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Retomar', 
          onPress: () => {
            navigation.navigate('Tournament', { 
              category: session.category,
              sessionId: session.id
            });
          }
        }
      ]
    );
  };

  const handleCategoryPress = (category: TournamentCategory) => {
    if (!category.available) {
      Alert.alert(
        'Categoria Indisponível',
        'Esta categoria não possui imagens suficientes para um torneio. Tente novamente mais tarde.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (category.approvedCount < 8) {
      Alert.alert(
        'Categoria em Preparação',
        'Esta categoria ainda está sendo preparada. Volte em breve!',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedCategory(category.name);
    setShowSizeSelector(true);
  };

  const handleTournamentSizeSelection = () => {
    if (selectedCategory) {
      setShowSizeSelector(false);
      setTimeout(() => {
        handleStartTournament(selectedCategory, selectedSize);
        setSelectedCategory(null);
      }, 300);
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Torneios de Estilo</Text>
        <Text style={styles.headerSubtitle}>Descubra suas preferências</Text>
      </View>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('TournamentHistory')}
      >
        <Ionicons name="time" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderUserStats = () => {
    if (!userStats) return null;

    const experienceProgress = (userStats.experience / userStats.nextLevelExp) * 100;

    return (
      <Animated.View 
        style={[
          styles.userStatsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.userStatsGradient}
        >
          <View style={styles.userStatsHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Nível {userStats.level}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#FF6B6B" />
              <Text style={styles.streakText}>{userStats.currentStreak}</Text>
            </View>
          </View>

          <View style={styles.experienceBar}>
            <View style={styles.experienceBarBackground}>
              <View 
                style={[
                  styles.experienceBarFill, 
                  { width: `${experienceProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.experienceText}>
              {userStats.experience} / {userStats.nextLevelExp} XP
            </Text>
          </View>

          <View style={styles.userStatsGrid}>
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>{userStats.completedTournaments}</Text>
              <Text style={styles.userStatLabel}>Concluídos</Text>
            </View>
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>{userStats.averageCompletionTime.toFixed(1)}min</Text>
              <Text style={styles.userStatLabel}>Tempo Médio</Text>
            </View>
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>{userStats.totalChoicesMade}</Text>
              <Text style={styles.userStatLabel}>Escolhas</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderActiveSessions = () => {
    if (activeSessions.length === 0) return null;

    return (
      <View style={styles.activeSessionsContainer}>
        <Text style={styles.sectionTitle}>Torneios em Andamento</Text>
        
        {activeSessions.map(session => {
          const category = categories.find(c => c.name === session.category);
          if (!category) return null;

          return (
            <TouchableOpacity
              key={session.id}
              style={styles.activeSessionCard}
              onPress={() => handleResumeTournament(session)}
            >
              <LinearGradient
                colors={[category.color, `${category.color}DD`]}
                style={styles.activeSessionGradient}
              >
                <View style={styles.activeSessionHeader}>
                  <Ionicons name={category.icon as any} size={24} color="#fff" />
                  <Text style={styles.activeSessionTitle}>{category.displayName}</Text>
                  <Ionicons name="play-circle" size={24} color="#fff" />
                </View>
                
                <View style={styles.activeSessionProgress}>
                  <View style={styles.activeSessionProgressBar}>
                    <View 
                      style={[
                        styles.activeSessionProgressFill,
                        { width: `${session.progressPercentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.activeSessionProgressText}>
                    {session.progressPercentage.toFixed(0)}% completo
                  </Text>
                </View>
                
                <Text style={styles.activeSessionDetails}>
                  {session.choicesMade} de {session.totalChoices} escolhas
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderCategoryCard = (category: TournamentCategory, index: number) => {
    const isUnavailable = !category.available || category.approvedCount < 8;
    
    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 + (index * 10)],
                extrapolate: 'clamp'
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryCardButton,
            isUnavailable && styles.categoryCardDisabled
          ]}
          onPress={() => handleCategoryPress(category)}
          disabled={isUnavailable}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isUnavailable ? ['#ccc', '#aaa'] : [category.color, `${category.color}DD`]}
            style={styles.categoryCardGradient}
          >
            {/* Header */}
            <View style={styles.categoryCardHeader}>
              <Ionicons 
                name={category.icon as any} 
                size={32} 
                color={isUnavailable ? '#999' : '#fff'} 
              />
              <View style={styles.categoryCardTitleContainer}>
                <Text style={[
                  styles.categoryCardTitle,
                  isUnavailable && styles.categoryCardTitleDisabled
                ]}>
                  {category.displayName}
                </Text>
                {category.userStats && category.userStats.completedTournaments > 0 && (
                  <View style={styles.categoryCardBadge}>
                    <Ionicons name="trophy" size={12} color="#FFD700" />
                    <Text style={styles.categoryCardBadgeText}>
                      {category.userStats.completedTournaments}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <Text style={[
              styles.categoryCardDescription,
              isUnavailable && styles.categoryCardDescriptionDisabled
            ]}>
              {category.description}
            </Text>

            {/* Stats */}
            <View style={styles.categoryCardStats}>
              <View style={styles.categoryCardStat}>
                <Ionicons 
                  name="images" 
                  size={14} 
                  color={isUnavailable ? '#999' : 'rgba(255,255,255,0.8)'} 
                />
                <Text style={[
                  styles.categoryCardStatText,
                  isUnavailable && styles.categoryCardStatTextDisabled
                ]}>
                  {category.approvedCount} imagens
                </Text>
              </View>
              
              {category.averageCompletionTime && (
                <View style={styles.categoryCardStat}>
                  <Ionicons 
                    name="time" 
                    size={14} 
                    color={isUnavailable ? '#999' : 'rgba(255,255,255,0.8)'} 
                  />
                  <Text style={[
                    styles.categoryCardStatText,
                    isUnavailable && styles.categoryCardStatTextDisabled
                  ]}>
                    ~{category.averageCompletionTime}min
                  </Text>
                </View>
              )}
            </View>

            {/* Last played info */}
            {category.lastPlayed && (
              <View style={styles.categoryCardLastPlayed}>
                <Text style={styles.categoryCardLastPlayedText}>
                  Jogado {formatLastPlayed(category.lastPlayed)}
                </Text>
              </View>
            )}

            {/* Status indicator */}
            {isUnavailable && (
              <View style={styles.categoryCardUnavailable}>
                <Ionicons name="lock-closed" size={16} color="#999" />
                <Text style={styles.categoryCardUnavailableText}>
                  {category.approvedCount < 8 ? 'Em breve' : 'Indisponível'}
                </Text>
              </View>
            )}

            {/* Popularity indicator */}
            {!isUnavailable && category.popularityScore && category.popularityScore > 80 && (
              <View style={styles.categoryCardPopular}>
                <Ionicons name="flame" size={12} color="#FF6B6B" />
                <Text style={styles.categoryCardPopularText}>Popular</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTournamentSizeSelector = () => (
    <Modal
      visible={showSizeSelector}
      animationType="slide"
      transparent
      onRequestClose={() => setShowSizeSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sizeModal}>
          <Text style={styles.sizeModalTitle}>Escolha o Tamanho do Torneio</Text>
          <Text style={styles.sizeModalSubtitle}>
            Quanto maior o torneio, mais precisa será a análise das suas preferências
          </Text>
          
          <View style={styles.sizeOptions}>
            {TOURNAMENT_SIZES.map(size => (
              <TouchableOpacity
                key={size.value}
                style={[
                  styles.sizeOption,
                  selectedSize === size.value && styles.selectedSizeOption
                ]}
                onPress={() => setSelectedSize(size.value)}
              >
                <View style={styles.sizeOptionHeader}>
                  <Text style={[
                    styles.sizeOptionTitle,
                    selectedSize === size.value && styles.selectedSizeOptionTitle
                  ]}>
                    {size.label}
                  </Text>
                  <Text style={[
                    styles.sizeOptionDuration,
                    selectedSize === size.value && styles.selectedSizeOptionDuration
                  ]}>
                    {size.duration}
                  </Text>
                </View>
                <Text style={[
                  styles.sizeOptionDescription,
                  selectedSize === size.value && styles.selectedSizeOptionDescription
                ]}>
                  {size.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.sizeModalActions}>
            <TouchableOpacity
              style={styles.sizeModalCancelButton}
              onPress={() => setShowSizeSelector(false)}
            >
              <Text style={styles.sizeModalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sizeModalStartButton}
              onPress={handleTournamentSizeSelection}
            >
              <Text style={styles.sizeModalStartButtonText}>Começar Torneio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const formatLastPlayed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'há poucos minutos';
    if (diffInHours < 24) return `há ${Math.floor(diffInHours)} horas`;
    if (diffInHours < 48) return 'ontem';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays} dias`;
    
    return `há ${Math.floor(diffInDays / 7)} semanas`;
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Carregando torneios...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          {renderHeader()}
          
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadInitialData}
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
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {renderHeader()}
        
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderUserStats()}
          {renderActiveSessions()}
          
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Escolha uma Categoria</Text>
            <Text style={styles.sectionSubtitle}>
              Cada categoria revelará diferentes aspectos do seu estilo
            </Text>
            
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => renderCategoryCard(category, index))}
            </View>
          </View>
        </ScrollView>
        
        {renderTournamentSizeSelector()}
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
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
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
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content styles
  content: {
    flex: 1,
  },

  // User stats styles
  userStatsContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 15,
    overflow: 'hidden',
  },
  userStatsGradient: {
    padding: 20,
  },
  userStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  experienceBar: {
    marginBottom: 20,
  },
  experienceBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  experienceBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  experienceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  userStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Active sessions styles
  activeSessionsContainer: {
    marginBottom: 25,
  },
  activeSessionCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeSessionGradient: {
    padding: 15,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeSessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  activeSessionProgress: {
    marginBottom: 8,
  },
  activeSessionProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  activeSessionProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  activeSessionProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activeSessionDetails: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Section styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  // Categories styles
  categoriesContainer: {
    paddingBottom: 30,
  },
  categoriesGrid: {
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  categoryCardButton: {
    width: '100%',
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  categoryCardGradient: {
    padding: 20,
    position: 'relative',
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryCardTitleContainer: {
    flex: 1,
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  categoryCardTitleDisabled: {
    color: '#999',
  },
  categoryCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryCardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  categoryCardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
    lineHeight: 20,
  },
  categoryCardDescriptionDisabled: {
    color: '#999',
  },
  categoryCardStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  categoryCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryCardStatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  categoryCardStatTextDisabled: {
    color: '#999',
  },
  categoryCardLastPlayed: {
    marginTop: 8,
  },
  categoryCardLastPlayedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  categoryCardUnavailable: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryCardUnavailableText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
  },
  categoryCardPopular: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryCardPopularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },

  // Size selector modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  sizeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  sizeModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  sizeOptions: {
    gap: 12,
    marginBottom: 25,
  },
  sizeOption: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 15,
  },
  selectedSizeOption: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  sizeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedSizeOptionTitle: {
    color: '#667eea',
  },
  sizeOptionDuration: {
    fontSize: 14,
    color: '#666',
  },
  selectedSizeOptionDuration: {
    color: '#667eea',
  },
  sizeOptionDescription: {
    fontSize: 14,
    color: '#999',
  },
  selectedSizeOptionDescription: {
    color: '#667eea',
  },
  sizeModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeModalCancelButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  sizeModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sizeModalStartButton: {
    flex: 2,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#667eea',
  },
  sizeModalStartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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

export default TournamentMenuScreen;