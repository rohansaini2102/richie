import React, { useEffect, useState, useCallback } from 'react';
import { DailyProvider, useDaily, useDailyEvent } from '@daily-co/daily-react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Settings, 
  MessageSquare,
  FileText,
  Download,
  User,
  Clock
} from 'lucide-react';
import { meetingAPI } from '../../services/api';

// Main Meeting Room Component
const MeetingRoom = ({ meetingUrl, meetingId, onLeave }) => {
  return (
    <DailyProvider url={meetingUrl}>
      <MeetingRoomContent meetingId={meetingId} onLeave={onLeave} />
    </DailyProvider>
  );
};

// Meeting Room Content with Daily.co hooks
const MeetingRoomContent = ({ meetingId, onLeave }) => {
  const daily = useDaily();
  const [participants, setParticipants] = useState({});
  const [callState, setCallState] = useState('idle');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);

  // Manual transcription event handlers
  const handleTranscriptionMessage = useCallback((event) => {
    console.log('📝 Transcription message:', event);
    
    // Save message to backend
    meetingAPI.saveTranscriptMessage({
      meetingId: meetingId,
      participantId: event.participantId,
      participantName: participants[event.participantId]?.user_name || 'Unknown',
      text: event.text,
      timestamp: event.timestamp,
      isFinal: event.is_final,
      confidence: event.confidence,
      instanceId: event.instanceId
    }).catch(error => {
      console.error('Failed to save transcript message:', error);
    });

    // Add to local state for real-time display
    setTranscriptMessages(prev => [...prev, {
      id: `${event.participantId}_${Date.now()}`,
      participantId: event.participantId,
      participantName: participants[event.participantId]?.user_name || 'Unknown',
      text: event.text,
      timestamp: event.timestamp,
      isFinal: event.is_final
    }]);
  }, [meetingId, participants]);

  const handleTranscriptionStarted = useCallback((event) => {
    console.log('🎙️ Transcription started:', event);
    setIsTranscribing(true);
    
    // Notify backend that transcription started
    meetingAPI.startTranscription(meetingId, {
      instanceId: event.instanceId,
      startedBy: event.startedBy,
      language: event.language,
      model: event.model
    }).catch(error => {
      console.error('Failed to update transcription start:', error);
    });
  }, [meetingId]);

  const handleTranscriptionStopped = useCallback((event) => {
    console.log('🛑 Transcription stopped:', event);
    setIsTranscribing(false);
    
    // Notify backend that transcription stopped
    meetingAPI.stopTranscription(meetingId, event.updatedBy).catch(error => {
      console.error('Failed to update transcription stop:', error);
    });
  }, [meetingId]);

  const handleTranscriptionError = useCallback((event) => {
    console.error('❌ Transcription error:', event);
    setTranscriptionError('Transcription error occurred. Please try again.');
    setIsTranscribing(false);
  }, []);

  // Manual transcription controls
  const startTranscription = useCallback(async (options) => {
    if (daily) {
      try {
        await daily.startTranscription(options);
      } catch (error) {
        console.error('Failed to start transcription:', error);
        throw error;
      }
    }
  }, [daily]);

  const stopTranscription = useCallback(async () => {
    if (daily) {
      try {
        await daily.stopTranscription();
      } catch (error) {
        console.error('Failed to stop transcription:', error);
        throw error;
      }
    }
  }, [daily]);

  // Participant tracking
  useDailyEvent('participant-joined', useCallback((event) => {
    setParticipants(prev => ({
      ...prev,
      [event.participant.session_id]: event.participant
    }));
  }, []));

  useDailyEvent('participant-updated', useCallback((event) => {
    setParticipants(prev => ({
      ...prev,
      [event.participant.session_id]: event.participant
    }));
  }, []));

  useDailyEvent('participant-left', useCallback((event) => {
    setParticipants(prev => {
      const updated = { ...prev };
      delete updated[event.participant.session_id];
      return updated;
    });
  }, []));

  // Transcription event listeners
  useDailyEvent('transcription-message', handleTranscriptionMessage);
  useDailyEvent('transcription-started', handleTranscriptionStarted);
  useDailyEvent('transcription-stopped', handleTranscriptionStopped);
  useDailyEvent('transcription-error', handleTranscriptionError);

  // Initialize participants on join
  useEffect(() => {
    if (daily) {
      // Get initial participants
      const currentParticipants = daily.participants();
      setParticipants(currentParticipants);
    }
  }, [daily]);

  // Handle call state changes with Daily events
  useDailyEvent('joining-meeting', useCallback(() => {
    setCallState('joining');
  }, []));

  useDailyEvent('joined-meeting', useCallback(() => {
    setCallState('joined');
  }, []));

  useDailyEvent('left-meeting', useCallback(() => {
    setCallState('left');
  }, []));

  useDailyEvent('error', useCallback((event) => {
    console.error('Daily.co error:', event);
    setError('Meeting connection error occurred');
  }, []));

  // Handle call state changes
  useEffect(() => {
    if (callState === 'left') {
      onLeave?.();
    }
  }, [callState, onLeave]);

  // Handle media controls
  const toggleAudio = useCallback(() => {
    if (daily) {
      const newMutedState = !isAudioMuted;
      daily.setLocalAudio(!newMutedState);
      setIsAudioMuted(newMutedState);
    }
  }, [daily, isAudioMuted]);

  const toggleVideo = useCallback(() => {
    if (daily) {
      const newMutedState = !isVideoMuted;
      daily.setLocalVideo(!newMutedState);
      setIsVideoMuted(newMutedState);
    }
  }, [daily, isVideoMuted]);

  const leaveCall = useCallback(() => {
    if (daily) {
      daily.leave();
    }
  }, [daily]);

  const handleStartTranscription = useCallback(async () => {
    try {
      await startTranscription({
        language: 'en',
        model: 'nova-2-general',
        includeRawResponse: true,
        punctuate: true
      });
      setShowTranscript(true);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      setError('Failed to start transcription. Make sure you have transcription permissions.');
    }
  }, [startTranscription]);

  const handleStopTranscription = useCallback(async () => {
    try {
      await stopTranscription();
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      setError('Failed to stop transcription.');
    }
  }, [stopTranscription]);

  const downloadTranscript = useCallback(() => {
    if (transcriptMessages.length === 0) return;

    const transcript = transcriptMessages
      .filter(msg => msg.isFinal)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(msg => `${msg.participantName}: ${msg.text}`)
      .join('\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${meetingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcriptMessages, meetingId]);

  // Render participant videos
  const renderParticipants = () => {
    const participantsList = Object.values(participants);
    
    if (participantsList.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-white">
            <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Waiting for participants...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
        {participantsList.map((participant) => (
          <div key={participant.session_id} className="relative bg-gray-900 rounded-lg overflow-hidden">
            {participant.video && participant.videoTrack ? (
              <video
                ref={(el) => {
                  if (el && participant.videoTrack) {
                    try {
                      el.srcObject = new MediaStream([participant.videoTrack]);
                    } catch (error) {
                      console.error('Error setting video source:', error);
                    }
                  }
                }}
                autoPlay
                playsInline
                muted={participant.local}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <User className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">{participant.user_name || participant.user_id || 'Unknown'}</p>
                </div>
              </div>
            )}
            
            {/* Participant info overlay */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
              {participant.user_name || participant.user_id || 'Unknown'}
              {participant.audio === false && <MicOff className="h-3 w-3 inline ml-1" />}
              {participant.local && <span className="ml-1 text-xs">(You)</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render transcript panel
  const renderTranscriptPanel = () => {
    if (!showTranscript) return null;

    const recentMessages = transcriptMessages
      .slice(-10) // Show last 10 messages
      .filter(msg => msg.text.trim().length > 0);

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Live Transcript
            </h3>
            <button
              onClick={downloadTranscript}
              disabled={transcriptMessages.length === 0}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Download transcript"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          {isTranscribing && (
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              Recording
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {recentMessages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">
              {isTranscribing ? 'Start speaking to see transcription...' : 'No transcript available'}
            </p>
          ) : (
            recentMessages.map((message) => (
              <div key={message.id} className="text-sm">
                <div className="font-medium text-gray-700 text-xs mb-1">
                  {message.participantName}
                  <span className="text-gray-500 ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={`text-gray-900 ${!message.isFinal ? 'italic opacity-75' : ''}`}>
                  {message.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (callState === 'joining' || callState === 'idle') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (callState === 'left') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You have left the meeting</p>
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Error Display */}
      {(error || transcriptionError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700 text-sm">{error || transcriptionError}</p>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          {renderParticipants()}
        </div>
        {renderTranscriptPanel()}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
        {/* Audio Control */}
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Video Control */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Transcription Control */}
        {isTranscribing ? (
          <button
            onClick={handleStopTranscription}
            className="p-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            title="Stop transcription"
          >
            <FileText className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleStartTranscription}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="Start transcription"
          >
            <FileText className="h-5 w-5" />
          </button>
        )}

        {/* Transcript Toggle */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className={`p-3 rounded-full ${
            showTranscript ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
          title="Toggle transcript panel"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Leave Call */}
        <button
          onClick={leaveCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="Leave meeting"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MeetingRoom;