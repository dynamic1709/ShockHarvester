import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ShockHarvesterLogo from '../components/ShockHarvesterLogo'
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [roleTab, setRoleTab] = useState<'client' | 'advisor'>('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError(null)
    setIsSubmitting(true)
    const targetEmail = loginEmail || email
    const targetPassword = loginPassword || password

    if (!targetEmail || !targetPassword) {
      setError('Please enter both email and password.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await login(targetEmail, targetPassword)
      if (res.role === 'advisor') {
        navigate('/advisor', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Invalid email or password. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoLogin = (targetRole: 'advisor' | 'investor1' | 'investor2' | 'investor3') => {
    let demoEmail = 'advisor@shockharvester.com'
    if (targetRole === 'investor1') demoEmail = 'investor1@shockharvester.com'
    if (targetRole === 'investor2') demoEmail = 'investor2@shockharvester.com'
    if (targetRole === 'investor3') demoEmail = 'investor3@shockharvester.com'

    setEmail(demoEmail)
    setPassword('password123')
    handleLogin(demoEmail, 'password123')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #172338 0%, #0b0f17 70%, #06090e 100%)',
      padding: '24px',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(18, 24, 38, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.1)',
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-block', marginBottom: '14px' }}>
            <ShockHarvesterLogo size={44} showText={true} />
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Automated Indian Equity Shock Protection & Tax-Loss Alpha
          </p>
        </div>

        {/* Role Segment Toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(10, 14, 23, 0.8)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <button
            type="button"
            onClick={() => { setRoleTab('client'); setEmail('investor1@shockharvester.com'); setPassword('password123'); setError(null) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              background: roleTab === 'client' ? '#10b981' : 'transparent',
              color: roleTab === 'client' ? '#ffffff' : '#94a3b8',
              boxShadow: roleTab === 'client' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            <UserCheck size={16} /> Investor
          </button>
          <button
            type="button"
            onClick={() => { setRoleTab('advisor'); setEmail('advisor@shockharvester.com'); setPassword('password123'); setError(null) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              background: roleTab === 'advisor' ? '#38bdf8' : 'transparent',
              color: roleTab === 'advisor' ? '#0f172a' : '#94a3b8',
              boxShadow: roleTab === 'advisor' ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none',
            }}
          >
            <ShieldCheck size={16} /> Advisor
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#fb7185',
            fontSize: '13px',
            marginBottom: '18px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={roleTab === 'advisor' ? 'advisor@shockharvester.com' : 'investor1@shockharvester.com'}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px 14px 12px 42px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px 14px 12px 42px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: roleTab === 'advisor' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: roleTab === 'advisor' ? '#0f172a' : '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: roleTab === 'advisor' ? '0 4px 15px rgba(56, 189, 248, 0.35)' : '0 4px 15px rgba(16, 185, 129, 0.35)',
              transition: 'opacity 0.2s ease',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Signing in...' : (
              <>
                <span>Sign In as {roleTab === 'advisor' ? 'Advisor' : 'Investor'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
            <Sparkles size={13} color="#f59e0b" /> One-Click Demo Logins
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('advisor')}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Advisor Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('investor1')}
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Investor 1 Demo
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('investor2')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Investor 2 (Conservative)
            </button>
            <span style={{ color: '#334155' }}>•</span>
            <button
              type="button"
              onClick={() => handleDemoLogin('investor3')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Investor 3 (Loss Harvest)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
