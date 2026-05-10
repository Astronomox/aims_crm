import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSharedInteraction } from '../../api/services'
import { format } from 'date-fns'

export default function SharedRecord() {
  const { token } = useParams()
  const { data: r, isLoading, isError } = useQuery({
    queryKey: ['shared', token],
    queryFn: () => getSharedInteraction(token!),
    enabled: !!token,
  })

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  )

  if (isError || !r) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Record not found or link has expired.
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--gold), #9A7820)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 2px 12px rgba(184,146,47,0.2)',
          }}>A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-0)' }}>AIMS Education Nigeria</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Interaction record</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="shared-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Contact</div><div style={{ fontWeight: 600 }}>{r.contact?.full_name ?? '—'}</div></div>
              <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Topic</div><div>{r.topic}</div></div>
              <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Date</div><div>{format(new Date(r.occurred_at), 'd MMMM yyyy, HH:mm')}</div></div>
              <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Type</div><div style={{ textTransform: 'capitalize' }}>{r.type}</div></div>
              {r.duration_minutes && <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Duration</div><div>{r.duration_minutes} min</div></div>}
              <div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Logged by</div><div>{r.logged_by_user?.full_name ?? '—'}</div></div>
            </div>
          </div>
        </div>

        {r.ai_summary && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Professional summary</div></div>
            <div className="card-body" style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-1)' }}>{r.ai_summary}</div>
          </div>
        )}

        {r.ai_transcript && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Transcript</div></div>
            <div className="card-body mono" style={{ fontSize: 12.5, lineHeight: 1.9, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{r.ai_transcript}</div>
          </div>
        )}

        {r.follow_up_action && (
          <div className="card">
            <div className="card-header"><div className="card-title">Follow-up</div></div>
            <div className="card-body">
              <div style={{ fontSize: 13 }}>{r.follow_up_action}</div>
              {r.follow_up_due && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Due: {format(new Date(r.follow_up_due), 'd MMM yyyy')}</div>}
              <div style={{ marginTop: 8 }}><span className={`badge ${r.follow_up_completed ? 'green' : 'amber'}`}>{r.follow_up_completed ? 'Completed' : 'Pending'}</span></div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 36, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
          AIMS Education Nigeria — Hive Mall, Lekki, Lagos — +234 808-437-2965
        </div>
      </div>
    </div>
  )
}
