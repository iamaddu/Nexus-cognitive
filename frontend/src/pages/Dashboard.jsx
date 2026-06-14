import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

function StatCard({ label, value, sub, color, delay }) {
  return (
    <div style={{ ...T.statCard }} className={`fade-up stagger-${delay}`}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:36, fontWeight:800, color: color || 'var(--n-900)', letterSpacing:'-.03em', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--n-400)', marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function ActionCard({ icon, title, desc, cta, onClick, primary, delay }) {
  return (
    <div style={{ ...T.actionCard, ...(primary ? T.actionPrimary : {}) }} onClick={onClick} className={`fade-up stagger-${delay}`}>
      <div style={{ ...T.actionIcon, ...(primary ? T.actionIconPrimary : {}) }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ ...T.actionTitle, ...(primary ? { color:'white' } : {}) }}>{title}</div>
        <div style={{ ...T.actionDesc, ...(primary ? { color:'rgba(255,255,255,.65)' } : {}) }}>{desc}</div>
      </div>
      <div style={{ ...T.actionCta, ...(primary ? { color:'rgba(255,255,255,.7)' } : {}) }}>{cta} →</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const ts = wallet?.trustScore ?? 0;
  const trustColor = ts >= 80 ? 'var(--emerald)' : ts >= 50 ? 'var(--amber)' : 'var(--rose)';
  const trustLabel = ts >= 80 ? 'Excellent standing' : ts >= 50 ? 'Good standing' : ts >= 30 ? 'Fair standing' : 'Low — booking blocked';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile} />
      <div style={T.page}>

        {/* Header */}
        <div style={T.pageHeader} className="fade-up">
          <div>
            <div style={T.greetLabel}>{greeting}</div>
            <h1 style={T.pageTitle}>{user?.name?.split(' ')[0]}</h1>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <span className="nx-badge nx-badge-neutral">Learner</span>
              {profile?.isMentor && <span className="nx-badge nx-badge-blue">Mentor</span>}
              {profile?.isAdmin && <span className="nx-badge nx-badge-yellow">Admin</span>}
            </div>
          </div>
          <button className="nx-btn" onClick={() => navigate('/find-mentor')} style={{ padding:'10px 22px' }}>
            Find a Mentor
          </button>
        </div>

        {ts < 30 && wallet && (
          <div style={T.alertBanner} className="fade-up">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Your trust score is below 30. Booking is blocked until you improve it by completing sessions and passing quizzes.
          </div>
        )}

        {/* Stats */}
        <div style={T.statsRow}>
          <StatCard label="Token balance" value={wallet?.walletBalance ?? '—'} sub="tokens available" delay="1" />
          <StatCard label="Trust score" value={ts} sub={trustLabel} color={trustColor} delay="2" />
          {wallet?.escrowBalance > 0 && (
            <StatCard label="In escrow" value={wallet.escrowBalance} sub="pending sessions" color="var(--amber)" delay="3" />
          )}
        </div>

        {/* Mentor teaching banner */}
        {profile?.isMentor && profile?.teachingSkills?.length > 0 && (
          <div style={T.teachBanner} className="fade-up">
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--brand)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 }}>Your teaching skills</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {profile.teachingSkills.map(sk => (
                  <span key={sk} className="nx-badge nx-badge-blue">{sk}</span>
                ))}
              </div>
            </div>
            <button className="nx-btn-outline" onClick={() => navigate('/profile')} style={{ flexShrink:0, fontSize:13 }}>Edit skills</button>
          </div>
        )}

        {/* Quick actions */}
        <div style={T.sectionHead} className="fade-up">Quick actions</div>
        <div style={T.actionGrid}>
          <ActionCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            title="Find a Mentor"
            desc="Browse mentors by skill, check trust scores, and book a session instantly."
            cta="Browse"
            onClick={() => navigate('/find-mentor')}
            primary
            delay="1"
          />
          <ActionCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--n-500)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            title="My Sessions"
            desc="Track all your sessions as a learner or mentor. Rate and review."
            cta="View"
            onClick={() => navigate('/my-sessions')}
            delay="2"
          />
          <ActionCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--n-500)" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            title={profile?.isMentor ? 'Edit Teaching Profile' : 'Become a Mentor'}
            desc={profile?.isMentor ? 'Update your skills and manage your mentor profile.' : 'Start teaching and earn tokens for every session.'}
            cta="Go"
            onClick={() => navigate(profile?.isMentor ? '/profile' : '/become-mentor')}
            delay="3"
          />
          <ActionCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--n-500)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            title="Wallet"
            desc="Add tokens, claim your daily reward, and view transaction history."
            cta="Open"
            onClick={() => navigate('/add-tokens')}
            delay="4"
          />
        </div>

        {/* How it works */}
        <div style={T.howSection} className="fade-up">
          <div style={{ ...T.sectionHead, marginBottom:16 }}>How Nexus works</div>
          <div style={T.steps}>
            {[
              { n:1, title:'Get tokens', body:'100 free on signup. Claim 50 every day.' },
              { n:2, title:'Find a mentor', body:'Browse by skill. Check trust score.' },
              { n:3, title:'Book a session', body:'Tokens held in escrow — safe for both sides.' },
              { n:4, title:'Verify & certify', body:'Pass an AI quiz to earn a certificate.' },
            ].map((item, i) => (
              <div key={i} style={T.step}>
                <div style={T.stepN}>{item.n}</div>
                <div>
                  <div style={T.stepTitle}>{item.title}</div>
                  <div style={T.stepBody}>{item.body}</div>
                </div>
                {i < 3 && <div style={T.stepArrow}>›</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const T = {
  page: { maxWidth:1200, margin:'0 auto', padding:'32px 24px 56px', display:'flex', flexDirection:'column', gap:20 },
  pageHeader: {
    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
    background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)',
    padding:'24px 28px', boxShadow:'var(--sh-sm)', flexWrap:'wrap', gap:16,
  },
  greetLabel: { fontSize:13, color:'var(--n-400)', marginBottom:4 },
  pageTitle: { fontSize:28, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.025em' },
  alertBanner: {
    display:'flex', alignItems:'center', gap:10,
    padding:'12px 16px', borderRadius:'var(--r)',
    background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', color:'var(--rose)', fontSize:13,
  },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 },
  statCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--r-lg)', padding:'18px 20px', boxShadow:'var(--sh-xs)',
  },
  teachBanner: {
    display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
    background:'var(--brand-soft)', border:'1px solid var(--brand-border)',
    borderRadius:'var(--r-lg)', padding:'16px 20px', flexWrap:'wrap',
  },
  sectionHead: { fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase' },
  actionGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:10 },
  actionCard: {
    display:'flex', alignItems:'center', gap:14,
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--r-lg)', padding:'16px 18px',
    cursor:'pointer', transition:'all .18s', boxShadow:'var(--sh-xs)',
  },
  actionPrimary: {
    background:'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)',
    border:'1px solid var(--brand-hover)',
    boxShadow:'0 4px 14px rgba(99,102,241,.3)',
  },
  actionIcon: {
    width:40, height:40, borderRadius:11, background:'var(--n-100)',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },
  actionIconPrimary: { background:'rgba(255,255,255,.2)' },
  actionTitle: { fontWeight:700, fontSize:14, color:'var(--n-800)', marginBottom:3 },
  actionDesc: { fontSize:12, color:'var(--n-400)', lineHeight:1.5 },
  actionCta: { fontSize:13, fontWeight:700, color:'var(--brand)', marginLeft:'auto', flexShrink:0 },
  howSection: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--r-lg)', padding:'20px 24px', boxShadow:'var(--sh-xs)',
  },
  steps: { display:'flex', gap:0, flexWrap:'wrap' },
  step: {
    display:'flex', alignItems:'flex-start', gap:12,
    flex:1, minWidth:180, paddingRight:28, position:'relative',
  },
  stepN: {
    width:28, height:28, borderRadius:8, background:'var(--brand-soft)',
    color:'var(--brand-text)', fontSize:13, fontWeight:800, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center', marginTop:2,
  },
  stepTitle: { fontWeight:700, fontSize:14, color:'var(--n-800)', marginBottom:3 },
  stepBody: { fontSize:12, color:'var(--n-400)', lineHeight:1.5 },
  stepArrow: { position:'absolute', right:8, top:3, fontSize:22, color:'var(--n-300)', fontWeight:300 },
};
