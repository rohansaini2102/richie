// Higher-Order Component for automatic button logging
import React, { forwardRef } from 'react';
import logger from '../../services/Logger';

/**
 * HOC that wraps any component to add automatic click logging
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Logging options
 */
export const withButtonLogging = (WrappedComponent, options = {}) => {
  const LoggedComponent = forwardRef((props, ref) => {
    const {
      logLevel = 'info',
      includeProps = false,
      customLogger,
      excludeProps = ['children', 'className', 'style']
    } = options;

    const handleClick = (event) => {
      // Get button information
      const buttonInfo = {
        text: event.target.textContent?.trim() || '',
        value: event.target.value || '',
        name: event.target.name || '',
        id: event.target.id || '',
        className: event.target.className || '',
        type: event.target.type || 'button'
      };

      // Prepare metadata
      const metadata = {
        component: WrappedComponent.displayName || WrappedComponent.name || 'Unknown',
        buttonInfo,
        timestamp: new Date().toISOString(),
        coordinates: {
          x: event.clientX,
          y: event.clientY
        }
      };

      // Include props if requested
      if (includeProps) {
        const propsToLog = Object.keys(props)
          .filter(key => !excludeProps.includes(key))
          .reduce((obj, key) => {
            obj[key] = typeof props[key] === 'function' ? '[Function]' : props[key];
            return obj;
          }, {});
        metadata.props = propsToLog;
      }

      // Use custom logger or default
      const loggerToUse = customLogger || logger;
      loggerToUse.logButtonClick(
        buttonInfo.text || buttonInfo.value || `${buttonInfo.type}_button`,
        event.target,
        metadata
      );

      // Call original onClick if it exists
      if (props.onClick) {
        props.onClick(event);
      }
    };

    return (
      <WrappedComponent
        {...props}
        onClick={handleClick}
        ref={ref}
      />
    );
  });

  LoggedComponent.displayName = `withButtonLogging(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return LoggedComponent;
};

/**
 * Pre-configured logged button component
 */
export const LoggedButton = withButtonLogging('button');

/**
 * Automatic button logging component that can wrap any clickable element
 */
export const ButtonLogger = ({ 
  children, 
  buttonName,
  metadata = {},
  logLevel = 'info',
  disabled = false,
  ...props 
}) => {
  const handleClick = (event) => {
    if (disabled) return;

    // Extract button information
    const element = event.currentTarget;
    const extractedName = buttonName || 
                         element.textContent?.trim() || 
                         element.getAttribute('aria-label') ||
                         element.id ||
                         'unnamed_button';

    // Log the button click
    logger.logButtonClick(extractedName, element, {
      disabled,
      ...metadata
    });

    // Call original onClick
    if (props.onClick && !disabled) {
      props.onClick(event);
    }
  };

  return (
    <div 
      {...props} 
      onClick={handleClick}
      style={{ 
        ...(props.style || {}),
        ...(disabled ? { pointerEvents: 'none', opacity: 0.5 } : {})
      }}
    >
      {children}
    </div>
  );
};

/**
 * Form field logging wrapper
 */
export const LoggedInput = forwardRef(({ 
  name,
  onChange,
  onFocus,
  onBlur,
  logChanges = true,
  logFocus = false,
  component = 'LoggedInput',
  ...props 
}, ref) => {
  const fieldName = name || props.id || 'unnamed_field';
  let previousValue = props.defaultValue || props.value || '';

  const handleChange = (event) => {
    if (logChanges) {
      const newValue = event.target.value;
      logger.logFormFieldChange(fieldName, previousValue, newValue, {
        component,
        fieldType: props.type || 'text',
        required: props.required || false
      });
      previousValue = newValue;
    }

    if (onChange) {
      onChange(event);
    }
  };

  const handleFocus = (event) => {
    if (logFocus) {
      logger.logFormFieldFocus(fieldName, {
        component,
        fieldType: props.type || 'text'
      });
    }

    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    if (logFocus) {
      logger.logFormFieldBlur(fieldName, event.target.value, {
        component,
        fieldType: props.type || 'text'
      });
    }

    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <input
      {...props}
      name={name}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={ref}
    />
  );
});

LoggedInput.displayName = 'LoggedInput';

/**
 * Select field logging wrapper
 */
export const LoggedSelect = forwardRef(({ 
  name,
  onChange,
  onFocus,
  onBlur,
  logChanges = true,
  logFocus = false,
  component = 'LoggedSelect',
  children,
  ...props 
}, ref) => {
  const fieldName = name || props.id || 'unnamed_select';
  let previousValue = props.defaultValue || props.value || '';

  const handleChange = (event) => {
    if (logChanges) {
      const newValue = event.target.value;
      const selectedOption = event.target.options[event.target.selectedIndex];
      logger.logFormFieldChange(fieldName, previousValue, newValue, {
        component,
        fieldType: 'select',
        selectedText: selectedOption?.text,
        required: props.required || false
      });
      previousValue = newValue;
    }

    if (onChange) {
      onChange(event);
    }
  };

  const handleFocus = (event) => {
    if (logFocus) {
      logger.logFormFieldFocus(fieldName, {
        component,
        fieldType: 'select'
      });
    }

    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    if (logFocus) {
      logger.logFormFieldBlur(fieldName, event.target.value, {
        component,
        fieldType: 'select'
      });
    }

    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <select
      {...props}
      name={name}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={ref}
    >
      {children}
    </select>
  );
});

LoggedSelect.displayName = 'LoggedSelect';

/**
 * Textarea logging wrapper
 */
export const LoggedTextarea = forwardRef(({ 
  name,
  onChange,
  onFocus,
  onBlur,
  logChanges = true,
  logFocus = false,
  component = 'LoggedTextarea',
  ...props 
}, ref) => {
  const fieldName = name || props.id || 'unnamed_textarea';
  let previousValue = props.defaultValue || props.value || '';

  const handleChange = (event) => {
    if (logChanges) {
      const newValue = event.target.value;
      logger.logFormFieldChange(fieldName, previousValue, newValue, {
        component,
        fieldType: 'textarea',
        textLength: newValue.length,
        required: props.required || false
      });
      previousValue = newValue;
    }

    if (onChange) {
      onChange(event);
    }
  };

  const handleFocus = (event) => {
    if (logFocus) {
      logger.logFormFieldFocus(fieldName, {
        component,
        fieldType: 'textarea'
      });
    }

    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    if (logFocus) {
      logger.logFormFieldBlur(fieldName, event.target.value, {
        component,
        fieldType: 'textarea'
      });
    }

    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <textarea
      {...props}
      name={name}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={ref}
    />
  );
});

LoggedTextarea.displayName = 'LoggedTextarea';

/**
 * File input logging wrapper
 */
export const LoggedFileInput = forwardRef(({ 
  name,
  onChange,
  onFocus,
  logChanges = true,
  component = 'LoggedFileInput',
  ...props 
}, ref) => {
  const fieldName = name || props.id || 'unnamed_file_input';

  const handleChange = (event) => {
    if (logChanges) {
      const files = Array.from(event.target.files);
      logger.logFormFieldChange(fieldName, '', `${files.length} files selected`, {
        component,
        fieldType: 'file',
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        })),
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
      });
    }

    if (onChange) {
      onChange(event);
    }
  };

  const handleFocus = (event) => {
    logger.logFormFieldFocus(fieldName, {
      component,
      fieldType: 'file'
    });

    if (onFocus) {
      onFocus(event);
    }
  };

  return (
    <input
      {...props}
      type="file"
      name={name}
      onChange={handleChange}
      onFocus={handleFocus}
      ref={ref}
    />
  );
});

LoggedFileInput.displayName = 'LoggedFileInput';

/**
 * Generic form element wrapper that automatically detects the type
 */
export const LoggedFormElement = ({ as: Component = 'input', ...props }) => {
  const elementType = props.type || Component;
  
  switch (elementType) {
    case 'select':
      return <LoggedSelect {...props} />;
    case 'textarea':
      return <LoggedTextarea {...props} />;
    case 'file':
      return <LoggedFileInput {...props} />;
    default:
      return <LoggedInput {...props} />;
  }
};

export default withButtonLogging;