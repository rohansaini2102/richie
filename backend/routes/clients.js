const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import enhanced controllers
const {
  getClients,
  getClientById,
  sendClientInvitation,
  getClientInvitations,
  updateClient,
  deleteClient,
  getClientOnboardingForm,
  submitClientOnboardingForm,
  saveClientFormDraft,
  getClientFormDraft,
  uploadClientCAS,
  parseClientCAS,
  getClientCASData,
  deleteClientCAS,
  getDashboardStats,
  getClientFinancialSummary
} = require('../controllers/clientController');

const { OnboardingCASController, upload } = require('../controllers/OnboardingCASController');

// Import middleware
const auth = require('../middleware/auth');
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

// Enhanced Client Management Routes
router.get('/manage', auth, getClients);
router.get('/manage/invitations', auth, getClientInvitations);
router.post('/manage/invitations', auth, sendClientInvitation);
router.get('/manage/:id', auth, getClientById);
router.put('/manage/:id', auth, updateClient);
router.delete('/manage/:id', auth, deleteClient);

// NEW: Enhanced Dashboard and Analytics Routes
router.get('/manage/dashboard/stats', auth, getDashboardStats);
router.get('/manage/:id/financial-summary', auth, getClientFinancialSummary);

// Enhanced CAS Management Routes for existing clients
router.post('/manage/:id/cas/upload', auth, casUpload.single('casFile'), handleMulterError, uploadClientCAS);
router.post('/manage/:id/cas/parse', auth, parseClientCAS);
router.get('/manage/:id/cas', auth, getClientCASData);
router.delete('/manage/:id/cas', auth, deleteClientCAS);

// ============================================================================
// PUBLIC ROUTES (Enhanced 5-Stage Client onboarding - no authentication required)
// ============================================================================

// Enhanced Client Onboarding Routes
router.get('/onboarding/:token', getClientOnboardingForm);
router.post('/onboarding/:token', submitClientOnboardingForm);

// NEW: Draft Management Routes for 5-Stage Form
router.post('/onboarding/:token/draft', saveClientFormDraft);
router.get('/onboarding/:token/draft', getClientFormDraft);

// Enhanced CAS Upload Routes for onboarding flow (keeping existing CAS logic)
router.post('/onboarding/:token/cas/upload', upload.single('casFile'), handleMulterError, OnboardingCASController.uploadCAS);
router.post('/onboarding/:token/cas/parse', OnboardingCASController.parseCAS);
router.get('/onboarding/:token/cas/status', OnboardingCASController.getCASStatus);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

