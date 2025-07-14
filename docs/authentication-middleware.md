# Enhanced Authentication Middleware Documentation

## Overview

The enhanced authentication middleware provides a comprehensive security and monitoring system for the RICHIEAT SaaS platform. It includes multiple middleware functions for different authentication scenarios, rate limiting, admin access, and detailed logging.

## Core Middleware Functions

### 1. Main Authentication Middleware (`auth`)

**Purpose**: Primary authentication middleware for protected routes

**Features**:
- JWT token validation
- Advisor account verification
- Account status checking
- Comprehensive error handling
- Detailed logging with request tracking

**Usage**:
```javascript
const { auth } = require('../middleware/auth');

router.get('/protected-route', auth, controllerFunction);
```

**Request Object Enhancement**:
After successful authentication, `req.advisor` contains:
```javascript
{
  id: advisor._id,
  firstName: advisor.firstName,
  lastName: advisor.lastName,
  email: advisor.email,
  firmName: advisor.firmName,
  status: advisor.status,
  isEmailVerified: advisor.isEmailVerified
}
```

### 2. Optional Authentication (`optionalAuth`)

**Purpose**: Routes that work with or without authentication

**Features**:
- Graceful handling of missing authentication
- Continues processing even if auth fails
- Logs authentication attempts

**Usage**:
```javascript
const { optionalAuth } = require('../middleware/auth');

router.get('/public-or-private', optionalAuth, controllerFunction);
```

### 3. Admin Authentication (`requireAdmin`)

**Purpose**: Admin-only route protection

**Features**:
- Admin token validation
- Security monitoring for unauthorized access attempts
- Admin context in request object

**Usage**:
```javascript
const { requireAdmin } = require('../middleware/auth');

router.get('/admin-only', requireAdmin, adminController);
```

**Request Object Enhancement**:
After successful admin authentication, `req.admin` contains:
```javascript
{
  id: 'admin',
  username: 'admin',
  role: 'administrator'
}
```

### 4. Rate Limiting (`authRateLimit`)

**Purpose**: Prevent brute force attacks on authentication endpoints

**Features**:
- Configurable attempt limits and time windows
- IP-based tracking
- Automatic cleanup of old entries
- Security logging for exceeded limits

**Usage**:
```javascript
const { authRateLimit } = require('../middleware/auth');

// 5 attempts per 15 minutes
router.post('/login', authRateLimit(5, 15 * 60 * 1000), loginController);

// 3 attempts per 15 minutes
router.post('/register', authRateLimit(3, 15 * 60 * 1000), registerController);
```

### 5. Permission Checking (`requirePermission`)

**Purpose**: Role-based access control (future-ready)

**Features**:
- Permission validation framework
- Extensible for future role-based permissions
- Logging of permission checks

**Usage**:
```javascript
const { requirePermission } = require('../middleware/auth');

router.get('/sensitive-data', 
  auth, 
  requirePermission('read:financial_data'), 
  controllerFunction
);
```

### 6. API Usage Logging (`logAPIUsage`)

**Purpose**: Comprehensive API analytics and monitoring

**Features**:
- Request/response timing
- Success/failure tracking
- User agent and IP logging
- Performance monitoring

**Usage**:
```javascript
const { logAPIUsage } = require('../middleware/auth');

router.get('/api-endpoint', auth, logAPIUsage, controllerFunction);
```

## Enhanced Logging System

### AuthLogger Object

The middleware includes a dedicated logging system with structured events:

```javascript
const AuthLogger = {
  logEvent: (event, data = {}) => {
    // Logs successful operations with structured data
  },
  logError: (event, error, data = {}) => {
    // Logs errors with detailed context
  }
};
```

### Logged Events

1. **AUTH_REQUEST_START**: Initial authentication attempt
2. **AUTH_NO_HEADER**: Missing authorization header
3. **AUTH_INVALID_FORMAT**: Malformed authorization header
4. **AUTH_INVALID_TOKEN**: Invalid or short token
5. **AUTH_NO_JWT_SECRET**: Missing JWT configuration
6. **AUTH_TOKEN_VERIFIED**: Successful token verification
7. **AUTH_TOKEN_INVALID**: Invalid JWT token
8. **AUTH_TOKEN_EXPIRED**: Expired JWT token
9. **AUTH_TOKEN_MALFORMED**: Malformed JWT token
10. **AUTH_ADVISOR_NOT_FOUND**: Advisor not in database
11. **AUTH_ADVISOR_INACTIVE**: Inactive advisor account
12. **AUTH_SUCCESS**: Successful authentication
13. **AUTH_UNEXPECTED_ERROR**: Unexpected errors
14. **OPTIONAL_AUTH_SKIPPED**: Optional auth not provided
15. **OPTIONAL_AUTH_FAILED**: Optional auth failed
16. **ADMIN_AUTH_REQUEST**: Admin authentication attempt
17. **ADMIN_AUTH_SUCCESS**: Successful admin authentication
18. **ADMIN_AUTH_FAILED**: Failed admin authentication
19. **AUTH_RATE_LIMIT_EXCEEDED**: Rate limit exceeded
20. **AUTH_RATE_LIMIT_CHECK**: Rate limit check
21. **PERMISSION_CHECK**: Permission validation
22. **API_USAGE**: API endpoint usage

## Security Features

### 1. Token Validation
- JWT signature verification
- Expiration checking
- Format validation
- Secret key validation

### 2. Rate Limiting
- IP-based tracking
- Configurable limits
- Automatic cleanup
- Security alerts

### 3. Error Handling
- Detailed error messages
- Security logging
- Graceful degradation
- Debug information (development only)

### 4. Monitoring
- Request tracking
- Performance metrics
- Security events
- Usage analytics

## Configuration

### Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key-here

# Optional
NODE_ENV=development|production
LOG_LEVEL=info|debug|warn|error
```

### Admin Token Configuration

For production, replace the simple token check with proper JWT authentication:

```javascript
// Current (demo)
if (adminToken === 'admin-session-token') {
  // Grant access
}

// Production (recommended)
const decoded = jwt.verify(adminToken, process.env.ADMIN_JWT_SECRET);
if (decoded.role === 'admin') {
  // Grant access
}
```

## Usage Examples

### Basic Protected Route
```javascript
const { auth } = require('../middleware/auth');

router.get('/clients', auth, (req, res) => {
  // req.advisor is available
  res.json({ clients: [] });
});
```

### Rate Limited Authentication
```javascript
const { authRateLimit } = require('../middleware/auth');

router.post('/login', 
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  loginController
);
```

### Admin Route
```javascript
const { requireAdmin } = require('../middleware/auth');

router.get('/admin/dashboard', requireAdmin, (req, res) => {
  // req.admin is available
  res.json({ adminData: [] });
});
```

### Optional Authentication
```javascript
const { optionalAuth } = require('../middleware/auth');

router.get('/public-data', optionalAuth, (req, res) => {
  if (req.advisor) {
    // Return personalized data
  } else {
    // Return public data
  }
});
```

### Comprehensive Route
```javascript
const { auth, logAPIUsage, requirePermission } = require('../middleware/auth');

router.get('/financial-data',
  auth,
  logAPIUsage,
  requirePermission('read:financial_data'),
  (req, res) => {
    // Fully protected and monitored route
  }
);
```

## Error Responses

### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Access denied. No authorization header provided."
}
```

### Rate Limit Errors (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

### Server Errors (500)
```json
{
  "success": false,
  "message": "Authentication error occurred."
}
```

## Monitoring and Analytics

### Log Files
- `backend/logs/combined.log`: All logs
- `backend/logs/error.log`: Error logs only

### Key Metrics
- Authentication success/failure rates
- API response times
- Rate limit violations
- Security incidents
- User activity patterns

### Security Monitoring
- Failed authentication attempts
- Rate limit violations
- Admin access attempts
- Suspicious activity patterns

## Best Practices

1. **Always use HTTPS** in production
2. **Implement proper JWT secrets** with sufficient entropy
3. **Monitor authentication logs** regularly
4. **Set appropriate rate limits** based on your application needs
5. **Use environment variables** for sensitive configuration
6. **Implement proper admin authentication** for production
7. **Regular security audits** of authentication flows
8. **Monitor for suspicious patterns** in authentication attempts

## Future Enhancements

1. **Role-based permissions** with database storage
2. **Multi-factor authentication** support
3. **Session management** with Redis
4. **Advanced rate limiting** with Redis
5. **Real-time security alerts**
6. **Audit trail** for all authentication events
7. **Integration with external security services**
8. **Advanced threat detection** using ML/AI

## Troubleshooting

### Common Issues

1. **JWT_SECRET not set**: Check environment variables
2. **Token expiration**: Implement token refresh mechanism
3. **Rate limit issues**: Adjust limits based on legitimate usage
4. **Admin access denied**: Verify admin token configuration
5. **Logging issues**: Check log file permissions and disk space

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

This will provide detailed authentication flow information in the logs. 