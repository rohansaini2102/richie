const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class ClaudeAiService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = 4000;
    
    if (!this.apiKey) {
      throw new Error('Claude API key not found in environment variables');
    }
  }

  /**
   * Make a request to Claude API
   */
  async makeRequest(systemPrompt, userMessage, temperature = 0.3) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: temperature,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      logger.info('Claude AI API request successful', {
        model: this.model,
        usage: response.data.usage
      });

      return {
        success: true,
        content: response.data.content[0].text,
        usage: response.data.usage
      };

    } catch (error) {
      logger.error('Claude AI API request failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Load system prompt from file
   */
  loadPrompt(promptPath) {
    try {
      const fullPath = path.join(__dirname, '..', 'prompts', promptPath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to load prompt: ${promptPath}`, { error: error.message });
      return null;
    }
  }

  /**
   * Analyze client debt and liabilities for cash flow planning
   */
  async analyzeDebtStrategy(clientData) {
    const systemPrompt = this.loadPrompt('debt-analysis.md');
    if (!systemPrompt) {
      throw new Error('Debt analysis prompt not found');
    }

    // Format client data for analysis
    const clientContext = this.formatClientDataForAnalysis(clientData);
    
    const userMessage = `Please analyze this client's debt situation and provide strategic recommendations:

${clientContext}

Please provide:
1. Debt prioritization strategy
2. EMI optimization recommendations
3. Interest savings calculations
4. Cash flow impact analysis
5. Risk warnings if any
6. Specific action items

Format the response as structured JSON for easy parsing.`;

    logger.info('Requesting debt analysis from Claude AI', {
      clientId: clientData._id,
      totalDebts: this.countClientDebts(clientData)
    });

    return await this.makeRequest(systemPrompt, userMessage, 0.3);
  }

  /**
   * Format client data for AI analysis
   */
  formatClientDataForAnalysis(clientData) {
    const debts = clientData.debtsAndLiabilities || {};
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    
    let debtSummary = [];
    let totalEMI = 0;
    let totalOutstanding = 0;

    // Process each debt type
    const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
    
    debtTypes.forEach(debtType => {
      const debt = debts[debtType];
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
        const interestRate = parseFloat(debt.interestRate) || parseFloat(debt.averageInterestRate) || 0;
        
        if (emi > 0 || outstanding > 0) {
          debtSummary.push({
            type: debtType,
            monthlyEMI: emi,
            outstandingAmount: outstanding,
            interestRate: interestRate,
            remainingTenure: debt.remainingTenure || null
          });
          
          totalEMI += emi;
          totalOutstanding += outstanding;
        }
      }
    });

    return `
CLIENT FINANCIAL PROFILE:
- Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus: ₹${(monthlyIncome - monthlyExpenses).toLocaleString('en-IN')}

DEBT PORTFOLIO:
- Total Monthly EMIs: ₹${totalEMI.toLocaleString('en-IN')}
- Total Outstanding Debt: ₹${totalOutstanding.toLocaleString('en-IN')}
- EMI to Income Ratio: ${monthlyIncome > 0 ? ((totalEMI / monthlyIncome) * 100).toFixed(2) : 0}%
- Available Cash Flow: ₹${(monthlyIncome - monthlyExpenses - totalEMI).toLocaleString('en-IN')}

INDIVIDUAL DEBTS:
${debtSummary.map(debt => `
- ${debt.type}: 
  EMI: ₹${debt.monthlyEMI.toLocaleString('en-IN')}
  Outstanding: ₹${debt.outstandingAmount.toLocaleString('en-IN')}
  Interest Rate: ${debt.interestRate}%
  ${debt.remainingTenure ? `Remaining Tenure: ${debt.remainingTenure} years` : ''}
`).join('')}

ADDITIONAL CONTEXT:
- Age: ${clientData.age || 'Not specified'}
- Risk Profile: ${clientData.riskTolerance || 'Not specified'}
- Employment Type: ${clientData.incomeType || 'Not specified'}
`;
  }

  /**
   * Count total number of active debts
   */
  countClientDebts(clientData) {
    const debts = clientData.debtsAndLiabilities || {};
    let count = 0;
    
    Object.values(debts).forEach(debt => {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
        if (emi > 0 || outstanding > 0) count++;
      }
    });
    
    return count;
  }

  /**
   * Validate API configuration
   */
  validateConfiguration() {
    const issues = [];
    
    if (!this.apiKey) {
      issues.push('Claude API key not configured');
    }
    
    if (!this.apiUrl) {
      issues.push('Claude API URL not configured');
    }
    
    if (!this.model) {
      issues.push('Claude model not configured');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = new ClaudeAiService();