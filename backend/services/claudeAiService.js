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
    const requestStartTime = Date.now();
    
    const requestPayload = {
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
    };

    console.log('📡 [ClaudeAI] Preparing Claude API request:', {
      apiUrl: this.apiUrl,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature,
      systemPromptLength: systemPrompt.length + ' chars',
      userMessageLength: userMessage.length + ' chars',
      payloadSize: JSON.stringify(requestPayload).length + ' chars'
    });

    try {
      console.log('🚀 [ClaudeAI] Sending request to Claude API...');
      const response = await axios.post(
        this.apiUrl,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const requestTime = Date.now() - requestStartTime;

      console.log('✅ [ClaudeAI] Claude API request successful:', {
        requestTime: requestTime + 'ms',
        status: response.status,
        statusText: response.statusText,
        model: this.model,
        hasContent: !!response.data.content,
        contentLength: response.data.content?.[0]?.text?.length + ' chars' || 0,
        hasUsage: !!response.data.usage,
        usage: response.data.usage
      });

      logger.info('Claude AI API request successful', {
        model: this.model,
        usage: response.data.usage
      });

      const result = {
        success: true,
        content: response.data.content[0].text,
        usage: response.data.usage
      };

      console.log('📤 [ClaudeAI] Returning successful response:', {
        hasContent: !!result.content,
        contentPreview: result.content?.substring(0, 100) + '...',
        hasUsage: !!result.usage
      });

      return result;

    } catch (error) {
      const requestTime = Date.now() - requestStartTime;
      
      console.error('❌ [ClaudeAI] Claude API request failed:', {
        requestTime: requestTime + 'ms',
        errorType: error.constructor.name,
        errorMessage: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        isTimeoutError: error.code === 'ECONNABORTED',
        isNetworkError: !error.response,
        hasApiKey: !!this.apiKey,
        apiUrl: this.apiUrl
      });

      logger.error('Claude AI API request failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      const result = {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };

      console.log('📤 [ClaudeAI] Returning error response:', result);

      return result;
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
    console.log('🧠 [ClaudeAI] Starting debt strategy analysis:', {
      hasClientData: !!clientData,
      clientId: clientData._id || clientData.id || 'unknown',
      clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A'
    });

    const systemPrompt = this.loadPrompt('debt-analysis.md');
    if (!systemPrompt) {
      console.log('❌ [ClaudeAI] Debt analysis prompt not found');
      throw new Error('Debt analysis prompt not found');
    }

    console.log('📋 [ClaudeAI] System prompt loaded:', {
      promptLength: systemPrompt.length + ' chars',
      hasPrompt: !!systemPrompt
    });

    // Format client data for analysis
    console.log('🔧 [ClaudeAI] Formatting client data for analysis...');
    const clientContext = this.formatClientDataForAnalysis(clientData);
    
    console.log('📊 [ClaudeAI] Client context formatted:', {
      contextLength: clientContext.length + ' chars',
      totalDebts: this.countClientDebts(clientData),
      hasFinancialData: clientContext.includes('Monthly Income:'),
      hasDebtData: clientContext.includes('INDIVIDUAL DEBTS:')
    });
    
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

    console.log('📝 [ClaudeAI] User message prepared:', {
      messageLength: userMessage.length + ' chars',
      contextPreview: clientContext.substring(0, 200) + '...'
    });

    logger.info('Requesting debt analysis from Claude AI', {
      clientId: clientData._id,
      totalDebts: this.countClientDebts(clientData)
    });

    console.log('📡 [ClaudeAI] Making request to Claude API...');
    const response = await this.makeRequest(systemPrompt, userMessage, 0.3);
    
    console.log('📥 [ClaudeAI] Claude API response received:', {
      success: response.success,
      hasContent: !!response.content,
      contentLength: response.content ? response.content.length + ' chars' : 0,
      hasUsage: !!response.usage,
      error: response.error,
      usageDetails: response.usage
    });

    return response;
  }

  /**
   * Format client data for AI analysis with improved data extraction
   */
  formatClientDataForAnalysis(clientData) {
    const debts = clientData.debtsAndLiabilities || {};
    
    // Enhanced income field handling - check multiple possible sources
    let monthlyIncome = clientData.totalMonthlyIncome || 
                       clientData.calculatedFinancials?.totalMonthlyIncome ||
                       clientData.calculatedFinancials?.monthlyIncome;
                       
    // Fallback to annual income conversion
    if (!monthlyIncome && clientData.annualIncome) {
      monthlyIncome = Math.round(clientData.annualIncome / 12);
      console.log('🔄 [Claude AI] Converting annualIncome to monthly:', {
        annualIncome: clientData.annualIncome,
        monthlyIncome: monthlyIncome
      });
    }
    monthlyIncome = Math.max(0, monthlyIncome || 0);
    
    // Enhanced expense field handling
    const monthlyExpenses = Math.max(0, 
      clientData.totalMonthlyExpenses || 
      clientData.calculatedFinancials?.totalMonthlyExpenses || 
      0
    );
    
    let debtSummary = [];
    let totalEMI = 0;
    let totalOutstanding = 0;

    // Process each debt type with enhanced validation
    const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
    
    console.log('💳 [Claude AI] Processing debts:', {
      availableDebtTypes: Object.keys(debts),
      totalDebtEntries: Object.keys(debts).length
    });
    
    debtTypes.forEach(debtType => {
      const debt = debts[debtType];
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = Math.max(0, parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0);
        const outstanding = Math.max(0, parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0);
        const interestRate = Math.max(0, parseFloat(debt.interestRate) || parseFloat(debt.averageInterestRate) || 0);
        
        // Only include debts with meaningful financial impact
        if (emi > 100 || outstanding > 1000) { // Minimum thresholds to filter noise
          const debtInfo = {
            type: debtType,
            monthlyEMI: emi,
            outstandingAmount: outstanding,
            interestRate: interestRate,
            remainingTenure: debt.remainingTenure || null,
            loanProvider: debt.loanProvider || 'Not specified'
          };
          
          debtSummary.push(debtInfo);
          totalEMI += emi;
          totalOutstanding += outstanding;
          
          console.log(`📋 [Claude AI] Added ${debtType}:`, {
            emi: emi,
            outstanding: outstanding,
            interestRate: interestRate
          });
        }
      }
    });

    console.log('📊 [Claude AI] Debt summary completed:', {
      totalDebts: debtSummary.length,
      totalEMI,
      totalOutstanding,
      emiRatio: monthlyIncome > 0 ? ((totalEMI / monthlyIncome) * 100).toFixed(2) : 0
    });

    // Calculate key financial ratios
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const availableCashFlow = monthlySurplus - totalEMI;
    const emiRatio = monthlyIncome > 0 ? ((totalEMI / monthlyIncome) * 100) : 0;
    const expenseRatio = monthlyIncome > 0 ? ((monthlyExpenses / monthlyIncome) * 100) : 0;
    const savingsRate = monthlyIncome > 0 ? ((availableCashFlow / monthlyIncome) * 100) : 0;

    // Enhanced formatting for AI analysis
    return `
CLIENT FINANCIAL PROFILE:
- Name: ${clientData.firstName || 'Not provided'} ${clientData.lastName || ''}
- Age: ${clientData.age || clientData.retirementPlanning?.currentAge || 'Not specified'}
- Employment: ${clientData.incomeType || clientData.occupation || 'Not specified'}
- Risk Tolerance: ${clientData.riskTolerance || clientData.enhancedRiskProfile?.riskTolerance || 'Not specified'}

INCOME & EXPENSES:
- Gross Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Total Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus (before EMIs): ₹${monthlySurplus.toLocaleString('en-IN')}
- Expense Ratio: ${expenseRatio.toFixed(2)}%

DEBT PORTFOLIO ANALYSIS:
- Total Active Debts: ${debtSummary.length}
- Combined Monthly EMIs: ₹${totalEMI.toLocaleString('en-IN')}
- Total Outstanding Amount: ₹${totalOutstanding.toLocaleString('en-IN')}
- EMI-to-Income Ratio: ${emiRatio.toFixed(2)}% ${emiRatio > 40 ? '⚠️ EXCEEDS SAFE LIMIT' : '✓ Within safe range'}
- Post-EMI Cash Flow: ₹${availableCashFlow.toLocaleString('en-IN')}
- Savings Rate: ${savingsRate.toFixed(2)}%

INDIVIDUAL DEBT BREAKDOWN:
${debtSummary.length > 0 ? debtSummary.map(debt => `
📋 ${debt.type.toUpperCase()}:
   • Monthly EMI: ₹${debt.monthlyEMI.toLocaleString('en-IN')}
   • Outstanding: ₹${debt.outstandingAmount.toLocaleString('en-IN')}
   • Interest Rate: ${debt.interestRate}% ${debt.interestRate > 15 ? '(HIGH)' : debt.interestRate > 10 ? '(MODERATE)' : '(LOW)'}
   • Lender: ${debt.loanProvider}
   ${debt.remainingTenure ? `   • Remaining: ${debt.remainingTenure} years` : ''}
`).join('') : '   No active debts found - Excellent debt position!'}

ASSETS & INVESTMENTS:
- Emergency Fund: ₹${(clientData.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Total Investments: ₹${this.calculateTotalInvestments(clientData.assets).toLocaleString('en-IN')}

FINANCIAL HEALTH INDICATORS:
- Debt Burden: ${emiRatio > 40 ? 'HIGH RISK' : emiRatio > 30 ? 'MODERATE' : 'LOW'}
- Liquidity Position: ${availableCashFlow < 0 ? 'NEGATIVE CASH FLOW' : availableCashFlow < 5000 ? 'TIGHT' : 'HEALTHY'}
- Emergency Coverage: ${(clientData.assets?.cashBankSavings || 0) >= (monthlyExpenses * 6) ? 'ADEQUATE' : 'INSUFFICIENT'}

Please provide specific, actionable debt management recommendations focusing on:
1. Debt prioritization by interest rates
2. EMI optimization strategies  
3. Interest savings calculations
4. Timeline for debt elimination
5. Emergency fund building plan
6. Cash flow improvement strategies
`;
  }

  /**
   * Calculate total investments from assets
   */
  calculateTotalInvestments(assets) {
    if (!assets || typeof assets !== 'object') return 0;
    
    let total = 0;
    
    // Add equity investments
    if (assets.investments?.equity) {
      const equity = assets.investments.equity;
      total += (equity.mutualFunds || 0) + (equity.directStocks || 0) + (equity.elss || 0);
    }
    
    // Add fixed income investments
    if (assets.investments?.fixedIncome) {
      const fixedIncome = assets.investments.fixedIncome;
      total += (fixedIncome.ppf || 0) + (fixedIncome.epf || 0) + (fixedIncome.nps || 0) + 
               (fixedIncome.fixedDeposits || 0);
    }
    
    // Add other investments
    if (assets.investments?.others) {
      total += assets.investments.others.totalValue || 0;
    }
    
    return Math.max(0, total);
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