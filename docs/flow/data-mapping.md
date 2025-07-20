# Data Mapping & Integration

## Overview

This document defines how existing client data from the onboarding process maps to financial planning forms, how data synchronization works, and the backend API requirements for plan storage and management.

## Current Client Data Structure

Based on `docs/data/client-data.json`, the system collects data across 7 steps:

### Step 1: Personal Information
```javascript
{
  firstName: String,
  lastName: String, 
  email: String,
  phoneNumber: String,
  dateOfBirth: Date,
  panNumber: String,
  maritalStatus: String, // "Single", "Married", "Divorced", "Widowed"
  numberOfDependents: Number
}
```

### Step 2: Income & Expenses
```javascript
{
  totalMonthlyIncome: Number,
  incomeType: String, // "Salaried", "Business", "Freelance", "Mixed"
  totalMonthlyExpenses: Number,
  expenseBreakdown: {
    showBreakdown: Boolean,
    details: {
      housingRent: Number,
      foodGroceries: Number,
      transportation: Number,
      utilities: Number,
      entertainment: Number,
      healthcare: Number,
      otherExpenses: Number
    }
  }
}
```

### Step 3: Retirement Planning
```javascript
{
  retirementPlanning: {
    currentAge: Number, // calculated from dateOfBirth
    retirementAge: Number,
    hasRetirementCorpus: Boolean,
    currentRetirementCorpus: Number,
    targetRetirementCorpus: Number
  }
}
```

### Step 4: CAS & Investments
```javascript
{
  casData: {
    hasCAS: Boolean,
    casFile: File,
    casPassword: String,
    casStatus: String, // "uploaded", "parsing", "parsed", "error"
    parsedData: Object
  },
  assets: {
    investments: {
      equity: {
        mutualFunds: Number,
        directStocks: Number
      },
      fixedIncome: {
        ppf: Number,
        epf: Number,
        nps: Number,
        elss: Number,
        fixedDeposits: Number
      },
      others: Number
    }
  }
}
```

### Step 5: Debts & Liabilities
```javascript
{
  debtsAndLiabilities: {
    homeLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number,
      remainingTenure: Number
    },
    personalLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number
    },
    carLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number
    },
    educationLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number
    },
    goldLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number
    },
    creditCards: {
      hasLoan: Boolean,
      totalOutstanding: Number,
      averageInterestRate: Number,
      monthlyPayment: Number
    },
    businessLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number
    },
    otherLoans: {
      hasLoan: Boolean,
      loanType: String,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number
    }
  }
}
```

### Step 6: Insurance Coverage
```javascript
{
  insuranceCoverage: {
    lifeInsurance: {
      hasInsurance: Boolean,
      totalCoverAmount: Number,
      annualPremium: Number,
      insuranceType: String // "Term Life", "Whole Life", "ULIP", "Endowment", "Mixed"
    },
    healthInsurance: {
      hasInsurance: Boolean,
      totalCoverAmount: Number,
      annualPremium: Number,
      familyMembers: Number
    },
    vehicleInsurance: {
      hasInsurance: Boolean,
      annualPremium: Number
    },
    otherInsurance: {
      hasInsurance: Boolean,
      insuranceTypes: String,
      annualPremium: Number
    }
  }
}
```

### Step 7: Goals & Risk Profile
```javascript
{
  enhancedFinancialGoals: {
    emergencyFund: {
      priority: String, // "High", "Medium", "Low", "Not Applicable"
      targetAmount: Number
    },
    childEducation: {
      isApplicable: Boolean,
      targetAmount: Number,
      targetYear: Number
    },
    homePurchase: {
      isApplicable: Boolean,
      targetAmount: Number,
      targetYear: Number
    },
    customGoals: [{
      goalName: String,
      targetAmount: Number,
      targetYear: Number,
      priority: String // "High", "Medium", "Low"
    }]
  },
  enhancedRiskProfile: {
    investmentExperience: String, // "Beginner (0-2 years)", "Intermediate (2-5 years)", "Experienced (5-10 years)", "Expert (10+ years)"
    riskTolerance: String, // "Conservative", "Moderate", "Aggressive"
    monthlyInvestmentCapacity: Number
  }
}
```

## Financial Planning Data Mapping

### Cash Flow Planning Data Mapping

#### Pre-population Mapping
```javascript
// Cash Flow Planning Form Data Structure
const cashFlowPlanningForm = {
  // Map from existing client data
  clientData: {
    personalInfo: {
      name: `${client.firstName} ${client.lastName}`,
      age: calculateAge(client.dateOfBirth),
      panNumber: client.panNumber,
      dependents: client.numberOfDependents,
      maritalStatus: client.maritalStatus
    },
    financialInfo: {
      monthlyIncome: client.totalMonthlyIncome,
      monthlyExpenses: client.totalMonthlyExpenses,
      monthlySurplus: client.totalMonthlyIncome - client.totalMonthlyExpenses,
      incomeType: client.incomeType,
      expenseBreakdown: client.expenseBreakdown?.details || {}
    },
    currentInvestments: {
      mutualFunds: client.assets?.investments?.equity?.mutualFunds || 0,
      ppf: client.assets?.investments?.fixedIncome?.ppf || 0,
      epf: client.assets?.investments?.fixedIncome?.epf || 0,
      nps: client.assets?.investments?.fixedIncome?.nps || 0,
      elss: client.assets?.investments?.fixedIncome?.elss || 0,
      fixedDeposits: client.assets?.investments?.fixedIncome?.fixedDeposits || 0,
      directStocks: client.assets?.investments?.equity?.directStocks || 0
    },
    existingDebts: mapDebtsToArray(client.debtsAndLiabilities),
    insuranceCoverage: client.insuranceCoverage
  },
  
  // Advisor recommendations (to be filled)
  advisorRecommendations: {
    debtManagement: {
      debtStrategy: [], // Array of debt management recommendations
      totalEMIRecommended: Number,
      emiRatioTarget: Number,
      fixedExpenseRatioTarget: Number
    },
    emergencyFund: {
      recommendedAmount: Number,
      currentAmount: Number,
      monthlyTarget: Number,
      investmentVehicle: String
    },
    liquidInvestments: {
      amount: Number,
      purpose: String,
      investmentType: String
    },
    loanCapacity: {
      maxSafeLoan: Number,
      reasoning: String,
      conditions: String
    },
    savingsTargets: {
      minimumMonthlySavings: Number,
      postEmergencyFundSavings: Number,
      investmentAllocation: {
        equityPercentage: Number,
        debtPercentage: Number
      }
    },
    reviewSchedule: {
      frequency: String, // "1 month", "3 months", "6 months"
      nextReviewDate: Date
    },
    mutualFundRecommendations: [{
      fundName: String,
      fundId: String, // For API integration
      monthlyAmount: Number,
      category: String,
      reasoning: String
    }],
    oneTimeInvestments: [{
      fundName: String,
      fundId: String,
      amount: Number,
      purpose: String
    }],
    customVariables: [{
      variableName: String,
      value: Number,
      description: String
    }],
    notes: String
  },
  
  // AI recommendations (auto-generated)
  aiRecommendations: {
    debtManagement: {
      prioritizedDebts: [],
      optimizedEMIStructure: [],
      interestSavings: Number,
      timeReduction: Number
    },
    emergencyFundStrategy: {
      targetAmount: Number,
      timelineMonths: Number,
      monthlyAllocation: Number,
      recommendedFunds: []
    },
    investmentRecommendations: {
      riskProfile: String,
      assetAllocation: {
        equity: Number,
        debt: Number,
        gold: Number
      },
      fundRecommendations: [],
      expectedReturns: Number,
      timeHorizon: Number
    },
    cashFlowOptimization: {
      monthlySurplusAvailable: Number,
      optimalAllocation: {},
      futureProjections: {}
    }
  }
};
```

#### Helper Functions for Data Mapping
```javascript
// Convert debt objects to prioritized array
function mapDebtsToArray(debtsAndLiabilities) {
  const debts = [];
  
  Object.entries(debtsAndLiabilities).forEach(([debtType, debtInfo]) => {
    if (debtInfo.hasLoan || debtInfo.hasDebt) {
      debts.push({
        type: debtType,
        outstanding: debtInfo.outstandingAmount || debtInfo.totalOutstanding,
        monthlyEMI: debtInfo.monthlyEMI || debtInfo.monthlyPayment,
        interestRate: debtInfo.interestRate || debtInfo.averageInterestRate,
        remainingTenure: debtInfo.remainingTenure || null
      });
    }
  });
  
  // Sort by interest rate (descending)
  return debts.sort((a, b) => b.interestRate - a.interestRate);
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Calculate EMI ratio
function calculateEMIRatio(totalEMI, monthlyIncome) {
  return (totalEMI / monthlyIncome) * 100;
}

// Calculate fixed expense ratio
function calculateFixedExpenseRatio(totalExpenses, totalEMI, monthlyIncome) {
  return ((totalExpenses + totalEMI) / monthlyIncome) * 100;
}
```

### Goal Based Planning Data Mapping

#### Goal Selection Mapping
```javascript
// Map existing goals from onboarding
function mapExistingGoals(client) {
  const goals = [];
  
  // Retirement goal (always present)
  goals.push({
    type: 'retirement',
    isSelected: true,
    data: {
      currentAge: calculateAge(client.dateOfBirth),
      retirementAge: client.retirementPlanning?.retirementAge || 60,
      currentSalary: client.totalMonthlyIncome,
      currentExpenses: client.totalMonthlyExpenses,
      existingCorpus: client.retirementPlanning?.currentRetirementCorpus || 0,
      targetCorpus: client.retirementPlanning?.targetRetirementCorpus || 0
    }
  });
  
  // Child education goal
  if (client.enhancedFinancialGoals?.childEducation?.isApplicable) {
    goals.push({
      type: 'childEducation',
      isSelected: true,
      data: {
        targetAmount: client.enhancedFinancialGoals.childEducation.targetAmount,
        targetYear: client.enhancedFinancialGoals.childEducation.targetYear,
        currentAge: null, // To be filled by advisor
        educationLevel: null // To be selected
      }
    });
  }
  
  // Home purchase goal
  if (client.enhancedFinancialGoals?.homePurchase?.isApplicable) {
    goals.push({
      type: 'homePurchase',
      isSelected: true,
      data: {
        targetAmount: client.enhancedFinancialGoals.homePurchase.targetAmount,
        targetYear: client.enhancedFinancialGoals.homePurchase.targetYear,
        downPaymentPercentage: 20, // Default
        loanTenure: 20 // Default
      }
    });
  }
  
  // Custom goals
  if (client.enhancedFinancialGoals?.customGoals?.length > 0) {
    client.enhancedFinancialGoals.customGoals.forEach(goal => {
      goals.push({
        type: 'custom',
        isSelected: true,
        data: {
          goalName: goal.goalName,
          targetAmount: goal.targetAmount,
          targetYear: goal.targetYear,
          priority: goal.priority,
          flexibility: 'Medium' // Default
        }
      });
    });
  }
  
  return goals;
}
```

## Data Synchronization Rules

### Real-time Synchronization
When data is edited in planning forms:

```javascript
// Data sync function
async function syncClientData(clientId, updatedFields, planningContext) {
  try {
    // 1. Update client master record
    await updateClientData(clientId, updatedFields);
    
    // 2. Recalculate derived fields
    const calculatedFields = recalculateFields(updatedFields);
    await updateCalculatedFields(clientId, calculatedFields);
    
    // 3. Update any dependent plans
    await updateDependentPlans(clientId, updatedFields);
    
    // 4. Log the change for audit
    await logDataChange(clientId, updatedFields, planningContext);
    
    // 5. Notify real-time updates to UI
    broadcastUpdate(clientId, updatedFields);
    
    return { success: true, updatedFields, calculatedFields };
  } catch (error) {
    console.error('Data sync failed:', error);
    throw new Error('Failed to synchronize client data');
  }
}

// Calculated fields update
function recalculateFields(updatedFields) {
  const calculated = {};
  
  if (updatedFields.totalMonthlyIncome || updatedFields.totalMonthlyExpenses) {
    calculated.monthlySurplus = 
      (updatedFields.totalMonthlyIncome || 0) - 
      (updatedFields.totalMonthlyExpenses || 0);
  }
  
  if (updatedFields.debtsAndLiabilities) {
    calculated.totalMonthlyEMIs = calculateTotalEMIs(updatedFields.debtsAndLiabilities);
    calculated.emiRatio = calculateEMIRatio(
      calculated.totalMonthlyEMIs, 
      updatedFields.totalMonthlyIncome
    );
  }
  
  if (updatedFields.assets) {
    calculated.totalInvestmentValue = calculateTotalInvestments(updatedFields.assets);
  }
  
  if (updatedFields.dateOfBirth) {
    calculated.currentAge = calculateAge(updatedFields.dateOfBirth);
  }
  
  return calculated;
}
```

### Data Validation Rules
```javascript
const validationRules = {
  // Income validations
  totalMonthlyIncome: {
    min: 10000,
    max: 10000000,
    required: true
  },
  
  // EMI ratio validation
  emiRatio: {
    warning: 35, // Show warning above 35%
    error: 50    // Block above 50%
  },
  
  // Age validations
  currentAge: {
    min: 18,
    max: 80
  },
  
  // Investment validations
  monthlyInvestmentCapacity: {
    max: 'monthlySurplus * 0.8' // Can't invest more than 80% of surplus
  },
  
  // Goal validations
  retirementAge: {
    min: 'currentAge + 5',
    max: 75
  },
  
  targetYear: {
    min: 'currentYear + 1',
    max: 'currentYear + 50'
  }
};
```

## Backend API Requirements

### Financial Plans API Structure

#### Plan Schema
```javascript
// MongoDB Schema for Financial Plans
const FinancialPlanSchema = {
  _id: ObjectId,
  clientId: ObjectId, // Reference to Client collection
  planType: String, // "cash_flow", "goal_based", "hybrid"
  status: String, // "draft", "active", "completed", "archived"
  version: Number, // For plan versioning
  
  // Metadata
  createdDate: Date,
  createdBy: ObjectId, // Advisor ID
  lastModifiedDate: Date,
  lastModifiedBy: ObjectId,
  
  // Client data snapshot at plan creation
  clientDataSnapshot: {
    personalInfo: Object,
    financialInfo: Object,
    investments: Object,
    debts: Object,
    insurance: Object,
    goals: Object,
    riskProfile: Object
  },
  
  // Plan-specific data
  planDetails: {
    // For Cash Flow Planning
    cashFlowPlan: {
      debtManagement: Object,
      emergencyFundStrategy: Object,
      investmentRecommendations: Object,
      cashFlowOptimization: Object
    },
    
    // For Goal Based Planning
    goalBasedPlan: {
      selectedGoals: Array,
      goalSpecificPlans: Object,
      prioritizationMatrix: Object,
      implementationRoadmap: Object
    },
    
    // For Hybrid Planning
    hybridPlan: {
      cashFlowComponent: Object,
      goalBasedComponent: Object,
      integrationStrategy: Object
    }
  },
  
  // Recommendations
  advisorRecommendations: Object,
  aiRecommendations: Object,
  
  // Review and monitoring
  reviewSchedule: {
    frequency: String,
    nextReviewDate: Date,
    lastReviewDate: Date
  },
  
  // Performance tracking
  performanceMetrics: {
    goalProgress: Array,
    investmentPerformance: Object,
    planAdherence: Object,
    milestones: Array
  },
  
  // Audit trail
  changeHistory: [{
    changeDate: Date,
    changedBy: ObjectId,
    changeType: String,
    oldValues: Object,
    newValues: Object,
    reason: String
  }]
};
```

#### Core API Endpoints

```javascript
// Plan Management APIs
POST   /api/plans                    // Create new plan
GET    /api/plans/:planId            // Get plan by ID
PUT    /api/plans/:planId            // Update plan
DELETE /api/plans/:planId            // Delete plan (soft delete)

// Client-specific plan APIs
GET    /api/clients/:clientId/plans  // Get all plans for client
POST   /api/clients/:clientId/plans  // Create plan for client

// Plan lifecycle APIs
POST   /api/plans/:planId/activate   // Activate draft plan
POST   /api/plans/:planId/complete   // Mark plan as completed
POST   /api/plans/:planId/archive    // Archive plan

// Plan versioning APIs
GET    /api/plans/:planId/versions   // Get all versions
POST   /api/plans/:planId/version    // Create new version
GET    /api/plans/:planId/version/:v // Get specific version

// Plan review APIs
GET    /api/plans/:planId/reviews    // Get review history
POST   /api/plans/:planId/reviews    // Add review entry
PUT    /api/plans/:planId/reviews/:reviewId // Update review

// Performance tracking APIs
GET    /api/plans/:planId/performance // Get performance metrics
POST   /api/plans/:planId/milestones // Add milestone
PUT    /api/plans/:planId/progress   // Update progress

// Data synchronization APIs
POST   /api/clients/:clientId/sync   // Sync client data changes
GET    /api/clients/:clientId/changes // Get recent changes
```

#### API Implementation Examples

```javascript
// Create Financial Plan
app.post('/api/clients/:clientId/plans', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { planType, planDetails, advisorRecommendations } = req.body;
    
    // Get current client data
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Create plan with client data snapshot
    const plan = new FinancialPlan({
      clientId,
      planType,
      status: 'draft',
      version: 1,
      createdBy: req.user.id,
      clientDataSnapshot: {
        personalInfo: extractPersonalInfo(client),
        financialInfo: extractFinancialInfo(client),
        investments: client.assets?.investments || {},
        debts: client.debtsAndLiabilities || {},
        insurance: client.insuranceCoverage || {},
        goals: client.enhancedFinancialGoals || {},
        riskProfile: client.enhancedRiskProfile || {}
      },
      planDetails,
      advisorRecommendations,
      aiRecommendations: await generateAIRecommendations(client, planType, planDetails)
    });
    
    await plan.save();
    
    res.status(201).json({
      success: true,
      plan: plan,
      message: 'Financial plan created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync client data changes
app.post('/api/clients/:clientId/sync', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { updatedFields, planningContext } = req.body;
    
    // Update client data
    await Client.findByIdAndUpdate(clientId, updatedFields);
    
    // Recalculate derived fields
    const calculatedFields = recalculateFields(updatedFields);
    await Client.findByIdAndUpdate(clientId, calculatedFields);
    
    // Update dependent plans
    const activePlans = await FinancialPlan.find({ 
      clientId, 
      status: { $in: ['draft', 'active'] }
    });
    
    for (let plan of activePlans) {
      // Update AI recommendations based on new data
      plan.aiRecommendations = await generateAIRecommendations(
        await Client.findById(clientId), 
        plan.planType, 
        plan.planDetails
      );
      
      // Log the change
      plan.changeHistory.push({
        changeDate: new Date(),
        changedBy: req.user.id,
        changeType: 'client_data_update',
        oldValues: {},
        newValues: updatedFields,
        reason: planningContext
      });
      
      await plan.save();
    }
    
    res.json({
      success: true,
      updatedFields,
      calculatedFields,
      affectedPlans: activePlans.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Integration Testing

### Data Consistency Tests
```javascript
// Test data synchronization
describe('Data Synchronization', () => {
  it('should update client data when changed in planning form', async () => {
    const client = await createTestClient();
    const updates = { totalMonthlyIncome: 80000 };
    
    await syncClientData(client._id, updates, 'planning_form_edit');
    
    const updatedClient = await Client.findById(client._id);
    expect(updatedClient.totalMonthlyIncome).toBe(80000);
  });
  
  it('should recalculate dependent fields correctly', async () => {
    const client = await createTestClient();
    const updates = { 
      totalMonthlyIncome: 80000,
      totalMonthlyExpenses: 50000 
    };
    
    await syncClientData(client._id, updates, 'income_update');
    
    const updatedClient = await Client.findById(client._id);
    expect(updatedClient.monthlySurplus).toBe(30000);
  });
});

// Test plan creation
describe('Plan Creation', () => {
  it('should create plan with correct client data snapshot', async () => {
    const client = await createTestClient();
    const planData = {
      planType: 'cash_flow',
      planDetails: {},
      advisorRecommendations: {}
    };
    
    const plan = await createFinancialPlan(client._id, planData);
    
    expect(plan.clientDataSnapshot.personalInfo.age).toBeDefined();
    expect(plan.clientDataSnapshot.financialInfo.monthlySurplus).toBeDefined();
  });
});
```

This data mapping structure ensures seamless integration between client onboarding data and financial planning workflows while maintaining data consistency and providing robust backend support for plan management and monitoring.