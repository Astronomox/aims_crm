import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, MessageSquare, PhoneCall,
  FileText, Settings, LogOut, Activity, Menu, X
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import toast from 'react-hot-toast'

const nav = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Contacts', to: '/contacts', icon: Users },
  { label: 'Interactions', to: '/interactions', icon: Activity },
  { label: 'Log Interaction', to: '/log', icon: PhoneCall },
  { label: 'AI Chat', to: '/chat', icon: MessageSquare },
  { label: 'Reports', to: '/reports', icon: FileText },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(true)}>
        <Menu size={18} color="var(--text-1)" />
      </button>

      <div className={`mobile-overlay${open ? ' open' : ''}`} onClick={close} />

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sb-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sb-logo-mark">
            <div className="sb-logobox">A</div>
            <div>
              <div className="sb-name">AIMS CRM</div>
              <div className="sb-sub">Nigeria</div>
            </div>
          </div>
          <button onClick={close} style={{ color: 'var(--text-3)', display: 'none' }} className="close-sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="sb-section">
          <div className="sb-section-label">Navigation</div>
          {nav.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
              onClick={close}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="sb-footer">
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, paddingLeft: 8 }}>
            {user?.full_name}
          </div>
          <button
            className="sb-item"
            onClick={() => { logout(); toast.success('Signed out'); navigate('/login'); close() }}
            style={{ width: '100%' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
