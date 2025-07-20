const express = require('express');
const router = express.Router();
const { getAllAdvisors, getAdvisorClients, getDashboardStats, updateAdvisorClient } = require('../controllers/adminController');
const { requireAdmin, logAPIUsage } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(requireAdmin);
router.use(logAPIUsage);

// Admin dashboard routes
router.get('/advisors', getAllAdvisors);
router.get('/advisors/:advisorId/clients', getAdvisorClients);
router.put('/advisors/:advisorId/clients/:clientId', updateAdvisorClient);
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