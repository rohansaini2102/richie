const jwt = require('jsonwebtoken');
const Advisor = require('../models/Advisor');
const { logger, logAuth, logSecurity } = require('../utils/logger');

const auth = async (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const { method, url } = req;
  const requestId = req.requestId || 'unknown';
  
  logger.info(`🔐 AUTH MIDDLEWARE: Starting authentication for ${method} ${url}`, {
    requestId,
    ip: clientIp,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    logger.info(`🎫 TOKEN CHECK: Authorization header analysis`, {
      requestId,
      hasAuthHeader: !!authHeader,
      authHeaderType: typeof authHeader,
      authHeaderLength: authHeader ? authHeader.length : 0,
      startsWithBearer: authHeader ? authHeader.startsWith('Bearer ') : false,
      fullHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'None'
    });
    
    if (!authHeader) {
      logger.warn(`❌ AUTH FAILED: No token provided for ${method} ${url} from IP: ${clientIp}`, {
        requestId,
        reason: 'No Authorization header'
      });
      logSecurity.authorizationFailure('unknown', url, method);
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
        debug: {
          requestId,
          issue: 'Missing Authorization header',
          expected: 'Bearer <token>'
        }
      });
    }

    // Check if token starts with 'Bearer '
    let actualToken = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      actualToken = authHeader.slice(7);
    } else {
      logger.warn(`⚠️ TOKEN FORMAT: Authorization header does not start with 'Bearer '`, {
        requestId,
        authHeader: `${authHeader.substring(0, 20)}...`,
        suggestion: 'Token should be in format: Bearer <token>'
      });
    }

    logger.info(`🔍 TOKEN VERIFICATION: Attempting to verify JWT token`, {
      requestId,
      tokenLength: actualToken.length,
      tokenPrefix: actualToken.substring(0, 10) + '...',
      jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing'
    });

    // Verify token
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    logger.info(`✅ TOKEN DECODED: JWT verification successful`, {
      requestId,
      advisorId: decoded.id,
      tokenExp: new Date(decoded.exp * 1000).toISOString(),
      tokenIat: new Date(decoded.iat * 1000).toISOString(),
      tokenValid: decoded.exp > Date.now() / 1000
    });
    
    // Find advisor by ID
    logger.info(`👤 ADVISOR LOOKUP: Searching for advisor in database`, {
      requestId,
      advisorId: decoded.id
    });
    
    const advisor = await Advisor.findById(decoded.id);
    
    if (!advisor) {
      logger.warn(`❌ ADVISOR NOT FOUND: Advisor ${decoded.id} not found in database`, {
        requestId,
        advisorId: decoded.id,
        method,
        url,
        ip: clientIp
      });
      logSecurity.authorizationFailure(decoded.id, url, method);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - advisor not found',
        debug: {
          requestId,
          advisorId: decoded.id,
          issue: 'Advisor not found in database'
        }
      });
    }

    logger.info(`👤 ADVISOR FOUND: Advisor retrieved from database`, {
      requestId,
      advisorId: advisor._id,
      advisorEmail: advisor.email,
      advisorStatus: advisor.status,
      advisorName: advisor.name
    });

    // Check if account is active
    if (advisor.status !== 'active') {
      logger.warn(`❌ ACCOUNT INACTIVE: Account ${advisor._id} status is ${advisor.status}`, {
        requestId,
        advisorId: advisor._id,
        advisorEmail: advisor.email,
        status: advisor.status,
        method,
        url,
        ip: clientIp
      });
      logSecurity.authorizationFailure(advisor._id, url, method);
      return res.status(401).json({
        success: false,
        message: 'Account is not active',
        debug: {
          requestId,
          advisorId: advisor._id,
          status: advisor.status,
          issue: 'Account not active'
        }
      });
    }

    // Log successful authentication
    logAuth.tokenValidation(advisor._id, 'success');
    logger.info(`✅ AUTH SUCCESS: Authentication successful for advisor ${advisor._id}`, {
      requestId,
      advisorId: advisor._id,
      advisorEmail: advisor.email,
      method,
      url,
      ip: clientIp,
      timestamp: new Date().toISOString()
    });

    // Add advisor to request object
    req.advisor = advisor;
    next();
    
  } catch (error) {
    logger.error(`💥 AUTH ERROR: Authentication middleware error for ${method} ${url}`, {
      requestId,
      ip: clientIp,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    if (error.name === 'JsonWebTokenError') {
      logger.error(`🔑 JWT ERROR: Invalid token format or signature`, {
        requestId,
        errorMessage: error.message,
        suggestion: 'Token may be malformed or using wrong secret'
      });
      logSecurity.authorizationFailure('unknown', url, 'Invalid token');
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
        debug: {
          requestId,
          issue: 'Invalid JWT token',
          error: error.message
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.error(`⏰ TOKEN EXPIRED: JWT token has expired`, {
        requestId,
        expiredAt: error.expiredAt,
        suggestion: 'User needs to login again'
      });
      logSecurity.authorizationFailure('unknown', url, 'Token expired');
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        debug: {
          requestId,
          issue: 'Token expired',
          expiredAt: error.expiredAt
        }
      });
    }

    // Generic server error
    logger.error(`🚨 SERVER ERROR: Unexpected error in auth middleware`, {
      requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      debug: {
        requestId,
        issue: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      }
    });
  }
};

module.exports = auth;