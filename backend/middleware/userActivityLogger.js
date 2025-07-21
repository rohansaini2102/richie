// Enhanced user activity logging middleware
const comprehensiveLogger = require('../utils/comprehensiveLogger');

/**
 * Middleware to log all user activities and API interactions
 */
const userActivityLogger = (options = {}) => {
  const {
    logRequestBody = true,
    logResponseBody = false,
    logHeaders = false,
    excludePaths = ['/api/logs', '/health'],
    excludeHeaders = ['authorization', 'cookie', 'x-api-key'],
    maxBodySize = 10000 // Max characters to log for request/response body
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Extract request metadata
    const requestMetadata = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      origin: req.get('Origin'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      requestId: req.requestId || generateRequestId(),
      sessionId: req.session?.id || extractSessionId(req),
      userId: req.user?.id || req.advisor?.id || null,
      timestamp: new Date().toISOString()
    };

    // Add request ID if not present
    if (!req.requestId) {
      req.requestId = requestMetadata.requestId;
    }

    // Log headers if requested (excluding sensitive ones)
    if (logHeaders) {
      const safeHeaders = {};
      Object.keys(req.headers).forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (!excludeHeaders.includes(lowerHeader)) {
          safeHeaders[header] = req.headers[header];
        } else {
          safeHeaders[header] = '[FILTERED]';
        }
      });
      requestMetadata.headers = safeHeaders;
    }

    // Log request body if present and requested
    if (logRequestBody && req.body && Object.keys(req.body).length > 0) {
      let bodyToLog = req.body;
      
      // Sanitize sensitive data
      bodyToLog = sanitizeRequestBody(bodyToLog);
      
      // Truncate if too large
      const bodyString = JSON.stringify(bodyToLog);
      if (bodyString.length > maxBodySize) {
        requestMetadata.requestBody = bodyString.substring(0, maxBodySize) + '...[TRUNCATED]';
        requestMetadata.bodyTruncated = true;
      } else {
        requestMetadata.requestBody = bodyToLog;
      }
    }

    // Log the request
    comprehensiveLogger.logAPIRequest(
      req.method,
      req.originalUrl,
      requestMetadata.requestBody || {},
      requestMetadata
    );

    // Store original res.json and res.send to intercept responses
    const originalJson = res.json;
    const originalSend = res.send;

    let responseBody = null;
    let responseLogged = false;

    // Intercept res.json
    res.json = function(data) {
      if (!responseLogged) {
        responseBody = data;
        logResponse(data);
      }
      return originalJson.call(this, data);
    };

    // Intercept res.send
    res.send = function(data) {
      if (!responseLogged && data) {
        try {
          responseBody = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          responseBody = { data: data?.toString?.() || '[Unable to parse]' };
        }
        logResponse(responseBody);
      }
      return originalSend.call(this, data);
    };

    // Function to log response
    const logResponse = (data) => {
      if (responseLogged) return;
      responseLogged = true;

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const responseMetadata = {
        ...requestMetadata,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        responseSize: res.get('Content-Length') || (data ? JSON.stringify(data).length : 0),
        endTime: new Date().toISOString()
      };

      // Add response body if requested and not too large
      if (logResponseBody && data) {
        const sanitizedData = sanitizeResponseBody(data);
        const dataString = JSON.stringify(sanitizedData);
        
        if (dataString.length > maxBodySize) {
          responseMetadata.responseBody = dataString.substring(0, maxBodySize) + '...[TRUNCATED]';
          responseMetadata.responseTruncated = true;
        } else {
          responseMetadata.responseBody = sanitizedData;
        }
      }

      // Log based on response status
      if (res.statusCode >= 400) {
        comprehensiveLogger.logAPIError(
          req.method,
          req.originalUrl,
          new Error(`HTTP ${res.statusCode}: ${data?.message || 'Request failed'}`),
          responseMetadata
        );
      } else {
        comprehensiveLogger.logAPIResponse(
          req.method,
          req.originalUrl,
          res.statusCode,
          responseTime,
          responseMetadata
        );
      }

      // Log performance category
      logPerformanceMetrics(req, responseTime, responseMetadata);

      // Log user interactions based on endpoint
      logUserInteractionByEndpoint(req, res, responseMetadata);
    };

    // Handle response finish event as fallback
    res.on('finish', () => {
      if (!responseLogged) {
        logResponse(null);
      }
    });

    // Handle response close event
    res.on('close', () => {
      if (!responseLogged) {
        logResponse({ error: 'Response closed unexpectedly' });
      }
    });

    next();
  };
};

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract session ID from request
 */
