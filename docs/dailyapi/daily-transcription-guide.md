# Daily.co Transcription Guide

## Overview

Daily.co provides real-time transcription capabilities powered by Deepgram, offering high-accuracy speech-to-text conversion with under 300ms latency. This guide covers comprehensive implementation for the RicheAI meeting system.

## Key Features

- **High Accuracy**: 90% transcription accuracy powered by Deepgram
- **Real-time Processing**: Sub-300ms latency for live transcription
- **Flexible Control**: Start/stop transcription programmatically
- **Storage Options**: Default Daily storage or custom S3 bucket
- **Selective Transcription**: Choose specific participants to transcribe
- **WebVTT Format**: Standard format for transcript storage
- **Accessibility Support**: Built-in closed captions functionality

## Setup and Configuration

### 1. Basic Transcription Setup

```javascript
// Initialize Daily call object
const callObject = DailyIframe.createCallObject();

// Join room with transcription capabilities
await callObject.join({
  url: 'https://your-domain.daily.co/room-name',
  token: 'your-meeting-token'
});
```

### 2. Permission Configuration

Transcription requires proper permissions configuration at the room or domain level:

```javascript
// Room configuration with transcription enabled
const roomConfig = {
  properties: {
    enable_transcription: true,
    transcription: {
      provider: 'deepgram',
      language: 'en-US'
    }
  }
};
```

### 3. Meeting Token Configuration

For automatic transcription start:

```javascript
const tokenConfig = {
  room_name: 'your-room',
  is_owner: true,
  auto_start_transcription: true,
  enable_transcription_storage: true
};
```

## Core Implementation

### Starting Transcription

#### Method 1: Direct Call Method
```javascript
async function startTranscription() {
  try {
    await callObject.startTranscription({
      language: 'en-US',
      tier: 'standard', // or 'premium'
      includeRawResponse: true,
      redact: false
    });
    console.log('Transcription started successfully');
  } catch (error) {
    console.error('Failed to start transcription:', error);
  }
}
```

#### Method 2: With Custom Configuration
```javascript
async function startAdvancedTranscription() {
  const config = {
    language: 'en-US',
    model: 'general', // or 'meeting', 'phonecall'
    tier: 'premium',
    includeRawResponse: true,
    redact: ['pii'], // Redact personally identifiable information
    extra: {
      punctuate: true,
      diarize: true, // Speaker identification
      utterances: true
    }
  };
  
  await callObject.startTranscription(config);
}
```

### Handling Transcription Events

```javascript
// Listen for transcription start
callObject.on('transcription-started', (event) => {
  console.log('Transcription started:', event);
  updateUITranscriptionStatus(true);
});

// Handle real-time transcription messages
callObject.on('transcription-message', (event) => {
  const { data } = event;
  
  if (data.is_final) {
    // Final transcript - suitable for storage
    saveTranscriptSegment({
      text: data.text,
      participant: data.participantId,
      timestamp: data.timestamp,
      confidence: data.confidence
    });
  } else {
    // Interim transcript - suitable for live display
    updateLiveTranscript(data.text, data.participantId);
  }
});

// Handle transcription errors
callObject.on('transcription-error', (event) => {
  console.error('Transcription error:', event);
  handleTranscriptionError(event.error);
});

// Listen for transcription stop
callObject.on('transcription-stopped', (event) => {
  console.log('Transcription stopped:', event);
  updateUITranscriptionStatus(false);
});
```

### Selective Participant Transcription

```javascript
// Transcribe only specific participants
async function startSelectiveTranscription(participantIds) {
  await callObject.startTranscription({
    language: 'en-US',
    includeRawResponse: true,
    participantIds: participantIds // Array of participant IDs
  });
}

// Get current participants
const participants = callObject.participants();
const hostIds = Object.keys(participants).filter(id => 
  participants[id].owner
);

// Start transcription for hosts only
await startSelectiveTranscription(hostIds);
```

### Updating Transcription Configuration

```javascript
async function updateTranscriptionSettings() {
  await callObject.updateTranscription({
    language: 'en-US',
    tier: 'premium',
    redact: ['pii', 'numbers'] // Add number redaction
  });
}
```

### Stopping Transcription

```javascript
async function stopTranscription() {
  try {
    await callObject.stopTranscription();
    console.log('Transcription stopped successfully');
  } catch (error) {
    console.error('Failed to stop transcription:', error);
  }
}
```

