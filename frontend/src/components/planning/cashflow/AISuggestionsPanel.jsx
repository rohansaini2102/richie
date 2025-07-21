import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Grid,
  Skeleton,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Lightbulb,
  AccountBalance,
  Savings,
  ShowChart,
  CreditCard,
  Shield,
  Timeline,
  Assessment
} from '@mui/icons-material';

const AISuggestionsPanel = ({ suggestions, loading, clientData }) => {
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate real-time metrics from client data
  const calculateMetrics = () => {
    if (!clientData) return {};

    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    
    // Calculate total EMIs
    const debts = clientData.debtsAndLiabilities || {};
    const totalEMI = Object.values(debts).reduce((sum, debt) => {
      if (debt && debt.hasLoan) {
        return sum + (debt.monthlyEMI || debt.monthlyPayment || 0);
      }
      return sum;
    }, 0);

    // Calculate available surplus after EMIs
    const availableSurplus = Math.max(0, monthlySurplus - totalEMI);
    
    // Suggested emergency fund (6 months expenses)
    const emergencyFundTarget = monthlyExpenses * 6;

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlySurplus,
      totalEMI,
      availableSurplus,
      emergencyFundTarget,
      emiRatio: monthlyIncome > 0 ? ((totalEMI / monthlyIncome) * 100).toFixed(1) : 0
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          🤖 Analyzing your financial data...
        </Typography>
        <Skeleton variant="text" width="80%" height={30} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ my: 1 }} />
        <Skeleton variant="text" width="60%" height={25} />
        <Skeleton variant="rectangular" width="100%" height={80} sx={{ my: 1 }} />
        <Skeleton variant="text" width="70%" height={25} />
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ my: 1 }} />
      </Box>
    );
  }

  // Render real-time AI recommendations based on current client data
  const renderRealtimeRecommendations = () => {
    if (!clientData) return null;

    return (
      <Box>
        {/* Debt Management Analysis */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
            <CreditCard sx={{ fontSize: 16, mr: 1, color: '#dc2626' }} />
            Debt Management Analysis
          </Typography>
          
          {metrics.totalEMI > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Priority: Clear highest interest debt first
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                Current EMI Ratio: {metrics.emiRatio}%
                {parseFloat(metrics.emiRatio) > 40 && " ⚠️ (Exceeds safe limit)"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {parseFloat(metrics.emiRatio) > 40 
                  ? "Recommendation: Reduce debt burden or increase income"
                  : "EMI ratio is within safe limits"
                }
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No debt found - Great financial position!
            </Typography>
          )}
        </Paper>

        {/* Emergency Fund Strategy */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
            <Shield sx={{ fontSize: 16, mr: 1, color: '#059669' }} />
            Emergency Fund Strategy
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Target: {formatCurrency(metrics.emergencyFundTarget)} (6 months expenses)
          </Typography>
          
          {metrics.availableSurplus > 0 ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                Monthly Allocation: {formatCurrency(Math.min(metrics.availableSurplus * 0.4, metrics.emergencyFundTarget / 12))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timeline: {Math.ceil(metrics.emergencyFundTarget / Math.max(1, metrics.availableSurplus * 0.4))} months
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Insufficient surplus - optimize expenses first
            </Typography>
          )}
        </Paper>

        {/* Investment Recommendations */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ fontSize: 16, mr: 1, color: '#2563eb' }} />
            Investment Recommendations
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Risk Profile: {clientData.enhancedRiskProfile?.riskTolerance || 'Moderate'}
          </Typography>
          
          {metrics.availableSurplus > 5000 ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>
                Suggested Monthly SIP: {formatCurrency(Math.floor(metrics.availableSurplus * 0.6))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Equity: {formatCurrency(Math.floor(metrics.availableSurplus * 0.4))} (Large Cap + Mid Cap)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Debt: {formatCurrency(Math.floor(metrics.availableSurplus * 0.2))} (Corporate Bond/Debt Fund)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expected Returns: 10-12% annually
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Focus on debt reduction and emergency fund first
            </Typography>
          )}
        </Paper>

        {/* Cash Flow Optimization */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ fontSize: 16, mr: 1, color: '#7c3aed' }} />
            Cash Flow Optimization
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Available Surplus: {formatCurrency(metrics.availableSurplus)}/month
          </Typography>
          
          {metrics.availableSurplus > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#7c3aed', mb: 1 }}>
                Optimal Allocation:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Emergency Fund: {formatCurrency(Math.floor(metrics.availableSurplus * 0.3))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Investments: {formatCurrency(Math.floor(metrics.availableSurplus * 0.6))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Buffer: {formatCurrency(Math.floor(metrics.availableSurplus * 0.1))}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Current expenses exceed income - budgeting required
            </Typography>
          )}
        </Paper>

        {/* Key Insights */}
        {(parseFloat(metrics.emiRatio) > 40 || metrics.availableSurplus < 0) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ⚠️ Financial Health Alert:
            </Typography>
            <Typography variant="body2">
              {parseFloat(metrics.emiRatio) > 40 && "• High EMI ratio needs attention"}
            </Typography>
            <Typography variant="body2">
              {metrics.availableSurplus < 0 && "• Monthly deficit requires immediate budgeting"}
            </Typography>
          </Alert>
        )}

        {/* Success Indicators */}
        {metrics.availableSurplus > 10000 && parseFloat(metrics.emiRatio) < 30 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ✅ Strong Financial Position:
            </Typography>
            <Typography variant="body2">
              • Healthy surplus for investments and goals
            </Typography>
            <Typography variant="body2">
              • Low debt burden - good foundation for wealth building
            </Typography>
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
        Real-time analysis updates as you modify client data
      </Typography>
      
      {suggestions?.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">{suggestions.error}</Typography>
        </Alert>
      ) : (
        renderRealtimeRecommendations()
      )}

      {/* API-based suggestions if available */}
      {suggestions && !suggestions.error && (
        <Box mt={2}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            🤖 Advanced AI Analysis:
          </Typography>
          {/* Render API suggestions here if needed */}
        </Box>
      )}
      
      <Box mt={2}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          💡 These recommendations update in real-time as you modify the client's financial data. 
          Use them as guidance alongside your professional judgment.
        </Typography>
      </Box>
    </Box>
  );
};

export default AISuggestionsPanel;