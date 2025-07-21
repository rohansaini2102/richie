# Component Details & Implementation Guide

## 📋 Table of Contents
- [Planning System Components](#planning-system-components)
- [Client Management Components](#client-management-components)
- [Shared Components](#shared-components)
- [Custom Hooks](#custom-hooks)
- [State Management](#state-management)
- [Backend Controllers](#backend-controllers)
- [Integration Examples](#integration-examples)

## 🎯 Planning System Components

### 1. PlanCreationModal.jsx
**Purpose**: Wizard-style plan creation with data preview
**Location**: `frontend/src/components/planning/PlanCreationModal.jsx`

```javascript
// Key Features:
- 3-step wizard: Plan Type → Data Review → Creation
- Stepper UI with Material-UI
- Client data validation before plan creation
- Integration with ClientDataPreview component

// Props:
{
  open: boolean,
  onClose: function,
  clientId: string,
  clientName: string,
  clientData: object,
  onPlanCreated: function
}

// State Management:
- activeStep (0, 1, 2)
- selectedPlanType ('cash_flow', 'goal_based', 'hybrid')
- reviewedClientData (cached client data)
- loading/error states
```

### 2. ClientDataPreview.jsx
**Purpose**: Structured client data display with JSON view
**Location**: `frontend/src/components/planning/cashflow/ClientDataPreview.jsx`

```javascript
// Key Features:
- Accordion-style data sections
- Raw JSON toggle view
- Data completeness calculation
- Copy to clipboard functionality
- Progress indicators for missing data

// Data Sections:
1. Personal Information
2. Financial Summary (income, expenses, ratios)
3. Assets & Investments
4. Debts & Liabilities

// Calculated Metrics:
- Data completeness percentage
- Monthly surplus/deficit
- Savings rate
- Asset totals
```

### 3. DebtManagement.jsx
**Purpose**: Debt analysis, prioritization, and repayment strategies
**Location**: `frontend/src/components/planning/cashflow/DebtManagement.jsx`

```javascript
// Key Features:
- Debt prioritization by interest rate
- EMI to income ratio analysis
- Prepayment calculator dialog
- Visual debt health indicators
- Repayment timeline projections

// Metrics Displayed:
- Total outstanding debt
- Monthly EMI commitments
- EMI to income ratio (with safety thresholds)
- Debt health status (Healthy/Manageable/High Risk)

// Interactive Elements:
- Prepayment calculation modal
- Priority ranking system
- Interest savings calculator
```

### 4. EmergencyFund.jsx
**Purpose**: Emergency fund planning and progress tracking
**Location**: `frontend/src/components/planning/cashflow/EmergencyFund.jsx`

```javascript
// Key Features:
- 6-month expense coverage calculation
- Monthly contribution planning
- Liquid fund recommendations
- Progress visualization
- Investment option accordion

// Target Calculation:
- Base target: 6 months of (expenses + EMIs)
- Minimum threshold: ₹50,000
- Current coverage: Months of expenses covered
- Gap analysis: Amount needed to reach target

// Investment Recommendations:
- Liquid mutual funds
- High-yield savings accounts
- Sweep-in fixed deposits
```

### 5. InvestmentStrategy.jsx
**Purpose**: Asset allocation and investment recommendations
**Location**: `frontend/src/components/planning/cashflow/InvestmentStrategy.jsx`

```javascript
// Key Features:
- Age-based asset allocation
- Risk profile-based adjustments
- Mutual fund recommendations
- SIP planning interface
- Projected returns calculator

// Asset Allocation Logic:
- Equity: (100 - age)% with risk adjustments
- Conservative: -20% equity
- Aggressive: +20% equity
- Debt: Remaining allocation

// Fund Categories:
- Equity: Large Cap, Mid Cap, Small Cap, Flexi Cap
- Debt: Corporate Bond, Gilt, Banking & PSU
- Hybrid: Dynamic, Aggressive Hybrid
```

### 6. CashFlowMetrics.jsx
**Purpose**: Financial health dashboard and key metrics
**Location**: `frontend/src/components/planning/cashflow/CashFlowMetrics.jsx`

```javascript
// Key Features:
- Financial health score (0-100)
- Key ratio analysis
- Net worth calculation
- Score breakdown by category
- Benchmark comparisons

// Health Score Categories (20 points each):
1. Income Stability
2. Expense Management
3. Debt Management
4. Savings Discipline
5. Emergency Preparedness

// Key Ratios Tracked:
- Savings Rate (target: 20%+)
- EMI Ratio (safe: <30%, max: 40%)
- Expense Ratio (good: <50%)
- Fixed Expenditure Ratio (flexible: <50%)
```

### 7. ActionItems.jsx
**Purpose**: Task management and action item tracking
**Location**: `frontend/src/components/planning/cashflow/ActionItems.jsx`

```javascript
// Key Features:
- Auto-generated action items based on financial analysis
- Priority-based categorization
- Progress tracking with completion rates
- Custom action item creation
- Timeline-based organization

// Action Item Structure:
{
  id: string,
  action: string,
  priority: 'high' | 'medium' | 'low',
  timeline: '0-1 month' | '0-3 months' | etc,
  category: 'debt' | 'savings' | 'expense' | 'investment',
  description: string,
  completed: boolean,
  completedDate: date
}

// Auto-generated Actions:
- High EMI ratio → "Reduce EMI ratio to below 40%"
- Low emergency fund → "Build emergency fund"
- High-interest debt → "Prioritize debt repayment"
```

## 👥 Client Management Components

### ClientDetailView.jsx
**Purpose**: Main client information display and editing
**Location**: `frontend/src/components/client/ClientDetailView.jsx`

```javascript
// Key Features:
- 7-step client data display
- Inline editing for each section
- Plan creation integration
- CAS data visualization
- Financial planning section

// Data Sections:
1. Personal Information
2. Income & Expenses  
3. Retirement Planning
4. CAS & Investments
5. Debts & Liabilities
6. Insurance Coverage
7. Goals & Risk Profile

// Integration Points:
- PlanCreationModal trigger
- PlanHistory display
- CashFlowPlanning navigation
```

## 🔧 Shared Components

### MetricCard.jsx
**Purpose**: Reusable metric display cards
**Location**: `frontend/src/components/planning/shared/MetricCard.jsx`

```javascript
// Features:
- Configurable colors and icons
- Progress bar support
- Chip/badge display
- Click handlers
- Tooltip integration

// Usage Examples:
<MetricCard
  title="Monthly Income"
  value="₹75,000"
  icon={<MonetizationOn />}
  color="success"
  progress={85}
  chip={{ label: "Stable", color: "success" }}
/>
```

### EditableField.jsx
**Purpose**: Inline editing component
**Location**: `frontend/src/components/planning/shared/EditableField.jsx`

```javascript
// Features:
- Multiple input types (text, number, select, date)
- Format support (currency, percentage)
- Validation integration
- Save/cancel actions

// Field Types:
- text, number, email, phone
- select (with options)
- date, currency, percentage
```

### ProgressIndicator.jsx
**Purpose**: Progress visualization component
**Location**: `frontend/src/components/planning/shared/ProgressIndicator.jsx`

```javascript
// Types:
- Linear progress bars
- Circular progress
- Stepper progress
- Custom color schemes

// Use Cases:
- Data completeness
- Financial goal progress
- Action item completion
- Health score visualization
```

### DataSection.jsx
**Purpose**: Collapsible data sections
**Location**: `frontend/src/components/planning/shared/DataSection.jsx`

```javascript
// Features:
- Accordion/card layouts
- JSON data viewer toggle
- Copy functionality
- Status indicators
- Loading states

// Status Types:
- complete, incomplete, error
- Custom status colors and icons
```

## 🎣 Custom Hooks

### usePlanData.js
**Purpose**: Plan and client data management
**Location**: `frontend/src/hooks/usePlanData.js`

```javascript
// Functions:
- loadPlan(planId)
- loadClient(clientId)
- updatePlan(updates)
- updatePlanSection(section, updates)
- generateRecommendations()

// State Management:
- planData, clientData
- loading states
- error handling
- cache management

// Usage:
const {
  planData,
  clientData,
  isLoading,
  updatePlan,
  generateRecommendations
} = usePlanData(planId, clientId);
```

### useCalculations.js
**Purpose**: Memoized financial calculations
**Location**: `frontend/src/hooks/useCalculations.js`

```javascript
// Calculated Values:
- monthlyMetrics: EMI ratios, savings rate, surplus
- emergencyFund: target, gap, coverage months
- healthScore: 0-100 comprehensive score
- prioritizedDebts: sorted by interest rate
- netWorth: assets - liabilities
- actionItems: auto-generated tasks

// Performance:
- useMemo for expensive calculations
- Dependency-based recalculation
- Cached results

// Usage:
const {
  financialOverview,
  healthScore,
  actionItems,
  investmentRecommendations
} = useCalculations(clientData);
```

### useValidation.js
**Purpose**: Form validation and error handling
**Location**: `frontend/src/hooks/useValidation.js`

```javascript
// Validation Rules:
- required, email, phone, pan
- positive, percentage, dateNotFuture
- minValue, maxValue, ageRange

// Financial Validators:
- validateIncomeExpenseRatio
- validateEMIRatio  
- validateRetirementAge

// Usage:
const {
  values,
  errors,
  getFieldProps,
  validateAll,
  financialValidators
} = useValidation(initialValues, rules);
```

## 🏪 State Management

### PlanningContext.jsx
**Purpose**: Centralized state management
**Location**: `frontend/src/contexts/PlanningContext.jsx`

```javascript
// State Structure:
{
  // Data
  clientData: object,
  planData: object,
  
  // UI State  
  activeSection: string,
  editMode: boolean,
  saving: boolean,
  
  // Cached Calculations
  calculatedMetrics: object,
  lastCalculated: date,
  
  // Form State
  formData: object,
  actionItems: array
}

// Actions:
- setClientData, setPlanData
- updatePlanSection
- setActiveSection, setEditMode
- API integration functions

// Usage:
const {
  clientData,
  planData,
  api: { loadClientData, updatePlan },
  computed: { getDataCompleteness }
} = usePlanning();
```

## ⚙️ Backend Controllers

### planController.js
**Purpose**: Financial plan CRUD operations
**Location**: `backend/controllers/planController.js`

```javascript
// Main Functions:
- createPlan: Create new financial plan with client snapshot
- getPlanById: Retrieve plan with populated data
- updatePlan: Update plan sections with change history
- getClientPlans: Get all plans for a client
- generateAIRecommendations: AI-based suggestions

// Plan Creation Process:
1. Validate client exists and belongs to advisor
2. Create client data snapshot
3. Initialize plan details (cash flow, goals, etc.)
4. Set review schedule
5. Generate initial action items

// Key Features:
- Change history tracking
- Performance metrics updates
- Client data validation
- Default value handling for missing data
```

### clientController.js
**Purpose**: Client data management
**Location**: `backend/controllers/clientController.js`

```javascript
// Functions:
- getClientById: Detailed client data with calculations
- updateClient: Update client information
- getClients: List clients with filtering
- getDashboardStats: Advisor dashboard metrics

// Data Enhancement:
- Completion percentage calculation
- Financial health scoring  
- Portfolio summary integration
- CAS data processing
```

## 🔗 Integration Examples

### Creating a New Plan
```javascript
// 1. User clicks "Create Plan" in ClientDetailView
<Button onClick={() => setShowPlanModal(true)}>
  Create New Plan
</Button>

// 2. PlanCreationModal opens with stepper
<PlanCreationModal
  open={showPlanModal}
  clientId={clientId}
  clientData={client}
  onPlanCreated={handlePlanCreated}
/>

// 3. ClientDataPreview shows structured data
<ClientDataPreview
  clientId={clientId}
  onProceed={handleDataReviewed}
  onCancel={handleBack}
/>

// 4. Plan creation API call
const response = await planAPI.createPlan({
  clientId,
  planType: 'cash_flow'
});

// 5. Navigate to planning interface
setSelectedPlanId(response.plan._id);
setShowCashFlowPlanning(true);
```

### Using Modular Components
```javascript
// Import components
import {
  DebtManagement,
  EmergencyFund,
  InvestmentStrategy,
  CashFlowMetrics,
  ActionItems
} from '../planning/cashflow';

// Use in planning interface
<Grid container spacing={3}>
  <Grid item xs={12}>
    <CashFlowMetrics 
      clientData={clientData} 
      planData={planData} 
    />
  </Grid>
  <Grid item xs={12} md={6}>
    <DebtManagement
      clientData={clientData}
      planData={planData}
      onUpdate={handlePlanUpdate}
    />
  </Grid>
  <Grid item xs={12} md={6}>
    <EmergencyFund
      clientData={clientData}
      planData={planData}
      onUpdate={handlePlanUpdate}
    />
  </Grid>
</Grid>
```

### Using Custom Hooks
```javascript
// In a planning component
function PlanningDashboard({ planId, clientId }) {
  // Data management
  const {
    planData,
    clientData,
    isLoading,
    updatePlan
  } = usePlanData(planId, clientId);

  // Financial calculations
  const {
    financialOverview,
    healthScore,
    actionItems
  } = useCalculations(clientData);

  // Form validation
  const {
    values,
    errors,
    validateAll
  } = useValidation(initialValues, validationRules);

  // Render with calculated data
  return (
    <Box>
      <Typography variant="h4">
        Financial Health: {healthScore}/100
      </Typography>
      {/* Rest of component */}
    </Box>
  );
}
```

This modular architecture provides a scalable, maintainable foundation for the RicheAI financial planning system, with clear separation of concerns and reusable components that can be easily extended and modified.