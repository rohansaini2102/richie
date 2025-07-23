/**
 * Goal-Based Planning Calculations
 * Contains all mathematical functions for goal planning calculations
 */

/**
 * Calculate monthly SIP required for a future value goal
 * @param {number} targetAmount - Target future value
 * @param {number} timeInYears - Time horizon in years
 * @param {number} expectedReturn - Expected annual return rate (as percentage)
 * @returns {number} Monthly SIP amount required
 */
export const calculateMonthlySIP = (targetAmount, timeInYears, expectedReturn) => {
  if (!targetAmount || !timeInYears || !expectedReturn) return 0;
  
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = timeInYears * 12;
  
  if (monthlyRate === 0) {
    return targetAmount / totalMonths;
  }
  
  const numerator = targetAmount * monthlyRate;
  const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
  
  return numerator / denominator;
};

/**
 * Calculate future value of current investments
 * @param {number} currentValue - Current investment value
 * @param {number} timeInYears - Time horizon in years
 * @param {number} expectedReturn - Expected annual return rate (as percentage)
 * @returns {number} Future value of current investments
 */
export const calculateFutureValue = (currentValue, timeInYears, expectedReturn) => {
  if (!currentValue || !timeInYears || !expectedReturn) return 0;
  
  const annualRate = expectedReturn / 100;
  return currentValue * Math.pow(1 + annualRate, timeInYears);
};

/**
 * Calculate inflation-adjusted target amount
 * @param {number} currentCost - Current cost/amount
 * @param {number} timeInYears - Time horizon in years  
 * @param {number} inflationRate - Annual inflation rate (as percentage)
 * @returns {number} Inflation-adjusted target amount
 */
export const calculateInflationAdjustedAmount = (currentCost, timeInYears, inflationRate) => {
  if (!currentCost || !timeInYears || !inflationRate) return currentCost || 0;
  
  const rate = inflationRate / 100;
  return currentCost * Math.pow(1 + rate, timeInYears);
};

/**
 * Calculate retirement corpus required
 * @param {number} monthlyExpenses - Current monthly expenses
 * @param {number} lifestyleFactor - Percentage of current lifestyle (as percentage)
 * @param {number} yearsToRetirement - Years until retirement
 * @param {number} yearsInRetirement - Expected years in retirement
 * @param {number} inflationRate - Annual inflation rate (as percentage)
 * @returns {object} Retirement calculation details
 */
export const calculateRetirementCorpus = (
  monthlyExpenses, 
  lifestyleFactor, 
  yearsToRetirement, 
  yearsInRetirement, 
  inflationRate
) => {
  if (!monthlyExpenses || !lifestyleFactor || !yearsToRetirement || !yearsInRetirement) {
    return { monthlyNeedAtRetirement: 0, totalCorpusRequired: 0 };
  }
  
  // Calculate monthly need at retirement (inflation adjusted)
  const monthlyNeedAtRetirement = monthlyExpenses * 
    (lifestyleFactor / 100) * 
    Math.pow(1 + inflationRate / 100, yearsToRetirement);
  
  // Calculate total corpus (using 4% withdrawal rule approximation)
  const totalCorpusRequired = monthlyNeedAtRetirement * 12 * 25; // 25 years coverage
  
  return {
    monthlyNeedAtRetirement,
    totalCorpusRequired
  };
};

/**
 * Calculate education cost with inflation
 * @param {number} currentCost - Current education cost
 * @param {number} yearsToEducation - Years until education starts
 * @param {number} educationInflation - Education inflation rate (as percentage)
 * @returns {number} Future education cost
 */
export const calculateEducationCost = (currentCost, yearsToEducation, educationInflation = 10) => {
  return calculateInflationAdjustedAmount(currentCost, yearsToEducation, educationInflation);
};

/**
 * Calculate car purchase cost with auto inflation
 * @param {number} currentPrice - Current car price
 * @param {number} yearsToPurchase - Years until purchase
 * @param {number} autoInflation - Auto inflation rate (as percentage)
 * @returns {object} Car purchase calculation details
 */
export const calculateCarPurchaseCost = (currentPrice, yearsToPurchase, autoInflation = 6) => {
  if (!currentPrice || !yearsToPurchase) return { futurePrice: 0, downPayment: 0, loanAmount: 0 };
  
  const futurePrice = calculateInflationAdjustedAmount(currentPrice, yearsToPurchase, autoInflation);
  const downPayment = futurePrice * 0.2; // 20% down payment
  const loanAmount = futurePrice - downPayment;
  
  return {
    futurePrice,
    downPayment,
    loanAmount
  };
};

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} Current age
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
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
 * Get risk profile recommendation based on age and goal timeline
 * @param {number} age - Current age
 * @param {number} timeHorizon - Goal time horizon in years
 * @returns {object} Risk profile recommendation
 */
export const getRiskProfileRecommendation = (age, timeHorizon) => {
  if (timeHorizon < 3) {
    return {
      profile: 'Conservative',
      equityAllocation: 20,
      debtAllocation: 80,
      expectedReturn: 8
    };
  } else if (timeHorizon < 7) {
    return {
      profile: 'Moderate',
      equityAllocation: 60,
      debtAllocation: 40,
      expectedReturn: 10
    };
  } else if (age < 35) {
    return {
      profile: 'Aggressive',
      equityAllocation: 80,
      debtAllocation: 20,
      expectedReturn: 12
    };
  } else if (age < 45) {
    return {
      profile: 'Moderate-Aggressive',
      equityAllocation: 70,
      debtAllocation: 30,
      expectedReturn: 11
    };
  } else {
    return {
      profile: 'Moderate',
      equityAllocation: 60,
      debtAllocation: 40,
      expectedReturn: 10
    };
  }
};

/**
 * Calculate goal priority score for optimization
 * @param {object} goal - Goal object with priority, timeline, amount
 * @returns {number} Priority score (higher = more important)
 */
export const calculateGoalPriorityScore = (goal) => {
  const priorityWeights = {
    'High': 3,
    'Medium': 2,
    'Low': 1
  };
  
  const timelineWeight = goal.timeInYears < 5 ? 2 : 1; // Urgent goals get higher weight
  const priorityWeight = priorityWeights[goal.priority] || 1;
  
  return priorityWeight * timelineWeight;
};

/**
 * Optimize multiple goals based on available surplus
 * @param {Array} goals - Array of goal objects
 * @param {number} monthlySurplus - Available monthly surplus
 * @returns {object} Optimization strategy
 */
export const optimizeMultipleGoals = (goals, monthlySurplus) => {
  if (!goals?.length || !monthlySurplus) {
    return { optimizedGoals: [], phases: [], totalRequired: 0, deficit: 0 };
  }
  
  // Calculate total SIP required
  const totalRequired = goals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
  const deficit = Math.max(0, totalRequired - monthlySurplus);
  
  // Sort goals by priority score
  const sortedGoals = [...goals].sort((a, b) => 
    calculateGoalPriorityScore(b) - calculateGoalPriorityScore(a)
  );
  
  // Create phases based on timeline and priority
  const phases = [];
  let currentPhase = [];
  let currentPhaseEnd = 0;
  
  sortedGoals.forEach(goal => {
    if (goal.timeInYears <= currentPhaseEnd + 3 && currentPhase.length > 0) {
      currentPhase.push(goal);
    } else {
      if (currentPhase.length > 0) {
        phases.push({
          name: `Phase ${phases.length + 1}`,
          timeframe: `Years ${currentPhaseEnd + 1}-${currentPhaseEnd + 3}`,
          goals: [...currentPhase]
        });
      }
      currentPhase = [goal];
      currentPhaseEnd = Math.ceil(goal.timeInYears / 3) * 3;
    }
  });
  
  if (currentPhase.length > 0) {
    phases.push({
      name: `Phase ${phases.length + 1}`,
      timeframe: `Years ${currentPhaseEnd + 1}+`,
      goals: currentPhase
    });
  }
  
  return {
    optimizedGoals: sortedGoals,
    phases,
    totalRequired,
    deficit,
    canAffordAll: deficit === 0
  };
};

/**
 * Calculate required monthly SIP for a goal
 * @param {number} targetAmount - Target amount for the goal
 * @param {number} years - Number of years to achieve goal
 * @param {number} expectedReturn - Expected annual return (as percentage)
 * @returns {number} Required monthly SIP
 */
export const calculateRequiredSIP = (targetAmount, years, expectedReturn = 12) => {
  if (!targetAmount || !years || years <= 0) return 0;
  
  const monthlyRate = expectedReturn / 100 / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) {
    return Math.round(targetAmount / months);
  }
  
  const sip = targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(sip);
};

/**
 * Calculate goal achievement timeline with current SIP
 * @param {number} targetAmount - Target amount for the goal
 * @param {number} monthlySIP - Current monthly SIP
 * @param {number} expectedReturn - Expected annual return (as percentage)
 * @returns {number} Years required to achieve goal
 */
export const calculateGoalTimeline = (targetAmount, monthlySIP, expectedReturn = 12) => {
  if (!targetAmount || !monthlySIP || monthlySIP <= 0) return 0;
  
  const monthlyRate = expectedReturn / 100 / 12;
  
  if (monthlyRate === 0) {
    return targetAmount / (monthlySIP * 12);
  }
  
  const months = Math.log(1 + (targetAmount * monthlyRate) / monthlySIP) / Math.log(1 + monthlyRate);
  return Math.ceil(months / 12);
};

/**
 * Detect timeline conflicts between goals
 * @param {Array} goals - Array of goal objects with targetYear
 * @returns {Array} Array of conflicts
 */
export const detectTimelineConflicts = (goals) => {
  const conflicts = [];
  const currentYear = new Date().getFullYear();
  
  // Group goals by year
  const goalsByYear = {};
  goals.forEach(goal => {
    const year = goal.targetYear || currentYear + 5;
    if (!goalsByYear[year]) {
      goalsByYear[year] = [];
    }
    goalsByYear[year].push(goal);
  });
  
  // Check for conflicts (multiple high-value goals in same year)
  Object.entries(goalsByYear).forEach(([year, goalsInYear]) => {
    if (goalsInYear.length > 1) {
      const totalAmount = goalsInYear.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
      if (totalAmount > 2000000) { // Significant amount threshold
        conflicts.push({
          year: parseInt(year),
          goals: goalsInYear.map(g => g.title || g.goalName),
          totalAmount,
          severity: totalAmount > 5000000 ? 'High' : 'Medium'
        });
      }
    }
  });
  
  return conflicts;
};

/**
 * Get asset allocation based on goal timeline and risk profile
 * @param {number} timelineYears - Goal timeline in years
 * @param {string} riskProfile - Client's risk profile
 * @returns {object} Asset allocation recommendation
 */
export const getAssetAllocation = (timelineYears, riskProfile = 'Moderate') => {
  const allocations = {
    Conservative: {
      short: { equity: 20, debt: 80 },
      medium: { equity: 40, debt: 60 },
      long: { equity: 60, debt: 40 }
    },
    Moderate: {
      short: { equity: 30, debt: 70 },
      medium: { equity: 60, debt: 40 },
      long: { equity: 70, debt: 30 }
    },
    Aggressive: {
      short: { equity: 40, debt: 60 },
      medium: { equity: 70, debt: 30 },
      long: { equity: 80, debt: 20 }
    }
  };
  
  const profile = allocations[riskProfile] || allocations.Moderate;
  
  if (timelineYears <= 3) {
    return { ...profile.short, expectedReturn: 8 };
  } else if (timelineYears <= 7) {
    return { ...profile.medium, expectedReturn: 10 };
  } else {
    return { ...profile.long, expectedReturn: 12 };
  }
};

/**
 * Calculate tax savings for investments
 * @param {number} investmentAmount - Annual investment amount
 * @param {string} investmentType - Type of investment (ELSS, PPF, etc.)
 * @param {number} taxBracket - Tax bracket percentage
 * @returns {object} Tax savings details
 */
export const calculateTaxSavings = (investmentAmount, investmentType, taxBracket = 30) => {
  const section80CLimit = 150000;
  const section80CCDLimit = 50000;
  
  let eligibleAmount = 0;
  let section = '';
  
  switch (investmentType) {
    case 'ELSS':
    case 'PPF':
    case 'EPF':
      eligibleAmount = Math.min(investmentAmount, section80CLimit);
      section = '80C';
      break;
    case 'NPS':
      eligibleAmount = Math.min(investmentAmount, section80CLimit + section80CCDLimit);
      section = '80C + 80CCD';
      break;
    default:
      eligibleAmount = 0;
  }
  
  const taxSaved = (eligibleAmount * taxBracket) / 100;
  
  return {
    eligibleAmount,
    taxSaved,
    section,
    effectiveReturn: investmentAmount > 0 ? (taxSaved / investmentAmount) * 100 : 0
  };
};

/**
 * Generate goal milestones for tracking
 * @param {number} targetAmount - Goal target amount
 * @param {number} years - Timeline in years
 * @param {number} monthlySIP - Monthly investment
 * @param {number} expectedReturn - Expected annual return
 * @returns {Array} Milestone array
 */
export const generateGoalMilestones = (targetAmount, years, monthlySIP, expectedReturn = 12) => {
  const milestones = [];
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = years * 12;
  
  // Generate milestones at 25%, 50%, 75%, and 100%
  const checkpoints = [0.25, 0.5, 0.75, 1.0];
  
  checkpoints.forEach(checkpoint => {
    const targetValue = targetAmount * checkpoint;
    let accumulated = 0;
    let months = 0;
    
    // Calculate when this milestone will be reached
    while (accumulated < targetValue && months < totalMonths) {
      months++;
      accumulated = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }
    
    if (months <= totalMonths) {
      milestones.push({
        percentage: checkpoint * 100,
        targetValue,
        monthsRequired: months,
        year: new Date().getFullYear() + Math.floor(months / 12),
        onTrack: true
      });
    }
  });
  
  return milestones;
};