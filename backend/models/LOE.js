const mongoose = require('mongoose');
const crypto = require('crypto');

const loeSchema = new mongoose.Schema({
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
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  
  // Secure access token for client
  accessToken: {
    type: String,
    unique: true,
    index: true
  },
  
  // LOE Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'signed', 'expired'],
    default: 'draft'
  },
  
  // LOE Content
  content: {
    // Services to be provided
    services: {
      financialPlanning: { type: Boolean, default: true },
      investmentAdvisory: { type: Boolean, default: true },
      brokerageServices: { type: Boolean, default: true },
      riskManagement: { type: Boolean, default: true }
    },
    
    // Fee structure
    fees: {
      planningFee: { type: String, default: '$5,000' },
      advisoryFeePercent: { type: String, default: '1%' },
      advisoryFeeThreshold: { type: String, default: '$1,000,000' },
      advisoryFeeReducedPercent: { type: String, default: '0.75%' }
    },
    
    // Custom notes from advisor
    customNotes: {
      type: String,
      maxlength: 1000
    },
    
    // Specific focus areas from meeting
    focusAreas: [{
      type: String
    }]
  },
  
  // E-Signature Data
  signatures: {
    client: {
      data: String, // Base64 encoded signature image
      timestamp: Date,
      ipAddress: String,
      userAgent: String
    }
  },
  
  // Tracking timestamps
  sentAt: Date,
  viewedAt: Date,
  signedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      // Expires 7 days from creation
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Generated PDF URL after signing
  signedPdfUrl: String,
  
  // Email tracking
  emailsSent: [{
    type: { type: String, enum: ['initial', 'reminder', 'signed'] },
    sentAt: Date,
    sentTo: String
  }]
}, {
  timestamps: true
});

// Generate unique access token before saving
loeSchema.pre('save', function(next) {
  if (!this.accessToken) {
    this.accessToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Virtual for checking if LOE is expired
loeSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date() && this.status !== 'signed';
});

// Virtual for generating client access URL
loeSchema.virtual('clientAccessUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/loe/sign/${this.accessToken}`;
});

// Instance method to mark as sent
loeSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  this.emailsSent.push({
    type: 'initial',
    sentAt: new Date(),
    sentTo: this.clientId
  });
  return this.save();
};

// Instance method to mark as viewed
loeSchema.methods.markAsViewed = function(ipAddress, userAgent) {
  if (!this.viewedAt) {
    this.status = 'viewed';
    this.viewedAt = new Date();
  }
  return this.save();
};

// Instance method to save signature
loeSchema.methods.saveSignature = function(signatureData, ipAddress, userAgent) {
  this.signatures.client = {
    data: signatureData,
    timestamp: new Date(),
    ipAddress: ipAddress,
    userAgent: userAgent
  };
  this.status = 'signed';
  this.signedAt = new Date();
  return this.save();
};

// Static method to find pending LOEs
loeSchema.statics.findPending = async function(advisorId) {
  return this.find({
    advisorId,
    status: { $in: ['sent', 'viewed'] },
    expiresAt: { $gt: new Date() }
  })
    .populate('clientId', 'firstName lastName email')
    .populate('meetingId', 'scheduledAt')
    .sort({ createdAt: -1 });
};

// Static method to find by access token
loeSchema.statics.findByToken = async function(token) {
  return this.findOne({ 
    accessToken: token,
    expiresAt: { $gt: new Date() }
  })
    .populate('advisorId', 'firstName lastName firmName email phone')
    .populate('clientId', 'firstName lastName email');
};

module.exports = mongoose.model('LOE', loeSchema);