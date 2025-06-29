# 🏗️ Arquitetura Técnica Detalhada - MatchIt
## Especificações Técnicas e Diagramas de Sistema

**Versão**: 2.0.0  
**Arquitetura**: Microserviços Híbridos  
**Stack**: PostgreSQL + Node.js + React Native  
**Paradigma**: RESTful API + Event-Driven

---

## 🎯 **VISÃO GERAL DA ARQUITETURA**

O MatchIt foi projetado com uma arquitetura moderna, escalável e orientada a eventos, preparada para suportar milhões de usuários e processamento de dados complexos em tempo real.

### **🏛️ Pilares Arquiteturais:**
1. **Separação de Responsabilidades** - Frontend, Backend, Database
2. **Escalabilidade Horizontal** - Preparado para múltiplas instâncias
3. **Performance First** - Otimização em todas as camadas
4. **Observabilidade** - Logs, métricas e monitoramento
5. **Segurança por Design** - JWT, validações, rate limiting

---

## 📐 **DIAGRAMA DE ARQUITETURA GERAL**

```mermaid
graph TB
    %% Frontend Layer
    subgraph "📱 Frontend Layer"
        RN[React Native App]
        PWA[PWA Web App]
        ADMIN[Admin Dashboard]
    end

    %% API Gateway
    subgraph "🚪 API Gateway"
        NGINX[NGINX Load Balancer]
        AUTH[Auth Middleware]
        RATE[Rate Limiting]
    end

    %% Backend Services
    subgraph "⚙️ Backend Services"
        API[Express.js API Server]
        AUTH_SVC[Authentication Service]
        PROFILE_SVC[Profile Service]
        TOURNAMENT_SVC[Tournament Service]
        RECOMMENDATION_SVC[Recommendation Engine]
        EMOTIONAL_SVC[Emotional Analysis Service]
        ANALYTICS_SVC[Analytics Service]
    end

    %% Data Layer
    subgraph "🗄️ Data Layer"
        POSTGRES[(PostgreSQL 17.5)]
        REDIS[(Redis Cache)]
        S3[(AWS S3 - Images)]
        ELASTIC[(ElasticSearch - Analytics)]
    end

    %% External Services
    subgraph "🌐 External Services"
        CDN[CloudFront CDN]
        MONITORING[Monitoring Stack]
        PUSH[Push Notifications]
    end

    %% Connections
    RN --> NGINX
    PWA --> NGINX
    ADMIN --> NGINX
    
    NGINX --> AUTH
    AUTH --> RATE
    RATE --> API
    
    API --> AUTH_SVC
    API --> PROFILE_SVC
    API --> TOURNAMENT_SVC
    API --> RECOMMENDATION_SVC
    API --> EMOTIONAL_SVC
    API --> ANALYTICS_SVC
    
    AUTH_SVC --> POSTGRES
    PROFILE_SVC --> POSTGRES
    TOURNAMENT_SVC --> POSTGRES
    RECOMMENDATION_SVC --> POSTGRES
    EMOTIONAL_SVC --> POSTGRES
    ANALYTICS_SVC --> ELASTIC
    
    API --> REDIS
    TOURNAMENT_SVC --> S3
    
    CDN --> S3
    API --> MONITORING
    API --> PUSH
```

---

## 🔗 **FLUXO DE DADOS PRINCIPAIS**

### **🔄 Fluxo de Autenticação**
```mermaid
sequenceDiagram
    participant User as 📱 User App
    participant API as ⚙️ API Server
    participant Auth as 🔐 Auth Service
    participant DB as 🗄️ PostgreSQL

    User->>API: POST /auth/login
    API->>Auth: validateCredentials()
    Auth->>DB: SELECT user WHERE email=?
    DB-->>Auth: User data
    Auth->>Auth: comparePassword()
    Auth->>Auth: generateJWT()
    Auth-->>API: JWT Token
    API-->>User: { token, user }
    
    Note over User,DB: Subsequent requests include JWT in header
    User->>API: GET /profile (+ JWT)
    API->>Auth: verifyJWT()
    Auth-->>API: Valid user ID
    API-->>User: Profile data
```

