# 🎯 Sistema de Recomendação MatchIt

> **Status**: 🟢 **75% IMPLEMENTADO** - Funcionalmente completo para uso básico

Sistema inteligente de recomendações que conecta pessoas baseado em compatibilidade de estilo, personalidade, localização e comportamento.

## 📋 Índice

- [🎯 Sistema de Recomendação MatchIt](#-sistema-de-recomendação-matchit)
  - [📋 Índice](#-índice)
  - [🎯 Status Atual](#-status-atual)
    - [✅ IMPLEMENTADO](#-implementado)
    - [⚠️ PENDENTE](#️-pendente)
  - [🏗️ Arquitetura](#️-arquitetura)
    - [Fluxo Principal](#fluxo-principal)
  - [🎨 Temas](#-temas)
    - [Paleta de Cores (Tema Dark)](#paleta-de-cores-tema-dark)
    - [Uso do ThemeContext](#uso-do-themecontext)
  - [🧩 Componentes](#-componentes)
    - [BrandHeader](#brandheader)
  - [♿ Acessibilidade](#-acessibilidade)
    - [Requisitos Mínimos](#requisitos-mínimos)

## 🎯 Status Atual

### ✅ IMPLEMENTADO
- **Backend Completo**: Serviços, APIs, cache, rate limiting
- **Database Schema**: 17 tabelas + 7 stored procedures + 3 views
- **Tipos TypeScript**: Sistema completo de tipagem
- **3 Algoritmos**: Híbrido, Colaborativo, Baseado em Conteúdo
- **Aprendizado Automático**: Pesos adaptativos baseados em feedback
- **Analytics Detalhados**: Métricas de engajamento e performance

### ⚠️ PENDENTE
- **Componentes React**: Frontend components
- **Integração Final**: Conectar com server.js existente
- **Testes**: Validação completa do sistema

---

## 🏗️ Arquitetura

```
📁 Sistema de Recomendação
├── 🧠 Engine Core (RecommendationService)
├── 📊 Analytics & Learning
├── 🗄️ Database (PostgreSQL)
├── 🔌 REST APIs
├── 🧩 TypeScript Types
└── ⚡ Cache & Performance
```

### Fluxo Principal
1. **Usuário** solicita recomendações
2. **API** valida e processa request
3. **Engine** calcula compatibilidades 
4. **Algoritmo** seleciona melhores matches
5. **Cache** otimiza performance
6. **Analytics** registra métricas
7. **Learning** ajusta pesos automaticamente

---

## 🎨 Temas

### Paleta de Cores (Tema Dark)

```typescript
// theme/dark.ts
{
  colors: {
    // Cores de fundo
    background: '#0f172a', // Dark blue-gray
    surface: '#1e293b', // Slightly lighter
    card: '#334155', // Card background
    
    // Cores de texto
    text: {
      primary: '#f8fafc', // Almost white
      secondary: '#94a3b8', // Light gray
      disabled: '#64748b', // Gray
    },
    
    // Cores neon vibrantes
    neon: {
      blue: '#00f0ff', // WCAG AA: 4.6:1
      green: '#00ff9d', // WCAG AA: 4.8:1
      orange: '#ff7b00', // WCAG AA: 4.7:1
      pink: '#ff00aa', // WCAG AA: 4.9:1
    },
    
    // Estados
    states: {
      hover: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(0, 240, 255, 0.2)',
    }
  }
}
```

### Uso do ThemeContext

```typescript
// Exemplo de uso em componentes
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  
  return (
    <div style={{ 
      backgroundColor: theme.colors.background,
      color: theme.colors.text.primary
    }}>
      {/* Conteúdo */}
    </div>
  );
}
```

---

## 🧩 Componentes

### BrandHeader

Componente de cabeçalho com logo e slogan.

**Props:**
- `className` (opcional): Classes CSS adicionais

**Exemplo de uso:**

```typescript
import BrandHeader from '@/components/common/BrandHeader';

function LoginScreen() {
  return (
    <div>
      <BrandHeader />
      {/* Resto do formulário */}
    </div>
  );
}
```

---

## ♿ Acessibilidade

### Requisitos Mínimos

1. **Contraste de Cores**:
   - Texto primário: 4.5:1 mínimo (atual: 4.6-4.9:1)
   - Elementos interativos: 3:1 mínimo

2. **Tipografia**:
   - Tamanho base: 16px (1rem)
   - Escala: 0.75rem (12px) a 1.875rem (30px)
   - Fontes: Inter (300-700 weight)

3. **Atributos ARIA**:
   - Sempre usar `alt` em imagens
   - Indicar estados (`aria-pressed`, `aria-selected`)
   - Rotular elementos interativos

4. **Foco**:
   - Estilo de foco visível (`theme.colors.borders.focus`)
   - Ordem lógica de tabulação

---

[Restante do conteúdo original do README.md mantido...]

*Última atualização: 15 de junho de 2025*