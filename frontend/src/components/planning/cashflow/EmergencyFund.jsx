import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Shield,
  TrendingUp,
  Warning,
  CheckCircle,
  ExpandMore,
  AccountBalance,
  Timer,
  MonetizationOn
} from '@mui/icons-material';
import { calculateEmergencyFund, calculateMonthlyMetrics } from './utils/calculations';
import { formatCurrency, formatPercentage, formatTenure } from './utils/formatters';

const EmergencyFund = ({ clientData, planData, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const [targetMonths, setTargetMonths] = useState(6);
  const [monthlyContribution, setMonthlyContribution] = useState('');

  // Calculate emergency fund metrics
  const emergencyMetrics = useMemo(() => {
    const metrics = calculateMonthlyMetrics(clientData);
    const emergencyFund = calculateEmergencyFund(clientData);
    
    // Calculate suggested monthly contribution
    const suggestedContribution = Math.max(
      5000, // Minimum ₹5k
      Math.min(
        metrics.monthlySurplus * 0.3, // 30% of surplus
        emergencyFund.gap / 12 // To achieve in 1 year
      )
    );
    
    const timeToGoal = emergencyFund.gap > 0 && suggestedContribution > 0 
      ? Math.ceil(emergencyFund.gap / suggestedContribution)
      : 0;
    
    return {
      ...emergencyFund,
      monthlyCommitments: metrics.monthlyExpenses + metrics.totalEMIs,
      suggestedContribution,
      timeToGoal,
      surplus: metrics.monthlySurplus
    };
  }, [clientData]);

  const getFundStatus = () => {
    const percentage = emergencyMetrics.completionPercentage;
    if (percentage >= 100) {
      return { color: 'success', label: 'Fully Funded', icon: <CheckCircle /> };
    } else if (percentage >= 50) {
      return { color: 'warning', label: 'Partially Funded', icon: <Warning /> };
    } else {
      return { color: 'error', label: 'Underfunded', icon: <Warning /> };
    }
  };

  const fundStatus = getFundStatus();

  const liquidFundRecommendations = [
    { name: 'HDFC Liquid Fund', returns: '7.2%', minInvestment: '₹5,000' },
    { name: 'ICICI Prudential Liquid Fund', returns: '7.0%', minInvestment: '₹5,000' },
    { name: 'Axis Liquid Fund', returns: '7.1%', minInvestment: '₹5,000' },
    { name: 'SBI Liquid Fund', returns: '6.9%', minInvestment: '₹5,000' }
  ];

  const handleSaveStrategy = () => {
    const contribution = parseFloat(monthlyContribution) || emergencyMetrics.suggestedContribution;
    const target = parseFloat(customTarget) || emergencyMetrics.targetAmount;
    
    // Update plan with emergency fund strategy
    if (onUpdate) {
      onUpdate({
        emergencyFundStrategy: {
          targetAmount: target,
          monthlyAllocation: contribution,
          targetMonths: targetMonths
        }
      });
    }
    
    setEditMode(false);
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Current Fund
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(emergencyMetrics.currentAmount)}
                  </Typography>
                </Box>
                <AccountBalance color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Target Amount
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {formatCurrency(emergencyMetrics.targetAmount)}
                  </Typography>
                </Box>
                <Shield color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Gap to Fill
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {formatCurrency(emergencyMetrics.gap)}
                  </Typography>
                </Box>
                <TrendingUp color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Fund Status
                  </Typography>
                  <Chip 
                    label={fundStatus.label}
                    color={fundStatus.color}
                    icon={fundStatus.icon}
                    size="small"
                  />
                </Box>
                {fundStatus.icon}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Emergency Fund Progress</Typography>
          
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">
                Coverage: {emergencyMetrics.monthsOfCoverage.toFixed(1)} months
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatPercentage(emergencyMetrics.completionPercentage)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(emergencyMetrics.completionPercentage, 100)}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: emergencyMetrics.completionPercentage >= 100 ? 'success.main' : 
                                   emergencyMetrics.completionPercentage >= 50 ? 'warning.main' : 'error.main'
                }
              }}
            />
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="caption" color="text.secondary">0 months</Typography>
              <Typography variant="caption" color="warning.main">3 months</Typography>
              <Typography variant="caption" color="success.main">6 months (Target)</Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Monthly Commitments</Typography>
              <Typography variant="h6">{formatCurrency(emergencyMetrics.monthlyCommitments)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Recommended Fund (6 months)</Typography>
              <Typography variant="h6">{formatCurrency(emergencyMetrics.targetAmount)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Building Strategy */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Building Strategy</Typography>
            <Button
              variant={editMode ? 'contained' : 'outlined'}
              onClick={() => editMode ? handleSaveStrategy() : setEditMode(true)}
              size="small"
            >
              {editMode ? 'Save Strategy' : 'Customize'}
            </Button>
          </Box>

          {emergencyMetrics.gap > 0 ? (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Monthly Contribution"
                    type="number"
                    value={editMode ? monthlyContribution : emergencyMetrics.suggestedContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: '₹'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>Target Months</InputLabel>
                    <Select
                      value={targetMonths}
                      onChange={(e) => setTargetMonths(e.target.value)}
                      label="Target Months"
                    >
                      <MenuItem value={3}>3 months</MenuItem>
                      <MenuItem value={6}>6 months (Recommended)</MenuItem>
                      <MenuItem value={9}>9 months</MenuItem>
                      <MenuItem value={12}>12 months</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary.contrastText">
                      Time to Goal
                    </Typography>
                    <Typography variant="h6" color="primary.contrastText">
                      {emergencyMetrics.timeToGoal} months
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {emergencyMetrics.surplus <= 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You currently have no monthly surplus. Consider reducing expenses or increasing income to build your emergency fund.
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="success">
              Congratulations! Your emergency fund is fully funded. Continue to maintain it and review annually.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Investment Options */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Recommended Investment Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Emergency funds should be kept in highly liquid, low-risk instruments for easy access.
            </Alert>
            
            <Typography variant="subtitle2" gutterBottom>Liquid Mutual Funds</Typography>
            <List>
              {liquidFundRecommendations.map((fund, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <MonetizationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={fund.name}
                    secondary={
                      <Box display="flex" gap={2}>
                        <Typography variant="caption">Returns: {fund.returns} p.a.</Typography>
                        <Typography variant="caption">Min Investment: {fund.minInvestment}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Other Options</Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <AccountBalance />
                </ListItemIcon>
                <ListItemText
                  primary="High-yield Savings Account"
                  secondary="Returns: 4-6% p.a. | Instant liquidity"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccountBalance />
                </ListItemIcon>
                <ListItemText
                  primary="Sweep-in Fixed Deposits"
                  secondary="Returns: 6-7% p.a. | Partial withdrawal allowed"
                />
              </ListItem>
            </List>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default EmergencyFund;