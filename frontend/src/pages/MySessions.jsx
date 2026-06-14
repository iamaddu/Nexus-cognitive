import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const STATUS_MAP = {
  pending:   { label:'Pending',   class:'nx-badge-yellow' },
  active:    { label:'Live',      class:'nx-badge-green' },
  completed: { label:'Completed', class:'nx-badge-blue' },
  cancelled: { label:'Cancelled', class:'nx-badge-red' },
  refunded:  { label:'Refunded',  class:'nx-badge-neutral' },
  disputed:  { label:'Disputed',  class:'nx-badge-yellow' },
};

function Stars({ val, onChange, readonly }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => !readonly && onChange?.(n)}
          style={{ background:'none', border:'none', cursor:readonly?'default':'pointer', fontSize:20, lineHeight:1, color:n<=val?'var(--amber)':'var(--n-200)', transition:'color .1s', padding:'0 1px' }}>
          ★
        </button>
      ))}
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.box} onClick={e=>e.stopPropagation()} className="fade-up">
        <div style={M.head}>
          <h3 style={M.title}>{title}</h3>
          <button style={M.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
const M = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.4)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:24 },
  box: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:28, width:'100%', maxWidth:440, boxShadow:'var(--sh-xl)' },
  head: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title: { fontSize:18, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.01em' },
  closeBtn: { width:30, height:30, borderRadius:8, background:'var(--n-100)', border:'none', color:'var(--n-500)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
};

export default function MySessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rateModal, setRateModal] = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [rateVal, setRateVal] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [disputeText, setDisputeText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try { const r = await API.get('/sessions/my-sessions'); setSessions(r.data); } catch {}
    setLoading(false);
  };

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this session? Your tokens will be fully refunded.')) return;
    try { await API.patch(`/sessions/${id}/cancel`); fetchSessions(); showToast('Session cancelled. Tokens refunded.'); }
    catch (err) { showToast(err.response?.data?.message || 'Cancel failed', 'error'); }
  };

  const handleRate = async () => {
    setActionLoading(true);
    try {
      await API.post(`/sessions/${rateModal.session._id}/rate`, { rating: rateVal, review: reviewText });
      fetchSessions(); setRateModal(null); showToast('Rating submitted. Thank you.');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to submit rating', 'error'); }
    setActionLoading(false);
  };

  const handleDispute = async () => {
    if (!disputeText.trim()) return showToast('Please describe what went wrong', 'error');
    setActionLoading(true);
    try {
      await API.post(`/sessions/${disputeModal._id}/dispute`, { reason: disputeText });
      fetchSessions(); setDisputeModal(null); showToast('Dispute submitted. Admin will review within 24 hours.');
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    setActionLoading(false);
  };

  const isLearner = (s) => s.learner?._id === user?.id || s.learner?.toString() === user?.id;

  const filtered = sessions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.skill?.toLowerCase().includes(q) || s.mentor?.name?.toLowerCase().includes(q) || s.learner?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile} />
      <div style={T.page}>
        <div style={T.header} className="fade-up">
          <div>
            <h1 style={T.title}>My Sessions</h1>
            <p style={T.sub}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} total</p>
          </div>
          <button className="nx-btn" onClick={() => navigate('/find-mentor')} style={{ padding:'9px 18px' }}>
            Book a session
          </button>
        </div>

        {toast && (
          <div style={{ ...T.toast, background: toast.type==='success' ? 'var(--emerald-bg)' : 'var(--rose-bg)', borderColor: toast.type==='success' ? 'var(--emerald-bd)' : 'var(--rose-bd)', color: toast.type==='success' ? 'var(--emerald)' : 'var(--rose)' }}>
            {toast.msg}
          </div>
        )}

        {/* Toolbar */}
        <div style={T.toolbar} className="fade-up">
          <div style={{ position:'relative', maxWidth:260 }}>
            <svg style={T.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="nx-input" placeholder="Search sessions…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32, fontSize:13 }} />
          </div>
          <div style={T.filters}>
            {['all','pending','active','completed','disputed','cancelled'].map(f => (
              <button key={f} style={{ ...T.chip, ...(filter===f ? T.chipOn : {}) }} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={T.centered}><div style={T.spinner}/><span style={{ color:'var(--n-400)' }}>Loading…</span></div>
        ) : filtered.length === 0 ? (
          <div style={T.centered}>
            <div style={T.emptyBox}>
              <div style={{ fontWeight:700, fontSize:16, color:'var(--n-700)', marginBottom:6 }}>
                {sessions.length === 0 ? 'No sessions yet' : 'No results'}
              </div>
              <p style={{ fontSize:14, color:'var(--n-400)', marginBottom:16 }}>
                {sessions.length === 0 ? 'Book your first session to start learning.' : 'Adjust the filter or search term.'}
              </p>
              {sessions.length === 0 && (
                <button className="nx-btn" onClick={() => navigate('/find-mentor')} style={{ padding:'9px 20px' }}>Find a Mentor</button>
              )}
            </div>
          </div>
        ) : (
          <div style={T.list}>
            {filtered.map(session => {
              const role = isLearner(session) ? 'learner' : 'mentor';
              const other = role === 'learner' ? session.mentor : session.learner;
              const sc = STATUS_MAP[session.status] || STATUS_MAP.cancelled;
              const alreadyRated = role==='learner' ? session.mentorRating !== undefined : session.learnerRating !== undefined;
              const myRating = role==='learner' ? session.mentorRating : session.learnerRating;

              return (
                <div key={session._id} style={T.card} className="fade-up">
                  <div style={T.cardMain}>
                    <div style={T.avatarWrap}>{other?.name?.[0]?.toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={T.personName}>{other?.name}</span>
                        <span className={`nx-badge ${sc.class}`}>{sc.label}</span>
                        {session.certificateIssued && <span className="nx-badge nx-badge-green">Certificate issued</span>}
                      </div>
                      <div style={T.metaRow}>
                        <span style={T.skill}>{session.skill}</span>
                        <span style={T.dot}>·</span>
                        <span style={T.meta}>{session.tokenCost} tokens</span>
                        <span style={T.dot}>·</span>
                        <span style={T.meta}>{role === 'learner' ? 'You are the learner' : 'You are the mentor'}</span>
                        <span style={T.dot}>·</span>
                        <span style={T.meta}>{new Date(session.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                      </div>
                      {session.quizScore !== undefined && (
                        <div style={{ marginTop:4 }}>
                          <span style={{ fontSize:12, fontWeight:600, color: session.quizPassed?'var(--emerald)':'var(--amber)' }}>
                            Quiz score: {session.quizScore}%{session.quizPassed ? ' — Passed' : ' — Not passed'}
                          </span>
                        </div>
                      )}
                      {alreadyRated && <div style={{ marginTop:6 }}><Stars val={myRating} readonly /></div>}
                    </div>
                    <div style={T.actions}>
                      {role==='mentor' && session.status==='pending' && (
                        <button className="nx-btn" onClick={() => navigate(`/session/${session._id}`)} style={{ fontSize:12, padding:'6px 13px' }}>Start</button>
                      )}
                      {session.status==='active' && (
                        <button className="nx-btn" onClick={() => navigate(`/session/${session._id}`)} style={{ fontSize:12, padding:'6px 13px' }}>Rejoin</button>
                      )}
                      {role==='learner' && session.status==='completed' && session.quizScore===undefined && (
                        <button className="nx-btn" onClick={() => navigate(`/quiz/${session._id}`)} style={{ fontSize:12, padding:'6px 13px', background:'var(--emerald)', border:'none' }}>Take Quiz</button>
                      )}
                      {session.status==='completed' && role==='learner' && session.certificateIssued && (
                        <button className="nx-btn-outline" onClick={() => navigate(`/certificate/${session._id}`)} style={{ fontSize:12, padding:'6px 13px' }}>Certificate</button>
                      )}
                      {session.status==='completed' && !alreadyRated && (
                        <button className="nx-btn-outline" onClick={() => { setRateModal({ session, role }); setRateVal(5); setReviewText(''); }} style={{ fontSize:12, padding:'6px 13px' }}>Rate</button>
                      )}
                      {role==='learner' && session.status==='completed' && !session.disputeReason && (
                        <button className="nx-btn-ghost" onClick={() => { setDisputeModal(session); setDisputeText(''); }} style={{ fontSize:12, padding:'6px 11px', color:'var(--rose)', borderColor:'var(--rose-bd)' }}>Dispute</button>
                      )}
                      {session.status==='pending' && (
                        <button className="nx-btn-ghost" onClick={() => handleCancel(session._id)} style={{ fontSize:12, padding:'6px 11px', color:'var(--rose)', borderColor:'var(--rose-bd)' }}>Cancel</button>
                      )}
                    </div>
                  </div>
                  {session.status==='disputed' && session.disputeReason && (
                    <div style={T.disputeBar}>
                      Dispute: {session.disputeReason} — Under admin review
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rate Modal */}
      <Modal show={!!rateModal} onClose={() => setRateModal(null)} title={`Rate ${rateModal?.role==='learner' ? 'your Mentor' : 'your Learner'}`}>
        <p style={{ fontSize:13, color:'var(--n-400)', marginBottom:20 }}>
          {rateModal?.role==='learner' ? rateModal?.session?.mentor?.name : rateModal?.session?.learner?.name} · {rateModal?.session?.skill}
        </p>
        <div style={{ marginBottom:16 }}>
          <label className="nx-label" style={{ marginBottom:8 }}>Overall rating</label>
          <Stars val={rateVal} onChange={setRateVal} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label className="nx-label">Write a review (optional)</label>
          <textarea className="nx-input" placeholder="Share what you learned or taught…" value={reviewText} onChange={e => setReviewText(e.target.value)} style={{ height:88, resize:'none', marginTop:6 }} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="nx-btn-outline" onClick={() => setRateModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button className="nx-btn" onClick={handleRate} disabled={actionLoading} style={{ flex:2, justifyContent:'center' }}>
            {actionLoading ? 'Submitting…' : 'Submit rating'}
          </button>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal show={!!disputeModal} onClose={() => setDisputeModal(null)} title="Raise a Dispute">
        <div style={{ padding:'12px 14px', background:'var(--amber-bg)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'var(--amber)', fontWeight:600, marginBottom:6 }}>Valid reasons to dispute:</p>
          <ul style={{ fontSize:13, color:'var(--n-600)', paddingLeft:16, lineHeight:2 }}>
            <li>Mentor didn't show up or arrived very late</li>
            <li>Session content was completely unrelated to the booked skill</li>
            <li>Session was ended prematurely with no teaching</li>
          </ul>
          <p style={{ fontSize:12, color:'var(--rose)', marginTop:8 }}>False disputes reduce your trust score.</p>
        </div>
        <div style={{ marginBottom:20 }}>
          <label className="nx-label">Describe the issue</label>
          <textarea className="nx-input" placeholder="Be specific — what happened during the session?" value={disputeText} onChange={e => setDisputeText(e.target.value)} style={{ height:100, resize:'none', marginTop:6 }} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="nx-btn-outline" onClick={() => setDisputeModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button className="nx-btn" onClick={handleDispute} disabled={actionLoading} style={{ flex:2, justifyContent:'center', background:'var(--rose)', boxShadow:'none' }}>
            {actionLoading ? 'Submitting…' : 'Submit dispute'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

const T = {
  page: { maxWidth:1100, margin:'0 auto', padding:'28px 24px 56px', display:'flex', flexDirection:'column', gap:16 },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 },
  title: { fontSize:26, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:3 },
  sub: { fontSize:13, color:'var(--n-400)' },
  toast: { padding:'10px 14px', borderRadius:'var(--r)', border:'1px solid', fontSize:13 },
  toolbar: { display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' },
  searchIcon: { position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--n-400)', pointerEvents:'none' },
  filters: { display:'flex', gap:5, flexWrap:'wrap' },
  chip: { padding:'5px 12px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border)', background:'var(--surface)', color:'var(--n-500)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all .15s' },
  chipOn: { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--brand-text)', fontWeight:600 },
  centered: { display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px 0' },
  spinner: { width:22, height:22, border:'2px solid var(--border)', borderTop:'2px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' },
  emptyBox: { textAlign:'center' },
  list: { display:'flex', flexDirection:'column', gap:8 },
  card: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--sh-xs)' },
  cardMain: { display:'flex', gap:14, padding:'14px 16px', alignItems:'center', flexWrap:'wrap' },
  avatarWrap: {
    width:40, height:40, borderRadius:12, flexShrink:0,
    background:'linear-gradient(135deg, var(--brand-soft), var(--brand-border))',
    color:'var(--brand-text)', fontSize:16, fontWeight:700,
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'1px solid var(--brand-border)',
  },
  personName: { fontWeight:700, fontSize:15, color:'var(--n-800)' },
  metaRow: { display:'flex', flexWrap:'wrap', alignItems:'center', gap:5 },
  skill: { fontSize:13, fontWeight:600, color:'var(--brand)' },
  dot: { color:'var(--n-300)', fontSize:12 },
  meta: { fontSize:12, color:'var(--n-400)' },
  actions: { display:'flex', gap:6, flexWrap:'wrap', marginLeft:'auto', alignItems:'center' },
  disputeBar: { padding:'8px 16px', background:'var(--amber-bg)', borderTop:'1px solid var(--amber-bd)', color:'var(--amber)', fontSize:12 },
};
