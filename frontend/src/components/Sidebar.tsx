/**
 * Sidebar navigation component
 */
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/shock-events', label: 'Shock Events', icon: '⚡', exact: false },
  { to: '/clients', label: 'Clients', icon: '👥', exact: false },
  { to: '/securities', label: 'Securities', icon: '📈', exact: false },
  { to: '/tax', label: 'Tax & Cooling-Off', icon: '📋', exact: false },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <span className="logo-text">ShockHarvester</span>
      </div>

      {NAV.map(({ to, label, icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span style={{ fontSize: 16 }}>{icon}</span>
          {label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div style={{ padding: '8px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Signed in as</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2, wordBreak: 'break-all' }}>
            {user?.email}
          </div>
          <div style={{ marginTop: 2 }}>
            <span className="badge badge-blue" style={{ fontSize: 10 }}>{user?.role}</span>
          </div>
        </div>
        <button id="logout-btn" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  )
}
