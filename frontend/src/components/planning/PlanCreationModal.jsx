import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrackChanges,
  Merge,
  Description,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { planAPI } from '../../services/api';
import ClientDataPreview from './cashflow/ClientDataPreview';
import CashFlowPlanningInterface from './cashflow/CashFlowPlanningInterface';
import AISuggestionsPanel from './cashflow/AISuggestionsPanel';

const PlanCreationModal = ({ open, onClose, clientId, clientName, clientData, onPlanCreated }) => {
  const [selectedPlanType, setSelectedPlanType] = useState('cash_flow');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [planCreated, setPlanCreated] = useState(false);

  // Log props when modal opens
  useEffect(() => {
    if (open) {
      console.group('📊 [PlanCreationModal] Modal Opened with Props');
      console.log('🔍 Props Analysis:', {
        open,
        clientId,
        clientName,
        hasClientData: !!clientData,
        clientDataType: typeof clientData,
        clientDataSize: clientData ? JSON.stringify(clientData).length : 0,
        timestamp: new Date().toISOString()
      });
      
      if (clientData) {
        console.log('👤 Received Client Data Structure:', {
          firstName: clientData?.firstName,
          lastName: clientData?.lastName,
          email: clientData?.email,
          hasPersonalInfo: !!(clientData?.firstName && clientData?.lastName),
          hasFinancialInfo: !!(clientData?.totalMonthlyIncome || clientData?.totalMonthlyExpenses),
          hasAssets: !!clientData?.assets,
          hasDebts: !!clientData?.debtsAndLiabilities,
          topLevelKeys: Object.keys(clientData).slice(0, 15)
        });
      } else {
        console.warn('⚠️ No clientData received in PlanCreationModal props!');
      }
      console.groupEnd();
    }
  }, [open, clientId, clientName, clientData]);

  // For testing: Allow plan creation regardless of client data
  const hasRequiredData = true; // Temporarily disabled validation
  
  const steps = ['Select Plan Type', 'Review Client Data', 'Cash Flow Planning'];

  const planTypes = [
    {
      value: 'cash_flow',
      title: 'Cash Flow Planning',
      icon: <TrendingUp />,
      description: 'Optimize monthly cash flow, manage debts, and build systematic savings',
      features: ['Debt prioritization', 'Emergency fund planning', 'Monthly investment strategy']
    },
    {
      value: 'goal_based',
      title: 'Goal Based Planning',
      icon: <TrackChanges />,
      description: 'Plan for specific financial goals like retirement, education, or home purchase',
      features: ['Goal tracking', 'Target amount calculation', 'Timeline planning'],
      disabled: true
    },
    {
      value: 'hybrid',
      title: 'Hybrid Planning',
      icon: <Merge />,
      description: 'Combine cash flow optimization with goal-based planning',
      features: ['Comprehensive planning', 'Multi-goal tracking', 'Holistic approach'],
      disabled: true
    }
  ];

  const handleNext = () => {
    if (activeStep === 0 && selectedPlanType) {
      console.log('➡️ [PlanCreationModal] Step transition 0→1 (Plan Type → Client Data Review)', {
        selectedPlanType,
        hasClientData: !!clientData,
        timestamp: new Date().toISOString()
      });
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handlePlanSaved = (plan) => {
    console.log('🎉 [PlanCreationModal] Plan saved successfully:', plan);
    setPlanCreated(true);
    if (onPlanCreated) {
      onPlanCreated(plan);
    }
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedPlanType('cash_flow');
    setPlanCreated(false);
    setError('');
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderPlanTypeSelection();
      case 1:
        console.group('📋 [PlanCreationModal] Rendering ClientDataPreview');
        console.log('🔄 Passing Props to ClientDataPreview:', {
          clientId,
          hasClientData: !!clientData,
          clientDataKeys: clientData ? Object.keys(clientData).slice(0, 10) : [],
          clientName: clientData ? `${clientData.firstName} ${clientData.lastName}` : 'Unknown',
          timestamp: new Date().toISOString()
        });
        
        if (!clientData) {
          console.error('❌ CRITICAL: No clientData to pass to ClientDataPreview!');
        }
        console.groupEnd();
        
        return (
          <ClientDataPreview
            clientId={clientId}
            clientData={clientData}
            onProceed={(reviewedData) => {
              console.log('📊 [PlanCreationModal] Client data reviewed:', {
                hasData: !!reviewedData,
                clientName: reviewedData?.firstName + ' ' + reviewedData?.lastName,
                reviewedDataSize: reviewedData ? JSON.stringify(reviewedData).length : 0
              });
              setActiveStep(2);
            }}
            onCancel={handleBack}
          />
        );
      case 2:
        return (
          <CashFlowPlanningInterface
            clientId={clientId}
            clientData={clientData}
            onSavePlan={handlePlanSaved}
            onCancel={handleBack}
          />
        );
      default:
        return null;
    }
  };

  const renderPlanTypeSelection = () => (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the type of financial planning strategy you want to create for this client.
      </Typography>

      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={selectedPlanType}
          onChange={(e) => setSelectedPlanType(e.target.value)}
        >
          {planTypes.map((plan) => (
            <Box
              key={plan.value}
              sx={{
                border: 1,
                borderColor: selectedPlanType === plan.value ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 2,
                mb: 2,
                opacity: plan.disabled ? 0.6 : 1,
                cursor: plan.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: plan.disabled ? 'divider' : 'primary.main',
                  backgroundColor: plan.disabled ? 'transparent' : 'action.hover'
                }
              }}
            >
              <FormControlLabel
                value={plan.value}
                control={<Radio />}
                disabled={plan.disabled}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {plan.icon}
                      <Typography variant="h6">{plan.title}</Typography>
                      {plan.disabled && (
                        <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                          (Coming Soon)
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {plan.description}
                    </Typography>
                    <Box>
                      {plan.features.map((feature, idx) => (
                        <Typography key={idx} variant="caption" display="block" sx={{ ml: 2 }}>
                          • {feature}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                }
              />
            </Box>
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );


  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={activeStep === 2 ? "xl" : "md"} 
      fullWidth
      PaperProps={{
        sx: {
          height: activeStep === 2 ? '90vh' : 'auto',
          maxHeight: activeStep === 2 ? '90vh' : '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Description color="primary" />
          <Typography variant="h6">Create Financial Plan for {clientName}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: activeStep === 2 ? 0 : 3 }}>
        {activeStep < 2 && (
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        
        {renderStepContent()}
      </DialogContent>

      {activeStep < 2 && (
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedPlanType}
              endIcon={<ArrowForward />}
            >
              Continue
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PlanCreationModal;