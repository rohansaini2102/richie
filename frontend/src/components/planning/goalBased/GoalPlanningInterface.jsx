import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ClearAll as ClearCacheIcon
} from '@mui/icons-material';
import GoalAnalysisPanel from './GoalAnalysisPanel';
import EditableGoalItem from './EditableGoalItem';
import { 
  calculateRequiredSIP, 
  getAssetAllocation,
  detectTimelineConflicts,
  optimizeMultipleGoals
} from './utils/goalCalculations';
import { calculateTotalEMIs } from '../cashflow/utils/calculations';
import { planAPI } from '../../../services/api';
import aiRecommendationsCache from '../../../services/aiRecommendationsCache';
import SimplePDFGenerator from './SimplePDFGenerator';

const GoalPlanningInterface = ({ 
  selectedGoals, 
  clientData, 
  onBack, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [editedGoals, setEditedGoals] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState(null);
  const [goalsHash, setGoalsHash] = useState(null);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ fromCache: false, ageMinutes: 0 });

  // Create a hash of goals to detect meaningful changes
  const createGoalsHash = (goals) => {
    if (!goals || goals.length === 0) return null;
    const relevantData = goals.map(goal => ({
      id: goal.id,
      targetAmount: goal.targetAmount,
      targetYear: goal.targetYear,
      priority: goal.priority,
      title: goal.title
    }));
    return JSON.stringify(relevantData);
  };

  // Initialize edited goals from selected goals
  useEffect(() => {
    if (selectedGoals && selectedGoals.length > 0) {
      const goalsWithCalculations = selectedGoals.map(goal => {
        const currentYear = new Date().getFullYear();
        const years = (goal.targetYear || currentYear + 5) - currentYear;
        const allocation = getAssetAllocation(years, clientData.riskTolerance);
        const requiredSIP = calculateRequiredSIP(
          goal.targetAmount || 0, 
          years, 
          allocation.expectedReturn
        );

        return {
          ...goal,
          id: goal.id || `goal-${Date.now()}-${Math.random()}`,
          timeInYears: years,
          monthlySIP: requiredSIP,
          assetAllocation: allocation,
          status: 'active'
        };
      });
      
      const newGoalsHash = createGoalsHash(goalsWithCalculations);
      
      setEditedGoals(goalsWithCalculations);
      setGoalsHash(newGoalsHash);
      
      // First, always try to get recommendations from localStorage
      const cachedResult = aiRecommendationsCache.getRecommendations(goalsWithCalculations, clientData);
      
      console.log('🔍 [GoalPlanningInterface] Cache lookup result:', {
        hasCachedResult: !!cachedResult,
        newGoalsHash: newGoalsHash?.substring(0, 8) + '...',
        currentGoalsHash: goalsHash?.substring(0, 8) + '...',
        hashesMatch: goalsHash === newGoalsHash,
        goalsCount: goalsWithCalculations.length,
        clientId: clientData._id || clientData.id
      });
      
      if (cachedResult) {
        console.log('✅ [GoalPlanningInterface] Using localStorage cached data - NO API CALL EVER');
        setRecommendations(cachedResult.recommendations);
        setLastAnalysisTimestamp(cachedResult.timestamp);
        setCacheInfo({ 
          fromCache: true, 
          ageMinutes: cachedResult.ageMinutes 
        });
        setGoalsHash(newGoalsHash);
        // IMPORTANT: If we have cached data, NEVER proceed to API calls
        return;
      }
      
      // PRIORITY 2: If plan is saved, NEVER make API calls (PDF section)
      if (isPlanSaved) {
        console.log('🚫 [GoalPlanningInterface] Plan is saved - NO API CALLS for PDF section');
        return;
      }
      
      console.log('⚠️ [GoalPlanningInterface] No localStorage cache and plan not saved - checking if API call needed');
      
      // PRIORITY 3: Final checks before API call
      const hasCurrentRecommendations = recommendations && lastAnalysisTimestamp;
      const goalsHaveChanged = goalsHash && goalsHash !== newGoalsHash;
      const shouldFetch = !hasCurrentRecommendations || goalsHaveChanged;
      
      if (shouldFetch) {
        console.log('🧠 [GoalPlanningInterface] Making API call:', {
          reason: !hasCurrentRecommendations ? 'no_current_data' : 'goals_changed',
          hasCurrentRecommendations,
          goalsHaveChanged,
          isPlanSaved
        });
        fetchAIRecommendations(goalsWithCalculations);
      } else {
        console.log('⚠️ [GoalPlanningInterface] Skipping API call:', {
          hasCurrentRecommendations,
          goalsHaveChanged,
          isPlanSaved,
          reason: 'conditions_not_met'
        });
      }
    }
  }, [selectedGoals, clientData]);

  // Fetch AI recommendations with persistent caching
  const fetchAIRecommendations = async (goals = editedGoals, forceRefresh = false) => {
    const now = Date.now();
    
    console.log('🚀 [GoalPlanningInterface] fetchAIRecommendations called:', {
      forceRefresh,
      goalsCount: goals?.length || 0,
      hasClientData: !!clientData,
      clientId: clientData?._id || clientData?.id || 'unknown'
    });
    
    // If forcing refresh, clear the cache first
    if (forceRefresh) {
      console.log('🗑️ [GoalPlanningInterface] Force refresh - clearing cache');
      aiRecommendationsCache.forceRefresh(goals, clientData);
      setCacheInfo({ fromCache: false, ageMinutes: 0 });
    } else {
      // For non-force refresh, check cache one more time as a safety net
      const cachedResult = aiRecommendationsCache.getRecommendations(goals, clientData);
      if (cachedResult) {
        console.log('✅ [GoalPlanningInterface] Last-chance cache hit - using cached data');
        setRecommendations(cachedResult.recommendations);
        setLastAnalysisTimestamp(cachedResult.timestamp);
        setCacheInfo({ 
          fromCache: true, 
          ageMinutes: cachedResult.ageMinutes 
        });
        return;
      }
      console.log('📞 [GoalPlanningInterface] Proceeding with API call - no cache available');
    }
    
    setAnalysisLoading(true);
    setError(null);
    
    try {
      console.log('🎯 [GoalPlanningInterface] Starting AI analysis request:', {
        goalsCount: goals?.length || 0,
        goalTypes: goals?.map(g => g.title || g.type) || [],
        hasClientData: !!clientData,
        clientId: clientData?._id || clientData?.id || 'unknown',
        forceRefresh,
        cacheAge: lastAnalysisTimestamp ? Math.round((now - lastAnalysisTimestamp) / 1000) + 's' : 'none'
      });

      const response = await planAPI.analyzeGoals(goals, clientData);

      console.log('📊 [GoalPlanningInterface] AI analysis response received:', {
        success: response?.success,
        hasRecommendations: !!response?.recommendations,
        recommendationsType: typeof response?.recommendations,
        hasError: !!response?.error
      });

      if (response.success && response.recommendations) {
        // Parse the AI response if it's a string
        let aiRecommendations = response.recommendations;
        if (typeof aiRecommendations === 'string') {
          try {
            aiRecommendations = JSON.parse(aiRecommendations);
          } catch (e) {
            console.error('Failed to parse AI recommendations:', e);
          }
        }
        
        // Save to localStorage for persistent caching
        const saved = aiRecommendationsCache.saveRecommendations(goals, clientData, aiRecommendations);
        
        setRecommendations(aiRecommendations);
        setLastAnalysisTimestamp(now);
        setGoalsHash(createGoalsHash(goals));
        setCacheInfo({ 
          fromCache: false, 
          ageMinutes: 0 
        });
        
        console.log('💾 [GoalPlanningInterface] AI recommendations saved to cache:', saved);
      } else {
        setError('Failed to generate recommendations');
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setError(err.response?.data?.message || 'Failed to fetch AI recommendations');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Handle goal updates
  const handleGoalUpdate = (goalId, updates) => {
    setEditedGoals(prev => {
      const updated = prev.map(goal => {
        if (goal.id === goalId) {
          const updatedGoal = { ...goal, ...updates };
          
          // Recalculate SIP if amount or timeline changed
          if (updates.targetAmount || updates.targetYear) {
            const currentYear = new Date().getFullYear();
            const years = (updatedGoal.targetYear || currentYear + 5) - currentYear;
            const allocation = getAssetAllocation(years, clientData.riskTolerance);
            updatedGoal.timeInYears = years;
            updatedGoal.assetAllocation = allocation;
            updatedGoal.monthlySIP = calculateRequiredSIP(
              updatedGoal.targetAmount || 0,
              years,
              allocation.expectedReturn
            );
          }
          
          return updatedGoal;
        }
        return goal;
      });
      
      // Check if goals have meaningfully changed to trigger re-analysis
      const newGoalsHash = createGoalsHash(updated);
      if (newGoalsHash !== goalsHash) {
        console.log('📝 [GoalPlanningInterface] Goals updated, invalidating cache');
        setGoalsHash(newGoalsHash);
        
        // Clear cache since goals have changed
        aiRecommendationsCache.forceRefresh(updated, clientData);
        
        // Reset cache info and analysis timestamp
        setCacheInfo({ fromCache: false, ageMinutes: 0 });
        setLastAnalysisTimestamp(null);
        
        // Clear current recommendations to show that they're stale
        setRecommendations(null);
        
        console.log('🗑️ [GoalPlanningInterface] Cache invalidated due to goal changes');
      }
      
      return updated;
    });
  };

  // Handle removing a goal
  const handleRemoveGoal = (goalId) => {
    setEditedGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  // Refresh AI recommendations
  const handleRefreshRecommendations = () => {
    console.log('🔄 [GoalPlanningInterface] Manual refresh of AI recommendations requested');
    fetchAIRecommendations(editedGoals, true); // Force refresh
  };

  // Clear all AI recommendations cache
  const handleClearCache = () => {
    const cleared = aiRecommendationsCache.clearAllCache();
    setCacheInfo({ fromCache: false, ageMinutes: 0 });
    setRecommendations(null);
    setLastAnalysisTimestamp(null);
    console.log('🗑️ [GoalPlanningInterface] All cache cleared:', cleared + ' entries');
  };

  // Save the plan
  const handleSavePlan = async () => {
    console.log('💾 [DEBUG] Save Plan button clicked:', {
      clientId: clientData._id,
      editedGoalsCount: editedGoals.length,
      hasRecommendations: !!recommendations,
      currentSavedPlanId: savedPlanId
    });

    setLoading(true);
    setError(null);
    
    try {
      const planData = {
        clientId: clientData._id,
        planType: 'goal_based',
        goals: editedGoals,
        recommendations: recommendations,
        status: 'draft'
      };

      console.log('📤 [DEBUG] Sending plan data to API:', {
        planDataKeys: Object.keys(planData),
        clientId: planData.clientId,
        planType: planData.planType,
        goalsCount: planData.goals?.length || 0,
        hasRecommendations: !!planData.recommendations
      });

      const response = await planAPI.createPlan(planData);
      
      console.log('📥 [DEBUG] Save plan response:', {
        success: response?.success,
        planId: response?.plan?._id,
        responseKeys: response ? Object.keys(response) : [],
        hasResponse: !!response
      });
      
      if (response.success) {
        const newPlanId = response.plan._id;
        setShowSuccess(true);
        setSavedPlanId(newPlanId); // Store plan ID for PDF generation
        setIsPlanSaved(true); // Mark plan as saved to prevent unnecessary AI calls
        
        console.log('✅ [DEBUG] Plan saved successfully:', {
          savedPlanId: newPlanId,
          planStatus: response.plan.status,
          isPlanSaved: true
        });
        
        if (onSave) {
          onSave(response.plan);
        }
      } else {
        console.error('❌ [DEBUG] Plan save failed - response not successful:', response);
        setError('Failed to save plan - server responded with error');
      }
    } catch (err) {
      console.error('❌ [DEBUG] Error saving plan:', {
        error: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        requestData: {
          clientId: clientData._id,
          goalsCount: editedGoals.length
        }
      });
      setError(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const totalRequiredSIP = editedGoals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const totalEMIs = calculateTotalEMIs(clientData.debtsAndLiabilities);
    const availableSurplus = monthlyIncome - monthlyExpenses - totalEMIs;
    const conflicts = detectTimelineConflicts(editedGoals);
    const optimization = optimizeMultipleGoals(editedGoals, availableSurplus);

    return {
      totalGoals: editedGoals.length,
      totalRequiredSIP,
      availableSurplus,
      feasible: totalRequiredSIP <= availableSurplus,
      conflicts,
      optimization
    };
  };

  // PDF Generation Functions
  const handleViewPDF = async () => {
    console.log('🎯 [DEBUG] View PDF button clicked:', {
      savedPlanId,
      hasSavedPlanId: !!savedPlanId,
      clientId: clientData?._id,
      pdfLoading
    });

    if (!savedPlanId) {
      console.error('❌ [DEBUG] No saved plan ID available for PDF generation');
      setError('Please save the plan first to generate PDF report');
      return;
    }

    setPdfLoading(true);
    try {
      console.log('📤 [DEBUG] Calling PDF API with plan ID:', savedPlanId);
      const pdfBlob = await planAPI.generateGoalPlanPDF(savedPlanId);
      
      console.log('✅ [DEBUG] PDF blob received:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type
      });
      
      // Create a blob URL and open in new tab
      const pdfURL = window.URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(pdfURL), 100);
    } catch (err) {
      console.error('❌ [DEBUG] Error viewing PDF:', {
        error: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        savedPlanId
      });
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    console.log('🎯 [DEBUG] Download PDF button clicked:', {
      savedPlanId,
      hasSavedPlanId: !!savedPlanId,
      clientId: clientData?._id,
      clientName: `${clientData?.firstName}_${clientData?.lastName}`,
      pdfLoading
    });

    if (!savedPlanId) {
      console.error('❌ [DEBUG] No saved plan ID available for PDF download');
      setError('Please save the plan first to download PDF report');
      return;
    }

    setPdfLoading(true);
    try {
      console.log('📤 [DEBUG] Calling PDF API for download with plan ID:', savedPlanId);
      const pdfBlob = await planAPI.generateGoalPlanPDF(savedPlanId);
      
      console.log('✅ [DEBUG] PDF blob received for download:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type
      });
      
      // Create download link
      const pdfURL = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const fileName = `Goal_Plan_Report_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.href = pdfURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ [DEBUG] PDF download initiated:', fileName);
      
      // Clean up the URL
      window.URL.revokeObjectURL(pdfURL);
    } catch (err) {
      console.error('❌ [DEBUG] Error downloading PDF:', {
        error: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        savedPlanId
      });
      setError('Failed to download PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const metrics = calculateSummaryMetrics();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Goal-Based Planning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {clientData.firstName} {clientData.lastName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title={
              cacheInfo.fromCache
                ? `Refresh AI recommendations (using cached data ${cacheInfo.ageMinutes}m old)`
                : recommendations
                  ? "Refresh AI recommendations (force new analysis)"
                  : "Refresh AI recommendations"
            }>
              <IconButton 
                onClick={handleRefreshRecommendations}
                disabled={analysisLoading}
                sx={{
                  color: cacheInfo.fromCache
                    ? '#4caf50' // Green when using cached data
                    : recommendations
                      ? '#2196f3' // Blue when fresh data available
                      : 'inherit'
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePlan}
              disabled={loading || editedGoals.length === 0}
            >
              Save Plan
            </Button>
            
            <Button
              variant="outlined"
              startIcon={pdfLoading ? <CircularProgress size={16} /> : <ViewIcon />}
              onClick={handleViewPDF}
              disabled={!savedPlanId || pdfLoading}
              sx={{ 
                borderColor: '#2563eb',
                color: '#2563eb',
                '&:hover': {
                  borderColor: '#1d4ed8',
                  bgcolor: '#eff6ff'
                }
              }}
            >
              {pdfLoading ? 'Generating...' : 'View Report'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={pdfLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={!savedPlanId || pdfLoading}
              sx={{ 
                borderColor: '#059669',
                color: '#059669',
                '&:hover': {
                  borderColor: '#047857',
                  bgcolor: '#f0fdf4'
                }
              }}
            >
              {pdfLoading ? 'Generating...' : 'Download PDF'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Summary Metrics */}
      <Paper sx={{ p: 2, mx: 2, mt: 2, bgcolor: metrics.feasible ? 'success.light' : 'warning.light' }}>
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Total Goals
            </Typography>
            <Typography variant="h6">
              {metrics.totalGoals}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Required Monthly SIP
            </Typography>
            <Typography variant="h6">
              ₹{metrics.totalRequiredSIP.toLocaleString('en-IN')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Available Surplus
            </Typography>
            <Typography variant="h6">
              ₹{metrics.availableSurplus.toLocaleString('en-IN')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="h6" color={metrics.feasible ? 'success.main' : 'warning.main'}>
              {metrics.feasible ? 'Achievable' : 'Needs Optimization'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 2, gap: 2 }}>
        {/* Left Panel - Editable Goals */}
        <Paper sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Goal Details & Configuration
          </Typography>
          
          {editedGoals.map((goal, index) => (
            <Box key={goal.id}>
              <EditableGoalItem
                goal={goal}
                index={index + 1}
                onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
                onRemove={() => handleRemoveGoal(goal.id)}
                clientAge={clientData.age || 30}
              />
              {index < editedGoals.length - 1 && <Divider sx={{ my: 3 }} />}
            </Box>
          ))}

          {editedGoals.length === 0 && (
            <Alert severity="info">
              No goals selected. Please go back and select goals to plan.
            </Alert>
          )}
        </Paper>

        {/* Right Panel - AI Recommendations */}
        <Paper sx={{ width: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Cache Status Indicator */}
          {(recommendations || analysisLoading) && (
            <Box sx={{ 
              p: 1, 
              borderBottom: '1px solid #e0e0e0', 
              bgcolor: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                {cacheInfo.fromCache ? (
                  <Chip
                    size="small"
                    label={`Cached ${cacheInfo.ageMinutes}m ago`}
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ) : analysisLoading ? (
                  <Chip
                    size="small"
                    label="Generating new analysis..."
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ) : (
                  <Chip
                    size="small"
                    label="Fresh analysis"
                    color="primary"
                    variant="filled"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>
              
              {cacheInfo.fromCache && (
                <Tooltip title="Clear all cached AI recommendations">
                  <IconButton
                    size="small"
                    onClick={handleClearCache}
                    sx={{ p: 0.5 }}
                  >
                    <ClearCacheIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
          
          <GoalAnalysisPanel 
            recommendations={recommendations}
            loading={analysisLoading}
            error={error}
          />
        </Paper>
      </Box>

      {/* Simple PDF Generator - No Dependencies */}
      <Box sx={{ mx: 2, mb: 2 }}>
        <SimplePDFGenerator
          clientData={clientData}
          editedGoals={editedGoals}
          recommendations={recommendations}
          metrics={metrics}
          disabled={loading}
        />
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Plan saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GoalPlanningInterface;