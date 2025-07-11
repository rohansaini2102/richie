const pdfParse = require('pdf-parse');
const { logger } = require('../../../utils/logger');

/**
 * Base Parser for CAS documents with comprehensive logging
 */
class BaseParser {
  constructor() {
    this.name = 'BaseParser';
    this.casType = 'UNKNOWN';
    this.pdfText = '';
    this.trackingId = this.generateTrackingId();
  }

  /**
   * Generate unique tracking ID for this parsing session
   */
  generateTrackingId() {
    return `CAS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log structured data with tracking
   */
  logStructured(level, event, data = {}) {
    const logData = {
      trackingId: this.trackingId,
      event,
      timestamp: new Date().toISOString(),
      parser: this.name,
      casType: this.casType,
      ...data
    };

    const message = `[${this.trackingId}] ${event}`;
    
    switch (level) {
      case 'info':
        logger.info(message, logData);
        break;
      case 'error':
        logger.error(message, logData);
        break;
      case 'warn':
        logger.warn(message, logData);
        break;
      case 'debug':
        logger.debug(message, logData);
        break;
      default:
        logger.info(message, logData);
    }

    // Also log to console for immediate visibility
    console.log(`\n📊 ${level.toUpperCase()}: ${event}`);
    console.log(`🔍 Tracking ID: ${this.trackingId}`);
    console.log(`📝 Data:`, JSON.stringify(logData, null, 2));
  }

  /**
   * Extract text from PDF buffer
   */
  async extractText(pdfBuffer, password = null) {
    this.logStructured('info', 'PDF_TEXT_EXTRACTION_STARTED', {
      bufferSize: pdfBuffer.length,
      hasPassword: !!password
    });

    try {
      let extractedText;
      
      if (password) {
        this.logStructured('info', 'ATTEMPTING_PASSWORD_PROTECTED_EXTRACTION', {
          passwordLength: password.length
        });
        
        const data = await pdfParse(pdfBuffer, { password });
        extractedText = data.text;
      } else {
        const data = await pdfParse(pdfBuffer);
        extractedText = data.text;
      }

      this.logStructured('info', 'PDF_TEXT_EXTRACTION_COMPLETED', {
        textLength: extractedText.length,
        lineCount: extractedText.split('\n').length,
        wordCount: extractedText.split(/\s+/).length
      });

      return extractedText;
    } catch (error) {
      this.logStructured('error', 'PDF_TEXT_EXTRACTION_FAILED', {
        error: error.message,
        hasPassword: !!password
      });
      throw error;
    }
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Extract value using regex pattern
   */
  extractValue(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Parse currency value
   */
  parseCurrency(value) {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned) || 0;
    return Math.round(parsed * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate unique ID
   */
  generateId(prefix = 'id') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized response structure
   */
  createResponse(data) {
    this.logStructured('info', 'RESPONSE_CREATION_STARTED', {
      hasInvestorInfo: !!data.investorInfo,
      dematAccountsCount: data.dematAccounts ? data.dematAccounts.length : 0,
      holdingsCount: data.holdings ? data.holdings.length : 0,
      mutualFundsCount: data.mutualFunds ? data.mutualFunds.length : 0
    });

    const response = {
      investorInfo: data.investorInfo || {},
      dematAccounts: data.dematAccounts || [],
      holdings: data.holdings || [],
      mutualFunds: data.mutualFunds || [],
      summary: this.calculateSummary(data),
      metadata: {
        trackingId: this.trackingId,
        parser: this.name,
        casType: this.casType,
        parsedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    this.logStructured('info', 'RESPONSE_CREATION_COMPLETED', {
      totalHoldings: response.holdings.length,
      totalMutualFunds: response.mutualFunds.length,
      totalValue: response.summary.totalValue,
      responseSize: JSON.stringify(response).length
    });

    return response;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(data) {
    this.logStructured('info', 'SUMMARY_CALCULATION_STARTED');

    const summary = {
      totalValue: 0,
      holdingsValue: 0,
      mutualFundsValue: 0,
      holdingsCount: 0,
      mutualFundsCount: 0,
      categories: {}
    };

    // Calculate holdings summary
    if (data.holdings && Array.isArray(data.holdings)) {
      summary.holdingsCount = data.holdings.length;
      data.holdings.forEach(holding => {
        const value = this.parseCurrency(holding.currentValue || 0);
        summary.holdingsValue += value;
        
        const category = holding.category || 'Other';
        summary.categories[category] = (summary.categories[category] || 0) + value;
      });
    }

    // Calculate mutual funds summary
    if (data.mutualFunds && Array.isArray(data.mutualFunds)) {
      summary.mutualFundsCount = data.mutualFunds.length;
      data.mutualFunds.forEach(fund => {
        const value = this.parseCurrency(fund.currentValue || 0);
        summary.mutualFundsValue += value;
      });
    }

    summary.totalValue = summary.holdingsValue + summary.mutualFundsValue;

    this.logStructured('info', 'SUMMARY_CALCULATION_COMPLETED', {
      totalValue: summary.totalValue,
      holdingsValue: summary.holdingsValue,
      mutualFundsValue: summary.mutualFundsValue,
      categories: Object.keys(summary.categories).length
    });

    return summary;
  }

  /**
   * Validate extracted data
   */
  validateData(data) {
    this.logStructured('info', 'DATA_VALIDATION_STARTED');

    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check investor info
    if (!data.investorInfo || !data.investorInfo.name) {
      validation.errors.push('Investor name is required');
      validation.isValid = false;
    }

    if (!data.investorInfo || !data.investorInfo.pan) {
      validation.errors.push('PAN number is required');
      validation.isValid = false;
    }

    // Check accounts
    if (!data.dematAccounts || data.dematAccounts.length === 0) {
      validation.warnings.push('No demat accounts found');
    }

    // Check holdings
    if (!data.holdings || data.holdings.length === 0) {
      validation.warnings.push('No holdings found');
    }

    this.logStructured(validation.isValid ? 'info' : 'warn', 'DATA_VALIDATION_COMPLETED', {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      errors: validation.errors,
      warnings: validation.warnings
    });

    return validation;
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  async parse(pdfBuffer, password = null) {
    throw new Error(`${this.name}: parse method must be implemented by subclass`);
  }

  extractInvestorInfo(text) {
    throw new Error(`${this.name}: extractInvestorInfo method must be implemented by subclass`);
  }

  extractDematAccounts(text) {
    throw new Error(`${this.name}: extractDematAccounts method must be implemented by subclass`);
  }

  extractHoldings(text) {
    throw new Error(`${this.name}: extractHoldings method must be implemented by subclass`);
  }

  extractMutualFunds(text) {
    throw new Error(`${this.name}: extractMutualFunds method must be implemented by subclass`);
  }
}

module.exports = BaseParser;