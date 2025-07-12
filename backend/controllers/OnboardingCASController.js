const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ClientInvitation = require('../models/ClientInvitation');
const Client = require('../models/Client');
const CASParser = require('../services/cas-parser');
const { casEventLogger } = require('../utils/casEventLogger');
const { logger } = require('../utils/logger');
const { createRequiredDirectories } = require('../utils/createDirectories');

// Ensure upload directories exist
createRequiredDirectories();

// Configure multer for CAS file uploads with enhanced settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/cas');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `onboarding_${timestamp}_${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  console.log(`📁 File upload attempt:`, {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Only PDF files are allowed');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

class OnboardingCASController {
  /**
   * Upload CAS file during onboarding with enhanced tracking
   */
  static uploadCAS = async (req, res) => {
    const uploadStartTime = Date.now();
    const eventId = casEventLogger.logOnboardingEvent(
      'CAS_ONBOARDING_UPLOAD_STARTED',
      req.params.token,
      {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        hasPassword: !!req.body.casPassword,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    );

    try {
      const { token } = req.params;
      const { casPassword } = req.body;

      console.log(`\n🚀 CAS ONBOARDING UPLOAD STARTED`);
      console.log(`🎫 Token: ${token}`);
      console.log(`📁 File: ${req.file?.originalname || 'No file'}`);
      console.log(`🔒 Has Password: ${!!casPassword}`);

      // Validate token and get invitation
      const invitation = await ClientInvitation.findOne({
        token,
        status: { $in: ['sent', 'opened'] },
        expiresAt: { $gt: new Date() }
      }).populate('advisor');

      if (!invitation) {
        casEventLogger.logError('CAS_ONBOARDING_UPLOAD_FAILED', 
          new Error('Invalid or expired invitation'), 
          { token, eventId }
        );
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invitation link'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        casEventLogger.logError('CAS_ONBOARDING_UPLOAD_FAILED',
          new Error('No file uploaded'),
          { token, eventId }
        );
        return res.status(400).json({
          success: false,
          message: 'No CAS file uploaded'
        });
      }

      // Validate file
      const fileStats = fs.statSync(req.file.path);
      if (fileStats.size === 0) {
        fs.unlinkSync(req.file.path); // Cleanup
        return res.status(400).json({
          success: false,
          message: 'Uploaded file is empty'
        });
      }

      console.log(`✅ File validation passed`);
      console.log(`   📊 Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   📍 Path: ${req.file.path}`);

      // Store CAS file information in temporary storage
      const hasPassword = casPassword && casPassword.trim() !== '';
      invitation.casUploadData = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        password: hasPassword ? casPassword.trim() : null,
        uploadedAt: new Date(),
        eventId: eventId
      };

      casEventLogger.logOnboardingEvent(
        'CAS_PASSWORD_STORED',
        token,
        {
          hasPassword,
          passwordLength: hasPassword ? casPassword.length : 0,
          eventId: eventId
        }
      );

      await invitation.save();

      const uploadDuration = Date.now() - uploadStartTime;

      casEventLogger.logOnboardingEvent(
        'CAS_ONBOARDING_UPLOAD_SUCCESS',
        token,
        {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          filePath: req.file.path,
          uploadDuration: `${uploadDuration}ms`,
          eventId: eventId,
          advisorId: invitation.advisor._id
        }
      );

      console.log(`✅ Upload completed in ${uploadDuration}ms`);

      // Try to extract basic info from CAS for PAN auto-fill
      let extractedInfo = null;
      try {
        console.log(`🔍 Attempting basic data extraction...`);
        
        const casParser = new CASParser();
        const parsedData = await casParser.parseCASFile(req.file.path, casPassword);
        
        extractedInfo = {
          investorPAN: parsedData.investor?.pan,
          investorName: parsedData.investor?.name,
          totalValue: parsedData.summary?.total_value
        };

        casEventLogger.logOnboardingEvent(
          'CAS_ONBOARDING_BASIC_EXTRACTION_SUCCESS',
          token,
          {
            extractedInfo: {
              hasName: !!extractedInfo.investorName,
              hasPAN: !!extractedInfo.investorPAN,
              totalValue: extractedInfo.totalValue
            },
            eventId: eventId
          }
        );

        console.log(`✅ Basic extraction successful`);
        console.log(`   👤 Name: ${extractedInfo.investorName ? 'Found' : 'Not found'}`);
        console.log(`   🆔 PAN: ${extractedInfo.investorPAN ? 'Found' : 'Not found'}`);
        console.log(`   💰 Value: ₹${(extractedInfo.totalValue || 0).toLocaleString('en-IN')}`);

      } catch (extractError) {
        casEventLogger.logWarn('CAS_ONBOARDING_BASIC_EXTRACTION_FAILED', {
          token,
          error: extractError.message,
          eventId: eventId
        });
        
        console.log(`⚠️  Basic extraction failed: ${extractError.message}`);
        console.log(`   📋 This is normal - full parsing will happen later`);
      }

      res.json({
        success: true,
        message: 'CAS file uploaded successfully',
        data: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: new Date(),
          eventId: eventId,
          ...extractedInfo
        }
      });

    } catch (error) {
      const uploadDuration = Date.now() - uploadStartTime;
      
      // Cleanup uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      casEventLogger.logError('CAS_ONBOARDING_UPLOAD_ERROR', error, {
        token: req.params.token,
        uploadDuration: `${uploadDuration}ms`,
        eventId: eventId
      });

      console.log(`❌ Upload failed after ${uploadDuration}ms: ${error.message}`);

      logger.error('CAS onboarding upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload CAS file',
        error: error.message
      });
    }
  };

  /**
   * Parse uploaded CAS file during onboarding with comprehensive error handling
   */
  static parseCAS = async (req, res) => {
    const parseStartTime = Date.now();
    const eventId = casEventLogger.logOnboardingEvent(
      'CAS_ONBOARDING_PARSE_STARTED',
      req.params.token
    );

    try {
      const { token } = req.params;

      console.log(`\n🔍 CAS ONBOARDING PARSE STARTED`);
      console.log(`🎫 Token: ${token}`);

      // Get invitation with CAS upload data
      const invitation = await ClientInvitation.findOne({
        token,
        status: { $in: ['sent', 'opened'] },
        expiresAt: { $gt: new Date() }
      }).populate('advisor');

      if (!invitation) {
        casEventLogger.logError('CAS_ONBOARDING_PARSE_FAILED',
          new Error('Invalid or expired invitation'),
          { token, eventId }
        );
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invitation link'
        });
      }

      if (!invitation.casUploadData) {
        casEventLogger.logError('CAS_ONBOARDING_PARSE_FAILED',
          new Error('No CAS file uploaded'),
          { token, eventId }
        );
        return res.status(400).json({
          success: false,
          message: 'No CAS file found. Please upload a file first.'
        });
      }

      const { filePath, password, fileName } = invitation.casUploadData;

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        casEventLogger.logError('CAS_ONBOARDING_PARSE_FAILED',
          new Error('CAS file not found on disk'),
          { token, eventId, filePath }
        );
        return res.status(404).json({
          success: false,
          message: 'CAS file not found. Please upload again.'
        });
      }

      console.log(`📁 Parsing file: ${fileName}`);
      console.log(`🔒 Password protected: ${!!password}`);

      // Parse CAS file with comprehensive error handling
      const casParser = new CASParser();
      let parsedData;

      try {
        parsedData = await casParser.parseCASFile(filePath, password);
      } catch (parseError) {
        console.log(`❌ Parsing failed: ${parseError.message}`);
        
        // Enhanced error handling for different scenarios
        let userMessage = 'Failed to parse CAS file';
        
        if (parseError.message.toLowerCase().includes('password')) {
          userMessage = 'Incorrect CAS password. Please check and try again.';
        } else if (parseError.message.toLowerCase().includes('corrupted')) {
          userMessage = 'PDF file appears to be corrupted. Please re-upload.';
        } else if (parseError.message.toLowerCase().includes('format')) {
          userMessage = 'Unsupported CAS format. Please ensure this is a valid CAS document.';
        } else if (parseError.message.toLowerCase().includes('text')) {
          userMessage = 'Unable to extract text from PDF. File may be image-based or corrupted.';
        }

        casEventLogger.logError('CAS_ONBOARDING_PARSE_FAILED', parseError, {
          token,
          eventId,
          fileName,
          errorType: 'PARSE_ERROR',
          userMessage
        });

        return res.status(400).json({
          success: false,
          message: userMessage,
          error: parseError.message
        });
      }

      // Store parsed data in invitation temporarily
      invitation.casParsedData = {
        ...parsedData,
        parsedAt: new Date(),
        eventId: eventId
      };

      await invitation.save();

      const parseDuration = Date.now() - parseStartTime;

      casEventLogger.logOnboardingEvent(
        'CAS_ONBOARDING_PARSE_SUCCESS',
        token,
        {
          fileName: fileName,
          parseDuration: `${parseDuration}ms`,
          eventId: eventId,
          advisorId: invitation.advisor._id,
          summary: {
            totalValue: parsedData.summary?.total_value || 0,
            dematAccountsCount: parsedData.demat_accounts?.length || 0,
            mutualFundsCount: parsedData.mutual_funds?.length || 0,
            investorName: parsedData.investor?.name ? 'Found' : 'Not found',
            investorPAN: parsedData.investor?.pan ? 'Found' : 'Not found'
          }
        }
      );

      console.log(`✅ Parsing completed in ${parseDuration}ms`);
      console.log(`💰 Total Value: ₹${(parsedData.summary?.total_value || 0).toLocaleString('en-IN')}`);
      console.log(`🏦 Demat Accounts: ${parsedData.demat_accounts?.length || 0}`);
      console.log(`📈 Mutual Funds: ${parsedData.mutual_funds?.length || 0}`);

      res.json({
        success: true,
        message: 'CAS file parsed successfully',
        data: {
          fileName: fileName,
          parsedAt: new Date(),
          eventId: eventId,
          parsedData: parsedData
        }
      });

    } catch (error) {
      const parseDuration = Date.now() - parseStartTime;
      
      casEventLogger.logError('CAS_ONBOARDING_PARSE_ERROR', error, {
        token: req.params.token,
        parseDuration: `${parseDuration}ms`,
        eventId: eventId
      });

      console.log(`❌ Parse process failed after ${parseDuration}ms: ${error.message}`);

      logger.error('CAS onboarding parse error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to parse CAS file',
        error: error.message
      });
    }
  };

  /**
   * Get CAS status during onboarding
   */
  static getCASStatus = async (req, res) => {
    try {
      const { token } = req.params;

      console.log(`📋 Getting CAS status for token: ${token}`);

      const invitation = await ClientInvitation.findOne({
        token,
        status: { $in: ['sent', 'opened'] },
        expiresAt: { $gt: new Date() }
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invitation link'
        });
      }

      let casStatus = 'not_uploaded';
      let casData = null;

      if (invitation.casUploadData) {
        casStatus = invitation.casParsedData ? 'parsed' : 'uploaded';
        casData = {
          fileName: invitation.casUploadData.fileName,
          fileSize: invitation.casUploadData.fileSize,
          uploadedAt: invitation.casUploadData.uploadedAt,
          parsedAt: invitation.casParsedData?.parsedAt,
          parsedData: invitation.casParsedData
        };
      }

      console.log(`📊 CAS Status: ${casStatus}`);

      res.json({
        success: true,
        data: {
          casStatus,
          casData
        }
      });

    } catch (error) {
      logger.error('Get CAS status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get CAS status'
      });
    }
  };

  /**
   * Complete onboarding with CAS data integration
   */
  static completeOnboardingWithCAS = async (clientData, invitation) => {
    const integrationStartTime = Date.now();
    const eventId = casEventLogger.logOnboardingEvent(
      'CAS_INTEGRATION_STARTED',
      invitation.token,
      {
        hasUploadData: !!invitation.casUploadData,
        hasParsedData: !!invitation.casParsedData,
        clientEmail: clientData.email
      }
    );

    try {
      console.log(`\n🔗 CAS INTEGRATION STARTED`);
      console.log(`👤 Client: ${clientData.email}`);
      console.log(`📁 Has Upload Data: ${!!invitation.casUploadData}`);
      console.log(`📊 Has Parsed Data: ${!!invitation.casParsedData}`);

      // If CAS data exists, integrate it with client data
      if (invitation.casUploadData && invitation.casParsedData) {
        const casData = {
          casFile: {
            fileName: invitation.casUploadData.fileName,
            filePath: invitation.casUploadData.filePath,
            uploadDate: invitation.casUploadData.uploadedAt,
            fileSize: invitation.casUploadData.fileSize,
            password: invitation.casUploadData.password
          },
          parsedData: invitation.casParsedData,
          casStatus: 'parsed',
          lastParsedAt: invitation.casParsedData.parsedAt,
          processingHistory: [{
            action: 'onboarding_upload',
            timestamp: invitation.casUploadData.uploadedAt,
            status: 'success',
            details: 'CAS uploaded during client onboarding',
            eventId: invitation.casUploadData.eventId
          }, {
            action: 'onboarding_parse',
            timestamp: invitation.casParsedData.parsedAt,
            status: 'success',
            details: 'CAS parsed during client onboarding',
            eventId: eventId
          }]
        };

        // Add CAS data to client
        clientData.casData = casData;

        const integrationDuration = Date.now() - integrationStartTime;

        casEventLogger.logOnboardingEvent(
          'CAS_INTEGRATION_SUCCESS',
          invitation.token,
          {
            eventId: eventId,
            integrationDuration: `${integrationDuration}ms`,
            clientEmail: clientData.email,
            portfolioValue: invitation.casParsedData.summary?.total_value || 0
          }
        );

        console.log(`✅ CAS integration completed in ${integrationDuration}ms`);
        console.log(`💰 Portfolio Value: ₹${(invitation.casParsedData.summary?.total_value || 0).toLocaleString('en-IN')}`);

        // Schedule cleanup of temporary files after successful integration
        setTimeout(() => {
          try {
            if (fs.existsSync(invitation.casUploadData.filePath)) {
              fs.unlinkSync(invitation.casUploadData.filePath);
              casEventLogger.logInfo('CAS_TEMP_FILE_CLEANUP', {
                filePath: invitation.casUploadData.filePath,
                eventId: eventId
              });
              console.log(`🧹 Temporary CAS file cleaned up`);
            }
          } catch (cleanupError) {
            casEventLogger.logWarn('CAS_TEMP_FILE_CLEANUP_FAILED', {
              error: cleanupError.message,
              eventId: eventId
            });
            console.log(`⚠️  Cleanup warning: ${cleanupError.message}`);
          }
        }, 5000); // Cleanup after 5 seconds
      } else {
        console.log(`ℹ️  No CAS data to integrate`);
      }

      return clientData;

    } catch (error) {
      const integrationDuration = Date.now() - integrationStartTime;
      
      casEventLogger.logError('CAS_INTEGRATION_ERROR', error, {
        token: invitation.token,
        integrationDuration: `${integrationDuration}ms`,
        eventId: eventId
      });
      
      console.log(`❌ CAS integration failed after ${integrationDuration}ms: ${error.message}`);
      
      // Don't fail the entire onboarding if CAS integration fails
      logger.warn('CAS integration failed, proceeding without CAS data:', error);
      return clientData;
    }
  };

  /**
   * Cleanup expired CAS uploads (utility method)
   */
  static cleanupExpiredUploads = async () => {
    try {
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const expiredInvitations = await ClientInvitation.find({
        'casUploadData.uploadedAt': { $lt: cutoffDate },
        status: { $in: ['sent', 'opened'] }
      });

      let cleanupCount = 0;
      
      for (const invitation of expiredInvitations) {
        if (invitation.casUploadData && invitation.casUploadData.filePath) {
          try {
            if (fs.existsSync(invitation.casUploadData.filePath)) {
              fs.unlinkSync(invitation.casUploadData.filePath);
              cleanupCount++;
            }
            
            // Clear the upload data
            invitation.casUploadData = null;
            invitation.casParsedData = null;
            await invitation.save();
            
          } catch (error) {
            logger.warn('Failed to cleanup expired CAS file:', {
              filePath: invitation.casUploadData.filePath,
              error: error.message
            });
          }
        }
      }

      if (cleanupCount > 0) {
        casEventLogger.logInfo('CAS_EXPIRED_CLEANUP_COMPLETED', {
          cleanupCount,
          cutoffDate: cutoffDate.toISOString()
        });
        
        console.log(`🧹 Cleaned up ${cleanupCount} expired CAS files`);
      }

    } catch (error) {
      logger.error('Error in CAS cleanup process:', error);
    }
  };
}

// Export the class and upload middleware
module.exports = {
  OnboardingCASController,
  upload
};