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

// Enhanced logging utilities for CAS tracking
const CASLogger = {
  logEvent: (event, data = {}) => {
    const timestamp = new Date().toISOString();
    const logData = {
      event,
      timestamp,
      ...data
    };
    logger.info(`[CAS_TRACKER] ${event}`, logData);
    console.log('\n' + '='.repeat(80));
    console.log(`🔄 CAS EVENT: ${event}`);
    console.log(`⏰ Time: ${timestamp}`);
    console.log('📊 Data:');
    console.log(JSON.stringify(logData, null, 2));
    console.log('='.repeat(80));
  },
  logClientEvent: (event, clientId, data = {}) => {
    CASLogger.logEvent(event, { clientId, ...data });
  },
  logOnboardingEvent: (event, token, data = {}) => {
    CASLogger.logEvent(event, { onboardingToken: token, ...data });
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
    logger.error(`[CAS_TRACKER_ERROR] ${event}`, errorData);
    console.log('\n' + '❌'.repeat(40));
    console.log(`🚨 CAS ERROR: ${event}`);
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
    secure: false, // true for 465, false for other ports
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
    subject: `Complete Your Financial Profile - ${advisorFirm || 'Richie AI'}`,
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Richie AI</h1>
            <p>Your Financial Advisory Platform</p>
          </div>
          
          <div class="content">
            <h2>Hello ${clientName || 'Valued Client'},</h2>
            
            <p>You have been invited by <strong>${advisorName}</strong> ${advisorFirm ? `from <strong>${advisorFirm}</strong>` : ''} to complete your financial profile on our secure platform.</p>
            
            <p>To get started with your personalized financial planning journey, please click the button below to complete your profile:</p>
            
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">Complete Your Profile</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This invitation link will expire in ${expiryHours} hours for security reasons. Please complete your profile before then.
            </div>
            
            <p>What you'll need to complete your profile:</p>
            <ul>
              <li>Personal information (name, contact details, address)</li>
              <li>Financial information (income, net worth, investment goals)</li>
              <li>KYC documents (PAN, Aadhar, address proof)</li>
              <li>Bank account details</li>
            </ul>
            
            <p>Your information is completely secure and will only be used to provide you with personalized financial advice.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact your advisor or our support team.</p>
            
            <p>Best regards,<br>
            The Richie AI Team</p>
            
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

// Get all clients for an advisor
const getClients = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  
  try {
    logger.info(`Client list request for advisor: ${advisorId}`);
    
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
    
    // Execute query
    const clients = await Client.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('advisor', 'firstName lastName firmName');
    
    const totalClients = await Client.countDocuments(query);
    const totalPages = Math.ceil(totalClients / limit);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    logger.info(`Client list retrieved successfully for advisor: ${advisorId} - ${clients.length} clients found`);
    
    res.json({
      success: true,
      data: {
        clients,
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
    logApi.error(method, url, error, advisorId);
    
    logger.error(`Client list retrieval failed for advisor: ${advisorId} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve clients',
      error: error.message
    });
  }
};

// Get client by ID
const getClientById = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id } = req.params;
  
  try {
    logger.info(`Client details request for advisor: ${advisorId}, client: ${id}`);
    
    const client = await Client.findOne({ _id: id, advisor: advisorId })
      .populate('advisor', 'firstName lastName firmName');
    
    if (!client) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration, advisorId);
      
      logger.warn(`Client not found for advisor: ${advisorId}, client: ${id}`);
      
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    logger.info(`Client details retrieved successfully for advisor: ${advisorId}, client: ${id}`);
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error, advisorId);
    
    logger.error(`Client details retrieval failed for advisor: ${advisorId}, client: ${id} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client details',
      error: error.message
    });
  }
};

// Send client invitation
const sendClientInvitation = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  try {
    const { clientEmail, clientFirstName, clientLastName, notes } = req.body;
    
    // Validate required fields
    if (!clientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Client email is required'
      });
    }
    
    logger.info(`Client invitation request for advisor: ${advisorId}, client email: ${clientEmail}`);
    
    // Check if client already exists
    const existingClient = await Client.findOne({ 
      email: clientEmail.toLowerCase(), 
      advisor: advisorId 
    });
    
    if (existingClient) {
      logger.warn(`Client invitation failed - client already exists: ${clientEmail} for advisor: ${advisorId}`);
      return res.status(400).json({
        success: false,
        message: 'Client already exists in your account'
      });
    }
    
    // Check if maximum invitations limit reached (5 per client)
    const invitationCount = await ClientInvitation.countDocuments({
      clientEmail: clientEmail.toLowerCase(),
      advisor: advisorId
    });
    
    if (invitationCount >= 5) {
      logger.warn(`Client invitation failed - maximum invitations reached: ${clientEmail} for advisor: ${advisorId} (${invitationCount}/5)`);
      return res.status(400).json({
        success: false,
        message: `Maximum of 5 invitations reached for this client. Current count: ${invitationCount}/5`
      });
    }
    
    // Get advisor details for email
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
    
    // Send email
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
    
    // Get updated invitation count for logging
    const finalInvitationCount = invitationCount + 1;
    logger.info(`Client invitation sent successfully for advisor: ${advisorId}, client: ${clientEmail}, invitation: ${invitation._id} - Count: ${finalInvitationCount}/5`);
    
    res.json({
      success: true,
      message: `Client invitation sent successfully! (${finalInvitationCount}/5 invitations used)`,
      data: {
        invitationId: invitation._id,
        clientEmail: clientEmail,
        expiresAt: invitation.expiresAt,
        invitationUrl: invitationUrl,
        invitationCount: finalInvitationCount,
        maxInvitations: 5
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error, advisorId);
    
    logger.error(`Client invitation failed for advisor: ${advisorId} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send client invitation',
      error: error.message
    });
  }
};

// Get client invitations
const getClientInvitations = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  
  try {
    logger.info(`Client invitations request for advisor: ${advisorId}`);
    
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
    
    logger.info(`Client invitations retrieved successfully for advisor: ${advisorId} - ${invitations.length} invitations found`);
    
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
    logApi.error(method, url, error, advisorId);
    
    logger.error(`Client invitations retrieval failed for advisor: ${advisorId} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client invitations',
      error: error.message
    });
  }
};

// Update client information
const updateClient = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id } = req.params;
  
  try {
    logger.info(`Client update request for advisor: ${advisorId}, client: ${id}`);
    
    const client = await Client.findOne({ _id: id, advisor: advisorId });
    
    if (!client) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration, advisorId);
      
      logger.warn(`Client not found for update - advisor: ${advisorId}, client: ${id}`);
      
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Update client data
    const updateData = { ...req.body };
    delete updateData.advisor; // Prevent advisor change
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('advisor', 'firstName lastName firmName');
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    logger.info(`Client updated successfully for advisor: ${advisorId}, client: ${id}`);
    
    res.json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error, advisorId);
    
    logger.error(`Client update failed for advisor: ${advisorId}, client: ${id} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message
    });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id } = req.params;
  
  try {
    logger.info(`Client deletion request for advisor: ${advisorId}, client: ${id}`);
    
    const client = await Client.findOne({ _id: id, advisor: advisorId });
    
    if (!client) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration, advisorId);
      
      logger.warn(`Client not found for deletion - advisor: ${advisorId}, client: ${id}`);
      
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    await Client.findByIdAndDelete(id);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration, advisorId);
    
    logger.info(`Client deleted successfully for advisor: ${advisorId}, client: ${id}`);
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error, advisorId);
    
    logger.error(`Client deletion failed for advisor: ${advisorId}, client: ${id} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error.message
    });
  }
};

