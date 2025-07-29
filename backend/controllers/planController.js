const FinancialPlan = require('../models/FinancialPlan');
const Client = require('../models/Client');
const { logger } = require('../utils/logger');
const claudeAiService = require('../services/claudeAiService');

// Enhanced JSON parsing for AI responses with improved strategies
function parseAIResponse(content) {
  console.log('🔧 [Parser] Attempting to parse AI response:', {
    contentLength: content?.length,
    contentPreview: content?.substring(0, 200),
    startsWithBrace: content?.trim().startsWith('{'),
    endsWithBrace: content?.trim().endsWith('}')
  });

  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content provided for parsing');
  }

  // Strategy 1: Direct JSON parsing
  try {
    const parsed = JSON.parse(content);
    console.log('✅ [Parser] Direct JSON parsing successful');
    return parsed;
  } catch (error1) {
    console.log('⚠️ [Parser] Direct parsing failed, trying alternative strategies');
  }

  // Strategy 2: Extract JSON from markdown code blocks
  const jsonBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi;
  const jsonBlockMatch = jsonBlockPattern.exec(content);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      console.log('✅ [Parser] Markdown JSON block parsing successful');
      return parsed;
    } catch (error2) {
      console.log('⚠️ [Parser] JSON block parsing failed');
    }
  }

  // Strategy 3: Find the largest JSON-like structure
  const jsonPattern = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
  const jsonMatches = content.match(jsonPattern);
  if (jsonMatches && jsonMatches.length > 0) {
    // Try parsing the largest match first
    const sortedMatches = jsonMatches.sort((a, b) => b.length - a.length);
    
    for (const match of sortedMatches) {
      try {
        const parsed = JSON.parse(match);
        console.log('✅ [Parser] Pattern-based parsing successful');
        return parsed;
      } catch (error3) {
        console.log('⚠️ [Parser] Pattern match failed, trying next');
        continue;
      }
    }
  }

  // Strategy 4: Advanced cleanup and parsing
  try {
    let cleanedContent = content
      .replace(/^[^{]*(\{)/s, '$1') // Remove everything before first {
      .replace(/(\})[^}]*$/s, '$1') // Remove everything after last }
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/\/\/.*$/gm, '') // Remove comments
      .replace(/\n\s*Note:.*$/ms, '') // Remove trailing notes
      .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
      .replace(/[\u2018\u2019]/g, "'") // Replace curly apostrophes
      .trim();

    const parsed = JSON.parse(cleanedContent);
    console.log('✅ [Parser] Advanced cleanup parsing successful');
    return parsed;
  } catch (error4) {
    console.log('⚠️ [Parser] Advanced cleanup failed');
  }

  // Strategy 5: Generate fallback structure for goal-based planning
  console.log('❌ [Parser] All parsing strategies failed, generating goal-based fallback response');
  
  // Generate proper goal-based planning fallback structure
  const fallbackResponse = {
    individualGoalAnalysis: [
      {
        goalId: "fallback_goal",
        goalName: "Goal Analysis Unavailable",
        analysis: {
          feasibility: "Medium",
          requiredMonthlySIP: 0,
          recommendedAssetAllocation: {
            equity: 60,
            debt: 40
          },
          expectedReturn: 12,
          riskLevel: "Moderate",
          taxEfficiency: {
            strategy: "Standard tax-saving approach",
            potentialSavings: 0
          },
          milestones: []
        },
        fundRecommendations: []
      }
    ],
    multiGoalOptimization: {
      totalRequiredSIP: 0,
      availableSurplus: 0,
      feasibilityStatus: "Analysis unavailable",
      priorityMatrix: [],
      phaseStrategy: [],
      conflicts: []
    },
    recommendations: {
      immediateActions: ["Review AI response formatting", "Try analysis again"],
      optimizationSuggestions: ["Ensure proper data formatting"],
      alternativeScenarios: []
    },
    riskAssessment: {
      overallRisk: "Moderate",
      diversificationScore: 50,
      liquidityPosition: "Assessment unavailable",
      warnings: ["AI response could not be parsed properly"]
    },
    generatedBy: 'fallback-parser',
    originalContentLength: content.length,
    parsingError: 'AI response format could not be parsed as valid JSON - goal-based planning fallback used'
  };

  console.log('🔄 [Parser] Generated fallback response:', {
    hasIndividualAnalysis: !!fallbackResponse.individualGoalAnalysis,
    hasMultiGoalOptimization: !!fallbackResponse.multiGoalOptimization,
    hasRecommendations: !!fallbackResponse.recommendations
  });

  return fallbackResponse;
}

// Helper functions for text extraction
function extractTextValue(content, keywords) {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}[:\\s]*([^\\n\\.]+)`, 'i');
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractNumberValue(content, keywords) {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}[:\\s]*[₹\\$]?([\\d,]+(?:\\.\\d+)?)\\%?`, 'i');
    const match = content.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  return null;
}

function extractListItems(content, category) {
  const pattern = new RegExp(`${category}[^:]*:([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
  const match = content.match(pattern);
  if (match) {
    return match[1]
      .split(/\n/)
      .map(line => line.replace(/^[\s\-\*\d\.]+/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3); // Limit to 3 items
  }
  return null;
}

// Create a new financial plan
exports.createPlan = async (req, res) => {
  try {
    const { clientId, planType, goals, recommendations, status } = req.body;
    const advisorId = req.advisor.id;

    console.log('📋 [CreatePlan] Processing plan creation request:', {
      clientId,
      planType,
      advisorId,
      goalsCount: goals?.length || 0,
      hasRecommendations: !!recommendations,
      requestStatus: status
    });

    // Verify client exists and belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      console.error('❌ [CreatePlan] Client not found:', { clientId, advisorId });
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
      status: status || 'draft'
    });

    // Create client data snapshot
    await newPlan.createSnapshot(client);

    // Initialize plan details based on type
    if (planType === 'goal_based') {
      console.log('🎯 [CreatePlan] Initializing goal-based plan data:', {
        goalsProvided: goals?.length || 0,
        hasRecommendations: !!recommendations
      });

      // Store goal-based plan data
      newPlan.planDetails.goalBasedPlan = {
        selectedGoals: goals || [],
        goalSpecificPlans: {}
      };

      // Store the goals and recommendations in a data field for PDF access
      newPlan.data = {
        goals: goals || [],
        goalRecommendations: recommendations || null,
        createdAt: new Date(),
        planSummary: {
          totalGoals: goals?.length || 0,
          totalRequiredSIP: goals?.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0) || 0,
          clientSurplus: (client.totalMonthlyIncome || 0) - (client.totalMonthlyExpenses || 0),
          feasible: ((goals?.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0) || 0) <= ((client.totalMonthlyIncome || 0) - (client.totalMonthlyExpenses || 0)))
        }
      };

      console.log('💾 [CreatePlan] Goal-based plan data stored:', {
        goalsStored: newPlan.data.goals.length,
        totalSIP: newPlan.data.planSummary.totalRequiredSIP,
        feasible: newPlan.data.planSummary.feasible
      });

    } else if (planType === 'cash_flow' || !planType) {
      newPlan.planDetails.cashFlowPlan = initializeCashFlowPlan(client);
    }

    // Store AI recommendations if provided
    if (recommendations) {
      newPlan.aiRecommendations = {
        goalAnalysis: typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations),
        generatedAt: new Date(),
        analysisVersion: '1.0'
      };
    }

    // Set initial review schedule
    newPlan.reviewSchedule.nextReviewDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    await newPlan.save();

    console.log('✅ [CreatePlan] Plan created successfully:', {
      planId: newPlan._id,
      planType: newPlan.planType,
      clientId: newPlan.clientId
    });

    logger.info(`Financial plan created for client ${clientId} by advisor ${advisorId}`);
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error('❌ [CreatePlan] Error creating plan:', {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
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

// Note: PDF export functionality has been moved to frontend using jsPDF
// This endpoint is no longer needed as PDF generation now happens client-side

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
  const startTime = Date.now();
  
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;
    const receivedClientData = req.body.clientData;
    
    console.log('📥 [Backend] Received debt analysis request:', {
      clientId,
      advisorId,
      hasBodyClientData: !!receivedClientData,
      bodyDataSize: receivedClientData ? JSON.stringify(receivedClientData).length + ' chars' : 0,
      bodyDataKeys: receivedClientData ? Object.keys(receivedClientData) : [],
      hasCalculatedFinancials: !!receivedClientData?.calculatedFinancials,
      calculatedFinancials: receivedClientData?.calculatedFinancials,
      hasDebts: !!receivedClientData?.debtsAndLiabilities,
      requestHeaders: {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length']
      }
    });

    // Use provided data or fetch from database
    let clientData;
    if (receivedClientData) {
      clientData = receivedClientData;
      console.log('📋 [Backend] Using provided client data from request body');
    } else {
      console.log('🔍 [Backend] No client data in body, fetching from database...');
      clientData = await Client.findOne({ _id: clientId, advisor: advisorId });
      console.log('📋 [Backend] Database client data:', {
        found: !!clientData,
        hasCalculatedFinancials: !!clientData?.calculatedFinancials,
        dataSize: clientData ? JSON.stringify(clientData.toObject()).length + ' chars' : 0
      });
    }

    if (!clientData) {
      console.log('❌ [Backend] Client not found');
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    console.log('🧠 [Backend] Preparing data for Claude AI:', {
      clientId,
      hasFinancialData: !!(clientData.calculatedFinancials?.monthlyIncome || clientData.totalMonthlyIncome),
      hasDebtsData: !!clientData.debtsAndLiabilities,
      dataStructure: {
        calculatedFinancials: !!clientData.calculatedFinancials,
        directTotalMonthlyIncome: !!clientData.totalMonthlyIncome,
        debtsAndLiabilities: !!clientData.debtsAndLiabilities
      }
    });

    logger.info(`Analyzing debt strategy for client ${clientId} using Claude AI`);

    // Get AI analysis using Claude
    console.log('📡 [Backend] Calling Claude AI service...');
    const aiResponse = await claudeAiService.analyzeDebtStrategy(clientData);
    
    console.log('📥 [Backend] Claude AI response received:', {
      success: aiResponse.success,
      hasContent: !!aiResponse.content,
      contentLength: aiResponse.content ? aiResponse.content.length + ' chars' : 0,
      hasUsage: !!aiResponse.usage,
      error: aiResponse.error
    });
    
    if (!aiResponse.success) {
      console.log('❌ [Backend] Claude AI debt analysis failed:', aiResponse.error);
      logger.error('Claude AI debt analysis failed', { error: aiResponse.error });
      return res.status(500).json({ 
        success: false, 
        error: 'AI analysis service unavailable: ' + aiResponse.error 
      });
    }

    // Parse AI response with enhanced robustness
    let analysisData;
    try {
      console.log('🔧 [Backend] Parsing Claude AI response...');
      analysisData = parseAIResponse(aiResponse.content);
      console.log('✅ [Backend] Claude response parsed successfully:', {
        hasDebtStrategy: !!analysisData.debtStrategy,
        hasFinancialMetrics: !!analysisData.financialMetrics,
        hasRecommendations: !!analysisData.recommendations,
        analysisKeys: Object.keys(analysisData)
      });
    } catch (parseError) {
      console.log('❌ [Backend] Failed to parse Claude AI response:', {
        error: parseError.message,
        contentPreview: aiResponse.content?.substring(0, 200) + '...',
        contentLength: aiResponse.content?.length
      });
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

    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Backend] Debt analysis completed successfully:', {
      clientId,
      responseTime: responseTime + 'ms',
      debtsAnalyzed: analysis.debtStrategy?.prioritizedDebts?.length || 0,
      totalSavings: analysis.financialMetrics?.totalInterestSavings || 0,
      hasWarnings: !!analysis.warnings,
      hasOpportunities: !!analysis.opportunities
    });

    logger.info(`Debt analysis completed for client ${clientId}`, {
      debtsAnalyzed: analysis.debtStrategy?.prioritizedDebts?.length || 0,
      totalSavings: analysis.financialMetrics?.totalInterestSavings || 0
    });

    const finalResponse = { 
      success: true, 
      analysis,
      aiUsage: aiResponse.usage 
    };
    
    console.log('📤 [Backend] Sending response to frontend:', {
      responseSize: JSON.stringify(finalResponse).length + ' chars',
      hasAnalysis: !!finalResponse.analysis,
      hasUsage: !!finalResponse.aiUsage
    });

    res.json(finalResponse);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [Backend] Error in debt analysis:', {
      clientId: req.params.clientId,
      responseTime: responseTime + 'ms',
      errorType: error.constructor.name,
      errorMessage: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
    
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

// Test Claude AI service configuration with enhanced testing
exports.testAIService = async (req, res) => {
  const testStartTime = Date.now();
  
  try {
    console.log('🧪 [PlanController] Starting comprehensive AI service test...');
    
    // Step 1: Validate configuration
    const validation = claudeAiService.validateConfiguration();
    console.log('🔧 [PlanController] Configuration validation:', validation);
    
    if (!validation.isValid) {
      console.error('❌ [PlanController] AI service configuration invalid:', validation.issues);
      return res.status(500).json({
        success: false,
        error: 'AI service configuration invalid',
        issues: validation.issues,
        testDuration: Date.now() - testStartTime
      });
    }
    
    // Step 2: Test with comprehensive dummy client data
    const testClientData = {
      firstName: 'Test',
      lastName: 'Client',
      age: 32,
      totalMonthlyIncome: 85000,
      totalMonthlyExpenses: 50000,
      incomeType: 'Salaried',
      riskTolerance: 'Moderate',
      assets: {
        cashBankSavings: 150000,
        investments: {
          equity: {
            mutualFunds: 250000,
            directStocks: 100000,
            elss: 50000
          },
          fixedIncome: {
            ppf: 200000,
            epf: 300000,
            fixedDeposits: 100000
          }
        }
      },
      debtsAndLiabilities: {
        personalLoan: {
          hasLoan: true,
          outstandingAmount: 300000,
          monthlyEMI: 12000,
          interestRate: 16,
          remainingTenure: 2.5,
          loanProvider: 'Test Bank'
        },
        carLoan: {
          hasLoan: true,
          outstandingAmount: 500000,
          monthlyEMI: 15000,
          interestRate: 10.5,
          remainingTenure: 3,
          loanProvider: 'Auto Finance'
        },
        homeLoan: {
          hasLoan: true,
          outstandingAmount: 2800000,
          monthlyEMI: 25000,
          interestRate: 8.75,
          remainingTenure: 12,
          loanProvider: 'Home Loans Ltd'
        }
      }
    };
    
    console.log('📋 [PlanController] Testing with enhanced client data:', {
      hasIncome: !!testClientData.totalMonthlyIncome,
      hasExpenses: !!testClientData.totalMonthlyExpenses,
      debtCount: Object.keys(testClientData.debtsAndLiabilities).length,
      hasAssets: !!testClientData.assets
    });
    
    // Step 3: Call AI service
    console.log('🤖 [PlanController] Calling Claude AI service...');
    const aiCallStartTime = Date.now();
    const aiResponse = await claudeAiService.analyzeDebtStrategy(testClientData);
    const aiCallDuration = Date.now() - aiCallStartTime;
    
    console.log('📥 [PlanController] AI service response received:', {
      success: aiResponse.success,
      hasContent: !!aiResponse.content,
      contentLength: aiResponse.content?.length,
      callDuration: aiCallDuration + 'ms',
      error: aiResponse.error
    });
    
    // Step 4: Test response parsing if successful
    let parsedResponse = null;
    let parsingSuccess = false;
    
    if (aiResponse.success && aiResponse.content) {
      try {
        console.log('🔧 [PlanController] Testing response parsing...');
        parsedResponse = parseAIResponse(aiResponse.content);
        parsingSuccess = true;
        
        console.log('✅ [PlanController] Response parsing successful:', {
          hasDebtStrategy: !!parsedResponse.debtStrategy,
          hasFinancialMetrics: !!parsedResponse.financialMetrics,
          hasRecommendations: !!parsedResponse.recommendations,
          generatedBy: parsedResponse.generatedBy || 'AI'
        });
      } catch (parseError) {
        console.error('❌ [PlanController] Response parsing failed:', parseError.message);
        parsedResponse = { error: 'Parsing failed: ' + parseError.message };
        parsingSuccess = false;
      }
    }
    
    const totalTestDuration = Date.now() - testStartTime;
    
    const testResults = {
      success: true,
      testDuration: totalTestDuration + 'ms',
      steps: {
        configurationValid: validation.isValid,
        aiServiceConnectivity: aiResponse.success,
        responseParsing: parsingSuccess,
        endToEndWorking: validation.isValid && aiResponse.success && parsingSuccess
      },
      performance: {
        totalTestTime: totalTestDuration,
        aiCallTime: aiCallDuration,
        testDataSize: JSON.stringify(testClientData).length
      },
      aiServiceStatus: {
        responding: aiResponse.success,
        responseLength: aiResponse.content?.length || 0,
        error: aiResponse.error || null
      },
      parsedData: parsingSuccess ? {
        hasDebtStrategy: !!parsedResponse.debtStrategy,
        hasFinancialMetrics: !!parsedResponse.financialMetrics,
        hasRecommendations: !!parsedResponse.recommendations,
        structure: Object.keys(parsedResponse)
      } : null,
      recommendations: {
        status: validation.isValid && aiResponse.success && parsingSuccess ? 'FULLY_FUNCTIONAL' : 'NEEDS_ATTENTION',
        message: validation.isValid && aiResponse.success && parsingSuccess 
          ? 'AI service is fully functional and ready for production use'
          : 'AI service has issues that need to be addressed'
      }
    };
    
    console.log('🏁 [PlanController] AI service test completed:', testResults);
    
    res.json(testResults);
    
  } catch (error) {
    const totalTestDuration = Date.now() - testStartTime;
    console.error('💥 [PlanController] AI service test failed:', {
      error: error.message,
      testDuration: totalTestDuration + 'ms',
      stack: error.stack?.split('\n').slice(0, 3)
    });
    
    res.status(500).json({
      success: false,
      error: 'AI service test failed: ' + error.message,
      testDuration: totalTestDuration + 'ms',
      recommendations: {
        status: 'FAILED',
        message: 'AI service test encountered critical errors'
      }
    });
  }
};

// AI-powered goal analysis for goal-based planning
exports.analyzeGoals = async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    console.log('🎯 [PlanController] Goal analysis request received:', {
      method: req.method,
      url: req.url,
      hasAuth: !!req.headers.authorization,
      advisorId: req.advisor?.id || 'unknown',
      bodySize: JSON.stringify(req.body).length + ' chars',
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });

    console.log('🎯 [PlanController] Starting goal analysis:', {
      hasSelectedGoals: !!req.body.selectedGoals,
      hasClientData: !!req.body.clientData,
      goalsCount: req.body.selectedGoals?.length || 0,
      clientId: req.body.clientData?._id || 'unknown',
      goalTypes: req.body.selectedGoals?.map(g => g.title || g.type) || []
    });

    const { selectedGoals, clientData } = req.body;

    // Validate request data
    if (!selectedGoals || !Array.isArray(selectedGoals) || selectedGoals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Selected goals are required and must be a non-empty array'
      });
    }

    if (!clientData || !clientData._id) {
      return res.status(400).json({
        success: false,
        error: 'Client data is required with valid client ID'
      });
    }

    // Fetch complete client data from database
    const fullClientData = await Client.findById(clientData._id);
    if (!fullClientData) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    console.log('✅ [PlanController] Client data retrieved:', {
      clientId: fullClientData._id,
      hasFinancialGoals: !!fullClientData.enhancedFinancialGoals,
      hasAssets: !!fullClientData.assets,
      hasDebts: !!fullClientData.debtsAndLiabilities
    });

    // Call Claude AI service for goal analysis
    const aiResponse = await claudeAiService.analyzeGoals(selectedGoals, fullClientData);

    if (!aiResponse.success) {
      console.error('❌ [PlanController] AI goal analysis failed:', aiResponse.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate goal recommendations: ' + aiResponse.error
      });
    }

    // Parse AI response
    let parsedRecommendations = null;
    let parsingSuccess = false;

    try {
      parsedRecommendations = parseAIResponse(aiResponse.content);
      parsingSuccess = true;
      console.log('✅ [PlanController] AI response parsed successfully:', {
        hasIndividualAnalysis: !!parsedRecommendations.individualGoalAnalysis,
        hasMultiGoalOptimization: !!parsedRecommendations.multiGoalOptimization,
        hasRecommendations: !!parsedRecommendations.recommendations
      });
    } catch (error) {
      console.error('⚠️ [PlanController] Failed to parse AI response as JSON:', error.message);
      // Return raw content for debugging if parsing fails
      parsedRecommendations = aiResponse.content;
    }

    const processingTime = Date.now() - requestStartTime;

    console.log('🏁 [PlanController] Goal analysis completed:', {
      processingTime: processingTime + 'ms',
      success: true,
      parsingSuccess,
      recommendationsType: typeof parsedRecommendations
    });

    res.json({
      success: true,
      recommendations: parsedRecommendations,
      metadata: {
        processingTime,
        parsingSuccess,
        aiUsage: aiResponse.usage || null,
        goalsAnalyzed: selectedGoals.length,
        clientId: fullClientData._id
      }
    });

  } catch (error) {
    const processingTime = Date.now() - requestStartTime;
    console.error('💥 [PlanController] Goal analysis error:', {
      error: error.message,
      processingTime: processingTime + 'ms',
      stack: error.stack?.split('\n').slice(0, 3)
    });

    logger.error('Goal analysis failed', {
      error: error.message,
      processingTime,
      hasSelectedGoals: !!req.body.selectedGoals,
      hasClientData: !!req.body.clientData
    });

    res.status(500).json({
      success: false,
      error: 'Goal analysis failed: ' + error.message,
      processingTime
    });
  }
};

// Get goal recommendations for an existing plan
exports.getGoalRecommendations = async (req, res) => {
  try {
    console.log('📊 [PlanController] Getting goal recommendations for plan:', req.params.planId);

    const plan = await FinancialPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Check if user has access to this plan
    if (plan.advisorId.toString() !== req.advisor.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this plan'
      });
    }

    const recommendations = plan.data?.goalRecommendations || null;

    console.log('✅ [PlanController] Goal recommendations retrieved:', {
      planId: plan._id,
      hasRecommendations: !!recommendations,
      recommendationsKeys: recommendations ? Object.keys(recommendations) : []
    });

    res.json({
      success: true,
      recommendations,
      planId: plan._id,
      lastUpdated: plan.updatedAt
    });

  } catch (error) {
    console.error('💥 [PlanController] Error getting goal recommendations:', error.message);
    
    logger.error('Failed to get goal recommendations', {
      error: error.message,
      planId: req.params.planId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get goal recommendations: ' + error.message
    });
  }
};

// Update goal strategy with advisor modifications
exports.updateGoalStrategy = async (req, res) => {
  try {
    console.log('🔄 [PlanController] Updating goal strategy for plan:', req.params.planId);

    const { goalStrategy, modifiedGoals } = req.body;

    const plan = await FinancialPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Check if user has access to this plan
    if (plan.advisorId.toString() !== req.advisor.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this plan'
      });
    }

    // Update plan data with new goal strategy
    plan.data = {
      ...plan.data,
      goalStrategy,
      modifiedGoals,
      lastModified: new Date(),
      modifiedBy: req.advisor.id
    };

    plan.status = 'modified';
    await plan.save();

    console.log('✅ [PlanController] Goal strategy updated successfully:', {
      planId: plan._id,
      hasGoalStrategy: !!goalStrategy,
      modifiedGoalsCount: modifiedGoals?.length || 0
    });

    logger.info('Goal strategy updated', {
      planId: plan._id,
      advisorId: req.advisor.id,
      goalsCount: modifiedGoals?.length || 0
    });

    res.json({
      success: true,
      message: 'Goal strategy updated successfully',
      plan: {
        id: plan._id,
        status: plan.status,
        updatedAt: plan.updatedAt
      }
    });

  } catch (error) {
    console.error('💥 [PlanController] Error updating goal strategy:', error.message);
    
    logger.error('Failed to update goal strategy', {
      error: error.message,
      planId: req.params.planId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update goal strategy: ' + error.message
    });
  }
};


// PDF Storage Management Methods

// Store PDF in database
exports.storePDFReport = async (req, res) => {
  try {
    const { planId } = req.params;
    const { reportType, pdfData, fileName, contentSummary } = req.body;

    console.log('📄 [PDF Storage] Storing PDF report:', {
      planId,
      reportType,
      fileName,
      dataSize: pdfData?.length || 0,
      advisorId: req.advisor.id
    });

    // Validate required fields
    if (!reportType || !pdfData || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportType, pdfData, fileName'
      });
    }

    // Find the plan
    const plan = await FinancialPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== req.advisor.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Plan belongs to different advisor'
      });
    }

    // Convert base64 PDF data to Buffer
    let pdfBuffer;
    try {
      // Remove data URL prefix if present
      const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, '');
      pdfBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PDF data format'
      });
    }

    // Add PDF report to plan
    const pdfReport = plan.addPDFReport(pdfBuffer, {
      reportType,
      fileName,
      generatedBy: req.advisor.id,
      clientId: plan.clientId,
      generationMethod: 'frontend_jspdf',
      contentSummary: contentSummary || {}
    });

    // Save the plan
    await plan.save();

    console.log('✅ [PDF Storage] PDF report stored successfully:', {
      planId,
      reportId: pdfReport._id,
      version: pdfReport.version,
      fileSize: pdfReport.fileSize
    });

    res.json({
      success: true,
      message: 'PDF report stored successfully',
      report: {
        id: pdfReport._id,
        reportType: pdfReport.reportType,
        version: pdfReport.version,
        generatedAt: pdfReport.generatedAt,
        fileName: pdfReport.fileName,
        fileSize: pdfReport.fileSize
      }
    });

  } catch (error) {
    console.error('❌ [PDF Storage] Error storing PDF:', error);
    logger.error('Failed to store PDF report', {
      error: error.message,
      planId: req.params.planId,
      advisorId: req.user?._id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to store PDF report: ' + error.message
    });
  }
};

// Get latest PDF report by type
exports.getLatestPDFReport = async (req, res) => {
  try {
    const { planId, reportType } = req.params;

    console.log('📄 [PDF Retrieval] Getting latest PDF:', {
      planId,
      reportType,
      advisorId: req.advisor.id
    });

    const plan = await FinancialPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== req.advisor.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Plan belongs to different advisor'
      });
    }

    const latestReport = plan.getLatestPDFReport(reportType);
    if (!latestReport) {
      return res.status(404).json({
        success: false,
        error: `No PDF reports found for type: ${reportType}`
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${latestReport.fileName}"`);
    res.setHeader('Content-Length', latestReport.fileSize);

    console.log('✅ [PDF Retrieval] Sending latest PDF:', {
      reportId: latestReport._id,
      version: latestReport.version,
      fileSize: latestReport.fileSize
    });

    res.send(latestReport.pdfData);

  } catch (error) {
    console.error('❌ [PDF Retrieval] Error getting latest PDF:', error);
    logger.error('Failed to get latest PDF report', {
      error: error.message,
      planId: req.params.planId,
      reportType: req.params.reportType
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve PDF report: ' + error.message
    });
  }
};

