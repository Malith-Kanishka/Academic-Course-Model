import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const AI_BASE = 'http://localhost:8000';

/* ─── i18n strings ──────────────────────────────────────────────────────── */
const STRINGS = {
  en: {
    newChat:        '+ New Chat',
    chatSessions:   'Chat Sessions',
    noSessions:     'No sessions yet. Send a message to start one.',
    welcome:        'Welcome to Academic Intelligence',
    welcomeSub:     'Your domain-scoped assistant for ACM system workflows,\nacademic processes, and uploaded documents.',
    topicSummary:   'Document Summary',
    topicAction:    'Key Action Items',
    topicGuidance:  'Academic Guidance',
    topicAsk:       'Ask Anything',
    topicSubSummary:'Summarize the core takeaways from my uploaded file',
    topicSubAction: 'Extract key rules, guidelines, or deadlines from the document',
    topicSubGuidance:'Help me understand standard academic workflow procedures',
    topicSubAsk:    'Ask a question about your uploaded file or academic processes',
    inputPlaceholder: 'Ask about ACM system, academic processes, or uploaded PDFs…',
    uploadPdf:      'Attach PDF',
    send:           'Send',
    pdfChunks:      (n) => `📄 ${n} PDF chunk${n !== 1 ? 's' : ''} in context`,
    clearCtx:       '✕ clear',
    aiUnavailable:  'AI service unavailable. Check that acm_ai is running and GROQ_API_KEY is set.',
    uploadFailed:   (msg) => `⚠️ Upload failed: ${msg}`,
    pdfLoaded:      (name, n) => `📄 **${name}** uploaded — ${n} context chunk${n !== 1 ? 's' : ''} extracted.`,
    typing:         'Academic Intelligence is typing…',
    deleteSession:  'Delete session',
  },
  si: {
    newChat:        '+ නව සංවාදය',
    chatSessions:   'සංවාද ලැයිස්තුව',
    noSessions:     'සංවාද නොමැත. පණිවිඩයක් යැවීමෙන් ආරම්භ කරන්න.',
    welcome:        'ශාස්ත්‍රීය බුද්ධිමත් පද්ධතියට සාදරයෙන් පිළිගනිමු',
    welcomeSub:     'ACM පද්ධති ක්‍රියාපටිපාටි, ශාස්ත්‍රීය ක්‍රියාවලි සහ\nඅップ්ලෝඩ් ලේඛන සඳහා ඔබේ සහායකයා.',
    topicSummary:   'ලේඛන සාරාංශය',
    topicAction:    'ප්‍රධාන ක්‍රියාමාර්ග',
    topicGuidance:  'ශාස්ත්‍රීය මාර්ගෝපදේශ',
    topicAsk:       'ඕනෑම දෙයක් අසන්න',
    topicSubSummary:'මගේ අප්ලෝඩ් කළ ලේඛනයෙන් ප්‍රධාන කරුණු සාරාංශ කරන්න',
    topicSubAction: 'ලේඛනයෙන් ප්‍රධාන නීති, මාර්ගෝපදේශ, හෝ කාලසීමා උපුටා ගන්න',
    topicSubGuidance:'සම්මත ශාස්ත්‍රීය කාර්ය ප්‍රවාහ ක්‍රියා පටිපාටි තේරුම් ගැනීමට මට උදව් කරන්න',
    topicSubAsk:    'ඔබේ අප්ලෝඩ් කළ ලේඛනය හෝ ශාස්ත්‍රීය ක්‍රියාවලි ගැන ප්‍රශ්නයක් අසන්න',
    inputPlaceholder: 'ACM ගැන, ශාස්ත්‍රීය ක්‍රියාවලි ගැන, හෝ PDF ගැන අසන්න…',
    uploadPdf:      'PDF ඇමිණීම',
    send:           'යවන්න',
    pdfChunks:      (n) => `📄 PDF කොටස් ${n}ක් සන්දර්භයේ`,
    clearCtx:       '✕ ඉවත් කරන්න',
    aiUnavailable:  'AI සේවාව ලබා ගත නොහැක. acm_ai ධාවනය වේ දැයි පරීක්‍ෂා කරන්න.',
    uploadFailed:   (msg) => `⚠️ PDF ඇමිණීම අසාර්ථකයි: ${msg}`,
    pdfLoaded:      (name, n) => `📄 **${name}** ඇමිණිණි — සන්දර්භ කොටස් ${n}ක් ලබා ගන්නා ලදී.`,
    typing:         'ශාස්ත්‍රීය බුද්ධිය ටයිප් කරමින් සිටී…',
    deleteSession:  'සංවාදය මකන්න',
  },
};

