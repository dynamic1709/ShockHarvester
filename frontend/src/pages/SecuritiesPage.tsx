/**
 * Securities page — list and manage monitored securities.
 */
import { useEffect, useState } from 'react'
import api from '../api'

interface Security {
  id: string
  symbol: string
  name: string
  asset_class: string
  sector: string | null
  circuit_band_pct: number
  lot_size: number
  is_halted: boolean
  is_index: boolean
}

function AssetBadge({ ac }: { ac: string }) {
  const map: Record<string, string> = {
    equity: 'badge-blue', equity_etf: 'badge-green', gold: 'badge-amber', debt: 'badge-gray',
  }
  return <span className={`badge ${map[ac] ?? 'badge-gray'}`}>{ac}</span>
}

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<Security[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = () => {
    api.get('/api/securities').then(({ data }) => setSecurities(data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const toggleHalt = async (sec: Security) => {
    await api.put(`/api/securities/${sec.id}/halt?halted=${!sec.is_halted}`)
    load()
  }

  const filtered = securities.filter(s =>
    s.symbol.toLowerCase().includes(filter.toLowerCase()) ||
    s.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Securities</div>
          <div className="page-subtitle">{securities.length} instruments monitored</div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-title">Universe</div>
          <input
            id="securities-filter"
            className="form-input"
            style={{ width: 240 }}
            placeholder="Filter by symbol or name…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /> Loading…</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Asset Class</th>
                  <th>Sector</th>
                  <th>Circuit Band</th>
                  <th>Lot Size</th>
                  <th>Index?</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                      No securities found.
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr key={s.id}>
                    <td className="font-bold text-accent">{s.symbol}</td>
                    <td>{s.name}</td>
                    <td><AssetBadge ac={s.asset_class} /></td>
                    <td className="text-muted">{s.sector ?? '—'}</td>
                    <td className="mono text-danger">±{(s.circuit_band_pct * 100).toFixed(0)}%</td>
                    <td>{s.lot_size}</td>
                    <td>{s.is_index ? '✓' : '—'}</td>
                    <td>
                      <span className={`badge ${s.is_halted ? 'badge-red' : 'badge-green'}`}>
                        {s.is_halted ? 'halted' : 'active'}
                      </span>
                    </td>
                    <td>
                      <button
                        id={`halt-btn-${s.symbol}`}
                        className={`btn btn-sm ${s.is_halted ? 'btn-outline' : 'btn-danger'}`}
                        onClick={() => toggleHalt(s)}
                      >
                        {s.is_halted ? '▶ Resume' : '⏸ Halt'}
                      </button>
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
