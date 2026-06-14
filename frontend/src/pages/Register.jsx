import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const SKILLS = ['Python','JavaScript','React','Node.js','Java','C++','Machine Learning','Data Science','SQL','MongoDB','TypeScript','HTML/CSS','Flutter','Kotlin','Swift','Docker','AWS','System Design','DSA','Go','Rust'];

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [skills, setSkills] = useState([]);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggle = (sk) => setSkills(p => p.includes(sk) ? p.filter(x => x !== sk) : [...p, sk]);
  const addCustom = () => {
    const s = custom.trim();
    if (s && !skills.includes(s)) { setSkills(p => [...p, s]); setCustom(''); }
  };

  const next = () => {
    if (!name.trim()) return setError('Enter your name');
    if (!email.trim()) return setError('Enter your email');
    if (password.length < 6) return setError('Password must be 6+ characters');
    setError(''); setStep(2);
  };

  const submit = async () => {
    if (isMentor && skills.length === 0) return setError('Pick at least one skill you teach');
    setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/register', { name, email, password, isMentor, teachingSkills: skills });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--rose)', 'var(--amber)', 'var(--emerald)', 'var(--emerald)'];

  return (
    <div style={s.root}>
      {/* Left */}
      <div style={s.left}>
        <div style={s.leftContent}>
          <div style={s.logoRow}>
            <div style={s.logoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={s.logoText}>Nexus Cognitive</span>
          </div>
          <div>
            <h1 style={s.leftH}>Join a community that grows together.</h1>
            <p style={s.leftP}>Whether you're here to learn or teach, Nexus gives you the tools to do it well.</p>
          </div>
          <div style={s.statsGrid}>
            {[['100', 'Free tokens'], ['50/day', 'Daily reward'], ['Live', 'Real-time sessions'], ['AI', 'Skill certs']].map(([v, l]) => (
              <div key={l} style={s.statCard}>
                <div style={s.statVal}>{v}</div>
                <div style={s.statLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={s.right}>
        <div style={s.card} className="fade-up">
          {/* Steps */}
          <div style={s.steps}>
            {[1, 2].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ ...s.stepNum, ...(step >= n ? s.stepOn : {}) }}>{step > n ? '✓' : n}</div>
                <span style={{ ...s.stepLabel, ...(step >= n ? s.stepLabelOn : {}) }}>{n === 1 ? 'Account' : 'Role'}</span>
                {n < 2 && <div style={s.stepLine}/>}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 style={s.formTitle}>Create your account</h2>
              <p style={s.formSub}>Free forever. No card needed.</p>
              <div style={s.form}>
                <div>
                  <label className="nx-label">Full name</label>
                  <input className="nx-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="nx-label">Email address</label>
                  <input className="nx-input" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="nx-label">Password</label>
                  <input className="nx-input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                  {password.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                      <div style={{ flex:1, height:3, background:'var(--n-200)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${strength*25}%`, height:'100%', background:strengthColor[strength], borderRadius:2, transition:'width .3s' }}/>
                      </div>
                      <span style={{ fontSize:11, color:strengthColor[strength], fontWeight:600 }}>{strengthLabel[strength]}</span>
                    </div>
                  )}
                </div>
                {error && <div style={s.errBox}>{error}</div>}
                <button className="nx-btn" onClick={next} style={{ width:'100%', padding:'11px', fontSize:15 }}>Continue</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={s.formTitle}>How will you use Nexus?</h2>
              <p style={s.formSub}>You can change this anytime from your profile</p>
              <div style={s.form}>
                <div style={s.roleGrid}>
                  <div style={{ ...s.roleCard, ...(isMentor === false ? s.roleOn : {}) }} onClick={() => setIsMentor(false)}>
                    <div style={s.roleCircle}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.63a16 16 0 0 0 6.37 6.37l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div style={s.roleTitle}>I want to learn</div>
                    <div style={s.roleDesc}>Find mentors and book live sessions to grow your skills.</div>
                    {isMentor === false && <div style={s.roleCheck}>Selected</div>}
                  </div>
                  <div style={{ ...s.roleCard, ...(isMentor === true ? s.roleOn : {}) }} onClick={() => setIsMentor(true)}>
                    <div style={s.roleCircle}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div style={s.roleTitle}>I want to teach too</div>
                    <div style={s.roleDesc}>Share expertise with others and earn tokens per session.</div>
                    {isMentor === true && <div style={s.roleCheck}>Selected</div>}
                  </div>
                </div>

                {isMentor && (
                  <div className="fade-in">
                    <label className="nx-label" style={{ marginBottom:10 }}>Skills you teach</label>
                    <div style={s.skillGrid}>
                      {SKILLS.map(sk => (
                        <button key={sk} style={{ ...s.chip, ...(skills.includes(sk) ? s.chipOn : {}) }} onClick={() => toggle(sk)}>
                          {skills.includes(sk) && '✓ '}{sk}
                        </button>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <input className="nx-input" placeholder="Add another skill…" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key==='Enter' && addCustom()} />
                      <button className="nx-btn-outline" onClick={addCustom} style={{ flexShrink:0, padding:'9px 14px', fontSize:13 }}>Add</button>
                    </div>
                  </div>
                )}

                {error && <div style={s.errBox}>{error}</div>}
                <div style={{ display:'flex', gap:10 }}>
                  <button className="nx-btn-outline" onClick={() => setStep(1)} style={{ flex:1, padding:'11px', justifyContent:'center' }}>Back</button>
                  <button className="nx-btn" onClick={submit} disabled={loading} style={{ flex:2, padding:'11px', justifyContent:'center', fontSize:15 }}>
                    {loading ? 'Creating account…' : 'Get started'}
                  </button>
                </div>
              </div>
            </>
          )}

          <p style={s.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--brand)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr' },
  left: {
    background: 'linear-gradient(160deg, #312e81 0%, #4f46e5 50%, #6366f1 100%)',
    display:'flex', alignItems:'center', justifyContent:'center', padding:56,
  },
  leftContent: { maxWidth:440, width:'100%', display:'flex', flexDirection:'column', gap:36 },
  logoRow: { display:'flex', alignItems:'center', gap:10 },
  logoIcon: {
    width:36, height:36, borderRadius:10,
    background:'rgba(255,255,255,.2)', backdropFilter:'blur(8px)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  logoText: { fontWeight:700, fontSize:16, color:'white' },
  leftH: { fontSize:30, fontWeight:800, color:'white', lineHeight:1.2, letterSpacing:'-.02em', marginBottom:14 },
  leftP: { fontSize:15, color:'rgba(255,255,255,.7)', lineHeight:1.7 },
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  statCard: {
    background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)',
    border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'14px 16px',
  },
  statVal: { fontWeight:800, fontSize:22, color:'white', marginBottom:3, letterSpacing:'-.02em' },
  statLabel: { fontSize:12, color:'rgba(255,255,255,.65)' },
  right: {
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:48, background:'var(--bg)', overflowY:'auto',
  },
  card: { width:'100%', maxWidth:440 },
  steps: { display:'flex', alignItems:'center', gap:6, marginBottom:28 },
  stepNum: {
    width:26, height:26, borderRadius:'50%',
    background:'var(--n-200)', color:'var(--n-500)',
    fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
    transition:'all .2s',
  },
  stepOn: { background:'var(--brand)', color:'white' },
  stepLabel: { fontSize:12, fontWeight:500, color:'var(--n-400)', transition:'color .2s' },
  stepLabelOn: { color:'var(--n-700)', fontWeight:600 },
  stepLine: { width:28, height:1, background:'var(--border)', marginRight:6 },
  formTitle: { fontSize:24, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:4 },
  formSub: { fontSize:14, color:'var(--n-400)', marginBottom:24 },
  form: { display:'flex', flexDirection:'column', gap:14 },
  errBox: {
    padding:'9px 12px', borderRadius:8,
    background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', color:'var(--rose)', fontSize:13,
  },
  roleGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  roleCard: {
    padding:'16px', borderRadius:'var(--r-md)',
    border:'2px solid var(--border)', background:'var(--surface)',
    cursor:'pointer', transition:'all .15s', position:'relative',
  },
  roleOn: { border:'2px solid var(--brand)', background:'var(--brand-soft)' },
  roleCircle: {
    width:38, height:38, borderRadius:10, background:'var(--n-100)',
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'var(--n-500)', marginBottom:10,
  },
  roleTitle: { fontWeight:700, fontSize:14, color:'var(--n-800)', marginBottom:4 },
  roleDesc: { fontSize:12, color:'var(--n-400)', lineHeight:1.5 },
  roleCheck: {
    position:'absolute', top:8, right:10,
    fontSize:10, fontWeight:700, color:'var(--brand)', background:'var(--brand-soft)',
    padding:'2px 7px', borderRadius:20, border:'1px solid var(--brand-border)',
  },
  skillGrid: { display:'flex', flexWrap:'wrap', gap:7 },
  chip: {
    padding:'5px 13px', borderRadius:'var(--r-full)',
    border:'1.5px solid var(--border)', background:'var(--surface)',
    color:'var(--n-500)', fontSize:13, cursor:'pointer', transition:'all .15s',
  },
  chipOn: { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--brand-text)' },
  switchText: { textAlign:'center', fontSize:14, color:'var(--n-400)', marginTop:24 },
};
