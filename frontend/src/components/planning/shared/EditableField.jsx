import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';

const EditableField = ({
  label,
  value,
  type = 'text',
  options = [],
  format,
  onSave,
  disabled = false,
  multiline = false,
  rows = 1,
  prefix = '',
  suffix = '',
  placeholder = '',
  variant = 'standard'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const formatValue = (val) => {
    if (format === 'currency') {
      return val ? `₹${parseInt(val).toLocaleString('en-IN')}` : '₹0';
    }
    if (format === 'percentage') {
      return val ? `${parseFloat(val).toFixed(1)}%` : '0%';
    }
    if (format === 'date') {
      return val ? new Date(val).toLocaleDateString('en-IN') : 'Not set';
    }
    return val || 'Not set';
  };

  const displayValue = formatValue(value);

  if (!isEditing) {
    return (
      <Box display="flex" alignItems="center" justifyContent="space-between" py={1}>
        <Box>
          {label && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {label}
            </Typography>
          )}
          <Typography variant="body1">
            {prefix}{displayValue}{suffix}
          </Typography>
        </Box>
        {!disabled && (
          <IconButton size="small" onClick={handleEdit}>
            <Edit fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="end" gap={1} py={1}>
      <Box flex={1}>
        {type === 'select' && options.length > 0 ? (
          <FormControl fullWidth variant={variant} size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              label={label}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            label={label}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            type={type}
            multiline={multiline}
            rows={multiline ? rows : 1}
            variant={variant}
            size="small"
            placeholder={placeholder}
            InputProps={{
              startAdornment: prefix,
              endAdornment: suffix
            }}
          />
        )}
      </Box>
      
      <IconButton size="small" onClick={handleSave} color="primary">
        <Save fontSize="small" />
      </IconButton>
      
      <IconButton size="small" onClick={handleCancel}>
        <Cancel fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default EditableField;