import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Save, Description } from '@mui/icons-material';
import EditableClientData from './EditableClientData';
import DebtManagementSection from './DebtManagementSection';
import AdvisorRecommendationsForm from './AdvisorRecommendationsForm';
import AISuggestionsPanel from './AISuggestionsPanel';
import { clientAPI, planAPI } from '../../../services/api';

const CashFlowPlanningInterface = ({ 
  clientId, 
  clientData: initialClientData, 
  onSavePlan, 
  onCancel 
}) => {
  const [clientData, setClientData] = useState(initialClientData || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Load client data if not provided
  useEffect(() => {
    if (!clientData && clientId) {
      loadClientData();
    } else if (clientData) {
      // PRIORITY 1: Check localStorage first - NEVER call API if data exists
      const cacheKey = `cashflow_analysis_${clientId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          console.log('✅ [CashFlowPlanningInterface] Using localStorage cached analysis - NO API CALL');
          setAiSuggestions(parsed.suggestions);
          return; // IMPORTANT: Never proceed to API if cached data exists
        } catch (e) {
          console.warn('⚠️ [CashFlowPlanningInterface] Invalid cached data, clearing cache');
          localStorage.removeItem(cacheKey);
        }
      }
      
      console.log('⚠️ [CashFlowPlanningInterface] No localStorage cache found - proceeding with API call');
      requestAISuggestions(clientData);
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientData = await clientAPI.getClientById(clientId);
      setClientData(clientData);
      
      // Check localStorage before making API call
      const cacheKey = `cashflow_analysis_${clientId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          console.log('✅ [CashFlowPlanningInterface] Using cached AI suggestions from loadClientData');
          setAiSuggestions(parsed.suggestions);
          return; // Don't make API call if cached data exists
        } catch (e) {
          console.warn('⚠️ [CashFlowPlanningInterface] Invalid cached data in loadClientData');
          localStorage.removeItem(cacheKey);
        }
      }
      
      // Only call API if no cached data
      requestAISuggestions(clientData);
    } catch (err) {
      console.error('Error loading client data:', err);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleClientDataUpdate = async (updatedData) => {
    try {
      // Update local state
      setClientData(updatedData);
      
      // Sync with backend
      await clientAPI.updateClient(clientId, updatedData);
      
      // Clear cached data since client data changed, then make new API call
      const cacheKey = `cashflow_analysis_${clientId}`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ [CashFlowPlanningInterface] Cleared cache due to client data update');
      
      // Only trigger AI analysis if really needed
      requestAISuggestions(updatedData);
    } catch (err) {
      console.error('Error updating client data:', err);
      setError('Failed to update client data');
    }
  };

  const requestAISuggestions = async (data) => {
    if (!data) {
      console.log('🚫 [CashFlowPlanningInterface] No data provided for AI suggestions');
      return;
    }
    
    console.log('🚀 [CashFlowPlanningInterface] Starting AI suggestion request for client:', clientId);
    console.log('📋 [CashFlowPlanningInterface] ClientData structure:', {
      hasCalculatedFinancials: !!data.calculatedFinancials,
      calculatedFinancials: data.calculatedFinancials,
      hasDirectIncome: !!data.totalMonthlyIncome,
      directIncome: data.totalMonthlyIncome,
      hasDirectExpenses: !!data.totalMonthlyExpenses,
      directExpenses: data.totalMonthlyExpenses,
      hasDebts: !!data.debtsAndLiabilities,
      dataSize: JSON.stringify(data).length + ' chars',
      clientName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      mainKeys: Object.keys(data)
    });
    
    setLoadingAI(true);
    const startTime = Date.now();
    
    try {
      console.log('📤 [CashFlowPlanningInterface] Calling planAPI.analyzeDebt with clientId:', clientId);
      const response = await planAPI.analyzeDebt(clientId, data);
      const responseTime = Date.now() - startTime;
      
      console.log('📥 [CashFlowPlanningInterface] AI API response received:', {
        responseTime: responseTime + 'ms',
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : [],
        hasSuccess: response?.success,
        hasAnalysis: !!response?.analysis,
        hasError: !!response?.error,
        analysisKeys: response?.analysis ? Object.keys(response.analysis) : [],
        responseSize: response ? JSON.stringify(response).length + ' chars' : 0
      });
      
      if (response?.success && response?.analysis) {
        console.log('✅ [CashFlowPlanningInterface] AI analysis received successfully:', {
          hasDebtStrategy: !!response.analysis.debtStrategy,
          hasFinancialMetrics: !!response.analysis.financialMetrics,
          hasRecommendations: !!response.analysis.recommendations,
          debtCount: response.analysis.debtStrategy?.prioritizedDebts?.length || 0
        });
      } else if (response?.error) {
        console.log('⚠️ [CashFlowPlanningInterface] AI response contains error:', response.error);
      } else {
        console.log('⚠️ [CashFlowPlanningInterface] Unexpected response structure:', response);
      }
      
      setAiSuggestions(response);
      
      // Save successful response to localStorage for future use
      if (response?.success && response?.analysis) {
        const cacheKey = `cashflow_analysis_${clientId}`;
        const cacheData = {
          suggestions: response,
          timestamp: Date.now(),
          clientId: clientId
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('💾 [CashFlowPlanningInterface] AI suggestions saved to localStorage');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ [CashFlowPlanningInterface] Failed to get AI suggestions:', {
        error: error.message,
        responseTime: responseTime + 'ms',
        errorType: error.constructor.name,
        stack: error.stack?.split('\n').slice(0, 3),
        requestData: {
          clientId,
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : []
        }
      });
      setAiSuggestions({ error: 'Failed to load AI suggestions: ' + error.message });
    } finally {
      setLoadingAI(false);
      console.log('🏁 [CashFlowPlanningInterface] AI suggestion request completed');
    }
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);
      const planData = {
        clientId,
        planType: 'cash_flow',
        clientDataSnapshot: clientData,
        // Add plan-specific data here if needed
      };
      
      const response = await planAPI.createPlan(planData);
      if (response.success && onSavePlan) {
        onSavePlan(response.plan);
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="400px"
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading client data...
        </Typography>
      </Box>
    );
  }

  if (!clientData) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load client data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 400px', 
      gap: 3,
      maxWidth: '1400px',
      margin: '0 auto',
      padding: 3,
      '@media (max-width: 1024px)': {
        gridTemplateColumns: '1fr',
        gap: 2,
        padding: 2
      }
    }}>
      {/* Left Column - Advisor Section */}
      <Box sx={{ minHeight: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Cash Flow Planning
        </Typography>

        {/* Editable Client Data */}
        <EditableClientData
          clientData={clientData}
          onDataUpdate={handleClientDataUpdate}
        />

        {/* Debt Management Section */}
        <DebtManagementSection
          clientData={clientData}
          onDataUpdate={handleClientDataUpdate}
          aiSuggestions={aiSuggestions}
        />

        {/* Advisor Recommendations Form */}
        <AdvisorRecommendationsForm
          clientData={clientData}
          onDataUpdate={handleClientDataUpdate}
        />

        {/* Action Buttons */}
        <Box sx={{ 
          mt: 4, 
          pt: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          justifyContent: 'center'
        }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={saving}
            sx={{ minWidth: 120 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSavePlan}
            disabled={saving}
            sx={{ 
              minWidth: 150,
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' }
            }}
          >
            {saving ? 'Saving Plan...' : 'Save Plan'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Description />}
            disabled={saving}
            sx={{ minWidth: 150 }}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Right Column - AI Recommendations */}
      <Box sx={{ 
        bgcolor: '#f8fafc',
        borderRadius: 2,
        p: 3,
        border: '1px solid #e2e8f0',
        position: 'sticky',
        top: 24,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        '@media (max-width: 1024px)': {
          position: 'static',
          maxHeight: 'none'
        }
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 600,
            mb: 2
          }}
        >
          🤖 AI Recommendations
          {loadingAI && <CircularProgress size={16} />}
        </Typography>
        
        <AISuggestionsPanel 
          suggestions={aiSuggestions}
          loading={loadingAI}
          clientData={clientData}
        />
      </Box>
    </Box>
  );
};

export default CashFlowPlanningInterface;