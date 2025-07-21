import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { planAPI, clientAPI } from '../services/api';

// Initial state
const initialState = {
  // Client data
  clientData: null,
  clientLoading: false,
  clientError: null,
  
  // Plan data
  planData: null,
  planLoading: false,
  planError: null,
  
  // UI state
  activeSection: 'overview',
  editMode: false,
  saving: false,
  
  // Calculated metrics (cached for performance)
  calculatedMetrics: null,
  lastCalculated: null,
  
  // Action items
  actionItems: [],
  
  // Form state for edits
  formData: {}
};

// Action types
const ACTIONS = {
  // Client data actions
  SET_CLIENT_LOADING: 'SET_CLIENT_LOADING',
  SET_CLIENT_DATA: 'SET_CLIENT_DATA',
  SET_CLIENT_ERROR: 'SET_CLIENT_ERROR',
  
  // Plan data actions
  SET_PLAN_LOADING: 'SET_PLAN_LOADING',
  SET_PLAN_DATA: 'SET_PLAN_DATA',
  SET_PLAN_ERROR: 'SET_PLAN_ERROR',
  UPDATE_PLAN_SECTION: 'UPDATE_PLAN_SECTION',
  
  // UI actions
  SET_ACTIVE_SECTION: 'SET_ACTIVE_SECTION',
  SET_EDIT_MODE: 'SET_EDIT_MODE',
  SET_SAVING: 'SET_SAVING',
  
  // Metrics actions
  SET_CALCULATED_METRICS: 'SET_CALCULATED_METRICS',
  
  // Action items
  SET_ACTION_ITEMS: 'SET_ACTION_ITEMS',
  UPDATE_ACTION_ITEM: 'UPDATE_ACTION_ITEM',
  
  // Form data
  SET_FORM_DATA: 'SET_FORM_DATA',
  RESET_FORM_DATA: 'RESET_FORM_DATA'
};

// Reducer function
const planningReducer = (state, action) => {
  switch (action.type) {
    // Client data actions
    case ACTIONS.SET_CLIENT_LOADING:
      return { ...state, clientLoading: action.payload, clientError: null };
    
    case ACTIONS.SET_CLIENT_DATA:
      return { 
        ...state, 
        clientData: action.payload, 
        clientLoading: false, 
        clientError: null,
        // Clear cached metrics when client data changes
        calculatedMetrics: null,
        lastCalculated: null
      };
    
    case ACTIONS.SET_CLIENT_ERROR:
      return { ...state, clientError: action.payload, clientLoading: false };
    
    // Plan data actions
    case ACTIONS.SET_PLAN_LOADING:
      return { ...state, planLoading: action.payload, planError: null };
    
    case ACTIONS.SET_PLAN_DATA:
      return { 
        ...state, 
        planData: action.payload, 
        planLoading: false, 
        planError: null 
      };
    
    case ACTIONS.SET_PLAN_ERROR:
      return { ...state, planError: action.payload, planLoading: false };
    
    case ACTIONS.UPDATE_PLAN_SECTION:
      return {
        ...state,
        planData: {
          ...state.planData,
          planDetails: {
            ...state.planData.planDetails,
            [action.section]: {
              ...state.planData.planDetails[action.section],
              ...action.payload
            }
          }
        }
      };
    
    // UI actions
    case ACTIONS.SET_ACTIVE_SECTION:
      return { ...state, activeSection: action.payload };
    
    case ACTIONS.SET_EDIT_MODE:
      return { ...state, editMode: action.payload };
    
    case ACTIONS.SET_SAVING:
      return { ...state, saving: action.payload };
    
    // Metrics actions
    case ACTIONS.SET_CALCULATED_METRICS:
      return { 
        ...state, 
        calculatedMetrics: action.payload, 
        lastCalculated: new Date() 
      };
    
    // Action items
    case ACTIONS.SET_ACTION_ITEMS:
      return { ...state, actionItems: action.payload };
    
    case ACTIONS.UPDATE_ACTION_ITEM:
      return {
        ...state,
        actionItems: state.actionItems.map(item =>
          item.id === action.itemId ? { ...item, ...action.updates } : item
        )
      };
    
    // Form data
    case ACTIONS.SET_FORM_DATA:
      return { 
        ...state, 
        formData: { ...state.formData, ...action.payload } 
      };
    
    case ACTIONS.RESET_FORM_DATA:
      return { ...state, formData: {} };
    
    default:
      return state;
  }
};

// Create context
const PlanningContext = createContext();

