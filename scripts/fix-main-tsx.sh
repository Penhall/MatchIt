# scripts/fix-main-tsx.sh - Correção urgente do main.tsx
#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 ERRO CRÍTICO IDENTIFICADO: main.tsx quebrado!${NC}"
echo -e "${BLUE}📍 Problema: src/main.tsx importa StatusPage que não existe${NC}"
echo -e "${GREEN}🔧 Solução: Restaurar main.tsx original${NC}"
echo ""

# Backup do main.tsx atual
if [ -f "src/main.tsx" ]; then
    cp "src/main.tsx" "src/main.tsx.broken.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup do main.tsx quebrado criado${NC}"
fi

# Verificar se App.tsx existe
app_location=""
if [ -f "App.tsx" ]; then
    app_location="../App"
    echo -e "${GREEN}✅ App.tsx encontrado na raiz${NC}"
elif [ -f "src/App.tsx" ]; then
    app_location="./App"
    echo -e "${GREEN}✅ App.tsx encontrado em src/${NC}"
else
    echo -e "${YELLOW}⚠️  App.tsx não encontrado - vou criar um básico${NC}"
    app_location="./App"
fi

# Criar main.tsx correto
echo -e "${BLUE}🔧 Criando main.tsx funcional...${NC}"

cat > src/main.tsx << EOF
import React from "react";
import ReactDOM from "react-dom/client";
import App from "${app_location}";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo -e "${GREEN}✅ main.tsx corrigido!${NC}"

# Se App.tsx não existe, criar um básico
if [ ! -f "App.tsx" ] && [ ! -f "src/App.tsx" ]; then
    echo -e "${BLUE}🔧 Criando App.tsx básico...${NC}"
    
    cat > src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import MatchAreaScreen from '../screens/MatchAreaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StyleAdjustmentScreen from '../screens/StyleAdjustmentScreen';
import { useAuth } from './hooks/useAuth';
import BottomNavbar from './components/navigation/BottomNavbar';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>Carregando MatchIt...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginScreen /> : <Navigate to="/match" replace />} 
          />
          <Route 
            path="/match" 
            element={isAuthenticated ? <MatchAreaScreen /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/settings" 
            element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/style-adjustment" 
            element={isAuthenticated ? <StyleAdjustmentScreen /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/match" : "/login"} replace />} 
          />
        </Routes>
      </main>
      {isAuthenticated && <BottomNavbar />}
    </div>
  );
};

export default App;
EOF
    
    echo -e "${GREEN}✅ App.tsx básico criado${NC}"
fi

# Verificar se index.css existe, se não, criar básico
if [ ! -f "src/index.css" ]; then
    echo -e "${BLUE}🔧 Criando index.css básico...${NC}"
    
    cat > src/index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#root {
  height: 100vh;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
}
EOF
    
    echo -e "${GREEN}✅ index.css básico criado${NC}"
fi

# Verificar se App.css existe, se não, criar básico
if [ ! -f "src/App.css" ]; then
    echo -e "${BLUE}🔧 Criando App.css básico...${NC}"
    
    cat > src/App.css << 'EOF'
.app {
  text-align: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
EOF
    
    echo -e "${GREEN}✅ App.css básico criado${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CORREÇÃO CONCLUÍDA!${NC}"
echo ""
echo -e "${BLUE}📋 O que foi feito:${NC}"
echo -e "   ✅ src/main.tsx corrigido (StatusPage → App)"
echo -e "   ✅ App.tsx verificado/criado"
echo -e "   ✅ CSS básico criado"
echo ""
echo -e "${BLUE}🚀 Agora teste:${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${GREEN}✅ O Vite deve iniciar sem erros!${NC}"