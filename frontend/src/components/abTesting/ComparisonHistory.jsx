import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  History, 
  Calendar, 
  Award, 
  Brain, 
  ArrowLeft,
  Eye,
  FileText,
  TrendingUp
} from 'lucide-react';

const ComparisonHistory = ({ 
  client, 
  comparisons, 
  loading, 
  onViewComparison, 
  onBack, 
  fullView = false 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationDisplay = (comparison) => {
    const suggested = comparison.aiAnalysis?.recommendation?.suggestedPlan;
    const selected = comparison.selectedWinner?.plan;
    
    if (suggested === 'planA') {
      return { text: 'Plan A', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    } else if (suggested === 'planB') {
      return { text: 'Plan B', color: 'text-green-600', bgColor: 'bg-green-50' };
    }
    return { text: 'Both Suitable', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const getDecisionDisplay = (comparison) => {
    const selected = comparison.selectedWinner?.plan;
    
    if (!selected) {
      return { text: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
    
    if (selected === 'planA') {
      return { text: 'Plan A', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    } else if (selected === 'planB') {
      return { text: 'Plan B', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (selected === 'both') {
      return { text: 'Both Plans', color: 'text-purple-600', bgColor: 'bg-purple-50' };
    }
    
    return { text: 'No Decision', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Loading History...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Comparison History
            {client && !fullView && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({client.firstName} {client.lastName})
              </span>
            )}
          </CardTitle>
          
          {fullView && onBack && (
            <button
              onClick={onBack}
              className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          )}
        </div>
        
        {comparisons.length > 0 && (
          <p className="text-sm text-gray-500">
            {comparisons.length} comparison{comparisons.length !== 1 ? 's' : ''} found
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {comparisons.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No Comparisons Yet
            </h3>
            <p className="text-sm text-gray-500">
              {client 
                ? `No plan comparisons have been made for ${client.firstName} ${client.lastName}`
                : 'No plan comparisons found'
              }
            </p>
          </div>
        ) : (
          <div className={`space-y-3 ${!fullView ? 'max-h-80 overflow-y-auto' : ''}`}>
            {comparisons.map((comparison) => {
              const recommendation = getRecommendationDisplay(comparison);
              const decision = getDecisionDisplay(comparison);
              const confidence = comparison.aiAnalysis?.recommendation?.confidenceScore || 0;
              
              return (
                <div
                  key={comparison._id}
                  onClick={() => onViewComparison(comparison)}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {comparison.comparisonType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Plan Comparison
                        </h4>
                        <span className="text-xs text-gray-500">
                          #{comparison._id.slice(-6)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(comparison.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          v{comparison.planA.version} vs v{comparison.planB.version}
                        </div>
                        <div className="flex items-center">
                          <Brain className="h-4 w-4 mr-1" />
                          {(confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                    
                    <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">AI Recommendation</div>
                      <div className="flex items-center">
                        <Award className={`h-4 w-4 mr-1 ${recommendation.color}`} />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${recommendation.color} ${recommendation.bgColor}`}>
                          {recommendation.text}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Final Decision</div>
                      <div className="flex items-center">
                        <TrendingUp className={`h-4 w-4 mr-1 ${decision.color}`} />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${decision.color} ${decision.bgColor}`}>
                          {decision.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {comparison.aiAnalysis?.executiveSummary && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {comparison.aiAnalysis.executiveSummary}
                      </p>
                    </div>
                  )}
                  
                  {comparison.selectedWinner?.reason && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Decision Reason:</div>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        "{comparison.selectedWinner.reason}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {comparisons.length > 0 && !fullView && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={() => window.location.href = '#history'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Comparisons →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonHistory;