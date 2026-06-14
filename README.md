# ⚡ NEXUS COGNITIVE — Setup Guide

## Prerequisites
- Node.js v18+
- MongoDB running locally (MongoDB Compass)

---

## HOW TO RUN

### Step 1 — Start MongoDB
Open MongoDB Compass and connect to: mongodb://localhost:27017
(Your nexus-cognitive-new database will appear automatically after first registration)

### Step 2 — Backend
Open a terminal, navigate to the project folder, then:

  cd nexus
  cd backend
  npm install

Edit the .env file — paste your Groq API key:
  GROQ_API_KEY=paste_your_key_from_console.groq.com

Then start the server:
  node server.js

You should see:
  MongoDB Connected!
  Server running on port 5000

### Step 3 — Frontend (new terminal tab)
  cd nexus
  cd frontend
  npm install
  npm run dev

Open in browser: http://localhost:5173

---

## MAKE YOURSELF ADMIN

After registering your account, run in MongoDB Compass shell:

  use nexus-cognitive-new
  db.users.updateOne({ email: "your-email@example.com" }, { $set: { isAdmin: true } })

Then refresh the app — 👑 Admin button appears in navbar.

---

## FAIRNESS SYSTEM (new in this version)

PROBLEM: Tying mentor payment to quiz score is unjust because:
- Learner could intentionally fail to avoid paying
- Mentor did the work regardless of quiz outcome

SOLUTION implemented:

1. MENTOR ALWAYS GETS PAID when session ends
   - Quiz has NOTHING to do with token release
   - Tokens release to mentor the moment session ends

2. QUIZ only affects LEARNER's trust score
   - Pass (60%+): trust score +5, certificate issued
   - Fail: trust score -2, no certificate

3. MUTUAL RATINGS after every completed session
   - Learner rates mentor (1-5 stars)
   - Mentor rates learner (1-5 stars)
   - Bad mentor rating lowers their trust score
   - Persistent bad ratings make mentor less visible

4. DISPUTE SYSTEM (24h window)
   - Learner can raise a dispute if mentor truly didn't teach
   - Must describe the issue clearly
   - Admin reviews and decides: refund or dismiss
   - False disputes lower the learner's own trust score

5. CERTIFICATES issued to learners who pass the quiz
   - Printable/downloadable from My Sessions page
   - Shows: skill, mentor name, score, date, unique certificate ID

6. TRUST SCORE ENFORCEMENT
   - Score < 30: blocked from booking sessions
   - Mentors with consistent bad ratings lose visibility

---

## ALL SECURITY FIXES

- Trust score < 30 blocks booking (server-side)
- Banned users cannot log in
- Self-booking blocked
- Cancel always refunds escrow
- Admin routes require isAdmin in DB
- Dispute raises flag for admin review
- Certificate only issued on 60%+ quiz score

---

## FULL FEATURE LIST

Authentication:  Register, Login, Forgot/Reset Password
Wallet:          100 tokens on signup, daily 50 tokens, top-up (max 500), max 1000 balance
Find Mentor:     Browse by skill, view trust score
Book Session:    Token escrow, trust score check
Session:         Real-time chat (Socket.io), start/end by mentor
Quiz:            AI-generated (Groq/Llama), 5 questions, 60% to pass
Certificate:     Auto-issued on quiz pass, printable
Ratings:         Both sides rate after session
Disputes:        24h window, admin arbitration
Notifications:   Real-time bell, 30s polling
Admin:           Stats, ban users, set trust scores, refund sessions, resolve disputes
