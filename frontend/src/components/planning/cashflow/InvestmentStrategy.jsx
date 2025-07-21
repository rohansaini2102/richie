import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  PieChart,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  ShowChart,
  Info,
  Add,
  Delete,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { 
  calculateMonthlyMetrics, 
  calculateInvestmentAllocation,
  calculateFinancialHealthScore 
} from './utils/calculations';
import { formatCurrency, formatPercentage } from './utils/formatters';

const InvestmentStrategy = ({ clientData, planData, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [monthlyInvestments, setMonthlyInvestments] = useState([]);
  const [newInvestment, setNewInvestment] = useState({
    fundName: '',
    fundType: '',
    monthlyAmount: '',
    category: 'equity'
  });

  // Calculate investment metrics
  const investmentMetrics = useMemo(() => {
    const metrics = calculateMonthlyMetrics(clientData);
    const age = clientData.dateOfBirth ? 
      new Date().getFullYear() - new Date(clientData.dateOfBirth).getFullYear() : 30;
    const riskProfile = clientData.riskTolerance || 'Moderate';
    const allocation = calculateInvestmentAllocation(age, riskProfile);
    
    // Calculate available investment amount
    const emergencyFundAllocation = Math.min(metrics.monthlySurplus * 0.3, 10000);
    const availableForInvestment = Math.max(0, metrics.monthlySurplus - emergencyFundAllocation);
    
    // Calculate recommended monthly investments
    const recommendedInvestments = {
      equity: availableForInvestment * (allocation.equity / 100),
      debt: availableForInvestment * (allocation.debt / 100),
      total: availableForInvestment
    };
    
    return {
      ...metrics,
      age,
      riskProfile,
      allocation,
      availableForInvestment,
      recommendedInvestments,
      existingInvestments: calculateExistingInvestments(clientData)
    };
  }, [clientData]);

  const calculateExistingInvestments = (data) => {
    const investments = data.assets?.investments || {};
    let total = 0;
    
    Object.values(investments).forEach(category => {
      if (typeof category === 'object') {
        Object.values(category).forEach(value => {
          total += parseFloat(value) || 0;
        });
      }
    });
    
    return total;
  };

  const fundRecommendations = {
    equity: [
      { name: 'Axis Bluechip Fund', category: 'Large Cap', returns: '12-15%', risk: 'Moderate' },
      { name: 'HDFC Mid-Cap Opportunities', category: 'Mid Cap', returns: '15-18%', risk: 'High' },
      { name: 'SBI Small Cap Fund', category: 'Small Cap', returns: '18-22%', risk: 'Very High' },
      { name: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', returns: '14-16%', risk: 'Moderate-High' }
    ],
    debt: [
      { name: 'HDFC Corporate Bond Fund', category: 'Corporate Bond', returns: '7-9%', risk: 'Low' },
      { name: 'ICICI Prudential Gilt Fund', category: 'Gilt', returns: '6-8%', risk: 'Low-Moderate' },
      { name: 'Axis Banking & PSU Debt', category: 'Banking & PSU', returns: '7-8%', risk: 'Low' }
    ],
    hybrid: [
      { name: 'HDFC Balanced Advantage', category: 'Dynamic', returns: '10-12%', risk: 'Moderate' },
      { name: 'ICICI Prudential Equity & Debt', category: 'Aggressive Hybrid', returns: '11-13%', risk: 'Moderate' }
    ]
  };

  const handleAddInvestment = () => {
    if (newInvestment.fundName && newInvestment.monthlyAmount) {
      setMonthlyInvestments([...monthlyInvestments, {
        ...newInvestment,
        id: Date.now()
      }]);
      setNewInvestment({
        fundName: '',
        fundType: '',
        monthlyAmount: '',
        category: 'equity'
      });
    }
  };

  const handleRemoveInvestment = (id) => {
    setMonthlyInvestments(monthlyInvestments.filter(inv => inv.id !== id));
  };

  const handleSaveStrategy = () => {
    if (onUpdate) {
      onUpdate({
        investmentRecommendations: {
          monthlyInvestments,
          assetAllocation: investmentMetrics.allocation,
          totalMonthlyInvestment: monthlyInvestments.reduce((sum, inv) => 
            sum + parseFloat(inv.monthlyAmount || 0), 0
          )
        }
      });
    }
    setEditMode(false);
  };

  const calculateProjectedCorpus = (monthlyAmount, years, returnRate = 12) => {
    const monthlyReturn = returnRate / 100 / 12;
    const months = years * 12;
    return monthlyAmount * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn);
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
                    Available for Investment
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(investmentMetrics.availableForInvestment)}
                  </Typography>
                </Box>
                <TrendingUp color="success" />
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
                    Current Investments
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(investmentMetrics.existingInvestments)}
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
                    Risk Profile
                  </Typography>
                  <Chip 
                    label={investmentMetrics.riskProfile}
                    color={
                      investmentMetrics.riskProfile === 'Conservative' ? 'success' :
                      investmentMetrics.riskProfile === 'Moderate' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </Box>
                <ShowChart color="action" />
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
                    Age
                  </Typography>
                  <Typography variant="h5">
                    {investmentMetrics.age} years
                  </Typography>
                </Box>
                <Info color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset Allocation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recommended Asset Allocation</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                {Object.entries(investmentMetrics.allocation).map(([asset, percentage]) => (
                  percentage > 0 && (
                    <Box key={asset} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" textTransform="capitalize">
                          {asset}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {percentage}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: asset === 'equity' ? 'primary.main' : 
                                           asset === 'debt' ? 'success.main' : 'warning.main'
                          }
                        }}
                      />
                    </Box>
                  )
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="info">
                Based on your age ({investmentMetrics.age}) and {investmentMetrics.riskProfile} risk profile, 
                we recommend {investmentMetrics.allocation.equity}% in equity for long-term growth 
                and {investmentMetrics.allocation.debt}% in debt for stability.
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Investment Recommendations */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Fund Recommendations" />
            <Tab label="Monthly Investment Plan" />
            <Tab label="Projected Returns" />
          </Tabs>

          {/* Fund Recommendations Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Equity Funds ({investmentMetrics.allocation.equity}% allocation)</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fund Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Expected Returns</TableCell>
                      <TableCell>Risk Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fundRecommendations.equity.map((fund, index) => (
                      <TableRow key={index}>
                        <TableCell>{fund.name}</TableCell>
                        <TableCell>{fund.category}</TableCell>
                        <TableCell>{fund.returns}</TableCell>
                        <TableCell>
                          <Chip 
                            label={fund.risk} 
                            size="small"
                            color={
                              fund.risk === 'Low' ? 'success' :
                              fund.risk === 'Moderate' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" gutterBottom>Debt Funds ({investmentMetrics.allocation.debt}% allocation)</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fund Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Expected Returns</TableCell>
                      <TableCell>Risk Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fundRecommendations.debt.map((fund, index) => (
                      <TableRow key={index}>
                        <TableCell>{fund.name}</TableCell>
                        <TableCell>{fund.category}</TableCell>
                        <TableCell>{fund.returns}</TableCell>
                        <TableCell>
                          <Chip 
                            label={fund.risk} 
                            size="small"
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Monthly Investment Plan Tab */}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Monthly SIP Allocation</Typography>
                <Button
                  variant={editMode ? 'contained' : 'outlined'}
                  onClick={() => editMode ? handleSaveStrategy() : setEditMode(true)}
                  startIcon={editMode ? <Save /> : <Edit />}
                >
                  {editMode ? 'Save Plan' : 'Customize Plan'}
                </Button>
              </Box>

              {editMode && (
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Fund Name"
                      value={newInvestment.fundName}
                      onChange={(e) => setNewInvestment({...newInvestment, fundName: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={newInvestment.category}
                        onChange={(e) => setNewInvestment({...newInvestment, category: e.target.value})}
                        label="Category"
                      >
                        <MenuItem value="equity">Equity</MenuItem>
                        <MenuItem value="debt">Debt</MenuItem>
                        <MenuItem value="hybrid">Hybrid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Monthly Amount"
                      type="number"
                      value={newInvestment.monthlyAmount}
                      onChange={(e) => setNewInvestment({...newInvestment, monthlyAmount: e.target.value})}
                      InputProps={{
                        startAdornment: '₹'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAddInvestment}
                      sx={{ height: '56px' }}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              )}

              <List>
                {monthlyInvestments.length === 0 ? (
                  <Alert severity="info">
                    No investments added yet. Click "Customize Plan" to add monthly investments.
                  </Alert>
                ) : (
                  monthlyInvestments.map((investment) => (
                    <ListItem key={investment.id} divider>
                      <ListItemText
                        primary={investment.fundName}
                        secondary={`${investment.category} - ${formatCurrency(investment.monthlyAmount)}/month`}
                      />
                      {editMode && (
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => handleRemoveInvestment(investment.id)}>
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))
                )}
              </List>

              <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
                <Typography variant="body1" color="primary.contrastText">
                  Total Monthly Investment: {formatCurrency(
                    monthlyInvestments.reduce((sum, inv) => sum + parseFloat(inv.monthlyAmount || 0), 0)
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Projected Returns Tab */}
          {activeTab === 2 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Projected Corpus Growth</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Years</TableCell>
                          <TableCell align="right">Projected Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[1, 3, 5, 10, 15, 20].map((years) => {
                          const monthlyAmount = investmentMetrics.availableForInvestment;
                          const projectedValue = calculateProjectedCorpus(monthlyAmount, years);
                          return (
                            <TableRow key={years}>
                              <TableCell>{years} {years === 1 ? 'Year' : 'Years'}</TableCell>
                              <TableCell align="right">{formatCurrency(projectedValue)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Alert severity="success">
                    <Typography variant="subtitle2" gutterBottom>Investment Summary</Typography>
                    <Typography variant="body2">
                      By investing {formatCurrency(investmentMetrics.availableForInvestment)} monthly,
                      you can build a corpus of {formatCurrency(
                        calculateProjectedCorpus(investmentMetrics.availableForInvestment, 20)
                      )} in 20 years (assuming 12% annual returns).
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvestmentStrategy;