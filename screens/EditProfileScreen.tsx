import React, { useState } from 'react';
import FloatingLabelInput from '../components/common/FloatingLabelInput';
import LocationPicker from '../components/profile/LocationPicker';
import { GeographicLocation } from '../types';

const MOCK_USER_PROFILE = {
  displayName: 'John Doe',
  bio: 'Software Developer',
  location: {
    latitude: -23.5505,
    longitude: -46.6333,
    city: 'São Paulo',
    country: 'Brazil'
  }
};

const EditProfileScreen = () => {
  const [displayName, setDisplayName] = useState(MOCK_USER_PROFILE.displayName);
  const [bio, setBio] = useState(MOCK_USER_PROFILE.bio);
  const [location, setLocation] = useState<GeographicLocation | null>(MOCK_USER_PROFILE.location);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      <div className="mb-4">
        <FloatingLabelInput
          label="Display Name"
          value={displayName}
          onChange={setDisplayName}
        />
      </div>

      <div className="mb-4">
        <FloatingLabelInput
          label="Bio"
          value={bio}
          onChange={setBio}
          multiline
        />
      </div>

      <div className="mb-4">
        <LocationPicker
          onLocationChange={setLocation}
        />
      </div>

      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Save Changes
      </button>
    </div>
  );
};

export default EditProfileScreen;
