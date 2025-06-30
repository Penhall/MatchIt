import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { APP_ROUTES, NEON_COLORS } from '../constants';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <Card glowColor="blue">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-neon-blue to-neon-green rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-black">
            AR
          </div>
          <h1 className="text-2xl font-bold text-neon-blue">Alex Ryder</h1>
          <p className="text-sm text-gray-400">Neo Kyoto | VIP Member</p>
          <p className="mt-4 text-sm text-gray-300">Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.</p>
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full" glowEffect="green">
          Edit Profile & Photos
        </Button>
      </Card>

      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-2`}>Style Profile Progress</h2>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-neon-blue to-neon-green h-3 rounded-full" style={{width: '65%'}}></div>
        </div>
        <p className="text-sm text-gray-400 text-center">65% of your style profile completed.</p>
        <Button 
          variant="primary" 
          size="md" 
          className="mt-4 w-full" 
          onClick={() => navigate(APP_ROUTES.STYLE_ADJUSTMENT)}
          glowEffect="blue"
        >
          Adjust Your Style
        </Button>
      </Card>
    </div>
  );
};

export default ProfileScreen;
