import React, { useEffect, useState } from 'react'
import api from '../../api'
import { formatINR, formatDate } from '../../utils/formatters'
import {
  Bot,
  ShieldCheck
} from 'lucide-react'

export const ClientActivityPage: React.FC = () => {
  const [activity, setActivity] = useState<any>({ trades: [], commentaries: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/me/activity')
      .then(r => setActivity(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>Loading activity logs...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
          Activity, Execution Logs & Commentary
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Audit trail of automated defensive rebalancing and AI rationale notes.
        </p>
      </div>

      {/* AI Commentary Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Bot size={20} color="#10b981" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            AI Portfolio Commentary & Rationale
          </h2>
        </div>

        {activity.commentaries.length === 0 ? (
          <div style={{ background: 'rgba(10, 14, 23, 0.6)', padding: '16px 20px', borderRadius: '12px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
            <p>
              Your portfolio is currently aligned with your target asset allocation. The <strong>ShockHarvester Quant Engine</strong> is actively monitoring volatility and circuit limit telemetry. During market downturns, the engine will automatically switch underwater tax lots into correlated substitute assets to capture tax alpha while protecting your downside risk.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
              <ShieldCheck size={14} /> Shield Active • Next automated check in 1s
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activity.commentaries.map((c: any) => (
              <div key={c.id} style={{ background: 'rgba(10, 14, 23, 0.6)', padding: '16px', borderRadius: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#64748b' }}>
                  <span>Source: {c.source?.toUpperCase() || 'AI ENGINE'}</span>
                  <span>{formatDate(c.created_at)}</span>
                </div>
                <p style={{ lineHeight: 1.6 }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trades Execution Log Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
          Rebalance Trade Executions
        </h2>

        {activity.trades.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            No recent rebalance trades executed yet. Defensive orders trigger automatically upon shock detection.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(10, 14, 23, 0.9)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Instrument</th>
                  <th style={{ padding: '12px 14px' }}>Side</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Execution Price</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Value</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activity.trades.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ffffff' }}>
                      {t.symbol}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: t.side === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: t.side === 'BUY' ? '#10b981' : '#f43f5e',
                      }}>
                        {t.side}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ffffff' }}>
                      {t.quantity}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                      {formatINR(t.price)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {formatINR(t.total_val)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientActivityPage
