# Frontend Architecture Overview

## Technology Stack
- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS 4.1.11 + Material-UI 7.2.0
- **State Management**: Context API (AuthContext)
- **Routing**: React Router v7.6.3
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **PDF Processing**: pdfjs-dist for client-side parsing
- **Testing**: Vitest with @testing-library/react

## Component Structure

### Layout Components
- **Header.jsx**: Navigation and user controls
- **Sidebar.jsx**: Main navigation menu
- **DashboardLayout.jsx**: Overall layout wrapper

### Authentication Components
- **Login.jsx**: Login form with password visibility toggle
- **Signup.jsx**: Multi-step registration form
- **ProtectedRoute.jsx**: Route protection wrapper

### Dashboard Components
- **Dashboard.jsx**: Main dashboard with metrics
- **MetricCard.jsx**: Statistics display cards
- **ActionCard.jsx**: Quick action buttons

### Client Management
- **ClientsPage.jsx**: Client list and management
- **ClientCard.jsx**: Individual client display
- **ClientDetailView.jsx**: Detailed client information
- **ClientOnboardingForm.jsx**: Multi-step onboarding
- **AddClientModal.jsx**: Client invitation modal

### Planning Components
- **PlanCreationModal.jsx**: Plan creation interface
- **GoalBasedPlanningInterface.jsx**: 657-line comprehensive planning component
  - Three-step wizard: Review Data → Select Goals → AI Planning
  - Data quality assessment
  - Goal selection and validation
  - Integration with Claude AI
- **ClientDataPreview.jsx**: Client data review component

### Hybrid Planning (frontend/src/components/planning/hybrid/)
- Advanced planning methodology
- Multiple planning approaches
- Integration with goal-based planning

## State Management

### AuthContext (frontend/src/context/AuthContext.jsx)
- User authentication state
- Login/logout functionality
- Token management
- Auto-logout on token expiry
- Loading states

## API Integration

### API Service (frontend/src/services/api.js)
- Axios configuration with interceptors
- Request/response interceptors for auth
- Error handling and token refresh
- Base URL configuration

### Endpoints
- `/auth/*` - Authentication operations
- `/clients/manage/*` - Client management
- `/clients/onboarding/*` - Onboarding process
- `/cas/*` - CAS file operations

## Styling Approach

### Tailwind CSS 4.1.11
- Utility-first CSS framework
- Custom component styling
- Responsive design patterns
- Dark mode support prepared

### Material-UI 7.2.0
- Enhanced UI components
- Form controls and validation
- Modal and dialog systems
- Icons and buttons

## Client-Side Features

### Frontend CAS Parser (frontend/src/utils/casParser.js)
- Browser-based PDF parsing using PDF.js
- CDSL format support
- Client-side data extraction
- No server upload required for parsing
- 672 lines of parsing logic

### Form Handling
- React Hook Form integration
- Comprehensive validation
- Multi-step form management
- Real-time validation feedback

## Testing Framework

### Test Utilities (frontend/src/test/test-utils.jsx)
- Custom render function with providers
- Mock AuthContext
- API response mocks
- Sample form data
- File creation utilities

### Testing Stack
- Vitest for test running
- @testing-library/react for component testing
- @testing-library/user-event for interactions
- jsdom for DOM simulation

## Build and Development

### Vite Configuration
- Fast development server
- Hot module replacement
- Optimized production builds
- CSS preprocessing
- Asset optimization

### Development Features
- TypeScript support ready
- ESLint configuration
- Prettier code formatting
- Git hooks for code quality

## Performance Considerations
- Code splitting prepared
- Lazy loading of components
- Optimized bundle sizes
- Image optimization ready
- Caching strategies implemented

## Security Features
- XSS protection in forms
- Input sanitization
- Secure token storage
- HTTPS preparation
- Content Security Policy ready