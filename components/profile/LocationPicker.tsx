import React, { useState, useEffect, ChangeEvent } from 'react';
import { GeographicLocation } from '@/types/recommendation/base'; // Importando de base.ts

interface LocationPickerProps {
  initialLocation?: GeographicLocation;
  onLocationChange: (location: GeographicLocation | null) => void;
  apiKey?: string; // Para serviços de geocodificação/mapas, se usado
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationChange,
  apiKey,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeographicLocation | null>(initialLocation || null);
  const [suggestions, setSuggestions] = useState<GeographicLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setSearchTerm(`${initialLocation.city}, ${initialLocation.region}, ${initialLocation.country}`);
    }
  }, [initialLocation]);

  const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    setSelectedLocation(null); // Limpa a localização selecionada ao digitar
    onLocationChange(null);

    if (term.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    // Simular uma chamada de API para buscar sugestões de localização
    // Em um app real, aqui você chamaria uma API de geocodificação (ex: Google Maps, Mapbox, OpenStreetMap Nominatim)
    setTimeout(() => {
      const mockSuggestions: GeographicLocation[] = [
        { city: 'São Paulo', region: 'SP', country: 'Brasil', latitude: -23.5505, longitude: -46.6333, source: 'manual' as 'manual' }, 
        { city: 'Rio de Janeiro', region: 'RJ', country: 'Brasil', latitude: -22.9068, longitude: -43.1729, source: 'manual' as 'manual' }, 
        { city: 'Salvador', region: 'BA', country: 'Brasil', latitude: -12.9747, longitude: -38.4767, source: 'manual' as 'manual' }, 
      ].filter(loc => 
        `${loc.city}, ${loc.region}, ${loc.country}`.toLowerCase().includes(term.toLowerCase())
      );
      setSuggestions(mockSuggestions);
      setIsLoading(false);
    }, 500);
  };

  const handleSelectSuggestion = (location: GeographicLocation) => {
    setSelectedLocation(location);
    setSearchTerm(`${location.city}, ${location.region}, ${location.country}`);
    setSuggestions([]);
    onLocationChange(location);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation: GeographicLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: 'Cidade Fictícia (GPS)',
            region: 'Estado Fictício',
            country: 'País Fictício',
            accuracy: position.coords.accuracy,
            source: 'gps' as 'gps', 
          };
          setSelectedLocation(currentLocation);
          setSearchTerm(`${currentLocation.city}, ${currentLocation.region}, ${currentLocation.country}`);
          onLocationChange(currentLocation);
          setIsLoading(false);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          alert('Não foi possível obter sua localização atual.');
          setIsLoading(false);
        }
      );
    } else {
      alert('Geolocalização não é suportada por este navegador.');
    }
  };

  return (
    <div className="location-picker relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Digite sua cidade, estado ou país"
        className="w-full px-3 py-2 bg-dark-input text-gray-200 border border-gray-700 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none"
      />
      {isLoading && <p className="text-sm text-gray-400 mt-1">Buscando...</p>}
      
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 max-h-60 overflow-auto">
          {suggestions.map((loc, index) => (
            <li
              key={index}
              onClick={() => handleSelectSuggestion(loc)}
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-gray-300"
            >
              {loc.city}, {loc.region}, {loc.country}
            </li>
          ))}
        </ul>
      )}

      {selectedLocation && (
        <p className="text-sm text-green-400 mt-1">
          Localização selecionada: {selectedLocation.city}, {selectedLocation.region} (Lat: {selectedLocation.latitude.toFixed(4)}, Lon: {selectedLocation.longitude.toFixed(4)})
        </p>
      )}

      <button 
        type="button" // Evita submit de formulário se estiver dentro de um <form>
        onClick={handleUseCurrentLocation}
        className="mt-2 px-3 py-1.5 text-sm bg-neon-blue/80 hover:bg-neon-blue text-black rounded-md"
        disabled={isLoading}
      >
        {isLoading ? 'Obtendo...' : 'Usar Localização Atual (GPS)'}
      </button>
      {/* Em um app real, poderia integrar um mapa aqui */}
    </div>
  );
};

export default LocationPicker;
