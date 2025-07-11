const { logger } = require('../../../utils/logger');

class JSONFormatter {
  constructor() {
    this.version = '1.0.0';
  }

  /**
   * Format parsed data into standardized JSON structure
   * @param {Object} data - Parsed data from CAS parser
   * @returns {Object} - Formatted JSON data
   */
  format(data) {
    try {
      const formattedData = {
        investor: this.formatInvestorInfo(data.investor),
        demat_accounts: this.formatDematAccounts(data.demat_accounts),
        mutual_funds: this.formatMutualFunds(data.mutual_funds),
        insurance: this.formatInsurance(data.insurance),
        summary: this.formatSummary(data.summary),
        meta: this.formatMeta(data.meta)
      };

      logger.info('Data formatted successfully');
      return formattedData;
      
    } catch (error) {
      logger.error('Error formatting data:', error.message);
      throw new Error(`Failed to format data: ${error.message}`);
    }
  }

  /**
   * Format investor information
   * @param {Object} investor - Raw investor data
   * @returns {Object} - Formatted investor data
   */
  formatInvestorInfo(investor) {
    return {
      name: this.cleanString(investor?.name || ''),
      pan: this.cleanString(investor?.pan || ''),
      address: this.cleanString(investor?.address || ''),
      email: this.cleanString(investor?.email || ''),
      mobile: this.cleanString(investor?.mobile || ''),
      cas_id: this.cleanString(investor?.cas_id || ''),
      pincode: this.cleanString(investor?.pincode || '')
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
      dp_id: this.cleanString(account?.dp_id || ''),
      dp_name: this.cleanString(account?.dp_name || ''),
      bo_id: this.cleanString(account?.bo_id || ''),
      client_id: this.cleanString(account?.client_id || ''),
      demat_type: this.cleanString(account?.demat_type || ''),
      holdings: this.formatHoldings(account?.holdings),
      additional_info: this.formatAdditionalInfo(account?.additional_info),
      value: this.parseNumber(account?.value || 0)
    }));
  }

  /**
   * Format holdings data
   * @param {Object} holdings - Raw holdings data
   * @returns {Object} - Formatted holdings data
   */
  formatHoldings(holdings) {
    return {
      equities: this.formatEquities(holdings?.equities || []),
      demat_mutual_funds: this.formatDematMutualFunds(holdings?.demat_mutual_funds || []),
      corporate_bonds: this.formatCorporateBonds(holdings?.corporate_bonds || []),
      government_securities: this.formatGovernmentSecurities(holdings?.government_securities || []),
      aifs: this.formatAIFs(holdings?.aifs || [])
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
      symbol: this.cleanString(equity?.symbol || ''),
      isin: this.cleanString(equity?.isin || ''),
      company_name: this.cleanString(equity?.company_name || ''),
      quantity: this.parseNumber(equity?.quantity || 0),
      price: this.parseNumber(equity?.price || 0),
      value: this.parseNumber(equity?.value || 0),
      face_value: this.parseNumber(equity?.face_value || 0),
      market_lot: this.parseNumber(equity?.market_lot || 0)
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
      scheme_name: this.cleanString(fund?.scheme_name || ''),
      isin: this.cleanString(fund?.isin || ''),
      units: this.parseNumber(fund?.units || 0),
      nav: this.parseNumber(fund?.nav || 0),
      value: this.parseNumber(fund?.value || 0),
      fund_house: this.cleanString(fund?.fund_house || '')
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
      symbol: this.cleanString(bond?.symbol || ''),
      isin: this.cleanString(bond?.isin || ''),
      company_name: this.cleanString(bond?.company_name || ''),
      quantity: this.parseNumber(bond?.quantity || 0),
      face_value: this.parseNumber(bond?.face_value || 0),
      value: this.parseNumber(bond?.value || 0)
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
      symbol: this.cleanString(security?.symbol || ''),
      isin: this.cleanString(security?.isin || ''),
      security_name: this.cleanString(security?.security_name || ''),
      quantity: this.parseNumber(security?.quantity || 0),
      face_value: this.parseNumber(security?.face_value || 0),
      value: this.parseNumber(security?.value || 0)
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
      scheme_name: this.cleanString(aif?.scheme_name || ''),
      isin: this.cleanString(aif?.isin || ''),
      units: this.parseNumber(aif?.units || 0),
      nav: this.parseNumber(aif?.nav || 0),
      value: this.parseNumber(aif?.value || 0),
      fund_house: this.cleanString(aif?.fund_house || '')
    }));
  }

  /**
   * Format additional info data
   * @param {Object} info - Raw additional info data
   * @returns {Object} - Formatted additional info data
   */
  formatAdditionalInfo(info) {
    return {
      status: this.cleanString(info?.status || ''),
      bo_type: this.cleanString(info?.bo_type || ''),
      bo_sub_status: this.cleanString(info?.bo_sub_status || ''),
      bsda: this.cleanString(info?.bsda || ''),
      nominee: this.cleanString(info?.nominee || ''),
      email: this.cleanString(info?.email || '')
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
      amc: this.cleanString(fund?.amc || ''),
      folio_number: this.cleanString(fund?.folio_number || ''),
      schemes: this.formatSchemes(fund?.schemes || []),
      value: this.parseNumber(fund?.value || 0)
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
      scheme_name: this.cleanString(scheme?.scheme_name || ''),
      isin: this.cleanString(scheme?.isin || ''),
      units: this.parseNumber(scheme?.units || 0),
      nav: this.parseNumber(scheme?.nav || 0),
      value: this.parseNumber(scheme?.value || 0),
      closing_balance: this.parseNumber(scheme?.closing_balance || 0),
      transactions: this.formatTransactions(scheme?.transactions || [])
    }));
  }

  /**
   * Format transactions data
   * @param {Array} transactions - Raw transactions data
   * @returns {Array} - Formatted transactions data
   */
  formatTransactions(transactions) {
    if (!Array.isArray(transactions)) return [];
    
    return transactions.map(transaction => ({
      date: this.parseDate(transaction?.date),
      description: this.cleanString(transaction?.description || ''),
      amount: this.parseNumber(transaction?.amount || 0),
      units: this.parseNumber(transaction?.units || 0),
      nav: this.parseNumber(transaction?.nav || 0),
      balance: this.parseNumber(transaction?.balance || 0)
    }));
  }

  /**
   * Format insurance data
   * @param {Object} insurance - Raw insurance data
   * @returns {Object} - Formatted insurance data
   */
  formatInsurance(insurance) {
    return {
      life_insurance_policies: this.formatLifeInsurancePolicies(insurance?.life_insurance_policies || [])
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
      policy_number: this.cleanString(policy?.policy_number || ''),
      policy_name: this.cleanString(policy?.policy_name || ''),
      sum_assured: this.parseNumber(policy?.sum_assured || 0),
      premium: this.parseNumber(policy?.premium || 0),
      policy_status: this.cleanString(policy?.policy_status || ''),
      maturity_date: this.parseDate(policy?.maturity_date)
    }));
  }

  /**
   * Format summary data
   * @param {Object} summary - Raw summary data
   * @returns {Object} - Formatted summary data
   */
  formatSummary(summary) {
    return {
      accounts: {
        demat: {
          total_value: this.parseNumber(summary?.accounts?.demat?.total_value || 0),
          total_accounts: this.parseNumber(summary?.accounts?.demat?.total_accounts || 0)
        },
        mutual_funds: {
          total_value: this.parseNumber(summary?.accounts?.mutual_funds?.total_value || 0),
          total_folios: this.parseNumber(summary?.accounts?.mutual_funds?.total_folios || 0)
        },
        insurance: {
          total_policies: this.parseNumber(summary?.accounts?.insurance?.total_policies || 0),
          total_sum_assured: this.parseNumber(summary?.accounts?.insurance?.total_sum_assured || 0)
        }
      },
      total_value: this.parseNumber(summary?.total_value || 0)
    };
  }

  /**
   * Format meta data
   * @param {Object} meta - Raw meta data
   * @returns {Object} - Formatted meta data
   */
  formatMeta(meta) {
    return {
      cas_type: this.cleanString(meta?.cas_type || ''),
      generated_at: this.cleanString(meta?.generated_at || ''),
      parsed_at: new Date().toISOString(),
      parser_version: this.version
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
   * Parse number from string
   * @param {string|number} value - Input value
   * @returns {number} - Parsed number
   */
  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Parse date from string
   * @param {string|Date} value - Input value
   * @returns {Date|null} - Parsed date
   */
  parseDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  /**
   * Pretty print JSON data
   * @param {Object} data - JSON data
   * @returns {string} - Pretty printed JSON string
   */
  prettyPrint(data) {
    return JSON.stringify(data, null, 2);
  }
}

module.exports = JSONFormatter; 