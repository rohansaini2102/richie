# Daily.co React useTranscription Hook - Complete Guide

## Overview
The `useTranscription` hook from `@daily-co/daily-react` simplifies transcription integration by abstracting Daily.co's transcription functionality into a React-friendly interface with automatic state management and event handling.

## Hook API

### Basic Usage
```typescript
import { useTranscription } from '@daily-co/daily-react';

const transcriptionState = useTranscription(params?: TranscriptionParams);
```

### Parameters
- `params` (optional): Configuration object for transcription settings

### Return Values
The hook returns an object containing:
- Current transcription state
- Helper functions for starting/stopping transcription
- Event handlers for transcription events
- Error states and loading indicators

## State Management
The hook manages several pieces of state:
- **Transcription Status**: Whether transcription is active, inactive, or loading
- **Transcription Text**: Real-time transcription content
- **Speaker Information**: Details about who is speaking
- **Error States**: Any transcription-related errors
- **Configuration**: Current transcription settings

## React Integration Features

### Performance Optimizations
- Uses React's `useMemo` and `useCallback` for expensive operations
- Implements proper dependency arrays to prevent unnecessary re-renders
- Batches state updates for optimal performance

### React Patterns
- Follows React hooks conventions
- Integrates with React's lifecycle through `useEffect`
- Provides declarative API consistent with React patterns

### Automatic Cleanup
- Automatically subscribes to transcription events on mount
- Cleans up event subscriptions on unmount
- Prevents memory leaks through proper resource management

## Basic Implementation Example

```jsx
import { useTranscription } from '@daily-co/daily-react';

function TranscriptionComponent() {
  const {
    transcriptionState,
    startTranscription,
    stopTranscription,
    isTranscribing,
    error
  } = useTranscription({
    language: 'en',
    tier: 'nova'
  });

  return (
    <div>
      <button onClick={startTranscription}>
        Start Transcription
      </button>
      <button onClick={stopTranscription}>
        Stop Transcription
      </button>
      {error && <div>Error: {error.message}</div>}
      {transcriptionState && (
        <div>{transcriptionState.text}</div>
      )}
    </div>
  );
}
```

## Advanced Implementation

### Complete Transcription Interface
```jsx
import React, { useState, useEffect } from 'react';
import { 
  useTranscription, 
  useLocalParticipant,
  useParticipants 
} from '@daily-co/daily-react';

function AdvancedTranscriptionPanel() {
  const { isOwner } = useLocalParticipant();
  const participants = useParticipants();
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  
  const {
    transcriptionState,
    startTranscription,
    stopTranscription,
    isTranscribing,
    error,
    transcriptHistory
  } = useTranscription();

  // Only allow owners to control transcription
  const canControlTranscription = isOwner;

  const handleStartTranscription = async () => {
    try {
      await startTranscription({
        participantIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
        punctuate: true,
        endpointing: true
      });
    } catch (err) {
      console.error('Failed to start transcription:', err);
    }
  };

  const handleStopTranscription = async () => {
    try {
      await stopTranscription();
    } catch (err) {
      console.error('Failed to stop transcription:', err);
    }
  };

  return (
    <div className="transcription-panel">
      {/* Control Section */}
      {canControlTranscription && (
        <div className="transcription-controls">
          <div className="participant-selection">
            <label>Select participants to transcribe:</label>
            <select 
              multiple 
              value={selectedParticipants}
              onChange={(e) => setSelectedParticipants([...e.target.selectedOptions].map(o => o.value))}
            >
              <option value="">All participants</option>
              {Object.entries(participants).map(([id, participant]) => (
                <option key={id} value={id}>
                  {participant.user_name || 'Anonymous'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-buttons">
            {!isTranscribing ? (
              <button onClick={handleStartTranscription}>
                Start Transcription
              </button>
            ) : (
              <button onClick={handleStopTranscription}>
                Stop Transcription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="transcription-status">
        {isTranscribing && (
          <div className="status-active">
            🔴 Transcription Active
          </div>
        )}
        {error && (
          <div className="status-error">
            ❌ Error: {error.message}
          </div>
        )}
      </div>

      {/* Live Transcription Display */}
      <div className="transcription-display">
        <h3>Live Transcript</h3>
        <div className="transcript-content">
          {transcriptionState?.text && (
            <div className="current-transcript">
              <strong>Now:</strong> {transcriptionState.text}
            </div>
          )}
          
          {/* Transcript History */}
          <div className="transcript-history">
            {transcriptHistory?.map((transcript, index) => (
              <div key={index} className="transcript-entry">
                <span className="timestamp">
                  {transcript.timestamp.toLocaleTimeString()}
                </span>
                <span className="speaker">
                  {transcript.participantName || 'Unknown'}:
                </span>
                <span className="text">{transcript.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Integration with Other Hooks

### Complete Meeting Component
```jsx
import React from 'react';
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useParticipants,
  useTranscription,
  useRecording
} from '@daily-co/daily-react';

function MeetingWithTranscription({ roomUrl }) {
  return (
    <DailyProvider url={roomUrl}>
      <MeetingInterface />
    </DailyProvider>
  );
}

