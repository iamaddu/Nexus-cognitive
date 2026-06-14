import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState(null);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get(`/auth/verify-reset-token/${token}`).then(r => setValid(r.data.valid)).catch(() => setValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw !== confirm) return setError("Passwords don't match");
    if (pw.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try { await API.post('/auth/reset-password', { token, newPassword: pw }); setDone(true); setTimeout(() => navigate('/login'), 2500); }
    catch (err) { setError(err.response?.data?.message || 'Reset failed'); }
    setLoading(false);
  };

  return (
    <div style={s.root}>
      <div style={s.card} className="fade-up">
        <h1 style={s.title}>Set a new password</h1>
        {valid === null && <p style={{ color:'var(--n-400)' }}>Verifying reset link…</p>}
        {valid === false && (
          <div style={s.errBox}>
            This link has expired or is invalid.{' '}
            <Link to="/forgot-password" style={{ color:'var(--brand)', fontWeight:600 }}>Request a new one</Link>
          </div>
        )}
        {valid && !done && (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14, marginTop:20 }}>
            <div><label className="nx-label">New password</label><input className="nx-input" type="password" placeholder="At least 6 characters" value={pw} onChange={e=>setPw(e.target.value)} required autoFocus /></div>
            <div><label className="nx-label">Confirm password</label><input className="nx-input" type="password" placeholder="Repeat password" value={confirm} onChange={e=>setConfirm(e.target.value)} required /></div>
            {error && <div style={s.errBox}>{error}</div>}
            <button className="nx-btn" type="submit" disabled={loading} style={{ width:'100%', padding:'11px', justifyContent:'center', fontSize:15 }}>
              {loading ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}
        {done && (
          <div style={{ textAlign:'center', paddingTop:20 }}>
            <div style={s.checkIcon}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <p style={{ color:'var(--n-700)' }}>Password updated. Redirecting to sign in…</p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:24 },
  card: { width:'100%', maxWidth:400, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'36px 40px', boxShadow:'var(--sh-lg)' },
  title: { fontSize:24, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:6 },
  errBox: { padding:'10px 13px', borderRadius:'var(--r)', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', color:'var(--rose)', fontSize:13 },
  checkIcon: { width:52, height:52, borderRadius:'50%', background:'var(--emerald-bg)', border:'1.5px solid var(--emerald-bd)', color:'var(--emerald)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
};
