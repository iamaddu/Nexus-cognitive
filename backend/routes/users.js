const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET MY PROFILE
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL MENTORS (with optional skill filter)
router.get('/mentors', authMiddleware, async (req, res) => {
  try {
    const { skill } = req.query;
    const query = { isMentor: true, isBanned: false };
    if (skill) query.teachingSkills = { $regex: skill, $options: 'i' };

    const mentors = await User.find(query).select('-password -notifications').sort({ trustScore: -1 });
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BECOME A MENTOR
router.patch('/become-mentor', authMiddleware, async (req, res) => {
  try {
    const { teachingSkills } = req.body;
    if (!teachingSkills || teachingSkills.length === 0)
      return res.status(400).json({ message: 'At least one skill required' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isMentor: true, teachingSkills },
      { new: true }
    ).select('-password');

    res.json({ message: 'You are now a mentor!', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE SKILLS
router.patch('/update-skills', authMiddleware, async (req, res) => {
  try {
    const { teachingSkills } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { teachingSkills },
      { new: true }
    ).select('-password');
    res.json({ message: 'Skills updated!', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PROFILE NAME
router.patch('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
