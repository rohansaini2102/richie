// Financial calculation utilities extracted from ClientOnboardingForm.jsx

/**
 * Calculate monthly financial summary from form data
 */
export const calculateFinancialSummary = (formData) => {
  const monthlyIncome = (parseFloat(formData.annualIncome) || 0) / 12 + 
                       (parseFloat(formData.additionalIncome) || 0) / 12;
  
  // Calculate total monthly expenses
  const monthlyExpenses = formData.monthlyExpenses || {};
  let totalMonthlyExpenses = 0;
  
  // Individual expense fields
  const individualExpenses = [
    'housingRent', 'groceriesUtilitiesFood', 'transportation', 
    'education', 'healthcare', 'entertainment', 'insurancePremiums', 
    'loanEmis', 'otherExpenses'
  ];
  
  individualExpenses.forEach(field => {
    const value = parseFloat(monthlyExpenses[field]) || 0;
    totalMonthlyExpenses += value;
  });
  
  // Add direct monthly expenses values
  Object.values(monthlyExpenses).forEach(expense => {
    if (typeof expense === 'string' || typeof expense === 'number') {
      const value = parseFloat(expense) || 0;
      if (!individualExpenses.some(field => monthlyExpenses[field] === expense)) {
        totalMonthlyExpenses += value;
      }
    }
  });
  
  const monthlySavings = monthlyIncome - totalMonthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  
  return {
    monthlyIncome: Math.round(monthlyIncome),
    totalMonthlyExpenses: Math.round(totalMonthlyExpenses),
    monthlySavings: Math.round(monthlySavings),
    savingsRate: Math.round(savingsRate * 100) / 100
  };
};

/**
 * Calculate assets and liabilities summary
 */
export const calculateAssetsLiabilities = (formData) => {
  let totalAssets = 0;
  let totalLiabilities = 0;
  
  // Calculate assets
  const assets = formData.assets || {};
  totalAssets += parseFloat(assets.cashBankSavings) || 0;
  totalAssets += parseFloat(assets.realEstate) || 0;
  
  // Investment fields
  const investments = assets.investments || {};
  const investmentFields = [
    investments.equity?.mutualFunds,
    investments.equity?.directStocks,
    investments.fixedIncome?.ppf,
    investments.fixedIncome?.epf,
    investments.fixedIncome?.nps,
    investments.fixedIncome?.fixedDeposits,
    investments.fixedIncome?.bondsDebentures,
    investments.fixedIncome?.nsc,
    investments.other?.ulip,
    investments.other?.otherInvestments
  ];
  
  investmentFields.forEach(field => {
    totalAssets += parseFloat(field) || 0;
  });
  
  // Calculate liabilities
  const liabilities = formData.liabilities || {};
  const debtFields = [
    liabilities.loans,
    liabilities.creditCardDebt
  ];
  
  debtFields.forEach(field => {
    totalLiabilities += parseFloat(field) || 0;
  });
  
  const netWorth = totalAssets - totalLiabilities;
  
  return {
    totalAssets: Math.round(totalAssets),
    totalLiabilities: Math.round(totalLiabilities),
    netWorth: Math.round(netWorth)
  };
};

/**
 * Calculate investment capacity based on income and expenses
 */
export const calculateInvestmentCapacity = (formData) => {
  const financial = calculateFinancialSummary(formData);
  const conservativeRate = 0.2; // 20% of monthly savings for conservative approach
  const moderateRate = 0.5;     // 50% of monthly savings for moderate approach
  const aggressiveRate = 0.8;   // 80% of monthly savings for aggressive approach
  
  return {
    conservative: Math.round(financial.monthlySavings * conservativeRate),
    moderate: Math.round(financial.monthlySavings * moderateRate),
    aggressive: Math.round(financial.monthlySavings * aggressiveRate),
    availableSavings: financial.monthlySavings
  };
};

/**
 * Calculate retirement corpus requirement
 */
