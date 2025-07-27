require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { logger, logDatabase } = require('./utils/logger');
const { morganMiddleware, requestLogger, addRequestId, securityLogger } = require('./middleware/requestLogger');

// Import comprehensive logging system
const comprehensiveLogger = require('./utils/comprehensiveLogger');
const { userActivityLogger, frontendLogIngestionMiddleware } = require('./middleware/userActivityLogger');
const { 
  performanceLogger, 
  databasePerformanceTracker, 
  healthCheckLogger, 
  timeoutMonitor, 
  rateLimitPerformanceTracker 
} = require('./middleware/performanceLogger');

const app = express();

// Environment and startup logging
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

logger.info('='.repeat(50));
logger.info('RICHIEAT Backend Server Starting...');
logger.info(`Environment: ${NODE_ENV}`);
logger.info(`Port: ${PORT}`);
logger.info('='.repeat(50));

// Initialize comprehensive logging
comprehensiveLogger.logSystemEvent('SERVER_STARTING', {
  environment: NODE_ENV,
  port: PORT,
  nodeVersion: process.version,
  pid: process.pid
});

// Create required directories for file uploads
const { createRequiredDirectories } = require('./utils/createDirectories');
createRequiredDirectories();

// Trust proxy for proper IP logging
app.set('trust proxy', 1);

// Request logging middleware (some must be first)
app.use(addRequestId);
app.use(morganMiddleware);

// Add comprehensive logging middleware
app.use(rateLimitPerformanceTracker());
app.use(timeoutMonitor(30000));
app.use(healthCheckLogger);

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logger and security logger AFTER body parsing
app.use(requestLogger);
app.use(securityLogger);

// Add comprehensive user activity and performance logging
app.use(userActivityLogger({
  logRequestBody: true,
  logResponseBody: NODE_ENV === 'development',
  logHeaders: NODE_ENV === 'development',
  excludePaths: ['/api/logs', '/health', '/'],
  maxBodySize: 10000
}));

app.use(performanceLogger({
  slowRequestThreshold: 1000,
  criticalRequestThreshold: 5000,
  logMemoryUsage: true,
  logCPUUsage: NODE_ENV === 'development',
  sampleRate: NODE_ENV === 'production' ? 0.1 : 1.0
}));

app.use(databasePerformanceTracker());

// Frontend log ingestion middleware
app.use(frontendLogIngestionMiddleware);

// MongoDB connection with retry logic
const connectWithRetry = () => {
  logDatabase.connectionAttempt();
  
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true
  })
  .then(() => {
    logDatabase.connectionSuccess();
    logger.info('✅ MongoDB connected successfully');
    
    // Log successful database connection
    comprehensiveLogger.logSystemEvent('DATABASE_CONNECTION_SUCCESS', {
      database: 'MongoDB',
      uri: MONGODB_URI ? 'configured' : 'missing',
      environment: NODE_ENV
    });
  })
  .catch(err => {
    logDatabase.connectionError(err);
    logger.error('❌ MongoDB connection failed. Retrying in 5 seconds...');
    
    // Log database connection error
    comprehensiveLogger.logApplicationError(
      err, 
      'DatabaseConnection', 
      'high', 
      {
        retryScheduled: true,
        retryDelay: '5000ms',
        environment: NODE_ENV
      }
    );
    
    setTimeout(connectWithRetry, 5000);
  });
};

// MongoDB connection event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

// Start connection
connectWithRetry();

// Health check route
app.get('/', (req, res) => {
  const healthStatus = {
    message: 'RICHIEAT Backend API is running!',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  };
  
  logger.debug('Health check requested');
  res.json(healthStatus);
});

// Debug middleware for body parsing issues
app.use('/api/clients/onboarding', (req, res, next) => {
  console.log('🔍 BODY DEBUG MIDDLEWARE:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    },
    bodyExists: !!req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'N/A',
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    rawBodyPreview: req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : 'NULL'
  });
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/logs', require('./routes/logging'));

// Log routes initialization
comprehensiveLogger.logSystemEvent('API_ROUTES_INITIALIZED', {
  routes: ['/api/auth', '/api/clients', '/api/admin', '/api/plans', '/api/meetings', '/api/logs'],
  timestamp: new Date().toISOString()
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const { method, url } = req;
  const advisorId = req.advisor?.id;
  
  logger.error(`Unhandled error in ${method} ${url}${advisorId ? ` (Advisor: ${advisorId})` : ''}: ${err.message}`);
  logger.error(err.stack);
  
  // Log to comprehensive logger
  comprehensiveLogger.logApplicationError(err, 'GlobalErrorHandler', 'high', {
    method,
    url,
    advisorId,
    requestId: req.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Don't leak error details in production
  const message = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: message,
    requestId: req.requestId
  });
});

// 404 handler
app.use((req, res) => {
  const { method, url, ip } = req;
  
  logger.warn(`404 - Route not found: ${method} ${url} from IP: ${ip}`);
  
  // Log 404 to comprehensive logger
  comprehensiveLogger.logSystemEvent('ROUTE_NOT_FOUND', {
    method,
    url,
    ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    severity: 'low'
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestId: req.requestId
  });
});

// Import cleanup function
const { cleanup } = require('./middleware/performanceLogger');

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Log graceful shutdown initiation
  comprehensiveLogger.logSystemEvent('SERVER_SHUTDOWN_INITIATED', {
    signal,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
  
  // Cleanup performance monitoring
  cleanup();
  
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    logger.info('Server shutdown complete');
    
    // Final log before shutdown
    comprehensiveLogger.logSystemEvent('SERVER_SHUTDOWN_COMPLETE', {
      signal,
      timestamp: new Date().toISOString()
    });
    
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${NODE_ENV}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
  logger.info('Server startup complete ✅');
  
  // Log server startup to comprehensive logger
  comprehensiveLogger.logSystemEvent('SERVER_STARTUP_COMPLETE', {
    port: PORT,
    environment: NODE_ENV,
    apiBaseUrl: `http://localhost:${PORT}/api`,
    comprehensiveLoggingEnabled: true,
    loggingFeatures: [
      'userActivityLogging',
      'performanceLogging', 
      'databasePerformanceTracking',
      'errorBoundaryLogging',
      'frontendLogIngestion',
      'rateLimitTracking',
      'healthCheckMonitoring'
    ],
    timestamp: new Date().toISOString()
  });
  
  console.log('🎯 COMPREHENSIVE LOGGING: System fully activated with complete monitoring');
});