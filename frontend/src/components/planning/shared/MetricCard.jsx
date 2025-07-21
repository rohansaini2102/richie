import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { Info } from '@mui/icons-material';

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  subtitle, 
  tooltip, 
  progress, 
  progressColor,
  chip,
  onClick,
  sx = {} 
}) => {
  const handleCardClick = () => {
    if (onClick) onClick();
  };

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 3
        } : {},
        ...sx 
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography 
                color="text.secondary" 
                gutterBottom 
                variant="body2"
                sx={{ mb: 0 }}
              >
                {title}
              </Typography>
              {tooltip && (
                <Tooltip title={tooltip}>
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            <Typography 
              variant="h5" 
              color={`${color}.main`}
              sx={{ mb: subtitle || progress !== undefined ? 1 : 0 }}
            >
              {value}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            
            {progress !== undefined && (
              <Box mt={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: progressColor || `${color}.main`
                    }
                  }}
                />
              </Box>
            )}
            
            {chip && (
              <Box mt={1}>
                <Chip
                  label={chip.label}
                  color={chip.color}
                  size="small"
                  icon={chip.icon}
                  variant={chip.variant || 'filled'}
                />
              </Box>
            )}
          </Box>
          
          {icon && (
            <Box sx={{ color: `${color}.main`, ml: 2 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricCard;