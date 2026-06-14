import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Navbar({ profile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifs = async () => {
    try { const r = await API.get('/notifications'); setNotifs(r.data); } catch {}
  };

  const openNotifs = async () => {
    setNotifOpen(v => !v);
    setProfileOpen(false);
    if (!notifOpen && unread > 0) {
      try { await API.patch('/notifications/read-all'); setNotifs(p => p.map(n => ({ ...n, read: true }))); } catch {}
    }
  };

  const isActive = (p) => location.pathname === p;

  const navLinks = [
    { path: '/dashboard', label: 'Home' },
    { path: '/find-mentor', label: 'Find Mentors' },
    { path: '/my-sessions', label: 'Sessions' },
    { path: '/add-tokens', label: 'Wallet' },
  ];

  const typeIcon = { success: '↑', warning: '!', error: '×', info: 'i' };
  const typeColor = { success: 'var(--emerald)', warning: 'var(--amber)', error: 'var(--rose)', info: 'var(--brand)' };

  return (
    <nav style={nav.bar}>
      <div style={nav.inner}>
        {/* Logo */}
        <button style={nav.logo} onClick={() => navigate('/dashboard')}>
          <div style={nav.logoIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={nav.logoText}>Nexus Cognitive</span>
        </button>

        {/* Nav links */}
        <div style={nav.links}>
          {navLinks.map(item => (
            <button key={item.path}
              style={{ ...nav.link, ...(isActive(item.path) ? nav.linkOn : {}) }}
              onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={nav.right}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button style={nav.iconBtn} onClick={openNotifs}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && <span style={nav.badge}>{unread > 9 ? '9+' : unread}</span>}
            </button>
            {notifOpen && (
              <div style={nav.dropdown} className="fade-in">
                <div style={nav.dropHead}>Notifications</div>
                {notifs.length === 0
                  ? <div style={nav.dropEmpty}>Nothing new</div>
                  : notifs.slice(0, 8).map((n, i) => (
                    <div key={i} style={{ ...nav.notifRow, opacity: n.read ? .55 : 1 }}>
                      <span style={{ ...nav.notifDot, background: typeColor[n.type] || 'var(--brand)' }}/>
                      <span style={nav.notifText}>{n.message}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Admin */}
          {profile?.isAdmin && (
            <button style={nav.adminChip} onClick={() => navigate('/admin')}>Admin panel</button>
          )}

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button style={nav.profileBtn} onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}>
              <div style={nav.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
              <span style={nav.profileName}>{user?.name?.split(' ')[0]}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {profileOpen && (
              <div style={nav.profileDrop} className="fade-in">
                <div style={nav.pdHead}>
                  <div style={nav.pdName}>{user?.name}</div>
                  <div style={nav.pdEmail}>{user?.email}</div>
                </div>
                {[
                  { label: 'View profile', path: '/profile' },
                  { label: 'My sessions', path: '/my-sessions' },
                  { label: 'Wallet', path: '/add-tokens' },
                ].map(item => (
                  <button key={item.path} style={nav.pdItem} onClick={() => { navigate(item.path); setProfileOpen(false); }}>
                    {item.label}
                  </button>
                ))}
                <div style={nav.pdDivider}/>
                <button style={{ ...nav.pdItem, color: 'var(--rose)' }} onClick={() => { logout(); navigate('/login'); }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

const nav = {
  bar: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)', boxShadow: 'var(--sh-xs)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 24px', height: 56,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 9,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 0, marginRight: 20, flexShrink: 0,
  },
  logoIcon: {
    width: 30, height: 30, borderRadius: 9,
    background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(99,102,241,.4)',
  },
  logoText: {
    fontWeight: 700, fontSize: 15, color: 'var(--n-800)', letterSpacing: '-.01em',
  },
  links: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  link: {
    padding: '5px 12px', borderRadius: 7,
    background: 'transparent', border: 'none',
    color: 'var(--n-500)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', transition: 'all .15s',
  },
  linkOn: {
    color: 'var(--n-800)', background: 'var(--n-100)', fontWeight: 600,
  },
  right: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  iconBtn: {
    position: 'relative', width: 36, height: 36, borderRadius: 9,
    background: 'var(--n-50)', border: '1px solid var(--border)',
    color: 'var(--n-500)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    width: 17, height: 17, borderRadius: '50%',
    background: 'var(--rose)', color: 'white',
    fontSize: 9, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid white',
  },
  dropdown: {
    position: 'absolute', right: 0, top: 44,
    width: 300, maxHeight: 360, overflowY: 'auto',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-xl)', zIndex: 200,
  },
  dropHead: {
    padding: '12px 16px 10px', fontSize: 11, fontWeight: 700,
    color: 'var(--n-400)', letterSpacing: '.06em', textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
  },
  dropEmpty: { padding: '20px 16px', color: 'var(--n-400)', fontSize: 13, textAlign: 'center' },
  notifRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 16px', borderBottom: '1px solid var(--n-100)',
  },
  notifDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 6 },
  notifText: { fontSize: 13, color: 'var(--n-700)', lineHeight: 1.5 },
  adminChip: {
    padding: '5px 12px', borderRadius: 'var(--r-full)',
    background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)',
    color: 'var(--amber)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px 4px 5px', borderRadius: 'var(--r-full)',
    background: 'var(--n-50)', border: '1px solid var(--border)',
    cursor: 'pointer', transition: 'all .15s',
  },
  avatar: {
    width: 27, height: 27, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)',
    color: 'white', fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 13, fontWeight: 600, color: 'var(--n-700)' },
  profileDrop: {
    position: 'absolute', right: 0, top: 44, width: 210,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-xl)', zIndex: 200, overflow: 'hidden',
  },
  pdHead: { padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' },
  pdName: { fontWeight: 700, fontSize: 14, color: 'var(--n-800)', marginBottom: 2 },
  pdEmail: { fontSize: 12, color: 'var(--n-400)' },
  pdItem: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 16px', background: 'none', border: 'none',
    fontSize: 14, color: 'var(--n-700)', cursor: 'pointer',
    transition: 'background .1s',
  },
  pdDivider: { height: 1, background: 'var(--border)', margin: '4px 0' },
};
