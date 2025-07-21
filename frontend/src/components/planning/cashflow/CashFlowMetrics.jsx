import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Warning,
  CheckCircle,
  Info,
  MonetizationOn,
  Percent,
  Assessment,
  Speed
} from '@mui/icons-material';
import { 
  calculateMonthlyMetrics, 
  calculateFinancialHealthScore,
  calculateEmergencyFund
} from './utils/calculations';
import { 
  formatCurrency, 
  formatPercentage, 
  getHealthScoreColor, 
  getHealthScoreLabel,
  getRatioColor
} from './utils/formatters';

const CashFlowMetrics = ({ clientData, planData }) => {
  // Calculate all financial metrics
  const allMetrics = useMemo(() => {
    const monthlyMetrics = calculateMonthlyMetrics(clientData);
    const healthScore = calculateFinancialHealthScore(clientData);
    const emergencyFund = calculateEmergencyFund(clientData);
    
    // Calculate net worth
    const totalAssets = calculateTotalAssets(clientData);
    const totalLiabilities = monthlyMetrics.totalEMIs * 12; // Simplified calculation
    const netWorth = totalAssets - totalLiabilities;
    
    // Calculate financial ratios
    const debtToIncomeRatio = monthlyMetrics.monthlyIncome > 0 ? 
      (monthlyMetrics.totalEMIs * 12) / (monthlyMetrics.monthlyIncome * 12) * 100 : 0;
    
    return {
      ...monthlyMetrics,
      healthScore,
      emergencyFund,
      netWorth,
      totalAssets,
      totalLiabilities,
      debtToIncomeRatio
    };
  }, [clientData]);

  const calculateTotalAssets = (data) => {
    const investments = data.assets?.investments || {};
    const cashSavings = parseFloat(data.assets?.cashBankSavings) || 0;
    
    let totalInvestments = 0;
    Object.values(investments).forEach(category => {
      if (typeof category === 'object') {
        Object.values(category).forEach(value => {
          totalInvestments += parseFloat(value) || 0;
        });
      }
    });
    
    return totalInvestments + cashSavings;
  };

  const getMetricStatus = (value, thresholds, higher = true) => {
    if (higher) {
      return value >= thresholds.good ? 'success' : 
             value >= thresholds.fair ? 'warning' : 'error';
    } else {
      return value <= thresholds.good ? 'success' : 
             value <= thresholds.fair ? 'warning' : 'error';
    }
  };

  const financialRatios = [
    {
      name: 'Savings Rate',
      value: allMetrics.savingsRate,
      target: 20,
      format: 'percentage',
      icon: <MonetizationOn />,
      description: 'Percentage of income saved monthly',
      status: getMetricStatus(allMetrics.savingsRate, { good: 20, fair: 10 }),
      benchmark: '20%+ is excellent, 10-20% is good'
    },
    {
      name: 'EMI Ratio',
      value: allMetrics.emiRatio,
      target: 40,
      format: 'percentage',
      icon: <Percent />,
      description: 'Percentage of income going to EMIs',
      status: getMetricStatus(allMetrics.emiRatio, { good: 30, fair: 40 }, false),
      benchmark: 'Below 30% is ideal, 40% is maximum safe limit'
    },
    {
      name: 'Expense Ratio',
      value: allMetrics.expenseRatio,
      target: 50,
      format: 'percentage',
      icon: <TrendingDown />,
      description: 'Percentage of income spent on expenses',
      status: getMetricStatus(allMetrics.expenseRatio, { good: 50, fair: 70 }, false),
      benchmark: 'Below 50% is good, 70% is manageable'
    },
    {
      name: 'Fixed Expenditure Ratio',
      value: allMetrics.fixedExpenditureRatio,
      target: 50,
      format: 'percentage',
      icon: <AccountBalance />,
      description: 'Fixed expenses + EMIs as % of income',
      status: getMetricStatus(allMetrics.fixedExpenditureRatio, { good: 50, fair: 70 }, false),
      benchmark: 'Below 50% provides financial flexibility'
    }
  ];

  const healthCategories = [
    {
      name: 'Income Stability',
      score: allMetrics.monthlyIncome > 0 ? 20 : 0,
      maxScore: 20,
      description: 'Regular monthly income'
    },
    {
      name: 'Expense Management', 
      score: allMetrics.expenseRatio < 50 ? 20 : allMetrics.expenseRatio < 70 ? 10 : 0,
      maxScore: 20,
      description: 'Controlled spending habits'
    },
    {
      name: 'Debt Management',
      score: allMetrics.emiRatio === 0 ? 20 : 
             allMetrics.emiRatio < 30 ? 15 :
             allMetrics.emiRatio < 40 ? 10 : 5,
      maxScore: 20,
      description: 'Manageable debt levels'
    },
    {
      name: 'Savings Discipline',
      score: allMetrics.savingsRate > 30 ? 20 :
             allMetrics.savingsRate > 20 ? 15 :
             allMetrics.savingsRate > 10 ? 10 :
             allMetrics.savingsRate > 0 ? 5 : 0,
      maxScore: 20,
      description: 'Regular savings habit'
    },
    {
      name: 'Emergency Preparedness',
      score: allMetrics.emergencyFund.monthsOfCoverage >= 6 ? 20 :
             allMetrics.emergencyFund.monthsOfCoverage >= 3 ? 10 :
             allMetrics.emergencyFund.monthsOfCoverage >= 1 ? 5 : 0,
      maxScore: 20,
      description: 'Emergency fund adequacy'
    }
  ];

  return (
    <Box>
      {/* Financial Health Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Financial Health Score</Typography>
            <Chip 
              label={getHealthScoreLabel(allMetrics.healthScore)}
              color={
                allMetrics.healthScore >= 80 ? 'success' :
                allMetrics.healthScore >= 60 ? 'info' :
                allMetrics.healthScore >= 40 ? 'warning' : 'error'
              }
              icon={<Assessment />}
            />
          </Box>
          
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={8}>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Overall Score</Typography>
                  <Typography variant="h4" color={getHealthScoreColor(allMetrics.healthScore)}>
                    {allMetrics.healthScore}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={allMetrics.healthScore}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getHealthScoreColor(allMetrics.healthScore)
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity={allMetrics.healthScore >= 60 ? 'success' : 'warning'}>
                <Typography variant="body2">
                  {allMetrics.healthScore >= 80 && 'Excellent financial health! Keep up the good work.'}
                  {allMetrics.healthScore >= 60 && allMetrics.healthScore < 80 && 'Good financial health with room for improvement.'}
                  {allMetrics.healthScore >= 40 && allMetrics.healthScore < 60 && 'Fair financial health. Focus on key areas.'}
                  {allMetrics.healthScore < 40 && 'Financial health needs attention. Prioritize improvements.'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          {/* Health Score Breakdown */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Score Breakdown</Typography>
          <List dense>
            {healthCategories.map((category, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {category.score === category.maxScore ? 
                    <CheckCircle color="success" /> : 
                    <Warning color="warning" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={category.name}
                  secondary={category.description}
                />
                <Typography variant="body2" color="text.secondary">
                  {category.score}/{category.maxScore}
                </Typography>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Key Financial Ratios */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Key Financial Ratios</Typography>
          
          <Grid container spacing={3}>
            {financialRatios.map((ratio, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    {ratio.icon}
                    <Typography variant="subtitle2" sx={{ ml: 1, mr: 1 }}>
                      {ratio.name}
                    </Typography>
                    <Tooltip title={ratio.description}>
                      <Info fontSize="small" color="action" />
                    </Tooltip>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Current</Typography>
                    <Typography 
                      variant="h6" 
                      color={getRatioColor(ratio.value, ratio.name.toLowerCase().includes('savings') ? 'savings' : 'emi')}
                    >
                      {formatPercentage(ratio.value)}
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(ratio.value, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.300',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: ratio.status === 'success' ? 'success.main' :
                                       ratio.status === 'warning' ? 'warning.main' : 'error.main'
                      }
                    }}
                  />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {ratio.benchmark}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Net Worth Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Net Worth Summary</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Assets
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {formatCurrency(allMetrics.totalAssets)}
                      </Typography>
                    </Box>
                    <TrendingUp color="success" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Liabilities
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        {formatCurrency(allMetrics.totalLiabilities)}
                      </Typography>
                    </Box>
                    <TrendingDown color="error" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Net Worth
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color={allMetrics.netWorth >= 0 ? 'primary.main' : 'error.main'}
                      >
                        {formatCurrency(allMetrics.netWorth)}
                      </Typography>
                    </Box>
                    <Assessment color="primary" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Monthly Cash Flow */}
          <Typography variant="subtitle1" gutterBottom>Monthly Cash Flow</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Income</Typography>
              <Typography variant="h6" color="success.main">
                +{formatCurrency(allMetrics.monthlyIncome)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Expenses</Typography>
              <Typography variant="h6" color="error.main">
                -{formatCurrency(allMetrics.monthlyExpenses)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">EMIs</Typography>
              <Typography variant="h6" color="error.main">
                -{formatCurrency(allMetrics.totalEMIs)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Net Surplus</Typography>
              <Typography 
                variant="h6" 
                color={allMetrics.monthlySurplus >= 0 ? 'success.main' : 'error.main'}
              >
                {allMetrics.monthlySurplus >= 0 ? '+' : ''}{formatCurrency(allMetrics.monthlySurplus)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CashFlowMetrics;