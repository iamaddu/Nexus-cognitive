const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Session = require('../models/Session');
const User = require('../models/User');

// GENERATE QUIZ
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.learner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the learner can take this quiz' });
    if (session.status !== 'completed') return res.status(400).json({ message: 'Session must be completed first' });
    if (session.quizScore !== undefined) return res.status(400).json({ message: 'Quiz already taken' });

    let questions;
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{
          role: 'user',
          content: `Generate exactly 5 multiple choice quiz questions to test a student's basic understanding of "${session.skill}".
Return ONLY a valid JSON array, no markdown, no explanation:
[{"question":"...","options":["A...","B...","C...","D..."],"answer":0}]
The "answer" field is the index (0-3) of the correct option.`
        }],
        max_tokens: 1200
      });
      const raw = completion.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
      questions = JSON.parse(raw);
      // Validate structure
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('Invalid format');
    } catch {
      // Fallback questions if Groq fails or key is missing
      questions = [
        { question: `What is a core concept in ${session.skill}?`, options: ['Abstraction and modularity', 'Cooking methods', 'Weather patterns', 'Musical notes'], answer: 0 },
        { question: `Which best describes how ${session.skill} is used?`, options: ['To solve technical problems', 'For physical exercise', 'For farming', 'For fashion design'], answer: 0 },
        { question: `When learning ${session.skill}, practice is important because:`, options: ['It builds muscle memory and intuition', 'It makes you taller', 'It costs money', 'It is mandatory by law'], answer: 0 },
        { question: `A key benefit of mastering ${session.skill} is:`, options: ['Career opportunities and problem solving', 'Better cooking', 'Improved eyesight', 'Faster running'], answer: 0 },
        { question: `To improve in ${session.skill}, a beginner should:`, options: ['Start with fundamentals and build gradually', 'Skip basics and jump to advanced topics', 'Avoid practice', 'Only read theory, never practice'], answer: 0 }
      ];
    }

    res.json({ questions, sessionId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SUBMIT QUIZ
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { sessionId, answers, questions } = req.body;
    if (!sessionId || !answers || !questions) return res.status(400).json({ message: 'sessionId, answers, and questions required' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.learner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (session.quizScore !== undefined) return res.status(400).json({ message: 'Quiz already submitted' });
    if (session.status !== 'completed') return res.status(400).json({ message: 'Session must be completed first' });

    // Score the answers
    let correct = 0;
    if (Array.isArray(questions)) {
      questions.forEach((q, i) => {
        if (answers[i] === q.answer) correct++;
      });
    }

    const totalQuestions = questions?.length || 5;
    const score = Math.round((correct / totalQuestions) * 100);
    const passed = score >= 60;

    session.quizScore = score;
    session.quizPassed = passed;

    if (passed) {
      session.certificateIssued = true;
      session.certificateIssuedAt = new Date();
    }

    await session.save();

    // Update ONLY learner's trust score — never mentor's
    const learner = await User.findById(req.user.id);
    if (passed) {
      learner.trustScore = Math.min(100, learner.trustScore + 5);
      learner.notifications.push({
        message: `Quiz passed with ${score}%! Trust score +5. Certificate issued for "${session.skill}".`,
        type: 'success'
      });
    } else {
      learner.trustScore = Math.max(0, learner.trustScore - 2);
      learner.notifications.push({
        message: `Quiz score: ${score}% (need 60% to pass). Trust score -2. Book another session to improve!`,
        type: 'warning'
      });
    }
    await learner.save();

    res.json({
      score,
      passed,
      correct,
      total: totalQuestions,
      certificateIssued: passed
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
