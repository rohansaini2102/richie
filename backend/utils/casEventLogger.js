const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bg_red: '\x1b[41m',
  bg_green: '\x1b[42m',
  bg_yellow: '\x1b[43m',
  bg_blue: '\x1b[44m',
  bg_magenta: '\x1b[45m',
  bg_cyan: '\x1b[46m'
};

// Create CAS logs directory
const casLogsDir = path.join(__dirname, '../logs/cas');
if (!fs.existsSync(casLogsDir)) {
  fs.mkdirSync(casLogsDir, { recursive: true });
}

// Create dedicated CAS logger
const casLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(casLogsDir, 'cas-events.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 20
    }),
    new winston.transports.File({
      filename: path.join(casLogsDir, 'cas-errors.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 20
    }),
    new winston.transports.File({
      filename: path.join(casLogsDir, 'cas-tracking.log'),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}`;
        })
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 20
    })
  ]
});

class CASEventLogger {
  constructor() {
    this.sessionId = `CAS_SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventCounter = 0;
  }

  generateEventId() {
    this.eventCounter++;
    return `EVT_${this.eventCounter.toString().padStart(4, '0')}_${Date.now()}`;
  }

  formatConsoleOutput(level, event, data) {
    const eventId = this.generateEventId();
    const timestamp = new Date().toISOString();
    const color = this.getColorForLevel(level);
    const icon = this.getIconForEvent(event);
    
    console.log('\n' + colors.cyan + '═'.repeat(100) + colors.reset);
    console.log(
      `${color}${icon} CAS EVENT: ${event}${colors.reset} ` +
      `${colors.dim}[ID: ${eventId}]${colors.reset}`
    );
    console.log(`${colors.blue}⏰ Timestamp:${colors.reset} ${timestamp}`);
    console.log(`${colors.magenta}🔄 Session:${colors.reset} ${this.sessionId}`);
    
    if (data.clientId) {
      console.log(`${colors.green}👤 Client ID:${colors.reset} ${data.clientId}`);
    }
    if (data.advisorId) {
      console.log(`${colors.yellow}🏢 Advisor ID:${colors.reset} ${data.advisorId}`);
    }
    if (data.onboardingToken) {
      console.log(`${colors.magenta}🎫 Onboarding Token:${colors.reset} ${data.onboardingToken}`);
    }
    
    // Display structured data
    if (Object.keys(data).length > 0) {
      console.log(`${colors.cyan}📊 Event Data:${colors.reset}`);
      this.displayStructuredData(data, 1);
    }
    
    console.log(colors.cyan + '═'.repeat(100) + colors.reset);
    
    return eventId;
  }

  displayStructuredData(obj, indent = 0) {
    const prefix = '  '.repeat(indent);
    const connector = indent > 0 ? '├─ ' : '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'clientId' || key === 'advisorId' || key === 'onboardingToken') {
        continue; // Already displayed above
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(`${prefix}${connector}${colors.bright}${key}:${colors.reset}`);
        this.displayStructuredData(value, indent + 1);
      } else if (Array.isArray(value)) {
        console.log(`${prefix}${connector}${colors.bright}${key}:${colors.reset} ${colors.dim}[Array with ${value.length} items]${colors.reset}`);
        if (value.length > 0 && value.length <= 5) {
          value.forEach((item, index) => {
            console.log(`${prefix}  [${index}] ${JSON.stringify(item)}`);
          });
        }
      } else {
        const displayValue = this.formatValue(key, value);
        console.log(`${prefix}${connector}${colors.bright}${key}:${colors.reset} ${displayValue}`);
      }
    }
  }

  formatValue(key, value) {
    if (value === null || value === undefined) {
      return `${colors.dim}null${colors.reset}`;
    }
    
    // Format specific types
    if (key.toLowerCase().includes('password')) {
      return `${colors.red}***MASKED***${colors.reset}`;
    }
    
    if (key.toLowerCase().includes('pan') && typeof value === 'string') {
      return `${colors.yellow}***MASKED***${colors.reset}`;
    }
    
    if (key.toLowerCase().includes('size') && typeof value === 'number') {
      return `${colors.green}${this.formatFileSize(value)}${colors.reset}`;
    }
    
    if (key.toLowerCase().includes('value') && typeof value === 'number') {
      return `${colors.green}₹${value.toLocaleString('en-IN')}${colors.reset}`;
    }
    
    if (key.toLowerCase().includes('duration') && typeof value === 'number') {
      return `${colors.cyan}${value}ms${colors.reset}`;
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return `${colors.dim}"${value.substring(0, 100)}..."${colors.reset}`;
    }
    
    if (typeof value === 'boolean') {
      return value ? `${colors.green}✓ true${colors.reset}` : `${colors.red}✗ false${colors.reset}`;
    }
    
    return JSON.stringify(value);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getColorForLevel(level) {
    switch (level.toLowerCase()) {
      case 'error': return colors.red;
      case 'warn': return colors.yellow;
      case 'info': return colors.green;
      case 'debug': return colors.blue;
      default: return colors.white;
    }
  }

  getIconForEvent(event) {
    const eventUpper = event.toUpperCase();
    
    if (eventUpper.includes('UPLOAD')) return '📤';
    if (eventUpper.includes('PARSE')) return '🔍';
    if (eventUpper.includes('SUCCESS')) return '✅';
    if (eventUpper.includes('FAILED') || eventUpper.includes('ERROR')) return '❌';
    if (eventUpper.includes('START')) return '🚀';
    if (eventUpper.includes('COMPLETED')) return '🎉';
    if (eventUpper.includes('REQUEST')) return '📥';
    if (eventUpper.includes('ONBOARDING')) return '📝';
    if (eventUpper.includes('INVITATION')) return '📨';
    if (eventUpper.includes('CLIENT')) return '👤';
    if (eventUpper.includes('ADVISOR')) return '🏢';
    if (eventUpper.includes('DELETE')) return '🗑️';
    if (eventUpper.includes('CREATE')) return '✨';
    if (eventUpper.includes('UPDATE')) return '🔄';
    
    return '📊';
  }

  logEvent(level, event, data = {}) {
    const eventId = this.formatConsoleOutput(level, event, data);
    
    const logData = {
      eventId,
      sessionId: this.sessionId,
      event,
      level,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    // Log to file
    casLogger.log(level, event, logData);
    
    return eventId;
  }

  logInfo(event, data = {}) {
    return this.logEvent('info', event, data);
  }

  logError(event, error, data = {}) {
    const errorData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...data
    };
    
    return this.logEvent('error', event, errorData);
  }

  logWarn(event, data = {}) {
    return this.logEvent('warn', event, data);
  }

  logDebug(event, data = {}) {
    return this.logEvent('debug', event, data);
  }

  // Specialized logging methods
  logClientEvent(event, clientId, data = {}) {
    return this.logInfo(event, { clientId, ...data });
  }

  logOnboardingEvent(event, token, data = {}) {
    return this.logInfo(event, { onboardingToken: token, ...data });
  }

  logCASUpload(clientId, fileName, fileSize, advisorId, isOnboarding = false) {
    return this.logInfo('CAS_FILE_UPLOADED', {
      clientId,
      advisorId,
      fileName,
      fileSize,
      isOnboarding,
      uploadedAt: new Date().toISOString()
    });
  }

  logCASParseStart(clientId, fileName, advisorId) {
    return this.logInfo('CAS_PARSE_INITIATED', {
      clientId,
      advisorId,
      fileName,
      parseStartedAt: new Date().toISOString()
    });
  }

  logCASParseSuccess(clientId, parsedData, advisorId) {
    return this.logInfo('CAS_PARSE_COMPLETED_SUCCESSFULLY', {
      clientId,
      advisorId,
      summary: {
        totalValue: parsedData.summary?.totalValue || 0,
        holdingsCount: parsedData.holdings?.length || 0,
        mutualFundsCount: parsedData.mutualFunds?.length || 0,
        investorName: parsedData.investorInfo?.name,
        investorPAN: parsedData.investorInfo?.pan ? '***MASKED***' : null,
        casType: parsedData.metadata?.format
      },
      parseCompletedAt: new Date().toISOString()
    });
  }

  logAdvisorDashboardUpdate(eventType, advisorId, clientData) {
    return this.logInfo('ADVISOR_DASHBOARD_UPDATE', {
      eventType,
      advisorId,
      clientData,
      dashboardUpdatedAt: new Date().toISOString()
    });
  }

  logOnboardingComplete(clientId, advisorId, clientData) {
    return this.logInfo('CLIENT_ONBOARDING_COMPLETED', {
      clientId,
      advisorId,
      clientSummary: {
        name: `${clientData.firstName} ${clientData.lastName}`,
        email: clientData.email,
        hasFinancialData: !!(clientData.annualIncome || clientData.riskTolerance),
        hasCASData: !!(clientData.casData && clientData.casData.casStatus !== 'not_uploaded'),
        portfolioValue: clientData.totalPortfolioValue || 0
      },
      onboardingCompletedAt: new Date().toISOString()
    });
  }

  // Generate comprehensive flow summary
  generateFlowSummary(flowType, events = []) {
    console.log('\n' + colors.bg_blue + colors.white + ' FLOW SUMMARY '.padStart(50, ' ').padEnd(100, ' ') + colors.reset);
    console.log(`${colors.bright}Flow Type:${colors.reset} ${flowType}`);
    console.log(`${colors.bright}Session ID:${colors.reset} ${this.sessionId}`);
    console.log(`${colors.bright}Total Events:${colors.reset} ${events.length}`);
    console.log(`${colors.bright}Generated At:${colors.reset} ${new Date().toISOString()}`);
    
    if (events.length > 0) {
      console.log('\n' + colors.cyan + 'Event Timeline:' + colors.reset);
      events.forEach((event, index) => {
        const status = event.success ? colors.green + '✅' : colors.red + '❌';
        console.log(`  ${index + 1}. ${status} ${event.name}${colors.reset} (${event.duration || 'N/A'})`);
      });
    }
    
    console.log('\n' + colors.bg_blue + ''.padEnd(100, ' ') + colors.reset);
  }
}

// Create singleton instance
const casEventLogger = new CASEventLogger();

module.exports = {
  CASEventLogger,
  casEventLogger,
  casLogger // Winston logger instance
};