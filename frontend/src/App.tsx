import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Sidebar from './components/layout/Sidebar'
import Login from './components/pages/Login'
import Dashboard from './components/pages/Dashboard'
import Contacts from './components/pages/Contacts'
import Interactions from './components/pages/Interactions'
import LogInteraction from './components/pages/LogInteraction'
import AIChatPage from './components/pages/AIChat'
import Reports from './components/pages/Reports'
import Settings from './components/pages/Settings'
import SharedRecord from './components/pages/SharedRecord'

function Protected() {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/shared/:token" element={<SharedRecord />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/interactions" element={<Interactions />} />
          <Route path="/log" element={<LogInteraction />} />
          <Route path="/chat" element={<AIChatPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
