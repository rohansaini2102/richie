// Enhanced Error Boundary with comprehensive logging
import React from 'react';
import logger from '../../services/Logger';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundaryLogger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enhanced error metadata
    const enhancedErrorInfo = {
      ...errorInfo,
      errorBoundary: this.props.name || 'ErrorBoundary',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorId,
      retryCount: this.state.retryCount,
      props: this.filterProps(this.props),
      state: this.filterState(this.state),
      stackTrace: error.stack,
      errorMessage: error.message,
      errorName: error.name,
      componentStack: errorInfo.componentStack,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: this.getRelevantLocalStorage(),
      sessionStorage: this.getRelevantSessionStorage()
    };

    // Log the error with comprehensive context
    logger.logCriticalError(error, this.props.name || 'ErrorBoundary', enhancedErrorInfo);

    // Also log to console for development
    console.group(`🚨 ERROR BOUNDARY TRIGGERED: ${this.props.name || 'Unknown'}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Enhanced Context:', enhancedErrorInfo);
    console.groupEnd();

    // Update state with error info
    this.setState({
      error,
      errorInfo: enhancedErrorInfo,
      errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, enhancedErrorInfo);
    }

    // Send critical error alert (in production, this might trigger monitoring alerts)
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorAlert(error, enhancedErrorInfo);
    }
  }

  filterProps(props) {
    // Filter out potentially sensitive or large props
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
    const filtered = {};
    
    Object.keys(props).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        filtered[key] = '[FILTERED]';
      } else if (typeof props[key] === 'function') {
        filtered[key] = '[Function]';
      } else if (typeof props[key] === 'object' && props[key] !== null) {
        filtered[key] = '[Object]';
      } else {
        filtered[key] = props[key];
      }
    });
    
    return filtered;
  }

  filterState(state) {
    // Filter out error-related state to avoid recursion
    const { hasError, error, errorInfo, ...filteredState } = state;
    return filteredState;
  }

  getRelevantLocalStorage() {
    try {
      const relevantKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('richieat_') || key.includes('form') || key.includes('user')
      );
      
      const relevantData = {};
      relevantKeys.forEach(key => {
        try {
          relevantData[key] = localStorage.getItem(key);
        } catch (e) {
          relevantData[key] = '[Error reading]';
        }
      });
      
      return relevantData;
    } catch (error) {
      return { error: 'Could not access localStorage' };
    }
  }

  getRelevantSessionStorage() {
    try {
      const relevantKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('richieat_') || key.includes('form') || key.includes('session')
      );
      
      const relevantData = {};
      relevantKeys.forEach(key => {
        try {
          relevantData[key] = sessionStorage.getItem(key);
        } catch (e) {
          relevantData[key] = '[Error reading]';
        }
      });
      
      return relevantData;
    } catch (error) {
      return { error: 'Could not access sessionStorage' };
    }
  }

  sendErrorAlert(error, errorInfo) {
    // In production, this could send alerts to monitoring services
    // For now, we'll just use the logger
    logger.logSystemEvent('CRITICAL_ERROR_ALERT', {
      errorId: errorInfo.errorId,
      component: errorInfo.errorBoundary,
      severity: 'critical',
      requiresImmediateAttention: true
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    logger.logUserInteraction('ERROR_BOUNDARY_RETRY', null, {
      errorId: this.state.errorId,
      retryCount: newRetryCount,
      component: this.props.name || 'ErrorBoundary'
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });
  };

  handleGoHome = () => {
    logger.logUserInteraction('ERROR_BOUNDARY_GO_HOME', null, {
      errorId: this.state.errorId,
      component: this.props.name || 'ErrorBoundary'
    });

    window.location.href = '/';
  };

  handleReportIssue = () => {
    logger.logUserInteraction('ERROR_BOUNDARY_REPORT_ISSUE', null, {
      errorId: this.state.errorId,
      component: this.props.name || 'ErrorBoundary'
    });

    // Copy error details to clipboard for easy reporting
    const errorDetails = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      timestamp: new Date().toISOString(),
      component: this.props.name || 'ErrorBoundary',
      url: window.location.href
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
        .then(() => {
          alert('Error details copied to clipboard. Please share this with support.');
        })
        .catch(() => {
          alert(`Error details:\n${JSON.stringify(errorDetails, null, 2)}`);
        });
    } else {
      alert(`Error details:\n${JSON.stringify(errorDetails, null, 2)}`);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, {
          retry: this.handleRetry,
          goHome: this.handleGoHome,
          reportIssue: this.handleReportIssue
        });
      }

      // Minimal fallback UI
      if (this.props.minimal) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">
                Something went wrong in {this.props.name || 'this section'}
              </span>
            </div>
            <button
              onClick={this.handleRetry}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      }

      // Default comprehensive fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              {this.props.name && `An error occurred in ${this.props.name}. `}
              We've been notified and are working to fix this issue.
            </p>

            {/* Error ID */}
            {this.state.errorId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6 text-sm">
                <span className="text-gray-500">Error ID: </span>
                <span className="font-mono text-gray-800">{this.state.errorId}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </button>

              <button
                onClick={this.handleReportIssue}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Bug className="h-4 w-4" />
                <span>Report Issue</span>
              </button>
            </div>

            {/* Developer Info */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Developer Info (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error?.message}
                  </div>
                  <div className="mb-2">
                    <strong>Component:</strong> {this.props.name || 'Unknown'}
                  </div>
                  <div className="mb-2">
                    <strong>Retry Count:</strong> {this.state.retryCount}
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap bg-gray-200 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Higher-Order Component for easy wrapping
export const withErrorBoundary = (
  WrappedComponent, 
  errorBoundaryProps = {}
) => {
  const ComponentWithErrorBoundary = (props) => {
    return (
      <ErrorBoundaryLogger
        name={WrappedComponent.displayName || WrappedComponent.name}
        {...errorBoundaryProps}
      >
        <WrappedComponent {...props} />
      </ErrorBoundaryLogger>
    );
  };

  ComponentWithErrorBoundary.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
};

// Hook for manual error reporting within components
export const useErrorReporting = (componentName) => {
  const reportError = (error, context = {}) => {
    logger.logApplicationError(error, componentName, 'medium', {
      manuallyReported: true,
      ...context
    });
  };

  const reportCriticalError = (error, context = {}) => {
    logger.logCriticalError(error, componentName, {
      manuallyReported: true,
      ...context
    });
  };

  return { reportError, reportCriticalError };
};

export default ErrorBoundaryLogger;