## Advanced Usage Patterns

### 1. Meeting Transcript Manager

```javascript
class MeetingTranscriptManager {
  constructor(callObject) {
    this.callObject = callObject;
    this.transcriptSegments = [];
    this.participants = new Map();
    this.isTranscribing = false;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.callObject.on('transcription-message', (event) => {
      this.handleTranscriptionMessage(event);
    });
    
    this.callObject.on('participant-joined', (event) => {
      this.participants.set(event.participant.session_id, event.participant);
    });
    
    this.callObject.on('participant-left', (event) => {
      this.participants.delete(event.participant.session_id);
    });
  }
  
  handleTranscriptionMessage(event) {
    const { data } = event;
    
    if (data.is_final) {
      const participant = this.participants.get(data.participantId);
      const segment = {
        id: generateUniqueId(),
        text: data.text,
        participant: {
          id: data.participantId,
          name: participant?.user_name || 'Unknown',
          role: participant?.owner ? 'host' : 'participant'
        },
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        duration: data.duration
      };
      
      this.transcriptSegments.push(segment);
      this.notifyTranscriptUpdate(segment);
    }
  }
  
  async startTranscription(config = {}) {
    const defaultConfig = {
      language: 'en-US',
      tier: 'premium',
      includeRawResponse: true,
      redact: ['pii'],
      extra: {
        punctuate: true,
        diarize: true,
        utterances: true
      }
    };
    
    try {
      await this.callObject.startTranscription({
        ...defaultConfig,
        ...config
      });
      this.isTranscribing = true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }
  
  async stopTranscription() {
    try {
      await this.callObject.stopTranscription();
      this.isTranscribing = false;
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      throw error;
    }
  }
  
  getFullTranscript() {
    return this.transcriptSegments
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(segment => `[${segment.timestamp.toISOString()}] ${segment.participant.name}: ${segment.text}`)
      .join('\n');
  }
  
  exportTranscriptAsWebVTT() {
    let webvtt = 'WEBVTT\n\n';
    
    this.transcriptSegments.forEach((segment, index) => {
      const startTime = this.formatWebVTTTime(segment.timestamp);
      const endTime = this.formatWebVTTTime(
        new Date(segment.timestamp.getTime() + (segment.duration || 3000))
      );
      
      webvtt += `${index + 1}\n`;
      webvtt += `${startTime} --> ${endTime}\n`;
      webvtt += `<v ${segment.participant.name}>${segment.text}\n\n`;
    });
    
    return webvtt;
  }
  
  formatWebVTTTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
}
```

### 2. Real-time Transcript Display Component

```javascript
class LiveTranscriptDisplay {
  constructor(container) {
    this.container = container;
    this.interimTranscripts = new Map();
    this.finalTranscripts = [];
  }
  
  updateInterimTranscript(participantId, text) {
    this.interimTranscripts.set(participantId, {
      text,
      timestamp: Date.now()
    });
    this.render();
  }
  
  addFinalTranscript(segment) {
    this.finalTranscripts.push(segment);
    this.interimTranscripts.delete(segment.participant.id);
    this.render();
    this.scrollToBottom();
  }
  
  render() {
    const transcriptHTML = [
      ...this.finalTranscripts.map(segment => `
        <div class="transcript-segment final">
          <span class="participant-name">${segment.participant.name}:</span>
          <span class="transcript-text">${segment.text}</span>
          <span class="timestamp">${this.formatTime(segment.timestamp)}</span>
        </div>
      `),
      ...Array.from(this.interimTranscripts.entries()).map(([participantId, interim]) => `
        <div class="transcript-segment interim">
          <span class="participant-name">...</span>
          <span class="transcript-text interim-text">${interim.text}</span>
        </div>
      `)
    ].join('');
    
    this.container.innerHTML = transcriptHTML;
  }
  
  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }
  
  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
```

## Integration with Backend Systems

### 1. Transcript Storage Service

