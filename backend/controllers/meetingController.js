const axios = require('axios');
const Meeting = require('../models/Meeting');
const Client = require('../models/Client');
const { logger } = require('../utils/logger');

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

// Create a new meeting room
exports.createMeeting = async (req, res) => {
  const requestId = `MEETING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('📅 [MeetingController] Creating new meeting', {
      requestId,
      advisorId: req.advisor?.id,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { clientId, scheduledAt, meetingType = 'scheduled' } = req.body;
    const advisorId = req.advisor.id;

    // Validate required fields
    if (!clientId) {
      logger.warn('❌ [MeetingController] Missing clientId', { requestId });
      return res.status(400).json({ 
        success: false,
        error: 'Client ID is required' 
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      logger.warn('❌ [MeetingController] Client not found or unauthorized', {
        requestId,
        clientId,
        advisorId
      });
      return res.status(404).json({ 
        success: false,
        error: 'Client not found or unauthorized access' 
      });
    }

    logger.info('✅ [MeetingController] Client verified', {
      requestId,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email
    });

    // Generate unique room name
    const timestamp = Date.now();
    const roomName = `meeting-${advisorId}-${clientId}-${timestamp}`;

    logger.info('🏠 [MeetingController] Creating Daily.co room', {
      requestId,
      roomName,
      dailyApiKey: DAILY_API_KEY ? 'Present' : 'Missing'
    });

    // Create Daily.co room with transcription support (paid plan)
    const roomResponse = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 5,
          exp: Math.floor(Date.now() / 1000) + 86400, // 24 hour expiry
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          // Enable transcription for paid plan
          enable_transcription: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('✅ [MeetingController] Daily.co room created', {
      requestId,
      roomUrl: roomResponse.data.url,
      dailyRoomId: roomResponse.data.id
    });

    // Create meeting tokens
    const tokens = await createMeetingTokens(roomName, advisorId, clientId, client, requestId);

    // Parse scheduledAt if provided
    let meetingScheduledAt = new Date();
    if (scheduledAt) {
      meetingScheduledAt = new Date(scheduledAt);
      if (isNaN(meetingScheduledAt.getTime())) {
        logger.warn('⚠️ [MeetingController] Invalid scheduledAt date, using current time', {
          requestId,
          providedDate: scheduledAt
        });
        meetingScheduledAt = new Date();
      }
    }

    // Save meeting to database
    const meeting = new Meeting({
      advisorId,
      clientId,
      roomName,
      roomUrl: roomResponse.data.url,
      dailyRoomId: roomResponse.data.id,
      scheduledAt: meetingScheduledAt,
      meetingType,
      tokens: {
        advisorToken: tokens.advisorToken,
        clientToken: tokens.clientToken
      }
    });

    await meeting.save();

    // Populate client data for response
    await meeting.populate('clientId', 'firstName lastName email');

    logger.info('✅ [MeetingController] Meeting created successfully', {
      requestId,
      meetingId: meeting._id,
      roomUrl: meeting.roomUrl,
      clientMeetingLink: meeting.clientMeetingLink
    });

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        status: meeting.status,
        meetingType: meeting.meetingType,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        advisorMeetingLink: meeting.advisorMeetingLink
      },
      tokens: {
        advisorToken: tokens.advisorToken,
        clientToken: tokens.clientToken
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error creating meeting', {
      requestId,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      dailyApiResponse: error.response?.data
    });

    // Handle Daily.co API errors specifically
    if (error.response?.status) {
      return res.status(error.response.status).json({
        success: false,
        error: 'Failed to create meeting room',
        details: error.response.data
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create meeting',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create instant meeting
exports.createInstantMeeting = async (req, res) => {
  const requestId = `INSTANT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('⚡ [MeetingController] Creating instant meeting', {
      requestId,
      advisorId: req.advisor?.id,
      body: req.body
    });

    // Add meetingType and current time
    req.body.meetingType = 'instant';
    req.body.scheduledAt = new Date().toISOString();

    // Use the regular createMeeting function
    return await exports.createMeeting(req, res);

  } catch (error) {
    logger.error('❌ [MeetingController] Error creating instant meeting', {
      requestId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to create instant meeting' 
    });
  }
};

