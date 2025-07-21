// Navigation controls for multi-step form
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';

const FormNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSave, 
  isFirstStep, 
  isLastStep, 
  isNextDisabled = false,
  isSaving = false,
  savingText = "Saving...",
  nextText = "Next Step",
  previousText = "Previous",
  saveText = "Save Draft"
}) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      {/* Previous Button */}
      <div>
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{previousText}</span>
          </button>
        )}
      </div>

      {/* Center - Step Info */}
      <div className="text-center">
        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center space-x-3">
        {/* Save Draft Button */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{savingText}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span className="text-sm">{saveText}</span>
              </>
            )}
          </button>
        )}

        {/* Next/Submit Button */}
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || isSaving}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLastStep
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <span>{isLastStep ? 'Complete Onboarding' : nextText}</span>
          {!isLastStep && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default FormNavigation;