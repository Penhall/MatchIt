import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import MatchesScreen from './screens/MatchesScreen';
import BottomNavbar from './components/navigation/BottomNavbar';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = true; // Simulação
  const showNavbar = isAuthenticated && location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route 
              path="/profile" 
              element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/edit-profile" 
              element={isAuthenticated ? <EditProfileScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/matches" 
              element={isAuthenticated ? <MatchesScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/chat" 
              element={isAuthenticated ? <div className="p-8 text-white text-center">Chat em desenvolvimento...</div> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/profile" : "/login"} replace />} 
            />
          </Routes>
        </main>
        {showNavbar && <BottomNavbar />}
      </div>
    </div>
  );
};

export default App;
