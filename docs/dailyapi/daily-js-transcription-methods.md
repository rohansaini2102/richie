# Daily.js Transcription Methods

## Overview

Daily.js provides comprehensive transcription capabilities for real-time speech-to-text conversion during video meetings. This documentation covers the transcription start/stop methods, configuration options, and implementation patterns.

## Prerequisites

### Transcription Requirements
- Daily.co paid plan (transcription is not available on free plans)
- Modern browser with WebRTC support
- Microphone permission granted
- Stable internet connection

### Browser Support
- Chrome 74+ (recommended)
- Firefox 79+
- Safari 14+
- Edge 79+

## Core Transcription Methods

### `daily.startTranscription(options)`

Starts real-time transcription for the meeting.

**Method Signature:**
```typescript
daily.startTranscription(options?: TranscriptionOptions): Promise<TranscriptionStartResult>
```

**Parameters:**
```typescript
interface TranscriptionOptions {
  language?: string;           // Language code (default: 'en')
  model?: string;             // Transcription model
  tier?: string;              // Transcription quality tier
  profanity_filter?: boolean; // Filter profanity (default: false)
  redact?: boolean;          // Redact sensitive information
  punctuate?: boolean;       // Add punctuation (default: true)
  includeRawResponse?: boolean; // Include raw API response
  extra?: {                  // Additional provider-specific options
    [key: string]: any;
  };
}
```

**Detailed Parameter Descriptions:**

#### `language` (string, optional)
- **Default:** `'en'` (English)
- **Description:** ISO language code for transcription
- **Supported Languages:**
  - `'en'` - English
  - `'es'` - Spanish
  - `'fr'` - French
  - `'de'` - German
  - `'it'` - Italian
  - `'pt'` - Portuguese
  - `'nl'` - Dutch
  - `'ja'` - Japanese
  - `'ko'` - Korean
  - `'zh'` - Chinese

#### `model` (string, optional)
- **Default:** `'nova-2-general'`
- **Description:** Transcription model to use
- **Available Models:**
  - `'nova-2-general'` - Latest general-purpose model
  - `'nova-2-meeting'` - Optimized for meetings
  - `'enhanced'` - Enhanced accuracy model
  - `'base'` - Standard model

#### `tier` (string, optional)
- **Default:** Determined by plan
- **Description:** Quality/speed tier
- **Options:**
  - `'nova'` - Highest accuracy, slower
  - `'enhanced'` - Balanced accuracy and speed
  - `'base'` - Fastest, lower accuracy

#### `punctuate` (boolean, optional)
- **Default:** `true`
- **Description:** Whether to add punctuation to transcribed text

#### `includeRawResponse` (boolean, optional)
- **Default:** `false`
- **Description:** Include raw response from transcription provider

**Return Value:**
```typescript
interface TranscriptionStartResult {
  instanceId: string;        // Unique transcription instance ID
  startedBy: string;        // Session ID of who started transcription
  language: string;         // Confirmed language setting
  model: string;           // Confirmed model being used
  tier?: string;           // Confirmed tier
}
```

**Usage Examples:**

#### Basic Transcription Start
```javascript
try {
  const result = await daily.startTranscription({
    language: 'en',
    model: 'nova-2-general',
    punctuate: true
  });
  
  console.log('Transcription started:', result.instanceId);
} catch (error) {
  console.error('Failed to start transcription:', error.message);
}
```

#### Advanced Configuration
```javascript
const transcriptionConfig = {
  language: 'en',
  model: 'nova-2-meeting',
  tier: 'nova',
  punctuate: true,
  profanity_filter: false,
  includeRawResponse: true,
  extra: {
    // Provider-specific options
    word_timestamps: true,
    speaker_labels: true
  }
};

try {
  const result = await daily.startTranscription(transcriptionConfig);
  console.log('Advanced transcription started:', result);
} catch (error) {
  if (error.message.includes('not supported')) {
    console.error('Transcription not supported in this browser');
  } else if (error.message.includes('permission')) {
    console.error('Transcription requires a paid Daily.co plan');
  } else if (error.message.includes('already')) {
    console.error('Transcription is already running');
  } else {
    console.error('Transcription error:', error.message);
  }
}
```

#### React Implementation
```jsx
import { useDaily } from '@daily-co/daily-react';
import { useState, useCallback } from 'react';

const TranscriptionControls = () => {
  const daily = useDaily();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const startTranscription = useCallback(async () => {
    if (!daily) {
      setError('Meeting not initialized');
      return;
    }

    try {
      setError(null);
      const result = await daily.startTranscription({
        language: 'en',
        model: 'nova-2-general',
        punctuate: true,
        includeRawResponse: true
      });
      
      console.log('Transcription started:', result);
      setIsTranscribing(true);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      setError(error.message);
    }
  }, [daily]);

  return (
    <div>
      <button 
        onClick={startTranscription}
        disabled={!daily || isTranscribing}
      >
        Start Transcription
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### `daily.stopTranscription(instanceId?)`

Stops the currently running transcription.

**Method Signature:**
```typescript
daily.stopTranscription(instanceId?: string): Promise<TranscriptionStopResult>
```

**Parameters:**
- `instanceId` (string, optional): Specific transcription instance to stop. If not provided, stops the current transcription.

**Return Value:**
```typescript
interface TranscriptionStopResult {
  instanceId: string;       // ID of stopped transcription
  stoppedBy: string;       // Session ID of who stopped transcription
  messageCount?: number;   // Number of messages transcribed
  duration?: number;       // Transcription duration in seconds
}
```

**Usage Examples:**

#### Basic Stop
```javascript
try {
  const result = await daily.stopTranscription();
  console.log('Transcription stopped:', result);
} catch (error) {
  console.error('Failed to stop transcription:', error.message);
}
```

#### Stop Specific Instance
```javascript
const instanceId = 'transcription-instance-id';

try {
  const result = await daily.stopTranscription(instanceId);
  console.log(`Stopped transcription ${instanceId}:`, result);
} catch (error) {
  console.error('Failed to stop transcription:', error.message);
}
```

#### React Implementation
```jsx
const stopTranscription = useCallback(async () => {
  if (!daily) return;

  try {
    const result = await daily.stopTranscription();
    console.log('Transcription stopped:', result);
    setIsTranscribing(false);
  } catch (error) {
    console.error('Failed to stop transcription:', error);
    setError('Failed to stop transcription');
  }
}, [daily]);
```

## Transcription Status Methods

### `daily.getTranscription()`

Gets the current transcription status and configuration.

**Return Value:**
```typescript
interface TranscriptionStatus {
  isTranscribing: boolean;
  instanceId?: string;
  language?: string;
  model?: string;
  startedBy?: string;
  startedAt?: string;
}
```

**Example:**
```javascript
const status = daily.getTranscription();
console.log('Transcription active:', status.isTranscribing);
```

## Error Handling

### Common Error Types

#### Permission Errors
```javascript
try {
  await daily.startTranscription(options);
} catch (error) {
  if (error.message.includes('permission')) {
    // Handle paid plan requirement
    console.error('Transcription requires a paid Daily.co plan');
  }
}
```

#### Browser Support Errors
```javascript
try {
  await daily.startTranscription(options);
} catch (error) {
  if (error.message.includes('not supported')) {
    console.error('Transcription not supported in this browser');
    // Suggest using Chrome or Edge
  }
}
```

#### Already Running Errors
```javascript
try {
  await daily.startTranscription(options);
} catch (error) {
  if (error.message.includes('already')) {
    console.error('Transcription is already running');
    // Handle duplicate start attempt
  }
}
```

#### Network Errors
```javascript
try {
  await daily.startTranscription(options);
} catch (error) {
  if (error.message.includes('network') || error.message.includes('timeout')) {
    console.error('Network error starting transcription');
    // Retry logic
  }
}
```

### Comprehensive Error Handler
```javascript
const handleTranscriptionError = (error, operation = 'transcription') => {
  console.error(`${operation} error:`, error);
  
  if (error.message?.includes('not supported')) {
    return 'Transcription is not supported in this browser. Please use Chrome or Edge.';
  } else if (error.message?.includes('permission')) {
    return 'Transcription requires a paid Daily.co plan.';
  } else if (error.message?.includes('already')) {
    return 'Transcription is already running.';
  } else if (error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  } else if (error.message?.includes('room')) {
    return 'Meeting room error. Please rejoin the meeting.';
  } else {
    return `${operation} failed. Please try again.`;
  }
};
```

## Advanced Features

### Auto-Start Transcription
```jsx
const MeetingComponent = () => {
  const daily = useDaily();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Auto-start transcription after joining
  useEffect(() => {
    if (daily && daily.meetingState() === 'joined-meeting' && !isTranscribing) {
      const timer = setTimeout(async () => {
        try {
          await daily.startTranscription({
            language: 'en',
            model: 'nova-2-general',
            punctuate: true
          });
          setIsTranscribing(true);
        } catch (error) {
          console.error('Auto-start transcription failed:', error);
        }
      }, 2000); // Wait 2 seconds for meeting to stabilize
      
      return () => clearTimeout(timer);
    }
  }, [daily, isTranscribing]);

  return <div>Meeting content</div>;
};
```

### Conditional Transcription Start
```javascript
const startTranscriptionIfSupported = async () => {
  if (!daily) {
    throw new Error('Meeting not initialized');
  }

  // Check browser support
  if (!daily.supportedBrowser?.supportsFullDailyFeatures) {
    throw new Error('Browser does not support transcription');
  }

  // Check meeting state
  if (daily.meetingState() !== 'joined-meeting') {
    throw new Error('Must be in a meeting to start transcription');
  }

  // Check if already transcribing
  const status = daily.getTranscription();
  if (status.isTranscribing) {
    throw new Error('Transcription is already running');
  }

  return await daily.startTranscription({
    language: 'en',
    model: 'nova-2-general',
    punctuate: true
  });
};
```

### Retry Logic
```javascript
const startTranscriptionWithRetry = async (maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await daily.startTranscription({
        language: 'en',
        model: 'nova-2-general',
        punctuate: true
      });
    } catch (error) {
      console.error(`Transcription attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }
      
      // Only retry on network errors
      if (error.message.includes('network') || error.message.includes('timeout')) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      } else {
        throw error; // Don't retry non-network errors
      }
    }
  }
};
```

## Best Practices

### 1. Always Check Prerequisites
```javascript
const canStartTranscription = () => {
  if (!daily) return false;
  if (daily.meetingState() !== 'joined-meeting') return false;
  if (!daily.supportedBrowser?.supportsFullDailyFeatures) return false;
  
  const status = daily.getTranscription();
  return !status.isTranscribing;
};
```

### 2. Provide User Feedback
```jsx
const TranscriptionButton = () => {
  const [isStarting, setIsStarting] = useState(false);
  
  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startTranscription();
    } finally {
      setIsStarting(false);
    }
  };
  
  return (
    <button onClick={handleStart} disabled={isStarting}>
      {isStarting ? 'Starting...' : 'Start Transcription'}
    </button>
  );
};
```

### 3. Clean Up on Component Unmount
```jsx
useEffect(() => {
  return () => {
    // Stop transcription when component unmounts
    if (daily && daily.getTranscription().isTranscribing) {
      daily.stopTranscription().catch(console.error);
    }
  };
}, [daily]);
```

### 4. Handle Plan Limitations
```javascript
const handlePlanLimitation = (error) => {
  if (error.message.includes('permission') || error.message.includes('plan')) {
    // Show upgrade prompt
    showUpgradeModal({
      title: 'Transcription Requires Upgrade',
      message: 'Real-time transcription is available with Daily.co paid plans.',
      upgradeUrl: 'https://daily.co/pricing'
    });
  }
};
```

## Performance Considerations

### 1. Transcription Overhead
- Transcription uses additional bandwidth and processing
- Consider starting transcription only when needed
- Monitor performance with many participants

### 2. Memory Management
- Transcription messages can accumulate quickly
- Implement message cleanup for long meetings
- Consider limiting displayed messages

### 3. Network Optimization
- Transcription requires stable internet connection
- Consider quality fallbacks on poor connections
- Implement reconnection logic for network interruptions