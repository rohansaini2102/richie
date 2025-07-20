# RICHIEAT - Product Requirements Document (PRD)
## JavaScript + React (Vite) + Tailwind CSS Implementation

## 1. Executive Summary

### 1.1 Product Overview
RICHIEAT is a modern web-based platform for financial advisors to manage client relationships, built with React 19.1.0 (Vite 7.0), Tailwind CSS 4.1.11, and the MERN stack. The platform includes advisor registration, client onboarding, CAS file parsing, and comprehensive logging. Core features are implemented with a focus on SEBI compliance for Indian financial advisors.

### 1.2 Core Objectives
- Fast, responsive SPA using Vite 7.0 development environment
- Clean UI with Tailwind CSS 4.1.11 utility-first approach
- Comprehensive advisor-client relationship management
- CAS file parsing and financial data extraction
- Secure document handling with multiple PDF parser support
- SEBI compliance and regulatory adherence
- Enhanced logging and monitoring system

### 1.3 Target Audience
- **Primary:** SEBI-registered financial advisors in India
- **Secondary:** Clients seeking professional financial advisory

## 2. Technical Architecture

### 2.1 Frontend Stack
```javascript
// Frontend Technologies
- Build Tool: Vite 7.0.0
- Framework: React 19.1.0 (JavaScript)
- Styling: Tailwind CSS 4.1.11
- UI Components: Custom HTML elements with Tailwind CSS
- Routing: React Router v7.6.3
- State Management: Context API
- HTTP Client: Axios
- Form Handling: React Hook Form
- Icons: Lucide React
- PDF Handling: pdfjs-dist
- Notifications: React Hot Toast
```

### 2.2 Backend Stack
```javascript
// Backend Technologies
- Runtime: Node.js (Latest LTS)
- Framework: Express.js 5.1.0
- Database: MongoDB Atlas (Cloud)
- ODM: Mongoose 8.16.1
- Authentication: JWT + bcrypt
- File Upload: Multer (Local Storage)
- Email: Nodemailer with Gmail SMTP
- Validation: Express Validator + Joi
- Security: Helmet, Express Rate Limit, XSS protection
- PDF Processing: Multiple parsers (pdf-parse, pdf2json, pdfreader)
- Logging: Winston + Morgan
- Environment: dotenv
```

### 2.3 Development Setup
```bash
# Project Structure
richieat/
├── client/                    # React Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout components
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Helper functions
│   │   ├── services/        # API services
│   │   ├── context/         # Context providers
│   │   ├── assets/          # Images, fonts
│   │   └── styles/          # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                   # Node.js Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── server.js
└── package.json
```

