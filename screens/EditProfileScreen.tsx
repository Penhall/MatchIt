import React, { useState } from 'react';
import FloatingLabelInput from '../components/common/FloatingLabelInput';
import LocationPicker from '../components/profile/LocationPicker';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';

import { GeographicLocation } from '../types';

const EditProfileScreen = () => {
  const { user, setUserState } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [location, setLocation] = useState<GeographicLocation>({
    latitude: 0,
    longitude: 0,
    city: user?.city || '',
    country: ''
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      <div className="mb-4">
        <FloatingLabelInput
          label="Display Name"
          value={displayName}
          onChange={setDisplayName}
          required
        />
      </div>

      <div className="mb-4">
        <LocationPicker
          onLocationChange={setLocation}
        />
      </div>

      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        onClick={() => {
          if (displayName && location.city) {
            if (user) {
              setUserState({
                ...user,
                displayName,
                city: location.city
              });
            }
            navigate(APP_ROUTES.PROFILE);
          }
        }}
      >
        Save Changes
      </button>
    </div>
  );
};

export default EditProfileScreen;
