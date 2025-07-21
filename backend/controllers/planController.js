const FinancialPlan = require('../models/FinancialPlan');
const Client = require('../models/Client');
const { logger } = require('../utils/logger');
const claudeAiService = require('../services/claudeAiService');

// Enhanced JSON parsing for AI responses
function parseAIResponse(content) {
  // Strategy 1: Try direct JSON parsing
  try {
    return JSON.parse(content);
  } catch (error1) {
    // Strategy 2: Extract JSON from markdown code blocks
    const jsonBlockMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch (error2) {
        // Continue to next strategy
      }
    }
    
    // Strategy 3: Extract JSON from any code blocks
    const codeBlockMatch = content.match(/```\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (error3) {
        // Continue to next strategy
      }
    }
    
    // Strategy 4: Find JSON object in mixed content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error4) {
        // Continue to next strategy
      }
    }
    
    // Strategy 5: Clean up common formatting issues
    let cleanedContent = content
      .replace(/^\s*[\w\s]*?(\{)/m, '$1') // Remove text before first {
      .replace(/(\})\s*[\w\s]*?$/m, '$1') // Remove text after last }
      .replace(/\n\s*Note:.*$/ms, '') // Remove trailing notes
      .replace(/([^\\])"([^"]*?)"/g, '$1"$2"') // Fix unescaped quotes
      .trim();
    
    try {
      return JSON.parse(cleanedContent);
    } catch (error5) {
      // All strategies failed, throw the original error
      throw new Error(`All JSON parsing strategies failed. Original content length: ${content.length}, Last error: ${error5.message}`);
    }
  }
}

// Create a new financial plan
exports.createPlan = async (req, res) => {
  try {
    const { clientId, planType } = req.body;
    const advisorId = req.advisor.id;

    // Verify client exists and belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // For testing: Allow plan creation with default values if data is missing
    if (!client.totalMonthlyIncome || client.totalMonthlyIncome <= 0) {
      logger.warn(`Creating plan with default income for client ${clientId}`);
      client.totalMonthlyIncome = 50000; // Default income for testing
    }

    if (client.totalMonthlyExpenses === undefined || client.totalMonthlyExpenses === null) {
      logger.warn(`Creating plan with default expenses for client ${clientId}`);
      client.totalMonthlyExpenses = 30000; // Default expenses for testing
    }

    // Create new plan
    const newPlan = new FinancialPlan({
      clientId,
      advisorId,
      planType: planType || 'cash_flow',
      status: 'draft'
    });

    // Create client data snapshot
    await newPlan.createSnapshot(client);

    // Initialize plan details based on type
    if (planType === 'cash_flow' || !planType) {
      newPlan.planDetails.cashFlowPlan = initializeCashFlowPlan(client);
    }

    // Set initial review schedule
    newPlan.reviewSchedule.nextReviewDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    await newPlan.save();

    logger.info(`Financial plan created for client ${clientId} by advisor ${advisorId}`);
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    logger.error('Error creating financial plan:', error);
    res.status(500).json({ error: 'Failed to create financial plan' });
  }
};

// Get a specific plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId })
      .populate('clientId', 'firstName lastName email')
      .populate('advisorId', 'name email');

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ success: true, plan });
  } catch (error) {
    logger.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
};

// Update a plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;
    const updates = req.body;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Add to change history
    if (updates.planDetails) {
      plan.addChangeHistory({
        userId: advisorId,
        type: 'plan_update',
        description: 'Plan details updated',
        previousValue: plan.planDetails,
        newValue: updates.planDetails
      });
    }

    // Update plan fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'clientId' && key !== 'advisorId') {
        plan[key] = updates[key];
      }
    });

    await plan.save();

    logger.info(`Financial plan ${planId} updated by advisor ${advisorId}`);
    res.json({ success: true, plan });
  } catch (error) {
    logger.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

// Archive a plan
exports.archivePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    plan.status = 'archived';
    plan.addChangeHistory({
      userId: advisorId,
      type: 'status_change',
      description: 'Plan archived',
      previousValue: plan.status,
      newValue: 'archived'
    });

    await plan.save();

    logger.info(`Financial plan ${planId} archived by advisor ${advisorId}`);
    res.json({ success: true, message: 'Plan archived successfully' });
  } catch (error) {
    logger.error('Error archiving plan:', error);
    res.status(500).json({ error: 'Failed to archive plan' });
  }
};

// Get all plans for a client
exports.getClientPlans = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    // Verify client belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const plans = await FinancialPlan.find({ clientId, advisorId })
      .sort({ createdAt: -1 })
      .select('planType status version createdAt updatedAt reviewSchedule performanceMetrics');

    res.json({ success: true, plans });
  } catch (error) {
    logger.error('Error fetching client plans:', error);
    res.status(500).json({ error: 'Failed to fetch client plans' });
  }
};

// Get all plans for the current advisor
exports.getAdvisorPlans = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { status, planType } = req.query;

    const query = { advisorId };
    if (status) query.status = status;
    if (planType) query.planType = planType;

    const plans = await FinancialPlan.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .select('clientId planType status version createdAt updatedAt reviewSchedule');

    res.json({ success: true, plans });
  } catch (error) {
    logger.error('Error fetching advisor plans:', error);
    res.status(500).json({ error: 'Failed to fetch advisor plans' });
  }
};

// Update plan status
exports.updatePlanStatus = async (req, res) => {
  try {
    const { planId } = req.params;
    const { status } = req.body;
    const advisorId = req.advisor.id;

    if (!['draft', 'active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const previousStatus = plan.status;
    plan.status = status;
    plan.addChangeHistory({
      userId: advisorId,
      type: 'status_change',
      description: `Status changed from ${previousStatus} to ${status}`,
      previousValue: previousStatus,
      newValue: status
    });

    await plan.save();

    logger.info(`Plan ${planId} status updated to ${status}`);
    res.json({ success: true, plan });
  } catch (error) {
    logger.error('Error updating plan status:', error);
    res.status(500).json({ error: 'Failed to update plan status' });
  }
};

// Add review note
exports.addReviewNote = async (req, res) => {
  try {
    const { planId } = req.params;
    const { notes, adjustmentsMade } = req.body;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    plan.reviewSchedule.reviewHistory.push({
      reviewDate: new Date(),
      reviewedBy: advisorId,
      notes,
      adjustmentsMade: adjustmentsMade || []
    });

    // Update next review date
    const frequencyDays = {
      'monthly': 30,
      'quarterly': 90,
      'semi-annually': 180,
      'annually': 365
    };
    const days = frequencyDays[plan.reviewSchedule.frequency] || 90;
    plan.reviewSchedule.nextReviewDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await plan.save();

    logger.info(`Review note added to plan ${planId}`);
    res.json({ success: true, plan });
  } catch (error) {
    logger.error('Error adding review note:', error);
    res.status(500).json({ error: 'Failed to add review note' });
  }
};

// Generate AI recommendations
exports.generateAIRecommendations = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Generate AI recommendations based on plan data
    const aiRecommendations = generateAIRecommendationsForPlan(plan);
    plan.aiRecommendations = aiRecommendations;

    await plan.save();

    logger.info(`AI recommendations generated for plan ${planId}`);
    res.json({ success: true, aiRecommendations });
  } catch (error) {
    logger.error('Error generating AI recommendations:', error);
    res.status(500).json({ error: 'Failed to generate AI recommendations' });
  }
};

// Get performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Update performance metrics
    plan.updatePerformanceMetrics();
    await plan.save();

    res.json({ 
      success: true, 
      performanceMetrics: plan.performanceMetrics,
      planAge: plan.planAge,
      isReviewDue: plan.isReviewDue
    });
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
};

// Clone a plan
exports.clonePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { targetClientId } = req.body;
    const advisorId = req.advisor.id;

    const originalPlan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!originalPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify target client if provided
    const clientId = targetClientId || originalPlan.clientId;
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({ error: 'Target client not found' });
    }

    // Create cloned plan
    const clonedPlan = new FinancialPlan({
      clientId,
      advisorId,
      planType: originalPlan.planType,
      status: 'draft',
      planDetails: originalPlan.planDetails,
      advisorRecommendations: originalPlan.advisorRecommendations
    });

    // Create fresh snapshot for the target client
    await clonedPlan.createSnapshot(client);

    await clonedPlan.save();

    logger.info(`Plan ${planId} cloned for client ${clientId}`);
    res.status(201).json({ success: true, plan: clonedPlan });
  } catch (error) {
    logger.error('Error cloning plan:', error);
    res.status(500).json({ error: 'Failed to clone plan' });
  }
};

// Export plan as PDF (placeholder - implement with PDF library)
exports.exportPlanAsPDF = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId })
      .populate('clientId')
      .populate('advisorId');

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // TODO: Implement PDF generation
    // For now, return a message
    res.json({ 
      success: true, 
      message: 'PDF export functionality to be implemented',
      planId: plan._id
    });
  } catch (error) {
    logger.error('Error exporting plan as PDF:', error);
    res.status(500).json({ error: 'Failed to export plan' });
  }
};

// Helper function to initialize cash flow plan
function initializeCashFlowPlan(client) {
  if (!client) {
    console.error('No client data provided to initializeCashFlowPlan');
    return getDefaultCashFlowPlan();
  }

  try {
    const monthlyIncome = Math.max(0, parseFloat(client.totalMonthlyIncome) || 0);
    const monthlyExpenses = Math.max(0, parseFloat(client.totalMonthlyExpenses) || 0);
    const totalEMIs = calculateTotalEMIs(client.debtsAndLiabilities);
    const monthlySurplus = monthlyIncome - monthlyExpenses - totalEMIs;
    
    // Calculate emergency fund details
    const emergencyFundTarget = Math.max(monthlyExpenses * 6, 50000); // Minimum ₹50k
    const emergencyFundCurrent = Math.max(0, parseFloat(client.assets?.cashBankSavings) || 0);
    const emergencyFundGap = Math.max(0, emergencyFundTarget - emergencyFundCurrent);
    const emergencyFundAllocation = Math.max(5000, Math.min(monthlySurplus * 0.3, emergencyFundTarget / 12));
    const emergencyFundTimeline = emergencyFundGap > 0 && emergencyFundAllocation > 0 ? 
      Math.ceil(emergencyFundGap / emergencyFundAllocation) : 0;

    return {
      debtManagement: {
        prioritizedDebts: prioritizeDebts(client.debtsAndLiabilities),
        totalDebtReduction: 0,
        totalInterestSavings: 0,
        debtFreeDate: null
      },
      emergencyFundStrategy: {
        targetAmount: emergencyFundTarget,
        currentAmount: emergencyFundCurrent,
        gap: emergencyFundGap,
        monthlyAllocation: emergencyFundAllocation,
        timeline: emergencyFundTimeline,
        investmentType: 'Liquid Fund',
        fundRecommendations: ['HDFC Liquid Fund', 'ICICI Prudential Liquid Fund', 'Axis Liquid Fund']
      },
      investmentRecommendations: {
        monthlyInvestments: [],
        oneTimeInvestments: [],
        assetAllocation: {
          equity: 70,
          debt: 30,
          gold: 0,
          others: 0
        },
        totalMonthlyInvestment: 0,
        projectedCorpus: {
          year1: 0,
          year3: 0,
          year5: 0,
          year10: 0
        }
      },
      cashFlowMetrics: {
        currentEmiRatio: monthlyIncome > 0 ? Math.round((totalEMIs / monthlyIncome) * 100 * 10) / 10 : 0,
        targetEmiRatio: 40,
        currentSavingsRate: monthlyIncome > 0 ? Math.round((monthlySurplus / monthlyIncome) * 100 * 10) / 10 : 0,
        targetSavingsRate: 20,
        currentFixedExpenditureRatio: monthlyIncome > 0 ? Math.round(((monthlyExpenses + totalEMIs) / monthlyIncome) * 100 * 10) / 10 : 0,
        targetFixedExpenditureRatio: 50,
        financialHealthScore: calculateFinancialHealthScore(client)
      },
      actionItems: generateInitialActionItems(client, monthlySurplus, totalEMIs, monthlyIncome)
    };
  } catch (error) {
    console.error('Error initializing cash flow plan:', error);
    return getDefaultCashFlowPlan();
  }
}

// Helper function to get default cash flow plan structure
function getDefaultCashFlowPlan() {
  return {
    debtManagement: {
      prioritizedDebts: [],
      totalDebtReduction: 0,
      totalInterestSavings: 0,
      debtFreeDate: null
    },
    emergencyFundStrategy: {
      targetAmount: 300000,
      currentAmount: 0,
      gap: 300000,
      monthlyAllocation: 10000,
      timeline: 30,
      investmentType: 'Liquid Fund',
      fundRecommendations: ['HDFC Liquid Fund', 'ICICI Prudential Liquid Fund']
    },
    investmentRecommendations: {
      monthlyInvestments: [],
      oneTimeInvestments: [],
      assetAllocation: {
        equity: 70,
        debt: 30,
        gold: 0,
        others: 0
      },
      totalMonthlyInvestment: 0,
      projectedCorpus: {
        year1: 0,
        year3: 0,
        year5: 0,
        year10: 0
      }
    },
    cashFlowMetrics: {
      currentEmiRatio: 0,
      targetEmiRatio: 40,
      currentSavingsRate: 0,
      targetSavingsRate: 20,
      currentFixedExpenditureRatio: 0,
      targetFixedExpenditureRatio: 50,
      financialHealthScore: 0
    },
    actionItems: []
  };
}

// Helper function to generate initial action items
function generateInitialActionItems(client, monthlySurplus, totalEMIs, monthlyIncome) {
  const actionItems = [];
  
  if (totalEMIs / monthlyIncome > 0.4) {
    actionItems.push({
      action: 'Reduce EMI ratio to below 40%',
      priority: 'high',
      timeline: '0-3 months',
      status: 'pending'
    });
  }
  
  if (monthlySurplus <= 0) {
    actionItems.push({
      action: 'Review and optimize monthly expenses',
      priority: 'high',
      timeline: '0-1 month',
      status: 'pending'
    });
  }
  
  if (!client.assets?.cashBankSavings || client.assets.cashBankSavings < 50000) {
    actionItems.push({
      action: 'Build emergency fund',
      priority: 'high',
      timeline: '0-12 months',
      status: 'pending'
    });
  }
  
  return actionItems;
}

// Helper function to calculate total EMIs
function calculateTotalEMIs(debts) {
  if (!debts || typeof debts !== 'object') {
    return 0;
  }
  
  let total = 0;
  const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
  
  debtTypes.forEach(type => {
    const debt = debts[type];
    if (debt && (debt.hasLoan || debt.hasDebt)) {
      const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
      if (emi > 0) {
        total += emi;
      }
    }
  });
  
  return Math.max(0, total);
}

// Helper function to prioritize debts
function prioritizeDebts(debts) {
  if (!debts) return [];
  
  const debtList = [];
  const debtTypes = {
    'creditCards': 'Credit Card',
    'personalLoan': 'Personal Loan',
    'businessLoan': 'Business Loan',
    'carLoan': 'Car Loan',
    'educationLoan': 'Education Loan',
    'goldLoan': 'Gold Loan',
    'homeLoan': 'Home Loan',
    'otherLoans': 'Other Loans'
  };

  Object.entries(debtTypes).forEach(([key, name]) => {
    const debt = debts[key];
    if (debt && (debt.hasLoan || debt.hasDebt) && debt.outstandingAmount > 0) {
      debtList.push({
        debtType: name,
        outstandingAmount: debt.outstandingAmount || debt.totalOutstanding || 0,
        currentEMI: debt.monthlyEMI || debt.monthlyPayment || 0,
        recommendedEMI: debt.monthlyEMI || debt.monthlyPayment || 0,
        interestRate: debt.interestRate || debt.averageInterestRate || 0,
        priorityRank: 0,
        reason: '',
        projectedSavings: 0,
        revisedTenure: debt.remainingTenure || 0
      });
    }
  });

  // Sort by interest rate (highest first)
  debtList.sort((a, b) => b.interestRate - a.interestRate);

  // Assign priority ranks and reasons
  debtList.forEach((debt, index) => {
    debt.priorityRank = index + 1;
    if (debt.interestRate >= 15) {
      debt.reason = 'High interest rate - Priority repayment';
    } else if (debt.interestRate >= 10) {
      debt.reason = 'Moderate interest rate - Standard repayment';
    } else {
      debt.reason = 'Low interest rate - Maintain minimum payment';
    }
  });

  return debtList;
}

// Helper function to calculate financial health score
function calculateFinancialHealthScore(client) {
  let score = 0;
  const maxScore = 10;

  // Income stability (2 points)
  if (client.totalMonthlyIncome > 0) score += 2;

  // Expense management (2 points)
  const expenseRatio = client.totalMonthlyExpenses / client.totalMonthlyIncome;
  if (expenseRatio < 0.5) score += 2;
  else if (expenseRatio < 0.7) score += 1;

  // Debt management (3 points)
  const totalEMIs = calculateTotalEMIs(client.debtsAndLiabilities);
  const emiRatio = totalEMIs / client.totalMonthlyIncome;
  if (emiRatio === 0) score += 3;
  else if (emiRatio < 0.3) score += 2;
  else if (emiRatio < 0.4) score += 1;

  // Savings (2 points)
  const savingsRate = (client.totalMonthlyIncome - client.totalMonthlyExpenses - totalEMIs) / client.totalMonthlyIncome;
  if (savingsRate > 0.2) score += 2;
  else if (savingsRate > 0.1) score += 1;

  // Emergency fund (1 point)
  if (client.assets && client.assets.cashBankSavings >= client.totalMonthlyExpenses * 3) score += 1;

  return Math.min(score, maxScore);
}

// Helper function to generate AI recommendations
function generateAIRecommendationsForPlan(plan) {
  const snapshot = plan.clientDataSnapshot;
  const cashFlowPlan = plan.planDetails.cashFlowPlan;

  const recommendations = {
    debtStrategy: '',
    emergencyFundAnalysis: '',
    investmentAnalysis: '',
    cashFlowOptimization: '',
    riskWarnings: [],
    opportunities: []
  };

  // Debt strategy
  if (cashFlowPlan.debtManagement.prioritizedDebts.length > 0) {
    const highInterestDebts = cashFlowPlan.debtManagement.prioritizedDebts.filter(d => d.interestRate > 15);
    if (highInterestDebts.length > 0) {
      recommendations.debtStrategy = `Focus on clearing high-interest debts first. ${highInterestDebts[0].debtType} at ${highInterestDebts[0].interestRate}% should be prioritized. Consider increasing EMI by 50% to save on interest.`;
    } else {
      recommendations.debtStrategy = 'Current debt portfolio is manageable. Maintain regular EMI payments and consider occasional prepayments.';
    }
  }

  // Emergency fund analysis
  const emergencyGap = cashFlowPlan.emergencyFundStrategy.gap;
  if (emergencyGap > 0) {
    recommendations.emergencyFundAnalysis = `Emergency fund gap of ₹${emergencyGap.toLocaleString('en-IN')}. Allocate ₹${cashFlowPlan.emergencyFundStrategy.monthlyAllocation.toLocaleString('en-IN')} monthly to build fund in ${cashFlowPlan.emergencyFundStrategy.timeline} months.`;
  }

  // Investment analysis
  if (snapshot.calculatedMetrics.monthlySurplus > 0) {
    recommendations.investmentAnalysis = `Monthly surplus of ₹${snapshot.calculatedMetrics.monthlySurplus.toLocaleString('en-IN')} available. Recommend ${cashFlowPlan.investmentRecommendations.assetAllocation.equity}% equity and ${cashFlowPlan.investmentRecommendations.assetAllocation.debt}% debt allocation based on risk profile.`;
  }

  // Cash flow optimization
  if (snapshot.calculatedMetrics.fixedExpenditureRatio > 50) {
    recommendations.cashFlowOptimization = 'Fixed expenditure ratio exceeds 50%. Review monthly expenses and explore income enhancement opportunities.';
    recommendations.riskWarnings.push('High fixed expenditure ratio limits financial flexibility');
  }

  // Risk warnings
  if (snapshot.calculatedMetrics.emiRatio > 40) {
    recommendations.riskWarnings.push('EMI ratio exceeds safe limit of 40%');
  }
  if (!snapshot.investments || Object.values(snapshot.investments).every(v => !v || v.totalValue === 0)) {
    recommendations.riskWarnings.push('No existing investments detected');
  }

  // Opportunities
  if (snapshot.calculatedMetrics.savingsRate > 20) {
    recommendations.opportunities.push('High savings rate allows for aggressive wealth building');
  }
  if (snapshot.financialInfo.incomeType === 'Salaried') {
    recommendations.opportunities.push('Explore tax-saving investment options under Section 80C');
  }

  return recommendations;
}

// AI-powered debt analysis
exports.analyzeDebt = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;
    const clientData = req.body.clientData || await Client.findOne({ _id: clientId, advisor: advisorId });

    if (!clientData) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    logger.info(`Analyzing debt strategy for client ${clientId} using Claude AI`);

    // Get AI analysis using Claude
    const aiResponse = await claudeAiService.analyzeDebtStrategy(clientData);
    
    if (!aiResponse.success) {
      logger.error('Claude AI debt analysis failed', { error: aiResponse.error });
      return res.status(500).json({ 
        success: false, 
        error: 'AI analysis service unavailable: ' + aiResponse.error 
      });
    }

    // Parse AI response with enhanced robustness
    let analysisData;
    try {
      analysisData = parseAIResponse(aiResponse.content);
    } catch (parseError) {
      logger.error('Failed to parse AI response after all attempts', { 
        content: aiResponse.content,
        error: parseError.message 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI analysis' 
      });
    }

    // Add metadata
    const analysis = {
      ...analysisData,
      generatedAt: new Date(),
      generatedBy: 'claude-ai',
      clientId,
      advisorId
    };

    logger.info(`Debt analysis completed for client ${clientId}`, {
      debtsAnalyzed: analysis.debtStrategy?.prioritizedDebts?.length || 0,
      totalSavings: analysis.financialMetrics?.totalInterestSavings || 0
    });

    res.json({ 
      success: true, 
      analysis,
      aiUsage: aiResponse.usage 
    });

  } catch (error) {
    logger.error('Error in debt analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze debt strategy' 
    });
  }
};

// Update debt strategy with advisor modifications
exports.updateDebtStrategy = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;
    const { debtStrategy, aiAnalysis, advisorNotes } = req.body;

    // Find the plan
    const plan = await FinancialPlan.findOne({ _id: planId, advisorId });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Update debt management section in cash flow plan
    if (!plan.planDetails.cashFlowPlan) {
      plan.planDetails.cashFlowPlan = {};
    }
    
    if (!plan.planDetails.cashFlowPlan.debtManagement) {
      plan.planDetails.cashFlowPlan.debtManagement = {};
    }

    // Store the debt strategy
    plan.planDetails.cashFlowPlan.debtManagement = {
      prioritizedDebts: debtStrategy.prioritizedDebts,
      overallStrategy: debtStrategy.overallStrategy,
      totalDebtReduction: aiAnalysis.financialMetrics?.totalInterestSavings || 0,
      totalInterestSavings: aiAnalysis.financialMetrics?.totalInterestSavings || 0,
      debtFreeDate: aiAnalysis.financialMetrics?.debtFreeTimeline || null,
      advisorModifications: true,
      lastModified: new Date()
    };

    // Store AI recommendations for reference
    plan.aiRecommendations.debtStrategy = aiAnalysis.debtStrategy?.overallStrategy || '';
    plan.advisorRecommendations.detailedNotes = advisorNotes || '';

    // Add to change history
    plan.addChangeHistory({
      userId: advisorId,
      type: 'debt_strategy_update',
      description: 'Updated debt management strategy with advisor modifications',
      previousValue: null,
      newValue: {
        debtsCount: debtStrategy.prioritizedDebts.length,
        totalSavings: aiAnalysis.financialMetrics?.totalInterestSavings
      }
    });

    await plan.save();

    logger.info(`Debt strategy updated for plan ${planId} by advisor ${advisorId}`);

    res.json({ 
      success: true, 
      plan: plan.toJSON(),
      message: 'Debt strategy updated successfully'
    });

  } catch (error) {
    logger.error('Error updating debt strategy:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update debt strategy' 
    });
  }
};

// Get debt recommendations for a plan
exports.getDebtRecommendations = async (req, res) => {
  try {
    const { planId } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findOne({ _id: planId, advisorId })
      .populate('clientId', 'firstName lastName totalMonthlyIncome');
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const debtManagement = plan.planDetails.cashFlowPlan?.debtManagement;
    
    res.json({ 
      success: true, 
      debtRecommendations: debtManagement,
      clientInfo: plan.clientId,
      lastModified: debtManagement?.lastModified
    });

  } catch (error) {
    logger.error('Error getting debt recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get debt recommendations' 
    });
  }
};

// Test Claude AI service configuration
exports.testAIService = async (req, res) => {
  try {
    console.log('🧪 [PlanController] Testing Claude AI service configuration...');
    
    const validation = claudeAiService.validateConfiguration();
    
    if (!validation.isValid) {
      console.error('❌ [PlanController] AI service configuration invalid:', validation.issues);
      return res.status(500).json({
        success: false,
        error: 'AI service configuration invalid',
        issues: validation.issues
      });
    }
    
    // Test with dummy client data
    const testClientData = {
      firstName: 'Test',
      lastName: 'Client',
      totalMonthlyIncome: 75000,
      totalMonthlyExpenses: 45000,
      debtsAndLiabilities: {
        personalLoan: {
          hasLoan: true,
          outstandingAmount: 200000,
          monthlyEMI: 7000,
          interestRate: 14
        },
        homeLoan: {
          hasLoan: true,
          outstandingAmount: 2500000,
          monthlyEMI: 20000,
          interestRate: 8.5
        }
      }
    };
    
    console.log('🤖 [PlanController] Testing AI analysis with sample data...');
    const aiResponse = await claudeAiService.analyzeDebtStrategy(testClientData);
    
    console.log('✅ [PlanController] AI service test result:', {
      success: aiResponse.success,
      hasContent: !!aiResponse.content,
      error: aiResponse.error
    });
    
    res.json({
      success: true,
      configurationValid: validation.isValid,
      aiServiceWorking: aiResponse.success,
      testResponse: aiResponse.success ? 'AI service responding correctly' : aiResponse.error
    });
    
  } catch (error) {
    console.error('💥 [PlanController] AI service test failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI service test failed: ' + error.message
    });
  }
};

module.exports = exports;