// Form constants extracted from ClientOnboardingForm.jsx

// Indian States for dropdown
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 
  'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 
  'Puducherry', 'Andaman and Nicobar Islands'
];

// Occupation options
export const OCCUPATION_OPTIONS = [
  'Government Employee', 'Private Employee', 'Teacher/Professor', 'Doctor', 'Engineer',
  'Lawyer', 'Chartered Accountant', 'Banking Professional', 'Insurance Professional',
  'IT Professional', 'Consultant', 'Sales Professional', 'Marketing Professional',
  'Finance Professional', 'HR Professional', 'Business Owner', 'Entrepreneur',
  'Freelancer', 'Retired', 'Student', 'Homemaker', 'Self Employed'
];

// Income type options
export const INCOME_TYPES = [
  'Salaried',
  'Business', 
  'Freelance',
  'Mixed'
];

// Investment experience options
export const INVESTMENT_EXPERIENCE_OPTIONS = [
  'Beginner (0-2 years)',
  'Intermediate (2-5 years)', 
  'Experienced (5-10 years)',
  'Expert (10+ years)'
];

// Risk tolerance options
export const RISK_TOLERANCE_OPTIONS = [
  'Conservative',
  'Moderate', 
  'Aggressive'
];

// Investment goals options
export const INVESTMENT_GOALS_OPTIONS = [
  'Retirement',
  'Education', 
  'Home Purchase',
  'Emergency Fund',
  'Wealth Building',
  'Tax Saving',
  'Other'
];

// Priority levels for goals
export const PRIORITY_LEVELS = [
  'Low',
  'Medium', 
  'High',
  'Critical'
];

// Gender options
export const GENDER_OPTIONS = [
  'male',
  'female', 
  'other'
];

// Marital status options
export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced', 
  'Widowed'
];

// Form step configuration
export const FORM_STEPS = [
  { 
    id: 1, 
    title: 'Personal Information', 
    subtitle: 'Basic details and KYC information',
    estimatedTime: '3-4 minutes' 
  },
  { 
    id: 2, 
    title: 'Income & Employment', 
    subtitle: 'Your income sources and monthly expenses',
    estimatedTime: '4-5 minutes' 
  },
  { 
    id: 3, 
    title: 'Retirement & Goals', 
    subtitle: 'Future financial objectives',
    estimatedTime: '3-4 minutes' 
  },
  { 
    id: 4, 
    title: 'Assets & Liabilities', 
    subtitle: 'Current investments and debts',
    estimatedTime: '4-5 minutes' 
  },
  { 
    id: 5, 
    title: 'Investment Profile', 
    subtitle: 'Experience and CAS upload',
    estimatedTime: '2-3 minutes' 
  }
];

// Default form values
export const DEFAULT_FORM_VALUES = {
  // Step 1 defaults
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  gender: '',
  panNumber: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  },
  // Step 2 defaults
  occupation: '',
  incomeType: '',
  employerBusinessName: '',
  annualIncome: '',
  additionalIncome: '',
  monthlyExpenses: {
    housingRent: '',
    groceriesUtilitiesFood: '',
    transportation: '',
    education: '',
    healthcare: '',
    entertainment: '',
    insurancePremiums: '',
    loanEmis: '',
    otherExpenses: ''
  },
  expenseNotes: '',
  annualTaxes: '',
  annualVacationExpenses: '',
  // Step 3 defaults
  retirementPlanning: {
    targetRetirementAge: '',
    retirementCorpusTarget: ''
  },
  majorGoals: [
    { goalName: "Child's Education", targetAmount: '', targetYear: '', priority: 'High' },
    { goalName: "Home Purchase", targetAmount: '', targetYear: '', priority: 'Medium' }
  ],
  // Step 4 defaults
  assets: {
    cashBankSavings: '',
    realEstate: '',
    investments: {
      equity: {
        mutualFunds: '',
        directStocks: ''
      },
      fixedIncome: {
        ppf: '',
        epf: '',
        nps: '',
        fixedDeposits: '',
        bondsDebentures: '',
        nsc: ''
      },
      other: {
        ulip: '',
        otherInvestments: ''
      }
    }
  },
  liabilities: {
    loans: '',
    creditCardDebt: ''
  },
  // Step 5 - Original fields for compatibility
  investmentExperience: '',
  riskTolerance: '',
  investmentGoals: [],
  monthlySavingsTarget: ''
};

// Form validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  pan: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
  minLength: (min) => `Minimum ${min} characters required`,
  maxLength: (max) => `Maximum ${max} characters allowed`,
  positiveNumber: 'Please enter a positive number',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past'
};