import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const SKILLS = ['Python','JavaScript','React','Node.js','Java','C++','Machine Learning','Data Science','SQL','MongoDB','TypeScript','HTML/CSS','Flutter','Swift','Docker','AWS','System Design','DSA','Go','Rust'];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState('account');
  const [name, setName] = useState('');
  const [skills, setSkills] = useState([]);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    API.get('/users/me').then(r => { setProfile(r.data); setName(r.data.name); setSkills(r.data.teachingSkills||[]); }).catch(() => {});
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const saveName = async () => {
    setSaving(true);
    try { await API.patch('/users/update-profile', { name }); setProfile(p => ({ ...p, name })); showToast('Name updated.'); }
    catch { showToast('Failed to save', 'error'); }
    setSaving(false);
  };

  const saveSkills = async () => {
    setSaving(true);
    try {
      await API.patch('/users/update-skills', { teachingSkills: skills });
      if (!profile?.isMentor && skills.length > 0) await API.patch('/users/become-mentor', { teachingSkills: skills });
      showToast('Skills updated.');
    } catch { showToast('Failed to save', 'error'); }
    setSaving(false);
  };

  const toggle = (sk) => setSkills(p => p.includes(sk) ? p.filter(x => x !== sk) : [...p, sk]);
  const addCustom = () => { const s = custom.trim(); if (s && !skills.includes(s)) { setSkills(p => [...p, s]); setCustom(''); } };

  const ts = wallet?.trustScore ?? 0;
  const trustColor = ts >= 80 ? 'var(--emerald)' : ts >= 50 ? 'var(--amber)' : 'var(--rose)';
  const trustLabel = ts >= 80 ? 'Excellent' : ts >= 50 ? 'Good' : ts >= 30 ? 'Fair' : 'Low — booking blocked';

  const tabs = [
    { id:'account', label:'Account' },
    { id:'skills', label:'Teaching Skills' },
    { id:'trust', label:'Trust Score' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile} />
      <div style={T.page}>

        {/* Profile hero */}
        <div style={T.hero} className="fade-up">
          <div style={T.heroAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex:1 }}>
            <h1 style={T.heroName}>{profile?.name}</h1>
            <p style={T.heroEmail}>{profile?.email}</p>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <span className="nx-badge nx-badge-neutral">Learner</span>
              {profile?.isMentor && <span className="nx-badge nx-badge-blue">Mentor</span>}
              {profile?.isAdmin && <span className="nx-badge nx-badge-yellow">Admin</span>}
            </div>
          </div>
          <div style={T.heroStats}>
            <div style={T.heroStat}>
              <div style={T.heroStatVal}>{wallet?.walletBalance ?? '—'}</div>
              <div style={T.heroStatLabel}>Tokens</div>
            </div>
            <div style={T.heroStatDivider}/>
            <div style={T.heroStat}>
              <div style={{ ...T.heroStatVal, color:trustColor }}>{ts}</div>
              <div style={T.heroStatLabel}>Trust score</div>
            </div>
          </div>
        </div>

        {toast && (
          <div style={{ padding:'10px 14px', borderRadius:'var(--r)', border:'1px solid', fontSize:13, background:toast.type==='success'?'var(--emerald-bg)':'var(--rose-bg)', borderColor:toast.type==='success'?'var(--emerald-bd)':'var(--rose-bd)', color:toast.type==='success'?'var(--emerald)':'var(--rose)' }}>
            {toast.msg}
          </div>
        )}

        <div style={T.layout}>
          {/* Tab sidebar */}
          <div style={T.sidebar}>
            {tabs.map(t => (
              <button key={t.id} style={{ ...T.tabBtn, ...(tab===t.id ? T.tabBtnOn : {}) }} onClick={() => setTab(t.id)}>
                {t.label}
                {tab===t.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={T.main}>
            {tab === 'account' && (
              <div style={T.section} className="fade-in">
                <div style={T.sectionTitle}>Account information</div>
                <div style={T.fields}>
                  <div>
                    <label className="nx-label">Full name</label>
                    <input className="nx-input" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="nx-label">Email address</label>
                    <input className="nx-input" value={profile?.email || ''} disabled />
                  </div>
                  <div>
                    <label className="nx-label">Member since</label>
                    <input className="nx-input" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : ''} disabled />
                  </div>
                </div>
                <button className="nx-btn" onClick={saveName} disabled={saving} style={{ padding:'9px 22px', marginTop:4 }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}

            {tab === 'skills' && (
              <div style={T.section} className="fade-in">
                <div style={T.sectionTitle}>Teaching skills</div>
                <p style={T.sectionDesc}>
                  {profile?.isMentor ? 'Learners discover you through these skills. Keep them accurate.' : 'Select skills to become a mentor and earn tokens per session.'}
                </p>
                <div style={T.skillGrid}>
                  {SKILLS.map(sk => (
                    <button key={sk} style={{ ...T.chip, ...(skills.includes(sk) ? T.chipOn : {}) }} onClick={() => toggle(sk)}>
                      {skills.includes(sk) && '✓ '}{sk}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <input className="nx-input" placeholder="Add a custom skill…" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key==='Enter' && addCustom()} />
                  <button className="nx-btn-outline" onClick={addCustom} style={{ flexShrink:0, padding:'9px 14px', fontSize:13 }}>Add</button>
                </div>
                {skills.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                    {skills.map(sk => (
                      <span key={sk} className="nx-badge nx-badge-blue" style={{ cursor:'pointer' }} onClick={() => toggle(sk)}>{sk} ×</span>
                    ))}
                  </div>
                )}
                <button className="nx-btn" onClick={saveSkills} disabled={saving} style={{ padding:'9px 22px', marginTop:16 }}>
                  {saving ? 'Saving…' : 'Save skills'}
                </button>
              </div>
            )}

            {tab === 'trust' && (
              <div style={T.section} className="fade-in">
                <div style={T.sectionTitle}>Trust score</div>
                <div style={T.trustDisplay}>
                  <span style={{ fontSize:72, fontWeight:800, color:trustColor, letterSpacing:'-.04em', lineHeight:1 }}>{ts}</span>
                  <div style={{ paddingTop:8 }}>
                    <div style={{ fontWeight:700, fontSize:16, color:trustColor, marginBottom:4 }}>{trustLabel}</div>
                    <div style={{ fontSize:13, color:'var(--n-400)' }}>out of 100 points</div>
                  </div>
                </div>
                <div style={T.trustBar}><div style={{ ...T.trustFill, width:`${ts}%`, background:trustColor }}/></div>

                <div style={{ fontSize:12, fontWeight:700, color:'var(--n-400)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:12, marginTop:4 }}>How trust score changes</div>
                <div style={T.trustTable}>
                  {[
                    { action:'Pass a quiz (60%+)', change:'+5', good:true },
                    { action:'Positive rating received', change:'+2', good:true },
                    { action:'Fail a quiz', change:'−2', good:false },
                    { action:'Low rating received', change:'−2 to −3', good:false },
                    { action:'Admin penalty', change:'Varies', good:false },
                  ].map(item => (
                    <div key={item.action} style={T.trustRow}>
                      <span style={{ fontSize:14, color:'var(--n-600)' }}>{item.action}</span>
                      <span style={{ fontWeight:700, fontSize:13, color:item.good?'var(--emerald)':'var(--rose)' }}>{item.change}</span>
                    </div>
                  ))}
                </div>

                {ts < 30 && (
                  <div style={{ marginTop:12, padding:'12px 14px', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r)', color:'var(--rose)', fontSize:13, lineHeight:1.6 }}>
                    Your trust score is below 30 — session booking is blocked. Pass quizzes or contact an admin to recover.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const T = {
  page: { maxWidth:900, margin:'0 auto', padding:'28px 24px 56px', display:'flex', flexDirection:'column', gap:16 },
  hero: { display:'flex', alignItems:'center', gap:16, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'22px 24px', flexWrap:'wrap', boxShadow:'var(--sh-sm)' },
  heroAvatar: {
    width:54, height:54, borderRadius:16, flexShrink:0,
    background:'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)',
    color:'white', fontSize:22, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 12px rgba(99,102,241,.3)',
  },
  heroName: { fontSize:20, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.015em', marginBottom:2 },
  heroEmail: { fontSize:13, color:'var(--n-400)' },
  heroStats: { display:'flex', alignItems:'center', gap:20, marginLeft:'auto', flexWrap:'wrap' },
  heroStat: { textAlign:'center' },
  heroStatVal: { fontSize:28, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', lineHeight:1 },
  heroStatLabel: { fontSize:12, color:'var(--n-400)', marginTop:3 },
  heroStatDivider: { width:1, height:36, background:'var(--border)' },
  layout: { display:'grid', gridTemplateColumns:'180px 1fr', gap:12, alignItems:'start' },
  sidebar: { display:'flex', flexDirection:'column', gap:2, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:6 },
  tabBtn: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, width:'100%', padding:'9px 12px', borderRadius:'var(--r)', border:'none', background:'transparent', color:'var(--n-500)', fontSize:14, fontWeight:500, cursor:'pointer', transition:'all .15s', textAlign:'left' },
  tabBtnOn: { background:'var(--brand-soft)', color:'var(--brand-text)', fontWeight:600 },
  main: {},
  section: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'22px 24px', display:'flex', flexDirection:'column', gap:16 },
  sectionTitle: { fontSize:16, fontWeight:700, color:'var(--n-800)', letterSpacing:'-.01em' },
  sectionDesc: { fontSize:13, color:'var(--n-400)', lineHeight:1.6, marginTop:-8 },
  fields: { display:'flex', flexDirection:'column', gap:12 },
  skillGrid: { display:'flex', flexWrap:'wrap', gap:7 },
  chip: { padding:'6px 13px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border)', background:'var(--surface)', color:'var(--n-500)', fontSize:13, cursor:'pointer', transition:'all .15s' },
  chipOn: { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--brand-text)' },
  trustDisplay: { display:'flex', alignItems:'center', gap:16, marginBottom:16 },
  trustBar: { height:6, background:'var(--n-100)', borderRadius:3, overflow:'hidden', marginBottom:20 },
  trustFill: { height:'100%', borderRadius:3, transition:'width .5s ease' },
  trustTable: { display:'flex', flexDirection:'column' },
  trustRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--n-100)' },
};
