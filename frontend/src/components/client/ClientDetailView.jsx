import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Target, 
  MapPin,
  FileText,
  Edit,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  BarChart3,
  TrendingUp,
  Briefcase,
  Shield,
  Eye,
  Download
} from 'lucide-react';

function ClientDetailView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [casData, setCasData] = useState(null);
  const [loadingCasData, setLoadingCasData] = useState(false);

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const response = await clientAPI.getClientById(clientId);
      setClient(response.data);
      
      // If client has CAS data, load it
      if (response.data.casData && response.data.casData.casStatus !== 'not_uploaded') {
        setCasData(response.data.casData);
      }
    } catch (error) {
      console.error('Error loading client details:', error);
      toast.error('Failed to load client details');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const loadCasData = async () => {
    try {
      setLoadingCasData(true);
      const response = await clientAPI.getClientCAS(clientId);
      setCasData(response.data);
    } catch (error) {
      console.error('Error loading CAS data:', error);
      toast.error('Failed to load CAS data');
    } finally {
      setLoadingCasData(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'invited': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'onboarding': return <Clock className="h-4 w-4" />;
      case 'invited': return <Mail className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'suspended': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCasStatusColor = (status) => {
    switch (status) {
      case 'parsed': return 'bg-green-100 text-green-800';
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'parsing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Conservative': return 'text-blue-600 bg-blue-50';
      case 'Moderate': return 'text-green-600 bg-green-50';
      case 'Aggressive': return 'text-orange-600 bg-orange-50';
      case 'Very Aggressive': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const renderCasOverview = () => {
    if (!casData || !casData.parsedData) return null;

    const { parsedData } = casData;
    const summary = parsedData.summary || {};

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Portfolio Overview (CAS)
          <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${getCasStatusColor(casData.casStatus)}`}>
            {casData.casStatus.charAt(0).toUpperCase() + casData.casStatus.slice(1)}
          </div>
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(summary.totalValue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">Demat Accounts</p>
                <p className="text-2xl font-bold text-blue-800">
                  {parsedData.demat_accounts?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-700">Mutual Fund Folios</p>
                <p className="text-2xl font-bold text-purple-800">
                  {parsedData.mutual_funds?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Investor Information */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Investor Details (from CAS)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{parsedData.investor?.name || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PAN</p>
              <p className="font-medium">{parsedData.investor?.pan || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{parsedData.investor?.email || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mobile</p>
              <p className="font-medium">{parsedData.investor?.mobile || 'Not available'}</p>
            </div>
          </div>
        </div>

        {/* Demat Accounts */}
        {parsedData.demat_accounts && parsedData.demat_accounts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Demat Accounts</h3>
            <div className="space-y-3">
              {parsedData.demat_accounts.map((account, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">DP ID</p>
                      <p className="font-medium">{account.dp_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Client ID</p>
                      <p className="font-medium">{account.client_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Value</p>
                      <p className="font-medium text-green-600">{formatCurrency(account.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mutual Funds */}
        {parsedData.mutual_funds && parsedData.mutual_funds.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Mutual Fund Holdings</h3>
            <div className="space-y-3">
              {parsedData.mutual_funds.slice(0, 3).map((fund, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">AMC</p>
                      <p className="font-medium">{fund.amc}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Folio Number</p>
                      <p className="font-medium">{fund.folio_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="font-medium text-green-600">{formatCurrency(fund.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {parsedData.mutual_funds.length > 3 && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    ... and {parsedData.mutual_funds.length - 3} more mutual fund folios
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAS Metadata */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">CAS File Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">File Name</p>
              <p className="font-medium">{casData.casFile?.fileName || 'Not available'}</p>
            </div>
            <div>
              <p className="text-gray-600">Upload Date</p>
              <p className="font-medium">{formatDate(casData.casFile?.uploadDate)}</p>
            </div>
            <div>
              <p className="text-gray-600">Parsed Date</p>
              <p className="font-medium">{formatDate(casData.lastParsedAt)}</p>
            </div>
            <div>
              <p className="text-gray-600">File Size</p>
              <p className="font-medium">
                {casData.casFile?.fileSize 
                  ? `${(casData.casFile.fileSize / 1024 / 1024).toFixed(2)} MB`
                  : 'Not available'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Loading client details...</span>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-4">The client you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/clients')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/clients')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {client.fullName || `${client.firstName} ${client.lastName}`}
              </h1>
              <p className="text-gray-600">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
              {getStatusIcon(client.status)}
              <span className="ml-2 capitalize">{client.status}</span>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* CAS Portfolio Overview - Show if available */}
          {casData && renderCasOverview()}

          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{client.fullName || `${client.firstName} ${client.lastName}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{client.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900">{client.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900">{formatDate(client.dateOfBirth)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <p className="text-gray-900 capitalize">{client.gender || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Since</label>
                <p className="text-gray-900">{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                <p className="text-gray-900">{formatAddress(client.address)}</p>
              </div>
              {client.address && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <p className="text-gray-900">{client.address.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <p className="text-gray-900">{client.address.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <p className="text-gray-900">{client.address.zipCode || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
                <p className="text-gray-900 font-medium">{formatCurrency(client.annualIncome)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Savings Target</label>
                <p className="text-gray-900 font-medium">{formatCurrency(client.monthlySavingsTarget)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(client.riskTolerance)}`}>
                  <Target className="h-4 w-4 mr-1" />
                  {client.riskTolerance || 'Not specified'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investment Experience</label>
                <p className="text-gray-900">{client.investmentExperience || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Investment Goals */}
          {client.investmentGoals && client.investmentGoals.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Investment Goals
              </h2>
              <div className="flex flex-wrap gap-2">
                {client.investmentGoals.map((goal, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Notes
              </h2>
              <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CAS Status Card */}
          {client.casData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                CAS Status
              </h3>
              <div className={`flex items-center px-3 py-2 rounded-lg mb-4 ${getCasStatusColor(client.casData.casStatus)}`}>
                <FileText className="h-4 w-4 mr-2" />
                <span className="font-medium capitalize">{client.casData.casStatus}</span>
              </div>
              
              {client.casData.casStatus === 'parsed' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">
                      {formatCurrency(client.casData.parsedData?.summary?.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{formatDate(client.casData.lastParsedAt)}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={loadCasData}
                  disabled={loadingCasData}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingCasData ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* KYC Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Status</h3>
            <div className={`flex items-center px-3 py-2 rounded-lg ${getKycStatusColor(client.kycStatus)}`}>
              <Shield className="h-4 w-4 mr-2" />
              <span className="font-medium capitalize">{client.kycStatus || 'pending'}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium capitalize">{client.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Active</span>
                <span className="font-medium">{formatDate(client.lastActiveDate || client.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Created</span>
                <span className="font-medium">{formatDate(client.createdAt)}</span>
              </div>
              {client.totalPortfolioValue && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Portfolio Value</span>
                  <span className="font-medium text-green-600">{formatCurrency(client.totalPortfolioValue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Advisor Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Advisor Information
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Managed by</p>
              <p className="font-medium text-gray-900">
                {client.advisor?.firstName} {client.advisor?.lastName}
              </p>
              <p className="text-sm text-gray-600">{client.advisor?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailView;