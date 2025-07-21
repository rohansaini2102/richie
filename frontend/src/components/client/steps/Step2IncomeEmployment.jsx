// Step 2: Income & Employment Analysis
import { useState } from 'react';
import { Briefcase, DollarSign, Calculator, HelpCircle, Eye } from 'lucide-react';
import { OCCUPATION_OPTIONS, INCOME_TYPES } from '../constants/formConstants';
import { getValidationRules } from '../utils/formValidation';
import { calculateFinancialSummary, formatCurrency } from '../utils/formCalculations';

const Step2IncomeEmployment = ({ register, errors, watch, setValue, getValues }) => {
  const validationRules = getValidationRules();
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  
  // Watch form values for real-time calculations
  const watchedValues = watch();
  const financialSummary = calculateFinancialSummary(watchedValues);
  
  const expenseFields = [
    { name: 'housingRent', label: 'Housing/Rent', icon: '🏠' },
    { name: 'groceriesUtilitiesFood', label: 'Groceries, Utilities & Food', icon: '🛒' },
    { name: 'transportation', label: 'Transportation', icon: '🚗' },
    { name: 'education', label: 'Education', icon: '📚' },
    { name: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { name: 'entertainment', label: 'Entertainment & Lifestyle', icon: '🎬' },
    { name: 'insurancePremiums', label: 'Insurance Premiums', icon: '🛡️' },
    { name: 'loanEmis', label: 'Loan EMIs', icon: '🏦' },
    { name: 'otherExpenses', label: 'Other Expenses', icon: '💳' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center space-x-3 mb-2">
          <Briefcase className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Income & Employment Analysis</h2>
        </div>
        <p className="text-gray-600">
          Help us understand your income sources and monthly expenses to create accurate financial projections.
        </p>
      </div>

      {/* Employment Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
          Employment Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation *
            </label>
            <select
              {...register('occupation', validationRules.occupation)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.occupation ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select your occupation</option>
              {OCCUPATION_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.occupation && (
              <p className="mt-1 text-sm text-red-600">{errors.occupation.message}</p>
            )}
          </div>

          {/* Income Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income Type *
            </label>
            <select
              {...register('incomeType', validationRules.incomeType)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.incomeType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select income type</option>
              {INCOME_TYPES.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.incomeType && (
              <p className="mt-1 text-sm text-red-600">{errors.incomeType.message}</p>
            )}
          </div>

          {/* Employer/Business Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employer/Business Name
            </label>
            <input
              type="text"
              {...register('employerBusinessName')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Company or business name"
            />
          </div>
        </div>
      </div>

      {/* Income Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 text-gray-600 mr-2" />
          Income Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Annual Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Income *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                type="number"
                {...register('annualIncome', validationRules.annualIncome)}
                className={`w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.annualIncome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="500000"
              />
            </div>
            {errors.annualIncome && (
              <p className="mt-1 text-sm text-red-600">{errors.annualIncome.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum ₹1,20,000 per year</p>
          </div>

          {/* Additional Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Income (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                type="number"
                {...register('additionalIncome', validationRules.additionalIncome)}
                className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="50000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Rental income, freelancing, etc.</p>
          </div>
        </div>
      </div>

      {/* Monthly Expenses */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 text-gray-600 mr-2" />
            Monthly Expenses
          </h3>
          <button
            type="button"
            onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            {showExpenseBreakdown ? 'Hide Details' : 'Show Breakdown'}
          </button>
        </div>

        {showExpenseBreakdown ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseFields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="mr-2">{field.icon}</span>
                  {field.label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    {...register(`monthlyExpenses.${field.name}`)}
                    className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-gray-600 text-center">
                Click "Show Breakdown" above to add detailed monthly expenses, or continue with simplified tracking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Additional Financial Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Financial Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Annual Taxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Tax Payments
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                type="number"
                {...register('annualTaxes')}
                className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="50000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Income tax, property tax, etc.</p>
          </div>

          {/* Annual Vacation Expenses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Vacation/Travel Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                type="number"
                {...register('annualVacationExpenses')}
                className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="100000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Family trips, holidays</p>
          </div>
        </div>

        {/* Expense Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            {...register('expenseNotes')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            rows="3"
            placeholder="Any specific information about your income or expenses..."
          />
        </div>
      </div>

      {/* Real-time Financial Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 text-blue-600 mr-2" />
            Financial Summary
          </h3>
          <button
            type="button"
            onClick={() => setShowFinancialSummary(!showFinancialSummary)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showFinancialSummary ? 'Hide' : 'Show'} Details
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.monthlyIncome)}
            </div>
            <div className="text-sm text-gray-600">Monthly Income</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary.totalMonthlyExpenses)}
            </div>
            <div className="text-sm text-gray-600">Monthly Expenses</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg">
            <div className={`text-2xl font-bold ${financialSummary.monthlySavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(financialSummary.monthlySavings)}
            </div>
            <div className="text-sm text-gray-600">Monthly Savings</div>
          </div>
          
          <div className="bg-white p-3 rounded-lg">
            <div className={`text-2xl font-bold ${financialSummary.savingsRate >= 20 ? 'text-green-600' : financialSummary.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {financialSummary.savingsRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Savings Rate</div>
          </div>
        </div>

        {showFinancialSummary && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Analysis:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {financialSummary.savingsRate >= 20 ? '✅ Excellent' : financialSummary.savingsRate >= 15 ? '✅ Good' : financialSummary.savingsRate >= 10 ? '⚠️ Average' : '❌ Below Average'} savings rate</li>
              <li>• {financialSummary.monthlySavings >= 0 ? '✅ Positive cash flow' : '❌ Negative cash flow - expenses exceed income'}</li>
              <li>• Monthly investment capacity: {formatCurrency(Math.max(0, financialSummary.monthlySavings * 0.8))}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-3">
          <HelpCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Need Help?</h4>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>Savings Rate Target:</strong> Aim for 20%+ for excellent financial health. 
              <strong>Monthly Expenses:</strong> Include all regular recurring costs. 
              <strong>Additional Income:</strong> Include rental income, freelancing, investments returns, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2IncomeEmployment;