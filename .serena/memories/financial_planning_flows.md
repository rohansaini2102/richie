# Financial Planning Flows Documentation

## Documentation Overview
The `docs/flow/` directory contains comprehensive specifications for financial planning features:

### 1. Cash Flow Planning (`cash-flow-planning.md`)
**Approach**: Optimize monthly financial flow, debt management, and systematic savings
- **Prerequisites**: Monthly income/expenses, debt info, basic personal data
- **Workflow Steps**:
  1. Editable client data review (all fields live-editable)
  2. Debt management analysis with prioritization algorithms
  3. Advisor recommendation forms (emergency fund, investments, EMI strategies)
  4. AI recommendations panel (real-time analysis)
  5. Plan generation with validation rules

**Key Features**:
- EMI ratio validation (≤40% safe, >50% critical)
- Fixed expenditure ratio tracking (≤50% recommended)
- Debt prioritization by interest rates
- Real-time AI recommendations for debt restructuring
- Mutual fund investment recommendations with API integration

### 2. Goal Based Planning (`goal-based-planning.md`)
**Approach**: Achieve specific life goals through targeted financial strategies
- **Goal Types**: Retirement, Child Education, Marriage, Car Purchase, Custom Goals
- **Workflow Steps**:
  1. Editable client data review
  2. Goal selection (5 predefined + custom)
  3. Goal-specific detailed forms with calculations
  4. Multi-goal optimization and prioritization
  5. Implementation roadmap with phased approach

**Key Calculations**:
- Retirement corpus: Future value calculations with inflation
- Education costs: 10% annual inflation factored
- Goal prioritization matrix with timeline conflicts resolution
- SIP requirements using FV = PMT × [((1+r)^n-1)/r] formula

### 3. Data Mapping (`data-mapping.md`)
**Integration Specifications**: How onboarding data flows into planning forms
- **7-Step Onboarding Mapping**: Personal info → Income/Expenses → Retirement → CAS/Investments → Debts → Insurance → Goals/Risk
- **Real-time Sync Rules**: All planning form edits update client master record
- **Validation Framework**: EMI ratios, age validations, investment capacity limits
- **API Structure**: MongoDB schemas for financial plans with versioning

**Backend Requirements**:
- Plan lifecycle management (draft → active → completed → archived)
- Change history tracking with audit trails
- Performance metrics and milestone tracking
- Multi-plan version support

### 4. Financial Planning Flow (`financial-planning-flow.md`)
**Overall Process**: Complete flow from client onboarding to advanced planning
- **Entry Point**: Enhanced client detail view with "Create Plan" button
- **Approach Selection**: Modal with 3 options (Goal-based, Cash Flow, Hybrid)
- **Plan Management**: Storage, versioning, review scheduling
- **Success Metrics**: <30min plan creation, >80% completion rate, >4.5/5 satisfaction

**Integration Points**:
- CAS data auto-population if available
- Real-time data synchronization across views
- Plan comparison and performance tracking
- Automated review reminders

### 5. UI/UX Wireframes (`ui-wireframes.md`)
**Design Specifications**: Detailed interface designs with CSS specifications
- **Color Scheme**: Primary green (#16a34a), blue (#2563eb), responsive grays
- **Typography**: Inter font family, size hierarchy (12px-32px)
- **Component Library**: Cards, modals, forms, tables with hover states
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

**Key Interface Components**:
- Planning approach selection modal (3-card layout)
- Cash flow planning split-view (advisor left, AI right)
- Goal selection cards with status indicators
- Multi-goal prioritization table with phase planning
- Investment recommendation forms with fund search

## Implementation Priority
1. **Phase 1**: UI components and client detail enhancements
2. **Phase 2**: Cash flow planning implementation
3. **Phase 3**: Goal-based planning features
4. **Phase 4**: Backend integration and plan management
5. **Phase 5**: Advanced features (comparison, tracking, automation)

## Technical Integration Notes
- All forms support real-time editing with client data sync
- AI recommendations update dynamically as advisor makes changes
- MongoDB schemas support plan versioning and change tracking
- API endpoints handle plan lifecycle and performance monitoring