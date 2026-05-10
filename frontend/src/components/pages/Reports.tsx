import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDailyReport } from '../../api/services'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'

export default function Reports() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', date],
    queryFn: () => getDailyReport(date),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="page-heading">Daily reports</div>
          <div className="page-subheading">AI-generated operations summary</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-primary" onClick={() => refetch()}>Generate</button>
        </div>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ width: 24, height: 24 }} /></div>}

      {data && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <div className="stat-tile gold">
              <div className="stat-tile-label">Total</div>
              <div className="stat-tile-value">{data.total_interactions}</div>
              <div className="stat-tile-sub">Interactions</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Calls</div>
              <div className="stat-tile-value">{data.calls}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Chats</div>
              <div className="stat-tile-value">{data.chats}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">New contacts</div>
              <div className="stat-tile-value">{data.new_contacts}</div>
            </div>
          </div>

          {data.ai_narrative ? (
            <div className="card">
              <div className="card-header"><div className="card-title">AI executive summary</div></div>
              <div className="card-body" style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>
                {data.ai_narrative}
              </div>
            </div>
          ) : data.total_interactions === 0 ? (
            <div className="empty">
              <div className="empty-icon"><FileText size={32} strokeWidth={1.2} /></div>
              No interactions recorded for {date}.
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
