/**
 * Goal-Based Planning Formatters
 * Utility functions for formatting goal data and currency
 */

/**
 * Format currency in Indian format
 * @param {number} amount - Amount to format
 * @param {boolean} showDecimals - Whether to show decimal places
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showDecimals = false) => {
  if (!amount || amount === 0) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(amount);
};

/**
 * Format large amounts in lakhs/crores
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount (e.g., "₹25L", "₹1.5Cr")
 */
export const formatLargeAmount = (amount) => {
  if (!amount || amount === 0) return '₹0';
  
  if (amount >= 10000000) { // 1 crore or more
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh or more
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand or more
    return `₹${(amount / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(amount);
  }
};

/**
 * Format percentage
 * @param {number} percentage - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (percentage, decimals = 1) => {
  if (percentage === null || percentage === undefined) return '0%';
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format time duration in years and months
 * @param {number} years - Time in years (can be decimal)
 * @returns {string} Formatted duration
 */
export const formatDuration = (years) => {
  if (!years) return '0 years';
  
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  
  if (wholeYears === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}`;
  } else {
    return `${wholeYears} year${wholeYears !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  }
};

/**
 * Get goal category display info
 * @param {string} goalType - Type of goal
 * @returns {object} Display information for goal
 */
export const getGoalDisplayInfo = (goalType) => {
  const goalInfo = {
    retirement: {
      icon: '🏖️',
      title: 'Retirement Planning',
      description: 'Plan for your retirement lifestyle',
      color: '#16a34a',
      bgColor: '#f0fdf4'
    },
    childEducation: {
      icon: '🎓',
      title: 'Child Education',
      description: 'Fund your child\'s higher education',
      color: '#2563eb',
      bgColor: '#eff6ff'
    },
    marriage: {
      icon: '💒',
      title: 'Marriage of Daughter',
      description: 'Save for your daughter\'s wedding',
      color: '#dc2626',
      bgColor: '#fef2f2'
    },
    carPurchase: {
      icon: '🚗',
      title: 'Buy a Car',
      description: 'Purchase your dream car',
      color: '#7c3aed',
      bgColor: '#f3e8ff'
    },
    custom: {
      icon: '⚙️',
      title: 'Custom Goal',
      description: 'Create your personalized financial goal',
      color: '#ea580c',
      bgColor: '#fff7ed'
    }
  };
  
  return goalInfo[goalType] || goalInfo.custom;
};

/**
 * Format goal status
 * @param {object} goal - Goal object
 * @returns {object} Status information
 */
export const getGoalStatus = (goal) => {
  if (!goal.monthlySIP || !goal.availableSurplus) {
    return { status: 'pending', label: 'Not Started', color: '#6b7280' };
  }
  
  const affordabilityRatio = goal.monthlySIP / goal.availableSurplus;
  
  if (affordabilityRatio <= 1) {
    return { status: 'on-track', label: 'On Track', color: '#16a34a' };
  } else if (affordabilityRatio <= 1.2) {
    return { status: 'challenging', label: 'Challenging', color: '#f59e0b' };
  } else {
    return { status: 'deficit', label: 'Needs Adjustment', color: '#dc2626' };
  }
};

/**
 * Format investment recommendation
 * @param {object} riskProfile - Risk profile object
 * @returns {string} Investment recommendation text
 */
export const formatInvestmentRecommendation = (riskProfile) => {
  if (!riskProfile) return '';
  
  const { profile, equityAllocation, debtAllocation, expectedReturn } = riskProfile;
  
  return `${profile} approach with ${equityAllocation}% equity and ${debtAllocation}% debt allocation, targeting ${expectedReturn}% annual returns.`;
};

/**
 * Format goal priority
 * @param {string} priority - Priority level
 * @returns {object} Priority display info
 */
export const formatGoalPriority = (priority) => {
  const priorityInfo = {
    'High': { label: 'High Priority', color: '#dc2626', bgColor: '#fef2f2' },
    'Medium': { label: 'Medium Priority', color: '#f59e0b', bgColor: '#fef3c7' },
    'Low': { label: 'Low Priority', color: '#16a34a', bgColor: '#f0fdf4' }
  };
  
  return priorityInfo[priority] || priorityInfo['Medium'];
};

/**
 * Format date in Indian format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format goal timeline display
 * @param {number} startYear - Start year
 * @param {number} targetYear - Target year  
 * @returns {string} Timeline display
 */
export const formatGoalTimeline = (startYear, targetYear) => {
  if (!targetYear) return '';
  
  const currentYear = new Date().getFullYear();
  const yearsRemaining = targetYear - currentYear;
  
  if (yearsRemaining <= 0) {
    return 'Target date reached';
  } else if (yearsRemaining === 1) {
    return '1 year remaining';
  } else {
    return `${yearsRemaining} years remaining`;
  }
};

/**
 * Get education level cost estimates
 * @param {string} educationLevel - Type of education
 * @returns {number} Estimated current cost
 */
export const getEducationCostEstimate = (educationLevel) => {
  const estimates = {
    'Engineering': 2500000, // 25 lakhs
    'Medical': 5000000,     // 50 lakhs  
    'MBA': 2000000,         // 20 lakhs
    'General Graduation': 500000, // 5 lakhs
    'Post Graduation': 800000,    // 8 lakhs
    'Professional Course': 1500000, // 15 lakhs
    'Study Abroad': 7500000  // 75 lakhs
  };
  
  return estimates[educationLevel] || 2500000;
};

/**
 * Get car category price estimates
 * @param {string} carCategory - Type of car
 * @returns {number} Estimated current price
 */
export const getCarPriceEstimate = (carCategory) => {
  const estimates = {
    'Hatchback': 700000,      // 7 lakhs
    'Sedan': 1200000,         // 12 lakhs
    'SUV': 1800000,           // 18 lakhs
    'Premium SUV': 3000000,   // 30 lakhs
    'Luxury Car': 5000000,    // 50 lakhs
    'Electric Vehicle': 1500000 // 15 lakhs
  };
  
  return estimates[carCategory] || 1500000;
};