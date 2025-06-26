// navigation/AppNavigator.tsx - Navegação principal atualizada com todas as telas
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// Screens - Authentication
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Screens - Main App
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Screens - Phase 0: Style Preferences
import StyleAdjustmentScreen from '../screens/StyleAdjustmentScreen';

// Screens - Phase 1: Tournament System
import TournamentMenuScreen from '../screens/TournamentMenuScreen';
import TournamentScreen from '../screens/TournamentScreen';
import TournamentResultScreen from '../screens/TournamentResultScreen';
import TournamentHistoryScreen from '../screens/TournamentHistoryScreen';

// Screens - Admin (Phase 1)
import AdminTournamentPanel from '../screens/AdminTournamentPanel';
import AdminDashboard from '../screens/AdminDashboard';

// Hooks
import { useAuth } from '../hooks/useAuth';

// Types
export type RootStackParamList = {
  // Auth Stack
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Main App
  MainApp: undefined;
  Home: undefined;
  Profile: undefined;
  Recommendations: undefined;
  Chat: { matchId?: string; userId?: string };
  Settings: undefined;
  
  // Phase 0: Style Preferences
  StyleAdjustment: undefined;
  
  // Phase 1: Tournament System
  TournamentMenu: undefined;
  Tournament: { category: string };
  TournamentResult: { 
    result: any; 
    category: string; 
  };
  TournamentHistory: { category?: string };
  
  // Admin
  AdminDashboard: undefined;
  AdminTournament: undefined;
};

export type TabParamList = {
  Home: undefined;
  Tournaments: undefined;
  Recommendations: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type DrawerParamList = {
  MainTabs: undefined;
  StyleAdjustment: undefined;
  TournamentHistory: undefined;
  Settings: undefined;
  AdminDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// =====================================================
// AUTH STACK - Telas de autenticação
// =====================================================

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F8F9FA' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// =====================================================
// TOURNAMENT STACK - Sistema de torneios (Fase 1)
// =====================================================

const TournamentStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F8F9FA' }
      }}
    >
      <Stack.Screen 
        name="TournamentMenu" 
        component={TournamentMenuScreen}
        options={{ title: 'Torneios' }}
      />
      <Stack.Screen 
        name="Tournament" 
        component={TournamentScreen}
        options={{ 
          title: 'Torneio',
          gestureEnabled: false // Prevenir swipe para sair do torneio
        }}
      />
      <Stack.Screen 
        name="TournamentResult" 
        component={TournamentResultScreen}
        options={{ 
          title: 'Resultado',
          gestureEnabled: false // Prevenir voltar por gesture
        }}
      />
    </Stack.Navigator>
  );
};

// =====================================================
// MAIN TABS - Navegação principal por abas
// =====================================================

const MainTabs = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tournaments':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Recommendations':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E1E5E9',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        },
        headerShown: false
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      
      <Tab.Screen 
        name="Tournaments" 
        component={TournamentStack}
        options={{ title: 'Torneios' }}
      />
      
      <Tab.Screen 
        name="Recommendations" 
        component={RecommendationsScreen}
        options={{ title: 'Matches' }}
      />
      
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

// =====================================================
// DRAWER NAVIGATION - Menu lateral
// =====================================================

