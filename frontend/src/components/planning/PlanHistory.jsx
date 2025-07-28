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
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Archive,
  ContentCopy,
  PictureAsPdf,
  Schedule,
  CheckCircle,
  Warning,
  ExpandMore,
  ExpandLess,
  Visibility,
  History
} from '@mui/icons-material';
import { planAPI } from '../../services/api';
import { format } from 'date-fns';
import { GoalPlanPDFGenerator } from '../planning/goalBased/GoalPlanPDFGenerator';
import axios from 'axios';

const PlanHistory = ({ clientId, onSelectPlan }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [storedPDFs, setStoredPDFs] = useState({});
  const [loadingPDFs, setLoadingPDFs] = useState(new Set());

  useEffect(() => {
    fetchPlans();
  }, [clientId]);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch stored PDFs for a plan
  const fetchStoredPDFs = async (planId) => {
    if (storedPDFs[planId] || loadingPDFs.has(planId)) {
      return; // Already loaded or loading
    }

    setLoadingPDFs(prev => new Set([...prev, planId]));
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/plans/${planId}/pdf/all`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setStoredPDFs(prev => ({
          ...prev,
          [planId]: response.data.reports
        }));
      }
    } catch (err) {
      console.error('Error fetching stored PDFs:', err);
    } finally {
      setLoadingPDFs(prev => {
        const newSet = new Set(prev);
        newSet.delete(planId);
        return newSet;
      });
    }
  };

  // View a stored PDF
  const viewStoredPDF = async (planId, reportId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/plans/${planId}/pdf/report/${reportId}`,
        { 
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );
      
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
    } catch (err) {
      console.error('❌ [PlanHistory] Error viewing stored PDF:', err);
      alert('Failed to view PDF report. Please try again.');
    }
  };

  // Toggle expanded row and fetch PDFs if needed
  const handleToggleExpand = (planId) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (expandedRows.has(planId)) {
      newExpandedRows.delete(planId);
    } else {
      newExpandedRows.add(planId);
      fetchStoredPDFs(planId); // Fetch PDFs when expanding
    }
    
    setExpandedRows(newExpandedRows);
  };

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

  const handleViewPlan = async () => {
    if (selectedPlan) {
      try {
        console.log('📄 [PlanHistory] Starting PDF generation for View Plan:', selectedPlan._id);
        
        // Fetch complete plan data with client information
        const planData = await planAPI.getPlanById(selectedPlan._id);
        const clientData = await planAPI.getClientById(selectedPlan.clientId);
        
        console.log('📊 [PlanHistory] Plan data fetched for View:', {
          planType: planData.planType,
          hasGoals: !!planData.data?.goals,
          goalsCount: planData.data?.goals?.length || 0,
          clientName: `${clientData.firstName} ${clientData.lastName}`
        });

        // Prepare data for PDF generation
        const pdfData = {
          clientData: clientData,
          editedGoals: planData.data?.goals || [],
          recommendations: planData.data?.goalRecommendations || planData.aiRecommendations?.goalAnalysis || null,
          metrics: {
            totalGoals: (planData.data?.goals || []).length,
            totalRequiredSIP: (planData.data?.goals || []).reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0),
            availableSurplus: (clientData.totalMonthlyIncome || 0) - (clientData.totalMonthlyExpenses || 0),
            feasible: true
          },
          cacheInfo: {
            planId: selectedPlan._id,
            planType: selectedPlan.planType,
            generatedAt: new Date()
          }
        };

        // Get advisor data from localStorage
        const getAdvisorData = () => {
          try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user ? {
              firstName: user.firstName,
              lastName: user.lastName,
              firmName: user.firmName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              sebiRegNumber: user.sebiRegNumber
            } : null;
          } catch (error) {
            console.error('Error getting advisor data:', error);
            return null;
          }
        };

        // Generate PDF using frontend generator
        const generator = new GoalPlanPDFGenerator();
        const doc = generator.generatePDF({
          ...pdfData,
          advisorData: getAdvisorData()
        });
        
        // Open PDF in new tab for viewing
        const pdfBlob = doc.output('blob');
        const pdfURL = URL.createObjectURL(pdfBlob);
        window.open(pdfURL, '_blank');
        
        // Clean up URL after delay
        setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
        
        console.log('✅ [PlanHistory] PDF generated and opened for viewing');
      } catch (err) {
        console.error('❌ [PlanHistory] Error generating PDF for view:', err);
        alert('Failed to generate PDF report. Please try again.');
      }
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
        console.log('📄 [PlanHistory] Starting frontend PDF generation for plan:', selectedPlan._id);
        
        // Fetch complete plan data with client information
        const planData = await planAPI.getPlanById(selectedPlan._id);
        const clientData = await planAPI.getClientById(selectedPlan.clientId);
        
        console.log('📊 [PlanHistory] Plan data fetched:', {
          planType: planData.planType,
          hasGoals: !!planData.data?.goals,
          goalsCount: planData.data?.goals?.length || 0,
          clientName: `${clientData.firstName} ${clientData.lastName}`
        });

        // Prepare data for PDF generation
        const pdfData = {
          clientData: clientData,
          editedGoals: planData.data?.goals || [],
          recommendations: planData.data?.goalRecommendations || planData.aiRecommendations?.goalAnalysis || null,
          metrics: {
            totalGoals: (planData.data?.goals || []).length,
            totalRequiredSIP: (planData.data?.goals || []).reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0),
            availableSurplus: (clientData.totalMonthlyIncome || 0) - (clientData.totalMonthlyExpenses || 0),
            feasible: true
          },
          cacheInfo: {
            planId: selectedPlan._id,
            planType: selectedPlan.planType,
            generatedAt: new Date()
          }
        };

        // Get advisor data from localStorage
        const getAdvisorData = () => {
          try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user ? {
              firstName: user.firstName,
              lastName: user.lastName,
              firmName: user.firmName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              sebiRegNumber: user.sebiRegNumber
            } : null;
          } catch (error) {
            console.error('Error getting advisor data:', error);
            return null;
          }
        };

        // Generate PDF using frontend generator
        const generator = new GoalPlanPDFGenerator();
        const doc = generator.generatePDF({
          ...pdfData,
          advisorData: getAdvisorData()
        });
        
        // Download the PDF
        const fileName = `${selectedPlan.planType}_Plan_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        console.log('✅ [PlanHistory] PDF generated and downloaded successfully:', fileName);
      } catch (err) {
        console.error('❌ [PlanHistory] Error generating PDF:', err);
        // Show error to user - you might want to add proper error handling/toast here
        alert('Failed to generate PDF report. Please try again.');
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
                <TableCell></TableCell>
                <TableCell>Plan Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Next Review</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Stored PDFs</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => (
                <React.Fragment key={plan._id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(plan._id)}
                      >
                        {expandedRows.has(plan._id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
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
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {storedPDFs[plan._id]?.length || 0} PDFs
                        </Typography>
                      </Box>
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
                  
                  {/* Expandable row for stored PDFs */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                      <Collapse in={expandedRows.has(plan._id)} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Stored PDF Reports
                          </Typography>
                          
                          {loadingPDFs.has(plan._id) ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : storedPDFs[plan._id]?.length > 0 ? (
                            <List dense>
                              {storedPDFs[plan._id].map((pdf) => (
                                <ListItem
                                  key={pdf.id}
                                  secondaryAction={
                                    <IconButton 
                                      edge="end" 
                                      aria-label="view"
                                      onClick={() => viewStoredPDF(plan._id, pdf.id)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  }
                                >
                                  <ListItemIcon>
                                    <PictureAsPdf color="error" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={pdf.fileName}
                                    secondary={
                                      <Box>
                                        <Typography variant="caption" display="block">
                                          Version {pdf.version} • {format(new Date(pdf.generatedAt), 'dd MMM yyyy, HH:mm')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {pdf.reportType} • {(pdf.fileSize / 1024).toFixed(1)} KB
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No stored PDF reports found for this plan.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
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
          <PictureAsPdf sx={{ mr: 1, fontSize: 20 }} />
          📄 Generate & View Report
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedPlan) {
            handleToggleExpand(selectedPlan._id);
          }
          handleMenuClose();
        }}>
          <History sx={{ mr: 1, fontSize: 20 }} />
          📋 View Stored PDFs
        </MenuItem>
        <MenuItem onClick={handleClonePlan}>
          <ContentCopy sx={{ mr: 1, fontSize: 20 }} />
          📄 Clone Plan
        </MenuItem>
        <MenuItem onClick={handleExportPlan}>
          <PictureAsPdf sx={{ mr: 1, fontSize: 20 }} />
          💾 Download Report
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleArchivePlan} disabled={selectedPlan?.status === 'archived'}>
          <Archive sx={{ mr: 1, fontSize: 20 }} />
          Archive Plan
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PlanHistory;