# 🐛 Troubleshooting - MatchIt

## 🔍 Problemas Comuns e Soluções

### ❌ Erro: "Cannot find module @rollup/rollup-win32-x64-msvc"

**Problema:**
```
Error: Cannot find module @rollup/rollup-win32-x64-msvc. 
npm has a bug related to optional dependencies
```

**Causa:** Incompatibilidade de binários nativos entre Windows e WSL2, ou versões muito recentes do Vite/Rollup.

**Solução Definitiva:**
```bash
cd frontend.User

# 1. Limpar completamente
rm -rf node_modules package-lock.json
npm cache clean --force

# 2. Usar versões estáveis compatíveis
# package.json já configurado com versões testadas

# 3. Instalar sem dev dependencies
npm install --production

# 4. Usar servidor customizado
npm run dev
```

**Resultado:** Frontend roda em http://localhost:8080

---

### ❌ Página em Branco / Tela de Status

**Problema:** App mostra tela de debug ao invés do MatchIt

**Causa:** index.html incorreto ou servidor servindo conteúdo errado

**Solução:**
```bash
# Verificar se index.html contém:
grep "main.tsx" frontend.User/index.html

# Deve mostrar:
# <script type="module" src="/src/main.tsx"></script>
```

---

### ❌ CORS Error

**Problema:**
```
Access to fetch at 'http://localhost:3000/api/health' blocked by CORS policy
```

**Solução:**
```bash
# Backend simples (sem dependências)
cd backend
node simple-server.js

# Verifica CORS
curl -H "Origin: http://localhost:8080" http://localhost:3000/api/health
```

---

### ❌ Node_modules Duplicados

**Problema:** Pastas node_modules na raiz e em frontend.User

**Solução:**
```bash
# Remover da raiz
rm -rf /MatchIt/node_modules
rm -rf /MatchIt/package-lock.json
rm -rf /MatchIt/package.json

# Manter apenas em subprojetos
```

**Economia:** ~500MB de espaço

---

### ❌ TypeScript/JSX Não Funciona

**Problema:** Erro de MIME type ou import

**Causa:** Servidor não processa TypeScript

**Solução:** Usar servidor customizado que serve arquivos estáticos corretamente

---

### ❌ Processo na Porta 3000/8080

**Problema:** "Port already in use"

**Solução:**
```bash
# Encontrar processo
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9

# Ou usar porta diferente
PORT=3001 node simple-server.js
```

---

## 🛠️ Configuração Definitiva Que Funciona

### Frontend (porta 8080)
```json
{
  "scripts": {
    "dev": "node server.js",
    "vite": "vite --host"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0", 
    "react-router-dom": "^6.8.0"
  }
}
```

### Backend (porta 3000) 
```bash
node simple-server.js
```

### URLs Finais
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3000/api/health

---

## ✅ Verificação de Funcionamento

### 1. Teste Backend
```bash
curl http://localhost:3000/api/health
# Esperado: {"success":true,"message":"MatchIt API funcionando!"}
```

### 2. Teste Frontend
```bash
curl http://localhost:8080
# Esperado: HTML do MatchIt (não tela de status)
```

### 3. Teste CORS
```bash
curl -H "Origin: http://localhost:8080" http://localhost:3000/api/health
# Esperado: Resposta JSON sem erro CORS
```

---

## 🎯 Abordagem de Debug

### Logs Detalhados
```bash
# Backend
DEBUG=* node simple-server.js

# Frontend  
# Verificar console do navegador em http://localhost:8080
```

### Health Check Script
```bash
#!/bin/bash
echo "🔍 Verificando MatchIt..."

# Backend
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: FALHOU"
fi

# Frontend
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: FALHOU"
fi
```

---

## 🔧 Soluções Alternativas

### Se Servidor Customizado Falhar
```bash
# Opção 1: Python
cd frontend.User
python3 -m http.server 8080

# Opção 2: Node http-server
npx http-server -p 8080 -c-1

# Opção 3: Vite (se funcionar)
npm run vite
```

### Se Backend Principal Falhar
```bash
# Usar Express simples
cd backend
node -e "
const express = require('express');
const app = express();
app.use(require('cors')());
app.get('/api/health', (req,res) => res.json({success:true}));
app.listen(3000, () => console.log('Server on :3000'));
"
```

---

## 📞 Quando Pedir Ajuda

Se nenhuma solução funcionar:

1. ✅ Verificou se está na pasta correta?
2. ✅ Removeu node_modules e reinstalou?
3. ✅ Testou as URLs diretamente?
4. ✅ Verificou se portas estão livres?
5. ✅ Consultou logs de erro?

**Inclua sempre:**
- Sistema operacional
- Versão do Node.js (`node --version`)
- Saída completa do erro
- Pasta atual (`pwd`)

---

**Última atualização: 20/07/2025**