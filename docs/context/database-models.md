# Database Models Overview

## MongoDB Collections

### 1. Advisor Collection
**File**: `backend/models/Advisor.js`

#### Core Fields
- `firstName`, `lastName`: Required, max 50 characters
- `email`: Unique, lowercase, validated
- `password`: bcrypt hashed, min 8 characters, select: false
- `phoneNumber`: String
- `isEmailVerified`: Boolean, default false
- `status`: Enum ['active', 'inactive', 'suspended'], default 'active'

#### SEBI Compliance Fields
- `sebiRegNumber`: SEBI registration number
- `arnNumber`: ARN (AMFI Registration Number)
- `euinNumber`: EUIN number
- `ppbNumber`: PPB number
- `firmName`: Advisory firm name
- `revenueModel`: Enum ['Fee-Only', 'Commission-Based', 'Fee + Commission']

#### Professional Information
- `educationalQualifications`: Array of strings
- `professionalExperience`: Number (years)
- `specializations`: Array of strings
- `businessAddress`: Object with street, city, state, pincode, country

#### Middleware
- **Pre-save**: Password hashing with bcrypt (12 rounds)
- **Methods**: `comparePassword()` for authentication

### 2. Client Collection
**File**: `backend/models/Client.js` - **967 lines**

#### Core Structure
- **7-step onboarding process**
- **Comprehensive financial data model**
- **CAS integration ready**
- **Validation at every step**

#### Step 1: Personal Information
```javascript
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  }
}
```

#### Step 2: Income & Employment
```javascript
{
  incomeDetails: {
    type: { type: String, enum: ['salaried', 'business', 'professional', 'retired'] },
    monthlyIncome: Number,
    annualIncome: Number,
    additionalIncome: Number,
    incomeGrowthRate: Number
  },
  employmentDetails: {
    status: String,
    profession: String,
    company: String,
    workExperience: Number,
    retirementAge: Number
  }
}
```

#### Step 3: Retirement Planning
```javascript
{
  retirementPlanning: {
    currentAge: Number,
    retirementAge: Number,
    desiredRetirementCorpus: Number,
    currentRetirementSavings: Number,
    monthlyRetirementSavings: Number,
    expectedInflationRate: Number,
    expectedReturnRate: Number
  }
}
```

#### Step 4: CAS & Investments
```javascript
{
  casData: {
    type: Object,
    default: null // Populated by CAS parser
  },
  existingInvestments: {
    hasInvestments: Boolean,
    types: [String], // ['mutual_funds', 'stocks', 'bonds', 'fd', 'ppf']
    totalValue: Number,
    details: Object
  }
}
```

#### Step 5: Debts & Liabilities
```javascript
{
  debtsAndLiabilities: {
    hasDebts: Boolean,
    homeLoan: {
      amount: Number,
      emi: Number,
      remainingTenure: Number,
      interestRate: Number
    },
    personalLoan: { /* similar structure */ },
    carLoan: { /* similar structure */ },
    creditCard: {
      outstandingAmount: Number,
      monthlyPayment: Number
    },
    otherDebts: [{
      type: String,
      amount: Number,
      emi: Number
    }],
    totalMonthlyEMI: Number
  }
}
```

#### Step 6: Insurance (Optional)
```javascript
{
  insurance: {
    lifeInsurance: {
      hasPolicy: Boolean,
      policies: [{
        policyNumber: String,
        insuranceCompany: String,
        sumAssured: Number,
        premium: Number,
        policyType: String,
        maturityDate: Date
      }]
    },
    healthInsurance: { /* similar structure */ },
    vehicleInsurance: { /* similar structure */ }
  }
}
```

#### Step 7: Goals & Risk Profile
```javascript
{
  financialGoals: [{
    goalName: String,
    targetAmount: Number,
    timeHorizon: Number,
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    currentSavings: Number,
    monthlyContribution: Number
  }],
  riskProfile: {
    riskTolerance: { type: String, enum: ['conservative', 'moderate', 'aggressive'] },
    investmentExperience: String,
    investmentHorizon: String,
    liquidityNeeds: String
  }
}
```

