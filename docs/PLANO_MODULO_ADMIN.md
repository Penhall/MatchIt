# Plano de Implementação: Módulo Administrativo Integrado - MatchIt

**Data:** 11/06/2025
**Versão:** 1.0

## 1. Visão Geral

Este plano detalha as etapas para desenvolver um módulo administrativo integrado ao backend existente do MatchIt. O objetivo é fornecer uma interface para gerenciar os itens de avaliação (tênis, roupas, imagens para hobbies, etc.) e os itens disponíveis no "shopping" da plataforma, incluindo a capacidade de direcioná-los a perfis de usuário específicos.

## 2. Fases do Projeto

### Fase 1: Definição de Requisitos e Design da Arquitetura (Backend)

**Objetivo:** Estabelecer claramente o escopo do módulo administrativo e como ele se integrará à arquitetura de backend existente.

**Tarefas:**

1.  **Levantamento Detalhado de Requisitos:**
    *   **Entidades a Gerenciar:**
        *   `EvaluationItem` (Itens de Avaliação): tênis, roupas, imagens de hobbies, etc.
            *   Campos: `id`, `name`, `description`, `category` (tênis, roupa, hobby), `imageUrl`, `tags`, `active` (boolean).
        *   `ShoppingItem` (Itens do Shopping):
            *   Campos: `id`, `name`, `description`, `price`, `imageUrl`, `brand`, `category`, `stock`, `targetProfileCriteria` (ex: JSON para definir critérios de perfil), `active` (boolean).
    *   **Funcionalidades CRUD:**
        *   Para `EvaluationItem`: Criar, Listar, Atualizar, Deletar (CRUD).
        *   Para `ShoppingItem`: Criar, Listar, Atualizar, Deletar (CRUD).
    *   **Funcionalidades Específicas:**
        *   Interface para definir `targetProfileCriteria` para `ShoppingItem`.
        *   Possivelmente, visualização de estatísticas básicas (ex: quantos usuários avaliaram um item).
    *   **Autenticação e Autorização:**
        *   Definir como os administradores serão identificados e autenticados (pode ser um novo tipo de usuário/role ou uma lista de usuários permitidos).

2.  **Design da Modelagem de Dados:**
    *   Criar ou estender schemas/modelos no banco de dados para `EvaluationItem` e `ShoppingItem`.
    *   Definir relacionamentos (ex: um `ShoppingItem` pode estar relacionado a múltiplos `EvaluationItem` que o descrevem indiretamente).

3.  **Design da API Administrativa:**
    *   Definir endpoints RESTful para as operações CRUD de cada entidade.
        *   Ex: `POST /admin/evaluation-items`, `GET /admin/evaluation-items/:id`, etc.
        *   Ex: `POST /admin/shopping-items`, `GET /admin/shopping-items/:id`, etc.
    *   Garantir que todas as rotas administrativas sejam protegidas e exijam autenticação de administrador.

4.  **Design dos Serviços de Backend:**
    *   Criar novos serviços (ou estender existentes) para encapsular a lógica de negócio do módulo administrativo.
        *   `AdminEvaluationItemService`
        *   `AdminShoppingItemService`

### Fase 2: Desenvolvimento do Backend do Módulo Administrativo

**Objetivo:** Implementar toda a lógica de backend necessária para o módulo administrativo.

**Tarefas:**

1.  **Implementação da Modelagem de Dados:**
    *   Criar as tabelas/coleções no banco de dados.
    *   Implementar os modelos/schemas na camada de aplicação (ex: usando ORM/ODM).

2.  **Implementação da Autenticação/Autorização de Administrador:**
    *   Adicionar middleware para verificar se o usuário é um administrador.
    *   Criar mecanismo para designar usuários como administradores.

3.  **Implementação dos Serviços de Backend:**
    *   Desenvolver a lógica CRUD para `EvaluationItem`.
    *   Desenvolver a lógica CRUD para `ShoppingItem`.
    *   Implementar a lógica para gerenciar `targetProfileCriteria`.