// Context provider component
export const PlanningProvider = ({ children }) => {
  const [state, dispatch] = useReducer(planningReducer, initialState);

  // Action creators
  const actions = {
    // Client data actions
    setClientLoading: (loading) => 
      dispatch({ type: ACTIONS.SET_CLIENT_LOADING, payload: loading }),
    
    setClientData: (data) => 
      dispatch({ type: ACTIONS.SET_CLIENT_DATA, payload: data }),
    
    setClientError: (error) => 
      dispatch({ type: ACTIONS.SET_CLIENT_ERROR, payload: error }),
    
    // Plan data actions
    setPlanLoading: (loading) => 
      dispatch({ type: ACTIONS.SET_PLAN_LOADING, payload: loading }),
    
    setPlanData: (data) => 
      dispatch({ type: ACTIONS.SET_PLAN_DATA, payload: data }),
    
    setPlanError: (error) => 
      dispatch({ type: ACTIONS.SET_PLAN_ERROR, payload: error }),
    
    updatePlanSection: (section, updates) => 
      dispatch({ type: ACTIONS.UPDATE_PLAN_SECTION, section, payload: updates }),
    
    // UI actions
    setActiveSection: (section) => 
      dispatch({ type: ACTIONS.SET_ACTIVE_SECTION, payload: section }),
    
    setEditMode: (editMode) => 
      dispatch({ type: ACTIONS.SET_EDIT_MODE, payload: editMode }),
    
    setSaving: (saving) => 
      dispatch({ type: ACTIONS.SET_SAVING, payload: saving }),
    
    // Metrics actions
    setCalculatedMetrics: (metrics) => 
      dispatch({ type: ACTIONS.SET_CALCULATED_METRICS, payload: metrics }),
    
    // Action items
    setActionItems: (items) => 
      dispatch({ type: ACTIONS.SET_ACTION_ITEMS, payload: items }),
    
    updateActionItem: (itemId, updates) => 
      dispatch({ type: ACTIONS.UPDATE_ACTION_ITEM, itemId, updates }),
    
    // Form data
    setFormData: (data) => 
      dispatch({ type: ACTIONS.SET_FORM_DATA, payload: data }),
    
    resetFormData: () => 
      dispatch({ type: ACTIONS.RESET_FORM_DATA })
  };

  // API functions
  const api = {
    // Load client data
    loadClientData: async (clientId) => {
      try {
        actions.setClientLoading(true);
        const response = await clientAPI.getClientById(clientId);
        actions.setClientData(response.data);
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to load client data';
        actions.setClientError(errorMessage);
        throw error;
      }
    },

    // Load plan data
    loadPlanData: async (planId) => {
      try {
        actions.setPlanLoading(true);
        const response = await planAPI.getPlanById(planId);
        actions.setPlanData(response.plan);
        return response.plan;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to load plan data';
        actions.setPlanError(errorMessage);
        throw error;
      }
    },

    // Update plan
    updatePlan: async (planId, updates) => {
      try {
        actions.setSaving(true);
        const response = await planAPI.updatePlan(planId, updates);
        actions.setPlanData(response.plan);
        return response.plan;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to update plan';
        actions.setPlanError(errorMessage);
        throw error;
      } finally {
        actions.setSaving(false);
      }
    },

    // Update specific plan section
    updatePlanSection: async (planId, section, updates) => {
      try {
        actions.setSaving(true);
        const planUpdates = {
          planDetails: {
            ...state.planData.planDetails,
            [section]: updates
          }
        };
        const response = await planAPI.updatePlan(planId, planUpdates);
        actions.setPlanData(response.plan);
        return response.plan;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to update plan section';
        actions.setPlanError(errorMessage);
        throw error;
      } finally {
        actions.setSaving(false);
      }
    },

    // Generate AI recommendations
    generateRecommendations: async (planId) => {
      try {
        const response = await planAPI.generateAIRecommendations(planId);
        // Update plan data with new recommendations
        if (state.planData) {
          actions.setPlanData({
            ...state.planData,
            aiRecommendations: response.aiRecommendations
          });
        }
        return response.aiRecommendations;
      } catch (error) {
        console.error('Failed to generate AI recommendations:', error);
        throw error;
      }
    }
  };

  // Computed values (memoized for performance)
  const computed = {
    // Check if metrics need recalculation (every 5 minutes or when client data changes)
    shouldRecalculateMetrics: () => {
      if (!state.calculatedMetrics || !state.lastCalculated) return true;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return state.lastCalculated < fiveMinutesAgo;
    },

    // Get current plan section data
    getCurrentSectionData: () => {
      if (!state.planData || !state.activeSection) return null;
      return state.planData.planDetails?.[state.activeSection] || null;
    },

    // Check if client data is complete enough for planning
    isClientDataComplete: () => {
      if (!state.clientData) return false;
      const required = [
        'firstName', 'lastName', 'email', 'totalMonthlyIncome', 'totalMonthlyExpenses'
      ];
      return required.every(field => state.clientData[field]);
    },

    // Get data completeness percentage
    getDataCompleteness: () => {
      if (!state.clientData) return 0;
      const allFields = [
        'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth',
        'totalMonthlyIncome', 'totalMonthlyExpenses', 'assets', 'debtsAndLiabilities',
        'retirementPlanning', 'riskTolerance'
      ];
      const filledFields = allFields.filter(field => {
        const value = state.clientData[field];
        if (typeof value === 'object') {
          return value && Object.keys(value).length > 0;
        }
        return value !== null && value !== undefined && value !== '';
      });
      return Math.round((filledFields.length / allFields.length) * 100);
    }
  };

  const contextValue = {
    // State
    ...state,
    
    // Actions
    ...actions,
    
    // API functions
    api,
    
    // Computed values
    computed
  };

  return (
    <PlanningContext.Provider value={contextValue}>
      {children}
    </PlanningContext.Provider>
  );
};

// Custom hook to use planning context
export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

export default PlanningContext;