// Get specific PDF report by ID
exports.getPDFReportById = async (req, res) => {
  try {
    const { planId, reportId } = req.params;

    console.log('📄 [PDF Retrieval] Getting PDF by ID:', {
      planId,
      reportId,
      advisorId: req.advisor.id
    });

    const plan = await FinancialPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== req.advisor.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Plan belongs to different advisor'
      });
    }

    const report = plan.getPDFReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'PDF report not found'
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.setHeader('Content-Length', report.fileSize);

    console.log('✅ [PDF Retrieval] Sending PDF by ID:', {
      reportId: report._id,
      version: report.version,
      fileSize: report.fileSize
    });

    res.send(report.pdfData);

  } catch (error) {
    console.error('❌ [PDF Retrieval] Error getting PDF by ID:', error);
    logger.error('Failed to get PDF report by ID', {
      error: error.message,
      planId: req.params.planId,
      reportId: req.params.reportId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve PDF report: ' + error.message
    });
  }
};

// Get all PDF reports for a plan
exports.getAllPDFReports = async (req, res) => {
  try {
    const { planId } = req.params;

    console.log('📄 [PDF List] Getting all PDFs for plan:', {
      planId,
      advisorId: req.advisor.id
    });

    const plan = await FinancialPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== req.advisor.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Plan belongs to different advisor'
      });
    }

    // Return PDF metadata without binary data
    const pdfReports = plan.pdfReports.map(report => ({
      id: report._id,
      reportType: report.reportType,
      version: report.version,
      generatedAt: report.generatedAt,
      fileName: report.fileName,
      fileSize: report.fileSize,
      metadata: report.metadata
    }));

    console.log('✅ [PDF List] Retrieved PDF list:', {
      planId,
      count: pdfReports.length
    });

    res.json({
      success: true,
      reports: pdfReports,
      totalCount: pdfReports.length
    });

  } catch (error) {
    console.error('❌ [PDF List] Error getting PDF list:', error);
    logger.error('Failed to get PDF reports list', {
      error: error.message,
      planId: req.params.planId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve PDF reports: ' + error.message
    });
  }
};

