import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('🚨 [ErrorBoundary] Caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>Component Error</AlertTitle>
            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>
              {this.state.error && this.state.error.stack}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
            <Button 
              variant="outlined" 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;