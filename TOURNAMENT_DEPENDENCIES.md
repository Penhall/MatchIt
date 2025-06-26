# Dependências Necessárias para o Sistema de Torneios

## Dependências NPM que precisam ser instaladas:

```bash
# AsyncStorage para salvar tokens
npm install @react-native-async-storage/async-storage

# Navegação (se não tiver)
npm install @react-navigation/native @react-navigation/stack

# Dependências do React Navigation
npm install react-native-screens react-native-safe-area-context

# Para iOS (se desenvolvendo para iOS)
cd ios && pod install
```

## Como usar os componentes:

### 1. Adicionar TournamentScreen à navegação:

```javascript
// Em seu navigator principal
import { TournamentScreen } from './screens/Tournament';

// Adicionar à stack
<Stack.Screen 
  name="Tournament" 
  component={TournamentScreen}
  options={{ title: 'Torneio Visual' }}
/>
```

### 2. Navegar para o torneio:

```javascript
// De qualquer tela
navigation.navigate('Tournament');
```

### 3. Exemplo de uso direto:

```javascript
import React from 'react';
import { TournamentScreen } from './components/Tournament';

const App = () => {
  return <TournamentScreen />;
};
```

## Configuração adicional:

1. Certifique-se de que o servidor está rodando em localhost:3000
2. Configure seu IP local se testando em dispositivo físico
3. Adicione permissões de rede no Android se necessário

## Estrutura criada:

```
components/Tournament/
├── CategorySelector.js     # Seleção de categorias
├── TournamentMatch.js      # Interface do match 2x2
└── index.js               # Exports

screens/Tournament/
├── TournamentScreen.js     # Tela principal
└── index.js               # Exports

services/tournament/
├── tournamentApi.js       # Chamadas para API
└── config.js              # Configuração

hooks/tournament/
└── useTournament.js       # Hook de estado

services/auth/
└── authService.js         # Gerenciamento de tokens
```