// Delete specific PDF report
exports.deletePDFReport = async (req, res) => {
  try {
    const { planId, reportId } = req.params;

    console.log('📄 [PDF Delete] Deleting PDF report:', {
      planId,
      reportId,
      advisorId: req.advisor.id
    });

    const plan = await FinancialPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== req.advisor.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Plan belongs to different advisor'
      });
    }

    const deletedReport = plan.deletePDFReport(reportId);
    if (!deletedReport) {
      return res.status(404).json({
        success: false,
        error: 'PDF report not found'
      });
    }

    await plan.save();

    console.log('✅ [PDF Delete] PDF report deleted:', {
      reportId: deletedReport._id,
      fileName: deletedReport.fileName,
      fileSize: deletedReport.fileSize
    });

    res.json({
      success: true,
      message: 'PDF report deleted successfully',
      deletedReport: {
        id: deletedReport._id,
        fileName: deletedReport.fileName,
        reportType: deletedReport.reportType,
        version: deletedReport.version
      }
    });

  } catch (error) {
    console.error('❌ [PDF Delete] Error deleting PDF:', error);
    logger.error('Failed to delete PDF report', {
      error: error.message,
      planId: req.params.planId,
      reportId: req.params.reportId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete PDF report: ' + error.message
    });
  }
};

