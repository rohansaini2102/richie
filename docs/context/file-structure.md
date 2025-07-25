# Complete File Structure Overview

## Root Directory Structure
```
richeai-master/
├── backend/                    # Node.js Express Backend
├── frontend/                   # React Vite Frontend
├── docs/                      # Project Documentation
├── .serena/                   # Serena configuration
└── README.md                  # Project overview
```

## Backend Structure
```
backend/
├── controllers/               # Request handlers
│   ├── authController.js      # Authentication logic
│   ├── clientManagementController.js  # Client CRUD operations
│   └── OnboardingCASController.js     # CAS processing controller
├── middleware/                # Express middleware
│   └── authMiddleware.js      # JWT authentication middleware
├── models/                    # Mongoose schemas
│   ├── Advisor.js            # Advisor model (SEBI-compliant)
│   ├── Client.js             # Client model (967 lines, 7-step onboarding)
│   └── ClientInvitation.js   # Invitation tracking model
├── routes/                    # API route definitions
│   ├── auth.js              # Authentication routes
│   ├── clientManagement.js  # Client management routes
│   ├── clientOnboarding.js  # Onboarding routes
│   └── admin.js             # Admin routes
├── services/                  # Business logic services
│   ├── cas-parser/           # CAS parsing system
│   │   ├── index.js         # Main CAS parser class
│   │   ├── parsers/         # Format-specific parsers
│   │   │   ├── cdsl-parser.js    # CDSL format parser
│   │   │   ├── nsdl-parser.js    # NSDL format parser
│   │   │   ├── cams-parser.js    # CAMS format parser
│   │   │   └── karvy-parser.js   # Karvy format parser
│   │   └── utils/           # Parser utilities
│   │       ├── pdf-reader-pdfjs.js   # PDF processing (334 lines)
│   │       └── json-formatter.js     # Data formatting (525 lines)
│   ├── claudeAiService.js    # Claude AI integration
│   └── pdfGenerator/         # PDF report generation
│       └── goalPlanPdfGenerator.js   # Goal-based plan PDFs
├── utils/                     # Utility functions
│   ├── logger.js             # Winston logging configuration
│   ├── casEventLogger.js     # CAS-specific event logging
│   └── createDirectories.js  # Directory setup utility
├── validators/                # Input validation
│   └── planValidators.js     # Plan validation rules
├── uploads/                   # Temporary file storage
├── logs/                      # Application logs
├── test-cas-parsing.js       # CAS parser test suite (450 lines)
├── test-onboarding-cas.js    # OnboardingCAS integration tests
├── test-auth-middleware.js   # Authentication middleware tests
├── package.json              # Backend dependencies
└── server.js                 # Express server entry point
```

