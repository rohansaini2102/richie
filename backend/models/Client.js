const mongoose = require('mongoose');
const { logger, logDatabase } = require('../utils/logger');

const clientSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Zip code cannot exceed 10 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters'],
      default: 'India'
    }
  },

  // ENHANCED Income & Employment Information
  occupation: {
    type: String,
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  employerBusinessName: {
    type: String,
    trim: true,
    maxlength: [150, 'Employer/Business name cannot exceed 150 characters']
  },
  
  // Income Details
  annualIncome: {
    type: Number,
    min: [0, 'Annual income cannot be negative']
  },
  additionalIncome: {
    type: Number,
    min: [0, 'Additional income cannot be negative'],
    default: 0
  },
  
  // Monthly Expense Breakdown
  monthlyExpenses: {
    housingRent: {
      type: Number,
      min: [0, 'Housing/Rent cannot be negative'],
      default: 0
    },
    groceriesUtilitiesFood: {
      type: Number,
      min: [0, 'Groceries, Utilities & Food cannot be negative'],
      default: 0
    },
    transportation: {
      type: Number,
      min: [0, 'Transportation cannot be negative'],
      default: 0
    },
    education: {
      type: Number,
      min: [0, 'Education cannot be negative'],
      default: 0
    },
    healthcare: {
      type: Number,
      min: [0, 'Healthcare cannot be negative'],
      default: 0
    },
    entertainment: {
      type: Number,
      min: [0, 'Entertainment cannot be negative'],
      default: 0
    },
    insurancePremiums: {
      type: Number,
      min: [0, 'Insurance premiums cannot be negative'],
      default: 0
    },
    loanEmis: {
      type: Number,
      min: [0, 'Loan EMIs cannot be negative'],
      default: 0
    },
    otherExpenses: {
      type: Number,
      min: [0, 'Other expenses cannot be negative'],
      default: 0
    }
  },
  
  // Expense Notes
  expenseNotes: {
    type: String,
    maxlength: [500, 'Expense notes cannot exceed 500 characters']
  },
  
  // Annual & Emergency Expenses
  annualTaxes: {
    type: Number,
    min: [0, 'Annual taxes cannot be negative'],
    default: 0
  },
  annualVacationExpenses: {
    type: Number,
    min: [0, 'Annual vacation expenses cannot be negative'],
    default: 0
  },

  // Financial Goals - Enhanced Structure
  retirementPlanning: {
    targetRetirementAge: {
      type: Number,
      min: [18, 'Retirement age must be at least 18'],
      max: [100, 'Retirement age cannot exceed 100']
    },
    retirementCorpusTarget: {
      type: Number,
      min: [0, 'Retirement corpus target cannot be negative']
    }
  },
  
  // Other Major Goals - Dynamic Goals Array
  majorGoals: [{
    goalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters']
    },
    targetAmount: {
      type: Number,
      required: true,
      min: [0, 'Target amount cannot be negative']
    },
    targetYear: {
      type: Number,
      required: true,
      min: [2024, 'Target year cannot be in the past']
    },
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    }
  }],

  // Assets & Liabilities - Enhanced Structure
  assets: {
    // Basic Assets
    cashBankSavings: {
      type: Number,
      min: [0, 'Cash & Bank savings cannot be negative'],
      default: 0
    },
    realEstate: {
      type: Number,
      min: [0, 'Real estate value cannot be negative'],
      default: 0
    },
    
    // Existing Investments - Equity
    investments: {
      equity: {
        mutualFunds: {
          type: Number,
          min: [0, 'Mutual funds value cannot be negative'],
          default: 0
        },
        directStocks: {
          type: Number,
          min: [0, 'Direct stocks value cannot be negative'],
          default: 0
        }
      },
      
      // Fixed Income
      fixedIncome: {
        ppf: {
          type: Number,
          min: [0, 'PPF value cannot be negative'],
          default: 0
        },
        epf: {
          type: Number,
          min: [0, 'EPF value cannot be negative'],
          default: 0
        },
        nps: {
          type: Number,
          min: [0, 'NPS value cannot be negative'],
          default: 0
        },
        fixedDeposits: {
          type: Number,
          min: [0, 'Fixed deposits value cannot be negative'],
          default: 0
        },
        bondsDebentures: {
          type: Number,
          min: [0, 'Bonds & debentures value cannot be negative'],
          default: 0
        },
        nsc: {
          type: Number,
          min: [0, 'NSC value cannot be negative'],
          default: 0
        }
      },
      
      // Other Investments
      other: {
        ulip: {
          type: Number,
          min: [0, 'ULIP value cannot be negative'],
          default: 0
        },
        otherInvestments: {
          type: Number,
          min: [0, 'Other investments value cannot be negative'],
          default: 0
        }
      }
    }
  },
  
  // Liabilities
  liabilities: {
    loans: {
      type: Number,
      min: [0, 'Loans cannot be negative'],
      default: 0
    },
    creditCardDebt: {
      type: Number,
      min: [0, 'Credit card debt cannot be negative'],
      default: 0
    }
  },

  // Form Progress Tracking
  formProgress: {
    step1Completed: {
      type: Boolean,
      default: false
    },
    step2Completed: {
      type: Boolean,
      default: false
    },
    step3Completed: {
      type: Boolean,
      default: false
    },
    step4Completed: {
      type: Boolean,
      default: false
    },
    step5Completed: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    lastSavedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Draft Data Storage
  draftData: {
    type: Object,
    default: {}
  },

  // ORIGINAL FIELDS - Preserved
  netWorth: {
    type: Number,
    min: [0, 'Net worth cannot be negative']
  },
  monthlySavingsTarget: {
    type: Number,
    min: [0, 'Monthly savings target cannot be negative']
  },
  investmentExperience: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', ''],
    default: ''
  },
  riskTolerance: {
    type: String,
    enum: ['Conservative', 'Moderate', 'Aggressive', 'Very Aggressive', ''],
    default: ''
  },
  
  // Investment Goals
  investmentGoals: [{
    type: String,
    enum: ['Retirement', 'Education', 'Home Purchase', 'Emergency Fund', 'Wealth Building', 'Tax Saving', 'Other']
  }],
  investmentHorizon: {
    type: String,
    enum: ['Short-term (1-3 years)', 'Medium-term (3-7 years)', 'Long-term (7+ years)', ''],
    default: ''
  },
  
  // KYC Information
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  aadharNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{12}$/, 'Please enter a valid Aadhar number']
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  kycDocuments: [{
    type: {
      type: String,
      enum: ['PAN', 'Aadhar', 'Address Proof', 'Bank Statement', 'Other']
    },
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Enhanced CAS Information Schema - PRESERVED COMPLETELY
  casData: {
    // CAS File Information
    casFile: {
      fileName: String,
      filePath: String,
      uploadDate: {
        type: Date,
        default: Date.now
      },
      fileSize: Number,
      password: String, // Encrypted password if CAS is password protected
      iv: String,
      frontendProcessed: Boolean
    },
    
    // Parsed CAS Data - Enhanced Structure
    parsedData: {
      // Investor Information
      investor: {
        name: String,
        pan: String,
        address: String,
        email: String,
        mobile: String,
        cas_id: String,
        pincode: String
      },
      
      // Demat Accounts - Enhanced Structure
      demat_accounts: [{
        dp_id: String,
        dp_name: String,
        bo_id: String,
        client_id: String,
        demat_type: String,
        
        // Holdings within Demat Account
        holdings: {
          equities: [{
            symbol: String,
            isin: String,
            company_name: String,
            quantity: Number,
            price: Number,
            value: Number,
            face_value: Number,
            market_lot: Number,
            sector: String,
            industry: String
          }],
          
          demat_mutual_funds: [{
            scheme_name: String,
            isin: String,
            units: Number,
            nav: Number,
            value: Number,
            fund_house: String,
            scheme_type: String,
            category: String
          }],
          
          corporate_bonds: [{
            symbol: String,
            isin: String,
            company_name: String,
            quantity: Number,
            face_value: Number,
            value: Number,
            maturity_date: Date,
            coupon_rate: Number
          }],
          
          government_securities: [{
            symbol: String,
            isin: String,
            security_name: String,
            quantity: Number,
            face_value: Number,
            value: Number,
            maturity_date: Date,
            coupon_rate: Number
          }],
          
          aifs: [{
            scheme_name: String,
            isin: String,
            units: Number,
            nav: Number,
            value: Number,
            fund_house: String,
            aif_category: String
          }]
        },
        
        // Account Additional Info
        additional_info: {
          status: String,
          bo_type: String,
          bo_sub_status: String,
          bsda: String,
          nominee: String,
          email: String,
          mobile: String
        },
        
        // Account Total Value
        value: Number
      }],
      
      // Mutual Funds - Enhanced Structure
      mutual_funds: [{
        amc: String,
        folio_number: String,
        
        schemes: [{
          scheme_name: String,
          isin: String,
          units: Number,
          nav: Number,
          value: Number,
          closing_balance: Number,
          scheme_type: String,
          category: String,
          sub_category: String,
          
          // Transaction History
          transactions: [{
            date: Date,
            description: String,
            transaction_type: String, // Purchase, Redemption, Dividend, etc.
            amount: Number,
            units: Number,
            nav: Number,
            balance: Number
          }]
        }],
        
        // Folio Total Value
        value: Number
      }],
      
      // Insurance - Enhanced Structure
      insurance: {
        life_insurance_policies: [{
          policy_number: String,
          policy_name: String,
          insurer_name: String,
          sum_assured: Number,
          premium: Number,
          premium_frequency: String,
          policy_status: String,
          policy_start_date: Date,
          maturity_date: Date,
          nominee: String
        }],
        
        health_insurance_policies: [{
          policy_number: String,
          policy_name: String,
          insurer_name: String,
          sum_insured: Number,
          premium: Number,
          policy_status: String,
          policy_start_date: Date,
          policy_end_date: Date
        }]
      },
      
      // Enhanced Summary with Detailed Breakdown
      summary: {
        accounts: {
          demat: {
            total_value: Number,
            total_accounts: Number,
            breakdown: {
              equities: Number,
              mutual_funds: Number,
              bonds: Number,
              government_securities: Number,
              aifs: Number
            }
          },
          
          mutual_funds: {
            total_value: Number,
            total_folios: Number,
            breakdown: {
              equity_funds: Number,
              debt_funds: Number,
              hybrid_funds: Number,
              other_funds: Number
            }
          },
          
          insurance: {
            total_policies: Number,
            total_sum_assured: Number,
            total_premium: Number
          }
        },
        
        // Overall Portfolio Summary
        total_value: Number,
        currency: {
          type: String,
          default: 'INR'
        },
        
        // Asset Allocation
        asset_allocation: {
          equity_percentage: Number,
          debt_percentage: Number,
          others_percentage: Number
        },
        
        // Risk Metrics
        risk_metrics: {
          portfolio_beta: Number,
          sharpe_ratio: Number,
          volatility: Number
        }
      },
      
      // Metadata - Enhanced
      meta: {
        cas_type: String,
        generated_at: String,
        parsed_at: {
          type: Date,
          default: Date.now
        },
        parser_version: String,
        file_hash: String,
        processing_time_ms: Number,
        data_points_extracted: Number,
        confidence_score: Number
      }
    },
    
    // CAS Processing Status
    casStatus: {
      type: String,
      enum: ['not_uploaded', 'uploaded', 'parsing', 'parsed', 'error', 'expired'],
      default: 'not_uploaded'
    },
    
    // Error Handling
    parseError: String,
    lastParsedAt: Date,
    
    // Processing History
    processingHistory: [{
      action: String, // upload, parse, update, etc.
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: String, // success, failed, warning
      details: String,
      eventId: String
    }]
  },

  // Account Information
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
    },
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    branchName: {
      type: String,
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters']
    }
  },

  // Advisor Relationship
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: [true, 'Advisor reference is required']
  },

  // Status and Tracking
  status: {
    type: String,
    enum: ['invited', 'onboarding', 'active', 'inactive', 'suspended'],
    default: 'invited'
  },
  onboardingStep: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  
  // Communication Preferences
  communicationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    phone: {
      type: Boolean,
      default: true
    },
    whatsapp: {
      type: Boolean,
      default: false
    }
  },

  // Additional Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Compliance
  fatcaStatus: {
    type: String,
    enum: ['pending', 'completed', 'not_applicable'],
    default: 'pending'
  },
  crsStatus: {
    type: String,
    enum: ['pending', 'completed', 'not_applicable'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for better performance
clientSchema.index({ advisor: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ 'advisor': 1, 'firstName': 1, 'lastName': 1 });
clientSchema.index({ 'casData.casStatus': 1 });
clientSchema.index({ 'casData.parsedData.summary.total_value': 1 });

// Virtual for full name
clientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for total portfolio value from CAS
clientSchema.virtual('totalPortfolioValue').get(function() {
  return this.casData?.parsedData?.summary?.total_value || 0;
});

// Virtual to check if client has CAS data
clientSchema.virtual('hasCASData').get(function() {
  return this.casData && this.casData.casStatus !== 'not_uploaded';
});

// Virtual for CAS summary info
clientSchema.virtual('casSummary').get(function() {
  if (!this.hasCASData || !this.casData.parsedData) {
    return null;
  }

  const summary = this.casData.parsedData.summary;
  return {
    totalValue: summary?.total_value || 0,
    dematAccounts: this.casData.parsedData.demat_accounts?.length || 0,
    mutualFunds: this.casData.parsedData.mutual_funds?.length || 0,
    lastUpdated: this.casData.lastParsedAt,
    status: this.casData.casStatus
  };
});

// NEW Virtual for calculated financial summaries
clientSchema.virtual('calculatedFinancials').get(function() {
  const monthlyIncome = (this.annualIncome || 0) / 12 + (this.additionalIncome || 0) / 12;
  
  const totalMonthlyExpenses = (this.monthlyExpenses?.housingRent || 0) +
                               (this.monthlyExpenses?.groceriesUtilitiesFood || 0) +
                               (this.monthlyExpenses?.transportation || 0) +
                               (this.monthlyExpenses?.education || 0) +
                               (this.monthlyExpenses?.healthcare || 0) +
                               (this.monthlyExpenses?.entertainment || 0) +
                               (this.monthlyExpenses?.insurancePremiums || 0) +
                               (this.monthlyExpenses?.loanEmis || 0) +
                               (this.monthlyExpenses?.otherExpenses || 0);
  
  const monthlySavings = monthlyIncome - totalMonthlyExpenses;
  
  // Calculate total assets
  const totalAssets = (this.assets?.cashBankSavings || 0) +
                      (this.assets?.realEstate || 0) +
                      (this.assets?.investments?.equity?.mutualFunds || 0) +
                      (this.assets?.investments?.equity?.directStocks || 0) +
                      (this.assets?.investments?.fixedIncome?.ppf || 0) +
                      (this.assets?.investments?.fixedIncome?.epf || 0) +
                      (this.assets?.investments?.fixedIncome?.nps || 0) +
                      (this.assets?.investments?.fixedIncome?.fixedDeposits || 0) +
                      (this.assets?.investments?.fixedIncome?.bondsDebentures || 0) +
                      (this.assets?.investments?.fixedIncome?.nsc || 0) +
                      (this.assets?.investments?.other?.ulip || 0) +
                      (this.assets?.investments?.other?.otherInvestments || 0);
  
  // Calculate total liabilities
  const totalLiabilities = (this.liabilities?.loans || 0) + (this.liabilities?.creditCardDebt || 0);
  
  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities;

  return {
    monthlyIncome: Math.round(monthlyIncome),
    totalMonthlyExpenses: Math.round(totalMonthlyExpenses),
    monthlySavings: Math.round(monthlySavings),
    totalAssets: Math.round(totalAssets),
    totalLiabilities: Math.round(totalLiabilities),
    netWorth: Math.round(netWorth)
  };
});

// Ensure virtual fields are serialized
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

// Enhanced toJSON method with security
clientSchema.methods.toJSON = function() {
  const client = this.toObject();
  
  // Remove sensitive fields
  if (client.aadharNumber) {
    client.aadharNumber = client.aadharNumber.replace(/\d(?=\d{4})/g, '*');
  }
  if (client.bankDetails && client.bankDetails.accountNumber) {
    client.bankDetails.accountNumber = client.bankDetails.accountNumber.replace(/\d(?=\d{4})/g, '*');
  }
  
  // Remove CAS file password from response
  if (client.casData && client.casData.casFile) {
    delete client.casData.casFile.password;
  }
  
  // Mask sensitive CAS data in parsed content
  if (client.casData && client.casData.parsedData && client.casData.parsedData.investor) {
    if (client.casData.parsedData.investor.pan) {
      client.casData.parsedData.investor.pan = client.casData.parsedData.investor.pan.replace(/\w(?=\w{4})/g, '*');
    }
  }
  
  return client;
};

// Method to update CAS processing history - PRESERVED
clientSchema.methods.addCASProcessingEvent = function(action, status, details, eventId) {
  if (!this.casData) {
    this.casData = { processingHistory: [] };
  }
  if (!this.casData.processingHistory) {
    this.casData.processingHistory = [];
  }
  
  this.casData.processingHistory.push({
    action,
    status,
    details,
    eventId,
    timestamp: new Date()
  });
  
  // Keep only last 50 events to prevent unlimited growth
  if (this.casData.processingHistory.length > 50) {
    this.casData.processingHistory = this.casData.processingHistory.slice(-50);
  }
};

// Method to get portfolio asset allocation - PRESERVED
clientSchema.methods.getAssetAllocation = function() {
  if (!this.hasCASData || !this.casData.parsedData) {
    return null;
  }

  const summary = this.casData.parsedData.summary;
  const totalValue = summary?.total_value || 0;
  
  if (totalValue === 0) return null;

  const equityValue = summary?.accounts?.demat?.breakdown?.equities || 0;
  const debtValue = summary?.accounts?.demat?.breakdown?.bonds || 0;
  const mfValue = summary?.accounts?.mutual_funds?.total_value || 0;
  
  return {
    equity: Math.round((equityValue / totalValue) * 100),
    debt: Math.round((debtValue / totalValue) * 100),
    mutualFunds: Math.round((mfValue / totalValue) * 100),
    others: Math.round(((totalValue - equityValue - debtValue - mfValue) / totalValue) * 100)
  };
};

// NEW Method to save form draft
clientSchema.methods.saveDraft = function(stepData, stepNumber) {
  this.draftData[`step${stepNumber}`] = stepData;
  this.formProgress.currentStep = stepNumber;
  this.formProgress.lastSavedAt = new Date();
  return this.save();
};

// NEW Method to get form draft
clientSchema.methods.getDraft = function(stepNumber) {
  return this.draftData[`step${stepNumber}`] || {};
};

// NEW Method to mark step as completed
clientSchema.methods.markStepCompleted = function(stepNumber) {
  this.formProgress[`step${stepNumber}Completed`] = true;
  this.formProgress.currentStep = Math.min(stepNumber + 1, 5);
  return this.save();
};

// Mongoose middleware for logging database operations
clientSchema.pre('save', function(next) {
  const startTime = Date.now();
  
  // Log the operation
  const isNew = this.isNew;
  const operation = isNew ? 'create' : 'update';
  const clientId = this._id || 'new';
  
  logger.debug(`DB Operation started: Client.${operation} for ID: ${clientId}`);
  
  // Store start time for post middleware
  this._startTime = startTime;
  
  next();
});

clientSchema.post('save', function(doc, next) {
  const duration = Date.now() - this._startTime;
  const operation = doc.isNew ? 'create' : 'update';
  
  logDatabase.queryExecution('Client', operation, duration);
  logger.info(`DB Operation completed: Client.${operation} for ID: ${doc._id} in ${duration}ms`);
  
  next();
});

clientSchema.post('save', function(error, doc, next) {
  if (error) {
    logDatabase.operationError('Client.save', error);
    logger.error(`DB Operation failed: Client.save for ID: ${doc?._id || 'unknown'} - ${error.message}`);
  }
  next(error);
});

// Log find operations
clientSchema.pre(/^find/, function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: Client.${this.getOptions().op || 'find'}`);
});

clientSchema.post(/^find/, function(result) {
  const duration = Date.now() - this._startTime;
  const operation = this.getOptions().op || 'find';
  const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
  
  logDatabase.queryExecution('Client', operation, duration);
  logger.debug(`DB Operation completed: Client.${operation} returned ${resultCount} document(s) in ${duration}ms`);
});

clientSchema.post(/^find/, function(error, result, next) {
  if (error) {
    const operation = this.getOptions().op || 'find';
    logDatabase.operationError(`Client.${operation}`, error);
    logger.error(`DB Operation failed: Client.${operation} - ${error.message}`);
  }
  if (next) next(error);
});

// Log remove operations
clientSchema.pre('remove', function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: Client.remove for ID: ${this._id}`);
});

clientSchema.post('remove', function(doc) {
  const duration = Date.now() - this._startTime;
  logDatabase.queryExecution('Client', 'remove', duration);
  logger.info(`DB Operation completed: Client.remove for ID: ${doc._id} in ${duration}ms`);
});

module.exports = mongoose.model('Client', clientSchema);