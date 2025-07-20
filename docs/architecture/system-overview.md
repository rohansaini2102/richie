# RICHIEAT System Architecture Overview

## Technology Stack

### Frontend
- **Framework:** React 19.1.0 with Vite 7.0.0
- **Styling:** Tailwind CSS 4.1.11 (basic configuration)
- **State Management:** Context API (AuthContext)
- **Routing:** React Router v7.6.3
- **Form Handling:** React Hook Form
- **HTTP Client:** Axios with interceptors
- **Notifications:** React Hot Toast
- **Icons:** Lucide React
- **PDF Processing:** pdfjs-dist for client-side PDF handling

### Backend
- **Runtime:** Node.js with Express.js 5.1.0
- **Database:** MongoDB Atlas (Cloud)
- **ODM:** Mongoose 8.16.1 with enhanced middleware hooks
- **Authentication:** JWT + bcrypt with enhanced middleware
- **Email Service:** Nodemailer with Gmail SMTP
- **Logging:** Winston + Morgan with comprehensive event tracking
- **Security:** CORS, Helmet (installed), Express Rate Limit, XSS protection
- **File Processing:** Multiple PDF parsers (pdf-parse, pdf2json, pdfreader)
- **CAS Parsing:** Multi-format support (CDSL, NSDL, CAMS, Karvy)

## System Architecture

### Client-Server Architecture
```
┌─────────────────────┐         ┌──────────────────────┐
│                     │         │                      │
│   React Frontend    │ <-----> │   Express Backend    │
│   (Port 5173)       │  HTTP   │   (Port 5000)        │
│                     │         │                      │
└─────────────────────┘         └──────────────────────┘
                                           │
                                           │ Mongoose
                                           ▼
                                ┌──────────────────────┐
                                │                      │
                                │   MongoDB Atlas      │
                                │   (Cloud Database)   │
                                │                      │
                                └──────────────────────┘
```

## Core Components

### 1. Authentication System
- **JWT-based authentication** with token storage in localStorage
- **Protected routes** using React Router and AuthContext
- **Middleware protection** on backend for API endpoints
- **Session management** with auto-logout on token expiry

### 2. User Management
- **Advisor Model:** Enhanced SEBI-compliant fields with validation
- **Client Model:** Comprehensive financial data structure with CAS integration
- **ClientInvitation Model:** Token-based invitation tracking with CAS data storage

### 3. Email System
- **Gmail SMTP integration** for sending invitations
- **Token-based secure links** with expiry
- **Rate limiting:** 5 invitations per client email
- **Status tracking:** pending, sent, opened, completed
- **Enhanced logging:** Email delivery tracking and error handling

### 4. Enhanced Logging Architecture
```
Winston Logger System
├── Combined Log (all levels)
├── Error Log (errors only)
├── Console Output (development)
└── CAS Event Logger (specialized)

Morgan Middleware
├── HTTP Request logging with request IDs
├── Response time tracking
├── IP address and user agent logging
└── Security event monitoring

CAS Event Logger
├── CAS upload tracking
├── Parsing event monitoring
├── Error categorization
└── Performance metrics
```

### 5. Actual API Structure
```
/api
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /logout
│   ├── GET    /profile
│   └── PUT    /profile
├── /clients
│   ├── /manage
│   │   ├── GET    /         (list clients)
│   │   ├── GET    /:id      (get client)
│   │   ├── PUT    /:id      (update client)
│   │   ├── DELETE /:id      (delete client)
│   │   └── /invitations
│   │       ├── GET  /       (list invitations)
│   │       └── POST /       (send invitation)
│   └── /onboarding
│       ├── GET  /:token     (get form)
│       ├── POST /:token     (submit form)
│       └── /:token/cas
│           ├── POST /upload          (legacy CAS upload)
│           ├── POST /parse           (legacy CAS parse)
│           ├── POST /upload-structured (enhanced CAS upload)
│           ├── POST /parse-structured  (enhanced CAS parse)
│           └── GET  /status          (CAS processing status)
└── /admin
    ├── GET    /dashboard   (admin overview)
    ├── GET    /advisors    (advisor management)
    └── GET    /clients     (client overview)
```

## Security Measures

### Implemented
- **Password hashing** with bcrypt (12 rounds)
- **JWT tokens** with expiry (configurable)
- **Enhanced authentication middleware** with detailed logging
- **CORS configuration** for development origins
- **Environment variables** protection (.gitignore)
- **Input validation** with comprehensive error messages
- **NoSQL injection protection** via Mongoose
- **Rate limiting** on authentication and invitations
- **Request ID tracking** for debugging
- **File upload validation** with size and type limits
- **XSS protection** and input sanitization

### To Be Configured
- **Helmet.js** security headers (installed but not active)
- **HTTPS enforcement** in production
- **Enhanced API rate limiting** for all endpoints
- **2FA authentication** for advisors
- **Advanced threat detection**

## Data Flow

### Client Invitation Flow
1. Advisor sends invitation → Creates ClientInvitation record
2. Email sent with secure token → Client receives email
3. Client clicks link → Token validated, form loaded
4. Client submits form → Client record created
5. Invitation marked complete → Client appears in advisor's list

### Authentication Flow
1. Login with credentials → Validate against database
2. Generate JWT token → Send to client
3. Store token in localStorage → Include in API requests
4. Validate token on each request → Allow/deny access
5. Token expiry → Redirect to login

## CAS Processing System

### CAS Parser Architecture
```
CAS Processing Pipeline
├── File Upload (Multer)
├── Format Detection (Auto)
├── Parser Selection
│   ├── CDSL Parser
│   ├── NSDL Parser
│   ├── CAMS Parser
│   └── Karvy Parser
├── Data Extraction
├── JSON Formatting
└── Database Storage
```

### Supported CAS Formats
- **CDSL** - Central Depository Services Limited
- **NSDL** - National Securities Depository Limited  
- **CAMS** - Computer Age Management Services
- **Karvy** - Karvy Fintech

### OnboardingCASController Features
- **Structured file handling** with comprehensive logging
- **Event tracking** with unique event IDs
- **Temporary data storage** in invitation records
- **Auto-integration** with client records
- **File cleanup** after successful processing
- **Enhanced error handling** with detailed reporting

## Database Schema

### Collections
1. **advisors** - Financial advisor accounts with enhanced SEBI fields
2. **clients** - Client profiles and data with CAS integration
3. **clientinvitations** - Invitation tracking with temporary CAS storage

### Indexes
- Email (unique) on advisors and clients
- Token (unique) on invitations
- Compound indexes for performance
- CAS event tracking indexes for monitoring

### Enhanced ClientInvitation Schema
```javascript
// Additional fields for CAS handling
casUploadData: {
  fileName: String,
  filePath: String,
  fileSize: Number,
  password: String,
  uploadedAt: Date,
  eventId: String
},
casParsedData: {
  type: Object,
  default: null
}
```

## Deployment Considerations

### Frontend
- Build with Vite for production
- Static hosting (Netlify/Vercel)
- Environment-specific configs

### Backend
- Node.js hosting (Heroku/Railway)
- Environment variables in hosting
- MongoDB Atlas connection string

### Production Checklist
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Configure Helmet.js security headers
- [ ] Configure production logging levels
- [ ] Enable MongoDB connection pooling
- [ ] Set up monitoring (PM2/New Relic)
- [ ] Configure email service limits
- [ ] Implement file storage backup strategy
- [ ] Set up CAS processing monitoring
- [ ] Configure rate limiting for all endpoints
- [ ] Implement error alerting system
- [ ] Set up log rotation and archival