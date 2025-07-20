# UI/UX Wireframes & Design Specifications

## Overview

This document provides detailed UI/UX specifications, wireframes, and design guidelines for implementing the financial planning features. All designs follow responsive design principles and maintain consistency with the existing application design language.

## Design Principles

### 1. Visual Hierarchy
- **Primary Actions**: Green buttons (Create Plan, Save, Submit)
- **Secondary Actions**: Blue buttons (Edit, View, Cancel)
- **Destructive Actions**: Red buttons (Delete, Remove)
- **Information Cards**: Clean white backgrounds with subtle shadows

### 2. Color Scheme
```css
:root {
  --primary-green: #16a34a;
  --primary-blue: #2563eb;
  --secondary-gray: #6b7280;
  --background-gray: #f9fafb;
  --border-gray: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --success-green: #10b981;
  --warning-orange: #f59e0b;
  --error-red: #ef4444;
}
```

### 3. Typography
- **Headers**: Inter, 24px-32px, Bold
- **Sub-headers**: Inter, 18px-20px, Semibold
- **Body Text**: Inter, 14px-16px, Regular
- **Small Text**: Inter, 12px-14px, Regular

## 1. Client Detail View Enhancement

### 1.1 Header Section with Create Plan Button

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Client Detail Header                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ← [Back] │ John Doe                                 [Create Plan] [Status] │
│           │ john.doe@email.com                                              │
│           │ Age: 32 | PAN: ABCDE1234F                                       │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: white;
  border-bottom: 1px solid var(--border-gray);
  margin-bottom: 24px;
}

