import React, { useState } from 'react';
import { GeographicLocation } from '../../types';

interface LocationPickerProps {
  onLocationChange: (location: GeographicLocation) => void;
  initialLocation?: Partial<GeographicLocation>;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationChange,
  initialLocation = {}
}) => {
  const [location, setLocation] = useState<GeographicLocation>({
    latitude: initialLocation.latitude || 0,
    longitude: initialLocation.longitude || 0,
    city: initialLocation.city || '',
    country: initialLocation.country || ''
  });

  const handleChange = <K extends keyof GeographicLocation>(
    field: K,
    value: GeographicLocation[K]
  ) => {
    const newLocation = {
      ...location,
      [field]: value
    };
    setLocation(newLocation);
    onLocationChange(newLocation);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Your Location</h3>
      
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            value={location.latitude}
            onChange={(e) => handleChange('latitude', Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            value={location.longitude}
            onChange={(e) => handleChange('longitude', Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          value={location.city}
          onChange={(e) => handleChange('city', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          type="text"
          value={location.country}
          onChange={(e) => handleChange('country', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
};

export default LocationPicker;