```javascript
class TranscriptStorageService {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async saveTranscriptSegment(meetingId, segment) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings/${meetingId}/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          text: segment.text,
          participant_id: segment.participant.id,
          participant_name: segment.participant.name,
          timestamp: segment.timestamp,
          confidence: segment.confidence,
          is_final: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save transcript segment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving transcript:', error);
      throw error;
    }
  }
  
  async getFullTranscript(meetingId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings/${meetingId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to retrieve transcript');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error retrieving transcript:', error);
      throw error;
    }
  }
  
  getAuthToken() {
    return localStorage.getItem('authToken');
  }
}
```

### 2. AI-Powered Meeting Insights

```javascript
class MeetingInsightsService {
  constructor(transcriptManager, apiBaseUrl) {
    this.transcriptManager = transcriptManager;
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async generateMeetingSummary(meetingId) {
    const transcript = this.transcriptManager.getFullTranscript();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/meeting-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          transcript: transcript,
          participants: Array.from(this.transcriptManager.participants.values())
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      throw error;
    }
  }
  
  async extractActionItems(meetingId) {
    const transcript = this.transcriptManager.getFullTranscript();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/action-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          transcript: transcript
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error extracting action items:', error);
      throw error;
    }
  }
}
```

## Performance Optimization Tips

### 1. Efficient Event Handling

```javascript
// Debounce interim transcript updates to reduce UI updates
const debouncedInterimUpdate = debounce((participantId, text) => {
  liveTranscriptDisplay.updateInterimTranscript(participantId, text);
}, 100);

callObject.on('transcription-message', (event) => {
  const { data } = event;
  
  if (data.is_final) {
    // Process final transcripts immediately
    transcriptManager.handleTranscriptionMessage(event);
  } else {
    // Debounce interim updates
    debouncedInterimUpdate(data.participantId, data.text);
  }
});
```

### 2. Memory Management

```javascript
class TranscriptBuffer {
  constructor(maxSegments = 1000) {
    this.segments = [];
    this.maxSegments = maxSegments;
  }
  
  addSegment(segment) {
    this.segments.push(segment);
    
    // Remove old segments to prevent memory leaks
    if (this.segments.length > this.maxSegments) {
      const removedSegments = this.segments.splice(0, this.segments.length - this.maxSegments);
      this.archiveSegments(removedSegments);
    }
  }
  
  async archiveSegments(segments) {
    // Archive old segments to backend or IndexedDB
    try {
      await this.storageService.archiveTranscriptSegments(segments);
    } catch (error) {
      console.error('Failed to archive transcript segments:', error);
    }
  }
}
```

### 3. Batch Processing

```javascript
class BatchTranscriptProcessor {
  constructor(storageService, batchSize = 10, flushInterval = 5000) {
    this.storageService = storageService;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.pendingSegments = [];
    
    // Automatically flush batches at regular intervals
    setInterval(() => this.flushBatch(), this.flushInterval);
  }
  
  addSegment(segment) {
    this.pendingSegments.push(segment);
    
    if (this.pendingSegments.length >= this.batchSize) {
      this.flushBatch();
    }
  }
  
  async flushBatch() {
    if (this.pendingSegments.length === 0) return;
    
    const segmentsToProcess = [...this.pendingSegments];
    this.pendingSegments = [];
    
    try {
      await this.storageService.saveBatchTranscriptSegments(segmentsToProcess);
    } catch (error) {
      console.error('Failed to save transcript batch:', error);
      // Re-add failed segments to retry later
      this.pendingSegments.unshift(...segmentsToProcess);
    }
  }
}
```

## Troubleshooting Common Issues

### 1. Transcription Not Starting

```javascript
async function troubleshootTranscriptionStart() {
  // Check permissions
  const participants = callObject.participants();
  const localParticipant = participants.local;
  
  if (!localParticipant.owner) {
    throw new Error('Only meeting owners can start transcription');
  }
  
  // Check room configuration
  const meetingState = callObject.meetingState();
  if (meetingState !== 'joined-meeting') {
    throw new Error('Must be in a meeting to start transcription');
  }
  
  // Verify transcription is enabled
  const roomConfig = await callObject.room();
  if (!roomConfig.config.enable_transcription) {
    throw new Error('Transcription is not enabled for this room');
  }
  
  // Try starting with basic configuration
  try {
    await callObject.startTranscription({
      language: 'en-US'
    });
  } catch (error) {
    console.error('Transcription start failed:', error);
    throw error;
  }
}
```

### 2. Missing Transcription Messages

