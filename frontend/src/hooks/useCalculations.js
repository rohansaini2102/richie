import { useMemo } from 'react';
import {
  calculateMonthlyMetrics,
  calculateEmergencyFund,
  calculateFinancialHealthScore,
  prioritizeDebts,
  calculateInvestmentAllocation,
  generateActionItems
} from '../components/planning/cashflow/utils/calculations';

/**
 * Custom hook for financial calculations
 * Memoizes expensive calculations for better performance
 */
export const useCalculations = (clientData) => {
  // Monthly metrics (income, expenses, EMI ratios, etc.)
  const monthlyMetrics = useMemo(() => {
    if (!clientData) return null;
    return calculateMonthlyMetrics(clientData);
  }, [clientData]);

  // Emergency fund analysis
  const emergencyFund = useMemo(() => {
    if (!clientData) return null;
    return calculateEmergencyFund(clientData);
  }, [clientData]);

  // Financial health score
  const healthScore = useMemo(() => {
    if (!clientData) return 0;
    return calculateFinancialHealthScore(clientData);
  }, [clientData]);

  // Debt prioritization
  const prioritizedDebts = useMemo(() => {
    if (!clientData?.debtsAndLiabilities) return [];
    return prioritizeDebts(clientData.debtsAndLiabilities);
  }, [clientData?.debtsAndLiabilities]);

  // Investment allocation based on age and risk profile
  const investmentAllocation = useMemo(() => {
    if (!clientData) return null;
    
    const age = clientData.dateOfBirth ? 
      new Date().getFullYear() - new Date(clientData.dateOfBirth).getFullYear() : 30;
    const riskProfile = clientData.riskTolerance || 'Moderate';
    
    return calculateInvestmentAllocation(age, riskProfile);
  }, [clientData?.dateOfBirth, clientData?.riskTolerance]);

  // Action items based on financial analysis
  const actionItems = useMemo(() => {
    if (!clientData) return [];
    return generateActionItems(clientData);
  }, [clientData]);

  // Net worth calculation
  const netWorth = useMemo(() => {
    if (!clientData) return 0;
    
    // Calculate total assets
    let totalAssets = 0;
    const investments = clientData.assets?.investments || {};
    
    Object.values(investments).forEach(category => {
      if (typeof category === 'object') {
        Object.values(category).forEach(value => {
          totalAssets += parseFloat(value) || 0;
        });
      }
    });
    
    // Add cash and savings
    totalAssets += parseFloat(clientData.assets?.cashBankSavings) || 0;
    
    // Calculate total liabilities (simplified as annual debt obligations)
    const totalLiabilities = monthlyMetrics ? monthlyMetrics.totalEMIs * 12 : 0;
    
    return totalAssets - totalLiabilities;
  }, [clientData, monthlyMetrics]);

  // Comprehensive financial overview
  const financialOverview = useMemo(() => {
    if (!clientData || !monthlyMetrics) return null;

    return {
      // Core metrics
      monthlyIncome: monthlyMetrics.monthlyIncome,
      monthlyExpenses: monthlyMetrics.monthlyExpenses,
      monthlySurplus: monthlyMetrics.monthlySurplus,
      totalEMIs: monthlyMetrics.totalEMIs,
      
      // Ratios
      emiRatio: monthlyMetrics.emiRatio,
      savingsRate: monthlyMetrics.savingsRate,
      expenseRatio: monthlyMetrics.expenseRatio,
      fixedExpenditureRatio: monthlyMetrics.fixedExpenditureRatio,
      
      // Financial health
      healthScore,
      healthGrade: healthScore >= 80 ? 'A' : 
                   healthScore >= 60 ? 'B' :
                   healthScore >= 40 ? 'C' : 'D',
      
      // Net worth
      netWorth,
      
      // Emergency fund
      emergencyFund,
      
      // Debt analysis
      totalDebts: prioritizedDebts.length,
      highPriorityDebts: prioritizedDebts.filter(d => d.priority === 'high').length,
      
      // Investment capacity
      monthlyInvestmentCapacity: Math.max(0, monthlyMetrics.monthlySurplus * 0.7),
      
      // Action items summary
      totalActionItems: actionItems.length,
      highPriorityActions: actionItems.filter(a => a.priority === 'high').length
    };
  }, [
    clientData, 
    monthlyMetrics, 
    healthScore, 
    netWorth, 
    emergencyFund, 
    prioritizedDebts, 
    actionItems
  ]);

  // Investment recommendations based on available surplus
  const investmentRecommendations = useMemo(() => {
    if (!monthlyMetrics || !investmentAllocation) return null;

    const availableAmount = Math.max(0, monthlyMetrics.monthlySurplus * 0.7); // 70% for investments, 30% for emergency fund
    
    if (availableAmount === 0) {
      return {
        canInvest: false,
        reason: 'No monthly surplus available for investment',
        suggestions: ['Focus on expense reduction', 'Increase income sources']
      };
    }

    return {
      canInvest: true,
      totalAmount: availableAmount,
      allocation: {
        equity: availableAmount * (investmentAllocation.equity / 100),
        debt: availableAmount * (investmentAllocation.debt / 100),
        gold: availableAmount * (investmentAllocation.gold / 100)
      },
      suggestedProducts: {
        equity: ['Large Cap Mutual Funds', 'Index Funds', 'Mid Cap Funds'],
        debt: ['Liquid Funds', 'Corporate Bond Funds', 'Gilt Funds'],
        gold: ['Gold ETF', 'Gold Bonds']
      }
    };
  }, [monthlyMetrics, investmentAllocation]);

  // Risk analysis
  const riskAnalysis = useMemo(() => {
    if (!financialOverview) return null;

    const risks = [];
    const opportunities = [];

    // Analyze risks
    if (financialOverview.emiRatio > 40) {
      risks.push({
        type: 'High EMI Ratio',
        severity: 'high',
        description: 'EMI commitments exceed 40% of income',
        impact: 'Limited financial flexibility'
      });
    }

    if (financialOverview.savingsRate < 10) {
      risks.push({
        type: 'Low Savings Rate',
        severity: 'medium',
        description: 'Saving less than 10% of income',
        impact: 'Insufficient wealth building'
      });
    }

    if (emergencyFund && emergencyFund.monthsOfCoverage < 3) {
      risks.push({
        type: 'Inadequate Emergency Fund',
        severity: 'high',
        description: 'Less than 3 months of expenses covered',
        impact: 'Vulnerable to financial shocks'
      });
    }

    // Analyze opportunities
    if (financialOverview.monthlySurplus > 20000) {
      opportunities.push({
        type: 'High Investment Capacity',
        potential: 'high',
        description: 'Significant monthly surplus available',
        recommendation: 'Consider aggressive wealth building strategies'
      });
    }

    if (financialOverview.healthScore >= 60) {
      opportunities.push({
        type: 'Good Financial Health',
        potential: 'medium',
        description: 'Strong foundation for financial growth',
        recommendation: 'Focus on optimization and growth'
      });
    }

    return { risks, opportunities };
  }, [financialOverview, emergencyFund]);

  return {
    // Raw calculations
    monthlyMetrics,
    emergencyFund,
    healthScore,
    prioritizedDebts,
    investmentAllocation,
    actionItems,
    netWorth,
    
    // Comprehensive analysis
    financialOverview,
    investmentRecommendations,
    riskAnalysis,
    
    // Utility functions
    hasData: Boolean(clientData && monthlyMetrics),
    isHealthy: healthScore >= 60,
    hasEmergencyFund: emergencyFund ? emergencyFund.monthsOfCoverage >= 3 : false,
    canInvest: monthlyMetrics ? monthlyMetrics.monthlySurplus > 0 : false,
    
    // Quick access to key metrics
    keyMetrics: {
      healthScore,
      savingsRate: monthlyMetrics?.savingsRate || 0,
      emiRatio: monthlyMetrics?.emiRatio || 0,
      netWorth,
      emergencyMonths: emergencyFund?.monthsOfCoverage || 0
    }
  };
};

export default useCalculations;