### **🏆 Fluxo de Torneio 2x2**
```mermaid
sequenceDiagram
    participant User as 📱 User App
    participant API as ⚙️ API Server
    participant Tournament as 🏆 Tournament Service
    participant DB as 🗄️ PostgreSQL
    participant S3 as ☁️ AWS S3

    User->>API: POST /tournament/start
    API->>Tournament: createSession()
    Tournament->>DB: INSERT tournament_session
    Tournament->>DB: SELECT random images
    DB-->>Tournament: Image pairs
    Tournament->>S3: getImageUrls()
    S3-->>Tournament: Signed URLs
    Tournament-->>API: Session + Image pairs
    API-->>User: Tournament data

    User->>API: POST /tournament/choice
    API->>Tournament: processChoice()
    Tournament->>DB: INSERT tournament_choice
    Tournament->>Tournament: calculateNextPair()
    Tournament-->>API: Next pair OR results
    API-->>User: Next round OR final results
```

### **🧠 Fluxo de Recomendação Emocional**
```mermaid
sequenceDiagram
    participant User as 📱 User App
    participant API as ⚙️ API Server
    participant Emotional as 🧠 Emotional Service
    participant Recommendation as 🎯 Recommendation Engine
    participant DB as 🗄️ PostgreSQL

    User->>API: POST /profile/emotional/questionnaire
    API->>Emotional: processQuestionnaire()
    Emotional->>DB: UPDATE user_learning_profiles
    Emotional->>Emotional: calculateEmotionalProfile()
    Emotional->>DB: INSERT emotional_states
    Emotional-->>API: Profile updated

    User->>API: GET /recommendations
    API->>Recommendation: getRecommendations()
    Recommendation->>DB: SELECT potential matches
    Recommendation->>Emotional: calculateEmotionalCompatibility()
    Emotional-->>Recommendation: Emotional scores
    Recommendation->>Recommendation: hybridScoring()
    Recommendation-->>API: Ranked recommendations
    API-->>User: Personalized matches
```

---

## 🗄️ **ESQUEMA DE BANCO DE DADOS**

