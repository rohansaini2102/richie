# Daily.js API Overview

## Introduction

Daily.js is the core JavaScript library for building video calling applications with Daily.co. This documentation covers the main API features, initialization, configuration, and core methods.

## Installation

```bash
npm install @daily-co/daily-js
npm install @daily-co/daily-react  # For React integration
```

## Basic Setup

### React Integration with DailyProvider

```jsx
import { DailyProvider, useDaily, useDailyEvent } from '@daily-co/daily-react';

const App = () => {
  return (
    <DailyProvider url="https://your-domain.daily.co/room-name">
      <MeetingComponent />
    </DailyProvider>
  );
};
```

### Using the Daily Hook

```jsx
import { useDaily, useDailyEvent } from '@daily-co/daily-react';

const MeetingComponent = () => {
  const daily = useDaily();
  
  // Daily instance is available once initialized
  if (!daily) {
    return <div>Loading...</div>;
  }
  
  return <div>Meeting content</div>;
};
```

## Core Daily Instance Methods

### Meeting Control Methods

#### `daily.join(properties?)`
Joins a meeting room.

**Parameters:**
- `properties` (object, optional): Join configuration
  - `url` (string): Room URL
  - `token` (string): Meeting token for private rooms
  - `userName` (string): Participant display name
  - `userData` (object): Custom participant data

**Returns:** Promise that resolves when join is complete

**Example:**
```javascript
await daily.join({
  url: 'https://domain.daily.co/room',
  userName: 'John Doe',
  userData: { role: 'advisor' }
});
```

#### `daily.leave()`
Leaves the current meeting.

**Returns:** Promise that resolves when leave is complete

**Example:**
```javascript
await daily.leave();
```

### Media Control Methods

#### `daily.setLocalAudio(enabled)`
Controls local audio (microphone).

**Parameters:**
- `enabled` (boolean): true to unmute, false to mute

**Returns:** Daily instance (chainable)

**Example:**
```javascript
// Mute microphone
daily.setLocalAudio(false);

// Unmute microphone
daily.setLocalAudio(true);
```

#### `daily.setLocalVideo(enabled)`
Controls local video (camera).

**Parameters:**
- `enabled` (boolean): true to turn on camera, false to turn off

**Returns:** Daily instance (chainable)

**Example:**
```javascript
// Turn off camera
daily.setLocalVideo(false);

// Turn on camera
daily.setLocalVideo(true);
```

#### `daily.localAudio()` / `daily.localVideo()`
Gets current local media state.

**Returns:** boolean indicating if audio/video is enabled

**Example:**
```javascript
const isAudioOn = daily.localAudio();
const isVideoOn = daily.localVideo();
```

### Participant Management

#### `daily.participants()`
Gets all current participants in the meeting.

**Returns:** Object with participant session IDs as keys

**Example:**
```javascript
const participants = daily.participants();
console.log('Participant count:', Object.keys(participants).length);

// Access specific participant
Object.values(participants).forEach(participant => {
  console.log('Participant:', participant.user_name);
  console.log('Audio enabled:', participant.audio);
  console.log('Video enabled:', participant.video);
  console.log('Is local:', participant.local);
});
```

**Participant Object Structure:**
```typescript
interface Participant {
  session_id: string;
  user_id: string;
  user_name: string;
  local: boolean;
  audio: boolean;
  video: boolean;
  screen: boolean;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  userData?: any;
}
```

### Meeting State Methods

#### `daily.meetingState()`
Gets current meeting state.

**Returns:** String indicating current state:
- `'new'` - Meeting instance created but not joined
- `'loading'` - In process of joining
- `'joined-meeting'` - Successfully joined
- `'left-meeting'` - Left the meeting
- `'error'` - Error occurred

**Example:**
```javascript
const state = daily.meetingState();
console.log('Current state:', state);
```

#### `daily.room()`
Gets information about the current room.

**Returns:** Room object with properties:
- `url` (string): Room URL
- `domainName` (string): Daily domain
- `roomName` (string): Room name
- `config` (object): Room configuration

**Example:**
```javascript
const room = daily.room();
console.log('Room URL:', room.url);
console.log('Room name:', room.roomName);
```

### Device Management

#### `daily.getInputDevices()`
Gets available input devices (cameras and microphones).

**Returns:** Promise resolving to device list

**Example:**
```javascript
const devices = await daily.getInputDevices();
console.log('Cameras:', devices.video);
console.log('Microphones:', devices.audio);
```

#### `daily.setInputDevicesAsync(deviceSettings)`
Sets input devices to use.

**Parameters:**
- `deviceSettings` (object):
  - `audioDeviceId` (string): Microphone device ID
  - `videoDeviceId` (string): Camera device ID

**Returns:** Promise

**Example:**
```javascript
await daily.setInputDevicesAsync({
  audioDeviceId: 'microphone-device-id',
  videoDeviceId: 'camera-device-id'
});
```

## Meeting Events

### Event Listener Registration

#### `useDailyEvent(eventName, callback)`
React hook for subscribing to Daily events.

**Parameters:**
- `eventName` (string): Name of the event to listen for
- `callback` (function): Event handler function

**Example:**
```jsx
import { useDailyEvent } from '@daily-co/daily-react';

const MeetingComponent = () => {
  useDailyEvent('participant-joined', (event) => {
    console.log('Participant joined:', event.participant.user_name);
  });
  
  useDailyEvent('participant-left', (event) => {
    console.log('Participant left:', event.participant.user_name);
  });
  
  return <div>Meeting UI</div>;
};
```

