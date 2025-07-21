import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
  Divider,
  Chip
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Percent
} from '@mui/icons-material';

const EditableClientData = ({ clientData, onDataUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const saveEdit = (field) => {
    const value = field.includes('Monthly') || field.includes('Amount') 
      ? parseFloat(tempValue) || 0 
      : tempValue;
    
    const updatedData = { ...clientData, [field]: value };
    onDataUpdate(updatedData);
    setEditingField(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const renderEditableField = (field, label, value, isNumeric = false, prefix = '') => {
    const isEditing = editingField === field;
    
    return (
      <Box display="flex" alignItems="center" py={1}>
        <Typography variant="body2" sx={{ 
          fontWeight: 500, 
          color: '#374151', 
          flex: 1, 
          mr: 2 
        }}>
          {label}
        </Typography>
        
        {isEditing ? (
          <Box display="flex" alignItems="center" flex={1}>
            <TextField
              size="small"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              type={isNumeric ? 'number' : 'text'}
              autoFocus
              sx={{ flex: 1, mr: 1 }}
              InputProps={{
                startAdornment: prefix && (
                  <InputAdornment position="start">{prefix}</InputAdornment>
                ),
              }}
            />
            <IconButton 
              size="small" 
              onClick={() => saveEdit(field)}
              sx={{ color: '#16a34a', mr: 0.5 }}
            >
              <Save fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={cancelEdit}
              sx={{ color: '#ef4444' }}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" flex={1} justifyContent="flex-end">
            <Typography variant="body1" sx={{ 
              fontWeight: 600, 
              color: '#111827', 
              mr: 1 
            }}>
              {isNumeric && typeof value === 'number' ? formatCurrency(value) : value || 'Not provided'}
            </Typography>
            <IconButton 
              size="small"
              onClick={() => startEditing(field, value)}
              sx={{ color: '#6b7280' }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  const monthlySurplus = (clientData.totalMonthlyIncome || 0) - (clientData.totalMonthlyExpenses || 0);
  const savingsRate = clientData.totalMonthlyIncome > 0 
    ? ((monthlySurplus / clientData.totalMonthlyIncome) * 100).toFixed(1)
    : 0;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Personal Information */}
      <Paper sx={{ 
        p: 3, 
        mb: 2,
        border: '1px solid #e5e7eb',
        borderRadius: 2
      }}>
        <Box display="flex" alignItems="center" mb={2} pb={1} borderBottom="1px solid #e5e7eb">
          <Person sx={{ color: '#6b7280', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Personal Information
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderEditableField('firstName', 'First Name', clientData.firstName)}
            {renderEditableField('lastName', 'Last Name', clientData.lastName)}
            {renderEditableField('email', 'Email', clientData.email)}
            {renderEditableField('phoneNumber', 'Phone Number', clientData.phoneNumber)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderEditableField('panNumber', 'PAN Number', clientData.panNumber)}
            {renderEditableField('maritalStatus', 'Marital Status', clientData.maritalStatus)}
            {renderEditableField('numberOfDependents', 'Dependents', clientData.numberOfDependents, true)}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500, 
                color: '#374151', 
                flex: 1, 
                mr: 2 
              }}>
                Age
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 600, 
                color: '#111827' 
              }}>
                {calculateAge(clientData.dateOfBirth) || 'N/A'} years
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Summary */}
      <Paper sx={{ 
        p: 3,
        border: '1px solid #e5e7eb',
        borderRadius: 2
      }}>
        <Box display="flex" alignItems="center" mb={3} pb={1} borderBottom="1px solid #e5e7eb">
          <AttachMoney sx={{ color: '#6b7280', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Financial Summary
          </Typography>
        </Box>

        {/* Key Metrics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Box sx={{
              bgcolor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 1,
              p: 2,
              textAlign: 'center'
            }}>
              <TrendingUp sx={{ color: '#16a34a', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#15803d', mb: 1 }}>
                Monthly Income
              </Typography>
              <Typography variant="h6" sx={{ color: '#14532d', fontWeight: 700 }}>
                {formatCurrency(clientData.totalMonthlyIncome || 0)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 1,
              p: 2,
              textAlign: 'center'
            }}>
              <TrendingDown sx={{ color: '#dc2626', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#dc2626', mb: 1 }}>
                Monthly Expenses
              </Typography>
              <Typography variant="h6" sx={{ color: '#991b1b', fontWeight: 700 }}>
                {formatCurrency(clientData.totalMonthlyExpenses || 0)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{
              bgcolor: monthlySurplus >= 0 ? '#eff6ff' : '#fef2f2',
              border: monthlySurplus >= 0 ? '1px solid #bfdbfe' : '1px solid #fecaca',
              borderRadius: 1,
              p: 2,
              textAlign: 'center'
            }}>
              <TrendingUp sx={{ 
                color: monthlySurplus >= 0 ? '#2563eb' : '#dc2626', 
                mb: 1 
              }} />
              <Typography variant="body2" sx={{ 
                color: monthlySurplus >= 0 ? '#1e40af' : '#dc2626', 
                mb: 1 
              }}>
                Monthly Surplus
              </Typography>
              <Typography variant="h6" sx={{ 
                color: monthlySurplus >= 0 ? '#1e3a8a' : '#991b1b', 
                fontWeight: 700 
              }}>
                {formatCurrency(monthlySurplus)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{
              bgcolor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 1,
              p: 2,
              textAlign: 'center'
            }}>
              <Percent sx={{ color: '#6b7280', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                Savings Rate
              </Typography>
              <Typography variant="h6" sx={{ color: '#374151', fontWeight: 700 }}>
                {savingsRate}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Editable Financial Fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderEditableField(
              'totalMonthlyIncome', 
              'Monthly Income', 
              clientData.totalMonthlyIncome, 
              true,
              '₹'
            )}
            {renderEditableField(
              'incomeType', 
              'Income Type', 
              clientData.incomeType
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderEditableField(
              'totalMonthlyExpenses', 
              'Monthly Expenses', 
              clientData.totalMonthlyExpenses, 
              true,
              '₹'
            )}
            <Box display="flex" alignItems="center" py={1}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500, 
                color: '#374151', 
                flex: 1, 
                mr: 2 
              }}>
                Income Status
              </Typography>
              <Chip 
                label={monthlySurplus >= 0 ? 'Surplus' : 'Deficit'}
                size="small"
                sx={{
                  bgcolor: monthlySurplus >= 0 ? '#dcfce7' : '#fee2e2',
                  color: monthlySurplus >= 0 ? '#166534' : '#dc2626',
                  fontWeight: 600
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default EditableClientData;