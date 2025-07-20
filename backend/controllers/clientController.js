const Client = require('../models/Client');
const ClientInvitation = require('../models/ClientInvitation');
const Advisor = require('../models/Advisor');
const { logger, logAuth, logApi, logSecurity } = require('../utils/logger');
const nodemailer = require('nodemailer');
const CASParser = require('../services/cas-parser');
const { OnboardingCASController } = require('./OnboardingCASController');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Enhanced logging utilities for form tracking
const FormLogger = {
  logEvent: (event, data = {}) => {
    const timestamp = new Date().toISOString();
    const logData = {
      event,
      timestamp,
      ...data
    };
    logger.info(`[ENHANCED_FORM] ${event}`, logData);
    console.log('\n' + '='.repeat(80));
    console.log(`📝 FORM EVENT: ${event}`);
    console.log(`⏰ Time: ${timestamp}`);
    console.log('📊 Data:');
    console.log(JSON.stringify(logData, null, 2));
    console.log('='.repeat(80));
  },
  logOnboardingEvent: (event, token, data = {}) => {
    FormLogger.logEvent(event, { onboardingToken: token, ...data });
  },
  logError: (event, error, data = {}) => {
    const errorData = {
      event,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      timestamp: new Date().toISOString(),
      ...data
    };
    logger.error(`[ENHANCED_FORM_ERROR] ${event}`, errorData);
    console.log('\n' + '❌'.repeat(40));
    console.log(`🚨 FORM ERROR: ${event}`);
    console.log(`⏰ Time: ${errorData.timestamp}`);
    console.log('💥 Error Details:');
    console.log(JSON.stringify(errorData, null, 2));
    console.log('❌'.repeat(40));
  }
};

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email templates
const getInvitationEmailTemplate = (advisorName, advisorFirm, clientName, invitationUrl, expiryHours) => {
  return {
    subject: `Complete Your Comprehensive Financial Profile - ${advisorFirm || 'Richie AI'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e3a5f; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .button { background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .warning { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .features { background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Richie AI</h1>
            <p>Your Comprehensive Financial Planning Platform</p>
          </div>
          
          <div class="content">
            <h2>Hello ${clientName || 'Valued Client'},</h2>
            
            <p>You have been invited by <strong>${advisorName}</strong> ${advisorFirm ? `from <strong>${advisorFirm}</strong>` : ''} to complete your comprehensive financial profile on our advanced platform.</p>
            
            <div class="features">
              <h3>🎯 Enhanced 5-Stage Onboarding Process</h3>
              <ul>
                <li><strong>Stage 1:</strong> Personal Information & KYC Details</li>
                <li><strong>Stage 2:</strong> Comprehensive Income & Expense Analysis</li>
                <li><strong>Stage 3:</strong> Financial Goals & Retirement Planning</li>
                <li><strong>Stage 4:</strong> Complete Assets & Liabilities Assessment</li>
                <li><strong>Stage 5:</strong> Investment Profile & CAS Upload</li>
              </ul>
            </div>
            
            <p>To get started with your personalized financial planning journey, please click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">🚀 Start Your Financial Profile</a>
            </div>
            
            <div class="warning">
              <strong>⏰ Important:</strong> This invitation link will expire in ${expiryHours} hours for security reasons. Please complete your comprehensive profile before then.
            </div>
            
            <p><strong>What makes this onboarding special:</strong></p>
            <ul>
              <li>📊 Detailed financial health assessment</li>
              <li>🎯 Comprehensive goal setting and prioritization</li>
              <li>💰 Complete asset and liability mapping</li>
              <li>📈 Investment risk profiling</li>
              <li>📄 Optional CAS (Consolidated Account Statement) upload for automatic portfolio import</li>
              <li>🔒 Bank-grade security and encryption</li>
            </ul>
            
            <p>Your information is completely secure and will only be used to provide you with personalized financial advice and planning recommendations.</p>
            
            <p>If you have any questions or need assistance during the onboarding process, please don't hesitate to contact your advisor or our support team.</p>
            
            <p>Best regards,<br>
            <strong>The Richie AI Team</strong></p>
            
            <hr>
            <p style="font-size: 11px; color: #6b7280;">
              If you cannot click the button above, copy and paste this link into your browser:<br>
              <a href="${invitationUrl}">${invitationUrl}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 Richie AI. All rights reserved.</p>
            <p>This email was sent to you by your financial advisor. If you received this email by mistake, please ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Utility for detailed error logging
function logDetailedError(context, error, extra = {}) {
  logger.error(`[${context}] ${error.message}`, {
    stack: error.stack,
    ...extra
  });
}

// Utility for detailed info logging
function logDetailedInfo(context, info, extra = {}) {
  logger.info(`[${context}] ${info}`, extra);
}

// Helper for encryption (AES-256-CBC with IV)
function getEncryptionKey() {
  let key = process.env.CAS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CAS_ENCRYPTION_KEY is not set');
  }
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  const buf = Buffer.alloc(32);
  Buffer.from(key, 'utf8').copy(buf);
  return buf;
}

function encryptText(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

function decryptText(encrypted, ivHex) {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Get all clients for an advisor - ENHANCED
const getClients = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  
  try {
    FormLogger.logEvent('CLIENT_LIST_REQUEST', { advisorId });
    
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { advisor: advisorId };
    
    // Add search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute query with enhanced population
    const clients = await Client.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('advisor', 'firstName lastName firmName');
    
    const totalClients = await Client.countDocuments(query);
    const totalPages = Math.ceil(totalClients / limit);
    
    // Calculate enhanced metrics for each client
    const enhancedClients = clients.map(client => {
      const clientObj = client.toObject();
      
      // Calculate financial summaries
      const calculatedFinancials = client.calculatedFinancials;
      
      // Add portfolio summary if CAS data exists
      let portfolioSummary = null;
      if (client.hasCASData && client.casData.parsedData) {
        portfolioSummary = {
          totalValue: client.casData.parsedData.summary?.total_value || 0,
          dematAccounts: client.casData.parsedData.demat_accounts?.length || 0,
          mutualFunds: client.casData.parsedData.mutual_funds?.length || 0,
          lastUpdated: client.casData.lastParsedAt,
          status: client.casData.casStatus
        };
      }
      
      return {
        ...clientObj,
        calculatedFinancials,
        portfolioSummary,
        completionPercentage: calculateProfileCompletion(client)
      };
    });
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('CLIENT_LIST_SUCCESS', {
      advisorId,
      clientCount: enhancedClients.length,
      totalClients,
      duration: `${duration}ms`
    });
    
    res.json({
      success: true,
      data: {
        clients: enhancedClients,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalClients,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('CLIENT_LIST_ERROR', error, { advisorId });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve clients',
      error: error.message
    });
  }
};

// Calculate profile completion percentage
const calculateProfileCompletion = (client) => {
  let completed = 0;
  let total = 0;
  
  // Stage 1: Personal Information (20%)
  total += 20;
  if (client.firstName && client.lastName && client.email && client.phoneNumber && 
      client.dateOfBirth && client.panNumber && client.address?.street && 
      client.address?.city && client.address?.state) {
    completed += 20;
  }
  
  // Stage 2: Income & Employment (20%)
  total += 20;
  if (client.occupation && client.employerBusinessName && client.annualIncome && 
      client.monthlyExpenses?.housingRent !== undefined) {
    completed += 20;
  }
  
  // Stage 3: Financial Goals (20%)
  total += 20;
  if (client.retirementPlanning?.targetRetirementAge && client.majorGoals?.length > 0) {
    completed += 20;
  }
  
  // Stage 4: Assets & Liabilities (20%)
  total += 20;
  if (client.assets?.cashBankSavings !== undefined || client.assets?.realEstate || 
      client.liabilities?.loans !== undefined) {
    completed += 20;
  }
  
  // Stage 5: Investment Profile (20%)
  total += 20;
  if (client.investmentExperience && client.riskTolerance) {
    completed += 20;
  }
  
  return Math.round((completed / total) * 100);
};

// Get client by ID - ENHANCED
const getClientById = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id } = req.params;
  
  try {
    FormLogger.logEvent('CLIENT_DETAIL_REQUEST', { advisorId, clientId: id });
    
    const client = await Client.findOne({ _id: id, advisor: advisorId })
      .populate('advisor', 'firstName lastName firmName');
    
    if (!client) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration, advisorId);
      
      FormLogger.logError('CLIENT_NOT_FOUND', new Error('Client not found'), { advisorId, clientId: id });
      
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Enhanced client data with calculations
    const enhancedClient = {
      ...client.toObject(),
      calculatedFinancials: client.calculatedFinancials,
      completionPercentage: calculateProfileCompletion(client),
      portfolioSummary: client.casSummary,
      assetAllocation: client.getAssetAllocation()
    };
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('CLIENT_DETAIL_SUCCESS', {
      advisorId,
      clientId: id,
      completionPercentage: enhancedClient.completionPercentage,
      hasCasData: !!enhancedClient.portfolioSummary
    });
    
    res.json({
      success: true,
      data: enhancedClient
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('CLIENT_DETAIL_ERROR', error, { advisorId, clientId: id });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client details',
      error: error.message
    });
  }
};

// Send client invitation - ENHANCED
const sendClientInvitation = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  try {
    const { clientEmail, clientFirstName, clientLastName, notes } = req.body;
    
    FormLogger.logEvent('INVITATION_REQUEST', {
      advisorId,
      clientEmail,
      clientName: `${clientFirstName} ${clientLastName}`.trim()
    });
    
    // Validate required fields
    if (!clientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Client email is required'
      });
    }
    
    // Check if client already exists
    const existingClient = await Client.findOne({ 
      email: clientEmail.toLowerCase(), 
      advisor: advisorId 
    });
    
    if (existingClient) {
      FormLogger.logError('INVITATION_DUPLICATE_CLIENT', new Error('Client already exists'), {
        advisorId,
        clientEmail
      });
      return res.status(400).json({
        success: false,
        message: 'Client already exists in your account'
      });
    }
    
    // Check invitation limit
    const invitationCount = await ClientInvitation.countDocuments({
      clientEmail: clientEmail.toLowerCase(),
      advisor: advisorId
    });
    
    if (invitationCount >= 5) {
      FormLogger.logError('INVITATION_LIMIT_EXCEEDED', new Error('Max invitations reached'), {
        advisorId,
        clientEmail,
        invitationCount
      });
      return res.status(400).json({
        success: false,
        message: `Maximum of 5 invitations reached for this client. Current count: ${invitationCount}/5`
      });
    }
    
    // Get advisor details
    const advisor = await Advisor.findById(advisorId);
    
    // Create invitation
    const invitation = new ClientInvitation({
      clientEmail: clientEmail.toLowerCase(),
      clientFirstName,
      clientLastName,
      advisor: advisorId,
      notes,
      invitationSource: 'manual'
    });
    
    await invitation.save();
    
    // Generate invitation URL
    const invitationUrl = invitation.generateInvitationUrl();
    const expiryHours = process.env.INVITATION_EXPIRY_HOURS || 48;
    
    // Send enhanced email
    const transporter = createEmailTransporter();
    const emailTemplate = getInvitationEmailTemplate(
      `${advisor.firstName} ${advisor.lastName}`,
      advisor.firmName,
      clientFirstName ? `${clientFirstName} ${clientLastName || ''}`.trim() : '',
      invitationUrl,
      expiryHours
    );
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });
    
    // Mark invitation as sent
    await invitation.markAsSent();
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    const finalInvitationCount = invitationCount + 1;
    
    FormLogger.logEvent('INVITATION_SUCCESS', {
      advisorId,
      clientEmail,
      invitationId: invitation._id,
      invitationCount: finalInvitationCount,
      expiryHours
    });
    
    res.json({
      success: true,
      message: `Enhanced client invitation sent successfully! (${finalInvitationCount}/5 invitations used)`,
      data: {
        invitationId: invitation._id,
        clientEmail: clientEmail,
        expiresAt: invitation.expiresAt,
        invitationUrl: invitationUrl,
        invitationCount: finalInvitationCount,
        maxInvitations: 5,
        enhancedFeatures: [
          'Five-stage comprehensive onboarding',
          'Financial health assessment',
          'Goal prioritization system',
          'Asset allocation mapping',
          'CAS portfolio import'
        ]
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('INVITATION_ERROR', error, { advisorId });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send client invitation',
      error: error.message
    });
  }
};

// Get client invitations - ENHANCED
const getClientInvitations = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  
  try {
    FormLogger.logEvent('INVITATIONS_LIST_REQUEST', { advisorId });
    
    const {
      page = 1,
      limit = 10,
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { advisor: advisorId };
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute query
    const invitations = await ClientInvitation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('advisor', 'firstName lastName firmName')
      .populate('clientData', 'firstName lastName email status');
    
    const totalInvitations = await ClientInvitation.countDocuments(query);
    const totalPages = Math.ceil(totalInvitations / limit);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('INVITATIONS_LIST_SUCCESS', {
      advisorId,
      invitationCount: invitations.length,
      totalInvitations
    });
    
    res.json({
      success: true,
      data: {
        invitations,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalInvitations,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('INVITATIONS_LIST_ERROR', error, { advisorId });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client invitations',
      error: error.message
    });
  }
};

// Update client information - ENHANCED
const updateClient = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id } = req.params;
  
  try {
    FormLogger.logEvent('CLIENT_UPDATE_REQUEST', { advisorId, clientId: id });
    
    const client = await Client.findOne({ _id: id, advisor: advisorId });
    
    if (!client) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration, advisorId);
      
      FormLogger.logError('CLIENT_UPDATE_NOT_FOUND', new Error('Client not found'), {
        advisorId,
        clientId: id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Track what's being updated
    const updateData = { ...req.body };
    delete updateData.advisor; // Prevent advisor change
    
    const fieldsBeingUpdated = Object.keys(updateData);
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('advisor', 'firstName lastName firmName');
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('CLIENT_UPDATE_SUCCESS', {
      advisorId,
      clientId: id,
      fieldsUpdated: fieldsBeingUpdated,
      newCompletionPercentage: calculateProfileCompletion(updatedClient)
    });
    
    res.json({
      success: true,
      message: 'Client updated successfully',
      data: {
        ...updatedClient.toObject(),
        calculatedFinancials: updatedClient.calculatedFinancials,
        completionPercentage: calculateProfileCompletion(updatedClient)
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('CLIENT_UPDATE_ERROR', error, { advisorId, clientId: id });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message
    });
  }
};

// Delete client - ENHANCED
const deleteClient = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id } = req.params;
  
  try {
    FormLogger.logEvent('CLIENT_DELETE_REQUEST', { advisorId, clientId: id });
    
    const client = await Client.findOne({ _id: id, advisor: advisorId });
    
    if (!client) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration, advisorId);
      
      FormLogger.logError('CLIENT_DELETE_NOT_FOUND', new Error('Client not found'), {
        advisorId,
        clientId: id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Store client info for logging before deletion
    const clientInfo = {
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      hasCasData: !!client.casData?.parsedData
    };
    
    await Client.findByIdAndDelete(id);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('CLIENT_DELETE_SUCCESS', {
      advisorId,
      clientId: id,
      deletedClient: clientInfo
    });
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('CLIENT_DELETE_ERROR', error, { advisorId, clientId: id });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error.message
    });
  }
};

// Public endpoint - Get client onboarding form by token - ENHANCED
const getClientOnboardingForm = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { token } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  try {
    FormLogger.logOnboardingEvent('FORM_ACCESS_REQUEST', token, {
      clientIp,
      userAgent
    });
    
    const invitation = await ClientInvitation.findOne({ token })
      .populate('advisor', 'firstName lastName firmName email');
    
    if (!invitation) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration);
      
      FormLogger.logError('FORM_ACCESS_INVALID_TOKEN', new Error('Invalid token'), { token });
      
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link'
      });
    }
    
    if (invitation.isExpired) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      FormLogger.logError('FORM_ACCESS_EXPIRED', new Error('Invitation expired'), { token });
      
      return res.status(410).json({
        success: false,
        message: 'Invitation link has expired'
      });
    }
    
    if (invitation.status === 'completed') {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      FormLogger.logError('FORM_ACCESS_COMPLETED', new Error('Already completed'), { token });
      
      return res.status(410).json({
        success: false,
        message: 'This invitation has already been completed'
      });
    }
    
    // Mark invitation as opened
    await invitation.markAsOpened(clientIp, userAgent);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    FormLogger.logOnboardingEvent('FORM_ACCESS_SUCCESS', token, {
      advisorId: invitation.advisor._id,
      clientEmail: invitation.clientEmail
    });
    
    res.json({
      success: true,
      data: {
        invitation: {
          id: invitation._id,
          clientEmail: invitation.clientEmail,
          clientFirstName: invitation.clientFirstName,
          clientLastName: invitation.clientLastName,
          expiresAt: invitation.expiresAt,
          timeRemaining: invitation.timeRemaining
        },
        advisor: invitation.advisor,
        formConfiguration: {
          totalStages: 5,
          stages: [
            { stage: 1, title: 'Personal Information', description: 'Basic details and KYC information' },
            { stage: 2, title: 'Income & Employment', description: 'Comprehensive financial income analysis' },
            { stage: 3, title: 'Financial Goals', description: 'Retirement and major life goals planning' },
            { stage: 4, title: 'Assets & Liabilities', description: 'Complete financial position assessment' },
            { stage: 5, title: 'Investment Profile & CAS', description: 'Risk tolerance and portfolio import' }
          ]
        }
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('FORM_ACCESS_ERROR', error, { token });
    logApi.error(method, url, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to access onboarding form',
      error: error.message
    });
  }
};

// Public endpoint - Submit client onboarding form - ENHANCED FOR 5-STAGE FORM
const submitClientOnboardingForm = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { token } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  try {
    FormLogger.logOnboardingEvent('FORM_SUBMISSION_STARTED', token, {
      clientIp,
      hasData: !!req.body
    });
    
    const invitation = await ClientInvitation.findOne({ token });
    
    if (!invitation) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration);
      
      FormLogger.logError('FORM_SUBMISSION_INVALID_TOKEN', new Error('Invalid token'), { token });
      
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link'
      });
    }
    
    if (invitation.isExpired) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      FormLogger.logError('FORM_SUBMISSION_EXPIRED', new Error('Invitation expired'), { token });
      
      return res.status(410).json({
        success: false,
        message: 'Invitation link has expired'
      });
    }
    
    if (invitation.status === 'completed') {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      FormLogger.logError('FORM_SUBMISSION_ALREADY_COMPLETED', new Error('Already completed'), { token });
      
      return res.status(410).json({
        success: false,
        message: 'This invitation has already been completed'
      });
    }
    
    // Extract enhanced form data and CAS data
    const { casData, customGoals, ...clientFormData } = req.body;
    
    // DETAILED DEBUG LOGGING - Raw form data analysis
    console.log('\n🔍 DETAILED FORM SUBMISSION DEBUG START');
    console.log('=' .repeat(80));
    console.log(`📧 Email: ${invitation.clientEmail}`);
    console.log(`🎫 Token: ${token}`);
    console.log(`📊 Raw form data keys: ${Object.keys(clientFormData).length} fields`);
    console.log(`📋 Form data keys: ${Object.keys(clientFormData).join(', ')}`);
    
    // Log specific problematic fields
    console.log('\n💰 DEBT FIELDS ANALYSIS:');
    console.log(`carLoanEMI: "${clientFormData.carLoanEMI}" (type: ${typeof clientFormData.carLoanEMI})`);
    console.log(`carLoanInterestRate: "${clientFormData.carLoanInterestRate}" (type: ${typeof clientFormData.carLoanInterestRate})`);
    console.log(`carLoanOutstanding: "${clientFormData.carLoanOutstanding}" (type: ${typeof clientFormData.carLoanOutstanding})`);
    console.log(`homeLoanEMI: "${clientFormData.homeLoanEMI}" (type: ${typeof clientFormData.homeLoanEMI})`);
    console.log(`personalLoanEMI: "${clientFormData.personalLoanEMI}" (type: ${typeof clientFormData.personalLoanEMI})`);
    
    console.log('\n📍 ADDRESS FIELD ANALYSIS:');
    console.log(`address: "${clientFormData.address}" (type: ${typeof clientFormData.address})`);
    if (typeof clientFormData.address === 'string') {
      console.log(`Address string length: ${clientFormData.address.length}`);
    }
    
    console.log('\n💼 INVESTMENT FIELDS ANALYSIS:');
    console.log(`mutualFundsTotalValue: "${clientFormData.mutualFundsTotalValue}" (type: ${typeof clientFormData.mutualFundsTotalValue})`);
    console.log(`directStocksTotalValue: "${clientFormData.directStocksTotalValue}" (type: ${typeof clientFormData.directStocksTotalValue})`);
    
    console.log('\n🛡️ INSURANCE FIELDS ANALYSIS:');
    console.log(`lifeInsuranceCoverAmount: "${clientFormData.lifeInsuranceCoverAmount}" (type: ${typeof clientFormData.lifeInsuranceCoverAmount})`);
    console.log(`healthInsuranceCoverAmount: "${clientFormData.healthInsuranceCoverAmount}" (type: ${typeof clientFormData.healthInsuranceCoverAmount})`);
    
    // Parse JSON string fields from frontend
    console.log('\n📝 STARTING JSON PARSING...');
    try {
      if (typeof clientFormData.address === 'string') {
        clientFormData.address = JSON.parse(clientFormData.address);
      }
      if (typeof clientFormData.assets === 'string') {
        clientFormData.assets = JSON.parse(clientFormData.assets);
      }
      if (typeof clientFormData.liabilities === 'string') {
        clientFormData.liabilities = JSON.parse(clientFormData.liabilities);
      }
      if (typeof clientFormData.monthlyExpenses === 'string') {
        clientFormData.monthlyExpenses = JSON.parse(clientFormData.monthlyExpenses);
      }
      if (typeof clientFormData.retirementPlanning === 'string') {
        clientFormData.retirementPlanning = JSON.parse(clientFormData.retirementPlanning);
      }
      if (typeof clientFormData.majorGoals === 'string') {
        clientFormData.majorGoals = JSON.parse(clientFormData.majorGoals);
      }
      if (typeof clientFormData.investmentGoals === 'string') {
        clientFormData.investmentGoals = JSON.parse(clientFormData.investmentGoals);
      }
    } catch (parseError) {
      FormLogger.logError('FORM_DATA_PARSE_ERROR', parseError, { token });
      console.log('❌ JSON Parse Error:', parseError.message);
      console.log('❌ Parse Error Stack:', parseError.stack);
    }
    
    console.log('✅ JSON PARSING COMPLETED');
    
    // Map individual debt fields to debtsAndLiabilities structure
    console.log('\n🏦 MAPPING DEBT FIELDS...');
    if (!clientFormData.debtsAndLiabilities) {
      console.log('📝 Creating debtsAndLiabilities structure from individual fields');
      clientFormData.debtsAndLiabilities = {
        homeLoan: {
          hasLoan: !!(clientFormData.homeLoanEMI || clientFormData.homeLoanOutstanding),
          outstandingAmount: parseFloat(clientFormData.homeLoanOutstanding) || 0,
          monthlyEMI: parseFloat(clientFormData.homeLoanEMI) || 0,
          interestRate: parseFloat(clientFormData.homeLoanInterestRate) || 0,
          remainingTenure: parseFloat(clientFormData.homeLoanTenure) || 0
        },
        carLoan: {
          hasLoan: !!(clientFormData.carLoanEMI || clientFormData.carLoanOutstanding),
          outstandingAmount: parseFloat(clientFormData.carLoanOutstanding) || 0,
          monthlyEMI: parseFloat(clientFormData.carLoanEMI) || 0,
          interestRate: parseFloat(clientFormData.carLoanInterestRate) || 0
        },
        personalLoan: {
          hasLoan: !!(clientFormData.personalLoanEMI || clientFormData.personalLoanOutstanding),
          outstandingAmount: parseFloat(clientFormData.personalLoanOutstanding) || 0,
          monthlyEMI: parseFloat(clientFormData.personalLoanEMI) || 0,
          interestRate: parseFloat(clientFormData.personalLoanInterestRate) || 0
        }
      };
      
      // Log the created debtsAndLiabilities structure
      console.log('🔍 Created debtsAndLiabilities:');
      console.log('  homeLoan:', JSON.stringify(clientFormData.debtsAndLiabilities.homeLoan, null, 2));
      console.log('  carLoan:', JSON.stringify(clientFormData.debtsAndLiabilities.carLoan, null, 2));
      console.log('  personalLoan:', JSON.stringify(clientFormData.debtsAndLiabilities.personalLoan, null, 2));
      
      // Specific analysis of car loan interest rate
      console.log(`\n🚗 CAR LOAN INTEREST RATE DETAILED ANALYSIS:`);
      console.log(`  Raw value: "${clientFormData.carLoanInterestRate}"`);
      console.log(`  Parsed value: ${parseFloat(clientFormData.carLoanInterestRate)}`);
      console.log(`  Final value: ${clientFormData.debtsAndLiabilities.carLoan.interestRate}`);
      console.log(`  Is NaN: ${isNaN(parseFloat(clientFormData.carLoanInterestRate))}`);
      console.log(`  Type after parse: ${typeof clientFormData.debtsAndLiabilities.carLoan.interestRate}`);
    } else {
      console.log('📋 debtsAndLiabilities already exists:', JSON.stringify(clientFormData.debtsAndLiabilities, null, 2));
    }
    
    // Map individual investment fields to investments structure
    if (!clientFormData.investments) {
      clientFormData.investments = {
        equity: {
          mutualFunds: parseFloat(clientFormData.mutualFundsTotalValue) || 0,
          directStocks: parseFloat(clientFormData.directStocksTotalValue) || 0
        },
        fixedIncome: {
          ppf: parseFloat(clientFormData.ppfCurrentBalance) || 0,
          epf: parseFloat(clientFormData.epfCurrentBalance) || 0,
          nps: parseFloat(clientFormData.npsCurrentBalance) || 0,
          fixedDeposits: parseFloat(clientFormData.fixedDepositsTotalValue) || 0,
          bondsDebentures: 0, // Not in current form
          nsc: 0 // Not in current form
        },
        other: {
          ulip: parseFloat(clientFormData.elssCurrentValue) || 0,
          otherInvestments: 0 // Not in current form
        }
      };
    }
    
    // Map individual insurance fields to insuranceCoverage structure
    if (!clientFormData.insuranceCoverage) {
      clientFormData.insuranceCoverage = {
        lifeInsurance: {
          hasCoverage: !!(clientFormData.lifeInsuranceCoverAmount || clientFormData.lifeInsuranceAnnualPremium),
          coverageAmount: parseFloat(clientFormData.lifeInsuranceCoverAmount) || 0,
          annualPremium: parseFloat(clientFormData.lifeInsuranceAnnualPremium) || 0,
          insuranceType: clientFormData.lifeInsuranceType || ''
        },
        healthInsurance: {
          hasCoverage: !!(clientFormData.healthInsuranceCoverAmount || clientFormData.healthInsuranceAnnualPremium),
          coverageAmount: parseFloat(clientFormData.healthInsuranceCoverAmount) || 0,
          annualPremium: parseFloat(clientFormData.healthInsuranceAnnualPremium) || 0,
          familyMembers: parseInt(clientFormData.healthInsuranceFamilyMembers) || 1
        },
        vehicleInsurance: {
          hasCoverage: !!(clientFormData.vehicleInsuranceAnnualPremium),
          annualPremium: parseFloat(clientFormData.vehicleInsuranceAnnualPremium) || 0
        }
      };
    }
    
    // Map financial goals
    if (!clientFormData.financialGoals) {
      clientFormData.financialGoals = {
        emergencyFund: {
          priority: clientFormData.emergencyFundPriority || 'Medium',
          targetAmount: parseFloat(clientFormData.emergencyFundTarget) || 0
        },
        childEducation: {
          hasGoal: clientFormData.hasChildEducationGoal || false,
          targetAmount: parseFloat(clientFormData.childEducationTarget) || 0,
          targetYear: parseInt(clientFormData.childEducationTargetYear) || new Date().getFullYear() + 10
        },
        homePurchase: {
          hasGoal: clientFormData.hasHomePurchaseGoal || false
        }
      };
    }
    
    FormLogger.logOnboardingEvent('FORM_DATA_EXTRACTED', token, {
      hasCasData: !!casData,
      hasCustomGoals: !!customGoals?.length,
      formStages: {
        personalInfo: !!(clientFormData.firstName && clientFormData.lastName),
        incomeEmployment: !!(clientFormData.occupation && clientFormData.annualIncome),
        financialGoals: !!(clientFormData.retirementPlanning?.targetRetirementAge),
        assetsLiabilities: !!(clientFormData.assets),
        investmentProfile: !!(clientFormData.investmentExperience && clientFormData.riskTolerance)
      }
    });
    
    // Prepare comprehensive client data using the transformed structure from frontend
    const clientData = {
      // Stage 1: Personal Information
      firstName: clientFormData.firstName,
      lastName: clientFormData.lastName,
      email: invitation.clientEmail,
      phoneNumber: clientFormData.phoneNumber,
      dateOfBirth: clientFormData.dateOfBirth,
      gender: clientFormData.gender,
      panNumber: clientFormData.panNumber,
      maritalStatus: clientFormData.maritalStatus,
      numberOfDependents: clientFormData.numberOfDependents || 0,
      address: {
        street: clientFormData.address?.street,
        city: clientFormData.address?.city,
        state: clientFormData.address?.state,
        zipCode: clientFormData.address?.zipCode,
        country: clientFormData.address?.country || 'India'
      },
      
      // Stage 2: Income & Employment (Enhanced from frontend transformation)
      occupation: clientFormData.occupation,
      employerBusinessName: clientFormData.employerBusinessName,
      incomeType: clientFormData.incomeType,
      totalMonthlyIncome: clientFormData.totalMonthlyIncome,
      totalMonthlyExpenses: clientFormData.totalMonthlyExpenses,
      annualIncome: clientFormData.annualIncome || (clientFormData.totalMonthlyIncome * 12),
      additionalIncome: clientFormData.additionalIncome || 0,
      
      // Enhanced expense breakdown
      expenseBreakdown: {
        showBreakdown: clientFormData.expenseBreakdown?.showBreakdown || false,
        housingRent: clientFormData.expenseBreakdown?.housingRent || 0,
        foodGroceries: clientFormData.expenseBreakdown?.foodGroceries || 0,
        transportation: clientFormData.expenseBreakdown?.transportation || 0,
        utilities: clientFormData.expenseBreakdown?.utilities || 0,
        entertainment: clientFormData.expenseBreakdown?.entertainment || 0,
        healthcare: clientFormData.expenseBreakdown?.healthcare || 0,
        otherExpenses: clientFormData.expenseBreakdown?.otherExpenses || 0
      },
      
      // Legacy monthly expenses structure (for backward compatibility)
      monthlyExpenses: {
        housingRent: clientFormData.expenseBreakdown?.housingRent || 0,
        groceriesUtilitiesFood: clientFormData.expenseBreakdown?.foodGroceries || 0,
        transportation: clientFormData.expenseBreakdown?.transportation || 0,
        education: 0, // Not in current form
        healthcare: clientFormData.expenseBreakdown?.healthcare || 0,
        entertainment: clientFormData.expenseBreakdown?.entertainment || 0,
        insurancePremiums: 0, // Will be calculated from insurance data
        loanEmis: 0, // Will be calculated from loan data
        otherExpenses: clientFormData.expenseBreakdown?.otherExpenses || 0
      },
      
      // Stage 3: Retirement Planning (Enhanced)
      retirementAge: clientFormData.retirementAge || 60,
      hasRetirementCorpus: clientFormData.hasRetirementCorpus || false,
      currentRetirementCorpus: clientFormData.currentRetirementCorpus || 0,
      targetRetirementCorpus: clientFormData.targetRetirementCorpus || 0,
      
      // Legacy retirement planning structure
      retirementPlanning: {
        retirementAge: clientFormData.retirementAge || 60,
        targetRetirementAge: clientFormData.retirementAge || 60,
        retirementCorpusTarget: clientFormData.targetRetirementCorpus || 0,
        hasRetirementCorpus: clientFormData.hasRetirementCorpus || false,
        currentRetirementCorpus: clientFormData.currentRetirementCorpus || 0
      },
      
      // Enhanced Financial Goals
      financialGoals: clientFormData.financialGoals || {},
      enhancedFinancialGoals: clientFormData.financialGoals || {},
      majorGoals: [
        ...(clientFormData.majorGoals || []),
        ...(customGoals || [])
      ].filter(goal => goal.goalName && goal.targetAmount),
      
      // Stage 4: Investments (Using transformed structure)
      investments: clientFormData.investments || {
        equity: { mutualFunds: 0, directStocks: 0 },
        fixedIncome: { ppf: 0, epf: 0, nps: 0, fixedDeposits: 0, bondsDebentures: 0, nsc: 0 },
        other: { ulip: 0, otherInvestments: 0 }
      },
      
      // Legacy assets structure (for backward compatibility)
      assets: {
        cashBankSavings: 0, // Not in current form
        realEstate: 0, // Not in current form
        investments: clientFormData.investments || {
          equity: { mutualFunds: 0, directStocks: 0 },
          fixedIncome: { ppf: 0, epf: 0, nps: 0, fixedDeposits: 0, bondsDebentures: 0, nsc: 0 },
          other: { ulip: 0, otherInvestments: 0 }
        }
      },
      
      // Stage 5: Debts & Liabilities (Using transformed structure)
      debtsAndLiabilities: clientFormData.debtsAndLiabilities || {},
      
      // Legacy liabilities structure (calculate totals for backward compatibility)
      liabilities: {
        loans: Object.values(clientFormData.debtsAndLiabilities || {})
          .filter(debt => debt && debt.hasLoan && debt.outstandingAmount)
          .reduce((total, debt) => total + (debt.outstandingAmount || 0), 0),
        creditCardDebt: clientFormData.debtsAndLiabilities?.creditCards?.totalOutstanding || 0
      },
      
      // Stage 6: Insurance Coverage (Using transformed structure)
      insuranceCoverage: clientFormData.insuranceCoverage || {},
      
      // Stage 7: Investment Profile & Risk
      investmentExperience: clientFormData.investmentExperience,
      riskTolerance: clientFormData.riskTolerance,
      monthlyInvestmentCapacity: clientFormData.monthlyInvestmentCapacity || 0,
      investmentGoals: clientFormData.investmentGoals || [],
      monthlySavingsTarget: clientFormData.monthlySavingsTarget,
      
      // System fields
      advisor: invitation.advisor,
      status: 'active', // Mark as active since comprehensive onboarding is complete
      
      // Form progress tracking
      formProgress: {
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        step4Completed: true,
        step5Completed: true,
        currentStep: 5,
        lastSavedAt: new Date()
      }
    };
    
    // Process frontend-generated CAS data if available (KEEP EXISTING CAS LOGIC)
    if (casData && casData.frontendProcessed && casData.parsedData) {
      FormLogger.logOnboardingEvent('CAS_DATA_PROCESSING', token, {
        fileName: casData.fileName,
        fileSize: casData.fileSize,
        status: casData.status,
        totalValue: casData.parsedData.summary?.total_value,
        dematAccounts: casData.parsedData.demat_accounts?.length || 0,
        mutualFunds: casData.parsedData.mutual_funds?.length || 0
      });
      
      // Structure CAS data according to schema (KEEP EXISTING CAS LOGIC)
      clientData.casData = {
        casFile: {
          fileName: casData.fileName,
          uploadDate: new Date(),
          fileSize: casData.fileSize,
          frontendProcessed: true
        },
        parsedData: casData.parsedData,
        casStatus: 'parsed',
        lastParsedAt: new Date(),
        processingHistory: [{
          action: 'frontend_processing',
          timestamp: new Date(),
          status: 'success',
          details: 'CAS processed in frontend during enhanced onboarding',
          eventId: casData.processingTrackingId || 'frontend_processing'
        }]
      };
      
      FormLogger.logOnboardingEvent('CAS_DATA_INTEGRATED', token, {
        totalValue: clientData.casData.parsedData.summary?.total_value,
        investorName: clientData.casData.parsedData.investor?.name,
        investorPAN: clientData.casData.parsedData.investor?.pan ? '***MASKED***' : 'Not found'
      });
    }
    
    // Create and save client with comprehensive data
    console.log('\n💾 CREATING CLIENT MODEL...');
    console.log('📋 Final clientData structure overview:');
    console.log(`  - firstName: "${clientData.firstName}"`);
    console.log(`  - lastName: "${clientData.lastName}"`);
    console.log(`  - email: "${clientData.email}"`);
    console.log(`  - Has debtsAndLiabilities: ${!!clientData.debtsAndLiabilities}`);
    console.log(`  - Has investments: ${!!clientData.investments}`);
    console.log(`  - Has insuranceCoverage: ${!!clientData.insuranceCoverage}`);
    
    if (clientData.debtsAndLiabilities) {
      console.log('\n🏦 FINAL DEBTS AND LIABILITIES VALIDATION CHECK:');
      console.log('debtsAndLiabilities:', JSON.stringify(clientData.debtsAndLiabilities, null, 2));
    }
    
    console.log('\n🏗️ ATTEMPTING TO CREATE CLIENT MODEL...');
    const client = new Client(clientData);
    
    console.log('✅ Client model created successfully');
    console.log('\n💾 ATTEMPTING TO SAVE CLIENT TO DATABASE...');
    
    try {
      await client.save();
      console.log('✅ CLIENT SAVED SUCCESSFULLY TO DATABASE');
    } catch (saveError) {
      console.log('❌ CLIENT SAVE FAILED:');
      console.log('  Error name:', saveError.name);
      console.log('  Error message:', saveError.message);
      console.log('  Validation errors:', saveError.errors);
      if (saveError.errors) {
        Object.keys(saveError.errors).forEach(field => {
          console.log(`    ${field}: ${saveError.errors[field].message}`);
        });
      }
      console.log('  Full error:', JSON.stringify(saveError, null, 2));
      throw saveError; // Re-throw to be caught by outer try-catch
    }
    
    // Calculate final metrics
    const calculatedFinancials = client.calculatedFinancials;
    const completionPercentage = calculateProfileCompletion(client);
    
    // Mark invitation as completed
    await invitation.markAsCompleted(client._id);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    FormLogger.logOnboardingEvent('ENHANCED_ONBOARDING_COMPLETED', token, {
      clientId: client._id,
      clientEmail: client.email,
      completionPercentage,
      hasCasData: !!client.casData,
      casStatus: client.casData?.casStatus,
      portfolioValue: client.casData?.parsedData?.summary?.total_value || 0,
      calculatedFinancials,
      duration: `${duration}ms`,
      formStages: {
        personalInfo: !!client.firstName,
        incomeEmployment: !!client.occupation,
        financialGoals: !!client.retirementPlanning?.targetRetirementAge,
        assetsLiabilities: !!(client.assets?.cashBankSavings !== undefined),
        investmentProfile: !!client.investmentExperience,
        casUpload: !!client.casData
      }
    });
    
    res.json({
      success: true,
      message: 'Enhanced client onboarding completed successfully! All 5 stages processed.',
      data: {
        clientId: client._id,
        status: client.status,
        completionPercentage,
        hasCasData: !!client.casData,
        portfolioValue: client.casData?.parsedData?.summary?.total_value || 0,
        calculatedFinancials,
        summary: {
          personalInfoComplete: !!client.firstName,
          financialProfileComplete: !!client.occupation,
          goalsComplete: !!client.retirementPlanning?.targetRetirementAge,
          assetsComplete: !!(client.assets?.cashBankSavings !== undefined),
          investmentProfileComplete: !!client.investmentExperience,
          casDataAvailable: !!client.casData
        }
      }
    });
    
    console.log('\n🎉 FORM SUBMISSION COMPLETED SUCCESSFULLY');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.log('\n💥 FORM SUBMISSION ERROR OCCURRED');
    console.log('=' .repeat(80));
    console.log('❌ Error Details:');
    console.log('  Name:', error.name);
    console.log('  Message:', error.message);
    console.log('  Stack:', error.stack);
    if (error.errors) {
      console.log('  Validation Errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`    ${field}: ${error.errors[field].message}`);
      });
    }
    console.log('=' .repeat(80));
    const duration = Date.now() - startTime;
    FormLogger.logError('ENHANCED_ONBOARDING_ERROR', error, { token });
    logApi.error(method, url, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete enhanced onboarding',
      error: error.message
    });
  }
};

// Save draft functionality - NEW
const saveClientFormDraft = async (req, res) => {
  const startTime = Date.now();
  const { token } = req.params;
  const { stepNumber, stepData } = req.body;
  
  try {
    FormLogger.logOnboardingEvent('DRAFT_SAVE_REQUEST', token, {
      stepNumber,
      hasData: !!stepData
    });
    
    const invitation = await ClientInvitation.findOne({ token });
    
    if (!invitation || invitation.isExpired) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }
    
    // Find or create draft client record
    let client = await Client.findOne({ 
      email: invitation.clientEmail, 
      advisor: invitation.advisor 
    });
    
    if (!client) {
      // Create basic client record for draft saving
      client = new Client({
        firstName: invitation.clientFirstName || 'Draft',
        lastName: invitation.clientLastName || 'Client',
        email: invitation.clientEmail,
        advisor: invitation.advisor,
        status: 'onboarding'
      });
      await client.save();
    }
    
    // Save draft data
    await client.saveDraft(stepData, stepNumber);
    
    const duration = Date.now() - startTime;
    
    FormLogger.logOnboardingEvent('DRAFT_SAVE_SUCCESS', token, {
      stepNumber,
      clientId: client._id,
      duration: `${duration}ms`
    });
    
    res.json({
      success: true,
      message: `Step ${stepNumber} draft saved successfully`,
      data: {
        stepNumber,
        savedAt: new Date()
      }
    });
    
  } catch (error) {
    FormLogger.logError('DRAFT_SAVE_ERROR', error, { token, stepNumber });
    
    res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message
    });
  }
};

// Get draft functionality - NEW
const getClientFormDraft = async (req, res) => {
  const { token } = req.params;
  const { stepNumber } = req.query;
  
  try {
    const invitation = await ClientInvitation.findOne({ token });
    
    if (!invitation || invitation.isExpired) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }
    
    const client = await Client.findOne({ 
      email: invitation.clientEmail, 
      advisor: invitation.advisor 
    });
    
    if (!client) {
      return res.json({
        success: true,
        data: {
          draftData: {},
          currentStep: 1
        }
      });
    }
    
    const draftData = stepNumber ? client.getDraft(stepNumber) : client.draftData;
    
    res.json({
      success: true,
      data: {
        draftData,
        currentStep: client.formProgress?.currentStep || 1,
        lastSavedAt: client.formProgress?.lastSavedAt
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve draft',
      error: error.message
    });
  }
};

// CAS Upload function - ENHANCED (KEEP EXISTING CAS LOGIC)
const uploadClientCAS = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  let clientId = req.params.id;
  let advisorId = req.advisor?.id;
  let isOnboarding = false;
  
  try {
    // Check if this is an onboarding request
    if (req.params.token) {
      isOnboarding = true;
      
      const invitation = await ClientInvitation.findOne({ token: req.params.token });
      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invalid invitation token'
        });
      }
      
      if (invitation.isExpired) {
        return res.status(410).json({
          success: false,
          message: 'Invitation has expired'
        });
      }
      
      advisorId = invitation.advisor;
      
      let client = await Client.findOne({ 
        email: invitation.clientEmail, 
        advisor: advisorId 
      });
      
      if (!client) {
        client = new Client({
          firstName: invitation.clientFirstName || 'Client',
          lastName: invitation.clientLastName || '',
          email: invitation.clientEmail,
          advisor: advisorId,
          status: 'onboarding'
        });
        await client.save();
      }
      
      clientId = client._id;
    }
    
    // Validate file upload
    if (!req.file) {
      logDetailedError('CAS Upload', new Error('No CAS file uploaded'), { clientId, advisorId });
      return res.status(400).json({ success: false, message: 'No CAS file uploaded' });
    }
    
    FormLogger.logEvent('CAS_UPLOAD_RECEIVED', { clientId, fileName: req.file.originalname });
    
    // Find client
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      logDetailedError('CAS Upload', new Error('Client not found'), { clientId, advisorId });
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Encrypt password if provided
    let encryptedPassword = null;
    let ivHex = null;
    if (req.body.casPassword) {
      try {
        const { encrypted, iv } = encryptText(req.body.casPassword);
        encryptedPassword = encrypted;
        ivHex = iv;
      } catch (error) {
        logDetailedError('CAS Password Encryption', error, { clientId, advisorId });
        return res.status(500).json({ success: false, message: 'Failed to encrypt CAS password' });
      }
    }
    
    // Update client with CAS file information
    const casData = {
      casFile: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadDate: new Date(),
        fileSize: req.file.size,
        password: encryptedPassword,
        iv: ivHex
      },
      casStatus: 'uploaded',
      parseError: null,
      lastParsedAt: null
    };
    
    // Remove old CAS file if exists
    if (client.casData?.casFile?.filePath) {
      const oldFilePath = client.casData.casFile.filePath;
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }
    
    client.casData = casData;
    await client.save();
    
    FormLogger.logEvent('CAS_FILE_UPLOADED', { clientId });
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    res.json({
      success: true,
      message: 'CAS file uploaded successfully',
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadDate: casData.casFile.uploadDate,
        status: casData.casStatus
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDetailedError('CAS Upload', error, { clientId, advisorId, file: req.file?.originalname });
    logApi.error(method, url, error, advisorId);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Failed to upload CAS file', error: error.message });
  }
};

// KEEP ALL OTHER EXISTING CAS FUNCTIONS AS-IS
const parseClientCAS = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id: clientId } = req.params;
  
  try {
    FormLogger.logEvent('CAS_PARSE_REQUEST', { clientId });
    
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      logDetailedError('CAS Parse', new Error('Client not found'), { clientId, advisorId });
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    if (!client.casData?.casFile?.filePath) {
      logDetailedError('CAS Parse', new Error('No CAS file uploaded'), { clientId, advisorId });
      return res.status(400).json({ success: false, message: 'No CAS file uploaded. Please upload a CAS file first.' });
    }
    
    if (!fs.existsSync(client.casData.casFile.filePath)) {
      logDetailedError('CAS Parse', new Error('CAS file not found'), { clientId, advisorId });
      return res.status(400).json({ success: false, message: 'CAS file not found. Please upload the file again.' });
    }
    
    client.casData.casStatus = 'parsing';
    await client.save();
    
    try {
      // Decrypt password if exists
      let password = '';
      if (client.casData.casFile.password && client.casData.casFile.iv) {
        try {
          password = decryptText(client.casData.casFile.password, client.casData.casFile.iv);
          if (!password || password.trim() === '') {
            throw new Error('Decrypted password is empty');
          }
          FormLogger.logEvent('CAS_PASSWORD_DECRYPTED', { clientId });
        } catch (error) {
          logDetailedError('CAS Password Decryption', error, { clientId, advisorId });
          client.casData.casStatus = 'error';
          client.casData.parseError = 'Failed to decrypt CAS password. Please re-upload the CAS file.';
          await client.save();
          return res.status(400).json({ 
            success: false, 
            message: 'Failed to decrypt CAS password. Please re-upload the CAS file.' 
          });
        }
      } else {
        FormLogger.logEvent('CAS_NO_PASSWORD_PROVIDED', { clientId });
      }
      
      FormLogger.logEvent('CAS_PDF_PARSING_STARTED', { clientId });
      
      // Parse the CAS file
      const parser = new CASParser();
      let parsedData;
      try {
        parsedData = await parser.parseCASFile(client.casData.casFile.filePath, password);
      } catch (parseError) {
        if (parseError.message && parseError.message.toLowerCase().includes('password')) {
          logDetailedError('CAS PDF Password Error', parseError, { clientId, advisorId });
          client.casData.casStatus = 'error';
          client.casData.parseError = 'Incorrect CAS password. Please check and try again.';
          await client.save();
          return res.status(400).json({ success: false, message: 'Incorrect CAS password. Please check and try again.' });
        }
        logDetailedError('CAS PDF Parse Error', parseError, { clientId, advisorId });
        client.casData.casStatus = 'error';
        client.casData.parseError = parseError.message;
        await client.save();
        return res.status(400).json({ success: false, message: 'Failed to parse CAS file', error: parseError.message });
      }
      
      FormLogger.logEvent('CAS_DATA_EXTRACTED', { clientId });
      
      client.casData.parsedData = parsedData;
      client.casData.casStatus = 'parsed';
      client.casData.parseError = null;
      client.casData.lastParsedAt = new Date();
      
      // Update PAN if not set and available in CAS
      if (!client.panNumber && parsedData.investorInfo?.pan) {
        client.panNumber = parsedData.investorInfo.pan;
      }
      
      await client.save();
      
      FormLogger.logEvent('CAS_PARSED_DATA_SAVED', { clientId });
      
      const duration = Date.now() - startTime;
      logApi.response(method, url, 200, duration, advisorId);
      
      res.json({
        success: true,
        message: 'CAS file parsed successfully',
        data: {
          totalValue: parsedData.summary?.totalValue || 0,
          totalAccounts: parsedData.dematAccounts?.length || 0,
          totalMutualFunds: parsedData.mutualFunds?.length || 0,
          investorName: parsedData.investorInfo?.name || '',
          investorPAN: parsedData.investorInfo?.pan || '',
          casType: parsedData.metadata?.format || '',
          parsedAt: client.casData.lastParsedAt
        }
      });
    } catch (parseError) {
      logDetailedError('CAS Parse', parseError, { clientId, advisorId });
      client.casData.casStatus = 'error';
      client.casData.parseError = parseError.message;
      await client.save();
      res.status(400).json({ success: false, message: 'Failed to parse CAS file', error: parseError.message });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logDetailedError('CAS Parse', error, { clientId, advisorId });
    logApi.error(method, url, error, advisorId);
    res.status(500).json({ success: false, message: 'Server error during CAS parsing', error: error.message });
  }
};

// Get CAS data for a client
const getClientCASData = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id: clientId } = req.params;
  
  try {
    FormLogger.logEvent('CAS_DATA_REQUEST', { clientId });
    
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    if (!client.casData || client.casData.casStatus === 'not_uploaded') {
      return res.status(404).json({
        success: false,
        message: 'No CAS data available for this client'
      });
    }
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('CAS_DATA_SUCCESS', { clientId });
    
    res.json({
      success: true,
      data: {
        casFile: {
          fileName: client.casData.casFile?.fileName,
          fileSize: client.casData.casFile?.fileSize,
          uploadDate: client.casData.casFile?.uploadDate
        },
        status: client.casData.casStatus,
        parseError: client.casData.parseError,
        lastParsedAt: client.casData.lastParsedAt,
        parsedData: client.casData.parsedData
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('CAS_DATA_ERROR', error, { clientId });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve CAS data',
      error: error.message
    });
  }
};

// Delete CAS data for a client
const deleteClientCAS = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id: clientId } = req.params;
  
  try {
    FormLogger.logEvent('CAS_DELETE_REQUEST', { clientId });
    
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    if (!client.casData || client.casData.casStatus === 'not_uploaded') {
      return res.status(404).json({
        success: false,
        message: 'No CAS data to delete'
      });
    }
    
    // Delete the physical file
    if (client.casData.casFile?.filePath && fs.existsSync(client.casData.casFile.filePath)) {
      fs.unlinkSync(client.casData.casFile.filePath);
    }
    
    // Reset CAS data
    client.casData = {
      casFile: {},
      parsedData: {},
      casStatus: 'not_uploaded',
      parseError: null,
      lastParsedAt: null
    };
    
    await client.save();
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    FormLogger.logEvent('CAS_DELETE_SUCCESS', { clientId });
    
    res.json({
      success: true,
      message: 'CAS data deleted successfully'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('CAS_DELETE_ERROR', error, { clientId });
    logApi.error(method, url, error, advisorId);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete CAS data',
      error: error.message
    });
  }
};

// Get dashboard statistics - NEW
const getDashboardStats = async (req, res) => {
  const startTime = Date.now();
  const advisorId = req.advisor.id;
  
  try {
    FormLogger.logEvent('DASHBOARD_STATS_REQUEST', { advisorId });
    
    // Get basic counts
    const totalClients = await Client.countDocuments({ advisor: advisorId });
    const activeClients = await Client.countDocuments({ advisor: advisorId, status: 'active' });
    const onboardingClients = await Client.countDocuments({ advisor: advisorId, status: 'onboarding' });
    
    // Get clients with CAS data
    const clientsWithCAS = await Client.countDocuments({
      advisor: advisorId,
      'casData.casStatus': 'parsed'
    });
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentClients = await Client.countDocuments({
      advisor: advisorId,
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get pending invitations
    const pendingInvitations = await ClientInvitation.countDocuments({
      advisor: advisorId,
      status: { $in: ['sent', 'opened'] },
      expiresAt: { $gt: new Date() }
    });
    
    // Calculate completion rates
    const clients = await Client.find({ advisor: advisorId });
    const completionRates = clients.map(client => calculateProfileCompletion(client));
    const avgCompletionRate = completionRates.length > 0 
      ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
      : 0;
    
    // Calculate total portfolio value from CAS data
    const clientsWithPortfolio = await Client.find({
      advisor: advisorId,
      'casData.casStatus': 'parsed',
      'casData.parsedData.summary.total_value': { $exists: true }
    });
    
    const totalPortfolioValue = clientsWithPortfolio.reduce((sum, client) => {
      return sum + (client.casData?.parsedData?.summary?.total_value || 0);
    }, 0);
    
    // Get financial health distribution
    const clientsWithFinancials = clients.filter(client => client.annualIncome);
    const financialHealthStats = {
      healthyClients: 0,
      atRiskClients: 0,
      needsAttentionClients: 0
    };
    
    clientsWithFinancials.forEach(client => {
      const financials = client.calculatedFinancials;
      const savingsRate = financials.monthlyIncome > 0 
        ? (financials.monthlySavings / financials.monthlyIncome) * 100 
        : 0;
      
      if (savingsRate >= 20) {
        financialHealthStats.healthyClients++;
      } else if (savingsRate >= 10) {
        financialHealthStats.atRiskClients++;
      } else {
        financialHealthStats.needsAttentionClients++;
      }
    });
    
    const duration = Date.now() - startTime;
    
    FormLogger.logEvent('DASHBOARD_STATS_SUCCESS', {
      advisorId,
      totalClients,
      activeClients,
      clientsWithCAS,
      totalPortfolioValue,
      avgCompletionRate,
      duration: `${duration}ms`
    });
    
    res.json({
      success: true,
      data: {
        clientCounts: {
          total: totalClients,
          active: activeClients,
          onboarding: onboardingClients,
          withCAS: clientsWithCAS
        },
        recentActivity: {
          newClientsLast7Days: recentClients,
          pendingInvitations
        },
        completionMetrics: {
          averageCompletionRate: avgCompletionRate,
          fullyCompletedProfiles: completionRates.filter(rate => rate === 100).length
        },
        portfolioMetrics: {
          totalPortfolioValue,
          clientsWithPortfolio: clientsWithPortfolio.length,
          averagePortfolioValue: clientsWithPortfolio.length > 0 
            ? Math.round(totalPortfolioValue / clientsWithPortfolio.length) 
            : 0
        },
        financialHealth: financialHealthStats,
        systemHealth: {
          casUploadRate: totalClients > 0 ? Math.round((clientsWithCAS / totalClients) * 100) : 0,
          profileCompletionRate: avgCompletionRate
        }
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    FormLogger.logError('DASHBOARD_STATS_ERROR', error, { advisorId });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
};

// Get client financial summary - NEW
const getClientFinancialSummary = async (req, res) => {
  const advisorId = req.advisor.id;
  const { id: clientId } = req.params;
  
  try {
    FormLogger.logEvent('CLIENT_FINANCIAL_SUMMARY_REQUEST', { advisorId, clientId });
    
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Calculate comprehensive financial summary
    const calculatedFinancials = client.calculatedFinancials;
    const portfolioSummary = client.casSummary;
    const assetAllocation = client.getAssetAllocation();
    
    // Calculate goal progress
    const goalProgress = client.majorGoals?.map(goal => {
      const yearsToGoal = goal.targetYear - new Date().getFullYear();
      const monthsToGoal = yearsToGoal * 12;
      const requiredMonthlySavings = monthsToGoal > 0 ? goal.targetAmount / monthsToGoal : 0;
      
      return {
        ...goal,
        yearsToGoal,
        monthsToGoal,
        requiredMonthlySavings: Math.round(requiredMonthlySavings),
        feasibilityScore: calculatedFinancials.monthlySavings > 0 
          ? Math.min(100, Math.round((calculatedFinancials.monthlySavings / requiredMonthlySavings) * 100))
          : 0
      };
    }) || [];
    
    // Financial health score
    const healthMetrics = {
      savingsRate: calculatedFinancials.monthlyIncome > 0 
        ? Math.round((calculatedFinancials.monthlySavings / calculatedFinancials.monthlyIncome) * 100)
        : 0,
      debtToIncomeRatio: calculatedFinancials.monthlyIncome > 0
        ? Math.round((calculatedFinancials.totalLiabilities / (calculatedFinancials.monthlyIncome * 12)) * 100)
        : 0,
      emergencyFundMonths: calculatedFinancials.totalMonthlyExpenses > 0
        ? Math.round((client.assets?.cashBankSavings || 0) / calculatedFinancials.totalMonthlyExpenses)
        : 0
    };
    
    // Calculate overall financial health score
    let healthScore = 0;
    if (healthMetrics.savingsRate >= 20) healthScore += 40;
    else if (healthMetrics.savingsRate >= 10) healthScore += 25;
    else if (healthMetrics.savingsRate >= 5) healthScore += 15;
    
    if (healthMetrics.debtToIncomeRatio <= 30) healthScore += 30;
    else if (healthMetrics.debtToIncomeRatio <= 50) healthScore += 20;
    else if (healthMetrics.debtToIncomeRatio <= 70) healthScore += 10;
    
    if (healthMetrics.emergencyFundMonths >= 6) healthScore += 30;
    else if (healthMetrics.emergencyFundMonths >= 3) healthScore += 20;
    else if (healthMetrics.emergencyFundMonths >= 1) healthScore += 10;
    
    FormLogger.logEvent('CLIENT_FINANCIAL_SUMMARY_SUCCESS', {
      advisorId,
      clientId,
      healthScore,
      savingsRate: healthMetrics.savingsRate,
      portfolioValue: portfolioSummary?.totalValue || 0
    });
    
    res.json({
      success: true,
      data: {
        basicInfo: {
          clientId: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          completionPercentage: calculateProfileCompletion(client)
        },
        calculatedFinancials,
        portfolioSummary,
        assetAllocation,
        goalProgress,
        healthMetrics: {
          ...healthMetrics,
          overallHealthScore: healthScore,
          healthCategory: healthScore >= 80 ? 'Excellent' :
                          healthScore >= 60 ? 'Good' :
                          healthScore >= 40 ? 'Fair' : 'Needs Improvement'
        },
        recommendations: generateFinancialRecommendations(client, calculatedFinancials, healthMetrics)
      }
    });
    
  } catch (error) {
    FormLogger.logError('CLIENT_FINANCIAL_SUMMARY_ERROR', error, { advisorId, clientId });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve financial summary',
      error: error.message
    });
  }
};

// Generate financial recommendations - NEW HELPER FUNCTION
const generateFinancialRecommendations = (client, financials, healthMetrics) => {
  const recommendations = [];
  
  // Savings rate recommendations
  if (healthMetrics.savingsRate < 10) {
    recommendations.push({
      type: 'critical',
      category: 'savings',
      title: 'Increase Savings Rate',
      description: `Current savings rate is ${healthMetrics.savingsRate}%. Aim for at least 10-20% of income.`,
      action: 'Review monthly expenses and identify areas to cut back.'
    });
  } else if (healthMetrics.savingsRate < 20) {
    recommendations.push({
      type: 'improvement',
      category: 'savings',
      title: 'Optimize Savings Rate',
      description: `Good start with ${healthMetrics.savingsRate}% savings rate. Target 20% for financial security.`,
      action: 'Consider automating savings and exploring higher-yield savings options.'
    });
  }
  
  // Emergency fund recommendations
  if (healthMetrics.emergencyFundMonths < 3) {
    recommendations.push({
      type: 'critical',
      category: 'emergency_fund',
      title: 'Build Emergency Fund',
      description: `Current emergency fund covers ${healthMetrics.emergencyFundMonths} months. Target 3-6 months.`,
      action: 'Prioritize building emergency fund before other investments.'
    });
  }
  
  // Debt recommendations
  if (healthMetrics.debtToIncomeRatio > 50) {
    recommendations.push({
      type: 'critical',
      category: 'debt',
      title: 'Reduce Debt Burden',
      description: `Debt-to-income ratio is ${healthMetrics.debtToIncomeRatio}%. This is high and needs attention.`,
      action: 'Focus on debt repayment strategy, consider debt consolidation.'
    });
  }
  
  // Investment recommendations
  if (client.investmentExperience === 'Beginner' && financials.monthlySavings > 0) {
    recommendations.push({
      type: 'opportunity',
      category: 'investment',
      title: 'Start Investment Journey',
      description: 'With positive monthly savings, consider starting systematic investments.',
      action: 'Begin with SIPs in diversified mutual funds based on risk tolerance.'
    });
  }
  
  // Goal-specific recommendations
  if (client.majorGoals && client.majorGoals.length > 0) {
    const highPriorityGoals = client.majorGoals.filter(goal => goal.priority === 'High' || goal.priority === 'Critical');
    if (highPriorityGoals.length > 0) {
      recommendations.push({
        type: 'planning',
        category: 'goals',
        title: 'Prioritize High-Priority Goals',
        description: `You have ${highPriorityGoals.length} high-priority goals requiring focused planning.`,
        action: 'Create dedicated investment strategies for each high-priority goal.'
      });
    }
  }
  
  return recommendations;
};

module.exports = {
  // Enhanced client management
  getClients,
  getClientById,
  sendClientInvitation,
  getClientInvitations,
  updateClient,
  deleteClient,
  
  // Enhanced onboarding
  getClientOnboardingForm,
  submitClientOnboardingForm,
  saveClientFormDraft,
  getClientFormDraft,
  
  // Enhanced CAS functionality (keeping existing logic)
  uploadClientCAS,
  parseClientCAS,
  getClientCASData,
  deleteClientCAS,
  
  // New dashboard and analytics
  getDashboardStats,
  getClientFinancialSummary
};