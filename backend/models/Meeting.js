const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const meetingSchema = new mongoose.Schema({
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
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
  dailyRoomId: {
    type: String,
    required: true
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  meetingType: {
    type: String,
    enum: ['scheduled', 'instant'],
    default: 'scheduled'
  },
  tokens: {
    advisorToken: String,
    clientToken: String
  },
  participants: [{
    userId: String,
    userName: String,
    userType: {
      type: String,
      enum: ['advisor', 'client']
    },
    joinTime: Date,
    leaveTime: Date
  }],
  transcript: {
    status: {
      type: String,
      enum: ['not_started', 'active', 'completed', 'error'],
      default: 'not_started'
    },
    instanceId: String, // Daily.co transcription instance ID
    startedAt: Date,
    stoppedAt: Date,
    startedBy: String, // session_id of who started transcription
    language: {
      type: String,
      default: 'en'
    },
    model: {
      type: String,
      default: 'nova-2-general'
    },
    realTimeMessages: [{
      timestamp: Date,
      participantId: String,
      participantName: String,
      text: String,
      isFinal: Boolean,
      confidence: Number,
      instanceId: String,
      messageId: String // unique identifier for each message
    }],
    finalTranscript: String,
    speakers: [{
      participantId: String,
      participantName: String,
      totalSpeakingTime: Number, // in seconds
      messageCount: Number
    }],
    summary: {
      keyPoints: [String],
      actionItems: [String],
      decisions: [String],
      aiGenerated: Boolean,
      generatedAt: Date
    },
    settings: {
      profanityFilter: Boolean,
      punctuate: Boolean,
      includeRawResponse: Boolean
    }
  },
  recording: {
    status: {
      type: String,
      enum: ['not_started', 'active', 'completed', 'error'],
      default: 'not_started'
    },
    recordingId: String, // Daily.co recording ID
    startedAt: Date,
    stoppedAt: Date,
    startedBy: String,
    layout: String,
    downloadUrl: String,
    duration: Number, // in seconds
    fileSize: Number, // in bytes
    settings: {
      recordVideo: {
        type: Boolean,
        default: true
      },
      recordAudio: {
        type: Boolean,
        default: true
      },
      recordScreen: {
        type: Boolean,
        default: false
      }
    }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better query performance
meetingSchema.index({ advisorId: 1, createdAt: -1 });
meetingSchema.index({ clientId: 1, createdAt: -1 });
meetingSchema.index({ status: 1, scheduledAt: 1 });

// Virtual for meeting link with client token
meetingSchema.virtual('clientMeetingLink').get(function() {
  if (this.roomUrl && this.tokens?.clientToken) {
    return `${this.roomUrl}?t=${this.tokens.clientToken}`;
  }
  return this.roomUrl;
});

// Virtual for advisor meeting link
meetingSchema.virtual('advisorMeetingLink').get(function() {
  if (this.roomUrl && this.tokens?.advisorToken) {
    return `${this.roomUrl}?t=${this.tokens.advisorToken}`;
  }
  return this.roomUrl;
});

// Method to mark meeting as started
meetingSchema.methods.markAsStarted = function() {
  this.status = 'active';
  this.startedAt = new Date();
  return this.save();
};

// Method to mark meeting as completed
meetingSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.endedAt = new Date();
  if (this.startedAt) {
    this.duration = Math.round((this.endedAt - this.startedAt) / (1000 * 60)); // minutes
  }
  return this.save();
};

// Method to start transcription
meetingSchema.methods.startTranscription = function(transcriptionData) {
  this.transcript.status = 'active';
  this.transcript.instanceId = transcriptionData.instanceId;
  this.transcript.startedAt = new Date();
  this.transcript.startedBy = transcriptionData.startedBy;
  this.transcript.language = transcriptionData.language || 'en';
  this.transcript.model = transcriptionData.model || 'nova-2-general';
  this.transcript.settings = {
    profanityFilter: transcriptionData.profanityFilter || false,
    punctuate: transcriptionData.punctuate || true,
    includeRawResponse: transcriptionData.includeRawResponse || false
  };
  return this.save();
};

// Method to stop transcription
meetingSchema.methods.stopTranscription = function(stoppedBy) {
  this.transcript.status = 'completed';
  this.transcript.stoppedAt = new Date();
  this.transcript.updatedBy = stoppedBy;
  return this.save();
};

// Method to add transcript message
meetingSchema.methods.addTranscriptMessage = function(messageData) {
  const messageId = `${messageData.participantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message = {
    timestamp: messageData.timestamp || new Date(),
    participantId: messageData.participantId,
    participantName: messageData.participantName,
    text: messageData.text,
    isFinal: messageData.isFinal || false,
    confidence: messageData.confidence,
    instanceId: messageData.instanceId,
    messageId: messageId
  };

  this.transcript.realTimeMessages.push(message);
  
  // Update speaker statistics
  this.updateSpeakerStats(messageData.participantId, messageData.participantName, messageData.text);
  
  return this.save();
};

// Method to update speaker statistics
meetingSchema.methods.updateSpeakerStats = function(participantId, participantName, text) {
  let speaker = this.transcript.speakers.find(s => s.participantId === participantId);
  
  if (!speaker) {
    speaker = {
      participantId: participantId,
      participantName: participantName,
      totalSpeakingTime: 0,
      messageCount: 0
    };
    this.transcript.speakers.push(speaker);
  }
  
  speaker.messageCount += 1;
  // Estimate speaking time based on text length (rough estimate: ~150 words per minute)
  const wordCount = text.split(' ').length;
  const estimatedTime = (wordCount / 150) * 60; // in seconds
  speaker.totalSpeakingTime += estimatedTime;
};

// Method to compile final transcript
meetingSchema.methods.compileFinalTranscript = function() {
  const finalMessages = this.transcript.realTimeMessages
    .filter(msg => msg.isFinal)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let transcript = '';
  let currentSpeaker = '';
  
  finalMessages.forEach(msg => {
    if (msg.participantName !== currentSpeaker) {
      transcript += `\n\n${msg.participantName}:\n`;
      currentSpeaker = msg.participantName;
    }
    transcript += `${msg.text} `;
  });
  
  this.transcript.finalTranscript = transcript.trim();
  return transcript;
};

// Method to add AI-generated summary
meetingSchema.methods.addAISummary = function(summaryData) {
  this.transcript.summary = {
    keyPoints: summaryData.keyPoints || [],
    actionItems: summaryData.actionItems || [],
    decisions: summaryData.decisions || [],
    aiGenerated: true,
    generatedAt: new Date()
  };
  return this.save();
};

// Method to start recording
meetingSchema.methods.startRecording = function(recordingData) {
  this.recording.status = 'active';
  this.recording.recordingId = recordingData.recordingId;
  this.recording.startedAt = new Date();
  this.recording.startedBy = recordingData.startedBy;
  this.recording.layout = recordingData.layout || 'default';
  this.recording.settings = {
    recordVideo: recordingData.recordVideo !== false,
    recordAudio: recordingData.recordAudio !== false,
    recordScreen: recordingData.recordScreen || false
  };
  return this.save();
};

// Method to stop recording
meetingSchema.methods.stopRecording = function(stoppedBy) {
  this.recording.status = 'completed';
  this.recording.stoppedAt = new Date();
  this.recording.stoppedBy = stoppedBy;
  if (this.recording.startedAt) {
    this.recording.duration = Math.round((this.recording.stoppedAt - this.recording.startedAt) / 1000); // seconds
  }
  return this.save();
};

// Method to update recording with download info
meetingSchema.methods.updateRecordingInfo = function(recordingInfo) {
  this.recording.downloadUrl = recordingInfo.downloadUrl;
  this.recording.fileSize = recordingInfo.fileSize;
  this.recording.duration = recordingInfo.duration;
  return this.save();
};

// Static method to find meetings by advisor
meetingSchema.statics.findByAdvisor = function(advisorId, limit = 20) {
  return this.find({ advisorId })
    .populate('clientId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find upcoming meetings
meetingSchema.statics.findUpcoming = function(advisorId) {
  const now = new Date();
  return this.find({
    advisorId,
    scheduledAt: { $gte: now },
    status: { $in: ['scheduled', 'active'] }
  })
    .populate('clientId', 'firstName lastName email')
    .sort({ scheduledAt: 1 });
};

// Pre-save middleware for logging
meetingSchema.pre('save', function(next) {
  if (this.isNew) {
    logger.info('Creating new meeting', {
      meetingId: this._id,
      advisorId: this.advisorId,
      clientId: this.clientId,
      roomName: this.roomName,
      meetingType: this.meetingType,
      scheduledAt: this.scheduledAt
    });
  }
  next();
});

// Post-save middleware for logging
meetingSchema.post('save', function(doc) {
  if (doc.isNew) {
    logger.info('Meeting saved successfully', {
      meetingId: doc._id,
      status: doc.status,
      roomUrl: doc.roomUrl
    });
  }
});

// Ensure virtual fields are included in JSON output
meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;