// src/screens/debug/DebugScreen.tsx - Tela para teste de integração
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const DebugScreen: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4 text-neon-blue">🔧 Debug - Integração</h1>
      
      <div className="space-y-4">
        <div className="bg-dark-card p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Status da Autenticação</h2>
          <p>Autenticado: {isAuthenticated ? '✅ SIM' : '❌ NÃO'}</p>
          {user && (
            <div className="mt-2">
              <p>Usuário: {user.name}</p>
              <p>Email: {user.email}</p>
            </div>
          )}
        </div>
        
        <div className="bg-dark-card p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Próximos Passos</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>✅ LoginScreen funcionando</li>
            <li>⏳ Habilitar ProfileScreen</li>
            <li>⏳ Habilitar SettingsScreen</li>
            <li>⏳ Habilitar outras telas...</li>
          </ol>
        </div>
        
        {isAuthenticated && (
          <button 
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Logout (Teste)
          </button>
        )}
      </div>
    </div>
  );
};

export default DebugScreen;
