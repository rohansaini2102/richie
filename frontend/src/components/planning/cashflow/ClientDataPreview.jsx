import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore,
  Person,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  ContentCopy,
  Visibility,
  VisibilityOff,
  Elderly,
  Security,
  TrackChanges,
  Assessment
} from '@mui/icons-material';
import { clientAPI } from '../../../services/api';

const ClientDataPreview = ({ clientId, clientData, onProceed, onCancel }) => {
  const [currentClientData, setCurrentClientData] = useState(clientData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState('personal');
  const [showRawData, setShowRawData] = useState(false);
  const [dataCompleteness, setDataCompleteness] = useState(0);

  useEffect(() => {
    console.group('🔍 [ClientDataPreview] Component Mount/Update');
    console.log('📋 Props Received:', {
      clientId,
      hasClientDataProp: !!clientData,
      clientDataType: typeof clientData,
      isClientDataObject: clientData && typeof clientData === 'object' && !Array.isArray(clientData),
      clientDataSize: clientData ? JSON.stringify(clientData).length : 0,
      timestamp: new Date().toISOString()
    });

    if (clientData && typeof clientData === 'object' && Object.keys(clientData).length > 0) {
      console.log('✅ [ClientDataPreview] Using provided client data (NO API CALL)');
      console.log('👤 Provided Client Data Analysis:', {
        firstName: clientData?.firstName,
        lastName: clientData?.lastName,
        email: clientData?.email,
        hasPersonalInfo: !!(clientData?.firstName && clientData?.lastName),
        hasFinancialInfo: !!(clientData?.totalMonthlyIncome || clientData?.totalMonthlyExpenses),
        hasAssets: !!clientData?.assets,
        hasDebts: !!clientData?.debtsAndLiabilities,
        allKeys: Object.keys(clientData),
        completionPercentage: clientData?.completionPercentage
      });
      
      setCurrentClientData(clientData);
      calculateDataCompleteness(clientData);
      setLoading(false);
      setError(null);
      console.log('✅ State updated with provided data');
    } else {
      console.warn('⚠️ [ClientDataPreview] No valid client data provided, fetching from API...');
      console.log('🔍 Fallback Reason:', {
        hasClientData: !!clientData,
        isObject: typeof clientData === 'object',
        isArray: Array.isArray(clientData),
        keyCount: clientData ? Object.keys(clientData).length : 0,
        clientDataValue: clientData
      });
      fetchClientData();
    }
    console.groupEnd();
  }, [clientData, clientId]);

  const fetchClientData = async () => {
    try {
      console.log('🔄 [ClientDataPreview] Starting to fetch client data:', { clientId });
      setLoading(true);
      
      const clientData = await clientAPI.getClientById(clientId);
      console.log('✅ [ClientDataPreview] API response received:', {
        hasData: !!clientData,
        hasFirstName: !!clientData?.firstName,
        hasLastName: !!clientData?.lastName,
        hasDebts: !!clientData?.debtsAndLiabilities,
        dataKeys: Object.keys(clientData || {}).slice(0, 10) // First 10 keys only
      });
      
      setCurrentClientData(clientData);
      calculateDataCompleteness(clientData);
      setError(null);
      console.log('✅ [ClientDataPreview] Client data set successfully');
    } catch (err) {
      console.error('❌ [ClientDataPreview] Error fetching client data:', {
        error: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      setError('Failed to fetch client data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDataCompleteness = (data) => {
    const sectionsToCheck = [
      // Step 1: Personal Information (25% weight)
      { fields: ['firstName', 'lastName', 'email', 'phoneNumber'], weight: 25 },
      // Step 2: Income & Expenses (25% weight)
      { fields: ['totalMonthlyIncome', 'totalMonthlyExpenses'], weight: 25 },
      // Step 3: Retirement Planning (15% weight)
      { fields: ['retirementPlanning'], weight: 15 },
      // Step 4: Assets (10% weight)
      { fields: ['assets'], weight: 10 },
      // Step 5: Debts (10% weight)
      { fields: ['debtsAndLiabilities'], weight: 10 },
      // Step 6: Insurance (7.5% weight)
      { fields: ['insuranceCoverage'], weight: 7.5 },
      // Step 7: Goals & Risk Profile (7.5% weight)
      { fields: ['enhancedFinancialGoals', 'enhancedRiskProfile'], weight: 7.5 }
    ];
    
    let totalCompleteness = 0;
    
    sectionsToCheck.forEach(section => {
      const filledFields = section.fields.filter(field => {
        const fieldValue = data[field];
        if (!fieldValue) return false;
        if (typeof fieldValue === 'object') {
          return Object.keys(fieldValue).length > 0;
        }
        return true;
      });
      
      const sectionCompleteness = (filledFields.length / section.fields.length) * section.weight;
      totalCompleteness += sectionCompleteness;
    });
    
    setDataCompleteness(Math.round(totalCompleteness));
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  if (loading) {
    console.log('⏳ [ClientDataPreview] Rendering loading state');
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading client data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    console.error('❌ [ClientDataPreview] Rendering error state:', error);
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Failed to Load Client Data</Typography>
          <Typography variant="body2">{error}</Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
            Check console for detailed error information
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!currentClientData) {
    console.error('❌ [ClientDataPreview] Rendering no-data state');
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>No Client Data Available</Typography>
          <Typography variant="body2">
            Client data could not be loaded. This might be due to:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <li>Network connectivity issues</li>
            <li>Client data not found in database</li>
            <li>Incorrect client ID</li>
            <li>API server issues</li>
          </Box>
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
            Client ID: {clientId} | Check console for detailed information
          </Typography>
        </Alert>
      </Box>
    );
  }

  const renderPersonalInfo = () => {
    const address = currentClientData.address || {};
    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Name</Typography>
            <Typography variant="body1">{currentClientData.firstName} {currentClientData.lastName}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{currentClientData.email}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body1">{currentClientData.phoneNumber || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">PAN</Typography>
            <Typography variant="body1">{currentClientData.panNumber || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
            <Typography variant="body1">
              {currentClientData.dateOfBirth ? new Date(currentClientData.dateOfBirth).toLocaleDateString('en-IN') : 'Not provided'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body1">
              {currentClientData.dateOfBirth ? Math.floor((new Date() - new Date(currentClientData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Marital Status</Typography>
            <Typography variant="body1">{currentClientData.maritalStatus || 'Not specified'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Dependents</Typography>
            <Typography variant="body1">{currentClientData.numberOfDependents || 0}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Occupation</Typography>
            <Typography variant="body1">{currentClientData.occupation || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Income Type</Typography>
            <Typography variant="body1">{currentClientData.incomeType || 'Not specified'}</Typography>
          </Grid>
        </Grid>
        
        {(address.street || address.city || address.state) && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>Address Information</Typography>
            <Typography variant="body2">
              {[address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean).join(', ') || 'Address not provided'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderFinancialSummary = () => {
    console.log('💰 [Financial Summary] Raw client data:', {
      totalMonthlyIncome: currentClientData.totalMonthlyIncome,
      totalMonthlyExpenses: currentClientData.totalMonthlyExpenses,
      annualIncome: currentClientData.annualIncome,
      additionalIncome: currentClientData.additionalIncome
    });
    
    const monthlyIncome = currentClientData.totalMonthlyIncome || 
                         (currentClientData.annualIncome ? currentClientData.annualIncome / 12 : 0) ||
                         0;
    const monthlyExpenses = currentClientData.totalMonthlyExpenses || 0;
    const surplus = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome * 100).toFixed(1) : 0;
    const annualIncome = monthlyIncome * 12;
    const annualExpenses = monthlyExpenses * 12;
    
    console.log('💰 [Financial Summary] Calculated values:', {
      monthlyIncome,
      monthlyExpenses,
      surplus,
      savingsRate
    });

    return (
      <Box>
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">DEBUG: Income={monthlyIncome}, Expenses={monthlyExpenses}, Surplus={surplus}, Rate={savingsRate}%</Typography>
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Income</Typography>
                <Typography variant="h5" color="success.main">
                  {monthlyIncome > 0 ? formatCurrency(monthlyIncome) : '₹0 (No data)'}
                </Typography>
                <Typography variant="caption">
                  {monthlyIncome > 0 ? `Annual: ${formatCurrency(annualIncome)}` : 'Check income fields'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Expenses</Typography>
                <Typography variant="h5" color="error.main">
                  {monthlyExpenses > 0 ? formatCurrency(monthlyExpenses) : '₹0 (No data)'}
                </Typography>
                <Typography variant="caption">
                  {monthlyExpenses > 0 ? `Annual: ${formatCurrency(annualExpenses)}` : 'Check expense fields'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Surplus</Typography>
                <Typography variant="h5" color={surplus >= 0 ? 'info.main' : 'error.main'}>
                  {formatCurrency(surplus)}
                </Typography>
                <Typography variant="caption">
                  {monthlyIncome > 0 ? `Annual: ${formatCurrency(surplus * 12)}` : 'Need income data'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Savings Rate</Typography>
                <Typography variant="h5" color="primary.main">
                  {monthlyIncome > 0 ? `${savingsRate}%` : 'N/A'}
                </Typography>
                <Typography variant="caption">
                  {currentClientData.incomeType || 'No income type specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Expense Breakdown ({monthlyExpenses > 0 ? 'Available' : 'No data'})</Typography>
          <Grid container spacing={2}>
            {currentClientData.expenseBreakdown?.showBreakdown ? (
              <>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Housing/Rent</Typography><Typography variant="body1">{formatCurrency(currentClientData.expenseBreakdown.housingRent || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Food & Groceries</Typography><Typography variant="body1">{formatCurrency(currentClientData.expenseBreakdown.foodGroceries || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Transportation</Typography><Typography variant="body1">{formatCurrency(currentClientData.expenseBreakdown.transportation || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Utilities</Typography><Typography variant="body1">{formatCurrency(currentClientData.expenseBreakdown.utilities || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Entertainment</Typography><Typography variant="body1">{formatCurrency(currentClientData.expenseBreakdown.entertainment || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Healthcare</Typography><Typography variant="body1">{formatCurrency(currentClientData.expenseBreakdown.healthcare || 0)}</Typography></Grid>
              </>
            ) : currentClientData.monthlyExpenses ? (
              <>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Housing/Rent</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.housingRent || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Food & Utilities</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.groceriesUtilitiesFood || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Transportation</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.transportation || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Education</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.education || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Healthcare</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.healthcare || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Entertainment</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.entertainment || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Insurance</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.insurancePremiums || 0)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Loan EMIs</Typography><Typography variant="body1">{formatCurrency(currentClientData.monthlyExpenses.loanEmis || 0)}</Typography></Grid>
              </>
            ) : (
              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Detailed expense breakdown not available. Only total monthly expenses provided.</Typography></Grid>
            )}
          </Grid>
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Financial Health: {surplus >= monthlyIncome * 0.2 ? '✅ Excellent (20%+ savings)' : surplus >= monthlyIncome * 0.1 ? '✅ Good (10%+ savings)' : surplus > 0 ? '⚠️ Moderate (low savings)' : '❌ Poor (deficit)'} | 
              Expense Ratio: {monthlyIncome > 0 ? ((monthlyExpenses / monthlyIncome) * 100).toFixed(1) : 0}%
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderAssets = () => {
    const assets = currentClientData.assets || {};
    const inv = assets.investments || {};
    const casData = currentClientData.casData;
    const totalAssets = (assets.cashBankSavings || 0) + (assets.realEstate || 0) + 
      Object.values(inv).reduce((sum, cat) => sum + Object.values(cat || {}).reduce((s, v) => s + (v || 0), 0), 0);

    return (
      <Box>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card><CardContent><Typography color="text.secondary">Total Assets</Typography><Typography variant="h5" color="primary">{formatCurrency(totalAssets)}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent><Typography color="text.secondary">Cash & Savings</Typography><Typography variant="h5" color="success.main">{formatCurrency(assets.cashBankSavings)}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent><Typography color="text.secondary">Real Estate</Typography><Typography variant="h5" color="info.main">{formatCurrency(assets.realEstate)}</Typography></CardContent></Card>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom>Investment Portfolio</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="bold">Equity Investments</Typography>
            <Typography variant="body2">Mutual Funds: {formatCurrency(inv.equity?.mutualFunds)}</Typography>
            <Typography variant="body2">Direct Stocks: {formatCurrency(inv.equity?.directStocks)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="bold">Fixed Income</Typography>
            <Typography variant="body2">PPF: {formatCurrency(inv.fixedIncome?.ppf)}</Typography>
            <Typography variant="body2">EPF: {formatCurrency(inv.fixedIncome?.epf)}</Typography>
            <Typography variant="body2">NPS: {formatCurrency(inv.fixedIncome?.nps)}</Typography>
            <Typography variant="body2">Fixed Deposits: {formatCurrency(inv.fixedIncome?.fixedDeposits)}</Typography>
          </Grid>
        </Grid>

        {casData?.casStatus === 'parsed' && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>CAS Portfolio Analysis</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">Portfolio Value: {formatCurrency(casData.parsedData?.summary?.total_value)}</Typography>
                <Typography variant="body2">Demat Accounts: {casData.parsedData?.demat_accounts?.length || 0}</Typography>
                <Typography variant="body2">Mutual Fund Folios: {casData.parsedData?.mutual_funds?.length || 0}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">Asset Allocation:</Typography>
                <Typography variant="body2">Equity: {casData.parsedData?.summary?.asset_allocation?.equity_percentage || 0}%</Typography>
                <Typography variant="body2">Debt: {casData.parsedData?.summary?.asset_allocation?.debt_percentage || 0}%</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  const renderDebts = () => {
    const debts = currentClientData.debtsAndLiabilities || {};
    const totalDebt = Object.values(debts).reduce((sum, debt) => {
      if (debt && debt.hasLoan) {
        return sum + (debt.outstandingAmount || debt.totalOutstanding || 0);
      }
      return sum;
    }, 0);

    const totalEMI = Object.values(debts).reduce((sum, debt) => {
      if (debt && debt.hasLoan) {
        return sum + (debt.monthlyEMI || debt.monthlyPayment || 0);
      }
      return sum;
    }, 0);

    return (
      <Box>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Total Outstanding</Typography>
            <Typography variant="h6" color="error.main">{formatCurrency(totalDebt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Total Monthly EMI</Typography>
            <Typography variant="h6" color="error.main">{formatCurrency(totalEMI)}</Typography>
          </Grid>
        </Grid>
        
        {Object.entries(debts).map(([type, debt]) => {
          if (!debt || !debt.hasLoan) return null;
          return (
            <Box key={type} mb={2}>
              <Typography variant="subtitle2" color="primary">
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
              <Grid container spacing={2} ml={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Outstanding</Typography>
                  <Typography variant="body2">
                    {formatCurrency(debt.outstandingAmount || debt.totalOutstanding)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">EMI</Typography>
                  <Typography variant="body2">
                    {formatCurrency(debt.monthlyEMI || debt.monthlyPayment)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
                  <Typography variant="body2">{debt.interestRate || 'N/A'}%</Typography>
                </Grid>
              </Grid>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderRetirementPlanning = () => {
    const retirement = currentClientData.retirementPlanning || {};
    const currentAge = retirement.currentAge || (currentClientData.dateOfBirth ? 
      Math.floor((new Date() - new Date(currentClientData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    );
    const retirementAge = retirement.retirementAge || 60;
    const yearsToRetirement = currentAge ? Math.max(0, retirementAge - currentAge) : null;
    const currentCorpus = retirement.currentRetirementCorpus || 0;
    const targetCorpus = retirement.targetRetirementCorpus || 0;
    const corpusProgress = targetCorpus > 0 ? Math.min(100, (currentCorpus / targetCorpus) * 100) : 0;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Current Age</Typography>
                <Typography variant="h5" color="primary.main">
                  {currentAge || 'Not provided'}
                </Typography>
                {currentAge && <Typography variant="caption">years old</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Retirement Age</Typography>
                <Typography variant="h5" color="info.main">
                  {retirementAge}
                </Typography>
                <Typography variant="caption">years</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Years to Retirement</Typography>
                <Typography variant="h5" color={yearsToRetirement && yearsToRetirement < 10 ? 'warning.main' : 'success.main'}>
                  {yearsToRetirement !== null ? yearsToRetirement : 'Unknown'}
                </Typography>
                {yearsToRetirement !== null && <Typography variant="caption">years remaining</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Retirement Readiness</Typography>
                <Typography variant="h5" color={corpusProgress > 50 ? 'success.main' : corpusProgress > 25 ? 'warning.main' : 'error.main'}>
                  {corpusProgress.toFixed(1)}%
                </Typography>
                <Typography variant="caption">corpus progress</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Retirement Corpus Progress</Typography>
          <Box mb={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">Current: {formatCurrency(currentCorpus)}</Typography>
              <Typography variant="body2">Target: {formatCurrency(targetCorpus)}</Typography>
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={corpusProgress} 
            sx={{ 
              height: 12, 
              borderRadius: 6,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: corpusProgress > 50 ? 'success.main' : 
                                corpusProgress > 25 ? 'warning.main' : 'error.main'
              }
            }}
          />
          {targetCorpus > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Gap: {formatCurrency(Math.max(0, targetCorpus - currentCorpus))} | 
              Monthly savings needed: {yearsToRetirement > 0 ? 
                formatCurrency(Math.max(0, targetCorpus - currentCorpus) / (yearsToRetirement * 12)) : 'Calculate based on timeline'
              }
            </Typography>
          )}
        </Box>

        {retirement.hasRetirementCorpus === false && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              No existing retirement savings detected. Consider starting retirement planning immediately.
            </Typography>
          </Alert>
        )}
      </Box>
    );
  };

  const renderInsuranceCoverage = () => {
    const insurance = currentClientData.insuranceCoverage || {};
    const life = insurance.lifeInsurance || {};
    const health = insurance.healthInsurance || {};
    const vehicle = insurance.vehicleInsurance || {};
    const other = insurance.otherInsurance || {};

    const totalAnnualPremium = (life.annualPremium || 0) + 
                               (health.annualPremium || 0) + 
                               (vehicle.annualPremium || 0) + 
                               (other.annualPremium || 0);

    const totalCoverage = (life.totalCoverAmount || 0) + (health.totalCoverAmount || 0);

    return (
      <Box>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Coverage</Typography>
                <Typography variant="h5" color="primary.main">
                  {formatCurrency(totalCoverage)}
                </Typography>
                <Typography variant="caption">Life + Health Insurance</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Annual Premiums</Typography>
                <Typography variant="h5" color="error.main">
                  {formatCurrency(totalAnnualPremium)}
                </Typography>
                <Typography variant="caption">All insurance premiums</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Life Insurance */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Life Insurance {life.hasInsurance ? '✓' : '✗'}
          </Typography>
          {life.hasInsurance ? (
            <Grid container spacing={2} ml={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Coverage Amount</Typography>
                <Typography variant="body2">{formatCurrency(life.totalCoverAmount)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Annual Premium</Typography>
                <Typography variant="body2">{formatCurrency(life.annualPremium)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Insurance Type</Typography>
                <Typography variant="body2">{life.insuranceType || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Coverage Ratio</Typography>
                <Typography variant="body2" color={
                  ((life.totalCoverAmount || 0) / ((currentClientData.totalMonthlyIncome || 0) * 12)) >= 10 ? 'success.main' : 'warning.main'
                }>
                  {currentClientData.totalMonthlyIncome > 0 ? 
                    `${((life.totalCoverAmount || 0) / (currentClientData.totalMonthlyIncome * 12)).toFixed(1)}x annual income` : 
                    'Calculate ratio'
                  }
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="warning" sx={{ ml: 2 }}>
              <Typography variant="body2">
                No life insurance coverage found. Recommended coverage: {formatCurrency((currentClientData.totalMonthlyIncome || 0) * 12 * 10)}
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Health Insurance */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Health Insurance {health.hasInsurance ? '✓' : '✗'}
          </Typography>
          {health.hasInsurance ? (
            <Grid container spacing={2} ml={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Coverage Amount</Typography>
                <Typography variant="body2">{formatCurrency(health.totalCoverAmount)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Annual Premium</Typography>
                <Typography variant="body2">{formatCurrency(health.annualPremium)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Family Members</Typography>
                <Typography variant="body2">{health.familyMembers || 1} member(s)</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Per Person</Typography>
                <Typography variant="body2">
                  {health.familyMembers > 0 ? formatCurrency((health.totalCoverAmount || 0) / health.familyMembers) : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="error" sx={{ ml: 2 }}>
              <Typography variant="body2">
                No health insurance coverage found. This is critical for financial security.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Vehicle Insurance */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Vehicle Insurance {vehicle.hasInsurance ? '✓' : '✗'}
          </Typography>
          {vehicle.hasInsurance ? (
            <Grid container spacing={2} ml={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Annual Premium</Typography>
                <Typography variant="body2">{formatCurrency(vehicle.annualPremium)}</Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" ml={2}>
              No vehicle insurance recorded
            </Typography>
          )}
        </Box>

        {/* Other Insurance */}
        {other.hasInsurance && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Other Insurance ✓
            </Typography>
            <Grid container spacing={2} ml={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Insurance Types</Typography>
                <Typography variant="body2">{other.insuranceTypes || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Annual Premium</Typography>
                <Typography variant="body2">{formatCurrency(other.annualPremium)}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Insurance Adequacy Assessment */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Insurance Adequacy Assessment</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Life Insurance Status</Typography>
              <Chip 
                label={
                  !life.hasInsurance ? 'Missing' :
                  ((life.totalCoverAmount || 0) / ((currentClientData.totalMonthlyIncome || 0) * 12)) >= 10 ? 'Adequate' :
                  ((life.totalCoverAmount || 0) / ((currentClientData.totalMonthlyIncome || 0) * 12)) >= 5 ? 'Moderate' : 'Insufficient'
                }
                color={
                  !life.hasInsurance ? 'error' :
                  ((life.totalCoverAmount || 0) / ((currentClientData.totalMonthlyIncome || 0) * 12)) >= 10 ? 'success' :
                  ((life.totalCoverAmount || 0) / ((currentClientData.totalMonthlyIncome || 0) * 12)) >= 5 ? 'warning' : 'error'
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Health Insurance Status</Typography>
              <Chip 
                label={health.hasInsurance ? 'Covered' : 'Not Covered'}
                color={health.hasInsurance ? 'success' : 'error'}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  const renderFinancialGoals = () => {
    const goals = currentClientData.enhancedFinancialGoals || {};
    const emergency = goals.emergencyFund || {};
    const childEducation = goals.childEducation || {};
    const homePurchase = goals.homePurchase || {};
    const customGoals = goals.customGoals || [];

    const emergencyTarget = emergency.targetAmount || (currentClientData.totalMonthlyExpenses || 0) * 6;
    const currentEmergencyFund = currentClientData.assets?.cashBankSavings || 0;
    const emergencyProgress = emergencyTarget > 0 ? Math.min(100, (currentEmergencyFund / emergencyTarget) * 100) : 0;

    return (
      <Box>
        {/* Emergency Fund */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Emergency Fund ({emergency.priority || 'High'} Priority)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Target Amount</Typography>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(emergencyTarget)}
                  </Typography>
                  <Typography variant="caption">6 months expenses</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Current Savings</Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(currentEmergencyFund)}
                  </Typography>
                  <Typography variant="caption">Available cash</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Progress</Typography>
                  <Typography variant="h6" color={emergencyProgress >= 100 ? 'success.main' : emergencyProgress >= 50 ? 'warning.main' : 'error.main'}>
                    {emergencyProgress.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">completion</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={emergencyProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: emergencyProgress >= 100 ? 'success.main' : 
                                  emergencyProgress >= 50 ? 'warning.main' : 'error.main'
                }
              }}
            />
            {emergencyProgress < 100 && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Shortfall: {formatCurrency(Math.max(0, emergencyTarget - currentEmergencyFund))}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Child Education */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Child Education {childEducation.isApplicable ? '✓' : '✗'}
          </Typography>
          {childEducation.isApplicable ? (
            <Grid container spacing={2} ml={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Target Amount</Typography>
                <Typography variant="body2">{formatCurrency(childEducation.targetAmount)}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Target Year</Typography>
                <Typography variant="body2">{childEducation.targetYear || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Years Remaining</Typography>
                <Typography variant="body2" color={
                  childEducation.targetYear && (childEducation.targetYear - new Date().getFullYear()) < 5 ? 'warning.main' : 'success.main'
                }>
                  {childEducation.targetYear ? (childEducation.targetYear - new Date().getFullYear()) : 'Unknown'} years
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" ml={2}>
              Not applicable or not planned
            </Typography>
          )}
        </Box>

        {/* Home Purchase */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Home Purchase {homePurchase.isApplicable ? '✓' : '✗'}
          </Typography>
          {homePurchase.isApplicable ? (
            <Grid container spacing={2} ml={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Target Amount</Typography>
                <Typography variant="body2">{formatCurrency(homePurchase.targetAmount)}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Target Year</Typography>
                <Typography variant="body2">{homePurchase.targetYear || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Years Remaining</Typography>
                <Typography variant="body2">
                  {homePurchase.targetYear ? (homePurchase.targetYear - new Date().getFullYear()) : 'Unknown'} years
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" ml={2}>
              Not applicable or not planned
            </Typography>
          )}
        </Box>

        {/* Custom Goals */}
        {customGoals.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Custom Goals ({customGoals.length})
            </Typography>
            {customGoals.map((goal, index) => (
              <Box key={index} ml={2} mb={2}>
                <Typography variant="body2" fontWeight="bold">{goal.goalName}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary">Target Amount</Typography>
                    <Typography variant="body2">{formatCurrency(goal.targetAmount)}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary">Target Year</Typography>
                    <Typography variant="body2">{goal.targetYear}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary">Priority</Typography>
                    <Chip 
                      label={goal.priority} 
                      size="small" 
                      color={goal.priority === 'High' ? 'error' : goal.priority === 'Medium' ? 'warning' : 'default'}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary">Time Remaining</Typography>
                    <Typography variant="body2">
                      {goal.targetYear ? Math.max(0, goal.targetYear - new Date().getFullYear()) : 'Unknown'} years
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}

        {/* Goals Summary */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Goals Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Total Goal Amount</Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(
                  emergencyTarget + 
                  (childEducation.isApplicable ? childEducation.targetAmount || 0 : 0) + 
                  (homePurchase.isApplicable ? homePurchase.targetAmount || 0 : 0) + 
                  customGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0)
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Active Goals</Typography>
              <Typography variant="h6" color="info.main">
                {(emergency.priority !== 'Not Applicable' ? 1 : 0) + 
                 (childEducation.isApplicable ? 1 : 0) + 
                 (homePurchase.isApplicable ? 1 : 0) + 
                 customGoals.length}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Emergency Fund Status</Typography>
              <Chip 
                label={
                  emergencyProgress >= 100 ? 'Complete' :
                  emergencyProgress >= 50 ? 'Partial' : 'Needs Attention'
                }
                color={
                  emergencyProgress >= 100 ? 'success' :
                  emergencyProgress >= 50 ? 'warning' : 'error'
                }
                size="small"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Goal Planning Recommendations */}
        {(childEducation.isApplicable || homePurchase.isApplicable || customGoals.length > 0) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Consider setting up systematic investment plans (SIPs) to achieve your long-term goals. 
              Start with emergency fund completion, then focus on time-bound goals.
            </Typography>
          </Alert>
        )}
      </Box>
    );
  };

  const renderRiskProfileAndInvestment = () => {
    const riskProfile = currentClientData.enhancedRiskProfile || {};
    const monthlyIncome = currentClientData.totalMonthlyIncome || 0;
    const monthlyExpenses = currentClientData.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const investmentCapacity = riskProfile.monthlyInvestmentCapacity || Math.max(0, monthlySurplus * 0.8);

    const getRiskColor = (tolerance) => {
      switch(tolerance) {
        case 'Conservative': return 'info.main';
        case 'Moderate': return 'warning.main';
        case 'Aggressive': return 'error.main';
        default: return 'text.secondary';
      }
    };

    const getExperienceLevel = (experience) => {
      switch(experience) {
        case 'Beginner (0-2 years)': return { level: 'Beginner', color: 'error.main' };
        case 'Intermediate (2-5 years)': return { level: 'Intermediate', color: 'warning.main' };
        case 'Experienced (5-10 years)': return { level: 'Experienced', color: 'info.main' };
        case 'Expert (10+ years)': return { level: 'Expert', color: 'success.main' };
        default: return { level: 'Not specified', color: 'text.secondary' };
      }
    };

    const experienceData = getExperienceLevel(riskProfile.investmentExperience);

    return (
      <Box>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Investment Experience</Typography>
                <Typography variant="h6" color={experienceData.color}>
                  {experienceData.level}
                </Typography>
                <Typography variant="caption">
                  {riskProfile.investmentExperience || 'Assessment needed'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Risk Tolerance</Typography>
                <Typography variant="h6" color={getRiskColor(riskProfile.riskTolerance)}>
                  {riskProfile.riskTolerance || 'Not assessed'}
                </Typography>
                <Typography variant="caption">
                  {riskProfile.riskTolerance === 'Conservative' ? 'Low risk, stable returns' :
                   riskProfile.riskTolerance === 'Moderate' ? 'Balanced approach' :
                   riskProfile.riskTolerance === 'Aggressive' ? 'High risk, high returns' : 'Risk assessment needed'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Investment Capacity</Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(investmentCapacity)}
                </Typography>
                <Typography variant="caption">
                  {investmentCapacity > 0 ? 'Available for investments' : 'Improve cash flow first'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Investment Capacity Analysis */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>Investment Capacity Analysis</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Monthly Surplus</Typography>
              <Typography variant="body1" color={monthlySurplus > 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(monthlySurplus)}
              </Typography>
              <Typography variant="caption">
                Income - Expenses = {formatCurrency(monthlyIncome)} - {formatCurrency(monthlyExpenses)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Recommended Investment</Typography>
              <Typography variant="body1" color="primary.main">
                {formatCurrency(Math.max(0, monthlySurplus * 0.8))}
              </Typography>
              <Typography variant="caption">
                80% of surplus (keep 20% buffer)
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Risk Assessment Details */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Risk Profile Assessment
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold">Experience Level Impact:</Typography>
              <Typography variant="body2" color="text.secondary">
                {riskProfile.investmentExperience === 'Beginner (0-2 years)' ? 
                  'Focus on learning basics, start with diversified mutual funds' :
                 riskProfile.investmentExperience === 'Intermediate (2-5 years)' ?
                  'Can explore sector funds and balanced portfolios' :
                 riskProfile.investmentExperience === 'Experienced (5-10 years)' ?
                  'Suitable for direct equity and advanced strategies' :
                 riskProfile.investmentExperience === 'Expert (10+ years)' ?
                  'Can handle complex instruments and active trading' :
                  'Complete risk assessment to get personalized recommendations'
                }
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold">Risk Tolerance Impact:</Typography>
              <Typography variant="body2" color="text.secondary">
                {riskProfile.riskTolerance === 'Conservative' ?
                  'Prefer FDs, bonds, debt funds (60-80% allocation)' :
                 riskProfile.riskTolerance === 'Moderate' ?
                  'Balanced portfolio with 50-70% equity allocation' :
                 riskProfile.riskTolerance === 'Aggressive' ?
                  'High equity exposure 70-90% for long-term growth' :
                  'Risk assessment needed for appropriate asset allocation'
                }
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Investment Recommendations */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Investment Recommendations
          </Typography>
          {riskProfile.riskTolerance && riskProfile.investmentExperience ? (
            <Grid container spacing={2}>
              {riskProfile.riskTolerance === 'Conservative' && (
                <>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Debt Allocation (70-80%)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      PPF, EPF, Debt mutual funds, FDs
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Equity Allocation (20-30%)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Large-cap mutual funds, ELSS
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Expected Returns</Typography>
                    <Typography variant="caption" color="text.secondary">
                      8-10% annually with low volatility
                    </Typography>
                  </Grid>
                </>
              )}
              {riskProfile.riskTolerance === 'Moderate' && (
                <>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Debt Allocation (40-50%)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Debt funds, PPF, EPF, hybrid funds
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Equity Allocation (50-60%)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Diversified equity funds, ELSS
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Expected Returns</Typography>
                    <Typography variant="caption" color="text.secondary">
                      10-12% annually with moderate volatility
                    </Typography>
                  </Grid>
                </>
              )}
              {riskProfile.riskTolerance === 'Aggressive' && (
                <>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Debt Allocation (20-30%)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Debt funds for stability
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Equity Allocation (70-80%)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Growth funds, mid-cap, small-cap funds
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold">Expected Returns</Typography>
                    <Typography variant="caption" color="text.secondary">
                      12-15% annually with high volatility
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                Complete your risk assessment to receive personalized investment recommendations based on your experience and risk tolerance.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Investment Readiness Assessment */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Investment Readiness</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Emergency Fund</Typography>
              <Chip 
                label={
                  (currentClientData.assets?.cashBankSavings || 0) >= (monthlyExpenses * 6) ? 'Ready' : 'Needs Building'
                }
                color={
                  (currentClientData.assets?.cashBankSavings || 0) >= (monthlyExpenses * 6) ? 'success' : 'warning'
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Cash Flow</Typography>
              <Chip 
                label={monthlySurplus > 0 ? 'Positive' : 'Needs Improvement'}
                color={monthlySurplus > 0 ? 'success' : 'error'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Risk Assessment</Typography>
              <Chip 
                label={riskProfile.riskTolerance ? 'Complete' : 'Pending'}
                color={riskProfile.riskTolerance ? 'success' : 'warning'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Investment Capacity</Typography>
              <Chip 
                label={investmentCapacity > 0 ? 'Available' : 'Limited'}
                color={investmentCapacity > 0 ? 'success' : 'warning'}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Items */}
        {(!riskProfile.riskTolerance || monthlySurplus <= 0 || (currentClientData.assets?.cashBankSavings || 0) < (monthlyExpenses * 3)) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold">Action Items:</Typography>
            <Box component="ul" sx={{ mt: 1, pl: 3 }}>
              {(currentClientData.assets?.cashBankSavings || 0) < (monthlyExpenses * 3) && (
                <li>Build emergency fund (minimum 3 months expenses)</li>
              )}
              {monthlySurplus <= 0 && (
                <li>Improve cash flow by increasing income or reducing expenses</li>
              )}
              {!riskProfile.riskTolerance && (
                <li>Complete risk assessment and investment experience evaluation</li>
              )}
            </Box>
          </Alert>
        )}
      </Box>
    );
  };

  // Final render logging
  console.log('🎨 [ClientDataPreview] Rendering main UI with data:', {
    hasCurrentClientData: !!currentClientData,
    loading,
    error,
    dataCompleteness,
    timestamp: new Date().toISOString()
  });

  return (
    <Box>
      {/* Debug Panel for Development */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', border: '1px solid #ddd' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
            🔧 DEBUG INFO:
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: '#666' }}>
            Props: clientId={clientId}, hasClientData={!!clientData}, currentData={!!currentClientData}
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: '#666' }}>
            State: loading={loading.toString()}, error={error || 'none'}, completeness={dataCompleteness}%
          </Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Client Data Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review client information before proceeding with cash flow planning
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title={showRawData ? "Hide JSON" : "Show JSON"}>
              <IconButton onClick={() => setShowRawData(!showRawData)}>
                {showRawData ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy JSON">
              <IconButton onClick={() => copyToClipboard(currentClientData)}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Data Completeness Indicator */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">Data Completeness</Typography>
            <Typography variant="body2" fontWeight="bold">{dataCompleteness}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={dataCompleteness} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: dataCompleteness >= 80 ? 'success.main' : 
                                dataCompleteness >= 60 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>

        {/* Warning for incomplete data */}
        {dataCompleteness < 80 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Client profile is {dataCompleteness}% complete. Some planning features may be limited.
            </Typography>
          </Alert>
        )}

        {/* Raw JSON View */}
        {showRawData && (
          <Box mb={3}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, fontSize: '12px' }}>
                {JSON.stringify(currentClientData, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}

        {/* Structured Data View */}
        <Box>
          <Accordion expanded={expanded === 'personal'} onChange={handleAccordionChange('personal')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Person sx={{ mr: 2 }} />
              <Typography>Personal Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderPersonalInfo()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'financial'} onChange={handleAccordionChange('financial')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <AttachMoney sx={{ mr: 2 }} />
              <Typography>Financial Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFinancialSummary()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'assets'} onChange={handleAccordionChange('assets')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <AccountBalance sx={{ mr: 2 }} />
              <Typography>Assets & Investments</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderAssets()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'debts'} onChange={handleAccordionChange('debts')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <TrendingUp sx={{ mr: 2 }} />
              <Typography>Debts & Liabilities</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderDebts()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'retirement'} onChange={handleAccordionChange('retirement')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Elderly sx={{ mr: 2 }} />
              <Typography>Retirement Planning</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderRetirementPlanning()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'insurance'} onChange={handleAccordionChange('insurance')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Security sx={{ mr: 2 }} />
              <Typography>Insurance Coverage</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderInsuranceCoverage()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'goals'} onChange={handleAccordionChange('goals')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <TrackChanges sx={{ mr: 2 }} />
              <Typography>Financial Goals</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFinancialGoals()}
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'riskProfile'} onChange={handleAccordionChange('riskProfile')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Assessment sx={{ mr: 2 }} />
              <Typography>Risk Profile & Investment</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderRiskProfileAndInvestment()}
            </AccordionDetails>
          </Accordion>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('🚀 [ClientDataPreview] Proceed to Planning clicked:', {
                hasClientData: !!currentClientData,
                clientId: currentClientData?._id,
                clientName: currentClientData?.firstName + ' ' + currentClientData?.lastName,
                hasDebts: !!currentClientData?.debtsAndLiabilities,
                dataCompleteness: dataCompleteness
              });
              
              if (!currentClientData) {
                console.error('❌ [ClientDataPreview] Cannot proceed: currentClientData is null');
                return;
              }
              
              console.log('📤 [ClientDataPreview] Calling onProceed with client data');
              onProceed(currentClientData);
            }}
            startIcon={<CheckCircle />}
          >
            Proceed to Planning
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ClientDataPreview;