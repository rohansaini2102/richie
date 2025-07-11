#!/usr/bin/env node

/**
 * CAS Event Monitoring Script
 * Real-time monitoring of CAS upload, parsing, and client onboarding events
 * 
 * Usage: node cas-monitor.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colors for terminal output
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
  bg_blue: '\x1b[44m'
};

class CASMonitor {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.casLogsDir = path.join(__dirname, '../logs/cas');
    this.monitoringFiles = [
      path.join(this.logsDir, 'combined.log'),
      path.join(this.casLogsDir, 'cas-events.log'),
      path.join(this.casLogsDir, 'cas-tracking.log')
    ];
    this.watchers = [];
    this.eventStats = {
      uploads: 0,
      parses: 0,
      completions: 0,
      errors: 0
    };
    this.startTime = new Date();
  }

  init() {
    this.displayHeader();
    this.createLogDirectories();
    this.startMonitoring();
    this.setupGracefulShutdown();
  }

  displayHeader() {
    console.clear();
    console.log(colors.bg_blue + colors.white + ''.padEnd(80, ' ') + colors.reset);
    console.log(colors.bg_blue + colors.white + '  🔍 RICHIEAT CAS EVENT MONITOR  '.padStart(55, ' ').padEnd(80, ' ') + colors.reset);
    console.log(colors.bg_blue + colors.white + ''.padEnd(80, ' ') + colors.reset);
    console.log('');
    console.log(colors.cyan + '📊 Monitoring CAS Events in Real-Time' + colors.reset);
    console.log(colors.dim + 'Started at: ' + this.startTime.toISOString() + colors.reset);
    console.log('');
    console.log(colors.yellow + '📂 Monitoring Files:' + colors.reset);
    this.monitoringFiles.forEach(file => {
      const exists = fs.existsSync(file);
      const status = exists ? colors.green + '✓' : colors.red + '✗';
      console.log(`  ${status} ${file}${colors.reset}`);
    });
    console.log('');
    console.log(colors.bright + '═'.repeat(80) + colors.reset);
    console.log(colors.green + '🟢 Monitor Active - Waiting for CAS events...' + colors.reset);
    console.log(colors.bright + '═'.repeat(80) + colors.reset);
    console.log('');
  }

  createLogDirectories() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    if (!fs.existsSync(this.casLogsDir)) {
      fs.mkdirSync(this.casLogsDir, { recursive: true });
    }
  }

  startMonitoring() {
    this.monitoringFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        this.watchFile(filePath);
      } else {
        // Create empty file if it doesn't exist
        fs.writeFileSync(filePath, '');
        this.watchFile(filePath);
      }
    });

    // Display live stats every 30 seconds
    setInterval(() => {
      this.displayStats();
    }, 30000);
  }

  watchFile(filePath) {
    let lastSize = fs.statSync(filePath).size;

    const watcher = fs.watchFile(filePath, { interval: 500 }, (curr, prev) => {
      if (curr.size > lastSize) {
        this.handleFileChange(filePath, lastSize, curr.size);
        lastSize = curr.size;
      }
    });

    this.watchers.push(() => fs.unwatchFile(filePath));
  }

  handleFileChange(filePath, lastSize, currentSize) {
    const fileStream = fs.createReadStream(filePath, {
      start: lastSize,
      end: currentSize - 1,
      encoding: 'utf8'
    });

    let buffer = '';
    fileStream.on('data', (chunk) => {
      buffer += chunk;
    });

    fileStream.on('end', () => {
      const lines = buffer.split('\n').filter(line => line.trim());
      lines.forEach(line => this.processLogLine(line, filePath));
    });
  }

  processLogLine(line, filePath) {
    try {
      // Try to parse as JSON first
      if (line.includes('{') && line.includes('}')) {
        const jsonMatch = line.match(/\{.*\}/);
        if (jsonMatch) {
          const logData = JSON.parse(jsonMatch[0]);
          this.displayCASEvent(logData, filePath);
          return;
        }
      }

      // Handle regular log lines
      if (this.isCASRelated(line)) {
        this.displayRegularLog(line, filePath);
      }
    } catch (error) {
      // Ignore parsing errors for non-JSON lines
    }
  }

  isCASRelated(line) {
    const casKeywords = [
      'CAS_', 'ONBOARDING', 'CLIENT', 'UPLOAD', 'PARSE', 'ADVISOR',
      'cas', 'onboarding', 'client', 'upload', 'parse', 'advisor'
    ];
    return casKeywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()));
  }

  displayCASEvent(logData, filePath) {
    const timestamp = new Date().toISOString();
    const fileName = path.basename(filePath);
    
    // Update stats
    this.updateStats(logData);

    // Get event icon and color
    const { icon, color } = this.getEventStyle(logData.event || logData.message || '');

    console.log('');
    console.log(color + '━'.repeat(80) + colors.reset);
    console.log(`${icon} ${color}${logData.event || 'CAS EVENT'}${colors.reset} ${colors.dim}[${fileName}]${colors.reset}`);
    console.log(`${colors.blue}⏰ ${timestamp}${colors.reset}`);

    // Display key information
    if (logData.clientId) {
      console.log(`${colors.green}👤 Client:${colors.reset} ${logData.clientId}`);
    }
    if (logData.advisorId) {
      console.log(`${colors.yellow}🏢 Advisor:${colors.reset} ${logData.advisorId}`);
    }
    if (logData.fileName) {
      console.log(`${colors.cyan}📄 File:${colors.reset} ${logData.fileName}`);
    }
    if (logData.trackingId || logData.eventId) {
      console.log(`${colors.magenta}🔍 ID:${colors.reset} ${logData.trackingId || logData.eventId}`);
    }

    // Display relevant data
    this.displayEventData(logData);

    console.log(color + '━'.repeat(80) + colors.reset);
  }

  displayEventData(logData) {
    const relevantKeys = [
      'fileSize', 'totalValue', 'duration', 'status', 'casStatus',
      'holdingsCount', 'mutualFundsCount', 'investorName', 'casType',
      'error', 'message', 'success'
    ];

    relevantKeys.forEach(key => {
      if (logData[key] !== undefined) {
        const value = this.formatValue(key, logData[key]);
        const label = this.formatLabel(key);
        console.log(`${colors.bright}${label}:${colors.reset} ${value}`);
      }
    });

    // Handle nested objects
    if (logData.summary) {
      console.log(`${colors.bright}Summary:${colors.reset}`);
      Object.entries(logData.summary).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        } else {
          console.log(`  ${key}: ${this.formatValue(key, value)}`);
        }
      });
    }

    if (logData.error && typeof logData.error === 'object') {
      console.log(`${colors.red}❌ Error: ${logData.error.message}${colors.reset}`);
    }
  }

  formatLabel(key) {
    const labelMap = {
      fileSize: '📏 Size',
      totalValue: '💰 Value',
      duration: '⏱️  Duration',
      status: '📊 Status',
      casStatus: '📈 CAS Status',
      holdingsCount: '📋 Holdings',
      mutualFundsCount: '🏦 MF Count',
      investorName: '👤 Investor',
      casType: '📂 Type'
    };
    return labelMap[key] || key;
  }

  formatValue(key, value) {
    if (value === null || value === undefined) {
      return `${colors.dim}null${colors.reset}`;
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

    if (key.toLowerCase().includes('count') && typeof value === 'number') {
      return `${colors.yellow}${value}${colors.reset}`;
    }

    if (typeof value === 'boolean') {
      return value ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    }

    if (typeof value === 'string' && value.length > 50) {
      return `${colors.dim}"${value.substring(0, 50)}..."${colors.reset}`;
    }

    return value.toString();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getEventStyle(event) {
    const eventUpper = event.toUpperCase();

    if (eventUpper.includes('ERROR') || eventUpper.includes('FAILED')) {
      return { icon: '❌', color: colors.red };
    }
    if (eventUpper.includes('SUCCESS') || eventUpper.includes('COMPLETED')) {
      return { icon: '✅', color: colors.green };
    }
    if (eventUpper.includes('UPLOAD')) {
      return { icon: '📤', color: colors.blue };
    }
    if (eventUpper.includes('PARSE')) {
      return { icon: '🔍', color: colors.cyan };
    }
    if (eventUpper.includes('START')) {
      return { icon: '🚀', color: colors.yellow };
    }
    if (eventUpper.includes('ONBOARDING')) {
      return { icon: '📝', color: colors.magenta };
    }

    return { icon: '📊', color: colors.white };
  }

  updateStats(logData) {
    const event = (logData.event || '').toUpperCase();
    
    if (event.includes('UPLOAD') && event.includes('SUCCESS')) {
      this.eventStats.uploads++;
    } else if (event.includes('PARSE') && event.includes('SUCCESS')) {
      this.eventStats.parses++;
    } else if (event.includes('ONBOARDING') && event.includes('COMPLETED')) {
      this.eventStats.completions++;
    } else if (event.includes('ERROR') || event.includes('FAILED')) {
      this.eventStats.errors++;
    }
  }

  displayRegularLog(line, filePath) {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString();
    
    console.log('');
    console.log(`${colors.dim}📋 [${fileName}] ${timestamp}${colors.reset}`);
    console.log(`${colors.white}${line}${colors.reset}`);
  }

  displayStats() {
    const uptime = new Date() - this.startTime;
    const uptimeStr = this.formatUptime(uptime);

    console.log('');
    console.log(colors.bg_green + colors.white + ''.padEnd(80, ' ') + colors.reset);
    console.log(colors.bg_green + colors.white + `  📊 LIVE STATS - Uptime: ${uptimeStr}  `.padStart(45, ' ').padEnd(80, ' ') + colors.reset);
    console.log(colors.bg_green + colors.white + ''.padEnd(80, ' ') + colors.reset);
    console.log('');
    console.log(`${colors.bright}📤 Uploads: ${colors.green}${this.eventStats.uploads}${colors.reset}`);
    console.log(`${colors.bright}🔍 Parses: ${colors.cyan}${this.eventStats.parses}${colors.reset}`);
    console.log(`${colors.bright}✅ Completions: ${colors.green}${this.eventStats.completions}${colors.reset}`);
    console.log(`${colors.bright}❌ Errors: ${colors.red}${this.eventStats.errors}${colors.reset}`);
    console.log('');
  }

  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      console.log('');
      console.log(colors.yellow + '🛑 Shutting down CAS Monitor...' + colors.reset);
      
      // Stop all watchers
      this.watchers.forEach(unwatch => unwatch());
      
      // Display final stats
      this.displayStats();
      
      console.log('');
      console.log(colors.green + '✅ CAS Monitor stopped successfully' + colors.reset);
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// Create and start monitor
const monitor = new CASMonitor();
monitor.init();