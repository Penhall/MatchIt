import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FloatingLabelInput from '../components/common/FloatingLabelInput';
import { useAuth } from '../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';

import { GeographicLocation } from '../types';

const EditProfileScreen = () => {
  const { t } = useTranslation();
  const { user, setUserState } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [city, setCity] = useState(user?.city || '');

  return (
    <div className="p-4 max-w-[420px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('profile.edit.title')}</h1>
      
      <div className="mb-4">
        <FloatingLabelInput
          label={t('profile.edit.displayName')}
          value={displayName}
          onChange={setDisplayName}
          required
        />
      </div>

      <div className="mb-4">
        <FloatingLabelInput
          label={t('profile.edit.city')}
          value={city}
          onChange={setCity}
          required
        />
      </div>

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        onClick={() => {
          if (displayName && city) {
            if (user) {
              setUserState({
                ...user,
                displayName,
                city
              });
            }
            navigate(APP_ROUTES.PROFILE);
          }
        }}
      >
        {t('profile.edit.saveChanges')}
      </button>
    </div>
  );
};

export default EditProfileScreen;
