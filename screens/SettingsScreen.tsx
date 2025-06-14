
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Switch from '../components/common/Switch';
import { NEON_COLORS } from '../constants';
import { CogIcon, LogoutIcon, MoonIcon, SunIcon, UserIcon, VipBadgeIcon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';


const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { logout } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
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
          {t('settings.title')}
        </h1>
      </div>

      <Card glowColor="blue">
        <h2 className="text-lg font-semibold ${NEON_COLORS.blue} mb-3">{t('settings.appearance')}</h2>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isDarkMode ? <MoonIcon className="w-5 h-5 mr-2 text-neon-blue" /> : <SunIcon className="w-5 h-5 mr-2 text-yellow-400" />}
            <span>{t('settings.darkMode')}</span>
          </div>
          <Switch id="darkModeToggle" checked={isDarkMode} onChange={toggleTheme} />
        </div>
      </Card>

      <Card glowColor="green">
        <h2 className="text-lg font-semibold ${NEON_COLORS.green} mb-3">{t('settings.notifications')}</h2>
        <div className="flex justify-between items-center">
          <span>{t('settings.enableNotifications')}</span>
          <Switch id="notificationsToggle" checked={notificationsEnabled} onChange={setNotificationsEnabled} />
        </div>
         <p className="text-xs text-gray-500 mt-2">{t('settings.notificationsDescription')}</p>
      </Card>
      
      <Card glowColor="orange">
        <h2 className="text-lg font-semibold ${NEON_COLORS.orange} mb-3">{t('settings.account')}</h2>
         <Button variant="outline" glowEffect="orange" className="w-full mb-3 flex items-center justify-center" onClick={() => navigate(APP_ROUTES.PROFILE)}>
            <UserIcon className="w-5 h-5 mr-2"/> {t('settings.viewProfile')}
          </Button>
        <Button variant="outline" glowEffect="orange" className="w-full text-red-400 border-red-400 hover:bg-red-500/10 hover:shadow-glow-orange" onClick={handleLogout}>
          <LogoutIcon className="w-5 h-5 mr-2"/> {t('settings.logout')}
        </Button>
      </Card>
      
      <Card>
        <h2 className="text-lg font-semibold text-neon-blue mb-3">{t('settings.vipMembership')}</h2>
        <div className="text-center p-4 bg-dark-input rounded-lg border border-neon-orange/50">
            <VipBadgeIcon className="w-10 h-10 mx-auto text-neon-orange mb-2" />
            <h3 className="text-xl font-bold text-neon-orange">{t('settings.vipBenefits')}</h3>
            <p className="text-gray-400 my-2 text-sm">{t('settings.vipDescription')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
                <Button variant="secondary" className="w-full" glowEffect="orange">{t('settings.monthlyPlan')}</Button>
                <Button variant="secondary" className="w-full" glowEffect="orange">{t('settings.yearlyPlan')}</Button>
            </div>
            <p className="text-xs text-gray-500">{t('settings.subscriptionNote')}</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-400 mb-3">{t('settings.about')}</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="text-neon-blue hover:underline">{t('settings.terms')}</a></li>
          <li><a href="#" className="text-neon-blue hover:underline">{t('settings.privacy')}</a></li>
          <li><a href="#" className="text-neon-blue hover:underline">{t('settings.support')}</a></li>
          <li><span className="text-gray-500">{t('settings.version', {version: '1.0.0', build: '20240729'})}</span></li>
        </ul>
      </Card>
    </div>
  );
};

export default SettingsScreen;
