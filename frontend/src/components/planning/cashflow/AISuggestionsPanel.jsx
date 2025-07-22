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
  console.log('🎨 [AISuggestionsPanel] Component rendering with props:', {
    hasSuggestions: !!suggestions,
    isLoading: loading,
    hasClientData: !!clientData,
    suggestionsType: suggestions ? typeof suggestions : 'undefined',
    suggestionsKeys: suggestions ? Object.keys(suggestions) : [],
    hasError: !!suggestions?.error,
    hasAnalysis: !!suggestions?.analysis,
    hasSuccess: !!suggestions?.success,
    clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A',
    clientDataForRealtimeCalc: {
      hasCalculatedFinancials: !!clientData?.calculatedFinancials,
      monthlyIncome: clientData?.calculatedFinancials?.monthlyIncome || clientData?.totalMonthlyIncome,
      monthlyExpenses: clientData?.calculatedFinancials?.totalMonthlyExpenses || clientData?.totalMonthlyExpenses
    }
  });
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

  // Enhanced rendering for both AI and calculated recommendations  
  const renderAIRecommendations = () => {
    if (!clientData && !suggestions) return null;

    // Check if we have valid AI suggestions
    const hasAIAnalysis = suggestions && !suggestions.error && suggestions.analysis;
    const hasSuccessfulResponse = suggestions?.success && suggestions?.analysis;

    console.log('🎨 [AISuggestionsPanel] Rendering recommendations:', {
      hasAIAnalysis,
      hasSuccessfulResponse,
      suggestionsKeys: suggestions ? Object.keys(suggestions) : [],
      analysisKeys: suggestions?.analysis ? Object.keys(suggestions.analysis) : []
    });

    return (
      <Box>
        {/* Primary AI Analysis Section */}
        {hasAIAnalysis && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              🧠 Claude AI Financial Analysis
            </Typography>
            {renderDetailedAIAnalysis(suggestions.analysis)}
          </Box>
        )}

        {/* Fallback to real-time calculated recommendations */}
        {!hasAIAnalysis && clientData && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'secondary.main' }}>
              📊 Real-time Financial Analysis
            </Typography>
            {renderRealtimeRecommendations()}
          </Box>
        )}

        {/* Error state */}
        {suggestions?.error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              AI Analysis Unavailable
            </Typography>
            <Typography variant="body2">
              {suggestions.error}
            </Typography>
          </Alert>
        )}
      </Box>
    );
  };

  // Render detailed AI analysis from Claude
  const renderDetailedAIAnalysis = (analysis) => {
    return (
      <Box>
        {/* Debt Strategy Analysis */}
        {analysis.debtStrategy && (
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#fef2f2', 
            border: '2px solid #fecaca',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center',
              color: '#dc2626'
            }}>
              <CreditCard sx={{ fontSize: 20, mr: 1.5 }} />
              Debt Management Strategy
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {analysis.debtStrategy.overallStrategy || analysis.debtStrategy.strategy || 'Debt strategy analysis completed'}
            </Typography>

            {/* Show prioritized debts if available */}
            {analysis.debtStrategy.prioritizedDebts && analysis.debtStrategy.prioritizedDebts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Priority Debts:</Typography>
                {analysis.debtStrategy.prioritizedDebts.slice(0, 3).map((debt, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {debt.debtType || `Debt ${index + 1}`}: ₹{(debt.currentEMI || 0).toLocaleString('en-IN')}/month 
                    {debt.interestRate && ` (${debt.interestRate}% interest)`}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        )}

        {/* Financial Metrics */}
        {analysis.financialMetrics && (
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#eff6ff', 
            border: '2px solid #bfdbfe',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center',
              color: '#2563eb'
            }}>
              <Assessment sx={{ fontSize: 20, mr: 1.5 }} />
              Financial Health Analysis
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              {analysis.financialMetrics.currentEMIRatio && (
                <Box>
                  <Typography variant="caption" color="text.secondary">EMI Ratio</Typography>
                  <Typography variant="h6" color={analysis.financialMetrics.currentEMIRatio > 40 ? 'error.main' : 'success.main'}>
                    {analysis.financialMetrics.currentEMIRatio}%
                  </Typography>
                </Box>
              )}
              
              {analysis.financialMetrics.totalInterestSavings && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Potential Savings</Typography>
                  <Typography variant="h6" color="success.main">
                    ₹{analysis.financialMetrics.totalInterestSavings.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}
              
              {analysis.financialMetrics.financialHealthScore && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Health Score</Typography>
                  <Typography variant="h6" color="primary.main">
                    {analysis.financialMetrics.financialHealthScore}/100
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Recommendations */}
        {analysis.recommendations && (
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#f0fdf4', 
            border: '2px solid #bbf7d0',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center',
              color: '#059669'
            }}>
              <TrendingUp sx={{ fontSize: 20, mr: 1.5 }} />
              AI Recommendations
            </Typography>
            
            {/* Immediate Actions */}
            {analysis.recommendations.immediateActions && analysis.recommendations.immediateActions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'error.main' }}>
                  Immediate Actions (0-3 months):
                </Typography>
                {analysis.recommendations.immediateActions.map((action, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'error.main' }} />
                    {action}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Medium Term Actions */}
            {analysis.recommendations.mediumTermActions && analysis.recommendations.mediumTermActions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'warning.main' }}>
                  Medium Term Actions (3-12 months):
                </Typography>
                {analysis.recommendations.mediumTermActions.map((action, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'warning.main' }} />
                    {action}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Long Term Actions */}
            {analysis.recommendations.longTermActions && analysis.recommendations.longTermActions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'success.main' }}>
                  Long Term Actions (12+ months):
                </Typography>
                {analysis.recommendations.longTermActions.map((action, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'success.main' }} />
                    {action}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        )}

        {/* Warnings */}
        {analysis.warnings && analysis.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Risk Warnings:</Typography>
            {analysis.warnings.map((warning, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {warning}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Opportunities */}
        {analysis.opportunities && analysis.opportunities.length > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Opportunities:</Typography>
            {analysis.opportunities.map((opportunity, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {opportunity}
              </Typography>
            ))}
          </Alert>
        )}
      </Box>
    );
  };

  // Render real-time calculated recommendations (fallback)
  const renderRealtimeRecommendations = () => {
    return (
      <Box>
        {/* Debt Management Analysis */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#fef2f2', 
          border: '2px solid #fecaca',
          borderRadius: 2,
          '&:hover': { 
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)' 
          }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: '#dc2626'
          }}>
            <CreditCard sx={{ fontSize: 20, mr: 1.5 }} />
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
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#f0fdf4', 
          border: '2px solid #bbf7d0',
          borderRadius: 2,
          '&:hover': { 
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)' 
          }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: '#059669'
          }}>
            <Shield sx={{ fontSize: 20, mr: 1.5 }} />
            🤖 Emergency Fund Strategy
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
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#eff6ff', 
          border: '2px solid #bfdbfe',
          borderRadius: 2,
          '&:hover': { 
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)' 
          }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: '#2563eb'
          }}>
            <TrendingUp sx={{ fontSize: 20, mr: 1.5 }} />
            🤖 Investment Recommendations
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
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#faf5ff', 
          border: '2px solid #d8b4fe',
          borderRadius: 2,
          '&:hover': { 
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)' 
          }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: '#7c3aed'
          }}>
            <Assessment sx={{ fontSize: 20, mr: 1.5 }} />
            🤖 Cash Flow Optimization
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
      {/* Header */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
        🤖 AI Financial Recommendations
        {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
        {loading ? 'Analyzing financial data...' : 'Real-time analysis updates as you modify client data'}
      </Typography>

      {/* Main Recommendations Rendering */}
      {renderAIRecommendations()}
      
      {/* Footer */}
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