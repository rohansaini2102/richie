const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { 
  morganMiddleware, 
  requestLogger, 
  addRequestId, 
  securityLogger,
  validateRequestBody 
} = require('./middleware/requestLogger');
const { 
  captureRawBody, 
  debugBodyParser, 
  ensureBodyParsing 
} = require('./middleware/bodyParserDebug');

const setupMiddleware = (app) => {
  logger.info('🚀 MIDDLEWARE SETUP: Configuring Express middleware stack');

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // 1. CORS Configuration (must be early)
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://localhost:8080',
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`❌ CORS BLOCKED: Origin ${origin} not allowed`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Request-ID']
  };
  
  app.use(cors(corsOptions));
  logger.info('✅ CORS configured with allowed origins');

  // 2. Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  logger.info('✅ Security headers configured');

  // 3. Request ID and basic logging (before body parsing)
  app.use(addRequestId);
  app.use(securityLogger);
  
  // 4. Raw body capture (MUST be before JSON parsing)
  app.use(captureRawBody);
  logger.info('✅ Raw body capture middleware added');

  // 5. JSON Body parsing with enhanced error handling
  app.use(express.json({ 
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        logger.error(`❌ JSON PARSE ERROR: Invalid JSON in request body`, {
          error: e.message,
          body: buf.toString().substring(0, 500),
          contentType: req.headers['content-type']
        });
        throw new Error('Invalid JSON in request body');
      }
    }
  }));
  
  // 6. URL encoded parsing
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb' 
  }));
  
  logger.info('✅ Body parsing middleware configured');

  // 7. Body parsing debugging and validation
  app.use(debugBodyParser);
  app.use(validateRequestBody);
  app.use(ensureBodyParsing);
  logger.info('✅ Body parsing debug middleware added');

  // 8. Request logging
  app.use(morganMiddleware);
  app.use(requestLogger);
  logger.info('✅ Request logging configured');

  // 9. Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`🚫 RATE LIMIT: IP ${req.ip} exceeded rate limit`, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        debug: {
          rateLimit: true,
          windowMs: 15 * 60 * 1000,
          maxRequests: 1000
        }
      });
    }
  });
  
  app.use(limiter);
  logger.info('✅ Rate limiting configured');

  // 10. Health check endpoint (before other routes)
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // 11. API test endpoint for debugging
  app.post('/api/test/echo', (req, res) => {
    logger.info('🧪 TEST ENDPOINT: Echo request received', {
      headers: req.headers,
      body: req.body,
      rawBody: req.rawBody,
      query: req.query,
      params: req.params
    });
    
    res.json({
      success: true,
      message: 'Echo endpoint working',
      received: {
        headers: req.headers,
        body: req.body,
        rawBody: req.rawBody ? req.rawBody.substring(0, 500) : null,
        query: req.query,
        params: req.params,
        method: req.method,
        url: req.url
      },
      timestamp: new Date().toISOString()
    });
  });

  logger.info('✅ Middleware setup completed successfully');
};

// Error handling middleware
const setupErrorHandling = (app) => {
  logger.info('🛡️ ERROR HANDLING: Setting up error handlers');

  // 404 handler
  app.use('*', (req, res) => {
    logger.warn(`❌ 404 NOT FOUND: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(404).json({
      success: false,
      message: 'Route not found',
      debug: {
        method: req.method,
        url: req.originalUrl,
        availableRoutes: [
          'POST /api/auth/login',
          'POST /api/auth/register',
          'GET /api/auth/profile',
          'POST /api/test/echo',
          'GET /health'
        ]
      }
    });
  });

  // Global error handler
  app.use((error, req, res, next) => {
    const requestId = req.requestId || 'unknown';
    
    logger.error(`💥 GLOBAL ERROR: ${error.message}`, {
      requestId,
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in request body',
        debug: {
          requestId,
          error: 'JSON parse failed',
          suggestion: 'Check that your request body contains valid JSON'
        }
      });
    }

    if (error.message === 'Not allowed by CORS') {
      return res.status(403).json({
        success: false,
        message: 'CORS policy violation',
        debug: {
          requestId,
          error: 'Origin not allowed',
          origin: req.headers.origin
        }
      });
    }

    // Default error response
    res.status(error.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      debug: {
        requestId,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    });
  });

  logger.info('✅ Error handling configured');
};

// Database connection logging
const logDatabaseConnection = () => {
  logger.info('🗄️ DATABASE: Checking database connection status', {
    mongoUri: process.env.MONGO_URI ? 'Present' : 'Missing',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
};

// Environment validation
const validateEnvironment = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`❌ ENVIRONMENT: Missing required environment variables`, {
      missing: missingVars,
      required: requiredEnvVars
    });
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('✅ ENVIRONMENT: All required environment variables present', {
    jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing',
    mongoUri: process.env.MONGO_URI ? 'Present' : 'Missing',
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  setupMiddleware,
  setupErrorHandling,
  logDatabaseConnection,
  validateEnvironment
};