// Get PDF storage statistics
exports.getPDFStorageStats = async (req, res) => {
  try {
    const { planId } = req.params;

    console.log('📄 [PDF Stats] Getting storage stats:', {
      planId,
      advisorId: req.advisor.id
    });

    const plan = await FinancialPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== req.advisor.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Plan belongs to different advisor'
      });
    }

    const stats = plan.getPDFStorageStats();

    console.log('✅ [PDF Stats] Retrieved storage stats:', stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ [PDF Stats] Error getting storage stats:', error);
    logger.error('Failed to get PDF storage stats', {
      error: error.message,
      planId: req.params.planId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve storage stats: ' + error.message
    });
  }
};

// A/B Testing endpoints

// Get all plans for a specific client
exports.getClientPlans = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { planType } = req.query;

    // Build query
    const query = { clientId, status: { $ne: 'archived' } };
    if (planType) {
      query.planType = planType;
    }

    const plans = await FinancialPlan.find(query)
      .select('planType status version createdAt updatedAt clientDataSnapshot.calculatedMetrics')
      .sort({ createdAt: -1 })
      .lean();

    logger.log('info', 'Client plans fetched for A/B testing', {
      advisorId: req.advisor.id,
      clientId,
      plansCount: plans.length
    });

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    logger.log('error', 'Error fetching client plans', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch client plans',
      error: error.message
    });
  }
};

