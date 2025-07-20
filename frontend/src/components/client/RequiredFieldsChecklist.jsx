// frontend/src/components/client/RequiredFieldsChecklist.jsx
import React from 'react';
import { CheckCircle, AlertCircle, Clock, X } from 'lucide-react';

const RequiredFieldsChecklist = ({ 
  formValues, 
  errors, 
  currentStep, 
  onClose, 
  isVisible = true 
}) => {
  if (!isVisible) return null;

  // Helper function to check if a field has a value
  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value) && value >= 0;
    return Boolean(value);
  };

  // Helper function to check if a field has validation errors
  const hasError = (fieldPath) => {
    const paths = fieldPath.split('.');
    let errorObj = errors;
    for (const path of paths) {
      if (errorObj && errorObj[path]) {
        errorObj = errorObj[path];
      } else {
        return false;
      }
    }
    return Boolean(errorObj);
  };

  // Helper function to get nested form values
  const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    return value;
  };

  // Define all required fields with their validation criteria
  const requiredFields = [
    // Step 1: Personal Information
    {
      step: 1,
      category: "Personal Information",
      fields: [
        { field: 'firstName', label: 'First Name', critical: true },
        { field: 'lastName', label: 'Last Name', critical: true },
        { field: 'email', label: 'Email Address', critical: true },
        { field: 'phoneNumber', label: 'Phone Number (+91-XXXXXXXXXX)', critical: false },
        { field: 'dateOfBirth', label: 'Date of Birth', critical: false },
        { field: 'gender', label: 'Gender', critical: false },
        { field: 'panNumber', label: 'PAN Number (ABCDE1234F format)', critical: false },
        { field: 'address.street', label: 'Street Address', critical: false },
        { field: 'address.city', label: 'City', critical: false },
        { field: 'address.state', label: 'State', critical: false },
        { field: 'address.zipCode', label: 'PIN Code (6 digits)', critical: false },
      ]
    },
    // Step 2: Income & Employment  
    {
      step: 2,
      category: "Income & Employment",
      fields: [
        { field: 'occupation', label: 'Occupation', critical: false },
        { field: 'employerBusinessName', label: 'Employer/Business Name', critical: false },
        { field: 'annualIncome', label: 'Annual Income', critical: false },
        { field: 'totalMonthlyExpenses', label: 'Total Monthly Expenses', critical: false },
        { field: 'incomeType', label: 'Income Type', critical: true },
      ]
    },
    // Step 3: Retirement Planning
    {
      step: 3,
      category: "Retirement Planning", 
      fields: [
        { field: 'retirementAge', label: 'Target Retirement Age (45-75)', critical: false },
      ]
    },
    // Step 7: Goals & Risk Profile (Critical for submission)
    {
      step: 7,
      category: "Investment Profile (Required for Submission)",
      fields: [
        { field: 'investmentExperience', label: 'Investment Experience', critical: true },
        { field: 'riskTolerance', label: 'Risk Tolerance', critical: true },
        { field: 'monthlyInvestmentCapacity', label: 'Monthly Investment Capacity', critical: true },
      ]
    }
  ];

  // Calculate completion status for each field
  const getFieldStatus = (field) => {
    const value = getNestedValue(formValues, field.field);
    const hasErr = hasError(field.field);
    
    if (hasErr) {
      return { status: 'error', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (hasValue(value)) {
      return { status: 'complete', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (field.critical) {
      return { status: 'critical', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' };
    } else {
      return { status: 'pending', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
  };

  // Get overall completion statistics
  const getCompletionStats = () => {
    const allFields = requiredFields.flatMap(category => category.fields);
    const criticalFields = allFields.filter(field => field.critical);
    
    const completedFields = allFields.filter(field => {
      const value = getNestedValue(formValues, field.field);
      return hasValue(value) && !hasError(field.field);
    });
    
    const completedCritical = criticalFields.filter(field => {
      const value = getNestedValue(formValues, field.field);
      return hasValue(value) && !hasError(field.field);
    });

    return {
      total: allFields.length,
      completed: completedFields.length,
      critical: criticalFields.length,
      criticalCompleted: completedCritical.length,
      percentage: Math.round((completedFields.length / allFields.length) * 100)
    };
  };

  const stats = getCompletionStats();
  const canSubmit = stats.criticalCompleted === stats.critical;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Required Fields Checklist</h3>
            <p className="text-blue-100 text-sm">
              Complete {stats.completed}/{stats.total} fields • Critical: {stats.criticalCompleted}/{stats.critical}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
          
          {/* Submission Status */}
          <div className={`mt-3 p-3 rounded-lg ${canSubmit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {canSubmit ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${canSubmit ? 'text-green-800' : 'text-red-800'}`}>
                {canSubmit 
                  ? 'Ready to submit! All critical fields completed.' 
                  : `Missing ${stats.critical - stats.criticalCompleted} critical field(s) for submission.`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Fields List */}
        <div className="overflow-y-auto max-h-96 p-4">
          {requiredFields.map((category) => (
            <div key={category.step} className="mb-6">
              <div className="flex items-center mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                  category.step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {category.step}
                </div>
                <h4 className="font-medium text-gray-900">{category.category}</h4>
                {category.category.includes('Required for Submission') && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Critical
                  </span>
                )}
              </div>
              
              <div className="ml-9 space-y-2">
                {category.fields.map((field) => {
                  const status = getFieldStatus(field);
                  const Icon = status.icon;
                  
                  return (
                    <div key={field.field} className={`flex items-center p-2 rounded-lg ${status.bgColor}`}>
                      <Icon className={`h-4 w-4 mr-3 ${status.color}`} />
                      <span className="text-sm text-gray-700 flex-1">{field.label}</span>
                      {field.critical && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full ml-2">
                          Critical
                        </span>
                      )}
                      {status.status === 'error' && (
                        <span className="text-xs text-red-600 ml-2">Has errors</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span>Completed field</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-2" />
              <span>Optional field (not filled)</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span>Required field (missing or has errors)</span>
            </div>
          </div>
          
          {!canSubmit && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Complete all fields marked as "Critical" to enable form submission. 
                You must reach Step 7 to fill the investment profile fields.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequiredFieldsChecklist;