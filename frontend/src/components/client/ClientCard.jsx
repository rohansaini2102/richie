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
  Shield,
  TrendingUp,
  Eye
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
        return 'text-blue-600 bg-blue-50';
      case 'Moderate':
        return 'text-green-600 bg-green-50';
      case 'Aggressive':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Financial calculations based on actual database structure
  const calculateFinancialMetrics = () => {
    const monthlyIncome = client.totalMonthlyIncome || 0;
    const monthlyExpenses = client.totalMonthlyExpenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    
    // Calculate portfolio value from CAS or manual investments
    let portfolioValue = 0;
    
    // First check CAS data
    if (client.casData?.parsedData?.summary?.total_value) {
      portfolioValue = client.casData.parsedData.summary.total_value;
    } else {
      // Calculate from manual investments in assets
      const investments = client.assets?.investments || {};
      
      portfolioValue = (investments.equity?.mutualFunds || 0) +
                      (investments.equity?.directStocks || 0) +
                      (investments.fixedIncome?.ppf || 0) +
                      (investments.fixedIncome?.epf || 0) +
                      (investments.fixedIncome?.nps || 0) +
                      (investments.fixedIncome?.fixedDeposits || 0) +
                      (investments.fixedIncome?.bondsDebentures || 0) +
                      (investments.fixedIncome?.nsc || 0) +
                      (investments.other?.ulip || 0) +
                      (investments.other?.otherInvestments || 0);
    }

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      portfolioValue
    };
  };

  // Extract key data using actual database structure
  const firstName = client.firstName || '';
  const lastName = client.lastName || '';
  const clientName = firstName && lastName ? `${firstName} ${lastName}` : client.fullName || client.name || 'Unknown Client';
  
  const email = client.email || '';
  const phone = client.phoneNumber || '';
  const dateOfBirth = client.dateOfBirth;
  const age = calculateAge(dateOfBirth);
  
  // Risk profile from enhancedRiskProfile
  const riskTolerance = client.enhancedRiskProfile?.riskTolerance || client.riskTolerance || 'Not specified';
  const investmentExperience = client.enhancedRiskProfile?.investmentExperience || client.investmentExperience || 'Not specified';
  
  // Status information
  const clientStatus = client.status || 'active';
  const kycStatus = client.kycStatus || 'pending';
  const casStatus = client.casData?.casStatus || 'not_uploaded';
  
  const financialMetrics = calculateFinancialMetrics();

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      style={{ width: '320px', height: '280px' }}
      onClick={() => onView(client._id || client.id)}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {clientName}
              </h3>
              <p className="text-xs text-gray-600 truncate">{email}</p>
              {age && (
                <p className="text-xs text-gray-500">{age} years old</p>
              )}
            </div>
          </div>
          
          {/* Actions Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(client._id || client.id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(client._id || client.id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Client
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(client._id || client.id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              <div>
                <p className="text-xs text-gray-600">Portfolio Value</p>
                <p className="text-sm font-bold text-green-700">
                  {formatCurrency(financialMetrics.portfolioValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Financial Info */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              <span className="truncate">{phone || 'No phone'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>{formatCurrency(financialMetrics.monthlyIncome)}/mo</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-600">
              <span>Savings: </span>
              <span className={`font-medium ${financialMetrics.savingsRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialMetrics.savingsRate.toFixed(1)}%
              </span>
            </div>
            <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(riskTolerance)}`}>
              {riskTolerance}
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(clientStatus)}`}>
              {clientStatus}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCasStatusColor(casStatus)}`}>
              CAS: {casStatus === 'not_uploaded' ? 'None' : casStatus}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              <span className={`text-xs font-medium ${getKycStatusColor(kycStatus)}`}>
                KYC: {kycStatus}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Exp: {investmentExperience.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last active</span>
            <span>{new Date(client.updatedAt || client.lastActiveDate || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientCard;