// src/App.tsx - VERSÃO COMPLETA: Todas as telas habilitadas
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
import MatchAreaScreen from './screens/MatchAreaScreen';
import ChatScreen from './screens/ChatScreen';
import VendorScreen from './screens/VendorScreen';
import { useAuth } from './hooks/useAuth';
import { APP_ROUTES } from './constants';
import { View, Text } from './lib/react-native-web';
import BottomNavbar from './components/navigation/BottomNavbar';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#1a1a2e', 
      padding: 2 
    }}>
      <View style={{ 
        width: '100%', 
        maxWidth: 420, 
        height: 850, 
        backgroundColor: 'black', 
        borderRadius: 36, 
        shadowColor: '#00f7ff', 
        shadowOpacity: 0.3,
        shadowRadius: 20,
        overflow: 'hidden', 
        borderWidth: 2, 
        borderColor: 'rgba(0, 247, 255, 0.3)', 
        flexDirection: 'column', 
        position: 'relative' 
      }}>
        <View style={{ flexGrow: 1, overflowY: 'auto' }}>
          <Routes>
            {/* ✅ TELA PRINCIPAL */}
            <Route path="/" element={<HomeScreen />} />
            
            {/* ✅ LOGIN */}
            <Route path="/login" element={<LoginScreen />} />
            
            {/* ✅ PROFILE */}
            <Route 
              path="/profile" 
              element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} 
            />
            
            {/* ✅ SETTINGS */}
            <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
            
            {/* ✅ STYLE ADJUSTMENT */}
            <Route path="/style-adjustment" element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>} />
            
            {/* ✅ MATCH AREA */}
            <Route path="/match-area" element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>} />
            
            {/* ✅ CHAT */}
            <Route path="/chat/:chatId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
            
            {/* ✅ VENDOR */}
            <Route path="/vendor" element={<ProtectedRoute><VendorScreen /></ProtectedRoute>} />
            
            {/* Rota padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </View>
        
        {/* ✅ NAVEGAÇÃO HABILITADA */}
        {isAuthenticated && <BottomNavbar />}
      </View>
    </View>
  );
};

export default App;
