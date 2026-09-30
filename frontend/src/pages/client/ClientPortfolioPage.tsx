import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { formatINR, formatPct } from '../../utils/formatters'
import {
  Search,
  ChevronRight
} from 'lucide-react'

export const ClientPortfolioPage: React.FC = () => {
  const [tab, setTab] = useState<'holdings' | 'allocation'>('holdings')
  const [portfolio, setPortfolio] = useState<any>(null)
  const [holdings, setHoldings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/me/portfolio').then(r => r.data),
      api.get('/api/me/holdings').then(r => r.data),
    ])
      .then(([p, h]) => {
        setPortfolio(p)
        setHoldings(h)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !portfolio) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8' }}>
        Loading portfolio & holdings...
      </div>
    )
  }

  const filteredHoldings = holdings.filter(h =>
    h.symbol.toLowerCase().includes(search.toLowerCase()) ||
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.sector?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            Portfolio Holdings & Target Allocation
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Aggregated assets under model <strong>{portfolio.model_name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setTab('holdings')}
            style={{
              padding: '6px 18px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: tab === 'holdings' ? '#10b981' : 'transparent',
              color: tab === 'holdings' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setTab('allocation')}
            style={{
              padding: '6px 18px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: tab === 'allocation' ? '#10b981' : 'transparent',
              color: tab === 'allocation' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Allocation & Drift
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Portfolio Net Worth</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {formatINR(portfolio.total_portfolio_value)}
          </div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Invested Capital</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
            {formatINR(portfolio.invested_amount)}
          </div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Unrealized P&L</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: portfolio.total_pnl >= 0 ? '#10b981' : '#f43f5e', marginTop: '4px' }}>
            {formatINR(portfolio.total_pnl)} ({formatPct(portfolio.total_pnl_pct)})
          </div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Liquid Cash Balance</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {formatINR(portfolio.cash_balance)}
          </div>
        </div>
      </div>

      {tab === 'holdings' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search holdings..."
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 14px 10px 40px',
                color: '#ffffff',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Holdings Table */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(10, 14, 23, 0.9)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 16px' }}>Instrument</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Avg Buy Price</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>LTP</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Invested Value</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Current Value</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total P&L</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Day Change</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHoldings.map((h) => {
                    const isPos = h.pnl >= 0
                    const isDayPos = h.day_change_pct >= 0

                    return (
                      <tr
                        key={h.symbol}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <Link to={`/app/stocks/${h.symbol}`} style={{ textDecoration: 'none' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{h.symbol}</span>
                              <ChevronRight size={14} color="#64748b" />
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{h.name} • {h.lots_count} lots</div>
                          </Link>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                          {h.quantity}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#cbd5e1' }}>
                          {formatINR(h.avg_buy_price)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                          {formatINR(h.ltp)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94a3b8' }}>
                          {formatINR(h.invested_value)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                          {formatINR(h.current_value)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: isPos ? '#10b981' : '#f43f5e' }}>
                            {formatINR(h.pnl)} ({formatPct(h.pnl_pct)})
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 600, color: isDayPos ? '#10b981' : '#f43f5e' }}>
                            {formatPct(h.day_change_pct)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            {h.weight_pct}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Allocation Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {portfolio.allocation?.map((item: any) => (
            <div
              key={item.asset_class}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>{item.asset_class} Allocation</h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: Math.abs(item.drift_pct) > 3 ? '#f59e0b' : '#10b981',
                  background: Math.abs(item.drift_pct) > 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}>
                  {item.drift_pct > 0 ? `+${item.drift_pct}% Drift` : `${item.drift_pct}% Drift`}
                </span>
              </div>

              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                {formatINR(item.value)}
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', margin: '14px 0' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, item.actual_weight_pct)}%`,
                  background: item.asset_class === 'Equity' ? '#10b981' : (item.asset_class === 'Debt' ? '#38bdf8' : '#f59e0b'),
                  borderRadius: '4px',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>Actual: <strong style={{ color: '#f8fafc' }}>{item.actual_weight_pct}%</strong></span>
                <span>Target: <strong style={{ color: '#f8fafc' }}>{item.target_weight_pct}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientPortfolioPage
