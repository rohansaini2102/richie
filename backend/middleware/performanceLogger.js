// Performance and monitoring middleware
const comprehensiveLogger = require('../utils/comprehensiveLogger');
const os = require('os');

/**
 * System metrics tracking
 */
class SystemMetrics {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.metricsInterval = null;
    
    this.startMetricsCollection();
  }

  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectAndLogSystemMetrics();
    }, 30000);
  }

  incrementRequest() {
    this.requestCount++;
  }

  incrementError() {
    this.errorCount++;
  }

  addResponseTime(time) {
    this.responseTimeSum += time;
  }

  collectAndLogSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0;
    
    const metrics = {
      system: {
        uptime: `${uptime}ms`,
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
        loadAverage: os.loadavg(),
        platform: os.platform(),
        arch: os.arch()
      },
      application: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
        avgResponseTime: `${Math.round(avgResponseTime)}ms`,
        totalResponseTime: `${this.responseTimeSum}ms`
      },
      node: {
        version: process.version,
        pid: process.pid,
        ppid: process.ppid,
        title: process.title
      }
    };

    comprehensiveLogger.logSystemEvent('SYSTEM_METRICS', metrics);

    // Alert on high error rate
    if (metrics.application.errorRate > 10 && this.requestCount > 10) {
      comprehensiveLogger.logSystemEvent('HIGH_ERROR_RATE_ALERT', {
        errorRate: `${metrics.application.errorRate.toFixed(2)}%`,
        errorCount: this.errorCount,
        requestCount: this.requestCount,
        severity: 'high'
      });
    }

    // Alert on high memory usage
    const memoryUsagePercent = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    if (memoryUsagePercent > 80) {
      comprehensiveLogger.logSystemEvent('HIGH_MEMORY_USAGE_ALERT', {
        memoryUsagePercent: `${memoryUsagePercent.toFixed(2)}%`,
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
        severity: memoryUsagePercent > 90 ? 'critical' : 'high'
      });
    }
  }

  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}

// Global metrics instance
const systemMetrics = new SystemMetrics();

/**
 * Performance monitoring middleware
 */
