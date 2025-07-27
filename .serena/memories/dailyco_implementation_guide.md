# Daily.co Implementation Guide for RicheAI Platform

## Project Integration Plan

### Phase 1: Video Meetings (1-2 weeks)
1. **Setup Daily.co Account & API**
2. **Backend Implementation**
3. **Frontend Components**
4. **Basic Meeting Functionality**

### Phase 2: Transcription (1 week)
1. **Real-time Transcription**
2. **Transcript Storage**
3. **Dashboard Integration**

## Step-by-Step Implementation

### 1. Daily.co Account Setup

#### Free Tier Setup
- Go to https://dashboard.daily.co/signup
- Sign up for free account (10,000 participant minutes/month)
- Get API key from "Developers" → "API keys"
- Note your domain: `your-domain.daily.co`

#### Environment Configuration
```bash
# Add to backend/.env
DAILY_API_KEY=your_daily_api_key_here
DAILY_DOMAIN=https://your-domain.daily.co
DAILY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Package Installation

#### Backend
```bash
cd backend
npm install axios node-fetch
```

#### Frontend
```bash
cd frontend
npm install @daily-co/daily-js @daily-co/daily-react
```

### 3. Backend Implementation

#### Meeting Model
```javascript
// backend/models/Meeting.js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  roomUrl: {
    type: String,
    required: true
  },
  dailyRoomId: String,
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  recording: {
    url: String,
    duration: Number,
    startedAt: Date
  },
  transcript: {
    realTimeMessages: [{
      timestamp: Date,
      participantId: String,
      participantName: String,
      text: String,
      isFinal: Boolean
    }],
    finalTranscript: String,
    summary: {
      keyPoints: [String],
      actionItems: [String],
      decisions: [String]
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
```

#### Meeting Controller
```javascript
// backend/controllers/meetingController.js
const axios = require('axios');
const Meeting = require('../models/Meeting');
const Client = require('../models/Client');

const DAILY_API_KEY = process.env.DAILY_API_KEY;

exports.createMeeting = async (req, res) => {
  try {
    const { clientId, scheduledAt } = req.body;
    const advisorId = req.advisor.id;

    // Verify client
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Generate room name
    const roomName = `meeting-${advisorId}-${clientId}-${Date.now()}`;

    // Create Daily.co room
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        privacy: 'private',
        properties: {
          enable_recording: 'cloud',
          enable_transcription: true,
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + 86400 // 24 hour expiry
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save meeting
    const meeting = new Meeting({
      advisorId,
      clientId,
      roomName,
      roomUrl: response.data.url,
      dailyRoomId: response.data.id,
      scheduledAt: scheduledAt || new Date()
    });

    await meeting.save();

    // Create meeting tokens
    const tokens = await createMeetingTokens(roomName, advisorId, clientId);

    res.json({
      meeting: meeting,
      tokens: tokens
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
};

const createMeetingTokens = async (roomName, advisorId, clientId) => {
  // Create advisor token
  const advisorToken = await axios.post(
    'https://api.daily.co/v1/meeting-tokens',
    {
      properties: {
        room_name: roomName,
        user_name: 'Advisor',
        user_id: advisorId,
        is_owner: true
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Create client token
  const clientToken = await axios.post(
    'https://api.daily.co/v1/meeting-tokens',
    {
      properties: {
        room_name: roomName,
        user_name: 'Client',
        user_id: clientId
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    advisorToken: advisorToken.data.token,
    clientToken: clientToken.data.token
  };
};

// Handle transcription messages (no webhooks needed)
exports.saveTranscriptMessage = async (req, res) => {
  try {
    const { meetingId, participantId, participantName, text, timestamp, isFinal } = req.body;
    
    await Meeting.findByIdAndUpdate(meetingId, {
      $push: {
        'transcript.realTimeMessages': {
          participantId,
          participantName,
          text,
          timestamp: new Date(timestamp),
          isFinal
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving transcript:', error);
    res.status(500).json({ error: 'Failed to save transcript' });
  }
};

exports.getAdvisorMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ advisorId: req.advisor.id })
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};
```

#### Meeting Routes
```javascript
// backend/routes/meetings.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

router.use(auth);

router.post('/create', meetingController.createMeeting);
router.get('/advisor', meetingController.getAdvisorMeetings);
router.get('/:meetingId', meetingController.getMeetingById);
router.post('/transcript/message', meetingController.saveTranscriptMessage);

module.exports = router;
```

### 4. Frontend Implementation

#### API Service
```javascript
// frontend/src/services/api.js - Add meeting endpoints
export const meetingAPI = {
  createMeeting: async (clientId, scheduledAt) => {
    const response = await api.post('/meetings/create', { clientId, scheduledAt });
    return response.data;
  },
  
  getAdvisorMeetings: async () => {
    const response = await api.get('/meetings/advisor');
    return response.data;
  },
  
  saveTranscriptMessage: async (transcriptData) => {
    const response = await api.post('/meetings/transcript/message', transcriptData);
    return response.data;
  }
};
```

#### Meeting Scheduler Component
```jsx
// frontend/src/components/meetings/MeetingScheduler.jsx
import React, { useState } from 'react';
import { Box, Button, Dialog, TextField, MenuItem, Typography } from '@mui/material';
import { meetingAPI } from '../../services/api';

const MeetingScheduler = ({ clients, onMeetingCreated }) => {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      const result = await meetingAPI.createMeeting(selectedClient, scheduledAt);
      
      // Copy client meeting link
      const clientLink = `${result.meeting.roomUrl}?t=${result.tokens.clientToken}`;
      await navigator.clipboard.writeText(clientLink);
      
      alert('Meeting created! Client link copied to clipboard.');
      onMeetingCreated(result.meeting);
      setOpen(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Schedule Meeting
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Schedule Meeting
          </Typography>
          
          <TextField
            select
            fullWidth
            label="Select Client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            margin="normal"
          >
            {clients.map(client => (
              <MenuItem key={client._id} value={client._id}>
                {client.firstName} {client.lastName}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            type="datetime-local"
            label="Scheduled Time"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          <Box mt={2} display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateMeeting}
              disabled={!selectedClient || loading}
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default MeetingScheduler;
```

#### Meeting Room Component with Transcription
```jsx
// frontend/src/components/meetings/MeetingRoom.jsx
import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Box, Paper, Typography, Switch, Button } from '@mui/material';
import { meetingAPI } from '../../services/api';

const MeetingRoom = ({ roomUrl, token, meetingId }) => {
  const callFrameRef = useRef(null);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const callFrame = useRef(null);

  useEffect(() => {
    callFrame.current = DailyIframe.createFrame(callFrameRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0'
      },
      showLeaveButton: true,
      showFullscreenButton: true
    });

    // Set up event listeners
    callFrame.current
      .on('app-message', handleTranscriptionMessage)
      .on('transcription-started', () => setIsTranscribing(true))
      .on('transcription-stopped', () => setIsTranscribing(false))
      .on('left-meeting', handleMeetingLeft);

    // Join the meeting
    callFrame.current.join({ url: roomUrl, token });

    return () => {
      if (callFrame.current) {
        callFrame.current.leave();
        callFrame.current.destroy();
      }
    };
  }, [roomUrl, token]);

  const handleTranscriptionMessage = (event) => {
    if (event.fromId === 'transcription') {
      const { data } = event;
      
      setTranscriptMessages(prev => {
        // Update existing message if not final, or add new message
        const existingIndex = prev.findIndex(
          msg => msg.participantId === data.participantId && !msg.is_final
        );
        
        if (existingIndex >= 0 && !data.is_final) {
          // Update existing interim message
          const updated = [...prev];
          updated[existingIndex] = {
            ...data,
            timestamp: Date.now()
          };
          return updated;
        } else {
          // Add new message
          return [...prev, {
            ...data,
            timestamp: Date.now()
          }].slice(-50); // Keep last 50 messages
        }
      });

      // Save final messages to backend
      if (data.is_final) {
        saveTranscriptionMessage(meetingId, data);
      }
    }
  };

  const saveTranscriptionMessage = async (meetingId, transcriptionData) => {
    try {
      await meetingAPI.saveTranscriptMessage({
        meetingId,
        participantId: transcriptionData.participantId,
        participantName: transcriptionData.participantName || 'Unknown',
        text: transcriptionData.text,
        timestamp: new Date(),
        isFinal: transcriptionData.is_final
      });
    } catch (error) {
      console.error('Error saving transcription:', error);
    }
  };

  const startTranscription = async () => {
    try {
      await callFrame.current.startTranscription({
        punctuate: true,
        endpointing: true
      });
    } catch (error) {
      console.error('Error starting transcription:', error);
    }
  };

  const stopTranscription = async () => {
    try {
      await callFrame.current.stopTranscription();
    } catch (error) {
      console.error('Error stopping transcription:', error);
    }
  };

  return (
    <Box display="flex" height="600px">
      {/* Video Area */}
      <Box flex={2} ref={callFrameRef} />
      
      {/* Transcription Panel */}
      {showTranscript && (
        <Box flex={1} ml={2}>
          <Paper elevation={3} sx={{ height: '100%', p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Live Transcript</Typography>
              <Box>
                <Button
                  size="small"
                  onClick={isTranscribing ? stopTranscription : startTranscription}
                  variant={isTranscribing ? "outlined" : "contained"}
                  sx={{ mr: 1 }}
                >
                  {isTranscribing ? 'Stop' : 'Start'} Transcription
                </Button>
                <Switch 
                  checked={showTranscript} 
                  onChange={(e) => setShowTranscript(e.target.checked)} 
                />
              </Box>
            </Box>
            
            <Box 
              sx={{ 
                height: 'calc(100% - 80px)', 
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 1
              }}
            >
              {transcriptMessages.map((msg, index) => (
                <Box key={index} mb={1}>
                  <Typography variant="caption" color="textSecondary">
                    {msg.participantName || 'Unknown'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontStyle: msg.is_final ? 'normal' : 'italic',
                      opacity: msg.is_final ? 1 : 0.7
                    }}
                  >
                    {msg.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default MeetingRoom;
```

### 5. Dashboard Integration

#### Add Meetings Section
```jsx
// In frontend/src/components/Dashboard.jsx
import MeetingScheduler from './meetings/MeetingScheduler';

// Add to dashboard
<Card>
  <CardContent>
    <Typography variant="h6">Meetings</Typography>
    <MeetingScheduler 
      clients={clients} 
      onMeetingCreated={handleMeetingCreated} 
    />
    {/* Recent meetings list */}
  </CardContent>
</Card>
```

## Testing Strategy

### Development Testing
1. **Create Daily.co room**: Test room creation via API
2. **Join meeting**: Test joining with tokens
3. **Transcription**: Start/stop transcription and verify events
4. **Data flow**: Verify transcript messages save to database

### Production Checklist
1. **Environment variables**: Set production Daily.co credentials
2. **CORS configuration**: Allow Daily.co domains
3. **Webhook URLs**: Configure production webhook endpoints (if using paid plan)
4. **SSL certificates**: Ensure HTTPS for production
5. **Rate limiting**: Implement meeting creation limits
6. **Error monitoring**: Set up error tracking for video calls

## Deployment Notes

### Free Tier Limitations
- No webhooks (use client-side transcription events)
- 10,000 participant minutes/month
- Basic recording features

### Paid Tier Benefits
- Webhook support for server-side transcription
- Higher participant limits
- Advanced recording features
- Custom branding options

This implementation guide provides a complete foundation for adding video meetings with transcription to your RicheAI platform using Daily.co's infrastructure.