# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MatchIt is a dating app that combines visual tournaments with emotional AI for meaningful connections. The project uses a monorepo structure with separate backend and frontend applications.

**Key Technology Stack:**
- Backend: Node.js 18+ with Express.js, TypeScript/JavaScript mix
- Frontend: React with Vite, TypeScript 
- Database: PostgreSQL with comprehensive migration system
- Infrastructure: Docker, nginx proxy

## Development Commands

### Core Development
```bash
# Start backend server
npm run backend
# or
npm start

# Start frontend development server  
npm run dev:user

# Start backend in development mode
npm run dev:backend
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:coverage
```

### Build and Lint
```bash
# Currently lint is placeholder - will be configured in Phase 3
npm run lint  # Outputs: "Linting será configurado na Fase 3"
```

## Architecture

### Directory Structure
```
backend/
├── server/           # Main server logic (app.js entry point)
├── services/         # Business logic services
├── routes/           # API route handlers
├── middleware/       # Express middlewares
├── database/         # Migrations and seeds
└── tests/           # Unit tests

frontend.User/
├── src/
│   ├── screens/      # Main application screens
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   ├── context/      # React context providers
│   └── recommendation/ # Recommendation algorithms
└── vite.config.ts    # Vite build configuration

tests/               # Cross-cutting test suites
├── e2e/            # End-to-end tests
├── integration/    # Integration tests
└── performance/    # Load and stress tests
```

### Key Services and Components

**Backend Core Services:**
- `server/services/authService.js` - JWT authentication
- `server/services/TournamentEngine.js` - Tournament game logic
- `server/services/recommendationService.js` - Recommendation engine
- `server/services/emotional-profile-service.js` - Emotional matching

**Frontend Core Components:**
- `EmotionalProfileScreen.tsx` - Emotional questionnaire interface
- `TournamentScreen.tsx` - Visual tournament gameplay
- `MatchAreaScreen.tsx` - Match recommendations display
- `StyleAdjustmentScreen.tsx` - User preference adjustments

**Database:**
- PostgreSQL with comprehensive migration system in `backend/database/migrations/`
- Key schemas: tournaments, emotional profiles, user preferences, analytics
- Well-indexed with 122+ optimized indexes

### API Structure
- Base URL: `http://localhost:3000/api`
- Authentication: JWT tokens
- Key endpoints:
  - `/api/auth/*` - Authentication
  - `/api/profile/*` - User profiles and preferences
  - `/api/tournament/*` - Tournament system
  - `/api/recommendations/*` - Match recommendations

## Development Notes

### Code Patterns
- **Mixed TypeScript/JavaScript**: Backend uses both .js and .ts files
- **Path Aliases**: Backend uses `@models/*` and `@services/*` aliases
- **Frontend**: Uses Vite for development with proxy to backend on port 3000

### Database Operations
- Run migrations from: `backend/database/migrations/`
- Main schema file: `002_complete_style_and_tournament_schema.sql`
- Emotional profile schema: `008_add_emotional_profile_tables.sql`

### Known Issues to Watch
- Multiple backup files exist (auth.js has 5 versions)
- Service duplication between `services/` and `server/services/`
- Mix of import patterns across codebase
- Some broken/backup components in frontend (marked with .BROKEN extensions)

### Testing Strategy
- Mocha for test runner
- Chai for assertions  
- Supertest for API testing
- nyc for coverage reporting
- Tests organized by type: unit, integration, e2e, performance

### Development Workflow
1. Backend runs on port 3000
2. Frontend dev server on port 5173 with API proxy
3. PostgreSQL database required for full functionality
4. Docker setup available in `infraestrutura/` directory

## Production Considerations
- Uses environment variables for configuration
- Docker containers for deployment
- nginx for reverse proxy
- Structured logging with Winston
- Security middleware with helmet and rate limiting