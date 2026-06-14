import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setSent(true);
      if (res.data.devLink) setDevLink(res.data.devLink);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={s.root}>
      <div style={s.card} className="animate-in">
        <Link to="/login" style={s.back}>← Back to login</Link>
        <h1 style={s.title}>Reset password</h1>
        <p style={s.sub}>Enter your email and we'll send a reset link</p>
        {!sent ? (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="nx-label">Email</label>
              <input className="nx-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="nx-btn" style={{ width:'100%', padding:'14px' }} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link →'}
            </button>
          </form>
        ) : (
          <div style={s.success}>
            <div style={s.successIcon}>✓</div>
            <p>Reset link sent! Check your email.</p>
            {devLink && (
              <div style={s.devBox}>
                <div style={{ fontSize:11, color:'#f5c842', marginBottom:4 }}>DEV MODE — Link (check backend console):</div>
                <a href={devLink} style={{ color:'#8b83ff', fontSize:12, wordBreak:'break-all' }}>{devLink}</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get(`/auth/verify-reset-token/${token}`)
      .then(r => setValid(r.data.valid))
      .catch(() => setValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match");
    if (password.length < 6) return setError('Min 6 characters');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) return <div style={s.root}><div style={{ color:'#8888aa' }}>Verifying…</div></div>;

  return (
    <div style={s.root}>
      <div style={s.card} className="animate-in">
        <h1 style={s.title}>New password</h1>
        {!valid ? (
          <div style={{ color:'#ff5c7a', marginTop:16 }}>This reset link has expired or is invalid. <Link to="/forgot-password">Request a new one</Link></div>
        ) : done ? (
          <div style={s.success}>
            <div style={s.successIcon}>✓</div>
            <p>Password updated! Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16, marginTop:20 }}>
            <div>
              <label className="nx-label">New Password</label>
              <input className="nx-input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="nx-label">Confirm Password</label>
              <input className="nx-input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <div style={s.error}>⚠ {error}</div>}
            <button className="nx-btn" style={{ width:'100%', padding:'14px' }} disabled={loading}>
              {loading ? 'Saving…' : 'Reset Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;


const s = {
  root: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:24 },
  card: { width:'100%', maxWidth:400, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'36px 40px', boxShadow:'var(--sh-lg)' },
  back: { display:'inline-block', fontSize:13, color:'var(--n-400)', marginBottom:24 },
  title: { fontSize:24, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:6 },
  sub: { fontSize:14, color:'var(--n-400)', marginBottom:24 },
  success: { textAlign:'center', padding:'8px 0' },
  checkIcon: { width:52, height:52, borderRadius:'50%', background:'var(--emerald-bg)', border:'1.5px solid var(--emerald-bd)', color:'var(--emerald)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  devBox: { marginTop:16, padding:12, background:'var(--amber-bg)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', textAlign:'left' },
};
