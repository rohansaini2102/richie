import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  IconButton,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete,
  Fab,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  ExpandMore,
  TrendingUp,
  Warning,
  AccountBalance,
  Savings,
  ShowChart,
  Assessment,
  AutoAwesome,
  Add,
  Delete,
  CheckCircle,
  Error,
  Info,
  Person,
  MonetizationOn,
  TrendingDown,
  Security,
  Timeline,
  Analytics,
  PictureAsPdf,
  Download,
  CloudUpload,
  ArrowBack
} from '@mui/icons-material';
import { planAPI, clientAPI } from '../../services/api';
import DebtPlanningInterface from './DebtPlanningInterface';
import ErrorBoundary from './ErrorBoundary';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';
import AISuggestionsPanel from './cashflow/AISuggestionsPanel';
import CashFlowPDFGeneratorComponent from './cashflow/CashFlowPDFGenerator';
import { generateCashFlowPDF } from './cashflow/CashFlowPDFDocument';
import axios from 'axios';

const CashFlowPlanning = ({ planId, clientId, onBack }) => {
  console.log('🚀 [CashFlowPlanning] Component mounting:', { planId, clientId });
  
  const [plan, setPlan] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedClient, setEditedClient] = useState(null);
  const [activeSection, setActiveSection] = useState('client-review');
  const [calculatedMetrics, setCalculatedMetrics] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [customVariables, setCustomVariables] = useState([]);
  const [newCustomVariable, setNewCustomVariable] = useState({ name: '', value: '', description: '' });
  const [planSummary, setPlanSummary] = useState(null);
  const [error, setError] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  
  // New state for save and PDF functionality
  const [savedPlanId, setSavedPlanId] = useState(planId); // Use existing planId if available
  const [isPlanSaved, setIsPlanSaved] = useState(!!planId); // True if planId exists
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Use the new AI Recommendations hook
  const {
    aiRecommendations,
    isLoading: aiLoading,
    error: aiError,
    isFallback,
    generateRecommendations,
    updateRecommendations,
    clearRecommendations,
    areRecommendationsStale
  } = useAIRecommendations(clientId, planId);

  // Fetch plan and client data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      // Load both plan and client data
      await Promise.all([
        fetchPlanData(),
        fetchClientData()
      ]);
      
      setLoading(false);
    };
    
    if (planId && clientId) {
      loadData();
    } else {
      setError('Missing planId or clientId');
      setLoading(false);
    }
  }, [planId, clientId]);

  // Utility functions with enhanced validation
  const calculateTotalEMIs = (debts) => {
    if (!debts || typeof debts !== 'object') {
      console.warn('Invalid debts object provided to calculateTotalEMIs:', debts);
      return 0;
    }
    
    let total = 0;
    const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
    
    debtTypes.forEach(type => {
      const debt = debts[type];
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        if (emi > 0) {
          total += emi;
        }
      }
    });
    
    return Math.max(0, total); // Ensure non-negative
  };

  const calculateFinancialHealthScore = (metrics) => {
    if (!metrics || typeof metrics !== 'object') {
      console.warn('Invalid metrics provided to calculateFinancialHealthScore:', metrics);
      return 0;
    }

    let score = 0;
    const maxScore = 10;
    
    // Ensure all metrics have valid values
    const monthlyIncome = parseFloat(metrics.monthlyIncome) || 0;
    const monthlyExpenses = parseFloat(metrics.monthlyExpenses) || 0;
    const emiRatio = parseFloat(metrics.emiRatio) || 0;
    const savingsRate = parseFloat(metrics.savingsRate) || 0;

    // Income stability (2 points)
    if (monthlyIncome > 0) score += 2;

    // Expense management (2 points) - only calculate if income > 0
    if (monthlyIncome > 0) {
      const expenseRatio = monthlyExpenses / monthlyIncome;
      if (expenseRatio < 0.5) score += 2;
      else if (expenseRatio < 0.7) score += 1;
    }

    // Debt management (3 points)
    if (emiRatio === 0) score += 3;
    else if (emiRatio < 30) score += 2;
    else if (emiRatio < 40) score += 1;

    // Savings (2 points)
    if (savingsRate > 20) score += 2;
    else if (savingsRate > 10) score += 1;

    // Emergency fund (1 point)
    if (metrics.hasEmergencyFund) score += 1;

    return Math.min(Math.max(score, 0), maxScore); // Ensure between 0 and 10
  };

  const prioritizeDebts = (debts) => {
    if (!debts || typeof debts !== 'object') {
      console.warn('Invalid debts object provided to prioritizeDebts:', debts);
      return [];
    }
    
    const debtList = [];
    const debtTypes = {
      'creditCards': 'Credit Card',
      'personalLoan': 'Personal Loan',
      'businessLoan': 'Business Loan',
      'carLoan': 'Car Loan',
      'educationLoan': 'Education Loan',
      'goldLoan': 'Gold Loan',
      'homeLoan': 'Home Loan',
      'otherLoans': 'Other Loans'
    };

    Object.entries(debtTypes).forEach(([key, name]) => {
      const debt = debts[key];
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const outstandingAmount = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
        const currentEMI = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const interestRate = parseFloat(debt.interestRate) || parseFloat(debt.averageInterestRate) || 0;
        
        // Only include debts with positive outstanding amount
        if (outstandingAmount > 0) {
          debtList.push({
            debtType: name,
            outstandingAmount,
            currentEMI,
            recommendedEMI: currentEMI,
            interestRate,
            priorityRank: 0,
            reason: '',
            projectedSavings: 0,
            revisedTenure: parseFloat(debt.remainingTenure) || 0
          });
        }
      }
    });

    // Sort by interest rate (highest first)
    debtList.sort((a, b) => b.interestRate - a.interestRate);

    // Assign priority ranks and reasons
    debtList.forEach((debt, index) => {
      debt.priorityRank = index + 1;
      if (debt.interestRate >= 15) {
        debt.reason = 'High interest rate - Priority repayment recommended';
      } else if (debt.interestRate >= 10) {
        debt.reason = 'Moderate interest rate - Standard repayment';
      } else {
        debt.reason = 'Low interest rate - Maintain minimum payment';
      }
    });

    return debtList;
  };

  // Calculate financial metrics whenever client data changes
  const financialMetrics = useMemo(() => {
    console.log('🧮 [Financial Metrics] Calculating with editedClient:', {
      hasEditedClient: !!editedClient,
      clientType: typeof editedClient,
      clientData: editedClient ? {
        firstName: editedClient.firstName,
        totalMonthlyIncome: editedClient.totalMonthlyIncome,
        totalMonthlyExpenses: editedClient.totalMonthlyExpenses,
        hasDebts: !!editedClient.debtsAndLiabilities
      } : null
    });

    if (!editedClient || typeof editedClient !== 'object') {
      console.warn('❌ Invalid client data for financial metrics calculation');
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalEMIs: 0,
        monthlySurplus: 0,
        emiRatio: 0,
        fixedExpenditureRatio: 0,
        savingsRate: 0,
        financialHealthScore: 0,
        emergencyFundTarget: 0,
        emergencyFundCurrent: 0
      };
    }
    
    try {
      const monthlyIncome = Math.max(0, parseFloat(editedClient.totalMonthlyIncome) || 0);
      const monthlyExpenses = Math.max(0, parseFloat(editedClient.totalMonthlyExpenses) || 0);
      const totalEMIs = calculateTotalEMIs(editedClient.debtsAndLiabilities);
      const monthlySurplus = monthlyIncome - monthlyExpenses - totalEMIs;
      
      const emiRatio = monthlyIncome > 0 ? (totalEMIs / monthlyIncome) * 100 : 0;
      const fixedExpenditureRatio = monthlyIncome > 0 ? ((monthlyExpenses + totalEMIs) / monthlyIncome) * 100 : 0;
      const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;
      
      const emergencyFundCurrent = Math.max(0, parseFloat(editedClient.assets?.cashBankSavings) || 0);
      const emergencyFundTarget = Math.max(monthlyExpenses * 6, 50000); // Minimum ₹50,000
      
      const financialHealthScore = calculateFinancialHealthScore({
        monthlyIncome,
        monthlyExpenses,
        totalEMIs,
        emiRatio,
        savingsRate,
        hasEmergencyFund: emergencyFundCurrent >= (monthlyExpenses * 3)
      });
      
      const metrics = {
        monthlyIncome: Math.round(monthlyIncome),
        monthlyExpenses: Math.round(monthlyExpenses),
        totalEMIs: Math.round(totalEMIs),
        monthlySurplus: Math.round(monthlySurplus),
        emiRatio: Math.round(emiRatio * 10) / 10, // Round to 1 decimal
        fixedExpenditureRatio: Math.round(fixedExpenditureRatio * 10) / 10,
        savingsRate: Math.round(savingsRate * 10) / 10,
        financialHealthScore: Math.round(financialHealthScore * 10) / 10,
        emergencyFundTarget: Math.round(emergencyFundTarget),
        emergencyFundCurrent: Math.round(emergencyFundCurrent)
      };
      
      // Log metrics for debugging
      console.log('📊 Calculated financial metrics:', metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalEMIs: 0,
        monthlySurplus: 0,
        emiRatio: 0,
        fixedExpenditureRatio: 0,
        savingsRate: 0,
        financialHealthScore: 0,
        emergencyFundTarget: 0,
        emergencyFundCurrent: 0
      };
    }
  }, [editedClient]);

  // Validation rules
  useEffect(() => {
    const errors = [];
    
    if (financialMetrics.emiRatio > 40) {
      errors.push({ type: 'error', message: `EMI ratio ${financialMetrics.emiRatio.toFixed(1)}% exceeds safe limit of 40%` });
    }
    
    if (financialMetrics.fixedExpenditureRatio > 50) {
      errors.push({ type: 'warning', message: `Fixed expenditure ratio ${financialMetrics.fixedExpenditureRatio.toFixed(1)}% exceeds recommended 50%` });
    }
    
    if (financialMetrics.monthlySurplus < 0) {
      errors.push({ type: 'error', message: 'Negative monthly surplus indicates cash flow issues' });
    }
    
    if (financialMetrics.emergencyFundCurrent < financialMetrics.emergencyFundTarget) {
      const gap = financialMetrics.emergencyFundTarget - financialMetrics.emergencyFundCurrent;
      errors.push({ type: 'info', message: `Emergency fund gap: ₹${gap.toLocaleString('en-IN')}` });
    }
    
    setValidationErrors(errors);
  }, [financialMetrics]);

  // Validate client data for AI analysis
  const validateClientDataForAI = useCallback((clientData) => {
    const required = ['totalMonthlyIncome', 'totalMonthlyExpenses'];
    const missing = required.filter(field => !clientData[field] || clientData[field] <= 0);
    
    if (missing.length > 0) {
      throw new Error(`Please provide valid ${missing.join(' and ')} for AI analysis`);
    }
    
    // Check if client has any meaningful financial data
    const hasFinancialData = clientData.totalMonthlyIncome > 0 || 
                            Object.keys(clientData.debtsAndLiabilities || {}).length > 0 ||
                            (clientData.assets?.investments && Object.keys(clientData.assets.investments).length > 0);
    
    if (!hasFinancialData) {
      throw new Error('Please add financial information (income, expenses, or debts) for AI analysis');
    }
    
    return true;
  }, []);

  // Debounced AI recommendations update using the new hook
  const debouncedAIUpdate = useCallback(
    (() => {
      let timeoutId;
      return (clientData) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (clientData && clientId) {
            console.log('🤖 [CashFlowPlanning] Auto-updating AI recommendations after debounce...');
            await generateRecommendations(clientData, financialMetrics, false); // forceRefresh = false
          }
        }, 3000); // 3 second delay after user stops editing
      };
    })(),
    [clientId, generateRecommendations, financialMetrics]
  );

  // Auto-update AI when client data changes
  useEffect(() => {
    if (editedClient && clientId) {
      debouncedAIUpdate(editedClient);
    }
  }, [editedClient, clientId, debouncedAIUpdate]);

  const fetchPlanData = async () => {
    if (!planId) {
      console.warn('No planId provided for fetchPlanData');
      return;
    }

    setPlanLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching plan data for planId:', planId);
      const response = await planAPI.getPlanById(planId);
      
      // Extract plan from the consistent API response
      const planData = response?.plan || response;
      
      if (!planData) {
        throw new Error('Plan data not found in response');
      }
      
      console.log('✅ Plan data fetched successfully:', {
        planId: planData._id,
        planType: planData.planType,
        status: planData.status
      });
      
      setPlan(planData);
      // Use the AI hook to update recommendations instead of direct state
      if (planData.aiRecommendations) {
        updateRecommendations(planData.aiRecommendations);
      }
      
      // Initialize custom variables if they exist
      if (planData.advisorRecommendations?.customVariables) {
        setCustomVariables(planData.advisorRecommendations.customVariables);
      }
      
    } catch (error) {
      console.error('❌ Error fetching plan:', error);
      setError(`Failed to load plan: ${error.response?.data?.error || error.message}`);
      
      // Initialize empty plan structure to prevent crashes
      const emptyPlan = {
        _id: planId,
        planType: 'cash_flow',
        status: 'draft',
        planDetails: {
          cashFlowPlan: {
            debtManagement: { prioritizedDebts: [] },
            emergencyFundStrategy: {},
            investmentRecommendations: { 
              monthlyInvestments: [],
              oneTimeInvestments: [],
              assetAllocation: { equity: 70, debt: 30, gold: 0, others: 0 }
            }
          }
        },
        advisorRecommendations: { customVariables: [] },
        reviewSchedule: { frequency: 'quarterly' }
      };
      setPlan(emptyPlan);
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchClientData = async () => {
    if (!clientId) {
      console.warn('No clientId provided for fetchClientData');
      setLoading(false);
      return;
    }

    setClientLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching client data for clientId:', clientId);
      const clientData = await clientAPI.getClientById(clientId);
      
      if (!clientData) {
        throw new Error('Client data not found in response');
      }
      
      console.log('✅ Client data fetched successfully:', {
        clientId: clientData._id,
        name: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim(),
        completionPercentage: clientData.completionPercentage
      });
      
      // Add default values for missing fields to prevent crashes
      // Convert annualIncome to totalMonthlyIncome if needed
      let totalMonthlyIncome = clientData.totalMonthlyIncome;
      if (!totalMonthlyIncome && clientData.annualIncome) {
        totalMonthlyIncome = Math.round(clientData.annualIncome / 12);
        console.log('🔄 [Data Transform] Converting annualIncome to totalMonthlyIncome:', {
          annualIncome: clientData.annualIncome,
          convertedMonthlyIncome: totalMonthlyIncome
        });
      }
      
      const enhancedClientData = {
        ...clientData,
        totalMonthlyIncome: totalMonthlyIncome || 0,
        totalMonthlyExpenses: clientData.totalMonthlyExpenses || 0,
        debtsAndLiabilities: clientData.debtsAndLiabilities || {},
        assets: {
          ...clientData.assets,
          cashBankSavings: clientData.assets?.cashBankSavings || 0,
          investments: {
            equity: {
              mutualFunds: clientData.assets?.investments?.equity?.mutualFunds || 0,
              directStocks: clientData.assets?.investments?.equity?.directStocks || 0,
              elss: clientData.assets?.investments?.equity?.elss || 0,
              ...clientData.assets?.investments?.equity
            },
            fixedIncome: {
              ppf: clientData.assets?.investments?.fixedIncome?.ppf || 0,
              epf: clientData.assets?.investments?.fixedIncome?.epf || 0,
              nps: clientData.assets?.investments?.fixedIncome?.nps || 0,
              fixedDeposits: clientData.assets?.investments?.fixedIncome?.fixedDeposits || 0,
              ...clientData.assets?.investments?.fixedIncome
            },
            ...clientData.assets?.investments
          },
          ...clientData.assets
        }
      };
      
      setClient(enhancedClientData);
      setEditedClient(enhancedClientData);
      
    } catch (error) {
      console.error('❌ Error fetching client:', error);
      setError(`Failed to load client data: ${error.response?.data?.error || error.message}`);
      
      // Set minimal client data to prevent crashes
      const emptyClient = {
        _id: clientId,
        firstName: 'Unknown',
        lastName: 'Client',
        totalMonthlyIncome: 0,
        totalMonthlyExpenses: 0,
        debtsAndLiabilities: {},
        assets: {
          cashBankSavings: 0,
          investments: {
            equity: { mutualFunds: 0, directStocks: 0, elss: 0 },
            fixedIncome: { ppf: 0, epf: 0, nps: 0, fixedDeposits: 0 }
          }
        }
      };
      setClient(emptyClient);
      setEditedClient(emptyClient);
    } finally {
      setClientLoading(false);
      setLoading(false);
    }
  };

  const handleClientUpdate = async () => {
    setSaving(true);
    try {
      await clientAPI.updateClient(clientId, editedClient);
      setClient(editedClient);
      setEditMode(false);
      // Refresh plan with updated client data
      await fetchPlanData();
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value, nested = null) => {
    if (!editedClient) {
      console.warn('Attempted to update client field but no client data available');
      return;
    }

    try {
      // Validate and sanitize the value
      let sanitizedValue = value;
      
      // For numeric fields, ensure valid numbers
      if (['totalMonthlyIncome', 'totalMonthlyExpenses', 'numberOfDependents'].includes(field) || 
          (typeof value === 'string' && value.match(/^\d*\.?\d*$/))) {
        sanitizedValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
      }

      if (nested) {
        const nestedKeys = nested.split('.');
        const updatedClient = { ...editedClient };
        let current = updatedClient;
        
        // Navigate to the nested object, creating missing objects
        for (let i = 0; i < nestedKeys.length - 1; i++) {
          if (!current[nestedKeys[i]] || typeof current[nestedKeys[i]] !== 'object') {
            current[nestedKeys[i]] = {};
          }
          current = current[nestedKeys[i]];
        }
        
        // Set the final value
        const lastKey = nestedKeys[nestedKeys.length - 1];
        if (!current[lastKey] || typeof current[lastKey] !== 'object') {
          current[lastKey] = {};
        }
        current[lastKey][field] = sanitizedValue;
        
        setEditedClient(updatedClient);
        console.log(`Updated nested field: ${nested}.${field} = ${sanitizedValue}`);
      } else {
        const updatedClient = {
          ...editedClient,
          [field]: sanitizedValue
        };
        setEditedClient(updatedClient);
        console.log(`Updated field: ${field} = ${sanitizedValue}`);
      }
    } catch (error) {
      console.error('Error updating client field:', error);
      setError(`Failed to update ${field}: ${error.message}`);
    }
  };

  // Generate fallback recommendations based on financial metrics
  const generateFallbackRecommendations = (metrics) => {
    const recommendations = {
      debtStrategy: "",
      emergencyFundAnalysis: "",
      investmentAnalysis: "",
      cashFlowOptimization: "",
      riskWarnings: [],
      opportunities: []
    };

    // Debt strategy recommendations
    if (metrics.emiRatio > 40) {
      recommendations.debtStrategy = `Your EMI ratio of ${metrics.emiRatio.toFixed(1)}% exceeds the safe limit. Consider increasing EMI on high-interest loans to reduce overall debt burden.`;
      recommendations.riskWarnings.push("High debt-to-income ratio detected");
    } else if (metrics.totalEMIs > 0) {
      recommendations.debtStrategy = `Your EMI ratio of ${metrics.emiRatio.toFixed(1)}% is healthy. Consider extra payments to clear debts faster.`;
    } else {
      recommendations.debtStrategy = "No existing debts detected. Excellent! Focus on wealth building.";
    }

    // Emergency fund analysis
    const emergencyFundGap = metrics.emergencyFundTarget - metrics.emergencyFundCurrent;
    if (emergencyFundGap > 0) {
      recommendations.emergencyFundAnalysis = `Build emergency fund: Need ₹${emergencyFundGap.toLocaleString('en-IN')} more to reach 6-month expense target.`;
      recommendations.opportunities.push("Build emergency fund to improve financial security");
    } else {
      recommendations.emergencyFundAnalysis = "Emergency fund target achieved! Great financial discipline.";
    }

    // Investment analysis
    if (metrics.monthlySurplus > 0) {
      recommendations.investmentAnalysis = `Available surplus: ₹${metrics.monthlySurplus.toLocaleString('en-IN')}/month for investments. Consider SIP in equity mutual funds.`;
      recommendations.opportunities.push("Invest monthly surplus for wealth creation");
    } else {
      recommendations.investmentAnalysis = "Focus on improving cash flow before starting investments.";
      recommendations.riskWarnings.push("Negative cash flow - review expenses");
    }

    // Cash flow optimization
    if (metrics.savingsRate < 20) {
      recommendations.cashFlowOptimization = `Savings rate of ${metrics.savingsRate.toFixed(1)}% is below ideal 20%. Review expenses and increase income.`;
    } else {
      recommendations.cashFlowOptimization = `Excellent savings rate of ${metrics.savingsRate.toFixed(1)}%! You're on track for financial goals.`;
    }

    return recommendations;
  };

  const generateAIRecommendations = useCallback(async () => {
    if (!editedClient || !clientId) {
      setError('No client data available for AI analysis');
      return;
    }

    console.log('🤖 [CashFlowPlanning] Triggering manual AI recommendation generation');
    await generateRecommendations(editedClient, financialMetrics, true); // forceRefresh = true
  }, [editedClient, clientId, generateRecommendations, financialMetrics]);

  const savePlan = async () => {
    if (!plan || !plan._id) {
      setError('No plan data to save');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      console.log('💾 [CashFlowPlanning] Starting plan save...', { 
        planId: plan._id,
        hasAIRecommendations: !!aiRecommendations,
        hasEditedClient: !!editedClient,
        aiRecommendationsKeys: aiRecommendations ? Object.keys(aiRecommendations) : []
      });
      
      // Prepare comprehensive update data
      const updates = {
        // Core plan details
        planDetails: {
          ...plan.planDetails,
          cashFlowPlan: {
            ...plan.planDetails?.cashFlowPlan,
            // Ensure financial metrics are included
            cashFlowMetrics: {
              ...plan.planDetails?.cashFlowPlan?.cashFlowMetrics,
              currentEmiRatio: financialMetrics.emiRatio,
              targetEmiRatio: 40,
              currentSavingsRate: financialMetrics.savingsRate,
              targetSavingsRate: 20,
              currentFixedExpenditureRatio: financialMetrics.fixedExpenditureRatio,
              targetFixedExpenditureRatio: 50,
              financialHealthScore: financialMetrics.financialHealthScore,
              lastUpdated: new Date().toISOString()
            }
          }
        },
        
        // Client data snapshot with enhanced financial calculations
        clientDataSnapshot: {
          ...editedClient,
          calculatedFinancials: {
            monthlyIncome: financialMetrics.monthlyIncome,
            monthlyExpenses: financialMetrics.monthlyExpenses,
            totalEMIs: financialMetrics.totalEMIs,
            monthlySurplus: financialMetrics.monthlySurplus,
            emiRatio: financialMetrics.emiRatio,
            savingsRate: financialMetrics.savingsRate,
            financialHealthScore: financialMetrics.financialHealthScore,
            lastCalculated: new Date().toISOString()
          }
        },
        
        // AI recommendations with metadata
        aiRecommendations: aiRecommendations ? {
          ...aiRecommendations,
          metadata: {
            generatedAt: new Date().toISOString(),
            clientId: clientId,
            planId: plan._id,
            sourceData: 'cash-flow-planning',
            isFallback: isFallback,
            lastError: error
          }
        } : null,
        
        // Advisor recommendations and custom variables
        advisorRecommendations: {
          ...plan.advisorRecommendations,
          customVariables: customVariables,
          lastUpdated: new Date().toISOString()
        },
        
        // Update timestamps
        lastModified: new Date().toISOString(),
        updatedBy: 'cash-flow-planning'
      };

      console.log('📋 [CashFlowPlanning] Prepared save data:', {
        planId: plan._id,
        hasAIRecommendations: !!updates.aiRecommendations,
        hasClientSnapshot: !!updates.clientDataSnapshot,
        hasCalculatedFinancials: !!updates.clientDataSnapshot?.calculatedFinancials,
        updateDataSize: JSON.stringify(updates).length + ' chars'
      });
      
      const response = await planAPI.updatePlan(plan._id, updates);
      
      console.log('✅ [CashFlowPlanning] Plan saved successfully:', {
        planId: plan._id,
        success: response?.success,
        timestamp: new Date().toISOString()
      });
      
      // Update local plan state to reflect saved data
      if (response?.plan) {
        setPlan({
          ...response.plan,
          // Preserve current AI recommendations state
          aiRecommendations: updates.aiRecommendations
        });
      }
      
      // Show success message
      const successMessage = 'Financial plan saved successfully with AI recommendations!';
      if (window.toast) {
        window.toast.success(successMessage);
      } else {
        alert(successMessage);
      }
      
      console.log('💾 [CashFlowPlanning] Save completed - plan updated with current analysis');
      
    } catch (error) {
      console.error('❌ [CashFlowPlanning] Error saving plan:', {
        planId: plan._id,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      
      const errorMessage = `Failed to save plan: ${error.response?.data?.error || error.message}`;
      setError(errorMessage);
      
      if (window.toast) {
        window.toast.error(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };


  const addCustomVariable = () => {
    if (newCustomVariable.name && newCustomVariable.value) {
      setCustomVariables([...customVariables, {
        ...newCustomVariable,
        id: Date.now()
      }]);
      setNewCustomVariable({ name: '', value: '', description: '' });
    }
  };

  const removeCustomVariable = (id) => {
    setCustomVariables(customVariables.filter(variable => variable.id !== id));
  };

  // Get advisor data helper function
  const getAdvisorData = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user ? {
        firstName: user.firstName,
        lastName: user.lastName,
        firmName: user.firmName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        sebiRegNumber: user.sebiRegNumber
      } : null;
    } catch (error) {
      console.error('Error getting advisor data:', error);
      return null;
    }
  };

  // Save cash flow plan function
  const handleSaveCashFlowPlan = async () => {
    console.log('💾 [CashFlowPlanning] Save Plan button clicked:', {
      clientId: client?._id,
      planId: savedPlanId,
      hasClient: !!client,
      isPlanSaved
    });

    setSaving(true);
    setError(null);
    
    try {
      const planData = {
        clientId: client._id,
        planType: 'cash_flow',
        planDetails: {
          cashFlowPlan: plan?.planDetails?.cashFlowPlan || {},
          cashFlowMetrics: calculatedMetrics,
          debtManagement: plan?.planDetails?.cashFlowPlan?.debtManagement,
          emergencyFundStrategy: plan?.planDetails?.cashFlowPlan?.emergencyFundStrategy,
          investmentRecommendations: plan?.planDetails?.cashFlowPlan?.investmentRecommendations
        },
        aiRecommendations: aiRecommendations,
        status: 'draft'
      };

      console.log('📤 [CashFlowPlanning] Sending plan data to API:', {
        planDataKeys: Object.keys(planData),
        clientId: planData.clientId,
        planType: planData.planType,
        hasAIRecommendations: !!planData.aiRecommendations
      });

      const response = await planAPI.createPlan(planData);
      
      console.log('📥 [CashFlowPlanning] Save plan response:', {
        success: response?.success,
        planId: response?.plan?._id,
        hasResponse: !!response
      });
      
      if (response.success) {
        const newPlanId = response.plan._id;
        setSavedPlanId(newPlanId);
        setIsPlanSaved(true);
        setSuccessMessage('Cash flow plan saved successfully!');
        setShowSuccess(true);
        
        console.log('✅ [CashFlowPlanning] Plan saved successfully:', {
          savedPlanId: newPlanId,
          planStatus: response.plan.status,
          isPlanSaved: true
        });
        
        // AUTO-GENERATE AND STORE PDF AFTER PLAN SAVE
        try {
          console.log('📄 [CashFlowPlanning] Starting automatic PDF generation after plan save...');
          await generateAndSavePDF(newPlanId);
        } catch (pdfError) {
          console.error('❌ [CashFlowPlanning] Error generating PDF after plan save:', pdfError);
          // Don't fail the entire save process if PDF generation fails
        }
        
      } else {
        console.error('❌ [CashFlowPlanning] Plan save failed - response not successful:', response);
        setError('Failed to save plan - server responded with error');
      }
    } catch (err) {
      console.error('❌ [CashFlowPlanning] Error saving plan:', {
        error: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data
      });
      setError(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  // Store PDF in database
  const storePDFInDatabase = async (pdfBlob, planId) => {
    try {
      console.log('📄 [CashFlowPlanning] Starting PDF storage process:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type,
        planId: planId
      });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          console.log('📄 [CashFlowPlanning] Base64 conversion completed');
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error('❌ [CashFlowPlanning] FileReader error:', error);
          reject(error);
        };
      });
      reader.readAsDataURL(pdfBlob);
      const base64Data = await base64Promise;

      // Validate base64 data
      if (!base64Data || !base64Data.startsWith('data:application/pdf;base64,')) {
        throw new Error('Invalid base64 PDF data generated');
      }

      // Calculate content summary
      const contentSummary = {
        monthlyIncome: client?.totalMonthlyIncome || 0,
        monthlyExpenses: client?.totalMonthlyExpenses || 0,
        monthlySurplus: (client?.totalMonthlyIncome || 0) - (client?.totalMonthlyExpenses || 0),
        hasDebtPlan: !!plan?.planDetails?.cashFlowPlan?.debtManagement?.prioritizedDebts?.length,
        hasEmergencyFund: !!plan?.planDetails?.cashFlowPlan?.emergencyFundStrategy,
        hasInvestments: !!plan?.planDetails?.cashFlowPlan?.investmentRecommendations?.monthlyInvestments?.length
      };

      const fileName = `Cash_Flow_Analysis_${client.firstName}_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;

      const response = await planAPI.storePDFReport(planId, {
        reportType: 'cash_flow',
        pdfData: base64Data,
        fileName: fileName,
        contentSummary: contentSummary
      });

      if (response.success) {
        console.log('✅ [CashFlowPlanning] PDF stored successfully:', response.report);
        return response.report;
      } else {
        throw new Error(response.error || 'Failed to store PDF');
      }
    } catch (error) {
      console.error('❌ [CashFlowPlanning] Error storing PDF:', error);
      throw error;
    }
  };

  // PDF Generation Functions
  const generateAndPreviewPDF = async () => {
    try {
      setPdfGenerating(true);
      console.log('🎯 [CashFlowPlanning] Starting PDF preview...');

      // Use new React PDF implementation
      const data = {
        clientData: client,
        planData: plan?.planDetails?.cashFlowPlan,
        metrics: calculatedMetrics,
        aiRecommendations: aiRecommendations,
        cacheInfo: { planType: 'cash_flow' },
        advisorData: getAdvisorData()
      };

      const pdfBlob = await generateCashFlowPDF(data);
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      console.log('✅ [CashFlowPlanning] PDF preview opened');
    } catch (error) {
      console.error('❌ [CashFlowPlanning] Error generating PDF preview:', error);
      setError('Failed to generate PDF preview');
    } finally {
      setPdfGenerating(false);
    }
  };

  const generateAndDownloadPDF = async () => {
    try {
      setPdfGenerating(true);
      console.log('🎯 [CashFlowPlanning] Starting PDF download...');

      // Use new React PDF implementation
      const data = {
        clientData: client,
        planData: plan?.planDetails?.cashFlowPlan,
        metrics: calculatedMetrics,
        aiRecommendations: aiRecommendations,
        cacheInfo: { planType: 'cash_flow' },
        advisorData: getAdvisorData()
      };

      const pdfBlob = await generateCashFlowPDF(data);
      const fileName = `Cash_Flow_Analysis_${client.firstName}_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ [CashFlowPlanning] PDF downloaded successfully');
    } catch (error) {
      console.error('❌ [CashFlowPlanning] Error generating PDF download:', error);
      setError('Failed to download PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const generateAndSavePDF = async (planIdToUse = savedPlanId) => {
    if (!planIdToUse) {
      setError('Please save the plan first before storing PDF');
      return;
    }

    try {
      setPdfGenerating(true);
      console.log('🎯 [CashFlowPlanning] Starting PDF save to database...');

      // Use new React PDF implementation
      const data = {
        clientData: client,
        planData: plan?.planDetails?.cashFlowPlan,
        metrics: calculatedMetrics,
        aiRecommendations: aiRecommendations,
        cacheInfo: { planType: 'cash_flow' },
        advisorData: getAdvisorData()
      };

      const pdfBlob = await generateCashFlowPDF(data);
      await storePDFInDatabase(pdfBlob, planIdToUse);
      
      // Open PDF after saving
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      
      console.log('✅ [CashFlowPlanning] PDF saved to database and opened');
      setSuccessMessage('PDF report saved to database and opened for viewing!');
      setShowSuccess(true);
    } catch (error) {
      console.error('❌ [CashFlowPlanning] Error saving PDF to database:', error);
      setError('Failed to save PDF to database');
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading || planLoading || clientLoading || !editedClient) {
    return (
      <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading cash flow planning data...
        </Typography>
        {planLoading && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Loading plan data...
          </Typography>
        )}
        {clientLoading && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Loading client data...
          </Typography>
        )}
        {(!editedClient && !clientLoading) && (
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'warning.main' }}>
            Waiting for client data...
          </Typography>
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Failed to Load Data
          </Typography>
          <Typography variant="body2" gutterBottom>
            {error}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => {
                setError(null);
                fetchPlanData();
                fetchClientData();
              }}
              sx={{ mr: 1 }}
            >
              Retry
            </Button>
            <Button 
              variant="outlined" 
              onClick={onBack}
            >
              Go Back
            </Button>
          </Box>
        </Alert>
        
        {/* Show debugging info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Debug Information:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
              Plan ID: {planId || 'Not provided'}{"\n"}
              Client ID: {clientId || 'Not provided'}{"\n"}
              Base URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
            </Typography>
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onBack}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Cash Flow Planning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client?.firstName} {client?.lastName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              onClick={handleSaveCashFlowPlan}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button 
              variant="outlined" 
              startIcon={<PictureAsPdf />} 
              onClick={generateAndPreviewPDF}
              disabled={pdfGenerating}
            >
              Preview
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Download />} 
              onClick={generateAndDownloadPDF}
              disabled={pdfGenerating}
            >
              Download
            </Button>
            {savedPlanId && (
              <Button 
                variant="contained" 
                startIcon={<CloudUpload />} 
                onClick={() => generateAndSavePDF()}
                disabled={pdfGenerating}
              >
                Save to DB
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <Typography variant="subtitle2" gutterBottom>
            Error
          </Typography>
          {error}
        </Alert>
      )}

      {/* Real-time Validation Alerts */}
      {validationErrors.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {validationErrors.map((error, index) => (
            <Alert key={index} severity={error.type} sx={{ mb: 1 }}>
              {error.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Financial Health Overview */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Analytics sx={{ mr: 1 }} />
              Financial Health Overview
            </Box>
            {(!editedClient || !editedClient.firstName) && (
              <Chip label="Demo Data" color="warning" size="small" />
            )}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={financialMetrics.financialHealthScore >= 7 ? 'success.main' : financialMetrics.financialHealthScore >= 5 ? 'warning.main' : 'error.main'}>
                  {isNaN(financialMetrics.financialHealthScore) ? 0 : financialMetrics.financialHealthScore}/10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Health Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={financialMetrics.emiRatio <= 40 ? 'success.main' : 'error.main'}>
                  {isNaN(financialMetrics.emiRatio) ? 0 : financialMetrics.emiRatio?.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  EMI Ratio
                </Typography>
                {financialMetrics.emiRatio > 40 && <Chip label="High Risk" color="error" size="small" />}
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={financialMetrics.savingsRate >= 20 ? 'success.main' : financialMetrics.savingsRate >= 10 ? 'warning.main' : 'error.main'}>
                  {isNaN(financialMetrics.savingsRate) ? 0 : financialMetrics.savingsRate?.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Savings Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={financialMetrics.monthlySurplus >= 0 ? 'success.main' : 'error.main'}>
                  ₹{isNaN(financialMetrics.monthlySurplus) ? 0 : financialMetrics.monthlySurplus?.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly Surplus
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  ₹{isNaN(financialMetrics.totalEMIs) ? 0 : financialMetrics.totalEMIs?.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total EMIs
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Panel - Main Content */}
        <Grid item xs={12} md={8}>
          {/* Step 1: Client Data Review */}
          <Accordion expanded={activeSection === 'client-review'} onChange={() => setActiveSection('client-review')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Step 1: Client Data Review & Edit</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                {!editMode ? (
                  <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>
                    Edit Client Data
                  </Button>
                ) : (
                  <Box>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => {
                        setEditMode(false);
                        setEditedClient(client);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleClientUpdate}
                      disabled={saving}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Personal Information */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Personal Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Name"
                          value={editedClient ? `${editedClient.firstName || 'Unknown'} ${editedClient.lastName || 'Client'}`.trim() : 'Loading...'}
                          disabled
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Age"
                          value={editedClient?.retirementPlanning?.currentAge || ''}
                          onChange={(e) => handleFieldChange('currentAge', e.target.value, 'retirementPlanning')}
                          disabled={!editMode}
                          size="small"
                          type="number"
                          inputProps={{ min: 18, max: 100 }}
                          error={editedClient?.retirementPlanning?.currentAge && (editedClient.retirementPlanning.currentAge < 18 || editedClient.retirementPlanning.currentAge > 100)}
                          helperText={editMode ? "Age should be between 18-100" : ""}
                        />
                        <TextField
                          label="PAN"
                          value={editedClient?.panNumber || 'Not provided'}
                          disabled
                          size="small"
                        />
                        <TextField
                          label="Dependents"
                          value={editedClient?.numberOfDependents || 0}
                          onChange={(e) => handleFieldChange('numberOfDependents', e.target.value)}
                          disabled={!editMode}
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: 20 }}
                          error={editedClient?.numberOfDependents && editedClient.numberOfDependents > 20}
                          helperText={editMode ? "Number of dependents" : ""}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Income & Expenses */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <MonetizationOn sx={{ mr: 1, fontSize: '1.1rem' }} />
                        Income & Expenses
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Monthly Income"
                          value={editedClient?.totalMonthlyIncome || ''}
                          onChange={(e) => handleFieldChange('totalMonthlyIncome', e.target.value)}
                          disabled={!editMode}
                          size="small"
                          type="number"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                        />
                        <TextField
                          label="Monthly Expenses"
                          value={editedClient?.totalMonthlyExpenses || ''}
                          onChange={(e) => handleFieldChange('totalMonthlyExpenses', e.target.value)}
                          disabled={!editMode}
                          size="small"
                          type="number"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                        />
                        <TextField
                          label="Monthly Surplus (After EMIs)"
                          value={financialMetrics.monthlySurplus?.toLocaleString('en-IN') || '0'}
                          disabled
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              color: financialMetrics.monthlySurplus >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }
                          }}
                        />
                        <TextField
                          label="Income Type"
                          value={editedClient?.incomeType || ''}
                          disabled
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Current Investments */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <ShowChart sx={{ mr: 1, fontSize: '1.1rem' }} />
                        Current Investments
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Mutual Funds"
                            value={editedClient?.assets?.investments?.equity?.mutualFunds || 0}
                            onChange={(e) => handleFieldChange('mutualFunds', e.target.value, 'assets.investments.equity')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="PPF"
                            value={editedClient?.assets?.investments?.fixedIncome?.ppf || 0}
                            onChange={(e) => handleFieldChange('ppf', e.target.value, 'assets.investments.fixedIncome')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="EPF"
                            value={editedClient?.assets?.investments?.fixedIncome?.epf || 0}
                            onChange={(e) => handleFieldChange('epf', e.target.value, 'assets.investments.fixedIncome')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Direct Stocks"
                            value={editedClient?.assets?.investments?.equity?.directStocks || 0}
                            onChange={(e) => handleFieldChange('directStocks', e.target.value, 'assets.investments.equity')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Cash & Bank Savings"
                            value={editedClient?.assets?.cashBankSavings || 0}
                            onChange={(e) => handleFieldChange('cashBankSavings', e.target.value, 'assets')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            helperText="Emergency Fund"
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Fixed Deposits"
                            value={editedClient?.assets?.investments?.fixedIncome?.fixedDeposits || 0}
                            onChange={(e) => handleFieldChange('fixedDeposits', e.target.value, 'assets.investments.fixedIncome')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="NPS"
                            value={editedClient?.assets?.investments?.fixedIncome?.nps || 0}
                            onChange={(e) => handleFieldChange('nps', e.target.value, 'assets.investments.fixedIncome')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="ELSS"
                            value={editedClient?.assets?.investments?.equity?.elss || 0}
                            onChange={(e) => handleFieldChange('elss', e.target.value, 'assets.investments.equity')}
                            disabled={!editMode}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            helperText="Tax Saving"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Existing Debts */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingDown sx={{ mr: 1, fontSize: '1.1rem' }} />
                        Existing Debts
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Debt Type</TableCell>
                              <TableCell align="right">Outstanding</TableCell>
                              <TableCell align="right">EMI</TableCell>
                              <TableCell align="right">Interest Rate</TableCell>
                              <TableCell align="center">Risk Level</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'].map((debtType) => {
                              const debt = editedClient?.debtsAndLiabilities?.[debtType];
                              if (!debt || (!debt.hasLoan && !debt.hasDebt) || (debt.outstandingAmount || debt.totalOutstanding || 0) === 0) return null;
                              
                              const interestRate = debt.interestRate || debt.averageInterestRate || 0;
                              const getRiskLevel = (rate) => {
                                if (rate >= 15) return { level: 'High', color: 'error' };
                                if (rate >= 10) return { level: 'Medium', color: 'warning' };
                                return { level: 'Low', color: 'success' };
                              };
                              const risk = getRiskLevel(interestRate);
                              
                              return (
                                <TableRow key={debtType}>
                                  <TableCell>
                                    <Box sx={{ fontWeight: 'medium' }}>
                                      {debtType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      ₹{(debt.outstandingAmount || debt.totalOutstanding || 0).toLocaleString('en-IN')}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      ₹{(debt.monthlyEMI || debt.monthlyPayment || 0).toLocaleString('en-IN')}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      {interestRate}%
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip 
                                      label={risk.level} 
                                      color={risk.color} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {Object.keys(editedClient?.debtsAndLiabilities || {}).every(key => {
                              const debt = editedClient.debtsAndLiabilities[key];
                              return !debt || (!debt.hasLoan && !debt.hasDebt) || (debt.outstandingAmount || debt.totalOutstanding || 0) === 0;
                            }) && (
                              <TableRow>
                                <TableCell colSpan={5} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    No existing debts found
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Monthly EMI: ₹{financialMetrics.totalEMIs?.toLocaleString('en-IN') || 0}
                        </Typography>
                        <Chip 
                          label={`EMI Ratio: ${financialMetrics.emiRatio?.toFixed(1) || 0}%`}
                          color={financialMetrics.emiRatio <= 40 ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Step 2: Debt Management Analysis */}
          <Accordion expanded={activeSection === 'debt-management'} onChange={() => setActiveSection('debt-management')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown sx={{ mr: 1 }} />
                Step 2: Debt Management Analysis
                {financialMetrics.emiRatio > 40 && (
                  <Chip label="Attention Required" color="error" size="small" sx={{ ml: 2 }} />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ErrorBoundary>
                <DebtPlanningInterface 
                  clientId={clientId}
                  clientData={editedClient}
                  planId={planId}
                  onPlanUpdate={(updatedPlan) => setPlan(updatedPlan)}
                />
              </ErrorBoundary>
            </AccordionDetails>
          </Accordion>

          {/* Step 3: Advisor Recommendations */}
          <Accordion expanded={activeSection === 'recommendations'} onChange={() => setActiveSection('recommendations')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Savings sx={{ mr: 1 }} />
                Step 3: Financial Planning Recommendations
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <AdvisorRecommendationsSection 
                plan={plan} 
                setPlan={setPlan} 
                client={editedClient}
                metrics={financialMetrics}
                customVariables={customVariables}
                setCustomVariables={setCustomVariables}
                newCustomVariable={newCustomVariable}
                setNewCustomVariable={setNewCustomVariable}
                addCustomVariable={addCustomVariable}
                removeCustomVariable={removeCustomVariable}
              />
            </AccordionDetails>
          </Accordion>

          {/* Step 4: Plan Summary & Validation */}
          <Accordion expanded={activeSection === 'plan-summary'} onChange={() => setActiveSection('plan-summary')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Step 4: Plan Summary & Validation
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <PlanSummarySection 
                plan={plan} 
                client={editedClient} 
                metrics={financialMetrics}
                validationErrors={validationErrors}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Right Panel - AI Recommendations */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 0, position: 'sticky', top: 20, borderRadius: 2 }}>
            {/* Manual AI Generation Button */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AutoAwesome sx={{ mr: 1 }} color="primary" />
                  AI Recommendations
                  {isFallback && (
                    <Chip 
                      label="Calculated" 
                      size="small" 
                      color="warning" 
                      sx={{ ml: 1, fontSize: '0.7rem' }}
                    />
                  )}
                </Typography>
                <Tooltip title={aiLoading ? "Generating recommendations..." : "Generate new AI recommendations"}>
                  <IconButton 
                    size="small" 
                    onClick={generateAIRecommendations} 
                    disabled={aiLoading}
                    color="primary"
                  >
                    {aiLoading ? <CircularProgress size={16} /> : <AutoAwesome />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* AI Error Alert */}
              {aiError && (
                <Alert severity="warning" sx={{ mt: 2 }} variant="outlined">
                  <Typography variant="body2">{aiError}</Typography>
                </Alert>
              )}
            </Box>

            {/* Use the dedicated AISuggestionsPanel component */}
            <Box sx={{ p: 2 }}>
              <AISuggestionsPanel 
                suggestions={aiRecommendations ? { 
                  success: true, 
                  analysis: aiRecommendations,
                  error: aiError 
                } : null}
                loading={aiLoading}
                clientData={editedClient}
              />
            </Box>
          </Paper>

        </Grid>
      </Grid>
    </Box>
  );
};

// Debt Management Section Component
const DebtManagementSection = ({ plan, setPlan, client, metrics, prioritizedDebts }) => {
  const [localDebts, setLocalDebts] = useState(prioritizedDebts);
  const [debtStrategy, setDebtStrategy] = useState({
    totalDebtReduction: 0,
    totalInterestSavings: 0,
    debtFreeDate: null
  });

  useEffect(() => {
    // Initialize plan with prioritized debts if not already set
    if (!plan?.planDetails?.cashFlowPlan?.debtManagement?.prioritizedDebts?.length && prioritizedDebts.length > 0) {
      const initialPlan = {
        ...plan,
        planDetails: {
          ...plan.planDetails,
          cashFlowPlan: {
            ...plan.planDetails.cashFlowPlan,
            debtManagement: {
              prioritizedDebts: prioritizedDebts,
              totalDebtReduction: 0,
              totalInterestSavings: 0,
              debtFreeDate: null
            }
          }
        }
      };
      setPlan(initialPlan);
      setLocalDebts(prioritizedDebts);
    }
  }, [prioritizedDebts]);

  const handleDebtChange = (index, field, value) => {
    const updatedDebts = [...localDebts];
    updatedDebts[index][field] = value;
    
    // Calculate impact if EMI is changed
    if (field === 'recommendedEMI') {
      const debt = updatedDebts[index];
      const extraPayment = value - debt.currentEMI;
      if (extraPayment > 0) {
        // Simple interest savings calculation (this would be more complex in reality)
        debt.projectedSavings = extraPayment * 12 * (debt.interestRate / 100);
      }
    }
    
    setLocalDebts(updatedDebts);
    
    // Update plan
    setPlan({
      ...plan,
      planDetails: {
        ...plan.planDetails,
        cashFlowPlan: {
          ...plan.planDetails.cashFlowPlan,
          debtManagement: {
            ...plan.planDetails.cashFlowPlan.debtManagement,
            prioritizedDebts: updatedDebts
          }
        }
      }
    });
  };

  const calculateDebtStrategy = () => {
    let totalReduction = 0;
    let totalSavings = 0;
    
    localDebts.forEach(debt => {
      const extraEMI = debt.recommendedEMI - debt.currentEMI;
      if (extraEMI > 0) {
        totalReduction += extraEMI * 12; // Annual extra payment
        totalSavings += debt.projectedSavings || 0;
      }
    });
    
    setDebtStrategy({
      totalDebtReduction: totalReduction,
      totalInterestSavings: totalSavings,
      debtFreeDate: new Date(Date.now() + (5 * 365 * 24 * 60 * 60 * 1000)) // Placeholder: 5 years
    });
  };

  useEffect(() => {
    calculateDebtStrategy();
  }, [localDebts]);

  const debts = localDebts.length > 0 ? localDebts : (plan?.planDetails?.cashFlowPlan?.debtManagement?.prioritizedDebts || []);

  return (
    <Box>
      {/* Debt Analysis Rules */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Info sx={{ mr: 1 }} />
            Debt Analysis Rules
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: metrics.emiRatio <= 40 ? 'success.light' : 'error.light', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  {metrics.emiRatio <= 40 ? <CheckCircle sx={{ mr: 1, color: 'success.main' }} /> : <Error sx={{ mr: 1, color: 'error.main' }} />}
                  EMI Ratio Rule
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Total EMI ≤ 40% of Monthly Income
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, color: metrics.emiRatio <= 40 ? 'success.main' : 'error.main' }}>
                  {metrics.emiRatio?.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current: ₹{metrics.totalEMIs?.toLocaleString('en-IN')} / ₹{metrics.monthlyIncome?.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: metrics.fixedExpenditureRatio <= 50 ? 'success.light' : 'warning.light', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  {metrics.fixedExpenditureRatio <= 50 ? <CheckCircle sx={{ mr: 1, color: 'success.main' }} /> : <Warning sx={{ mr: 1, color: 'warning.main' }} />}
                  Fixed Expenditure Rule
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  (Expenses + EMI) ≤ 50% of Income
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, color: metrics.fixedExpenditureRatio <= 50 ? 'success.main' : 'warning.main' }}>
                  {metrics.fixedExpenditureRatio?.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{((metrics.monthlyExpenses || 0) + (metrics.totalEMIs || 0)).toLocaleString('en-IN')} / ₹{metrics.monthlyIncome?.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ mr: 1, color: 'info.main' }} />
                  Financial Health Score
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Overall financial stability rating
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, color: 'info.main' }}>
                  {metrics.financialHealthScore}/10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.financialHealthScore >= 7 ? 'Excellent' : metrics.financialHealthScore >= 5 ? 'Good' : 'Needs Improvement'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Debt Prioritization Algorithm Results */}
      {debts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              Debt Prioritization (By Interest Rate)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Higher interest rate debts are prioritized for faster repayment to minimize total interest burden.
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {debts.map((debt, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card variant="outlined" sx={{ 
                    bgcolor: debt.priorityRank === 1 ? 'error.light' : debt.priorityRank === 2 ? 'warning.light' : 'background.paper'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {debt.debtType}
                        </Typography>
                        <Chip 
                          label={`Priority #${debt.priorityRank}`}
                          color={debt.priorityRank === 1 ? 'error' : debt.priorityRank === 2 ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        {debt.interestRate}% Interest
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Outstanding: ₹{debt.outstandingAmount?.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current EMI: ₹{debt.currentEMI?.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {debt.reason}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Debt Restructuring Recommendations */}
      {debts.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Timeline sx={{ mr: 1 }} />
              Debt Restructuring Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Adjust EMI amounts to optimize debt repayment. Higher payments reduce interest burden and clear debt faster.
            </Typography>
            
            {debts.map((debt, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: 'background.paper' }}>
                <CardContent>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {debt.debtType}
                        </Typography>
                        <Chip 
                          label={`Priority #${debt.priorityRank}`}
                          color={debt.priorityRank === 1 ? 'error' : debt.priorityRank === 2 ? 'warning' : 'default'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {debt.interestRate}% Interest Rate
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Outstanding
                        </Typography>
                        <Typography variant="h6">
                          ₹{debt.outstandingAmount?.toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Current EMI
                        </Typography>
                        <Typography variant="h6">
                          ₹{debt.currentEMI?.toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Recommended EMI"
                        value={debt.recommendedEMI || debt.currentEMI}
                        onChange={(e) => handleDebtChange(index, 'recommendedEMI', parseFloat(e.target.value) || 0)}
                        size="small"
                        type="number"
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                      />
                      {debt.recommendedEMI > debt.currentEMI && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                          +₹{(debt.recommendedEMI - debt.currentEMI).toLocaleString('en-IN')} extra
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Strategy Notes"
                        value={debt.reason}
                        onChange={(e) => handleDebtChange(index, 'reason', e.target.value)}
                        size="small"
                        multiline
                        rows={2}
                        fullWidth
                        placeholder="Add specific recommendations..."
                      />
                      {debt.projectedSavings > 0 && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                          Potential annual savings: ₹{debt.projectedSavings?.toLocaleString('en-IN')}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            
            {/* Debt Strategy Summary */}
            <Card variant="outlined" sx={{ mt: 3, bgcolor: 'primary.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Debt Repayment Strategy Impact
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="primary.main">
                        ₹{debtStrategy.totalDebtReduction?.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2">
                        Additional Annual Payment
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="success.main">
                        ₹{debtStrategy.totalInterestSavings?.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2">
                        Projected Interest Savings
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="info.main">
                        {Math.ceil((metrics.totalEMIs || 0) / 12)} Years
                      </Typography>
                      <Typography variant="body2">
                        Estimated Debt-Free Timeline
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Existing Debts Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This client has a clean debt profile. Focus on building wealth through investments.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Plan Summary Section Component
const PlanSummarySection = ({ plan, client, metrics, validationErrors }) => {
  const generatePlanSummary = () => {
    const immediateActions = [];
    const mediumTermGoals = [];
    const longTermObjectives = [];
    
    // Generate actions based on current financial state
    if (metrics.emiRatio > 40) {
      immediateActions.push('Reduce EMI ratio to below 40% through debt restructuring');
    }
    
    if (metrics.emergencyFundCurrent < metrics.emergencyFundTarget) {
      immediateActions.push(`Build emergency fund by ₹${(metrics.emergencyFundTarget - metrics.emergencyFundCurrent).toLocaleString('en-IN')}`);
    }
    
    if (metrics.savingsRate < 20) {
      immediateActions.push('Optimize monthly expenses to increase savings rate');
    }
    
    mediumTermGoals.push('Complete emergency fund target');
    mediumTermGoals.push('Clear highest interest debt');
    mediumTermGoals.push('Establish systematic investment habit');
    
    longTermObjectives.push('Achieve sustainable EMI ratio <35%');
    longTermObjectives.push('Build investment corpus ₹3,00,000+');
    longTermObjectives.push('Improve financial health score to 8+/10');
    
    return { immediateActions, mediumTermGoals, longTermObjectives };
  };
  
  const summary = generatePlanSummary();
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Plan Validation */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Plan Validation
              </Typography>
              
              {validationErrors.length === 0 ? (
                <Alert severity="success">
                  <Typography variant="subtitle2">Plan validation successful!</Typography>
                  <Typography variant="body2">All financial ratios are within acceptable limits.</Typography>
                </Alert>
              ) : (
                <Box>
                  {validationErrors.map((error, index) => (
                    <Alert key={index} severity={error.type} sx={{ mb: 1 }}>
                      {error.message}
                    </Alert>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cash Flow Plan Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Timeline sx={{ mr: 1 }} />
                Cash Flow Plan Summary
              </Typography>
              
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h4" color={metrics.financialHealthScore >= 7 ? 'success.main' : metrics.financialHealthScore >= 5 ? 'warning.main' : 'error.main'}>
                  Financial Health Score: {metrics.financialHealthScore}/10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.financialHealthScore >= 7 ? 'Excellent Financial Health' : 
                   metrics.financialHealthScore >= 5 ? 'Good - Needs Improvement' : 'Requires Immediate Attention'}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {/* Immediate Actions */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'error.light', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                        Immediate Actions (0-6 months)
                      </Typography>
                      {summary.immediateActions.map((action, index) => (
                        <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'error.main' }} />
                          {action}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Medium Term */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'warning.light', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
                        Medium Term (6-18 months)
                      </Typography>
                      {summary.mediumTermGoals.map((goal, index) => (
                        <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'warning.main' }} />
                          {goal}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Long Term */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'success.light', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                        Long Term (18+ months)
                      </Typography>
                      {summary.longTermObjectives.map((objective, index) => (
                        <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'success.main' }} />
                          {objective}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Key Metrics Improvement */}
              <Card variant="outlined" sx={{ mt: 3, bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
                    Key Metrics Improvement Targets
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">EMI Ratio</Typography>
                      <Typography variant="h6">{metrics.emiRatio?.toFixed(1)}% → 35%</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Emergency Fund</Typography>
                      <Typography variant="h6">₹{metrics.emergencyFundCurrent?.toLocaleString('en-IN')} → ₹{metrics.emergencyFundTarget?.toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Monthly Investment</Typography>
                      <Typography variant="h6">₹0 → ₹{Math.max(metrics.monthlySurplus * 0.7, 10000)?.toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Health Score</Typography>
                      <Typography variant="h6">{metrics.financialHealthScore}/10 → 8+/10</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Advisor Recommendations Section Component
const AdvisorRecommendationsSection = ({ plan, setPlan }) => {
  const [newMutualFund, setNewMutualFund] = useState({
    fundName: '',
    monthlyAmount: '',
    category: ''
  });

  const handleEmergencyFundChange = (field, value) => {
    setPlan({
      ...plan,
      planDetails: {
        ...plan.planDetails,
        cashFlowPlan: {
          ...plan.planDetails.cashFlowPlan,
          emergencyFundStrategy: {
            ...plan.planDetails.cashFlowPlan.emergencyFundStrategy,
            [field]: value
          }
        }
      }
    });
  };

  const addMutualFund = () => {
    if (newMutualFund.fundName && newMutualFund.monthlyAmount) {
      const updatedFunds = [
        ...plan.planDetails.cashFlowPlan.investmentRecommendations.monthlyInvestments,
        {
          ...newMutualFund,
          monthlyAmount: parseFloat(newMutualFund.monthlyAmount),
          fundType: 'Mutual Fund',
          purpose: 'Wealth Creation'
        }
      ];
      
      setPlan({
        ...plan,
        planDetails: {
          ...plan.planDetails,
          cashFlowPlan: {
            ...plan.planDetails.cashFlowPlan,
            investmentRecommendations: {
              ...plan.planDetails.cashFlowPlan.investmentRecommendations,
              monthlyInvestments: updatedFunds
            }
          }
        }
      });
      
      setNewMutualFund({ fundName: '', monthlyAmount: '', category: '' });
    }
  };

  const removeMutualFund = (index) => {
    const updatedFunds = plan.planDetails.cashFlowPlan.investmentRecommendations.monthlyInvestments.filter((_, i) => i !== index);
    setPlan({
      ...plan,
      planDetails: {
        ...plan.planDetails,
        cashFlowPlan: {
          ...plan.planDetails.cashFlowPlan,
          investmentRecommendations: {
            ...plan.planDetails.cashFlowPlan.investmentRecommendations,
            monthlyInvestments: updatedFunds
          }
        }
      }
    });
  };

  const emergencyFund = plan?.planDetails?.cashFlowPlan?.emergencyFundStrategy || {};
  const investments = plan?.planDetails?.cashFlowPlan?.investmentRecommendations || {};

  return (
    <Box>
      {/* Emergency Fund Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Emergency Fund Management
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Recommended Emergency Fund"
                value={emergencyFund.targetAmount || ''}
                onChange={(e) => handleEmergencyFundChange('targetAmount', e.target.value)}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                helperText="6 months of expenses"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Current Emergency Fund"
                value={emergencyFund.currentAmount || ''}
                onChange={(e) => handleEmergencyFundChange('currentAmount', e.target.value)}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Monthly Target"
                value={emergencyFund.monthlyAllocation || ''}
                onChange={(e) => handleEmergencyFundChange('monthlyAllocation', e.target.value)}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                helperText="To build emergency fund"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Investment Type</InputLabel>
                <Select
                  value={emergencyFund.investmentType || 'Liquid Fund'}
                  onChange={(e) => handleEmergencyFundChange('investmentType', e.target.value)}
                >
                  <MenuItem value="Liquid Fund">Liquid Fund</MenuItem>
                  <MenuItem value="Ultra Short Term Fund">Ultra Short Term Fund</MenuItem>
                  <MenuItem value="Savings Account">Savings Account</MenuItem>
                  <MenuItem value="Fixed Deposit">Fixed Deposit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Investment Recommendations */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Monthly SIP Recommendations
          </Typography>
          
          {/* Add New Fund */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  label="Fund Name"
                  value={newMutualFund.fundName}
                  onChange={(e) => setNewMutualFund({ ...newMutualFund, fundName: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Monthly SIP"
                  value={newMutualFund.monthlyAmount}
                  onChange={(e) => setNewMutualFund({ ...newMutualFund, monthlyAmount: e.target.value })}
                  fullWidth
                  size="small"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newMutualFund.category}
                    onChange={(e) => setNewMutualFund({ ...newMutualFund, category: e.target.value })}
                  >
                    <MenuItem value="Large Cap Equity">Large Cap Equity</MenuItem>
                    <MenuItem value="Multi Cap Equity">Multi Cap Equity</MenuItem>
                    <MenuItem value="Debt Fund">Debt Fund</MenuItem>
                    <MenuItem value="Hybrid Fund">Hybrid Fund</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={addMutualFund}
                  fullWidth
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Fund List */}
          {investments.monthlyInvestments?.map((fund, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">{fund.fundName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fund.category} • ₹{fund.monthlyAmount?.toLocaleString('en-IN')}/month
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => removeMutualFund(index)}>
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Asset Allocation */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recommended Asset Allocation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Equity %"
                  value={investments.assetAllocation?.equity || 70}
                  size="small"
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Debt %"
                  value={investments.assetAllocation?.debt || 30}
                  size="small"
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Gold %"
                  value={investments.assetAllocation?.gold || 0}
                  size="small"
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Others %"
                  value={investments.assetAllocation?.others || 0}
                  size="small"
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Additional Notes */}
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Additional Notes"
              multiline
              rows={4}
              fullWidth
              placeholder="Add any specific recommendations, observations, or action items for the client..."
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CashFlowPlanning;