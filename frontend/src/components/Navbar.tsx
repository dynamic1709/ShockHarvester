import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Search, 
  Bell, 
  ChevronDown, 
  Sliders, 
  Zap, 
  LogOut, 
  Activity,
  User
} from 'lucide-react'

interface NavbarProps {
  niftyPrice?: number
  niftyChange?: number
  sensexPrice?: number
  sensexChange?: number
}

export default function Navbar({
  niftyPrice = 22778.45,
  niftyChange = 62.25,
  sensexPrice = 72959.64,
  sensexChange = 430.57,
}: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [toolsDropdown, setToolsDropdown] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const niftyPct = ((niftyChange / (niftyPrice - niftyChange)) * 100).toFixed(2)
  const sensexPct = ((sensexChange / (sensexPrice - sensexChange)) * 100).toFixed(2)

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Brand Logo - Stylized Angel One Triangle */}
        <NavLink to="/markets" className="brand-logo-wrap">
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4L4 34H36L20 4Z" fill="url(#logo_grad)" />
            <path d="M20 14L10 32H30L20 14Z" fill="#12151c" />
            <path d="M20 22L15 31H25L20 22Z" fill="#387ed1" />
            <defs>
              <linearGradient id="logo_grad" x1="4" y1="4" x2="36" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.5" stopColor="#cbd5e1" />
                <stop offset="1" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5, color: '#ffffff' }}>
            Shock<span style={{ color: '#387ed1' }}>Harvester</span>
          </span>
        </NavLink>

        {/* Live Index Tickers */}
        <div className="index-ticker-pill" onClick={() => navigate('/tradeone')}>
          <div className="index-item">
            <span className="index-name">NIFTY</span>
            <span className="index-val">{niftyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`index-change ${niftyChange >= 0 ? 'positive' : 'negative'}`}>
              ▲ +{niftyChange.toFixed(2)} (+{niftyPct}%)
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

          <div className="index-item">
            <span className="index-name">SENSEX</span>
            <span className="index-val">{sensexPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`index-change ${sensexChange >= 0 ? 'positive' : 'negative'}`}>
              ▲ +{sensexChange.toFixed(2)} (+{sensexPct}%)
            </span>
          </div>

          <ChevronDown size={14} color="var(--text-muted)" />
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="topbar-search">
        <div className="search-input-wrapper">
          <Search size={14} color="var(--text-muted)" />
          <input type="text" placeholder="Search for Anything [Ctrl + S]" />
          <span className="search-shortcut">Ctrl + S</span>
        </div>
      </div>

      {/* Right Navigation */}
      <div className="topbar-right">
        <nav className="topbar-nav">
          <NavLink to="/markets" className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`} title="Home & Markets">
            <Home size={15} />
            <span>Markets</span>
          </NavLink>

          <NavLink to="/tradeone" className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}>
            <span>TradeOne</span>
          </NavLink>

          <NavLink to="/portfolio" className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}>
            <span>Portfolio</span>
          </NavLink>

          <NavLink to="/orders" className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}>
            <span>Orders</span>
          </NavLink>

          <NavLink to="/positions" className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}>
            <span>Positions</span>
          </NavLink>

          {/* Tools Menu */}
          <div style={{ position: 'relative' }}>
            <button 
              className={`nav-link-btn ${toolsDropdown ? 'active' : ''}`} 
              onClick={() => setToolsDropdown(!toolsDropdown)}
            >
              <span>Tools</span>
              <ChevronDown size={12} />
            </button>

            {toolsDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 220,
                  background: '#161b24',
                  border: '1px solid #273142',
                  borderRadius: 8,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  padding: 6,
                  zIndex: 200,
                }}
                onMouseLeave={() => setToolsDropdown(false)}
              >
                <div 
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 4 }}
                  className="dropdown-item"
                  onClick={() => { setToolsDropdown(false); navigate('/shock-harvester') }}
                >
                  <Zap size={15} color="#387ed1" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>Shock Harvester Engine</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Automated loss harvesting</div>
                  </div>
                </div>

                <div 
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 4 }}
                  className="dropdown-item"
                  onClick={() => { setToolsDropdown(false); navigate('/tax') }}
                >
                  <Sliders size={15} color="#00d09c" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>Tax & Cooling-Off</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Wash-sale rules & tax gain/loss</div>
                  </div>
                </div>

                <div 
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 4 }}
                  className="dropdown-item"
                  onClick={() => { setToolsDropdown(false); navigate('/clients') }}
                >
                  <User size={15} color="#a78bfa" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>Client Manager</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Portfolio allocations</div>
                  </div>
                </div>

                <div 
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 4 }}
                  className="dropdown-item"
                  onClick={() => { setToolsDropdown(false); navigate('/securities') }}
                >
                  <Activity size={15} color="#f59e0b" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>Securities & Proxy Map</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Asset thresholds & correlation</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Notifications */}
        <button className="watchlist-icon-btn" title="Notifications">
          <Bell size={16} />
        </button>

        {/* User Profile Avatar */}
        <div style={{ position: 'relative' }}>
          <div 
            className="avatar-badge" 
            onClick={() => setUserDropdown(!userDropdown)}
            title={user?.email || 'User Profile'}
          >
            {user?.email ? user.email.substring(0, 2).toUpperCase() : 'BD'}
          </div>

          {userDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 200,
                background: '#161b24',
                border: '1px solid #273142',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: 8,
                zIndex: 200,
              }}
              onMouseLeave={() => setUserDropdown(false)}
            >
              <div style={{ padding: '6px 8px', borderBottom: '1px solid #252d3d', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#ffffff' }}>{user?.email || 'trader@angelone.in'}</div>
                <div style={{ fontSize: 10, color: '#387ed1', marginTop: 2 }}>Role: {user?.role || 'Fund Manager'}</div>
              </div>
              <button 
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '6px 8px', 
                  color: '#eb5b5b', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  borderRadius: 4 
                }}
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
