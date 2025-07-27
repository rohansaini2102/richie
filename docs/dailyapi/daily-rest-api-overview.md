# Daily.co REST API Overview

## Table of Contents
- [Introduction](#introduction)
- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Room Management](#room-management)
- [Meeting Tokens](#meeting-tokens)
- [Best Practices](#best-practices)
- [Integration Patterns](#integration-patterns)

## Introduction

The Daily.co REST API provides comprehensive endpoints for managing audio and video rooms, meeting tokens, recordings, domains, metrics, and logs. This API is designed for backend integration and enables developers to programmatically control all aspects of Daily video conferencing infrastructure.

### Key Features
- Room creation and management
- Meeting token generation and validation
- Recording management
- Transcription control
- Real-time metrics and logging
- Domain configuration

## Authentication

Daily.co uses API key-based authentication for REST API access.

### Authentication Header
All API requests must include your API key in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY
```

### API Key Management
- API keys are available in your Daily.co dashboard
- Keep API keys secure and never expose them in client-side code
- Rotate API keys regularly for security

### Example Request
```bash
curl -X GET \
  https://api.daily.co/v1/rooms \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json'
```

## Base URLs

### Production
```
https://api.daily.co/v1
```

### API Versioning
- Current stable version: v1
- All endpoints are prefixed with `/v1`
- API versions are maintained for backward compatibility

## Rate Limiting

Daily.co implements rate limiting to ensure service reliability:

### General Limits
- **Default**: 2 requests per second
- **Burst**: 50 requests over a 30-second window

### Specific Endpoint Limits

#### High-Impact Operations
- **Recording/Livestreaming/PSTN/SIP**: 1 request per second (5 requests over 5 seconds)
- **Room Deletion**: 2 requests per second (50 requests over 30 seconds)

#### Pagination Limits
- **List endpoints**: Maximum 100 objects per request
- Use pagination parameters for larger datasets

### Rate Limit Headers
```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits
```javascript
// Example rate limit handling
const makeApiRequest = async (endpoint, options) => {
  try {
    const response = await fetch(endpoint, options);
    
    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitTime = (resetTime * 1000) - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeApiRequest(endpoint, options);
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

## Error Handling

### Standard HTTP Status Codes

#### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned

#### Client Error Codes
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate room name)
- `422 Unprocessable Entity` - Valid request format but invalid data
- `429 Too Many Requests` - Rate limit exceeded

#### Server Error Codes
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Gateway error
- `503 Service Unavailable` - Service temporarily unavailable

### Error Response Format
```json
{
  "error": "string",
  "message": "string",
  "details": {
    "field": "error_description"
  }
}
```

### Common Error Scenarios

#### Room Errors
```json
{
  "error": "room-not-found",
  "message": "Room 'meeting-123' not found"
}
```

#### Authentication Errors
```json
{
  "error": "unauthorized",
  "message": "Invalid API key"
}
```

#### Validation Errors
```json
{
  "error": "validation-failed",
  "message": "Invalid room configuration",
  "details": {
    "name": "Room name contains invalid characters"
  }
}
```

## Room Management

### Room Properties

#### Basic Properties
- **name**: Unique room identifier (alphanumeric, dash, underscore only, max 128 chars)
- **privacy**: Control access level (`public`, `private`)
- **properties**: Configuration object with room settings

#### Room Configuration Object
```json
{
  "name": "meeting-room-123",
  "privacy": "private",
  "properties": {
    "max_participants": 50,
    "enable_chat": true,
    "enable_screenshare": true,
    "enable_recording": "cloud",
    "start_cloud_recording": false,
    "enable_transcription": true,
    "auto_start_transcription": false,
    "transcription": {
      "provider": "deepgram",
      "tier": "nova",
      "language": "en-US",
      "model": "nova-2",
      "profanity_filter": false,
      "redact": false,
      "endpointing": 300,
      "punctuate": true
    },
    "exp": 1640995200,
    "eject_at_room_exp": true,
    "enable_prejoin_ui": true,
    "enable_network_ui": true,
    "enable_people_ui": true,
    "enable_pip_ui": true,
    "room_type": "sfu",
    "signaling_impl": "ws"
  }
}
```

### Core Room Endpoints

#### Create Room
```http
POST /v1/rooms
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "name": "meeting-room-123",
  "privacy": "private",
  "properties": {
    "max_participants": 10,
    "enable_transcription": true
  }
}
```

#### Get Room
```http
GET /v1/rooms/:name
Authorization: Bearer YOUR_API_KEY
```

#### Update Room
```http
POST /v1/rooms/:name
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "properties": {
    "max_participants": 20
  }
}
```

#### Delete Room
```http
DELETE /v1/rooms/:name
Authorization: Bearer YOUR_API_KEY
```

#### List Rooms
```http
GET /v1/rooms?limit=100&ending_before=room-name
Authorization: Bearer YOUR_API_KEY
```

### Room Validation Rules

#### Name Validation
- Only alphanumeric characters, dashes, and underscores
- Maximum 128 characters
- Must be unique within your domain
- Regex pattern: `/^[A-Za-z0-9_-]+$/`

#### Privacy Levels
- `public`: Anyone can join with room URL
- `private`: Requires meeting token for access

## Meeting Tokens

Meeting tokens control access to Daily rooms and provide fine-grained permissions.

### Token Properties

#### Core Properties
- **room_name**: Room this token is valid for (if not set, valid for all rooms)
- **user_name**: Display name for the participant
- **user_id**: Unique identifier for the participant
- **is_owner**: Owner privileges (boolean)
- **exp**: Expiration timestamp (Unix timestamp)
- **nbf**: Not before timestamp (Unix timestamp)

#### Permission Properties
```json
{
  "enable_screenshare": true,
  "enable_recording": true,
  "enable_transcription": true,
  "start_cloud_recording": false,
  "start_transcription": false,
  "enable_sip_endpoint": false,
  "enable_live_streaming": false
}
```

### Create Meeting Token
```http
POST /v1/meeting-tokens
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "properties": {
    "room_name": "meeting-room-123",
    "user_name": "John Doe",
    "user_id": "user-456",
    "is_owner": true,
    "exp": 1640995200,
    "enable_recording": true,
    "enable_transcription": true
  }
}
```

### Response Format
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": 1640995200
}
```

### Token Usage
```javascript
// Frontend usage
const daily = DailyIframe.createFrame();
daily.join({
  url: 'https://your-domain.daily.co/meeting-room-123',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

## Best Practices

### Security
1. **Never expose API keys in client-side code**
2. **Use meeting tokens for client access control**
3. **Set appropriate token expiration times**
4. **Rotate API keys regularly**
5. **Validate room names on the server side**

### Performance
1. **Implement proper error handling and retries**
2. **Respect rate limits**
3. **Use pagination for large datasets**
4. **Cache room configurations when appropriate**
5. **Monitor API usage and costs**

### Reliability
1. **Implement exponential backoff for retries**
2. **Handle network timeouts gracefully**
3. **Use webhooks for real-time event handling**
4. **Monitor API health and status**

### Code Example: Robust Room Creation
```javascript
const createRoom = async (roomConfig) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomConfig)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 409) {
        // Room already exists
        throw new Error('Room name already exists');
      }
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempt++;
        continue;
      }
      
      throw new Error(`API request failed: ${response.status}`);
      
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      attempt++;
      
      // Exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};
