const BaseParser = require('./base-parser');
const { logger } = require('../../../utils/logger');

/**
 * CDSL CAS Parser
 * Handles parsing of CDSL (Central Depository Services Limited) CAS documents
 */
class CDSLParser extends BaseParser {
  constructor() {
    super();
    this.name = 'CDSLParser';
  }

  /**
   * Parse CDSL CAS document
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
      throw new Error(`CDSL parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract investor information from CDSL CAS
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

    // Extract email
    const emailPattern = /Email\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    investorInfo.email = this.extractValue(text, emailPattern);

    // Extract phone
    const phonePatterns = [
      /Phone\s*:\s*(\d{10,})/i,
      /Mobile\s*:\s*(\d{10,})/i,
      /Contact\s*:\s*(\d{10,})/i
    ];

    for (const pattern of phonePatterns) {
      const phone = this.extractValue(text, pattern);
      if (phone) {
        investorInfo.phone = phone;
        break;
      }
    }

    // Extract address
    const addressPattern = /Address\s*:\s*([^\n\r]+(?:\n[^\n\r]+)*)/i;
    const address = this.extractValue(text, addressPattern);
    if (address) {
      investorInfo.address = address.trim();
    }

    return investorInfo;
  }

  /**
   * Extract demat accounts from CDSL CAS
   * @param {string} text - PDF text content
   * @returns {Array} Demat accounts
   */
  extractDematAccounts(text) {
    const accounts = [];

    // CDSL demat account pattern (16 digits)
    const accountPattern = /(\d{16})/g;
    const accountMatches = text.matchAll(accountPattern);

    for (const match of accountMatches) {
      const accountNumber = match[1];
      
      // Validate it's actually a demat account (not just any 16-digit number)
      if (this.isDematAccountContext(text, accountNumber)) {
        accounts.push({
          id: this.generateId('acc_'),
          accountNumber,
          depository: 'CDSL',
          status: 'Active'
        });
      }
    }

    return accounts;
  }

  /**
   * Check if a number appears in demat account context
   * @param {string} text - Full text
   * @param {string} accountNumber - Account number to check
   * @returns {boolean} Is in demat context
   */
  isDematAccountContext(text, accountNumber) {
    const context = text.substring(
      Math.max(0, text.indexOf(accountNumber) - 100),
      text.indexOf(accountNumber) + 100
    ).toLowerCase();

    const dematKeywords = [
      'demat', 'account', 'cdsl', 'depository', 'dp id', 'client id'
    ];

    return dematKeywords.some(keyword => context.includes(keyword));
  }

  /**
   * Extract holdings from CDSL CAS
   * @param {string} text - PDF text content
   * @returns {Array} Holdings
   */
  extractHoldings(text) {
    const holdings = [];

    // Look for holdings section
    const holdingsSection = this.extractHoldingsSection(text);
    if (!holdingsSection) return holdings;

    // Parse holdings table
    const lines = holdingsSection.split('\n');
    let currentHolding = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if line contains stock information
      if (this.isStockLine(trimmedLine)) {
        // Save previous holding if exists
        if (currentHolding) {
          holdings.push(currentHolding);
        }

        // Start new holding
        currentHolding = this.parseStockLine(trimmedLine);
      } else if (currentHolding) {
        // Add additional information to current holding
        this.updateHoldingFromLine(currentHolding, trimmedLine);
      }
    }

    // Add last holding
    if (currentHolding) {
      holdings.push(currentHolding);
    }

