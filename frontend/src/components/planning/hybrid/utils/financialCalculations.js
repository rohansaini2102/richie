/**
 * Financial calculation utilities for hybrid planning
 */

/**
 * Safely parse numeric values from client data
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Validate and clean client data before processing
 */
export const validateClientData = (clientData) => {
  if (!clientData) {
    console.warn('No client data provided');
    return {
      isValid: false,
      errors: ['Client data is missing'],
      cleanedData: null
    };
  }

  const errors = [];
  const warnings = [];

  // Basic validation
  if (!clientData.firstName && !clientData.lastName) {
    errors.push('Client name is missing');
  }

  if (!clientData.dateOfBirth) {
    warnings.push('Date of birth not provided - age-based calculations may be inaccurate');
  }

  // Clean and validate financial data
  const cleanedData = {
    ...clientData,
    assets: cleanAssetData(clientData.assets),
    debtsAndLiabilities: cleanDebtData(clientData.debtsAndLiabilities),
    insurance: cleanInsuranceData(clientData.insurance),
    // Preserve backend calculated financials
    calculatedFinancials: clientData.calculatedFinancials
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData
  };
};

const cleanAssetData = (assets) => {
  if (!assets) return {};
  
  const cleaned = {};
  const assetFields = [
    'savingsAccountBalance', 'fixedDepositsValue', 'mutualFundsValue',
    'directStocksValue', 'elssValue', 'ppfBalance', 'epfBalance',
    'npsBalance', 'realEstateValue', 'goldValue', 'otherInvestmentsValue'
  ];

  assetFields.forEach(field => {
    cleaned[field] = safeParseFloat(assets[field]);
  });

  return cleaned;
};

const cleanDebtData = (debts) => {
  if (!debts) return {};
  
  // Handle new nested structure
  if (debts.homeLoan || debts.carLoan || debts.personalLoan) {
    return debts; // Already in correct format, return as is
  }
  
  // Handle legacy flat structure
  const cleaned = {};
  const debtFields = [
    'homeLoanAmount', 'carLoanAmount', 'personalLoanAmount',
    'educationLoanAmount', 'creditCardDebt', 'otherDebtsAmount'
  ];

  debtFields.forEach(field => {
    cleaned[field] = safeParseFloat(debts[field]);
  });

  return cleaned;
};

const cleanInsuranceData = (insurance) => {
  if (!insurance) return {};
  
  return {
    lifeInsuranceCover: safeParseFloat(insurance.lifeInsuranceCover),
    healthInsuranceCover: safeParseFloat(insurance.healthInsuranceCover),
    disabilityInsuranceCover: safeParseFloat(insurance.disabilityInsuranceCover),
    criticalIllnessCover: safeParseFloat(insurance.criticalIllnessCover)
  };
};

/**
 * Calculate total expenses from expense breakdown details
 */
const calculateTotalFromBreakdown = (expenseBreakdown) => {
  console.log('🔄 [calculateTotalFromBreakdown] Processing:', {
    expenseBreakdown,
    hasExpenseBreakdown: !!expenseBreakdown,
    expenseBreakdownDetails: expenseBreakdown?.details
  });
  
  if (!expenseBreakdown) return 0;
  
  // Handle both formats: expenseBreakdown.details or direct expenseBreakdown
  const breakdown = expenseBreakdown.details || expenseBreakdown;
  
  console.log('🔄 [calculateTotalFromBreakdown] Using breakdown:', {
    breakdown,
    breakdownType: typeof breakdown,
    breakdownKeys: breakdown ? Object.keys(breakdown) : null,
    breakdownValues: breakdown ? Object.values(breakdown) : null
  });
  
  if (!breakdown || typeof breakdown !== 'object') return 0;
  
  // Sum all expense values
  const total = Object.values(breakdown).reduce((sum, value) => {
    return sum + safeParseFloat(value);
  }, 0);
  
  console.log('✅ [calculateTotalFromBreakdown] Calculated total:', total);
  
  return total;
};

/**
 * Get cleaned expense breakdown with default categories
 */
export const getExpenseBreakdown = (clientData) => {
  const breakdown = clientData?.expenseBreakdown?.details || clientData?.expenseBreakdown || {};
  
  console.log('🔄 [getExpenseBreakdown] Processing expense breakdown:', {
    clientDataExpenseBreakdown: clientData?.expenseBreakdown,
    expenseBreakdownDetails: clientData?.expenseBreakdown?.details,
    finalBreakdown: breakdown,
    breakdownKeys: Object.keys(breakdown),
    breakdownValues: Object.values(breakdown)
  });
  
  // Default expense categories
  const defaultCategories = {
    housing: 0,
    food: 0,
    transportation: 0,
    utilities: 0,
    entertainment: 0,
    healthcare: 0,
    education: 0,
    others: 0
  };
  
  // Merge with actual data
  const cleanedBreakdown = { ...defaultCategories };
  Object.keys(breakdown).forEach(key => {
    cleanedBreakdown[key] = safeParseFloat(breakdown[key]);
  });
  
  console.log('✅ [getExpenseBreakdown] Final cleaned breakdown:', {
    cleanedBreakdown,
    total: Object.values(cleanedBreakdown).reduce((sum, val) => sum + val, 0)
  });
  
  return cleanedBreakdown;
};

export const calculateFinancialMetrics = (clientData) => {
  console.log('🔄 [calculateFinancialMetrics] Starting calculation with clientData:', {
    hasClientData: !!clientData,
    clientName: clientData ? `${clientData.firstName} ${clientData.lastName}` : 'Unknown',
    expenseBreakdown: clientData?.expenseBreakdown,
    expenseBreakdownDetails: clientData?.expenseBreakdown?.details,
    totalMonthlyExpenses: clientData?.totalMonthlyExpenses,
    calculatedFinancials: clientData?.calculatedFinancials
  });

  if (!clientData) return {};

  // Validate and clean data first
  const { isValid, errors, warnings, cleanedData } = validateClientData(clientData);
  
  if (!isValid) {
    console.error('Client data validation failed:', errors);
    return { errors, warnings };
  }

  if (warnings.length > 0) {
    console.warn('Client data validation warnings:', warnings);
  }

  // Income calculations - use cleaned data
  const monthlyIncome = safeParseFloat(cleanedData?.calculatedFinancials?.monthlyIncome) || 
                       safeParseFloat(cleanedData?.totalMonthlyIncome);
  
  // Expense calculations - check multiple sources
  const calculatedExpenses = safeParseFloat(cleanedData?.calculatedFinancials?.totalMonthlyExpenses);
  const directExpenses = safeParseFloat(cleanedData?.totalMonthlyExpenses);
  const breakdownExpenses = calculateTotalFromBreakdown(cleanedData?.expenseBreakdown);
  
  console.log('🔄 [calculateFinancialMetrics] Expense calculation sources:', {
    calculatedExpenses,
    directExpenses,
    breakdownExpenses,
    expenseBreakdownRaw: cleanedData?.expenseBreakdown,
    expenseBreakdownDetails: cleanedData?.expenseBreakdown?.details
  });
  
  const monthlyExpenses = calculatedExpenses || directExpenses || breakdownExpenses;

  // Asset calculations - use cleaned assets
  const assets = cleanedData.assets;
  const totalAssets = Object.values(assets).reduce((sum, value) => sum + value, 0);

  // Debt calculations - use cleaned debts
  const debts = cleanedData.debtsAndLiabilities;
  let totalDebts = 0;
  
  // Handle nested loan structure
  if (debts.homeLoan?.hasLoan) totalDebts += safeParseFloat(debts.homeLoan.outstandingAmount);
  if (debts.carLoan?.hasLoan) totalDebts += safeParseFloat(debts.carLoan.outstandingAmount);
  if (debts.personalLoan?.hasLoan) totalDebts += safeParseFloat(debts.personalLoan.outstandingAmount);
  if (debts.educationLoan?.hasLoan) totalDebts += safeParseFloat(debts.educationLoan.outstandingAmount);
  if (debts.goldLoan?.hasLoan) totalDebts += safeParseFloat(debts.goldLoan.outstandingAmount);
  if (debts.businessLoan?.hasLoan) totalDebts += safeParseFloat(debts.businessLoan.outstandingAmount);
  if (debts.otherLoan?.hasLoan) totalDebts += safeParseFloat(debts.otherLoan.outstandingAmount);
  if (debts.creditCards?.totalOutstanding) totalDebts += safeParseFloat(debts.creditCards.totalOutstanding);
  
  // Handle legacy flat structure if nested structure is not present
  if (!debts.homeLoan && !debts.carLoan && !debts.personalLoan) {
    totalDebts = Object.values(debts).reduce((sum, value) => sum + safeParseFloat(value), 0);
  }

  // Derived calculations
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const netWorth = totalAssets - totalDebts;
  const savingsRate = monthlyIncome > 0 
    ? ((monthlySurplus / monthlyIncome) * 100).toFixed(1)
    : '0.0';
  
  // EMI calculations for debt service
  console.log('💰 [calculateFinancialMetrics] Calculating EMI from debts:', {
    debts,
    hasHomeLoan: !!debts?.homeLoan,
    homeLoanEMI: debts?.homeLoan?.monthlyEMI,
    hasCarLoan: !!debts?.carLoan,
    carLoanEMI: debts?.carLoan?.monthlyEMI,
    hasPersonalLoan: !!debts?.personalLoan,
    personalLoanEMI: debts?.personalLoan?.monthlyEMI
  });
  
  const monthlyEMIPayments = calculateMonthlyEMIs(debts);
  
  console.log('💳 [calculateFinancialMetrics] EMI calculation result:', {
    monthlyEMIPayments,
    monthlyIncome,
    debtServicePercentage: monthlyIncome > 0 ? ((monthlyEMIPayments / monthlyIncome) * 100).toFixed(1) + '%' : 'N/A'
  });
  
  const debtToIncomeRatio = monthlyIncome > 0 
    ? ((monthlyEMIPayments / monthlyIncome) * 100).toFixed(1)
    : '0.0';

  // Emergency fund ratio
  const liquidAssets = (assets.savingsAccountBalance || 0) + 
                      (assets.fixedDepositsValue || 0);
  const emergencyFundMonths = monthlyExpenses > 0 
    ? (liquidAssets / monthlyExpenses).toFixed(1)
    : '0.0';

  const finalExpenseBreakdown = getExpenseBreakdown(cleanedData);
  
  console.log('✅ [calculateFinancialMetrics] Final calculation results:', {
    monthlyIncome,
    monthlyExpenses,
    monthlySurplus,
    expenseBreakdown: finalExpenseBreakdown,
    expenseBreakdownKeys: Object.keys(finalExpenseBreakdown),
    expenseBreakdownTotal: Object.values(finalExpenseBreakdown).reduce((sum, val) => sum + val, 0)
  });

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlySurplus,
    totalAssets,
    totalDebts,
    netWorth,
    savingsRate,
    debtToIncomeRatio,
    emergencyFundMonths,
    liquidAssets,
    monthlyEMIPayments,
    expenseBreakdown: finalExpenseBreakdown
  };
};

/**
 * Calculate estimated monthly EMI payments for all debts
 */
export const calculateMonthlyEMIs = (debts) => {
  if (!debts) return 0;

  let totalEMI = 0;

  // Handle new structure with nested loan objects
  if (debts.homeLoan?.hasLoan) {
    // Use monthlyEMI if available, otherwise calculate
    if (debts.homeLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.homeLoan.monthlyEMI);
    } else if (debts.homeLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.homeLoan.outstandingAmount, 8.5, 20 * 12);
    }
  }

  if (debts.carLoan?.hasLoan) {
    if (debts.carLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.carLoan.monthlyEMI);
    } else if (debts.carLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.carLoan.outstandingAmount, 9, 5 * 12);
    }
  }

  if (debts.personalLoan?.hasLoan) {
    if (debts.personalLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.personalLoan.monthlyEMI);
    } else if (debts.personalLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.personalLoan.outstandingAmount, 12, 3 * 12);
    }
  }

  if (debts.educationLoan?.hasLoan) {
    if (debts.educationLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.educationLoan.monthlyEMI);
    } else if (debts.educationLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.educationLoan.outstandingAmount, 10, 10 * 12);
    }
  }

  if (debts.goldLoan?.hasLoan) {
    if (debts.goldLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.goldLoan.monthlyEMI);
    } else if (debts.goldLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.goldLoan.outstandingAmount, 11, 5 * 12);
    }
  }

  if (debts.businessLoan?.hasLoan) {
    if (debts.businessLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.businessLoan.monthlyEMI);
    } else if (debts.businessLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.businessLoan.outstandingAmount, 11, 5 * 12);
    }
  }

  if (debts.otherLoan?.hasLoan) {
    if (debts.otherLoan.monthlyEMI) {
      totalEMI += safeParseFloat(debts.otherLoan.monthlyEMI);
    } else if (debts.otherLoan.outstandingAmount > 0) {
      totalEMI += calculateEMI(debts.otherLoan.outstandingAmount, 11, 5 * 12);
    }
  }

  // Credit card debt
  if (debts.creditCards?.totalOutstanding > 0) {
    totalEMI += safeParseFloat(debts.creditCards.totalOutstanding) * 0.03;
  }

  // Handle legacy structure (backwards compatibility)
  if (!debts.homeLoan && debts.homeLoanAmount > 0) {
    totalEMI += calculateEMI(safeParseFloat(debts.homeLoanAmount), 8.5, 20 * 12);
  }
  if (!debts.carLoan && debts.carLoanAmount > 0) {
    totalEMI += calculateEMI(safeParseFloat(debts.carLoanAmount), 9, 5 * 12);
  }
  if (!debts.personalLoan && debts.personalLoanAmount > 0) {
    totalEMI += calculateEMI(safeParseFloat(debts.personalLoanAmount), 12, 3 * 12);
  }
  if (!debts.educationLoan && debts.educationLoanAmount > 0) {
    totalEMI += calculateEMI(safeParseFloat(debts.educationLoanAmount), 10, 10 * 12);
  }
  if (!debts.creditCards && debts.creditCardDebt > 0) {
    totalEMI += safeParseFloat(debts.creditCardDebt) * 0.03;
  }
  if (!debts.otherLoan && debts.otherDebtsAmount > 0) {
    totalEMI += calculateEMI(safeParseFloat(debts.otherDebtsAmount), 11, 5 * 12);
  }

  return Math.round(totalEMI);
};

