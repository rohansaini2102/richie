import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const GoalAnalysisPanel = ({ recommendations, loading, error }) => {
  const [expanded, setExpanded] = useState('individual');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Analyzing your goals with AI...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Failed to generate recommendations. Please try again.'}
        </Alert>
      </Box>
    );
  }

  if (!recommendations) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select goals to see AI recommendations
        </Typography>
      </Box>
    );
  }

  const { individualGoalAnalysis, multiGoalOptimization, recommendations: aiRecommendations, riskAssessment } = recommendations;

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          AI Recommendations
        </Typography>
      </Box>

      {/* Individual Goal Analysis */}
      <Accordion 
        expanded={expanded === 'individual'} 
        onChange={handleAccordionChange('individual')}
        sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Individual Goal Analysis
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {individualGoalAnalysis?.map((goal, index) => (
            <Card key={index} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                    {goal.goalName}
                  </Typography>
                  <Chip 
                    label={goal.analysis.feasibility} 
                    size="small"
                    color={goal.analysis.feasibility === 'High' ? 'success' : goal.analysis.feasibility === 'Medium' ? 'warning' : 'error'}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Required SIP
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '18px', color: 'primary.main' }}>
                      ₹{goal.analysis.requiredMonthlySIP?.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expected Return
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '18px' }}>
                      {goal.analysis.expectedReturn}%
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Asset Allocation
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={`Equity: ${goal.analysis.recommendedAssetAllocation.equity}%`} 
                      size="small" 
                      sx={{ bgcolor: '#e3f2fd' }}
                    />
                    <Chip 
                      label={`Debt: ${goal.analysis.recommendedAssetAllocation.debt}%`} 
                      size="small" 
                      sx={{ bgcolor: '#f3e5f5' }}
                    />
                  </Box>
                </Box>

                {goal.fundRecommendations?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fund Recommendations
                    </Typography>
                    {goal.fundRecommendations.map((fund, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2">{fund.fundName}</Typography>
                        <Typography variant="body2" color="primary">
                          ₹{fund.monthlyAmount?.toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* Multi-Goal Optimization */}
      <Accordion 
        expanded={expanded === 'optimization'} 
        onChange={handleAccordionChange('optimization')}
        sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Multi-Goal Strategy
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {multiGoalOptimization && (
            <>
              {/* Summary Box */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: multiGoalOptimization.feasibilityStatus === 'All achievable' ? 'success.light' : 'warning.light' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Required SIP</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ₹{multiGoalOptimization.totalRequiredSIP?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Available Surplus</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ₹{multiGoalOptimization.availableSurplus?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Status</Typography>
                  <Chip 
                    label={multiGoalOptimization.feasibilityStatus} 
                    size="small"
                    color={multiGoalOptimization.feasibilityStatus === 'All achievable' ? 'success' : 'warning'}
                  />
                </Box>
              </Paper>

              {/* Phase Strategy */}
              {multiGoalOptimization.phaseStrategy?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Phase-wise Implementation
                  </Typography>
                  {multiGoalOptimization.phaseStrategy.map((phase, idx) => (
                    <Box key={idx} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {phase.phase}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {phase.duration}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {phase.strategy}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Monthly Allocation: ₹{phase.monthlyAllocation?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Conflicts */}
              {multiGoalOptimization.conflicts?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Conflicts Detected
                  </Typography>
                  {multiGoalOptimization.conflicts.map((conflict, idx) => (
                    <Box key={idx} sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        {conflict.type}: {conflict.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resolution: {conflict.resolution}
                      </Typography>
                    </Box>
                  ))}
                </Alert>
              )}
            </>
          )}
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* Immediate Actions */}
      {aiRecommendations?.immediateActions?.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Immediate Actions
          </Typography>
          <List dense>
            {aiRecommendations.immediateActions.map((action, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Risk Assessment */}
      {riskAssessment && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Risk Assessment
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Overall Risk</Typography>
            <Chip 
              label={riskAssessment.overallRisk} 
              size="small"
              color={riskAssessment.overallRisk === 'Low' ? 'success' : riskAssessment.overallRisk === 'Medium' ? 'warning' : 'error'}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2">Diversification Score</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {riskAssessment.diversificationScore}/10
            </Typography>
          </Box>
          {riskAssessment.warnings?.length > 0 && (
            <Alert severity="warning" variant="outlined">
              {riskAssessment.warnings.map((warning, idx) => (
                <Typography key={idx} variant="body2">
                  • {warning}
                </Typography>
              ))}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GoalAnalysisPanel;