// Public endpoint - Get client onboarding form by token
const getClientOnboardingForm = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { token } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  try {
    logger.info(`Client onboarding form request for token: ${token}`);
    
    const invitation = await ClientInvitation.findOne({ token })
      .populate('advisor', 'firstName lastName firmName email');
    
    if (!invitation) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration);
      
      logger.warn(`Invalid invitation token: ${token}`);
      
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link'
      });
    }
    
    if (invitation.isExpired) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      logger.warn(`Expired invitation token: ${token}`);
      
      return res.status(410).json({
        success: false,
        message: 'Invitation link has expired'
      });
    }
    
    if (invitation.status === 'completed') {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      logger.warn(`Already completed invitation token: ${token}`);
      
      return res.status(410).json({
        success: false,
        message: 'This invitation has already been completed'
      });
    }
    
    // Mark invitation as opened
    await invitation.markAsOpened(clientIp, userAgent);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`Client onboarding form accessed successfully for token: ${token}`);
    
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
        advisor: invitation.advisor
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`Client onboarding form access failed for token: ${token} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to access onboarding form',
      error: error.message
    });
  }
};

// Public endpoint - Submit client onboarding form
const submitClientOnboardingForm = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { token } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  try {
    logger.info(`Client onboarding form submission for token: ${token}`);
    
    const invitation = await ClientInvitation.findOne({ token });
    
    if (!invitation) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 404, duration);
      
      logger.warn(`Invalid invitation token for submission: ${token}`);
      
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link'
      });
    }
    
    if (invitation.isExpired) {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      logger.warn(`Expired invitation token for submission: ${token}`);
      
      return res.status(410).json({
        success: false,
        message: 'Invitation link has expired'
      });
    }
    
    if (invitation.status === 'completed') {
      const duration = Date.now() - startTime;
      logApi.response(method, url, 410, duration);
      
      logger.warn(`Already completed invitation token for submission: ${token}`);
      
      return res.status(410).json({
        success: false,
        message: 'This invitation has already been completed'
      });
    }
    
    // Create client record
    const clientData = {
      ...req.body,
      email: invitation.clientEmail,
      advisor: invitation.advisor,
      status: 'onboarding'
    };
    
    // Integrate CAS data if available
    const clientDataWithCAS = await OnboardingCASController.completeOnboardingWithCAS(clientData, invitation);
    
    const client = new Client(clientDataWithCAS);
    await client.save();
    
    // Mark invitation as completed
    await invitation.markAsCompleted(client._id);
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`Client onboarding completed successfully for token: ${token}, client: ${client._id}`);
    
    res.json({
      success: true,
      message: 'Client onboarding completed successfully',
      data: {
        clientId: client._id,
        status: client.status
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`Client onboarding form submission failed for token: ${token} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: error.message
    });
  }
};

