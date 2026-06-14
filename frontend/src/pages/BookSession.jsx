import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const COST_OPTIONS = [20, 30, 50, 75, 100];

export default function BookSession() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [skill, setSkill] = useState('');
  const [tokenCost, setTokenCost] = useState(30);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, walletRes, mentorsRes] = await Promise.all([
          API.get('/users/me'), API.get('/wallet/balance'), API.get('/users/mentors'),
        ]);
        setProfile(meRes.data);
        setWallet(walletRes.data);
        const m = mentorsRes.data.find(u => u._id === mentorId);
        if (!m || meRes.data._id === mentorId) { navigate('/find-mentor'); return; }
        setMentor(m);
        if (m.teachingSkills?.[0]) setSkill(m.teachingSkills[0]);
      } catch {}
      setPageLoading(false);
    };
    load();
  }, [mentorId]);

  const handleBook = async () => {
    if (!skill) return setError('Please select a skill');
    setLoading(true); setError('');
    try { await API.post('/sessions/book', { mentorId, skill, tokenCost }); navigate('/my-sessions'); }
    catch (err) { setError(err.response?.data?.message || 'Booking failed'); }
    finally { setLoading(false); }
  };

  const canAfford = wallet && wallet.walletBalance >= tokenCost;
  const trustOk = wallet && wallet.trustScore >= 30;
  const trustColor = !wallet ? 'var(--text2)' : wallet.trustScore >= 80 ? '#10b981' : wallet.trustScore >= 50 ? '#f59e0b' : '#ef4444';

  if (pageLoading) return <div style={{ minHeight:'100vh', background:'var(--bg)' }}><Navbar profile={null} /></div>;

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <button onClick={() => navigate(-1)} style={s.back}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to mentors
        </button>

        {mentor && (
          <div style={s.grid} className="fade-up">
            {/* Mentor info */}
            <div style={s.mentorCard}>
              <div style={s.avatar}>{mentor.name[0].toUpperCase()}</div>
              <h2 style={s.mentorName}>{mentor.name}</h2>
              <div style={s.trustRow}>
                <span style={{ width:8, height:8, borderRadius:'50%', background: mentor.trustScore >= 80 ? '#10b981' : mentor.trustScore >= 50 ? '#f59e0b' : '#ef4444', display:'inline-block' }} />
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:500, fontSize:14, color:'var(--text)' }}>{mentor.trustScore}</span>
                <span style={{ fontSize:12, color:'var(--text3)' }}>trust score</span>
              </div>
              <div style={s.divider} />
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Teaches</div>
              <div style={s.skills}>
                {mentor.teachingSkills?.map(sk => <span key={sk} className="tag tag-neutral" style={{ fontSize:12 }}>{sk}</span>)}
              </div>
            </div>

            {/* Form */}
            <div>
              <h1 style={s.title}>Book a session</h1>
              <p style={{ fontSize:14, color:'var(--text2)', marginBottom:24 }}>Tokens are held in escrow and released to the mentor when the session ends.</p>

              <div style={s.formCard}>
                <div style={s.field}>
                  <label className="nx-label">Skill to learn</label>
                  <select className="nx-input" value={skill} onChange={e => setSkill(e.target.value)}>
                    <option value="">Select a skill…</option>
                    {mentor.teachingSkills?.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                  </select>
                </div>

                <div style={s.field}>
                  <label className="nx-label">Session cost (tokens)</label>
                  <div style={s.costRow}>
                    {COST_OPTIONS.map(c => (
                      <button key={c} style={{ ...s.costBtn, ...(tokenCost===c?s.costActive:{}) }} onClick={() => setTokenCost(c)}>{c}</button>
                    ))}
                  </div>
                </div>

                <div style={s.balTable}>
                  <div style={s.balRow}>
                    <span style={{ fontSize:13, color:'var(--text2)' }}>Your balance</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:500, color: canAfford?'var(--text)':'#ef4444' }}>{wallet?.walletBalance ?? '—'}</span>
                  </div>
                  <div style={s.balRow}>
                    <span style={{ fontSize:13, color:'var(--text2)' }}>Trust score</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:500, color: trustColor }}>{wallet?.trustScore ?? '—'}</span>
                  </div>
                  <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
                  <div style={s.balRow}>
                    <span style={{ fontSize:13, color:'var(--text2)' }}>Balance after booking</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:500, color:'var(--text)' }}>{wallet ? wallet.walletBalance - tokenCost : '—'}</span>
                  </div>
                </div>

                {!trustOk && (
                  <div style={s.warn}>Trust score below 30 — you cannot book sessions. Take quizzes or contact admin to improve your score.</div>
                )}
                {!canAfford && trustOk && (
                  <div style={s.warn}>
                    Insufficient tokens.{' '}
                    <span style={{ color:'var(--accent2)', cursor:'pointer' }} onClick={() => navigate('/add-tokens')}>Add tokens →</span>
                  </div>
                )}
                {error && <div style={s.error}>{error}</div>}

                <button className="nx-btn" onClick={handleBook} disabled={loading || !canAfford || !trustOk || !skill} style={{ width:'100%', padding:'13px', fontSize:15 }}>
                  {loading ? 'Booking…' : `Book for ${tokenCost} tokens`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'var(--bg)' },
  content: { maxWidth:860, margin:'0 auto', padding:'40px 28px', display:'flex', flexDirection:'column', gap:24 },
  back: { display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, padding:0, alignSelf:'flex-start' },
  grid: { display:'grid', gridTemplateColumns:'240px 1fr', gap:28, alignItems:'start' },
  mentorCard: { background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:14, padding:'24px', textAlign:'center' },
  avatar: { width:56, height:56, borderRadius:12, background:'linear-gradient(135deg, #3b82f6, #10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:600, color:'#fff', margin:'0 auto 14px' },
  mentorName: { fontFamily:'var(--font-serif)', fontSize:18, fontWeight:400, color:'var(--text)', marginBottom:10 },
  trustRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:7, marginBottom:16 },
  divider: { height:1, background:'var(--border)', margin:'0 0 16px' },
  skills: { display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' },
  title: { fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400, color:'var(--text)', marginBottom:8 },
  formCard: { background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:14, padding:'24px', display:'flex', flexDirection:'column', gap:20 },
  field: {},
  costRow: { display:'flex', gap:8, marginTop:8 },
  costBtn: { flex:1, padding:'10px', border:'1px solid var(--border)', borderRadius:8, background:'transparent', color:'var(--text2)', cursor:'pointer', fontWeight:600, fontSize:15, fontFamily:'var(--font-mono)', transition:'all 0.15s' },
  costActive: { border:'1px solid rgba(59,130,246,0.5)', background:'rgba(59,130,246,0.1)', color:'#60a5fa' },
  balTable: { background:'var(--bg2)', borderRadius:9, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9 },
  balRow: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  warn: { padding:'9px 13px', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#f87171', fontSize:13 },
  error: { padding:'9px 13px', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#f87171', fontSize:13 },
};
