import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const PACKAGES = [
  { amount:50,  tag:'Starter',   note:'Try a session' },
  { amount:100, tag:'Basic',     note:'2–3 sessions' },
  { amount:250, tag:'Popular',   note:'Most chosen', highlight:true },
  { amount:500, tag:'Max',       note:'Max top-up' },
];

export default function AddTokens() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(250);
  const [loading, setLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
    API.get('/wallet/history').then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await API.post('/wallet/add', { amount: selected });
      setWallet(p => ({ ...p, walletBalance: res.data.walletBalance }));
      showToast(`${selected} tokens added. New balance: ${res.data.walletBalance}`);
    } catch (err) { showToast(err.response?.data?.message || 'Failed to add tokens', 'error'); }
    setLoading(false);
  };

  const handleDaily = async () => {
    setDailyLoading(true);
    try {
      const res = await API.post('/wallet/daily-reward');
      setWallet(p => ({ ...p, walletBalance: res.data.walletBalance }));
      showToast(res.data.message);
    } catch (err) { showToast(err.response?.data?.message || 'Already claimed today', 'error'); }
    setDailyLoading(false);
  };

  const balance = wallet?.walletBalance ?? 0;
  const pct = Math.min(100, Math.round((balance / 1000) * 100));

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile} />
      <div style={T.page}>
        <div className="fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={T.title}>Wallet</h1>
            <p style={T.sub}>Manage your token balance and top-up history</p>
          </div>
        </div>

        {toast && (
          <div style={{ padding:'10px 14px', borderRadius:'var(--r)', border:'1px solid', fontSize:13, background:toast.type==='success'?'var(--emerald-bg)':'var(--rose-bg)', borderColor:toast.type==='success'?'var(--emerald-bd)':'var(--rose-bd)', color:toast.type==='success'?'var(--emerald)':'var(--rose)' }}>
            {toast.msg}
          </div>
        )}

        <div style={T.layout}>
          {/* Left column */}
          <div style={T.leftCol}>
            {/* Balance card */}
            <div style={T.balCard} className="fade-up">
              <div style={T.balLabel}>Available balance</div>
              <div style={T.balNum}>{balance}</div>
              <div style={T.balUnit}>tokens</div>
              <div style={T.balBarWrap}>
                <div style={{ ...T.balBarFill, width:`${pct}%` }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--n-400)' }}>
                <span>{balance} / 1,000 max</span>
                <span style={{ fontWeight:600, color: wallet?.trustScore>=80?'var(--emerald)':wallet?.trustScore>=50?'var(--amber)':'var(--rose)' }}>
                  Trust: {wallet?.trustScore ?? '—'}
                </span>
              </div>
              {wallet?.escrowBalance > 0 && (
                <div style={{ marginTop:10, padding:'8px 12px', background:'var(--amber-bg)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', fontSize:12, color:'var(--amber)' }}>
                  {wallet.escrowBalance} tokens held in escrow
                </div>
              )}
            </div>

            {/* Daily reward */}
            <div style={T.dailyCard} className="fade-up">
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--n-800)', marginBottom:3 }}>Daily reward</div>
                <div style={{ fontSize:12, color:'var(--n-400)' }}>50 free tokens every 24 hours</div>
              </div>
              <button className="nx-btn" onClick={handleDaily} disabled={dailyLoading} style={{ padding:'8px 16px', fontSize:13, flexShrink:0 }}>
                {dailyLoading ? '…' : 'Claim 50'}
              </button>
            </div>
          </div>

          {/* Right column */}
          <div style={T.rightCol}>
            <div style={T.topUpCard} className="fade-up">
              <div style={T.cardTitle}>Top up balance</div>
              <p style={{ fontSize:13, color:'var(--n-400)', marginBottom:20 }}>Max 500 tokens per top-up · Maximum balance 1,000 tokens</p>

              <div style={T.packages}>
                {PACKAGES.map(pkg => (
                  <div key={pkg.amount} style={{ ...T.pkg, ...(selected===pkg.amount ? T.pkgOn : {}), ...(pkg.highlight && selected!==pkg.amount ? T.pkgHighlight : {}) }} onClick={() => setSelected(pkg.amount)}>
                    {pkg.highlight && <div style={T.pkgBadge}>Most popular</div>}
                    <div style={T.pkgAmount}>{pkg.amount}</div>
                    <div style={T.pkgTag}>{pkg.tag}</div>
                    <div style={T.pkgNote}>{pkg.note}</div>
                  </div>
                ))}
              </div>

              <button className="nx-btn" onClick={handleAdd} disabled={loading} style={{ width:'100%', padding:'12px', fontSize:15, justifyContent:'center', marginTop:20 }}>
                {loading ? 'Processing…' : `Add ${selected} tokens`}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        {history.length > 0 && (
          <div style={T.historyCard} className="fade-up">
            <div style={T.cardTitle}>Transaction history</div>
            <div style={T.table}>
              <div style={T.tableHead}>
                <span>Description</span>
                <span>Date</span>
                <span style={{ textAlign:'right' }}>Amount</span>
              </div>
              {history.map((h, i) => (
                <div key={i} style={T.tableRow}>
                  <span style={{ fontSize:14, color:'var(--n-700)' }}>{h.description}</span>
                  <span style={{ fontSize:13, color:'var(--n-400)' }}>{new Date(h.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                  <span style={{ textAlign:'right', fontWeight:700, fontSize:14, color:h.type==='credit'?'var(--emerald)':'var(--rose)' }}>
                    {h.type==='credit' ? '+' : '−'}{h.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const T = {
  page: { maxWidth:1000, margin:'0 auto', padding:'28px 24px 56px', display:'flex', flexDirection:'column', gap:16 },
  title: { fontSize:26, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:3 },
  sub: { fontSize:13, color:'var(--n-400)' },
  layout: { display:'grid', gridTemplateColumns:'300px 1fr', gap:12, alignItems:'start' },
  leftCol: { display:'flex', flexDirection:'column', gap:10 },
  rightCol: {},
  balCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'22px', boxShadow:'var(--sh-sm)' },
  balLabel: { fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 },
  balNum: { fontSize:56, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.04em', lineHeight:1 },
  balUnit: { fontSize:13, color:'var(--n-400)', marginTop:3, marginBottom:16 },
  balBarWrap: { height:5, background:'var(--n-100)', borderRadius:3, overflow:'hidden', marginBottom:8 },
  balBarFill: { height:'100%', background:'linear-gradient(90deg, var(--brand), var(--brand-hover))', borderRadius:3, transition:'width .5s' },
  dailyCard: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'var(--surface)', border:'1px solid var(--emerald-bd)', borderRadius:'var(--r-lg)', padding:'14px 16px' },
  topUpCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'22px', boxShadow:'var(--sh-sm)' },
  cardTitle: { fontSize:16, fontWeight:700, color:'var(--n-800)', marginBottom:4 },
  packages: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  pkg: { padding:'16px', borderRadius:'var(--r-md)', border:'2px solid var(--border)', background:'var(--surface)', cursor:'pointer', transition:'all .15s', position:'relative', overflow:'hidden' },
  pkgOn: { border:'2px solid var(--brand)', background:'var(--brand-soft)' },
  pkgHighlight: { border:'2px solid var(--brand-border)' },
  pkgBadge: { position:'absolute', top:-1, right:-1, background:'var(--brand)', color:'white', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:'0 var(--r-md) 0 var(--r-md)' },
  pkgAmount: { fontSize:30, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.03em', lineHeight:1, marginBottom:4 },
  pkgTag: { fontSize:12, fontWeight:600, color:'var(--n-600)', marginBottom:2 },
  pkgNote: { fontSize:11, color:'var(--n-400)' },
  historyCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'22px', boxShadow:'var(--sh-xs)' },
  table: { marginTop:12 },
  tableHead: { display:'grid', gridTemplateColumns:'1fr 130px 80px', padding:'0 4px 10px', fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', gap:12, borderBottom:'1px solid var(--border)' },
  tableRow: { display:'grid', gridTemplateColumns:'1fr 130px 80px', padding:'12px 4px', borderBottom:'1px solid var(--n-50)', gap:12, alignItems:'center' },
};