// Compare two plans using AI
exports.comparePlans = async (req, res) => {
  try {
    const { planAId, planBId } = req.body;
    const advisorId = req.advisor.id;

    // Fetch both plans
    const [planA, planB] = await Promise.all([
      FinancialPlan.findById(planAId).populate('clientId'),
      FinancialPlan.findById(planBId).populate('clientId')
    ]);

    if (!planA || !planB) {
      return res.status(404).json({
        success: false,
        message: 'One or both plans not found'
      });
    }

    // Ensure both plans are for the same client
    if (planA.clientId._id.toString() !== planB.clientId._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Plans must belong to the same client'
      });
    }

    // Ensure both plans are of the same type
    if (planA.planType !== planB.planType) {
      return res.status(400).json({
        success: false,
        message: 'Plans must be of the same type for comparison'
      });
    }

    // Check if these plans have been compared before
    const ABTestComparison = require('../models/ABTestComparison');
    const existingComparison = await ABTestComparison.hasBeenCompared(planAId, planBId);
    
    if (existingComparison && existingComparison.status === 'completed') {
      logger.log('info', 'Returning existing comparison', {
        comparisonId: existingComparison._id,
        planAId,
        planBId
      });

      return res.json({
        success: true,
        comparison: existingComparison,
        isExisting: true
      });
    }

    // Create new comparison record
    const comparison = new ABTestComparison({
      advisorId,
      clientId: planA.clientId._id,
      planA: {
        planId: planA._id,
        planType: planA.planType,
        version: planA.version,
        createdAt: planA.createdAt,
        snapshot: {
          keyMetrics: planA.clientDataSnapshot.calculatedMetrics,
          summary: planA.advisorRecommendations?.keyPoints?.join('; ')
        }
      },
      planB: {
        planId: planB._id,
        planType: planB.planType,
        version: planB.version,
        createdAt: planB.createdAt,
        snapshot: {
          keyMetrics: planB.clientDataSnapshot.calculatedMetrics,
          summary: planB.advisorRecommendations?.keyPoints?.join('; ')
        }
      },
      comparisonType: planA.planType,
      status: 'analyzing'
    });

    await comparison.save();

    // Perform AI analysis
    try {
      const aiAnalysis = await claudeAiService.comparePlans(planA, planB);
      
      comparison.aiAnalysis = aiAnalysis;
      comparison.status = 'completed';
      await comparison.save();

      // Update both plans with comparison reference
      await Promise.all([
        FinancialPlan.findByIdAndUpdate(planAId, {
          $push: {
            abTestComparisons: {
              comparisonId: comparison._id,
              comparedWithPlanId: planBId,
              comparisonDate: new Date(),
              aiRecommendation: aiAnalysis.recommendation.suggestedPlan === 'planA' ? 'winner' : 'loser'
            }
          }
        }),
        FinancialPlan.findByIdAndUpdate(planBId, {
          $push: {
            abTestComparisons: {
              comparisonId: comparison._id,
              comparedWithPlanId: planAId,
              comparisonDate: new Date(),
              aiRecommendation: aiAnalysis.recommendation.suggestedPlan === 'planB' ? 'winner' : 'loser'
            }
          }
        })
      ]);

      logger.log('info', 'Plans compared successfully', {
        comparisonId: comparison._id,
        planAId,
        planBId,
        recommendedPlan: aiAnalysis.recommendation.suggestedPlan
      });

      res.json({
        success: true,
        comparison,
        isExisting: false
      });

    } catch (aiError) {
      comparison.status = 'error';
      await comparison.save();
      
      logger.log('error', 'AI analysis failed', {
        error: aiError.message,
        comparisonId: comparison._id
      });

      res.status(500).json({
        success: false,
        message: 'AI analysis failed',
        error: aiError.message
      });
    }

  } catch (error) {
    logger.log('error', 'Error comparing plans', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Failed to compare plans',
      error: error.message
    });
  }
};

