// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Login advisor
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Register advisor
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get advisor profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update advisor profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      return { success: true };
    } catch (error) {
      // Even if logout fails, remove token
      localStorage.removeItem('token');
      throw error.response?.data || error.message;
    }
  }
};

// Client API methods with enhanced CAS support
export const clientAPI = {
  // Get all clients
  getClients: async (params = {}) => {
    try {
      const response = await api.get('/clients/manage', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get client by ID
  getClientById: async (clientId) => {
    try {
      const response = await api.get(`/clients/manage/${clientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update client
  updateClient: async (clientId, clientData) => {
    try {
      const response = await api.put(`/clients/manage/${clientId}`, clientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete client
  deleteClient: async (clientId) => {
    try {
      const response = await api.delete(`/clients/manage/${clientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send client invitation
  sendInvitation: async (invitationData) => {
    try {
      const response = await api.post('/clients/manage/invitations', invitationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get client invitations
  getInvitations: async (params = {}) => {
    try {
      const response = await api.get('/clients/manage/invitations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============================================================================
  // PUBLIC ONBOARDING ROUTES (No authentication required)
  // ============================================================================

  // Get client onboarding form (public)
  getOnboardingForm: async (token) => {
    try {
      // Create a separate axios instance without auth for public routes
      const publicApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await publicApi.get(`/clients/onboarding/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Submit client onboarding form with CAS data (public)
  submitOnboardingForm: async (token, formData) => {
    try {
      // Create a separate axios instance without auth for public routes
      const publicApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📤 SUBMITTING ONBOARDING FORM:', {
        token,
        hasCasData: !!formData.casData,
        casStatus: formData.casData?.status,
        frontendProcessed: formData.casData?.frontendProcessed
      });
      
      const response = await publicApi.post(`/clients/onboarding/${token}`, formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============================================================================
  // CAS MANAGEMENT ROUTES (For existing clients)
  // ============================================================================

  // Upload CAS file for existing client
  uploadClientCAS: async (clientId, formData) => {
    try {
      const response = await api.post(`/clients/manage/${clientId}/cas/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Parse CAS file for existing client
  parseClientCAS: async (clientId) => {
    try {
      const response = await api.post(`/clients/manage/${clientId}/cas/parse`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get CAS data for client
  getClientCAS: async (clientId) => {
    try {
      const response = await api.get(`/clients/manage/${clientId}/cas`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete CAS data for client
  deleteClientCAS: async (clientId) => {
    try {
      const response = await api.delete(`/clients/manage/${clientId}/cas`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============================================================================
  // DEPRECATED ONBOARDING CAS ROUTES (Backend processing - kept for compatibility)
  // ============================================================================

  // Upload CAS during onboarding (Backend processing - DEPRECATED)
  uploadOnboardingCAS: async (token, formData) => {
    try {
      const publicApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const response = await publicApi.post(`/clients/onboarding/${token}/cas/upload`, formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Parse CAS during onboarding (Backend processing - DEPRECATED)
  parseOnboardingCAS: async (token) => {
    try {
      const publicApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await publicApi.post(`/clients/onboarding/${token}/cas/parse`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get CAS status during onboarding (Backend processing - DEPRECATED)
  getCASStatus: async (token) => {
    try {
      const publicApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await publicApi.get(`/clients/onboarding/${token}/cas/status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Admin API methods
export const adminAPI = {
  // Get all advisors
  getAdvisors: async () => {
    try {
      const response = await api.get('/admin/advisors', {
        headers: {
          'admin-token': 'admin-session-token' // Static admin token
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get advisor clients
  getAdvisorClients: async (advisorId) => {
    try {
      const response = await api.get(`/admin/advisors/${advisorId}/clients`, {
        headers: {
          'admin-token': 'admin-session-token'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/stats', {
        headers: {
          'admin-token': 'admin-session-token'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Utility functions
export const apiUtils = {
  // Check if API is healthy
  healthCheck: async () => {
    try {
      const response = await api.get('/clients/cas/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Test CAS parsing (development only)
  debugCASParse: async (formData) => {
    try {
      if (import.meta.env.MODE !== 'development') {
        throw new Error('Debug endpoints only available in development');
      }
      
      const response = await api.post('/clients/cas/debug/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Export default API instance
export default api;