const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET NOTIFICATIONS
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    const sorted = user.notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MARK ALL READ
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { 'notifications.$[].read': true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
