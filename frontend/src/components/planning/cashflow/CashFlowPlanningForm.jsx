import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Save,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';

const CashFlowPlanningForm = ({ clientData, onDataUpdate, onProceed, onCancel }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState(clientData);
  const [expanded, setExpanded] = useState('financial');

  useEffect(() => {
    setFormData(clientData);
  }, [clientData]);

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleFieldChange = (field, value, section = null) => {
    const numericValue = parseFloat(value) || 0;
    
    let updatedData = { ...formData };
    
    if (section) {
      updatedData[section] = { ...updatedData[section], [field]: numericValue };
    } else {
      updatedData[field] = numericValue;
    }
    
    setFormData(updatedData);
    onDataUpdate(updatedData);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const startEditing = (section) => {
    setEditingSection(section);
  };

  const stopEditing = () => {
    setEditingSection(null);
  };

  const calculateSurplus = () => {
    const income = formData.totalMonthlyIncome || 0;
    const expenses = formData.totalMonthlyExpenses || 0;
    return income - expenses;
  };

  const calculateEMIRatio = () => {
    const income = formData.totalMonthlyIncome || 0;
    const totalEMI = getTotalEMI();
    return income > 0 ? ((totalEMI / income) * 100).toFixed(1) : 0;
  };

  const getTotalEMI = () => {
    const debts = formData.debtsAndLiabilities || {};
    return Object.values(debts).reduce((sum, debt) => {
      if (debt && debt.hasLoan) {
        return sum + (debt.monthlyEMI || debt.monthlyPayment || 0);
      }
      return sum;
    }, 0);
  };

  const renderFinancialSummary = () => {
    const monthlyIncome = formData.totalMonthlyIncome || 0;
    const monthlyExpenses = formData.totalMonthlyExpenses || 0;
    const surplus = calculateSurplus();
    const emiRatio = calculateEMIRatio();
    const totalEMI = getTotalEMI();

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Financial Summary</Typography>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => startEditing('financial')}
            disabled={editingSection === 'financial'}
          >
            Edit
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Income</Typography>
                {editingSection === 'financial' ? (
                  <TextField
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => handleFieldChange('totalMonthlyIncome', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    fullWidth
                    size="small"
                  />
                ) : (
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(monthlyIncome)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Expenses</Typography>
                {editingSection === 'financial' ? (
                  <TextField
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => handleFieldChange('totalMonthlyExpenses', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    fullWidth
                    size="small"
                  />
                ) : (
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(monthlyExpenses)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Monthly Surplus</Typography>
                <Typography variant="h6" color={surplus >= 0 ? 'info.main' : 'error.main'}>
                  {formatCurrency(surplus)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total EMI</Typography>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(totalEMI)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>EMI Ratio</Typography>
                <Typography variant="h6" color={emiRatio > 40 ? 'error.main' : 'primary.main'}>
                  {emiRatio}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {editingSection === 'financial' && (
          <Box mt={2} display="flex" gap={2} justifyContent="flex-end">
            <Button size="small" onClick={stopEditing}>Cancel</Button>
            <Button 
              size="small" 
              variant="contained" 
              startIcon={<Save />}
              onClick={stopEditing}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const renderDebtAnalysis = () => {
    const debts = formData.debtsAndLiabilities || {};
    const hasDebts = Object.values(debts).some(debt => debt && debt.hasLoan);

    if (!hasDebts) {
      return (
        <Alert severity="info">
          No debts found for this client. This is great for their cash flow!
        </Alert>
      );
    }

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Debt Analysis</Typography>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => startEditing('debts')}
            disabled={editingSection === 'debts'}
          >
            Edit EMIs
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Debt Type</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Current EMI</TableCell>
                <TableCell align="right">Interest Rate</TableCell>
                {editingSection === 'debts' && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(debts).map(([type, debt]) => {
                if (!debt || !debt.hasLoan) return null;
                return (
                  <TableRow key={type}>
                    <TableCell component="th" scope="row">
                      {type.replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(debt.outstandingAmount || debt.totalOutstanding)}
                    </TableCell>
                    <TableCell align="right">
                      {editingSection === 'debts' ? (
                        <TextField
                          type="number"
                          value={debt.monthlyEMI || debt.monthlyPayment || 0}
                          onChange={(e) => {
                            const updatedDebts = { ...formData.debtsAndLiabilities };
                            updatedDebts[type] = { 
                              ...updatedDebts[type], 
                              monthlyEMI: parseFloat(e.target.value) || 0,
                              monthlyPayment: parseFloat(e.target.value) || 0
                            };
                            const updatedData = { ...formData, debtsAndLiabilities: updatedDebts };
                            setFormData(updatedData);
                            onDataUpdate(updatedData);
                          }}
                          size="small"
                          sx={{ width: 100 }}
                        />
                      ) : (
                        formatCurrency(debt.monthlyEMI || debt.monthlyPayment)
                      )}
                    </TableCell>
                    <TableCell align="right">{debt.interestRate || 'N/A'}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {parseFloat(calculateEMIRatio()) > 40 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              EMI ratio of {calculateEMIRatio()}% exceeds the recommended 40% limit. 
              Consider debt consolidation or income increase.
            </Typography>
          </Alert>
        )}

        {editingSection === 'debts' && (
          <Box mt={2} display="flex" gap={2} justifyContent="flex-end">
            <Button size="small" onClick={stopEditing}>Cancel</Button>
            <Button 
              size="small" 
              variant="contained" 
              startIcon={<Save />}
              onClick={stopEditing}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Client Info Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {formData.firstName} {formData.lastName}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body2">
              {formData.dateOfBirth ? 
                Math.floor((Date.now() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
                'N/A'
              }
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">PAN</Typography>
            <Typography variant="body2">{formData.panNumber || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body2">{formData.email}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body2">{formData.phoneNumber || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Sections */}
      <Accordion expanded={expanded === 'financial'} onChange={handleAccordionChange('financial')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <AttachMoney sx={{ mr: 2 }} />
          <Typography>Financial Summary & Cash Flow</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderFinancialSummary()}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'debts'} onChange={handleAccordionChange('debts')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <TrendingUp sx={{ mr: 2 }} />
          <Typography>Debt Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderDebtAnalysis()}
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="outlined" onClick={onCancel}>
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={onProceed}
          startIcon={<CheckCircle />}
        >
          Create Plan
        </Button>
      </Box>
    </Box>
  );
};

export default CashFlowPlanningForm;