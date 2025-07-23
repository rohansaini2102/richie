import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Percent,
  TrackChanges,
  Security,
  Assessment,
  Elderly,
  ExpandMore,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { formatCurrency, formatLargeAmount } from './utils/goalFormatters';
import { calculateAge } from './utils/goalCalculations';

const EditableClientDataGoal = ({ clientData, onDataUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [expanded, setExpanded] = useState('personal');

  console.log('🔄 [EditableClientDataGoal] Component render:', {
    hasClientData: !!clientData,
    clientDataType: typeof clientData,
    clientDataKeys: clientData ? Object.keys(clientData).slice(0, 15) : null,
    clientId: clientData?._id || clientData?.id || 'unknown',
    clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A',
    hasFinancials: !!clientData?.calculatedFinancials,
    hasGoals: !!clientData?.enhancedFinancialGoals,
    hasAssets: !!clientData?.assets,
    dataSize: clientData ? JSON.stringify(clientData).length : 0,
    renderTimestamp: new Date().toISOString()
  });

  // Track clientData prop changes
  useEffect(() => {
    console.log('📊 [EditableClientDataGoal] clientData prop changed:', {
      hasData: !!clientData,
      prevState: 'tracking...',
      dataSize: clientData ? JSON.stringify(clientData).length : 0,
      clientDataPreview: clientData ? {
        _id: clientData._id,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        hasCalculatedFinancials: !!clientData.calculatedFinancials,
        hasEnhancedFinancialGoals: !!clientData.enhancedFinancialGoals
      } : null
    });
  }, [clientData]);

  // Enhanced loading and error states
  if (!clientData) {
    console.log('🔄 [EditableClientDataGoal] No client data provided - showing loading state');
    return (
      <Paper sx={{ p: 4, minHeight: 300 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#111827', mb: 1 }}>
            Loading Client Information
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
            Please wait while we load your client's financial data and prepare the review interface.
          </Typography>
          
          {/* Loading progress indicator */}
          <Box sx={{ mt: 3, width: '100%', maxWidth: 300 }}>
            <LinearProgress />
            <Typography variant="caption" sx={{ color: '#9ca3af', mt: 1, display: 'block', textAlign: 'center' }}>
              This may take a few moments...
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Data validation check
  const hasMinimalData = clientData.firstName || clientData.lastName || clientData.totalMonthlyIncome;
  if (!hasMinimalData) {
    console.warn('⚠️ [EditableClientDataGoal] Client data lacks essential fields');
    return (
      <Paper sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            ⚠️ Incomplete Client Data
          </Typography>
          <Typography variant="body2">
            The client data appears to be incomplete. Please ensure the client's basic information and financial details are properly saved before proceeding with goal-based planning.
          </Typography>
        </Alert>
        
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
            Available data fields: {Object.keys(clientData).join(', ')}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
          >
            Refresh Page
          </Button>
        </Box>
      </Paper>
    );
  }

  console.log('✅ [EditableClientDataGoal] Rendering comprehensive client data review:', {
    clientName: `${clientData.firstName} ${clientData.lastName}`,
    dataQuality: hasMinimalData ? 'sufficient' : 'insufficient',
    availableFields: Object.keys(clientData).length,
    hasFinancials: !!clientData.calculatedFinancials
  });

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const saveEdit = (field) => {
    const value = field.includes('Monthly') || field.includes('Amount') || field.includes('Income') || 
                  field.includes('Expenses') || field.includes('Outstanding') || field.includes('EMI') ||
                  field.includes('Premium') || field.includes('Target') || field.includes('Corpus')
      ? parseFloat(tempValue) || 0 
      : tempValue;
    
    const updatedData = { ...clientData, [field]: value };
    onDataUpdate(updatedData);
    setEditingField(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const renderEditableField = (field, label, value, isNumeric = false, prefix = '') => {
    const isEditing = editingField === field;
    
    return (
      <Box display="flex" alignItems="center" py={1}>
        <Typography variant="body2" sx={{ 
          fontWeight: 500, 
          color: '#374151', 
          flex: 1, 
          mr: 2 
        }}>
          {label}
        </Typography>
        
        {isEditing ? (
          <Box display="flex" alignItems="center" flex={1}>
            <TextField
              size="small"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              type={isNumeric ? 'number' : 'text'}
              autoFocus
              sx={{ flex: 1, mr: 1 }}
              InputProps={{
                startAdornment: prefix && (
                  <InputAdornment position="start">{prefix}</InputAdornment>
                ),
              }}
            />
            <IconButton 
              size="small" 
              onClick={() => saveEdit(field)}
              sx={{ color: '#16a34a', mr: 0.5 }}
            >
              <Save fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={cancelEdit}
              sx={{ color: '#ef4444' }}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" flex={1} justifyContent="flex-end">
            <Typography variant="body1" sx={{ 
              fontWeight: 600, 
              color: '#111827', 
              mr: 1 
            }}>
              {isNumeric && typeof value === 'number' ? formatCurrency(value) : value || 'Not provided'}
            </Typography>
            <IconButton 
              size="small"
              onClick={() => startEditing(field, value)}
              sx={{ color: '#6b7280' }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  // Extract financial data
  const monthlyIncome = clientData?.calculatedFinancials?.monthlyIncome || 
                       clientData?.totalMonthlyIncome || 0;
  const monthlyExpenses = clientData?.calculatedFinancials?.totalMonthlyExpenses || 
                         clientData?.totalMonthlyExpenses || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const monthlyInvestmentCapacity = monthlySurplus > 0 ? monthlySurplus * 0.8 : 0;

  const renderEditablePersonalInfo = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderEditableField('firstName', 'First Name', clientData.firstName)}
            {renderEditableField('lastName', 'Last Name', clientData.lastName)}
            {renderEditableField('email', 'Email', clientData.email)}
            {renderEditableField('phoneNumber', 'Phone Number', clientData.phoneNumber)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderEditableField('panNumber', 'PAN Number', clientData.panNumber)}
            {renderEditableField('maritalStatus', 'Marital Status', clientData.maritalStatus)}
            {renderEditableField('numberOfDependents', 'Number of Dependents', clientData.numberOfDependents, true)}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Age
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                {calculateAge(clientData.dateOfBirth) || 'N/A'} years
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditableFinancialSummary = () => {
    const savingsRate = monthlyIncome > 0 ? ((monthlySurplus / monthlyIncome) * 100).toFixed(1) : 0;
    
    return (
      <Box>
        {/* Key Metrics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUp sx={{ color: '#16a34a', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#15803d', mb: 1 }}>
                  Monthly Income
                </Typography>
                <Typography variant="h6" sx={{ color: '#14532d', fontWeight: 700 }}>
                  {formatCurrency(monthlyIncome)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <TrendingDown sx={{ color: '#dc2626', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#dc2626', mb: 1 }}>
                  Monthly Expenses
                </Typography>
                <Typography variant="h6" sx={{ color: '#991b1b', fontWeight: 700 }}>
                  {formatCurrency(monthlyExpenses)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ 
              bgcolor: monthlySurplus >= 0 ? '#eff6ff' : '#fef2f2', 
              border: monthlySurplus >= 0 ? '1px solid #bfdbfe' : '1px solid #fecaca' 
            }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUp sx={{ color: monthlySurplus >= 0 ? '#2563eb' : '#dc2626', mb: 1 }} />
                <Typography variant="body2" sx={{ color: monthlySurplus >= 0 ? '#1e40af' : '#dc2626', mb: 1 }}>
                  Monthly Surplus
                </Typography>
                <Typography variant="h6" sx={{ color: monthlySurplus >= 0 ? '#1e3a8a' : '#991b1b', fontWeight: 700 }}>
                  {formatCurrency(monthlySurplus)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#f3f4f6', border: '1px solid #d1d5db' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <TrackChanges sx={{ color: '#6b7280', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                  Investment Capacity
                </Typography>
                <Typography variant="h6" sx={{ color: '#374151', fontWeight: 700 }}>
                  {formatCurrency(monthlyInvestmentCapacity)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Editable Financial Fields */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderEditableField('totalMonthlyIncome', 'Monthly Income', monthlyIncome, true, '₹')}
            {renderEditableField('incomeType', 'Income Type', clientData?.incomeType)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderEditableField('totalMonthlyExpenses', 'Monthly Expenses', monthlyExpenses, true, '₹')}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Savings Rate
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                {savingsRate}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditableAssets = () => {
    const assets = clientData.assets || {};
    const investments = assets.investments || {};
    const equity = investments.equity || {};
    const fixedIncome = investments.fixedIncome || {};
    
    const totalEquity = (equity.mutualFunds || 0) + (equity.directStocks || 0);
    const totalFixedIncome = (fixedIncome.ppf || 0) + (fixedIncome.epf || 0) + (fixedIncome.nps || 0) + 
                            (fixedIncome.elss || 0) + (fixedIncome.fixedDeposits || 0);
    const totalInvestments = totalEquity + totalFixedIncome;

    return (
      <Box>
        {/* Investment Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#1e40af', mb: 1 }}>
                  Total Investments
                </Typography>
                <Typography variant="h6" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                  {formatLargeAmount(totalInvestments)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#15803d', mb: 1 }}>
                  Equity Investments
                </Typography>
                <Typography variant="h6" sx={{ color: '#14532d', fontWeight: 700 }}>
                  {formatLargeAmount(totalEquity)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#fef3c7', border: '1px solid #fcd34d' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#92400e', mb: 1 }}>
                  Fixed Income
                </Typography>
                <Typography variant="h6" sx={{ color: '#78350f', fontWeight: 700 }}>
                  {formatLargeAmount(totalFixedIncome)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Investment Breakdown */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Equity Investments
            </Typography>
            {renderEditableField('assets.investments.equity.mutualFunds', 'Mutual Funds', equity.mutualFunds, true, '₹')}
            {renderEditableField('assets.investments.equity.directStocks', 'Direct Stocks', equity.directStocks, true, '₹')}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Fixed Income Investments
            </Typography>
            {renderEditableField('assets.investments.fixedIncome.ppf', 'PPF', fixedIncome.ppf, true, '₹')}
            {renderEditableField('assets.investments.fixedIncome.epf', 'EPF', fixedIncome.epf, true, '₹')}
            {renderEditableField('assets.investments.fixedIncome.nps', 'NPS', fixedIncome.nps, true, '₹')}
            {renderEditableField('assets.investments.fixedIncome.elss', 'ELSS', fixedIncome.elss, true, '₹')}
            {renderEditableField('assets.investments.fixedIncome.fixedDeposits', 'Fixed Deposits', fixedIncome.fixedDeposits, true, '₹')}
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditableDebts = () => {
    const debts = clientData.debtsAndLiabilities || {};
    const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan'];
    
    const totalOutstanding = debtTypes.reduce((sum, type) => {
      const debt = debts[type];
      if (debt?.hasLoan) {
        return sum + (debt.outstandingAmount || debt.totalOutstanding || 0);
      }
      return sum;
    }, 0);

    const totalEMI = debtTypes.reduce((sum, type) => {
      const debt = debts[type];
      if (debt?.hasLoan) {
        return sum + (debt.monthlyEMI || debt.monthlyPayment || 0);
      }
      return sum;
    }, 0);

    const emiRatio = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

    return (
      <Box>
        {/* Debt Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#fee2e2', border: '1px solid #fecaca' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#dc2626', mb: 1 }}>
                  Total Outstanding
                </Typography>
                <Typography variant="h6" sx={{ color: '#991b1b', fontWeight: 700 }}>
                  {formatLargeAmount(totalOutstanding)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#fef3c7', border: '1px solid #fcd34d' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#92400e', mb: 1 }}>
                  Total Monthly EMI
                </Typography>
                <Typography variant="h6" sx={{ color: '#78350f', fontWeight: 700 }}>
                  {formatCurrency(totalEMI)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: emiRatio > 40 ? '#fee2e2' : '#f0fdf4', 
              border: emiRatio > 40 ? '1px solid #fecaca' : '1px solid #bbf7d0' 
            }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: emiRatio > 40 ? '#dc2626' : '#15803d', mb: 1 }}>
                  EMI Ratio
                </Typography>
                <Typography variant="h6" sx={{ color: emiRatio > 40 ? '#991b1b' : '#14532d', fontWeight: 700 }}>
                  {emiRatio.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Individual Debt Details */}
        <Grid container spacing={3}>
          {debtTypes.map(type => {
            const debt = debts[type];
            if (!debt?.hasLoan) return null;
            
            const typeLabels = {
              homeLoan: 'Home Loan',
              personalLoan: 'Personal Loan',
              carLoan: 'Car Loan',
              educationLoan: 'Education Loan',
              creditCards: 'Credit Cards',
              businessLoan: 'Business Loan'
            };

            return (
              <Grid item xs={12} md={6} key={type}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#111827' }}>
                  {typeLabels[type]}
                </Typography>
                {renderEditableField(`debtsAndLiabilities.${type}.outstandingAmount`, 'Outstanding Amount', 
                  debt.outstandingAmount || debt.totalOutstanding, true, '₹')}
                {renderEditableField(`debtsAndLiabilities.${type}.monthlyEMI`, 'Monthly EMI', 
                  debt.monthlyEMI || debt.monthlyPayment, true, '₹')}
                {renderEditableField(`debtsAndLiabilities.${type}.interestRate`, 'Interest Rate', 
                  debt.interestRate || debt.averageInterestRate, true, '%')}
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderEditableRetirement = () => {
    const retirement = clientData.retirementPlanning || {};
    const currentAge = calculateAge(clientData.dateOfBirth);
    const retirementAge = retirement.retirementAge || 60;
    const yearsToRetirement = currentAge ? Math.max(0, retirementAge - currentAge) : null;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Retirement Timeline
            </Typography>
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Current Age
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                {currentAge} years
              </Typography>
            </Box>
            {renderEditableField('retirementPlanning.retirementAge', 'Retirement Age', retirementAge, true)}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Years to Retirement
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                {yearsToRetirement} years
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Retirement Corpus
            </Typography>
            {renderEditableField('retirementPlanning.currentRetirementCorpus', 'Current Corpus', 
              retirement.currentRetirementCorpus, true, '₹')}
            {renderEditableField('retirementPlanning.targetRetirementCorpus', 'Target Corpus', 
              retirement.targetRetirementCorpus, true, '₹')}
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditableInsurance = () => {
    const insurance = clientData.insuranceCoverage || {};
    const life = insurance.lifeInsurance || {};
    const health = insurance.healthInsurance || {};
    // const vehicle = insurance.vehicleInsurance || {}; // Currently unused

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Life Insurance
            </Typography>
            {renderEditableField('insuranceCoverage.lifeInsurance.totalCoverAmount', 'Cover Amount', 
              life.totalCoverAmount, true, '₹')}
            {renderEditableField('insuranceCoverage.lifeInsurance.annualPremium', 'Annual Premium', 
              life.annualPremium, true, '₹')}
            {renderEditableField('insuranceCoverage.lifeInsurance.insuranceType', 'Insurance Type', 
              life.insuranceType)}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Health Insurance
            </Typography>
            {renderEditableField('insuranceCoverage.healthInsurance.totalCoverAmount', 'Cover Amount', 
              health.totalCoverAmount, true, '₹')}
            {renderEditableField('insuranceCoverage.healthInsurance.annualPremium', 'Annual Premium', 
              health.annualPremium, true, '₹')}
            {renderEditableField('insuranceCoverage.healthInsurance.familyMembers', 'Family Members', 
              health.familyMembers, true)}
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditableGoals = () => {
    const goals = clientData.enhancedFinancialGoals || {};
    const emergencyFund = goals.emergencyFund || {};
    const childEducation = goals.childEducation || {};
    const homePurchase = goals.homePurchase || {};
    const marriageOfDaughter = goals.marriageOfDaughter || {};
    const customGoals = goals.customGoals || [];

    console.log('🎯 [EditableClientDataGoal] Rendering all financial goals:', {
      hasEmergencyFund: !!emergencyFund.targetAmount,
      hasChildEducation: childEducation.isApplicable || !!childEducation.targetAmount,
      hasHomePurchase: homePurchase.isApplicable || !!homePurchase.details,
      hasMarriage: marriageOfDaughter.isApplicable || !!marriageOfDaughter.targetAmount,
      customGoalsCount: customGoals.length,
      totalGoalTypes: 5
    });

    return (
      <Box>
        <Grid container spacing={3}>
          {/* Emergency Fund */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              💰 Emergency Fund
            </Typography>
            {renderEditableField('enhancedFinancialGoals.emergencyFund.targetAmount', 'Target Amount', 
              emergencyFund.targetAmount, true, '₹')}
            {renderEditableField('enhancedFinancialGoals.emergencyFund.priority', 'Priority', 
              emergencyFund.priority)}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Status
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: emergencyFund.targetAmount ? '#16a34a' : '#6b7280' 
              }}>
                {emergencyFund.targetAmount ? '✅ Set' : '⚪ Not Set'}
              </Typography>
            </Box>
          </Grid>

          {/* Child Education */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              🎓 Child Education
            </Typography>
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Applicable
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: childEducation.isApplicable ? '#16a34a' : '#6b7280' 
              }}>
                {childEducation.isApplicable ? '✅ Yes' : '⚪ No'}
              </Typography>
            </Box>
            {(childEducation.isApplicable || childEducation.details) && (
              <>
                {renderEditableField('enhancedFinancialGoals.childEducation.details.targetAmount', 'Target Amount', 
                  childEducation.details?.targetAmount, true, '₹')}
                {renderEditableField('enhancedFinancialGoals.childEducation.details.targetYear', 'Target Year', 
                  childEducation.details?.targetYear, true)}
                {renderEditableField('enhancedFinancialGoals.childEducation.details.educationLevel', 'Education Level', 
                  childEducation.details?.educationLevel)}
              </>
            )}
          </Grid>

          {/* Home Purchase */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              🏠 Home Purchase
            </Typography>
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Applicable
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: homePurchase.isApplicable ? '#16a34a' : '#6b7280' 
              }}>
                {homePurchase.isApplicable ? '✅ Yes' : '⚪ No'}
              </Typography>
            </Box>
            {(homePurchase.isApplicable || homePurchase.details) && (
              <>
                {renderEditableField('enhancedFinancialGoals.homePurchase.details.targetAmount', 'Target Amount', 
                  homePurchase.details?.targetAmount, true, '₹')}
                {renderEditableField('enhancedFinancialGoals.homePurchase.details.targetYear', 'Target Year', 
                  homePurchase.details?.targetYear, true)}
                {renderEditableField('enhancedFinancialGoals.homePurchase.details.propertyType', 'Property Type', 
                  homePurchase.details?.propertyType)}
              </>
            )}
          </Grid>

          {/* Marriage of Daughter */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              💒 Marriage of Daughter
            </Typography>
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Applicable
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: marriageOfDaughter.isApplicable ? '#16a34a' : '#6b7280' 
              }}>
                {marriageOfDaughter.isApplicable ? '✅ Yes' : '⚪ No'}
              </Typography>
            </Box>
            {(marriageOfDaughter.isApplicable || marriageOfDaughter.targetAmount) && (
              <>
                {renderEditableField('enhancedFinancialGoals.marriageOfDaughter.targetAmount', 'Target Amount', 
                  marriageOfDaughter.targetAmount, true, '₹')}
                {renderEditableField('enhancedFinancialGoals.marriageOfDaughter.targetYear', 'Target Year', 
                  marriageOfDaughter.targetYear, true)}
                {renderEditableField('enhancedFinancialGoals.marriageOfDaughter.daughterCurrentAge', 'Daughter Current Age', 
                  marriageOfDaughter.daughterCurrentAge, true)}
              </>
            )}
          </Grid>

          {/* Custom Goals */}
          {customGoals.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
                ⚙️ Custom Goals ({customGoals.length})
              </Typography>
              <Grid container spacing={2}>
                {customGoals.map((customGoal, index) => {
                  const goalData = customGoal.template || customGoal;
                  return (
                    <Grid item xs={12} md={6} key={index}>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 1, 
                        bgcolor: '#f8fafc' 
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Custom Goal {index + 1}
                        </Typography>
                        {renderEditableField(`enhancedFinancialGoals.customGoals[${index}].goalName`, 'Goal Name', 
                          goalData.goalName)}
                        {renderEditableField(`enhancedFinancialGoals.customGoals[${index}].targetAmount`, 'Target Amount', 
                          goalData.targetAmount, true, '₹')}
                        {renderEditableField(`enhancedFinancialGoals.customGoals[${index}].targetYear`, 'Target Year', 
                          goalData.targetYear, true)}
                        {renderEditableField(`enhancedFinancialGoals.customGoals[${index}].priority`, 'Priority', 
                          goalData.priority)}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}

          {/* Goals Summary */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              borderRadius: 1,
              mt: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0369a1', mb: 1 }}>
                📊 Goals Summary
              </Typography>
              <Grid container spacing={2} sx={{ fontSize: '14px' }}>
                <Grid item xs={3}>
                  <Typography variant="caption" display="block">Emergency Fund:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {emergencyFund.targetAmount ? '✅ Set' : '⚪ Not Set'}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" display="block">Child Education:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {childEducation.isApplicable ? '✅ Applicable' : '⚪ Not Applicable'}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" display="block">Home Purchase:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {homePurchase.isApplicable ? '✅ Applicable' : '⚪ Not Applicable'}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" display="block">Marriage/Custom:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(marriageOfDaughter.isApplicable ? 1 : 0) + customGoals.length} goals
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditableRiskProfile = () => {
    const riskProfile = clientData.enhancedRiskProfile || {};

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Risk Assessment
            </Typography>
            {renderEditableField('enhancedRiskProfile.riskTolerance', 'Risk Tolerance', 
              riskProfile.riskTolerance)}
            {renderEditableField('enhancedRiskProfile.investmentExperience', 'Investment Experience', 
              riskProfile.investmentExperience)}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Investment Capacity
            </Typography>
            {renderEditableField('enhancedRiskProfile.monthlyInvestmentCapacity', 'Monthly Investment Capacity', 
              monthlyInvestmentCapacity, true, '₹')}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', flex: 1, mr: 2 }}>
                Recommended Allocation
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                {riskProfile.riskTolerance === 'Aggressive' ? '80% Equity' :
                 riskProfile.riskTolerance === 'Conservative' ? '30% Equity' : '60% Equity'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>
        Comprehensive Client Data Review
      </Typography>
      
      {/* Investment Capacity Alert */}
      {monthlyInvestmentCapacity <= 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Current expenses exceed or equal income. Consider optimizing expenses before setting financial goals.
          </Typography>
        </Alert>
      )}

      {/* Accordion Sections */}
      <Box>
        <Accordion expanded={expanded === 'personal'} onChange={handleAccordionChange('personal')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Person sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Personal Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditablePersonalInfo()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'financial'} onChange={handleAccordionChange('financial')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <AttachMoney sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Financial Summary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableFinancialSummary()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'assets'} onChange={handleAccordionChange('assets')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <AccountBalance sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Assets & Investments</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableAssets()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'debts'} onChange={handleAccordionChange('debts')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <TrendingUp sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Debts & Liabilities</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableDebts()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'retirement'} onChange={handleAccordionChange('retirement')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Elderly sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Retirement Planning</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableRetirement()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'insurance'} onChange={handleAccordionChange('insurance')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Security sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Insurance Coverage</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableInsurance()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'goals'} onChange={handleAccordionChange('goals')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <TrackChanges sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Financial Goals</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableGoals()}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'riskProfile'} onChange={handleAccordionChange('riskProfile')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Assessment sx={{ mr: 2, color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Risk Profile & Investment</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderEditableRiskProfile()}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Goal Planning Summary */}
      <Box sx={{ mt: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
          Goal Planning Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                Monthly Investment Capacity
              </Typography>
              <Typography variant="h6" sx={{ color: '#16a34a', fontWeight: 700 }}>
                {formatCurrency(monthlyInvestmentCapacity)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                Risk Profile
              </Typography>
              <Chip 
                label={clientData.enhancedRiskProfile?.riskTolerance || 'Not Set'}
                sx={{ 
                  bgcolor: '#eff6ff', 
                  color: '#2563eb',
                  fontWeight: 600
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                Planning Status
              </Typography>
              <Chip 
                label={monthlyInvestmentCapacity > 0 ? 'Ready for Goals' : 'Needs Optimization'}
                sx={{ 
                  bgcolor: monthlyInvestmentCapacity > 0 ? '#dcfce7' : '#fee2e2',
                  color: monthlyInvestmentCapacity > 0 ? '#166534' : '#dc2626',
                  fontWeight: 600
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EditableClientDataGoal;