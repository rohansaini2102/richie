const { body, validationResult } = require('express-validator');

// Validation middleware for plan creation
exports.validatePlanCreation = [
  body('clientId')
    .notEmpty().withMessage('Client ID is required')
    .isMongoId().withMessage('Invalid client ID format'),
  
  body('planType')
    .optional()
    .isIn(['cash_flow', 'goal_based', 'hybrid', 'adaptive'])
    .withMessage('Invalid plan type'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for plan update
exports.validatePlanUpdate = [
  body('status')
    .optional()
    .isIn(['draft', 'active', 'completed', 'archived'])
    .withMessage('Invalid status'),

  body('planDetails')
    .optional()
    .isObject()
    .withMessage('Plan details must be an object'),

  body('advisorRecommendations')
    .optional()
    .isObject()
    .withMessage('Advisor recommendations must be an object'),

  body('reviewSchedule.frequency')
    .optional()
    .isIn(['monthly', 'quarterly', 'semi-annually', 'annually'])
    .withMessage('Invalid review frequency'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];