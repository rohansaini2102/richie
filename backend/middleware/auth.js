// backend/middleware/auth.js - Enhanced Authentication Middleware
const jwt = require('jsonwebtoken');
const Advisor = require('../models/Advisor');
const { logger, logAuth, logSecurity } = require('../utils/logger');

// Enhanced logging for authentication events
const AuthLogger = {
  logEvent: (event, data = {}) => {
    const timestamp = new Date().toISOString();
    const logData = {
      event,
      timestamp,
      ...data
    };
    logger.info(`[AUTH_MIDDLEWARE] ${event}`, logData);
  },
  logError: (event, error, data = {}) => {
    const errorData = {
      event,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      timestamp: new Date().toISOString(),
      ...data
    };
    logger.error(`[AUTH_MIDDLEWARE_ERROR] ${event}`, errorData);
  }
};

// Main authentication middleware
const auth = async (req, res, next) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const requestId = `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    AuthLogger.logEvent('AUTH_REQUEST_START', {
      requestId,
      method: req.method,
      path: req.path,
      clientIp,
      userAgent,
      hasAuthHeader: !!req.header('Authorization')
  });
  
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      AuthLogger.logError('AUTH_NO_HEADER', new Error('No authorization header'), {
        requestId,
        method: req.method,
        path: req.path,
        clientIp
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization header provided.'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      AuthLogger.logError('AUTH_INVALID_FORMAT', new Error('Invalid authorization format'), {
          requestId,
        method: req.method,
        path: req.path,
        clientIp,
        authHeaderPrefix: authHeader.substring(0, 10) + '...'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid authorization format.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token || token.length < 10) {
      AuthLogger.logError('AUTH_INVALID_TOKEN', new Error('Invalid token'), {
        requestId,
        method: req.method,
        path: req.path,
        clientIp,
        tokenLength: token ? token.length : 0
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }

    // Verify JWT secret exists
    if (!process.env.JWT_SECRET) {
      AuthLogger.logError('AUTH_NO_JWT_SECRET', new Error('JWT secret not configured'), {
        requestId
      });
      
      return res.status(500).json({
        success: false,
        message: 'Server configuration error.'
    });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    
      AuthLogger.logEvent('AUTH_TOKEN_VERIFIED', {
      requestId,
      advisorId: decoded.id,
        tokenExp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiration',
        clientIp
      });
    } catch (jwtError) {
      let errorMessage = 'Invalid token';
      let errorType = 'AUTH_TOKEN_INVALID';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
        errorType = 'AUTH_TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
        errorType = 'AUTH_TOKEN_MALFORMED';
      }
      
      AuthLogger.logError(errorType, jwtError, {
      requestId,
        method: req.method,
        path: req.path,
        clientIp,
        jwtErrorName: jwtError.name,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      
      return res.status(401).json({
        success: false,
        message: errorMessage
      });
    }

    // Find advisor in database
    const advisor = await Advisor.findById(decoded.id);
    
    if (!advisor) {
      AuthLogger.logError('AUTH_ADVISOR_NOT_FOUND', new Error('Advisor not found'), {
        requestId,
        advisorId: decoded.id,
        clientIp
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. Advisor not found.'
      });
    }

    // Check if advisor account is active
    if (advisor.status !== 'active') {
      AuthLogger.logError('AUTH_ADVISOR_INACTIVE', new Error('Advisor account inactive'), {
        requestId,
        advisorId: advisor._id,
        advisorStatus: advisor.status,
        clientIp
      });
      
      return res.status(401).json({
        success: false,
        message: `Access denied. Account status: ${advisor.status}. Please contact support.`
      });
    }

    // Attach advisor to request object
    req.advisor = {
      id: advisor._id,
      firstName: advisor.firstName,
      lastName: advisor.lastName,
      email: advisor.email,
      firmName: advisor.firmName,
      status: advisor.status,
      isEmailVerified: advisor.isEmailVerified
    };

    const authDuration = Date.now() - startTime;
    
    AuthLogger.logEvent('AUTH_SUCCESS', {
      requestId,
      advisorId: advisor._id,
      advisorEmail: advisor.email,
      advisorName: `${advisor.firstName} ${advisor.lastName}`,
      firmName: advisor.firmName,
      method: req.method,
      path: req.path,
      clientIp,
      authDuration: `${authDuration}ms`
    });

    // Log successful authentication for security monitoring
    logAuth.authSuccess(advisor.email, advisor._id, clientIp);

    next();
  } catch (error) {
    const authDuration = Date.now() - startTime;
    
    AuthLogger.logError('AUTH_UNEXPECTED_ERROR', error, {
      requestId,
      method: req.method,
      path: req.path,
      clientIp,
      authDuration: `${authDuration}ms`
    });

    logger.error('Authentication middleware error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      clientIp
    });

    res.status(500).json({
      success: false,
      message: 'Authentication error occurred.'
    });
  }
};

// Optional authentication middleware (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without setting req.advisor
    AuthLogger.logEvent('OPTIONAL_AUTH_SKIPPED', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader
    });
    return next();
  }

  // Auth provided, validate it
  try {
    await auth(req, res, next);
  } catch (error) {
    // If auth fails in optional context, continue without auth
    AuthLogger.logEvent('OPTIONAL_AUTH_FAILED', {
      method: req.method,
      path: req.path,
      error: error.message
    });
    next();
  }
};

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  const adminToken = req.headers['admin-token'];
  const clientIp = req.ip || req.connection.remoteAddress;
  
  AuthLogger.logEvent('ADMIN_AUTH_REQUEST', {
    method: req.method,
    path: req.path,
    clientIp,
    hasAdminToken: !!adminToken
  });
  
  // For demo purposes, using a simple token check
  // In production, implement proper admin JWT authentication
  if (adminToken === 'admin-session-token') {
    AuthLogger.logEvent('ADMIN_AUTH_SUCCESS', {
      method: req.method,
      path: req.path,
      clientIp
    });
    
    req.admin = {
      id: 'admin',
      username: 'admin',
      role: 'administrator'
    };
    
    next();
  } else {
    AuthLogger.logError('ADMIN_AUTH_FAILED', new Error('Invalid admin token'), {
      method: req.method,
      path: req.path,
      clientIp,
      providedToken: adminToken ? adminToken.substring(0, 10) + '...' : 'None'
    });
    
    logSecurity.suspiciousActivity('Invalid admin access attempt', {
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      path: req.path
    });
    
    return res.status(401).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [ip, data] of attempts.entries()) {
      if (data.lastAttempt < windowStart) {
        attempts.delete(ip);
      }
    }
    
    // Get current attempts for this IP
    const clientAttempts = attempts.get(clientIp) || { count: 0, lastAttempt: now };
    
    // Reset count if outside window
    if (clientAttempts.lastAttempt < windowStart) {
      clientAttempts.count = 0;
    }
    
    // Check if limit exceeded
    if (clientAttempts.count >= maxAttempts) {
      AuthLogger.logError('AUTH_RATE_LIMIT_EXCEEDED', new Error('Rate limit exceeded'), {
        clientIp,
        attempts: clientAttempts.count,
        maxAttempts,
        windowMs,
        method: req.method,
        path: req.path
      });
      
      logSecurity.suspiciousActivity('Authentication rate limit exceeded', {
        ip: clientIp,
        attempts: clientAttempts.count,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Please try again in ${Math.ceil(windowMs / 60000)} minutes.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Increment attempt count
    clientAttempts.count++;
    clientAttempts.lastAttempt = now;
    attempts.set(clientIp, clientAttempts);
    
    AuthLogger.logEvent('AUTH_RATE_LIMIT_CHECK', {
      clientIp,
      currentAttempts: clientAttempts.count,
      maxAttempts,
      method: req.method,
      path: req.path
    });
    
    next();
  };
};

// Middleware to validate specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.advisor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For now, all authenticated advisors have all permissions
    // In the future, you can implement role-based permissions
    AuthLogger.logEvent('PERMISSION_CHECK', {
      advisorId: req.advisor.id,
      requiredPermission: permission,
      method: req.method,
      path: req.path,
      granted: true
    });
    
    next();
  };
};

// Middleware to log API usage for analytics
const logAPIUsage = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    AuthLogger.logEvent('API_USAGE', {
      advisorId: req.advisor?.id || 'anonymous',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success,
      clientIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Export middleware functions
module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.authRateLimit = authRateLimit;
module.exports.requirePermission = requirePermission;
module.exports.logAPIUsage = logAPIUsage;