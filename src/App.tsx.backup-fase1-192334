// src/App.tsx - Versão minimalista para integração incremental
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import { useAuth } from './hooks/useAuth';

// ⚠️  TELAS TEMPORARIAMENTE DESABILITADAS
// import ProfileScreen from './screens/ProfileScreen';
// import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
// import MatchAreaScreen from './screens/MatchAreaScreen';
// import ChatScreen from './screens/ChatScreen';
// import VendorScreen from './screens/VendorScreen';
// import SettingsScreen from './screens/SettingsScreen';
// import BottomNavbar from './components/navigation/BottomNavbar';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            {/* ✅ FASE 1: APENAS LOGIN */}
            <Route path="/login" element={<LoginScreen />} />
            
            {/* ⚠️  ROTAS TEMPORARIAMENTE DESABILITADAS */}
            {/* 
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/style-adjustment" element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>} />
            <Route path="/match-area" element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
            <Route path="/vendor" element={<ProtectedRoute><VendorScreen /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
            */}
            
            {/* Rota padrão */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        
        {/* ⚠️  NAVEGAÇÃO TEMPORARIAMENTE DESABILITADA */}
        {/* {isAuthenticated && <BottomNavbar />} */}
      </div>
    </div>
  );
};

export default App;
