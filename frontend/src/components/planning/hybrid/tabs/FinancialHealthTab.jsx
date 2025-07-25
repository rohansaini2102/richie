import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Assessment,
  MonetizationOn,
  TrendingUp,
  AccountBalance,
  Person,
  Security,
  Flag,
  Business
} from '@mui/icons-material';

// Helper function to calculate total loan EMI from debt data
const calculateTotalLoanEMI = (clientData) => {
  if (!clientData) return 0;
  
  let totalEMI = 0;
  
  // Check if debtsAndLiabilities exists and has the nested structure
  if (clientData.debtsAndLiabilities) {
    const debts = clientData.debtsAndLiabilities;
    
    // Calculate EMI from each loan type
    if (debts.homeLoan?.hasLoan && debts.homeLoan.monthlyEMI) {
      totalEMI += parseFloat(debts.homeLoan.monthlyEMI) || 0;
    }
    if (debts.carLoan?.hasLoan && debts.carLoan.monthlyEMI) {
      totalEMI += parseFloat(debts.carLoan.monthlyEMI) || 0;
    }
    if (debts.personalLoan?.hasLoan && debts.personalLoan.monthlyEMI) {
      totalEMI += parseFloat(debts.personalLoan.monthlyEMI) || 0;
    }
    if (debts.otherLoan?.hasLoan && debts.otherLoan.monthlyEMI) {
      totalEMI += parseFloat(debts.otherLoan.monthlyEMI) || 0;
    }
  }
  
  // If we got a valid EMI from debt calculations, use it
  if (totalEMI > 0) {
    return totalEMI;
  }
  
  // Fallback to calculatedFinancials if available
  if (clientData.calculatedFinancials?.monthlyEMIPayments) {
    return clientData.calculatedFinancials.monthlyEMIPayments;
  }
  
  return 0;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const FinancialHealthTab = ({ clientData, planData, financialMetrics, onUpdate }) => {
  const theme = useTheme();

  if (!clientData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body1" color="text.secondary">
          No client data available
        </Typography>
      </Box>
    );
  }

  // Calculate financial metrics
  const monthlyIncome = clientData.totalMonthlyIncome || 0;
  const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
  const surplus = monthlyIncome - monthlyExpenses;
  const totalLoanEMI = calculateTotalLoanEMI(clientData);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Personal Information Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Person color="primary" />
          <Typography variant="h6" fontWeight="bold">Personal Information</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Name</Typography>
            <Typography variant="body1">{clientData.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body1">{clientData.age || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body1">{clientData.phone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{clientData.email || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Marital Status</Typography>
            <Typography variant="body1">{clientData.maritalStatus || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Dependents</Typography>
            <Typography variant="body1">{clientData.numberOfDependents || 0}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Occupation</Typography>
            <Typography variant="body1">{clientData.occupation || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Annual Income</Typography>
            <Typography variant="body1">{formatCurrency(clientData.annualIncome || 0)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Summary Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AccountBalance color="primary" />
          <Typography variant="h6" fontWeight="bold">Financial Summary</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Monthly Income</Typography>
            <Typography variant="h6" color="success.main">{formatCurrency(monthlyIncome)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Monthly Expenses</Typography>
            <Typography variant="h6" color="error.main">{formatCurrency(monthlyExpenses)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Monthly Surplus</Typography>
            <Typography variant="h6" color={surplus >= 0 ? "success.main" : "error.main"}>
              {formatCurrency(surplus)}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Savings Rate</Typography>
            <Typography variant="h6">
              {monthlyIncome > 0 ? ((surplus / monthlyIncome) * 100).toFixed(1) : 0}%
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        {/* Detailed Expense Breakdown */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Monthly Expense Breakdown</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Housing/Rent</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.housingRent || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Food & Utilities</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.groceriesUtilitiesFood || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Transportation</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.transportation || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Education</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.education || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Healthcare</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.healthcare || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Entertainment</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.entertainment || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Insurance</Typography>
            <Typography variant="body1">{formatCurrency(clientData.monthlyExpenses?.insurancePremiums || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Loan EMIs</Typography>
            <Typography variant="body1">{formatCurrency(totalLoanEMI)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Assets & Investments Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" fontWeight="bold">Assets & Investments</Typography>
        </Box>
        <Grid container spacing={3}>
          {/* Bank Accounts */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Savings Account</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.bankAccounts?.savingsAccount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Current Account</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.bankAccounts?.currentAccount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Fixed Deposits</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.bankAccounts?.fixedDeposits || 0)}</Typography>
          </Grid>
          
          {/* Real Estate */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Primary Residence</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.realEstate?.primaryResidence || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Investment Property</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.realEstate?.investmentProperties || 0)}</Typography>
          </Grid>
          
          {/* Investments */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Mutual Funds</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.investments?.mutualFunds || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Stocks/Equity</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.investments?.stocks || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">EPF/PPF</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.investments?.epfPpf || 0)}</Typography>
          </Grid>
          
          {/* Other Assets */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Gold/Jewelry</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.otherAssets?.gold || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Vehicles</Typography>
            <Typography variant="body1">{formatCurrency(clientData.assets?.otherAssets?.vehicles || 0)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Debts & Liabilities Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MonetizationOn color="primary" />
          <Typography variant="h6" fontWeight="bold">Debts & Liabilities</Typography>
        </Box>
        <Grid container spacing={3}>
          {/* Home Loan */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Home Loan Outstanding</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.homeLoan?.outstandingAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Home Loan EMI</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.homeLoan?.monthlyEMI || 0)}</Typography>
          </Grid>
          
          {/* Car Loan */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Car Loan Outstanding</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.carLoan?.outstandingAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Car Loan EMI</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.carLoan?.monthlyEMI || 0)}</Typography>
          </Grid>
          
          {/* Personal Loan */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Personal Loan Outstanding</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.personalLoan?.outstandingAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Personal Loan EMI</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.personalLoan?.monthlyEMI || 0)}</Typography>
          </Grid>
          
          {/* Other Loans */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Other Loans Outstanding</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.otherLoan?.outstandingAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Other Loans EMI</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.otherLoan?.monthlyEMI || 0)}</Typography>
          </Grid>
          
          {/* Credit Cards */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Credit Card Outstanding</Typography>
            <Typography variant="body1">{formatCurrency(clientData.debtsAndLiabilities?.creditCardDebt || 0)}</Typography>
          </Grid>
          
          {/* Total EMI */}
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Total Monthly EMI</Typography>
            <Typography variant="h6" color="error.main">{formatCurrency(totalLoanEMI)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Insurance Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Security color="primary" />
          <Typography variant="h6" fontWeight="bold">Insurance Coverage</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Life Insurance</Typography>
            <Typography variant="body1">{formatCurrency(clientData.insurance?.lifeInsurance?.coverageAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Life Insurance Premium</Typography>
            <Typography variant="body1">{formatCurrency(clientData.insurance?.lifeInsurance?.annualPremium || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Health Insurance</Typography>
            <Typography variant="body1">{formatCurrency(clientData.insurance?.healthInsurance?.coverageAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Health Insurance Premium</Typography>
            <Typography variant="body1">{formatCurrency(clientData.insurance?.healthInsurance?.annualPremium || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Vehicle Insurance</Typography>
            <Typography variant="body1">{formatCurrency(clientData.insurance?.vehicleInsurance?.coverageAmount || 0)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Property Insurance</Typography>
            <Typography variant="body1">{formatCurrency(clientData.insurance?.propertyInsurance?.coverageAmount || 0)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Goals Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Flag color="primary" />
          <Typography variant="h6" fontWeight="bold">Financial Goals</Typography>
        </Box>
        {clientData.goals && clientData.goals.length > 0 ? (
          <Grid container spacing={2}>
            {clientData.goals.map((goal, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{goal.goalName || `Goal ${index + 1}`}</Typography>
                    <Typography variant="body2" color="text.secondary">Target: {formatCurrency(goal.targetAmount || 0)}</Typography>
                    <Typography variant="body2" color="text.secondary">Time Frame: {goal.timeFrame || 'Not specified'}</Typography>
                    <Typography variant="body2" color="text.secondary">Priority: {goal.priority || 'Medium'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">No financial goals defined</Typography>
        )}
      </Paper>

      {/* Financial Health Indicator */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Assessment color="primary" />
          <Typography variant="h6" fontWeight="bold">Financial Health Assessment</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Overall Health</Typography>
            <Typography variant="body1">
              {surplus >= monthlyIncome * 0.2 ? '✅ Excellent (20%+ savings)' : 
               surplus >= monthlyIncome * 0.1 ? '✅ Good (10%+ savings)' : 
               surplus > 0 ? '⚠️ Moderate (low savings)' : '❌ Poor (deficit)'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Expense Ratio</Typography>
            <Typography variant="body1">
              {monthlyIncome > 0 ? ((monthlyExpenses / monthlyIncome) * 100).toFixed(1) : 0}%
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">EMI to Income Ratio</Typography>
            <Typography variant="body1">
              {monthlyIncome > 0 ? ((totalLoanEMI / monthlyIncome) * 100).toFixed(1) : 0}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>

    </Box>
  );
};

export default FinancialHealthTab;