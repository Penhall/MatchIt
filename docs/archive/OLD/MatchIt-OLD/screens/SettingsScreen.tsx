
import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Switch from '../components/common/Switch';
import { NEON_COLORS } from '../constants';
import { CogIcon, LogoutIcon, MoonIcon, SunIcon, UserIcon, VipBadgeIcon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';


const SettingsScreen: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true); // App-wide dark mode could be context-based
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(APP_ROUTES.LOGIN);
  };

  // In a real app, this would toggle a global theme context
  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    // Example: document.documentElement.classList.toggle('dark', checked);
    alert(`Dark mode ${checked ? 'enabled' : 'disabled'}. (Visual toggle only for mockup)`);
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
        <h2 className="text-lg font-semibold ${NEON_COLORS.blue} mb-3">Appearance</h2>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isDarkMode ? <MoonIcon className="w-5 h-5 mr-2 text-neon-blue" /> : <SunIcon className="w-5 h-5 mr-2 text-yellow-400" />}
            <span>Dark Mode</span>
          </div>
          <Switch id="darkModeToggle" checked={isDarkMode} onChange={toggleDarkMode} />
        </div>
      </Card>

      <Card glowColor="green">
        <h2 className="text-lg font-semibold ${NEON_COLORS.green} mb-3">Notifications</h2>
        <div className="flex justify-between items-center">
          <span>Enable Push Notifications</span>
          <Switch id="notificationsToggle" checked={notificationsEnabled} onChange={setNotificationsEnabled} />
        </div>
         <p className="text-xs text-gray-500 mt-2">Manage what alerts you receive from MatchIt.</p>
      </Card>
      
      <Card glowColor="orange">
        <h2 className="text-lg font-semibold ${NEON_COLORS.orange} mb-3">Account</h2>
         <Button variant="outline" glowEffect="orange" className="w-full mb-3 flex items-center justify-center" onClick={() => navigate(APP_ROUTES.PROFILE)}>
            <UserIcon className="w-5 h-5 mr-2"/> View My Profile
          </Button>
        <Button variant="outline" glowEffect="orange" className="w-full text-red-400 border-red-400 hover:bg-red-500/10 hover:shadow-glow-orange" onClick={handleLogout}>
          <LogoutIcon className="w-5 h-5 mr-2"/> Log Out
        </Button>
      </Card>
      
      <Card>
        <h2 className="text-lg font-semibold text-neon-blue mb-3">VIP Membership</h2>
        <div className="text-center p-4 bg-dark-input rounded-lg border border-neon-orange/50">
            <VipBadgeIcon className="w-10 h-10 mx-auto text-neon-orange mb-2" />
            <h3 className="text-xl font-bold text-neon-orange">Unlock VIP Benefits</h3>
            <p className="text-gray-400 my-2 text-sm">Get unlimited matches, advanced filters, and an ad-free experience.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
                <Button variant="secondary" className="w-full" glowEffect="orange">Monthly: $9.99</Button>
                <Button variant="secondary" className="w-full" glowEffect="orange">Yearly: $99.99 (Save 15%)</Button>
            </div>
            <p className="text-xs text-gray-500">Subscriptions renew automatically. Cancel anytime.</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-400 mb-3">About MatchIt</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="text-neon-blue hover:underline">Terms of Use</a></li>
          <li><a href="#" className="text-neon-blue hover:underline">Privacy Policy</a></li>
          <li><a href="#" className="text-neon-blue hover:underline">Contact Support</a></li>
          <li><span className="text-gray-500">App Version: 1.0.0 (Build 20240729)</span></li>
        </ul>
      </Card>
    </div>
  );
};

export default SettingsScreen;