### 2.4 Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### 2.5 Tailwind Configuration
```javascript
// tailwind.config.js - Current Basic Configuration
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 3. Component Architecture

### 3.1 Actual Components Structure
```javascript
// Current component hierarchy
src/components/
├── layout/
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   └── DashboardLayout.jsx
├── client/
│   ├── ClientCard.jsx
│   ├── ClientDetailView.jsx
│   ├── ClientList.jsx
│   └── ClientOnboardingForm.jsx
├── dashboard/
│   ├── MetricCard.jsx
│   └── ActionCard.jsx
├── modals/
│   └── AddClientModal.jsx
├── Dashboard.jsx
├── Login.jsx
├── Signup.jsx
├── AdvisorProfile.jsx
├── ClientsPage.jsx
├── AdminLogin.jsx
├── AdminDashboard.jsx
├── Home.jsx
└── ProtectedRoute.jsx
```

### 3.2 Component Implementation
```javascript
// Using standard HTML elements with Tailwind CSS
// Example: Dashboard Action Cards
const ActionCard = ({ icon: Icon, title, description, buttonText, onClick }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button 
        onClick={onClick}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        {buttonText}
      </button>
    </div>
  )
}
```

### 3.3 Styling Approach
```javascript
// Using Tailwind CSS classes directly
// Example: MetricCard Component
const MetricCard = ({ title, value, change, changeType }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              {/* Icon goes here */}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3.4 Actual Button Implementation
```javascript
// Standard HTML button elements with Tailwind CSS
// Example from AddClientModal.jsx
const buttonStyles = {
  primary: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
  secondary: "bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400",
  danger: "bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
}

// Usage in components
<button 
  type="submit"
  className={buttonStyles.primary}
  disabled={loading}
>
  {loading ? 'Loading...' : 'Send Invitation'}
</button>
```

## 4. Feature Implementation

### 4.1 Advisor Registration Module

#### 4.1.1 Registration Form Component
```javascript
// RegisterForm.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Input from '../common/Input'
import Button from '../common/Button'

const RegisterForm = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  
  const onSubmit = async (data) => {
    if (step === 1) {
      setStep(2)
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.post('/api/auth/register', data)
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register as Advisor
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-300'} text-white flex items-center justify-center`}>
                1
              </div>
              <div className={`h-1 w-24 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`} />
              <div className={`h-8 w-8 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'} text-white flex items-center justify-center`}>
                2
              </div>
            </div>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {step === 1 ? (
            <>
              <div className="space-y-4">
                <Input
                  label="First Name"
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  error={errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  type="text"
                  {...register('lastName')}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.email?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  error={errors.password?.message}
                />
              </div>
              
              <Button type="submit" className="w-full">
                Continue
              </Button>
              
              <div className="text-center">
                <span className="text-gray-600">or</span>
                <button
                  type="button"
                  className="mt-2 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <img className="h-5 w-5 mr-2" src="/google.svg" alt="Google" />
                  Sign up with Google
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <Input
                  label="PPM Name"
                  type="text"
                  {...register('ppmName', { required: 'PPM Name is required' })}
                  error={errors.ppmName?.message}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  {...register('phoneNumber', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter a valid 10-digit phone number'
                    }
                  })}
                  error={errors.phoneNumber?.message}
                />
                <Input
                  label="SEBI Registration Number"
                  type="text"
                  {...register('sebiRegNumber', { required: 'SEBI Registration is required' })}
                  error={errors.sebiRegNumber?.message}
                />
                <Input
                  label="PPB Number"
                  type="text"
                  {...register('ppbNumber', { required: 'PPB Number is required' })}
                  error={errors.ppbNumber?.message}
                />
                <Input
                  label="ARN Number"
                  type="text"
                  {...register('arnNumber', { required: 'ARN Number is required' })}
                  error={errors.arnNumber?.message}
                />
              </div>
              
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  Save and Proceed
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default RegisterForm
```

### 4.2 Dashboard Implementation

#### 4.2.1 Dashboard Layout
```javascript
// DashboardLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
```

#### 4.2.2 Dashboard Stats Component
```javascript
// DashboardStats.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { UserGroupIcon, DocumentTextIcon, CurrencyRupeeIcon, ClockIcon } from '@heroicons/react/24/outline'

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPlans: 0,
    monthlyRevenue: 0,
    pendingOnboardings: 0
  })
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/advisor/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }
  
  const statCards = [
    {
      name: 'Total Active Clients',
      value: stats.totalClients,
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Financial Plans',
      value: stats.totalPlans,
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-indigo-500'
    },
    {
      name: 'Pending Onboardings',
      value: stats.pendingOnboardings,
      icon: ClockIcon,
      color: 'bg-yellow-500'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DashboardStats
```

### 4.3 Client Management Module

#### 4.3.1 Client List Component
```javascript
// ClientList.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import Button from '../common/Button'
import AddClientModal from './AddClientModal'

const ClientList = () => {
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchClients()
  }, [])
  
  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients')
      setClients(response.data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredClients = clients.filter(client =>
    client.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your clients including their name, email, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => setShowAddModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Client
          </Button>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {client.personalInfo.firstName} {client.personalInfo.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.personalInfo.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            ${client.onboardingStatus === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : client.onboardingStatus === 'invited'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {client.onboardingStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchClients()
        }}
      />
    </div>
  )
}

export default ClientList
```

#### 4.3.2 Add Client Modal
```javascript
// AddClientModal.jsx
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Input from '../common/Input'
import Button from '../common/Button'

const AddClientModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await axios.post('/api/clients/invite', data)
      reset()
      onSuccess()
    } catch (error) {
      console.error('Failed to invite client:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      Add New Client
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Enter client details to send an onboarding invitation
                      </p>
                    </div>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                      <Input
                        label="Client Name"
                        type="text"
                        {...register('name', { required: 'Client name is required' })}
                        error={errors.name?.message}
                      />
                      
                      <Input
                        label="Client Email"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        error={errors.email?.message}
                      />
                      
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                          type="submit"
                          loading={loading}
                          className="w-full sm:ml-3 sm:w-auto"
                        >
                          Send Invitation
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={onClose}
                          className="mt-3 w-full sm:mt-0 sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default AddClientModal
```

## 5. CAS Parsing System

### 5.1 CAS Parser Implementation
```javascript
// backend/services/cas-parser/index.js
const CASParser = {
  // Supported formats: CDSL, NSDL, CAMS, Karvy
  supportedFormats: ['CDSL', 'NSDL', 'CAMS', 'KARVY'],
  
  async parseFile(filePath, password = null) {
    // Auto-detect format and parse accordingly
    const format = await this.detectFormat(filePath)
    const parser = this.getParser(format)
    return await parser.parse(filePath, password)
  },
  
  // Individual parsers for each format
  parsers: {
    cdsl: require('./parsers/cdsl-parser'),
    nsdl: require('./parsers/nsdl-parser'),
    cams: require('./parsers/cams-parser'),
    karvy: require('./parsers/karvy-parser')
  }
}
```

### 5.2 OnboardingCASController
```javascript
// Enhanced CAS handling during client onboarding
class OnboardingCASController {
  // Upload CAS file with structured logging
  static async uploadCAS(req, res) {
    const { token } = req.params
    const eventId = `EVT_${Date.now()}`
    
    try {
      const invitation = await ClientInvitation.findOne({ token })
      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invitation token'
        })
      }
      
      // Store file info temporarily in invitation
      invitation.casUploadData = {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        eventId
      }
      
      await invitation.save()
      
      casEventLogger.logEvent('CAS_ONBOARDING_UPLOAD_SUCCESS', {
        eventId,
        token,
        fileName: req.file.filename,
        fileSize: req.file.size
      })
      
      res.json({
        success: true,
        message: 'CAS file uploaded successfully',
        data: {
          fileName: req.file.filename,
          fileSize: req.file.size,
          uploadedAt: new Date(),
          eventId
        }
      })
    } catch (error) {
      casEventLogger.logError('CAS_ONBOARDING_UPLOAD_FAILED', error, { eventId, token })
      res.status(500).json({
        success: false,
        message: 'Failed to upload CAS file',
        error: error.message
      })
    }
  }
}
```

## 6. API Service Layer

### 6.1 Axios Configuration
```javascript
// frontend/src/services/api.js
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api' // Direct connection (no proxy)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### 6.2 API Service Methods (Actual Implementation)
```javascript
// frontend/src/services/api.js - Current API methods
const API = {
  // Authentication
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data)
  },
  
  // Client Management
  clients: {
    getAll: () => api.get('/clients/manage'),
    getById: (id) => api.get(`/clients/manage/${id}`),
    invite: (data) => api.post('/clients/manage/invitations', data),
    getInvitations: () => api.get('/clients/manage/invitations'),
    update: (id, data) => api.put(`/clients/manage/${id}`, data),
    delete: (id) => api.delete(`/clients/manage/${id}`)
  },
  
  // CAS Operations
  cas: {
    uploadOnboardingCAS: (token, formData) => 
      api.post(`/clients/onboarding/${token}/cas/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    parseOnboardingCAS: (token) => 
      api.post(`/clients/onboarding/${token}/cas/parse`),
    // New structured endpoints
    uploadStructuredCAS: (token, formData) => 
      api.post(`/clients/onboarding/${token}/cas/upload-structured`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    parseStructuredCAS: (token) => 
      api.post(`/clients/onboarding/${token}/cas/parse-structured`),
    getCASStatus: (token) => 
      api.get(`/clients/onboarding/${token}/cas/status`)
  },
  
  // Onboarding
  onboarding: {
    getForm: (token) => api.get(`/clients/onboarding/${token}`),
    submitForm: (token, data) => api.post(`/clients/onboarding/${token}`, data)
  }
}

