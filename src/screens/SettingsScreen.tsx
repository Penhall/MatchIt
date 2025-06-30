import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CogIcon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES, NEON_COLORS } from '../constants';

const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(APP_ROUTES.LOGIN);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <div className="text-center mb-6">
        <CogIcon className={`w-12 h-12 mx-auto ${NEON_COLORS.blue} mb-2`} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
          Settings & Info
        </h1>
      </div>

      <Card glowColor="blue">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.blue} mb-3`}>Account Options</h2>
        <div className="space-y-3">
          <Button variant="outline" glowEffect="blue" className="w-full">
            Edit Profile
          </Button>
          <Button variant="outline" glowEffect="green" className="w-full">
            Privacy Settings
          </Button>
          <Button variant="outline" glowEffect="orange" className="w-full">
            Notification Preferences
          </Button>
          <Button variant="secondary" glowEffect="orange" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsScreen;
