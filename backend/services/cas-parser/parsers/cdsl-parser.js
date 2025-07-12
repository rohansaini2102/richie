const BaseParser = require('./base-parser');
const { logger } = require('../../../utils/logger');
const { casEventLogger } = require('../../../utils/casEventLogger');

/**
 * Enhanced CDSL CAS Parser with comprehensive parsing logic
 * Handles parsing of CDSL (Central Depository Services Limited) CAS documents
 */
class CDSLParser extends BaseParser {
  constructor() {
    super();
    this.name = 'CDSLParser';
    this.casType = 'CDSL';
  }

  /**
   * Parse CDSL CAS document - Main parsing method
   * @param {string} pdfText - Extracted PDF text
   * @param {string} password - Password for encrypted PDF
   * @returns {Promise<Object>} Parsed data
   */
  async parse(pdfText, password = null) {
    try {
      // Store text for parsing
      this.pdfText = pdfText;
      
      this.logStructured('info', 'CDSL_PARSE_STARTED', {
        textLength: pdfText.length,
        hasPassword: !!password,
        passwordLength: password ? password.length : 0
      });
      
      const cleanedText = this.cleanText(pdfText);
      
      // Validate that we have meaningful content
      if (cleanedText.length < 100) {
        throw new Error('Extracted text is too short. This might not be a valid CAS document.');
      }
      
      console.log(`🔧 CDSL Parser: Starting data extraction...`);

      // Extract all data components
      const investorInfo = this.extractInvestorInfo(cleanedText);
      const dematAccounts = await this.extractDematAccounts(cleanedText);
      const mutualFunds = await this.extractMutualFunds(cleanedText);

      console.log(`📊 CDSL Parser: Extraction completed`);
      console.log(`   👤 Investor: ${investorInfo.name ? 'Found' : 'Not found'}`);
      console.log(`   🏦 Demat Accounts: ${dematAccounts.length}`);
      console.log(`   📈 Mutual Funds: ${mutualFunds.length}`);

      // Validate that we extracted some meaningful data
      if (!investorInfo.name && !investorInfo.pan && dematAccounts.length === 0) {
        this.logStructured('warn', 'CDSL_MINIMAL_DATA_EXTRACTED', {
          hasInvestorName: !!investorInfo.name,
          hasPAN: !!investorInfo.pan,
          dematAccountsCount: dematAccounts.length,
          mutualFundsCount: mutualFunds.length
        });
        
        console.log(`⚠️  Warning: Minimal data extracted. This might not be a complete CAS.`);
      }

      // Create response structure
      const data = {
        investor: investorInfo,
        demat_accounts: dematAccounts,
        mutual_funds: mutualFunds,
        insurance: { life_insurance_policies: [] }, // Placeholder
        meta: {
          cas_type: this.casType,
          generated_at: new Date().toISOString().split('.')[0],
          statement_period: this.extractStatementPeriod(cleanedText)
        }
      };

      // Calculate summary
      data.summary = this.calculateSummary(data);

      this.logStructured('info', 'CDSL_PARSE_COMPLETED', {
        hasInvestorInfo: !!data.investor.name,
        dematAccountsCount: data.demat_accounts.length,
        mutualFundsCount: data.mutual_funds.length,
        totalValue: data.summary.total_value
      });

      return data;

    } catch (error) {
      this.logStructured('error', 'CDSL_PARSE_FAILED', {
        error: error.message,
        hasPassword: !!password,
        passwordLength: password ? password.length : 0
      });
      throw new Error(`CDSL parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract investor information from CDSL CAS
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
      console.log(`👤 Extracting investor information...`);

      // Extract name - Enhanced patterns
    const namePatterns = [
        /([A-Z][a-z]+(?:\s+[a-z]+)*)\s+(?:S\s+O|D\s+O|W\s+O)\s+/i,
        /([A-Z][a-z]+(?:\s+[a-z]+)*)\s+PAN\s*:/i,
        /Your\s+Demat\s+Account[^]*?single\s+name\s+of\s+([A-Z\s]+)\s+\(/i,
        /Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN|S\s+O)/i,
        /Investor\s+Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN)/i
    ];

    for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1]) {
          investor.name = this.cleanText(nameMatch[1]);
          console.log(`   ✅ Name extracted: ${investor.name}`);
        break;
      }
    }

      // Extract PAN - Enhanced patterns
    const panPatterns = [
        /PAN\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
        /Permanent\s+Account\s+Number\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
        /([A-Z]{5}[0-9]{4}[A-Z])/g
    ];

    for (const pattern of panPatterns) {
        const panMatch = text.match(pattern);
        if (panMatch && panMatch[1]) {
          // Validate PAN format
          if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panMatch[1])) {
            investor.pan = panMatch[1];
            console.log(`   ✅ PAN extracted: ${investor.pan}`);
        break;
          }
        }
      }

      // Extract address - Enhanced patterns
      const addressPatterns = [
        /S\s+O\s+[A-Z\s]+\s+([A-Z][^]*?)(?:PINCODE|Statement|YOUR|PAN)/i,
        /Address\s*:?\s*([^]*?)(?:Email|Mobile|Phone|PAN)/i
      ];

      for (const pattern of addressPatterns) {
        const addressMatch = text.match(pattern);
        if (addressMatch && addressMatch[1]) {
          let address = this.cleanText(addressMatch[1]);
          // Clean up address formatting
          address = address.replace(/\s+/g, ' ').trim();
          
          // Extract pincode from address
          const pincodeMatch = address.match(/(\d{6})/);
          if (pincodeMatch) {
            investor.pincode = pincodeMatch[1];
          }
          investor.address = address;
          console.log(`   ✅ Address extracted`);
        break;
      }
    }

      // Extract email - Enhanced patterns
      const emailPatterns = [
        /Email\s+Id\s*:?\s*([^\s]+@[^\s]+)/i,
        /Email\s*:?\s*([^\s]+@[^\s]+)/i,
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
      ];

      for (const pattern of emailPatterns) {
        const emailMatch = text.match(pattern);
        if (emailMatch && emailMatch[1]) {
          const email = emailMatch[1].toLowerCase().replace(/\s/g, '');
          // Validate email format
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            investor.email = email;
            console.log(`   ✅ Email extracted: ${investor.email}`);
            break;
          }
        }
      }

      // Extract mobile - Enhanced patterns
      const mobilePatterns = [
        /Mobile\s+No\s*:?\s*([0-9]{10,})/i,
        /Mobile\s*:?\s*([0-9]{10,})/i,
        /Phone\s*:?\s*([0-9]{10,})/i
      ];

      for (const pattern of mobilePatterns) {
        const mobileMatch = text.match(pattern);
        if (mobileMatch && mobileMatch[1]) {
          // Skip masked numbers (containing X)
          if (!mobileMatch[1].includes('X') && mobileMatch[1].length >= 10) {
            investor.mobile = mobileMatch[1];
            console.log(`   ✅ Mobile extracted: ${investor.mobile}`);
            break;
          }
        }
      }

      // Extract CAS ID
      const casIdMatch = text.match(/CAS\s+ID\s*:?\s*([A-Z0-9]+)/i);
      if (casIdMatch) {
        investor.cas_id = casIdMatch[1];
        console.log(`   ✅ CAS ID extracted: ${investor.cas_id}`);
      }

    } catch (error) {
      console.error('❌ Error extracting investor info:', error);
    }

    const extractedFields = Object.values(investor).filter(v => v).length;
    console.log(`👤 Investor extraction completed: ${extractedFields}/7 fields extracted`);

    return investor;
  }

  /**
   * Extract demat account information using enhanced section-based parsing
   */
  async extractDematAccounts(text) {
    const accounts = [];

    try {
      console.log(`🏦 Extracting demat accounts...`);

      // Split text by DP Name sections to get distinct accounts
      const dpSections = this.splitIntoAccountSections(text);
      
      console.log(`   Found ${dpSections.length} account sections`);

      for (let i = 0; i < dpSections.length; i++) {
        const section = dpSections[i];
        const nextSection = dpSections[i + 1];
        
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

        // Extract account details from section header
        this.extractAccountDetailsFromSection(section, account);
        
        // Find BO ID that belongs to this account
        account.bo_id = this.findBoIdForAccount(text, account, i);
        
        // Extract holdings for this specific account section
        account.holdings = await this.extractHoldingsForAccount(text, account);
        
        // Calculate total value
        account.value = this.calculateAccountValue(account.holdings);

        if (account.dp_id || account.dp_name) {
          accounts.push(account);
          console.log(`   ✅ Account ${i + 1}: ${account.dp_name} (Value: ₹${account.value.toLocaleString('en-IN')})`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting demat accounts:', error);
    }

    console.log(`🏦 Demat accounts extraction completed: ${accounts.length} accounts found`);
    return accounts;
  }

  /**
   * Split PDF text into account sections based on DP Name markers
   */
  splitIntoAccountSections(text) {
    const sections = [];
    
    try {
      if (!text || text.trim().length === 0) {
        console.warn('⚠️  No PDF text available for parsing');
        return sections;
      }
      
      // Enhanced pattern matching for account sections
      const dpPattern = /DP\s+Name\s*:\s*([A-Z][^]*?)(?=DP\s+Name\s*:|MF\s+Folios|Mutual Fund|$)/gi;
      let match;
      
      while ((match = dpPattern.exec(text)) !== null) {
        const sectionText = match[0];
        
        // Strict validation for account definition sections
        const hasRequiredFields = sectionText.includes('DP ID') && 
                                 sectionText.includes('CLIENT ID');
        
        // Exclude Hindi transaction sections and ensure meaningful content
        const isValidSection = !sectionText.includes('STATEMENT OF TRANSACTIONS') &&
                              !sectionText.includes('No Transaction during the period') &&
                              sectionText.trim().length > 100;
        
        if (hasRequiredFields && isValidSection) {
          sections.push(sectionText);
        }
      }
      
    } catch (error) {
      console.error('❌ Error splitting into account sections:', error);
    }
    
    return sections;
  }

  /**
   * Extract account details from a section
   */
  extractAccountDetailsFromSection(sectionText, account) {
    try {
      if (!sectionText || !account) {
        return;
      }
      
      // Extract DP Name
      const dpNameMatch = sectionText.match(/DP\s+Name\s*:\s*([^\n]+)/i);
      if (dpNameMatch) {
        account.dp_name = this.cleanText(dpNameMatch[1]);
      }

      // Extract DP ID
      const dpIdMatch = sectionText.match(/DP\s+ID\s*:?\s*(\d+)/i);
      if (dpIdMatch) {
        account.dp_id = dpIdMatch[1];
      }

      // Extract Client ID
      const clientIdMatch = sectionText.match(/CLIENT\s+ID\s*:?\s*(\d+)/i);
      if (clientIdMatch) {
        account.client_id = clientIdMatch[1];
      }

      // Extract additional info
      const emailMatch = sectionText.match(/Email\s+Id\s*:?\s*([^\s]+@[^\s]+)/i);
      if (emailMatch) {
        account.additional_info.email = emailMatch[1].toLowerCase();
      }

      const subStatusMatch = sectionText.match(/BO\s+Sub\s+Status\s*:?\s*([^\n]+)/i);
      if (subStatusMatch) {
        account.additional_info.bo_sub_status = this.cleanText(subStatusMatch[1]);
      }

      const nomineeMatch = sectionText.match(/Nominee\s*:?\s*([^\n]+)/i);
      if (nomineeMatch) {
        account.additional_info.nominee = this.cleanText(nomineeMatch[1]);
      }
      
    } catch (error) {
      console.error('❌ Error extracting account details:', error);
    }
  }

  /**
   * Find BO ID that belongs to this account
   */
  findBoIdForAccount(fullText, account, accountIndex) {
    try {
      // Extract all BO IDs from the entire PDF text in order
      const allBoIds = [];
      const boIdPattern = /BO\s+ID\s*:?\s*(\d+)/gi;
      let match;
      
      while ((match = boIdPattern.exec(fullText)) !== null) {
        const boId = match[1];
        if (!allBoIds.includes(boId)) {
          allBoIds.push(boId);
        }
      }
      
      // Map the account index to the corresponding BO ID
      if (accountIndex < allBoIds.length) {
        return allBoIds[accountIndex];
      }
      
      // Fallback: construct BO ID from DP ID + Client ID
      if (account.dp_id && account.client_id) {
        return account.dp_id + account.client_id;
      }
      
    } catch (error) {
      console.error('❌ Error finding BO ID for account:', error);
    }
    
    return '';
  }

  /**
   * Extract holdings for a specific account
   */
  async extractHoldingsForAccount(fullText, account) {
    const holdings = {
      equities: [],
      demat_mutual_funds: [],
      corporate_bonds: [],
      government_securities: [],
      aifs: []
    };

    try {
      const boId = account.bo_id;
      if (!boId) {
        return holdings;
      }
      
      // Look for the transaction section that contains this specific BO ID
      const boIdPattern1 = `BO ID: ${boId}`;
      const boIdPattern2 = `BO ID : ${boId}`;
      
      let startIndex = fullText.indexOf(boIdPattern1);
      if (startIndex === -1) {
        startIndex = fullText.indexOf(boIdPattern2);
      }
      
      if (startIndex !== -1) {
        // Find the next BO ID occurrence
        const nextBoIdIndex = fullText.indexOf('BO ID', startIndex + 10);
        const transactionSection = nextBoIdIndex !== -1 ? 
          fullText.substring(startIndex, nextBoIdIndex) :
          fullText.substring(startIndex);
        
        // Check if this section indicates no holdings
        if (transactionSection.includes('Nil Holding')) {
          return holdings; // Return empty holdings
        }
        
        // Check if this section has actual holdings data
        if (transactionSection.includes('HOLDING STATEMENT') && 
            transactionSection.includes('Portfolio Value')) {
          
          // Parse holdings from this specific transaction section
          const parsedHoldings = this.parseHoldingsFromSection(transactionSection);
          
          holdings.equities = parsedHoldings.equities;
          holdings.demat_mutual_funds = parsedHoldings.demat_mutual_funds;
          holdings.corporate_bonds = parsedHoldings.corporate_bonds;
          holdings.government_securities = parsedHoldings.government_securities;
          
          console.log(`     📊 Holdings: ${holdings.equities.length} equities, ${holdings.demat_mutual_funds.length} funds`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting holdings for account:', account.dp_name, error);
    }

    return holdings;
  }

  /**
   * Parse holdings from a specific section
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
      // Enhanced ISIN pattern matching for holdings table
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
        
        // Categorize by ISIN prefix or name
        if (isin.startsWith('INE') || name.toLowerCase().includes('equity') || name.toLowerCase().includes('shares')) {
          holdings.equities.push(holding);
        } else if (isin.startsWith('INF') || name.toLowerCase().includes('etf') || name.toLowerCase().includes('fund')) {
          holdings.demat_mutual_funds.push(holding);
        } else {
          holdings.equities.push(holding); // Default to equity
        }
      }

    } catch (error) {
      console.error('❌ Error parsing holdings from section:', error);
    }

    return holdings;
  }

  /**
   * Extract mutual funds (non-demat)
   */
  async extractMutualFunds(text) {
    const mutualFunds = [];

    try {
      console.log(`📈 Extracting mutual funds...`);

      // Look for mutual fund companies in the document
      const mfStartPattern = /MUTUAL\s+FUND\s+UNITS\s+HELD/i;
      const mfStartIndex = text.search(mfStartPattern);
      
      if (mfStartIndex !== -1) {
        const mfSection = text.substring(mfStartIndex);
        
        // Extract AMC name
        const amcMatch = mfSection.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Mutual\s+Fund/i);
        if (amcMatch) {
          const mutualFund = {
            amc: amcMatch[1],
            folio_number: '',
            registrar: '',
            schemes: [],
            value: 0
          };
          
          // Extract folio number
          const folioMatch = mfSection.match(/Folio\s+No[\s:]*([\d\/]+)/i);
          if (folioMatch) {
            mutualFund.folio_number = folioMatch[1];
          }
          
          // Extract registrar (RTA)
          const rtaMatch = mfSection.match(/RTA[\s:]*([A-Z]+)/i);
          if (rtaMatch) {
            mutualFund.registrar = rtaMatch[1];
          }
          
          // Extract scheme details
          const schemes = this.parseMutualFundSchemes(mfSection);
          mutualFund.schemes = schemes;
          mutualFund.value = schemes.reduce((total, scheme) => total + (scheme.value || 0), 0);
          
          if (mutualFund.schemes.length > 0) {
            mutualFunds.push(mutualFund);
            console.log(`   ✅ Found ${mutualFund.amc}: ${schemes.length} schemes, Value: ₹${mutualFund.value.toLocaleString('en-IN')}`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting mutual funds:', error);
    }

    console.log(`📈 Mutual funds extraction completed: ${mutualFunds.length} AMCs found`);
    return mutualFunds;
  }

  /**
   * Parse mutual fund schemes
   */
  parseMutualFundSchemes(text) {
    const schemes = [];
    
    try {
      // Enhanced scheme pattern matching
      const schemePattern = /([A-Z]{2}[A-Z0-9]{9}\d)\s+([^]+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g;
      let match;
      
      while ((match = schemePattern.exec(text)) !== null) {
        const scheme = {
          isin: match[1],
          name: this.cleanText(match[2]),
          units: this.parseNumber(match[3]),
          nav: match[4],
          value: this.parseNumber(match[5]),
          scheme_type: 'equity', // Default
          additional_info: {
            arn_code: null,
            investment_value: 0
          }
        };
        
        // Determine scheme type from name
        scheme.scheme_type = this.determineSchemeType(scheme.name);
        
        schemes.push(scheme);
      }
    } catch (error) {
      console.error('❌ Error parsing mutual fund schemes:', error);
    }

    return schemes;
  }

  /**
   * Determine scheme type from scheme name
   */
  determineSchemeType(schemeName) {
    if (!schemeName) return 'equity';
    
    const name = schemeName.toLowerCase();
    if (name.includes('debt') || name.includes('bond') || name.includes('liquid') || name.includes('money')) {
      return 'debt';
    } else if (name.includes('hybrid') || name.includes('balanced')) {
      return 'hybrid';
    } else {
      return 'equity'; // Default
    }
  }

  /**
   * Extract statement period
   */
  extractStatementPeriod(text) {
    const period = {
      from: '',
      to: ''
    };

    try {
      // Enhanced period pattern matching
      const periodMatch = text.match(/(?:Period|Statement\s+Period)\s*:?\s*(\d{2}-[A-Z]{3}-\d{4})\s*to\s*(\d{2}-[A-Z]{3}-\d{4})/i) ||
                         text.match(/From\s*:?\s*(\d{2}-[A-Z]{3}-\d{4})\s*To\s*:?\s*(\d{2}-[A-Z]{3}-\d{4})/i);
      
      if (periodMatch) {
        period.from = this.parseDate(periodMatch[1]);
        period.to = this.parseDate(periodMatch[2]);
      }
    } catch (error) {
      console.error('❌ Error extracting statement period:', error);
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

    // Calculate insurance total
    data.insurance.life_insurance_policies.forEach(policy => {
      summary.accounts.insurance.total_value += policy.value || 0;
    });

    // Calculate grand total
    summary.total_value = 
      summary.accounts.demat.total_value + 
      summary.accounts.mutual_funds.total_value + 
      summary.accounts.insurance.total_value;

    return summary;
  }
}

module.exports = CDSLParser; 