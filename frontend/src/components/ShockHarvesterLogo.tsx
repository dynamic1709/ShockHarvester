import React from 'react'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export const ShockHarvesterLogo: React.FC<LogoProps> = ({
  size = 32,
  showText = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ minWidth: size }}
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shield background */}
        <path
          d="M20 3L6 8.5V19.2C6 28.1 12 36.3 20 39C28 36.3 34 28.1 34 19.2V8.5L20 3Z"
          fill="url(#shieldGrad)"
          fillOpacity="0.18"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Shock surge line + arrowhead */}
        <path
          d="M10 24L16 21L19 26L25 14L30 18"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* Harvest Node dot */}
        <circle cx="25" cy="14" r="2.5" fill="#34d399" />
        <circle cx="30" cy="18" r="2" fill="#38bdf8" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: size * 0.52,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            SHOCK<span style={{ color: '#10b981', WebkitTextFillColor: '#10b981' }}>HARVESTER</span>
          </span>
          <span style={{
            fontSize: Math.max(9, size * 0.26),
            fontWeight: 600,
            color: '#64748b',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            Tax-Loss & Volatility Shield
          </span>
        </div>
      )}
    </div>
  )
}

export default ShockHarvesterLogo