// Enhanced health check for comprehensive functionality
router.get('/health', (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads/cas');
    const uploadsExist = fs.existsSync(uploadsPath);
    
    casEventLogger.logInfo('ENHANCED_HEALTH_CHECK', {
      uploadsDirectoryExists: uploadsExist,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Enhanced client management system is operational',
      data: {
        uploadsDirectory: uploadsExist,
        maxFileSize: '10MB',
        supportedFormats: ['PDF'],
        supportedCASTypes: ['CDSL', 'NSDL'],
        features: {
          fiveStageOnboarding: true,
          enhancedFinancialTracking: true,
          comprehensiveGoalPlanning: true,
          advancedDashboardAnalytics: true,
          casIntegration: true,
          draftSaving: true,
          financialHealthScoring: true
        },
        formStages: [
          { stage: 1, name: 'Personal Information & KYC' },
          { stage: 2, name: 'Income & Employment Analysis' },
          { stage: 3, name: 'Financial Goals & Retirement' },
          { stage: 4, name: 'Assets & Liabilities Mapping' },
          { stage: 5, name: 'Investment Profile & CAS Upload' }
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    casEventLogger.logError('ENHANCED_HEALTH_CHECK_FAILED', error);
    
    res.status(500).json({
      success: false,
      message: 'Enhanced health check failed',
      error: error.message
    });
  }
});

// Enhanced debug route for comprehensive testing (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/form-structure', (req, res) => {
    res.json({
      success: true,
      message: 'Enhanced 5-Stage Form Structure',
      data: {
        formConfiguration: {
          totalStages: 5,
          estimatedTime: '15-20 minutes',
          features: [
            'Real-time financial calculations',
            'Automatic net worth computation',
            'Goal feasibility analysis',
            'CAS portfolio import',
            'Draft saving capability',
            'Progress tracking',
            'Financial health scoring'
          ]
        },
        stageDetails: {
          stage1: {
            title: 'Personal Information & KYC',
            fields: [
              'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 
              'gender', 'panNumber', 'address'
            ],
            estimatedTime: '3-4 minutes',
            required: true
          },
          stage2: {
            title: 'Income & Employment Analysis',
            fields: [
              'occupation', 'employerBusinessName', 'annualIncome', 'additionalIncome',
              'monthlyExpenses', 'annualTaxes', 'annualVacationExpenses'
            ],
            estimatedTime: '4-5 minutes',
            calculations: ['monthlyIncome', 'totalExpenses', 'savingsRate'],
            required: true
          },
          stage3: {
            title: 'Financial Goals & Retirement Planning',
            fields: [
              'retirementPlanning', 'majorGoals', 'customGoals'
            ],
            estimatedTime: '3-4 minutes',
            calculations: ['goalFeasibility', 'requiredSavings'],
            required: true
          },
          stage4: {
            title: 'Assets & Liabilities Assessment',
            fields: [
              'assets.cashBankSavings', 'assets.realEstate', 'assets.investments',
              'liabilities.loans', 'liabilities.creditCardDebt'
            ],
            estimatedTime: '4-5 minutes',
            calculations: ['totalAssets', 'totalLiabilities', 'netWorth'],
            required: true
          },
          stage5: {
            title: 'Investment Profile & CAS Upload',
            fields: [
              'investmentExperience', 'riskTolerance', 'investmentGoals',
              'monthlySavingsTarget', 'casUpload'
            ],
            estimatedTime: '2-3 minutes',
            optional: ['casUpload'],
            required: false
          }
        },
        dataProcessing: {
          realTimeCalculations: true,
          automaticValidation: true,
          progressTracking: true,
          draftSaving: true,
          casIntegration: true
        }
      }
    });
  });

  router.post('/debug/test-submission', async (req, res) => {
    const debugStartTime = Date.now();
    const debugEventId = casEventLogger.logInfo('DEBUG_FORM_SUBMISSION_TEST', {
      hasData: !!req.body,
      dataSize: JSON.stringify(req.body).length
    });

    try {
      // Simulate form processing
      const { formData } = req.body;
      
      console.log(`\n🔧 DEBUG: Testing enhanced form submission...`);
      console.log(`📋 Form Data Keys: ${Object.keys(formData || {}).join(', ')}`);
      
      // Validate each stage
      const stageValidation = {
        stage1: !!(formData?.firstName && formData?.lastName && formData?.email),
        stage2: !!(formData?.occupation && formData?.annualIncome),
        stage3: !!(formData?.retirementPlanning?.targetRetirementAge),
        stage4: !!(formData?.assets),
        stage5: !!(formData?.investmentExperience && formData?.riskTolerance)
      };
      
      const debugDuration = Date.now() - debugStartTime;

      casEventLogger.logInfo('DEBUG_FORM_SUBMISSION_SUCCESS', {
        stageValidation,
        debugDuration: `${debugDuration}ms`,
        eventId: debugEventId
      });

      console.log(`✅ DEBUG: Form validation completed in ${debugDuration}ms`);

      res.json({
        success: true,
        message: 'Enhanced form submission test completed',
        data: {
          stageValidation,
          processingTime: debugDuration,
          formCompleteness: Object.values(stageValidation).filter(Boolean).length,
          totalStages: 5,
          debug: true
        }
      });

    } catch (error) {
      const debugDuration = Date.now() - debugStartTime;
      
      casEventLogger.logError('DEBUG_FORM_SUBMISSION_FAILED', error, {
        debugDuration: `${debugDuration}ms`,
        eventId: debugEventId
      });

      console.log(`❌ DEBUG: Form test failed after ${debugDuration}ms: ${error.message}`);

      res.status(400).json({
        success: false,
        message: 'Enhanced form submission test failed',
        error: error.message,
        debug: true
      });
    }
  });

  // CAS debug route (keeping existing logic)
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
// ENHANCED FORM VALIDATION MIDDLEWARE
// ============================================================================

// Middleware to validate 5-stage form data
const validateEnhancedFormData = (req, res, next) => {
  try {
    const formData = req.body;
    const errors = [];
    
    // Stage 1 validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      errors.push('Stage 1: First name, last name, and email are required');
    }
    
    if (formData.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.push('Stage 1: Invalid email format');
    }
    
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      errors.push('Stage 1: Invalid PAN number format');
    }
    
    // Stage 2 validation
    if (!formData.occupation || !formData.annualIncome) {
      errors.push('Stage 2: Occupation and annual income are required');
    }
    
    if (formData.annualIncome && (isNaN(formData.annualIncome) || formData.annualIncome < 0)) {
      errors.push('Stage 2: Annual income must be a positive number');
    }
    
    // Stage 3 validation
    if (!formData.retirementPlanning?.targetRetirementAge) {
      errors.push('Stage 3: Target retirement age is required');
    }
    
    if (formData.retirementPlanning?.targetRetirementAge && 
        (formData.retirementPlanning.targetRetirementAge < 50 || formData.retirementPlanning.targetRetirementAge > 80)) {
      errors.push('Stage 3: Retirement age must be between 50 and 80');
    }
    
    // Stage 4 validation (basic check for at least some asset/liability info)
    const hasAssetInfo = formData.assets && Object.values(formData.assets).some(value => value !== undefined && value !== '');
    const hasLiabilityInfo = formData.liabilities && Object.values(formData.liabilities).some(value => value !== undefined && value !== '');
    
    if (!hasAssetInfo && !hasLiabilityInfo) {
      errors.push('Stage 4: Please provide at least some asset or liability information');
    }
    
    // Stage 5 validation
    if (!formData.investmentExperience || !formData.riskTolerance) {
      errors.push('Stage 5: Investment experience and risk tolerance are required');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Form validation failed',
        errors: errors
      });
    }
    
    next();
  } catch (error) {
    logger.error('Form validation middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Form validation error',
      error: error.message
    });
  }
};

// Apply validation middleware to form submission
router.post('/onboarding/:token', validateEnhancedFormData, submitClientOnboardingForm);

// ============================================================================
// ENHANCED ERROR HANDLING
// ============================================================================

// Global error handler for this router
router.use((error, req, res, next) => {
  casEventLogger.logError('ENHANCED_CLIENT_ROUTES_ERROR', error, {
    path: req.path,
    method: req.method,
    clientId: req.params.id,
    token: req.params.token,
    stage: req.body?.currentStep || 'unknown'
  });

  logger.error('Enhanced client routes error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    formStage: req.body?.currentStep
  });

  // Enhanced error responses based on route type
  let message = 'An error occurred processing your request';
  let statusCode = 500;
  
  if (req.path.includes('/onboarding/')) {
    message = 'An error occurred during the onboarding process. Please try again.';
    if (error.name === 'ValidationError') {
      message = 'Please check your form data and try again.';
      statusCode = 400;
    }
  } else if (req.path.includes('/cas/')) {
    message = 'An error occurred processing your CAS file. Please try again.';
  } else if (req.path.includes('/dashboard/')) {
    message = 'An error occurred loading dashboard data. Please refresh the page.';
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      message: message
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
      stack: error.stack,
      debug: {
        path: req.path,
        method: req.method,
        formStage: req.body?.currentStep,
        hasToken: !!req.params.token,
        hasClientId: !!req.params.id
      }
    });
  }
});

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

// Enhanced request logging for better debugging
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  casEventLogger.logInfo('ENHANCED_REQUEST_START', {
    method: req.method,
    path: req.path,
    token: req.params.token,
    clientId: req.params.id,
    hasBody: !!req.body && Object.keys(req.body).length > 0,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stage: req.body?.currentStep || req.query?.stepNumber
  });
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    casEventLogger.logInfo('ENHANCED_REQUEST_COMPLETE', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success,
      token: req.params.token,
      clientId: req.params.id,
      stage: req.body?.currentStep || req.query?.stepNumber
    });
    
    return originalJson.call(this, data);
  };
  
  next();
});

module.exports = router;