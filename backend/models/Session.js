const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  tokenCost: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'refunded', 'disputed'],
    default: 'pending'
  },
  startedAt: Date,
  endedAt: Date,
  quizScore: Number,
  quizPassed: { type: Boolean, default: false },

  // RATINGS — both sides rate each other
  mentorRating: { type: Number, min: 1, max: 5 },   // learner rates mentor
  learnerRating: { type: Number, min: 1, max: 5 },  // mentor rates learner
  mentorReview: String,
  learnerReview: String,

  // DISPUTE system
  disputeReason: String,
  disputeRaisedBy: { type: String, enum: ['learner', 'mentor'] },
  disputeResolvedBy: String, // admin ID
  disputeResolution: String,

  // CERTIFICATE
  certificateIssued: { type: Boolean, default: false },
  certificateIssuedAt: Date,

  messages: [
    {
      sender: String,
      senderName: String,
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
