const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Session = require('../models/Session');

// Admin check middleware
const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isAdmin) return res.status(403).json({ message: 'Admin access only' });
  next();
};

// STATS
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalMentors, totalSessions, activeSessions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isMentor: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'active' })
    ]);
    const sessionBreakdown = await Session.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const recentActivity = await Session.find()
      .populate('mentor', 'name')
      .populate('learner', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ totalUsers, totalMentors, totalSessions, activeSessions, sessionBreakdown, recentActivity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ALL USERS
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ALL SESSIONS
router.get('/sessions', authMiddleware, adminOnly, async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('mentor', 'name email')
      .populate('learner', 'name email')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SET TRUST SCORE
router.patch('/trust/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { trustScore, reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.userId, { trustScore }, { new: true });
    if (reason) {
      user.notifications.push({ message: `Admin updated your trust score to ${trustScore}. Reason: ${reason}`, type: 'info' });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BAN / UNBAN USER
router.patch('/ban/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBanned = ban;
    if (ban) user.notifications.push({ message: `Your account has been suspended. Reason: ${reason || 'Policy violation'}`, type: 'error' });
    await user.save();
    res.json({ message: ban ? 'User banned' : 'User unbanned', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// WARN USER
router.post('/warn/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notifications.push({ message: `Warning from admin: ${message}`, type: 'warning' });
    await user.save();
    res.json({ message: 'Warning sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REFUND SESSION
router.post('/refund/:sessionId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'refunded') return res.status(400).json({ message: 'Already refunded' });

    const learner = await User.findById(session.learner);
    const mentor = await User.findById(session.mentor);
    if (!learner || !mentor) return res.status(404).json({ message: 'Users not found' });

    if (session.status === 'completed' || session.status === 'disputed') {
      // Deduct from mentor, refund to learner
      mentor.walletBalance = Math.max(0, mentor.walletBalance - session.tokenCost);
      learner.walletBalance += session.tokenCost;
      mentor.notifications.push({ message: `Admin issued refund for session (${session.skill}). ${session.tokenCost} tokens deducted.`, type: 'warning' });
    } else if (session.status === 'pending' || session.status === 'active') {
      // Return from escrow
      learner.walletBalance += session.tokenCost;
      learner.escrowBalance = Math.max(0, learner.escrowBalance - session.tokenCost);
    }

    learner.notifications.push({ message: `Refund of ${session.tokenCost} tokens issued by admin.`, type: 'success' });
    await learner.save();
    await mentor.save();

    session.status = 'refunded';
    await session.save();
    res.json({ message: 'Refund issued' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RESOLVE DISPUTE
router.post('/resolve-dispute/:sessionId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { resolution, refund } = req.body;
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'disputed') return res.status(400).json({ message: 'Session is not disputed' });

    session.disputeResolution = resolution;
    session.disputeResolvedBy = req.user.id;

    if (refund) {
      const learner = await User.findById(session.learner);
      const mentor = await User.findById(session.mentor);
      learner.walletBalance += session.tokenCost;
      mentor.walletBalance = Math.max(0, mentor.walletBalance - session.tokenCost);
      mentor.trustScore = Math.max(0, mentor.trustScore - 10);
      learner.notifications.push({ message: `Dispute resolved in your favour. ${session.tokenCost} tokens refunded.`, type: 'success' });
      mentor.notifications.push({ message: `Dispute resolved against you. Tokens refunded to learner. Trust score -10.`, type: 'error' });
      await learner.save();
      await mentor.save();
      session.status = 'refunded';
    } else {
      const learner = await User.findById(session.learner);
      // False dispute: penalise learner trust score slightly
      learner.trustScore = Math.max(0, learner.trustScore - 3);
      learner.notifications.push({ message: `Your dispute was reviewed. Outcome: ${resolution}. Trust score -3.`, type: 'info' });
      await learner.save();
      session.status = 'completed';
    }

    await session.save();
    res.json({ message: 'Dispute resolved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
