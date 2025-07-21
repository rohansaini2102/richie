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
  VisibilityOff
} from '@mui/icons-material';
import { clientAPI } from '../../../services/api';

const ClientDataPreview = ({ clientId, onProceed, onCancel }) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState('personal');
  const [showRawData, setShowRawData] = useState(false);
  const [dataCompleteness, setDataCompleteness] = useState(0);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      console.log('🔄 [ClientDataPreview] Starting to fetch client data:', { clientId });
      setLoading(true);
      
      const response = await clientAPI.getClientById(clientId);
      console.log('✅ [ClientDataPreview] API response received:', {
        hasData: !!response?.data,
        hasNestedData: !!response?.data?.data,
        responseKeys: Object.keys(response || {})
      });
      
      // Extract client data from nested response structure
      const clientData = response.data.data || response.data || response;
      console.log('📊 [ClientDataPreview] Extracted client data:', {
        hasFirstName: !!clientData?.firstName,
        hasLastName: !!clientData?.lastName,
        hasDebts: !!clientData?.debtsAndLiabilities,
        dataKeys: Object.keys(clientData || {}).slice(0, 10) // First 10 keys only
      });
      
      setClientData(clientData);
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
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber',
      'totalMonthlyIncome', 'totalMonthlyExpenses',
      'assets', 'debtsAndLiabilities'
    ];
    
    const filledFields = requiredFields.filter(field => 
      data[field] && (typeof data[field] === 'object' ? Object.keys(data[field]).length > 0 : true)
    );
    
    setDataCompleteness(Math.round((filledFields.length / requiredFields.length) * 100));
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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!clientData) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No client data available
      </Alert>
    );
  }

  const renderPersonalInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">Name</Typography>
        <Typography variant="body1">{clientData.firstName} {clientData.lastName}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">Email</Typography>
        <Typography variant="body1">{clientData.email}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">Phone</Typography>
        <Typography variant="body1">{clientData.phoneNumber || 'Not provided'}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">PAN</Typography>
        <Typography variant="body1">{clientData.panNumber || 'Not provided'}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
        <Typography variant="body1">
          {clientData.dateOfBirth ? new Date(clientData.dateOfBirth).toLocaleDateString('en-IN') : 'Not provided'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">Marital Status</Typography>
        <Typography variant="body1">{clientData.maritalStatus || 'Not specified'}</Typography>
      </Grid>
    </Grid>
  );

  const renderFinancialSummary = () => {
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const surplus = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome * 100).toFixed(1) : 0;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Income</Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(monthlyIncome)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Expenses</Typography>
                <Typography variant="h5" color="error.main">
                  {formatCurrency(monthlyExpenses)}
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
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Savings Rate</Typography>
                <Typography variant="h5" color="primary.main">
                  {savingsRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {clientData.expenseBreakdown && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>Expense Breakdown</Typography>
            <Grid container spacing={2}>
              {Object.entries(clientData.expenseBreakdown.details || {}).map(([key, value]) => (
                <Grid item xs={6} md={3} key={key}>
                  <Typography variant="body2" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="body1">{formatCurrency(value)}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  const renderAssets = () => {
    const assets = clientData.assets || {};
    const investments = assets.investments || {};
    const totalAssets = Object.values(investments).reduce((sum, category) => {
      if (typeof category === 'object') {
        return sum + Object.values(category).reduce((catSum, val) => catSum + (val || 0), 0);
      }
      return sum + (category || 0);
    }, 0);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Total Assets: {formatCurrency(totalAssets)}
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(investments).map(([category, values]) => (
            <Grid item xs={12} key={category}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Typography>
              {typeof values === 'object' && Object.entries(values).map(([type, amount]) => (
                <Box key={type} ml={2}>
                  <Typography variant="body2" component="span" color="text.secondary">
                    {type}: 
                  </Typography>
                  <Typography variant="body2" component="span" ml={1}>
                    {formatCurrency(amount)}
                  </Typography>
                </Box>
              ))}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderDebts = () => {
    const debts = clientData.debtsAndLiabilities || {};
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

  return (
    <Box>
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
              <IconButton onClick={() => copyToClipboard(clientData)}>
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
                {JSON.stringify(clientData, null, 2)}
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
                hasClientData: !!clientData,
                clientId: clientData?._id,
                clientName: clientData?.firstName + ' ' + clientData?.lastName,
                hasDebts: !!clientData?.debtsAndLiabilities,
                dataCompleteness: dataCompleteness
              });
              
              if (!clientData) {
                console.error('❌ [ClientDataPreview] Cannot proceed: clientData is null');
                return;
              }
              
              console.log('📤 [ClientDataPreview] Calling onProceed with client data');
              onProceed(clientData);
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