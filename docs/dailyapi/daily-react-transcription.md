# Daily React Transcription Documentation

## Overview

The `useTranscription` hook from the daily-react library provides a React-friendly interface for managing transcription functionality in Daily video calls. This hook abstracts common patterns and state management for real-time transcription features.

## Installation and Setup

```bash
npm install @daily-co/daily-react @daily-co/daily-js
```

## useTranscription Hook API Reference

### Hook Signature

```javascript
import { useTranscription } from '@daily-co/daily-react';

const transcriptionState = useTranscription(params?);
```

### Parameters

The hook accepts an optional configuration object:

```javascript
const params = {
  onTranscriptionStarted: (event) => {
    // Callback when transcription starts
  },
  onTranscriptionStopped: (event) => {
    // Callback when transcription stops
  },
  onTranscriptionMessage: (event) => {
    // Callback for each transcription message
  },
  onTranscriptionError: (event) => {
    // Callback for transcription errors
  }
};
```

### Return Value

The hook returns an object with the following properties:

```javascript
const {
  // State
  isTranscriptionEnabled,
  isTranscribing,
  transcriptionStartTS,
  transcriptionError,
  
  // Methods
  startTranscription,
  stopTranscription,
  updateTranscription
} = useTranscription();
```

## Basic Implementation

### Simple Transcription Component

```jsx
import React, { useState } from 'react';
import { useTranscription, useParticipants } from '@daily-co/daily-react';

const TranscriptionComponent = () => {
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const { participants } = useParticipants();
  
  const {
    isTranscriptionEnabled,
    isTranscribing,
    startTranscription,
    stopTranscription,
    transcriptionError
  } = useTranscription({
    onTranscriptionMessage: (event) => {
      const { data } = event;
      
      if (data.is_final) {
        const participant = participants[data.participantId];
        const message = {
          id: Date.now(),
          text: data.text,
          participantName: participant?.user_name || 'Unknown',
          timestamp: new Date(data.timestamp),
          confidence: data.confidence
        };
        
        setTranscriptMessages(prev => [...prev, message]);
      }
    },
    onTranscriptionStarted: () => {
      console.log('Transcription started');
      setTranscriptMessages([]);
    },
    onTranscriptionStopped: () => {
      console.log('Transcription stopped');
    },
    onTranscriptionError: (error) => {
      console.error('Transcription error:', error);
    }
  });

  const handleStartTranscription = async () => {
    try {
      await startTranscription({
        language: 'en-US',
        tier: 'premium'
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);
    }
  };

  const handleStopTranscription = async () => {
    try {
      await stopTranscription();
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  };

  if (!isTranscriptionEnabled) {
    return <div>Transcription is not enabled for this room</div>;
  }

  return (
    <div className="transcription-container">
      <div className="transcription-controls">
        <button 
          onClick={handleStartTranscription}
          disabled={isTranscribing}
        >
          Start Transcription
        </button>
        <button 
          onClick={handleStopTranscription}
          disabled={!isTranscribing}
        >
          Stop Transcription
        </button>
        <span className="status">
          Status: {isTranscribing ? 'Recording' : 'Stopped'}
        </span>
      </div>
      
      {transcriptionError && (
        <div className="error">
          Error: {transcriptionError.message}
        </div>
      )}
      
      <div className="transcript-display">
        {transcriptMessages.map(message => (
          <div key={message.id} className="transcript-message">
            <strong>{message.participantName}:</strong> {message.text}
            <span className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionComponent;
```

## Advanced React Patterns

### 1. Custom Hook for Transcript Management

```jsx
import { useState, useCallback, useRef } from 'react';
import { useTranscription, useParticipants } from '@daily-co/daily-react';

export const useTranscriptManager = (options = {}) => {
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [interimTranscripts, setInterimTranscripts] = useState(new Map());
  const { participants } = useParticipants();
  const segmentIdCounter = useRef(0);

  const addTranscriptSegment = useCallback((data) => {
    const participant = participants[data.participantId];
    const segment = {
      id: ++segmentIdCounter.current,
      text: data.text,
      participantId: data.participantId,
      participantName: participant?.user_name || 'Unknown',
      participantRole: participant?.owner ? 'host' : 'participant',
      timestamp: new Date(data.timestamp),
      confidence: data.confidence,
      isFinal: data.is_final
    };

    setTranscriptSegments(prev => [...prev, segment]);
    
    // Remove from interim transcripts
    setInterimTranscripts(prev => {
      const newMap = new Map(prev);
      newMap.delete(data.participantId);
      return newMap;
    });

    // Call optional callback
    if (options.onSegmentAdded) {
      options.onSegmentAdded(segment);
    }
  }, [participants, options]);

  const updateInterimTranscript = useCallback((data) => {
    const participant = participants[data.participantId];
    setInterimTranscripts(prev => {
      const newMap = new Map(prev);
      newMap.set(data.participantId, {
        text: data.text,
        participantName: participant?.user_name || 'Unknown',
        timestamp: new Date(data.timestamp)
      });
      return newMap;
    });
  }, [participants]);

  const transcriptionConfig = {
    onTranscriptionMessage: (event) => {
      const { data } = event;
      
      if (data.is_final) {
        addTranscriptSegment(data);
      } else {
        updateInterimTranscript(data);
      }
    },
    onTranscriptionStarted: () => {
      setTranscriptSegments([]);
      setInterimTranscripts(new Map());
      if (options.onTranscriptionStarted) {
        options.onTranscriptionStarted();
      }
    },
    onTranscriptionStopped: (event) => {
      setInterimTranscripts(new Map());
      if (options.onTranscriptionStopped) {
        options.onTranscriptionStopped(event);
      }
    },
    onTranscriptionError: options.onTranscriptionError
  };

  const transcriptionState = useTranscription(transcriptionConfig);

  const getFullTranscript = useCallback(() => {
    return transcriptSegments
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(segment => `[${segment.timestamp.toLocaleTimeString()}] ${segment.participantName}: ${segment.text}`)
      .join('\n');
  }, [transcriptSegments]);

  const clearTranscript = useCallback(() => {
    setTranscriptSegments([]);
    setInterimTranscripts(new Map());
  }, []);

  const exportTranscriptAsJSON = useCallback(() => {
    return JSON.stringify({
      segments: transcriptSegments,
      generatedAt: new Date(),
      totalSegments: transcriptSegments.length
    }, null, 2);
  }, [transcriptSegments]);

  return {
    ...transcriptionState,
    transcriptSegments,
    interimTranscripts,
    getFullTranscript,
    clearTranscript,
    exportTranscriptAsJSON
  };
};
```

### 2. Live Transcript Display Component

```jsx
import React, { useEffect, useRef } from 'react';
import { useTranscriptManager } from './useTranscriptManager';

const LiveTranscriptDisplay = ({ 
  autoScroll = true, 
  showInterim = true,
  maxSegments = 100,
  onExport 
}) => {
  const transcriptRef = useRef(null);
  
  const {
    transcriptSegments,
    interimTranscripts,
    isTranscribing,
    startTranscription,
    stopTranscription,
    exportTranscriptAsJSON
  } = useTranscriptManager({
    onSegmentAdded: (segment) => {
      console.log('New transcript segment:', segment);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptSegments, interimTranscripts, autoScroll]);

  const handleExport = () => {
    const transcript = exportTranscriptAsJSON();
    if (onExport) {
      onExport(transcript);
    } else {
      // Default export behavior
      const blob = new Blob([transcript], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Keep only the most recent segments to prevent memory issues
  const displaySegments = transcriptSegments.slice(-maxSegments);

  return (
    <div className="live-transcript-display">
      <div className="transcript-header">
        <h3>Live Transcript</h3>
        <div className="transcript-controls">
          <button
            onClick={() => startTranscription({ language: 'en-US', tier: 'premium' })}
            disabled={isTranscribing}
            className="start-btn"
          >
            Start
          </button>
          <button
            onClick={stopTranscription}
            disabled={!isTranscribing}
            className="stop-btn"
          >
            Stop
          </button>
          <button
            onClick={handleExport}
            disabled={displaySegments.length === 0}
            className="export-btn"
          >
            Export
          </button>
          <div className={`status-indicator ${isTranscribing ? 'recording' : 'stopped'}`}>
            {isTranscribing ? '● Recording' : '○ Stopped'}
          </div>
        </div>
      </div>

      <div 
        ref={transcriptRef}
        className="transcript-content"
        style={{
          height: '400px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '1rem',
          backgroundColor: '#f9f9f9'
        }}
      >
        {displaySegments.map(segment => (
          <div key={segment.id} className="transcript-segment">
            <div className="segment-header">
              <span className={`participant-name ${segment.participantRole}`}>
                {segment.participantName}
              </span>
              <span className="timestamp">
                {segment.timestamp.toLocaleTimeString()}
              </span>
              <span className="confidence">
                {Math.round(segment.confidence * 100)}%
              </span>
            </div>
            <div className="segment-text">
              {segment.text}
            </div>
          </div>
        ))}

        {showInterim && Array.from(interimTranscripts.entries()).map(([participantId, interim]) => (
          <div key={`interim-${participantId}`} className="transcript-segment interim">
            <div className="segment-header">
              <span className="participant-name">
                {interim.participantName}
              </span>
              <span className="interim-indicator">typing...</span>
            </div>
            <div className="segment-text interim-text">
              {interim.text}
            </div>
          </div>
        ))}

        {displaySegments.length === 0 && !isTranscribing && (
          <div className="empty-state">
            No transcript available. Start transcription to begin recording.
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTranscriptDisplay;
```

