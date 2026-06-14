import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const FILTERS = ['All','Python','JavaScript','React','Node.js','Java','Machine Learning','Data Science','SQL','TypeScript','C++','Docker','AWS','System Design','DSA'];

export default function FindMentor() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchMentors();
  }, []);

  const fetchMentors = async (skill) => {
    setLoading(true);
    try {
      const url = skill && skill !== 'All' ? `/users/mentors?skill=${encodeURIComponent(skill)}` : '/users/mentors';
      const res = await API.get(url);
      setMentors(res.data);
    } catch {}
    setLoading(false);
  };

  const handleFilter = (f) => { setActiveFilter(f); fetchMentors(f); };

  const filtered = mentors.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.teachingSkills?.some(sk => sk.toLowerCase().includes(search.toLowerCase()))
  );

  const getTrustColor = (score) => score >= 80 ? 'var(--emerald)' : score >= 50 ? 'var(--amber)' : 'var(--rose)';
  const getTrustLabel = (score) => score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Fair';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile} />
      <div style={T.page}>

        {/* Header */}
        <div className="fade-up">
          <h1 style={T.title}>Find a Mentor</h1>
          <p style={T.sub}>Connect with verified peers for live one-on-one sessions</p>
        </div>

        {/* Search + filter bar */}
        <div style={T.toolbar} className="fade-up">
          <div style={{ position:'relative', flex:1, maxWidth:340 }}>
            <svg style={T.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="nx-input" placeholder="Search by name or skill…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:36 }} />
          </div>
          <div style={T.filters}>
            {FILTERS.map(f => (
              <button key={f} style={{ ...T.chip, ...(activeFilter===f ? T.chipOn : {}) }} onClick={() => handleFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={T.centered}>
            <div style={T.spinner}/>
            <span style={{ color:'var(--n-400)', fontSize:14 }}>Loading mentors…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={T.centered}>
            <div style={T.emptyIllustration}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--n-300)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--n-600)', marginBottom:6 }}>No mentors found</div>
            <p style={{ fontSize:14, color:'var(--n-400)' }}>Try a different skill or clear the search.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'var(--n-400)' }} className="fade-up">
              Showing {filtered.length} mentor{filtered.length !== 1 ? 's' : ''}
            </div>
            <div style={T.grid}>
              {filtered.map((mentor, i) => (
                <div key={mentor._id} style={T.card} className={`fade-up stagger-${Math.min(i+1,4)}`}>
                  <div style={T.cardTop}>
                    <div style={T.avatar}>{mentor.name[0].toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={T.mentorName}>{mentor.name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:getTrustColor(mentor.trustScore) }}>{mentor.trustScore}</span>
                        <span style={{ fontSize:12, color:'var(--n-400)' }}>trust · {getTrustLabel(mentor.trustScore)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={T.skillsWrap}>
                    {mentor.teachingSkills?.slice(0, 4).map(sk => (
                      <span key={sk} className="nx-badge nx-badge-neutral">{sk}</span>
                    ))}
                    {mentor.teachingSkills?.length > 4 && (
                      <span style={{ fontSize:12, color:'var(--n-400)' }}>+{mentor.teachingSkills.length - 4} more</span>
                    )}
                  </div>

                  <div style={T.cardFooter}>
                    <div style={T.trustBar}>
                      <div style={{ ...T.trustFill, width:`${mentor.trustScore}%`, background:getTrustColor(mentor.trustScore) }}/>
                    </div>
                    <button className="nx-btn" onClick={() => navigate(`/book/${mentor._id}`)} style={{ width:'100%', padding:'9px', fontSize:13, marginTop:10 }}>
                      Book a session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const T = {
  page: { maxWidth:1200, margin:'0 auto', padding:'28px 24px 56px', display:'flex', flexDirection:'column', gap:16 },
  title: { fontSize:26, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:4 },
  sub: { fontSize:14, color:'var(--n-400)' },
  toolbar: { display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-start' },
  searchIcon: { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--n-400)', pointerEvents:'none' },
  filters: { display:'flex', flexWrap:'wrap', gap:6, flex:1 },
  chip: {
    padding:'6px 14px', borderRadius:'var(--r-full)',
    border:'1.5px solid var(--border)', background:'var(--surface)',
    color:'var(--n-500)', fontSize:13, cursor:'pointer', transition:'all .15s',
  },
  chipOn: { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--brand-text)', fontWeight:600 },
  centered: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'80px 0' },
  spinner: { width:24, height:24, border:'2px solid var(--border)', borderTop:'2px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' },
  emptyIllustration: {
    width:72, height:72, borderRadius:20, background:'var(--n-100)',
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4,
  },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 },
  card: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--r-lg)', padding:'18px', display:'flex', flexDirection:'column', gap:12,
    boxShadow:'var(--sh-xs)', transition:'box-shadow .18s, transform .18s',
  },
  cardTop: { display:'flex', alignItems:'center', gap:12 },
  avatar: {
    width:44, height:44, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg, var(--brand-soft) 0%, var(--brand-border) 100%)',
    color:'var(--brand-text)', fontSize:18, fontWeight:800,
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'1px solid var(--brand-border)',
  },
  mentorName: { fontWeight:700, fontSize:15, color:'var(--n-800)' },
  skillsWrap: { display:'flex', flexWrap:'wrap', gap:5, flex:1 },
  cardFooter: {},
  trustBar: { height:3, background:'var(--n-100)', borderRadius:2, overflow:'hidden' },
  trustFill: { height:'100%', borderRadius:2, transition:'width .4s' },
};
