# Financial Planning Flow

## Overview

This document outlines the complete flow from client onboarding completion to advanced financial planning. The flow leverages the comprehensive client data structure defined in `docs/data/client-data.json` to provide personalized financial planning services.

## Current State: Client Onboarding Complete

After client onboarding, the system has collected comprehensive data across 7 steps:

1. **Personal Information** - Basic demographics, contact info, PAN, marital status
2. **Income & Expenses** - Monthly income, expense breakdown, income type
3. **Retirement Planning** - Current age, retirement goals, existing corpus
4. **Investments & CAS** - Portfolio data (auto-extracted or manual), all investment types
5. **Debts & Liabilities** - All loan types with EMI details, interest rates
6. **Insurance Coverage** - Life, health, vehicle, other insurance details
7. **Goals & Risk Profile** - Financial goals, risk tolerance, investment capacity

## Financial Planning Flow

### Phase 1: Plan Creation Entry Point

**Location**: Client Detail View in Advisor Dashboard
**Trigger**: Advisor clicks on a specific client card to view client details

#### 1.1 Client Detail View Enhancement
- Display all collected client information in organized sections
- Add prominent **"Create Plan"** button in the header
- Show existing plans if any (with clickable history)

#### 1.2 Plan History Display
- If plans exist for the client, display them below the "Create Plan" button
- Each existing plan shows:
  - Plan type (Goal Based, Cash Flow, Hybrid)
  - Creation date
  - Status (Draft, Active, Completed)
  - Quick preview of key recommendations

### Phase 2: Planning Approach Selection

When "Create Plan" is clicked, a modal opens with three approach options:

#### 2.1 Planning Approach Modal
```
┌─────────────────────────────────────────────────────────────┐
│                    Choose Planning Approach                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   GOAL      │  │  CASH FLOW  │  │   HYBRID    │        │
│  │   BASED     │  │  PLANNING   │  │  APPROACH   │        │
│  │ PLANNING    │  │             │  │             │        │
│  │             │  │             │  │             │        │
│  │ [+ Choose]  │  │ [+ Choose]  │  │ [+ Choose]  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2 Approach Descriptions
- **Goal Based Planning**: Focus on specific life goals (retirement, education, home purchase)
- **Cash Flow Planning**: Optimize monthly cash flow, debt management, and systematic savings
- **Hybrid Approach**: Combination of both goal-based and cash flow strategies

### Phase 3: Planning Form Initialization

#### 3.1 Data Pre-population
For any chosen approach:
- Load all existing client data from onboarding
- Pre-populate forms with collected information
- Make ALL fields editable (ensuring data consistency)

#### 3.2 Data Synchronization Rule
**Critical**: Any edits made to client data during planning **automatically update** the client's master record. This ensures:
- Consistency across all views
- Up-to-date information for future plans
- Single source of truth for client data

### Phase 4: Approach-Specific Workflows

#### 4.1 Cash Flow Planning Flow
1. **Editable Client Data Review**
2. **Debt Management Analysis** (see cash-flow-planning.md)
3. **Advisor Recommendations Form**
4. **AI Recommendations Panel**
5. **Plan Generation & Review**

#### 4.2 Goal Based Planning Flow
1. **Editable Client Data Review**
2. **Goal Selection** (5 predefined + custom)
3. **Goal-Specific Forms** (see goal-based-planning.md)
4. **Investment Strategy Design**
5. **Plan Generation & Review**

#### 4.3 Hybrid Approach Flow
1. **Editable Client Data Review**
2. **Cash Flow Optimization**
3. **Goal Prioritization**
4. **Integrated Strategy Design**
5. **Plan Generation & Review**

### Phase 5: Plan Generation & Storage

#### 5.1 Plan Structure
```json
{
  "planId": "unique_id",
  "clientId": "client_id",
  "planType": "cash_flow|goal_based|hybrid",
  "createdDate": "ISO_date",
  "createdBy": "advisor_id",
  "status": "draft|active|completed",
  "clientDataSnapshot": "snapshot_of_client_data_at_plan_creation",
  "planDetails": {
    // Approach-specific plan details
  },
  "recommendations": {
    "advisor": {},
    "ai": {}
  },
  "reviewSchedule": {
    "frequency": "months",
    "nextReviewDate": "ISO_date"
  }
}
```

#### 5.2 Plan Storage
- Store plans in separate collection/table
- Maintain link to client record
- Enable plan versioning for updates
- Support plan comparison features

### Phase 6: Plan Management

#### 6.1 Plan Lifecycle
- **Draft**: Plan being created/edited
- **Active**: Approved and being followed
- **Completed**: Goal achieved or plan superseded
- **Archived**: Historical record

#### 6.2 Plan Review & Updates
- Scheduled reviews based on plan frequency
- Allow plan modifications while preserving history
- Track plan performance against targets
- Enable plan migration between approaches

## Key Integration Points

### 6.1 With Existing Client Data
- All 7 steps of onboarding data are available
- Calculated fields (surplus, ratios, net worth) are computed
- Smart defaults are applied based on client profile

### 6.2 With CAS Data
- If CAS was uploaded and parsed, investment data is automatically available
- Manual investment data is used as fallback
- Portfolio analysis feeds into planning recommendations

### 6.3 With Backend Systems
- Real-time data synchronization
- Plan storage and retrieval APIs
- Audit trail for all changes
- Backup and recovery mechanisms

## Implementation Phases

### Phase 1: UI Components
1. Enhance Client Detail View with "Create Plan" button
2. Create Planning Approach Selection Modal
3. Build editable client data forms

### Phase 2: Cash Flow Planning
1. Debt management calculations
2. Advisor recommendation forms
3. AI recommendation integration

### Phase 3: Goal Based Planning
1. Goal selection interface
2. Goal-specific forms (retirement, education, etc.)
3. Investment strategy calculators

### Phase 4: Backend Integration
1. Plan storage APIs
2. Data synchronization logic
3. Plan lifecycle management

### Phase 5: Advanced Features
1. Plan comparison tools
2. Performance tracking
3. Automated review reminders

## Success Metrics

- Time to create comprehensive financial plan: < 30 minutes
- Client data accuracy: 100% (through real-time sync)
- Plan completion rate: > 80%
- Client satisfaction with recommendations: > 4.5/5
- Advisor efficiency improvement: > 50%

## Next Steps

1. Review detailed approach documentation:
   - `cash-flow-planning.md`
   - `goal-based-planning.md`
2. Examine data mapping specifications: `data-mapping.md`
3. Review UI/UX specifications: `ui-wireframes.md`
4. Begin implementation with Phase 1 components