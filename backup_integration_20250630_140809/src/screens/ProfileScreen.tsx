import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { APP_ROUTES, NEON_COLORS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const displayName = user?.displayName || 'Alex Ryder';
  const city = user?.city || 'Neo Kyoto';
  const email = user?.email || 'alex@matchit.com';
  const isVip = user?.isVip || true;
  const bio = user?.bio || 'Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.';

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <Card glowColor="blue">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-neon-blue to-neon-green rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-black">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <h1 className="text-2xl font-bold text-neon-blue flex items-center justify-center gap-2">
            {displayName}
            {isVip && <span className="text-neon-orange text-sm">VIP</span>}
          </h1>
          <p className="text-sm text-gray-400">{city} | {email}</p>
          <p className="mt-4 text-sm text-gray-300">{bio}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full" glowEffect="green">
          {t('profile.editProfile')}
        </Button>
      </Card>

      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-2`}>
          {t('profile.styleProgress')}
        </h2>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-neon-blue to-neon-green h-3 rounded-full" style={{width: '65%'}}></div>
        </div>
        <p className="text-sm text-gray-400 text-center">65% {t('profile.styleProgress').toLowerCase()}</p>
        <Button 
          variant="primary" 
          size="md" 
          className="mt-4 w-full" 
          onClick={() => navigate(APP_ROUTES.STYLE_ADJUSTMENT)}
          glowEffect="blue"
        >
          {t('profile.adjustStyle')}
        </Button>
      </Card>

      <Card glowColor="orange">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.orange} mb-3`}>
          {t('profile.accountOptions')}
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
        </div>
      </Card>
    </div>
  );
};

export default ProfileScreen;