export default API
```

## 6. State Management

### 6.1 Auth Context
```javascript
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await authService.getProfile()
        setUser(response.data)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }
  
  const login = async (credentials) => {
    const response = await authService.login(credentials)
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
    return response.data
  }
  
  const logout = async () => {
    await authService.logout()
    localStorage.removeItem('token')
    setUser(null)
  }
  
  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

## 7. Routing Configuration

### 7.1 App Routes
```javascript
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetails from './pages/ClientDetails'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

## 8. Backend Models

### 8.1 Actual Mongoose Schemas
```javascript
// models/Advisor.js - Current Implementation
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const advisorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  firmName: String,
  phoneNumber: String,
  sebiRegNumber: String,
  revenueModel: {
    type: String,
    enum: ['Fee-Only', 'Commission-Based', 'Fee + Commission', ''],
    default: ''
  },
  // Additional professional fields
  arnNumber: String,
  euinNumber: String,
  ppbNumber: String,
  educationalQualifications: [String],
  professionalExperience: Number,
  specializations: [String],
  businessAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  isEmailVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
})

// Enhanced middleware with logging
advisorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

advisorSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('Advisor', advisorSchema)
```

## 9. Testing Strategy

### 9.1 Unit Testing Setup
```javascript
// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../components/common/Button'

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  test('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

## 10. Deployment Configuration

### 10.1 Environment Variables (Current Implementation)
```bash
# .env.example - Actual Configuration
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload (Local Storage)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info
```

### 10.2 Docker Configuration
```dockerfile
# Dockerfile - Frontend
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 11. Performance Optimization

### 11.1 Code Splitting
```javascript
// Lazy loading routes
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clients = lazy(() => import('./pages/Clients'))

// In routes
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/clients" element={<Clients />} />
  </Routes>
</Suspense>
```

### 11.2 Image Optimization
```javascript
// Use next-gen image formats
<picture>
  <source srcSet="/logo.webp" type="image/webp" />
  <img src="/logo.png" alt="RICHIEAT Logo" className="h-8 w-auto" />
</picture>
```

## 12. Security Best Practices

### 12.1 Input Sanitization
```javascript
// Backend validation middleware
const { body, validationResult } = require('express-validator')

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/),
  body('firstName').trim().escape().notEmpty(),
  body('phoneNumber').matches(/^[0-9]{10}$/),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]
```

### 12.2 Rate Limiting
```javascript
// Rate limiting configuration
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
})

app.post('/api/auth/login', loginLimiter, loginController)
```

---

**Document Version:** 3.0  
**Technology Stack:** JavaScript + React 19.1.0 (Vite 7.0) + Tailwind CSS 4.1.11 + MERN  
**Last Updated:** 2025-01-20  
**Status:** 90% Complete - Core Features Implemented