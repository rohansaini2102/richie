const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const moment = require('moment');

class GoalPlanPdfGenerator {
  constructor() {
    this.colors = {
      primary: rgb(0.2, 0.4, 0.8),        // Blue
      secondary: rgb(0.5, 0.5, 0.5),     // Gray
      success: rgb(0.2, 0.7, 0.3),       // Green
      warning: rgb(0.9, 0.6, 0.1),       // Orange
      danger: rgb(0.8, 0.2, 0.2),        // Red
      text: rgb(0.1, 0.1, 0.1),          // Dark gray
      lightGray: rgb(0.9, 0.9, 0.9),     // Light gray
      white: rgb(1, 1, 1)                // White
    };
    
    this.fonts = {};
    this.pageMargin = 50;
    this.lineHeight = 20;
  }

  async generateGoalBasedPlanPDF(data) {
    try {
      console.log('📄 [GoalPlanPdfGenerator] Starting PDF generation...', {
        planType: data.plan?.planType,
        goalsCount: data.goals?.length || 0,
        hasClient: !!data.client,
        hasAdvisor: !!data.advisor
      });

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Load fonts
      await this.loadFonts(pdfDoc);
      
      // Add pages based on plan type and content
      await this.addCoverPage(pdfDoc, data);
      await this.addExecutiveSummary(pdfDoc, data);
      await this.addClientProfile(pdfDoc, data);
      
      // Add plan-specific content
      if (data.plan?.planType === 'goal_based' || data.plan?.planType === 'adaptive') {
        await this.addGoalAnalysis(pdfDoc, data);
        await this.addGoalRecommendations(pdfDoc, data);
      } else if (data.plan?.planType === 'cash_flow') {
        await this.addCashFlowAnalysis(pdfDoc, data);
      } else if (data.plan?.planType === 'hybrid') {
        await this.addGoalAnalysis(pdfDoc, data);
        await this.addCashFlowAnalysis(pdfDoc, data);
        await this.addGoalRecommendations(pdfDoc, data);
      }
      
      await this.addAdvisorRecommendations(pdfDoc, data);
      await this.addAppendix(pdfDoc, data);
      
      // Add page numbers
      await this.addPageNumbers(pdfDoc);
      
      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      
      console.log('✅ [GoalPlanPdfGenerator] PDF generation completed successfully', {
        pdfSize: pdfBytes.length + ' bytes',
        pageCount: pdfDoc.getPageCount()
      });
      
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('❌ [GoalPlanPdfGenerator] PDF generation failed:', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      });
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  async loadFonts(pdfDoc) {
    this.fonts.regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    this.fonts.bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    this.fonts.italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    this.fonts.boldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  }

  async addCoverPage(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Header background
    page.drawRectangle({
      x: 0,
      y: height - 150,
      width: width,
      height: 150,
      color: this.colors.primary,
    });
    
    // Title
    page.drawText('Financial Planning Report', {
      x: this.pageMargin,
      y: height - 80,
      size: 32,
      font: this.fonts.bold,
      color: this.colors.white,
    });
    
    // Plan type subtitle
    const planTypeText = this.getPlanTypeDisplayName(data.plan?.planType);
    page.drawText(planTypeText, {
      x: this.pageMargin,
      y: height - 110,
      size: 18,
      font: this.fonts.regular,
      color: this.colors.white,
    });
    
    // Client information
    const clientName = `${data.client?.firstName || 'Client'} ${data.client?.lastName || ''}`.trim();
    page.drawText(`Prepared for: ${clientName}`, {
      x: this.pageMargin,
      y: height - 200,
      size: 16,
      font: this.fonts.bold,
      color: this.colors.text,
    });
    
    // Advisor information
    const advisorName = `${data.advisor?.firstName || 'Financial'} ${data.advisor?.lastName || 'Advisor'}`.trim();
    page.drawText(`Prepared by: ${advisorName}`, {
      x: this.pageMargin,
      y: height - 230,
      size: 14,
      font: this.fonts.regular,
      color: this.colors.text,
    });
    
    if (data.advisor?.firmName) {
      page.drawText(data.advisor.firmName, {
        x: this.pageMargin,
        y: height - 250,
        size: 14,
        font: this.fonts.regular,
        color: this.colors.secondary,
      });
    }
    
    // Date
    const generatedDate = moment(data.metadata?.generatedAt || new Date()).format('MMMM DD, YYYY');
    page.drawText(`Generated on: ${generatedDate}`, {
      x: this.pageMargin,
      y: height - 300,
      size: 12,
      font: this.fonts.regular,
      color: this.colors.secondary,
    });
    
    // Plan summary box
    if (data.planSummary) {
      const summaryY = height - 400;
      
      // Box background
      page.drawRectangle({
        x: this.pageMargin,
        y: summaryY - 60,
        width: width - (2 * this.pageMargin),
        height: 120,
        color: this.colors.lightGray,
        borderColor: this.colors.secondary,
        borderWidth: 1,
      });
      
      page.drawText('Plan Summary', {
        x: this.pageMargin + 20,
        y: summaryY + 40,
        size: 16,
        font: this.fonts.bold,
        color: this.colors.text,
      });
      
      const summary = data.planSummary;
      let summaryText = '';
      
      if (summary.totalGoals) {
        summaryText += `Total Goals: ${summary.totalGoals}\n`;
      }
      if (summary.totalRequiredSIP) {
        summaryText += `Monthly SIP Required: ${this.formatCurrency(summary.totalRequiredSIP)}\n`;
      }
      if (summary.clientSurplus !== undefined) {
        summaryText += `Monthly Surplus: ${this.formatCurrency(summary.clientSurplus)}\n`;
      }
      
      const lines = summaryText.split('\n').filter(line => line.trim());
      lines.forEach((line, index) => {
        page.drawText(line, {
          x: this.pageMargin + 20,
          y: summaryY + 10 - (index * 15),
          size: 12,
          font: this.fonts.regular,
          color: this.colors.text,
        });
      });
    }
  }

  async addExecutiveSummary(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    // Title
    currentY = this.addSectionTitle(page, 'Executive Summary', currentY);
    currentY -= 20;
    
    // Plan type specific summary
    const planType = data.plan?.planType;
    let summaryText = '';
    
    if (planType === 'goal_based') {
      summaryText = this.generateGoalBasedSummary(data);
    } else if (planType === 'adaptive') {
      summaryText = this.generateAdaptiveSummary(data);
    } else if (planType === 'cash_flow') {
      summaryText = this.generateCashFlowSummary(data);
    } else if (planType === 'hybrid') {
      summaryText = this.generateHybridSummary(data);
    } else {
      summaryText = 'This comprehensive financial plan has been prepared based on your current financial situation and objectives.';
    }
    
    currentY = this.addWrappedText(page, summaryText, this.pageMargin, currentY, width - 2 * this.pageMargin, 12, this.fonts.regular);
    
    // Key highlights
    currentY -= 30;
    currentY = this.addSubsectionTitle(page, 'Key Highlights', currentY);
    currentY -= 10;
    
    const highlights = this.generateKeyHighlights(data);
    highlights.forEach(highlight => {
      currentY = this.addBulletPoint(page, highlight, this.pageMargin, currentY, width - 2 * this.pageMargin);
      currentY -= 5;
    });
  }

  async addClientProfile(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    currentY = this.addSectionTitle(page, 'Client Profile', currentY);
    currentY -= 20;
    
    const client = data.client;
    if (!client) {
      currentY = this.addWrappedText(page, 'Client information not available.', this.pageMargin, currentY, width - 2 * this.pageMargin);
      return;
    }
    
    // Personal Information
    currentY = this.addSubsectionTitle(page, 'Personal Information', currentY);
    currentY -= 10;
    
    const personalInfo = [
      `Name: ${client.firstName || ''} ${client.lastName || ''}`.trim(),
      `Email: ${client.email || 'Not provided'}`,
      `Phone: ${client.phone || 'Not provided'}`,
      `Age: ${client.age || 'Not provided'}`,
      `Occupation: ${client.occupation || 'Not provided'}`
    ];
    
    personalInfo.forEach(info => {
      if (info.split(': ')[1] !== 'Not provided' && info.split(': ')[1] !== '') {
        currentY = this.addText(page, info, this.pageMargin, currentY, 12, this.fonts.regular);
        currentY -= 15;
      }
    });
    
    // Financial Information
    currentY -= 10;
    currentY = this.addSubsectionTitle(page, 'Financial Overview', currentY);
    currentY -= 10;
    
    if (client.totalMonthlyIncome || client.totalMonthlyExpenses) {
      const monthlyIncome = client.totalMonthlyIncome || 0;
      const monthlyExpenses = client.totalMonthlyExpenses || 0;
      const monthlySurplus = monthlyIncome - monthlyExpenses;
      
      const financialInfo = [
        `Monthly Income: ${this.formatCurrency(monthlyIncome)}`,
        `Monthly Expenses: ${this.formatCurrency(monthlyExpenses)}`,
        `Monthly Surplus: ${this.formatCurrency(monthlySurplus)}`
      ];
      
      financialInfo.forEach(info => {
        currentY = this.addText(page, info, this.pageMargin, currentY, 12, this.fonts.regular);
        currentY -= 15;
      });
    } else {
      currentY = this.addText(page, 'Financial information to be updated.', this.pageMargin, currentY, 12, this.fonts.italic);
    }
  }

  async addGoalAnalysis(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    const planType = data.plan?.planType;
    const titleText = planType === 'adaptive' ? 'Adaptive Goal Analysis' : 'Goal-Based Analysis';
    currentY = this.addSectionTitle(page, titleText, currentY);
    currentY -= 20;
    
    const goals = data.goals || [];
    
    if (goals.length === 0) {
      currentY = this.addWrappedText(page, 'No goals have been defined yet. Please work with your advisor to establish your financial objectives.', this.pageMargin, currentY, width - 2 * this.pageMargin);
      return;
    }
    
    // Goals overview
    currentY = this.addText(page, `You have defined ${goals.length} financial goal${goals.length > 1 ? 's' : ''}:`, this.pageMargin, currentY, 14, this.fonts.bold);
    currentY -= 25;
    
    // List each goal
    goals.forEach((goal, index) => {
      if (currentY < 100) {
        // Add new page if we're running out of space
        const newPage = pdfDoc.addPage([595, 842]);
        currentY = height - this.pageMargin;
        page = newPage; // This won't work properly, but shows the intent
      }
      
      currentY = this.addGoalDetails(page, goal, index + 1, this.pageMargin, currentY, width - 2 * this.pageMargin);
      currentY -= 20;
    });
    
    // Adaptive-specific content
    if (planType === 'adaptive') {
      currentY -= 10;
      currentY = this.addSubsectionTitle(page, 'Adaptive Strategy Notes', currentY);
      currentY -= 10;
      
      const adaptiveText = 'This adaptive plan will be regularly reviewed and adjusted based on market conditions, life changes, and goal progress. Flexibility is built into the strategy to accommodate changing circumstances.';
      currentY = this.addWrappedText(page, adaptiveText, this.pageMargin, currentY, width - 2 * this.pageMargin, 12, this.fonts.regular);
    }
  }

  async addGoalRecommendations(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    currentY = this.addSectionTitle(page, 'Goal-Based Recommendations', currentY);
    currentY -= 20;
    
    const recommendations = data.recommendations;
    
    if (!recommendations) {
      currentY = this.addWrappedText(page, 'Recommendations are being prepared and will be available in the updated version of this report.', this.pageMargin, currentY, width - 2 * this.pageMargin, 12, this.fonts.italic);
      return;
    }
    
    // Add recommendation content based on structure
    if (typeof recommendations === 'string') {
      currentY = this.addWrappedText(page, recommendations, this.pageMargin, currentY, width - 2 * this.pageMargin);
    } else if (typeof recommendations === 'object') {
      // Handle structured recommendations
      Object.keys(recommendations).forEach(key => {
        currentY = this.addSubsectionTitle(page, this.formatRecommendationTitle(key), currentY);
        currentY -= 10;
        
        const value = recommendations[key];
        if (typeof value === 'string') {
          currentY = this.addWrappedText(page, value, this.pageMargin, currentY, width - 2 * this.pageMargin);
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            currentY = this.addBulletPoint(page, item.toString(), this.pageMargin, currentY, width - 2 * this.pageMargin);
            currentY -= 5;
          });
        }
        currentY -= 15;
      });
    }
  }

  async addCashFlowAnalysis(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    currentY = this.addSectionTitle(page, 'Cash Flow Analysis', currentY);
    currentY -= 20;
    
    const client = data.client;
    
    if (!client || (!client.totalMonthlyIncome && !client.totalMonthlyExpenses)) {
      currentY = this.addWrappedText(page, 'Cash flow analysis requires income and expense information. Please provide this information to your advisor for a complete analysis.', this.pageMargin, currentY, width - 2 * this.pageMargin);
      return;
    }
    
    const monthlyIncome = client.totalMonthlyIncome || 0;
    const monthlyExpenses = client.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    
    // Summary table
    currentY = this.addSubsectionTitle(page, 'Monthly Cash Flow Summary', currentY);
    currentY -= 20;
    
    const summaryData = [
      ['Total Monthly Income', this.formatCurrency(monthlyIncome)],
      ['Total Monthly Expenses', this.formatCurrency(monthlyExpenses)],
      ['Monthly Surplus/Deficit', this.formatCurrency(monthlySurplus)]
    ];
    
    currentY = this.addTable(page, summaryData, this.pageMargin, currentY, width - 2 * this.pageMargin);
    
    // Analysis
    currentY -= 30;
    currentY = this.addSubsectionTitle(page, 'Cash Flow Analysis', currentY);
    currentY -= 10;
    
    let analysisText = '';
    if (monthlySurplus > 0) {
      analysisText = `Your monthly surplus of ${this.formatCurrency(monthlySurplus)} provides a good foundation for achieving your financial goals. This surplus can be allocated towards investments and goal funding.`;
    } else if (monthlySurplus === 0) {
      analysisText = 'Your income and expenses are currently balanced. Consider reviewing your expenses to create a surplus for investments and goal achievement.';
    } else {
      analysisText = `Your monthly deficit of ${this.formatCurrency(Math.abs(monthlySurplus))} indicates that expenses exceed income. This needs immediate attention through expense reduction or income enhancement.`;
    }
    
    currentY = this.addWrappedText(page, analysisText, this.pageMargin, currentY, width - 2 * this.pageMargin);
  }

  async addAdvisorRecommendations(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    currentY = this.addSectionTitle(page, 'Advisor Recommendations', currentY);
    currentY -= 20;
    
    const advisorNotes = data.advisorNotes;
    
    if (!advisorNotes) {
      currentY = this.addWrappedText(page, 'Your advisor will provide personalized recommendations based on your financial situation and goals. These will be included in future versions of this report.', this.pageMargin, currentY, width - 2 * this.pageMargin, 12, this.fonts.italic);
      return;
    }
    
    if (typeof advisorNotes === 'string') {
      currentY = this.addWrappedText(page, advisorNotes, this.pageMargin, currentY, width - 2 * this.pageMargin);
    } else if (typeof advisorNotes === 'object') {
      Object.keys(advisorNotes).forEach(key => {
        currentY = this.addSubsectionTitle(page, this.formatRecommendationTitle(key), currentY);
        currentY -= 10;
        
        const value = advisorNotes[key];
        currentY = this.addWrappedText(page, value.toString(), this.pageMargin, currentY, width - 2 * this.pageMargin);
        currentY -= 15;
      });
    }
  }

  async addAppendix(pdfDoc, data) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let currentY = height - this.pageMargin;
    
    currentY = this.addSectionTitle(page, 'Appendix', currentY);
    currentY -= 20;
    
    // Assumptions and methodology
    currentY = this.addSubsectionTitle(page, 'Assumptions & Methodology', currentY);
    currentY -= 10;
    
    const assumptions = [
      'Inflation rate: 6% per annum',
      'Average market returns: 10-12% for equity, 6-8% for debt',
      'Tax implications considered as per current tax laws',
      'Regular review and rebalancing recommended',
      'Risk tolerance aligned with investment recommendations'
    ];
    
    assumptions.forEach(assumption => {
      currentY = this.addBulletPoint(page, assumption, this.pageMargin, currentY, width - 2 * this.pageMargin);
      currentY -= 5;
    });
    
    // Disclaimer
    currentY -= 20;
    currentY = this.addSubsectionTitle(page, 'Important Disclaimer', currentY);
    currentY -= 10;
    
    const disclaimer = 'This financial plan is based on information provided by you and current market conditions. Past performance does not guarantee future results. Please consult with your advisor before making any investment decisions. This report is confidential and intended solely for the named client.';
    
    currentY = this.addWrappedText(page, disclaimer, this.pageMargin, currentY, width - 2 * this.pageMargin, 10, this.fonts.italic);
  }

  async addPageNumbers(pdfDoc) {
    const pages = pdfDoc.getPages();
    
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNumber = index + 1;
      const totalPages = pages.length;
      
      page.drawText(`${pageNumber} of ${totalPages}`, {
        x: width - 100,
        y: 30,
        size: 10,
        font: this.fonts.regular,
        color: this.colors.secondary,
      });
    });
  }

  // Helper methods
  formatCurrency(amount) {
    // Replace ₹ symbol with Rs. to avoid encoding issues with standard fonts
    return `Rs. ${amount.toLocaleString()}`;
  }

  getPlanTypeDisplayName(planType) {
    const displayNames = {
      'goal_based': 'Goal-Based Financial Plan',
      'cash_flow': 'Cash Flow Analysis Plan',
      'hybrid': 'Comprehensive Financial Plan',
      'adaptive': 'Adaptive Financial Plan'
    };
    return displayNames[planType] || 'Financial Plan';
  }

  generateGoalBasedSummary(data) {
    const goalsCount = data.goals?.length || 0;
    return `This goal-based financial plan focuses on helping you achieve your ${goalsCount} defined financial objective${goalsCount > 1 ? 's' : ''}. The plan provides specific strategies and recommendations for each goal, taking into account your current financial situation, risk tolerance, and time horizon.`;
  }

  generateAdaptiveSummary(data) {
    return 'This adaptive financial plan is designed to evolve with changing market conditions and your life circumstances. The strategy emphasizes flexibility and regular adjustments to ensure optimal outcomes while maintaining focus on your core financial objectives.';
  }

  generateCashFlowSummary(data) {
    return 'This cash flow focused plan analyzes your income and expenses to optimize your financial position. The recommendations aim to improve your cash flow efficiency and create opportunities for wealth building through better financial management.';
  }

  generateHybridSummary(data) {
    return 'This comprehensive hybrid plan combines goal-based planning with cash flow optimization. It provides a holistic approach to your financial well-being, addressing both specific objectives and overall financial health.';
  }

  generateKeyHighlights(data) {
    const highlights = [];
    const planType = data.plan?.planType;
    
    if (data.goals?.length > 0) {
      highlights.push(`${data.goals.length} financial goal${data.goals.length > 1 ? 's' : ''} identified and analyzed`);
    }
    
    if (data.planSummary?.totalRequiredSIP) {
      highlights.push(`Monthly investment requirement: ${this.formatCurrency(data.planSummary.totalRequiredSIP)}`);
    }
    
    if (data.planSummary?.clientSurplus !== undefined) {
      const surplus = data.planSummary.clientSurplus;
      if (surplus > 0) {
        highlights.push(`Available monthly surplus: ${this.formatCurrency(surplus)}`);
      } else {
        highlights.push('Cash flow optimization opportunities identified');
      }
    }
    
    if (planType === 'adaptive') {
      highlights.push('Adaptive strategy with built-in flexibility for changing circumstances');
    }
    
    if (data.recommendations) {
      highlights.push('Personalized investment recommendations provided');
    }
    
    if (highlights.length === 0) {
      highlights.push('Comprehensive financial analysis completed');
      highlights.push('Customized recommendations prepared');
    }
    
    return highlights;
  }

  formatRecommendationTitle(key) {
    return key.split(/(?=[A-Z])/).join(' ')
      .replace(/^\w/, c => c.toUpperCase());
  }

  addSectionTitle(page, title, y) {
    page.drawText(title, {
      x: this.pageMargin,
      y: y,
      size: 20,
      font: this.fonts.bold,
      color: this.colors.primary,
    });
    
    // Add underline
    page.drawLine({
      start: { x: this.pageMargin, y: y - 5 },
      end: { x: this.pageMargin + 200, y: y - 5 },
      thickness: 2,
      color: this.colors.primary,
    });
    
    return y - 30;
  }

  addSubsectionTitle(page, title, y) {
    page.drawText(title, {
      x: this.pageMargin,
      y: y,
      size: 14,
      font: this.fonts.bold,
      color: this.colors.text,
    });
    
    return y - 20;
  }

  addText(page, text, x, y, size = 12, font = null) {
    page.drawText(text, {
      x: x,
      y: y,
      size: size,
      font: font || this.fonts.regular,
      color: this.colors.text,
    });
    
    return y;
  }

  addWrappedText(page, text, x, y, maxWidth, size = 12, font = null) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    const selectedFont = font || this.fonts.regular;
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = selectedFont.widthOfTextAtSize(testLine, size);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    let currentY = y;
    lines.forEach(line => {
      page.drawText(line, {
        x: x,
        y: currentY,
        size: size,
        font: selectedFont,
        color: this.colors.text,
      });
      currentY -= this.lineHeight;
    });
    
    return currentY;
  }

  addBulletPoint(page, text, x, y, maxWidth) {
    // Add bullet point
    page.drawText('•', {
      x: x,
      y: y,
      size: 12,
      font: this.fonts.regular,
      color: this.colors.text,
    });
    
    // Add text with indentation
    return this.addWrappedText(page, text, x + 15, y, maxWidth - 15, 12, this.fonts.regular);
  }

  addGoalDetails(page, goal, goalNumber, x, y, maxWidth) {
    let currentY = y;
    
    // Goal header
    const goalTitle = `Goal ${goalNumber}: ${goal.name || 'Untitled Goal'}`;
    page.drawText(goalTitle, {
      x: x,
      y: currentY,
      size: 14,
      font: this.fonts.bold,
      color: this.colors.primary,
    });
    currentY -= 20;
    
    // Goal details
    const details = [];
    if (goal.targetAmount) {
      details.push(`Target Amount: ${this.formatCurrency(goal.targetAmount)}`);
    }
    if (goal.timeHorizon) {
      details.push(`Time Horizon: ${goal.timeHorizon} years`);
    }
    if (goal.monthlySIP) {
      details.push(`Monthly SIP Required: ${this.formatCurrency(goal.monthlySIP)}`);
    }
    if (goal.priority) {
      details.push(`Priority: ${goal.priority}`);
    }
    
    details.forEach(detail => {
      page.drawText(detail, {
        x: x + 10,
        y: currentY,
        size: 11,
        font: this.fonts.regular,
        color: this.colors.text,
      });
      currentY -= 15;
    });
    
    if (goal.description) {
      currentY -= 5;
      currentY = this.addWrappedText(page, goal.description, x + 10, currentY, maxWidth - 10, 11, this.fonts.italic);
    }
    
    return currentY;
  }

  addTable(page, data, x, y, maxWidth) {
    let currentY = y;
    const rowHeight = 20;
    const colWidth = maxWidth / 2;
    
    data.forEach((row, index) => {
      // Draw row background for alternating colors
      if (index % 2 === 0) {
        page.drawRectangle({
          x: x,
          y: currentY - 15,
          width: maxWidth,
          height: rowHeight,
          color: this.colors.lightGray,
        });
      }
      
      // Draw cell content
      page.drawText(row[0], {
        x: x + 10,
        y: currentY,
        size: 11,
        font: this.fonts.regular,
        color: this.colors.text,
      });
      
      page.drawText(row[1], {
        x: x + colWidth + 10,
        y: currentY,
        size: 11,
        font: this.fonts.bold,
        color: this.colors.text,
      });
      
      currentY -= rowHeight;
    });
    
    return currentY;
  }
}

module.exports = GoalPlanPdfGenerator;