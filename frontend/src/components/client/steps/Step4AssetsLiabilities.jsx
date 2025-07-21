// Step 4: Assets & Liabilities Assessment
import { useState } from 'react';
import { Banknote, Home, TrendingUp, Building, CreditCard, Calculator, Eye, BarChart3 } from 'lucide-react';
import { calculateAssetsLiabilities, formatCurrency, formatLargeNumber } from '../utils/formCalculations';

const Step4AssetsLiabilities = ({ register, errors, watch, setValue, getValues }) => {
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [showLiabilityBreakdown, setShowLiabilityBreakdown] = useState(false);
  const [showNetWorthAnalysis, setShowNetWorthAnalysis] = useState(false);
  
  // Watch form values for real-time calculations
  const watchedValues = watch();
  const assetsLiabilities = calculateAssetsLiabilities(watchedValues);
  
  const assetCategories = [
    {
      title: 'Cash & Bank Savings',
      icon: Banknote,
      color: 'green',
      fields: [
        { name: 'cashBankSavings', label: 'Savings Account, FD, Cash', path: 'assets.cashBankSavings' }
      ]
    },
    {
      title: 'Real Estate',
      icon: Home,
      color: 'blue',
      fields: [
        { name: 'realEstate', label: 'Property Value (Current Market)', path: 'assets.realEstate' }
      ]
    },
    {
      title: 'Equity Investments',
      icon: TrendingUp,
      color: 'purple',
      fields: [
        { name: 'mutualFunds', label: 'Mutual Funds', path: 'assets.investments.equity.mutualFunds' },
        { name: 'directStocks', label: 'Direct Stocks', path: 'assets.investments.equity.directStocks' }
      ]
    },
    {
      title: 'Fixed Income',
      icon: Building,
      color: 'indigo',
      fields: [
        { name: 'ppf', label: 'PPF (Public Provident Fund)', path: 'assets.investments.fixedIncome.ppf' },
        { name: 'epf', label: 'EPF (Employee Provident Fund)', path: 'assets.investments.fixedIncome.epf' },
        { name: 'nps', label: 'NPS (National Pension System)', path: 'assets.investments.fixedIncome.nps' },
        { name: 'fixedDeposits', label: 'Fixed Deposits', path: 'assets.investments.fixedIncome.fixedDeposits' },
        { name: 'bondsDebentures', label: 'Bonds & Debentures', path: 'assets.investments.fixedIncome.bondsDebentures' },
        { name: 'nsc', label: 'NSC (National Savings Certificate)', path: 'assets.investments.fixedIncome.nsc' }
      ]
    },
    {
      title: 'Other Investments',
      icon: BarChart3,
      color: 'orange',
      fields: [
        { name: 'ulip', label: 'ULIP (Unit Linked Insurance Plan)', path: 'assets.investments.other.ulip' },
        { name: 'otherInvestments', label: 'Other Investments', path: 'assets.investments.other.otherInvestments' }
      ]
    }
  ];
  
  const liabilityCategories = [
    { name: 'loans', label: 'Personal/Home/Car Loans', icon: '🏠', path: 'liabilities.loans' },
    { name: 'creditCardDebt', label: 'Credit Card Outstanding', icon: '💳', path: 'liabilities.creditCardDebt' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200">
        <div className="flex items-center space-x-3 mb-2">
          <Calculator className="h-6 w-6 text-teal-600" />
          <h2 className="text-xl font-bold text-gray-900">Assets & Liabilities Assessment</h2>
        </div>
        <p className="text-gray-600">
          Help us understand your current financial position by listing your assets and liabilities.
          This helps calculate your net worth and plan better investments.
        </p>
      </div>

      {/* Net Worth Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            Net Worth Summary
          </h3>
          <button
            type="button"
            onClick={() => setShowNetWorthAnalysis(!showNetWorthAnalysis)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showNetWorthAnalysis ? 'Hide' : 'Show'} Analysis
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">
              {formatLargeNumber(assetsLiabilities.totalAssets)}
            </div>
            <div className="text-sm text-gray-600">Total Assets</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">
              {formatLargeNumber(assetsLiabilities.totalLiabilities)}
            </div>
            <div className="text-sm text-gray-600">Total Liabilities</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
            <div className={`text-2xl font-bold ${assetsLiabilities.netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatLargeNumber(assetsLiabilities.netWorth)}
            </div>
            <div className="text-sm text-gray-600">Net Worth</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">
              {assetsLiabilities.totalAssets > 0 ? 
                Math.round((assetsLiabilities.totalLiabilities / assetsLiabilities.totalAssets) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Debt Ratio</div>
          </div>
        </div>

        {showNetWorthAnalysis && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Financial Health Analysis:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {assetsLiabilities.netWorth >= 5000000 ? '🌟 Excellent' : assetsLiabilities.netWorth >= 2000000 ? '✅ Good' : assetsLiabilities.netWorth >= 500000 ? '⚠️ Average' : '❌ Needs Improvement'} net worth position</li>
              <li>• Debt ratio: {assetsLiabilities.totalAssets > 0 ? Math.round((assetsLiabilities.totalLiabilities / assetsLiabilities.totalAssets) * 100) : 0}% {(assetsLiabilities.totalLiabilities / assetsLiabilities.totalAssets) <= 0.3 ? '(Healthy)' : '(Consider debt reduction)'}</li>
              <li>• Asset diversification: {assetsLiabilities.totalAssets > 0 ? 'Include various asset classes for better risk management' : 'Start building your asset base'}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Assets Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
            Assets
          </h3>
          <button
            type="button"
            onClick={() => setShowAssetBreakdown(!showAssetBreakdown)}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            {showAssetBreakdown ? 'Hide Details' : 'Show All Assets'}
          </button>
        </div>

        {!showAssetBreakdown ? (
          <div className="space-y-4">
            {/* Simplified Asset Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Banknote className="h-4 w-4 inline mr-1" />
                  Cash & Bank Savings
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    {...register('assets.cashBankSavings')}
                    className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="500000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Home className="h-4 w-4 inline mr-1" />
                  Real Estate Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    {...register('assets.realEstate')}
                    className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="3000000"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">Click "Show All Assets" above to add detailed investment information</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {assetCategories.map((category) => (
              <div key={category.title} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <category.icon className={`h-5 w-5 text-${category.color}-600 mr-2`} />
                  {category.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                        <input
                          type="number"
                          {...register(field.path)}
                          className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liabilities Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
            Liabilities
          </h3>
          <button
            type="button"
            onClick={() => setShowLiabilityBreakdown(!showLiabilityBreakdown)}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            {showLiabilityBreakdown ? 'Hide Details' : 'Show All Debts'}
          </button>
        </div>

        {!showLiabilityBreakdown ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liabilityCategories.map((liability) => (
                <div key={liability.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="mr-2">{liability.icon}</span>
                    {liability.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      {...register(liability.path)}
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">Click "Show All Debts" above for detailed loan information</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-3">Detailed Debt Information</h4>
            <p className="text-sm text-red-700">
              For detailed loan information, this would typically include:
              • Home loan details (outstanding amount, EMI, interest rate)
              • Personal loan information
              • Car loan details
              • Credit card outstanding amounts
              • Other loan details
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {liabilityCategories.map((liability) => (
                <div key={liability.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="mr-2">{liability.icon}</span>
                    {liability.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      {...register(liability.path)}
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Asset Allocation Chart (Visual Representation) */}
      {assetsLiabilities.totalAssets > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
            Asset Distribution
          </h3>
          
          <div className="space-y-3">
            {[
              { 
                name: 'Cash & Savings', 
                value: parseFloat(watchedValues.assets?.cashBankSavings || 0),
                color: 'bg-green-500'
              },
              { 
                name: 'Real Estate', 
                value: parseFloat(watchedValues.assets?.realEstate || 0),
                color: 'bg-blue-500'
              },
              { 
                name: 'Investments', 
                value: (parseFloat(watchedValues.assets?.investments?.equity?.mutualFunds || 0) +
                       parseFloat(watchedValues.assets?.investments?.equity?.directStocks || 0) +
                       parseFloat(watchedValues.assets?.investments?.fixedIncome?.ppf || 0) +
                       parseFloat(watchedValues.assets?.investments?.other?.ulip || 0)),
                color: 'bg-purple-500'
              }
            ].map((asset) => {
              const percentage = assetsLiabilities.totalAssets > 0 ? 
                (asset.value / assetsLiabilities.totalAssets) * 100 : 0;
              
              if (asset.value === 0) return null;
              
              return (
                <div key={asset.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{asset.name}</span>
                    <span className="text-gray-900 font-medium">
                      {formatLargeNumber(asset.value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${asset.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
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
          <Calculator className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Asset & Liability Tips</h4>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>Assets:</strong> Include current market values, not purchase prices. 
              <strong>Real Estate:</strong> Use current market valuation. 
              <strong>Investments:</strong> Use latest statements for accurate values.
              <strong>Debts:</strong> Include all outstanding amounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4AssetsLiabilities;