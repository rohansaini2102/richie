// Backend routes for logging endpoints
const express = require('express');
const router = express.Router();
const comprehensiveLogger = require('../utils/comprehensiveLogger');
const { frontendLogIngestionMiddleware } = require('../middleware/userActivityLogger');

// Apply the frontend log ingestion middleware
router.use(frontendLogIngestionMiddleware);

// Manual log endpoint for specific events
router.post('/event', (req, res) => {
  try {
    const { level, type, message, metadata } = req.body;
    
    if (!level || !type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: level, type, message'
      });
    }

    const enhancedMetadata = {
      ...metadata,
      serverReceivedAt: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId
    };

    // Route to appropriate logger based on type
    switch (type) {
      case 'user_interaction':
        comprehensiveLogger.logUserInteraction(message, enhancedMetadata);
        break;
      case 'form_progress':
        comprehensiveLogger.formProgress[level || 'info'](message, enhancedMetadata);
        break;
      case 'error':
        comprehensiveLogger.logApplicationError(
          new Error(message), 
          metadata.component || 'frontend', 
          metadata.severity || 'medium', 
          enhancedMetadata
        );
        break;
      case 'performance':
        comprehensiveLogger.apiPerformance.info(message, enhancedMetadata);
        break;
      case 'cas':
        comprehensiveLogger.logCASEvent(message, enhancedMetadata);
        break;
      default:
        comprehensiveLogger.system.info(`FRONTEND_EVENT: ${message}`, enhancedMetadata);
    }

    res.json({ success: true, logged: true });
  } catch (error) {
    comprehensiveLogger.logApplicationError(error, 'loggingRoute', 'medium', {
      requestBody: req.body
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process log event'
    });
  }
});

// Endpoint to retrieve recent logs (development only)
router.get('/recent', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Log retrieval not available in production'
    });
  }

  try {
    const { type = 'all', limit = 100, level } = req.query;
    
    // This is a simplified endpoint - in a real implementation,
    // you would query your log storage system
    res.json({
      success: true,
      message: 'In a real implementation, this would return recent logs from storage',
      query: { type, limit, level },
      note: 'This endpoint is for development purposes. Check log files directly.'
    });
  } catch (error) {
    comprehensiveLogger.logApplicationError(error, 'loggingRoute', 'medium');
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs'
    });
  }
});

// System metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const { systemMetrics } = require('../middleware/performanceLogger');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      requests: {
        total: systemMetrics.requestCount,
        errors: systemMetrics.errorCount,
        errorRate: systemMetrics.requestCount > 0 ? 
          `${((systemMetrics.errorCount / systemMetrics.requestCount) * 100).toFixed(2)}%` : '0%'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    comprehensiveLogger.logSystemEvent('METRICS_REQUEST', {
      requestedBy: req.ip,
      metrics
    });

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    comprehensiveLogger.logApplicationError(error, 'loggingRoute', 'medium');
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

// Log analysis endpoint (development only)
router.post('/analyze', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Log analysis not available in production'
    });
  }

  try {
    const { sessionId, userId, timeRange } = req.body;
    
    comprehensiveLogger.logSystemEvent('LOG_ANALYSIS_REQUEST', {
      requestedBy: req.ip,
      parameters: { sessionId, userId, timeRange }
    });

    // In a real implementation, this would analyze logs and return insights
    res.json({
      success: true,
      message: 'Log analysis would be performed here',
      parameters: { sessionId, userId, timeRange },
      note: 'This would typically involve querying log aggregation services'
    });
  } catch (error) {
    comprehensiveLogger.logApplicationError(error, 'loggingRoute', 'medium');
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze logs'
    });
  }
});

// Error reporting endpoint
router.post('/error-report', (req, res) => {
  try {
    const { error, component, severity, context } = req.body;
    
    if (!error || !component) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: error, component'
      });
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    comprehensiveLogger.logApplicationError(
      errorObj,
      component,
      severity || 'medium',
      {
        ...context,
        reportedVia: 'api',
        serverReceivedAt: new Date().toISOString(),
        ip: req.ip
      }
    );

    res.json({ 
      success: true, 
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    comprehensiveLogger.logApplicationError(error, 'errorReportRoute', 'medium');
    
    res.status(500).json({
      success: false,
      error: 'Failed to process error report'
    });
  }
});

module.exports = router;