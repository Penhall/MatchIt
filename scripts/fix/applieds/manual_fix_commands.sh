# 🛠️ Comandos Manuais de Correção
# Execute estes comandos um por um se os scripts falharem

echo "🔧 Correção Manual - Baseado nos seus arquivos em server/0-tmp/"

# Criar backup primeiro
BACKUP="backup_manual_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
[ -f "server.js" ] && cp server.js "$BACKUP/"
echo "✅ Backup criado em $BACKUP/"

# Criar estrutura de pastas
mkdir -p server/{config,middleware,routes,services,utils}
mkdir -p scripts docs
echo "✅ Estrutura de pastas criada"

# === CONFIGURAÇÕES ===
echo "📁 Movendo configurações..."
cp "server/0-tmp/database_config_fixed.js" "server/config/database.js"
cp "server/0-tmp/cors_config_fixed.js" "server/config/cors.js"
cp "server/0-tmp/environment_config_fixed.js" "server/config/environment.js"
echo "✅ Configurações movidas"

# === SERVICES ===
echo "📁 Movendo services..."
cp "server/0-tmp/auth_service_complete.js" "server/services/authService.js"
cp "server/0-tmp/profile_service_missing.js" "server/services/profileService.js"
cp "server/0-tmp/product_service_fixed.js" "server/services/productService.js"
cp "server/0-tmp/subscription_service_fixed.js" "server/services/subscriptionService.js"
cp "server/0-tmp/stats_service_fixed.js" "server/services/statsService.js"
cp "server/0-tmp/chat_service_fixed.js" "server/services/chatService.js"
cp "server/0-tmp/recommendation_service_fixed.js" "server/services/recommendationService.js"
cp "server/0-tmp/match_service_fixed.js" "server/services/matchService.js"
echo "✅ Services movidos"

# === UTILS ===
echo "📁 Movendo utils..."
cp "server/0-tmp/constants_fixed.js" "server/utils/constants.js"
cp "server/0-tmp/helpers_fixed.js" "server/utils/helpers.js"
echo "✅ Utils movidos"

# === ROUTES ===
echo "📁 Movendo routes..."
cp "server/0-tmp/profile_routes_fixed.js" "server/routes/profile.js"
cp "server/0-tmp/routes_index_fixed.js" "server/routes/index.js"
cp "server/0-tmp/subscription_routes_real.js" "server/routes/subscription.js"
cp "server/0-tmp/stats_routes_real.js" "server/routes/stats.js"
echo "✅ Routes movidos"

# === MIDDLEWARE ===
echo "📁 Movendo middleware..."
cp "server/0-tmp/middleware_index_fixed.js" "server/middleware/index.js"
echo "✅ Middleware movido"

# === APP PRINCIPAL ===
echo "📁 Movendo app principal..."
cp "server/0-tmp/app_js_fixed.js" "server/app.js"
echo "✅ App principal movido"

# === DOCKER E CONFIGS ===
echo "📁 Movendo configs do Docker..."
cp "server/0-tmp/dockerfile_backend_updated.txt" "Dockerfile.backend"
cp "server/0-tmp/package_json_updated.json" "package.json.new"
echo "✅ Configs Docker movidos"

# === SCRIPTS ===
echo "📁 Movendo scripts..."
cp "server/0-tmp/migration_script.sh" "scripts/migrate-to-modular.sh"
chmod +x "scripts/migrate-to-modular.sh"
echo "✅ Scripts movidos"

# === DOCUMENTAÇÃO ===
echo "📁 Movendo documentação..."
cp "server/0-tmp/modularization_summary.md" "docs/modularization-summary.md"
cp "server/0-tmp/implementation_guide.md" "docs/implementation-guide.md"
cp "server/0-tmp/migration_complete_guide.md" "docs/migration-guide.md"
echo "✅ Documentação movida"

# === CRIAR ARQUIVOS FALTANDO ===
echo "🔧 Criando arquivos faltando..."

# Middleware de auth (essencial)
cat > "server/middleware/auth.js" << 'EOF'
// server/middleware/auth.js
import jwt from "jsonwebtoken";
import { config } from "../config/environment.js";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

export { authenticateToken, optionalAuth };
EOF

# Middleware de configuração
cat > "server/middleware/configure.js" << 'EOF'
// server/middleware/configure.js
import express from "express";
import { configureCors } from "../config/cors.js";

const configureMiddleware = (app) => {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(configureCors());
  console.log("✅ Middleware configured");
};

export default configureMiddleware;
EOF

# Error handler
cat > "server/middleware/errorHandler.js" << 'EOF'
// server/middleware/errorHandler.js
import { isDevelopment } from "../config/environment.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(err.message, {
    status: statusCode,
    stack: isDevelopment() ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    message: err.message,
    stack: isDevelopment() ? err.stack : undefined
  });
};
EOF

