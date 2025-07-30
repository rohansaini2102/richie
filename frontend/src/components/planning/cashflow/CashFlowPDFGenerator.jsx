import React from 'react';
import { 
  Button, 
  Paper, 
  Typography, 
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  PictureAsPdf, 
  Download, 
  CloudUpload, 
  Preview,
  Visibility,
  GetApp,
  Delete,
  Storage,
  CheckCircle,
  Error as ErrorIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { generateCashFlowPDF } from './CashFlowPDFDocument';

/**
 * CashFlowPDFGenerator - Generates professional cash flow analysis PDFs
 * Similar to GoalPlanPDFGenerator but focused on cash flow planning
 */
class CashFlowPDFGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.contentWidth = this.pageWidth - (2 * this.margin);
    
    // Initialize and verify autoTable plugin
    this.initializeAutoTable();
  }

  initializeAutoTable() {
    console.log('🔍 [Cash Flow PDF] Checking autoTable availability...');
    console.log('autoTable import type:', typeof autoTable);
    
    // Create a test jsPDF instance to check plugin availability
    const testDoc = new jsPDF();
    console.log('autoTable method on instance:', typeof testDoc.autoTable);
    
    if (typeof testDoc.autoTable !== 'function') {
      console.warn('⚠️ [Cash Flow PDF] autoTable not automatically attached, attempting manual attachment...');
      
      if (typeof autoTable === 'function') {
        try {
          autoTable(testDoc, { head: [], body: [] }); // Dummy call to initialize
          console.log('✅ [Cash Flow PDF] autoTable manually initialized');
        } catch (error) {
          console.error('❌ [Cash Flow PDF] Failed to manually initialize autoTable:', error);
        }
      }
    } else {
      console.log('✅ [Cash Flow PDF] autoTable plugin properly loaded');
    }
  }

  /**
   * Generate comprehensive cash flow analysis PDF
   */
  generatePDF(data) {
    const { clientData, planData, metrics, aiRecommendations, cacheInfo, advisorData } = data;
    
    console.log('💰 [Cash Flow PDF] Starting PDF generation:', {
      clientName: `${clientData?.firstName} ${clientData?.lastName}`,
      hasMetrics: !!metrics,
      hasRecommendations: !!aiRecommendations,
      planType: cacheInfo?.planType || 'cash_flow'
    });

    const doc = new jsPDF();
    
    // Ensure autoTable is available on this document instance
    this.ensureAutoTable(doc);
    
    let currentY = this.margin;

    // 1. Cover Page with Advisor Branding
    currentY = this.addCoverPage(doc, clientData, advisorData, currentY, cacheInfo);
    
    // 2. Executive Summary
    doc.addPage();
    currentY = this.margin;
    currentY = this.addExecutiveSummary(doc, clientData, metrics, currentY);
    
    // 3. Income Analysis
    doc.addPage();
    currentY = this.margin;
    currentY = this.addIncomeAnalysis(doc, clientData, currentY);
    
    // 4. Expense Analysis
    doc.addPage();
    currentY = this.margin;
    currentY = this.addExpenseAnalysis(doc, clientData, currentY);
    
    // 5. Cash Flow Statement
    doc.addPage();
    currentY = this.margin;
    currentY = this.addCashFlowStatement(doc, clientData, metrics, currentY);
    
    // 6. Debt Management Plan (if applicable)
    if (planData?.debtManagement?.prioritizedDebts?.length > 0) {
      doc.addPage();
      currentY = this.margin;
      currentY = this.addDebtManagementPlan(doc, planData, currentY);
    }
    
    // 7. Emergency Fund Strategy
    if (planData?.emergencyFundStrategy) {
      doc.addPage();
      currentY = this.margin;
      currentY = this.addEmergencyFundStrategy(doc, planData, currentY);
    }
    
    // 8. Investment Recommendations
    if (planData?.investmentRecommendations) {
      doc.addPage();
      currentY = this.margin;
      currentY = this.addInvestmentRecommendations(doc, planData, metrics, currentY);
    }
    
    // 9. AI Recommendations (if available)
    if (aiRecommendations) {
      doc.addPage();
      currentY = this.margin;
      currentY = this.addAIRecommendations(doc, aiRecommendations, currentY);
    }
    
    // 10. Implementation Timeline
    doc.addPage();
    currentY = this.margin;
    currentY = this.addImplementationTimeline(doc, planData, currentY);
    
    // 11. Disclaimers
    currentY = this.addDisclaimers(doc, currentY);

    // Add advisor signature section on last page
    currentY = this.addAdvisorSignature(doc, advisorData, clientData, currentY);

    console.log('✅ [Cash Flow PDF] PDF generated successfully');
    return doc;
  }

  /**
   * Ensure autoTable is available on document instance
   */
  ensureAutoTable(doc) {
    if (typeof doc.autoTable !== 'function') {
      console.warn('⚠️ [Cash Flow PDF] autoTable not available on doc instance, attempting fix...');
      
      if (typeof autoTable === 'function') {
        try {
          // Method 1: Direct attachment
          doc.autoTable = autoTable.bind(null, doc);
          
          // Method 2: Call the function to initialize plugin
          autoTable(doc, { head: [], body: [], startY: -1000 }); // Off-screen dummy table
          
          if (typeof doc.autoTable === 'function') {
            console.log('✅ [Cash Flow PDF] autoTable successfully attached to document instance');
            return true;
          } else {
            console.error('❌ [Cash Flow PDF] autoTable still not available after attachment attempt');
            return false;
          }
        } catch (error) {
          console.error('❌ [Cash Flow PDF] Failed to attach autoTable to instance:', error);
          return false;
        }
      } else {
        console.error('❌ [Cash Flow PDF] autoTable function not imported');
        return false;
      }
    }
    return true;
  }

  /**
   * Add professional header with firm branding to each page
   */
  addProfessionalHeader(doc, advisorData, pageNumber = 1) {
    if (!advisorData) return;

    const headerHeight = 25;
    
    // Header background
    doc.setFillColor(240, 248, 255); // Light blue background
    doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Firm name - prominent
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text(advisorData.firmName || 'Financial Advisory Services', this.margin, 12);
    
    // Advisor name and credentials
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100); // Gray
    const advisorInfo = `${advisorData.firstName} ${advisorData.lastName}`;
    const sebiInfo = advisorData.sebiRegNumber ? ` | SEBI Reg: ${advisorData.sebiRegNumber}` : '';
    doc.text(`${advisorInfo}${sebiInfo}`, this.margin, 18);
    
    // Page number and date (right aligned)
    const rightX = this.pageWidth - this.margin;
    doc.text(`Page ${pageNumber}`, rightX, 12, { align: 'right' });
    doc.text(new Date().toLocaleDateString('en-IN'), rightX, 18, { align: 'right' });
    
    // Header line
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(this.margin, headerHeight - 2, this.pageWidth - this.margin, headerHeight - 2);
    
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
    doc.text('CASH FLOW ANALYSIS REPORT', this.pageWidth / 2, y, { align: 'center' });
    
    y += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Financial Cash Flow Planning', this.pageWidth / 2, y, { align: 'center' });
    
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
    doc.text(`Risk Profile: ${clientData.riskTolerance || 'Moderate'}`, this.margin + 10, y);
    
    y += 10;
    doc.text(`Monthly Income: ₹${this.formatCurrency(clientData.totalMonthlyIncome || 0)}`, this.margin + 10, y);
    
    y += 30;
    
    // Report Details
    doc.setFontSize(12);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, this.margin, y);
    y += 10;
    doc.text(`Plan Type: Cash Flow Analysis`, this.margin, y);
    
    return y;
  }

  /**
   * Add executive summary with key cash flow metrics
   */
  addExecutiveSummary(doc, clientData, metrics, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', this.margin, y);
    y += 15;
    
    // Calculate key metrics
    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((monthlySurplus / monthlyIncome) * 100).toFixed(1) : 0;
    
    // Key Metrics Table
    const summaryData = [
      ['Monthly Income', `₹${this.formatCurrency(monthlyIncome)}`],
      ['Monthly Expenses', `₹${this.formatCurrency(monthlyExpenses)}`],
      ['Monthly Surplus/Deficit', `₹${this.formatCurrency(monthlySurplus)}`],
      ['Savings Rate', `${savingsRate}%`],
      ['Financial Health', monthlySurplus > 0 ? '✓ Positive Cash Flow' : '⚠ Negative Cash Flow']
    ];

    // Use autoTable plugin
    if (this.ensureAutoTable(doc)) {
      try {
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
      } catch (error) {
        console.warn('❌ [Cash Flow PDF] autoTable failed, using fallback');
        y = this.createFallbackTable(doc, summaryData, ['Metric', 'Value'], y);
      }
    }

    // Financial Health Overview
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CASH FLOW ANALYSIS', this.margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    let analysisText = '';
    if (monthlySurplus > 0) {
      analysisText = `Your current cash flow shows a positive surplus of ₹${this.formatCurrency(monthlySurplus)} per month, `;
      analysisText += `representing a ${savingsRate}% savings rate. `;
      
      if (savingsRate >= 20) {
        analysisText += 'This is an excellent savings rate that positions you well for achieving your financial goals.';
      } else if (savingsRate >= 10) {
        analysisText += 'This is a good savings rate, though increasing it to 20% or more would accelerate your financial progress.';
      } else {
        analysisText += 'While positive, there is room to improve your savings rate to build wealth more effectively.';
      }
    } else {
      analysisText = `Your current expenses exceed your income by ₹${this.formatCurrency(Math.abs(monthlySurplus))} per month. `;
      analysisText += 'This negative cash flow requires immediate attention through expense reduction or income enhancement strategies.';
    }
    
    const wrappedText = this.wrapText(doc, analysisText, this.contentWidth);
    wrappedText.forEach(line => {
      doc.text(line, this.margin, y);
      y += 7;
    });

    return y + 10;
  }

  /**
   * Add detailed income analysis
   */
  addIncomeAnalysis(doc, clientData, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INCOME ANALYSIS', this.margin, y);
    y += 15;

    // Income Sources Table
    const incomeData = [];
    
    if (clientData.primaryEmploymentIncome) {
      incomeData.push(['Primary Employment', `₹${this.formatCurrency(clientData.primaryEmploymentIncome)}`]);
    }
    if (clientData.secondaryEmploymentIncome) {
      incomeData.push(['Secondary Employment', `₹${this.formatCurrency(clientData.secondaryEmploymentIncome)}`]);
    }
    if (clientData.rentalIncome) {
      incomeData.push(['Rental Income', `₹${this.formatCurrency(clientData.rentalIncome)}`]);
    }
    if (clientData.otherIncome) {
      incomeData.push(['Other Income', `₹${this.formatCurrency(clientData.otherIncome)}`]);
    }
    
    incomeData.push(['Total Monthly Income', `₹${this.formatCurrency(clientData.totalMonthlyIncome || 0)}`]);
    
    if (incomeData.length > 1) {
      if (this.ensureAutoTable(doc)) {
        try {
          doc.autoTable({
            startY: y,
            head: [['Income Source', 'Monthly Amount']],
            body: incomeData,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            margin: { left: this.margin, right: this.margin },
            styles: { fontSize: 10 },
            footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
          });
          y = doc.lastAutoTable.finalY + 15;
        } catch (error) {
          console.warn('❌ [Cash Flow PDF] Income table failed, using fallback');
          y = this.createFallbackTable(doc, incomeData, ['Income Source', 'Monthly Amount'], y);
        }
      }
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No income information available.', this.margin, y);
      y += 10;
    }

    // Annual Projection
    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ANNUAL INCOME PROJECTION', this.margin, y);
    y += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const annualIncome = (clientData.totalMonthlyIncome || 0) * 12;
    doc.text(`Based on current monthly income, your projected annual income is ₹${this.formatCurrency(annualIncome)}.`, this.margin, y);
    
    return y + 20;
  }

  /**
   * Add detailed expense analysis
   */
  addExpenseAnalysis(doc, clientData, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPENSE ANALYSIS', this.margin, y);
    y += 15;

    // Expense Categories Table
    const expenseData = [];
    let totalExpenses = 0;
    
    // Add individual expense categories
    const expenseCategories = [
      { key: 'housing', label: 'Housing (Rent/EMI)', value: clientData.housing },
      { key: 'utilities', label: 'Utilities', value: clientData.utilities },
      { key: 'transportation', label: 'Transportation', value: clientData.transportation },
      { key: 'groceries', label: 'Groceries', value: clientData.groceries },
      { key: 'healthcare', label: 'Healthcare', value: clientData.healthcare },
      { key: 'insurance', label: 'Insurance', value: clientData.insurance },
      { key: 'education', label: 'Education', value: clientData.education },
      { key: 'entertainment', label: 'Entertainment', value: clientData.entertainment },
      { key: 'personalCare', label: 'Personal Care', value: clientData.personalCare },
      { key: 'otherExpenses', label: 'Other Expenses', value: clientData.otherExpenses }
    ];
    
    expenseCategories.forEach(category => {
      if (category.value && category.value > 0) {
        expenseData.push([category.label, `₹${this.formatCurrency(category.value)}`]);
        totalExpenses += category.value;
      }
    });
    
    if (expenseData.length > 0) {
      expenseData.push(['Total Monthly Expenses', `₹${this.formatCurrency(totalExpenses)}`]);
      
      if (this.ensureAutoTable(doc)) {
        try {
          doc.autoTable({
            startY: y,
            head: [['Expense Category', 'Monthly Amount']],
            body: expenseData,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            margin: { left: this.margin, right: this.margin },
            styles: { fontSize: 10 },
            footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
          });
          y = doc.lastAutoTable.finalY + 15;
        } catch (error) {
          console.warn('❌ [Cash Flow PDF] Expense table failed, using fallback');
          y = this.createFallbackTable(doc, expenseData, ['Expense Category', 'Monthly Amount'], y);
        }
      }
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No expense information available.', this.margin, y);
      y += 10;
    }

    // Expense Breakdown Analysis
    if (totalExpenses > 0 && clientData.totalMonthlyIncome > 0) {
      y += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPENSE RATIO ANALYSIS', this.margin, y);
      y += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const expenseRatio = ((totalExpenses / clientData.totalMonthlyIncome) * 100).toFixed(1);
      doc.text(`Your expenses represent ${expenseRatio}% of your monthly income.`, this.margin, y);
      y += 7;
      
      if (expenseRatio > 90) {
        doc.text('⚠ This high expense ratio leaves little room for savings and emergencies.', this.margin, y);
      } else if (expenseRatio > 80) {
        doc.text('Your expense ratio is moderate but could be optimized for better savings.', this.margin, y);
      } else {
        doc.text('✓ Your expense ratio allows for healthy savings and financial flexibility.', this.margin, y);
      }
    }
    
    return y + 20;
  }

  /**
   * Add cash flow statement
   */
  addCashFlowStatement(doc, clientData, metrics, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CASH FLOW STATEMENT', this.margin, y);
    y += 15;

    const monthlyIncome = clientData.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    
    // Monthly Cash Flow Summary
    const cashFlowData = [
      ['Total Monthly Income', `₹${this.formatCurrency(monthlyIncome)}`],
      ['Total Monthly Expenses', `₹${this.formatCurrency(monthlyExpenses)}`],
      ['', ''],
      ['Net Cash Flow (Surplus/Deficit)', `₹${this.formatCurrency(monthlySurplus)}`]
    ];

    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [['Description', 'Amount']],
          body: cashFlowData,
          theme: 'grid',
          headStyles: { fillColor: [0, 102, 204] },
          margin: { left: this.margin, right: this.margin },
          styles: { fontSize: 11 },
          didParseCell: (data) => {
            // Style the net cash flow row
            if (data.row.index === 3) {
              data.cell.styles.fontStyle = 'bold';
              if (monthlySurplus >= 0) {
                data.cell.styles.textColor = [0, 128, 0]; // Green
              } else {
                data.cell.styles.textColor = [255, 0, 0]; // Red
              }
            }
          }
        });
        y = doc.lastAutoTable.finalY + 20;
      } catch (error) {
        console.warn('❌ [Cash Flow PDF] Cash flow table failed, using fallback');
        y = this.createFallbackTable(doc, cashFlowData, ['Description', 'Amount'], y);
      }
    }

    // Annual Projection
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ANNUAL CASH FLOW PROJECTION', this.margin, y);
    y += 10;

    const annualProjection = [
      ['Annual Income', `₹${this.formatCurrency(monthlyIncome * 12)}`],
      ['Annual Expenses', `₹${this.formatCurrency(monthlyExpenses * 12)}`],
      ['Annual Surplus/Deficit', `₹${this.formatCurrency(monthlySurplus * 12)}`]
    ];

    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [['Description', 'Annual Amount']],
          body: annualProjection,
          theme: 'grid',
          headStyles: { fillColor: [0, 102, 204] },
          margin: { left: this.margin, right: this.margin },
          styles: { fontSize: 10 }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [Cash Flow PDF] Annual projection table failed, using fallback');
        y = this.createFallbackTable(doc, annualProjection, ['Description', 'Annual Amount'], y);
      }
    }

    return y;
  }

  /**
   * Add debt management plan section
   */
  addDebtManagementPlan(doc, planData, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DEBT MANAGEMENT PLAN', this.margin, y);
    y += 15;

    const debtManagement = planData.debtManagement;
    const prioritizedDebts = debtManagement.prioritizedDebts || [];

    if (prioritizedDebts.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No debts recorded. Congratulations on being debt-free!', this.margin, y);
      return y + 20;
    }

    // Debt Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DEBT PRIORITIZATION', this.margin, y);
    y += 10;

    const debtTableData = prioritizedDebts.map((debt, index) => [
      `${index + 1}`,
      debt.name || 'Unnamed Debt',
      `₹${this.formatCurrency(debt.outstandingAmount || 0)}`,
      `${debt.interestRate || 0}%`,
      `₹${this.formatCurrency(debt.emi || 0)}`,
      debt.priority || 'Medium'
    ]);

    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [['#', 'Debt Name', 'Outstanding', 'Interest', 'EMI', 'Priority']],
          body: debtTableData,
          theme: 'grid',
          headStyles: { fillColor: [0, 102, 204], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [Cash Flow PDF] Debt table failed, using fallback');
        y = this.createFallbackTable(doc, debtTableData, 
          ['#', 'Debt Name', 'Outstanding', 'Interest', 'EMI', 'Priority'], y);
      }
    }

    // Debt Strategy
    if (debtManagement.strategy) {
      y += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('REPAYMENT STRATEGY', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const strategyText = this.wrapText(doc, debtManagement.strategy, this.contentWidth);
      strategyText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 7;
      });
    }

    // Total Debt Metrics
    const totalDebt = prioritizedDebts.reduce((sum, debt) => sum + (debt.outstandingAmount || 0), 0);
    const totalEMI = prioritizedDebts.reduce((sum, debt) => sum + (debt.emi || 0), 0);

    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Outstanding Debt: ₹${this.formatCurrency(totalDebt)}`, this.margin, y);
    y += 8;
    doc.text(`Total Monthly EMI: ₹${this.formatCurrency(totalEMI)}`, this.margin, y);

    return y + 15;
  }

  /**
   * Add emergency fund strategy section
   */
  addEmergencyFundStrategy(doc, planData, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EMERGENCY FUND STRATEGY', this.margin, y);
    y += 15;

    const emergencyFund = planData.emergencyFundStrategy || {};

    // Current Status
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CURRENT STATUS', this.margin, y);
    y += 10;

    const fundData = [
      ['Current Emergency Fund', `₹${this.formatCurrency(emergencyFund.currentAmount || 0)}`],
      ['Target Emergency Fund', `₹${this.formatCurrency(emergencyFund.targetAmount || 0)}`],
      ['Coverage (Months)', `${emergencyFund.monthsCovered || 0} months`],
      ['Monthly Contribution', `₹${this.formatCurrency(emergencyFund.monthlyContribution || 0)}`]
    ];

    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          body: fundData,
          theme: 'grid',
          margin: { left: this.margin, right: this.margin },
          styles: { fontSize: 11 },
          columnStyles: {
            0: { fontStyle: 'bold', fillColor: [245, 245, 245] },
            1: { halign: 'right' }
          }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [Cash Flow PDF] Emergency fund table failed, using fallback');
        y = this.createFallbackTable(doc, fundData, null, y);
      }
    }

    // Strategy
    if (emergencyFund.strategy) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('BUILDING STRATEGY', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const strategyText = this.wrapText(doc, emergencyFund.strategy, this.contentWidth);
      strategyText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 7;
      });
    }

    return y + 15;
  }

  /**
   * Add investment recommendations section
   */
  addInvestmentRecommendations(doc, planData, metrics, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVESTMENT RECOMMENDATIONS', this.margin, y);
    y += 15;

    const investments = planData.investmentRecommendations || {};
    const monthlyInvestments = investments.monthlyInvestments || [];

    if (monthlyInvestments.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No specific investment recommendations at this time.', this.margin, y);
      return y + 20;
    }

    // Investment Allocation
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDED MONTHLY INVESTMENTS', this.margin, y);
    y += 10;

    const investmentData = monthlyInvestments.map(inv => [
      inv.fundName || 'Investment Fund',
      inv.category || 'Diversified',
      `₹${this.formatCurrency(inv.amount || 0)}`,
      inv.purpose || 'Wealth Creation'
    ]);

    // Add total row
    const totalInvestment = monthlyInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    investmentData.push(['Total Monthly Investment', '', `₹${this.formatCurrency(totalInvestment)}`, '']);

    if (this.ensureAutoTable(doc)) {
      try {
        doc.autoTable({
          startY: y,
          head: [['Fund Name', 'Category', 'Monthly Amount', 'Purpose']],
          body: investmentData,
          theme: 'grid',
          headStyles: { fillColor: [0, 102, 204] },
          margin: { left: this.margin, right: this.margin },
          styles: { fontSize: 10 },
          footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
        });
        y = doc.lastAutoTable.finalY + 15;
      } catch (error) {
        console.warn('❌ [Cash Flow PDF] Investment table failed, using fallback');
        y = this.createFallbackTable(doc, investmentData, 
          ['Fund Name', 'Category', 'Monthly Amount', 'Purpose'], y);
      }
    }

    // Investment Strategy
    if (investments.strategy) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INVESTMENT STRATEGY', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const strategyText = this.wrapText(doc, investments.strategy, this.contentWidth);
      strategyText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 7;
      });
    }

    return y + 15;
  }

  /**
   * Add AI-generated recommendations section
   */
  addAIRecommendations(doc, aiRecommendations, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-POWERED RECOMMENDATIONS', this.margin, y);
    y += 15;

    if (!aiRecommendations || typeof aiRecommendations !== 'object') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('AI recommendations are being prepared and will be available soon.', this.margin, y);
      return y + 20;
    }

    // Cash Flow Optimization
    if (aiRecommendations.cashFlowOptimization) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CASH FLOW OPTIMIZATION', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const optimizationText = this.wrapText(doc, aiRecommendations.cashFlowOptimization, this.contentWidth);
      optimizationText.forEach(line => {
        doc.text(line, this.margin, y);
        y += 7;
      });
      y += 10;
    }

    // Immediate Actions
    if (aiRecommendations.immediateActions && aiRecommendations.immediateActions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('IMMEDIATE ACTION ITEMS', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      aiRecommendations.immediateActions.forEach(action => {
        const actionText = this.wrapText(doc, `• ${action}`, this.contentWidth);
        actionText.forEach(line => {
          doc.text(line, this.margin, y);
          y += 7;
        });
        y += 3;
      });
      y += 10;
    }

    // Long-term Recommendations
    if (aiRecommendations.longTermRecommendations && aiRecommendations.longTermRecommendations.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LONG-TERM RECOMMENDATIONS', this.margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      aiRecommendations.longTermRecommendations.forEach(recommendation => {
        const recText = this.wrapText(doc, `• ${recommendation}`, this.contentWidth);
        recText.forEach(line => {
          doc.text(line, this.margin, y);
          y += 7;
        });
        y += 3;
      });
    }

    return y + 15;
  }

  /**
   * Add implementation timeline
   */
  addImplementationTimeline(doc, planData, startY) {
    let y = startY;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPLEMENTATION TIMELINE', this.margin, y);
    y += 15;

    // Implementation steps
    const timelineSteps = [
      { phase: 'Immediate (0-1 month)', actions: [
        'Review and optimize monthly expenses',
        'Set up automated savings transfers',
        'Open dedicated emergency fund account'
      ]},
      { phase: 'Short-term (1-3 months)', actions: [
        'Build emergency fund to 1 month of expenses',
        'Start systematic debt repayment plan',
        'Begin monthly investment contributions'
      ]},
      { phase: 'Medium-term (3-12 months)', actions: [
        'Achieve 3-6 months emergency fund',
        'Increase investment contributions',
        'Review and rebalance portfolio quarterly'
      ]},
      { phase: 'Long-term (1+ years)', actions: [
        'Maintain and grow emergency fund',
        'Accelerate debt repayment',
        'Annual financial plan review and adjustment'
      ]}
    ];

    timelineSteps.forEach(step => {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(step.phase, this.margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      step.actions.forEach(action => {
        doc.text(`• ${action}`, this.margin + 5, y);
        y += 7;
      });
      y += 8;
    });

    return y;
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
      '• This cash flow analysis is based on information provided and current financial conditions.',
      '• Actual results may vary based on changes in income, expenses, and market conditions.',
      '• Regular review and updates are recommended to maintain plan effectiveness.',
      '• Please consult with a qualified financial advisor before making major financial decisions.',
      '• This report is generated using AI-assisted analysis and should be used for guidance only.',
      '• Tax implications should be reviewed with a qualified tax professional.'
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

    // Advisor details box
    doc.setDrawColor(0, 102, 204);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(this.margin, y, this.contentWidth, 50, 3, 3, 'FD');
    
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
    doc.text(`This cash flow analysis has been specifically prepared for ${clientData.firstName} ${clientData.lastName}`, this.margin, y);
    y += 8;
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, this.margin, y);

    return y + 10;
  }

  /**
   * Create fallback table when autoTable is not available
   */
  createFallbackTable(doc, data, headers, startY, options = {}) {
    let y = startY;
    const { 
      headerBg = [240, 248, 255], 
      headerText = [0, 51, 102],
      borderColor = [200, 200, 200],
      fontSize = 10,
      rowHeight = 8,
      columnWidths = []
    } = options;

    // Calculate column widths if not provided
    const numColumns = headers ? headers.length : (data[0] ? data[0].length : 2);
    const availableWidth = this.contentWidth - 20;
    const defaultColumnWidth = columnWidths.length ? null : availableWidth / numColumns;

    // Draw table header if headers provided
    if (headers && headers.length > 0) {
      doc.setFillColor(...headerBg);
      doc.rect(this.margin, y, this.contentWidth, rowHeight + 4, 'F');
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerText);
      
      let currentX = this.margin + 5;
      headers.forEach((header, index) => {
        const colWidth = columnWidths[index] || defaultColumnWidth;
        doc.text(header, currentX, y + 6);
        currentX += colWidth;
      });
      
      y += rowHeight + 4;
    }

    // Draw data rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    data.forEach((row, rowIndex) => {
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.margin, y, this.contentWidth, rowHeight + 2, 'F');
      }
      
      let currentX = this.margin + 5;
      row.forEach((cell, colIndex) => {
        const colWidth = columnWidths[colIndex] || defaultColumnWidth;
        const cellText = String(cell).substring(0, Math.floor(colWidth / 3)); // Prevent overflow
        doc.text(cellText, currentX, y + 5);
        currentX += colWidth;
      });
      
      y += rowHeight + 2;
    });

    // Draw table border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(this.margin, startY, this.contentWidth, y - startY);

    return y + 10;
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

  wrapText(doc, text, maxWidth) {
    return doc.splitTextToSize(text, maxWidth);
  }
}

/**
 * React Component for Cash Flow PDF Generation
 */
const CashFlowPDFGeneratorComponent = ({ 
  clientData, 
  planData,
  metrics,
  aiRecommendations,
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
  const [useReactPDF, setUseReactPDF] = React.useState(true); // Feature flag for new implementation

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
        // Filter for cash flow reports only
        const cashFlowReports = (response.data.reports || []).filter(
          report => report.reportType === 'cash_flow'
        );
        setStoredReports(cashFlowReports);
        console.log('📄 [Cash Flow PDF] Loaded stored reports:', cashFlowReports.length);
      }
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error loading reports:', error);
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
      console.log('📄 [Cash Flow PDF] Starting storage process:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type
      });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          console.log('📄 [Cash Flow PDF] Base64 conversion completed');
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error('❌ [Cash Flow PDF] FileReader error:', error);
          reject(error);
        };
      });
      reader.readAsDataURL(pdfBlob);
      const base64Data = await base64Promise;

      // Validate base64 data
      if (!base64Data || !base64Data.startsWith('data:application/pdf;base64,')) {
        throw new Error('Invalid base64 PDF data generated');
      }

      // Calculate content summary
      const contentSummary = {
        monthlyIncome: clientData?.totalMonthlyIncome || 0,
        monthlyExpenses: clientData?.totalMonthlyExpenses || 0,
        monthlySurplus: (clientData?.totalMonthlyIncome || 0) - (clientData?.totalMonthlyExpenses || 0),
        hasDebtPlan: !!planData?.debtManagement?.prioritizedDebts?.length,
        hasEmergencyFund: !!planData?.emergencyFundStrategy,
        hasInvestments: !!planData?.investmentRecommendations?.monthlyInvestments?.length
      };

      const fileName = `Cash_Flow_Analysis_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;

      const response = await axios.post(
        `http://localhost:5000/api/plans/${planId}/pdf/store`,
        {
          reportType: 'cash_flow',
          pdfData: base64Data,
          fileName: fileName,
          contentSummary: contentSummary
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        console.log('✅ [Cash Flow PDF] PDF stored successfully:', response.data.report);
        await loadStoredReports(); // Refresh the list
        return response.data.report;
      } else {
        throw new Error(response.data.error || 'Failed to store PDF');
      }
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error storing PDF:', error);
      throw error;
    }
  };

  // Generate and save PDF to database
  const generateAndSavePDF = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccessMessage(null);
      console.log('🎯 [Cash Flow PDF] Starting PDF generation and storage...');
      console.log('📊 [Cash Flow PDF] Using:', useReactPDF ? 'React PDF (New)' : 'jsPDF (Legacy)');

      let pdfBlob;
      
      if (useReactPDF) {
        // Use new React PDF implementation
        const data = {
          clientData,
          planData,
          metrics,
          aiRecommendations,
          cacheInfo,
          advisorData: getAdvisorData()
        };
        pdfBlob = await generateCashFlowPDF(data);
        console.log('✅ [Cash Flow PDF] React PDF blob created:', {
          size: pdfBlob.size,
          type: pdfBlob.type
        });
      } else {
        // Use legacy jsPDF implementation
        const generator = new CashFlowPDFGenerator();
        const doc = generator.generatePDF({
          clientData,
          planData,
          metrics,
          aiRecommendations,
          cacheInfo,
          advisorData: getAdvisorData()
        });
        pdfBlob = doc.output('blob');
        console.log('📄 [Cash Flow PDF] jsPDF blob created:', {
          size: pdfBlob.size,
          type: pdfBlob.type
        });
      }
      
      // Store in database
      const savedReport = await storePDFInDatabase(pdfBlob);

      // Open the saved PDF immediately for user to see
      if (savedReport && savedReport.id) {
        console.log('📄 [Cash Flow PDF] Opening saved PDF for viewing...');
        await viewStoredPDF(savedReport.id);
      } else {
        // Fallback: open the original PDF blob if saved report info not available
        console.log('📄 [Cash Flow PDF] Opening original PDF blob as fallback...');
        const pdfURL = URL.createObjectURL(pdfBlob);
        window.open(pdfURL, '_blank');
        setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      }

      console.log('✅ [Cash Flow PDF] PDF generated, stored, and opened successfully');
      setSuccessMessage('PDF report saved to database and opened for viewing!');
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error generating and storing PDF:', error);
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
      
      console.log('✅ [Cash Flow PDF] Stored PDF opened for viewing');
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error viewing stored PDF:', error);
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
      
      console.log('✅ [Cash Flow PDF] Stored PDF downloaded:', fileName);
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error downloading stored PDF:', error);
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
        console.log('✅ [Cash Flow PDF] PDF deleted successfully');
        await loadStoredReports(); // Refresh the list
      } else {
        throw new Error(response.data.error || 'Failed to delete PDF');
      }
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error deleting PDF:', error);
      setError('Failed to delete PDF report');
    }
  };

  const generateAndDownloadPDF = async () => {
    try {
      setGenerating(true);
      setSuccessMessage(null);
      console.log('🎯 [Cash Flow PDF] Starting PDF generation...');
      console.log('📊 [Cash Flow PDF] Using:', useReactPDF ? 'React PDF (New)' : 'jsPDF (Legacy)');

      const fileName = `Cash_Flow_Analysis_${clientData.firstName}_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (useReactPDF) {
        // Use new React PDF implementation
        const data = {
          clientData,
          planData,
          metrics,
          aiRecommendations,
          cacheInfo,
          advisorData: getAdvisorData()
        };
        const pdfBlob = await generateCashFlowPDF(data);
        
        // Create download link
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Use legacy jsPDF implementation
        const generator = new CashFlowPDFGenerator();
        const doc = generator.generatePDF({
          clientData,
          planData,
          metrics,
          aiRecommendations,
          cacheInfo,
          advisorData: getAdvisorData()
        });
        doc.save(fileName);
      }

      console.log('✅ [Cash Flow PDF] PDF downloaded successfully');
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error generating PDF:', error);
      setError('Failed to generate PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateAndPreviewPDF = async () => {
    try {
      setGenerating(true);
      setSuccessMessage(null);
      console.log('🎯 [Cash Flow PDF] Starting PDF preview...');
      console.log('📊 [Cash Flow PDF] Using:', useReactPDF ? 'React PDF (New)' : 'jsPDF (Legacy)');

      let pdfBlob;
      
      if (useReactPDF) {
        // Use new React PDF implementation
        const data = {
          clientData,
          planData,
          metrics,
          aiRecommendations,
          cacheInfo,
          advisorData: getAdvisorData()
        };
        pdfBlob = await generateCashFlowPDF(data);
      } else {
        // Use legacy jsPDF implementation
        const generator = new CashFlowPDFGenerator();
        const doc = generator.generatePDF({
          clientData,
          planData,
          metrics,
          aiRecommendations,
          cacheInfo,
          advisorData: getAdvisorData()
        });
        pdfBlob = doc.output('blob');
      }

      // Open PDF in new tab for preview
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, '_blank');
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(pdfURL), 100);

      console.log('✅ [Cash Flow PDF] PDF preview opened');
    } catch (error) {
      console.error('❌ [Cash Flow PDF] Error generating PDF preview:', error);
      setError('Failed to generate PDF preview: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
            <PictureAsPdf sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cash Flow Analysis PDF Report
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={useReactPDF}
                onChange={(e) => setUseReactPDF(e.target.checked)}
                color="primary"
                disabled={generating}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScienceIcon sx={{ mr: 0.5, fontSize: 20 }} />
                <Typography variant="caption">New PDF Engine</Typography>
              </Box>
            }
            sx={{ ml: 2 }}
          />
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={generateAndSavePDF}
            disabled={disabled || generating || !clientData}
            startIcon={generating ? <CircularProgress size={20} /> : <CloudUpload />}
            sx={{ mr: 1 }}
          >
            {generating ? 'Generating...' : 'Generate & Save PDF'}
          </Button>
          <Tooltip title="Preview PDF">
            <IconButton 
              onClick={generateAndPreviewPDF} 
              disabled={disabled || generating || !clientData}
              color="primary"
            >
              <Preview />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton 
              onClick={generateAndDownloadPDF} 
              disabled={disabled || generating || !clientData}
              color="primary"
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Stored Reports Section */}
      {storedReports.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
            Previously Generated Reports
          </Typography>
          <List>
            {storedReports.map((report) => (
              <ListItem
                key={report.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: '#f5f5f5'
                }}
              >
                <ListItemIcon>
                  <PictureAsPdf color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={report.fileName}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Chip 
                        label={`Version ${report.version}`} 
                        size="small" 
                        color="primary" 
                      />
                      <Typography variant="caption">
                        Generated: {new Date(report.generatedAt).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption">
                        Size: {(report.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View">
                    <IconButton 
                      edge="end" 
                      aria-label="view"
                      onClick={() => viewStoredPDF(report.id)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton 
                      edge="end" 
                      aria-label="download"
                      onClick={() => downloadStoredPDF(report.id, report.fileName)}
                    >
                      <GetApp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => deleteStoredPDF(report.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Paper>
  );
};

export { CashFlowPDFGenerator };
export default CashFlowPDFGeneratorComponent;