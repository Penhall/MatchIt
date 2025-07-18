# Guia de Migração - React Native para React Web

## Componentes Alterados

### Antes (React Native):
```jsx
import { TouchableOpacity, View, Text } from 'react-native';
```

### Depois (React Web):
```jsx
import { TouchableOpacity, View, Text } from '@web';
// ou
import TouchableOpacity from '@/components/web/TouchableOpacity';
import View from '@/components/web/View';
import Text from '@/components/web/Text';
```

## Arquivos Renomeados

- `screens/StyleAdjustmentScreen.ts` → `screens/StyleAdjustmentScreen.tsx`
- `screens/SettingsScreen.ts` → `screens/SettingsScreen.tsx`

## Dependências Adicionadas

- react-router-dom
- axios  
- i18next
- react-i18next
- i18next-browser-languagedetector

## URLs Corrigidas

- API: `localhost:3001` → `localhost:3000`

## Próximos Passos

1. Atualizar imports nos arquivos de tela
2. Substituir componentes React Native por componentes web
3. Testar funcionalidades específicas
