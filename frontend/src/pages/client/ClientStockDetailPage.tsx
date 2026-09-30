import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import api from '../../api'
import { formatINR, formatPct, formatDate } from '../../utils/formatters'
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ShieldCheck,
  Repeat
} from 'lucide-react'

export const ClientStockDetailPage: React.FC = () => {
  const { symbol = 'RELIANCE' } = useParams()
  const [detail, setDetail] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [lots, setLots] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y' | '3Y'>('1M')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStockData()
  }, [symbol, timeRange])

  const fetchStockData = async () => {
    try {
      const [detailRes, histRes, lotsRes] = await Promise.all([
        api.get(`/api/market/securities/${symbol}`),
        api.get(`/api/market/securities/${symbol}/history?range=${timeRange}`),
        api.get(`/api/me/lots?symbol=${symbol}`).catch(() => ({ data: [] })),
      ])
      setDetail(detailRes.data)
      setHistory(histRes.data.candles || [])
      setLots(lotsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !detail) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8' }}>
        Loading stock details for {symbol}...
      </div>
    )
  }

  const isPos = detail.change >= 0
  const totalHoldingQty = lots.reduce((acc, l) => acc + l.quantity, 0)
  const totalInvested = lots.reduce((acc, l) => acc + l.invested_val, 0)
  const totalHoldingVal = totalHoldingQty * detail.ltp
  const totalPnl = totalHoldingVal - totalInvested
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          to="/app/watchlist"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Watchlist
        </Link>

        {/* Order Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Buy {detail.symbol}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Sell {detail.symbol}
          </button>
        </div>
      </div>

      {/* Header Profile Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{detail.symbol}</h1>
            <span style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
              {detail.sector || detail.asset_class}
            </span>
            {detail.is_circuit_locked && (
              <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                CIRCUIT LOCKED
              </span>
            )}
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>{detail.name}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff' }}>
            {formatINR(detail.ltp)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontWeight: 700,
              fontSize: '13px',
              color: isPos ? '#10b981' : '#f43f5e',
            }}>
              {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPos ? `+${formatINR(detail.change)}` : formatINR(detail.change)} ({formatPct(detail.change_pct)})
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Today</span>
          </div>
        </div>
      </div>

      {/* Chart & Key Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left: Interactive Price Chart */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Historical Performance ({timeRange})
            </div>

            {/* Timeframe selector */}
            <div style={{ display: 'flex', background: 'rgba(10, 14, 23, 0.8)', borderRadius: '8px', padding: '3px' }}>
              {(['1D', '1W', '1M', '1Y', '3Y'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeRange(tf)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    background: timeRange === tf ? '#38bdf8' : 'transparent',
                    color: timeRange === tf ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPos ? '#10b981' : '#38bdf8'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPos ? '#10b981' : '#38bdf8'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: any) => formatINR(v)} labelStyle={{ color: '#0f172a' }} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isPos ? '#10b981' : '#38bdf8'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClose)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Key Stats & Substitutes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stats Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px' }}>
              Market Parameters
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>52-Week Range</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                  {formatINR(detail.low_52w)} - {formatINR(detail.high_52w)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Circuit Band</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>±{(detail.circuit_band_pct * 100).toFixed(0)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Lower Circuit Limit</span>
                <span style={{ fontWeight: 600, color: '#f43f5e' }}>{formatINR(detail.lower_circuit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Upper Circuit Limit</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{formatINR(detail.upper_circuit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Market Lot Size</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{detail.lot_size} Unit</span>
              </div>
            </div>
          </div>

          {/* Substitute Recommendation */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Repeat size={16} color="#38bdf8" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                Tax-Loss Harvesting Substitute
              </h3>
            </div>
            {detail.substitutes?.length > 0 ? (
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                  In case of tax-loss harvesting sell, the engine automatically switches exposure into:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {detail.substitutes.map((sub: any) => (
                    <Link
                      key={sub.symbol}
                      to={`/app/stocks/${sub.symbol}`}
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {sub.symbol} ({sub.name})
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#64748b' }}>No correlated substitute required for index ETF.</p>
            )}
          </div>
        </div>
      </div>

      {/* Your Holdings & Individual FIFO Tax Lots */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Your Holdings & FIFO Tax Lots ({lots.length} Lots)
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Strict FIFO lot accounting under Indian IT Act rules.
            </p>
          </div>

          {totalHoldingQty > 0 && (
            <div style={{ display: 'flex', gap: '16px', background: 'rgba(10, 14, 23, 0.8)', padding: '8px 16px', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Qty: </span>
                <strong style={{ color: '#ffffff' }}>{totalHoldingQty}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Invested: </span>
                <strong style={{ color: '#ffffff' }}>{formatINR(totalInvested)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Current Val: </span>
                <strong style={{ color: '#ffffff' }}>{formatINR(totalHoldingVal)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total P&L: </span>
                <strong style={{ color: totalPnl >= 0 ? '#10b981' : '#f43f5e' }}>
                  {formatINR(totalPnl)} ({formatPct(totalPnlPct)})
                </strong>
              </div>
            </div>
          )}
        </div>

        {lots.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            You do not currently hold any tax lots in {detail.symbol}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(10, 14, 23, 0.9)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Buy Date</th>
                  <th style={{ padding: '12px 14px' }}>Holding Period</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Buy Price</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Invested</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Current Value</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>P&L (₹)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tax Category</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Harvest Status</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => {
                  const isLotPos = lot.gain_loss >= 0
                  return (
                    <tr key={lot.lot_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f8fafc' }}>
                        {formatDate(lot.buy_date)}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                        {lot.holding_days} Days
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ffffff' }}>
                        {formatINR(lot.buy_price)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ffffff', fontWeight: 600 }}>
                        {lot.quantity}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                        {formatINR(lot.invested_val)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ffffff', fontWeight: 600 }}>
                        {formatINR(lot.current_val)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: isLotPos ? '#10b981' : '#f43f5e' }}>
                          {formatINR(lot.gain_loss)} ({formatPct(lot.gain_loss_pct)})
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: lot.is_long_term ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: lot.is_long_term ? '#38bdf8' : '#fbbf24',
                        }}>
                          {lot.tax_type} ({lot.is_long_term ? '12.5%' : '20%'})
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {lot.is_harvestable ? (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: '#fb7185',
                          }}>
                            HARVESTABLE LOSS
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Managed by ShockHarvester Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}>
          <div style={{
            background: '#121824',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShieldCheck size={28} color="#10b981" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Managed by ShockHarvester
              </h2>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              Your portfolio is automated by the <strong>ShockHarvester Quant Shield Engine</strong>.
              All trades, tax-loss harvesting switches, and volatility hedges are calculated dynamically
              using mean-variance quadratic optimization and executed automatically during market shocks.
            </p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#34d399',
              marginBottom: '24px',
            }}>
              ✓ Automated Tax-Loss Harvesting (STCG 20% / LTCG 12.5%)<br />
              ✓ Strict 30-Day Cooling-Off Enforcement<br />
              ✓ Automatic Circuit Guard & Substitute Replacements
            </div>

            <button
              onClick={() => setModalOpen(false)}
              style={{
                width: '100%',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Got It, Continue Monitoring
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientStockDetailPage
