# Módulo Administrativo - Documentação

## Visão Geral
O módulo administrativo permite o gerenciamento de itens de avaliação e itens do shopping através de uma API REST protegida por autenticação e permissões de administrador.

## Estrutura do Módulo

### Modelos
1. `EvaluationItem.js` - Modelo para itens de avaliação de estilo
2. `ShoppingItem.js` - Modelo para itens do shopping/vitrine

### Serviços
1. `AdminEvaluationItemService.js` - CRUD para itens de avaliação
2. `AdminShoppingItemService.js` - CRUD para itens do shopping

### Rotas
- Todas as rotas estão prefixadas com `/api/admin`
- Protegidas por:
  - `authMiddleware` - Requer autenticação
  - `adminMiddleware` - Requer privilégios de admin

#### Rotas disponíveis:

**Evaluation Items (`/evaluation-items`)**
- `POST /` - Criar novo item de avaliação.
  - Corpo da requisição: `multipart/form-data`
  - Campos: `name` (String, required), `category` (String, required), `description` (String), `active` (Boolean), `image` (File, opcional - jpeg, jpg, png, gif, max 5MB)
- `GET /` - Listar todos os itens de avaliação.
  - Query Params:
    - `page` (opcional, default: 1): Número da página
    - `limit` (opcional, default: 10): Quantidade de itens por página
    - `category` (opcional): Filtrar por categoria (String)
    - `active` (opcional): Filtrar por status ativo (Boolean: `true` ou `false`)
- `GET /:id` - Obter item de avaliação por ID
- `PUT /:id` - Atualizar item de avaliação por ID.
  - Corpo da requisição: `multipart/form-data`
  - Campos: `name` (String), `category` (String), `description` (String), `active` (Boolean), `image` (File, opcional - jpeg, jpg, png, gif, max 5MB). Se uma nova imagem for enviada, a `imageUrl` será atualizada.
- `DELETE /:id` - Deletar item de avaliação por ID

**Shopping Items (`/shopping-items`)**
- `POST /` - Criar novo item do shopping.
  - Corpo da requisição: `multipart/form-data`
  - Campos: `name` (String, required), `price` (Number, required), `category` (String, required), `stock` (Number, required), `description` (String), `brand` (String), `active` (Boolean), `targetProfileCriteria` (Object), `image` (File, opcional - jpeg, jpg, png, gif, max 5MB)
- `GET /` - Listar todos os itens do shopping.
  - Query Params:
    - `page` (opcional, default: 1): Número da página
    - `limit` (opcional, default: 10): Quantidade de itens por página
    - `category` (opcional): Filtrar por categoria (String)
    - `brand` (opcional): Filtrar por marca (String)
    - `active` (opcional): Filtrar por status ativo (Boolean: `true` ou `false`)
- `GET /:id` - Obter item do shopping por ID
- `PUT /:id` - Atualizar item do shopping por ID.
  - Corpo da requisição: `multipart/form-data`
  - Campos: `name` (String), `price` (Number), `category` (String), `stock` (Number), `description` (String), `brand` (String), `active` (Boolean), `targetProfileCriteria` (Object), `image` (File, opcional - jpeg, jpg, png, gif, max 5MB). Se uma nova imagem for enviada, a `imageUrl` será atualizada.
- `DELETE /:id` - Deletar item do shopping por ID

## Como Usar

1. Obter token JWT com perfil de administrador.
2. Para rotas POST e PUT que envolvem upload de imagem, enviar a requisição como `multipart/form-data`. O campo da imagem deve ser nomeado `image`.
3. Para outras requisições, usar `application/json` e enviar o token no header `Authorization: Bearer <token>`.

### Exemplo de Criação de Item com Imagem (usando curl):
Para enviar `multipart/form-data` com `curl`, você usaria a flag `-F`.
Exemplo:
```bash
curl -X POST 'http://localhost:3000/api/admin/shopping-items' \
  -H 'Authorization: Bearer <token>' \
  -F 'name=Camiseta Estilosa' \
  -F 'price=99.90' \
  -F 'category=Camisetas' \
  -F 'stock=50' \
  -F 'image=@/caminho/para/sua/imagem.jpg'
```
O campo `imageUrl` no banco de dados será preenchido automaticamente com o caminho relativo da imagem no servidor (ex: `/uploads/nome_unico_da_imagem.jpg`).

### Exemplo de Criação de Item:

```bash
curl -X POST 'http://localhost:3000/api/admin/shopping-items' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Camiseta Estampada",
    "price": 89.90,
    "imageUrl": "https://example.com/image.jpg",
    "category": "Camisetas",
    "brand": "Marca X",
    "stock": 100
  }'
```

### Exemplo de Listagem com Filtros e Paginação:

```bash
curl -X GET 'http://localhost:3000/api/admin/shopping-items?page=2&limit=5&category=Camisetas&active=true' \
  -H 'Authorization: Bearer <token>'
```
Retorna a segunda página, com 5 itens da categoria "Camisetas" que estão ativos.

## Próximas Etapas
1. Criar dashboard administrativo no frontend para consumir esta API (incluindo upload de imagens).
2. Adicionar mais testes para garantir a robustez dos endpoints, incluindo testes de upload.
3. Considerar filtros mais complexos (ex: range de preço, busca por nome parcial).
4. Implementar lógica para deletar imagens antigas do servidor quando um item é atualizado com uma nova imagem ou quando um item é deletado.
