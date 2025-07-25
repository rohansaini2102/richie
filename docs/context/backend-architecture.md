# Backend Architecture Overview

## Technology Stack
- **Runtime**: Node.js with Express.js 5.1.0
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose 8.16.1 with enhanced middleware
- **Authentication**: JWT + bcrypt (12 rounds)
- **Email Service**: Nodemailer with Gmail SMTP
- **Logging**: Winston + Morgan with event tracking
- **Security**: CORS, Helmet (installed), Express Rate Limit, XSS protection
- **File Processing**: Multiple PDF parsers (pdf-parse, pdf2json, pdfreader, pdfjs-dist)

## Key Models

### Advisor Model (backend/models/Advisor.js)
- Enhanced SEBI-compliant fields
- Professional information (ARN, EUIN, PPB numbers)
- Business address and contact details
- Password hashing with bcrypt middleware
- Email verification status

### Client Model (backend/models/Client.js) - 967 lines
- Comprehensive 7-step onboarding process
- Personal information with validation
- Income and employment details
- Financial goals and retirement planning
- CAS data integration
- Debts, assets, and liabilities tracking
- Insurance information
- Risk profile assessment

### ClientInvitation Model (backend/models/ClientInvitation.js)
- Token-based invitation system
- Email tracking and status
- Temporary CAS data storage
- Expiry management

## Controllers

### AuthController (backend/controllers/authController.js)
- JWT-based authentication
- Password hashing and validation
- Token generation and verification
- Enhanced error handling

### ClientManagementController (backend/controllers/clientManagementController.js)
- CRUD operations for clients
- Invitation management
- Client data retrieval and updates

### OnboardingCASController (backend/controllers/OnboardingCASController.js)
- Structured CAS file handling
- Multi-format parsing support
- Event logging with tracking IDs
- Temporary data storage in invitations
- Auto-integration with client records

## Services

### CAS Parser (backend/services/cas-parser/)
- Multi-format support: CDSL, NSDL, CAMS, Karvy
- Intelligent format detection
- Advanced PDF processing
- JSON formatting and validation
- Comprehensive error handling

### Claude AI Service (backend/services/claudeAiService.js)
- Debt analysis and recommendations
- Goal-based planning assistance
- Client data formatting for AI analysis
- Prompt management system

### PDF Generator (backend/services/pdfGenerator/)
- Goal-based plan PDF generation
- Professional document formatting
- Charts and visualizations

## Middleware

### Authentication Middleware (backend/middleware/authMiddleware.js)
- JWT token verification
- Request ID generation
- Comprehensive logging
- Error tracking

### Security Middleware
- Rate limiting (5 requests per 15 minutes for auth)
- Input validation with express-validator
- XSS protection
- CORS configuration

## Logging System

### Winston Logger (backend/utils/logger.js)
- Multiple log levels (error, warn, info, debug)
- File-based logging with rotation
- Console output for development
- Structured JSON formatting

### CAS Event Logger (backend/utils/casEventLogger.js)
- Specialized CAS operation tracking
- Event categorization
- Performance metrics
- Error correlation

### Morgan HTTP Logging
- Request/response logging
- Custom format with request IDs
- IP address and user agent tracking
- Response time monitoring

## Security Features
- Password hashing with bcrypt (12 rounds)
- JWT tokens with configurable expiry
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- XSS protection middleware
- CORS configuration
- Environment variable protection
- File upload validation

## Testing Framework
- Jest for unit testing
- Supertest for API testing
- Comprehensive CAS parser test suite
- Mock data and utilities
- Performance benchmarking