# Daily.co Transcription Events - Comprehensive Guide

## Overview
Daily.co provides real-time transcription powered by **Deepgram's ASR technology** with **<300ms latency**. The system uses event-driven architecture to broadcast transcription data to all participants.

## Key Features
- Real-time transcript generation during meetings
- WebVTT format storage capability
- Selective participant transcription
- Multiple transcription instances per room
- Cloud storage with optional custom S3 buckets

## Available Events

### Core Transcription Events
- **`transcription-started`**: Signals when transcription begins
- **`transcription-stopped`**: Indicates when transcription ends  
- **`transcription-message`**: Delivers real-time transcription snippets (via app-message)
- **`transcription-error`**: Reports transcription failures

### Event Broadcasting
All events are emitted to **all participants** in the call for synchronized state.

## Event Setup & Management

### Basic Event Listeners
```javascript
// Listen for transcription messages via app-message events
callFrame.on('app-message', handleAppMessage);

// Listen for transcription state changes
callFrame.on('transcription-started', handleTranscriptionStarted);
callFrame.on('transcription-stopped', handleTranscriptionStopped);
callFrame.on('transcription-error', handleTranscriptionError);
```

### Complete Setup Example
```javascript
const setupTranscriptionListeners = () => {
  callFrame.on('app-message', handleTranscriptionMessage);
  callFrame.on('transcription-started', handleTranscriptionStarted);
  callFrame.on('transcription-stopped', handleTranscriptionStopped);
  callFrame.on('transcription-error', handleTranscriptionError);
};

const cleanupListeners = () => {
  callFrame.off('app-message', handleTranscriptionMessage);
  callFrame.off('transcription-started', handleTranscriptionStarted);
  callFrame.off('transcription-stopped', handleTranscriptionStopped);
  callFrame.off('transcription-error', handleTranscriptionError);
};
```

## Transcription Message Event

### Event Structure
```javascript
{
  fromId: 'transcription',
  data: {
    text: 'The transcribed text content',
    is_final: true, // Boolean indicating final vs interim result
    // Additional Deepgram-specific fields may be present
  }
}
```

### Message Handler
```javascript
const handleAppMessage = (e) => {
  if (e?.fromId === 'transcription' && e?.data?.is_final) {
    console.log('Final transcription:', e.data.text);
    // Process final transcription text
    saveTranscriptToBackend(e.data);
  }
  
  // Handle interim results for real-time display
  if (e?.fromId === 'transcription') {
    updateLiveTranscript(e.data);
  }
};
```

## Transcription Control

### Starting Transcription
```javascript
// Basic start
await callFrame.startTranscription();

// With configuration
await callFrame.startTranscription({
  punctuate: true,    // Add punctuation to transcripts
  endpointing: true,  // Enhanced sentence boundary detection
  extra: {},          // Additional Deepgram-specific options
});

// Selective participant transcription
await callFrame.startTranscription({
  participantIds: ['participant1', 'participant2']
});
```

### Stopping Transcription
```javascript
await callFrame.stopTranscription();
```

### Updating Transcription
```javascript
// Add new participants to existing transcription
await callFrame.updateTranscription({
  participantIds: ['participant3']
});
```

## Event Handlers Implementation

### transcription-started Handler
```javascript
callFrame.on('transcription-started', (event) => {
  console.log('Transcription started with ID:', event.transcriptId);
  // Update UI to show transcription is active
  setTranscriptionActive(true);
  setTranscriptId(event.transcriptId);
});
```

### transcription-stopped Handler
```javascript
callFrame.on('transcription-stopped', () => {
  console.log('Transcription stopped');
  // Update UI to remove transcription indicators
  setTranscriptionActive(false);
  generateFinalSummary();
});
```

### transcription-error Handler
```javascript
callFrame.on('transcription-error', (error) => {
  console.error('Transcription error:', error);
  // Implement error recovery or user notification
  showErrorNotification('Transcription encountered an error');
  
  // Consider restarting transcription if appropriate
  setTimeout(() => {
    if (shouldRetry(error)) {
      callFrame.startTranscription();
    }
  }, 5000);
});
```

## Complete Implementation Example

