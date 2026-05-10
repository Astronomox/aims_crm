import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInteractions, completeFollowup } from '../../api/services'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, Activity, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const TC: Record<string, string> = { call: 'blue', chat: 'green', meeting: 'amber', email: 'purple', whatsapp: 'gold' }

export default function Interactions() {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['interactions', typeFilter],
    queryFn: () => getInteractions({ type: typeFilter || undefined, limit: 100 }),
  })

  const completeMut = useMutation({
    mutationFn: completeFollowup,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interactions'] }); toast.success('Marked complete') },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="page-heading">Interactions</div>
          <div className="page-subheading">Every call, chat, and meeting with AI transcripts</div>
        </div>
        <Link to="/log" className="btn btn-primary">Log new</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {['', 'call', 'chat', 'meeting', 'email', 'whatsapp'].map(t => (
          <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(t)}>
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading && <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner" /></div>}
        {!isLoading && !items.length && (
          <div className="empty">
            <div className="empty-icon"><Activity size={32} strokeWidth={1.2} /></div>
            No interactions yet.
          </div>
        )}
        {items.map((i: any) => (
          <div key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', transition: 'background 0.1s' }}
              onClick={() => setExpanded(expanded === i.id ? null : i.id)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {expanded === i.id
                ? <ChevronDown size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                : <ChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
              <span className={`badge ${TC[i.type] || 'gray'}`}>{i.type}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{i.contact?.full_name ?? '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{i.topic}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {i.ai_summary?.substring(0, 70) || i.raw_notes?.substring(0, 70) || '—'}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {i.follow_up_action && !i.follow_up_completed && <span className="badge amber">Follow-up</span>}
                {i.follow_up_completed && <span className="badge green">Done</span>}
                <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{format(new Date(i.occurred_at), 'd MMM, HH:mm')}</div>
              </div>
            </div>

            {expanded === i.id && (
              <div style={{ padding: '0 20px 20px 48px' }}>
                <div className="interaction-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>AI summary</div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.75, background: 'var(--bg-2)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                      {i.ai_summary || <span style={{ color: 'var(--text-3)' }}>Not generated</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Transcript</div>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.85, background: 'var(--bg-2)', borderRadius: 8, padding: '12px 14px', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', border: '1px solid var(--border)' }}>
                      {i.ai_transcript || i.raw_notes || '—'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {i.follow_up_action && (
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--amber)' }}>Follow-up: {i.follow_up_action}</div>
                  )}
                  {i.follow_up_action && !i.follow_up_completed && (
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); completeMut.mutate(i.id) }}>Mark complete</button>
                  )}
                  {i.shared_token && (
                    <Link className="btn btn-ghost btn-sm" to={`/shared/${i.shared_token}`} target="_blank" onClick={e => e.stopPropagation()}>
                      <ExternalLink size={12} /> Share
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