```

## Integration Patterns

### Backend Integration Architecture

#### Node.js/Express Example
```javascript
const express = require('express');
const axios = require('axios');

class DailyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.daily.co/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async createRoom(roomData) {
    try {
      const response = await this.client.post('/rooms', roomData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async createMeetingToken(tokenData) {
    try {
      const response = await this.client.post('/meeting-tokens', {
        properties: tokenData
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  handleError(error) {
    if (error.response) {
      return new Error(`Daily API Error: ${error.response.data.message}`);
    }
    return error;
  }
}

// Usage in Express routes
const dailyService = new DailyService(process.env.DAILY_API_KEY);

app.post('/api/meetings', async (req, res) => {
  try {
    const { meetingName, participantName, isHost } = req.body;
    
    // Create room
    const room = await dailyService.createRoom({
      name: meetingName,
      privacy: 'private',
      properties: {
        enable_transcription: true,
        max_participants: 10
      }
    });
    
    // Create token
    const token = await dailyService.createMeetingToken({
      room_name: meetingName,
      user_name: participantName,
      is_owner: isHost,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      enable_transcription: true
    });
    
    res.json({
      roomUrl: room.url,
      token: token.token
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Microservices Pattern
```javascript
// Separate service for Daily.co operations
class MeetingManagementService {
  constructor() {
    this.dailyService = new DailyService(process.env.DAILY_API_KEY);
  }
  
  async scheduleMeeting(meetingData) {
    // Validate meeting data
    const validatedData = this.validateMeetingData(meetingData);
    
    // Create room with appropriate configuration
    const roomConfig = this.buildRoomConfig(validatedData);
    const room = await this.dailyService.createRoom(roomConfig);
    
    // Store meeting metadata in database
    await this.storeMeetingData({
      ...validatedData,
      roomName: room.name,
      roomUrl: room.url
    });
    
    return room;
  }
  
  async generateParticipantToken(meetingId, participantData) {
    const meeting = await this.getMeetingById(meetingId);
    
    const tokenConfig = {
      room_name: meeting.roomName,
      user_name: participantData.name,
      user_id: participantData.id,
      is_owner: participantData.role === 'host',
      exp: meeting.endTime,
      enable_transcription: meeting.transcriptionEnabled
    };
    
    return await this.dailyService.createMeetingToken(tokenConfig);
  }
}
```

### Event-Driven Architecture
```javascript
// Using webhooks for real-time updates
app.post('/webhooks/daily', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'room.created':
      console.log('Room created:', event.data.name);
      break;
      
    case 'meeting.started':
      console.log('Meeting started in room:', event.data.room);
      // Update meeting status in database
      break;
      
    case 'meeting.ended':
      console.log('Meeting ended in room:', event.data.room);
      // Process meeting data, send notifications
      break;
      
    case 'transcription.started':
      console.log('Transcription started for room:', event.data.room);
      break;
      
    case 'transcription.stopped':
      console.log('Transcription stopped for room:', event.data.room);
      // Process transcription data
      break;
  }
  
  res.status(200).send('OK');
});
```

This comprehensive overview provides the foundation for integrating Daily.co's REST API into backend systems, with emphasis on reliability, security, and scalability patterns suitable for production environments.