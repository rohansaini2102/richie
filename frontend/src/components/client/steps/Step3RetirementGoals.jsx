// Step 3: Retirement & Financial Goals
import { useState } from 'react';
import { Target, PiggyBank, Plus, Trash2, Calculator, TrendingUp } from 'lucide-react';
import { PRIORITY_LEVELS } from '../constants/formConstants';
import { getValidationRules } from '../utils/formValidation';
import { calculateRetirementCorpus, calculateGoalFeasibility, formatCurrency, calculateFinancialSummary } from '../utils/formCalculations';

const Step3RetirementGoals = ({ register, errors, watch, setValue, getValues }) => {
  const validationRules = getValidationRules();
  const [customGoals, setCustomGoals] = useState([]);
  const [showRetirementDetails, setShowRetirementDetails] = useState(false);
  
  // Watch form values for real-time calculations
  const watchedValues = watch();
  const financialSummary = calculateFinancialSummary(watchedValues);
  
  // Calculate current age from date of birth
  const dateOfBirth = watchedValues.dateOfBirth;
  const currentAge = dateOfBirth ? 
    new Date().getFullYear() - new Date(dateOfBirth).getFullYear() : 25;
  
  const retirementAge = watchedValues.retirementPlanning?.targetRetirementAge || 60;
  const retirementCorpusTarget = watchedValues.retirementPlanning?.retirementCorpusTarget;
  
  // Calculate retirement corpus requirement
  const retirementCalculation = calculateRetirementCorpus(
    currentAge, 
    retirementAge, 
    financialSummary.monthlyIncome
  );
  
  const addCustomGoal = () => {
    const newGoal = {
      id: Date.now(),
      goalName: '',
      targetAmount: '',
      targetYear: new Date().getFullYear() + 5,
      priority: 'Medium'
    };
    setCustomGoals([...customGoals, newGoal]);
  };
  
  const removeCustomGoal = (goalId) => {
    setCustomGoals(customGoals.filter(goal => goal.id !== goalId));
  };
  
  const updateCustomGoal = (goalId, field, value) => {
    setCustomGoals(customGoals.map(goal => 
      goal.id === goalId ? { ...goal, [field]: value } : goal
    ));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-3 mb-2">
          <Target className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Retirement & Financial Goals</h2>
        </div>
        <p className="text-gray-600">
          Let's plan for your future! Define your retirement plans and major life goals to create a roadmap for success.
        </p>
      </div>

      {/* Retirement Planning */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <PiggyBank className="h-5 w-5 text-gray-600 mr-2" />
            Retirement Planning
          </h3>
          <button
            type="button"
            onClick={() => setShowRetirementDetails(!showRetirementDetails)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
          >
            <Calculator className="h-4 w-4 mr-1" />
            {showRetirementDetails ? 'Hide' : 'Show'} Calculator
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Age (Auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Age
            </label>
            <input
              type="number"
              value={currentAge}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Calculated from date of birth</p>
          </div>

          {/* Target Retirement Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Retirement Age
            </label>
            <input
              type="number"
              {...register('retirementPlanning.targetRetirementAge')}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.retirementPlanning?.targetRetirementAge ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="60"
              min="45"
              max="75"
            />
            {errors.retirementPlanning?.targetRetirementAge && (
              <p className="mt-1 text-sm text-red-600">{errors.retirementPlanning.targetRetirementAge.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Between 45-75 years</p>
          </div>

          {/* Target Retirement Corpus */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Retirement Corpus
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                type="number"
                {...register('retirementPlanning.retirementCorpusTarget', validationRules.retirementCorpusTarget)}
                className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="10000000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Recommended: {formatCurrency(retirementCalculation.requiredCorpus)} 
              (based on current income and retirement age)
            </p>
          </div>
        </div>

        {/* Retirement Calculator */}
        {showRetirementDetails && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Retirement Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-purple-800">Years to Retirement</div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(0, retirementAge - currentAge)} years
                </div>
              </div>
              <div>
                <div className="font-medium text-purple-800">Required Monthly Expenses</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(retirementCalculation.futureMonthlyExpenses)}
                </div>
              </div>
              <div>
                <div className="font-medium text-purple-800">Recommended Corpus</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(retirementCalculation.requiredCorpus)}
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Assumptions:</strong> 6% inflation, 4% withdrawal rate post-retirement, 
                70% of current income needed. Monthly SIP required: 
                <strong className="text-purple-600">
                  {formatCurrency((retirementCalculation.requiredCorpus * 0.12/12) / 
                    (Math.pow(1.01, (retirementAge - currentAge) * 12) - 1))}
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Major Goals */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 text-gray-600 mr-2" />
          Major Life Goals
        </h3>
        
        {/* Pre-defined Goals */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                {...register('majorGoals.0.goalName')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Child's Education"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  {...register('majorGoals.0.targetAmount')}
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="2500000"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Year
              </label>
              <input
                type="number"
                {...register('majorGoals.0.targetYear')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder={new Date().getFullYear() + 10}
                min={new Date().getFullYear() + 1}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register('majorGoals.0.priority')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="md:col-span-1">
              <input
                type="text"
                {...register('majorGoals.1.goalName')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Home Purchase"
              />
            </div>
            <div className="md:col-span-1">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  {...register('majorGoals.1.targetAmount')}
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="5000000"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <input
                type="number"
                {...register('majorGoals.1.targetYear')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder={new Date().getFullYear() + 7}
                min={new Date().getFullYear() + 1}
              />
            </div>
            <div className="md:col-span-1">
              <select
                {...register('majorGoals.1.priority')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Custom Goals */}
        {customGoals.map((goal, index) => (
          <div key={goal.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
            <div className="md:col-span-1">
              <input
                type="text"
                value={goal.goalName}
                onChange={(e) => updateCustomGoal(goal.id, 'goalName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Goal name"
              />
            </div>
            <div className="md:col-span-1">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={goal.targetAmount}
                  onChange={(e) => updateCustomGoal(goal.id, 'targetAmount', e.target.value)}
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Amount"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <input
                type="number"
                value={goal.targetYear}
                onChange={(e) => updateCustomGoal(goal.id, 'targetYear', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                min={new Date().getFullYear() + 1}
              />
            </div>
            <div className="md:col-span-1 flex items-center space-x-2">
              <select
                value={goal.priority}
                onChange={(e) => updateCustomGoal(goal.id, 'priority', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeCustomGoal(goal.id)}
                className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Goal Button */}
        <button
          type="button"
          onClick={addCustomGoal}
          className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Another Goal</span>
        </button>
      </div>

      {/* Goal Feasibility Analysis */}
      {financialSummary.monthlySavings > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="h-5 w-5 text-blue-600 mr-2" />
            Goal Feasibility Analysis
          </h3>
          
          <div className="text-sm text-blue-700 mb-4">
            Based on your monthly savings of {formatCurrency(financialSummary.monthlySavings)}, 
            here's how your goals stack up:
          </div>
          
          <div className="space-y-3">
            {watchedValues.majorGoals?.map((goal, index) => {
              if (!goal.goalName || !goal.targetAmount || !goal.targetYear) return null;
              
              const feasibility = calculateGoalFeasibility(
                parseFloat(goal.targetAmount),
                parseInt(goal.targetYear),
                financialSummary.monthlySavings * 0.6 // 60% of savings for goals
              );
              
              return (
                <div key={index} className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{goal.goalName}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(goal.targetAmount)} by {goal.targetYear}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${feasibility.feasible ? 'text-green-600' : 'text-red-600'}`}>
                        {feasibility.feasible ? '✅ Achievable' : '❌ Challenging'}
                      </div>
                      <div className="text-xs text-gray-600">
                        Required: {formatCurrency(feasibility.requiredMonthlySIP)}/month
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Planning Tips</h4>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>Retirement:</strong> Start early for compound growth benefit. 
              <strong>Goals:</strong> Be specific and realistic with timelines. 
              <strong>Priority:</strong> Focus on high-priority goals first, emergency fund should be your top priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3RetirementGoals;