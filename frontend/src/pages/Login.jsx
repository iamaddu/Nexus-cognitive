import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.root}>
      {/* Left panel */}
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
          <div style={s.leftMain}>
            <h1 style={s.leftH}>The smarter way to learn from peers.</h1>
            <p style={s.leftP}>Connect with skilled mentors, book live sessions, and verify your learning with AI — all on one platform.</p>
            <div style={s.featureList}>
              {[
                'Live 1-on-1 mentoring sessions',
                '100 free tokens on signup',
                'AI-powered skill verification',
                'Earn by teaching what you know',
              ].map(f => (
                <div key={f} style={s.feature}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div style={s.testimonial}>
            <div style={s.tQuote}>"Nexus helped me go from beginner to confident in React in just two weeks."</div>
            <div style={s.tAuthor}>— Priya M., Frontend Developer</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.formCard} className="fade-up">
          <h2 style={s.formTitle}>Welcome back</h2>
          <p style={s.formSub}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} style={s.form}>
            <div>
              <label className="nx-label">Email address</label>
              <input className="nx-input" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="nx-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--brand)' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input className="nx-input" type={show ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 52 }} />
                <button type="button" onClick={() => setShow(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--n-400)', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'var(--f)' }}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error && (
              <div style={s.errBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}
            <button className="nx-btn" type="submit" disabled={loading} style={{ width: '100%', padding: '11px', fontSize: 15, marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={s.divider}><div style={s.divLine}/><span style={s.divText}>or</span><div style={s.divLine}/></div>

          <p style={s.switchText}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' },
  left: {
    background: 'linear-gradient(160deg, #4f46e5 0%, #6366f1 40%, #818cf8 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56,
  },
  leftContent: { maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: 40 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-.01em' },
  leftMain: {},
  leftH: { fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-.02em', marginBottom: 16 },
  leftP: { fontSize: 15, color: 'rgba(255,255,255,.75)', lineHeight: 1.7, marginBottom: 28 },
  featureList: { display: 'flex', flexDirection: 'column', gap: 12 },
  feature: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 14, color: 'rgba(255,255,255,.9)',
  },
  testimonial: {
    background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,.2)', borderRadius: 14, padding: '18px 20px',
  },
  tQuote: { fontSize: 14, color: 'rgba(255,255,255,.9)', lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic' },
  tAuthor: { fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 600 },
  right: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 48, background: 'var(--bg)',
  },
  formCard: { width: '100%', maxWidth: 400 },
  formTitle: { fontSize: 26, fontWeight: 800, color: 'var(--n-900)', letterSpacing: '-.02em', marginBottom: 6 },
  formSub: { fontSize: 14, color: 'var(--n-400)', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  errBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 13px', borderRadius: 8,
    background: 'var(--rose-bg)', border: '1px solid var(--rose-bd)', color: 'var(--rose)', fontSize: 13,
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' },
  divLine: { flex: 1, height: 1, background: 'var(--border)' },
  divText: { fontSize: 12, color: 'var(--n-400)' },
  switchText: { textAlign: 'center', fontSize: 14, color: 'var(--n-500)' },
};
