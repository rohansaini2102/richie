const { logger } = require('../../../utils/logger');
const { casEventLogger } = require('../../../utils/casEventLogger');

/**
 * Enhanced Base Parser for CAS documents with comprehensive logging and utilities
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
    return `PARSER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    
    // Use casEventLogger for CAS-specific events
    switch (level) {
      case 'info':
        casEventLogger.logInfo(event, logData);
        logger.info(message, logData);
        break;
      case 'error':
        casEventLogger.logError(event, new Error(data.error || 'Parser error'), logData);
        logger.error(message, logData);
        break;
      case 'warn':
        casEventLogger.logWarn(event, logData);
        logger.warn(message, logData);
        break;
      case 'debug':
        logger.debug(message, logData);
        break;
      default:
        logger.info(message, logData);
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
   * Parse currency value with enhanced handling
   */
  parseCurrency(value) {
    if (!value) return 0;
    
    // Handle different formats: 1,234.56, 1234.56, 1,234, etc.
    const cleaned = value.toString()
      .replace(/[^\d.-]/g, '') // Remove all non-numeric except decimal and minus
      .replace(/^-+/, '-'); // Keep only the first minus sign
    
    const parsed = parseFloat(cleaned) || 0;
    return Math.round(parsed * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Parse number with enhanced handling
   */
  parseNumber(str) {
    if (!str) return 0;
    
    // Handle comma-separated numbers and decimal points
    const cleanStr = str.toString()
      .replace(/,/g, '') // Remove commas
      .replace(/[^0-9.-]/g, ''); // Keep only numbers, decimal point, and minus
    
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse date in various formats
   */
  parseDate(dateStr) {
    if (!dateStr) return '';
    
    try {
      // Handle DD-MMM-YYYY format (e.g., 15-JAN-2025)
      if (/\d{2}-[A-Z]{3}-\d{4}/i.test(dateStr)) {
        const months = {
          'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
          'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
          'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };
        const parts = dateStr.split('-');
        const month = months[parts[1].toUpperCase()];
        if (month) {
          return `${parts[2]}-${month}-${parts[0]}`;
        }
      }
      
      // Handle DD/MM/YYYY format
      if (/\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        const parts = dateStr.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      // Handle YYYY-MM-DD format (already correct)
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr;
      }
      
    } catch (error) {
      this.logStructured('warn', 'DATE_PARSE_ERROR', {
        dateStr,
        error: error.message
      });
    }
    
    return dateStr; // Return as-is if no format matches
  }

  /**
   * Generate unique ID with prefix
   */
  generateId(prefix = 'id') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate extracted data structure
   */
  validateData(data) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check required structure
      if (!data || typeof data !== 'object') {
        validation.errors.push('Data must be an object');
        validation.isValid = false;
        return validation;
      }

      // Check investor info
      if (!data.investor) {
        validation.warnings.push('No investor information found');
      } else {
        if (!data.investor.name) {
          validation.warnings.push('Investor name not found');
        }
        if (!data.investor.pan) {
          validation.warnings.push('PAN number not found');
        }
      }

      // Check accounts
      if (!data.demat_accounts || !Array.isArray(data.demat_accounts)) {
        validation.warnings.push('No demat accounts array found');
      } else if (data.demat_accounts.length === 0) {
        validation.warnings.push('No demat accounts found');
      }

      // Check mutual funds
      if (!data.mutual_funds || !Array.isArray(data.mutual_funds)) {
        validation.warnings.push('No mutual funds array found');
      } else if (data.mutual_funds.length === 0) {
        validation.warnings.push('No mutual funds found');
      }

      // Overall data validation
      const hasAnyData = (data.investor && (data.investor.name || data.investor.pan)) ||
                        (data.demat_accounts && data.demat_accounts.length > 0) ||
                        (data.mutual_funds && data.mutual_funds.length > 0);

      if (!hasAnyData) {
        validation.errors.push('No meaningful data extracted from CAS');
        validation.isValid = false;
      }

    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
      validation.isValid = false;
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
   * Enhanced text extraction between patterns
   */
  extractBetween(text, startPattern, endPattern) {
    try {
      const startMatch = text.match(startPattern);
      if (!startMatch) return '';
      
      const startIndex = startMatch.index + startMatch[0].length;
      const remainingText = text.substring(startIndex);
      
      const endMatch = remainingText.match(endPattern);
      if (!endMatch) return remainingText.trim();
      
      return remainingText.substring(0, endMatch.index).trim();
    } catch (error) {
      this.logStructured('warn', 'EXTRACT_BETWEEN_ERROR', {
        error: error.message,
        startPattern: startPattern.toString(),
        endPattern: endPattern.toString()
      });
      return '';
    }
  }

  /**
   * Find all matches with context
   */
  findAllMatches(text, pattern, contextLength = 50) {
    const matches = [];
    let match;
    
    try {
      // Ensure pattern has global flag
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      
      while ((match = globalPattern.exec(text)) !== null) {
        const startIndex = Math.max(0, match.index - contextLength);
        const endIndex = Math.min(text.length, match.index + match[0].length + contextLength);
        
        matches.push({
          match: match[0],
          index: match.index,
          context: text.substring(startIndex, endIndex),
          groups: match.slice(1)
        });
      }
    } catch (error) {
      this.logStructured('warn', 'FIND_ALL_MATCHES_ERROR', {
        error: error.message,
        pattern: pattern.toString()
      });
    }
    
    return matches;
  }

  /**
   * Check if text contains any of the patterns
   */
  containsAny(text, patterns) {
    if (!text || !Array.isArray(patterns)) return false;
    
    const lowerText = text.toLowerCase();
    return patterns.some(pattern => {
      if (typeof pattern === 'string') {
        return lowerText.includes(pattern.toLowerCase());
      } else if (pattern instanceof RegExp) {
        return pattern.test(text);
      }
      return false;
    });
  }

  /**
   * Extract numbers from text with labels
   */
  extractLabeledNumbers(text, labels) {
    const results = {};
    
    labels.forEach(label => {
      const pattern = new RegExp(`${label}\\s*:?\\s*([\\d,]+\\.?\\d*)`, 'gi');
      const match = text.match(pattern);
      if (match) {
        const numberMatch = match[0].match(/[\d,]+\.?\d*/);
        if (numberMatch) {
          results[label] = this.parseNumber(numberMatch[0]);
        }
      }
    });
    
    return results;
  }

  /**
   * Split text into meaningful sections
   */
  splitIntoSections(text, sectionMarkers) {
    const sections = {};
    
    try {
      for (let i = 0; i < sectionMarkers.length; i++) {
        const currentMarker = sectionMarkers[i];
        const nextMarker = sectionMarkers[i + 1];
        
        const startPattern = new RegExp(currentMarker.pattern, 'i');
        const startMatch = text.match(startPattern);
        
        if (startMatch) {
          const startIndex = startMatch.index;
          let endIndex = text.length;
          
          if (nextMarker) {
            const endPattern = new RegExp(nextMarker.pattern, 'i');
            const endMatch = text.substring(startIndex + 1).match(endPattern);
            if (endMatch) {
              endIndex = startIndex + 1 + endMatch.index;
            }
          }
          
          sections[currentMarker.name] = text.substring(startIndex, endIndex).trim();
        }
      }
    } catch (error) {
      this.logStructured('warn', 'SPLIT_SECTIONS_ERROR', {
        error: error.message,
        sectionCount: sectionMarkers.length
      });
    }
    
    return sections;
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  async parse(pdfText, password = null) {
    throw new Error(`${this.name}: parse method must be implemented by subclass`);
  }

  extractInvestorInfo(text) {
    throw new Error(`${this.name}: extractInvestorInfo method must be implemented by subclass`);
  }

  extractDematAccounts(text) {
    throw new Error(`${this.name}: extractDematAccounts method must be implemented by subclass`);
  }

  extractMutualFunds(text) {
    throw new Error(`${this.name}: extractMutualFunds method must be implemented by subclass`);
  }

  /**
   * Default implementation for insurance extraction
   */
  async extractInsurance() {
    return {
      life_insurance_policies: []
    };
  }

  /**
   * Default implementation for statement period extraction
   */
  extractStatementPeriod() {
    return {
      from: '',
      to: ''
    };
  }
}

module.exports = BaseParser;