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
   * Analyze financial goals for goal-based planning
   */
  async analyzeGoals(selectedGoals, clientData) {
    console.log('🎯 [ClaudeAI] Starting goal analysis:', {
      hasClientData: !!clientData,
      clientId: clientData._id || clientData.id || 'unknown',
      selectedGoalsCount: selectedGoals?.length || 0,
      goalTypes: selectedGoals?.map(g => g.type || g.title) || []
    });

    const systemPrompt = this.loadPrompt('goal-analysis.md');
    if (!systemPrompt) {
      console.log('❌ [ClaudeAI] Goal analysis prompt not found');
      throw new Error('Goal analysis prompt not found');
    }

    console.log('📋 [ClaudeAI] System prompt loaded:', {
      promptLength: systemPrompt.length + ' chars',
      hasPrompt: !!systemPrompt
    });

    // Format client and goals data for analysis
    console.log('🔧 [ClaudeAI] Formatting data for goal analysis...');
    const analysisContext = this.formatGoalsForAnalysis(selectedGoals, clientData);
    
    console.log('📊 [ClaudeAI] Analysis context prepared:', {
      contextLength: analysisContext.length + ' chars',
      hasFinancialData: analysisContext.includes('FINANCIAL SUMMARY:'),
      hasGoalsData: analysisContext.includes('SELECTED GOALS:')
    });
    
    const userMessage = `Please analyze these financial goals and provide comprehensive recommendations:

${analysisContext}

Provide detailed analysis including:
1. Individual goal feasibility and SIP requirements
2. Multi-goal optimization strategy
3. Asset allocation recommendations
4. Specific mutual fund suggestions
5. Timeline-based implementation plan
6. Risk assessment and warnings

CRITICAL: Respond with ONLY valid JSON. Start with { and end with }. No explanations, no markdown blocks.`;

    console.log('📝 [ClaudeAI] User message prepared:', {
      messageLength: userMessage.length + ' chars'
    });

    logger.info('Requesting goal analysis from Claude AI', {
      clientId: clientData._id,
      goalsCount: selectedGoals.length
    });

    console.log('📡 [ClaudeAI] Making request to Claude API...');
    const response = await this.makeRequest(systemPrompt, userMessage, 0.3);
    
    console.log('📥 [ClaudeAI] Claude API response received:', {
      success: response.success,
      hasContent: !!response.content,
      contentLength: response.content ? response.content.length + ' chars' : 0,
      error: response.error
    });

    return response;
  }

  /**
   * Format goals and client data for AI analysis with comprehensive financial context
   */
  formatGoalsForAnalysis(selectedGoals, clientData) {
    // Enhanced financial metrics extraction
    const monthlyIncome = clientData.totalMonthlyIncome || 
                         clientData.calculatedFinancials?.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 
                           clientData.calculatedFinancials?.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    
    // Enhanced age calculation
    const currentYear = new Date().getFullYear();
    const age = this.calculateClientAge(clientData.dateOfBirth) || 30;
    
    // Calculate total EMIs with enhanced validation
    let totalEMIs = 0;
    const debts = clientData.debtsAndLiabilities || {};
    const activeDebts = [];
    Object.entries(debts).forEach(([debtType, debt]) => {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || 0;
        const interestRate = parseFloat(debt.interestRate) || 0;
        
        if (emi > 0 || outstanding > 0) {
          totalEMIs += emi;
          activeDebts.push({
            type: debtType,
            emi,
            outstanding,
            interestRate
          });
        }
      }
    });
    
    const availableForInvestment = monthlySurplus - totalEMIs;
    
    // Enhanced existing financial goals context
    const existingGoalsContext = this.formatExistingGoalsContext(clientData.enhancedFinancialGoals);
    
    // Enhanced risk profile analysis
    const riskProfile = this.formatRiskProfileContext(clientData.enhancedRiskProfile);
    
    // Format selected goals with enhanced details
    const goalsFormatted = selectedGoals.map((goal, index) => {
      const years = goal.targetYear ? goal.targetYear - currentYear : 5;
      const requiredSIP = this.estimateRequiredSIP(goal.targetAmount, years);
      const source = goal.source || 'new_selection';
      
      return `
📌 GOAL ${index + 1}: ${goal.title || goal.goalName}
   • Target Amount: ₹${(goal.targetAmount || 0).toLocaleString('en-IN')}
   • Target Year: ${goal.targetYear || currentYear + 5} (${years} years)
   • Priority: ${goal.priority || 'Medium'}
   • Data Source: ${source === 'client_data' ? 'From Client Profile' : source === 'intelligent_default' ? 'AI Suggested' : 'New Selection'}
   • Estimated Monthly SIP: ₹${requiredSIP.toLocaleString('en-IN')}
   ${goal.description ? `• Description: ${goal.description}` : ''}
   ${goal.hasData ? `• Has Existing Data: Yes` : ''}`;
    }).join('\n');

    // Calculate total SIP requirement
    const totalRequiredSIP = selectedGoals.reduce((sum, goal) => {
      const years = goal.targetYear ? goal.targetYear - currentYear : 5;
      return sum + this.estimateRequiredSIP(goal.targetAmount, years);
    }, 0);

    return `
COMPREHENSIVE CLIENT PROFILE FOR GOAL-BASED PLANNING:

==== PERSONAL INFORMATION ====
- Full Name: ${clientData.firstName || ''} ${clientData.lastName || ''}
- Age: ${age} years
- Date of Birth: ${clientData.dateOfBirth || 'Not specified'}
- Number of Dependents: ${clientData.numberOfDependents || 0}
- Income Type: ${clientData.incomeType || clientData.occupation || 'Not specified'}
- Marital Status: ${clientData.personalDetails?.maritalStatus || 'Not specified'}
- Location: ${clientData.personalDetails?.city || 'Not specified'}

==== INCOME & CASH FLOW ANALYSIS ====
- Gross Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Total Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus (before EMIs): ₹${monthlySurplus.toLocaleString('en-IN')}
- Monthly Debt EMIs: ₹${totalEMIs.toLocaleString('en-IN')}
- Net Available for Investment: ₹${availableForInvestment.toLocaleString('en-IN')}
- Savings Rate: ${monthlyIncome > 0 ? ((availableForInvestment / monthlyIncome) * 100).toFixed(1) : 0}%
- EMI to Income Ratio: ${monthlyIncome > 0 ? ((totalEMIs / monthlyIncome) * 100).toFixed(1) : 0}%

==== DEBT PORTFOLIO ====
${activeDebts.length > 0 ? activeDebts.map(debt => `- ${debt.type}: EMI ₹${debt.emi.toLocaleString('en-IN')}, Outstanding ₹${debt.outstanding.toLocaleString('en-IN')}, Rate ${debt.interestRate}%`).join('\n') : '- No active debts (Excellent position for goal planning)'}

==== CURRENT ASSET PORTFOLIO ====
- Cash & Bank Savings: ₹${(clientData.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Equity Investments:
  • Mutual Funds: ₹${(clientData.assets?.investments?.equity?.mutualFunds || 0).toLocaleString('en-IN')}
  • Direct Stocks: ₹${(clientData.assets?.investments?.equity?.directStocks || 0).toLocaleString('en-IN')}
  • ELSS: ₹${(clientData.assets?.investments?.equity?.elss || 0).toLocaleString('en-IN')}
- Fixed Income Investments:
  • PPF: ₹${(clientData.assets?.investments?.fixedIncome?.ppf || 0).toLocaleString('en-IN')}
  • EPF: ₹${(clientData.assets?.investments?.fixedIncome?.epf || 0).toLocaleString('en-IN')}
  • NPS: ₹${(clientData.assets?.investments?.fixedIncome?.nps || 0).toLocaleString('en-IN')}
  • Fixed Deposits: ₹${(clientData.assets?.investments?.fixedIncome?.fixedDeposits || 0).toLocaleString('en-IN')}
- Total Investment Portfolio: ₹${this.calculateTotalInvestments(clientData.assets).toLocaleString('en-IN')}
- Emergency Fund Coverage: ${this.calculateEmergencyFundCoverage(clientData.assets?.cashBankSavings, monthlyExpenses)} months

==== RISK PROFILE & INVESTMENT EXPERIENCE ====
${riskProfile}

==== EXISTING FINANCIAL GOALS CONTEXT ====
${existingGoalsContext}

==== SELECTED GOALS FOR ANALYSIS (${selectedGoals.length} goals) ====
${goalsFormatted}

==== GOAL PLANNING FEASIBILITY ANALYSIS ====
- Total Monthly SIP Required: ₹${totalRequiredSIP.toLocaleString('en-IN')}
- Available Monthly Surplus: ₹${availableForInvestment.toLocaleString('en-IN')}
- Feasibility Status: ${totalRequiredSIP <= availableForInvestment ? '✅ FULLY ACHIEVABLE' : `⚠️ SHORTFALL OF ₹${(totalRequiredSIP - availableForInvestment).toLocaleString('en-IN')}`}
- Utilization Rate: ${availableForInvestment > 0 ? ((totalRequiredSIP / availableForInvestment) * 100).toFixed(1) : 0}%

==== ANALYSIS REQUIREMENTS ====
Provide comprehensive goal-based financial planning recommendations including:
1. Individual goal analysis with precise SIP calculations using mathematical formulas
2. Multi-goal optimization strategy considering priority and timeline conflicts
3. Age-appropriate asset allocation recommendations for each goal timeline
4. Specific mutual fund recommendations with category and fund names
5. Phase-wise implementation strategy to manage cash flow
6. Tax optimization opportunities (80C, 80CCD, ELSS)
7. Risk assessment and portfolio diversification strategy
8. Alternative scenarios if goals exceed available surplus
9. Milestone tracking and review schedule
10. Emergency fund adequacy assessment

IMPORTANT CONTEXT:
- Client Age: ${age} years (suitable for ${age < 35 ? 'aggressive' : age < 45 ? 'moderate-aggressive' : 'moderate'} investment approach)
- Available Investment Capacity: ₹${availableForInvestment.toLocaleString('en-IN')} per month
- Goal Planning Horizon: ${Math.min(...selectedGoals.map(g => g.targetYear ? g.targetYear - currentYear : 5))} to ${Math.max(...selectedGoals.map(g => g.targetYear ? g.targetYear - currentYear : 5))} years
- Financial Health Score: ${this.calculateFinancialHealthScore(monthlyIncome, monthlyExpenses, totalEMIs, clientData.assets)}/100`;
  }

  /**
   * Calculate retirement-specific assets
   */
  calculateRetirementAssets(assets) {
    if (!assets || typeof assets !== 'object') return 0;
    
    let total = 0;
    if (assets.investments?.fixedIncome) {
      const fixedIncome = assets.investments.fixedIncome;
      total += (fixedIncome.ppf || 0) + (fixedIncome.epf || 0) + (fixedIncome.nps || 0);
    }
    
    return Math.max(0, total);
  }

  /**
   * Calculate client age from date of birth
   */
  calculateClientAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Estimate required monthly SIP for a goal
   */
  estimateRequiredSIP(targetAmount, years, expectedReturn = 12) {
    if (!targetAmount || !years || years <= 0) return 0;
    
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    
    if (monthlyRate === 0) {
      return Math.round(targetAmount / months);
    }
    
    const sip = targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(sip);
  }

  /**
   * Format existing financial goals context for AI analysis
   */
  formatExistingGoalsContext(enhancedFinancialGoals) {
    if (!enhancedFinancialGoals) {
      return 'No existing financial goals data available from client onboarding.';
    }

    let context = 'Client\'s Original Financial Goals from Onboarding:\n';
    
    // Emergency Fund
    if (enhancedFinancialGoals.emergencyFund?.targetAmount) {
      context += `- Emergency Fund: Target ₹${enhancedFinancialGoals.emergencyFund.targetAmount.toLocaleString('en-IN')}\n`;
    }
    
    // Child Education
    if (enhancedFinancialGoals.childEducation?.isApplicable) {
      const details = enhancedFinancialGoals.childEducation.details || {};
      context += `- Child Education: ${details.targetAmount ? `₹${details.targetAmount.toLocaleString('en-IN')} by ${details.targetYear}` : 'Applicable but amount not specified'}\n`;
    }
    
    // Home Purchase
    if (enhancedFinancialGoals.homePurchase?.isApplicable) {
      const details = enhancedFinancialGoals.homePurchase.details || {};
      context += `- Home Purchase: ${details.targetAmount ? `₹${details.targetAmount.toLocaleString('en-IN')} by ${details.targetYear}` : 'Applicable but amount not specified'}\n`;
    }
    
    // Marriage of Daughter
    if (enhancedFinancialGoals.marriageOfDaughter?.isApplicable) {
      context += `- Marriage of Daughter: ${enhancedFinancialGoals.marriageOfDaughter.targetAmount ? `₹${enhancedFinancialGoals.marriageOfDaughter.targetAmount.toLocaleString('en-IN')} by ${enhancedFinancialGoals.marriageOfDaughter.targetYear}` : 'Applicable but amount not specified'}\n`;
    }
    
    // Custom Goals
    if (enhancedFinancialGoals.customGoals?.length > 0) {
      enhancedFinancialGoals.customGoals.forEach((goal, index) => {
        context += `- Custom Goal ${index + 1}: ${goal.goalName || 'Unnamed'} - ₹${(goal.targetAmount || 0).toLocaleString('en-IN')} by ${goal.targetYear || 'Not specified'}\n`;
      });
    }
    
    return context;
  }

  /**
   * Format risk profile context for AI analysis
   */
  formatRiskProfileContext(enhancedRiskProfile) {
    if (!enhancedRiskProfile) {
      return '- Risk Tolerance: Not assessed (assuming Moderate)';
    }

    return `- Risk Tolerance: ${enhancedRiskProfile.riskTolerance || 'Not specified'}
- Investment Experience: ${enhancedRiskProfile.investmentExperience || 'Not specified'}
- Investment Horizon: ${enhancedRiskProfile.investmentHorizon || 'Not specified'}
- Market Volatility Comfort: ${enhancedRiskProfile.volatilityComfort || 'Not specified'}
- Previous Investment Types: ${enhancedRiskProfile.previousInvestments?.join(', ') || 'Not specified'}`;
  }

  /**
   * Calculate emergency fund coverage in months
   */
  calculateEmergencyFundCoverage(emergencyFund, monthlyExpenses) {
    if (!emergencyFund || !monthlyExpenses || monthlyExpenses <= 0) return 0;
    return Math.round((emergencyFund / monthlyExpenses) * 10) / 10;
  }

  /**
   * Calculate overall financial health score
   */
  calculateFinancialHealthScore(monthlyIncome, monthlyExpenses, totalEMIs, assets) {
    let score = 0;
    
    // Income to expense ratio (25 points)
    const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) : 1;
    if (expenseRatio < 0.5) score += 25;
    else if (expenseRatio < 0.7) score += 20;
    else if (expenseRatio < 0.8) score += 15;
    else if (expenseRatio < 0.9) score += 10;
    
    // Debt to income ratio (25 points)
    const debtRatio = monthlyIncome > 0 ? (totalEMIs / monthlyIncome) : 0;
    if (debtRatio === 0) score += 25;
    else if (debtRatio < 0.2) score += 20;
    else if (debtRatio < 0.3) score += 15;
    else if (debtRatio < 0.4) score += 10;
    
    // Emergency fund adequacy (25 points)
    const emergencyFund = assets?.cashBankSavings || 0;
    const coverage = this.calculateEmergencyFundCoverage(emergencyFund, monthlyExpenses);
    if (coverage >= 6) score += 25;
    else if (coverage >= 3) score += 15;
    else if (coverage >= 1) score += 10;
    
    // Investment diversification (25 points)
    const totalInvestments = this.calculateTotalInvestments(assets);
    if (totalInvestments > 0) {
      if (totalInvestments > monthlyIncome * 12) score += 25; // More than 1 year income
      else if (totalInvestments > monthlyIncome * 6) score += 20;
      else if (totalInvestments > monthlyIncome * 3) score += 15;
      else score += 10;
    }
    
    return Math.min(score, 100);
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