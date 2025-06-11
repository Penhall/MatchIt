#!/bin/bash

# scripts/create-missing-files.sh
# Script para criar os arquivos que estão faltando na estrutura modular

echo "🔧 Criando arquivos faltando da estrutura modular..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_created() { echo -e "${GREEN}✅ $1${NC}"; }
print_exists() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }

# Verificar estrutura
mkdir -p server/{config,middleware,routes,services,utils}
mkdir -p scripts docs

# Função para criar arquivo se não existir
create_if_missing() {
    local file_path="$1"
    local content="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "$content" > "$file_path"
        print_created "Criado: $file_path"
    else
        print_exists "Já existe: $file_path"
    fi
}

print_info "Criando arquivos de middleware faltando..."

# server/middleware/auth.js
create_if_missing "server/middleware/auth.js" '// server/middleware/auth.js - Authentication middleware
import jwt from "jsonwebtoken";
import { config } from "../config/environment.js";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      error: "Access token required",
      code: "MISSING_TOKEN"
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      const errorCode = err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
      return res.status(403).json({ 
        error: "Invalid token",
        code: errorCode,
        message: err.message
      });
    }
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

export { authenticateToken, optionalAuth };'

# server/middleware/configure.js
create_if_missing "server/middleware/configure.js" '// server/middleware/configure.js - Main middleware configuration
import express from "express";
import { configureCors } from "../config/cors.js";
import { requestLogger, timeoutMiddleware } from "./logger.js";
import { isDevelopment } from "../config/environment.js";

const configureMiddleware = (app) => {
  // Basic middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS
  app.use(configureCors());
  
  // Timeout
  app.use(timeoutMiddleware(30000));
  
  // Logging (development only)
  if (isDevelopment()) {
    app.use(requestLogger);
  }
  
  console.log("✅ Middleware configured");
};

export default configureMiddleware;'

# server/middleware/errorHandler.js
create_if_missing "server/middleware/errorHandler.js" '// server/middleware/errorHandler.js - Error handling middleware
import { isDevelopment } from "../config/environment.js";

// 404 Not Found handler
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
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
};'

# server/middleware/logger.js
create_if_missing "server/middleware/logger.js" '// server/middleware/logger.js - Request logging middleware
import { isDevelopment } from "../config/environment.js";

const requestLogger = (req, res, next) => {
  if (isDevelopment()) {
    const start = Date.now();
    
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = "[HIDDEN]";
      console.log("Body:", sanitizedBody);
    }
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
  }
  next();
};

const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ 
          error: "Request timeout",
          code: "TIMEOUT"
        });
      }
    });
    next();
  };
};

export { requestLogger, timeoutMiddleware };'

# server/middleware/validation.js
create_if_missing "server/middleware/validation.js" '// server/middleware/validation.js - Validation middleware
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], req.body);
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: "Required fields missing",
        missing: missing,
        code: "VALIDATION_ERROR"
      });
    }
    next();
  };
};

const validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email) errors.push("Email is required");
  else if (!validateEmail(email)) errors.push("Invalid email format");

  if (!password) errors.push("Password is required");
  else if (!validatePassword(password)) errors.push("Password must be at least 6 characters");

  if (!name) errors.push("Name is required");
  else if (name.trim().length < 2) errors.push("Name must be at least 2 characters");

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid registration data",
      details: errors,
      code: "VALIDATION_ERROR"
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid login data",
      details: errors,
      code: "VALIDATION_ERROR"
    });
  }
  next();
};

export { 
  validateRequired, 
  validateRegistration, 
  validateLogin,
  validateEmail,
  validatePassword
};'

# server/middleware/index.js
create_if_missing "server/middleware/index.js" '// server/middleware/index.js - Exportações centralizadas de middleware
export { authenticateToken, optionalAuth } from "./auth.js";
export { requestLogger, timeoutMiddleware } from "./logger.js";
export { notFoundHandler, errorHandler } from "./errorHandler.js";
export { 
  validateRequired, 
  validateRegistration, 
  validateLogin,
  validateEmail,
  validatePassword 
} from "./validation.js";
export { default as configureMiddleware } from "./configure.js";'

print_info "Criando rotas faltando..."

# server/routes/health.js
create_if_missing "server/routes/health.js" '// server/routes/health.js - Health monitoring routes
import express from "express";
import { pool } from "../config/database.js";
import { config } from "../config/environment.js";

const router = express.Router();

// GET /api/health - Main health check
router.get("/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW() as timestamp, version() as db_version");
    
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: {
        status: "connected",
        host: config.database.host,
        timestamp: dbResult.rows[0].timestamp,
        version: dbResult.rows[0].db_version.split(" ")[0]
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB"
      },
      uptime: Math.round(process.uptime()) + "s"
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: { status: "disconnected" },
      error: error.message
    });
  }
});

// GET /api/info - API information
router.get("/info", (req, res) => {
  res.json({
    name: "MatchIt API",
    version: "1.0.0",
    environment: config.nodeEnv,
    features: config.features
  });
});

// GET /api/ping - Simple ping
router.get("/ping", (req, res) => {
  res.json({ 
    message: "pong",
    timestamp: new Date().toISOString()
  });
});

export default router;'

# server/routes/auth.js
create_if_missing "server/routes/auth.js" '// server/routes/auth.js - Authentication routes
import express from "express";
import { validateRegistration, validateLogin } from "../middleware/validation.js";
import { AuthService } from "../services/authService.js";

const router = express.Router();
const authService = new AuthService();

// POST /api/auth/register - User registration
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

// POST /api/auth/login - User login
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

export default router;'

# Rotas básicas que talvez estejam faltando
create_if_missing "server/routes/matches.js" '// server/routes/matches.js - Match routes
import express from "express";
import { MatchService } from "../services/matchService.js";

const router = express.Router();
const matchService = new MatchService();

// GET /potential - Get potential matches
router.get("/potential", async (req, res) => {
  try {
    const matches = await matchService.getPotentialMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching potential matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET / - Get existing matches
router.get("/", async (req, res) => {
  try {
    const matches = await matchService.getUserMatches(req.user.userId);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST / - Create new match
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

export default router;'

create_if_missing "server/routes/products.js" '// server/routes/products.js - Product routes
import express from "express";
import { ProductService } from "../services/productService.js";

const router = express.Router();
const productService = new ProductService();

// GET / - List products
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

// GET /recommended - Get recommended products
router.get("/recommended", async (req, res) => {
  try {
    const products = await productService.getRecommendedProducts(req.user?.userId);
    res.json(products);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;'

create_if_missing "server/routes/chat.js" '// server/routes/chat.js - Chat routes
import express from "express";
import { ChatService } from "../services/chatService.js";

const router = express.Router();
const chatService = new ChatService();

// GET /:matchId/messages - Get match messages
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

// POST /:matchId/messages - Send message
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

export default router;'

create_if_missing "server/routes/recommendations.js" '// server/routes/recommendations.js - Recommendation routes
import express from "express";
import { RecommendationService } from "../services/recommendationService.js";

const router = express.Router();
const recommendationService = new RecommendationService();

// GET / - Get recommendations
router.get("/", async (req, res) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user.userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /feedback - Record feedback
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

export default router;'

echo ""
print_info "Todos os arquivos essenciais foram criados!"
print_info "Estrutura modular está completa."
echo ""
print_info "Próximos passos:"
echo "1. Verificar se todos os imports estão corretos"
echo "2. Testar o servidor: npm run server"
echo "3. Verificar health check: curl http://localhost:3000/api/health"