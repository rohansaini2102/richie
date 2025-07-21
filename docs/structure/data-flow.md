# Data Flow & Integration Patterns

## 📋 Table of Contents
- [Overview](#overview)
- [Client Data Flow](#client-data-flow)
- [Planning System Data Flow](#planning-system-data-flow)
- [Component Communication](#component-communication)
- [State Management Patterns](#state-management-patterns)
- [API Integration](#api-integration)
- [Calculation Pipeline](#calculation-pipeline)
- [Error Handling](#error-handling)

## 🌊 Overview

The RicheAI system follows a unidirectional data flow pattern with centralized state management and component-based architecture. Data flows from the backend through API services, into React context/hooks, and down to individual components.

## 📊 Client Data Flow

### 1. Client Onboarding Flow
```mermaid
graph TD
    A[Client Invitation] --> B[5-Stage Onboarding Form]
    B --> C[Form Validation]
    C --> D[Data Submission]
    D --> E[Backend Processing]
    E --> F[Database Storage]
    F --> G[Client Profile Created]
    G --> H[Available for Planning]
```

**Implementation:**
```javascript
// Onboarding submission
const response = await clientAPI.submitOnboardingForm(token, formData);

// Data structure
const clientData = {
  personalInfo: { firstName, lastName, email, ... },
  financialInfo: { totalMonthlyIncome, totalMonthlyExpenses, ... },
  assets: { investments: {...}, cashBankSavings: ... },
  debtsAndLiabilities: { homeLoan: {...}, personalLoan: {...} },
  retirementPlanning: { retirementAge, targetCorpus, ... },
  enhancedRiskProfile: { riskTolerance, investmentExperience, ... }
}
```

### 2. Client Data Retrieval
```mermaid
graph LR
    A[ClientDetailView] --> B[clientAPI.getClientById]
    B --> C[Backend Controller]
    C --> D[Database Query]
    D --> E[Data Enhancement]
    E --> F[Completion % Calc]
    F --> G[Response to Frontend]
    G --> H[State Update]
```

**Data Enhancement Process:**
```javascript
// Backend enhancement
const enhancedClient = {
  ...rawClientData,
  completionPercentage: calculateCompletionPercentage(rawClientData),
  calculatedFinancials: {
    monthlySurplus: monthlyIncome - monthlyExpenses,
    savingsRate: (surplus / income) * 100,
    emiRatio: (totalEMIs / income) * 100
  },
  portfolioSummary: casData ? generatePortfolioSummary(casData) : null
}
```

## 🎯 Planning System Data Flow

### 1. Plan Creation Flow
```mermaid
graph TD
    A[User Clicks 'Create Plan'] --> B[PlanCreationModal Opens]
    B --> C[Step 1: Plan Type Selection]
    C --> D[Step 2: ClientDataPreview]
    D --> E[Fetch & Display Client Data]
    E --> F[Data Validation & Review]
    F --> G[User Confirms Data]
    G --> H[Step 3: Plan Creation]
    H --> I[API Call to Create Plan]
    I --> J[Backend Processing]
    J --> K[Plan Stored in Database]
    K --> L[Success Response]
    L --> M[Navigate to Planning Interface]
```

**Code Implementation:**
```javascript
// PlanCreationModal.jsx
const handleDataReviewed = (data) => {
  setReviewedClientData(data);
  handleNext(); // Move to creation step
};

const handleCreatePlan = async () => {
  const response = await planAPI.createPlan({
    clientId,
    planType: selectedPlanType
  });
  onPlanCreated(response.plan);
};
```

### 2. Component Data Flow
```mermaid
graph TD
    A[PlanningContext] --> B[usePlanData Hook]
    B --> C[Individual Components]
    C --> D[DebtManagement]
    C --> E[EmergencyFund]
    C --> F[InvestmentStrategy]
    C --> G[CashFlowMetrics]
    C --> H[ActionItems]
    
    I[useCalculations Hook] --> D
    I --> E
    I --> F
    I --> G
    I --> H
    
    J[User Interactions] --> K[Component Updates]
    K --> L[Context Updates]
    L --> M[API Calls]
    M --> N[Database Updates]
    N --> O[State Synchronization]
```

**Hook Integration:**
```javascript
// Component implementation
function DebtManagement({ clientId, planId }) {
  // Data management
  const { planData, updatePlanSection } = usePlanData(planId, clientId);
  
  // Calculations
  const { prioritizedDebts, monthlyMetrics } = useCalculations(clientData);
  
  // Local state
  const [editMode, setEditMode] = useState(false);
  
  // Update handler
  const handleUpdate = async (updates) => {
    await updatePlanSection('debtManagement', updates);
  };
}
```

## 🔄 Component Communication

### 1. Parent-Child Communication
```mermaid
graph TD
    A[ClientDetailView] --> B[PlanCreationModal]
    B --> C[ClientDataPreview]
    
    D[Planning Interface] --> E[DebtManagement]
    D --> F[EmergencyFund]
    D --> G[InvestmentStrategy]
    
    H[Props Down] --> I[Events Up]
```

**Props Pattern:**
```javascript
// Parent component
<DebtManagement
  clientData={clientData}
  planData={planData}
  onUpdate={handlePlanUpdate}
/>

// Child component
const DebtManagement = ({ clientData, planData, onUpdate }) => {
  const handleDebtUpdate = (updates) => {
    onUpdate('debtManagement', updates);
  };
};
```

### 2. Context-Based Communication
```javascript
// Provider level
<PlanningProvider>
  <PlanningInterface />
</PlanningProvider>

// Consumer components
const DebtManagement = () => {
  const {
    clientData,
    planData,
    updatePlanSection,
    setEditMode
  } = usePlanning();
  
  // Component logic
};
```

## 🏪 State Management Patterns

### 1. Context State Structure
```javascript
const planningState = {
  // Core data
  clientData: {
    personalInfo: {...},
    financialInfo: {...},
    assets: {...},
    debtsAndLiabilities: {...}
  },
  
  planData: {
    planType: 'cash_flow',
    status: 'draft',
    planDetails: {
      cashFlowPlan: {
        debtManagement: {...},
        emergencyFundStrategy: {...},
        investmentRecommendations: {...}
      }
    }
  },
  
  // UI state
  activeSection: 'overview',
  editMode: false,
  saving: false,
  
  // Cached calculations
  calculatedMetrics: {
    monthlyMetrics: {...},
    healthScore: 75,
    emergencyFund: {...}
  },
  
  // Form state
  formData: {},
  actionItems: []
}
```

### 2. State Update Patterns
```javascript
// Optimistic updates
const updatePlanSection = async (section, updates) => {
  // Update local state immediately
  dispatch({
    type: 'UPDATE_PLAN_SECTION',
    section,
    payload: updates
  });
  
  // Sync with backend
  try {
    const response = await planAPI.updatePlan(planId, {
      planDetails: {
        ...planData.planDetails,
        [section]: { ...planData.planDetails[section], ...updates }
      }
    });
    
    // Update with server response
    dispatch({ type: 'SET_PLAN_DATA', payload: response.plan });
  } catch (error) {
    // Revert on error
    dispatch({ type: 'REVERT_PLAN_SECTION', section });
    throw error;
  }
};
```

## 🔌 API Integration

### 1. API Service Layer
```javascript
// services/api.js
export const planAPI = {
  createPlan: async (planData) => {
    const response = await api.post('/plans', planData);
    return response.data;
  },
  
  updatePlan: async (planId, updates) => {
    const response = await api.put(`/plans/${planId}`, updates);
    return response.data;
  },
  
  getPlanById: async (planId) => {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  }
};
```

### 2. Request/Response Flow
```mermaid
graph LR
    A[Component] --> B[Hook/Context]
    B --> C[API Service]
    C --> D[Axios Instance]
    D --> E[Request Interceptor]
    E --> F[Backend API]
    F --> G[Response Interceptor]
    G --> H[Data Processing]
    H --> I[State Update]
    I --> J[Component Re-render]
```

**Interceptor Implementation:**
```javascript
// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  config.metadata = {
    startTime: new Date(),
    requestId: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`API Response [${response.config.metadata.requestId}]: ${duration}ms`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## ⚡ Calculation Pipeline

### 1. Calculation Flow
```mermaid
graph TD
    A[Client Data] --> B[useCalculations Hook]
    B --> C[useMemo Wrapper]
    C --> D[Base Calculations]
    D --> E[Monthly Metrics]
    D --> F[Emergency Fund]
    D --> G[Debt Analysis]
    D --> H[Health Score]
    E --> I[Component Consumption]
    F --> I
    G --> I
    H --> I
```

**Memoization Strategy:**
```javascript
// useCalculations.js
export const useCalculations = (clientData) => {
  // Monthly metrics with dependency tracking
  const monthlyMetrics = useMemo(() => {
    if (!clientData) return null;
    return calculateMonthlyMetrics(clientData);
  }, [clientData]);

  // Emergency fund calculation
  const emergencyFund = useMemo(() => {
    if (!clientData) return null;
    return calculateEmergencyFund(clientData);
  }, [clientData]);

  // Health score with multiple dependencies
  const healthScore = useMemo(() => {
    if (!clientData || !monthlyMetrics) return 0;
    return calculateFinancialHealthScore(clientData, monthlyMetrics);
  }, [clientData, monthlyMetrics]);

  // Return all calculations
  return {
    monthlyMetrics,
    emergencyFund, 
    healthScore,
    // ... other calculations
  };
};
```

### 2. Calculation Dependencies
```javascript
// Dependency chain
clientData -> monthlyMetrics -> healthScore -> actionItems
                            \-> emergencyFund -> investmentCapacity
                            \-> debtAnalysis -> prioritizedDebts
```

## 🚨 Error Handling

### 1. Error Propagation Pattern
```mermaid
graph TD
    A[Component Action] --> B[Hook/Context]
    B --> C[API Call]
    C --> D{Success?}
    D -->|Yes| E[Update State]
    D -->|No| F[Error Handling]
    F --> G[Set Error State]
    G --> H[Display Error UI]
    F --> I[Log Error]
    I --> J[Optional: Retry Logic]
```

**Error Handling Implementation:**
```javascript
// usePlanData.js
const updatePlan = useCallback(async (updates) => {
  try {
    setState(prev => ({ ...prev, error: null, saving: true }));
    const response = await planAPI.updatePlan(planId, updates);
    setState(prev => ({
      ...prev,
      planData: response.plan,
      saving: false,
      lastUpdated: new Date()
    }));
    return response.plan;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to update plan';
    setState(prev => ({
      ...prev,
      error: errorMessage,
      saving: false
    }));
    throw error; // Re-throw for component handling
  }
}, [planId]);

// Component error handling
const handleUpdate = async () => {
  try {
    await updatePlan(formData);
    toast.success('Plan updated successfully');
  } catch (error) {
    toast.error(`Update failed: ${error.message}`);
  }
};
```

### 2. Error Boundaries
```javascript
// ErrorBoundary component
class PlanningErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Planning Error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          <Typography variant="h6">Something went wrong</Typography>
          <Typography variant="body2">
            There was an error in the planning interface. Please refresh the page.
          </Typography>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

## 📈 Performance Considerations

### 1. Optimization Techniques
- **Memoization**: Expensive calculations cached with useMemo
- **Component Splitting**: Large components broken into smaller ones
- **Lazy Loading**: Components loaded on demand
- **Context Optimization**: Multiple contexts to prevent unnecessary re-renders

### 2. Data Loading Strategy
```javascript
// Concurrent data loading
useEffect(() => {
  const loadData = async () => {
    const promises = [];
    if (planId) promises.push(loadPlan());
    if (clientId) promises.push(loadClient());
    
    try {
      await Promise.all(promises); // Load in parallel
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  loadData();
}, [planId, clientId]);
```

This comprehensive data flow architecture ensures reliable, performant, and maintainable data management across the RicheAI planning system.