# RicheAI - Code Structure Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Directory Structure](#directory-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Planning System Architecture](#planning-system-architecture)
- [Component Relationships](#component-relationships)
- [Data Flow](#data-flow)
- [API Structure](#api-structure)
- [File Naming Conventions](#file-naming-conventions)

## 🏗️ Project Overview

RicheAI is a comprehensive financial advisory platform built with:
- **Frontend**: React + Vite + Material-UI
- **Backend**: Node.js + Express + MongoDB
- **Architecture**: Modular, component-based design
- **State Management**: React Context + Custom Hooks

## 📂 Directory Structure

```
richeai-master/
├── 📁 backend/                          # Node.js Backend
│   ├── 📁 controllers/                  # Business logic controllers
│   ├── 📁 models/                       # MongoDB models
│   ├── 📁 routes/                       # API route definitions
│   ├── 📁 middleware/                   # Authentication, logging, etc.
│   ├── 📁 services/                     # External services (CAS parsing, etc.)
│   ├── 📁 utils/                        # Utility functions
│   ├── 📁 validators/                   # Request validation
│   └── 📁 uploads/                      # File uploads (CAS, KYC)
│
├── 📁 frontend/                         # React Frontend
│   ├── 📁 src/                          
│   │   ├── 📁 components/               # React components
│   │   │   ├── 📁 client/               # Client management
│   │   │   ├── 📁 planning/             # Financial planning system
│   │   │   ├── 📁 dashboard/            # Dashboard components
│   │   │   ├── 📁 layout/               # Layout components
│   │   │   └── 📁 shared/               # Shared utilities
│   │   ├── 📁 contexts/                 # React Context providers
│   │   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── 📁 services/                 # API services
│   │   └── 📁 utils/                    # Frontend utilities
│   └── 📁 public/                       # Static assets
│
└── 📁 docs/                             # Documentation
    ├── 📁 structure/                    # Code structure docs
    ├── 📁 flow/                         # Process flow documentation
    └── 📁 architecture/                 # System architecture
```

## 🎯 Frontend Architecture

### Component Organization
```
frontend/src/components/
├── 📁 planning/                         # Financial Planning System
│   ├── PlanCreationModal.jsx           # Plan creation wizard
│   ├── CashFlowPlanning.jsx           # Legacy main planning component
│   ├── PlanHistory.jsx                # Plan history listing
│   │
│   ├── 📁 cashflow/                    # Modular Cash Flow Components
│   │   ├── ClientDataPreview.jsx      # Client data review interface
│   │   ├── DebtManagement.jsx         # Debt analysis & prioritization
│   │   ├── EmergencyFund.jsx          # Emergency fund planning
│   │   ├── InvestmentStrategy.jsx     # Investment recommendations
│   │   ├── CashFlowMetrics.jsx        # Financial metrics dashboard
│   │   ├── ActionItems.jsx            # Action items management
│   │   ├── index.js                   # Module exports
│   │   └── 📁 utils/                  # Calculation utilities
│   │       ├── calculations.js        # Financial calculations
│   │       └── formatters.js          # Data formatting
│   │
│   └── 📁 shared/                      # Reusable Planning Components
│       ├── MetricCard.jsx             # Metric display cards
│       ├── EditableField.jsx          # Inline editing
│       ├── ProgressIndicator.jsx      # Progress tracking
│       └── DataSection.jsx            # Collapsible sections
│
├── 📁 client/                          # Client Management
│   ├── ClientDetailView.jsx           # Main client details page
│   ├── ClientOnboardingForm.jsx       # 5-stage onboarding
│   ├── ClientCard.jsx                 # Client summary cards
│   └── 📁 steps/                      # Onboarding steps
│
├── 📁 dashboard/                       # Dashboard Components
├── 📁 layout/                          # Layout Components
└── 📁 modals/                          # Modal Components
```

### State Management Architecture
```
frontend/src/
├── 📁 contexts/                        # React Context Providers
│   └── PlanningContext.jsx            # Planning state management
│
└── 📁 hooks/                           # Custom Hooks
    ├── usePlanData.js                 # Plan & client data management
    ├── useCalculations.js             # Memoized calculations
    └── useValidation.js               # Form validation
```

## ⚙️ Backend Architecture

### API Structure
```
backend/
├── 📁 controllers/                     # Business Logic
│   ├── planController.js             # Financial plan operations
│   ├── clientController.js           # Client management
│   ├── adminController.js            # Admin operations
│   └── OnboardingCASController.js    # CAS parsing
│
├── 📁 models/                          # Database Models
│   ├── FinancialPlan.js              # Plan schema with cash flow details
│   ├── Client.js                     # Client data schema
│   └── Advisor.js                    # Advisor information
│
├── 📁 routes/                          # API Routes
│   ├── plans.js                      # /api/plans/* endpoints
│   ├── clients.js                    # /api/clients/* endpoints
│   └── admin.js                      # /api/admin/* endpoints
│
├── 📁 middleware/                      # Request Middleware
│   ├── auth.js                       # JWT authentication
│   ├── requestLogger.js              # API logging
│   └── performanceLogger.js          # Performance tracking
│
├── 📁 services/                        # External Services
│   └── 📁 cas-parser/                # CAS parsing service
│       ├── index.js                  # Main parser
│       └── 📁 parsers/               # Format-specific parsers
│
└── 📁 validators/                      # Input Validation
    └── planValidators.js             # Plan validation rules
```

## 🔄 Planning System Architecture

### New Modular System (Current Implementation)
```
Planning Flow:
┌─────────────────────────────────────────────────────────────┐
│                    PlanCreationModal                        │
│  Step 1: Plan Type Selection                               │
│  Step 2: ClientDataPreview ──► Structured Data Display     │
│  Step 3: Plan Creation                                     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Modular Components                          │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ DebtManagement  │  │ EmergencyFund   │                 │
│  │ - Prioritization│  │ - 6-month target│                 │
│  │ - EMI analysis  │  │ - Progress track│                 │
│  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │InvestmentStrategy│  │CashFlowMetrics  │                 │
│  │ - Asset allocation│ │ - Health score  │                 │
│  │ - Fund recommend │  │ - Key ratios    │                 │
│  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐                                      │
│  │  ActionItems    │                                      │
│  │ - Auto-generated│                                      │
│  │ - Priority-based│                                      │
│  └─────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Communication
```
Data Flow:
ClientDetailView
       │
       ▼
PlanCreationModal ──► ClientDataPreview
       │                     │
       ▼                     ▼
   PlanAPI.createPlan    Display JSON + Formatted Data
       │
       ▼
Individual Components ◄─── PlanningContext ◄─── Custom Hooks
│                                │                    │
├─ DebtManagement               │                useCalculations
├─ EmergencyFund               │                usePlanData  
├─ InvestmentStrategy          │                useValidation
├─ CashFlowMetrics             │
└─ ActionItems                  │
                               ▼
                        State Management
                        - Client data
                        - Plan data
                        - UI state
                        - Calculations cache
```

## 📊 Data Flow Architecture

### Client Data Processing
```
Client Onboarding → Data Validation → Storage → Plan Creation
                                         │
                                         ▼
                              ClientDataPreview
                                         │
                                         ▼
                              JSON Display + Analysis
                                         │
                                         ▼
                              Financial Calculations
                                         │
                                         ▼
                              Component-Specific Data
```

### Plan Data Management
```
Plan Creation:
User Input → Validation → API Call → Database → Response → UI Update

Plan Updates:
Component Change → Context Update → API Sync → Database → State Sync
```

## 🔌 API Structure

### Current Endpoints
```
/api/plans/
├── POST   /                           # Create new plan
├── GET    /:planId                    # Get plan by ID
├── PUT    /:planId                    # Update plan
├── DELETE /:planId                    # Archive plan
├── GET    /client/:clientId           # Get client's plans
├── POST   /:planId/ai-recommendations # Generate AI recommendations
└── GET    /:planId/performance        # Get performance metrics

/api/clients/
├── GET    /manage                     # Get all clients
├── GET    /manage/:clientId           # Get client details
├── PUT    /manage/:clientId           # Update client
└── POST   /onboarding/:token          # Submit onboarding form
```

### Data Models

#### FinancialPlan Model
```javascript
{
  clientId: ObjectId,
  advisorId: ObjectId,
  planType: 'cash_flow' | 'goal_based' | 'hybrid',
  status: 'draft' | 'active' | 'completed' | 'archived',
  
  clientDataSnapshot: {
    personalInfo: { ... },
    financialInfo: { ... },
    investments: { ... },
    debtsAndLiabilities: { ... },
    calculatedMetrics: { ... }
  },
  
  planDetails: {
    cashFlowPlan: {
      debtManagement: { ... },
      emergencyFundStrategy: { ... },
      investmentRecommendations: { ... },
      cashFlowMetrics: { ... },
      actionItems: [ ... ]
    }
  }
}
```

## 📝 File Naming Conventions

### Components
- **PascalCase**: `ComponentName.jsx`
- **Descriptive names**: `ClientDataPreview.jsx`, `DebtManagement.jsx`
- **Feature-based grouping**: `/cashflow/`, `/shared/`

### Utilities
- **camelCase**: `calculations.js`, `formatters.js`
- **Purpose-based naming**: `useCalculations.js`, `usePlanData.js`

### Directories
- **kebab-case**: `cash-flow/`, `debt-management/`
- **Feature grouping**: Related components together
- **Logical hierarchy**: Shared components at appropriate levels

## 🔧 Key Features Implemented

### 1. Modular Architecture ✅
- **Single Responsibility**: Each component handles one specific feature
- **Reusable Components**: Shared utilities across modules
- **Clean Separation**: UI, logic, and data concerns separated

### 2. Performance Optimizations ✅
- **Memoized Calculations**: Expensive calculations cached
- **Context-based State**: Prevents prop drilling
- **Lazy Loading**: Components loaded on demand

### 3. Developer Experience ✅
- **Clear File Structure**: Intuitive organization
- **Comprehensive Hooks**: Reusable logic patterns
- **Error Boundaries**: Proper error handling
- **TypeScript-ready**: Structured for easy TS migration

### 4. User Experience ✅
- **Progressive Disclosure**: Step-by-step data review
- **Visual Feedback**: Progress indicators and status
- **Error Prevention**: Input validation and warnings
- **Responsive Design**: Works across device sizes

## 🚀 Future Extensibility

The current architecture supports:
- **New Plan Types**: Goal-based, Hybrid planning
- **Additional Components**: Easy to add new modules
- **External Integrations**: APIs, data sources
- **Advanced Features**: Real-time collaboration, AI enhancements
- **Scaling**: Component-based architecture scales well

## 📈 Metrics & Analytics

Components include built-in analytics for:
- **Performance Tracking**: Component render times
- **User Interactions**: Button clicks, form submissions
- **Error Monitoring**: Component error boundaries
- **Data Completeness**: Client profile completion rates

This modular architecture ensures maintainability, scalability, and developer productivity while delivering a superior user experience for financial advisors and their clients.