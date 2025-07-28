const LOE = require('../models/LOE');
const Meeting = require('../models/Meeting');
const Client = require('../models/Client');
const Advisor = require('../models/Advisor');
const { logger } = require('../utils/logger');
const { createEmailTransporter, sendEmail, verifyEmailTransporter } = require('../utils/emailService');
const path = require('path');
const fs = require('fs');

// Generate LOE content based on advisor preferences and meeting context
const generateLOEContent = (advisor, client, meeting) => {
  return {
    services: {
      financialPlanning: true,
      investmentAdvisory: true,
      brokerageServices: true,
      riskManagement: true
    },
    fees: {
      planningFee: '$5,000',
      advisoryFeePercent: '1%',
      advisoryFeeThreshold: '$1,000,000',
      advisoryFeeReducedPercent: '0.75%'
    },
    focusAreas: [
      'Cash flow planning and emergency fund analysis',
      'Investment portfolio review and management',
      'Retirement planning and goal analysis',
      'Estate and wealth transfer planning',
      'Risk management and insurance assessment'
    ]
  };
};

// Create and send LOE
exports.createAndSendLOE = async (req, res) => {
  try {
    const { meetingId, customNotes } = req.body;
    const advisorId = req.advisor.id;

    logger.info('📄 [LOE] Creating LOE for meeting', { meetingId, advisorId });

    // Get meeting details with client info
    const meeting = await Meeting.findById(meetingId)
      .populate('clientId', 'firstName lastName email phone');
    
    if (!meeting) {
      logger.error('❌ [LOE] Meeting not found', { meetingId });
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    logger.info('📄 [LOE] Meeting found', { 
      meetingId,
      hasClient: !!meeting.clientId,
      isOnboarding: meeting.isOnboardingMeeting,
      invitationId: meeting.invitationId
    });

    // For onboarding meetings, we need to get client from invitation
    let client = meeting.clientId;
    if (!client && meeting.isOnboardingMeeting && meeting.invitationId) {
      logger.info('📄 [LOE] Fetching client from invitation for onboarding meeting', { 
        invitationId: meeting.invitationId 
      });
      
      const ClientInvitation = require('../models/ClientInvitation');
      const invitation = await ClientInvitation.findById(meeting.invitationId);
      if (invitation) {
        // Create a temporary client object for LOE
        client = {
          _id: invitation._id,
          firstName: invitation.clientFirstName,
          lastName: invitation.clientLastName,
          email: invitation.clientEmail
        };
        
        logger.info('✅ [LOE] Client data retrieved from invitation', { 
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email
        });
      } else {
        logger.error('❌ [LOE] Invitation not found', { invitationId: meeting.invitationId });
      }
    }

    if (!client) {
      logger.error('❌ [LOE] Client information not found', { 
        meetingId,
        hasClientId: !!meeting.clientId,
        isOnboarding: meeting.isOnboardingMeeting,
        hasInvitationId: !!meeting.invitationId
      });
      
      return res.status(400).json({
        success: false,
        message: 'Client information not found for this meeting',
        debug: {
          meetingId,
          hasClientId: !!meeting.clientId,
          isOnboardingMeeting: meeting.isOnboardingMeeting,
          hasInvitationId: !!meeting.invitationId
        }
      });
    }

    logger.info('✅ [LOE] Client information available', { 
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      source: meeting.clientId ? 'clientId' : 'invitation'
    });

    // Check if LOE already exists for this meeting
    const existingLOE = await LOE.findOne({ meetingId });
    if (existingLOE) {
      // If LOE is already signed, don't allow recreation
      if (existingLOE.status === 'signed') {
        return res.status(400).json({
          success: false,
          message: 'This meeting already has a signed Letter of Engagement',
          data: {
            loeId: existingLOE._id,
            status: existingLOE.status,
            signedAt: existingLOE.signedAt
          }
        });
      }

      // For draft/sent/viewed/expired LOEs, update with new notes and resend
      logger.info('📄 [LOE] Updating existing LOE with new notes', { 
        existingLOEId: existingLOE._id,
        currentStatus: existingLOE.status 
      });

      // Update content with custom notes if provided
      if (customNotes) {
        existingLOE.content.customNotes = customNotes;
        await existingLOE.save();
      }

      // Get advisor details for resending
      const advisor = await Advisor.findById(advisorId);

      // Resend the LOE email
      const emailResult = await sendLOEEmail(existingLOE, advisor, client);
      
      if (emailResult.success) {
        // Update status back to 'sent' and update sent timestamp
        existingLOE.status = 'sent';
        existingLOE.sentAt = new Date();
        await existingLOE.save();
        
        logger.info('✅ [LOE] LOE status updated after successful resend', {
          loeId: existingLOE._id,
          messageId: emailResult.messageId
        });
      } else {
        logger.error('❌ [LOE] Failed to resend LOE email', {
          loeId: existingLOE._id,
          error: emailResult.error
        });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send Letter of Engagement email',
          error: emailResult.error
        });
      }

      logger.info('✅ [LOE] Existing LOE updated and resent', { 
        loeId: existingLOE._id,
        clientEmail: client.email 
      });

      return res.json({
        success: true,
        message: 'Letter of Engagement updated and resent successfully',
        data: {
          loeId: existingLOE._id,
          status: existingLOE.status,
          clientAccessUrl: existingLOE.clientAccessUrl,
          wasResent: true
        }
      });
    }

    // Get advisor details
    const advisor = await Advisor.findById(advisorId);

    // Create LOE
    const loeContent = generateLOEContent(advisor, client, meeting);
    if (customNotes) {
      loeContent.customNotes = customNotes;
    }

    const loe = new LOE({
      advisorId,
      clientId: client._id,
      meetingId,
      content: loeContent
    });

    await loe.save();

    // Send LOE email
    const emailResult = await sendLOEEmail(loe, advisor, client);
    
    if (emailResult.success) {
      await loe.markAsSent();
      
      logger.info('✅ [LOE] New LOE marked as sent', {
        loeId: loe._id,
        messageId: emailResult.messageId
      });
    } else {
      logger.error('❌ [LOE] Failed to send new LOE email', {
        loeId: loe._id,
        error: emailResult.error
      });
      
      // Don't save the LOE if email failed, or mark it as draft
      loe.status = 'draft';
      await loe.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send Letter of Engagement email',
        error: emailResult.error
      });
    }

    logger.info('✅ [LOE] LOE created and sent successfully', { 
      loeId: loe._id,
      clientEmail: client.email 
    });

    res.json({
      success: true,
      message: 'Letter of Engagement sent successfully',
      data: {
        loeId: loe._id,
        status: loe.status,
        clientAccessUrl: loe.clientAccessUrl
      }
    });

  } catch (error) {
    logger.error('❌ [LOE] Error creating LOE', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Letter of Engagement',
      error: error.message
    });
  }
};

