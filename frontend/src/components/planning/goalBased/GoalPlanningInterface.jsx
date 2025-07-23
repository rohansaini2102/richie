import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import GoalAnalysisPanel from './GoalAnalysisPanel';
import EditableGoalItem from './EditableGoalItem';
import { 
  calculateRequiredSIP, 
  getAssetAllocation,
  detectTimelineConflicts,
  optimizeMultipleGoals
} from './utils/goalCalculations';
import { planAPI } from '../../../services/api';

const GoalPlanningInterface = ({ 
  selectedGoals, 
  clientData, 
  onBack, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [editedGoals, setEditedGoals] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Initialize edited goals from selected goals
  useEffect(() => {
    if (selectedGoals && selectedGoals.length > 0) {
      const goalsWithCalculations = selectedGoals.map(goal => {
        const currentYear = new Date().getFullYear();
        const years = (goal.targetYear || currentYear + 5) - currentYear;
        const allocation = getAssetAllocation(years, clientData.riskTolerance);
        const requiredSIP = calculateRequiredSIP(
          goal.targetAmount || 0, 
          years, 
          allocation.expectedReturn
        );

        return {
          ...goal,
          id: goal.id || `goal-${Date.now()}-${Math.random()}`,
          timeInYears: years,
          monthlySIP: requiredSIP,
          assetAllocation: allocation,
          status: 'active'
        };
      });
      setEditedGoals(goalsWithCalculations);
      
      // Fetch AI recommendations on mount
      fetchAIRecommendations(goalsWithCalculations);
    }
  }, [selectedGoals, clientData]);

  // Fetch AI recommendations
  const fetchAIRecommendations = async (goals = editedGoals) => {
    setAnalysisLoading(true);
    setError(null);
    
    try {
      console.log('🎯 [GoalPlanningInterface] Starting AI analysis request:', {
        goalsCount: goals?.length || 0,
        goalTypes: goals?.map(g => g.title || g.type) || [],
        hasClientData: !!clientData,
        clientId: clientData?._id || clientData?.id || 'unknown'
      });

      const response = await planAPI.analyzeGoals(goals, clientData);

      console.log('📊 [GoalPlanningInterface] AI analysis response received:', {
        success: response?.success,
        hasRecommendations: !!response?.recommendations,
        recommendationsType: typeof response?.recommendations,
        hasError: !!response?.error
      });

      if (response.success && response.recommendations) {
        // Parse the AI response if it's a string
        let aiRecommendations = response.recommendations;
        if (typeof aiRecommendations === 'string') {
          try {
            aiRecommendations = JSON.parse(aiRecommendations);
          } catch (e) {
            console.error('Failed to parse AI recommendations:', e);
          }
        }
        setRecommendations(aiRecommendations);
      } else {
        setError('Failed to generate recommendations');
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setError(err.response?.data?.message || 'Failed to fetch AI recommendations');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Handle goal updates
  const handleGoalUpdate = (goalId, updates) => {
    setEditedGoals(prev => {
      const updated = prev.map(goal => {
        if (goal.id === goalId) {
          const updatedGoal = { ...goal, ...updates };
          
          // Recalculate SIP if amount or timeline changed
          if (updates.targetAmount || updates.targetYear) {
            const currentYear = new Date().getFullYear();
            const years = (updatedGoal.targetYear || currentYear + 5) - currentYear;
            const allocation = getAssetAllocation(years, clientData.riskTolerance);
            updatedGoal.timeInYears = years;
            updatedGoal.assetAllocation = allocation;
            updatedGoal.monthlySIP = calculateRequiredSIP(
              updatedGoal.targetAmount || 0,
              years,
              allocation.expectedReturn
            );
          }
          
          return updatedGoal;
        }
        return goal;
      });
      
      return updated;
    });
  };

  // Handle removing a goal
  const handleRemoveGoal = (goalId) => {
    setEditedGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  // Refresh AI recommendations
  const handleRefreshRecommendations = () => {
    fetchAIRecommendations();
  };

  // Save the plan
  const handleSavePlan = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const planData = {
        clientId: clientData._id,
        planType: 'goal-based',
        goals: editedGoals,
        recommendations: recommendations,
        status: 'draft'
      };

      const response = await axios.post('/api/plans', planData);
      
      if (response.data.success) {
        setShowSuccess(true);
        if (onSave) {
          onSave(response.data.plan);
        }
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const totalRequiredSIP = editedGoals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const availableSurplus = monthlyIncome - monthlyExpenses;
    const conflicts = detectTimelineConflicts(editedGoals);
    const optimization = optimizeMultipleGoals(editedGoals, availableSurplus);

    return {
      totalGoals: editedGoals.length,
      totalRequiredSIP,
      availableSurplus,
      feasible: totalRequiredSIP <= availableSurplus,
      conflicts,
      optimization
    };
  };

  const metrics = calculateSummaryMetrics();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Goal-Based Planning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {clientData.firstName} {clientData.lastName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh AI recommendations">
              <IconButton 
                onClick={handleRefreshRecommendations}
                disabled={analysisLoading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePlan}
              disabled={loading || editedGoals.length === 0}
            >
              Save Plan
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Summary Metrics */}
      <Paper sx={{ p: 2, mx: 2, mt: 2, bgcolor: metrics.feasible ? 'success.light' : 'warning.light' }}>
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Total Goals
            </Typography>
            <Typography variant="h6">
              {metrics.totalGoals}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Required Monthly SIP
            </Typography>
            <Typography variant="h6">
              ₹{metrics.totalRequiredSIP.toLocaleString('en-IN')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Available Surplus
            </Typography>
            <Typography variant="h6">
              ₹{metrics.availableSurplus.toLocaleString('en-IN')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="h6" color={metrics.feasible ? 'success.main' : 'warning.main'}>
              {metrics.feasible ? 'Achievable' : 'Needs Optimization'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 2, gap: 2 }}>
        {/* Left Panel - Editable Goals */}
        <Paper sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Goal Details & Configuration
          </Typography>
          
          {editedGoals.map((goal, index) => (
            <Box key={goal.id}>
              <EditableGoalItem
                goal={goal}
                index={index + 1}
                onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
                onRemove={() => handleRemoveGoal(goal.id)}
                clientAge={clientData.age || 30}
              />
              {index < editedGoals.length - 1 && <Divider sx={{ my: 3 }} />}
            </Box>
          ))}

          {editedGoals.length === 0 && (
            <Alert severity="info">
              No goals selected. Please go back and select goals to plan.
            </Alert>
          )}
        </Paper>

        {/* Right Panel - AI Recommendations */}
        <Paper sx={{ width: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <GoalAnalysisPanel 
            recommendations={recommendations}
            loading={analysisLoading}
            error={error}
          />
        </Paper>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Plan saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GoalPlanningInterface;