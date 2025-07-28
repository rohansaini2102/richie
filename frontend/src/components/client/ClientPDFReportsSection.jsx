import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FolderOpen as FolderIcon,
  Description as ReportIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { planAPI } from '../../services/api';
import axios from 'axios';

const ClientPDFReportsSection = ({ clientId, clientName, onOpenPlanModal }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    if (clientId) {
      loadClientReports();
    }
  }, [clientId]);

  // API helper functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Load all PDF reports for the client across all their plans
  const loadClientReports = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 [PDF Reports] Loading reports for client:', clientId);

      // First, get all plans for this client
      const plansResponse = await planAPI.getClientPlans(clientId);
      const clientPlans = plansResponse.plans || [];
      setPlans(clientPlans);

      console.log('📋 [PDF Reports] Found plans:', clientPlans.length);

      // Then, fetch PDF reports for each plan
      const allReports = [];
      
      for (const plan of clientPlans) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/plans/${plan._id}/pdf/all`,
            { headers: getAuthHeaders() }
          );
          
          if (response.data.success && response.data.reports) {
            // Add plan information to each report
            const reportsWithPlan = response.data.reports.map(report => ({
              ...report,
              planId: plan._id,
              planType: plan.planType,
              planStatus: plan.status,
              planCreatedAt: plan.createdAt
            }));
            allReports.push(...reportsWithPlan);
          }
        } catch (planError) {
          console.warn(`Failed to load reports for plan ${plan._id}:`, planError);
          // Continue with other plans even if one fails
        }
      }

      // Sort reports by generation date (newest first)
      allReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
      
      setReports(allReports);
      
      console.log('✅ [PDF Reports] Loaded reports:', {
        totalReports: allReports.length,
        reportTypes: [...new Set(allReports.map(r => r.reportType))]
      });

    } catch (error) {
      console.error('❌ [PDF Reports] Error loading reports:', error);
      setError('Failed to load PDF reports');
    } finally {
      setLoading(false);
    }
  };

  // View stored PDF
  const viewReport = async (report) => {
    try {
      console.log('👁️ [PDF Reports] Viewing report:', report.id);
      
      const response = await axios.get(
        `http://localhost:5000/api/plans/${report.planId}/pdf/report/${report.id}`,
        { 
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );

      // Create blob URL and open in new tab
      const pdfURL = URL.createObjectURL(response.data);
      window.open(pdfURL, '_blank');
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      
      console.log('✅ [PDF Reports] Report opened for viewing');
    } catch (error) {
      console.error('❌ [PDF Reports] Error viewing report:', error);
      setError('Failed to view PDF report');
    }
  };

  // Download stored PDF
  const downloadReport = async (report) => {
    try {
      console.log('⬇️ [PDF Reports] Downloading report:', report.fileName);
      
      const response = await axios.get(
        `http://localhost:5000/api/plans/${report.planId}/pdf/report/${report.id}`,
        { 
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );

      // Create download link
      const pdfURL = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = pdfURL;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(pdfURL);
      
      console.log('✅ [PDF Reports] Report downloaded:', report.fileName);
    } catch (error) {
      console.error('❌ [PDF Reports] Error downloading report:', error);
      setError('Failed to download PDF report');
    }
  };

  // Delete stored PDF
  const confirmDeleteReport = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const deleteReport = async () => {
    if (!reportToDelete) return;

    try {
      console.log('🗑️ [PDF Reports] Deleting report:', reportToDelete.id);
      
      const response = await axios.delete(
        `http://localhost:5000/api/plans/${reportToDelete.planId}/pdf/report/${reportToDelete.id}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        console.log('✅ [PDF Reports] Report deleted successfully');
        await loadClientReports(); // Refresh the list
        setDeleteDialogOpen(false);
        setReportToDelete(null);
      } else {
        throw new Error(response.data.error || 'Failed to delete report');
      }
    } catch (error) {
      console.error('❌ [PDF Reports] Error deleting report:', error);
      setError('Failed to delete PDF report');
    }
  };

  // Open plan creation modal for goal-based planning
  const handleGenerateNewReport = () => {
    if (onOpenPlanModal) {
      onOpenPlanModal();
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get report type display name
  const getReportTypeDisplay = (reportType) => {
    const typeMap = {
      'goal_based': 'Goal-Based Plan',
      'cash_flow': 'Cash Flow Plan',
      'hybrid': 'Hybrid Plan'
    };
    return typeMap[reportType] || reportType;
  };

  // Get status color for plan type
  const getReportTypeColor = (reportType) => {
    const colorMap = {
      'goal_based': 'primary',
      'cash_flow': 'secondary',
      'hybrid': 'success'
    };
    return colorMap[reportType] || 'default';
  };

  if (loading && reports.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          PDF Reports ({reports.length})
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleGenerateNewReport}
          sx={{ 
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }
          }}
        >
          Generate New Report
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : reports.length > 0 ? (
        <List>
          {reports.map((report, index) => (
            <React.Fragment key={report.id}>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PdfIcon color="error" />
                      <Typography variant="subtitle2" component="span">
                        {report.fileName}
                      </Typography>
                      <Chip
                        label={`v${report.version}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={getReportTypeDisplay(report.reportType)}
                        size="small"
                        color={getReportTypeColor(report.reportType)}
                        variant="filled"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 14 }} />
                          Generated: {new Date(report.generatedAt).toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          Size: {formatFileSize(report.fileSize)}
                        </Typography>
                      </Box>
                      
                      {report.metadata?.contentSummary && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Goals: {report.metadata.contentSummary.goalsCount || 0} | 
                          Total SIP: ₹{new Intl.NumberFormat('en-IN').format(report.metadata.contentSummary.totalSIPAmount || 0)} | 
                          AI Recommendations: {report.metadata.contentSummary.hasRecommendations ? 'Yes' : 'No'}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => viewReport(report)}
                      title="View PDF"
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => downloadReport(report)}
                      title="Download PDF"
                      color="success"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => confirmDeleteReport(report)}
                      title="Delete PDF"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < reports.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              No PDF reports found for {clientName}.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generate your first financial plan report to see it here.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete Report
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{reportToDelete?.fileName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The PDF report will be permanently removed from the database.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={deleteReport} color="error" variant="contained">
            Delete Report
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ClientPDFReportsSection;