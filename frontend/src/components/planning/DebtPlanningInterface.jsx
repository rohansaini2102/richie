import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Psychology,
  Calculate,
  Refresh,
  Save,
  Edit
} from '@mui/icons-material';
import { planAPI } from '../../services/api';

const DebtPlanningInterface = ({ clientId, clientData, planId, onPlanUpdate }) => {
  console.log('💰 [DebtPlanningInterface] Component mounting:', {
    clientId,
    planId,
    hasClientData: !!clientData,
    clientName: clientData?.firstName + ' ' + clientData?.lastName
  });
  
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [debtStrategy, setDebtStrategy] = useState(null);
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState('debts');

  useEffect(() => {
    console.log('🔄 [DebtPlanningInterface] useEffect triggered:', {
      hasClientData: !!clientData,
      shouldAnalyze: !!clientData
    });
    
    if (clientData) {
      analyzeDebtStrategy();
    } else {
      console.warn('⚠️ [DebtPlanningInterface] No client data provided, skipping analysis');
    }
  }, [clientData]);

  const analyzeDebtStrategy = async () => {
    console.log('🤖 [DebtPlanningInterface] Starting AI debt analysis...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 [DebtPlanningInterface] Calling planAPI.analyzeDebt...', {
        clientId,
        hasClientData: !!clientData
      });
      
      const response = await planAPI.analyzeDebt(clientId, clientData);
      
      console.log('✅ [DebtPlanningInterface] AI analysis response:', {
        success: response?.success,
        hasAnalysis: !!response?.analysis,
        hasDebtStrategy: !!response?.analysis?.debtStrategy,
        error: response?.error
      });
      
      if (response.success) {
        setAiAnalysis(response.analysis);
        setDebtStrategy(response.analysis.debtStrategy);
        console.log('🎯 [DebtPlanningInterface] AI analysis completed successfully');
      } else {
        console.error('❌ [DebtPlanningInterface] AI analysis failed:', response.error);
        setError(response.error || 'Failed to analyze debt strategy');
      }
    } catch (err) {
      console.error('💥 [DebtPlanningInterface] Debt analysis error:', {
        error: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError('Failed to connect to AI analysis service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyUpdate = (debtIndex, field, value) => {
    if (!editingStrategy) return;
    
    const updatedStrategy = { ...debtStrategy };
    updatedStrategy.prioritizedDebts[debtIndex][field] = value;
    setDebtStrategy(updatedStrategy);
  };

  const saveStrategy = async () => {
    try {
      setLoading(true);
      const response = await planAPI.updateDebtStrategy(planId, {
        debtStrategy,
        aiAnalysis,
        advisorNotes: 'Strategy reviewed and modified by advisor'
      });
      
      if (response.success) {
        setEditingStrategy(false);
        onPlanUpdate && onPlanUpdate(response.plan);
      }
    } catch (err) {
      setError('Failed to save strategy');
    } finally {
      setLoading(false);
    }
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

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getPriorityColor = (rank) => {
    switch (rank) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'success';
    }
  };

  const getPriorityLabel = (rank) => {
    switch (rank) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      default: return 'Low';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          💰 Debt Management Planning
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={analyzeDebtStrategy}
            disabled={loading}
          >
            Re-analyze
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              console.log('🧪 [DebtPlanningInterface] Testing AI service...');
              try {
                const response = await fetch('/api/plans/test/ai-service', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
                const result = await response.json();
                console.log('🔬 AI Service Test Result:', result);
                alert(`AI Service Test: ${result.success ? 'PASSED' : 'FAILED'}\n${result.testResponse || result.error}`);
              } catch (err) {
                console.error('AI Service Test Error:', err);
                alert('AI Service Test Failed: ' + err.message);
              }
            }}
            disabled={loading}
          >
            Test AI
          </Button>
          {debtStrategy && (
            <Button
              variant={editingStrategy ? "contained" : "outlined"}
              startIcon={editingStrategy ? <Save /> : <Edit />}
              onClick={editingStrategy ? saveStrategy : () => setEditingStrategy(true)}
              disabled={loading}
            >
              {editingStrategy ? 'Save Strategy' : 'Edit Strategy'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Client Debt Data & Strategy */}
        <Grid item xs={12} lg={8}>
          {/* Current Debt Overview */}
          <Accordion expanded={expanded === 'debts'} onChange={handleAccordionChange('debts')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={2}>
                <Calculate color="primary" />
                <Typography variant="h6">Current Debt Portfolio</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {clientData?.debtsAndLiabilities && (
                <DebtPortfolioDisplay debts={clientData.debtsAndLiabilities} />
              )}
            </AccordionDetails>
          </Accordion>

          {/* AI Strategy Recommendations */}
          {debtStrategy && (
            <Accordion expanded={expanded === 'strategy'} onChange={handleAccordionChange('strategy')} sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Psychology color="secondary" />
                  <Typography variant="h6">Recommended Debt Strategy</Typography>
                  {!editingStrategy && (
                    <Chip label="AI Generated" size="small" color="secondary" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <DebtStrategyTable
                  strategy={debtStrategy}
                  editingMode={editingStrategy}
                  onUpdate={handleStrategyUpdate}
                  formatCurrency={formatCurrency}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                />
              </AccordionDetails>
            </Accordion>
          )}

          {/* Loading State */}
          {loading && (
            <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Analyzing Debt Strategy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI is analyzing your client's debt portfolio and generating optimization strategies...
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column - AI Analysis & Insights */}
        <Grid item xs={12} lg={4}>
          {aiAnalysis && (
            <AIAnalysisPanel 
              analysis={aiAnalysis}
              formatCurrency={formatCurrency}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

// Component for displaying current debt portfolio
const DebtPortfolioDisplay = ({ debts }) => {
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
  const activeDebts = [];

  debtTypes.forEach(type => {
    const debt = debts[type];
    if (debt && (debt.hasLoan || debt.hasDebt)) {
      const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
      const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
      
      if (emi > 0 || outstanding > 0) {
        activeDebts.push({
          type,
          ...debt,
          monthlyEMI: emi,
          outstandingAmount: outstanding,
          interestRate: parseFloat(debt.interestRate) || parseFloat(debt.averageInterestRate) || 0
        });
      }
    }
  });

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Debt Type</strong></TableCell>
            <TableCell align="right"><strong>Outstanding</strong></TableCell>
            <TableCell align="right"><strong>Monthly EMI</strong></TableCell>
            <TableCell align="right"><strong>Interest Rate</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activeDebts.map((debt, index) => (
            <TableRow key={index}>
              <TableCell>
                {debt.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </TableCell>
              <TableCell align="right">{formatCurrency(debt.outstandingAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(debt.monthlyEMI)}</TableCell>
              <TableCell align="right">{debt.interestRate}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Component for debt strategy table
const DebtStrategyTable = ({ strategy, editingMode, onUpdate, formatCurrency, getPriorityColor, getPriorityLabel }) => {
  if (!strategy?.prioritizedDebts) return null;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Priority</strong></TableCell>
            <TableCell><strong>Debt Type</strong></TableCell>
            <TableCell align="right"><strong>Current EMI</strong></TableCell>
            <TableCell align="right"><strong>Recommended EMI</strong></TableCell>
            <TableCell align="right"><strong>Interest Savings</strong></TableCell>
            <TableCell><strong>Reasoning</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {strategy.prioritizedDebts.map((debt, index) => (
            <TableRow key={index}>
              <TableCell>
                <Chip 
                  label={`${debt.priorityRank} - ${getPriorityLabel(debt.priorityRank)}`}
                  color={getPriorityColor(debt.priorityRank)}
                  size="small"
                />
              </TableCell>
              <TableCell>{debt.debtType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</TableCell>
              <TableCell align="right">{formatCurrency(debt.currentEMI)}</TableCell>
              <TableCell align="right">
                {editingMode ? (
                  <TextField
                    type="number"
                    value={debt.recommendedEMI}
                    onChange={(e) => onUpdate(index, 'recommendedEMI', parseFloat(e.target.value))}
                    size="small"
                    sx={{ width: 120 }}
                  />
                ) : (
                  formatCurrency(debt.recommendedEMI)
                )}
              </TableCell>
              <TableCell align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  {debt.interestSavings > 0 ? <TrendingDown color="success" /> : <TrendingUp color="error" />}
                  {formatCurrency(Math.abs(debt.interestSavings))}
                </Box>
              </TableCell>
              <TableCell>
                {editingMode ? (
                  <TextField
                    multiline
                    value={debt.reasoning}
                    onChange={(e) => onUpdate(index, 'reasoning', e.target.value)}
                    size="small"
                    fullWidth
                  />
                ) : (
                  debt.reasoning
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Component for AI analysis panel
const AIAnalysisPanel = ({ analysis, formatCurrency }) => {
  return (
    <Box>
      {/* Financial Metrics */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="secondary">
            📊 Financial Health Metrics
          </Typography>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">EMI Ratio</Typography>
            <Typography variant="h5">
              {analysis.financialMetrics?.currentEMIRatio}% → {analysis.financialMetrics?.targetEMIRatio}%
            </Typography>
          </Box>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">Monthly Surplus</Typography>
            <Typography variant="h5" color="success.main">
              {formatCurrency(analysis.financialMetrics?.monthlySurplus)}
            </Typography>
          </Box>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">Total Interest Savings</Typography>
            <Typography variant="h5" color="primary.main">
              {formatCurrency(analysis.financialMetrics?.totalInterestSavings)}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">Debt-Free Timeline</Typography>
            <Typography variant="h6">
              {analysis.financialMetrics?.debtFreeTimeline}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            💡 Key Recommendations
          </Typography>
          
          {analysis.recommendations?.immediateActions && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight="bold">Immediate Actions:</Typography>
              {analysis.recommendations.immediateActions.map((action, idx) => (
                <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CheckCircle color="success" fontSize="small" />
                  {action}
                </Typography>
              ))}
            </Box>
          )}
          
          {analysis.recommendations?.mediumTermActions && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight="bold">Medium-term Actions:</Typography>
              {analysis.recommendations.mediumTermActions.map((action, idx) => (
                <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <TrendingUp color="info" fontSize="small" />
                  {action}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              ⚠️ Risk Warnings
            </Typography>
            {analysis.warnings.map((warning, idx) => (
              <Alert key={idx} severity="warning" sx={{ mb: 1 }}>
                {warning}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {analysis.opportunities && analysis.opportunities.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              🚀 Opportunities
            </Typography>
            {analysis.opportunities.map((opportunity, idx) => (
              <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUp color="success" fontSize="small" />
                {opportunity}
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DebtPlanningInterface;