// CAS Upload function
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
      
      // Find the invitation to get client info
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
      
      // Find or create client record
      let client = await Client.findOne({ 
        email: invitation.clientEmail, 
        advisor: advisorId 
      });
      
      if (!client) {
        // Create a basic client record for CAS upload
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
    CASLogger.logClientEvent('CAS_UPLOAD_RECEIVED', clientId, { fileName: req.file.originalname });
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
    CASLogger.logClientEvent('CAS_FILE_UPLOADED', clientId);
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

// Parse CAS file
const parseClientCAS = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const advisorId = req.advisor.id;
  const { id: clientId } = req.params;
  try {
    CASLogger.logClientEvent('CAS_PARSE_REQUEST', clientId);
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
          // Enhanced password validation
          if (!password || password.trim() === '') {
            throw new Error('Decrypted password is empty');
          }
          
          CASLogger.logClientEvent('CAS_PASSWORD_DECRYPTED', clientId, {
            passwordLength: password.length,
            hasPassword: true
          });
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
        CASLogger.logClientEvent('CAS_NO_PASSWORD_PROVIDED', clientId, {
          hasPassword: false
        });
      }
      CASLogger.logClientEvent('CAS_PDF_PARSING_STARTED', clientId);
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
      // Log extracted data (truncate if too large)
      CASLogger.logClientEvent('CAS_DATA_EXTRACTED', clientId, { parsedData: JSON.stringify(parsedData).slice(0, 2000) });
      client.casData.parsedData = parsedData;
      client.casData.casStatus = 'parsed';
      client.casData.parseError = null;
      client.casData.lastParsedAt = new Date();
      // Update PAN if not set and available in CAS
      if (!client.panNumber && parsedData.investorInfo?.pan) {
        client.panNumber = parsedData.investorInfo.pan;
      }
      await client.save();
      CASLogger.logClientEvent('CAS_PARSED_DATA_SAVED', clientId);
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
    logger.info(`CAS data request for client: ${clientId}`);
    
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
    
    logger.info(`CAS data retrieved successfully for client: ${clientId}`);
    
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
    logApi.error(method, url, error, advisorId);
    
    logger.error(`CAS data retrieval failed for client: ${clientId} - ${error.message}`);
    
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
    logger.info(`CAS deletion request for client: ${clientId}`);
    
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
    
    logger.info(`CAS data deleted successfully for client: ${clientId}`);
    
    res.json({
      success: true,
      message: 'CAS data deleted successfully'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error, advisorId);
    
    logger.error(`CAS deletion failed for client: ${clientId} - ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete CAS data',
      error: error.message
    });
  }
};

module.exports = {
  getClients,
  getClientById,
  sendClientInvitation,
  getClientInvitations,
  updateClient,
  deleteClient,
  getClientOnboardingForm,
  submitClientOnboardingForm,
  // Add new CAS-related exports
  uploadClientCAS,
  parseClientCAS,
  getClientCASData,
  deleteClientCAS
};