```javascript
function debugTranscriptionEvents() {
  // Log all transcription-related events
  callObject.on('transcription-started', (event) => {
    console.log('Transcription started:', event);
  });
  
  callObject.on('transcription-message', (event) => {
    console.log('Transcription message received:', {
      participantId: event.data.participantId,
      text: event.data.text,
      isFinal: event.data.is_final,
      timestamp: event.data.timestamp
    });
  });
  
  callObject.on('transcription-error', (event) => {
    console.error('Transcription error:', event);
  });
  
  callObject.on('transcription-stopped', (event) => {
    console.log('Transcription stopped:', event);
  });
  
  // Check if events are being received
  setTimeout(() => {
    const transcriptionState = callObject.transcription();
    console.log('Current transcription state:', transcriptionState);
  }, 5000);
}
```

### 3. Audio Quality Issues

```javascript
async function optimizeAudioForTranscription() {
  // Enable audio processing for better transcription
  await callObject.updateInputSettings({
    audio: {
      processor: {
        type: 'noise-cancellation'
      }
    }
  });
  
  // Monitor audio levels
  callObject.on('local-audio-level', (event) => {
    if (event.audioLevel < 0.1) {
      console.warn('Low audio level detected, transcription quality may be affected');
    }
  });
}
```

## Real-World Implementation Patterns

### 1. Financial Planning Meeting Integration

```javascript
class FinancialPlanningMeetingManager {
  constructor(callObject, clientId, advisorId) {
    this.callObject = callObject;
    this.clientId = clientId;
    this.advisorId = advisorId;
    this.transcriptManager = new MeetingTranscriptManager(callObject);
    this.insightsService = new MeetingInsightsService(this.transcriptManager, '/api');
    
    this.setupMeetingFlow();
  }
  
  async startPlanningSession() {
    // Start transcription for the planning session
    await this.transcriptManager.startTranscription({
      language: 'en-US',
      tier: 'premium',
      redact: ['pii'], // Protect client information
      extra: {
        punctuate: true,
        diarize: true // Distinguish between advisor and client
      }
    });
    
    // Track session start
    await this.logSessionEvent('session_started');
  }
  
  async endPlanningSession() {
    // Stop transcription
    await this.transcriptManager.stopTranscription();
    
    // Generate session summary
    const summary = await this.insightsService.generateMeetingSummary(this.sessionId);
    
    // Extract financial planning action items
    const actionItems = await this.insightsService.extractActionItems(this.sessionId);
    
    // Save session data
    await this.saveSessionResults(summary, actionItems);
    
    // Track session end
    await this.logSessionEvent('session_ended');
  }
  
  async saveSessionResults(summary, actionItems) {
    const sessionData = {
      client_id: this.clientId,
      advisor_id: this.advisorId,
      session_id: this.sessionId,
      transcript: this.transcriptManager.getFullTranscript(),
      summary: summary,
      action_items: actionItems,
      timestamp: new Date()
    };
    
    await fetch('/api/planning-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(sessionData)
    });
  }
}
```

### 2. Compliance and Recording

```javascript
class ComplianceMeetingManager {
  constructor(callObject) {
    this.callObject = callObject;
    this.complianceConfig = {
      required_disclosures: true,
      pii_redaction: true,
      audit_trail: true
    };
  }
  
  async startComplianceSession() {
    // Ensure all participants consent to recording
    await this.requestRecordingConsent();
    
    // Start transcription with compliance settings
    await this.callObject.startTranscription({
      language: 'en-US',
      tier: 'premium',
      redact: ['pii', 'numbers'], // Redact sensitive information
      includeRawResponse: true,
      extra: {
        punctuate: true,
        diarize: true,
        utterances: true
      }
    });
    
    // Log compliance event
    await this.logComplianceEvent('transcription_started');
  }
  
  async requestRecordingConsent() {
    // Implementation to request and track consent
    const participants = this.callObject.participants();
    const consentRequests = Object.keys(participants).map(participantId => {
      return this.requestIndividualConsent(participantId);
    });
    
    const consentResults = await Promise.all(consentRequests);
    
    if (!consentResults.every(consent => consent.granted)) {
      throw new Error('Not all participants consented to recording');
    }
  }
}
```

This comprehensive guide provides everything needed to implement Daily.co transcription in the RicheAI meeting system, with focus on financial planning use cases, compliance requirements, and performance optimization.