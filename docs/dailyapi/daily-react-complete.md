# Daily React Complete Documentation

## Overview

Daily React (`@daily-co/daily-react`) is a comprehensive library that simplifies the integration of Daily.co's video and audio communication features into React applications. It provides a complete set of React hooks and components to build real-time video conferencing applications with minimal complexity.

## Table of Contents

1. [Installation and Setup](#installation-and-setup)
2. [DailyProvider Configuration](#dailyprovider-configuration)
3. [Core Hooks Reference](#core-hooks-reference)
4. [Component Patterns](#component-patterns)
5. [State Management](#state-management)
6. [Performance Optimization](#performance-optimization)
7. [TypeScript Integration](#typescript-integration)
8. [Testing Patterns](#testing-patterns)
9. [Integration Guidelines](#integration-guidelines)
10. [Error Handling](#error-handling)
11. [Advanced Patterns](#advanced-patterns)
12. [Best Practices](#best-practices)

## Installation and Setup

### Prerequisites

- React 16.8+ (hooks support required)
- Node.js 14.0+
- Daily.co account and API key

### Installation

```bash
# Install the complete package set
npm install @daily-co/daily-react @daily-co/daily-js jotai

# Or with yarn
yarn add @daily-co/daily-react @daily-co/daily-js jotai
```

### Basic Setup

```jsx
import React from 'react';
import { DailyProvider } from '@daily-co/daily-react';
import VideoCall from './VideoCall';

function App() {
  const roomUrl = 'https://your-domain.daily.co/room-name';
  
  return (
    <DailyProvider url={roomUrl}>
      <VideoCall />
    </DailyProvider>
  );
}

export default App;
```

## DailyProvider Configuration

The `DailyProvider` is the root component that provides Daily.co functionality to your React application.

### Basic Configuration

```jsx
import { DailyProvider } from '@daily-co/daily-react';

function App() {
  return (
    <DailyProvider
      url="https://your-domain.daily.co/room-name"
      token="your-meeting-token" // Optional
      domain="your-domain.daily.co" // Optional
    >
      {/* Your app components */}
    </DailyProvider>
  );
}
```

### Advanced Configuration

```jsx
import { DailyProvider } from '@daily-co/daily-react';

function App() {
  const dailyConfig = {
    url: 'https://your-domain.daily.co/room-name',
    token: process.env.REACT_APP_DAILY_TOKEN,
    
    // Call object properties
    properties: {
      userName: 'User Name',
      userData: { userId: '123', role: 'participant' },
      startVideoOff: false,
      startAudioOff: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
        enableScreenshotOnJoin: true,
      }
    },
    
    // Meeting configuration
    meetingSessionState: {
      topology: 'sfu',
      enableRecording: true,
      enableTranscription: true,
    }
  };

  return (
    <DailyProvider {...dailyConfig}>
      {/* Your app components */}
    </DailyProvider>
  );
}
```

## Core Hooks Reference

### useDaily

Access the Daily call object instance directly.

```jsx
import { useDaily } from '@daily-co/daily-react';

function CallControls() {
  const daily = useDaily();
  
  const joinCall = async () => {
    try {
      await daily.join();
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  };
  
  const leaveCall = async () => {
    await daily.leave();
  };
  
  return (
    <div>
      <button onClick={joinCall}>Join Call</button>
      <button onClick={leaveCall}>Leave Call</button>
    </div>
  );
}
```

### useDailyEvent

Listen to Daily.co events with automatic cleanup.

```jsx
import { useDailyEvent } from '@daily-co/daily-react';
import { useCallback, useState } from 'react';

function EventListener() {
  const [participants, setParticipants] = useState({});
  
  const handleParticipantJoined = useCallback((event) => {
    setParticipants(prev => ({
      ...prev,
      [event.participant.session_id]: event.participant
    }));
  }, []);
  
  const handleParticipantLeft = useCallback((event) => {
    setParticipants(prev => {
      const updated = { ...prev };
      delete updated[event.participant.session_id];
      return updated;
    });
  }, []);
  
  useDailyEvent('participant-joined', handleParticipantJoined);
  useDailyEvent('participant-left', handleParticipantLeft);
  
  return (
    <div>
      <h3>Participants: {Object.keys(participants).length}</h3>
    </div>
  );
}
```

### useParticipants and useParticipantIds

Manage participant state and access participant information.

```jsx
import { 
  useParticipants, 
  useParticipantIds, 
  useParticipant,
  useLocalParticipant 
} from '@daily-co/daily-react';

function ParticipantsList() {
  const participants = useParticipants();
  const participantIds = useParticipantIds({
    filter: 'remote', // 'local', 'remote', or 'all'
    sort: 'user_name' // 'user_name', 'joined_at', or custom function
  });
  const localParticipant = useLocalParticipant();
  
  return (
    <div className="participants-list">
      {/* Local participant */}
      <div className="local-participant">
        <h4>You: {localParticipant?.user_name}</h4>
        <ParticipantVideo participantId={localParticipant?.session_id} />
      </div>
      
      {/* Remote participants */}
      <div className="remote-participants">
        {participantIds.map(id => (
          <ParticipantItem key={id} participantId={id} />
        ))}
      </div>
    </div>
  );
}

function ParticipantItem({ participantId }) {
  const participant = useParticipant(participantId);
  
  if (!participant) return null;
  
  return (
    <div className="participant-item">
      <h5>{participant.user_name}</h5>
      <ParticipantVideo participantId={participantId} />
      <div className="participant-status">
        Audio: {participant.audio ? '🔊' : '🔇'}
        Video: {participant.video ? '📹' : '📷'}
      </div>
    </div>
  );
}
```

### useMediaTrack

Access and display video/audio tracks.

```jsx
import { useMediaTrack } from '@daily-co/daily-react';
import { useEffect, useRef } from 'react';

function ParticipantVideo({ participantId, type = 'video' }) {
  const videoRef = useRef(null);
  const videoTrack = useMediaTrack(participantId, type);
  const audioTrack = useMediaTrack(participantId, 'audio');
  
  useEffect(() => {
    if (videoRef.current && videoTrack.track) {
      videoRef.current.srcObject = new MediaStream([videoTrack.track]);
    }
  }, [videoTrack]);
  
  return (
    <div className="participant-video">
      <video
        ref={videoRef}
        autoPlay
        muted={type === 'video'} // Mute video element, audio handled separately
        playsInline
        style={{
          width: '100%',
          height: 'auto',
          display: videoTrack.isOff ? 'none' : 'block'
        }}
      />
      {videoTrack.isOff && (
        <div className="video-off-placeholder">
          Video Off
        </div>
      )}
    </div>
  );
}

function ScreenShareDisplay() {
  const screenVideoRef = useRef(null);
  const screenAudioRef = useRef(null);
  
  const { participants } = useParticipants();
  const screenShareParticipant = Object.values(participants).find(
    p => p.screen && p.screen.isOff === false
  );
  
  const screenVideo = useMediaTrack(
    screenShareParticipant?.session_id, 
    'screenVideo'
  );
  const screenAudio = useMediaTrack(
    screenShareParticipant?.session_id, 
    'screenAudio'
  );
  
  useEffect(() => {
    if (screenVideoRef.current && screenVideo.track) {
      screenVideoRef.current.srcObject = new MediaStream([screenVideo.track]);
    }
  }, [screenVideo]);
  
  useEffect(() => {
    if (screenAudioRef.current && screenAudio.track) {
      screenAudioRef.current.srcObject = new MediaStream([screenAudio.track]);
    }
  }, [screenAudio]);
  
  if (!screenShareParticipant) return null;
  
  return (
    <div className="screen-share-display">
      <h4>Screen Share by {screenShareParticipant.user_name}</h4>
      <video
        ref={screenVideoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: 'auto' }}
      />
      <audio ref={screenAudioRef} autoPlay />
    </div>
  );
}
```

### useDevices

Manage media devices (cameras, microphones, speakers).

```jsx
import { useDevices } from '@daily-co/daily-react';
import { useState } from 'react';

function DeviceSelector() {
  const { devices, refreshDevices } = useDevices();
  const [selectedDevices, setSelectedDevices] = useState({
    camera: '',
    microphone: '',
    speaker: ''
  });
  
  const handleDeviceChange = async (deviceType, deviceId) => {
    setSelectedDevices(prev => ({
      ...prev,
      [deviceType]: deviceId
    }));
    
    try {
      if (deviceType === 'camera') {
        await daily.setInputDevicesAsync({ videoDeviceId: deviceId });
      } else if (deviceType === 'microphone') {
        await daily.setInputDevicesAsync({ audioDeviceId: deviceId });
      } else if (deviceType === 'speaker') {
        await daily.setOutputDeviceAsync({ outputDeviceId: deviceId });
      }
    } catch (error) {
      console.error('Failed to set device:', error);
    }
  };
  
  return (
    <div className="device-selector">
      <div className="device-group">
        <label>Camera:</label>
        <select
          value={selectedDevices.camera}
          onChange={(e) => handleDeviceChange('camera', e.target.value)}
        >
          <option value="">Default</option>
          {devices.camera?.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="device-group">
        <label>Microphone:</label>
        <select
          value={selectedDevices.microphone}
          onChange={(e) => handleDeviceChange('microphone', e.target.value)}
        >
          <option value="">Default</option>
          {devices.microphone?.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="device-group">
        <label>Speaker:</label>
        <select
          value={selectedDevices.speaker}
          onChange={(e) => handleDeviceChange('speaker', e.target.value)}
        >
          <option value="">Default</option>
          {devices.speaker?.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
      
      <button onClick={refreshDevices}>
        Refresh Devices
      </button>
    </div>
  );
}
```

### useMeetingState

Track the overall meeting state.

```jsx
import { useMeetingState } from '@daily-co/daily-react';

function MeetingStatusIndicator() {
  const meetingState = useMeetingState();
  
  const getStatusColor = () => {
    switch (meetingState) {
      case 'new': return '#gray';
      case 'loading': return '#yellow';
      case 'joined-meeting': return '#green';
      case 'left-meeting': return '#red';
      case 'error': return '#red';
      default: return '#gray';
    }
  };
  
  const getStatusText = () => {
    switch (meetingState) {
      case 'new': return 'Not connected';
      case 'loading': return 'Connecting...';
      case 'joined-meeting': return 'Connected';
      case 'left-meeting': return 'Disconnected';
      case 'error': return 'Connection error';
      default: return 'Unknown';
    }
  };
  
  return (
    <div className="meeting-status">
      <div 
        className="status-indicator"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span>{getStatusText()}</span>
    </div>
  );
}
```

### useTranscription

Manage meeting transcription (see existing transcription documentation for complete details).

```jsx
import { useTranscription } from '@daily-co/daily-react';

function TranscriptionControls() {
  const {
    isTranscriptionEnabled,
    isTranscribing,
    startTranscription,
    stopTranscription,
    transcriptionError
  } = useTranscription();
  
  if (!isTranscriptionEnabled) {
    return <div>Transcription not available</div>;
  }
  
  return (
    <div className="transcription-controls">
      <button
        onClick={() => startTranscription({ language: 'en-US' })}
        disabled={isTranscribing}
      >
        Start Transcription
      </button>
      <button
        onClick={stopTranscription}
        disabled={!isTranscribing}
      >
        Stop Transcription
      </button>
      {transcriptionError && (
        <div className="error">Error: {transcriptionError.message}</div>
      )}
    </div>
  );
}
```

### useScreenShare

Manage screen sharing functionality.

```jsx
import { useScreenShare } from '@daily-co/daily-react';

function ScreenShareControls() {
  const {
    isSharingScreen,
    startScreenShare,
    stopScreenShare,
    screenShareError
  } = useScreenShare();
  
  const handleStartScreenShare = async () => {
    try {
      await startScreenShare({
        mediaStreamConstraints: {
          video: true,
          audio: true
        }
      });
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  };
  
  return (
    <div className="screen-share-controls">
      <button
        onClick={isSharingScreen ? stopScreenShare : handleStartScreenShare}
        className={isSharingScreen ? 'stop-share' : 'start-share'}
      >
        {isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
      </button>
      {screenShareError && (
        <div className="error">
          Screen share error: {screenShareError.message}
        </div>
      )}
    </div>
  );
}
```

### useRecording

Control meeting recording.

```jsx
import { useRecording } from '@daily-co/daily-react';

function RecordingControls() {
  const {
    isRecording,
    recordingStartedBy,
    startRecording,
    stopRecording,
    recordingError
  } = useRecording();
  
  const handleStartRecording = async () => {
    try {
      await startRecording({
        layout: {
          preset: 'default'
        },
        instanceId: `recording-${Date.now()}`
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  return (
    <div className="recording-controls">
      <button
        onClick={isRecording ? stopRecording : handleStartRecording}
        className={isRecording ? 'stop-recording' : 'start-recording'}
      >
        {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
      </button>
      
      {isRecording && recordingStartedBy && (
        <div className="recording-info">
          Recording started by {recordingStartedBy.user_name}
        </div>
      )}
      
      {recordingError && (
        <div className="error">
          Recording error: {recordingError.message}
        </div>
      )}
    </div>
  );
}
```

### useNetwork

Monitor network quality and connection status.

```jsx
import { useNetwork } from '@daily-co/daily-react';

function NetworkQualityIndicator() {
  const { quality, rtt, packetLoss } = useNetwork();
  
  const getQualityColor = () => {
    switch (quality) {
      case 'good': return '#4CAF50';
      case 'low': return '#FF9800';
      case 'very-low': return '#F44336';
      default: return '#9E9E9E';
    }
  };
  
  const getQualityText = () => {
    switch (quality) {
      case 'good': return 'Good';
      case 'low': return 'Poor';
      case 'very-low': return 'Very Poor';
      default: return 'Unknown';
    }
  };
  
  return (
    <div className="network-quality">
      <div 
        className="quality-indicator"
        style={{ color: getQualityColor() }}
      >
        📶 {getQualityText()}
      </div>
      <div className="network-stats">
        <small>
          RTT: {rtt}ms | Packet Loss: {(packetLoss * 100).toFixed(1)}%
        </small>
      </div>
    </div>
  );
}
```

## Component Patterns

### Complete Video Call Component

```jsx
import React, { useState, useCallback } from 'react';
import {
  useDaily,
  useMeetingState,
  useParticipantIds,
  useLocalParticipant,
  useScreenShare,
  useRecording,
  useTranscription
} from '@daily-co/daily-react';

function VideoCallInterface() {
  const [isJoined, setIsJoined] = useState(false);
  const [userName, setUserName] = useState('');
  
  const daily = useDaily();
  const meetingState = useMeetingState();
  const participantIds = useParticipantIds({ filter: 'remote' });
  const localParticipant = useLocalParticipant();
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const { isTranscribing, startTranscription, stopTranscription } = useTranscription();
  
  const joinCall = useCallback(async () => {
    try {
      await daily.setUserName(userName);
      await daily.join();
      setIsJoined(true);
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  }, [daily, userName]);
  
  const leaveCall = useCallback(async () => {
    await daily.leave();
    setIsJoined(false);
  }, [daily]);
  
  const toggleVideo = useCallback(async () => {
    await daily.setLocalVideo(!localParticipant?.video);
  }, [daily, localParticipant]);
  
  const toggleAudio = useCallback(async () => {
    await daily.setLocalAudio(!localParticipant?.audio);
  }, [daily, localParticipant]);
  
  if (meetingState === 'new' || !isJoined) {
    return (
      <div className="join-interface">
        <h2>Join Video Call</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button 
          onClick={joinCall}
          disabled={!userName.trim() || meetingState === 'loading'}
        >
          {meetingState === 'loading' ? 'Joining...' : 'Join Call'}
        </button>
      </div>
    );
  }
  
  return (
    <div className="video-call-interface">
      {/* Header */}
      <div className="call-header">
        <h2>Video Call</h2>
        <div className="call-info">
          Participants: {participantIds.length + 1}
        </div>
      </div>
      
      {/* Video Grid */}
      <div className="video-grid">
        {/* Local Participant */}
        <div className="video-tile local">
          <ParticipantVideo 
            participantId={localParticipant?.session_id}
            isLocal={true}
          />
          <div className="participant-name">
            {localParticipant?.user_name} (You)
          </div>
        </div>
        
        {/* Remote Participants */}
        {participantIds.map(id => (
          <div key={id} className="video-tile">
            <ParticipantVideo participantId={id} />
          </div>
        ))}
      </div>
      
      {/* Screen Share */}
      {isSharingScreen && (
        <div className="screen-share-container">
          <ScreenShareDisplay />
        </div>
      )}
      
      {/* Controls */}
      <div className="call-controls">
        <button
          onClick={toggleVideo}
          className={localParticipant?.video ? 'active' : 'inactive'}
        >
          {localParticipant?.video ? '📹' : '📷'}
        </button>
        
        <button
          onClick={toggleAudio}
          className={localParticipant?.audio ? 'active' : 'inactive'}
        >
          {localParticipant?.audio ? '🔊' : '🔇'}
        </button>
        
        <button
          onClick={isSharingScreen ? stopScreenShare : startScreenShare}
          className={isSharingScreen ? 'active' : 'inactive'}
        >
          🖥️
        </button>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'recording' : 'inactive'}
        >
          {isRecording ? '⏹️' : '🔴'}
        </button>
        
        <button
          onClick={isTranscribing ? stopTranscription : () => startTranscription({ language: 'en-US' })}
          className={isTranscribing ? 'active' : 'inactive'}
        >
          📝
        </button>
        
        <button onClick={leaveCall} className="leave-call">
          📞 Leave
        </button>
      </div>
    </div>
  );
}
```

### Responsive Video Grid

```jsx
import React, { useMemo } from 'react';
import { useParticipantIds, useLocalParticipant } from '@daily-co/daily-react';

function ResponsiveVideoGrid() {
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();
  
  const allParticipants = useMemo(() => {
    const participants = [...participantIds];
    if (localParticipant) {
      participants.unshift(localParticipant.session_id);
    }
    return participants;
  }, [participantIds, localParticipant]);
  
  const getGridLayout = (count) => {
    if (count === 1) return { columns: 1, rows: 1 };
    if (count === 2) return { columns: 2, rows: 1 };
    if (count <= 4) return { columns: 2, rows: 2 };
    if (count <= 6) return { columns: 3, rows: 2 };
    if (count <= 9) return { columns: 3, rows: 3 };
    return { columns: 4, rows: Math.ceil(count / 4) };
  };
  
  const layout = getGridLayout(allParticipants.length);
  
  return (
    <div 
      className="video-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        gap: '8px',
        height: '100%'
      }}
    >
      {allParticipants.map(participantId => (
        <VideoTile 
          key={participantId} 
          participantId={participantId}
          isLocal={participantId === localParticipant?.session_id}
        />
      ))}
    </div>
  );
}

function VideoTile({ participantId, isLocal }) {
  const participant = useParticipant(participantId);
  
  return (
    <div className={`video-tile ${isLocal ? 'local' : 'remote'}`}>
      <ParticipantVideo participantId={participantId} />
      <div className="participant-overlay">
        <div className="participant-name">
          {participant?.user_name} {isLocal && '(You)'}
        </div>
        <div className="participant-status">
          {!participant?.audio && '🔇'}
          {!participant?.video && '📷'}
        </div>
      </div>
    </div>
  );
}
```

## State Management

### Custom Hook for Call State

```jsx
import { useState, useCallback, useEffect } from 'react';
import {
  useDaily,
  useMeetingState,
  useLocalParticipant,
  useParticipantIds,
  useDailyEvent
} from '@daily-co/daily-react';

export function useCallState() {
  const [callState, setCallState] = useState({
    isInCall: false,
    isConnecting: false,
    error: null,
    duration: 0,
    startTime: null
  });
  
  const daily = useDaily();
  const meetingState = useMeetingState();
  const localParticipant = useLocalParticipant();
  const participantIds = useParticipantIds();
  
  // Update call state based on meeting state
  useEffect(() => {
    setCallState(prev => ({
      ...prev,
      isInCall: meetingState === 'joined-meeting',
      isConnecting: meetingState === 'loading',
      error: meetingState === 'error' ? 'Connection failed' : null
    }));
  }, [meetingState]);
  
  // Track call duration
  useEffect(() => {
    let interval;
    if (callState.isInCall && callState.startTime) {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.isInCall, callState.startTime]);
  
  const handleJoinedMeeting = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      startTime: Date.now(),
      duration: 0
    }));
  }, []);
  
  const handleLeftMeeting = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      startTime: null,
      duration: 0
    }));
  }, []);
  
  useDailyEvent('joined-meeting', handleJoinedMeeting);
  useDailyEvent('left-meeting', handleLeftMeeting);
  
  const joinCall = useCallback(async (options = {}) => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true, error: null }));
      await daily.join(options);
    } catch (error) {
      setCallState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message
      }));
    }
  }, [daily]);
  
  const leaveCall = useCallback(async () => {
    try {
      await daily.leave();
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }, [daily]);
  
  const toggleVideo = useCallback(async () => {
    if (localParticipant) {
      await daily.setLocalVideo(!localParticipant.video);
    }
  }, [daily, localParticipant]);
  
  const toggleAudio = useCallback(async () => {
    if (localParticipant) {
      await daily.setLocalAudio(!localParticipant.audio);
    }
  }, [daily, localParticipant]);
  
  return {
    // State
    ...callState,
    meetingState,
    localParticipant,
    participantCount: participantIds.length + (localParticipant ? 1 : 0),
    
    // Actions
    joinCall,
    leaveCall,
    toggleVideo,
    toggleAudio,
    
    // Utilities
    formatDuration: (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };
}
```

### React Context for Global Call State

```jsx
import React, { createContext, useContext } from 'react';
import { useCallState } from './useCallState';

const CallStateContext = createContext();

export function CallStateProvider({ children }) {
  const callState = useCallState();
  
  return (
    <CallStateContext.Provider value={callState}>
      {children}
    </CallStateContext.Provider>
  );
}

export function useCallStateContext() {
  const context = useContext(CallStateContext);
  if (!context) {
    throw new Error('useCallStateContext must be used within CallStateProvider');
  }
  return context;
}

// Usage
function App() {
  return (
    <DailyProvider url={roomUrl}>
      <CallStateProvider>
        <VideoCallInterface />
      </CallStateProvider>
    </DailyProvider>
  );
}
```

## Performance Optimization

### Memoized Components

```jsx
import React, { memo } from 'react';
import { useParticipant, useMediaTrack } from '@daily-co/daily-react';

const ParticipantVideo = memo(({ participantId }) => {
  const participant = useParticipant(participantId);
  const videoTrack = useMediaTrack(participantId, 'video');
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && videoTrack.track) {
      videoRef.current.srcObject = new MediaStream([videoTrack.track]);
    }
  }, [videoTrack]);
  
  return (
    <div className="participant-video">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: videoTrack.isOff ? 'none' : 'block' }}
      />
      {videoTrack.isOff && (
        <div className="video-placeholder">
          {participant?.user_name?.charAt(0) || '?'}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.participantId === nextProps.participantId;
});
```

### Virtualized Participant List

```jsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { useParticipantIds } from '@daily-co/daily-react';

function VirtualizedParticipantList({ height = 400 }) {
  const participantIds = useParticipantIds();
  
  const ParticipantRow = React.memo(({ index, style }) => {
    const participantId = participantIds[index];
    
    return (
      <div style={style}>
        <ParticipantListItem participantId={participantId} />
      </div>
    );
  });
  
  return (
    <List
      height={height}
      itemCount={participantIds.length}
      itemSize={60}
      className="participant-list"
    >
      {ParticipantRow}
    </List>
  );
}
```

### Throttled Event Handlers

```jsx
import { useThrottledDailyEvent } from '@daily-co/daily-react';
import { useCallback, useState } from 'react';

function NetworkMonitor() {
  const [networkStats, setNetworkStats] = useState({});
  
  const handleNetworkQualityChange = useCallback((event) => {
    setNetworkStats(event);
  }, []);
  
  // Throttle network quality updates to avoid excessive re-renders
  useThrottledDailyEvent(
    'network-quality-change', 
    handleNetworkQualityChange,
    1000 // Update at most once per second
  );
  
  return (
    <div className="network-monitor">
      Quality: {networkStats.quality}
    </div>
  );
}
```

## TypeScript Integration

### Type Definitions

```typescript
import { DailyCall, DailyParticipant, DailyEvent } from '@daily-co/daily-js';

// Custom interfaces for your application
interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  error: string | null;
  duration: number;
  startTime: number | null;
}

interface ParticipantWithStatus extends DailyParticipant {
  isLocal: boolean;
  isSpeaking: boolean;
  networkQuality: 'good' | 'low' | 'very-low';
}

interface VideoCallProps {
  roomUrl: string;
  userName?: string;
  onJoinError?: (error: Error) => void;
  onLeave?: () => void;
}

interface DeviceConfig {
  camera?: string;
  microphone?: string;
  speaker?: string;
}
```

### Typed Hook Usage

```typescript
import React, { useCallback } from 'react';
import {
  useDaily,
  useLocalParticipant,
  useParticipantIds,
  useDailyEvent
} from '@daily-co/daily-react';
import { DailyEventObjectParticipantJoined } from '@daily-co/daily-js';

const TypedVideoCall: React.FC<VideoCallProps> = ({
  roomUrl,
  userName,
  onJoinError,
  onLeave
}) => {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const participantIds = useParticipantIds({ filter: 'remote' });
  
  const handleParticipantJoined = useCallback(
    (event: DailyEventObjectParticipantJoined) => {
      console.log(`${event.participant.user_name} joined the call`);
    },
    []
  );
  
  const handleJoinCall = useCallback(async () => {
    try {
      if (userName) {
        await daily?.setUserName(userName);
      }
      await daily?.join();
    } catch (error) {
      if (onJoinError && error instanceof Error) {
        onJoinError(error);
      }
    }
  }, [daily, userName, onJoinError]);
  
  const handleLeaveCall = useCallback(async () => {
    await daily?.leave();
    onLeave?.();
  }, [daily, onLeave]);
  
  useDailyEvent('participant-joined', handleParticipantJoined);
  
  return (
    <div className="video-call">
      {/* Component implementation */}
    </div>
  );
};
```

### Custom Hook with TypeScript

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useDaily, useMeetingState, useLocalParticipant } from '@daily-co/daily-react';

interface UseCallControlsReturn {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isMuted: boolean;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  error: string | null;
}

export const useCallControls = (): UseCallControlsReturn => {
  const [error, setError] = useState<string | null>(null);
  const daily = useDaily();
  const meetingState = useMeetingState();
  const localParticipant = useLocalParticipant();
  
  const isVideoOn = localParticipant?.video ?? false;
  const isAudioOn = localParticipant?.audio ?? false;
  const isMuted = !isAudioOn;
  
  const toggleVideo = useCallback(async () => {
    try {
      setError(null);
      await daily?.setLocalVideo(!isVideoOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle video');
    }
  }, [daily, isVideoOn]);
  
  const toggleAudio = useCallback(async () => {
    try {
      setError(null);
      await daily?.setLocalAudio(!isAudioOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle audio');
    }
  }, [daily, isAudioOn]);
  
  const setMuted = useCallback(async (muted: boolean) => {
    try {
      setError(null);
      await daily?.setLocalAudio(!muted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set mute state');
    }
  }, [daily]);
  
  return {
    isVideoOn,
    isAudioOn,
    isMuted,
    toggleVideo,
    toggleAudio,
    setMuted,
    error
  };
};
```

## Testing Patterns

### Mock Setup

```javascript
// __mocks__/@daily-co/daily-react.js
export const mockDailyCallObject = {
  join: jest.fn(),
  leave: jest.fn(),
  setLocalVideo: jest.fn(),
  setLocalAudio: jest.fn(),
  setUserName: jest.fn(),
  startScreenShare: jest.fn(),
  stopScreenShare: jest.fn(),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  startTranscription: jest.fn(),
  stopTranscription: jest.fn(),
};

export const useDaily = jest.fn(() => mockDailyCallObject);
export const useMeetingState = jest.fn(() => 'new');
export const useLocalParticipant = jest.fn(() => null);
export const useParticipantIds = jest.fn(() => []);
export const useParticipants = jest.fn(() => ({}));
export const useScreenShare = jest.fn(() => ({
  isSharingScreen: false,
  startScreenShare: jest.fn(),
  stopScreenShare: jest.fn()
}));
export const useTranscription = jest.fn(() => ({
  isTranscribing: false,
  startTranscription: jest.fn(),
  stopTranscription: jest.fn()
}));
export const useDailyEvent = jest.fn();

export const DailyProvider = ({ children }) => children;
```

### Component Tests

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoCallInterface } from '../VideoCallInterface';
import { mockDailyCallObject } from '../__mocks__/@daily-co/daily-react';

jest.mock('@daily-co/daily-react');

describe('VideoCallInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders join interface when not in call', () => {
    render(<VideoCallInterface />);
    
    expect(screen.getByText('Join Video Call')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });
  
  test('joins call when join button is clicked', async () => {
    render(<VideoCallInterface />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const joinButton = screen.getByText('Join Call');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.click(joinButton);
    
    await waitFor(() => {
      expect(mockDailyCallObject.setUserName).toHaveBeenCalledWith('Test User');
      expect(mockDailyCallObject.join).toHaveBeenCalled();
    });
  });
  
  test('toggles video when video button is clicked', async () => {
    // Mock being in a call
    require('@daily-co/daily-react').useMeetingState.mockReturnValue('joined-meeting');
    require('@daily-co/daily-react').useLocalParticipant.mockReturnValue({
      session_id: 'local',
      user_name: 'Test User',
      video: true,
      audio: true
    });
    
    render(<VideoCallInterface />);
    
    const videoButton = screen.getByText('📹');
    fireEvent.click(videoButton);
    
    await waitFor(() => {
      expect(mockDailyCallObject.setLocalVideo).toHaveBeenCalledWith(false);
    });
  });
});
```

### Integration Tests

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DailyProvider } from '@daily-co/daily-react';
import { VideoCallInterface } from '../VideoCallInterface';

// Integration test with real DailyProvider
describe('VideoCallInterface Integration', () => {
  test('integrates with DailyProvider', () => {
    render(
      <DailyProvider url="https://test.daily.co/room">
        <VideoCallInterface />
      </DailyProvider>
    );
    
    expect(screen.getByText('Join Video Call')).toBeInTheDocument();
  });
});
```

### Custom Hook Tests

```javascript
import { renderHook, act } from '@testing-library/react';
import { useCallState } from '../useCallState';

jest.mock('@daily-co/daily-react');

describe('useCallState', () => {
  test('returns initial state', () => {
    const { result } = renderHook(() => useCallState());
    
    expect(result.current.isInCall).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.duration).toBe(0);
  });
  
  test('updates state when joining call', async () => {
    const { result } = renderHook(() => useCallState());
    
    await act(async () => {
      await result.current.joinCall();
    });
    
    expect(result.current.isConnecting).toBe(true);
  });
});
```

## Integration Guidelines

### Integrating with Existing React Applications

#### 1. Router Integration

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DailyProvider } from '@daily-co/daily-react';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/call/:roomId" 
          element={
            <CallRoute />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

function CallRoute() {
  const { roomId } = useParams();
  const roomUrl = `https://your-domain.daily.co/${roomId}`;
  
  return (
    <DailyProvider url={roomUrl}>
      <VideoCallInterface />
    </DailyProvider>
  );
}
```

#### 2. State Management Integration (Redux)

```jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDailyEvent, useParticipantIds } from '@daily-co/daily-react';

function CallIntegration() {
  const dispatch = useDispatch();
  const callState = useSelector(state => state.call);
  const participantIds = useParticipantIds();
  
  // Sync Daily state with Redux
  useEffect(() => {
    dispatch(updateParticipantCount(participantIds.length));
  }, [participantIds.length, dispatch]);
  
  useDailyEvent('participant-joined', useCallback((event) => {
    dispatch(participantJoined({
      id: event.participant.session_id,
      name: event.participant.user_name
    }));
  }, [dispatch]));
  
  useDailyEvent('participant-left', useCallback((event) => {
    dispatch(participantLeft(event.participant.session_id));
  }, [dispatch]));
  
  return <VideoCallInterface />;
}
```

#### 3. Authentication Integration

```jsx
import React, { useEffect, useState } from 'react';
import { DailyProvider } from '@daily-co/daily-react';
import { useAuth } from '../contexts/AuthContext';

function AuthenticatedCall({ roomId }) {
  const { user, token } = useAuth();
  const [meetingToken, setMeetingToken] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  
  useEffect(() => {
    const setupCall = async () => {
      try {
        // Get meeting token from your API
        const response = await fetch(`/api/meetings/${roomId}/token`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        setMeetingToken(data.token);
        setRoomUrl(data.room_url);
      } catch (error) {
        console.error('Failed to setup call:', error);
      }
    };
    
    if (user && token) {
      setupCall();
    }
  }, [user, token, roomId]);
  
  if (!meetingToken || !roomUrl) {
    return <div>Setting up call...</div>;
  }
  
  return (
    <DailyProvider 
      url={roomUrl}
      token={meetingToken}
      properties={{
        userName: user.name,
        userData: { 
          userId: user.id,
          role: user.role 
        }
      }}
    >
      <VideoCallInterface />
    </DailyProvider>
  );
}
```

## Error Handling

### Error Boundary for Daily Components

```jsx
import React from 'react';

class DailyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Daily error:', error, errorInfo);
    
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Video call error</h2>
          <p>Something went wrong with the video call.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <DailyErrorBoundary>
      <DailyProvider url={roomUrl}>
        <VideoCallInterface />
      </DailyProvider>
    </DailyErrorBoundary>
  );
}
```

### Error Handling Hook

```jsx
import { useState, useCallback } from 'react';
import { useDailyEvent } from '@daily-co/daily-react';

export function useErrorHandler() {
  const [errors, setErrors] = useState([]);
  
  const handleDailyError = useCallback((event) => {
    const error = {
      id: Date.now(),
      type: event.type,
      message: event.errorMsg || 'Unknown error',
      timestamp: new Date(),
      details: event
    };
    
    setErrors(prev => [...prev, error]);
    
    // Auto-remove errors after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== error.id));
    }, 5000);
  }, []);
  
  useDailyEvent('error', handleDailyError);
  useDailyEvent('camera-error', handleDailyError);
  useDailyEvent('mic-error', handleDailyError);
  
  const clearError = useCallback((errorId) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  return {
    errors,
    hasErrors: errors.length > 0,
    clearError,
    clearAllErrors
  };
}

// Usage
function ErrorDisplay() {
  const { errors, clearError } = useErrorHandler();
  
  if (errors.length === 0) return null;
  
  return (
    <div className="error-notifications">
      {errors.map(error => (
        <div key={error.id} className="error-notification">
          <div className="error-content">
            <strong>{error.type}</strong>
            <p>{error.message}</p>
          </div>
          <button onClick={() => clearError(error.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
```

## Advanced Patterns

### Waiting Room Implementation

```jsx
import React, { useState, useEffect } from 'react';
import { useDaily, useMeetingState, useDailyEvent } from '@daily-co/daily-react';

function WaitingRoom({ onAdmitted, onDenied }) {
  const [waitingState, setWaitingState] = useState('joining'); // joining, waiting, admitted, denied
  const daily = useDaily();
  const meetingState = useMeetingState();
  
  useEffect(() => {
    if (meetingState === 'joined-meeting') {
      setWaitingState('admitted');
      onAdmitted?.();
    }
  }, [meetingState, onAdmitted]);
  
  useDailyEvent('access-state-updated', useCallback((event) => {
    if (event.access.level === 'lobby') {
      setWaitingState('waiting');
    } else if (event.access.level === 'full') {
      setWaitingState('admitted');
    }
  }, []));
  
  useDailyEvent('error', useCallback((event) => {
    if (event.errorMsg?.includes('denied')) {
      setWaitingState('denied');
      onDenied?.(event.errorMsg);
    }
  }, [onDenied]));
  
  const requestAccess = async () => {
    try {
      await daily?.requestAccess({
        name: 'Guest User',
        access: { level: 'lobby' }
      });
      setWaitingState('waiting');
    } catch (error) {
      console.error('Failed to request access:', error);
    }
  };
  
  switch (waitingState) {
    case 'joining':
      return (
        <div className="waiting-room">
          <h2>Join Meeting</h2>
          <button onClick={requestAccess}>Request to Join</button>
        </div>
      );
      
    case 'waiting':
      return (
        <div className="waiting-room">
          <h2>Waiting for Host</h2>
          <p>Please wait while the host admits you to the meeting.</p>
          <div className="loading-spinner" />
        </div>
      );
      
    case 'denied':
      return (
        <div className="waiting-room">
          <h2>Access Denied</h2>
          <p>The host has denied your request to join.</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      );
      
    default:
      return null;
  }
}
```

### Breakout Rooms

```jsx
import React, { useState, useCallback } from 'react';
import { useDaily, useParticipantIds, useDailyEvent } from '@daily-co/daily-react';

function BreakoutRoomManager() {
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const daily = useDaily();
  const participantIds = useParticipantIds();
  
  const createBreakoutRoom = useCallback(async (roomName, participantIds) => {
    setIsCreating(true);
    try {
      // Create breakout room through Daily API
      const response = await fetch('/api/breakout-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          participants: participantIds
        })
      });
      
      const room = await response.json();
      setBreakoutRooms(prev => [...prev, room]);
      
      // Send participants to breakout room
      await daily?.sendAppMessage({
        type: 'breakout-room-assignment',
        roomUrl: room.url,
        participantIds
      });
      
    } catch (error) {
      console.error('Failed to create breakout room:', error);
    } finally {
      setIsCreating(false);
    }
  }, [daily]);
  
  const endBreakoutRooms = useCallback(async () => {
    try {
      // Recall all participants to main room
      await daily?.sendAppMessage({
        type: 'return-to-main-room'
      });
      
      setBreakoutRooms([]);
    } catch (error) {
      console.error('Failed to end breakout rooms:', error);
    }
  }, [daily]);
  
  useDailyEvent('app-message', useCallback((event) => {
    if (event.data.type === 'breakout-room-assignment') {
      // Handle participant assignment to breakout room
      window.location.href = event.data.roomUrl;
    } else if (event.data.type === 'return-to-main-room') {
      // Return to main room
      window.location.href = '/main-room';
    }
  }, []));
  
  return (
    <div className="breakout-room-manager">
      <h3>Breakout Rooms</h3>
      
      <div className="room-controls">
        <button
          onClick={() => createBreakoutRoom('Room 1', participantIds.slice(0, 2))}
          disabled={isCreating}
        >
          Create Breakout Room
        </button>
        
        {breakoutRooms.length > 0 && (
          <button onClick={endBreakoutRooms}>
            End All Breakout Rooms
          </button>
        )}
      </div>
      
      <div className="rooms-list">
        {breakoutRooms.map(room => (
          <div key={room.id} className="room-item">
            <h4>{room.name}</h4>
            <p>{room.participants.length} participants</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Custom Video Effects

```jsx
import React, { useEffect, useRef } from 'react';
import { useDaily, useLocalParticipant } from '@daily-co/daily-react';

function VideoEffectsController() {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const canvasRef = useRef(null);
  
  const applyBackgroundBlur = useCallback(async () => {
    try {
      await daily?.updateInputSettings({
        video: {
          processor: {
            type: 'background-blur',
            config: { strength: 0.5 }
          }
        }
      });
    } catch (error) {
      console.error('Failed to apply background blur:', error);
    }
  }, [daily]);
  
  const applyVirtualBackground = useCallback(async (imageUrl) => {
    try {
      await daily?.updateInputSettings({
        video: {
          processor: {
            type: 'background-replacement',
            config: { source: imageUrl }
          }
        }
      });
    } catch (error) {
      console.error('Failed to apply virtual background:', error);
    }
  }, [daily]);
  
  const removeEffects = useCallback(async () => {
    try {
      await daily?.updateInputSettings({
        video: { processor: null }
      });
    } catch (error) {
      console.error('Failed to remove effects:', error);
    }
  }, [daily]);
  
  return (
    <div className="video-effects">
      <h4>Video Effects</h4>
      <div className="effects-controls">
        <button onClick={applyBackgroundBlur}>
          Background Blur
        </button>
        <button onClick={() => applyVirtualBackground('/backgrounds/office.jpg')}>
          Office Background
        </button>
        <button onClick={() => applyVirtualBackground('/backgrounds/beach.jpg')}>
          Beach Background
        </button>
        <button onClick={removeEffects}>
          Remove Effects
        </button>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Component Organization

```
src/
├── components/
│   ├── call/
│   │   ├── VideoCallInterface.jsx
│   │   ├── ParticipantGrid.jsx
│   │   ├── CallControls.jsx
│   │   └── index.js
│   ├── participants/
│   │   ├── ParticipantVideo.jsx
│   │   ├── ParticipantList.jsx
│   │   └── index.js
│   └── shared/
│       ├── ErrorBoundary.jsx
│       └── LoadingSpinner.jsx
├── hooks/
│   ├── useCallState.js
│   ├── useErrorHandler.js
│   └── useDeviceManager.js
├── contexts/
│   └── CallStateContext.jsx
└── utils/
    ├── dailyHelpers.js
    └── mediaUtils.js
```

### 2. Performance Guidelines

- Use `React.memo()` for participant components
- Implement virtualization for large participant lists
- Debounce frequent operations (search, filters)
- Minimize re-renders with proper dependency arrays
- Use `useCallback` and `useMemo` appropriately

### 3. Accessibility Best Practices

```jsx
function AccessibleVideoCall() {
  return (
    <div className="video-call" role="application" aria-label="Video conference">
      <div className="video-grid" role="group" aria-label="Participant videos">
        {/* Video tiles */}
      </div>
      
      <div className="call-controls" role="toolbar" aria-label="Call controls">
        <button
          onClick={toggleVideo}
          aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          aria-pressed={isVideoOn}
        >
          {isVideoOn ? '📹' : '📷'}
        </button>
        
        <button
          onClick={toggleAudio}
          aria-label={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
          aria-pressed={!isAudioOn}
        >
          {isAudioOn ? '🔊' : '🔇'}
        </button>
      </div>
      
      <div 
        className="participant-count" 
        aria-live="polite" 
        aria-label={`${participantCount} participants in call`}
      >
        {participantCount} participants
      </div>
    </div>
  );
}
```

### 4. Security Considerations

- Validate meeting tokens on the server side
- Implement proper access controls for meeting rooms
- Use HTTPS for all Daily.co communications
- Sanitize user input (participant names, chat messages)
- Implement rate limiting for API calls

### 5. Error Recovery Patterns

```jsx
function RobustVideoCall() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleConnectionError = useCallback(async () => {
    if (retryCount < 3 && !isRetrying) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
      
      try {
        await daily?.join();
        setRetryCount(0);
      } catch (error) {
        console.error('Retry failed:', error);
      } finally {
        setIsRetrying(false);
      }
    }
  }, [daily, retryCount, isRetrying]);
  
  useDailyEvent('error', handleConnectionError);
  
  // Component implementation
}
```

This comprehensive documentation provides everything needed to integrate Daily.co React hooks into the RicheAI meeting system, with focus on practical implementation patterns, performance optimization, and production-ready features.