function MeetingInterface() {
  const callObject = useDaily();
  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const {
    transcriptionState,
    startTranscription,
    stopTranscription,
    isTranscribing,
    error: transcriptionError
  } = useTranscription();

  const isHost = localParticipant?.permissions?.canAdmin;

  const handleJoinCall = async () => {
    try {
      await callObject.join();
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  };

  const handleLeaveCall = async () => {
    try {
      await callObject.leave();
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  };

  return (
    <div className="meeting-interface">
      {/* Meeting Controls */}
      <div className="meeting-controls">
        <button onClick={handleJoinCall}>Join Call</button>
        <button onClick={handleLeaveCall}>Leave Call</button>
        
        {isHost && (
          <>
            <button onClick={isRecording ? stopRecording : startRecording}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            <button onClick={isTranscribing ? stopTranscription : startTranscription}>
              {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
            </button>
          </>
        )}
      </div>

      {/* Participants */}
      <div className="participants">
        <h3>Participants ({Object.keys(participants).length})</h3>
        {Object.entries(participants).map(([id, participant]) => (
          <div key={id} className="participant">
            {participant.user_name || 'Anonymous'}
            {participant.audio && '🎤'}
            {participant.video && '📹'}
          </div>
        ))}
      </div>

      {/* Transcription Panel */}
      {isTranscribing && (
        <div className="transcription-panel">
          <h3>Live Transcription</h3>
          {transcriptionError && (
            <div className="error">Error: {transcriptionError.message}</div>
          )}
          {transcriptionState?.text && (
            <div className="current-transcript">
              {transcriptionState.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Error Handling Patterns

### Comprehensive Error Handling
```jsx
function TranscriptionWithErrorHandling() {
  const [retryCount, setRetryCount] = useState(0);
  const [userNotified, setUserNotified] = useState(false);
  
  const {
    transcriptionState,
    startTranscription,
    stopTranscription,
    isTranscribing,
    error
  } = useTranscription();

  useEffect(() => {
    if (error && !userNotified) {
      handleTranscriptionError(error);
      setUserNotified(true);
    }
  }, [error, userNotified]);

  const handleTranscriptionError = (error) => {
    console.error('Transcription error:', error);
    
    // Different handling based on error type
    if (error.type === 'permissions') {
      showNotification('Transcription requires additional permissions');
    } else if (error.type === 'quota-exceeded') {
      showNotification('Transcription quota exceeded. Please upgrade your plan.');
    } else if (error.type === 'network') {
      // Implement retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          startTranscription();
          setRetryCount(prev => prev + 1);
        }, 5000);
      } else {
        showNotification('Transcription unavailable due to network issues');
      }
    } else {
      showNotification('Transcription service temporarily unavailable');
    }
  };

  const showNotification = (message) => {
    // Implement your notification system
    console.log('User notification:', message);
  };

  // Reset error state when transcription starts successfully
  useEffect(() => {
    if (isTranscribing && userNotified) {
      setUserNotified(false);
      setRetryCount(0);
    }
  }, [isTranscribing, userNotified]);

  return (
    <TranscriptionComponent
      transcriptionState={transcriptionState}
      startTranscription={startTranscription}
      stopTranscription={stopTranscription}
      isTranscribing={isTranscribing}
      error={error}
    />
  );
}
```

## Custom Hook Extension

### Enhanced Transcription Hook
```jsx
import { useTranscription } from '@daily-co/daily-react';
import { useState, useEffect, useCallback } from 'react';

export function useEnhancedTranscription(options = {}) {
  const baseTranscription = useTranscription(options);
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTranscripts, setFilteredTranscripts] = useState([]);

  // Store transcript history
  useEffect(() => {
    if (baseTranscription.transcriptionState?.text && baseTranscription.transcriptionState?.is_final) {
      setTranscriptHistory(prev => [...prev, {
        text: baseTranscription.transcriptionState.text,
        timestamp: new Date(),
        participant: baseTranscription.transcriptionState.participant
      }]);
    }
  }, [baseTranscription.transcriptionState]);

  // Filter transcripts based on search
  useEffect(() => {
    if (searchTerm) {
      setFilteredTranscripts(
        transcriptHistory.filter(transcript =>
          transcript.text.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTranscripts(transcriptHistory);
    }
  }, [transcriptHistory, searchTerm]);

  const exportTranscript = useCallback(() => {
    const transcriptText = transcriptHistory
      .map(t => `[${t.timestamp.toLocaleTimeString()}] ${t.participant || 'Unknown'}: ${t.text}`)
      .join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcriptHistory]);

  const clearHistory = useCallback(() => {
    setTranscriptHistory([]);
  }, []);

  return {
    ...baseTranscription,
    transcriptHistory,
    filteredTranscripts,
    searchTerm,
    setSearchTerm,
    exportTranscript,
    clearHistory
  };
}
```

## TypeScript Support

### Type Definitions
```typescript
interface TranscriptionState {
  text: string;
  is_final: boolean;
  participant?: string;
  timestamp: Date;
  confidence?: number;
}

interface TranscriptionParams {
  language?: string;
  tier?: 'standard' | 'nova';
  participantIds?: string[];
  punctuate?: boolean;
  endpointing?: boolean;
}

interface UseTranscriptionReturn {
  transcriptionState: TranscriptionState | null;
  startTranscription: (params?: TranscriptionParams) => Promise<void>;
  stopTranscription: () => Promise<void>;
  isTranscribing: boolean;
  error: Error | null;
  transcriptHistory?: TranscriptionState[];
}
```

## Best Practices

### Performance Optimization
1. **Debounce Updates**: Use debouncing for real-time transcript display
2. **Limit History**: Keep only recent transcripts in memory
3. **Memoization**: Use React.memo for transcript components
4. **Cleanup**: Clear transcripts when leaving meetings

### User Experience
1. **Loading States**: Show loading indicators during transcription start/stop
2. **Error Boundaries**: Wrap transcription components in error boundaries
3. **Permissions**: Check and request permissions before starting
4. **Notifications**: Provide clear feedback for all transcription states

### Integration Tips
1. **Combine with Recording**: Start transcription with recording for complete meeting capture
2. **Participant Selection**: Allow selective transcription for focused conversations
3. **Export Functionality**: Provide transcript export options
4. **Search & Filter**: Implement transcript search for long meetings