## Frontend Structure
```
frontend/
├── public/                    # Static assets
│   ├── index.html            # Main HTML template
│   └── favicon.ico           # Application icon
├── src/                       # Source code
│   ├── components/           # React components
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.jsx   # Application header
│   │   │   ├── Sidebar.jsx  # Navigation sidebar
│   │   │   └── DashboardLayout.jsx  # Main layout wrapper
│   │   ├── dashboard/       # Dashboard components
│   │   │   ├── MetricCard.jsx    # Statistics display cards
│   │   │   └── ActionCard.jsx    # Quick action buttons
│   │   ├── client/          # Client management components
│   │   │   ├── ClientCard.jsx         # Individual client display
│   │   │   ├── ClientDetailView.jsx   # Detailed client view
│   │   │   ├── ClientList.jsx         # Client listing
│   │   │   └── ClientOnboardingForm.jsx  # Multi-step onboarding
│   │   ├── modals/          # Modal components
│   │   │   └── AddClientModal.jsx     # Client invitation modal
│   │   ├── planning/        # Financial planning components
│   │   │   ├── PlanCreationModal.jsx  # Plan creation interface
│   │   │   ├── goalBased/   # Goal-based planning
│   │   │   │   └── GoalBasedPlanningInterface.jsx  # Main planning interface (657 lines)
│   │   │   ├── cashflow/    # Cash flow planning
│   │   │   │   └── ClientDataPreview.jsx  # Client data review
│   │   │   └── hybrid/      # Hybrid planning approach
│   │   ├── Dashboard.jsx    # Main dashboard component
│   │   ├── Login.jsx        # Login form component
│   │   ├── Home.jsx         # Home page component
│   │   ├── ClientsPage.jsx  # Client management page
│   │   ├── AdvisorProfile.jsx    # Advisor profile component
│   │   ├── AdminLogin.jsx   # Admin login component
│   │   ├── AdminDashboard.jsx    # Admin dashboard
│   │   └── ProtectedRoute.jsx    # Route protection wrapper
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx  # Authentication context
│   ├── services/            # API services
│   │   └── api.js          # Axios API configuration
│   ├── utils/               # Utility functions
│   │   └── casParser.js    # Frontend CAS parser (672 lines)
│   ├── test/                # Test utilities
│   │   └── test-utils.jsx  # Testing helper functions
│   ├── App.jsx              # Main App component
│   └── main.jsx            # Application entry point
├── node_modules/             # Frontend dependencies
├── package.json             # Frontend dependencies
├── package-lock.json        # Dependency lock file
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── eslint.config.js        # ESLint configuration
└── index.html              # Vite HTML template
```

## Documentation Structure
```
docs/
├── context/                  # Project context files (THIS FOLDER)
│   ├── project-overview.md   # Overall project information
│   ├── backend-architecture.md    # Backend technical details
│   ├── frontend-architecture.md   # Frontend technical details
│   ├── cas-parsing-system.md      # CAS parsing documentation
│   ├── database-models.md         # Database schema details
│   ├── api-endpoints.md           # API documentation
│   ├── security-implementation.md # Security features
│   ├── ai-integration.md          # Claude AI integration
│   └── file-structure.md          # This file
├── architecture/            # Technical architecture
│   └── system-overview.md   # System architecture overview
├── claude/                  # AI conversation memory
│   └── session-memory.md    # AI conversation history
├── progress/                # Progress tracking
│   ├── project-progress.md  # Current progress status
│   └── work-history.md     # Detailed work history
├── flow/                    # Planning and workflow docs
│   ├── cash-flow-planning.md           # Cash flow planning docs
│   ├── data-mapping.md                 # Data mapping specifications
│   ├── financial-planning-flow.md      # Planning workflow
│   ├── goal-based-planning.md          # Goal-based planning docs
│   ├── hybrid-planning-approach.md     # Hybrid planning methodology
│   ├── hybrid-planning-detailed-specification.md  # Detailed hybrid specs
│   ├── hybrid-planning-wireframes.md   # UI wireframes
│   └── ui-wireframes.md                # General UI wireframes
├── AI_SETUP.md              # AI setup documentation
├── OnboardingCASController.md    # CAS controller documentation
├── PRD.md                   # Product Requirements Document (1,350+ lines)
├── README.md                # Documentation overview
├── authentication-middleware.md  # Auth middleware docs
├── form-improvements-summary.md  # Form enhancement notes
├── form-issue-finder.md     # Form issue tracking
├── form-validation-analysis.md   # Validation analysis
├── issue-resolution-summary.md   # Issue resolution tracking
└── user-guide-form-completion.md # User guide for forms
```

## Key File Details

### Large/Complex Files
- **Client.js**: 967 lines - Comprehensive client data model
- **GoalBasedPlanningInterface.jsx**: 657 lines - Main planning interface
- **casParser.js**: 672 lines - Frontend PDF parsing
- **test-cas-parsing.js**: 450 lines - Comprehensive test suite
- **pdf-reader-pdfjs.js**: 334 lines - PDF processing utility
- **json-formatter.js**: 525 lines - Data formatting utility
- **PRD.md**: 1,350+ lines - Complete product requirements

