import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon, 
  Download as DownloadIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';

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
    
    // Initialize and verify autoTable plugin
    this.initializeAutoTable();
  }

  initializeAutoTable() {
    console.log('🔍 [PDF Generator] Checking autoTable availability...');
    
    // Create a test jsPDF instance to check plugin availability
    const testDoc = new jsPDF();
    console.log('autoTable method on instance:', typeof testDoc.autoTable);
    
    // For jsPDF 3.x with jspdf-autotable 5.x, the plugin should be auto-attached
    if (typeof testDoc.autoTable === 'function') {
      console.log('✅ [PDF Generator] autoTable plugin properly loaded');
      return true;
    } else {
      console.warn('⚠️ [PDF Generator] autoTable not available - will use fallback tables');
      return false;
    }
  }

  /**
   * Create professional fallback table when autoTable is not available
   */
  createFallbackTable(doc, data, headers, startY, options = {}) {
    let y = startY;
    const { 
      headerBg = [240, 248, 255], 
      headerText = [0, 51, 102],
      borderColor = [200, 200, 200],
      fontSize = 11,
      headerFontSize = 12,
      rowHeight = 12,
      columnWidths = []
    } = options;

    // Calculate responsive column widths if not provided
    const finalColumnWidths = columnWidths.length > 0 
      ? columnWidths 
      : this.calculateResponsiveColumnWidths(headers, data, this.contentWidth - 10);

    // Calculate header height based on wrapped text
    const headerHeight = Math.max(rowHeight, 
      this.calculateRowHeight(doc, headers, finalColumnWidths, headerFontSize, rowHeight));

    // Draw table header
    doc.setFillColor(...headerBg);
    doc.rect(this.margin, y, this.contentWidth, headerHeight, 'F');
    
    doc.setFontSize(headerFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...headerText);
    
    let currentX = this.margin + 3;
    headers.forEach((header, index) => {
      const colWidth = finalColumnWidths[index];
      const wrappedHeader = this.wrapTextForColumn(doc, header, colWidth, headerFontSize);
      
      // Draw wrapped header text
      wrappedHeader.forEach((line, lineIndex) => {
        doc.text(line, currentX, y + 8 + (lineIndex * 6));
      });
      
      currentX += colWidth;
    });
    
    y += headerHeight;

    // Draw data rows with responsive heights
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(fontSize);
    
    data.forEach((row, rowIndex) => {
      // Calculate row height based on content
      const currentRowHeight = this.calculateRowHeight(doc, row, finalColumnWidths, fontSize, rowHeight);
      
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.margin, y, this.contentWidth, currentRowHeight, 'F');
      }
      
      currentX = this.margin + 3;
      row.forEach((cell, colIndex) => {
        const colWidth = finalColumnWidths[colIndex];
        const wrappedText = this.wrapTextForColumn(doc, cell, colWidth, fontSize);
        
        // Draw wrapped cell text
        wrappedText.forEach((line, lineIndex) => {
          if (line.trim()) { // Only draw non-empty lines
            doc.text(line, currentX, y + 8 + (lineIndex * 6));
          }
        });
        
        currentX += colWidth;
      });
      
      y += currentRowHeight;
    });

    // Draw table border and column separators
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    
    // Outer border
    doc.rect(this.margin, startY, this.contentWidth, y - startY);
    
    // Column separators
    currentX = this.margin;
    finalColumnWidths.forEach(colWidth => {
      currentX += colWidth;
      if (currentX < this.margin + this.contentWidth) {
        doc.line(currentX, startY, currentX, y);
      }
    });

    return y + 10;
  }

  /**
   * Ensure autoTable is available on document instance
   */
  ensureAutoTable(doc) {
    // Check if autoTable is available on the document
    const isAvailable = typeof doc.autoTable === 'function';
    
    if (!isAvailable) {
      console.warn('⚠️ [PDF Generator] autoTable not available - using fallback tables');
    }
    
    return isAvailable;
  }

  /**
   * Generate comprehensive goal-based financial plan PDF
   */
  generatePDF(data) {
    const { clientData, editedGoals, recommendations, metrics, cacheInfo, advisorData } = data;
    
    // Validate input data
    if (!clientData) {
      throw new Error('Client data is required for PDF generation');
    }
    
    if (!editedGoals || editedGoals.length === 0) {
      console.warn('⚠️ [PDF Generator] No goals provided, generating basic report');
    }
    
    console.log('🎯 [PDF Generator] Starting frontend PDF generation:', {
      clientName: `${clientData?.firstName} ${clientData?.lastName}`,
      goalsCount: editedGoals?.length || 0,
      hasRecommendations: !!recommendations,
      hasMetrics: !!metrics,
      hasAdvisorData: !!advisorData
    });

    const doc = new jsPDF();
    
    // Ensure autoTable is available on this document instance
    const autoTableReady = this.ensureAutoTable(doc);
    if (!autoTableReady) {
      console.warn('⚠️ [PDF Generator] autoTable initialization failed, using fallback tables only');
    }
    
    let currentY = this.margin;

    // 1. Cover Page with Advisor Branding
    currentY = this.addCoverPage(doc, clientData, advisorData, currentY, cacheInfo);
    
    // 2. Executive Summary
    doc.addPage();
    currentY = this.margin + 5; // Add small top margin
    currentY = this.addExecutiveSummary(doc, clientData, editedGoals, metrics, currentY);
    
    // 3. Client Profile - use smart page break
    currentY = this.checkPageBreak(doc, currentY, 80); // Need space for client profile
    currentY = this.addSectionSpacing(currentY, 20);
    currentY = this.addClientProfile(doc, clientData, currentY);
    
    // 4. Goals Analysis - always start on new page for clarity
    doc.addPage();
    currentY = this.margin + 5;
    currentY = this.addGoalsAnalysis(doc, editedGoals, currentY);
    
    // 5. Financial Recommendations - use smart page break
    if (recommendations) {
      currentY = this.checkPageBreak(doc, currentY, 60);
      currentY = this.addSectionSpacing(currentY, 25);
      currentY = this.addRecommendations(doc, recommendations, currentY);
    }
    
    // 6. Implementation Timeline - use smart page break
    currentY = this.checkPageBreak(doc, currentY, 80);
    currentY = this.addSectionSpacing(currentY, 25);
    currentY = this.addImplementationTimeline(doc, editedGoals, currentY);
    
    // 7. Disclaimers - ensure adequate space
    currentY = this.checkPageBreak(doc, currentY, 50);
    currentY = this.addSectionSpacing(currentY, 20);
    currentY = this.addDisclaimers(doc, currentY);

    // Add advisor signature section on last page
    currentY = this.addAdvisorSignature(doc, advisorData, clientData, currentY);

    console.log('✅ [PDF Generator] PDF generated successfully');
    return doc;
  }

  /**
   * Add professional header with firm branding to each page
   */
  addProfessionalHeader(doc, advisorData, pageNumber = 1) {
    if (!advisorData) return;

    const headerHeight = 25;
    
    // Enhanced header background with gradient effect
    doc.setFillColor(245, 250, 255); // Lighter blue background
    doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Add subtle gradient strip at top
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, this.pageWidth, 3, 'F');
    
    // Firm name - prominent with enhanced styling
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text(advisorData.firmName || 'Financial Advisory Services', this.margin, 12);
    
    // Advisor name and credentials with better formatting
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85); // Slightly darker gray
    const advisorInfo = `${advisorData.firstName} ${advisorData.lastName}`;
    const sebiInfo = advisorData.sebiRegNumber ? ` | SEBI Reg: ${advisorData.sebiRegNumber}` : '';
    doc.text(`${advisorInfo}${sebiInfo}`, this.margin, 18);
    
    // Page number and date (right aligned) with better styling
    const rightX = this.pageWidth - this.margin;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(`Page ${pageNumber}`, rightX, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(new Date().toLocaleDateString('en-IN'), rightX, 18, { align: 'right' });
    
    // Enhanced header line with double line effect
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(1);
    doc.line(this.margin, headerHeight - 3, this.pageWidth - this.margin, headerHeight - 3);
    doc.setLineWidth(0.3);
    doc.line(this.margin, headerHeight - 1, this.pageWidth - this.margin, headerHeight - 1);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    return headerHeight + 5; // Return new Y position
  }

  /**
   * Add cover page with client details and plan summary
   */
  addCoverPage(doc, clientData, advisorData, startY, cacheInfo) {
    // Add professional header first
    let y = advisorData ? this.addProfessionalHeader(doc, advisorData, 1) : startY;
    y += 20;
    
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const planTitle = this.getPlanTitle(cacheInfo?.planType || 'goal_based');
    doc.text(planTitle, this.pageWidth / 2, y, { align: 'center' });
    
    y += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Investment Strategy Report', this.pageWidth / 2, y, { align: 'center' });
    
    y += 40;
    
    // Client Details Box with enhanced styling
    doc.setDrawColor(0, 102, 204);
    doc.setFillColor(245, 250, 255);
    doc.roundedRect(this.margin, y, this.contentWidth, 65, 5, 5, 'FD');
    
    // Add subtle inner shadow effect
    doc.setDrawColor(220, 230, 245);
    doc.setLineWidth(0.3);
    doc.roundedRect(this.margin + 1, y + 1, this.contentWidth - 2, 63, 4, 4);
    
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
    const planTypeLabel = this.getPlanTypeLabel(cacheInfo?.planType || 'goal_based');
    doc.text(`Plan Type: ${planTypeLabel}`, this.margin, y);
    
    return y;
  }

  /**
   * Add executive summary with key metrics
   */
  addExecutiveSummary(doc, clientData, editedGoals, metrics, startY) {
    let y = startY;
    
    // Section heading with enhanced styling
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text('EXECUTIVE SUMMARY', this.margin, y);
    
    // Add underline for section heading
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(1);
    doc.line(this.margin, y + 2, this.margin + 100, y + 2);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    y += 20;
    
    // Key Metrics Table - with improved data validation and formatting
    const summaryHeaders = ['Metric', 'Value'];
    const summaryData = [
      ['Total Financial Goals', `${metrics?.totalGoals || editedGoals?.length || 0}`],
      ['Required Monthly SIP', metrics?.totalRequiredSIP ? `₹${this.formatCurrency(metrics.totalRequiredSIP)}` : 'Calculating...'],
      ['Available Monthly Surplus', metrics?.availableSurplus ? `₹${this.formatCurrency(metrics.availableSurplus)}` : 'TBD'],
      ['Plan Feasibility', metrics?.feasible ? '✓ Achievable' : '⚠ Requires Review'],
      ['Planning Horizon', `${this.getMaxTimelineYears(metrics, editedGoals)} years`]
    ];

    // Calculate responsive column widths for summary table
    const summaryColumnWidths = this.calculateResponsiveColumnWidths(summaryHeaders, summaryData);

    // Use autoTable if available, otherwise use fallback
    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [summaryHeaders],
          body: summaryData,
          theme: 'grid',
          headStyles: { 
            fillColor: [0, 102, 204],
            fontSize: 12,
            fontStyle: 'bold',
            textColor: [255, 255, 255],
            halign: 'center'
          },
          bodyStyles: { 
            fontSize: 11,
            cellPadding: 4
          },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
            1: { halign: 'right' }
          }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [PDF Generator] autoTable failed, using fallback table:', error);
        y = this.createFallbackTable(doc, summaryData, summaryHeaders, y, {
          columnWidths: summaryColumnWidths,
          fontSize: 11,
          headerFontSize: 12,
          rowHeight: 12
        });
      }
    } else {
      // Use professional fallback table
      y = this.createFallbackTable(doc, summaryData, summaryHeaders, y, {
        columnWidths: summaryColumnWidths,
        fontSize: 11,
        headerFontSize: 12,
        rowHeight: 12
      });
    }

    // Financial Health Summary with enhanced styling
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text('FINANCIAL HEALTH OVERVIEW', this.margin, y);
    
    // Add underline
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.8);
    doc.line(this.margin, y + 2, this.margin + 120, y + 2);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    y += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const monthlyIncome = clientData?.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData?.totalMonthlyExpenses || 0;
    const surplus = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((surplus / monthlyIncome) * 100).toFixed(1) : 0;
    
    const healthItems = [
      [`Monthly Income:`, `₹${this.formatCurrency(monthlyIncome)}`],
      [`Monthly Expenses:`, `₹${this.formatCurrency(monthlyExpenses)}`],
      [`Monthly Surplus:`, `₹${this.formatCurrency(surplus)}`, surplus >= 0 ? '(Positive)' : '(Needs Attention)'],
      [`Savings Rate:`, `${savingsRate}%`, savingsRate >= 20 ? '(Excellent)' : savingsRate >= 10 ? '(Good)' : '(Can Improve)'],
      [`Investment Capacity:`, metrics?.feasible ? 'Strong' : 'Needs Optimization']
    ];

    healthItems.forEach(([label, value, note]) => {
      // Label in bold
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${label}`, this.margin, y);
      
      // Value in normal weight
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(`• ${label} `);
      doc.text(` ${value}`, this.margin + labelWidth, y);
      
      // Additional note if available
      if (note) {
        const valueWidth = doc.getTextWidth(` ${value} `);
        doc.setFont('helvetica', 'italic');
        doc.text(` ${note}`, this.margin + labelWidth + valueWidth, y);
      }
      
      y += 9;
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

    // Use autoTable plugin - with multiple fallback strategies
    if (this.ensureAutoTable(doc)) {
      try {
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
      } catch (autoTableError) {
        console.warn('❌ [PDF Generator] doc.autoTable failed for personal info, trying direct function call:', autoTableError);
        try {
          autoTable(doc, {
            startY: y,
            head: [['Personal Information', '']],
            body: personalInfo,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            margin: { left: this.margin, right: this.margin },
            styles: { fontSize: 10 }
          });
          y = doc.lastAutoTable.finalY + 15;
        } catch (directCallError) {
          console.warn('❌ [PDF Generator] Direct autoTable call failed for personal info, using fallback table:', directCallError);
          const fallbackResult = this.createFallbackTable(doc, personalInfo, ['Personal Information', ''], y, { 
            fontSize: 10, 
            title: 'Personal Information'
          });
          y = fallbackResult.endY + 15;
        }
      }
    } else {
      // Fallback: Create professional fallback table
      console.warn('Using professional fallback table for personal info');
      
      // Add section title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Personal Information', this.margin, y);
      y += 15;
      
      y = this.createFallbackTable(doc, personalInfo, ['Field', 'Value'], y, {
        columnWidths: [70, 100],
        fontSize: 10
      });
    }

    // Financial Summary
    const financialInfo = [
      ['Monthly Income', `₹${this.formatCurrency(clientData.totalMonthlyIncome || 0)}`],
      ['Monthly Expenses', `₹${this.formatCurrency(clientData.totalMonthlyExpenses || 0)}`],
      ['Annual Income', `₹${this.formatCurrency(clientData.annualIncome || 0)}`],
      ['Current Assets', `₹${this.formatCurrency(this.calculateTotalAssets(clientData.assets))}`],
      ['Total Liabilities', `₹${this.formatCurrency(this.calculateTotalLiabilities(clientData.debtsAndLiabilities))}`]
    ];

    // Use autoTable plugin - with multiple fallback strategies
    if (this.ensureAutoTable(doc)) {
      try {
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
      } catch (autoTableError) {
        console.warn('❌ [PDF Generator] doc.autoTable failed for financial info, trying direct function call:', autoTableError);
        try {
          autoTable(doc, {
            startY: y,
            head: [['Financial Overview', '']],
            body: financialInfo,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            margin: { left: this.margin, right: this.margin },
            styles: { fontSize: 10 }
          });
          return doc.lastAutoTable.finalY + 10;
        } catch (directCallError) {
          console.warn('❌ [PDF Generator] Direct autoTable call failed for financial info, using fallback table:', directCallError);
          const fallbackResult = this.createFallbackTable(doc, financialInfo, ['Financial Overview', ''], y, { 
            fontSize: 10, 
            title: 'Financial Overview'
          });
          return fallbackResult.endY + 10;
        }
      }
    } else {
      // Fallback: Create professional fallback table
      console.warn('Using professional fallback table for financial info');
      
      // Add section title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Overview', this.margin, y);
      y += 15;
      
      return this.createFallbackTable(doc, financialInfo, ['Field', 'Value'], y, {
        columnWidths: [80, 90],
        fontSize: 10
      });
    }
  }

  /**
   * Add detailed goals analysis with SIP calculations
   */
  addGoalsAnalysis(doc, editedGoals, startY) {
    let y = startY;
    
    try {
      // Section heading with enhanced styling
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102); // Dark blue
      doc.text('GOALS ANALYSIS & SIP REQUIREMENTS', this.margin, y);
      
      // Add underline for section heading
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(1);
      doc.line(this.margin, y + 2, this.margin + 120, y + 2);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      y += 20;

      if (!editedGoals || editedGoals.length === 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('No financial goals have been defined. Please set up your goals first.', this.margin, y);
        doc.text('This section will display detailed goal analysis once goals are added.', this.margin, y + 10);
        return y + 30;
      }
    } catch (error) {
      console.error('❌ [PDF Generator] Error in goals analysis header:', error);
      doc.setFontSize(12);
      doc.text('Error generating goals analysis section', this.margin, y);
      return y + 20;
    }

    // Goals Summary Table - with robust data validation
    let goalsTableHeaders, goalsTableData, goalsColumnWidths;
    
    try {
      goalsTableHeaders = ['#', 'Goal', 'Target Amount', 'Target Year', 'Time Horizon', 'Monthly SIP', 'Priority'];
      goalsTableData = editedGoals.map((goal, index) => [
        `${index + 1}`,
        goal?.title || 'Unnamed Goal',
        goal?.targetAmount ? `₹${this.formatCurrency(goal.targetAmount)}` : 'TBD',
        goal?.targetYear ? `${goal.targetYear}` : 'TBD',
        goal?.timeInYears ? `${goal.timeInYears} years` : 'TBD',
        goal?.monthlySIP ? `₹${this.formatCurrency(goal.monthlySIP)}` : 'TBD',
        goal?.priority || 'Medium'
      ]);

      // Calculate responsive column widths for goals table
      goalsColumnWidths = this.calculateResponsiveColumnWidths(goalsTableHeaders, goalsTableData);
    } catch (error) {
      console.error('❌ [PDF Generator] Error preparing goals table data:', error);
      doc.setFontSize(12);
      doc.text('Error processing goals data for table display', this.margin, y);
      return y + 20;
    }

    // Use autoTable if available, otherwise use fallback
    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [goalsTableHeaders],
          body: goalsTableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [0, 102, 204], 
            fontSize: 11,
            fontStyle: 'bold',
            textColor: [255, 255, 255],
            halign: 'center'
          },
          bodyStyles: { 
            fontSize: 10,
            cellPadding: 3
          },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'right' },
            6: { halign: 'center' }
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [PDF Generator] autoTable failed for goals table, using fallback table:', error);
        y = this.createFallbackTable(doc, goalsTableData, goalsTableHeaders, y, {
          columnWidths: goalsColumnWidths,
          fontSize: 10,
          headerFontSize: 11,
          rowHeight: 12
        });
      }
    } else {
      // Use professional fallback table
      y = this.createFallbackTable(doc, goalsTableData, goalsTableHeaders, y, {
        columnWidths: goalsColumnWidths,
        fontSize: 10,
        headerFontSize: 11,
        rowHeight: 12
      });
    }

    // Detailed Goal Breakdown with improved typography
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text('DETAILED GOAL BREAKDOWN', this.margin, y);
    
    // Add underline
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.8);
    doc.line(this.margin, y + 2, this.margin + 110, y + 2);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    y += 18;

    editedGoals.forEach((goal, index) => {
      // Smart page break - check if we have enough space for the goal details
      y = this.checkPageBreak(doc, y, 60); // Need ~60mm for a typical goal

      // Goal title with enhanced styling
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 77, 153); // Medium blue
      doc.text(`${index + 1}. ${goal?.title || 'Unnamed Goal'}`, this.margin, y);
      doc.setTextColor(0, 0, 0); // Reset to black
      y += 12;

      // Goal details with better formatting
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const goalDetails = [
        [`Target Amount:`, goal?.targetAmount ? `₹${this.formatCurrency(goal.targetAmount)}` : 'TBD'],
        [`Time Horizon:`, goal?.timeInYears ? `${goal.timeInYears} years` : 'TBD', goal?.targetYear ? `(Target: ${goal.targetYear})` : ''],
        [`Monthly SIP Required:`, goal?.monthlySIP ? `₹${this.formatCurrency(goal.monthlySIP)}` : 'TBD'],
        [`Expected Return:`, `${goal?.assetAllocation?.expectedReturn || 8}% per annum`],
        [`Risk Level:`, goal?.assetAllocation?.riskLevel || 'Medium'],
        [`Asset Allocation:`, goal?.assetAllocation ? `${goal.assetAllocation.equity || 0}% Equity, ${goal.assetAllocation.debt || 0}% Debt` : 'To be determined']
      ];

      goalDetails.forEach(([label, value, extra]) => {
        // Label in semi-bold
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${label}`, this.margin + 5, y);
        
        // Value in normal weight
        doc.setFont('helvetica', 'normal');
        const labelWidth = doc.getTextWidth(`• ${label} `);
        doc.text(` ${value}`, this.margin + 5 + labelWidth, y);
        
        // Extra info if available
        if (extra) {
          const valueWidth = doc.getTextWidth(` ${value} `);
          doc.text(` ${extra}`, this.margin + 5 + labelWidth + valueWidth, y);
        }
        
        y += 8;
      });

      // Add spacing between goals
      y += 8;
    });

    return y;
  }

  /**
   * Add AI-generated recommendations section
   */
  addRecommendations(doc, aiRecommendations, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-POWERED FINANCIAL RECOMMENDATIONS', this.margin, y);
    y += 15;

    if (!aiRecommendations) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No AI recommendations available.', this.margin, y);
      return y + 20;
    }

    // Extract AI recommendations structure
    const { 
      individualGoalAnalysis, 
      multiGoalOptimization, 
      recommendations, 
      riskAssessment 
    } = aiRecommendations;

    // Individual Goal Analysis
    if (individualGoalAnalysis && individualGoalAnalysis.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INDIVIDUAL GOAL ANALYSIS', this.margin, y);
      y += 12;

      individualGoalAnalysis.forEach((analysis, index) => {
        if (y > 240) {
          doc.addPage();
          y = this.margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${analysis.goalTitle || 'Goal Analysis'}`, this.margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (analysis.feasibilityAnalysis) {
          const feasibilityText = this.wrapText(doc, analysis.feasibilityAnalysis, this.contentWidth - 10);
          feasibilityText.forEach(line => {
            doc.text(line, this.margin + 5, y);
            y += 6;
          });
        }
        
        if (analysis.optimizationSuggestions) {
          doc.text('• Optimization Suggestions:', this.margin + 5, y);
          y += 6;
          const suggestionsText = this.wrapText(doc, analysis.optimizationSuggestions, this.contentWidth - 15);
          suggestionsText.forEach(line => {
            doc.text(line, this.margin + 10, y);
            y += 6;
          });
        }
        y += 5;
      });
      y += 10;
    }

    // Multi-Goal Optimization
    if (multiGoalOptimization) {
      if (y > 250) {
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MULTI-GOAL OPTIMIZATION STRATEGY', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      if (multiGoalOptimization.overallStrategy) {
        const strategyText = this.wrapText(doc, multiGoalOptimization.overallStrategy, this.contentWidth);
        strategyText.forEach(line => {
          doc.text(line, this.margin, y);
          y += 6;
        });
        y += 8;
      }

      if (multiGoalOptimization.prioritizationLogic) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Prioritization Logic:', this.margin, y);
        y += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const priorityText = this.wrapText(doc, multiGoalOptimization.prioritizationLogic, this.contentWidth);
        priorityText.forEach(line => {
          doc.text(line, this.margin, y);
          y += 6;
        });
        y += 8;
      }
    }

    // Key Recommendations
    if (recommendations?.immediateActions?.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('IMMEDIATE ACTION ITEMS', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      recommendations.immediateActions.forEach(action => {
        const actionText = this.wrapText(doc, `• ${action}`, this.contentWidth);
        actionText.forEach(line => {
          doc.text(line, this.margin, y);
          y += 6;
        });
        y += 2;
      });
      y += 10;
    }

    // Risk Assessment
    if (riskAssessment) {
      if (y > 250) {
        doc.addPage();
        y = this.margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RISK ASSESSMENT & MITIGATION', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      if (riskAssessment.overallRiskProfile) {
        doc.text(`Overall Risk Profile: ${riskAssessment.overallRiskProfile}`, this.margin, y);
        y += 8;
      }

      if (riskAssessment.keyRisks?.length > 0) {
        doc.text('Key Risks Identified:', this.margin, y);
        y += 6;
        riskAssessment.keyRisks.forEach(risk => {
          doc.text(`• ${risk}`, this.margin + 5, y);
          y += 6;
        });
        y += 8;
      }

      if (riskAssessment.mitigationStrategies?.length > 0) {
        doc.text('Mitigation Strategies:', this.margin, y);
        y += 6;
        riskAssessment.mitigationStrategies.forEach(strategy => {
          doc.text(`• ${strategy}`, this.margin + 5, y);
          y += 6;
        });
      }
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
    const timelineHeaders = ['Goal', 'Target Year', 'Monthly SIP', 'Action', 'Priority'];
    const timelineData = sortedGoals.map(goal => [
      goal.title || 'Unnamed Goal',
      `${goal.targetYear || 'TBD'}`,
      `₹${this.formatCurrency(goal.monthlySIP || 0)}`,
      'Start immediately',
      goal.priority || 'Medium'
    ]);

    // Use autoTable plugin - with multiple fallback strategies
    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [timelineHeaders],
          body: timelineData,
          theme: 'grid',
          headStyles: { fillColor: [0, 102, 204] },
          margin: { left: this.margin, right: this.margin },
          styles: { fontSize: 10 }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [PDF Generator] autoTable failed for timeline table, using fallback table:', error);
        y = this.createFallbackTable(doc, timelineData, timelineHeaders, y, {
          fontSize: 10,
          headerFontSize: 11,
          rowHeight: 12
        });
      }
    } else {
      // Use professional fallback table
      y = this.createFallbackTable(doc, timelineData, timelineHeaders, y, {
        fontSize: 10,
        headerFontSize: 11,
        rowHeight: 12
      });
    }

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

  /**
   * Add advisor signature and credentials section
   */
  addAdvisorSignature(doc, advisorData, clientData, startY) {
    if (!advisorData) return startY;

    let y = startY + 30;
    
    // Add new page if needed
    if (y > 250) {
      doc.addPage();
      y = this.addProfessionalHeader(doc, advisorData, doc.internal.getNumberOfPages()) + 20;
    }

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED BY', this.margin, y);
    y += 20;

    // Enhanced advisor details box
    doc.setDrawColor(0, 102, 204);
    doc.setFillColor(248, 252, 255);
    doc.roundedRect(this.margin, y, this.contentWidth, 55, 5, 5, 'FD');
    
    // Add subtle inner border
    doc.setDrawColor(220, 235, 250);
    doc.setLineWidth(0.5);
    doc.roundedRect(this.margin + 2, y + 2, this.contentWidth - 4, 51, 3, 3);
    
    y += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${advisorData.firstName} ${advisorData.lastName}`, this.margin + 10, y);
    
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${advisorData.firmName}`, this.margin + 10, y);
    
    y += 8;
    if (advisorData.sebiRegNumber) {
      doc.text(`SEBI Registration: ${advisorData.sebiRegNumber}`, this.margin + 10, y);
      y += 6;
    }
    
    if (advisorData.email) {
      doc.text(`Email: ${advisorData.email}`, this.margin + 10, y);
      y += 6;
    }
    
    if (advisorData.phoneNumber) {
      doc.text(`Phone: ${advisorData.phoneNumber}`, this.margin + 10, y);
    }

    y += 20;

    // Prepared for client message
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text(`This financial plan has been specifically prepared for ${clientData.firstName} ${clientData.lastName}`, this.margin, y);
    y += 8;
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, this.margin, y);

    return y + 10;
  }

  // Utility Functions

  /**
   * Check if we need a page break and handle it smartly
   */
  checkPageBreak(doc, currentY, requiredSpace = 30, addHeader = true) {
    if (currentY + requiredSpace > this.pageHeight - this.margin) {
      doc.addPage();
      let newY = this.margin;
      
      // Add header to new page if requested
      if (addHeader) {
        // Add a subtle header line for continuation
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(this.margin, newY, this.pageWidth - this.margin, newY);
        newY += 10;
      }
      
      return newY;
    }
    return currentY;
  }

  /**
   * Add consistent section spacing
   */
  addSectionSpacing(currentY, spacing = 15) {
    return currentY + spacing;  
  }

  /**
   * Calculate responsive column widths based on content and available space
   */
  calculateResponsiveColumnWidths(headers, data, availableWidth = this.contentWidth) {
    const padding = 10; // Extra padding per column
    const minColumnWidth = 15; // Minimum column width in mm
    const maxColumnWidth = availableWidth * 0.4; // Maximum 40% of available width
    
    // Calculate content-based widths
    const contentWidths = headers.map((header, colIndex) => {
      // Start with header width
      let maxWidth = header.length * 2; // Approximate mm per character
      
      // Check data content width
      data.forEach(row => {
        if (row[colIndex]) {
          const cellLength = String(row[colIndex]).length * 1.8;
          maxWidth = Math.max(maxWidth, cellLength);
        }
      });
      
      // Apply constraints
      return Math.min(Math.max(maxWidth + padding, minColumnWidth), maxColumnWidth);
    });
    
    // Scale to fit available width
    const totalCalculatedWidth = contentWidths.reduce((sum, width) => sum + width, 0);
    
    if (totalCalculatedWidth > availableWidth) {
      // Scale down proportionally
      const scaleFactor = availableWidth / totalCalculatedWidth;
      return contentWidths.map(width => Math.max(width * scaleFactor, minColumnWidth));
    }
    
    return contentWidths;
  }

  /**
   * Wrap text to fit within column width
   */
  wrapTextForColumn(doc, text, maxWidth, fontSize = 10) {
    if (!text) return [''];
    
    // Set font size for accurate measurement
    doc.setFontSize(fontSize);
    
    // Use jsPDF's built-in text splitting
    return doc.splitTextToSize(String(text), maxWidth - 4); // 4mm padding
  }

  /**
   * Calculate required row height for wrapped text
   */
  calculateRowHeight(doc, rowData, columnWidths, fontSize = 10, baseHeight = 8) {
    let maxLines = 1;
    
    rowData.forEach((cell, colIndex) => {
      if (cell && columnWidths[colIndex]) {
        const wrappedLines = this.wrapTextForColumn(doc, cell, columnWidths[colIndex], fontSize);
        maxLines = Math.max(maxLines, wrappedLines.length);
      }
    });
    
    return Math.max(baseHeight, maxLines * 6 + 4); // 6mm per line + padding
  }

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
    if (!amount || amount === 0 || isNaN(amount)) return '0';
    
    try {
      // Handle string amounts that might be passed
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return '0';
      
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(Math.round(numAmount));
    } catch (error) {
      console.warn('⚠️ [PDF Generator] Error formatting currency:', error);
      return String(amount);
    }
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

  getMaxTimelineYears(metrics, editedGoals) {
    if (metrics?.maxTimelineYears) {
      return metrics.maxTimelineYears;
    }
    
    if (editedGoals && editedGoals.length > 0) {
      const years = editedGoals
        .map(goal => goal?.timeInYears || goal?.targetYear ? (new Date().getFullYear() - (goal.targetYear || new Date().getFullYear())) : 0)
        .filter(year => year > 0);
      
      if (years.length > 0) {
        const maxYear = Math.max(...years);
        const minYear = Math.min(...years);
        return years.length === 1 ? `${maxYear}` : `${minYear}-${maxYear}`;
      }
    }
    
    return '5-20'; // Default timeline range
  }

  wrapText(doc, text, maxWidth) {
    return doc.splitTextToSize(text, maxWidth);
  }

  getPlanTypeLabel(planType) {
    switch (planType) {
      case 'cash_flow':
        return 'Cash Flow Planning';
      case 'goal_based':
        return 'Goal-Based Investment Planning';
      case 'hybrid':
        return 'Hybrid Financial Planning';
      default:
        return 'Financial Planning';
    }
  }

  getPlanTitle(planType) {
    switch (planType) {
      case 'cash_flow':
        return 'CASH FLOW FINANCIAL PLAN';
      case 'goal_based':
        return 'GOAL-BASED FINANCIAL PLAN';
      case 'hybrid':
        return 'HYBRID FINANCIAL PLAN';
      default:
        return 'COMPREHENSIVE FINANCIAL PLAN';
    }
  }
}

// React Component for PDF Generation UI
const GoalPlanPDFGeneratorComponent = ({ 
  clientData, 
  editedGoals, 
  recommendations, 
  metrics, 
  cacheInfo,
  planId,
  disabled = false 
}) => {
  // Get advisor data from localStorage or context
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
  const [generating, setGenerating] = React.useState(false);
  const [storedReports, setStoredReports] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [successMessage, setSuccessMessage] = React.useState(null);

  // Load stored reports on component mount
  React.useEffect(() => {
    if (planId) {
      loadStoredReports();
    }
  }, [planId]);

  // API helper functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Load all stored PDF reports for this plan
  const loadStoredReports = async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/plans/${planId}/pdf/all`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setStoredReports(response.data.reports || []);
        console.log('📄 [PDF Storage] Loaded stored reports:', response.data.reports?.length || 0);
      }
    } catch (error) {
      console.error('❌ [PDF Storage] Error loading reports:', error);
      setError('Failed to load stored reports');
    } finally {
      setLoading(false);
    }
  };

  // Store PDF in database
  const storePDFInDatabase = async (pdfBlob) => {
    if (!planId) {
      throw new Error('Plan ID is required to store PDF');
    }

    try {
      console.log('📄 [PDF Storage] Starting storage process:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type
      });

      // Convert blob to base64 with better error handling
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          console.log('📄 [PDF Storage] Base64 conversion completed:', {
            resultLength: reader.result?.length || 0,
            resultPrefix: reader.result?.substring(0, 50) || 'no result'
          });
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error('❌ [PDF Storage] FileReader error:', error);
          reject(error);
        };
      });
      reader.readAsDataURL(pdfBlob);
      const base64Data = await base64Promise;

      // Validate base64 data integrity
      if (!base64Data || !base64Data.startsWith('data:application/pdf;base64,')) {
        throw new Error('Invalid base64 PDF data generated');
      }

      // Calculate content summary
      const contentSummary = {
        goalsCount: editedGoals?.length || 0,
        totalSIPAmount: metrics?.totalRequiredSIP || 0,
        hasRecommendations: !!recommendations
      };

      const fileName = `Goal_Plan_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;

      const response = await axios.post(
        `http://localhost:5000/api/plans/${planId}/pdf/store`,
        {
          reportType: 'goal_based',
          pdfData: base64Data,
          fileName: fileName,
          contentSummary: contentSummary
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        console.log('✅ [PDF Storage] PDF stored successfully:', response.data.report);
        
        // Test storage integrity by retrieving and comparing
        await testStorageIntegrity(response.data.report.id, pdfBlob);
        
        await loadStoredReports(); // Refresh the list
        return response.data.report;
      } else {
        throw new Error(response.data.error || 'Failed to store PDF');
      }
    } catch (error) {
      console.error('❌ [PDF Storage] Error storing PDF:', error);
      throw error;
    }
  };

  // Test storage integrity by comparing original vs retrieved PDF
  const testStorageIntegrity = async (reportId, originalBlob) => {
    try {
      console.log('🔍 [PDF Storage] Testing storage integrity...');
      
      // Retrieve the stored PDF
      const response = await axios.get(
        `http://localhost:5000/api/plans/${planId}/pdf/report/${reportId}`,
        { 
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );

      const retrievedBlob = response.data;
      
      console.log('🔍 [PDF Storage] Integrity test results:', {
        originalSize: originalBlob.size,
        retrievedSize: retrievedBlob.size,
        originalType: originalBlob.type,
        retrievedType: retrievedBlob.type,
        sizesMatch: originalBlob.size === retrievedBlob.size,
        typesMatch: originalBlob.type === retrievedBlob.type
      });

      // More detailed comparison if sizes don't match
      if (originalBlob.size !== retrievedBlob.size) {
        console.warn('⚠️ [PDF Storage] Size mismatch detected! This may indicate data corruption.');
        
        // Convert both to ArrayBuffer for detailed comparison
        const originalBuffer = await originalBlob.arrayBuffer();
        const retrievedBuffer = await retrievedBlob.arrayBuffer();
        
        console.log('🔍 [PDF Storage] Buffer comparison:', {
          originalBufferLength: originalBuffer.byteLength,
          retrievedBufferLength: retrievedBuffer.byteLength,
          firstBytesMatch: new Uint8Array(originalBuffer.slice(0, 10)).toString() === 
                          new Uint8Array(retrievedBuffer.slice(0, 10)).toString()
        });
      } else {
        console.log('✅ [PDF Storage] Storage integrity verified - sizes match');
      }
      
    } catch (error) {
      console.error('❌ [PDF Storage] Integrity test failed:', error);
    }
  };

  // Generate and save PDF to database
  const generateAndSavePDF = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccessMessage(null);
      console.log('🎯 [PDF Component] Starting PDF generation and storage...');

      const generator = new GoalPlanPDFGenerator();
      const doc = generator.generatePDF({
        clientData,
        editedGoals,
        recommendations,
        metrics,
        cacheInfo,
        advisorData: getAdvisorData()
      });

      // Get PDF as blob with logging
      const pdfBlob = doc.output('blob');
      console.log('📄 [PDF Generation] PDF blob created for storage:', {
        size: pdfBlob.size,
        type: pdfBlob.type,
        hasAutoTable: typeof doc.autoTable === 'function'
      });
      
      // Store in database
      const savedReport = await storePDFInDatabase(pdfBlob);

      // Open the saved PDF immediately for user to see
      if (savedReport && savedReport.id) {
        console.log('📄 [PDF Component] Opening saved PDF for viewing...');
        await viewStoredPDF(savedReport.id);
      } else {
        // Fallback: open the original PDF blob if saved report info not available
        console.log('📄 [PDF Component] Opening original PDF blob as fallback...');
        const pdfURL = URL.createObjectURL(pdfBlob);
        window.open(pdfURL, '_blank');
        setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      }

      console.log('✅ [PDF Component] PDF generated, stored, and opened successfully');
      setSuccessMessage('PDF report saved to database and opened for viewing!');
    } catch (error) {
      console.error('❌ [PDF Component] Error generating and storing PDF:', error);
      setError('Failed to generate and store PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // View stored PDF
  const viewStoredPDF = async (reportId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/plans/${planId}/pdf/report/${reportId}`,
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
      
      console.log('✅ [PDF Storage] Stored PDF opened for viewing');
    } catch (error) {
      console.error('❌ [PDF Storage] Error viewing stored PDF:', error);
      setError('Failed to view stored PDF');
    }
  };

  // Download stored PDF
  const downloadStoredPDF = async (reportId, fileName) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/plans/${planId}/pdf/report/${reportId}`,
        { 
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );

      // Create download link
      const pdfURL = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = pdfURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(pdfURL);
      
      console.log('✅ [PDF Storage] Stored PDF downloaded:', fileName);
    } catch (error) {
      console.error('❌ [PDF Storage] Error downloading stored PDF:', error);
      setError('Failed to download stored PDF');
    }
  };

  // Delete stored PDF
  const deleteStoredPDF = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this PDF report?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/plans/${planId}/pdf/report/${reportId}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        console.log('✅ [PDF Storage] PDF deleted successfully');
        await loadStoredReports(); // Refresh the list
      } else {
        throw new Error(response.data.error || 'Failed to delete PDF');
      }
    } catch (error) {
      console.error('❌ [PDF Storage] Error deleting PDF:', error);
      setError('Failed to delete PDF report');
    }
  };

  const generateAndDownloadPDF = async () => {
    try {
      setGenerating(true);
      setSuccessMessage(null);
      console.log('🎯 [PDF Component] Starting PDF generation...');

      const generator = new GoalPlanPDFGenerator();
      const doc = generator.generatePDF({
        clientData,
        editedGoals,
        recommendations,
        metrics,
        cacheInfo,
        advisorData: getAdvisorData()
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
      setSuccessMessage(null);
      console.log('🎯 [PDF Component] Starting PDF preview...');

      const generator = new GoalPlanPDFGenerator();
      const doc = generator.generatePDF({
        clientData,
        editedGoals,
        recommendations,
        metrics,
        cacheInfo,
        advisorData: getAdvisorData()
      });

      // Open PDF in new tab for preview
      const pdfBlob = doc.output('blob');
      console.log('📄 [PDF Generation] PDF blob created for preview:', {
        size: pdfBlob.size,
        type: pdfBlob.type,
        hasAutoTable: typeof doc.autoTable === 'function'
      });
      
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
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
          📄 PDF Report Generation
        </Typography>
        
        {/* All PDF actions in one row */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<PdfIcon />}
            onClick={generateAndPreviewPDF}
            disabled={disabled || generating || !clientData || !editedGoals?.length}
            sx={{ 
              minWidth: 120,
              borderColor: '#2563eb',
              color: '#2563eb',
              '&:hover': {
                borderColor: '#1d4ed8',
                bgcolor: '#eff6ff'
              }
            }}
          >
            {generating ? 'Generating...' : 'Preview'}
          </Button>

          <Button
            variant="contained"
            size="medium"
            startIcon={<DownloadIcon />}
            onClick={generateAndDownloadPDF}
            disabled={disabled || generating || !clientData || !editedGoals?.length}
            sx={{ 
              minWidth: 120,
              bgcolor: '#059669',
              '&:hover': { bgcolor: '#047857' }
            }}
          >
            {generating ? 'Generating...' : 'Download'}
          </Button>

          {planId && (
            <Button
              variant="contained"
              color="primary"
              size="medium"
              startIcon={generating ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={generateAndSavePDF}
              disabled={disabled || generating || !clientData || !editedGoals?.length}
              sx={{ minWidth: 140 }}
            >
              {generating ? 'Saving...' : 'Save to DB'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}


      {/* Stored Reports Section */}
      {planId && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              Stored Reports ({storedReports.length})
            </Typography>
            
            <Button
              size="small"
              onClick={loadStoredReports}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <UploadIcon />}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : storedReports.length > 0 ? (
            <List>
              {storedReports.map((report, index) => (
                <React.Fragment key={report.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {report.fileName}
                          </Typography>
                          <Chip
                            label={`v${report.version}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            Generated: {new Date(report.generatedAt).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Size: {(report.fileSize / 1024).toFixed(1)} KB | 
                            Goals: {report.metadata?.contentSummary?.goalsCount || 0} | 
                            SIP: ₹{new Intl.NumberFormat('en-IN').format(report.metadata?.contentSummary?.totalSIPAmount || 0)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => viewStoredPDF(report.id)}
                          title="View PDF"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => downloadStoredPDF(report.id, report.fileName)}
                          title="Download PDF"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteStoredPDF(report.id)}
                          title="Delete PDF"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < storedReports.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No stored PDF reports found. Generate and save a report to see it here.
            </Alert>
          )}
        </>
      )}

      {(!clientData || !editedGoals?.length) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Please define at least one financial goal to generate PDF report.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default GoalPlanPDFGeneratorComponent;
export { GoalPlanPDFGenerator };