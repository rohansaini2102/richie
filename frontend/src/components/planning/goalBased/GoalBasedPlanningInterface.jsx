import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  Skeleton,
  Fade,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  Save, 
  ArrowBack, 
  ArrowForward,
  Description 
} from '@mui/icons-material';
import EditableClientDataGoal from './EditableClientDataGoal';
import GoalSelectionPanel from './GoalSelectionPanel';
import GoalPlanningInterface from './GoalPlanningInterface';
import ErrorBoundary from './ErrorBoundary';
import { clientAPI, planAPI } from '../../../services/api';
import { validateClientDataForGoalPlanning, calculateIntelligentGoalDefaults } from './utils/goalDataHelpers';

const GoalBasedPlanningInterface = ({ 
  clientId, 
  clientData: initialClientData, 
  onSavePlan, 
  onCancel 
}) => {
  // State management
  const [clientData, setClientData] = useState(initialClientData || null);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(!initialClientData && !!clientId); // Loading if we need to fetch data
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stepLoading, setStepLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [dataSource, setDataSource] = useState(initialClientData ? 'props' : 'api'); // Track data source

  // Steps configuration
  const steps = [
    'Review Client Data',
    'Select Goals',
    'AI-Powered Planning'
  ];

  console.log('🎯 [GoalBasedPlanningInterface] Component initialized:', {
    clientId,
    hasInitialData: !!initialClientData,
    initialClientDataType: typeof initialClientData,
    initialClientDataKeys: initialClientData ? Object.keys(initialClientData).slice(0, 10) : null,
    clientDataState: !!clientData,
    clientDataStateType: typeof clientData,
    currentStep,
    selectedGoalsCount: selectedGoals.length
  });

  // Memoized data loading function
  const loadClientData = useCallback(async () => {
    if (!clientId) {
      console.warn('⚠️ [GoalBasedPlanningInterface] No clientId provided for data loading');
      setError('Client ID is required to load data');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('📥 [GoalBasedPlanningInterface] Loading client data for:', clientId);
      
      const data = await clientAPI.getClientById(clientId);
      setClientData(data);
      setDataSource('api');
      
      console.log('✅ [GoalBasedPlanningInterface] Client data loaded successfully:', {
        clientName: `${data.firstName} ${data.lastName}`,
        hasFinancials: !!data.calculatedFinancials,
        hasGoals: !!data.enhancedFinancialGoals
      });
      
    } catch (err) {
      console.error('❌ [GoalBasedPlanningInterface] Error loading client data:', err);
      setError('Failed to load client data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Load client data if not provided via props
  useEffect(() => {
    const hasInitialData = !!initialClientData;
    const needsToLoadData = !hasInitialData && !!clientId && !clientData;
    
    console.log('🔄 [GoalBasedPlanningInterface] Data loading effect:', {
      hasInitialData,
      clientIdExists: !!clientId,
      clientDataExists: !!clientData,
      needsToLoadData,
      dataSource
    });
    
    if (needsToLoadData) {
      console.log('📥 [GoalBasedPlanningInterface] Triggering loadClientData()');
      loadClientData();
    }
  }, [clientId, loadClientData, initialClientData, clientData, dataSource]);

  // Reset to step 0 if we're on a later step but don't have client data
  useEffect(() => {
    console.log('🔄 [GoalBasedPlanningInterface] Step validation check:', {
      currentStep,
      hasClientData: !!clientData,
      shouldReset: currentStep > 0 && !clientData,
      stepName: steps[currentStep] || 'Unknown'
    });
    
    if (currentStep > 0 && !clientData) {
      console.log('🔄 [GoalBasedPlanningInterface] Resetting to step 0 - no client data available');
      setCurrentStep(0);
    }
  }, [currentStep, clientData]);

  // Handle initialClientData prop changes (only when prop actually changes)
  useEffect(() => {
    // Only update if we receive new initial data and don't already have data from API
    if (initialClientData && dataSource !== 'api') {
      console.log('📥 [GoalBasedPlanningInterface] Setting clientData from initialClientData prop:', {
        hasInitialData: !!initialClientData,
        currentDataSource: dataSource,
        clientName: initialClientData ? `${initialClientData.firstName} ${initialClientData.lastName}` : 'N/A'
      });
      
      setClientData(initialClientData);
      setDataSource('props');
      setLoading(false); // Stop loading since we have data from props
    }
  }, [initialClientData, dataSource]);

  // This function is now defined with useCallback above

  const handleClientDataUpdate = async (updatedData) => {
    try {
      console.log('📝 [GoalBasedPlanningInterface] Updating client data');
      
      // Update local state
      setClientData(updatedData);
      
      // Sync with backend
      await clientAPI.updateClient(clientId, updatedData);
      
      console.log('✅ [GoalBasedPlanningInterface] Client data updated successfully');
    } catch (err) {
      console.error('❌ [GoalBasedPlanningInterface] Error updating client data:', err);
      setError('Failed to update client data. Please try again.');
    }
  };

  const handleGoalToggle = (goal) => {
    setSelectedGoals(prevGoals => {
      // Use goal.id for existing goals, goal.type for new goals
      const goalId = goal.id || goal.type;
      const existingIndex = prevGoals.findIndex(g => 
        (g.id && g.id === goalId) || (g.type === goal.type && !g.id)
      );
      
      if (existingIndex >= 0) {
        // Remove goal
        const newGoals = prevGoals.filter((_, index) => index !== existingIndex);
        console.log('🎯 [GoalBasedPlanningInterface] Goal removed:', goal.type, goal.id);
        return newGoals;
      } else {
        // Add goal (existing goal from client data or new goal)
        const newGoal = goal.id ? goal : {
          type: goal.type,
          isSelected: true,
          data: getIntelligentGoalData(goal.type, clientData)
        };
        console.log('🎯 [GoalBasedPlanningInterface] Goal added:', goal.type, goal.id);
        return [...prevGoals, newGoal];
      }
    });
  };

  const handleNextStep = async () => {
    console.log('➡️ [GoalBasedPlanningInterface] Next step requested:', {
      currentStep,
      nextStep: currentStep + 1,
      maxSteps: steps.length - 1,
      canAdvance: currentStep < steps.length - 1,
      hasClientData: !!clientData,
      stepName: steps[currentStep + 1] || 'None'
    });
    
    setStepLoading(true);
    setValidationErrors([]);
    
    try {
      // Validate current step before advancing
      const isValid = await validateCurrentStep();
      
      if (!isValid) {
        setStepLoading(false);
        return;
      }
      
      if (currentStep < steps.length - 1) {
        // Add small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        setCurrentStep(currentStep + 1);
        console.log('➡️ [GoalBasedPlanningInterface] Moving to step:', currentStep + 1);
      }
    } catch (error) {
      console.error('Error advancing to next step:', error);
      setError('Failed to advance to next step. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  // Validate current step before advancing
  const validateCurrentStep = async () => {
    const errors = [];
    
    switch (currentStep) {
      case 0: // Review Client Data
        if (!clientData) {
          errors.push('Client data is required to proceed');
        }
        const validation = validateClientDataForGoalPlanning(clientData);
        if (!validation.canProceed) {
          errors.push('Client data quality is insufficient for reliable planning');
        }
        break;
        
      case 1: // Select Goals
        if (selectedGoals.length === 0) {
          errors.push('Please select at least one goal to proceed');
        }
        break;
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }
    
    return true;
  };

  const handlePrevStep = () => {
    console.log('⬅️ [GoalBasedPlanningInterface] Previous step requested:', {
      currentStep,
      prevStep: currentStep - 1,
      canGoBack: currentStep > 0,
      stepName: steps[currentStep - 1] || 'None'
    });
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      console.log('⬅️ [GoalBasedPlanningInterface] Moving to step:', currentStep - 1);
    }
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);
      setError('');
      
      console.log('💾 [GoalBasedPlanningInterface] Saving goal-based plan');
      
      const planData = {
        planType: 'goal_based',
        clientId,
        selectedGoals,
        clientDataSnapshot: clientData,
        createdAt: new Date().toISOString()
      };
      
      // Call parent save handler
      await onSavePlan(planData);
      
      console.log('✅ [GoalBasedPlanningInterface] Plan saved successfully');
    } catch (err) {
      console.error('❌ [GoalBasedPlanningInterface] Error saving plan:', err);
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  // Helper function to get intelligent goal data based on client profile
  const getIntelligentGoalData = (goalType, clientData) => {
    const intelligentDefaults = calculateIntelligentGoalDefaults(clientData);
    return intelligentDefaults[goalType] || {};
  };

  // Calculate age helper (duplicate from utils for immediate use)
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Enhanced loading state with skeleton
  if (loading) {
    return (
      <Box sx={{ maxWidth: 1800, mx: 'auto', p: 5, minHeight: '90vh' }}>
        {/* Header Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={400} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={600} height={24} />
        </Box>
        
        {/* Progress Stepper Skeleton */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {[1, 2, 3].map((step) => (
              <Box key={step} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={120} sx={{ ml: 1 }} />
                {step < 3 && <Box sx={{ flex: 1, mx: 2 }}><Skeleton variant="rectangular" height={2} /></Box>}
              </Box>
            ))}
          </Box>
        </Paper>
        
        {/* Content Skeleton */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#6b7280', mb: 1 }}>
              {dataSource === 'api' ? 'Loading client data from server...' : 'Preparing goal planning interface...'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Client ID: {clientId || 'N/A'}
            </Typography>
            <LinearProgress sx={{ width: 200, mt: 2 }} />
          </Box>
        </Paper>
      </Box>
    );
  }

  // Show error if no client data and no way to load it
  if (!clientData && !clientId) {
    return (
      <ErrorBoundary onGoBack={onCancel}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#dc2626', mb: 2 }}>
              ⚠️ Missing Client Information
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', mb: 3 }}>
              No client data was provided and no client ID is available to load data from the server.
            </Typography>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ borderColor: '#6b7280', color: '#6b7280' }}
            >
              Go Back
            </Button>
          </Paper>
        </Box>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('Goal-based planning error:', error, errorInfo);
        // Could send to error reporting service here
      }}
      onGoBack={onCancel}
    >
      <Box sx={{ maxWidth: 1800, mx: 'auto', p: 5, minHeight: '90vh' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
            Goal-Based Financial Planning
          </Typography>
          <Typography variant="body1" sx={{ color: '#6b7280' }}>
            Create a systematic plan to achieve your specific financial goals
          </Typography>
        </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 4, mb: 5 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Data Quality Panel */}
      {clientData && (() => {
        const validation = validateClientDataForGoalPlanning(clientData);
        return (
          <Paper sx={{ p: 3, mb: 4, bgcolor: validation.canProceed ? '#f0fdf4' : '#fef3c7', border: `1px solid ${validation.canProceed ? '#bbf7d0' : '#fcd34d'}` }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              📊 Data Quality Assessment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" display="block">Quality Score:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {validation.score}/100
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" display="block">Status:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: validation.canProceed ? '#16a34a' : '#f59e0b' }}>
                  {validation.canProceed ? '✅ Ready' : '⚠️ Needs Attention'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" display="block">Recommendation:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {validation.recommendation}
                </Typography>
              </Grid>
            </Grid>
            {validation.warnings.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" display="block">Warnings:</Typography>
                {validation.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2" sx={{ fontSize: '12px', color: '#f59e0b' }}>
                    • {warning}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        );
      })()}

      {/* Enhanced Error Display */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 4 }} 
            onClose={() => setError('')}
            variant="filled"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              ⚠️ Planning Error
            </Typography>
            {error}
          </Alert>
        </Fade>
      )}
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Fade in={validationErrors.length > 0}>
          <Alert 
            severity="warning" 
            sx={{ mb: 4 }}
            onClose={() => setValidationErrors([])}
            variant="outlined"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              📋 Please Address These Issues:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        </Fade>
      )}

      {/* Step Content with Loading States */}
      <Box sx={{ mb: 5, position: 'relative' }}>
        {/* Step Loading Overlay */}
        {stepLoading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Validating step...
              </Typography>
            </Box>
          </Box>
        )}
        
        <Fade in={!stepLoading}>
          <Box>
            {currentStep === 0 && (
              <>
                {/* Data Source Indicator */}
                {clientData && (
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      size="small"
                      label={`Data Source: ${dataSource === 'props' ? 'Passed from Parent' : 'Loaded from API'}`}
                      sx={{
                        bgcolor: dataSource === 'props' ? '#dcfce7' : '#dbeafe',
                        color: dataSource === 'props' ? '#166534' : '#1e40af',
                        fontSize: '11px'
                      }}
                    />
                    {dataSource === 'api' && (
                      <Button
                        size="small"
                        onClick={loadClientData}
                        sx={{ ml: 1, fontSize: '11px', minWidth: 'auto', px: 1 }}
                      >
                        Refresh Data
                      </Button>
                    )}
                  </Box>
                )}
                
                <EditableClientDataGoal
                  clientData={clientData}
                  onDataUpdate={handleClientDataUpdate}
                />
              </>
            )}

            {currentStep === 1 && (
              <GoalSelectionPanel
                selectedGoals={selectedGoals}
                onGoalToggle={handleGoalToggle}
                onContinue={(selectedGoalsData) => {
                  setSelectedGoals(selectedGoalsData);
                  handleNextStep();
                }}
                clientData={clientData}
              />
            )}

            {currentStep === 2 && selectedGoals.length > 0 && (
              <GoalPlanningInterface
                selectedGoals={selectedGoals}
                clientData={clientData}
                onBack={handlePrevStep}
                onSave={(planData) => {
                  console.log('Plan data received:', planData);
                  if (onSavePlan) {
                    onSavePlan(planData);
                  }
                }}
              />
            )}

            {currentStep === 2 && selectedGoals.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2 }}>
                  ⚠️ No Goals Selected
                </Typography>
                <Typography variant="body1" sx={{ color: '#6b7280', mb: 3 }}>
                  Please go back to the goal selection step and choose at least one financial goal to create your personalized plan.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentStep(1)}
                  sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                >
                  Go Back to Goal Selection
                </Button>
              </Paper>
            )}
          </Box>
        </Fade>
      </Box>

      {/* Navigation Buttons - Only show for steps 0 and 1, step 2 handles its own navigation */}
      {currentStep < 2 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
          <Box>
            {currentStep === 0 && (
              <Button
                variant="outlined"
                onClick={onCancel}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
            )}
            
            {currentStep > 0 && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handlePrevStep}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>
            )}
          </Box>

          <Box>
            {currentStep === 0 && (
              <Button
                variant="contained"
                endIcon={stepLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
                onClick={handleNextStep}
                disabled={stepLoading || !clientData}
                sx={{ 
                  bgcolor: '#2563eb',
                  '&:disabled': {
                    bgcolor: '#94a3b8',
                    color: 'white'
                  }
                }}
              >
                {stepLoading ? 'Validating...' : 'Next'}
              </Button>
            )}
            {/* Step 1 navigation is handled by GoalSelectionPanel */}
          </Box>
        </Box>
      )}
      </Box>
    </ErrorBoundary>
  );
};

export default GoalBasedPlanningInterface;