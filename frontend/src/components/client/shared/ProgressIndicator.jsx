// Progress indicator for multi-step form
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { FORM_STEPS } from '../constants/formConstants';

const ProgressIndicator = ({ currentStep, completedSteps = [] }) => {
  const steps = FORM_STEPS;
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  currentStep === step.id
                    ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                    : completedSteps.includes(step.id)
                    ? 'border-green-500 bg-green-500 text-white'
                    : currentStep > step.id
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {completedSteps.includes(step.id) || currentStep > step.id ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="font-bold text-sm">{step.id}</span>
                )}
              </div>
              
              {/* Step Info */}
              <div className="mt-2 text-center max-w-24">
                <div
                  className={`text-xs font-medium ${
                    currentStep === step.id
                      ? 'text-blue-600'
                      : completedSteps.includes(step.id) || currentStep > step.id
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                {currentStep === step.id && (
                  <div className="text-xs text-gray-500 mt-1">
                    {step.estimatedTime}
                  </div>
                )}
              </div>
            </div>
            
            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <ArrowRight
                className={`h-5 w-5 mx-4 ${
                  currentStep > step.id
                    ? 'text-green-500'
                    : currentStep === step.id
                    ? 'text-blue-500'
                    : 'text-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {Math.round((currentStep / steps.length) * 100)}%
          </span>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;