// Get LOE by access token (for client viewing/signing)
exports.getLOEByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const loe = await LOE.findByToken(token);
    
    if (!loe) {
      return res.status(404).json({
        success: false,
        message: 'Letter of Engagement not found or expired'
      });
    }

    // Mark as viewed if not already
    if (loe.status === 'sent') {
      await loe.markAsViewed(clientIp, userAgent);
    }

    // Prepare LOE data for display
    const loeData = {
      id: loe._id,
      status: loe.status,
      advisor: {
        name: `${loe.advisorId.firstName} ${loe.advisorId.lastName}`,
        firmName: loe.advisorId.firmName || 'Richie AI Financial',
        email: loe.advisorId.email,
        phone: loe.advisorId.phone || '555-0123'
      },
      client: {
        name: `${loe.clientId.firstName} ${loe.clientId.lastName}`,
        email: loe.clientId.email
      },
      content: loe.content,
      createdAt: loe.createdAt,
      expiresAt: loe.expiresAt,
      isSigned: loe.status === 'signed',
      signature: loe.status === 'signed' ? loe.signatures.client : null
    };

    res.json({
      success: true,
      data: loeData
    });

  } catch (error) {
    logger.error('❌ [LOE] Error retrieving LOE', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Letter of Engagement'
    });
  }
};

// Save client signature
exports.saveLOESignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { signature } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Signature is required'
      });
    }

    const loe = await LOE.findByToken(token);
    
    if (!loe) {
      return res.status(404).json({
        success: false,
        message: 'Letter of Engagement not found or expired'
      });
    }

    if (loe.status === 'signed') {
      return res.status(400).json({
        success: false,
        message: 'This Letter of Engagement has already been signed'
      });
    }

    // Save signature
    await loe.saveSignature(signature, clientIp, userAgent);

    // Generate PDF (we'll implement this later)
    // const pdfUrl = await generateSignedLOEPDF(loe);
    // loe.signedPdfUrl = pdfUrl;
    // await loe.save();

    // Send confirmation emails
    await sendSignedConfirmationEmails(loe);

    logger.info('✅ [LOE] LOE signed successfully', { 
      loeId: loe._id,
      clientEmail: loe.clientId.email 
    });

    res.json({
      success: true,
      message: 'Letter of Engagement signed successfully',
      data: {
        status: 'signed',
        signedAt: loe.signedAt
      }
    });

  } catch (error) {
    logger.error('❌ [LOE] Error saving signature', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save signature'
    });
  }
};

