# Guia de Estilo - MatchIt

## Introdução
Este documento define os padrões de estilo e boas práticas para desenvolvimento de componentes no projeto MatchIt. O objetivo é manter consistência visual e de código em toda a aplicação.

## 1. Uso de styleConstants.ts

### Cores
Todas as cores devem ser importadas de `src/styleConstants.ts`:

```tsx
import { COLORS } from '../src/styleConstants';

// Uso correto
const styles = {
  backgroundColor: COLORS.NEON_BLUE,
  color: COLORS.WHITE
};

// Evitar cores hardcoded
const styles = {
  backgroundColor: '#00f0ff', // ❌ Não usar
};
```

### Espaçamentos
Use as constantes de espaçamento para manter consistência:

```tsx
import { SPACING } from '../src/styleConstants';

// Exemplo de uso
<div style={{ padding: SPACING.MEDIUM }}>
  Conteúdo
</div>
```

### Bordas e Efeitos
```tsx
import { BORDERS, EFFECTS } from '../src/styleConstants';

// Bordas arredondadas
const cardStyle = {
  borderRadius: BORDERS.RADIUS_MD,
  border: `${BORDERS.WIDTH} solid ${BORDERS.COLOR}`
};

// Efeitos de glow
const buttonStyle = {
  boxShadow: EFFECTS.GLOW_BLUE
};
```

## 2. Padrões para Componentes

### Boas Práticas
1. **Tipagem Forte**: Sempre defina interfaces para props
2. **Valores Padrão**: Defina valores padrão para props opcionais
3. **Separação de Estilos**: Mantenha lógica de estilos separada do JSX
4. **Reutilização**: Use constantes compartilhadas para estilos comuns

### Estrutura Recomendada
```tsx
interface ComponentProps {
  // Definir props aqui
}

const Component: React.FC<ComponentProps> = ({
  // Desestruturar props
}) => {
  // 1. Definir estilos base
  // 2. Definir variações
  // 3. Combinar classes
  
  return (
    // JSX limpo
  );
};
```

## 3. Exemplo: Componente Button Refatorado

O componente Button demonstra várias boas práticas:

1. **Variações Controladas**: Usa prop `variant` para mudar estilos
2. **Tamanhos Padronizados**: `size` define classes consistentes
3. **Efeitos Reutilizáveis**: Glow effects usam constantes compartilhadas
4. **Acessibilidade**: Inclui estados focus/active/disabled

```tsx
// Exemplo de uso
<Button 
  variant="outline" 
  size="lg" 
  glowEffect="green"
  onClick={handleClick}
>
  Clique aqui
</Button>
```

## 4. Checklist para Novos Componentes

- [ ] Definir interface para props
- [ ] Usar constantes de estilo compartilhadas
- [ ] Incluir estados interativos (hover, focus, active)
- [ ] Adicionar suporte a className para customização
- [ ] Documentar variações e exemplos de uso
- [ ] Manter JSX limpo e separado da lógica de estilos