4.  **Implementação das Rotas da API Administrativa:**
    *   Criar os controllers e rotas para expor os serviços administrativamente.
    *   Integrar o middleware de autenticação/autorização de administrador.

5.  **Testes Unitários e de Integração (Backend):**
    *   Escrever testes para os serviços e rotas da API administrativa.

### Fase 3: Desenvolvimento do Frontend do Módulo Administrativo (Interface Simples)

**Objetivo:** Criar uma interface de usuário funcional, embora simples, para que os administradores possam interagir com o módulo.

**Tecnologia Sugerida (a confirmar):**
*   Páginas HTML simples servidas pelo backend (usando um template engine como EJS, Pug, se o backend for Node.js).
*   OU uma SPA leve (React/Vue) dedicada para a seção `/admin`, construída de forma minimalista.

**Tarefas:**

1.  **Estrutura Básica e Navegação:**
    *   Página de login para administradores.
    *   Painel principal com links para gerenciamento de `EvaluationItem` e `ShoppingItem`.

2.  **Interface para `EvaluationItem`:**
    *   Listagem de itens com filtros básicos (categoria, status).
    *   Formulário para criar/editar `EvaluationItem` (com upload de imagem).
    *   Confirmação para exclusão.

3.  **Interface para `ShoppingItem`:**
    *   Listagem de itens com filtros básicos.
    *   Formulário para criar/editar `ShoppingItem` (com upload de imagem e campo para `targetProfileCriteria` - pode ser um JSON editor simples inicialmente).
    *   Confirmação para exclusão.

4.  **Integração com API Backend:**
    *   Conectar as interfaces frontend com os endpoints da API administrativa.
    *   Gerenciamento de estado simples (loading, errors).

5.  **Estilização Básica:**
    *   Garantir que a interface seja usável e clara, sem necessidade de design complexo nesta fase.

### Fase 4: Testes, Documentação e Implantação

**Objetivo:** Garantir a qualidade do módulo, documentar seu uso e integrá-lo ao fluxo de implantação.

**Tarefas:**

1.  **Testes End-to-End:**
    *   Testar os fluxos completos do módulo administrativo (login, CRUD de itens, etc.).

2.  **Documentação para Administradores:**
    *   Guia rápido sobre como acessar o painel.
    *   Instruções sobre como gerenciar os itens e suas propriedades.

3.  **Documentação Técnica (Opcional, se API for usada externamente):**
    *   Detalhes dos endpoints da API administrativa.

4.  **Preparação para Implantação:**
    *   Garantir que o módulo administrativo seja incluído no build da aplicação.
    *   Configurar variáveis de ambiente necessárias (ex: credenciais de admin iniciais, se aplicável).
    *   Testar em ambiente de staging.

5.  **Implantação em Produção:**
    *   Monitorar o funcionamento após a implantação.

## 3. Cronograma Estimado (Exemplo)

*   **Fase 1:** 1-2 semanas
*   **Fase 2:** 3-4 semanas
*   **Fase 3:** 3-4 semanas
*   **Fase 4:** 1-2 semanas

**Total Estimado:** 8-12 semanas (pode variar conforme recursos e complexidade final).

## 4. Considerações Adicionais

*   **Segurança:** É crucial garantir que o acesso ao módulo administrativo seja rigorosamente controlado.
*   **Usabilidade:** Mesmo sendo uma interface simples inicialmente, deve ser intuitiva para os administradores.
*   **Escalabilidade:** O design deve permitir futuras expansões, como relatórios mais detalhados, gerenciamento de usuários administradores, logs de auditoria, etc.
*   **Feedback Contínuo:** Coletar feedback dos administradores (mesmo que seja a equipe de desenvolvimento inicialmente) para iterar e melhorar o módulo.
