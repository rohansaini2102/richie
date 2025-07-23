/**
 * Goal-Based Planning Components Export Barrel
 */

// Main interface
export { default as GoalBasedPlanningInterface } from './GoalBasedPlanningInterface';

// Core components
export { default as EditableClientDataGoal } from './EditableClientDataGoal';
export { default as EditableGoalItem } from './EditableGoalItem';
export { default as GoalSelectionPanel } from './GoalSelectionPanel';
export { default as GoalPlanningInterface } from './GoalPlanningInterface';
export { default as GoalAnalysisPanel } from './GoalAnalysisPanel';
export { default as MultiGoalOptimizer } from './MultiGoalOptimizer';

// Utilities
export * from './utils/goalCalculations';
export * from './utils/goalFormatters';
export * from './utils/goalDataHelpers';