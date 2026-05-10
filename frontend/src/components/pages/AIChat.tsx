import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChatSessions, createChatSession, getChatSession, sendChatMessage, deleteChatSession } from '../../api/services'
import { Send, Plus, Trash2, MessageSquare, ChevronLeft, List } from 'lucide-react'
import { format } from 'date-fns'
import ChatBubble from '../ui/ChatBubble'
import toast from 'react-hot-toast'

type Msg = { role: string; content: string; time: string }

export default function AIChatPage() {
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<string[]>([])
  const [showSessions, setShowSessions] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: getChatSessions,
  })

  const { data: activeSession } = useQuery({
    queryKey: ['chat-session', activeId],
    queryFn: () => getChatSession(activeId!),
    enabled: !!activeId,
  })

  useEffect(() => {
    if (activeSession?.messages) {
      setMessages(activeSession.messages)
      setTopics(detectTopics(activeSession.messages.map((m: Msg) => m.content).join(' ')))
    }
  }, [activeSession])

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    if (sessions.length > 0 && !activeId) setActiveId(sessions[0].id)
  }, [sessions])

  const newMut = useMutation({
    mutationFn: createChatSession,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
      setActiveId(data.id)
      setMessages(data.messages || [])
      setTopics([])
      setShowSessions(false)
    },
  })

  const delMut = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (sessions.length > 1) {
        const remaining = sessions.filter((s: any) => s.id !== activeId)
        setActiveId(remaining[0]?.id || null)
      } else {
        setActiveId(null)
      }
      setMessages([])
      toast.success('Deleted')
    },
  })

  const send = async () => {
    const text = input.trim()
    if (!text || loading || !activeId) return
    setInput('')
    setMessages(p => [...p, { role: 'user', content: text, time: new Date().toISOString() }])
    setLoading(true)
    try {
      const res = await sendChatMessage(activeId, text)
      setMessages(p => [...p, { role: 'assistant', content: res.reply, time: new Date().toISOString() }])
      if (res.detected_topics?.length) setTopics(p => [...new Set([...p, ...res.detected_topics])])
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Connection issue. Try again or call +234 808-437-2965.', time: new Date().toISOString() }])
    }
    setLoading(false)
  }

  const pick = (id: number) => { setActiveId(id); setTopics([]); setShowSessions(false) }

  const prompts = [
    'How do I apply to study in the UK?',
    'What IELTS score do I need?',
    'Available scholarships?',
    'How long does the visa take?',
    'Help with my SOP?',
    'Tuition costs?',
  ]

  // Session list panel (shared between desktop sidebar and mobile fullscreen)
  const sessionList = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', flex: 1 }}>
      {sessions.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>No conversations yet</div>
      )}
      {sessions.map((s: any) => (
        <div key={s.id} onClick={() => pick(s.id)} style={{
          padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          background: activeId === s.id ? 'var(--gold-soft)' : 'var(--bg-1)',
          border: `1px solid ${activeId === s.id ? 'var(--gold-border)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'flex-start', gap: 8, transition: 'all 0.15s',
        }}>
          <MessageSquare size={13} style={{ color: activeId === s.id ? 'var(--gold)' : 'var(--text-3)', marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: activeId === s.id ? 'var(--gold)' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.message_count} msgs</div>
          </div>
          <button onClick={e => { e.stopPropagation(); delMut.mutate(s.id) }}
            style={{ color: 'var(--text-3)', padding: 2, flexShrink: 0, opacity: 0.4 }}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="page-heading">AI chat</div>
          <div className="page-subheading">Conversations saved automatically</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Mobile session toggle */}
          <button className="btn btn-ghost btn-sm mobile-only" onClick={() => setShowSessions(true)}
            style={{ display: 'none' }}>
            <List size={14} /> Chats
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => newMut.mutate()}>
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      {/* Mobile session overlay */}
      {showSessions && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'var(--bg-1)', padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Conversations</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSessions(false)}>
              <ChevronLeft size={14} /> Back
            </button>
          </div>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            onClick={() => newMut.mutate()}>
            <Plus size={13} /> New conversation
          </button>
          {sessionList}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 14 }} className="chat-layout">

        {/* Desktop session sidebar */}
        <div className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessionList}
        </div>

        {/* Chat area */}
        {activeId ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', minHeight: 380 }}>
            {/* Mobile header with session title */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="mobile-only" onClick={() => setShowSessions(true)}
                style={{ color: 'var(--text-2)', display: 'none', padding: 2 }}>
                <List size={16} />
              </button>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sessions.find((s: any) => s.id === activeId)?.title || 'Chat'}
              </div>
              {topics.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {topics.slice(0, 3).map(t => <span key={t} className="badge gold" style={{ fontSize: 9 }}>{t}</span>)}
                </div>
              )}
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                  <div className={`chat-avatar ${m.role === 'assistant' ? 'ai' : 'user'}`}>
                    {m.role === 'assistant' ? 'A' : 'S'}
                  </div>
                  <div>
                    <ChatBubble text={m.content} />
                    <div className="chat-time">{m.time ? format(new Date(m.time), 'HH:mm') : ''}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg ai">
                  <div className="chat-avatar ai">A</div>
                  <div className="chat-bubble"><div className="typing-dots"><span /><span /><span /></div></div>
                </div>
              )}
              <div ref={ref} />
            </div>

            {/* Quick prompts row — only show when few messages */}
            {messages.length <= 2 && (
              <div style={{ padding: '6px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
                {prompts.map(p => (
                  <button key={p} className="badge gray" style={{ cursor: 'pointer', fontSize: 10.5 }}
                    onClick={() => setInput(p)}>{p}</button>
                ))}
              </div>
            )}

            <div className="chat-input-row">
              <textarea className="chat-input" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Type a message..." rows={1} />
              <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end' }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 150px)', minHeight: 380 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
              <MessageSquare size={36} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, marginBottom: 8 }}>Start a conversation</div>
              <button className="btn btn-primary btn-sm" onClick={() => newMut.mutate()}>
                <Plus size={13} /> New chat
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          .chat-layout { grid-template-columns: 1fr !important; }
          .chat-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function detectTopics(text: string): string[] {
  const t = text.toLowerCase()
  const map: Record<string, string[]> = {
    'Visa': ['visa', 'immigration'], 'UK': ['uk ', 'united kingdom'],
    'Canada': ['canada'], 'IELTS': ['ielts', 'toefl'], 'Scholarship': ['scholarship'],
    'SOP': ['sop', 'statement of purpose'], 'Tuition': ['fee', 'cost', 'tuition'],
    'Application': ['apply', 'application'], 'USA': ['usa', 'america'], 'Australia': ['australia'],
  }
  return Object.entries(map).filter(([, kw]) => kw.some(k => t.includes(k))).map(([l]) => l)
}