const DrawerContent = () => {
  const { user } = useAuth();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: 'white',
          width: 280
        },
        drawerActiveTintColor: '#FF6B6B',
        drawerInactiveTintColor: '#666',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500'
        }
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{
          title: 'MatchIt',
          drawerLabel: 'Início',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerStyle: {
            backgroundColor: '#FF6B6B'
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20
          }
        }}
      />

      <Drawer.Screen 
        name="StyleAdjustment" 
        component={StyleAdjustmentScreen}
        options={{
          title: 'Preferências de Estilo',
          drawerLabel: 'Meu Estilo',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="color-palette-outline" size={size} color={color} />
          ),
          headerStyle: {
            backgroundColor: '#FF6B6B'
          },
          headerTintColor: 'white'
        }}
      />

      <Drawer.Screen 
        name="TournamentHistory" 
        component={TournamentHistoryScreen}
        options={{
          title: 'Histórico de Torneios',
          drawerLabel: 'Meus Torneios',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
          headerStyle: {
            backgroundColor: '#FF6B6B'
          },
          headerTintColor: 'white'
        }}
      />

      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          drawerLabel: 'Configurações',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerStyle: {
            backgroundColor: '#FF6B6B'
          },
          headerTintColor: 'white'
        }}
      />

      {/* Admin Dashboard - só aparece para admins */}
      {user?.isAdmin && (
        <Drawer.Screen 
          name="AdminDashboard" 
          component={AdminDashboard}
          options={{
            title: 'Dashboard Admin',
            drawerLabel: 'Admin',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shield-outline" size={size} color={color} />
            ),
            headerStyle: {
              backgroundColor: '#E74C3C'
            },
            headerTintColor: 'white'
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

// =====================================================
// MAIN APP NAVIGATOR
// =====================================================

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Você pode criar uma tela de loading aqui
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Stack de autenticação
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          // App principal com drawer navigation
          <>
            <Stack.Screen name="MainApp" component={DrawerContent} />
            
            {/* Modal Screens - aparecem sobre o app principal */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen 
                name="Tournament" 
                component={TournamentScreen}
                options={{
                  headerShown: true,
                  title: 'Torneio',
                  headerStyle: { backgroundColor: '#667eea' },
                  headerTintColor: 'white',
                  gestureEnabled: false
                }}
              />
              
              <Stack.Screen 
                name="TournamentResult" 
                component={TournamentResultScreen}
                options={{
                  headerShown: true,
                  title: 'Resultado',
                  headerStyle: { backgroundColor: '#667eea' },
                  headerTintColor: 'white',
                  gestureEnabled: false
                }}
              />

              {user?.isAdmin && (
                <Stack.Screen 
                  name="AdminTournament" 
                  component={AdminTournamentPanel}
                  options={{
                    headerShown: true,
                    title: 'Admin - Torneios',
                    headerStyle: { backgroundColor: '#E74C3C' },
                    headerTintColor: 'white'
                  }}
                />
              )}
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

// navigation/TournamentMenuScreen.tsx - Tela de menu de torneios
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTournament } from '../hooks/useTournament';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export const TournamentMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    categories,
    loading,
    loadCategories,
    checkActiveSession,
    currentSession
  } = useTournament();

  const [activeSessions, setActiveSessions] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadCategories();
    checkActiveSessions();
  }, []);

  const checkActiveSessions = async () => {
    const categoryKeys = Object.keys(categories);
    const sessionPromises = categoryKeys.map(async (key) => {
      const session = await checkActiveSession(key);
      return { key, hasActive: !!session };
    });

    const results = await Promise.all(sessionPromises);
    const sessionsMap: {[key: string]: boolean} = {};
    
    results.forEach(({ key, hasActive }) => {
      sessionsMap[key] = hasActive;
    });

    setActiveSessions(sessionsMap);
  };

  const startTournament = (categoryKey: string) => {
    navigation.navigate('Tournament', { category: categoryKey });
  };

  const renderCategoryCard = (categoryKey: string, category: any) => {
    const hasActiveSession = activeSessions[categoryKey];
    const isAvailable = category.available && category.imageCount >= 4;

    return (
      <TouchableOpacity
        key={categoryKey}
        style={[
          styles.categoryCard,
          !isAvailable && styles.categoryCardDisabled
        ]}
        onPress={() => isAvailable && startTournament(categoryKey)}
        disabled={!isAvailable}
      >
        <LinearGradient
          colors={isAvailable ? ['#667eea', '#764ba2'] : ['#95A5A6', '#7F8C8D']}
          style={styles.categoryGradient}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDescription} numberOfLines={2}>
              {category.description}
            </Text>
            
            <View style={styles.categoryStats}>
              <View style={styles.statItem}>
                <Ionicons name="images" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{category.imageCount || 0}</Text>
              </View>
              
              {hasActiveSession && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="play-circle" size={12} color="#FFD700" />
                  <Text style={styles.activeText}>Em andamento</Text>
                </View>
              )}
            </View>
          </View>

          {!isAvailable && (
            <View style={styles.disabledOverlay}>
              <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.5)" />
              <Text style={styles.disabledText}>
                {category.imageCount < 4 ? 'Poucas imagens' : 'Indisponível'}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escolha sua Categoria</Text>
        <Text style={styles.headerSubtitle}>
          Descubra suas preferências através de torneios visuais
        </Text>
      </View>

      {/* Categories Grid */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.categoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(categories).map(([key, category]) =>
          renderCategoryCard(key, category)
        )}
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('TournamentHistory')}
        >
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.historyButtonText}>Ver Histórico</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  categoriesContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: 160,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  categoryGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
  categoryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeText: {
    marginLeft: 4,
    fontSize: 8,
    color: '#FFD700',
    fontWeight: '600',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
  },
  historyButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

export default TournamentMenuScreen;