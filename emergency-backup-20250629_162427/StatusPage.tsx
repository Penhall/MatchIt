// src/pages/StatusPage.tsx - Página de status do sistema
import React, { useEffect, useState } from 'react';

const StatusPage: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState('🔄 Testando...');
  const [frontendFeatures, setFrontendFeatures] = useState({
    reactNativeComponents: '❌ Desabilitados (incompatíveis)',
    webComponents: '✅ Disponíveis',
    navigation: '✅ React Router',
    storage: '✅ LocalStorage'
  });

  useEffect(() => {
    // Testar backend
    fetch('/api/health')
      .then(res => res.json())
      .then(() => setBackendStatus('✅ Backend conectado'))
      .catch(() => setBackendStatus('❌ Backend não responde'));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎯 MatchIt - Status do Sistema</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>🔧 Migração React Native → React Web</h2>
        <p>O sistema foi migrado de React Native para React Web.</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>📊 Status dos Componentes:</h3>
        <ul>
          {Object.entries(frontendFeatures).map(([key, status]) => (
            <li key={key}>
              <strong>{key}:</strong> {status}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🌐 Status do Backend:</h3>
        <p>{backendStatus}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>📁 Arquivos Desabilitados:</h3>
        <p>Os seguintes arquivos React Native foram movidos para <code>disabled_react_native/</code>:</p>
        <ul>
          <li>StyleAdjustmentScreen.tsx</li>
          <li>SettingsScreen.tsx</li>
          <li>user-interaction-analytics.ts</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🚀 Próximos Passos:</h3>
        <ol>
          <li>Migrar componentes React Native para React Web</li>
          <li>Implementar navegação com React Router</li>
          <li>Adaptar estilos para CSS Web</li>
          <li>Testar funcionalidades no navegador</li>
        </ol>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0' }}>
        <h4>💡 URLs do Sistema:</h4>
        <ul>
          <li><strong>Frontend:</strong> http://localhost:5173</li>
          <li><strong>Backend:</strong> http://localhost:3000</li>
          <li><strong>API Health:</strong> http://localhost:3000/api/health</li>
        </ul>
      </div>
    </div>
  );
};

export default StatusPage;