// Get LOEs for advisor
exports.getAdvisorLOEs = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { advisorId };
    if (status) {
      query.status = status;
    }

    const loes = await LOE.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('meetingId', 'scheduledAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // For LOEs created during onboarding, clientId might be an invitation ID
    // We need to fetch the actual client data for those
    const processedLOEs = await Promise.all(loes.map(async (loe) => {
      const loeObj = loe.toObject();
      
      // If clientId wasn't populated (null), it might be an invitation ID
      if (!loeObj.clientId && loe.clientId) {
        try {
          const ClientInvitation = require('../models/ClientInvitation');
          const invitation = await ClientInvitation.findById(loe.clientId)
            .populate('clientData', 'firstName lastName email');
          
          if (invitation && invitation.clientData) {
            // Use the actual client data from the invitation
            loeObj.clientId = invitation.clientData;
            logger.info('📄 [LOE] Resolved client from invitation', {
              loeId: loe._id,
              invitationId: loe.clientId,
              clientId: invitation.clientData._id
            });
          } else {
            // If no client data, use invitation data
            loeObj.clientId = {
              _id: loe.clientId,
              firstName: invitation?.clientFirstName || 'Unknown',
              lastName: invitation?.clientLastName || 'Client',
              email: invitation?.clientEmail || ''
            };
          }
        } catch (error) {
          logger.warn('⚠️ [LOE] Could not resolve client from invitation', {
            loeId: loe._id,
            clientId: loe.clientId,
            error: error.message
          });
        }
      }
      
      return loeObj;
    }));

    const total = await LOE.countDocuments(query);

    res.json({
      success: true,
      data: {
        loes: processedLOEs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('❌ [LOE] Error fetching advisor LOEs', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Letters of Engagement'
    });
  }
};

// Get LOE status for a meeting
exports.getMeetingLOEStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const loe = await LOE.findOne({ meetingId })
      .select('status sentAt signedAt');
    
    res.json({
      success: true,
      data: {
        hasLOE: !!loe,
        status: loe?.status,
        sentAt: loe?.sentAt,
        signedAt: loe?.signedAt
      }
    });

  } catch (error) {
    logger.error('❌ [LOE] Error checking LOE status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check LOE status'
    });
  }
};