.client-info h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.client-info p {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-plan-btn {
  background: var(--primary-green);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.create-plan-btn:hover {
  background: #15803d;
}
```

### 1.2 Existing Plans Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Existing Plans                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ 🎯 Goal Based   │  │ 💰 Cash Flow    │  │ 🔄 Hybrid       │            │
│  │ Plan            │  │ Plan            │  │ Plan            │            │
│  │ Created: Jan 15 │  │ Created: Feb 10 │  │ Created: Mar 5  │            │
│  │ Status: Active  │  │ Status: Draft   │  │ Status: Active  │            │
│  │ [View Plan]     │  │ [Edit Plan]     │  │ [View Plan]     │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.existing-plans {
  margin-bottom: 32px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.plan-card {
  background: white;
  border: 1px solid var(--border-gray);
  border-radius: 12px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-type {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-meta {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.plan-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.status-active { background: #dcfce7; color: #166534; }
.status-draft { background: #fef3c7; color: #92400e; }
.status-completed { background: #e0e7ff; color: #3730a3; }
```

## 2. Planning Approach Selection Modal

### 2.1 Modal Structure

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
│  │ Focus on specific   │  │ Optimize monthly    │  │ Combination of      │  │
│  │ life goals like     │  │ cash flow, debt     │  │ goal-based and      │  │
│  │ retirement,         │  │ management, and     │  │ cash flow           │  │
│  │ education, home     │  │ systematic savings  │  │ strategies          │  │
│  │                     │  │                     │  │                     │  │
│  │ ✓ Clear objectives  │  │ ✓ Debt optimization │  │ ✓ Comprehensive     │  │
│  │ ✓ Long-term focus   │  │ ✓ Emergency fund    │  │ ✓ Balanced approach │  │
│  │ ✓ SIP strategies    │  │ ✓ Cash flow         │  │ ✓ Flexible planning │  │
│  │                     │  │                     │  │                     │  │
│  │   [Choose This]     │  │   [Choose This]     │  │   [Choose This]     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
│                               [Cancel]                                     │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.planning-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.approach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.approach-card {
  border: 2px solid var(--border-gray);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.approach-card:hover {
  border-color: var(--primary-blue);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.approach-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.approach-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.approach-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

.approach-features {
  list-style: none;
  padding: 0;
  margin-bottom: 24px;
}

.approach-features li {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-align: left;
}

.choose-btn {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.choose-btn:hover {
  background: #1d4ed8;
}
```

## 3. Cash Flow Planning Interface

### 3.1 Main Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Cash Flow Planning                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │         CLIENT DATA (LEFT)          │  │    AI RECOMMENDATIONS (RIGHT)   │ │
│  │                                     │  │                                 │ │
│  │  Personal Information               │  │  🤖 Debt Management Analysis    │ │
│  │  [Edit] Name: John Doe              │  │  Priority: Clear Personal Loan  │ │
│  │       Age: 32                       │  │  Interest Saved: ₹85,000        │ │
│  │       PAN: ABCDE1234F               │  │                                 │ │
│  │                                     │  │  🤖 Emergency Fund Strategy     │ │
│  │  Financial Summary                  │  │  Target: ₹2,70,000              │ │
│  │  Monthly Income: ₹75,000            │  │  Timeline: 18 months            │ │
│  │  Monthly Expenses: ₹45,000          │  │                                 │ │
│  │  Monthly Surplus: ₹30,000           │  │  🤖 Investment Recommendations  │ │
│  │                                     │  │  Risk Profile: Moderate         │ │
│  │  ──────────────────────────          │  │  Equity: ₹13,000/month         │ │
│  │                                     │  │  Debt: ₹4,000/month            │ │
│  │  DEBT MANAGEMENT SECTION            │  │                                 │ │
│  │  [Debt Analysis & EMI Planning]     │  │  🤖 Cash Flow Optimization     │ │
│  │                                     │  │  Available Surplus: ₹12,000    │ │
│  │  ──────────────────────────          │  │  Emergency: ₹5,000/month       │ │
│  │                                     │  │  Investment: ₹7,000/month      │ │
│  │  ADVISOR RECOMMENDATIONS            │  │                                 │ │
│  │  [Emergency Fund, Investments, etc] │  │  Real-time updates as advisor   │ │
│  │                                     │  │  makes changes on the left      │ │
│  └─────────────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                             │
│                          [Save Plan] [Generate Report]                     │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.cash-flow-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.advisor-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-gray);
}

.ai-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  position: sticky;
  top: 24px;
  height: fit-content;
}

.section-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-gray);
}

.editable-field {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 8px 0;
}

.field-label {
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.field-value {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  text-align: right;
}

.field-input {
  border: 1px solid var(--border-gray);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  width: 120px;
}

@media (max-width: 1024px) {
  .cash-flow-container {
    grid-template-columns: 1fr;
  }
  
  .ai-section {
    position: static;
  }
}
```

### 3.2 Debt Management Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Debt Management                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Debt Analysis:                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Debt Type     │Outstanding│ Current EMI │ Interest │ Recommended EMI  │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Personal Loan │ ₹2,00,000 │   ₹7,000   │   14%    │ ₹12,000 ↑       │  │
│  │ Car Loan      │ ₹3,00,000 │   ₹8,000   │  10.5%   │ ₹8,000 →        │  │
│  │ Home Loan     │₹25,00,000 │  ₹20,000   │   8.5%   │ ₹20,000 →       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  EMI Ratio Analysis:                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │ Current Total EMI: ₹35,000                                      │       │
│  │ Monthly Income: ₹75,000                                         │       │
│  │ EMI Ratio: 46.67% ⚠️ (Exceeds safe limit of 40%)               │       │
│  │                                                                 │       │
│  │ Recommended Total EMI: ₹40,000                                  │       │
│  │ New EMI Ratio: 53.33% ⚠️ (Still high, needs income increase)   │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  Strategy Recommendations:                                                  │
│  • Increase Personal Loan EMI by ₹5,000 (clear in 18 months vs 30)        │
│  • Interest savings: ₹85,000 over loan tenure                              │
│  • Consider income increase or expense reduction for sustainable ratios     │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.debt-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.debt-table th,
.debt-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-gray);
}

.debt-table th {
  background: var(--background-gray);
  font-weight: 600;
  color: var(--text-primary);
}

.debt-table .increase { color: var(--error-red); }
.debt-table .maintain { color: var(--secondary-gray); }

.ratio-analysis {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.ratio-warning {
  color: var(--error-red);
  font-weight: 600;
}

.strategy-list {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
}

.strategy-list li {
  margin-bottom: 8px;
  color: var(--text-primary);
}
```

### 3.3 Investment Recommendations Form

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Investment Recommendations                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Monthly SIP Recommendations:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [+ Add Mutual Fund]                                                 │   │
│  │                                                                     │   │
│  │ Fund Name: [🔍 HDFC Top 100 Fund        ] (Search dropdown)        │   │
│  │ Monthly SIP: [₹10,000                   ]                          │   │
│  │ Category: [Large Cap Equity ▼           ]                          │   │
│  │ Reasoning: [Core equity exposure for long-term wealth creation     ] │   │
│  │                                                                     │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │ [+ Add Mutual Fund]                                                 │   │
│  │                                                                     │   │
│  │ Fund Name: [🔍 ICICI Prudential Debt Fund] (Search dropdown)       │   │
│  │ Monthly SIP: [₹5,000                    ]                          │   │
│  │ Category: [Debt Fund ▼                  ]                          │   │
│  │ Reasoning: [Stability and emergency fund building                 ] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  One-time Investments:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Fund Name: [🔍 Liquid Fund              ] (Search dropdown)        │   │
│  │ Investment: [₹1,00,000                  ]                          │   │
│  │ Purpose: [Emergency Fund Building       ]                          │   │
│  │ [+ Add Another]                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Custom Variables:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [+ Add Custom Variable]                                             │   │
│  │                                                                     │   │
│  │ Variable: [Annual Bonus Allocation      ]                          │   │
│  │ Value: [₹2,00,000                       ]                          │   │
│  │ Description: [Yearly bonus investment strategy                    ] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.investment-form {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.fund-entry {
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;
}

.fund-search {
  position: relative;
  margin-bottom: 12px;
}

.fund-search input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid var(--border-gray);
  border-radius: 6px;
  font-size: 14px;
}

.fund-search .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.fund-details {
  display: grid;
  grid-template-columns: 1fr 150px 200px;
  gap: 12px;
  margin-bottom: 12px;
}

.reasoning-field {
  width: 100%;
  min-height: 60px;
  padding: 12px;
  border: 1px solid var(--border-gray);
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
}

.add-button {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-button:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .fund-details {
    grid-template-columns: 1fr;
  }
}
```

## 4. Goal Based Planning Interface

### 4.1 Goal Selection Cards

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Choose Your Goals                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │       🏖️        │  │       💒        │  │       🚗        │            │
│  │   RETIREMENT     │  │   MARRIAGE OF   │  │   BUY A CAR     │            │
│  │    PLANNING      │  │    DAUGHTER     │  │                 │            │
│  │                  │  │                 │  │                 │            │
│  │ Plan for your    │  │ Save for your   │  │ Purchase your   │            │
│  │ retirement       │  │ daughter's      │  │ dream car       │            │
│  │ lifestyle        │  │ wedding         │  │                 │            │
│  │                  │  │                 │  │                 │            │
│  │ ✅ Selected      │  │ [+ Add Goal]    │  │ [+ Add Goal]    │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                                 │
│  │       🎓        │  │       ⚙️        │                                 │
│  │ CHILD EDUCATION │  │  CUSTOM GOAL    │                                 │
│  │                 │  │                 │                                 │
│  │ Fund your       │  │ Create your     │                                 │
│  │ child's higher  │  │ personalized    │                                 │
│  │ education       │  │ financial goal  │                                 │
│  │                 │  │                 │                                 │
│  │ ✅ Selected     │  │ [+ Add Goal]    │                                 │
│  └─────────────────┘  └─────────────────┘                                 │
│                                                                             │
│                              [Continue]                                    │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.goals-selection {
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.goal-card {
  border: 2px solid var(--border-gray);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;
}

.goal-card.selected {
  border-color: var(--primary-green);
  background: #f0f9ff;
}

.goal-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.goal-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.goal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.goal-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
}

.goal-action {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.goal-action.selected {
  background: var(--primary-green);
}

.selected-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--primary-green);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
```

### 4.2 Retirement Planning Detailed Form

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Retirement Planning                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │      BASIC INFORMATION       │  │         CORPUS CALCULATION            │ │
│  ├──────────────────────────────┤  ├──────────────────────────────────────┤ │
│  │ Current Age: [32    ] years  │  │ Required Monthly Income: ₹1,15,000   │ │
│  │ Retirement Age: [60 ] years  │  │ (₹45,000 × 80% × inflation)         │ │
│  │ Life Expectancy: [80] years  │  │                                      │ │
│  │ Years to Retirement: 28      │  │ Total Corpus Required: ₹1,73,00,000  │ │
│  │ Years in Retirement: 20      │  │                                      │ │
│  └──────────────────────────────┘  │ Existing Corpus: ₹6,00,000           │ │
│                                    │                                      │ │
│  ┌──────────────────────────────┐  │ Additional Needed: ₹1,67,00,000      │ │
│  │     INCOME & LIFESTYLE       │  │                                      │ │
│  ├──────────────────────────────┤  │ Monthly SIP Required: ₹18,500        │ │
│  │ Current Salary: ₹75,000      │  └──────────────────────────────────────┘ │
│  │ Current Expenses: ₹45,000    │                                          │ │
│  │ Lifestyle Factor: [80]%      │  ┌──────────────────────────────────────┐ │
│  │ Inflation Rate: [6]%         │  │        CURRENT INVESTMENTS            │ │
│  │ Expected Returns: [12]%      │  ├──────────────────────────────────────┤ │
│  └──────────────────────────────┘  │ PPF Balance: ₹1,00,000               │ │
│                                    │ PPF Annual: ₹1,50,000                │ │
│  ┌──────────────────────────────┐  │                                      │ │
│  │     OTHER INCOME SOURCES     │  │ EPF Balance: ₹5,00,000               │ │
│  ├──────────────────────────────┤  │ EPF Monthly: ₹9,000                  │ │
│  │ Rental Income: [₹0    ]      │  │                                      │ │
│  │ Pension Expected: [₹5,00,000]│  │ Equity MF SIP: ₹8,000               │ │
│  │ Other Income: [₹0     ]      │  │ ELSS Annual: ₹1,50,000               │ │
│  └──────────────────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.retirement-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
}

.form-section {
  background: white;
  border: 1px solid var(--border-gray);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  background: var(--background-gray);
  padding: 16px 20px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-gray);
}

.section-content {
  padding: 20px;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.input-label {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.input-field {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid var(--border-gray);
  border-radius: 6px;
  text-align: right;
}

.calculated-field {
  background: #f8f9fa;
  color: var(--text-secondary);
  cursor: not-allowed;
}

.corpus-calculation {
  grid-column: span 1;
}

.corpus-highlight {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  text-align: center;
}

.corpus-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-green);
}

@media (max-width: 768px) {
  .retirement-form {
    grid-template-columns: 1fr;
  }
}
```

### 4.3 Multi-Goal Prioritization Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Goal Prioritization                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Selected Goals Overview:                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Goal               │Priority│Amount    │Timeline│Monthly SIP│Status  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 🏖️ Retirement      │ ⚡High │₹1.67Cr   │28 years│ ₹18,500  │ ✅ OK  │   │
│  │ 🎓 Child Education │ ⚡High │₹85L      │13 years│ ₹28,000  │ ⚠️ Gap │   │
│  │ 💒 Daughter Marriage│ Medium │₹55L      │17 years│ ₹12,500  │ ⚠️ Gap │   │
│  │ 🚗 Car Purchase    │ Low    │₹18L      │3 years │ ₹8,500   │ ✅ OK  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ TOTAL REQUIRED     │        │          │        │ ₹67,500  │        │   │
│  │ AVAILABLE SURPLUS  │        │          │        │ ₹30,000  │        │   │
│  │ SHORTFALL          │        │          │        │ ₹37,500  │ ❌ Gap │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Optimization Strategy:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📅 PHASE 1 (Years 1-3): Priority Focus                             │   │
│  │ ├─ Car Goal: ₹8,500/month (complete first)                         │   │
│  │ ├─ Emergency Fund: ₹10,000/month                                    │   │
│  │ ├─ Retirement: ₹8,000/month (existing)                             │   │
│  │ └─ Child Education: ₹3,500/month (start building)                  │   │
│  │                                                                     │   │
│  │ 📅 PHASE 2 (Years 4-6): Post-Car Reallocation                     │   │
│  │ ├─ Child Education: ₹15,000/month (increased)                      │   │
│  │ ├─ Retirement: ₹12,000/month (increased)                           │   │
│  │ └─ Daughter Marriage: ₹5,000/month (start)                         │   │
│  │                                                                     │   │
│  │ 📅 PHASE 3 (Years 7+): Final Push                                  │   │
│  │ ├─ Child Education: ₹25,000/month (final 6 years)                  │   │
│  │ ├─ Retirement: ₹15,000/month                                        │   │
│  │ └─ Daughter Marriage: ₹12,500/month                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Alternative Suggestions:                                                   │
│  • Extend child education timeline by 2 years → Reduce SIP to ₹20,000     │
│  • Increase income by ₹15,000/month → All goals achievable                │
│  • Reduce marriage budget by ₹15L → Reduce SIP to ₹8,500                  │
│                                                                             │
│                         [Adjust Goals] [Accept Strategy]                   │
└─────────────────────────────────────────────────────────────────────────────┘

CSS Specifications:
.prioritization-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.goals-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.goals-table th,
.goals-table td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-gray);
}

.goals-table th {
  background: var(--background-gray);
  font-weight: 600;
  color: var(--text-primary);
}

.priority-high { 
  background: #fef2f2; 
  color: #dc2626;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.priority-medium { 
  background: #fef3c7; 
  color: #d97706;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.priority-low { 
  background: #f0fdf4; 
  color: #16a34a;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-ok {
  color: var(--success-green);
  font-weight: 600;
}

.status-gap {
  color: var(--warning-orange);
  font-weight: 600;
}

.status-error {
  color: var(--error-red);
  font-weight: 600;
}

.strategy-phases {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-gray);
}

.phase {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--primary-blue);
}

.phase-title {
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.phase-items {
  list-style: none;
  padding: 0;
}

.phase-items li {
  margin-bottom: 8px;
  color: var(--text-secondary);
  padding-left: 16px;
  position: relative;
}

.phase-items li::before {
  content: "├─";
  position: absolute;
  left: 0;
  color: var(--primary-blue);
}

.phase-items li:last-child::before {
  content: "└─";
}

.suggestions-list {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.suggestions-list li {
  margin-bottom: 8px;
  color: var(--text-primary);
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary {
  background: var(--primary-green);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: var(--primary-blue);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
```

## 5. Responsive Design Considerations

### 5.1 Mobile Layout (< 768px)

```css
@media (max-width: 768px) {
  .cash-flow-container {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  
  .ai-section {
    position: static;
    order: 2;
  }
  
  .advisor-section {
    order: 1;
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
  }
  
  .approach-grid {
    grid-template-columns: 1fr;
  }
  
  .retirement-form {
    grid-template-columns: 1fr;
  }
  
  .goals-table {
    font-size: 12px;
  }
  
  .goals-table th,
  .goals-table td {
    padding: 8px 6px;
  }
  
  .modal-content {
    margin: 16px;
    padding: 20px;
  }
}
```

### 5.2 Tablet Layout (768px - 1024px)

```css
@media (min-width: 768px) and (max-width: 1024px) {
  .cash-flow-container {
    grid-template-columns: 1fr 300px;
    gap: 16px;
  }
  
  .approach-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .goals-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .fund-details {
    grid-template-columns: 1fr 120px;
  }
}
```

## 6. Accessibility Features

### 6.1 ARIA Labels and Screen Reader Support

```html
<!-- Example for goal cards -->
<div class="goal-card" 
     role="button" 
     tabindex="0"
     aria-label="Select retirement planning goal"
     aria-describedby="retirement-description">
  <span class="goal-icon" aria-hidden="true">🏖️</span>
  <h3 class="goal-title">Retirement Planning</h3>
  <p id="retirement-description" class="goal-description">
    Plan for your retirement lifestyle
  </p>
</div>

<!-- Example for form inputs -->
<label for="monthly-income" class="field-label">
  Monthly Income
</label>
<input id="monthly-income" 
       type="number" 
       class="field-input"
       aria-describedby="income-help"
       required>
<div id="income-help" class="sr-only">
  Enter your total monthly income from all sources
</div>
```

### 6.2 Keyboard Navigation

```css
.goal-card:focus,
.approach-card:focus,
.plan-card:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

.btn-primary:focus,
.btn-secondary:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## 7. Animation and Transitions

### 7.1 Smooth Transitions

```css
/* Card hover effects */
.goal-card,
.approach-card,
.plan-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button interactions */
.btn-primary,
.btn-secondary,
.create-plan-btn {
  transition: all 0.15s ease-in-out;
}

/* Modal animations */
.planning-modal {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Loading states */
.loading {
  position: relative;
  overflow: hidden;
}

.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.8),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
```

This comprehensive UI/UX documentation provides the foundation for implementing a user-friendly, accessible, and visually consistent financial planning interface that seamlessly integrates with the existing application design.