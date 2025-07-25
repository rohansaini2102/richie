# Hybrid Planning UI Wireframes & Design Specifications

## Overview

This document extends the existing UI/UX wireframes to include the comprehensive Hybrid Planning interface. Hybrid Planning combines cash flow optimization with goal-based planning in a unified, tabbed interface that follows the established design system.

## Updated Planning Approach Selection Modal

### Enhanced Modal with Hybrid Option

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Choose Planning Approach                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │        🎯           │  │        💰           │  │        🔄           │  │
│  │   GOAL BASED        │  │    CASH FLOW        │  │      HYBRID         │  │
│  │    PLANNING         │  │     PLANNING        │  │     APPROACH        │  │
│  │                     │  │                     │  │                     │  │
│  │ Focus on specific   │  │ Optimize monthly    │  │ ⭐ RECOMMENDED      │  │
│  │ life goals like     │  │ cash flow, debt     │  │ Complete 360°       │  │
│  │ retirement,         │  │ management, and     │  │ financial planning  │  │
│  │ education, home     │  │ systematic savings  │  │ combining both      │  │
│  │                     │  │                     │  │ approaches          │  │
│  │ ✓ Clear objectives  │  │ ✓ Debt optimization │  │ ✓ Cash flow + Goals │  │
│  │ ✓ Long-term focus   │  │ ✓ Emergency fund    │  │ ✓ Complete coverage │  │
│  │ ✓ SIP strategies    │  │ ✓ Budget planning   │  │ ✓ Advisor certified │  │
│  │                     │  │                     │  │ ✓ AI-powered        │  │
│  │   [Choose This]     │  │   [Choose This]     │  │   [Choose This]     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
│                               [Cancel]                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Enhanced CSS for Hybrid Card:**
```css
.approach-card.hybrid {
  border: 2px solid var(--primary-green);
  background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%);
  position: relative;
}

.approach-card.hybrid::before {
  content: "⭐ RECOMMENDED";
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-green);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.approach-card.hybrid:hover {
  border-color: var(--primary-green);
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.15);
}
```

## Hybrid Planning Main Interface

### Master Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HYBRID PLANNING                               │
│                            Client: John Doe                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📊 Financial Health   💰 Cash Flow   📋 Debt Mgmt   🎯 Goals        │   │
│  │ 🛡️ Insurance         💼 Investments  💸 Tax Plan   📅 Timeline      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │         ADVISOR WORKSPACE            │  │      AI RECOMMENDATIONS         │ │
│  │         (MAIN CONTENT)               │  │        (STICKY PANEL)           │ │
│  │                                      │  │                                 │ │
│  │  [Content changes based on tab]     │  │  🤖 Real-time analysis based    │ │
│  │                                      │  │     on advisor inputs          │ │
│  │                                      │  │                                 │ │
│  │                                      │  │  Updates automatically as       │ │
│  │                                      │  │  advisor fills sections        │ │
│  │                                      │  │                                 │ │
│  │                                      │  │  Provides intelligent          │ │
│  │                                      │  │  suggestions and warnings       │ │
│  └──────────────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                             │
│               [Save Draft] [Generate Report] [Complete Plan]               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**CSS for Master Layout:**
```css
.hybrid-planning-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  background: var(--background-gray);
}

.hybrid-header {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-gray);
}

.hybrid-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.hybrid-subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.hybrid-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 0 4px;
  overflow-x: auto;
}

.hybrid-tab {
  background: white;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-secondary);
}

.hybrid-tab.active {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.hybrid-tab:hover:not(.active) {
  background: var(--background-gray);
  border-color: var(--primary-blue);
}

.hybrid-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.advisor-workspace {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-gray);
  min-height: 600px;
}

.ai-panel {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  position: sticky;
  top: 24px;
  height: fit-content;
  max-height: 80vh;
  overflow-y: auto;
}
```

## Tab 1: Financial Health Overview