    return holdings;
  }

  /**
   * Extract holdings section from text
   * @param {string} text - Full text
   * @returns {string} Holdings section
   */
  extractHoldingsSection(text) {
    const sectionPatterns = [
      /(?:Equity\s+Shares|Holdings|Securities).*?(?=Mutual|Insurance|$)/is,
      /(?:Stock|Share).*?(?=Mutual|Insurance|$)/is
    ];

    for (const pattern of sectionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Check if line contains stock information
   * @param {string} line - Line to check
   * @returns {boolean} Is stock line
   */
  isStockLine(line) {
    // Look for patterns that indicate stock information
    const stockPatterns = [
      /\b[A-Z]{3,}\s+\d+\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\b/, // Company name + numbers
      /\b[A-Z]{3,}\s+\d{2,}\/\d{2,}\/\d{4}\s+\d+\.?\d*\s+\d+\.?\d*\b/ // Company name + date + numbers
    ];

    return stockPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Parse stock line into holding object
   * @param {string} line - Stock line
   * @returns {Object} Holding object
   */
  parseStockLine(line) {
    const holding = {
      id: this.generateId('hold_'),
      category: 'Equity',
      type: 'Stock'
    };

    // Extract company name (usually first part)
    const nameMatch = line.match(/^([A-Z][A-Z\s&]+?)\s+\d/);
    if (nameMatch) {
      holding.companyName = nameMatch[1].trim();
    }

    // Extract quantities and values
    const numbers = line.match(/\d+\.?\d*/g);
    if (numbers && numbers.length >= 3) {
      holding.quantity = parseInt(numbers[0]) || 0;
      holding.averagePrice = this.parseCurrency(numbers[1]);
      holding.currentValue = this.parseCurrency(numbers[2]);
    }

    return holding;
  }

  /**
   * Update holding with additional information from line
   * @param {Object} holding - Holding object to update
   * @param {string} line - Line with additional info
   */
  updateHoldingFromLine(holding, line) {
    // Extract ISIN if present
    const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/;
    const isinMatch = line.match(isinPattern);
    if (isinMatch && !holding.isin) {
      holding.isin = isinMatch[0];
    }

    // Extract additional values
    const numbers = line.match(/\d+\.?\d*/g);
    if (numbers) {
      if (!holding.quantity && numbers[0]) {
        holding.quantity = parseInt(numbers[0]);
      }
      if (!holding.currentValue && numbers[numbers.length - 1]) {
        holding.currentValue = this.parseCurrency(numbers[numbers.length - 1]);
      }
    }
  }

  /**
   * Extract mutual funds from CDSL CAS
   * @param {string} text - PDF text content
   * @returns {Array} Mutual funds
   */
  extractMutualFunds(text) {
    const mutualFunds = [];

    // Look for mutual fund section
    const mfSection = this.extractMutualFundSection(text);
    if (!mfSection) return mutualFunds;

    // Parse mutual fund entries
    const lines = mfSection.split('\n');
    let currentFund = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if line contains mutual fund information
      if (this.isMutualFundLine(trimmedLine)) {
        // Save previous fund if exists
        if (currentFund) {
          mutualFunds.push(currentFund);
        }

        // Start new fund
        currentFund = this.parseMutualFundLine(trimmedLine);
      } else if (currentFund) {
        // Add additional information to current fund
        this.updateFundFromLine(currentFund, trimmedLine);
      }
    }

    // Add last fund
    if (currentFund) {
      mutualFunds.push(currentFund);
    }

    return mutualFunds;
  }

  /**
   * Extract mutual fund section from text
   * @param {string} text - Full text
   * @returns {string} Mutual fund section
   */
  extractMutualFundSection(text) {
    const sectionPatterns = [
      /(?:Mutual\s+Funds?|MF).*?(?=Insurance|$)/is,
      /(?:Fund|Scheme).*?(?=Insurance|$)/is
    ];

    for (const pattern of sectionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Check if line contains mutual fund information
   * @param {string} line - Line to check
   * @returns {boolean} Is mutual fund line
   */
  isMutualFundLine(line) {
    const mfPatterns = [
      /\b[A-Z][A-Z\s&]+Fund\b/i,
      /\b[A-Z][A-Z\s&]+Scheme\b/i,
      /\b[A-Z]{3,}\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\b/ // Fund name + numbers
    ];

    return mfPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Parse mutual fund line into fund object
   * @param {string} line - Mutual fund line
   * @returns {Object} Fund object
   */
  parseMutualFundLine(line) {
    const fund = {
      id: this.generateId('mf_'),
      category: 'Mutual Fund',
      type: 'MF'
    };

    // Extract fund name
    const nameMatch = line.match(/^([A-Z][A-Z\s&]+?)(?:Fund|Scheme|\s+\d)/i);
    if (nameMatch) {
      fund.fundName = nameMatch[1].trim();
    }

    // Extract quantities and values
    const numbers = line.match(/\d+\.?\d*/g);
    if (numbers && numbers.length >= 3) {
      fund.units = this.parseCurrency(numbers[0]);
      fund.nav = this.parseCurrency(numbers[1]);
      fund.currentValue = this.parseCurrency(numbers[2]);
    }

    return fund;
  }

  /**
   * Update fund with additional information from line
   * @param {Object} fund - Fund object to update
   * @param {string} line - Line with additional info
   */
  updateFundFromLine(fund, line) {
    // Extract folio number if present
    const folioPattern = /Folio\s*:\s*(\d+)/i;
    const folioMatch = line.match(folioPattern);
    if (folioMatch && !fund.folioNumber) {
      fund.folioNumber = folioMatch[1];
    }

    // Extract additional values
    const numbers = line.match(/\d+\.?\d*/g);
    if (numbers) {
      if (!fund.units && numbers[0]) {
        fund.units = this.parseCurrency(numbers[0]);
      }
      if (!fund.currentValue && numbers[numbers.length - 1]) {
        fund.currentValue = this.parseCurrency(numbers[numbers.length - 1]);
      }
    }
  }
}

module.exports = CDSLParser; 