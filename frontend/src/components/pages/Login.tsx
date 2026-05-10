import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login, register } from '../../api/services'
import { useAuthStore } from '../../store/auth'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const nav = useNavigate()
  const { setAuth } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))

  const loginMut = useMutation({
    mutationFn: () => login(form.email, form.password),
    onSuccess: (data) => { setAuth(data.access_token, data.user); nav('/') },
    onError: () => toast.error('Invalid email or password'),
  })

  const regMut = useMutation({
    mutationFn: () => register({ full_name: form.full_name, email: form.email, password: form.password }),
    onSuccess: () => { toast.success('Account created. Sign in now.'); setMode('login'); setForm(p => ({ ...p, confirm: '' })) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Registration failed'),
  })

  const submit = () => {
    if (!form.email.trim() || !form.password.trim()) return toast.error('Email and password are required')
    if (mode === 'register') {
      if (!form.full_name.trim()) return toast.error('Full name is required')
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
      if (form.password !== form.confirm) return toast.error('Passwords do not match')
      regMut.mutate()
    } else {
      loginMut.mutate()
    }
  }

  const pending = loginMut.isPending || regMut.isPending
  const pwdMatch = !form.confirm || form.password === form.confirm

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(184,146,47,0.06) 0%, var(--bg-deep) 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52,
            background: 'linear-gradient(135deg, var(--gold), #9A7820)',
            borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 18,
            boxShadow: '0 4px 20px rgba(184,146,47,0.25)',
          }}>A</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '-0.02em' }}>
            AIMS CRM
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
            Business Intelligence Platform
          </div>
        </div>

        <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="card-header">
            <div className="card-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</div>
          </div>
          <div className="card-body">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={f('full_name')} placeholder="Your full name" autoFocus />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="you@aimseducation.ng" autoFocus={mode === 'login'} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={f('password')}
                  placeholder="Enter your password"
                  style={{ paddingRight: 42 }}
                  onKeyDown={e => { if (e.key === 'Enter' && mode === 'login') submit() }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-3)', padding: 4, display: 'flex',
                  }}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={f('confirm')}
                    placeholder="Re-enter your password"
                    style={{
                      paddingRight: 42,
                      borderColor: form.confirm && !pwdMatch ? 'var(--red)' : undefined,
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-3)', padding: 4, display: 'flex',
                    }}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirm && !pwdMatch && (
                  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>Passwords do not match</div>
                )}
                {form.confirm && pwdMatch && form.confirm.length >= 6 && (
                  <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 5 }}>Passwords match</div>
                )}
              </div>
            )}

            {mode === 'register' && form.password && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: form.password.length >= i * 3
                        ? form.password.length >= 12 ? 'var(--green)' : form.password.length >= 8 ? 'var(--amber)' : 'var(--red)'
                        : 'var(--border-md)',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {form.password.length < 6 ? 'Too short (min 6)' : form.password.length < 8 ? 'Weak' : form.password.length < 12 ? 'Good' : 'Strong'}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4 }}
              onClick={submit}
              disabled={pending || (mode === 'register' && (!pwdMatch || form.password.length < 6))}
            >
              {pending ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-3)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                style={{ color: 'var(--gold)', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setForm(p => ({ ...p, confirm: '' })) }}
              >
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
