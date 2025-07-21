import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepIcon
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule
} from '@mui/icons-material';

const ProgressIndicator = ({ 
  type = 'linear', // 'linear', 'circular', 'stepper'
  value, 
  max = 100,
  label,
  steps = [],
  activeStep = 0,
  showPercentage = true,
  color = 'primary',
  size = 'medium',
  variant = 'determinate',
  thickness = 6,
  sx = {}
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const getProgressColor = () => {
    if (percentage >= 80) return 'success.main';
    if (percentage >= 60) return 'warning.main';
    if (percentage >= 40) return 'info.main';
    return 'error.main';
  };

  if (type === 'stepper') {
    return (
      <Box sx={sx}>
        {label && (
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
        )}
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={index} completed={index < activeStep}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  completed ? <CheckCircle color="success" /> :
                  active ? <Schedule color="primary" /> :
                  <RadioButtonUnchecked color="disabled" />
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  }

  if (type === 'circular') {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        sx={sx}
      >
        {label && (
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
        )}
        <Box position="relative" display="inline-flex">
          <CircularProgress
            variant={variant}
            value={percentage}
            size={size === 'small' ? 40 : size === 'large' ? 80 : 60}
            thickness={thickness}
            sx={{ color: getProgressColor() }}
          />
          {showPercentage && (
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography 
                variant={size === 'small' ? 'caption' : 'body2'} 
                component="div" 
                color="text.secondary"
              >
                {`${Math.round(percentage)}%`}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Linear progress (default)
  return (
    <Box sx={sx}>
      {label && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2">
            {label}
          </Typography>
          {showPercentage && (
            <Typography variant="body2" color="text.secondary">
              {Math.round(percentage)}%
            </Typography>
          )}
        </Box>
      )}
      
      <LinearProgress
        variant={variant}
        value={percentage}
        sx={{
          height: size === 'small' ? 4 : size === 'large' ? 12 : 8,
          borderRadius: size === 'small' ? 2 : size === 'large' ? 6 : 4,
          backgroundColor: 'grey.300',
          '& .MuiLinearProgress-bar': {
            backgroundColor: getProgressColor()
          }
        }}
      />
      
      {value !== undefined && max !== undefined && (
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="caption" color="text.secondary">
            {value} / {max}
          </Typography>
          <Chip
            label={
              percentage >= 100 ? 'Complete' :
              percentage >= 75 ? 'Almost There' :
              percentage >= 50 ? 'Good Progress' :
              percentage >= 25 ? 'Getting Started' : 'Just Started'
            }
            size="small"
            color={
              percentage >= 100 ? 'success' :
              percentage >= 75 ? 'info' :
              percentage >= 50 ? 'warning' : 'default'
            }
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};

export default ProgressIndicator;