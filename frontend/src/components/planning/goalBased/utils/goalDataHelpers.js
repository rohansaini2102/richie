/**
 * Goal Data Helpers
 * Utility functions for managing goal data parsing, transformation, and validation
 * Enhanced with intelligent defaults based on client financial profile
 */

import { calculateAge } from './goalCalculations';
import { getEducationCostEstimate, getCarPriceEstimate } from './goalFormatters';

/**
 * Extract existing goals from client's enhancedFinancialGoals data ONLY
 * Simplified to avoid conflicts with retirement planning data
 * @param {object} clientData - Complete client data object
 * @returns {Array} Array of existing goal objects
 */
export const parseExistingGoalsFromClient = (clientData) => {
  const existingGoals = [];
  
  console.log('🔍 [goalDataHelpers] Parsing ONLY financial goals (no retirement):', {
    hasClientData: !!clientData,
    hasEnhancedFinancialGoals: !!clientData?.enhancedFinancialGoals,
    financialGoalsKeys: clientData?.enhancedFinancialGoals ? Object.keys(clientData.enhancedFinancialGoals) : [],
    enhancedFinancialGoalsStructure: clientData?.enhancedFinancialGoals
  });
  
  // Additional debugging: check each goal type specifically
  if (clientData?.enhancedFinancialGoals) {
    const goals = clientData.enhancedFinancialGoals;
    console.log('🔍 [goalDataHelpers] Detailed goal type analysis:', {
      emergencyFund: {
        exists: !!goals.emergencyFund,
        hasTargetAmount: !!(goals.emergencyFund?.targetAmount),
        targetAmountValue: goals.emergencyFund?.targetAmount,
        structure: goals.emergencyFund
      },
      childEducation: {
        exists: !!goals.childEducation,
        isApplicable: goals.childEducation?.isApplicable,
        hasDetails: !!(goals.childEducation?.details),
        structure: goals.childEducation
      },
      homePurchase: {
        exists: !!goals.homePurchase,
        isApplicable: goals.homePurchase?.isApplicable,
        hasDetails: !!(goals.homePurchase?.details),
        structure: goals.homePurchase
      },
      marriageOfDaughter: {
        exists: !!goals.marriageOfDaughter,
        isApplicable: goals.marriageOfDaughter?.isApplicable,
        structure: goals.marriageOfDaughter
      },
      customGoals: {
        exists: !!goals.customGoals,
        isArray: Array.isArray(goals.customGoals),
        length: goals.customGoals?.length || 0,
        structure: goals.customGoals
      }
    });
  }
  
  if (!clientData || !clientData.enhancedFinancialGoals) {
    console.log('❌ [goalDataHelpers] No enhancedFinancialGoals data found');
    return existingGoals;
  }

  const goals = clientData.enhancedFinancialGoals;
  const currentAge = calculateAge(clientData.dateOfBirth);
  const currentYear = new Date().getFullYear();

  console.log('📊 [goalDataHelpers] Processing financial goals:', {
    emergencyFund: goals.emergencyFund,
    childEducation: goals.childEducation,
    homePurchase: goals.homePurchase,
    marriageOfDaughter: goals.marriageOfDaughter,
    customGoals: goals.customGoals
  });

  // Emergency Fund Goal - enhanced parsing with proper validation
  // Check both explicit targetAmount and isApplicable flag
  if ((goals.emergencyFund?.targetAmount && goals.emergencyFund.targetAmount > 0) || 
      goals.emergencyFund?.isApplicable === true) {
    console.log('✅ [goalDataHelpers] Found client-specified emergency fund goal:', goals.emergencyFund);
    
    // Use targetAmount if available, otherwise calculate default
    const emergencyAmount = goals.emergencyFund.targetAmount > 0 ? 
      goals.emergencyFund.targetAmount : 
      (clientData.totalMonthlyExpenses || 50000) * 6;
    
    existingGoals.push({
      id: `existing-emergency-${Date.now()}`,
      type: 'custom',
      source: 'client',
      status: 'existing',
      isSelected: true,
      data: {
        goalName: 'Emergency Fund',
        targetAmount: emergencyAmount,
        targetYear: currentYear + 1, // Emergency fund is immediate priority
        priority: goals.emergencyFund.priority || 'High',
        flexibility: 'Low', // Emergency funds are typically not flexible
        notes: 'Client-specified emergency fund from onboarding form',
        originalData: {
          ...goals.emergencyFund,
          sourceForm: 'step7_goalsAndRiskProfile.financialGoals.emergencyFund'
        }
      }
    });
  } else {
    console.log(`ℹ️ [goalDataHelpers] No emergency fund goal specified by client (targetAmount: ${goals.emergencyFund?.targetAmount})`);
  }

  // Child Education Goal - enhanced with better data mapping
  if (goals.childEducation?.isApplicable === true) {
    console.log('✅ [goalDataHelpers] Found child education goal:', goals.childEducation);
    const educationDetails = goals.childEducation.details || {};
    
    // Use provided details or calculate intelligent defaults
    const targetAmount = educationDetails.targetAmount || 2500000;
    const targetYear = educationDetails.targetYear || (currentYear + 15);
    
    existingGoals.push({
      id: `existing-childEducation-${Date.now()}`,
      type: 'childEducation',
      source: 'client',
      status: 'existing',
      isSelected: true,
      data: {
        targetAmount: targetAmount,
        targetYear: targetYear,
        currentAge: null, // To be calculated based on target year
        educationLevel: 'Engineering', // Default - can be customized by advisor
        notes: 'Client-specified child education goal from onboarding',
        originalData: {
          ...goals.childEducation,
          sourceForm: 'step7_goalsAndRiskProfile.financialGoals.childEducation'
        }
      }
    });
  } else {
    console.log('ℹ️ [goalDataHelpers] Child education not applicable or missing details:', goals.childEducation);
  }

  // Home Purchase Goal - enhanced with proper data structure mapping
  if (goals.homePurchase?.isApplicable === true) {
    console.log('✅ [goalDataHelpers] Found home purchase goal:', goals.homePurchase);
    const homeDetails = goals.homePurchase.details || {};
    
    // Use provided details or intelligent defaults
    const targetAmount = homeDetails.targetAmount || 5000000;
    const targetYear = homeDetails.targetYear || (currentYear + 5);
    
    existingGoals.push({
      id: `existing-homePurchase-${Date.now()}`,
      type: 'carPurchase', // Using existing category for now
      source: 'client',
      status: 'existing',
      isSelected: true,
      data: {
        targetAmount: targetAmount,
        targetYear: targetYear,
        category: 'Home Purchase',
        downPaymentPercentage: 20, // Standard assumption
        notes: 'Client-specified home purchase goal from onboarding',
        originalData: {
          ...goals.homePurchase,
          sourceForm: 'step7_goalsAndRiskProfile.financialGoals.homePurchase'
        }
      }
    });
  } else {
    console.log('ℹ️ [goalDataHelpers] Home purchase not applicable or missing details:', goals.homePurchase);
  }

  // Marriage Goal - use the correct field name from schema
  const marriageGoal = goals.marriageOfDaughter;
  if (marriageGoal?.isApplicable === true) {
    console.log('✅ [goalDataHelpers] Found marriage goal:', marriageGoal);
    
    // Use provided amount or calculate default
    const targetAmount = marriageGoal.targetAmount || 1500000;
    const targetYear = marriageGoal.targetYear || (currentYear + 20);
    
    existingGoals.push({
      id: `existing-marriage-${Date.now()}`,
      type: 'marriage',
      source: 'client',
      status: 'existing',
      isSelected: true,
      data: {
        targetAmount: targetAmount,
        targetYear: targetYear,
        currentAge: marriageGoal.daughterCurrentAge || marriageGoal.currentAge || 8,
        originalData: marriageGoal
      }
    });
  } else {
    console.log('ℹ️ [goalDataHelpers] Marriage goal not applicable or missing:', marriageGoal);
  }


  // Custom Goals - enhanced parsing with full client-data.json structure support
  if (goals.customGoals && Array.isArray(goals.customGoals) && goals.customGoals.length > 0) {
    console.log('✅ [goalDataHelpers] Found custom goals:', goals.customGoals);
    goals.customGoals.forEach((customGoal, index) => {
      // Handle both array template structure and direct goal data
      const goalData = customGoal.template || customGoal;
      
      // Only process goals that have meaningful data
      if (goalData && (goalData.goalName || goalData.targetAmount)) {
        console.log(`✅ [goalDataHelpers] Processing custom goal ${index + 1}:`, goalData);
        
        existingGoals.push({
          id: `existing-custom-${index}-${Date.now()}`,
          type: 'custom',
          source: 'client',
          status: 'existing',
          isSelected: true,
          data: {
            goalName: goalData.goalName || `Custom Goal ${index + 1}`,
            targetAmount: goalData.targetAmount || 1000000,
            targetYear: goalData.targetYear || (currentYear + 5),
            priority: goalData.priority || 'Medium',
            flexibility: 'Medium', // Default flexibility
            notes: `Client-specified custom goal #${index + 1} from onboarding`,
            originalData: {
              ...customGoal,
              sourceForm: `step7_goalsAndRiskProfile.financialGoals.customGoals[${index}]`,
              index
            }
          }
        });
      } else {
        console.log(`ℹ️ [goalDataHelpers] Skipping custom goal ${index + 1} - no meaningful data:`, goalData);
      }
    });
  } else {
    console.log('ℹ️ [goalDataHelpers] No custom goals found:', goals.customGoals);
  }

  console.log('✅ [goalDataHelpers] Parsed financial goals only:', {
    totalGoals: existingGoals.length,
    goalTypes: existingGoals.map(g => g.type),
    hasEmergencyFund: existingGoals.some(g => g.data.goalName === 'Emergency Fund'),
    hasEducation: existingGoals.some(g => g.type === 'childEducation'),
    hasHomePurchase: existingGoals.some(g => g.type === 'carPurchase'),
    hasMarriage: existingGoals.some(g => g.type === 'marriage'),
    customGoalsCount: existingGoals.filter(g => g.type === 'custom').length
  });

  return existingGoals;
};