### Configuration Files
- **package.json** (Backend): Express 5.1.0, Mongoose 8.16.1, extensive PDF libraries
- **package.json** (Frontend): React 19.1.0, Vite 7.0.0, Material-UI 7.2.0
- **tailwind.config.js**: Tailwind CSS 4.1.11 configuration
- **vite.config.js**: Vite 7.0.0 build configuration

### Test Files
- **test-cas-parsing.js**: 6-category test suite with performance benchmarks
- **test-onboarding-cas.js**: Integration tests for CAS onboarding
- **test-auth-middleware.js**: Authentication middleware tests
- **test-utils.jsx**: Frontend testing utilities with mocks

### Critical Business Logic Files
- **CAS Parser System**: Multi-format PDF parsing with intelligent detection
- **Client Onboarding**: 7-step comprehensive onboarding process
- **Authentication System**: JWT + bcrypt with comprehensive middleware
- **Planning System**: Goal-based and hybrid planning approaches
- **AI Integration**: Claude AI service for financial recommendations

### Security Files
- **authMiddleware.js**: Request ID generation, logging, JWT verification
- **validators/**: Input validation and sanitization
- **Security configuration**: Rate limiting, CORS, XSS protection

### Logging Files
- **logger.js**: Winston configuration with multiple log levels
- **casEventLogger.js**: Specialized CAS operation tracking
- **logs/**: Application log storage directory

### Utility Files
- **createDirectories.js**: Initial directory setup
- **PDF processing utilities**: Multiple PDF parsing approaches
- **API configuration**: Axios interceptors and error handling

## File Naming Conventions

### Backend (Node.js)
- **Controllers**: `camelCase` + "Controller.js" (e.g., `authController.js`)
- **Models**: `PascalCase` + ".js" (e.g., `Client.js`)
- **Routes**: `camelCase` + ".js" (e.g., `clientManagement.js`)
- **Services**: `camelCase` + "Service.js" (e.g., `claudeAiService.js`)
- **Utilities**: `camelCase` + ".js" (e.g., `casEventLogger.js`)
- **Tests**: `test-` + `kebab-case` + ".js" (e.g., `test-cas-parsing.js`)

### Frontend (React)
- **Components**: `PascalCase` + ".jsx" (e.g., `GoalBasedPlanningInterface.jsx`)
- **Pages**: `PascalCase` + ".jsx" (e.g., `ClientsPage.jsx`)
- **Utilities**: `camelCase` + ".js" (e.g., `casParser.js`)
- **Context**: `PascalCase` + "Context.jsx" (e.g., `AuthContext.jsx`)
- **Tests**: `test-utils.jsx` for utilities

### Documentation
- **Markdown Files**: `kebab-case` + ".md" (e.g., `project-overview.md`)
- **Specifications**: Descriptive names (e.g., `hybrid-planning-detailed-specification.md`)
- **Technical Docs**: Clear, descriptive names (e.g., `authentication-middleware.md`)

## Import/Export Patterns

### Backend (CommonJS)
```javascript
// Exports
module.exports = ModelName;
module.exports = { functionName, anotherFunction };

// Imports
const ModelName = require('./models/ModelName');
const { functionName } = require('./utils/helpers');
```

### Frontend (ES Modules)
```javascript
// Exports
export default ComponentName;
export { namedFunction, anotherFunction };

// Imports
import ComponentName from './components/ComponentName';
import { namedFunction } from './utils/helpers';
```

## Development Workflow Files
- **.gitignore**: Excludes node_modules, .env, uploads, logs
- **package-lock.json**: Dependency version locking
- **eslint.config.js**: Code quality rules
- **README.md**: Project setup and overview

This file structure represents a production-ready, enterprise-level financial advisory platform with comprehensive features, security measures, and extensive documentation.