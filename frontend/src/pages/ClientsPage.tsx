/**
 * Clients page — list, view, and manage client portfolios.
 */
import { useEffect, useState } from 'react'
import api from '../api'

interface Client {
  id: string
  name: string
  email: string
  risk_profile: string
  cash_balance: number
}

interface TaxLot {
  id: string
  security_id: string
  buy_date: string
  buy_price: number
  original_qty: number
  remaining_qty: number
  is_active: boolean
}

interface RealizedGain {
  fy: number
  stcg: number
  ltcg: number
  st_loss: number
  lt_loss: number
}

function riskBadge(rp: string) {
  const cls = rp === 'aggressive' ? 'badge-red' : rp === 'balanced' ? 'badge-blue' : 'badge-green'
  return <span className={`badge ${cls}`}>{rp}</span>
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [lots, setLots] = useState<TaxLot[]>([])
  const [gains, setGains] = useState<RealizedGain[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api.get('/api/clients').then(({ data }) => setClients(data)).finally(() => setLoading(false))
  }, [])

  const selectClient = async (c: Client) => {
    setSelected(c)
    setDetailLoading(true)
    try {
      const [lotsRes, gainsRes] = await Promise.all([
        api.get(`/api/tax/lots?client_id=${c.id}&active_only=false`),
        api.get(`/api/tax/gains?client_id=${c.id}`),
      ])
      setLots(lotsRes.data)
      setGains(gainsRes.data)
    } finally {
      setDetailLoading(false)
    }
  }

  const totalLossHarvested = gains.reduce((s, g) => s + g.st_loss + g.lt_loss, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-subtitle">{clients.length} managed accounts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        {/* Client List */}
        <div className="card card-sm" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
            Client Accounts
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            clients.map(c => (
              <div
                key={c.id}
                id={`client-row-${c.id}`}
                onClick={() => selectClient(c)}
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selected?.id === c.id ? 'var(--accent-dim)' : 'transparent',
                  transition: 'background 0.12s ease',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{c.email}</span>
                  {riskBadge(c.risk_profile)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Cash: ₹{c.cash_balance.toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {!selected ? (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-muted)' }}>
              ← Select a client to view their portfolio
            </div>
          ) : detailLoading ? (
            <div className="card loading-center" style={{ minHeight: 300 }}>
              <div className="spinner" /> Loading…
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="card mb-4">
                <div className="section-header">
                  <div className="section-title">{selected.name}</div>
                  {riskBadge(selected.risk_profile)}
                </div>
                <div className="stats-grid" style={{ marginBottom: 0 }}>
                  <div className="stat-card" style={{ padding: '14px 18px' }}>
                    <div className="stat-label">Cash Balance</div>
                    <div className="stat-value" style={{ fontSize: 20 }}>₹{selected.cash_balance.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px 18px' }}>
                    <div className="stat-label">Active Lots</div>
                    <div className="stat-value blue" style={{ fontSize: 20 }}>{lots.filter(l => l.is_active).length}</div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px 18px' }}>
                    <div className="stat-label">Total Harvested</div>
                    <div className="stat-value green" style={{ fontSize: 20 }}>₹{totalLossHarvested.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Tax Lots */}
              <div className="card mb-4">
                <div className="section-header">
                  <div className="section-title">Tax Lots <span>{lots.length} lots</span></div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Buy Date</th>
                        <th>Buy Price</th>
                        <th>Original Qty</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No tax lots</td></tr>
                      ) : lots.map(l => (
                        <tr key={l.id}>
                          <td className="mono">{l.buy_date}</td>
                          <td className="mono">₹{Number(l.buy_price).toLocaleString('en-IN')}</td>
                          <td>{l.original_qty}</td>
                          <td className="font-bold">{l.remaining_qty}</td>
                          <td>
                            <span className={`badge ${l.is_active ? 'badge-green' : 'badge-gray'}`}>
                              {l.is_active ? 'active' : 'closed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Realized Gains */}
              <div className="card">
                <div className="section-header">
                  <div className="section-title">Realized Gains / Losses by FY</div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>FY</th>
                        <th>STCG</th>
                        <th>LTCG</th>
                        <th>ST Loss</th>
                        <th>LT Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gains.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No realized gains/losses yet</td></tr>
                      ) : gains.map(g => (
                        <tr key={g.fy}>
                          <td className="font-bold">FY{g.fy}-{String(g.fy + 1).slice(2)}</td>
                          <td className={g.stcg > 0 ? 'text-danger' : ''}>{g.stcg > 0 ? `₹${g.stcg.toLocaleString('en-IN')}` : '—'}</td>
                          <td className={g.ltcg > 0 ? 'text-danger' : ''}>{g.ltcg > 0 ? `₹${g.ltcg.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="text-success">{g.st_loss > 0 ? `₹${g.st_loss.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="text-success">{g.lt_loss > 0 ? `₹${g.lt_loss.toLocaleString('en-IN')}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
