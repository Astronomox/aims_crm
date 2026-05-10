import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { register } from '../../api/services'
import { useAuthStore } from '../../store/auth'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

export default function Settings() {
  const { user, setAuth, token } = useAuthStore()
  const qc = useQueryClient()
  const [pf, setPf] = useState({
    full_name: user?.full_name || '', phone: user?.phone || '',
    whatsapp: user?.whatsapp || '', notify_on_log: user?.notify_on_log ?? true,
  })
  const [showAdd, setShowAdd] = useState(false)
  const [nu, setNu] = useState({ full_name: '', email: '', password: '', role: 'viewer', whatsapp: '', notify_on_log: true })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/auth/users').then(r => r.data).catch(() => []),
  })

  const saveMut = useMutation({
    mutationFn: () => api.patch('/api/auth/me', pf).then(r => r.data),
    onSuccess: (data) => { setAuth(token!, data); toast.success('Profile saved') },
  })
  const addMut = useMutation({
    mutationFn: () => register(nu),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowAdd(false); setNu({ full_name: '', email: '', password: '', role: 'viewer', whatsapp: '', notify_on_log: true })
      toast.success('Team member added')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const fp = (k: string) => (e: any) => setPf(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const fn = (k: string) => (e: any) => setNu(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="page-heading">Settings</div>
        <div className="page-subheading">Profile, team, and notification config</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="settings-grid">
        <div className="card">
          <div className="card-header"><div className="card-title">Your profile</div></div>
          <div className="card-body">
            <div className="form-group"><label className="form-label">Full name</label><input className="form-input" value={pf.full_name} onChange={fp('full_name')} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.4 }} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={pf.phone} onChange={fp('phone')} placeholder="+234..." /></div>
            <div className="form-group"><label className="form-label">WhatsApp (for notifications)</label><input className="form-input" value={pf.whatsapp} onChange={fp('whatsapp')} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="notif" checked={pf.notify_on_log} onChange={fp('notify_on_log')} style={{ width: 16, height: 16, accentColor: 'var(--gold)' }} />
              <label htmlFor="notif" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Notify me when interactions are logged</label>
            </div>
            <button className="btn btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <span className="spinner" /> : 'Save'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Account</div></div>
          <div className="card-body" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.85 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, color: 'var(--text-0)', marginBottom: 4 }}>Role</div>
              <div><span className={`badge ${user?.role === 'admin' ? 'gold' : user?.role === 'agent' ? 'blue' : 'gray'}`}>{user?.role || 'agent'}</span></div>
            </div>
            <hr className="divider" />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, color: 'var(--text-0)', marginBottom: 4 }}>Data</div>
              <div>All your contacts, interactions, and reports are stored securely and accessible from any device when you sign in.</div>
            </div>
            <hr className="divider" />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-0)', marginBottom: 4 }}>Support</div>
              <div>AIMS Education Nigeria — Hive Mall, Lekki, Lagos</div>
              <div style={{ marginTop: 2 }}>+234 808-437-2965</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1/-1' }}>
          <div className="card-header">
            <div className="card-title">Team members</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>WhatsApp</th><th>Notifications</th></tr></thead>
              <tbody>
                {!users.length && <tr><td colSpan={5} className="empty">No team members yet. Add one above.</td></tr>}
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name} {u.id === user?.id && <span className="badge gold" style={{ marginLeft: 6 }}>You</span>}</td>
                    <td style={{ color: 'var(--text-2)' }}>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'red' : u.role === 'agent' ? 'blue' : 'gray'}`}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{u.whatsapp || '—'}</td>
                    <td><span className={`badge ${u.notify_on_log ? 'green' : 'gray'}`}>{u.notify_on_log ? 'Active' : 'Off'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add team member</div>
              <button onClick={() => setShowAdd(false)} style={{ color: 'var(--text-3)' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={nu.full_name} onChange={fn('full_name')} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={nu.email} onChange={fn('email')} /></div>
                <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={nu.password} onChange={fn('password')} /></div>
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-select" value={nu.role} onChange={fn('role')}>
                    <option value="viewer">Viewer</option><option value="agent">Agent</option><option value="admin">Admin</option>
                  </select></div>
                <div className="form-group form-full"><label className="form-label">WhatsApp</label><input className="form-input" value={nu.whatsapp} onChange={fn('whatsapp')} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => addMut.mutate()} disabled={addMut.isPending}>
                  {addMut.isPending ? <span className="spinner" /> : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
