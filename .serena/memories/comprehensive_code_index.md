# RichieAI Comprehensive Code Index

## Backend Architecture Overview

### Controllers (API Logic)
- **advisorController.js**: Advisor auth, profile management, JWT token handling
- **clientController.js**: Client management, invitations, CAS upload/parsing, form handling
- **OnboardingCASController.js**: Dedicated CAS file upload controller with Multer
- **planController.js**: Financial planning, AI recommendations, debt/goal analysis
- **adminController.js**: Admin dashboard, advisor management, system stats

### Models (Database Schemas)
- **Advisor.js**: Advisor schema with bcrypt password hashing, profile management
- **Client.js**: Client schema with CAS data, form drafts, asset allocation calculations
- **ClientInvitation.js**: Invitation system with token generation, expiry tracking
- **FinancialPlan.js**: Financial planning with snapshots, performance metrics

### Services (Business Logic)
- **cas-parser/**: Multi-format CAS parsing system
  - **index.js**: Main CASParser class
  - **parsers/**: Format-specific parsers (CDSL, NSDL, CAMS, Karvy)
  - **utils/**: PDF reading, JSON formatting utilities
- **claudeAiService.js**: AI integration for financial recommendations

### Middleware (Request Processing)
- **auth.js**: JWT authentication, rate limiting, admin permissions
- **serverSetup.js**: Express setup, CORS, security headers, error handling
- **requestLogger.js**: Request logging with Morgan, security tracking
- **performanceLogger.js**: Performance monitoring, system metrics
- **userActivityLogger.js**: User interaction tracking, frontend log ingestion

### Routes (API Endpoints)
- **auth.js**: `/api/auth/*` - Authentication endpoints
- **clients.js**: `/api/clients/*` - Client management, CAS upload
- **plans.js**: `/api/plans/*` - Financial planning operations
- **admin.js**: `/api/admin/*` - Administrative functions
- **logging.js**: `/api/logs/*` - Logging and metrics endpoints

### Utilities
- **comprehensiveLogger.js**: Winston-based comprehensive logging system
- **logger.js**: Basic logging utilities
- **casEventLogger.js**: Specialized CAS operation logging
- **createDirectories.js**: Directory structure creation

## Frontend Architecture Overview

### Services (API Integration)
- **api.js**: Axios-based API client with interceptors
  - **authAPI**: Authentication services
  - **clientAPI**: Client management services
  - **planAPI**: Financial planning services
  - **adminAPI**: Admin dashboard services
  - **healthAPI**: Health check services
- **Logger.js**: Frontend logging service with levels and types

### Component Structure
The frontend follows a modular React component architecture with:
- **components/**: Reusable UI components organized by feature
- **contexts/**: React context providers for state management
- **hooks/**: Custom React hooks for shared logic
- **utils/**: Frontend utility functions

## Key Integration Points

### Authentication Flow
1. **Frontend**: Login form → `authAPI.login()`
2. **Backend**: `loginAdvisor()` → JWT token generation
3. **Middleware**: `auth.js` validates JWT on protected routes
4. **Storage**: JWT stored in localStorage, auto-refresh handling

### CAS Processing Flow
1. **Upload**: `OnboardingCASController.upload()` with Multer
2. **Parse**: `CASParser` detects format and delegates to specific parser
3. **Store**: Parsed data saved to Client model `casData` field
4. **Display**: Frontend fetches via `clientAPI.getCASData()`

### Financial Planning Flow
1. **Create**: `planController.createPlan()` with validation
2. **AI Analysis**: `claudeAiService.js` generates recommendations
3. **Store**: Plan saved with snapshots and change history
4. **Monitor**: Performance metrics and review scheduling

### Logging Architecture
- **Backend**: Winston-based multi-level logging to files
- **Frontend**: Browser console + API endpoint logging
- **Integration**: Frontend logs sent to backend via `/api/logs/event`
- **Monitoring**: Performance metrics, error tracking, user analytics

## Database Schema Relationships
- **Advisor** ← (1:many) → **Client**
- **Client** ← (1:many) → **FinancialPlan**
- **Advisor** ← (1:many) → **ClientInvitation**
- **Client** ← (1:1) → **CAS Data** (embedded)

## Security Features
- JWT authentication with refresh tokens
- bcrypt password hashing
- Rate limiting on auth endpoints
- CORS configuration
- Request validation and sanitization
- Comprehensive security logging