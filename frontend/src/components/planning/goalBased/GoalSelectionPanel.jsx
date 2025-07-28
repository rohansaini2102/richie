import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { parseExistingGoalsFromClient, calculateIntelligentGoalDefaults, validateClientDataForGoalPlanning } from './utils/goalDataHelpers';

const GoalSelectionPanel = ({ 
  selectedGoals = [], 
  onGoalToggle, 
  onContinue, 
  clientData 
}) => {
  const [availableGoals, setAvailableGoals] = useState([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', amount: '', year: '' });

  console.log('🎯 [GoalSelectionPanel] Client Data:', clientData);

  // Extract and process financial goals with intelligent defaults
  useEffect(() => {
    if (!clientData) {
      console.log('⚠️ [GoalSelectionPanel] No client data available');
      return;
    }

    console.log('📊 [GoalSelectionPanel] Processing client goals first, then AI suggestions');
    
    // Debug: Log the actual client data structure
    console.log('🔍 [GoalSelectionPanel] Client data structure debug:', {
      hasClientData: !!clientData,
      hasEnhancedFinancialGoals: !!clientData?.enhancedFinancialGoals,
      enhancedFinancialGoals: clientData?.enhancedFinancialGoals,
      clientDataKeys: clientData ? Object.keys(clientData) : []
    });
    
    // First, get existing client goals using the dedicated function
    const existingClientGoals = parseExistingGoalsFromClient(clientData);
    
    // Get intelligent defaults based on client profile
    const intelligentDefaults = calculateIntelligentGoalDefaults(clientData);
    const dataValidation = validateClientDataForGoalPlanning(clientData);
    
    console.log('🎯 [GoalSelectionPanel] Existing client goals:', existingClientGoals);
    console.log('🧠 [GoalSelectionPanel] Intelligent defaults:', intelligentDefaults);
    console.log('📊 [GoalSelectionPanel] Data validation:', dataValidation);

    const goals = [];
    const processedGoalTypes = new Set(); // Track which goal types we've processed from client data

    // Step 1: Process existing client goals first (highest priority)
    const preSelectedGoalIds = new Set(); // Track which goals should be pre-selected
    
    existingClientGoals.forEach(clientGoal => {
      const goalData = clientGoal.data;
      let goalIcon = '🎯';
      let goalTitle = '';
      let goalDescription = '';
      
      // Map client goal types to display format
      switch (clientGoal.type) {
        case 'custom':
          if (goalData.goalName === 'Emergency Fund') {
            goalIcon = '🛡️';
            goalTitle = 'EMERGENCY FUND';
            goalDescription = 'Build emergency fund for financial security';
            processedGoalTypes.add('emergencyFund');
          } else {
            goalIcon = '🎯';
            goalTitle = (goalData.goalName || 'CUSTOM GOAL').toUpperCase();
            goalDescription = `Custom financial goal: ${goalData.goalName || 'Personal Goal'}`;
          }
          break;
        case 'childEducation':
          goalIcon = '🎓';
          goalTitle = 'CHILD EDUCATION';
          goalDescription = 'Fund your child\'s higher education';
          processedGoalTypes.add('childEducation');
          break;
        case 'carPurchase':
          if (goalData.category === 'Home Purchase') {
            goalIcon = '🏠';
            goalTitle = 'HOME PURCHASE';
            goalDescription = 'Save for your dream home';
            processedGoalTypes.add('homePurchase');
          } else {
            goalIcon = '🚗';
            goalTitle = (goalData.category || 'CAR PURCHASE').toUpperCase();
            goalDescription = `Purchase ${goalData.category || 'vehicle'}`;
            processedGoalTypes.add('carPurchase');
          }
          break;
        case 'marriage':
          goalIcon = '💒';
          goalTitle = 'MARRIAGE OF DAUGHTER';
          goalDescription = 'Save for your daughter\'s wedding';
          processedGoalTypes.add('marriageOfDaughter');
          break;
      }

      const processedGoal = {
        id: `client-${clientGoal.id}`,
        title: goalTitle || 'Client Goal',
        description: goalDescription || 'Client-specified financial goal',
        icon: goalIcon || '🎯',
        targetAmount: Number(goalData.targetAmount) || 1000000,
        targetYear: Number(goalData.targetYear) || (new Date().getFullYear() + 5),
        priority: goalData.priority || 'Medium',
        hasData: true,
        source: 'client_data',
        type: clientGoal.type || 'custom',
        originalClientGoal: clientGoal // Keep reference to original data
      };
      
      goals.push(processedGoal);
      
      // Pre-select client goals since they specifically set them up
      if (clientGoal.isSelected !== false) {
        preSelectedGoalIds.add(processedGoal.id);
      }
    });

    // Step 2: Add AI-suggested goals for missing goal types
    if (!processedGoalTypes.has('emergencyFund') && intelligentDefaults.emergencyFund.targetAmount > 0) {
      goals.push({
        id: 'emergency-suggested',
        title: 'EMERGENCY FUND (AI Suggested)',
        description: 'Build emergency fund based on your expenses',
        icon: '🛡️',
        targetAmount: Number(intelligentDefaults.emergencyFund.targetAmount) || 300000,
        targetYear: new Date().getFullYear() + 1,
        priority: 'High',
        hasData: true,
        source: 'intelligent_default',
        type: 'emergencyFund'
      });
    }

    if (!processedGoalTypes.has('childEducation')) {
      goals.push({
        id: 'childEducation-suggested',
        title: `CHILD EDUCATION (${intelligentDefaults.childEducation.educationLevel})`,
        description: 'Fund your child\'s higher education - AI suggested based on your income',
        icon: '🎓',
        targetAmount: Number(intelligentDefaults.childEducation.targetAmount) || 2500000,
        targetYear: Number(intelligentDefaults.childEducation.targetYear) || (new Date().getFullYear() + 15),
        priority: 'Medium',
        hasData: true,
        source: 'intelligent_default',
        type: 'childEducation'
      });
    }

    if (!processedGoalTypes.has('marriageOfDaughter')) {
      goals.push({
        id: 'marriage-suggested',
        title: 'MARRIAGE OF DAUGHTER (AI Suggested)',
        description: 'Save for your daughter\'s wedding - suggested based on your income',
        icon: '💒',
        targetAmount: Number(intelligentDefaults.marriage.targetAmount) || 1500000,
        targetYear: Number(intelligentDefaults.marriage.targetYear) || (new Date().getFullYear() + 20),
        priority: 'Medium',
        hasData: true,
        source: 'intelligent_default',
        type: 'marriageOfDaughter'
      });
    }

    if (!processedGoalTypes.has('carPurchase')) {
      goals.push({
        id: 'carPurchase-suggested',
        title: `${intelligentDefaults.carPurchase.category.toUpperCase()} PURCHASE (AI Suggested)`,
        description: `Purchase ${intelligentDefaults.carPurchase.category.toLowerCase()} - suggested based on your income`,
        icon: '🚗',
        targetAmount: Number(intelligentDefaults.carPurchase.targetAmount) || 1500000,
        targetYear: Number(intelligentDefaults.carPurchase.targetYear) || (new Date().getFullYear() + 3),
        priority: 'Medium',
        hasData: true,
        source: 'intelligent_default',
        type: 'carPurchase'
      });
    }

    // Always show custom goal option for adding new
    goals.push({
      id: 'custom-new',
      title: 'CUSTOM GOAL',
      description: 'Create your personalized financial goal',
      icon: '⚙️',
      targetAmount: 0, // Will be set when user adds custom goal
      targetYear: new Date().getFullYear() + 5,
      priority: 'Medium',
      hasData: false,
      source: 'new',
      type: 'custom'
    });

    console.log('📋 [GoalSelectionPanel] Final goals processed:', {
      totalGoals: goals.length,
      clientDataGoals: goals.filter(g => g.source === 'client_data').length,
      intelligentDefaults: goals.filter(g => g.source === 'intelligent_default').length,
      preSelectedCount: preSelectedGoalIds.size,
      dataQualityScore: dataValidation.score,
      processedGoalTypes: Array.from(processedGoalTypes)
    });

    setAvailableGoals(goals);
    setSelectedGoalIds(preSelectedGoalIds); // Pre-select client's goals 
  }, [clientData]);

  const handleGoalClick = (goal) => {
    if (!goal.hasData) {
      // Open add dialog for new custom goal
      setShowAddDialog(true);
    } else {
      // Toggle selection for existing goals
      const newSelected = new Set(selectedGoalIds);
      if (newSelected.has(goal.id)) {
        newSelected.delete(goal.id);
      } else {
        newSelected.add(goal.id);
      }
      setSelectedGoalIds(newSelected);
    }
  };

  const handleEditGoal = (goal, e) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingGoal) {
      setAvailableGoals(prev => 
        prev.map(g => 
          g.id === editingGoal.id ? editingGoal : g
        )
      );
      setShowEditDialog(false);
      setEditingGoal(null);
    }
  };

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.amount && newGoal.year) {
      const goal = {
        id: `custom-new-${Date.now()}`,
        title: newGoal.name.toUpperCase(),
        description: `Custom financial goal: ${newGoal.name}`,
        icon: '⚙️',
        targetAmount: Number(parseFloat(newGoal.amount)) || 1000000,
        targetYear: Number(parseInt(newGoal.year)) || (new Date().getFullYear() + 5),
        priority: 'Medium',
        hasData: true,
        source: 'new',
        type: 'custom'
      };
      
      // Add to goals list (insert before the "add new" card)
      setAvailableGoals(prev => {
        const newGoals = [...prev];
        newGoals.splice(-1, 0, goal); // Insert before last item
        return newGoals;
      });
      
      // Select the new goal
      setSelectedGoalIds(prev => new Set([...prev, goal.id]));
      
      setNewGoal({ name: '', amount: '', year: '' });
      setShowAddDialog(false);
    }
  };

  // Generate intelligent suggestions for goal amounts based on goal name
  const getGoalAmountSuggestions = (goalName, goalYear) => {
    if (!clientData || !goalName) return [];
    
    const annualIncome = clientData.totalMonthlyIncome * 12;
    const currentYear = new Date().getFullYear();
    const yearsToGoal = Math.max(1, (goalYear || currentYear + 5) - currentYear);
    
    const goalNameLower = goalName.toLowerCase();
    let suggestions = [];
    
    // Education-related goals
    if (goalNameLower.includes('education') || goalNameLower.includes('study') || goalNameLower.includes('college')) {
      suggestions = [
        { amount: 1500000, label: 'Basic Engineering (₹15L)' },
        { amount: 2500000, label: 'Premium Engineering (₹25L)' },
        { amount: 5000000, label: 'Medical/MBA (₹50L)' },
        { amount: 7500000, label: 'Study Abroad (₹75L)' }
      ];
    }
    // Travel/vacation goals
    else if (goalNameLower.includes('travel') || goalNameLower.includes('vacation') || goalNameLower.includes('tour')) {
      suggestions = [
        { amount: 200000, label: 'Domestic Tour (₹2L)' },
        { amount: 500000, label: 'International Tour (₹5L)' },
        { amount: 1000000, label: 'World Tour (₹10L)' },
        { amount: 1500000, label: 'Luxury Travel (₹15L)' }
      ];
    }
    // Business/investment goals
    else if (goalNameLower.includes('business') || goalNameLower.includes('investment') || goalNameLower.includes('startup')) {
      suggestions = [
        { amount: 1000000, label: 'Small Business (₹10L)' },
        { amount: 2500000, label: 'Medium Business (₹25L)' },
        { amount: 5000000, label: 'Large Investment (₹50L)' },
        { amount: 10000000, label: 'Major Venture (₹1Cr)' }
      ];
    }
    // Property/real estate goals
    else if (goalNameLower.includes('property') || goalNameLower.includes('land') || goalNameLower.includes('plot')) {
      suggestions = [
        { amount: 2000000, label: 'Land/Plot (₹20L)' },
        { amount: 5000000, label: 'Small Property (₹50L)' },
        { amount: 10000000, label: 'Premium Property (₹1Cr)' },
        { amount: 15000000, label: 'Luxury Property (₹1.5Cr)' }
      ];
    }
    // Generic goals based on income
    else {
      const baseAmount = Math.max(500000, annualIncome * 0.5); // 6 months income minimum
      suggestions = [
        { amount: Math.round(baseAmount), label: `Conservative (₹${(baseAmount/100000).toFixed(1)}L)` },
        { amount: Math.round(baseAmount * 2), label: `Moderate (₹${(baseAmount*2/100000).toFixed(1)}L)` },
        { amount: Math.round(baseAmount * 4), label: `Ambitious (₹${(baseAmount*4/100000).toFixed(1)}L)` },
        { amount: Math.round(baseAmount * 6), label: `Premium (₹${(baseAmount*6/100000).toFixed(1)}L)` }
      ];
    }
    
    return suggestions.filter(s => s.amount > 0);
  };

  // Get suggested years based on goal type and amount
  const getGoalYearSuggestions = (goalName, goalAmount) => {
    const currentYear = new Date().getFullYear();
    const goalNameLower = goalName?.toLowerCase() || '';
    
    // Emergency goals - immediate
    if (goalNameLower.includes('emergency') || goalNameLower.includes('urgent')) {
      return [currentYear + 1, currentYear + 2];
    }
    
    // Education goals - typically 10-15 years
    if (goalNameLower.includes('education') || goalNameLower.includes('child')) {
      return [currentYear + 10, currentYear + 15, currentYear + 18];
    }
    
    // Travel goals - shorter term
    if (goalNameLower.includes('travel') || goalNameLower.includes('vacation')) {
      return [currentYear + 2, currentYear + 3, currentYear + 5];
    }
    
    // Large amounts need more time
    if (goalAmount > 5000000) {
      return [currentYear + 7, currentYear + 10, currentYear + 15];
    } else if (goalAmount > 2000000) {
      return [currentYear + 5, currentYear + 7, currentYear + 10];
    } else {
      return [currentYear + 3, currentYear + 5, currentYear + 7];
    }
  };

  const renderGoalCard = (goal) => {
    const isSelected = selectedGoalIds.has(goal.id);
    
    return (
      <Card 
        key={goal.id}
        onClick={() => handleGoalClick(goal)}
        sx={{
          border: isSelected ? '2px solid #16a34a' : '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isSelected ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : 'white',
          position: 'relative',
          height: '100%',
          minHeight: '220px',
          boxShadow: isSelected ? '0 4px 15px rgba(22, 163, 74, 0.12)' : '0 1px 4px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: isSelected ? '0 6px 20px rgba(22, 163, 74, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
            borderColor: isSelected ? '#15803d' : '#2563eb'
          }
        }}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 12, 
              right: 12,
              background: '#16a34a',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)'
            }}
          >
            ✓
          </Box>
        )}

        {/* Edit Button for goals with data */}
        {goal.hasData && (
          <IconButton
            size="small"
            onClick={(e) => handleEditGoal(goal, e)}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'white' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}

        <CardContent sx={{ p: 0 }}>
          {/* Goal Icon */}
          <Box sx={{ fontSize: '40px', mb: 2 }}>
            {goal.icon}
          </Box>

          {/* Goal Title */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '16px',
              fontWeight: 700,
              mb: 1.5,
              color: '#111827',
              lineHeight: 1.2
            }}
          >
            {goal.title}
          </Typography>

          {/* Goal Description */}
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '13px',
              color: '#6b7280',
              lineHeight: 1.4,
              mb: 2
            }}
          >
            {goal.description}
          </Typography>

          {/* Goal Details for existing goals */}
          {goal.hasData && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700, fontSize: '15px', mb: 0.5 }}>
                ₹{goal.targetAmount?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>
                Target Year: {goal.targetYear}
              </Typography>
              {goal.source && (
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={
                      goal.source === 'client_data' ? '👤 Your Goal' :
                      goal.source === 'intelligent_default' ? '🤖 AI Suggested' : '⚙️ New'
                    }
                    sx={{ 
                      fontSize: '10px',
                      height: '22px',
                      fontWeight: 600,
                      bgcolor: goal.source === 'client_data' ? '#dcfce7' : 
                              goal.source === 'intelligent_default' ? '#dbeafe' : '#f3f4f6',
                      color: goal.source === 'client_data' ? '#166534' : 
                             goal.source === 'intelligent_default' ? '#1e40af' : '#6b7280'
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Action Button */}
          <Button
            variant={isSelected ? "contained" : "outlined"}
            size="medium"
            sx={{
              backgroundColor: goal.hasData ? (isSelected ? '#16a34a' : 'transparent') : '#2563eb',
              color: goal.hasData ? (isSelected ? 'white' : '#2563eb') : 'white',
              borderColor: goal.hasData ? '#2563eb' : '#2563eb',
              fontWeight: 600,
              fontSize: '13px',
              padding: '8px 16px',
              borderRadius: '8px',
              minWidth: '120px',
              '&:hover': {
                backgroundColor: goal.hasData ? (isSelected ? '#15803d' : '#2563eb') : '#1d4ed8',
                transform: 'scale(1.02)'
              }
            }}
          >
            {goal.hasData 
              ? (isSelected ? '✅ Selected' : '+ Select') 
              : '+ Add Goal'
            }
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ padding: '20px', width: '100%' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            mb: 2
          }}
        >
          Choose Your Goals
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#6b7280',
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          Your existing financial goals are shown first and pre-selected. AI-suggested goals are provided as additional options. You can edit any goal or add custom ones.
        </Typography>
      </Box>

      {/* Data Quality Information */}
      {clientData && (() => {
        const validation = validateClientDataForGoalPlanning(clientData);
        const intelligentDefaults = calculateIntelligentGoalDefaults(clientData);
        
        return (
          <Box sx={{ mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ mb: 1, fontSize: '14px', fontWeight: 600 }}>
              📊 Goal Planning Data Quality
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption">Quality Score</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {validation.score}/100
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption">Client Goals</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {availableGoals.filter(g => g.source === 'client_data').length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption">AI Suggestions</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {availableGoals.filter(g => g.source === 'intelligent_default').length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption">Status</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: validation.canProceed ? '#16a34a' : '#f59e0b' }}>
                  {validation.canProceed ? 'Ready' : 'Review Needed'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );
      })()}

      {/* Goals Grid */}
      <Grid 
        container 
        spacing={3} 
        sx={{ mb: 4 }}
      >
        {availableGoals.map(goal => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={goal.id}>
            {renderGoalCard(goal)}
          </Grid>
        ))}
      </Grid>

      {/* Add New Goal Dialog with Intelligent Suggestions */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>Add Custom Goal</span>
            {newGoal.name && (
              <Box sx={{ 
                bgcolor: '#e0f2fe', 
                color: '#0369a1', 
                px: 1, 
                py: 0.5, 
                borderRadius: 1, 
                fontSize: '12px',
                fontWeight: 600
              }}>
                AI Suggestions Available
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Goal Name Input */}
            <TextField
              fullWidth
              label="Goal Name"
              value={newGoal.name}
              onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 3 }}
              placeholder="e.g., World Tour, Business Investment, Child Education"
              helperText="Tip: Be specific to get better amount suggestions"
            />
            
            {/* Target Amount with Suggestions */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Target Amount"
                type="number"
                value={newGoal.amount}
                onChange={(e) => setNewGoal(prev => ({ ...prev, amount: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                sx={{ mb: 1 }}
              />
              
              {/* Amount Suggestions */}
              {newGoal.name && (() => {
                const suggestions = getGoalAmountSuggestions(newGoal.name, newGoal.year);
                return suggestions.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                      💡 Suggested amounts based on your goal:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          size="small"
                          variant="outlined"
                          onClick={() => setNewGoal(prev => ({ ...prev, amount: suggestion.amount.toString() }))}
                          sx={{
                            fontSize: '11px',
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            border: '1px solid #e2e8f0',
                            color: '#374151',
                            '&:hover': {
                              bgcolor: '#f8fafc',
                              borderColor: '#2563eb'
                            }
                          }}
                        >
                          {suggestion.label}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                );
              })()}
            </Box>
            
            {/* Target Year with Suggestions */}
            <Box>
              <TextField
                fullWidth
                label="Target Year"
                type="number"
                value={newGoal.year}
                onChange={(e) => setNewGoal(prev => ({ ...prev, year: e.target.value }))}
                InputProps={{
                  inputProps: { min: new Date().getFullYear(), max: new Date().getFullYear() + 50 }
                }}
                sx={{ mb: 1 }}
              />
              
              {/* Year Suggestions */}
              {(newGoal.name || newGoal.amount) && (() => {
                const suggestions = getGoalYearSuggestions(newGoal.name, parseFloat(newGoal.amount));
                return (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                      📅 Recommended timeline:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {suggestions.map((year, index) => (
                        <Button
                          key={index}
                          size="small"
                          variant="outlined"
                          onClick={() => setNewGoal(prev => ({ ...prev, year: year.toString() }))}
                          sx={{
                            fontSize: '11px',
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            border: '1px solid #e2e8f0',
                            color: '#374151',
                            '&:hover': {
                              bgcolor: '#f8fafc',
                              borderColor: '#2563eb'
                            }
                          }}
                        >
                          {year} ({year - new Date().getFullYear()} yrs)
                        </Button>
                      ))}
                    </Box>
                  </Box>
                );
              })()}
            </Box>
            
            {/* SIP Calculation Preview */}
            {newGoal.amount && newGoal.year && (
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: '#f0f9ff', 
                border: '1px solid #bae6fd', 
                borderRadius: 1 
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0369a1', mb: 1 }}>
                  📊 Investment Preview
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" display="block">Estimated Monthly SIP:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{(() => {
                        const years = parseInt(newGoal.year) - new Date().getFullYear();
                        const monthlyRate = 12 / 100 / 12; // 12% annual return
                        const months = years * 12;
                        const sip = parseFloat(newGoal.amount) * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
                        return Math.round(sip).toLocaleString('en-IN');
                      })()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" display="block">Investment Period:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {parseInt(newGoal.year) - new Date().getFullYear()} years
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddGoal}
            variant="contained"
            disabled={!newGoal.name || !newGoal.amount || !newGoal.year}
            sx={{ bgcolor: '#16a34a' }}
          >
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Goal Dialog with Smart Suggestions */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>Edit Goal: {editingGoal?.title}</span>
            <Box sx={{ 
              bgcolor: '#dcfce7', 
              color: '#166534', 
              px: 1, 
              py: 0.5, 
              borderRadius: 1, 
              fontSize: '12px',
              fontWeight: 600
            }}>
              Smart Adjustments
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingGoal && (
            <Box sx={{ pt: 2 }}>
              {/* Current vs Suggested Comparison */}
              {(() => {
                const intelligentDefaults = calculateIntelligentGoalDefaults(clientData);
                const goalType = editingGoal.title?.toLowerCase().includes('education') ? 'childEducation' :
                              editingGoal.title?.toLowerCase().includes('marriage') ? 'marriage' :
                              editingGoal.title?.toLowerCase().includes('car') ? 'carPurchase' : 'custom';
                const suggestion = intelligentDefaults[goalType];
                
                return suggestion && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                      🤖 AI Recommendation vs Current Values:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fff', borderRadius: 1 }}>
                          <Typography variant="caption" display="block">Current Amount</Typography>
                          <Typography variant="h6" sx={{ color: '#6b7280' }}>
                            ₹{editingGoal.targetAmount?.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e0f2fe', borderRadius: 1 }}>
                          <Typography variant="caption" display="block">AI Suggested</Typography>
                          <Typography variant="h6" sx={{ color: '#0369a1' }}>
                            ₹{suggestion.targetAmount?.toLocaleString('en-IN')}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => setEditingGoal(prev => ({ 
                              ...prev, 
                              targetAmount: suggestion.targetAmount 
                            }))}
                            sx={{ fontSize: '10px', mt: 0.5, minWidth: 'auto', px: 1 }}
                          >
                            Use This
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })()}
              
              {/* Amount Input */}
              <TextField
                fullWidth
                label="Target Amount"
                type="number"
                value={editingGoal.targetAmount}
                onChange={(e) => setEditingGoal(prev => ({ 
                  ...prev, 
                  targetAmount: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                sx={{ mb: 2 }}
                helperText={`Current SIP needed: ₹${(() => {
                  const years = (editingGoal.targetYear || new Date().getFullYear() + 5) - new Date().getFullYear();
                  const monthlyRate = 12 / 100 / 12;
                  const months = years * 12;
                  const sip = editingGoal.targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
                  return Math.round(sip).toLocaleString('en-IN');
                })()} per month`}
              />
              
              {/* Year Input */}
              <TextField
                fullWidth
                label="Target Year"
                type="number"
                value={editingGoal.targetYear}
                onChange={(e) => setEditingGoal(prev => ({ 
                  ...prev, 
                  targetYear: parseInt(e.target.value) || new Date().getFullYear() 
                }))}
                InputProps={{
                  inputProps: { min: new Date().getFullYear(), max: new Date().getFullYear() + 50 }
                }}
                helperText={`${(editingGoal.targetYear || new Date().getFullYear()) - new Date().getFullYear()} years to achieve this goal`}
              />
              
              {/* Impact Analysis */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: '#fef3c7', 
                border: '1px solid #fcd34d', 
                borderRadius: 1 
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e', mb: 1 }}>
                  📊 Goal Impact Analysis
                </Typography>
                <Grid container spacing={2} sx={{ fontSize: '14px' }}>
                  <Grid item xs={4}>
                    <Typography variant="caption" display="block">Timeline:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(editingGoal.targetYear || new Date().getFullYear()) - new Date().getFullYear()} years
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" display="block">Monthly SIP:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{(() => {
                        const years = (editingGoal.targetYear || new Date().getFullYear() + 5) - new Date().getFullYear();
                        const monthlyRate = 12 / 100 / 12;
                        const months = years * 12;
                        const sip = editingGoal.targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
                        return Math.round(sip).toLocaleString('en-IN');
                      })()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" display="block">Priority:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {editingGoal.priority || 'Medium'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            sx={{ bgcolor: '#16a34a' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Continue Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            // Get selected goals data with full validation and sanitization
            const selectedGoalsData = availableGoals
              .filter(goal => selectedGoalIds.has(goal.id) && goal.hasData)
              .map((goal, index) => {
                console.log(`🔍 [GoalSelectionPanel] Validating goal ${index + 1}:`, goal);
                
                // Sanitize and validate all goal properties with proper defaults
                const sanitizedGoal = {
                  id: goal.id || `goal-${Date.now()}-${index}`,
                  title: goal.title || 'Untitled Goal',
                  description: goal.description || 'No description provided',
                  icon: goal.icon || '🎯',
                  targetAmount: Number(goal.targetAmount) || 0,
                  targetYear: Number(goal.targetYear) || (new Date().getFullYear() + 5),
                  priority: goal.priority || 'Medium',
                  hasData: Boolean(goal.hasData),
                  source: goal.source || 'unknown',
                  originalClientGoal: goal.originalClientGoal || null,
                  type: goal.originalClientGoal?.type || goal.type || 'custom'
                };
                
                // Additional validation
                if (sanitizedGoal.targetAmount <= 0) {
                  console.warn(`⚠️ [GoalSelectionPanel] Goal ${sanitizedGoal.title} has invalid targetAmount: ${goal.targetAmount}, using default`);
                  sanitizedGoal.targetAmount = 1000000; // Default 10L
                }
                
                if (sanitizedGoal.targetYear <= new Date().getFullYear()) {
                  console.warn(`⚠️ [GoalSelectionPanel] Goal ${sanitizedGoal.title} has invalid targetYear: ${goal.targetYear}, using default`);
                  sanitizedGoal.targetYear = new Date().getFullYear() + 5;
                }
                
                console.log(`✅ [GoalSelectionPanel] Sanitized goal ${index + 1}:`, sanitizedGoal);
                return sanitizedGoal;
              });
            
            // Final validation before sending to next step
            console.log('📤 [GoalSelectionPanel] Sending sanitized goals to AI planning:', {
              goalCount: selectedGoalsData.length,
              totalTargetAmount: selectedGoalsData.reduce((sum, g) => sum + g.targetAmount, 0),
              sources: selectedGoalsData.map(g => g.source),
              allHaveValidAmounts: selectedGoalsData.every(g => g.targetAmount > 0),
              allHaveValidYears: selectedGoalsData.every(g => g.targetYear > new Date().getFullYear()),
              goalSummary: selectedGoalsData.map(g => ({
                title: g.title,
                amount: g.targetAmount,
                year: g.targetYear,
                source: g.source
              }))
            });
            
            if (onContinue) {
              onContinue(selectedGoalsData);
            }
          }}
          disabled={selectedGoalIds.size === 0}
          sx={{
            bgcolor: selectedGoalIds.size > 0 ? '#16a34a' : '#d1d5db',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '16px',
            '&:hover': {
              bgcolor: selectedGoalIds.size > 0 ? '#15803d' : '#d1d5db'
            },
            '&:disabled': {
              bgcolor: '#d1d5db',
              color: '#9ca3af'
            }
          }}
        >
          Continue to Planning
        </Button>
        
        {selectedGoalIds.size === 0 && (
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            Please select at least one goal to continue
          </Typography>
        )}
        
        {selectedGoalIds.size > 0 && (
          <Typography variant="body2" sx={{ color: '#16a34a', mt: 1 }}>
            {selectedGoalIds.size} goal{selectedGoalIds.size !== 1 ? 's' : ''} selected for AI-powered planning
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default GoalSelectionPanel;