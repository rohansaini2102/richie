import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, apiUtils } from '../services/api';
import { Edit, Save, X, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [advisorClients, setAdvisorClients] = useState([]);
  const [showClients, setShowClients] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  
  // Edit functionality states
  const [editingStep, setEditingStep] = useState(null); // 'step4', 'step5', 'step6', 'step7'
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.isAdmin) {
      navigate('/admin/login');
      return;
    }
    
    fetchDashboardData();
  }, [user, navigate]);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [advisorsResponse, statsResponse] = await Promise.all([
        adminAPI.getAllAdvisors(),
        adminAPI.getDashboardStats()
      ]);
      
      if (advisorsResponse.success) {
        setAdvisors(advisorsResponse.data);
      } else {
        setError('Failed to fetch advisors');
      }
      
      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisorClients = async (advisorId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdvisorClients(advisorId);
      if (response.success) {
        setAdvisorClients(response.data);
        setShowClients(true);
      } else {
        setError('Failed to fetch advisor clients');
      }
    } catch (error) {
      console.error('Advisor clients fetch error:', error);
      setError('Error loading advisor clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvisorClick = (advisor) => {
    setSelectedAdvisor(advisor);
    setSelectedClient(null);
    setShowClientDetails(false);
    fetchAdvisorClients(advisor._id);
  };

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
    // Here you would typically fetch detailed client data
    // For now, we'll use the available client data
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    logout();
    navigate('/admin/login');
  };

  const handleBackToAdvisors = () => {
    setSelectedAdvisor(null);
    setAdvisorClients([]);
    setShowClients(false);
    setSelectedClient(null);
    setShowClientDetails(false);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setShowClientDetails(false);
  };

  const getCASStatusColor = (status) => {
    switch (status) {
      case 'parsed': return 'bg-green-100 text-green-800';
      case 'uploaded': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCASStatusText = (status) => {
    switch (status) {
      case 'parsed': return 'Parsed';
      case 'uploaded': return 'Uploaded';
      case 'processing': return 'Processing';
      case 'error': return 'Error';
      default: return 'Not uploaded';
    }
  };

  // Edit functionality functions
  const handleEdit = (step) => {
    if (!selectedClient) {
      return;
    }
    
    try {
      setEditingStep(step);
      
      // Initialize edit data based on step
      switch (step) {
      case 1:
        const step1Data = {
          firstName: selectedClient?.firstName || '',
          lastName: selectedClient?.lastName || '',
          email: selectedClient?.email || '',
          phoneNumber: selectedClient?.phoneNumber || '',
          dateOfBirth: selectedClient?.dateOfBirth || '',
          panNumber: selectedClient?.panNumber || '',
          maritalStatus: selectedClient?.maritalStatus || 'Single',
          numberOfDependents: selectedClient?.numberOfDependents || 0,
          gender: selectedClient?.gender || '',
          address: {
            street: selectedClient?.address?.street || '',
            city: selectedClient?.address?.city || '',
            state: selectedClient?.address?.state || '',
            zipCode: selectedClient?.address?.zipCode || '',
            country: selectedClient?.address?.country || 'India',
          },
          occupation: selectedClient?.occupation || '',
          employerBusinessName: selectedClient?.employerBusinessName || '',
        };
        setEditData(step1Data);
        break;
      case 2:
        setEditData({
          totalMonthlyIncome: selectedClient?.totalMonthlyIncome || 0,
          incomeType: selectedClient?.incomeType || 'Salaried',
          totalMonthlyExpenses: selectedClient?.totalMonthlyExpenses || 0,
          expenseBreakdown: {
            showBreakdown: selectedClient?.expenseBreakdown?.showBreakdown || false,
            housingRent: selectedClient?.expenseBreakdown?.housingRent || 0,
            foodGroceries: selectedClient?.expenseBreakdown?.foodGroceries || 0,
            transportation: selectedClient?.expenseBreakdown?.transportation || 0,
            utilities: selectedClient?.expenseBreakdown?.utilities || 0,
            entertainment: selectedClient?.expenseBreakdown?.entertainment || 0,
            healthcare: selectedClient?.expenseBreakdown?.healthcare || 0,
          },
          annualIncome: selectedClient?.annualIncome || 0,
          additionalIncome: selectedClient?.additionalIncome || 0,
        });
        break;
      case 3:
        setEditData({
          retirementPlanning: {
            currentAge: selectedClient?.retirementPlanning?.currentAge || 30,
            targetRetirementAge: selectedClient?.retirementPlanning?.targetRetirementAge || 60,
            currentRetirementCorpus: selectedClient?.retirementPlanning?.currentRetirementCorpus || 0,
            targetRetirementCorpus: selectedClient?.retirementPlanning?.targetRetirementCorpus || 0,
          },
          majorGoals: selectedClient?.majorGoals || [],
        });
        break;
      case 4:
        setEditData({
          assets: {
            investments: {
              equity: {
                mutualFunds: selectedClient?.assets?.investments?.equity?.mutualFunds || 0,
                directStocks: selectedClient?.assets?.investments?.equity?.directStocks || 0,
              },
              fixedIncome: {
                ppf: selectedClient?.assets?.investments?.fixedIncome?.ppf || 0,
                epf: selectedClient?.assets?.investments?.fixedIncome?.epf || 0,
                nps: selectedClient?.assets?.investments?.fixedIncome?.nps || 0,
                fixedDeposits: selectedClient?.assets?.investments?.fixedIncome?.fixedDeposits || 0,
                bondsDebentures: selectedClient?.assets?.investments?.fixedIncome?.bondsDebentures || 0,
                nsc: selectedClient?.assets?.investments?.fixedIncome?.nsc || 0,
              },
              other: {
                ulip: selectedClient?.assets?.investments?.other?.ulip || 0,
                otherInvestments: selectedClient?.assets?.investments?.other?.otherInvestments || 0,
              }
            }
          }
        });
        break;
      case 5:
        setEditData({
          debtsAndLiabilities: {
            homeLoan: {
              hasLoan: selectedClient?.debtsAndLiabilities?.homeLoan?.hasLoan || false,
              outstandingAmount: selectedClient?.debtsAndLiabilities?.homeLoan?.outstandingAmount || 0,
              monthlyEMI: selectedClient?.debtsAndLiabilities?.homeLoan?.monthlyEMI || 0,
              interestRate: selectedClient?.debtsAndLiabilities?.homeLoan?.interestRate || 0,
              remainingTenure: selectedClient?.debtsAndLiabilities?.homeLoan?.remainingTenure || 0,
            },
            personalLoan: {
              hasLoan: selectedClient?.debtsAndLiabilities?.personalLoan?.hasLoan || false,
              outstandingAmount: selectedClient?.debtsAndLiabilities?.personalLoan?.outstandingAmount || 0,
              monthlyEMI: selectedClient?.debtsAndLiabilities?.personalLoan?.monthlyEMI || 0,
              interestRate: selectedClient?.debtsAndLiabilities?.personalLoan?.interestRate || 0,
            },
            carLoan: {
              hasLoan: selectedClient?.debtsAndLiabilities?.carLoan?.hasLoan || false,
              outstandingAmount: selectedClient?.debtsAndLiabilities?.carLoan?.outstandingAmount || 0,
              monthlyEMI: selectedClient?.debtsAndLiabilities?.carLoan?.monthlyEMI || 0,
              interestRate: selectedClient?.debtsAndLiabilities?.carLoan?.interestRate || 0,
            },
            creditCards: {
              hasDebt: selectedClient?.debtsAndLiabilities?.creditCards?.hasDebt || false,
              totalOutstanding: selectedClient?.debtsAndLiabilities?.creditCards?.totalOutstanding || 0,
              monthlyPayment: selectedClient?.debtsAndLiabilities?.creditCards?.monthlyPayment || 0,
              averageInterestRate: selectedClient?.debtsAndLiabilities?.creditCards?.averageInterestRate || 36,
            }
          }
        });
        break;
      case 6:
        setEditData({
          insuranceCoverage: {
            lifeInsurance: {
              hasInsurance: selectedClient?.insuranceCoverage?.lifeInsurance?.hasInsurance || false,
              totalCoverAmount: selectedClient?.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0,
              annualPremium: selectedClient?.insuranceCoverage?.lifeInsurance?.annualPremium || 0,
              insuranceType: selectedClient?.insuranceCoverage?.lifeInsurance?.insuranceType || 'Term Life',
            },
            healthInsurance: {
              hasInsurance: selectedClient?.insuranceCoverage?.healthInsurance?.hasInsurance || false,
              totalCoverAmount: selectedClient?.insuranceCoverage?.healthInsurance?.totalCoverAmount || 0,
              annualPremium: selectedClient?.insuranceCoverage?.healthInsurance?.annualPremium || 0,
              familyMembers: selectedClient?.insuranceCoverage?.healthInsurance?.familyMembers || 1,
            },
            vehicleInsurance: {
              hasInsurance: selectedClient?.insuranceCoverage?.vehicleInsurance?.hasInsurance || false,
              annualPremium: selectedClient?.insuranceCoverage?.vehicleInsurance?.annualPremium || 0,
            }
          }
        });
        break;
      case 7:
        setEditData({
          enhancedRiskProfile: {
            investmentExperience: selectedClient?.enhancedRiskProfile?.investmentExperience || '',
            riskTolerance: selectedClient?.enhancedRiskProfile?.riskTolerance || '',
            monthlyInvestmentCapacity: selectedClient?.enhancedRiskProfile?.monthlyInvestmentCapacity || 0,
          },
          enhancedFinancialGoals: {
            emergencyFund: {
              priority: selectedClient?.enhancedFinancialGoals?.emergencyFund?.priority || 'High',
              targetAmount: selectedClient?.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0,
            },
            childEducation: {
              isApplicable: selectedClient?.enhancedFinancialGoals?.childEducation?.isApplicable || false,
              targetAmount: selectedClient?.enhancedFinancialGoals?.childEducation?.targetAmount || 2500000,
              targetYear: selectedClient?.enhancedFinancialGoals?.childEducation?.targetYear || new Date().getFullYear() + 15,
            },
            homePurchase: {
              isApplicable: selectedClient?.enhancedFinancialGoals?.homePurchase?.isApplicable || false,
              targetAmount: selectedClient?.enhancedFinancialGoals?.homePurchase?.targetAmount || 0,
              targetYear: selectedClient?.enhancedFinancialGoals?.homePurchase?.targetYear || new Date().getFullYear() + 5,
            }
          }
        });
        break;
      case 4:
        setEditData({
          assets: {
            investments: {
              equity: {
                mutualFunds: selectedClient?.assets?.investments?.equity?.mutualFunds || 0,
                directStocks: selectedClient?.assets?.investments?.equity?.directStocks || 0,
              },
              fixedIncome: {
                ppf: selectedClient?.assets?.investments?.fixedIncome?.ppf || 0,
                epf: selectedClient?.assets?.investments?.fixedIncome?.epf || 0,
                nps: selectedClient?.assets?.investments?.fixedIncome?.nps || 0,
                fixedDeposits: selectedClient?.assets?.investments?.fixedIncome?.fixedDeposits || 0,
                bondsDebentures: selectedClient?.assets?.investments?.fixedIncome?.bondsDebentures || 0,
                nsc: selectedClient?.assets?.investments?.fixedIncome?.nsc || 0,
              },
              other: {
                ulip: selectedClient?.assets?.investments?.other?.ulip || 0,
                otherInvestments: selectedClient?.assets?.investments?.other?.otherInvestments || 0,
              }
            }
          }
        });
        break;
      case 5:
        setEditData({
          debtsAndLiabilities: {
            homeLoan: {
              hasLoan: selectedClient?.debtsAndLiabilities?.homeLoan?.hasLoan || false,
              outstandingAmount: selectedClient?.debtsAndLiabilities?.homeLoan?.outstandingAmount || 0,
              monthlyEMI: selectedClient?.debtsAndLiabilities?.homeLoan?.monthlyEMI || 0,
              interestRate: selectedClient?.debtsAndLiabilities?.homeLoan?.interestRate || 0,
              remainingTenure: selectedClient?.debtsAndLiabilities?.homeLoan?.remainingTenure || 0,
            },
            personalLoan: {
              hasLoan: selectedClient?.debtsAndLiabilities?.personalLoan?.hasLoan || false,
              outstandingAmount: selectedClient?.debtsAndLiabilities?.personalLoan?.outstandingAmount || 0,
              monthlyEMI: selectedClient?.debtsAndLiabilities?.personalLoan?.monthlyEMI || 0,
              interestRate: selectedClient?.debtsAndLiabilities?.personalLoan?.interestRate || 0,
            },
            carLoan: {
              hasLoan: selectedClient?.debtsAndLiabilities?.carLoan?.hasLoan || false,
              outstandingAmount: selectedClient?.debtsAndLiabilities?.carLoan?.outstandingAmount || 0,
              monthlyEMI: selectedClient?.debtsAndLiabilities?.carLoan?.monthlyEMI || 0,
              interestRate: selectedClient?.debtsAndLiabilities?.carLoan?.interestRate || 0,
            },
            creditCards: {
              hasDebt: selectedClient?.debtsAndLiabilities?.creditCards?.hasDebt || false,
              totalOutstanding: selectedClient?.debtsAndLiabilities?.creditCards?.totalOutstanding || 0,
              monthlyPayment: selectedClient?.debtsAndLiabilities?.creditCards?.monthlyPayment || 0,
              averageInterestRate: selectedClient?.debtsAndLiabilities?.creditCards?.averageInterestRate || 36,
            }
          }
        });
        break;
      case 6:
        setEditData({
          insuranceCoverage: {
            lifeInsurance: {
              hasInsurance: selectedClient?.insuranceCoverage?.lifeInsurance?.hasInsurance || false,
              totalCoverAmount: selectedClient?.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0,
              annualPremium: selectedClient?.insuranceCoverage?.lifeInsurance?.annualPremium || 0,
              insuranceType: selectedClient?.insuranceCoverage?.lifeInsurance?.insuranceType || 'Term Life',
            },
            healthInsurance: {
              hasInsurance: selectedClient?.insuranceCoverage?.healthInsurance?.hasInsurance || false,
              totalCoverAmount: selectedClient?.insuranceCoverage?.healthInsurance?.totalCoverAmount || 0,
              annualPremium: selectedClient?.insuranceCoverage?.healthInsurance?.annualPremium || 0,
              familyMembers: selectedClient?.insuranceCoverage?.healthInsurance?.familyMembers || 1,
            },
            vehicleInsurance: {
              hasInsurance: selectedClient?.insuranceCoverage?.vehicleInsurance?.hasInsurance || false,
              annualPremium: selectedClient?.insuranceCoverage?.vehicleInsurance?.annualPremium || 0,
            }
          }
        });
        break;
      case 7:
        setEditData({
          enhancedRiskProfile: {
            investmentExperience: selectedClient?.enhancedRiskProfile?.investmentExperience || '',
            riskTolerance: selectedClient?.enhancedRiskProfile?.riskTolerance || '',
            monthlyInvestmentCapacity: selectedClient?.enhancedRiskProfile?.monthlyInvestmentCapacity || 0,
          },
          enhancedFinancialGoals: {
            emergencyFund: {
              priority: selectedClient?.enhancedFinancialGoals?.emergencyFund?.priority || 'High',
              targetAmount: selectedClient?.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0,
            },
            childEducation: {
              isApplicable: selectedClient?.enhancedFinancialGoals?.childEducation?.isApplicable || false,
              targetAmount: selectedClient?.enhancedFinancialGoals?.childEducation?.targetAmount || 0,
              targetYear: selectedClient?.enhancedFinancialGoals?.childEducation?.targetYear || new Date().getFullYear() + 10,
            },
            homePurchase: {
              isApplicable: selectedClient?.enhancedFinancialGoals?.homePurchase?.isApplicable || false,
              targetAmount: selectedClient?.enhancedFinancialGoals?.homePurchase?.targetAmount || 0,
              targetYear: selectedClient?.enhancedFinancialGoals?.homePurchase?.targetYear || new Date().getFullYear() + 5,
            }
          }
        });
        break;
      default:
        setEditData({});
    }
    
    } catch (error) {
      console.error('❌ ERROR in handleEdit:', error);
      alert('Error starting edit mode: ' + error.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      
      // Update the client data via API call - using admin endpoint
      const response = await fetch(`/api/admin/advisors/${selectedAdvisor._id}/clients/${selectedClient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-token': localStorage.getItem('adminToken'),
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedClient = await response.json();
        
        // Update local state with the response data
        setSelectedClient({ ...selectedClient, ...editData });
        
        // Update the advisorClients list if client is in the list
        setAdvisorClients(prev => prev.map(client => 
          client._id === selectedClient._id 
            ? { ...client, ...editData }
            : client
        ));
        
        // Reset edit state
        setEditingStep(null);
        setEditData({});
        
        // Show success message
        console.log('Client updated successfully');
        // TODO: Add proper success notification
        
      } else {
        const errorData = await response.json();
        console.error('Failed to update client:', errorData);
        // TODO: Add proper error notification
        alert('Failed to update client: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating client:', error);
      // TODO: Add proper error notification  
      alert('Error updating client: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Confirm if user wants to discard changes
    if (Object.keys(editData).length > 0) {
      const confirmDiscard = window.confirm('Are you sure you want to discard your changes?');
      if (!confirmDiscard) {
        return;
      }
    }
    
    setEditingStep(null);
    setEditData({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">System Administrator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {!showClients ? (
          // Main Dashboard View with Stats and Advisors
          <div>
            {/* Dashboard Stats */}
            {dashboardStats && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Advisors</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalAdvisors || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalClients || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Clients with CAS</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.clientsWithCAS || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">CAS Completion</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardStats.totalClients > 0 
                            ? Math.round((dashboardStats.clientsWithCAS / dashboardStats.totalClients) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advisors List */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Advisors</h2>
              <p className="text-gray-600">Total Advisors: {advisors.length}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advisors.map((advisor) => (
                <div
                  key={advisor._id}
                  onClick={() => handleAdvisorClick(advisor)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-indigo-600">
                              {advisor.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {advisor.name || 'Unnamed Advisor'}
                          </h3>
                          <p className="text-sm text-gray-500">{advisor.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          {advisor.clientCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">Clients</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Firm:</span>
                          <p className="font-medium text-gray-900">
                            {advisor.firm || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium text-gray-900">
                            {advisor.phone || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Registration Date:</span>
                        <span className="font-medium text-gray-900">
                          {apiUtils.formatDate(advisor.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200">
                        View Details & Clients
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {advisors.length === 0 && !loading && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No advisors found</h3>
                <p className="mt-1 text-sm text-gray-500">No advisors have been registered yet.</p>
              </div>
            )}
          </div>
        ) : !showClientDetails ? (
          // Advisor Details & Clients View
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToAdvisors}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Advisors
              </button>

              {/* Advisor Details Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-600">
                        {selectedAdvisor?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedAdvisor?.name || 'Unnamed Advisor'}
                      </h2>
                      <p className="text-gray-600">{selectedAdvisor?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">
                      {advisorClients.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Clients</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-sm text-gray-500">Firm</span>
                    <p className="font-medium text-gray-900">
                      {selectedAdvisor?.firm || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone</span>
                    <p className="font-medium text-gray-900">
                      {selectedAdvisor?.phone || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Registration Date</span>
                    <p className="font-medium text-gray-900">
                      {apiUtils.formatDate(selectedAdvisor?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <p className="font-medium text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Clients List */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Client List</h3>
                  <p className="text-sm text-gray-500 mt-1">Click on any client to view detailed information</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CAS Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Portfolio Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advisorClients.map((client) => (
                        <tr key={client._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {(client.firstName || client.name || 'C').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.firstName && client.lastName 
                                    ? `${client.firstName} ${client.lastName}`
                                    : client.name || 'Unnamed Client'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  PAN: {client.panNumber || 'Not provided'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {client.email || 'No email'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.phoneNumber || 'No phone'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCASStatusColor(client.casData?.casStatus)}`}>
                              {getCASStatusText(client.casData?.casStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.casData?.parsedData?.summary?.total_value 
                              ? apiUtils.formatCurrency(client.casData.parsedData.summary.total_value) 
                              : 'Not available'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apiUtils.formatDate(client.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleClientClick(client)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {advisorClients.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                    <p className="mt-1 text-sm text-gray-500">This advisor has no clients yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Client Details View
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToClients}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Clients
              </button>

              {/* Client Details Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-indigo-600">
                        {selectedClient?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-3xl font-bold text-gray-900">
                        {selectedClient?.firstName && selectedClient?.lastName 
                          ? `${selectedClient.firstName} ${selectedClient.lastName}`
                          : selectedClient?.name || 'Unnamed Client'}
                      </h2>
                      <p className="text-gray-600">
                        {selectedClient?.email || 'No email'}
                      </p>
                      <p className="text-sm text-gray-500">
                        PAN: {selectedClient?.panNumber || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {apiUtils.formatCurrency(selectedClient?.casData?.parsedData?.summary?.total_value || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Portfolio Value</div>
                  </div>
                </div>


                {/* Step 1: Personal Information */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 1: Personal Information</h3>
                    {editingStep === 1 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Basic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">First Name:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={(editData && editData.firstName) || ''}
                              onChange={(e) => {
                                setEditData(prev => ({ ...prev, firstName: e.target.value }));
                              }}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="First name"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              {selectedClient?.firstName || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Last Name:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={editData.lastName || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Last name"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              {selectedClient?.lastName || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Email:</label>
                          {editingStep === 1 ? (
                            <input
                              type="email"
                              value={editData.email || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Email address"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              {selectedClient?.email || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Phone:</label>
                          {editingStep === 1 ? (
                            <input
                              type="tel"
                              value={editData.phoneNumber || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Phone number"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              {selectedClient?.phoneNumber || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Date of Birth:</label>
                          {editingStep === 1 ? (
                            <input
                              type="date"
                              value={editData.dateOfBirth?.split('T')[0] || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              {selectedClient?.dateOfBirth ? new Date(selectedClient.dateOfBirth).toLocaleDateString() : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Personal Details</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-green-700 block mb-1">PAN Number:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={editData.panNumber || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="PAN Number"
                              maxLength="10"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              {selectedClient?.panNumber || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Marital Status:</label>
                          {editingStep === 1 ? (
                            <select
                              value={editData.maritalStatus || 'Single'}
                              onChange={(e) => setEditData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                            >
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              {selectedClient?.maritalStatus || 'Single'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Gender:</label>
                          {editingStep === 1 ? (
                            <select
                              value={editData.gender || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              {selectedClient?.gender ? selectedClient.gender.charAt(0).toUpperCase() + selectedClient.gender.slice(1) : 'Not specified'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Dependents:</label>
                          {editingStep === 1 ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={editData.numberOfDependents || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, numberOfDependents: Number(e.target.value) }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Number of dependents"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              {selectedClient?.numberOfDependents || 0}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Occupation:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={editData.occupation || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, occupation: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Occupation"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              {selectedClient?.occupation || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address & Employment */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-900 mb-3">Address & Employment</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">Street Address:</label>
                          {editingStep === 1 ? (
                            <textarea
                              value={editData.address?.street || ''}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, street: e.target.value }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Street address"
                              rows="2"
                            />
                          ) : (
                            <p className="text-sm font-medium text-purple-900">
                              {selectedClient?.address?.street || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">City:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={editData.address?.city || ''}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, city: e.target.value }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="City"
                            />
                          ) : (
                            <p className="text-sm font-medium text-purple-900">
                              {selectedClient?.address?.city || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">State:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={editData.address?.state || ''}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, state: e.target.value }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="State"
                            />
                          ) : (
                            <p className="text-sm font-medium text-purple-900">
                              {selectedClient?.address?.state || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">Employer/Business:</label>
                          {editingStep === 1 ? (
                            <input
                              type="text"
                              value={editData.employerBusinessName || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, employerBusinessName: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Employer or business name"
                            />
                          ) : (
                            <p className="text-sm font-medium text-purple-900">
                              {selectedClient?.employerBusinessName || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Income & Expenses */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 2: Income & Expenses</h3>
                    {editingStep === 2 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(2)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Income Information */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Income Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Monthly Income:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.totalMonthlyIncome || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, totalMonthlyIncome: Number(e.target.value) }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Monthly income"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.totalMonthlyIncome || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Income Type:</label>
                          {editingStep === 2 ? (
                            <select
                              value={editData.incomeType || 'Salaried'}
                              onChange={(e) => setEditData(prev => ({ ...prev, incomeType: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                            >
                              <option value="Salaried">Salaried</option>
                              <option value="Business">Business</option>
                              <option value="Freelance">Freelance</option>
                              <option value="Mixed">Mixed</option>
                            </select>
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              {selectedClient?.incomeType || 'Not specified'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Annual Income:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.annualIncome || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, annualIncome: Number(e.target.value) }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Annual income"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.annualIncome || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Additional Income:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.additionalIncome || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, additionalIncome: Number(e.target.value) }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Additional income"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.additionalIncome || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expense Information */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-900 mb-3">Expense Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-red-700 block mb-1">Monthly Expenses:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.totalMonthlyExpenses || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, totalMonthlyExpenses: Number(e.target.value) }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Total monthly expenses"
                            />
                          ) : (
                            <p className="text-sm font-medium text-red-900">
                              ₹{(selectedClient?.totalMonthlyExpenses || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-red-700 block mb-1">Housing/Rent:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.expenseBreakdown?.housingRent || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                expenseBreakdown: { 
                                  ...prev.expenseBreakdown, 
                                  housingRent: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Housing/rent expenses"
                            />
                          ) : (
                            <p className="text-sm font-medium text-red-900">
                              ₹{(selectedClient?.expenseBreakdown?.housingRent || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-red-700 block mb-1">Food & Groceries:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.expenseBreakdown?.foodGroceries || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                expenseBreakdown: { 
                                  ...prev.expenseBreakdown, 
                                  foodGroceries: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Food & groceries"
                            />
                          ) : (
                            <p className="text-sm font-medium text-red-900">
                              ₹{(selectedClient?.expenseBreakdown?.foodGroceries || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-red-700 block mb-1">Transportation:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.expenseBreakdown?.transportation || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                expenseBreakdown: { 
                                  ...prev.expenseBreakdown, 
                                  transportation: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Transportation costs"
                            />
                          ) : (
                            <p className="text-sm font-medium text-red-900">
                              ₹{(selectedClient?.expenseBreakdown?.transportation || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Financial Summary</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Monthly Surplus:</label>
                          <p className="text-sm font-medium text-blue-900">
                            ₹{((selectedClient?.totalMonthlyIncome || 0) - (selectedClient?.totalMonthlyExpenses || 0)).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Savings Rate:</label>
                          <p className="text-sm font-medium text-blue-900">
                            {selectedClient?.totalMonthlyIncome ? 
                              (((selectedClient.totalMonthlyIncome - (selectedClient.totalMonthlyExpenses || 0)) / selectedClient.totalMonthlyIncome) * 100).toFixed(1) 
                              : 0}%
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Utilities:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.expenseBreakdown?.utilities || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                expenseBreakdown: { 
                                  ...prev.expenseBreakdown, 
                                  utilities: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Utilities & bills"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              ₹{(selectedClient?.expenseBreakdown?.utilities || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Entertainment:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.expenseBreakdown?.entertainment || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                expenseBreakdown: { 
                                  ...prev.expenseBreakdown, 
                                  entertainment: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Entertainment & lifestyle"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              ₹{(selectedClient?.expenseBreakdown?.entertainment || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Healthcare:</label>
                          {editingStep === 2 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.expenseBreakdown?.healthcare || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                expenseBreakdown: { 
                                  ...prev.expenseBreakdown, 
                                  healthcare: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Healthcare expenses"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              ₹{(selectedClient?.expenseBreakdown?.healthcare || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Retirement & Goals */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 3: Retirement & Goals</h3>
                    {editingStep === 3 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(3)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Retirement Planning */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-orange-900 mb-3">Retirement Planning</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-orange-700 block mb-1">Current Age:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="18"
                              max="100"
                              value={editData.retirementPlanning?.currentAge || 30}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                retirementPlanning: { 
                                  ...prev.retirementPlanning, 
                                  currentAge: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Current age"
                            />
                          ) : (
                            <p className="text-sm font-medium text-orange-900">
                              {selectedClient?.retirementPlanning?.currentAge || selectedClient?.dateOfBirth ? 
                                Math.floor((new Date() - new Date(selectedClient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-orange-700 block mb-1">Target Retirement Age:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="45"
                              max="75"
                              value={editData.retirementPlanning?.targetRetirementAge || 60}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                retirementPlanning: { 
                                  ...prev.retirementPlanning, 
                                  targetRetirementAge: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Target retirement age"
                            />
                          ) : (
                            <p className="text-sm font-medium text-orange-900">
                              {selectedClient?.retirementPlanning?.targetRetirementAge || 60}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-orange-700 block mb-1">Current Retirement Corpus:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.retirementPlanning?.currentRetirementCorpus || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                retirementPlanning: { 
                                  ...prev.retirementPlanning, 
                                  currentRetirementCorpus: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Current retirement corpus"
                            />
                          ) : (
                            <p className="text-sm font-medium text-orange-900">
                              ₹{(selectedClient?.retirementPlanning?.currentRetirementCorpus || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-orange-700 block mb-1">Target Retirement Corpus:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.retirementPlanning?.targetRetirementCorpus || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                retirementPlanning: { 
                                  ...prev.retirementPlanning, 
                                  targetRetirementCorpus: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Target retirement corpus"
                            />
                          ) : (
                            <p className="text-sm font-medium text-orange-900">
                              ₹{(selectedClient?.retirementPlanning?.targetRetirementCorpus || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Major Goals */}
                    <div className="bg-teal-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-teal-900 mb-3">Major Financial Goals</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-teal-700 block mb-1">Emergency Fund Target:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.majorGoals?.emergencyFund || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                majorGoals: { 
                                  ...prev.majorGoals, 
                                  emergencyFund: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Emergency fund target"
                            />
                          ) : (
                            <p className="text-sm font-medium text-teal-900">
                              ₹{(selectedClient?.majorGoals?.emergencyFund || 0).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-teal-600 mt-1">
                            Recommended: ₹{((selectedClient?.totalMonthlyExpenses || 0) * 6).toLocaleString()} (6 months expenses)
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-teal-700 block mb-1">Child Education Goal:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.majorGoals?.childEducation || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                majorGoals: { 
                                  ...prev.majorGoals, 
                                  childEducation: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Child education fund"
                            />
                          ) : (
                            <p className="text-sm font-medium text-teal-900">
                              ₹{(selectedClient?.majorGoals?.childEducation || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-teal-700 block mb-1">Home Purchase Goal:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.majorGoals?.homePurchase || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                majorGoals: { 
                                  ...prev.majorGoals, 
                                  homePurchase: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Home purchase fund"
                            />
                          ) : (
                            <p className="text-sm font-medium text-teal-900">
                              ₹{(selectedClient?.majorGoals?.homePurchase || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-teal-700 block mb-1">Other Goals:</label>
                          {editingStep === 3 ? (
                            <input
                              type="number"
                              min="0"
                              value={editData.majorGoals?.otherGoals || 0}
                              onChange={(e) => setEditData(prev => ({ 
                                ...prev, 
                                majorGoals: { 
                                  ...prev.majorGoals, 
                                  otherGoals: Number(e.target.value) 
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Other financial goals"
                            />
                          ) : (
                            <p className="text-sm font-medium text-teal-900">
                              ₹{(selectedClient?.majorGoals?.otherGoals || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Analysis */}
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-indigo-900 mb-3">Financial Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-indigo-700 block mb-1">Years to Retirement:</label>
                          <p className="text-sm font-medium text-indigo-900">
                            {(selectedClient?.retirementPlanning?.targetRetirementAge || 60) - 
                             (selectedClient?.retirementPlanning?.currentAge || 
                              (selectedClient?.dateOfBirth ? 
                                Math.floor((new Date() - new Date(selectedClient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 30))} years
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-indigo-700 block mb-1">Monthly Investment Needed:</label>
                          <p className="text-sm font-medium text-indigo-900">
                            ₹{Math.round(
                              ((selectedClient?.retirementPlanning?.targetRetirementCorpus || 0) - 
                               (selectedClient?.retirementPlanning?.currentRetirementCorpus || 0)) / 
                              (((selectedClient?.retirementPlanning?.targetRetirementAge || 60) - 
                                (selectedClient?.retirementPlanning?.currentAge || 30)) * 12)
                            ).toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-indigo-600 mt-1">
                            Simplified calculation (excluding growth)
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-indigo-700 block mb-1">Total Goals Value:</label>
                          <p className="text-sm font-medium text-indigo-900">
                            ₹{(
                              (selectedClient?.retirementPlanning?.targetRetirementCorpus || 0) +
                              (selectedClient?.majorGoals?.emergencyFund || 0) +
                              (selectedClient?.majorGoals?.childEducation || 0) +
                              (selectedClient?.majorGoals?.homePurchase || 0) +
                              (selectedClient?.majorGoals?.otherGoals || 0)
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-indigo-700 block mb-1">Goal Feasibility:</label>
                          <p className="text-sm font-medium text-indigo-900">
                            {selectedClient?.totalMonthlyIncome && selectedClient?.totalMonthlyExpenses ? (
                              ((selectedClient.totalMonthlyIncome - selectedClient.totalMonthlyExpenses) >= 
                               Math.round(
                                 ((selectedClient?.retirementPlanning?.targetRetirementCorpus || 0) - 
                                  (selectedClient?.retirementPlanning?.currentRetirementCorpus || 0)) / 
                                 (((selectedClient?.retirementPlanning?.targetRetirementAge || 60) - 
                                   (selectedClient?.retirementPlanning?.currentAge || 30)) * 12)
                               )) ? (
                                <span className="text-green-600">Achievable</span>
                              ) : (
                                <span className="text-red-600">Challenging</span>
                              )
                            ) : (
                              'Needs more data'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Email:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Phone:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.phoneNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Address:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedClient?.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">CAS Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Status:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCASStatusColor(selectedClient?.casData?.casStatus)}`}>
                            {getCASStatusText(selectedClient?.casData?.casStatus)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Upload Date:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.uploadDate ? apiUtils.formatDate(selectedClient.casData.uploadDate) : 'Not uploaded'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Parse Date:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.parseDate ? apiUtils.formatDate(selectedClient.casData.parseDate) : 'Not parsed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Portfolio Summary</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Total Value:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {apiUtils.formatCurrency(selectedClient?.casData?.parsedData?.summary?.total_value || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Accounts:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.parsedData?.demat_accounts?.length || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Mutual Funds:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.parsedData?.mutual_funds?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps 4-7 Client Details */}
                {/* Step 4: Investment Details */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 4: Investment Portfolio</h3>
                    {editingStep === 4 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(4)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Equity Investments */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Equity Investments</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Mutual Funds:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.equity?.mutualFunds || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    equity: {
                                      ...prev.assets?.investments?.equity,
                                      mutualFunds: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Mutual funds value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              ₹{(selectedClient?.assets?.investments?.equity?.mutualFunds || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Direct Stocks:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.equity?.directStocks || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    equity: {
                                      ...prev.assets?.investments?.equity,
                                      directStocks: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Direct stocks value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-blue-900">
                              ₹{(selectedClient?.assets?.investments?.equity?.directStocks || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Fixed Income */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Fixed Income</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-green-700 block mb-1">PPF:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.fixedIncome?.ppf || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    fixedIncome: {
                                      ...prev.assets?.investments?.fixedIncome,
                                      ppf: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="PPF value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.assets?.investments?.fixedIncome?.ppf || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">EPF:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.fixedIncome?.epf || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    fixedIncome: {
                                      ...prev.assets?.investments?.fixedIncome,
                                      epf: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="EPF value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.assets?.investments?.fixedIncome?.epf || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Fixed Deposits:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.fixedIncome?.fixedDeposits || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    fixedIncome: {
                                      ...prev.assets?.investments?.fixedIncome,
                                      fixedDeposits: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Fixed deposits value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.assets?.investments?.fixedIncome?.fixedDeposits || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">NPS:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.fixedIncome?.nps || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    fixedIncome: {
                                      ...prev.assets?.investments?.fixedIncome,
                                      nps: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="NPS value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-900">
                              ₹{(selectedClient?.assets?.investments?.fixedIncome?.nps || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CAS Portfolio & Other */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-900 mb-3">CAS & Other Investments</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">CAS Total Value:</label>
                          <p className="text-sm font-medium text-purple-900">
                            {apiUtils.formatCurrency(selectedClient?.casData?.parsedData?.summary?.total_value || 0)}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            {selectedClient?.casData?.parsedData?.demat_accounts?.length || 0} Demat Accounts
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">ULIP:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.other?.ulip || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    other: {
                                      ...prev.assets?.investments?.other,
                                      ulip: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="ULIP value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-purple-900">
                              ₹{(selectedClient?.assets?.investments?.other?.ulip || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-purple-700 block mb-1">Other Investments:</label>
                          {editingStep === 4 ? (
                            <input
                              type="number"
                              value={editData.assets?.investments?.other?.otherInvestments || 0}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  investments: {
                                    ...prev.assets?.investments,
                                    other: {
                                      ...prev.assets?.investments?.other,
                                      otherInvestments: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border rounded"
                              placeholder="Other investments value"
                            />
                          ) : (
                            <p className="text-sm font-medium text-purple-900">
                              ₹{(selectedClient?.assets?.investments?.other?.otherInvestments || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5: Debts & Liabilities */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 5: Debts & Liabilities</h3>
                    {editingStep === 5 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(5)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Home Loan */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-red-900">Home Loan</h4>
                        {editingStep === 5 ? (
                          <input
                            type="checkbox"
                            checked={editData.debtsAndLiabilities?.homeLoan?.hasLoan || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              debtsAndLiabilities: {
                                ...prev.debtsAndLiabilities,
                                homeLoan: {
                                  ...prev.debtsAndLiabilities?.homeLoan,
                                  hasLoan: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.debtsAndLiabilities?.homeLoan?.hasLoan 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.debtsAndLiabilities?.homeLoan?.hasLoan ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 5 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Outstanding Amount</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.homeLoan?.outstandingAmount || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    homeLoan: {
                                      ...prev.debtsAndLiabilities?.homeLoan,
                                      outstandingAmount: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Outstanding amount"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Monthly EMI</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.homeLoan?.monthlyEMI || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    homeLoan: {
                                      ...prev.debtsAndLiabilities?.homeLoan,
                                      monthlyEMI: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Monthly EMI"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Interest Rate (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editData.debtsAndLiabilities?.homeLoan?.interestRate || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    homeLoan: {
                                      ...prev.debtsAndLiabilities?.homeLoan,
                                      interestRate: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Interest rate"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-red-700">Outstanding: ₹{(selectedClient?.debtsAndLiabilities?.homeLoan?.outstandingAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-red-700">EMI: ₹{(selectedClient?.debtsAndLiabilities?.homeLoan?.monthlyEMI || 0).toLocaleString()}</p>
                            <p className="text-xs text-red-700">Rate: {selectedClient?.debtsAndLiabilities?.homeLoan?.interestRate || 0}%</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Car Loan */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-red-900">Car Loan</h4>
                        {editingStep === 5 ? (
                          <input
                            type="checkbox"
                            checked={editData.debtsAndLiabilities?.carLoan?.hasLoan || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              debtsAndLiabilities: {
                                ...prev.debtsAndLiabilities,
                                carLoan: {
                                  ...prev.debtsAndLiabilities?.carLoan,
                                  hasLoan: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.debtsAndLiabilities?.carLoan?.hasLoan 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.debtsAndLiabilities?.carLoan?.hasLoan ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 5 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Outstanding Amount</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.carLoan?.outstandingAmount || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    carLoan: {
                                      ...prev.debtsAndLiabilities?.carLoan,
                                      outstandingAmount: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Outstanding amount"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Monthly EMI</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.carLoan?.monthlyEMI || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    carLoan: {
                                      ...prev.debtsAndLiabilities?.carLoan,
                                      monthlyEMI: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Monthly EMI"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Interest Rate (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editData.debtsAndLiabilities?.carLoan?.interestRate || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    carLoan: {
                                      ...prev.debtsAndLiabilities?.carLoan,
                                      interestRate: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Interest rate"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-red-700">Outstanding: ₹{(selectedClient?.debtsAndLiabilities?.carLoan?.outstandingAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-red-700">EMI: ₹{(selectedClient?.debtsAndLiabilities?.carLoan?.monthlyEMI || 0).toLocaleString()}</p>
                            <p className="text-xs text-red-700">Rate: {selectedClient?.debtsAndLiabilities?.carLoan?.interestRate || 0}%</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Personal Loan */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-red-900">Personal Loan</h4>
                        {editingStep === 5 ? (
                          <input
                            type="checkbox"
                            checked={editData.debtsAndLiabilities?.personalLoan?.hasLoan || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              debtsAndLiabilities: {
                                ...prev.debtsAndLiabilities,
                                personalLoan: {
                                  ...prev.debtsAndLiabilities?.personalLoan,
                                  hasLoan: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.debtsAndLiabilities?.personalLoan?.hasLoan 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.debtsAndLiabilities?.personalLoan?.hasLoan ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 5 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Outstanding Amount</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.personalLoan?.outstandingAmount || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    personalLoan: {
                                      ...prev.debtsAndLiabilities?.personalLoan,
                                      outstandingAmount: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Outstanding amount"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Monthly EMI</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.personalLoan?.monthlyEMI || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    personalLoan: {
                                      ...prev.debtsAndLiabilities?.personalLoan,
                                      monthlyEMI: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Monthly EMI"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Interest Rate (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editData.debtsAndLiabilities?.personalLoan?.interestRate || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    personalLoan: {
                                      ...prev.debtsAndLiabilities?.personalLoan,
                                      interestRate: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Interest rate"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-red-700">Outstanding: ₹{(selectedClient?.debtsAndLiabilities?.personalLoan?.outstandingAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-red-700">EMI: ₹{(selectedClient?.debtsAndLiabilities?.personalLoan?.monthlyEMI || 0).toLocaleString()}</p>
                            <p className="text-xs text-red-700">Rate: {selectedClient?.debtsAndLiabilities?.personalLoan?.interestRate || 0}%</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Credit Cards */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-orange-900">Credit Cards</h4>
                        {editingStep === 5 ? (
                          <input
                            type="checkbox"
                            checked={editData.debtsAndLiabilities?.creditCards?.hasDebt || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              debtsAndLiabilities: {
                                ...prev.debtsAndLiabilities,
                                creditCards: {
                                  ...prev.debtsAndLiabilities?.creditCards,
                                  hasDebt: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.debtsAndLiabilities?.creditCards?.hasDebt 
                              ? 'bg-orange-200 text-orange-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.debtsAndLiabilities?.creditCards?.hasDebt ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 5 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Total Outstanding</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.creditCards?.totalOutstanding || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    creditCards: {
                                      ...prev.debtsAndLiabilities?.creditCards,
                                      totalOutstanding: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Total outstanding"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Monthly Payment</label>
                              <input
                                type="number"
                                value={editData.debtsAndLiabilities?.creditCards?.monthlyPayment || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    creditCards: {
                                      ...prev.debtsAndLiabilities?.creditCards,
                                      monthlyPayment: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Monthly payment"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Average Interest Rate (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editData.debtsAndLiabilities?.creditCards?.averageInterestRate || 36}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  debtsAndLiabilities: {
                                    ...prev.debtsAndLiabilities,
                                    creditCards: {
                                      ...prev.debtsAndLiabilities?.creditCards,
                                      averageInterestRate: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Interest rate"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-orange-700">Outstanding: ₹{(selectedClient?.debtsAndLiabilities?.creditCards?.totalOutstanding || 0).toLocaleString()}</p>
                            <p className="text-xs text-orange-700">Monthly Payment: ₹{(selectedClient?.debtsAndLiabilities?.creditCards?.monthlyPayment || 0).toLocaleString()}</p>
                            <p className="text-xs text-orange-700">Rate: {selectedClient?.debtsAndLiabilities?.creditCards?.averageInterestRate || 36}%</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 6: Insurance Coverage */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 6: Insurance Coverage</h3>
                    {editingStep === 6 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(6)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Life Insurance */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-900">Life Insurance</h4>
                        {editingStep === 6 ? (
                          <input
                            type="checkbox"
                            checked={editData.insuranceCoverage?.lifeInsurance?.hasInsurance || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              insuranceCoverage: {
                                ...prev.insuranceCoverage,
                                lifeInsurance: {
                                  ...prev.insuranceCoverage?.lifeInsurance,
                                  hasInsurance: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.insuranceCoverage?.lifeInsurance?.hasInsurance 
                              ? 'bg-blue-200 text-blue-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.insuranceCoverage?.lifeInsurance?.hasInsurance ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 6 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Cover Amount</label>
                              <input
                                type="number"
                                value={editData.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    lifeInsurance: {
                                      ...prev.insuranceCoverage?.lifeInsurance,
                                      totalCoverAmount: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Cover amount"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Annual Premium</label>
                              <input
                                type="number"
                                value={editData.insuranceCoverage?.lifeInsurance?.annualPremium || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    lifeInsurance: {
                                      ...prev.insuranceCoverage?.lifeInsurance,
                                      annualPremium: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Annual premium"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Insurance Type</label>
                              <select
                                value={editData.insuranceCoverage?.lifeInsurance?.insuranceType || 'Term Life'}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    lifeInsurance: {
                                      ...prev.insuranceCoverage?.lifeInsurance,
                                      insuranceType: e.target.value
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                              >
                                <option value="Term Life">Term Life</option>
                                <option value="Whole Life">Whole Life</option>
                                <option value="ULIP">ULIP</option>
                                <option value="Endowment">Endowment</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-blue-700">Cover: ₹{(selectedClient?.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-blue-700">Premium: ₹{(selectedClient?.insuranceCoverage?.lifeInsurance?.annualPremium || 0).toLocaleString()}/year</p>
                            <p className="text-xs text-blue-700">Type: {selectedClient?.insuranceCoverage?.lifeInsurance?.insuranceType || 'Not specified'}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Health Insurance */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-green-900">Health Insurance</h4>
                        {editingStep === 6 ? (
                          <input
                            type="checkbox"
                            checked={editData.insuranceCoverage?.healthInsurance?.hasInsurance || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              insuranceCoverage: {
                                ...prev.insuranceCoverage,
                                healthInsurance: {
                                  ...prev.insuranceCoverage?.healthInsurance,
                                  hasInsurance: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.insuranceCoverage?.healthInsurance?.hasInsurance 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.insuranceCoverage?.healthInsurance?.hasInsurance ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 6 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Cover Amount</label>
                              <input
                                type="number"
                                value={editData.insuranceCoverage?.healthInsurance?.totalCoverAmount || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    healthInsurance: {
                                      ...prev.insuranceCoverage?.healthInsurance,
                                      totalCoverAmount: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Cover amount"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Annual Premium</label>
                              <input
                                type="number"
                                value={editData.insuranceCoverage?.healthInsurance?.annualPremium || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    healthInsurance: {
                                      ...prev.insuranceCoverage?.healthInsurance,
                                      annualPremium: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Annual premium"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Family Members</label>
                              <input
                                type="number"
                                min="1"
                                value={editData.insuranceCoverage?.healthInsurance?.familyMembers || 1}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    healthInsurance: {
                                      ...prev.insuranceCoverage?.healthInsurance,
                                      familyMembers: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Family members"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-green-700">Cover: ₹{(selectedClient?.insuranceCoverage?.healthInsurance?.totalCoverAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-green-700">Premium: ₹{(selectedClient?.insuranceCoverage?.healthInsurance?.annualPremium || 0).toLocaleString()}/year</p>
                            <p className="text-xs text-green-700">Members: {selectedClient?.insuranceCoverage?.healthInsurance?.familyMembers || 1}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Insurance */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-yellow-900">Vehicle Insurance</h4>
                        {editingStep === 6 ? (
                          <input
                            type="checkbox"
                            checked={editData.insuranceCoverage?.vehicleInsurance?.hasInsurance || false}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              insuranceCoverage: {
                                ...prev.insuranceCoverage,
                                vehicleInsurance: {
                                  ...prev.insuranceCoverage?.vehicleInsurance,
                                  hasInsurance: e.target.checked
                                }
                              }
                            }))}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedClient?.insuranceCoverage?.vehicleInsurance?.hasInsurance 
                              ? 'bg-yellow-200 text-yellow-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {selectedClient?.insuranceCoverage?.vehicleInsurance?.hasInsurance ? 'Active' : 'None'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {editingStep === 6 ? (
                          <>
                            <div>
                              <label className="text-xs text-gray-600">Annual Premium</label>
                              <input
                                type="number"
                                value={editData.insuranceCoverage?.vehicleInsurance?.annualPremium || 0}
                                onChange={(e) => setEditData(prev => ({
                                  ...prev,
                                  insuranceCoverage: {
                                    ...prev.insuranceCoverage,
                                    vehicleInsurance: {
                                      ...prev.insuranceCoverage?.vehicleInsurance,
                                      annualPremium: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="Annual premium"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-yellow-700">Premium: ₹{(selectedClient?.insuranceCoverage?.vehicleInsurance?.annualPremium || 0).toLocaleString()}/year</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 7: Financial Goals & Risk Profile */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Step 7: Financial Goals & Risk Profile</h3>
                    {editingStep !== 7 && (
                      <button
                        onClick={() => handleEdit(7)}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    )}
                    {editingStep === 7 && (
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
                  
                  {/* Financial Goals */}
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Financial Goals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Emergency Fund - Always Show */}
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-orange-900 mb-2">Emergency Fund</h5>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-orange-700">Priority:</span>
                            {editingStep === 7 ? (
                              <select
                                value={editData.enhancedFinancialGoals?.emergencyFund?.priority || 'High'}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  enhancedFinancialGoals: {
                                    ...editData.enhancedFinancialGoals,
                                    emergencyFund: {
                                      ...editData.enhancedFinancialGoals?.emergencyFund,
                                      priority: e.target.value
                                    }
                                  }
                                })}
                                className="block w-full mt-1 text-xs border border-orange-300 rounded px-2 py-1"
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                                <option value="Not Applicable">Not Applicable</option>
                              </select>
                            ) : (
                              <p className="text-xs text-orange-700">{selectedClient?.enhancedFinancialGoals?.emergencyFund?.priority || 'Not specified'}</p>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-orange-700">Target Amount:</span>
                            {editingStep === 7 ? (
                              <input
                                type="number"
                                value={editData.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  enhancedFinancialGoals: {
                                    ...editData.enhancedFinancialGoals,
                                    emergencyFund: {
                                      ...editData.enhancedFinancialGoals?.emergencyFund,
                                      targetAmount: parseInt(e.target.value) || 0
                                    }
                                  }
                                })}
                                className="block w-full mt-1 text-xs border border-orange-300 rounded px-2 py-1"
                                placeholder="Emergency fund target"
                              />
                            ) : (
                              <p className="text-xs text-orange-700">₹{(selectedClient?.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Child Education - Always Show */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-purple-900">Child Education</h5>
                          {editingStep === 7 ? (
                            <input
                              type="checkbox"
                              checked={editData.enhancedFinancialGoals?.childEducation?.isApplicable || false}
                              onChange={(e) => setEditData({
                                ...editData,
                                enhancedFinancialGoals: {
                                  ...editData.enhancedFinancialGoals,
                                  childEducation: {
                                    ...editData.enhancedFinancialGoals?.childEducation,
                                    isApplicable: e.target.checked
                                  }
                                }
                              })}
                              className="h-4 w-4"
                            />
                          ) : (
                            <span className="text-xs text-purple-700">{selectedClient?.enhancedFinancialGoals?.childEducation?.isApplicable ? 'Yes' : 'No'}</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-purple-700">Target Amount:</span>
                            {editingStep === 7 ? (
                              <input
                                type="number"
                                value={editData.enhancedFinancialGoals?.childEducation?.targetAmount || 2500000}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  enhancedFinancialGoals: {
                                    ...editData.enhancedFinancialGoals,
                                    childEducation: {
                                      ...editData.enhancedFinancialGoals?.childEducation,
                                      targetAmount: parseInt(e.target.value) || 0
                                    }
                                  }
                                })}
                                className="block w-full mt-1 text-xs border border-purple-300 rounded px-2 py-1"
                                placeholder="Education fund target"
                              />
                            ) : (
                              <p className="text-xs text-purple-700">₹{(selectedClient?.enhancedFinancialGoals?.childEducation?.targetAmount || 0).toLocaleString()}</p>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-purple-700">Target Year:</span>
                            {editingStep === 7 ? (
                              <input
                                type="number"
                                value={editData.enhancedFinancialGoals?.childEducation?.targetYear || new Date().getFullYear() + 15}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  enhancedFinancialGoals: {
                                    ...editData.enhancedFinancialGoals,
                                    childEducation: {
                                      ...editData.enhancedFinancialGoals?.childEducation,
                                      targetYear: parseInt(e.target.value) || new Date().getFullYear()
                                    }
                                  }
                                })}
                                className="block w-full mt-1 text-xs border border-purple-300 rounded px-2 py-1"
                                placeholder="Target year"
                              />
                            ) : (
                              <p className="text-xs text-purple-700">{selectedClient?.enhancedFinancialGoals?.childEducation?.targetYear || 'Not specified'}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Home Purchase - Always Show */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-green-900">Home Purchase</h5>
                          {editingStep === 7 ? (
                            <input
                              type="checkbox"
                              checked={editData.enhancedFinancialGoals?.homePurchase?.isApplicable || false}
                              onChange={(e) => setEditData({
                                ...editData,
                                enhancedFinancialGoals: {
                                  ...editData.enhancedFinancialGoals,
                                  homePurchase: {
                                    ...editData.enhancedFinancialGoals?.homePurchase,
                                    isApplicable: e.target.checked
                                  }
                                }
                              })}
                              className="h-4 w-4"
                            />
                          ) : (
                            <span className="text-xs text-green-700">{selectedClient?.enhancedFinancialGoals?.homePurchase?.isApplicable ? 'Yes' : 'No'}</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-green-700">Target Amount:</span>
                            {editingStep === 7 ? (
                              <input
                                type="number"
                                value={editData.enhancedFinancialGoals?.homePurchase?.targetAmount || 0}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  enhancedFinancialGoals: {
                                    ...editData.enhancedFinancialGoals,
                                    homePurchase: {
                                      ...editData.enhancedFinancialGoals?.homePurchase,
                                      targetAmount: parseInt(e.target.value) || 0
                                    }
                                  }
                                })}
                                className="block w-full mt-1 text-xs border border-green-300 rounded px-2 py-1"
                                placeholder="Home purchase target"
                              />
                            ) : (
                              <p className="text-xs text-green-700">₹{(selectedClient?.enhancedFinancialGoals?.homePurchase?.targetAmount || 0).toLocaleString()}</p>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-green-700">Target Year:</span>
                            {editingStep === 7 ? (
                              <input
                                type="number"
                                value={editData.enhancedFinancialGoals?.homePurchase?.targetYear || new Date().getFullYear() + 5}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  enhancedFinancialGoals: {
                                    ...editData.enhancedFinancialGoals,
                                    homePurchase: {
                                      ...editData.enhancedFinancialGoals?.homePurchase,
                                      targetYear: parseInt(e.target.value) || new Date().getFullYear()
                                    }
                                  }
                                })}
                                className="block w-full mt-1 text-xs border border-green-300 rounded px-2 py-1"
                                placeholder="Target year"
                              />
                            ) : (
                              <p className="text-xs text-green-700">{selectedClient?.enhancedFinancialGoals?.homePurchase?.targetYear || 'Not specified'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Profile */}
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Risk Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm text-gray-500">Investment Experience:</span>
                        {editingStep === 7 ? (
                          <select
                            value={editData.enhancedRiskProfile?.investmentExperience || ''}
                            onChange={(e) => setEditData({
                              ...editData,
                              enhancedRiskProfile: {
                                ...editData.enhancedRiskProfile,
                                investmentExperience: e.target.value
                              }
                            })}
                            className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select experience</option>
                            <option value="Beginner (0-2 years)">Beginner (0-2 years)</option>
                            <option value="Intermediate (2-5 years)">Intermediate (2-5 years)</option>
                            <option value="Experienced (5-10 years)">Experienced (5-10 years)</option>
                            <option value="Expert (10+ years)">Expert (10+ years)</option>
                          </select>
                        ) : (
                          <p className="font-medium text-gray-900">
                            {selectedClient?.enhancedRiskProfile?.investmentExperience || 'Not specified'}
                          </p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm text-gray-500">Risk Tolerance:</span>
                        {editingStep === 7 ? (
                          <select
                            value={editData.enhancedRiskProfile?.riskTolerance || ''}
                            onChange={(e) => setEditData({
                              ...editData,
                              enhancedRiskProfile: {
                                ...editData.enhancedRiskProfile,
                                riskTolerance: e.target.value
                              }
                            })}
                            className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select tolerance</option>
                            <option value="Conservative">Conservative</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Aggressive">Aggressive</option>
                          </select>
                        ) : (
                          <p className="font-medium text-gray-900">
                            {selectedClient?.enhancedRiskProfile?.riskTolerance || 'Not specified'}
                          </p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm text-gray-500">Monthly Investment Capacity:</span>
                        {editingStep === 7 ? (
                          <input
                            type="number"
                            value={editData.enhancedRiskProfile?.monthlyInvestmentCapacity || 0}
                            onChange={(e) => setEditData({
                              ...editData,
                              enhancedRiskProfile: {
                                ...editData.enhancedRiskProfile,
                                monthlyInvestmentCapacity: parseInt(e.target.value) || 0
                              }
                            })}
                            className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="Monthly capacity"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            ₹{(selectedClient?.enhancedRiskProfile?.monthlyInvestmentCapacity || 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Client Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-sm text-gray-500">Date of Birth:</span>
                      <p className="font-medium text-gray-900">
                        {selectedClient?.dateOfBirth ? apiUtils.formatDate(selectedClient.dateOfBirth) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Registration Date:</span>
                      <p className="font-medium text-gray-900">
                        {apiUtils.formatDate(selectedClient?.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Last Updated:</span>
                      <p className="font-medium text-gray-900">
                        {apiUtils.formatDate(selectedClient?.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <p className="font-medium text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 