import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import ClientDataPreview from '../cashflow/ClientDataPreview';
import { clientAPI } from '../../../services/api';

const HybridPlanningInterface = ({ 
  clientId, 
  clientData: initialClientData, 
  onCancel 
}) => {
  const [clientData, setClientData] = useState(initialClientData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔄 [HybridPlanningInterface] Initialized with:', {
    clientId,
    hasClientData: !!initialClientData,
    clientName: initialClientData ? `${initialClientData.firstName} ${initialClientData.lastName}` : 'Unknown'
  });


  // Load client data if not provided
  useEffect(() => {
    if (!clientData && clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📥 [HybridPlanningInterface] Loading client data for:', clientId);
      
      const data = await clientAPI.getClientById(clientId);
      setClientData(data);
      
      console.log('✅ [HybridPlanningInterface] Client data loaded successfully:', {
        clientName: `${data.firstName} ${data.lastName}`,
        hasFinancials: !!data.calculatedFinancials,
        expenseBreakdown: data.expenseBreakdown,
        expenseBreakdownDetails: data.expenseBreakdown?.details,
        totalMonthlyExpenses: data.totalMonthlyExpenses,
        calculatedFinancials: data.calculatedFinancials
      });
      
    } catch (err) {
      console.error('❌ [HybridPlanningInterface] Error loading client data:', err);
      setError('Failed to load client data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Since there's only one step now, always cancel
    onCancel();
  };

  const renderStepContent = () => {
    // Only show client data review - comprehensive planning removed
    return (
      <Box>
        <ClientDataPreview
          clientId={clientId}
          clientData={clientData}
          onProceed={(reviewedData) => {
            console.log('📊 [HybridPlanningInterface] Client data reviewed');
            // No next step - comprehensive planning removed
          }}
          onCancel={handleBack}
        />
        
        {/* Development Section */}
        <Box sx={{ 
          mt: 4, 
          p: 4, 
          bgcolor: '#f8fafc', 
          border: '2px dashed #e2e8f0',
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ fontSize: '48px', mb: 2 }}>🚧</Box>
            <Box sx={{ fontSize: '32px', fontWeight: 600, color: '#64748b', mb: 2 }}>
              Hybrid Planning Interface
            </Box>
            <Box sx={{ fontSize: '24px', fontWeight: 500, color: '#f59e0b', mb: 3 }}>
              Under Development
            </Box>
          </Box>
          
          <Box sx={{ 
            maxWidth: 600, 
            mx: 'auto', 
            color: '#64748b', 
            fontSize: '16px', 
            lineHeight: 1.6,
            mb: 4
          }}>
            The comprehensive hybrid planning interface with AI-powered recommendations, 
            goal-based planning, cash flow optimization, debt management, insurance analysis, 
            investment strategies, and tax planning is currently being developed.
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            flexWrap: 'wrap',
            '& .development-chip': {
              px: 3,
              py: 1,
              bgcolor: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '24px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 500
            }
          }}>
            <Box className="development-chip">🧠 AI Recommendations</Box>
            <Box className="development-chip">🎯 Goal Planning</Box>
            <Box className="development-chip">💰 Cash Flow Optimization</Box>
            <Box className="development-chip">📊 Financial Analysis</Box>
            <Box className="development-chip">🛡️ Insurance Planning</Box>
            <Box className="development-chip">📈 Investment Strategy</Box>
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading client data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content - Only Client Data Review */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderStepContent()}
      </Box>
    </Box>
  );
};

export default HybridPlanningInterface;