import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import AdvisorProfile from './components/AdvisorProfile'
import ClientsPage from './components/ClientsPage'
import ClientOnboardingForm from './components/client/ClientOnboardingForm'
import ClientDetailView from './components/client/ClientDetailView'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { MeetingsPage } from './components/meetings'
import LOESignaturePage from './components/loe/LOESignaturePage'
import ABTestingDashboard from './components/abTesting/ABTestingDashboard'
import PortfolioManagementDashboard from './components/portfolio/PortfolioManagementDashboard'
import Settings from './components/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />

          {/* Routes */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/client-onboarding/:token" element={<ClientOnboardingForm />} />
            <Route path="/loe/sign/:token" element={<LOESignaturePage />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<AdvisorProfile />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:clientId" element={<ClientDetailView />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/ab-testing" element={<ABTestingDashboard />} />
              <Route path="/portfolio-management" element={<PortfolioManagementDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
