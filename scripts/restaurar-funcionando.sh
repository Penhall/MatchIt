#!/bin/bash
# Script para voltar rapidamente para versão minimalista

echo "Restaurando versão minimalista (apenas LoginScreen)..."

cp src/App.tsx src/App.tsx.backup-$(date +%H%M%S)

cat > "src/App.tsx" << 'RESTORE_EOF'
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
RESTORE_EOF

echo "✅ Versão minimalista restaurada"
echo "Teste com: npm run dev"
