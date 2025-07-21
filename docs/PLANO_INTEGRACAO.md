# 📋 PLANO DE INTEGRAÇÃO INCREMENTAL - MATCHIT

## 🎯 Objetivo
Habilitar uma tela por vez para identificar exatamente onde estão os problemas de integração.

## ✅ FASE 1: BASE (ATUAL)
- [x] LoginScreen ativa
- [x] Navegação básica funcionando
- [x] Hook useAuth funcionando
- [x] Roteamento básico

### Teste da Fase 1:
```bash
npm run dev
# Verificar se:
# 1. Página carrega sem erros
# 2. LoginScreen renderiza
# 3. Console sem erros críticos
```

## 🔄 FASE 2: ADICIONAR PROFILESCREEN
Depois que Fase 1 estiver 100% funcionando:

1. **Descomentar no App.tsx:**
```jsx
import ProfileScreen from './screens/ProfileScreen';
// ... na rota:
<Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
```

2. **Testar:**
```bash
npm run dev
# Navegar para /profile
# Verificar erros
```

## 🔄 FASE 3: ADICIONAR SETTINGSSCREEN
```jsx
import SettingsScreen from './screens/SettingsScreen';
<Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
```

## 🔄 FASE 4: ADICIONAR STYLEADJUSTMENTSCREEN
⚠️ **CUIDADO**: Esta tela tem imports React Native problemáticos
```jsx
import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
<Route path="/style-adjustment" element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>} />
```

## 🔄 FASE 5: ADICIONAR BOTTOM NAVBAR
```jsx
import BottomNavbar from './components/navigation/BottomNavbar';
// ... no final:
{isAuthenticated && <BottomNavbar />}
```

## 🔄 FASES 6-8: OUTRAS TELAS
- MatchAreaScreen
- ChatScreen  
- VendorScreen

## 📝 PROCESSO PARA CADA FASE:

1. **Descomentar APENAS a tela da fase atual**
2. **Testar**: `npm run dev`
3. **Se der erro**: Corrigir apenas essa tela
4. **Se funcionar**: Avançar para próxima fase
5. **Sempre fazer backup** antes de cada mudança

## 🚨 EM CASO DE ERRO:

### Restaurar estado anterior:
```bash
# Voltar para versão que funcionava
git checkout HEAD~1 src/App.tsx
# ou
cp backup_incremental_XXXXXX/App.tsx src/App.tsx
```

### Identificar problema específico:
1. Ver erro no console do navegador
2. Ver erro no terminal (npm run dev)
3. Isolar a tela problemática
4. Corrigir apenas essa tela

## 📊 CHECKLIST DE CADA FASE:

- [ ] `npm run dev` executa sem erros
- [ ] Página carrega no navegador
- [ ] Console sem erros críticos
- [ ] Navegação funciona
- [ ] Autenticação funciona
- [ ] Tela renderiza corretamente

