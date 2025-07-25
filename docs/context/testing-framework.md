# Testing Framework Overview

## Backend Testing (Jest + Supertest)

### Test Configuration
- **Framework**: Jest v29.6.2
- **API Testing**: Supertest v6.3.3
- **Coverage**: Built-in Jest coverage
- **Mocking**: Jest mocking capabilities
- **Environment**: Test-specific configurations

### CAS Parser Test Suite
**File**: `backend/test-cas-parsing.js` - **450 lines**

#### Test Categories (6 Total)

##### 1. Parser Initialization
```javascript
// Tests parser creation and basic setup
- Parser constructor validation
- Supported types verification (CDSL, NSDL, CAMS, Karvy)
- Version and tracking ID generation
- Statistics retrieval
```

##### 2. PDF Reading Capabilities
```javascript
// Tests PDF processing functionality
- PDF Reader initialization
- Library compatibility (pdf-parse)
- Password protection support
- File validation checks
```

##### 3. CAS Type Detection
```javascript
// Tests format recognition with sample data
const testCases = [
  {
    name: 'CDSL Sample',
    text: 'CDSL Central Depository Services DP Name...',
    expected: 'CDSL'
  },
  {
    name: 'NSDL Sample',
    text: 'NSDL National Securities Depository...',
    expected: 'NSDL'
  },
  // Additional test cases for CAMS and unknown formats
];
```

##### 4. Sample Files Testing
```javascript
// Tests real CAS file processing
- Automatic sample file discovery
- Multi-format file testing
- Password attempt logic
- Performance measurement
- Data extraction validation
```

##### 5. Error Handling
```javascript
// Tests error scenarios
const errorTests = [
  {
    name: 'Non-existent file',
    action: () => parser.parseCASFile('/non/existent/file.pdf'),
    shouldFail: true
  },
  {
    name: 'Invalid file path',
    action: () => parser.parseCASFile(''),
    shouldFail: true
  }
];
```

##### 6. Performance Testing
```javascript
// Tests system performance
- Parser creation benchmarks (10 instances)
- Type detection speed (100 operations)
- Memory usage monitoring
- Response time analysis
```

#### Test Execution Methods

##### Run All Tests
```bash
node test-cas-parsing.js
# Comprehensive test suite with detailed reporting
```

##### Run Specific Tests
```bash
node test-cas-parsing.js init        # Parser initialization only
node test-cas-parsing.js pdf         # PDF reading capabilities
node test-cas-parsing.js detection   # Type detection tests
node test-cas-parsing.js files       # Sample file processing
node test-cas-parsing.js errors      # Error handling scenarios
node test-cas-parsing.js performance # Performance benchmarks
```

#### Test Reporting
```javascript
// Comprehensive test report generation
{
  totalTime: '1250ms',
  totalTests: 15,
  successCount: 14,
  failCount: 1,
  successRate: '93%',
  recommendations: [
    'Add sample CAS files to uploads/cas/ directory',
    'Test with password-protected files',
    'Monitor performance with larger files'
  ]
}
```

### OnboardingCAS Integration Tests
**File**: `backend/test-onboarding-cas.js`

#### Test Coverage
```javascript
// Integration test suite
1. Controller import validation
2. Static method existence verification
3. Logging functionality testing
4. Event ID generation testing
5. Error handling validation
```

#### Test Methods
```javascript
const methods = [
  'uploadCAS',           // File upload handling
  'parseCAS',           // CAS parsing logic
  'getCASStatus',       // Status tracking
  'completeOnboardingWithCAS'  // Final integration
];
```

### Authentication Middleware Tests
**File**: `backend/test-auth-middleware.js`

#### Test Scenarios
- JWT token validation
- Request ID generation
- User context injection
- Error handling and logging
- Performance impact assessment

## Frontend Testing (Vitest + Testing Library)

### Test Configuration
- **Framework**: Vitest v1.3.1
- **Testing Library**: @testing-library/react v15.0.0
- **User Events**: @testing-library/user-event v14.5.2
- **DOM Environment**: jsdom v24.0.0
- **Coverage**: Vitest built-in coverage

### Test Utilities
**File**: `frontend/src/test/test-utils.jsx`

#### Custom Render Function
```javascript
export const renderWithProviders = (ui, {
  user = null,
  token = 'mock-token',
  route = '/',
  ...renderOptions
} = {}) => {
  // Provides AuthContext, Router, and other providers
  // Enables isolated component testing
}
```

#### Mock Implementations

##### Mock AuthContext
```javascript
const MockAuthProvider = ({ children, user = null, token = 'mock-token' }) => {
  const mockContextValue = {
    user,
    token,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    isAuthenticated: true,
    register: vi.fn(),
    checkAuthStatus: vi.fn()
  }
}
```

##### Mock API Responses
```javascript
export const mockApiResponses = {
  submitOnboardingForm: vi.fn().mockResolvedValue({
    data: { success: true, clientId: 'test-client-id' }
  }),
  uploadCASFile: vi.fn().mockResolvedValue({
    data: { trackingId: 'test-tracking-id', status: 'uploaded' }
  })
}
```

##### Mock File Creation
```javascript
export const createMockFile = (name = 'test.pdf', size = 1024, type = 'application/pdf') => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}
```

