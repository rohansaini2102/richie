// Refactored Client Onboarding Components - Main Exports

// Main form component
export { default as ClientOnboardingFormRefactored } from './ClientOnboardingFormRefactored';

// Step components
export { default as Step1PersonalInfo } from './steps/Step1PersonalInfo';
export { default as Step2IncomeEmployment } from './steps/Step2IncomeEmployment';
export { default as Step3RetirementGoals } from './steps/Step3RetirementGoals';
export { default as Step4AssetsLiabilities } from './steps/Step4AssetsLiabilities';
export { default as Step5InvestmentProfile } from './steps/Step5InvestmentProfile';

// Shared components
export { default as ProgressIndicator } from './shared/ProgressIndicator';
export { default as FormNavigation } from './shared/FormNavigation';
export { default as DebugPanel } from './shared/DebugPanel';

// Utilities and constants
export * from './constants/formConstants';
export * from './utils/formValidation';
export * from './utils/formCalculations';
export * from './utils/casUploadLogic';

// Existing components (preserved)
export { default as ClientOnboardingForm } from './ClientOnboardingForm';
export { default as RequiredFieldsChecklist } from './RequiredFieldsChecklist';
export { default as ClientCard } from './ClientCard';
export { default as ClientList } from './ClientList';
export { default as ClientDetailView } from './ClientDetailView';
export { default as ClientLOESection } from './ClientLOESection';