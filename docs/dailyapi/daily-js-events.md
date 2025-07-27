# Daily.js Events Documentation

## Overview

Daily.js provides a comprehensive event system for monitoring meeting state, participant changes, media events, transcription events, and recording events. This documentation covers all recording and transcription events, their object structures, and implementation patterns.

## Event Registration

### Using React Hooks

```jsx
import { useDailyEvent } from '@daily-co/daily-react';

const MeetingComponent = () => {
  useDailyEvent('transcription-message', (event) => {
    console.log('Transcription message:', event.text);
  });
  
  useDailyEvent('recording-started', (event) => {
    console.log('Recording started:', event.instanceId);
  });
  
  return <div>Meeting content</div>;
};
```

### Using Event Listeners (Vanilla JS)

```javascript
// Add event listener
daily.on('transcription-message', (event) => {
  console.log('Transcription:', event.text);
});

// Remove event listener
daily.off('transcription-message', handlerFunction);
```

## Transcription Events

### `transcription-started`

Fired when transcription begins in the meeting.

**Event Object Structure:**
```typescript
interface TranscriptionStartedEvent {
  action: 'transcription-started';
  instanceId: string;           // Unique transcription instance ID
  startedBy: string;           // Session ID of participant who started transcription
  language: string;            // Language code (e.g., 'en', 'es')
  model: string;              // Transcription model being used
  tier?: string;              // Quality tier
  timestamp: string;          // ISO timestamp when transcription started
  extra?: {                   // Additional configuration
    punctuate?: boolean;
    profanity_filter?: boolean;
    redact?: boolean;
    [key: string]: any;
  };
}
```

**Usage Example:**
```jsx
import { useDailyEvent } from '@daily-co/daily-react';

const TranscriptionStatus = () => {
  const [transcriptionState, setTranscriptionState] = useState({
    isActive: false,
    instanceId: null,
    startedBy: null,
    language: null
  });

  useDailyEvent('transcription-started', (event) => {
    console.log('🎙️ Transcription started:', {
      instanceId: event.instanceId,
      language: event.language,
      model: event.model,
      startedBy: event.startedBy
    });
    
    setTranscriptionState({
      isActive: true,
      instanceId: event.instanceId,
      startedBy: event.startedBy,
      language: event.language
    });
    
    // Notify backend that transcription started
    notifyBackend('transcription-started', {
      instanceId: event.instanceId,
      language: event.language,
      model: event.model
    });
  });

  return (
    <div>
      {transcriptionState.isActive && (
        <div className="transcription-indicator">
          🎙️ Transcription Active ({transcriptionState.language})
        </div>
      )}
    </div>
  );
};
```

### `transcription-stopped`

Fired when transcription ends in the meeting.

**Event Object Structure:**
```typescript
interface TranscriptionStoppedEvent {
  action: 'transcription-stopped';
  instanceId: string;          // Transcription instance that stopped
  stoppedBy: string;          // Session ID of participant who stopped transcription
  updatedBy: string;          // Alternative field name (same as stoppedBy)
  timestamp: string;          // ISO timestamp when transcription stopped
  messageCount?: number;      // Total number of messages transcribed
  duration?: number;          // Duration in seconds
  reason?: string;           // Reason for stopping ('manual', 'error', 'meeting-ended')
}
```

**Usage Example:**
```jsx
useDailyEvent('transcription-stopped', (event) => {
  console.log('🛑 Transcription stopped:', {
    instanceId: event.instanceId,
    messageCount: event.messageCount,
    duration: event.duration,
    reason: event.reason
  });
  
  setTranscriptionState({
    isActive: false,
    instanceId: null,
    startedBy: null,
    language: null
  });
  
  // Show completion message
  showNotification({
    type: 'info',
    title: 'Transcription Complete',
    message: `Transcribed ${event.messageCount || 0} messages in ${event.duration || 0} seconds`
  });
  
  // Notify backend
  notifyBackend('transcription-stopped', {
    instanceId: event.instanceId,
    messageCount: event.messageCount
  });
});
```

### `transcription-message`

Fired for each transcribed speech segment. This is the most frequently fired transcription event.

**Event Object Structure:**
```typescript
interface TranscriptionMessageEvent {
  action: 'transcription-message';
  instanceId: string;          // Transcription instance ID
  participantId: string;       // Session ID of the speaking participant
  text: string;               // Transcribed text content
  timestamp: string;          // ISO timestamp of the speech
  is_final: boolean;          // Whether this is final text (true) or interim (false)
  confidence?: number;        // Confidence score (0.0 to 1.0)
  language?: string;          // Detected language
  user_id?: string;           // User ID of speaker (if available)
  user_name?: string;         // Display name of speaker (if available)
  rawResponse?: any;          // Raw response from transcription provider (if enabled)
  words?: Array<{            // Word-level timestamps (if available)
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
}
```

**Usage Example:**
```jsx
const TranscriptionDisplay = () => {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({});

  useDailyEvent('transcription-message', (event) => {
    console.log('📝 Transcription message:', {
      speaker: event.user_name || event.participantId,
      text: event.text,
      isFinal: event.is_final,
      confidence: event.confidence
    });
    
    // Create message object
    const message = {
      id: `${event.participantId}_${event.timestamp}`,
      participantId: event.participantId,
      participantName: participants[event.participantId]?.user_name || 
                      event.user_name || 
                      'Unknown Speaker',
      text: event.text,
      timestamp: event.timestamp,
      isFinal: event.is_final,
      confidence: event.confidence,
      instanceId: event.instanceId
    };
    
    // Save to backend for permanent storage
    saveTranscriptMessage(message);
    
    // Update local state for real-time display
    setMessages(prev => {
      // Replace interim messages with final ones
      if (event.is_final) {
        // Remove any interim messages from this participant around this time
        const filtered = prev.filter(msg => 
          !(msg.participantId === event.participantId && 
            !msg.isFinal && 
            Math.abs(new Date(msg.timestamp) - new Date(event.timestamp)) < 5000)
        );
        return [...filtered, message].slice(-50); // Keep last 50 messages
      } else {
        // Add interim message
        return [...prev, message].slice(-50);
      }
    });
  });

  return (
    <div className="transcription-display">
      {messages.map(message => (
        <div 
          key={message.id} 
          className={`message ${!message.isFinal ? 'interim' : ''}`}
        >
          <div className="speaker">{message.participantName}</div>
          <div className="text">{message.text}</div>
          <div className="timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
            {message.confidence && (
              <span className="confidence">
                ({Math.round(message.confidence * 100)}%)
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### `transcription-error`

Fired when transcription encounters an error.

**Event Object Structure:**
```typescript
interface TranscriptionErrorEvent {
  action: 'transcription-error';
  instanceId?: string;        // Transcription instance (if available)
  error: string;             // Error message
  errorCode?: string;        // Error code (if available)
  timestamp: string;         // When error occurred
  fatal?: boolean;           // Whether error stops transcription
  details?: {               // Additional error details
    provider?: string;
    statusCode?: number;
    retryable?: boolean;
    [key: string]: any;
  };
}
```

**Usage Example:**
```jsx
useDailyEvent('transcription-error', (event) => {
  console.error('❌ Transcription error:', {
    error: event.error,
    instanceId: event.instanceId,
    fatal: event.fatal,
    retryable: event.details?.retryable
  });
  
  // Show error to user
  showErrorNotification({
    title: 'Transcription Error',
    message: event.error,
    action: event.details?.retryable ? 'Retry' : null
  });
  
  // Update UI state
  setTranscriptionError(event.error);
  
  // If fatal error, reset transcription state
  if (event.fatal) {
    setTranscriptionState({
      isActive: false,
      instanceId: null,
      startedBy: null,
      language: null
    });
  }
  
  // Attempt retry for retryable errors
  if (event.details?.retryable && !event.fatal) {
    setTimeout(() => {
      retryTranscription();
    }, 5000); // Retry after 5 seconds
  }
});
```

## Recording Events

### `recording-started`

Fired when cloud recording begins.

**Event Object Structure:**
```typescript
interface RecordingStartedEvent {
  action: 'recording-started';
  instanceId: string;         // Unique recording instance ID
  startedBy: string;         // Session ID who started recording
  type: 'cloud' | 'local';  // Recording type
  layout?: {                 // Recording layout settings
    preset?: string;
    max_participants?: number;
    [key: string]: any;
  };
  timestamp: string;         // When recording started
  recordingId?: string;      // External recording ID (provider-specific)
}
```

**Usage Example:**
```jsx
useDailyEvent('recording-started', (event) => {
  console.log('📹 Recording started:', {
    instanceId: event.instanceId,
    type: event.type,
    startedBy: event.startedBy,
    layout: event.layout
  });
  
  setRecordingState({
    isRecording: true,
    instanceId: event.instanceId,
    startedBy: event.startedBy,
    type: event.type
  });
  
  // Show recording indicator
  showRecordingIndicator();
  
  // Notify participants
  broadcastMessage('Recording has started');
  
  // Save recording start to backend
  saveRecordingEvent('started', {
    instanceId: event.instanceId,
    type: event.type,
    layout: event.layout
  });
});
```

### `recording-stopped`

Fired when recording ends.

**Event Object Structure:**
```typescript
interface RecordingStoppedEvent {
  action: 'recording-stopped';
  instanceId: string;        // Recording instance that stopped
  stoppedBy: string;        // Session ID who stopped recording
  duration?: number;        // Recording duration in seconds
  fileSize?: number;        // File size in bytes
  downloadUrl?: string;     // URL to download recording (if available)
  status: 'completed' | 'failed' | 'cancelled';
  timestamp: string;        // When recording stopped
  error?: string;           // Error message if status is 'failed'
}
```

**Usage Example:**
```jsx
useDailyEvent('recording-stopped', (event) => {
  console.log('🛑 Recording stopped:', {
    instanceId: event.instanceId,
    duration: event.duration,
    status: event.status,
    downloadUrl: event.downloadUrl
  });
  
  setRecordingState({
    isRecording: false,
    instanceId: null,
    startedBy: null,
    type: null
  });
  
  // Hide recording indicator
  hideRecordingIndicator();
  
  if (event.status === 'completed') {
    showSuccessNotification({
      title: 'Recording Complete',
      message: `Duration: ${formatDuration(event.duration)}`,
      action: event.downloadUrl ? 'Download' : null,
      actionUrl: event.downloadUrl
    });
  } else if (event.status === 'failed') {
    showErrorNotification({
      title: 'Recording Failed',
      message: event.error || 'Unknown error occurred'
    });
  }
  
  // Save recording completion to backend
  saveRecordingEvent('stopped', {
    instanceId: event.instanceId,
    duration: event.duration,
    status: event.status,
    downloadUrl: event.downloadUrl
  });
});
```

### `recording-error`

Fired when recording encounters an error.

**Event Object Structure:**
```typescript
interface RecordingErrorEvent {
  action: 'recording-error';
  instanceId?: string;       // Recording instance (if available)
  error: string;            // Error message
  errorCode?: string;       // Provider error code
  fatal?: boolean;          // Whether error stops recording
  timestamp: string;        // When error occurred
  details?: {              // Additional error details
    provider?: string;
    statusCode?: number;
    retryable?: boolean;
    [key: string]: any;
  };
}
```

**Usage Example:**
```jsx
useDailyEvent('recording-error', (event) => {
  console.error('❌ Recording error:', {
    error: event.error,
    instanceId: event.instanceId,
    fatal: event.fatal
  });
  
  // Show error notification
  showErrorNotification({
    title: 'Recording Error',
    message: event.error,
    persistent: event.fatal
  });
  
  // If fatal, stop recording
  if (event.fatal) {
    setRecordingState({
      isRecording: false,
      instanceId: null,
      startedBy: null,
      type: null
    });
    hideRecordingIndicator();
  }
  
  // Log error for debugging
  logRecordingError({
    instanceId: event.instanceId,
    error: event.error,
    fatal: event.fatal,
    timestamp: event.timestamp
  });
});
```

### `recording-stats`

Fired periodically during recording with statistics.

**Event Object Structure:**
```typescript
interface RecordingStatsEvent {
  action: 'recording-stats';
  instanceId: string;       // Recording instance ID
  duration: number;         // Current duration in seconds
  fileSize?: number;        // Current file size in bytes
  fps?: number;            // Frames per second
  bitrate?: number;        // Current bitrate
  resolution?: {           // Current resolution
    width: number;
    height: number;
  };
  timestamp: string;       // Timestamp of stats
}
```

**Usage Example:**
```jsx
useDailyEvent('recording-stats', (event) => {
  console.log('📊 Recording stats:', {
    duration: event.duration,
    fileSize: event.fileSize,
    fps: event.fps,
    bitrate: event.bitrate
  });
  
  // Update recording progress UI
  updateRecordingProgress({
    duration: event.duration,
    fileSize: event.fileSize,
    quality: {
      fps: event.fps,
      bitrate: event.bitrate,
      resolution: event.resolution
    }
  });
  
  // Check for issues
  if (event.fps && event.fps < 15) {
    console.warn('Low FPS detected:', event.fps);
    showWarning('Recording quality may be affected by low frame rate');
  }
  
  if (event.bitrate && event.bitrate < 500000) { // Less than 500kbps
    console.warn('Low bitrate detected:', event.bitrate);
    showWarning('Recording quality may be affected by low bitrate');
  }
});
```

## Event Handler Patterns

### Comprehensive Event Handler
```jsx
const MeetingEventHandler = () => {
  const [meetingState, setMeetingState] = useState({
    transcription: {
      isActive: false,
      instanceId: null,
      messageCount: 0
    },
    recording: {
      isActive: false,
      instanceId: null,
      duration: 0
    }
  });

  // Transcription events
  useDailyEvent('transcription-started', (event) => {
    setMeetingState(prev => ({
      ...prev,
      transcription: {
        isActive: true,
        instanceId: event.instanceId,
        messageCount: 0
      }
    }));
  });

  useDailyEvent('transcription-message', (event) => {
    if (event.is_final) {
      setMeetingState(prev => ({
        ...prev,
        transcription: {
          ...prev.transcription,
          messageCount: prev.transcription.messageCount + 1
        }
      }));
    }
  });

  useDailyEvent('transcription-stopped', (event) => {
    setMeetingState(prev => ({
      ...prev,
      transcription: {
        isActive: false,
        instanceId: null,
        messageCount: 0
      }
    }));
  });

  // Recording events
  useDailyEvent('recording-started', (event) => {
    setMeetingState(prev => ({
      ...prev,
      recording: {
        isActive: true,
        instanceId: event.instanceId,
        duration: 0
      }
    }));
  });

  useDailyEvent('recording-stats', (event) => {
    setMeetingState(prev => ({
      ...prev,
      recording: {
        ...prev.recording,
        duration: event.duration
      }
    }));
  });

  useDailyEvent('recording-stopped', (event) => {
    setMeetingState(prev => ({
      ...prev,
      recording: {
        isActive: false,
        instanceId: null,
        duration: 0
      }
    }));
  });

  return (
    <div className="meeting-status">
      {meetingState.transcription.isActive && (
        <div className="transcription-status">
          🎙️ Transcribing ({meetingState.transcription.messageCount} messages)
        </div>
      )}
      {meetingState.recording.isActive && (
        <div className="recording-status">
          📹 Recording ({formatDuration(meetingState.recording.duration)})
        </div>
      )}
    </div>
  );
};
```

### Error Recovery Pattern
```jsx
const ErrorRecoveryHandler = () => {
  const [errors, setErrors] = useState([]);
  const [retryAttempts, setRetryAttempts] = useState({});

  const handleRecoverableError = async (eventType, instanceId, error) => {
    const attemptKey = `${eventType}_${instanceId}`;
    const attempts = retryAttempts[attemptKey] || 0;
    
    if (attempts < 3) { // Max 3 retry attempts
      setRetryAttempts(prev => ({
        ...prev,
        [attemptKey]: attempts + 1
      }));
      
      // Wait with exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        if (eventType === 'transcription') {
          await daily.startTranscription();
        } else if (eventType === 'recording') {
          await daily.startRecording();
        }
      } catch (retryError) {
        console.error(`Retry ${attempts + 1} failed:`, retryError);
      }
    } else {
      // Max retries reached
      showErrorNotification({
        title: `${eventType} Failed`,
        message: 'Maximum retry attempts reached. Please try again manually.'
      });
    }
  };

  useDailyEvent('transcription-error', (event) => {
    if (event.details?.retryable && !event.fatal) {
      handleRecoverableError('transcription', event.instanceId, event.error);
    }
  });

  useDailyEvent('recording-error', (event) => {
    if (event.details?.retryable && !event.fatal) {
      handleRecoverableError('recording', event.instanceId, event.error);
    }
  });

  return null; // This component only handles events
};
```

## Best Practices

### 1. Event Handler Cleanup
```jsx
useEffect(() => {
  const handlers = {
    'transcription-message': handleTranscriptionMessage,
    'recording-started': handleRecordingStarted
  };

  // Add event listeners
  Object.entries(handlers).forEach(([event, handler]) => {
    daily?.on(event, handler);
  });

  // Cleanup on unmount
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      daily?.off(event, handler);
    });
  };
}, [daily]);
```

### 2. State Synchronization
```jsx
const useMeetingState = () => {
  const [state, setState] = useState({
    transcription: { active: false },
    recording: { active: false }
  });

  // Sync with Daily state on mount
  useEffect(() => {
    if (daily) {
      const transcriptionStatus = daily.getTranscription();
      const recordingStatus = daily.getRecording();
      
      setState({
        transcription: { active: transcriptionStatus.isTranscribing },
        recording: { active: recordingStatus.isRecording }
      });
    }
  }, [daily]);

  return state;
};
```

### 3. Performance Optimization
```jsx
// Debounce transcription messages for UI updates
const useDebouncedTranscriptionMessages = (messages, delay = 100) => {
  const [debouncedMessages, setDebouncedMessages] = useState(messages);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMessages(messages);
    }, delay);

    return () => clearTimeout(handler);
  }, [messages, delay]);

  return debouncedMessages;
};
```

### 4. Memory Management
```jsx
// Limit stored messages to prevent memory issues
const MAX_MESSAGES = 100;
const MAX_EVENTS = 50;

const [transcriptionMessages, setTranscriptionMessages] = useState([]);
const [events, setEvents] = useState([]);

useDailyEvent('transcription-message', (event) => {
  setTranscriptionMessages(prev => 
    [...prev, event].slice(-MAX_MESSAGES)
  );
});

const addEvent = (event) => {
  setEvents(prev => [...prev, event].slice(-MAX_EVENTS));
};
```