#### Sample Test Data
```javascript
export const sampleFormData = {
  // Step 1 - Personal Info
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  // ... complete 7-step onboarding data structure
  // Covers all client onboarding scenarios
}
```

### Component Testing Patterns

#### Authentication Components
```javascript
// Login component testing
describe('Login Component', () => {
  test('renders login form', () => {
    renderWithProviders(<Login />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
  
  test('handles form submission', async () => {
    const mockLogin = vi.fn()
    renderWithProviders(<Login />, { 
      user: null,
      login: mockLogin 
    })
    // Form interaction and submission testing
  })
})
```

#### Client Management Testing
```javascript
// Client components testing
describe('ClientsPage', () => {
  test('displays client list', () => {
    const mockClients = [/* mock client data */]
    renderWithProviders(<ClientsPage />, { 
      user: mockAdvisor 
    })
    // Client list rendering and interaction testing
  })
})
```

#### Planning Interface Testing
```javascript
// Goal-based planning testing
describe('GoalBasedPlanningInterface', () => {
  test('renders planning wizard', () => {
    renderWithProviders(
      <GoalBasedPlanningInterface clientId="test-id" />
    )
    // Multi-step wizard testing
  })
  
  test('handles AI integration', async () => {
    // AI service integration testing
  })
})
```

## Test Data Management

### Sample Files for Testing
```
uploads/cas/  # Directory for sample CAS files
├── cdsl-sample.pdf
├── nsdl-sample.pdf
├── cams-sample.pdf
└── password-protected-sample.pdf
```

### Database Test Data
```javascript
// Test database seeds
const testAdvisor = {
  firstName: 'Test',
  lastName: 'Advisor',
  email: 'test@advisor.com',
  sebiRegNumber: 'INA123456789'
}

const testClient = {
  // Complete client test data structure
  // Covers all onboarding steps
}

const testInvitation = {
  advisor: testAdvisor._id,
  clientName: 'Test Client',
  clientEmail: 'test@client.com',
  token: 'test-token-123'
}
```

## Performance Testing

### CAS Parser Performance
```javascript
// Performance benchmarks
const performanceTests = {
  parserCreation: {
    iterations: 10,
    expectedTime: '<100ms total',
    measurement: 'creation time per instance'
  },
  typeDetection: {
    iterations: 100,
    expectedTime: '<1ms per detection',
    measurement: 'pattern matching speed'
  },
  fileParsing: {
    fileSize: 'up to 50MB',
    expectedTime: '<30s per file',
    measurement: 'end-to-end parsing time'
  }
}
```

### Load Testing Considerations
```javascript
// Areas for load testing
const loadTestScenarios = [
  'Concurrent user authentication',
  'Multiple CAS file uploads',
  'AI service integration under load',
  'Database query performance',
  'File upload and processing',
  'Real-time planning calculations'
]
```

## Continuous Integration

### Test Automation Scripts
```json
// package.json test scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:cas": "node test-cas-parsing.js",
    "test:integration": "node test-onboarding-cas.js"
  }
}
```

### Frontend Test Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Test Coverage Goals

### Backend Coverage Targets
- **Controllers**: 85% line coverage
- **Models**: 90% line coverage (validation logic)
- **Services**: 80% line coverage (complex business logic)
- **Utilities**: 95% line coverage (pure functions)
- **Middleware**: 90% line coverage (security critical)

### Frontend Coverage Targets
- **Components**: 75% line coverage
- **Utils**: 90% line coverage
- **Context**: 85% line coverage
- **Services**: 80% line coverage

## Quality Assurance

### Test Quality Metrics
- **Test Execution Time**: <5 minutes for full suite
- **Test Reliability**: >99% consistent results
- **Test Maintainability**: Regular test review and updates
- **Error Detection**: Comprehensive error scenario coverage

### Manual Testing Checklist
```javascript
const manualTestScenarios = [
  'End-to-end onboarding workflow',
  'CAS file upload with various formats',
  'Multi-browser compatibility testing',
  'Mobile responsiveness validation',
  'AI integration user experience',
  'Security vulnerability assessment',
  'Performance under realistic load',
  'Error handling user experience'
]
```

## Testing Best Practices

### Test Organization
- **Descriptive test names**: Clear test purpose
- **Grouped tests**: Related functionality together
- **Isolation**: Tests don't depend on each other
- **Cleanup**: Proper test cleanup and teardown

### Mock Strategy
- **External services**: Always mocked (AI, email)
- **Database**: Test database or in-memory
- **File system**: Mocked for unit tests
- **Network requests**: Intercepted and mocked

### Test Data Strategy
- **Factories**: Reusable test data generators
- **Fixtures**: Static test data files
- **Builders**: Fluent test data construction
- **Cleanup**: Automatic test data cleanup

## Future Testing Enhancements

### Planned Improvements
- **E2E Testing**: Playwright or Cypress integration
- **Visual Regression**: Screenshot comparison testing
- **API Testing**: Comprehensive API test suite
- **Security Testing**: Automated security scan integration
- **Performance Testing**: Automated performance benchmarks
- **Accessibility Testing**: Automated a11y testing

### Testing Infrastructure
- **CI/CD Integration**: Automated test runs
- **Test Reporting**: Detailed test result dashboards
- **Test Environment**: Dedicated testing environments
- **Test Data Management**: Automated test data seeding
- **Parallel Testing**: Faster test execution
- **Test Analytics**: Test performance and reliability metrics