### **📊 Diagrama ER Simplificado**
```mermaid
erDiagram
    USERS {
        uuid id PK
        string username
        string email
        string password_hash
        string name
        date date_of_birth
        boolean is_admin
        timestamp created_at
        timestamp updated_at
    }

    STYLE_CHOICES {
        uuid id PK
        uuid user_id FK
        string category
        string question_id
        string selected_option
        timestamp created_at
        timestamp updated_at
    }

    STYLE_RECOMMENDATIONS {
        uuid id PK
        uuid user_id FK
        jsonb recommendation_data
        timestamp generated_at
        timestamp last_updated
        boolean is_active
        decimal confidence_score
        string source_algorithm
    }

    USER_LEARNING_PROFILES {
        uuid id PK
        uuid user_id FK
        jsonb profile_data
        string learning_style
        decimal preference_stability
        timestamp last_learning_session
        integer total_sessions
        timestamp created_at
        timestamp updated_at
    }

    EMOTIONAL_STATES {
        uuid id PK
        uuid user_id FK
        string state_name
        decimal intensity
        timestamp recorded_at
        string context
        string source
        uuid session_id FK
    }

    LEARNING_SESSIONS {
        uuid id PK
        uuid user_id FK
        string session_type
        timestamp started_at
        timestamp completed_at
        integer duration_seconds
        jsonb data_collected
        decimal quality_score
        boolean is_completed
        jsonb metadata
    }

    TOURNAMENT_IMAGES {
        uuid id PK
        string category
        string image_url
        string alt_text
        jsonb metadata
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    TOURNAMENT_SESSIONS {
        uuid id PK
        uuid user_id FK
        string tournament_type
        string status
        timestamp started_at
        timestamp completed_at
        integer total_rounds
        integer current_round
        jsonb metadata
    }

    TOURNAMENT_CHOICES {
        uuid id PK
        uuid session_id FK
        uuid image_a_id FK
        uuid image_b_id FK
        uuid chosen_image_id FK
        integer round_number
        integer choice_time_ms
        decimal confidence_level
        timestamp created_at
    }

    USER_ALGORITHM_WEIGHTS {
        uuid id PK
        uuid user_id FK
        decimal style_compatibility_weight
        decimal location_weight
        decimal personality_weight
        decimal lifestyle_weight
        decimal activity_weight
        decimal learning_rate
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    USERS ||--o{ STYLE_CHOICES : has
    USERS ||--o{ STYLE_RECOMMENDATIONS : receives
    USERS ||--o| USER_LEARNING_PROFILES : has
    USERS ||--o{ EMOTIONAL_STATES : experiences
    USERS ||--o{ LEARNING_SESSIONS : participates
    USERS ||--o{ TOURNAMENT_SESSIONS : plays
    USERS ||--o| USER_ALGORITHM_WEIGHTS : configured

    LEARNING_SESSIONS ||--o{ EMOTIONAL_STATES : records
    TOURNAMENT_SESSIONS ||--o{ TOURNAMENT_CHOICES : contains
    TOURNAMENT_IMAGES ||--o{ TOURNAMENT_CHOICES : appears_in
```

---

## 🏗️ **ARQUITETURA DE SERVIÇOS**

### **⚙️ Backend Services Detalhado**

#### **1. Authentication Service**
```typescript
class AuthenticationService {
  // Core functions
  async register(userData: UserRegistration): Promise<AuthResult>
  async login(credentials: LoginCredentials): Promise<AuthResult>
  async validateToken(token: string): Promise<TokenValidation>
  async refreshToken(refreshToken: string): Promise<AuthResult>
  
  // Security features
  async rateLimit(identifier: string): Promise<boolean>
  async auditLog(action: string, userId: string): Promise<void>
  async checkUserPermissions(userId: string, resource: string): Promise<boolean>
}
```

#### **2. Profile Service** 
```typescript
class ProfileService {
  // Style preferences
  async getStylePreferences(userId: string): Promise<StylePreferences>
  async updateStylePreferences(userId: string, preferences: StyleData): Promise<void>
  async generateStyleRecommendations(userId: string): Promise<Recommendation[]>
  
  // User profile management
  async getUserProfile(userId: string): Promise<UserProfile>
  async updateUserProfile(userId: string, updates: ProfileUpdates): Promise<void>
  async calculateProfileCompleteness(userId: string): Promise<number>
}
```

#### **3. Tournament Service**
```typescript
class TournamentService {
  // Tournament management
  async startTournament(userId: string, category: string): Promise<TournamentSession>
  async processChoice(sessionId: string, choice: TournamentChoice): Promise<TournamentState>
  async getTournamentResults(sessionId: string): Promise<TournamentResults>
  
  // Image management
  async getRandomImagePairs(category: string, count: number): Promise<ImagePair[]>
  async uploadTournamentImage(imageData: ImageUpload): Promise<TournamentImage>
  async moderateImage(imageId: string): Promise<ModerationResult>
}
```

#### **4. Emotional Analysis Service**
```typescript
class EmotionalAnalysisService {
  // Emotional profiling
  async processQuestionnaire(userId: string, responses: EmotionalResponses): Promise<EmotionalProfile>
  async updateEmotionalState(userId: string, state: EmotionalState): Promise<void>
  async calculateEmotionalCompatibility(user1: string, user2: string): Promise<CompatibilityScore>
  
  // Learning and adaptation
  async recordLearningSession(sessionData: LearningSessionData): Promise<void>
  async updateLearningProfile(userId: string): Promise<void>
  async analyzeEmotionalTrends(userId: string): Promise<EmotionalTrends>
}
```

