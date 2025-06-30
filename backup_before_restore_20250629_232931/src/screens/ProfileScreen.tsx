import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Matches', value: '127' },
    { label: 'Conversas', value: '23' },
    { label: 'Curtidas', value: '892' },
  ];

  return (
    <div className="min-h-screen bg-gradient-main p-4 pb-20">
      <div className="max-w-md mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          <button 
            onClick={() => navigate('/edit-profile')}
            className="p-2 glass-effect rounded-lg hover-scale"
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Card do Perfil */}
        <div className="glass-effect rounded-2xl p-6 mb-6 animate-slideUp">
          <div className="text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-neon rounded-full flex items-center justify-center text-2xl font-bold text-black">
                JD
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
            </div>
            
            <h2 className="text-xl font-semibold text-white">João Demo</h2>
            <p className="text-gray-400">joao@matchit.com</p>
            <p className="text-sm text-gray-500 mt-1">São Paulo, SP • 25 anos</p>
          </div>

          {/* Bio */}
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
            <p className="text-gray-300 text-sm">
              🎸 Músico nas horas vagas | 📚 Amante de livros | 🏃‍♂️ Corredor de fim de semana
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="glass-effect rounded-xl p-4 text-center animate-slideUp" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <button className="w-full glass-effect rounded-xl p-4 flex items-center justify-between hover-scale transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Matches</div>
                <div className="text-gray-400 text-sm">Ver suas conexões</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full glass-effect rounded-xl p-4 flex items-center justify-between hover-scale transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Estatísticas</div>
                <div className="text-gray-400 text-sm">Análise do seu perfil</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