### Financial Health Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           📊 FINANCIAL HEALTH                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Auto-Calculated Metrics (From step2_incomeAndExpenses & step5_debtsAndLiabilities): │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 Net Worth: ₹[calculated]                🔴 Needs Improvement    │   │
│  │      (Sum of step4 investments - Sum of step5 debt outstandingAmounts) │   │
│  │                                                                     │   │
│  │  📊 Debt-to-Income Ratio: [%]               ⚠️ Above Safe Limit     │   │
│  │      (Sum of step5 monthlyEMIs / step2 totalMonthlyIncome × 100)   │   │
│  │                                                                     │   │
│  │  💸 Current Savings Rate: [%]               🟡 Can Be Improved      │   │
│  │      ((totalMonthlyIncome - totalMonthlyExpenses - totalEMIs) / totalMonthlyIncome × 100) │   │
│  │                                                                     │   │
│  │  🏦 Emergency Fund: [months]                🔴 Critically Low       │   │
│  │      (savingsAccountBalance + fixedDeposits.totalValue) / totalMonthlyExpenses │   │
│  │                                                                     │   │
│  │  📈 Cash Flow: +₹[amount]/month             🟢 Positive             │   │
│  │      (totalMonthlyIncome - totalMonthlyExpenses - sum of all loan EMIs) │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Advisor Assessment & Recommendations:                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Financial Health Score: [6.2]/10                                  │   │
│  │  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐                                              │   │
│  │  │▓│▓│▓│▓│▓│▓│░│░│░│░│ 6.2/10                                      │   │
│  │  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘                                              │   │
│  │                                                                     │   │
│  │  Target Savings Rate: [25]% (up from 18%)                         │   │
│  │  Recommended Emergency Fund: ₹[2,70,000] ([6] months expenses)     │   │
│  │  Target Debt Ratio: [30]% (down from 42%)                         │   │
│  │                                                                     │   │
│  │  Priority Actions:                                                  │   │
│  │  • [High] Build emergency fund to 6 months                        │   │
│  │  • [High] Reduce debt-to-income ratio below 35%                   │   │
│  │  • [Medium] Increase savings rate to 25%                          │   │
│  │  • [Medium] Optimize investment allocation                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tab 2: Cash Flow Analysis

### Monthly Budget Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            💰 CASH FLOW ANALYSIS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Monthly Breakdown (From client-data.json structure):              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Income Sources (step2_incomeAndExpenses):                         │   │
│  │  ├─ Primary Income: ₹[totalMonthlyIncome] [✏️ Edit]                │   │
│  │  ├─ Income Type: [incomeType] (Salaried/Business/Freelance/Mixed)  │   │
│  │  ├─ Additional Income: ₹[0] [✏️ Edit] (advisor can add)            │   │
│  │  └─ Total Monthly Income: ₹[totalMonthlyIncome]                     │   │
│  │                                                                     │   │
│  │  Expense Categories (step2 expenseBreakdown.details):              │   │
│  │  ├─ Housing/Rent: ₹[housingRent] [✏️ Edit]                         │   │
│  │  ├─ Food & Groceries: ₹[foodGroceries] [✏️ Edit]                   │   │
│  │  ├─ Transportation: ₹[transportation] [✏️ Edit]                     │   │
│  │  ├─ Utilities & Bills: ₹[utilities] [✏️ Edit]                      │   │
│  │  ├─ Healthcare: ₹[healthcare] [✏️ Edit]                            │   │
│  │  ├─ Entertainment: ₹[entertainment] [✏️ Edit]                       │   │
│  │  ├─ Other Expenses: ₹[otherExpenses] [✏️ Edit]                     │   │
│  │  └─ Total Monthly Expenses: ₹[totalMonthlyExpenses]                 │   │
│  │                                                                     │   │
│  │  Fixed Obligations (step5_debtsAndLiabilities):                    │   │
│  │  ├─ Home Loan EMI: ₹[homeLoan.details.monthlyEMI]                  │   │
│  │  ├─ Car Loan EMI: ₹[carLoan.details.monthlyEMI]                    │   │
│  │  ├─ Personal Loan EMI: ₹[personalLoan.details.monthlyEMI]          │   │
│  │  ├─ Credit Card Payment: ₹[creditCards.details.monthlyPayment]     │   │
│  │  ├─ Other Loan EMIs: ₹[sum of remaining loan EMIs]                 │   │
│  │  └─ Total EMIs: ₹[sum of all monthlyEMIs]                          │   │
│  │                                                                     │   │
│  │  💵 Net Available Surplus: ₹[calculated]/month                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Advisor Budget Optimization:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Recommended Monthly Savings: ₹[18,750] (25% of income)            │   │
│  │                                                                     │   │
│  │  Expense Reduction Opportunities:                                   │   │
│  │  ├─ [Transportation]: Reduce by ₹[2,000] (use public transport)    │   │
│  │  ├─ [Entertainment]: Reduce by ₹[1,000] (home cooking, OTT)        │   │
│  │  ├─ [Utilities]: Reduce by ₹[500] (energy efficient appliances)    │   │
│  │  └─ Total Potential Savings: ₹3,500/month                          │   │
│  │                                                                     │   │   
│  │  Revised Surplus Target: ₹17,000/month                             │   │
│  │                                                                     │   │   
│  │  Allocation Strategy:                                               │   │
│  │  ├─ Emergency Fund: ₹[8,000]/month (priority)                      │   │
│  │  ├─ Goal-based SIPs: ₹[7,000]/month                               │   │
│  │  ├─ Debt Prepayment: ₹[2,000]/month                               │   │
│  │  └─ Buffer: ₹[500]/month                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tab 3: Debt Management Strategy