#### **5. Recommendation Engine**
```typescript
class RecommendationEngine {
  // Core recommendation logic
  async getRecommendations(userId: string, filters?: RecommendationFilters): Promise<Recommendation[]>
  async calculateCompatibilityScore(user1: string, user2: string): Promise<CompatibilityScore>
  async updateAlgorithmWeights(userId: string, feedback: UserFeedback): Promise<void>
  
  // Hybrid scoring
  async hybridScoring(styleScore: number, emotionalScore: number, behavioralScore: number): Promise<number>
  async adaptiveWeightAdjustment(userId: string, interactionHistory: InteractionData[]): Promise<void>
}
```

---

## 🔧 **CONFIGURAÇÃO E DEPLOYMENT**

### **🐳 Docker Architecture**
```dockerfile
# Multi-stage production build
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage  
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### **🔧 Environment Configuration**
```bash
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/matchit
DB_POOL_SIZE=20
DB_TIMEOUT=30000

# Redis Configuration  
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# JWT Configuration
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AWS Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=matchit-images
AWS_CLOUDFRONT_DOMAIN=cdn.matchit.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
METRICS_ENABLED=true
```

### **📊 Monitoring and Observability**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

---

## 🚀 **PERFORMANCE E ESCALABILIDADE**

### **⚡ Otimizações Implementadas**

#### **Database Optimization**
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX CONCURRENTLY idx_tournament_sessions_user_id ON tournament_sessions(user_id);
CREATE INDEX CONCURRENTLY idx_emotional_states_user_recorded ON emotional_states(user_id, recorded_at);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_tournament_choices_session_round ON tournament_choices(session_id, round_number);
CREATE INDEX CONCURRENTLY idx_learning_sessions_user_completed ON learning_sessions(user_id, is_completed);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_style_recommendations_active ON style_recommendations(user_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_tournament_images_active ON tournament_images(category) WHERE is_active = true;
```

#### **Caching Strategy**
```typescript
// Redis caching implementation
class CacheService {
  // User profile caching
  async cacheUserProfile(userId: string, profile: UserProfile, ttl: number = 3600): Promise<void>
  async getUserProfileFromCache(userId: string): Promise<UserProfile | null>
  
  // Tournament data caching
  async cacheTournamentImages(category: string, images: TournamentImage[]): Promise<void>
  async getTournamentImagesFromCache(category: string): Promise<TournamentImage[] | null>
  
  // Recommendation caching
  async cacheRecommendations(userId: string, recommendations: Recommendation[]): Promise<void>
  async invalidateUserCache(userId: string): Promise<void>
}
```

#### **Load Balancing Configuration**
```nginx
# nginx.conf for load balancing
upstream backend {
    least_conn;
    server api1:3000 weight=3;
    server api2:3000 weight=3;
    server api3:3000 weight=2;
    keepalive 32;
}

server {
    listen 80;
    server_name api.matchit.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 1s;
        proxy_send_timeout 1s;
        proxy_read_timeout 1s;
    }
    
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

---

## 🔐 **SEGURANÇA E COMPLIANCE**

### **🛡️ Security Layers**

#### **1. Authentication & Authorization**
```typescript
// JWT middleware implementation
class SecurityMiddleware {
  async authenticateToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  }
  
  async authorizeRole(requiredRole: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
}
```

#### **2. Data Validation & Sanitization**
```typescript
// Input validation schemas
const UserRegistrationSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  age: z.number().min(18).max(100),
  gender: z.enum(['male', 'female', 'other'])
});

