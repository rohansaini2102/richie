const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const crypto = require('crypto');

class CASParser {
  constructor() {
    this.supportedFormats = ['CDSL', 'NSDL', 'CAMS', 'KARVY'];
    this.parsers = {
      'CDSL': require('./parsers/cdsl-parser'),
      'NSDL': require('./parsers/nsdl-parser'),
      'CAMS': require('./parsers/cams-parser'),
      'KARVY': require('./parsers/karvy-parser')
    };
  }

  /**
   * Parse CAS file and extract structured data
   * @param {string} filePath - Path to the CAS PDF file
   * @param {string} password - Password for encrypted PDF (optional)
   * @returns {Promise<Object>} Parsed CAS data
   */
  async parseCASFile(filePath, password = null) {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('CAS file not found');
      }

      // Read PDF file
      const pdfBuffer = fs.readFileSync(filePath);
      
      // Try to determine CAS format
      const format = await this.detectCASFormat(pdfBuffer);
      
      // Get appropriate parser
      const ParserClass = this.parsers[format];
      if (!ParserClass) {
        throw new Error(`Unsupported CAS format: ${format}`);
      }

      // Create parser instance and parse
      const parser = new ParserClass();
      const parsedData = await parser.parse(pdfBuffer, password);

      // Add metadata
      parsedData.metadata = {
        format,
        fileName: path.basename(filePath),
        parsedAt: new Date().toISOString(),
        fileSize: pdfBuffer.length
      };

      return parsedData;

    } catch (error) {
      throw new Error(`CAS parsing failed: ${error.message}`);
    }
  }

  /**
   * Detect CAS format from PDF content
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<string>} Detected format
   */
  async detectCASFormat(pdfBuffer) {
    try {
      // Extract text from PDF
      const data = await pdfParse(pdfBuffer);
      const text = data.text.toLowerCase();

      // Check for format indicators
      if (text.includes('cdsl') || text.includes('central depository services')) {
        return 'CDSL';
      } else if (text.includes('nsdl') || text.includes('national securities depository')) {
        return 'NSDL';
      } else if (text.includes('cams') || text.includes('computer age management services')) {
        return 'CAMS';
      } else if (text.includes('karvy') || text.includes('karvy computershare')) {
        return 'KARVY';
      }

      // Default to CDSL if format cannot be determined
      return 'CDSL';

    } catch (error) {
      // If text extraction fails, default to CDSL
      return 'CDSL';
    }
  }

  /**
   * Validate parsed CAS data
   * @param {Object} data - Parsed CAS data
   * @returns {Object} Validation result
   */
  validateCASData(data) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!data.investorInfo || !data.investorInfo.name) {
      errors.push('Investor name is required');
    }

    if (!data.investorInfo || !data.investorInfo.pan) {
      errors.push('PAN number is required');
    }

    if (!data.dematAccounts || data.dematAccounts.length === 0) {
      errors.push('At least one demat account is required');
    }

    // Check for warnings
    if (!data.holdings || data.holdings.length === 0) {
      warnings.push('No holdings found in CAS');
    }

    if (!data.mutualFunds || data.mutualFunds.length === 0) {
      warnings.push('No mutual fund investments found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate summary statistics from parsed data
   * @param {Object} data - Parsed CAS data
   * @returns {Object} Summary statistics
   */
  generateSummary(data) {
    const summary = {
      totalHoldings: 0,
      totalMutualFunds: 0,
      totalValue: 0,
      accountCount: 0,
      categories: {}
    };

    // Count demat accounts
    if (data.dematAccounts) {
      summary.accountCount = data.dematAccounts.length;
    }

    // Calculate holdings summary
    if (data.holdings) {
      summary.totalHoldings = data.holdings.length;
      data.holdings.forEach(holding => {
        const value = parseFloat(holding.currentValue) || 0;
        summary.totalValue += value;
        
        const category = holding.category || 'Other';
        summary.categories[category] = (summary.categories[category] || 0) + value;
      });
    }

    // Count mutual funds
    if (data.mutualFunds) {
      summary.totalMutualFunds = data.mutualFunds.length;
      data.mutualFunds.forEach(fund => {
        const value = parseFloat(fund.currentValue) || 0;
        summary.totalValue += value;
      });
    }

    return summary;
  }

  /**
   * Encrypt sensitive data
   * @param {Object} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {Object} Encrypted data
   */
  encryptSensitiveData(data, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    const sensitiveFields = ['pan', 'aadhar', 'bankAccount', 'ifsc'];
    const encryptedData = { ...data };

    sensitiveFields.forEach(field => {
      if (data.investorInfo && data.investorInfo[field]) {
        let encrypted = cipher.update(data.investorInfo[field], 'utf8', 'hex');
        encrypted += cipher.final('hex');
        encryptedData.investorInfo[field] = encrypted;
      }
    });

    return encryptedData;
  }

  /**
   * Decrypt sensitive data
   * @param {Object} data - Data to decrypt
   * @param {string} key - Decryption key
   * @returns {Object} Decrypted data
   */
  decryptSensitiveData(data, key) {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipher(algorithm, key);
    
    const sensitiveFields = ['pan', 'aadhar', 'bankAccount', 'ifsc'];
    const decryptedData = { ...data };

    sensitiveFields.forEach(field => {
      if (data.investorInfo && data.investorInfo[field]) {
        try {
          let decrypted = decipher.update(data.investorInfo[field], 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          decryptedData.investorInfo[field] = decrypted;
        } catch (error) {
          // If decryption fails, keep original value
          console.warn(`Failed to decrypt ${field}:`, error.message);
        }
      }
    });

    return decryptedData;
  }
}

module.exports = CASParser;