import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'

// Mock AuthContext
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

  const AuthContext = React.createContext(mockContextValue)

  return (
    <AuthContext.Provider value={mockContextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom render function
export const renderWithProviders = (ui, {
  user = null,
  token = 'mock-token',
  route = '/',
  ...renderOptions
} = {}) => {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <MockAuthProvider user={user} token={token}>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    )
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// Mock API responses
export const mockApiResponses = {
  submitOnboardingForm: vi.fn().mockResolvedValue({
    data: { success: true, clientId: 'test-client-id' }
  }),
  uploadCASFile: vi.fn().mockResolvedValue({
    data: { trackingId: 'test-tracking-id', status: 'uploaded' }
  })
}

// Mock toast
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn()
}

// Mock file for testing
export const createMockFile = (name = 'test.pdf', size = 1024, type = 'application/pdf') => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Sample form data for testing
export const sampleFormData = {
  // Step 1 - Personal Info
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '9876543210',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  maritalStatus: 'single',
  
  // Step 2 - Income & Employment
  incomeType: 'salaried',
  monthlyIncome: '100000',
  employmentStatus: 'employed',
  profession: 'Software Engineer',
  
  // Step 3 - Retirement Planning
  currentAge: '33',
  retirementAge: '60',
  retirementCorpus: '10000000',
  
  // Step 4 - CAS & Investments
  hasExistingInvestments: 'yes',
  investmentTypes: ['mutual_funds', 'stocks'],
  
  // Step 5 - Debts & Liabilities
  hasDebts: 'no',
  
  // Step 6 - Insurance (Optional)
  hasLifeInsurance: 'yes',
  lifeInsuranceCoverage: '5000000',
  
  // Step 7 - Goals & Risk Profile
  emergencyFundPriority: 'high',
  investmentExperience: 'intermediate',
  riskTolerance: 'moderate',
  monthlyInvestmentCapacity: '50000',
  investmentHorizon: '5-10_years'
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'