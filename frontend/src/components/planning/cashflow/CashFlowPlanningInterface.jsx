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
      // If client data is provided, trigger initial AI analysis
      requestAISuggestions(clientData);
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const response = await clientAPI.getClientById(clientId);
      const data = response.data.data || response.data || response;
      setClientData(data);
      // Trigger initial AI analysis
      requestAISuggestions(data);
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
      
      // Trigger AI analysis with updated data
      requestAISuggestions(updatedData);
    } catch (err) {
      console.error('Error updating client data:', err);
      setError('Failed to update client data');
    }
  };

  const requestAISuggestions = async (data) => {
    if (!data) return;
    
    setLoadingAI(true);
    try {
      const response = await planAPI.analyzeDebt(clientId, { clientData: data });
      setAiSuggestions(response.data);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      setAiSuggestions({ error: 'Failed to load AI suggestions' });
    } finally {
      setLoadingAI(false);
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