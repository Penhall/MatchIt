import React from 'react';
import { Match } from '../types';

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    name: 'John Doe',
    photo: 'https://example.com/photo1.jpg',
    compatibility: 85
  },
  {
    id: '2',
    name: 'Jane Smith',
    photo: 'https://example.com/photo2.jpg',
    compatibility: 92
  }
];

const MatchAreaScreen = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
      
      <div className="space-y-4">
        {MOCK_MATCHES.map(match => (
          <div key={match.id} className="border rounded-lg p-4 flex items-center">
            <img 
              src={match.photo} 
              alt={match.name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h3 className="font-medium">{match.name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500 mr-2">Compatibility:</span>
                <span className="font-medium">{match.compatibility}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchAreaScreen;
