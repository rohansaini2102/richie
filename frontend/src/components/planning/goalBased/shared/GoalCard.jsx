import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { 
  formatCurrency, 
  formatLargeAmount, 
  getGoalDisplayInfo, 
  formatGoalTimeline,
  getGoalStatus 
} from '../utils/goalFormatters';

const GoalCard = ({ 
  goal, 
  onEdit, 
  onDelete, 
  showActions = true,
  compact = false 
}) => {
  const displayInfo = getGoalDisplayInfo(goal.type);
  const status = getGoalStatus(goal);
  
  // Calculate progress if goal has current and target amounts
  const progress = goal.currentAmount && goal.targetAmount 
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <Card 
      sx={{
        height: '100%',
        border: `1px solid ${displayInfo.color}20`,
        bgcolor: displayInfo.bgColor,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: showActions ? 'translateY(-2px)' : 'none',
          boxShadow: 2
        }
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ mr: 1 }}>
              {displayInfo.icon}
            </Typography>
            <Box>
              <Typography 
                variant={compact ? 'subtitle2' : 'h6'} 
                sx={{ fontWeight: 700, color: displayInfo.color }}
              >
                {goal.name || displayInfo.title}
              </Typography>
              {goal.priority && (
                <Chip 
                  label={goal.priority} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.75rem',
                    height: 20,
                    bgcolor: goal.priority === 'High' ? '#fee2e2' : 
                             goal.priority === 'Medium' ? '#fef3c7' : '#f0fdf4',
                    color: goal.priority === 'High' ? '#dc2626' : 
                           goal.priority === 'Medium' ? '#d97706' : '#16a34a'
                  }} 
                />
              )}
            </Box>
          </Box>
          
          {showActions && (
            <Box>
              <IconButton 
                size="small" 
                onClick={() => onEdit?.(goal)}
                sx={{ color: displayInfo.color, mr: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => onDelete?.(goal)}
                sx={{ color: '#dc2626' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Goal Details */}
        <Box sx={{ mb: 2 }}>
          {goal.targetAmount && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Target Amount
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                {formatLargeAmount(goal.targetAmount)}
              </Typography>
            </Box>
          )}
          
          {goal.targetYear && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Target Year
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 16, color: '#6b7280', mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                  {goal.targetYear}
                </Typography>
              </Box>
            </Box>
          )}
          
          {goal.monthlySIP && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Monthly SIP
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                {formatCurrency(goal.monthlySIP)}
              </Typography>
            </Box>
          )}
          
          {goal.timeInYears && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Timeline
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                {formatGoalTimeline(new Date().getFullYear(), goal.targetYear)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress Bar */}
        {progress > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                {progress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#f3f4f6',
                '& .MuiLinearProgress-bar': {
                  bgcolor: displayInfo.color,
                  borderRadius: 3
                }
              }}
            />
          </Box>
        )}

        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            icon={status.status === 'on-track' ? <CheckCircleIcon /> : undefined}
            label={status.label}
            size="small"
            sx={{
              bgcolor: status.status === 'on-track' ? '#dcfce7' : 
                       status.status === 'challenging' ? '#fef3c7' : '#fee2e2',
              color: status.status === 'on-track' ? '#166534' : 
                     status.status === 'challenging' ? '#92400e' : '#dc2626',
              fontWeight: 600
            }}
          />
          
          {goal.expectedReturn && (
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Expected: {goal.expectedReturn}% p.a.
            </Typography>
          )}
        </Box>

        {/* Description */}
        {goal.description && !compact && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280', 
              mt: 2, 
              fontStyle: 'italic',
              lineHeight: 1.4
            }}
          >
            {goal.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalCard;