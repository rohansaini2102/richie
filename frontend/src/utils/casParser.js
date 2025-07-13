// frontend/src/utils/casParser.js
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set PDF.js worker from CDN - this works with Vite 7
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Frontend CAS Parser for CDSL format
 * Parses PDF in browser and extracts portfolio data
 */
export class FrontendCASParser {
  constructor() {
    this.trackingId = this.generateTrackingId();
    this.casType = 'UNKNOWN';
  }

  generateTrackingId() {
    return `FRONTEND_CAS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Main parsing function - extracts data from PDF file
   * @param {File} pdfFile - PDF file object
   * @param {string} password - Password for encrypted PDF
   * @returns {Promise<Object>} Parsed CAS data
   */
  async parsePDFFile(pdfFile, password = '') {
    const parseStartTime = Date.now();
    
    console.log('🚀 FRONTEND CAS PARSING STARTED:', {
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      hasPassword: !!password,
      trackingId: this.trackingId
    });

    try {
      // Convert file to array buffer
      const arrayBuffer = await this.fileToArrayBuffer(pdfFile);
      
      // Extract text from PDF
      const pdfText = await this.extractTextFromPDF(arrayBuffer, password);
      
      if (!pdfText || pdfText.length < 100) {
        throw new Error('Failed to extract meaningful text from PDF');
      }

      // Detect CAS type
      this.casType = this.detectCASType(pdfText);
      console.log(`🔍 Detected CAS Type: ${this.casType}`);

      if (this.casType === 'UNKNOWN') {
        throw new Error('Unknown CAS format. Currently supported: CDSL');
      }

      // Parse based on type
      let parsedData;
      switch (this.casType) {
        case 'CDSL':
          parsedData = await this.parseCDSL(pdfText);
          break;
        default:
          throw new Error(`Parser not implemented for ${this.casType}`);
      }

      // Add metadata
      parsedData.meta = {
        ...parsedData.meta,
        trackingId: this.trackingId,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        parseTime: Date.now() - parseStartTime,
        casType: this.casType,
        parsed_at: new Date().toISOString(),
        parser_version: 'frontend-1.0.0'
      };

      console.log('✅ FRONTEND CAS PARSING COMPLETED:', {
        trackingId: this.trackingId,
        casType: this.casType,
        totalValue: parsedData.summary?.total_value || 0,
        parseTime: Date.now() - parseStartTime
      });

      return parsedData;

    } catch (error) {
      console.error('❌ FRONTEND CAS PARSING FAILED:', {
        trackingId: this.trackingId,
        error: error.message,
        parseTime: Date.now() - parseStartTime
      });
      throw error;
    }
  }

  /**
   * Convert File object to ArrayBuffer
   */
  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from PDF using PDF.js
   */
  async extractTextFromPDF(arrayBuffer, password) {
    try {
      const loadingTask = getDocument({
        data: arrayBuffer,
        password: password || undefined,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      let fullText = '';

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      if (error.name === 'PasswordException') {
        throw new Error('Incorrect PDF password. Please check and try again.');
      }
      throw new Error(`Failed to read PDF: ${error.message}`);
    }
  }

  /**
   * Detect CAS type from text content
   */
  detectCASType(text) {
    const cleanText = text.toLowerCase();
    
    // CDSL Detection
    const cdslPatterns = ['cdsl', 'central depository services', 'dp name', 'dp id', 'bo id'];
    const cdslMatches = cdslPatterns.filter(pattern => cleanText.includes(pattern));
    
    if (cdslMatches.length >= 2) {
      return 'CDSL';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Parse CDSL CAS format
   */
  async parseCDSL(text) {
    const cleanedText = this.cleanText(text);
    
    // Extract components
    const investorInfo = this.extractInvestorInfo(cleanedText);
    const dematAccounts = this.extractDematAccounts(cleanedText);
    const mutualFunds = this.extractMutualFunds(cleanedText);

    // Create response structure
    const data = {
      investor: investorInfo,
      demat_accounts: dematAccounts,
      mutual_funds: mutualFunds,
      insurance: { life_insurance_policies: [] },
      meta: {
        cas_type: 'CDSL',
        generated_at: new Date().toISOString().split('.')[0],
        statement_period: this.extractStatementPeriod(cleanedText)
      }
    };

    // Calculate summary
    data.summary = this.calculateSummary(data);

    return data;
  }

  /**
   * Extract investor information
   */
  extractInvestorInfo(text) {
    const investor = {
      name: '',
      pan: '',
      address: '',
      email: '',
      mobile: '',
      cas_id: '',
      pincode: ''
    };

    try {
      // Extract name
      const namePatterns = [
        /([A-Z][a-z]+(?:\s+[a-z]+)*)\s+(?:S\s+O|D\s+O|W\s+O)\s+/i,
        /([A-Z][a-z]+(?:\s+[a-z]+)*)\s+PAN\s*:/i,
        /Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN|S\s+O)/i
      ];

      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1]) {
          investor.name = this.cleanText(nameMatch[1]);
          break;
        }
      }

      // Extract PAN
      const panMatch = text.match(/PAN\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i);
      if (panMatch && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panMatch[1])) {
        investor.pan = panMatch[1];
      }

      // Extract email
      const emailMatch = text.match(/Email\s+Id\s*:?\s*([^\s]+@[^\s]+)/i);
      if (emailMatch) {
        const email = emailMatch[1].toLowerCase().replace(/\s/g, '');
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          investor.email = email;
        }
      }

      // Extract mobile
      const mobileMatch = text.match(/Mobile\s+No\s*:?\s*([0-9]{10,})/i);
      if (mobileMatch && !mobileMatch[1].includes('X') && mobileMatch[1].length >= 10) {
        investor.mobile = mobileMatch[1];
      }

    } catch (error) {
      console.error('Error extracting investor info:', error);
    }

    return investor;
  }

  /**
   * Extract demat accounts
   */
  extractDematAccounts(text) {
    const accounts = [];

    try {
      // Split by DP Name sections
      const dpSections = this.splitIntoAccountSections(text);
      
      for (let i = 0; i < dpSections.length; i++) {
        const section = dpSections[i];
        
        const account = {
          dp_id: '',
          dp_name: '',
          bo_id: '',
          client_id: '',
          demat_type: 'cdsl',
          holdings: {
            equities: [],
            demat_mutual_funds: [],
            corporate_bonds: [],
            government_securities: [],
            aifs: []
          },
          additional_info: {
            status: 'Active',
            bo_type: null,
            bo_sub_status: '',
            bsda: 'NO',
            nominee: '',
            email: ''
          },
          value: 0
        };

        this.extractAccountDetailsFromSection(section, account);
        account.bo_id = this.findBoIdForAccount(text, account, i);
        account.holdings = this.extractHoldingsForAccount(text, account);
        account.value = this.calculateAccountValue(account.holdings);

        if (account.dp_id || account.dp_name) {
          accounts.push(account);
        }
      }
    } catch (error) {
      console.error('Error extracting demat accounts:', error);
    }

    return accounts;
  }

  /**
   * Split text into account sections
   */
  splitIntoAccountSections(text) {
    const sections = [];
    
    try {
      const dpPattern = /DP\s+Name\s*:\s*([A-Z][^]*?)(?=DP\s+Name\s*:|MF\s+Folios|Mutual Fund|$)/gi;
      let match;
      
      while ((match = dpPattern.exec(text)) !== null) {
        const sectionText = match[0];
        
        const hasRequiredFields = sectionText.includes('DP ID') && sectionText.includes('CLIENT ID');
        const isValidSection = !sectionText.includes('STATEMENT OF TRANSACTIONS') &&
                              sectionText.trim().length > 100;
        
        if (hasRequiredFields && isValidSection) {
          sections.push(sectionText);
        }
      }
    } catch (error) {
      console.error('Error splitting into account sections:', error);
    }
    
    return sections;
  }

  /**
   * Extract account details from section
   */
  extractAccountDetailsFromSection(sectionText, account) {
    try {
      const dpNameMatch = sectionText.match(/DP\s+Name\s*:\s*([^\n]+)/i);
      if (dpNameMatch) {
        account.dp_name = this.cleanText(dpNameMatch[1]);
      }

      const dpIdMatch = sectionText.match(/DP\s+ID\s*:?\s*(\d+)/i);
      if (dpIdMatch) {
        account.dp_id = dpIdMatch[1];
      }

      const clientIdMatch = sectionText.match(/CLIENT\s+ID\s*:?\s*(\d+)/i);
      if (clientIdMatch) {
        account.client_id = clientIdMatch[1];
      }
    } catch (error) {
      console.error('Error extracting account details:', error);
    }
  }

  /**
   * Find BO ID for account
   */
  findBoIdForAccount(fullText, account, accountIndex) {
    try {
      const allBoIds = [];
      const boIdPattern = /BO\s+ID\s*:?\s*(\d+)/gi;
      let match;
      
      while ((match = boIdPattern.exec(fullText)) !== null) {
        const boId = match[1];
        if (!allBoIds.includes(boId)) {
          allBoIds.push(boId);
        }
      }
      
      if (accountIndex < allBoIds.length) {
        return allBoIds[accountIndex];
      }
      
      if (account.dp_id && account.client_id) {
        return account.dp_id + account.client_id;
      }
    } catch (error) {
      console.error('Error finding BO ID:', error);
    }
    
    return '';
  }

  /**
   * Extract holdings for account
   */
  extractHoldingsForAccount(fullText, account) {
    const holdings = {
      equities: [],
      demat_mutual_funds: [],
      corporate_bonds: [],
      government_securities: [],
      aifs: []
    };

    try {
      const boId = account.bo_id;
      if (!boId) return holdings;
      
      const startIndex = fullText.indexOf(`BO ID: ${boId}`) || fullText.indexOf(`BO ID : ${boId}`);
      if (startIndex !== -1) {
        const nextBoIdIndex = fullText.indexOf('BO ID', startIndex + 10);
        const transactionSection = nextBoIdIndex !== -1 ? 
          fullText.substring(startIndex, nextBoIdIndex) :
          fullText.substring(startIndex);
        
        if (transactionSection.includes('HOLDING STATEMENT') && 
            transactionSection.includes('Portfolio Value')) {
          const parsedHoldings = this.parseHoldingsFromSection(transactionSection);
          Object.assign(holdings, parsedHoldings);
        }
      }
    } catch (error) {
      console.error('Error extracting holdings:', error);
    }

    return holdings;
  }

  /**
   * Parse holdings from section
   */
  parseHoldingsFromSection(sectionText) {
    const holdings = {
      equities: [],
      demat_mutual_funds: [],
      corporate_bonds: [],
      government_securities: [],
      aifs: []
    };

    try {
      const isinPattern = /([A-Z]{2}[A-Z0-9]{9}\d)\s+([^]+?)\s+([\d,]+\.?\d*)\s+--\s+--\s+--\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g;
      let match;
      
      while ((match = isinPattern.exec(sectionText)) !== null) {
        const isin = match[1];
        const name = this.cleanText(match[2]);
        const currentBal = this.parseNumber(match[3]);
        const freeBal = this.parseNumber(match[4]);
        const marketPrice = this.parseNumber(match[5]);
        const value = this.parseNumber(match[6]);
        
        const holding = {
          isin: isin,
          name: name,
          units: currentBal,
          value: value,
          additional_info: {
            market_price: marketPrice,
            free_balance: freeBal
          }
        };
        
        if (isin.startsWith('INE') || name.toLowerCase().includes('equity')) {
          holdings.equities.push(holding);
        } else if (isin.startsWith('INF') || name.toLowerCase().includes('etf')) {
          holdings.demat_mutual_funds.push(holding);
        } else {
          holdings.equities.push(holding);
        }
      }
    } catch (error) {
      console.error('Error parsing holdings:', error);
    }

    return holdings;
  }

  /**
   * Extract mutual funds
   */
  extractMutualFunds(text) {
    const mutualFunds = [];

    try {
      const mfStartPattern = /MUTUAL\s+FUND\s+UNITS\s+HELD/i;
      const mfStartIndex = text.search(mfStartPattern);
      
      if (mfStartIndex !== -1) {
        const mfSection = text.substring(mfStartIndex);
        
        const amcMatch = mfSection.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Mutual\s+Fund/i);
        if (amcMatch) {
          const mutualFund = {
            amc: amcMatch[1],
            folio_number: '',
            registrar: '',
            schemes: [],
            value: 0
          };
          
          const folioMatch = mfSection.match(/Folio\s+No[\s:]*([\d\/]+)/i);
          if (folioMatch) {
            mutualFund.folio_number = folioMatch[1];
          }
          
          const schemes = this.parseMutualFundSchemes(mfSection);
          mutualFund.schemes = schemes;
          mutualFund.value = schemes.reduce((total, scheme) => total + (scheme.value || 0), 0);
          
          if (mutualFund.schemes.length > 0) {
            mutualFunds.push(mutualFund);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting mutual funds:', error);
    }

    return mutualFunds;
  }

  /**
   * Parse mutual fund schemes
   */
  parseMutualFundSchemes(text) {
    const schemes = [];
    
    try {
      const schemePattern = /([A-Z]{2}[A-Z0-9]{9}\d)\s+([^]+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g;
      let match;
      
      while ((match = schemePattern.exec(text)) !== null) {
        const scheme = {
          isin: match[1],
          name: this.cleanText(match[2]),
          units: this.parseNumber(match[3]),
          nav: match[4],
          value: this.parseNumber(match[5]),
          scheme_type: 'equity',
          additional_info: {
            arn_code: null,
            investment_value: 0
          }
        };
        
        scheme.scheme_type = this.determineSchemeType(scheme.name);
        schemes.push(scheme);
      }
    } catch (error) {
      console.error('Error parsing mutual fund schemes:', error);
    }

    return schemes;
  }

  /**
   * Determine scheme type from name
   */
  determineSchemeType(schemeName) {
    if (!schemeName) return 'equity';
    
    const name = schemeName.toLowerCase();
    if (name.includes('debt') || name.includes('bond') || name.includes('liquid')) {
      return 'debt';
    } else if (name.includes('hybrid') || name.includes('balanced')) {
      return 'hybrid';
    }
    return 'equity';
  }

  /**
   * Extract statement period
   */
  extractStatementPeriod(text) {
    const period = { from: '', to: '' };

    try {
      const periodMatch = text.match(/(?:Period|Statement\s+Period)\s*:?\s*(\d{2}-[A-Z]{3}-\d{4})\s*to\s*(\d{2}-[A-Z]{3}-\d{4})/i);
      
      if (periodMatch) {
        period.from = this.parseDate(periodMatch[1]);
        period.to = this.parseDate(periodMatch[2]);
      }
    } catch (error) {
      console.error('Error extracting statement period:', error);
    }

    return period;
  }

  /**
   * Calculate account value
   */
  calculateAccountValue(holdings) {
    let total = 0;
    Object.values(holdings).forEach(holdingType => {
      if (Array.isArray(holdingType)) {
        holdingType.forEach(holding => {
          total += holding.value || 0;
        });
      }
    });
    return total;
  }

  /**
   * Calculate summary totals
   */
  calculateSummary(data) {
    const summary = {
      accounts: {
        demat: {
          count: data.demat_accounts.length,
          total_value: 0
        },
        mutual_funds: {
          count: data.mutual_funds.length,
          total_value: 0
        },
        insurance: {
          count: data.insurance.life_insurance_policies.length,
          total_value: 0
        }
      },
      total_value: 0
    };

    // Calculate demat total
    data.demat_accounts.forEach(account => {
      summary.accounts.demat.total_value += account.value || 0;
    });

    // Calculate mutual funds total
    data.mutual_funds.forEach(fund => {
      summary.accounts.mutual_funds.total_value += fund.value || 0;
    });

    // Calculate grand total
    summary.total_value = 
      summary.accounts.demat.total_value + 
      summary.accounts.mutual_funds.total_value + 
      summary.accounts.insurance.total_value;

    return summary;
  }

  // Utility methods
  cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  parseNumber(str) {
    if (!str) return 0;
    const cleanStr = str.toString().replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  parseDate(dateStr) {
    if (!dateStr) return '';
    
    try {
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
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    return dateStr;
  }
}