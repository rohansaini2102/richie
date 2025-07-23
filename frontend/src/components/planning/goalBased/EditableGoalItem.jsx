import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  IconButton,
  Button,
  Chip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore,
  TrendingUp,
  AccessTime,
  MonetizationOn
} from '@mui/icons-material';
import { formatCurrency, formatLargeAmount } from './utils/goalFormatters';
import { calculateRequiredSIP, getAssetAllocation } from './utils/goalCalculations';

const EditableGoalItem = ({ 
  goal, 
  index, 
  onUpdate, 
  onRemove, 
  clientAge = 30  // eslint-disable-line no-unused-vars
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState(goal);
  const [expanded, setExpanded] = useState(false);

  console.log('🎯 [EditableGoalItem] Rendering goal item:', {
    goalId: goal.id,
    goalTitle: goal.title,
    index,
    isEditing,
    hasOnUpdate: !!onUpdate,
    hasOnRemove: !!onRemove
  });

  const handleStartEdit = () => {
    setEditedGoal({ ...goal });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate(editedGoal);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedGoal({ ...goal });
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedGoal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate metrics for the goal
  const currentYear = new Date().getFullYear();
  const yearsToGoal = (goal.targetYear || currentYear + 5) - currentYear;
  const requiredSIP = calculateRequiredSIP(goal.targetAmount || 0, yearsToGoal);
  const assetAllocation = getAssetAllocation(yearsToGoal, 'Moderate');

  return (
    <Card sx={{ mb: 2, border: '1px solid #e2e8f0' }}>
      <CardContent>
        {/* Header with Goal Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {goal.icon} Goal {index}: {goal.title}
            </Typography>
            <Chip
              size="small"
              label={goal.priority || 'Medium'}
              color={goal.priority === 'High' ? 'error' : goal.priority === 'Low' ? 'success' : 'warning'}
              sx={{ fontSize: '11px' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isEditing ? (
              <>
                <IconButton size="small" onClick={handleStartEdit}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={onRemove} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton size="small" onClick={handleSaveEdit} color="primary">
                  <SaveIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleCancelEdit}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Goal Summary */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonetizationOn fontSize="small" color="primary" />
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Target Amount
                </Typography>
                {isEditing ? (
                  <TextField
                    size="small"
                    type="number"
                    value={editedGoal.targetAmount || ''}
                    onChange={(e) => handleFieldChange('targetAmount', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    sx={{ width: 140 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(goal.targetAmount || 0)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime fontSize="small" color="primary" />
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Target Year
                </Typography>
                {isEditing ? (
                  <TextField
                    size="small"
                    type="number"
                    value={editedGoal.targetYear || ''}
                    onChange={(e) => handleFieldChange('targetYear', parseInt(e.target.value) || currentYear + 5)}
                    InputProps={{
                      inputProps: { min: currentYear, max: currentYear + 50 }
                    }}
                    sx={{ width: 100 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {goal.targetYear || 'Not set'} ({yearsToGoal} years)
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp fontSize="small" color="success" />
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Required Monthly SIP
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(requiredSIP)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Goal Description */}
        {goal.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {goal.description}
          </Typography>
        )}

        {/* Advanced Configuration */}
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Advanced Configuration & Investment Strategy
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Asset Allocation */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  📊 Recommended Asset Allocation
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Equity:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {assetAllocation.equity}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Debt:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {assetAllocation.debt}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Expected Return:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {assetAllocation.expectedReturn}% p.a.
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Investment Timeline */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  ⏱️ Investment Timeline
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 1, border: '1px solid #bae6fd' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Time Horizon:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {yearsToGoal} years
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Risk Level:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {yearsToGoal > 7 ? 'Moderate' : yearsToGoal > 3 ? 'Conservative' : 'Low Risk'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Strategy:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {yearsToGoal > 7 ? 'Growth Focused' : yearsToGoal > 3 ? 'Balanced' : 'Capital Preservation'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Milestone Projections */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  📈 Investment Milestones
                </Typography>
                <Grid container spacing={2}>
                  {[0.25, 0.5, 0.75, 1.0].map((milestone, idx) => (
                    <Grid item xs={3} key={idx}>
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: '#fef3c7', 
                        borderRadius: 1, 
                        border: '1px solid #fcd34d',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {milestone * 100}% Target
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatLargeAmount((goal.targetAmount || 0) * milestone)}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Year {Math.ceil(yearsToGoal * milestone)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>

            {/* Warnings */}
            {yearsToGoal < 3 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⚠️ Short timeline alert: With only {yearsToGoal} years to achieve this goal, 
                  consider increasing the SIP amount or extending the timeline for better results.
                </Typography>
              </Alert>
            )}

            {requiredSIP > 50000 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  💡 High SIP requirement: This goal requires ₹{formatLargeAmount(requiredSIP)} monthly investment. 
                  Consider breaking it into smaller goals or extending the timeline.
                </Typography>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default EditableGoalItem;