#### Enhanced Financial Goals
```javascript
{
  enhancedFinancialGoals: {
    emergencyFund: {
      targetAmount: Number,
      currentAmount: Number,
      monthlyContribution: Number,
      priority: String
    },
    homeOwnership: { /* goal structure */ },
    childrenEducation: { /* goal structure */ },
    childrenMarriage: { /* goal structure */ },
    retirement: { /* goal structure */ },
    wealthCreation: { /* goal structure */ },
    travelAndLeisure: { /* goal structure */ }
  }
}
```

#### Calculated Fields
```javascript
{
  calculatedFinancials: {
    netWorth: Number,
    monthlyExpenses: Number,
    savingsRate: Number,
    debtToIncomeRatio: Number,
    liquidityRatio: Number,
    lastUpdated: Date
  }
}
```

#### Metadata
```javascript
{
  onboardingStatus: {
    type: String,
    enum: ['invited', 'in_progress', 'completed', 'cancelled'],
    default: 'invited'
  },
  currentStep: { type: Number, default: 1, min: 1, max: 7 },
  completedSteps: [Number],
  advisor: { type: ObjectId, ref: 'Advisor', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 3. ClientInvitation Collection
**File**: `backend/models/ClientInvitation.js`

#### Core Fields
```javascript
{
  advisor: { type: ObjectId, ref: 'Advisor', required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'opened', 'completed', 'expired'],
    default: 'pending'
  },
  expiresAt: { type: Date, required: true },
  sentAt: Date,
  openedAt: Date,
  completedAt: Date
}
```

#### CAS Integration Fields
```javascript
{
  casUploadData: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    password: String,
    uploadedAt: Date,
    eventId: String
  },
  casParsedData: {
    type: Object,
    default: null
  }
}
```

#### Email Tracking
```javascript
{
  emailTracking: {
    attempts: { type: Number, default: 0 },
    lastAttempt: Date,
    deliveryStatus: String,
    openTracking: Boolean,
    clickTracking: Boolean
  }
}
```

## Indexes and Performance

### Advisor Collection Indexes
- `email`: Unique index for authentication
- `sebiRegNumber`: Index for regulatory lookup
- `status`: Index for active advisor queries

### Client Collection Indexes
- `email`: Unique index
- `advisor`: Index for advisor-specific queries
- `onboardingStatus`: Index for status filtering
- `createdAt`: Index for chronological sorting

### ClientInvitation Collection Indexes
- `token`: Unique index for invitation access
- `advisor`: Index for advisor invitations
- `status`: Index for status filtering
- `expiresAt`: Index for cleanup operations

## Validation Rules

### Email Validation
- Format: `/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/`
- Unique across collections
- Case-insensitive storage

### Phone Validation
- Indian format: 10-digit numbers
- International format support

### Financial Data Validation
- Positive numbers for amounts
- Percentage fields (0-100)
- Date validation for future goals

## Relationships

### One-to-Many: Advisor → Clients
```javascript
// In Client model
advisor: { type: ObjectId, ref: 'Advisor', required: true }

// Population example
Client.find().populate('advisor', 'firstName lastName email')
```

### One-to-Many: Advisor → ClientInvitations
```javascript
// In ClientInvitation model
advisor: { type: ObjectId, ref: 'Advisor', required: true }
```

### Temporary: ClientInvitation → Client Data
- CAS data temporarily stored in invitation
- Transferred to Client on completion
- Cleaned up after successful onboarding

## Data Lifecycle

### Client Onboarding Flow
1. **Invitation Created**: Token generated, email sent
2. **Form Started**: Client begins onboarding
3. **CAS Upload** (Step 4): File processed, data extracted
4. **Form Completion**: All steps filled
5. **Client Creation**: Full client record created
6. **Invitation Cleanup**: Temporary data removed

### Data Retention
- **Active Clients**: Indefinite storage
- **Completed Invitations**: 30-day retention
- **Expired Invitations**: 7-day cleanup
- **CAS Files**: Deleted after parsing (security)

## Security Considerations

### Sensitive Data Protection
- Passwords: bcrypt hashed, never stored in plain text
- PAN numbers: Encrypted at rest (ready for implementation)
- CAS data: Temporary storage only, cleaned after processing
- Financial data: Access-controlled, audit-logged

### Access Control
- Advisor can only access their own clients
- Client data isolated by advisor relationship
- Admin access for system management only
- No cross-advisor data visibility