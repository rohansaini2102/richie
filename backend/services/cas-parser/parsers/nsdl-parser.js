const BaseParser = require('./base-parser');
const { logger } = require('../../../utils/logger');
const { casEventLogger } = require('../../../utils/casEventLogger');

/**
 * Enhanced NSDL CAS Parser
 * Handles parsing of NSDL (National Securities Depository Limited) CAS documents
 */
class NSDLParser extends BaseParser {
  constructor() {
    super();
    this.name = 'NSDLParser';
    this.casType = 'NSDL';
  }

  /**
   * Parse NSDL CAS document - Main parsing method
   * @param {string} pdfText - Extracted PDF text
   * @param {string} password - Password for encrypted PDF
   * @returns {Promise<Object>} Parsed data
   */
  async parse(pdfText, password = null) {
    try {
      // Store text for parsing
      this.pdfText = pdfText;
      
      this.logStructured('info', 'NSDL_PARSE_STARTED', {
        textLength: pdfText.length,
        hasPassword: !!password,
        passwordLength: password ? password.length : 0
      });
      
      const cleanedText = this.cleanText(pdfText);

      // Validate that we have meaningful content
      if (cleanedText.length < 100) {
        throw new Error('Extracted text is too short. This might not be a valid CAS document.');
      }

      console.log(`🔧 NSDL Parser: Starting data extraction...`);

      // Extract all data components
      const investorInfo = this.extractInvestorInfo(cleanedText);
      const dematAccounts = await this.extractDematAccounts(cleanedText);
      const mutualFunds = await this.extractMutualFunds(cleanedText);

      console.log(`📊 NSDL Parser: Extraction completed`);
      console.log(`   👤 Investor: ${investorInfo.name ? 'Found' : 'Not found'}`);
      console.log(`   🏦 Demat Accounts: ${dematAccounts.length}`);
      console.log(`   📈 Mutual Funds: ${mutualFunds.length}`);

      // Validate that we extracted some meaningful data
      if (!investorInfo.name && !investorInfo.pan && dematAccounts.length === 0) {
        this.logStructured('warn', 'NSDL_MINIMAL_DATA_EXTRACTED', {
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

      this.logStructured('info', 'NSDL_PARSE_COMPLETED', {
        hasInvestorInfo: !!data.investor.name,
        dematAccountsCount: data.demat_accounts.length,
        mutualFundsCount: data.mutual_funds.length,
        totalValue: data.summary.total_value
      });

      return data;

    } catch (error) {
      this.logStructured('error', 'NSDL_PARSE_FAILED', {
        error: error.message,
        hasPassword: !!password,
        passwordLength: password ? password.length : 0
      });
      throw new Error(`NSDL parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract investor information from NSDL CAS
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

      // Extract name - NSDL specific patterns
      const namePatterns = [
        /Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN|Folio)/i,
        /Investor\s+Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN)/i,
        /Client\s+Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN)/i,
        /Account\s+Holder\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|PAN)/i
      ];

      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1]) {
          investor.name = this.cleanText(nameMatch[1]);
          console.log(`   ✅ Name extracted: ${investor.name}`);
          break;
        }
      }

      // Extract PAN - Enhanced patterns for NSDL
      const panPatterns = [
        /PAN\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
        /Permanent\s+Account\s+Number\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
        /Tax\s+ID\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
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

      // Extract address - NSDL specific patterns
      const addressPatterns = [
        /Address\s*:?\s*([^]*?)(?:Email|Mobile|Phone|PAN|Folio)/i,
        /Correspondence\s+Address\s*:?\s*([^]*?)(?:Email|Mobile|Phone)/i
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
        /Email\s*:?\s*([^\s]+@[^\s]+)/i,
        /E-mail\s*:?\s*([^\s]+@[^\s]+)/i,
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
        /Mobile\s*:?\s*([0-9]{10,})/i,
        /Phone\s*:?\s*([0-9]{10,})/i,
        /Contact\s*:?\s*([0-9]{10,})/i
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
      console.log(`🏦 Extracting NSDL demat accounts...`);

      // NSDL demat account pattern (IN + 14 digits)
      const accountPattern = /(IN\d{14})/g;
      const accountMatches = [...text.matchAll(accountPattern)];

      const uniqueAccounts = [...new Set(accountMatches.map(match => match[1]))];
      console.log(`   Found ${uniqueAccounts.length} unique demat account numbers`);

      for (let i = 0; i < uniqueAccounts.length; i++) {
        const accountNumber = uniqueAccounts[i];
        
        const account = {
          dp_id: '',
          dp_name: '',
          bo_id: accountNumber, // NSDL uses the full account number as BO ID
          client_id: '',
          demat_type: 'nsdl',
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

        // Extract DP details for this account
        this.extractNSDLAccountDetails(text, accountNumber, account);
        
        // Extract holdings for this account
        account.holdings = await this.extractNSDLHoldingsForAccount(text, accountNumber);
        
        // Calculate total value
        account.value = this.calculateAccountValue(account.holdings);

        if (account.bo_id) {
          accounts.push(account);
          console.log(`   ✅ Account ${i + 1}: ${account.dp_name || 'NSDL Account'} (Value: ₹${account.value.toLocaleString('en-IN')})`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting NSDL demat accounts:', error);
    }

    console.log(`🏦 NSDL demat accounts extraction completed: ${accounts.length} accounts found`);
    return accounts;
  }

  /**
   * Extract NSDL account details
   */
  extractNSDLAccountDetails(text, accountNumber, account) {
    try {
      // Find the section around this account number
      const accountIndex = text.indexOf(accountNumber);
      if (accountIndex === -1) return;

      const sectionStart = Math.max(0, accountIndex - 500);
      const sectionEnd = Math.min(text.length, accountIndex + 500);
      const accountSection = text.substring(sectionStart, sectionEnd);

      // Extract DP Name (usually mentioned near the account)
      const dpNamePatterns = [
        /DP\s*:?\s*([A-Z][^]*?)(?:\n|Account|Holdings)/i,
        /Depository\s+Participant\s*:?\s*([A-Z][^]*?)(?:\n|Account)/i,
        /Broker\s*:?\s*([A-Z][^]*?)(?:\n|Account)/i
      ];

      for (const pattern of dpNamePatterns) {
        const dpMatch = accountSection.match(pattern);
        if (dpMatch && dpMatch[1]) {
          account.dp_name = this.cleanText(dpMatch[1]);
          break;
        }
      }

      // Extract DP ID (first 8 characters of NSDL account)
      account.dp_id = accountNumber.substring(0, 8);
      
      // Extract Client ID (remaining characters)
      account.client_id = accountNumber.substring(8);

      // Extract additional details
      const emailMatch = accountSection.match(/Email\s*:?\s*([^\s]+@[^\s]+)/i);
      if (emailMatch) {
        account.additional_info.email = emailMatch[1].toLowerCase();
      }

      const statusMatch = accountSection.match(/Status\s*:?\s*([^\n]+)/i);
      if (statusMatch) {
        account.additional_info.status = this.cleanText(statusMatch[1]);
      }

    } catch (error) {
      console.error('❌ Error extracting NSDL account details:', error);
    }
  }

  /**
   * Extract holdings for a specific NSDL account
   */
  async extractNSDLHoldingsForAccount(text, accountNumber) {
    const holdings = {
      equities: [],
      demat_mutual_funds: [],
      corporate_bonds: [],
      government_securities: [],
      aifs: []
    };

    try {
      // Find holdings section for this account
      const accountIndex = text.indexOf(accountNumber);
      if (accountIndex === -1) return holdings;

      // Look for holdings after the account number
      const holdingsStart = accountIndex;
      const nextAccountIndex = text.indexOf('IN', holdingsStart + 20); // Next NSDL account
      const holdingsEnd = nextAccountIndex !== -1 ? nextAccountIndex : text.length;
      
      const holdingsSection = text.substring(holdingsStart, holdingsEnd);

      // Check for holdings indicators
      if (holdingsSection.includes('No Holdings') || holdingsSection.includes('Nil Balance')) {
        return holdings; // Return empty holdings
      }

      // Parse holdings using ISIN patterns
      const parsedHoldings = this.parseNSDLHoldingsFromSection(holdingsSection);
      
      holdings.equities = parsedHoldings.equities;
      holdings.demat_mutual_funds = parsedHoldings.demat_mutual_funds;
      holdings.corporate_bonds = parsedHoldings.corporate_bonds;
      holdings.government_securities = parsedHoldings.government_securities;
      
      console.log(`     📊 Holdings: ${holdings.equities.length} equities, ${holdings.demat_mutual_funds.length} funds`);
      
    } catch (error) {
      console.error('❌ Error extracting NSDL holdings for account:', error);
    }

    return holdings;
  }

  /**
   * Parse holdings from NSDL section
   */
  parseNSDLHoldingsFromSection(sectionText) {
    const holdings = {
      equities: [],
      demat_mutual_funds: [],
      corporate_bonds: [],
      government_securities: [],
      aifs: []
    };

    try {
      // NSDL specific ISIN pattern matching
      const isinPattern = /([A-Z]{2}[A-Z0-9]{9}\d)\s+([^]+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g;
      let match;
      
      while ((match = isinPattern.exec(sectionText)) !== null) {
        const isin = match[1];
        const name = this.cleanText(match[2]);
        const quantity = this.parseNumber(match[3]);
        const price = this.parseNumber(match[4]);
        const value = this.parseNumber(match[5]);
        
        const holding = {
          isin: isin,
          name: name,
          units: quantity,
          value: value,
          additional_info: {
            market_price: price
          }
        };
        
        // Categorize by ISIN prefix or name
        if (isin.startsWith('INE') || name.toLowerCase().includes('equity') || name.toLowerCase().includes('shares')) {
          holdings.equities.push(holding);
        } else if (isin.startsWith('INF') || name.toLowerCase().includes('etf') || name.toLowerCase().includes('fund')) {
          holdings.demat_mutual_funds.push(holding);
        } else if (isin.startsWith('INE') && (name.toLowerCase().includes('bond') || name.toLowerCase().includes('debenture'))) {
          holdings.corporate_bonds.push(holding);
        } else if (isin.startsWith('IN') && name.toLowerCase().includes('government')) {
          holdings.government_securities.push(holding);
        } else {
          holdings.equities.push(holding); // Default to equity
        }
      }

    } catch (error) {
      console.error('❌ Error parsing NSDL holdings from section:', error);
    }

    return holdings;
  }

  /**
   * Extract mutual funds (non-demat) from NSDL CAS
   */
  async extractMutualFunds(text) {
    const mutualFunds = [];
    
    try {
      console.log(`📈 Extracting NSDL mutual funds...`);

      // Look for mutual fund sections
      const mfPattern = /Mutual\s+Fund\s+Statement/i;
      const mfStartIndex = text.search(mfPattern);
      
      if (mfStartIndex !== -1) {
        const mfSection = text.substring(mfStartIndex);
        
        // Extract mutual fund folios
        const folioPattern = /Folio\s+No\s*:?\s*([\d\/A-Z]+)/gi;
        const folioMatches = [...mfSection.matchAll(folioPattern)];
        
        for (const folioMatch of folioMatches) {
          const folioNumber = folioMatch[1];
          
          // Find AMC name near this folio
          const folioIndex = mfSection.indexOf(folioMatch[0]);
          const folioSectionStart = Math.max(0, folioIndex - 200);
          const folioSectionEnd = Math.min(mfSection.length, folioIndex + 1000);
          const folioSectionText = mfSection.substring(folioSectionStart, folioSectionEnd);
          
          const amcMatch = folioSectionText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Mutual\s+Fund|Asset\s+Management)/i);
          
          if (amcMatch) {
            const mutualFund = {
              amc: amcMatch[1],
              folio_number: folioNumber,
              registrar: '',
              schemes: [],
              value: 0
            };
            
            // Extract schemes for this folio
            const schemes = this.parseNSDLMutualFundSchemes(folioSectionText);
            mutualFund.schemes = schemes;
            mutualFund.value = schemes.reduce((total, scheme) => total + (scheme.value || 0), 0);
            
            if (mutualFund.schemes.length > 0) {
              mutualFunds.push(mutualFund);
              console.log(`   ✅ Found ${mutualFund.amc}: ${schemes.length} schemes, Value: ₹${mutualFund.value.toLocaleString('en-IN')}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting NSDL mutual funds:', error);
    }

    console.log(`📈 NSDL mutual funds extraction completed: ${mutualFunds.length} AMCs found`);
    return mutualFunds;
  }

  /**
   * Parse NSDL mutual fund schemes
   */
  parseNSDLMutualFundSchemes(text) {
    const schemes = [];
    
    try {
      // NSDL specific scheme pattern
      const schemePattern = /([A-Z]{2}[A-Z0-9]{9}\d)\s+([^]+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g;
      let match;
      
      while ((match = schemePattern.exec(text)) !== null) {
        const scheme = {
          isin: match[1],
          name: this.cleanText(match[2]),
          units: this.parseNumber(match[3]),
          nav: this.parseNumber(match[4]),
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
      console.error('❌ Error parsing NSDL mutual fund schemes:', error);
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
      // NSDL specific period patterns
      const periodMatch = text.match(/Statement\s+Period\s*:?\s*(\d{2}\/\d{2}\/\d{4})\s*to\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                         text.match(/From\s*:?\s*(\d{2}\/\d{2}\/\d{4})\s*To\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                         text.match(/Period\s*:?\s*(\d{2}-[A-Z]{3}-\d{4})\s*to\s*(\d{2}-[A-Z]{3}-\d{4})/i);
      
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

module.exports = NSDLParser;