import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { useDropzone } from 'react-dropzone';

export default function SessionWorkspace() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [ending, setEnding] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [code, setCode] = useState('// Start coding here...\nconsole.log("Hello, Nexus!");');
  const [language, setLanguage] = useState('javascript');
  const [files, setFiles] = useState([]);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [runOutput, setRunOutput] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingIceRef = useRef([]);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchSession();
    const socketBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketBaseUrl);
    socketRef.current.emit('join-session', sessionId);
    socketRef.current.on('receive-message', (msg) => setMessages(p => [...p, msg]));

    // WebRTC listeners
    socketRef.current.on('webrtc-offer', handleOffer);
    socketRef.current.on('webrtc-answer', handleAnswer);
    socketRef.current.on('webrtc-ice', handleIceCandidate);

    return () => {
      socketRef.current?.off('receive-message');
      socketRef.current?.off('webrtc-offer');
      socketRef.current?.off('webrtc-answer');
      socketRef.current?.off('webrtc-ice');
      socketRef.current?.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const fetchSession = async () => {
    try { const r = await API.get(`/sessions/${sessionId}`); setSession(r.data); setMessages(r.data.messages || []); } catch {}
  };

  const handleStart = async () => {
    try { await API.patch(`/sessions/${sessionId}/start`); fetchSession(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to start'); }
  };

  const handleEnd = async () => {
    if (!window.confirm('End session now? Tokens will be released to you.')) return;
    setEnding(true);
    try { await API.patch(`/sessions/${sessionId}/end`); fetchSession(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to end'); }
    setEnding(false);
  };

  const sendMsg = () => {
    if (!newMsg.trim()) return;
    const msg = { sender: user?.id, senderName: user?.name, text: newMsg, timestamp: new Date() };
    socketRef.current?.emit('send-message', { sessionId, message: msg });
    setNewMsg('');
  };

  // WebRTC Functions using native API
  const getMediaStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media devices are not available in this browser.');
    }

    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (fullMediaError) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch {
        try {
          return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch {
          throw fullMediaError;
        }
      }
    }
  };

  const attachLocalStream = (mediaStream) => {
    streamRef.current = mediaStream;
    setStream(mediaStream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStream;
    }
  };

  const rememberCameraStream = (mediaStream) => {
    cameraStreamRef.current = mediaStream;
    attachLocalStream(mediaStream);
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc-ice', {
          sessionId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      setRemoteStream(incomingStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = incomingStream;
      }
    };

    peerConnectionRef.current = pc;
    setPeerConnection(pc);
    return pc;
  };

  const flushPendingIceCandidates = async (pc) => {
    while (pendingIceRef.current.length > 0) {
      const candidate = pendingIceRef.current.shift();
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const createOffer = async (pc) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('webrtc-offer', { sessionId, offer });
  };

  const startVideoCall = async () => {
    try {
      setActiveTab('video');
      const mediaStream = await getMediaStream();
      rememberCameraStream(mediaStream);
      const pc = createPeerConnection();

      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      setIsVideoCall(true);
      await createOffer(pc);

    } catch (err) {
      alert('Failed to access camera/microphone: ' + err.message);
    }
  };

  const handleOffer = async (offer) => {
    try {
      setActiveTab('video');
      let mediaStream = streamRef.current;
      if (!mediaStream) {
        try {
          mediaStream = await getMediaStream();
          rememberCameraStream(mediaStream);
        } catch (mediaErr) {
          console.warn('Answering call without local camera/microphone:', mediaErr.message);
        }
      } else {
        attachLocalStream(mediaStream);
      }
      const pc = createPeerConnection();

      mediaStream?.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIceCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setIsVideoCall(true);

      socketRef.current?.emit('webrtc-answer', { sessionId, answer });

    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingIceCandidates(pc);
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingIceRef.current.push(candidate);
      }
    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  };

  const endVideoCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    cameraStreamRef.current = null;
    setStream(null);
    setPeerConnection(null);
    setRemoteStream(null);
    setIsVideoCall(false);
    setIsScreenSharing(false);
  };

  const startScreenShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not available in this browser.');
      }

      setActiveTab('video');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) throw new Error('No screen video track was selected.');

      screenStreamRef.current = displayStream;
      attachLocalStream(displayStream);
      setIsScreenSharing(true);
      screenTrack.onended = () => stopScreenShare();

      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = createPeerConnection();
        displayStream.getTracks().forEach(track => pc.addTrack(track, displayStream));
        setIsVideoCall(true);
        await createOffer(pc);
        return;
      }

      const videoSender = pc.getSenders().find(sender => sender.track?.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, displayStream);
        await createOffer(pc);
      }
    } catch (err) {
      alert('Failed to share screen: ' + err.message);
    }
  };

  const stopScreenShare = async () => {
    if (!isScreenSharing && !screenStreamRef.current) return;

    const pc = peerConnectionRef.current;
    const cameraTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
    const videoSender = pc?.getSenders().find(sender => sender.track?.kind === 'video');

    if (videoSender) {
      await videoSender.replaceTrack(cameraTrack || null);
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      attachLocalStream(cameraStreamRef.current);
    }

    setIsScreenSharing(false);
  };

  const runCode = () => {
    setRunOutput('');
    setPreviewHtml('');

    if (language === 'javascript') {
      const logs = [];
      const sandboxConsole = {
        log: (...args) => logs.push(args.map(String).join(' ')),
        warn: (...args) => logs.push(`Warning: ${args.map(String).join(' ')}`),
        error: (...args) => logs.push(`Error: ${args.map(String).join(' ')}`),
      };

      try {
        const result = Function('console', `"use strict";\n${code}`)(sandboxConsole);
        if (result !== undefined) logs.push(String(result));
        setRunOutput(logs.length ? logs.join('\n') : 'Code ran successfully.');
      } catch (err) {
        setRunOutput(`Error: ${err.message}`);
      }
      return;
    }

    if (language === 'html') {
      setPreviewHtml(code);
      setRunOutput('HTML preview rendered.');
      return;
    }

    if (language === 'css') {
      setPreviewHtml(`<style>${code}</style><main class="preview-card"><h1>Nexus Preview</h1><p>Your CSS is applied to this sample content.</p><button>Sample button</button></main>`);
      setRunOutput('CSS preview rendered.');
      return;
    }

    setRunOutput(`${language.toUpperCase()} execution needs a backend/compiler service. Browser run is enabled for JavaScript, HTML, and CSS.`);
  };

  // File handling
  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Canvas drawing functions
  const startDrawing = ({ nativeEvent }) => {
    if (!contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const updateBrushSettings = () => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = brushColor;
      contextRef.current.lineWidth = brushSize;
    }
  };

  useEffect(() => {
    updateBrushSettings();
  }, [brushColor, brushSize]);

  useEffect(() => {
    if (activeTab !== 'whiteboard' || !canvasRef.current || contextRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 400;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    contextRef.current = context;
  }, [activeTab, brushColor, brushSize]);

  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream, isVideoCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideoCall]);

  const isMentor = session?.mentor?._id === user?.id || session?.mentor?.toString() === user?.id;
  const isLearner = session?.learner?._id === user?.id || session?.learner?.toString() === user?.id;
  const other = isMentor ? session?.learner : session?.mentor;

  const statusInfo = {
    pending:   { text:'Waiting for mentor to start', color:'var(--amber)', bg:'var(--amber-bg)', bd:'var(--amber-bd)' },
    active:    { text:'Session is live', color:'var(--emerald)', bg:'var(--emerald-bg)', bd:'var(--emerald-bd)' },
    completed: { text:`Session ended${isLearner && !session?.quizScore ? ' — take the quiz to earn a certificate' : ''}`, color:'var(--brand)', bg:'var(--brand-soft)', bd:'var(--brand-border)' },
  };
  const si = session ? (statusInfo[session.status] || statusInfo.pending) : null;

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <Navbar profile={profile} />
      <div style={T.content}>
        {/* Header bar */}
        <div style={T.header}>
          <button style={T.backBtn} onClick={() => navigate('/my-sessions')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            My sessions
          </button>
          {session && (
            <div style={T.sessionInfo}>
              <span style={T.sessionSkill}>{session.skill}</span>
              <span style={T.sessionWith}>with {other?.name}</span>
            </div>
          )}
          <div style={T.headerActions}>
            {isMentor && session?.status === 'pending' && (
              <button className="nx-btn" onClick={handleStart} style={{ background:'var(--emerald)', boxShadow:'0 1px 4px rgba(5,150,105,.3)', fontSize:13, padding:'7px 16px' }}>Start session</button>
            )}
            {isMentor && session?.status === 'active' && (
              <button className="nx-btn" onClick={handleEnd} disabled={ending} style={{ background:'var(--rose)', boxShadow:'none', fontSize:13, padding:'7px 16px' }}>
                {ending ? 'Ending…' : 'End session'}
              </button>
            )}
            {isLearner && session?.status === 'completed' && !session?.quizScore && (
              <button className="nx-btn" onClick={() => navigate(`/quiz/${sessionId}`)} style={{ background:'var(--emerald)', boxShadow:'0 1px 4px rgba(5,150,105,.3)', fontSize:13, padding:'7px 16px' }}>Take quiz</button>
            )}
          </div>
        </div>

        {si && (
          <div style={{ ...T.statusBar, background:si.bg, borderColor:si.bd, color:si.color }}>
            <span style={{ ...T.statusDot, background:si.color }}/>
            {si.text}
          </div>
        )}

        {/* Workspace */}
        <div style={T.workspace}>
          {/* Main Content Area */}
          <div style={{ ...T.pane, flex: 2 }}>
            <div style={T.paneHead}>Session Tools</div>

            {/* Tab Navigation */}
            <div style={T.tabBar}>
              {[
                { id: 'notes', label: '📝 Notes', icon: '📝' },
                { id: 'editor', label: '💻 Code Editor', icon: '💻' },
                { id: 'whiteboard', label: '🎨 Whiteboard', icon: '🎨' },
                { id: 'files', label: '📁 Files', icon: '📁' },
                { id: 'video', label: '📹 Video Call', icon: '📹' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ ...T.tab, ...(activeTab === tab.id ? T.tabActive : {}) }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={T.tabContent}>
              {activeTab === 'notes' && (
                <textarea
                  style={T.notesArea}
                  placeholder="Take notes during your session — they're only visible to you…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              )}

              {activeTab === 'editor' && (
                <div style={T.editorContainer}>
                  <div style={T.editorToolbar}>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      style={T.languageSelect}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                    </select>
                    <button className="nx-btn" onClick={runCode} style={T.runBtn}>Run</button>
                  </div>
                  <Editor
                    height="400px"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                    }}
                  />
                  <div style={T.outputPanel}>
                    <div style={T.outputHead}>Output</div>
                    {previewHtml ? (
                      <iframe title="Code preview" sandbox="allow-scripts" srcDoc={previewHtml} style={T.previewFrame} />
                    ) : (
                      <pre style={T.outputText}>{runOutput || 'Run JavaScript, HTML, or CSS to see output here.'}</pre>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'whiteboard' && (
                <div style={T.whiteboardContainer}>
                  <div style={T.whiteboardToolbar}>
                    <button
                      onClick={clearCanvas}
                      style={T.whiteboardBtn}
                    >
                      🗑️ Clear
                    </button>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      style={T.colorPicker}
                    />
                    <select
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      style={T.brushSize}
                    >
                      <option value="1">Thin</option>
                      <option value="3">Normal</option>
                      <option value="5">Thick</option>
                      <option value="8">Extra Thick</option>
                    </select>
                  </div>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={T.canvas}
                  />
                </div>
              )}

              {activeTab === 'files' && (
                <div style={T.filesContainer}>
                  <div {...getRootProps()} style={T.dropzone}>
                    <input {...getInputProps()} />
                    <div style={T.dropzoneContent}>
                      <div style={T.dropzoneIcon}>📁</div>
                      <p>Drop files here or click to browse</p>
                      <small>Share documents, code files, or resources</small>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div style={T.fileList}>
                      {files.map(file => (
                        <div key={file.id} style={T.fileItem}>
                          <div style={T.fileInfo}>
                            <span style={T.fileName}>{file.name}</span>
                            <span style={T.fileSize}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <div style={T.fileActions}>
                            <a
                              href={file.url}
                              download={file.name}
                              style={T.downloadBtn}
                            >
                              📥
                            </a>
                            <button
                              onClick={() => removeFile(file.id)}
                              style={T.removeBtn}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'video' && (
                <div style={T.videoContainer}>
                  {!isVideoCall ? (
                    <div style={T.videoPlaceholder}>
                      <div style={T.videoIcon}>📹</div>
                      <h3>Start a Video Call</h3>
                      <p>Connect face-to-face with your mentor or learner</p>
                      <button
                        onClick={startVideoCall}
                        style={T.startVideoBtn}
                        disabled={session?.status !== 'active'}
                      >
                        🎥 Start Video Call
                      </button>
                      <button
                        onClick={startScreenShare}
                        style={T.shareStartBtn}
                        disabled={session?.status !== 'active'}
                      >
                        Share screen
                      </button>
                    </div>
                  ) : (
                    <div style={T.videoCallWrap}>
                      <div style={T.videoGrid}>
                        <div style={T.videoWrapper}>
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            style={T.video}
                          />
                          <div style={T.videoLabel}>{isScreenSharing ? 'Your screen' : 'You'}</div>
                        </div>
                        {remoteStream && (
                          <div style={T.videoWrapper}>
                            <video
                              ref={remoteVideoRef}
                              autoPlay
                              style={T.video}
                            />
                            <div style={T.videoLabel}>{other?.name}</div>
                          </div>
                        )}
                      </div>
                      <div style={T.videoControls}>
                        <button className="nx-btn-outline" onClick={isScreenSharing ? stopScreenShare : startScreenShare} style={T.callControlBtn}>
                          {isScreenSharing ? 'Stop sharing' : 'Share screen'}
                        </button>
                        <button onClick={endVideoCall} style={T.endVideoBtn}>
                          End Call
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div style={{ ...T.pane, width: 340, flexShrink: 0 }}>
            <div style={T.paneHead}>Chat</div>
            <div style={T.chatBody} ref={chatRef}>
              {messages.length === 0 ? (
                <div style={T.chatEmpty}>Start the conversation</div>
              ) : messages.map((m, i) => {
                const mine = m.sender === user?.id || m.senderName === user?.name;
                return (
                  <div key={i} style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start', marginBottom:8 }}>
                    <div style={{ ...T.bubble, ...(mine ? T.bubbleMine : T.bubbleOther) }}>
                      {!mine && <div style={T.senderName}>{m.senderName}</div>}
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={T.chatInput}>
              <input className="nx-input" placeholder="Type a message…" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMsg()} style={{ flex:1, fontSize:13 }} />
              <button className="nx-btn" onClick={sendMsg} style={{ flexShrink:0, padding:'9px 14px', fontSize:13 }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const T = {
  content: { flex:1, maxWidth:1400, width:'100%', margin:'0 auto', padding:'12px 24px 16px', display:'flex', flexDirection:'column', gap:10, overflow:'hidden' },
  header: { display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' },
  backBtn: { display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--n-400)', cursor:'pointer', fontSize:13, fontFamily:'var(--f)', padding:0 },
  sessionInfo: { flex:1 },
  sessionSkill: { fontWeight:800, fontSize:18, color:'var(--n-900)', letterSpacing:'-.01em', marginRight:8 },
  sessionWith: { fontSize:13, color:'var(--n-400)' },
  headerActions: { display:'flex', gap:8, marginLeft:'auto' },
  statusBar: { display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:'var(--r)', border:'1px solid', fontSize:13, fontWeight:500 },
  statusDot: { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  workspace: { flex:1, display:'flex', gap:10, minHeight:0 },
  pane: { flex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', display:'flex', flexDirection:'column', padding:14, boxShadow:'var(--sh-xs)', minHeight:0 },
  paneHead: { fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10, flexShrink:0 },
  notesArea: { flex:1, background:'var(--n-50)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--n-800)', padding:12, fontSize:14, resize:'none', outline:'none', lineHeight:1.7, fontFamily:'var(--f)' },
  chatBody: { flex:1, overflowY:'auto', padding:'4px 0', minHeight:0 },
  chatEmpty: { color:'var(--n-300)', textAlign:'center', padding:'20px 0', fontSize:13 },
  bubble: { maxWidth:'78%', padding:'7px 11px', borderRadius:10, fontSize:14, lineHeight:1.5 },
  bubbleMine: { background:'var(--brand)', color:'white', borderBottomRightRadius:3 },
  bubbleOther: { background:'var(--n-100)', color:'var(--n-800)', borderBottomLeftRadius:3 },
  senderName: { fontSize:11, fontWeight:700, color:'var(--n-400)', marginBottom:2 },
  chatInput: { display:'flex', gap:7, marginTop:10, flexShrink:0 },

  // Tab system
  tabBar: { display:'flex', gap:2, marginBottom:16, borderBottom:'1px solid var(--border)' },
  tab: { padding:'8px 16px', background:'none', borderTop:'none', borderRight:'none', borderLeft:'none', borderBottomWidth:2, borderBottomStyle:'solid', borderBottomColor:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:'var(--n-500)', transition:'all 0.2s' },
  tabActive: { color:'var(--brand)', borderBottomColor:'var(--brand)' },
  tabContent: { flex:1, minHeight:0 },

  // Editor
  editorContainer: { display:'flex', flexDirection:'column', height:'100%', minHeight:0 },
  editorToolbar: { display:'flex', gap:8, marginBottom:8, alignItems:'center' },
  languageSelect: { padding:'4px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:12 },
  runBtn: { marginLeft:'auto', padding:'6px 16px', fontSize:12, boxShadow:'none' },
  outputPanel: { marginTop:10, border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', background:'var(--n-900)', minHeight:118, flexShrink:0 },
  outputHead: { padding:'7px 10px', background:'var(--n-800)', color:'var(--n-200)', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' },
  outputText: { margin:0, padding:12, color:'var(--n-50)', fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap', fontFamily:'var(--f-mono)' },
  previewFrame: { width:'100%', height:170, border:'none', background:'white', display:'block' },

  // Whiteboard
  whiteboardContainer: { display:'flex', flexDirection:'column', height:'100%' },
  whiteboardToolbar: { display:'flex', gap:8, marginBottom:8, alignItems:'center' },
  whiteboardBtn: { padding:'6px 12px', background:'var(--n-100)', border:'1px solid var(--border)', borderRadius:'var(--r)', cursor:'pointer', fontSize:12 },
  colorPicker: { width:40, height:32, border:'1px solid var(--border)', borderRadius:'var(--r)', cursor:'pointer' },
  brushSize: { padding:'4px 8px', border:'1px solid var(--border)', borderRadius:'var(--r)', fontSize:12 },
  canvas: { border:'1px solid var(--border)', borderRadius:'var(--r)', background:'white', flex:1 },

  // Files
  filesContainer: { display:'flex', flexDirection:'column', height:'100%' },
  dropzone: { border:'2px dashed var(--border)', borderRadius:'var(--r)', padding:40, textAlign:'center', cursor:'pointer', transition:'border-color 0.2s', flex:1, display:'flex', alignItems:'center', justifyContent:'center' },
  dropzoneContent: { color:'var(--n-400)' },
  dropzoneIcon: { fontSize:48, marginBottom:16 },
  fileList: { marginTop:16, maxHeight:200, overflowY:'auto' },
  fileItem: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'var(--n-50)', borderRadius:'var(--r)', marginBottom:4 },
  fileInfo: { flex:1 },
  fileName: { fontWeight:500, fontSize:13 },
  fileSize: { fontSize:11, color:'var(--n-400)', marginLeft:8 },
  fileActions: { display:'flex', gap:4 },
  downloadBtn: { textDecoration:'none', padding:'4px', borderRadius:'var(--r)', background:'var(--emerald-bg)', color:'var(--emerald)' },
  removeBtn: { padding:'4px', border:'none', borderRadius:'var(--r)', background:'var(--rose-bg)', color:'var(--rose)', cursor:'pointer' },

  // Video
  videoContainer: { display:'flex', flexDirection:'column', height:'100%', alignItems:'center', justifyContent:'center' },
  videoPlaceholder: { textAlign:'center', color:'var(--n-400)' },
  videoIcon: { fontSize:64, marginBottom:16 },
  startVideoBtn: { padding:'12px 24px', background:'var(--emerald)', color:'white', border:'none', borderRadius:'var(--r)', cursor:'pointer', fontSize:16, fontWeight:500 },
  shareStartBtn: { display:'block', margin:'10px auto 0', padding:'10px 20px', background:'var(--brand)', color:'white', border:'none', borderRadius:'var(--r)', cursor:'pointer', fontSize:14, fontWeight:600 },
  videoCallWrap: { display:'flex', flexDirection:'column', gap:14, width:'100%', alignItems:'center' },
  videoGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%', maxWidth:600 },
  videoWrapper: { position:'relative', background:'var(--n-900)', borderRadius:'var(--r)', overflow:'hidden' },
  video: { width:'100%', height:200, objectFit:'cover' },
  videoLabel: { position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.7)', color:'white', padding:'4px 8px', borderRadius:'var(--r)', fontSize:12 },
  videoControls: { display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' },
  callControlBtn: { padding:'8px 16px', fontSize:13 },
  endVideoBtn: { padding:'8px 16px', background:'var(--rose)', color:'white', border:'none', borderRadius:'var(--r)', cursor:'pointer', fontWeight:600 },
};