### Comprehensive Debt Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           📋 DEBT MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Debt Portfolio (Auto-populated):                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Debt Type    │Outstanding│Current EMI│Interest│Tenure│Priority│Action│   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Personal Ln  │₹2,00,000  │₹3,500     │14.5%   │5Y    │   1    │[↑]  │   │
│  │ Car Loan     │₹4,50,000  │₹8,000     │9.5%    │7Y    │   2    │[→]  │   │
│  │ Home Loan    │₹35,00,000 │₹20,000    │8.2%    │18Y   │   3    │[→]  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ TOTAL        │₹41,50,000 │₹31,500    │       │      │        │     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Advisor Debt Strategy:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Debt Payoff Priority: [Interest Rate Method ▼]                    │   │
│  │                                                                     │   │
│  │  Strategy 1: Personal Loan (Highest Priority)                      │   │
│  │  ├─ Current EMI: ₹3,500                                            │   │
│  │  ├─ Recommended EMI: ₹[6,000] (+₹2,500)                           │   │
│  │  ├─ Payoff Timeline: [2.5 years] (vs 5 years)                     │   │
│  │  ├─ Interest Saved: ₹[1,15,000]                                    │   │
│  │  └─ Reasoning: [Highest interest rate, clears fastest]             │   │
│  │                                                                     │   │
│  │  Strategy 2: Car Loan                                              │   │
│  │  ├─ Current EMI: ₹8,000                                            │   │
│  │  ├─ Recommended EMI: ₹[8,000] (maintain current)                  │   │
│  │  ├─ Prepayment: ₹[0]/month                                         │   │
│  │  └─ Reasoning: [Moderate interest, manageable EMI]                 │   │
│  │                                                                     │   │
│  │  Strategy 3: Home Loan                                             │   │
│  │  ├─ Current EMI: ₹20,000                                           │   │
│  │  ├─ Recommended EMI: ₹[20,000] (maintain current)                 │   │
│  │  ├─ Annual Prepayment: ₹[1,00,000] (bonus/increment)              │   │
│  │  └─ Reasoning: [Lowest interest, tax benefits available]           │   │
│  │                                                                     │   │
│  │  Debt Consolidation: [No ▼] - Current rates are competitive       │   │
│  │  Target Debt-Free Date: [Personal: 2027, Car: 2031, Home: 2039]   │   │
│  │                                                                     │   │
│  │  Overall Impact:                                                    │   │
│  │  ├─ Monthly EMI Change: ₹31,500 → ₹34,000 (+₹2,500)              │   │
│  │  ├─ New Debt-to-Income Ratio: 45.3% (temporary increase)          │   │
│  │  ├─ Post Personal Loan Payoff: 37.3% (sustainable)                │   │
│  │  └─ Total Interest Savings: ₹1,15,000+ over loan tenures          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tab 4: Goal-Based Planning