### 3. Meeting Summary Component

```jsx
import React, { useState, useEffect } from 'react';
import { useTranscriptManager } from './useTranscriptManager';

const MeetingSummaryComponent = ({ meetingId, onSave }) => {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionItems, setActionItems] = useState([]);
  
  const {
    transcriptSegments,
    isTranscribing,
    getFullTranscript
  } = useTranscriptManager();

  const generateSummary = async () => {
    if (transcriptSegments.length === 0) {
      alert('No transcript available to summarize');
      return;
    }

    setIsGenerating(true);
    try {
      const transcript = getFullTranscript();
      
      // Call your AI service to generate summary
      const response = await fetch('/api/ai/meeting-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          transcript: transcript,
          participants: getUniqueParticipants()
        })
      });

      const result = await response.json();
      setSummary(result.summary);
      setActionItems(result.action_items || []);
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate meeting summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const getUniqueParticipants = () => {
    const participants = new Map();
    transcriptSegments.forEach(segment => {
      if (!participants.has(segment.participantId)) {
        participants.set(segment.participantId, {
          id: segment.participantId,
          name: segment.participantName,
          role: segment.participantRole
        });
      }
    });
    return Array.from(participants.values());
  };

  const saveSummary = async () => {
    const summaryData = {
      meeting_id: meetingId,
      summary: summary,
      action_items: actionItems,
      transcript_segments: transcriptSegments,
      generated_at: new Date()
    };

    try {
      const response = await fetch('/api/meetings/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(summaryData)
      });

      if (response.ok) {
        alert('Summary saved successfully');
        if (onSave) onSave(summaryData);
      } else {
        throw new Error('Failed to save summary');
      }
    } catch (error) {
      console.error('Failed to save summary:', error);
      alert('Failed to save meeting summary');
    }
  };

  return (
    <div className="meeting-summary">
      <h3>Meeting Summary</h3>
      
      <div className="summary-stats">
        <div className="stat">
          <label>Transcript Segments:</label>
          <span>{transcriptSegments.length}</span>
        </div>
        <div className="stat">
          <label>Participants:</label>
          <span>{getUniqueParticipants().length}</span>
        </div>
        <div className="stat">
          <label>Status:</label>
          <span>{isTranscribing ? 'Recording' : 'Stopped'}</span>
        </div>
      </div>

      <div className="summary-controls">
        <button
          onClick={generateSummary}
          disabled={isGenerating || transcriptSegments.length === 0}
        >
          {isGenerating ? 'Generating...' : 'Generate Summary'}
        </button>
        
        {summary && (
          <button onClick={saveSummary}>
            Save Summary
          </button>
        )}
      </div>

      {summary && (
        <div className="summary-content">
          <h4>Summary</h4>
          <div className="summary-text">
            {summary}
          </div>

          {actionItems.length > 0 && (
            <>
              <h4>Action Items</h4>
              <ul className="action-items">
                {actionItems.map((item, index) => (
                  <li key={index}>
                    <strong>{item.assignee || 'Unassigned'}:</strong> {item.description}
                    {item.due_date && <span className="due-date"> (Due: {item.due_date})</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingSummaryComponent;
```

## Integration with React Context

### TranscriptionProvider

```jsx
import React, { createContext, useContext, useCallback } from 'react';
import { useTranscriptManager } from './useTranscriptManager';

const TranscriptionContext = createContext();

export const TranscriptionProvider = ({ children, meetingId }) => {
  const transcriptionManager = useTranscriptManager({
    onSegmentAdded: (segment) => {
      // Automatically save segments to backend
      saveTranscriptSegment(meetingId, segment);
    },
    onTranscriptionStarted: () => {
      logEvent('transcription_started', { meeting_id: meetingId });
    },
    onTranscriptionStopped: () => {
      logEvent('transcription_stopped', { meeting_id: meetingId });
    }
  });

  const saveTranscriptSegment = useCallback(async (meetingId, segment) => {
    try {
      await fetch(`/api/meetings/${meetingId}/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(segment)
      });
    } catch (error) {
      console.error('Failed to save transcript segment:', error);
    }
  }, []);

  const logEvent = useCallback(async (eventType, data) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event_type: eventType,
          data: data,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }, []);

  return (
    <TranscriptionContext.Provider value={transcriptionManager}>
      {children}
    </TranscriptionContext.Provider>
  );
};

export const useTranscriptionContext = () => {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error('useTranscriptionContext must be used within a TranscriptionProvider');
  }
  return context;
};
```

## Performance Optimization Patterns

### 1. Virtualized Transcript Display

```jsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useTranscriptionContext } from './TranscriptionProvider';

