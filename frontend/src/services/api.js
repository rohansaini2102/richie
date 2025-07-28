// frontend/src/services/api.js - Enhanced for 5-Stage Onboarding
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

// Response parsing helper function
const parseApiResponse = (response, fallbackPath = null) => {
  // Handle different response structures consistently
  return response?.data?.plan || response?.plan || response?.data || response || null;
};

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
    console.group('🔄 [clientAPI] Fetching Client Details');
    console.log('📋 Request:', { 
      clientId, 
      endpoint: `/clients/manage/${clientId}`,
      timestamp: new Date().toISOString()
    });
    
    const response = await api.get(`/clients/manage/${clientId}`);
    
    console.log('📦 Raw API Response:', {
      status: response.status,
      hasData: !!response.data,
      responseStructure: {
        hasDataProperty: !!response.data.data,
        hasSuccessProperty: !!response.data.success,
        hasMetadataProperty: !!response.data.metadata,
        topLevelKeys: Object.keys(response.data || {})
      }
    });
    
    const extractedData = response.data.data || response.data;
    
    console.log('✅ CLIENT DETAILS EXTRACTED:', {
      clientId,
      hasExtractedData: !!extractedData,
      clientName: extractedData?.firstName + ' ' + extractedData?.lastName,
      completionPercentage: extractedData?.completionPercentage,
      hasCasData: !!extractedData?.portfolioSummary,
      extractedDataKeys: extractedData ? Object.keys(extractedData).slice(0, 15) : [],
      extractedDataSize: extractedData ? JSON.stringify(extractedData).length : 0
    });
    console.groupEnd();
    
    // Return only the client data object for consistency
    return extractedData;
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

  // Send client onboarding with meeting
  sendClientOnboardingWithMeeting: async (invitationData) => {
    console.log('🎯 SENDING CLIENT ONBOARDING WITH MEETING:', {
      clientEmail: invitationData.clientEmail,
      clientName: `${invitationData.clientFirstName} ${invitationData.clientLastName || ''}`.trim(),
      scheduledAt: invitationData.scheduledAt,
      hasNotes: !!invitationData.notes
    });
    
    const response = await api.post('/clients/manage/onboard-with-meeting', invitationData);
    
    console.log('✅ ONBOARDING WITH MEETING SENT:', {
      invitationId: response.data.data?.invitation?.id,
      meetingId: response.data.data?.meeting?.id,
      clientEmail: invitationData.clientEmail,
      scheduledAt: response.data.data?.meeting?.scheduledAt,
      onboardingUrl: response.data.data?.invitation?.onboardingUrl
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
    const planData = parseApiResponse(response);
    
    console.log('✅ PLAN FETCHED:', {
      planId,
      planType: planData?.plan?.planType || planData?.planType,
      status: planData?.plan?.status || planData?.status,
      hasData: !!planData
    });
    
    return planData;
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

  // Note: PDF export functionality moved to frontend using jsPDF
  // This method is deprecated - PDF generation now happens client-side in PlanHistory component

  // AI-powered debt analysis
  analyzeDebt: async (clientId, clientData) => {
    console.log('🤖 [API] ANALYZING DEBT STRATEGY:', { clientId });
    
    const requestPayload = { clientData };
    const requestUrl = `/plans/analyze-debt/${clientId}`;
    
    console.log('📤 [API] POST request details:', {
      url: requestUrl,
      payloadSize: JSON.stringify(requestPayload).length + ' chars',
      hasClientData: !!clientData,
      clientDataKeys: clientData ? Object.keys(clientData) : [],
      hasCalculatedFinancials: !!clientData?.calculatedFinancials,
      hasDebts: !!clientData?.debtsAndLiabilities,
      clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A'
    });
    
    const startTime = Date.now();
    
    try {
      const response = await api.post(requestUrl, requestPayload);
      const responseTime = Date.now() - startTime;
      
      console.log('📥 [API] POST response received:', {
        responseTime: responseTime + 'ms',
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        responseDataKeys: response.data ? Object.keys(response.data) : [],
        responseSize: response.data ? JSON.stringify(response.data).length + ' chars' : 0
      });
      
      console.log('✅ [API] DEBT ANALYSIS COMPLETED:', {
        clientId,
        success: response.data?.success,
        hasAnalysis: !!response.data?.analysis,
        debtsAnalyzed: response.data?.analysis?.debtStrategy?.prioritizedDebts?.length || 0,
        totalSavings: response.data?.analysis?.financialMetrics?.totalInterestSavings || 0,
        hasError: !!response.data?.error,
        errorMessage: response.data?.error
      });
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ [API] DEBT ANALYSIS FAILED:', {
        clientId,
        responseTime: responseTime + 'ms',
        errorType: error.constructor.name,
        errorMessage: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl,
        hasClientData: !!clientData
      });
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
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

  // Test AI service integration
  testAIService: async () => {
    console.log('🧪 [API] TESTING AI SERVICE INTEGRATION...');
    
    const startTime = Date.now();
    
    try {
      const response = await api.get('/plans/test-ai-service');
      const duration = Date.now() - startTime;
      
      console.log('✅ [API] AI SERVICE TEST COMPLETED:', {
        duration: duration + 'ms',
        success: response.data?.success,
        status: response.data?.recommendations?.status,
        endToEndWorking: response.data?.steps?.endToEndWorking
      });
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('❌ [API] AI SERVICE TEST FAILED:', {
        duration: duration + 'ms',
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      
      throw error;
    }
  },

  // AI-powered goal analysis for goal-based planning
  analyzeGoals: async (selectedGoals, clientData) => {
    console.log('🎯 [API] ANALYZING GOALS:', {
      goalsCount: selectedGoals?.length || 0,
      hasClientData: !!clientData,
      clientId: clientData?._id || 'unknown'
    });
    
    const requestPayload = { 
      selectedGoals: selectedGoals || [], 
      clientData: clientData || {} 
    };
    const requestUrl = '/plans/analyze-goals';
    
    console.log('📤 [API] POST request details:', {
      url: requestUrl,
      payloadSize: JSON.stringify(requestPayload).length + ' chars',
      selectedGoalsCount: selectedGoals?.length || 0,
      goalTypes: selectedGoals?.map(g => g.title || g.type) || [],
      hasClientData: !!clientData,
      clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A',
      hasFinancialGoals: !!clientData?.enhancedFinancialGoals,
      hasAssets: !!clientData?.assets,
      hasDebts: !!clientData?.debtsAndLiabilities
    });
    
    const startTime = Date.now();
    
    try {
      const response = await api.post(requestUrl, requestPayload);
      const duration = Date.now() - startTime;
      
      console.log('✅ [API] GOAL ANALYSIS COMPLETED:', {
        duration: duration + 'ms',
        success: response.data?.success,
        hasRecommendations: !!response.data?.recommendations,
        recommendationsType: typeof response.data?.recommendations,
        hasError: !!response.data?.error,
        errorMessage: response.data?.error
      });
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ [API] GOAL ANALYSIS FAILED:', {
        responseTime: responseTime + 'ms',
        errorType: error.constructor.name,
        errorMessage: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl,
        hasSelectedGoals: !!selectedGoals,
        hasClientData: !!clientData
      });
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
  },

  // Generate goal-based plan PDF report
  generateGoalPlanPDF: async (planId) => {
    console.log('📄 [API] Generating goal plan PDF:', { 
      planId,
      endpoint: `/plans/${planId}/pdf`,
      hasToken: !!localStorage.getItem('token')
    });
    
    const startTime = Date.now();
    
    try {
      console.log('📤 [API] Making PDF request to backend...');
      
      const response = await api.get(`/plans/${planId}/pdf`, {
        responseType: 'blob', // Important for PDF downloads
        headers: {
          'Accept': 'application/pdf'
        },
        timeout: 60000 // 60 second timeout for PDF generation
      });
      
      const duration = Date.now() - startTime;
      
      console.log('✅ [API] PDF generated successfully:', {
        planId,
        duration: duration + 'ms',
        pdfSize: response.data.size + ' bytes',
        contentType: response.headers['content-type'],
        responseStatus: response.status,
        responseHeaders: {
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'],
          contentDisposition: response.headers['content-disposition']
        }
      });
      
      return response.data; // This will be a Blob
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('❌ [API] PDF generation failed:', {
        planId,
        duration: duration + 'ms',
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: `/plans/${planId}/pdf`,
        hasAuthToken: !!localStorage.getItem('token'),
        errorCode: error.code,
        errorType: error.constructor.name
      });
      
      // Try to read error response if it's not a blob
      if (error.response?.data && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          console.error('❌ [API] PDF error response body:', errorText);
        } catch (blobError) {
          console.error('❌ [API] Could not read blob error response:', blobError);
        }
      }
      
      throw error;
    }
  },

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

// Meeting Management API
export const meetingAPI = {
  // Create a scheduled meeting
  createMeeting: async (meetingData) => {
    console.log('📅 CREATING MEETING:', {
      clientId: meetingData.clientId,
      scheduledAt: meetingData.scheduledAt,
      meetingType: meetingData.meetingType || 'scheduled'
    });
    
    const response = await api.post('/meetings/create', meetingData);
    
    console.log('✅ MEETING CREATED:', {
      meetingId: response.data.meeting?.id,
      roomUrl: response.data.meeting?.roomUrl,
      clientMeetingLink: response.data.meeting?.clientMeetingLink
    });
    
    return response.data;
  },

  // Create an instant meeting
  createInstantMeeting: async (clientId) => {
    console.log('⚡ CREATING INSTANT MEETING:', { clientId });
    
    const response = await api.post('/meetings/instant', { clientId });
    
    console.log('✅ INSTANT MEETING CREATED:', {
      meetingId: response.data.meeting?.id,
      roomUrl: response.data.meeting?.roomUrl,
      clientMeetingLink: response.data.meeting?.clientMeetingLink
    });
    
    return response.data;
  },

  // Get all meetings for the current advisor
  getAdvisorMeetings: async (params = {}) => {
    const queryParams = new URLSearchParams({
      limit: params.limit || 20,
      status: params.status || '',
      type: params.type || ''
    });
    
    console.log('📋 FETCHING ADVISOR MEETINGS:', params);
    
    const response = await api.get(`/meetings/advisor?${queryParams}`);
    
    console.log('✅ MEETINGS FETCHED:', {
      meetingCount: response.data.meetings?.length || 0
    });
    
    return response.data;
  },

  // Get meetings for a specific client
  getMeetingsByClient: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams({
      limit: params.limit || 20,
      status: params.status || ''
    });
    
    console.log('📋 FETCHING CLIENT MEETINGS:', { clientId, params });
    
    const response = await api.get(`/meetings/client/${clientId}?${queryParams}`);
    
    console.log('✅ CLIENT MEETINGS FETCHED:', {
      clientId,
      meetingCount: response.data.meetings?.length || 0
    });
    
    return response.data;
  },

  // Get a specific meeting by ID
  getMeetingById: async (meetingId) => {
    console.log('🔍 FETCHING MEETING:', { meetingId });
    
    const response = await api.get(`/meetings/${meetingId}`);
    
    console.log('✅ MEETING FETCHED:', {
      meetingId,
      status: response.data.meeting?.status,
      roomUrl: response.data.meeting?.roomUrl
    });
    
    return response.data;
  },

  // Update meeting status
  updateMeetingStatus: async (meetingId, status) => {
    console.log('🔄 UPDATING MEETING STATUS:', { meetingId, status });
    
    const response = await api.patch(`/meetings/${meetingId}/status`, { status });
    
    console.log('✅ MEETING STATUS UPDATED:', { meetingId, status });
    
    return response.data;
  },

  // Save transcript message (for real-time transcription)
  saveTranscriptMessage: async (transcriptData) => {
    console.log('📝 SAVING TRANSCRIPT MESSAGE:', {
      meetingId: transcriptData.meetingId,
      participantName: transcriptData.participantName,
      isFinal: transcriptData.isFinal
    });
    
    const response = await api.post('/meetings/transcript/message', transcriptData);
    
    console.log('✅ TRANSCRIPT MESSAGE SAVED:', {
      meetingId: transcriptData.meetingId
    });
    
    return response.data;
  },

  // Start transcription for a meeting
  startTranscription: async (meetingId, transcriptionData) => {
    console.log('🎙️ STARTING TRANSCRIPTION:', { meetingId, transcriptionData });
    
    const response = await api.post(`/meetings/${meetingId}/transcription/start`, transcriptionData);
    
    console.log('✅ TRANSCRIPTION STARTED:', {
      meetingId,
      status: response.data.transcript?.status
    });
    
    return response.data;
  },

  // Stop transcription for a meeting
  stopTranscription: async (meetingId, stoppedBy) => {
    console.log('🛑 STOPPING TRANSCRIPTION:', { meetingId, stoppedBy });
    
    const response = await api.post(`/meetings/${meetingId}/transcription/stop`, { stoppedBy });
    
    console.log('✅ TRANSCRIPTION STOPPED:', {
      meetingId,
      messageCount: response.data.transcript?.messageCount
    });
    
    return response.data;
  },

  // Get meeting transcript
  getMeetingTranscript: async (meetingId) => {
    console.log('📄 GETTING MEETING TRANSCRIPT:', { meetingId });
    
    const response = await api.get(`/meetings/${meetingId}/transcript`);
    
    console.log('✅ TRANSCRIPT RETRIEVED:', {
      meetingId,
      transcriptStatus: response.data.transcript?.status,
      messageCount: response.data.transcript?.realTimeMessages?.length || 0
    });
    
    return response.data;
  },

  // Generate AI summary for transcript
  generateTranscriptSummary: async (meetingId) => {
    console.log('🤖 GENERATING TRANSCRIPT SUMMARY:', { meetingId });
    
    const response = await api.post(`/meetings/${meetingId}/transcript/summary`);
    
    console.log('✅ SUMMARY GENERATED:', {
      meetingId,
      keyPointsCount: response.data.summary?.keyPoints?.length || 0,
      actionItemsCount: response.data.summary?.actionItems?.length || 0
    });
    
    return response.data;
  },

  // Recording management
  startRecording: async (meetingId, recordingOptions = {}) => {
    console.log('🎥 STARTING RECORDING:', { meetingId, recordingOptions });
    
    const response = await api.post(`/meetings/${meetingId}/recording/start`, recordingOptions);
    
    console.log('✅ RECORDING STARTED:', {
      meetingId,
      recordingId: response.data.recording?.id,
      status: response.data.recording?.status
    });
    
    return response.data;
  },

  stopRecording: async (meetingId, stoppedBy) => {
    console.log('🛑 STOPPING RECORDING:', { meetingId, stoppedBy });
    
    const response = await api.post(`/meetings/${meetingId}/recording/stop`, { stoppedBy });
    
    console.log('✅ RECORDING STOPPED:', {
      meetingId,
      status: response.data.recording?.status
    });
    
    return response.data;
  },

  // Check domain features
  checkDomainFeatures: async () => {
    console.log('🔍 CHECKING DOMAIN FEATURES');
    
    const response = await api.get('/meetings/features/check');
    
    console.log('✅ DOMAIN FEATURES:', {
      transcriptionEnabled: response.data.features?.transcription?.enabled,
      recordingEnabled: response.data.features?.recording?.enabled,
      requiresUpgrade: response.data.plan?.requiresUpgrade
    });
    
    return response.data;
  },

  // Check meeting service health
  checkMeetingHealth: async () => {
    console.log('🏥 CHECKING MEETING SERVICE HEALTH');
    
    const response = await api.get('/meetings/health/check');
    
    console.log('✅ MEETING HEALTH CHECK:', {
      status: response.data.status,
      dailyApiConfigured: response.data.dailyApiConfigured
    });
    
    return response.data;
  }
};

// Letter of Engagement (LOE) API
export const loeAPI = {
  // Send LOE for a meeting
  sendLOE: async (meetingId, customNotes = '') => {
    console.log('📄 SENDING LOE:', { meetingId, hasCustomNotes: !!customNotes });
    
    const response = await api.post('/loe/send', {
      meetingId,
      customNotes
    });
    
    console.log('✅ LOE SENT:', {
      loeId: response.data.data?.loeId,
      status: response.data.data?.status,
      clientAccessUrl: response.data.data?.clientAccessUrl
    });
    
    return response.data;
  },

  // Get LOE status for a meeting
  getMeetingLOEStatus: async (meetingId) => {
    const response = await api.get(`/loe/meeting/${meetingId}/status`);
    return response.data;
  },

  // Get all LOEs for advisor
  getAdvisorLOEs: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      status: params.status || ''
    });
    
    const response = await api.get(`/loe/advisor?${queryParams}`);
    return response.data;
  },

  // Get LOEs for a specific client (filter from advisor LOEs)
  getLOEsByClient: async (clientId) => {
    console.log('📋 FETCHING CLIENT LOEs:', { clientId });
    
    try {
      // Get all LOEs and filter by clientId on frontend
      // Since backend doesn't have client-specific endpoint yet
      const response = await api.get('/loe/advisor?limit=100');
      
      console.log('📊 LOE API Response:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        loesCount: response.data?.data?.loes?.length || 0,
        structure: response.data
      });
      
      if (response.data?.success && response.data?.data?.loes) {
        // Log first LOE to check structure
        if (response.data.data.loes.length > 0) {
          console.log('🔍 First LOE structure:', {
            loe: response.data.data.loes[0],
            clientIdField: response.data.data.loes[0].clientId,
            clientIdType: typeof response.data.data.loes[0].clientId
          });
        }
        
        const clientLOEs = response.data.data.loes.filter(loe => {
          // Handle null/undefined clientId
          if (!loe.clientId) {
            console.log('⚠️ LOE has no clientId:', { loeId: loe._id });
            return false;
          }
          
          const loeClientId = typeof loe.clientId === 'object' ? loe.clientId._id : loe.clientId;
          const matches = loeClientId === clientId;
          
          console.log('🔍 LOE Filter Check:', {
            loeId: loe._id,
            loeClientId,
            targetClientId: clientId,
            clientIdType: typeof loe.clientId,
            clientIdObject: loe.clientId,
            matches
          });
          
          return matches;
        });
        
        console.log('✅ CLIENT LOEs FILTERED:', {
          clientId,
          totalLOEs: response.data.data.loes.length,
          clientLOEs: clientLOEs.length,
          filteredLOEs: clientLOEs
        });
        
        return {
          success: true,
          data: {
            loes: clientLOEs,
            pagination: {
              total: clientLOEs.length,
              page: 1,
              pages: 1
            }
          }
        };
      }
      
      console.warn('⚠️ No LOE data found in response');
      return {
        success: false,
        data: { loes: [], pagination: { total: 0, page: 1, pages: 0 } }
      };
      
    } catch (error) {
      console.error('❌ Error fetching client LOEs:', error);
      return {
        success: false,
        data: { loes: [], pagination: { total: 0, page: 1, pages: 0 } }
      };
    }
  },

  // Public endpoints (no auth required)
  // View LOE by token
  viewLOE: async (token) => {
    console.log('👁️ VIEWING LOE:', { token });
    
    const response = await api.get(`/loe/view/${token}`);
    
    console.log('✅ LOE RETRIEVED:', {
      status: response.data.data?.status,
      isSigned: response.data.data?.isSigned
    });
    
    return response.data;
  },

  // Sign LOE
  signLOE: async (token, signature) => {
    console.log('✍️ SIGNING LOE:', { token, hasSignature: !!signature });
    
    const response = await api.post(`/loe/sign/${token}`, {
      signature
    });
    
    console.log('✅ LOE SIGNED:', {
      status: response.data.data?.status,
      signedAt: response.data.data?.signedAt
    });
    
    return response.data;
  }
};

// Export default API instance for custom requests
export default api;