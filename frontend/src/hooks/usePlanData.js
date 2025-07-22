import { useState, useEffect, useCallback } from 'react';
import { planAPI, clientAPI } from '../services/api';

/**
 * Custom hook for managing plan and client data
 * Provides loading states, error handling, and data fetching
 */
export const usePlanData = (planId, clientId) => {
  const [state, setState] = useState({
    planData: null,
    clientData: null,
    planLoading: false,
    clientLoading: false,
    error: null,
    lastUpdated: null
  });

  // Load plan data
  const loadPlan = useCallback(async (id = planId) => {
    if (!id) return;

    try {
      setState(prev => ({ ...prev, planLoading: true, error: null }));
      const response = await planAPI.getPlanById(id);
      setState(prev => ({
        ...prev,
        planData: response.plan,
        planLoading: false,
        lastUpdated: new Date()
      }));
      return response.plan;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to load plan';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        planLoading: false
      }));
      throw error;
    }
  }, [planId]);

  // Load client data
  const loadClient = useCallback(async (id = clientId) => {
    if (!id) return;

    try {
      setState(prev => ({ ...prev, clientLoading: true, error: null }));
      const clientData = await clientAPI.getClientById(id);
      setState(prev => ({
        ...prev,
        clientData: clientData,
        clientLoading: false
      }));
      return clientData;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to load client data';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        clientLoading: false
      }));
      throw error;
    }
  }, [clientId]);

  // Update plan
  const updatePlan = useCallback(async (updates) => {
    if (!planId) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      const response = await planAPI.updatePlan(planId, updates);
      setState(prev => ({
        ...prev,
        planData: response.plan,
        lastUpdated: new Date()
      }));
      return response.plan;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update plan';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [planId]);

  // Update specific section of plan
  const updatePlanSection = useCallback(async (section, updates) => {
    if (!planId || !state.planData) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      const planUpdates = {
        planDetails: {
          ...state.planData.planDetails,
          [section]: {
            ...state.planData.planDetails[section],
            ...updates
          }
        }
      };
      const response = await planAPI.updatePlan(planId, planUpdates);
      setState(prev => ({
        ...prev,
        planData: response.plan,
        lastUpdated: new Date()
      }));
      return response.plan;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update plan section';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [planId, state.planData]);

  // Generate AI recommendations
  const generateRecommendations = useCallback(async () => {
    if (!planId) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      const response = await planAPI.generateAIRecommendations(planId);
      
      // Update plan data with new recommendations
      setState(prev => ({
        ...prev,
        planData: prev.planData ? {
          ...prev.planData,
          aiRecommendations: response.aiRecommendations
        } : null
      }));
      
      return response.aiRecommendations;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to generate recommendations';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [planId]);

  // Load all data on mount or when IDs change
  useEffect(() => {
    if (planId || clientId) {
      const loadData = async () => {
        const promises = [];
        if (planId) promises.push(loadPlan());
        if (clientId) promises.push(loadClient());
        
        try {
          await Promise.all(promises);
        } catch (error) {
          // Error is already handled in individual functions
          console.error('Error loading data:', error);
        }
      };
      
      loadData();
    }
  }, [planId, clientId, loadPlan, loadClient]);

  // Computed values
  const isLoading = state.planLoading || state.clientLoading;
  const hasData = Boolean(state.planData || state.clientData);
  const planAge = state.planData?.createdAt ? 
    Math.floor((new Date() - new Date(state.planData.createdAt)) / (1000 * 60 * 60 * 24)) : null;

  return {
    // State
    planData: state.planData,
    clientData: state.clientData,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Loading states
    planLoading: state.planLoading,
    clientLoading: state.clientLoading,
    isLoading,
    
    // Computed values
    hasData,
    planAge,
    
    // Actions
    loadPlan,
    loadClient,
    updatePlan,
    updatePlanSection,
    generateRecommendations,
    
    // Utilities
    refresh: () => {
      if (planId) loadPlan();
      if (clientId) loadClient();
    },
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
};

export default usePlanData;