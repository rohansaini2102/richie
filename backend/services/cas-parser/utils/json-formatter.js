const { logger } = require('../../../utils/logger');
const { casEventLogger } = require('../../../utils/casEventLogger');

class JSONFormatter {
  constructor() {
    this.version = '2.0.0';
    this.trackingId = this.generateTrackingId();
  }

  /**
   * Generate unique tracking ID
   */
  generateTrackingId() {
    return `FORMATTER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format parsed data into standardized JSON structure
   * @param {Object} data - Parsed data from CAS parser
   * @returns {Object} - Formatted JSON data
   */
  format(data) {
    const formatStartTime = Date.now();
    
    casEventLogger.logInfo('JSON_FORMAT_STARTED', {
      hasInvestorInfo: !!data.investor,
      dematAccountsCount: data.demat_accounts?.length || 0,
      mutualFundsCount: data.mutual_funds?.length || 0,
      trackingId: this.trackingId
    });

    try {
      console.log(`🔧 Formatting parsed data...`);

      const formattedData = {
        investor: this.formatInvestorInfo(data.investor),
        demat_accounts: this.formatDematAccounts(data.demat_accounts),
        mutual_funds: this.formatMutualFunds(data.mutual_funds),
        insurance: this.formatInsurance(data.insurance),
        summary: this.formatSummary(data.summary),
        meta: this.formatMeta(data.meta)
      };

      const formatDuration = Date.now() - formatStartTime;

      casEventLogger.logInfo('JSON_FORMAT_SUCCESS', {
        formatDuration: `${formatDuration}ms`,
        outputSize: JSON.stringify(formattedData).length,
        trackingId: this.trackingId
      });

      console.log(`✅ Data formatting completed in ${formatDuration}ms`);

      logger.info('Data formatted successfully', {
        formatDuration,
        outputSize: JSON.stringify(formattedData).length,
        trackingId: this.trackingId
      });
      
      return formattedData;
      
    } catch (error) {
      const formatDuration = Date.now() - formatStartTime;
      
      casEventLogger.logError('JSON_FORMAT_FAILED', error, {
        formatDuration: `${formatDuration}ms`,
        trackingId: this.trackingId
      });

      logger.error('Error formatting data:', {
        error: error.message,
        formatDuration,
        trackingId: this.trackingId
      });
      
      throw new Error(`Failed to format data: ${error.message}`);
    }
  }

  /**
   * Format investor information
   * @param {Object} investor - Raw investor data
   * @returns {Object} - Formatted investor data
   */
  formatInvestorInfo(investor) {
    if (!investor) {
      return {
        name: '',
        pan: '',
        address: '',
        email: '',
        mobile: '',
        cas_id: '',
        pincode: ''
      };
    }

    return {
      name: this.cleanString(investor.name || ''),
      pan: this.cleanString(investor.pan || '').toUpperCase(),
      address: this.cleanString(investor.address || ''),
      email: this.cleanString(investor.email || '').toLowerCase(),
      mobile: this.cleanString(investor.mobile || ''),
      cas_id: this.cleanString(investor.cas_id || ''),
      pincode: this.cleanString(investor.pincode || '')
    };
  }

  /**
   * Format demat accounts data
   * @param {Array} accounts - Raw demat accounts data
   * @returns {Array} - Formatted demat accounts data
   */
  formatDematAccounts(accounts) {
    if (!Array.isArray(accounts)) return [];
    
    return accounts.map(account => ({
      dp_id: this.cleanString(account.dp_id || ''),
      dp_name: this.cleanString(account.dp_name || ''),
      bo_id: this.cleanString(account.bo_id || ''),
      client_id: this.cleanString(account.client_id || ''),
      demat_type: this.cleanString(account.demat_type || 'cdsl').toLowerCase(),
      holdings: this.formatHoldings(account.holdings),
      additional_info: this.formatAdditionalInfo(account.additional_info),
      value: this.parseNumber(account.value || 0)
    }));
  }

  /**
   * Format holdings data
   * @param {Object} holdings - Raw holdings data
   * @returns {Object} - Formatted holdings data
   */
  formatHoldings(holdings) {
    if (!holdings) {
      return {
        equities: [],
        demat_mutual_funds: [],
        corporate_bonds: [],
        government_securities: [],
        aifs: []
      };
    }

    return {
      equities: this.formatEquities(holdings.equities || []),
      demat_mutual_funds: this.formatDematMutualFunds(holdings.demat_mutual_funds || []),
      corporate_bonds: this.formatCorporateBonds(holdings.corporate_bonds || []),
      government_securities: this.formatGovernmentSecurities(holdings.government_securities || []),
      aifs: this.formatAIFs(holdings.aifs || [])
    };
  }

  /**
   * Format equities data
   * @param {Array} equities - Raw equities data
   * @returns {Array} - Formatted equities data
   */
  formatEquities(equities) {
    if (!Array.isArray(equities)) return [];
    
    return equities.map(equity => ({
      isin: this.cleanString(equity.isin || ''),
      name: this.cleanString(equity.name || equity.company_name || ''),
      symbol: this.cleanString(equity.symbol || ''),
      units: this.parseNumber(equity.units || equity.quantity || 0),
      price: this.parseNumber(equity.price || equity.market_price || 0),
      value: this.parseNumber(equity.value || 0),
      additional_info: equity.additional_info || {}
    }));
  }

  /**
   * Format demat mutual funds data
   * @param {Array} funds - Raw demat mutual funds data
   * @returns {Array} - Formatted demat mutual funds data
   */
  formatDematMutualFunds(funds) {
    if (!Array.isArray(funds)) return [];
    
    return funds.map(fund => ({
      isin: this.cleanString(fund.isin || ''),
      name: this.cleanString(fund.name || fund.scheme_name || ''),
      units: this.parseNumber(fund.units || 0),
      nav: this.parseNumber(fund.nav || 0),
      value: this.parseNumber(fund.value || 0),
      fund_house: this.cleanString(fund.fund_house || ''),
      additional_info: fund.additional_info || {}
    }));
  }

  /**
   * Format corporate bonds data
   * @param {Array} bonds - Raw corporate bonds data
   * @returns {Array} - Formatted corporate bonds data
   */
  formatCorporateBonds(bonds) {
    if (!Array.isArray(bonds)) return [];
    
    return bonds.map(bond => ({
      isin: this.cleanString(bond.isin || ''),
      name: this.cleanString(bond.name || bond.company_name || ''),
      symbol: this.cleanString(bond.symbol || ''),
      units: this.parseNumber(bond.units || bond.quantity || 0),
      face_value: this.parseNumber(bond.face_value || 0),
      value: this.parseNumber(bond.value || 0),
      additional_info: bond.additional_info || {}
    }));
  }

  /**
   * Format government securities data
   * @param {Array} securities - Raw government securities data
   * @returns {Array} - Formatted government securities data
   */
  formatGovernmentSecurities(securities) {
    if (!Array.isArray(securities)) return [];
    
    return securities.map(security => ({
      isin: this.cleanString(security.isin || ''),
      name: this.cleanString(security.name || security.security_name || ''),
      symbol: this.cleanString(security.symbol || ''),
      units: this.parseNumber(security.units || security.quantity || 0),
      face_value: this.parseNumber(security.face_value || 0),
      value: this.parseNumber(security.value || 0),
      additional_info: security.additional_info || {}
    }));
  }

  /**
   * Format AIFs data
   * @param {Array} aifs - Raw AIFs data
   * @returns {Array} - Formatted AIFs data
   */
  formatAIFs(aifs) {
    if (!Array.isArray(aifs)) return [];
    
    return aifs.map(aif => ({
      isin: this.cleanString(aif.isin || ''),
      name: this.cleanString(aif.name || aif.scheme_name || ''),
      units: this.parseNumber(aif.units || 0),
      nav: this.parseNumber(aif.nav || 0),
      value: this.parseNumber(aif.value || 0),
      fund_house: this.cleanString(aif.fund_house || ''),
      additional_info: aif.additional_info || {}
    }));
  }

  /**
   * Format additional info data
   * @param {Object} info - Raw additional info data
   * @returns {Object} - Formatted additional info data
   */
  formatAdditionalInfo(info) {
    if (!info) {
      return {
        status: 'Active',
        bo_type: null,
        bo_sub_status: '',
        bsda: 'NO',
        nominee: '',
        email: ''
      };
    }

    return {
      status: this.cleanString(info.status || 'Active'),
      bo_type: info.bo_type || null,
      bo_sub_status: this.cleanString(info.bo_sub_status || ''),
      bsda: this.cleanString(info.bsda || 'NO'),
      nominee: this.cleanString(info.nominee || ''),
      email: this.cleanString(info.email || '').toLowerCase()
    };
  }

  /**
   * Format mutual funds data
   * @param {Array} funds - Raw mutual funds data
   * @returns {Array} - Formatted mutual funds data
   */
  formatMutualFunds(funds) {
    if (!Array.isArray(funds)) return [];
    
    return funds.map(fund => ({
      amc: this.cleanString(fund.amc || ''),
      folio_number: this.cleanString(fund.folio_number || ''),
      registrar: this.cleanString(fund.registrar || ''),
      schemes: this.formatSchemes(fund.schemes || []),
      value: this.parseNumber(fund.value || 0)
    }));
  }

  /**
   * Format schemes data
   * @param {Array} schemes - Raw schemes data
   * @returns {Array} - Formatted schemes data
   */
  formatSchemes(schemes) {
    if (!Array.isArray(schemes)) return [];
    
    return schemes.map(scheme => ({
      isin: this.cleanString(scheme.isin || ''),
      name: this.cleanString(scheme.name || scheme.scheme_name || ''),
      units: this.parseNumber(scheme.units || 0),
      nav: this.parseNumber(scheme.nav || 0),
      value: this.parseNumber(scheme.value || 0),
      scheme_type: this.cleanString(scheme.scheme_type || 'equity'),
      additional_info: {
        arn_code: scheme.additional_info?.arn_code || null,
        investment_value: this.parseNumber(scheme.additional_info?.investment_value || 0)
      }
    }));
  }

  /**
   * Format insurance data
   * @param {Object} insurance - Raw insurance data
   * @returns {Object} - Formatted insurance data
   */
  formatInsurance(insurance) {
    if (!insurance) {
      return {
        life_insurance_policies: []
      };
    }

    return {
      life_insurance_policies: this.formatLifeInsurancePolicies(insurance.life_insurance_policies || [])
    };
  }

  /**
   * Format life insurance policies data
   * @param {Array} policies - Raw life insurance policies data
   * @returns {Array} - Formatted life insurance policies data
   */
  formatLifeInsurancePolicies(policies) {
    if (!Array.isArray(policies)) return [];
    
    return policies.map(policy => ({
      policy_number: this.cleanString(policy.policy_number || ''),
      policy_name: this.cleanString(policy.policy_name || ''),
      sum_assured: this.parseNumber(policy.sum_assured || 0),
      premium: this.parseNumber(policy.premium || 0),
      policy_status: this.cleanString(policy.policy_status || ''),
      maturity_date: this.parseDate(policy.maturity_date)
    }));
  }

  /**
   * Format summary data
   * @param {Object} summary - Raw summary data
   * @returns {Object} - Formatted summary data
   */
  formatSummary(summary) {
    if (!summary) {
      return {
        accounts: {
          demat: {
            count: 0,
            total_value: 0
          },
          mutual_funds: {
            count: 0,
            total_value: 0
          },
          insurance: {
            count: 0,
            total_value: 0
          }
        },
        total_value: 0
      };
    }

    return {
      accounts: {
        demat: {
          count: summary.accounts?.demat?.count || 0,
          total_value: this.parseNumber(summary.accounts?.demat?.total_value || 0)
        },
        mutual_funds: {
          count: summary.accounts?.mutual_funds?.count || 0,
          total_value: this.parseNumber(summary.accounts?.mutual_funds?.total_value || 0)
        },
        insurance: {
          count: summary.accounts?.insurance?.count || 0,
          total_value: this.parseNumber(summary.accounts?.insurance?.total_value || 0)
        }
      },
      total_value: this.parseNumber(summary.total_value || 0)
    };
  }

  /**
   * Format meta data
   * @param {Object} meta - Raw meta data
   * @returns {Object} - Formatted meta data
   */
  formatMeta(meta) {
    if (!meta) {
      return {
        cas_type: 'UNKNOWN',
        generated_at: new Date().toISOString().split('.')[0],
        statement_period: {
          from: '',
          to: ''
        }
      };
    }

    return {
      cas_type: this.cleanString(meta.cas_type || 'UNKNOWN'),
      generated_at: meta.generated_at || new Date().toISOString().split('.')[0],
      statement_period: {
        from: meta.statement_period?.from || '',
        to: meta.statement_period?.to || ''
      }
    };
  }

  /**
   * Clean string by removing extra whitespace and normalizing
   * @param {string} str - Input string
   * @returns {string} - Cleaned string
   */
  cleanString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ');
  }

  /**
   * Parse number from string with enhanced handling
   * @param {string|number} value - Input value
   * @returns {number} - Parsed number
   */
  parseNumber(value) {
    if (typeof value === 'number') return Math.round(value * 100) / 100;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : Math.round(num * 100) / 100;
    }
    return 0;
  }

  /**
   * Parse date from string
   * @param {string|Date} value - Input value
   * @returns {string|null} - Parsed date in ISO format
   */
  parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
    return null;
  }

  /**
   * Pretty print JSON data with proper formatting
   * @param {Object} data - JSON data
   * @returns {string} - Pretty printed JSON string
   */
  prettyPrint(data) {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      logger.error('Error pretty printing JSON:', {
        error: error.message,
        trackingId: this.trackingId
      });
      return JSON.stringify({ error: 'Failed to format JSON' }, null, 2);
    }
  }

  /**
   * Validate formatted data structure
   * @param {Object} data - Formatted data
   * @returns {Object} - Validation result
   */
  validateFormat(data) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check required top-level properties
      const requiredProps = ['investor', 'demat_accounts', 'mutual_funds', 'insurance', 'summary', 'meta'];
      requiredProps.forEach(prop => {
        if (!(prop in data)) {
          validation.errors.push(`Missing required property: ${prop}`);
          validation.isValid = false;
        }
      });

      // Check data types
      if (data.demat_accounts && !Array.isArray(data.demat_accounts)) {
        validation.errors.push('demat_accounts must be an array');
        validation.isValid = false;
      }

      if (data.mutual_funds && !Array.isArray(data.mutual_funds)) {
        validation.errors.push('mutual_funds must be an array');
        validation.isValid = false;
      }

      // Check summary totals
      if (data.summary && typeof data.summary.total_value !== 'number') {
        validation.warnings.push('summary.total_value should be a number');
      }

    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
      validation.isValid = false;
    }

    return validation;
  }
}

module.exports = JSONFormatter;