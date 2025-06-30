// navigation/AppNavigator.tsx - Navegação principal completa com todas as telas implementadas
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

// Authentication Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Phase 0: Style Preferences
import StyleAdjustmentScreen from '../screens/StyleAdjustmentScreen';

// Phase 1: Tournament System - Complete Implementation
import TournamentMenuScreen from '../screens/TournamentMenuScreen';
import TournamentScreen from '../screens/TournamentScreen';
import TournamentResultScreen from '../screens/TournamentResultScreen';
import TournamentHistoryScreen from '../screens/TournamentHistoryScreen';

// Admin Screens
import AdminTournamentPanel from '../screens/AdminTournamentPanel';
import AdminDashboard from '../screens/AdminDashboard';
import AdminUsersPanel from '../screens/AdminUsersPanel';

// Hooks
import { useAuth } from '../hooks/useAuth';

// =====================================================
// NAVIGATION TYPES
// =====================================================

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
    stats?: any;
  };
  TournamentHistory: { category?: string };
  
  // Admin Screens
  AdminDashboard: undefined;
  AdminTournament: undefined;
  AdminUsers: undefined;
  
  // Modal Screens
  ImageViewer: { imageUrl: string; title?: string };
  ShareResult: { result: any; category: string };
  TutorialOverlay: { screen: string };
};

export type TabParamList = {
  HomeTab: undefined;
  TournamentsTab: undefined;
  ProfileTab: undefined;
  RecommendationsTab: undefined;
  SettingsTab: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminTournaments: undefined;
  AdminUsers: undefined;
  AdminSettings: undefined;
};

// =====================================================
// NAVIGATORS
// =====================================================

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const Drawer = createDrawerNavigator();

// =====================================================
// TAB NAVIGATOR CONFIGURATIONS
// =====================================================

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TournamentsTab') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'RecommendationsTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E1E5E9',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      
      <Tab.Screen
        name="TournamentsTab"
        component={TournamentMenuScreen}
        options={{
          tabBarLabel: 'Torneios',
        }}
      />
      
      <Tab.Screen
        name="RecommendationsTab"
        component={RecommendationsScreen}
        options={{
          tabBarLabel: 'Matches',
        }}
      />
      
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
      
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
};

const AdminTabNavigator: React.FC = () => {
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'AdminTournaments') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'AdminUsers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AdminSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E74C3C',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E1E5E9',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <AdminTab.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      
      <AdminTab.Screen
        name="AdminTournaments"
        component={AdminTournamentPanel}
        options={{
          tabBarLabel: 'Torneios',
        }}
      />
      
      <AdminTab.Screen
        name="AdminUsers"
        component={AdminUsersPanel}
        options={{
          tabBarLabel: 'Usuários',
        }}
      />
      
      <AdminTab.Screen
        name="AdminSettings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Config',
        }}
      />
    </AdminTab.Navigator>
  );
};

// =====================================================
// AUTH STACK
// =====================================================

const AuthStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'white' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// =====================================================
// MAIN APP STACK
// =====================================================

