import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Divider,
  Snackbar
} from '@mui/material';
import { 
  Save, 
  Description, 
  PictureAsPdf,
  Download,
  CloudUpload,
  ArrowBack
} from '@mui/icons-material';
import EditableClientData from './EditableClientData';
import DebtManagementSection from './DebtManagementSection';
import AdvisorRecommendationsForm from './AdvisorRecommendationsForm';
import AISuggestionsPanel from './AISuggestionsPanel';
import CashFlowPDFGeneratorComponent from './CashFlowPDFGenerator';
import { generateCashFlowPDF } from './CashFlowPDFDocument';
import { clientAPI, planAPI } from '../../../services/api';
import { 
  transformDebtsForPDF, 
  buildEmergencyFundStrategy, 
  buildInvestmentRecommendations,
  transformAIRecommendations 
} from './utils/debtTransform';

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
  
  // New state for save and PDF functionality
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
        planDetails: {
          cashFlowPlan: {},
          aiRecommendations: aiSuggestions
        }
      };
      
      const response = await planAPI.createPlan(planData);
      if (response.success) {
        const newPlanId = response.plan._id;
        setSavedPlanId(newPlanId);
        setIsPlanSaved(true);
        setSuccessMessage('Cash flow plan saved successfully!');
        setShowSuccess(true);
        
        // AUTO-GENERATE AND STORE PDF AFTER PLAN SAVE
        try {
          await generateAndSavePDF(newPlanId);
        } catch (pdfError) {
          console.error('Error generating PDF after plan save:', pdfError);
        }
        
        if (onSavePlan) {
          onSavePlan(response.plan);
        }
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  // Get advisor data helper function
  const getAdvisorData = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user ? {
        firstName: user.firstName,
        lastName: user.lastName,
        firmName: user.firmName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        sebiRegNumber: user.sebiRegNumber
      } : null;
    } catch (error) {
      console.error('Error getting advisor data:', error);
      return null;
    }
  };

  // Build complete plan data for PDF generation
  const buildPlanDataForPDF = () => {
    // Transform debt data
    const debtManagement = transformDebtsForPDF(clientData?.debtsAndLiabilities);
    
    // Build emergency fund strategy
    const emergencyFundStrategy = buildEmergencyFundStrategy(clientData);
    
    // Build investment recommendations
    const investmentRecommendations = buildInvestmentRecommendations(clientData, debtManagement);
    
    // Transform AI recommendations
    const transformedAIRecommendations = transformAIRecommendations(aiSuggestions);
    
    return {
      debtManagement,
      emergencyFundStrategy,
      investmentRecommendations,
      cashFlowPlan: {
        monthlyIncome: clientData?.totalMonthlyIncome || 0,
        monthlyExpenses: clientData?.totalMonthlyExpenses || 0,
        monthlySurplus: (clientData?.totalMonthlyIncome || 0) - (clientData?.totalMonthlyExpenses || 0)
      }
    };
  };

  // PDF Generation Functions
  const generateAndPreviewPDF = async () => {
    try {
      setPdfGenerating(true);
      
      // Build complete plan data
      const planData = buildPlanDataForPDF();
      
      // Use new React PDF implementation
      const data = {
        clientData: clientData,
        planData: planData,
        metrics: {
          totalAssets: clientData?.totalAssets || 0,
          totalLiabilities: planData.debtManagement.totalDebt || 0,
          netWorth: (clientData?.totalAssets || 0) - (planData.debtManagement.totalDebt || 0),
          savingsRate: clientData?.totalMonthlyIncome > 0 
            ? (((clientData?.totalMonthlyIncome - clientData?.totalMonthlyExpenses) / clientData?.totalMonthlyIncome) * 100).toFixed(1)
            : 0
        },
        aiRecommendations: transformAIRecommendations(aiSuggestions),
        cacheInfo: { planType: 'cash_flow' },
        advisorData: getAdvisorData()
      };

      const pdfBlob = await generateCashFlowPDF(data);
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      setError('Failed to generate PDF preview');
    } finally {
      setPdfGenerating(false);
    }
  };

  const generateAndDownloadPDF = async () => {
    try {
      setPdfGenerating(true);
      
      // Build complete plan data
      const planData = buildPlanDataForPDF();
      
      // Use new React PDF implementation
      const data = {
        clientData: clientData,
        planData: planData,
        metrics: {
          totalAssets: clientData?.totalAssets || 0,
          totalLiabilities: planData.debtManagement.totalDebt || 0,
          netWorth: (clientData?.totalAssets || 0) - (planData.debtManagement.totalDebt || 0),
          savingsRate: clientData?.totalMonthlyIncome > 0 
            ? (((clientData?.totalMonthlyIncome - clientData?.totalMonthlyExpenses) / clientData?.totalMonthlyIncome) * 100).toFixed(1)
            : 0
        },
        aiRecommendations: transformAIRecommendations(aiSuggestions),
        cacheInfo: { planType: 'cash_flow' },
        advisorData: getAdvisorData()
      };

      const pdfBlob = await generateCashFlowPDF(data);
      const fileName = `Cash_Flow_Analysis_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF download:', error);
      setError('Failed to download PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const generateAndSavePDF = async (planIdToUse = savedPlanId) => {
    if (!planIdToUse) {
      setError('Please save the plan first before storing PDF');
      return;
    }

    try {
      setPdfGenerating(true);
      
      // Build complete plan data
      const planData = buildPlanDataForPDF();
      
      // Use new React PDF implementation
      const data = {
        clientData: clientData,
        planData: planData,
        metrics: {
          totalAssets: clientData?.totalAssets || 0,
          totalLiabilities: planData.debtManagement.totalDebt || 0,
          netWorth: (clientData?.totalAssets || 0) - (planData.debtManagement.totalDebt || 0),
          savingsRate: clientData?.totalMonthlyIncome > 0 
            ? (((clientData?.totalMonthlyIncome - clientData?.totalMonthlyExpenses) / clientData?.totalMonthlyIncome) * 100).toFixed(1)
            : 0
        },
        aiRecommendations: transformAIRecommendations(aiSuggestions),
        cacheInfo: { planType: 'cash_flow' },
        advisorData: getAdvisorData()
      };

      const pdfBlob = await generateCashFlowPDF(data);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(pdfBlob);
      const base64Data = await base64Promise;

      const fileName = `Cash_Flow_Analysis_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await planAPI.storePDFReport(planIdToUse, {
        reportType: 'cash_flow',
        pdfData: base64Data,
        fileName: fileName,
        contentSummary: {
          monthlyIncome: clientData?.totalMonthlyIncome || 0,
          monthlyExpenses: clientData?.totalMonthlyExpenses || 0,
          hasAIRecommendations: !!aiSuggestions
        }
      });
      
      // Open PDF after saving
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      
      setSuccessMessage('PDF report saved to database and opened for viewing!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving PDF to database:', error);
      setError('Failed to save PDF to database');
    } finally {
      setPdfGenerating(false);
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
    <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onCancel}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Cash Flow Planning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {clientData?.firstName} {clientData?.lastName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              onClick={handleSavePlan}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button 
              variant="outlined" 
              startIcon={<PictureAsPdf />} 
              onClick={generateAndPreviewPDF}
              disabled={pdfGenerating}
            >
              Preview
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Download />} 
              onClick={generateAndDownloadPDF}
              disabled={pdfGenerating}
            >
              Download
            </Button>
            {savedPlanId && (
              <Button 
                variant="contained" 
                startIcon={<CloudUpload />} 
                onClick={() => generateAndSavePDF()}
                disabled={pdfGenerating}
              >
                Save to DB
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: 3,
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
    </Box>
  );
};

export default CashFlowPlanningInterface;