import React, { useState, useEffect } from 'react';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Testar conectividade com backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao conectar com backend:', err);
        setHealth({ error: 'Backend não está rodando' });
        setLoading(false);
      });
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎯 MatchIt - Frontend Funcionando!</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Status da Conexão com Backend:</h2>
        {loading ? (
          <p>🔄 Testando conexão...</p>
        ) : health?.error ? (
          <div style={{ color: 'red' }}>
            <p>❌ {health.error}</p>
            <p>🔧 Execute: npm run server (em outro terminal)</p>
          </div>
        ) : (
          <div style={{ color: 'green' }}>
            <p>✅ Backend conectado!</p>
            <p>📡 Mensagem: {health?.message}</p>
            <p>🕐 Timestamp: {health?.timestamp}</p>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0' }}>
        <h3>URLs do Sistema:</h3>
        <ul>
          <li><strong>Frontend:</strong> http://localhost:5173</li>
          <li><strong>Backend:</strong> http://localhost:3000</li>
          <li><strong>API Health:</strong> http://localhost:3000/api/health</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
