import React from 'react';
import jsPDF from 'jspdf';
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
    
    // Professional financial services theme
    this.theme = {
      colors: {
        primary: [26, 54, 93],      // Deep navy
        secondary: [37, 99, 235],   // Professional blue
        accent: [245, 158, 11],     // Gold accent
        success: [34, 197, 94],     // Green for positive
        warning: [234, 179, 8],     // Amber for caution
        danger: [239, 68, 68],      // Red for negative
        gray: {
          50: [250, 250, 250],
          100: [245, 245, 245],
          200: [229, 231, 235],
          300: [209, 213, 219],
          400: [156, 163, 175],
          500: [107, 114, 128],
          600: [75, 85, 99],
          700: [55, 65, 81],
          800: [31, 41, 55],
          900: [17, 24, 39]
        },
        background: {
          light: [248, 250, 252],
          medium: [241, 245, 249],
          gradient: [240, 248, 255]
        }
      },
      fonts: {
        sizes: {
          title: 24,
          heading1: 18,
          heading2: 16,
          heading3: 14,
          heading4: 12,
          body: 11,
          small: 10,
          tiny: 9
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.4,
          relaxed: 1.6
        }
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32
      }
    };
  }

  /**
   * Create professional table without autoTable dependency
   */
  createProfessionalTable(doc, data, headers, startY, options = {}) {
    const {
      title = null,
      columnWidths = null,
      headerStyle = 'primary',
      alternateRows = true,
      showBorders = true,
      fontSize = this.theme.fonts.sizes.body,
      headerFontSize = this.theme.fonts.sizes.heading4,
      cellPadding = 6,
      maxWidth = this.contentWidth - 10
    } = options;

    let y = startY;
    
    // Validate data
    if (!data || data.length === 0) {
      console.warn('⚠️ [PDF Generator] No data provided for table');
      return y;
    }

    // Add title if provided
    if (title) {
      doc.setFontSize(this.theme.fonts.sizes.heading3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.theme.colors.primary);
      doc.text(title, this.margin, y);
      y += this.theme.spacing.md;
      doc.setTextColor(0, 0, 0); // Reset color
    }

    // Calculate column widths
    const numColumns = headers ? headers.length : (data[0] ? data[0].length : 1);
    const finalColumnWidths = columnWidths || this.calculateOptimalColumnWidths(doc, data, headers, maxWidth, fontSize);
    
    // Ensure we don't exceed page width
    const totalWidth = finalColumnWidths.reduce((sum, width) => sum + width, 0);
    if (totalWidth > maxWidth) {
      const scaleFactor = maxWidth / totalWidth;
      finalColumnWidths.forEach((width, index) => {
        finalColumnWidths[index] = width * scaleFactor;
      });
    }

    const tableWidth = finalColumnWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = this.margin + (maxWidth - tableWidth) / 2; // Center table

    // Check if we need a new page
    const estimatedHeight = (data.length + (headers ? 1 : 0)) * (cellPadding * 2 + fontSize * 1.2);
    if (y + estimatedHeight > this.pageHeight - this.margin - 20) {
      doc.addPage();
      y = this.margin + this.theme.spacing.md;
    }

    // Draw table header if provided
    if (headers && headers.length > 0) {
      const headerHeight = cellPadding * 2 + headerFontSize * 1.2;
      
      // Header background
      const headerColor = headerStyle === 'primary' ? this.theme.colors.primary : this.theme.colors.secondary;
      doc.setFillColor(...headerColor);
      doc.rect(tableStartX, y, tableWidth, headerHeight, 'F');
      
      // Header text
      doc.setFontSize(headerFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text
      
      let currentX = tableStartX;
      headers.forEach((header, index) => {
        const colWidth = finalColumnWidths[index];
        const wrappedText = this.wrapTextToWidth(doc, String(header), colWidth - cellPadding * 2, headerFontSize);
        
        // Center text vertically in cell
        const textY = y + cellPadding + (headerHeight - cellPadding * 2) / 2;
        wrappedText.forEach((line, lineIndex) => {
          doc.text(line, currentX + cellPadding, textY + (lineIndex * headerFontSize * 1.2));
        });
        
        currentX += colWidth;
      });
      
      y += headerHeight;
      doc.setTextColor(0, 0, 0); // Reset text color
    }

    // Draw data rows
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    
    data.forEach((row, rowIndex) => {
      // Calculate row height based on content
      const rowHeight = this.calculateRowHeight(doc, row, finalColumnWidths, fontSize, cellPadding);
      
      // Check if row fits on current page
      if (y + rowHeight > this.pageHeight - this.margin - 10) {
        doc.addPage();
        y = this.margin + this.theme.spacing.md;
      }
      
      // Alternate row background
      if (alternateRows && rowIndex % 2 === 0) {
        doc.setFillColor(...this.theme.colors.background.light);
        doc.rect(tableStartX, y, tableWidth, rowHeight, 'F');
      }
      
      // Draw cell content
      let currentX = tableStartX;
      row.forEach((cell, colIndex) => {
        const colWidth = finalColumnWidths[colIndex];
        const cellText = String(cell || '');
        const wrappedText = this.wrapTextToWidth(doc, cellText, colWidth - cellPadding * 2, fontSize);
        
        // Draw text with proper alignment
        const textY = y + cellPadding;
        wrappedText.forEach((line, lineIndex) => {
          if (line.trim()) {
            // Right align numbers, left align text
            const isNumber = /^[₹$]?[\d,.-]+%?$/.test(line.trim());
            const textX = isNumber ? 
              currentX + colWidth - cellPadding - doc.getTextWidth(line) : 
              currentX + cellPadding;
            
            doc.text(line, textX, textY + (lineIndex * fontSize * 1.2));
          }
        });
        
        currentX += colWidth;
      });
      
      y += rowHeight;
    });

    // Draw table borders if requested
    if (showBorders) {
      doc.setDrawColor(...this.theme.colors.gray[300]);
      doc.setLineWidth(0.5);
      
      const tableHeight = y - startY - (title ? this.theme.spacing.md : 0);
      
      // Outer border
      doc.rect(tableStartX, startY + (title ? this.theme.spacing.md : 0), tableWidth, tableHeight);
      
      // Column separators
      let currentX = tableStartX;
      finalColumnWidths.forEach((colWidth, index) => {
        if (index < finalColumnWidths.length - 1) {
          currentX += colWidth;
          doc.line(currentX, startY + (title ? this.theme.spacing.md : 0), currentX, y);
        }
      });
      
      // Row separators (optional)
      if (headers) {
        const headerHeight = cellPadding * 2 + headerFontSize * 1.2;
        doc.line(tableStartX, startY + (title ? this.theme.spacing.md : 0) + headerHeight, 
                tableStartX + tableWidth, startY + (title ? this.theme.spacing.md : 0) + headerHeight);
      }
    }

    return y + this.theme.spacing.md;
  }

  /**
   * Calculate optimal column widths based on content
   */
  calculateOptimalColumnWidths(doc, data, headers, maxWidth, fontSize) {
    const numColumns = headers ? headers.length : (data[0] ? data[0].length : 1);
    const minColWidth = 25; // Minimum column width in mm
    const padding = 12; // Extra padding per column
    
    // Calculate content-based widths
    const contentWidths = [];
    
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      let maxWidth = minColWidth;
      
      // Check header width
      if (headers && headers[colIndex]) {
        doc.setFontSize(fontSize);
        const headerWidth = doc.getTextWidth(String(headers[colIndex])) + padding;
        maxWidth = Math.max(maxWidth, headerWidth);
      }
      
      // Check data content width
      data.forEach(row => {
        if (row[colIndex]) {
          doc.setFontSize(fontSize);
          const cellWidth = doc.getTextWidth(String(row[colIndex])) + padding;
          maxWidth = Math.max(maxWidth, cellWidth);
        }
      });
      
      contentWidths.push(maxWidth);
    }
    
    // Scale to fit available width
    const totalContentWidth = contentWidths.reduce((sum, width) => sum + width, 0);
    
    if (totalContentWidth > maxWidth) {
      const scaleFactor = maxWidth / totalContentWidth;
      return contentWidths.map(width => Math.max(width * scaleFactor, minColWidth));
    }
    
    return contentWidths;
  }

  /**
   * Calculate row height based on wrapped content
   */
  calculateRowHeight(doc, row, columnWidths, fontSize, cellPadding) {
    let maxLines = 1;
    
    row.forEach((cell, colIndex) => {
      if (cell && columnWidths[colIndex]) {
        const wrappedLines = this.wrapTextToWidth(doc, String(cell), columnWidths[colIndex] - cellPadding * 2, fontSize);
        maxLines = Math.max(maxLines, wrappedLines.length);
      }
    });
    
    return cellPadding * 2 + (maxLines * fontSize * 1.2);
  }

  /**
   * Wrap text to fit within specified width
   */
  wrapTextToWidth(doc, text, maxWidth, fontSize) {
    if (!text) return [''];
    
    doc.setFontSize(fontSize);
    
    // Use jsPDF's built-in text splitting with improved handling
    try {
      const lines = doc.splitTextToSize(String(text), maxWidth);
      return Array.isArray(lines) ? lines : [String(text)];
    } catch (error) {
      console.warn('⚠️ [PDF Generator] Text wrapping failed, using fallback:', error);
      return [String(text).substring(0, Math.floor(maxWidth / 3))];
    }
  }

  /**
   * Legacy fallback table method (deprecated)
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
   * Validate and safely extract data
   */
  safeDataExtract(data, path, defaultValue = null) {
    try {
      const keys = path.split('.');
      let result = data;
      
      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          return defaultValue;
        }
      }
      
      return result !== undefined && result !== null ? result : defaultValue;
    } catch (error) {
      console.warn(`⚠️ [PDF Generator] Failed to extract data path '${path}':`, error);
      return defaultValue;
    }
  }

  /**
   * Check if sufficient space exists on current page
   */
  checkSpaceAndBreak(doc, currentY, requiredSpace = 40, addHeader = false) {
    if (currentY + requiredSpace > this.pageHeight - this.margin - 15) {
      doc.addPage();
      let newY = this.margin + this.theme.spacing.md;
      
      if (addHeader && doc.advisorData) {
        newY = this.addProfessionalHeader(doc, doc.advisorData, doc.internal.getNumberOfPages());
      }
      
      return newY;
    }
    return currentY;
  }

  /**
   * Generate comprehensive goal-based financial plan PDF
   */
  generatePDF(data) {
    // Enhanced data validation and extraction
    const clientData = this.safeDataExtract(data, 'clientData', {});
    const editedGoals = this.safeDataExtract(data, 'editedGoals', []);
    const recommendations = this.safeDataExtract(data, 'recommendations', null);
    const metrics = this.safeDataExtract(data, 'metrics', {});
    const cacheInfo = this.safeDataExtract(data, 'cacheInfo', {});
    const advisorData = this.safeDataExtract(data, 'advisorData', null);
    
    // Validate essential data
    if (!clientData || !clientData.firstName) {
      throw new Error('Client data with at least firstName is required for PDF generation');
    }
    
    console.log('🎯 [PDF Generator] Starting professional PDF generation:', {
      clientName: `${clientData.firstName} ${clientData.lastName || ''}`,
      goalsCount: editedGoals.length,
      hasRecommendations: !!recommendations,
      hasMetrics: Object.keys(metrics).length > 0,
      hasAdvisorData: !!advisorData,
      dataQuality: 'Enhanced validation complete'
    });

    const doc = new jsPDF();
    
    // Store data references on doc for access in header methods
    doc.advisorData = advisorData;
    doc.clientData = clientData;
    
    let currentY = this.margin;

    // 1. Cover Page with Enhanced Branding
    currentY = this.addEnhancedCoverPage(doc, clientData, advisorData, currentY, cacheInfo);
    
    // 2. Executive Summary with Professional Design
    doc.addPage();
    currentY = this.addProfessionalHeader(doc, advisorData, 2);
    currentY = this.addEnhancedExecutiveSummary(doc, clientData, editedGoals, metrics, currentY);
    
    // 3. Client Profile with Smart Layout
    currentY = this.checkSpaceAndBreak(doc, currentY, 100, true);
    currentY += this.theme.spacing.lg;
    currentY = this.addEnhancedClientProfile(doc, clientData, currentY);
    
    // 4. Goals Analysis with Visual Enhancements
    doc.addPage();
    currentY = advisorData ? this.addProfessionalHeader(doc, advisorData, doc.internal.getNumberOfPages()) : this.margin;
    currentY = this.addEnhancedGoalsAnalysis(doc, editedGoals, currentY);
    
    // 5. AI Recommendations - Enhanced Presentation
    if (recommendations && Object.keys(recommendations).length > 0) {
      currentY = this.checkSpaceAndBreak(doc, currentY, 80, true);
      currentY += this.theme.spacing.lg;
      currentY = this.addRecommendations(doc, recommendations, currentY);
    }
    
    // 6. Advisor Recommendations - New Dedicated Section
    if (advisorData) {
      currentY = this.checkSpaceAndBreak(doc, currentY, 80, true);
      currentY += this.theme.spacing.lg;
      currentY = this.addAdvisorRecommendations(doc, advisorData, editedGoals, metrics, currentY);
    }
    
    // 7. Implementation Timeline with Visual Timeline
    currentY = this.checkSpaceAndBreak(doc, currentY, 100, true);
    currentY += this.theme.spacing.lg;
    currentY = this.addEnhancedImplementationTimeline(doc, editedGoals, currentY);
    
    // 8. Professional Disclaimers
    currentY = this.checkSpaceAndBreak(doc, currentY, 60, true);
    currentY += this.theme.spacing.lg;
    currentY = this.addProfessionalDisclaimers(doc, currentY);

    // 9. Enhanced Advisor Signature
    if (advisorData) {
      currentY = this.addEnhancedAdvisorSignature(doc, advisorData, clientData, currentY);
    }

    console.log('✅ [PDF Generator] Professional PDF generated successfully with enhanced design');
    return doc;
  }

  /**
   * Add professional header with enhanced branding
   */
  addProfessionalHeader(doc, advisorData, pageNumber = 1) {
    const headerHeight = 30;
    
    // Professional gradient background
    doc.setFillColor(...this.theme.colors.background.gradient);
    doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Premium accent strip
    doc.setFillColor(...this.theme.colors.primary);
    doc.rect(0, 0, this.pageWidth, 4, 'F');
    
    // Firm name with enhanced typography - with safe fallback
    doc.setFontSize(this.theme.fonts.sizes.heading2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    const firmName = this.safeDataExtract(advisorData, 'firmName', 'Financial Advisory Services');
    doc.text(firmName, this.margin, 14);
    
    // Advisor credentials with professional formatting - safe extraction
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[700]);
    
    let advisorInfo = '';
    if (advisorData && (advisorData.firstName || advisorData.lastName)) {
      const firstName = this.safeDataExtract(advisorData, 'firstName', '');
      const lastName = this.safeDataExtract(advisorData, 'lastName', '');
      advisorInfo = `${firstName} ${lastName}`.trim();
    }
    
    // If no valid advisor name, use default
    if (!advisorInfo) {
      advisorInfo = 'Financial Advisor';
    }
    
    const sebiInfo = this.safeDataExtract(advisorData, 'sebiRegNumber', '') 
      ? ` • SEBI Reg: ${advisorData.sebiRegNumber}` 
      : '';
    doc.text(`${advisorInfo}${sebiInfo}`, this.margin, 22);
    
    // Page info with elegant styling
    const rightX = this.pageWidth - this.margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setTextColor(...this.theme.colors.primary);
    doc.text(`Page ${pageNumber}`, rightX, 14, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(this.theme.fonts.sizes.tiny);
    doc.setTextColor(...this.theme.colors.gray[500]);
    doc.text(new Date().toLocaleDateString('en-IN'), rightX, 22, { align: 'right' });
    
    // Professional separator line
    doc.setDrawColor(...this.theme.colors.secondary);
    doc.setLineWidth(1.5);
    doc.line(this.margin, headerHeight - 4, this.pageWidth - this.margin, headerHeight - 4);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    return headerHeight + this.theme.spacing.sm;
  }

  /**
   * Add enhanced cover page with professional design
   */
  addEnhancedCoverPage(doc, clientData, advisorData, startY, cacheInfo) {
    // Add professional header
    let y = advisorData ? this.addProfessionalHeader(doc, advisorData, 1) : startY;
    y += this.theme.spacing.xl;
    
    // Premium title design
    doc.setFontSize(this.theme.fonts.sizes.title);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    const planTitle = this.getPlanTitle(cacheInfo?.planType || 'goal_based');
    doc.text(planTitle, this.pageWidth / 2, y, { align: 'center' });
    
    y += this.theme.spacing.lg;
    doc.setFontSize(this.theme.fonts.sizes.heading2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[700]);
    doc.text('Comprehensive Investment Strategy Report', this.pageWidth / 2, y, { align: 'center' });
    
    y += this.theme.spacing.xxl + 10;
    
    // Enhanced client information card
    const cardHeight = 75;
    
    // Main card with gradient effect
    doc.setFillColor(...this.theme.colors.background.light);
    doc.roundedRect(this.margin, y, this.contentWidth, cardHeight, 8, 8, 'F');
    
    // Premium border
    doc.setDrawColor(...this.theme.colors.secondary);
    doc.setLineWidth(2);
    doc.roundedRect(this.margin, y, this.contentWidth, cardHeight, 8, 8, 'S');
    
    // Accent stripe
    doc.setFillColor(...this.theme.colors.accent);
    doc.roundedRect(this.margin, y, this.contentWidth, 6, 8, 8, 'F');
    
    y += this.theme.spacing.lg;
    
    // Card title
    doc.setFontSize(this.theme.fonts.sizes.heading3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    doc.text('CLIENT PROFILE', this.margin + this.theme.spacing.md, y);
    
    y += this.theme.spacing.md;
    
    // Client details with professional formatting
    const clientDetails = [
      [`Name:`, `${clientData.firstName} ${clientData.lastName || ''}`],
      [`Age:`, `${this.calculateAge(clientData.dateOfBirth)} years`],
      [`Risk Profile:`, `${clientData.riskTolerance || 'Moderate'}`],
      [`Monthly Income:`, `₹${this.formatCurrency(clientData.totalMonthlyIncome || 0)}`]
    ];
    
    doc.setFontSize(this.theme.fonts.sizes.body);
    clientDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.theme.colors.gray[800]);
      doc.text(label, this.margin + this.theme.spacing.md, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.theme.colors.gray[700]);
      const labelWidth = doc.getTextWidth(label + ' ');
      doc.text(value, this.margin + this.theme.spacing.md + labelWidth, y);
      
      y += this.theme.spacing.sm + 2;
    });
    
    y += this.theme.spacing.xl;
    
    // Report metadata with elegant styling
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...this.theme.colors.gray[500]);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, this.margin, y);
    y += this.theme.spacing.sm;
    const planTypeLabel = this.getPlanTypeLabel(cacheInfo?.planType || 'goal_based');
    doc.text(`Plan Type: ${planTypeLabel}`, this.margin, y);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    return y;
  }

  /**
   * Add enhanced executive summary with professional design
   */
  addEnhancedExecutiveSummary(doc, clientData, editedGoals, metrics, startY) {
    let y = startY;
    
    // Professional section heading
    this.addSectionHeader(doc, 'EXECUTIVE SUMMARY', y);
    y += this.theme.spacing.xl;
    
    // Key Metrics with enhanced validation
    const summaryHeaders = ['Financial Metric', 'Current Status'];
    const summaryData = [
      ['Total Financial Goals', `${editedGoals?.length || 0} Goals Defined`],
      ['Required Monthly SIP', metrics?.totalRequiredSIP || 0],
      ['Available Monthly Surplus', this.calculateMonthlySurplus(clientData) || 0],
      ['Plan Feasibility Status', this.getFeasibilityStatus(metrics, clientData)],
      ['Investment Timeline', `${this.getMaxTimelineYears(metrics, editedGoals)} years`]
    ];

    // Validate and format data
    const validatedData = this.validateAndFormatTableData(summaryData, ['text', 'text']);

    // Create enhanced unbreakable table
    y = this.createEnhancedTable(doc, validatedData, summaryHeaders, y, {
      title: 'Key Financial Metrics',
      columnTypes: ['text', 'currency'],
      columnAlignments: ['left', 'right'],
      headerStyle: 'primary',
      unbreakable: true,
      fontSize: 10,
      headerFontSize: 11,
      cellPadding: 8,
      advisorData: null
    });

    // Financial Health Analysis
    y += this.theme.spacing.lg;
    this.addSubsectionHeader(doc, 'FINANCIAL HEALTH ANALYSIS', y);
    y += this.theme.spacing.md;

    // Calculate financial health metrics
    const monthlyIncome = this.safeDataExtract(clientData, 'totalMonthlyIncome', 0);
    const monthlyExpenses = this.safeDataExtract(clientData, 'totalMonthlyExpenses', 0);
    const surplus = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((surplus / monthlyIncome) * 100).toFixed(1) : 0;
    
    // Professional financial summary
    const financialAnalysis = this.generateFinancialAnalysis(monthlyIncome, monthlyExpenses, surplus, savingsRate, metrics);
    
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[800]);
    
    const analysisLines = this.wrapTextToWidth(doc, financialAnalysis, this.contentWidth, this.theme.fonts.sizes.body);
    analysisLines.forEach(line => {
      doc.text(line, this.margin, y);
      y += this.theme.fonts.sizes.body * this.theme.fonts.lineHeight.normal;
    });
    
    y += this.theme.spacing.lg;
    
    // Key financial indicators with visual elements
    const indicators = [
      { label: 'Cash Flow Status', value: surplus >= 0 ? 'Positive' : 'Needs Attention', status: surplus >= 0 ? 'success' : 'warning' },
      { label: 'Savings Rate', value: `${savingsRate}%`, status: savingsRate >= 20 ? 'success' : savingsRate >= 10 ? 'warning' : 'danger' },
      { label: 'Investment Readiness', value: this.getInvestmentReadiness(surplus, savingsRate), status: surplus > 0 && savingsRate >= 10 ? 'success' : 'warning' }
    ];
    
    indicators.forEach(indicator => {
      this.addFinancialIndicator(doc, indicator, y);
      y += this.theme.spacing.md;
    });

    doc.setTextColor(0, 0, 0); // Reset color
    return y + this.theme.spacing.md;
  }

  /**
   * Add section header with professional styling
   */
  addSectionHeader(doc, title, y) {
    doc.setFontSize(this.theme.fonts.sizes.heading1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    doc.text(title, this.margin, y);
    
    // Professional underline with gradient effect
    doc.setDrawColor(...this.theme.colors.secondary);
    doc.setLineWidth(2);
    doc.line(this.margin, y + 3, this.margin + 140, y + 3);
    
    doc.setDrawColor(...this.theme.colors.accent);
    doc.setLineWidth(1);
    doc.line(this.margin, y + 5, this.margin + 100, y + 5);
    
    doc.setTextColor(0, 0, 0); // Reset color
  }
  
  /**
   * Add subsection header
   */
  addSubsectionHeader(doc, title, y) {
    doc.setFontSize(this.theme.fonts.sizes.heading3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.gray[800]);
    doc.text(title, this.margin, y);
    
    doc.setDrawColor(...this.theme.colors.gray[300]);
    doc.setLineWidth(1);
    doc.line(this.margin, y + 2, this.margin + 80, y + 2);
    
    doc.setTextColor(0, 0, 0); // Reset color
  }
  
  /**
   * Calculate monthly surplus safely
   */
  calculateMonthlySurplus(clientData) {
    const income = this.safeDataExtract(clientData, 'totalMonthlyIncome', 0);
    const expenses = this.safeDataExtract(clientData, 'totalMonthlyExpenses', 0);
    return income - expenses;
  }
  
  /**
   * Get feasibility status with enhanced logic
   */
  getFeasibilityStatus(metrics, clientData) {
    if (metrics?.feasible === true) return '✓ Highly Achievable';
    if (metrics?.feasible === false) return '⚠ Requires Optimization';
    
    const surplus = this.calculateMonthlySurplus(clientData);
    if (surplus > 0) return '✓ Likely Achievable';
    return '⚠ Needs Review';
  }
  
  /**
   * Generate comprehensive financial analysis text
   */
  generateFinancialAnalysis(income, expenses, surplus, savingsRate, metrics) {
    let analysis = '';
    
    if (surplus > 0) {
      analysis += `Your current financial position shows a positive monthly surplus of ₹${this.formatCurrency(surplus)}, representing a ${savingsRate}% savings rate. `;
      
      if (savingsRate >= 20) {
        analysis += 'This excellent savings rate positions you strongly for achieving your financial goals ahead of schedule.';
      } else if (savingsRate >= 10) {
        analysis += 'This healthy savings rate provides a solid foundation for your investment strategy, with room for optimization.';
      } else {
        analysis += 'While positive, increasing your savings rate to 15-20% would significantly accelerate your financial progress.';
      }
    } else {
      analysis += `Your current expenses exceed income by ₹${this.formatCurrency(Math.abs(surplus))}, creating a monthly deficit. `;
      analysis += 'Immediate action is required to reduce expenses or increase income before pursuing investment goals.';
    }
    
    return analysis;
  }
  
  /**
   * Get investment readiness assessment
   */
  getInvestmentReadiness(surplus, savingsRate) {
    if (surplus <= 0) return 'Not Ready';
    if (savingsRate >= 20) return 'Excellent';
    if (savingsRate >= 10) return 'Good';
    return 'Moderate';
  }
  
  /**
   * Add financial indicator with visual styling
   */
  addFinancialIndicator(doc, indicator, y) {
    // Status color coding
    const statusColors = {
      success: this.theme.colors.success,
      warning: this.theme.colors.warning,
      danger: this.theme.colors.danger
    };
    
    // Indicator bullet
    doc.setFillColor(...statusColors[indicator.status]);
    doc.circle(this.margin + 3, y - 2, 2, 'F');
    
    // Label and value
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.gray[800]);
    doc.text(indicator.label + ':', this.margin + 10, y);
    
    const labelWidth = doc.getTextWidth(indicator.label + ': ');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...statusColors[indicator.status]);
    doc.text(indicator.value, this.margin + 10 + labelWidth, y);
    
    doc.setTextColor(0, 0, 0); // Reset color
  }

  /**
   * Add enhanced client profile
   */
  addEnhancedClientProfile(doc, clientData, startY) {
    let y = startY;
    
    this.addSectionHeader(doc, 'CLIENT PROFILE', y);
    y += this.theme.spacing.xl;

    // Personal Information with enhanced data handling
    const personalInfo = [
      ['Full Name', `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'Not provided'],
      ['Date of Birth', clientData.dateOfBirth ? new Date(clientData.dateOfBirth).toLocaleDateString('en-IN') : 'Not provided'],
      ['Age', this.calculateAge(clientData.dateOfBirth) || 'Not available'],
      ['Marital Status', clientData.maritalStatus || 'Not specified'],
      ['Occupation', clientData.occupation || 'Not specified'],
      ['Risk Tolerance', clientData.riskTolerance || 'Moderate']
    ];

    // Create enhanced unbreakable table for personal info
    y = this.createEnhancedTable(doc, personalInfo, ['Personal Details', 'Information'], y, {
      title: 'Personal Information',
      columnTypes: ['text', 'text'],
      columnAlignments: ['left', 'left'],
      headerStyle: 'secondary',
      unbreakable: true,
      fontSize: 9,
      headerFontSize: 10,
      cellPadding: 6
    });

    // Financial Summary with enhanced calculations
    const financialInfo = [
      ['Monthly Income', this.safeDataExtract(clientData, 'totalMonthlyIncome', 0)],
      ['Monthly Expenses', this.safeDataExtract(clientData, 'totalMonthlyExpenses', 0)],
      ['Monthly Surplus', this.calculateMonthlySurplus(clientData)],
      ['Annual Income', this.safeDataExtract(clientData, 'annualIncome', (clientData.totalMonthlyIncome || 0) * 12)],
      ['Current Assets', this.calculateTotalAssets(clientData.assets || {})],
      ['Total Liabilities', this.calculateTotalLiabilities(clientData.debtsAndLiabilities || {})]
    ];

    // Create enhanced financial overview table
    y = this.createEnhancedTable(doc, financialInfo, ['Financial Aspect', 'Amount'], y, {
      title: 'Financial Overview',
      columnTypes: ['text', 'currency'],
      columnAlignments: ['left', 'right'],
      headerStyle: 'secondary',
      unbreakable: true,
      fontSize: 9,
      headerFontSize: 10,
      cellPadding: 6
    });
    
    return y;
  }

  /**
   * Add enhanced goals analysis with professional presentation
   */
  addEnhancedGoalsAnalysis(doc, editedGoals, startY) {
    let y = startY;
    
    // Professional section header
    this.addSectionHeader(doc, 'GOALS ANALYSIS & SIP REQUIREMENTS', y);
    y += this.theme.spacing.xl;

    // Validate goals data
    if (!editedGoals || editedGoals.length === 0) {
      this.addEmptyStateMessage(doc, 'No financial goals have been defined yet.', 
        'Goals analysis will appear here once you define your financial objectives.', y);
      return y + this.theme.spacing.xxl;
    }

    // Goals Summary Table with enhanced data processing
    const goalsTableHeaders = ['#', 'Goal Name', 'Target Amount', 'Target Year', 'Time Horizon', 'Monthly SIP', 'Priority Level'];
    const goalsTableData = editedGoals.map((goal, index) => [
      `${index + 1}`,
      this.safeDataExtract(goal, 'title', 'Unnamed Goal'),
      goal?.targetAmount || 0,
      this.safeDataExtract(goal, 'targetYear', 'TBD'),
      goal?.timeInYears ? `${goal.timeInYears} years` : 'TBD',
      goal?.monthlySIP || 0,
      this.safeDataExtract(goal, 'priority', 'Medium')
    ]);

    // Create enhanced unbreakable goals table
    y = this.createEnhancedTable(doc, goalsTableData, goalsTableHeaders, y, {
      title: 'Financial Goals Overview',
      columnTypes: ['text', 'text', 'currency', 'text', 'text', 'currency', 'text'],
      columnAlignments: ['center', 'left', 'right', 'center', 'center', 'right', 'center'],
      headerStyle: 'primary',
      unbreakable: true,
      fontSize: 8,
      headerFontSize: 9,
      cellPadding: 5
    });

    // Detailed Goal Breakdown with professional design
    y += this.theme.spacing.lg;
    this.addSubsectionHeader(doc, 'DETAILED GOAL ANALYSIS', y);
    y += this.theme.spacing.md;

    editedGoals.forEach((goal, index) => {
      // Smart page management
      y = this.checkSpaceAndBreak(doc, y, 80, true);

      // Goal card design
      y = this.addGoalCard(doc, goal, index + 1, y);
      y += this.theme.spacing.md;
    });

    return y;
  }
  
  /**
   * Add empty state message with professional styling
   */
  addEmptyStateMessage(doc, title, subtitle, y) {
    // Title
    doc.setFontSize(this.theme.fonts.sizes.heading4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.gray[600]);
    doc.text(title, this.margin, y);
    
    // Subtitle
    y += this.theme.spacing.sm;
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[500]);
    doc.text(subtitle, this.margin, y);
    
    doc.setTextColor(0, 0, 0); // Reset color
  }
  
  /**
   * Add individual goal card with professional design
   */
  addGoalCard(doc, goal, goalNumber, startY) {
    let y = startY;
    const cardHeight = 50;
    
    // Goal card background
    doc.setFillColor(...this.theme.colors.background.light);
    doc.roundedRect(this.margin, y, this.contentWidth, cardHeight, 5, 5, 'F');
    
    // Goal card border
    doc.setDrawColor(...this.theme.colors.gray[300]);
    doc.setLineWidth(1);
    doc.roundedRect(this.margin, y, this.contentWidth, cardHeight, 5, 5, 'S');
    
    // Priority indicator stripe
    const priorityColor = this.getPriorityColor(goal?.priority);
    doc.setFillColor(...priorityColor);
    doc.roundedRect(this.margin, y, 5, cardHeight, 2, 2, 'F');
    
    y += this.theme.spacing.sm;
    
    // Goal title
    doc.setFontSize(this.theme.fonts.sizes.heading4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    doc.text(`${goalNumber}. ${this.safeDataExtract(goal, 'title', 'Unnamed Goal')}`, this.margin + 10, y);
    
    y += this.theme.spacing.sm;
    
    // Goal details in columns
    const goalDetails = [
      { label: 'Target', value: goal?.targetAmount ? `₹${this.formatCurrency(goal.targetAmount)}` : 'TBD' },
      { label: 'Timeline', value: goal?.timeInYears ? `${goal.timeInYears} years` : 'TBD' },
      { label: 'Monthly SIP', value: goal?.monthlySIP ? `₹${this.formatCurrency(goal.monthlySIP)}` : 'Calculating...' },
      { label: 'Priority', value: this.safeDataExtract(goal, 'priority', 'Medium') }
    ];
    
    // Display details in a grid
    const colWidth = (this.contentWidth - 20) / 2;
    let currentX = this.margin + 10;
    let currentRow = 0;
    
    goalDetails.forEach((detail, index) => {
      if (index > 0 && index % 2 === 0) {
        currentRow++;
        currentX = this.margin + 10;
        y += this.theme.spacing.sm;
      }
      
      doc.setFontSize(this.theme.fonts.sizes.tiny);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.theme.colors.gray[600]);
      doc.text(detail.label + ':', currentX, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.theme.colors.gray[800]);
      doc.text(detail.value, currentX, y + 4);
      
      currentX += colWidth;
    });
    
    doc.setTextColor(0, 0, 0); // Reset color
    return startY + cardHeight + this.theme.spacing.sm;
  }
  
  /**
   * Get priority color coding
   */
  getPriorityColor(priority) {
    switch ((priority || '').toLowerCase()) {
      case 'high': return this.theme.colors.danger;
      case 'medium': return this.theme.colors.warning;
      case 'low': return this.theme.colors.success;
      default: return this.theme.colors.gray[400];
    }
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

    return y;
  }
  
  /**
   * Add analysis card for individual goals
   */
  addAnalysisCard(doc, analysis, goalNumber, startY) {
    let y = startY;
    
    // Card title
    doc.setFontSize(this.theme.fonts.sizes.heading4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.secondary);
    doc.text(`Goal ${goalNumber}: ${analysis.goalTitle || 'Analysis'}`, this.margin, y);
    y += this.theme.spacing.sm;
    
    // Feasibility analysis
    if (analysis.feasibilityAnalysis) {
      y = this.addContentBlock(doc, 'Feasibility Analysis', analysis.feasibilityAnalysis, y);
    }
    
    // Optimization suggestions
    if (analysis.optimizationSuggestions) {
      y = this.addContentBlock(doc, 'Optimization Suggestions', analysis.optimizationSuggestions, y);
    }
    
    doc.setTextColor(0, 0, 0); // Reset color
    return y;
  }
  
  /**
   * Add content block with title and text
   */
  addContentBlock(doc, title, content, startY) {
    let y = startY;
    
    // Block title
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.gray[700]);
    doc.text(title + ':', this.margin + 5, y);
    y += this.theme.spacing.xs;
    
    // Block content
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[600]);
    
    const contentLines = this.wrapTextToWidth(doc, content, this.contentWidth - 10, this.theme.fonts.sizes.small);
    contentLines.forEach(line => {
      doc.text(line, this.margin + 10, y);
      y += this.theme.fonts.sizes.small * this.theme.fonts.lineHeight.normal;
    });
    
    return y + this.theme.spacing.xs;
  }
  
  /**
   * Add action item with priority indicator
   */
  addActionItem(doc, action, itemNumber, startY, priority = 'medium') {
    let y = startY;
    
    // Priority indicator
    const priorityColors = {
      high: this.theme.colors.danger,
      medium: this.theme.colors.warning,
      low: this.theme.colors.success
    };
    
    doc.setFillColor(...priorityColors[priority]);
    doc.circle(this.margin + 4, y - 2, 2, 'F');
    
    // Action text
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[800]);
    
    const actionText = `${itemNumber}. ${action}`;
    const actionLines = this.wrapTextToWidth(doc, actionText, this.contentWidth - 15, this.theme.fonts.sizes.body);
    
    actionLines.forEach(line => {
      doc.text(line, this.margin + 10, y);
      y += this.theme.fonts.sizes.body * this.theme.fonts.lineHeight.normal;
    });
    
    return y + this.theme.spacing.xs;
  }
  
  /**
   * Add risk profile card
   */
  addRiskProfileCard(doc, riskProfile, startY) {
    let y = startY;
    
    // Risk profile indicator
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    doc.text('Overall Risk Profile:', this.margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[700]);
    const labelWidth = doc.getTextWidth('Overall Risk Profile: ');
    doc.text(riskProfile, this.margin + labelWidth, y);
    
    return y + this.theme.spacing.md;
  }
  
  /**
   * Add risks list with color coding
   */
  addRisksList(doc, title, risks, startY, type = 'warning') {
    let y = startY;
    
    // List title
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.gray[800]);
    doc.text(title + ':', this.margin, y);
    y += this.theme.spacing.xs;
    
    // List items
    const typeColors = {
      warning: this.theme.colors.warning,
      success: this.theme.colors.success,
      danger: this.theme.colors.danger
    };
    
    risks.forEach(risk => {
      // Bullet point
      doc.setFillColor(...typeColors[type]);
      doc.circle(this.margin + 8, y - 2, 1.5, 'F');
      
      // Risk text
      doc.setFontSize(this.theme.fonts.sizes.small);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.theme.colors.gray[700]);
      
      const riskLines = this.wrapTextToWidth(doc, risk, this.contentWidth - 20, this.theme.fonts.sizes.small);
      riskLines.forEach(line => {
        doc.text(line, this.margin + 15, y);
        y += this.theme.fonts.sizes.small * this.theme.fonts.lineHeight.normal;
      });
      
      y += this.theme.spacing.xs;
    });
    
    return y + this.theme.spacing.sm;
  }
  
  /**
   * Add dedicated advisor recommendations section
   */
  addAdvisorRecommendations(doc, advisorData, editedGoals, metrics, startY) {
    let y = startY;
    
    this.addSectionHeader(doc, 'ADVISOR RECOMMENDATIONS', y);
    y += this.theme.spacing.xl;
    
    // Personalized advisor message
    const advisorMessage = this.generateAdvisorMessage(advisorData, editedGoals, metrics);
    
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[700]);
    
    const messageLines = this.wrapTextToWidth(doc, advisorMessage, this.contentWidth, this.theme.fonts.sizes.body);
    messageLines.forEach(line => {
      doc.text(line, this.margin, y);
      y += this.theme.fonts.sizes.body * this.theme.fonts.lineHeight.normal;
    });
    
    y += this.theme.spacing.lg;
    
    // Advisor-specific recommendations
    const advisorRecommendations = this.generateAdvisorSpecificRecommendations(editedGoals, metrics);
    
    advisorRecommendations.forEach((recommendation, index) => {
      y = this.addActionItem(doc, recommendation, index + 1, y, 'high');
    });
    
    doc.setTextColor(0, 0, 0); // Reset color
    return y + this.theme.spacing.md;
  }
  
  /**
   * Generate personalized advisor message
   */
  generateAdvisorMessage(advisorData, editedGoals, metrics) {
    const advisorName = advisorData ? `${advisorData.firstName} ${advisorData.lastName}` : 'Your Financial Advisor';
    const goalsCount = editedGoals?.length || 0;
    
    return `As your dedicated financial advisor, I have carefully reviewed your ${goalsCount} financial goals and current financial position. Based on my analysis of your income, expenses, risk tolerance, and investment timeline, I recommend the following strategic approach to help you achieve your objectives efficiently and within your target timeframes.`;
  }
  
  /**
   * Generate advisor-specific recommendations
   */
  generateAdvisorSpecificRecommendations(editedGoals, metrics) {
    const recommendations = [];
    
    // Emergency fund recommendation
    recommendations.push('Establish an emergency fund covering 6-8 months of expenses before starting aggressive investments.');
    
    // SIP recommendation
    if (editedGoals && editedGoals.length > 0) {
      recommendations.push('Set up systematic investment plans (SIPs) for each goal to benefit from rupee cost averaging.');
    }
    
    // Review recommendation
    recommendations.push('Schedule quarterly portfolio reviews to track progress and make necessary adjustments.');
    
    // Tax optimization
    recommendations.push('Utilize tax-efficient investment options like ELSS, PPF, and NPS to optimize your tax liability.');
    
    // Diversification
    recommendations.push('Maintain proper asset allocation across equity, debt, and alternative investments based on your risk profile.');
    
    return recommendations;
  }

  /**
   * Add enhanced implementation timeline with visual elements
   */
  addEnhancedImplementationTimeline(doc, editedGoals, startY) {
    let y = startY;
    
    this.addSectionHeader(doc, 'IMPLEMENTATION TIMELINE', y);
    y += this.theme.spacing.xl;

    if (!editedGoals || editedGoals.length === 0) {
      this.addEmptyStateMessage(doc, 'No goals defined for timeline planning.', 
        'Implementation timeline will appear here once goals are established.', y);
      return y + this.theme.spacing.xxl;
    }

    // Sort goals by target year for timeline visualization
    const sortedGoals = [...editedGoals].sort((a, b) => (a.targetYear || 9999) - (b.targetYear || 9999));

    // Enhanced Timeline Table
    const timelineHeaders = ['Goal Name', 'Target Year', 'Monthly Investment', 'Implementation Status', 'Priority Level'];
    const timelineData = sortedGoals.map(goal => [
      this.safeDataExtract(goal, 'title', 'Unnamed Goal'),
      goal?.targetYear ? `${goal.targetYear}` : 'To Be Determined',
      goal?.monthlySIP ? `₹${this.formatCurrency(goal.monthlySIP)}` : 'Calculating...',
      'Ready to Start',
      this.safeDataExtract(goal, 'priority', 'Medium')
    ]);

    // Create professional timeline table
    y = this.createProfessionalTable(doc, timelineData, timelineHeaders, y, {
      title: 'Goal Implementation Schedule',
      headerStyle: 'primary',
      alternateRows: true,
      fontSize: this.theme.fonts.sizes.small,
      cellPadding: 6
    });

    // Implementation Action Plan
    y += this.theme.spacing.lg;
    this.addSubsectionHeader(doc, 'IMPLEMENTATION ACTION PLAN', y);
    y += this.theme.spacing.md;
    
    const actionItems = [
      { action: 'Complete KYC documentation and open investment accounts with recommended fund houses', timeline: 'Week 1-2', priority: 'high' },
      { action: 'Set up systematic investment plans (SIPs) for each defined financial goal', timeline: 'Week 3', priority: 'high' },
      { action: 'Establish emergency fund equivalent to 6 months of expenses', timeline: 'Month 1-3', priority: 'high' },
      { action: 'Review and optimize existing investment portfolio alignment', timeline: 'Month 1', priority: 'medium' },
      { action: 'Schedule quarterly progress reviews and portfolio rebalancing', timeline: 'Ongoing', priority: 'medium' },
      { action: 'Implement tax-saving investment strategies before financial year-end', timeline: 'As needed', priority: 'medium' }
    ];
    
    actionItems.forEach((item, index) => {
      y = this.addTimelineActionItem(doc, item, index + 1, y);
    });

    return y + this.theme.spacing.md;
  }
  
  /**
   * Add timeline action item with enhanced formatting
   */
  addTimelineActionItem(doc, item, itemNumber, startY) {
    let y = startY;
    
    // Priority indicator and number
    const priorityColors = {
      high: this.theme.colors.danger,
      medium: this.theme.colors.warning,
      low: this.theme.colors.success
    };
    
    doc.setFillColor(...priorityColors[item.priority]);
    doc.circle(this.margin + 4, y - 2, 2, 'F');
    
    // Item number
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    doc.text(`${itemNumber}.`, this.margin + 10, y);
    
    // Action description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[800]);
    const actionLines = this.wrapTextToWidth(doc, item.action, this.contentWidth - 60, this.theme.fonts.sizes.body);
    
    actionLines.forEach((line, lineIndex) => {
      doc.text(line, this.margin + 20, y + (lineIndex * this.theme.fonts.sizes.body * this.theme.fonts.lineHeight.normal));
    });
    
    // Timeline indicator
    const actionHeight = actionLines.length * this.theme.fonts.sizes.body * this.theme.fonts.lineHeight.normal;
    doc.setFontSize(this.theme.fonts.sizes.tiny);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...this.theme.colors.gray[500]);
    doc.text(`Timeline: ${item.timeline}`, this.pageWidth - this.margin - 50, y, { align: 'right' });
    
    doc.setTextColor(0, 0, 0); // Reset color
    return y + Math.max(actionHeight, this.theme.fonts.sizes.body * this.theme.fonts.lineHeight.normal) + this.theme.spacing.xs;
  }

  /**
   * Add professional disclaimers with enhanced formatting
   */
  addProfessionalDisclaimers(doc, startY) {
    let y = startY;
    
    y = this.checkSpaceAndBreak(doc, y, 80, true);
    
    this.addSectionHeader(doc, 'IMPORTANT DISCLAIMERS', y);
    y += this.theme.spacing.xl;
    
    // Professional disclaimer box
    const disclaimerHeight = 60;
    doc.setFillColor(...this.theme.colors.background.light);
    doc.roundedRect(this.margin, y, this.contentWidth, disclaimerHeight, 5, 5, 'F');
    
    doc.setDrawColor(...this.theme.colors.gray[300]);
    doc.setLineWidth(1);
    doc.roundedRect(this.margin, y, this.contentWidth, disclaimerHeight, 5, 5, 'S');
    
    // Warning icon area
    doc.setFillColor(...this.theme.colors.warning);
    doc.roundedRect(this.margin, y, 6, disclaimerHeight, 5, 5, 'F');
    
    y += this.theme.spacing.sm;
    
    const disclaimers = [
      'This financial plan is based on information provided and reflects current market conditions and assumptions.',
      'Past performance of investments does not guarantee future results. All investments carry market risks.',
      'This report is generated using AI-assisted analysis and should be reviewed with a qualified advisor.',
      'Please consult with your financial advisor before making any investment decisions.',
      'Regular review and updates of this plan are recommended as your circumstances change.',
      'Tax implications and regulatory changes may affect the recommendations provided.'
    ];
    
    doc.setFontSize(this.theme.fonts.sizes.tiny);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[600]);
    
    disclaimers.forEach(disclaimer => {
      const disclaimerLines = this.wrapTextToWidth(doc, `• ${disclaimer}`, this.contentWidth - 15, this.theme.fonts.sizes.tiny);
      disclaimerLines.forEach(line => {
        doc.text(line, this.margin + 10, y);
        y += this.theme.fonts.sizes.tiny * this.theme.fonts.lineHeight.normal;
      });
      y += 1;
    });

    doc.setTextColor(0, 0, 0); // Reset color
    return y + this.theme.spacing.sm;
  }

  /**
   * Add enhanced advisor signature with professional styling
   */
  addEnhancedAdvisorSignature(doc, advisorData, clientData, startY) {
    if (!advisorData) return startY;

    let y = startY + this.theme.spacing.xl;
    
    // Ensure adequate space for signature section
    y = this.checkSpaceAndBreak(doc, y, 100, true);
    
    this.addSectionHeader(doc, 'PREPARED BY', y);
    y += this.theme.spacing.xl;

    // Premium advisor credentials card
    const cardHeight = 70;
    
    // Main card with professional styling
    doc.setFillColor(...this.theme.colors.background.gradient);
    doc.roundedRect(this.margin, y, this.contentWidth, cardHeight, 8, 8, 'F');
    
    // Premium border with accent
    doc.setDrawColor(...this.theme.colors.primary);
    doc.setLineWidth(2);
    doc.roundedRect(this.margin, y, this.contentWidth, cardHeight, 8, 8, 'S');
    
    // Gold accent stripe
    doc.setFillColor(...this.theme.colors.accent);
    doc.roundedRect(this.margin, y, this.contentWidth, 4, 8, 8, 'F');
    
    y += this.theme.spacing.lg;
    
    // Advisor name with enhanced typography
    doc.setFontSize(this.theme.fonts.sizes.heading3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.theme.colors.primary);
    doc.text(`${advisorData.firstName} ${advisorData.lastName}`, this.margin + this.theme.spacing.md, y);
    
    y += this.theme.spacing.sm;
    
    // Firm name
    doc.setFontSize(this.theme.fonts.sizes.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.theme.colors.gray[700]);
    doc.text(advisorData.firmName || 'Financial Advisory Services', this.margin + this.theme.spacing.md, y);
    
    y += this.theme.spacing.xs;
    
    // Credentials in professional format
    const credentials = [];
    if (advisorData.sebiRegNumber) {
      credentials.push(`SEBI Reg: ${advisorData.sebiRegNumber}`);
    }
    if (advisorData.email) {
      credentials.push(`Email: ${advisorData.email}`);
    }
    if (advisorData.phoneNumber) {
      credentials.push(`Phone: ${advisorData.phoneNumber}`);
    }
    
    if (credentials.length > 0) {
      doc.setFontSize(this.theme.fonts.sizes.small);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.theme.colors.gray[600]);
      doc.text(credentials.join(' • '), this.margin + this.theme.spacing.md, y);
    }
    
    y += cardHeight - this.theme.spacing.lg + this.theme.spacing.md;
    
    // Professional dedication message
    doc.setFontSize(this.theme.fonts.sizes.small);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...this.theme.colors.gray[600]);
    
    const dedicationMessage = `This comprehensive financial plan has been specifically prepared for ${clientData.firstName} ${clientData.lastName || ''} and reflects their unique financial situation and goals.`;
    const dedicationLines = this.wrapTextToWidth(doc, dedicationMessage, this.contentWidth, this.theme.fonts.sizes.small);
    
    dedicationLines.forEach(line => {
      doc.text(line, this.margin, y);
      y += this.theme.fonts.sizes.small * this.theme.fonts.lineHeight.normal;
    });
    
    y += this.theme.spacing.xs;
    
    // Generation timestamp
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.margin, y);

    doc.setTextColor(0, 0, 0); // Reset color
    return y + this.theme.spacing.md;
  }

  // Enhanced Utility Functions

  /**
   * Smart page break with professional header continuation
   */
  checkPageBreak(doc, currentY, requiredSpace = 30, addHeader = true) {
    if (currentY + requiredSpace > this.pageHeight - this.margin) {
      doc.addPage();
      let newY = this.margin;
      
      // Add professional header to new page if requested
      if (addHeader && doc.advisorData) {
        newY = this.addProfessionalHeader(doc, doc.advisorData, doc.internal.getNumberOfPages());
      } else if (addHeader) {
        // Subtle continuation indicator
        doc.setDrawColor(...this.theme.colors.gray[300]);
        doc.setLineWidth(0.5);
        doc.line(this.margin, newY, this.pageWidth - this.margin, newY);
        newY += this.theme.spacing.sm;
      }
      
      return newY;
    }
    return currentY;
  }

  /**
   * Enhanced responsive column width calculation (legacy method - kept for compatibility)
   */
  calculateResponsiveColumnWidths(headers, data, availableWidth = this.contentWidth) {
    // Delegate to the new optimal calculation method
    return this.calculateOptimalColumnWidths({ setFontSize: () => {}, getTextWidth: () => 10 }, data, headers, availableWidth, this.theme.fonts.sizes.body);
  }

  /**
   * Wrap text for column (legacy method - kept for compatibility)
   */
  wrapTextForColumn(doc, text, maxWidth, fontSize = 10) {
    return this.wrapTextToWidth(doc, text, maxWidth - 4, fontSize);
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
    if (!amount || amount === 0 || isNaN(amount)) return '₹0';
    
    try {
      // Handle string amounts that might be passed
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return '₹0';
      
      const formatted = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(Math.round(numAmount));
      
      return `₹${formatted}`;
    } catch (error) {
      console.warn('⚠️ [PDF Generator] Error formatting currency:', error);
      return `₹${amount}`;
    }
  }

  // Enhanced number formatting with proper alignment
  formatNumber(value, isAmount = false) {
    if (value === null || value === undefined || value === '') return '';
    
    if (isAmount) {
      return this.formatCurrency(value);
    }
    
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-IN').format(value);
    }
    
    return String(value);
  }

  // Calculate text width for proper alignment
  getTextWidth(doc, text, fontSize = 10) {
    doc.setFontSize(fontSize);
    return doc.getTextWidth(text);
  }

  // Create unbreakable content sections
  createUnbreakableSection(doc, sectionData, startY, options = {}) {
    const {
      title = null,
      minHeight = 60,
      allowPageBreak = false,
      padding = 10
    } = options;

    let currentY = startY;
    const estimatedHeight = this.calculateSectionHeight(doc, sectionData, options);
    
    // Check if we need a page break BEFORE starting the section
    if (currentY + estimatedHeight > this.pageHeight - this.margin - 20) {
      if (allowPageBreak) {
        doc.addPage();
        this.addProfessionalHeader(doc, this.safeDataExtract(sectionData, 'advisorData'), doc.getNumberOfPages());
        currentY = this.margin + 40;
      }
    }

    // Add section title
    if (title) {
      currentY = this.addSectionHeader(doc, title, currentY);
      currentY += this.theme.spacing.sm;
    }

    return currentY;
  }

  // Calculate estimated section height
  calculateSectionHeight(doc, sectionData, options = {}) {
    const { title, data = [], baseHeight = 40 } = options;
    let height = baseHeight;
    
    if (title) height += 25;
    if (data && Array.isArray(data)) {
      height += data.length * 20; // Estimate 20px per row
    }
    
    return height;
  }

  // Enhanced table creation with unbreakable sections and better alignment
  createEnhancedTable(doc, data, headers, startY, options = {}) {
    const {
      title = null,
      columnTypes = [], // 'text', 'number', 'currency'
      columnAlignments = [], // 'left', 'center', 'right'
      headerStyle = 'primary',
      unbreakable = true,
      minRowsPerPage = 3,
      fontSize = 10,
      headerFontSize = 11,
      cellPadding = 8,
      maxWidth = this.contentWidth - 10
    } = options;

    let y = startY;
    
    // Validate data
    if (!data || data.length === 0) {
      console.warn('⚠️ [PDF Generator] No data provided for table');
      return y;
    }

    // Add title if provided
    if (title) {
      doc.setFontSize(this.theme.fonts.sizes.heading3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.theme.colors.primary);
      doc.text(title, this.margin, y);
      y += this.theme.spacing.md;
      doc.setTextColor(0, 0, 0); // Reset color
    }

    // Calculate optimal column widths based on content type
    const numColumns = headers ? headers.length : (data[0] ? data[0].length : 1);
    const columnWidths = this.calculateSmartColumnWidths(doc, data, headers, maxWidth, columnTypes, fontSize);
    
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = this.margin + (maxWidth - tableWidth) / 2; // Center table

    // Estimate table height
    const headerHeight = headers ? (cellPadding * 2 + headerFontSize * 1.2) : 0;
    const rowHeight = cellPadding * 2 + fontSize * 1.2;
    const totalTableHeight = headerHeight + (data.length * rowHeight);

    // Check if we need unbreakable rendering
    if (unbreakable && y + totalTableHeight > this.pageHeight - this.margin - 20) {
      doc.addPage();
      this.addProfessionalHeader(doc, options.advisorData, doc.getNumberOfPages());
      y = this.margin + 40;
      
      // Re-add title on new page
      if (title) {
        doc.setFontSize(this.theme.fonts.sizes.heading3);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.theme.colors.primary);
        doc.text(title, this.margin, y);
        y += this.theme.spacing.md;
        doc.setTextColor(0, 0, 0);
      }
    }

    // Draw headers
    if (headers) {
      y = this.drawEnhancedTableHeaders(doc, headers, columnWidths, tableStartX, y, headerFontSize, cellPadding, headerStyle);
    }

    // Draw data rows
    y = this.drawEnhancedTableRows(doc, data, columnWidths, tableStartX, y, fontSize, cellPadding, columnTypes, columnAlignments);

    return y + this.theme.spacing.md;
  }

  // Calculate smart column widths based on content type and actual content
  calculateSmartColumnWidths(doc, data, headers, maxWidth, columnTypes, fontSize) {
    const numColumns = headers ? headers.length : (data[0] ? data[0].length : 1);
    const minColWidth = 50; // Minimum column width
    const availableWidth = maxWidth - 30; // Leave margin for borders
    
    // Calculate ideal widths based on content analysis
    let columnWidths = new Array(numColumns).fill(0);
    
    // Analyze header text requirements
    if (headers) {
      headers.forEach((header, index) => {
        const headerText = String(header || '');
        const headerWidth = this.getTextWidth(doc, headerText, fontSize + 1) + 16; // Extra for padding
        columnWidths[index] = Math.max(columnWidths[index], headerWidth);
      });
    }
    
    // Analyze data content requirements
    if (data && data.length > 0) {
      data.slice(0, Math.min(5, data.length)).forEach(row => { // Sample first 5 rows
        row.forEach((cell, colIndex) => {
          if (colIndex < numColumns) {
            let cellText = '';
            const columnType = columnTypes[colIndex] || 'text';
            
            if (columnType === 'currency' && (cell || cell === 0)) {
              cellText = this.formatCurrency(cell);
            } else if (columnType === 'number' && (cell || cell === 0)) {
              cellText = this.formatNumber(cell);
            } else {
              cellText = String(cell || '');
            }
            
            const cellWidth = this.getTextWidth(doc, cellText, fontSize) + 12; // Extra for padding
            columnWidths[colIndex] = Math.max(columnWidths[colIndex], cellWidth);
          }
        });
      });
    }
    
    // Apply content type weights
    if (columnTypes && columnTypes.length === numColumns) {
      const weightMap = { 
        text: 1.4,      // Text columns need more space
        number: 0.8,    // Numbers are usually shorter
        currency: 1.0   // Currency needs moderate space
      };
      
      columnWidths = columnWidths.map((width, index) => {
        const type = columnTypes[index] || 'text';
        const weight = weightMap[type] || 1;
        return width * weight;
      });
    }
    
    // Ensure minimum widths
    columnWidths = columnWidths.map(width => Math.max(minColWidth, width));
    
    // Scale to fit available width
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    if (totalWidth > availableWidth) {
      const scaleFactor = availableWidth / totalWidth;
      columnWidths = columnWidths.map(width => width * scaleFactor);
    } else if (totalWidth < availableWidth * 0.8) {
      // If we have extra space, distribute it proportionally
      const extraSpace = availableWidth - totalWidth;
      const totalCurrentWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      columnWidths = columnWidths.map(width => 
        width + (width / totalCurrentWidth) * extraSpace
      );
    }
    
    // Final minimum width check
    columnWidths = columnWidths.map(width => Math.max(minColWidth, width));
    
    return columnWidths;
  }

  // Draw enhanced table headers with proper styling and text wrapping
  drawEnhancedTableHeaders(doc, headers, columnWidths, startX, startY, fontSize, cellPadding, headerStyle) {
    const headerColors = {
      primary: this.theme.colors.primary,
      secondary: this.theme.colors.secondary,
      accent: this.theme.colors.accent
    };

    const headerColor = headerColors[headerStyle] || this.theme.colors.primary;
    
    // Calculate dynamic row height based on header content
    let maxHeaderHeight = fontSize * 1.2;
    const processedHeaders = headers.map((header, index) => {
      const cellWidth = columnWidths[index];
      const availableWidth = cellWidth - (cellPadding * 2);
      const text = this.abbreviateHeaderText(String(header || ''), availableWidth, fontSize, doc);
      const wrappedLines = this.wrapTextToWidth(doc, text, availableWidth, fontSize);
      maxHeaderHeight = Math.max(maxHeaderHeight, wrappedLines.length * fontSize * 1.2);
      return { text, wrappedLines, cellWidth };
    });
    
    const rowHeight = cellPadding * 2 + maxHeaderHeight;

    // Draw header background
    doc.setFillColor(...headerColor);
    doc.rect(startX, startY, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');

    // Draw header borders for better separation
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    let borderX = startX;
    columnWidths.forEach(width => {
      if (borderX > startX) { // Don't draw left border for first column
        doc.line(borderX, startY, borderX, startY + rowHeight);
      }
      borderX += width;
    });

    // Set header text properties
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text

    // Draw header text with proper wrapping
    let currentX = startX;
    processedHeaders.forEach((headerInfo, index) => {
      const { wrappedLines, cellWidth } = headerInfo;
      
      // Calculate vertical centering
      const totalTextHeight = wrappedLines.length * fontSize * 1.2;
      const startTextY = startY + cellPadding + (rowHeight - cellPadding * 2 - totalTextHeight) / 2 + fontSize * 0.7;
      
      // Draw each line of wrapped text
      wrappedLines.forEach((line, lineIndex) => {
        const textWidth = this.getTextWidth(doc, line, fontSize);
        const textX = currentX + (cellWidth - textWidth) / 2; // Center horizontally
        const textY = startTextY + (lineIndex * fontSize * 1.2);
        
        doc.text(line, textX, textY);
      });
      
      currentX += cellWidth;
    });

    // Reset properties
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    
    return startY + rowHeight;
  }

  // Create smart header abbreviations
  abbreviateHeaderText(text, availableWidth, fontSize, doc) {
    // Check if text fits as-is
    const textWidth = this.getTextWidth(doc, text, fontSize);
    if (textWidth <= availableWidth) {
      return text;
    }

    // Common abbreviations for financial table headers
    const abbreviations = {
      'Financial Metric': 'Metric',
      'Current Status': 'Status',
      'Target Amount': 'Amount',
      'Target Year': 'Year',
      'Time Horizon': 'Timeline',
      'Monthly SIP': 'SIP',
      'Priority Level': 'Priority',
      'Goal Name': 'Goal',
      'Personal Details': 'Details',
      'Information': 'Info',
      'Financial Aspect': 'Aspect'
    };

    // Try abbreviation first
    if (abbreviations[text]) {
      const abbrevWidth = this.getTextWidth(doc, abbreviations[text], fontSize);
      if (abbrevWidth <= availableWidth) {
        return abbreviations[text];
      }
    }

    // If still too long, truncate intelligently
    const words = text.split(' ');
    if (words.length > 1) {
      // Try first word only
      const firstWordWidth = this.getTextWidth(doc, words[0], fontSize);
      if (firstWordWidth <= availableWidth) {
        return words[0];
      }
    }

    // Last resort: truncate with ellipsis
    let truncated = text;
    while (this.getTextWidth(doc, truncated + '...', fontSize) > availableWidth && truncated.length > 3) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + (truncated.length < text.length ? '...' : '');
  }

  // Draw enhanced table rows with dynamic height and proper alignment
  drawEnhancedTableRows(doc, data, columnWidths, startX, startY, fontSize, cellPadding, columnTypes = [], columnAlignments = []) {
    let currentY = startY;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');

    data.forEach((row, rowIndex) => {
      // Calculate dynamic row height based on content
      let maxRowHeight = fontSize * 1.2;
      const processedCells = row.map((cell, colIndex) => {
        const cellWidth = columnWidths[colIndex];
        const columnType = columnTypes[colIndex] || 'text';
        const maxWidth = cellWidth - (cellPadding * 2);
        
        // Format cell content based on type
        let cellText = '';
        if (cell !== null && cell !== undefined && cell !== '') {
          if (columnType === 'currency') {
            cellText = this.formatCurrency(cell);
          } else if (columnType === 'number') {
            cellText = this.formatNumber(cell);
          } else {
            cellText = String(cell);
          }
        }

        // Wrap text and calculate height
        const wrappedLines = this.wrapTextToWidth(doc, cellText, maxWidth, fontSize);
        const cellHeight = wrappedLines.length * fontSize * 1.2;
        maxRowHeight = Math.max(maxRowHeight, cellHeight);
        
        return { cellText, wrappedLines, cellWidth };
      });

      const rowHeight = cellPadding * 2 + maxRowHeight;

      // Draw alternate row background
      if (rowIndex % 2 === 1) {
        doc.setFillColor(...this.theme.colors.gray[50]);
        doc.rect(startX, currentY, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');
      }

      // Draw row borders and cell separators
      doc.setDrawColor(...this.theme.colors.gray[200]);
      doc.setLineWidth(0.5);
      
      // Horizontal borders
      doc.line(startX, currentY, startX + columnWidths.reduce((sum, width) => sum + width, 0), currentY);
      doc.line(startX, currentY + rowHeight, startX + columnWidths.reduce((sum, width) => sum + width, 0), currentY + rowHeight);
      
      // Vertical borders
      let borderX = startX;
      columnWidths.forEach((width, index) => {
        doc.line(borderX, currentY, borderX, currentY + rowHeight);
        borderX += width;
      });
      // Right border
      doc.line(borderX, currentY, borderX, currentY + rowHeight);

      // Draw cell content with proper alignment
      let currentX = startX;
      processedCells.forEach((cellInfo, colIndex) => {
        const { wrappedLines, cellWidth } = cellInfo;
        const columnType = columnTypes[colIndex] || 'text';
        const alignment = columnAlignments[colIndex] || (columnType === 'currency' || columnType === 'number' ? 'right' : 'left');
        
        // Calculate vertical centering
        const totalTextHeight = wrappedLines.length * fontSize * 1.2;
        const startTextY = currentY + cellPadding + (rowHeight - cellPadding * 2 - totalTextHeight) / 2 + fontSize * 0.7;
        
        // Draw each line of text
        wrappedLines.forEach((line, lineIndex) => {
          let textX = currentX + cellPadding;
          
          // Calculate horizontal alignment
          if (alignment === 'center') {
            const textWidth = this.getTextWidth(doc, line, fontSize);
            textX = currentX + (cellWidth - textWidth) / 2;
          } else if (alignment === 'right') {
            const textWidth = this.getTextWidth(doc, line, fontSize);
            textX = currentX + cellWidth - textWidth - cellPadding;
          }
          
          const textY = startTextY + (lineIndex * fontSize * 1.2);
          doc.text(line, textX, textY);
        });

        currentX += cellWidth;
      });

      currentY += rowHeight;
    });

    return currentY;
  }

  // Enhanced data validation and extraction
  validateAndFormatTableData(rawData, columnTypes = []) {
    if (!rawData || !Array.isArray(rawData)) {
      console.warn('⚠️ [PDF Generator] Invalid table data provided');
      return [];
    }

    return rawData.map(row => {
      if (!Array.isArray(row)) return [];
      
      return row.map((cell, index) => {
        const columnType = columnTypes[index] || 'text';
        
        // Handle null/undefined values
        if (cell === null || cell === undefined) {
          return columnType === 'currency' ? '₹0' : '';
        }
        
        // Handle empty strings
        if (cell === '') {
          return columnType === 'currency' ? '₹0' : '';
        }
        
        return cell;
      });
    });
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

  /**
   * Enhanced text wrapping with error handling
   */
  wrapText(doc, text, maxWidth) {
    return this.wrapTextToWidth(doc, text, maxWidth, this.theme.fonts.sizes.body);
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