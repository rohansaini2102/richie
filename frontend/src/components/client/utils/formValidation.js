// Form validation utilities extracted from ClientOnboardingForm.jsx
import { VALIDATION_MESSAGES } from '../constants/formConstants';

/**
 * Validate PAN number format
 */
export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate age (between 18 and 100)
 */
export const validateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 18 && age <= 100;
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
};

/**
 * Validate future year
 */
export const validateFutureYear = (year) => {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);
  return yearNum > currentYear && yearNum <= currentYear + 50;
};

/**
 * Form validation rules for react-hook-form
 */
export const getValidationRules = () => ({
  // Step 1 - Personal Information
  firstName: {
    required: VALIDATION_MESSAGES.required,
    minLength: {
      value: 2,
      message: VALIDATION_MESSAGES.minLength(2)
    },
    maxLength: {
      value: 50,
      message: VALIDATION_MESSAGES.maxLength(50)
    }
  },
  lastName: {
    required: VALIDATION_MESSAGES.required,
    minLength: {
      value: 2,
      message: VALIDATION_MESSAGES.minLength(2)
    },
    maxLength: {
      value: 50,
      message: VALIDATION_MESSAGES.maxLength(50)
    }
  },
  email: {
    required: VALIDATION_MESSAGES.required,
    validate: {
      validEmail: (value) => validateEmail(value) || VALIDATION_MESSAGES.email
    }
  },
  phoneNumber: {
    required: VALIDATION_MESSAGES.required,
    validate: {
      validPhone: (value) => validatePhone(value) || VALIDATION_MESSAGES.phone
    }
  },
  dateOfBirth: {
    required: VALIDATION_MESSAGES.required,
    validate: {
      validAge: (value) => validateAge(value) || 'Age must be between 18 and 100 years'
    }
  },
  panNumber: {
    validate: {
      validPAN: (value) => !value || validatePAN(value) || VALIDATION_MESSAGES.pan
    }
  },

  // Step 2 - Income & Employment
  occupation: {
    required: VALIDATION_MESSAGES.required
  },
  incomeType: {
    required: VALIDATION_MESSAGES.required
  },
  annualIncome: {
    required: VALIDATION_MESSAGES.required,
    validate: {
      positiveNumber: (value) => validatePositiveNumber(value) || VALIDATION_MESSAGES.positiveNumber,
      minimumIncome: (value) => parseFloat(value) >= 120000 || 'Annual income must be at least ₹1,20,000'
    }
  },
  additionalIncome: {
    validate: {
      positiveNumber: (value) => !value || validatePositiveNumber(value) || VALIDATION_MESSAGES.positiveNumber
    }
  },

  // Monthly expenses validation
  monthlyExpenses: {
    validate: {
      positiveNumbers: (expenses) => {
        if (!expenses) return true;
        for (const [key, value] of Object.entries(expenses)) {
          if (value && !validatePositiveNumber(value)) {
            return `${key} must be a positive number`;
          }
        }
        return true;
      }
    }
  },

  // Step 3 - Retirement Planning
  retirementAge: {
    validate: {
      validAge: (value) => {
        if (!value) return true;
        const age = parseInt(value);
        return (age >= 45 && age <= 75) || 'Retirement age must be between 45 and 75';
      }
    }
  },
  retirementCorpusTarget: {
    validate: {
      positiveNumber: (value) => !value || validatePositiveNumber(value) || VALIDATION_MESSAGES.positiveNumber,
      minimumCorpus: (value) => !value || parseFloat(value) >= 1000000 || 'Minimum retirement corpus should be ₹10 lakhs'
    }
  },

  // Goal validation
  goalAmount: {
    validate: {
      positiveNumber: (value) => !value || validatePositiveNumber(value) || VALIDATION_MESSAGES.positiveNumber
    }
  },
  targetYear: {
    validate: {
      futureYear: (value) => !value || validateFutureYear(value) || 'Target year must be in the future'
    }
  },

  // Step 4 - Assets validation
  assets: {
    validate: {
      positiveNumbers: (assets) => {
        if (!assets) return true;
        
        // Validate cash and real estate
        if (assets.cashBankSavings && !validatePositiveNumber(assets.cashBankSavings)) {
          return 'Cash & Bank Savings must be a positive number';
        }
        if (assets.realEstate && !validatePositiveNumber(assets.realEstate)) {
          return 'Real Estate value must be a positive number';
        }
        
        // Validate investments
        if (assets.investments) {
          const investments = assets.investments;
          const allInvestmentFields = [
            ...Object.values(investments.equity || {}),
            ...Object.values(investments.fixedIncome || {}),
            ...Object.values(investments.other || {})
          ];
          
          for (const value of allInvestmentFields) {
            if (value && !validatePositiveNumber(value)) {
              return 'All investment amounts must be positive numbers';
            }
          }
        }
        
        return true;
      }
    }
  },

  // Liabilities validation
  liabilities: {
    validate: {
      positiveNumbers: (liabilities) => {
        if (!liabilities) return true;
        
        for (const [key, value] of Object.entries(liabilities)) {
          if (value && !validatePositiveNumber(value)) {
            return `${key} must be a positive number`;
          }
        }
        return true;
      }
    }
  },

  // Step 5 - Investment Profile
  investmentExperience: {
    required: VALIDATION_MESSAGES.required
  },
  riskTolerance: {
    required: VALIDATION_MESSAGES.required
  },
  monthlySavingsTarget: {
    validate: {
      positiveNumber: (value) => !value || validatePositiveNumber(value) || VALIDATION_MESSAGES.positiveNumber
    }
  }
});

