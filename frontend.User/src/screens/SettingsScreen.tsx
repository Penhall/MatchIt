import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CogIcon } from '../components/common/Icon';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES, NEON_COLORS } from '../constants';

const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <h2 className={`text-lg font-semibold ${NEON_COLORS.blue} mb-3`}>
          {t('settings.account')}
        </h2>
        <div className="space-y-3">
          <Button variant="outline" glowEffect="blue" className="w-full">
            {t('profile.edit.title')}
          </Button>
          <Button variant="outline" glowEffect="green" className="w-full">
            {t('settings.privacy')}
          </Button>
          <Button variant="outline" glowEffect="orange" className="w-full">
            {t('settings.notifications')}
          </Button>
          <Button variant="secondary" glowEffect="orange" className="w-full" onClick={handleLogout}>
            {t('settings.logout')}
          </Button>
        </div>
      </Card>

      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-3`}>
          {t('settings.appearance')}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>{t('settings.darkMode')}</span>
            <div className="w-12 h-6 bg-neon-blue rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
          <Button variant="outline" glowEffect="green" className="w-full">
            {t('settings.language')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsScreen;
