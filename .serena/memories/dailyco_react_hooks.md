# Daily.co React Library - Hooks Documentation

## Overview
Daily React is a helper library that simplifies integrating `@daily-co/daily-js` in React applications. Provides React hooks and components for handling common patterns while preventing issues like duplicate DailyIframe instances.

## Installation & Setup
```bash
npm install @daily-co/daily-react @daily-co/daily-js jotai
```

### Provider Setup
```jsx
import { DailyProvider } from '@daily-co/daily-react';

function App({ roomUrl }) {
  return (
    <DailyProvider url={roomUrl}>
      {/* Your app content */}
    </DailyProvider>
  );
}
```

## Core Hooks

### useCallObject
```jsx
import { useCallObject } from '@daily-co/daily-react';

function MyComponent() {
  const callObject = useCallObject();
  
  const joinCall = () => {
    callObject.join({ url: 'https://domain.daily.co/room' });
  };
  
  const leaveCall = () => {
    callObject.leave();
  };
}
```

### useParticipants & useParticipantIds
```jsx
import { useParticipantIds, useParticipantProperty } from '@daily-co/daily-react';

function ParticipantRow({ id }) {
  const [username, videoState, audioState] = useParticipantProperty(id, [
    'user_name',
    'tracks.video.state', 
    'tracks.audio.state',
  ]);
  
  return (
    <li style={{ display: 'flex', gap: 8 }}>
      <span>{username ?? 'Guest'}</span>
      <span>📷{videoState === 'playable' ? '✅' : '❌'}</span>
      <span>🎙️{audioState === 'playable' ? '✅' : '❌'}</span>
    </li>
  );
}

function Participants() {
  const participantIds = useParticipantIds({
    filter: 'remote', // Options: 'local', 'remote', 'all'
    sort: 'user_name', // Sort by participant properties
  });
  
  return (
    <ul>
      {participantIds.map((id) => (
        <ParticipantRow key={id} id={id} />
      ))}
    </ul>
  );
}
```

### useLocalParticipant
```jsx
import { useLocalParticipant } from '@daily-co/daily-react';

function LocalControls() {
  const localParticipant = useLocalParticipant();
  
  return (
    <div>
      <p>Local user: {localParticipant?.user_name}</p>
      <p>Video: {localParticipant?.video ? 'On' : 'Off'}</p>
      <p>Audio: {localParticipant?.audio ? 'On' : 'Off'}</p>
    </div>
  );
}
```

## Media & Device Hooks

### useScreenShare
```jsx
import { useScreenShare } from '@daily-co/daily-react';

function ScreenShareControls() {
  const { screens, startScreenShare, stopScreenShare } = useScreenShare();
  
  const handleScreenShare = () => {
    if (screens.length > 0) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };
  
  return (
    <button onClick={handleScreenShare}>
      {screens.length > 0 ? 'Stop Sharing' : 'Share Screen'}
    </button>
  );
}
```

### useRecording
```jsx
import { useRecording } from '@daily-co/daily-react';

function RecordingControls() {
  const { isRecording, startRecording, stopRecording } = useRecording();
  
  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? 'Stop Recording' : 'Start Recording'}
    </button>
  );
}
```

### useDevices
```jsx
import { useDevices } from '@daily-co/daily-react';

function DeviceControls() {
  const { 
    cameras, 
    microphones, 
    speakers,
    setCamera,
    setMicrophone,
    setSpeaker 
  } = useDevices();
  
  return (
    <div>
      <select onChange={(e) => setCamera(e.target.value)}>
        {cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label}
          </option>
        ))}
      </select>
      {/* Similar selects for microphones and speakers */}
    </div>
  );
}
```

## Event Handling

### useDailyEvent
```jsx
import { useDailyEvent } from '@daily-co/daily-react';

function ErrorHandler() {
  useDailyEvent('error', (event) => {
    console.error('Daily error:', event);
    // Handle different error types
    switch (event.errorMsg) {
      case 'room not found':
        // Handle room not found
        break;
      case 'permission denied':
        // Handle permission issues
        break;
      default:
        // Handle other errors
    }
  });
  
  return null;
}
```

## Complete Example

### Video Call Component
```jsx
import React from 'react';
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useParticipantIds,
  useVideoTrack,
  useScreenShare,
  useDailyEvent
} from '@daily-co/daily-react';

function VideoCall({ roomUrl }) {
  return (
    <DailyProvider url={roomUrl}>
      <CallInterface />
    </DailyProvider>
  );
}

function CallInterface() {
  const callObject = useDaily();
  const localParticipant = useLocalParticipant();
  const participantIds = useParticipantIds({ filter: 'remote' });
  
  const joinCall = () => callObject.join();
  const leaveCall = () => callObject.leave();
  
  const toggleCamera = () => {
    callObject.setLocalVideo(!localParticipant?.video);
  };
  
  const toggleMicrophone = () => {
    callObject.setLocalAudio(!localParticipant?.audio);
  };
  
  return (
    <div className="call-interface">
      <div className="participants">
        <LocalVideo />
        {participantIds.map(id => (
          <RemoteVideo key={id} participantId={id} />
        ))}
      </div>
      
      <div className="controls">
        <button onClick={toggleCamera}>
          {localParticipant?.video ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
        <button onClick={toggleMicrophone}>
          {localParticipant?.audio ? 'Mute' : 'Unmute'}
        </button>
        <button onClick={leaveCall}>Leave Call</button>
      </div>
    </div>
  );
}

function LocalVideo() {
  const localParticipant = useLocalParticipant();
  const videoTrack = useVideoTrack(localParticipant?.session_id);
  
  return (
    <video
      ref={videoTrack.videoEl}
      autoPlay
      muted
      playsInline
    />
  );
}

function RemoteVideo({ participantId }) {
  const videoTrack = useVideoTrack(participantId);
  
  return (
    <video
      ref={videoTrack.videoEl}
      autoPlay
      playsInline
    />
  );
}
```

## Performance Best Practices

1. **Use Specific Property Hooks**: Use `useParticipantProperty` instead of `useParticipant` when you only need specific properties
2. **Filter Participants**: Use `useParticipantIds` with filters to reduce unnecessary renders
3. **Event Handling**: Use `useDailyEvent` for proper event listener management
4. **Memoization**: Combine hooks with React.memo and useMemo for complex components

## Integration with daily-js

```jsx
import Daily from '@daily-co/daily-js';
import { DailyProvider } from '@daily-co/daily-react';

// Option 1: Let DailyProvider create the call object
function App() {
  return (
    <DailyProvider url="https://domain.daily.co/room">
      <MyApp />
    </DailyProvider>
  );
}

// Option 2: Pass your own call object
function App() {
  const callObject = Daily.createCallObject({
    url: 'https://domain.daily.co/room',
    userName: 'User Name'
  });
  
  return (
    <DailyProvider callObject={callObject}>
      <MyApp />
    </DailyProvider>
  );
}
```

## Key Benefits

- **Simplified State Management**: Automatic state synchronization with Daily events
- **Performance Optimized**: Efficient re-rendering with jotai-based state
- **React-Native**: Follows React patterns and conventions
- **Error Prevention**: Prevents common issues like duplicate instances
- **TypeScript Support**: Full type definitions included