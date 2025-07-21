import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for form validation
 * Provides validation rules, error handling, and validation state management
 */
export const useValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation rule definitions
  const defaultRules = {
    required: (value) => {
      if (value === null || value === undefined || value === '') {
        return 'This field is required';
      }
      return null;
    },
    
    email: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Invalid email format';
    },
    
    phone: (value) => {
      if (!value) return null;
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(value) ? null : 'Invalid phone number';
    },
    
    pan: (value) => {
      if (!value) return null;
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      return panRegex.test(value) ? null : 'Invalid PAN format (e.g., ABCDE1234F)';
    },
    
    positive: (value) => {
      if (!value && value !== 0) return null;
      const num = parseFloat(value);
      return num >= 0 ? null : 'Value must be positive';
    },
    
    positiveNonZero: (value) => {
      if (!value && value !== 0) return null;
      const num = parseFloat(value);
      return num > 0 ? null : 'Value must be greater than zero';
    },
    
    percentage: (value) => {
      if (!value && value !== 0) return null;
      const num = parseFloat(value);
      return (num >= 0 && num <= 100) ? null : 'Value must be between 0 and 100';
    },
    
    minValue: (min) => (value) => {
      if (!value && value !== 0) return null;
      const num = parseFloat(value);
      return num >= min ? null : `Value must be at least ${min}`;
    },
    
    maxValue: (max) => (value) => {
      if (!value && value !== 0) return null;
      const num = parseFloat(value);
      return num <= max ? null : `Value must be at most ${max}`;
    },
    
    minLength: (min) => (value) => {
      if (!value) return null;
      return value.length >= min ? null : `Must be at least ${min} characters`;
    },
    
    maxLength: (max) => (value) => {
      if (!value) return null;
      return value.length <= max ? null : `Must be at most ${max} characters`;
    },
    
    dateNotFuture: (value) => {
      if (!value) return null;
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return date <= today ? null : 'Date cannot be in the future';
    },
    
    ageRange: (min, max) => (value) => {
      if (!value) return null;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < min) return `Age must be at least ${min}`;
      if (age > max) return `Age must be at most ${max}`;
      return null;
    }
  };

  // Validate a single field
  const validateField = useCallback((fieldName, value, rules = []) => {
    const fieldRules = validationRules[fieldName] || rules;
    
    for (const rule of fieldRules) {
      let validator;
      let params = [];
      
      if (typeof rule === 'string') {
        validator = defaultRules[rule];
      } else if (typeof rule === 'function') {
        validator = rule;
      } else if (typeof rule === 'object') {
        const { type, params: ruleParams = [], message } = rule;
        validator = defaultRules[type];
        params = ruleParams;
        
        // Custom error message override
        if (validator && message) {
          const originalValidator = validator;
          validator = (...args) => {
            const result = originalValidator(...args);
            return result ? message : null;
          };
        }
      }
      
      if (validator) {
        const error = params.length > 0 ? validator(...params)(value) : validator(value);
        if (error) {
          return error;
        }
      }
    }
    
    return null;
  }, [validationRules]);

  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules, validateField]);

  // Update field value and validate
  const updateValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  }, [errors]);

  // Mark field as touched and validate
  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [values, validateField]);

  // Computed validation state
  const validationState = useMemo(() => {
    const hasErrors = Object.values(errors).some(error => error !== null);
    const hasTouchedFields = Object.values(touched).some(Boolean);
    const allRequiredFieldsFilled = Object.keys(validationRules).every(fieldName => {
      const rules = validationRules[fieldName];
      const hasRequiredRule = rules.some(rule => 
        rule === 'required' || 
        (typeof rule === 'object' && rule.type === 'required')
      );
      return !hasRequiredRule || values[fieldName];
    });
    
    return {
      isValid: !hasErrors && allRequiredFieldsFilled,
      hasErrors,
      hasTouchedFields,
      allRequiredFieldsFilled,
      errorCount: Object.values(errors).filter(Boolean).length,
      touchedCount: Object.values(touched).filter(Boolean).length
    };
  }, [errors, touched, values, validationRules]);

  // Utility functions for specific validation scenarios
  const financialValidators = {
    // Validate income and expense ratios
    validateIncomeExpenseRatio: (income, expenses) => {
      const ratio = income > 0 ? (expenses / income) * 100 : 0;
      if (ratio > 100) return 'Expenses cannot exceed income';
      if (ratio > 80) return 'Warning: Expenses are very high (>80% of income)';
      return null;
    },
    
    // Validate EMI to income ratio
    validateEMIRatio: (totalEMI, income) => {
      const ratio = income > 0 ? (totalEMI / income) * 100 : 0;
      if (ratio > 50) return 'EMI ratio exceeds safe limit of 50%';
      if (ratio > 40) return 'Warning: EMI ratio is high (>40% of income)';
      return null;
    },
    
    // Validate age-based parameters
    validateRetirementAge: (currentAge, retirementAge) => {
      if (retirementAge <= currentAge) return 'Retirement age must be greater than current age';
      if (retirementAge > 75) return 'Retirement age seems too high';
      if (retirementAge < 50) return 'Retirement age seems too low';
      return null;
    }
  };

  // Reset form
  const reset = useCallback((newInitialValues = initialValues) => {
    setValues(newInitialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((fieldName) => ({
    value: values[fieldName] || '',
    onChange: (event) => {
      const value = event.target ? event.target.value : event;
      updateValue(fieldName, value);
    },
    onBlur: () => touchField(fieldName),
    error: touched[fieldName] && Boolean(errors[fieldName]),
    helperText: touched[fieldName] ? errors[fieldName] : ''
  }), [values, errors, touched, updateValue, touchField]);

  return {
    // Current state
    values,
    errors,
    touched,
    validationState,
    
    // Actions
    updateValue,
    touchField,
    validateField,
    validateAll,
    reset,
    
    // Utilities
    getFieldProps,
    financialValidators,
    
    // Convenience methods
    setFieldValue: updateValue,
    setFieldError: (fieldName, error) => setErrors(prev => ({ ...prev, [fieldName]: error })),
    clearFieldError: (fieldName) => setErrors(prev => ({ ...prev, [fieldName]: null })),
    clearAllErrors: () => setErrors({}),
    
    // Bulk operations
    setValues: (newValues) => setValues(prev => ({ ...prev, ...newValues })),
    setErrors: (newErrors) => setErrors(prev => ({ ...prev, ...newErrors })),
    setTouched: (newTouched) => setTouched(prev => ({ ...prev, ...newTouched }))
  };
};

export default useValidation;