/**
 * Calculate EMI using the standard formula
 * EMI = P * r * (1 + r)^n / [(1 + r)^n - 1]
 */
export const calculateEMI = (principal, annualRate, months) => {
  if (!principal || principal <= 0) return 0;
  
  const monthlyRate = annualRate / (12 * 100);
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return numerator / denominator;
};

/**
 * Calculate investment projections for goals
 */
export const calculateGoalProjections = (goalAmount, currentSavings, monthlyContribution, years, expectedReturn = 12) => {
  const monthlyRate = expectedReturn / (12 * 100);
  const months = years * 12;
  
  // Future value of current savings
  const futureValueCurrent = currentSavings * Math.pow(1 + monthlyRate, months);
  
  // Future value of monthly contributions (annuity)
  const futureValueContributions = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  const totalFutureValue = futureValueCurrent + futureValueContributions;
  const shortfall = Math.max(0, goalAmount - totalFutureValue);
  
  return {
    totalFutureValue: Math.round(totalFutureValue),
    shortfall: Math.round(shortfall),
    onTrack: shortfall === 0,
    projectedValue: Math.round(totalFutureValue)
  };
};

/**
 * Calculate retirement corpus requirement
 */
export const calculateRetirementCorpus = (currentAge, retirementAge, currentExpenses, inflationRate = 6) => {
  const yearsToRetirement = retirementAge - currentAge;
  const futureExpenses = currentExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  
  // Assuming 4% withdrawal rate post-retirement
  const requiredCorpus = futureExpenses * 12 / 0.04;
  
  return {
    yearsToRetirement,
    futureMonthlyExpenses: Math.round(futureExpenses),
    requiredCorpus: Math.round(requiredCorpus)
  };
};

/**
 * Calculate tax-saving opportunities
 */
export const calculateTaxSavings = (annualIncome) => {
  // Basic tax calculation for Indian tax slabs (FY 2023-24)
  let tax = 0;
  let remainingIncome = annualIncome;
  
  // New tax regime slabs
  if (remainingIncome > 250000) {
    const taxableIn5Percent = Math.min(remainingIncome - 250000, 250000);
    tax += taxableIn5Percent * 0.05;
    remainingIncome -= taxableIn5Percent;
  }
  
  if (remainingIncome > 500000) {
    const taxableIn10Percent = Math.min(remainingIncome - 500000, 250000);
    tax += taxableIn10Percent * 0.10;
    remainingIncome -= taxableIn10Percent;
  }
  
  if (remainingIncome > 750000) {
    const taxableIn15Percent = Math.min(remainingIncome - 750000, 250000);
    tax += taxableIn15Percent * 0.15;
    remainingIncome -= taxableIn15Percent;
  }
  
  if (remainingIncome > 1000000) {
    const taxableIn20Percent = Math.min(remainingIncome - 1000000, 250000);
    tax += taxableIn20Percent * 0.20;
    remainingIncome -= taxableIn20Percent;
  }
  
  if (remainingIncome > 1250000) {
    const taxableIn25Percent = Math.min(remainingIncome - 1250000, 250000);
    tax += taxableIn25Percent * 0.25;
    remainingIncome -= taxableIn25Percent;
  }
  
  if (remainingIncome > 1500000) {
    tax += (remainingIncome - 1500000) * 0.30;
  }

  // Maximum 80C deduction potential
  const maxDeduction80C = 150000;
  const potentialSavings = Math.min(maxDeduction80C, annualIncome * 0.30);
  
  return {
    estimatedTax: Math.round(tax),
    potentialSavings: Math.round(potentialSavings),
    effectiveTaxRate: annualIncome > 0 ? ((tax / annualIncome) * 100).toFixed(1) : 0
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'INR',
    locale = 'en-IN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  if (!amount || amount === 0) return '₹0';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

/**
 * Calculate debt payoff strategies
 */
export const calculateDebtPayoffStrategies = (debts, availableFunds) => {
  if (!debts || !availableFunds) return [];

  const debtList = [];
  
  // Convert debts object to array with interest rates
  Object.entries(debts).forEach(([key, amount]) => {
    if (amount && amount > 0) {
      let interestRate, minPayment, type;
      
      switch (key) {
        case 'creditCardDebt':
          interestRate = 18;
          minPayment = amount * 0.03;
          type = 'Credit Card';
          break;
        case 'personalLoanAmount':
          interestRate = 12;
          minPayment = calculateEMI(amount, 12, 36);
          type = 'Personal Loan';
          break;
        case 'carLoanAmount':
          interestRate = 9;
          minPayment = calculateEMI(amount, 9, 60);
          type = 'Car Loan';
          break;
        case 'homeLoanAmount':
          interestRate = 8.5;
          minPayment = calculateEMI(amount, 8.5, 240);
          type = 'Home Loan';
          break;
        case 'educationLoanAmount':
          interestRate = 10;
          minPayment = calculateEMI(amount, 10, 120);
          type = 'Education Loan';
          break;
        default:
          interestRate = 11;
          minPayment = calculateEMI(amount, 11, 60);
          type = 'Other Debt';
      }
      
      debtList.push({
        type,
        amount,
        interestRate,
        minPayment: Math.round(minPayment)
      });
    }
  });

  // Sort by interest rate (avalanche method)
  const avalanche = [...debtList].sort((a, b) => b.interestRate - a.interestRate);
  
  // Sort by amount (snowball method)
  const snowball = [...debtList].sort((a, b) => a.amount - b.amount);

  return {
    avalanche,
    snowball,
    totalMinPayments: debtList.reduce((sum, debt) => sum + debt.minPayment, 0)
  };
};