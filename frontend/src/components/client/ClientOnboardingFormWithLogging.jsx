// Enhanced ClientOnboardingForm with comprehensive logging
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientAPI } from '../../services/api';

// Import step components
import Step1PersonalInfo from './steps/Step1PersonalInfo';
import Step2IncomeEmployment from './steps/Step2IncomeEmployment';
import Step3RetirementGoals from './steps/Step3RetirementGoals';
import Step4AssetsLiabilities from './steps/Step4AssetsLiabilities';
import Step5InvestmentProfile from './steps/Step5InvestmentProfile';

// Import shared components
import ProgressIndicator from './shared/ProgressIndicator';
import FormNavigation from './shared/FormNavigation';
import DebugPanel from './shared/DebugPanel';
import RequiredFieldsChecklist from './RequiredFieldsChecklist';

// Import logging components
import ErrorBoundaryLogger from '../logging/ErrorBoundaryLogger';
import { ButtonLogger, LoggedButton } from '../logging/withButtonLogging';

// Import utilities and logging
import { DEFAULT_FORM_VALUES, FORM_STEPS } from './constants/formConstants';
import { validateFormStep, validateCompleteForm } from './utils/formValidation';
import { calculateFinancialSummary, calculateAssetsLiabilities } from './utils/formCalculations';
import logger from '../../services/Logger';
import { useUserInteractionLogger, useComponentLogger, useFormLogger, useCASLogger } from '../../hooks/useUserInteractionLogger';

