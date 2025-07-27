# Daily.co REST Transcription API

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Authentication](#authentication)
- [Transcription Endpoints](#transcription-endpoints)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Configuration Options](#configuration-options)
- [Integration Examples](#integration-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Daily.co REST Transcription API provides real-time speech-to-text capabilities for video calls using Deepgram's transcription service. This API enables developers to programmatically start, update, and stop transcription for specific rooms.

### Key Features
- Real-time transcription with Deepgram integration
- Multi-language support
- Custom transcription parameters
- Multi-instance transcription support
- Participant-specific transcription
- Storage options (Daily S3 or custom S3)
- Live captions support

### Requirements
- Active Daily.co account with credit card attached
- Valid API key with transcription permissions
- Room must be in SFU (Selective Forwarding Unit) mode
- Active call in the target room

## Prerequisites

### Account Setup
1. **Credit Card Requirement**: Transcription features require a credit card attached to your Daily.co account
2. **API Access**: Ensure your API key has transcription permissions
3. **Deepgram Integration**: Daily.co uses Deepgram for transcription services

### Room Configuration
```json
{
  "properties": {
    "room_type": "sfu",
    "enable_transcription": true,
    "auto_start_transcription": false,
    "transcription": {
      "provider": "deepgram",
      "tier": "nova",
      "language": "en-US"
    }
  }
}
```

## Authentication

All transcription endpoints require API key authentication:

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Rate Limiting
- **Transcription Operations**: 1 request per second
- **Burst Limit**: 5 requests over 5 seconds
- **Applies to**: Start, update, stop operations

## Transcription Endpoints

### Start Transcription

Initiates transcription for a specific room with configurable Deepgram parameters.

#### Endpoint
```http
POST /v1/rooms/:name/transcription/start
```

#### Path Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| name      | string | Yes      | The room name/identifier |

#### Request Body Schema
```json
{
  "language": "string",           // Language code (e.g., "en-US", "es", "fr")
  "model": "string",              // Deepgram model ("nova-2", "enhanced", "base")
  "profanity_filter": boolean,    // Enable profanity filtering
  "punctuate": boolean,           // Enable punctuation
  "endpointing": number,          // Silence detection timeout (ms)
  "redact": boolean | array,      // Redact sensitive information
  "raw_response": boolean,        // Include Deepgram raw response
  "instanceId": "string",         // Multi-instance identifier
  "participants": ["string"]      // Array of participant IDs to transcribe
}
```

#### Example Request
```bash
curl -X POST \
  https://api.daily.co/v1/rooms/meeting-room-123/transcription/start \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "language": "en-US",
    "model": "nova-2",
    "profanity_filter": false,
    "punctuate": true,
    "endpointing": 300,
    "redact": false,
    "instanceId": "main-transcription",
    "participants": ["user-123", "user-456"]
  }'
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "transcription_id": "trans-abc123",
  "room": "meeting-room-123",
  "status": "started",
  "configuration": {
    "language": "en-US",
    "model": "nova-2",
    "profanity_filter": false,
    "punctuate": true,
    "endpointing": 300
  },
  "started_at": "2024-01-15T10:30:00Z"
}
```

#### Error Responses

**404 - Room Not Hosting Call**
```json
{
  "error": "room-not-active",
  "message": "Room is not hosting a call"
}
```

**400 - Stream in Progress**
```json
{
  "error": "transcription-active",
  "message": "Transcription already in progress for this room"
}
```

**400 - Room Not in SFU Mode**
```json
{
  "error": "invalid-room-type",
  "message": "Room must be in SFU mode for transcription"
}
```

**400 - Invalid Deepgram Configuration**
```json
{
  "error": "invalid-config",
  "message": "Deepgram API key invalid or configuration error",
  "details": {
    "parameter": "language",
    "error": "Unsupported language code"
  }
}
```

### Update Transcription

Updates transcription parameters for an active transcription session.

#### Endpoint
```http
POST /v1/rooms/:name/transcription/update
```

#### Path Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| name      | string | Yes      | The room name/identifier |

#### Request Body Schema
```json
{
  "language": "string",           // Update language
  "profanity_filter": boolean,    // Update profanity filter
  "punctuate": boolean,           // Update punctuation
  "redact": boolean | array,      // Update redaction settings
  "instanceId": "string",         // Target instance to update
  "participants": ["string"]      // Update participant list
}
```

#### Example Request
```bash
curl -X POST \
  https://api.daily.co/v1/rooms/meeting-room-123/transcription/update \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "language": "es",
    "profanity_filter": true,
    "instanceId": "main-transcription"
  }'
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "transcription_id": "trans-abc123",
  "room": "meeting-room-123",
  "status": "updated",
  "configuration": {
    "language": "es",
    "model": "nova-2",
    "profanity_filter": true,
    "punctuate": true,
    "endpointing": 300
  },
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### Stop Transcription

Stops an active transcription session in a room.

#### Endpoint
```http
POST /v1/rooms/:name/transcription/stop
```

#### Path Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| name      | string | Yes      | The room name/identifier |

#### Request Body Schema
```json
{
  "instanceId": "string"  // Optional: specific instance to stop
}
```

#### Example Request
```bash
curl -X POST \
  https://api.daily.co/v1/rooms/meeting-room-123/transcription/stop \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceId": "main-transcription"
  }'
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "transcription_id": "trans-abc123",
  "room": "meeting-room-123",
  "status": "stopped",
  "stopped_at": "2024-01-15T10:45:00Z",
  "duration_seconds": 900,
  "transcript_url": "https://api.daily.co/v1/transcript/trans-abc123"
}
```

#### Error Responses

**404 - No Active Transcription**
```json
{
  "error": "no-active-transcription",
  "message": "No active transcription found for this room"
}
```

**400 - Call Closed**
```json
{
  "error": "call-closed",
  "message": "Call closed before transcription could be stopped"
}
```

## Request/Response Schemas

### Deepgram Configuration Parameters

#### Language Codes
```javascript
const supportedLanguages = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'en-AU': 'English (Australia)',
  'es': 'Spanish',
  'es-419': 'Spanish (Latin America)',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'pt-BR': 'Portuguese (Brazil)',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Mandarin)',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'ru': 'Russian',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish'
};
```

#### Model Options
```javascript
const deepgramModels = {
  'nova-2': {
    description: 'Latest and most accurate model',
    languages: ['en-US', 'en-GB', 'en-AU', 'es', 'fr', 'de', 'pt', 'ja'],
    features: ['high-accuracy', 'real-time', 'punctuation']
  },
  'nova': {
    description: 'Previous generation model',
    languages: ['en-US', 'en-GB', 'es', 'fr'],
    features: ['real-time', 'punctuation']
  },
  'enhanced': {
    description: 'Enhanced accuracy model',
    languages: ['en-US'],
    features: ['high-accuracy', 'slow-processing']
  },
  'base': {
    description: 'Base model for cost optimization',
    languages: ['en-US'],
    features: ['basic-accuracy', 'fast-processing']
  }
};
```

#### Redaction Options
```javascript
const redactionOptions = {
  // Boolean redaction
  redact: true,  // Redact all PII
  
  // Array-based redaction
  redact: [
    'pci',          // Credit card numbers
    'numbers',      // All numbers
    'ssn',          // Social security numbers
    'name',         // Person names
    'address',      // Addresses
    'email',        // Email addresses
    'phone_number', // Phone numbers
    'account_number' // Account numbers
  ]
};
```

#### Endpointing Configuration
```javascript
const endpointingOptions = {
  endpointing: false,     // Disable endpointing
  endpointing: true,      // Default endpointing (300ms)
  endpointing: 150,       // Custom timeout in milliseconds
  endpointing: 1000       // Longer timeout for slower speakers
};
```

### Multi-Instance Transcription

Enable multiple simultaneous transcription instances with different configurations:

```json
{
  "instances": [
    {
      "instanceId": "english-transcription",
      "language": "en-US",
      "model": "nova-2",
      "participants": ["host-001", "participant-002"]
    },
    {
      "instanceId": "spanish-transcription",
      "language": "es",
      "model": "nova-2",
      "participants": ["participant-003", "participant-004"]
    }
  ]
}
```

## Error Handling

### Common Error Scenarios

#### Room State Errors
```javascript
const handleRoomErrors = (error) => {
  switch (error.error) {
    case 'room-not-active':
      return 'No active call in this room. Start a call before beginning transcription.';
    
    case 'room-not-found':
      return 'The specified room does not exist.';
    
    case 'invalid-room-type':
      return 'Room must be configured for SFU mode to support transcription.';
    
    default:
      return 'Unknown room error occurred.';
  }
};
```

#### Transcription State Errors
```javascript
const handleTranscriptionErrors = (error) => {
  switch (error.error) {
    case 'transcription-active':
      return 'Transcription is already running. Use update endpoint to modify settings.';
    
    case 'no-active-transcription':
      return 'No transcription is currently active for this room.';
    
    case 'deepgram-api-error':
      return 'Transcription service error. Check configuration and try again.';
    
    default:
      return 'Transcription operation failed.';
  }
};
```

#### Configuration Errors
```javascript
const handleConfigErrors = (error) => {
  if (error.details) {
    return `Configuration error in ${error.details.parameter}: ${error.details.error}`;
  }
  return 'Invalid transcription configuration provided.';
};
```

### Retry Strategy
```javascript
const transcriptionWithRetry = async (roomName, config, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await startTranscription(roomName, config);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Don't retry on configuration errors
      if (error.status === 400 && error.error === 'invalid-config') {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## Configuration Options

### Optimal Settings by Use Case

#### Business Meetings
```json
{
  "language": "en-US",
  "model": "nova-2",
  "profanity_filter": true,
  "punctuate": true,
  "endpointing": 300,
  "redact": ["pci", "ssn"],
  "raw_response": false
}
```

#### Educational Sessions
```json
{
  "language": "en-US",
  "model": "nova-2",
  "profanity_filter": false,
  "punctuate": true,
  "endpointing": 500,
  "redact": false,
  "raw_response": false
}
```

#### Legal/Compliance Meetings
```json
{
  "language": "en-US",
  "model": "nova-2",
  "profanity_filter": false,
  "punctuate": true,
  "endpointing": 200,
  "redact": ["pci", "ssn", "account_number"],
  "raw_response": true
}
```

#### Multilingual Meetings
```json
{
  "instances": [
    {
      "instanceId": "primary-lang",
      "language": "en-US",
      "model": "nova-2",
      "participants": ["host"]
    },
    {
      "instanceId": "secondary-lang",
      "language": "es",
      "model": "nova-2",
      "participants": ["guest-speaker"]
    }
  ]
}
```

### Storage Configuration

#### Daily S3 Storage (Default)
```json
{
  "transcription_storage": {
    "provider": "daily",
    "path_template": "{domain_name}/{room_name}/{timestamp}.vtt",
    "format": "vtt",
    "api_access": true
  }
}
```

#### Custom S3 Storage
```json
{
  "transcription_storage": {
    "provider": "s3",
    "bucket": "your-transcripts-bucket",
    "region": "us-west-2",
    "path_template": "meetings/{room_name}/{date}/{timestamp}.vtt",
    "format": "vtt",
    "api_access": false
  }
}
```

## Integration Examples

### Node.js Backend Integration

```javascript
class TranscriptionManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.daily.co/v1';
  }

  async startMeetingTranscription(roomName, options = {}) {
    const defaultConfig = {
      language: 'en-US',
      model: 'nova-2',
      profanity_filter: true,
      punctuate: true,
      endpointing: 300,
      redact: ['pci', 'ssn']
    };

    const config = { ...defaultConfig, ...options };

    try {
      const response = await fetch(
        `${this.baseURL}/rooms/${roomName}/transcription/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Transcription start failed: ${error.message}`);
      }

      const result = await response.json();
      console.log('Transcription started:', result.transcription_id);
      return result;

    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async updateTranscriptionLanguage(roomName, newLanguage, instanceId) {
    try {
      const response = await fetch(
        `${this.baseURL}/rooms/${roomName}/transcription/update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            language: newLanguage,
            instanceId: instanceId
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Transcription update failed: ${error.message}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to update transcription:', error);
      throw error;
    }
  }

  async stopMeetingTranscription(roomName, instanceId) {
    try {
      const response = await fetch(
        `${this.baseURL}/rooms/${roomName}/transcription/stop`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceId: instanceId
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Transcription stop failed: ${error.message}`);
      }

      const result = await response.json();
      console.log('Transcription stopped. Duration:', result.duration_seconds);
      return result;

    } catch (error) {
      console.error('Failed to stop transcription:', error);
      throw error;
    }
  }
}

// Usage Example
const transcriptionManager = new TranscriptionManager(process.env.DAILY_API_KEY);

// Express route for starting transcription
app.post('/api/meetings/:roomName/transcription/start', async (req, res) => {
  try {
    const { roomName } = req.params;
    const { language, participants } = req.body;

    const transcriptionConfig = {
      language: language || 'en-US',
      participants: participants || [],
      instanceId: `meeting-${roomName}-${Date.now()}`
    };

    const result = await transcriptionManager.startMeetingTranscription(
      roomName,
      transcriptionConfig
    );

    res.json({
      success: true,
      transcriptionId: result.transcription_id,
      config: result.configuration
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Webhook Integration for Transcription Events

```javascript
// Webhook handler for transcription events
app.post('/webhooks/daily/transcription', express.json(), (req, res) => {
  const event = req.body;

  switch (event.type) {
    case 'transcription.started':
      handleTranscriptionStarted(event.data);
      break;

    case 'transcription.message':
      handleTranscriptionMessage(event.data);
      break;

    case 'transcription.stopped':
      handleTranscriptionStopped(event.data);
      break;

    case 'transcription.error':
      handleTranscriptionError(event.data);
      break;

    default:
      console.log('Unknown transcription event:', event.type);
  }

  res.status(200).send('OK');
});

const handleTranscriptionStarted = (data) => {
  console.log('Transcription started for room:', data.room);
  
  // Update meeting status in database
  updateMeetingStatus(data.room, 'transcription_active');
  
  // Notify participants
  notifyParticipants(data.room, 'Transcription has started');
};

const handleTranscriptionMessage = (data) => {
  // Real-time transcription message
  const { room, text, participant, timestamp, is_final } = data;
  
  if (is_final) {
    // Store final transcription segment
    storeTranscriptionSegment({
      room,
      text,
      participant,
      timestamp
    });
    
    // Broadcast to connected clients
    broadcastTranscription(room, {
      text,
      participant,
      timestamp
    });
  } else {
    // Handle interim results for live captions
    broadcastInterimTranscription(room, {
      text,
      participant,
      is_interim: true
    });
  }
};

const handleTranscriptionStopped = async (data) => {
  console.log('Transcription stopped for room:', data.room);
  
  // Update meeting status
  updateMeetingStatus(data.room, 'transcription_complete');
  
  // Download and process final transcript
  if (data.transcript_url) {
    try {
      const transcript = await downloadTranscript(data.transcript_url);
      await processCompleteTranscript(data.room, transcript);
    } catch (error) {
      console.error('Failed to process transcript:', error);
    }
  }
};
```

### Multi-Language Support Example

```javascript
class MultiLanguageTranscription {
  constructor(apiKey) {
    this.transcriptionManager = new TranscriptionManager(apiKey);
    this.activeLanguages = new Map();
  }

  async startMultiLanguageTranscription(roomName, languageConfig) {
    const instances = [];

    for (const config of languageConfig) {
      try {
        const instanceId = `${config.language}-${Date.now()}`;
        
        const transcriptionConfig = {
          language: config.language,
          model: 'nova-2',
          participants: config.participants,
          instanceId: instanceId
        };

        const result = await this.transcriptionManager.startMeetingTranscription(
          roomName,
          transcriptionConfig
        );

        instances.push({
          language: config.language,
          instanceId: instanceId,
          transcriptionId: result.transcription_id,
          participants: config.participants
        });

        this.activeLanguages.set(instanceId, config.language);

      } catch (error) {
        console.error(`Failed to start ${config.language} transcription:`, error);
      }
    }

    return instances;
  }

  async switchParticipantLanguage(roomName, participantId, newLanguage) {
    // Find current instance for participant
    const currentInstance = this.findParticipantInstance(participantId);
    
    if (currentInstance) {
      // Remove from current instance
      await this.updateInstanceParticipants(
        roomName,
        currentInstance.instanceId,
        currentInstance.participants.filter(p => p !== participantId)
      );
    }

    // Add to new language instance
    const targetInstance = this.findLanguageInstance(newLanguage);
    if (targetInstance) {
      await this.updateInstanceParticipants(
        roomName,
        targetInstance.instanceId,
        [...targetInstance.participants, participantId]
      );
    }
  }

  async updateInstanceParticipants(roomName, instanceId, participants) {
    return await this.transcriptionManager.updateTranscriptionLanguage(
      roomName,
      this.activeLanguages.get(instanceId),
      instanceId,
      { participants }
    );
  }
}

// Usage
const multiLangTranscription = new MultiLanguageTranscription(process.env.DAILY_API_KEY);

const languageConfig = [
  {
    language: 'en-US',
    participants: ['host-001', 'participant-002']
  },
  {
    language: 'es',
    participants: ['participant-003']
  },
  {
    language: 'fr',
    participants: ['participant-004']
  }
];

await multiLangTranscription.startMultiLanguageTranscription(
  'international-meeting-123',
  languageConfig
);
```

## Best Practices

### Production Deployment

#### 1. Error Handling and Resilience
```javascript
const robustTranscriptionStart = async (roomName, config) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await startTranscription(roomName, config);
    } catch (error) {
      // Don't retry on configuration errors
      if (error.status === 400 && error.error === 'invalid-config') {
        throw error;
      }

      // Don't retry if room doesn't exist
      if (error.status === 404) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw new Error(`Failed to start transcription after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff with jitter
      const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

#### 2. Resource Management
```javascript
class TranscriptionResourceManager {
  constructor() {
    this.activeTranscriptions = new Map();
    this.transcriptionTimeouts = new Map();
  }

  async startTranscription(roomName, config, maxDuration = 3600) {
    try {
      const result = await transcriptionManager.startMeetingTranscription(roomName, config);
      
      // Track active transcription
      this.activeTranscriptions.set(roomName, {
        transcriptionId: result.transcription_id,
        startTime: Date.now(),
        config: config
      });

      // Set automatic timeout
      const timeoutId = setTimeout(async () => {
        await this.forceStopTranscription(roomName);
      }, maxDuration * 1000);

      this.transcriptionTimeouts.set(roomName, timeoutId);

      return result;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  async stopTranscription(roomName) {
    try {
      // Clear timeout
      if (this.transcriptionTimeouts.has(roomName)) {
        clearTimeout(this.transcriptionTimeouts.get(roomName));
        this.transcriptionTimeouts.delete(roomName);
      }

      // Stop transcription
      const result = await transcriptionManager.stopMeetingTranscription(roomName);

      // Clean up tracking
      this.activeTranscriptions.delete(roomName);

      return result;
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      throw error;
    }
  }

  async forceStopTranscription(roomName) {
    console.log(`Force stopping transcription for room: ${roomName} (timeout reached)`);
    await this.stopTranscription(roomName);
  }

  getActiveTranscriptions() {
    return Array.from(this.activeTranscriptions.keys());
  }

  isTranscriptionActive(roomName) {
    return this.activeTranscriptions.has(roomName);
  }
}
```

#### 3. Monitoring and Logging
```javascript
const transcriptionLogger = {
  logStart: (roomName, config, result) => {
    console.log(`[TRANSCRIPTION] Started for room: ${roomName}`, {
      transcriptionId: result.transcription_id,
      language: config.language,
      model: config.model,
      participants: config.participants?.length || 'all',
      timestamp: new Date().toISOString()
    });
  },

  logUpdate: (roomName, changes, result) => {
    console.log(`[TRANSCRIPTION] Updated for room: ${roomName}`, {
      transcriptionId: result.transcription_id,
      changes: changes,
      timestamp: new Date().toISOString()
    });
  },

  logStop: (roomName, result) => {
    console.log(`[TRANSCRIPTION] Stopped for room: ${roomName}`, {
      transcriptionId: result.transcription_id,
      duration: result.duration_seconds,
      transcriptUrl: result.transcript_url,
      timestamp: new Date().toISOString()
    });
  },

  logError: (operation, roomName, error) => {
    console.error(`[TRANSCRIPTION] ${operation} failed for room: ${roomName}`, {
      error: error.message,
      status: error.status,
      timestamp: new Date().toISOString()
    });
  }
};
```

#### 4. Configuration Validation
```javascript
const validateTranscriptionConfig = (config) => {
  const errors = [];

  // Validate language
  if (config.language && !supportedLanguages[config.language]) {
    errors.push(`Unsupported language: ${config.language}`);
  }

  // Validate model
  if (config.model && !deepgramModels[config.model]) {
    errors.push(`Unsupported model: ${config.model}`);
  }

  // Validate endpointing
  if (config.endpointing && typeof config.endpointing === 'number') {
    if (config.endpointing < 10 || config.endpointing > 10000) {
      errors.push('Endpointing must be between 10 and 10000 milliseconds');
    }
  }

  // Validate participants
  if (config.participants && !Array.isArray(config.participants)) {
    errors.push('Participants must be an array of strings');
  }

  // Validate redaction settings
  if (config.redact && Array.isArray(config.redact)) {
    const validRedactionTypes = ['pci', 'numbers', 'ssn', 'name', 'address', 'email', 'phone_number', 'account_number'];
    const invalidTypes = config.redact.filter(type => !validRedactionTypes.includes(type));
    if (invalidTypes.length > 0) {
      errors.push(`Invalid redaction types: ${invalidTypes.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join('; ')}`);
  }

  return true;
};
```

### Cost Optimization

#### 1. Smart Participant Targeting
```javascript
const optimizeTranscriptionCosts = (participants, hostId) => {
  // Only transcribe hosts and active speakers
  const priority = {
    hosts: participants.filter(p => p.role === 'host'),
    activeSpeakers: participants.filter(p => p.lastSpeakTime > Date.now() - 60000),
    others: participants.filter(p => p.role !== 'host' && p.lastSpeakTime <= Date.now() - 60000)
  };

  // Transcribe hosts + up to 5 most active speakers
  return [
    ...priority.hosts.map(p => p.id),
    ...priority.activeSpeakers.slice(0, 5).map(p => p.id)
  ];
};
```

#### 2. Dynamic Language Detection
```javascript
const detectAndSwitchLanguage = async (roomName, transcriptionText) => {
  // Simple language detection based on common words/patterns
  const languageIndicators = {
    'en-US': ['the', 'and', 'you', 'that', 'was'],
    'es': ['el', 'la', 'que', 'de', 'en'],
    'fr': ['le', 'de', 'et', 'à', 'un'],
    'de': ['der', 'die', 'und', 'in', 'den']
  };

  const detectedLanguage = detectLanguageFromText(transcriptionText, languageIndicators);
  
  if (detectedLanguage && detectedLanguage !== currentLanguage) {
    await transcriptionManager.updateTranscriptionLanguage(
      roomName,
      detectedLanguage,
      'main-instance'
    );
  }
};
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Transcription Not Starting
**Symptoms**: 400 error with "Room not in SFU mode"
**Solution**: 
```javascript
// Ensure room is created with SFU mode
const roomConfig = {
  name: 'meeting-room',
  properties: {
    room_type: 'sfu',  // Required for transcription
    enable_transcription: true
  }
};
```

#### Issue: Transcription Quality Poor
**Symptoms**: Inaccurate or incomplete transcriptions
**Solutions**:
1. **Use better model**: Switch to 'nova-2' for highest accuracy
2. **Optimize endpointing**: Reduce to 200ms for faster speakers
3. **Check audio quality**: Ensure good microphone input
4. **Filter participants**: Only transcribe clear speakers

```javascript
const highQualityConfig = {
  language: 'en-US',
  model: 'nova-2',
  endpointing: 200,
  participants: ['clear-speaker-001'], // Only transcribe clear speakers
  profanity_filter: false, // Don't filter technical terms
  punctuate: true
};
```

#### Issue: Rate Limit Exceeded
**Symptoms**: 429 errors on transcription requests
**Solution**: Implement proper rate limiting and queuing
```javascript
class TranscriptionQueue {
  constructor(maxConcurrent = 5) {
    this.queue = [];
    this.active = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.active++;
    const { operation, resolve, reject } = this.queue.shift();

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      this.process(); // Process next item
    }
  }
}
```

#### Issue: Missing Transcription Data
**Symptoms**: Transcription events not received
**Solutions**:
1. **Check webhook configuration**
2. **Verify room is active before starting transcription**
3. **Ensure participants are speaking**

```javascript
const diagnosticCheck = async (roomName) => {
  // Check room status
  const room = await getRoomStatus(roomName);
  console.log('Room status:', room.status);
  
  // Check participant count
  console.log('Active participants:', room.participant_count);
  
  // Check transcription capability
  console.log('Transcription enabled:', room.properties.enable_transcription);
  
  // Check active call
  console.log('Call active:', room.call_active);
};
```

### Debugging Tools

#### Transcription Health Monitor
```javascript
class TranscriptionHealthMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgDuration: 0,
      languages: new Map(),
      errorTypes: new Map()
    };
  }

  recordRequest(language) {
    this.metrics.requests++;
    this.metrics.languages.set(language, (this.metrics.languages.get(language) || 0) + 1);
  }

  recordError(errorType) {
    this.metrics.errors++;
    this.metrics.errorTypes.set(errorType, (this.metrics.errorTypes.get(errorType) || 0) + 1);
  }

  recordDuration(seconds) {
    const current = this.metrics.avgDuration;
    const count = this.metrics.requests;
    this.metrics.avgDuration = (current * (count - 1) + seconds) / count;
  }

  getHealthReport() {
    return {
      totalRequests: this.metrics.requests,
      errorRate: this.metrics.errors / this.metrics.requests,
      averageDuration: this.metrics.avgDuration,
      topLanguages: Array.from(this.metrics.languages.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topErrors: Array.from(this.metrics.errorTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }
}
```

This comprehensive documentation provides everything needed to integrate Daily.co's REST transcription API into production backend systems, with emphasis on reliability, error handling, and cost optimization.