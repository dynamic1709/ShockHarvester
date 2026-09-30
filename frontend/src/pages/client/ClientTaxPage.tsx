import React, { useEffect, useState } from 'react'
import api from '../../api'
import { formatINR, formatPct, formatDate } from '../../utils/formatters'
import {
  Sparkles,
  Clock
} from 'lucide-react'

export const ClientTaxPage: React.FC = () => {
  const [taxSummary, setTaxSummary] = useState<any>(null)
  const [lots, setLots] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'harvestable' | 'stcg' | 'ltcg'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/me/tax-summary').then(r => r.data),
      api.get('/api/me/lots').then(r => r.data),
    ])
      .then(([tax, lts]) => {
        setTaxSummary(tax)
        setLots(lts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !taxSummary) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>Loading Tax Center...</div>
  }

  const filteredLots = lots.filter(lot => {
    if (filter === 'harvestable') return lot.is_harvestable
    if (filter === 'stcg') return !lot.is_long_term
    if (filter === 'ltcg') return lot.is_long_term
    return true
  })

  const harvestableCount = lots.filter(l => l.is_harvestable).length
  const exemptionPct = Math.min(100, (taxSummary.exemption_utilized / taxSummary.ltcg_annual_exemption) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
              Tax-Loss Harvesting Center (FY 2024–25)
            </h1>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
              JULY 2024 BUDGET RULES
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
            STCG 20% • LTCG 12.5% • ₹1,25,000 Annual Exemption • Automated FIFO Matching
          </p>
        </div>

        <button
          onClick={async () => {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/me/report/latest.pdf', {
              headers: { Authorization: `Bearer ${token}` },
            })
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'ShockHarvester_Tax_Statement_FY24-25.pdf'
            a.click()
          }}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
          }}
        >
          <Sparkles size={15} /> Download PDF Harvest Statement
        </button>
      </div>

      {/* Tax KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Estimated Tax Liability */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Estimated FY Tax Liability</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f43f5e', marginTop: '6px' }}>
            {formatINR(taxSummary.estimated_tax_liability)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            STCG Tax: {formatINR(taxSummary.net_taxable_stcg * 0.2)} • LTCG Tax: {formatINR(taxSummary.net_taxable_ltcg * 0.125)}
          </div>
        </div>

        {/* Card 2: ₹1.25L Exemption Meter */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>LTCG Exemption (₹1.25L)</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{exemptionPct.toFixed(0)}% Used</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {formatINR(taxSummary.exemption_utilized)}
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', margin: '10px 0' }}>
            <div style={{ height: '100%', width: `${exemptionPct}%`, background: '#38bdf8', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Remaining Tax-Free Cap: <strong style={{ color: '#34d399' }}>{formatINR(taxSummary.exemption_remaining)}</strong>
          </div>
        </div>

        {/* Card 3: Unrealized Harvestable Loss Alpha */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#10b981" />
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
              Potential Harvest Alpha
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
            {formatINR(taxSummary.unrealized_harvestable_losses?.potential_tax_savings)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
            From <strong>{harvestableCount} loss lots</strong> (Total Loss: {formatINR(taxSummary.unrealized_harvestable_losses?.total)})
          </div>
        </div>
      </div>

      {/* 30-Day Cooling-Off Card */}
      {taxSummary.cooling_off_list?.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '18px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={16} color="#f59e0b" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>
              Active 30-Day Cooling-Off Prudential Buffer
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {taxSummary.cooling_off_list.map((c: any) => (
              <div key={c.symbol} style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                <strong style={{ color: '#ffffff' }}>{c.symbol}</strong> • Unblocks on {formatDate(c.unblock_date)} ({c.days_remaining}d left)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Lots Filter Bar & Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Individual FIFO Tax Lots ({filteredLots.length} Lots)
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Identifies lots eligible for tax alpha switch into correlated substitutes.
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Lots' },
              { id: 'harvestable', label: `Harvestable Losses (${harvestableCount})` },
              { id: 'stcg', label: 'Short Term (≤365d)' },
              { id: 'ltcg', label: 'Long Term (>365d)' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: filter === f.id ? '#10b981' : 'rgba(255,255,255,0.08)',
                  background: filter === f.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(10, 14, 23, 0.6)',
                  color: filter === f.id ? '#34d399' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(10, 14, 23, 0.9)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Instrument</th>
                <th style={{ padding: '12px 14px' }}>Buy Date</th>
                <th style={{ padding: '12px 14px' }}>Age (Days)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Buy Price</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Current Price</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quantity</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Unrealized P&L</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tax Category</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Harvest Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((lot) => {
                const isPos = lot.gain_loss >= 0
                return (
                  <tr key={lot.lot_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#ffffff' }}>{lot.symbol}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{lot.name}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                      {formatDate(lot.buy_date)}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                      {lot.holding_days} d
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ffffff' }}>
                      {formatINR(lot.buy_price)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {formatINR(lot.current_price)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {lot.quantity}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: isPos ? '#10b981' : '#f43f5e' }}>
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
      </div>
    </div>
  )
}

export default ClientTaxPage
