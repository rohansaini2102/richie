const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');
const { logger } = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(auth);

// Create a scheduled meeting
router.post('/create', (req, res, next) => {
  logger.info('📅 [MeetingRoutes] Create meeting request received', {
    advisorId: req.advisor?.id,
    clientId: req.body?.clientId,
    scheduledAt: req.body?.scheduledAt,
    meetingType: req.body?.meetingType
  });
  next();
}, meetingController.createMeeting);

// Create an instant meeting
router.post('/instant', (req, res, next) => {
  logger.info('⚡ [MeetingRoutes] Instant meeting request received', {
    advisorId: req.advisor?.id,
    clientId: req.body?.clientId
  });
  next();
}, meetingController.createInstantMeeting);

// Get all meetings for the current advisor
router.get('/advisor', (req, res, next) => {
  logger.info('📋 [MeetingRoutes] Get advisor meetings request', {
    advisorId: req.advisor?.id,
    queryParams: req.query
  });
  next();
}, meetingController.getAdvisorMeetings);

// Get a specific meeting by ID
router.get('/:meetingId', (req, res, next) => {
  logger.info('🔍 [MeetingRoutes] Get meeting by ID request', {
    advisorId: req.advisor?.id,
    meetingId: req.params.meetingId
  });
  next();
}, meetingController.getMeetingById);

// Update meeting status
router.patch('/:meetingId/status', (req, res, next) => {
  logger.info('🔄 [MeetingRoutes] Update meeting status request', {
    advisorId: req.advisor?.id,
    meetingId: req.params.meetingId,
    newStatus: req.body?.status
  });
  next();
}, meetingController.updateMeetingStatus);

// Transcription management routes
router.post('/:meetingId/transcription/start', (req, res, next) => {
  logger.info('🎙️ [MeetingRoutes] Start transcription request', {
    advisorId: req.advisor?.id,
    meetingId: req.params.meetingId,
    instanceId: req.body?.instanceId
  });
  next();
}, meetingController.startTranscription);

router.post('/:meetingId/transcription/stop', (req, res, next) => {
  logger.info('🛑 [MeetingRoutes] Stop transcription request', {
    advisorId: req.advisor?.id,
    meetingId: req.params.meetingId,
    stoppedBy: req.body?.stoppedBy
  });
  next();
}, meetingController.stopTranscription);

router.get('/:meetingId/transcript', (req, res, next) => {
  logger.info('📄 [MeetingRoutes] Get transcript request', {
    advisorId: req.advisor?.id,
    meetingId: req.params.meetingId
  });
  next();
}, meetingController.getMeetingTranscript);

router.post('/:meetingId/transcript/summary', (req, res, next) => {
  logger.info('🤖 [MeetingRoutes] Generate transcript summary request', {
    advisorId: req.advisor?.id,
    meetingId: req.params.meetingId
  });
  next();
}, meetingController.generateTranscriptSummary);

// Save transcript message (for real-time transcription)
router.post('/transcript/message', (req, res, next) => {
  logger.info('📝 [MeetingRoutes] Save transcript message request', {
    advisorId: req.advisor?.id,
    meetingId: req.body?.meetingId,
    participantName: req.body?.participantName,
    isFinal: req.body?.isFinal
  });
  next();
}, meetingController.saveTranscriptMessage);

// Health check endpoint for meeting service
router.get('/health/check', (req, res) => {
  logger.info('🏥 [MeetingRoutes] Health check request');
  
  res.json({
    success: true,
    service: 'meetings',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dailyApiConfigured: !!process.env.DAILY_API_KEY
  });
});

module.exports = router;