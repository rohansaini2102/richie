import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PlanCreationModal, CashFlowPlanning, PlanHistory } from '../planning';
import ClientLOESection from './ClientLOESection';
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
  Download,
  PiggyBank,
  Calculator,
  CreditCard,
  Home,
  Car,
  GraduationCap,
  Heart,
  Zap,
  TrendingDown,
  Plus,
  Minus,
  Percent,
  Activity,
  Award,
  Save,
  X
} from 'lucide-react';

function ClientDetailView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCashFlowPlanning, setShowCashFlowPlanning] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  const loadClientDetails = async () => {
    console.group('🔄 [ClientDetailView] Loading Client Details');
    console.log('📋 Request Parameters:', { clientId, timestamp: new Date().toISOString() });
    
    try {
      setLoading(true);
      const clientData = await clientAPI.getClientById(clientId);
      
      console.log('📦 Raw API Response:', {
        hasData: !!clientData,
        dataType: typeof clientData,
        isArray: Array.isArray(clientData),
        dataKeys: clientData ? Object.keys(clientData).slice(0, 15) : [],
        dataSize: clientData ? JSON.stringify(clientData).length : 0
      });
      
      console.log('👤 Client Data Structure:', {
        firstName: clientData?.firstName,
        lastName: clientData?.lastName,
        email: clientData?.email,
        hasPersonalInfo: !!(clientData?.firstName && clientData?.lastName),
        hasFinancialInfo: !!(clientData?.totalMonthlyIncome || clientData?.totalMonthlyExpenses),
        hasAssets: !!clientData?.assets,
        hasDebts: !!clientData?.debtsAndLiabilities,
        completionPercentage: clientData?.completionPercentage
      });
      
      setClient(clientData);
      
      console.log('✅ Client State Updated Successfully:', {
        clientSet: true,
        clientName: `${clientData?.firstName} ${clientData?.lastName}`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error loading client details:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      toast.error('Failed to load client details');
      navigate('/clients');
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    
    // Initialize edit data based on section
    switch (section) {
      case 'step1':
        setEditData({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          phoneNumber: client.phoneNumber || '',
          dateOfBirth: client.dateOfBirth || '',
          panNumber: client.panNumber || '',
          maritalStatus: client.maritalStatus || '',
          numberOfDependents: client.numberOfDependents || 0,
        });
        break;
      case 'step2':
        setEditData({
          totalMonthlyIncome: client.totalMonthlyIncome || (client.annualIncome ? client.annualIncome / 12 : 0),
          incomeType: client.incomeType || '',
          totalMonthlyExpenses: client.totalMonthlyExpenses || 0,
          expenseBreakdown: client.expenseBreakdown?.details || {},
        });
        break;
      // Add other cases as needed
      default:
        setEditData({});
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare updated client data based on editing section
      const updatedClient = { ...client };
      
      switch (editingSection) {
        case 'step1':
          updatedClient.firstName = editData.firstName;
          updatedClient.lastName = editData.lastName;
          updatedClient.email = editData.email;
          updatedClient.phoneNumber = editData.phoneNumber;
          updatedClient.dateOfBirth = editData.dateOfBirth;
          updatedClient.panNumber = editData.panNumber;
          updatedClient.maritalStatus = editData.maritalStatus;
          updatedClient.numberOfDependents = editData.numberOfDependents;
          break;
        case 'step2':
          updatedClient.totalMonthlyIncome = editData.totalMonthlyIncome;
          updatedClient.incomeType = editData.incomeType;
          updatedClient.totalMonthlyExpenses = editData.totalMonthlyExpenses;
          if (editData.expenseBreakdown) {
            updatedClient.expenseBreakdown = { details: editData.expenseBreakdown };
          }
          break;
        // Add other cases as needed
      }

      await clientAPI.updateClient(clientId, updatedClient);
      setClient(updatedClient);
      setEditingSection(null);
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditData({});
  };

  const handlePlanCreated = (plan) => {
    console.log('🎯 [ClientDetailView] Plan created callback received:', {
      planId: plan?._id,
      planType: plan?.planType,
      clientId: plan?.clientId
    });
    
    setSelectedPlanId(plan._id);
    setShowCashFlowPlanning(true);
    
    console.log('📺 [ClientDetailView] Opening CashFlowPlanning component');
    toast.success('Financial plan created successfully');
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setShowCashFlowPlanning(true);
  };

  // Helper functions
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
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

  const getCasStatusColor = (status) => {
    switch (status) {
      case 'parsed': return 'bg-green-100 text-green-800';
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'parsing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  // Section rendering functions
  const renderStep1PersonalInfo = () => {
    const isEditing = editingSection === 'step1';

    const firstName = client.firstName || '';
    const lastName = client.lastName || '';
    const email = client.email || '';
    const phoneNumber = client.phoneNumber || '';
    const dateOfBirth = client.dateOfBirth || '';
    const panNumber = client.panNumber || '';
    const maritalStatus = client.maritalStatus || '';
    const numberOfDependents = client.numberOfDependents || 0;

    const age = calculateAge(dateOfBirth);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Step 1: Personal Information
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step1')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Required Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.firstName || ''}
                  onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{firstName || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.lastName || ''}
                  onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{lastName || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phoneNumber || ''}
                  onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{phoneNumber || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dateOfBirth || ''}
                  onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div>
                  <p className="text-gray-900">{formatDate(dateOfBirth)}</p>
                  {age && <p className="text-sm text-gray-500">Age: {age} years</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.panNumber || ''}
                  onChange={(e) => setEditData({...editData, panNumber: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABCDE1234F"
                />
              ) : (
                <p className="text-gray-900">{panNumber || 'Not provided'}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Optional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
              {isEditing ? (
                <select
                  value={editData.maritalStatus || ''}
                  onChange={(e) => setEditData({...editData, maritalStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              ) : (
                <p className="text-gray-900">{maritalStatus || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Dependents</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={editData.numberOfDependents || 0}
                  onChange={(e) => setEditData({...editData, numberOfDependents: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{numberOfDependents}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2IncomeExpenses = () => {
    const isEditing = editingSection === 'step2';
    const breakdown = client.expenseBreakdown?.details || {};

    const totalMonthlyIncome = client.totalMonthlyIncome || (client.annualIncome ? client.annualIncome / 12 : 0);
    const incomeType = client.incomeType || '';
    const totalMonthlyExpenses = client.totalMonthlyExpenses || 0;
    const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Step 2: Income & Expenses
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step2')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Plus className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-700">Monthly Income</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.totalMonthlyIncome || 0}
                    onChange={(e) => setEditData({...editData, totalMonthlyIncome: parseFloat(e.target.value) || 0})}
                    className="text-lg font-bold text-green-800 bg-transparent border-b border-green-300 w-full"
                  />
                ) : (
                  <p className="text-lg font-bold text-green-800">{formatCurrency(totalMonthlyIncome)}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <Minus className="h-6 w-6 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-700">Monthly Expenses</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.totalMonthlyExpenses || 0}
                    onChange={(e) => setEditData({...editData, totalMonthlyExpenses: parseFloat(e.target.value) || 0})}
                    className="text-lg font-bold text-red-800 bg-transparent border-b border-red-300 w-full"
                  />
                ) : (
                  <p className="text-lg font-bold text-red-800">{formatCurrency(totalMonthlyExpenses)}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${monthlySurplus >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <TrendingUp className={`h-6 w-6 mr-2 ${monthlySurplus >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-sm ${monthlySurplus >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Monthly Surplus</p>
                <p className={`text-lg font-bold ${monthlySurplus >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(monthlySurplus)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Percent className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-700">Savings Rate</p>
                <p className="text-lg font-bold text-purple-800">
                  {totalMonthlyIncome > 0 ? ((monthlySurplus / totalMonthlyIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
            {isEditing ? (
              <select
                value={editData.incomeType || ''}
                onChange={(e) => setEditData({...editData, incomeType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select income type</option>
                <option value="Salaried">Salaried</option>
                <option value="Business">Business</option>
                <option value="Freelance">Freelance</option>
                <option value="Mixed">Mixed</option>
              </select>
            ) : (
              <p className="text-gray-900">{incomeType || 'Not specified'}</p>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        {(Object.keys(breakdown).length > 0 || isEditing) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Expense Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['housingRent', 'foodGroceries', 'transportation', 'utilities', 'entertainment', 'healthcare', 'otherExpenses'].map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.expenseBreakdown?.[key] || 0}
                      onChange={(e) => setEditData({
                        ...editData, 
                        expenseBreakdown: {
                          ...editData.expenseBreakdown,
                          [key]: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{formatCurrency(breakdown[key] || 0)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3RetirementPlanning = () => {
    const isEditing = editingSection === 'step3';
    
    const currentAge = calculateAge(client.dateOfBirth);
    const retirementAge = client.retirementPlanning?.retirementAge || 60;
    const hasRetirementCorpus = client.retirementPlanning?.hasRetirementCorpus || false;
    const currentRetirementCorpus = client.retirementPlanning?.currentRetirementCorpus || 0;
    const targetRetirementCorpus = client.retirementPlanning?.targetRetirementCorpus || 0;
    const yearsToRetirement = currentAge ? Math.max(0, retirementAge - currentAge) : null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Step 3: Retirement Planning
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step3')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-700">Current Age</p>
                <p className="text-lg font-bold text-blue-800">{currentAge || 'N/A'} years</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Target className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-700">Retirement Age</p>
                <p className="text-lg font-bold text-purple-800">{retirementAge} years</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-orange-700">Years to Retirement</p>
                <p className="text-lg font-bold text-orange-800">{yearsToRetirement || 'N/A'} years</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Retirement Age</label>
            <p className="text-gray-900">{retirementAge} years</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Has Existing Retirement Corpus</label>
            <p className="text-gray-900">{hasRetirementCorpus ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Retirement Corpus</label>
            <p className="text-gray-900">{formatCurrency(currentRetirementCorpus)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Retirement Corpus</label>
            <p className="text-gray-900">{formatCurrency(targetRetirementCorpus)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {targetRetirementCorpus > 0 && currentRetirementCorpus > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="mb-2 flex justify-between text-sm">
              <span>Retirement Readiness</span>
              <span>{((currentRetirementCorpus / targetRetirementCorpus) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full" 
                style={{ width: `${Math.min((currentRetirementCorpus / targetRetirementCorpus) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep4CasInvestments = () => {
    const isEditing = editingSection === 'step4';
    const casData = client.casData || {};
    const investments = client.assets?.investments || {};

    const hasCAS = client.casData?.casFile ? true : false;
    const casStatus = casData.casStatus || 'not_uploaded';

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Step 4: CAS & Investments
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step4')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {/* CAS Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-semibold text-gray-900 mb-3">CAS (Consolidated Account Statement)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has CAS</label>
              <p className="text-gray-900">{hasCAS ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAS Status</label>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getCasStatusColor(casStatus)}`}>
                {casStatus.charAt(0).toUpperCase() + casStatus.slice(1)}
              </span>
            </div>
          </div>
          
          {casData.parsedData && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Portfolio Value: <span className="font-medium text-green-600">{formatCurrency(casData.parsedData.summary?.totalValue || 0)}</span></p>
            </div>
          )}
        </div>

        {/* Investment Data */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Investment Holdings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mutual Funds */}
            {investments.equity?.mutualFunds > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Mutual Funds</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(investments.equity?.mutualFunds || 0)}</p>
              </div>
            )}

            {/* Direct Stocks */}
            {investments.equity?.directStocks > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">Direct Stocks</span>
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-900">{formatCurrency(investments.equity?.directStocks || 0)}</p>
              </div>
            )}

            {/* PPF */}
            {investments.fixedIncome?.ppf > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">PPF</span>
                  <PiggyBank className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(investments.fixedIncome?.ppf || 0)}</p>
              </div>
            )}

            {/* EPF */}
            {investments.fixedIncome?.epf > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">EPF</span>
                  <Building className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(investments.fixedIncome?.epf || 0)}</p>
              </div>
            )}

            {/* NPS */}
            {investments.fixedIncome?.nps > 0 && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-800">NPS</span>
                  <Shield className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-lg font-bold text-indigo-900">{formatCurrency(investments.fixedIncome?.nps || 0)}</p>
              </div>
            )}

            {/* Fixed Deposits */}
            {investments.fixedIncome?.fixedDeposits > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">Fixed Deposits</span>
                  <Calculator className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(investments.fixedIncome?.fixedDeposits || 0)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep5DebtsLiabilities = () => {
    const isEditing = editingSection === 'step5';
    const debts = client.debtsAndLiabilities || {};

    const debtTypes = [
      { key: 'homeLoan', label: 'Home Loan', icon: Home },
      { key: 'personalLoan', label: 'Personal Loan', icon: User },
      { key: 'carLoan', label: 'Car Loan', icon: Car },
      { key: 'educationLoan', label: 'Education Loan', icon: GraduationCap },
      { key: 'goldLoan', label: 'Gold Loan', icon: Award },
      { key: 'creditCards', label: 'Credit Card Debt', icon: CreditCard },
      { key: 'businessLoan', label: 'Business Loan', icon: Building },
      { key: 'otherLoans', label: 'Other Loans', icon: FileText }
    ];

    // Calculate total debt and EMIs
    let totalDebt = 0;
    let totalEMIs = 0;
    
    debtTypes.forEach(({ key }) => {
      const debt = debts[key];
      if (debt && debt.hasLoan) {
        totalDebt += debt.outstandingAmount || 0;
        totalEMIs += debt.monthlyEMI || debt.monthlyPayment || 0;
      }
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Step 5: Debts & Liabilities
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step5')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <TrendingDown className="h-6 w-6 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-700">Total Outstanding</p>
                <p className="text-lg font-bold text-red-800">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-orange-700">Total Monthly EMIs</p>
                <p className="text-lg font-bold text-orange-800">{formatCurrency(totalEMIs)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debt Details */}
        <div className="space-y-4">
          {debtTypes.map(({ key, label, icon: Icon }) => {
            const debt = debts[key];
            const hasDebt = debt && debt.hasLoan;
            
            if (!hasDebt) return null;
            
            return (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(debt.outstandingAmount || debt.totalOutstanding || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">EMI: </span>
                    <span className="font-medium">{formatCurrency(debt.monthlyEMI || debt.monthlyPayment || 0)}</span>
                  </div>
                  {debt.interestRate && (
                    <div>
                      <span className="text-gray-600">Rate: </span>
                      <span className="font-medium">{debt.interestRate}%</span>
                    </div>
                  )}
                  {debt.remainingTenure && (
                    <div>
                      <span className="text-gray-600">Tenure: </span>
                      <span className="font-medium">{debt.remainingTenure} years</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalDebt === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>No debts or liabilities recorded</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep6Insurance = () => {
    const isEditing = editingSection === 'step6';
    const insurance = client.insuranceCoverage || {};

    const insuranceTypes = [
      { key: 'lifeInsurance', label: 'Life Insurance', icon: Heart, color: 'blue' },
      { key: 'healthInsurance', label: 'Health Insurance', icon: Plus, color: 'green' },
      { key: 'vehicleInsurance', label: 'Vehicle Insurance', icon: Car, color: 'yellow' },
      { key: 'otherInsurance', label: 'Other Insurance', icon: Shield, color: 'gray' }
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Step 6: Insurance Coverage (Optional)
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step6')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insuranceTypes.map(({ key, label, icon: Icon, color }) => {
            const insuranceData = insurance[key];
            const hasInsurance = insuranceData && insuranceData.hasInsurance;
            
            if (!hasInsurance) return null;
            const coverAmount = insuranceData.totalCoverAmount || 0;
            const premium = insuranceData.annualPremium || 0;

            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-800',
              green: 'bg-green-50 border-green-200 text-green-800',
              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
              gray: 'bg-gray-50 border-gray-200 text-gray-800'
            };

            return (
              <div key={key} className={`p-4 rounded-lg border ${colorClasses[color]}`}>
                <div className="flex items-center mb-2">
                  <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
                  <span className="font-medium">{label}</span>
                </div>
                <div className="space-y-1">
                  {coverAmount > 0 && (
                    <div className="text-lg font-bold">
                      {formatCurrency(coverAmount)}
                    </div>
                  )}
                  {premium > 0 && (
                    <div className="text-sm">
                      Premium: {formatCurrency(premium)}/year
                    </div>
                  )}
                  {insuranceData.familyMembers && (
                    <div className="text-xs">
                      Covers: {insuranceData.familyMembers} members
                    </div>
                  )}
                  {insuranceData.insuranceType && (
                    <div className="text-xs">
                      Type: {insuranceData.insuranceType}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(insurance).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>No insurance coverage recorded</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep7GoalsRiskProfile = () => {
    const isEditing = editingSection === 'step7';
    const financialGoals = client.enhancedFinancialGoals || {};
    const riskProfile = client.enhancedRiskProfile || {};
    const customGoals = financialGoals.customGoals || [];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Step 7: Goals & Risk Profile
          </h2>
          {!isEditing && (
            <button
              onClick={() => handleEdit('step7')}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {/* Financial Goals */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Financial Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Emergency Fund */}
            {financialGoals.emergencyFund && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Emergency Fund</span>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(financialGoals.emergencyFund.targetAmount || 0)}
                </div>
                <div className="text-sm text-blue-600">
                  Priority: {financialGoals.emergencyFund.priority}
                </div>
              </div>
            )}

            {/* Child Education */}
            {financialGoals.childEducation && financialGoals.childEducation.isApplicable && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <GraduationCap className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Child Education</span>
                </div>
                <div className="text-lg font-bold text-green-900">
                  {formatCurrency(financialGoals.childEducation.targetAmount || 0)}
                </div>
                <div className="text-sm text-green-600">
                  Target Year: {financialGoals.childEducation.targetYear}
                </div>
              </div>
            )}

            {/* Home Purchase */}
            {financialGoals.homePurchase && financialGoals.homePurchase.isApplicable && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center mb-2">
                  <Home className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-800">Home Purchase</span>
                </div>
                <div className="text-lg font-bold text-yellow-900">
                  {formatCurrency(financialGoals.homePurchase.targetAmount || 0)}
                </div>
                <div className="text-sm text-yellow-600">
                  Target Year: {financialGoals.homePurchase.targetYear}
                </div>
              </div>
            )}
          </div>

          {/* Custom Goals */}
          {customGoals.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Goals</h4>
              <div className="space-y-2">
                {customGoals.map((goal, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.goalName}</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-sm text-gray-600">
                      <div>Target Year: {goal.targetYear}</div>
                      <div>Priority: <span className={`font-medium ${
                        goal.priority === 'High' ? 'text-red-600' : 
                        goal.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{goal.priority}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Profile */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Risk Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Experience</label>
              <p className="text-gray-900">{riskProfile.investmentExperience || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                riskProfile.riskTolerance === 'Conservative' ? 'bg-blue-50 text-blue-600' :
                riskProfile.riskTolerance === 'Moderate' ? 'bg-green-50 text-green-600' :
                riskProfile.riskTolerance === 'Aggressive' ? 'bg-orange-50 text-orange-600' :
                'bg-gray-50 text-gray-600'
              }`}>
                {riskProfile.riskTolerance || 'Not specified'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Investment Capacity</label>
              <p className="text-gray-900 font-medium">
                {formatCurrency(riskProfile.monthlyInvestmentCapacity || 0)}
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

  // Extract client name and basic info
  const firstName = client.firstName || '';
  const lastName = client.lastName || '';
  const clientName = firstName && lastName ? `${firstName} ${lastName}` : client.fullName || client.name || 'Unknown Client';
  const email = client.email || '';

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
              <h1 className="text-2xl font-bold text-gray-900">{clientName}</h1>
              <p className="text-gray-600">{email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status || 'active')}`}>
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="capitalize">{client.status || 'active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Client Information (2 columns wide) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Step 1: Personal Information */}
          {renderStep1PersonalInfo()}

          {/* Step 2: Income & Expenses */}
          {renderStep2IncomeExpenses()}

          {/* Step 3: Retirement Planning */}
          {renderStep3RetirementPlanning()}

          {/* Step 4: CAS & Investments */}
          {renderStep4CasInvestments()}

          {/* Step 5: Debts & Liabilities */}
          {renderStep5DebtsLiabilities()}

          {/* Step 6: Insurance Coverage */}
          {renderStep6Insurance()}

          {/* Step 7: Goals & Risk Profile */}
          {renderStep7GoalsRiskProfile()}

          {/* Financial Planning Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Financial Planning Strategies
              </h2>
              <button
                onClick={() => {
                  console.group('🚀 [ClientDetailView] Opening Plan Creation Modal');
                  console.log('📋 Modal Trigger Data:', {
                    clientId,
                    clientName: clientName || `${client?.firstName} ${client?.lastName}`,
                    hasClient: !!client,
                    clientKeys: client ? Object.keys(client).slice(0, 10) : [],
                    timestamp: new Date().toISOString()
                  });
                  console.log('👤 Client Data Being Passed:', {
                    firstName: client?.firstName,
                    lastName: client?.lastName,
                    email: client?.email,
                    hasFinancialData: !!(client?.totalMonthlyIncome || client?.totalMonthlyExpenses),
                    hasAssets: !!client?.assets,
                    hasDebts: !!client?.debtsAndLiabilities,
                    dataSize: client ? JSON.stringify(client).length : 0
                  });
                  console.groupEnd();
                  setShowPlanModal(true);
                }}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Plan
              </button>
            </div>

            <PlanHistory 
              clientId={clientId} 
              onSelectPlan={handleSelectPlan}
            />
          </div>
        </div>

        {/* Right Column - LOE Section (1 column wide) */}
        <div className="xl:col-span-1">
          <ClientLOESection 
            clientId={clientId} 
            clientName={clientName}
          />
        </div>
      </div>

      {/* Plan Creation Modal */}
      <PlanCreationModal
        open={showPlanModal}
        onClose={() => {
          console.log('🔒 [ClientDetailView] Closing Plan Creation Modal');
          setShowPlanModal(false);
        }}
        clientId={clientId}
        clientName={`${client?.firstName || ''} ${client?.lastName || ''}`.trim()}
        clientData={client}
        onPlanCreated={handlePlanCreated}
      />

      {/* Cash Flow Planning Component */}
      {showCashFlowPlanning && selectedPlanId && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <CashFlowPlanning
            planId={selectedPlanId}
            clientId={clientId}
            onBack={() => {
              setShowCashFlowPlanning(false);
              setSelectedPlanId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ClientDetailView;