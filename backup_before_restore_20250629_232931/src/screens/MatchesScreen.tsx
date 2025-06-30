import React from 'react';

const MatchesScreen: React.FC = () => {
  const matches = [
    { id: 1, name: 'Ana Silva', age: 24, distance: '2 km', image: '👩‍🦱', compatibility: 92 },
    { id: 2, name: 'Carlos Mendes', age: 28, distance: '5 km', image: '👨‍💼', compatibility: 88 },
    { id: 3, name: 'Mariana Costa', age: 26, distance: '3 km', image: '👩‍🎨', compatibility: 85 },
  ];

  return (
    <div className="min-h-screen bg-gradient-main p-4 pb-20">
      <div className="max-w-md mx-auto animate-fadeIn">
        <h1 className="text-2xl font-bold text-white mb-8">Seus Matches</h1>
        
        <div className="space-y-4">
          {matches.map((match, index) => (
            <div 
              key={match.id} 
              className="glass-effect rounded-2xl p-4 hover-scale animate-slideUp"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-neon rounded-full flex items-center justify-center text-2xl">
                  {match.image}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold">{match.name}</h3>
                    <span className="text-cyan-400 text-sm font-bold">{match.compatibility}%</span>
                  </div>
                  <p className="text-gray-400 text-sm">{match.age} anos • {match.distance}</p>
                  
                  <div className="flex items-center mt-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-gradient-neon h-2 rounded-full" 
                        style={{width: `${match.compatibility}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 bg-cyan-400/20 rounded-lg hover:bg-cyan-400/30 transition-colors">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-white text-lg font-semibold mb-2">Nenhum match ainda</h3>
            <p className="text-gray-400">Continue navegando para encontrar sua conexão perfeita!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesScreen;
