const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const auth = require('../middleware/auth');
const { validatePlanCreation, validatePlanUpdate } = require('../validators/planValidators');

// Apply authentication middleware to all routes
router.use(auth);

// Create a new financial plan
router.post(
  '/',
  validatePlanCreation,
  planController.createPlan
);

// Get a specific plan by ID
router.get(
  '/:planId',
  planController.getPlanById
);

// Update a plan
router.put(
  '/:planId',
  validatePlanUpdate,
  planController.updatePlan
);

// Delete/Archive a plan
router.delete(
  '/:planId',
  planController.archivePlan
);

// Get all plans for a specific client
router.get(
  '/client/:clientId',
  planController.getClientPlans
);

// Get all plans for the current advisor
router.get(
  '/advisor/all',
  planController.getAdvisorPlans
);

// Update plan status
router.patch(
  '/:planId/status',
  planController.updatePlanStatus
);

// Add review note to plan
router.post(
  '/:planId/review',
  planController.addReviewNote
);

// Generate AI recommendations for a plan
router.post(
  '/:planId/ai-recommendations',
  planController.generateAIRecommendations
);

// Get plan performance metrics
router.get(
  '/:planId/performance',
  planController.getPerformanceMetrics
);

// Clone an existing plan
router.post(
  '/:planId/clone',
  planController.clonePlan
);

// Export plan as PDF
router.get(
  '/:planId/export/pdf',
  planController.exportPlanAsPDF
);

// AI-powered debt analysis
router.post(
  '/analyze-debt/:clientId',
  planController.analyzeDebt
);

// Update debt strategy with advisor modifications
router.put(
  '/:planId/debt-strategy',
  planController.updateDebtStrategy
);

// Get debt recommendations for a plan
router.get(
  '/:planId/debt-recommendations',
  planController.getDebtRecommendations
);

// Test Claude AI service configuration
router.get(
  '/test/ai-service',
  planController.testAIService
);

// AI-powered goal analysis for goal-based planning
router.post(
  '/analyze-goals',
  planController.analyzeGoals
);

// Get goal recommendations for a plan
router.get(
  '/:planId/goal-recommendations',
  planController.getGoalRecommendations
);

// Update goal strategy with advisor modifications
router.put(
  '/:planId/goal-strategy',
  planController.updateGoalStrategy
);

module.exports = router;