const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isMentor: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  teachingSkills: [String],
  walletBalance: { type: Number, default: 100 },
  escrowBalance: { type: Number, default: 0 },
  trustScore: { type: Number, default: 75 },
  lastDailyReward: { type: Date, default: null },
  notifications: [
    {
      message: String,
      type: { type: String, default: 'info' }, // info, success, warning, error
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