const VirtualizedTranscriptDisplay = ({ height = 400 }) => {
  const { transcriptSegments } = useTranscriptionContext();

  const TranscriptItem = React.memo(({ index, style }) => {
    const segment = transcriptSegments[index];
    
    return (
      <div style={style} className="transcript-item">
        <div className="item-header">
          <span className="participant">{segment.participantName}</span>
          <span className="timestamp">{segment.timestamp.toLocaleTimeString()}</span>
        </div>
        <div className="item-text">{segment.text}</div>
      </div>
    );
  });

  const itemCount = transcriptSegments.length;

  return (
    <List
      height={height}
      itemCount={itemCount}
      itemSize={80}
      className="virtualized-transcript"
    >
      {TranscriptItem}
    </List>
  );
};

export default VirtualizedTranscriptDisplay;
```

### 2. Debounced Search Component

```jsx
import React, { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useTranscriptionContext } from './TranscriptionProvider';

const TranscriptSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const { transcriptSegments } = useTranscriptionContext();

  const filteredSegments = useMemo(() => {
    if (!debouncedSearchTerm) return transcriptSegments;
    
    return transcriptSegments.filter(segment =>
      segment.text.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      segment.participantName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [transcriptSegments, debouncedSearchTerm]);

  const highlightText = (text, term) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index}>{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="transcript-search">
      <div className="search-header">
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-results">
          {filteredSegments.length} of {transcriptSegments.length} segments
        </span>
      </div>

      <div className="search-results-list">
        {filteredSegments.map(segment => (
          <div key={segment.id} className="search-result-item">
            <div className="result-header">
              <span className="participant">{segment.participantName}</span>
              <span className="timestamp">{segment.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="result-text">
              {highlightText(segment.text, debouncedSearchTerm)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptSearch;
```

## Error Handling and Recovery

### Transcription Error Boundary

```jsx
import React from 'react';

class TranscriptionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Transcription error:', error, errorInfo);
    
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = async (error, errorInfo) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date(),
          component: 'TranscriptionErrorBoundary'
        })
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="transcription-error">
          <h3>Transcription Error</h3>
          <p>Something went wrong with the transcription service.</p>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button onClick={this.handleRetry}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TranscriptionErrorBoundary;
```

## Testing Patterns

### Mock Transcription Hook

```jsx
// __mocks__/useTranscription.js
export const mockTranscriptionState = {
  isTranscriptionEnabled: true,
  isTranscribing: false,
  transcriptionStartTS: null,
  transcriptionError: null,
  startTranscription: jest.fn(),
  stopTranscription: jest.fn(),
  updateTranscription: jest.fn()
};

export const useTranscription = jest.fn(() => mockTranscriptionState);
```

### Component Tests

```jsx
// TranscriptionComponent.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TranscriptionComponent from './TranscriptionComponent';
import { mockTranscriptionState } from '../__mocks__/useTranscription';

jest.mock('@daily-co/daily-react');

describe('TranscriptionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders transcription controls', () => {
    render(<TranscriptionComponent />);
    
    expect(screen.getByText('Start Transcription')).toBeInTheDocument();
    expect(screen.getByText('Stop Transcription')).toBeInTheDocument();
  });

  test('starts transcription when button clicked', async () => {
    render(<TranscriptionComponent />);
    
    const startButton = screen.getByText('Start Transcription');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockTranscriptionState.startTranscription).toHaveBeenCalledWith({
        language: 'en-US',
        tier: 'premium'
      });
    });
  });

  test('displays error when transcription fails', () => {
    mockTranscriptionState.transcriptionError = {
      message: 'Failed to start transcription'
    };
    
    render(<TranscriptionComponent />);
    
    expect(screen.getByText('Error: Failed to start transcription')).toBeInTheDocument();
  });
});
```

## Best Practices Summary

### 1. State Management
- Use the `useTranscription` hook for basic transcription control
- Create custom hooks for complex transcript management
- Implement React Context for app-wide transcription state

### 2. Performance
- Implement virtualization for large transcript lists
- Debounce search and filter operations
- Use React.memo for transcript item components
- Limit the number of displayed segments

### 3. Error Handling
- Implement error boundaries for transcription components
- Provide fallback UI for transcription failures
- Log errors to monitoring services
- Implement retry mechanisms

### 4. User Experience
- Show real-time transcription status
- Provide clear visual feedback for interim vs final transcripts
- Implement search and export functionality
- Add accessibility features (ARIA labels, keyboard navigation)

### 5. Testing
- Mock the useTranscription hook for testing
- Test error scenarios and edge cases
- Implement integration tests with Daily.co services
- Test performance with large transcript datasets

This comprehensive React documentation provides everything needed to implement Daily.co transcription features in a React application, with specific focus on the RicheAI meeting system requirements.