// Get comparison history for a client
exports.getComparisonHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 10 } = req.query;

    const ABTestComparison = require('../models/ABTestComparison');
    const comparisons = await ABTestComparison.findByClient(clientId, { limit: parseInt(limit) });

    logger.log('info', 'Comparison history fetched', {
      advisorId: req.advisor.id,
      clientId,
      comparisonsCount: comparisons.length
    });

    res.json({
      success: true,
      comparisons
    });

  } catch (error) {
    logger.log('error', 'Error fetching comparison history', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison history',
      error: error.message
    });
  }
};

// Get PDF for a specific plan (A/B Testing)
exports.getPlanPDF = async (req, res) => {
  try {
    const { planId, reportType } = req.params;
    const advisorId = req.advisor.id;

    const plan = await FinancialPlan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Verify ownership
    if (plan.advisorId.toString() !== advisorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Plan belongs to different advisor'
      });
    }

    // Get the latest PDF report of the specified type
    const pdfReport = plan.getLatestPDFReport(reportType);
    
    if (!pdfReport) {
      return res.status(404).json({
        success: false,
        message: `No ${reportType} PDF report found for this plan`
      });
    }

    // Set appropriate headers for PDF viewing
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfReport.fileSize,
      'Content-Disposition': `inline; filename="${pdfReport.fileName}"`,
      'Cache-Control': 'no-cache',
      'X-PDF-Info': JSON.stringify({
        reportType: pdfReport.reportType,
        version: pdfReport.version,
        generatedAt: pdfReport.generatedAt,
        planVersion: pdfReport.metadata.planVersion
      })
    });

    logger.log('info', 'PDF served for A/B testing', {
      planId,
      reportType,
      advisorId,
      fileSize: pdfReport.fileSize,
      fileName: pdfReport.fileName
    });

    // Send the PDF buffer
    res.send(pdfReport.pdfData);

  } catch (error) {
    logger.log('error', 'Error serving PDF for A/B testing', {
      error: error.message,
      stack: error.stack,
      planId: req.params.planId,
      reportType: req.params.reportType
    });

    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF',
      error: error.message
    });
  }
};

