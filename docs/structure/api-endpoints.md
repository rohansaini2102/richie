# API Endpoints & Database Schema

## 📋 Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [Client Management APIs](#client-management-apis)
- [Financial Planning APIs](#financial-planning-apis)
- [Admin APIs](#admin-apis)
- [Database Schemas](#database-schemas)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)

## 🔐 Authentication Endpoints

### Base URL: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Advisor registration | No |
| POST | `/login` | Advisor login | No |
| POST | `/logout` | Advisor logout | Yes |
| GET | `/profile` | Get advisor profile | Yes |
| PUT | `/profile` | Update advisor profile | Yes |

**Example Request:**
```javascript
// POST /api/auth/login
{
  "email": "advisor@example.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "advisor": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Smith",
    "email": "advisor@example.com",
    "firmName": "Smith Financial Advisory"
  }
}
```

## 👥 Client Management APIs

### Base URL: `/api/clients`

#### Client CRUD Operations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/manage` | Get all advisor's clients | Yes |
| GET | `/manage/:clientId` | Get specific client details | Yes |
| PUT | `/manage/:clientId` | Update client information | Yes |
| DELETE | `/manage/:clientId` | Delete client | Yes |
| GET | `/manage/dashboard/stats` | Get dashboard statistics | Yes |

#### Client Invitations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/manage/invitations` | Send client invitation | Yes |
| GET | `/manage/invitations` | Get invitation list | Yes |

#### Client Onboarding
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/onboarding/:token` | Access onboarding form | No |
| POST | `/onboarding/:token` | Submit completed form | No |
| POST | `/onboarding/:token/draft` | Save form draft | No |
| GET | `/onboarding/:token/draft` | Load form draft | No |

#### CAS Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/manage/:clientId/cas/upload` | Upload CAS file | Yes |
| POST | `/manage/:clientId/cas/parse` | Parse uploaded CAS | Yes |
| GET | `/manage/:clientId/cas` | Get CAS data | Yes |
| DELETE | `/manage/:clientId/cas` | Delete CAS data | Yes |

**Example Client Data Response:**
```javascript
// GET /api/clients/manage/507f1f77bcf86cd799439011
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phoneNumber": "+91-9876543210",
    "dateOfBirth": "1985-06-15T00:00:00.000Z",
    "panNumber": "ABCDE1234F",
    "maritalStatus": "Married",
    "numberOfDependents": 2,
    
    // Financial Information
    "totalMonthlyIncome": 100000,
    "totalMonthlyExpenses": 60000,
    "incomeType": "Salaried",
    "expenseBreakdown": {
      "details": {
        "housingRent": 25000,
        "foodGroceries": 12000,
        "transportation": 8000,
        "utilities": 5000,
        "entertainment": 5000,
        "healthcare": 3000,
        "otherExpenses": 2000
      }
    },
    
    // Assets & Investments
    "assets": {
      "cashBankSavings": 500000,
      "investments": {
        "equity": {
          "mutualFunds": 800000,
          "directStocks": 300000
        },
        "fixedIncome": {
          "ppf": 200000,
          "epf": 150000,
          "fixedDeposits": 100000
        }
      }
    },
    
    // Debts & Liabilities
    "debtsAndLiabilities": {
      "homeLoan": {
        "hasLoan": true,
        "outstandingAmount": 2500000,
        "monthlyEMI": 25000,
        "interestRate": 8.5,
        "remainingTenure": 120
      },
      "personalLoan": {
        "hasLoan": true,
        "outstandingAmount": 200000,
        "monthlyEMI": 8000,
        "interestRate": 14.0,
        "remainingTenure": 24
      }
    },
    
    // Calculated Metrics
    "completionPercentage": 85,
    "calculatedFinancials": {
      "monthlySurplus": 7000,
      "savingsRate": 7.0,
      "emiRatio": 33.0,
      "netWorth": 1350000
    },
    
    // CAS Data (if available)
    "casData": {
      "casStatus": "parsed",
      "parsedData": {
        "summary": {
          "totalValue": 1200000,
          "totalAccounts": 15,
          "totalMutualFunds": 12
        }
      }
    },
    
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

## 📊 Financial Planning APIs

### Base URL: `/api/plans`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new financial plan | Yes |
| GET | `/:planId` | Get plan by ID | Yes |
| PUT | `/:planId` | Update plan | Yes |
| DELETE | `/:planId` | Archive plan | Yes |
| GET | `/client/:clientId` | Get all plans for client | Yes |
| GET | `/advisor/all` | Get all advisor's plans | Yes |
| PATCH | `/:planId/status` | Update plan status | Yes |
| POST | `/:planId/review` | Add review note | Yes |
| POST | `/:planId/ai-recommendations` | Generate AI recommendations | Yes |
| GET | `/:planId/performance` | Get performance metrics | Yes |
| POST | `/:planId/clone` | Clone existing plan | Yes |
| GET | `/:planId/export/pdf` | Export plan as PDF | Yes |

**Plan Creation Request:**
```javascript
// POST /api/plans
{
  "clientId": "507f1f77bcf86cd799439011",
  "planType": "cash_flow"
}
```

**Plan Response Structure:**
```javascript
{
  "success": true,
  "plan": {
    "id": "507f1f77bcf86cd799439012",
    "clientId": "507f1f77bcf86cd799439011",
    "advisorId": "507f1f77bcf86cd799439010",
    "planType": "cash_flow",
    "status": "draft",
    "version": 1,
    
    // Client data snapshot at plan creation
    "clientDataSnapshot": {
      "personalInfo": { ... },
      "financialInfo": { ... },
      "investments": { ... },
      "debtsAndLiabilities": { ... },
      "calculatedMetrics": {
        "totalMonthlyEMIs": 33000,
        "monthlySurplus": 7000,
        "emiRatio": 33.0,
        "savingsRate": 7.0,
        "netWorth": 1350000
      }
    },
    
    // Plan-specific details
    "planDetails": {
      "cashFlowPlan": {
        "debtManagement": {
          "prioritizedDebts": [
            {
              "debtType": "Personal Loan",
              "outstandingAmount": 200000,
              "currentEMI": 8000,
              "interestRate": 14.0,
              "priorityRank": 1,
              "reason": "High interest rate - Priority repayment"
            },
            {
              "debtType": "Home Loan",
              "outstandingAmount": 2500000,
              "currentEMI": 25000,
              "interestRate": 8.5,
              "priorityRank": 2,
              "reason": "Moderate interest rate - Standard repayment"
            }
          ],
          "totalDebtReduction": 0,
          "totalInterestSavings": 0
        },
        
        "emergencyFundStrategy": {
          "targetAmount": 516000, // 6 months of (expenses + EMIs)
          "currentAmount": 500000,
          "gap": 16000,
          "monthlyAllocation": 2100,
          "timeline": 8, // months
          "investmentType": "Liquid Fund",
          "fundRecommendations": [
            "HDFC Liquid Fund",
            "ICICI Prudential Liquid Fund"
          ]
        },
        
        "investmentRecommendations": {
          "monthlyInvestments": [],
          "assetAllocation": {
            "equity": 70,
            "debt": 30,
            "gold": 0
          },
          "totalMonthlyInvestment": 0,
          "projectedCorpus": {
            "year1": 0,
            "year3": 0,
            "year5": 0,
            "year10": 0
          }
        },
        
        "cashFlowMetrics": {
          "currentEmiRatio": 33.0,
          "targetEmiRatio": 40,
          "currentSavingsRate": 7.0,
          "targetSavingsRate": 20,
          "financialHealthScore": 65
        },
        
        "actionItems": [
          {
            "action": "Build emergency fund to 6 months expenses",
            "priority": "high",
            "timeline": "0-12 months",
            "status": "pending"
          },
          {
            "action": "Increase savings rate to 20%",
            "priority": "medium", 
            "timeline": "0-3 months",
            "status": "pending"
          }
        ]
      }
    },
    
    // AI Recommendations
    "aiRecommendations": {
      "debtStrategy": "Focus on clearing personal loan first due to high interest rate of 14%. Consider increasing EMI by 50% to save on interest.",
      "emergencyFundAnalysis": "Emergency fund gap of ₹16,000. Allocate ₹2,100 monthly to build fund in 8 months.",
      "investmentAnalysis": "Monthly surplus of ₹7,000 available. Recommend 70% equity and 30% debt allocation based on risk profile.",
      "riskWarnings": [],
      "opportunities": [
        "Good financial health foundation for growth"
      ]
    },
    
    // Review & Tracking
    "reviewSchedule": {
      "frequency": "quarterly",
      "nextReviewDate": "2024-04-20T00:00:00.000Z",
      "reviewHistory": []
    },
    
    "createdAt": "2024-01-20T15:00:00.000Z",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

## 👨‍💼 Admin APIs

### Base URL: `/api/admin`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/advisors` | Get all advisors | Admin |
| GET | `/advisors/:advisorId/clients` | Get advisor's clients | Admin |
| GET | `/advisors/:advisorId/clients/:clientId` | Get specific client details | Admin |
| GET | `/dashboard/stats` | Get admin dashboard stats | Admin |

**Admin Dashboard Stats Response:**
```javascript
{
  "success": true,
  "data": {
    "totalAdvisors": 25,
    "totalClients": 150,
    "clientsWithCAS": 85,
    "totalPlans": 95,
    "activePlans": 72,
    "monthlyGrowth": {
      "advisors": 3,
      "clients": 12,
      "plans": 8
    },
    "systemHealth": {
      "apiResponseTime": "120ms",
      "databaseConnections": 5,
      "activeUsers": 18
    }
  }
}
```

## 🗄️ Database Schemas

### Client Schema
```javascript
const clientSchema = {
  _id: ObjectId,
  advisor: ObjectId, // Reference to Advisor
  
  // Personal Information
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  dateOfBirth: Date,
  panNumber: String,
  maritalStatus: String,
  numberOfDependents: Number,
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  
  // Financial Information
  totalMonthlyIncome: Number,
  totalMonthlyExpenses: Number,
  annualIncome: Number,
  incomeType: String, // 'Salaried', 'Business', 'Freelance'
  
  // Expense Breakdown
  expenseBreakdown: {
    details: {
      housingRent: Number,
      foodGroceries: Number,
      transportation: Number,
      utilities: Number,
      entertainment: Number,
      healthcare: Number,
      otherExpenses: Number
    }
  },
  
  // Assets & Investments
  assets: {
    cashBankSavings: Number,
    investments: {
      equity: {
        mutualFunds: Number,
        directStocks: Number,
        elss: Number
      },
      fixedIncome: {
        ppf: Number,
        epf: Number,
        nps: Number,
        fixedDeposits: Number
      },
      others: Number
    }
  },
  
  // Debts & Liabilities
  debtsAndLiabilities: {
    homeLoan: {
      hasLoan: Boolean,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number,
      remainingTenure: Number
    },
    personalLoan: { /* similar structure */ },
    carLoan: { /* similar structure */ },
    educationLoan: { /* similar structure */ },
    creditCards: {
      hasDebt: Boolean,
      totalOutstanding: Number,
      monthlyPayment: Number,
      averageInterestRate: Number
    },
    businessLoan: { /* similar structure */ },
    goldLoan: { /* similar structure */ },
    otherLoans: { /* similar structure */ }
  },
  
  // Goals & Planning
  retirementPlanning: {
    retirementAge: Number,
    hasRetirementCorpus: Boolean,
    currentRetirementCorpus: Number,
    targetRetirementCorpus: Number
  },
  
  enhancedFinancialGoals: {
    emergencyFund: {
      targetAmount: Number,
      priority: String
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
      priority: String
    }]
  },
  
  // Risk Profile
  enhancedRiskProfile: {
    investmentExperience: String,
    riskTolerance: String, // 'Conservative', 'Moderate', 'Aggressive'
    monthlyInvestmentCapacity: Number,
    preferredInvestmentDuration: String
  },
  
  // Insurance Coverage
  insuranceCoverage: {
    lifeInsurance: {
      hasInsurance: Boolean,
      totalCoverAmount: Number,
      annualPremium: Number
    },
    healthInsurance: {
      hasInsurance: Boolean,
      totalCoverAmount: Number,
      annualPremium: Number,
      familyMembers: Number
    },
    vehicleInsurance: { /* similar */ },
    otherInsurance: { /* similar */ }
  },
  
  // CAS Data
  casData: {
    casFile: String, // File path
    casStatus: String, // 'not_uploaded', 'uploaded', 'parsing', 'parsed', 'error'
    parsedData: {
      summary: {
        totalValue: Number,
        totalAccounts: Number,
        totalMutualFunds: Number
      },
      accounts: [/* Detailed account data */],
      mutualFunds: [/* Detailed fund data */]
    },
    uploadedAt: Date,
    parsedAt: Date
  },
  
  // Status & Metadata
  status: String, // 'invited', 'onboarding', 'active', 'inactive'
  completionPercentage: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### FinancialPlan Schema
```javascript
const financialPlanSchema = {
  _id: ObjectId,
  clientId: ObjectId, // Reference to Client
  advisorId: ObjectId, // Reference to Advisor
  
  // Plan Metadata
  planType: String, // 'cash_flow', 'goal_based', 'hybrid'
  status: String, // 'draft', 'active', 'completed', 'archived'
  version: Number,
  
  // Client Data Snapshot (at plan creation time)
  clientDataSnapshot: {
    personalInfo: { /* ... */ },
    financialInfo: { /* ... */ },
    investments: { /* ... */ },
    debtsAndLiabilities: { /* ... */ },
    calculatedMetrics: {
      totalMonthlyEMIs: Number,
      monthlySurplus: Number,
      emiRatio: Number,
      savingsRate: Number,
      netWorth: Number
    }
  },
  
  // Plan Details
  planDetails: {
    cashFlowPlan: {
      debtManagement: { /* ... */ },
      emergencyFundStrategy: { /* ... */ },
      investmentRecommendations: { /* ... */ },
      cashFlowMetrics: { /* ... */ },
      actionItems: [/* ... */]
    },
    goalBasedPlan: { /* Future implementation */ },
    hybridPlan: { /* Future implementation */ }
  },
  
  // Recommendations
  advisorRecommendations: {
    keyPoints: [String],
    detailedNotes: String,
    customVariables: [{
      variableName: String,
      value: Mixed,
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
  
  // Review & Tracking
  reviewSchedule: {
    frequency: String, // 'monthly', 'quarterly', 'semi-annually', 'annually'
    nextReviewDate: Date,
    reviewHistory: [{
      reviewDate: Date,
      reviewedBy: ObjectId,
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
  
  // Change History
  changeHistory: [{
    changeDate: Date,
    changedBy: ObjectId,
    changeType: String,
    description: String,
    previousValue: Mixed,
    newValue: Mixed
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## 🚨 Error Handling

### Standard Error Response Format
```javascript
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "value": "invalidValue",
    "reason": "Validation failed"
  },
  "timestamp": "2024-01-20T15:30:00.000Z",
  "requestId": "REQ_12345"
}
```

### HTTP Status Codes
| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Business logic validation fails |
| 500 | Internal Server Error | Server-side errors |

### Common Error Scenarios
```javascript
// Validation Error (400)
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "field": "monthlyIncome",
        "message": "Must be a positive number",
        "value": -1000
      }
    ]
  }
}

// Authentication Error (401)
{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide a valid token"
}

// Resource Not Found (404)
{
  "success": false,
  "error": "Client not found",
  "message": "Client with ID 507f1f77bcf86cd799439011 does not exist"
}

// Business Logic Error (422)
{
  "success": false,
  "error": "Cannot create plan",
  "message": "Client profile is incomplete. Please complete the onboarding process first.",
  "details": {
    "missingFields": ["totalMonthlyIncome", "totalMonthlyExpenses"],
    "completionPercentage": 45
  }
}
```

This comprehensive API documentation provides a complete reference for all backend endpoints, request/response formats, and database schemas used in the RicheAI financial planning system.