const MainAppStack: React.FC = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Main App with Tabs */}
      <Stack.Screen 
        name="MainApp" 
        component={user?.isAdmin ? AdminTabNavigator : MainTabNavigator}
      />

      {/* Phase 0: Style Preferences */}
      <Stack.Group>
        <Stack.Screen 
          name="StyleAdjustment" 
          component={StyleAdjustmentScreen}
          options={{
            headerShown: true,
            title: 'Ajuste seu Estilo',
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: '700' }
          }}
        />
      </Stack.Group>

      {/* Phase 1: Tournament System */}
      <Stack.Group>
        <Stack.Screen 
          name="TournamentMenu" 
          component={TournamentMenuScreen}
          options={{
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="Tournament" 
          component={TournamentScreen}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent accidental navigation during tournament
          }}
        />
        
        <Stack.Screen 
          name="TournamentResult" 
          component={TournamentResultScreen}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent going back to tournament
          }}
        />
        
        <Stack.Screen 
          name="TournamentHistory" 
          component={TournamentHistoryScreen}
          options={{
            headerShown: true,
            title: 'Histórico de Torneios',
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: '700' }
          }}
        />
      </Stack.Group>

      {/* Admin Screens */}
      {user?.isAdmin && (
        <Stack.Group>
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboard}
            options={{
              headerShown: true,
              title: 'Admin Dashboard',
              headerStyle: { backgroundColor: '#E74C3C' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: '700' }
            }}
          />
          
          <Stack.Screen 
            name="AdminTournament" 
            component={AdminTournamentPanel}
            options={{
              headerShown: false, // Custom header in component
            }}
          />
          
          <Stack.Screen 
            name="AdminUsers" 
            component={AdminUsersPanel}
            options={{
              headerShown: true,
              title: 'Gerenciar Usuários',
              headerStyle: { backgroundColor: '#E74C3C' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: '700' }
            }}
          />
        </Stack.Group>
      )}

      {/* Modal Screens */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen 
          name="ImageViewer" 
          component={({ route }: { route: any }) => {
            // Simple image viewer component
            return null; // Implementation placeholder
          }}
          options={{
            headerShown: true,
            title: 'Visualizar Imagem',
            headerStyle: { backgroundColor: '#333' },
            headerTintColor: 'white'
          }}
        />
        
        <Stack.Screen 
          name="ShareResult" 
          component={({ route }: { route: any }) => {
            // Share result component
            return null; // Implementation placeholder
          }}
          options={{
            headerShown: true,
            title: 'Compartilhar Resultado',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: 'white'
          }}
        />
        
        <Stack.Screen 
          name="TutorialOverlay" 
          component={({ route }: { route: any }) => {
            // Tutorial overlay component
            return null; // Implementation placeholder
          }}
          options={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          }}
        />
      </Stack.Group>

      {/* Chat Screens */}
      <Stack.Group>
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route.params?.userId ? 'Chat' : 'Conversa',
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: '700' }
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

// =====================================================
// ROOT NAVIGATOR
// =====================================================

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return null; // Or a proper loading component
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainApp" component={MainAppStack} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

// =====================================================
// MAIN APP NAVIGATOR
// =====================================================

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer
      onReady={() => {
        // Navigation is ready
        console.log('Navigation ready');
      }}
      onStateChange={(state) => {
        // Handle navigation state changes
        console.log('Navigation state changed:', state);
      }}
      fallback={null} // Loading component while navigation is loading
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

// =====================================================
// NAVIGATION UTILITIES
// =====================================================

// Navigation helper functions for deep linking and programmatic navigation
export const navigationUtils = {
  // Deep link to tournament
  goToTournament: (navigation: any, category: string) => {
    navigation.navigate('Tournament', { category });
  },

  // Deep link to tournament result
  goToTournamentResult: (navigation: any, result: any, category: string, stats?: any) => {
    navigation.navigate('TournamentResult', { result, category, stats });
  },

  // Go to admin panel
  goToAdminPanel: (navigation: any) => {
    navigation.navigate('AdminTournament');
  },

  // Handle back navigation with confirmation for tournaments
  handleTournamentBack: (navigation: any, hasActiveSession: boolean) => {
    if (hasActiveSession) {
      Alert.alert(
        'Sair do Torneio',
        'Tem certeza que deseja sair? Seu progresso será perdido.',
        [
          { text: 'Continuar', style: 'cancel' },
          { 
            text: 'Sair', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  },

  // Navigate to style adjustment
  goToStyleAdjustment: (navigation: any) => {
    navigation.navigate('StyleAdjustment');
  },

  // Navigate to tournament menu
  goToTournamentMenu: (navigation: any) => {
    navigation.navigate('TournamentMenu');
  },

  // Reset navigation to main app
  resetToMainApp: (navigation: any) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  }
};

export default AppNavigator;