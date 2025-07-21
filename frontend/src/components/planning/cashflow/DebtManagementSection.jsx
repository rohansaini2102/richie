import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Alert,
  Grid,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  CreditCard,
  Warning,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  Cancel,
  Home,
  DirectionsCar,
  School,
  Person,
  Business,
  Diamond
} from '@mui/icons-material';

const DebtManagementSection = ({ clientData, onDataUpdate, aiSuggestions }) => {
  const [editingDebt, setEditingDebt] = useState(null);
  const [tempEMI, setTempEMI] = useState('');

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDebtIcon = (debtType) => {
    const icons = {
      homeLoan: Home,
      carLoan: DirectionsCar,
      personalLoan: Person,
      educationLoan: School,
      businessLoan: Business,
      goldLoan: Diamond,
      creditCards: CreditCard,
      otherLoans: CreditCard
    };
    const IconComponent = icons[debtType] || CreditCard;
    return <IconComponent fontSize="small" />;
  };

  const getDebtLabel = (debtType) => {
    const labels = {
      homeLoan: 'Home Loan',
      carLoan: 'Car Loan',
      personalLoan: 'Personal Loan',
      educationLoan: 'Education Loan',
      businessLoan: 'Business Loan',
      goldLoan: 'Gold Loan',
      creditCards: 'Credit Cards',
      otherLoans: 'Other Loans'
    };
    return labels[debtType] || debtType;
  };

  // Extract debts data
  const debtsData = clientData?.debtsAndLiabilities || {};
  const activeDebts = Object.entries(debtsData)
    .filter(([_, debt]) => debt && debt.hasLoan)
    .map(([type, debt]) => ({
      type,
      label: getDebtLabel(type),
      icon: getDebtIcon(type),
      outstanding: debt.outstandingAmount || debt.totalOutstanding || 0,
      currentEMI: debt.monthlyEMI || debt.monthlyPayment || 0,
      interestRate: debt.interestRate || debt.averageInterestRate || 0,
      remainingTenure: debt.remainingTenure || null
    }));

  // Calculate totals
  const totalOutstanding = activeDebts.reduce((sum, debt) => sum + debt.outstanding, 0);
  const totalCurrentEMI = activeDebts.reduce((sum, debt) => sum + debt.currentEMI, 0);

  // Calculate ratios
  const monthlyIncome = clientData?.totalMonthlyIncome || 0;
  const monthlyExpenses = clientData?.totalMonthlyExpenses || 0;
  const emiRatio = monthlyIncome > 0 ? ((totalCurrentEMI / monthlyIncome) * 100).toFixed(1) : 0;
  const fixedExpenseRatio = monthlyIncome > 0 ? (((monthlyExpenses + totalCurrentEMI) / monthlyIncome) * 100).toFixed(1) : 0;

  const startEditingEMI = (debtType, currentEMI) => {
    setEditingDebt(debtType);
    setTempEMI(currentEMI.toString());
  };

  const saveEMIEdit = (debtType) => {
    const newEMI = parseFloat(tempEMI) || 0;
    const updatedDebts = { ...debtsData };
    
    if (updatedDebts[debtType]) {
      if (updatedDebts[debtType].monthlyEMI !== undefined) {
        updatedDebts[debtType].monthlyEMI = newEMI;
      } else {
        updatedDebts[debtType].monthlyPayment = newEMI;
      }
    }

    const updatedClientData = {
      ...clientData,
      debtsAndLiabilities: updatedDebts
    };

    onDataUpdate(updatedClientData);
    setEditingDebt(null);
    setTempEMI('');
  };

  const cancelEMIEdit = () => {
    setEditingDebt(null);
    setTempEMI('');
  };

  if (activeDebts.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <CreditCard sx={{ color: '#6b7280', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Debt Management
          </Typography>
        </Box>
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No debts or liabilities recorded for this client.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb', borderRadius: 2 }}>
      <Box display="flex" alignItems="center" mb={3} pb={1} borderBottom="1px solid #e5e7eb">
        <CreditCard sx={{ color: '#6b7280', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          Debt Management
        </Typography>
      </Box>

      {/* Current Debt Analysis Table */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Current Debt Analysis:
      </Typography>

      <TableContainer sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Debt Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Outstanding</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Current EMI</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Interest Rate</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Recommended EMI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeDebts.map((debt) => {
              const isEditing = editingDebt === debt.type;
              const recommendation = aiSuggestions?.debtRecommendations?.[debt.type];
              
              return (
                <TableRow key={debt.type} sx={{ borderBottom: '1px solid #e5e7eb' }}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {debt.icon}
                      <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                        {debt.label}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>
                    {formatCurrency(debt.outstanding)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(debt.currentEMI)}
                  </TableCell>
                  <TableCell align="right">
                    {debt.interestRate ? `${debt.interestRate}%` : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                      {isEditing ? (
                        <>
                          <TextField
                            size="small"
                            value={tempEMI}
                            onChange={(e) => setTempEMI(e.target.value)}
                            type="number"
                            autoFocus
                            sx={{ width: 100, mr: 1 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => saveEMIEdit(debt.type)}
                            sx={{ color: '#16a34a', mr: 0.5 }}
                          >
                            <Save fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={cancelEMIEdit}
                            sx={{ color: '#ef4444' }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                            {formatCurrency(recommendation?.recommendedEMI || debt.currentEMI)}
                          </Typography>
                          {recommendation?.recommendedEMI && recommendation.recommendedEMI !== debt.currentEMI && (
                            <Chip
                              label={recommendation.recommendedEMI > debt.currentEMI ? '↑' : '→'}
                              size="small"
                              sx={{
                                bgcolor: recommendation.recommendedEMI > debt.currentEMI ? '#fee2e2' : '#f3f4f6',
                                color: recommendation.recommendedEMI > debt.currentEMI ? '#dc2626' : '#6b7280',
                                fontWeight: 600,
                                mr: 1
                              }}
                            />
                          )}
                          <IconButton 
                            size="small"
                            onClick={() => startEditingEMI(debt.type, debt.currentEMI)}
                            sx={{ color: '#6b7280' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* EMI Ratio Analysis */}
      <Box sx={{
        bgcolor: parseFloat(emiRatio) > 40 ? '#fef2f2' : '#f0f9ff',
        border: parseFloat(emiRatio) > 40 ? '1px solid #fecaca' : '1px solid #bfdbfe',
        borderRadius: 1,
        p: 2,
        mb: 3
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          EMI Ratio Analysis:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Current Total EMI: <strong>{formatCurrency(totalCurrentEMI)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly Income: <strong>{formatCurrency(monthlyIncome)}</strong>
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                EMI Ratio: <strong>{emiRatio}%</strong>
              </Typography>
              {parseFloat(emiRatio) > 40 && (
                <>
                  <Warning sx={{ color: '#ef4444', fontSize: 16, mr: 1 }} />
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 500 }}>
                    (Exceeds safe limit of 40%)
                  </Typography>
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Fixed Expenses: <strong>{formatCurrency(monthlyExpenses + totalCurrentEMI)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fixed Expense Ratio: <strong>{fixedExpenseRatio}%</strong>
            </Typography>
            {parseFloat(fixedExpenseRatio) > 50 && (
              <Box display="flex" alignItems="center" mt={1}>
                <Warning sx={{ color: '#ef4444', fontSize: 16, mr: 1 }} />
                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 500 }}>
                  High fixed expense ratio (&gt;50%)
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Strategy Recommendations */}
      {aiSuggestions?.debtStrategy && (
        <Box sx={{
          bgcolor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 1,
          p: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Strategy Recommendations:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {aiSuggestions.debtStrategy.map((strategy, index) => (
              <Box component="li" key={index} sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.primary">
                  {strategy}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default DebtManagementSection;