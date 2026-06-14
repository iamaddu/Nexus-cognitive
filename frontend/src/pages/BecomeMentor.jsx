import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const SKILLS = ['Python','JavaScript','React','Node.js','Java','C++','C','Machine Learning','Deep Learning','Data Science','SQL','MongoDB','TypeScript','HTML/CSS','Flutter','Kotlin','Swift','Docker','AWS','System Design','DSA','Rust','Go','DevOps'];

export default function BecomeMentor() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useState(() => {
    API.get('/users/me').then(r => { setProfile(r.data); if (r.data.isMentor) navigate('/profile'); }).catch(() => {});
  }, []);

  const toggle = (sk) => setSelected(p => p.includes(sk) ? p.filter(x => x !== sk) : [...p, sk]);
  const addCustom = () => { const s = custom.trim(); if (s && !selected.includes(s)) { setSelected(p => [...p, s]); setCustom(''); } };

  const handleSubmit = async () => {
    if (selected.length === 0) return setError('Select at least one skill');
    setLoading(true);
    try {
      await API.patch('/users/become-mentor', { teachingSkills: selected });
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.page}>
        <button onClick={() => navigate('/dashboard')} style={s.back}>← Dashboard</button>

        <div style={s.hero} className="up">
          <h1 style={s.title}>Become a Mentor</h1>
          <p style={s.sub}>Share your expertise with learners and earn tokens for every session you teach.</p>
          <div style={s.perks}>
            {['Earn tokens per session', 'Flexible scheduling', 'Build your reputation', 'Help others grow'].map(p => (
              <div key={p} style={s.perk}><div style={s.perkDot} />{p}</div>
            ))}
          </div>
        </div>

        <div style={s.card} className="up1">
          <div style={{ marginBottom: 20 }}>
            <h2 style={s.cardTitle}>Select skills you teach</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Pick all the topics you're confident teaching.</p>
          </div>
          <div style={s.skillGrid}>
            {SKILLS.map(sk => (
              <button key={sk} style={{ ...s.skillBtn, ...(selected.includes(sk) ? s.skillOn : {}) }} onClick={() => toggle(sk)}>
                {sk}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input className="nx-input" placeholder="Add custom skill…" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} />
            <button className="nx-btn-secondary" onClick={addCustom} style={{ flexShrink: 0, padding: '9px 14px' }}>Add</button>
          </div>
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {selected.map(sk => (
                <span key={sk} style={s.tag} onClick={() => toggle(sk)}>{sk} ×</span>
              ))}
            </div>
          )}
          {error && <div style={s.error}>{error}</div>}
          <button className="nx-btn" onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '11px', marginTop: 20 }}>
            {loading ? 'Saving…' : 'Start mentoring'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: 'var(--ink)' },
  page: { maxWidth: 720, margin: '0 auto', padding: '36px 24px' },
  back: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, marginBottom: 28, padding: 0 },
  hero: { marginBottom: 24 },
  title: { fontWeight: 700, fontSize: 28, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: 8 },
  sub: { color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 20 },
  perks: { display: 'flex', flexWrap: 'wrap', gap: 16 },
  perk: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' },
  perkDot: { width: 5, height: 5, borderRadius: '50%', background: 'var(--green-light)', flexShrink: 0 },
  card: { background: 'var(--ink-2)', border: '1px solid var(--rule)', borderRadius: 14, padding: '28px 30px' },
  cardTitle: { fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  skillBtn: { padding: '6px 13px', borderRadius: 6, border: '1px solid var(--rule-light)', background: 'var(--ink-3)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', transition: 'all .12s' },
  skillOn: { border: '1px solid var(--brand)', background: 'var(--brand-dim)', color: 'var(--brand-light)' },
  tag: { padding: '3px 9px', borderRadius: 100, background: 'var(--brand-dim)', border: '1px solid rgba(37,99,235,.2)', color: 'var(--brand-light)', fontSize: 12, cursor: 'pointer' },
  error: { padding: '9px 13px', borderRadius: 7, background: 'var(--red-dim)', border: '1px solid rgba(252,165,165,.15)', color: 'var(--red-light)', fontSize: 13, marginTop: 14 },
};
