
import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../components/common/Avatar';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import { MOCK_USER_PROFILE, MOCK_STYLE_PROFILE_COMPLETION, NEON_COLORS } from '../constants';
import Card from '../components/common/Card';
import { CogIcon, VipBadgeIcon } from '../components/common/Icon';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const user = MOCK_USER_PROFILE;
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <Card glowColor="blue">
        <div className="flex items-center space-x-4">
          <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" isVip={user.isVip} />
          <div>
            <h1 className="text-2xl font-bold text-neon-blue flex items-center">
              {user.displayName} {user.isVip && <VipBadgeIcon className="w-5 h-5 ml-2 text-neon-orange" />}
            </h1>
            <p className="text-sm text-gray-400">{user.city} | {user.gender}</p>
          </div>
        </div>
        {user.bio && <p className="mt-4 text-sm text-gray-300">{user.bio}</p>}
        <Button variant="outline" size="sm" className="mt-4 w-full" glowEffect="green" onClick={() => alert('Edit Profile Clicked!')}>
          {t('profile.editProfile')}
        </Button>
      </Card>

      <Card glowColor="green">
        <h2 className="text-lg font-semibold ${NEON_COLORS.green} mb-2">{t('profile.styleProgress')}</h2>
        <ProgressBar progress={MOCK_STYLE_PROFILE_COMPLETION} glow />
        <p className="text-sm text-gray-400 mt-2 text-center">
          {t('profile.completion', { percent: MOCK_STYLE_PROFILE_COMPLETION })}
        </p>
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
        <h2 className="text-lg font-semibold ${NEON_COLORS.orange} mb-3">{t('profile.accountOptions')}</h2>
        <div className="space-y-3">
          <Button variant="outline" glowEffect="orange" className="w-full flex items-center justify-center" onClick={() => navigate(APP_ROUTES.SETTINGS)}>
            <CogIcon className="w-5 h-5 mr-2"/> {t('profile.settings')}
          </Button>
          {!user.isVip && (
            <Button variant="secondary" glowEffect="orange" className="w-full" onClick={() => alert('Upgrade to VIP!')}>
              {t('profile.upgradeVip')}
            </Button>
          )}
        </div>
      </Card>
      
      {/* Mock photo gallery section */}
      <Card>
        <h2 className="text-lg font-semibold text-neon-blue mb-3">{t('profile.myGallery')}</h2>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <img 
              key={i} 
              src={`https://picsum.photos/seed/${user.id}${i}/150/150`} 
              alt={`User gallery photo ${i}`}
              className="rounded-lg object-cover aspect-square border-2 border-gray-700 hover:border-neon-blue transition-all"
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProfileScreen;
