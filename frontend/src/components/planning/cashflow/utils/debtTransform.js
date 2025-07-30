/**
 * Utility functions to transform debt data between different formats
 */

/**
 * Transform client's debtsAndLiabilities data into prioritized debts format for PDF
 * @param {Object} debtsAndLiabilities - Client's debt data from database
 * @returns {Object} Transformed debt management data for PDF
 */
export const transformDebtsForPDF = (debtsAndLiabilities) => {
  if (!debtsAndLiabilities) {
    return {
      prioritizedDebts: [],
      totalDebt: 0,
      totalEMI: 0,
      strategy: 'No active debts found.'
    };
  }

  const debtTypes = {
    homeLoan: { name: 'Home Loan', priority: 'Low' },
    personalLoan: { name: 'Personal Loan', priority: 'High' },
    carLoan: { name: 'Car Loan', priority: 'Medium' },
    educationLoan: { name: 'Education Loan', priority: 'Medium' },
    businessLoan: { name: 'Business Loan', priority: 'Medium' },
    goldLoan: { name: 'Gold Loan', priority: 'Medium' },
    mortgageLoan: { name: 'Mortgage Loan', priority: 'Low' },
    otherLoan: { name: 'Other Loan', priority: 'High' },
    creditCard: { name: 'Credit Card Outstanding', priority: 'High' }
  };

  const prioritizedDebts = [];
  let totalDebt = 0;
  let totalEMI = 0;

  // Process each debt type
  Object.entries(debtsAndLiabilities).forEach(([debtKey, debtData]) => {
    if (debtData && debtData.hasLoan) {
      const debtInfo = debtTypes[debtKey] || { name: debtKey, priority: 'Medium' };
      
      const outstandingAmount = debtData.outstandingAmount || debtData.totalOutstanding || 0;
      const monthlyEMI = debtData.monthlyEMI || debtData.monthlyPayment || 0;
      const interestRate = debtData.interestRate || debtData.rate || 0;

      if (outstandingAmount > 0 || monthlyEMI > 0) {
        prioritizedDebts.push({
          name: debtInfo.name,
          type: debtKey,
          outstandingAmount: outstandingAmount,
          emi: monthlyEMI,
          interestRate: interestRate,
          priority: debtInfo.priority,
          remainingTenure: debtData.remainingTenure || debtData.tenure || 0,
          lender: debtData.lender || debtData.bankName || 'Not Specified'
        });

        totalDebt += outstandingAmount;
        totalEMI += monthlyEMI;
      }
    }
  });

  // Sort by priority and interest rate
  const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
  prioritizedDebts.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.interestRate - a.interestRate; // Higher interest rate first within same priority
  });

  // Generate debt strategy
  let strategy = '';
  if (prioritizedDebts.length === 0) {
    strategy = 'No active debts found. Excellent financial position!';
  } else if (totalEMI > 0) {
    const highPriorityDebts = prioritizedDebts.filter(d => d.priority === 'High');
    if (highPriorityDebts.length > 0) {
      strategy = `Focus on clearing high-priority debts first: ${highPriorityDebts.map(d => d.name).join(', ')}. `;
      strategy += 'Consider using the avalanche method (highest interest rate first) for faster debt clearance.';
    } else {
      strategy = 'Maintain regular EMI payments. Consider prepayments when possible to reduce interest burden.';
    }
  }

  return {
    prioritizedDebts,
    totalDebt,
    totalEMI,
    strategy,
    debtCount: prioritizedDebts.length
  };
};

/**
 * Build emergency fund strategy based on client data
 * @param {Object} clientData - Client's financial data
 * @returns {Object} Emergency fund strategy
 */
export const buildEmergencyFundStrategy = (clientData) => {
  const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
  const currentEmergencyFund = clientData.emergencyFund || 0;
  const targetMonths = 6; // Standard recommendation
  const targetAmount = monthlyExpenses * targetMonths;
  const monthsCovered = monthlyExpenses > 0 ? Math.floor(currentEmergencyFund / monthlyExpenses) : 0;
  
  const monthlyIncome = clientData.totalMonthlyIncome || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const monthlyContribution = monthlySurplus > 0 ? Math.min(monthlySurplus * 0.3, targetAmount - currentEmergencyFund) : 0;

  let strategy = '';
  if (currentEmergencyFund >= targetAmount) {
    strategy = 'Excellent! Your emergency fund meets the recommended 6-month expense coverage.';
  } else if (monthsCovered >= 3) {
    strategy = `Good progress! You have ${monthsCovered} months covered. Continue building towards 6 months.`;
  } else {
    strategy = `Priority action needed. Build emergency fund to at least 3 months of expenses (₹${(monthlyExpenses * 3).toLocaleString()}).`;
  }

  return {
    currentAmount: currentEmergencyFund,
    targetAmount: targetAmount,
    monthsCovered: monthsCovered,
    monthlyContribution: monthlyContribution,
    strategy: strategy
  };
};