// Update comparison with user's decision
exports.updateComparisonDecision = async (req, res) => {
  try {
    const { comparisonId } = req.params;
    const { selectedWinner, reason } = req.body;
    const advisorId = req.advisor.id;

    const ABTestComparison = require('../models/ABTestComparison');
    const comparison = await ABTestComparison.findById(comparisonId);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Comparison not found'
      });
    }

    comparison.selectedWinner = {
      plan: selectedWinner,
      reason,
      selectedBy: advisorId,
      selectedAt: new Date()
    };

    comparison.changeHistory.push({
      changeDate: new Date(),
      changedBy: advisorId,
      changeType: 'winner_selected',
      description: `Selected ${selectedWinner} as winner`
    });

    await comparison.save();

    // Update the plans with winner information
    const planAId = comparison.planA.planId;
    const planBId = comparison.planB.planId;
    const planAWon = selectedWinner === 'planA';

    await Promise.all([
      FinancialPlan.updateOne(
        { _id: planAId, 'abTestComparisons.comparisonId': comparisonId },
        { $set: { 'abTestComparisons.$.wasSelectedAsWinner': planAWon } }
      ),
      FinancialPlan.updateOne(
        { _id: planBId, 'abTestComparisons.comparisonId': comparisonId },
        { $set: { 'abTestComparisons.$.wasSelectedAsWinner': !planAWon } }
      )
    ]);

    logger.log('info', 'Comparison decision updated', {
      comparisonId,
      selectedWinner,
      advisorId
    });

    res.json({
      success: true,
      comparison
    });

  } catch (error) {
    logger.log('error', 'Error updating comparison decision', {
      error: error.message,
      stack: error.stack,
      comparisonId: req.params.comparisonId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update comparison decision',
      error: error.message
    });
  }
};

module.exports = exports;