/**
 * Validate individual form step
 */
export const validateFormStep = (stepNumber, formData) => {
  const errors = [];

  switch (stepNumber) {
    case 1:
      if (!formData.firstName?.trim()) errors.push('First name is required');
      if (!formData.lastName?.trim()) errors.push('Last name is required');
      if (!formData.email?.trim()) errors.push('Email is required');
      else if (!validateEmail(formData.email)) errors.push('Valid email is required');
      if (!formData.phoneNumber?.trim()) errors.push('Phone number is required');
      else if (!validatePhone(formData.phoneNumber)) errors.push('Valid phone number is required');
      if (!formData.dateOfBirth) errors.push('Date of birth is required');
      else if (!validateAge(formData.dateOfBirth)) errors.push('Age must be between 18 and 100');
      if (formData.panNumber && !validatePAN(formData.panNumber)) errors.push('Valid PAN number required');
      break;

    case 2:
      if (!formData.occupation?.trim()) errors.push('Occupation is required');
      if (!formData.incomeType?.trim()) errors.push('Income type is required');
      if (!formData.annualIncome) errors.push('Annual income is required');
      else if (!validatePositiveNumber(formData.annualIncome)) errors.push('Annual income must be positive');
      else if (parseFloat(formData.annualIncome) < 120000) errors.push('Annual income must be at least ₹1,20,000');
      break;

    case 3:
      // Retirement planning is optional but if provided, should be valid
      if (formData.retirementPlanning?.targetRetirementAge) {
        const age = parseInt(formData.retirementPlanning.targetRetirementAge);
        if (age < 45 || age > 75) errors.push('Retirement age must be between 45 and 75');
      }
      break;

    case 4:
      // Assets and liabilities validation - mostly optional but should be positive if provided
      // No strict requirements for this step
      break;

    case 5:
      if (!formData.investmentExperience?.trim()) errors.push('Investment experience is required');
      if (!formData.riskTolerance?.trim()) errors.push('Risk tolerance is required');
      break;

    default:
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if form is ready for submission
 */
export const validateCompleteForm = (formData) => {
  const errors = [];
  
  // Check all required steps
  for (let step = 1; step <= 5; step++) {
    const stepValidation = validateFormStep(step, formData);
    if (!stepValidation.isValid) {
      errors.push(`Step ${step}: ${stepValidation.errors.join(', ')}`);
    }
  }
  
  // Additional cross-step validations
  if (formData.majorGoals && formData.majorGoals.length > 0) {
    formData.majorGoals.forEach((goal, index) => {
      if (goal.goalName && goal.targetAmount && !validatePositiveNumber(goal.targetAmount)) {
        errors.push(`Goal ${index + 1}: Target amount must be positive`);
      }
      if (goal.goalName && goal.targetYear && !validateFutureYear(goal.targetYear)) {
        errors.push(`Goal ${index + 1}: Target year must be in the future`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};