// Get meetings for advisor
exports.getAdvisorMeetings = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { limit = 20, status, type } = req.query;

    logger.info('📋 [MeetingController] Fetching advisor meetings', {
      advisorId,
      limit,
      status,
      type
    });

    let query = { advisorId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.meetingType = type;
    }

    const meetings = await Meeting.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    logger.info('✅ [MeetingController] Meetings fetched successfully', {
      advisorId,
      meetingsCount: meetings.length
    });

    res.json({
      success: true,
      meetings: meetings.map(meeting => ({
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration,
        status: meeting.status,
        meetingType: meeting.meetingType,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        advisorMeetingLink: meeting.advisorMeetingLink,
        createdAt: meeting.createdAt
      }))
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error fetching meetings', {
      advisorId: req.advisor?.id,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch meetings' 
    });
  }
};

// Get specific meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    logger.info('🔍 [MeetingController] Fetching meeting by ID', {
      meetingId,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    }).populate('clientId', 'firstName lastName email');

    if (!meeting) {
      logger.warn('❌ [MeetingController] Meeting not found', {
        meetingId,
        advisorId
      });
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    logger.info('✅ [MeetingController] Meeting found', {
      meetingId,
      roomName: meeting.roomName,
      status: meeting.status
    });

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration,
        status: meeting.status,
        meetingType: meeting.meetingType,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        advisorMeetingLink: meeting.advisorMeetingLink,
        transcript: meeting.transcript,
        notes: meeting.notes,
        createdAt: meeting.createdAt
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error fetching meeting', {
      meetingId: req.params.meetingId,
      advisorId: req.advisor?.id,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch meeting' 
    });
  }
};

// Start transcription for a meeting
exports.startTranscription = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const transcriptionData = req.body;
    const advisorId = req.advisor.id;

    logger.info('🎙️ [MeetingController] Starting transcription', {
      meetingId,
      advisorId,
      instanceId: transcriptionData.instanceId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    await meeting.startTranscription({
      ...transcriptionData,
      startedBy: transcriptionData.startedBy || advisorId
    });

    logger.info('✅ [MeetingController] Transcription started', {
      meetingId,
      instanceId: transcriptionData.instanceId,
      status: meeting.transcript.status
    });

    res.json({ 
      success: true,
      message: 'Transcription started successfully',
      transcript: {
        status: meeting.transcript.status,
        instanceId: meeting.transcript.instanceId,
        startedAt: meeting.transcript.startedAt
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error starting transcription', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to start transcription' 
    });
  }
};

// Stop transcription for a meeting
exports.stopTranscription = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { stoppedBy } = req.body;
    const advisorId = req.advisor.id;

    logger.info('🛑 [MeetingController] Stopping transcription', {
      meetingId,
      advisorId,
      stoppedBy
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    await meeting.stopTranscription(stoppedBy || advisorId);
    
    // Compile final transcript
    const finalTranscript = meeting.compileFinalTranscript();

    logger.info('✅ [MeetingController] Transcription stopped', {
      meetingId,
      finalTranscriptLength: finalTranscript.length,
      messageCount: meeting.transcript.realTimeMessages.length
    });

    res.json({ 
      success: true,
      message: 'Transcription stopped successfully',
      transcript: {
        status: meeting.transcript.status,
        stoppedAt: meeting.transcript.stoppedAt,
        messageCount: meeting.transcript.realTimeMessages.length,
        finalTranscriptLength: finalTranscript.length
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error stopping transcription', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to stop transcription' 
    });
  }
};

// Save transcript message (for real-time transcription)
exports.saveTranscriptMessage = async (req, res) => {
  try {
    const { meetingId, participantId, participantName, text, timestamp, isFinal, confidence, instanceId } = req.body;
    
    logger.info('📝 [MeetingController] Saving transcript message', {
      meetingId,
      participantName,
      textLength: text?.length,
      isFinal,
      instanceId
    });

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    await meeting.addTranscriptMessage({
      participantId,
      participantName,
      text,
      timestamp: timestamp || new Date(),
      isFinal: isFinal || false,
      confidence,
      instanceId
    });

    logger.info('✅ [MeetingController] Transcript message saved', {
      meetingId,
      messagesCount: meeting.transcript.realTimeMessages.length,
      speakersCount: meeting.transcript.speakers.length
    });

    res.json({ 
      success: true,
      message: 'Transcript message saved successfully',
      stats: {
        totalMessages: meeting.transcript.realTimeMessages.length,
        speakersCount: meeting.transcript.speakers.length
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error saving transcript', {
      meetingId: req.body.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to save transcript message' 
    });
  }
};

// Get meeting transcript
exports.getMeetingTranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    logger.info('📄 [MeetingController] Getting meeting transcript', {
      meetingId,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    }).populate('clientId', 'firstName lastName email');

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    // Compile final transcript if not already done
    if (!meeting.transcript.finalTranscript && meeting.transcript.realTimeMessages.length > 0) {
      meeting.compileFinalTranscript();
      await meeting.save();
    }

    logger.info('✅ [MeetingController] Transcript retrieved', {
      meetingId,
      transcriptStatus: meeting.transcript.status,
      messageCount: meeting.transcript.realTimeMessages.length,
      finalTranscriptLength: meeting.transcript.finalTranscript?.length || 0
    });

    res.json({ 
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration,
        client: meeting.clientId
      },
      transcript: meeting.transcript
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error getting transcript', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to get meeting transcript' 
    });
  }
};

