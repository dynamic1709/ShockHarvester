import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import api from '../../api'
import { formatINR, formatPct } from '../../utils/formatters'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  PieChart as PieIcon,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

const COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#8b5cf6', '#ec4899']

export const ClientHomePage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [indices, setIndices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/me/portfolio').then(r => r.data),
      api.get('/api/market/indices').then(r => r.data).catch(() => []),
    ])
      .then(([port, idxs]) => {
        setData(port)
        setIndices(idxs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
        <div style={{ height: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
        <div style={{ height: '180px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ height: '260px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px' }} />
          <div style={{ height: '260px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px' }} />
        </div>
      </div>
    )
  }

  const isDayPositive = (data.day_pnl || 0) >= 0
  const isTotalPositive = (data.total_pnl || 0) >= 0

  const donutData = (data.allocation || []).map((item: any) => ({
    name: item.asset_class,
    value: item.value,
    actualWeight: item.actual_weight_pct,
    targetWeight: item.target_weight_pct,
    drift: item.drift_pct,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* 1. Live Market Ticker Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        padding: '10px 18px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {indices.map((idx: any) => (
            <div key={idx.symbol} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>{idx.name}:</span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{formatINR(idx.current_price)}</span>
              <span style={{
                color: idx.is_positive ? '#10b981' : '#f43f5e',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '12px'
              }}>
                {idx.is_positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {formatPct(idx.change_pct)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '20px',
            padding: '4px 12px',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <span>SHOCK SHIELD ONLINE</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Portfolio Valuation Card */}
      <div style={{
        background: 'linear-gradient(135deg, #131d2e 0%, #0d1522 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Total Portfolio Net Worth
            </div>
            <div style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {formatINR(data.total_portfolio_value)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isDayPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: isDayPositive ? '#34d399' : '#fb7185',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
              }}>
                {isDayPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatINR(data.day_pnl)} ({formatPct(data.day_pnl_pct)}) Today</span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Strategy: <strong style={{ color: '#f1f5f9' }}>{data.model_name}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Invested Value</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>{formatINR(data.invested_amount)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Unrealized P&L</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: isTotalPositive ? '#10b981' : '#f43f5e', marginTop: '4px' }}>
                {formatINR(data.total_pnl)} ({formatPct(data.total_pnl_pct)})
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Available Cash</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{formatINR(data.cash_balance)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Dashboard Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        
        {/* Widget A: Asset Allocation & Target Drift */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Asset Allocation & Target Drift</h2>
            </div>
            <Link to="/app/portfolio" style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Details <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '160px', height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((item: any, idx: number) => (
                      <Cell key={`cell-${item.name}-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {donutData.map((item: any, idx: number) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[idx % COLORS.length] }} />
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>{item.actualWeight}%</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>(Target: {item.targetWeight}%)</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: Math.abs(item.drift) > 3 ? '#f59e0b' : '#10b981',
                      background: Math.abs(item.drift) > 3 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {item.drift > 0 ? `+${item.drift}%` : `${item.drift}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget B: Real-Time Protection Status Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#10b981" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>ShockHarvester Protection Shield</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Volatility Regime</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
                  {data.protection_status?.volatility_score || 'Normal'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Max Drawdown Limit</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {formatPct(data.max_drawdown * 100)}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Circuit Breaker Guard</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                  {data.protection_status?.circuit_status || 'Monitored'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Tax Harvest Engine</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', marginTop: '4px' }}>
                  STCG (20%) / LTCG (12.5%)
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/app/tax"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#10b981" />
              <span>Explore Harvestable Tax Lots & Capital Gains Alpha</span>
            </div>
            <ArrowUpRight size={16} color="#10b981" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientHomePage
