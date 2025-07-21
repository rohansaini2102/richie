import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  AccountBalance,
  TrendingUp,
  Shield,
  Search,
  AttachMoney
} from '@mui/icons-material';

const AdvisorRecommendationsForm = ({ clientData, onDataUpdate }) => {
  const [expanded, setExpanded] = useState('emergency');
  const [recommendations, setRecommendations] = useState({
    emergencyFund: {
      recommendedAmount: 0,
      currentAmount: 0,
      monthlyTarget: 0,
      investmentVehicle: 'Ultra Short-term Debt Fund'
    },
    investments: {
      monthlySIPs: [],
      oneTimeInvestments: [],
      customVariables: []
    },
    notes: ''
  });

  // Sample mutual fund data (in real app, this would come from an API)
  const mutualFunds = [
    { name: 'HDFC Top 100 Fund', category: 'Large Cap Equity', id: 'HDFC_TOP_100' },
    { name: 'ICICI Prudential Bluechip Fund', category: 'Large Cap Equity', id: 'ICICI_BLUECHIP' },
    { name: 'DSP Mid Cap Fund', category: 'Mid Cap Equity', id: 'DSP_MIDCAP' },
    { name: 'Parag Parikh Flexi Cap Fund', category: 'Multi Cap Equity', id: 'PPFAS_FLEXICAP' },
    { name: 'ICICI Prudential Debt Fund', category: 'Debt Fund', id: 'ICICI_DEBT' },
    { name: 'Axis Liquid Fund', category: 'Liquid Fund', id: 'AXIS_LIQUID' },
    { name: 'SBI Banking & PSU Fund', category: 'Corporate Bond', id: 'SBI_BANKING' }
  ];

  const fundCategories = [
    'Large Cap Equity', 'Mid Cap Equity', 'Multi Cap Equity', 
    'Debt Fund', 'Liquid Fund', 'Corporate Bond', 'ELSS'
  ];

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const updateRecommendations = (newRecommendations) => {
    setRecommendations(newRecommendations);
    // In a real implementation, this would save to the plan data
    console.log('Updated recommendations:', newRecommendations);
  };

  const addMutualFund = (type = 'sip') => {
    const newFund = {
      id: Date.now(),
      fundName: '',
      fundId: '',
      amount: 0,
      category: '',
      reasoning: '',
      ...(type === 'oneTime' && { purpose: '' })
    };

    const updatedRecommendations = { ...recommendations };
    if (type === 'sip') {
      updatedRecommendations.investments.monthlySIPs.push(newFund);
    } else {
      updatedRecommendations.investments.oneTimeInvestments.push(newFund);
    }
    updateRecommendations(updatedRecommendations);
  };

  const updateMutualFund = (type, id, field, value) => {
    const updatedRecommendations = { ...recommendations };
    const list = type === 'sip' ? updatedRecommendations.investments.monthlySIPs : updatedRecommendations.investments.oneTimeInvestments;
    const index = list.findIndex(fund => fund.id === id);
    if (index !== -1) {
      list[index][field] = value;
      updateRecommendations(updatedRecommendations);
    }
  };

  const deleteMutualFund = (type, id) => {
    const updatedRecommendations = { ...recommendations };
    if (type === 'sip') {
      updatedRecommendations.investments.monthlySIPs = updatedRecommendations.investments.monthlySIPs.filter(fund => fund.id !== id);
    } else {
      updatedRecommendations.investments.oneTimeInvestments = updatedRecommendations.investments.oneTimeInvestments.filter(fund => fund.id !== id);
    }
    updateRecommendations(updatedRecommendations);
  };

  const addCustomVariable = () => {
    const newVariable = {
      id: Date.now(),
      variableName: '',
      value: 0,
      description: ''
    };
    const updatedRecommendations = { ...recommendations };
    updatedRecommendations.investments.customVariables.push(newVariable);
    updateRecommendations(updatedRecommendations);
  };

  const updateCustomVariable = (id, field, value) => {
    const updatedRecommendations = { ...recommendations };
    const index = updatedRecommendations.investments.customVariables.findIndex(variable => variable.id === id);
    if (index !== -1) {
      updatedRecommendations.investments.customVariables[index][field] = value;
      updateRecommendations(updatedRecommendations);
    }
  };

  const deleteCustomVariable = (id) => {
    const updatedRecommendations = { ...recommendations };
    updatedRecommendations.investments.customVariables = updatedRecommendations.investments.customVariables.filter(variable => variable.id !== id);
    updateRecommendations(updatedRecommendations);
  };

  const renderMutualFundForm = (fund, type) => (
    <Box key={fund.id} sx={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: 1, 
      p: 2, 
      mb: 2,
      bgcolor: '#fafafa'
    }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            options={mutualFunds}
            getOptionLabel={(option) => option.name}
            value={mutualFunds.find(f => f.id === fund.fundId) || null}
            onChange={(event, newValue) => {
              if (newValue) {
                updateMutualFund(type, fund.id, 'fundName', newValue.name);
                updateMutualFund(type, fund.id, 'fundId', newValue.id);
                updateMutualFund(type, fund.id, 'category', newValue.category);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Fund Name"
                size="small"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ color: '#6b7280', mr: 1 }} />,
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label={type === 'sip' ? 'Monthly SIP' : 'Investment Amount'}
            type="number"
            size="small"
            fullWidth
            value={fund.amount || ''}
            onChange={(e) => updateMutualFund(type, fund.id, 'amount', parseFloat(e.target.value) || 0)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={fundCategories}
            value={fund.category || ''}
            onChange={(event, newValue) => updateMutualFund(type, fund.id, 'category', newValue || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                size="small"
                fullWidth
              />
            )}
          />
        </Grid>
        {type === 'oneTime' && (
          <Grid item xs={12} sm={4}>
            <TextField
              label="Purpose"
              size="small"
              fullWidth
              value={fund.purpose || ''}
              onChange={(e) => updateMutualFund(type, fund.id, 'purpose', e.target.value)}
            />
          </Grid>
        )}
        {type === 'sip' && <Grid item xs={12} sm={4} />}
        <Grid item xs={12}>
          <TextField
            label="Reasoning"
            multiline
            rows={2}
            size="small"
            fullWidth
            value={fund.reasoning || ''}
            onChange={(e) => updateMutualFund(type, fund.id, 'reasoning', e.target.value)}
            placeholder="e.g., Core equity exposure for long-term wealth creation"
          />
        </Grid>
      </Grid>
      <Box mt={1} display="flex" justifyContent="flex-end">
        <IconButton size="small" onClick={() => deleteMutualFund(type, fund.id)} sx={{ color: '#dc2626' }}>
          <Delete />
        </IconButton>
      </Box>
    </Box>
  );

  // Calculate suggested emergency fund (6 months of expenses)
  const suggestedEmergencyFund = (clientData?.totalMonthlyExpenses || 0) * 6;

  return (
    <Paper sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb', borderRadius: 2 }}>
      <Box display="flex" alignItems="center" mb={3} pb={1} borderBottom="1px solid #e5e7eb">
        <TrendingUp sx={{ color: '#6b7280', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          Advisor Recommendations
        </Typography>
      </Box>

      {/* Emergency Fund Management */}
      <Accordion 
        expanded={expanded === 'emergency'} 
        onChange={handleAccordionChange('emergency')}
        sx={{ mb: 2, border: '1px solid #e5e7eb', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Shield sx={{ color: '#16a34a', mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Emergency Fund Management
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Recommended Emergency Fund"
                type="number"
                fullWidth
                value={recommendations.emergencyFund.recommendedAmount || suggestedEmergencyFund}
                onChange={(e) => updateRecommendations({
                  ...recommendations,
                  emergencyFund: {
                    ...recommendations.emergencyFund,
                    recommendedAmount: parseFloat(e.target.value) || 0
                  }
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                helperText={`Suggested: ${formatCurrency(suggestedEmergencyFund)} (6 months expenses)`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Current Emergency Fund"
                type="number"
                fullWidth
                value={recommendations.emergencyFund.currentAmount}
                onChange={(e) => updateRecommendations({
                  ...recommendations,
                  emergencyFund: {
                    ...recommendations.emergencyFund,
                    currentAmount: parseFloat(e.target.value) || 0
                  }
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Monthly Target for Emergency Fund"
                type="number"
                fullWidth
                value={recommendations.emergencyFund.monthlyTarget}
                onChange={(e) => updateRecommendations({
                  ...recommendations,
                  emergencyFund: {
                    ...recommendations.emergencyFund,
                    monthlyTarget: parseFloat(e.target.value) || 0
                  }
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Investment Vehicle"
                fullWidth
                value={recommendations.emergencyFund.investmentVehicle}
                onChange={(e) => updateRecommendations({
                  ...recommendations,
                  emergencyFund: {
                    ...recommendations.emergencyFund,
                    investmentVehicle: e.target.value
                  }
                })}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Monthly SIP Recommendations */}
      <Accordion 
        expanded={expanded === 'sips'} 
        onChange={handleAccordionChange('sips')}
        sx={{ mb: 2, border: '1px solid #e5e7eb', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <AccountBalance sx={{ color: '#2563eb', mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Monthly SIP Recommendations
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => addMutualFund('sip')}
              sx={{ color: '#2563eb', borderColor: '#2563eb' }}
            >
              Add Mutual Fund
            </Button>
          </Box>
          {recommendations.investments.monthlySIPs.map(fund => renderMutualFundForm(fund, 'sip'))}
        </AccordionDetails>
      </Accordion>

      {/* One-time Investments */}
      <Accordion 
        expanded={expanded === 'oneTime'} 
        onChange={handleAccordionChange('oneTime')}
        sx={{ mb: 2, border: '1px solid #e5e7eb', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <AttachMoney sx={{ color: '#059669', mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              One-time Investments
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => addMutualFund('oneTime')}
              sx={{ color: '#059669', borderColor: '#059669' }}
            >
              Add Investment
            </Button>
          </Box>
          {recommendations.investments.oneTimeInvestments.map(fund => renderMutualFundForm(fund, 'oneTime'))}
        </AccordionDetails>
      </Accordion>

      {/* Custom Variables */}
      <Accordion 
        expanded={expanded === 'variables'} 
        onChange={handleAccordionChange('variables')}
        sx={{ mb: 2, border: '1px solid #e5e7eb', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Custom Variables
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addCustomVariable}
            >
              Add Custom Variable
            </Button>
          </Box>
          {recommendations.investments.customVariables.map(variable => (
            <Box key={variable.id} sx={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: 1, 
              p: 2, 
              mb: 2,
              bgcolor: '#fafafa'
            }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Variable Name"
                    fullWidth
                    size="small"
                    value={variable.variableName}
                    onChange={(e) => updateCustomVariable(variable.id, 'variableName', e.target.value)}
                    placeholder="e.g., Annual Bonus Allocation"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Value"
                    type="number"
                    fullWidth
                    size="small"
                    value={variable.value || ''}
                    onChange={(e) => updateCustomVariable(variable.id, 'value', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Description"
                    fullWidth
                    size="small"
                    value={variable.description}
                    onChange={(e) => updateCustomVariable(variable.id, 'description', e.target.value)}
                    placeholder="e.g., Yearly bonus investment strategy"
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton onClick={() => deleteCustomVariable(variable.id)} sx={{ color: '#dc2626' }}>
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Additional Notes */}
      <Box mt={3}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Additional Notes
        </Typography>
        <TextField
          multiline
          rows={4}
          fullWidth
          value={recommendations.notes}
          onChange={(e) => updateRecommendations({
            ...recommendations,
            notes: e.target.value
          })}
          placeholder="Add any additional notes, observations, or recommendations for the client..."
          sx={{ 
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fafafa'
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default AdvisorRecommendationsForm;