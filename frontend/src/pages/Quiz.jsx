import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Quiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.post('/quiz/generate', { sessionId })
      .then(r => { setQuestions(r.data.questions); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load quiz'); setLoading(false); });
  }, [sessionId]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return setError('Please answer all questions');
    setSubmitting(true); setError('');
    try {
      const answersArray = questions.map((_, i) => answers[i] ?? -1);
      const res = await API.post('/quiz/submit', { sessionId, answers: answersArray, questions });
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;
  const answered = Object.keys(answers).length;

  if (!loading && error === 'Quiz already taken') return (
    <div style={s.root}><Navbar profile={profile} />
      <div style={s.content}>
        <div style={s.empty}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:8 }}>Quiz already submitted</div>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:20 }}>You can only take the quiz once per session.</p>
          <button className="nx-btn-ghost" onClick={() => navigate('/my-sessions')}>Back to sessions</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <button onClick={() => navigate('/my-sessions')} style={s.back}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          My Sessions
        </button>

        {loading ? (
          <div style={s.empty}>
            <div style={s.spinner} />
            <p style={{ color:'var(--text2)', marginTop:14, fontSize:13 }}>Generating questions with AI…</p>
          </div>
        ) : error && !questions.length ? (
          <div style={s.empty}>
            <p style={{ color:'#f87171', marginBottom:14 }}>{error}</p>
            <button className="nx-btn-ghost" onClick={() => navigate('/my-sessions')}>Back to sessions</button>
          </div>
        ) : result ? (
          <div style={s.resultWrap} className="animate-in">
            <div style={{ ...s.resultScore, color: result.passed ? '#10b981' : '#f59e0b' }}>
              {result.score}<span style={{ fontSize:28, marginLeft:4 }}>%</span>
            </div>
            <h2 style={{ ...s.resultTitle, color: result.passed ? '#10b981' : '#f59e0b' }}>
              {result.passed ? 'Quiz passed' : 'Keep practicing'}
            </h2>
            <p style={{ color:'var(--text2)', fontSize:14, marginBottom:6 }}>{result.correct} / {result.total} correct</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:13, color: result.passed ? '#10b981' : '#ef4444', marginBottom:24 }}>
              Trust score {result.passed ? '+5' : '−2'}
            </p>
            {result.passed && (
              <div style={s.certNotice}>
                Certificate issued — view it in My Sessions
              </div>
            )}
            <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.7, marginBottom:28, maxWidth:420 }}>
              {result.passed ? 'Your knowledge is verified. Your trust score has been updated.' : 'Score 60% or higher to pass. Book another session to strengthen your understanding.'}
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="nx-btn" onClick={() => navigate('/my-sessions')} style={{ padding:'11px 24px' }}>Back to sessions</button>
              {!result.passed && <button className="nx-btn-ghost" onClick={() => navigate('/find-mentor')}>Find another mentor</button>}
            </div>
          </div>
        ) : (
          <>
            <div style={s.quizHeader} className="fade-up">
              <div>
                <h1 style={s.title}>Knowledge check</h1>
                <p style={s.sub}>{questions.length} questions · 60% to pass · One attempt only</p>
              </div>
              <div style={s.progressCircle}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:500, color: answered === questions.length ? '#10b981' : 'var(--text)' }}>{answered}</span>
                <span style={{ fontSize:12, color:'var(--text3)' }}>/{questions.length}</span>
              </div>
            </div>

            <div style={s.questions}>
              {questions.map((q, qi) => (
                <div key={qi} style={s.qCard} className={`fade-up-${Math.min(qi+1,4)}`}>
                  <div style={s.qNum}>Question {qi + 1}</div>
                  <div style={s.qText}>{q.question}</div>
                  <div style={s.options}>
                    {q.options.map((opt, ai) => (
                      <button key={ai}
                        style={{ ...s.option, ...(answers[qi]===ai ? s.optionSel : {}) }}
                        onClick={() => setAnswers(prev => ({ ...prev, [qi]: ai }))}
                      >
                        <span style={{ ...s.optLetter, ...(answers[qi]===ai ? { background:'rgba(59,130,246,0.2)', color:'#60a5fa' } : {}) }}>{'ABCD'[ai]}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={s.dotRow}>
                {questions.map((_, i) => <div key={i} style={{ ...s.dot, background: answers[i]!==undefined?'#3b82f6':'var(--bg3)' }} />)}
              </div>
              <button className="nx-btn" onClick={handleSubmit} disabled={submitting || !allAnswered} style={{ padding:'12px 32px', opacity: allAnswered?1:0.5 }}>
                {submitting ? 'Submitting…' : allAnswered ? 'Submit quiz' : `${answered} / ${questions.length} answered`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'var(--bg)' },
  content: { maxWidth:720, margin:'0 auto', padding:'40px 28px', display:'flex', flexDirection:'column', gap:24 },
  back: { display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, padding:0, alignSelf:'flex-start' },
  empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'70px 0', textAlign:'center' },
  spinner: { width:28, height:28, border:'2px solid var(--border)', borderTop:'2px solid #3b82f6', borderRadius:'50%', animation:'spin 0.7s linear infinite' },
  quizHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 },
  title: { fontFamily:'var(--font-serif)', fontSize:30, fontWeight:400, color:'var(--text)', marginBottom:6 },
  sub: { fontSize:13, color:'var(--text2)' },
  progressCircle: { display:'flex', alignItems:'baseline', gap:3, padding:'12px 18px', background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:10 },
  questions: { display:'flex', flexDirection:'column', gap:12 },
  qCard: { background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 22px' },
  qNum: { fontSize:11, fontWeight:600, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 },
  qText: { fontSize:15, color:'var(--text)', fontWeight:500, marginBottom:14, lineHeight:1.5 },
  options: { display:'flex', flexDirection:'column', gap:7 },
  option: { display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:9, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', fontSize:14, cursor:'pointer', transition:'all 0.15s', textAlign:'left' },
  optionSel: { border:'1px solid rgba(59,130,246,0.5)', background:'rgba(59,130,246,0.08)', color:'var(--text)' },
  optLetter: { width:22, height:22, borderRadius:6, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--text3)', flexShrink:0, transition:'all 0.15s' },
  dotRow: { display:'flex', gap:6, flex:1 },
  dot: { width:8, height:8, borderRadius:'50%', transition:'background 0.2s' },
  error: { padding:'9px 13px', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#f87171', fontSize:13 },
  resultWrap: { textAlign:'center', padding:'40px 0', display:'flex', flexDirection:'column', alignItems:'center' },
  resultScore: { fontFamily:'var(--font-mono)', fontSize:72, fontWeight:500, lineHeight:1, marginBottom:12 },
  resultTitle: { fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400, marginBottom:8 },
  certNotice: { padding:'10px 20px', background:'var(--green-dim)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:9, color:'#34d399', fontSize:13, marginBottom:16 },
};