const StylePreferenceSchema = z.object({
  category: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.string().min(1)
});
```

#### **3. Rate Limiting & DDoS Protection**
```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  
  // Different limits for different endpoints
  keyGenerator: (req: Request) => {
    if (req.path.startsWith('/auth/')) {
      return `auth:${req.ip}`;
    }
    return req.ip;
  },
  
  // Custom rate limits per endpoint type
  skip: (req: Request) => {
    return req.path === '/health'; // Skip health checks
  }
};
```

---

## 📈 **ANALYTICS E BUSINESS INTELLIGENCE**

### **📊 Data Pipeline Architecture**
```mermaid
graph LR
    subgraph "📱 Data Sources"
        APP[Mobile App Events]
        API[API Server Logs]
        DB[Database Changes]
        EXTERNAL[External APIs]
    end
    
    subgraph "🔄 Data Pipeline"
        COLLECTOR[Event Collector]
        PROCESSOR[Stream Processor]
        VALIDATOR[Data Validator]
    end
    
    subgraph "🗄️ Data Storage"
        WAREHOUSE[Data Warehouse]
        LAKE[Data Lake]
        CACHE[Analytics Cache]
    end
    
    subgraph "📊 Analytics Layer"
        REALTIME[Real-time Analytics]
        BATCH[Batch Processing]
        ML[ML Pipeline]
    end
    
    subgraph "📈 Visualization"
        DASHBOARD[Admin Dashboard]
        REPORTS[Business Reports]
        ALERTS[Automated Alerts]
    end
    
    APP --> COLLECTOR
    API --> COLLECTOR
    DB --> COLLECTOR
    EXTERNAL --> COLLECTOR
    
    COLLECTOR --> PROCESSOR
    PROCESSOR --> VALIDATOR
    VALIDATOR --> WAREHOUSE
    VALIDATOR --> LAKE
    
    WAREHOUSE --> REALTIME
    LAKE --> BATCH
    BATCH --> ML
    
    REALTIME --> DASHBOARD
    BATCH --> REPORTS
    ML --> ALERTS
```

### **📊 Key Performance Indicators (KPIs)**
```typescript
interface SystemKPIs {
  // Performance metrics
  averageResponseTime: number;        // < 200ms target
  errorRate: number;                  // < 0.1% target
  uptime: number;                     // > 99.9% target
  
  // Business metrics  
  dailyActiveUsers: number;
  tournamentCompletionRate: number;   // % of started tournaments completed
  userEngagementScore: number;        // Time spent in app
  matchSuccessRate: number;           // % of matches leading to conversations
  
  // System metrics
  databaseConnections: number;
  cacheHitRate: number;              // > 85% target
  memoryUsage: number;               // < 80% target
  cpuUsage: number;                  // < 70% target
}
```

---

## 🔄 **CI/CD E DEVOPS**

### **🚀 Deployment Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -t matchit-api:${{ github.sha }} .
          docker tag matchit-api:${{ github.sha }} matchit-api:latest
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Deploy logic here
          kubectl apply -f k8s/
          kubectl set image deployment/matchit-api matchit-api=matchit-api:${{ github.sha }}
```

---

## 📞 **CONTATO E SUPORTE**

### **🛠️ Arquitetura Mantida Por:**
- **Lead Architect**: Sistema modular e escalável
- **DevOps Engineer**: Infraestrutura e deployment
- **Database Architect**: Otimização e performance
- **Security Engineer**: Implementação de segurança

### **📚 Documentação Adicional:**
- **API Reference**: `http://localhost:3000/api/docs`
- **Database Schema**: `/docs/database/`
- **Deployment Guide**: `/docs/deployment/`
- **Security Guidelines**: `/docs/security/`

---

**🏗️ Arquitetura robusta e escalável pronta para suportar o crescimento do MatchIt como líder no mercado de dating apps!**

---

**📅 Documento atualizado em**: 28/06/2025  
**🔄 Próxima revisão**: A cada mudança arquitetural significativa  
**📧 Contato técnico**: architecture@matchit.com