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
  Clock,
  CirclePlay,
  CircleStop,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { meetingAPI } from '../../services/api';

// Main Meeting Room Component
const MeetingRoom = ({ meetingUrl, meetingId, onLeave }) => {
  console.log('🏠 MeetingRoom Component Mounted:', {
    meetingUrl,
    meetingId,
    hasOnLeave: !!onLeave
  });
  
  return (
    <DailyProvider url={meetingUrl}>
      <MeetingRoomContent meetingId={meetingId} onLeave={onLeave} />
    </DailyProvider>
  );
};

// Meeting Room Content with Daily.co hooks
const MeetingRoomContent = ({ meetingId, onLeave }) => {
  const daily = useDaily();
  
  console.log('📹 MeetingRoomContent Mounted:', {
    meetingId,
    hasDaily: !!daily,
    dailyState: daily?.meetingState
  });
  const [participants, setParticipants] = useState({});
  const [callState, setCallState] = useState('idle');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [domainFeatures, setDomainFeatures] = useState(null);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  // Manual transcription event handlers
  const handleTranscriptionMessage = useCallback((event) => {
    console.log('📝 TRANSCRIPTION MESSAGE RECEIVED:', {
      text: event.text,
      participantId: event.participantId,
      isFinal: event.is_final,
      confidence: event.confidence,
      timestamp: event.timestamp,
      instanceId: event.instanceId,
      meetingId: meetingId,
      fullEvent: event
    });
    
    const messageData = {
      meetingId: meetingId,
      participantId: event.participantId,
      participantName: participants[event.participantId]?.user_name || 'Unknown',
      text: event.text,
      timestamp: event.timestamp,
      isFinal: event.is_final,
      confidence: event.confidence,
      instanceId: event.instanceId
    };
    
    console.log('📤 Saving to backend:', messageData);
    
    // Save message to backend
    meetingAPI.saveTranscriptMessage(messageData)
      .then(response => {
        console.log('✅ Transcript message saved successfully:', response);
      })
      .catch(error => {
        console.error('❌ Failed to save transcript message:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
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
    console.log('🎙️ TRANSCRIPTION STARTED SUCCESSFULLY!', {
      instanceId: event.instanceId,
      startedBy: event.startedBy,
      language: event.language,
      model: event.model,
      meetingId: meetingId,
      timestamp: new Date().toISOString()
    });
    
    setIsTranscribing(true);
    
    // Notify backend that transcription started
    meetingAPI.startTranscription(meetingId, {
      instanceId: event.instanceId,
      startedBy: event.startedBy,
      language: event.language,
      model: event.model
    })
      .then(response => {
        console.log('✅ Backend notified of transcription start:', response);
      })
      .catch(error => {
        console.error('❌ Failed to notify backend of transcription start:', error);
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
    if (!daily) {
      console.error('❌ Daily object not available for transcription');
      throw new Error('Meeting not initialized');
    }
    
    try {
      console.log('📞 Calling daily.startTranscription with:', options);
      const result = await daily.startTranscription(options);
      console.log('✅ Transcription API response:', result);
      return result;
    } catch (error) {
      console.error('❌ Daily transcription API error:', {
        error,
        errorMessage: error.message,
        errorType: error.type,
        errorDetails: error.details
      });
      
      // Provide specific error messages
      if (error.message?.includes('not supported')) {
        throw new Error('Transcription is not supported in this browser. Please use Chrome or Edge.');
      } else if (error.message?.includes('permission')) {
        throw new Error('Transcription requires a paid Daily.co plan.');
      } else if (error.message?.includes('already')) {
        throw new Error('Transcription is already running.');
      }
      
      throw error;
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

  // Debug transcription capabilities
  const debugTranscriptionCapabilities = useCallback(async () => {
    if (!daily) return;
    
    try {
      console.log('🔍 TRANSCRIPTION CAPABILITIES DEBUG:', {
        dailyVersion: daily.version?.(),
        browserSupport: daily.supportedBrowser?.(),
        meetingState: daily.meetingState?.(),
        room: daily.room?.(),
        participants: daily.participants?.(),
        transcriptionState: daily.transcription?.()
      });
    } catch (error) {
      console.error('❌ Error checking transcription capabilities:', error);
    }
  }, [daily]);

  // Initialize participants on join
  useEffect(() => {
    if (daily) {
      // Get initial participants
      const currentParticipants = daily.participants();
      setParticipants(currentParticipants);
      
      // Debug logging for transcription
      console.log('🔍 Daily object initialized:', {
        hasDaily: !!daily,
        transcriptionSupported: daily.supportedBrowser?.supportsFullDailyFeatures,
        meetingId,
        participants: Object.keys(currentParticipants).length
      });
      
      // Debug transcription capabilities
      debugTranscriptionCapabilities();
    }
  }, [daily, meetingId, debugTranscriptionCapabilities]);

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
    console.log('🎙️ Attempting to start transcription...');
    try {
      if (!daily) {
        console.error('❌ Daily object not initialized');
        setError('Meeting not fully loaded. Please wait and try again.');
        return;
      }
      
      // Check current meeting state and permissions
      const meetingState = daily.meetingState();
      const participants = daily.participants();
      const localParticipant = participants.local;
      
      console.log('🔍 Pre-transcription checks:', {
        meetingState,
        isOwner: localParticipant?.owner,
        participantId: localParticipant?.session_id,
        userName: localParticipant?.user_name,
        totalParticipants: Object.keys(participants).length,
        roomConfig: daily.room?.()
      });
      
      if (meetingState !== 'joined-meeting') {
        console.error('❌ Not in joined meeting state:', meetingState);
        setError('Must be in a meeting to start transcription');
        return;
      }
      
      if (!localParticipant?.owner) {
        console.error('❌ Not meeting owner, cannot start transcription');
        setError('Only meeting owners can start transcription');
        return;
      }
      
      console.log('📊 Starting transcription with options:', {
        language: 'en-US',
        tier: 'standard',
        includeRawResponse: true,
        redact: ['pii'],
        extra: {
          punctuate: true,
          diarize: true,
          utterances: true
        }
      });
      
      // Try with minimal configuration first
      const transcriptionOptions = {
        language: 'en-US'
      };
      
      console.log('🚀 Calling daily.startTranscription()...');
      await startTranscription(transcriptionOptions);
      
      console.log('✅ Transcription started successfully');
      setShowTranscript(true);
      setTranscriptionError(null);
    } catch (error) {
      console.error('❌ Failed to start transcription:', error);
      
      // Check for specific error types and provide helpful feedback
      let errorMessage = 'Failed to start transcription';
      
      if (error.message?.includes('not available') || error.message?.includes('not enabled')) {
        errorMessage = 'Transcription is not available for this account. Please upgrade your Daily.co plan to enable transcription.';
      } else if (error.message?.includes('forbidden') || error.message?.includes('403')) {
        errorMessage = 'Transcription is not enabled for this domain. Please contact support.';
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        errorMessage = 'Network error starting transcription. Please check your connection and try again.';
      } else if (error.message?.includes('unsupported')) {
        errorMessage = 'Transcription is not supported in this browser. Please use Chrome, Edge, or Safari.';
      } else if (error.message?.includes('already')) {
        errorMessage = 'Transcription is already running in this meeting.';
        setIsTranscribing(true); // Update state if transcription is already active
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to start transcription. Only meeting owners can control transcription.';
      } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
        errorMessage = 'Transcription quota exceeded. Please try again later or contact support.';
      } else if (error.message) {
        errorMessage = `Transcription error: ${error.message}`;
      }
      
      setTranscriptionError(errorMessage);
      setError(errorMessage);
      
      // Don't auto-retry if it's a configuration/permission issue
      if (error.message?.includes('not available') || error.message?.includes('forbidden')) {
        console.log('🚫 Auto-transcription disabled due to account limitations');
      }
    }
  }, [startTranscription, daily]);

  // Recording controls
  const handleStartRecording = useCallback(async () => {
    try {
      console.log('🎥 Starting meeting recording...');
      
      await meetingAPI.startRecording(meetingId, {
        layout: 'default',
        recordVideo: true,
        recordAudio: true,
        recordScreen: false
      });
      
      setIsRecording(true);
      setRecordingError(null);
      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      
      let errorMessage = 'Failed to start recording';
      if (error.response?.data?.error?.includes('not available')) {
        errorMessage = 'Recording is not available for this account. Please upgrade your Daily.co plan.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setRecordingError(errorMessage);
      setError(errorMessage);
    }
  }, [meetingId]);

  const handleStopRecording = useCallback(async () => {
    try {
      console.log('🛑 Stopping meeting recording...');
      
      await meetingAPI.stopRecording(meetingId);
      
      setIsRecording(false);
      setRecordingError(null);
      console.log('✅ Recording stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      setRecordingError('Failed to stop recording');
      setError('Failed to stop recording');
    }
  }, [meetingId]);

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

  // Check domain features on mount
  useEffect(() => {
    const checkFeatures = async () => {
      try {
        console.log('🔍 Checking domain features...');
        const features = await meetingAPI.checkDomainFeatures();
        setDomainFeatures(features);
        setFeaturesLoaded(true);
        
        console.log('✅ Domain features loaded:', {
          transcription: features.features?.transcription?.enabled,
          recording: features.features?.recording?.enabled,
          requiresUpgrade: features.plan?.requiresUpgrade
        });
      } catch (error) {
        console.error('❌ Failed to check domain features:', error);
        setFeaturesLoaded(true); // Still set as loaded to show UI
      }
    };
    
    checkFeatures();
  }, []);

  // Auto-start transcription after joining (only if enabled)
  useEffect(() => {
    if (callState === 'joined' && daily && !isTranscribing && featuresLoaded) {
      const transcriptionEnabled = domainFeatures?.features?.transcription?.enabled;
      const participants = daily.participants?.() || {};
      const localParticipant = participants.local;
      
      console.log('📅 Meeting joined, checking transcription status...', {
        dailyAvailable: !!daily,
        transcriptionSupported: daily.supportedBrowser?.supportsFullDailyFeatures,
        transcriptionEnabled,
        meetingId: meetingId,
        roomUrl: daily.room?.()?.url,
        isOwner: localParticipant?.owner,
        participantCount: Object.keys(participants).length,
        localParticipant
      });
      
      // Disable auto-start for now - let user manually start to debug
      console.log('🔧 Auto-start disabled for debugging - please click START TRANSCRIPT button manually');
      
      /*
      // Check if transcription is enabled AND user has permission to start it
      if (transcriptionEnabled && localParticipant?.owner) {
        const timer = setTimeout(() => {
          console.log('🎙️ Auto-starting transcription as meeting owner...');
          handleStartTranscription();
        }, 5000); // Wait 5 seconds for meeting to fully initialize
        
        return () => clearTimeout(timer);
      } else if (!transcriptionEnabled) {
        console.log('⚠️ Transcription not enabled for domain, skipping auto-start');
      } else {
        console.log('⚠️ User is not meeting owner, skipping auto-start transcription');
      }
      */
    }
  }, [callState, daily, isTranscribing, handleStartTranscription, featuresLoaded, domainFeatures]);

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

    const finalMessages = transcriptMessages
      .filter(msg => msg.isFinal && msg.text.trim().length > 0)
      .slice(-20); // Show last 20 final messages
      
    const interimMessages = transcriptMessages
      .filter(msg => !msg.isFinal && msg.text.trim().length > 0);

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
              disabled={finalMessages.length === 0}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Download transcript"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {isTranscribing ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span>Recording - {finalMessages.length} messages</span>
              </div>
            ) : (
              <span>{finalMessages.length} messages saved</span>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {finalMessages.length === 0 && interimMessages.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {isTranscribing ? 'Listening for speech...' : 'No transcript available'}
              </p>
              {isTranscribing && (
                <p className="text-gray-400 text-xs mt-1">
                  Start speaking to see live transcription
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Final Messages */}
              {finalMessages.map((message) => (
                <div key={message.id} className="text-sm border-l-2 border-blue-200 pl-3">
                  <div className="font-medium text-blue-900 text-xs mb-1">
                    {message.participantName}
                    <span className="text-gray-500 ml-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-900 leading-relaxed">
                    {message.text}
                  </p>
                </div>
              ))}
              
              {/* Interim Messages */}
              {interimMessages.map((message) => (
                <div key={message.id} className="text-sm border-l-2 border-gray-300 pl-3 opacity-75">
                  <div className="font-medium text-gray-600 text-xs mb-1">
                    {message.participantName}
                    <span className="text-gray-400 ml-2">speaking...</span>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">
                    {message.text}
                  </p>
                </div>
              ))}
            </>
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

  console.log('🎨 MeetingRoom Rendering:', {
    callState,
    isTranscribing,
    participantCount: Object.keys(participants).length,
    hasError: !!(error || transcriptionError),
    daily: !!daily
  });

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Transcription Status Banner */}
      {isTranscribing ? (
        <div className="bg-green-600 text-white p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <span className="font-medium">🎙️ Live Transcription Active</span>
            <span className="text-sm opacity-90">
              - {transcriptMessages.filter(m => m.isFinal).length} messages captured
            </span>
          </div>
        </div>
      ) : callState === 'joined' && domainFeatures?.features?.transcription?.enabled && (
        <div className="bg-blue-600 text-white p-2 text-center">
          <span className="text-sm">💡 Click "Start Transcript" below to begin live transcription</span>
        </div>
      )}
      
      {/* Error Display */}
      {(error || transcriptionError || recordingError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-red-700 text-sm">{error || transcriptionError || recordingError}</p>
        </div>
      )}

      {/* Feature Status Display */}
      {featuresLoaded && domainFeatures?.plan?.requiresUpgrade && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-yellow-500" />
          <div className="text-yellow-700 text-sm">
            <strong>Upgrade Required:</strong> Transcription and recording features require a paid Daily.co plan.
            {!domainFeatures.features.transcription.enabled && !domainFeatures.features.recording.enabled && (
              <span className="block mt-1">Contact your administrator to enable these features.</span>
            )}
          </div>
        </div>
      )}

      {/* Feature Status Indicator */}
      {featuresLoaded && !domainFeatures?.plan?.requiresUpgrade && (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-3 text-sm flex items-center gap-6">
          <span className="flex items-center gap-2">
            {domainFeatures?.features?.transcription?.enabled ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-gray-700">
              Transcription: {domainFeatures?.features?.transcription?.enabled ? 'Available' : 'Not Available'}
            </span>
          </span>
          <span className="flex items-center gap-2">
            {domainFeatures?.features?.recording?.enabled ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-gray-700">
              Recording: {domainFeatures?.features?.recording?.enabled ? 'Available' : 'Not Available'}
            </span>
          </span>
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
        {domainFeatures?.features?.transcription?.enabled ? (
          isTranscribing ? (
            <button
              onClick={handleStopTranscription}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 font-bold animate-pulse border-2 border-red-400"
              title="Stop transcription"
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">🛑 STOP TRANSCRIPT</span>
            </button>
          ) : (
            <button
              onClick={handleStartTranscription}
              className="px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2 font-bold border-2 border-green-400"
              title="Start transcription (Live captions)"
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">🎙️ START TRANSCRIPT</span>
            </button>
          )
        ) : (
          <button
            disabled
            className="px-4 py-3 rounded-full bg-gray-500 text-gray-300 transition-colors flex items-center gap-2 font-medium opacity-50 cursor-not-allowed"
            title="Transcription not available - upgrade plan required"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Transcript N/A</span>
          </button>
        )}

        {/* Debug Transcription Button */}
        <button
          onClick={debugTranscriptionCapabilities}
          className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs"
          title="Debug transcription capabilities"
        >
          🔍 Debug
        </button>

        {/* Recording Control */}
        {domainFeatures?.features?.recording?.enabled ? (
          isRecording ? (
            <button
              onClick={handleStopRecording}
              className="px-4 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 font-medium animate-pulse"
              title="Stop recording"
            >
              <CircleStop className="h-5 w-5" />
              <span className="text-sm">Stop Recording</span>
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              className="px-4 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2 font-medium"
              title="Start recording"
            >
              <CirclePlay className="h-5 w-5" />
              <span className="text-sm">Start Recording</span>
            </button>
          )
        ) : (
          <button
            disabled
            className="px-4 py-3 rounded-full bg-gray-500 text-gray-300 transition-colors flex items-center gap-2 font-medium opacity-50 cursor-not-allowed"
            title="Recording not available - upgrade plan required"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Recording N/A</span>
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