### Comprehensive Goals Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🎯 GOAL-BASED PLANNING                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Goals from Client Onboarding:                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Goal               │Current   │Target    │Target │Monthly │Status    │   │
│  │                    │Value     │Amount    │Year   │SIP Req │         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 🏖️ Retirement      │₹6,00,000 │₹2,50,00,000│2052  │₹15,500 │🟡 Gap   │   │
│  │ 🎓 Child Education │₹0        │₹50,00,000  │2035  │₹18,000 │🔴 Start  │   │
│  │ 🏠 Home Purchase   │₹2,00,000 │₹80,00,000  │2030  │₹45,000 │🔴 Gap    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Advisor Goal Planning Inputs:                                             │
│                                                                             │
│  🏖️ RETIREMENT PLANNING:                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Required Monthly SIP: ₹[22,000] (revised calculation)             │   │
│  │  Recommended Corpus: ₹[3,00,00,000] (inflated to 2052)            │   │
│  │  Expected Monthly Pension: ₹[1,20,000] at retirement               │   │
│  │  Post-Retirement Strategy: [Debt funds 60%, Equity 40%]            │   │
│  │  Retirement Readiness Score: [6.5]/10                              │   │
│  │                                                                     │   │
│  │  Implementation:                                                    │   │
│  │  ├─ PPF: ₹1,50,000/year (continue maximum)                        │   │
│  │  ├─ Equity MF SIP: ₹18,000/month                                  │   │
│  │  ├─ ELSS: ₹12,500/month (tax saving)                              │   │
│  │  └─ NPS: ₹5,000/month (additional tax benefit)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  👶 CHILD EDUCATION PLANNING:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Child 1 Education SIP: ₹[28,000]/month for [13] years             │   │
│  │  Target Amount (Inflated): ₹[75,00,000] by 2035                    │   │
│  │  Education Inflation Rate: [8]% per year                           │   │
│  │  Investment Strategy: [65% Equity, 35% Debt funds]                 │   │
│  │                                                                     │   │
│  │  Phased Implementation:                                             │   │
│  │  ├─ Years 1-5: ₹15,000/month (building base)                      │   │
│  │  ├─ Years 6-10: ₹25,000/month (step-up)                           │   │
│  │  └─ Years 11-13: ₹35,000/month (final push)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  🏠 MAJOR PURCHASE PLANNING:                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  House Purchase Timeline: [Postpone to 2032]                       │   │
│  │  Revised Down Payment SIP: ₹[25,000] for [8] years                 │   │
│  │  Down Payment Target: ₹[25,00,000] (25% of ₹1Cr home)             │   │
│  │  Loan vs Cash Strategy: [80% Loan, 20% Cash down]                  │   │
│  │                                                                     │   │
│  │  Reasoning: [Focus on child education first, then home purchase]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Goal Priority Matrix & Optimization:                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Total SIP Required: ₹75,000/month                                 │   │
│  │  Available Surplus: ₹13,500/month (current)                        │   │
│  │  Gap: ₹61,500/month                                                │   │
│  │                                                                     │   │
│  │  Advisor Optimization Strategy:                                     │   │
│  │  Phase 1 (Years 1-3): Focus on Emergency + Retirement              │   │
│  │  ├─ Emergency Fund: ₹8,000/month                                   │   │
│  │  ├─ Retirement: ₹15,000/month                                      │   │
│  │  └─ Available: ₹13,500 → Need ₹9,500 more                         │   │
│  │                                                                     │   │
│  │  Phase 2 (Years 4-8): Add Child Education                          │   │
│  │  Phase 3 (Years 9+): Add Home Purchase                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tab 5: Insurance Analysis

### Insurance Gap Assessment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🛡️ INSURANCE ANALYSIS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Insurance Portfolio (From Client Data):                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Insurance Type     │Current Coverage│Annual Premium│Status           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Life (Client)      │₹25,00,000      │₹24,000       │🟡 Inadequate   │   │
│  │ Life (Spouse)      │₹0              │₹0            │🔴 None          │   │
│  │ Health (Family)    │₹5,00,000       │₹18,000       │🟡 Low           │   │
│  │ Vehicle            │Comprehensive    │₹12,000       │🟢 Adequate      │   │
│  │ Disability         │₹0              │₹0            │🔴 Missing       │   │
│  │ Critical Illness   │₹0              │₹0            │🔴 Missing       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Advisor Insurance Recommendations:                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Life Insurance Needs Analysis:                                     │   │
│  │  ├─ Current Debt: ₹41,50,000                                       │   │
│  │  ├─ Family Annual Expenses: ₹5,40,000                              │   │
│  │  ├─ Children's Future Needs: ₹75,00,000                            │   │
│  │  ├─ Emergency Buffer: ₹10,00,000                                    │   │
│  │  └─ Total Life Cover Needed: ₹1,32,00,000                          │   │
│  │                                                                     │   │
│  │  Recommendations:                                                   │   │
│  │  Additional Life Insurance (Client): ₹[1,07,00,000]                │   │
│  │  ├─ Term Plan: ₹1,00,00,000 (₹15,000/year premium)                │   │
│  │  └─ Top-up to existing: ₹7,00,000                                  │   │
│  │                                                                     │   │
│  │  Life Insurance for Spouse: ₹[50,00,000]                           │   │
│  │  ├─ Term Plan: ₹50,00,000 (₹8,000/year premium)                   │   │
│  │  └─ Reasoning: [Income replacement + child care costs]             │   │
│  │                                                                     │   │
│  │  Health Insurance Enhancement: ₹[15,00,000] family floater         │   │
│  │  ├─ Additional Premium: ₹25,000/year                               │   │
│  │  └─ Super Top-up: ₹10,00,000 (₹8,000/year)                       │   │
│  │                                                                     │   │
│  │  Disability Insurance: ₹[30,00,000] coverage                       │   │
│  │  ├─ Premium: ₹18,000/year                                          │   │
│  │  └─ Coverage: 60% of income till age 60                           │   │
│  │                                                                     │   │
│  │  Critical Illness Cover: ₹[25,00,000]                              │   │
│  │  ├─ Premium: ₹12,000/year                                          │   │
│  │  └─ Add-on to existing health policy                               │   │
│  │                                                                     │   │
│  │  Total Additional Premium: ₹86,000/year (₹7,200/month)            │   │
│  │  Insurance-to-Income Ratio: 12% (within recommended 15%)           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tab 6: Investment Strategy

