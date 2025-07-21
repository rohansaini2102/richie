import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  LinearProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingDown,
  Info,
  Edit,
  Calculate,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { prioritizeDebts, calculateTotalDebt, calculateTotalEMIs } from './utils/calculations';
import { formatCurrency, formatPercentage, getPriorityColor, formatTenure } from './utils/formatters';

const DebtManagement = ({ clientData, planData, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [prepaymentDialog, setPrepaymentDialog] = useState(false);
  const [prepaymentAmount, setPrepaymentAmount] = useState('');

  // Calculate debt metrics
  const debtMetrics = useMemo(() => {
    const prioritizedDebts = prioritizeDebts(clientData.debtsAndLiabilities);
    const totalDebt = calculateTotalDebt(clientData.debtsAndLiabilities);
    const totalEMI = calculateTotalEMIs(clientData.debtsAndLiabilities);
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const emiRatio = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;
    
    return {
      prioritizedDebts,
      totalDebt,
      totalEMI,
      emiRatio,
      debtCount: prioritizedDebts.length
    };
  }, [clientData]);

  const handlePrepaymentCalculation = () => {
    if (!selectedDebt || !prepaymentAmount) return;
    
    // Simple prepayment calculation
    const amount = parseFloat(prepaymentAmount);
    const interestSaved = (amount * selectedDebt.interestRate * selectedDebt.remainingTenure) / 1200;
    
    // Show calculation results
    alert(`Prepayment of ${formatCurrency(amount)} will save approximately ${formatCurrency(interestSaved)} in interest`);
    
    setPrepaymentDialog(false);
    setPrepaymentAmount('');
    setSelectedDebt(null);
  };

  const getDebtHealthIndicator = () => {
    if (debtMetrics.emiRatio === 0) {
      return { color: 'success', label: 'Debt Free', icon: <CheckCircle /> };
    } else if (debtMetrics.emiRatio < 30) {
      return { color: 'success', label: 'Healthy', icon: <CheckCircle /> };
    } else if (debtMetrics.emiRatio < 40) {
      return { color: 'warning', label: 'Manageable', icon: <Warning /> };
    } else {
      return { color: 'error', label: 'High Risk', icon: <Warning /> };
    }
  };

  const healthIndicator = getDebtHealthIndicator();

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
                    Total Outstanding
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {formatCurrency(debtMetrics.totalDebt)}
                  </Typography>
                </Box>
                <TrendingDown color="error" />
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
                    Monthly EMI
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(debtMetrics.totalEMI)}
                  </Typography>
                </Box>
                <Calculate color="primary" />
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
                    EMI to Income Ratio
                  </Typography>
                  <Typography variant="h5" color={getPriorityColor(debtMetrics.emiRatio > 40 ? 'high' : 'low')}>
                    {formatPercentage(debtMetrics.emiRatio)}
                  </Typography>
                </Box>
                <Info color="action" />
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
                    Debt Health
                  </Typography>
                  <Chip 
                    label={healthIndicator.label}
                    color={healthIndicator.color}
                    icon={healthIndicator.icon}
                    size="small"
                  />
                </Box>
                {healthIndicator.icon}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* EMI Ratio Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>EMI to Income Ratio Analysis</Typography>
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">Current Ratio</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatPercentage(debtMetrics.emiRatio)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(debtMetrics.emiRatio, 100)}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: debtMetrics.emiRatio <= 30 ? 'success.main' : 
                                   debtMetrics.emiRatio <= 40 ? 'warning.main' : 'error.main'
                }
              }}
            />
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="caption" color="text.secondary">0%</Typography>
              <Typography variant="caption" color="success.main">Safe (30%)</Typography>
              <Typography variant="caption" color="warning.main">Caution (40%)</Typography>
              <Typography variant="caption" color="error.main">Risk (50%+)</Typography>
            </Box>
          </Box>
          
          {debtMetrics.emiRatio > 40 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your EMI commitments exceed 40% of your income. Consider debt consolidation or increasing income.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Prioritized Debts Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Debt Prioritization</Typography>
            <Tooltip title="Debts are prioritized by interest rate">
              <Info fontSize="small" color="action" />
            </Tooltip>
          </Box>
          
          {debtMetrics.debtCount === 0 ? (
            <Alert severity="success">
              Congratulations! You are debt-free.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell>Debt Type</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">EMI</TableCell>
                    <TableCell align="right">Interest Rate</TableCell>
                    <TableCell>Recommendation</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debtMetrics.prioritizedDebts.map((debt) => (
                    <TableRow key={debt.key}>
                      <TableCell>
                        <Chip 
                          label={`#${debt.priorityRank}`}
                          color={debt.priority === 'high' ? 'error' : debt.priority === 'medium' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{debt.debtType}</TableCell>
                      <TableCell align="right">{formatCurrency(debt.outstandingAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(debt.currentEMI)}</TableCell>
                      <TableCell align="right">
                        <Typography color={debt.interestRate > 15 ? 'error' : 'inherit'}>
                          {formatPercentage(debt.interestRate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{debt.reason}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Calculate Prepayment">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedDebt(debt);
                              setPrepaymentDialog(true);
                            }}
                          >
                            <Calculate fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Prepayment Calculator Dialog */}
      <Dialog open={prepaymentDialog} onClose={() => setPrepaymentDialog(false)}>
        <DialogTitle>Prepayment Calculator</DialogTitle>
        <DialogContent>
          {selectedDebt && (
            <Box>
              <Typography variant="body2" gutterBottom>
                {selectedDebt.debtType} - Outstanding: {formatCurrency(selectedDebt.outstandingAmount)}
              </Typography>
              <TextField
                fullWidth
                label="Prepayment Amount"
                type="number"
                value={prepaymentAmount}
                onChange={(e) => setPrepaymentAmount(e.target.value)}
                margin="normal"
                InputProps={{
                  startAdornment: '₹'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrepaymentDialog(false)}>Cancel</Button>
          <Button onClick={handlePrepaymentCalculation} variant="contained">
            Calculate Savings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DebtManagement;