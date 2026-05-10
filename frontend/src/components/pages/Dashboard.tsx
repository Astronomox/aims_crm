import { useQuery } from '@tanstack/react-query'
import { getStats, getInteractions } from '../../api/services'
import { useAuthStore } from '../../store/auth'
import { format } from 'date-fns'
import { PhoneCall, MessageSquare, Users, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const TYPE_ICON: Record<string, any> = {
  call: PhoneCall, chat: MessageSquare, meeting: Users, email: MessageSquare, whatsapp: MessageSquare
}
const TYPE_COLOR: Record<string, string> = {
  call: 'blue', chat: 'green', meeting: 'amber', email: 'purple', whatsapp: 'gold'
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getStats, refetchInterval: 20_000 })
  const { data: interactions } = useQuery({
    queryKey: ['interactions-recent'],
    queryFn: () => getInteractions({ limit: 8 }),
    refetchInterval: 20_000,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="page-heading">{greeting}, {user?.full_name?.split(' ')[0] || 'Admin'}</div>
        <div className="page-subheading">AIMS Education Nigeria — Operations Dashboard</div>
      </div>

      <div className="stat-grid">
        <div className="stat-tile gold">
          <div className="stat-tile-label">Total Contacts</div>
          <div className="stat-tile-value">{stats?.total_contacts ?? 0}</div>
          <div className="stat-tile-sub">Student records</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Today's Interactions</div>
          <div className="stat-tile-value">{stats?.interactions_today ?? 0}</div>
          <div className="stat-tile-sub">Calls, chats, meetings</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">All Time</div>
          <div className="stat-tile-value">{stats?.total_interactions ?? 0}</div>
          <div className="stat-tile-sub">Total interactions</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Follow-ups</div>
          <div className="stat-tile-value" style={{ color: (stats?.follow_ups_pending || 0) > 0 ? 'var(--amber)' : 'var(--text-0)' }}>
            {stats?.follow_ups_pending ?? 0}
          </div>
          <div className="stat-tile-sub">Pending action</div>
        </div>
      </div>

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Interactions</div>
            <Link to="/interactions" style={{ fontSize: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {(!interactions || interactions.length === 0) ? (
              <div className="empty">
                <div className="empty-icon">
                  <PhoneCall size={32} strokeWidth={1.2} />
                </div>
                No interactions yet. Log your first call or start a chat.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Topic</th>
                    <th>Summary</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {interactions.map((i: any) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 500 }}>{i.contact?.full_name ?? '—'}</td>
                      <td><span className={`badge ${TYPE_COLOR[i.type] || 'gray'}`}>{i.type}</span></td>
                      <td style={{ color: 'var(--text-2)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.topic}</td>
                      <td style={{ color: 'var(--text-2)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i.ai_summary || '—'}
                      </td>
                      <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {format(new Date(i.occurred_at), 'd MMM, HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Link to="/log" style={{ display: 'block' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'all var(--transition)', border: '1px solid var(--gold-border)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={18} style={{ color: 'var(--gold)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-0)' }}>Log an Interaction</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>AI generates summary instantly</div>
                </div>
              </div>
            </div>
          </Link>
          <Link to="/chat" style={{ display: 'block' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'all var(--transition)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} style={{ color: 'var(--green)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-0)' }}>AI Customer Chat</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>24/7 student advisor</div>
                </div>
              </div>
            </div>
          </Link>
          <Link to="/contacts" style={{ display: 'block' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'all var(--transition)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-0)' }}>Manage Contacts</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{stats?.total_contacts ?? 0} student records</div>
                </div>
              </div>
            </div>
          </Link>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div className="status-dot green" />
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)' }}>AI System Online</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                Claude AI is active and ready to handle student enquiries, generate call summaries, and organize transcripts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