// Email helper functions
async function sendLOEEmail(loe, advisor, client) {
  try {
    logger.info('📧 [LOE] Starting email send process', {
      clientEmail: client.email,
      loeId: loe._id,
      advisorName: `${advisor.firstName} ${advisor.lastName}`
    });

    // Create and verify email transporter
    const transporter = createEmailTransporter();
    
    // Verify email configuration before sending
    const isVerified = await verifyEmailTransporter(transporter);
    if (!isVerified) {
      logger.error('❌ [LOE] Email transporter verification failed');
      return {
        success: false,
        error: 'Email service configuration error'
      };
    }

    // Generate email template
    const emailTemplate = getLOEEmailTemplate(
      advisor,
      client,
      loe.clientAccessUrl,
      loe.expiresAt
    );
    
    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    // Use the enhanced sendEmail function
    const result = await sendEmail(transporter, mailOptions);
    
    if (result.success) {
      logger.info('✅ [LOE] LOE email sent successfully', {
        messageId: result.messageId,
        clientEmail: client.email,
        loeId: loe._id
      });
      return { success: true, messageId: result.messageId };
    } else {
      logger.error('❌ [LOE] Email send failed', {
        error: result.error,
        clientEmail: client.email,
        loeId: loe._id
      });
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    logger.error('❌ [LOE] Failed to send LOE email', {
      error: error.message,
      stack: error.stack,
      clientEmail: client.email,
      loeId: loe._id
    });
    return { success: false, error: error.message };
  }
}

async function sendSignedConfirmationEmails(loe) {
  try {
    logger.info('📧 [LOE] Sending signature confirmation emails', { loeId: loe._id });
    
    const transporter = createEmailTransporter();
    
    // Verify email configuration
    const isVerified = await verifyEmailTransporter(transporter);
    if (!isVerified) {
      logger.error('❌ [LOE] Email transporter verification failed for confirmation emails');
      return { success: false, error: 'Email service configuration error' };
    }
    
    // Reload with populated fields
    await loe.populate('advisorId clientId');
    
    // Send to client
    const clientEmailTemplate = getSignedConfirmationTemplate(
      loe.clientId,
      loe.advisorId,
      true
    );
    
    const clientEmailResult = await sendEmail(transporter, {
      from: process.env.EMAIL_USER,
      to: loe.clientId.email,
      subject: clientEmailTemplate.subject,
      html: clientEmailTemplate.html
    });
    
    if (!clientEmailResult.success) {
      logger.error('❌ [LOE] Failed to send client confirmation email', {
        error: clientEmailResult.error,
        clientEmail: loe.clientId.email
      });
    }
    
    // Send to advisor
    const advisorEmailTemplate = getSignedConfirmationTemplate(
      loe.clientId,
      loe.advisorId,
      false
    );
    
    const advisorEmailResult = await sendEmail(transporter, {
      from: process.env.EMAIL_USER,
      to: loe.advisorId.email,
      subject: advisorEmailTemplate.subject,
      html: advisorEmailTemplate.html
    });
    
    if (!advisorEmailResult.success) {
      logger.error('❌ [LOE] Failed to send advisor confirmation email', {
        error: advisorEmailResult.error,
        advisorEmail: loe.advisorId.email
      });
    }
    
    // Return success if at least one email was sent
    const success = clientEmailResult.success || advisorEmailResult.success;
    
    if (success) {
      logger.info('✅ [LOE] Confirmation emails sent', {
        clientSent: clientEmailResult.success,
        advisorSent: advisorEmailResult.success
      });
    }
    
    return { 
      success,
      clientEmailSent: clientEmailResult.success,
      advisorEmailSent: advisorEmailResult.success
    };
    
  } catch (error) {
    logger.error('❌ [LOE] Failed to send confirmation emails', {
      error: error.message,
      stack: error.stack,
      loeId: loe._id
    });
    return { success: false, error: error.message };
  }
}

// Email templates
function getLOEEmailTemplate(advisor, client, signUrl, expiresAt) {
  const advisorName = `${advisor.firstName} ${advisor.lastName}`;
  const clientName = `${client.firstName} ${client.lastName}`;
  const firmName = advisor.firmName || 'Richie AI Financial';
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  return {
    subject: `Letter of Engagement - Please Review and Sign`,
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
            <h1>Letter of Engagement</h1>
            <p>${firmName}</p>
          </div>
          
          <div class="content">
            <h2>Dear ${clientName},</h2>
            
            <p>Following our recent meeting, I'm pleased to send you our Letter of Engagement which outlines the services we'll provide and our fee structure.</p>
            
            <p>Please take a moment to review the engagement letter and provide your electronic signature to confirm our working relationship.</p>
            
            <div style="text-align: center;">
              <a href="${signUrl}" class="button">Review and Sign Letter of Engagement</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This secure link will expire on ${expiryDate}. Please review and sign the letter before this date.
            </div>
            
            <p>The letter includes:</p>
            <ul>
              <li>Services we will provide (financial planning, investment advisory, etc.)</li>
              <li>Our fee structure and billing methods</li>
              <li>Your and our responsibilities</li>
              <li>Important disclosures and conflicts of interest</li>
            </ul>
            
            <p>If you have any questions about the engagement letter, please don't hesitate to contact me.</p>
            
            <p>Best regards,<br>
            <strong>${advisorName}</strong><br>
            ${advisor.email}<br>
            ${advisor.phone || ''}</p>
          </div>
          
          <div class="footer">
            <p>This email contains confidential information. If you received this in error, please delete it.</p>
            <p>© 2025 ${firmName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

function getSignedConfirmationTemplate(client, advisor, isForClient) {
  const clientName = `${client.firstName} ${client.lastName}`;
  const advisorName = `${advisor.firstName} ${advisor.lastName}`;
  const firmName = advisor.firmName || 'Richie AI Financial';

  if (isForClient) {
    return {
      subject: 'Letter of Engagement - Signed Successfully',
      html: `
        <p>Dear ${clientName},</p>
        <p>Thank you for signing our Letter of Engagement. This confirms our advisory relationship and the services we'll provide.</p>
        <p>A copy of the signed letter will be sent to you shortly for your records.</p>
        <p>We look forward to working with you!</p>
        <p>Best regards,<br>${advisorName}<br>${firmName}</p>
      `
    };
  } else {
    return {
      subject: `LOE Signed - ${clientName}`,
      html: `
        <p>Dear ${advisorName},</p>
        <p>Great news! ${clientName} has signed the Letter of Engagement.</p>
        <p>Signed at: ${new Date().toLocaleString()}</p>
        <p>You can now proceed with providing advisory services to this client.</p>
        <p>Best regards,<br>Richie AI System</p>
      `
    };
  }
}