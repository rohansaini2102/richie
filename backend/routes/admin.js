const express = require('express');
const router = express.Router();
const { getAllAdvisors, getAdvisorClients, getDashboardStats } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Admin middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  // For now, we'll use a simple check
  // In production, you should implement proper admin authentication
  const adminToken = req.headers['admin-token'];
  
  if (adminToken === 'admin-session-token') {
    next();
  } else {
    logger.warn('Unauthorized admin access attempt', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Admin dashboard routes
router.get('/advisors', getAllAdvisors);
router.get('/advisors/:advisorId/clients', getAdvisorClients);
router.get('/dashboard/stats', getDashboardStats);

// Health check for admin functionality
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 