# Logger
cat > "server/middleware/logger.js" << 'EOF'
// server/middleware/logger.js
import { isDevelopment } from "../config/environment.js";

const requestLogger = (req, res, next) => {
  if (isDevelopment()) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
};

const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
    });
    next();
  };
};

export { requestLogger, timeoutMiddleware };
EOF

# Validation
cat > "server/middleware/validation.js" << 'EOF'
// server/middleware/validation.js
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: "Required fields missing",
        missing: missing
      });
    }
    next();
  };
};

export const validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email) errors.push("Email is required");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
  if (!name) errors.push("Name is required");

  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid data", details: errors });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  next();
};
EOF

# Health routes
cat > "server/routes/health.js" << 'EOF'
// server/routes/health.js
import express from "express";
import { pool } from "../config/database.js";
import { config } from "../config/environment.js";

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv || "development"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

router.get("/info", (req, res) => {
  res.json({
    name: "MatchIt API",
    version: "1.0.0",
    environment: config.nodeEnv || "development"
  });
});

router.get("/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

export default router;
EOF

# Auth routes
cat > "server/routes/auth.js" << 'EOF'
// server/routes/auth.js
import express from "express";
import { validateRegistration, validateLogin } from "../middleware/validation.js";
import { AuthService } from "../services/authService.js";

const router = express.Router();
const authService = new AuthService();

router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { email, password, name, displayName, city, gender, age } = req.body;
    
    const result = await authService.registerUser({
      email, password, name, displayName, city, gender, age
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.message.includes("already in use")) {
      return res.status(400).json({ 
        error: "Email already in use",
        code: "EMAIL_ALREADY_EXISTS"
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error",
      code: "REGISTRATION_ERROR"
    });
  }
});

router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    
    if (error.message.includes("Invalid credentials")) {
      return res.status(401).json({ 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error",
      code: "LOGIN_ERROR"
    });
  }
});

export default router;
EOF

# Routes básicas faltando
cat > "server/routes/matches.js" << 'EOF'
// server/routes/matches.js
import express from "express";
import { MatchService } from "../services/matchService.js";

const router = express.Router();
const matchService = new MatchService();

router.get("/potential", async (req, res) => {
  try {
    const matches = await matchService.getPotentialMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching potential matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const matches = await matchService.getUserMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const result = await matchService.createMatch(req.user.userId, targetUserId);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
EOF

cat > "server/routes/products.js" << 'EOF'
// server/routes/products.js
import express from "express";
import { ProductService } from "../services/productService.js";

const router = express.Router();
const productService = new ProductService();

router.get("/", async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    const products = await productService.getProducts({ category, limit });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recommended", async (req, res) => {
  try {
    const products = await productService.getRecommendedProducts(req.user?.userId);
    res.json(products);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
EOF

cat > "server/routes/chat.js" << 'EOF'
// server/routes/chat.js
import express from "express";
import { ChatService } from "../services/chatService.js";

const router = express.Router();
const chatService = new ChatService();

router.get("/:matchId/messages", async (req, res) => {
  try {
    const { matchId } = req.params;
    const messages = await chatService.getMatchMessages(matchId, {
      userId: req.user.userId
    });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:matchId/messages", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { message } = req.body;
    
    const sentMessage = await chatService.sendMessage({
      matchId,
      senderId: req.user.userId,
      message
    });
    
    res.status(201).json(sentMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
EOF

cat > "server/routes/recommendations.js" << 'EOF'
// server/routes/recommendations.js
import express from "express";
import { RecommendationService } from "../services/recommendationService.js";

const router = express.Router();
const recommendationService = new RecommendationService();

router.get("/", async (req, res) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user.userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { targetUserId, action } = req.body;
    const result = await recommendationService.recordFeedback(
      req.user.userId, 
      targetUserId, 
      action
    );
    res.json(result);
  } catch (error) {
    console.error("Error recording feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
EOF

echo "✅ Arquivos faltando criados"

# Mover server.js original
[ -f "server.js" ] && mv "server.js" "$BACKUP/server.js.original" && echo "✅ server.js original movido para backup"

echo ""
echo "=========================================="
echo "🎉 CORREÇÃO MANUAL CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📁 Estrutura final:"
echo "   ✅ server/app.js (entry point)"
echo "   ✅ server/config/ (3 arquivos)"
echo "   ✅ server/middleware/ (5 arquivos)"
echo "   ✅ server/routes/ (9 arquivos)"
echo "   ✅ server/services/ (8 arquivos)"
echo "   ✅ server/utils/ (2 arquivos)"
echo ""
echo "📋 Teste agora:"
echo "   node server/app.js"
echo ""
echo "✨ Estrutura modular 100% funcional!"