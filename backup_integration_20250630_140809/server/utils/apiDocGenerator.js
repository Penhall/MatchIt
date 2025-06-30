// server/utils/apiDocGenerator.js - Gerador automático de documentação da API (ESM)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Estrutura da documentação da API
export const apiDocumentation = {
  openapi: "3.0.0",
  info: {
    title: "MatchIt API",
    version: "1.0.0",
    description: "API completa do sistema MatchIt - Fases 0 e 1 implementadas",
    contact: {
      name: "MatchIt Team",
      email: "dev@matchit.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Servidor de desenvolvimento"
    },
    {
      url: "https://api.matchit.com",
      description: "Servidor de produção"
    }
  ],
  tags: [
    {
      name: "Authentication",
      description: "Endpoints de autenticação e autorização"
    },
    {
      name: "Profile",
      description: "Gerenciamento de perfil do usuário (Fase 0)"
    },
    {
      name: "Tournament",
      description: "Sistema de torneios por imagens (Fase 1)"
    },
    {
      name: "Admin",
      description: "Endpoints administrativos"
    },
    {
      name: "System",
      description: "Endpoints de sistema e monitoramento"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "João Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          age: { type: "integer", minimum: 18, maximum: 100, example: 25 },
          gender: { type: "string", enum: ["male", "female", "other"], example: "male" },
          isAdmin: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      StylePreference: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          category: { type: "string", example: "cores" },
          questionId: { type: "string", example: "color_1" },
          selectedOption: { type: "string", example: "warm" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      TournamentSession: {
        type: "object",
        properties: {
          id: { type: "string", example: "tournament_1_cores_1640995200000" },
          userId: { type: "integer", example: 1 },
          category: { type: "string", example: "cores" },
          status: { type: "string", enum: ["active", "completed", "abandoned", "paused"] },
          currentRound: { type: "integer", example: 3 },
          totalRounds: { type: "integer", example: 5 },
          remainingImages: { type: "array", items: { type: "integer" } },
          tournamentSize: { type: "integer", example: 32 },
          progressPercentage: { type: "number", example: 60.5 },
          startedAt: { type: "string", format: "date-time" }
        }
      },
      TournamentImage: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          category: { type: "string", example: "cores" },
          imageUrl: { type: "string", format: "uri" },
          thumbnailUrl: { type: "string", format: "uri" },
          title: { type: "string", example: "Vermelho Coral" },
          description: { type: "string", example: "Tom quente e vibrante" },
          tags: { type: "array", items: { type: "string" } },
          winRate: { type: "number", example: 75.5 },
          totalViews: { type: "integer", example: 1500 },
          totalSelections: { type: "integer", example: 890 }
        }
      },
      TournamentResult: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          userId: { type: "integer" },
          category: { type: "string" },
          championId: { type: "integer" },
          finalistId: { type: "integer" },
          topChoices: { type: "array", items: { type: "integer" } },
          preferenceStrength: { type: "number", minimum: 0, maximum: 1 },
          consistencyScore: { type: "number", minimum: 0, maximum: 1 },
          decisionSpeedAvg: { type: "integer" },
          totalChoicesMade: { type: "integer" },
          sessionDurationMinutes: { type: "integer" },
          completedAt: { type: "string", format: "date-time" }
        }
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
          error: { type: "string" }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Erro interno do servidor" },
          error: { type: "string" }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Registrar novo usuário",
        description: "Cria uma nova conta de usuário no sistema",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 50 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  age: { type: "integer", minimum: 18 },
                  gender: { type: "string", enum: ["male", "female", "other"] }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Usuário criado com sucesso",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            user: { $ref: "#/components/schemas/User" },
                            token: { type: "string" }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Fazer login",
        description: "Autentica usuário e retorna token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            user: { $ref: "#/components/schemas/User" },
                            token: { type: "string" }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/profile/style-preferences": {
      get: {
        tags: ["Profile"],
        summary: "Buscar preferências de estilo",
        description: "Retorna todas as preferências de estilo do usuário organizadas por categoria",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Preferências encontradas",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          additionalProperties: {
                            type: "object",
                            additionalProperties: { $ref: "#/components/schemas/StylePreference" }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Profile"],
        summary: "Atualizar preferência de estilo",
        description: "Atualiza ou cria uma preferência específica",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["category", "questionId", "selectedOption"],
                properties: {
                  category: { type: "string", enum: ["cores", "estilos", "calcados", "acessorios", "texturas"] },
                  questionId: { type: "string" },
                  selectedOption: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { $ref: "#/components/responses/Success" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/tournament/start": {
      post: {
        tags: ["Tournament"],
        summary: "Iniciar novo torneio",
        description: "Inicia um novo torneio de imagens para uma categoria específica",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["category"],
                properties: {
                  category: { 
                    type: "string", 
                    enum: ["cores", "estilos", "calcados", "acessorios", "texturas", "roupas_casuais", "roupas_formais", "roupas_festa", "joias", "bolsas"]
                  },
                  tournamentSize: { type: "integer", enum: [4, 8, 16, 32, 64, 128], default: 32 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Torneio iniciado",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/TournamentSession" }
                      }
                    }
                  ]
                }
              }
            }
          },
          "409": {
            description: "Já existe torneio ativo para esta categoria",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "422": {
            description: "Categoria não possui imagens suficientes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/tournament/choice": {
      post: {
        tags: ["Tournament"],
        summary: "Processar escolha do usuário",
        description: "Registra a escolha do usuário em um confronto de torneio",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sessionId", "winnerId", "responseTimeMs"],
                properties: {
                  sessionId: { type: "string" },
                  winnerId: { type: "integer" },
                  responseTimeMs: { type: "integer", minimum: 0 },
                  confidenceLevel: { type: "integer", minimum: 1, maximum: 5 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Escolha processada",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/TournamentSession" }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/tournament/categories": {
      get: {
        tags: ["Tournament"],
        summary: "Listar categorias de torneio",
        description: "Retorna todas as categorias disponíveis com contagem de imagens",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Categorias encontradas",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          additionalProperties: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              description: { type: "string" },
                              icon: { type: "string" },
                              imageCount: { type: "integer" },
                              available: { type: "boolean" }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check do sistema",
        description: "Verifica se o sistema está funcionando corretamente",
        responses: {
          "200": {
            description: "Sistema saudável",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    timestamp: { type: "string", format: "date-time" },
                    status: { type: "string", example: "healthy" },
                    services: {
                      type: "object",
                      properties: {
                        database: { type: "string", example: "connected" },
                        memory: { type: "object" },
                        uptime: { type: "number" }
                      }
                    },
                    version: { type: "string", example: "1.0.0" }
                  }
                }
              }
            }
          },
          "503": {
            description: "Sistema indisponível",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    status: { type: "string", example: "unhealthy" },
                    error: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    responses: {
      Success: {
        description: "Operação realizada com sucesso",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiResponse" }
          }
        }
      },
      BadRequest: {
        description: "Dados de entrada inválidos",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      Unauthorized: {
        description: "Token de acesso requerido ou inválido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      Forbidden: {
        description: "Acesso negado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      NotFound: {
        description: "Recurso não encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      Conflict: {
        description: "Conflito - recurso já existe",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      TooManyRequests: {
        description: "Limite de taxa excedido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      InternalServerError: {
        description: "Erro interno do servidor",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
};

// Função para gerar documentação HTML
export const generateHTMLDoc = () => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MatchIt API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin-top: 20px; }
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '/api/docs.json',
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
            ],
            layout: "BaseLayout",
            deepLinking: true,
            showExtensions: true,
            showCommonExtensions: true,
            docExpansion: 'list',
            supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
            tryItOutEnabled: true
        });
    </script>
</body>
</html>
  `;

  return html;
};

// Função para salvar documentação em arquivos
export const saveDocumentation = () => {
  const docsDir = path.join(__dirname, '../../docs/api');
  
  // Criar diretório se não existir
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Salvar JSON
  fs.writeFileSync(
    path.join(docsDir, 'openapi.json'),
    JSON.stringify(apiDocumentation, null, 2)
  );

  // Salvar HTML
  fs.writeFileSync(
    path.join(docsDir, 'index.html'),
    generateHTMLDoc()
  );

  // Gerar README da API
  const readme = generateAPIReadme();
  fs.writeFileSync(
    path.join(docsDir, 'README.md'),
    readme
  );

  console.log('📚 Documentação da API gerada em:', docsDir);
};

// Função para gerar README da API
export const generateAPIReadme = () => {
  return `# MatchIt API Documentation

## Visão Geral

A API do MatchIt implementa um sistema completo de compatibilidade com torneios por imagens.

### Versão Atual: 1.0.0

### Base URL
- **Desenvolvimento**: \`http://localhost:3000/api\`
- **Produção**: \`https://api.matchit.com\`

## Autenticação

A API usa autenticação JWT (JSON Web Tokens). Inclua o token no header:

\`\`\`
Authorization: Bearer <seu_jwt_token>
\`\`\`

## Endpoints Principais

### 🔐 Autenticação
- \`POST /auth/register\` - Registrar usuário
- \`POST /auth/login\` - Fazer login

### 👤 Perfil (Fase 0)
- \`GET /profile/style-preferences\` - Buscar preferências
- \`PUT /profile/style-preferences\` - Atualizar preferência
- \`POST /profile/style-preferences/batch\` - Salvar múltiplas

### 🏆 Torneios (Fase 1)
- \`POST /tournament/start\` - Iniciar torneio
- \`POST /tournament/choice\` - Processar escolha
- \`GET /tournament/categories\` - Listar categorias
- \`GET /tournament/history\` - Histórico de torneios

### 🛠️ Sistema
- \`GET /health\` - Status do sistema
- \`GET /admin/status\` - Status administrativo (admin apenas)

## Códigos de Status

- \`200\` - Sucesso
- \`201\` - Criado
- \`400\` - Dados inválidos
- \`401\` - Não autorizado
- \`403\` - Acesso negado
- \`404\` - Não encontrado
- \`409\` - Conflito
- \`422\` - Entidade não processável
- \`429\` - Limite de taxa excedido
- \`500\` - Erro interno

## Rate Limiting

- **API Geral**: 1000 requests / 15 minutos
- **Autenticação**: 5 tentativas / 15 minutos
- **Torneios**: 10 iniciações / minuto
- **Upload**: 20 uploads / hora

## Exemplos de Uso

### Registrar Usuário

\`\`\`bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "age": 25,
    "gender": "male"
  }'
\`\`\`

### Iniciar Torneio

\`\`\`bash
curl -X POST http://localhost:3000/api/tournament/start \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "category": "cores",
    "tournamentSize": 32
  }'
\`\`\`

## Documentação Interativa

Acesse a documentação interativa em:
- **Desenvolvimento**: http://localhost:3000/api/docs
- **Swagger UI**: Disponível na rota acima

## Suporte

Para dúvidas ou suporte, entre em contato:
- Email: dev@matchit.com
- GitHub: https://github.com/matchit/api

## Changelog

### v1.0.0 (Atual)
- ✅ Sistema de autenticação JWT
- ✅ Fase 0: Preferências de estilo completas
- ✅ Fase 1: Sistema de torneios por imagens
- ✅ Admin panel para gestão de imagens
- ✅ Sistema de analytics e métricas
- ✅ Rate limiting e segurança avançada

## Próximas Versões

### v1.1.0 (Planejado)
- 🔄 Fase 2: Perfil emocional
- 🔄 Sistema de chat em tempo real
- 🔄 Notificações push
- 🔄 Matches e compatibilidade

### v1.2.0 (Futuro)
- 🔄 Machine Learning para recomendações
- 🔄 Integração com redes sociais
- 🔄 Sistema de premium
`;
};

// Middleware para servir documentação
export const serveDocumentation = (req, res, next) => {
  if (req.path === '/docs') {
    res.setHeader('Content-Type', 'text/html');
    return res.send(generateHTMLDoc());
  }
  
  if (req.path === '/docs.json') {
    res.setHeader('Content-Type', 'application/json');
    return res.json(apiDocumentation);
  }
  
  next();
};
