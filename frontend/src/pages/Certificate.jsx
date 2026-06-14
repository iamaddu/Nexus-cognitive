import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Certificate() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef(null);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.get(`/sessions/${sessionId}`).then(r => { setSession(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [sessionId]);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Certificate</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
      <style>body{margin:0;padding:40px;font-family:'Space Grotesk',sans-serif;background:#fff;} @media print{body{padding:0;}}</style>
      </head><body>${certRef.current?.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  if (loading) return <div style={s.root}><Navbar profile={profile} /></div>;

  if (!session?.certificateIssued) return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.empty}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No certificate available. Pass the quiz with 60%+ to earn one.</p>
        <button className="nx-btn-secondary" onClick={() => navigate('/my-sessions')}>← My Sessions</button>
      </div>
    </div>
  );

  const issuedDate = new Date(session.certificateIssuedAt || session.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const certId = `NXC-${session._id.toString().slice(-8).toUpperCase()}`;

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.page}>
        <div style={s.topRow}>
          <button className="nx-btn-ghost" onClick={() => navigate('/my-sessions')}>← My Sessions</button>
          <button className="nx-btn-secondary" onClick={handlePrint} style={{ fontSize: 13 }}>Print / Save PDF</button>
        </div>

        <div ref={certRef}>
          <div style={s.cert}>
            <div style={s.certBorderOuter}>
              <div style={s.certBorderInner}>
                <div style={s.certTop}>
                  <div style={s.certOrgName}>NEXUS COGNITIVE</div>
                  <div style={s.certOrgSub}>Peer Learning Marketplace</div>
                </div>

                <div style={s.certDivider} />

                <div style={s.certBody}>
                  <p style={s.certPre}>This certifies that</p>
                  <div style={s.certName}>{session.learner?.name}</div>
                  <p style={s.certPre}>has successfully completed a session in</p>
                  <div style={s.certSkill}>{session.skill}</div>
                  <p style={s.certPre}>under the mentorship of <strong style={{ color: '#1a1a2e' }}>{session.mentor?.name}</strong></p>
                </div>

                <div style={s.certDivider} />

                <div style={s.certFooter}>
                  <div style={s.certMeta}>
                    <div style={s.certMetaItem}><span style={s.certMetaLabel}>Score</span><span style={s.certMetaVal}>{session.quizScore}%</span></div>
                    <div style={s.certMetaItem}><span style={s.certMetaLabel}>Issued</span><span style={s.certMetaVal}>{issuedDate}</span></div>
                    <div style={s.certMetaItem}><span style={s.certMetaLabel}>ID</span><span style={s.certMetaVal}>{certId}</span></div>
                  </div>
                  <div style={s.certSeal}>
                    <div style={s.sealRing}>
                      <div style={s.sealInner}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.1em', color: '#1e3a5f', marginTop: 3 }}>VERIFIED</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={s.info}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Certificate ID: <code style={{ color: 'var(--brand-light)', fontFamily: 'monospace' }}>{certId}</code>
          </span>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: 'var(--ink)' },
  page: { maxWidth: 860, margin: '0 auto', padding: '36px 24px' },
  empty: { textAlign: 'center', padding: '80px 0' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  cert: { background: 'linear-gradient(135deg, #fafaf8 0%, #f4f0ff 50%, #fff8ed 100%)', borderRadius: 12, padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', marginBottom: 20 },
  certBorderOuter: { border: '2px solid #1e3a5f', borderRadius: 8, padding: 4 },
  certBorderInner: { border: '1px solid rgba(30,58,95,0.25)', borderRadius: 6, padding: '44px 56px' },
  certTop: { textAlign: 'center', marginBottom: 24 },
  certOrgName: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: '#1a1a2e', letterSpacing: '.12em', marginBottom: 4 },
  certOrgSub: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: '#888', letterSpacing: '.15em', textTransform: 'uppercase' },
  certDivider: { height: 1, background: 'linear-gradient(90deg, transparent, rgba(30,58,95,0.25), transparent)', margin: '22px 0' },
  certBody: { textAlign: 'center', marginBottom: 0 },
  certPre: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 6 },
  certName: { fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 36, color: '#1a1a2e', marginBottom: 12, letterSpacing: '0.01em' },
  certSkill: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: '#1e3a5f', marginBottom: 10 },
  certFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  certMeta: { display: 'flex', gap: 32 },
  certMetaItem: { display: 'flex', flexDirection: 'column', gap: 3 },
  certMetaLabel: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em' },
  certMetaVal: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#1a1a2e' },
  certSeal: {},
  sealRing: { width: 72, height: 72, borderRadius: '50%', border: '2.5px solid #1e3a5f', background: 'rgba(30,58,95,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sealInner: { textAlign: 'center' },
  info: { textAlign: 'center', padding: '12px 0' },
};