export const calculateRetirementCorpus = (currentAge, retirementAge, monthlyIncome, inflationRate = 0.06) => {
  const yearsToRetirement = retirementAge - currentAge;
  const monthlyExpensesAtRetirement = monthlyIncome * 0.7; // Assume 70% of current income needed
  const futureMonthlyExpenses = monthlyExpensesAtRetirement * Math.pow(1 + inflationRate, yearsToRetirement);
  const annualExpensesAtRetirement = futureMonthlyExpenses * 12;
  
  // Assume corpus should last 25 years post-retirement with 4% withdrawal rate
  const requiredCorpus = annualExpensesAtRetirement / 0.04;
  
  return {
    requiredCorpus: Math.round(requiredCorpus),
    futureMonthlyExpenses: Math.round(futureMonthlyExpenses),
    yearsToRetirement
  };
};

/**
 * Calculate goal feasibility based on available savings
 */
export const calculateGoalFeasibility = (goalAmount, targetYear, monthlyInvestmentCapacity, expectedReturn = 0.12) => {
  const currentYear = new Date().getFullYear();
  const yearsToGoal = targetYear - currentYear;
  
  if (yearsToGoal <= 0) {
    return { feasible: false, reason: 'Target year is in the past or current year' };
  }
  
  // Calculate required monthly SIP using PMT formula
  const monthlyRate = expectedReturn / 12;
  const numberOfPayments = yearsToGoal * 12;
  
  const requiredMonthlySIP = goalAmount * monthlyRate / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  const feasible = requiredMonthlySIP <= monthlyInvestmentCapacity;
  const feasibilityPercentage = (monthlyInvestmentCapacity / requiredMonthlySIP) * 100;
  
  return {
    feasible,
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    availableCapacity: monthlyInvestmentCapacity,
    feasibilityPercentage: Math.round(feasibilityPercentage),
    yearsToGoal,
    reason: feasible ? 'Goal is achievable with current capacity' : 'Insufficient investment capacity for this goal'
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format large numbers with appropriate suffixes (K, L, Cr)
 */
export const formatLargeNumber = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (absAmount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (absAmount >= 1000) { // 1 Thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  } else {
    return `₹${amount.toFixed(0)}`;
  }
};

/**
 * Calculate financial health score (0-100)
 */
export const calculateFinancialHealthScore = (formData) => {
  let score = 0;
  const financial = calculateFinancialSummary(formData);
  const assets = calculateAssetsLiabilities(formData);
  
  // Savings rate (30 points max)
  if (financial.savingsRate >= 20) score += 30;
  else if (financial.savingsRate >= 15) score += 25;
  else if (financial.savingsRate >= 10) score += 20;
  else if (financial.savingsRate >= 5) score += 15;
  else score += 10;
  
  // Net worth (25 points max)
  if (assets.netWorth >= 5000000) score += 25;
  else if (assets.netWorth >= 2000000) score += 20;
  else if (assets.netWorth >= 1000000) score += 15;
  else if (assets.netWorth >= 500000) score += 10;
  else if (assets.netWorth >= 0) score += 5;
  
  // Investment diversity (20 points max)
  const investments = formData.assets?.investments || {};
  let investmentCount = 0;
  if ((investments.equity?.mutualFunds || 0) > 0) investmentCount++;
  if ((investments.equity?.directStocks || 0) > 0) investmentCount++;
  if ((investments.fixedIncome?.ppf || 0) > 0) investmentCount++;
  if ((investments.fixedIncome?.epf || 0) > 0) investmentCount++;
  if ((investments.fixedIncome?.nps || 0) > 0) investmentCount++;
  
  score += Math.min(investmentCount * 4, 20);
  
  // Debt management (25 points max)
  const debtToIncomeRatio = financial.monthlyIncome > 0 ? 
    (assets.totalLiabilities / (financial.monthlyIncome * 12)) * 100 : 0;
  
  if (debtToIncomeRatio === 0) score += 25;
  else if (debtToIncomeRatio <= 20) score += 20;
  else if (debtToIncomeRatio <= 40) score += 15;
  else if (debtToIncomeRatio <= 60) score += 10;
  else score += 5;
  
  return Math.min(Math.round(score), 100);
};