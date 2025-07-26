import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { PictureAsPdf as PdfIcon, Download as DownloadIcon } from '@mui/icons-material';

/**
 * Simple PDF Generator using browser's print functionality
 * No external dependencies required
 */
const SimplePDFGenerator = ({ 
  clientData, 
  editedGoals, 
  recommendations, 
  metrics, 
  disabled = false 
}) => {

  const generatePrintableHTML = () => {
    const formatCurrency = (amount) => {
      if (!amount || amount === 0) return '₹0';
      return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
    };

    const calculateAge = (dateOfBirth) => {
      if (!dateOfBirth) return 'N/A';
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Goal-Based Financial Plan - ${clientData.firstName} ${clientData.lastName}</title>
        <style>
          @media print {
            @page { margin: 1in; size: A4; }
            body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
          .section { margin: 20px 0; }
          .section h2 { color: #0066cc; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .client-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .goals-table, .metrics-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .goals-table th, .goals-table td, .metrics-table th, .metrics-table td { 
            border: 1px solid #ddd; padding: 8px; text-align: left; 
          }
          .goals-table th, .metrics-table th { background-color: #0066cc; color: white; }
          .recommendation { background: #f0f8ff; padding: 10px; margin: 10px 0; border-left: 4px solid #0066cc; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GOAL-BASED FINANCIAL PLAN</h1>
          <p>Comprehensive Investment Strategy Report</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div class="section">
          <h2>Client Information</h2>
          <div class="client-info">
            <table class="metrics-table">
              <tr><td><strong>Name:</strong></td><td>${clientData.firstName} ${clientData.lastName}</td></tr>
              <tr><td><strong>Age:</strong></td><td>${calculateAge(clientData.dateOfBirth)} years</td></tr>
              <tr><td><strong>Risk Tolerance:</strong></td><td>${clientData.riskTolerance || 'Moderate'}</td></tr>
              <tr><td><strong>Monthly Income:</strong></td><td>${formatCurrency(clientData.totalMonthlyIncome)}</td></tr>
              <tr><td><strong>Monthly Expenses:</strong></td><td>${formatCurrency(clientData.totalMonthlyExpenses)}</td></tr>
              <tr><td><strong>Occupation:</strong></td><td>${clientData.occupation || 'Not specified'}</td></tr>
            </table>
          </div>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <table class="metrics-table">
            <tr><td><strong>Total Financial Goals:</strong></td><td>${metrics?.totalGoals || 0}</td></tr>
            <tr><td><strong>Required Monthly SIP:</strong></td><td>${formatCurrency(metrics?.totalRequiredSIP || 0)}</td></tr>
            <tr><td><strong>Available Monthly Surplus:</strong></td><td>${formatCurrency(metrics?.availableSurplus || 0)}</td></tr>
            <tr><td><strong>Plan Feasibility:</strong></td><td>${metrics?.feasible ? '✓ Achievable' : '⚠ Requires Adjustment'}</td></tr>
          </table>
        </div>

        <div class="section page-break">
          <h2>Goals Analysis & SIP Requirements</h2>
          ${editedGoals && editedGoals.length > 0 ? `
            <table class="goals-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Goal</th>
                  <th>Target Amount</th>
                  <th>Target Year</th>
                  <th>Time Horizon</th>
                  <th>Monthly SIP</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                ${editedGoals.map((goal, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${goal.title || 'Unnamed Goal'}</td>
                    <td>${formatCurrency(goal.targetAmount || 0)}</td>
                    <td>${goal.targetYear || 'TBD'}</td>
                    <td>${goal.timeInYears || 'TBD'} years</td>
                    <td>${formatCurrency(goal.monthlySIP || 0)}</td>
                    <td>${goal.priority || 'Medium'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h3>Detailed Goal Breakdown</h3>
            ${editedGoals.map((goal, index) => `
              <div class="recommendation">
                <h4>${index + 1}. ${goal.title || 'Unnamed Goal'}</h4>
                <ul>
                  <li><strong>Target Amount:</strong> ${formatCurrency(goal.targetAmount || 0)}</li>
                  <li><strong>Time Horizon:</strong> ${goal.timeInYears || 'TBD'} years (Target: ${goal.targetYear || 'TBD'})</li>
                  <li><strong>Required Monthly SIP:</strong> ${formatCurrency(goal.monthlySIP || 0)}</li>
                  <li><strong>Expected Return:</strong> ${goal.assetAllocation?.expectedReturn || 8}% per annum</li>
                  <li><strong>Risk Level:</strong> ${goal.assetAllocation?.riskLevel || 'Medium'}</li>
                  <li><strong>Asset Allocation:</strong> ${goal.assetAllocation ? `${goal.assetAllocation.equity}% Equity, ${goal.assetAllocation.debt}% Debt` : 'TBD'}</li>
                </ul>
              </div>
            `).join('')}
          ` : '<p>No financial goals have been defined.</p>'}
        </div>

        ${recommendations ? `
          <div class="section page-break">
            <h2>🤖 AI-Powered Financial Analysis</h2>
            
            ${recommendations.individualGoalAnalysis && recommendations.individualGoalAnalysis.length > 0 ? `
              <div class="recommendation">
                <h3>📊 Individual Goal Analysis</h3>
                ${recommendations.individualGoalAnalysis.map(goal => `
                  <div style="border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px;">
                    <table class="metrics-table">
                      <tr>
                        <td colspan="2" style="background: #0066cc; color: white; font-weight: bold;">
                          ${goal.goalName} - Feasibility: ${goal.analysis?.feasibility || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Required Monthly SIP:</strong></td>
                        <td>${formatCurrency(goal.analysis?.requiredMonthlySIP || 0)}</td>
                      </tr>
                      <tr>
                        <td><strong>Expected Return:</strong></td>
                        <td>${goal.analysis?.expectedReturn || 'N/A'}%</td>
                      </tr>
                      <tr>
                        <td><strong>Asset Allocation:</strong></td>
                        <td>
                          Equity: ${goal.analysis?.recommendedAssetAllocation?.equity || 0}% | 
                          Debt: ${goal.analysis?.recommendedAssetAllocation?.debt || 0}%
                        </td>
                      </tr>
                    </table>
                    
                    ${goal.fundRecommendations && goal.fundRecommendations.length > 0 ? `
                      <h4>📈 Fund Recommendations</h4>
                      <table class="metrics-table">
                        <thead>
                          <tr style="background: #f8f9fa;">
                            <th>Fund Name</th>
                            <th>Monthly Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${goal.fundRecommendations.map(fund => `
                            <tr>
                              <td>${fund.fundName || 'N/A'}</td>
                              <td>${formatCurrency(fund.monthlyAmount || 0)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${recommendations.multiGoalOptimization ? `
              <div class="recommendation page-break">
                <h3>🎯 Multi-Goal Strategy Optimization</h3>
                
                <table class="metrics-table">
                  <tr style="background: ${recommendations.multiGoalOptimization.feasibilityStatus === 'All achievable' ? '#d4edda' : '#fff3cd'};">
                    <td><strong>Total Required SIP:</strong></td>
                    <td>${formatCurrency(recommendations.multiGoalOptimization.totalRequiredSIP || 0)}</td>
                  </tr>
                  <tr style="background: ${recommendations.multiGoalOptimization.feasibilityStatus === 'All achievable' ? '#d4edda' : '#fff3cd'};">
                    <td><strong>Available Surplus:</strong></td>
                    <td>${formatCurrency(recommendations.multiGoalOptimization.availableSurplus || 0)}</td>
                  </tr>
                  <tr style="background: ${recommendations.multiGoalOptimization.feasibilityStatus === 'All achievable' ? '#d4edda' : '#fff3cd'};">
                    <td><strong>Feasibility Status:</strong></td>
                    <td><strong>${recommendations.multiGoalOptimization.feasibilityStatus || 'N/A'}</strong></td>
                  </tr>
                </table>

                ${recommendations.multiGoalOptimization.phaseStrategy && recommendations.multiGoalOptimization.phaseStrategy.length > 0 ? `
                  <h4>📅 Phase-wise Implementation Strategy</h4>
                  ${recommendations.multiGoalOptimization.phaseStrategy.map(phase => `
                    <div style="border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 5px;">
                      <h5>${phase.phase} (${phase.duration})</h5>
                      <p><strong>Strategy:</strong> ${phase.strategy}</p>
                      <p><strong>Monthly Allocation:</strong> ${formatCurrency(phase.monthlyAllocation || 0)}</p>
                    </div>
                  `).join('')}
                ` : ''}

                ${recommendations.multiGoalOptimization.conflicts && recommendations.multiGoalOptimization.conflicts.length > 0 ? `
                  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h4>⚠️ Conflicts Detected</h4>
                    ${recommendations.multiGoalOptimization.conflicts.map(conflict => `
                      <div style="margin: 10px 0;">
                        <p><strong>${conflict.type}:</strong> ${conflict.description}</p>
                        <p><strong>Resolution:</strong> ${conflict.resolution}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${recommendations.recommendations?.immediateActions && recommendations.recommendations.immediateActions.length > 0 ? `
              <div class="recommendation">
                <h3>⚡ Immediate Actions Required</h3>
                <ol>
                  ${recommendations.recommendations.immediateActions.map(action => `
                    <li style="margin: 8px 0;">${action}</li>
                  `).join('')}
                </ol>
              </div>
            ` : ''}

            ${recommendations.riskAssessment ? `
              <div class="recommendation">
                <h3>🛡️ Risk Assessment</h3>
                <table class="metrics-table">
                  <tr style="background: ${
                    recommendations.riskAssessment.overallRisk === 'Low' ? '#d4edda' : 
                    recommendations.riskAssessment.overallRisk === 'Medium' ? '#fff3cd' : '#f8d7da'
                  };">
                    <td><strong>Overall Risk Level:</strong></td>
                    <td><strong>${recommendations.riskAssessment.overallRisk || 'N/A'}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Diversification Score:</strong></td>
                    <td>${recommendations.riskAssessment.diversificationScore || 'N/A'}/10</td>
                  </tr>
                </table>

                ${recommendations.riskAssessment.warnings && recommendations.riskAssessment.warnings.length > 0 ? `
                  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h4>⚠️ Risk Warnings</h4>
                    <ul>
                      ${recommendations.riskAssessment.warnings.map(warning => `
                        <li style="margin: 5px 0;">${warning}</li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${recommendations.investmentStrategy ? `
              <div class="recommendation">
                <h3>📈 Investment Strategy</h3>
                <p>${recommendations.investmentStrategy}</p>
              </div>
            ` : ''}

            ${recommendations.riskAnalysis ? `
              <div class="recommendation">
                <h3>📊 Risk Analysis</h3>
                <p>${recommendations.riskAnalysis}</p>
              </div>
            ` : ''}

            ${recommendations.keyRecommendations && Array.isArray(recommendations.keyRecommendations) ? `
              <div class="recommendation">
                <h3>🎯 Key Recommendations</h3>
                <ul>
                  ${recommendations.keyRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="section page-break">
          <h2>Implementation Timeline</h2>
          <div class="recommendation">
            <h3>Immediate Action Items</h3>
            <ol>
              <li>Open investment accounts with reputable mutual fund companies</li>
              <li>Set up systematic investment plans (SIPs) for each goal</li>
              <li>Review and rebalance portfolio annually</li>
              <li>Monitor progress quarterly</li>
              <li>Adjust contributions as income increases</li>
            </ol>
          </div>
        </div>

        <div class="footer">
          <p><strong>Important Disclaimers:</strong></p>
          <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
            <li>This financial plan is based on information provided and current market conditions.</li>
            <li>Past performance does not guarantee future results.</li>
            <li>All investments are subject to market risks.</li>
            <li>Please consult with a qualified financial advisor before making investment decisions.</li>
            <li>Review and update this plan regularly as your circumstances change.</li>
            <li>This report is generated by AI and should be used for guidance only.</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  };

  const handleGeneratePDF = () => {
    console.log('🎯 [Simple PDF] Generating PDF using browser print...');
    
    const printContent = generatePrintableHTML();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      console.log('✅ [Simple PDF] PDF print dialog opened');
    } else {
      console.error('❌ [Simple PDF] Could not open print window');
      alert('Please allow pop-ups to generate PDF');
    }
  };

  const handlePreview = () => {
    console.log('🎯 [Simple PDF] Opening preview...');
    
    const printContent = generatePrintableHTML();
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(printContent);
      previewWindow.document.close();
      console.log('✅ [Simple PDF] Preview opened');
    } else {
      console.error('❌ [Simple PDF] Could not open preview window');
      alert('Please allow pop-ups to preview PDF');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        📄 Generate Financial Plan Report
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Create a comprehensive financial plan report using your browser's print functionality.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={handlePreview}
          disabled={disabled || !clientData || !editedGoals?.length}
          sx={{ minWidth: 140 }}
        >
          Preview Report
        </Button>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleGeneratePDF}
          disabled={disabled || !clientData || !editedGoals?.length}
          sx={{ minWidth: 140 }}
        >
          Print/Save PDF
        </Button>
      </Box>

      {(!clientData || !editedGoals?.length) && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          Please define at least one goal to generate report.
        </Typography>
      )}
    </Paper>
  );
};

export default SimplePDFGenerator;