import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
import MatchAreaScreen from './screens/MatchAreaScreen';
import ChatScreen from './screens/ChatScreen';
import VendorScreen from './screens/VendorScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNavbar from './components/navigation/BottomNavbar';
import { useAuth } from './hooks/useAuth';
import { APP_ROUTES } from './constants';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { i18n } = useTranslation();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            <Route path={APP_ROUTES.LOGIN} element={<LoginScreen />} />
            <Route
              path={APP_ROUTES.PROFILE}
              element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.STYLE_ADJUSTMENT}
              element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.MATCH_AREA}
              element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.CHAT}
              element={<ProtectedRoute><ChatScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.VENDOR}
              element={<ProtectedRoute><VendorScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.SETTINGS}
              element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? APP_ROUTES.PROFILE : APP_ROUTES.LOGIN} replace />} />
          </Routes>
        </main>
        {isAuthenticated && <BottomNavbar />}
      </div>
    </div>
  );
};

export default App;
