const express = require('express');
const { auth, authRateLimit, logAPIUsage } = require('../middleware/auth');
const {
  registerAdvisor,
  loginAdvisor,
  getAdvisorProfile,
  updateAdvisorProfile,
  logoutAdvisor
} = require('../controllers/advisorController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new advisor
// @access  Public
router.post('/register', authRateLimit(3, 15 * 60 * 1000), logAPIUsage, registerAdvisor);

// @route   POST /api/auth/login
// @desc    Login advisor
// @access  Public
router.post('/login', authRateLimit(5, 15 * 60 * 1000), logAPIUsage, loginAdvisor);

// @route   GET /api/auth/profile
// @desc    Get current advisor profile
// @access  Private
router.get('/profile', auth, logAPIUsage, getAdvisorProfile);

// @route   PUT /api/auth/profile
// @desc    Update advisor profile
// @access  Private
router.put('/profile', auth, logAPIUsage, updateAdvisorProfile);

// @route   POST /api/auth/logout
// @desc    Logout advisor
// @access  Private
router.post('/logout', auth, logAPIUsage, logoutAdvisor);

module.exports = router;