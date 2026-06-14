const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET BALANCE
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance escrowBalance trustScore');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD TOKENS (max 500 per top-up, max 1000 total)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (amount > 500) return res.status(400).json({ message: 'Maximum top-up is 500 tokens at once' });

    const user = await User.findById(req.user.id);
    const newBalance = user.walletBalance + amount;
    if (newBalance > 1000) return res.status(400).json({ message: 'Maximum wallet balance is 1000 tokens' });

    user.walletBalance = newBalance;
    await user.save();
    res.json({ walletBalance: user.walletBalance, message: `Added ${amount} tokens!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DAILY REWARD (50 tokens, once per 24h)
router.post('/daily-reward', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const lastReward = user.lastDailyReward;
    if (lastReward && now - lastReward < 24 * 60 * 60 * 1000) {
      const nextReward = new Date(lastReward.getTime() + 24 * 60 * 60 * 1000);
      return res.status(400).json({ message: `Next reward available at ${nextReward.toLocaleTimeString()}` });
    }

    const reward = 50;
    user.walletBalance = Math.min(user.walletBalance + reward, 1000);
    user.lastDailyReward = now;
    user.notifications.push({ message: `🎁 Daily reward claimed! +${reward} tokens`, type: 'success' });
    await user.save();
    res.json({ walletBalance: user.walletBalance, message: `Claimed ${reward} daily tokens!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// WALLET HISTORY (from sessions)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const sessions = await Session.find({
      $or: [{ learner: req.user.id }, { mentor: req.user.id }],
      status: { $in: ['completed', 'refunded'] }
    })
      .populate('mentor', 'name')
      .populate('learner', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    const history = sessions.map(s => ({
      type: s.learner._id.toString() === req.user.id ? 'debit' : 'credit',
      amount: s.tokenCost,
      description: s.learner._id.toString() === req.user.id
        ? `Session with ${s.mentor.name} (${s.skill})`
        : `Earned from ${s.learner.name} (${s.skill})`,
      status: s.status,
      date: s.updatedAt
    }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
