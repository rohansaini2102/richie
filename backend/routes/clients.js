const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import controllers
const {
  getClients,
  getClientById,
  sendClientInvitation,
  getClientInvitations,
  updateClient,
  deleteClient,
  getClientOnboardingForm,
  submitClientOnboardingForm,
  uploadClientCAS,
  parseClientCAS,
  getClientCASData,
  deleteClientCAS
} = require('../controllers/clientController');

const { OnboardingCASController, upload } = require('../controllers/OnboardingCASController');

// Import middleware
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { casEventLogger } = require('../utils/casEventLogger');

// Configure multer for CAS uploads in main client flow
const casStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/cas');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const clientId = req.params.id || 'unknown';
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `client_${clientId}_${timestamp}_${sanitizedName}`);
  }
});

const casFileFilter = (req, file, cb) => {
  casEventLogger.logInfo('CAS_FILE_UPLOAD_ATTEMPT', {
    clientId: req.params.id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size
  });

  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Only PDF files are allowed for CAS upload');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const casUpload = multer({
  storage: casStorage,
  fileFilter: casFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    casEventLogger.logError('CAS_UPLOAD_MULTER_ERROR', error, {
      clientId: req.params.id,
      code: error.code
    });

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed.'
    });
  }
  
  next(error);
};

// ============================================================================
// PROTECTED ROUTES (Require advisor authentication)
// ============================================================================

// Client Management Routes
// router.get('/', protect, getClients);
// router.get('/invitations', protect, getClientInvitations);
// router.post('/invite', protect, sendClientInvitation);
// router.get('/:id', protect, getClientById);
// router.put('/:id', protect, updateClient);
// router.delete('/:id', protect, deleteClient);

// CAS Management Routes for existing clients
// router.post('/:id/cas/upload', protect, casUpload.single('casFile'), handleMulterError, uploadClientCAS);
// router.post('/:id/cas/parse', protect, parseClientCAS);
// router.get('/:id/cas', protect, getClientCASData);
// router.delete('/:id/cas', protect, deleteClientCAS);

// ============================================================================
// PUBLIC ROUTES (Client onboarding - no authentication required)
// ============================================================================

// Client Onboarding Routes
// router.get('/onboarding/:token', getClientOnboardingForm);
// router.post('/onboarding/:token/submit', submitClientOnboardingForm);

// CAS Upload Routes for onboarding flow
// router.post('/onboarding/:token/cas/upload', upload.single('casFile'), handleMulterError, OnboardingCASController.uploadCAS);
// router.post('/onboarding/:token/cas/parse', OnboardingCASController.parseCAS);
// router.get('/onboarding/:token/cas/status', OnboardingCASController.getCASStatus);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

// Health check for CAS functionality
router.get('/cas/health', (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads/cas');
    const uploadsExist = fs.existsSync(uploadsPath);
    
    casEventLogger.logInfo('CAS_HEALTH_CHECK', {
      uploadsDirectoryExists: uploadsExist,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'CAS functionality is operational',
      data: {
        uploadsDirectory: uploadsExist,
        maxFileSize: '10MB',
        supportedFormats: ['PDF'],
        supportedCASTypes: ['CDSL', 'NSDL'],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    casEventLogger.logError('CAS_HEALTH_CHECK_FAILED', error);
    
    res.status(500).json({
      success: false,
      message: 'CAS health check failed',
      error: error.message
    });
  }
});

// Debug route for CAS parsing (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/cas/debug/parse', casUpload.single('casFile'), handleMulterError, async (req, res) => {
    const debugStartTime = Date.now();
    const debugEventId = casEventLogger.logInfo('CAS_DEBUG_PARSE_STARTED', {
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      hasPassword: !!req.body.casPassword
    });

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CAS file uploaded for debug parsing'
        });
      }

      const CASParser = require('../services/cas-parser');
      const casParser = new CASParser();
      
      console.log(`\n🔧 DEBUG: Starting CAS parse...`);
      console.log(`📁 File: ${req.file.originalname}`);
      console.log(`📊 Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
      
      const parsedData = await casParser.parseCASFile(req.file.path, req.body.casPassword || '');
      
      // Cleanup debug file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      const debugDuration = Date.now() - debugStartTime;

      casEventLogger.logInfo('CAS_DEBUG_PARSE_SUCCESS', {
        fileName: req.file.originalname,
        debugDuration: `${debugDuration}ms`,
        totalValue: parsedData.summary?.total_value || 0,
        eventId: debugEventId
      });

      console.log(`✅ DEBUG: Parse completed in ${debugDuration}ms`);

      res.json({
        success: true,
        message: 'CAS file parsed successfully (debug mode)',
        data: {
          fileName: req.file.originalname,
          parseTime: debugDuration,
          parsedData: parsedData,
          debug: true
        }
      });

    } catch (error) {
      const debugDuration = Date.now() - debugStartTime;
      
      // Cleanup debug file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      casEventLogger.logError('CAS_DEBUG_PARSE_FAILED', error, {
        fileName: req.file?.originalname,
        debugDuration: `${debugDuration}ms`,
        eventId: debugEventId
      });

      console.log(`❌ DEBUG: Parse failed after ${debugDuration}ms: ${error.message}`);

      res.status(400).json({
        success: false,
        message: 'CAS debug parsing failed',
        error: error.message,
        debug: true
      });
    }
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler for this router
router.use((error, req, res, next) => {
  casEventLogger.logError('CLIENT_ROUTES_ERROR', error, {
    path: req.path,
    method: req.method,
    clientId: req.params.id,
    token: req.params.token
  });

  logger.error('Client routes error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred processing your request'
    : error.message;

  res.status(error.status || 500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;