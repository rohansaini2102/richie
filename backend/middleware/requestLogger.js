const morgan = require('morgan');
const { logger, logApi } = require('../utils/logger');

// Create a stream for morgan to write to winston
const stream = {
  write: (message) => {
    // Remove trailing newline added by morgan
    logger.info(message.trim());
  }
};

// Custom morgan format for detailed logging
const morganFormat = ':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms - :user-agent';

// Morgan middleware for automatic request logging
const morganMiddleware = morgan(morganFormat, { stream });

// Enhanced request logger middleware with body logging
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'Unknown';
  
  // Log incoming request with detailed information
  logger.info(`🔍 INCOMING REQUEST: ${method} ${url}`, {
    ip,
    userAgent,
    contentType: headers['content-type'],
    contentLength: headers['content-length'],
    authorization: headers['authorization'] ? 'Bearer ***' : 'None',
    timestamp: new Date().toISOString()
  });

  // Log request body for debugging (be careful with sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    
    // Sanitize sensitive fields
    if (sanitizedBody.password) {
      sanitizedBody.password = '***HIDDEN***';
    }
    if (sanitizedBody.casPassword) {
      sanitizedBody.casPassword = '***HIDDEN***';
    }
    
    logger.info(`📦 REQUEST BODY: ${method} ${url}`, {
      body: sanitizedBody,
      bodyKeys: Object.keys(req.body),
      bodySize: JSON.stringify(req.body).length,
      hasPassword: !!req.body.password,
      hasEmail: !!req.body.email
    });
  } else {
    logger.warn(`⚠️ EMPTY BODY: ${method} ${url} - Request body is empty or undefined`, {
      bodyType: typeof req.body,
      bodyValue: req.body
    });
  }

  // Log query parameters if present
  if (req.query && Object.keys(req.query).length > 0) {
    logger.info(`🔗 QUERY PARAMS: ${method} ${url}`, {
      query: req.query
    });
  }

  // Log path parameters if present
  if (req.params && Object.keys(req.params).length > 0) {
    logger.info(`📍 PATH PARAMS: ${method} ${url}`, {
      params: req.params
    });
  }
  
  // Log API request
  logApi.request(method, url, ip, userAgent);
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override res.end to log response
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const advisorId = req.advisor?.id || req.advisor?._id;
    
    // Log response details
    logger.info(`📤 RESPONSE: ${method} ${url} - ${statusCode}`, {
      statusCode,
      duration: `${duration}ms`,
      advisorId,
      responseSize: chunk ? chunk.length : 0,
      timestamp: new Date().toISOString()
    });
    
    // Log response content for errors (sanitized)
    if (statusCode >= 400 && chunk) {
      try {
        const responseData = JSON.parse(chunk.toString());
        logger.error(`❌ ERROR RESPONSE: ${method} ${url}`, {
          statusCode,
          error: responseData,
          duration: `${duration}ms`
        });
      } catch (e) {
        logger.error(`❌ ERROR RESPONSE (Non-JSON): ${method} ${url}`, {
          statusCode,
          response: chunk.toString().substring(0, 500),
          duration: `${duration}ms`
        });
      }
    }
    
    // Log API response
    logApi.response(method, url, statusCode, duration, advisorId);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  // Handle errors
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      const advisorId = req.advisor?.id || req.advisor?._id;
      const errorMessage = typeof data === 'object' ? data.message || 'Unknown error' : data;
      
      logger.error(`💥 API ERROR: ${method} ${url}`, {
        statusCode: res.statusCode,
        error: data,
        advisorId,
        timestamp: new Date().toISOString()
      });
      
      logApi.error(method, url, { message: errorMessage }, advisorId);
    }
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware to add request ID for tracking
const addRequestId = (req, res, next) => {
  req.requestId = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.requestId);
  
  logger.info(`🎯 REQUEST ID: ${req.requestId} for ${req.method} ${req.url}`);
  
  next();
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  const { method, url, ip, headers } = req;
  
  // Log suspicious patterns
  if (url.includes('..') || url.includes('<script>') || url.includes('SELECT')) {
    logger.warn(`🚨 SUSPICIOUS ACTIVITY: Potential path traversal or injection attempt`, {
      ip,
      url,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    require('../utils/logger').logSecurity.suspiciousActivity(
      'Potential path traversal or injection attempt', 
      ip, 
      `URL: ${url}`
    );
  }
  
  // Log multiple failed attempts (this would need rate limiting implementation)
  if (url.includes('/auth/login') && method === 'POST') {
    logger.info(`🔐 LOGIN ATTEMPT: From IP ${ip}`, {
      ip,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Log admin access attempts
  if (url.includes('/admin')) {
    logger.info(`👑 ADMIN ACCESS: ${method} ${url} from IP ${ip}`, {
      ip,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Body parsing validation middleware
const validateRequestBody = (req, res, next) => {
  const { method, url } = req;
  
  // For POST and PUT requests, ensure we have a body when expected
  if ((method === 'POST' || method === 'PUT') && url.includes('/auth/login')) {
    logger.info(`🔍 LOGIN VALIDATION: Checking request body for ${method} ${url}`, {
      hasBody: !!req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodyString: req.body ? JSON.stringify(req.body) : 'undefined',
      rawBody: req.rawBody ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    });
  }
  
  next();
};

module.exports = {
  morganMiddleware,
  requestLogger,
  addRequestId,
  securityLogger,
  validateRequestBody
};