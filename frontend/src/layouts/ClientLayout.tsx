import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import ShockHarvesterLogo from '../components/ShockHarvesterLogo'
import {
  Home,
  Bookmark,
  PieChart,
  ReceiptText,
  Activity,
  User as UserIcon,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown
} from 'lucide-react'

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadNotifications] = useState(3)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/watchlist', label: 'Watchlist', icon: Bookmark },
    { to: '/app/portfolio', label: 'Portfolio', icon: PieChart },
    { to: '/app/tax', label: 'Tax Center', icon: ReceiptText },
    { to: '/app/activity', label: 'Activity', icon: Activity },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary, #0c1017)',
      color: 'var(--text-primary, #f1f5f9)',
      overflow: 'hidden',
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 21, 32, 0.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShockHarvesterLogo size={32} showText={true} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '20px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#34d399',
            fontWeight: 600,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>SHOCK SHIELD ACTIVE</span>
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

          {/* Notifications Bell */}
          <button
            onClick={() => navigate('/app/activity')}
            title="Notifications"
            style={{
              position: 'relative',
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
            <Bell size={17} />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#f43f5e',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
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
                background: 'linear-gradient(135deg, #10b981 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
              }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email?.split('@')[0] || 'Investor'}
              </span>
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
                  <div style={{ fontSize: '11px', color: '#10b981', textTransform: 'capitalize' }}>Role: {user?.role}</div>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/app/profile') }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left',
                  }}
                >
                  <UserIcon size={15} /> Profile & Settings
                </button>
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

      {/* Main Workspace with Sidebar & Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop Left Sidebar (hidden on mobile via CSS) */}
        <aside className="client-desktop-sidebar" style={{
          width: '220px',
          background: 'rgba(15, 21, 32, 0.6)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 10px',
          gap: '4px',
        }}>
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
                  background: isActive ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
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
          paddingBottom: '80px', // padding for mobile bottom bar
          background: 'radial-gradient(ellipse at top, #111726 0%, #0a0d14 100%)',
        }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (visible on mobile <= 768px) */}
      <nav className="client-mobile-bottom-tabs" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(15, 21, 32, 0.96)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'none', // shown via media query in index.css
        gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'center',
        zIndex: 50,
      }}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '100%',
                textDecoration: 'none',
                color: isActive ? '#10b981' : '#64748b',
                fontSize: '11px',
                fontWeight: 600,
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default ClientLayout