const performanceLogger = (options = {}) => {
  const {
    slowRequestThreshold = 1000, // 1 second
    criticalRequestThreshold = 5000, // 5 seconds
    logMemoryUsage = true,
    logCPUUsage = false,
    sampleRate = 1.0 // Log 100% of requests (set to 0.1 for 10% sampling)
  } = options;

  return (req, res, next) => {
    // Skip performance logging based on sample rate
    if (Math.random() > sampleRate) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const startTimestamp = Date.now();
    
    // Track memory before request
    const memoryBefore = logMemoryUsage ? process.memoryUsage() : null;
    
    // Store start metrics on request
    req.performanceStart = {
      hrtime: startTime,
      timestamp: startTimestamp,
      memory: memoryBefore
    };

    // Increment request count
    systemMetrics.incrementRequest();

    // Override res.end to capture response completion
    const originalEnd = res.end;
    res.end = function(...args) {
      const endTime = process.hrtime.bigint();
      const endTimestamp = Date.now();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const totalTime = endTimestamp - startTimestamp;

      // Add response time to metrics
      systemMetrics.addResponseTime(responseTime);

      // Track memory after response
      const memoryAfter = logMemoryUsage ? process.memoryUsage() : null;

      // Prepare performance metadata
      const performanceData = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime.toFixed(2)}ms`,
        totalTime: `${totalTime}ms`,
        timestamp: new Date(startTimestamp).toISOString(),
        endTimestamp: new Date(endTimestamp).toISOString()
      };

      // Add memory usage if enabled
      if (logMemoryUsage && memoryBefore && memoryAfter) {
        performanceData.memory = {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            external: memoryAfter.external - memoryBefore.external,
            arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
          }
        };
      }

      // Add CPU usage if enabled
      if (logCPUUsage) {
        performanceData.cpu = process.cpuUsage(req.performanceCPU);
      }

      // Log performance based on response time
      if (responseTime >= criticalRequestThreshold) {
        comprehensiveLogger.logSystemEvent('CRITICAL_SLOW_REQUEST', {
          ...performanceData,
          severity: 'critical',
          threshold: `${criticalRequestThreshold}ms`,
          exceedsThresholdBy: `${(responseTime - criticalRequestThreshold).toFixed(2)}ms`
        });
      } else if (responseTime >= slowRequestThreshold) {
        comprehensiveLogger.logSystemEvent('SLOW_REQUEST', {
          ...performanceData,
          severity: 'medium',
          threshold: `${slowRequestThreshold}ms`,
          exceedsThresholdBy: `${(responseTime - slowRequestThreshold).toFixed(2)}ms`
        });
      } else {
        // Log all requests to performance logger
        comprehensiveLogger.apiPerformance.info('REQUEST_PERFORMANCE', performanceData);
      }

      // Track errors
      if (res.statusCode >= 400) {
        systemMetrics.incrementError();
        
        comprehensiveLogger.logSystemEvent('REQUEST_ERROR_PERFORMANCE', {
          ...performanceData,
          errorType: res.statusCode >= 500 ? 'server_error' : 'client_error',
          severity: res.statusCode >= 500 ? 'high' : 'medium'
        });
      }

      // Log database query performance if present
      if (req.dbQueries && req.dbQueries.length > 0) {
        const totalDbTime = req.dbQueries.reduce((sum, query) => sum + query.duration, 0);
        comprehensiveLogger.logSystemEvent('DATABASE_PERFORMANCE', {
          requestId: req.requestId,
          totalQueries: req.dbQueries.length,
          totalDbTime: `${totalDbTime}ms`,
          dbTimePercentage: `${((totalDbTime / responseTime) * 100).toFixed(2)}%`,
          queries: req.dbQueries.map(q => ({
            operation: q.operation,
            collection: q.collection,
            duration: `${q.duration}ms`,
            category: comprehensiveLogger.categorizePerformance(q.duration)
          }))
        });
      }

      // Call original res.end
      originalEnd.apply(this, args);
    };

    next();
  };
};

/**
 * Database query performance tracker
 */
const databasePerformanceTracker = () => {
  return (req, res, next) => {
    req.dbQueries = [];
    
    // Add helper method to track DB queries
    req.trackDbQuery = (operation, collection, startTime) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const queryInfo = {
        operation,
        collection,
        duration,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        category: comprehensiveLogger.categorizePerformance(duration)
      };
      
      req.dbQueries.push(queryInfo);
      
      // Log individual slow queries
      if (duration > 1000) {
        comprehensiveLogger.logDatabaseQuery(operation, collection, duration, {
          requestId: req.requestId,
          severity: duration > 3000 ? 'high' : 'medium',
          queryDetails: queryInfo
        });
      }
      
      return queryInfo;
    };

    next();
  };
};

/**
 * Health check endpoint with detailed metrics
 */
const healthCheckLogger = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        loadavg: os.loadavg()
      },
      metrics: {
        requestCount: systemMetrics.requestCount,
        errorCount: systemMetrics.errorCount,
        errorRate: systemMetrics.requestCount > 0 ? 
          `${((systemMetrics.errorCount / systemMetrics.requestCount) * 100).toFixed(2)}%` : '0%'
      }
    };

    // Log health check
    comprehensiveLogger.logSystemEvent('HEALTH_CHECK', {
      requestedBy: req.ip,
      userAgent: req.get('User-Agent'),
      ...healthData
    });

    return res.json(healthData);
  }
  
  next();
};

/**
 * Request timeout monitoring
 */
const timeoutMonitor = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        comprehensiveLogger.logSystemEvent('REQUEST_TIMEOUT', {
          method: req.method,
          url: req.originalUrl,
          timeout: `${timeoutMs}ms`,
          requestId: req.requestId,
          severity: 'high'
        });
        
        res.status(408).json({
          error: 'Request timeout',
          timeout: `${timeoutMs}ms`,
          requestId: req.requestId
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });

    res.on('close', () => {
      clearTimeout(timer);
    });

    next();
  };
};

/**
 * API rate limiting performance tracker
 */
const rateLimitPerformanceTracker = () => {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip + req.originalUrl;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.firstRequest > windowMs) {
        requestCounts.delete(key);
      }
    }
    
    // Update request count
    if (!requestCounts.has(identifier)) {
      requestCounts.set(identifier, { count: 1, firstRequest: now });
    } else {
      const data = requestCounts.get(identifier);
      data.count++;
      requestCounts.set(identifier, data);
      
      // Log high request rates
      if (data.count > 100) { // More than 100 requests per minute
        comprehensiveLogger.logSecurityEvent('HIGH_REQUEST_RATE', {
          ip: req.ip,
          url: req.originalUrl,
          requestCount: data.count,
          timeWindow: '1 minute',
          severity: data.count > 200 ? 'high' : 'medium'
        });
      }
    }
    
    next();
  };
};

/**
 * Cleanup function for graceful shutdown
 */
const cleanup = () => {
  systemMetrics.stop();
};

// Handle graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
  performanceLogger,
  databasePerformanceTracker,
  healthCheckLogger,
  timeoutMonitor,
  rateLimitPerformanceTracker,
  systemMetrics,
  cleanup
};