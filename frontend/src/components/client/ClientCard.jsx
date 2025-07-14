// frontend/src/components/client/ClientCard.jsx
import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Target, 
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Clock,
  BarChart3,
  CheckCircle,
  TrendingUp,
  PiggyBank,
  Home,
  Building,
  Calculator,
  AlertCircle
} from 'lucide-react';

function ClientCard({ client, onEdit, onDelete, onView }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'onboarding':
        return 'bg-blue-100 text-blue-800';
      case 'invited':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Conservative':
        return 'text-blue-600';
      case 'Moderate':
        return 'text-green-600';
      case 'Aggressive':
        return 'text-orange-600';
      case 'Very Aggressive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCasStatusColor = (status) => {
    switch (status) {
      case 'parsed':
        return 'text-green-600 bg-green-100';
      case 'uploaded':
        return 'text-blue-600 bg-blue-100';
      case 'parsing':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not provided';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Not provided';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Enhanced financial calculations
  const calculateFinancialSummary = () => {
    const monthlyIncome = (client.annualIncome || 0) / 12 + (client.additionalIncome || 0) / 12;
    
    const expenses = client.monthlyExpenses || {};
    const totalMonthlyExpenses = Object.values(expenses)
      .reduce((sum, expense) => sum + (parseFloat(expense) || 0), 0);
    
    const monthlySavings = monthlyIncome - totalMonthlyExpenses;
    
    // Calculate total assets
    const assets = client.assets || {};
    const totalAssets = (assets.cashBankSavings || 0) +
                        (assets.realEstate || 0) +
                        (assets.investments?.equity?.mutualFunds || 0) +
                        (assets.investments?.equity?.directStocks || 0) +
                        (assets.investments?.fixedIncome?.ppf || 0) +
                        (assets.investments?.fixedIncome?.epf || 0) +
                        (assets.investments?.fixedIncome?.nps || 0) +
                        (assets.investments?.fixedIncome?.fixedDeposits || 0) +
                        (assets.investments?.fixedIncome?.bondsDebentures || 0) +
                        (assets.investments?.fixedIncome?.nsc || 0) +
                        (assets.investments?.other?.ulip || 0) +
                        (assets.investments?.other?.otherInvestments || 0);
    
    // Calculate total liabilities
    const liabilities = client.liabilities || {};
    const totalLiabilities = (liabilities.loans || 0) + (liabilities.creditCardDebt || 0);
    
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
  };

  // Check if client has CAS data
  const hasCasData = client.casData && client.casData.casStatus !== 'not_uploaded';
  const portfolioValue = client.casData?.parsedData?.summary?.totalValue || client.totalPortfolioValue;
  const financialSummary = calculateFinancialSummary();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-3">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {client.fullName || `${client.firstName} ${client.lastName}`}
            </h3>
            <p className="text-sm text-gray-600">{client.email}</p>
            {client.occupation && (
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <Building className="h-3 w-3 mr-1" />
                {client.occupation}
              </p>
            )}
          </div>
        </div>
        
        {/* Status and Actions */}
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
            {client.status}
          </span>
          
          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onView(client._id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      onEdit(client._id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Client
                  </button>
                  <button
                    onClick={() => {
                      onDelete(client._id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Financial Overview */}
      <div className="mb-4">
        {/* Net Worth or Portfolio Value - Priority Display */}
        {portfolioValue ? (
          <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Portfolio Value (CAS)</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(portfolioValue)}</p>
                </div>
              </div>
              {hasCasData && (
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${getCasStatusColor(client.casData.casStatus)}`}>
                  CAS {client.casData.casStatus}
                </div>
              )}
            </div>
          </div>
        ) : financialSummary.netWorth !== 0 ? (
          <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Net Worth</p>
                <p className={`text-lg font-bold ${financialSummary.netWorth >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                  {formatCurrency(financialSummary.netWorth)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Financial Health Indicators */}
        {financialSummary.monthlyIncome > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
                <div>
                  <p className="text-xs text-gray-600">Monthly Income</p>
                  <p className="text-sm font-semibold text-blue-700">{formatCurrency(financialSummary.monthlyIncome)}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-2 rounded border border-green-200">
              <div className="flex items-center">
                <PiggyBank className="h-4 w-4 text-green-600 mr-1" />
                <div>
                  <p className="text-xs text-gray-600">Monthly Savings</p>
                  <p className={`text-sm font-semibold ${financialSummary.monthlySavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(financialSummary.monthlySavings)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Contact Info */}
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Mail className="h-4 w-4 mr-2" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phoneNumber && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Phone className="h-4 w-4 mr-2" />
              <span>{client.phoneNumber}</span>
            </div>
          )}
          {client.dateOfBirth && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(client.dateOfBirth)}</span>
            </div>
          )}
        </div>

        {/* Financial Info */}
        <div>
          {client.annualIncome && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <DollarSign className="h-4 w-4 mr-2" />
              <div>
                <span className="text-xs text-gray-500">Annual:</span>
                <span className="ml-1">{formatCurrency(client.annualIncome)}</span>
              </div>
            </div>
          )}
          {client.riskTolerance && (
            <div className="flex items-center text-sm mb-2">
              <Target className="h-4 w-4 mr-2 text-gray-400" />
              <span className={`font-medium ${getRiskColor(client.riskTolerance)}`}>
                {client.riskTolerance}
              </span>
            </div>
          )}
          {client.investmentExperience && (
            <div className="text-sm text-gray-600">
              Experience: {client.investmentExperience}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced CAS Summary */}
      {hasCasData && client.casData.parsedData && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Portfolio Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Demat Accounts:</span>
              <span className="font-medium ml-1">{client.casData.parsedData.demat_accounts?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">MF Folios:</span>
              <span className="font-medium ml-1">{client.casData.parsedData.mutual_funds?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Goals Summary */}
      {client.majorGoals && client.majorGoals.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Financial Goals</h4>
          <div className="space-y-1">
            {client.majorGoals.slice(0, 2).map((goal, index) => (
              <div key={index} className="flex items-center justify-between text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                <span className="font-medium text-gray-700">{goal.goalName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium">{formatCurrency(goal.targetAmount)}</span>
                  <span className={`px-1 py-0.5 rounded text-xs ${
                    goal.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                    goal.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {goal.priority}
                  </span>
                </div>
              </div>
            ))}
            {client.majorGoals.length > 2 && (
              <p className="text-xs text-gray-500 text-center">
                +{client.majorGoals.length - 2} more goals
              </p>
            )}
          </div>
        </div>
      )}

      {/* Investment Goals */}
      {client.investmentGoals && client.investmentGoals.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Investment Focus</h4>
          <div className="flex flex-wrap gap-1">
            {client.investmentGoals.slice(0, 3).map((goal, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded"
              >
                {goal}
              </span>
            ))}
            {client.investmentGoals.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{client.investmentGoals.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Financial Health Indicators */}
      {financialSummary.monthlyIncome > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Financial Health
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Savings Rate:</span>
              <span className={`font-medium ml-1 ${
                financialSummary.monthlySavings / financialSummary.monthlyIncome > 0.2 ? 'text-green-600' :
                financialSummary.monthlySavings / financialSummary.monthlyIncome > 0.1 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {Math.round((financialSummary.monthlySavings / financialSummary.monthlyIncome) * 100)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Expenses:</span>
              <span className="font-medium ml-1">{formatCurrency(financialSummary.totalMonthlyExpenses)}</span>
            </div>
          </div>
          
          {/* Financial Health Alert */}
          {financialSummary.monthlySavings < 0 && (
            <div className="mt-2 flex items-center text-red-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">Expenses exceed income</span>
            </div>
          )}
        </div>
      )}

      {/* Retirement Planning */}
      {client.retirementPlanning && (client.retirementPlanning.targetRetirementAge || client.retirementPlanning.retirementCorpusTarget) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Retirement Plan
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {client.retirementPlanning.targetRetirementAge && (
              <div>
                <span className="text-gray-600">Target Age:</span>
                <span className="font-medium ml-1">{client.retirementPlanning.targetRetirementAge}</span>
              </div>
            )}
            {client.retirementPlanning.retirementCorpusTarget && (
              <div>
                <span className="text-gray-600">Target Corpus:</span>
                <span className="font-medium ml-1 text-green-600">
                  {formatCurrency(client.retirementPlanning.retirementCorpusTarget)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer - KYC Status and Last Activity */}
      <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
        <div className="flex items-center">
          <span className="text-gray-600">KYC:</span>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
            client.kycStatus === 'completed' 
              ? 'bg-green-100 text-green-800'
              : client.kycStatus === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : client.kycStatus === 'rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {client.kycStatus || 'pending'}
          </span>
        </div>
        
        {/* Last Activity */}
        <div className="flex items-center text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-xs">{formatDate(client.lastActiveDate || client.updatedAt)}</span>
        </div>
      </div>

      {/* Notes Preview */}
      {client.notes && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            <span className="font-medium">Notes:</span> {client.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export default ClientCard;