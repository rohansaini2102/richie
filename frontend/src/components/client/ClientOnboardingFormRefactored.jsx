// Refactored ClientOnboardingForm - Main orchestrator component
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

// Import utilities
import { DEFAULT_FORM_VALUES, FORM_STEPS } from './constants/formConstants';
import { validateFormStep, validateCompleteForm } from './utils/formValidation';
import { calculateFinancialSummary, calculateAssetsLiabilities } from './utils/formCalculations';

function ClientOnboardingFormRefactored() {
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

  // Initialize form tracking
  useEffect(() => {
    setFormStartTime(new Date());
    console.log('🎯 REFACTORED CLIENT ONBOARDING: Form initialization started', {
      token,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    });
  }, [token]);

  // Track step changes
  useEffect(() => {
    const currentTime = new Date();
    setStepTimes(prev => ({
      ...prev,
      [`step${currentStep}`]: currentTime
    }));

    console.log(`📍 STEP CHANGE: Moved to step ${currentStep}`, {
      timestamp: currentTime.toISOString(),
      previousSteps: Object.keys(stepTimes)
    });
  }, [currentStep]);

  // Load invitation data
  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading invitation data...', { token });

        const response = await clientAPI.getOnboardingForm(token);
        
        if (response.success) {
          setInvitation(response.data);
          
          // Pre-populate form with existing data if any
          if (response.data.existingData) {
            reset(response.data.existingData);
            setCurrentStep(response.data.currentStep || 1);
            setCompletedSteps(response.data.completedSteps || []);
          }
          
          console.log('✅ Invitation loaded successfully', {
            advisor: response.data.advisor?.firstName,
            clientEmail: response.data.clientEmail,
            hasExistingData: !!response.data.existingData
          });
        } else {
          throw new Error(response.message || 'Failed to load invitation');
        }
      } catch (error) {
        console.error('❌ Failed to load invitation:', error);
        toast.error('Failed to load onboarding form. Please check the link.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvitation();
    }
  }, [token, navigate, reset]);

  // Calculate real-time financial summaries
  const watchedValues = watch();
  const financialSummary = calculateFinancialSummary(watchedValues);
  const assetsLiabilities = calculateAssetsLiabilities(watchedValues);

  // Save draft functionality
  const saveDraft = async () => {
    try {
      setSavingDraft(true);
      const formData = getValues();
      
      console.log('💾 Saving draft...', { 
        currentStep, 
        formDataSize: JSON.stringify(formData).length 
      });

      const response = await clientAPI.saveOnboardingDraft(token, {
        formData,
        currentStep,
        completedSteps,
        lastSavedAt: new Date().toISOString()
      });

      if (response.success) {
        toast.success('Draft saved successfully!');
        console.log('✅ Draft saved successfully');
      } else {
        throw new Error(response.message || 'Failed to save draft');
      }
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Next step handler
  const nextStep = async () => {
    try {
      // Validate current step
      const stepValidation = validateFormStep(currentStep, getValues());
      
      if (!stepValidation.isValid) {
        console.log('❌ Step validation failed:', stepValidation.errors);
        toast.error(`Please fix the following: ${stepValidation.errors.join(', ')}`);
        return;
      }

      // Trigger form validation for current step fields
      const isValid = await trigger();
      if (!isValid) {
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
        setCurrentStep(currentStep + 1);
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`✅ Advanced to step ${currentStep + 1}`);
      }
    } catch (error) {
      console.error('❌ Error in nextStep:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  // Previous step handler
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log(`⬅️ Moved back to step ${currentStep - 1}`);
    }
  };

  // Final form submission
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      console.log('🚀 ENHANCED: Starting form submission...', {
        formDataSize: JSON.stringify(data).length,
        completedSteps,
        hasCASData: !!casData,
        timestamp: new Date().toISOString()
      });

      // Final validation
      const completeValidation = validateCompleteForm(data);
      if (!completeValidation.isValid) {
        toast.error(`Please complete all required fields: ${completeValidation.errors.join(', ')}`);
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...data,
        casData: casData,
        formMetadata: {
          completedSteps,
          formStartTime,
          stepTimes,
          totalTimeSpent: Math.round((new Date() - formStartTime) / 1000 / 60), // minutes
          financialSummary,
          assetsLiabilities,
          submissionTimestamp: new Date().toISOString()
        }
      };

      // Submit to server
      const response = await clientAPI.submitOnboardingForm(token, submissionData);

      if (response.success) {
        console.log('✅ ENHANCED: Form submitted successfully!', {
          clientId: response.clientId,
          processingTime: Date.now() - formStartTime.getTime()
        });

        toast.success('🎉 Onboarding completed successfully!');
        
        // Redirect to success page or dashboard
        setTimeout(() => {
          navigate('/onboarding-success');
        }, 2000);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error) {
      console.error('❌ ENHANCED: Form submission failed:', error);
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    const stepProps = {
      register,
      errors,
      watch,
      setValue,
      getValues,
      token // For CAS upload in step 5
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
        return <div>Invalid step</div>;
    }
  };

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

  if (!invitation) {
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
    <div className="min-h-screen bg-gray-50">
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

          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            totalSteps={FORM_STEPS.length}
            onPrevious={prevStep}
            onNext={currentStep === FORM_STEPS.length ? handleSubmit(onSubmit) : nextStep}
            onSave={saveDraft}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === FORM_STEPS.length}
            isNextDisabled={submitting}
            isSaving={savingDraft}
            savingText="Saving Draft..."
            nextText={submitting ? "Submitting..." : "Next Step"}
          />
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
  );
}

export default ClientOnboardingFormRefactored;