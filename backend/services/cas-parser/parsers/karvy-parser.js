const BaseParser = require('./base-parser');

/**
 * Karvy CAS Parser
 * Handles parsing of Karvy Computershare CAS documents
 */
class KarvyParser extends BaseParser {
  constructor() {
    super();
    this.name = 'KarvyParser';
  }

  /**
   * Parse Karvy CAS document
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
      throw new Error(`Karvy parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract investor information from Karvy CAS
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
   * Extract demat accounts from Karvy CAS
   * @param {string} text - PDF text content
   * @returns {Array} Demat accounts
   */
  extractDematAccounts(text) {
    const accounts = [];

    // Karvy handles both CDSL and NSDL accounts
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
   * Extract holdings from Karvy CAS
   * @param {string} text - PDF text content
   * @returns {Array} Holdings
   */
  extractHoldings(text) {
    // Placeholder implementation for Karvy holdings
    return [];
  }

  /**
   * Extract mutual funds from Karvy CAS
   * @param {string} text - PDF text content
   * @returns {Array} Mutual funds
   */
  extractMutualFunds(text) {
    // Placeholder implementation for Karvy mutual funds
    return [];
  }
}

module.exports = KarvyParser; 