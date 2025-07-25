const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

class GoalPlanPdfGenerator {
  constructor() {
    this.colors = {
      primary: rgb(0.149, 0.196, 0.871), // #2563eb
      secondary: rgb(0.059, 0.718, 0.855), // #0fb7db
      success: rgb(0.086, 0.627, 0.227), // #16a34a
      warning: rgb(0.961, 0.588, 0.086), // #f59e0b
      error: rgb(0.863, 0.078, 0.235), // #dc143c
      gray: rgb(0.374, 0.447, 0.522), // #6b7280
      lightGray: rgb(0.943, 0.961, 0.976), // #f1f5f9
      white: rgb(1, 1, 1),
      black: rgb(0, 0, 0)
    };
    
    this.margins = {
      top: 60,
      bottom: 60,
      left: 50,
      right: 50
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

      // 2. Executive Summary
      await this.addExecutiveSummary(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 3. Client Profile
      await this.addClientProfile(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 4. Goals Details
      await this.addGoalsDetails(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 5. AI Analysis
      if (planData.recommendations) {
        await this.addAIAnalysis(pdfDoc, planData, helveticaBoldFont, helveticaFont);
      }

      // 6. Advisor Recommendations
      if (planData.advisorNotes) {
        await this.addAdvisorRecommendations(pdfDoc, planData, helveticaBoldFont, helveticaFont);
      }

      // 7. Implementation Roadmap
      await this.addImplementationRoadmap(pdfDoc, planData, helveticaBoldFont, helveticaFont);

      // 8. Disclaimers
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
    
    // Header with company branding
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: this.colors.primary
    });

    // Company name/logo area
    page.drawText('RICHEAI', {
      x: this.margins.left,
      y: height - 60,
      size: 28,
      font: boldFont,
      color: this.colors.white
    });

    page.drawText('Financial Planning Solutions', {
      x: this.margins.left,
      y: height - 90,
      size: 14,
      font: regularFont,
      color: this.colors.white
    });

    // Report title
    page.drawText('GOAL-BASED FINANCIAL PLANNING REPORT', {
      x: this.margins.left,
      y: height - 200,
      size: 24,
      font: boldFont,
      color: this.colors.primary
    });

    // Client information
    const clientName = planData.client ? `${planData.client.firstName || ''} ${planData.client.lastName || ''}`.trim() : 'Client Name';
    page.drawText(`Prepared for: ${clientName || 'Client'}`, {
      x: this.margins.left,
      y: height - 250,
      size: 16,
      font: regularFont,
      color: this.colors.black
    });

    // Advisor information
    const advisorName = planData.advisor ? `${planData.advisor.firstName || ''} ${planData.advisor.lastName || ''}`.trim() : 'Financial Advisor';
    page.drawText(`Prepared by: ${advisorName}`, {
      x: this.margins.left,
      y: height - 280,
      size: 16,
      font: regularFont,
      color: this.colors.black
    });

    // Report date
    const reportDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    page.drawText(`Report Date: ${reportDate}`, {
      x: this.margins.left,
      y: height - 310,
      size: 16,
      font: regularFont,
      color: this.colors.black
    });

    // Plan ID
    if (planData.plan && planData.plan._id) {
      page.drawText(`Plan ID: ${planData.plan._id.toString().slice(-8).toUpperCase()}`, {
        x: this.margins.left,
        y: height - 340,
        size: 12,
        font: regularFont,
        color: this.colors.gray
      });
    }

    // Summary box
    const summaryY = height - 450;
    page.drawRectangle({
      x: this.margins.left,
      y: summaryY - 100,
      width: width - this.margins.left - this.margins.right,
      height: 100,
      color: this.colors.lightGray
    });

    page.drawText('PLAN SUMMARY', {
      x: this.margins.left + 15,
      y: summaryY - 25,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });

    const goalsCount = planData.goals?.length || 0;
    page.drawText(`• ${goalsCount} Financial Goals Selected`, {
      x: this.margins.left + 15,
      y: summaryY - 50,
      size: 12,
      font: regularFont,
      color: this.colors.black
    });

    const totalSIP = planData.goals?.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0) || 0;
    page.drawText(`• Total Monthly SIP Required: ₹${totalSIP.toLocaleString('en-IN')}`, {
      x: this.margins.left + 15,
      y: summaryY - 70,
      size: 12,
      font: regularFont,
      color: this.colors.black
    });

    // Footer
    page.drawText('This report contains confidential financial information', {
      x: this.margins.left,
      y: this.margins.bottom + 20,
      size: 10,
      font: regularFont,
      color: this.colors.gray
    });
  }

  async addExecutiveSummary(pdfDoc, planData, boldFont, regularFont) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - this.margins.top;
    
    // Title
    page.drawText('EXECUTIVE SUMMARY', {
      x: this.margins.left,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: this.colors.primary
    });
    yPosition -= 40;

    const goals = planData.goals || [];
    const totalSIP = goals.reduce((sum, goal) => sum + (goal.monthlySIP || 0), 0);
    const clientSurplus = (planData.client?.totalMonthlyIncome || 0) - (planData.client?.totalMonthlyExpenses || 0);
    const feasible = totalSIP <= clientSurplus;

    // Summary text
    const summaryLines = [
      `This goal-based financial planning report outlines a comprehensive strategy`,
      `for achieving ${goals.length} selected financial goals. The total monthly`,
      `investment requirement is ₹${totalSIP.toLocaleString('en-IN')}, which is ${feasible ? 'achievable' : 'challenging'}`,
      `based on the current monthly surplus of ₹${clientSurplus.toLocaleString('en-IN')}.`,
      '',
      'The plan incorporates AI-powered analysis to optimize asset allocation,',
      'minimize risk, and maximize the probability of achieving all selected goals',
      'within their respective timelines.'
    ];

    for (const line of summaryLines) {
      page.drawText(line, {
        x: this.margins.left,
        y: yPosition,
        size: 12,
        font: regularFont
      });
      yPosition -= 18;
    }

    yPosition -= 20;

    // Key Metrics Box
    const boxHeight = 120;
    page.drawRectangle({
      x: this.margins.left,
      y: yPosition - boxHeight,
      width: width - this.margins.left - this.margins.right,
      height: boxHeight,
      color: this.colors.lightGray
    });

    page.drawText('KEY METRICS', {
      x: this.margins.left + 15,
      y: yPosition - 25,
      size: 14,
      font: boldFont,
      color: this.colors.primary
    });

    page.drawText(`Total Goals: ${goals.length}`, {
      x: this.margins.left + 15,
      y: yPosition - 50,
      size: 12,
      font: regularFont
    });

    page.drawText(`Monthly Investment: ₹${totalSIP.toLocaleString('en-IN')}`, {
      x: this.margins.left + 15,
      y: yPosition - 70,
      size: 12,
      font: regularFont
    });

    page.drawText(`Plan Status: ${feasible ? 'Achievable' : 'Needs Optimization'}`, {
      x: this.margins.left + 15,
      y: yPosition - 90,
      size: 12,
      font: regularFont,
      color: feasible ? this.colors.success : this.colors.warning
    });
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
}

module.exports = GoalPlanPdfGenerator;