// screens/TournamentMenuScreen.tsx - Menu de seleção de categorias de torneio
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
  Alert
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
  };
}

interface ActiveSession {
  sessionId: string;
  category: string;
  progressPercentage: number;
  choicesMade: number;
  totalChoices: number;
  lastActivity: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const CATEGORY_GRADIENTS = {
  cores: ['#FF6B6B', '#FF8E53'],
  estilos: ['#4ECDC4', '#44A08D'],
  calcados: ['#45B7D1', '#96C93D'],
  acessorios: ['#96CEB4', '#FFECD2'],
  texturas: ['#FECA57', '#FF9F43'],
  roupas_casuais: ['#FF9FF3', '#F368E0'],
  roupas_formais: ['#54A0FF', '#2E86DE'],
  roupas_festa: ['#5F27CD', '#341F97'],
  joias: ['#FFD700', '#F39801'],
  bolsas: ['#FF6348', '#E55039']
};

const CATEGORY_IMAGES = {
  cores: require('../assets/categories/colors.jpg'),
  estilos: require('../assets/categories/styles.jpg'),
  calcados: require('../assets/categories/shoes.jpg'),
  acessorios: require('../assets/categories/accessories.jpg'),
  texturas: require('../assets/categories/textures.jpg'),
  roupas_casuais: require('../assets/categories/casual.jpg'),
  roupas_formais: require('../assets/categories/formal.jpg'),
  roupas_festa: require('../assets/categories/party.jpg'),
  joias: require('../assets/categories/jewelry.jpg'),
  bolsas: require('../assets/categories/bags.jpg')
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const TournamentMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    categories,
    loading,
    loadCategories,
    checkActiveSession,
    userStats,
    loadUserStats
  } = useTournament();

  // States
  const [categoriesList, setCategoriesList] = useState<TournamentCategory[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'popular' | 'new' | 'completed'>('all');

  // =====================================================
  // LIFECYCLE
  // =====================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkActiveSessions();
    }, [])
  );

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadUserStats(),
        checkActiveSessions()
      ]);
      updateCategoriesList();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Erro', 'Falha ao carregar dados. Tente novamente.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  const updateCategoriesList = () => {
    const categoriesArray = Object.values(categories).map(category => ({
      ...category,
      userStats: getUserStatsForCategory(category.id)
    }));

    // Apply filter
    let filteredCategories = categoriesArray;

    switch (selectedFilter) {
      case 'popular':
        filteredCategories = categoriesArray
          .filter(cat => cat.available)
          .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        break;
      
      case 'new':
        filteredCategories = categoriesArray
          .filter(cat => cat.available && (!cat.userStats || cat.userStats.completedTournaments === 0));
        break;
      
      case 'completed':
        filteredCategories = categoriesArray
          .filter(cat => cat.userStats && cat.userStats.completedTournaments > 0)
          .sort((a, b) => (b.userStats?.completedTournaments || 0) - (a.userStats?.completedTournaments || 0));
        break;
      
      default:
        filteredCategories = categoriesArray.filter(cat => cat.available);
    }

    setCategoriesList(filteredCategories);
  };

  const getUserStatsForCategory = (categoryId: string) => {
    if (!userStats) return undefined;

    return {
      completedTournaments: userStats.winRateByCategory[categoryId] ? 1 : 0, // Simplified
      winRate: userStats.winRateByCategory[categoryId] || 0,
      lastResult: userStats.lastPlayedCategory === categoryId ? 'recent' : undefined
    };
  };

  const checkActiveSessions = async () => {
    try {
      const sessionPromises = Object.keys(categories).map(async (categoryId) => {
        const session = await checkActiveSession(categoryId);
        return session ? {
          sessionId: session.id,
          category: categoryId,
          progressPercentage: session.progressPercentage,
          choicesMade: session.choicesMade,
          totalChoices: session.totalChoices,
          lastActivity: session.lastActivity
        } : null;
      });

      const sessions = await Promise.all(sessionPromises);
      const activeSessions = sessions.filter((session): session is ActiveSession => session !== null);
      setActiveSessions(activeSessions);
    } catch (error) {
      console.error('Failed to check active sessions:', error);
    }
  };

  // =====================================================
  // ACTIONS
  // =====================================================

  const startTournament = (categoryId: string) => {
    const category = categories[categoryId];
    
    if (!category?.available) {
      Alert.alert(
        'Categoria Indisponível',
        'Esta categoria ainda não tem imagens suficientes para um torneio.'
      );
      return;
    }

    if (category.approvedCount < 8) {
      Alert.alert(
        'Imagens Insuficientes',
        `Esta categoria precisa de pelo menos 8 imagens. Atualmente tem ${category.approvedCount}.`
      );
      return;
    }

    // Check for active session
    const activeSession = activeSessions.find(session => session.category === categoryId);
    
    if (activeSession) {
      Alert.alert(
        'Torneio em Andamento',
        `Você tem um torneio em progresso nesta categoria (${activeSession.progressPercentage.toFixed(0)}% completo). Deseja continuar ou começar um novo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar', 
            onPress: () => {
              navigation.navigate('Tournament', { category: categoryId });
            }
          },
          { 
            text: 'Novo Torneio', 
            style: 'destructive',
            onPress: () => {
              startNewTournament(categoryId);
            }
          }
        ]
      );
    } else {
      startNewTournament(categoryId);
    }
  };

  const startNewTournament = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Tournament', { category: categoryId });
  };

  const viewCategoryDetails = (categoryId: string) => {
    // Future implementation for category details
    Alert.alert(
      'Detalhes da Categoria',
      'Visualização detalhada da categoria estará disponível em breve!',
      [{ text: 'OK' }]
    );
  };

  // =====================================================
  // RENDER METHODS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Escolha um Torneio</Text>
        <Text style={styles.headerSubtitle}>Descubra suas preferências</Text>
      </View>
      
      {user?.isAdmin && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate('AdminTournament')}
        >
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStats = () => {
    if (!userStats) return null;

    return (
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#4ECDC4' }]}>
              <Ionicons name="trophy" size={20} color="white" />
              <Text style={styles.statNumber}>{userStats.completedTournaments}</Text>
              <Text style={styles.statLabel}>Concluídos</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="timer" size={20} color="white" />
              <Text style={styles.statNumber}>
                {userStats.averageChoiceTime.toFixed(1)}s
              </Text>
              <Text style={styles.statLabel}>Tempo Médio</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#FFD700' }]}>
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.statNumber}>
                {userStats.consistencyScore.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Consistência</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#9C88FF' }]}>
              <Ionicons name="flash" size={20} color="white" />
              <Text style={styles.statNumber}>{userStats.fastChoicesCount}</Text>
              <Text style={styles.statLabel}>Escolhas Rápidas</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderActiveSessions = () => {
    if (activeSessions.length === 0) return null;

    return (
      <View style={styles.activeSessionsContainer}>
        <Text style={styles.sectionTitle}>Torneios em Andamento</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.activeSessionsRow}>
            {activeSessions.map(session => {
              const category = categories[session.category];
              if (!category) return null;

              return (
                <TouchableOpacity
                  key={session.sessionId}
                  style={styles.activeSessionCard}
                  onPress={() => navigation.navigate('Tournament', { category: session.category })}
                >
                  <LinearGradient
                    colors={CATEGORY_GRADIENTS[session.category as keyof typeof CATEGORY_GRADIENTS] || ['#667eea', '#764ba2']}
                    style={styles.activeSessionGradient}
                  >
                    <View style={styles.activeSessionHeader}>
                      <Ionicons name={category.icon as any} size={24} color="white" />
                      <Text style={styles.activeSessionTitle}>{category.displayName}</Text>
                    </View>
                    
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${session.progressPercentage}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {session.progressPercentage.toFixed(0)}% concluído
                      </Text>
                    </View>
                    
                    <Text style={styles.activeSessionChoices}>
                      {session.choicesMade} de {session.totalChoices} escolhas
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filtersRow}>
          {[
            { key: 'all', label: 'Todas', icon: 'grid' },
            { key: 'popular', label: 'Populares', icon: 'trending-up' },
            { key: 'new', label: 'Novas', icon: 'sparkles' },
            { key: 'completed', label: 'Concluídas', icon: 'checkmark-circle' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => {
                setSelectedFilter(filter.key as any);
                setTimeout(updateCategoriesList, 100);
              }}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={selectedFilter === filter.key ? 'white' : '#666'} 
              />
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderCategoryCard = (category: TournamentCategory) => {
    const activeSession = activeSessions.find(session => session.category === category.id);
    const hasActiveSession = !!activeSession;
    const isAvailable = category.available && category.approvedCount >= 8;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryCard,
          !isAvailable && styles.categoryCardDisabled
        ]}
        onPress={() => isAvailable ? startTournament(category.id) : viewCategoryDetails(category.id)}
        onLongPress={() => viewCategoryDetails(category.id)}
        disabled={!isAvailable}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isAvailable 
            ? CATEGORY_GRADIENTS[category.id as keyof typeof CATEGORY_GRADIENTS] || ['#667eea', '#764ba2']
            : ['#CCCCCC', '#999999']
          }
          style={styles.categoryGradient}
        >
          {/* Background Image */}
          <Image
            source={CATEGORY_IMAGES[category.id as keyof typeof CATEGORY_IMAGES] || CATEGORY_IMAGES.cores}
            style={styles.categoryBackgroundImage}
            resizeMode="cover"
          />
          
          {/* Overlay */}
          <View style={styles.categoryOverlay} />
          
          {/* Content */}
          <View style={styles.categoryContent}>
            {/* Header */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <Ionicons name={category.icon as any} size={28} color="white" />
              </View>
              
              {hasActiveSession && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="play-circle" size={20} color="#4CAF50" />
                </View>
              )}
              
              {!isAvailable && (
                <View style={styles.unavailableIndicator}>
                  <Ionicons name="lock-closed" size={16} color="white" />
                </View>
              )}
            </View>
            
            {/* Title and Description */}
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.displayName}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
            </View>
            
            {/* Stats */}
            <View style={styles.categoryStats}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="images" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statValue}>{category.approvedCount}</Text>
                </View>
                
                {category.userStats && category.userStats.completedTournaments > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={14} color="#FFD700" />
                    <Text style={styles.statValue}>{category.userStats.completedTournaments}</Text>
                  </View>
                )}
                
                {category.userStats && category.userStats.winRate && (
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.statValue}>{category.userStats.winRate.toFixed(0)}%</Text>
                  </View>
                )}
              </View>
              
              {hasActiveSession && (
                <View style={styles.progressRow}>
                  <View style={styles.miniProgressBar}>
                    <View 
                      style={[
                        styles.miniProgressFill, 
                        { width: `${activeSession.progressPercentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {activeSession.progressPercentage.toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>Nenhuma categoria encontrada</Text>
      <Text style={styles.emptyDescription}>
        {selectedFilter === 'new' 
          ? 'Você já jogou em todas as categorias disponíveis!'
          : selectedFilter === 'completed'
          ? 'Você ainda não completou nenhum torneio.'
          : 'Tente mudar o filtro ou aguarde novas categorias.'
        }
      </Text>
      
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          setSelectedFilter('all');
          updateCategoriesList();
        }}
      >
        <Text style={styles.emptyButtonText}>Ver Todas as Categorias</Text>
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
            <Text style={styles.loadingText}>Carregando torneios...</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderStats()}
          {renderActiveSessions()}
          {renderFilters()}
          
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Categorias Disponíveis</Text>
            
            {categoriesList.length === 0 ? (
              renderEmptyState()
            ) : (
              <View style={styles.categoriesGrid}>
                {categoriesList.map(renderCategoryCard)}
              </View>
            )}
          </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  adminButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'white',
    marginTop: 2,
    fontWeight: '500',
  },
  activeSessionsContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  activeSessionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  activeSessionCard: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activeSessionGradient: {
    padding: 16,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  activeSessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  activeSessionChoices: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  filtersContainer: {
    paddingVertical: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  filterButtonTextActive: {
    color: '#333',
  },
  categoriesContainer: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  categoryGradient: {
    flex: 1,
    position: 'relative',
  },
  categoryBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  categoryContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  unavailableIndicator: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  categoryInfo: {
    flex: 1,
    marginVertical: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  categoryStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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

export default TournamentMenuScreen;