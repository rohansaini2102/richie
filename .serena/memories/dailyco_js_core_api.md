# Daily.co JavaScript SDK - Core API Documentation

## Overview
Daily.co provides a powerful JavaScript SDK called **daily-js** for building custom video and audio calling applications. Built on EventEmitter interface with two main approaches:

- **Daily Prebuilt**: Ready-to-use embeddable video chat interface
- **Call Object Mode**: Custom implementations with full control

## Installation
```bash
npm install @daily-co/daily-js
# or load from CDN
<script src="https://unpkg.com/@daily-co/daily-js"></script>
```

## Core Factory Methods

### createCallObject()
```javascript
import DailyIframe from '@daily-co/daily-js';

const callObject = DailyIframe.createCallObject({
  url: 'https://your-team.daily.co/room-name', // Optional
  audioSource: false, // or MediaStreamTrack object
  allowMultipleCallInstances: true, // Default: false (v0.67.0+)
  strictMode: false, // Being replaced by allowMultipleCallInstances
});
```

### createFrame() - For Prebuilt
```javascript
const callFrame = DailyIframe.createFrame(element, {
  url: 'https://your-team.daily.co/room-name',
  showLeaveButton: true,
  showFullscreenButton: true
});
```

## Essential Instance Methods

### Meeting Management
```javascript
// Join a meeting
await callObject.join({
  url: 'https://your-team.daily.co/room-name',
  userName: 'User Name',
  userData: { customData: 'value' },
  startAudioOff: false,
  startVideoOff: false
});

// Leave meeting
await callObject.leave();

// Check meeting state
const state = callObject.meetingState();
// States: 'new', 'loading', 'loaded', 'joining', 'joined', 'left', 'error'

// Get participants
const participants = callObject.participants();

// Destroy when done
callObject.destroy();
```

### Participant Management
```javascript
// Update participant
await callObject.updateParticipant('session-id', {
  setAudio: false,
  setVideo: true,
  userData: { newData: 'value' }
});

// Eject participant (if permissions allow)
await callObject.updateParticipant('session-id', {
  eject: true
});
```

### Recording Control
```javascript
// Start recording
await callObject.startRecording({
  layout: {
    type: 'grid', // 'single-participant', 'active-participant'
    grid: {
      video: {
        showParticipantNames: true,
        backgroundColor: '#000000'
      }
    }
  },
  instanceId: 'unique-recording-id'
});

// Stop recording
await callObject.stopRecording('optional-instance-id');
```

## Event System

### Event Management
```javascript
// Add event listeners
callObject
  .on('joined-meeting', handleJoinedMeeting)
  .on('left-meeting', handleLeftMeeting)
  .on('participant-joined', handleParticipantJoined)
  .on('participant-updated', handleParticipantUpdated)
  .on('participant-left', handleParticipantLeft);

// Remove listeners
callObject.off('event-name', handlerFunction);

// One-time listener
callObject.once('joined-meeting', handleJoinedMeeting);
```

### Key Events
- **Meeting Events**: `joined-meeting`, `left-meeting`, `meeting-session-updated`
- **Participant Events**: `participant-joined`, `participant-updated`, `participant-left`
- **Recording Events**: `recording-started`, `recording-stopped`, `recording-error`, `recording-ready-to-download`
- **Error Events**: `error`, `camera-error`, `recording-error`

## Participant Object Structure
```javascript
const participant = {
  user_id: 'unique-user-id',
  session_id: 'session-identifier',
  audio: { track: MediaStreamTrack, state: 'playable' },
  video: { track: MediaStreamTrack, state: 'playable' },
  screen: { track: MediaStreamTrack, state: 'off' },
  tracks: {
    audio: { /* detailed track info */ },
    video: { /* detailed track info */ },
    screenAudio: { /* screen audio info */ },
    screenVideo: { /* screen video info */ }
  },
  userData: { /* custom data */ },
  permissions: { /* participant permissions */ }
};
```

## Error Handling Best Practices
```javascript
// Comprehensive error handling
callObject
  .on('error', (event) => {
    console.error('General error:', event);
    handleGeneralError(event);
  })
  .on('camera-error', (event) => {
    if (event.error?.type === 'permissions') {
      showPermissionError();
    } else if (event.error?.type === 'cam-in-use') {
      showDeviceInUseError();
    }
  });

// Try-catch for async operations
try {
  await callObject.join({ url: roomUrl });
} catch (error) {
  if (error.type === 'room-full') {
    showRoomFullError();
  } else if (error.type === 'permissions') {
    showPermissionError();
  }
}
```

## Common Error Types
- **`permissions`**: Device permissions denied
- **`cam-in-use`** / **`mic-in-use`**: Device already in use
- **`room-full`**: Meeting room at capacity
- **`network`**: Network connectivity issues
- **`quota-exceeded`**: Recording quota exceeded

## Resource Management
```javascript
// Clean up resources
const cleanup = () => {
  // Release media resources
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    video.srcObject = null;
  });
  
  // Destroy call object
  callObject.destroy();
};

// In React useEffect
useEffect(() => {
  return cleanup;
}, []);
```

## Performance Tips
- Enable `allowMultipleCallInstances: true` for v0.67.0+
- Always clean up video srcObjects to prevent memory leaks
- Use proper event listener cleanup
- Implement proper error boundaries
- Monitor network quality for optimal experience