### Portfolio Analysis & Asset Allocation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           💼 INVESTMENT STRATEGY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Portfolio Analysis (Auto from CAS/Manual):                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Asset Class        │Current Value│Current %│Target %│Gap      │Action│   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Equity MFs         │₹4,50,000    │29%      │60%     │+₹7,65,000│↑   │   │
│  │ Direct Stocks      │₹1,00,000    │6%       │5%      │-₹15,000 │↓   │   │
│  │ Debt Funds         │₹50,000      │3%       │15%     │+₹1,85,000│↑   │   │
│  │ PPF                │₹3,00,000    │19%      │10%     │-₹1,45,000│→   │   │
│  │ FDs/Cash           │₹4,50,000    │29%      │5%      │-₹3,75,000│↓   │   │
│  │ Real Estate        │₹2,00,000    │13%      │5%      │-₹1,25,000│→   │   │
│  │ Gold               │₹0           │0%       │0%      │₹0       │→   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ TOTAL              │₹15,50,000   │100%     │100%    │         │    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Advisor Investment Recommendations:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Target Asset Allocation (Age-Appropriate):                        │   │
│  │  ├─ Equity: [65]% (₹10,08,000)                                    │   │
│  │  ├─ Debt: [25]% (₹3,88,000)                                       │   │
│  │  ├─ Real Estate: [5]% (₹78,000) - maintain current               │   │  
│  │  ├─ Gold: [0]% - not recommended at this stage                    │   │
│  │  └─ Cash: [5]% (₹78,000) - emergency fund only                   │   │
│  │                                                                     │   │
│  │  Specific Monthly Investment Plan:                                  │   │
│  │  Monthly SIP Total: ₹[35,000]                                      │   │
│  │                                                                     │   │
│  │  Equity Allocation (₹25,000/month):                               │   │
│  │  ├─ Large Cap Fund: ₹[10,000] - [HDFC Top 100]                   │   │
│  │  ├─ Mid Cap Fund: ₹[8,000] - [DSP Mid Cap Fund]                   │   │
│  │  ├─ Multi Cap Fund: ₹[7,000] - [Parag Parikh Flexi Cap]          │   │
│  │                                                                     │   │
│  │  Debt Allocation (₹10,000/month):                                 │   │
│  │  ├─ Corporate Bond Fund: ₹[6,000] - [ICICI Pru Corp Bond]         │   │
│  │  ├─ Liquid Fund: ₹[4,000] - [Axis Liquid Fund]                    │   │
│  │                                                                     │   │
│  │  Tax-Saving Investments:                                           │   │
│  │  ├─ ELSS SIP: ₹[12,500]/month - [Axis Long Term Equity]           │   │
│  │  ├─ PPF: ₹[12,500]/month - continue existing                      │   │
│  │  ├─ NPS: ₹[5,000]/month - additional 80CCD benefit                │   │
│  │                                                                     │   │
│  │  Lump Sum Recommendations:                                         │   │
│  │  ├─ Move ₹[2,00,000] from FD to Equity MFs                        │   │
│  │  ├─ Keep ₹[2,50,000] in FD for emergency fund                     │   │
│  │  └─ Diversify ₹[50,000] from direct stocks to MFs                 │   │
│  │                                                                     │   │
│  │  Expected Portfolio Returns: [11-13]% annually                     │   │
│  │  Risk Level: Moderate-Aggressive (suitable for 32-year age)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## AI Recommendations Panel

