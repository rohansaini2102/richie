const mongoose = require('mongoose');

const abTestComparisonSchema = new mongoose.Schema({
  // References
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
  
  // Plans being compared
  planA: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialPlan',
      required: true
    },
    planType: {
      type: String,
      required: true
    },
    version: Number,
    createdAt: Date,
    snapshot: {
      keyMetrics: mongoose.Schema.Types.Mixed,
      summary: String
    }
  },
  
  planB: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialPlan',
      required: true
    },
    planType: {
      type: String,
      required: true
    },
    version: Number,
    createdAt: Date,
    snapshot: {
      keyMetrics: mongoose.Schema.Types.Mixed,
      summary: String
    }
  },
  
  // Comparison details
  comparisonType: {
    type: String,
    enum: ['goal_based', 'cash_flow', 'hybrid'],
    required: true
  },
  
  // AI Analysis
  aiAnalysis: {
    executiveSummary: String,
    keyDifferences: [{
      aspect: String,
      planAValue: mongoose.Schema.Types.Mixed,
      planBValue: mongoose.Schema.Types.Mixed,
      significance: String
    }],
    planAStrengths: [String],
    planAWeaknesses: [String],
    planBStrengths: [String],
    planBWeaknesses: [String],
    recommendation: {
      suggestedPlan: {
        type: String,
        enum: ['planA', 'planB', 'both_suitable', 'neither_suitable']
      },
      reasoning: String,
      confidenceScore: Number
    },
    riskComparison: {
      planARiskScore: Number,
      planBRiskScore: Number,
      riskFactors: [String]
    },
    implementationConsiderations: [String],
    analysisTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // User decision
  selectedWinner: {
    plan: {
      type: String,
      enum: ['planA', 'planB', 'none', 'both', 'neither']
    },
    reason: String,
    selectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advisor'
    },
    selectedAt: Date
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['analyzing', 'completed', 'error'],
    default: 'analyzing'
  },
  
  notes: String,
  
  tags: [String],
  
  // Performance tracking
  viewCount: {
    type: Number,
    default: 0
  },
  
  lastViewedAt: Date,
  
  // For tracking changes
  changeHistory: [{
    changeDate: Date,
    changedBy: mongoose.Schema.Types.ObjectId,
    changeType: String,
    description: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
abTestComparisonSchema.index({ clientId: 1, createdAt: -1 });
abTestComparisonSchema.index({ advisorId: 1, createdAt: -1 });
abTestComparisonSchema.index({ 'planA.planId': 1, 'planB.planId': 1 });
abTestComparisonSchema.index({ comparisonType: 1, createdAt: -1 });

// Virtual for comparison age
abTestComparisonSchema.virtual('comparisonAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to check if comparison is recent (within 30 days)
abTestComparisonSchema.methods.isRecent = function() {
  return this.comparisonAge <= 30;
};

// Static method to find comparisons for a client
abTestComparisonSchema.statics.findByClient = function(clientId, options = {}) {
  const query = this.find({ clientId });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query
    .sort({ createdAt: -1 })
    .populate('advisorId', 'name email')
    .populate('planA.planId', 'version status')
    .populate('planB.planId', 'version status');
};

// Static method to check if plans have been compared before
abTestComparisonSchema.statics.hasBeenCompared = async function(planId1, planId2) {
  const comparison = await this.findOne({
    $or: [
      { 'planA.planId': planId1, 'planB.planId': planId2 },
      { 'planA.planId': planId2, 'planB.planId': planId1 }
    ],
    status: 'completed'
  });
  
  return comparison;
};

module.exports = mongoose.model('ABTestComparison', abTestComparisonSchema);