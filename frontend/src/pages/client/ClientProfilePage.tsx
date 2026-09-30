import React, { useEffect, useState } from 'react'
import api from '../../api'
import { formatPct } from '../../utils/formatters'
import {
  Shield
} from 'lucide-react'

export const ClientProfilePage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/me/portfolio')
      .then(r => setPortfolio(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !portfolio) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>Loading profile...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
          Investor Profile & Risk Configuration
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Account settings, risk parameters, and automated quant guardrails.
        </p>
      </div>

      {/* Account Info Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
            color: '#ffffff',
          }}>
            {portfolio.name?.[0] || 'I'}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{portfolio.name}</h2>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{portfolio.email}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Account Role</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>Retail Investor</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Client ID</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px', wordBreak: 'break-all' }}>{portfolio.client_id}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Target Model Strategy</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{portfolio.model_name}</div>
          </div>
        </div>
      </div>

      {/* Risk Parameters Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={18} color="#10b981" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Active Risk Parameters & Guardrails
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Risk Profile Classification</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '4px', textTransform: 'capitalize' }}>
              {portfolio.risk_profile}
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Dynamic volatility tolerance tuned for target Sharpe optimization.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Maximum Annual Volatility Limit</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
              {formatPct(portfolio.max_volatility * 100)}
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Hard constraint enforced during defensive quadratic rebalances.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Maximum Portfolio Drawdown Limit</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f43f5e', marginTop: '4px' }}>
              {formatPct(portfolio.max_drawdown * 100)}
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Triggers mandatory circuit hedge when drawdown exceeds threshold.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tax Jurisdiction & Law</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
              India (IT Act FY 2024–25)
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              STCG 20%, LTCG 12.5%, ₹1.25L exemption, 30-day cooling off.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProfilePage
