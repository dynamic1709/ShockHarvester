/**
 * Login page
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@shockharvester.com')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password. Try admin@shockharvester.com / demo1234')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>⚡</div>
          <div>
            <div className="auth-title" style={{ marginBottom: 0, fontSize: 22 }}>ShockHarvester</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ADVISOR PLATFORM</div>
          </div>
        </div>

        <div className="auth-subtitle">Sign in to your advisor account</div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8, justifyContent: 'center', padding: '11px' }}
          >
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-bright)' }}>Demo credentials:</strong>
          <br />Email: admin@shockharvester.com
          <br />Password: demo1234
        </div>
      </div>
    </div>
  )
}
