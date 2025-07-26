import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Box, Button, Typography, Paper } from '@mui/material';
import { PictureAsPdf as PdfIcon, Download as DownloadIcon } from '@mui/icons-material';

/**
 * Frontend PDF Generator for Goal-Based Financial Plans
 * Generates PDF directly in browser using available data without backend dependency
 */
class GoalPlanPDFGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.contentWidth = this.pageWidth - (2 * this.margin);
  }

  /**
   * Generate comprehensive goal-based financial plan PDF
   */
  generatePDF(data) {
    const { clientData, editedGoals, recommendations, metrics, cacheInfo } = data;
    
    console.log('🎯 [PDF Generator] Starting frontend PDF generation:', {
      clientName: `${clientData?.firstName} ${clientData?.lastName}`,
      goalsCount: editedGoals?.length || 0,
      hasRecommendations: !!recommendations,
      hasMetrics: !!metrics
    });

    const doc = new jsPDF();
    let currentY = this.margin;

    // 1. Cover Page
    currentY = this.addCoverPage(doc, clientData, currentY);
    
    // 2. Executive Summary
    doc.addPage();
    currentY = this.margin;
    currentY = this.addExecutiveSummary(doc, clientData, metrics, currentY);
    
    // 3. Client Profile
    currentY = this.addClientProfile(doc, clientData, currentY);
    
    // 4. Goals Analysis
    doc.addPage();
    currentY = this.margin;
    currentY = this.addGoalsAnalysis(doc, editedGoals, currentY);
    
    // 5. Financial Recommendations
    if (recommendations) {
      doc.addPage();
      currentY = this.margin;
      currentY = this.addRecommendations(doc, recommendations, currentY);
    }
    
    // 6. Implementation Timeline
    doc.addPage();
    currentY = this.margin;
    currentY = this.addImplementationTimeline(doc, editedGoals, currentY);
    
    // 7. Disclaimers
    currentY = this.addDisclaimers(doc, currentY);

    console.log('✅ [PDF Generator] PDF generated successfully');
    return doc;
  }

  /**
   * Add cover page with client details and plan summary
   */
  addCoverPage(doc, clientData, startY) {
    let y = startY + 40;
    
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('GOAL-BASED FINANCIAL PLAN', this.pageWidth / 2, y, { align: 'center' });
    
    y += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Investment Strategy Report', this.pageWidth / 2, y, { align: 'center' });
    
    y += 40;
    
    // Client Details Box
    doc.setDrawColor(0, 102, 204);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(this.margin, y, this.contentWidth, 60, 3, 3, 'FD');
    
    y += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT INFORMATION', this.margin + 10, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${clientData.firstName} ${clientData.lastName}`, this.margin + 10, y);
    
    y += 10;
    doc.text(`Age: ${this.calculateAge(clientData.dateOfBirth)} years`, this.margin + 10, y);
    
    y += 10;
    doc.text(`Risk Tolerance: ${clientData.riskTolerance || 'Moderate'}`, this.margin + 10, y);
    
    y += 10;
    doc.text(`Income: ₹${this.formatCurrency(clientData.totalMonthlyIncome || 0)}/month`, this.margin + 10, y);
    
    y += 30;
    
    // Report Details
    doc.setFontSize(12);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, this.margin, y);
    y += 10;
    doc.text(`Plan Type: Goal-Based Investment Planning`, this.margin, y);
    
    return y;
  }

  /**
   * Add executive summary with key metrics
   */
  addExecutiveSummary(doc, clientData, metrics, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', this.margin, y);
    y += 15;
    
    // Key Metrics Table
    const summaryData = [
      ['Total Financial Goals', `${metrics?.totalGoals || 0}`],
      ['Required Monthly SIP', `₹${this.formatCurrency(metrics?.totalRequiredSIP || 0)}`],
      ['Available Monthly Surplus', `₹${this.formatCurrency(metrics?.availableSurplus || 0)}`],
      ['Plan Feasibility', metrics?.feasible ? '✓ Achievable' : '⚠ Requires Adjustment'],
      ['Planning Horizon', `${this.getMaxTimelineYears(metrics)} years`]
    ];

    doc.autoTable({
      startY: y,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 11 }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Financial Health Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL HEALTH OVERVIEW', this.margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : 0;
    
    const healthText = [
      `• Monthly Income: ₹${this.formatCurrency(monthlyIncome)}`,
      `• Monthly Expenses: ₹${this.formatCurrency(monthlyExpenses)}`,
      `• Savings Rate: ${savingsRate}%`,
      `• Investment Capacity: ${metrics?.feasible ? 'Strong' : 'Needs Optimization'}`
    ];

    healthText.forEach(text => {
      doc.text(text, this.margin, y);
      y += 8;
    });

    return y + 10;
  }

  /**
   * Add detailed client profile
   */
  addClientProfile(doc, clientData, startY) {
    let y = startY + 15;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT PROFILE', this.margin, y);
    y += 15;

    // Personal Information
    const personalInfo = [
      ['Full Name', `${clientData.firstName} ${clientData.lastName}`],
      ['Date of Birth', new Date(clientData.dateOfBirth).toLocaleDateString('en-IN')],
      ['Age', `${this.calculateAge(clientData.dateOfBirth)} years`],
      ['Marital Status', clientData.maritalStatus || 'Not specified'],
      ['Occupation', clientData.occupation || 'Not specified'],
      ['Risk Tolerance', clientData.riskTolerance || 'Moderate']
    ];

    doc.autoTable({
      startY: y,
      head: [['Personal Information', '']],
      body: personalInfo,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10 }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Financial Summary
    const financialInfo = [
      ['Monthly Income', `₹${this.formatCurrency(clientData.totalMonthlyIncome || 0)}`],
      ['Monthly Expenses', `₹${this.formatCurrency(clientData.totalMonthlyExpenses || 0)}`],
      ['Annual Income', `₹${this.formatCurrency(clientData.annualIncome || 0)}`],
      ['Current Assets', `₹${this.formatCurrency(this.calculateTotalAssets(clientData.assets))}`],
      ['Total Liabilities', `₹${this.formatCurrency(this.calculateTotalLiabilities(clientData.debtsAndLiabilities))}`]
    ];

    doc.autoTable({
      startY: y,
      head: [['Financial Overview', '']],
      body: financialInfo,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10 }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add detailed goals analysis with SIP calculations
   */
  addGoalsAnalysis(doc, editedGoals, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GOALS ANALYSIS & SIP REQUIREMENTS', this.margin, y);
    y += 15;

    if (!editedGoals || editedGoals.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No financial goals have been defined.', this.margin, y);
      return y + 20;
    }

    // Goals Summary Table
    const goalsTableData = editedGoals.map((goal, index) => [
      `${index + 1}`,
      goal.title || 'Unnamed Goal',
      `₹${this.formatCurrency(goal.targetAmount || 0)}`,
      `${goal.targetYear || 'TBD'}`,
      `${goal.timeInYears || 'TBD'} years`,
      `₹${this.formatCurrency(goal.monthlySIP || 0)}`,
      goal.priority || 'Medium'
    ]);

    doc.autoTable({
      startY: y,
      head: [['#', 'Goal', 'Target Amount', 'Target Year', 'Time Horizon', 'Monthly SIP', 'Priority']],
      body: goalsTableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 }
      }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Detailed Goal Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED GOAL BREAKDOWN', this.margin, y);
    y += 12;

    editedGoals.forEach((goal, index) => {
      if (y > 250) { // Add new page if needed
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${goal.title || 'Unnamed Goal'}`, this.margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const goalDetails = [
        `Target Amount: ₹${this.formatCurrency(goal.targetAmount || 0)}`,
        `Time Horizon: ${goal.timeInYears || 'TBD'} years (Target: ${goal.targetYear || 'TBD'})`,
        `Required Monthly SIP: ₹${this.formatCurrency(goal.monthlySIP || 0)}`,
        `Expected Return: ${goal.assetAllocation?.expectedReturn || 8}% per annum`,
        `Risk Level: ${goal.assetAllocation?.riskLevel || 'Medium'}`,
        `Asset Allocation: ${goal.assetAllocation ? `${goal.assetAllocation.equity}% Equity, ${goal.assetAllocation.debt}% Debt` : 'TBD'}`
      ];

      goalDetails.forEach(detail => {
        doc.text(`  • ${detail}`, this.margin + 5, y);
        y += 7;
      });

      y += 5;
    });

    return y;
  }

  /**
   * Add AI-generated recommendations section
   */
  addRecommendations(doc, recommendations, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-POWERED FINANCIAL RECOMMENDATIONS', this.margin, y);
    y += 15;

    if (!recommendations) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No AI recommendations available.', this.margin, y);
      return y + 20;
    }

    // Investment Strategy
    if (recommendations.investmentStrategy) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INVESTMENT STRATEGY', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const strategyText = this.wrapText(doc, recommendations.investmentStrategy, this.contentWidth);
      strategyText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 6;
      });
      y += 10;
    }

    // Risk Analysis
    if (recommendations.riskAnalysis) {
      if (y > 250) {
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RISK ANALYSIS', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const riskText = this.wrapText(doc, recommendations.riskAnalysis, this.contentWidth);
      riskText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 6;
      });
      y += 10;
    }

    // Key Recommendations
    if (recommendations.keyRecommendations && Array.isArray(recommendations.keyRecommendations)) {
      if (y > 250) {
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KEY RECOMMENDATIONS', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      recommendations.keyRecommendations.forEach(rec => {
        doc.text(`• ${rec}`, this.margin, y);
        y += 8;
      });
    }

    return y + 10;
  }

  /**
   * Add implementation timeline
   */
  addImplementationTimeline(doc, editedGoals, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPLEMENTATION TIMELINE', this.margin, y);
    y += 15;

    if (!editedGoals || editedGoals.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No goals defined for timeline planning.', this.margin, y);
      return y + 20;
    }

    // Sort goals by target year
    const sortedGoals = [...editedGoals].sort((a, b) => (a.targetYear || 9999) - (b.targetYear || 9999));

    // Timeline Table
    const timelineData = sortedGoals.map(goal => [
      goal.title || 'Unnamed Goal',
      `${goal.targetYear || 'TBD'}`,
      `₹${this.formatCurrency(goal.monthlySIP || 0)}`,
      'Start immediately',
      goal.priority || 'Medium'
    ]);

    doc.autoTable({
      startY: y,
      head: [['Goal', 'Target Year', 'Monthly SIP', 'Action', 'Priority']],
      body: timelineData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10 }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Action Items
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('IMMEDIATE ACTION ITEMS', this.margin, y);
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const actionItems = [
      '1. Open investment accounts with reputable mutual fund companies',
      '2. Set up systematic investment plans (SIPs) for each goal',
      '3. Review and rebalance portfolio annually',
      '4. Monitor progress quarterly',
      '5. Adjust contributions as income increases'
    ];

    actionItems.forEach(item => {
      doc.text(item, this.margin, y);
      y += 8;
    });

    return y + 10;
  }

  /**
   * Add disclaimers and important notes
   */
  addDisclaimers(doc, startY) {
    let y = startY + 20;
    
    if (y > 250) {
      doc.addPage();
      y = this.margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT DISCLAIMERS', this.margin, y);
    y += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const disclaimers = [
      '• This financial plan is based on information provided and current market conditions.',
      '• Past performance does not guarantee future results.',
      '• All investments are subject to market risks.',
      '• Please consult with a qualified financial advisor before making investment decisions.',
      '• Review and update this plan regularly as your circumstances change.',
      '• This report is generated by AI and should be used for guidance only.'
    ];

    disclaimers.forEach(disclaimer => {
      const wrappedText = this.wrapText(doc, disclaimer, this.contentWidth);
      wrappedText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 6;
      });
    });

    return y;
  }

  // Utility Functions

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  formatCurrency(amount) {
    if (!amount || amount === 0) return '0';
    return new Intl.NumberFormat('en-IN').format(amount);
  }

  calculateTotalAssets(assets) {
    if (!assets) return 0;
    let total = assets.cashBankSavings || 0;
    if (assets.investments) {
      const equity = assets.investments.equity || {};
      const fixedIncome = assets.investments.fixedIncome || {};
      const other = assets.investments.other || {};
      
      total += (equity.directStocks || 0) + (equity.mutualFunds || 0);
      total += (fixedIncome.fixedDeposits || 0) + (fixedIncome.ppf || 0) + (fixedIncome.epf || 0);
      total += other.otherInvestments || 0;
    }
    return total;
  }

  calculateTotalLiabilities(debts) {
    if (!debts) return 0;
    let total = 0;
    Object.values(debts).forEach(debt => {
      if (debt && debt.outstandingAmount) {
        total += debt.outstandingAmount;
      }
    });
    return total;
  }

  getMaxTimelineYears(metrics) {
    return '5-20'; // Default timeline range
  }

  wrapText(doc, text, maxWidth) {
    return doc.splitTextToSize(text, maxWidth);
  }
}

// React Component for PDF Generation UI
const GoalPlanPDFGeneratorComponent = ({ 
  clientData, 
  editedGoals, 
  recommendations, 
  metrics, 
  cacheInfo,
  disabled = false 
}) => {
  const [generating, setGenerating] = React.useState(false);

  const generateAndDownloadPDF = async () => {
    try {
      setGenerating(true);
      console.log('🎯 [PDF Component] Starting PDF generation...');

      const generator = new GoalPlanPDFGenerator();
      const doc = generator.generatePDF({
        clientData,
        editedGoals,
        recommendations,
        metrics,
        cacheInfo
      });

      const fileName = `Goal_Plan_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✅ [PDF Component] PDF downloaded successfully');
    } catch (error) {
      console.error('❌ [PDF Component] Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateAndPreviewPDF = async () => {
    try {
      setGenerating(true);
      console.log('🎯 [PDF Component] Starting PDF preview...');

      const generator = new GoalPlanPDFGenerator();
      const doc = generator.generatePDF({
        clientData,
        editedGoals,
        recommendations,
        metrics,
        cacheInfo
      });

      // Open PDF in new tab for preview
      const pdfBlob = doc.output('blob');
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);

      console.log('✅ [PDF Component] PDF preview opened');
    } catch (error) {
      console.error('❌ [PDF Component] Error generating PDF preview:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        📄 Generate PDF Report
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Create a comprehensive financial plan PDF with your goals, recommendations, and analysis.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={generateAndPreviewPDF}
          disabled={disabled || generating || !clientData || !editedGoals?.length}
          sx={{ minWidth: 140 }}
        >
          {generating ? 'Generating...' : 'Preview PDF'}
        </Button>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={generateAndDownloadPDF}
          disabled={disabled || generating || !clientData || !editedGoals?.length}
          sx={{ minWidth: 140 }}
        >
          {generating ? 'Generating...' : 'Download PDF'}
        </Button>
      </Box>

      {(!clientData || !editedGoals?.length) && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          Please define at least one goal to generate PDF report.
        </Typography>
      )}
    </Paper>
  );
};

export default GoalPlanPDFGeneratorComponent;
export { GoalPlanPDFGenerator };