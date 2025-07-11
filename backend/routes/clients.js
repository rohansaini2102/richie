const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Configure multer for CAS file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/cas');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `cas-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for CAS upload'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Protected routes (require authentication)
router.use('/manage', auth);

// Invitation management routes (must come before parameterized routes)
router.post('/manage/invitations', sendClientInvitation);
router.get('/manage/invitations', getClientInvitations);

// Client management routes
router.get('/manage', getClients);
router.get('/manage/:id', getClientById);
router.put('/manage/:id', updateClient);
router.delete('/manage/:id', deleteClient);

// CAS management routes (protected)
router.post('/manage/:id/cas/upload', upload.single('casFile'), uploadClientCAS);
router.post('/manage/:id/cas/parse', parseClientCAS);
router.get('/manage/:id/cas', getClientCASData);
router.delete('/manage/:id/cas', deleteClientCAS);

// Public routes (no authentication required)
// Client onboarding form routes
router.get('/onboarding/:token', getClientOnboardingForm);
router.post('/onboarding/:token', submitClientOnboardingForm);

// Public CAS upload route for onboarding
router.post('/onboarding/:token/cas/upload', upload.single('casFile'), uploadClientCAS);

module.exports = router;