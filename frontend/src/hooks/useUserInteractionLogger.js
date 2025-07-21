// Custom hook for automatic user interaction logging
import { useEffect, useRef } from 'react';
import logger from '../services/Logger';

/**
 * Hook to automatically log user interactions within a component
 * @param {string} componentName - Name of the component for logging context
 * @param {Object} options - Configuration options
 */
export const useUserInteractionLogger = (componentName, options = {}) => {
  const componentRef = useRef(null);
  const {
    logClicks = true,
    logFormChanges = true,
    logFocus = false,
    logHovers = false,
    logScrolls = false,
    debounceMs = 300,
    excludeElements = []
  } = options;

  useEffect(() => {
    if (!componentRef.current) return;

    const component = componentRef.current;
    const debounceTimers = new Map();
    
    // Debounce helper
    const debounce = (key, callback, delay) => {
      const existingTimer = debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      const timer = setTimeout(() => {
        callback();
        debounceTimers.delete(key);
      }, delay);
      
      debounceTimers.set(key, timer);
    };

    // Helper to check if element should be excluded
    const shouldExclude = (element) => {
      return excludeElements.some(selector => element.matches(selector));
    };

    // Helper to get element identifier
    const getElementIdentifier = (element) => {
      if (element.id) return `#${element.id}`;
      if (element.className) return `.${element.className.split(' ')[0]}`;
      return element.tagName.toLowerCase();
    };

    // Helper to get form field name
    const getFormFieldName = (element) => {
      return element.name || element.id || getElementIdentifier(element);
    };

    // Click Event Logging
    const handleClick = (event) => {
      if (!logClicks || shouldExclude(event.target)) return;
      
      const element = event.target;
      const elementId = getElementIdentifier(element);
      
      let actionType = 'CLICK';
      let actionName = elementId;
      
      // Identify button clicks
      if (element.tagName === 'BUTTON' || element.type === 'button') {
        actionType = 'BUTTON_CLICK';
        actionName = element.textContent?.trim() || element.value || elementId;
      }
      
      // Identify link clicks
      else if (element.tagName === 'A') {
        actionType = 'LINK_CLICK';
        actionName = element.textContent?.trim() || element.href || elementId;
      }
      
      logger.logUserInteraction(`${actionType}: ${actionName}`, element, {
        component: componentName,
        actionType,
        elementId,
        coordinates: {
          x: event.clientX,
          y: event.clientY
        }
      });
    };

    // Form Change Event Logging
    const handleFormChange = (event) => {
      if (!logFormChanges || shouldExclude(event.target)) return;
      
      const element = event.target;
      const fieldName = getFormFieldName(element);
      const newValue = element.value;
      const oldValue = element.dataset.lastValue || '';
      
      // Store current value for next comparison
      element.dataset.lastValue = newValue;
      
      debounce(`form-change-${fieldName}`, () => {
        logger.logFormFieldChange(fieldName, oldValue, newValue, {
          component: componentName,
          fieldType: element.type,
          elementId: getElementIdentifier(element)
        });
      }, debounceMs);
    };

    // Focus Event Logging
    const handleFocus = (event) => {
      if (!logFocus || shouldExclude(event.target)) return;
      
      const element = event.target;
      const fieldName = getFormFieldName(element);
      
      logger.logFormFieldFocus(fieldName, {
        component: componentName,
        fieldType: element.type,
        elementId: getElementIdentifier(element)
      });
    };

    // Blur Event Logging
    const handleBlur = (event) => {
      if (!logFocus || shouldExclude(event.target)) return;
      
      const element = event.target;
      const fieldName = getFormFieldName(element);
      
      logger.logFormFieldBlur(fieldName, element.value, {
        component: componentName,
        fieldType: element.type,
        elementId: getElementIdentifier(element)
      });
    };

    // Hover Event Logging
    const handleMouseEnter = (event) => {
      if (!logHovers || shouldExclude(event.target)) return;
      
      const element = event.target;
      const elementId = getElementIdentifier(element);
      
      debounce(`hover-${elementId}`, () => {
        logger.logUserInteraction(`HOVER: ${elementId}`, element, {
          component: componentName,
          actionType: 'HOVER',
          elementId
        });
      }, debounceMs);
    };

    // Scroll Event Logging
    const handleScroll = (event) => {
      if (!logScrolls) return;
      
      debounce('scroll', () => {
        logger.logUserInteraction('SCROLL', event.target, {
          component: componentName,
          actionType: 'SCROLL',
          scrollTop: event.target.scrollTop || window.scrollY,
          scrollLeft: event.target.scrollLeft || window.scrollX
        });
      }, debounceMs);
    };

    // Add event listeners
    if (logClicks) {
      component.addEventListener('click', handleClick, true);
    }
    
    if (logFormChanges) {
      component.addEventListener('input', handleFormChange, true);
      component.addEventListener('change', handleFormChange, true);
    }
    
    if (logFocus) {
      component.addEventListener('focus', handleFocus, true);
      component.addEventListener('blur', handleBlur, true);
    }
    
    if (logHovers) {
      component.addEventListener('mouseenter', handleMouseEnter, true);
    }
    
    if (logScrolls) {
      component.addEventListener('scroll', handleScroll, true);
      window.addEventListener('scroll', handleScroll);
    }

    // Cleanup function
    return () => {
      // Clear all debounce timers
      debounceTimers.forEach(timer => clearTimeout(timer));
      debounceTimers.clear();
      
      // Remove event listeners
      if (logClicks) {
        component.removeEventListener('click', handleClick, true);
      }
      
      if (logFormChanges) {
        component.removeEventListener('input', handleFormChange, true);
        component.removeEventListener('change', handleFormChange, true);
      }
      
      if (logFocus) {
        component.removeEventListener('focus', handleFocus, true);
        component.removeEventListener('blur', handleBlur, true);
      }
      
      if (logHovers) {
        component.removeEventListener('mouseenter', handleMouseEnter, true);
      }
      
      if (logScrolls) {
        component.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [componentName, logClicks, logFormChanges, logFocus, logHovers, logScrolls, debounceMs, excludeElements]);

  return componentRef;
};

/**
 * Hook for logging component lifecycle events
 * @param {string} componentName - Name of the component
 */
export const useComponentLogger = (componentName) => {
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Log component mount
    logger.logUserInteraction(`COMPONENT_MOUNT: ${componentName}`, null, {
      component: componentName,
      actionType: 'COMPONENT_LIFECYCLE',
      lifecycle: 'mount',
      mountTime: mountTime.current
    });

    // Log component unmount
    return () => {
      const unmountTime = Date.now();
      const timeOnComponent = unmountTime - mountTime.current;
      
      logger.logUserInteraction(`COMPONENT_UNMOUNT: ${componentName}`, null, {
        component: componentName,
        actionType: 'COMPONENT_LIFECYCLE',
        lifecycle: 'unmount',
        timeOnComponent: `${timeOnComponent}ms`,
        unmountTime
      });
    };
  }, [componentName]);

  return {
    logComponentAction: (action, metadata = {}) => {
      logger.logUserInteraction(`${componentName}: ${action}`, null, {
        component: componentName,
        ...metadata
      });
    }
  };
};

/**
 * Hook for logging form-specific events
 * @param {string} formName - Name of the form
 * @param {number} currentStep - Current step in multi-step forms
 */
export const useFormLogger = (formName, currentStep = 1) => {
  const formStartTime = useRef(Date.now());
  const stepStartTime = useRef(Date.now());
  const previousStep = useRef(currentStep);

  // Log form start
  useEffect(() => {
    logger.logFormStart(formName, {
      startTime: formStartTime.current,
      initialStep: currentStep
    });
  }, [formName]);

  // Log step transitions
  useEffect(() => {
    if (previousStep.current !== currentStep) {
      const stepTime = Date.now() - stepStartTime.current;
      
      logger.logStepTransition(previousStep.current, currentStep, {
        formName,
        stepTime: `${stepTime}ms`,
        totalFormTime: `${Date.now() - formStartTime.current}ms`
      });
      
      previousStep.current = currentStep;
      stepStartTime.current = Date.now();
    }
  }, [currentStep, formName]);

  return {
    logFormValidationError: (fieldName, errorMessage, metadata = {}) => {
      logger.logFormValidationError(fieldName, errorMessage, {
        formName,
        currentStep,
        ...metadata
      });
    },
    
    logFormComplete: (completionData = {}) => {
      const totalTime = Date.now() - formStartTime.current;
      logger.logFormComplete(formName, `${totalTime}ms`, {
        totalSteps: currentStep,
        completionTime: totalTime,
        ...completionData
      });
    },
    
    logFormDraftSave: (metadata = {}) => {
      logger.logFormDraftSave({
        formName,
        currentStep,
        saveTime: Date.now(),
        ...metadata
      });
    },
    
    logCustomFormEvent: (event, metadata = {}) => {
      logger.log('info', 'form_progress', `${formName}: ${event}`, {
        formName,
        currentStep,
        ...metadata
      });
    }
  };
};

/**
 * Hook for logging CAS-related events
 * @param {string} context - Context where CAS events are happening
 */
export const useCASLogger = (context = 'cas-upload') => {
  return {
    logCASUpload: (filename, fileSize, metadata = {}) => {
      logger.logCASUpload(filename, fileSize, {
        context,
        ...metadata
      });
    },
    
    logCASParseStart: (metadata = {}) => {
      logger.logCASEvent('CAS_PARSE_START', {
        context,
        ...metadata
      });
    },
    
    logCASParseComplete: (totalValue, accounts, metadata = {}) => {
      logger.logCASParseComplete(totalValue, accounts, {
        context,
        ...metadata
      });
    },
    
    logCASError: (error, metadata = {}) => {
      logger.logError(error, context, 'medium', {
        casRelated: true,
        ...metadata
      });
    }
  };
};

export default useUserInteractionLogger;