/**
 * Build investment recommendations based on surplus and risk profile
 * @param {Object} clientData - Client's financial data
 * @param {Object} debtData - Processed debt data
 * @returns {Object} Investment recommendations
 */
export const buildInvestmentRecommendations = (clientData, debtData) => {
  const monthlyIncome = clientData.totalMonthlyIncome || 0;
  const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
  const totalEMI = debtData.totalEMI || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses - totalEMI;
  
  const riskProfile = clientData.riskTolerance || 'Moderate';
  const age = calculateAge(clientData.dateOfBirth);
  
  const monthlyInvestments = [];
  let totalInvestmentAmount = 0;

  if (monthlySurplus > 0) {
    const investableAmount = monthlySurplus * 0.7; // Keep 30% as buffer
    
    // Asset allocation based on risk profile and age
    let equityPercent, debtPercent, goldPercent;
    
    if (riskProfile === 'Conservative') {
      equityPercent = Math.max(20, 100 - age - 20);
      debtPercent = 70;
      goldPercent = 10;
    } else if (riskProfile === 'Aggressive') {
      equityPercent = Math.min(80, 100 - age + 10);
      debtPercent = 15;
      goldPercent = 5;
    } else { // Moderate
      equityPercent = Math.max(40, 100 - age);
      debtPercent = 50;
      goldPercent = 10;
    }

    // Create investment recommendations
    if (equityPercent > 0) {
      const equityAmount = investableAmount * (equityPercent / 100);
      monthlyInvestments.push({
        fundName: 'Equity Mutual Funds',
        category: 'Equity',
        amount: Math.round(equityAmount),
        purpose: 'Long-term Wealth Creation',
        allocation: equityPercent + '%'
      });
      totalInvestmentAmount += equityAmount;
    }

    if (debtPercent > 0) {
      const debtAmount = investableAmount * (debtPercent / 100);
      monthlyInvestments.push({
        fundName: 'Debt Mutual Funds / PPF',
        category: 'Debt',
        amount: Math.round(debtAmount),
        purpose: 'Stability & Regular Income',
        allocation: debtPercent + '%'
      });
      totalInvestmentAmount += debtAmount;
    }

    if (goldPercent > 0) {
      const goldAmount = investableAmount * (goldPercent / 100);
      monthlyInvestments.push({
        fundName: 'Gold ETF / SGBs',
        category: 'Gold',
        amount: Math.round(goldAmount),
        purpose: 'Portfolio Diversification',
        allocation: goldPercent + '%'
      });
      totalInvestmentAmount += goldAmount;
    }
  }

  const strategy = monthlySurplus > 0 
    ? `Based on your ${riskProfile.toLowerCase()} risk profile and age ${age}, we recommend a diversified portfolio with systematic monthly investments.`
    : 'Focus on improving cash flow before starting investments. Clear high-interest debts first.';

  return {
    monthlyInvestments,
    totalInvestmentAmount: Math.round(totalInvestmentAmount),
    strategy,
    riskProfile,
    assetAllocation: {
      equity: monthlyInvestments.find(i => i.category === 'Equity')?.allocation || '0%',
      debt: monthlyInvestments.find(i => i.category === 'Debt')?.allocation || '0%',
      gold: monthlyInvestments.find(i => i.category === 'Gold')?.allocation || '0%'
    }
  };
};

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 30; // Default age
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Transform AI recommendations to match PDF format
 * @param {Object} aiSuggestions - AI suggestions from API
 * @returns {Object} Transformed recommendations for PDF
 */
export const transformAIRecommendations = (aiSuggestions) => {
  if (!aiSuggestions || !aiSuggestions.analysis) {
    return null;
  }

  const analysis = aiSuggestions.analysis;
  
  // Handle both new and legacy formats
  const recommendations = {
    financialMetrics: analysis.financialMetrics || {},
    debtStrategy: analysis.debtStrategy || {},
    warnings: analysis.warnings || [],
    opportunities: analysis.opportunities || [],
    cashFlowOptimization: analysis.cashFlowOptimization || analysis.summary || '',
    immediateActions: [],
    longTermRecommendations: []
  };

  // Extract recommendations from various possible locations
  if (analysis.recommendations) {
    recommendations.immediateActions = analysis.recommendations.immediateActions || [];
    recommendations.mediumTermActions = analysis.recommendations.mediumTermActions || [];
    recommendations.longTermActions = analysis.recommendations.longTermActions || [];
  }

  // Legacy format support
  if (analysis.immediateActions) {
    recommendations.immediateActions = analysis.immediateActions;
  }
  if (analysis.longTermRecommendations) {
    recommendations.longTermRecommendations = analysis.longTermRecommendations;
  }

  return recommendations;
};