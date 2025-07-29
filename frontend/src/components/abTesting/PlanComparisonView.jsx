import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  ArrowLeft, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  User,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  Target,
  Eye
} from 'lucide-react';
import PDFViewModal from './PDFViewModal';
import { abTestingService } from '../../services/abTestingService';

const PlanComparisonView = ({ 
  comparison, 
  onBack, 
  onUpdateDecision, 
  onViewHistory 
}) => {
  const [selectedWinner, setSelectedWinner] = useState(
    comparison?.selectedWinner?.plan || ''
  );
  const [decisionReason, setDecisionReason] = useState(
    comparison?.selectedWinner?.reason || ''
  );
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);
  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    planId: null,
    reportType: null,
    planTitle: null
  });

  if (!comparison) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Comparison Data
            </h3>
            <p className="text-gray-500">
              Unable to load comparison results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { planA, planB, aiAnalysis } = comparison;
  const hasDecision = comparison.selectedWinner?.plan;

  const handleSaveDecision = async () => {
    if (!selectedWinner || !decisionReason.trim()) {
      return;
    }

    try {
      setSavingDecision(true);
      await onUpdateDecision(comparison._id, selectedWinner, decisionReason);
      setShowDecisionForm(false);
    } catch (error) {
      console.error('Failed to save decision:', error);
    } finally {
      setSavingDecision(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationIcon = (suggestedPlan) => {
    switch (suggestedPlan) {
      case 'planA':
        return <Award className="h-5 w-5 text-blue-600" />;
      case 'planB':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'both_suitable':
        return <CheckCircle className="h-5 w-5 text-purple-600" />;
      case 'neither_suitable':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSignificanceColor = (significance) => {
    switch (significance?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score <= 0.3) return 'text-green-600 bg-green-50';
    if (score <= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleViewPDF = (plan, planLabel) => {
    setPdfModal({
      isOpen: true,
      planId: plan.planId,
      reportType: plan.planType,
      planTitle: `Plan ${planLabel} - ${plan.planType.replace('_', ' ')} (Version ${plan.version})`
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

  const PlanSummaryCard = ({ plan, planLabel, isRecommended }) => (
    <Card className={`relative ${isRecommended ? 'ring-2 ring-yellow-400' : ''}`}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Award className="h-4 w-4 mr-1" />
            AI Recommended
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Plan {planLabel} - Version {plan.version}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Created {formatDate(plan.createdAt)}
            </p>
          </div>
          <button
            onClick={() => handleViewPDF(plan, planLabel)}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="View PDF Report"
          >
            <Eye className="h-4 w-4 mr-1" />
            View PDF
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {plan.snapshot?.keyMetrics && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Net Worth:</span>
                <div className="font-medium">
                  {plan.snapshot.keyMetrics.netWorth 
                    ? `₹${(plan.snapshot.keyMetrics.netWorth / 100000).toFixed(1)}L`
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-500">EMI Ratio:</span>
                <div className="font-medium">
                  {plan.snapshot.keyMetrics.emiRatio 
                    ? `${(plan.snapshot.keyMetrics.emiRatio * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-500">Savings Rate:</span>
                <div className="font-medium">
                  {plan.snapshot.keyMetrics.savingsRate 
                    ? `${(plan.snapshot.keyMetrics.savingsRate * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-500">Monthly Surplus:</span>
                <div className="font-medium">
                  {plan.snapshot.keyMetrics.monthlySurplus 
                    ? `₹${plan.snapshot.keyMetrics.monthlySurplus.toLocaleString()}`
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          )}
          
          {plan.snapshot?.summary && (
            <div className="pt-3 border-t border-gray-100">
              <span className="text-gray-500 text-sm">Summary:</span>
              <p className="text-sm mt-1">{plan.snapshot.summary}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
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
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Plan Comparison Results
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  AI-powered analysis comparing two {comparison.comparisonType.replace('_', ' ')} plans
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onViewHistory}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View History
              </button>
              
              {!hasDecision && (
                <button
                  onClick={() => setShowDecisionForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select Winner
                </button>
              )}
            </div>
          </div>
          
          {/* Comparison Metadata */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Analyzed {formatDate(aiAnalysis?.analysisTimestamp)}
            </div>
            <div className="flex items-center">
              <Brain className="h-4 w-4 mr-1" />
              Confidence: {((aiAnalysis?.recommendation?.confidenceScore || 0) * 100).toFixed(0)}%
            </div>
            {hasDecision && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Decision made {formatDate(comparison.selectedWinner.selectedAt)}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlanSummaryCard 
          plan={planA} 
          planLabel="A" 
          isRecommended={aiAnalysis?.recommendation?.suggestedPlan === 'planA'}
        />
        <PlanSummaryCard 
          plan={planB} 
          planLabel="B" 
          isRecommended={aiAnalysis?.recommendation?.suggestedPlan === 'planB'}
        />
      </div>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Executive Summary */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Executive Summary</h4>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700">{aiAnalysis?.executiveSummary || 'No summary available'}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">AI Recommendation</h4>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                {getRecommendationIcon(aiAnalysis?.recommendation?.suggestedPlan)}
                <div>
                  <div className="font-medium mb-1">
                    {aiAnalysis?.recommendation?.suggestedPlan === 'planA' ? 'Plan A Recommended' :
                     aiAnalysis?.recommendation?.suggestedPlan === 'planB' ? 'Plan B Recommended' :
                     aiAnalysis?.recommendation?.suggestedPlan === 'both_suitable' ? 'Both Plans Suitable' :
                     aiAnalysis?.recommendation?.suggestedPlan === 'neither_suitable' ? 'Neither Plan Suitable' :
                     'No Recommendation'}
                  </div>
                  <p className="text-gray-700">{aiAnalysis?.recommendation?.reasoning}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Differences */}
          {aiAnalysis?.keyDifferences && aiAnalysis.keyDifferences.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Differences</h4>
              <div className="space-y-3">
                {aiAnalysis.keyDifferences.map((diff, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{diff.aspect}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSignificanceColor(diff.significance)}`}>
                        {diff.significance} Impact
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 font-medium">Plan A:</span>
                        <p className="text-gray-700 mt-1">{diff.planAValue}</p>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">Plan B:</span>
                        <p className="text-gray-700 mt-1">{diff.planBValue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Plan A Analysis</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Strengths
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis?.planAStrengths?.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Weaknesses
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis?.planAWeaknesses?.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Plan B Analysis</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Strengths
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis?.planBStrengths?.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Weaknesses
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis?.planBWeaknesses?.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Comparison */}
          {aiAnalysis?.riskComparison && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Risk Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Plan A Risk Score</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(aiAnalysis.riskComparison.planARiskScore)}`}>
                      {(aiAnalysis.riskComparison.planARiskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Plan B Risk Score</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(aiAnalysis.riskComparison.planBRiskScore)}`}>
                      {(aiAnalysis.riskComparison.planBRiskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {aiAnalysis.riskComparison.riskFactors && aiAnalysis.riskComparison.riskFactors.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-yellow-700 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Key Risk Factors
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis.riskComparison.riskFactors.map((factor, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Implementation Considerations */}
          {aiAnalysis?.implementationConsiderations && aiAnalysis.implementationConsiderations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Implementation Considerations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {aiAnalysis.implementationConsiderations.map((consideration, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Decision */}
      {hasDecision && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Final Decision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900 mb-1">
                    Plan {comparison.selectedWinner.plan.replace('plan', '').toUpperCase()} Selected as Winner
                  </div>
                  <p className="text-green-700 text-sm mb-2">{comparison.selectedWinner.reason}</p>
                  <p className="text-green-600 text-xs">
                    Decision made on {formatDate(comparison.selectedWinner.selectedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Form Modal */}
      {showDecisionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Select Winning Plan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which plan do you recommend?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="planA"
                      checked={selectedWinner === 'planA'}
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="mr-2"
                    />
                    Plan A (Version {planA.version})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="planB"
                      checked={selectedWinner === 'planB'}
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="mr-2"
                    />
                    Plan B (Version {planB.version})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="both"
                      checked={selectedWinner === 'both'}
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="mr-2"
                    />
                    Both plans are suitable
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="neither"
                      checked={selectedWinner === 'neither'}
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="mr-2"
                    />
                    Neither plan is suitable
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for selection
                </label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Explain why you selected this plan..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDecisionForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDecision}
                disabled={!selectedWinner || !decisionReason.trim() || savingDecision}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingDecision ? 'Saving...' : 'Save Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      <PDFViewModal
        isOpen={pdfModal.isOpen}
        onClose={closePDFModal}
        planId={pdfModal.planId}
        reportType={pdfModal.reportType}
        planTitle={pdfModal.planTitle}
        abTestingService={abTestingService}
      />
    </div>
  );
};

export default PlanComparisonView;