### TranscriptionManager Class
```javascript
class TranscriptionManager {
  constructor(callFrame) {
    this.callFrame = callFrame;
    this.transcripts = [];
    this.isActive = false;
    this.setupListeners();
  }

  setupListeners() {
    this.callFrame.on('app-message', this.handleMessage.bind(this));
    this.callFrame.on('transcription-started', this.handleStarted.bind(this));
    this.callFrame.on('transcription-stopped', this.handleStopped.bind(this));
    this.callFrame.on('transcription-error', this.handleError.bind(this));
  }

  async startTranscription(options = {}) {
    try {
      await this.callFrame.startTranscription({
        punctuate: true,
        endpointing: true,
        ...options
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async stopTranscription() {
    try {
      await this.callFrame.stopTranscription();
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      throw error;
    }
  }

  handleMessage(event) {
    if (event.fromId === 'transcription' && event.data?.is_final) {
      const transcript = {
        text: event.data.text,
        timestamp: new Date(),
        participant: event.participant || 'unknown'
      };
      
      this.transcripts.push(transcript);
      this.onTranscriptReceived?.(transcript);
    }
  }

  handleStarted(event) {
    this.isActive = true;
    this.transcriptId = event.transcriptId;
    this.onTranscriptionStarted?.(event);
  }

  handleStopped() {
    this.isActive = false;
    this.onTranscriptionStopped?.();
  }

  handleError(error) {
    console.error('Transcription error:', error);
    this.onTranscriptionError?.(error);
  }

  // Callback setters
  setCallbacks({ onTranscriptReceived, onTranscriptionStarted, onTranscriptionStopped, onTranscriptionError }) {
    this.onTranscriptReceived = onTranscriptReceived;
    this.onTranscriptionStarted = onTranscriptionStarted;
    this.onTranscriptionStopped = onTranscriptionStopped;
    this.onTranscriptionError = onTranscriptionError;
  }

  getTranscripts() {
    return this.transcripts;
  }

  isTranscriptionActive() {
    return this.isActive;
  }
}
```

### React Hook Implementation
```javascript
import { useCallback, useEffect, useState } from 'react';

export const useTranscription = (callFrame) => {
  const [transcripts, setTranscripts] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const handleMessage = useCallback((event) => {
    if (event.fromId === 'transcription' && event.data?.is_final) {
      setTranscripts(prev => [...prev, {
        text: event.data.text,
        timestamp: new Date(),
        participant: event.participant
      }]);
    }
  }, []);

  const handleStarted = useCallback(() => {
    setIsActive(true);
    setError(null);
  }, []);

  const handleStopped = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleError = useCallback((error) => {
    setError(error);
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!callFrame) return;

    callFrame.on('app-message', handleMessage);
    callFrame.on('transcription-started', handleStarted);
    callFrame.on('transcription-stopped', handleStopped);
    callFrame.on('transcription-error', handleError);

    return () => {
      callFrame.off('app-message', handleMessage);
      callFrame.off('transcription-started', handleStarted);
      callFrame.off('transcription-stopped', handleStopped);
      callFrame.off('transcription-error', handleError);
    };
  }, [callFrame, handleMessage, handleStarted, handleStopped, handleError]);

  const startTranscription = useCallback(async (options) => {
    try {
      await callFrame.startTranscription(options);
    } catch (error) {
      setError(error);
    }
  }, [callFrame]);

  const stopTranscription = useCallback(async () => {
    try {
      await callFrame.stopTranscription();
    } catch (error) {
      setError(error);
    }
  }, [callFrame]);

  return {
    transcripts,
    isActive,
    error,
    startTranscription,
    stopTranscription
  };
};
```

## Best Practices

### Permission Management
```javascript
// Ensure proper permissions before starting
if (callFrame.participants().local.permissions.canAdmin?.transcription) {
  await callFrame.startTranscription();
} else {
  console.error('Insufficient permissions for transcription');
}
```

### Error Handling
- Implement retry logic for network-related errors
- Provide user feedback for permission issues
- Handle quota exceeded gracefully
- Monitor transcription quality and restart if needed

### Performance Optimization
- Batch transcript updates to prevent excessive re-renders
- Use debouncing for real-time transcript display
- Implement proper cleanup to prevent memory leaks
- Store only final transcripts for persistence

### UI/UX Guidelines
- Provide explicit notification before starting transcription
- Show visual indicators when transcription is active
- Implement clear consent mechanisms
- Offer graceful error recovery options

## Common Error Scenarios
1. **Permission Errors**: User lacks transcription permissions
2. **Billing Issues**: Daily account requires payment setup
3. **Network Problems**: Poor connectivity affecting delivery
4. **Service Outages**: Deepgram or Daily service interruptions

## Integration Notes
- Transcription requires Daily.co paid plan features
- Works with Daily.co's cloud recording for permanent storage
- Supports custom vocabulary for domain-specific terms
- Compatible with multi-language transcription capabilities