/**
 * Calculate intelligent default goal amounts based on client profile
 * @param {object} clientData - Complete client data
 * @returns {object} Calculated default amounts for different goals
 */
export const calculateIntelligentGoalDefaults = (clientData) => {
  if (!clientData) {
    console.warn('No client data provided for goal defaults calculation');
    return getBasicDefaults();
  }

  const currentYear = new Date().getFullYear();
  const currentAge = calculateAge(clientData.dateOfBirth) || 30;
  const monthlyIncome = clientData.totalMonthlyIncome || clientData.calculatedFinancials?.monthlyIncome || 0;
  const annualIncome = monthlyIncome * 12;
  const numberOfDependents = clientData.numberOfDependents || 0;

  console.log('📊 Calculating intelligent goal defaults:', {
    currentAge,
    monthlyIncome,
    annualIncome,
    numberOfDependents,
    hasFinancialGoals: !!clientData.enhancedFinancialGoals
  });

  return {
    // Child Education - Based on income level and existing goals
    childEducation: calculateChildEducationDefaults(clientData, currentAge, annualIncome, currentYear),
    
    // Marriage of Daughter - Based on income and social expectations
    marriage: calculateMarriageDefaults(clientData, currentAge, annualIncome, currentYear),
    
    // Car Purchase - Based on income level and current assets
    carPurchase: calculateCarPurchaseDefaults(clientData, annualIncome, currentYear),
    
    // Custom Goal - Based on savings capacity
    custom: calculateCustomGoalDefaults(clientData, annualIncome, currentYear),

    // Emergency Fund - Based on monthly expenses
    emergencyFund: calculateEmergencyFundDefaults(clientData),

    // Retirement - Based on current age and income
    retirement: calculateRetirementDefaults(clientData, currentAge, monthlyIncome, currentYear)
  };
};

/**
 * Calculate child education goal defaults
 */
const calculateChildEducationDefaults = (clientData, currentAge, annualIncome, currentYear) => {
  // Check if client has existing education goals
  const existingEducation = clientData.enhancedFinancialGoals?.childEducation;
  if (existingEducation?.details?.targetAmount && existingEducation?.details?.targetYear) {
    return {
      currentAge: 5,
      targetYear: existingEducation.details.targetYear,
      educationLevel: 'Engineering',
      targetAmount: existingEducation.details.targetAmount
    };
  }

  // Calculate based on income level
  let educationLevel = 'Engineering';
  let childAge = 5; // Default assumption
  
  if (annualIncome > 2000000) { // 20L+ income
    educationLevel = 'Study Abroad';
  } else if (annualIncome > 1200000) { // 12L+ income  
    educationLevel = 'Engineering';
  } else if (annualIncome > 600000) { // 6L+ income
    educationLevel = 'General Graduation';
  } else {
    educationLevel = 'General Graduation';
  }

  // Estimate child age if client has dependents
  if (clientData.numberOfDependents > 0) {
    // Assume youngest child for education planning
    childAge = Math.max(2, Math.min(10, currentAge - 25));
  }

  const targetAmount = getEducationCostEstimate(educationLevel);
  const yearsToEducation = Math.max(13, 18 - childAge);

  return {
    currentAge: childAge,
    targetYear: currentYear + yearsToEducation,
    educationLevel,
    targetAmount
  };
};

/**
 * Calculate marriage goal defaults
 */
const calculateMarriageDefaults = (clientData, currentAge, annualIncome, currentYear) => {
  // Check existing marriage goals
  const existingMarriage = clientData.enhancedFinancialGoals?.marriageOfDaughter;
  if (existingMarriage?.targetAmount && existingMarriage?.targetYear) {
    return {
      currentAge: 8,
      targetYear: existingMarriage.targetYear,
      targetAmount: existingMarriage.targetAmount
    };
  }

  // Calculate based on income and cultural expectations
  let marriageAmount;
  if (annualIncome > 2000000) { // 20L+ income
    marriageAmount = 2500000; // 25L for higher income families
  } else if (annualIncome > 1200000) { // 12L+ income
    marriageAmount = 1500000; // 15L for middle class
  } else if (annualIncome > 600000) { // 6L+ income
    marriageAmount = 1000000; // 10L for lower middle class
  } else {
    marriageAmount = 500000; // 5L for basic ceremony
  }

  // Assume daughter age based on client age
  const daughterAge = Math.max(5, Math.min(15, currentAge - 22));
  const yearsToMarriage = Math.max(15, 25 - daughterAge);

  return {
    currentAge: daughterAge,
    targetYear: currentYear + yearsToMarriage,
    targetAmount: marriageAmount
  };
};

/**
 * Calculate car purchase defaults
 */
const calculateCarPurchaseDefaults = (clientData, annualIncome, currentYear) => {
  // Check existing car goals or current assets
  let carCategory;
  let timeframe = 3; // Default 3 years

  if (annualIncome > 2500000) { // 25L+ income
    carCategory = 'Premium SUV';
  } else if (annualIncome > 1500000) { // 15L+ income
    carCategory = 'SUV';
  } else if (annualIncome > 800000) { // 8L+ income
    carCategory = 'Sedan';
  } else {
    carCategory = 'Hatchback';
  }

  // If client already has high assets, they might want premium car sooner
  const totalAssets = calculateTotalAssets(clientData.assets);
  if (totalAssets > 5000000) { // 50L+ assets
    carCategory = 'Premium SUV';
    timeframe = 2;
  }

  const targetAmount = getCarPriceEstimate(carCategory);

  return {
    targetYear: currentYear + timeframe,
    category: carCategory,
    targetAmount
  };
};

/**
 * Calculate custom goal defaults
 */
const calculateCustomGoalDefaults = (clientData, annualIncome, currentYear) => {
  // Base custom goal on 1-2x annual income for major life goals
  const baseAmount = Math.min(annualIncome * 1.5, 2000000); // Cap at 20L
  
  return {
    goalName: '',
    targetAmount: Math.round(baseAmount / 100000) * 100000, // Round to nearest lakh
    targetYear: currentYear + 5,
    priority: 'Medium',
    flexibility: 'Medium'
  };
};

/**
 * Calculate emergency fund defaults
 */
const calculateEmergencyFundDefaults = (clientData) => {
  const monthlyExpenses = clientData.totalMonthlyExpenses || 
                         clientData.calculatedFinancials?.totalMonthlyExpenses || 
                         (clientData.totalMonthlyIncome || 50000) * 0.7; // Assume 70% expenses if not available

  return {
    targetAmount: Math.round(monthlyExpenses * 6 / 10000) * 10000, // 6 months expenses, rounded
    currentAmount: clientData.assets?.cashBankSavings || 0,
    priority: 'High'
  };
};

/**
 * Calculate retirement defaults
 */
const calculateRetirementDefaults = (clientData, currentAge, monthlyIncome, currentYear) => {
  const retirementAge = clientData.retirementPlanning?.retirementAge || 60;
  const yearsToRetirement = retirementAge - currentAge;
  
  // Calculate corpus based on replacement ratio
  const monthlyExpenses = clientData.totalMonthlyExpenses || monthlyIncome * 0.7;
  const retirementExpenses = monthlyExpenses * 0.8; // 80% of current expenses
  const requiredCorpus = retirementExpenses * 12 * 25; // 25 years coverage

  return {
    retirementAge,
    yearsToRetirement: Math.max(0, yearsToRetirement),
    currentCorpus: calculateRetirementAssets(clientData.assets),
    targetCorpus: Math.round(requiredCorpus / 100000) * 100000 // Round to nearest lakh
  };
};

/**
 * Calculate total assets from client data
 */
const calculateTotalAssets = (assets) => {
  if (!assets) return 0;

  let total = 0;
  
  // Cash and bank savings
  total += assets.cashBankSavings || 0;
  
  // Investments
  if (assets.investments) {
    // Equity investments
    if (assets.investments.equity) {
      total += (assets.investments.equity.mutualFunds || 0) +
               (assets.investments.equity.directStocks || 0) +
               (assets.investments.equity.elss || 0);
    }
    
    // Fixed income investments
    if (assets.investments.fixedIncome) {
      total += (assets.investments.fixedIncome.ppf || 0) +
               (assets.investments.fixedIncome.epf || 0) +
               (assets.investments.fixedIncome.nps || 0) +
               (assets.investments.fixedIncome.fixedDeposits || 0);
    }
    
    // Other investments
    if (assets.investments.others) {
      total += assets.investments.others.totalValue || 0;
    }
  }

  return total;
};

/**
 * Calculate retirement-specific assets
 */
const calculateRetirementAssets = (assets) => {
  if (!assets) return 0;
  
  let retirementAssets = 0;
  
  if (assets.investments?.fixedIncome) {
    retirementAssets += (assets.investments.fixedIncome.ppf || 0) +
                       (assets.investments.fixedIncome.epf || 0) +
                       (assets.investments.fixedIncome.nps || 0);
  }
  
  // Include 50% of equity investments as they can contribute to retirement
  if (assets.investments?.equity) {
    const equityTotal = (assets.investments.equity.mutualFunds || 0) +
                       (assets.investments.equity.directStocks || 0);
    retirementAssets += equityTotal * 0.5;
  }
  
  return retirementAssets;
};

/**
 * Get basic defaults when no client data is available
 */
const getBasicDefaults = () => {
  const currentYear = new Date().getFullYear();
  
  return {
    childEducation: {
      currentAge: 5,
      targetYear: currentYear + 13,
      educationLevel: 'Engineering',
      targetAmount: 2500000
    },
    marriage: {
      currentAge: 8,
      targetYear: currentYear + 17,
      targetAmount: 1500000
    },
    carPurchase: {
      targetYear: currentYear + 3,
      category: 'SUV',
      targetAmount: 1500000
    },
    custom: {
      goalName: '',
      targetAmount: 1000000,
      targetYear: currentYear + 5,
      priority: 'Medium',
      flexibility: 'Medium'
    },
    emergencyFund: {
      targetAmount: 300000,
      currentAmount: 0,
      priority: 'High'
    },
    retirement: {
      retirementAge: 60,
      yearsToRetirement: 30,
      currentCorpus: 0,
      targetCorpus: 10000000
    }
  };
};

/**
 * Create a new goal with intelligent defaults based on client data
 * @param {string} goalType - Type of goal to create
 * @param {object} clientData - Client data for context
 * @returns {object} New goal object
 */
export const createNewGoal = (goalType, clientData = {}) => {
  const intelligentDefaults = calculateIntelligentGoalDefaults(clientData);
  const goalData = intelligentDefaults[goalType] || {};

  return {
    id: `new-${goalType}-${Date.now()}`,
    type: goalType,
    source: 'advisor',
    status: 'new',
    isSelected: true,
    data: goalData
  };
};

/**
 * Update an existing goal's data
 * @param {object} goal - Goal to update
 * @param {object} newData - New data to merge
 * @returns {object} Updated goal object
 */
export const updateGoalData = (goal, newData) => {
  return {
    ...goal,
    status: goal.source === 'client' && goal.status === 'existing' ? 'modified' : goal.status,
    data: {
      ...goal.data,
      ...newData
    }
  };
};

/**
 * Get goal display metadata
 * @param {object} goal - Goal object
 * @returns {object} Display metadata
 */
export const getGoalMetadata = (goal) => {
  const metadata = {
    existing: {
      label: 'From Client Data',
      color: '#16a34a',
      bgColor: '#dcfce7',
      icon: '👤'
    },
    modified: {
      label: 'Modified by Advisor',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: '✏️'
    },
    new: {
      label: 'Added by Advisor',
      color: '#2563eb',
      bgColor: '#dbeafe',
      icon: '➕'
    }
  };

  return metadata[goal.status] || metadata.new;
};

/**
 * Validate goal data
 * @param {object} goal - Goal to validate
 * @returns {object} Validation result
 */
export const validateGoal = (goal) => {
  const errors = [];
  const warnings = [];

  if (!goal.data) {
    errors.push('Goal data is missing');
    return { isValid: false, errors, warnings };
  }

  const { data } = goal;
  const currentYear = new Date().getFullYear();

  // Common validations
  if (data.targetAmount && data.targetAmount <= 0) {
    errors.push('Target amount must be greater than 0');
  }

  if (data.targetYear && data.targetYear <= currentYear) {
    errors.push('Target year must be in the future');
  }

  // Goal-specific validations
  switch (goal.type) {
    case 'retirement':
      if (data.retirementAge && data.retirementAge <= (data.currentAge || 0)) {
        errors.push('Retirement age must be greater than current age');
      }
      if (data.retirementAge && data.retirementAge > 75) {
        warnings.push('Retirement age seems quite high');
      }
      break;

    case 'childEducation':
      if (data.targetYear && (data.targetYear - currentYear) < 3) {
        warnings.push('Very short timeline for education goal');
      }
      break;

    case 'carPurchase':
      if (data.targetAmount && data.targetAmount > 5000000) {
        warnings.push('Car amount seems quite high');
      }
      break;

    case 'custom':
      if (!data.goalName || data.goalName.trim().length === 0) {
        errors.push('Custom goal must have a name');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Calculate goal priority score for sorting
 * @param {object} goal - Goal object
 * @returns {number} Priority score (higher = more important)
 */
export const calculateGoalPriorityScore = (goal) => {
  const baseScores = {
    retirement: 10,
    childEducation: 8,
    marriage: 6,
    carPurchase: 4,
    custom: 2
  };

  const statusMultipliers = {
    existing: 1.5,
    modified: 1.3,
    new: 1.0
  };

  const timelineMultiplier = goal.data.targetYear ? 
    Math.max(0.5, 2 - (goal.data.targetYear - new Date().getFullYear()) / 10) : 1;

  return (baseScores[goal.type] || 2) * 
         (statusMultipliers[goal.status] || 1) * 
         timelineMultiplier;
};

/**
 * Group goals by status for display
 * @param {Array} goals - Array of goals
 * @returns {object} Goals grouped by status
 */
export const groupGoalsByStatus = (goals) => {
  return goals.reduce((groups, goal) => {
    const status = goal.status || 'new';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(goal);
    return groups;
  }, {});
};

/**
 * Format goal summary for display
 * @param {object} goal - Goal object
 * @returns {string} Formatted summary
 */
export const formatGoalSummary = (goal) => {
  const { data, type } = goal;
  
  switch (type) {
    case 'retirement':
      return `Retire at ${data.retirementAge} with ₹${(data.targetCorpus || 0).toLocaleString('en-IN')}`;
    
    case 'childEducation':
      return `${data.educationLevel || 'Education'} by ${data.targetYear} - ₹${(data.targetAmount || 0).toLocaleString('en-IN')}`;
    
    case 'marriage':
      return `Marriage by ${data.targetYear} - ₹${(data.targetAmount || 0).toLocaleString('en-IN')}`;
    
    case 'carPurchase':
      return `${data.category || 'Car'} by ${data.targetYear} - ₹${(data.targetAmount || 0).toLocaleString('en-IN')}`;
    
    case 'custom':
      return `${data.goalName || 'Custom Goal'} by ${data.targetYear} - ₹${(data.targetAmount || 0).toLocaleString('en-IN')}`;
    
    default:
      return 'Goal details not available';
  }
};

/**
 * Validate client data structure matches expected schema
 * @param {object} clientData - Client data to validate
 * @returns {object} Validation result with details
 */
export const validateClientDataStructure = (clientData) => {
  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
    schemaMatches: {}
  };

  if (!clientData) {
    validation.isValid = false;
    validation.errors.push('Client data is missing');
    return validation;
  }

  // Check for enhanced financial goals structure
  const goals = clientData.enhancedFinancialGoals;
  if (!goals) {
    validation.warnings.push('enhancedFinancialGoals not found in client data');
    validation.schemaMatches.financialGoals = false;
  } else {
    validation.schemaMatches.financialGoals = true;
    
    // Validate individual goal structures
    const expectedGoalTypes = ['emergencyFund', 'childEducation', 'homePurchase', 'marriageOfDaughter', 'customGoals'];
    
    expectedGoalTypes.forEach(goalType => {
      if (goals[goalType]) {
        validation.schemaMatches[goalType] = true;
        
        // Check for proper nested structure
        if (goalType === 'childEducation' || goalType === 'homePurchase') {
          if (goals[goalType].isApplicable && !goals[goalType].details) {
            validation.warnings.push(`${goalType} marked as applicable but missing details object`);
          }
        }
        
        if (goalType === 'customGoals' && Array.isArray(goals[goalType])) {
          goals[goalType].forEach((goal, index) => {
            if (!goal.goalName || !goal.targetAmount) {
              validation.warnings.push(`Custom goal ${index + 1} missing required fields`);
            }
          });
        }
      } else {
        validation.schemaMatches[goalType] = false;
      }
    });
  }

  // Check for risk profile data
  if (clientData.enhancedFinancialGoals?.riskProfile) {
    validation.schemaMatches.riskProfile = true;
  } else {
    validation.warnings.push('Risk profile data not found');
    validation.schemaMatches.riskProfile = false;
  }

  console.log('📋 [goalDataHelpers] Client data structure validation:', validation);
  return validation;
};

/**
 * Validate if client data is sufficient for intelligent goal planning
 * @param {object} clientData - Client data to validate
 * @returns {object} Validation result with score and missing fields
 */
export const validateClientDataForGoalPlanning = (clientData) => {
  if (!clientData) {
    return {
      isValid: false,
      score: 0,
      missingFields: ['All client data'],
      warnings: ['No client data available for goal planning'],
      canProceed: false
    };
  }

  const requiredFields = [
    'firstName',
    'lastName', 
    'dateOfBirth',
    'totalMonthlyIncome',
    'totalMonthlyExpenses'
  ];

  const optionalButImportantFields = [
    'assets',
    'debtsAndLiabilities',
    'enhancedFinancialGoals',
    'enhancedRiskProfile',
    'numberOfDependents'
  ];

  let score = 0;
  const missingFields = [];
  const warnings = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (clientData[field]) {
      score += 20; // 20 points per required field (100 points total)
    } else {
      missingFields.push(field);
    }
  });

  // Check optional fields
  optionalButImportantFields.forEach(field => {
    if (clientData[field] && Object.keys(clientData[field]).length > 0) {
      score += 5; // Bonus points for optional fields
    }
  });

  // Specific validations
  if (clientData.totalMonthlyIncome && clientData.totalMonthlyIncome < 10000) {
    warnings.push('Monthly income seems unusually low');
  }

  if (clientData.totalMonthlyExpenses && clientData.totalMonthlyIncome && 
      clientData.totalMonthlyExpenses >= clientData.totalMonthlyIncome) {
    warnings.push('Monthly expenses equal or exceed income - no surplus for goal planning');
  }

  if (!clientData.assets || Object.keys(clientData.assets).length === 0) {
    warnings.push('No existing assets information available');
  }

  if (!clientData.enhancedFinancialGoals || Object.keys(clientData.enhancedFinancialGoals).length === 0) {
    warnings.push('No existing financial goals - will use intelligent defaults');
  }

  const canProceed = score >= 60; // Need at least 60% score to proceed with confidence
  const isValid = score >= 40; // Minimum 40% to proceed at all

  return {
    isValid,
    score: Math.min(score, 100),
    missingFields,
    warnings,
    canProceed,
    recommendation: getRecommendationBasedOnScore(score)
  };
};

/**
 * Get recommendation based on data quality score
 */
const getRecommendationBasedOnScore = (score) => {
  if (score >= 80) {
    return 'Excellent data quality - proceed with confidence';
  } else if (score >= 60) {
    return 'Good data quality - minor gaps can be addressed';
  } else if (score >= 40) {
    return 'Adequate data - consider updating missing information';
  } else {
    return 'Insufficient data - client data update recommended before planning';
  }
};

/**
 * Get data mapping suggestions for better integration
 * @param {object} clientData - Client data object
 * @returns {object} Mapping suggestions
 */
export const getDataMappingSuggestions = (clientData) => {
  const suggestions = {
    missingMappings: [],
    improvements: [],
    alternativeFields: {}
  };

  const validation = validateClientDataStructure(clientData);
  
  if (!validation.schemaMatches.financialGoals) {
    // Look for alternative goal data structures
    if (clientData.majorGoals) {
      suggestions.alternativeFields.majorGoals = 'Found legacy majorGoals array';
    }
    
    if (clientData.goals) {
      suggestions.alternativeFields.goals = 'Found alternative goals structure';
    }
  }

  // Check for missing goal type support
  Object.entries(validation.schemaMatches).forEach(([key, isPresent]) => {
    if (!isPresent && key !== 'financialGoals') {
      suggestions.missingMappings.push(`Consider adding support for ${key}`);
    }
  });

  return suggestions;
};