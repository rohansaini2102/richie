import React, { useState } from 'react';
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

const PlanCreationModal = ({ open, onClose, clientId, clientName, clientData, onPlanCreated }) => {
  const [selectedPlanType, setSelectedPlanType] = useState('cash_flow');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [reviewedClientData, setReviewedClientData] = useState(null);

  // For testing: Allow plan creation regardless of client data
  const hasRequiredData = true; // Temporarily disabled validation
  
  const steps = ['Select Plan Type', 'Review Client Data', 'Create Plan'];

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
      setActiveStep(1);
    } else if (activeStep === 1 && reviewedClientData) {
      handleCreatePlan();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setError('');
    setActiveStep(2);

    try {
      const response = await planAPI.createPlan({
        clientId,
        planType: selectedPlanType
      });

      if (response.success) {
        onPlanCreated(response.plan);
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create plan');
      setActiveStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedPlanType('cash_flow');
    setReviewedClientData(null);
    setError('');
    onClose();
  };

  const handleDataReviewed = (data) => {
    setReviewedClientData(data);
    handleNext();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderPlanTypeSelection();
      case 1:
        return (
          <ClientDataPreview
            clientId={clientId}
            onProceed={handleDataReviewed}
            onCancel={handleBack}
          />
        );
      case 2:
        return renderPlanCreation();
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

  const renderPlanCreation = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <CircularProgress size={48} sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Creating Financial Plan
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we create the {selectedPlanType.replace('_', ' ')} plan for {clientName}...
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Description color="primary" />
          <Typography variant="h6">Create Financial Plan for {clientName}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
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

      <DialogActions>
        {activeStep < 2 && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button 
                onClick={handleBack} 
                disabled={loading}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
            )}
            {activeStep === 0 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedPlanType}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PlanCreationModal;