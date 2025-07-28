import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Circle,
  AlertTriangle,
  BarChart3,
  Users,
  Eye
} from 'lucide-react';
import PDFViewModal from './PDFViewModal';
import { abTestingService } from '../../services/abTestingService';

const PlanSelectionPanel = ({ 
  client, 
  plans, 
  selectedPlans, 
  onPlanSelect, 
  onComparePlans, 
  onBack, 
  loading 
}) => {
  const [selectedPlanType, setSelectedPlanType] = useState('');
  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    planId: null,
    reportType: null,
    planTitle: null
  });

  // Group plans by type
  const plansByType = useMemo(() => {
    const grouped = {};
    plans.forEach(plan => {
      if (!grouped[plan.planType]) {
        grouped[plan.planType] = [];
      }
      grouped[plan.planType].push(plan);
    });
    return grouped;
  }, [plans]);

  // Get available plan types with counts
  const planTypes = useMemo(() => {
    return Object.keys(plansByType).map(type => ({
      type,
      count: plansByType[type].length,
      displayName: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    })).filter(item => item.count >= 2); // Only show types with 2+ plans for comparison
  }, [plansByType]);

  const getFilteredPlans = () => {
    if (!selectedPlanType) return [];
    return plansByType[selectedPlanType] || [];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricValue = (plan, metric) => {
    const metrics = plan?.clientDataSnapshot?.calculatedMetrics;
    if (!metrics) return 'N/A';
    
    switch (metric) {
      case 'netWorth':
        return metrics.netWorth ? `₹${(metrics.netWorth / 100000).toFixed(1)}L` : 'N/A';
      case 'emiRatio':
        return metrics.emiRatio ? `${(metrics.emiRatio * 100).toFixed(1)}%` : 'N/A';
      case 'savingsRate':
        return metrics.savingsRate ? `${(metrics.savingsRate * 100).toFixed(1)}%` : 'N/A';
      case 'monthlySurplus':
        return metrics.monthlySurplus ? `₹${metrics.monthlySurplus.toLocaleString()}` : 'N/A';
      default:
        return 'N/A';
    }
  };

  const isPlanSelected = (plan, planType) => {
    return selectedPlans[planType]?._id === plan._id;
  };

  const canCompare = selectedPlans.planA && selectedPlans.planB;

  const handlePlanClick = (plan) => {
    if (!selectedPlans.planA) {
      onPlanSelect('planA', plan);
    } else if (!selectedPlans.planB && selectedPlans.planA._id !== plan._id) {
      onPlanSelect('planB', plan);
    } else if (selectedPlans.planA._id === plan._id) {
      onPlanSelect('planA', null);
      if (selectedPlans.planB) {
        onPlanSelect('planA', selectedPlans.planB);
        onPlanSelect('planB', null);
      }
    } else if (selectedPlans.planB._id === plan._id) {
      onPlanSelect('planB', null);
    }
  };

  const clearSelection = () => {
    onPlanSelect('planA', null);
    onPlanSelect('planB', null);
  };

  const handleViewPDF = (plan, e) => {
    e.stopPropagation(); // Prevent plan selection when clicking PDF button
    
    setPdfModal({
      isOpen: true,
      planId: plan._id,
      reportType: plan.planType,
      planTitle: `${plan.planType.replace('_', ' ')} Plan - Version ${plan.version}`
    });
  };

  const closePDFModal = () => {
    setPdfModal({
      isOpen: false,
      planId: null,
      reportType: null,
      planTitle: null
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                {client.firstName} {client.lastName} - Plan Selection
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Select two plans of the same type to compare • {plans.length} total plans
              </p>
            </div>
          </div>
          
          {selectedPlans.planA && selectedPlans.planB && (
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Plan Type Selector */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Plan Type to Compare
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {planTypes.map(({ type, count, displayName }) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedPlanType(type);
                  clearSelection();
                }}
                className={`p-3 border rounded-lg text-left transition-all ${
                  selectedPlanType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="font-medium">{displayName}</div>
                <div className="text-sm text-gray-500">{count} plans available</div>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!selectedPlanType ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Plan Type
            </h3>
            <p className="text-gray-500">
              Choose a plan type above to view available plans for comparison
            </p>
          </div>
        ) : getFilteredPlans().length < 2 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Insufficient Plans
            </h3>
            <p className="text-gray-500">
              At least 2 plans of the same type are required for comparison
            </p>
          </div>
        ) : (
          <>
            {/* Selection Summary */}
            {(selectedPlans.planA || selectedPlans.planB) && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Selected Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      A
                    </div>
                    <div>
                      {selectedPlans.planA ? (
                        <>
                          <div className="font-medium">Version {selectedPlans.planA.version}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(selectedPlans.planA.createdAt)}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">Select Plan A</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      B
                    </div>
                    <div>
                      {selectedPlans.planB ? (
                        <>
                          <div className="font-medium">Version {selectedPlans.planB.version}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(selectedPlans.planB.createdAt)}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">Select Plan B</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {canCompare && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <button
                      onClick={onComparePlans}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? 'Analyzing Plans...' : 'Compare Selected Plans'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Plans List */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                {selectedPlanType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Plans
              </h4>
              
              <div className="grid gap-4">
                {getFilteredPlans().map((plan) => {
                  const isSelectedA = isPlanSelected(plan, 'planA');
                  const isSelectedB = isPlanSelected(plan, 'planB');
                  const isSelected = isSelectedA || isSelectedB;
                  
                  return (
                    <div
                      key={plan._id}
                      onClick={() => handlePlanClick(plan)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? isSelectedA
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {isSelected ? (
                              <CheckCircle className={`h-5 w-5 ${
                                isSelectedA ? 'text-blue-600' : 'text-green-600'
                              }`} />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">
                                Version {plan.version}
                                {isSelected && (
                                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    isSelectedA 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-green-600 text-white'
                                  }`}>
                                    Plan {isSelectedA ? 'A' : 'B'}
                                  </span>
                                )}    
                              </h3>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => handleViewPDF(plan, e)}
                                  className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                  title="View PDF Report"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  PDF
                                </button>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(plan.status)}`}>
                                  {plan.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Net Worth:</span>
                                <div className="font-medium">{getMetricValue(plan, 'netWorth')}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">EMI Ratio:</span>
                                <div className="font-medium">{getMetricValue(plan, 'emiRatio')}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Savings Rate:</span>
                                <div className="font-medium">{getMetricValue(plan, 'savingsRate')}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Monthly Surplus:</span>
                                <div className="font-medium">{getMetricValue(plan, 'monthlySurplus')}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                Created {formatDate(plan.createdAt)}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <FileText className="h-4 w-4 mr-1" />
                                Last updated {formatDate(plan.updatedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {/* PDF View Modal */}
      <PDFViewModal
        isOpen={pdfModal.isOpen}
        onClose={closePDFModal}
        planId={pdfModal.planId}
        reportType={pdfModal.reportType}
        planTitle={pdfModal.planTitle}
        abTestingService={abTestingService}
      />
    </Card>
  );
};

export default PlanSelectionPanel;