function extractSessionId(req) {
  // Try various methods to extract session ID
  if (req.session?.id) return req.session.id;
  if (req.sessionID) return req.sessionID;
  if (req.headers['x-session-id']) return req.headers['x-session-id'];
  if (req.cookies?.sessionId) return req.cookies.sessionId;
  
  // Extract from token if present
  if (req.params?.token) {
    return `token_session_${req.params.token.substr(0, 8)}`;
  }
  
  return null;
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = [
    'password', 'passwd', 'pwd',
    'token', 'accessToken', 'apiKey',
    'panNumber', 'pan', 'aadhar', 'aadharNumber',
    'accountNumber', 'bankAccount', 'cvv', 'pin',
    'casPassword', 'filePassword'
  ];

  const sanitized = Array.isArray(body) ? [] : {};

  for (const key in body) {
    const lowerKey = key.toLowerCase();
    const value = body[key];

    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[MASKED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize response body
 */
function sanitizeResponseBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = [
    'password', 'token', 'accessToken', 'apiKey',
    'panNumber', 'aadharNumber', 'accountNumber'
  ];

  const sanitized = Array.isArray(body) ? [] : {};

  for (const key in body) {
    const lowerKey = key.toLowerCase();
    const value = body[key];

    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[MASKED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResponseBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log performance metrics
 */
function logPerformanceMetrics(req, responseTime, metadata) {
  const performanceCategory = comprehensiveLogger.categorizePerformance(responseTime);
  
  comprehensiveLogger.logSystemEvent('API_PERFORMANCE_METRIC', {
    endpoint: req.originalUrl,
    method: req.method,
    responseTime: `${responseTime}ms`,
    performanceCategory,
    statusCode: metadata.statusCode,
    userId: metadata.userId,
    timestamp: new Date().toISOString()
  });

  // Log slow requests
  if (responseTime > 2000) {
    comprehensiveLogger.logSystemEvent('SLOW_REQUEST_DETECTED', {
      endpoint: req.originalUrl,
      method: req.method,
      responseTime: `${responseTime}ms`,
      userId: metadata.userId,
      severity: responseTime > 5000 ? 'high' : 'medium'
    });
  }
}

/**
 * Log specific user interactions based on endpoint patterns
 */
function logUserInteractionByEndpoint(req, res, metadata) {
  const { method, originalUrl, statusCode } = req;
  const success = statusCode < 400;

  // Authentication endpoints
  if (originalUrl.includes('/auth/login')) {
    comprehensiveLogger.logAuthAttempt(success, {
      method: 'login',
      email: req.body?.email,
      responseTime: metadata.responseTime,
      ip: metadata.ip,
      userAgent: metadata.userAgent
    });
  }

  // Form submission endpoints
  if (originalUrl.includes('/onboarding') && method === 'POST') {
    if (success) {
      comprehensiveLogger.logUserInteraction('FORM_SUBMISSION_SUCCESS', {
        formType: 'onboarding',
        responseTime: metadata.responseTime,
        userId: metadata.userId,
        sessionId: metadata.sessionId
      });
    } else {
      comprehensiveLogger.logUserInteraction('FORM_SUBMISSION_FAILED', {
        formType: 'onboarding',
        error: res.statusCode,
        responseTime: metadata.responseTime,
        userId: metadata.userId
      });
    }
  }

  // CAS upload endpoints
  if (originalUrl.includes('/cas/upload')) {
    comprehensiveLogger.logCASEvent('CAS_UPLOAD_REQUEST', {
      success,
      responseTime: metadata.responseTime,
      userId: metadata.userId,
      fileSize: req.get('Content-Length')
    });
  }

  // Draft save endpoints
  if (originalUrl.includes('/draft')) {
    comprehensiveLogger.logUserInteraction('DRAFT_SAVE', {
      success,
      responseTime: metadata.responseTime,
      userId: metadata.userId
    });
  }

  // Client management actions
  if (originalUrl.includes('/clients/manage')) {
    const action = method === 'GET' ? 'VIEW' : method === 'POST' ? 'CREATE' : 
                   method === 'PUT' ? 'UPDATE' : method === 'DELETE' ? 'DELETE' : method;
    
    comprehensiveLogger.logUserInteraction(`CLIENT_MANAGEMENT_${action}`, {
      success,
      endpoint: originalUrl,
      responseTime: metadata.responseTime,
      advisorId: metadata.userId
    });
  }
}

/**
 * Middleware specifically for frontend log ingestion
 */
const frontendLogIngestionMiddleware = (req, res, next) => {
  // This endpoint receives logs from the frontend
  if (req.path === '/api/logs/frontend' && req.method === 'POST') {
    const { logs, sessionId } = req.body;

    if (logs && Array.isArray(logs)) {
      logs.forEach(logEntry => {
        try {
          // Enhance log entry with server-side metadata
          const enhancedLog = {
            ...logEntry,
            serverReceivedAt: new Date().toISOString(),
            serverSessionId: sessionId,
            ip: req.ip,
            forwardedFor: req.get('X-Forwarded-For')
          };

          // Route to appropriate logger based on log type
          comprehensiveLogger.logFromFrontend(enhancedLog);
        } catch (error) {
          console.error('Error processing frontend log:', error);
          comprehensiveLogger.logApplicationError(
            error, 
            'frontendLogIngestion', 
            'medium', 
            { logEntry, sessionId }
          );
        }
      });

      comprehensiveLogger.logSystemEvent('FRONTEND_LOGS_INGESTED', {
        count: logs.length,
        sessionId,
        ip: req.ip
      });
    }

    res.json({ success: true, received: logs?.length || 0 });
  } else {
    next();
  }
};

module.exports = {
  userActivityLogger,
  frontendLogIngestionMiddleware
};