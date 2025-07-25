# Security Implementation Overview

## Authentication System

### JWT Implementation
- **Library**: jsonwebtoken v9.0.2
- **Algorithm**: HS256 (HMAC SHA-256)
- **Token Storage**: localStorage (frontend)
- **Expiry**: Configurable (default: 24 hours)
- **Refresh**: Manual re-authentication required

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Minimum Length**: 8 characters
- **Complexity**: Uppercase, number, special character required
- **Storage**: Never stored in plain text
- **Comparison**: Secure bcrypt.compare() method

### Authentication Middleware (backend/middleware/authMiddleware.js)
```javascript
// Key features:
- JWT token verification
- Request ID generation for tracking
- Comprehensive logging
- User context injection (req.user)
- Error handling with detailed logging
```

## Rate Limiting

### Express Rate Limit Configuration
- **Library**: express-rate-limit v6.10.0
- **Storage**: Memory-based (production: Redis recommended)
- **Headers**: Standard rate limit headers sent

### Endpoint-Specific Limits

#### Authentication Endpoints
```javascript
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts',
  standardHeaders: true,
  legacyHeaders: false
}
```

#### Client Invitations
```javascript
{
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 invitations per hour
  keyGenerator: (req) => req.user.id // Per advisor
}
```

#### CAS File Upload
```javascript
{
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  keyGenerator: (req) => req.params.token // Per invitation
}
```

## Input Validation

### Express Validator Integration
- **Library**: express-validator v7.0.1
- **Validation**: Server-side validation for all inputs
- **Sanitization**: HTML entity encoding, trim whitespace
- **Error Handling**: Detailed validation error responses

### Validation Rules Examples

#### Email Validation
```javascript
body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please enter a valid email address')
```

#### Password Validation
```javascript
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
  .withMessage('Password must contain uppercase, number, and special character')
```

#### SEBI Registration Validation
```javascript
body('sebiRegNumber')
  .matches(/^INA[0-9]{9}$/)
  .withMessage('Invalid SEBI registration number format')
```

## XSS Protection

### XSS Library Integration
- **Library**: xss v1.0.14
- **Implementation**: Input sanitization middleware
- **Coverage**: All user-generated content
- **Whitelist**: Allowed HTML tags configuration

### Sanitization Points
- Form submissions
- API request bodies
- Query parameters
- File names and metadata

## CORS Configuration

### Express CORS Setup
```javascript
{
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}
```

## File Upload Security

### Multer Configuration
- **Library**: multer v2.0.1
- **Storage**: Local disk storage with cleanup
- **File Types**: PDF only for CAS files
- **Size Limit**: 50MB maximum
- **Filename**: UUID-based to prevent conflicts

### File Validation
```javascript
{
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
}
```

### File Cleanup
- **Temporary Storage**: Files stored temporarily during processing
- **Auto Cleanup**: Files deleted after successful parsing
- **Error Cleanup**: Files removed even if parsing fails
- **Scheduled Cleanup**: Daily cleanup of orphaned files

## MongoDB Security

### Connection Security
- **Atlas Connection**: TLS/SSL encrypted connections
- **Authentication**: Database user authentication
- **IP Whitelist**: Restricted IP access (production)
- **Connection Pooling**: Secure connection management

### Query Protection
- **Mongoose ODM**: Prevents NoSQL injection
- **Input Sanitization**: express-mongo-sanitize v2.2.0
- **Parameter Validation**: Type checking and validation

### Data Encryption
- **Password Hashing**: bcrypt for all passwords
- **Sensitive Data**: Ready for field-level encryption
- **PAN Numbers**: Encryption planned for compliance

## Environment Security

### Environment Variables
```bash
# Security-related environment variables
JWT_SECRET=strong-random-secret-key
MONGODB_URI=mongodb+srv://user:pass@cluster/db
EMAIL_PASS=app-specific-password
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=5
```

 ### .gitignore Protection
- `.env` files excluded from version control
- `uploads/` directory excluded
- `logs/` directory excluded
- `node_modules/` excluded

## Helmet.js Security Headers (Ready)

### Installed but Not Active
- **Library**: helmet v7.0.0
- **Status**: Installed, ready for activation
- **Configuration**: Prepared for production use

### Planned Headers
```javascript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}
```

## Request Tracking

### Request ID Generation
- **Implementation**: Custom middleware
- **Format**: `REQ_${timestamp}_${random}`
- **Header**: `X-Request-ID` in all responses
- **Logging**: All logs include request ID
- **Tracing**: Full request lifecycle tracking

### Security Event Logging
- **Failed Login Attempts**: IP, timestamp, user agent
- **Rate Limit Violations**: Endpoint, IP, frequency
- **Invalid Tokens**: Token details, request origin
- **File Upload Errors**: File type, size, validation failures

## API Security Best Practices

### Request Validation
- **Content-Type Validation**: Strict content type checking
- **Request Size Limits**: Body parser limits configured
- **Parameter Pollution**: Array parameter handling
- **HTTP Method Validation**: Only allowed methods accepted

### Response Security
- **Information Disclosure**: Error messages sanitized
- **Sensitive Data**: Passwords and tokens excluded from responses
- **CORS Headers**: Properly configured for cross-origin requests
- **Cache Control**: Sensitive endpoints with no-cache headers

## Frontend Security

### Client-Side Protection
- **XSS Prevention**: React's built-in XSS protection
- **Input Sanitization**: Client-side validation
- **Token Storage**: Secure localStorage usage
- **HTTPS Ready**: All external resources HTTPS

### Form Security
- **React Hook Form**: Client-side validation
- **Input Sanitization**: Before server submission
- **File Upload**: Type and size validation
- **CSRF Protection Ready**: Token-based protection planned

## Production Security Checklist

### Immediate Actions Required
- [ ] Activate Helmet.js security headers
- [ ] Configure production CORS origins
- [ ] Set up Redis for rate limiting
- [ ] Enable MongoDB IP whitelist
- [ ] Configure SSL/TLS certificates

### Enhanced Security (Planned)
- [ ] Implement 2FA for advisors
- [ ] Add API key authentication
- [ ] Set up Web Application Firewall
- [ ] Implement advanced threat detection
- [ ] Add field-level encryption
- [ ] Set up security monitoring

## Compliance Considerations

### SEBI Compliance
- **Data Privacy**: Client data access controls
- **Audit Trail**: Comprehensive logging system
- **Regulatory Reporting**: Data export capabilities
- **Advisor Verification**: SEBI number validation

### Data Protection
- **Personal Data**: Minimal collection principle
- **Data Retention**: Configurable retention policies
- **Right to Deletion**: Client data removal capability
- **Data Export**: Structured data export for clients

## Monitoring and Alerting

### Security Monitoring
- **Failed Authentication**: Real-time alerts
- **Rate Limit Violations**: Threshold-based alerts
- **Unusual Activity**: Pattern detection
- **Error Rate Spikes**: Automated monitoring

### Log Analysis
- **Security Events**: Centralized logging
- **Access Patterns**: User behavior analysis
- **Error Tracking**: Error correlation and analysis
- **Performance Impact**: Security overhead monitoring