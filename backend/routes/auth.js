const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, isMentor, teachingSkills } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      isMentor: !!isMentor,
      teachingSkills: isMentor ? (teachingSkills || []) : [],
      walletBalance: 100
    });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isMentor: user.isMentor, isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ message: 'Your account has been banned. Contact support.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isMentor: user.isMentor, isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await PasswordReset.deleteMany({ email: email.toLowerCase() });
    await PasswordReset.create({ email: email.toLowerCase(), token, expiresAt });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password/${token}`;
    console.log('\nPASSWORD RESET LINK (dev):', resetLink, '\n');

    res.json({ message: 'If that email exists, a reset link has been sent.', devLink: resetLink });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// VERIFY RESET TOKEN
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const record = await PasswordReset.findOne({ token: req.params.token, used: false });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ valid: false, message: 'Token expired or invalid' });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const record = await PasswordReset.findOne({ token, used: false });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: 'Token expired or invalid' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email: record.email }, { password: hashed });
    await PasswordReset.updateOne({ token }, { used: true });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