/* ─── Topic Cards config ─────────────────────────────────────────────────── */
const TOPICS = (t) => [
  { key: 'summary',  icon: '📄', title: t.topicSummary,  sub: t.topicSubSummary,
    prompt: 'Please summarize the core takeaways from my uploaded file.' },
  { key: 'action',   icon: '🔍', title: t.topicAction,   sub: t.topicSubAction,
    prompt: 'Extract key rules, guidelines, or deadlines from the uploaded document.' },
  { key: 'guidance', icon: '🎓', title: t.topicGuidance, sub: t.topicSubGuidance,
    prompt: 'Help me understand standard academic workflow procedures.' },
  { key: 'ask',      icon: '💡', title: t.topicAsk,      sub: t.topicSubAsk,
    prompt: 'I have a question about the uploaded file or academic processes.' },
];

/* ─── API helpers ───────────────────────────────────────────────────────── */
const api = {
  sessions:      () => fetch(`${AI_BASE}/api/ai/rag/sessions`).then(r => r.json()),
  session:       (id) => fetch(`${AI_BASE}/api/ai/rag/sessions/${id}`).then(r => r.json()),
  deleteSession: (id) => fetch(`${AI_BASE}/api/ai/rag/sessions/${id}`, { method: 'DELETE' }),
  chat:          (body) => fetch(`${AI_BASE}/api/ai/rag/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  uploadPdf:     (file, sessionId) => {
    const fd = new FormData();
    fd.append('file', file);
    if (sessionId) fd.append('session_id', sessionId);
    return fetch(`${AI_BASE}/api/ai/rag/process-document`, { method: 'POST', body: fd });
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   ChatWorkspace
═══════════════════════════════════════════════════════════════════════════ */
const ChatWorkspace = () => {
  const [lang, setLang]         = useState('en');
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [activeId, setActiveId] = useState(null);
  const [isSending, setIsSending]     = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chunks, setChunks]           = useState([]);
  const messagesEndRef = useRef(null);
  const fileRef        = useRef(null);

  const t = STRINGS[lang];

  /* ── refresh session list ──────────────────────────────────────────────── */
  const refreshSessions = useCallback(() =>
    api.sessions()
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(console.error),
  []);

  useEffect(() => { refreshSessions(); }, [refreshSessions]);

  /* ── auto-scroll ────────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  /* ── select session ─────────────────────────────────────────────────────── */
  const selectSession = async (s) => {
    if (s.id === activeId) return;
    try {
      const full = await api.session(s.id);
      setActiveId(full.id);
      setMessages(
        (full.messages ?? []).map(m => ({
          sender:  m.sender ?? m.role ?? 'user',
          content: m.content ?? '',
        }))
      );
    } catch (e) { console.error(e); }
  };

  /* ── new chat ───────────────────────────────────────────────────────────── */
  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setChunks([]);
  };

  /* ── delete session ─────────────────────────────────────────────────────── */
  const deleteSession = async (e, id) => {
    e.stopPropagation();
    await api.deleteSession(id);
    if (activeId === id) newChat();
    refreshSessions();
  };

  /* ── send message ───────────────────────────────────────────────────────── */
  const sendMessage = async (text = input) => {
    const query = text.trim();
    if (!query || isSending) return;

    setMessages(prev => [...prev, { sender: 'user', content: query }]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.chat({
        query,
        history:        [],
        session_id:     activeId ?? '',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', content: data.response ?? '' },
      ]);

      if (data.session_id && data.session_id !== activeId) {
        setActiveId(data.session_id);
      }

      refreshSessions();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', content: `⚠️ ${err.message || t.aiUnavailable}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  /* ── PDF upload ─────────────────────────────────────────────────────────── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploading(true);

    try {
      const res = await api.uploadPdf(file, activeId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const c = data.chunks ?? [];
      setChunks(c);
      if (data.session_id && data.session_id !== activeId) {
        setActiveId(data.session_id);
        refreshSessions();
      }
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', content: t.pdfLoaded(file.name, c.length) },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', content: t.uploadFailed(err.message) },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const hasMessages = messages.length > 0;

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ═══ TOP HEADER BAR ═══════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', background: '#fff',
        borderBottom: '1px solid #e2e8f0', flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      }}>
        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🎓</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', letterSpacing: '-0.3px' }}>
            Academic Intelligence
          </span>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* + New Chat */}
          <button
            id="new-chat-btn"
            onClick={newChat}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, border: '1px solid #3b82f6',
              background: '#eff6ff', color: '#2563eb', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
          >
            {t.newChat}
          </button>

          {/* Language toggle */}
          <div style={{
            display: 'flex', borderRadius: 8, overflow: 'hidden',
            border: '1px solid #e2e8f0', background: '#f8fafc',
          }}>
            {['en', 'si'].map(l => (
              <button
                key={l}
                id={`lang-${l}`}
                onClick={() => setLang(l)}
                style={{
                  padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all .15s',
                  background: lang === l ? '#2563eb' : 'transparent',
                  color: lang === l ? '#fff' : '#64748b',
                }}
              >
                {l === 'en' ? 'EN' : 'සිං'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BODY (Sidebar + Chat) ════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <div style={{
          width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t.chatSessions}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
            {sessions.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8', padding: '8px 8px', lineHeight: 1.5 }}>
                {t.noSessions}
              </p>
            ) : sessions.map(s => (
              <div
                key={s.id}
                id={`session-item-${s.id}`}
                onClick={() => selectSession(s)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                  marginBottom: 2, transition: 'all .12s',
                  background: activeId === s.id ? '#dbeafe' : 'transparent',
                  color: activeId === s.id ? '#1d4ed8' : '#475569',
                }}
                onMouseEnter={e => { if (activeId !== s.id) e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={e => { if (activeId !== s.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 13 }}>💬</span>
                  <span style={{
                    fontSize: 12.5, fontWeight: activeId === s.id ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.title}
                  </span>
                </div>
                <button
                  title={t.deleteSession}
                  onClick={(e) => deleteSession(e, s.id)}
                  style={{
                    flexShrink: 0, background: 'none', border: 'none',
                    color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: '0 2px',
                    opacity: 0, transition: 'opacity .1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = '#94a3b8'; }}
                  onFocus={e => { e.currentTarget.style.opacity = 1; }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CHAT AREA ───────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

          {/* Message / Welcome area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: hasMessages ? '24px 32px' : 0 }}>

            {/* ── WELCOME LANDING (shown when no messages) ─────────────── */}
            {!hasMessages && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', padding: '40px 24px',
                background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)',
              }}>
                {/* Logo mark */}
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, marginBottom: 20,
                  boxShadow: '0 8px 32px rgba(99,102,241,.25)',
                }}>🎓</div>

                <h2 style={{
                  fontSize: 22, fontWeight: 700, color: '#1e293b',
                  marginBottom: 10, textAlign: 'center', letterSpacing: '-0.4px',
                }}>
                  {t.welcome}
                </h2>
                <p style={{
                  fontSize: 13.5, color: '#64748b', textAlign: 'center',
                  maxWidth: 460, lineHeight: 1.6, marginBottom: 36, whiteSpace: 'pre-line',
                }}>
                  {t.welcomeSub}
                </p>

                {/* Topic cards grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 14, width: '100%', maxWidth: 560,
                }}>
                  {TOPICS(t).map(topic => (
                    <button
                      key={topic.key}
                      id={`topic-${topic.key}`}
                      onClick={() => sendMessage(topic.prompt)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: '16px 18px', borderRadius: 14,
                        border: '1.5px solid #e2e8f0',
                        background: '#fff', cursor: 'pointer', textAlign: 'left',
                        transition: 'all .18s', boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontSize: 22, marginBottom: 8 }}>{topic.icon}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                        {topic.title}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.4 }}>
                        {topic.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── MESSAGE THREAD ───────────────────────────────────────── */}
            {hasMessages && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    {/* Assistant avatar */}
                    {m.sender !== 'user' && (
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, marginRight: 10, marginTop: 2,
                      }}>🎓</div>
                    )}

                    <div style={{
                      maxWidth: '72%', padding: '12px 16px', borderRadius: 16,
                      fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      ...(m.sender === 'user' ? {
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: '#fff', borderBottomRightRadius: 4,
                        boxShadow: '0 2px 12px rgba(99,102,241,.3)',
                      } : {
                        background: '#f8fafc', color: '#1e293b',
                        border: '1px solid #e2e8f0', borderBottomLeftRadius: 4,
                        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                      }),
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>🎓</div>
                    <div style={{
                      padding: '12px 18px', borderRadius: 16, background: '#f8fafc',
                      border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {[0, 0.18, 0.36].map((delay, i) => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
                          animation: 'bounce 1.2s infinite',
                          animationDelay: `${delay}s`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── INPUT BAR ──────────────────────────────────────────────── */}
          <div style={{
            borderTop: '1px solid #e2e8f0', padding: '14px 24px 16px',
            background: '#fff', flexShrink: 0,
          }}>
            {/* PDF context indicator */}
            {chunks.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 8, fontSize: 11.5, color: '#64748b',
              }}>
                <span style={{
                  background: '#eff6ff', color: '#2563eb', borderRadius: 6,
                  padding: '2px 8px', fontWeight: 600,
                }}>
                  {t.pdfChunks(chunks.length)}
                </span>
                <button
                  onClick={() => setChunks([])}
                  style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    cursor: 'pointer', fontSize: 11.5, fontWeight: 600, padding: 0,
                  }}
                >
                  {t.clearCtx}
                </button>
              </div>
            )}

            {/* Input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '6px 6px 6px 14px',
              background: '#f8fafc', transition: 'border-color .15s',
            }}
              onFocus={() => {}}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              {/* Attach PDF */}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="pdf-attach-input"
                disabled={isUploading}
              />
              <button
                id="attach-pdf-btn"
                title={t.uploadPdf}
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: 15, color: '#64748b', transition: 'all .15s',
                  opacity: isUploading ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!isUploading) { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#6366f1'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                {isUploading ? (
                  <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                ) : '📎'}
              </button>

              {/* Text input */}
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t.inputPlaceholder}
                disabled={isSending}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 13.5, color: '#1e293b', outline: 'none',
                  padding: '4px 0',
                }}
              />

              {/* Send button */}
              <button
                id="send-btn"
                onClick={() => sendMessage()}
                disabled={isSending || !input.trim()}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: 10,
                  border: 'none', cursor: (isSending || !input.trim()) ? 'not-allowed' : 'pointer',
                  background: (isSending || !input.trim())
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: (isSending || !input.trim()) ? '#94a3b8' : '#fff',
                  fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
                {t.send}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe CSS injected once */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* sidebar delete btn visible on row hover */
        div[id^="session-item-"]:hover button { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default ChatWorkspace;

