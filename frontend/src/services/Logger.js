// Frontend comprehensive logging service for RichieAI
import axios from 'axios';

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info', 
  WARN: 'warn',
  ERROR: 'error'
};

// Log types
const LOG_TYPES = {
  USER_INTERACTION: 'user_interaction',
  FORM_PROGRESS: 'form_progress',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  SYSTEM: 'system',
  CAS: 'cas',
  NAVIGATION: 'navigation'
};

class FrontendLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.logBuffer = [];
    this.maxBufferSize = 50;
    this.flushInterval = 5000; // 5 seconds
    this.isOnline = navigator.onLine;
    
    // Setup periodic flush
    this.setupPeriodicFlush();
    
    // Setup online/offline listeners
    this.setupNetworkListeners();
    
    // Setup beforeunload to flush logs
    this.setupBeforeUnload();
    
    console.log(`🔥 Frontend Logger initialized with session: ${this.sessionId}`);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId) {
    this.userId = userId;
    console.log(`👤 Logger user ID set: ${userId}`);
  }

  setupPeriodicFlush() {
    setInterval(() => {
      if (this.logBuffer.length > 0 && this.isOnline) {
        this.flushLogs();
      }
    }, this.flushInterval);
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Network online - flushing buffered logs');
      this.flushLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Network offline - buffering logs');
    });
  }

  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      // Force flush logs before page unload
      if (this.logBuffer.length > 0) {
        // Use sendBeacon for reliable delivery
        this.flushLogsSync();
      }
    });
  }

  // Core logging method
  log(level, type, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      type,
      message,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      metadata: this.sanitizeMetadata(metadata)
    };

    // Console output for development
    this.logToConsole(logEntry);

    // Store in localStorage for persistence
    this.logToLocalStorage(logEntry);

    // Add to buffer for API transmission
    this.addToBuffer(logEntry);
  }

  logToConsole(logEntry) {
    const { level, type, message, metadata } = logEntry;
    const emoji = this.getLogEmoji(type);
    const style = this.getLogStyle(level);
    
    console.groupCollapsed(`${emoji} [${level.toUpperCase()}] ${type}: ${message}`);
    if (Object.keys(metadata).length > 0) {
      console.log('%cMetadata:', 'color: #666; font-weight: bold;', metadata);
    }
    console.log('%cFull Log Entry:', 'color: #888; font-size: 11px;', logEntry);
    console.groupEnd();
  }

  getLogEmoji(type) {
    const emojis = {
      [LOG_TYPES.USER_INTERACTION]: '👆',
      [LOG_TYPES.FORM_PROGRESS]: '📝',
      [LOG_TYPES.ERROR]: '❌',
      [LOG_TYPES.PERFORMANCE]: '⚡',
      [LOG_TYPES.SYSTEM]: '⚙️',
      [LOG_TYPES.CAS]: '📊',
      [LOG_TYPES.NAVIGATION]: '🧭'
    };
    return emojis[type] || '📋';
  }

  getLogStyle(level) {
    const styles = {
      [LOG_LEVELS.DEBUG]: 'color: #666;',
      [LOG_LEVELS.INFO]: 'color: #0066cc;',
      [LOG_LEVELS.WARN]: 'color: #ff9900;',
      [LOG_LEVELS.ERROR]: 'color: #cc0000; font-weight: bold;'
    };
    return styles[level] || '';
  }

  logToLocalStorage(logEntry) {
    try {
      const storageKey = `richieat_logs_${new Date().toDateString().replace(/ /g, '_')}`;
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      existingLogs.push(logEntry);
      
      // Keep only last 100 logs per day
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
      
      // Clean up old log entries (keep only last 7 days)
      this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  cleanupOldLogs() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoffTime = Date.now() - maxAge;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('richieat_logs_')) {
        try {
          const logs = JSON.parse(localStorage.getItem(key) || '[]');
          if (logs.length > 0) {
            const firstLogTime = new Date(logs[0].timestamp).getTime();
            if (firstLogTime < cutoffTime) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          localStorage.removeItem(key); // Remove corrupted entries
        }
      }
    });
  }

  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    
    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  async flushLogs() {
    if (this.logBuffer.length === 0 || !this.isOnline) return;
    
    const logsToSend = [...this.logBuffer];
    this.logBuffer = []; // Clear buffer immediately
    
    try {
      await axios.post('/api/logs/frontend', {
        logs: logsToSend,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📤 Flushed ${logsToSend.length} logs to backend`);
    } catch (error) {
      console.error('Failed to flush logs to backend:', error);
      // Re-add failed logs to buffer for retry
      this.logBuffer.unshift(...logsToSend);
    }
  }

  flushLogsSync() {
    if (this.logBuffer.length === 0) return;
    
    try {
      // Use sendBeacon for synchronous delivery
      navigator.sendBeacon('/api/logs/frontend', JSON.stringify({
        logs: this.logBuffer,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📤 Synchronously sent ${this.logBuffer.length} logs`);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to send logs synchronously:', error);
    }
  }

  sanitizeMetadata(metadata) {
    // Remove sensitive data from metadata
    const sensitiveKeys = [
      'password', 'token', 'pan', 'panNumber', 'aadhar', 'accountNumber'
    ];
    
    const sanitized = { ...metadata };
    
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const result = Array.isArray(obj) ? [] : {};
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '***MASKED***';
        } else if (typeof obj[key] === 'object') {
          result[key] = sanitizeObject(obj[key]);
        } else {
          result[key] = obj[key];
        }
      });
      
      return result;
    };
    
    return sanitizeObject(sanitized);
  }

  // User Interaction Logging Methods
  logUserInteraction(action, element = null, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.USER_INTERACTION, action, {
      element: element ? {
        tag: element.tagName,
        id: element.id,
        className: element.className,
        text: element.textContent?.substring(0, 100)
      } : null,
      ...metadata
    });
  }

  logButtonClick(buttonName, element = null, metadata = {}) {
    this.logUserInteraction('BUTTON_CLICK', element, {
      buttonName,
      buttonType: 'click',
      ...metadata
    });
  }

  logFormFieldChange(fieldName, oldValue, newValue, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.FORM_PROGRESS, 'FORM_FIELD_CHANGE', {
      fieldName,
      oldValue: this.maskValue(oldValue),
      newValue: this.maskValue(newValue),
      changeType: 'field_update',
      ...metadata
    });
  }

  logFormFieldFocus(fieldName, metadata = {}) {
    this.log(LOG_LEVELS.DEBUG, LOG_TYPES.FORM_PROGRESS, 'FORM_FIELD_FOCUS', {
      fieldName,
      ...metadata
    });
  }

  logFormFieldBlur(fieldName, value, metadata = {}) {
    this.log(LOG_LEVELS.DEBUG, LOG_TYPES.FORM_PROGRESS, 'FORM_FIELD_BLUR', {
      fieldName,
      value: this.maskValue(value),
      ...metadata
    });
  }

  // Form Progress Methods
  logStepTransition(fromStep, toStep, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.FORM_PROGRESS, `STEP_TRANSITION: ${fromStep} -> ${toStep}`, {
      fromStep,
      toStep,
      direction: toStep > fromStep ? 'forward' : 'backward',
      ...metadata
    });
  }

  logFormStart(formType, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.FORM_PROGRESS, `FORM_START: ${formType}`, {
      formType,
      startTime: new Date().toISOString(),
      ...metadata
    });
  }

  logFormComplete(formType, completionTime, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.FORM_PROGRESS, `FORM_COMPLETE: ${formType}`, {
      formType,
      completionTime,
      success: true,
      ...metadata
    });
  }

  logFormValidationError(fieldName, errorMessage, metadata = {}) {
    this.log(LOG_LEVELS.WARN, LOG_TYPES.FORM_PROGRESS, 'FORM_VALIDATION_ERROR', {
      fieldName,
      errorMessage,
      ...metadata
    });
  }

  logFormDraftSave(metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.FORM_PROGRESS, 'FORM_DRAFT_SAVED', {
      ...metadata
    });
  }

  // Error Logging Methods
  logError(error, component = 'unknown', severity = 'medium', metadata = {}) {
    this.log(LOG_LEVELS.ERROR, LOG_TYPES.ERROR, error.message || String(error), {
      component,
      severity,
      stack: error.stack,
      name: error.name,
      ...metadata
    });
  }

  logCriticalError(error, component, metadata = {}) {
    this.logError(error, component, 'critical', {
      alert: true,
      requiresImmediateAttention: true,
      ...metadata
    });
  }

  logAPIError(method, endpoint, error, metadata = {}) {
    this.log(LOG_LEVELS.ERROR, LOG_TYPES.ERROR, `API_ERROR: ${method} ${endpoint}`, {
      method,
      endpoint,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      ...metadata
    });
  }

  // Performance Logging
  logPerformance(metric, value, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.PERFORMANCE, `PERFORMANCE: ${metric}`, {
      metric,
      value,
      unit: metadata.unit || 'ms',
      ...metadata
    });
  }

  logPageLoad(loadTime, metadata = {}) {
    this.logPerformance('PAGE_LOAD', loadTime, {
      url: window.location.href,
      ...metadata
    });
  }

  logAPIResponse(method, endpoint, responseTime, status, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.PERFORMANCE, `API_RESPONSE: ${method} ${endpoint}`, {
      method,
      endpoint,
      responseTime,
      status,
      performanceCategory: this.categorizePerformance(responseTime),
      ...metadata
    });
  }

  // Navigation Logging
  logNavigation(from, to, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.NAVIGATION, `NAVIGATION: ${from} -> ${to}`, {
      from,
      to,
      ...metadata
    });
  }

  // CAS Logging
  logCASEvent(event, metadata = {}) {
    this.log(LOG_LEVELS.INFO, LOG_TYPES.CAS, `CAS_EVENT: ${event}`, {
      event,
      subsystem: 'cas-upload',
      ...metadata
    });
  }

  logCASUpload(filename, fileSize, metadata = {}) {
    this.logCASEvent('CAS_UPLOAD_START', {
      filename,
      fileSize,
      ...metadata
    });
  }

  logCASParseComplete(totalValue, accounts, metadata = {}) {
    this.logCASEvent('CAS_PARSE_COMPLETE', {
      totalValue,
      accounts,
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

  maskValue(value) {
    if (!value) return value;
    
    const str = String(value);
    
    // Mask PAN number pattern
    if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(str)) {
      return str.substring(0, 3) + '***' + str.substring(str.length - 2);
    }
    
    // Mask long strings
    if (str.length > 10) {
      return str.substring(0, 3) + '***' + str.substring(str.length - 2);
    }
    
    return str;
  }

  // Debug methods
  getCurrentLogs() {
    return this.logBuffer;
  }

  getStoredLogs() {
    const today = new Date().toDateString().replace(/ /g, '_');
    const storageKey = `richieat_logs_${today}`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  clearLogs() {
    this.logBuffer = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('richieat_logs_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ All logs cleared');
  }
}

// Create and export singleton instance
const logger = new FrontendLogger();

export default logger;