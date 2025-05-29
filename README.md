# MatchIt - Style & Emotion Connect

MatchIt é um aplicativo de conexões que vai além do superficial, combinando pessoas com base em seus estilos pessoais, hobbies e preferências emocionais.

## 🚀 Tecnologias

- React 19 + TypeScript
- Vite (build tool)
- React Router DOM (roteamento)
- Recharts (gráficos)
- Design System com tema neon futurista

## 📦 Como Executar

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:5173` no navegador

## ‍♂️ Features Principais

### 👤 Autenticação
- Login protegido
- Rotas privadas

### 📊 Perfil de Estilo
- Radar visual mostrando preferências em categorias:
  - Sneakers
  - Roupas
  - Cores
  - Hobbies
  - Emoções

### 💞 Match Area
- Sistema de compatibilidade baseado em estilo
- Pontuação de match (0-100%)
- Perfis de potenciais matches

### 💬 Chat Integrado
- Conversas com matches
- Histórico de mensagens

### 🛍️ Vendor Area
- Produtos recomendados baseados no estilo
- Marcas parceiras

## 🏗️ Estrutura de Pastas

```
MatchIt/
├── components/          # Componentes reutilizáveis
│   ├── common/          # Componentes UI básicos
│   ├── navigation/      # Componentes de navegação
│   └── profile/         # Componentes específicos de perfil
├── context/             # Contextos React (Auth)
├── screens/             # Telas principais
├── types/               # Tipos TypeScript
├── constants.ts         # Constantes e mock data
├── App.tsx              # Componente principal
└── vite.config.ts       # Configuração do Vite
```

## 🎨 Design

- Tema neon futurista
- Efeitos holográficos
- Paleta de cores:
  - Azul neon (#00FFFF)
  - Verde neon (#00FF00)
  - Laranja neon (#FF8C00)

## 📝 Próximos Passos

- Integração com API real
- Sistema de preferências mais detalhado
- Match com base em localização
- Integração com redes sociais
