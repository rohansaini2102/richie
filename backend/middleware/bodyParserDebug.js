const { logger } = require('../utils/logger');

// Middleware to capture and log raw body before parsing
const captureRawBody = (req, res, next) => {
  let data = '';
  
  // Store original data listeners
  const originalOn = req.on;
  const originalEnd = req.end;
  
  // Capture raw body chunks
  req.on = function(event, callback) {
    if (event === 'data') {
      const originalCallback = callback;
      callback = function(chunk) {
        data += chunk;
        return originalCallback.call(this, chunk);
      };
    }
    return originalOn.call(this, event, callback);
  };
  
  // Log when body is complete
  req.on('end', () => {
    req.rawBody = data;
    
    logger.info(`📡 RAW BODY CAPTURED: ${req.method} ${req.url}`, {
      hasRawBody: !!data,
      rawBodyLength: data.length,
      rawBodyContent: data.substring(0, 500), // First 500 chars
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
  });
  
  next();
};

// Middleware to debug body parsing issues
const debugBodyParser = (req, res, next) => {
  const { method, url } = req;
  
  logger.info(`🔍 BODY PARSER DEBUG: ${method} ${url}`, {
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'accept': req.headers['accept'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    },
    hasBody: !!req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    bodyContent: req.body ? JSON.stringify(req.body) : 'undefined',
    hasRawBody: !!req.rawBody,
    rawBodyLength: req.rawBody ? req.rawBody.length : 0,
    rawBodySnippet: req.rawBody ? req.rawBody.substring(0, 200) : 'No raw body'
  });
  
  // Special handling for login requests
  if (url.includes('/auth/login') && method === 'POST') {
    logger.info(`🔐 LOGIN REQUEST ANALYSIS: Detailed body inspection`, {
      requestId: req.requestId,
      
      // Content type analysis
      contentType: req.headers['content-type'],
      isJSON: req.headers['content-type']?.includes('application/json'),
      isFormData: req.headers['content-type']?.includes('application/x-www-form-urlencoded'),
      isMultipart: req.headers['content-type']?.includes('multipart/form-data'),
      
      // Body analysis
      hasBody: !!req.body,
      bodyType: typeof req.body,
      bodyConstructor: req.body?.constructor?.name,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodyValues: req.body ? Object.keys(req.body).reduce((acc, key) => {
        acc[key] = key === 'password' ? '***HIDDEN***' : req.body[key];
        return acc;
      }, {}) : {},
      
      // Raw body analysis
      hasRawBody: !!req.rawBody,
      rawBodyType: typeof req.rawBody,
      rawBodyLength: req.rawBody ? req.rawBody.length : 0,
      rawBodyContent: req.rawBody || 'No raw body captured',
      
      // Parsed body analysis
      bodyStringified: req.body ? JSON.stringify(req.body) : 'No body',
      
      // Express req properties
      readable: req.readable,
      complete: req.complete,
      
      timestamp: new Date().toISOString()
    });
    
    // Try to parse raw body if req.body is empty but we have raw data
    if ((!req.body || Object.keys(req.body).length === 0) && req.rawBody) {
      try {
        const parsedRaw = JSON.parse(req.rawBody);
        logger.warn(`⚠️ BODY PARSING ISSUE: req.body is empty but raw body contains data`, {
          requestId: req.requestId,
          parsedFromRaw: parsedRaw,
          suggestion: 'Body parser might not be working correctly'
        });
        
        // Manually set the body for this request
        req.body = parsedRaw;
        
        logger.info(`🔧 MANUAL BODY FIX: Manually parsed body from raw data`, {
          requestId: req.requestId,
          fixedBody: {
            hasEmail: !!parsedRaw.email,
            hasPassword: !!parsedRaw.password,
            email: parsedRaw.email
          }
        });
      } catch (parseError) {
        logger.error(`❌ RAW BODY PARSE FAILED: Could not parse raw body as JSON`, {
          requestId: req.requestId,
          parseError: parseError.message,
          rawBodySnippet: req.rawBody.substring(0, 100)
        });
      }
    }
  }
  
  next();
};

// Middleware to ensure body parsing is working
const ensureBodyParsing = (req, res, next) => {
  const { method, url } = req;
  
  // For POST/PUT requests that should have a body
  if ((method === 'POST' || method === 'PUT') && req.headers['content-type']?.includes('application/json')) {
    if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
      logger.error(`❌ BODY PARSING FAILED: Expected JSON body but got empty object`, {
        requestId: req.requestId,
        method,
        url,
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        hasRawBody: !!req.rawBody,
        bodyParserIssue: true
      });
      
      // Return error for missing body
      return res.status(400).json({
        success: false,
        message: 'Request body parsing failed - no data received',
        debug: {
          issue: 'Body parser did not populate req.body',
          contentType: req.headers['content-type'],
          contentLength: req.headers['content-length'],
          suggestion: 'Check that request is sending valid JSON and Content-Type header is correct'
        }
      });
    }
  }
  
  next();
};

module.exports = {
  captureRawBody,
  debugBodyParser,
  ensureBodyParsing
};