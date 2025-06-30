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
  - [🌱 Seeds de Dados Iniciais](#-seeds-de-dados-iniciais)
    - [1. Migração SQL (`009_seed_initial_data.sql`)](#1-migração-sql-009_seed_initial_datasql)
    - [2. Script JavaScript (`scripts/seedDatabase.js`)](#2-script-javascript-scriptsseeddatabasejs)
      - [Cenários de Teste Validados](#cenários-de-teste-validados)
    - [Configuração](#configuração)
    - [Índice Atualizado](#índice-atualizado)

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

## 🌱 Seeds de Dados Iniciais

O sistema possui dois métodos para popular dados iniciais:

### 1. Migração SQL (`009_seed_initial_data.sql`)
- Executada automaticamente em ambiente de desenvolvimento (`NODE_ENV=development`)
- Inclui:
  - Usuário admin: `admin@example.com` / `admin123`
  - Usuário teste: `test@example.com` / `test123`
  - Dados de perfil iniciais
  - Configurações padrão do sistema

### 2. Script JavaScript (`scripts/seedDatabase.js`)
- Execução manual: `node scripts/seedDatabase.js`
- Vantagens:
  - Usa bcrypt para hash de senhas (salt 12)
  - Transações atômicas
  - Validação de ambiente

#### Cenários de Teste Validados
1. **Ambiente de Desenvolvimento (NODE_ENV=development)**
   ```bash
   node scripts/seedDatabase.js
   ```
   - ✅ Executa normalmente
   - Saída esperada:
     ```
     [SEED] Iniciando seed de dados...
     [SEED] Conexão com banco estabelecida
     [SEED] Dados inseridos com sucesso
     ```

2. **Modo Forçado (--force)**
   ```bash
   node scripts/seedDatabase.js --force
   ```
   - ✅ Ignora verificação de ambiente
   - Saída esperada:
     ```
     [SEED] Modo forçado ativado
     [SEED] Ignorando verificação de ambiente...
     [SEED] Dados inseridos com sucesso
     ```

3. **Ambiente de Produção (NODE_ENV=production)**
   ```bash
   set NODE_ENV=production && node scripts/seedDatabase.js
   ```
   - ✅ Bloqueia execução por segurança
   - Saída esperada:
     ```
     [SEED] ERRO: Script não pode ser executado em produção
     [SEED] Use --force para sobrescrever (não recomendado)
     ```

### Configuração
- **Desabilitar seeds**: Definir `matchit.disable_seeds=true` no PostgreSQL
- **Ambiente**: Só executa em `development`
- **Segurança**: Nunca executar em produção

### Índice Atualizado
- [🌱 Seeds de Dados Iniciais](#-seeds-de-dados-iniciais)
  - [Cenários de Teste Validados](#cenários-de-teste-validados)

*Última atualização: 18 de junho de 2025 - Documentação de testes do seedDatabase.js*