### Real-time Intelligent Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🤖 AI RECOMMENDATIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💡 Real-time Analysis:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Financial Health Score: 6.2/10 → 8.5/10 (with plan)              │   │
│  │  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐                                              │   │
│  │  │▓│▓│▓│▓│▓│▓│▓│▓│░│░│ Projected improvement                        │   │
│  │  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘                                              │   │
│  │                                                                     │   │
│  │  🎯 Goal Achievement Probability:                                   │   │
│  │  ├─ Retirement: 95% (on track with adjustments)                    │   │
│  │  ├─ Child Education: 78% (needs income increase)                   │   │
│  │  └─ Home Purchase: 65% (timeline needs adjustment)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ⚠️ Critical Alerts:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Emergency fund critically low - prioritize building to 6 months │   │
│  │  • Debt-to-income ratio high - implement debt reduction strategy   │   │
│  │  • Life insurance gap of ₹1.07Cr identified                        │   │
│  │  • Child education goal requires ₹61.5K/month - income increase    │   │
│  │    needed or timeline adjustment required                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  💰 Cash Flow Optimization:                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Current Surplus: ₹13,500/month                                    │   │
│  │  Optimized Surplus: ₹17,000/month (with expense reduction)         │   │
│  │                                                                     │   │
│  │  Recommended Allocation:                                            │   │
│  │  ├─ Emergency Fund: ₹8,000/month (33 months to target)             │   │
│  │  ├─ Debt Prepayment: ₹2,500/month (personal loan)                  │   │
│  │  ├─ Goal SIPs: ₹6,000/month (phase 1)                             │   │
│  │  └─ Buffer: ₹500/month                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  📊 Alternative Scenarios:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Scenario A: Income increase by ₹15K/month                         │   │
│  │  ├─ All goals achievable on original timeline                      │   │
│  │  └─ Financial health score: 9.2/10                                 │   │
│  │                                                                     │   │
│  │  Scenario B: Delay home purchase by 3 years                       │   │
│  │  ├─ Child education fully funded                                   │   │
│  │  └─ Retirement on track, emergency fund complete                   │   │
│  │                                                                     │   │
│  │  Scenario C: Reduce child education target by 20%                  │   │
│  │  ├─ All goals achievable with current income                       │   │
│  │  └─ Recommended if private education not mandatory                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  🔄 Auto-Updates:                                                           │
│  │  Last updated: Real-time as advisor inputs change                      │
│  │  Next refresh: Continuous monitoring                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation & Responsive Design

### CSS Framework Extension

```css
/* Hybrid Planning Specific Styles */
.hybrid-planning-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  background: var(--background-gray);
  min-height: 100vh;
}

/* Enhanced Tab Styling */
.hybrid-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.hybrid-tab {
  background: white;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 140px;
  justify-content: center;
}

.hybrid-tab.active {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

/* Enhanced Metric Cards */
.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-gray);
  margin-bottom: 16px;
  transition: box-shadow 0.2s;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.metric-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-good { background: #dcfce7; color: #166534; }
.status-warning { background: #fef3c7; color: #92400e; }
.status-critical { background: #fef2f2; color: #dc2626; }

/* Progress Bars */
.progress-bar {
  height: 8px;
  background: var(--border-gray);
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-green), var(--success-green));
  transition: width 0.3s ease;
}

/* Enhanced Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid var(--border-gray);
}

.data-table th {
  background: var(--background-gray);
  font-weight: 600;
  color: var(--text-primary);
}

.data-table tr:hover {
  background: rgba(37, 99, 235, 0.04);
}

/* Mobile Responsiveness */
@media (max-width: 1024px) {
  .hybrid-content {
    grid-template-columns: 1fr;
  }
  
  .ai-panel {
    position: static;
    order: -1;
    margin-bottom: 20px;
  }
  
  .hybrid-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .hybrid-tab {
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .hybrid-planning-container {
    padding: 16px;
  }
  
  .advisor-workspace,
  .ai-panel {
    padding: 16px;
  }
  
  .data-table th,
  .data-table td {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .metric-card {
    padding: 16px;
  }
  
  .metric-value {
    font-size: 24px;
  }
}

/* Print Styles */
@media print {
  .hybrid-tabs,
  .ai-panel {
    display: none;
  }
  
  .hybrid-content {
    grid-template-columns: 1fr;
  }
  
  .advisor-workspace {
    box-shadow: none;
    border: 1px solid #000;
  }
}
```

This comprehensive hybrid planning wireframe creates a unified interface that combines the best of both cash flow and goal-based planning approaches, while maintaining the intuitive design patterns established in your existing system.