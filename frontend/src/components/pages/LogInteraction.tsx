import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createInteraction, sendNotifications, getContacts, createContact } from '../../api/services'
import toast from 'react-hot-toast'
import { CheckCircle, Send, ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const TYPES = ['call', 'chat', 'meeting', 'email', 'whatsapp']
const TOPICS = [
  'University Selection', 'Visa Application', 'Application Process', 'SOP / CV Writing',
  'Scholarship Information', 'Tuition & Fees', 'Accommodation', 'Career Counseling',
  'English Language Test', 'Interview Preparation', 'General Enquiry', 'Follow-up',
]
const TOPIC_ENUM: Record<string, string> = {
  'University Selection': 'university_selection', 'Visa Application': 'visa_application',
  'Application Process': 'application_process', 'SOP / CV Writing': 'sop_cv',
  'Scholarship Information': 'scholarship', 'Tuition & Fees': 'tuition_fees',
  'Accommodation': 'accommodation', 'Career Counseling': 'career_counseling',
  'English Language Test': 'english_test', 'Interview Preparation': 'interview_prep',
  'General Enquiry': 'general', 'Follow-up': 'follow_up',
}

export default function LogInteraction() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    contact_id: '', new_name: '', new_phone: '',
    type: 'call', topic: 'General Enquiry', duration_minutes: '',
    raw_notes: '', follow_up_action: '', follow_up_due: '',
  })
  const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing')
  const [result, setResult] = useState<any>(null)

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => getContacts({ limit: 200 }),
  })

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))

  const logMut = useMutation({
    mutationFn: async () => {
      let cid = parseInt(form.contact_id)
      if (contactMode === 'new') {
        if (!form.new_name.trim()) throw new Error('Contact name required')
        const c = await createContact({ full_name: form.new_name, phone: form.new_phone || undefined })
        cid = c.id
      }
      if (!cid) throw new Error('Select or create a contact')
      if (!form.raw_notes.trim()) throw new Error('Notes are required')
      return createInteraction({
        contact_id: cid,
        type: form.type,
        topic: TOPIC_ENUM[form.topic] || 'general',
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
        raw_notes: form.raw_notes,
        follow_up_action: form.follow_up_action || undefined,
        follow_up_due: form.follow_up_due || undefined,
      })
    },
    onSuccess: (data) => {
      setResult(data)
      qc.invalidateQueries({ queryKey: ['interactions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  })

  const notifyMut = useMutation({
    mutationFn: () => sendNotifications(result.id),
    onSuccess: (d) => toast.success(`Sent to ${d.sent_to?.length || 0} people`),
    onError: () => toast.error('Notification failed. Check Twilio/SendGrid config.'),
  })

  const reset = () => {
    setResult(null)
    setForm({ contact_id: '', new_name: '', new_phone: '', type: 'call', topic: 'General Enquiry', duration_minutes: '', raw_notes: '', follow_up_action: '', follow_up_due: '' })
  }

  if (result) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div className="page-heading">Interaction Logged</div>
          <div className="page-subheading">AI summary and transcript generated</div>
        </div>
        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Professional summary</div></div>
            <div className="card-body" style={{ fontSize: 13.5, color: 'var(--text-1)', lineHeight: 1.75 }}>
              {result.ai_summary || <span style={{ color: 'var(--text-3)' }}>Generating...</span>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Organized transcript</div></div>
            <div className="card-body mono" style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
              {result.ai_transcript || <span style={{ color: 'var(--text-3)' }}>Generating...</span>}
            </div>
          </div>
        </div>
        {result.follow_up_action && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Follow-up required</div>
                <div style={{ fontSize: 13 }}>{result.follow_up_action}</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => notifyMut.mutate()} disabled={notifyMut.isPending}>
            {notifyMut.isPending ? <span className="spinner" /> : <Send size={14} />}
            Notify team
          </button>
          {result.shared_token && (
            <Link className="btn btn-ghost" to={`/shared/${result.shared_token}`} target="_blank">
              Shareable link (no login)
            </Link>
          )}
          <button className="btn btn-ghost" onClick={reset}>Log another</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="page-heading">Log interaction</div>
        <div className="page-subheading">Enter your notes. AI generates a polished summary and transcript automatically.</div>
      </div>

      <div className="log-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div className="card-title">Contact</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn btn-sm ${contactMode === 'existing' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setContactMode('existing')}>Existing</button>
                <button className={`btn btn-sm ${contactMode === 'new' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setContactMode('new')}><Plus size={12} /> New</button>
              </div>
            </div>
            <div className="card-body">
              {contactMode === 'existing' ? (
                <select className="form-select" value={form.contact_id} onChange={f('contact_id')}>
                  <option value="">Select a contact...</option>
                  {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
                </select>
              ) : (
                <div className="form-grid-2">
                  <div className="form-group" style={{margin:0}}><label className="form-label">Name *</label><input className="form-input" value={form.new_name} onChange={f('new_name')} placeholder="Full name" /></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Phone</label><input className="form-input" value={form.new_phone} onChange={f('new_phone')} placeholder="+234..." /></div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><div className="card-title">Details</div></div>
            <div className="card-body">
              <div className="form-grid-3">
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={f('type')}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Topic</label>
                  <select className="form-select" value={form.topic} onChange={f('topic')}>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Duration (min)</label>
                  <input className="form-input" type="number" min="1" value={form.duration_minutes} onChange={f('duration_minutes')} placeholder="15" /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Your notes — write freely, AI organizes everything *</label>
                <textarea className="form-textarea" style={{ minHeight: 150 }} value={form.raw_notes} onChange={f('raw_notes')}
                  placeholder="Student wants to study nursing in UK. Asked about IELTS. We discussed Salford University. Needs 6.5 overall. Will call back after exam. Also asked about accommodation..." />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Follow-up</div></div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group" style={{margin:0}}><label className="form-label">Action</label>
                  <input className="form-input" value={form.follow_up_action} onChange={f('follow_up_action')} placeholder="Send application checklist" /></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Due date</label>
                  <input className="form-input" type="datetime-local" value={form.follow_up_due} onChange={f('follow_up_due')} /></div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={() => logMut.mutate()} disabled={logMut.isPending}>
            {logMut.isPending ? <><span className="spinner" /> AI is generating your summary...</> : <>Log interaction <ArrowRight size={14} /></>}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">How it works</div></div>
            <div className="card-body" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.85 }}>
              <div style={{ marginBottom: 10 }}>1. Write your raw call notes</div>
              <div style={{ marginBottom: 10 }}>2. Claude AI generates a CRM-ready summary + organized transcript</div>
              <div style={{ marginBottom: 10 }}>3. A shareable link is created — no login needed</div>
              <div>4. Your team gets notified via WhatsApp and email</div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Quick tags</div></div>
            <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['IELTS 6.5+', 'CAS Letter', 'SOP', 'Salford Uni', 'Coventry Uni', 'UKVI Visa', 'Tuition Deposit', 'Accommodation'].map(t => (
                <button key={t} className="badge gray" style={{ cursor: 'pointer', border: '1px solid var(--border-md)' }}
                  onClick={() => setForm(p => ({ ...p, raw_notes: p.raw_notes + (p.raw_notes ? '. ' : '') + t }))}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
