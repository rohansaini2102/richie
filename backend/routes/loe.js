const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loeController = require('../controllers/loeController');
const { logger } = require('../utils/logger');

// Middleware to log LOE requests
const logLOERequest = (action) => (req, res, next) => {
  logger.info(`📄 [LOE Routes] ${action} request`, {
    advisorId: req.advisor?.id,
    meetingId: req.body?.meetingId || req.params?.meetingId,
    token: req.params?.token,
    ip: req.ip
  });
  next();
};

// Protected routes (require advisor authentication)
// Create and send LOE for a meeting
router.post('/send', auth, logLOERequest('Send LOE'), loeController.createAndSendLOE);

// Get all LOEs for the advisor
router.get('/advisor', auth, logLOERequest('Get advisor LOEs'), loeController.getAdvisorLOEs);

// Check LOE status for a specific meeting
router.get('/meeting/:meetingId/status', auth, logLOERequest('Check LOE status'), loeController.getMeetingLOEStatus);

// Test email configuration (for debugging)
router.post('/test-email', auth, logLOERequest('Test email'), async (req, res) => {
  try {
    const { createEmailTransporter, verifyEmailTransporter } = require('../utils/emailService');
    
    logger.info('🧪 [LOE] Testing email configuration');
    
    const transporter = createEmailTransporter();
    const isVerified = await verifyEmailTransporter(transporter);
    
    res.json({
      success: true,
      emailConfigured: isVerified,
      emailUser: process.env.EMAIL_USER ? 'configured' : 'missing',
      emailPass: process.env.EMAIL_PASS ? 'configured' : 'missing'
    });
  } catch (error) {
    logger.error('❌ [LOE] Email test failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Public routes (accessed by clients via token)
// Get LOE by access token
router.get('/view/:token', logLOERequest('View LOE'), loeController.getLOEByToken);

// Save client signature
router.post('/sign/:token', logLOERequest('Sign LOE'), loeController.saveLOESignature);

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('❌ [LOE Routes] Error:', error);
  res.status(500).json({
    success: false,
    message: 'An error occurred processing your LOE request',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;