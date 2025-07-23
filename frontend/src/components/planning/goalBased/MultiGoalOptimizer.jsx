import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  Slider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  SwapVert as SwapVertIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  optimizeMultipleGoals,
  detectTimelineConflicts,
  calculateGoalPriorityScore
} from './utils/goalCalculations';

const MultiGoalOptimizer = ({ 
  goals, 
  availableSurplus, 
  onOptimizationChange,
  clientRiskProfile = 'Moderate'
}) => {
  const [optimization, setOptimization] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('recommended');
  const [customAllocations, setCustomAllocations] = useState({});
  const [expanded, setExpanded] = useState('overview');

  useEffect(() => {
    if (goals && goals.length > 0) {
      const optimizationResult = optimizeMultipleGoals(goals, availableSurplus);
      const detectedConflicts = detectTimelineConflicts(goals);
      
      setOptimization(optimizationResult);
      setConflicts(detectedConflicts);
      
      // Initialize custom allocations with equal distribution
      const equalAllocation = Math.floor(availableSurplus / goals.length);
      const initialAllocations = {};
      goals.forEach(goal => {
        initialAllocations[goal.id] = Math.min(equalAllocation, goal.monthlySIP || 0);
      });
      setCustomAllocations(initialAllocations);
      
      if (onOptimizationChange) {
        onOptimizationChange(optimizationResult);
      }
    }
  }, [goals, availableSurplus]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleAllocationChange = (goalId, value) => {
    setCustomAllocations(prev => ({
      ...prev,
      [goalId]: value
    }));
  };

  const getTotalCustomAllocation = () => {
    return Object.values(customAllocations).reduce((sum, allocation) => sum + allocation, 0);
  };

  const getScenarios = () => {
    if (!optimization) return [];

    const scenarios = [
      {
        id: 'recommended',
        name: 'AI Recommended',
        description: 'Priority-based allocation optimized by AI',
        allocations: optimization.optimizedGoals.reduce((acc, goal) => {
          acc[goal.id] = Math.min(goal.monthlySIP || 0, availableSurplus / goals.length);
          return acc;
        }, {}),
        feasibility: optimization.canAffordAll ? 'High' : 'Medium'
      },
      {
        id: 'equal',
        name: 'Equal Distribution',
        description: 'Equal monthly allocation across all goals',
        allocations: goals.reduce((acc, goal) => {
          acc[goal.id] = Math.floor(availableSurplus / goals.length);
          return acc;
        }, {}),
        feasibility: 'Medium'
      },
      {
        id: 'priority',
        name: 'Priority Based',
        description: 'Higher allocation to high-priority goals',
        allocations: goals.reduce((acc, goal) => {
          const priorityWeight = goal.priority === 'High' ? 1.5 : goal.priority === 'Medium' ? 1 : 0.7;
          const baseAllocation = availableSurplus / goals.length;
          acc[goal.id] = Math.floor(baseAllocation * priorityWeight);
          return acc;
        }, {}),
        feasibility: 'Medium'
      },
      {
        id: 'custom',
        name: 'Custom Allocation',
        description: 'Manually adjusted allocations',
        allocations: customAllocations,
        feasibility: getTotalCustomAllocation() <= availableSurplus ? 'High' : 'Low'
      }
    ];

    return scenarios;
  };

  const getCurrentScenario = () => {
    return getScenarios().find(s => s.id === selectedScenario);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getFeasibilityColor = (feasibility) => {
    switch (feasibility) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'error';
      default: return 'default';
    }
  };

  if (!goals || goals.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No goals to optimize
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add goals to see optimization strategies
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Overview */}
      <Accordion 
        expanded={expanded === 'overview'} 
        onChange={handleAccordionChange('overview')}
        defaultExpanded
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Goals Overview
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Goal</TableCell>
                  <TableCell align="center">Priority</TableCell>
                  <TableCell align="right">Target Amount</TableCell>
                  <TableCell align="center">Timeline</TableCell>
                  <TableCell align="right">Required SIP</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {goals.map((goal) => {
                  const isAffordable = (goal.monthlySIP || 0) <= (availableSurplus / goals.length);
                  return (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {goal.title || goal.goalName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={goal.priority || 'Medium'} 
                          size="small"
                          color={getPriorityColor(goal.priority)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        ₹{(goal.targetAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="center">
                        {goal.targetYear} ({goal.timeInYears || 0} years)
                      </TableCell>
                      <TableCell align="right">
                        ₹{(goal.monthlySIP || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={isAffordable ? 'Achievable' : 'Challenging'} 
                          size="small"
                          color={isAffordable ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {goals.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Goals
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={optimization?.canAffordAll ? 'success.main' : 'warning.main'}>
                    ₹{optimization?.totalRequired.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Required
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    ₹{availableSurplus.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Surplus
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={optimization?.deficit > 0 ? 'error.main' : 'success.main'}>
                    {optimization?.deficit > 0 ? `-₹${optimization.deficit.toLocaleString('en-IN')}` : '✓'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {optimization?.deficit > 0 ? 'Shortfall' : 'Surplus'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Accordion 
          expanded={expanded === 'conflicts'} 
          onChange={handleAccordionChange('conflicts')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
              Timeline Conflicts ({conflicts.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {conflicts.map((conflict, index) => (
              <Alert key={index} severity={conflict.severity === 'High' ? 'error' : 'warning'} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">
                  Multiple goals in {conflict.year}
                </Typography>
                <Typography variant="body2">
                  Goals: {conflict.goals.join(', ')}
                </Typography>
                <Typography variant="body2">
                  Combined requirement: ₹{conflict.totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Alert>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Optimization Scenarios */}
      <Accordion 
        expanded={expanded === 'scenarios'} 
        onChange={handleAccordionChange('scenarios')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Optimization Scenarios
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {getScenarios().map((scenario) => (
              <Grid item xs={12} md={6} key={scenario.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedScenario === scenario.id ? 2 : 1,
                    borderColor: selectedScenario === scenario.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {scenario.name}
                      </Typography>
                      <Chip 
                        label={scenario.feasibility} 
                        size="small"
                        color={getFeasibilityColor(scenario.feasibility)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {scenario.description}
                    </Typography>
                    
                    {/* Show allocation for this scenario */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Allocation: ₹{Object.values(scenario.allocations).reduce((sum, val) => sum + val, 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Custom Allocation Controls */}
          {selectedScenario === 'custom' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Custom Allocation
              </Typography>
              {goals.map((goal) => (
                <Box key={goal.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {goal.title || goal.goalName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{(customAllocations[goal.id] || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Slider
                    value={customAllocations[goal.id] || 0}
                    onChange={(e, value) => handleAllocationChange(goal.id, value)}
                    min={0}
                    max={goal.monthlySIP || 0}
                    step={500}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                </Box>
              ))}
              <Alert 
                severity={getTotalCustomAllocation() <= availableSurplus ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                Total Allocation: ₹{getTotalCustomAllocation().toLocaleString('en-IN')} / 
                ₹{availableSurplus.toLocaleString('en-IN')} available
              </Alert>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Phase Strategy */}
      {optimization?.phases && optimization.phases.length > 0 && (
        <Accordion 
          expanded={expanded === 'phases'} 
          onChange={handleAccordionChange('phases')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Phase-wise Strategy
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {optimization.phases.map((phase, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {phase.name} - {phase.timeframe}
                  </Typography>
                  <List dense>
                    {phase.goals.map((goal, goalIndex) => (
                      <ListItem key={goalIndex}>
                        <ListItemIcon>
                          <PlayArrowIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={goal.title || goal.goalName}
                          secondary={`₹${(goal.monthlySIP || 0).toLocaleString('en-IN')}/month`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default MultiGoalOptimizer;