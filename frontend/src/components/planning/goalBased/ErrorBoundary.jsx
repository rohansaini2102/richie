import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  BugReport
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 [ErrorBoundary] Component error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo
    });

    // Log to external service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            {/* Error Icon */}
            <Box sx={{ mb: 3 }}>
              <ErrorOutline sx={{ fontSize: 64, color: '#dc2626' }} />
            </Box>

            {/* Error Title */}
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>
              Oops! Something went wrong
            </Typography>

            {/* Error Description */}
            <Typography variant="body1" sx={{ color: '#6b7280', mb: 4, maxWidth: 500, mx: 'auto' }}>
              We encountered an unexpected error while loading the goal-based planning interface. 
              This might be a temporary issue.
            </Typography>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                sx={{ bgcolor: '#2563eb' }}
              >
                Try Again
              </Button>
              
              {this.props.onGoBack && (
                <Button
                  variant="outlined"
                  onClick={this.props.onGoBack}
                  sx={{ borderColor: '#6b7280', color: '#6b7280' }}
                >
                  Go Back
                </Button>
              )}
            </Box>

            {/* Retry Count Notice */}
            {this.state.retryCount > 0 && (
              <Alert severity="info" sx={{ textAlign: 'left', mb: 3 }}>
                Retry attempt: {this.state.retryCount}
                {this.state.retryCount >= 2 && 
                  ' - If the problem persists, please refresh the page or contact support.'
                }
              </Alert>
            )}

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ textAlign: 'left' }}>
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BugReport sx={{ fontSize: 20, color: '#f59e0b', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: '#f59e0b' }}>
                    Development Error Details
                  </Typography>
                </Box>

                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Error Message:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {this.state.error.message}
                  </Typography>
                </Alert>

                {this.state.error.stack && (
                  <Alert severity="warning">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Stack Trace:
                    </Typography>
                    <Box sx={{ 
                      maxHeight: 200, 
                      overflow: 'auto', 
                      bgcolor: '#f8fafc', 
                      p: 1, 
                      borderRadius: 1,
                      border: '1px solid #e2e8f0'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '11px', 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        color: '#374151'
                      }}>
                        {this.state.error.stack}
                      </pre>
                    </Box>
                  </Alert>
                )}

                {this.state.errorInfo?.componentStack && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Component Stack:
                    </Typography>
                    <Box sx={{ 
                      maxHeight: 150, 
                      overflow: 'auto', 
                      bgcolor: '#f8fafc', 
                      p: 1, 
                      borderRadius: 1,
                      border: '1px solid #e2e8f0'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '11px', 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        color: '#374151'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </Box>
                  </Alert>
                )}
              </Box>
            )}

            {/* Production Help Text */}
            {process.env.NODE_ENV === 'production' && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  💡 <strong>Troubleshooting Tips:</strong>
                  <ul style={{ marginTop: 8, marginBottom: 0 }}>
                    <li>Try refreshing the page (Ctrl/Cmd + R)</li>
                    <li>Clear your browser cache and cookies</li>
                    <li>Check your internet connection</li>
                    <li>If the problem persists, please contact support</li>
                  </ul>
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;