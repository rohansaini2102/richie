// Enhanced comprehensive logging service for RichieAI
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create specialized log directories
const createLogDirectories = () => {
  const logDirs = [
    '../logs',
    '../logs/user-interactions',
    '../logs/form-progress', 
    '../logs/api-performance',
    '../logs/security-events',
    '../logs/database-operations',
    '../logs/errors',
    '../logs/system-events'
  ];
  
  logDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createLogDirectories();

// Custom log formats for different types of logs
const createLogFormat = (includeMetadata = true) => {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const baseLog = `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
      if (includeMetadata && Object.keys(meta).length > 0) {
        return `${baseLog} | Metadata: ${JSON.stringify(meta)}`;
      }
      return baseLog;
    })
  );
};

// User Interaction Logger
const userInteractionLogger = winston.createLogger({
  level: 'info',
  format: createLogFormat(true),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/user-interactions/interactions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    }),
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Form Progress Logger  
const formProgressLogger = winston.createLogger({
  level: 'info',
  format: createLogFormat(true),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/form-progress/form-events.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 20
    })
  ]
});

// API Performance Logger
const apiPerformanceLogger = winston.createLogger({
  level: 'info',
  format: createLogFormat(true),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/api-performance/performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 15
    })
  ]
});

// Security Events Logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: createLogFormat(true),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/security-events/security.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 50 // Keep more security logs
    }),
    new winston.transports.Console({
      level: 'warn',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database Operations Logger
const databaseLogger = winston.createLogger({
  level: 'info',
  format: createLogFormat(true),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/database-operations/db-ops.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 20
    })
  ]
});

// Enhanced Error Logger
const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message: stack || message,
        metadata: meta,
        severity: meta.severity || 'medium',
        component: meta.component || 'unknown',
        userId: meta.userId || null,
        sessionId: meta.sessionId || null,
        requestId: meta.requestId || null
      });
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/errors/application-errors.log'),
      maxsize: 20971520, // 20MB
      maxFiles: 50
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/errors/critical-errors.log'),
      level: 'error',
      maxsize: 20971520, // 20MB
      maxFiles: 100
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// System Events Logger
const systemLogger = winston.createLogger({
  level: 'info',
  format: createLogFormat(true),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/system-events/system.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Comprehensive Logger Service
class ComprehensiveLogger {
  constructor() {
    this.userInteraction = userInteractionLogger;
    this.formProgress = formProgressLogger;
    this.apiPerformance = apiPerformanceLogger;
    this.security = securityLogger;
    this.database = databaseLogger;
    this.error = errorLogger;
    this.system = systemLogger;
  }

  // User Interaction Methods
  logUserInteraction(action, metadata = {}) {
    this.userInteraction.info(`USER_INTERACTION: ${action}`, {
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logButtonClick(buttonName, metadata = {}) {
    this.logUserInteraction('BUTTON_CLICK', {
      buttonName,
      buttonType: 'click',
      ...metadata
    });
  }

  logFormFieldChange(fieldName, oldValue, newValue, metadata = {}) {
    this.logUserInteraction('FORM_FIELD_CHANGE', {
      fieldName,
      oldValue: this.maskSensitiveData(oldValue),
      newValue: this.maskSensitiveData(newValue),
      changeType: 'field_update',
      ...metadata
    });
  }

  logStepTransition(fromStep, toStep, metadata = {}) {
    this.formProgress.info(`STEP_TRANSITION: ${fromStep} -> ${toStep}`, {
      fromStep,
      toStep,
      direction: toStep > fromStep ? 'forward' : 'backward',
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Form Progress Methods
  logFormStart(formType, metadata = {}) {
    this.formProgress.info(`FORM_START: ${formType}`, {
      formType,
      startTime: new Date().toISOString(),
      ...metadata
    });
  }

  logFormComplete(formType, completionTime, metadata = {}) {
    this.formProgress.info(`FORM_COMPLETE: ${formType}`, {
      formType,
      completionTime,
      endTime: new Date().toISOString(),
      success: true,
      ...metadata
    });
  }

  logFormAbandonment(formType, abandonedAtStep, metadata = {}) {
    this.formProgress.warn(`FORM_ABANDONED: ${formType} at step ${abandonedAtStep}`, {
      formType,
      abandonedAtStep,
      abandonTime: new Date().toISOString(),
      ...metadata
    });
  }

  logFormValidationError(fieldName, errorMessage, metadata = {}) {
    this.formProgress.warn(`FORM_VALIDATION_ERROR: ${fieldName}`, {
      fieldName,
      errorMessage,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // API Performance Methods
  logAPIRequest(method, endpoint, requestData, metadata = {}) {
    this.apiPerformance.info(`API_REQUEST: ${method} ${endpoint}`, {
      method,
      endpoint,
      requestSize: JSON.stringify(requestData).length,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logAPIResponse(method, endpoint, statusCode, responseTime, metadata = {}) {
    this.apiPerformance.info(`API_RESPONSE: ${method} ${endpoint}`, {
      method,
      endpoint,
      statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      performanceCategory: this.categorizePerformance(responseTime),
      ...metadata
    });
  }

  logAPIError(method, endpoint, error, metadata = {}) {
    this.apiPerformance.error(`API_ERROR: ${method} ${endpoint}`, {
      method,
      endpoint,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Security Methods
  logAuthAttempt(success, metadata = {}) {
    const level = success ? 'info' : 'warn';
    this.security[level](`AUTH_ATTEMPT: ${success ? 'SUCCESS' : 'FAILED'}`, {
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logSuspiciousActivity(activityType, metadata = {}) {
    this.security.warn(`SUSPICIOUS_ACTIVITY: ${activityType}`, {
      activityType,
      timestamp: new Date().toISOString(),
      severity: 'high',
      ...metadata
    });
  }

  logRateLimitHit(endpoint, metadata = {}) {
    this.security.warn(`RATE_LIMIT_HIT: ${endpoint}`, {
      endpoint,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Database Methods
  logDatabaseQuery(operation, collection, queryTime, metadata = {}) {
    this.database.info(`DB_QUERY: ${operation} on ${collection}`, {
      operation,
      collection,
      queryTime: `${queryTime}ms`,
      timestamp: new Date().toISOString(),
      performanceCategory: this.categorizePerformance(queryTime),
      ...metadata
    });
  }

  logDatabaseError(operation, collection, error, metadata = {}) {
    this.database.error(`DB_ERROR: ${operation} on ${collection}`, {
      operation,
      collection,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Error Methods
  logApplicationError(error, component, severity = 'medium', metadata = {}) {
    this.error.error(`APPLICATION_ERROR in ${component}`, {
      error: error.message,
      stack: error.stack,
      component,
      severity,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logCriticalError(error, component, metadata = {}) {
    this.logApplicationError(error, component, 'critical', {
      alert: true,
      requiresImmedateAttention: true,
      ...metadata
    });
  }

  // System Methods
  logSystemEvent(event, metadata = {}) {
    this.system.info(`SYSTEM_EVENT: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logCASEvent(event, metadata = {}) {
    this.system.info(`CAS_EVENT: ${event}`, {
      event,
      subsystem: 'cas-parser',
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Utility Methods
  categorizePerformance(timeMs) {
    if (timeMs < 100) return 'excellent';
    if (timeMs < 500) return 'good';
    if (timeMs < 1000) return 'average';
    if (timeMs < 3000) return 'slow';
    return 'critical';
  }

  maskSensitiveData(data) {
    if (!data) return data;
    
    const sensitiveFields = [
      'password', 'pan', 'panNumber', 'aadhar', 'aadharNumber',
      'accountNumber', 'cvv', 'pin', 'ssn', 'taxId'
    ];
    
    if (typeof data === 'string') {
      // Check if string looks like sensitive data
      if (data.length > 6 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data)) {
        return data.substring(0, 3) + '*'.repeat(data.length - 6) + data.substring(data.length - 3);
      }
      return data.length > 10 ? data.substring(0, 3) + '***' : data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const masked = { ...data };
      sensitiveFields.forEach(field => {
        if (masked[field]) {
          masked[field] = '***MASKED***';
        }
      });
      return masked;
    }
    
    return data;
  }

  // Frontend Log Ingestion
  logFromFrontend(logData) {
    const { type, level, message, metadata } = logData;
    
    switch (type) {
      case 'user_interaction':
        this.logUserInteraction(message, metadata);
        break;
      case 'form_progress':
        this.formProgress[level || 'info'](message, metadata);
        break;
      case 'error':
        this.logApplicationError(new Error(message), metadata.component || 'frontend', metadata.severity, metadata);
        break;
      case 'performance':
        this.apiPerformance.info(message, metadata);
        break;
      default:
        this.system.info(`FRONTEND_LOG: ${message}`, metadata);
    }
  }

  // Session Management
  createSessionLogger(sessionId, userId = null) {
    return {
      logInteraction: (action, metadata = {}) => 
        this.logUserInteraction(action, { sessionId, userId, ...metadata }),
      logFormEvent: (event, metadata = {}) => 
        this.formProgress.info(event, { sessionId, userId, ...metadata }),
      logError: (error, component, severity = 'medium', metadata = {}) => 
        this.logApplicationError(error, component, severity, { sessionId, userId, ...metadata })
    };
  }
}

// Export singleton instance
const comprehensiveLogger = new ComprehensiveLogger();

module.exports = comprehensiveLogger;