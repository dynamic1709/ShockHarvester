import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import ShockHarvesterLogo from '../components/ShockHarvesterLogo'
import {
  LayoutDashboard,
  Users,
  Repeat,
  History,
  ShieldAlert,
  Sliders,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react'

export const AdvisorLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  // Authorization check: If client role opens /advisor -> redirect to /app
  if (user && user.role !== 'advisor') {
    return <Navigate to="/app" replace />
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/advisor', label: 'Command Center', icon: LayoutDashboard, end: true },
    { to: '/advisor/clients', label: 'Clients Directory', icon: Users },
    { to: '/advisor/runs', label: 'Rebalance Runs', icon: Repeat },
    { to: '/advisor/backtest', label: 'Backtest Studio', icon: History },
    { to: '/advisor/guardrails', label: 'Guardrails & Halts', icon: ShieldAlert },
    { to: '/advisor/tax-rules', label: 'Tax Rules Config', icon: Sliders },
    { to: '/advisor/settings', label: 'Console Settings', icon: Settings },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary, #090d14)',
      color: 'var(--text-primary, #f1f5f9)',
      overflow: 'hidden',
    }}>
      {/* Top Header */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(12, 17, 26, 0.96)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShockHarvesterLogo size={32} showText={true} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            color: '#fbbf24',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}>
            <Sparkles size={12} />
            <span>ADVISOR CONSOLE</span>
          </div>
        </div>

        {/* Live Market Bar Snippet */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          fontSize: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '6px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div>
            <span style={{ color: '#64748b', marginRight: '6px' }}>NIFTY 50:</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>24,850.40 (+0.42%)</span>
          </div>
          <div style={{ color: '#334155' }}>|</div>
          <div>
            <span style={{ color: '#64748b', marginRight: '6px' }}>BANK NIFTY:</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>52,340.10 (+0.68%)</span>
          </div>
          <div style={{ color: '#334155' }}>|</div>
          <div>
            <span style={{ color: '#64748b', marginRight: '6px' }}>INDIA VIX:</span>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>13.85 (Low)</span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#38bdf8" />}
          </button>

          {/* Advisor Avatar & Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '4px 12px 4px 6px',
                cursor: 'pointer',
                color: '#f1f5f9',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
              }}>
                A
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Lead Advisor</span>
              <ChevronDown size={14} color="#94a3b8" />
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '200px',
                background: '#121824',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '6px',
                zIndex: 100,
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{user?.email}</div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>Administrator</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fb7185',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <aside style={{
          width: '240px',
          background: 'rgba(12, 17, 26, 0.7)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 12px',
          gap: '4px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 8px 12px' }}>
            Operations & Control
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.02) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </aside>

        {/* Dynamic Viewport */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'radial-gradient(ellipse at top, #0f172a 0%, #080c14 100%)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdvisorLayout
