const mongoose = require('mongoose');

const financialPlanSchema = new mongoose.Schema({
  // References
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true
  },

  // Plan metadata
  planType: {
    type: String,
    enum: ['cash_flow', 'goal_based', 'hybrid', 'adaptive'],
    required: true,
    default: 'cash_flow'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },

  // Client data snapshot at plan creation
  clientDataSnapshot: {
    personalInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      dateOfBirth: Date,
      panNumber: String,
      maritalStatus: String,
      numberOfDependents: Number
    },
    financialInfo: {
      totalMonthlyIncome: Number,
      totalMonthlyExpenses: Number,
      incomeType: String,
      expenseBreakdown: {
        housingRent: Number,
        foodGroceries: Number,
        transportation: Number,
        utilities: Number,
        entertainment: Number,
        healthcare: Number,
        otherExpenses: Number
      }
    },
    investments: {
      mutualFunds: {
        totalValue: Number,
        monthlyInvestment: Number
      },
      directStocks: {
        totalValue: Number
      },
      ppf: {
        currentBalance: Number,
        annualContribution: Number
      },
      epf: {
        currentBalance: Number
      },
      nps: {
        currentBalance: Number
      },
      elss: {
        currentValue: Number
      },
      fixedDeposits: {
        totalValue: Number
      },
      otherInvestments: {
        totalValue: Number
      }
    },
    debtsAndLiabilities: {
      homeLoan: {
        outstandingAmount: Number,
        monthlyEMI: Number,
        interestRate: Number,
        remainingTenure: Number
      },
      personalLoan: {
        outstandingAmount: Number,
        monthlyEMI: Number,
        interestRate: Number
      },
      carLoan: {
        outstandingAmount: Number,
        monthlyEMI: Number,
        interestRate: Number
      },
      educationLoan: {
        outstandingAmount: Number,
        monthlyEMI: Number,
        interestRate: Number
      },
      creditCards: {
        totalOutstanding: Number,
        averageInterestRate: Number,
        monthlyPayment: Number
      },
      otherLoans: {
        outstandingAmount: Number,
        monthlyEMI: Number,
        interestRate: Number
      }
    },
    calculatedMetrics: {
      totalMonthlyEMIs: Number,
      monthlySurplus: Number,
      emiRatio: Number,
      fixedExpenditureRatio: Number,
      savingsRate: Number,
      netWorth: Number,
      debtToIncomeRatio: Number
    }
  },

  // Strategy-specific data
  planDetails: {
    // Cash Flow Planning Details
    cashFlowPlan: {
      debtManagement: {
        prioritizedDebts: [{
          debtType: String,
          outstandingAmount: Number,
          currentEMI: Number,
          recommendedEMI: Number,
          interestRate: Number,
          priorityRank: Number,
          reason: String,
          projectedSavings: Number,
          revisedTenure: Number
        }],
        totalDebtReduction: Number,
        totalInterestSavings: Number,
        debtFreeDate: Date
      },
      emergencyFundStrategy: {
        targetAmount: Number,
        currentAmount: Number,
        gap: Number,
        monthlyAllocation: Number,
        timeline: Number,
        investmentType: String,
        fundRecommendations: [String]
      },
      investmentRecommendations: {
        monthlyInvestments: [{
          fundName: String,
          fundType: String,
          category: String,
          monthlyAmount: Number,
          purpose: String,
          expectedReturn: Number,
          riskLevel: String
        }],
        assetAllocation: {
          equity: Number,
          debt: Number,
          gold: Number,
          others: Number
        },
        totalMonthlyInvestment: Number,
        projectedCorpus: {
          year1: Number,
          year3: Number,
          year5: Number,
          year10: Number
        }
      },
      cashFlowMetrics: {
        currentEmiRatio: Number,
        targetEmiRatio: Number,
        currentSavingsRate: Number,
        targetSavingsRate: Number,
        currentFixedExpenditureRatio: Number,
        targetFixedExpenditureRatio: Number,
        financialHealthScore: Number
      },
      actionItems: [{
        action: String,
        priority: String,
        timeline: String,
        status: String,
        completionDate: Date
      }]
    },

    // Goal Based Planning (for future use)
    goalBasedPlan: {
      selectedGoals: [{
        goalName: String,
        targetAmount: Number,
        targetDate: Date,
        priority: String,
        monthlyAllocation: Number,
        investmentStrategy: String
      }],
      goalSpecificPlans: {}
    },

    // Hybrid Planning (for future use)
    hybridPlan: {
      cashFlowComponent: {},
      goalBasedComponent: {}
    }
  },

  // Recommendations
  advisorRecommendations: {
    keyPoints: [String],
    detailedNotes: String,
    customVariables: [{
      variableName: String,
      value: mongoose.Schema.Types.Mixed,
      description: String
    }]
  },
  
  aiRecommendations: {
    debtStrategy: String,
    emergencyFundAnalysis: String,
    investmentAnalysis: String,
    cashFlowOptimization: String,
    riskWarnings: [String],
    opportunities: [String]
  },

  // Review & tracking
  reviewSchedule: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi-annually', 'annually'],
      default: 'quarterly'
    },
    nextReviewDate: Date,
    reviewHistory: [{
      reviewDate: Date,
      reviewedBy: mongoose.Schema.Types.ObjectId,
      notes: String,
      adjustmentsMade: [String]
    }]
  },

  performanceMetrics: {
    adherenceScore: Number,
    goalsAchieved: Number,
    debtReductionProgress: Number,
    investmentGrowth: Number,
    lastUpdated: Date
  },

  changeHistory: [{
    changeDate: Date,
    changedBy: mongoose.Schema.Types.ObjectId,
    changeType: String,
    description: String,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  // A/B Test Comparisons
  abTestComparisons: [{
    comparisonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ABTestComparison'
    },
    comparedWithPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialPlan'
    },
    comparisonDate: {
      type: Date,
      default: Date.now
    },
    wasSelectedAsWinner: Boolean,
    aiRecommendation: String
  }],

  // PDF Reports Storage
  pdfReports: [{
    reportType: {
      type: String,
      enum: ['goal_based', 'cash_flow', 'hybrid'],
      required: true
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    pdfData: {
      type: Buffer,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    metadata: {
      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Advisor',
        required: true
      },
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
      },
      planVersion: {
        type: Number,
        default: 1
      },
      generationMethod: {
        type: String,
        enum: ['frontend_jspdf', 'backend_pdflib'],
        default: 'frontend_jspdf'
      },
      contentSummary: {
        goalsCount: Number,
        totalSIPAmount: Number,
        hasRecommendations: Boolean
      }
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
financialPlanSchema.index({ clientId: 1, status: 1 });
financialPlanSchema.index({ advisorId: 1, status: 1 });
financialPlanSchema.index({ planType: 1, status: 1 });
financialPlanSchema.index({ 'reviewSchedule.nextReviewDate': 1 });
financialPlanSchema.index({ 'pdfReports.reportType': 1, 'pdfReports.version': -1 });

// Virtual for calculating plan age
financialPlanSchema.virtual('planAge').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if review is due
financialPlanSchema.virtual('isReviewDue').get(function() {
  if (!this.reviewSchedule.nextReviewDate) return false;
  return new Date() >= this.reviewSchedule.nextReviewDate;
});

// Method to create client data snapshot
financialPlanSchema.methods.createSnapshot = async function(clientData) {
  // Ensure numeric values with proper defaults
  const monthlyIncome = Math.max(0, parseFloat(clientData.totalMonthlyIncome) || 0);
  const monthlyExpenses = Math.max(0, parseFloat(clientData.totalMonthlyExpenses) || 0);
  const totalEMIs = this.calculateTotalEMIs(clientData.debtsAndLiabilities);
  const totalDebt = this.calculateTotalDebt(clientData.debtsAndLiabilities);
  const annualIncome = monthlyIncome * 12;
  
  // Calculate metrics with division by zero protection
  const monthlySurplus = monthlyIncome - monthlyExpenses - totalEMIs;
  const emiRatio = monthlyIncome > 0 ? (totalEMIs / monthlyIncome) * 100 : 0;
  const fixedExpenditureRatio = monthlyIncome > 0 ? ((monthlyExpenses + totalEMIs) / monthlyIncome) * 100 : 0;
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;
  const debtToIncomeRatio = annualIncome > 0 ? (totalDebt / annualIncome) * 100 : 0;
  
  // Extract relevant client data for snapshot
  this.clientDataSnapshot = {
    personalInfo: {
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phoneNumber: clientData.phoneNumber,
      dateOfBirth: clientData.dateOfBirth,
      panNumber: clientData.panNumber,
      maritalStatus: clientData.maritalStatus,
      numberOfDependents: clientData.numberOfDependents
    },
    financialInfo: {
      totalMonthlyIncome: monthlyIncome,
      totalMonthlyExpenses: monthlyExpenses,
      incomeType: clientData.incomeType,
      expenseBreakdown: clientData.expenseBreakdown || {}
    },
    investments: clientData.investments || {},
    debtsAndLiabilities: clientData.debtsAndLiabilities || {},
    calculatedMetrics: {
      totalMonthlyEMIs: totalEMIs,
      monthlySurplus: monthlySurplus,
      emiRatio: Math.round(emiRatio * 100) / 100,
      fixedExpenditureRatio: Math.round(fixedExpenditureRatio * 100) / 100,
      savingsRate: Math.round(savingsRate * 100) / 100,
      netWorth: this.calculateNetWorth(clientData),
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100
    }
  };
};

// Helper method to calculate total EMIs
financialPlanSchema.methods.calculateTotalEMIs = function(debts) {
  if (!debts) return 0;
  let total = 0;
  
  const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
  debtTypes.forEach(type => {
    if (debts[type]) {
      const debt = debts[type];
      // Check if the debt exists and has valid EMI/payment
      if ((debt.hasLoan || debt.hasDebt) && (debt.monthlyEMI || debt.monthlyPayment)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        if (!isNaN(emi) && emi > 0) {
          total += emi;
        }
      }
    }
  });
  
  return Math.max(0, total);
};

// Helper method to calculate total debt
financialPlanSchema.methods.calculateTotalDebt = function(debts) {
  if (!debts) return 0;
  let total = 0;
  
  const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
  debtTypes.forEach(type => {
    if (debts[type]) {
      const debt = debts[type];
      // Check if the debt exists and has outstanding amount
      if (debt.hasLoan || debt.hasDebt) {
        const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
        if (!isNaN(outstanding) && outstanding > 0) {
          total += outstanding;
        }
      }
    }
  });
  
  return Math.max(0, total);
};

// Helper method to calculate net worth
financialPlanSchema.methods.calculateNetWorth = function(clientData) {
  let assets = 0;
  let liabilities = 0;
  
  // Calculate total assets from investments
  if (clientData.investments) {
    Object.values(clientData.investments).forEach(investment => {
      if (investment && typeof investment === 'object') {
        const value = parseFloat(investment.totalValue) || 
                     parseFloat(investment.currentBalance) || 
                     parseFloat(investment.currentValue) || 0;
        if (!isNaN(value) && value > 0) {
          assets += value;
        }
      }
    });
  }
  
  // Add cash and bank savings to assets
  if (clientData.assets && clientData.assets.cashBankSavings) {
    const cashSavings = parseFloat(clientData.assets.cashBankSavings) || 0;
    if (!isNaN(cashSavings) && cashSavings > 0) {
      assets += cashSavings;
    }
  }
  
  // Calculate total liabilities
  liabilities = this.calculateTotalDebt(clientData.debtsAndLiabilities);
  
  return assets - liabilities;
};

// Method to update performance metrics
financialPlanSchema.methods.updatePerformanceMetrics = function() {
  // This would be called periodically to update plan performance
  // Implementation would depend on actual data tracking
  this.performanceMetrics.lastUpdated = new Date();
};

// Method to add to change history
financialPlanSchema.methods.addChangeHistory = function(changeData) {
  this.changeHistory.push({
    changeDate: new Date(),
    changedBy: changeData.userId,
    changeType: changeData.type,
    description: changeData.description,
    previousValue: changeData.previousValue,
    newValue: changeData.newValue
  });
};

// Method to add PDF report
financialPlanSchema.methods.addPDFReport = function(pdfData, metadata) {
  const version = this.pdfReports.filter(report => 
    report.reportType === metadata.reportType
  ).length + 1;

  const pdfReport = {
    reportType: metadata.reportType,
    generatedAt: new Date(),
    version: version,
    pdfData: pdfData,
    fileSize: pdfData.length,
    fileName: metadata.fileName || `${metadata.reportType}_plan_v${version}.pdf`,
    metadata: {
      generatedBy: metadata.generatedBy,
      clientId: metadata.clientId,
      planVersion: this.version,
      generationMethod: metadata.generationMethod || 'frontend_jspdf',
      contentSummary: metadata.contentSummary || {}
    }
  };

  this.pdfReports.push(pdfReport);
  return pdfReport;
};

// Method to get latest PDF report by type
financialPlanSchema.methods.getLatestPDFReport = function(reportType) {
  const reports = this.pdfReports.filter(report => 
    report.reportType === reportType
  );
  
  if (reports.length === 0) return null;
  
  return reports.reduce((latest, current) => 
    current.version > latest.version ? current : latest
  );
};

// Method to get PDF report by ID
financialPlanSchema.methods.getPDFReportById = function(reportId) {
  return this.pdfReports.find(report => 
    report._id.toString() === reportId.toString()
  );
};

// Method to delete PDF report
financialPlanSchema.methods.deletePDFReport = function(reportId) {
  const index = this.pdfReports.findIndex(report => 
    report._id.toString() === reportId.toString()
  );
  
  if (index !== -1) {
    const deletedReport = this.pdfReports[index];
    this.pdfReports.splice(index, 1);
    return deletedReport;
  }
  
  return null;
};

// Method to get PDF storage statistics
financialPlanSchema.methods.getPDFStorageStats = function() {
  const totalSize = this.pdfReports.reduce((sum, report) => sum + report.fileSize, 0);
  const reportsByType = {};
  
  this.pdfReports.forEach(report => {
    if (!reportsByType[report.reportType]) {
      reportsByType[report.reportType] = 0;
    }
    reportsByType[report.reportType]++;
  });
  
  return {
    totalReports: this.pdfReports.length,
    totalSize: totalSize,
    totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
    reportsByType: reportsByType,
    latestReport: this.pdfReports.length > 0 ? 
      this.pdfReports[this.pdfReports.length - 1].generatedAt : null
  };
};

// Pre-save middleware to update version on changes
financialPlanSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Logging middleware
financialPlanSchema.pre('save', function(next) {
  console.log(`[FinancialPlan] Saving plan: ${this._id} for client: ${this.clientId}`);
  next();
});

financialPlanSchema.pre('findOneAndUpdate', function(next) {
  console.log('[FinancialPlan] Updating plan with query:', this.getQuery());
  next();
});

// Security: Remove sensitive data from JSON output
financialPlanSchema.methods.toJSON = function() {
  const obj = this.toObject();
  // Remove any sensitive fields if needed
  delete obj.__v;
  return obj;
};

const FinancialPlan = mongoose.model('FinancialPlan', financialPlanSchema);

module.exports = FinancialPlan;