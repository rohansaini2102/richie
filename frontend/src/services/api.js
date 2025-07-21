// frontend/src/services/api.js - Enhanced for 5-Stage Onboarding
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased timeout for large form submissions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request tracking for enhanced logging
    config.metadata = {
      startTime: new Date(),
      requestId: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Log API request start
    console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token,
      hasData: !!(config.data && Object.keys(config.data).length > 0),
      timestamp: config.metadata.startTime.toISOString()
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    
    // Log successful API response
    console.log(`✅ API Response [${response.config.metadata.requestId}]:`, {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      duration: `${duration}ms`,
      success: response.data?.success,
      hasData: !!(response.data?.data),
      timestamp: new Date().toISOString()
    });
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    
    // Enhanced error logging
    console.error(`❌ API Error [${error.config?.metadata?.requestId || 'UNKNOWN'}]:`, {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      duration: `${duration}ms`,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('advisor');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Enhanced Authentication API
export const authAPI = {
  // Advisor registration with enhanced data
  register: async (advisorData) => {
    console.log('📝 ADVISOR REGISTRATION:', {
      email: advisorData.email,
      hasAllFields: !!(advisorData.firstName && advisorData.lastName && advisorData.email && advisorData.password)
    });
    
    const response = await api.post('/auth/register', advisorData);
    return response.data;
  },

  // Advisor login
  login: async (credentials) => {
    console.log('🔐 ADVISOR LOGIN:', { email: credentials.email });
    
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('advisor', JSON.stringify(response.data.advisor));
      
      console.log('✅ LOGIN SUCCESS:', {
        advisorId: response.data.advisor.id,
        advisorName: `${response.data.advisor.firstName} ${response.data.advisor.lastName}`,
        firmName: response.data.advisor.firmName
      });
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local cleanup');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('advisor');
      console.log('🚪 ADVISOR LOGGED OUT');
    }
  },

  // Get advisor profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update advisor profile
  updateProfile: async (profileData) => {
    console.log('📝 PROFILE UPDATE:', { 
      fieldsBeingUpdated: Object.keys(profileData),
      advisorId: JSON.parse(localStorage.getItem('advisor') || '{}').id
    });
    
    const response = await api.put('/auth/profile', profileData);
    
    if (response.data.success) {
      // Update local storage with new profile data
      localStorage.setItem('advisor', JSON.stringify(response.data.advisor));
    }
    
    return response.data;
  }
};

// Enhanced Client Management API
export const clientAPI = {
  // Get all clients with enhanced filtering
  getClients: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      status: params.status || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });
    
    console.log('📋 FETCHING CLIENTS:', {
      ...params,
      queryString: queryParams.toString()
    });
    
    const response = await api.get(`/clients/manage?${queryParams}`);
    
    console.log('✅ CLIENTS FETCHED:', {
      clientCount: response.data.data?.clients?.length || 0,
      totalClients: response.data.data?.pagination?.totalClients || 0,
      page: response.data.data?.pagination?.currentPage || 1
    });
    
    return response.data;
  },

  // Get client by ID with enhanced data
  getClientById: async (clientId) => {
    console.log('👤 FETCHING CLIENT DETAILS:', { clientId });
    
    const response = await api.get(`/clients/manage/${clientId}`);
    
    console.log('✅ CLIENT DETAILS FETCHED:', {
      clientId,
      clientName: response.data.data?.firstName + ' ' + response.data.data?.lastName,
      completionPercentage: response.data.data?.completionPercentage,
      hasCasData: !!response.data.data?.portfolioSummary
    });
    
    return response.data;
  },

  // Get enhanced dashboard statistics
  getDashboardStats: async () => {
    console.log('📊 FETCHING DASHBOARD STATS');
    
    const response = await api.get('/clients/manage/dashboard/stats');
    
    console.log('✅ DASHBOARD STATS FETCHED:', {
      totalClients: response.data.data?.clientCounts?.total || 0,
      activeClients: response.data.data?.clientCounts?.active || 0,
      portfolioValue: response.data.data?.portfolioMetrics?.totalPortfolioValue || 0,
      avgCompletion: response.data.data?.completionMetrics?.averageCompletionRate || 0
    });
    
    return response.data;
  },

  // Get client financial summary
  getClientFinancialSummary: async (clientId) => {
    console.log('💰 FETCHING CLIENT FINANCIAL SUMMARY:', { clientId });
    
    const response = await api.get(`/clients/manage/${clientId}/financial-summary`);
    
    console.log('✅ FINANCIAL SUMMARY FETCHED:', {
      clientId,
      healthScore: response.data.data?.healthMetrics?.overallHealthScore,
      netWorth: response.data.data?.calculatedFinancials?.netWorth,
      portfolioValue: response.data.data?.portfolioSummary?.totalValue || 0
    });
    
    return response.data;
  },

  // Send client invitation with enhanced tracking
  sendInvitation: async (invitationData) => {
    console.log('📧 SENDING CLIENT INVITATION:', {
      clientEmail: invitationData.clientEmail,
      clientName: `${invitationData.clientFirstName} ${invitationData.clientLastName}`.trim(),
      hasNotes: !!invitationData.notes
    });
    
    const response = await api.post('/clients/manage/invitations', invitationData);
    
    console.log('✅ INVITATION SENT:', {
      invitationId: response.data.data?.invitationId,
      clientEmail: invitationData.clientEmail,
      expiresAt: response.data.data?.expiresAt,
      invitationCount: response.data.data?.invitationCount
    });
    
    return response.data;
  },

  // Get client invitations
  getInvitations: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });
    
    console.log('📨 FETCHING INVITATIONS:', params);
    
    const response = await api.get(`/clients/manage/invitations?${queryParams}`);
    
    console.log('✅ INVITATIONS FETCHED:', {
      invitationCount: response.data.data?.invitations?.length || 0,
      totalInvitations: response.data.data?.pagination?.totalInvitations || 0
    });
    
    return response.data;
  },

  // Update client
  updateClient: async (clientId, clientData) => {
    console.log('📝 UPDATING CLIENT:', {
      clientId,
      fieldsBeingUpdated: Object.keys(clientData)
    });
    
    const response = await api.put(`/clients/manage/${clientId}`, clientData);
    
    console.log('✅ CLIENT UPDATED:', {
      clientId,
      newCompletionPercentage: response.data.data?.completionPercentage
    });
    
    return response.data;
  },

  // Delete client
  deleteClient: async (clientId) => {
    console.log('🗑️ DELETING CLIENT:', { clientId });
    
    const response = await api.delete(`/clients/manage/${clientId}`);
    
    console.log('✅ CLIENT DELETED:', { clientId });
    
    return response.data;
  },

  // ============================================================================
  // ENHANCED 5-STAGE ONBOARDING API
  // ============================================================================

  // Get onboarding form by token
  getOnboardingForm: async (token) => {
    console.log('🔗 ACCESSING ONBOARDING FORM:', { 
      token: token.substring(0, 8) + '...', // Partial token for security
      timestamp: new Date().toISOString()
    });
    
    const response = await api.get(`/clients/onboarding/${token}`);
    
    console.log('✅ ONBOARDING FORM ACCESSED:', {
      advisorName: response.data.data?.advisor?.firstName + ' ' + response.data.data?.advisor?.lastName,
      clientEmail: response.data.data?.invitation?.clientEmail,
      expiresAt: response.data.data?.invitation?.expiresAt,
      totalStages: response.data.data?.formConfiguration?.totalStages || 5
    });
    
    return response.data;
  },

  // Submit enhanced 5-stage onboarding form
  submitOnboardingForm: async (token, formData) => {
    const submissionStart = new Date();
    
    console.log('📤 SUBMITTING ENHANCED ONBOARDING FORM:', {
      token: token.substring(0, 8) + '...',
      submissionStartTime: submissionStart.toISOString(),
      formStages: {
        personalInfo: !!(formData.firstName && formData.lastName),
        incomeEmployment: !!(formData.occupation && formData.annualIncome),
        financialGoals: !!(formData.retirementPlanning?.targetRetirementAge),
        assetsLiabilities: !!(formData.assets),
        investmentProfile: !!(formData.investmentExperience && formData.riskTolerance)
      },
      hasCasData: !!formData.casData,
      hasCustomGoals: !!(formData.customGoals?.length > 0),
      dataSize: JSON.stringify(formData).length
    });
    
    const response = await api.post(`/clients/onboarding/${token}`, formData);
    
    const submissionDuration = new Date() - submissionStart;
    
    console.log('🎉 ENHANCED ONBOARDING COMPLETED:', {
      token: token.substring(0, 8) + '...',
      clientId: response.data.data?.clientId,
      submissionDuration: `${submissionDuration}ms`,
      completionPercentage: response.data.data?.completionPercentage,
      hasCasData: response.data.data?.hasCasData,
      portfolioValue: response.data.data?.portfolioValue || 0,
      calculatedFinancials: response.data.data?.calculatedFinancials,
      summary: response.data.data?.summary
    });
    
    return response.data;
  },

  // Save form draft (NEW)
  saveFormDraft: async (token, stepNumber, stepData) => {
    console.log('💾 SAVING FORM DRAFT:', {
      token: token.substring(0, 8) + '...',
      stepNumber,
      hasData: !!stepData,
      dataKeys: stepData ? Object.keys(stepData) : []
    });
    
    const response = await api.post(`/clients/onboarding/${token}/draft`, {
      stepNumber,
      stepData
    });
    
    console.log('✅ DRAFT SAVED:', {
      stepNumber,
      savedAt: response.data.data?.savedAt
    });
    
    return response.data;
  },

  // Get form draft (NEW)
  getFormDraft: async (token, stepNumber = null) => {
    console.log('📖 LOADING FORM DRAFT:', {
      token: token.substring(0, 8) + '...',
      stepNumber
    });
    
    const url = stepNumber 
      ? `/clients/onboarding/${token}/draft?stepNumber=${stepNumber}`
      : `/clients/onboarding/${token}/draft`;
    
    const response = await api.get(url);
    
    console.log('✅ DRAFT LOADED:', {
      stepNumber,
      currentStep: response.data.data?.currentStep,
      lastSavedAt: response.data.data?.lastSavedAt,
      hasDraftData: !!response.data.data?.draftData
    });
    
    return response.data;
  },

  // ============================================================================
  // ENHANCED CAS MANAGEMENT API (keeping existing logic)
  // ============================================================================

  // Upload CAS file
  uploadCAS: async (clientId, file, password = '') => {
    const formData = new FormData();
    formData.append('casFile', file);
    if (password) {
      formData.append('casPassword', password);
    }
    
    console.log('📁 UPLOADING CAS FILE:', {
      clientId,
      fileName: file.name,
      fileSize: file.size,
      hasPassword: !!password
    });
    
    const response = await api.post(`/clients/manage/${clientId}/cas/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Extended timeout for file upload
    });
    
    console.log('✅ CAS FILE UPLOADED:', {
      clientId,
      fileName: response.data.data?.fileName,
      status: response.data.data?.status
    });
    
    return response.data;
  },

  // Parse CAS file
  parseCAS: async (clientId) => {
    console.log('🔍 PARSING CAS FILE:', { clientId });
    
    const response = await api.post(`/clients/manage/${clientId}/cas/parse`, {}, {
      timeout: 120000, // Extended timeout for parsing
    });
    
    console.log('✅ CAS FILE PARSED:', {
      clientId,
      totalValue: response.data.data?.totalValue,
      totalAccounts: response.data.data?.totalAccounts,
      totalMutualFunds: response.data.data?.totalMutualFunds
    });
    
    return response.data;
  },

  // Get CAS data
  getCASData: async (clientId) => {
    console.log('📊 FETCHING CAS DATA:', { clientId });
    
    const response = await api.get(`/clients/manage/${clientId}/cas`);
    
    console.log('✅ CAS DATA FETCHED:', {
      clientId,
      status: response.data.data?.status,
      hasData: !!response.data.data?.parsedData
    });
    
    return response.data;
  },

  // Delete CAS data
  deleteCAS: async (clientId) => {
    console.log('🗑️ DELETING CAS DATA:', { clientId });
    
    const response = await api.delete(`/clients/manage/${clientId}/cas`);
    
    console.log('✅ CAS DATA DELETED:', { clientId });
    
    return response.data;
  }
};

// Financial Planning API
export const planAPI = {
  // Create a new financial plan
  createPlan: async (planData) => {
    console.log('📋 CREATING FINANCIAL PLAN:', {
      clientId: planData.clientId,
      planType: planData.planType
    });
    
    const response = await api.post('/plans', planData);
    
    console.log('✅ PLAN CREATED:', {
      planId: response.data.plan._id,
      status: response.data.plan.status
    });
    
    return response.data;
  },

  // Get plan by ID
  getPlanById: async (planId) => {
    console.log('📋 FETCHING PLAN:', { planId });
    
    const response = await api.get(`/plans/${planId}`);
    
    console.log('✅ PLAN FETCHED:', {
      planId,
      planType: response.data.plan.planType,
      status: response.data.plan.status
    });
    
    return response.data;
  },

  // Update plan
  updatePlan: async (planId, updates) => {
    console.log('📝 UPDATING PLAN:', { planId });
    
    const response = await api.put(`/plans/${planId}`, updates);
    
    console.log('✅ PLAN UPDATED:', { planId });
    
    return response.data;
  },

  // Archive plan
  archivePlan: async (planId) => {
    console.log('📦 ARCHIVING PLAN:', { planId });
    
    const response = await api.delete(`/plans/${planId}`);
    
    console.log('✅ PLAN ARCHIVED:', { planId });
    
    return response.data;
  },

  // Get all plans for a client
  getClientPlans: async (clientId) => {
    console.log('📋 FETCHING CLIENT PLANS:', { clientId });
    
    const response = await api.get(`/plans/client/${clientId}`);
    
    console.log('✅ CLIENT PLANS FETCHED:', {
      clientId,
      planCount: response.data.plans.length
    });
    
    return response.data;
  },

  // Update plan status
  updatePlanStatus: async (planId, status) => {
    console.log('🔄 UPDATING PLAN STATUS:', { planId, status });
    
    const response = await api.patch(`/plans/${planId}/status`, { status });
    
    console.log('✅ PLAN STATUS UPDATED:', { planId, status });
    
    return response.data;
  },

  // Add review note
  addReviewNote: async (planId, reviewData) => {
    console.log('📝 ADDING REVIEW NOTE:', { planId });
    
    const response = await api.post(`/plans/${planId}/review`, reviewData);
    
    console.log('✅ REVIEW NOTE ADDED:', { planId });
    
    return response.data;
  },

  // Generate AI recommendations
  generateAIRecommendations: async (planId) => {
    console.log('🤖 GENERATING AI RECOMMENDATIONS:', { planId });
    
    const response = await api.post(`/plans/${planId}/ai-recommendations`);
    
    console.log('✅ AI RECOMMENDATIONS GENERATED:', { planId });
    
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (planId) => {
    console.log('📊 FETCHING PERFORMANCE METRICS:', { planId });
    
    const response = await api.get(`/plans/${planId}/performance`);
    
    console.log('✅ PERFORMANCE METRICS FETCHED:', { planId });
    
    return response.data;
  },

  // Clone plan
  clonePlan: async (planId, targetClientId = null) => {
    console.log('📑 CLONING PLAN:', { planId, targetClientId });
    
    const response = await api.post(`/plans/${planId}/clone`, { targetClientId });
    
    console.log('✅ PLAN CLONED:', {
      originalPlanId: planId,
      newPlanId: response.data.plan._id
    });
    
    return response.data;
  },

  // Export plan as PDF
  exportPlanAsPDF: async (planId) => {
    console.log('📄 EXPORTING PLAN AS PDF:', { planId });
    
    const response = await api.get(`/plans/${planId}/export/pdf`, {
      responseType: 'blob'
    });
    
    console.log('✅ PLAN PDF EXPORTED:', { planId });
    
    return response.data;
  },

  // AI-powered debt analysis
  analyzeDebt: async (clientId, clientData) => {
    console.log('🤖 ANALYZING DEBT STRATEGY:', { clientId });
    
    const response = await api.post(`/plans/analyze-debt/${clientId}`, {
      clientData
    });
    
    console.log('✅ DEBT ANALYSIS COMPLETED:', {
      clientId,
      debtsAnalyzed: response.data.analysis?.debtStrategy?.prioritizedDebts?.length || 0,
      totalSavings: response.data.analysis?.financialMetrics?.totalInterestSavings || 0
    });
    
    return response.data;
  },

  // Update debt strategy with advisor modifications
  updateDebtStrategy: async (planId, strategyData) => {
    console.log('💰 UPDATING DEBT STRATEGY:', { planId });
    
    const response = await api.put(`/plans/${planId}/debt-strategy`, strategyData);
    
    console.log('✅ DEBT STRATEGY UPDATED:', { planId });
    
    return response.data;
  },

  // Get debt recommendations for a plan
  getDebtRecommendations: async (planId) => {
    console.log('📊 FETCHING DEBT RECOMMENDATIONS:', { planId });
    
    const response = await api.get(`/plans/${planId}/debt-recommendations`);
    
    console.log('✅ DEBT RECOMMENDATIONS FETCHED:', { planId });
    
    return response.data;
  },

  // Analyze debt strategy using AI
  analyzeDebt: async (clientId, clientData = null) => {
    console.log('🤖 ANALYZING DEBT STRATEGY:', { clientId });
    
    const requestData = clientData ? { clientData } : {};
    const response = await api.post(`/plans/analyze-debt/${clientId}`, requestData);
    
    console.log('✅ DEBT ANALYSIS COMPLETED:', { clientId });
    
    return response.data;
  }
};

// Enhanced Admin API
export const adminAPI = {
  // Admin login (static credentials)
  login: async (credentials) => {
    console.log('🔐 ADMIN LOGIN ATTEMPT');
    
    // For demo purposes, using static admin credentials
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      const adminData = {
        success: true,
        token: 'admin-session-token',
        admin: {
          id: 'admin',
          username: 'admin',
          role: 'administrator'
        }
      };
      
      localStorage.setItem('adminToken', adminData.token);
      localStorage.setItem('admin', JSON.stringify(adminData.admin));
      
      console.log('✅ ADMIN LOGIN SUCCESS');
      return adminData;
    } else {
      throw new Error('Invalid admin credentials');
    }
  },

  // Admin logout
  logout: async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    console.log('🚪 ADMIN LOGGED OUT');
  },

  // Get all advisors
  getAllAdvisors: async () => {
    console.log('👥 FETCHING ALL ADVISORS');
    
    const response = await api.get('/admin/advisors', {
      headers: {
        'admin-token': localStorage.getItem('adminToken')
      }
    });
    
    console.log('✅ ADVISORS FETCHED:', {
      advisorCount: response.data.data?.length || 0
    });
    
    return response.data;
  },

  // Get advisor clients
  getAdvisorClients: async (advisorId) => {
    console.log('👤 FETCHING ADVISOR CLIENTS:', { advisorId });
    
    const response = await api.get(`/admin/advisors/${advisorId}/clients`, {
      headers: {
        'admin-token': localStorage.getItem('adminToken')
      }
    });
    
    console.log('✅ ADVISOR CLIENTS FETCHED:', {
      advisorId,
      clientCount: response.data.data?.length || 0
    });
    
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    console.log('📊 FETCHING ADMIN DASHBOARD STATS');
    
    const response = await api.get('/admin/dashboard/stats', {
      headers: {
        'admin-token': localStorage.getItem('adminToken')
      }
    });
    
    console.log('✅ ADMIN STATS FETCHED:', {
      totalAdvisors: response.data.data?.totalAdvisors || 0,
      totalClients: response.data.data?.totalClients || 0,
      clientsWithCAS: response.data.data?.clientsWithCAS || 0
    });
    
    return response.data;
  },

  // Get individual client details with comprehensive logging
  getAdvisorClientDetails: async (advisorId, clientId) => {
    const requestStart = Date.now();
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    console.log('🔍 FETCHING CLIENT DETAILS:', {
      requestId,
      advisorId,
      clientId,
      timestamp: new Date().toISOString(),
      adminToken: !!localStorage.getItem('adminToken')
    });
    
    try {
      const response = await api.get(`/admin/advisors/${advisorId}/clients/${clientId}`, {
        headers: {
          'admin-token': localStorage.getItem('adminToken')
        }
      });
      
      const duration = Date.now() - requestStart;
      const clientData = response.data.data;
      
      console.log('✅ CLIENT DETAILS FETCHED SUCCESSFULLY:', {
        requestId,
        duration: `${duration}ms`,
        clientId,
        clientName: `${clientData?.firstName} ${clientData?.lastName}`,
        email: clientData?.email,
        completionPercentage: clientData?.completionPercentage || 0,
        casStatus: clientData?.casData?.casStatus || 'not_uploaded',
        metadata: response.data.metadata
      });
      
      // Log data structure details
      console.log('📋 CLIENT DATA STRUCTURE:', {
        requestId,
        availableFields: Object.keys(clientData || {}),
        nestedDataPresent: {
          address: !!clientData?.address,
          assets: !!clientData?.assets,
          debts: !!clientData?.debtsAndLiabilities,
          goals: !!clientData?.financialGoals,
          casData: !!clientData?.casData,
          expenseBreakdown: !!clientData?.expenseBreakdown
        },
        dataSize: JSON.stringify(clientData || {}).length
      });
      
      // Log specific important fields
      if (clientData) {
        console.log('💰 CLIENT FINANCIAL SNAPSHOT:', {
          requestId,
          monthlyIncome: clientData.totalMonthlyIncome || 0,
          monthlyExpenses: clientData.totalMonthlyExpenses || 0,
          annualIncome: clientData.annualIncome || 0,
          hasAssets: !!(clientData.assets && Object.keys(clientData.assets).length > 0),
          hasDebts: !!(clientData.debtsAndLiabilities && Object.keys(clientData.debtsAndLiabilities).length > 0)
        });
      }
      
      return response.data;
      
    } catch (error) {
      const duration = Date.now() - requestStart;
      
      console.error('❌ CLIENT DETAILS FETCH ERROR:', {
        requestId,
        duration: `${duration}ms`,
        advisorId,
        clientId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      throw error;
    }
  }
};

// Health check API
export const healthAPI = {
  // Check system health
  checkHealth: async () => {
    console.log('🏥 CHECKING SYSTEM HEALTH');
    
    const response = await api.get('/clients/health');
    
    console.log('✅ HEALTH CHECK COMPLETED:', {
      systemOperational: response.data.success,
      features: response.data.data?.features,
      formStages: response.data.data?.formStages?.length || 0
    });
    
    return response.data;
  }
};

// Utility functions
export const apiUtils = {
  // Format currency for API responses
  formatCurrency: (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Format date for API responses
  formatDate: (date) => {
    if (!date) return 'Not provided';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Calculate percentage
  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Validate email
  isValidEmail: (email) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  },

  // Validate PAN number
  isValidPAN: (pan) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  },

  // Get completion status color
  getCompletionColor: (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  },

  // Get financial health color
  getHealthColor: (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }
};

// Export default API instance for custom requests
export default api;