import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import {
  TrackChanges,
  School,
  Home,
  BeachAccess,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { formatCurrency, calculateGoalProjections, safeParseFloat } from '../utils/financialCalculations';

const GoalsTab = ({ clientData, planData, financialMetrics, onUpdate }) => {
  
  // State for goals display
  const [goals, setGoals] = useState([]);

  // Initialize goals on component mount
  useEffect(() => {
    const clientGoals = extractGoalsFromClientData();
    setGoals(clientGoals);
  }, [clientData, financialMetrics]);

  // Extract actual goals from client data - flexible approach
  const extractGoalsFromClientData = () => {
    const goals = [];
    
    // Check if client has goals in their data
    const clientGoals = clientData?.goals || clientData?.financialGoals || [];
    const step7Goals = clientData?.step7_goalsAndRiskProfile?.financialGoals;
    
    // If client has defined goals, use those
    if (clientGoals && clientGoals.length > 0) {
      clientGoals.forEach((goal, index) => {
        goals.push({
          id: `client_goal_${index}`,
          type: goal.type || 'custom',
          name: goal.goalName || goal.name || `Client Goal ${index + 1}`,
          targetAmount: safeParseFloat(goal.targetAmount),
          targetYear: goal.targetYear || new Date().getFullYear() + 5,
          currentValue: safeParseFloat(goal.currentValue) || 0,
          priority: goal.priority || 'Medium',
          requiredSIP: 0, // Will be calculated by advisor
          status: goal.targetAmount > 0 ? 'client_defined' : 'incomplete',
          isClientGoal: true
        });
      });
    }

    // Check Step 7 structured goals
    if (step7Goals) {
      // Emergency Fund
      if (step7Goals.emergencyFund && step7Goals.emergencyFund.priority !== 'Not Applicable') {
        const emergencyTarget = safeParseFloat(step7Goals.emergencyFund.targetAmount) || 
                               (financialMetrics?.monthlyExpenses || 0) * 6;
        goals.push({
          id: 'emergency_fund',
          type: 'emergency',
          name: 'Emergency Fund',
          targetAmount: emergencyTarget,
          targetYear: new Date().getFullYear() + 1,
          currentValue: financialMetrics?.liquidAssets || 0,
          priority: step7Goals.emergencyFund.priority || 'High',
          requiredSIP: 0,
          status: 'client_defined',
          isClientGoal: true
        });
      }

      // Child Education
      if (step7Goals.childEducation?.isApplicable) {
        goals.push({
          id: 'child_education',
          type: 'childEducation',
          name: 'Child Education',
          targetAmount: safeParseFloat(step7Goals.childEducation.details?.targetAmount) || 2500000,
          targetYear: step7Goals.childEducation.details?.targetYear || new Date().getFullYear() + 15,
          currentValue: 0,
          priority: 'High',
          requiredSIP: 0,
          status: 'client_defined',
          isClientGoal: true
        });
      }

      // Home Purchase
      if (step7Goals.homePurchase?.isApplicable) {
        goals.push({
          id: 'home_purchase',
          type: 'homePurchase',
          name: 'Home Purchase',
          targetAmount: safeParseFloat(step7Goals.homePurchase.details?.targetAmount) || 0,
          targetYear: step7Goals.homePurchase.details?.targetYear || new Date().getFullYear() + 10,
          currentValue: 0,
          priority: 'Medium',
          requiredSIP: 0,
          status: 'client_defined',
          isClientGoal: true
        });
      }

      // Custom Goals
      if (step7Goals.customGoals && Array.isArray(step7Goals.customGoals)) {
        step7Goals.customGoals.forEach((customGoal, index) => {
          goals.push({
            id: `custom_goal_${index}`,
            type: 'custom',
            name: customGoal.goalName || `Custom Goal ${index + 1}`,
            targetAmount: safeParseFloat(customGoal.targetAmount),
            targetYear: customGoal.targetYear || new Date().getFullYear() + 5,
            currentValue: 0,
            priority: customGoal.priority || 'Medium',
            requiredSIP: 0,
            status: 'client_defined',
            isClientGoal: true
          });
        });
      }
    }

    // Retirement goal from separate retirement data
    if (clientData?.retirementAge && clientData?.targetRetirementCorpus) {
      const currentAge = clientData?.dateOfBirth 
        ? new Date().getFullYear() - new Date(clientData.dateOfBirth).getFullYear()
        : clientData?.age || 30;
      const retirementAge = clientData.retirementAge;
      const currentSavings = (clientData?.assets?.ppfBalance || 0) + 
                            (clientData?.assets?.epfBalance || 0) + 
                            (clientData?.assets?.npsBalance || 0);
      
      goals.push({
        id: 'retirement',
        type: 'retirement',
        name: 'Retirement Planning',
        targetAmount: safeParseFloat(clientData.targetRetirementCorpus),
        targetYear: new Date().getFullYear() + (retirementAge - currentAge),
        currentValue: currentSavings,
        priority: 'High',
        requiredSIP: 0,
        status: 'client_defined',
        isClientGoal: true
      });
    }

    // If no goals found, create a template structure for advisor to add goals
    if (goals.length === 0) {
      return [{
        id: 'template_goal_1',
        type: 'custom',
        name: 'New Goal',
        targetAmount: 0,
        targetYear: new Date().getFullYear() + 5,
        currentValue: 0,
        priority: 'Medium',
        requiredSIP: 0,
        status: 'advisor_to_add',
        isClientGoal: false,
        isTemplate: true
      }];
    }

    return goals;
  };

  // Calculate totals from current goals (placeholder for future development)
  const totalRequiredSIP = 0; // Will be calculated when hybrid planning is implemented
  const availableSurplus = financialMetrics?.monthlySurplus || 0;
  const sipGap = totalRequiredSIP - availableSurplus;


  // Status indicator component
  const StatusChip = ({ status, amount = 0 }) => {
    if (status === 'not_set' || amount === 0) {
      return <Chip label="Not Set" color="default" size="small" />;
    }
    if (sipGap <= 0) {
      return <Chip label="On Track" color="success" size="small" icon={<CheckCircle />} />;
    }
    if (sipGap > availableSurplus * 0.5) {
      return <Chip label="Shortfall" color="error" size="small" icon={<Warning />} />;
    }
    return <Chip label="Gap" color="warning" size="small" icon={<Info />} />;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Goals from Client Data Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrackChanges sx={{ color: '#2563eb' }} />
          Goals from Client Onboarding
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Goal</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Target Amount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Target Year</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Current SIP</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Required SIP</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goals.map((goal, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {goal.type === 'retirement' && <BeachAccess sx={{ color: '#f59e0b' }} />}
                      {goal.type === 'childEducation' && <School sx={{ color: '#8b5cf6' }} />}
                      {goal.type === 'homePurchase' && <Home sx={{ color: '#10b981' }} />}
                      {goal.type === 'emergency' && <Warning sx={{ color: '#ef4444' }} />}
                      {goal.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(goal.targetAmount)}</TableCell>
                  <TableCell align="right">{goal.targetYear}</TableCell>
                  <TableCell align="right">{formatCurrency(0)}</TableCell>
                  <TableCell align="right">{formatCurrency(goal.requiredSIP)}</TableCell>
                  <TableCell align="center">
                    <StatusChip status={goal.status} amount={goal.targetAmount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Gap Analysis */}
        <Box sx={{ mt: 3, p: 2, bgcolor: sipGap > 0 ? '#fef3c7' : '#dcfce7', borderRadius: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">Total SIP Required:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCurrency(totalRequiredSIP)}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">Available Surplus:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCurrency(availableSurplus)}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">Gap:</Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: sipGap > 0 ? '#dc2626' : '#059669'
                }}
              >
                {formatCurrency(Math.abs(sipGap))} {sipGap > 0 ? 'Short' : 'Surplus'}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">Optimization Status:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {sipGap <= 0 ? '✅ Achievable' : '⚠️ Needs Adjustment'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {sipGap > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Gap Analysis:</strong> There is a shortfall of {formatCurrency(sipGap)}/month. 
              Consider income increase, timeline adjustment, or goal prioritization.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Hybrid Planning Section - Under Development */}
      <Paper sx={{ p: 4, mt: 3, bgcolor: '#f8fafc', border: '2px dashed #e2e8f0' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, color: '#64748b', fontWeight: 600 }}>
            🚧 Hybrid Planning Section
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#f59e0b', fontWeight: 500 }}>
            Under Development
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#64748b', maxWidth: 600, mx: 'auto' }}>
            The comprehensive hybrid planning interface with goal-based recommendations, 
            advisor input sections, and strategic planning tools is currently being developed. 
            This will include dynamic goal management, SIP calculations, and personalized 
            investment strategies.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            flexWrap: 'wrap',
            mt: 3
          }}>
            <Chip label="Goal Planning" variant="outlined" color="primary" />
            <Chip label="SIP Recommendations" variant="outlined" color="primary" />
            <Chip label="Risk Assessment" variant="outlined" color="primary" />
            <Chip label="Timeline Analysis" variant="outlined" color="primary" />
          </Box>
        </Box>
      </Paper>

    </Box>
  );
};

export default GoalsTab;