// Generate AI summary for meeting transcript
exports.generateTranscriptSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    logger.info('🤖 [MeetingController] Generating transcript summary', {
      meetingId,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    if (!meeting.transcript.finalTranscript) {
      return res.status(400).json({ 
        success: false,
        error: 'No transcript available for summary' 
      });
    }

    // TODO: Integrate with Claude AI for transcript summarization
    // For now, return a placeholder structure
    const mockSummary = {
      keyPoints: [
        "Discussed financial goals and investment strategy",
        "Reviewed current portfolio performance",
        "Addressed concerns about market volatility"
      ],
      actionItems: [
        "Follow up with detailed portfolio analysis",
        "Schedule next quarterly review",
        "Send recommended reading materials"
      ],
      decisions: [
        "Agreed to increase monthly investment contribution",
        "Decided to rebalance portfolio allocation"
      ]
    };

    await meeting.addAISummary(mockSummary);

    logger.info('✅ [MeetingController] AI summary generated', {
      meetingId,
      keyPointsCount: mockSummary.keyPoints.length,
      actionItemsCount: mockSummary.actionItems.length
    });

    res.json({ 
      success: true,
      summary: meeting.transcript.summary
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error generating summary', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to generate transcript summary' 
    });
  }
};

// Update meeting status
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;
    const advisorId = req.advisor.id;

    logger.info('🔄 [MeetingController] Updating meeting status', {
      meetingId,
      newStatus: status,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    // Update status based on the new status
    if (status === 'active') {
      await meeting.markAsStarted();
    } else if (status === 'completed') {
      await meeting.markAsCompleted();
    } else {
      meeting.status = status;
      await meeting.save();
    }

    logger.info('✅ [MeetingController] Meeting status updated', {
      meetingId,
      oldStatus: meeting.status,
      newStatus: status
    });

    res.json({ 
      success: true,
      meeting: {
        id: meeting._id,
        status: meeting.status,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error updating meeting status', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to update meeting status' 
    });
  }
};

// Helper function to create meeting tokens
const createMeetingTokens = async (roomName, advisorId, clientId, client, requestId) => {
  try {
    logger.info('🔑 [MeetingController] Creating meeting tokens', {
      requestId,
      roomName,
      advisorId,
      clientId
    });

    // Create advisor token (free tier compatible)
    const advisorTokenResponse = await axios.post(
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
    const clientTokenResponse = await axios.post(
      'https://api.daily.co/v1/meeting-tokens',
      {
        properties: {
          room_name: roomName,
          user_name: `${client.firstName} ${client.lastName}`,
          user_id: clientId,
          is_owner: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('✅ [MeetingController] Meeting tokens created successfully', {
      requestId,
      hasAdvisorToken: !!advisorTokenResponse.data.token,
      hasClientToken: !!clientTokenResponse.data.token
    });

    return {
      advisorToken: advisorTokenResponse.data.token,
      clientToken: clientTokenResponse.data.token
    };

  } catch (error) {
    logger.error('❌ [MeetingController] Error creating meeting tokens', {
      requestId,
      error: error.message,
      dailyApiResponse: error.response?.data
    });
    throw error;
  }
};

module.exports = exports;