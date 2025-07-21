// Financial calculation utilities for cash flow planning

export const calculateTotalEMIs = (debts) => {
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
};

export const calculateTotalDebt = (debts) => {
  if (!debts) return 0;
  let total = 0;
  
  Object.values(debts).forEach(debt => {
    if (debt && (debt.hasLoan || debt.hasDebt)) {
      const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
      if (outstanding > 0) {
        total += outstanding;
      }
    }
  });
  
  return Math.max(0, total);
};

export const calculateMonthlyMetrics = (clientData) => {
  const monthlyIncome = parseFloat(clientData.totalMonthlyIncome) || 0;
  const monthlyExpenses = parseFloat(clientData.totalMonthlyExpenses) || 0;
  const totalEMIs = calculateTotalEMIs(clientData.debtsAndLiabilities);
  const monthlySurplus = monthlyIncome - monthlyExpenses - totalEMIs;
  
  return {
    monthlyIncome,
    monthlyExpenses,
    totalEMIs,
    monthlySurplus,
    emiRatio: monthlyIncome > 0 ? (totalEMIs / monthlyIncome) * 100 : 0,
    savingsRate: monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0,
    expenseRatio: monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0,
    fixedExpenditureRatio: monthlyIncome > 0 ? ((monthlyExpenses + totalEMIs) / monthlyIncome) * 100 : 0
  };
};

export const calculateEmergencyFund = (clientData) => {
  const { monthlyExpenses, totalEMIs } = calculateMonthlyMetrics(clientData);
  const monthlyCommitments = monthlyExpenses + totalEMIs;
  
  // Emergency fund should cover 6 months of expenses
  const targetAmount = Math.max(monthlyCommitments * 6, 50000); // Minimum ₹50k
  const currentAmount = parseFloat(clientData.assets?.cashBankSavings) || 0;
  const gap = Math.max(0, targetAmount - currentAmount);
  
  return {
    targetAmount,
    currentAmount,
    gap,
    monthsOfCoverage: monthlyCommitments > 0 ? currentAmount / monthlyCommitments : 0,
    completionPercentage: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
  };
};

export const prioritizeDebts = (debts) => {
  if (!debts) return [];
  
  const debtList = [];
  const debtTypeNames = {
    'creditCards': 'Credit Card',
    'personalLoan': 'Personal Loan',
    'businessLoan': 'Business Loan',
    'carLoan': 'Car Loan',
    'educationLoan': 'Education Loan',
    'goldLoan': 'Gold Loan',
    'homeLoan': 'Home Loan',
    'otherLoans': 'Other Loans'
  };

  Object.entries(debtTypeNames).forEach(([key, name]) => {
    const debt = debts[key];
    if (debt && (debt.hasLoan || debt.hasDebt) && debt.outstandingAmount > 0) {
      debtList.push({
        debtType: name,
        key: key,
        outstandingAmount: debt.outstandingAmount || debt.totalOutstanding || 0,
        currentEMI: debt.monthlyEMI || debt.monthlyPayment || 0,
        interestRate: debt.interestRate || debt.averageInterestRate || 0,
        remainingTenure: debt.remainingTenure || 0
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
      debt.priority = 'high';
    } else if (debt.interestRate >= 10) {
      debt.reason = 'Moderate interest rate - Standard repayment';
      debt.priority = 'medium';
    } else {
      debt.reason = 'Low interest rate - Maintain minimum payment';
      debt.priority = 'low';
    }
  });

  return debtList;
};

export const calculateInvestmentAllocation = (age, riskProfile = 'Moderate') => {
  // Basic rule: 100 - age = equity allocation percentage
  let equityPercentage = Math.max(100 - age, 30); // Minimum 30% equity
  
  // Adjust based on risk profile
  switch (riskProfile) {
    case 'Conservative':
      equityPercentage = Math.max(equityPercentage - 20, 20);
      break;
    case 'Aggressive':
      equityPercentage = Math.min(equityPercentage + 20, 90);
      break;
    default: // Moderate
      break;
  }
  
  return {
    equity: equityPercentage,
    debt: 100 - equityPercentage,
    gold: 0, // Can be adjusted based on preferences
    others: 0
  };
};

export const calculateFinancialHealthScore = (clientData) => {
  let score = 0;
  const maxScore = 100;
  const metrics = calculateMonthlyMetrics(clientData);
  const emergencyFund = calculateEmergencyFund(clientData);

  // Income stability (20 points)
  if (metrics.monthlyIncome > 0) score += 20;

  // Expense management (20 points)
  if (metrics.expenseRatio < 50) score += 20;
  else if (metrics.expenseRatio < 70) score += 10;

  // Debt management (20 points)
  if (metrics.emiRatio === 0) score += 20;
  else if (metrics.emiRatio < 30) score += 15;
  else if (metrics.emiRatio < 40) score += 10;
  else if (metrics.emiRatio < 50) score += 5;

  // Savings rate (20 points)
  if (metrics.savingsRate > 30) score += 20;
  else if (metrics.savingsRate > 20) score += 15;
  else if (metrics.savingsRate > 10) score += 10;
  else if (metrics.savingsRate > 0) score += 5;

  // Emergency fund (20 points)
  if (emergencyFund.monthsOfCoverage >= 6) score += 20;
  else if (emergencyFund.monthsOfCoverage >= 3) score += 10;
  else if (emergencyFund.monthsOfCoverage >= 1) score += 5;

  return Math.min(score, maxScore);
};

export const generateActionItems = (clientData) => {
  const metrics = calculateMonthlyMetrics(clientData);
  const emergencyFund = calculateEmergencyFund(clientData);
  const prioritizedDebts = prioritizeDebts(clientData.debtsAndLiabilities);
  const actionItems = [];
  
  // High EMI ratio
  if (metrics.emiRatio > 40) {
    actionItems.push({
      action: 'Reduce EMI ratio to below 40%',
      priority: 'high',
      timeline: '0-3 months',
      category: 'debt',
      description: 'Your EMI commitments are high. Consider prepaying high-interest debts.'
    });
  }
  
  // Negative surplus
  if (metrics.monthlySurplus <= 0) {
    actionItems.push({
      action: 'Review and optimize monthly expenses',
      priority: 'high',
      timeline: '0-1 month',
      category: 'expense',
      description: 'You are spending more than earning. Immediate expense optimization needed.'
    });
  }
  
  // Low emergency fund
  if (emergencyFund.monthsOfCoverage < 3) {
    actionItems.push({
      action: 'Build emergency fund to 6 months expenses',
      priority: 'high',
      timeline: '0-12 months',
      category: 'savings',
      description: `Current coverage: ${emergencyFund.monthsOfCoverage.toFixed(1)} months. Target: 6 months.`
    });
  }
  
  // High interest debts
  const highInterestDebts = prioritizedDebts.filter(d => d.interestRate > 15);
  if (highInterestDebts.length > 0) {
    actionItems.push({
      action: `Prioritize ${highInterestDebts[0].debtType} repayment`,
      priority: 'high',
      timeline: '0-6 months',
      category: 'debt',
      description: `Interest rate: ${highInterestDebts[0].interestRate}%. Consider increasing EMI or prepayment.`
    });
  }
  
  // Low savings rate
  if (metrics.savingsRate < 20 && metrics.monthlySurplus > 0) {
    actionItems.push({
      action: 'Increase savings rate to 20%',
      priority: 'medium',
      timeline: '0-3 months',
      category: 'savings',
      description: `Current savings rate: ${metrics.savingsRate.toFixed(1)}%. Aim for at least 20%.`
    });
  }
  
  return actionItems;
};