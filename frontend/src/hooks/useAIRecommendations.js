import { useState, useCallback, useRef, useEffect } from 'react';
import { planAPI } from '../services/api';

/**
 * Custom hook for managing AI Recommendations state with proper request deduplication
 * and race condition prevention for cash flow planning
 */
export const useAIRecommendations = (clientId, planId) => {
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRequestTime, setLastRequestTime] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  // Request tracking to prevent race conditions
  const activeRequestRef = useRef(null);
  const requestIdRef = useRef(0);
  const lockRef = useRef(false);

  /**
   * Generate fallback recommendations based on financial metrics
   */
  const generateFallbackRecommendations = useCallback((financialMetrics) => {
    const recommendations = {
      debtStrategy: '',
      emergencyFundAnalysis: '',
      investmentAnalysis: '',
      cashFlowOptimization: '',
      riskWarnings: [],
      opportunities: []
    };

    if (!financialMetrics) {
      recommendations.debtStrategy = 'Unable to analyze debt strategy without financial data.';
      return recommendations;
    }

    // Generate debt strategy
    if (financialMetrics.totalDebts > 0) {
      const emiRatio = financialMetrics.emiRatio || 0;
      if (emiRatio > 0.4) {
        recommendations.debtStrategy = `EMI ratio is ${(emiRatio * 100).toFixed(1)}% (exceeds safe limit of 40%). Priority focus on debt reduction required.`;
        recommendations.riskWarnings.push('High debt burden detected - immediate action required');
      } else if (emiRatio > 0.3) {
        recommendations.debtStrategy = `EMI ratio is ${(emiRatio * 100).toFixed(1)}%. Consider increasing EMI payments to reduce interest burden.`;
        recommendations.riskWarnings.push('Moderate debt burden - monitor carefully');
      } else {
        recommendations.debtStrategy = `Healthy EMI ratio of ${(emiRatio * 100).toFixed(1)}%. Good debt management.`;
      }
    } else {
      recommendations.debtStrategy = 'No existing debts. Excellent foundation for wealth building.';
      recommendations.opportunities.push('Debt-free status allows focus on aggressive wealth creation');
    }

    // Emergency fund analysis
    const emergencyFundMonths = financialMetrics.emergencyFundMonths || 0;
    if (emergencyFundMonths < 3) {
      recommendations.emergencyFundAnalysis = `Emergency fund covers only ${emergencyFundMonths.toFixed(1)} months. Build to 6 months of expenses.`;
      recommendations.riskWarnings.push('Insufficient emergency fund - financial vulnerability');
    } else if (emergencyFundMonths < 6) {
      recommendations.emergencyFundAnalysis = `Emergency fund covers ${emergencyFundMonths.toFixed(1)} months. Consider increasing to 6 months.`;
    } else {
      recommendations.emergencyFundAnalysis = `Strong emergency fund covering ${emergencyFundMonths.toFixed(1)} months of expenses.`;
    }

    // Investment analysis
    const savingsRate = financialMetrics.savingsRate || 0;
    if (savingsRate > 0.2) {
      recommendations.investmentAnalysis = `Excellent savings rate of ${(savingsRate * 100).toFixed(1)}%. Focus on diversified investment portfolio.`;
      recommendations.opportunities.push('High savings rate enables aggressive investment strategy');
    } else if (savingsRate > 0.1) {
      recommendations.investmentAnalysis = `Good savings rate of ${(savingsRate * 100).toFixed(1)}%. Gradual investment approach recommended.`;
    } else {
      recommendations.investmentAnalysis = `Low savings rate of ${(savingsRate * 100).toFixed(1)}%. Focus on expense optimization first.`;
      recommendations.riskWarnings.push('Low savings rate limits investment capacity');
    }

    // Cash flow optimization
    const monthlySurplus = financialMetrics.monthlySurplus || 0;
    if (monthlySurplus > 0) {
      recommendations.cashFlowOptimization = `Monthly surplus of ₹${monthlySurplus.toLocaleString()} available for systematic investments.`;
    } else {
      recommendations.cashFlowOptimization = 'Negative cash flow requires immediate budget optimization.';
      recommendations.riskWarnings.push('Negative cash flow - urgent budget review needed');
    }

    return recommendations;
  }, []);

  /**
   * Validate client data before AI analysis
   */
  const validateClientDataForAI = useCallback((clientData) => {
    const errors = [];

    if (!clientData) {
      errors.push('No client data available');
      return errors;
    }

    // Check required fields - accept either totalMonthlyIncome or annualIncome
    const hasIncome = clientData.totalMonthlyIncome || 
                     clientData.calculatedFinancials?.totalMonthlyIncome || 
                     clientData.calculatedFinancials?.monthlyIncome ||
                     clientData.annualIncome;
    
    if (!hasIncome) {
      errors.push('Income data (monthly or annual) is required for AI analysis');
    }

    if (!clientData.totalMonthlyExpenses && !clientData.calculatedFinancials?.totalMonthlyExpenses) {
      errors.push('Monthly expenses are required for AI analysis');
    }

    // Validate debt structure if debts exist
    if (clientData.debtsAndLiabilities && Object.keys(clientData.debtsAndLiabilities).length > 0) {
      const hasValidDebt = Object.values(clientData.debtsAndLiabilities).some(debt => 
        debt && debt.hasLoan && debt.outstandingAmount > 0
      );
      if (!hasValidDebt) {
        errors.push('Invalid debt structure detected');
      }
    }

    return errors;
  }, []);

  /**
   * Generate AI recommendations with proper state management
   */
  const generateRecommendations = useCallback(async (clientData, financialMetrics = null, forceRefresh = false) => {
    // Prevent duplicate requests unless forced
    if (lockRef.current && !forceRefresh) {
      console.log('🔒 [AI Hook] Request blocked - another request in progress');
      return aiRecommendations;
    }

    // Validate inputs
    if (!clientId || !clientData) {
      console.error('❌ [AI Hook] Missing required data:', { clientId: !!clientId, clientData: !!clientData });
      setError('No client data available for AI analysis');
      return null;
    }

    // Validate client data
    const validationErrors = validateClientDataForAI(clientData);
    if (validationErrors.length > 0) {
      console.error('❌ [AI Hook] Validation failed:', validationErrors);
      setError(`Validation failed: ${validationErrors.join(', ')}`);
      return null;
    }

    // Set lock and loading state
    lockRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsFallback(false);

    // Generate unique request ID
    const currentRequestId = ++requestIdRef.current;
    
    try {
      console.log('🤖 [AI Hook] Starting AI recommendation generation:', {
        clientId,
        requestId: currentRequestId,
        forceRefresh,
        hasClientData: !!clientData,
        hasFinancialMetrics: !!financialMetrics,
        clientDataIncome: {
          totalMonthlyIncome: clientData.totalMonthlyIncome,
          annualIncome: clientData.annualIncome,
          calculatedMonthlyIncome: clientData.calculatedFinancials?.monthlyIncome,
          hasIncomeData: !!(clientData.totalMonthlyIncome || clientData.annualIncome)
        },
        clientDataExpenses: {
          totalMonthlyExpenses: clientData.totalMonthlyExpenses,
          hasExpenseData: !!clientData.totalMonthlyExpenses
        }
      });

      // Cancel previous request if still active
      if (activeRequestRef.current) {
        console.log('🚫 [AI Hook] Cancelling previous request');
        activeRequestRef.current = null;
      }

      // Create cancellable request
      const requestPromise = planAPI.analyzeDebt(clientId, clientData);
      activeRequestRef.current = requestPromise;

      const response = await requestPromise;

      // Check if this request is still the active one
      if (currentRequestId !== requestIdRef.current) {
        console.log('🚫 [AI Hook] Request outdated, ignoring result');
        return aiRecommendations;
      }

      // Clear active request
      activeRequestRef.current = null;

      // Enhanced response handling with better structure validation
      let aiRecommendationsData = null;
      
      console.log('🔍 [AI Hook] Processing AI response:', {
        requestId: currentRequestId,
        hasResponse: !!response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        hasSuccess: !!response?.success,
        hasAnalysis: !!response?.analysis,
        hasError: !!response?.error
      });

      if (response?.success && response?.analysis) {
        // Standard backend success response
        aiRecommendationsData = response.analysis;
        console.log('✅ [AI Hook] Extracted analysis from success response');
      } else if (response?.analysis) {
        // Response with analysis but no success flag
        aiRecommendationsData = response.analysis;
        console.log('✅ [AI Hook] Extracted analysis from direct response');
      } else if (response && typeof response === 'object' && !response.error) {
        // Direct analysis object
        aiRecommendationsData = response;
        console.log('✅ [AI Hook] Using direct response as analysis');
      } else if (response?.error) {
        // Backend returned an error
        throw new Error(response.error);
      } else {
        throw new Error('Invalid or empty AI response format');
      }

      // Validate that we have meaningful AI data
      if (!aiRecommendationsData || typeof aiRecommendationsData !== 'object') {
        throw new Error('AI response data is not valid');
      }

      // Enhanced validation of AI response structure
      const hasValidData = aiRecommendationsData.debtStrategy || 
                          aiRecommendationsData.financialMetrics || 
                          aiRecommendationsData.recommendations ||
                          aiRecommendationsData.generatedBy === 'fallback-parser';

      if (!hasValidData) {
        console.warn('⚠️ [AI Hook] AI response structure may be incomplete:', {
          availableKeys: Object.keys(aiRecommendationsData),
          hasDebtStrategy: !!aiRecommendationsData.debtStrategy,
          hasFinancialMetrics: !!aiRecommendationsData.financialMetrics,
          hasRecommendations: !!aiRecommendationsData.recommendations
        });
      }

      console.log('✅ [AI Hook] AI recommendations processed successfully:', {
        requestId: currentRequestId,
        analysisKeys: Object.keys(aiRecommendationsData),
        hasDebtStrategy: !!aiRecommendationsData.debtStrategy,
        hasFinancialMetrics: !!aiRecommendationsData.financialMetrics,
        hasRecommendations: !!aiRecommendationsData.recommendations,
        isFallbackParser: aiRecommendationsData.generatedBy === 'fallback-parser'
      });

      setAiRecommendations(aiRecommendationsData);
      setLastRequestTime(Date.now());
      setIsFallback(aiRecommendationsData.generatedBy === 'fallback-parser');
      
      return aiRecommendationsData;

    } catch (error) {
      // Check if this request is still the active one
      if (currentRequestId !== requestIdRef.current) {
        console.log('🚫 [AI Hook] Error from outdated request, ignoring');
        return aiRecommendations;
      }

      // Enhanced error classification and handling
      let errorMessage = error.message;
      let errorType = 'unknown';
      let shouldRetry = false;

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        errorType = 'backend_error';
      } else if (error.response?.data?.success === false) {
        errorMessage = error.response.data.error || 'AI service returned failure';
        errorType = 'api_failure';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed - API key may be invalid';
        errorType = 'auth_error';
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded - too many requests';
        errorType = 'rate_limit';
        shouldRetry = true;
      } else if (error.response?.status === 500) {
        errorMessage = 'AI service internal error';
        errorType = 'server_error';
        shouldRetry = true;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - AI service took too long to respond';
        errorType = 'timeout';
        shouldRetry = true;
      } else if (error.name === 'NetworkError' || !error.response) {
        errorMessage = 'Network error - unable to reach AI service';
        errorType = 'network_error';
        shouldRetry = true;
      }

      console.error('❌ [AI Hook] AI service failed:', {
        errorType,
        errorMessage,
        shouldRetry,
        status: error.response?.status,
        hasErrorResponse: !!error.response?.data?.error,
        requestId: currentRequestId
      });
      
      // Generate enhanced fallback recommendations
      console.log('🔄 [AI Hook] Generating enhanced fallback recommendations...');
      let fallbackRecommendations;
      
      try {
        fallbackRecommendations = generateFallbackRecommendations(financialMetrics);
        
        // Add error context to fallback
        fallbackRecommendations.aiServiceStatus = {
          available: false,
          errorType,
          lastError: errorMessage,
          timestamp: new Date().toISOString(),
          shouldRetry
        };
        
        console.log('✅ [AI Hook] Fallback recommendations generated successfully');
      } catch (fallbackError) {
        console.error('❌ [AI Hook] Fallback generation also failed:', fallbackError);
        
        // Ultimate fallback - minimal structure
        fallbackRecommendations = {
          debtStrategy: 'Unable to generate debt analysis due to service unavailability.',
          financialMetrics: {},
          recommendations: {
            immediateActions: ['Contact your financial advisor for personalized guidance'],
            mediumTermActions: ['Review your current financial position'],
            longTermActions: ['Develop a comprehensive financial plan']
          },
          warnings: ['AI analysis service is currently unavailable'],
          opportunities: [],
          generatedBy: 'minimal-fallback',
          aiServiceStatus: {
            available: false,
            errorType: 'service_unavailable',
            lastError: 'Complete service failure',
            timestamp: new Date().toISOString()
          }
        };
      }
      
      setAiRecommendations(fallbackRecommendations);
      setError(shouldRetry 
        ? `AI service temporarily unavailable (${errorType}). Retry in a few moments. Showing calculated recommendations.`
        : `AI service unavailable: ${errorMessage}. Showing calculated recommendations.`
      );
      setIsFallback(true);
      setLastRequestTime(Date.now());

      return fallbackRecommendations;

    } finally {
      lockRef.current = false;
      setIsLoading(false);
    }
  }, [clientId, aiRecommendations, validateClientDataForAI, generateFallbackRecommendations]);

  /**
   * Update recommendations with new data (typically from plan fetch)
   */
  const updateRecommendations = useCallback((newRecommendations) => {
    if (!lockRef.current) { // Only update if no active request
      console.log('📝 [AI Hook] Updating recommendations from external source');
      setAiRecommendations(newRecommendations);
      setIsFallback(false);
      setError(null);
    } else {
      console.log('🔒 [AI Hook] Skipping external update - active request in progress');
    }
  }, []);

  /**
   * Clear all AI recommendations
   */
  const clearRecommendations = useCallback(() => {
    console.log('🧹 [AI Hook] Clearing AI recommendations');
    setAiRecommendations(null);
    setError(null);
    setIsFallback(false);
    setLastRequestTime(null);
    
    // Cancel any active requests
    if (activeRequestRef.current) {
      activeRequestRef.current = null;
    }
    lockRef.current = false;
  }, []);

  /**
   * Check if recommendations are stale (older than 5 minutes)
   */
  const areRecommendationsStale = useCallback(() => {
    if (!lastRequestTime || !aiRecommendations) return true;
    return Date.now() - lastRequestTime > 5 * 60 * 1000; // 5 minutes
  }, [lastRequestTime, aiRecommendations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current = null;
      }
      lockRef.current = false;
    };
  }, []);

  return {
    aiRecommendations,
    isLoading,
    error,
    isFallback,
    lastRequestTime,
    generateRecommendations,
    updateRecommendations,
    clearRecommendations,
    areRecommendationsStale,
    isLocked: lockRef.current
  };
};

export default useAIRecommendations;