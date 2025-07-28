import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, TrendingUp, Users, FileText } from 'lucide-react';
import ClientListPanel from './ClientListPanel';
import PlanSelectionPanel from './PlanSelectionPanel';
import PlanComparisonView from './PlanComparisonView';
import ComparisonHistory from './ComparisonHistory';
import { abTestingService } from '../../services/abTestingService';

const ABTestingDashboard = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPlans, setClientPlans] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState({ planA: null, planB: null });
  const [comparison, setComparison] = useState(null);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [loading, setLoading] = useState({
    plans: false,
    comparison: false,
    history: false
  });
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('clientSelection'); // clientSelection, planSelection, comparison, history

  // Load client plans when a client is selected
  useEffect(() => {
    if (selectedClient) {
      loadClientPlans();
      loadComparisonHistory();
    }
  }, [selectedClient]);

  const loadClientPlans = async () => {
    try {
      setLoading(prev => ({ ...prev, plans: true }));
      setError(null);
      
      const response = await abTestingService.getClientPlans(selectedClient._id);
      if (response.success) {
        setClientPlans(response.plans);
        setCurrentView('planSelection');
      } else {
        throw new Error(response.message || 'Failed to load client plans');
      }
    } catch (err) {
      setError(`Failed to load plans: ${err.message}`);
      console.error('Error loading client plans:', err);
    } finally {
      setLoading(prev => ({ ...prev, plans: false }));
    }
  };

  const loadComparisonHistory = async () => {
    try {
      setLoading(prev => ({ ...prev, history: true }));
      
      const response = await abTestingService.getComparisonHistory(selectedClient._id);
      if (response.success) {
        setComparisonHistory(response.comparisons);
      }
    } catch (err) {
      console.error('Error loading comparison history:', err);
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSelectedPlans({ planA: null, planB: null });
    setComparison(null);
    setError(null);
  };

  const handlePlanSelect = (planType, plan) => {
    setSelectedPlans(prev => ({
      ...prev,
      [planType]: plan
    }));
  };

  const handleComparePlans = async () => {
    if (!selectedPlans.planA || !selectedPlans.planB) {
      setError('Please select both plans to compare');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, comparison: true }));
      setError(null);
      
      const response = await abTestingService.comparePlans(
        selectedPlans.planA._id,
        selectedPlans.planB._id
      );
      
      if (response.success) {
        setComparison(response.comparison);
        setCurrentView('comparison');
        // Refresh history to include the new comparison
        loadComparisonHistory();
      } else {
        throw new Error(response.message || 'Failed to compare plans');
      }
    } catch (err) {
      setError(`Comparison failed: ${err.message}`);
      console.error('Error comparing plans:', err);
    } finally {
      setLoading(prev => ({ ...prev, comparison: false }));
    }
  };

  const handleUpdateDecision = async (comparisonId, selectedWinner, reason) => {
    try {
      const response = await abTestingService.updateComparisonDecision(
        comparisonId,
        selectedWinner,
        reason
      );
      
      if (response.success) {
        setComparison(response.comparison);
        loadComparisonHistory();
      } else {
        throw new Error(response.message || 'Failed to update decision');
      }
    } catch (err) {
      setError(`Failed to update decision: ${err.message}`);
      console.error('Error updating decision:', err);
    }
  };

  const resetView = () => {
    setCurrentView('clientSelection');
    setSelectedClient(null);
    setClientPlans([]);
    setSelectedPlans({ planA: null, planB: null });
    setComparison(null);
    setError(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'clientSelection':
        return (
          <ClientListPanel
            onClientSelect={handleClientSelect}
            loading={loading.plans}
          />
        );
      
      case 'planSelection':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PlanSelectionPanel
                client={selectedClient}
                plans={clientPlans}
                selectedPlans={selectedPlans}
                onPlanSelect={handlePlanSelect}
                onComparePlans={handleComparePlans}
                onBack={() => setCurrentView('clientSelection')}
                loading={loading.comparison}
              />
            </div>
            <div>
              <ComparisonHistory
                client={selectedClient}
                comparisons={comparisonHistory}
                loading={loading.history}
                onViewComparison={(comp) => {
                  setComparison(comp);
                  setCurrentView('comparison');
                }}
              />
            </div>
          </div>
        );
      
      case 'comparison':
        return (
          <PlanComparisonView
            comparison={comparison}
            onBack={() => setCurrentView('planSelection')}
            onUpdateDecision={handleUpdateDecision}
            onViewHistory={() => setCurrentView('history')}
          />
        );
      
      case 'history':
        return (
          <div className="max-w-4xl mx-auto">
            <ComparisonHistory
              client={selectedClient}
              comparisons={comparisonHistory}
              loading={loading.history}
              onViewComparison={(comp) => {
                setComparison(comp);
                setCurrentView('comparison');
              }}
              onBack={() => setCurrentView('planSelection')}
              fullView={true}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'clientSelection':
        return {
          title: 'A/B Testing Dashboard',
          subtitle: 'Compare financial plans to determine the best approach for your clients'
        };
      case 'planSelection':
        return {
          title: `Plan Selection - ${selectedClient?.firstName} ${selectedClient?.lastName}`,
          subtitle: 'Select two plans of the same type to compare'
        };
      case 'comparison':
        return {
          title: 'Plan Comparison Results',
          subtitle: `Analyzing plans for ${selectedClient?.firstName} ${selectedClient?.lastName}`
        };
      case 'history':
        return {
          title: 'Comparison History',
          subtitle: `All comparisons for ${selectedClient?.firstName} ${selectedClient?.lastName}`
        };
      default:
        return { title: 'A/B Testing', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{headerInfo.title}</h1>
              <p className="text-gray-600 mt-1">{headerInfo.subtitle}</p>
            </div>
            
            {currentView !== 'clientSelection' && (
              <button
                onClick={resetView}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 mt-4 text-sm text-gray-500">
            <span 
              className={`cursor-pointer hover:text-gray-700 ${currentView === 'clientSelection' ? 'text-blue-600 font-medium' : ''}`}
              onClick={() => setCurrentView('clientSelection')}
            >
              Client Selection
            </span>
            {selectedClient && (
              <>
                <span>/</span>
                <span 
                  className={`cursor-pointer hover:text-gray-700 ${currentView === 'planSelection' ? 'text-blue-600 font-medium' : ''}`}
                  onClick={() => setCurrentView('planSelection')}
                >
                  Plan Selection
                </span>
              </>
            )}
            {comparison && (
              <>
                <span>/</span>
                <span className={currentView === 'comparison' ? 'text-blue-600 font-medium' : ''}>
                  Comparison Results
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards (only show on main view) */}
        {currentView === 'clientSelection' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comparisons</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  All time plan comparisons
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  Clients with multiple plans
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  Comparisons completed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default ABTestingDashboard;