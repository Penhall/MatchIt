# 🏆 API do Sistema de Torneios - MatchIt

## Visão Geral

O sistema de torneios 2x2 é o core do MatchIt, permitindo que usuários descubram suas preferências através de batalhas visuais gamificadas.

## Endpoints Principais

### 1. Iniciar Torneio
```http
POST /api/tournament/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "colors",
  "tournamentSize": 16
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sessionId": "tournament_123_colors_1640995200000",
    "category": "colors",
    "currentMatch": {
      "imageA": {
        "id": 1,
        "image_url": "/uploads/colors/red_palette.jpg",
        "title": "Paleta Vermelha"
      },
      "imageB": {
        "id": 2,
        "image_url": "/uploads/colors/blue_palette.jpg", 
        "title": "Paleta Azul"
      }
    },
    "totalRounds": 4,
    "imagesCount": 16
  }
}
```

### 2. Processar Escolha
```http
POST /api/tournament/choice
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "tournament_123_colors_1640995200000",
  "winnerId": 1,
  "loserId": 2,
  "responseTimeMs": 2500,
  "confidence": 4
}
```

### 3. Categorias Disponíveis
```http
GET /api/tournament/categories
```

### 4. Resultados do Torneio
```http
GET /api/tournament/results/:sessionId
Authorization: Bearer <token>
```

## Endpoints Administrativos

### 1. Upload de Imagens
```http
POST /api/tournament/admin/images
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

images: [File, File, ...]
category: "colors"
title: "Nova Paleta"
description: "Descrição da imagem"
tags: "vermelho,energia,vibrante"
```

### 2. Listar Imagens
```http
GET /api/tournament/admin/images?category=colors&page=1&limit=20
Authorization: Bearer <admin-token>
```

## Categorias Suportadas

- `colors` - Paletas de cores
- `styles` - Estilos de roupa
- `accessories` - Acessórios
- `shoes` - Calçados  
- `patterns` - Padrões e estampas
- `casual_wear` - Roupas casuais
- `formal_wear` - Roupas formais
- `party_wear` - Roupas de festa
- `jewelry` - Joias
- `bags` - Bolsas

## Fluxo do Torneio

1. **Iniciar** - Usuário escolhe categoria
2. **Batalhar** - Sistema gera confrontos 2x2
3. **Escolher** - Usuário seleciona preferência
4. **Avançar** - Sistema elimina perdedor
5. **Repetir** - Até restar apenas 1 campeão
6. **Finalizar** - Gerar insights e perfil

## Algoritmo Inteligente

O sistema utiliza algoritmo adaptativo que:

- Balanceia diversidade vs popularidade
- Aprende com tempo de resposta
- Considera nível de confiança
- Gera insights personalizados
- Calcula força de preferência

## Métricas Geradas

- Campeão da categoria
- Finalista (segundo lugar)
- Top 4 preferências
- Força da preferência (0-1.0)
- Tags dominantes
- Tempo médio de resposta
- Nível de confiança médio

