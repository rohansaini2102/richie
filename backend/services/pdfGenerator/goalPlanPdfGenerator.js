const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

class GoalPlanPdfGenerator {
  constructor() {
    // Professional color scheme matching the reference image
    this.colors = {
      primary: rgb(0.192, 0.384, 0.647), // Professional blue #3162a5
      primaryLight: rgb(0.87, 0.918, 0.965), // Light blue background #deeaf6  
      secondary: rgb(0.224, 0.698, 0.725), // Teal accent #39b2b9
      success: rgb(0.133, 0.698, 0.298), // Success green #22b24c
      warning: rgb(0.984, 0.545, 0.086), // Warning orange #fb8b16
      error: rgb(0.863, 0.078, 0.235), // Error red #dc143c
      textPrimary: rgb(0.2, 0.2, 0.2), // Dark gray text #333333
      textSecondary: rgb(0.5, 0.5, 0.5), // Medium gray text #808080
      textLight: rgb(0.7, 0.7, 0.7), // Light gray text #b3b3b3
      background: rgb(0.98, 0.98, 0.98), // Very light gray background #fafafa
      border: rgb(0.9, 0.9, 0.9), // Light border #e6e6e6
      lightGray: rgb(0.95, 0.95, 0.95), // Light gray for backgrounds #f2f2f2
      gray: rgb(0.6, 0.6, 0.6), // Medium gray #999999
      white: rgb(1, 1, 1),
      black: rgb(0, 0, 0)
    };
    
    this.margins = {
      top: 80,
      bottom: 80,
      left: 60,
      right: 60
    };

    // Typography system
    this.fonts = {
      title: 24,
      heading1: 20,
      heading2: 16,
      heading3: 14,
      body: 12,
      small: 10,
      caption: 9
    };

    // Spacing system
    this.spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48
    };
  }

  async generateGoalBasedPlanPDF(planData) {
    try {
      console.log('🎯 [PDF Generator] Starting goal-based plan PDF generation:', {
        hasPlanData: !!planData,
        planDataKeys: planData ? Object.keys(planData) : [],
        clientName: planData?.client ? `${planData.client.firstName || ''} ${planData.client.lastName || ''}`.trim() : 'Unknown',
        goalsCount: planData?.goals?.length || 0,
        hasRecommendations: !!planData?.recommendations,
        hasAdvisorNotes: !!planData?.advisorNotes
      });

      // Validate required data
      if (!planData) {
        throw new Error('No plan data provided for PDF generation');
      }

      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 1. Cover Page
      await this.addCoverPage(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 2. Executive Dashboard
      await this.addExecutiveDashboard(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 3. Client Profile
      await this.addClientProfile(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 4. Financial Analysis Summary
      await this.addFinancialAnalysis(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 5. Goals Details with Feasibility
      await this.addGoalsDetails(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 6. Investment Strategy Matrix
      await this.addInvestmentStrategy(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 7. Cash Flow Projections
      await this.addCashFlowProjections(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 8. AI Analysis
      if (planData.recommendations) {
        await this.addAIAnalysis(pdfDoc, planData, helveticaBoldFont, helveticaFont);
      }

      // 9. Risk Assessment Dashboard
      await this.addRiskAssessment(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 10. Implementation Calendar
      await this.addImplementationCalendar(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 11. Advisor Recommendations
      if (planData.advisorNotes) {
        await this.addAdvisorRecommendations(pdfDoc, planData, helveticaBoldFont, helveticaFont);
      }

      // 12. Performance Tracking & KPIs
      await this.addPerformanceTracking(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 13. Review Schedule
      await this.addReviewSchedule(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 14. Disclaimers
      await this.addDisclaimers(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      const pdfBytes = await pdfDoc.save();
      
      console.log('✅ [PDF Generator] Goal-based plan PDF generated successfully:', {
        pdfSize: pdfBytes.length + ' bytes',
        pageCount: pdfDoc.getPageCount()
      });

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error('❌ [PDF Generator] Error generating goal-based plan PDF:', error);
      throw new Error('Failed to generate PDF report: ' + error.message);
    }
  }

  async addCoverPage(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    // Professional header with clean design
    const headerHeight = 140;
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width: width,
      height: headerHeight,
      color: this.colors.primary
    });

    // Company branding
    page.drawText('RICHEAI', {
      x: this.margins.left,
      y: height - 50,
      size: this.fonts.title + 4,
      font: boldFont,
      color: this.colors.white
    });

    page.drawText('Financial Planning Solutions', {
      x: this.margins.left,
      y: height - 75,
      size: this.fonts.body,
      font: regularFont,
      color: this.colors.white
    });

    // Plan type badge (like "HYBRID" in your image)
    const planType = (planData.plan?.planType || 'goal_based').toUpperCase().replace('_', ' ');
    const badgeWidth = 120;
    const badgeHeight = 30;
    const badgeX = width - this.margins.right - badgeWidth;
    const badgeY = height - 70;

    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeWidth,
      height: badgeHeight,
      color: this.colors.secondary
    });

    page.drawText(planType, {
      x: badgeX + 20,
      y: badgeY + 10,
      size: this.fonts.heading3,
      font: boldFont,
      color: this.colors.white
    });

    // Main title section
    const clientName = planData.client ? `${planData.client.firstName || ''} ${planData.client.lastName || ''}`.trim() : 'Client Name';
    
    page.drawText(`Financial Plan for ${clientName} - Comprehen-`, {
      x: this.margins.left,
      y: height - 190,
      size: this.fonts.title,
      font: boldFont,
      color: this.colors.primary
    });
    
    page.drawText('sive Financial Plan', {
      x: this.margins.left,
      y: height - 220,
      size: this.fonts.title,
      font: boldFont,
      color: this.colors.primary
    });

    page.drawText('Comprehensive Hybrid Financial Planning', {
      x: this.margins.left,
      y: height - 250,
      size: this.fonts.body,
      font: regularFont,
      color: this.colors.textSecondary
    });

    // Divider line
    page.drawRectangle({
      x: this.margins.left,
      y: height - 280,
      width: width - this.margins.left - this.margins.right,
      height: 2,
      color: this.colors.border
    });

    // Planning approach section (matching your image)
    page.drawRectangle({
      x: this.margins.left - 10,
      y: height - 390,
      width: 6,
      height: 80,
      color: this.colors.success
    });

    page.drawText('Planning Approach', {
      x: this.margins.left + 10,
      y: height - 310,
      size: this.fonts.heading2,
      font: boldFont,
      color: this.colors.textPrimary
    });

    const approachText = [
      'This financial plan combines goal-based planning with cash flow optimization, providing a compre-',
      'hensive approach that addresses both immediate financial stability and long-term objectives.'
    ];

    let yPos = height - 340;
    for (const line of approachText) {
      page.drawText(line, {
        x: this.margins.left + 10,
        y: yPos,
        size: this.fonts.body,
        font: regularFont,
        color: this.colors.textPrimary
      });
      yPos -= 18;
    }

    // Comprehensive Overview section (matching your image layout)
    page.drawText('Comprehensive Overview', {
      x: this.margins.left,
      y: height - 420,
      size: this.fonts.heading2,
      font: boldFont,
      color: this.colors.primary
    });

    // Divider line under overview
    page.drawRectangle({
      x: this.margins.left,
      y: height - 440,
      width: width - this.margins.left - this.margins.right,
      height: 1,
      color: this.colors.border
    });

    // Client info table (matching your image format)
    const tableY = height - 480;
    const rowHeight = 25;
    const labelWidth = 120;

    // Calculate some basic metrics
    const netWorth = this.calculateTotalInvestments(planData.client) - this.calculateTotalDebts(planData.client);
    const monthlyIncome = planData.client?.totalMonthlyIncome || 0;
    const monthlyExpenses = planData.client?.totalMonthlyExpenses || 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const advisorName = planData.advisor ? `${planData.advisor.firstName || ''} ${planData.advisor.lastName || ''}`.trim() : 'Financial Advisor';

    const infoItems = [
      { label: 'Client:', value: clientName, align: 'right' },
      { label: 'Net Worth:', value: this.formatCurrency(netWorth), align: 'right' },
      { label: 'Savings Rate:', value: `${savingsRate.toFixed(1)}%`, align: 'right' },
      { label: 'Generated Date:', value: reportDate, align: 'right' },
      { label: 'Advisor:', value: advisorName, align: 'right' }
    ];

    let currentY = tableY;
    for (const item of infoItems) {
      // Label
      page.drawText(item.label, {
        x: this.margins.left,
        y: currentY,
        size: this.fonts.body,
        font: regularFont,
        color: this.colors.textPrimary
      });

      // Value (right-aligned)
      page.drawText(item.value, {
        x: width - this.margins.right - 10,
        y: currentY,
        size: this.fonts.body,
        font: regularFont,
        color: this.colors.textPrimary
      });

      currentY -= rowHeight;
    }

    // Footer
    page.drawText('This report contains confidential financial information', {
      x: this.margins.left,
      y: this.margins.bottom + 20,
      size: this.fonts.caption,
      font: regularFont,
      color: this.colors.textLight
    });
  }

  async addExecutiveDashboard(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    // Professional section header with background
    this.addSectionHeader(page, 'EXECUTIVE DASHBOARD', yPosition, width, boldFont);
    yPosition -= this.spacing.xxl + this.spacing.md;

    const goals = planData.goals || [];
    const planSummary = planData.planSummary || {};
    const totalSIP = planSummary.totalRequiredSIP || goals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
    const clientSurplus = planSummary.clientSurplus || ((planData.client?.totalMonthlyIncome || 0) - (planData.client?.totalMonthlyExpenses || 0));
    const feasible = planSummary.feasible || (totalSIP <= clientSurplus);

    // Key Metrics Cards (2x2 grid)
    const cardWidth = (width - this.margins.left - this.margins.right - 20) / 2;
    const cardHeight = 80;
    const cardSpacing = 10;

    // Card 1: Total Goals
    page.drawRectangle({
      x: this.margins.left,
      y: yPosition - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: this.colors.lightGray
    });
    page.drawText(`${goals.length}`, {
      x: this.margins.left + 15,
      y: yPosition - 30,
      size: 24,
      font: boldFont,
      color: this.colors.primary
    });
    page.drawText('Financial Goals', {
      x: this.margins.left + 15,
      y: yPosition - 55,
      size: 12,
      font: regularFont,
      color: this.colors.gray
    });

    // Card 2: Monthly Investment
    page.drawRectangle({
      x: this.margins.left + cardWidth + cardSpacing,
      y: yPosition - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: this.colors.lightGray
    });
    page.drawText(this.formatCurrency(totalSIP), {
      x: this.margins.left + cardWidth + cardSpacing + 15,
      y: yPosition - 30,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    page.drawText('Monthly Investment', {
      x: this.margins.left + cardWidth + cardSpacing + 15,
      y: yPosition - 55,
      size: 12,
      font: regularFont,
      color: this.colors.gray
    });

    yPosition -= cardHeight + 20;

    // Card 3: Available Surplus
    page.drawRectangle({
      x: this.margins.left,
      y: yPosition - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: this.colors.lightGray
    });
    page.drawText(this.formatCurrency(clientSurplus), {
      x: this.margins.left + 15,
      y: yPosition - 30,
      size: 18,
      font: boldFont,
      color: clientSurplus > 0 ? this.colors.success : this.colors.error
    });
    page.drawText('Available Surplus', {
      x: this.margins.left + 15,
      y: yPosition - 55,
      size: 12,
      font: regularFont,
      color: this.colors.gray
    });

    // Card 4: Plan Status
    const statusColor = feasible ? this.colors.success : this.colors.warning;
    const statusText = feasible ? 'ACHIEVABLE' : 'NEEDS OPTIMIZATION';
    page.drawRectangle({
      x: this.margins.left + cardWidth + cardSpacing,
      y: yPosition - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: this.colors.lightGray
    });
    page.drawText(statusText, {
      x: this.margins.left + cardWidth + cardSpacing + 15,
      y: yPosition - 35,
      size: 14,
      font: boldFont,
      color: statusColor
    });
    page.drawText('Plan Status', {
      x: this.margins.left + cardWidth + cardSpacing + 15,
      y: yPosition - 55,
      size: 12,
      font: regularFont,
      color: this.colors.gray
    });

    yPosition -= cardHeight + 40;

    // Financial Health Indicators
    page.drawText('FINANCIAL HEALTH INDICATORS', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const sipToIncomeRatio = ((planData.client?.totalMonthlyIncome || 1) > 0) ? (totalSIP / (planData.client.totalMonthlyIncome || 1)) * 100 : 0;
    const expenseRatio = ((planData.client?.totalMonthlyIncome || 1) > 0) ? ((planData.client?.totalMonthlyExpenses || 0) / (planData.client.totalMonthlyIncome || 1)) * 100 : 0;
    const savingsRate = 100 - expenseRatio;

    const indicators = [
      { label: 'Investment to Income Ratio', value: this.formatPercentage(sipToIncomeRatio), target: '20-30%', status: sipToIncomeRatio <= 30 ? 'Good' : 'High' },
      { label: 'Savings Rate', value: this.formatPercentage(savingsRate), target: '20%+', status: savingsRate >= 20 ? 'Good' : 'Low' },
      { label: 'Goal Achievability', value: feasible ? 'High' : 'Medium', target: 'High', status: feasible ? 'Good' : 'Requires Review' }
    ];

    for (const indicator of indicators) {
      const statusColor = indicator.status === 'Good' ? this.colors.success : 
                         indicator.status === 'Low' || indicator.status === 'High' ? this.colors.warning : this.colors.primary;
      
      page.drawText(`• ${indicator.label}: ${indicator.value} (Target: ${indicator.target})`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont,
        color: this.colors.black
      });
      
      page.drawText(`[${indicator.status}]`, {
        x: width - this.margins.right - 80,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: statusColor
      });
      
      yPosition -= 20;
    }

    yPosition -= 20;

    // Summary Analysis
    page.drawText('EXECUTIVE SUMMARY', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 25;

    const summaryLines = [
      `This comprehensive goal-based financial plan addresses ${goals.length} selected financial objectives`,
      `with a total investment requirement of ${this.formatCurrency(totalSIP)} per month. Based on the`,
      `current financial profile, this plan is ${feasible ? 'achievable within' : 'challenging but manageable with'}`,
      `${feasible ? 'the available surplus' : 'strategic optimization'} of ${this.formatCurrency(Math.abs(clientSurplus))}.`,
      '',
      'The strategy incorporates AI-powered analysis for optimal asset allocation, risk management,',
      'and timeline optimization to maximize the probability of achieving all financial goals.'
    ];

    for (const line of summaryLines) {
      if (line === '') {
        yPosition -= 10;
        continue;
      }
      page.drawText(line, {
        x: this.margins.left,
        y: yPosition,
        size: 11,
        font: regularFont,
        color: this.colors.black
      });
      yPosition -= 16;
    }
  }

  async addFinancialAnalysis(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    // Professional section header
    this.addSectionHeader(page, 'FINANCIAL ANALYSIS SUMMARY', yPosition, width, boldFont);
    yPosition -= this.spacing.xxl + this.spacing.md;

    const client = planData.client || {};
    const goals = planData.goals || [];
    const totalSIP = goals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
    const monthlyIncome = client.totalMonthlyIncome || 0;
    const monthlyExpenses = client.totalMonthlyExpenses || 0;
    const surplus = monthlyIncome - monthlyExpenses;

    // Current Financial Position with professional styling
    yPosition = this.addSubsectionHeader(page, 'CURRENT FINANCIAL POSITION', yPosition, boldFont);

    // Financial position table
    const tableData = [
      { label: 'Monthly Income', value: this.formatCurrency(monthlyIncome), percentage: '100%' },
      { label: 'Monthly Expenses', value: this.formatCurrency(monthlyExpenses), percentage: this.formatPercentage((monthlyExpenses / Math.max(monthlyIncome, 1)) * 100) },
      { label: 'Current Surplus', value: this.formatCurrency(surplus), percentage: this.formatPercentage((surplus / Math.max(monthlyIncome, 1)) * 100) },
      { label: 'Proposed Investment', value: this.formatCurrency(totalSIP), percentage: this.formatPercentage((totalSIP / Math.max(monthlyIncome, 1)) * 100) },
      { label: 'Remaining Surplus', value: this.formatCurrency(surplus - totalSIP), percentage: this.formatPercentage(((surplus - totalSIP) / Math.max(monthlyIncome, 1)) * 100) }
    ];

    // Draw table header
    page.drawRectangle({
      x: this.margins.left,
      y: yPosition - 25,
      width: width - this.margins.left - this.margins.right,
      height: 25,
      color: this.colors.lightGray
    });
    
    page.drawText('Description', {
      x: this.margins.left + 10,
      y: yPosition - 18,
      size: 12,
      font: boldFont
    });
    page.drawText('Amount', {
      x: this.margins.left + 250,
      y: yPosition - 18,
      size: 12,
      font: boldFont
    });
    page.drawText('% of Income', {
      x: this.margins.left + 380,
      y: yPosition - 18,
      size: 12,
      font: boldFont
    });

    yPosition -= 25;

    // Draw table rows
    for (const row of tableData) {
      const rowColor = row.label === 'Remaining Surplus' && (surplus - totalSIP) < 0 ? this.colors.error : this.colors.black;
      
      page.drawText(row.label, {
        x: this.margins.left + 10,
        y: yPosition - 18,
        size: 11,
        font: regularFont,
        color: rowColor
      });
      page.drawText(row.value, {
        x: this.margins.left + 250,
        y: yPosition - 18,
        size: 11,
        font: regularFont,
        color: rowColor
      });
      page.drawText(row.percentage, {
        x: this.margins.left + 380,
        y: yPosition - 18,
        size: 11,
        font: regularFont,
        color: rowColor
      });
      
      yPosition -= 22;
    }

    yPosition -= 30;

    // Investment Analysis
    page.drawText('INVESTMENT ALLOCATION ANALYSIS', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    // Investment breakdown by goal
    for (let i = 0; i < goals.length && i < 5; i++) { // Limit to 5 goals for space
      const goal = goals[i];
      const allocation = (goal.monthlySIP || 0) / Math.max(totalSIP, 1) * 100;
      const feasibility = this.getGoalFeasibilityStatus(goal, surplus, totalSIP);
      
      page.drawText(`• ${goal.title || 'Goal ' + (i + 1)}: ${this.formatCurrency(goal.monthlySIP || 0)} (${this.formatPercentage(allocation)})`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont
      });
      
      page.drawText(`[${feasibility.status}]`, {
        x: width - this.margins.right - 100,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: feasibility.color
      });
      
      yPosition -= 20;
    }

    if (goals.length > 5) {
      page.drawText(`... and ${goals.length - 5} more goals`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: this.colors.gray
      });
      yPosition -= 20;
    }

    yPosition -= 20;

    // Financial Health Score
    page.drawText('FINANCIAL HEALTH ASSESSMENT', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const healthMetrics = [
      { metric: 'Emergency Fund Adequacy', score: this.calculateTotalInvestments(client) >= (monthlyExpenses * 6) ? 'Good' : 'Needs Improvement' },
      { metric: 'Debt-to-Income Ratio', score: (this.calculateTotalDebts(client) / Math.max(monthlyIncome * 12, 1)) <= 0.36 ? 'Good' : 'High' },
      { metric: 'Investment Diversity', score: goals.length >= 3 ? 'Good' : 'Limited' },
      { metric: 'Goal Timeline Distribution', score: 'Balanced' } // Simplified for now
    ];

    for (const metric of healthMetrics) {
      const scoreColor = metric.score === 'Good' || metric.score === 'Balanced' ? this.colors.success : 
                        metric.score === 'High' ? this.colors.error : this.colors.warning;
      
      page.drawText(`• ${metric.metric}:`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont
      });
      
      page.drawText(metric.score, {
        x: width - this.margins.right - 120,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: scoreColor
      });
      
      yPosition -= 20;
    }
  }

  async addClientProfile(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    const client = planData.client || {};

    page.drawText('CLIENT PROFILE', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    // Personal Information
    page.drawText('Personal Information', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.black
    });
    yPosition -= 25;

    const personalInfo = [
      `Name: ${client.firstName || ''} ${client.lastName || ''}`,
      `Email: ${client.email || 'Not provided'}`,
      `Phone: ${client.phoneNumber || 'Not provided'}`,
      `Age: ${client.age || 'Not provided'}`,
      `Marital Status: ${client.maritalStatus || 'Not provided'}`,
      `Dependents: ${client.numberOfDependents || 0}`,
      `Risk Tolerance: ${client.riskTolerance || 'Moderate'}`
    ];

    for (const info of personalInfo) {
      page.drawText(`• ${info}`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont
      });
      yPosition -= 18;
    }

    yPosition -= 20;

    // Financial Summary
    page.drawText('Financial Summary', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.black
    });
    yPosition -= 25;

    const financialInfo = [
      `Monthly Income: ₹${(client.totalMonthlyIncome || 0).toLocaleString('en-IN')}`,
      `Monthly Expenses: ₹${(client.totalMonthlyExpenses || 0).toLocaleString('en-IN')}`,
      `Monthly Surplus: ₹${((client.totalMonthlyIncome || 0) - (client.totalMonthlyExpenses || 0)).toLocaleString('en-IN')}`,
      `Current Investments: ₹${this.calculateTotalInvestments(client).toLocaleString('en-IN')}`,
      `Outstanding Debts: ₹${this.calculateTotalDebts(client).toLocaleString('en-IN')}`
    ];

    for (const info of financialInfo) {
      page.drawText(`• ${info}`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont
      });
      yPosition -= 18;
    }
  }

  async addGoalsDetails(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('SELECTED FINANCIAL GOALS', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    const goals = planData.goals || [];
    
    if (goals.length === 0) {
      page.drawText('No goals selected for this plan.', {
        x: this.margins.left,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: this.colors.gray
      });
      return;
    }

    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      
      // Check if we need a new page
      if (yPosition < 200) {
        const newPage = pdfDoc.addPage();
        yPosition = newPage.getHeight() - this.margins.top;
      }

      // Goal header
      page.drawText(`Goal ${i + 1}: ${goal.title || 'Untitled Goal'}`, {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: this.colors.black
      });
      yPosition -= 25;

      // Goal details box
      const boxHeight = 140;
      page.drawRectangle({
        x: this.margins.left,
        y: yPosition - boxHeight,
        width: width - this.margins.left - this.margins.right,
        height: boxHeight,
        color: this.colors.lightGray
      });

      // Goal details
      const goalDetails = [
        `Target Amount: ₹${(goal.targetAmount || 0).toLocaleString('en-IN')}`,
        `Target Year: ${goal.targetYear || 'Not specified'}`,
        `Time Horizon: ${goal.timeInYears || 0} years`,
        `Priority: ${goal.priority || 'Medium'}`,
        `Required Monthly SIP: ₹${(goal.monthlySIP || 0).toLocaleString('en-IN')}`,
        `Expected Return: ${goal.assetAllocation?.expectedReturn || 12}% per annum`
      ];

      let detailY = yPosition - 20;
      for (const detail of goalDetails) {
        page.drawText(`• ${detail}`, {
          x: this.margins.left + 15,
          y: detailY,
          size: 11,
          font: regularFont
        });
        detailY -= 18;
      }

      // Asset allocation
      if (goal.assetAllocation) {
        page.drawText(`Asset Allocation: Equity ${goal.assetAllocation.equity || 70}% | Debt ${goal.assetAllocation.debt || 30}%`, {
          x: this.margins.left + 15,
          y: detailY,
          size: 11,
          font: regularFont,
          color: this.colors.primary
        });
      }

      yPosition -= boxHeight + 20;
    }
  }

  async addAIAnalysis(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('AI-POWERED ANALYSIS', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    const recommendations = planData.recommendations;
    
    if (!recommendations) {
      page.drawText('No AI analysis available for this plan.', {
        x: this.margins.left,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: this.colors.gray
      });
      return;
    }

    // Multi-goal optimization
    if (recommendations.multiGoalOptimization) {
      const optimization = recommendations.multiGoalOptimization;
      
      page.drawText('Multi-Goal Strategy Overview', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont
      });
      yPosition -= 25;

      const strategyLines = [
        `Total Required SIP: ₹${(optimization.totalRequiredSIP || 0).toLocaleString('en-IN')}`,
        `Available Surplus: ₹${(optimization.availableSurplus || 0).toLocaleString('en-IN')}`,
        `Feasibility Status: ${optimization.feasibilityStatus || 'Under Review'}`
      ];

      for (const line of strategyLines) {
        page.drawText(`• ${line}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }

      yPosition -= 20;

      // Phase strategy
      if (optimization.phaseStrategy && optimization.phaseStrategy.length > 0) {
        page.drawText('Implementation Phases', {
          x: this.margins.left,
          y: yPosition,
          size: 14,
          font: boldFont
        });
        yPosition -= 25;

        for (const phase of optimization.phaseStrategy) {
          const phaseText = `${phase.phase}: ${phase.strategy} (₹${(phase.monthlyAllocation || 0).toLocaleString('en-IN')}/month)`;
          page.drawText(`• ${phaseText}`, {
            x: this.margins.left + 20,
            y: yPosition,
            size: 11,
            font: regularFont
          });
          yPosition -= 18;
        }
      }
    }

    // Risk assessment
    if (recommendations.riskAssessment) {
      yPosition -= 20;
      const risk = recommendations.riskAssessment;
      
      page.drawText('Risk Assessment', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont
      });
      yPosition -= 25;

      const riskLines = [
        `Overall Risk Level: ${risk.overallRisk || 'Medium'}`,
        `Diversification Score: ${risk.diversificationScore || 7}/10`
      ];

      for (const line of riskLines) {
        page.drawText(`• ${line}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }

      if (risk.warnings && risk.warnings.length > 0) {
        yPosition -= 15;
        page.drawText('Warnings:', {
          x: this.margins.left + 20,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: this.colors.warning
        });
        yPosition -= 20;

        for (const warning of risk.warnings) {
          page.drawText(`• ${warning}`, {
            x: this.margins.left + 40,
            y: yPosition,
            size: 10,
            font: regularFont,
            color: this.colors.warning
          });
          yPosition -= 15;
        }
      }
    }
  }

  async addAdvisorRecommendations(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('ADVISOR RECOMMENDATIONS', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    const advisorNotes = planData.advisorNotes || planData.plan?.advisorRecommendations;
    
    if (!advisorNotes || (!advisorNotes.detailedNotes && (!advisorNotes.keyPoints || advisorNotes.keyPoints.length === 0))) {
      page.drawText('No specific advisor recommendations recorded for this plan.', {
        x: this.margins.left,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: this.colors.gray
      });
      return;
    }

    // Key points
    if (advisorNotes.keyPoints && advisorNotes.keyPoints.length > 0) {
      page.drawText('Key Recommendations:', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont
      });
      yPosition -= 25;

      for (const point of advisorNotes.keyPoints) {
        page.drawText(`• ${point}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }

      yPosition -= 20;
    }

    // Detailed notes
    if (advisorNotes.detailedNotes) {
      page.drawText('Detailed Notes:', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont
      });
      yPosition -= 25;

      // Split long text into lines
      const notes = advisorNotes.detailedNotes;
      const words = notes.split(' ');
      let currentLine = '';
      const maxLineLength = 80;

      for (const word of words) {
        if ((currentLine + word).length > maxLineLength) {
          page.drawText(currentLine, {
            x: this.margins.left + 20,
            y: yPosition,
            size: 11,
            font: regularFont
          });
          yPosition -= 15;
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }

      if (currentLine.trim()) {
        page.drawText(currentLine, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 15;
      }
    }
  }

  async addImplementationRoadmap(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('IMPLEMENTATION ROADMAP', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    const recommendations = planData.recommendations;
    
    // Immediate actions
    if (recommendations?.recommendations?.immediateActions) {
      page.drawText('Immediate Actions (0-3 months):', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: this.colors.success
      });
      yPosition -= 25;

      for (const action of recommendations.recommendations.immediateActions) {
        page.drawText(`• ${action}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }
      yPosition -= 20;
    }

    // Medium-term actions
    if (recommendations?.recommendations?.mediumTermActions) {
      page.drawText('Medium-term Actions (3-12 months):', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: this.colors.warning
      });
      yPosition -= 25;

      for (const action of recommendations.recommendations.mediumTermActions) {
        page.drawText(`• ${action}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }
      yPosition -= 20;
    }

    // Long-term actions
    if (recommendations?.recommendations?.longTermActions) {
      page.drawText('Long-term Strategy (1+ years):', {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: this.colors.primary
      });
      yPosition -= 25;

      for (const action of recommendations.recommendations.longTermActions) {
        page.drawText(`• ${action}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }
    }

    // Default recommendations if none provided
    if (!recommendations?.recommendations?.immediateActions && 
        !recommendations?.recommendations?.mediumTermActions && 
        !recommendations?.recommendations?.longTermActions) {
      
      const defaultActions = [
        'Immediate Actions (0-3 months):',
        '• Start SIP investments for selected goals',
        '• Open necessary investment accounts',
        '• Review and optimize current expenses',
        '',
        'Medium-term Actions (3-12 months):',
        '• Monitor portfolio performance',
        '• Rebalance asset allocation if needed',
        '• Review and adjust SIP amounts based on income changes',
        '',
        'Long-term Strategy (1+ years):',
        '• Annual review of goal progress',
        '• Adjust investment strategy based on market conditions',
        '• Consider tax-saving opportunities'
      ];

      for (const action of defaultActions) {
        if (action === '') {
          yPosition -= 10;
          continue;
        }
        
        const isHeader = action.includes(':');
        page.drawText(action, {
          x: this.margins.left + (isHeader ? 0 : 20),
          y: yPosition,
          size: isHeader ? 14 : 11,
          font: isHeader ? boldFont : regularFont,
          color: isHeader ? this.colors.primary : this.colors.black
        });
        yPosition -= 18;
      }
    }
  }

  async addDisclaimers(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('DISCLAIMERS & IMPORTANT NOTES', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    const disclaimerLines = [
      'This financial planning report is prepared based on the information provided by the',
      'client and current market conditions. The projections and recommendations are',
      'indicative and subject to market risks.',
      '',
      'Key Points:',
      '• Mutual fund investments are subject to market risk. Please read all scheme-related',
      '  documents carefully.',
      '• Past performance is not indicative of future results.',
      '• The return assumptions are based on historical data and may vary in actual',
      '  implementation.',
      '• Regular review and adjustment of the financial plan is recommended.',
      '• This report is confidential and intended solely for the named client.',
      '• Tax implications should be reviewed with a qualified tax advisor.',
      '',
      'The advisor and RicheAI are not liable for any loss arising from the implementation',
      'of this plan. Clients are advised to make informed decisions based on their',
      'individual circumstances.'
    ];

    for (const line of disclaimerLines) {
      if (line === '') {
        yPosition -= 10;
        continue;
      }
      
      page.drawText(line, {
        x: this.margins.left,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: this.colors.gray
      });
      yPosition -= 14;
    }

    // Footer
    yPosition = this.margins.bottom + 30;
    
    page.drawText(`Report generated on ${new Date().toLocaleDateString('en-IN')} by RicheAI Financial Planning Platform`, {
      x: this.margins.left,
      y: yPosition,
      size: 9,
      font: regularFont,
      color: this.colors.gray
    });
  }

  calculateTotalInvestments(client) {
    if (!client || !client.investments) return 0;
    
    let total = 0;
    for (const [key, investment] of Object.entries(client.investments)) {
      if (investment && typeof investment === 'object') {
        total += parseFloat(investment.totalValue || investment.currentBalance || investment.currentValue || 0);
      }
    }
    
    if (client.assets && client.assets.cashBankSavings) {
      total += parseFloat(client.assets.cashBankSavings || 0);
    }
    
    return total;
  }

  calculateTotalDebts(client) {
    if (!client || !client.debtsAndLiabilities) return 0;
    
    let total = 0;
    for (const [key, debt] of Object.entries(client.debtsAndLiabilities)) {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        total += parseFloat(debt.outstandingAmount || debt.totalOutstanding || 0);
      }
    }
    
    return total;
  }

  // Enhanced financial calculation helpers
  calculateFutureValue(presentValue, rate, years) {
    return presentValue * Math.pow(1 + rate / 100, years);
  }

  calculateSIPFutureValue(monthlyAmount, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    if (monthlyRate === 0) return monthlyAmount * months;
    return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  calculateRequiredSIP(targetAmount, years, annualRate) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    if (monthlyRate === 0) return targetAmount / months;
    return targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  }

  calculateInflationAdjustedAmount(amount, inflationRate, years) {
    return amount * Math.pow(1 + inflationRate / 100, years);
  }

  formatCurrency(amount) {
    if (!amount || amount === 0) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  }

  formatPercentage(value) {
    return (value || 0).toFixed(1) + '%';
  }

  calculateGoalPriority(goal, clientSurplus) {
    const urgencyScore = Math.max(1, 11 - (goal.timeInYears || 5));
    const affordabilityScore = Math.min(10, (clientSurplus / (goal.monthlySIP || 1)) * 2);
    const importanceScore = goal.priority === 'High' ? 10 : goal.priority === 'Medium' ? 7 : 4;
    
    return ((urgencyScore + affordabilityScore + importanceScore) / 3).toFixed(1);
  }

  getGoalFeasibilityStatus(goal, clientSurplus, totalSIP) {
    const sipRatio = (goal.monthlySIP || 0) / Math.max(clientSurplus, 1);
    if (sipRatio <= 0.3) return { status: 'Highly Feasible', color: this.colors.success };
    if (sipRatio <= 0.6) return { status: 'Feasible', color: this.colors.primary };
    if (sipRatio <= 0.8) return { status: 'Challenging', color: this.colors.warning };
    return { status: 'Requires Optimization', color: this.colors.error };
  }

  generateYearWiseProjection(goal, years = 10) {
    const projections = [];
    const monthlyAmount = goal.monthlySIP || 0;
    const annualRate = goal.assetAllocation?.expectedReturn || 12;
    
    for (let year = 1; year <= years; year++) {
      const futureValue = this.calculateSIPFutureValue(monthlyAmount, annualRate, year);
      const invested = monthlyAmount * 12 * year;
      const gains = futureValue - invested;
      
      projections.push({
        year,
        invested,
        gains,
        totalValue: futureValue,
        progress: Math.min(100, (futureValue / (goal.targetAmount || 1)) * 100)
      });
    }
    
    return projections;
  }

  // Helper methods for consistent styling
  addSectionHeader(page, title, yPosition, pageWidth, boldFont) {
    const headerHeight = 30;
    
    // Background rectangle
    page.drawRectangle({
      x: this.margins.left - 10,
      y: yPosition - headerHeight + 5,
      width: pageWidth - this.margins.left - this.margins.right + 20,
      height: headerHeight,
      color: this.colors.primaryLight
    });

    // Left border accent
    page.drawRectangle({
      x: this.margins.left - 10,
      y: yPosition - headerHeight + 5,
      width: 4,
      height: headerHeight,
      color: this.colors.primary
    });

    // Title text
    page.drawText(title, {
      x: this.margins.left + 10,
      y: yPosition - 15,
      size: this.fonts.heading1,
      font: boldFont,
      color: this.colors.primary
    });
  }

  addSubsectionHeader(page, title, yPosition, boldFont) {
    // Subsection title with underline
    page.drawText(title, {
      x: this.margins.left,
      y: yPosition,
      size: this.fonts.heading3,
      font: boldFont,
      color: this.colors.textPrimary
    });

    // Underline
    page.drawRectangle({
      x: this.margins.left,
      y: yPosition - 5,
      width: 200,
      height: 1,
      color: this.colors.border
    });

    return yPosition - this.spacing.lg;
  }

  // New comprehensive sections

  async addInvestmentStrategy(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('INVESTMENT STRATEGY MATRIX', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 50;

    const goals = planData.goals || [];
    
    if (goals.length === 0) {
      page.drawText('No investment strategies defined for this plan.', {
        x: this.margins.left,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: this.colors.gray
      });
      return;
    }

    // Strategy summary for each goal
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      
      // Goal header
      page.drawText(`${i + 1}. ${goal.title || 'Goal ' + (i + 1)}`, {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: this.colors.primary
      });
      yPosition -= 25;

      // Strategy details
      const allocation = goal.assetAllocation || { equity: 70, debt: 30, expectedReturn: 12 };
      const strategyDetails = [
        `Target Amount: ${this.formatCurrency(goal.targetAmount || 0)}`,
        `Time Horizon: ${goal.timeInYears || 0} years`,
        `Monthly SIP: ${this.formatCurrency(goal.monthlySIP || 0)}`,
        `Asset Allocation: ${allocation.equity || 70}% Equity, ${allocation.debt || 30}% Debt`,
        `Expected Return: ${this.formatPercentage(allocation.expectedReturn || 12)}`,
        `Risk Level: ${goal.riskLevel || 'Moderate'}`
      ];

      for (const detail of strategyDetails) {
        page.drawText(`  • ${detail}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 18;
      }

      yPosition -= 20;

      // Check if we need a new page
      if (yPosition < 150) {
        const newPage = pdfDoc.addPage();
        yPosition = newPage.getHeight() - this.margins.top;
      }
    }
  }

  async addCashFlowProjections(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('CASH FLOW PROJECTIONS', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 50;

    const goals = planData.goals || [];
    const totalSIP = goals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
    const client = planData.client || {};
    
    // 5-year projection summary
    page.drawText('5-YEAR INVESTMENT GROWTH PROJECTION', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    // Create projection table
    const headers = ['Year', 'Annual Investment', 'Cumulative Investment', 'Expected Value', 'Gains'];
    const colWidth = (width - this.margins.left - this.margins.right) / headers.length;

    // Draw header
    page.drawRectangle({
      x: this.margins.left,
      y: yPosition - 25,
      width: width - this.margins.left - this.margins.right,
      height: 25,
      color: this.colors.lightGray
    });

    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: this.margins.left + i * colWidth + 10,
        y: yPosition - 18,
        size: 10,
        font: boldFont
      });
    }

    yPosition -= 25;

    // Generate 5-year projection
    for (let year = 1; year <= 5; year++) {
      const annualInvestment = totalSIP * 12;
      const futureValue = this.calculateSIPFutureValue(totalSIP, 12, year); // Assuming 12% return
      const totalInvested = annualInvestment * year;
      const gains = futureValue - totalInvested;

      const values = [
        year.toString(),
        this.formatCurrency(annualInvestment),
        this.formatCurrency(totalInvested),
        this.formatCurrency(futureValue),
        this.formatCurrency(gains)
      ];

      for (let i = 0; i < values.length; i++) {
        page.drawText(values[i], {
          x: this.margins.left + i * colWidth + 10,
          y: yPosition - 18,
          size: 10,
          font: regularFont
        });
      }

      yPosition -= 22;
    }

    yPosition -= 30;

    // Monthly cash flow analysis
    page.drawText('MONTHLY CASH FLOW ANALYSIS', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const monthlyIncome = client.totalMonthlyIncome || 0;
    const monthlyExpenses = client.totalMonthlyExpenses || 0;
    const surplus = monthlyIncome - monthlyExpenses;
    const remainingSurplus = surplus - totalSIP;

    const cashFlowItems = [
      { label: 'Monthly Income', amount: monthlyIncome, type: 'income' },
      { label: 'Fixed Expenses', amount: -monthlyExpenses, type: 'expense' },
      { label: 'Available Surplus', amount: surplus, type: 'neutral' },
      { label: 'Proposed Investments', amount: -totalSIP, type: 'investment' },
      { label: 'Remaining Balance', amount: remainingSurplus, type: remainingSurplus >= 0 ? 'positive' : 'negative' }
    ];

    for (const item of cashFlowItems) {
      const color = item.type === 'income' || item.type === 'positive' ? this.colors.success :
                   item.type === 'expense' || item.type === 'negative' ? this.colors.error :
                   item.type === 'investment' ? this.colors.primary : this.colors.black;

      page.drawText(`${item.label}: ${this.formatCurrency(Math.abs(item.amount))}`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont,
        color
      });

      yPosition -= 20;
    }
  }

  async addRiskAssessment(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('RISK ASSESSMENT DASHBOARD', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 50;

    const goals = planData.goals || [];
    const client = planData.client || {};

    // Overall risk profile
    page.drawText('OVERALL RISK PROFILE', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const riskLevel = client.riskTolerance || 'Moderate';
    const riskColor = riskLevel === 'Conservative' ? this.colors.success :
                     riskLevel === 'Moderate' ? this.colors.primary :
                     riskLevel === 'Aggressive' ? this.colors.warning : this.colors.gray;

    page.drawText(`Client Risk Tolerance: ${riskLevel}`, {
      x: this.margins.left + 20,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: riskColor
    });
    yPosition -= 25;

    // Risk factors assessment
    const riskFactors = [
      { factor: 'Market Volatility Risk', level: 'Medium', description: 'Standard market fluctuations expected' },
      { factor: 'Inflation Risk', level: 'Low', description: 'Investments designed to beat inflation' },
      { factor: 'Liquidity Risk', level: 'Low', description: 'Most investments offer reasonable liquidity' },
      { factor: 'Concentration Risk', level: goals.length >= 3 ? 'Low' : 'Medium', description: `${goals.length} goals provide diversification` }
    ];

    page.drawText('RISK FACTORS ANALYSIS', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    for (const risk of riskFactors) {
      const levelColor = risk.level === 'Low' ? this.colors.success :
                        risk.level === 'Medium' ? this.colors.warning :
                        this.colors.error;

      page.drawText(`• ${risk.factor}: ${risk.level}`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: levelColor
      });
      yPosition -= 15;

      page.drawText(`  ${risk.description}`, {
        x: this.margins.left + 30,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: this.colors.gray
      });
      yPosition -= 20;
    }
  }

  async addImplementationCalendar(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('IMPLEMENTATION CALENDAR', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 50;

    // Implementation phases
    const phases = [
      {
        phase: 'Phase 1: Immediate Setup (Month 1)',
        actions: [
          'Complete KYC and open investment accounts',
          'Set up automatic SIP instructions',
          'Transfer initial emergency fund if needed',
          'Review and finalize investment selections'
        ],
        color: this.colors.success
      },
      {
        phase: 'Phase 2: First Quarter Review (Month 3)',
        actions: [
          'Review portfolio performance',
          'Assess any changes in financial situation',
          'Rebalance if necessary',
          'Update goal timelines if needed'
        ],
        color: this.colors.primary
      },
      {
        phase: 'Phase 3: Mid-Year Assessment (Month 6)',
        actions: [
          'Comprehensive portfolio review',
          'Tax planning and optimization',
          'Increase SIPs if surplus allows',
          'Review insurance adequacy'
        ],
        color: this.colors.warning
      },
      {
        phase: 'Phase 4: Annual Review (Month 12)',
        actions: [
          'Complete financial health checkup',
          'Reassess goals and priorities',
          'Optimize tax-saving investments',
          'Plan for next year\'s strategies'
        ],
        color: this.colors.secondary
      }
    ];

    for (const phase of phases) {
      // Phase header
      page.drawText(phase.phase, {
        x: this.margins.left,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: phase.color
      });
      yPosition -= 25;

      // Phase actions
      for (const action of phase.actions) {
        page.drawText(`  • ${action}`, {
          x: this.margins.left + 20,
          y: yPosition,
          size: 11,
          font: regularFont
        });
        yPosition -= 16;
      }

      yPosition -= 15;

      // Check if we need a new page
      if (yPosition < 200) {
        const newPage = pdfDoc.addPage();
        yPosition = newPage.getHeight() - this.margins.top;
      }
    }
  }

  async addPerformanceTracking(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('PERFORMANCE TRACKING & KPIs', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 50;

    // Key Performance Indicators
    page.drawText('KEY PERFORMANCE INDICATORS', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const kpis = [
      { metric: 'Portfolio Returns', target: '12-15% annually', measurement: 'Quarterly XIRR calculation' },
      { metric: 'Goal Progress', target: 'On track to meet target dates', measurement: 'Monthly corpus vs target tracking' },
      { metric: 'Asset Allocation Adherence', target: 'Within ±5% of target allocation', measurement: 'Monthly rebalancing check' },
      { metric: 'Investment Discipline', target: '100% SIP completion rate', measurement: 'Monthly payment tracking' },
      { metric: 'Risk Management', target: 'Volatility within tolerance', measurement: 'Quarterly risk assessment' }
    ];

    for (const kpi of kpis) {
      page.drawText(`• ${kpi.metric}`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: boldFont
      });
      yPosition -= 15;

      page.drawText(`  Target: ${kpi.target}`, {
        x: this.margins.left + 30,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: this.colors.gray
      });
      yPosition -= 12;

      page.drawText(`  Measurement: ${kpi.measurement}`, {
        x: this.margins.left + 30,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: this.colors.gray
      });
      yPosition -= 20;
    }

    yPosition -= 20;

    // Milestone tracking
    page.drawText('MILESTONE TRACKING', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const goals = planData.goals || [];
    for (let i = 0; i < Math.min(goals.length, 3); i++) {
      const goal = goals[i];
      const projections = this.generateYearWiseProjection(goal, 5);
      
      page.drawText(`${goal.title || 'Goal ' + (i + 1)} - Milestones:`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 12,
        font: boldFont
      });
      yPosition -= 20;

      // Show key milestones
      const milestones = [
        { year: 1, target: projections[0]?.totalValue || 0 },
        { year: 3, target: projections[2]?.totalValue || 0 },
        { year: 5, target: projections[4]?.totalValue || 0 }
      ];

      for (const milestone of milestones) {
        page.drawText(`  Year ${milestone.year}: ${this.formatCurrency(milestone.target)}`, {
          x: this.margins.left + 30,
          y: yPosition,
          size: 10,
          font: regularFont
        });
        yPosition -= 15;
      }

      yPosition -= 10;
    }
  }

  async addReviewSchedule(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    page.drawText('REVIEW SCHEDULE & MAINTENANCE', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 50;

    // Review frequency
    page.drawText('SCHEDULED REVIEW CALENDAR', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const reviewSchedule = [
      { frequency: 'Monthly', focus: 'SIP tracking, expense monitoring', responsibility: 'Client self-monitoring' },
      { frequency: 'Quarterly', focus: 'Portfolio performance, goal progress', responsibility: 'Advisor review call' },
      { frequency: 'Semi-Annual', focus: 'Asset allocation, rebalancing', responsibility: 'Detailed advisor meeting' },
      { frequency: 'Annual', focus: 'Complete plan review, goal updates', responsibility: 'Comprehensive planning session' }
    ];

    for (const review of reviewSchedule) {
      page.drawText(`${review.frequency} Review:`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: this.colors.primary
      });
      yPosition -= 18;

      page.drawText(`  Focus: ${review.focus}`, {
        x: this.margins.left + 30,
        y: yPosition,
        size: 10,
        font: regularFont
      });
      yPosition -= 15;

      page.drawText(`  Responsibility: ${review.responsibility}`, {
        x: this.margins.left + 30,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: this.colors.gray
      });
      yPosition -= 25;
    }

    yPosition -= 20;

    // Contact information
    page.drawText('ADVISOR CONTACT INFORMATION', {
      x: this.margins.left,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 30;

    const advisor = planData.advisor || {};
    const contactInfo = [
      `Name: ${advisor.firstName || ''} ${advisor.lastName || ''}`,
      `Email: ${advisor.email || 'advisor@richeai.com'}`,
      `Firm: ${advisor.firmName || 'RicheAI Financial Services'}`,
      'Phone: Available through platform messaging'
    ];

    for (const info of contactInfo) {
      page.drawText(`• ${info}`, {
        x: this.margins.left + 20,
        y: yPosition,
        size: 11,
        font: regularFont
      });
      yPosition -= 18;
    }

    yPosition -= 20;

    // Emergency contact instructions
    page.drawText('For urgent financial matters or market concerns, please contact your advisor', {
      x: this.margins.left,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: this.colors.gray
    });
    yPosition -= 15;

    page.drawText('immediately through the RicheAI platform messaging system.', {
      x: this.margins.left,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: this.colors.gray
    });
  }
}

module.exports = GoalPlanPdfGenerator;