const BaseParser = require('./base-parser');

/**
 * CAMS CAS Parser
 * Handles parsing of CAMS (Computer Age Management Services) CAS documents
 */
class CAMSParser extends BaseParser {
  constructor() {
    super();
    this.name = 'CAMSParser';
  }

  /**
   * Parse CAMS CAS document
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} password - Password for encrypted PDF
   * @returns {Promise<Object>} Parsed data
   */
  async parse(pdfBuffer, password = null) {
    try {
      // Extract text from PDF
      const text = await this.extractText(pdfBuffer, password);
      const cleanedText = this.cleanText(text);

      // Extract all data
      const investorInfo = this.extractInvestorInfo(cleanedText);
      const dematAccounts = this.extractDematAccounts(cleanedText);
      const holdings = this.extractHoldings(cleanedText);
      const mutualFunds = this.extractMutualFunds(cleanedText);

      // Create response
      const data = {
        investorInfo,
        dematAccounts,
        holdings,
        mutualFunds
      };

      return this.createResponse(data);

    } catch (error) {
      throw new Error(`CAMS parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract investor information from CAMS CAS
   * @param {string} text - PDF text content
   * @returns {Object} Investor information
   */
  extractInvestorInfo(text) {
    const investorInfo = {};

    // Extract name
    const namePatterns = [
      /Name\s*:\s*([^\n\r]+)/i,
      /Investor\s+Name\s*:\s*([^\n\r]+)/i,
      /Client\s+Name\s*:\s*([^\n\r]+)/i
    ];

    for (const pattern of namePatterns) {
      const name = this.extractValue(text, pattern);
      if (name) {
        investorInfo.name = name.trim();
        break;
      }
    }

    // Extract PAN
    const panPatterns = [
      /PAN\s*:\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
      /Permanent\s+Account\s+Number\s*:\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i
    ];

    for (const pattern of panPatterns) {
      const pan = this.extractValue(text, pattern);
      if (pan) {
        investorInfo.pan = pan.toUpperCase();
        break;
      }
    }

    return investorInfo;
  }

  /**
   * Extract demat accounts from CAMS CAS
   * @param {string} text - PDF text content
   * @returns {Array} Demat accounts
   */
  extractDematAccounts(text) {
    const accounts = [];

    // CAMS typically handles mutual funds, so demat accounts might be limited
    // Look for any account numbers
    const accountPatterns = [
      /(\d{16})/g,  // CDSL format
      /(IN\d{14})/g // NSDL format
    ];

    for (const pattern of accountPatterns) {
      const accountMatches = text.matchAll(pattern);
      for (const match of accountMatches) {
        const accountNumber = match[1];
        accounts.push({
          id: this.generateId('acc_'),
          accountNumber,
          depository: accountNumber.startsWith('IN') ? 'NSDL' : 'CDSL',
          status: 'Active'
        });
      }
    }

    return accounts;
  }

  /**
   * Extract holdings from CAMS CAS
   * @param {string} text - PDF text content
   * @returns {Array} Holdings
   */
  extractHoldings(text) {
    // CAMS primarily handles mutual funds, so holdings might be limited
    return [];
  }

  /**
   * Extract mutual funds from CAMS CAS
   * @param {string} text - PDF text content
   * @returns {Array} Mutual funds
   */
  extractMutualFunds(text) {
    const mutualFunds = [];

    // Look for mutual fund patterns in CAMS format
    const fundPatterns = [
      /([A-Z][A-Z\s&]+Fund)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/gi,
      /([A-Z][A-Z\s&]+Scheme)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/gi
    ];

    for (const pattern of fundPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const [, fundName, units, nav, value] = match;
        mutualFunds.push({
          id: this.generateId('mf_'),
          fundName: fundName.trim(),
          units: this.parseCurrency(units),
          nav: this.parseCurrency(nav),
          currentValue: this.parseCurrency(value),
          category: 'Mutual Fund',
          type: 'MF'
        });
      }
    }

    return mutualFunds;
  }
}

module.exports = CAMSParser; 