### Core Meeting Events

#### `'joining-meeting'`
Fired when starting to join a meeting.

**Event Object:**
```typescript
{
  action: 'joining-meeting'
}
```

#### `'joined-meeting'`
Fired when successfully joined a meeting.

**Event Object:**
```typescript
{
  action: 'joined-meeting',
  participants: { [sessionId: string]: Participant }
}
```

#### `'left-meeting'`
Fired when left a meeting.

**Event Object:**
```typescript
{
  action: 'left-meeting'
}
```

#### `'participant-joined'`
Fired when a participant joins.

**Event Object:**
```typescript
{
  action: 'participant-joined',
  participant: Participant
}
```

#### `'participant-updated'`
Fired when participant properties change (audio/video state, etc.).

**Event Object:**
```typescript
{
  action: 'participant-updated',
  participant: Participant
}
```

#### `'participant-left'`
Fired when a participant leaves.

**Event Object:**
```typescript
{
  action: 'participant-left',
  participant: Participant
}
```

### Error Events

#### `'error'`
Fired when an error occurs.

**Event Object:**
```typescript
{
  action: 'error',
  errorMsg: string,
  error?: Error
}
```

## Configuration Options

### Room Configuration

When creating a room, you can specify various configuration options:

```javascript
const roomConfig = {
  properties: {
    // Meeting duration in seconds
    exp: Math.round(Date.now() / 1000) + 3600, // 1 hour from now
    
    // Enable/disable features
    enable_screenshare: true,
    enable_chat: true,
    enable_knocking: false,
    
    // Recording settings
    enable_recording: 'cloud',
    
    // Transcription settings
    enable_transcription: true,
    
    // Audio/video defaults
    start_audio_off: false,
    start_video_off: false,
    
    // UI customization
    owner_only_broadcast: false,
    autojoin: true
  }
};
```

## Browser Support

Daily.js supports modern browsers with WebRTC capabilities:

- Chrome 74+
- Firefox 79+
- Safari 14+
- Edge 79+

### Feature Detection

```javascript
// Check if browser supports Daily.js features
const daily = useDaily();

if (daily?.supportedBrowser?.supportsFullDailyFeatures) {
  console.log('Full Daily.js features supported');
} else {
  console.log('Limited Daily.js support');
}
```

## Error Handling

### Common Error Scenarios

```javascript
// Handle permission errors
useDailyEvent('error', (event) => {
  if (event.errorMsg.includes('permission')) {
    console.error('Camera/microphone permission denied');
  } else if (event.errorMsg.includes('not supported')) {
    console.error('Feature not supported in this browser');
  }
});

// Handle join errors
try {
  await daily.join();
} catch (error) {
  if (error.message.includes('room not found')) {
    console.error('Meeting room does not exist');
  } else if (error.message.includes('meeting is full')) {
    console.error('Meeting has reached capacity');
  }
}
```

## Best Practices

### 1. Component Structure
```jsx
const MeetingRoom = ({ roomUrl }) => {
  return (
    <DailyProvider url={roomUrl}>
      <MeetingContent />
    </DailyProvider>
  );
};

const MeetingContent = () => {
  const daily = useDaily();
  
  // Always check if daily is available
  if (!daily) {
    return <LoadingSpinner />;
  }
  
  return <MeetingUI />;
};
```

### 2. State Management
```jsx
const [participants, setParticipants] = useState({});
const [meetingState, setMeetingState] = useState('new');

// Update participants on events
useDailyEvent('participant-joined', (event) => {
  setParticipants(prev => ({
    ...prev,
    [event.participant.session_id]: event.participant
  }));
});

useDailyEvent('participant-left', (event) => {
  setParticipants(prev => {
    const updated = { ...prev };
    delete updated[event.participant.session_id];
    return updated;
  });
});

// Track meeting state
useDailyEvent('joining-meeting', () => setMeetingState('joining'));
useDailyEvent('joined-meeting', () => setMeetingState('joined'));
useDailyEvent('left-meeting', () => setMeetingState('left'));
```

### 3. Cleanup
```jsx
useEffect(() => {
  return () => {
    // Clean up when component unmounts
    if (daily && daily.meetingState() !== 'left-meeting') {
      daily.leave();
    }
  };
}, [daily]);
```

### 4. Media Handling
```jsx
// Render participant video
const renderParticipantVideo = (participant) => {
  return (
    <video
      ref={(el) => {
        if (el && participant.videoTrack) {
          el.srcObject = new MediaStream([participant.videoTrack]);
        }
      }}
      autoPlay
      playsInline
      muted={participant.local} // Mute local participant to avoid echo
    />
  );
};
```

## Performance Considerations

### 1. Participant Limit
- Consider UI performance with many participants
- Implement pagination or virtual scrolling for large meetings

### 2. Video Quality
```javascript
// Adjust video quality based on participant count
const participantCount = Object.keys(participants).length;
const videoQuality = participantCount > 6 ? 'low' : 'high';

await daily.updateInputSettings({
  video: {
    processor: {
      type: 'background-blur' // or 'background-replacement'
    }
  }
});
```

### 3. Event Handler Optimization
```jsx
// Use useCallback to prevent unnecessary re-renders
const handleParticipantJoined = useCallback((event) => {
  setParticipants(prev => ({
    ...prev,
    [event.participant.session_id]: event.participant
  }));
}, []);

useDailyEvent('participant-joined', handleParticipantJoined);
```