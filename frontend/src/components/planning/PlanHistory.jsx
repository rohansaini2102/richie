import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Archive,
  ContentCopy,
  Download,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { planAPI } from '../../services/api';
import { format } from 'date-fns';

const PlanHistory = ({ clientId, onSelectPlan }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, [clientId]);

  const fetchPlans = async () => {
    try {
      const response = await planAPI.getClientPlans(clientId);
      setPlans(response.plans);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch plans');
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, plan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlan(null);
  };

  const handleViewPlan = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan._id);
    }
    handleMenuClose();
  };

  const handleArchivePlan = async () => {
    if (selectedPlan) {
      try {
        await planAPI.archivePlan(selectedPlan._id);
        fetchPlans(); // Refresh the list
      } catch (err) {
        console.error('Error archiving plan:', err);
      }
    }
    handleMenuClose();
  };

  const handleClonePlan = async () => {
    if (selectedPlan) {
      try {
        await planAPI.clonePlan(selectedPlan._id);
        fetchPlans(); // Refresh the list
      } catch (err) {
        console.error('Error cloning plan:', err);
      }
    }
    handleMenuClose();
  };

  const handleExportPlan = async () => {
    if (selectedPlan) {
      try {
        const response = await planAPI.exportPlanAsPDF(selectedPlan._id);
        // Handle PDF download
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `plan_${selectedPlan._id}.pdf`);
        document.body.appendChild(link);
        link.click();
      } catch (err) {
        console.error('Error exporting plan:', err);
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'completed':
        return 'info';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'draft':
        return <Schedule sx={{ fontSize: 16 }} />;
      case 'completed':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'archived':
        return <Archive sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getPlanTypeLabel = (type) => {
    switch (type) {
      case 'cash_flow':
        return 'Cash Flow Planning';
      case 'goal_based':
        return 'Goal Based Planning';
      case 'hybrid':
        return 'Hybrid Planning';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Financial Plans History
      </Typography>

      {plans.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No financial plans created yet for this client.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plan Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Next Review</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {getPlanTypeLabel(plan.planType)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.status}
                      color={getStatusColor(plan.status)}
                      size="small"
                      icon={getStatusIcon(plan.status)}
                    />
                  </TableCell>
                  <TableCell>v{plan.version}</TableCell>
                  <TableCell>
                    {format(new Date(plan.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(plan.updatedAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    {plan.reviewSchedule?.nextReviewDate ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {new Date(plan.reviewSchedule.nextReviewDate) < new Date() && (
                          <Warning color="warning" sx={{ fontSize: 16 }} />
                        )}
                        <Typography
                          variant="body2"
                          color={new Date(plan.reviewSchedule.nextReviewDate) < new Date() ? 'warning.main' : 'text.primary'}
                        >
                          {format(new Date(plan.reviewSchedule.nextReviewDate), 'dd MMM yyyy')}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.performanceMetrics?.adherenceScore ? (
                      <Box>
                        <Typography variant="body2">
                          {plan.performanceMetrics.adherenceScore}%
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, plan)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewPlan}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          View Plan
        </MenuItem>
        <MenuItem onClick={handleClonePlan}>
          <ContentCopy sx={{ mr: 1, fontSize: 20 }} />
          Clone Plan
        </MenuItem>
        <MenuItem onClick={handleExportPlan}>
          <Download sx={{ mr: 1, fontSize: 20 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={handleArchivePlan} disabled={selectedPlan?.status === 'archived'}>
          <Archive sx={{ mr: 1, fontSize: 20 }} />
          Archive Plan
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PlanHistory;