function ClientOnboardingFormWithLogging() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  // Main state
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // UI state
  const [savingDraft, setSavingDraft] = useState(false);
  const [showRequiredFieldsChecklist, setShowRequiredFieldsChecklist] = useState(false);
  
  // Form tracking
  const [formStartTime, setFormStartTime] = useState(null);
  const [stepTimes, setStepTimes] = useState({});
  
  // CAS state (for Step 5)
  const [casData, setCasData] = useState(null);
  const [casUploadStatus, setCasUploadStatus] = useState('not_uploaded');

  // Logging hooks
  const componentRef = useUserInteractionLogger('ClientOnboardingForm', {
    logClicks: true,
    logFormChanges: true,
    logFocus: true,
    debounceMs: 500
  });
  
  const { logComponentAction } = useComponentLogger('ClientOnboardingForm');
  
  const {
    logFormValidationError,
    logFormComplete,
    logFormDraftSave,
    logCustomFormEvent
  } = useFormLogger('client_onboarding', currentStep);
  
  const {
    logCASUpload,
    logCASParseComplete,
    logCASError
  } = useCASLogger('onboarding-form');

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
    reset
  } = useForm({
    mode: 'onChange',
    defaultValues: DEFAULT_FORM_VALUES
  });

  // Initialize form tracking and logging
  useEffect(() => {
    const startTime = new Date();
    setFormStartTime(startTime);
    
    // Log form initialization
    logger.logFormStart('client_onboarding', {
      token: token ? token.substring(0, 10) + '...' : null,
      initialStep: currentStep,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer
    });

    logComponentAction('FORM_INITIALIZED', {
      token: token ? 'present' : 'missing',
      startTime: startTime.toISOString()
    });

    console.log('🎯 COMPREHENSIVE LOGGING: Client Onboarding Form initialized', {
      token: token ? token.substring(0, 10) + '...' : null,
      startTime: startTime.toISOString(),
      loggingEnabled: true
    });
  }, [token, currentStep, logComponentAction]);

  // Track step changes with detailed logging
  useEffect(() => {
    const currentTime = new Date();
    const previousStep = Object.keys(stepTimes).length;
    
    setStepTimes(prev => ({
      ...prev,
      [`step${currentStep}`]: currentTime
    }));

    if (previousStep > 0 && previousStep !== currentStep) {
      const stepDuration = currentTime - (stepTimes[`step${previousStep}`] || formStartTime);
      
      logger.logStepTransition(previousStep, currentStep, {
        stepDuration: `${stepDuration}ms`,
        totalFormTime: `${currentTime - formStartTime}ms`,
        timestamp: currentTime.toISOString()
      });

      logComponentAction('STEP_CHANGE', {
        fromStep: previousStep,
        toStep: currentStep,
        stepDuration: `${stepDuration}ms`
      });
    }

    console.log(`📍 STEP TRACKING: Moved to step ${currentStep}`, {
      timestamp: currentTime.toISOString(),
      totalSteps: FORM_STEPS.length
    });
  }, [currentStep, stepTimes, formStartTime, logComponentAction]);

  // Watch for form errors and log validation issues
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([fieldName, error]) => {
        logFormValidationError(fieldName, error.message || 'Validation failed', {
          errorType: error.type,
          currentStep
        });
      });

      logComponentAction('VALIDATION_ERRORS_DETECTED', {
        errorCount: Object.keys(errors).length,
        errorFields: Object.keys(errors),
        currentStep
      });
    }
  }, [errors, currentStep, logFormValidationError, logComponentAction]);

  // Load invitation data with logging
  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setLoading(true);
        
        logger.logSystemEvent('INVITATION_LOAD_START', {
          token: token ? token.substring(0, 10) + '...' : null
        });

        console.log('🔄 Loading invitation data...', { token: token ? 'present' : 'missing' });

        const response = await clientAPI.getOnboardingForm(token);
        
        if (response.success) {
          setInvitation(response.data);
          
          // Pre-populate form with existing data if any
          if (response.data.existingData) {
            reset(response.data.existingData);
            setCurrentStep(response.data.currentStep || 1);
            setCompletedSteps(response.data.completedSteps || []);
            
            logger.logSystemEvent('EXISTING_DATA_LOADED', {
              currentStep: response.data.currentStep,
              completedSteps: response.data.completedSteps?.length || 0,
              hasExistingData: true
            });
          }
          
          logger.logSystemEvent('INVITATION_LOAD_SUCCESS', {
            advisor: response.data.advisor?.firstName,
            clientEmail: response.data.clientEmail,
            hasExistingData: !!response.data.existingData
          });

          logComponentAction('INVITATION_LOADED', {
            success: true,
            advisorName: response.data.advisor?.firstName,
            hasExistingData: !!response.data.existingData
          });

          console.log('✅ Invitation loaded successfully', {
            advisor: response.data.advisor?.firstName,
            hasExistingData: !!response.data.existingData
          });
        } else {
          throw new Error(response.message || 'Failed to load invitation');
        }
      } catch (error) {
        console.error('❌ Failed to load invitation:', error);
        
        logger.logError(error, 'ClientOnboardingForm', 'high', {
          action: 'loadInvitation',
          token: token ? 'present' : 'missing'
        });

        logComponentAction('INVITATION_LOAD_FAILED', {
          error: error.message,
          token: token ? 'present' : 'missing'
        });

        toast.error('Failed to load onboarding form. Please check the link.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvitation();
    }
  }, [token, navigate, reset, logComponentAction]);

  // Calculate real-time financial summaries with logging
  const watchedValues = watch();
  const financialSummary = calculateFinancialSummary(watchedValues);
  const assetsLiabilities = calculateAssetsLiabilities(watchedValues);

  // Log significant financial changes
  useEffect(() => {
    if (financialSummary.netWorth !== 0) {
      logCustomFormEvent('FINANCIAL_SUMMARY_CALCULATED', {
        monthlyIncome: financialSummary.monthlyIncome,
        monthlySavings: financialSummary.monthlySavings,
        savingsRate: financialSummary.savingsRate,
        netWorth: assetsLiabilities.netWorth
      });
    }
  }, [financialSummary, assetsLiabilities, logCustomFormEvent]);

  // Save draft functionality with comprehensive logging
  const saveDraft = async () => {
    try {
      setSavingDraft(true);
      const startTime = Date.now();
      const formData = getValues();
      
      logger.logUserInteraction('DRAFT_SAVE_INITIATED', null, {
        currentStep,
        formDataSize: JSON.stringify(formData).length,
        completedSteps: completedSteps.length
      });

      console.log('💾 Saving draft...', { 
        currentStep, 
        formDataSize: JSON.stringify(formData).length,
        completedSteps: completedSteps.length
      });

      const response = await clientAPI.saveOnboardingDraft(token, {
        formData,
        currentStep,
        completedSteps,
        lastSavedAt: new Date().toISOString(),
        financialSummary,
        assetsLiabilities
      });

      const saveTime = Date.now() - startTime;

      if (response.success) {
        logFormDraftSave({
          saveTime: `${saveTime}ms`,
          dataSize: JSON.stringify(formData).length,
          success: true
        });

        logComponentAction('DRAFT_SAVED_SUCCESS', {
          saveTime: `${saveTime}ms`,
          currentStep
        });

        toast.success('Draft saved successfully!');
        console.log('✅ Draft saved successfully in', `${saveTime}ms`);
      } else {
        throw new Error(response.message || 'Failed to save draft');
      }
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      
      logger.logError(error, 'ClientOnboardingForm', 'medium', {
        action: 'saveDraft',
        currentStep,
        formSize: JSON.stringify(getValues()).length
      });

      logComponentAction('DRAFT_SAVE_FAILED', {
        error: error.message,
        currentStep
      });

      toast.error('Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Next step handler with validation logging
  const nextStep = async () => {
    try {
      const stepStartTime = Date.now();
      
      logger.logUserInteraction('NEXT_STEP_ATTEMPTED', null, {
        currentStep,
        targetStep: currentStep + 1
      });

      // Validate current step
      const stepValidation = validateFormStep(currentStep, getValues());
      
      if (!stepValidation.isValid) {
        stepValidation.errors.forEach(error => {
          logFormValidationError('step_validation', error, {
            currentStep,
            validationType: 'step_completion'
          });
        });

        logComponentAction('STEP_VALIDATION_FAILED', {
          currentStep,
          errors: stepValidation.errors
        });

        console.log('❌ Step validation failed:', stepValidation.errors);
        toast.error(`Please fix the following: ${stepValidation.errors.join(', ')}`);
        return;
      }

      // Trigger form validation for current step fields
      const isValid = await trigger();
      if (!isValid) {
        logComponentAction('FORM_VALIDATION_FAILED', {
          currentStep,
          errorFields: Object.keys(errors)
        });

        toast.error('Please fix the validation errors before proceeding.');
        return;
      }

      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      // Auto-save on step completion
      await saveDraft();

      // Move to next step
      if (currentStep < FORM_STEPS.length) {
        const nextStepNumber = currentStep + 1;
        setCurrentStep(nextStepNumber);
        
        const stepTime = Date.now() - stepStartTime;
        
        logComponentAction('STEP_ADVANCED', {
          fromStep: currentStep,
          toStep: nextStepNumber,
          stepCompletionTime: `${stepTime}ms`,
          autoSaved: true
        });

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`✅ Advanced to step ${nextStepNumber} in ${stepTime}ms`);
      }
    } catch (error) {
      console.error('❌ Error in nextStep:', error);
      
      logger.logError(error, 'ClientOnboardingForm', 'medium', {
        action: 'nextStep',
        currentStep
      });

      logComponentAction('NEXT_STEP_ERROR', {
        error: error.message,
        currentStep
      });

      toast.error('An error occurred. Please try again.');
    }
  };

  // Previous step handler with logging
  const prevStep = () => {
    if (currentStep > 1) {
      const previousStepNumber = currentStep - 1;
      
      logger.logUserInteraction('PREVIOUS_STEP', null, {
        fromStep: currentStep,
        toStep: previousStepNumber
      });

      logComponentAction('STEP_BACK', {
        fromStep: currentStep,
        toStep: previousStepNumber
      });

      setCurrentStep(previousStepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log(`⬅️ Moved back to step ${previousStepNumber}`);
    }
  };

  // Final form submission with comprehensive logging
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const submitStartTime = Date.now();
      const totalFormTime = submitStartTime - formStartTime.getTime();
      
      logger.logUserInteraction('FORM_SUBMISSION_STARTED', null, {
        totalFormTime: `${totalFormTime}ms`,
        completedSteps: completedSteps.length,
        hasCASData: !!casData,
        formDataSize: JSON.stringify(data).length
      });

      console.log('🚀 COMPREHENSIVE LOGGING: Starting form submission...', {
        formDataSize: JSON.stringify(data).length,
        totalFormTime: `${totalFormTime}ms`,
        completedSteps,
        hasCASData: !!casData
      });

      // Final validation with logging
      const completeValidation = validateCompleteForm(data);
      if (!completeValidation.isValid) {
        completeValidation.errors.forEach(error => {
          logFormValidationError('final_validation', error, {
            validationType: 'form_completion'
          });
        });

        logComponentAction('FINAL_VALIDATION_FAILED', {
          errors: completeValidation.errors
        });

        toast.error(`Please complete all required fields: ${completeValidation.errors.join(', ')}`);
        return;
      }

      // Prepare submission data with metadata
      const submissionData = {
        ...data,
        casData: casData,
        formMetadata: {
          completedSteps,
          formStartTime,
          stepTimes,
          totalTimeSpent: Math.round(totalFormTime / 1000 / 60), // minutes
          financialSummary,
          assetsLiabilities,
          submissionTimestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          viewport: { width: window.innerWidth, height: window.innerHeight }
        }
      };

      // Submit to server
      const response = await clientAPI.submitOnboardingForm(token, submissionData);
      const submitTime = Date.now() - submitStartTime;

      if (response.success) {
        logFormComplete({
          totalTime: `${totalFormTime}ms`,
          submitTime: `${submitTime}ms`,
          clientId: response.clientId,
          success: true
        });

        logComponentAction('FORM_SUBMITTED_SUCCESS', {
          totalTime: `${totalFormTime}ms`,
          submitTime: `${submitTime}ms`,
          clientId: response.clientId
        });

        console.log('✅ COMPREHENSIVE LOGGING: Form submitted successfully!', {
          clientId: response.clientId,
          totalTime: `${totalFormTime}ms`,
          submitTime: `${submitTime}ms`
        });

        toast.success('🎉 Onboarding completed successfully!');
        
        // Redirect to success page
        setTimeout(() => {
          navigate('/onboarding-success');
        }, 2000);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error) {
      const submitTime = Date.now() - Date.now(); // This would be actual submit time
      
      console.error('❌ COMPREHENSIVE LOGGING: Form submission failed:', error);
      
      logger.logError(error, 'ClientOnboardingForm', 'high', {
        action: 'formSubmission',
        formSize: JSON.stringify(data).length,
        completedSteps: completedSteps.length
      });

      logComponentAction('FORM_SUBMISSION_FAILED', {
        error: error.message,
        submitTime: `${submitTime}ms`
      });

      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle CAS events with logging
  const handleCASUpload = (filename, fileSize) => {
    logCASUpload(filename, fileSize, {
      currentStep,
      formContext: 'onboarding'
    });
  };

  const handleCASParseComplete = (totalValue, accounts) => {
    setCasData({ summary: { total_value: totalValue }, accounts });
    logCASParseComplete(totalValue, accounts, {
      currentStep,
      formContext: 'onboarding'
    });
  };

  const handleCASError = (error) => {
    logCASError(error, {
      currentStep,
      formContext: 'onboarding'
    });
  };

  // Render current step component with enhanced props
  const renderCurrentStep = () => {
    const stepProps = {
      register,
      errors,
      watch,
      setValue,
      getValues,
      token,
      // CAS event handlers
      onCASUpload: handleCASUpload,
      onCASParseComplete: handleCASParseComplete,
      onCASError: handleCASError
    };

    switch (currentStep) {
      case 1:
        return <Step1PersonalInfo {...stepProps} />;
      case 2:
        return <Step2IncomeEmployment {...stepProps} />;
      case 3:
        return <Step3RetirementGoals {...stepProps} />;
      case 4:
        return <Step4AssetsLiabilities {...stepProps} />;
      case 5:
        return <Step5InvestmentProfile {...stepProps} />;
      default:
        logger.logError(new Error(`Invalid step: ${currentStep}`), 'ClientOnboardingForm', 'medium', {
          currentStep,
          totalSteps: FORM_STEPS.length
        });
        return <div>Invalid step</div>;
    }
  };

  // Loading state with logging
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading onboarding form...</div>
        </div>
      </div>
    );
  }

  // Error state with logging
  if (!invitation) {
    logComponentAction('INVALID_INVITATION', {
      token: token ? 'present' : 'missing'
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Invalid Link</div>
          <div className="text-gray-600">This onboarding link is invalid or has expired.</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundaryLogger 
      name="ClientOnboardingForm"
      onError={(error, errorInfo) => {
        logComponentAction('ERROR_BOUNDARY_TRIGGERED', {
          error: error.message,
          currentStep,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <div className="min-h-screen bg-gray-50" ref={componentRef}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Client Onboarding</h1>
              <p className="text-gray-600 mt-2">
                Welcome! Let's get your financial profile set up with {invitation.advisor?.firstName || 'your advisor'}.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress Indicator */}
          <ProgressIndicator 
            currentStep={currentStep} 
            completedSteps={completedSteps}
          />

          {/* Form Container */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Current Step Content */}
            {renderCurrentStep()}

            {/* Navigation with Logged Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              {/* Previous Button */}
              <div>
                {currentStep > 1 && (
                  <ButtonLogger 
                    buttonName="Previous Step"
                    onClick={prevStep}
                    className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    metadata={{ currentStep, action: 'previous' }}
                  >
                    <span>← Previous</span>
                  </ButtonLogger>
                )}
              </div>

              {/* Center - Step Info */}
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {FORM_STEPS.length}
                </div>
              </div>

              {/* Right Side Buttons */}
              <div className="flex items-center space-x-3">
                {/* Save Draft Button */}
                <ButtonLogger
                  buttonName="Save Draft"
                  onClick={saveDraft}
                  disabled={savingDraft}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  metadata={{ currentStep, action: 'save_draft', saving: savingDraft }}
                >
                  <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
                </ButtonLogger>

                {/* Next/Submit Button */}
                <ButtonLogger
                  buttonName={currentStep === FORM_STEPS.length ? 'Complete Onboarding' : 'Next Step'}
                  onClick={currentStep === FORM_STEPS.length ? handleSubmit(onSubmit) : nextStep}
                  disabled={submitting}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                    currentStep === FORM_STEPS.length
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  metadata={{ 
                    currentStep, 
                    action: currentStep === FORM_STEPS.length ? 'submit' : 'next',
                    submitting 
                  }}
                >
                  <span>{submitting ? 'Submitting...' : (currentStep === FORM_STEPS.length ? 'Complete' : 'Next →')}</span>
                </ButtonLogger>
              </div>
            </div>
          </form>

          {/* Required Fields Checklist Modal */}
          {showRequiredFieldsChecklist && (
            <RequiredFieldsChecklist
              formData={watchedValues}
              errors={errors}
              onClose={() => setShowRequiredFieldsChecklist(false)}
              currentStep={currentStep}
            />
          )}
        </div>

        {/* Debug Panel (Development only) */}
        <DebugPanel
          formData={watchedValues}
          errors={errors}
          currentStep={currentStep}
          casData={casData}
          casUploadStatus={casUploadStatus}
          formStartTime={formStartTime}
          token={token}
          invitation={invitation}
        />
      </div>
    </ErrorBoundaryLogger>
  );
}

export default ClientOnboardingFormWithLogging;